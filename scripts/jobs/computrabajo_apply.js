require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../../lib/ai/llm_service');

const BASE_DIR   = path.resolve(__dirname, '..');
const JOBS_DIR   = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE    = path.join(JOBS_DIR, 'cv_base.md');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let AppStore = null;
let LedgerStore = null;
if (USE_SQLITE) {
  AppStore = require('../../runtime/stores/ApplicationStore');
  LedgerStore = require('../../runtime/stores/LedgerStore');
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';

const AUTO_MODE = process.argv.includes('--auto');
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const APPROVAL_TIMEOUT_MS = 120_000;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function ledger(tipo, data) {
  if (USE_SQLITE) LedgerStore.emit(tipo, data);
}

// ─── JSON fallback ─────────────────────────────────────────────
function loadLogJson() {
  try { return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'aplicaciones.json'), 'utf8')); }
  catch { return []; }
}

function saveLogJson(data) {
  fs.writeFileSync(path.join(JOBS_DIR, 'aplicaciones.json'), JSON.stringify(data, null, 2), 'utf8');
}

function loadAplicaciones() {
  if (USE_SQLITE) {
    const apps = AppStore.getAll({ source: 'computrabajo' });
    return apps.map(a => ({
      oferta_id: a.id,
      url: a.url,
      titulo: a.cargo,
      empresa: a.empresa,
      lugar: a.extra_data?.lugar || a.detalles,
      fecha: a.fecha_aplicacion,
      score: a.evaluacion?.score,
      estado: a.estado,
      razon: a.extra_data?.razon,
    }));
  }
  return loadLogJson();
}

function saveAplicacion(registro) {
  if (USE_SQLITE) {
    AppStore.create({
      id: registro.oferta_id,
      source: 'computrabajo',
      empresa: registro.empresa,
      cargo: registro.titulo,
      url: registro.url,
      fecha_aplicacion: registro.fecha,
      estado: registro.estado,
      score: registro.score,
      extra_data: { lugar: registro.lugar, razon: registro.razon, screenshot: registro.screenshot },
      historial: [{ fecha: new Date().toISOString(), evento: `estado_${registro.estado}` }],
    });
    ledger('aplicacion_creada', { oferta_id: registro.oferta_id, empresa: registro.empresa, titulo: registro.titulo, estado: registro.estado });
    return;
  }
  const apps = loadLogJson();
  apps.push(registro);
  saveLogJson(apps);
}

// ─── TELEGRAM ─────────────────────────────────────────────────
async function sendTelegram(text, keyboard = null) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return null;
  const body = { chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return data.result?.message_id;
}

