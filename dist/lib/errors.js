export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
export function errorResponse(error) {
    if (error instanceof AppError) {
        return { statusCode: error.statusCode, body: { success: false, code: error.code, message: error.message } };
    }
    return { statusCode: 500, body: { success: false, code: "INTERNAL_ERROR", message: "Something went wrong" } };
}
//# sourceMappingURL=errors.js.map