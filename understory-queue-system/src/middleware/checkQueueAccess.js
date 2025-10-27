import { getUserPosition } from "../models/queueModel.js";

/**
 * Middleware: sikrer at brugeren findes i køen før de kan se /queue/status
 */
export async function checkQueueAccess(req, res, next) {
  try {
    const userId = req.query.userId || req.params.userId;

    // Ingen brugerid → redirect til forsiden
    if (!userId) {
      console.warn("⚠️ Ingen userId i request – sender til forsiden");
      return res.redirect("/");
    }

    // Tjek om brugeren findes i Redis-køen
    const position = await getUserPosition(userId);
    if (position === null) {
      console.warn(`⚠️ Bruger ${userId} ikke i køen – redirect`);
      return res.redirect("/");
    }

    // Brugeren findes → giv adgang
    next();
  } catch (err) {
    console.error("❌ Fejl i checkQueueAccess middleware:", err);
    return res.redirect("/");
  }
}
