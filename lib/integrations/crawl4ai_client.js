/**
 * crawl4ai_client.js
 * Wrapper HTTP para crawl4ai (servidor local Python).
 * Si crawl4ai no está corriendo, hace fallback a cheerio/playwright nativo.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { isIP } = require('node:net');
const dns = require('node:dns').promises;

const CRAWL4AI_BASE = process.env.CRAWL4AI_URL || 'http://localhost:11235';
const TIMEOUT_MS = 15000;

/**
 * Bloquea rangos privados/loopback/link-local/reservados para prevenir SSRF.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIp(ip) {
  let targetIp = ip.toLowerCase();
  if (targetIp.startsWith('::ffff:')) {
    targetIp = targetIp.slice(7);
  }

  if (isIP(targetIp) === 4) {
    const parts = targetIp.split('.').map(Number);
    if (parts[0] === 127) return true; // Loopback
    if (parts[0] === 10) return true;  // Private A
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // Private B
    if (parts[0] === 192 && parts[1] === 168) return true; // Private C
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // CGNAT
    if (parts[0] >= 224 && parts[0] <= 239) return true; // Multicast
    if (parts[0] >= 240) return true; // Reserved / Broadcast
    if (parts[0] === 0) return true;
    return false;
  }
  if (isIP(targetIp) === 6) {
    if (targetIp === '::1' || targetIp === '::') return true;
    if (targetIp.startsWith('fe80:') || targetIp.startsWith('fc') || targetIp.startsWith('fd')) return true;
    return false;
  }
  return true; // no es IP reconocible → tratar como no seguro
}

/**
 * Valida que la URL sea http/https pública y no apunte a infraestructura interna.
 * @param {string} url
 * @returns {Promise<{safe: boolean, reason?: string}>}
 */
async function isUrlSafe(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: 'URL malformada' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `Protocolo no permitido: ${parsed.protocol}` };
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return { safe: false, reason: 'Host localhost bloqueado' };
  }
  try {
    let addresses;
    if (isIP(hostname)) {
      addresses = [hostname];
    } else {
      const results = await dns.lookup(hostname, { all: true });
      addresses = results.map(r => r.address);
    }
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return { safe: false, reason: `IP privada/reservada bloqueada: ${addr}` };
      }
    }
  } catch (e) {
    return { safe: false, reason: `No se pudo resolver el host: ${e.message}` };
  }
  return { safe: true };
}

/**
 * Extrae texto limpio de una URL usando crawl4ai si está disponible.
 * Fallback: fetch nativo + extracción básica.
 * @param {string} url
 * @param {object} opts
 * @returns {Promise<{markdown: string, success: boolean, source: string}>}
 */
async function crawl(url, opts = {}) {
  const safety = await isUrlSafe(url);
  if (!safety.safe) {
    console.warn(`[Crawl4AI] 🚫 URL bloqueada por seguridad: ${url} (${safety.reason})`);
    return { markdown: '', success: false, source: 'blocked', error: `URL no permitida: ${safety.reason}` };
  }

  // Intentar crawl4ai primero
  try {
    const res = await fetch(`${CRAWL4AI_BASE}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [url],
        priority: 10,
        word_count_threshold: 10,
        extraction_strategy: 'NoExtractionStrategy',
        chunking_strategy: 'RegexChunking',
        ...opts
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (res.ok) {
      const data = await res.json();
      const result = data?.results?.[0];
      if (result?.markdown) {
        console.log(`[Crawl4AI] ✅ ${url} → ${result.markdown.length} chars`);
        return { markdown: result.markdown, success: true, source: 'crawl4ai' };
      }
    }
  } catch {
    // crawl4ai no disponible, fallback silencioso
  }

  // Fallback: fetch + texto plano
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 LifeOS/1.0' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const html = await res.text();
    // Extracción básica sin JSDOM (solo texto visible)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 8000);

    console.log(`[Crawl4AI] ⚡ fallback fetch → ${text.length} chars`);
    return { markdown: text, success: true, source: 'fetch_fallback' };
  } catch (e) {
    return { markdown: '', success: false, source: 'error', error: e.message };
  }
}

/**
 * Verifica si crawl4ai está disponible
 */
async function isAvailable() {
  try {
    const res = await fetch(`${CRAWL4AI_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { crawl, isAvailable, CRAWL4AI_BASE };
