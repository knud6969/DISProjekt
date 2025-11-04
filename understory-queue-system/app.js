process.on("unhandledRejection", (err) => console.error("🧯 Unhandled Rejection:", err));
process.on("uncaughtException", (err) => console.error("🧯 Uncaught Exception:", err));

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import queueRouter from "./src/routes/queueRoutes.js";
import { joinLimiter, statusLimiter } from "./src/middleware/rateLimiter.js";
import errorHandler from "./src/middleware/errorhandler.js";
import redis from "./src/config/redisClient.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import adminRouter from "./src/routes/adminRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(helmet());
app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.set("trust proxy", 1); // bag nginx

app.use(
  session({
    secret: process.env.SESSION_SECRET || "understory_secret_key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: true,        // stadig kun HTTPS
      httpOnly: true,
      sameSite: "none",    // 👈 VIGTIG ændring
      maxAge: 1000 * 60 * 30, // 30 min
    },
  })
);

app.use("/admin", adminRouter);

app.get("/healthz", async (req, res) => {
  try {
    const pong = await redis.ping();
    res.json({ ok: pong === "PONG" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Redis unreachable" });
  }
});

app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public/html/index.html")));
app.get("/done", (_, res) => res.sendFile(path.join(__dirname, "public/html/done.html")));
app.get("/queue/status", (_, res) => res.sendFile(path.join(__dirname, "public/html/queue.html")));

import { Router } from "express";
const api = Router();
api.post("/join", joinLimiter, (req, res, next) => next());
api.get("/status/:userId", statusLimiter, (req, res, next) => next());

app.use("/queue", api, queueRouter);
app.use(errorHandler); // central fejl-håndtering
app.use((_, res) => res.status(404).json({ error: "Not found" }));

const port = process.argv[2] || process.env.PORT || 3000;
app.listen(port, () => console.log(`Server kører på port ${port} [${process.env.NODE_ENV}]`));
