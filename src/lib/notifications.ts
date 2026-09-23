import { and, eq, ne } from "drizzle-orm";

import { db } from "../db";
import { conversationMembers, deviceTokens } from "../db/schema";

type PushMessage = { to: string; title: string; body: string; data: Record<string, string> };

export async function notifyConversationMembers(conversationId: string, senderId: string, title: string, body: string, messageId: string) {
  const recipients = await db.select({ token: deviceTokens.token }).from(deviceTokens).innerJoin(conversationMembers, eq(conversationMembers.userId, deviceTokens.userId)).where(and(eq(conversationMembers.conversationId, conversationId), ne(conversationMembers.userId, senderId)));
  const messages: PushMessage[] = recipients.map(({ token }) => ({ to: token, title, body, data: { conversationId, messageId } }));
  if (!messages.length) return;
  await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(messages) });
}