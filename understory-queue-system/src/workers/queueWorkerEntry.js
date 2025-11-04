// src/workers/queueWorkerEntry.js
process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));

import redis, { waitForReady } from "../config/redisClient.js";
import { startQueueWorker } from "./queueWorker.js";

(async () => {
  try {
    await waitForReady(8000);
    console.log("Redis ready – starter worker loop");
  } catch (e) {
    console.warn("Redis ikke klar endnu – worker starter alligevel:", e.message);
  }

  startQueueWorker();
})();