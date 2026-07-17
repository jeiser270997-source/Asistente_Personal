/**
 * lib/memory/memory_engine.js
 *
 * Motor de memoria semántica. Almacena hechos y conocimiento en SQLite.
 * Migrado de JSON → better-sqlite3 (Jul 2026).
 * Usa la misma BD que memory.js y pending.js: data/memoria_hipocampo.db
 */

const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('../../runtime/stores/Database');
const { PATHS } = require('../data/paths');

const DB_PATH = PATHS.MEMORIA_DB;
const HECHOS_JSON_LEGACY = PATHS.HECHOS_JSON_LEGACY;
const INDICE_JSON_LEGACY = PATHS.INDICE_JSON_LEGACY;

const db = getDb();

// ── Schema (idempotent) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS hechos (
    id TEXT PRIMARY KEY,
    categoria TEXT NOT NULL,
    hecho TEXT NOT NULL,
    fuente TEXT DEFAULT 'manual',
    confianza TEXT DEFAULT 'alta',
    tags TEXT DEFAULT '[]',
    timestamp TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_hechos_categoria ON hechos(categoria);
  CREATE INDEX IF NOT EXISTS idx_hechos_timestamp ON hechos(timestamp);
`);

// ── One-time migration from JSON ──
let _migrated = false;
function migrateIfNeeded() {
  if (_migrated) return;
  _migrated = true;

  if (!fs.existsSync(HECHOS_JSON_LEGACY)) return;

  try {
    const existing = db.prepare('SELECT COUNT(*) as c FROM hechos').get();
    if (existing.c > 0) return; // Already has data

    const json = JSON.parse(fs.readFileSync(HECHOS_JSON_LEGACY, 'utf8'));
    const hechos = json.hechos || [];
    if (hechos.length === 0) return;

    const insert = db.prepare(
      'INSERT OR IGNORE INTO hechos (id, categoria, hecho, fuente, confianza, tags, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const tx = db.transaction((items) => {
      for (const h of items) {
        insert.run(
          h.id || `h_legacy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          h.categoria || 'general',
          h.hecho || '',
          h.fuente || 'manual',
          h.confianza || 'alta',
          JSON.stringify(h.tags || []),
          h.timestamp || new Date().toISOString()
        );
      }
    });

    tx(hechos);
    console.log(`[memory_engine] Migrados ${hechos.length} hechos desde JSON → SQLite`);

    // Rename legacy files (no los borramos, seguimos patrón de pending.js)
    fs.renameSync(HECHOS_JSON_LEGACY, HECHOS_JSON_LEGACY + '.migrated');
    if (fs.existsSync(INDICE_JSON_LEGACY)) {
      fs.renameSync(INDICE_JSON_LEGACY, INDICE_JSON_LEGACY + '.migrated');
    }
  } catch (e) {
    console.error('[memory_engine] Error migrando JSON:', e.message);
  }
}

// ── Public API (compatible con versión anterior) ──

function agregarHecho(categoria, hecho, tags = [], fuente = 'manual', confianza = 'alta') {
  migrateIfNeeded();
  const id = `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const timestamp = new Date().toISOString();
  const tagsStr = JSON.stringify(tags);

  db.prepare(
    'INSERT INTO hechos (id, categoria, hecho, fuente, confianza, tags, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, categoria, hecho, fuente, confianza, tagsStr, timestamp);

  // Cap at MAX_HECHOS
  const count = db.prepare('SELECT COUNT(*) as c FROM hechos').get();
  if (count.c > 500) {
    db.prepare('DELETE FROM hechos WHERE id IN (SELECT id FROM hechos ORDER BY timestamp ASC LIMIT ?)').run(count.c - 500);
  }

  return id;
}

function corregirHecho(categoria, hechoAntiguo, hechoNuevo) {
  migrateIfNeeded();
  const lower = hechoAntiguo.toLowerCase();
  const rows = db.prepare(
    'SELECT id FROM hechos WHERE categoria = ? AND LOWER(hecho) LIKE ? LIMIT 1'
  ).all(categoria, `%${lower}%`);

  if (rows.length === 0) return null;

  db.prepare(
    "UPDATE hechos SET hecho = ?, timestamp = ?, confianza = 'corregido', fuente = 'correccion_usuario' WHERE id = ?"
  ).run(hechoNuevo, new Date().toISOString(), rows[0].id);

  return rows[0].id;
}

function buscarHechos(query, limite = 10) {
  migrateIfNeeded();
  const palabras = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (palabras.length === 0) return [];

  // Build LIKE conditions for each palabra
  const conditions = palabras.map(() => "(LOWER(hecho) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(tags) LIKE ?)");
  const params = [];
  for (const p of palabras) {
    params.push(`%${p}%`, `%${p}%`, `%${p}%`);
  }

  const sql = `SELECT * FROM hechos WHERE ${conditions.join(' OR ')} ORDER BY timestamp DESC LIMIT ?`;
  const rows = db.prepare(sql).all(...params, limite);

  return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }));
}

function getContextoRelevante(mensaje, maxChars = 2000) {
  const hechos = buscarHechos(mensaje, 15);
  if (hechos.length === 0) return '';

  // Group by category
  const byCat = {};
  for (const h of hechos) {
    if (!byCat[h.categoria]) byCat[h.categoria] = [];
    byCat[h.categoria].push(h);
  }

  const parts = [];
  for (const [cat, items] of Object.entries(byCat)) {
    const recientes = items.slice(0, 5);
    if (recientes.length === 0) continue;
    parts.push(`[MEMORIA:${cat.toUpperCase()}]`);
    for (const h of recientes) {
      const conf = h.confianza === 'corregido' ? '✏' : h.confianza === 'alta' ? '✓' : '?';
      parts.push(`  ${conf} ${h.hecho}`);
    }
  }

  const result = parts.join('\n');
  return result.length > maxChars ? result.substring(0, maxChars) + '\n...' : result;
}

function getResumenMemoria() {
  migrateIfNeeded();
  const total = db.prepare('SELECT COUNT(*) as c FROM hechos').get();
  const cats = db.prepare('SELECT categoria, COUNT(*) as c FROM hechos GROUP BY categoria ORDER BY c DESC').all();

  const categorias = {};
  for (const c of cats) categorias[c.categoria] = c.c;

  const recientes = db.prepare('SELECT hecho, categoria, timestamp FROM hechos ORDER BY timestamp DESC LIMIT 20').all();

  return {
    total: total.c,
    categorias,
    tags_populares: [], // Tags population from JSON parsing is expensive; simplified
    ultimos_hechos: recientes.map(h => ({
      hecho: h.hecho.substring(0, 80),
      categoria: h.categoria,
      cuando: h.timestamp
    }))
  };
}

// Stub exports for API backward-compat (context_resolver.js may use these)
function loadHechos() {
  migrateIfNeeded();
  const rows = db.prepare('SELECT * FROM hechos ORDER BY timestamp DESC').all();
  return { hechos: rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })) };
}

function saveHechos(data) {
  // No-op in SQLite mode — all mutations go through agregarHecho/corregirHecho
  // Kept for API compatibility
}

module.exports = {
  agregarHecho,
  corregirHecho,
  buscarHechos,
  getContextoRelevante,
  getResumenMemoria,
  loadHechos,
  saveHechos
};
