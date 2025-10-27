import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import "express-async-errors";

import queueRoutes from "./src/routes/queueRoutes.js";
import { limiter } from "./src/middleware/rateLimiter.js";
import { errorHandler } from "./src/middleware/errorhandler.js";
import { initSocketIO } from "./src/config/socketInstance.js";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocketIO(io); // Gør Socket.IO tilgængelig globalt

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core middleware
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    hsts: false,
  })
);
app.use(morgan("dev"));
app.use(limiter);

// 📁 Statisk frontend
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/html", express.static(path.join(__dirname, "public/html")));

// 🏠 Forside
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

// 📄 Køstatus-side
app.get("/queue/status", (req, res) => {
  const hasUser = req.query.userId; // hvis du senere vil sende ?userId=xyz
  if (!hasUser) {
    return res.redirect("/"); // sender tilbage til forsiden
  }
  res.sendFile(path.join(__dirname, "public/html", "queue.html"));
});



// API routes
app.use("/queue", queueRoutes);

// Fejlhåndtering
app.use(errorHandler);

// Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Ny Socket.IO-forbindelse:", socket.id);
  socket.emit("connected", { message: "Forbundet til køsystemet" });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server kører på port ${PORT}`);
});
