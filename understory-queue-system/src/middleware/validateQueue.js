// src/middleware/validateQueue.js
import { body, param, validationResult } from "express-validator";

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