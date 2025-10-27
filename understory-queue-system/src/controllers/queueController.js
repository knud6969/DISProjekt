// src/controllers/queueController.js
import { enqueueIfAbsent, getStatus, issueOneTimeToken, claimToken } from "../models/queueModel.js";
// TEST ONLY: Force a user ready (remove in production)
import { redis } from "../config/redisClient.js";

export async function forceReady(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId mangler" });

    await redis.hset(`queue:user:${userId}`, { status: "ready", redirectUrl: process.env.QUEUE_REDIRECT_URL || "" });
    return res.json({ ok: true, forced: userId });
  } catch (e) {
    console.error("forceReady error:", e);
    return res.status(500).json({ error: "forceReady serverfejl" });
  }
}

const REDIRECT_URL = process.env.QUEUE_REDIRECT_URL || "https://lamineyamalerenwanker.app";

export async function joinQueue(req, res) {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId mangler" });

    const position = await enqueueIfAbsent(userId, REDIRECT_URL);
    return res.status(201).json({ ok: true, position });
  } catch (err) {
    console.error("joinQueue error:", err);
    return res.status(500).json({ error: "Serverfejl ved join" });
  }
}

export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId mangler" });

    const st = await getStatus(userId);
    if (!st.exists) return res.status(404).json({ error: "Bruger ikke fundet" });

    if (st.status === "ready") {
      // (Valgfrit) engangstoken for sikker redirect
      const token = await issueOneTimeToken(userId);
      return res.json({ ready: true, token, redirectUrl: st.redirectUrl });
    }

    return res.json({
      ready: false,
      position: st.position,
      ahead: st.ahead,
      etaSeconds: st.etaSeconds
    });
  } catch (err) {
    console.error("getQueueStatus error:", err);
    return res.status(500).json({ error: "Serverfejl ved status" });
  }
}

export async function claim(req, res) {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: "token mangler" });

    const result = await claimToken(token);
    if (!result) return res.status(410).json({ error: "Token ugyldig eller udløbet" });

    // Server-side 302 redirect – eller returnér URL til klienten
    return res.redirect(302, result.redirectUrl);
  } catch (err) {
    console.error("claim error:", err);
    return res.status(500).json({ error: "Serverfejl ved claim" });
  }
}
