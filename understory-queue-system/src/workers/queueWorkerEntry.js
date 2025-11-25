// src/workers/queueWorkerEntry.js
// Starter kø-worker processen
process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));

// Importer Redis-klienten og worker-startfunktionen
import redis, { waitForReady } from "../config/redisClient.js";
import { startQueueWorker } from "./queueWorker.js";

// Vent på at Redis er klar, eller log en advarsel og start alligevel
(async () => {
  try {
    await waitForReady(8000);
    console.log("Redis ready – starter worker loop");
  } catch (e) {
    console.warn("Redis ikke klar endnu – worker starter alligevel:", e.message);
  }

  startQueueWorker();
})();