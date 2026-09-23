import { z } from "zod";
export declare const attachmentSchema: z.ZodObject<{
    url: z.ZodURL;
    type: z.ZodEnum<{
        audio: "audio";
        document: "document";
        image: "image";
        video: "video";
    }>;
    name: z.ZodOptional<z.ZodString>;
    mimeType: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
    thumbnailUrl: z.ZodOptional<z.ZodURL>;
}, z.core.$strip>;
export declare const sendMessageSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<{
        audio: "audio";
        document: "document";
        image: "image";
        text: "text";
        video: "video";
    }>>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodURL;
        type: z.ZodEnum<{
            audio: "audio";
            document: "document";
            image: "image";
            video: "video";
        }>;
        name: z.ZodOptional<z.ZodString>;
        mimeType: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
        thumbnailUrl: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>>>;
    replyToId: z.ZodOptional<z.ZodUUID>;
    clientId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const editMessageSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strip>;
export declare const reactionSchema: z.ZodObject<{
    emoji: z.ZodString;
}, z.core.$strip>;
export declare const readSchema: z.ZodObject<{
    messageId: z.ZodUUID;
}, z.core.$strip>;
export declare const messagesQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
//# sourceMappingURL=message.schema.d.ts.map