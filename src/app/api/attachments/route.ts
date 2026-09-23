import { requireUser } from "@/lib/auth";
import { downloadAttachment } from "@/lib/cloudinary";
import { routeError } from "@/lib/http";
import { requireMember } from "@/modules/conversations/conversation.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await requireUser(request);
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");
    const publicId = url.searchParams.get("publicId");
    const versionValue = url.searchParams.get("version");
    const mimeType = url.searchParams.get("mimeType") ?? "application/octet-stream";

    if (!conversationId || !publicId) {
      return Response.json({ success: false, code: "ATTACHMENT_PARAMETERS_REQUIRED", message: "conversationId and publicId are required" }, { status: 400 });
    }
    await requireMember(conversationId, userId);
    const data = await downloadAttachment(publicId, versionValue ? Number(versionValue) : undefined);
    return new Response(data, { headers: { "Content-Type": mimeType, "Cache-Control": "private, no-store" } });
  } catch (error) {
    return routeError(error);
  }
}