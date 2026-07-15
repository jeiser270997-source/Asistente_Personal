require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');
const path = require('node:path');
const fs   = require('node:fs');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;
const HEADLESS = !process.argv.includes('--visible');
const DRY_RUN  = process.argv.includes('--dry-run');

// Base del candidato en co.computrabajo
const BASE = 'https://candidato.co.computrabajo.com';

function log(msg) { console.log(`[CT-Profile] ${msg}`); }

// ── Datos del CV actualizado ─────────────────────────────────────────────────
const CV_DATA = {
  titular: 'QA Automation Engineer Junior',
  resumen: 'Desarrollador de software freelance con experiencia en automatización de procesos, testing E2E con Playwright, pipelines CI/CD con GitHub Actions y APIs REST. Actualmente en formación como QA Automation en CESDE Medellín. Inglés C1 Advanced (EF SET 68/100).',

  experiencia: [
    {
      cargo: 'Desarrollador de Software Freelance',
      empresa: 'Independiente',
      inicio_mes: '01', inicio_anio: '2022',
      fin_mes: null, fin_anio: null, // actual
      descripcion: 'Desarrollo de soluciones de automatización con Node.js, Playwright y GitHub Actions. Integración de APIs externas (Google, REST, Telegram). Pipelines CI/CD con 12+ workflows en producción. Soporte técnico y mantenimiento de equipos.',
    },
    {
      cargo: 'Agente de Servicio al Cliente',
      empresa: 'Foundever de Colombia S.A.',
      inicio_mes: '10', inicio_anio: '2021',
      fin_mes: '12', fin_anio: '2021',
      descripcion: 'Atención multicanal (voz y chat). Gestión de tickets en CRM. Cumplimiento de métricas de calidad NPS y FCR.',
    },
    {
      cargo: 'Operador de Medios Tecnológicos',
      empresa: 'COOVISOCIAL Cooperativa de Trabajo Asociado',
      inicio_mes: '09', inicio_anio: '2019',
      fin_mes: '10', fin_anio: '2021',
      descripcion: 'Operación y monitoreo de sistemas de videovigilancia (CCTV), control de acceso y alarmas. Gestión de incidencias en tiempo real. Certificado técnico en Operación de Medios Tecnológicos.',
    },
  ],

  educacion: [
    {
      titulo: 'Técnico en Análisis y Desarrollo de Software',
      institucion: 'CESDE',
      inicio_anio: '2026',
      fin_anio: null, // en curso
    },
    {
      titulo: 'Bases de Datos — Sistemas de Gestión',
      institucion: 'SENA',
      inicio_anio: '2026',
      fin_anio: '2026',
    },
  ],

  idiomas: [
    { idioma: 'Español', nivel: 'Nativo' },
    { idioma: 'Inglés', nivel: 'Avanzado (C1) — EF SET 68/100' },
  ],

  // Para referencia — Computrabajo no suele tener campo de certs en perfil público
  certificaciones: [
    'EF SET English Certificate 68/100 — C1 Advanced (Mar 2026)',
    'HubSpot Service Hub Software Certification (Mar 2026)',
    'HubSpot Inbound Certification (Mar 2026)',
    'Microsoft Office Excel 2016 · SENA (Jun 2026, 40h, nota 4.5)',
  ],
};

// ── Helpers de navegación ─────────────────────────────────────────────────────
async function waitAndFill(page, selector, value, desc = '') {
  try {
    await page.waitForSelector(selector, { timeout: 8000 });
    await page.fill(selector, value);
    log(`  ✔ Relleno: ${desc || selector}`);
  } catch (e) {
    log(`  ⚠ No encontrado: ${desc || selector} — ${e.message}`);
  }
}

async function clickIfExists(page, selector, desc = '') {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    log(`  ✔ Click: ${desc || selector}`);
    return true;
  } catch {
    log(`  ⚠ No disponible: ${desc || selector}`);
    return false;
  }
}

async function safeSelect(page, selector, value, desc = '') {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.selectOption(selector, { label: value });
    log(`  ✔ Select: ${desc} = ${value}`);
  } catch (e) {
    try {
      await page.selectOption(selector, { value });
      log(`  ✔ Select (value): ${desc} = ${value}`);
    } catch {
      log(`  ⚠ Select fallido: ${desc} — ${e.message}`);
    }
  }
}

