import { AppError } from "./errors";

export function encodeCursor(value: Date) {
  return Buffer.from(value.toISOString()).toString("base64url");
}

export function decodeCursor(cursor?: string) {
  if (!cursor) return undefined;
  const value = new Date(Buffer.from(cursor, "base64url").toString("utf8"));
  if (Number.isNaN(value.getTime())) throw new AppError(400, "INVALID_CURSOR", "Invalid pagination cursor");
  return value;
}
