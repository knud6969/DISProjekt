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

// ---------- OPSÆT SERVER OG SOCKET.IO ----------
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocketIO(io); // gør io globalt tilgængelig via getIO()

// ---------- PATHS ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- CORE MIDDLEWARE ----------
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
app.use(limiter);

// ---------- STATISKE FILER ----------
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/html", express.static(path.join(__dirname, "public/html")));

// ---------- HTML ROUTES ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

app.get("/queue/status", checkQueueAccess, (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "queue.html"));
});

// ---------- API ROUTES ----------
app.use("/queue", queueRoutes);

// ---------- FEJLHÅNDTERING ----------
app.use(errorHandler);

// ---------- SOCKET.IO EVENTS ----------
io.on("connection", (socket) => {
  console.log("🟢 Ny Socket.IO-forbindelse:", socket.id);
  socket.emit("connected", { message: "Forbundet til køsystemet" });

  socket.on("disconnect", () => {
    console.log("🔴 Socket frakoblet:", socket.id);
  });
});

// ---------- START SERVER OG WORKER ----------
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Test at Redis er tilgængelig
    await redis.ping();
    console.log("🧠 Redis forbindelse verificeret via ping()");

    // Start Socket.IO worker
    startQueueWorker(io);

    // Start Express-serveren
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server kører på port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Kunne ikke starte server:", err);
    process.exit(1);
  }
})();