async function waitForApproval(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?timeout=10&allowed_updates=["callback_query"]`);
    const data = await r.json();
    const updates = data.result || [];
    for (const upd of updates) {
      if (upd.callback_query) {
        const cbData = upd.callback_query.data;
        const chatId = upd.callback_query.message?.chat?.id?.toString();
        if (chatId === TELEGRAM_CHAT?.toString()) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: upd.callback_query.id, text: cbData === 'si' ? 'Aplicando...' : 'Saltando' }),
          });
          return cbData === 'si';
        }
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}

// ─── PERFIL MAESTRO DEL CANDIDATO ──────────────────────────────
const PERFIL_JEISER = `
NOMBRE: Jeiser Abraham Gutierrez Torres
CC: 1019156838 | Telefono: +57 304 461 5613 | Email: jeiser270997@gmail.com
UBICACION: Medellin, Antioquia (Barrio Villa Eloisa)
VEHICULO: Tiene vehiculo propio (carro), por lo que no tiene restricciones de movilidad en Medellin y su area metropolitana.
DISPONIBILIDAD HORARIA: Lunes a Viernes (estudia los sabados en CESDE, no puede trabajar los sabados).
ASPIRACION SALARIAL: Salario minimo legal vigente o segun promedio del mercado para el cargo, negociable.
FORMACION:
  - Tecnico en Analisis y Desarrollo de Software (CESDE, Medellin) - En curso 2026
  - Bootcamp QA Automation 28 semanas (Playwright, GitHub Actions, Node.js) - CESDE
  - Bases de Datos y Excel Avanzado - SENA (Zajuna)
EXPERIENCIA:
  1. QA Automation Engineer - Proyecto LifeOS (propio, en produccion): Playwright, Node.js, GitHub Actions, SQLite, integracion APIs REST, CI/CD.
  2. Agente Soporte Nivel 1 (Mesa de Ayuda) - Sitel/Iberia/Amadeus GDS (2021): atencion al usuario, tickets, SLA, sistema GDS.
  3. Auxiliar de Sistemas / Operador CCTV - Coovisocial (2019-2021): monitoreo sistemas de seguridad, diagnostico de fallas, informes de incidentes.
SKILLS TECNICOS: Playwright, Node.js, JavaScript, GitHub Actions, SQLite, APIs REST, Git, Microsoft Office (Excel Avanzado), Windows 10/11, Redes basicas TCP/IP, GDS Amadeus.
IDIOMAS: Espanol nativo, Ingles B1-B2 (lectura tecnica fluida).
`;

// ─── SCORE + DETECTOR DE FIN DE SEMANA (IA) ─────────────────────
async function calcularScore(oferta) {
  const cvBase = fs.existsSync(CV_BASE) ? fs.readFileSync(CV_BASE, 'utf8').substring(0, 800) : '';
  const prompt = `Eres un evaluador de ofertas de trabajo para Colombia. Analiza la siguiente oferta y responde EXCLUSIVAMENTE con un JSON valido.

OFERTA:
Titulo: ${oferta.titulo}
Empresa: ${oferta.empresa}
Lugar: ${oferta.lugar}
Descripcion completa: ${(oferta.cuerpo || oferta.titulo || '').substring(0, 1200)}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

EVALUA:
1. Que tan bien encaja el candidato (0-100).
2. Si la oferta menciona horario de sabados, domingos, fines de semana, turnos rotativos o disponibilidad de 6 dias. Si la descripcion no especifica horario, asume que es Lunes-Viernes.

Responde SOLO con este JSON:
{"score":N,"recomendar":true/false,"requiere_finde":false,"razon":"una frase corta"}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(json);
    if (parsed.requiere_finde) {
      log(`   ⛔ IA detectó horario fin de semana: ${oferta.titulo}`);
      return { score: 0, recomendar: false, razon: 'Requiere trabajo en fin de semana (estudia sabados)' };
    }
    return parsed;
  } catch {
    return { score: 55, recomendar: true, razon: 'Score estimado' };
  }
}

