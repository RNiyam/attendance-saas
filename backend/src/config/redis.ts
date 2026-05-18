import { createClient, type RedisClientType } from "redis";
import { getEnv } from "./env";

let client: RedisClientType | null = null;

/**
 * Lazy Redis client for OTP cache, rate limits, BullMQ later.
 * If REDIS_URL is unset, returns null (caller should no-op or skip caching).
 */
export function getRedis(): RedisClientType | null {
  const url = getEnv().REDIS_URL;
  if (!url) return null;
  if (!client) {
    client = createClient({ url });
    client.on("error", (err) => {
      console.error("[redis] Client error:", err);
    });
  }
  return client;
}

export async function connectRedis(): Promise<RedisClientType | null> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[redis] REDIS_URL not set; skipping Redis connect");
    return null;
  }
  if (!redis.isOpen) {
    await redis.connect();
    console.info("[redis] Connected");
  }
  return redis;
}
