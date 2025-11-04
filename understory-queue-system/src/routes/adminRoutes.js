// src/routes/adminRoutes.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Middelware til at beskytte admin-siden
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  console.warn("🚫 Ingen aktiv admin-session");
  return res.redirect("/admin/login");
}

// GET login-side
router.get("/login", (req, res) => {
  res.sendFile("admin-login.html", { root: "public/html" });
});

// POST login – tjek password, sæt session og redirect til /admin
router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASS;

  console.log("🔑 indtastet:", password);
  console.log("🔑 korrekt :", correct);

  if (password !== correct) {
    console.warn("❌ Forkert admin-kode");
    return res.redirect("/admin/login?error=wrongpass");
  }

  req.session.isAdmin = true;
  console.log("✅ Admin logget ind. Session ID:", req.sessionID);

  req.session.save((err) => {
    console.log("💾 Session gemt:", err || "OK");
    res.redirect("/admin"); // 👈 redirecter nu til /admin
  });
});

// BESKYTTET admin-side (tidligere “dashboard”)
router.get("/", requireLogin, (req, res) => {
  console.log("👀 /admin kaldt – session:", req.session);
  res.sendFile("admin.html", { root: "public/html" });
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
});

export default router;