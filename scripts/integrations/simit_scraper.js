require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
let LedgerStore = null;
let RE = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
  LedgerStore = require('../../runtime/stores/LedgerStore');
  RE = require('../../lib/runtime/resume_engine');
}

const PLACA = 'KEW496';
const SIMIT_URL = 'https://www.fcm.org.co/simit/#/estado-cuenta';

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'simit');
const LAST_PATH = path.join(DATA_DIR, 'ultima_consulta.json');
const ALERT_PATH = path.join(DATA_DIR, 'alertas.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function loadLast() {
  if (USE_SQLITE) { const cp = CheckpointStore.get('simit_ultima_consulta'); if (cp) return cp; }
  try { return JSON.parse(fs.readFileSync(LAST_PATH, 'utf8')); }
  catch { return null; }
}

function saveLast(data) {
  if (USE_SQLITE) CheckpointStore.set('simit_ultima_consulta', data);
  fs.writeFileSync(LAST_PATH, JSON.stringify(data, null, 2));
}

function saveAlertas(alertas) {
  if (USE_SQLITE) CheckpointStore.set('simit_alertas', alertas);
  fs.writeFileSync(ALERT_PATH, JSON.stringify(alertas, null, 2));
}

async function scrapeSIMIT(page) {
  log('🔍 Consultando SIMIT para placa ' + PLACA + '...');

  await page.goto(SIMIT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Type plate number and search (the portal is an SPA so input is dynamic)
  const input = await page.$('#txtBusqueda');
  if (!input) {
    log('❌ No se encontro el campo de busqueda');
    return null;
  }

  await input.fill(PLACA);
  await page.waitForTimeout(500);

  const searchBtn = await page.$('#btnNumDocPlaca');
  if (searchBtn) await searchBtn.click();
  await page.waitForTimeout(5000);

  // The page should now show results
  const hasResults = await page.evaluate(() => {
    return document.body.innerText.includes('Comparendos') || 
           document.body.innerText.includes('Multas') ||
           document.body.innerText.includes('Total');
  });

  if (!hasResults) {
    log('⚠ No se encontraron resultados');
    return null;
  }

  // Extract data from the Angular SPA
  const data = await page.evaluate(() => {
    const body = document.body.innerText;
    
    // Extract total
    const totalMatch = body.match(/Total:\s*\$?\s*([\d.,]+)/);
    
    // Count multas
    const multasMatch = body.match(/Multas:\s*(\d+)/);
    const comparendosMatch = body.match(/Comparendos:\s*(\d+)/);
    const acuerdosMatch = body.match(/Acuerdos de pago:\s*(\d+)/);

    // Extract individual multa details from table
    const rows = document.querySelectorAll('table tr, .table tr, tbody tr');
    const multas = [];
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 5) {
        const texts = Array.from(cells).map(c => c.textContent.trim());
        // Look for multa/comparendo IDs (numeric patterns)
        if (texts[0] && /^\d{5,}/.test(texts[0].replace(/\D/g, ''))) {
          multas.push({
            id: texts[0].replace(/\D/g, ''),
            tipo: texts[1] || '',
            fecha: texts[2] || '',
            secretaria: texts[3] || '',
            infraccion: texts[4] || '',
            estado: texts[5] || '',
            valor: texts[6] || ''
          });
        }
      }
    }

    return {
      total: totalMatch ? totalMatch[1] : null,
      numMultas: multasMatch ? parseInt(multasMatch[1]) : 0,
      numComparendos: comparendosMatch ? parseInt(comparendosMatch[1]) : 0,
      numAcuerdos: acuerdosMatch ? parseInt(acuerdosMatch[1]) : 0,
      multas,
      rawText: body.substring(0, 3000)
    };
  });

  log(`   Total: ${data.total}`);
  log(`   Multas: ${data.numMultas}, Comparendos: ${data.numComparendos}`);
  log(`   Detalles extraidos: ${data.multas.length}`);

  return data;
}

function detectChanges(prev, curr) {
  const alertas = [];

  if (!prev) {
    alertas.push({ tipo: 'primera_consulta', mensaje: 'Primera consulta automatica SIMIT. Datos base guardados.' });
    return alertas;
  }

  // Check total change
  if (prev.total !== curr.total) {
    const diff = parseFloat(curr.total?.replace(/[.,]/g, '')) - parseFloat(prev.total?.replace(/[.,]/g, ''));
    alertas.push({
      tipo: 'cambio_total',
      mensaje: `Total SIMIT cambio: ${prev.total} → ${curr.total} (${diff > 0 ? '+' + diff : diff})`,
      urgente: true
    });
  }

  // Check new multas
  const prevIds = new Set((prev.detalle?.multas || []).map(m => m.id));
  const currMultas = curr.detalle?.multas || [];
  const nuevas = currMultas.filter(m => !prevIds.has(m.id));
  const resueltas = (prev.detalle?.multas || []).filter(m => !currMultas.find(cm => cm.id === m.id));

  for (const m of nuevas) {
    alertas.push({
      tipo: 'nueva_multa',
      mensaje: `🆕 NUEVA MULTA: ${m.id} | ${m.infraccion} | ${m.secretaria} | ${m.estado} | ${m.valor}`,
      urgente: true
    });
  }

  for (const m of resueltas) {
    alertas.push({
      tipo: 'multa_resuelta',
      mensaje: `✅ MULTA RESUELTA: ${m.id} ya no aparece en SIMIT`
    });
  }

  // Check status changes
  for (const cm of currMultas) {
    const pm = (prev.detalle?.multas || []).find(m => m.id === cm.id);
    if (pm && pm.estado !== cm.estado) {
      alertas.push({
        tipo: 'cambio_estado',
        mensaje: `🔄 ${cm.id}: ${pm.estado} → ${cm.estado}`,
        urgente: cm.estado.toLowerCase().includes('coactivo')
      });
    }
  }

  return alertas;
}

async function main() {
  ensureDir();
  if (USE_SQLITE) RE.start('simit_scraper', { placa: PLACA });
  log('═══════════════════════════════════════');
  log('SIMIT SCRAPER - Consulta Automatica');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const data = await scrapeSIMIT(page);
    if (!data) { process.exit(1); }

    const prev = loadLast();

    const registro = {
      fecha: new Date().toISOString(),
      placa: PLACA,
      total: data.total,
      numMultas: data.numMultas,
      numComparendos: data.numComparendos,
      detalle: {
        multas: data.multas
      }
    };

    // Detect changes
    const alertas = detectChanges(prev, registro);
    saveLast(registro);
    saveAlertas({ ultima_revision: new Date().toISOString(), alertas });

    log(`\nAlertas detectadas: ${alertas.length}`);
    for (const a of alertas) {
      const icono = a.urgente ? '🔴' : '🟢';
      log(`   ${icono} ${a.mensaje}`);
    }

    if (USE_SQLITE) {
      for (const a of alertas) LedgerStore.emit('simit_' + a.tipo, { placa: PLACA, ...a });
      RE.finish('simit_scraper', 'success', { alertas: alertas.length, urgentes: alertas.filter(a => a.urgente).length });
    }

    // Output for GitHub Actions / Telegram
    if (alertas.filter(a => a.urgente).length > 0) {
      const msg = alertas.filter(a => a.urgente).map(a => a.mensaje).join('\n');
      console.log('\n__TELEGRAM_ALERT__:' + msg);
    }

    log('\nConsulta completada');
  } catch (err) {
    if (USE_SQLITE) { LedgerStore.emit('simit_error', { error: err.message }); RE.finish('simit_scraper', 'error', { reason: err.message }); }
    log(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); process.exit(1); });
