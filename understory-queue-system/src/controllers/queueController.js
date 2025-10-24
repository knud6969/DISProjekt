import { validationResult } from "express-validator";
import { addToQueue, getUserPosition, getQueueLength } from "../models/queueModel.js";

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

    const position = await addToQueue(userId);

    console.log(`🟢 Bruger ${userId} tilføjet som nr. ${position} i køen`);

    res.json({ position });
  } catch (err) {
    console.error("❌ Fejl i joinQueue:", err);
    res.status(500).json({ error: "Serverfejl ved køtilmelding" });
  }
}

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
    const estTime = ahead * 5;

    console.log(
      `📊 Køstatus: Bruger ${userId} er nr. ${position} (${ahead} foran, est. ${estTime}s)`
    );

    res.json({ position, ahead, estTime });
  } catch (err) {
    console.error("❌ Fejl i getQueueStatus:", err);
    res.status(500).json({ error: "Serverfejl ved statusforespørgsel" });
  }
}
