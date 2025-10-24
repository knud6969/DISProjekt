import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import "express-async-errors";

import queueRoutes from "./src/routes/queueRoutes.js";
import { limiter } from "./src/middleware/rateLimiter.js";
import { errorHandler } from "./src/middleware/errorhandler.js";

dotenv.config();
const app = express();

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(limiter);

// 📁 Gør dine frontend-filer tilgængelige (med undermapper)
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/html", express.static(path.join(__dirname, "public/html")));

// 🏠 Forside
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

// 📄 Køstatus-side
app.get("/queue/status", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "queue.html"));
});

// API-routes (backend)
app.use("/queue", queueRoutes);

// Global error-handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Forbundet til Redis");
  console.log(`🚀 Server kører på port ${PORT}`);
});
