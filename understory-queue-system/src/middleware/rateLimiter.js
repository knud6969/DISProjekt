// src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redisClient.js";

// Din droplet + localhost whitelisting → stopper limiter under loadtest
const WHITELIST = new Set([
  "138.68.76.114", // Droplet selv
  "::1",
  "127.0.0.1"
]);

function skipIfWhitelisted(req) {
  return WHITELIST.has(req.ip);
}

const BLOCK_TIME_SECONDS = 60 * 15; 
const STRIKE_THRESHOLD = 5;

// --- Strike registration
async function recordStrike(ip) {
  const key = `ip:strikes:${ip}`;
  const strikes = await redis.incr(key);
  if (strikes === 1) await redis.expire(key, BLOCK_TIME_SECONDS);
  return strikes;
}

// --- IP ban check
export async function ipBanCheck(req, res, next) {
  if (WHITELIST.has(req.ip)) return next();
  const banned = await redis.get(`ip:ban:${req.ip}`);
  if (banned) {
    return res.status(429).json({ error: "IP temporarily banned" });
  }
  next();
}

// --- On-rate-limit handler
async function ipBanAfterStrike(req, res, next) {
  if (WHITELIST.has(req.ip)) return next();
  const strikes = await recordStrike(req.ip);
  if (strikes >= STRIKE_THRESHOLD) {
    await redis.set(`ip:ban:${req.ip}`, 1, "EX", BLOCK_TIME_SECONDS);
    return res.status(429).json({ error: "Too many requests – IP banned" });
  }
  next();
}

// --- Loadtest-friendly limits
const JOIN_MAX = Number(process.env.JOIN_LIMIT_PER_MIN || 20000); 
const STATUS_MAX = Number(process.env.STATUS_LIMIT_PER_MIN || 60000);

// --- Join limiter
export const joinLimiter = rateLimit({
  windowMs: 60_000,
  max: JOIN_MAX,
  skip: skipIfWhitelisted,    // gør loadtest mulig
  standardHeaders: true,
  legacyHeaders: false,
  handler: ipBanAfterStrike,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
});

// --- Status limiter
export const statusLimiter = rateLimit({
  windowMs: 60_000,
  max: STATUS_MAX,
  skip: skipIfWhitelisted,    // gør loadtest mulig
  standardHeaders: true,
  legacyHeaders: false,
  handler: ipBanAfterStrike,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
});