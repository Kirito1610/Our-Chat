import { z } from "zod";

export const createConversationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("direct"), participantId: z.uuid() }),
  z.object({ type: z.literal("group"), name: z.string().trim().min(1).max(100), memberIds: z.array(z.uuid()).min(1).max(255), description: z.string().trim().max(500).optional(), avatarUrl: z.url().max(500).nullable().optional() }),
]);

export const updateConversationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.url().max(500).nullable().optional(),
  isMuted: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const membersSchema = z.object({ memberIds: z.array(z.uuid()).min(1).max(255) });
export const roleSchema = z.object({ role: z.enum(["admin", "member"]) });
