/**
 * computrabajo_apply.js
 * Auto-aplicador semi-automático a ofertas de Computrabajo.
 * 
 * Flujo:
 *  1. Lee las ofertas de computrabajo.json
 *  2. Calcula score de match con DeepSeek por cada una
 *  3. Envía a Telegram las candidatas (score > 60) con botones Sí/No
 *  4. Espera N segundos por respuesta (timeout = skip)
 *  5. Si aprobó: Playwright hace login + click en Postularme
 *  6. Registra resultado en data/jobs/aplicaciones.json
 * 
 * Uso: node scripts/computrabajo_apply.js [--auto] [--min-score=65]
 *   --auto: aplica sin esperar aprobación Telegram (modo noche)
 *   --min-score: score mínimo para considerar (default 60)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../lib/llm_service');

const BASE_DIR   = path.resolve(__dirname, '..');
const JOBS_DIR   = path.join(BASE_DIR, 'data', 'jobs');
const APPLY_LOG  = path.join(JOBS_DIR, 'aplicaciones.json');
const CV_BASE    = path.join(JOBS_DIR, 'cv_base.md');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';

const AUTO_MODE = process.argv.includes('--auto');
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const APPROVAL_TIMEOUT_MS = 120_000; // 2 min para responder Telegram

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function loadLog() {
  try { return JSON.parse(fs.readFileSync(APPLY_LOG, 'utf8')); }
  catch { return []; }
}

function saveLog(data) {
  fs.writeFileSync(APPLY_LOG, JSON.stringify(data, null, 2), 'utf8');
}

// ─── TELEGRAM ─────────────────────────────────────────────────
async function sendTelegram(text, keyboard = null) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return null;
  const body = {
    chat_id: TELEGRAM_CHAT,
    text,
    parse_mode: 'HTML',
  };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return data.result?.message_id;
}

// Espera respuesta de callback_query durante N ms
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
          // Responder al callback para quitar el "loading"
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: upd.callback_query.id, text: cbData === 'si' ? '✅ Aplicando...' : '⏭ Saltando' }),
          });
          return cbData === 'si';
        }
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return null; // timeout
}

// ─── SCORE MATCH ──────────────────────────────────────────────
async function calcularScore(oferta) {
  const cvBase = fs.existsSync(CV_BASE) ? fs.readFileSync(CV_BASE, 'utf8').substring(0, 1000) : '';
  const prompt = `Puntúa del 0-100 qué tan bien encaja este perfil QA junior con la oferta. Responde SOLO JSON:
{"score":N,"recomendar":true/false,"razon":"una frase corta"}

OFERTA: ${oferta.titulo} | ${oferta.empresa} | ${oferta.lugar}
DESCRIPCIÓN: ${(oferta.cuerpo || oferta.titulo || '').substring(0, 800)}
PERFIL: QA Automation Junior, Playwright, JS, CESDE bootcamp (2026), sin exp formal aún, LifeOS project`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return { score: 55, recomendar: true, razon: 'Score estimado' };
  }
}

// ─── PLAYWRIGHT LOGIN + APPLY ──────────────────────────────────
async function aplicarOferta(browser, ofertaUrl) {
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  const page = await ctx.newPage();
  
  try {
    // Login — múltiples intentos de URL y selector
    log(`   Login Computrabajo...`);
    await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Selectores exactos verificados: #Email y #password
    const emailSel = await page.locator('#Email, input[name="Email"]').first();
    await emailSel.fill(CT_EMAIL, { timeout: 10000 });

    const passSel = await page.locator('#password, input[name="Password"]').first();
    await passSel.fill(CT_PASS, { timeout: 5000 });

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 5000 }).catch(async () => {
      await page.keyboard.press('Enter');
    });
    await page.waitForTimeout(4000);
    log(`   Post-login: ${page.url()}`);

    // Ir a la oferta
    log(`   Navegando a oferta: ${ofertaUrl}`);
    await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Buscar botón Postularme
    const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
    let clicked = false;

    for (const txt of btnTexts) {
      try {
        await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 3000 });
        clicked = true;
        log(`   ✅ Click en "${txt}"`);
        break;
      } catch {}
    }

    if (!clicked) {
      log('   ⚠ Botón "Postularme" no encontrado');
      await ctx.close();
      return { exito: false, razon: 'Botón no encontrado' };
    }

    await page.waitForTimeout(3000);

    // ── Manejar "Preguntas de selección" si aparecen ──────────────
    const tienePreguntas = await page.evaluate(() =>
      document.body.innerText.includes('Preguntas de selección') ||
      document.body.innerText.includes('preguntas de selección')
    );

    if (tienePreguntas) {
      log('   📋 Detectadas preguntas de selección — respondiendo con IA...');
      try {
        // 1. Cédula de Ciudadanía
        await page.locator('label:has-text("Cédula de Ciudadanía")').first().click({ timeout: 3000 }).catch(() => {});

        // 2. Recoger TODAS las preguntas del formulario
        const preguntas = await page.evaluate(() => {
          const result = [];
          // Preguntas con label + textarea/input
          document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
            const label = el.closest('div, section')?.querySelector('p, label, h3, span');
            if (label && el.offsetParent !== null) {
              result.push({ tipo: 'texto', pregunta: label.textContent.trim().substring(0, 200), selector: el.id || el.name || null });
            }
          });
          return result;
        });
        log(`   Textareas encontradas: ${preguntas.length}`);

        // 3. Responder textareas con IA o fallback
        const PERFIL = `Nombre: Jeiser Abraham Gutierrez Torres. CC: 1019156838. Tel: +57 304 461 5613.
Ubicación: Medellín, Villa Eloisa. Experiencia: QA Automation (LifeOS - proyecto propio en producción, Playwright, GitHub Actions, Node.js), Vigilante medios tecnológicos CCTV (Coovisocial 2019-2021), Agente Nivel 1 Iberia/Amadeus (Sitel 2021). Estudios: Bootcamp QA CESDE (en curso), SENA Bases de Datos y Excel.`;

        for (const p of preguntas.slice(0, 6)) {
          let respuesta = '';
          const q = p.pregunta.toLowerCase();

          if (/localidad|barrio|ciudad|vive|reside|ubicaci/.test(q)) {
            respuesta = 'Medellín - Barrio Villa Eloisa, Bloque 25';
          } else if (/académ|estudio|título|educaci|formaci/.test(q)) {
            respuesta = 'Técnico en formación - Análisis y Desarrollo de Software (CESDE, Medellín). Bootcamp QA Automation 28 semanas en curso. SENA: Bases de Datos y Excel (Zajuna).';
          } else if (/contacto|teléfono|celular|número/.test(q)) {
            respuesta = '+57 304 461 5613';
          } else if (/experiencia|cargo|rol|función/.test(q)) {
            respuesta = 'Cuento con experiencia práctica en QA Automation a través de proyecto LifeOS en producción: 12 workflows GitHub Actions, scraping Playwright, integración con APIs y SQLite. Adicional, 2 años como vigilante de medios tecnológicos (CCTV) y experiencia en atención al cliente en call center (Sitel/Iberia, Amadeus GDS).';
          } else if (/iso|norma|certific|calidad|sistema de gesti/.test(q)) {
            respuesta = 'Conocimientos básicos en gestión de calidad adquiridos durante formación en CESDE. Sin certificaciones ISO formales, pero con comprensión de procesos de control de calidad aplicados a software.';
          } else if (/salario|aspira|pretens/.test(q)) {
            respuesta = 'Aspiro al salario promedio del mercado para el cargo, negociable según las condiciones del empleo.';
          } else {
            // Fallback genérico
            respuesta = 'Sí, cuento con las condiciones requeridas para el cargo y estoy disponible para ampliar información.';
          }

          // Llenar el textarea
          const textareas = await page.locator('textarea:visible, input[type="text"]:visible').all();
          for (const ta of textareas) {
            const isEmpty = (await ta.inputValue().catch(() => '')).trim() === '';
            if (isEmpty) {
              await ta.click().catch(() => {});
              await ta.fill(respuesta, { timeout: 3000 }).catch(() => {});
              break;
            }
          }
          await page.waitForTimeout(300);
        }

        // 4. Radios Sí/No — click Sí en todos los grupos sin seleccionar
        const siLabels = await page.locator('label:has-text("Sí"), label:has-text("Si")').all();
        for (const label of siLabels) {
          await label.click({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(150);
        }

        await page.waitForTimeout(800);

        // 5. Submit
        const btnContinuar = page.locator('button:has-text("Continuar"), button:has-text("Enviar"), button:has-text("Postularme"), button[type="submit"]').first();
        await btnContinuar.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(4000);
        log('   ✅ Preguntas respondidas y enviadas');
      } catch (e) {
        log(`   ⚠ Error en preguntas: ${e.message.substring(0, 100)}`);
      }
    }

    // ── Verificar confirmación final ───────────────────────────────
    const confirmado = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('postulación') || body.includes('enviada') ||
             body.includes('éxito') || body.includes('aplicación') ||
             body.includes('registrada') || body.includes('¡Gracias') ||
             body.includes('Gracias por') || body.includes('Tu candidatura');
    });

    const screenshot = path.join(JOBS_DIR, `apply_${Date.now()}.png`);
    await page.screenshot({ path: screenshot });

    await ctx.close();
    return {
      exito: confirmado,
      razon: confirmado ? 'Postulación enviada' : 'No se pudo confirmar',
      screenshot
    };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 100) };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  log('═══════════════════════════════════════');
  log(`💼 COMPUTRABAJO AUTO-APPLY (min-score: ${MIN_SCORE}, modo: ${AUTO_MODE ? 'AUTO' : 'SEMI-AUTO'})`);
  log('═══════════════════════════════════════');

  if (!fs.existsSync(path.join(JOBS_DIR, 'computrabajo.json'))) {
    log('❌ No hay datos de Computrabajo. Corre primero: node scripts/computrabajo_scraper.js');
    process.exit(1);
  }

  const { ofertas = [] } = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
  const aplicaciones = loadLog();
  const yaAplicadas = new Set(aplicaciones.map(a => a.oferta_id || a.url));

  // Filtrar las no aplicadas que tienen URL
  const candidatas = ofertas.filter(o => o.url && !yaAplicadas.has(o.id || o.url));
  log(`Ofertas candidatas (no aplicadas): ${candidatas.length}`);

  const browser = await chromium.launch({ headless: true });

  for (const oferta of candidatas.slice(0, 10)) {
    log(`\n📋 Evaluando: "${oferta.titulo}" — ${oferta.empresa}`);

    // Score
    const match = await calcularScore(oferta);
    log(`   Score: ${match.score} | ${match.razon}`);

    if (match.score < MIN_SCORE) {
      log(`   ⏭ Score bajo (${match.score} < ${MIN_SCORE}), saltando`);
      continue;
    }

    let aprobado = AUTO_MODE; // si auto, aplicar directo

    if (!AUTO_MODE && TELEGRAM_TOKEN) {
      // Enviar a Telegram para aprobación
      const msg = `🎯 <b>Oferta QA detectada</b> (score: ${match.score}/100)

<b>${oferta.titulo}</b>
🏢 ${oferta.empresa || 'Empresa'}
📍 ${oferta.lugar || 'Colombia'}

<i>${match.razon}</i>

¿Aplicar automáticamente?`;

      await sendTelegram(msg, [
        [
          { text: '✅ Sí, aplicar', callback_data: 'si' },
          { text: '⏭ Saltar', callback_data: 'no' },
        ]
      ]);

      log(`   📱 Esperando aprobación Telegram (${APPROVAL_TIMEOUT_MS/1000}s)...`);
      const resp = await waitForApproval(APPROVAL_TIMEOUT_MS);

      if (resp === null) {
        log('   ⏱ Timeout — saltando');
        continue;
      }
      aprobado = resp;
    }

    if (!aprobado) {
      log('   ❌ Rechazado por usuario');
      aplicaciones.push({
        oferta_id: oferta.id,
        url: oferta.url,
        titulo: oferta.titulo,
        empresa: oferta.empresa,
        fecha: new Date().toISOString(),
        estado: 'rechazado_usuario',
        score: match.score,
      });
      saveLog(aplicaciones);
      continue;
    }

    // Aplicar
    log(`   🚀 Aplicando a "${oferta.titulo}"...`);
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

    aplicaciones.push(registro);
    saveLog(aplicaciones);

    if (resultado.exito) {
      log(`   ✅ APLICADO: ${oferta.titulo} en ${oferta.empresa}`);
      await sendTelegram(`✅ <b>Aplicación enviada</b>\n${oferta.titulo} — ${oferta.empresa}\n<a href="${oferta.url}">Ver oferta</a>`);
    } else {
      log(`   ⚠ Error aplicando: ${resultado.razon}`);
    }

    await new Promise(r => setTimeout(r, 2000)); // pausa entre aplicaciones
  }

  await browser.close();

  // Resumen final
  const nuevasAplicadas = aplicaciones.filter(a => a.estado === 'aplicado');
  log(`\n✅ Sesión completada. Total aplicaciones: ${nuevasAplicadas.length}`);
  if (nuevasAplicadas.length > 0) {
    await sendTelegram(
      `📊 <b>Resumen Auto-Apply</b>\n${nuevasAplicadas.slice(-5).map(a => `✅ ${a.titulo} — ${a.empresa}`).join('\n')}`
    );
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
