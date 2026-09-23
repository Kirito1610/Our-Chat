import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  about: varchar("about", { length: 160 }).default("Hey there! I am using Chat App").notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 10 }).$type<"direct" | "group">().notNull(),
  name: varchar("name", { length: 100 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  description: varchar("description", { length: 500 }),
  directKey: varchar("direct_key", { length: 73 }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("conversations_direct_key_unique").on(table.directKey), index("conversations_updated_at_idx").on(table.updatedAt)]);

export const conversationMembers = pgTable("conversation_members", {
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 10 }).$type<"admin" | "member">().default("member").notNull(),
  isMuted: boolean("is_muted").default(false).notNull(),
  lastReadMessageId: uuid("last_read_message_id"),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.conversationId, table.userId] }), index("conversation_members_user_idx").on(table.userId)]);

export type MessageAttachment = {
  url: string;
  type: "image" | "video" | "audio" | "document";
  name?: string;
  mimeType?: string;
  size?: number;
  thumbnailUrl?: string;
};

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  replyToId: uuid("reply_to_id"),
  clientId: varchar("client_id", { length: 100 }),
  type: varchar("type", { length: 15 }).$type<"text" | "image" | "video" | "audio" | "document" | "system">().default("text").notNull(),
  content: text("content"),
  attachments: jsonb("attachments").$type<MessageAttachment[]>().default([]).notNull(),
  isEdited: boolean("is_edited").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("messages_conversation_created_idx").on(table.conversationId, table.createdAt), uniqueIndex("messages_sender_client_unique").on(table.senderId, table.clientId)]);

export const messageReactions = pgTable("message_reactions", {
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.messageId, table.userId, table.emoji] })]);

export const deviceTokens = pgTable("device_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: varchar("platform", { length: 10 }).$type<"web" | "ios" | "android">().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("device_tokens_user_idx").on(table.userId)]);
