export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    constructor(statusCode: number, code: string, message: string);
}
export declare function errorResponse(error: unknown): {
    statusCode: number;
    body: {
        success: boolean;
        code: string;
        message: string;
    };
};
//# sourceMappingURL=errors.d.ts.map