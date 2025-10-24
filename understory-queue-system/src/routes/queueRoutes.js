import express from "express";
import { body } from "express-validator";
import { joinQueue, getQueueStatus } from "../controllers/queueController.js";

const router = express.Router();

router.post("/join", body("userId").isString().notEmpty(), joinQueue);
router.get("/status/:userId", getQueueStatus);

export default router;
