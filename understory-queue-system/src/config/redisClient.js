import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 500, 10000),
  reconnectOnError: () => true,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => console.log("✅ Forbundet til Redis"));
redis.on("ready", () => console.log("🧠 Redis er klar til brug"));
redis.on("error", (err) => console.error("❌ Redis-fejl:", err.message));
redis.on("reconnecting", () => console.log("🔁 Redis forsøger at forbinde igen..."));
