import { redis } from "../config/redisClient.js";
import { getIO } from "../config/socketInstance.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

async function processQueue() {
  const io = getIO();
  const userData = await redis.lpop(QUEUE_KEY);

  if (!userData) {
    io.emit("queue:update", { type: "idle" });
    return;
  }

  const user = JSON.parse(userData);
  console.log(`🎟️ Behandler bruger: ${user.id}`);

  // Simuler 5 sekunders behandling
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await redis.rpush(SERVED_KEY, JSON.stringify(user));
  io.emit("queue:update", {
    type: "processed",
    userId: user.id,
    redirectUrl: user.redirectUrl,
  });

  console.log(`✅ ${user.id} færdig – redirectUrl: ${user.redirectUrl}`);
}

setInterval(processQueue, 5000);
