import { z } from "zod";
export declare const updateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodUnion<readonly [z.ZodURL, z.ZodLiteral<"">, z.ZodNull]>>;
    about: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const userSearchSchema: z.ZodObject<{
    search: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const deviceTokenSchema: z.ZodObject<{
    token: z.ZodString;
    platform: z.ZodEnum<{
        android: "android";
        ios: "ios";
        web: "web";
    }>;
}, z.core.$strip>;
//# sourceMappingURL=user.schema.d.ts.map