// src/routes/adminRoutes.js
import express from "express";
import { requireLogin } from "../middleware/authMiddleware.js";
import {
  showLogin,
  handleLogin,
  renderDashboard,
  handleLogout,
  sendSmsStatus,
} from "../controllers/adminController.js";

const router = express.Router();

// Login pages
router.get("/login", showLogin);
router.post("/login", express.urlencoded({ extended: true }), handleLogin);

// Protected dashboard
router.get("/", requireLogin, renderDashboard);

// Logout
router.get("/logout", handleLogout);

// SMS endpoint (protected)
router.post("/send-sms", requireLogin, express.json(), sendSmsStatus);

export default router;