import { redis } from "../config/redisClient.js";
import { getIO } from "../config/socketInstance.js";

const QUEUE_KEY = "user_queue";
const SERVED_KEY = "served_users";

// 🔁 Hjælpefunktion – sender hele køen til alle forbundne klienter
async function broadcastQueue(io) {
  try {
    const list = await redis.lrange(QUEUE_KEY, 0, -1);
    const queue = list.map((item, i) => {
      const u = JSON.parse(item);
      return { id: u.id, position: i + 1 };
    });

    io.emit("queue:fullUpdate", queue);
  } catch (err) {
    console.error("❌ Fejl i broadcastQueue:", err);
  }
}

// ⚙️ Behandler næste bruger i køen
async function processQueue() {
  const io = getIO();

  try {
    const userData = await redis.lpop(QUEUE_KEY);

    if (!userData) {
      io.emit("queue:update", { type: "idle" });
      return;
    }

    const user = JSON.parse(userData);
    console.log(`🎟️ Behandler bruger: ${user.id}`);

    // Simulér behandlingstid (fx 3 sek)
    await new Promise((r) => setTimeout(r, 3000));

    // Flyt bruger til "served" liste
    await redis.rpush(SERVED_KEY, JSON.stringify(user));


    // Emit event til klienter
    io.emit("queue:update", {
      type: "processed",
      userId: user.id,
      redirectUrl: user.redirectUrl,
    });

    // Send opdateret kø
    await broadcastQueue(io);
  } catch (err) {
    console.error("❌ Fejl i processQueue:", err);

    try {
      // Hvis Redis- eller IO-fejl, forsøg at give besked til klienter
      const io = getIO();
      io.emit("queue:error", { message: err.message });
    } catch (emitErr) {
      console.warn("⚠️ Kunne ikke sende fejl via Socket.IO:", emitErr.message);
    }
  }
}

// 🧠 Start worker-loop
export async function startQueueWorker() {
  console.log("⚙️ QueueWorker startet – overvåger køen...");

  try {
    const io = getIO();
    // Send initial køstatus
    await broadcastQueue(io);

    // Kør processQueue hvert 3. sekund
    setInterval(processQueue, 3000);
  } catch (err) {
    console.error("❌ Fejl ved start af QueueWorker:", err);
  }
}
