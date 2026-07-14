/**
 * lib/ai/litellm_client.js — LiteLLM Proxy Client para LifeOS
 *
 * Cliente LLM unificado usando OpenAI SDK nativo.
 * Prioriza conexión al proxy local LiteLLM; si no está disponible,
 * cae automáticamente a OpenRouter, Groq o Freebuff (fallback directo).
 */

const OpenAI = require('openai');
const LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';

async function probeLiteLLM(timeout = 1000) {
  if (process.env.GITHUB_ACTIONS) return false;
  try {
    const res = await fetch(`${LITELLM_URL}/health/liveliness`, {
      signal: AbortSignal.timeout(timeout),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function createLLM() {
  const ok = await probeLiteLLM();
  if (ok) {
    console.log(`[LLM] Conectando a LiteLLM Proxy local (${LITELLM_URL})`);
    const client = new OpenAI({
      apiKey: 'litellm-proxy',
      baseURL: `${LITELLM_URL}/v1`,
    });
    client._model = 'smart-router';
    return client;
  }

  // Fallback directo liviano si el proxy está apagado (ej. en CI)
  if (process.env.OPENROUTER_API_KEY) {
    console.log('[LLM] Fallback directo a OpenRouter');
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos',
        'X-Title': 'LifeOS',
      },
    });
    client._model = 'google/gemini-2.5-flash';
    return client;
  }

  if (process.env.GROQ_API_KEY) {
    console.log('[LLM] Fallback directo a Groq');
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    client._model = 'llama-3.3-70b-versatile';
    return client;
  }

  if (process.env.FREEBUFF_API_KEY) {
    console.log('[LLM] Fallback directo a Freebuff');
    const client = new OpenAI({
      apiKey: process.env.FREEBUFF_API_KEY,
      baseURL: process.env.FREEBUFF_URL || 'https://api.freebuff.net/v1',
    });
    client._model = 'deepseek-v4-flash';
    return client;
  }

  throw new Error('No hay LiteLLM activo ni claves de API para fallback directo (OPENROUTER_API_KEY, GROQ_API_KEY, FREEBUFF_API_KEY)');
}

module.exports = { createLLM, probeLiteLLM, LITELLM_URL };
