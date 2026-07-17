require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
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

async function askLLM(systemPrompt, messages, temperature = 0.1, tools = null) {
  const clients = await getLLMClients();
  if (!clients || clients.length === 0) throw new Error('No se pudo inicializar ningún cliente LLM');

  const compressedSystem = compressContext(systemPrompt);
  const messagesList = [
    { role: 'system', content: compressedSystem },
    ...(messages || []).map(m => ({
      role: m.role || 'user',
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
      name: m.name
    })),
  ];

  let attempt = 0;
  const MAX_RETRIES = Math.max(3, clients.length);
  let delay = 1000;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const llm = clients[(attempt - 1) % clients.length];
    
    try {
      console.log(`🧠 LLM vía ${llm._model} | intento ${attempt}/${MAX_RETRIES}`);

      // Dynamic max_tokens: lower default to fit free-tier residual budgets
      // If OpenRouter returns 402, next retry reduces tokens further
      const maxTokens = 2000;
      const payload = {
        model: llm._model,
        messages: messagesList,
        temperature,
        max_tokens: maxTokens,
      };
      console.log(`   max_tokens: ${maxTokens}`);

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
      console.warn(`[LLM Service] Error en intento ${attempt}/${MAX_RETRIES}: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
}

module.exports = { askLLM, compressContext };
