import { validationResult } from "express-validator";
import { addToQueue, getUserPosition } from "../models/queueModel.js";

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
    const position = await getUserPosition(req.params.userId);
    if (position === null)
      return res.status(404).json({ error: "Bruger findes ikke i køen" });

    res.json({ position });
  } catch (err) {
    console.error("Fejl i getQueueStatus:", err);
    res.status(500).json({ error: "Serverfejl ved statusforespørgsel" });
  }
}
