import { redis } from "../config/redisClient.js";
import { getIO } from "../config/socketInstance.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

let intervalId = null;

async function broadcastQueue() {
  try {
    const io = getIO();
    const list = await redis.lrange(QUEUE_KEY, 0, -1);
    const queue = list.map((x, i) => {
      try {
        const u = JSON.parse(x);
        return { id: u.id, position: i + 1 };
      } catch {
        return { id: "ukendt", position: i + 1 };
      }
    });
    io.emit("queue:fullUpdate", queue);
  } catch (err) {
    console.error("❌ Fejl i broadcastQueue:", err);
  }
}

async function processQueueTick() {
  const io = getIO();
  try {
    const userData = await redis.lpop(QUEUE_KEY);
    if (!userData) {
      io.emit("queue:update", { type: "idle" });
      return;
    }

    let user;
    try {
      user = JSON.parse(userData);
    } catch {
      console.warn("⚠️ Kunne ikke parse kø-element, skipper");
      return;
    }

    console.log(`🎟️ Behandler bruger: ${user.id}`);
    await new Promise((r) => setTimeout(r, 3000)); // simulér behandling

    await redis.rpush(SERVED_KEY, JSON.stringify(user));
    io.emit("queue:update", {
      type: "processed",
      userId: user.id,
      redirectUrl: user.redirectUrl,
    });

    await broadcastQueue();
  } catch (err) {
    console.error("❌ Fejl i processQueueTick:", err);
  }
}

export function startQueueWorker() {
  if (intervalId) {
    console.log("ℹ️ QueueWorker kører allerede");
    return;
  }
  console.log("⚙️ QueueWorker startet – overvåger køen...");
  // Første broadcast når worker starter
  broadcastQueue().catch((e) => console.error("❌ Første broadcast fejlede:", e));
  intervalId = setInterval(processQueueTick, 3000);
}
