/**
 * lib/integrations/notifications.js — LifeOS Unified Notification Module
 *
 * Envía alertas a través de Apprise (multi-canal).
 * Si Apprise no está disponible, hace fallback al módulo nativo de Telegram.
 *
 * Uso:
 *   const { sendNotification } = require('./notifications');
 *   await sendNotification('Título', 'Mensaje', 'info');
 */

const APPRISE_URL = process.env.APPRISE_URL || 'http://localhost:8000';

async function sendNotification(title, message, tag = 'lifeos') {
  const payload = { title, body: message, tag, format: 'html' };

  // ── Intento primario: Apprise ──
  try {
    const response = await fetch(`${APPRISE_URL}/notify/apprise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      console.log(`[Notifications] Enviado vía Apprise: "${title}"`);
      return true;
    }

    const body = await response.text().catch(() => '');
    console.warn(`[Notifications] Apprise respondió ${response.status}: ${body}`);
  } catch (error) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      console.warn(`[Notifications] Apprise no disponible (${error.message}). Usando fallback Telegram...`);
    } else {
      console.warn(`[Notifications] Error Apprise: ${error.message}. Usando fallback Telegram...`);
    }
  }

  // ── Fallback: Telegram nativo ──
  try {
    const { sendTelegramMessage } = require('./telegram');
    await sendTelegramMessage(`<b>${title}</b>\n\n${message}`);
    return true;
  } catch (fallbackError) {
    console.error(`[Notifications] Fallo total de notificación: ${fallbackError.message}`);
    return false;
  }
}

module.exports = { sendNotification };
