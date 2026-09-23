import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { readSchema } from "@/modules/messages/message.schema";
import { markRead } from "@/modules/messages/message.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    const { messageId } = await parseBody(request, readSchema);
    return json({ success: true, data: await markRead(id, userId, messageId) });
  } catch (error) { return routeError(error); }
}
