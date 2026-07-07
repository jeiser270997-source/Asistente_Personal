const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const JSON_PATH = path.resolve(__dirname, '..', '..', 'data', 'sena', 'seguimiento.json');
const COURSE_ID = 'sena_actual';

function loadJson() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch { return null; }
}

function seedFromJson() {
  const data = loadJson();
  if (!data) return false;
  const db = getDb();
  const existing = db.prepare("SELECT 1 FROM seguimiento WHERE id = ?").get(COURSE_ID);
  if (existing) return false;
  db.prepare(`INSERT INTO seguimiento (id, curso, ficha, actividades, progreso, ultima_consulta, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    COURSE_ID,
    data.curso || null,
    data.ficha || null,
    data.actividades ? JSON.stringify(data.actividades) : null,
    data.progreso ? JSON.stringify(data.progreso) : null,
    data.actualizado || null
  );
  return true;
}

function get() {
  const db = getDb();
  const row = db.prepare("SELECT * FROM seguimiento WHERE id = ?").get(COURSE_ID);
  if (row) {
    return {
      curso: row.curso,
      ficha: row.ficha,
      actualizado: row.ultima_consulta,
      actividades: row.actividades ? JSON.parse(row.actividades) : {},
      progreso: row.progreso ? JSON.parse(row.progreso) : {},
    };
  }
  const seeded = seedFromJson();
  if (seeded) return get();
  return { curso: null, ficha: null, actualizado: null, actividades: {}, progreso: {} };
}

function update(data) {
  const db = getDb();
  db.prepare(`INSERT INTO seguimiento (id, curso, ficha, actividades, progreso, ultima_consulta, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      curso=excluded.curso, ficha=excluded.ficha,
      actividades=excluded.actividades, progreso=excluded.progreso,
      ultima_consulta=excluded.ultima_consulta, updated_at=datetime('now')`).run(
    COURSE_ID,
    data.curso || null,
    data.ficha || null,
    data.actividades ? JSON.stringify(data.actividades) : null,
    data.progreso ? JSON.stringify(data.progreso) : null,
    data.actualizado || null
  );
}

module.exports = { get, update, seedFromJson };
