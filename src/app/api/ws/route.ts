import { experimental_upgradeWebSocket, type WebSocketData } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { conversationMembers, users } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { requireMember } from "@/modules/conversations/conversation.service";
import { readSchema, sendMessageSchema } from "@/modules/messages/message.schema";
import { markRead, sendMessage } from "@/modules/messages/message.service";
import { realtimeHub } from "@/realtime/hub";

export const runtime = "nodejs";
export const maxDuration = 300;

const incomingEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("message.send"), requestId: z.string().max(100).optional(), data: sendMessageSchema.extend({ conversationId: z.uuid() }) }),
  z.object({ type: z.enum(["typing.start", "typing.stop"]), data: z.object({ conversationId: z.uuid() }) }),
  z.object({ type: z.literal("receipt.read"), data: readSchema.extend({ conversationId: z.uuid() }) }),
  z.object({ type: z.literal("presence.ping"), data: z.object({}).optional() }),
]);

async function broadcastPresence(userId: string, online: boolean) {
  const memberships = await db.select({ conversationId: conversationMembers.conversationId }).from(conversationMembers).where(eq(conversationMembers.userId, userId));
  const data = { userId, online, lastSeenAt: online ? null : new Date() };
  await Promise.all(memberships.map(({ conversationId }) => realtimeHub.broadcastConversation(conversationId, { type: "presence.changed", data }, userId)));
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ success: false, message: "WebSocket token is required" }, { status: 401 });

  let userId: string;
  try { userId = await verifyToken(token); }
  catch { return Response.json({ success: false, message: "Unauthorized" }, { status: 401 }); }

  return experimental_upgradeWebSocket((socket) => {
    realtimeHub.connect(userId, socket);
    socket.send(JSON.stringify({ type: "connection.ready", data: { userId } }));
    void broadcastPresence(userId, true);

    socket.on("message", (raw: WebSocketData) => {
      void (async () => {
        let requestId: string | undefined;
        try {
          const parsedJson: unknown = JSON.parse(raw.toString());
          if (parsedJson && typeof parsedJson === "object" && "requestId" in parsedJson && typeof parsedJson.requestId === "string") requestId = parsedJson.requestId;
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
          } else if (event.type === "receipt.read") {
            const data = await markRead(event.data.conversationId, userId, event.data.messageId);
            socket.send(JSON.stringify({ type: "receipt.ack", data }));
          } else if (event.type === "typing.start" || event.type === "typing.stop") {
            await requireMember(event.data.conversationId, userId);
            await realtimeHub.broadcastConversation(event.data.conversationId, { type: event.type, data: { conversationId: event.data.conversationId, userId } }, userId);
          } else {
            await realtimeHub.heartbeat(userId, socket);
            socket.send(JSON.stringify({ type: "presence.pong", data: { timestamp: new Date() } }));
          }
        } catch (error) {
          const response = errorResponse(error);
          socket.send(JSON.stringify({ type: "error", requestId, data: { code: response.body.code, message: response.body.message } }));
        }
      })();
    });

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      void (async () => {
        if (await realtimeHub.disconnect(userId, socket)) {
          const now = new Date();
          await db.update(users).set({ lastSeenAt: now }).where(eq(users.id, userId));
          await broadcastPresence(userId, false);
        }
      })();
    };
    socket.on("close", close);
    socket.on("error", close);
  });
}
