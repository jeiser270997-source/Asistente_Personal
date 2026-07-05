require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DIAN_LOGIN = 'https://muisca.dian.gov.co/WebIdentidadLogin/?ideRequest=eyJjbGllbnRJZCI6IldvMGFLQWxCN3ZSUF8xNmZyUEkxeDlacGhCRWEiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbXVpc2NhLmRpYW4uZ292LmNvL0lkZW50aWRhZFJlc3RfTG9naW5GaWx0cm8vYXBpL3N0cy92MS9hdXRoL2NhbGxiYWNrP3JlZGlyZWN0X3VyaT1odHRwJTNBJTJGJTJGbXVpc2NhLmRpYW4uZ292LmNvJTJGV2ViQXJxdWl0ZWN0dXJhJTJGRGVmTG9naW4uZmFjZXMiLCJyZXNwb25zZVR5cGUiOiIiLCJzY29wZSI6IiIsInN0YXRlIjoiIiwibm9uY2UiOiIiLCJwYXJhbXMiOnsidGlwb1VzdWFyaW8iOiJtdWlzY2EifX0%3D';
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
  await page.goto(DIAN_LOGIN, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Wait for Angular/Material to finish rendering
  await page.waitForTimeout(3000);

  // Force-enable the form (Angular Material may disable inputs initially)
  await page.evaluate(() => {
    const docInput = document.querySelector('input[name="numDocumento"]');
    const passInput = document.querySelector('input[name="password"]');
    if (docInput) { docInput.disabled = false; docInput.removeAttribute('disabled'); }
    if (passInput) { passInput.disabled = false; passInput.removeAttribute('disabled'); }
  });

  // Fill credentials with force
  await page.fill('input[name="numDocumento"]', DIAN_USER, { force: true });
  await page.fill('input[name="password"]', DIAN_PASS, { force: true });
  
  log('   Credenciales ingresadas. Enviando via JS...');

  // DIAN MUISCA uses Angular Material - bypass overlay with JS injection
  const loginResult = await page.evaluate(({ user, pass }) => {
    return new Promise((resolve) => {
      try {
        const docInput = document.querySelector('input[name="numDocumento"]');
        const passInput = document.querySelector('input[name="password"]');
        const checkbox = document.querySelector('#mat-checkbox-1-input, input[type="checkbox"]');
        
        if (docInput) { docInput.value = user; docInput.dispatchEvent(new Event('input', { bubbles: true })); }
        if (passInput) { passInput.value = pass; passInput.dispatchEvent(new Event('input', { bubbles: true })); }
        if (checkbox) { checkbox.checked = true; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
        
        // Try all possible submit buttons
        setTimeout(() => {
          const btns = document.querySelectorAll('button');
          let clicked = false;
          for (const btn of btns) {
            const text = btn.textContent.toLowerCase();
            if (text.includes('ingresar') || text.includes('entrar') || text.includes('iniciar') || text.includes('continuar')) {
              btn.click();
              clicked = true;
              break;
            }
          }
          if (!clicked) {
            const firstBtn = document.querySelector('button[type="submit"], button.btn-primary');
            if (firstBtn) firstBtn.click();
            else {
              const form = document.querySelector('form');
              if (form) form.submit();
            }
          }
          resolve({ submitted: true });
        }, 1000);
      } catch(e) {
        resolve({ error: e.message });
      }
    });
  }, { user: DIAN_USER, pass: DIAN_PASS });
  
  log(`   Submit: ${JSON.stringify(loginResult)}`);
  
  await page.waitForTimeout(8000);
  log(`   Post-login URL: ${page.url()}`);
  log(`   Post-login Title: ${await page.title()}`);

  // Check if we're past login
  if (page.url().includes('muisca.dian.gov.co') && !page.url().includes('WebIdentidadLogin')) {
    log('✅ Login exitoso a MUISCA');
    return true;
  }

  // Check for error messages
  const errorText = await page.evaluate(() => {
    const alerts = document.querySelectorAll('.alert-danger, .error, .msg-error');
    return Array.from(alerts).map(a => a.textContent.trim()).join(' | ');
  });

  if (errorText) {
    log(`❌ Error de login: ${errorText}`);
  } else {
    log('⚠ Login outcome unclear - posiblemente requiere paso adicional');
  }

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
