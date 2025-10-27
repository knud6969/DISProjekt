import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: "For mange forespørgsler – prøv igen om lidt." }),
});
