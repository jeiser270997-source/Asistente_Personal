/**
 * lib/ai/litellm_client.js — LiteLLM Proxy Client para LifeOS
 *
 * Cliente LLM unificado usando OpenAI SDK nativo.
 * Intenta conectar al proxy local LiteLLM; si no está disponible,
 * cae automáticamente a OpenRouter API, luego Groq.
 */

const OpenAI = require('openai');
const LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';

async function probeLiteLLM(timeout = 2000) {
  // En GitHub Actions no hay proxy LiteLLM local — saltar el timeout de 2s
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

function buildLiteLLM() {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'litellm-proxy',
    baseURL: `${LITELLM_URL}/v1`,
  });
  client._model = 'smart-router';
  return client;
}

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

function buildGroq() {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  client._model = 'llama-3.3-70b-versatile';
  return client;
}

function buildFreebuff() {
  const client = new OpenAI({
    apiKey: process.env.FREEBUFF_API_KEY,
    baseURL: process.env.FREEBUFF_URL || 'https://api.freebuff.net/v1',
  });
  client._model = 'deepseek-v4-flash';
  return client;
}

async function getAvailableClients() {
  const clients = [];
  if (process.env.FREEBUFF_API_KEY) {
    clients.push({ name: 'Freebuff', build: buildFreebuff });
  }
  const ok = await probeLiteLLM();
  if (ok) {
    clients.push({ name: 'LiteLLM', build: buildLiteLLM });
  }
  if (process.env.OPENROUTER_API_KEY) {
    clients.push({ name: 'OpenRouter', build: buildOpenRouter });
  }
  if (process.env.GROQ_API_KEY) {
    clients.push({ name: 'Groq', build: buildGroq });
  }
  return clients;
}

async function createLLM() {
  const clients = await getAvailableClients();
  return clients.length > 0 ? clients[0].build() : null;
}

module.exports = { createLLM, getAvailableClients, probeLiteLLM, buildLiteLLM, buildOpenRouter, buildGroq, buildFreebuff, LITELLM_URL };
