// src/controllers/queueController.js
import { enqueueIfAbsent, getStatus, issueOneTimeToken, claimToken } from "../models/queueModel.js";
import { redis } from "../config/redisClient.js";

const REDIRECT_URL = process.env.QUEUE_REDIRECT_URL || "https://lamineyamalerenwanker.app";

// Test endpoint: sæt bruger som ready manuelt
export async function forceReady(req, res) {
  try {
    const { userId } = req.params;
    await redis.hset(`queue:user:${userId}`, { status: "ready", redirectUrl: REDIRECT_URL });
    res.json({ ok: true, forced: userId });
  } catch (err) {
    console.error("❌ forceReady error:", err);
    res.status(500).json({ error: "forceReady server error" });
  }
}

// POST /queue/join
export async function joinQueue(req, res) {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId mangler" });

    const position = await enqueueIfAbsent(userId, REDIRECT_URL);
    res.status(201).json({ ok: true, position });
  } catch (err) {
    console.error("❌ joinQueue error:", err);
    res.status(500).json({ error: "joinQueue server error" });
  }
}

// GET /queue/status/:userId
export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    const st = await getStatus(userId);

    if (!st.exists) return res.status(404).json({ error: "Bruger ikke fundet" });

    if (st.status === "ready") {
      const token = await issueOneTimeToken(userId);
      return res.json({ ready: true, token, redirectUrl: st.redirectUrl });
    }

    res.json({
      ready: false,
      position: st.position,
      ahead: st.ahead,
      etaSeconds: st.etaSeconds,
    });
  } catch (err) {
    console.error("❌ getQueueStatus error:", err);
    res.status(500).json({ error: "getQueueStatus server error" });
  }
}

// GET /queue/claim/:token
export async function claim(req, res) {
  try {
    const { token } = req.params;
    const result = await claimToken(token);
    if (!result) return res.status(410).json({ error: "Token invalid/expired" });

    res.redirect(302, result.redirectUrl);
  } catch (err) {
    console.error("❌ claim error:", err);
    res.status(500).json({ error: "claim server error" });
  }
}