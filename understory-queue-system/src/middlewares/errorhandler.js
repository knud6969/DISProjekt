export function errorHandler(err, req, res, next) {
    console.error("🛑 Uventet fejl:", err);
    res.status(500).json({ error: "Noget gik galt på serveren." });
  }
  