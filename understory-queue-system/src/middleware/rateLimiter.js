import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redisClient.js";

// Store IP strikes to allow temp banning
const BLOCK_TIME_SECONDS = 60 * 15; // 15 min ban
const STRIKE_THRESHOLD = 5; // 5 rate limit violations before ban

async function recordStrike(ip) {
  const key = `ip:strikes:${ip}`;
  const strikes = await redis.incr(key);
  if (strikes === 1) {
    await redis.expire(key, BLOCK_TIME_SECONDS); // auto clear
  }
  return strikes;
}

export async function ipBanCheck(req, res, next) {
  const ip = req.ip;
  const banned = await redis.get(`ip:ban:${ip}`);
  if (banned) {
    return res.status(429).json({ error: "IP temporarily banned" });
  }
  next();
}

export async function ipBanAfterStrike(req, res, next) {
  const ip = req.ip;
  const strikes = await recordStrike(ip);
  if (strikes >= STRIKE_THRESHOLD) {
    await redis.set(`ip:ban:${ip}`, 1, "EX", BLOCK_TIME_SECONDS);
    return res.status(429).json({ error: "Too many requests – IP banned temporarily" });
  }
  next();
}

// High-limit for /queue/join (bursty allowed)
export const joinLimiter = rateLimit({
  windowMs: 60_000, // 1 min
  max: 1200,        // allow 20 req/sec per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: ipBanAfterStrike,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
});

// Low-limit for /queue/status
export const statusLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,          // 1 req/sec average
  standardHeaders: true,
  legacyHeaders: false,
  handler: ipBanAfterStrike,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
});
