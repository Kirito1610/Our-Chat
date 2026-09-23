import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
export async function registerUser(input) {
    const existingUser = await db
        .select({
        id: users.id,
    })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
    if (existingUser.length > 0) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }
    const existingUsername = await db
        .select({
        id: users.id,
    })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);
    if (existingUsername.length > 0) {
        throw new Error("USERNAME_ALREADY_EXISTS");
    }
    const passwordHash = await argon2.hash(input.password);
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
        throw new Error("USER_CREATE_FAILED");
    }
    return user;
}
export async function loginUser(input) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
        throw new Error("INVALID_CREDENTIALS");
    }
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
    };
}
//# sourceMappingURL=auth.service.js.map