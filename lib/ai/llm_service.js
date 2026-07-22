require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const { getLLMClients } = require('./litellm_client');

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

function extractJSON(text) {
  if (!text) return text;
  const trimmed = text.trim();
  try { JSON.parse(trimmed); return trimmed; } catch {}
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    const candidate = match[1].trim();
    try { JSON.parse(candidate); return candidate; } catch {}
  }
  const braceMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (braceMatch) {
    try { JSON.parse(braceMatch[1]); return braceMatch[1]; } catch {}
  }
  return trimmed;
}

async function askLLM(systemPrompt, messages, temperature = 0.1, tools = null, sensitive = false) {
  const clients = await getLLMClients(sensitive);
  if (!clients || clients.length === 0) throw new Error('No se pudo inicializar ningún cliente LLM');

  const compressedSystem = compressContext(systemPrompt);
  const messagesList = [
    { role: 'system', content: compressedSystem },
    ...(messages || []).map(m => {
      const msgObj = { role: m.role || 'user', content: m.content || '' };
      if (m.tool_calls) msgObj.tool_calls = m.tool_calls;
      if (m.tool_call_id) msgObj.tool_call_id = m.tool_call_id;
      if (m.name) msgObj.name = m.name;
      return msgObj;
    }),
  ];

  let attempt = 0;
  const MAX_RETRIES = Math.max(clients.length * 2, 4);
  let delay = 800;
  // Free-tier friendly: start small, only raise if provider allows
  const TOKEN_LADDER = [400, 700, 1000, 1400];

  while (attempt < MAX_RETRIES) {
    attempt++;
    const llm = clients[(attempt - 1) % clients.length];
    const baseTokens = TOKEN_LADDER[Math.min(attempt - 1, TOKEN_LADDER.length - 1)];
    const maxTokens = (llm._provider === 'google' || (llm._model && llm._model.includes('gemini')))
      ? Math.max(baseTokens, 2048)
      : baseTokens;

    try {
      console.log(`🧠 LLM vía ${llm._model} (${llm._provider}) | intento ${attempt}/${MAX_RETRIES} | max_tokens=${maxTokens}`);

      const payload = {
        model: llm._model,
        messages: messagesList,
        temperature,
        max_tokens: maxTokens,
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
      }

      const result = await llm.chat.completions.create(payload);
      const message = result.choices[0]?.message;
      const usage = result.usage || null;

      if (message.tool_calls) {
        return { content: message.content, role: 'assistant', tool_calls: message.tool_calls, usage };
      }

      const rawContent = message?.content || '';
      const content = extractJSON(rawContent);
      return { content, role: 'assistant', usage };
    } catch (error) {
      const msg = error.message || String(error);
      const isQuota =
        /402|429|quota|rate.?limit|token|insufficient|billing|credits|resource.?exhausted/i.test(msg);
      console.warn(`[LLM Service] Error en intento ${attempt}/${MAX_RETRIES}: ${msg.slice(0, 160)}`);
      if (isQuota) {
        // Jump to next provider quickly; keep tokens low
        delay = Math.min(delay, 500);
      }
      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay = Math.min(delay * 2, 8000);
      } else {
        throw error;
      }
    }
  }
}

module.exports = { askLLM, compressContext };
// NOTA: askLLM(systemPrompt, messages, temperature, tools, sensitive=true) fuerza uso exclusivo del proxy local
// cuando el prompt incluye contexto de data/user/finanzas.md o data/user/psicologia.md.
