// src/routes/adminRoutes.js
import express from "express";
import { requireLogin } from "../middleware/authMiddleware.js";
import {
  showLogin,
  handleLogin,
  renderDashboard,
  handleLogout,
  sendSmsStatus,
  getDashboardData,
} from "../controllers/adminController.js";

const router = express.Router();

// Login pages
router.get("/login", showLogin);
router.post("/login", express.urlencoded({ extended: true }), handleLogin);

// Protected dashboard
router.get("/", requireLogin, renderDashboard);

// Dashboard data endpoint
router.get("/dashboard-data", requireLogin, getDashboardData);

// Logout
router.get("/logout", handleLogout);

// SMS endpoint (protected)
router.post("/send-sms", requireLogin, express.json(), sendSmsStatus);

export default router;