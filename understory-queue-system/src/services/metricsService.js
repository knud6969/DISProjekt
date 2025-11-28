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

export async function getTodayMetrics() {
    const { joins, completed, queueLength } = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT event, COUNT(*) as count
        FROM queue_metrics
        WHERE DATE(timestamp, 'localtime') = DATE('now', 'localtime')
        GROUP BY event
        `,
        [],
        (err, rows) => {
          if (err) return reject(err);
  
          let joins = 0;
          let completed = 0;
  
          for (const row of rows) {
            if (row.event === "join") joins = row.count;
            else if (row.event === "completed") completed = row.count;
          }
  
          resolve({
            joins,
            completed,
            queueLength: Math.max(joins - completed, 0),
          });
        }
      );
    });
  
    const avgWait = await getTodayAvgWait();
  
    return { joins, completed, queueLength, avgWait };
  }

  // Beregn gennemsnitlig ventetid i sekunder for i dag
export function getTodayAvgWait() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT j.userId, j.timestamp AS joinTime, c.timestamp AS completedTime
        FROM queue_metrics j
        JOIN queue_metrics c
          ON j.userId = c.userId
         AND j.event = 'join'
         AND c.event = 'completed'
        WHERE DATE(j.timestamp, 'localtime') = DATE('now', 'localtime')
          AND DATE(c.timestamp, 'localtime') = DATE('now', 'localtime')
        `,
        [],
        (err, rows) => {
          if (err) return reject(err);
  
          if (!rows || rows.length === 0) return resolve(null);
  
          const waits = rows
            .map((r) => {
              const joinTs = new Date(r.joinTime).getTime();
              const completeTs = new Date(r.completedTime).getTime();
              return (completeTs - joinTs) / 1000; // sekunder
            })
            .filter((s) => s > 0);
  
          if (waits.length === 0) return resolve(null);
  
          const avgSec = Math.round(
            waits.reduce((a, b) => a + b, 0) / waits.length
          );
  
          resolve(avgSec);
        }
      );
    });
  }