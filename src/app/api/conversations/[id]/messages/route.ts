import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { messagesQuerySchema, sendMessageSchema } from "@/modules/messages/message.schema";
import { listMessages, sendMessage } from "@/modules/messages/message.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    const url = new URL(request.url);
    const query = messagesQuerySchema.parse({ cursor: url.searchParams.get("cursor") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    return json({ success: true, ...(await listMessages(id, userId, query.cursor, query.limit)) });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    return json({ success: true, data: await sendMessage(id, userId, await parseBody(request, sendMessageSchema)) }, 201);
  } catch (error) { return routeError(error); }
}
