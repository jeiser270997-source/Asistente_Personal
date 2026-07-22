/**
 * scripts/diagnostics/scraper_health.js
 * Probador de Estabilidad y Diagnóstico de Scrapers de LifeOS.
 * Valida red, selectores Playwright y logs de ejecución SQLite.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const dns = require('node:dns').promises;
const { chromium } = require('playwright');

process.env.STORAGE_DRIVER = 'sqlite';
const { getDb, close } = require('../../runtime/stores/Database');

const TIMEOUT_MS = 10000;

// Configuración de los objetivos a diagnosticar
const TARGETS = {
  SIMIT: {
    domain: 'www.fcm.org.co',
    url: 'https://www.fcm.org.co/simit/#/estado-cuenta',
    selector: '#txtBusqueda',
    jobName: 'simit_scraper'
  },
  SENA_ZAJUNA: {
    domain: 'zajuna.sena.edu.co',
    url: 'https://zajuna.sena.edu.co',
    selector: 'select[name="typeDocument"], input[name="document"]',
    jobName: 'sena_scraper'
  },
  DIAN: {
    domain: 'muisca.dian.gov.co',
    url: 'https://muisca.dian.gov.co/WebIdentidadLogin/',
    selector: 'input[name="numDocumento"], input[type="password"]',
    jobName: 'dian_scraper'
  },
  COMPUTRABAJO: {
    domain: 'co.computrabajo.com',
    url: 'https://candidato.co.computrabajo.com/acceso/',
    selector: '#Email, #continueWithMailButton',
    jobName: 'computrabajo-scraper'
  },
  ITAGUI: {
    domain: 'movilidad.transitoitagui.gov.co',
    url: 'https://movilidad.transitoitagui.gov.co/portal-servicios/#/inicio-login',
    selector: 'input[type="email"], input[type="password"]',
    jobName: 'transito_itagui_scraper'
  },
  MEDELLIN: {
    domain: 'www.medellin.gov.co',
    url: 'https://www.medellin.gov.co/portal-movilidad/index.html#/inicio-sesion',
    selector: 'input[type="text"], input[type="password"]',
    jobName: 'transito_medellin_scraper'
  }
};

function formatTime(isoStr) {
  if (!isoStr) return 'Nunca';
  return new Date(isoStr).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
}

async function checkNetwork(domain, url) {
  const start = Date.now();
  try {
    // 1. Resolución DNS
    const ips = await dns.resolve(domain);
    if (!ips || ips.length === 0) throw new Error('DNS desalineado');

    // 2. Ping de respuesta rápida
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' };
    let res = await fetch(url, { method: 'HEAD', headers, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    }
    const latency = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return {
      ok: true,
      latencyMs: latency,
      ip: ips[0],
      status: res.status
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkSelector(page, url, selector) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
    await page.waitForTimeout(1500); // dejar que renderice el SPA

    // Verificar si hay bloqueo directo por Cloudflare o error HTTP
    const pageTitle = await page.title();
    if (pageTitle.includes('Cloudflare') || pageTitle.includes('403') || pageTitle.includes('Forbidden') || pageTitle.includes('Error')) {
      return { ok: false, error: `Bloqueo detectado o página inactiva: "${pageTitle}"` };
    }

    // Buscar si los elementos requeridos existen en el DOM
    const elements = selector.split(',').map(s => s.trim());
    const results = [];
    for (const sel of elements) {
      const el = await page.$(sel);
      results.push({ selector: sel, found: el !== null });
    }

    const allFound = results.every(r => r.found);
    if (allFound) {
      return { ok: true, details: 'Selectores validados con éxito en el DOM' };
    } else {
      const missing = results.filter(r => !r.found).map(r => r.selector).join(' | ');
      return { ok: false, error: `Selectores rotos o ausentes: ${missing}` };
    }
  } catch (err) {
    return { ok: false, error: `Timeout/Error cargando automatización: ${err.message}` };
  }
}

function getLatestJobRun(db, jobName) {
  try {
    const row = db.prepare(`
      SELECT * FROM job_runs
      WHERE job_name = ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(jobName);
    return row || null;
  } catch {
    return null;
  }
}

async function runDiagnostics() {
  console.log('🔍');
  console.log('===============================================================');
  console.log('🧠  LIFEOS — DETECTOR DE ESTABILIDAD DE INTEGRACIONES EXTERNAS');
  console.log('===============================================================\n');

  const db = getDb();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const report = [];

    for (const [key, t] of Object.entries(TARGETS)) {
      console.log(`📡 Evaluando: ${key}...`);

      // 1. Red
      const net = await checkNetwork(t.domain, t.url);

      // 2. Automatización (solo si hay red)
      let auto = { ok: false, error: 'Omitido por falla de red' };
      if (net.ok) {
        auto = await checkSelector(page, t.url, t.selector);
      }

      // 3. Historial (SQLite)
      const lastRun = getLatestJobRun(db, t.jobName);

      // Evaluar estado consolidado
      let status = '✅ ESTABLE';
      let styleColor = '\x1b[32m'; // verde
      let reasoning = 'Todos los sistemas en verde.';

      if (!net.ok) {
        status = '❌ CRÍTICO';
        styleColor = '\x1b[31m'; // rojo
        reasoning = `Falla de red/DNS: ${net.error}`;
      } else if (!auto.ok) {
        status = '⚠️ ALERTA';
        styleColor = '\x1b[33m'; // amarillo
        reasoning = `Selectores web rotos o IP bloqueada: ${auto.error}`;
      } else if (lastRun && (lastRun.status === 'failed' || lastRun.status === 'error')) {
        status = '⚠️ ALERTA';
        styleColor = '\x1b[33m'; // amarillo
        reasoning = `La última ejecución en producción falló (${lastRun.finished_at || '?'})`;
      }

      report.push({
        key,
        status,
        styleColor,
        reasoning,
        latency: net.ok ? `${net.latencyMs}ms` : 'N/A',
        ip: net.ok ? net.ip : 'N/A',
        lastRunTime: lastRun ? formatTime(lastRun.started_at) : 'Ninguna',
        lastRunStatus: lastRun ? lastRun.status.toUpperCase() : 'N/A'
      });
    }

    // Imprimir reporte visual
    console.log('\n===============================================================');
    console.log('📋 REPORTES DE INTEGRACIONES Y CONFIABILIDAD');
    console.log('===============================================================\n');

    for (const r of report) {
      console.log(`🔹 *${r.key}*`);
      console.log(`   Estado:      ${r.styleColor}${r.status}\x1b[0m`);
      console.log(`   Rendimiento: Latencia: ${r.latency} | IP: ${r.ip}`);
      console.log(`   Historial:   Último run: ${r.lastRunTime} | Status: ${r.lastRunStatus}`);
      console.log(`   Diagnóstico: ${r.reasoning}`);
      console.log('   ------------------------------------------------------------');
    }

    console.log(`\n🩺 Diagnóstico finalizado. Si hay alertas (⚠️) o críticos (❌), revisa los selectores o el estado de la red.`);
  } finally {
    if (browser) await browser.close();
    close();
  }
}

runDiagnostics().catch(console.error);
