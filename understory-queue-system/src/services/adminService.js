// src/services/adminService.js

// Importer nødvendige moduler
import dotenv from "dotenv";
import twilio from "twilio";

// Indlæs miljøvariabler
dotenv.config();

// Initialiser Twilio-klienten
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Funktion til at sende status-SMS til admin
export async function sendStatusSms({ queueLength, avgWait, totalUsers }) {
  const stats = {
    queueLength: queueLength ?? Math.floor(Math.random() * 80) + 20,
    avgWait: avgWait ?? Math.floor(Math.random() * 45) + 15,
    totalUsers: totalUsers ?? 200 + Math.floor(Math.random() * 500),
  };

  const text = `Understory Status:
Kølængde: ${stats.queueLength}
Gns. ventetid: ${stats.avgWait}s
Totale brugere i dag: ${stats.totalUsers}`;

  const msg = await client.messages.create({
    body: text,
    messagingServiceSid: process.env.TWILIO_SERVICE_SID,
    to: process.env.ADMIN_PHONE,
  });

  return msg;
}