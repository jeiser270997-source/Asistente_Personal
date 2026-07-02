const fs = require('node:fs');
const path = require('node:path');

const PENDING_FILE = path.join(__dirname, '..', 'data', 'pending.json');

function ensureDataDir() {
  const dir = path.dirname(PENDING_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(items) {
  ensureDataDir();
  fs.writeFileSync(PENDING_FILE, JSON.stringify(items, null, 2));
}

function add(text, category = 'general') {
  const items = load();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    category,
    done: false,
    created: new Date().toISOString(),
  };
  items.push(entry);
  save(items);
  return entry;
}

function list({ category, done } = {}) {
  let items = load();
  if (category) items = items.filter(i => i.category === category);
  if (done !== undefined) items = items.filter(i => i.done === done);
  return items;
}

function markDone(id) {
  const items = load();
  const found = items.find(i => i.id === id);
  if (found) {
    found.done = true;
    found.doneAt = new Date().toISOString();
    save(items);
  }
  return found;
}

function remove(id) {
  const items = load();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    const removed = items.splice(idx, 1)[0];
    save(items);
    return removed;
  }
  return null;
}

function summary() {
  const items = load();
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

function formatForBriefing() {
  const s = summary();
  if (s.pending === 0) return '✅ Sin pendientes.';
  const lines = s.pendingItems.slice(0, 8).map((i, idx) =>
    `  ${idx + 1}. ${i.text} ${i.category !== 'general' ? '(' + i.category + ')' : ''}`
  );
  return `📋 Pendientes (${s.pending}):\n${lines.join('\n')}`;
}

module.exports = { add, list, markDone, remove, summary, formatForBriefing };
