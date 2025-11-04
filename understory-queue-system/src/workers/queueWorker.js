// src/workers/queueWorker.js
import { markReadyBatch } from "../models/queueModel.js";
import redis from "../config/redisClient.js";

const BATCH_INTERVAL_MS = 20000; // 20 sek
const USERS_PER_BATCH = 10;

async function runBatchOnce() {
  if (redis.status !== "ready") {
    console.warn("⚠️ Redis not ready – skipping this batch");
    return;
  }

  try {
    const readyUsers = await markReadyBatch(USERS_PER_BATCH);
    const waiting = await redis.zcard("queue:pending");
    if (readyUsers.length > 0) {
      console.log(`Flyttede ${readyUsers.length} brugere til ready. ${waiting} tilbage.`);
    } else {
      console.log(`Ingen brugere at flytte. ${waiting} tilbage i køen.`);
    }
  } catch (err) {
    console.error("Worker fejl i runBatchOnce:", err);
  }
}

export function startQueueWorker() {
  console.log(`Worker startet – kører hvert ${BATCH_INTERVAL_MS / 1000} sek.`);
  setInterval(runBatchOnce, BATCH_INTERVAL_MS);
}