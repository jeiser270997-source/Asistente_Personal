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
