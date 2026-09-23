export class AppError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, body: { success: false, code: error.code, message: error.message } };
  }
  return { statusCode: 500, body: { success: false, code: "INTERNAL_ERROR", message: "Something went wrong" } };
}
