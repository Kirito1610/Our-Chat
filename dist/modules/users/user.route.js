import { and, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { deviceTokens, users } from "../../db/schema.js";
import { deviceTokenSchema, updateProfileSchema, userSearchSchema } from "./user.schema.js";
const publicUser = {
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    about: users.about,
    lastSeenAt: users.lastSeenAt,
};
export async function userRoutes(app) {
    app.addHook("onRequest", app.authenticate);
    app.get("/me", async (request) => {
        const [user] = await db.select({ ...publicUser, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, request.user.userId)).limit(1);
        return { success: true, data: user };
    });
    app.patch("/me", async (request, reply) => {
        const parsed = updateProfileSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        const [user] = await db.update(users).set({
            ...parsed.data,
            avatarUrl: parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl,
            updatedAt: new Date(),
        }).where(eq(users.id, request.user.userId)).returning({ ...publicUser, email: users.email });
        return { success: true, data: user };
    });
    app.get("/", async (request, reply) => {
        const parsed = userSearchSchema.safeParse(request.query);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid query", errors: parsed.error.flatten() });
        const match = `%${parsed.data.search}%`;
        const found = await db.select(publicUser).from(users).where(and(ne(users.id, request.user.userId), or(ilike(users.username, match), ilike(users.displayName, match)))).limit(parsed.data.limit);
        return { success: true, data: found };
    });
    app.get("/:id", async (request, reply) => {
        const [user] = await db.select(publicUser).from(users).where(eq(users.id, request.params.id)).limit(1);
        if (!user)
            return reply.status(404).send({ success: false, message: "User not found" });
        return { success: true, data: user };
    });
    app.post("/me/devices", async (request, reply) => {
        const parsed = deviceTokenSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        const [device] = await db.insert(deviceTokens).values({ userId: request.user.userId, ...parsed.data }).onConflictDoUpdate({
            target: deviceTokens.token,
            set: { userId: request.user.userId, platform: parsed.data.platform },
        }).returning({ id: deviceTokens.id, platform: deviceTokens.platform });
        return reply.status(201).send({ success: true, data: device });
    });
    app.delete("/me/devices", async (request, reply) => {
        if (!request.body?.token)
            return reply.status(400).send({ success: false, message: "Token is required" });
        await db.delete(deviceTokens).where(and(eq(deviceTokens.userId, request.user.userId), eq(deviceTokens.token, request.body.token)));
        return reply.status(204).send();
    });
}
//# sourceMappingURL=user.route.js.map