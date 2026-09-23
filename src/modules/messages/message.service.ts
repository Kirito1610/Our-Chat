import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "../../db";
import { conversationMembers, conversations, messageReactions, messages, users, type MessageAttachment } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { decodeCursor, encodeCursor } from "../../lib/pagination";
import { realtimeHub } from "../../realtime/hub";
import { requireMember } from "../conversations/conversation.service";

type NewAttachment = { url: string; type: "image" | "video" | "audio" | "document"; name?: string | undefined; mimeType?: string | undefined; size?: number | undefined; thumbnailUrl?: string | undefined };
type NewMessage = { content?: string | undefined; type: "text" | "image" | "video" | "audio" | "document"; attachments: NewAttachment[]; replyToId?: string | undefined; clientId?: string | undefined };

export async function getMessage(messageId: string, userId: string) {
  const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!message) throw new AppError(404, "MESSAGE_NOT_FOUND", "Message not found");
  await requireMember(message.conversationId, userId);
  const reactions = await db.select({ emoji: messageReactions.emoji, userId: messageReactions.userId }).from(messageReactions).where(eq(messageReactions.messageId, message.id));
  return { ...message, reactions };
}

export async function sendMessage(conversationId: string, userId: string, input: NewMessage) {
  await requireMember(conversationId, userId);
  if (input.replyToId) {
    const [reply] = await db.select({ conversationId: messages.conversationId }).from(messages).where(eq(messages.id, input.replyToId)).limit(1);
    if (!reply || reply.conversationId !== conversationId) throw new AppError(400, "INVALID_REPLY", "Reply target is not in this conversation");
  }
  if (input.clientId) {
    const [existing] = await db.select({ id: messages.id }).from(messages).where(and(eq(messages.senderId, userId), eq(messages.clientId, input.clientId))).limit(1);
    if (existing) return getMessage(existing.id, userId);
  }
  const [created] = await db.insert(messages).values({ conversationId, senderId: userId, ...input, attachments: input.attachments as MessageAttachment[] }).returning({ id: messages.id });
  if (!created) throw new AppError(500, "SEND_FAILED", "Could not send message");
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  const message = await getMessage(created.id, userId);
  await realtimeHub.broadcastConversation(conversationId, { type: "message.new", data: message });
  return message;
}

export async function listMessages(conversationId: string, userId: string, rawCursor: string | undefined, limit: number) {
  await requireMember(conversationId, userId);
  const cursor = decodeCursor(rawCursor);
  const rows = await db.select({
    id: messages.id, conversationId: messages.conversationId, senderId: messages.senderId, replyToId: messages.replyToId,
    clientId: messages.clientId, type: messages.type, content: messages.content, attachments: messages.attachments,
    isEdited: messages.isEdited, deletedAt: messages.deletedAt, createdAt: messages.createdAt, updatedAt: messages.updatedAt,
    senderUsername: users.username, senderDisplayName: users.displayName, senderAvatarUrl: users.avatarUrl,
  }).from(messages).leftJoin(users, eq(users.id, messages.senderId)).where(and(eq(messages.conversationId, conversationId), cursor ? lt(messages.createdAt, cursor) : undefined)).orderBy(desc(messages.createdAt)).limit(limit + 1);
  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit);
  return { data, nextCursor: hasMore && data.at(-1) ? encodeCursor(data.at(-1)!.createdAt) : null };
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await getMessage(messageId, userId);
  if (message.senderId !== userId) throw new AppError(403, "NOT_MESSAGE_OWNER", "You can only edit your own messages");
  if (message.deletedAt) throw new AppError(400, "MESSAGE_DELETED", "Deleted messages cannot be edited");
  const [updated] = await db.update(messages).set({ content, isEdited: true, updatedAt: new Date() }).where(eq(messages.id, messageId)).returning();
  await realtimeHub.broadcastConversation(message.conversationId, { type: "message.updated", data: updated });
  return updated;
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await getMessage(messageId, userId);
  if (message.senderId !== userId) throw new AppError(403, "NOT_MESSAGE_OWNER", "You can only delete your own messages");
  const [updated] = await db.update(messages).set({ content: null, attachments: [], deletedAt: new Date(), updatedAt: new Date() }).where(eq(messages.id, messageId)).returning();
  await realtimeHub.broadcastConversation(message.conversationId, { type: "message.deleted", data: { id: messageId, conversationId: message.conversationId, deletedAt: updated?.deletedAt } });
}

export async function setReaction(messageId: string, userId: string, emoji: string, remove = false) {
  const message = await getMessage(messageId, userId);
  if (remove) await db.delete(messageReactions).where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId), eq(messageReactions.emoji, emoji)));
  else await db.insert(messageReactions).values({ messageId, userId, emoji }).onConflictDoNothing();
  const data = { messageId, conversationId: message.conversationId, userId, emoji, removed: remove };
  await realtimeHub.broadcastConversation(message.conversationId, { type: "message.reaction", data });
  return data;
}

export async function markRead(conversationId: string, userId: string, messageId: string) {
  await requireMember(conversationId, userId);
  const [message] = await db.select({ id: messages.id, createdAt: messages.createdAt }).from(messages).where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId))).limit(1);
  if (!message) throw new AppError(400, "INVALID_MESSAGE", "Message is not in this conversation");
  await db.update(conversationMembers).set({ lastReadMessageId: messageId, lastReadAt: new Date() }).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)));
  const data = { conversationId, userId, messageId, readAt: new Date() };
  await realtimeHub.broadcastConversation(conversationId, { type: "receipt.read", data }, userId);
  return data;
}
