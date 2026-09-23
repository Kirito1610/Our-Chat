import type { RegisterInput, LoginInput } from "./auth.schema.js";
export declare function registerUser(input: RegisterInput): Promise<{
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
}>;
export declare function loginUser(input: LoginInput): Promise<{
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
}>;
//# sourceMappingURL=auth.service.d.ts.map