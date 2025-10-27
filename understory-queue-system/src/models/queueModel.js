import { redis } from "../config/redisClient.js";

const QUEUE_KEY = "user_queue";

export async function addToQueue(userId, redirectUrl) {
  try {
    const user = JSON.stringify({
      id: userId,
      joinedAt: Date.now(),
      redirectUrl,
    });
    await redis.rpush(QUEUE_KEY, user);       // ioredis = små bogstaver
    const position = await redis.llen(QUEUE_KEY);
    return position;
  } catch (err) {
    console.error("❌ addToQueue fejl:", err);
    throw err;
  }
}

export async function getUserPosition(userId) {
  try {
    const list = await redis.lrange(QUEUE_KEY, 0, -1);
    for (let i = 0; i < list.length; i++) {
      try {
        const u = JSON.parse(list[i]);
        if (u.id === userId) return i + 1;
      } catch {
        // ignorér korrupt element
      }
    }
    return null;
  } catch (err) {
    console.error("❌ getUserPosition fejl:", err);
    throw err;
  }
}

export async function getQueueLength() {
  try {
    return (await redis.llen(QUEUE_KEY)) || 0;
  } catch (err) {
    console.error("❌ getQueueLength fejl:", err);
    return 0;
  }
}

export async function getFullQueue() {
  try {
    const list = await redis.lrange(QUEUE_KEY, 0, -1);
    return list.map((item, i) => {
      try {
        const u = JSON.parse(item);
        return { id: u.id, position: i + 1, redirectUrl: u.redirectUrl };
      } catch {
        return { id: "ukendt", position: i + 1 };
      }
    });
  } catch (err) {
    console.error("❌ getFullQueue fejl:", err);
    return [];
  }
}
