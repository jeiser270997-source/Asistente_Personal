/**
 * Scorer — v2
 *
 * Evalúa una oferta contra el perfil del candidato.
 * 70% reglas determinísticas, 30% LLM.
 *
 * Cada ejecución genera métricas. Sin métricas no hay mejora.
 */

const { readJSON } = require('../data/reader');
const { PATHS } = require('../data/paths');
const { createEmpty } = require('./types/ScoreBreakdown');
let bus;
try { bus = require('../events/event_bus'); } catch { bus = null; }
const { askLLM } = require('../ai/llm_service');

/**
 * @param {Object} job        - JobPosting normalizado
 * @param {Object} profile    - CandidateProfile
 * @param {Object} [options]
 * @param {boolean} [options.useLLM=false] - Si true, incluye evaluación LLM
 * @param {string}  [options.model]        - Modelo LLM a usar
 * @returns {Object} { score: ScoreBreakdown, decision: string, ev: Object, metrics: Object }
 */
async function score(job, profile, options = {}) {
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

  // ── 30% LLM ──
  let tokensConsumed = 0;
  let llmFailed = false;
  if (options.useLLM) {
    const llmResult = await _scoreLLM(job, profile, weights.weights.llmAlignment);
    llmFailed = llmResult.failed;
    breakdown.llmAlignment = llmResult.score;
    breakdown.strengths = llmResult.strengths;
    breakdown.weaknesses = llmResult.weaknesses;
    breakdown.redFlags = llmResult.redFlags;
    breakdown.reasoning = llmResult.reasoning;
    tokensConsumed = llmResult.tokensConsumed;
  }

  // ── Total ──
  const deterministicTotal = breakdown.skills + breakdown.seniority + breakdown.salary
    + breakdown.location + breakdown.english + breakdown.company + breakdown.growth;
  breakdown.total = deterministicTotal + breakdown.llmAlignment;

  // ── Fail-closed: if LLM failed, mark scoring_status as 'failed' to block auto-apply ──
  if (llmFailed) {
    breakdown.scoring_status = 'failed';
    breakdown.total = 0; // Force skip — no aplicar basura
    console.warn('[scorer] ⛔ LLM failed — score forced to 0, scoring_status=failed');
  } else {
    breakdown.scoring_status = 'ok';
  }

  // ── Decisión ──
  const decision = _decide(breakdown.total, weights.thresholds);

  // ── Expected Value ──
  const ev = _calculateEV(breakdown.total, job, weights);

  // ── Métricas ──
  const elapsed = Date.now() - start;
  const metrics = {
    executionTimeMs: elapsed,
    modelUsed: options.useLLM ? (options.model || 'llm') : 'deterministico',
    tokensConsumed,
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
        tokensConsumed,
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

// ── LLM Alignment ──
async function _scoreLLM(job, profile, maxWeight) {
  const LLM_PROMPT = `Eres un reclutador experto evaluando el fit entre un candidato y una oferta laboral.

Responde SOLO con JSON válido:
{
  "alignmentScore": <0-10>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "redFlags": ["..."],
  "reasoning": "explicación breve"
}

Criterios:
- 0-3: Mal fit (skills no relacionadas, seniority muy lejano)
- 4-6: Fit medio (skills parciales, requiere crecimiento)
- 7-8: Buen fit (mayoría de skills, seniority cercano)
- 9-10: Excelente fit (skills exactas, seniority ideal)

Sé crítico. No infles scores.`;

  const input = {
    cargo: job.title,
    empresa: job.company,
    requisitos: job.requirements || [],
    modalidad: job.modality,
    salario: { min: job.salaryMin, max: job.salaryMax },
    requiereIngles: job.requiresEnglish,
    perfilSkills: profile.skills || [],
    perfilSeniority: profile.seniority,
    perfilIdiomas: profile.languages || [],
    preferencias: profile.preferences || {},
  };

  try {
    const res = await askLLM(LLM_PROMPT, [
      { role: 'user', content: JSON.stringify(input, null, 2) }
    ], 0.1);

    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback si el LLM no devuelve JSON válido — fail-closed
      return { score: 0, strengths: [], weaknesses: [], redFlags: ['LLM response unparseable'], reasoning: 'Error parseando respuesta LLM', tokensConsumed: 0, failed: true };
    }

    const score = Math.round((Math.max(0, Math.min(10, parsed.alignmentScore || 5)) / 10) * maxWeight);
    const tokensConsumed = res.usage?.total_tokens || 0;

    return {
      score,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      redFlags: parsed.redFlags || [],
      reasoning: parsed.reasoning || '',
      tokensConsumed,
    };
  } catch (e) {
    console.warn(`[scorer] ⛔ LLM error: ${e.message} — fail-closed, score=0`);
    return { score: 0, strengths: [], weaknesses: [], redFlags: ['LLM no disponible, skip'], reasoning: `LLM no disponible: ${e.message}`, tokensConsumed: 0, failed: true };
  }
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
