import { redis } from "../config/redisClient.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

async function processQueue() {
  const userData = await redis.lpop(QUEUE_KEY);

  if (userData) {
    const user = JSON.parse(userData);
    console.log(`🎟️ Behandler: ${user.id}`);

    // Simuler behandling (fx 3 sek)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Gem bruger som "færdigbehandlet"
    await redis.rpush(SERVED_KEY, JSON.stringify(user));
    console.log(`✅ ${user.id} er færdig og har fået adgang: ${user.redirectUrl}`);
  } else {
    console.log("⏸️ Ingen brugere i køen");
  }
}

// Tjek køen hvert 3. sekund
setInterval(processQueue, 3000);
