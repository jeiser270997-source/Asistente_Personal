const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

// Migrar desde lowdb si existe pending.json viejo
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PENDING_FILE = path.join(DATA_DIR, 'pending.json');
const DB_PATH = path.join(DATA_DIR, 'memoria_hipocampo.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS pending_tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    done INTEGER DEFAULT 0,
    created TEXT DEFAULT CURRENT_TIMESTAMP,
    doneAt TEXT
  );
`);

// Migración única desde JSON viejo si existe
if (fs.existsSync(PENDING_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    const tasks = Array.isArray(raw) ? raw : (raw.tasks || []);
    const insert = db.prepare(`INSERT OR IGNORE INTO pending_tasks (id, text, category, done, created, doneAt) VALUES (?, ?, ?, ?, ?, ?)`);
    const migrate = db.transaction((tasks) => {
      for (const t of tasks) {
        insert.run(t.id || `m_${Date.now()}`, t.text, t.category || 'general', t.done ? 1 : 0, t.created || new Date().toISOString(), t.doneAt || null);
      }
    });
    if (tasks.length > 0) {
      migrate(tasks);
      // Renombrar para no reimportar
      fs.renameSync(PENDING_FILE, PENDING_FILE + '.migrated');
      console.log(`[pending] Migrados ${tasks.length} tasks desde JSON → SQLite`);
    }
  } catch (e) {
    console.warn('[pending] Migración omitida:', e.message);
  }
}

const stmtAdd    = db.prepare(`INSERT INTO pending_tasks (id, text, category) VALUES (?, ?, ?)`);
const stmtList   = db.prepare(`SELECT * FROM pending_tasks ORDER BY created ASC`);
const stmtDone   = db.prepare(`UPDATE pending_tasks SET done=1, doneAt=? WHERE id=?`);
const stmtRemove = db.prepare(`DELETE FROM pending_tasks WHERE id=?`);

function add(text, category = 'general') {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  stmtAdd.run(id, text, category);
  return Promise.resolve({ id, text, category, done: false, created: new Date().toISOString() });
}

function list({ category, done } = {}) {
  let tasks = stmtList.all();
  if (category) tasks = tasks.filter(t => t.category === category);
  if (done !== undefined) tasks = tasks.filter(t => (t.done === 1) === done);
  return tasks.map(t => ({ ...t, done: t.done === 1 }));
}

function markDone(id) {
  stmtDone.run(new Date().toISOString(), id);
  return { id };
}

function remove(id) {
  stmtRemove.run(id);
  return { id };
}

function summary() {
  const items = list();
  const pending = items.filter(t => !t.done);
  const done    = items.filter(t => t.done);
  return { total: items.length, pending: pending.length, done: done.length, pendingItems: pending, recentDone: done.slice(-5).reverse() };
}

async function formatForBriefing() {
  const s = summary();
  if (s.pending === 0) return '✅ Sin pendientes.';
  const lines = s.pendingItems.slice(0, 8).map((i, idx) =>
    `  ${idx + 1}. ${i.text}${i.category !== 'general' ? ` (${i.category})` : ''}`
  );
  return `📋 Pendientes (${s.pending}):\n${lines.join('\n')}`;
}

module.exports = { add, list, markDone, remove, summary, formatForBriefing };