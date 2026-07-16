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

async function getLLMClients() {
  const clients = [];
  
  // 1. LiteLLM Proxy (Local)
  if (await probeLiteLLM()) {
    console.log(`[LLM] Añadido LiteLLM Proxy local (${LITELLM_URL})`);
    const c = new OpenAI({ apiKey: 'litellm-proxy', baseURL: `${LITELLM_URL}/v1` });
    c._model = 'smart-router';
    clients.push(c);
  }

  // 2. Groq (Rápido, Llama 3)
  if (process.env.GROQ_API_KEY) {
    const c = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
    c._model = 'llama-3.3-70b-versatile';
    clients.push(c);
  }

  // 3. SambaNova (Rápido, Llama 3.1)
  if (process.env.SAMBANOVA_API_KEY) {
    const c = new OpenAI({ apiKey: process.env.SAMBANOVA_API_KEY, baseURL: 'https://api.sambanova.ai/v1' });
    c._model = 'Meta-Llama-3.1-70B-Instruct';
    clients.push(c);
  }

  // 4. OpenRouter (Contexto largo, Gemini Flash)
  if (process.env.OPENROUTER_API_KEY) {
    const c = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos', 'X-Title': 'LifeOS' },
    });
    c._model = 'google/gemini-2.5-flash';
    clients.push(c);
  }

  // 5. Cerebras (Rápido pero limitado a 2k tokens)
  if (process.env.CEREBRAS_API_KEY) {
    const c = new OpenAI({ apiKey: process.env.CEREBRAS_API_KEY, baseURL: 'https://api.cerebras.ai/v1' });
    c._model = 'llama3.1-8b';
    clients.push(c);
  }

  // 6. Gemini Direct API (Native)
  if (process.env.GOOGLE_API_KEY) {
    const c = new OpenAI({ apiKey: process.env.GOOGLE_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai' });
    c._model = 'gemini-2.5-flash';
    clients.push(c);
  }

  if (clients.length === 0) {
    throw new Error('No hay proveedores LLM activos ni configurados en .env');
  }

  return clients;
}

module.exports = { getLLMClients, probeLiteLLM, LITELLM_URL };
