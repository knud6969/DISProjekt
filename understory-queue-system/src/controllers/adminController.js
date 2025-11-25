// src/controllers/adminController.js
import dotenv from "dotenv";
dotenv.config();

// Importer service til at sende SMS
import { sendStatusSms } from "../services/adminService.js";

// Vis admin login-side
export function showLogin(req, res) {
  res.sendFile("admin-login.html", { root: "public/html" });
}

// Håndter admin login
export function handleLogin(req, res) {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASS;

  if (password.trim() !== correct) {
    console.warn("Forkert admin-adgangskode");
    return res.redirect("/admin/login?error=wrongpass");
  }

  req.session.isAdmin = true;
  req.session.save(() => {
    console.log("Admin logget ind:", req.sessionID);
    res.redirect("/admin");
  });
}

// Render admin dashboard
export function renderDashboard(req, res) {
  res.sendFile("admin.html", { root: "public/html" });
}

// Håndter admin logout
export function handleLogout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
}

// Send SMS med køstatus
export async function sendSmsStatus(req, res) {
  try {
    const { queueLength, avgWait, totalUsers } = req.body;

    const result = await sendStatusSms({ queueLength, avgWait, totalUsers });

    return res.json({ ok: true, sid: result.sid });
  } catch (err) {
    console.error("SMS fejl:", err.message);
    res.status(500).json({ error: "Kunne ikke sende SMS" });
  }
}