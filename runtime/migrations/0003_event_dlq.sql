-- 0003_event_dlq.sql: Tabla para la Dead Letter Queue
CREATE TABLE IF NOT EXISTS event_dlq (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    error_msg TEXT,
    failed_at TEXT DEFAULT (datetime('now')),
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' -- 'pending', 'resolved'
);
CREATE INDEX IF NOT EXISTS idx_event_dlq_status ON event_dlq(status);
