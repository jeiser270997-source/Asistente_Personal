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
