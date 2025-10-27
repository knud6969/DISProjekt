export function errorHandler(err, _req, res, _next) {
  console.error("💥 Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Uventet serverfejl",
  });
}
