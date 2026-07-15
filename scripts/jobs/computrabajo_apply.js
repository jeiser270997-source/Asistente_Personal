require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../../lib/ai/llm_service');
const { robustLogin } = require('./ct_login_helper');

const BASE_DIR   = path.resolve(__dirname, '..', '..');
const JOBS_DIR   = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE    = path.join(BASE_DIR, 'data', 'sources', 'jobs', 'cv_base.md');

const AppStore = require('../../runtime/stores/ApplicationStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

const AUTO_MODE = process.argv.includes('--auto');
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=50').split('=')[1]);
const APPROVAL_TIMEOUT_MS = 120_000;

// â”€â”€â”€ Login retry guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MAX_LOGIN_FAILS = 3;
let _loginFailCount = 0;

async function loginWithRetry(page, email, pass) {
  for (let attempt = 1; attempt <= MAX_LOGIN_FAILS; attempt++) {
    const ok = await robustLogin(page, email, pass);
    if (ok) {
      _loginFailCount = 0;
      return true;
    }
    _loginFailCount++;
    log(`âš ï¸ Intento ${attempt}/${MAX_LOGIN_FAILS} de login fallido`);
    if (attempt < MAX_LOGIN_FAILS) {
      await page.waitForTimeout(3000);
    }
  }
  // 3 fallos consecutivos â†’ notificar
  log('âŒ 3 intentos de login fallidos. Notificando...');
  try {
    await sendTelegram(`âš ï¸ <b>Computrabajo: Login fallido</b>\n3 intentos consecutivos de login fallaron.\nPosible causa: selectores desactualizados o credenciales invÃ¡lidas.\nRevisa y ejecuta: node scripts/jobs/login_ct.js --debug`);
  } catch {}
  throw new Error('Login failed after 3 attempts');
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function ledger(tipo, data) {
  LedgerStore.emit(tipo, data);
}


function loadAplicaciones() {
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

function saveAplicacion(registro) {
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
}

// --- TELEGRAM
// â”€â”€â”€ TELEGRAM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function sendTelegram(text, keyboard = null) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return null;
  const body = { chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
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

// ── PERFIL MAESTRO DEL CANDIDATO ──────────────────────────────────────────────
const PERFIL_JEISER = fs.readFileSync(path.join(path.resolve(__dirname, '..', '..'), 'data', 'user', 'perfil_candidato.txt'), 'utf8');

// ── SCORE: detecta salario, horario y call center desde el TEXTO de la oferta ─
async function calcularScore(oferta) {
  const descripcion = (oferta.cuerpo || oferta.descripcion || oferta.titulo || '').substring(0, 2000);

  const prompt = `Eres un evaluador de ofertas laborales para Colombia. Lee el TEXTO de la descripcion y responde SOLO con JSON valido.

OFERTA:
Titulo: ${oferta.titulo}
Empresa: ${oferta.empresa || 'N/A'}
Lugar: ${oferta.lugar || oferta.ciudad || 'N/A'}
Descripcion completa:
${descripcion}

PERFIL DEL CANDIDATO:
${PERFIL_JEISER}

INSTRUCCIONES (lee el texto, no asumas por el titulo):
1. SALARIO: Si dice "salario minimo", "SMMLV", "$1.4" sin bono para tecnologia = insuficiente. Si dice 2.4M+, "a convenir", "segun experiencia" o no menciona = OK.
2. HORARIO: Si menciona sabados, domingos, turnos rotativos, "L-S" = rechazar. Si dice L-V o no menciona = OK.
3. CALL CENTER: Si es SOLO asesor de voz/telemarketing sin componente tecnico = rechazar. Mesa de ayuda tecnica = OK.
4. MATCH: Encaje del candidato con habilidades requeridas (0-100).

Responde EXACTAMENTE con este JSON:
{"score":N,"recomendar":true/false,"requiere_finde":false,"salario_insuficiente":false,"es_call_center":false,"salario_detectado":"texto o null","razon":"frase corta"}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(json);
    if (parsed.requiere_finde) {
      log(`   â›” IA detectÃ³ horario fin de semana: ${oferta.titulo}`);
      return { score: 0, recomendar: false, razon: 'Requiere trabajo en fin de semana (estudia sabados)' };
    }
    return parsed;
  } catch {
    return { score: 55, recomendar: true, razon: 'Score estimado' };
  }
}

// â”€â”€â”€ RESPONDER PREGUNTAS CON IA (CONTEXTUAL) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ PLAYWRIGHT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATE_PATH = require('node:path').join(__dirname, '..', '..', 'data', 'state', 'computrabajo_state.json');

async function aplicarOferta(browser, ofertaUrl) {
  const ctxOpts = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  };

  // Cargar sesiÃ³n guardada si existe (login_ct.js)
  if (require('node:fs').existsSync(STATE_PATH)) {
    try {
      const state = JSON.parse(require('node:fs').readFileSync(STATE_PATH, 'utf8'));
      ctxOpts.storageState = state;
      log(`   SesiÃ³n cargada desde ${STATE_PATH}`);
    } catch (e) {
      log(`   âš  No se pudo cargar sesiÃ³n: ${e.message}. Haciendo login completo...`);
    }
  }

  const ctx  = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();

  try {
    // Intentar ir directo a la oferta (si hay sesiÃ³n guardada, no necesita login)
    let loginOk = true;
    try {
      await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch {
      loginOk = false;
    }

    // Si la sesiÃ³n no sirve o no habÃ­a, hacer login
    if (!loginOk || page.url().includes('acceso') || page.url().includes('Login')) {
      log(`   Haciendo login en Computrabajo...`);
      await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      
      await loginWithRetry(page, CT_EMAIL, CT_PASS);

      // Guardar sesiÃ³n para prÃ³xima vez
      try {
        const ns = await ctx.storageState();
        require('node:fs').writeFileSync(STATE_PATH, JSON.stringify(ns, null, 2));
        log(`   âœ… SesiÃ³n guardada`);
      } catch {}

    } else {
      log(`   SesiÃ³n vÃ¡lida, saltando login`);
    }

    log(`   Navegando a oferta: ${ofertaUrl}`);
    await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
    let clicked = false;
    let externalPage = null;

    for (const txt of btnTexts) {
      try {
        const btn = page.locator(`button:has-text("${txt}"), a:has-text("${txt}")`).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Escuchar por si abre una nueva pestaÃ±a (link externo)
          const [newPage] = await Promise.all([
            ctx.waitForEvent('page', { timeout: 3500 }).catch(() => null),
            btn.click({ timeout: 3000 })
          ]);
          clicked = true;
          log(`   Click en "${txt}"`);
          if (newPage) externalPage = newPage;
          break;
        }
      } catch {}
    }

    if (!clicked) {
      log('   Boton "Postularme" no encontrado');
      await ctx.close();
      return { exito: false, razon: 'Boton no encontrado' };
    }

    // Deteccion de aplicacion externa (Nueva pestaÃ±a)
    if (externalPage) {
      const extUrl = externalPage.url();
      log(`   Detectada redireccion a aplicacion externa en nueva pestaÃ±a: ${extUrl}`);
      await ctx.close();
      return { exito: false, razon: 'Aplicacion externa', external_url: extUrl };
    }

    await page.waitForTimeout(3000);

    // Interceptar si nos mando a login DESPUES de hacer clic en aplicar
    if (page.url().includes('acceso') || page.url().includes('Login')) {
      log('   Se requirio login al intentar aplicar. Iniciando sesion...');
      await loginWithRetry(page, CT_EMAIL, CT_PASS);
      try {
        const ns = await ctx.storageState();
        require('node:fs').writeFileSync(STATE_PATH, JSON.stringify(ns, null, 2));
      } catch {}
      log('   Volviendo a la oferta para re-intentar...');
      await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      for (const txt of btnTexts) {
        try {
          const btn = page.locator(`button:has-text("${txt}"), a:has-text("${txt}")`).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await btn.click({ timeout: 3000 });
            log(`   Re-Click en "${txt}"`);
            break;
          }
        } catch {}
      }
      await page.waitForTimeout(3000);
    }

    // Deteccion de aplicacion externa (Misma pestaÃ±a)
    if (!page.url().includes('computrabajo.com')) {
      const extUrl = page.url();
      log(`   Detectada redireccion a aplicacion externa: ${extUrl}`);
      await ctx.close();
      return { exito: false, razon: 'Aplicacion externa', external_url: extUrl };
    }

    const tienePreguntas = await page.evaluate(() =>
      document.body.innerText.includes('Preguntas de seleccion') ||
      document.body.innerText.includes('preguntas de seleccion')
    );

    if (tienePreguntas) {
      log('   Detectadas preguntas de seleccion â€” respondiendo con IA...');
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

        // Obtener descripciÃ³n de la oferta para contexto de la IA
        const descripcionOferta = await page.evaluate(() => document.body.innerText.substring(0, 1500));

        for (const p of preguntas.slice(0, 6)) {
          log(`   Pregunta detectada: "${p.pregunta.substring(0, 80)}..."`);

          // La IA lee la pregunta + descripcion de la oferta + perfil de Jeiser â†’ responde coherentemente
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

// â”€â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  log(`COMPUTRABAJO AUTO-APPLY (min-score: ${MIN_SCORE}, modo: ${AUTO_MODE ? 'AUTO' : 'SEMI-AUTO'})`);

  if (!fs.existsSync(path.join(JOBS_DIR, 'computrabajo.json'))) {
    log('No hay datos de Computrabajo. Corre primero: node scripts/computrabajo_scraper.js');
    process.exit(1);
  }

  const { ofertas = [] } = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
  let aplicaciones = loadAplicaciones();
  const yaAplicadas = new Set(aplicaciones.map(a => a.url || a.oferta_id));

  const UBICACIONES_OK = /medell[iÃ­]n|antioquia|remoto|remote|virtual|home.?office|work.?from.?home|teletrabajo/i;
  const UBICACIONES_NOK = /bogot[aÃ¡]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eÃ©]|santa marta/i;

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
    log(`\nEvaluando: "${oferta.titulo}" â€” ${oferta.empresa}`);

    const match = await calcularScore(oferta);
    log(`   Score: ${match.score} | ${match.razon}`);

    if (match.score < MIN_SCORE) {
      log(`   Score bajo (${match.score} < ${MIN_SCORE}), saltando`);
      continue;
    }

    let aprobado = AUTO_MODE;

    if (!AUTO_MODE && TELEGRAM_TOKEN) {
      const msg = `ðŸŽ¯ <b>Oferta QA detectada</b> (score: ${match.score}/100)\n\n<b>${oferta.titulo}</b>\nðŸ¢ ${oferta.empresa || 'Empresa'}\nðŸ“ ${oferta.lugar || 'Colombia'}\n\n<i>${match.razon}</i>\n\nAplicar automaticamente?`;

      await sendTelegram(msg, [
        [{ text: 'Si, aplicar', callback_data: 'si' }, { text: 'Saltar', callback_data: 'no' }]
      ]);

      log(`   Esperando aprobacion Telegram (${APPROVAL_TIMEOUT_MS/1000}s)...`);
      const resp = await waitForApproval(APPROVAL_TIMEOUT_MS);

      if (resp === null) {
        log('   Timeout â€” saltando');
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

    if (resultado.external_url) {
      log(`   EXTERNA: ${oferta.titulo} requiere aplicacion manual`);
      await sendTelegram(`âš ï¸ <b>Aplicacion Externa Detectada</b>\n${oferta.titulo} â€” ${oferta.empresa}\nLa empresa requiere aplicar en su propio portal. Hazlo tu mismo aqui:\n<a href="${resultado.external_url}">Abrir portal externo</a>`);
    } else if (resultado.exito) {
      log(`   APLICADO: ${oferta.titulo} en ${oferta.empresa}`);
      await sendTelegram(`âœ… <b>Aplicacion enviada</b>\n${oferta.titulo} â€” ${oferta.empresa}\n<a href="${oferta.url}">Ver oferta</a>`);
    } else {
      log(`   Error aplicando: ${resultado.razon}`);
    }

    const delayMs = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
    log(`   Pausa de seguridad anti-bot de ${delayMs/1000}s...`);
    await new Promise(r => setTimeout(r, delayMs));
  }

  await browser.close();

  const nuevasAplicadas = AppStore.getAll({ source: 'computrabajo', estado: 'aplicado' });
  log(`Sesion completada. Total aplicaciones: ${nuevasAplicadas.length}`);
  if (nuevasAplicadas.length > 0) {
    await sendTelegram(
      `\u{1F4CA} <b>Resumen Auto-Apply</b>\n${nuevasAplicadas.slice(-5).map(a => `\u2705 ${a.cargo || 'Cargo'} \u2014 ${a.empresa || 'Empresa'}`).join('\n')}`
    );
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
