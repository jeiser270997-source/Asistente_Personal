require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const JobStore = require('../../runtime/stores/JobStore');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;
const COURSE_ID = process.env.SENA_MOODLE_COURSE_ID || '121953';
const COURSE_URL = `${BASE_URL}/zajuna/course/view.php?id=${COURSE_ID}`;

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'sena');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
}

function saveJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

async function safeEvaluate(page, fn, fallback = []) {
  try {
    return await page.evaluate(fn);
  } catch (err) {
    log(`safeEvaluate fallback: ${err.message}`);
    return fallback;
  }
}

// â”€â”€â”€ LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function login(page) {
  log('ðŸ” Login en ZAJUNA SENA...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Esperar a que el formulario de login esté completamente cargado
  await page.waitForSelector('select[name="typeDocument"]', { state: 'visible', timeout: 15000 }).catch(() => {
    log('⚠️ Selector typeDocument no encontrado, recargando...');
  });

  await page.selectOption('select[name="typeDocument"]', 'CC').catch(async () => {
    log('⚠️ Fallback: intentando con etiqueta del select');
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="typeDocument"]');
      if (sel) sel.value = 'CC';
    });
  });
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);

  const btn = await page.$('button[name="form_login_user"]');
  if (btn) {
    await page.evaluate(() => {
      const modal = document.querySelector('#connection-guard-modal');
      if (modal) modal.remove();
    }).catch(()=>{});

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
      page.evaluate(b => b.click(), btn).catch(() => btn.click({ force: true }))
    ]);
  } else {
    // Fallback: try pressing Enter
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  }
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch (e) { log('Timeout waitForLoadState'); } // Increased wait time for Zajuna to redirect

  if (page.url().includes('my/courses') || page.url().includes('dashboard')) {
    log('✅ Login exitoso');
    return true;
  }
  log('❌ Login fallido. URL actual: ' + page.url());
  log('Título: ' + await page.title().catch(() => 'unknown'));
  await page.screenshot({ path: path.join(__dirname, '..', '..', 'sena_error.png'), timeout: 5000 }).catch(() => log('⚠️ No se pudo tomar screenshot por timeout'));
  return false;
}

