// src/models/queueModel.js
import { redis } from "../config/redisClient.js";

const QUEUE_KEY = "user_queue";

export async function addToQueue(userId, redirectUrl) {
  const user = JSON.stringify({ id: userId, joinedAt: Date.now(), redirectUrl });
  await redis.rpush(QUEUE_KEY, user);
  return await redis.llen(QUEUE_KEY); // returner placering
}

export async function getUserPosition(userId) {
  const list = await redis.lrange(QUEUE_KEY, 0, -1);
  const index = list.findIndex((item) => JSON.parse(item).id === userId);
  return index === -1 ? null : index + 1;
}

export async function getQueueLength() {
  return await redis.llen(QUEUE_KEY);
}
