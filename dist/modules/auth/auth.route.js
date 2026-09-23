import { registerSchema, loginSchema, } from "./auth.schema.js";
import { registerUser, loginUser, } from "./auth.service.js";
export async function authRoutes(app) {
    app.post("/register", async (request, reply) => {
        const result = registerSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                message: "Invalid request",
                errors: result.error.flatten(),
            });
        }
        try {
            const user = await registerUser(result.data);
            const token = app.jwt.sign({
                userId: user.id,
            });
            return reply.status(201).send({
                success: true,
                data: {
                    user,
                    token,
                },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message === "EMAIL_ALREADY_EXISTS") {
                    return reply.status(409).send({
                        success: false,
                        message: "Email already exists",
                    });
                }
                if (error.message === "USERNAME_ALREADY_EXISTS") {
                    return reply.status(409).send({
                        success: false,
                        message: "Username already exists",
                    });
                }
            }
            request.log.error(error);
            return reply.status(500).send({
                success: false,
                message: "Something went wrong",
            });
        }
    });
    app.post("/login", async (request, reply) => {
        const result = loginSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                success: false,
                message: "Invalid request",
                errors: result.error.flatten(),
            });
        }
        try {
            const user = await loginUser(result.data);
            const token = app.jwt.sign({
                userId: user.id,
            });
            return {
                success: true,
                data: {
                    user,
                    token,
                },
            };
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === "INVALID_CREDENTIALS") {
                return reply.status(401).send({
                    success: false,
                    message: "Invalid email or password",
                });
            }
            request.log.error(error);
            return reply.status(500).send({
                success: false,
                message: "Something went wrong",
            });
        }
    });
}
//# sourceMappingURL=auth.route.js.map