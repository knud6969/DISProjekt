// src/workers/queueWorker.js
import { markReadyBatch } from "../models/queueModel.js";

const BATCH_INTERVAL_MS = 20_000; // 20 sek
const USERS_PER_BATCH   = 10;

async function runBatchOnce() {
  try {
    const readyUsers = await markReadyBatch(USERS_PER_BATCH);
    if (readyUsers.length > 0) {
      console.log(`✅ Marked ready: ${readyUsers.join(", ")}`);
    }
  } catch (err) {
    console.error("❌ Fejl i batch-process:", err);
  }
}

export function startQueueWorker() {
  console.log("🧮 Queue worker starter...");
  setInterval(runBatchOnce, BATCH_INTERVAL_MS);
}
