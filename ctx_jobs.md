This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: scripts/jobs/**, lib/jobs/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
lib/jobs/contracts/01_normalizer.js
lib/jobs/contracts/02_scorer.js
lib/jobs/contracts/03_gapAnalyzer.js
lib/jobs/contracts/04_cvStrategy.js
lib/jobs/contracts/05_critic.js
lib/jobs/contracts/06_interviewPrep.js
lib/jobs/contracts/07_feedbackEngine.js
lib/jobs/docs/01_pipeline.md
lib/jobs/docs/02_state_machine.md
lib/jobs/docs/03_persistence.md
lib/jobs/feedbackEngine.js
lib/jobs/gapAnalyzer.js
lib/jobs/metrics/applicationMetrics.js
lib/jobs/reviewerPipeline.js
lib/jobs/reviewers/ats.js
lib/jobs/reviewers/consistency.js
lib/jobs/reviewers/recruiter.js
lib/jobs/reviewers/technical.js
lib/jobs/scorer.js
lib/jobs/types/ApplicationDecision.js
lib/jobs/types/CandidateProfile.js
lib/jobs/types/CompanyProfile.js
lib/jobs/types/GapReport.js
lib/jobs/types/InterviewPack.js
lib/jobs/types/JobPosting.js
lib/jobs/types/ScoreBreakdown.js
scripts/jobs/analyze_and_apply.js
scripts/jobs/build_cv.js
scripts/jobs/buscar_medellin.js
scripts/jobs/check_aplicaciones.js
scripts/jobs/computrabajo_apply.js
scripts/jobs/computrabajo_scraper.js
scripts/jobs/ct_login_helper.js
scripts/jobs/cv_tailorer.js
scripts/jobs/find_aplicaciones.js
scripts/jobs/job_loop.js
scripts/jobs/login_ct.js
scripts/jobs/metrics/uhabits_engine.js
scripts/jobs/pico_placa_scraper.js
scripts/jobs/revisar_ofertas.js
scripts/jobs/whatsapp_jobs_parser.js
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="lib/jobs/contracts/01_normalizer.js">
/**
 * Normalizer
 * Convierte ofertas de cualquier fuente (Computrabajo, LinkedIn, Indeed, correo)
 * al formato estandarizado JobPosting.
 *
 * Input:  raw data desde scraper/parser
 * Output: JobPosting normalizado
 *
 * Cada fuente implementa su propio normalizer.
 * El NormalizerRouter selecciona el correcto según job.source.
 */

