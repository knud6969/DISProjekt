// src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

export const joinLimiter = rateLimit({
  windowMs: 60_000,
  max: 5000, // høj rullebane for bursts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: "For mange join-forespørgsler – prøv igen." }),
});

export const statusLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,  // stram for polls (klient poller hver 30s)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: "For mange statuskald – sænk polling." }),
});
