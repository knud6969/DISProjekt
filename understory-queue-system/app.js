import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import "express-async-errors";
import { checkQueueAccess } from "./src/middleware/checkQueueAccess.js";
import queueRoutes from "./src/routes/queueRoutes.js";
import { limiter } from "./src/middleware/rateLimiter.js";
import { errorHandler } from "./src/middleware/errorhandler.js";
import { initSocketIO } from "./src/config/socketInstance.js";
import { redis } from "./src/config/redisClient.js";
import { startQueueWorker } from "./src/workers/queueWorker.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocketIO(io); // Gør Socket.IO globalt

// ---------- PATH SETUP ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    hsts: false,
  })
);
app.use(morgan("dev"));
app.use("/queue", limiter); // Kun rate limit på API, ikke static files

// ---------- STATISKE FILER ----------
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/html", express.static(path.join(__dirname, "public/html")));

// ---------- ROUTES ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "index.html"));
});
app.get("/queue/status", checkQueueAccess, (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "queue.html"));
});
app.use("/queue", queueRoutes);
app.use(errorHandler);

// ---------- SOCKET.IO ----------
io.on("connection", (socket) => {
  console.log("🟢 Socket.IO forbindelse:", socket.id);
  socket.emit("connected", { message: "Forbundet til køsystemet" });

  socket.on("disconnect", () => {
    console.log("🔴 Socket.IO frakoblet:", socket.id);
  });
});

// ---------- PORT + STARTUP ----------
const portFlagIndex = process.argv.findIndex(arg => arg === "--port");
const PORT = portFlagIndex !== -1 ? process.argv[portFlagIndex + 1] : 3000;


(async () => {
  try {
    await redis.ping();
    console.log("🧠 Redis ping: PONG");

    startQueueWorker(); // kun én gang pr. instans

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server kører på port ${PORT}, PID: ${process.pid}`);
    });
  } catch (err) {
    console.error("❌ Startup-fejl:", err);
    process.exit(1);
  }
})();

