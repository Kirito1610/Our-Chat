import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { reactionSchema } from "@/modules/messages/message.schema";
import { setReaction } from "@/modules/messages/message.service";

type Context = { params: Promise<{ id: string }> };

async function handle(request: Request, context: Context, remove: boolean) {
  try {
    const userId = await requireUser(request);
    const { id } = await context.params;
    const { emoji } = await parseBody(request, reactionSchema);
    return json({ success: true, data: await setReaction(id, userId, emoji, remove) }, remove ? 200 : 201);
  } catch (error) { return routeError(error); }
}

export function POST(request: Request, context: Context) { return handle(request, context, false); }
export function DELETE(request: Request, context: Context) { return handle(request, context, true); }
