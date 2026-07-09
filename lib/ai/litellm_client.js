/**
 * lib/ai/litellm_client.js — LiteLLM Proxy Client para LifeOS
 *
 * Cliente LLM unificado con dos modos:
 *   createLLM()         → OpenAI SDK client (para uso general, sin LangChain)
 *   createLangChainLLM() → ChatOpenAI (solo para LangGraph/frontal_langchain.js)
 *
 * Intenta conectar al proxy local LiteLLM; si no está disponible,
 * cae automáticamente a OpenRouter API, luego Groq.
 *
 * Variables de entorno:
 *   LITELLM_URL       — URL del proxy (default: http://localhost:4000)
 *   OPENROUTER_API_KEY — API key para OpenRouter (fallback)
 *   GROQ_API_KEY      — API key para Groq (segundo fallback)
 *
 * Migrado de LangChain ChatOpenAI → OpenAI SDK nativo — Jul 2026.
 */

const OpenAI = require('openai');
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
 * Crea un cliente OpenAI apuntando al proxy LiteLLM.
 */
function buildLiteLLM() {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'litellm-proxy',
    baseURL: `${LITELLM_URL}/v1`,
  });
  client._model = 'smart-router';
  return client;
}

/**
 * Crea un cliente OpenAI apuntando a OpenRouter.
 */
function buildOpenRouter() {
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

/**
 * Crea un cliente OpenAI apuntando a Groq (segundo fallback).
 */
function buildGroq() {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  client._model = 'llama-3.3-70b-versatile';
  return client;
}

/**
 * Crea un cliente OpenAI con detección automática:
 *   1. Intenta LiteLLM proxy (async health check)
 *   2. Si no disponible → OpenRouter
 *   3. Si no hay OpenRouter → Groq
 *   4. Si no hay ninguna API key → null
 *
 * @returns {Promise<OpenAI|null>}
 */
async function createLLM() {
  // 1. LiteLLM proxy
  const ok = await probeLiteLLM();
  if (ok) {
    console.log(`[LiteLLM] Proxy activo → ${LITELLM_URL}/v1 (smart-router)`);
    return buildLiteLLM();
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    console.log('[LiteLLM] OpenRouter activo');
    return buildOpenRouter();
  }

  // 3. Groq
  if (process.env.GROQ_API_KEY) {
    console.log('[LiteLLM] Groq activo');
    return buildGroq();
  }

  console.warn('[LiteLLM] Sin API key de ningún proveedor');
  return null;
}

/**
 * Crea un ChatOpenAI (LangChain) para compatibilidad con LangGraph.
 * Solo usado por frontal_langchain.js.
 * NOTA: require() dinámico para no forzar la dependencia en todos los módulos.
 */
function createLangChainLLM({ temperature = 0.1, maxTokens = 2000 } = {}) {
  const { ChatOpenAI } = require('@langchain/openai');

  // 1. LiteLLM proxy (sincrónico — ya probado por quien llama)
  if (process.env.LITELLM_URL) {
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'litellm-proxy',
      configuration: { baseURL: `${LITELLM_URL}/v1` },
      model: 'smart-router',
      temperature,
      maxTokens,
    });
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
      model: 'google/gemini-2.5-flash',
      temperature,
      maxTokens,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos',
        'X-Title': 'LifeOS',
      },
    });
  }

  // 3. Groq
  if (process.env.GROQ_API_KEY) {
    return new ChatOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      configuration: { baseURL: 'https://api.groq.com/openai/v1' },
      model: 'llama-3.3-70b-versatile',
      temperature,
      maxTokens,
    });
  }

  console.warn('[LiteLLM] Sin API key de ningún proveedor');
  return null;
}

module.exports = { createLLM, createLangChainLLM, probeLiteLLM, buildLiteLLM, buildOpenRouter, buildGroq, LITELLM_URL };
