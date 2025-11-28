// src/services/adminService.js

// Importer nødvendige moduler
import dotenv from "dotenv";
import twilio from "twilio";
import { getTodayMetrics } from "./metricsService.js";

// Indlæs miljøvariabler
dotenv.config();

// Initialiser Twilio-klienten
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Funktion til at sende status-SMS til admin
export async function sendStatusSms() {
  // Hent dagens metrics fra SQLite
  const { joins, completed, queueLength, avgWait } = await getTodayMetrics();

const text = `Understory status (i dag):
- Kølængde lige nu: ${queueLength}
- Totale brugere i dag: ${joins}
- Færdigbehandlede: ${completed}
- Gns. ventetid: ${avgWait ?? 'N/A'} sek`;

  const msg = await client.messages.create({
    body: text,
    messagingServiceSid: process.env.TWILIO_SERVICE_SID,
    to: process.env.ADMIN_PHONE,
  });

  return msg;
}