// src/models/queueModel.js
import { redis } from "../config/redisClient.js";

const PENDING_ZSET = "queue:pending";
const READY_SET    = "queue:ready";
const USER_HASH    = (id) => `queue:user:${id}`;

// Throughput: 10 pr. 20 sek. => 0,5/sek
const USERS_PER_BATCH = 10;

export async function enqueueIfAbsent(userId, redirectUrl) {
  const now = Date.now();

  // Idempotent tilmelding: kun hvis ikke findes i pending i forvejen
  const added = await redis.zadd(PENDING_ZSET, "NX", now, userId);
  // added = 1 hvis nyt medlem, 0 hvis allerede findes

  // Sæt/overstyr altid brugerens metadata (ufarligt, billigt)
  await redis.hset(USER_HASH(userId), {
    status: added ? "pending" : await redis.hget(USER_HASH(userId), "status") || "pending",
    joinedAt: await redis.hget(USER_HASH(userId), "joinedAt") || now,
    redirectUrl: redirectUrl || (await redis.hget(USER_HASH(userId), "redirectUrl")) || "",
  });

  // Returnér aktuel position (1-indexeret) eller 1 hvis lige tilføjet og var tom
  const rank = await redis.zrank(PENDING_ZSET, userId);
  return (rank === null ? 1 : rank + 1);
}

export async function getStatus(userId) {
  const data = await redis.hgetall(USER_HASH(userId));
  if (!data || !data.status) return { exists: false };

  if (data.status === "ready") {
    return { exists: true, status: "ready", redirectUrl: data.redirectUrl || "" };
  }

  // pending → beregn position via ZRANK
  const rank = await redis.zrank(PENDING_ZSET, userId);
  if (rank === null) {
    // Ikke i pending (kan være served/ready udløbet, osv.)
    return { exists: true, status: data.status, position: null, etaSeconds: null };
  }
  const position = rank + 1;
  const usersAhead = position - 1;
  // 10/20s => 0,5 pr. sek => 2 sek pr. bruger
  const etaSeconds = usersAhead * 2;
  return { exists: true, status: "pending", position, ahead: usersAhead, etaSeconds };
}

export async function markReadyBatch(count = USERS_PER_BATCH) {
  // Pop 'count' ældste fra pending (FIFO gennem score=joinedAt)
  const popped = await redis.zpopmin(PENDING_ZSET, count);
  // ioredis returnerer array [member1, score1, member2, score2, ...]
  const userIds = [];
  for (let i = 0; i < popped.length; i += 2) {
    userIds.push(popped[i]);
  }
  if (userIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const uid of userIds) {
    pipeline.hset(USER_HASH(uid), { status: "ready" });
    pipeline.sadd(READY_SET, uid);
  }
  await pipeline.exec();

  return userIds;
}

// Valgfrit: Engangstoken flow
import crypto from "crypto";
export async function issueOneTimeToken(userId, ttlSeconds = 120) {
  const token = crypto.randomBytes(16).toString("hex");
  await redis.set(`queue:token:${token}`, userId, "EX", ttlSeconds);
  return token;
}

export async function claimToken(token) {
  const key = `queue:token:${token}`;
  const uid = await redis.get(key);
  if (!uid) return null;
  await redis.del(key);
  const user = await redis.hgetall(USER_HASH(uid));
  return { userId: uid, redirectUrl: user.redirectUrl || "" };
}
