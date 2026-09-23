import { requireUser } from "@/lib/auth";
import { uploadAvatar } from "@/lib/cloudinary";
import { json, routeError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return json({ success: false, code: "FILE_REQUIRED", message: "Choose an image file" }, 400);
    return json({ success: true, data: await uploadAvatar(file) }, 201);
  } catch (error) {
    return routeError(error);
  }
}