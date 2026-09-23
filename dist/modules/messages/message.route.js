import { errorResponse } from "../../lib/errors.js";
import { editMessageSchema, messagesQuerySchema, reactionSchema, readSchema, sendMessageSchema } from "./message.schema.js";
import { deleteMessage, editMessage, listMessages, markRead, sendMessage, setReaction } from "./message.service.js";
function fail(request, reply, error) {
    const result = errorResponse(error);
    if (result.statusCode === 500)
        request.log.error(error);
    return reply.status(result.statusCode).send(result.body);
}
export async function messageRoutes(app) {
    app.addHook("onRequest", app.authenticate);
    app.get("/conversations/:id/messages", async (request, reply) => {
        const parsed = messagesQuerySchema.safeParse(request.query);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid query", errors: parsed.error.flatten() });
        try {
            return { success: true, ...(await listMessages(request.params.id, request.user.userId, parsed.data.cursor, parsed.data.limit)) };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.post("/conversations/:id/messages", async (request, reply) => {
        const parsed = sendMessageSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            return reply.status(201).send({ success: true, data: await sendMessage(request.params.id, request.user.userId, parsed.data) });
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.post("/conversations/:id/read", async (request, reply) => {
        const parsed = readSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            return { success: true, data: await markRead(request.params.id, request.user.userId, parsed.data.messageId) };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.patch("/messages/:id", async (request, reply) => {
        const parsed = editMessageSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            return { success: true, data: await editMessage(request.params.id, request.user.userId, parsed.data.content) };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.delete("/messages/:id", async (request, reply) => {
        try {
            await deleteMessage(request.params.id, request.user.userId);
            return reply.status(204).send();
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.post("/messages/:id/reactions", async (request, reply) => {
        const parsed = reactionSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            return reply.status(201).send({ success: true, data: await setReaction(request.params.id, request.user.userId, parsed.data.emoji) });
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
    app.delete("/messages/:id/reactions", async (request, reply) => {
        const parsed = reactionSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.status(400).send({ success: false, message: "Invalid request", errors: parsed.error.flatten() });
        try {
            return { success: true, data: await setReaction(request.params.id, request.user.userId, parsed.data.emoji, true) };
        }
        catch (error) {
            return fail(request, reply, error);
        }
    });
}
//# sourceMappingURL=message.route.js.map