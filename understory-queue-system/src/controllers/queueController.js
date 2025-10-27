import { validationResult } from "express-validator";
import {
  addToQueue,
  getUserPosition,
  getQueueLength,
} from "../models/queueModel.js";
import { getIO } from "../config/socketInstance.js";
import { redis } from "../config/redisClient.js";

/**
 * POST /queue/join
 * Tilføjer en bruger til køen og udsender Socket.IO-events
 */
export async function joinQueue(req, res) {
  try {
    const { userId } = req.body;

    // Inputvalidering
    if (!userId) {
      return res.status(400).json({ error: "userId mangler i request body" });
    }

    const redirectUrl = "https://understory.dk";
    const position = await addToQueue(userId, redirectUrl);
    const queueLength = await getQueueLength();

    // 📡 Socket.IO broadcasting
    try {
      const io = getIO();

      // Hent hele køen for at sende et "full update"
      const list = await redis.lRange("user_queue", 0, -1);
      const queue = list.map((item, i) => {
        const u = JSON.parse(item);
        return { id: u.id, position: i + 1 };
      });

      io.emit("queue:fullUpdate", queue);
      io.emit("queue:update", {
        type: "joined",
        userId,
        position,
        queueLength,
      });
    } catch (socketErr) {
      console.warn("⚠️ Socket.IO ikke initialiseret:", socketErr.message);
    }

    console.log(`✅ Bruger ${userId} tilføjet til køen (pos: ${position})`);
    return res.status(201).json({ position, queueLength });
  } catch (err) {
    console.error("❌ Fejl i joinQueue:", err);
    return res.status(500).json({
      error: "Serverfejl ved tilmelding til kø",
      details: err.message,
    });
  }
}

/**
 * GET /queue/status/:userId
 * Returnerer køstatus for en bestemt bruger
 */
export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ error: "userId mangler i parametre" });

    const position = await getUserPosition(userId);

    if (position === null)
      return res.status(404).json({ error: "Bruger findes ikke i køen" });

    const queueLength = await getQueueLength();
    const ahead = position - 1;
    const estTime = ahead * 5; // fx 5 sekunder pr. person foran

    return res.json({
      position,
      ahead,
      estTime,
      queueLength,
    });
  } catch (err) {
    console.error("❌ Fejl i getQueueStatus:", err);
    return res.status(500).json({
      error: "Serverfejl ved statusforespørgsel",
      details: err.message,
    });
  }
}
