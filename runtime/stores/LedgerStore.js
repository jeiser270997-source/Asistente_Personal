const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const JSON_PATH = path.resolve(__dirname, '..', '..', 'data', 'masterledger.json');

function loadJson() {
  try {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    if (Array.isArray(raw)) return raw;
    if (raw.casos_legales) return raw.casos_legales;
    return Object.values(raw).flat();
  } catch { return []; }
}

function seedFromJson() {
  const db = getDb();
  const items = loadJson();
  if (!items.length) return 0;
  const insert = db.prepare("INSERT OR IGNORE INTO ledger (id, tipo, data) VALUES (?, ?, ?)");
  const tx = db.transaction(() => {
    for (const item of items) {
      const id = item.id || item.caso || `caso_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      insert.run(id, item.tipo || 'caso_legal', JSON.stringify(item));
    }
  });
  tx();
  return items.length;
}

const _seeded = { ledger: false };

function getAll() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM ledger ORDER BY created_at DESC").all();
  if (!rows.length && !_seeded.ledger) {
    _seeded.ledger = true;
    seedFromJson();
    return db.prepare("SELECT * FROM ledger ORDER BY created_at DESC").all()
      .map(r => ({ id: r.id, tipo: r.tipo, ...JSON.parse(r.data), _created_at: r.created_at }));
  }
  return rows.map(r => ({ id: r.id, tipo: r.tipo, ...JSON.parse(r.data), _created_at: r.created_at }));
}

function getByTipo(tipo) {
  return getDb().prepare("SELECT * FROM ledger WHERE tipo = ? ORDER BY created_at DESC").all(tipo)
    .map(r => ({ id: r.id, tipo: r.tipo, ...JSON.parse(r.data), _created_at: r.created_at }));
}

function getById(id) {
  const row = getDb().prepare("SELECT * FROM ledger WHERE id = ?").get(id);
  if (!row) return null;
  return { id: row.id, tipo: row.tipo, ...JSON.parse(row.data), _created_at: row.created_at };
}

function emit(tipo, data) {
  const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  getDb().prepare("INSERT INTO ledger (id, tipo, data) VALUES (?, ?, ?)").run(
    id,
    tipo,
    JSON.stringify({ ...data, _ts: new Date().toISOString() })
  );
}

module.exports = { getAll, getByTipo, getById, seedFromJson, emit };
