import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();
export const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => console.log("✅ Forbundet til Redis"));
redis.on("error", (err) => console.error("❌ Redis fejl:", err));
