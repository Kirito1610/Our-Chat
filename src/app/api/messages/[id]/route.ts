import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { editMessageSchema } from "@/modules/messages/message.schema";
import { deleteMessage, editMessage } from "@/modules/messages/message.service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    const { content } = await parseBody(request, editMessageSchema);
    return json({ success: true, data: await editMessage(id, userId, content) });
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const userId = await requireUser(request);
    const { id } = await params;
    await deleteMessage(id, userId);
    return new Response(null, { status: 204 });
  } catch (error) { return routeError(error); }
}
