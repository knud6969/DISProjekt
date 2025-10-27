// src/controllers/queueController.js
import { addToQueue, getUserPosition, getQueueLength } from "../models/queueModel.js";
import { getIO } from "../config/socketInstance.js";

export async function joinQueue(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId mangler" });

  const redirectUrl = "https://lamineyamalerenwanker.app";
  try {
    const position = await addToQueue(userId, redirectUrl);
    const queueLength = await getQueueLength();

    const io = getIO();
    io.emit("queue:update", { type: "joined", userId, position, queueLength });

    return res.status(201).json({ position, queueLength });
  } catch (err) {
    console.error("❌ Fejl i joinQueue:", err);
    res.status(500).json({ error: "Serverfejl", details: err.message });
  }
}

export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    const position = await getUserPosition(userId);
    const queueLength = await getQueueLength();

    if (position === null) return res.status(404).json({ error: "Bruger ikke i køen" });

    res.json({
      position,
      ahead: position - 1,
      queueLength,
      estTime: (position - 1) * 20, // estimeret tid i sekunder
    });
  } catch (err) {
    res.status(500).json({ error: "Serverfejl ved status", details: err.message });
  }
}
