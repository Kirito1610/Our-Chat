import argon2 from "argon2";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { users } from "../../db/schema";
import { AppError } from "../../lib/errors";

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
