import { validationResult } from "express-validator";
import {
  addToQueue,
  getUserPosition,
  getQueueLength
} from "../models/queueModel.js";

/**
 * POST /queue/join
 * Tilføjer bruger til Redis-kø.
 */
export async function joinQueue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("⚠️ Valideringsfejl:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId mangler" });
    }

    console.log(`📩 Ny /queue/join request fra ${userId}`);

    // Midlertidigt redirectmål, som bruges når brugeren "kommer igennem"
    const redirectUrl = "https://understory.dk";

    const position = await addToQueue(userId, redirectUrl);
    console.log(`🟢 ${userId} tilføjet som nr. ${position}`);

    // Returnér kun data, ingen redirect endnu
    res.json({ position, redirectUrl });
  } catch (err) {
    console.error("❌ Fejl i joinQueue:", err);
    res.status(500).json({ error: "Serverfejl ved køtilmelding" });
  }
}

/**
 * GET /queue/status/:userId
 * Returnerer position og estimeret ventetid.
 */
export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    const position = await getUserPosition(userId);
    if (position === null) {
      return res.status(404).json({ error: "Bruger findes ikke i køen" });
    }

    const queueLength = await getQueueLength();
    const ahead = position - 1;
    const estTime = ahead * 5; // sekunder pr. bruger

    res.json({ position, ahead, estTime });
  } catch (err) {
    console.error("❌ Fejl i getQueueStatus:", err);
    res.status(500).json({ error: "Serverfejl ved statusforespørgsel" });
  }
}
