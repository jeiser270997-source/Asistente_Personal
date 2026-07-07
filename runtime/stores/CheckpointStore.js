const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const JSON_DIR = path.resolve(DATA_DIR, 'jobs');

const JSON_MAP = {
  'computrabajo_last': path.join(JSON_DIR, 'computrabajo_last.json'),
  'ultima_consulta_simit': path.join(DATA_DIR, 'ultima_consulta.json'),
  'deadlines': path.join(DATA_DIR, 'sena', 'deadlines.json'),
};

function getDriver() {
  return process.env.STORAGE_DRIVER || 'sqlite';
}

function seedFromJson(key, jsonPath) {
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    set(key, parsed);
    return parsed;
  } catch { return null; }
}

function get(key) {
  const row = getDb().prepare("SELECT value FROM checkpoints WHERE key = ?").get(key);
  if (row) {
    try { return JSON.parse(row.value); } catch { return row.value; }
  }
  if (getDriver() === 'sqlite') {
    const jsonPath = JSON_MAP[key];
    if (jsonPath) return seedFromJson(key, jsonPath);
  }
  const jsonPath = JSON_MAP[key];
  if (jsonPath) {
    try { return JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch {}
  }
  return null;
}

function set(key, value) {
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  getDb().prepare("INSERT OR REPLACE INTO checkpoints (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(key, serialized);
}

function migrateAll() {
  let count = 0;
  for (const [key, jsonPath] of Object.entries(JSON_MAP)) {
    if (!getDb().prepare("SELECT 1 FROM checkpoints WHERE key = ?").get(key)) {
      if (seedFromJson(key, jsonPath)) count++;
    }
  }
  return count;
}

module.exports = { get, set, migrateAll, seedFromJson };
