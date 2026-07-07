-- 0001_init.sql: bootstrap schema for LifeOS runtime
-- Uses IF NOT EXISTS so it's safe to re-run

CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkpoints (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'general',
    empresa TEXT,
    cargo TEXT,
    plataforma TEXT,
    url TEXT,
    detalles TEXT,
    fecha_aplicacion TEXT,
    estado TEXT DEFAULT 'aplicada',
    score INTEGER,
    compatible INTEGER,
    razones TEXT,
    extra_data TEXT,
    historial TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL DEFAULT 'caso_legal',
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    details TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);
CREATE INDEX IF NOT EXISTS idx_applications_estado ON applications(estado);
CREATE INDEX IF NOT EXISTS idx_ledger_tipo ON ledger(tipo);
CREATE TABLE IF NOT EXISTS seguimiento (
    id TEXT PRIMARY KEY DEFAULT 'sena_actual',
    curso TEXT,
    ficha TEXT,
    actividades TEXT,
    progreso TEXT,
    ultima_consulta TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name ON job_runs(job_name);

INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO meta (key, value) VALUES ('runtime_version', '1');
