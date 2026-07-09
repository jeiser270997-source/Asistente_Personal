/**
 * lib/ai/llm_service.js
 *
 * Servicio LLM unificado usando OpenAI SDK (Chat Completions).
 * Mantiene: compresión de contexto, retry con backoff, failover entre proveedores.
 * Usa OpenRouter como proveedor primario con fallback a Groq y Cerebras.
 *
 * Migrado de LangChain ChatOpenAI → OpenAI SDK nativo — Jul 2026.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const OpenAI = require('openai');

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

function createOpenRouterLLM() {
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

function createGroqLLM() {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  client._model = 'llama-3.3-70b-versatile';
  return client;
}

function createCerebrasLLM() {
  const client = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: 'https://api.cerebras.ai/v1',
  });
  client._model = 'llama3.3-70b';
  return client;
}

// ── Fallback Providers (free tier) ──

function createNvidiaLLM() {
  const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://api.nvcf.nvidia.com/v1',
  });
  client._model = 'meta/llama-3.1-70b-instruct';
  return client;
}

function createGeminiLLM() {
  const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
  client._model = 'gemini-1.5-flash';
  return client;
}

function createSambaNovaLLM() {
  const client = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: 'https://api.sambanova.ai/v1',
  });
  client._model = 'Meta-Llama-3.3-70B-Instruct';
  return client;
}

function createCohereLLM() {
  const client = new OpenAI({
    apiKey: process.env.COHERE_API_KEY,
    baseURL: 'https://api.cohere.ai/v1',
  });
  client._model = 'command-r-plus';
  return client;
}

function createHuggingFaceLLM() {
  const client = new OpenAI({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    baseURL: 'https://api-inference.huggingface.co/v1',
  });
  client._model = 'meta-llama/Meta-Llama-3.1-70B-Instruct';
  return client;
}

function createMistralLLM() {
  const client = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: 'https://api.mistral.ai/v1',
  });
  client._model = 'mistral-small-latest';
  return client;
}

// ── JSON Extractor ──

/**
 * Extrae JSON de una respuesta LLM, limpiando bloques markdown ```json ... ```.
 * 1. Si el texto es JSON válido directo → retorna sin cambios
 * 2. Si encuentra un bloque ```json → extrae solo ese contenido
 * 3. Si encuentra { ... } o [ ... ] como fallback → lo extrae
 * 4. Si nada funciona → retorna el texto original
 */
function extractJSON(text) {
  if (!text) return text;
  const trimmed = text.trim();

  // 1. Ya es JSON válido
  try { JSON.parse(trimmed); return trimmed; } catch {}

  // 2. Buscar bloque ```json ... ``` o ``` ... ```
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    const candidate = match[1].trim();
    try { JSON.parse(candidate); return candidate; } catch {}
  }

  // 3. Buscar { ... } o [ ... ] como último recurso
  const braceMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (braceMatch) {
    try { JSON.parse(braceMatch[1]); return braceMatch[1]; } catch {}
  }

  // 4. Devolver original si nada funciona
  return trimmed;
}

// ── Main ──

async function askLLM(systemPrompt, messages, temperature = 0.1) {
  // Probar proveedores en orden (primarios primero, fallbacks después)
  const providers = [
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', factory: createOpenRouterLLM },
    { name: 'Groq', key: 'GROQ_API_KEY', factory: createGroqLLM },
    { name: 'Cerebras', key: 'CEREBRAS_API_KEY', factory: createCerebrasLLM },
    { name: 'NVIDIA', key: 'NVIDIA_API_KEY', factory: createNvidiaLLM },
    { name: 'Gemini', key: 'GEMINI_API_KEY', factory: createGeminiLLM },
    { name: 'SambaNova', key: 'SAMBANOVA_API_KEY', factory: createSambaNovaLLM },
    { name: 'Cohere', key: 'COHERE_API_KEY', factory: createCohereLLM },
    { name: 'HuggingFace', key: 'HUGGINGFACE_API_KEY', factory: createHuggingFaceLLM },
    { name: 'Mistral', key: 'MISTRAL_API_KEY', factory: createMistralLLM },
  ];

  let llm = null;
  let providerName = '';

  for (const p of providers) {
    if (process.env[p.key]) {
      try {
        llm = p.factory();
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

  // Build messages array (OpenAI Chat Completions format)
  const messagesList = [
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

      const result = await llm.chat.completions.create({
        model: llm._model || 'google/gemini-2.5-flash',
        messages: messagesList,
        temperature,
        max_tokens: 2000,
      });

      console.log(`✅ LLM OK vía ${providerName}`);
      const rawContent = result.choices[0]?.message?.content || '';
      const content = extractJSON(rawContent);
      return { content, role: 'assistant' };
    } catch (error) {
      const msg = error.message || '';

      if (msg.includes('402') || msg.includes('Insufficient Balance')) {
        console.warn(`⚠ ${providerName}: saldo insuficiente.`);
        // Intentar siguiente proveedor
        const nextProvider = providers.find(p => p.key !== providerName && process.env[p.key]);
        if (nextProvider) {
          console.log(`[LLM] Fallback a ${nextProvider.name}`);
          llm = nextProvider.factory();
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
