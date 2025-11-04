// src/routes/adminRoutes.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// middleware til at beskytte dashboardet
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect("/admin/login");
}

// GET /admin/login – viser login-siden
router.get("/login", (req, res) => {
  res.sendFile("admin-login.html", { root: "public/html" });
});

// POST /admin/login – tjekker password og opretter session
router.post(
  "/login",
  express.urlencoded({ extended: true }), // så req.body virker
  (req, res) => {
    const { password } = req.body;
    const correct = process.env.ADMIN_PASS;

    console.log("🔑 indtastet:", password);
    console.log("🔑 korrekt  :", correct);

    if (password !== correct) {
      console.warn("❌ Forkert admin-kode");
      return res.redirect("/admin/login?error=wrongpass");
    }

    // sæt session-flag
    req.session.isAdmin = true;

    // vigtig del: gem session før redirect
    req.session.save((err) => {
      if (err) {
        console.error("❌ Kunne ikke gemme session:", err);
        return res.redirect("/admin/login?error=session");
      }
      console.log("✅ Admin logget ind, redirecter til dashboard");
      return res.redirect("/admin/dashboard");
    });
  }
);

// beskyttet dashboard
router.get("/dashboard", requireLogin, (req, res) => {
  res.sendFile("admin.html", { root: "public/html" });
});

// logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
});

export default router;