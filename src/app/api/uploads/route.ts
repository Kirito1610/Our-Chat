import { requireUser } from "@/lib/auth";
import { uploadAttachment } from "@/lib/cloudinary";
import { json, routeError } from "@/lib/http";
import { requireMember } from "@/modules/conversations/conversation.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const requestUrl = new URL(request.url);
    const conversationId = requestUrl.searchParams.get("conversationId");
    if (!conversationId) return json({ success: false, code: "CONVERSATION_REQUIRED", message: "conversationId is required" }, 400);
    await requireMember(conversationId, userId);
    const formData = await request.formData();
    const files = formData.getAll("file").filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return json({ success: false, code: "FILE_REQUIRED", message: "Attach one or more files using the file field" }, 400);
    }
    if (files.length > 10) {
      return json({ success: false, code: "TOO_MANY_FILES", message: "You can upload at most 10 files at once" }, 400);
    }

    const attachments = await Promise.all(files.map((file) => uploadAttachment(file, "")));
    for (const attachment of attachments) {
      attachment.url = `${requestUrl.origin}/api/attachments?conversationId=${encodeURIComponent(conversationId)}&publicId=${encodeURIComponent(attachment.publicId)}&version=${attachment.version}&mimeType=${encodeURIComponent(attachment.mimeType ?? "application/octet-stream")}`;
    }
    return json({ success: true, data: attachments }, 201);
  } catch (error) {
    return routeError(error);
  }
}