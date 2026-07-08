/**
 * lib/ai/litellm_client.js — LiteLLM Proxy Client para LifeOS
 *
 * Cliente compartido entre llm_service.js y frontal_langchain.js.
 * Intenta conectar al proxy local LiteLLM; si no está disponible,
 * cae automáticamente a la API directa de DeepSeek.
 *
 * Variables de entorno:
 *   LITELLM_URL     — URL del proxy (default: http://localhost:4000)
 *   DEEPSEEK_API_KEY — API key para fallback directo
 */

const { ChatOpenAI } = require('@langchain/openai');
const LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';

/**
 * Sondea si LiteLLM está disponible vía health endpoint.
 */
async function probeLiteLLM(timeout = 2000) {
  try {
    const res = await fetch(`${LITELLM_URL}/health/liveliness`, {
      signal: AbortSignal.timeout(timeout),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Crea un ChatOpenAI apuntando al proxy LiteLLM.
 */
function buildLiteLLM(temperature = 0.1, maxTokens = 2000) {
  return new ChatOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'litellm-proxy',
    configuration: { baseURL: `${LITELLM_URL}/v1` },
    model: 'smart-router',
    temperature,
    maxTokens,
  });
}

/**
 * Crea un ChatOpenAI apuntando directo a DeepSeek.
 */
function buildDirect(temperature = 0.1, maxTokens = 2000) {
  return new ChatOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: { baseURL: 'https://api.deepseek.com/v1' },
    model: 'deepseek-v4-flash',
    temperature,
    maxTokens,
  });
}

/**
 * Crea un LLM con detección automática:
 *   1. Intenta LiteLLM proxy (async health check)
 *   2. Si no disponible → directo a DeepSeek
 *   3. Si no hay API key → null
 */
async function createLLM({ temperature = 0.1, maxTokens = 2000 } = {}) {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('[LiteLLM] Sin DEEPSEEK_API_KEY');
    return null;
  }

  const ok = await probeLiteLLM();
  if (ok) {
    console.log(`[LiteLLM] Proxy activo → ${LITELLM_URL}/v1 (smart-router)`);
    return buildLiteLLM(temperature, maxTokens);
  }

  console.warn('[LiteLLM] No disponible. Conectando directo a DeepSeek.');
  return buildDirect(temperature, maxTokens);
}

module.exports = { createLLM, probeLiteLLM, buildLiteLLM, buildDirect, LITELLM_URL };
