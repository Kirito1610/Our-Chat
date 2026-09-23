import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { updateProfileSchema } from "@/modules/users/user.schema";

const publicUser = { id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, about: users.about, lastSeenAt: users.lastSeenAt };

export async function GET(request: Request) {
  try {
    const userId = await requireUser(request);
    const [user] = await db.select({ ...publicUser, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
    return json({ success: true, data: user });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUser(request);
    const input = await parseBody(request, updateProfileSchema);
    const [user] = await db.update(users).set({ ...input, avatarUrl: input.avatarUrl === "" ? null : input.avatarUrl, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ ...publicUser, email: users.email });
    return json({ success: true, data: user });
  } catch (error) { return routeError(error); }
}
