import { z } from "zod";
const optionalUrl = z.union([z.url().max(500), z.literal(""), z.null()]).optional();
export const updateProfileSchema = z.object({
    displayName: z.string().trim().min(1).max(100).optional(),
    avatarUrl: optionalUrl,
    about: z.string().trim().max(160).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");
export const userSearchSchema = z.object({
    search: z.string().trim().max(100).default(""),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const deviceTokenSchema = z.object({
    token: z.string().min(10).max(4096),
    platform: z.enum(["web", "ios", "android"]),
});
//# sourceMappingURL=user.schema.js.map