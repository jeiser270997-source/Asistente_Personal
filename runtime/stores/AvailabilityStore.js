const { getDb } = require('./Database');

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function intervaloValido(a, b, c, d) {
  if (a > b) return intervaloValido(a, '24:00', c, d) || intervaloValido('00:00', b, c, d);
  if (c > d) return intervaloValido(a, b, c, '24:00') || intervaloValido(a, b, '00:00', d);
  return a < d && b > c;
}

function normalizar(bloques) {
  const result = [];
  for (const b of bloques) {
    if (b.hora_inicio > b.hora_fin) {
      result.push({ ...b, hora_inicio: b.hora_inicio, hora_fin: '24:00' });
      result.push({ ...b, hora_inicio: '00:00', hora_fin: b.hora_fin });
    } else {
      result.push(b);
    }
  }
  return result.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
}

// ── CRUD ──

function getAll(tipo) {
  let sql = "SELECT * FROM availability WHERE activo = 1";
  const params = [];
  if (tipo) { sql += " AND tipo = ?"; params.push(tipo); }
  sql += " ORDER BY dia_semana, hora_inicio";
  return getDb().prepare(sql).all(...params);
}

function add({ tipo, dia_semana, hora_inicio, hora_fin, titulo, recurrente }) {
  getDb().prepare("INSERT INTO availability (tipo, dia_semana, hora_inicio, hora_fin, titulo, recurrente) VALUES (?, ?, ?, ?, ?, ?)").run(
    tipo, dia_semana ?? null, hora_inicio || null, hora_fin || null, titulo || null, recurrente ?? 1
  );
}

function remove(id) {
  getDb().prepare("UPDATE availability SET activo = 0 WHERE id = ?").run(id);
}

// ── Queries de disponibilidad ──

function slotsDisponibles(diaSemana, duracionMinutos) {
  const ocupado = normalizar(getDb().prepare(
    "SELECT hora_inicio, hora_fin FROM availability WHERE activo = 1 AND (dia_semana IS NULL OR dia_semana = ?) ORDER BY hora_inicio"
  ).all(diaSemana));

  const slots = [];
  let cursor = '00:00';

  for (const bloque of ocupado) {
    if (bloque.hora_inicio > cursor) {
      const libre = diffMinutos(cursor, bloque.hora_inicio);
      if (libre >= duracionMinutos) slots.push({ inicio: cursor, fin: bloque.hora_inicio, libre });
    }
    if (bloque.hora_fin > cursor) cursor = bloque.hora_fin;
  }

  if (cursor < '24:00') {
    const libre = diffMinutos(cursor, '24:00');
    if (libre >= duracionMinutos) slots.push({ inicio: cursor, fin: '24:00', libre });
  }

  return slots;
}

function estaDisponible(diaSemana, horaInicio, horaFin) {
  const bloques = getDb().prepare(
    "SELECT hora_inicio, hora_fin FROM availability WHERE activo = 1 AND (dia_semana IS NULL OR dia_semana = ?)"
  ).all(diaSemana);

  for (const b of bloques) {
    if (intervaloValido(b.hora_inicio, b.hora_fin, horaInicio, horaFin)) return false;
  }
  return true;
}

function sugerirProximoSlot(diaSemana, duracionMinutos, desde = '08:00') {
  const slots = slotsDisponibles(diaSemana, duracionMinutos);
  return slots.find(s => s.inicio >= desde) || null;
}

// ── Helpers ──

function toMinutos(hhmm) {
  if (!hhmm || hhmm === '24:00') return 1440;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function diffMinutos(a, b) {
  return toMinutos(b) - toMinutos(a);
}

// ── Seeds ──

function seedDefaults() {
  const existing = getDb().prepare("SELECT COUNT(*) as c FROM availability").get().c;
  if (existing > 0) return;

  const defaults = [
    { tipo: 'sueno', dia_semana: null, hora_inicio: '23:30', hora_fin: '07:00', titulo: 'Sueno nocturno' },
    { tipo: 'estudio_sena', dia_semana: 1, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_sena', dia_semana: 2, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_sena', dia_semana: 3, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_sena', dia_semana: 4, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_cesde', dia_semana: 1, hora_inicio: '06:00', hora_fin: '08:00', titulo: 'Clases CESDE' },
    { tipo: 'estudio_cesde', dia_semana: 3, hora_inicio: '06:00', hora_fin: '08:00', titulo: 'Clases CESDE' },
    { tipo: 'estudio_cesde', dia_semana: 5, hora_inicio: '06:00', hora_fin: '08:00', titulo: 'Clases CESDE' },
    { tipo: 'trabajo_didi', dia_semana: null, hora_inicio: '08:00', hora_fin: '17:00', titulo: 'Disponibilidad laboral Didi' },
    { tipo: 'descanso', dia_semana: null, hora_inicio: '12:00', hora_fin: '13:00', titulo: 'Almuerzo' },
  ];

  const insert = getDb().prepare("INSERT INTO availability (tipo, dia_semana, hora_inicio, hora_fin, titulo) VALUES (?, ?, ?, ?, ?)");
  for (const d of defaults) insert.run(d.tipo, d.dia_semana, d.hora_inicio, d.hora_fin, d.titulo);
}

module.exports = { getAll, add, remove, slotsDisponibles, estaDisponible, sugerirProximoSlot, seedDefaults };
