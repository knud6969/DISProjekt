import { validationResult } from "express-validator";
import {
  addToQueue,
  getUserPosition,
  getQueueLength
} from "../models/queueModel.js";

/**
 * POST /queue/join
 * Tilføjer en bruger til køen.
 * Returnerer position + redirectUrl (hvor brugeren skal ende efter køen)
 */
export async function joinQueue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("⚠️ Valideringsfejl i joinQueue:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      console.warn("⚠️ userId mangler i body:", req.body);
      return res.status(400).json({ error: "userId mangler" });
    }

    console.log(`📩 Modtog /queue/join request med userId: ${userId}`);

    // Midlertidig redirect til Understorys hjemmeside
    const redirectUrl = "https://understory.dk";

    // Tilføj til Redis-kø med redirectUrl
    const position = await addToQueue(userId, redirectUrl);

    console.log(`🟢 Bruger ${userId} tilføjet som nr. ${position} i køen`);

    res.json({ position, redirectUrl });
  } catch (err) {
    console.error("❌ Fejl i joinQueue:", err);
    res.status(500).json({ error: "Serverfejl ved køtilmelding" });
  }
}

/**
 * GET /queue/status/:userId
 * Returnerer aktuel position i køen og estimeret ventetid.
 */
export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    console.log(`🔍 Forespørger status for bruger: ${userId}`);

    const position = await getUserPosition(userId);
    if (position === null) {
      console.warn(`⚠️ Bruger ${userId} findes ikke i køen`);
      return res.status(404).json({ error: "Bruger findes ikke i køen" });
    }

    const queueLength = await getQueueLength();
    const ahead = position - 1;
    const estTime = ahead * 5; // Simuleret ventetid (5 sek pr. bruger)

    console.log(
      `📊 Køstatus: Bruger ${userId} er nr. ${position} (${ahead} foran, est. ${estTime}s)`
    );

    res.json({ position, ahead, estTime });
  } catch (err) {
    console.error("❌ Fejl i getQueueStatus:", err);
    res.status(500).json({ error: "Serverfejl ved statusforespørgsel" });
  }
}
