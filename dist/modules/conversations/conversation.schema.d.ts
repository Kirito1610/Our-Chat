import { z } from "zod";
export declare const createConversationSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"direct">;
    participantId: z.ZodUUID;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"group">;
    name: z.ZodString;
    memberIds: z.ZodArray<z.ZodUUID>;
    description: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodURL>>;
}, z.core.$strip>], "type">;
export declare const updateConversationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodURL>>;
    isMuted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const membersSchema: z.ZodObject<{
    memberIds: z.ZodArray<z.ZodUUID>;
}, z.core.$strip>;
export declare const roleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        admin: "admin";
        member: "member";
    }>;
}, z.core.$strip>;
//# sourceMappingURL=conversation.schema.d.ts.map