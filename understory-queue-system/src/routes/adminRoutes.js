import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Middelware til at beskytte dashboardet
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect("/admin/login");
}

// GET login-side
router.get("/login", (req, res) => {
  res.sendFile("admin-login.html", { root: "public/html" });
});

router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { password } = req.body;
    console.log("🔑 POST /admin/login — password:", password);
  
    if (password === process.env.ADMIN_PASS) {
      req.session.isAdmin = true;
      console.log("✅ Admin logget ind — session ID:", req.session.id);
      console.log("Session object:", req.session);
      return res.redirect("/admin/dashboard");
    } else {
      console.warn("❌ Forkert adgangskode");
      return res.redirect("/admin/login?error=wrongpass");
    }
  });

// Beskyttet dashboard
router.get("/dashboard", requireLogin, (req, res) => {
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