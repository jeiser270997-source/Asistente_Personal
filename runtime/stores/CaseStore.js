const { getDb } = require('./Database');

// ── Cases (contexto vivo del usuario) ──

function getAll(tipo, estado) {
  let sql = "SELECT * FROM cases";
  const params = [];
  const clauses = [];
  if (tipo) { clauses.push("tipo = ?"); params.push(tipo); }
  if (estado) { clauses.push("estado = ?"); params.push(estado); }
  if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
  sql += " ORDER BY prioridad ASC, ultima_actualizacion DESC";
  return getDb().prepare(sql).all(...params).map(decorate);
}

function getById(id) {
  const row = getDb().prepare("SELECT * FROM cases WHERE id = ?").get(id);
  return row ? decorate(row) : null;
}

function create({ id, tipo, estado, titulo, descripcion, data, prioridad }) {
  const caseId = id || `case_${tipo}_${Date.now()}`;
  getDb().prepare(`INSERT INTO cases (id, tipo, estado, titulo, descripcion, data, prioridad)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    caseId, tipo, estado || 'abierto', titulo || null, descripcion || null,
    data ? JSON.stringify(data) : null, prioridad ?? 2
  );
  return caseId;
}

function update(id, changes) {
  const fields = [];
  const params = [];
  for (const k of ['tipo', 'estado', 'titulo', 'descripcion', 'prioridad']) {
    if (changes[k] !== undefined) { fields.push(`${k} = ?`); params.push(changes[k]); }
  }
  if (changes.data !== undefined) { fields.push("data = ?"); params.push(JSON.stringify(changes.data)); }
  if (fields.length) {
    fields.push("ultima_actualizacion = datetime('now')");
    params.push(id);
    getDb().prepare(`UPDATE cases SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
}

function close(id) {
  getDb().prepare("UPDATE cases SET estado = 'cerrado', fecha_cierre = datetime('now'), ultima_actualizacion = datetime('now') WHERE id = ?").run(id);
}

// ── Timeline (eventos asociados a un caso) ──

function addEvent(caseId, tipo, titulo, data) {
  getDb().prepare("INSERT INTO timeline (case_id, tipo, titulo, data) VALUES (?, ?, ?, ?)").run(
    caseId, tipo, titulo || null, data ? JSON.stringify(data) : null
  );
}

function getEvents(caseId) {
  return getDb().prepare("SELECT * FROM timeline WHERE case_id = ? ORDER BY creado_en DESC").all(caseId);
}

// ── Queries de contexto ──

function abiertos() {
  return getDb().prepare("SELECT * FROM cases WHERE estado != 'cerrado' ORDER BY prioridad ASC, ultima_actualizacion DESC").all().map(decorate);
}

function requierenSeguimiento() {
  return getDb().prepare("SELECT * FROM cases WHERE estado NOT IN ('cerrado', 'completado') AND datetime(ultima_actualizacion) < datetime('now', '-7 days') ORDER BY prioridad ASC").all().map(decorate);
}

function porTipo() {
  const rows = getDb().prepare("SELECT tipo, estado, COUNT(*) as c FROM cases GROUP BY tipo, estado ORDER BY tipo, estado").all();
  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.tipo]) grouped[r.tipo] = {};
    grouped[r.tipo][r.estado] = r.c;
  }
  return grouped;
}

// ── Helper ──

function decorate(row) {
  return {
    id: row.id, tipo: row.tipo, estado: row.estado,
    titulo: row.titulo, descripcion: row.descripcion,
    data: row.data ? JSON.parse(row.data) : null,
    prioridad: row.prioridad,
    ultima_actualizacion: row.ultima_actualizacion,
    fecha_creacion: row.fecha_creacion,
    fecha_cierre: row.fecha_cierre,
  };
}

module.exports = { getAll, getById, create, update, close, addEvent, getEvents, abiertos, requierenSeguimiento, porTipo };
