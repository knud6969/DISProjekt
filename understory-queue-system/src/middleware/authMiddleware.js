// src/middleware/authMiddleware.js

// Middleware til at sikre, at brugeren er logget ind som admin
export function requireLogin(req, res, next) {
    if (req.session && req.session.isAdmin) {
      return next();
    }
    console.warn("Adgang nægtet: ikke logget ind");
    return res.redirect("/admin/login");
  }