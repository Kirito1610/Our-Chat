import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { deviceTokens } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { json, parseBody, routeError } from "@/lib/http";
import { deviceTokenSchema } from "@/modules/users/user.schema";

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const input = await parseBody(request, deviceTokenSchema);
    const [device] = await db.insert(deviceTokens).values({ userId, ...input }).onConflictDoUpdate({ target: deviceTokens.token, set: { userId, platform: input.platform } }).returning({ id: deviceTokens.id, platform: deviceTokens.platform });
    return json({ success: true, data: device }, 201);
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireUser(request);
    const body = await request.json() as { token?: unknown };
    if (typeof body.token !== "string") throw new AppError(400, "TOKEN_REQUIRED", "Token is required");
    await db.delete(deviceTokens).where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, body.token)));
    return new Response(null, { status: 204 });
  } catch (error) { return routeError(error); }
}
