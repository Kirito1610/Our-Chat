import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { conversationMembers, users } from "../db/schema.js";
import { errorResponse } from "../lib/errors.js";
import { requireMember } from "../modules/conversations/conversation.service.js";
import { readSchema, sendMessageSchema } from "../modules/messages/message.schema.js";
import { markRead, sendMessage } from "../modules/messages/message.service.js";
import { realtimeHub } from "./hub.js";
const incomingEventSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("message.send"), requestId: z.string().max(100).optional(), data: sendMessageSchema.extend({ conversationId: z.uuid() }) }),
    z.object({ type: z.enum(["typing.start", "typing.stop"]), data: z.object({ conversationId: z.uuid() }) }),
    z.object({ type: z.literal("receipt.read"), data: readSchema.extend({ conversationId: z.uuid() }) }),
    z.object({ type: z.literal("presence.ping"), data: z.object({}).optional() }),
]);
async function broadcastPresence(userId, online) {
    const memberships = await db.select({ conversationId: conversationMembers.conversationId }).from(conversationMembers).where(eq(conversationMembers.userId, userId));
    const data = { userId, online, lastSeenAt: online ? null : new Date() };
    await Promise.all(memberships.map(({ conversationId }) => realtimeHub.broadcastConversation(conversationId, { type: "presence.changed", data }, userId)));
}
export async function websocketRoutes(app) {
    app.get("/ws", { websocket: true }, (socket, request) => {
        let userId;
        try {
            const authorization = request.headers.authorization;
            const token = request.query.token ?? (authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined);
            if (!token)
                throw new Error("Missing token");
            userId = app.jwt.verify(token).userId;
        }
        catch {
            socket.close(1008, "Unauthorized");
            return;
        }
        realtimeHub.connect(userId, socket);
        socket.send(JSON.stringify({ type: "connection.ready", data: { userId } }));
        void broadcastPresence(userId, true);
        socket.on("message", async (raw) => {
            let requestId;
            try {
                const parsedJson = JSON.parse(String(raw));
                if (parsedJson && typeof parsedJson === "object" && "requestId" in parsedJson && typeof parsedJson.requestId === "string")
                    requestId = parsedJson.requestId;
                const parsed = incomingEventSchema.safeParse(parsedJson);
                if (!parsed.success) {
                    socket.send(JSON.stringify({ type: "error", requestId, data: { code: "INVALID_EVENT", message: "Invalid WebSocket event", errors: parsed.error.flatten() } }));
                    return;
                }
                const event = parsed.data;
                if (event.type === "message.send") {
                    const { conversationId, ...message } = event.data;
                    const data = await sendMessage(conversationId, userId, message);
                    socket.send(JSON.stringify({ type: "message.ack", requestId: event.requestId, data }));
                }
                else if (event.type === "receipt.read") {
                    const data = await markRead(event.data.conversationId, userId, event.data.messageId);
                    socket.send(JSON.stringify({ type: "receipt.ack", data }));
                }
                else if (event.type === "typing.start" || event.type === "typing.stop") {
                    await requireMember(event.data.conversationId, userId);
                    await realtimeHub.broadcastConversation(event.data.conversationId, { type: event.type, data: { conversationId: event.data.conversationId, userId } }, userId);
                }
                else {
                    socket.send(JSON.stringify({ type: "presence.pong", data: { timestamp: new Date() } }));
                }
            }
            catch (error) {
                const response = errorResponse(error);
                socket.send(JSON.stringify({ type: "error", requestId, data: { code: response.body.code, message: response.body.message } }));
            }
        });
        socket.on("close", () => {
            realtimeHub.disconnect(userId, socket);
            if (!realtimeHub.isOnline(userId)) {
                const now = new Date();
                void db.update(users).set({ lastSeenAt: now }).where(eq(users.id, userId));
                void broadcastPresence(userId, false);
            }
        });
    });
}
//# sourceMappingURL=websocket.js.map