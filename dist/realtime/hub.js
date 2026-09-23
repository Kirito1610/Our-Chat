import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { conversationMembers } from "../db/schema.js";
const socketsByUser = new Map();
function send(socket, event) {
    if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify(event));
}
export const realtimeHub = {
    connect(userId, socket) {
        const sockets = socketsByUser.get(userId) ?? new Set();
        sockets.add(socket);
        socketsByUser.set(userId, sockets);
    },
    disconnect(userId, socket) {
        const sockets = socketsByUser.get(userId);
        sockets?.delete(socket);
        if (sockets?.size === 0)
            socketsByUser.delete(userId);
    },
    isOnline(userId) {
        return (socketsByUser.get(userId)?.size ?? 0) > 0;
    },
    sendToUser(userId, event) {
        for (const socket of socketsByUser.get(userId) ?? [])
            send(socket, event);
    },
    async broadcastConversation(conversationId, event, exceptUserId) {
        const members = await db.select({ userId: conversationMembers.userId }).from(conversationMembers).where(eq(conversationMembers.conversationId, conversationId));
        for (const member of members) {
            if (member.userId !== exceptUserId)
                this.sendToUser(member.userId, event);
        }
    },
};
//# sourceMappingURL=hub.js.map