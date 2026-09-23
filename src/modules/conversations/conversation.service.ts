import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import { conversationMembers, conversations, messages, users } from "../../db/schema";
import { AppError } from "../../lib/errors";

export async function requireMember(conversationId: string, userId: string) {
  const [member] = await db.select().from(conversationMembers).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId))).limit(1);
  if (!member) throw new AppError(403, "NOT_A_MEMBER", "You are not a member of this conversation");
  return member;
}

export async function requireAdmin(conversationId: string, userId: string) {
  const member = await requireMember(conversationId, userId);
  if (member.role !== "admin") throw new AppError(403, "ADMIN_REQUIRED", "Group admin permission required");
  return member;
}

export async function conversationDetails(conversationId: string, userId: string) {
  await requireMember(conversationId, userId);
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  const members = await db.select({
    id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl,
    about: users.about, lastSeenAt: users.lastSeenAt, role: conversationMembers.role,
    joinedAt: conversationMembers.joinedAt, lastReadMessageId: conversationMembers.lastReadMessageId,
  }).from(conversationMembers).innerJoin(users, eq(users.id, conversationMembers.userId)).where(eq(conversationMembers.conversationId, conversationId));
  return { ...conversation, members };
}

export async function createConversation(userId: string, input: { type: "direct"; participantId: string } | { type: "group"; name: string; memberIds: string[]; description?: string | undefined; avatarUrl?: string | null | undefined }) {
  if (input.type === "direct") {
    if (input.participantId === userId) throw new AppError(400, "SELF_CONVERSATION", "Cannot create a conversation with yourself");
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.participantId)).limit(1);
    if (!target) throw new AppError(404, "USER_NOT_FOUND", "User not found");
    const directKey = [userId, input.participantId].sort().join(":");
    const [existing] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.directKey, directKey)).limit(1);
    if (existing) return conversationDetails(existing.id, userId);
    const [created] = await db.insert(conversations).values({ type: "direct", directKey, createdBy: userId }).returning({ id: conversations.id });
    if (!created) throw new AppError(500, "CREATE_FAILED", "Could not create conversation");
    await db.insert(conversationMembers).values([{ conversationId: created.id, userId, role: "member" }, { conversationId: created.id, userId: input.participantId, role: "member" }]);
    return conversationDetails(created.id, userId);
  }

  const memberIds = [...new Set([userId, ...input.memberIds])];
  const existingUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, memberIds));
  if (existingUsers.length !== memberIds.length) throw new AppError(400, "INVALID_MEMBERS", "One or more members do not exist");
  const [created] = await db.insert(conversations).values({ type: "group", name: input.name, description: input.description, avatarUrl: input.avatarUrl, createdBy: userId }).returning({ id: conversations.id });
  if (!created) throw new AppError(500, "CREATE_FAILED", "Could not create conversation");
  await db.insert(conversationMembers).values(memberIds.map((memberId) => ({ conversationId: created.id, userId: memberId, role: memberId === userId ? "admin" as const : "member" as const })));
  return conversationDetails(created.id, userId);
}

export async function listConversations(userId: string) {
  const rows = await db.select({ id: conversations.id }).from(conversationMembers).innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId)).where(eq(conversationMembers.userId, userId)).orderBy(desc(conversations.updatedAt));
  return Promise.all(rows.map(async ({ id }) => {
    const detail = await conversationDetails(id, userId);
    const [lastMessage] = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(desc(messages.createdAt)).limit(1);
    const [me] = detail.members.filter((member) => member.id === userId);
    const [unread] = await db.select({ count: sql<number>`count(*)::int` }).from(messages).where(and(eq(messages.conversationId, id), me?.lastReadMessageId ? sql`${messages.createdAt} > coalesce((select created_at from messages where id = ${me.lastReadMessageId}), 'epoch')` : sql`true`, sql`${messages.senderId} is distinct from ${userId}`));
    return { ...detail, lastMessage: lastMessage ?? null, unreadCount: unread?.count ?? 0 };
  }));
}
