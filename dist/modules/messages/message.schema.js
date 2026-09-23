import { z } from "zod";
export const attachmentSchema = z.object({
    url: z.url().max(2048),
    type: z.enum(["image", "video", "audio", "document"]),
    name: z.string().max(255).optional(),
    mimeType: z.string().max(100).optional(),
    size: z.number().int().nonnegative().max(1024 * 1024 * 1024).optional(),
    thumbnailUrl: z.url().max(2048).optional(),
});
export const sendMessageSchema = z.object({
    content: z.string().trim().max(10000).optional(),
    type: z.enum(["text", "image", "video", "audio", "document"]).default("text"),
    attachments: z.array(attachmentSchema).max(10).default([]),
    replyToId: z.uuid().optional(),
    clientId: z.string().min(1).max(100).optional(),
}).refine((value) => Boolean(value.content) || value.attachments.length > 0, "Message content or an attachment is required");
export const editMessageSchema = z.object({ content: z.string().trim().min(1).max(10000) });
export const reactionSchema = z.object({ emoji: z.string().trim().min(1).max(32) });
export const readSchema = z.object({ messageId: z.uuid() });
export const messagesQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});
//# sourceMappingURL=message.schema.js.map