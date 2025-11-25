// src/routes/queueRoutes.js
// Importer nødvendige moduler og controllere
import { Router } from "express";
import { joinQueue, getQueueStatus, claim } from "../controllers/queueController.js";
import { forceReady } from "../controllers/queueController.js";
import { joinLimiter, statusLimiter, ipBanCheck } from "../middleware/rateLimiter.js";
import { validateJoin, validateTokenParam } from "../middleware/validateQueue.js";

// Opret router og definer ruter
const router = Router();

// Test endpoint til at tvinge en bruger til "ready" status
router.post("/force-ready/:userId", forceReady);

// POST /queue/join med rate limiting og IP-ban kontrol
router.post("/join", ipBanCheck, joinLimiter, validateJoin, joinQueue);

// GET /queue/claim/:token med token-validering
router.get("/claim/:token", validateTokenParam, claim);

// GET /queue/status/:userId med rate limiting og IP-ban kontrol
router.get("/status/:userId", ipBanCheck, statusLimiter, getQueueStatus);


export default router;
