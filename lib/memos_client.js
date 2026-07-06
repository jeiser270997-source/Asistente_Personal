/**
 * memos_client.js
 * Cliente REST para Memos (app de notas autohosteada).
 * Si Memos no está corriendo, escribe en data/notas.md como siempre.
 * Arquitectura: memos REST → fallback fs.appendFileSync
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');

const MEMOS_BASE = process.env.MEMOS_URL || 'http://localhost:5230';
const MEMOS_TOKEN = process.env.MEMOS_TOKEN || '';
const NOTAS_PATH = path.join(__dirname, '..', 'data', 'notas.md');
const TIMEOUT_MS = 5000;

let _available = null;

async function checkAvailable() {
  if (_available !== null) return _available;
  try {
    const res = await fetch(`${MEMOS_BASE}/api/v1/workspace/profile`, {
      signal: AbortSignal.timeout(2000)
    });
    _available = res.ok;
  } catch {
    _available = false;
  }
  return _available;
}

/**
 * Crear una nota en Memos o en notas.md
 * @param {string} content - Contenido en Markdown
 * @param {string[]} tags - Tags opcionales (#trabajo, #legal, etc.)
 * @param {'PUBLIC'|'PROTECTED'|'PRIVATE'} visibility
 */
async function createMemo(content, tags = [], visibility = 'PRIVATE') {
  const tagStr = tags.map(t => `#${t.replace(/^#/, '')}`).join(' ');
  const fullContent = tagStr ? `${content}\n\n${tagStr}` : content;

  if (await checkAvailable()) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (MEMOS_TOKEN) headers['Authorization'] = `Bearer ${MEMOS_TOKEN}`;

      const res = await fetch(`${MEMOS_BASE}/api/v1/memos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: fullContent, visibility }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Memos] ✅ Nota creada: ${data?.name || data?.uid || 'ok'}`);
        return { source: 'memos', id: data?.name, content: fullContent };
      }
    } catch (e) {
      console.warn('[Memos] fallback a notas.md:', e.message);
    }
  }

  // Fallback: append a notas.md
  const timestamp = new Date().toISOString();
  const bloque = `\n\n---\n**${timestamp}**\n${fullContent}`;
  fs.mkdirSync(path.dirname(NOTAS_PATH), { recursive: true });
  fs.appendFileSync(NOTAS_PATH, bloque);
  console.log(`[Memos] 📝 fallback → notas.md (${fullContent.length} chars)`);
  return { source: 'file', path: NOTAS_PATH, content: fullContent };
}

/**
 * Listar últimas notas (solo si Memos disponible)
 */
async function listMemos(limit = 10) {
  if (await checkAvailable()) {
    try {
      const headers = {};
      if (MEMOS_TOKEN) headers['Authorization'] = `Bearer ${MEMOS_TOKEN}`;
      const res = await fetch(
        `${MEMOS_BASE}/api/v1/memos?pageSize=${limit}&filter=creator%3D%22users%2F1%22`,
        { headers, signal: AbortSignal.timeout(TIMEOUT_MS) }
      );
      if (res.ok) {
        const data = await res.json();
        return { source: 'memos', memos: data?.memos || [] };
      }
    } catch {}
  }
  // Fallback: leer notas.md
  try {
    const content = fs.readFileSync(NOTAS_PATH, 'utf8');
    const entries = content.split('\n\n---\n').slice(-limit);
    return { source: 'file', memos: entries.map(e => ({ content: e.trim() })) };
  } catch {
    return { source: 'file', memos: [] };
  }
}

module.exports = { createMemo, listMemos, checkAvailable, MEMOS_BASE };
