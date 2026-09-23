import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";
import { AppError } from "./errors";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") throw new Error("Invalid payload");
    return payload.userId;
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return verifyToken(authorization.slice(7));
}
