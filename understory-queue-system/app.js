import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import "express-async-errors";

import { limiter } from "./src/middleware/rateLimiter.js";
import { errorHandler } from "./src/middleware/errorhandler.js";
import { initSocketIO } from "./src/config/socketInstance.js";
import { redis } from "./src/config/redisClient.js";
import queueRoutes from "./src/routes/queueRoutes.js";
import { startQueueWorker } from "./src/workers/queueWorker.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocketIO(io);

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core middleware
app.use(express.json({ limit: "256kb" }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    hsts: true,
  })
);
app.use(morgan("combined"));
app.use(limiter);

// Statics
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/html", express.static(path.join(__dirname, "public/html")));

// HTML routes
app.get("/", (_req, res) =>
  res.sendFile(path.join(__dirname, "public/html", "index.html"))
);
app.get("/favicon.ico", (_req, res) => res.status(204).end()); // undgå 404 spam

// 📄 Køstatus-side
app.get("/queue/status", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "queue.html"));
});

// API
app.use("/queue", queueRoutes);

// Error handler (skal ligge sidst)
app.use(errorHandler);

// Socket.IO debug
io.on("connection", (socket) => {
  console.log("🟢 Socket.IO connected:", socket.id);
  socket.emit("connected", { message: "Forbundet til køsystemet" });
  socket.on("disconnect", (reason) =>
    console.log("🔴 Socket disconnected:", socket.id, reason)
  );
});

const PORT = process.env.PORT || 3000;

// Boot
(async () => {
  try {
    // Verificér Redis
    const pong = await redis.ping();
    console.log("🧠 Redis ping:", pong);

    // Start worker (kører 1 interval globalt)
    startQueueWorker();

    // Start HTTP server
    server.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server kører på port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Startup-fejl:", err);
    process.exit(1);
  }
})();
