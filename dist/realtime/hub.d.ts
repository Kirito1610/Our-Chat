import type { WebSocket } from "@fastify/websocket";
type EventPayload = {
    type: string;
    data: unknown;
};
export declare const realtimeHub: {
    connect(userId: string, socket: WebSocket): void;
    disconnect(userId: string, socket: WebSocket): void;
    isOnline(userId: string): boolean;
    sendToUser(userId: string, event: EventPayload): void;
    broadcastConversation(conversationId: string, event: EventPayload, exceptUserId?: string): Promise<void>;
};
export {};
//# sourceMappingURL=hub.d.ts.map