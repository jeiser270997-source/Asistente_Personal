-- 0002_context_engine.sql: Cases + Availability

CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierto',
    titulo TEXT,
    descripcion TEXT,
    data TEXT,
    prioridad INTEGER DEFAULT 2,
    ultima_actualizacion TEXT DEFAULT (datetime('now')),
    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_cierre TEXT
);

CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    dia_semana INTEGER,
    hora_inicio TEXT,
    hora_fin TEXT,
    titulo TEXT,
    recurrente INTEGER DEFAULT 1,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT REFERENCES cases(id),
    tipo TEXT NOT NULL,
    titulo TEXT,
    data TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cases_tipo ON cases(tipo);
CREATE INDEX IF NOT EXISTS idx_cases_estado ON cases(estado);
CREATE INDEX IF NOT EXISTS idx_timeline_case ON timeline(case_id);
CREATE INDEX IF NOT EXISTS idx_avail_tipo ON availability(tipo);