// ─── RESPONDER PREGUNTAS CON IA (CONTEXTUAL) ────────────────────
async function responderPreguntaConIA(pregunta, descripcionOferta) {
  const prompt = `Eres el asistente de Jeiser, un candidato aplicando a una oferta de trabajo en Colombia. 
Responde la siguiente pregunta del formulario de postulacion de forma profesional, concisa y coherente con el perfil del candidato y la descripcion de la oferta. 
Maximo 2 oraciones. Sin saludos. Sin presentaciones. Solo la respuesta directa.

DESCRIPCION DE LA OFERTA:
${(descripcionOferta || '').substring(0, 600)}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

PREGUNTA DEL RECLUTADOR:
${pregunta}

RESPUESTA:`;

  try {
    const res = await askLLM(prompt, [], 0.3);
    return (res.content || '').trim().replace(/^["']|["']$/g, '');
  } catch {
    return 'Si, cumplo con los requisitos del cargo y me encuentro disponible para una entrevista.';
  }
}

// ─── PLAYWRIGHT ────────────────────────────────────────────────
async function aplicarOferta(browser, ofertaUrl) {
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  const page = await ctx.newPage();

  try {
    log(`   Login Computrabajo...`);
    await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const emailSel = await page.locator('#Email, input[name="Email"]').first();
    await emailSel.fill(CT_EMAIL, { timeout: 10000 });

    const passSel = await page.locator('#password, input[name="Password"]').first();
    await passSel.fill(CT_PASS, { timeout: 5000 });

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 5000 }).catch(async () => {
      await page.keyboard.press('Enter');
    });
    await page.waitForTimeout(4000);
    log(`   Post-login: ${page.url()}`);

    log(`   Navegando a oferta: ${ofertaUrl}`);
    await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
    let clicked = false;

    for (const txt of btnTexts) {
      try {
        await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 3000 });
        clicked = true;
        log(`   Click en "${txt}"`);
        break;
      } catch {}
    }

    if (!clicked) {
      log('   Boton "Postularme" no encontrado');
      await ctx.close();
      return { exito: false, razon: 'Boton no encontrado' };
    }

    await page.waitForTimeout(3000);

    const tienePreguntas = await page.evaluate(() =>
      document.body.innerText.includes('Preguntas de seleccion') ||
      document.body.innerText.includes('preguntas de seleccion')
    );

    if (tienePreguntas) {
      log('   Detectadas preguntas de seleccion — respondiendo con IA...');
      try {
        await page.locator('label:has-text("Cedula de Ciudadania")').first().click({ timeout: 3000 }).catch(() => {});

        const preguntas = await page.evaluate(() => {
          const result = [];
          document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
            const label = el.closest('div, section')?.querySelector('p, label, h3, span');
            if (label && el.offsetParent !== null) {
              result.push({ tipo: 'texto', pregunta: label.textContent.trim().substring(0, 200), selector: el.id || el.name || null });
            }
          });
          return result;
        });
        log(`   Textareas encontradas: ${preguntas.length}`);

        // Obtener descripción de la oferta para contexto de la IA
        const descripcionOferta = await page.evaluate(() => document.body.innerText.substring(0, 1500));

        for (const p of preguntas.slice(0, 6)) {
          log(`   Pregunta detectada: "${p.pregunta.substring(0, 80)}..."`);

          // La IA lee la pregunta + descripcion de la oferta + perfil de Jeiser → responde coherentemente
          const respuesta = await responderPreguntaConIA(p.pregunta, descripcionOferta);
          log(`   Respuesta IA: "${respuesta.substring(0, 80)}..."`);

          const textareas = await page.locator('textarea:visible, input[type="text"]:visible').all();
          for (const ta of textareas) {
            const isEmpty = (await ta.inputValue().catch(() => '')).trim() === '';
            if (isEmpty) {
              await ta.click().catch(() => {});
              await ta.fill(respuesta, { timeout: 3000 }).catch(() => {});
              break;
            }
          }
          await page.waitForTimeout(400);
        }

        const siLabels = await page.locator('label:has-text("Si"), label:has-text("Si")').all();
        for (const label of siLabels) {
          await label.click({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(150);
        }

        await page.waitForTimeout(800);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(600);

        const btnContinuar = page.locator(
          'button:has-text("Enviar mi HdV"), button:has-text("Enviar mi"), ' +
          'button:has-text("Continuar"), button:has-text("Enviar"), ' +
          'button:has-text("Postularme"), button[type="submit"]'
        ).last();
        await btnContinuar.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        const btnText = await btnContinuar.textContent().catch(() => 'n/a');
        log(`   Clickeando: "${btnText.trim()}"`);
        await btnContinuar.click({ timeout: 5000, force: true }).catch(async () => {
          log('   Click fallo, intentando Enter...');
          await page.keyboard.press('Enter');
        });
        await page.waitForTimeout(5000);
        log(`   URL post-submit: ${page.url()}`);
        log('   Preguntas respondidas y enviadas');

      } catch (e) {
        log(`   Error en preguntas: ${e.message.substring(0, 100)}`);
      }
    }

    const confirmado = await page.evaluate(() => {
      const body = document.body.innerText;
      const url  = window.location.href;
      return body.includes('postulacion') || body.includes('enviada') ||
             body.includes('exito') || body.includes('registrada') ||
             body.includes('Gracias') || body.includes('Gracias por') ||
             body.includes('Tu candidatura') || body.includes('inscripcion') ||
             body.includes('Mis aplicaciones') ||
             url.includes('candidate/kq') ||
             url.includes('candidate/applications') ||
             url.includes('mis-aplicaciones');
    });

    const screenshot = path.join(JOBS_DIR, `apply_${Date.now()}.png`);
    await page.screenshot({ path: screenshot });

    await ctx.close();
    return {
      exito: confirmado,
      razon: confirmado ? 'Postulacion enviada' : 'No se pudo confirmar',
      screenshot
    };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 100) };
  }
}

