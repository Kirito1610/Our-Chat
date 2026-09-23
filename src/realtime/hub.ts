import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { conversationMembers } from "../db/schema";
import { redis } from "../lib/redis";

type EventPayload = { type: string; data: unknown };
type Relay = { source: string; userIds: string[]; exceptUserId?: string; event: EventPayload };
const CHANNEL = "chat:events:v1";
const instanceId = randomUUID();
const socketsByUser = new Map<string, Set<WebSocket>>();
const connectionIds = new WeakMap<WebSocket, string>();
let subscriberStarted = false;

function send(socket: WebSocket, event: EventPayload) {
  if (socket.readyState === 1) socket.send(JSON.stringify(event));
}

function deliver(relay: Relay) {
  for (const userId of relay.userIds) {
    if (userId === relay.exceptUserId) continue;
    for (const socket of socketsByUser.get(userId) ?? []) send(socket, relay.event);
  }
}

function startSubscriber() {
  if (!redis || subscriberStarted) return;
  subscriberStarted = true;
  const subscriber = redis.duplicate();
  subscriber.on("message", (_channel, value) => {
    try {
      const relay = JSON.parse(value) as Relay;
      if (relay.source !== instanceId) deliver(relay);
    } catch (error) { console.error("Invalid realtime relay", error); }
  });
  subscriber.on("error", (error) => console.error("Redis subscriber error", error));
  void subscriber.subscribe(CHANNEL);
}

async function relay(userIds: string[], event: EventPayload, exceptUserId?: string) {
  const payload: Relay = { source: instanceId, userIds, event, ...(exceptUserId ? { exceptUserId } : {}) };
  deliver(payload);
  if (redis) await redis.publish(CHANNEL, JSON.stringify(payload));
}

export const realtimeHub = {
  connect(userId: string, socket: WebSocket) {
    const sockets = socketsByUser.get(userId) ?? new Set<WebSocket>();
    sockets.add(socket);
    socketsByUser.set(userId, sockets);
    const connectionId = randomUUID();
    connectionIds.set(socket, connectionId);
    startSubscriber();
    if (redis) void redis.zadd(`presence:${userId}`, Date.now() + 45_000, connectionId);
  },
  async heartbeat(userId: string, socket: WebSocket) {
    const connectionId = connectionIds.get(socket);
    if (redis && connectionId) await redis.zadd(`presence:${userId}`, Date.now() + 45_000, connectionId);
  },
  async disconnect(userId: string, socket: WebSocket) {
    const sockets = socketsByUser.get(userId);
    sockets?.delete(socket);
    if (sockets?.size === 0) socketsByUser.delete(userId);
    const connectionId = connectionIds.get(socket);
    if (redis && connectionId) {
      await redis.zrem(`presence:${userId}`, connectionId);
      await redis.zremrangebyscore(`presence:${userId}`, 0, Date.now());
      return (await redis.zcard(`presence:${userId}`)) === 0;
    }
    return !socketsByUser.has(userId);
  },
  async broadcastConversation(conversationId: string, event: EventPayload, exceptUserId?: string) {
    const members = await db.select({ userId: conversationMembers.userId }).from(conversationMembers).where(eq(conversationMembers.conversationId, conversationId));
    await relay(members.map((member) => member.userId), event, exceptUserId);
  },
};
