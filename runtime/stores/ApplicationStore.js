const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const GENERAL_JSON = path.join(DATA_DIR, 'aplicaciones.json');
const COMPUTRABAJO_JSON = path.join(DATA_DIR, 'jobs', 'aplicaciones.json');

function loadGeneralJson() {
  try { return JSON.parse(fs.readFileSync(GENERAL_JSON, 'utf8')); } catch { return []; }
}

function loadComputrabajoJson() {
  try { return JSON.parse(fs.readFileSync(COMPUTRABAJO_JSON, 'utf8')); } catch { return []; }
}

function normalizeGeneral(app) {
  return {
    id: app.id,
    source: 'general',
    empresa: app.empresa || null,
    cargo: app.cargo || null,
    plataforma: app.plataforma || null,
    url: app.url || null,
    detalles: app.detalles || null,
    fecha_aplicacion: app.fecha_aplicacion || null,
    estado: app.estado || 'aplicada',
    score: app.evaluacion?.score ?? null,
    compatible: app.evaluacion?.compatible != null ? (app.evaluacion.compatible ? 1 : 0) : null,
    razones: app.evaluacion?.razones ? JSON.stringify(app.evaluacion.razones) : null,
    extra_data: null,
    historial: app.historial ? JSON.stringify(app.historial) : null,
  };
}

