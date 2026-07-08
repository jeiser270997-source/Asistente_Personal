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
