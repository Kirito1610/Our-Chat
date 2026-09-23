import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { conversationMembers, conversations, users } from "../../db/schema.js";
import { errorResponse } from "../../lib/errors.js";
import { realtimeHub } from "../../realtime/hub.js";
import { createConversationSchema, membersSchema, roleSchema, updateConversationSchema } from "./conversation.schema.js";
import { conversationDetails, createConversation, listConversations, requireAdmin, requireMember } from "./conversation.service.js";
function fail(request, reply, error) {
    const result = errorResponse(error);
    if (result.statusCode === 500)
        request.log.error(error);
    return reply.status(result.statusCode).send(result.body);
}
export async function conversationRoutes(app) {
    app.addHook("onRequest", app.authenticate);
    app.get("/", async (request, reply) => {
        try {
            return { success: true, data: await listConversations(request.user.userId) };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.post("/", async (request, reply) => {
        const parsed = createConversationSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            const conversation = await createConversation(request.user.userId, parsed.data);
            await realtimeHub.broadcastConversation(conversation.id, { type: "conversation.created", data: conversation });
            return reply.status(201).send({ success: true, data: conversation });
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.get("/:id", async (request, reply) => {
        try {
            return { success: true, data: await conversationDetails(request.params.id, request.user.userId) };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.patch("/:id", async (request, reply) => {
        const parsed = updateConversationSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            const member = await requireMember(request.params.id, request.user.userId);
            const { isMuted, ...groupChanges } = parsed.data;
            if (isMuted !== undefined)
                await db.update(conversationMembers).set({ isMuted }).where(and(eq(conversationMembers.conversationId, request.params.id), eq(conversationMembers.userId, request.user.userId)));
            if (Object.keys(groupChanges).length) {
                const [conversation] = await db.select({ type: conversations.type }).from(conversations).where(eq(conversations.id, request.params.id)).limit(1);
                if (conversation?.type !== "group" || member.role !== "admin")
                    return reply.status(403).send({ success: false, message: "Only group admins can update group details" });
                await db.update(conversations).set({ ...groupChanges, updatedAt: new Date() }).where(eq(conversations.id, request.params.id));
            }
            const data = await conversationDetails(request.params.id, request.user.userId);
            await realtimeHub.broadcastConversation(request.params.id, { type: "conversation.updated", data });
            return { success: true, data };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.post("/:id/members", async (request, reply) => {
        const parsed = membersSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            await requireAdmin(request.params.id, request.user.userId);
            const valid = await db.select({ id: users.id }).from(users).where(inArray(users.id, [...new Set(parsed.data.memberIds)]));
            if (valid.length !== new Set(parsed.data.memberIds).size)
                return reply.status(400).send({ success: false, message: "One or more users do not exist" });
            await db.insert(conversationMembers).values(valid.map(({ id }) => ({ conversationId: request.params.id, userId: id }))).onConflictDoNothing();
            const data = await conversationDetails(request.params.id, request.user.userId);
            await realtimeHub.broadcastConversation(request.params.id, { type: "conversation.members_updated", data });
            return { success: true, data };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.patch("/:id/members/:userId", async (request, reply) => {
        const parsed = roleSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            await requireAdmin(request.params.id, request.user.userId);
            await db.update(conversationMembers).set({ role: parsed.data.role }).where(and(eq(conversationMembers.conversationId, request.params.id), eq(conversationMembers.userId, request.params.userId)));
            const data = await conversationDetails(request.params.id, request.user.userId);
            await realtimeHub.broadcastConversation(request.params.id, { type: "conversation.members_updated", data });
            return { success: true, data };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.delete("/:id/members/:userId", async (request, reply) => {
        try {
            if (request.params.userId !== request.user.userId)
                await requireAdmin(request.params.id, request.user.userId);
            else
                await requireMember(request.params.id, request.user.userId);
            await db.delete(conversationMembers).where(and(eq(conversationMembers.conversationId, request.params.id), eq(conversationMembers.userId, request.params.userId)));
            await realtimeHub.broadcastConversation(request.params.id, { type: "conversation.member_removed", data: { conversationId: request.params.id, userId: request.params.userId } });
            return reply.status(204).send();
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
}
//# sourceMappingURL=conversation.route.js.map