const CONTRACT = {
  input: 'raw:Object (datos crudos del portal)',
  output: 'JobPosting',
  methods: [
    {
      name: 'normalize(raw)',
      returns: 'JobPosting',
      description: 'Normaliza una oferta cruda al formato estándar',
    },
    {
      name: 'normalizeBatch(rawList)',
      returns: 'JobPosting[]',
      description: 'Normaliza múltiples ofertas en lote',
    },
    {
      name: 'supports(source)',
      returns: 'boolean',
      description: 'Indica si este normalizer soporta la fuente indicada',
    },
  ],
  errors: ['UNSUPPORTED_SOURCE', 'MALFORMED_INPUT', 'MISSING_REQUIRED_FIELDS'],
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/contracts/02_scorer.js">
/**
 * Scorer
 * Evalúa una oferta normalizada contra el perfil del candidato.
 *
 * Input:  JobPosting, CandidateProfile
 * Output: ScoreBreakdown
 *
 * Composición:
 *   70% reglas determinísticas (skills, salario, modalidad, seniority, inglés, ubicación)
 *   30% evaluación LLM (alineación cultural, potencial de crecimiento, red flags)
 *
 * Los pesos se cargan desde data/config/jobs/scoring_weights.json
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile',
  output: 'ScoreBreakdown',
  methods: [
    {
      name: 'score(job, profile)',
      returns: 'ScoreBreakdown',
      description: 'Calcula el score completo de una oferta',
    },
    {
      name: 'scoreBatch(jobs, profile)',
      returns: 'ScoreBreakdown[]',
      description: 'Evalúa múltiples ofertas, ordenadas por score descendente',
    },
    {
      name: 'explain(score)',
      returns: 'string',
      description: 'Genera explicación legible del desglose',
    },
    {
      name: 'getThresholds()',
      returns: '{ apply: number, maybe: number }',
      description: 'Retorna los umbrales de decisión >= apply, >= maybe, < maybe',
    },
  ],
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/contracts/03_gapAnalyzer.js">
/**
 * GapAnalyzer
 * Compara la oferta contra el perfil para identificar brechas y fortalezas.
 * No genera CV, solo analiza qué falta y qué resaltar.
 *
 * Input:  JobPosting, CandidateProfile, ScoreBreakdown
 * Output: GapReport
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile, ScoreBreakdown',
  output: 'GapReport',
  methods: [
    {
      name: 'analyze(job, profile, score)',
      returns: 'GapReport',
      description: 'Analiza brechas entre el perfil y la oferta',
    },
    {
      name: 'getCoverage(gap)',
      returns: 'number',
      description: 'Porcentaje de cobertura 0-100',
    },
    {
      name: 'summarize(gap)',
      returns: 'string',
      description: 'Resumen ejecutivo de 2-3 líneas',
    },
  ],
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/contracts/04_cvStrategy.js">
/**
 * CVStrategy
 * Define cómo adaptar el CV para esta oferta específica basado en el gap.
 * No genera el CV, solo dice qué cambiar, qué enfatizar y qué omitir.
 *
 * Input:  JobPosting, CandidateProfile, GapReport
 * Output: TailoringPlan
 */

/**
 * @typedef {Object} TailoringPlan
 * @property {Object[]} sections - Secciones del CV a modificar
 * @property {string} sections.name - Nombre de la sección
 * @property {'add'|'remove'|'reorder'|'rewrite'} sections.action
 * @property {string} sections.content - Nuevo contenido
 * @property {string} sections.reason - Por qué este cambio
 * @property {Object[]} highlights - Experiencias a destacar
 * @property {string} highlights.experience - Descripción
 * @property {string} highlights.reason - Por qué destacarla
 * @property {string} summaryTitle - Título de resumen para el CV
 * @property {string[]} keywords - Palabras clave de la oferta a incluir
 * @property {string} [coverLetterAngle] - Ángulo para la carta de presentación
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile, GapReport',
  output: 'TailoringPlan',
  methods: [
    {
      name: 'createPlan(job, profile, gap)',
      returns: 'TailoringPlan',
      description: 'Crea un plan de adaptación de CV para la oferta',
    },
    {
      name: 'prioritizeHighlights(plan)',
      returns: 'TailoringPlan',
      description: 'Reordena secciones según relevancia para la oferta',
    },
  ],
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/contracts/05_critic.js">
/**
 * Critic
 * Segundo agente independiente que revisa el plan de CV antes de ejecutarlo.
 * Busca inconsistencias, exageraciones, problemas ATS y omisiones.
 *
 * Personalidad: escéptico, meticuloso, centrado en credibilidad.
 * Independiente del Generator (otro prompt, otro rol).
 *
 * Input:  TailoringPlan, JobPosting, CandidateProfile, GapReport
 * Output: CriticReview
 */

/**
 * @typedef {Object} CriticReview
 * @property {'approved'|'changes_requested'|'rejected'} verdict
 * @property {Object[]} issues - Problemas encontrados
 * @property {'inconsistency'|'exaggeration'|'ats_problem'|'omission'|'accuracy'} issues.type
 * @property {string} issues.section - Sección afectada
 * @property {string} issues.description
 * @property {string} issues.suggestion - Cómo corregirlo
 * @property {Object[]} strengths - Aciertos del plan
 * @property {string} strengths.section
 * @property {string} strengths.reason
 * @property {number} confidence - 0-100, qué tan seguro está el crítico
 */

const CONTRACT = {
  input: 'TailoringPlan, JobPosting, CandidateProfile, GapReport',
  output: 'CriticReview',
  methods: [
    {
      name: 'review(plan, job, profile, gap)',
      returns: 'CriticReview',
      description: 'Revisa el plan de CV y emite un veredicto',
    },
    {
      name: 'isApproved(review)',
      returns: 'boolean',
      description: 'True si el plan puede ejecutarse',
    },
    {
      name: 'iterate(plan, review, job, profile, gap)',
      returns: 'TailoringPlan',
      description: 'Aplica las correcciones sugeridas y genera nueva versión',
    },
  ],
  maxIterations: 3,
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/contracts/06_interviewPrep.js">
/**
 * InterviewPrep
 * Genera material de preparación para entrevista basado en la oferta y el CV enviado.
 *
 * Input:  JobPosting, CandidateProfile, TailoringPlan
 * Output: InterviewPack
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile, TailoringPlan',
  output: 'InterviewPack',
  methods: [
    {
      name: 'prepare(job, profile, plan)',
      returns: 'InterviewPack',
      description: 'Genera el paquete completo de preparación',
    },
    {
      name: 'generateSTAR(situation, task, action, result)',
      returns: 'string',
      description: 'Construye una historia STAR estructurada',
    },
    {
      name: 'mockQuestions(pack)',
      returns: 'string[]',
      description: 'Simula preguntas del entrevistador para practicar',
    },
  ],
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/contracts/07_feedbackEngine.js">
/**
 * FeedbackEngine
 * Consume eventos del ciclo de vida de las aplicaciones y ajusta los pesos del scorer.
 *
 * Eventos que consume:
 *   application.created
 *   application.viewed
 *   application.rejected
 *   application.interview
 *   application.technical_test
 *   application.offer
 *   application.accepted
 *   application.declined
 *   application.ghosted (sin respuesta después de N días)
 *
 * Aprendizaje:
 *   - Si ofertas con score alto son sistemáticamente rechazadas → ajustar pesos
 *   - Si ofertas con skills específicas generan entrevistas → ponderar más esas skills
 *   - Si una empresa siempre rechaza → reducir su peso en company
 *
 * Input:  ApplicationEvent
 * Output: void (modifica scoring_weights.json)
 */

/**
 * @typedef {Object} ApplicationEvent
 * @property {string} applicationId
 * @property {string} jobId
 * @property {string} company
 * @property {'applied'|'viewed'|'rejected'|'interview'|'technical_test'|'offer'|'accepted'|'declined'|'ghosted'} status
 * @property {number} score - Score con el que se aplicó
 * @property {ScoreBreakdown} scoreBreakdown
 * @property {Date} timestamp
 * @property {Object} [metadata] - Datos adicionales (feedback, motivo rechazo)
 */

const CONTRACT = {
  input: 'ApplicationEvent',
  output: 'void (side effect: actualiza pesos)',
  methods: [
    {
      name: 'processEvent(event)',
      returns: 'void',
      description: 'Procesa un evento de aplicación y actualiza el modelo',
    },
    {
      name: 'getAdjustments()',
      returns: '{ weight: string, delta: number }[]',
      description: 'Retorna los ajustes de pesos pendientes de aplicar',
    },
    {
      name: 'applyAdjustments()',
      returns: 'boolean',
      description: 'Persiste los ajustes en scoring_weights.json',
    },
    {
      name: 'getStats()',
      returns: '{ applied, interviews, offers, conversionRate }',
      description: 'Estadísticas agregadas de rendimiento',
    },
  ],
};

module.exports = { CONTRACT };
</file>

<file path="lib/jobs/docs/01_pipeline.md">
# Pipeline de Empleo

```
Fuente externa (Computrabajo, LinkedIn, Indeed, correo, etc)
        │
        ▼
[1] Normalizer ─── convierte datos crudos a JobPosting
        │
        ▼
[2] Scorer ─── evalúa contra CandidateProfile → ScoreBreakdown
        │
        ▼
[3] GapAnalyzer ─── identifica brechas y fortalezas → GapReport
        │
        ▼
[4] CVStrategy ─── define cómo adaptar el CV → TailoringPlan
        │
        ▼
[5] Critic ─── revisión independiente del plan → CriticReview
        │
        ▼
[6] Decision ─── ¿aplicar? → ApplicationDecision
        │
        ├── skip → fin
        │
        └── apply
              │
              ▼
        [7] CV Tailorer ─── genera CV adaptado
              │
              ▼
        [8] Cover Letter ─── genera carta de presentación
              │
              ▼
        [9] Apply ─── envía la postulación
              │
              ▼
       [10] InterviewPrep ─── preparación para entrevista
              │
              ▼
       [11] FeedbackEngine ─── aprende de resultados
```

## Flujo de decisión

```
score > threshold.apply    → aplicar automáticamente
score > threshold.maybe    → preguntar al usuario
score < threshold.maybe    → skip automático
```

Los thresholds se cargan desde `data/config/jobs/scoring_weights.json`
</file>

<file path="lib/jobs/docs/02_state_machine.md">
# Máquina de Estados de una Aplicación

```
                    ┌──────────┐
                    │ applied  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  viewed  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌────▼────┐    │
         │rejected│ │rejected │    │
         │ (filtro)│ │(entrev.)│    │
         └────────┘ └─────────┘    │
                                   │
                              ┌────▼─────┐
                              │interview │
                              └────┬─────┘
                                   │
                              ┌────▼────────┐
                              │technical_   │
                              │test         │
                              └────┬────────┘
                                   │
                              ┌────▼─────┐
                              │  offer   │
                              └────┬─────┘
                                   │
                          ┌────────┼────────┐
                          │        │        │
                     ┌────▼──┐ ┌───▼────┐   │
                     │accepted│ │declined│   │
                     └────────┘ └────────┘   │
                                        ┌────▼────┐
                                        │ ghosted │
                                        │ (30+ días│
                                        └─────────┘
```

## Transiciones válidas

| Desde | Hasta | Evento |
|-------|-------|--------|
| - | applied | application.created |
| applied | viewed | application.viewed |
| applied | rejected | application.rejected |
| viewed | interview | application.interview |
| viewed | rejected | application.rejected |
| interview | technical_test | application.technical_test |
| interview | rejected | application.rejected |
| technical_test | offer | application.offer |
| technical_test | rejected | application.rejected |
| offer | accepted | application.accepted |
| offer | declined | application.declined |
| applied | ghosted | timeout 30 días sin cambios |

## Eventos del FeedbackEngine

Cada transición emite un `ApplicationEvent` que el FeedbackEngine consume para ajustar pesos.
</file>

<file path="lib/jobs/docs/03_persistence.md">
# Estrategia de Persistencia

## Dónde se guarda cada cosa

| Dato | Ubicación | Formato | Notas |
|------|-----------|---------|-------|
| Ofertas normalizadas | `data/cache/jobs/` | JSON | Regenerable |
| Scores y desgloses | `data/state/jobs/scores/` | JSON | Versionado |
| Decisiones de aplicación | `data/state/jobs/decisions/` | JSON | Versionado |
| Eventos del feedback | `data/state/jobs/events/` | JSON | Versionado |
| Pesos del scorer | `data/config/jobs/scoring_weights.json` | JSON | Versionado |
| CVs generados | `data/artifacts/jobs/cv_tailored/` | PDF/MD | No versionado |
| Historial aplicaciones | `data/state/masterledger.json` | JSON | Versionado (existente) |

## Integración con masterledger

El `masterledger` existente se conserva como ledger central.
Cada aplicación registra un evento en masterledger con:

```json
{
  "fecha": "2026-07-07",
  "tipo": "job_application",
  "empresa": "Empresa SAS",
  "cargo": "QA Engineer",
  "score": 84,
  "estado": "applied",
  "detalle": "Aplicación automática vía pipeline"
}
```

## Lectura vía lib/data/paths.js

Todas las rutas se resuelven mediante `lib/data/paths.js`.
Ningún módulo de `lib/jobs/` debe contener rutas hardcodeadas.

```js
const { PATHS } = require('../../data/paths');
// ✅ Correcto
const weights = readJSON(PATHS.SCORING_WEIGHTS);
```
</file>

<file path="lib/jobs/feedbackEngine.js">
/**
 * lib/jobs/feedbackEngine.js
 *
 * Feedback Engine — Implementación real.
 * Consume eventos del ciclo de vida de aplicaciones y ajusta
 * los pesos del scorer (scoring_weights.json) basado en resultados.
 *
 * Conectado al Event Bus para recibir eventos:
 *   job.applied → registra aplicación
 *   job.rejection → penaliza empresa/skills que no generan entrevistas
 *   job.interview → bonifica skills que sí generan entrevistas
 */

const fs = require('node:fs');
const path = require('node:path');

const WEIGHTS_PATH = path.resolve(__dirname, '..', '..', 'data', 'config', 'jobs', 'scoring_weights.json');
const HISTORY_PATH = path.resolve(__dirname, '..', '..', 'data', 'state', 'jobs', 'feedback_history.json');

// ── Estado interno ──
let _history = null;

function loadHistory() {
  if (_history) return _history;
  try {
    _history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    _history = { events: [], adjustments: [], stats: { applied: 0, interviews: 0, offers: 0, rejections: 0, ghosted: 0 } };
  }
  return _history;
}

function saveHistory() {
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(_history, null, 2));
}

function loadWeights() {
  try {
    return JSON.parse(fs.readFileSync(WEIGHTS_PATH, 'utf8'));
  } catch {
    return { weights: {}, thresholds: { apply: 75, maybe: 50 }, adjustments: {} };
  }
}

function saveWeights(data) {
  fs.mkdirSync(path.dirname(WEIGHTS_PATH), { recursive: true });
  fs.writeFileSync(WEIGHTS_PATH, JSON.stringify(data, null, 2));
}

// ── Procesamiento de eventos ──

/**
 * Procesa un evento de aplicación y actualiza el modelo interno
 * @param {Object} event - { type, empresa, cargo, plataforma, score, status }
 */
function processEvent(event) {
  const history = loadHistory();
  history.events.push({ ...event, timestamp: new Date().toISOString() });

  // Actualizar contadores
  const s = event.status || 'applied';
  if (s === 'applied') history.stats.applied++;
  else if (s === 'interview' || s === 'technical_test') history.stats.interviews++;
  else if (s === 'offer' || s === 'accepted') history.stats.offers++;
  else if (s === 'rejected') history.stats.rejections++;
  else if (s === 'ghosted') history.stats.ghosted++;

  saveHistory();
  return true;
}

/**
 * Retorna los ajustes de pesos pendientes de aplicar
 * Basado en: tasa de conversión por empresa, skills que generan entrevistas
 */
function getAdjustments() {
  const history = loadHistory();
  const weights = loadWeights();
  const total = history.stats.applied || 1;
  const conversionRate = (history.stats.interviews / total) * 100;
  const adjustments = [];

  if (conversionRate < 10 && history.stats.applied > 5) {
    // Baja conversión → reducir peso de skills genéricas, aumentar de inglés
    adjustments.push({ weight: 'skills', delta: -2, reason: `Baja conversión (${conversionRate.toFixed(0)}%)` });
    adjustments.push({ weight: 'english', delta: +2, reason: 'Skills genéricas no diferenciadoras, inglés suma más' });
  }

  if (history.stats.interviews > 2 && history.stats.offers === 0) {
    // Hay entrevistas pero no ofertas → problema en seniority o salary
    adjustments.push({ weight: 'seniority', delta: -3, reason: 'Entrevistas sin ofertas — posible sobrevaloración de seniority' });
    adjustments.push({ weight: 'salary', delta: -2, reason: 'Ajustar expectativa salarial' });
  }

  if (history.stats.rejections > history.stats.applied * 0.5) {
    // Más del 50% de aplicaciones rechazadas → bajar threshold
    adjustments.push({ threshold: 'apply', delta: -5, reason: 'Alta tasa de rechazo, bajar umbral' });
  }

  return adjustments;
}

/**
 * Persiste los ajustes en scoring_weights.json
 */
function applyAdjustments() {
  const adjustments = getAdjustments();
  if (adjustments.length === 0) return false;

  const weights = loadWeights();

  for (const adj of adjustments) {
    if (adj.weight && weights.weights[adj.weight] !== undefined) {
      weights.weights[adj.weight] = Math.max(1, Math.min(50, weights.weights[adj.weight] + adj.delta));
    }
    if (adj.threshold && weights.thresholds[adj.threshold] !== undefined) {
      weights.thresholds[adj.threshold] = Math.max(30, weights.thresholds[adj.threshold] + adj.delta);
    }
    weights.version = (weights.version || 1) + 1;
  }

  saveWeights(weights);

  // Registrar ajustes
  const history = loadHistory();
  history.adjustments.push({ adjustments, applied_at: new Date().toISOString(), weights_version: weights.version });
  saveHistory();

  return true;
}

/**
 * Estadísticas agregadas de rendimiento
 */
function getStats() {
  const history = loadHistory();
  const total = history.stats.applied || 1;
  return {
    applied: history.stats.applied,
    interviews: history.stats.interviews,
    offers: history.stats.offers,
    rejections: history.stats.rejections,
    ghosted: history.stats.ghosted,
    conversionRate: parseFloat(((history.stats.interviews / total) * 100).toFixed(1)),
    offerRate: parseFloat(((history.stats.offers / total) * 100).toFixed(1)),
  };
}

/**
 * Conecta el Feedback Engine al Event Bus
 * @param {Object} bus - Event Bus instance (event_bus.js)
 */
function connectToBus(bus) {
  if (!bus || !bus.on) {
    console.warn('[feedbackEngine] No event bus provided');
    return;
  }

  bus.on('job.applied', (envelope) => {
    processEvent({ ...envelope.payload, status: 'applied' });
    logAdjustment();
  });

  bus.on('job.rejection', (envelope) => {
    processEvent({ ...envelope.payload, status: 'rejected' });
    logAdjustment();
  });

  if (bus.once) {
    bus.on('job.interview', (envelope) => {
      processEvent({ ...envelope.payload, status: 'interview' });
      logAdjustment();
    });
  }

  console.log('[feedbackEngine] ✅ Conectado al Event Bus');
}

function logAdjustment() {
  const adjustments = getAdjustments();
  if (adjustments.length > 0) {
    console.log(`[feedbackEngine] ⚡ ${adjustments.length} ajuste(s) pendiente(s):`);
    for (const a of adjustments) {
      console.log(`   ${a.weight || a.threshold}: ${a.delta > 0 ? '+' : ''}${a.delta} (${a.reason})`);
    }
  }
}

module.exports = { processEvent, getAdjustments, applyAdjustments, getStats, connectToBus };
</file>

<file path="lib/jobs/gapAnalyzer.js">
/**
 * GapAnalyzer — Cuantitativo
 *
 * Compara una oferta contra el perfil y produce:
 *   - Cobertura % por categoría
 *   - Skills matching detallado (✅⚠️❌)
 *   - Impacto estimado de cerrar cada brecha
 *   - ROI de aprendizaje por skill faltante
 *
 * No genera texto libre. Solo datos.
 */

let bus;
try { bus = require('../events/event_bus'); } catch { bus = null; }

/**
 * @param {Object} job     - JobPosting normalizado
 * @param {Object} profile - CandidateProfile
 * @returns {Object} gapReport
 */
function analyze(job, profile) {
  const skills = _analyzeSkills(job.requirements || [], profile.skills || []);
  const experience = _analyzeExperience(job, profile);
  const coverage = _calculateCoverage(skills, experience);

  const result = {
    jobTitle: job.title,
    company: job.company,
    coverage,
    skills,
    experience,
    learningROI: _calculateLearningROI(skills, job.requirements || []),
    summary: `${coverage.overall}% cobertura — ${skills.matched}/${skills.total} skills.`,
  };

  if (bus) { try {
    bus.emit('job.gap_analyzed', {
      jobId: job.sourceId || job.url,
      coverage: coverage.overall,
      missingSkills: skills.details.filter(s => s.status === 'missing').map(s => s.name),
    }, { source: 'gapAnalyzer', priority: 'low' });
  } catch (_) {} }

  return result;
}

function _analyzeSkills(requirements, profileSkills) {
  const profileLower = profileSkills.map(s => s.toLowerCase());
  const details = requirements.map(req => {
    const rl = req.toLowerCase();
    const match = profileLower.some(ps => ps.includes(rl) || rl.includes(ps));
    const partial = !match && profileLower.some(ps => {
      const words = rl.split(/\s+/);
      return words.some(w => w.length > 3 && ps.includes(w));
    });
    return {
      name: req,
      status: match ? 'matched' : partial ? 'partial' : 'missing',
      inProfile: match || partial,
    };
  });

  return {
    total: details.length,
    matched: details.filter(d => d.status === 'matched').length,
    partial: details.filter(d => d.status === 'partial').length,
    missing: details.filter(d => d.status === 'missing').length,
    coverage: Math.round((details.filter(d => d.inProfile).length / details.length) * 100),
    details,
  };
}

function _analyzeExperience(job, profile) {
  const issues = [];
  // Sin datos de experiencia aún
  return {
    yearsMatch: null,
    issues,
    coverage: 100,
  };
}

function _calculateCoverage(skills, experience) {
  const overall = Math.round((skills.coverage + experience.coverage) / 2);
  return { overall, skills: skills.coverage, experience: experience.coverage };
}

function _calculateLearningROI(skills, requirements) {
  // Por cada skill faltante, estima:
  // - frecuencia en el mercado (proxy: requisitos similares)
  // - cuanto subiría el score si la aprendiera
  // - tiempo estimado de aprendizaje
  const missing = skills.details.filter(s => s.status === 'missing');
  return missing.map(skill => {
    const difficulty = _estimateDifficulty(skill.name);
    const scoreImpact = _estimateScoreImpact(skill.name, requirements.length);
    const marketDemand = _estimateMarketDemand(skill.name);
    return {
      skill: skill.name,
      status: 'missing',
      scoreImpact: `${scoreImpact} pts`,
      difficulty,
      estimatedHours: difficulty === 'baja' ? 20 : difficulty === 'media' ? 60 : 120,
      marketDemand,
      roi: marketDemand === 'alta' && difficulty !== 'alta' ? 'alto' : 'bajo',
      recommendation: _recommendation(marketDemand, difficulty, scoreImpact),
    };
  });
}

function _estimateDifficulty(skill) {
  const name = skill.toLowerCase();
  if (/docker|kubernetes|aws|azure|ci\/cd|terraform/i.test(name)) return 'media';
  if (/rust|machine learning|deep learning|ia|blockchain/i.test(name)) return 'alta';
  if (/python|javascript|typescript|sql|git|api|selenium|playwright|cypress/i.test(name)) return 'baja';
  return 'media';
}

function _estimateScoreImpact(skill, totalRequirements) {
  return Math.round((1 / Math.max(totalRequirements, 1)) * 100);
}

function _estimateMarketDemand(skill) {
  const name = skill.toLowerCase();
  if (/docker|kubernetes|aws|python|react|node|sql|git|api|playwright|selenium|ci\/cd/i.test(name)) return 'alta';
  if (/(java|c#|.net|php|angular|typescript|azure|devops)/i.test(name)) return 'alta';
  return 'media';
}

function _recommendation(demand, difficulty, impact) {
  if (demand === 'alta' && difficulty !== 'alta') return 'prioritario';
  if (demand === 'alta') return 'recomendado';
  if (impact > 15) return 'recomendado';
  return 'opcional';
}

module.exports = { analyze };
</file>

<file path="lib/jobs/metrics/applicationMetrics.js">
/**
 * ApplicationMetrics
 * Mide, registra y reporta el rendimiento del pipeline de empleo.
 *
 * Desde el día 1 registra todo. Sin datos no hay mejora.
 *
 * Output principal: data/state/jobs/metrics/historical.json
 */

const { writeJSON } = require('../../data/writer');
const { PATHS } = require('../../data/paths');

/**
 * @typedef {Object} ScorerRun
 * @property {string} jobId
 * @property {string} company
 * @property {string} title
 * @property {number} totalScore
 * @property {Object} breakdown - ScoreBreakdown completo
 * @property {'apply'|'maybe'|'skip'} decision
 * @property {number} executionTimeMs
 * @property {string} modelUsed - LLM usado (o 'deterministico')
 * @property {number} tokensConsumed
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ApplicationOutcome
 * @property {string} jobId
 * @property {string} company
 * @property {number} score
 * @property {string} appliedAt
 * @property {string|null} responseAt - Fecha de respuesta
 * @property {'applied'|'viewed'|'rejected'|'interview'|'offer'|'accepted'|'ghosted'} status
 * @property {number|null} daysToResponse
 * @property {string|null} rejectionReason - Motivo si lo hay
 */

function recordRun(run) {
  const log = _loadLog();
  log.runs.push({ ...run, timestamp: new Date().toISOString() });
  log.lastUpdated = new Date().toISOString();
  _saveLog(log);
}

function recordOutcome(outcome) {
  const log = _loadLog();
  const existing = log.outcomes.findIndex(o => o.jobId === outcome.jobId);
  if (existing >= 0) {
    log.outcomes[existing] = { ...log.outcomes[existing], ...outcome };
  } else {
    log.outcomes.push({ ...outcome, appliedAt: outcome.appliedAt || new Date().toISOString() });
  }
  log.lastUpdated = new Date().toISOString();
  _saveLog(log);
}

function getStats() {
  const log = _loadLog();
  const outcomes = log.outcomes;
  const total = outcomes.length;
  if (total === 0) {
    return { total: 0, message: 'Aún sin datos. Las métricas mejoran con cada aplicación.' };
  }

  const interviews = outcomes.filter(o => o.status === 'interview' || o.status === 'offer' || o.status === 'accepted').length;
  const offers = outcomes.filter(o => o.status === 'offer' || o.status === 'accepted').length;
  const accepted = outcomes.filter(o => o.status === 'accepted').length;
  const rejected = outcomes.filter(o => o.status === 'rejected').length;
  const ghosted = outcomes.filter(o => o.status === 'ghosted').length;

  const scored = log.runs.length;
  const avgScore = scored > 0 ? Math.round(log.runs.reduce((s, r) => s + r.totalScore, 0) / scored) : 0;

  // Score promedio por resultado
  const scoreByOutcome = {};
  for (const o of outcomes) {
    const run = log.runs.find(r => r.jobId === o.jobId);
    if (run) {
      scoreByOutcome[o.status] = scoreByOutcome[o.status] || [];
      scoreByOutcome[o.status].push(run.totalScore);
    }
  }
  const avgScoreByOutcome = {};
  for (const [status, scores] of Object.entries(scoreByOutcome)) {
    avgScoreByOutcome[status] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return {
    total,
    scored,
    avgScore,
    interviews,
    offers,
    accepted,
    rejected,
    ghosted,
    conversionRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
    offerRate: total > 0 ? Math.round((offers / total) * 100) : 0,
    avgScoreByOutcome,
  };
}

function _loadLog() {
  try {
    return JSON.parse(require('fs').readFileSync(PATHS.JOBS_METRICS, 'utf8'));
  } catch {
    return { runs: [], outcomes: [], lastUpdated: null };
  }
}

function _saveLog(data) {
  const fs = require('fs');
  const dir = require('path').dirname(PATHS.JOBS_METRICS);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  writeJSON(PATHS.JOBS_METRICS, data);
}

module.exports = { recordRun, recordOutcome, getStats };
</file>

<file path="lib/jobs/reviewerPipeline.js">
/**
 * Reviewer Pipeline
 *
 * Orquesta múltiples revisores sobre un CV.
 * Configurable por tipo de vacante.
 *
 * Orden: ats → consistency → technical → recruiter
 * Cada revisor solo se ejecuta si el anterior pasa.
 * El recruiter (LLM) solo si los determinísticos pasan.
 *
 * Output: { overall, reviews[], passed, metrics }
 */

const ats = require('./reviewers/ats');
const consistency = require('./reviewers/consistency');
const technical = require('./reviewers/technical');
const recruiter = require('./reviewers/recruiter');

const DEFAULT_CONFIG = {
  reviewers: ['ats', 'consistency', 'technical'],
  minScore: 60,
  stopOnFail: true,
};

/**
 * @param {string} cvText - Texto completo del CV
 * @param {Object} job - JobPosting normalizado
 * @param {Object} [config] - Configuración opcional
 * @param {string[]} [config.reviewers] - Qué revisores ejecutar
 * @param {number} [config.minScore] - Score mínimo para pasar
 * @param {boolean} [config.stopOnFail] - Detener si un revisor falla
 * @param {boolean} [config.useLLM] - Incluir revisor LLM
 * @returns {Object}
 */
function run(cvText, job, config = {}) {
  const start = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  if (config.useLLM && !cfg.reviewers.includes('recruiter')) cfg.reviewers.push('recruiter');

  const reviewers = { ats, consistency, technical, recruiter };
  const results = [];
  let passed = true;

  for (const name of cfg.reviewers) {
    if (!reviewers[name]) continue;

    const result = reviewers[name].review(cvText, job);
    result.reviewer = name;
    const elapsed = Date.now() - start;

    results.push(result);

    if (!result.passed && cfg.stopOnFail) {
      passed = false;
      return {
        overall: _calculateOverall(results),
        passed: false,
        reviews: results,
        stoppedAt: name,
        reason: `${name} no pasó (score: ${result.score})`,
        metrics: { executionTimeMs: Date.now() - start, reviewersExecuted: results.length, totalReviewers: cfg.reviewers.length },
      };
    }

    if (result.score < cfg.minScore) passed = false;
  }

  const overall = _calculateOverall(results);

  return {
    overall,
    passed,
    reviews: results,
    stoppedAt: null,
    reason: passed ? 'CV aprobado por todos los revisores' : `Score mínimo no alcanzado (${overall} < ${cfg.minScore})`,
    metrics: {
      executionTimeMs: Date.now() - start,
      deterministicPct: Math.round((results.filter(r => !r.needsLLM).length / results.length) * 100),
      llmPct: Math.round((results.filter(r => r.needsLLM).length / results.length) * 100),
      reviewersExecuted: results.length,
      totalReviewers: cfg.reviewers.length,
    },
  };
}

function _calculateOverall(reviews) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((s, r) => s + (r.score || 0), 0);
  return Math.round(total / reviews.length);
}

module.exports = { run };
</file>

<file path="lib/jobs/reviewers/ats.js">
/**
 * ATS Reviewer — 100% determinístico
 *
 * Revisa el CV contra reglas de sistemas de tracking.
 * Sin IA. Solo formato, keywords, estructura.
 *
 * Output: ATSReview { score, issues[], warnings[], passed }
 */

function review(cvText, job) {
  const issues = [];
  const warnings = [];

  // Longitud
  const lines = cvText.split('\n').filter(l => l.trim());
  if (lines.length > 60) issues.push({ type: 'too_long', severity: 'alta', detail: `${lines.length} líneas, máximo 60` });
  else if (lines.length > 50) warnings.push({ type: 'long', detail: `${lines.length} líneas, ideal <50` });

  // Palabras clave de la oferta
  const keywords = _extractKeywords(job);
  const missing = keywords.filter(k => !cvText.toLowerCase().includes(k.toLowerCase()));
  if (missing.length > 3) {
    issues.push({ type: 'missing_keywords', severity: 'alta', detail: `${missing.length} keywords ausentes`, keywords: missing });
  } else if (missing.length > 0) {
    warnings.push({ type: 'few_missing_keywords', detail: `${missing.length} keywords ausentes`, keywords: missing });
  }

  // Secciones obligatorias
  const sections = { experiencia: /experiencia|trayectoria|historial/i, educacion: /educación|educacion|formación|formacion|estudio/i, skills: /habilidades|skills|competencias|tecnologías|tecnologias/i };
  const missingSections = [];
  for (const [name, regex] of Object.entries(sections)) {
    if (!regex.test(cvText)) missingSections.push(name);
  }
  if (missingSections.length > 0) {
    issues.push({ type: 'missing_sections', severity: 'alta', detail: `Faltan: ${missingSections.join(', ')}` });
  }

  // Tablas (ATS las lee mal)
  if (/\|.*\|.*\|/.test(cvText)) warnings.push({ type: 'tables_detected', detail: 'Posibles tablas, algunos ATS no las leen bien' });

  // Contacto
  if (!/\b[\w.-]+@[\w.-]+\.\w+\b/.test(cvText)) issues.push({ type: 'missing_email', severity: 'media', detail: 'No se detecta email' });

  const score = _calculateScore(issues, warnings);
  const passed = score >= 70;

  const result = { reviewer: 'ats', score, passed, issues, warnings };
  return result;
}

function _extractKeywords(job) {
  const words = new Set();
  if (job.requirements) job.requirements.forEach(r => r.split(/\s+/).forEach(w => { if (w.length > 3) words.add(w); }));
  if (job.title) job.title.split(/\s+/).forEach(w => { if (w.length > 3) words.add(w); });
  return [...words].slice(0, 15);
}

function _calculateScore(issues, warnings) {
  let score = 100;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 8 : 5;
  score -= warnings.length * 3;
  return Math.max(0, score);
}

module.exports = { review };
</file>

<file path="lib/jobs/reviewers/consistency.js">
/**
 * Consistency Reviewer — 100% determinístico
 *
 * Verifica coherencia interna del CV:
 *   - Fechas cronológicas
 *   - Skills repetidas
 *   - Cargos duplicados
 *   - Skills en experiencia vs skills declaradas
 *
 * Sin IA. Solo reglas.
 */

function review(cvText, job) {
  const issues = [];

  // Detectar contradicción seniority vs años
  const years = _extractYears(cvText);
  const seniority = _detectSeniorityClaim(cvText);
  if (seniority && years < 2 && /senior|lead|principal/i.test(seniority)) {
    issues.push({ type: 'seniority_mismatch', severity: 'media', detail: `Se declara ${seniority} con ~${years} años de experiencia` });
  }

  // Skills que aparecen en experiencia pero no en skills declaradas
  const declaredSkills = _extractDeclaredSkills(cvText);
  const skillsInExperience = _extractSkillsFromExperience(cvText);
  const undeclared = skillsInExperience.filter(s => !declaredSkills.some(d => d.includes(s) || s.includes(d)));
  if (undeclared.length > 3) {
    issues.push({ type: 'undeclared_skills', severity: 'leve', detail: `${undeclared.length} skills en experiencia no declaradas en skills`, skills: undeclared.slice(0, 5) });
  }

  // Cargos duplicados
  const titles = _extractTitles(cvText);
  const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (dupes.length > 0) {
    issues.push({ type: 'duplicate_titles', severity: 'leve', detail: `Cargos repetidos: ${[...new Set(dupes)].join(', ')}` });
  }

  const score = _calculateScore(issues);
  const passed = score >= 80;

  return { reviewer: 'consistency', score, passed, issues };
}

function _extractYears(text) {
  // Estimación simple por rango de fechas
  const dates = text.match(/\b(20\d{2})\b/g);
  if (!dates || dates.length < 2) return 0;
  const nums = dates.map(Number).sort();
  return Math.max(1, nums[nums.length - 1] - nums[0]);
}

function _detectSeniorityClaim(text) {
  const match = text.match(/\b(junior|semisenior|semi.senior|senior|lead|principal)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function _extractDeclaredSkills(text) {
  // Busca sección de skills
  const section = text.match(/(?:skills|habilidades|competencias|tecnologías)[\s\S]{1,500}/i);
  if (!section) return [];
  return section[0].split(/\n/).map(l => l.replace(/^[•\-*\d.\s]+/, '').trim()).filter(l => l.length > 1 && l.length < 40);
}

function _extractSkillsFromExperience(text) {
  const techs = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'git',
    'docker', 'aws', 'azure', 'playwright', 'selenium', 'cypress', 'api', 'mongodb',
    'postgresql', 'mysql', 'linux', 'kubernetes', 'ci/cd', 'jenkins', 'github actions'];
  return techs.filter(t => text.toLowerCase().includes(t));
}

function _extractTitles(text) {
  const lines = text.split('\n').filter(l => l.trim());
  // Busca líneas que parezcan cargos
  return lines.filter(l => /\b(engineer|analyst|developer|lead|manager|coordinator|assistant|specialist|tester|qa)\b/i.test(l))
    .map(l => l.trim().substring(0, 60));
}

function _calculateScore(issues) {
  let score = 100;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 10 : 5;
  return Math.max(0, score);
}

module.exports = { review };
</file>

<file path="lib/jobs/reviewers/recruiter.js">
/**
 * Recruiter Reviewer — LLM-only (semántico)
 *
 * Evalúa aspectos que solo un humano (o LLM) puede juzgar:
 *   - Narrativa y tono
 *   - Logros vs responsabilidades
 *   - Alineación con la oferta
 *   - Red flags
 *
 * Solo se ejecuta si los otros reviewers pasan.
 * Guarda tokens.
 */

function review(cvText, job) {
  // Placeholder: implementar llamada LLM aquí
  // Por ahora retorna neutral
  return {
    reviewer: 'recruiter',
    score: 75,
    passed: true,
    needsLLM: true,
    issues: [],
    note: 'Revisor LLM no implementado. Score neutral 75.',
  };
}

module.exports = { review };
</file>

<file path="lib/jobs/reviewers/technical.js">
/**
 * Technical Reviewer — Híbrido
 *
 * 90% determinístico: skills match, profundidad, relevancia.
 * 10% LLM (solo si confidence < 0.7): alineación técnica real.
 */

function review(cvText, job) {
  const issues = [];

  // Skills match ponderado por nivel
  const reqSkills = job.requirements || [];
  const matched = [];
  const missing = [];

  for (const req of reqSkills) {
    const rl = req.toLowerCase();
    const found = _findSkillDepth(cvText, rl);
    if (found.found) matched.push({ skill: req, depth: found.depth });
    else missing.push({ skill: req });
  }

  const coverage = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 100;

  // Seniority match
  const cvSeniority = _detectSeniority(cvText);
  const jobSeniority = _normalizeSeniority(job.experienceLevel);
  if (cvSeniority && jobSeniority) {
    const diff = cvSeniority.level - jobSeniority.level;
    if (diff < -1) issues.push({ type: 'underqualified', severity: 'alta', detail: `CV muestra ${cvSeniority.name}, oferta pide ${job.experienceLevel}` });
    else if (diff > 1) issues.push({ type: 'overqualified', severity: 'leve', detail: `CV muestra ${cvSeniority.name}, oferta pide ${job.experienceLevel}` });
  }

  // Tecnologías mencionadas sin profundidad
  const shallowTechs = matched.filter(m => m.depth === 'mencion');
  if (shallowTechs.length > 2) issues.push({ type: 'shallow_skills', severity: 'leve', detail: `${shallowTechs.length} skills solo mencionadas sin contexto` });

  const score = _calculateScore(coverage, issues);
  const needsLLM = score < 70 || issues.length > 2;

  return {
    reviewer: 'technical',
    score,
    passed: score >= 65,
    coverage,
    matched,
    missing,
    issues,
    needsLLM,
  };
}

function _findSkillDepth(text, skill) {
  const regex = new RegExp(`.{0,100}${skill}.{0,100}`, 'gi');
  const match = regex.exec(text);
  if (!match) return { found: false, depth: null };

  const ctx = match[0].toLowerCase();
  if (/\b(\d+\s*años?|experto|avanzado|profundo|extensive|senior)\b/.test(ctx)) return { found: true, depth: 'profundo' };
  if (/\b(intermedio|medio|trabajé|usé|utilicé|implementé|desarrollé|creé)\b/.test(ctx)) return { found: true, depth: 'aplicado' };
  return { found: true, depth: 'mencion' };
}

function _detectSeniority(text) {
  const levels = [
    { name: 'junior', regex: /\b(junior|jr|trainee|practicante)\b/i, level: 1 },
    { name: 'semisenior', regex: /\b(semisenior|semi.senior|mid.level|intermediate)\b/i, level: 2 },
    { name: 'senior', regex: /\b(senior|sr\.?|lead|principal)\b/i, level: 3 },
  ];
  for (const l of levels) if (l.regex.test(text)) return l;
  return null;
}

function _normalizeSeniority(level) {
  if (!level) return null;
  const map = { junior: 1, jr: 1, semisenior: 2, 'semi-senior': 2, senior: 3, lead: 3, principal: 3 };
  return { name: level, level: map[level.toLowerCase()] || 2 };
}

function _calculateScore(coverage, issues) {
  let score = coverage;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 10 : 5;
  return Math.max(0, Math.min(100, score));
}

module.exports = { review };
</file>

<file path="lib/jobs/types/ApplicationDecision.js">
/**
 * @typedef {Object} ApplicationDecision
 * @property {'apply'|'skip'|'maybe'} action
 * @property {number} score - Score total que justifica la decisión
 * @property {number} scoreThreshold - Umbral mínimo configurado
 * @property {string} reasoning - Por qué se tomó esta decisión
 * @property {Object} [application] - Datos de la aplicación generada
 * @property {string} [application.cvPath] - Ruta del CV generado
 * @property {string} [application.coverLetter] - Carta de presentación
 * @property {string} [application.appliedAt] - Fecha de aplicación
 * @property {string[]} [highlights] - Puntos destacados del CV
 */

/**
 * @typedef {'applied'|'viewed'|'rejected'|'interview'|'technical_test'|'offer'|'accepted'|'declined'|'ghosted'} ApplicationStatus
 * Máquina de estados de una aplicación laboral.
 */

module.exports = {};
</file>

<file path="lib/jobs/types/CandidateProfile.js">
/**
 * @typedef {Object} CandidateProfile
 * Perfil del candidato construido desde data/user/ y masterledger.
 * @property {string} name
 * @property {string[]} skills - Lista de skills técnicas
 * @property {string} [seniority] - Nivel de seniority
 * @property {string[]} [languages] - Idiomas con nivel
 * @property {Object[]} [experience] - Experiencia laboral
 * @property {string} experience.title
 * @property {string} experience.company
 * @property {string} [experience.startDate]
 * @property {string} [experience.endDate]
 * @property {string[]} [education] - Educación
 * @property {string[]} [certifications]
 * @property {Object} [preferences] - Preferencias laborales
 * @property {number} [preferences.salaryMin] - Salario mínimo aceptable
 * @property {string[]} [preferences.modalities] - Modalidades aceptadas
 * @property {string[]} [preferences.targetCompanies] - Empresas objetivo
 * @property {string[]} [preferences.targetRoles] - Roles objetivo
 * @property {string[]} [preferences.excludeCompanies] - Empresas a evitar
 * @property {string} [preferences.location] - Ubicación preferida
 */

module.exports = {};
</file>

<file path="lib/jobs/types/CompanyProfile.js">
/**
 * @typedef {Object} CompanyProfile
 * @property {string} name
 * @property {string} [industry]
 * @property {number} [size] - Número de empleados
 * @property {string} [location]
 * @property {string} [website]
 * @property {string} [description]
 * @property {number} [rating] - Reputación 0-5
 * @property {boolean} [isTarget] - Es empresa objetivo
 * @property {'alta'|'media'|'baja'} [priority] - Prioridad para aplicar
 */

module.exports = {};
</file>

<file path="lib/jobs/types/GapReport.js">
/**
 * @typedef {Object} GapReport
 * @property {string[]} missingSkills - Skills que pide la oferta y no están en el perfil
 * @property {string[]} matchedSkills - Skills que coinciden
 * @property {string[]} exceededSkills - Skills del perfil que no pide la oferta
 * @property {Object[]} experienceGaps - Brechas de experiencia
 * @property {'experience'|'education'|'certification'|'language'} experienceGaps.type
 * @property {string} experienceGaps.description
 * @property {'critico'|'moderado'|'leve'} experienceGaps.severity
 * @property {string} experienceGaps.mitigation - Cómo cubrirlo
 * @property {Object[]} strengthsToHighlight - Experiencias que más aportan
 * @property {'cover'|'highlight'} strengthsToHighlight.action
 * @property {string} strengthsToHighlight.reason
 * @property {number} coverage - Porcentaje de cobertura 0-100
 * @property {string} summary - Resumen ejecutivo del gap
 */

module.exports = {};
</file>

<file path="lib/jobs/types/InterviewPack.js">
/**
 * @typedef {Object} InterviewPack
 * @property {string} company
 * @property {string} role
 * @property {Object[]} probableQuestions - Preguntas probables
 * @property {string} probableQuestions.question
 * @property {string} probableQuestions.answer - Respuesta sugerida
 * @property {string} probableQuestions.category - tecnica|comportamental|cultural
 * @property {Object[]} strengths - Fortalezas a destacar
 * @property {string} strengths.point
 * @property {string} strengths.story - Historia STAR asociada
 * @property {Object[]} risks - Riesgos a preparar
 * @property {string} risks.issue
 * @property {string} risks.mitigation - Cómo abordarlo
 * @property {Object[]} [technicalPrep] - Preparación técnica
 * @property {string} technicalPrep.topic
 * @property {string} technicalPrep.resources
 * @property {string} summary - Resumen ejecutivo
 * @property {string[]} questionsToAsk - Preguntas para hacerle a la empresa
 */

module.exports = {};
</file>

<file path="lib/jobs/types/JobPosting.js">
/**
 * @typedef {Object} JobPosting
 * Propiedad: fuente de la oferta (computrabajo, linkedin, indeed, correo, etc)
 * @property {string} source
 * @property {string} sourceId - ID único en la fuente original
 * @property {string} title - Cargo
 * @property {string} company - Nombre de la empresa
 * @property {string} [location] - Ubicación
 * @property {'remoto'|'hibrido'|'presencial'} [modality]
 * @property {number} [salaryMin] - Salario mínimo ofrecido
 * @property {number} [salaryMax] - Salario máximo ofrecido
 * @property {string} [currency] - COP, USD
 * @property {string} description - Descripción completa de la oferta
 * @property {string[]} requirements - Lista de requisitos
 * @property {string[]} [niceToHave] - Requisitos deseables
 * @property {string[]} [responsibilities] - Responsabilidades
 * @property {string[]} [benefits] - Beneficios
 * @property {'indefinido'|'fijo'|'temporal'|'freelance'} [contractType]
 * @property {'full-time'|'part-time'|'por-temporada'} [employmentType]
 * @property {string} [industry] - Sector industrial
 * @property {string} [experienceLevel] - Nivel de experiencia requerido
 * @property {boolean} [requiresEnglish] - Requiere inglés
 * @property {string} [englishLevel] - Nivel de inglés requerido
 * @property {string} url - URL de la oferta original
 * @property {string} [companyUrl] - URL de la empresa
 * @property {string} [companyLogo] - URL del logo
 * @property {Date} postedAt - Fecha de publicación
 * @property {Date} fetchedAt - Fecha de obtención
 * @property {Object} [raw] - Datos crudos de la fuente original
 */

/**
 * @returns {JobPosting}
 */
function create(data) {
  return {
    source: data.source || 'unknown',
    sourceId: data.sourceId || '',
    title: data.title || '',
    company: data.company || '',
    location: data.location,
    modality: data.modality || 'presencial',
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    currency: data.currency || 'COP',
    description: data.description || '',
    requirements: data.requirements || [],
    niceToHave: data.niceToHave || [],
    responsibilities: data.responsibilities || [],
    benefits: data.benefits || [],
    contractType: data.contractType,
    employmentType: data.employmentType || 'full-time',
    industry: data.industry,
    experienceLevel: data.experienceLevel,
    requiresEnglish: data.requiresEnglish || false,
    englishLevel: data.englishLevel,
    url: data.url || '',
    companyUrl: data.companyUrl,
    companyLogo: data.companyLogo,
    postedAt: data.postedAt ? new Date(data.postedAt) : new Date(),
    fetchedAt: new Date(),
    raw: data.raw,
  };
}

module.exports = { create };
</file>

<file path="lib/jobs/types/ScoreBreakdown.js">
/**
 * @typedef {Object} ScoreBreakdown
 * Desglose completo del score de una oferta.
 * Los pesos son configurables desde data/config/jobs/scoring_weights.json
 * @property {number} total - Score total 0-100
 * @property {number} skills - Coincidencia de skills técnicas
 * @property {number} seniority - Nivel de experiencia
 * @property {number} salary - Ajuste salarial
 * @property {number} location - Ubicación y modalidad
 * @property {number} english - Inglés
 * @property {number} company - Empresa objetivo o industria
 * @property {number} growth - Potencial de crecimiento
 * @property {number} llmAlignment - Evaluación del LLM (0-30% del total)
 * @property {string[]} strengths - Fortalezas detectadas
 * @property {string[]} weaknesses - Debilidades detectadas
 * @property {string[]} redFlags - Señales de alerta
 * @property {string} reasoning - Explicación en lenguaje natural
 */

/**
 * @returns {ScoreBreakdown}
 */
function createEmpty(jobTitle) {
  return {
    total: 0,
    skills: 0,
    seniority: 0,
    salary: 0,
    location: 0,
    english: 0,
    company: 0,
    growth: 0,
    llmAlignment: 0,
    strengths: [],
    weaknesses: [],
    redFlags: [],
    reasoning: `Score calculado para ${jobTitle || 'la oferta'}`,
  };
}

module.exports = { createEmpty };
</file>

<file path="scripts/jobs/build_cv.js">
/**
 * scripts/jobs/build_cv.js
 *
 * Generador de PDF de Hoja de Vida en formato Harvard.
 * Usa Playwright para renderizar el template HTML y exportarlo como PDF.
 *
 * Uso: node scripts/jobs/build_cv.js
 */

const path = require('path');
const { chromium } = require('playwright');

const TEMPLATE_PATH = path.resolve(__dirname, '../../data/jobs/cv_harvard_template.html');
const OUTPUT_PATH   = path.resolve(__dirname, '../../data/jobs/CV_Jeiser_Gutierrez_QA_Automation.pdf');

async function buildCV() {
  console.log('[CV Builder] Iniciando generación de PDF...');
  
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  // Cargar el template HTML local
  await page.goto(`file://${TEMPLATE_PATH}`, { waitUntil: 'load' });

  // Dar tiempo al CSS para renderizar
  await page.waitForTimeout(500);

  // Exportar como PDF con márgenes 0 (el HTML ya maneja el padding)
  await page.pdf({
    path:              OUTPUT_PATH,
    format:            'Letter',
    printBackground:   true,
    margin:            { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
  });

  await browser.close();

  console.log(`[CV Builder] ✅ PDF generado exitosamente:`);
  console.log(`   → ${OUTPUT_PATH}`);
  console.log(`[CV Builder] Súbelo a Computrabajo como tu CV predeterminado.`);
}

buildCV().catch(err => {
  console.error('[CV Builder] ❌ Error:', err.message);
  process.exit(1);
});
</file>

<file path="scripts/jobs/buscar_medellin.js">
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');

const SEARCHES = [
  'auxiliar-sistemas',
  'soporte-tecnico-software',
  'mesa-de-ayuda',
  'helpdesk',
  'soporte-nivel-1',
  'qa-junior',
  'tester-manual',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();
  const results = [];

  for (const q of SEARCHES) {
    const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate&l=medellin`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1800);

      const offers = await page.evaluate(() => {
        const cards = document.querySelectorAll('article, [class*="offerItem"]');
        const out = [];
        cards.forEach(card => {
          const a = card.querySelector('h2 a, h3 a, a[title]');
          if (!a) return;
          const titulo  = (a.textContent || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
          const empresa = (card.querySelector('[class*="company"], p[title]')?.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 45);
          const lugar   = (card.querySelector('[class*="city"], [class*="location"]')?.textContent || '').replace(/\s+/g, ' ').trim();
          const fecha   = (card.querySelector('[class*="date"], time, [class*="pubDate"]')?.textContent || '').replace(/\s+/g, ' ').trim();
          if (titulo && a.href) out.push({ titulo, empresa, lugar, fecha, url: a.href });
        });
        return out;
      });

      console.log(`[${q}] ${offers.length} ofertas`);
      results.push(...offers);
    } catch (e) {
      console.log(`[${q}] Error: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(800);
  }

  await browser.close();

  // Deduplicar
  const seen = new Set();
  const unique = results.filter(o => {
    if (seen.has(o.url)) return false;
    seen.add(o.url);
    return true;
  });

  console.log('\n════════════════════════════════════════════════════');
  console.log(`  OFERTAS MEDELLÍN — Auxiliar Sistemas / Soporte TI`);
  console.log('════════════════════════════════════════════════════\n');

  unique.slice(0, 12).forEach((o, i) => {
    console.log(`${String(i+1).padStart(2)}. ${o.titulo}`);
    console.log(`    🏢 ${o.empresa || 'N/A'}  |  📍 ${o.lugar || 'N/A'}  |  📅 ${o.fecha || 'N/A'}`);
    console.log(`    🔗 ${o.url}\n`);
  });

  console.log(`Total encontradas: ${unique.length}`);
})().catch(e => console.error('Fatal:', e.message));
</file>

<file path="scripts/jobs/metrics/uhabits_engine.js">
/**
 * scripts/jobs/metrics/uhabits_engine.js
 * 
 * Motor para exportar métricas de LifeOS (Horas de código, CESDE, etc)
 * a un formato CSV compatible con la app Android Loop Habit Tracker (uhabits).
 */
const fs = require('node:fs');
const path = require('node:path');

const BACKUP_DIR = path.join(__dirname, '..', '..', '..', 'data', 'backups');
const CSV_PATH = path.join(BACKUP_DIR, 'uhabits_export.csv');

/**
 * Formato esperado por Loop Habits CSV:
 * Primera columna: Nombre del Hábito
 * Siguientes columnas: Fechas en formato YYYY-MM-DD
 * Valores: 0 (no hecho), 1 o 2 (hecho) o un valor numérico (para hábitos medibles).
 * 
 * Ejemplo de CSV (Loop Habits transpone la matriz, cada fila es un hábito, cada col es una fecha):
 * Habit Name,2026-07-06,2026-07-07,2026-07-08
 * Coding > 2h,1,0,1
 * Gym,0,1,1
 */

// Simulación de lectura de Ledger/Métricas de LifeOS
const simulatedLifeOSMetrics = {
  '2026-07-06': { coding: 1, gym: 0, cesde: 1 },
  '2026-07-07': { coding: 0, gym: 1, cesde: 1 },
  '2026-07-08': { coding: 1, gym: 1, cesde: 0 }
};

const HABIT_MAPPINGS = {
  coding: 'Programar > 2h',
  gym: 'Ejercicio / Gym',
  cesde: 'Asistencia CESDE'
};

async function exportToUhabitsCSV() {
  console.log('🔄 Generando CSV compatible con Loop Habit Tracker...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const dates = Object.keys(simulatedLifeOSMetrics).sort();
  let csvContent = 'Habit Name,' + dates.join(',') + '\n';

  const habitKeys = Object.keys(HABIT_MAPPINGS);

  for (const key of habitKeys) {
    const habitName = HABIT_MAPPINGS[key];
    const row = [habitName];
    for (const date of dates) {
      row.push(simulatedLifeOSMetrics[date][key] || 0);
    }
    csvContent += row.join(',') + '\n';
  }

  fs.writeFileSync(CSV_PATH, csvContent, 'utf8');
  console.log('✅ Archivo exportado exitosamente a:', CSV_PATH);
  console.log('📱 Ya puedes enviar este archivo a tu celular e importarlo en Loop Habit Tracker.');
}

if (require.main === module) {
  exportToUhabitsCSV().catch(e => console.error(e));
}

module.exports = {
  exportToUhabitsCSV
};
</file>

<file path="scripts/jobs/pico_placa_scraper.js">
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'pico_placa.json');

// Pico y placa del primer semestre 2026 (vigente hasta Julio 31)
const DEFAULT_ROTATION = {
  Lunes: ["1", "7"],
  Martes: ["0", "3"],
  Miercoles: ["4", "6"],
  Jueves: ["5", "9"],
  Viernes: ["2", "8"]
};

async function checkPicoYPlaca() {
  console.log('🚗 Iniciando monitor de Pico y Placa (Playwright)...');
  
  // Cargar estado anterior
  let currentRotation = DEFAULT_ROTATION;
  if (fs.existsSync(STATE_FILE)) {
    currentRotation = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } else {
    // Si no existe, lo creamos con el estado base
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentRotation, null, 2));
  }

  // Scraping de un sitio confiable (Ej: portal de movilidad o sitio agregador)
  // Para ser resilientes, comprobaremos Autolab o el portal de Medellín
  // Como los scrapers de entidades públicas cambian mucho, aquí hacemos
  // un check de seguridad.
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Vamos a buscar en un agregador de pico y placa muy estable:
    await page.goto('https://www.pyphoy.com/medellin', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Extraer el texto de la página para buscar la rotación
    const text = await page.evaluate(() => document.body.innerText);
    
    // NOTA: Para un scraping robusto en producción requeriríamos selectores exactos
    // Pero como solo queremos saber si hubo un "cambio de semestre", 
    // verificamos si la placa "6" sigue siendo el miércoles.
    
    // Por seguridad, usaremos la rotación guardada en STATE_FILE
    // El orquestador (Morning Briefing) la leerá. Si es Agosto y la rotación no se ha
    // actualizado, alertará al usuario.
    console.log('✅ Conexión exitosa. Monitoreo pasivo activo.');

  } catch (e) {
    console.error('❌ Error scrapeando pico y placa:', e.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  checkPicoYPlaca().catch(console.error);
}

module.exports = { checkPicoYPlaca };
</file>

<file path="lib/jobs/scorer.js">
/**
 * Scorer — MVP
 *
 * Evalúa una oferta contra el perfil del candidato.
 * 70% reglas determinísticas, 30% LLM (placeholder).
 *
 * Cada ejecución genera métricas. Sin métricas no hay mejora.
 */

const { readJSON } = require('../data/reader');
const { PATHS } = require('../data/paths');
const { createEmpty } = require('./types/ScoreBreakdown');
let bus;
try { bus = require('../events/event_bus'); } catch { bus = null; }

/**
 * @param {Object} job        - JobPosting normalizado
 * @param {Object} profile    - CandidateProfile
 * @param {Object} [options]
 * @param {boolean} [options.useLLM=false] - Si true, incluye evaluación LLM
 * @param {string}  [options.model]        - Modelo LLM a usar
 * @returns {Object} { score: ScoreBreakdown, decision: string, ev: Object, metrics: Object }
 */
function score(job, profile, options = {}) {
  const start = Date.now();
  const weights = _loadWeights();

  const breakdown = createEmpty(job.title);

  // ── 70% Reglas determinísticas ──
  breakdown.skills = _scoreSkills(job.requirements, profile.skills, weights.weights.skills);
  breakdown.seniority = _scoreSeniority(job.experienceLevel, profile.seniority, weights.weights.seniority);
  breakdown.salary = _scoreSalary(job.salaryMin, job.salaryMax, profile.preferences, weights.weights.salary);
  breakdown.location = _scoreLocation(job.location, job.modality, profile.preferences, weights.weights.location);
  breakdown.english = _scoreEnglish(job.requiresEnglish, profile.languages, weights.weights.english);
  breakdown.company = _scoreCompany(job.company, profile.preferences, weights.weights.company);
  breakdown.growth = _scoreGrowth(job, weights.weights.growth);

  // ── 30% LLM (placeholder) ──
  if (options.useLLM) {
    breakdown.llmAlignment = _scoreLLM(job, profile, weights.weights.llmAlignment);
  }

  // ── Total ──
  const deterministicTotal = breakdown.skills + breakdown.seniority + breakdown.salary
    + breakdown.location + breakdown.english + breakdown.company + breakdown.growth;
  breakdown.total = deterministicTotal + breakdown.llmAlignment;

  // ── Decisión ──
  const decision = _decide(breakdown.total, weights.thresholds);

  // ── Expected Value ──
  const ev = _calculateEV(breakdown.total, job, weights);

  // ── Métricas ──
  const elapsed = Date.now() - start;
  const metrics = {
    executionTimeMs: elapsed,
    modelUsed: options.useLLM ? (options.model || 'llm') : 'deterministico',
    tokensConsumed: options.useLLM ? 0 : 0, // TODO: contar tokens reales
  };

  // Emitir evento para el event bus (metrics, feedback, dashboard)
  if (bus) {
    try {
      bus.emit('job.scored', {
        jobId: job.sourceId || job.url,
        company: job.company,
        title: job.title,
        totalScore: breakdown.total,
        breakdown: { ...breakdown },
        decision: decision.action,
        ev,
        executionTimeMs: elapsed,
        modelUsed: metrics.modelUsed,
        tokensConsumed: metrics.tokensConsumed,
      }, { source: 'scorer', priority: 'low' });
    } catch (_) { /* event bus no crítico */ }
  }

  return { score: breakdown, decision, ev, metrics };
}

// ── Skills ──
function _scoreSkills(requirements, skills, maxWeight) {
  if (!requirements || !requirements.length || !skills || !skills.length) return 0;
  const req = requirements.map(r => r.toLowerCase());
  const has = skills.map(s => s.toLowerCase());
  const match = req.filter(r => has.some(h => h.includes(r) || r.includes(h))).length;
  const ratio = match / req.length;
  return Math.round(ratio * maxWeight);
}

// ── Seniority ──
function _scoreSeniority(required, current, maxWeight) {
  if (!required || !current) return Math.round(maxWeight * 0.5);
  const levels = { junior: 1, semisenior: 2, senior: 3, lead: 4 };
  const reqLevel = levels[required.toLowerCase()] || 2;
  const curLevel = levels[current.toLowerCase()] || 2;
  const diff = curLevel - reqLevel;
  if (diff >= 0) return maxWeight;
  if (diff === -1) return Math.round(maxWeight * 0.6);
  return Math.round(maxWeight * 0.3);
}

// ── Salario ──
function _scoreSalary(min, max, preferences, maxWeight) {
  if (!min && !max) return Math.round(maxWeight * 0.5);
  if (!preferences || !preferences.salaryMin) return Math.round(maxWeight * 0.7);
  const offered = max || min || 0;
  const expected = preferences.salaryMin;
  const ratio = offered / expected;
  if (ratio >= 1.2) return maxWeight;
  if (ratio >= 1) return Math.round(maxWeight * 0.9);
  if (ratio >= 0.8) return Math.round(maxWeight * 0.6);
  return Math.round(maxWeight * 0.3);
}

// ── Ubicación ──
function _scoreLocation(location, modality, preferences, maxWeight) {
  if (modality === 'remoto') return maxWeight;
  if (!preferences || !preferences.location) return Math.round(maxWeight * 0.5);
  if (!location) return Math.round(maxWeight * 0.5);
  const pref = preferences.location.toLowerCase();
  const loc = location.toLowerCase();
  if (loc.includes(pref) || pref.includes(loc)) return maxWeight;
  return Math.round(maxWeight * 0.3);
}

// ── Inglés ──
function _scoreEnglish(requires, languages, maxWeight) {
  if (!requires) return maxWeight;
  if (!languages || !languages.length) return 0;
  const hasEnglish = languages.some(l => l.toLowerCase().includes('inglés') || l.toLowerCase().includes('english'));
  return hasEnglish ? maxWeight : Math.round(maxWeight * 0.2);
}

// ── Empresa ──
function _scoreCompany(company, preferences, maxWeight) {
  if (!preferences || !preferences.targetCompanies || !preferences.targetCompanies.length) {
    return Math.round(maxWeight * 0.6);
  }
  const match = preferences.targetCompanies.some(t => company.toLowerCase().includes(t.toLowerCase()));
  if (match) return maxWeight + 10; // bonus empresa objetivo
  if (preferences.excludeCompanies && preferences.excludeCompanies.some(e => company.toLowerCase().includes(e.toLowerCase()))) {
    return 0;
  }
  return Math.round(maxWeight * 0.5);
}

// ── Crecimiento ──
function _scoreGrowth(job, maxWeight) {
  if (!job) return 0;
  let score = 0;
  const signals = [
    job.benefits && job.benefits.some(b => /certificaci|capacitac|entrenam|formación/i.test(b)),
    job.contractType === 'indefinido',
    job.industry,
    job.companyUrl,
  ];
  score = signals.filter(Boolean).length;
  return Math.round((score / signals.length) * maxWeight);
}

// ── LLM (placeholder) ──
function _scoreLLM(job, profile, maxWeight) {
  // TODO: implementar llamada LLM real
  // Por ahora retorna peso neutral
  return Math.round(maxWeight * 0.5);
}

// ── Decisión ──
function _decide(total, thresholds) {
  if (total >= thresholds.apply) {
    return { action: 'apply', reason: `Score ${total} >= umbral ${thresholds.apply}` };
  }
  if (total >= thresholds.maybe) {
    return { action: 'maybe', reason: `Score ${total} entre ${thresholds.maybe} y ${thresholds.apply}` };
  }
  return { action: 'skip', reason: `Score ${total} < umbral ${thresholds.maybe}` };
}

// ── Expected Value ──
function _calculateEV(score, job, weights) {
  // Probabilidad estimada de entrevista basada en score histórico
  // Fase inicial: fórmula heurística. Fase B: datos reales.
  const interviewProb = _estimateInterviewProb(score);
  const prepTime = _estimatePrepTime(job);
  const ev = (interviewProb * 100) / Math.max(prepTime, 1);

  return {
    interviewProbability: Math.round(interviewProb * 100),
    estimatedPrepTimeMin: prepTime,
    expectedValue: Math.round(ev * 100) / 100,
    label: ev > 2 ? 'alta' : ev > 0.5 ? 'media' : 'baja',
  };
}

function _estimateInterviewProb(score) {
  if (score >= 85) return 0.7;
  if (score >= 75) return 0.5;
  if (score >= 60) return 0.3;
  return 0.1;
}

function _estimatePrepTime(job) {
  let time = 10;
  if (job.requirements && job.requirements.length > 5) time += 10;
  if (job.coverLetter) time += 15;
  if (job.source === 'computrabajo') time = Math.min(time, 5); // aplicaciones rápidas
  return time;
}

function _loadWeights() {
  try {
    return readJSON(PATHS.SCORING_WEIGHTS);
  } catch {
    return {
      weights: { skills: 25, seniority: 15, salary: 15, location: 10, english: 10, company: 10, growth: 5, llmAlignment: 10 },
      thresholds: { apply: 75, maybe: 50 },
    };
  }
}

module.exports = { score };
</file>

<file path="scripts/jobs/login_ct.js">
/**
 * scripts/jobs/login_ct.js
 *
 * Login a Computrabajo y guarda el storage state (cookies + localStorage)
 * para reutilizar sesión en scraper y apply sin tener que loguear cada vez.
 *
 * Uso: node scripts/jobs/login_ct.js
 * Genera: data/state/computrabajo_state.json
 *
 * El estado se renueva solo cuando expira (detecta 401/redirect a login).
 */

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const STATE_PATH = path.resolve(__dirname, '..', '..', 'data', 'state', 'computrabajo_state.json');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL;
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

async function login() {
  if (!CT_EMAIL || !CT_PASS) {
    throw new Error('Faltan COMPUTRABAJO_EMAIL o COMPUTRABAJO_PASS en .env');
  }

  console.log('[login_ct] Iniciando sesión en Computrabajo...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await context.newPage();

  try {
    // Ir a login
    await page.goto('https://co.computrabajo.com/Login/IniciarSesion.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Esperar a que cargue la página inicial
    await page.waitForTimeout(2000);

    // Ejecutar login centralizado
    await robustLogin(page, CT_EMAIL, CT_PASS);

    // Verificar si el login fue exitoso
    const currentUrl = page.url();
    if (currentUrl.includes('Login') || currentUrl.includes('IniciarSesion')) {
      console.log('[login_ct] ⚠️ Parece que el login falló. URL actual:', currentUrl);
      // Tomar screenshot para debug
      await page.screenshot({ path: path.join(__dirname, '..', '..', 'data', 'cache', 'login_failed.png') });
      console.log('[login_ct] Screenshot guardado en data/cache/login_failed.png');
      throw new Error('Login failed');
    }

    // Guardar storage state
    const state = await context.storageState();
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log(`[login_ct] ✅ Sesión guardada en ${STATE_PATH}`);

    // Verificar que funciona
    await page.goto('https://co.computrabajo.com/mis-postulaciones', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('[login_ct] ✅ Postulaciones accesibles, sesión activa');

  } catch (e) {
    console.error('[login_ct] ❌ Error:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

login();
</file>

<file path="scripts/jobs/analyze_and_apply.js">
/**
 * analyze_and_apply.js
 * Analiza ofertas existentes de Computrabajo y aplica a las que pasan el score.
 * Procesa lote por lote con delays para evitar detección de bot.
 *
 * Uso: node scripts/jobs/analyze_and_apply.js [--batch=5] [--delay=30]
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const BASE_DIR = path.resolve(__dirname, '..', '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const CT_FILE = path.join(JOBS_DIR, 'computrabajo.json');
const APPLY_LOG = path.join(JOBS_DIR, 'aplicaciones.json');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS = process.env.COMPUTRABAJO_PASS;
const BATCH = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '5');
const DELAY_SEC = parseInt(process.argv.find(a => a.startsWith('--delay='))?.split('=')[1] || '45');
const MIN_SCORE = 55;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch {}
}

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// Login wrapper con retry (de computrabajo_apply.js)
let _loginFailCount = 0;
const MAX_LOGIN_FAILS = 3;

async function loginWithRetry(page, email, pass) {
  for (let attempt = 1; attempt <= MAX_LOGIN_FAILS; attempt++) {
    const ok = await robustLogin(page, email, pass);
    if (ok) { _loginFailCount = 0; return true; }
    _loginFailCount++;
    log(`⚠️ Intento ${attempt}/${MAX_LOGIN_FAILS} de login fallido`);
    if (attempt < MAX_LOGIN_FAILS) await new Promise(r => setTimeout(r, 3000));
  }
  log('❌ 3 intentos de login fallidos. Notificando...');
  try { await sendTelegram('⚠️ Computrabajo: Login fallido tras 3 intentos.'); } catch {}
  throw new Error('Login failed after 3 attempts');
}

async function main() {
  log(`🚀 Analyze & Apply | batch=${BATCH} | delay=${DELAY_SEC}s | min-score=${MIN_SCORE}`);

  // Cargar ofertas existentes
  const ct = loadJSON(CT_FILE);
  const ofertas = Array.isArray(ct) ? ct : (ct.ofertas || ct.data || []);
  log(`📦 ${ofertas.length} ofertas en computrabajo.json`);

  // Cargar aplicaciones previas para no duplicar
  const aplicaciones = loadJSON(APPLY_LOG);
  const aplicadasUrls = new Set(aplicaciones.map(a => a.url).filter(Boolean));

  // Filtrar roles tech/soporte NO analizadas aún
  const pendientes = ofertas.filter(o => {
    if (aplicadasUrls.has(o.url)) return false;
    const t = (o.titulo || '').toLowerCase();
    return t.includes('qa') || t.includes('tester') || t.includes('software') ||
           t.includes('soporte') || t.includes('helpdesk') || t.includes('mesa de ayuda') ||
           t.includes('desarroll') || t.includes('analista') || t.includes('automat') ||
           t.includes('sistemas') || t.includes('it ') || t.includes('tecnolog');
  });

  log(`🎯 ${pendientes.length} ofertas tech/soporte sin analizar`);

  if (pendientes.length === 0) {
    log('✅ No hay ofertas pendientes por analizar');
    return;
  }

  const batch = pendientes.slice(0, BATCH);
  log(`📋 Procesando lote de ${batch.length} ofertas\n`);

  let aprobadas = 0;
  let aplicadas = 0;

  for (let i = 0; i < batch.length; i++) {
    const o = batch[i];
    log(`[${i+1}/${batch.length}] ${o.titulo} — ${o.empresa || '?'}`);

    // 1. Scrape descripción
    let desc = o.descripcion || '';
    if (!desc && o.url) {
      try {
        const browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
        });
        const page = await browser.newPage();
        // Anti-detección
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });
        await page.goto(o.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        desc = (await page.evaluate(() => {
          const d = document.querySelector('[class*="description"], [class*="descripcion"], article, .job-description, .offer-description');
          return d ? d.innerText.substring(0, 2000) : '';
        }).catch(() => '')) || '';
        await browser.close();
      } catch {}
    }

    // 2. Analizar con LLM
    const prompt = `Eres un experto en reclutamiento tech en Colombia. Analiza la compatibilidad.

CANDIDATO - Jeiser Gutierrez:
- QA Automation Junior (CESDE bootcamp 2026, 28 semanas)
- Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL básico, APIs, CI/CD, scrapers, automatización, LLMs
- Experiencia Práctica: LifeOS (asistente personal autónomo con 11 workflows CI/CD, scraping web, integración multi-LLM, SQLite, notificaciones Telegram, Google Calendar API)
- Busca: QA, automatización, soporte técnico, helpdesk, mesa de ayuda — cualquier rol tech entry-level
- Disponible: tiempo completo, Medellín + remoto

IMPORTANTE: Ignora requisitos rígidos de experiencia formal. El proyecto LifeOS demuestra habilidades prácticas reales. Si el rol es entry-level y hay MATCH en skills técnicas (soporte TI, helpdesk, QA), asigna score >= 55.

REGLAS ESTRICTAS: NO asignar score > 30 a roles de: Analista de Oxígeno, SST, Químico, Fisicoquímico, Calidad industrial (alimentos/laboratorio/procesos), Auxiliar de Calidad industrial, Practicante de Calidad industrial. Estos NO son roles tech. Solo si la descripción menciona herramientas de software explícitamente.

OFERTA: ${o.titulo} | ${o.empresa || '?'} | ${o.lugar || '?'}
DESCRIPCIÓN: ${desc.substring(0, 1500)}

Responde SOLO JSON:
{ "score": <0-100>, "nivel_requerido": "junior|mid|senior", "recomendar": true/false, "razon_corta": "...", "skills_match": [], "skills_gap": [] }`;

    try {
      const res = await askLLM(prompt, [], 0.1);
      const raw = (res.content || '').replace(/```json|```/g, '').trim();
      const analisis = JSON.parse(raw);
      const { score, recomendar, razon_corta } = analisis;

      log(`   Score: ${score}/100 | ${recomendar ? '✅' : '⏭'} | ${razon_corta || ''}`);

      // Guardar resultado
      aplicaciones.push({
        fecha: new Date().toISOString(),
        titulo: o.titulo,
        empresa: o.empresa,
        url: o.url,
        lugar: o.lugar,
        score,
        recomendar,
        razon_corta,
        estado: 'analizada',
      });

      if (score >= MIN_SCORE && recomendar) {
        aprobadas++;
        log(`   🎯 PASA UMBRAL! (${aprobadas}/${batch.length})`);

        // 3. Aplicar con Playwright
        try {
          const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
          });
          const ctx = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          });
          const page = await ctx.newPage();
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
          });

          // Login
          log(`   🔑 Iniciando sesión...`);
          await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 15000 });
          await loginWithRetry(page, CT_EMAIL, CT_PASS);

          // Ir a la oferta
          await page.goto(o.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

          // Click botón postular
          const btnSelectors = [
            'a:has-text("Aplicar")', 'button:has-text("Aplicar")',
            'button:has-text("Postularme")', 'button:has-text("Postular")',
            'a:has-text("Postularme")', 'a:has-text("Postular")',
            '.js-apply-btn', '[data-qa="applyButton"]', '.b_primary.tiny',
          ];
          let clicked = false;
          for (const sel of btnSelectors) {
            try { await page.click(sel, { timeout: 3000 }); clicked = true; break; } catch {}
          }

          if (clicked) {
            log(`   ✅ Postulado!`);
            aplicaciones[aplicaciones.length - 1].estado = 'aplicada';
            aplicadas++;
            try { await sendTelegram(`✅ Aplicado: ${o.titulo} — ${o.empresa || '?'}`); } catch {}
          } else {
            log(`   ⚠️ No se encontró botón de postular`);
            aplicaciones[aplicaciones.length - 1].estado = 'sin_boton';
          }

          await browser.close();
        } catch (e) {
          log(`   ❌ Error aplicando: ${e.message.substring(0, 80)}`);
          aplicaciones[aplicaciones.length - 1].estado = 'error_aplicar';
        }

        // Delay ENTRE aplicaciones (evitar bot detection)
        log(`   ⏸ Esperando ${DELAY_SEC}s antes de la siguiente...`);
        await new Promise(r => setTimeout(r, DELAY_SEC * 1000));
      }
    } catch (e) {
      log(`   ❌ Error analizando: ${e.message.substring(0, 80)}`);
    }

    // Delay entre análisis
    if (i < batch.length - 1) await new Promise(r => setTimeout(r, 3000));
  }

  // Guardar resultados
  saveJSON(APPLY_LOG, aplicaciones);

  log(`\n✅ Lote completado`);
  log(`   Aprobadas: ${aprobadas}`);
  log(`   Aplicadas: ${aplicadas}`);
}

main().catch(e => {
  log(`❌ FATAL: ${e.message}`);
  process.exit(1);
});
</file>

<file path="scripts/jobs/check_aplicaciones.js">
/**
 * check_aplicaciones.js — Verifica historial de aplicaciones en CT
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');
const { robustLogin } = require('./ct_login_helper');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  // Login
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await robustLogin(page, CT_EMAIL, CT_PASS);
  await page.waitForTimeout(2000);
  console.log('Login:', page.url());

  // Ir al historial de aplicaciones
  await page.goto('https://candidato.co.computrabajo.com/candidate/applications', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(__dirname, '..', 'diag_aplicaciones.png') });
  console.log('URL:', page.url());

  const texto = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return clean(document.body.innerText).substring(0, 3000);
  });

  console.log('\n══ HISTORIAL DE APLICACIONES ══');
  console.log(texto.substring(0, 2000));

  await browser.close();
})().catch(e => console.error('Error:', e.message));
</file>

<file path="scripts/jobs/computrabajo_scraper.js">
/**
 * scripts/jobs/computrabajo_scraper.js
 *
 * Pipeline 3 Etapas:
 *   1. RASTREO   → Palabras clave genéricas, newest-first, Medellín, dedup por offer_id.
 *   2. AUDITORÍA → Para cada oferta nueva: visitar página completa → IA evalúa descripción.
 *   3. COLA      → Ofertas aprobadas van a la cola de postulación + notificación Telegram.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../../lib/ai/llm_service');

const BASE_DIR = path.resolve(__dirname, '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const OUT_PATH = path.join(JOBS_DIR, 'computrabajo.json');       // todas las encontradas
const QUEUE_PATH = path.join(JOBS_DIR, 'apply_queue.json');      // aprobadas por IA → listas para aplicar

const DB_DRIVER  = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

// ─── PALABRAS CLAVE GENÉRICAS (Tech Medellín) ──────────────────────────────
// El motor de búsqueda de Computrabajo amplía los resultados al usar términos
// genéricos. La IA filtra la basura en la Etapa 2.
const KEYWORDS = [
  'soporte-tecnico',
  'mesa-de-ayuda',
  'help-desk',
  'auxiliar-de-sistemas',
  'auxiliar-ti',
  'tecnico-de-soporte',
  'qa',
  'tester',
  'qa-automation',
  'analista-de-sistemas',
  'junior-ti',
];

// ─── PERFIL MAESTRO (mismo que en apply.js) ───────────────────────────────
const PERFIL_JEISER = `
NOMBRE: Jeiser Abraham Gutierrez Torres
UBICACION: Medellin, Antioquia
VEHICULO: Tiene vehiculo propio (carro), sin restricciones de movilidad.
DISPONIBILIDAD: Lunes a Viernes (estudia los sabados en CESDE, NO puede trabajar sabados ni domingos).
ASPIRACION SALARIAL: SMLV o promedio del mercado, negociable.
FORMACION: Tecnico Analisis y Desarrollo de Software (CESDE, en curso). Bootcamp QA Automation 28 semanas (Playwright, GitHub Actions). SENA: Bases de Datos y Excel.
EXPERIENCIA:
  - QA Automation Engineer: Proyecto LifeOS propio en produccion (Playwright, Node.js, GitHub Actions, SQLite, APIs REST, CI/CD).
  - Mesa de Ayuda Nivel 1: Sitel/Iberia/Amadeus GDS (2021). Tickets, SLA, soporte remoto.
  - Auxiliar Sistemas/CCTV: Coovisocial (2019-2021). Monitoreo, diagnostico de fallas, informes.
SKILLS: Playwright, Node.js, JavaScript, GitHub Actions, SQLite, Git, Excel Avanzado, Windows 10/11, TCP/IP basico, GDS Amadeus.
IDIOMAS: Espanol nativo, Ingles B1-B2.
`;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

// ─── TELEGRAM ──────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch (e) { log('Telegram error: ' + e.message); }
}

// ─── PERSISTENCIA DE IDs VISTOS (dedup) ───────────────────────────────────
function loadSeenIds() {
  if (USE_SQLITE) {
    const cp = CheckpointStore.get('computrabajo_seen_ids');
    return new Set(cp?.ids || []);
  }
  try {
    const data = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo_last.json'), 'utf8'));
    return new Set(data.ids || []);
  } catch { return new Set(); }
}

function saveSeenIds(idSet) {
  const ids = [...idSet];
  if (USE_SQLITE) {
    CheckpointStore.set('computrabajo_seen_ids', { ids });
  } else {
    fs.writeFileSync(path.join(JOBS_DIR, 'computrabajo_last.json'), JSON.stringify({ ids }));
  }
}

// ─── ETAPA 1: SCRAPE LISTING (título, empresa, URL, ID) ───────────────────
async function scrapeListado(page, keyword) {
  // sorted by publicationDate = newest first | en-medellin = solo Medellín
  const url = `https://co.computrabajo.com/trabajo-de-${keyword}-en-medellin?by=publicationDate`;
  log(`  [RASTREO] ${keyword} → ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
  } catch (e) {
    log(`  [ERROR] goto falló: ${e.message.substring(0, 60)}`);
    return [];
  }

  const offers = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('article, .offerList article, [class*="offerItem"]');

    Array.from(cards).slice(0, 20).forEach(card => {
      const titleEl = card.querySelector('h2 a, h3 a, a[title], .js-o-link');
      const compEl  = card.querySelector('p[title], .company, [class*="company"]');
      const locEl   = card.querySelector('span[class*="city"], .location');
      const dateEl  = card.querySelector('p.fc_base, [class*="date"], span[class*="publi"]');
      if (!titleEl) return;
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();
      const href  = titleEl.href || '';
      // Extraer offer_id del slug de la URL (hash único de Computrabajo)
      const idMatch = href.match(/([A-F0-9]{32})/i);
      const offerId = idMatch ? idMatch[1].toUpperCase() : href.split('/').pop();
      results.push({
        offer_id: offerId,
        titulo:   clean(titleEl.textContent || titleEl.getAttribute('title')),
        empresa:  clean(compEl?.getAttribute('title') || compEl?.textContent),
        lugar:    clean(locEl?.textContent),
        fecha:    clean(dateEl?.textContent),
        url:      href,
      });
    });

    // Fallback: links directos si no hay article cards
    if (results.length === 0) {
      document.querySelectorAll('a[href*="oferta-"]').forEach((a, i) => {
        if (i >= 20) return;
        const text = a.textContent.trim();
        if (text.length < 5) return;
        const idMatch = a.href.match(/([A-F0-9]{32})/i);
        results.push({
          offer_id: idMatch ? idMatch[1].toUpperCase() : a.href.split('/').pop(),
          titulo: text, empresa: '', lugar: '', fecha: '', url: a.href,
        });
      });
    }
    return results;
  });

  log(`  [RASTREO] ${offers.length} ofertas en listing`);
  return offers;
}

// ─── ETAPA 2: AUDITORÍA IA (visitar página completa + DeepSeek) ────────────
async function auditarOferta(page, oferta) {
  log(`  [AUDITORÍA] ${oferta.titulo} | ${oferta.empresa}`);
  let descripcion = oferta.titulo;

  try {
    await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    descripcion = await page.evaluate(() => {
      // Intentar extraer solo el bloque de descripción
      const descEl = document.querySelector(
        '[class*="description"], [class*="jobDescription"], [class*="offerBody"], #offerBody, .js-description'
      );
      return (descEl?.innerText || document.body.innerText || '').substring(0, 2000);
    });
  } catch (e) {
    log(`  [AUDITORÍA] No se pudo visitar la oferta: ${e.message.substring(0, 60)}`);
  }

  const prompt = `Eres un evaluador de ofertas laborales para Colombia. Analiza si esta oferta encaja con el candidato.
Responde EXCLUSIVAMENTE con un JSON válido, sin texto extra.

OFERTA:
Titulo: ${oferta.titulo}
Empresa: ${oferta.empresa}
Descripcion: ${descripcion.substring(0, 1500)}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

CRITERIOS DE EVALUACIÓN:
1. score (0-100): qué tan bien encaja el candidato con la oferta.
2. recomendar (true/false): ¿Vale la pena aplicar? (score >= 55).
3. requiere_finde (true/false): ¿La oferta menciona sabados, domingos, fines de semana, rotativos, o turnos? Si NO se menciona horario, asume false.
4. categoria: "QA" | "Mesa de Ayuda" | "Auxiliar Sistemas" | "Otro"
5. razon: una frase corta explicando la decisión.

JSON:
{"score":N,"recomendar":true,"requiere_finde":false,"categoria":"Mesa de Ayuda","razon":"..."}`;

  try {
    const res  = await askLLM(prompt, [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(json);
    return { ...parsed, descripcion: descripcion.substring(0, 500) };
  } catch (e) {
    log(`  [AUDITORÍA] Error IA: ${e.message}`);
    return { score: 50, recomendar: true, requiere_finde: false, categoria: 'Otro', razon: 'Score estimado', descripcion };
  }
}

// ─── QUEUE: guardar ofertas aprobadas ─────────────────────────────────────
function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8')); }
  catch { return []; }
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  log('═══ COMPUTRABAJO PIPELINE (Rastreo → Auditoría IA → Cola) ═══');

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();

  const seenIds = loadSeenIds();
  log(`IDs ya vistos en base de datos: ${seenIds.size}`);

  // ── ETAPA 1: Rastrear todas las keywords ──
  const todasLasOfertas = [];
  for (const kw of KEYWORDS) {
    try {
      const offers = await scrapeListado(page, kw);
      todasLasOfertas.push(...offers);
      await page.waitForTimeout(1200); // pausa anti-detección entre búsquedas
    } catch (e) {
      log(`  [ERROR] keyword "${kw}": ${e.message.substring(0, 60)}`);
    }
  }

  // Dedup por offer_id (puede haber solapamiento entre keywords)
  const seenInRun = new Set();
  const candidatas = todasLasOfertas.filter(o => {
    if (!o.offer_id || seenInRun.has(o.offer_id)) return false;
    seenInRun.add(o.offer_id);
    if (seenIds.has(o.offer_id)) return false; // ya auditada antes
    return true;
  });

  log(`\n[RASTREO] Total: ${todasLasOfertas.length} | Únicas: ${seenInRun.size} | Nuevas a auditar: ${candidatas.length}`);

  // ── ETAPA 2: Auditoría IA de ofertas nuevas ──
  const aprobadas = [];
  const rechazadas = [];

  for (const oferta of candidatas) {
    const auditoria = await auditarOferta(page, oferta);
    seenIds.add(oferta.offer_id); // marcar como vista pase lo que pase

    if (auditoria.requiere_finde) {
      log(`  ⛔ RECHAZADA (fin de semana): "${oferta.titulo}"`);
      rechazadas.push({ ...oferta, auditoria });
      continue;
    }

    if (!auditoria.recomendar || auditoria.score < 50) {
      log(`  ⚫ DESCARTADA (score ${auditoria.score}): "${oferta.titulo}" — ${auditoria.razon}`);
      rechazadas.push({ ...oferta, auditoria });
      continue;
    }

    log(`  ✅ APROBADA (score ${auditoria.score} | ${auditoria.categoria}): "${oferta.titulo}"`);
    aprobadas.push({ ...oferta, auditoria, scraped_at: new Date().toISOString() });
    await page.waitForTimeout(800); // pausa entre visitas a páginas de oferta
  }

  await browser.close();

  // Persistir IDs vistos
  saveSeenIds(seenIds);

  // Guardar todas las encontradas
  fs.writeFileSync(OUT_PATH, JSON.stringify({
    fecha: new Date().toISOString(),
    total_scrapeadas: candidatas.length,
    aprobadas: aprobadas.length,
    rechazadas: rechazadas.length,
    ofertas: [...aprobadas, ...rechazadas],
  }, null, 2));

  // Agregar aprobadas a la cola de postulación
  const queue = loadQueue();
  const queueIds = new Set(queue.map(o => o.offer_id));
  const nuevasEnCola = aprobadas.filter(o => !queueIds.has(o.offer_id));
  saveQueue([...queue, ...nuevasEnCola]);

  log(`\n═══ RESUMEN ═══`);
  log(`  Auditadas por IA : ${candidatas.length}`);
  log(`  Aprobadas        : ${aprobadas.length}`);
  log(`  Rechazadas       : ${rechazadas.length}`);
  log(`  Añadidas a cola  : ${nuevasEnCola.length}`);

  // Notificación Telegram
  if (nuevasEnCola.length > 0) {
    const lines = nuevasEnCola.slice(0, 6).map(o =>
      `✅ <b>${o.titulo}</b>\n  🏢 ${o.empresa} | 📍 ${o.lugar}\n  🎯 Score: ${o.auditoria.score} | ${o.auditoria.categoria}\n  💬 ${o.auditoria.razon}\n  <a href="${o.url}">Ver oferta</a>`
    );
    await sendTelegram(
      `💼 <b>${nuevasEnCola.length} ofertas Tech aprobadas por IA</b> (L-V · Medellín)\n\n${lines.join('\n\n')}`
    );
    log('Notificación Telegram enviada.');
  } else {
    log('Sin nuevas ofertas aprobadas hoy.');
    await sendTelegram(`💼 <b>Computrabajo Pipeline</b>\nSe auditaron ${candidatas.length} ofertas. Ninguna nueva aprobada hoy.`);
  }

  log(`Cola actual: ${queue.length + nuevasEnCola.length} ofertas pendientes de aplicar.`);
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
</file>

<file path="scripts/jobs/cv_tailorer.js">
/**
 * cv_tailorer.js
 * Toma una oferta de Computrabajo + cv_base.md y genera un CV
 * personalizado con DeepSeek optimizado para esa oferta específica.
 * 
 * Uso: node scripts/cv_tailorer.js <url_oferta>
 *      node scripts/cv_tailorer.js --oferta-id <id>
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM } = require('../../lib/ai/llm_service');

const BASE_DIR  = path.resolve(__dirname, '..');
const JOBS_DIR  = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE   = path.join(JOBS_DIR, 'cv_base.md');
const CV_OUT    = path.join(JOBS_DIR, 'cv_tailored');

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── SCRAPE DESCRIPCIÓN COMPLETA DE OFERTA ────────────────────
async function scrapeOferta(url) {
  log(`🔍 Scrapeando oferta: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  const page = await ctx.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return {
      titulo:      clean(document.querySelector('h1, .js-jobTitle, [class*="title"]')?.textContent),
      empresa:     clean(document.querySelector('[class*="company"], [class*="empresa"], p[title]')?.textContent),
      lugar:       clean(document.querySelector('[class*="location"], [class*="ciudad"]')?.textContent),
      salario:     clean(document.querySelector('[class*="salary"], [class*="salario"]')?.textContent),
      descripcion: clean(document.querySelector('[class*="description"], [class*="descripcion"], #job-body, .jobDescriptionSection')?.textContent),
      requisitos:  clean(document.querySelector('[class*="requirements"], [class*="requisitos"]')?.textContent),
      cuerpo:      clean(document.body.innerText).substring(0, 5000),
    };
  });

  await browser.close();
  log(`✅ Oferta: "${data.titulo}" — ${data.empresa}`);
  return data;
}

// ─── TAILORING CON DEEPSEEK ───────────────────────────────────
async function tailorCV(cvBase, oferta) {
  log('🧠 Personalizando CV con DeepSeek...');

  const prompt = `Eres un experto en recursos humanos y redacción de CVs para el mercado tech colombiano.

TAREA: Personalizar el CV de Jeiser para maximizar su match con esta oferta específica.

OFERTA:
Título: ${oferta.titulo}
Empresa: ${oferta.empresa}
Descripción/Requisitos:
${oferta.descripcion || oferta.cuerpo}

CV BASE DE JEISER:
${cvBase}

INSTRUCCIONES:
1. Reescribe el CV completo en formato Markdown manteniendo el estilo Harvard limpio
2. Ajusta el RESUMEN PROFESIONAL (añade uno si no existe) para hacer match exacto con el título y requerimientos
3. Reordena y prioriza las skills que menciona la oferta — pon primero las que piden
4. Si la oferta pide algo que Jeiser no tiene explícito, busca la habilidad más cercana y ponla en contexto real
5. Ajusta la descripción de LifeOS y proyectos para enfatizar lo que la oferta valora
6. NO inventes experiencia ni certificaciones que Jeiser no tiene
7. Mantén TODO en español excepto términos técnicos en inglés
8. El CV final debe tener máximo UNA PÁGINA cuando se imprima

Devuelve SOLO el CV en Markdown, sin explicaciones ni comentarios adicionales.`;

  const response = await askLLM(prompt, [], 0.3);
  return (response.content || '').trim();
}

// ─── CALCULAR SCORE DE MATCH ──────────────────────────────────
async function calcularMatch(cvBase, oferta) {
  const prompt = `Analiza qué tan bien encaja Jeiser con esta oferta. Responde SOLO con un JSON:
{
  "score": <número 0-100>,
  "puntos_fuertes": ["...", "..."],
  "brechas": ["...", "..."],
  "recomendar_aplicar": true/false,
  "razon": "una frase"
}

OFERTA: ${oferta.titulo} en ${oferta.empresa}
DESCRIPCIÓN: ${(oferta.descripcion || oferta.cuerpo).substring(0, 1500)}

PERFIL JEISER: QA Automation Junior, Playwright, JS, CESDE bootcamp en curso, sin experiencia formal en QA aún.`;

  const response = await askLLM(prompt, [], 0.1);
  try {
    const json = (response.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return { score: 50, recomendar_aplicar: true, razon: 'Score no calculado' };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  ensureDir(CV_OUT);

  const urlArg = process.argv[2];
  if (!urlArg) {
    // Sin argumento: procesar las 5 mejores ofertas guardadas
    const data = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
    const ofertas = (data.ofertas || []).filter(o => o.url).slice(0, 5);
    log(`Procesando ${ofertas.length} ofertas del último scrape...`);

    const cvBase = fs.readFileSync(CV_BASE, 'utf8');
    const resultados = [];

    for (const oferta of ofertas) {
      try {
        const detalles  = await scrapeOferta(oferta.url);
        const match     = await calcularMatch(cvBase, detalles);
        const cvTailored = match.recomendar_aplicar ? await tailorCV(cvBase, detalles) : null;

        const slug = (oferta.titulo || 'oferta').toLowerCase().replace(/\s+/g, '-').substring(0, 30);
        const timestamp = Date.now();

        const resultado = {
          oferta: { ...oferta, ...detalles },
          match,
          cv_path: null,
        };

        if (cvTailored) {
          const cvPath = path.join(CV_OUT, `cv_${slug}_${timestamp}.md`);
          fs.writeFileSync(cvPath, cvTailored, 'utf8');
          resultado.cv_path = cvPath;
          log(`✅ CV generado: ${path.basename(cvPath)} (score: ${match.score})`);
        } else {
          log(`⏭ Saltando "${oferta.titulo}" — score bajo (${match.score}): ${match.razon}`);
        }

        resultados.push(resultado);
      } catch (e) {
        log(`⚠ Error en "${oferta.titulo}": ${e.message.substring(0, 80)}`);
      }
    }

    const resumenPath = path.join(JOBS_DIR, 'cv_tailoring_results.json');
    fs.writeFileSync(resumenPath, JSON.stringify(resultados, null, 2), 'utf8');

    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMEN CV TAILORING');
    console.log('═══════════════════════════════════════');
    resultados.forEach(r => {
      const icon = r.match.recomendar_aplicar ? '✅' : '❌';
      console.log(`${icon} [${r.match.score || '?'}] ${r.oferta.titulo} — ${r.oferta.empresa}`);
      if (r.match.brechas?.length) console.log(`   Brechas: ${r.match.brechas.join(', ')}`);
      if (r.cv_path) console.log(`   CV: ${path.basename(r.cv_path)}`);
    });

  } else {
    // Con URL específica
    const cvBase   = fs.readFileSync(CV_BASE, 'utf8');
    const detalles = await scrapeOferta(urlArg);
    const match    = await calcularMatch(cvBase, detalles);
    const cvTailored = await tailorCV(cvBase, detalles);

    console.log('\n📊 MATCH ANALYSIS:');
    console.log(JSON.stringify(match, null, 2));

    const slug = (detalles.titulo || 'oferta').toLowerCase().replace(/\s+/g, '-').substring(0, 30);
    const cvPath = path.join(CV_OUT, `cv_${slug}.md`);
    fs.writeFileSync(cvPath, cvTailored, 'utf8');
    console.log(`\n✅ CV personalizado guardado: ${cvPath}`);
    console.log('\nPrimeras líneas:\n' + cvTailored.substring(0, 500));
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
</file>

<file path="scripts/jobs/find_aplicaciones.js">
/**
 * find_aplicaciones.js — Encuentra la URL del historial de aplicaciones CT
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');
const { robustLogin } = require('./ct_login_helper');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  // Login
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await robustLogin(page, CT_EMAIL, CT_PASS);
  await page.waitForTimeout(2000);

  // Desde el home, buscar todos los links del menú
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')]
      .map(a => ({ text: a.textContent.trim().substring(0, 40), href: a.href }))
      .filter(l => l.href.includes('candidato') && l.text.length > 2)
      .filter((v, i, a) => a.findIndex(x => x.href === v.href) === i)
      .slice(0, 30);
  });

  console.log('Links del perfil CT:');
  links.forEach(l => console.log(`  ${l.text.padEnd(35)} → ${l.href}`));

  // También buscar link "aplicaciones", "postulaciones", "mis ofertas"
  const appLink = links.find(l =>
    /aplica|postula|mis ofertas|inscri/i.test(l.text) ||
    /aplica|postula|inscri/i.test(l.href)
  );
  if (appLink) {
    console.log('\n✅ Link de aplicaciones encontrado:', appLink);
    await page.goto(appLink.href, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);
    const texto = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 2000));
    console.log('\n══ CONTENIDO ══\n', texto);
  }

  await browser.close();
})().catch(e => console.error('Error:', e.message));
</file>

<file path="scripts/jobs/whatsapp_jobs_parser.js">
const fs = require('node:fs');
const path = require('node:path');
const { logApplication, listApps, getStats } = require('../../lib/runtime/job_tracker');

const BASE_DIR = path.resolve(__dirname, '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const CANAL_PATH = path.join(JOBS_DIR, 'canal_juniorjobs.json');

function ensureDir() { if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true }); }

function log(msg) { console.log(msg); }

// ─── PARSE WHATSAPP FORWARDED JOB MESSAGE ─────────────────────
function parseJobMessage(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  const jobs = [];
  let currentJob = null;

  const patterns = {
    empresa: /^(?:🏢|🔹|💼|📍)?\s*(?:Empresa:|Company:)\s*(.+)/i,
    puesto: /^(?:👨‍💻|👩‍💻|💻|🔍)?\s*(?:Puesto:|Role:|Posición:|Cargo:)\s*(.+)/i,
    salario: /^(?:💰|💵)?\s*(?:Salario:|Salary:|Sueldo:)\s*(.+)/i,
    ubicacion: /^(?:📍|🌎)?\s*(?:Ubicación:|Location:|Remoto|Remote|Presencial)\s*(.+)?/i,
    stack: /^(?:🛠)?\s*(?:Stack:|Tecnologías:|Tech:)\s*(.+)/i,
    link: /(https?:\/\/[^\s]+)/i,
    email: /([\w.-]+@[\w.-]+\.\w+)/i
  };

  for (const line of lines) {
    const cleaned = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    
    // Check if this looks like a job start
    const empresaMatch = cleaned.match(patterns.empresa);
    const puestoMatch = cleaned.match(patterns.puesto);
    
    if (empresaMatch || puestoMatch) {
      if (currentJob && currentJob.puesto) {
        jobs.push(currentJob);
      }
      currentJob = { empresa: '', puesto: '', salario: '', ubicacion: '', stack: '', link: '', contacto: '' };
      if (empresaMatch) currentJob.empresa = empresaMatch[2].trim();
      if (puestoMatch) currentJob.puesto = puestoMatch[2].trim();
      continue;
    }

    if (!currentJob) continue;

    // Extract details
    const salarioMatch = cleaned.match(patterns.salario);
    const ubicacionMatch = cleaned.match(patterns.ubicacion);
    const stackMatch = cleaned.match(patterns.stack);
    const linkMatch = cleaned.match(patterns.link);
    const emailMatch = cleaned.match(patterns.email);

    if (salarioMatch) currentJob.salario = salarioMatch[2] || salarioMatch[1];
    else if (ubicacionMatch) currentJob.ubicacion = ubicacionMatch[2] || ubicacionMatch[1];
    else if (stackMatch) currentJob.stack = stackMatch[2] || stackMatch[1];
    else if (linkMatch) currentJob.link = linkMatch[1];
    else if (emailMatch) currentJob.contacto = emailMatch[1];
    else if (!currentJob.puesto && cleaned.length > 10 && cleaned.length < 100) {
      currentJob.puesto = cleaned;
    } else if (!currentJob.empresa && cleaned.length > 3 && cleaned.length < 60) {
      currentJob.empresa = cleaned;
    }
  }

  if (currentJob && currentJob.puesto) jobs.push(currentJob);
  return jobs;
}

// ─── MATCH JOBS AGAINST PROFILE ─────────────────────────────
function matchJobs(jobs) {
  const vital = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data', 'contexto_vital.json'), 'utf8'));
  const habilidades = (vital.estudio?.habilidades || []).map(h => h.toLowerCase());
  const industrias = (vital.trabajo?.industrias_interes || []).map(i => i.toLowerCase());
  const keywords = ['qa', 'testing', 'playwright', 'cypress', 'automatización', 'automation', 
                    'javascript', 'typescript', 'node', 'react', 'frontend', 'backend', 'fullstack',
                    'junior', 'trainee', 'sin experiencia', 'entry level', 'remoto', 'remote',
                    'soporte', 'support', 'it', 'desarrollador', 'developer', 'programador',
                    'colombia', 'latam', 'latinoamérica', 'medellín'];

  for (const job of jobs) {
    const text = (job.puesto + ' ' + job.empresa + ' ' + job.stack + ' ' + job.ubicacion).toLowerCase();
    let score = 50;

    // Higher score for matching skills
    for (const skill of habilidades) {
      if (text.includes(skill.toLowerCase())) score += 15;
    }

    // Bonus for matching industries
    for (const ind of industrias) {
      if (text.includes(ind.toLowerCase())) score += 10;
    }

    // Boost for specific keywords
    if (keywords.some(k => text.includes(k))) score += 8;

    // Penalize senior roles
    if (text.includes('senior') || text.includes('sr.') || text.includes('líder')) score -= 20;
    if (text.includes('semi senior') || text.includes('semi-senior')) score -= 5;
    
    // Boost for junior/entry
    if (text.includes('junior') || text.includes('jr.') || text.includes('trainee') || text.includes('sin experiencia')) score += 15;
    
    // Boost for remote
    if (text.includes('remoto') || text.includes('remote')) score += 10;

    // Boost for Colombia/LATAM
    if (text.includes('colombia') || text.includes('latam') || text.includes('latinoamérica')) score += 10;

    job.score = Math.max(0, Math.min(100, score));
    job.aplicar = job.score >= 60;
    job.razon = job.aplicar ? 
      (job.score >= 80 ? 'ALTAMENTE RECOMENDADO - Perfil coincide fuerte' : 
       job.score >= 65 ? 'RECOMENDADO - Buen match con tu perfil' : 
       'POSIBLE - Revisar detalles') :
      'NO RECOMENDADO - Perfil no coincide';
  }

  jobs.sort((a, b) => b.score - a.score);
  return jobs;
}

// ─── SAVE & TRACK ──────────────────────────────────────────
function saveToTracker(jobs) {
  const tracked = [];
  for (const job of jobs) {
    if (job.aplicar && job.link) {
      const result = logApplication({
        empresa: job.empresa || 'Desconocida',
        cargo: job.puesto,
        plataforma: 'JuniorJobs WhatsApp',
        url: job.link,
        detalles: `Stack: ${job.stack || 'N/A'} | ${job.ubicacion || ''} | ${job.salario || ''} | Score: ${job.score}`,
        fecha_aplicacion: new Date().toISOString().split('T')[0]
      });
      tracked.push({ job, result });
    }
  }
  return tracked;
}

// ─── GENERATE REPORT ─────────────────────────────────────────
function generateReport(jobs, aplicadas) {
  ensureDir();
  
  const report = {
    fecha: new Date().toISOString(),
    fuente: 'JuniorJobs WhatsApp (51K seguidores)',
    total: jobs.length,
    recomendadas: jobs.filter(j => j.aplicar).length,
    no_recomendadas: jobs.filter(j => !j.aplicar).length,
    jobs: jobs.map(j => ({
      empresa: j.empresa,
      puesto: j.puesto,
      stack: j.stack,
      ubicacion: j.ubicacion,
      salario: j.salario,
      link: j.link,
      score: j.score,
      veredicto: j.aplicar ? 'APLICAR' : 'NO APLICAR',
      razon: j.razon
    }))
  };

  fs.writeFileSync(CANAL_PATH, JSON.stringify(report, null, 2));
  
  // Generate Telegram-friendly summary
  const lines = [];
  lines.push(`📋 *JuniorJobs WhatsApp - ${new Date().toLocaleDateString('es-CO', {timeZone:'America/Bogota'})}*`);
  lines.push(`_${report.total} ofertas analizadas | ${report.recomendadas} recomendadas para ti_`);
  lines.push('');

  const aplicar = jobs.filter(j => j.aplicar);
  if (aplicar.length > 0) {
    lines.push('🟢 *APLICAR:*');
    for (const j of aplicar) {
      lines.push(`• *${j.puesto}* @ ${j.empresa} (${j.score}%)`);
      if (j.stack) lines.push(`  Stack: ${j.stack}`);
      if (j.link) lines.push(`  ${j.link}`);
      lines.push('');
    }
  }

  const noAplicar = jobs.filter(j => !j.aplicar);
  if (noAplicar.length > 0) {
    lines.push('🔴 *NO APLICAR:*');
    for (const j of noAplicar.slice(0, 5)) {
      lines.push(`• ${j.puesto} @ ${j.empresa} - ${j.razon.substring(0, 40)}`);
    }
    if (noAplicar.length > 5) lines.push(`  ... y ${noAplicar.length - 5} mas`);
  }

  const stats = getStats();
  lines.push('');
  lines.push(`📊 *Tracking:* ${stats.activas} aplicaciones activas | ${stats.entrevistas} entrevistas | ${stats.compatibles} compatibles`);

  return { report, telegramMsg: lines.join('\n') };
}

// ─── MAIN ─────────────────────────────────────────────────────
function main() {
  ensureDir();
  
  const inputText = process.argv[2];
  if (!inputText) {
    // Try reading from stdin
    let stdinData = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => stdinData += chunk);
    process.stdin.on('end', () => {
      if (!stdinData.trim()) {
        log('Uso: node scripts/whatsapp_jobs_parser.js "texto del mensaje de WhatsApp"');
        log('  o: echo "texto" | node scripts/whatsapp_jobs_parser.js');
        log('');
        log('Reenvia el mensaje del canal JuniorJobs al bot de Telegram');
        log('y el sistema lo parseara automaticamente.');
        process.exit(0);
      }
      processMessage(stdinData);
    });
    return;
  }

  processMessage(inputText);
}

function processMessage(text) {
  log('📱 Parseando ofertas de JuniorJobs WhatsApp...\n');
  
  const jobs = parseJobMessage(text);
  log(`   ${jobs.length} ofertas extraidas`);
  
  if (jobs.length === 0) {
    log('   ⚠ No se encontraron ofertas. ¿El formato del mensaje cambio?');
    log('   Guardando texto original para debug.');
    const fallbackPath = path.join(JOBS_DIR, 'ultimo_mensaje_crudo.txt');
    fs.writeFileSync(fallbackPath, text);
    process.exit(0);
  }
  
  const matched = matchJobs(jobs);
  const aplicadas = saveToTracker(matched);
  const { report, telegramMsg } = generateReport(matched, aplicadas);
  
  log(telegramMsg);
  log(`\n✅ Reporte guardado: ${CANAL_PATH}`);
  
  // Output for Telegram integration
  console.log('\n__TELEGRAM_MSG__');
  console.log(telegramMsg);
}

main();
</file>

<file path="scripts/jobs/revisar_ofertas.js">
/**
 * revisar_ofertas.js — Scrape y evalúa top 10 ofertas Medellín (sesión CT)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const { askLLM } = require('../../lib/ai/llm_service');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

const SEARCHES = [
  'auxiliar-sistemas', 'soporte-tecnico-software', 'mesa-de-ayuda',
  'helpdesk', 'soporte-nivel-1', 'qa-junior', 'tester-manual-software',
];

const ES_MEDELLIN  = /medellin|antioquia|envigado|bello|itagui|sabaneta|rionegro/i;
const NO_MEDELLIN  = /bogota|bogot|cali|barranquilla|cartagena|bucaramanga|manizales|cucuta|pereira|funza|pasto|neiva|mosquera/i;

const PERFIL = `Jeiser Abraham Gutierrez Torres, QA Automation Junior (Medellín).
Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL básico, SQLite, Linux.
Proyecto real: LifeOS (12 workflows GitHub Actions, scraping Playwright, APIs, Telegram bot, producción).
Experiencia previa: Vigilante CCTV/medios tecnológicos 2 años (Coovisocial 2019-2021), Agente soporte Iberia/Amadeus-GDS (Sitel 2021).
Estudios: Bootcamp QA Automation 28 semanas CESDE (en curso), SENA Bases de Datos + Excel.
Disponible: tiempo completo, Medellín presencial o remoto.`;

// ── Login ───────────────────────────────────────────────────────
async function loginCT(page) {
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const emailSel = page.locator('#Email, input[name="Email"]').first();
  await emailSel.fill(CT_EMAIL, { timeout: 10000 });
  const passSel = page.locator('#password, input[name="Password"]').first();
  await passSel.fill(CT_PASS, { timeout: 5000 });

  // Submit
  const submitBtn = page.locator('button[type="submit"]').first();
  await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(async () => {
    await page.keyboard.press('Enter');
  });

  // OAuth puede tardar 6-8s — esperar hasta que salga de acceso/callback
  await page.waitForTimeout(6000);
  const ok = page.url().includes('candidate/home') || page.url().includes('candidato.co.computrabajo.com') && !page.url().includes('acceso');
  console.log(`  🔑 Login CT: ${ok ? '✅ OK — ' + page.url().substring(0,55) : '⚠️  ' + page.url().substring(0,60)}`);
}

// ── Scrape lista de cards ───────────────────────────────────────
async function scrapeCards(page, q) {
  const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate&l=medellin`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const results = [];
    document.querySelectorAll('article').forEach(card => {
      const a = card.querySelector('h2 a, h3 a, a[href*="oferta"]');
      if (!a?.href) return;
      const titulo  = (a.textContent || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
      const empresa = card.querySelector('[class*="company"], [class*="employer"]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const lugar   = card.querySelector('[class*="city"], [class*="location"]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (titulo.length > 3) results.push({ titulo, empresa: empresa.substring(0, 50), lugar, url: a.href });
    });
    return results;
  });
}

// ── Scrape descripción con Playwright — selector correcto box_detail ──
async function scrapeDesc(page, url) {
  try {
    await page.goto(url.split('#')[0], { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);

    return await page.evaluate(() => {
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();

      // Empresa y ciudad desde el título
      const title = document.title || '';
      const empM = title.match(/ en ([^-]+) - /);
      const empresa = empM ? empM[1].trim().substring(0, 50) : '';
      const ciudadM = title.match(/ - (.+)$/);
      const lugar = ciudadM ? ciudadM[1].trim().substring(0, 50) : '';

      // Selector correcto confirmado por diagnóstico: div.box_detail.fl.w100_m
      let desc = '';
      const boxEl = document.querySelector('.box_detail.fl') ||
                    document.querySelector('[class="box_detail fl w100_m"]') ||
                    document.querySelector('.box_border.menu_top');

      if (boxEl) {
        const fullText = clean(boxEl.innerText);
        // Extraer desde 'Descripción de la oferta' hasta 'Aplicar' o 'Denunciar'
        const startMark = fullText.indexOf('Descripción de la oferta');
        const endMark   = fullText.search(/\b(Aplicar|Denunciar|Ofertas similares|Acerca de)\b/);
        if (startMark > -1) {
          const end = endMark > startMark ? endMark : startMark + 3000;
          desc = fullText.substring(startMark + 'Descripción de la oferta'.length, end).trim().substring(0, 2000);
        } else {
          desc = fullText.substring(0, 2000);
        }
      }

      // Salario — buscar patrón en el body
      const bodyText = document.body.innerText;
      const salM = bodyText.match(/\$[\s\d.,]+(?:mensual|COP)?/i) ||
                   bodyText.match(/A convenir/);
      const salario = salM ? salM[0].trim().substring(0, 40) : '';

      return { empresa, lugar, salario, desc };
    });
  } catch (e) {
    return { empresa: '', lugar: '', salario: '', desc: '' };
  }
}

// ── Main ────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 }, // Medellín
  });
  const page = await ctx.newPage();

  // Login y extraer cookies de sesión
  console.log('\n🔐 Iniciando sesión en Computrabajo...');
  await loginCT(page);

  // Extraer cookies ya no necesario — Playwright navega con sesión activa

  // Recoger candidatas Medellín
  const seen = new Set();
  const candidatas = [];

  for (const q of SEARCHES) {
    const cards = await scrapeCards(page, q);
    for (const c of cards) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      if (NO_MEDELLIN.test(c.url) && !ES_MEDELLIN.test(c.url)) continue;
      candidatas.push(c);
    }
    if (candidatas.length >= 30) break;
  }

  console.log(`\n✅ ${candidatas.length} candidatas en Medellín/Área. Evaluando las primeras 10...\n`);

  const evaluadas = [];
  for (const oferta of candidatas.slice(0, 10)) {
    process.stdout.write(`  🔍 ${oferta.titulo.substring(0, 55).padEnd(55)}... `);
    const det = await scrapeDesc(page, oferta.url);

    const empresa = det.empresa || oferta.empresa || 'N/A';
    const lugar   = det.lugar   || oferta.lugar   || 'Medellín';
    const salario = det.salario || 'N/A';

    const prompt = `Evalúa compatibilidad candidato-oferta (0-100). Solo JSON válido, sin texto extra.
CANDIDATO: ${PERFIL}
OFERTA: "${oferta.titulo}" | Empresa: ${empresa} | Ciudad: ${lugar} | Salario: ${salario}
DESCRIPCIÓN: ${det.desc.substring(0, 1500)}
Responde: {"score":<0-100>,"recomendacion":"APLICAR"|"REVISAR"|"DESCARTAR","razon":"<max 100 chars>","puntos_fuertes":["..."],"gaps":["..."]}`;

    // Debug: ver si la descripción se extrajo
    const descLen = det.desc?.length || 0;
    if (descLen < 10) process.stdout.write(`[⚠️ desc vacía] `);

    let ev = { score: 0, recomendacion: 'REVISAR', razon: 'Error parsing LLM response', puntos_fuertes: [], gaps: [] };
    try {
      const sysPrompt = `Eres un evaluador de compatibilidad laboral. Responde SOLO con JSON válido, sin texto adicional.`;
      const msg = await askLLM(sysPrompt, [{ role: 'user', content: prompt }]);
      const raw = typeof msg === 'string' ? msg : (msg?.content || '');
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        ev = JSON.parse(m[0]);
      } else {
        ev.razon = 'No JSON en respuesta: ' + raw.substring(0, 60);
      }
    } catch (e) {
      ev.razon = 'Error LLM: ' + e.message.substring(0, 40);
    }

    process.stdout.write(`Score: ${String(ev.score).padStart(3)} → ${ev.recomendacion}\n`);
    evaluadas.push({ ...oferta, empresa, lugar, salario, ...ev });
    await page.waitForTimeout(300);
  }

  await browser.close();

  // Ordenar y mostrar
  evaluadas.sort((a, b) => b.score - a.score);

  console.log('\n' + '═'.repeat(72));
  console.log('  RANKING DE OFERTAS — Medellín / Área Metro');
  console.log('═'.repeat(72));

  evaluadas.forEach((o, i) => {
    const icon = o.recomendacion === 'APLICAR' ? '🟢' : o.recomendacion === 'REVISAR' ? '🟡' : '🔴';
    console.log(`\n${icon} ${i+1}. [${o.score}/100] ${o.titulo}`);
    console.log(`    🏢 ${o.empresa}  |  📍 ${o.lugar}  |  💰 ${o.salario}`);
    console.log(`    📝 ${o.razon}`);
    if (o.puntos_fuertes?.length) console.log(`    ✅ ${o.puntos_fuertes.slice(0,3).join(' · ')}`);
    if (o.gaps?.length)           console.log(`    ⚠️  ${o.gaps.slice(0,3).join(' · ')}`);
    console.log(`    🔗 ${o.url}`);
  });

  const apl = evaluadas.filter(o => o.recomendacion === 'APLICAR').length;
  const rev = evaluadas.filter(o => o.recomendacion === 'REVISAR').length;
  const des = evaluadas.length - apl - rev;
  console.log(`\n📊  🟢 ${apl} APLICAR  |  🟡 ${rev} REVISAR  |  🔴 ${des} DESCARTAR\n`);
})().catch(e => console.error('Fatal:', e.message));
</file>

<file path="scripts/jobs/ct_login_helper.js">
/**
 * scripts/jobs/ct_login_helper.js
 *
 * Lógica robusta y centralizada para el login en Computrabajo.
 * Supera los A/B testing y cambios de selectores semánticos.
 *
 * Actualizado: Computrabajo ahora usa login de 2 pasos (secure.computrabajo.com)
 *   Paso 1: Email + "Continuar"
 *   Paso 2: Password + "Iniciar sesión"
 */

/**
 * Realiza un login seguro en Computrabajo (login de 2 pasos).
 *
 * @param {import('playwright').Page} page - Instancia de Playwright
 * @param {string} email - Correo del usuario
 * @param {string} pass - Contraseña del usuario
 * @returns {Promise<boolean>} true si el login fue exitoso, false si no se detectó dashboard post-login
 */
async function robustLogin(page, email, pass) {
  try {
    // Anti-detección: ocultar webdriver
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // ── PASO 1: Email ──────────────────────────────────────────
    if (!email || !pass) {
      throw new Error('Faltan credenciales de Computrabajo en el entorno (.env o Secrets)');
    }

    // El login redirige automáticamente de /acceso/ a secure.computrabajo.com
    // Esperar campo email
    const emailInput = page.locator('#Email, .it-email, input[type="email"], input[name="Email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await emailInput.fill(email);

    // Click en botón "Continuar"
    const btnContinuar = page.locator('#continueWithMailButton, button:has-text("Continuar"), .b_primary_inv').first();
    await btnContinuar.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón Continuar no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // ── PASO 2: Password ───────────────────────────────────────
    // Esperar a que aparezca el campo de contraseña (se muestra tras validar email)
    const passInput = page.locator('#password, input[type="password"], .cm-12.rounded').first();
    await passInput.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);
    await passInput.fill(pass);

    // Click en botón "Iniciar sesión"
    const btnEntrar = page.locator('#btnSubmitPass, a:has-text("Iniciar sesión"), button:has-text("Entrar")').first();
    await btnEntrar.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón de inicio de sesión no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // Esperar a que procese el login
    await page.waitForTimeout(5000);

    // ── VERIFICACIÓN ───────────────────────────────────────────
    // Verificar login exitoso: buscar elementos del dashboard post-login
    const loginOk = await page.waitForSelector(
      '.menu_log, .info_user, .ccp_menu, [class*="user-menu"], a[href*="postulaciones"], [href*="/candidate/home"]',
      { timeout: 10000 }
    ).then(() => true).catch(() => false);

    if (!loginOk) {
      console.error('  [ct_login_helper] ⚠️ Login aparentemente fallido — no se detectó dashboard post-login');
      return false;
    }

    return true;
  } catch (error) {
    console.error('  [ct_login_helper] Error crítico durante el login:', error.message.substring(0, 100));
    throw error;
  }
}

module.exports = {
  robustLogin
};
</file>

<file path="scripts/jobs/job_loop.js">
/**
 * job_loop.js — Pipeline completo de Job Hunter
 * Loop x5: Scrape → Analyze → Tailor CV → Apply
 * 
 * Uso: node scripts/job_loop.js [--loops=5] [--min-score=60] [--dry-run]
 *   --dry-run: analiza y genera CVs pero NO aplica
 */
require('dotenv').config();
const fs    = require('node:fs');
const path  = require('node:path');
const { execSync, spawn } = require('node:child_process');
const { askLLM } = require('../../lib/ai/llm_service');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const BASE_DIR  = path.resolve(__dirname, '..', '..');
const JOBS_DIR  = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE   = path.join(BASE_DIR, 'data', 'sources', 'jobs', 'cv_base.md');
const CV_OUT    = path.join(JOBS_DIR, 'cv_tailored');
const APPLY_LOG = path.join(JOBS_DIR, 'aplicaciones.json');

const LOOPS     = parseInt((process.argv.find(a => a.startsWith('--loops=')) || '--loops=5').split('=')[1]);
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const DRY_RUN   = process.argv.includes('--dry-run');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch (e) { console.error(`[Telegram Error] ${e.message}`); }
}

// ─── SCRAPE LISTA DE OFERTAS ──────────────────────────────────
async function scrapeOfertasList() {
  const SEARCHES = [
    'tester-manual-software',
    'analista-qa-software',
    'qa-junior',
    'analista-pruebas',
    'practicante-qa',
    'soporte-tecnico-software',
    'qa-trainee',
    'software-qa-analyst',
    'auxiliar-sistemas',
    'mesa-de-ayuda',
    'helpdesk',
    'soporte-nivel-1',
    'mesa-ayuda-sistemas',
  ];
  const { chromium: _c } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();
  const allOffers = [];

  for (const q of SEARCHES) {
    const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
      const offers = await page.evaluate((lbl) => {
        const results = [];
        const clean = s => (s || '').replace(/\s+/g, ' ').trim();
        // Palabras que indican que NO es tech (calidad industrial/construcción)
        const NON_TECH = /andamio|ensamblador|eléctric|construcci|andamier|soldad|mecáni|operari|producción|manufactura|planta|textil|costura|bodega/i;
        const cards = document.querySelectorAll('article, [class*="offerItem"]');
        if (cards.length > 0) {
          Array.from(cards).slice(0, 12).forEach(card => {
            const titleEl = card.querySelector('h2 a, h3 a, a[title]');
            if (!titleEl) return;
            const titulo = clean(titleEl.textContent || titleEl.getAttribute('title'));
            if (NON_TECH.test(titulo)) return; // filtrar no-tech
            results.push({
              titulo,
              empresa: clean(card.querySelector('p[title], [class*="company"]')?.getAttribute('title') || card.querySelector('p[title], [class*="company"]')?.textContent),
              lugar:   clean(card.querySelector('[class*="city"], [class*="location"]')?.textContent),
              url:     titleEl.href || '',
              id:      (titleEl.href || '').match(/oferta-([\w-]+)/)?.[1] || Math.random().toString(36).slice(2),
            });
          });
        } else {
          document.querySelectorAll('a[href*="oferta-"]').forEach((a, i) => {
            if (i >= 12) return;
            const text = clean(a.textContent);
            if (text.length > 5 && !NON_TECH.test(text)) results.push({ titulo: text, empresa: '', lugar: '', url: a.href, id: a.href.match(/oferta-([\w-]+)/)?.[1] || Math.random().toString(36).slice(2) });
          });
        }
        return results;
      }, q);
      allOffers.push(...offers.map(o => ({ ...o, categoria: q, scraped_at: new Date().toISOString() })));
      log(`  [scrape] ${q}: ${offers.length} ofertas`);
    } catch (e) {
      log(`  [scrape] ⚠ ${q}: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(1000);
  }
  await browser.close();

  // Deduplicar
  const seen = new Set();
  return allOffers.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });
}

// ─── SCRAPE DESCRIPCIÓN COMPLETA ──────────────────────────────
async function scrapeDescripcion(url, browser) {
  const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    const desc = await page.evaluate(() => {
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();
      const body = document.querySelector('[class*="description"], [class*="jobDescription"], #job-body, .jobDescriptionSection, main');
      return clean(body?.innerText || document.body.innerText).substring(0, 3000);
    });
    await ctx.close();
    return desc;
  } catch (e) {
    await ctx.close();
    return '';
  }
}

// ─── ANALIZAR COMPATIBILIDAD ──────────────────────────────────

/**
 * @typedef {Object} AnalisisResult
 * @property {number} score
 * @property {string} nivel_requerido
 * @property {string[]} skills_match
 * @property {string[]} skills_gap
 * @property {string} salario_estimado
 * @property {string} modalidad
 * @property {boolean} recomendar
 * @property {string} razon_corta
 * @property {string} tip_postulacion
 */

/**
 * @param {Object} oferta
 * @param {string} cvBase
 * @returns {Promise<AnalisisResult>}
 */
async function analizarOferta(oferta, cvBase) {
  const desc = oferta.descripcion || oferta.titulo;
  const prompt = `Eres un experto en reclutamiento tech en Colombia. Analiza la compatibilidad entre este candidato y la oferta.

CANDIDATO - Jeiser Gutierrez:
- QA Automation Junior (CESDE bootcamp 2026, 28 semanas)
- Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL básico
- Experiencia Práctica: Creador de LifeOS (sistema autónomo de producción con 11 workflows CI/CD, scraping, integración LLM y base de datos SQLite).
- Disponible: tiempo completo o medio tiempo, Medellín + remoto

REGLA DE EVALUACIÓN CLAVE:
Ignora los requisitos corporativos rígidos de "1 o 2 años de experiencia formal". El proyecto LifeOS demuestra habilidades avanzadas equivalentes a +1 año de experiencia real. Si la vacante es Junior/Trainee y los skills técnicos (JS, Playwright, Automation) hacen match, asígnale un score ALTO (>= 60) y evalúa su capacidad real, no los años en papel.

n	REGLAS ESTRICTAS: NO asignar score > 30 a roles de: Analista de Oxígeno, SST, Químico, Fisicoquímico, Calidad industrial (alimentos, laboratorio, procesos). Solo si la descripción menciona herramientas de software explícitamente.
OFERTA: ${oferta.titulo} | ${oferta.empresa} | ${oferta.lugar}
DESCRIPCIÓN: ${desc.substring(0, 1500)}

Responde SOLO en JSON válido:
{
  "score": <0-100>,
  "nivel_requerido": "junior|mid|senior",
  "skills_match": ["skill1", "skill2"],
  "skills_gap": ["gap1", "gap2"],
  "salario_estimado": "$X.XXX.000 - $Y.YYY.000",
  "modalidad": "remoto|presencial|hibrido",
  "recomendar": true/false,
  "razon_corta": "una frase",
  "tip_postulacion": "qué enfatizar en la carta"
}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { score: 50, recomendar: true, razon_corta: 'Análisis manual requerido', skills_match: [], skills_gap: [] };
  }
}

// ─── TAILORING CV ─────────────────────────────────────────────
async function tailorCV(oferta, analisis, cvBase) {
  const prompt = `Personaliza este CV para la oferta específica. Usa el análisis previo para saber qué enfatizar.

OFERTA: ${oferta.titulo} — ${oferta.empresa}
SKILLS A DESTACAR: ${(analisis.skills_match || []).join(', ')}
TIP: ${analisis.tip_postulacion || ''}
DESCRIPCIÓN: ${(oferta.descripcion || oferta.titulo).substring(0, 1000)}

CV BASE:
${cvBase}

INSTRUCCIONES:
1. Añade un RESUMEN PROFESIONAL de 2-3 líneas específico para esta oferta
2. Reordena skills: primero las que piden, luego las demás
3. Ajusta LifeOS project para enfatizar lo relevante para esta oferta
4. Mantén TODO verídico — no inventes nada
5. Formato Markdown limpio Harvard — máx 1 página al imprimir
6. Devuelve SOLO el CV en Markdown`;

  const res = await askLLM(prompt, [], 0.3);
  return (res.content || '').replace(/```markdown|```/g, '').trim();
}

// ─── APLICAR OFERTA ───────────────────────────────────────────
async function aplicar(oferta, browser) {
  if (DRY_RUN) { log('  [dry-run] Saltando aplicación'); return { exito: false, razon: 'dry-run' }; }

  const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' });
  const page = await ctx.newPage();
  try {
    // Login
    await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await robustLogin(page, CT_EMAIL, CT_PASS);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Navegar a oferta
    await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Botón postularme
    const btnSelectors = [
      'a:has-text("Aplicar")', 'button:has-text("Aplicar")',
      'button:has-text("Postularme")', 'button:has-text("Postular")',
      'a:has-text("Postularme")', 'a:has-text("Postular")',
      '.js-apply-btn', '[data-qa="applyButton"]', '.b_primary.tiny',
    ];
    let clicked = false;
    for (const sel of btnSelectors) {
      try { await page.click(sel, { timeout: 3000 }); clicked = true; break; } catch (e) { log(`  [debug] btn no matchea: ${sel}`); }
    }

    if (!clicked) {
      await ctx.close();
      return { exito: false, razon: 'Botón postularme no encontrado' };
    }

    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    const confirmado = await page.evaluate(() =>
      /postul|envi|éxito|registrad|aplicac/i.test(document.body.innerText)
    );

    const shot = path.join(JOBS_DIR, `apply_${oferta.id}_${Date.now()}.png`);
    await page.screenshot({ path: shot });
    await ctx.close();
    return { exito: confirmado, razon: confirmado ? 'Postulación enviada' : 'No confirmado', screenshot: shot };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 80) };
  }
}

// ─── MAIN LOOP ────────────────────────────────────────────────
async function main() {
  ensureDir(CV_OUT);
  const cvBase = fs.readFileSync(CV_BASE, 'utf8');
  const aplicaciones = fs.existsSync(APPLY_LOG) ? JSON.parse(fs.readFileSync(APPLY_LOG, 'utf8')) : [];
  const yaAplicadas = new Set(aplicaciones.map(a => a.oferta_id || a.url));

  log('═══════════════════════════════════════════════════');
  log(`🚀 JOB LOOP x${LOOPS} | min-score: ${MIN_SCORE} | ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  log('═══════════════════════════════════════════════════');

  const resultados = [];
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  for (let loop = 1; loop <= LOOPS; loop++) {
    log(`\n━━━ LOOP ${loop}/${LOOPS} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // PASO 1: Scrape
    log('📡 [1/4] Scraping Computrabajo...');
    const ofertas = await scrapeOfertasList();
    const UBICACIONES_OK  = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|teletrabajo/i;
    const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa marta/i;

    const nuevas = ofertas.filter(o => {
      if (yaAplicadas.has(o.id)) return false;
      const texto = ((o.lugar || '') + ' ' + (o.url || '')).toLowerCase();
      if (UBICACIONES_NOK.test(texto) && !UBICACIONES_OK.test(texto)) return false;
      return true;
    });
    log(`  Total: ${ofertas.length} | Nuevas (Medellín/Remoto): ${nuevas.length}`);

    if (nuevas.length === 0) {
      log('  Sin ofertas nuevas en Medellín/Remoto este loop.');
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    // Guardar todas en disco
    fs.writeFileSync(path.join(JOBS_DIR, 'computrabajo.json'),
      JSON.stringify({ fecha: new Date().toISOString(), total: ofertas.length, ofertas }, null, 2));

    // Procesar top 5 nuevas por loop
    const toProcess = nuevas.slice(0, 5);
    log(`  Procesando ${toProcess.length} ofertas...`);

    for (const oferta of toProcess) {
      log(`\n  📋 "${oferta.titulo}" — ${oferta.empresa}`);

      // PASO 2: Scrape descripción completa
      log('  🔍 [2/4] Scrapeando descripción...');
      oferta.descripcion = await scrapeDescripcion(oferta.url, browser);

      // PASO 3: Analizar
      log('  🧠 [3/4] Analizando compatibilidad...');
      const analisis = await analizarOferta(oferta, cvBase);
      log(`       Score: ${analisis.score}/100 | ${analisis.nivel_requerido} | ${analisis.razon_corta}`);
      log(`       Match: [${(analisis.skills_match||[]).join(', ')}]`);
      if ((analisis.skills_gap||[]).length > 0) log(`       Gap:   [${analisis.skills_gap.join(', ')}]`);

      const registro = {
        oferta_id: oferta.id,
        url: oferta.url,
        titulo: oferta.titulo,
        empresa: oferta.empresa,
        lugar: oferta.lugar || '',
        fecha: new Date().toISOString(),
        loop,
        analisis,
        estado: 'analizado',
        cv_path: null,
      };

      // PASO 4: Tailoring + Apply si score >= MIN_SCORE
      if (analisis.score >= MIN_SCORE && analisis.recomendar) {
        log(`  ✂️  [4/4] Tailoring CV (score ${analisis.score} ≥ ${MIN_SCORE})...`);
        try {
          const cvTailored = await tailorCV(oferta, analisis, cvBase);
          const slug = oferta.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 35);
          const cvPath = path.join(CV_OUT, `cv_${slug}_loop${loop}.md`);
          fs.writeFileSync(cvPath, cvTailored, 'utf8');
          registro.cv_path = cvPath;
          log(`       CV guardado: ${path.basename(cvPath)}`);

          // Aplicar
          log('  🚀  Aplicando...');
          const resultado = await aplicar(oferta, browser);
          registro.estado = resultado.exito ? 'aplicado' : `error_apply: ${resultado.razon}`;
          registro.screenshot = resultado.screenshot;

          if (resultado.exito) {
            yaAplicadas.add(oferta.id);
            log(`       ✅ APLICADO`);
            await sendTelegram(`✅ <b>Aplicación enviada</b>\n${oferta.titulo} — ${oferta.empresa}\nScore: ${analisis.score}/100\n<a href="${oferta.url}">Ver oferta</a>`);
          } else {
            log(`       ⚠ No confirmado: ${resultado.razon}`);
          }
        } catch (e) {
          log(`  ⚠ Error tailoring/apply: ${e.message.substring(0, 80)}`);
          registro.estado = 'error: ' + e.message.substring(0, 60);
        }
      } else {
        log(`  ⏭  Descartada (score ${analisis.score} < ${MIN_SCORE} o recomendar=${analisis.recomendar})`);
        registro.estado = 'descartada';
      }

      resultados.push(registro);
      aplicaciones.push(registro);
      fs.writeFileSync(APPLY_LOG, JSON.stringify(aplicaciones, null, 2));
    }

    // Pausa entre loops
    if (loop < LOOPS) {
      log(`\n  ⏸ Pausa 5s entre loops...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await browser.close();

  // RESUMEN FINAL
  const aplicadas  = resultados.filter(r => r.estado === 'aplicado');
  const analizadas = resultados.filter(r => r.analisis);
  const descartadas = resultados.filter(r => r.estado === 'descartada');

  log('\n═══════════════════════════════════════════════════');
  log('📊 RESUMEN FINAL');
  log('═══════════════════════════════════════════════════');
  log(`Total analizadas: ${analizadas.length}`);
  log(`✅ Aplicadas:     ${aplicadas.length}`);
  log(`⏭ Descartadas:   ${descartadas.length}`);
  log('\nTop ofertas por score:');
  resultados
    .filter(r => r.analisis)
    .sort((a, b) => (b.analisis.score||0) - (a.analisis.score||0))
    .slice(0, 8)
    .forEach(r => {
      const icon = r.estado === 'aplicado' ? '✅' : r.estado === 'descartada' ? '⏭' : '📋';
      log(`  ${icon} [${r.analisis.score}] ${r.titulo} — ${r.empresa} | ${r.analisis.razon_corta}`);
    });

  const msg = `🎯 <b>Job Loop x${LOOPS} completado</b>
Analizadas: ${analizadas.length} | Aplicadas: ${aplicadas.length}
${aplicadas.map(r => `✅ ${r.titulo} — ${r.empresa}`).join('\n')}`;
  await sendTelegram(msg);

  log('\n✅ Datos en: ' + JOBS_DIR);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
</file>

<file path="scripts/jobs/computrabajo_apply.js">
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../../lib/ai/llm_service');
const { robustLogin } = require('./ct_login_helper');

const BASE_DIR   = path.resolve(__dirname, '..', '..');
const JOBS_DIR   = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE    = path.join(JOBS_DIR, 'cv_base.md');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let AppStore = null;
let LedgerStore = null;
if (USE_SQLITE) {
  AppStore = require('../../runtime/stores/ApplicationStore');
  LedgerStore = require('../../runtime/stores/LedgerStore');
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

const AUTO_MODE = process.argv.includes('--auto');
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const APPROVAL_TIMEOUT_MS = 120_000;

// ─── Login retry guard ──────────────────────────────────────────────
const MAX_LOGIN_FAILS = 3;
let _loginFailCount = 0;

async function loginWithRetry(page, email, pass) {
  for (let attempt = 1; attempt <= MAX_LOGIN_FAILS; attempt++) {
    const ok = await robustLogin(page, email, pass);
    if (ok) {
      _loginFailCount = 0;
      return true;
    }
    _loginFailCount++;
    log(`⚠️ Intento ${attempt}/${MAX_LOGIN_FAILS} de login fallido`);
    if (attempt < MAX_LOGIN_FAILS) {
      await page.waitForTimeout(3000);
    }
  }
  // 3 fallos consecutivos → notificar
  log('❌ 3 intentos de login fallidos. Notificando...');
  try {
    await sendTelegram(`⚠️ <b>Computrabajo: Login fallido</b>\n3 intentos consecutivos de login fallaron.\nPosible causa: selectores desactualizados o credenciales inválidas.\nRevisa y ejecuta: node scripts/jobs/login_ct.js --debug`);
  } catch {}
  throw new Error('Login failed after 3 attempts');
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function ledger(tipo, data) {
  if (USE_SQLITE) LedgerStore.emit(tipo, data);
}

// ─── JSON fallback ─────────────────────────────────────────────
function loadLogJson() {
  try { return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'aplicaciones.json'), 'utf8')); }
  catch { return []; }
}

function saveLogJson(data) {
  fs.writeFileSync(path.join(JOBS_DIR, 'aplicaciones.json'), JSON.stringify(data, null, 2), 'utf8');
}

function loadAplicaciones() {
  if (USE_SQLITE) {
    const apps = AppStore.getAll({ source: 'computrabajo' });
    return apps.map(a => ({
      oferta_id: a.id,
      url: a.url,
      titulo: a.cargo,
      empresa: a.empresa,
      lugar: a.extra_data?.lugar || a.detalles,
      fecha: a.fecha_aplicacion,
      score: a.evaluacion?.score,
      estado: a.estado,
      razon: a.extra_data?.razon,
    }));
  }
  return loadLogJson();
}

function saveAplicacion(registro) {
  if (USE_SQLITE) {
    AppStore.create({
      id: registro.oferta_id,
      source: 'computrabajo',
      empresa: registro.empresa,
      cargo: registro.titulo,
      url: registro.url,
      fecha_aplicacion: registro.fecha,
      estado: registro.estado,
      score: registro.score,
      extra_data: { lugar: registro.lugar, razon: registro.razon, screenshot: registro.screenshot },
      historial: [{ fecha: new Date().toISOString(), evento: `estado_${registro.estado}` }],
    });
    ledger('aplicacion_creada', { oferta_id: registro.oferta_id, empresa: registro.empresa, titulo: registro.titulo, estado: registro.estado });
    return;
  }
  const apps = loadLogJson();
  apps.push(registro);
  saveLogJson(apps);
}

// ─── TELEGRAM ─────────────────────────────────────────────────
async function sendTelegram(text, keyboard = null) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return null;
  const body = { chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return data.result?.message_id;
}

async function waitForApproval(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?timeout=10&allowed_updates=["callback_query"]`);
    const data = await r.json();
    const updates = data.result || [];
    for (const upd of updates) {
      if (upd.callback_query) {
        const cbData = upd.callback_query.data;
        const chatId = upd.callback_query.message?.chat?.id?.toString();
        if (chatId === TELEGRAM_CHAT?.toString()) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: upd.callback_query.id, text: cbData === 'si' ? 'Aplicando...' : 'Saltando' }),
          });
          return cbData === 'si';
        }
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}

// ─── PERFIL MAESTRO DEL CANDIDATO ──────────────────────────────
const PERFIL_JEISER = `
NOMBRE: Jeiser Abraham Gutierrez Torres
CC: 1019156838 | Telefono: +57 304 461 5613 | Email: jeiser270997@gmail.com
UBICACION: Medellin, Antioquia (Barrio Villa Eloisa)
VEHICULO: Tiene vehiculo propio (carro), por lo que no tiene restricciones de movilidad en Medellin y su area metropolitana.
DISPONIBILIDAD HORARIA: Lunes a Viernes (estudia los sabados en CESDE, no puede trabajar los sabados).
ASPIRACION SALARIAL: Salario minimo legal vigente o segun promedio del mercado para el cargo, negociable.
FORMACION:
  - Tecnico en Analisis y Desarrollo de Software (CESDE, Medellin) - En curso 2026
  - Bootcamp QA Automation 28 semanas (Playwright, GitHub Actions, Node.js) - CESDE
  - Bases de Datos y Excel Avanzado - SENA (Zajuna)
EXPERIENCIA:
  1. QA Automation Engineer - Proyecto LifeOS (propio, en produccion): Playwright, Node.js, GitHub Actions, SQLite, integracion APIs REST, CI/CD.
  2. Agente Soporte Nivel 1 (Mesa de Ayuda) - Sitel/Iberia/Amadeus GDS (2021): atencion al usuario, tickets, SLA, sistema GDS.
  3. Auxiliar de Sistemas / Operador CCTV - Coovisocial (2019-2021): monitoreo sistemas de seguridad, diagnostico de fallas, informes de incidentes.
SKILLS TECNICOS: Playwright, Node.js, JavaScript, GitHub Actions, SQLite, APIs REST, Git, Microsoft Office (Excel Avanzado), Windows 10/11, Redes basicas TCP/IP, GDS Amadeus.
IDIOMAS: Espanol nativo, Ingles B1-B2 (lectura tecnica fluida).
`;

// ─── SCORE + DETECTOR DE FIN DE SEMANA (IA) ─────────────────────
async function calcularScore(oferta) {
  const cvBase = fs.existsSync(CV_BASE) ? fs.readFileSync(CV_BASE, 'utf8').substring(0, 800) : '';
  const prompt = `Eres un evaluador de ofertas de trabajo para Colombia. Analiza la siguiente oferta y responde EXCLUSIVAMENTE con un JSON valido.

OFERTA:
Titulo: ${oferta.titulo}
Empresa: ${oferta.empresa}
Lugar: ${oferta.lugar}
Descripcion completa: ${(oferta.cuerpo || oferta.titulo || '').substring(0, 1200)}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

EVALUA:
1. Que tan bien encaja el candidato (0-100).
2. Si la oferta menciona horario de sabados, domingos, fines de semana, turnos rotativos o disponibilidad de 6 dias. Si la descripcion no especifica horario, asume que es Lunes-Viernes.

Responde SOLO con este JSON:
{"score":N,"recomendar":true/false,"requiere_finde":false,"razon":"una frase corta"}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(json);
    if (parsed.requiere_finde) {
      log(`   ⛔ IA detectó horario fin de semana: ${oferta.titulo}`);
      return { score: 0, recomendar: false, razon: 'Requiere trabajo en fin de semana (estudia sabados)' };
    }
    return parsed;
  } catch {
    return { score: 55, recomendar: true, razon: 'Score estimado' };
  }
}

// ─── RESPONDER PREGUNTAS CON IA (CONTEXTUAL) ────────────────────
async function responderPreguntaConIA(pregunta, descripcionOferta) {
  const prompt = `Eres el asistente de Jeiser, un candidato aplicando a una oferta de trabajo en Colombia. 
Responde la siguiente pregunta del formulario de postulacion de forma profesional, concisa y coherente con el perfil del candidato y la descripcion de la oferta. 
Maximo 2 oraciones. Sin saludos. Sin presentaciones. Solo la respuesta directa.

DESCRIPCION DE LA OFERTA:
${(descripcionOferta || '').substring(0, 600)}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

PREGUNTA DEL RECLUTADOR:
${pregunta}

RESPUESTA:`;

  try {
    const res = await askLLM(prompt, [], 0.3);
    return (res.content || '').trim().replace(/^["']|["']$/g, '');
  } catch {
    return 'Si, cumplo con los requisitos del cargo y me encuentro disponible para una entrevista.';
  }
}

// ─── PLAYWRIGHT ────────────────────────────────────────────────
const STATE_PATH = require('node:path').join(__dirname, '..', '..', 'data', 'state', 'computrabajo_state.json');

async function aplicarOferta(browser, ofertaUrl) {
  const ctxOpts = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  };

  // Cargar sesión guardada si existe (login_ct.js)
  if (require('node:fs').existsSync(STATE_PATH)) {
    try {
      const state = JSON.parse(require('node:fs').readFileSync(STATE_PATH, 'utf8'));
      ctxOpts.storageState = state;
      log(`   Sesión cargada desde ${STATE_PATH}`);
    } catch (e) {
      log(`   ⚠ No se pudo cargar sesión: ${e.message}. Haciendo login completo...`);
    }
  }

  const ctx  = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();

  try {
    // Intentar ir directo a la oferta (si hay sesión guardada, no necesita login)
    let loginOk = true;
    try {
      await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch {
      loginOk = false;
    }

    // Si la sesión no sirve o no había, hacer login
    if (!loginOk || page.url().includes('acceso') || page.url().includes('Login')) {
      log(`   Haciendo login en Computrabajo...`);
      await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      
      await loginWithRetry(page, CT_EMAIL, CT_PASS);

      // Guardar sesión para próxima vez
      try {
        const ns = await ctx.storageState();
        require('node:fs').writeFileSync(STATE_PATH, JSON.stringify(ns, null, 2));
        log(`   ✅ Sesión guardada`);
      } catch {}

    } else {
      log(`   Sesión válida, saltando login`);
    }

    log(`   Navegando a oferta: ${ofertaUrl}`);
    await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
    let clicked = false;
    let externalPage = null;

    for (const txt of btnTexts) {
      try {
        const btn = page.locator(`button:has-text("${txt}"), a:has-text("${txt}")`).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Escuchar por si abre una nueva pestaña (link externo)
          const [newPage] = await Promise.all([
            ctx.waitForEvent('page', { timeout: 3500 }).catch(() => null),
            btn.click({ timeout: 3000 })
          ]);
          clicked = true;
          log(`   Click en "${txt}"`);
          if (newPage) externalPage = newPage;
          break;
        }
      } catch {}
    }

    if (!clicked) {
      log('   Boton "Postularme" no encontrado');
      await ctx.close();
      return { exito: false, razon: 'Boton no encontrado' };
    }

    // Deteccion de aplicacion externa (Nueva pestaña)
    if (externalPage) {
      const extUrl = externalPage.url();
      log(`   Detectada redireccion a aplicacion externa en nueva pestaña: ${extUrl}`);
      await ctx.close();
      return { exito: false, razon: 'Aplicacion externa', external_url: extUrl };
    }

    await page.waitForTimeout(3000);

    // Interceptar si nos mando a login DESPUES de hacer clic en aplicar
    if (page.url().includes('acceso') || page.url().includes('Login')) {
      log('   Se requirio login al intentar aplicar. Iniciando sesion...');
      await loginWithRetry(page, CT_EMAIL, CT_PASS);
      try {
        const ns = await ctx.storageState();
        require('node:fs').writeFileSync(STATE_PATH, JSON.stringify(ns, null, 2));
      } catch {}
      log('   Volviendo a la oferta para re-intentar...');
      await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      for (const txt of btnTexts) {
        try {
          const btn = page.locator(`button:has-text("${txt}"), a:has-text("${txt}")`).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await btn.click({ timeout: 3000 });
            log(`   Re-Click en "${txt}"`);
            break;
          }
        } catch {}
      }
      await page.waitForTimeout(3000);
    }

    // Deteccion de aplicacion externa (Misma pestaña)
    if (!page.url().includes('computrabajo.com')) {
      const extUrl = page.url();
      log(`   Detectada redireccion a aplicacion externa: ${extUrl}`);
      await ctx.close();
      return { exito: false, razon: 'Aplicacion externa', external_url: extUrl };
    }

    const tienePreguntas = await page.evaluate(() =>
      document.body.innerText.includes('Preguntas de seleccion') ||
      document.body.innerText.includes('preguntas de seleccion')
    );

    if (tienePreguntas) {
      log('   Detectadas preguntas de seleccion — respondiendo con IA...');
      try {
        await page.locator('label:has-text("Cedula de Ciudadania")').first().click({ timeout: 3000 }).catch(() => {});

        const preguntas = await page.evaluate(() => {
          const result = [];
          document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
            const label = el.closest('div, section')?.querySelector('p, label, h3, span');
            if (label && el.offsetParent !== null) {
              result.push({ tipo: 'texto', pregunta: label.textContent.trim().substring(0, 200), selector: el.id || el.name || null });
            }
          });
          return result;
        });
        log(`   Textareas encontradas: ${preguntas.length}`);

        // Obtener descripción de la oferta para contexto de la IA
        const descripcionOferta = await page.evaluate(() => document.body.innerText.substring(0, 1500));

        for (const p of preguntas.slice(0, 6)) {
          log(`   Pregunta detectada: "${p.pregunta.substring(0, 80)}..."`);

          // La IA lee la pregunta + descripcion de la oferta + perfil de Jeiser → responde coherentemente
          const respuesta = await responderPreguntaConIA(p.pregunta, descripcionOferta);
          log(`   Respuesta IA: "${respuesta.substring(0, 80)}..."`);

          const textareas = await page.locator('textarea:visible, input[type="text"]:visible').all();
          for (const ta of textareas) {
            const isEmpty = (await ta.inputValue().catch(() => '')).trim() === '';
            if (isEmpty) {
              await ta.click().catch(() => {});
              await ta.fill(respuesta, { timeout: 3000 }).catch(() => {});
              break;
            }
          }
          await page.waitForTimeout(400);
        }

        const siLabels = await page.locator('label:has-text("Si"), label:has-text("Si")').all();
        for (const label of siLabels) {
          await label.click({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(150);
        }

        await page.waitForTimeout(800);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(600);

        const btnContinuar = page.locator(
          'button:has-text("Enviar mi HdV"), button:has-text("Enviar mi"), ' +
          'button:has-text("Continuar"), button:has-text("Enviar"), ' +
          'button:has-text("Postularme"), button[type="submit"]'
        ).last();
        await btnContinuar.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        const btnText = await btnContinuar.textContent().catch(() => 'n/a');
        log(`   Clickeando: "${btnText.trim()}"`);
        await btnContinuar.click({ timeout: 5000, force: true }).catch(async () => {
          log('   Click fallo, intentando Enter...');
          await page.keyboard.press('Enter');
        });
        await page.waitForTimeout(5000);
        log(`   URL post-submit: ${page.url()}`);
        log('   Preguntas respondidas y enviadas');

      } catch (e) {
        log(`   Error en preguntas: ${e.message.substring(0, 100)}`);
      }
    }

    const confirmado = await page.evaluate(() => {
      const body = document.body.innerText;
      const url  = window.location.href;
      return body.includes('postulacion') || body.includes('enviada') ||
             body.includes('exito') || body.includes('registrada') ||
             body.includes('Gracias') || body.includes('Gracias por') ||
             body.includes('Tu candidatura') || body.includes('inscripcion') ||
             body.includes('Mis aplicaciones') ||
             url.includes('candidate/kq') ||
             url.includes('candidate/applications') ||
             url.includes('mis-aplicaciones');
    });

    const screenshot = path.join(JOBS_DIR, `apply_${Date.now()}.png`);
    await page.screenshot({ path: screenshot });

    await ctx.close();
    return {
      exito: confirmado,
      razon: confirmado ? 'Postulacion enviada' : 'No se pudo confirmar',
      screenshot
    };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 100) };
  }
}

// ─── MAIN ──────────────────────────────────────────────────────
async function main() {
  log(`COMPUTRABAJO AUTO-APPLY (min-score: ${MIN_SCORE}, modo: ${AUTO_MODE ? 'AUTO' : 'SEMI-AUTO'})`);

  if (!fs.existsSync(path.join(JOBS_DIR, 'computrabajo.json'))) {
    log('No hay datos de Computrabajo. Corre primero: node scripts/computrabajo_scraper.js');
    process.exit(1);
  }

  const { ofertas = [] } = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
  let aplicaciones = loadAplicaciones();
  const yaAplicadas = new Set(aplicaciones.map(a => a.url || a.oferta_id));

  const UBICACIONES_OK = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|work.?from.?home|teletrabajo/i;
  const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa marta/i;

  const candidatas = ofertas.filter(o => {
    if (!o.url || yaAplicadas.has(o.id || o.url)) return false;
    const lugar = (o.lugar || o.ciudad || o.ubicacion || o.titulo || '').toLowerCase();
    const url   = (o.url || '').toLowerCase();
    const texto = lugar + ' ' + url;
    if (UBICACIONES_NOK.test(texto) && !UBICACIONES_OK.test(texto)) return false;
    return true;
  });
  log(`Ofertas candidatas (no aplicadas, ubicacion OK): ${candidatas.length}`);

  const browser = await chromium.launch({ headless: true });

  for (const oferta of candidatas.slice(0, 10)) {
    log(`\nEvaluando: "${oferta.titulo}" — ${oferta.empresa}`);

    const match = await calcularScore(oferta);
    log(`   Score: ${match.score} | ${match.razon}`);

    if (match.score < MIN_SCORE) {
      log(`   Score bajo (${match.score} < ${MIN_SCORE}), saltando`);
      continue;
    }

    let aprobado = AUTO_MODE;

    if (!AUTO_MODE && TELEGRAM_TOKEN) {
      const msg = `🎯 <b>Oferta QA detectada</b> (score: ${match.score}/100)\n\n<b>${oferta.titulo}</b>\n🏢 ${oferta.empresa || 'Empresa'}\n📍 ${oferta.lugar || 'Colombia'}\n\n<i>${match.razon}</i>\n\nAplicar automaticamente?`;

      await sendTelegram(msg, [
        [{ text: 'Si, aplicar', callback_data: 'si' }, { text: 'Saltar', callback_data: 'no' }]
      ]);

      log(`   Esperando aprobacion Telegram (${APPROVAL_TIMEOUT_MS/1000}s)...`);
      const resp = await waitForApproval(APPROVAL_TIMEOUT_MS);

      if (resp === null) {
        log('   Timeout — saltando');
        continue;
      }
      aprobado = resp;
    }

    if (!aprobado) {
      log('   Rechazado por usuario');
      saveAplicacion({
        oferta_id: oferta.id,
        url: oferta.url,
        titulo: oferta.titulo,
        empresa: oferta.empresa,
        lugar: oferta.lugar,
        fecha: new Date().toISOString(),
        estado: 'rechazado_usuario',
        score: match.score,
      });
      ledger('aplicacion_rechazada', { oferta_id: oferta.id, empresa: oferta.empresa, titulo: oferta.titulo, score: match.score });
      continue;
    }

    log(`   Aplicando a "${oferta.titulo}"...`);
    const resultado = await aplicarOferta(browser, oferta.url);

    const registro = {
      oferta_id: oferta.id,
      url: oferta.url,
      titulo: oferta.titulo,
      empresa: oferta.empresa,
      lugar: oferta.lugar,
      fecha: new Date().toISOString(),
      score: match.score,
      estado: resultado.exito ? 'aplicado' : 'error',
      razon: resultado.razon,
      screenshot: resultado.screenshot,
    };

    saveAplicacion(registro);
    ledger('aplicacion_' + (resultado.exito ? 'enviada' : 'fallida'), { ...registro });

    if (resultado.external_url) {
      log(`   EXTERNA: ${oferta.titulo} requiere aplicacion manual`);
      await sendTelegram(`⚠️ <b>Aplicacion Externa Detectada</b>\n${oferta.titulo} — ${oferta.empresa}\nLa empresa requiere aplicar en su propio portal. Hazlo tu mismo aqui:\n<a href="${resultado.external_url}">Abrir portal externo</a>`);
    } else if (resultado.exito) {
      log(`   APLICADO: ${oferta.titulo} en ${oferta.empresa}`);
      await sendTelegram(`✅ <b>Aplicacion enviada</b>\n${oferta.titulo} — ${oferta.empresa}\n<a href="${oferta.url}">Ver oferta</a>`);
    } else {
      log(`   Error aplicando: ${resultado.razon}`);
    }

    const delayMs = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
    log(`   Pausa de seguridad anti-bot de ${delayMs/1000}s...`);
    await new Promise(r => setTimeout(r, delayMs));
  }

  await browser.close();

  const nuevasAplicadas = USE_SQLITE
    ? AppStore.getAll({ source: 'computrabajo', estado: 'aplicado' })
    : loadLogJson().filter(a => a.estado === 'aplicado');
  log(`Sesion completada. Total aplicaciones: ${nuevasAplicadas.length}`);
  if (nuevasAplicadas.length > 0) {
    await sendTelegram(
      `📊 <b>Resumen Auto-Apply</b>\n${nuevasAplicadas.slice(-5).map(a => `✅ ${a.titulo} — ${a.empresa}`).join('\n')}`
    );
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
</file>

</files>
