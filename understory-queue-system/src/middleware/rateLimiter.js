import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "For mange forespørgsler – prøv igen senere.",
});
