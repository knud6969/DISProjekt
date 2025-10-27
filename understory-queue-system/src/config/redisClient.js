import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Standard til lokal udvikling hvis REDIS_URL ikke er sat
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Opret forbindelse
export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    // Vent gradvist længere ved fejl, max 10 sek
    const delay = Math.min(times * 500, 10000);
    console.warn(`🔁 Forsøger at genoprette Redis-forbindelse (om ${delay} ms)`);
    return delay;
  },
  reconnectOnError: (err) => {
    console.error("⚠️ Redis-fejl, forsøger at reconnecte:", err.message);
    return true;
  },
  maxRetriesPerRequest: null, // vigtigt ved lange køer
});

// Logging-events
redis.on("connect", () => console.log("✅ Forbundet til Redis"));
redis.on("ready", () => console.log("🧠 Redis er klar til brug"));
redis.on("error", (err) => console.error("❌ Redis-fejl:", err));
redis.on("close", () => console.warn("🔌 Redis-forbindelse lukket"));
redis.on("reconnecting", () => console.log("🔁 Redis forsøger at forbinde igen..."));

export default redis;
