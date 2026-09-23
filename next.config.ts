import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["argon2", "ioredis", "postgres", "ws"],
  async rewrites() {
    return [{ source: "/ws", destination: "/api/ws" }];
  },
};

export default nextConfig;
