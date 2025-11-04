// src/routes/adminRoutes.js
import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const router = express.Router();

// Twilio-klient
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// --- Middleware: kræver login for at se admin-dashboard
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  console.warn("Forsøg på at tilgå admin uden login");
  return res.redirect("/admin/login");
}

// --- GET /admin/login (viser login-siden)
router.get("/login", (req, res) => {
  res.sendFile("admin-login.html", { root: "public/html" });
});

// --- POST /admin/login (behandler login)
router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASS;

  console.log("🔑 Indtastet kode:", password);
  console.log("🔐 Korrekt kode:", correct);

  if (password.trim() !== correct) {
    console.warn("Forkert admin-adgangskode");
    return res.redirect("/admin/login?error=wrongpass");
  }

  req.session.isAdmin = true;
  console.log("Admin logget ind, session ID:", req.sessionID);

  req.session.save((err) => {
    if (err) console.error("⚠️  Fejl ved gemning af session:", err);
    res.redirect("/admin");
  });
});

// --- GET /admin (beskyttet dashboard)
router.get("/", requireLogin, (req, res) => {
  res.sendFile("admin.html", { root: "public/html" });
});

// --- GET /admin/logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
});

// --- POST /admin/send-sms (sender SMS til admin)
router.post("/send-sms", express.json(), async (req, res) => {
  try {
    const { queueLength, avgWait, totalUsers } = req.body;

    // Fallback mock-data hvis frontend ikke sender noget
    const stats = {
      queueLength: queueLength ?? Math.floor(Math.random() * 80) + 20,
      avgWait: avgWait ?? Math.floor(Math.random() * 45) + 15,
      totalUsers: totalUsers ?? 200 + Math.floor(Math.random() * 500),
    };

    const text = `Understory Status:
Kølængde: ${stats.queueLength}
Gns. ventetid: ${stats.avgWait}s
Totale brugere i dag: ${stats.totalUsers}`;

    console.log("Sender SMS med tekst:\n", text);

    // Sender via Messaging Service
    const message = await client.messages.create({
      body: text,
      messagingServiceSid: process.env.TWILIO_SERVICE_SID, // ✅ vigtigt
      to: process.env.ADMIN_PHONE,
    });

    console.log("SMS sendt. SID:", message.sid);
    res.json({ ok: true, sid: message.sid });
  } catch (err) {
    console.error("Twilio fejl:", err.message);
    res.status(500).json({ error: "Kunne ikke sende SMS" });
  }
});

export default router;