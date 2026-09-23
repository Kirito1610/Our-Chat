import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversationMembers, conversations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { json, parseBody, routeError } from "@/lib/http";
import { updateConversationSchema } from "@/modules/conversations/conversation.schema";
import { conversationDetails, requireMember } from "@/modules/conversations/conversation.service";
import { realtimeHub } from "@/realtime/hub";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    return json({ success: true, data: await conversationDetails(id, await requireUser(request)) });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    const input = await parseBody(request, updateConversationSchema);
    const member = await requireMember(id, userId);
    const { isMuted, ...groupChanges } = input;
    if (isMuted !== undefined) await db.update(conversationMembers).set({ isMuted }).where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, userId)));
    if (Object.keys(groupChanges).length) {
      const [conversation] = await db.select({ type: conversations.type }).from(conversations).where(eq(conversations.id, id)).limit(1);
      if (conversation?.type !== "group" || member.role !== "admin") throw new AppError(403, "ADMIN_REQUIRED", "Only group admins can update group details");
      await db.update(conversations).set({ ...groupChanges, updatedAt: new Date() }).where(eq(conversations.id, id));
    }
    const data = await conversationDetails(id, userId);
    await realtimeHub.broadcastConversation(id, { type: "conversation.updated", data });
    return json({ success: true, data });
  } catch (error) { return routeError(error); }
}
