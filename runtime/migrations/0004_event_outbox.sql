-- 0004_event_outbox.sql: Tabla de Transactional Outbox para el Event Bus
--
-- Cada evento se inserta aquí como parte de una transacción atómica con los
-- datos de negocio. El worker (event_worker.js) consume esta tabla de forma
-- síncrona en daily_routine.js antes del shutdown.
--
-- Estados:
--   pending    → Insertado con los datos de negocio. Listo para procesar.
--   processing → El worker lo tomó. Sticky bit anti-doble-procesamiento.
--   completed  → Handler ejecutado exitosamente.
--   failed     → Handler falló tras max_retries intentos. Se archiva en event_dlq.

CREATE TABLE IF NOT EXISTS event_outbox (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT NOT NULL UNIQUE,
    event_type    TEXT NOT NULL,
    payload       TEXT NOT NULL,
    meta          TEXT DEFAULT '{}',
    status        TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count   INTEGER DEFAULT 0,
    max_retries   INTEGER DEFAULT 3,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now')),
    error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_status
    ON event_outbox(status);

CREATE INDEX IF NOT EXISTS idx_outbox_pending
    ON event_outbox(created_at) WHERE status = 'pending';
