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

    if (!userId) {
      console.warn("⚠️  Ingen userId i request");
      return res.status(400).json({ error: "userId mangler" });
    }

    const st = await getStatus(userId);
    if (!st || !st.exists) {
      console.warn("⚠️  Bruger ikke fundet i køen:", userId);
      return res.status(404).json({ error: "Bruger ikke fundet" });
    }

    // ✅ Hvis brugeren er klar til adgang
    if (st.status === "ready") {
      const token = await issueOneTimeToken(userId);

      // Giv altid fallback-redirect
      const redirectUrl =
        st.redirectUrl ||
        process.env.QUEUE_REDIRECT_URL ||
        "https://lamineyamalerenwanker.app/done";

      console.log(`🎟️  Bruger ${userId} er klar – udsteder token og redirecter til ${redirectUrl}`);

      return res.status(200).json({
        ready: true,
        token,
        redirectUrl,
      });
    }

    // ✅ Hvis brugeren stadig venter i køen
    const { position, ahead, etaSeconds } = st;

    res.status(200).json({
      ready: false,
      position,
      ahead,
      etaSeconds,
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
    if (!token || token.length < 10) {
      console.warn("⚠️  Ugyldigt token modtaget:", token);
      return res.status(400).json({ error: "Ugyldigt tokenformat" });
    }

    const result = await claimToken(token);
    if (!result) {
      console.warn("⚠️  Token ikke fundet eller udløbet:", token);
      return res.status(410).json({ error: "Token invalid/expired" });
    }

    // altid fallback hvis redirectUrl mangler
    const redirectUrl =
      result.redirectUrl ||
      process.env.QUEUE_REDIRECT_URL ||
      "https://lamineyamalerenwanker.app/done";

    console.log(`➡️  Token godkendt for ${result.userId}, redirecter til ${redirectUrl}`);
    res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("❌ claim error:", err);
    res.status(500).json({ error: "claim server error" });
  }
}