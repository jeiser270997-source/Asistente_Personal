const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const DIR = {
  CONFIG:    path.join(ROOT, 'data', 'config'),
  STATE:     path.join(ROOT, 'data', 'state'),
  CACHE:     path.join(ROOT, 'data', 'cache'),
  SOURCES:   path.join(ROOT, 'data', 'sources'),
  USER:      path.join(ROOT, 'data', 'user'),
  ARTIFACTS: path.join(ROOT, 'data', 'artifacts'),
};

const PATHS = {
  // ── Config ──
  RULES: path.join(DIR.CONFIG, 'rules.json'),

  // ── State ──
  MASTER_LEDGER:   path.join(DIR.STATE, 'masterledger.json'),
  ALERTAS_SENA:    path.join(DIR.STATE, 'contexto_maestro', 'ALERTAS_SENA.md'),
  ESTADO_VIVO:     path.join(DIR.STATE, 'contexto_maestro', 'ESTADO_VIVO.md'),
  CONTEXT_MAESTRO: path.join(DIR.STATE, 'contexto_maestro'),
  SENA_TRACKING:   path.join(DIR.STATE, 'sena', 'seguimiento.json'),
  SENA_DEADLINES:  path.join(DIR.STATE, 'sena', 'deadlines.json'),
  SENA_HISTORY:    path.join(DIR.STATE, 'sena', 'historial_ejecuciones.json'),
  SIMIT_ALERTS:    path.join(DIR.STATE, 'simit', 'alertas.json'),
  BOOTCAMP_PROGRESS:  path.join(DIR.STATE, 'bootcamp', 'progreso.json'),
  BOOTCAMP_CURRICULUM: path.join(DIR.STATE, 'bootcamp', 'curriculum.json'),

  // ── Jobs state ──
  SCORING_WEIGHTS:    path.join(DIR.CONFIG, 'jobs', 'scoring_weights.json'),
  JOBS_SCORES:        path.join(DIR.STATE, 'jobs', 'scores'),
  JOBS_DECISIONS:     path.join(DIR.STATE, 'jobs', 'decisions'),
  JOBS_EVENTS:        path.join(DIR.STATE, 'jobs', 'events'),
  JOBS_METRICS:       path.join(DIR.STATE, 'jobs', 'metrics', 'historical.json'),

  // ── Cache ──
  REPOS_DB:           path.join(DIR.CACHE, 'repos_db.json'),
  REPOS_META:         path.join(DIR.CACHE, 'repos_db_meta.json'),
  DIAN:               path.join(DIR.CACHE, 'dian'),
  SIMIT_LAST_QUERY:   path.join(DIR.CACHE, 'simit', 'ultima_consulta.json'),
  SIMIT_MULTAS:       path.join(DIR.CACHE, 'simit_multas.json'),
  SENDA_CALIFICACIONES: path.join(DIR.CACHE, 'sena', 'calificaciones.json'),
  SENDA_CURSO:        path.join(DIR.CACHE, 'sena', 'curso.json'),
  JOBS_COMPUTRABAJO:  path.join(DIR.CACHE, 'jobs', 'computrabajo.json'),
  JOBS_JUNIOR:        path.join(DIR.CACHE, 'jobs', 'canal_juniorjobs.json'),

  // ── Sources ──
  SENA_MATERIALES:    path.join(DIR.SOURCES, 'sena', 'materiales'),
  SENA_EVIDENCIAS:    path.join(DIR.SOURCES, 'sena', 'evidencias'),
  DOCUMENTOS:         path.join(DIR.SOURCES, 'documentos'),
  CESDE_CLASE4:       path.join(DIR.SOURCES, 'cesde', 'clase4'),
  CESDE_COMUNICADOS:  path.join(DIR.SOURCES, 'cesde', 'comunicados'),

  // ── User ──
  USER_PROFILE:  path.join(DIR.USER, 'perfil.md'),
  USER_METAS:    path.join(DIR.USER, 'metas.md'),
  USER_FINANZAS: path.join(DIR.USER, 'finanzas.md'),

  // ── Artifacts ──
  JOBS_DIR:      path.join(DIR.ARTIFACTS, 'jobs'),
  JOBS_TAILORED: path.join(DIR.ARTIFACTS, 'jobs', 'cv_tailored'),
};

module.exports = { DIR, PATHS };
