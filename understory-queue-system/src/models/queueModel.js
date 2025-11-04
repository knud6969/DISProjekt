// src/models/queueModel.js
import redis from "../config/redisClient.js";
import crypto from "crypto";

const PENDING_ZSET = "queue:pending";
const READY_SET = "queue:ready";
const USER_HASH = (id) => `queue:user:${id}`;
const USERS_PER_BATCH = 10;

// Tilføjelse af bruger til kø (kun én gang)
export async function enqueueIfAbsent(userId, redirectUrl) {
  try {
    const now = Date.now();
    const existingStatus = await redis.hget(USER_HASH(userId), "status");
    const alreadyReady = existingStatus === "ready";
    if (alreadyReady) return 0; // trigger redirect

    const added = await redis.zadd(PENDING_ZSET, "NX", now, userId);

    await redis.hset(USER_HASH(userId), {
      status: added ? "pending" : existingStatus || "pending",
      joinedAt: (await redis.hget(USER_HASH(userId), "joinedAt")) || now,
      redirectUrl: redirectUrl || (await redis.hget(USER_HASH(userId), "redirectUrl")) || "",
    });

    const rank = await redis.zrank(PENDING_ZSET, userId);
    return rank === null ? 1 : rank + 1;
  } catch (err) {
    console.error("enqueueIfAbsent error:", err);
    throw err;
  }
}

// Hent status for bruger i køen
export async function getStatus(userId) {
  try {
    const data = await redis.hgetall(USER_HASH(userId));
    if (!data || !data.status) return { exists: false };

    if (data.status === "ready") {
      return { exists: true, status: "ready", redirectUrl: data.redirectUrl || "" };
    }

    const rank = await redis.zrank(PENDING_ZSET, userId);
    if (rank === null) {
      return { exists: true, status: data.status, position: null, etaSeconds: null };
    }

    const position = rank + 1;
    const usersAhead = position - 1;
    const etaSeconds = usersAhead * 2;

    return { exists: true, status: "pending", position, ahead: usersAhead, etaSeconds };
  } catch (err) {
    console.error("getStatus error:", err);
    return { exists: false, error: err.message };
  }
}

// Marker næste batch som klar
export async function markReadyBatch(count = USERS_PER_BATCH) {
  try {
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
  } catch (err) {
    console.error("markReadyBatch error:", err);
    return [];
  }
}

// Engangs-token til adgang
export async function issueOneTimeToken(userId, ttlSeconds = 120) {
  try {
    const token = crypto.randomBytes(16).toString("hex");
    await redis.set(`queue:token:${token}`, userId, "EX", ttlSeconds);
    return token;
  } catch (err) {
    console.error("issueOneTimeToken error:", err);
    throw err;
  }
}

// Valider og brug engangstoken
export async function claimToken(token) {
  try {
    const key = `queue:token:${token}`;
    const userId = await redis.get(key);
    if (!userId) return null;

    // Slet token efter brug (engang)
    await redis.del(key);

    // Hent brugerdata fra Redis
    const data = await redis.hgetall(USER_HASH(userId));

    // Fjern brugeren fra READY_SET, så de ikke poppes igen
    await redis.srem(READY_SET, userId);

    // ✅ Garanter altid redirectUrl med fallback
    const redirectUrl =
      data.redirectUrl ||
      process.env.QUEUE_REDIRECT_URL ||
      "https://lamineyamalerenwanker.app/done";

    return { userId, redirectUrl };
  } catch (err) {
    console.error("claimToken error:", err);
    return null;
  }
}