// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();

import queueRouter from "./src/routes/queueRoutes.js";
import { joinLimiter, statusLimiter } from "./src/middleware/rateLimiter.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(helmet());

// --- Static files
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js",  express.static(path.join(__dirname, "public/js")));
app.use("/img", express.static(path.join(__dirname, "public/img")));

// --- Healthcheck
app.get("/healthz", async (req, res) => {
  try {
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "healthz error" });
  }
});

// --- Views (HTML pages)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/index.html"));
});

app.get("/done", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/done.html"));
});

app.get("/queue/status", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/queue.html"));
});

// --- API routes
import { Router } from "express";
const api = Router();

api.post("/join", joinLimiter, (req, res, next) => next());
api.get("/status/:userId", statusLimiter, (req, res, next) => next());

app.use("/queue", api, queueRouter);

// --- 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- Start server (one port per PM2 process)
const port = process.argv[2] || process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server lytter på http://localhost:${port}`);
});
