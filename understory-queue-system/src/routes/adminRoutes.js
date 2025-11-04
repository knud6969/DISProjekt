import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect("/admin/login");
}

// viser login-siden
router.get("/login", (req, res) => {
  res.sendFile("admin-login.html", { root: "public/html" });
});

// behandler login
router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  const { password } = req.body;
  const envPass = process.env.ADMIN_PASS;

  console.log("🔑 Bruger skrev     :", password);
  console.log("🔐 .env ADMIN_PASS  :", envPass);

  // bare for at undgå ekstra mellemrum i input
  if (password && password.trim() === envPass) {
    req.session.isAdmin = true;
    return req.session.save(() => {
      console.log("✅ Admin logget ind, redirecter til /admin");
      res.redirect("/admin");
    });
  }

  console.warn("❌ Forkert adgangskode – redirecter til login");
  return res.redirect("/admin/login?error=wrongpass");
});

// selve admin-siden
router.get("/", requireLogin, (req, res) => {
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