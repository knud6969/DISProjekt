import { redis } from "../config/redisClient.js";

const QUEUE_KEY = "user_queue";

/**
 * Tilføj bruger til køen
 */
export async function addToQueue(userId, redirectUrl) {
  try {
    const user = JSON.stringify({
      id: userId,
      joinedAt: Date.now(),
      redirectUrl,
    });

    await redis.rPush(QUEUE_KEY, user);
    const position = await redis.lLen(QUEUE_KEY);
    console.log(`👤 Bruger ${userId} tilføjet som nr. ${position}`);
    return position;
  } catch (err) {
    console.error("❌ Fejl i addToQueue:", err);
    throw err;
  }
}

/**
 * Find en brugers position i køen
 */
export async function getUserPosition(userId) {
  try {
    const list = await redis.lRange(QUEUE_KEY, 0, -1);
    for (let i = 0; i < list.length; i++) {
      try {
        const user = JSON.parse(list[i]);
        if (user.id === userId) return i + 1;
      } catch (parseErr) {
        console.warn("⚠️ Ugyldigt JSON-element i køen:", parseErr.message);
      }
    }
    return null;
  } catch (err) {
    console.error("❌ Fejl i getUserPosition:", err);
    throw err;
  }
}

/**
 * Hent samlet længde af køen
 */
export async function getQueueLength() {
  try {
    const len = await redis.lLen(QUEUE_KEY);
    return len || 0;
  } catch (err) {
    console.error("❌ Fejl i getQueueLength:", err);
    return 0;
  }
}

/**
 * (Ekstra) Hent hele køen i objektform – bruges af controller/worker
 */
export async function getFullQueue() {
  try {
    const list = await redis.lRange(QUEUE_KEY, 0, -1);
    return list.map((item, i) => {
      try {
        const user = JSON.parse(item);
        return { id: user.id, position: i + 1, redirectUrl: user.redirectUrl };
      } catch {
        return { id: "ukendt", position: i + 1 };
      }
    });
  } catch (err) {
    console.error("❌ Fejl i getFullQueue:", err);
    return [];
  }
}
