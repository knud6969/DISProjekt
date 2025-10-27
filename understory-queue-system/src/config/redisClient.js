// src/config/redisClient.js
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 5,
  enableOfflineQueue: true,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on("connect", () => console.log("✅ Forbundet til Redis"));
redis.on("ready", () => console.log("🧠 Redis er klar"));
redis.on("error", (err) => console.error("❌ Redis-fejl:", err.message));
redis.on("end", () => console.warn("⚠️  Forbindelsen til Redis lukket"));
