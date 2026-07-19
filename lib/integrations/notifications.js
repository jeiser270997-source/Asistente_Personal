/**
 * lib/integrations/notifications.js — LifeOS Unified Notification Module
 *
 * Envía alertas a través de múltiples canales:
 *   1. ntfy (push notifications al teléfono) — primario
 *   2. Apprise (multi-canal: Slack, Discord, email, etc.) — secundario
 *   3. Telegram nativo (Telegraf) — fallback
 *
 * Uso:
 *   const { sendNotification } = require('./notifications');
 *   await sendNotification('Título', 'Mensaje', 'info');
 *   await sendNotification('Alerta', 'Mensaje crítico', 'critical');
 */

const APPRISE_URL = process.env.APPRISE_URL || 'http://localhost:8000';
const NTFY_URL = process.env.NTFY_URL || 'http://localhost:8080';
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'lifeos';
const NTFY_TOKEN = process.env.NTFY_TOKEN || '';

/**
 * Envía una notificación a través de todos los canales disponibles.
 * @param {string} title - Título de la notificación
 * @param {string} message - Cuerpo del mensaje (soporta HTML básico)
 * @param {string} [tag='info'] - Tag para enrutamiento: 'info', 'critical', 'warning', 'success'
 * @returns {Promise<boolean>} true si al menos un canal envió exitosamente
 */
async function sendNotification(title, message, tag = 'info') {
  let anySuccess = false;

  // ── Canal 1: ntfy (push directo al teléfono) ──────────────────
  try {
    const ntfyPayload = {
      topic: NTFY_TOPIC,
      title,
      message,
      tags: tag === 'critical' ? ['rotating_light'] : tag === 'warning' ? ['warning'] : ['bell'],
      priority: tag === 'critical' ? 5 : tag === 'warning' ? 4 : 3,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (NTFY_TOKEN) headers['Authorization'] = `Bearer ${NTFY_TOKEN}`;

    const response = await fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(ntfyPayload),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      console.log(`[Notifications] Enviado vía ntfy: "${title}"`);
      anySuccess = true;
    } else {
      console.warn(`[Notifications] ntfy respondió ${response.status}`);
    }
  } catch (error) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      console.warn(`[Notifications] ntfy no disponible (${error.message}).`);
    } else {
      console.warn(`[Notifications] Error ntfy: ${error.message}`);
    }
  }

  // ── Canal 2: Apprise (multi-canal: Slack, Discord, email) ─────
  try {
    const payload = { title, body: message, tag, format: 'html' };
    const response = await fetch(`${APPRISE_URL}/notify/apprise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      console.log(`[Notifications] Enviado vía Apprise: "${title}"`);
      anySuccess = true;
    } else {
      const body = await response.text().catch(() => '');
      console.warn(`[Notifications] Apprise respondió ${response.status}: ${body}`);
    }
  } catch (error) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      console.warn(`[Notifications] Apprise no disponible (${error.message}).`);
    } else {
      console.warn(`[Notifications] Error Apprise: ${error.message}`);
    }
  }

  // ── Canal 3: Telegram nativo (fallback) ────────────────────────
  try {
    const { sendTelegramMessage } = require('./telegram');
    await sendTelegramMessage(`<b>${title}</b>\n\n${message}`);
    anySuccess = true;
    console.log(`[Notifications] Enviado vía Telegram: "${title}"`);
  } catch (fallbackError) {
    console.error(`[Notifications] Telegram falló: ${fallbackError.message}`);
  }

  if (!anySuccess) {
    console.error(`[Notifications] Fallo total: ningún canal disponible para "${title}"`);
  }

  return anySuccess;
}

module.exports = { sendNotification };
