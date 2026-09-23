import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { json, routeError } from "@/lib/http";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(request);
    const { id } = await params;
    const [user] = await db.select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, about: users.about, lastSeenAt: users.lastSeenAt }).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
    return json({ success: true, data: user });
  } catch (error) { return routeError(error); }
}