function normalizeComputrabajo(app) {
  return {
    id: app.id || app.oferta_id || `compra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    source: 'computrabajo',
    empresa: app.empresa || app.company || null,
    cargo: app.cargo || app.title || app.titulo || null,
    plataforma: 'computrabajo',
    url: app.url || null,
    detalles: app.detalles || app.descripcion || app.summary || app.lugar || null,
    fecha_aplicacion: app.fecha_aplicacion || app.fecha_publicacion || app.date_posted || app.fecha || null,
    estado: app.estado || 'aplicada',
    score: app.fit_score ?? app.score ?? null,
    compatible: app.compatible != null ? (app.compatible ? 1 : 0) : null,
    razones: app.razones ? JSON.stringify(app.razones) : null,
    extra_data: JSON.stringify({
      descripcion: app.descripcion,
      salario: app.salario,
      ubicacion: app.ubicacion,
      modalidad: app.modalidad,
      fit_score: app.fit_score,
      analisis: app.analisis,
      cv_path: app.cv_path,
      lugar: app.lugar,
      razon: app.razon,
    }),
    historial: null,
  };
}

function seedFromJson() {
  const db = getDb();
  const insert = db.prepare(`INSERT OR IGNORE INTO applications
    (id, source, empresa, cargo, plataforma, url, detalles, fecha_aplicacion, estado, score, compatible, razones, extra_data, historial)
    VALUES (@id, @source, @empresa, @cargo, @plataforma, @url, @detalles, @fecha_aplicacion, @estado, @score, @compatible, @razones, @extra_data, @historial)`);

  const tx = db.transaction(() => {
    const existingGeneral = db.prepare("SELECT COUNT(*) as c FROM applications WHERE source = 'general'").get();
    if (existingGeneral.c === 0) {
      for (const app of loadGeneralJson()) {
        insert.run(normalizeGeneral(app));
      }
    }
    const existingCompu = db.prepare("SELECT COUNT(*) as c FROM applications WHERE source = 'computrabajo'").get();
    if (existingCompu.c === 0) {
      for (const app of loadComputrabajoJson()) {
        insert.run(normalizeComputrabajo(app));
      }
    }
  });
  tx();
  return true;
}

const _seededApps = { apps: false };

function ensureSeeded() {
  if (!_seededApps.apps) {
    const total = getDb().prepare("SELECT COUNT(*) as c FROM applications").get().c;
    if (total === 0) {
      _seededApps.apps = true;
      seedFromJson();
    }
  }
}

function getAll(filter) {
  ensureSeeded();
  const db = getDb();
  let sql = "SELECT * FROM applications";
  const clauses = [];
  const params = [];
  if (filter?.source) { clauses.push("source = ?"); params.push(filter.source); }
  if (filter?.estado) { clauses.push("estado = ?"); params.push(filter.estado); }
  if (filter?.compatible) { clauses.push("compatible = 1"); }
  if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
  sql += " ORDER BY fecha_aplicacion DESC";
  return db.prepare(sql).all(...params).map(row => ({
    id: row.id,
    source: row.source,
    empresa: row.empresa,
    cargo: row.cargo,
    plataforma: row.plataforma,
    url: row.url,
    detalles: row.detalles,
    fecha_aplicacion: row.fecha_aplicacion,
    estado: row.estado,
    evaluacion: {
      score: row.score,
      compatible: !!row.compatible,
      razones: row.razones ? JSON.parse(row.razones) : [],
    },
    historial: row.historial ? JSON.parse(row.historial) : [],
    extra_data: row.extra_data ? JSON.parse(row.extra_data) : null,
  }));
}

function getById(id) {
  ensureSeeded();
  const row = getDb().prepare("SELECT * FROM applications WHERE id = ?").get(id);
  if (!row) return null;
  const base = {
    id: row.id, source: row.source, empresa: row.empresa, cargo: row.cargo,
    plataforma: row.plataforma, url: row.url, detalles: row.detalles,
    fecha_aplicacion: row.fecha_aplicacion, estado: row.estado,
    evaluacion: { score: row.score, compatible: !!row.compatible, razones: row.razones ? JSON.parse(row.razones) : [] },
    historial: row.historial ? JSON.parse(row.historial) : [],
  };
  if (row.extra_data) {
    const extra = JSON.parse(row.extra_data);
    Object.assign(base, extra);
  }
  return base;
}

function getStats() {
  ensureSeeded();
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) as c FROM applications").get().c;
  const counts = {
    total, activas: 0, entrevistas: 0, rechazadas: 0, aceptadas: 0, compatibles: 0, no_compatibles: 0,
  };
  for (const row of db.prepare("SELECT estado, compatible FROM applications").all()) {
    if (row.estado === 'aplicada') counts.activas++;
    if (row.estado === 'entrevista') counts.entrevistas++;
    if (row.estado === 'rechazada') counts.rechazadas++;
    if (row.estado === 'aceptada') counts.aceptadas++;
    if (row.compatible) counts.compatibles++;
    else if (row.compatible === 0) counts.no_compatibles++;
  }
  const plataformas = db.prepare("SELECT DISTINCT plataforma FROM applications WHERE plataforma IS NOT NULL").all().map(r => r.plataforma);
  return { ...counts, plataformas };
}

function create(data) {
  const id = data.id || `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO applications
    (id, source, empresa, cargo, plataforma, url, detalles, fecha_aplicacion, estado, score, compatible, razones, extra_data, historial, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    id,
    data.source || 'general',
    data.empresa || null,
    data.cargo || null,
    data.plataforma || null,
    data.url || null,
    data.detalles || null,
    data.fecha_aplicacion || new Date().toISOString().split('T')[0],
    data.estado || 'aplicada',
    data.evaluacion?.score ?? data.score ?? null,
    data.evaluacion?.compatible != null ? (data.evaluacion.compatible ? 1 : 0) : data.compatible != null ? (data.compatible ? 1 : 0) : null,
    data.evaluacion?.razones ? JSON.stringify(data.evaluacion.razones) : data.razones ? JSON.stringify(data.razones) : null,
    data.extra_data ? JSON.stringify(data.extra_data) : null,
    data.historial ? JSON.stringify(data.historial) : JSON.stringify([{ fecha: new Date().toISOString(), evento: 'creada' }])
  );
  return id;
}

function update(id, changes) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM applications WHERE id = ?").get(id);
  if (!existing) return false;

  const fields = [];
  const params = [];
  for (const key of ['empresa', 'cargo', 'plataforma', 'url', 'detalles', 'fecha_aplicacion', 'estado']) {
    if (changes[key] !== undefined) { fields.push(`${key} = ?`); params.push(changes[key]); }
  }
  if (changes.score !== undefined) { fields.push('score = ?'); params.push(changes.score); }
  if (changes.compatible !== undefined) { fields.push('compatible = ?'); params.push(changes.compatible ? 1 : 0); }
  if (changes.razones !== undefined) { fields.push('razones = ?'); params.push(JSON.stringify(changes.razones)); }
  if (changes.historial !== undefined) { fields.push('historial = ?'); params.push(JSON.stringify(changes.historial)); }

  if (fields.length) {
    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  return true;
}

function findByEmpresaCargo(empresa, cargo) {
  ensureSeeded();
  const row = getDb().prepare("SELECT * FROM applications WHERE LOWER(empresa) = LOWER(?) AND LOWER(cargo) = LOWER(?) LIMIT 1").get(empresa, cargo);
  if (!row) return null;
  return getById(row.id);
}

function findByUrl(url) {
  ensureSeeded();
  const row = getDb().prepare("SELECT * FROM applications WHERE url = ? LIMIT 1").get(url);
  if (!row) return null;
  return getById(row.id);
}

module.exports = { getAll, getById, getStats, create, update, findByEmpresaCargo, findByUrl, seedFromJson };
