/**
 * lib/ai/llm_service.js
 *
 * Servicio LLM unificado usando LangChain ChatOpenAI.
 * Mantiene: compresión de contexto, retry con backoff.
 * Usa OpenRouter como proveedor primario con fallback a Groq.
 *
 * Migrado de DeepSeek → OpenRouter — Jul 2026.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { ChatOpenAI } = require('@langchain/openai');

const MAX_CONTEXT_CHARS = 12000;

// ── Helpers ──

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function compressContext(text) {
  if (!text || text.length <= MAX_CONTEXT_CHARS) return text;

  const lines = text.split('\n');
  const header = [];
  const body = [];
  let inHeader = true;

  for (const line of lines) {
    if (inHeader && (line.startsWith('[') || line.startsWith('#') || line.startsWith('>'))) {
      header.push(line);
      continue;
    }
    inHeader = false;
    body.push(line);
  }

  if (header.join('\n').length > MAX_CONTEXT_CHARS * 0.6) {
    const truncated = header.slice(0, 15);
    truncated.push('... (contexto comprimido para ahorrar tokens)');
    return truncated.join('\n');
  }

  const headerStr = header.join('\n');
  const remaining = MAX_CONTEXT_CHARS - headerStr.length - 100;
  const bodyStr = body.join('\n').substring(0, Math.max(remaining, 500));

  return headerStr + '\n\n' + bodyStr;
}

// ── LLM Factory ──

function createOpenRouterLLM(temperature = 0.1, maxTokens = 2000) {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: 'https://openrouter.ai/api/v1' },
    model: 'google/gemini-2.5-flash', // modelo principal via OpenRouter
    temperature,
    maxTokens,
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos',
      'X-Title': 'LifeOS',
    },
  });
}

function createGroqLLM(temperature = 0.1, maxTokens = 2000) {
  return new ChatOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    configuration: { baseURL: 'https://api.groq.com/openai/v1' },
    model: 'llama-3.3-70b-versatile',
    temperature,
    maxTokens,
  });
}

function createCerebrasLLM(temperature = 0.1, maxTokens = 2000) {
  return new ChatOpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    configuration: { baseURL: 'https://api.cerebras.ai/v1' },
    model: 'llama3.3-70b',
    temperature,
    maxTokens,
  });
}

// ── Main ──

async function askLLM(systemPrompt, messages, temperature = 0.1) {
  // Probar proveedores en orden
  const providers = [
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', factory: createOpenRouterLLM },
    { name: 'Groq', key: 'GROQ_API_KEY', factory: createGroqLLM },
    { name: 'Cerebras', key: 'CEREBRAS_API_KEY', factory: createCerebrasLLM },
  ];

  let llm = null;
  let providerName = '';

  for (const p of providers) {
    if (process.env[p.key]) {
      try {
        llm = p.factory(temperature, 2000);
        providerName = p.name;
        console.log(`[LLM] Usando ${p.name}`);
        break;
      } catch (e) {
        console.warn(`[LLM] Error creando ${p.name}: ${e.message}`);
      }
    }
  }

  if (!llm) {
    throw new Error('No hay API key configurada para ningún proveedor LLM');
  }

  // Compress context
  const compressedSystem = compressContext(systemPrompt);

  // Build LangChain message format
  const formattedMessages = [
    { role: 'system', content: compressedSystem },
    ...(messages || []).map(m => ({
      role: m.role || 'user',
      content: m.content
    })),
  ];

  let attempt = 0;
  const MAX_RETRIES = 3;
  let delay = 2000;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`🧠 LLM vía ${providerName} | intento ${attempt}/${MAX_RETRIES}`);

      const result = await llm.invoke(formattedMessages);

      console.log(`✅ LLM OK vía ${providerName}`);
      return {
        content: result.content,
        role: 'assistant',
      };
    } catch (error) {
      const msg = error.message || '';

      if (msg.includes('402') || msg.includes('Insufficient Balance')) {
        console.warn(`⚠ ${providerName}: saldo insuficiente.`);
        // Intentar siguiente proveedor
        const nextProvider = providers.find(p => p.key !== providerName && process.env[p.key]);
        if (nextProvider) {
          console.log(`[LLM] Fallback a ${nextProvider.name}`);
          llm = nextProvider.factory(temperature, 2000);
          providerName = nextProvider.name;
          attempt = 0;
          delay = 2000;
          continue;
        }
        throw new Error(`LLM: saldo insuficiente en todos los proveedores.`);
      }

      if (msg.includes('429') || msg.includes('rate_limit')) {
        console.warn(`⚠ Rate limit ${providerName}. Esperando ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      console.warn(`❌ ${providerName} error: ${msg.substring(0, 100)}`);

      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 1.5;
      }
    }
  }

  throw new Error(`LLM agotado tras ${MAX_RETRIES} intentos en ${providerName}.`);
}

module.exports = { askLLM, compressContext };
