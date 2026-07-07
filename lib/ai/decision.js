/**
 * lib/ai/decision.js — Centralized AI Decision Layer
 *
 * Único punto de entrada para toda la IA del sistema.
 * Cada tipo de decisión tiene:
 *   - Un prompt estructurado (desde prompts.js)
 *   - Un parser de salida específico
 *   - Fallback sin LLM cuando aplica
 *
 * Uso:
 *   const { decide } = require('./lib/ai/decision');
 *   const result = await decide('job_match', { job: {...}, profile: {...} });
 *   // → { score: 75, recomendar: true, ... }
 */
const { askLLM } = require('../ai/llm_service');
const { get: getPrompt } = require('./prompts');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

// ── Metrics ──

const metrics = { calls: 0, tokens: 0, errors: 0, byType: {} };

// ── Deciders ──

async function decide(type, input) {
  metrics.calls++;
  metrics.byType[type] = (metrics.byType[type] || 0) + 1;

  const prompt = getPrompt(type);
  if (!prompt) return { error: `unknown decision type: ${type}` };

  // Build full prompt with context
  const fullPrompt = `${prompt}\n\nDATOS:\n${JSON.stringify(input, null, 2)}`;

  try {
    const res = await askLLM(fullPrompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    metrics.tokens += (res.usage?.total_tokens || 0);
    return parsed;
  } catch (e) {
    metrics.errors++;
    // Fallback sin LLM
    return fallback(type, input, e.message);
  }
}

// ── Fallbacks (sin LLM) ──

function fallback(type, input, error) {
  console.warn(`[decision] Fallback for ${type}: ${error}`);

  switch (type) {
    case 'job_match':
      return { score: 50, recomendar: true, match_skills: [], gap_skills: [], razon: 'Evaluacion sin IA' };

    case 'decision':
      return { decisiones: [], resumen: 'Sin decisiones (fallback sin IA)' };

    case 'context_analysis':
      return { cambios: [], resumen: 'Analisis no disponible (fallback)' };

    case 'email_summary':
      return (input.emails || []).map(e => ({
        from: e.from || '?',
        subject: e.subject || '?',
        summary: '(resumen no disponible)',
      }));

    default:
      return { error: `LLM error: ${error}` };
  }
}

// ── Helpers ──

function getMetrics() {
  return { ...metrics };
}

module.exports = { decide, getMetrics };
