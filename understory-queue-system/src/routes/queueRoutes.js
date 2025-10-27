// src/routes/queueRoutes.js
import { Router } from "express";
import { joinQueue, getQueueStatus, claim } from "../controllers/queueController.js";

const router = Router();

router.post("/join", joinQueue);
router.get("/status/:userId", getQueueStatus);
router.get("/claim/:token", claim); // valgfri

export default router;
