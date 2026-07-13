const { getDb } = require('./Database');

function getAll(filter) {
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
    id: row.id, source: row.source, empresa: row.empresa, cargo: row.cargo,
    plataforma: row.plataforma, url: row.url, detalles: row.detalles,
    fecha_aplicacion: row.fecha_aplicacion, estado: row.estado,
    evaluacion: { score: row.score, compatible: !!row.compatible, razones: row.razones ? JSON.parse(row.razones) : [] },
    historial: row.historial ? JSON.parse(row.historial) : [],
    extra_data: row.extra_data ? JSON.parse(row.extra_data) : null,
  }));
}

function getById(id) {
  const row = getDb().prepare("SELECT * FROM applications WHERE id = ?").get(id);
  if (!row) return null;
  const base = {
    id: row.id, source: row.source, empresa: row.empresa, cargo: row.cargo,
    plataforma: row.plataforma, url: row.url, detalles: row.detalles,
    fecha_aplicacion: row.fecha_aplicacion, estado: row.estado,
    evaluacion: { score: row.score, compatible: !!row.compatible, razones: row.razones ? JSON.parse(row.razones) : [] },
    historial: row.historial ? JSON.parse(row.historial) : [],
  };
  if (row.extra_data) Object.assign(base, JSON.parse(row.extra_data));
  return base;
}

function getStats() {
  const db = getDb();
  const counts = { total: 0, activas: 0, entrevistas: 0, rechazadas: 0, aceptadas: 0, compatibles: 0, no_compatibles: 0 };
  const rows = db.prepare("SELECT estado, compatible FROM applications").all();
  counts.total = rows.length;
  for (const row of rows) {
    if (row.estado === 'aplicada') counts.activas++;
    if (row.estado === 'entrevista') counts.entrevistas++;
    if (row.estado === 'rechazada') counts.rechazadas++;
    if (row.estado === 'aceptada') counts.aceptadas++;
    if (row.compatible === 1) counts.compatibles++;
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
    id, data.source || 'general', data.empresa || null, data.cargo || null,
    data.plataforma || null, data.url || null, data.detalles || null,
    data.fecha_aplicacion || new Date().toISOString().split('T')[0],
    data.estado || 'aplicada', data.evaluacion?.score ?? data.score ?? null,
    data.evaluacion?.compatible != null ? (data.evaluacion.compatible ? 1 : 0) : data.compatible != null ? (data.compatible ? 1 : 0) : null,
    data.evaluacion?.razones ? JSON.stringify(data.evaluacion.razones) : data.razones ? JSON.stringify(data.razones) : null,
    data.extra_data ? JSON.stringify(data.extra_data) : null,
    data.historial ? JSON.stringify(data.historial) : JSON.stringify([{ fecha: new Date().toISOString(), evento: 'creada' }])
  );
  return id;
}

function update(id, changes) {
  const db = getDb();
  if (!db.prepare("SELECT 1 FROM applications WHERE id = ?").get(id)) return false;

  const fields = [], params = [];
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
  const row = getDb().prepare("SELECT id FROM applications WHERE LOWER(empresa) = LOWER(?) AND LOWER(cargo) = LOWER(?) LIMIT 1").get(empresa, cargo);
  return row ? getById(row.id) : null;
}

function findByUrl(url) {
  const row = getDb().prepare("SELECT id FROM applications WHERE url = ? LIMIT 1").get(url);
  return row ? getById(row.id) : null;
}

module.exports = { getAll, getById, getStats, create, update, findByEmpresaCargo, findByUrl };
