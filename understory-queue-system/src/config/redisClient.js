// src/config/redisClient.js
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Brug REDIS_URL hvis sat; ellers fornuftigt fallback for begge miljøer
const redisUrl =
  process.env.REDIS_URL ||
  (isProduction ? "redis://127.0.0.1:6379" : "redis://localhost:6379");

// Opret klient
const client = new Redis(redisUrl, {
  maxRetriesPerRequest: 5,
  enableOfflineQueue: true,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});

// Logging (hjælper med at se state lokalt)
client.on("connect", () => console.log(`✅ Redis connected: ${redisUrl}`));
client.on("ready",   () => console.log("🧠 Redis ready"));
client.on("error",   (err) => console.error("❌ Redis error:", err?.message || err));
client.on("end",     () => console.warn("⚠️ Redis connection closed"));

/** Hjælper: vent på 'ready' (valgfri at bruge) */
export async function waitForReady(timeoutMs = 8000) {
  if (client.status === "ready") return;
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Redis not ready in time")), timeoutMs);
    const onReady = () => { clearTimeout(t); resolve(); };
    const onError = (e) => { clearTimeout(t); reject(e); };
    client.once("ready", onReady);
    client.once("error", onError);
  });
}

// 👉 Eksporter BÅDE named og default
export const redis = client;
export default client;
