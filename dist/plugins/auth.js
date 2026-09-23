import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { env } from "../config/env.js";
export default fp(async (app) => {
    await app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        sign: { expiresIn: "7d" },
    });
    app.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized",
            });
        }
    });
});
//# sourceMappingURL=auth.js.map