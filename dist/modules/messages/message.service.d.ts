import { type MessageAttachment } from "../../db/schema.js";
type NewAttachment = {
    url: string;
    type: "image" | "video" | "audio" | "document";
    name?: string | undefined;
    mimeType?: string | undefined;
    size?: number | undefined;
    thumbnailUrl?: string | undefined;
};
type NewMessage = {
    content?: string | undefined;
    type: "text" | "image" | "video" | "audio" | "document";
    attachments: NewAttachment[];
    replyToId?: string | undefined;
    clientId?: string | undefined;
};
export declare function getMessage(messageId: string, userId: string): Promise<{
    id: string;
    conversationId: string;
    senderId: string | null;
    replyToId: string | null;
    clientId: string | null;
    type: "audio" | "document" | "image" | "system" | "text" | "video";
    content: string | null;
    attachments: MessageAttachment[];
    isEdited: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    reactions: {
        emoji: string;
        userId: string;
    }[];
}>;
export declare function sendMessage(conversationId: string, userId: string, input: NewMessage): Promise<{
    id: string;
    conversationId: string;
    senderId: string | null;
    replyToId: string | null;
    clientId: string | null;
    type: "audio" | "document" | "image" | "system" | "text" | "video";
    content: string | null;
    attachments: MessageAttachment[];
    isEdited: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    reactions: {
        emoji: string;
        userId: string;
    }[];
}>;
export declare function listMessages(conversationId: string, userId: string, rawCursor: string | undefined, limit: number): Promise<{
    data: {
        id: string;
        conversationId: string;
        senderId: string | null;
        replyToId: string | null;
        clientId: string | null;
        type: "audio" | "document" | "image" | "system" | "text" | "video";
        content: string | null;
        attachments: MessageAttachment[];
        isEdited: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        senderUsername: string | null;
        senderDisplayName: string | null;
        senderAvatarUrl: string | null;
    }[];
    nextCursor: string | null;
}>;
export declare function editMessage(messageId: string, userId: string, content: string): Promise<{
    id: string;
    conversationId: string;
    senderId: string | null;
    replyToId: string | null;
    clientId: string | null;
    type: "audio" | "document" | "image" | "system" | "text" | "video";
    content: string | null;
    attachments: MessageAttachment[];
    isEdited: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | undefined>;
export declare function deleteMessage(messageId: string, userId: string): Promise<void>;
export declare function setReaction(messageId: string, userId: string, emoji: string, remove?: boolean): Promise<{
    messageId: string;
    conversationId: string;
    userId: string;
    emoji: string;
    removed: boolean;
}>;
export declare function markRead(conversationId: string, userId: string, messageId: string): Promise<{
    conversationId: string;
    userId: string;
    messageId: string;
    readAt: Date;
}>;
export {};
//# sourceMappingURL=message.service.d.ts.map