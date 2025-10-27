import { redis } from "../config/redisClient.js";
import { getIO } from "../config/socketInstance.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

async function broadcastQueue(io) {
  const list = await redis.lrange(QUEUE_KEY, 0, -1);
  const queue = list.map((x, i) => {
    const u = JSON.parse(x);
    return { id: u.id, position: i + 1 };
  });
  io.emit("queue:fullUpdate", queue);
}

async function processQueue() {
  const io = getIO();
  const userData = await redis.lpop(QUEUE_KEY);

  if (!userData) {
    io.emit("queue:update", { type: "idle" });
    return;
  }

  const user = JSON.parse(userData);
  console.log(`🎟️ Behandler ${user.id}`);
  await new Promise((r) => setTimeout(r, 3000)); // simulér 3 sek behandling

  await redis.rpush(SERVED_KEY, JSON.stringify(user));
  io.emit("queue:update", {
    type: "processed",
    userId: user.id,
    redirectUrl: user.redirectUrl,
  });
  await broadcastQueue(io);
}

setInterval(processQueue, 3000);
