// src/middleware/validateQueue.js
// Middleware til validering af kø-relaterede requests
import { body, param, validationResult } from "express-validator";

// Validering for /queue/join endpoint
export const validateJoin = [
  body("userId")
    .isUUID()
    .withMessage("userId skal være et gyldigt UUID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("⚠️ Valideringsfejl:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Validering for /queue/status/:userId endpoint
export const validateTokenParam = [
  param("token")
    .isLength({ min: 10 })
    .withMessage("Ugyldigt token-format"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("⚠️ Token-valideringsfejl:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];