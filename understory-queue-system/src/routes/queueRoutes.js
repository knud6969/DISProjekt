// src/routes/queueRoutes.js
import { Router } from "express";
import { joinQueue, getQueueStatus, claim } from "../controllers/queueController.js";
import { forceReady } from "../controllers/queueController.js";
import { joinLimiter, statusLimiter, ipBanCheck } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/force-ready/:userId", forceReady); // TEST ONLY
router.post("/join", ipBanCheck, joinLimiter, joinQueue);
router.get("/status/:userId", ipBanCheck, statusLimiter, getQueueStatus);
router.get("/claim/:token", claim); // valgfri

export default router;
