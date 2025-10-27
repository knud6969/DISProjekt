import { addToQueue, getUserPosition, getQueueLength } from "../models/queueModel.js";
import { getIO } from "../config/socketInstance.js";
import { redis } from "../config/redisClient.js";

/** POST /queue/join */
export async function joinQueue(req, res) {
  console.log("🟡 joinQueue body:", req.body);
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId mangler" });

    const redirectUrl = "https://www.youtube.com/watch?v=xvFZjo5PgG0";

    const position = await addToQueue(userId, redirectUrl);
    const queueLength = await getQueueLength();

    console.log("✅ Bruger tilføjet:", { userId, position, queueLength });

    // Broadcast uden at vælte ruten ved fejl
    try {
      const io = getIO();
      if (redis.status !== "ready") {
        console.warn("⚠️ Redis ikke klar ved broadcast");
      } else {
        const list = await redis.lrange("user_queue", 0, -1);
        const queue = list.map((x, i) => {
          try {
            const u = JSON.parse(x);
            return { id: u.id, position: i + 1 };
          } catch {
            return { id: "ukendt", position: i + 1 };
          }
        });
        io.emit("queue:fullUpdate", queue);
        io.emit("queue:update", {
          type: "joined",
          userId,
          position,
          queueLength,
        });
      }
    } catch (socketErr) {
      console.error("❌ Socket.IO fejl:", socketErr);
    }

    return res.status(201).json({ position, queueLength });
  } catch (err) {
    console.error("❌ Fanget fejl i joinQueue:", err);
    return res
      .status(500)
      .json({ error: "Serverfejl ved tilmelding til kø", details: err.message });
  }
}

/** GET /queue/status/:userId */
export async function getQueueStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId mangler i parametre" });

    const position = await getUserPosition(userId);
    if (position === null) return res.status(404).json({ error: "Bruger findes ikke i køen" });

    const queueLength = await getQueueLength();
    const ahead = position - 1;
    const estTime = ahead * 5;

    return res.json({ position, ahead, estTime, queueLength });
  } catch (err) {
    console.error("❌ Fejl i getQueueStatus:", err);
    return res
      .status(500)
      .json({ error: "Serverfejl ved statusforespørgsel", details: err.message });
  }
}
