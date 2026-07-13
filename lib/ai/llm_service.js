require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { getAvailableClients } = require('./litellm_client');

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
  const clients = await getAvailableClients();
  if (clients.length === 0) throw new Error('No hay API key configurada para ningún proveedor LLM');

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

  let lastError = null;

  // Recorrer los clientes disponibles secuencialmente (cascada de respaldo)
  for (const clientInfo of clients) {
    let attempt = 0;
    const MAX_RETRIES = 2; // 2 intentos por cliente para agilizar el failover
    let delay = 1500;

    try {
      const llm = clientInfo.build();
      
      while (attempt < MAX_RETRIES) {
        attempt++;
        try {
          console.log(`🧠 LLM vía ${clientInfo.name} (${llm._model}) | intento ${attempt}/${MAX_RETRIES}`);

          const payload = {
            model: llm._model || 'google/gemini-2.5-flash',
            messages: messagesList,
            temperature,
            max_tokens: 2000,
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
          // Si el error es de saldo (402) o auth (401), saltar inmediatamente al siguiente proveedor
          const errMsg = error.message || '';
          if (error.status === 402 || error.status === 401 || errMsg.includes('402') || errMsg.includes('credits')) {
            console.warn(`⚠️ ${clientInfo.name} sin créditos o auth. Saltando al proveedor de respaldo...`);
            throw error; // esto nos saca al catch externo para continuar con el siguiente cliente
          }

          console.warn(`❌ Intento ${attempt} fallido: ${errMsg.substring(0, 100)}`);
          if (attempt < MAX_RETRIES) {
            await sleep(delay);
            delay *= 1.5;
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      lastError = error;
      // El bucle continuará con el siguiente cliente de la lista
    }
  }

  throw new Error(`Todos los proveedores de LLM fallaron de manera consecutiva. Último error: ${lastError?.message}`);
}

module.exports = { askLLM, compressContext };
