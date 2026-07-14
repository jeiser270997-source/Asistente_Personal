const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const DIR = {
  DATA:      path.join(ROOT, 'data'),
  CONFIG:    path.join(ROOT, 'data', 'config'),
  STATE:     path.join(ROOT, 'data', 'state'),
  CACHE:     path.join(ROOT, 'data', 'cache'),
  SOURCES:   path.join(ROOT, 'data', 'sources'),
  USER:      path.join(ROOT, 'data', 'user'),
  ARTIFACTS: path.join(ROOT, 'data', 'artifacts'),
  LOGS:      path.join(ROOT, 'logs'),
  SKILLS:    path.join(ROOT, 'skills'),
  JOBS:      path.join(ROOT, 'data', 'jobs'),
  SENA:      path.join(ROOT, 'data', 'sena'),
  DIAN:      path.join(ROOT, 'data', 'dian'),
  SIMIT:     path.join(ROOT, 'data', 'simit'),
  DOCS:      path.join(ROOT, 'data', 'documentos'),
  BACKUPS:   path.join(ROOT, 'data', 'backups'),
  MEMORIA_LEGACY: path.join(ROOT, 'data', 'memoria'),
};

const PATHS = {
  // ── Config ──
  RULES: path.join(DIR.CONFIG, 'rules.json'),

  // ── State ──
  MASTER_LEDGER:     path.join(DIR.STATE, 'masterledger.json'),
  ALERTAS_SENA:      path.join(DIR.STATE, 'contexto_maestro', 'ALERTAS_SENA.md'),
  ESTADO_VIVO:       path.join(DIR.STATE, 'contexto_maestro', 'ESTADO_VIVO.md'),
  REGISTRO_ESTUDIO:  path.join(DIR.STATE, 'contexto_maestro', 'REGISTRO_DE_ESTUDIO.md'),
  CONTEXT_MAESTRO:   path.join(DIR.STATE, 'contexto_maestro'),
  SENA_TRACKING:     path.join(DIR.STATE, 'sena', 'seguimiento.json'),
  SENA_DEADLINES:    path.join(DIR.STATE, 'sena', 'deadlines.json'),
  SENA_HISTORY:      path.join(DIR.STATE, 'sena', 'historial_ejecuciones.json'),
  SIMIT_ALERTS:      path.join(DIR.STATE, 'simit', 'alertas.json'),
  BOOTCAMP_PROGRESS:    path.join(DIR.STATE, 'bootcamp', 'progreso.json'),
  BOOTCAMP_CURRICULUM:  path.join(DIR.STATE, 'bootcamp', 'curriculum.json'),

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
  USER_PERFIL_CANDIDATO: path.join(ROOT, 'data', 'user', 'perfil_candidato.txt'),

  // ── Core data ──
  VITAL:     path.join(DIR.DATA, 'contexto_vital.json'),
  NOTAS:     path.join(DIR.DATA, 'notas.md'),
  PENDING:   path.join(DIR.DATA, 'pending.json'),
  MEMORIA_DB: path.join(DIR.DATA, 'memoria_hipocampo.db'),
  HECHOS_JSON_LEGACY: path.join(DIR.MEMORIA_LEGACY, 'hechos.json'),
  INDICE_JSON_LEGACY: path.join(DIR.MEMORIA_LEGACY, 'indice.json'),

  // ── SENA ──
  SENA_CURSO:    path.join(DIR.SENA, 'curso.json'),
  SENA_DEADLINES_FILE: path.join(DIR.SENA, 'deadlines.json'),

  // ── Skills ──
  SKILL_ROUTER:      path.join(DIR.SKILLS, 'router.js'),
  SKILL_CEREBRO:     path.join(DIR.SKILLS, 'cerebro.md'),
  USER_SKILLS_INDEX: path.join(DIR.SKILLS, 'user_skills_index.json'),
  SISTEMA_SKILLS_INDEX: path.join(DIR.SKILLS, 'skills_sistema_index.json'),

  // ── Scripts ──
  BRAIN_ORCHESTRATOR_LOG: path.join(DIR.LOGS, 'brain_orchestrator.log'),
  COMPUTRABAJO_JSON:      path.join(DIR.JOBS, 'computrabajo.json'),
  APPLY_QUEUE:            path.join(DIR.JOBS, 'apply_queue.json'),
  APLICACIONES:           path.join(DIR.JOBS, 'aplicaciones.json'),

  // ── Artifacts ──
  JOBS_DIR:      path.join(DIR.ARTIFACTS, 'jobs'),
  JOBS_TAILORED: path.join(DIR.ARTIFACTS, 'jobs', 'cv_tailored'),
};

module.exports = { ROOT, DIR, PATHS };
