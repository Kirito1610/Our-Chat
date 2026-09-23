import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { conversationMembers, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { json, parseBody, routeError } from "@/lib/http";
import { membersSchema } from "@/modules/conversations/conversation.schema";
import { conversationDetails, requireAdmin } from "@/modules/conversations/conversation.service";
import { realtimeHub } from "@/realtime/hub";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    const { memberIds } = await parseBody(request, membersSchema);
    await requireAdmin(id, userId);
    const uniqueIds = [...new Set(memberIds)];
    const valid = await db.select({ id: users.id }).from(users).where(inArray(users.id, uniqueIds));
    if (valid.length !== uniqueIds.length) throw new AppError(400, "INVALID_MEMBERS", "One or more users do not exist");
    await db.insert(conversationMembers).values(valid.map((user) => ({ conversationId: id, userId: user.id }))).onConflictDoNothing();
    const data = await conversationDetails(id, userId);
    await realtimeHub.broadcastConversation(id, { type: "conversation.members_updated", data });
    return json({ success: true, data });
  } catch (error) { return routeError(error); }
}
