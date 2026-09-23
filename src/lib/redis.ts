import { Redis } from "ioredis";

function createRedis() {
  if (!process.env.REDIS_URL) return null;
  return new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, retryStrategy: (times: number) => Math.min(times * 200, 5_000) });
}

export const redis = createRedis();
