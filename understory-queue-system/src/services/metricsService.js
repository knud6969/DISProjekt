// src/services/metricsService.js
// Logger kø-metrics i en lille lokal SQLite-database baseret på Redis-data.

import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import redis from "../config/redisClient.js";

// Filsti til SQLite-databasen: ./data/queue-metrics.sqlite
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "..", "data", "queue-metrics.sqlite");

// Sørg for at data-mappen findes (hvis ikke, så lav den)
import fs from "fs";
const dataDir = path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

sqlite3.verbose();
const db = new sqlite3.Database(dbPath);

// Simple helper for at køre statements med Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

// Opret tabel hvis den ikke findes endnu
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS queue_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      joined_at INTEGER,
      completed_at INTEGER,
      wait_ms INTEGER
    )`
  );
});

// Hjælpefunktion: hent joinedAt fra Redis og beregn ventetid
async function computeWaitFromRedis(userId) {
  const key = `queue:user:${userId}`;
  const data = await redis.hgetall(key);
  if (!data || !data.joinedAt) return null;

  const joinedAt = Number(data.joinedAt);
  if (!Number.isFinite(joinedAt)) return null;

  const completedAt = Date.now();
  const waitMs = Math.max(0, completedAt - joinedAt);
  return { joinedAt, completedAt, waitMs };
}

// Offentlig funktion: kaldes fra worker for hver bruger i READY-batchen
export async function logCompletedUser(userId) {
  try {
    const metrics = await computeWaitFromRedis(userId);
    if (!metrics) {
      console.warn("Kunne ikke beregne ventetid for userId:", userId);
      return;
    }

    await run(
      `INSERT INTO queue_metrics (user_id, joined_at, completed_at, wait_ms)
       VALUES (?, ?, ?, ?)`,
      [userId, metrics.joinedAt, metrics.completedAt, metrics.waitMs]
    );

    // valgfri debug-log
    // console.log(`SQLite: loggede bruger ${userId} med ventetid ${metrics.waitMs} ms`);
  } catch (err) {
    console.error("logCompletedUser fejl:", err);
  }
}