// ── Actualizar Titular y Resumen ──────────────────────────────────────────────
async function updateTitular(page) {
  log('→ Actualizando titular y resumen...');
  try {
    // Computrabajo: Mi perfil > Datos personales
    await page.goto('https://co.computrabajo.com/candidato/datos-profesionales', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Titular / Puesto deseado
    const titularSel = 'input[name="titular"], input[id*="titular"], input[placeholder*="Cargo"]';
    await waitAndFill(page, titularSel, CV_DATA.titular, 'Titular');

    // Resumen / Presentación
    const resumenSel = 'textarea[name*="resumen"], textarea[name*="presentacion"], textarea[id*="resumen"]';
    await waitAndFill(page, resumenSel, CV_DATA.resumen, 'Resumen');

    await clickIfExists(page, 'button[type="submit"], input[type="submit"]', 'Guardar datos profesionales');
    await page.waitForTimeout(2000);
  } catch (e) {
    log(`  ⚠ Error en titular: ${e.message}`);
  }
}

// ── Actualizar Experiencia ─────────────────────────────────────────────────────
async function updateExperiencia(page) {
  log('→ Navegando a experiencia laboral...');
  try {
    await page.goto('https://co.computrabajo.com/candidato/experiencia', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    log(`  URL actual: ${currentUrl}`);

    // Captura screenshot para diagnóstico
    await page.screenshot({ path: 'data/logs/ct_profile_experiencia.png', fullPage: false });
    log('  📸 Screenshot guardado: data/logs/ct_profile_experiencia.png');

    if (DRY_RUN) {
      log('  DRY RUN — no se modificará experiencia. Ver screenshot para diagnóstico.');
      return;
    }

    // Por cada experiencia, intentar agregar/editar
    for (const exp of CV_DATA.experiencia) {
      log(`  → Procesando: ${exp.cargo} @ ${exp.empresa}`);

      // Botón "Añadir experiencia" o similar
      const addBtn = await clickIfExists(page,
        'a[href*="agregar-experiencia"], button[id*="add"], a[class*="btn-add"], [data-action*="add"]',
        'Añadir experiencia'
      );

      if (!addBtn) {
        log('  ⚠ Botón añadir no encontrado — intentando selector alternativo');
        await clickIfExists(page, 'text=Agregar, text=Añadir, text=+ Experiencia', 'Añadir (texto)');
      }

      await page.waitForTimeout(1500);
    }
  } catch (e) {
    log(`  ⚠ Error en experiencia: ${e.message}`);
  }
}

// ── Screenshot + descubrir URLs del perfil ───────────────────────────────────
async function screenshotProfile(page) {
  try {
    // Navegar al perfil del candidato
    const profileUrls = [`${BASE}/mi-cv`, `${BASE}/mi-perfil`, `${BASE}/candidato`];
    let landed = false;
    for (const url of profileUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });
        if (!page.url().includes('acceso') && !page.url().includes('Login')) {
          landed = true;
          break;
        }
      } catch { /* try next */ }
    }

    await page.waitForTimeout(2000);
    fs.mkdirSync('data/logs', { recursive: true });
    await page.screenshot({ path: 'data/logs/ct_profile_completo.png', fullPage: true });
    log(`📸 Screenshot guardado (${page.url().substring(0, 60)})`);

    // Mapear links de edición disponibles
    const editLinks = await page.$$eval('a', els =>
      els.filter(e => /editar|experiencia|educacion|idioma|cv|perfil|habilidad/i.test(e.textContent + e.href))
         .map(e => ({ text: e.textContent.trim().substring(0, 40), href: e.href }))
    ).catch(() => []);
    if (editLinks.length > 0) {
      log('Links de edición encontrados:');
      editLinks.forEach(l => log(`  → ${l.text} | ${l.href.substring(0, 80)}`));
    }
  } catch (e) {
    log(`⚠ Screenshot fallido: ${e.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('🚀 Iniciando actualización de perfil en Computrabajo...');
  if (DRY_RUN) log('⚠ MODO DRY RUN — solo diagnóstico, sin cambios.');
  if (!CT_PASS) {
    log('❌ COMPUTRABAJO_PASS no encontrado en .env — abortando.');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO',
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  try {
    log('🔐 Iniciando login...');
    const logged = await robustLogin(page, CT_EMAIL, CT_PASS);

    if (!logged) {
      log('❌ Login fallido.');
      fs.mkdirSync('data/logs', { recursive: true });
      await page.screenshot({ path: 'data/logs/ct_login_fail.png' });
      await browser.close();
      process.exit(1);
    }

    log('✅ Login exitoso. URL: ' + page.url().substring(0, 80));

    // Mapear perfil actual y encontrar URLs de edición
    await screenshotProfile(page);

    // Actualizar titular/resumen si no es dry-run
    if (!DRY_RUN) {
      await updateTitular(page);
      await updateExperiencia(page);
    }

    log('\n📋 Resumen del CV a cargar en Computrabajo:');
    log(`   Titular: ${CV_DATA.titular}`);
    CV_DATA.experiencia.forEach(e =>
      log(`   - ${e.cargo} @ ${e.empresa} (${e.inicio_anio}–${e.fin_anio || 'actual'})`)
    );
    log('   Idiomas: Inglés C1 Advanced (EF SET 68/100)');
    CV_DATA.certificaciones.forEach(c => log(`   - ${c}`));
    log('\n✅ Proceso completado. Revisa data/logs/ para screenshots.');

  } catch (e) {
    log(`❌ Error fatal: ${e.message}`);
    fs.mkdirSync('data/logs', { recursive: true });
    await page.screenshot({ path: 'data/logs/ct_profile_error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });

