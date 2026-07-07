/**
 * skills/job_apply_ct.js
 *
 * Skill: Aplica a ofertas de Computrabajo.
 *
 * Trigger: job.cv.ready
 * Input: { titulo, empresa, url, cv_path }
 * Output: job.applied | job.apply.failed
 *
 * Niveles:
 *   1 (default) → abre link en browser, deja que el usuario confirme
 *   2 (semi-auto) → Playwright hace login + postular + preguntas
 *   3 (full-auto) → sin intervención
 *
 * Configurar con env: APPLY_LEVEL=1|2|3
 */
const bus = require('../lib/events/event_bus');
const path = require('path');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS = process.env.COMPUTRABAJO_PASS;
const APPLY_LEVEL = parseInt(process.env.APPLY_LEVEL || '1', 10);

let chromium = null;

module.exports = {
  name: 'job_apply_ct',
  description: 'Aplica a ofertas de Computrabajo (nivel 1-3)',
  trigger: 'job.cv.ready',
  input: ['url'],
  version: '1.0.0',

  async run({ payload }) {
    const { titulo, empresa, url, cv_path, score } = payload;

    if (!url || !url.includes('computrabajo.com')) {
      return null;
    }

    if (!CT_PASS) {
      bus.emit('job.apply.failed', {
        titulo, empresa, url, razon: 'COMPUTRABAJO_PASS no configurado',
      }, { source: 'skill.job_apply_ct', priority: 'normal' });
      return {
        event: 'job.apply.failed',
        payload: { titulo, empresa, razon: 'credenciales faltantes' },
      };
    }

    if (APPLY_LEVEL === 1) {
      // Nivel 1: solo notificar con link
      bus.emit('job.apply.ready', {
        titulo, empresa, url, cv_path, score,
        mensaje: `Listo para aplicar a ${titulo} en ${empresa}: ${url}`,
      }, { source: 'skill.job_apply_ct', priority: 'normal' });

      return {
        event: 'job.apply.ready',
        payload: { titulo, empresa, url },
      };
    }

    // Nivel 2+: Playwright automático
    if (!chromium) {
      try {
        chromium = require('playwright').chromium;
      } catch {
        return {
          event: 'job.apply.failed',
          payload: { titulo, empresa, razon: 'playwright no instalado' },
        };
      }
    }

    const browser = await chromium.launch({ headless: true }).catch(() => null);
    if (!browser) {
      return {
        event: 'job.apply.failed',
        payload: { titulo, empresa, razon: 'browser no disponible' },
      };
    }

    let resultado;
    try {
      const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      });
      const page = await ctx.newPage();

      // Login
      await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
      await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
      await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(async () => { await page.keyboard.press('Enter'); });
      await page.waitForTimeout(4000);

      // Ir a la oferta
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      // Click Postularme
      const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
      let clicked = false;
      for (const txt of btnTexts) {
        try { await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 3000 }); clicked = true; break; } catch {}
      }

      if (!clicked) {
        resultado = { exito: false, razon: 'Boton no encontrado' };
      } else {
        await page.waitForTimeout(3000);

        // Verificar confirmación
        const confirmado = await page.evaluate(() => {
          const body = document.body.innerText;
          return /postulacion|enviada|exito|registrada|Gracias|Tu candidatura/i.test(body);
        });

        resultado = { exito: confirmado, razon: confirmado ? 'Postulacion enviada' : 'No se pudo confirmar' };
      }

      await ctx.close();
    } catch (e) {
      resultado = { exito: false, razon: e.message.substring(0, 100) };
    } finally {
      await browser.close();
    }

    const eventType = resultado.exito ? 'job.applied' : 'job.apply.failed';
    bus.emit(eventType, {
      titulo, empresa, url, score,
      resultado: resultado.razon,
    }, { source: 'skill.job_apply_ct', priority: 'normal' });

    return {
      event: eventType,
      payload: { titulo, empresa, resultado: resultado.razon },
    };
  },
};
