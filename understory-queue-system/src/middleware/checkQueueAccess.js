// src/middleware/checkQueueAccess.js
import { getStatus } from "../models/queueModel.js";

export async function checkQueueAccess(req, res, next) {
  try {
    const userId = req.query.userId || req.params.userId;
    if (!userId) {
      console.warn("Ingen userId i request – redirecter til forsiden");
      return res.redirect("/");
    }

    const st = await getStatus(userId);
    if (!st.exists) {
      console.warn(`Bruger ${userId} ikke i køen – redirect`);
      return res.redirect("/");
    }

    next();
  } catch (err) {
    console.error("checkQueueAccess error:", err);
    res.redirect("/");
  }
}