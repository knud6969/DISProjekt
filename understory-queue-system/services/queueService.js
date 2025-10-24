import { redis } from "./redisClient.js";

const QUEUE_KEY = "user_queue";

export async function enqueue(userId) {
  await redis.rpush(QUEUE_KEY, userId);
  const position = await redis.llen(QUEUE_KEY);
  return position;
}

export async function getPosition(userId) {
  const list = await redis.lrange(QUEUE_KEY, 0, -1);
  const index = list.indexOf(userId);
  return index === -1 ? null : index + 1;
}
