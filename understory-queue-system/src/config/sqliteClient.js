// src/config/sqliteClient.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB-fil på serveren (i projektroden)
const dbPath =
  process.env.SQLITE_PATH ||
  path.join(__dirname, "../../queue-metrics.db");

const db = new sqlite3.Database(dbPath);

// Init: opret tabeller til daglige metrics
export function initSqlite() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS daily_metrics (
          date TEXT PRIMARY KEY,
          joins INTEGER NOT NULL DEFAULT 0,
          completed INTEGER NOT NULL DEFAULT 0,
          total_wait_ms INTEGER NOT NULL DEFAULT 0
        )
      `,
        (err) => {
          if (err) return reject(err);
          console.log("✅ SQLite: daily_metrics klar:", dbPath);
          resolve();
        }
      );
    });
  });
}

// Små helper-funktioner som returnerer promises
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export default db;