// ─── CURSO ──────────────────────────────────────────────────────────────────
async function extractCourse(page) {
  log('📚 Extrayendo curso...');
  await page.goto(COURSE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(async () => {
    log('Timeout en carga del curso, reintentando...');
    await page.goto(COURSE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  });
  // Esperar a que el contenido del curso aparezca (secciones) en lugar de esperar 4 seg
  await page.waitForSelector('.course-section, li.section', { state: 'attached', timeout: 15000 }).catch(() => null);

  const course = {
    id: COURSE_ID,
    nombre: '',
    ficha: '',
    url: page.url(),
    fecha_extraccion: new Date().toISOString(),
    secciones: []
  };

  // Titulo del curso
  const h1 = await page.$('h1');
  if (h1) {
    course.nombre = (await h1.textContent()).trim();
    const match = course.nombre.match(/\((\d+)\)/);
    if (match) course.ficha = match[1];
  }

  // Secciones y actividades
  const sections = await safeEvaluate(page, () => {
    const result = [];
    const secEls = document.querySelectorAll('li.section, .course-section');

    secEls.forEach((sec) => {
      const nameEl = sec.querySelector('.sectionname, h3.sectionname, .section-title');
      const name = nameEl ? nameEl.textContent.trim() : '';

      const activities = [];
      const actEls = sec.querySelectorAll('.activity, li.activity');

      actEls.forEach(act => {
        const link = act.querySelector('a');
        const instance = act.querySelector('.instancename');
        const text = instance ? instance.textContent.trim() : (link ? link.textContent.trim() : '');
        const href = link ? link.getAttribute('href') : '';
        const cls = act.className || '';

        let tipo = 'otro';
        if (cls.includes('assign')) tipo = 'tarea';
        else if (cls.includes('forum')) tipo = 'foro';
        else if (cls.includes('quiz')) tipo = 'cuestionario';
        else if (cls.includes('resource')) tipo = 'recurso';
        else if (cls.includes('page')) tipo = 'pagina';
        else if (cls.includes('url')) tipo = 'enlace';
        else if (cls.includes('folder')) tipo = 'carpeta';
        else if (cls.includes('scorm')) tipo = 'scorm';
        else if (cls.includes('label')) tipo = 'etiqueta';

        if (text && tipo !== 'etiqueta') {
          activities.push({ nombre: text, tipo, url: href ? href : null });
        }
      });

      if (name || activities.length > 0) {
        result.push({ nombre: name, actividades: activities });
      }
    });
    return result;
  });

  course.secciones = sections;
  const total = sections.reduce((s, sec) => s + sec.actividades.length, 0);
  log(`   Secciones: ${sections.length}, Actividades: ${total}`);
  return course;
}

// â”€â”€â”€ CALENDARIO / FECHAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function extractDeadlines(page) {
  log('ðŸ“… Extrayendo fechas limite...');

  // Try the upcoming page first
  await page.goto(`${BASE_URL}/zajuna/calendar/view.php?view=upcoming`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { log('Timeout waitForLoadState'); }

  const deadlines = await safeEvaluate(page, () => {
    const events = document.querySelectorAll('.event, .calendar_event, tr');
    const result = [];
    events.forEach(ev => {
      const text = ev.textContent.trim();
      if (text.includes('Vencimiento') || text.includes('venc')) {
        // Try to find date
        const dateEl = ev.querySelector('.date, .col-date, [data-date], time');
        let dateStr = dateEl ? dateEl.textContent.trim() : '';
        if (!dateStr) {
          // Try finding date in row cells
          const cells = ev.querySelectorAll('td');
          if (cells.length >= 2) dateStr = cells[0].textContent.trim();
        }
        result.push({
          nombre: text.replace(/Vencimiento de\s*/i, '').substring(0, 120),
          fecha_texto: dateStr,
          es_vencimiento: true
        });
      }
    });
    return result;
  });

  // Also check the course page for inline dates
  await page.goto(COURSE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { log('Timeout waitForLoadState'); }

  const inlineDates = await safeEvaluate(page, () => {
    const result = [];
    const activities = document.querySelectorAll('.activity');
    activities.forEach(act => {
      const link = act.querySelector('a');
      const instance = act.querySelector('.instancename');
      const text = instance ? instance.textContent.trim() : (link ? link.textContent.trim() : '');

      // Look for date text in siblings or after the activity
      const parent = act.parentElement;
      if (parent) {
        const fullText = parent.textContent;
        // Match dates like "lunes, 7 de julio de 2026" or "07/07/2026" etc.
        const dateMatch = fullText.match(/(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})|(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
          result.push({ actividad: text.substring(0, 80), fecha: dateMatch[0] });
        }
      }
    });
    return result;
  });

  log(`   Deadlines: ${deadlines.length}, Inline dates: ${inlineDates.length}`);
  return { deadlines, inlineDates };
}

// â”€â”€â”€ CALIFICACIONES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function extractGrades(page) {
  log('ðŸ“Š Extrayendo calificaciones...');
  await page.goto(`${BASE_URL}/zajuna/grade/report/user/index.php?id=${COURSE_ID}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { log('Timeout waitForLoadState'); }

  const grades = await safeEvaluate(page, () => {
    const rows = document.querySelectorAll('table.generaltable tr, .user-grade tr');
    return Array.from(rows).slice(1).map(row => {
      const cells = row.querySelectorAll('td, th');
      const texts = Array.from(cells).map(c => c.textContent.trim()).filter(t => t && t !== '-');
      return texts.length >= 2 ? { item: texts[0].substring(0, 80), valores: texts.slice(1) } : null;
    }).filter(Boolean);
  });

  log(`   Registros de calificacion: ${grades.length}`);
  return grades;
}

// â”€â”€â”€ EXTRAER CRONOGRAMA Y FECHAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function extractCronograma(page) {
  log('ðŸ“… Extrayendo cronograma...');

  // Buscar pagina del cronograma en el curso
  await page.goto(COURSE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { log('Timeout waitForLoadState'); }

  const cronogramaUrl = await safeEvaluate(page, () => {
    const links = document.querySelectorAll('.activity a');
    for (const a of links) {
      if (a.textContent.toLowerCase().includes('cronograma')) return a.href;
    }
    return null;
  });

  if (!cronogramaUrl) {
    log('   No se encontro pagina de cronograma');
    return null;
  }

  await page.goto(cronogramaUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { log('Timeout waitForLoadState'); }

  const fullText = await safeEvaluate(page, () => document.body.innerText, "");

  const inicioMatch = fullText.match(/FECHA DE INICIO:\s*(\d{2}\/\d{2}\/\d{4})/);
  const limiteMatch = fullText.match(/FECHA LÃMITE ENVÃO DE EVIDENCIAS:\s*(\d{2}\/\d{2}\/\d{4})/);
  const cierreMatch = fullText.match(/FECHA DE CIERRE:\s*(\d{2}\/\d{2}\/\d{4})/);

  const cronograma = {
    inicio: inicioMatch ? inicioMatch[1] : null,
    limite_evidencias: limiteMatch ? limiteMatch[1] : null,
    cierre: cierreMatch ? cierreMatch[1] : null,
    actividades: []
  };

  // Parsear tabla de actividades con regex
  const actRegex = /Actividad de aprendizaje (\d+)[:\s]*([\s\S]*?)(?=Actividad de aprendizaje \d|Actividades iniciales|$)/g;
  let m;
  while ((m = actRegex.exec(fullText)) !== null) {
    const num = m[1];
    const bloque = m[2];

    const evidencias = [];
    const evRegex = /Evidencia:\s*(.+?)(?:\s*\.\s*)(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/g;
    let em;
    while ((em = evRegex.exec(bloque)) !== null) {
      evidencias.push({
        nombre: em[1].trim(),
        inicio: em[2],
        fin: em[3]
      });
    }

    cronograma.actividades.push({
      numero: parseInt(num),
      nombre: `Actividad ${num}`,
      evidencias
    });
  }

  log(`   Fechas: inicio=${cronograma.inicio}, limite=${cronograma.limite_evidencias}, cierre=${cronograma.cierre}`);
  log(`   Actividades con fechas: ${cronograma.actividades.length}`);
  return cronograma;
}

// â”€â”€â”€ GENERAR ALERTAS_SENA.md â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateAlertasMD(course, deadlines, inlineDates, cronograma) {
  const lines = [];
  lines.push(`# Alertas SENA - ${course.nombre || 'Curso ' + COURSE_ID}`);
  lines.push(`> Extraido: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
  if (cronograma?.limite_evidencias) {
    lines.push(`> **FECHA LIMITE GLOBAL: ${cronograma.limite_evidencias}**`);
  }
  lines.push('');

  // Cronograma con fechas reales
  if (cronograma?.actividades?.length > 0) {
    lines.push('## Cronograma con Fechas');
    lines.push('');
    const hoy = new Date();

    for (const act of cronograma.actividades) {
      lines.push(`### ${act.nombre}`);
      for (const ev of act.evidencias) {
        try {
          const [d, m, a] = ev.fin.split('/').map(Number);
          const fechaFin = new Date(a, m - 1, d);
          const diasRestantes = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
          const urgente = diasRestantes <= 3;
          const icono = urgente ? 'ðŸ”´' : diasRestantes <= 7 ? 'ðŸŸ¡' : 'ðŸŸ¢';
          lines.push(`- ${icono} **${ev.nombre}** â†’ ${ev.inicio} al ${ev.fin} (${diasRestantes} dias)`);
        } catch {
          lines.push(`- **${ev.nombre}** â†’ ${ev.inicio} al ${ev.fin}`);
        }
      }
      lines.push('');
    }
  }

  // Listar evidencias (tareas + cuestionarios)
  lines.push('## Evidencias del curso');
  lines.push('');
  for (const sec of (course.secciones || [])) {
    const tareas = sec.actividades.filter(a => a.tipo === 'tarea' || a.tipo === 'cuestionario' || a.tipo === 'scorm');
    if (tareas.length === 0) continue;
    lines.push(`### ${sec.nombre}`);
    for (const t of tareas) {
      lines.push(`- [ ] **${t.tipo.toUpperCase()}**: ${t.nombre.replace(/  /g, ' ').trim()}`);
    }
    lines.push('');
  }

  // Vencimientos
  if (deadlines.length > 0 || (inlineDates && inlineDates.length > 0)) {
    lines.push('## Vencimientos proximos');
    lines.push('');
    for (const d of deadlines) {
      lines.push(`- âš  ${d.nombre.replace(/\s+/g, ' ').trim()}${d.fecha_texto ? ' - ' + d.fecha_texto : ''}`);
    }
    if (inlineDates && inlineDates.length > 0) {
      for (const d of inlineDates.slice(0, 5)) {
        lines.push(`- ${d.actividad} â†’ ${d.fecha}`);
      }
    }
    lines.push('');
  }

  const alertasDir = path.join(__dirname, '..', '..', 'data', 'state', 'contexto_maestro');
  ensureDir(alertasDir);
  fs.writeFileSync(path.join(alertasDir, 'ALERTAS_SENA.md'), lines.join('\n'), 'utf8');
  log('   ALERTAS_SENA.md generado');
}

// â”€â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  ensureDir(DATA_DIR);
  log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  log('ðŸŽ“ SENA MOODLE SCRAPER');
  log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

  if (!USER || !PASS) {
    log('âŒ Credenciales no configuradas en .env');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    const ok = await login(page);
    if (!ok) throw new Error('Login fallido');

    const course = await extractCourse(page);
    const cronograma = await extractCronograma(page);
    const { deadlines, inlineDates } = await extractDeadlines(page);
    const grades = await extractGrades(page);

    // Guardar datos
    saveJSON('curso.json', course);
    if (cronograma) saveJSON('cronograma_fechas.json', cronograma);
    const deadlinesData = { deadlines, inlineDates, extraido: new Date().toISOString() };
    saveJSON('deadlines.json', deadlinesData);
    CheckpointStore.set('deadlines', deadlinesData);
    saveJSON('calificaciones.json', { grades, extraido: new Date().toISOString() });

    // Generar ALERTAS_SENA.md con fechas reales
    generateAlertasMD(course, deadlines, inlineDates, cronograma);

    // Guardar historico de ejecuciones
    const historialEntry = {
      fecha: new Date().toISOString(),
      curso: course.nombre,
      total_evidencias: course.secciones.reduce((s, sec) =>
        s + sec.actividades.filter(a => a.tipo === 'tarea').length, 0
      ),
      deadlines_count: deadlines.length,
      grades_count: grades.length
    };
    JobStore.logRun('sena_scraper', 'success', null, historialEntry);

    log('\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    log('âœ… SCRAPING COMPLETADO');
    log(`   Curso: ${course.nombre}`);
    log(`   Ficha: ${course.ficha}`);
    log(`   Secciones: ${course.secciones.length}`);
    log(`   Vencimientos proximos: ${deadlines.length}`);
    log(`   Datos en: ${DATA_DIR}`);
    log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  } catch (err) {
    log(`âŒ Error: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`âŒ Fatal: ${err.message}`); process.exit(1); });

