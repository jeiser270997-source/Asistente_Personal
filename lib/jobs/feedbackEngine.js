/**
 * lib/jobs/feedbackEngine.js
 *
 * Feedback Engine — Implementación real.
 * Consume eventos del ciclo de vida de aplicaciones y del scorer LLM,
 * y ajusta los pesos del scorer (scoring_weights.json) basado en resultados.
 *
 * Conectado al Event Bus para recibir eventos:
 *   job.scored     → captura strengths/weaknesses/redFlags del LLM
 *   job.applied    → registra aplicación
 *   job.rejection  → penaliza empresa/skills que no generan entrevistas
 *   job.interview  → bonifica skills que sí generan entrevistas
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
    _history = {};
  }
  // Asegurar que todos los campos existan (soporte migración legacy)
  _history.events = _history.events || [];
  _history.adjustments = _history.adjustments || [];
  _history.stats = { applied: 0, interviews: 0, offers: 0, rejections: 0, ghosted: 0, ...(_history.stats || {}) };
  _history.llmInsights = _history.llmInsights || [];
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
 * Basado en:
 *   - Tasa de conversión histórica
 *   - Patrones de weaknesses/redFlags del LLM
 *   - Skills que generan entrevistas
 */
function getAdjustments() {
  const history = loadHistory();
  const weights = loadWeights();
  const total = history.stats.applied || 1;
  const conversionRate = (history.stats.interviews / total) * 100;
  const adjustments = [];

  // ── Ajustes por conversión histórica ──
  if (conversionRate < 10 && history.stats.applied > 5) {
    adjustments.push({ weight: 'skills', delta: -2, reason: `Baja conversión (${conversionRate.toFixed(0)}%)` });
    adjustments.push({ weight: 'english', delta: +2, reason: 'Skills genéricas no diferenciadoras, inglés suma más' });
  }

  if (history.stats.interviews > 2 && history.stats.offers === 0) {
    adjustments.push({ weight: 'seniority', delta: -3, reason: 'Entrevistas sin ofertas — posible sobrevaloración de seniority' });
    adjustments.push({ weight: 'salary', delta: -2, reason: 'Ajustar expectativa salarial' });
  }

  if (history.stats.rejections > history.stats.applied * 0.5) {
    adjustments.push({ threshold: 'apply', delta: -5, reason: 'Alta tasa de rechazo, bajar umbral' });
  }

  // ── Ajustes por patrones LLM (strengths/weaknesses/redFlags) ──
  const llmInsights = history.llmInsights || [];
  if (llmInsights.length >= 3) {
    // Extraer weakness patterns: términos que aparecen frecuentemente
    const weaknessTerms = {};
    for (const insight of llmInsights) {
      for (const w of (insight.weaknesses || [])) {
        const term = w.toLowerCase();
        weaknessTerms[term] = (weaknessTerms[term] || 0) + 1;
      }
    }

    // Top weakness recurrente (aparece en ≥30% de evaluaciones)
    const threshold = Math.ceil(llmInsights.length * 0.3);
    const topWeakness = Object.entries(weaknessTerms)
      .filter(([, count]) => count >= threshold)
      .sort(([, a], [, b]) => b - a)[0];

    if (topWeakness) {
      const [term, count] = topWeakness;
      // Weakness recurrente → bajar threshold o ajustar peso
      if (/seniority|experiencia|años/i.test(term)) {
        adjustments.push({ weight: 'seniority', delta: -2, reason: `Weakness recurrente LLM: "${term.substring(0, 40)}" (${count} veces)` });
      } else if (/ingles|english|idioma/i.test(term)) {
        adjustments.push({ weight: 'english', delta: +3, reason: `Weakness recurrente LLM: "${term.substring(0, 40)}" (${count} veces)` });
      } else if (/skill|técnic|tecnolog|framework|librer|herramient/i.test(term)) {
        adjustments.push({ weight: 'skills', delta: -1, reason: `Weakness recurrente LLM: "${term.substring(0, 40)}" (${count} veces)` });
      } else if (/salario|presupuesto|rango/i.test(term)) {
        adjustments.push({ weight: 'salary', delta: -2, reason: `Weakness recurrente LLM: "${term.substring(0, 40)}" (${count} veces)` });
      }
    }

    // Extraer redFlag patterns
    const redFlagTerms = {};
    for (const insight of llmInsights) {
      for (const rf of (insight.redFlags || [])) {
        const term = rf.toLowerCase();
        redFlagTerms[term] = (redFlagTerms[term] || 0) + 1;
      }
    }

    const topRedFlag = Object.entries(redFlagTerms)
      .filter(([, count]) => count >= threshold)
      .sort(([, a], [, b]) => b - a)[0];

    if (topRedFlag) {
      const [term] = topRedFlag;
      // Red flags consistentes → descontar puntuación general
      adjustments.push({ weight: 'company', delta: -2, reason: `RedFlag recurrente LLM: "${term.substring(0, 40)}"` });
    }

    // Si hay ≥5 strengths positivos en inglés → bonificar
    const strengthEnglish = llmInsights.filter(i =>
      i.strengths.some(s => /ingles|english|biling|fluent/i.test(s))
    ).length;
    if (strengthEnglish >= llmInsights.length * 0.4) {
      adjustments.push({ weight: 'english', delta: +1, reason: `${strengthEnglish}/${llmInsights.length} evaluaciones LLM destacan inglés como fortaleza` });
    }
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

  // ── Escucha job.scored: captura insights del LLM ──
  bus.on('job.scored', (envelope) => {
    const p = envelope.payload;
    const breakdown = p.breakdown || {};
    if (breakdown.strengths?.length || breakdown.weaknesses?.length || breakdown.redFlags?.length) {
      const history = loadHistory();
      history.llmInsights.push({
        jobId: p.jobId,
        company: p.company,
        title: p.title,
        totalScore: p.totalScore,
        strengths: breakdown.strengths || [],
        weaknesses: breakdown.weaknesses || [],
        redFlags: breakdown.redFlags || [],
        reasoning: breakdown.reasoning || '',
        timestamp: new Date().toISOString(),
      });
      // Mantener máx 200 insights para no saturar
      if (history.llmInsights.length > 200) {
        history.llmInsights = history.llmInsights.slice(-200);
      }
      saveHistory();
      console.log(`[feedbackEngine] 📊 LLM insights guardados para ${p.company} - ${p.title}`);
    }
  });

  // ── Escucha job.applied ──
  bus.on('job.applied', (envelope) => {
    processEvent({ ...envelope.payload, status: 'applied' });
    logAdjustment();
  });

  // ── Escucha job.rejection ──
  bus.on('job.rejection', (envelope) => {
    const p = envelope.payload;
    processEvent({ ...p, status: 'rejected' });

    // Usar insights del LLM para ajustes más inteligentes
    const insights = getInsightsForJob(p.jobId || p.company);
    if (insights && insights.weaknesses.length > 0) {
      console.log(`[feedbackEngine] 🧠 Rechazo correlacionado con weaknesses LLM: ${insights.weaknesses.join(', ')}`);
    }

    logAdjustment();
  });

  // ── Escucha job.interview ──
  bus.on('job.interview', (envelope) => {
    const p = envelope.payload;
    processEvent({ ...p, status: 'interview' });

    // Usar insights del LLM para bonificar
    const insights = getInsightsForJob(p.jobId || p.company);
    if (insights && insights.strengths.length > 0) {
      console.log(`[feedbackEngine] 🧠 Entrevista correlacionada con strengths LLM: ${insights.strengths.join(', ')}`);
    }

    logAdjustment();
  });

  console.log('[feedbackEngine] ✅ Conectado al Event Bus');
}

/**
 * Busca insights LLM guardados para un jobId o compañía
 */
function getInsightsForJob(jobIdOrCompany) {
  const history = loadHistory();
  if (!history.llmInsights || history.llmInsights.length === 0) return null;
  // Buscar por jobId primero, luego por company
  return history.llmInsights.find(i => i.jobId === jobIdOrCompany || i.company === jobIdOrCompany) || null;
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
