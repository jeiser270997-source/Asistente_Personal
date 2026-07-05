require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { isDeepSeekValley, getScheduleLabel, getColombiaHour } = require('./time_scheduler');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-v4-flash';

const MAX_RETRIES = 3;
const BASE_DELAY = 2000;
const MAX_CONTEXT_CHARS = 12000;

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

  // If even headers are too long, truncate smartly
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

async function askDeepSeek(systemPrompt, messages, temperature = 0.1) {
  if (!DEEPSEEK_KEY) {
    throw new Error('DEEPSEEK_API_KEY no configurada en .env');
  }

  const valley = isDeepSeekValley();
  const hora = getColombiaHour();

  if (!valley) {
    const label = getScheduleLabel();
    throw new Error(`DeepSeek en horario PICO (${hora}h Colombia). ${label}. Reintenta despues de las 5am o antes de las 8pm.`);
  }

  // Compress the system prompt to save tokens
  const compressedSystem = compressContext(systemPrompt);

  const fullMessages = [
    { role: 'system', content: compressedSystem },
    ...messages
  ];

  // Compress user messages if too long
  const compacted = fullMessages.map((m, i) => {
    if (m.content && m.content.length > MAX_CONTEXT_CHARS) {
      return { ...m, content: compressContext(m.content) };
    }
    return m;
  });

  let attempt = 0;
  let delay = BASE_DELAY;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`🧠 DeepSeek ${MODEL} | intento ${attempt}/${MAX_RETRIES} | ${getScheduleLabel()}`);

      const response = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: compacted,
          temperature,
          max_tokens: 2000
        }),
        signal: AbortSignal.timeout(60000)
      });

      if (response.status === 429) {
        console.warn(`⚠ Rate limit DeepSeek. Esperando ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      if (response.status === 402) {
        throw new Error('DeepSeek: saldo insuficiente. Recarga en platform.deepseek.com');
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`DeepSeek HTTP ${response.status}: ${errText.substring(0, 150)}`);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message) {
        const tokens = data.usage;
        if (tokens) {
          console.log(`✅ DeepSeek OK | ${tokens.total_tokens} tokens (${tokens.prompt_tokens} prompt + ${tokens.completion_tokens} resp)`);
        } else {
          console.log(`✅ DeepSeek OK`);
        }
        return data.choices[0].message;
      }

      throw new Error('DeepSeek: respuesta sin choices');
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.warn(`⏱ Timeout DeepSeek (60s). Intento ${attempt}/${MAX_RETRIES}`);
      } else if (error.message.includes('saldo insuficiente') || error.message.includes('402')) {
        throw error;
      } else {
        console.warn(`❌ DeepSeek error: ${error.message.substring(0, 100)}`);
      }

      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 1.5;
      }
    }
  }

  throw new Error(`DeepSeek agotado tras ${MAX_RETRIES} intentos.`);
}

module.exports = { askLLM: askDeepSeek, compressContext };
