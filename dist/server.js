import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { env } from "./config/env.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { conversationRoutes } from "./modules/conversations/conversation.route.js";
import { messageRoutes } from "./modules/messages/message.route.js";
import { userRoutes } from "./modules/users/user.route.js";
import { websocketRoutes } from "./realtime/websocket.js";
const app = Fastify({
    logger: true,
});
await app.register(cors, {
    origin: true,
});
await app.register(authPlugin);
await app.register(websocket);
await app.register(authRoutes, {
    prefix: "/api/auth",
});
await app.register(userRoutes, { prefix: "/api/users" });
await app.register(conversationRoutes, { prefix: "/api/conversations" });
await app.register(messageRoutes, { prefix: "/api" });
await app.register(websocketRoutes);
app.get("/", async () => {
    return {
        success: true,
        message: "Personal Chat API",
    };
});
app.get("/health", async () => {
    return {
        success: true,
        status: "ok",
    };
});
try {
    await app.listen({
        port: env.PORT,
        host: "0.0.0.0",
    });
    console.log(`API running on http://localhost:${env.PORT}`);
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
//# sourceMappingURL=server.js.map