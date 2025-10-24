import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { enqueue, getPosition } from "./services/queueService.js";

dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// --- ROUTES ---

// Tilføj bruger til køen
app.post("/queue/join", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId mangler" });

  try {
    const position = await enqueue(userId);
    res.json({ position });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fejl ved køtilmelding" });
  }
});

// Hent status
app.get("/queue/status/:userId", async (req, res) => {
  try {
    const position = await getPosition(req.params.userId);
    res.json({ position });
  } catch (err) {
    res.status(500).json({ error: "Kunne ikke hente køstatus" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveren kører på port ${PORT}`));
