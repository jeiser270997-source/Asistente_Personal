/**
 * scripts/jobs/computrabajo_scraper.js
 *
 * Pipeline 3 Etapas:
 *   1. RASTREO   → Palabras clave genéricas, newest-first, Medellín, dedup por offer_id.
 *   2. AUDITORÍA → Para cada oferta nueva: visitar página completa → IA evalúa descripción.
 *   3. COLA      → Ofertas aprobadas van a la cola de postulación + notificación Telegram.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../../lib/ai/llm_service');

const BASE_DIR = path.resolve(__dirname, '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const OUT_PATH = path.join(JOBS_DIR, 'computrabajo.json');       // todas las encontradas
const QUEUE_PATH = path.join(JOBS_DIR, 'apply_queue.json');      // aprobadas por IA → listas para aplicar

const DB_DRIVER  = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

// ─── PALABRAS CLAVE GENÉRICAS (Tech Medellín) ──────────────────────────────
// El motor de búsqueda de Computrabajo amplía los resultados al usar términos
// genéricos. La IA filtra la basura en la Etapa 2.
const KEYWORDS = [
  'soporte-tecnico',
  'mesa-de-ayuda',
  'help-desk',
  'auxiliar-de-sistemas',
  'auxiliar-ti',
  'tecnico-de-soporte',
  'qa',
  'tester',
  'qa-automation',
  'analista-de-sistemas',
  'junior-ti',
];

// ─── PERFIL MAESTRO (mismo que en apply.js) ───────────────────────────────
const PERFIL_JEISER = `
NOMBRE: Jeiser Abraham Gutierrez Torres
UBICACION: Medellin, Antioquia
VEHICULO: Tiene vehiculo propio (carro), sin restricciones de movilidad.
DISPONIBILIDAD: Lunes a Viernes (estudia los sabados en CESDE, NO puede trabajar sabados ni domingos).
ASPIRACION SALARIAL: SMLV o promedio del mercado, negociable.
FORMACION: Tecnico Analisis y Desarrollo de Software (CESDE, en curso). Bootcamp QA Automation 28 semanas (Playwright, GitHub Actions). SENA: Bases de Datos y Excel.
EXPERIENCIA:
  - QA Automation Engineer: Proyecto LifeOS propio en produccion (Playwright, Node.js, GitHub Actions, SQLite, APIs REST, CI/CD).
  - Mesa de Ayuda Nivel 1: Sitel/Iberia/Amadeus GDS (2021). Tickets, SLA, soporte remoto.
  - Auxiliar Sistemas/CCTV: Coovisocial (2019-2021). Monitoreo, diagnostico de fallas, informes.
SKILLS: Playwright, Node.js, JavaScript, GitHub Actions, SQLite, Git, Excel Avanzado, Windows 10/11, TCP/IP basico, GDS Amadeus.
IDIOMAS: Espanol nativo, Ingles B1-B2.
`;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

// ─── TELEGRAM ──────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch (e) { log('Telegram error: ' + e.message); }
}

// ─── PERSISTENCIA DE IDs VISTOS (dedup) ───────────────────────────────────
function loadSeenIds() {
  if (USE_SQLITE) {
    const cp = CheckpointStore.get('computrabajo_seen_ids');
    return new Set(cp?.ids || []);
  }
  try {
    const data = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo_last.json'), 'utf8'));
    return new Set(data.ids || []);
  } catch { return new Set(); }
}

function saveSeenIds(idSet) {
  const ids = [...idSet];
  if (USE_SQLITE) {
    CheckpointStore.set('computrabajo_seen_ids', { ids });
  } else {
    fs.writeFileSync(path.join(JOBS_DIR, 'computrabajo_last.json'), JSON.stringify({ ids }));
  }
}

// ─── ETAPA 1: SCRAPE LISTING (título, empresa, URL, ID) ───────────────────
async function scrapeListado(page, keyword) {
  // sorted by publicationDate = newest first | en-medellin = solo Medellín
  const url = `https://co.computrabajo.com/trabajo-de-${keyword}-en-medellin?by=publicationDate`;
  log(`  [RASTREO] ${keyword} → ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
  } catch (e) {
    log(`  [ERROR] goto falló: ${e.message.substring(0, 60)}`);
    return [];
  }

  const offers = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('article, .offerList article, [class*="offerItem"]');

    Array.from(cards).slice(0, 20).forEach(card => {
      const titleEl = card.querySelector('h2 a, h3 a, a[title], .js-o-link');
      const compEl  = card.querySelector('p[title], .company, [class*="company"]');
      const locEl   = card.querySelector('span[class*="city"], .location');
      const dateEl  = card.querySelector('p.fc_base, [class*="date"], span[class*="publi"]');
      if (!titleEl) return;
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();
      const href  = titleEl.href || '';
      // Extraer offer_id del slug de la URL (hash único de Computrabajo)
      const idMatch = href.match(/([A-F0-9]{32})/i);
      const offerId = idMatch ? idMatch[1].toUpperCase() : href.split('/').pop();
      results.push({
        offer_id: offerId,
        titulo:   clean(titleEl.textContent || titleEl.getAttribute('title')),
        empresa:  clean(compEl?.getAttribute('title') || compEl?.textContent),
        lugar:    clean(locEl?.textContent),
        fecha:    clean(dateEl?.textContent),
        url:      href,
      });
    });

    // Fallback: links directos si no hay article cards
    if (results.length === 0) {
      document.querySelectorAll('a[href*="oferta-"]').forEach((a, i) => {
        if (i >= 20) return;
        const text = a.textContent.trim();
        if (text.length < 5) return;
        const idMatch = a.href.match(/([A-F0-9]{32})/i);
        results.push({
          offer_id: idMatch ? idMatch[1].toUpperCase() : a.href.split('/').pop(),
          titulo: text, empresa: '', lugar: '', fecha: '', url: a.href,
        });
      });
    }
    return results;
  });

  log(`  [RASTREO] ${offers.length} ofertas en listing`);
  return offers;
}

// ─── ETAPA 2: AUDITORÍA IA (visitar página completa + DeepSeek) ────────────
async function auditarOferta(page, oferta) {
  log(`  [AUDITORÍA] ${oferta.titulo} | ${oferta.empresa}`);
  let descripcion = oferta.titulo;

  try {
    await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    descripcion = await page.evaluate(() => {
      // Intentar extraer solo el bloque de descripción
      const descEl = document.querySelector(
        '[class*="description"], [class*="jobDescription"], [class*="offerBody"], #offerBody, .js-description'
      );
      return (descEl?.innerText || document.body.innerText || '').substring(0, 2000);
    });
  } catch (e) {
    log(`  [AUDITORÍA] No se pudo visitar la oferta: ${e.message.substring(0, 60)}`);
  }

  const prompt = `Eres un evaluador de ofertas laborales para Colombia. Analiza si esta oferta encaja con el candidato.
Responde EXCLUSIVAMENTE con un JSON válido, sin texto extra.

OFERTA:
Titulo: ${oferta.titulo}
Empresa: ${oferta.empresa}
Descripcion: ${descripcion.substring(0, 1500)}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

CRITERIOS DE EVALUACIÓN:
1. score (0-100): qué tan bien encaja el candidato con la oferta.
2. recomendar (true/false): ¿Vale la pena aplicar? (score >= 55).
3. requiere_finde (true/false): ¿La oferta menciona sabados, domingos, fines de semana, rotativos, o turnos? Si NO se menciona horario, asume false.
4. categoria: "QA" | "Mesa de Ayuda" | "Auxiliar Sistemas" | "Otro"
5. razon: una frase corta explicando la decisión.

JSON:
{"score":N,"recomendar":true,"requiere_finde":false,"categoria":"Mesa de Ayuda","razon":"..."}`;

  try {
    const res  = await askLLM(prompt, [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(json);
    return { ...parsed, descripcion: descripcion.substring(0, 500) };
  } catch (e) {
    log(`  [AUDITORÍA] Error IA: ${e.message}`);
    return { score: 50, recomendar: true, requiere_finde: false, categoria: 'Otro', razon: 'Score estimado', descripcion };
  }
}

// ─── QUEUE: guardar ofertas aprobadas ─────────────────────────────────────
function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8')); }
  catch { return []; }
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  log('═══ COMPUTRABAJO PIPELINE (Rastreo → Auditoría IA → Cola) ═══');

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();

  const seenIds = loadSeenIds();
  log(`IDs ya vistos en base de datos: ${seenIds.size}`);

  // ── ETAPA 1: Rastrear todas las keywords ──
  const todasLasOfertas = [];
  for (const kw of KEYWORDS) {
    try {
      const offers = await scrapeListado(page, kw);
      todasLasOfertas.push(...offers);
      await page.waitForTimeout(1200); // pausa anti-detección entre búsquedas
    } catch (e) {
      log(`  [ERROR] keyword "${kw}": ${e.message.substring(0, 60)}`);
    }
  }

  // Dedup por offer_id (puede haber solapamiento entre keywords)
  const seenInRun = new Set();
  const candidatas = todasLasOfertas.filter(o => {
    if (!o.offer_id || seenInRun.has(o.offer_id)) return false;
    seenInRun.add(o.offer_id);
    if (seenIds.has(o.offer_id)) return false; // ya auditada antes
    return true;
  });

  log(`\n[RASTREO] Total: ${todasLasOfertas.length} | Únicas: ${seenInRun.size} | Nuevas a auditar: ${candidatas.length}`);

  // ── ETAPA 2: Auditoría IA de ofertas nuevas ──
  const aprobadas = [];
  const rechazadas = [];

  for (const oferta of candidatas) {
    const auditoria = await auditarOferta(page, oferta);
    seenIds.add(oferta.offer_id); // marcar como vista pase lo que pase

    if (auditoria.requiere_finde) {
      log(`  ⛔ RECHAZADA (fin de semana): "${oferta.titulo}"`);
      rechazadas.push({ ...oferta, auditoria });
      continue;
    }

    if (!auditoria.recomendar || auditoria.score < 50) {
      log(`  ⚫ DESCARTADA (score ${auditoria.score}): "${oferta.titulo}" — ${auditoria.razon}`);
      rechazadas.push({ ...oferta, auditoria });
      continue;
    }

    log(`  ✅ APROBADA (score ${auditoria.score} | ${auditoria.categoria}): "${oferta.titulo}"`);
    aprobadas.push({ ...oferta, auditoria, scraped_at: new Date().toISOString() });
    await page.waitForTimeout(800); // pausa entre visitas a páginas de oferta
  }

  await browser.close();

  // Persistir IDs vistos
  saveSeenIds(seenIds);

  // Guardar todas las encontradas
  fs.writeFileSync(OUT_PATH, JSON.stringify({
    fecha: new Date().toISOString(),
    total_scrapeadas: candidatas.length,
    aprobadas: aprobadas.length,
    rechazadas: rechazadas.length,
    ofertas: [...aprobadas, ...rechazadas],
  }, null, 2));

  // Agregar aprobadas a la cola de postulación
  const queue = loadQueue();
  const queueIds = new Set(queue.map(o => o.offer_id));
  const nuevasEnCola = aprobadas.filter(o => !queueIds.has(o.offer_id));
  saveQueue([...queue, ...nuevasEnCola]);

  log(`\n═══ RESUMEN ═══`);
  log(`  Auditadas por IA : ${candidatas.length}`);
  log(`  Aprobadas        : ${aprobadas.length}`);
  log(`  Rechazadas       : ${rechazadas.length}`);
  log(`  Añadidas a cola  : ${nuevasEnCola.length}`);

  // Notificación Telegram
  if (nuevasEnCola.length > 0) {
    const lines = nuevasEnCola.slice(0, 6).map(o =>
      `✅ <b>${o.titulo}</b>\n  🏢 ${o.empresa} | 📍 ${o.lugar}\n  🎯 Score: ${o.auditoria.score} | ${o.auditoria.categoria}\n  💬 ${o.auditoria.razon}\n  <a href="${o.url}">Ver oferta</a>`
    );
    await sendTelegram(
      `💼 <b>${nuevasEnCola.length} ofertas Tech aprobadas por IA</b> (L-V · Medellín)\n\n${lines.join('\n\n')}`
    );
    log('Notificación Telegram enviada.');
  } else {
    log('Sin nuevas ofertas aprobadas hoy.');
    await sendTelegram(`💼 <b>Computrabajo Pipeline</b>\nSe auditaron ${candidatas.length} ofertas. Ninguna nueva aprobada hoy.`);
  }

  log(`Cola actual: ${queue.length + nuevasEnCola.length} ofertas pendientes de aplicar.`);
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
