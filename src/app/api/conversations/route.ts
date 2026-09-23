import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { realtimeHub } from "@/realtime/hub";
import { createConversationSchema } from "@/modules/conversations/conversation.schema";
import { createConversation, listConversations } from "@/modules/conversations/conversation.service";

export async function GET(request: Request) {
  try { return json({ success: true, data: await listConversations(await requireUser(request)) }); }
  catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const conversation = await createConversation(userId, await parseBody(request, createConversationSchema));
    await realtimeHub.broadcastConversation(conversation.id, { type: "conversation.created", data: conversation });
    return json({ success: true, data: conversation }, 201);
  } catch (error) { return routeError(error); }
}
