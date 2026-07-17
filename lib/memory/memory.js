const fs = require('node:fs');
const path = require('node:path');
const { getDb } = require('../../runtime/stores/Database');

const { PATHS } = require('../data/paths');
const DB_DIR = path.dirname(PATHS.MEMORIA_DB);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = getDb();

// Inicializar Tablas (Claudi-mem style persistent storage)
db.exec(`
  CREATE TABLE IF NOT EXISTS historico_conversaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertStmt = db.prepare(`INSERT INTO historico_conversaciones (persona, role, content) VALUES (?, ?, ?)`);
const getStmt = db.prepare(`SELECT role, content FROM historico_conversaciones WHERE persona = ? ORDER BY id DESC LIMIT ?`);
const getAllStmt = db.prepare(`SELECT role, content, timestamp FROM historico_conversaciones WHERE persona = ? ORDER BY id ASC`);
const clearStmt = db.prepare(`DELETE FROM historico_conversaciones WHERE persona = ?`);

function getHistory(persona, limit = 8) {
  // SQLite trae DESC, así que tenemos que darle la vuelta para el LLM
  const rows = getStmt.all(persona, limit);
  return rows.reverse().map(row => ({
    role: row.role,
    content: row.content
  }));
}

function getAllHistory(persona) {
  return getAllStmt.all(persona);
}

function addMessage(persona, role, content) {
  if (!content) return;
  insertStmt.run(persona, role, content);
}

function clearHistory(persona) {
  clearStmt.run(persona);
}

module.exports = { getHistory, getAllHistory, addMessage, clearHistory, db };
