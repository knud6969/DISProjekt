// src/workers/queueWorker.js
import { markReadyBatch } from "../models/queueModel.js";
import redis from "../config/redisClient.js";

// --- Ny, glattere logik ---
const CYCLE_INTERVAL_MS = 1000; // hvert sekund
const USERS_PER_CYCLE = 1;      // 1 bruger ad gangen

async function runCycle() {
  if (redis.status !== "ready") {
    console.warn("⚠️ Redis ikke klar – springer iteration over");
    return;
  }

  try {
    const readyUsers = await markReadyBatch(USERS_PER_CYCLE);
    const waiting = await redis.zcard("queue:pending");

    if (readyUsers.length > 0) {
      console.log(`✅ Flyttede ${readyUsers.length} bruger(e) til READY. ${waiting} tilbage i køen.`);
    } else {
      console.log(`⌛ Ingen nye brugere at flytte. ${waiting} stadig i køen.`);
    }
  } catch (err) {
    console.error("❌ Worker fejl:", err);
  }
}

export function startQueueWorker() {
  console.log(`🚀 Worker startet – flytter ${USERS_PER_CYCLE} bruger hvert ${CYCLE_INTERVAL_MS / 1000} sekund.`);
  setInterval(runCycle, CYCLE_INTERVAL_MS);
}