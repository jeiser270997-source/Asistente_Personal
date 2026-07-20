/**
 * lib/ai/litellm_client.js — Cliente LLM unificado para LifeOS
 *
 * Orden de prioridad:
 *  1. OmniRoute local (http://localhost:20128) — gateway free-tier + auto-fallback
 *  2. LiteLLM local (legacy, :4000)
 *  3. Proveedores directos (Groq, OpenRouter, etc.) si OmniRoute no está
 *
 * OmniRoute: https://github.com/diegosouzapw/OmniRoute
 * Modelos útiles: auto/cheap | auto/best-free | auto/coding | auto/fast
 */

const OpenAI = require('openai');

const OMNIROUTE_URL = (process.env.OMNIROUTE_URL || 'http://localhost:20128').replace(/\/$/, '');
const OMNIROUTE_KEY = process.env.OMNIROUTE_API_KEY || process.env.OMNIROUTE_KEY || 'omniroute';
const OMNIROUTE_MODEL = process.env.OMNIROUTE_MODEL || 'auto/cheap';
const OMNIROUTE_MODEL_CODING = process.env.OMNIROUTE_MODEL_CODING || 'auto/coding';
const LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';

const probeCache = {
  omni: { t: 0, ok: false },
  lite: { t: 0, ok: false },
};
const PROBE_TTL_MS = 60_000; // 1 min — OmniRoute puede levantarse tras sleep

async function probeUrl(url, timeout = 1500) {
  if (process.env.GITHUB_ACTIONS) return false;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    return res.ok || res.status === 401 || res.status === 404;
  } catch {
    return false;
  }
}

async function probeOmniRoute() {
  const now = Date.now();
  if (now - probeCache.omni.t < PROBE_TTL_MS) return probeCache.omni.ok;
  // /v1/models es pesado (~1k modelos); /health o root bastan
  const ok =
    (await probeUrl(`${OMNIROUTE_URL}/health`, 1200)) ||
    (await probeUrl(`${OMNIROUTE_URL}/v1/models`, 2500));
  probeCache.omni = { t: now, ok };
  return ok;
}

async function probeLiteLLM() {
  const now = Date.now();
  if (now - probeCache.lite.t < PROBE_TTL_MS) return probeCache.lite.ok;
  const ok = await probeUrl(`${LITELLM_URL}/health/liveliness`, 1000);
  probeCache.lite = { t: now, ok };
  return ok;
}

/**
 * @param {boolean} sensitive - PII: no cloud directo. OmniRoute local OK solo si OMNIROUTE_ALLOW_SENSITIVE=true
 *   (sigue pudiendo reenviar a free tiers remotos — por defecto false).
 */
async function getLLMClients(sensitive = false) {
  const clients = [];

  // ── 1. OmniRoute (gateway local, APIs free ya configuradas ahí) ──
  if (await probeOmniRoute()) {
    const allowSensitive = process.env.OMNIROUTE_ALLOW_SENSITIVE === 'true';
    if (!sensitive || allowSensitive) {
      console.log(`[LLM] OmniRoute → ${OMNIROUTE_URL} model=${OMNIROUTE_MODEL}`);
      const c = new OpenAI({
        apiKey: OMNIROUTE_KEY,
        baseURL: `${OMNIROUTE_URL}/v1`,
        timeout: 120_000,
      });
      c._model = OMNIROUTE_MODEL;
      c._provider = 'omniroute';
      clients.push(c);

      // Segundo cliente coding si el modelo default no es coding
      if (OMNIROUTE_MODEL_CODING && OMNIROUTE_MODEL_CODING !== OMNIROUTE_MODEL) {
        const c2 = new OpenAI({
          apiKey: OMNIROUTE_KEY,
          baseURL: `${OMNIROUTE_URL}/v1`,
          timeout: 120_000,
        });
        c2._model = OMNIROUTE_MODEL_CODING;
        c2._provider = 'omniroute';
        clients.push(c2);
      }
    } else {
      console.log('[LLM] OmniRoute disponible pero sensitive=true y OMNIROUTE_ALLOW_SENSITIVE!=true — omitido');
    }
  }

  // ── 2. LiteLLM legacy ──
  if (await probeLiteLLM()) {
    console.log(`[LLM] LiteLLM → ${LITELLM_URL}`);
    const c = new OpenAI({ apiKey: 'litellm-proxy', baseURL: `${LITELLM_URL}/v1` });
    c._model = 'smart-router';
    c._provider = 'litellm';
    clients.push(c);
  }

  // ── 3. Directos solo si no hay gateway (evita doble gasto de free-tier) ──
  const skipDirect = process.env.LLM_SKIP_DIRECT === 'true' || clients.some((x) => x._provider === 'omniroute');

  if (!skipDirect) {
    if (process.env.GROQ_API_KEY) {
      const c = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
      c._model = 'llama-3.3-70b-versatile';
      c._provider = 'groq';
      clients.push(c);
    }
    if (process.env.SAMBANOVA_API_KEY) {
      const c = new OpenAI({ apiKey: process.env.SAMBANOVA_API_KEY, baseURL: 'https://api.sambanova.ai/v1' });
      c._model = 'Meta-Llama-3.1-70B-Instruct';
      c._provider = 'sambanova';
      clients.push(c);
    }
    if (process.env.OPENROUTER_API_KEY) {
      const c = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos', 'X-Title': 'LifeOS' },
      });
      c._model = 'google/gemini-2.5-flash';
      c._provider = 'openrouter';
      clients.push(c);
    }
    if (process.env.CEREBRAS_API_KEY) {
      const c = new OpenAI({ apiKey: process.env.CEREBRAS_API_KEY, baseURL: 'https://api.cerebras.ai/v1' });
      c._model = 'llama3.1-8b';
      c._provider = 'cerebras';
      clients.push(c);
    }
    if (process.env.GOOGLE_API_KEY) {
      const c = new OpenAI({
        apiKey: process.env.GOOGLE_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      });
      c._model = 'gemini-2.5-flash';
      c._provider = 'google';
      clients.push(c);
    }
  }

  if (sensitive) {
    // Solo proxies locales explícitos; OmniRoute solo si allow sensitive
    const local = clients.filter(
      (c) => c._provider === 'litellm' || (c._provider === 'omniroute' && process.env.OMNIROUTE_ALLOW_SENSITIVE === 'true')
    );
    if (local.length === 0) {
      throw new Error(
        '[SENSITIVE] Sin proxy local seguro. Correo default no usa LLM. Para forzar: OMNIROUTE_ALLOW_SENSITIVE=true (sigue yendo a free tiers remotos).'
      );
    }
    return local;
  }

  if (clients.length === 0) {
    throw new Error(
      'No hay LLM. Arranca OmniRoute (localhost:20128) o configura keys en .env. El wake 5am no necesita LLM.'
    );
  }

  return clients;
}

async function omniRouteHealth() {
  const ok = await probeOmniRoute();
  return {
    ok,
    url: OMNIROUTE_URL,
    model: OMNIROUTE_MODEL,
    appData: process.env.APPDATA ? `${process.env.APPDATA}\\omniroute` : null,
  };
}

module.exports = {
  getLLMClients,
  probeLiteLLM,
  probeOmniRoute,
  omniRouteHealth,
  LITELLM_URL,
  OMNIROUTE_URL,
  OMNIROUTE_MODEL,
};
