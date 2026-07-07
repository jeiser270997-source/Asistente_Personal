/**
 * dian_scraper.js — Scraper exhaustivo DIAN MUISCA
 * Login → Dashboard → extrae TODO lo disponible:
 *   - Info RUT / perfil
 *   - Obligaciones tributarias
 *   - Buzón notificaciones electrónicas
 *   - Estado de cuenta / deudas
 *   - PQRS radicadas
 *   - Declaraciones presentadas
 *   - Casilla de correo oficial
 * Guarda cada sección en data/dian/ como JSON + captura screenshots.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
let LedgerStore = null;
let RE = null;
if (USE_SQLITE) {
  CheckpointStore = require('../runtime/stores/CheckpointStore');
  LedgerStore = require('../runtime/stores/LedgerStore');
  RE = require('../lib/resume_engine');
}

const DIAN_URL  = 'https://muisca.dian.gov.co/WebIdentidadLogin/?ideRequest=eyJjbGllbnRJZCI6IldvMGFLQWxCN3ZSUF8xNmZyUEkxeDlacGhCRWEiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbXVpc2NhLmRpYW4uZ292LmNvL0lkZW50aWRhZFJlc3RfTG9naW5GaWx0cm8vYXBpL3N0cy92MS9hdXRoL2NhbGxiYWNrP3JlZGlyZWN0X3VyaT1odHRwJTNBJTJGJTJGbXVpc2NhLmRpYW4uZ292LmNvJTJGV2ViQXJxdWl0ZWN0dXJhJTJGRGVmTG9naW4uZmFjZXMiLCJyZXNwb25zZVR5cGUiOiIiLCJzY29wZSI6IiIsInN0YXRlIjoiIiwibm9uY2UiOiIiLCJwYXJhbXMiOnsidGlwb1VzdWFyaW8iOiJtdWlzY2EifX0%3D';
const DIAN_USER = process.env.DIAN_USER || '1019156838';
const DIAN_PASS = process.env.DIAN_PASS || 'A125%230aa';

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'dian');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function saveJSON(name, data) {
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2), 'utf8');
}
function shot(page, name) {
  return page.screenshot({ path: path.join(DATA_DIR, name), fullPage: true }).catch(() => {});
}

// ─── LOGIN ────────────────────────────────────────────────────
async function loginDIAN(page) {
  log('🔐 Login DIAN MUISCA...');
  await page.goto(DIAN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Seleccionar CC en mat-select
  log('   Paso 1: Seleccionando Cédula de Ciudadanía...');
  try {
    await page.click('mat-select, .mat-select-trigger', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('mat-option:has-text("Cédula de ciudadanía"), mat-option:has-text("Cedula")', { timeout: 5000 });
    await page.waitForTimeout(500);
    log('   ✅ CC seleccionado');
  } catch (e) { log('   ⚠ mat-select: ' + e.message.substring(0, 50)); }

  // 2. Número documento
  try {
    await page.click('input[name="numDocumento"], input[formcontrolname="numDocumento"]');
    await page.waitForTimeout(200);
    await page.type('input[name="numDocumento"], input[formcontrolname="numDocumento"]', DIAN_USER, { delay: 50 });
  } catch (e) { log('   ⚠ numDoc: ' + e.message.substring(0, 50)); }
  await page.waitForTimeout(300);

  // 3. Contraseña
  try {
    await page.click('input[type="password"]');
    await page.waitForTimeout(200);
    await page.type('input[type="password"]', DIAN_PASS, { delay: 50 });
  } catch (e) { log('   ⚠ pass: ' + e.message.substring(0, 50)); }
  await page.waitForTimeout(300);

  // 4. Checkbox términos
  try {
    await page.click('mat-checkbox, .mat-checkbox-layout', { timeout: 3000 });
    log('   ✅ Checkbox marcado');
  } catch (e) { log('   ⚠ checkbox: ' + e.message.substring(0, 50)); }
  await page.waitForTimeout(500);

  // 5. Ingresar
  try {
    await page.click('button:has-text("Ingresar")', { timeout: 3000 });
  } catch {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /ingresar/i.test(b.textContent));
      if (btn) { btn.removeAttribute('disabled'); btn.click(); }
    });
  }
  await page.waitForTimeout(8000);

  const ok = page.url().includes('muisca.dian.gov.co') && !page.url().includes('WebIdentidadLogin');
  log(ok ? `✅ Login OK → ${page.url()}` : `❌ Login fallido → ${page.url()}`);
  await shot(page, 'dashboard.png');
  return ok;
}

// ─── HELPER: extraer texto limpio de una página ───────────────
async function extractPageText(page) {
  return page.evaluate(() => {
    // Remover scripts, styles, nav repetitivos
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script,style,nav,header,footer').forEach(el => el.remove());
    return clone.innerText.replace(/\s{3,}/g, '\n\n').trim().substring(0, 8000);
  });
}

// ─── HELPER: extraer tabla ────────────────────────────────────
async function extractTables(page) {
  return page.evaluate(() => {
    const tables = [];
    document.querySelectorAll('table').forEach(t => {
      const rows = [];
      t.querySelectorAll('tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('th,td')).map(c => c.textContent.trim());
        if (cells.some(c => c.length > 0)) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });
    return tables;
  });
}

// ─── HELPER: navegar y extraer ────────────────────────────────
async function visitAndExtract(page, url, nombre) {
  log(`   → ${nombre}: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    const title  = await page.title();
    const isError = title.includes('Error') || title.includes('404') || title.includes('JBoss');
    if (isError) {
      log(`   ⚠ ${nombre}: página no disponible (${title})`);
      return { disponible: false, url, title };
    }
    const texto  = await extractPageText(page);
    const tablas = await extractTables(page);
    await shot(page, `${nombre.replace(/\s+/g, '_').toLowerCase()}.png`);
    log(`   ✅ ${nombre}: ${texto.length} chars, ${tablas.length} tablas`);
    return { disponible: true, url, title, texto, tablas };
  } catch (e) {
    log(`   ⚠ ${nombre}: ${e.message.substring(0, 60)}`);
    return { disponible: false, url, error: e.message.substring(0, 100) };
  }
}

// ─── EXTRAER LINKS DEL DASHBOARD ─────────────────────────────
async function extractDashboardLinks(page) {
  log('🗺 Extrayendo links del Dashboard...');
  try {
    return await page.evaluate(() => {
      const seen = {};
      const links = [];
      // Usar for loop clásico — Prototype.js rompe forEach/findIndex
      const anchors = document.getElementsByTagName('a');
      for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i];
        const href = a.href || '';
        const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
        if (href.indexOf('muisca.dian.gov.co') > -1 && text.length > 2 && text.length < 100 && !seen[href]) {
          seen[href] = true;
          links.push({ text, href });
        }
      }
      return links;
    });
  } catch(e) {
    log('   ⚠ extractDashboardLinks: ' + e.message.substring(0, 80));
    return [];
  }
}

// ─── SECCIONES CONOCIDAS ─────────────────────────────────────
const SECCIONES_DIAN = [
  // RUT y perfil
  { nombre: 'rut_consulta',        url: 'https://muisca.dian.gov.co/WebRutMuisca/DefConsultaEstadoRUT.faces' },
  { nombre: 'rut_info',            url: 'https://muisca.dian.gov.co/WebRutMuisca/DefInscripcionRUT.faces' },
  // Buzón notificaciones
  { nombre: 'notificaciones',      url: 'https://muisca.dian.gov.co/WebAvisosNotificaciones/DefBandejaNotificaciones.faces' },
  { nombre: 'buzon_notif',         url: 'https://muisca.dian.gov.co/WebNotificacionesElectronicas/DefBandeja.faces' },
  // Estado de cuenta / obligaciones
  { nombre: 'estado_cuenta',       url: 'https://muisca.dian.gov.co/WebArquitectura/DefEstadoCuenta.faces' },
  { nombre: 'obligaciones',        url: 'https://muisca.dian.gov.co/WebArquitectura/DefObligaciones.faces' },
  { nombre: 'cartera',             url: 'https://muisca.dian.gov.co/WebArquitectura/DefConsultaCartera.faces' },
  // Declaraciones
  { nombre: 'declaraciones',       url: 'https://muisca.dian.gov.co/WebArquitectura/DefDeclaraciones.faces' },
  { nombre: 'declaraciones_iva',   url: 'https://muisca.dian.gov.co/WebArquitectura/DefDeclaracionIVA.faces' },
  // PQRS y peticiones
  { nombre: 'pqrs_bandeja',        url: 'https://muisca.dian.gov.co/WebArquitectura/DefBandejaPQRS.faces' },
  { nombre: 'peticiones',          url: 'https://muisca.dian.gov.co/WebArquitectura/DefPeticiones.faces' },
  // Correo oficial
  { nombre: 'correo_electronico',  url: 'https://muisca.dian.gov.co/WebArquitectura/DefCorreoElectronico.faces' },
  // Dashboard principal
  { nombre: 'dashboard',           url: 'https://muisca.dian.gov.co/WebDashboard/DefDashboard.faces' },
  { nombre: 'inicio',              url: 'https://muisca.dian.gov.co/WebArquitectura/DefLogin.faces' },
];

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  ensureDir();
  if (USE_SQLITE) RE.start('dian_scraper', {});
  log('═══════════════════════════════════════');
  log('DIAN MUISCA SCRAPER — EXTRACCION EXHAUSTIVA');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();

  const resultado = {
    fecha: new Date().toISOString(),
    nit: DIAN_USER,
    login_exitoso: false,
    secciones: {},
    links_dashboard: [],
    resumen: '',
  };

  const loginOk = await loginDIAN(page);
  resultado.login_exitoso = loginOk;

  if (!loginOk) {
    if (USE_SQLITE) { CheckpointStore.set('dian_ultima_consulta', resultado); LedgerStore.emit('dian_login_fallido', { fecha: resultado.fecha }); }
    saveJSON('ultima_consulta.json', resultado);
    if (USE_SQLITE) RE.finish('dian_scraper', 'error', { reason: 'login_failed' });
    await browser.close();
    log('Login fallido. Abortando.');
    process.exit(1);
  }

  if (USE_SQLITE) LedgerStore.emit('dian_login_ok', { fecha: resultado.fecha });

  // Extraer links del dashboard para descubrir URLs disponibles
  const dashLinks = await extractDashboardLinks(page);
  resultado.links_dashboard = dashLinks;
  log(`   Dashboard links encontrados: ${dashLinks.length}`);

  // Visitar cada sección conocida
  log('\n📋 Extrayendo secciones DIAN...');
  for (const sec of SECCIONES_DIAN) {
    resultado.secciones[sec.nombre] = await visitAndExtract(page, sec.url, sec.nombre);
    await page.waitForTimeout(1000); // pausa entre peticiones
  }

  // Visitar links dinámicos del dashboard que no estaban en la lista
  const conocidos = new Set(SECCIONES_DIAN.map(s => s.url));
  const extras = dashLinks.filter(l => l.href && !conocidos.has(l.href) && l.href.includes('muisca'));
  log(`\n🔍 Visitando ${extras.length} links adicionales del dashboard...`);
  for (const link of extras.slice(0, 10)) { // máx 10 extra
    const key = link.text.toLowerCase().replace(/\s+/g, '_').substring(0, 30);
    resultado.secciones[key] = await visitAndExtract(page, link.href, link.text);
    await page.waitForTimeout(800);
  }

  // Generar resumen textual
  const disponibles = Object.entries(resultado.secciones).filter(([, v]) => v.disponible);
  const noDisponibles = Object.entries(resultado.secciones).filter(([, v]) => !v.disponible);

  resultado.resumen = `DIAN MUISCA — Extracción ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
NIT: ${DIAN_USER}
Login: ✅
Secciones disponibles: ${disponibles.length}/${Object.keys(resultado.secciones).length}

DISPONIBLES:
${disponibles.map(([k, v]) => `  ✅ ${k}: ${(v.texto || '').substring(0, 80)}`).join('\n')}

NO DISPONIBLES (404/error):
${noDisponibles.map(([k]) => `  ❌ ${k}`).join('\n')}`;

  if (USE_SQLITE) { CheckpointStore.set('dian_ultima_consulta', resultado); LedgerStore.emit('dian_consulta_completada', { fecha: resultado.fecha, disponibles: disponibles.length, total: Object.keys(resultado.secciones).length }); }
  saveJSON('ultima_consulta.json', resultado);
  log('\n' + resultado.resumen);

  // Guardar cada sección disponible como archivo separado para fácil acceso
  for (const [nombre, datos] of disponibles) {
    if (datos.texto) {
      fs.writeFileSync(path.join(DATA_DIR, `${nombre}.txt`), datos.texto, 'utf8');
    }
    if (datos.tablas && datos.tablas.length > 0) {
      saveJSON(`${nombre}_tablas.json`, datos.tablas);
    }
  }

  await browser.close();
  if (USE_SQLITE) RE.finish('dian_scraper', 'success', { secciones_ok: disponibles.length, secciones_fail: noDisponibles.length });
  log(`\nExtraccion DIAN completada. Datos en: ${DATA_DIR}`);
  log(`   ${disponibles.length} secciones con datos, ${noDisponibles.length} no disponibles`);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
