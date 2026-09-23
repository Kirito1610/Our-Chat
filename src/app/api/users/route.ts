import { and, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { json, routeError } from "@/lib/http";
import { userSearchSchema } from "@/modules/users/user.schema";

const publicUser = { id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, about: users.about, lastSeenAt: users.lastSeenAt };

export async function GET(request: Request) {
  try {
    const userId = await requireUser(request);
    const url = new URL(request.url);
    const parsed = userSearchSchema.parse({ search: url.searchParams.get("search") ?? "", limit: url.searchParams.get("limit") ?? undefined });
    const match = `%${parsed.search}%`;
    const data = await db.select(publicUser).from(users).where(and(ne(users.id, userId), or(ilike(users.username, match), ilike(users.displayName, match)))).limit(parsed.limit);
    return json({ success: true, data });
  } catch (error) { return routeError(error); }
}
