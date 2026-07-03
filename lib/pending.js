const fs = require('node:fs');
const path = require('node:path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const PENDING_FILE = path.join(__dirname, '..', 'data', 'pending.json');

function ensureDataDir() {
  const dir = path.dirname(PENDING_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDataDir();
if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, '[]');

const adapter = new FileSync(PENDING_FILE);
const db = low(adapter);
db.defaults({ tasks: [] }).write();

function add(text, category = 'general') {
  return new Promise(resolve => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      category,
      done: false,
      created: new Date().toISOString(),
    };
    db.get('tasks').push(entry).write();
    resolve(entry);
  });
}

function list({ category, done } = {}) {
  let tasks = db.get('tasks').value() || [];
  if (category) tasks = tasks.filter(i => i.category === category);
  if (done !== undefined) tasks = tasks.filter(i => i.done === done);
  return tasks;
}

function markDone(id) {
  const found = db.get('tasks').find({ id }).value();
  if (found) {
    db.get('tasks').find({ id }).assign({ done: true, doneAt: new Date().toISOString() }).write();
  }
  return found;
}

function remove(id) {
  const tasks = db.get('tasks').value() || [];
  const idx = tasks.findIndex(i => i.id === id);
  if (idx !== -1) {
    const removed = tasks.splice(idx, 1)[0];
    db.set('tasks', tasks).write();
    return removed;
  }
  return null;
}

function summary() {
  const items = db.get('tasks').value() || [];
  const pending = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  return {
    total: items.length,
    pending: pending.length,
    done: done.length,
    pendingItems: pending,
    recentDone: done.slice(-5).reverse(),
  };
}

async function formatForBriefing() {
  const s = summary();
  if (s.pending === 0) return '✅ Sin pendientes.';
  const lines = s.pendingItems.slice(0, 8).map((i, idx) =>
    `  ${idx + 1}. ${i.text} ${i.category !== 'general' ? '(' + i.category + ')' : ''}`
  );
  return `📋 Pendientes (${s.pending}):\n${lines.join('\n')}`;
}

module.exports = { add, list, markDone, remove, summary, formatForBriefing };