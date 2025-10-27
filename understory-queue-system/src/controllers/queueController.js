import { validationResult } from "express-validator";
import {
  addToQueue,
  getUserPosition,
  getQueueLength,
} from "../models/queueModel.js";
import { getIO } from "../config/socketInstance.js";

export async function joinQueue(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId mangler" });

  const redirectUrl = "https://understory.dk";
  const position = await addToQueue(userId, redirectUrl);
  const queueLength = await getQueueLength();

  const io = getIO();
  const list = await redis.lrange("user_queue", 0, -1);
  const queue = list.map((x, i) => {
    const u = JSON.parse(x);
    return { id: u.id, position: i + 1 };
  });
  io.emit("queue:fullUpdate", queue);
  io.emit("queue:update", {
    type: "joined",
    userId,
    position,
    queueLength,
  });

  res.json({ position });
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
    console.error("❌ Fejl i getQueueStatus:", err);
    res.status(500).json({ error: "Serverfejl ved statusforespørgsel" });
  }
}
