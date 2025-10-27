// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

import queueRouter from "./src/routes/queueRoutes.js";           // POST /join, GET /status/:userId, GET /claim/:token
import { joinLimiter, statusLimiter } from "./src/middleware/rateLimiter.js";
import helmet from "helmet";



const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(helmet());

// --- Statics
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js",  express.static(path.join(__dirname, "public/js")));
app.use("/img", express.static(path.join(__dirname, "public/img")));

// --- Healthcheck
app.get("/healthz", async (req, res) => {
  try {
    // Hvis du har redis client: await redis.ping();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "healthz error" });
  }
});

// --- Views (enkle HTML-filer)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/index.html"));
});

// Done-side (blank)
app.get("/done", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/done.html"));
});


// Køstatus-side (polling UI). Vi tillader query param userId i URL’en, men selve siden læses bare herfra.
app.get("/queue/status", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/queue.html"));
});

// --- API routes
// Påfør rate limits pr. endpoint (kan også gøres inde i routeren)
import { Router } from "express";
const api = Router();

api.post("/join", joinLimiter, (req, res, next) => next());    // placeholder for limiter kæde
api.get("/status/:userId", statusLimiter, (req, res, next) => next());

// Mount den rigtige router bagefter (den håndterer faktisk controllerne)
app.use("/queue", api, queueRouter);

// --- 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

import http from "http";

// De porte du vil lytte på
const PORTS = [3000, 3001, 3002, 3003, 3004, 3005];

// Start en HTTP-server pr. port med samme Express-app
PORTS.forEach((port) => {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`🚀 Server lytter på http://localhost:${port}`);
  });

  // (valgfrit) pæn nedlukning
  const shutdown = () => server.close(() => console.log(`🛑 Lukket port ${port}`));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});

