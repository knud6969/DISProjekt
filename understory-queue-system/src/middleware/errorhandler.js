// src/middleware/errorhandler.js
export default function errorHandler(err, req, res, next) {
  console.error("Global fejl:", err);
  res.status(500).json({
    success: false,
    error: err?.message || "Internal server error",
  });
}
