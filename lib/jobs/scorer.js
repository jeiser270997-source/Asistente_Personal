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
const { recordRun } = require('./metrics/applicationMetrics');

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

  // Registrar para feedback loop
  recordRun({
    jobId: job.sourceId || job.url,
    company: job.company,
    title: job.title,
    totalScore: breakdown.total,
    breakdown: { ...breakdown },
    decision: decision.action,
    executionTimeMs: elapsed,
    modelUsed: metrics.modelUsed,
    tokensConsumed: metrics.tokensConsumed,
  });

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
