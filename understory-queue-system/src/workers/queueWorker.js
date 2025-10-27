// src/workers/queueWorker.js
import { redis } from "../config/redisClient.js";
import { getIO } from "../config/socketInstance.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

// Hjælpefunktion – broadcaster køstatus
async function broadcastQueue(io) {
  const list = await redis.lrange(QUEUE_KEY, 0, -1);
  const queue = list.map((x, i) => {
    const u = JSON.parse(x);
    return { id: u.id, position: i + 1 };
  });
  io.emit("queue:fullUpdate", queue);
}

// Funktion der behandler 10 brugere ad gangen
async function processBatch(io) {
  const batchSize = 10;

  const batch = [];
  for (let i = 0; i < batchSize; i++) {
    const data = await redis.lpop(QUEUE_KEY);
    if (!data) break;
    batch.push(JSON.parse(data));
  }

  if (batch.length === 0) {
    io.emit("queue:update", { type: "idle" });
    return;
  }

  for (const user of batch) {
    console.log(`🎟️ Behandler ${user.id}`);
    await redis.rpush(SERVED_KEY, JSON.stringify(user));
    io.emit("queue:update", {
      type: "processed",
      userId: user.id,
      redirectUrl: user.redirectUrl,
    });
  }

  await broadcastQueue(io);
}

export function startQueueWorker() {
  const io = getIO();
  console.log("⚙️ QueueWorker startet – behandler 10 brugere hvert 20. sekund");

  setInterval(async () => {
    try {
      await processBatch(io);
    } catch (err) {
      console.error("❌ Fejl i batch-process:", err);
    }
  }, 20000); // 20 sekunder

  // Initial statusudsendelse hver 10 sek.
  setInterval(async () => {
    try {
      await broadcastQueue(io);
    } catch (err) {
      console.error("❌ Fejl i broadcastQueue:", err);
    }
  }, 10000);
}
