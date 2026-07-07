/**
 * mem0_client.js
 * Wrapper REST para mem0 (servidor local Python).
 * Si mem0 no está corriendo, delega al memory_engine.js SQLite nativo.
 * Arquitectura: mem0 (semántico) → fallback memory_engine (fuzzy SQLite)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const nativeMemory = require('./memory/memory_engine');

const MEM0_BASE = process.env.MEM0_URL || 'http://localhost:8000';
const USER_ID = 'jeiser';
const TIMEOUT_MS = 5000;

let _available = null; // cache del estado

async function checkAvailable() {
  if (_available !== null) return _available;
  try {
    const res = await fetch(`${MEM0_BASE}/`, { signal: AbortSignal.timeout(2000) });
    _available = res.ok;
  } catch {
    _available = false;
  }
  return _available;
}

/**
 * Añadir un hecho/memoria
 */
async function add(messages, categoria = 'general', tags = []) {
  if (await checkAvailable()) {
    try {
      const res = await fetch(`${MEM0_BASE}/v1/memories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, user_id: USER_ID }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Mem0] ✅ Memoria añadida: ${data?.id || 'ok'}`);
        return { source: 'mem0', ...data };
      }
    } catch (e) {
      console.warn('[Mem0] fallback a native:', e.message);
    }
  }
  // Fallback: memory_engine SQLite nativo
  const text = Array.isArray(messages)
    ? messages.map(m => m.content || m).join(' ')
    : messages;
  const id = nativeMemory.agregarHecho(categoria, text, tags, 'mem0_fallback', 'media');
  return { source: 'native', id };
}

/**
 * Buscar memorias relevantes a una query
 */
async function search(query, limit = 10) {
  if (await checkAvailable()) {
    try {
      const res = await fetch(
        `${MEM0_BASE}/v1/memories/search/?query=${encodeURIComponent(query)}&user_id=${USER_ID}&limit=${limit}`,
        { signal: AbortSignal.timeout(TIMEOUT_MS) }
      );
      if (res.ok) {
        const data = await res.json();
        console.log(`[Mem0] ✅ ${data?.length || 0} memorias encontradas`);
        return { source: 'mem0', results: data || [] };
      }
    } catch (e) {
      console.warn('[Mem0] search fallback a native:', e.message);
    }
  }
  // Fallback: fuzzy search en SQLite
  const results = nativeMemory.buscarHechos(query, limit);
  return { source: 'native', results };
}

/**
 * Obtener contexto relevante para inyectar en el prompt
 */
async function getContexto(query, maxChars = 1500) {
  const { results, source } = await search(query, 8);
  if (!results || results.length === 0) return '';

  const lines = results.map(r => {
    const text = r.memory || r.hecho || (typeof r === 'string' ? r : JSON.stringify(r));
    return `• ${text.substring(0, 200)}`;
  });

  const label = source === 'mem0' ? '[MEM0:semántico]' : '[MEM0:local]';
  const block = `${label}\n${lines.join('\n')}`;
  return block.length > maxChars ? block.substring(0, maxChars) + '...' : block;
}

module.exports = { add, search, getContexto, checkAvailable, MEM0_BASE };
