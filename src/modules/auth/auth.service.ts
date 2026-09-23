import argon2 from "argon2";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

import { db } from "../../db";
import { users } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { env } from "../../config/env";

import type {
  RegisterInput,
  LoginInput,
} from "./auth.schema";

export async function registerUser(
  input: RegisterInput
) {
  const existingUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }

  const existingUsername = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);

  if (existingUsername.length > 0) {
    throw new AppError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }

  const passwordHash = await argon2.hash(
    input.password
  );

  const [user] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    })
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    });

  if (!user) {
    throw new AppError(500, "USER_CREATE_FAILED", "Could not create user");
  }

  return user;
}

export async function loginUser(
  input: LoginInput
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const validPassword = await argon2.verify(
    user.passwordHash,
    input.password
  );

  if (!validPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export async function loginWithGoogle(idToken: string) {
  const client = new OAuth2Client();
  const ticket = env.GOOGLE_CLIENT_IDS.length
    ? await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_IDS })
    : await client.verifyIdToken({ idToken });
  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified !== true) throw new AppError(401, "GOOGLE_EMAIL_UNVERIFIED", "Google email is not verified");
  const [existing] = await db.select().from(users).where(eq(users.email, payload.email.toLowerCase())).limit(1);
  if (existing) return { id: existing.id, username: existing.username, email: existing.email, displayName: existing.displayName, avatarUrl: existing.avatarUrl };

  const baseUsername = (payload.email.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 42) || "user";
  let username = baseUsername;
  for (let suffix = 1; ; suffix += 1) {
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!taken) break;
    username = `${baseUsername.slice(0, 50 - String(suffix).length)}${suffix}`;
  }
  const [created] = await db.insert(users).values({ username, email: payload.email.toLowerCase(), passwordHash: await argon2.hash(crypto.randomUUID()), displayName: payload.name || username, avatarUrl: payload.picture || null }).returning({ id: users.id, username: users.username, email: users.email, displayName: users.displayName, avatarUrl: users.avatarUrl });
  if (!created) throw new AppError(500, "USER_CREATE_FAILED", "Could not create Google user");
  return created;
}
