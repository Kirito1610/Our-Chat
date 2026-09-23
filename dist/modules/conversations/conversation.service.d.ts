export declare function requireMember(conversationId: string, userId: string): Promise<{
    conversationId: string;
    userId: string;
    role: "admin" | "member";
    isMuted: boolean;
    lastReadMessageId: string | null;
    lastReadAt: Date | null;
    joinedAt: Date;
}>;
export declare function requireAdmin(conversationId: string, userId: string): Promise<{
    conversationId: string;
    userId: string;
    role: "admin" | "member";
    isMuted: boolean;
    lastReadMessageId: string | null;
    lastReadAt: Date | null;
    joinedAt: Date;
}>;
export declare function conversationDetails(conversationId: string, userId: string): Promise<{
    id: string;
    type: "direct" | "group";
    name: string | null;
    avatarUrl: string | null;
    description: string | null;
    directKey: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    members: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        about: string;
        lastSeenAt: Date | null;
        role: "admin" | "member";
        joinedAt: Date;
        lastReadMessageId: string | null;
    }[];
}>;
export declare function createConversation(userId: string, input: {
    type: "direct";
    participantId: string;
} | {
    type: "group";
    name: string;
    memberIds: string[];
    description?: string | undefined;
    avatarUrl?: string | null | undefined;
}): Promise<{
    id: string;
    type: "direct" | "group";
    name: string | null;
    avatarUrl: string | null;
    description: string | null;
    directKey: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    members: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        about: string;
        lastSeenAt: Date | null;
        role: "admin" | "member";
        joinedAt: Date;
        lastReadMessageId: string | null;
    }[];
}>;
export declare function listConversations(userId: string): Promise<{
    id: string;
    type: "direct" | "group";
    name: string | null;
    avatarUrl: string | null;
    description: string | null;
    directKey: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    members: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        about: string;
        lastSeenAt: Date | null;
        role: "admin" | "member";
        joinedAt: Date;
        lastReadMessageId: string | null;
    }[];
    lastMessage: {
        id: string;
        conversationId: string;
        senderId: string | null;
        replyToId: string | null;
        clientId: string | null;
        type: "audio" | "document" | "image" | "system" | "text" | "video";
        content: string | null;
        attachments: import("../../db/schema.js").MessageAttachment[];
        isEdited: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    unreadCount: number;
}[]>;
//# sourceMappingURL=conversation.service.d.ts.map