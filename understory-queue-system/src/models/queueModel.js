import { redis } from "../config/redisClient.js";

const QUEUE_KEY = "user_queue";

export async function addToQueue(userId) {
  await redis.rpush(QUEUE_KEY, userId);
  return await redis.llen(QUEUE_KEY);
}

export async function getUserPosition(userId) {
  const list = await redis.lrange(QUEUE_KEY, 0, -1);
  const index = list.indexOf(userId);
  return index === -1 ? null : index + 1;
}
