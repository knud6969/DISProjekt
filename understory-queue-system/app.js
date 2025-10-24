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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/queue/status", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "queue.html"));
  });  
app.use(helmet());
app.use(morgan("dev"));
app.use(limiter);

// Routes
app.use("/queue", queueRoutes);

// Error-handler (skal være sidst)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server kører på port ${PORT}`));
