// src/models/queueModel.js
import { redis } from "../config/redisClient.js";
import crypto from "crypto";

const PENDING_ZSET = "queue:pending";
const READY_SET    = "queue:ready";
const USER_HASH    = (id) => `queue:user:${id}`;

const USERS_PER_BATCH = 10;

export async function enqueueIfAbsent(userId, redirectUrl) {
  const now = Date.now();

  const existingStatus = await redis.hget(USER_HASH(userId), "status");
  const alreadyReady = existingStatus === "ready";

  // Hvis de allerede er ready → returner position = 0 (for at trigger redirect)
  if (alreadyReady) {
    return 0;
  }

  const added = await redis.zadd(PENDING_ZSET, "NX", now, userId);

  await redis.hset(USER_HASH(userId), {
    status: added ? "pending" : existingStatus || "pending",
    joinedAt: await redis.hget(USER_HASH(userId), "joinedAt") || now,
    redirectUrl: redirectUrl || (await redis.hget(USER_HASH(userId), "redirectUrl")) || "",
  });

  const rank = await redis.zrank(PENDING_ZSET, userId);
  return (rank === null ? 1 : rank + 1);
}

export async function getStatus(userId) {
  const data = await redis.hgetall(USER_HASH(userId));
  if (!data || !data.status) return { exists: false };

  // ✅ If ready, do NOT compute rank. Ready always wins.
  if (data.status === "ready") {
    return { exists: true, status: "ready", redirectUrl: data.redirectUrl || "" };
  }

  // Still pending → compute rank
  const rank = await redis.zrank(PENDING_ZSET, userId);
  if (rank === null) {
    return { exists: true, status: data.status, position: null, etaSeconds: null };
  }

  const position = rank + 1;
  const usersAhead = position - 1;
  const etaSeconds = usersAhead * 2;

  return { exists: true, status: "pending", position, ahead: usersAhead, etaSeconds };
}

export async function markReadyBatch(count = USERS_PER_BATCH) {
  // Atomisk pop af earliest users
  const popped = await redis.zpopmin(PENDING_ZSET, count);
  const userIds = [];
  for (let i = 0; i < popped.length; i += 2) userIds.push(popped[i]);

  if (!userIds.length) return [];

  const pipeline = redis.pipeline();
  for (const uid of userIds) {
    pipeline.hset(USER_HASH(uid), { status: "ready" });
    pipeline.sadd(READY_SET, uid);
  }
  await pipeline.exec();

  return userIds;
}

// Token-based access
export async function issueOneTimeToken(userId, ttlSeconds = 120) {
  const token = crypto.randomBytes(16).toString("hex");
  await redis.set(`queue:token:${token}`, userId, "EX", ttlSeconds);
  return token;
}

export async function claimToken(token) {
  const key = `queue:token:${token}`;
  const userId = await redis.get(key);
  if (!userId) return null;

  await redis.del(key);
  const data = await redis.hgetall(USER_HASH(userId));

  // Cleanup READY_SET (optional but cleaner)
  await redis.srem(READY_SET, userId);

  return { userId, redirectUrl: data.redirectUrl || "" };
}
