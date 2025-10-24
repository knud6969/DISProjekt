import { validationResult } from "express-validator";
import { addToQueue, getUserPosition, getQueueLength } from "../models/queueModel.js";

export async function joinQueue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId } = req.body;
    const position = await addToQueue(userId);
    res.json({ position });
  } catch (err) {
    console.error("Fejl i joinQueue:", err);
    res.status(500).json({ error: "Serverfejl ved køtilmelding" });
  }
}

export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    const position = await getUserPosition(userId);
    if (position === null)
      return res.status(404).json({ error: "Bruger findes ikke i køen" });

    const queueLength = await getQueueLength();
    const ahead = position - 1;
    const estTime = ahead * 5;

    res.json({ position, ahead, estTime });
  } catch (err) {
    console.error("Fejl i getQueueStatus:", err);
    res.status(500).json({ error: "Serverfejl ved statusforespørgsel" });
  }
}
