import { ZodError, type ZodType } from "zod";
import { AppError, errorResponse } from "./errors";

export function json(data: unknown, status = 200) { return Response.json(data, { status }); }

export async function parseBody<T>(request: Request, schema: ZodType<T>) {
  let body: unknown;
  try { body = await request.json(); } catch { throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON"); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError(400, "INVALID_REQUEST", JSON.stringify(parsed.error.flatten()));
  return parsed.data;
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    return json({ success: false, code: "INVALID_REQUEST", message: "Invalid request", errors: error.flatten() }, 400);
  }
  const result = errorResponse(error);
  if (result.statusCode === 500) console.error(error);
  let errors: unknown;
  if (error instanceof AppError && error.code === "INVALID_REQUEST") {
    try { errors = JSON.parse(error.message); } catch { errors = undefined; }
  }
  return json({ ...result.body, ...(errors ? { message: "Invalid request", errors } : {}) }, result.statusCode);
}