// ─── MAIN ──────────────────────────────────────────────────────
async function main() {
  log(`COMPUTRABAJO AUTO-APPLY (min-score: ${MIN_SCORE}, modo: ${AUTO_MODE ? 'AUTO' : 'SEMI-AUTO'})`);

  if (!fs.existsSync(path.join(JOBS_DIR, 'computrabajo.json'))) {
    log('No hay datos de Computrabajo. Corre primero: node scripts/computrabajo_scraper.js');
    process.exit(1);
  }

  const { ofertas = [] } = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
  let aplicaciones = loadAplicaciones();
  const yaAplicadas = new Set(aplicaciones.map(a => a.url || a.oferta_id));

  const UBICACIONES_OK = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|work.?from.?home|teletrabajo/i;
  const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa marta/i;

  const candidatas = ofertas.filter(o => {
    if (!o.url || yaAplicadas.has(o.id || o.url)) return false;
    const lugar = (o.lugar || o.ciudad || o.ubicacion || o.titulo || '').toLowerCase();
    const url   = (o.url || '').toLowerCase();
    const texto = lugar + ' ' + url;
    if (UBICACIONES_NOK.test(texto) && !UBICACIONES_OK.test(texto)) return false;
    return true;
  });
  log(`Ofertas candidatas (no aplicadas, ubicacion OK): ${candidatas.length}`);

  const browser = await chromium.launch({ headless: true });

  for (const oferta of candidatas.slice(0, 10)) {
    log(`\nEvaluando: "${oferta.titulo}" — ${oferta.empresa}`);

    const match = await calcularScore(oferta);
    log(`   Score: ${match.score} | ${match.razon}`);

    if (match.score < MIN_SCORE) {
      log(`   Score bajo (${match.score} < ${MIN_SCORE}), saltando`);
      continue;
    }

    let aprobado = AUTO_MODE;

    if (!AUTO_MODE && TELEGRAM_TOKEN) {
      const msg = `🎯 <b>Oferta QA detectada</b> (score: ${match.score}/100)\n\n<b>${oferta.titulo}</b>\n🏢 ${oferta.empresa || 'Empresa'}\n📍 ${oferta.lugar || 'Colombia'}\n\n<i>${match.razon}</i>\n\nAplicar automaticamente?`;

      await sendTelegram(msg, [
        [{ text: 'Si, aplicar', callback_data: 'si' }, { text: 'Saltar', callback_data: 'no' }]
      ]);

      log(`   Esperando aprobacion Telegram (${APPROVAL_TIMEOUT_MS/1000}s)...`);
      const resp = await waitForApproval(APPROVAL_TIMEOUT_MS);

      if (resp === null) {
        log('   Timeout — saltando');
        continue;
      }
      aprobado = resp;
    }

    if (!aprobado) {
      log('   Rechazado por usuario');
      saveAplicacion({
        oferta_id: oferta.id,
        url: oferta.url,
        titulo: oferta.titulo,
        empresa: oferta.empresa,
        lugar: oferta.lugar,
        fecha: new Date().toISOString(),
        estado: 'rechazado_usuario',
        score: match.score,
      });
      ledger('aplicacion_rechazada', { oferta_id: oferta.id, empresa: oferta.empresa, titulo: oferta.titulo, score: match.score });
      continue;
    }

    log(`   Aplicando a "${oferta.titulo}"...`);
    const resultado = await aplicarOferta(browser, oferta.url);

    const registro = {
      oferta_id: oferta.id,
      url: oferta.url,
      titulo: oferta.titulo,
      empresa: oferta.empresa,
      lugar: oferta.lugar,
      fecha: new Date().toISOString(),
      score: match.score,
      estado: resultado.exito ? 'aplicado' : 'error',
      razon: resultado.razon,
      screenshot: resultado.screenshot,
    };

    saveAplicacion(registro);
    ledger('aplicacion_' + (resultado.exito ? 'enviada' : 'fallida'), { ...registro });

    if (resultado.exito) {
      log(`   APLICADO: ${oferta.titulo} en ${oferta.empresa}`);
      await sendTelegram(`✅ <b>Aplicacion enviada</b>\n${oferta.titulo} — ${oferta.empresa}\n<a href="${oferta.url}">Ver oferta</a>`);
    } else {
      log(`   Error aplicando: ${resultado.razon}`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  const nuevasAplicadas = USE_SQLITE
    ? AppStore.getAll({ source: 'computrabajo', estado: 'aplicado' })
    : loadLogJson().filter(a => a.estado === 'aplicado');
  log(`Sesion completada. Total aplicaciones: ${nuevasAplicadas.length}`);
  if (nuevasAplicadas.length > 0) {
    await sendTelegram(
      `📊 <b>Resumen Auto-Apply</b>\n${nuevasAplicadas.slice(-5).map(a => `✅ ${a.titulo} — ${a.empresa}`).join('\n')}`
    );
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
