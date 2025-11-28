// src/services/metricsService.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// File path til SQLite databasen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../../metrics.db");

// Opret SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("SQLite fejl:", err);
  else console.log("SQLite database initialiseret:", dbPath);
});

// Opret tabel hvis den ikke findes
db.run(`
  CREATE TABLE IF NOT EXISTS queue_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    event TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Log når en bruger tilmelder sig køen
export function logJoin(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO queue_metrics (userId, event) VALUES (?, 'join')",
      [userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Log når en bruger forlader køen og bliver READY
export function logCompletedUser(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO queue_metrics (userId, event) VALUES (?, 'completed')",
      [userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}