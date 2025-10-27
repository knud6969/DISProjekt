import { redis } from "../config/redisClient.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

async function processQueue() {
  const userData = await redis.lpop(QUEUE_KEY);

  if (!userData) {
    console.log("⏸️ Ingen brugere i køen lige nu");
    return;
  }

  const user = JSON.parse(userData);
  console.log(`🎟️ Behandler ${user.id} (joined: ${new Date(user.joinedAt).toLocaleTimeString()})`);

  // Simulér behandlingstid (f.eks. 5 sek.)
  await new Promise(resolve => setTimeout(resolve, 5000));

  await redis.rpush(SERVED_KEY, JSON.stringify(user));
  console.log(`✅ ${user.id} er færdig – redirectUrl: ${user.redirectUrl}`);
}

setInterval(processQueue, 5000);
