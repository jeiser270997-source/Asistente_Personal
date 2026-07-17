/**
 * OutboxStore — Transactional Outbox para el Event Bus
 *
 * Cada evento se inserta en event_outbox como parte de la misma transacción
 * SQLite que actualiza los datos de negocio. Esto garantiza que si el proceso
 * muere (power loss, process.exit()), el evento sobrevive y se re-procesa
 * en el próximo ciclo del daily_routine.
 *
 * La db connection se pasa como primer argumento en las funciones mutables
 * para que el caller pueda agrupar varias operaciones en una transacción:
 *
 *   db.transaction(() => {
 *     ApplicationStore.create(db, data);
 *     OutboxStore.insert(db, 'job.applied', payload);
 *   })();
 *
 * Uso (fuera de transacción):
 *   const OutboxStore = require('./runtime/stores/OutboxStore');
 *   OutboxStore.insert(getDb(), 'event.type', payload);
 */
const crypto = require('node:crypto');

const STATUS = {
  PENDING:    'pending',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  FAILED:     'failed',
};

/**
 * Inserta un evento en la outbox.
 * @param {object} db - Conexión better-sqlite3 (para incluir en transacción)
 * @param {string} eventType - Tipo de evento (ej. 'job.scored')
 * @param {object} payload - Datos del evento
 * @param {object} [meta] - Metadatos opcionales { source, priority }
 * @returns {string} event_id
 */
function insert(db, eventType, payload, meta = {}) {
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  db.prepare(`
    INSERT INTO event_outbox (event_id, event_type, payload, meta, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(
    eventId,
    eventType,
    JSON.stringify(payload),
    JSON.stringify({ source: meta.source || 'unknown', priority: meta.priority || 'normal', ...meta })
  );
  return eventId;
}

/**
 * Obtiene todos los eventos pendientes, ordenados por antigüedad.
 * @param {object} db
 * @param {number} [limit=50]
 * @returns {object[]}
 */
function getPending(db, limit = 50) {
  return db.prepare(`
    SELECT * FROM event_outbox
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ?
  `).all(limit).map(decodeRow);
}

/**
 * Marca un evento como 'processing' (sticky bit anti-doble-procesamiento).
 */
function markProcessing(db, eventId) {
  db.prepare(`
    UPDATE event_outbox SET status = 'processing', updated_at = datetime('now'), processing_at = datetime('now')
    WHERE event_id = ?
  `).run(eventId);
}

/**
 * Marca un evento como 'completed'.
 */
function markCompleted(db, eventId) {
  db.prepare(`
    UPDATE event_outbox SET status = 'completed', updated_at = datetime('now')
    WHERE event_id = ?
  `).run(eventId);
}

/**
 * Incrementa retry_count. Si excede max_retries, marca como 'failed'.
 * @returns {boolean} true si el evento fue a failed (DLQ), false si aún puede reintentar
 */
function markFailed(db, eventId, errorMessage) {
  const row = db.prepare("SELECT retry_count, max_retries FROM event_outbox WHERE event_id = ?").get(eventId);
  if (!row) return false;

  const newRetries = (row.retry_count || 0) + 1;
  const maxRetries = row.max_retries || 3;

  if (newRetries >= maxRetries) {
    db.prepare(`
      UPDATE event_outbox SET status = 'failed', retry_count = ?, error = ?, updated_at = datetime('now')
      WHERE event_id = ?
    `).run(newRetries, errorMessage, eventId);
    return true; // Fue a DLQ
  }

  db.prepare(`
    UPDATE event_outbox SET status = 'pending', retry_count = ?, error = ?, updated_at = datetime('now')
    WHERE event_id = ?
  `).run(newRetries, errorMessage, eventId);
  return false; // Puede reintentar
}

/**
 * Resetea eventos 'processing' atascados (power loss) a 'pending'.
 * Debe ejecutarse al inicio del daily_routine (Fase 0).
 */
function resetStuck(db) {
  const result = db.prepare(`
    UPDATE event_outbox SET status = 'pending', retry_count = 0, updated_at = datetime('now')
    WHERE status = 'processing' AND processing_at < datetime('now', '-10 minutes')
  `).run();
  return result.changes;
}

/**
 * Elimina eventos completados más viejos que N horas (housekeeping).
 */
function cleanCompleted(db, hoursOld = 72) {
  const result = db.prepare(`
    DELETE FROM event_outbox WHERE status = 'completed' AND created_at < datetime('now', ?)
  `).run(`-${hoursOld} hours`);
  return result.changes;
}

/**
 * Mueve un evento failed de la outbox a la event_dlq.
 */
function moveToDlq(db, eventId) {
  const event = db.prepare("SELECT * FROM event_outbox WHERE event_id = ?").get(eventId);
  if (!event) return false;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT OR IGNORE INTO event_dlq (id, event_type, payload, error_msg, failed_at, retry_count, status)
      VALUES (?, ?, ?, ?, datetime('now'), ?, 'pending')
    `).run(event.event_id, event.event_type, event.payload, event.error, event.retry_count);

    db.prepare("UPDATE event_outbox SET status = 'completed', updated_at = datetime('now') WHERE event_id = ?")
      .run(eventId);
  });
  tx();
  return true;
}

// ── Helpers ──

function decodeRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type,
    payload: tryParseJSON(row.payload),
    meta: tryParseJSON(row.meta),
    status: row.status,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    error: row.error,
  };
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return str; }
}

module.exports = {
  STATUS,
  insert,
  getPending,
  markProcessing,
  markCompleted,
  markFailed,
  resetStuck,
  cleanCompleted,
  moveToDlq,
};
