import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversationMembers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { roleSchema } from "@/modules/conversations/conversation.schema";
import { conversationDetails, requireAdmin, requireMember } from "@/modules/conversations/conversation.service";
import { realtimeHub } from "@/realtime/hub";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const actorId = await requireUser(request);
    const { id, userId } = await params;
    const { role } = await parseBody(request, roleSchema);
    await requireAdmin(id, actorId);
    await db.update(conversationMembers).set({ role }).where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, userId)));
    const data = await conversationDetails(id, actorId);
    await realtimeHub.broadcastConversation(id, { type: "conversation.members_updated", data });
    return json({ success: true, data });
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const actorId = await requireUser(request);
    const { id, userId } = await params;
    if (userId === actorId) await requireMember(id, actorId); else await requireAdmin(id, actorId);
    await db.delete(conversationMembers).where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, userId)));
    await realtimeHub.broadcastConversation(id, { type: "conversation.member_removed", data: { conversationId: id, userId } });
    return new Response(null, { status: 204 });
  } catch (error) { return routeError(error); }
}
