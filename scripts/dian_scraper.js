require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DIAN_URL = 'https://muisca.dian.gov.co/WebIdentidadLogin/?ideRequest=eyJjbGllbnRJZCI6IldvMGFLQWxCN3ZSUF8xNmZyUEkxeDlacGhCRWEiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbXVpc2NhLmRpYW4uZ292LmNvL0lkZW50aWRhZFJlc3RfTG9naW5GaWx0cm8vYXBpL3N0cy92MS9hdXRoL2NhbGxiYWNrP3JlZGlyZWN0X3VyaT1odHRwJTNBJTJGJTJGbXVpc2NhLmRpYW4uZ292LmNvJTJGV2ViQXJxdWl0ZWN0dXJhJTJGRGVmTG9naW4uZmFjZXMiLCJyZXNwb25zZVR5cGUiOiIiLCJzY29wZSI6IiIsInN0YXRlIjoiIiwibm9uY2UiOiIiLCJwYXJhbXMiOnsidGlwb1VzdWFyaW8iOiJtdWlzY2EifX0%3D';
const DIAN_USER = process.env.DIAN_USER || '1019156838';
const DIAN_PASS = process.env.DIAN_PASS || 'A125%230aa';

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'dian');
const LAST_PATH = path.join(DATA_DIR, 'ultima_consulta.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function loginDIAN(page) {
  log('🔐 Login DIAN MUISCA...');
  await page.goto(DIAN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // PASO 1: Seleccionar tipo de documento (mat-select Angular)
  log('   Paso 1: Seleccionando Cédula de Ciudadanía...');
  try {
    // Click en el trigger del mat-select para abrir el dropdown
    await page.click('mat-select, .mat-select-trigger', { timeout: 5000 });
    await page.waitForTimeout(1000);
    // Buscar y click en la opción CC en el panel que se abrió
    await page.click('mat-option:has-text("Cédula de ciudadanía"), mat-option:has-text("Cedula")', { timeout: 5000 });
    await page.waitForTimeout(500);
    log('   ✅ Tipo de documento seleccionado: CC');
  } catch (e) {
    log('   ⚠ mat-select: ' + e.message.substring(0, 60));
  }

  // PASO 2: Número de documento — click primero para activar Angular, luego type
  log('   Paso 2: Ingresando número de documento...');
  try {
    await page.click('input[name="numDocumento"], input[formcontrolname="numDocumento"]');
    await page.waitForTimeout(200);
    await page.type('input[name="numDocumento"], input[formcontrolname="numDocumento"]', DIAN_USER, { delay: 50 });
  } catch (e) {
    log('   ⚠ numDocumento: ' + e.message.substring(0, 60));
  }
  await page.waitForTimeout(300);

  // PASO 3: Contraseña
  log('   Paso 3: Ingresando contraseña...');
  try {
    await page.click('input[name="password"], input[formcontrolname="password"], input[type="password"]');
    await page.waitForTimeout(200);
    await page.type('input[name="password"], input[formcontrolname="password"], input[type="password"]', DIAN_PASS, { delay: 50 });
  } catch (e) {
    log('   ⚠ password: ' + e.message.substring(0, 60));
  }
  await page.waitForTimeout(300);

  // PASO 4: Checkbox términos — click en el contenedor visible
  log('   Paso 4: Marcando checkbox términos...');
  try {
    await page.click('mat-checkbox, .mat-checkbox-layout', { timeout: 3000 });
    log('   ✅ Checkbox marcado');
  } catch (e) {
    log('   ⚠ checkbox: ' + e.message.substring(0, 60));
  }
  await page.waitForTimeout(500);

  // Screenshot antes de submit
  await page.screenshot({ path: require('node:path').join(DATA_DIR, 'dian_presubmit.png') });

  // PASO 5: Click en Ingresar
  log('   Paso 5: Haciendo click en Ingresar...');
  try {
    await page.click('button:has-text("Ingresar")', { timeout: 3000 });
  } catch {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /ingresar/i.test(b.textContent));
      if (btn) { btn.removeAttribute('disabled'); btn.click(); }
    });
  }

  await page.waitForTimeout(8000);
  log(`   Post-login URL: ${page.url()}`);

  await page.screenshot({ path: require('node:path').join(DATA_DIR, 'ultima_consulta.png') });

  if (page.url().includes('muisca.dian.gov.co') && !page.url().includes('WebIdentidadLogin')) {
    log('✅ Login exitoso a MUISCA');
    return true;
  }

  const errorText = await page.evaluate(() => {
    const alerts = document.querySelectorAll('.alert-danger, .error, mat-error, .cdk-overlay-container mat-dialog-content');
    return Array.from(alerts).map(a => a.textContent.trim()).join(' | ');
  });
  if (errorText) log(`❌ Error: ${errorText.substring(0, 150)}`);
  else log('⚠ Aún en login');
  return false;
}



async function scrapeDIAN(page) {
  log('📋 Extrayendo datos DIAN...');

  // Try navigating to different sections
  const sections = [
    { name: 'Bandeja de Entrada', url: 'https://muisca.dian.gov.co/WebArquitectura/DefLogin.faces' },
    { name: 'Notificaciones', url: 'https://muisca.dian.gov.co/WebArquitectura/DefNotificaciones.faces' },
    { name: 'PQRS', url: 'https://muisca.dian.gov.co/WebArquitectura/DefPQRS.faces' }
  ];

  const data = { accedido: false, secciones: [], radicados: [], texto: '' };

  for (const section of sections) {
    try {
      await page.goto(section.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const title = await page.title();
      const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      
      data.secciones.push({
        nombre: section.name,
        url: page.url(),
        titulo: title,
        accedio: !text.includes('error') && !text.includes('no disponible')
      });

      // Check for specific radicados
      const radicados = ['2026DP000154567', '2026DP000161298', 'Dominick', 'Angelina'];
      for (const r of radicados) {
        if (text.includes(r)) {
          data.radicados.push({ radicado: r, encontrado: true, seccion: section.name });
        }
      }

      log(`   ${section.name}: ${title.substring(0, 60)}`);
    } catch (e) {
      log(`   ${section.name}: Error - ${e.message.substring(0, 50)}`);
    }
  }

  data.texto = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  return data;
}

async function main() {
  ensureDir();
  log('═══════════════════════════════════════');
  log('🏛 DIAN MUISCA SCRAPER');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const loggedIn = await loginDIAN(page);
    
    const resultado = {
      fecha: new Date().toISOString(),
      login_exitoso: loggedIn,
      data: null
    };

    if (loggedIn) {
      resultado.data = await scrapeDIAN(page);
    }

    // Save screenshot for debugging
    await page.screenshot({ path: path.join(DATA_DIR, 'ultima_consulta.png') });
    
    // Save data
    fs.writeFileSync(LAST_PATH, JSON.stringify(resultado, null, 2));
    
    if (loggedIn && resultado.data?.radicados?.length > 0) {
      log('\n📬 RADICADOS ENCONTRADOS:');
      for (const r of resultado.data.radicados) {
        log(`   ${r.radicado} (${r.seccion})`);
      }
    } else if (loggedIn) {
      log('\n⚠ Login OK pero no se encontraron radicados en las secciones principales.');
    }

    log('\n✅ Consulta DIAN completada');
    log(`   Datos: ${LAST_PATH}`);
    log(`   Screenshot: ${path.join(DATA_DIR, 'ultima_consulta.png')}`);
  } catch (err) {
    log(`❌ Error: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); process.exit(1); });
