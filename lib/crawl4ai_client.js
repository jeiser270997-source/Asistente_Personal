/**
 * crawl4ai_client.js
 * Wrapper HTTP para crawl4ai (servidor local Python).
 * Si crawl4ai no está corriendo, hace fallback a cheerio/playwright nativo.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const CRAWL4AI_BASE = process.env.CRAWL4AI_URL || 'http://localhost:11235';
const TIMEOUT_MS = 15000;

/**
 * Extrae texto limpio de una URL usando crawl4ai si está disponible.
 * Fallback: fetch nativo + extracción básica.
 * @param {string} url
 * @param {object} opts
 * @returns {Promise<{markdown: string, success: boolean, source: string}>}
 */
async function crawl(url, opts = {}) {
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
