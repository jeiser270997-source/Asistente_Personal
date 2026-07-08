/**
 * lib/ai/llm_service.js
 *
 * Servicio LLM unificado usando LangChain ChatOpenAI con backend DeepSeek.
 * Mantiene: compresión de contexto, valley/pico scheduling, retry con backoff.
 *
 * Migrado de fetch() nativo → ChatOpenAI (LangChain) — Jul 2026.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { ChatOpenAI } = require('@langchain/openai');
const { isDeepSeekValley, getScheduleLabel, getColombiaHour } = require('../scheduling/time_scheduler');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = 'deepseek-v4-flash';

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

// ── Main ──

async function askDeepSeek(systemPrompt, messages, temperature = 0.1) {
  if (!DEEPSEEK_KEY) {
    throw new Error('DEEPSEEK_API_KEY no configurada en .env');
  }

  // Valley/Pico scheduling (mantenido del sistema anterior)
  const valley = isDeepSeekValley();
  const hora = getColombiaHour();

  if (!valley) {
    const label = getScheduleLabel();
    throw new Error(`DeepSeek en horario PICO (${hora}h Colombia). ${label}. Reintenta despues de las 5am o antes de las 8pm.`);
  }

  // Build LangChain ChatOpenAI with DeepSeek backend
  // Mismo patrón probado en lib/lobulos/frontal_langchain.js
  const llm = new ChatOpenAI({
    apiKey: DEEPSEEK_KEY,
    configuration: { baseURL: 'https://api.deepseek.com/v1' },
    model: MODEL,
    temperature,
    maxTokens: 2000,
  });

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
      console.log(`🧠 DeepSeek ${MODEL} via LangChain | intento ${attempt}/${MAX_RETRIES} | ${getScheduleLabel()}`);

      const result = await llm.invoke(formattedMessages);

      console.log(`✅ DeepSeek OK via LangChain`);
      return {
        content: result.content,
        role: 'assistant',
      };
    } catch (error) {
      const msg = error.message || '';

      if (msg.includes('402') || msg.includes('saldo insuficiente') || msg.includes('Insufficient Balance')) {
        throw new Error('DeepSeek: saldo insuficiente. Recarga en platform.deepseek.com');
      }

      if (msg.includes('429') || msg.includes('rate_limit')) {
        console.warn(`⚠ Rate limit DeepSeek. Esperando ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      console.warn(`❌ DeepSeek error: ${msg.substring(0, 100)}`);

      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 1.5;
      }
    }
  }

  throw new Error(`DeepSeek agotado tras ${MAX_RETRIES} intentos.`);
}

module.exports = { askLLM: askDeepSeek, compressContext };
