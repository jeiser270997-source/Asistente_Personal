require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const pending = require('../context/pending');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('âš ï¸ TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no estÃ¡n definidos.');
}

const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;

function chunkText(text, maxLen = 4000) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    if (end < text.length) {
      const nlPos = text.lastIndexOf('\n', end);
      if (nlPos > start) end = nlPos;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

async function sendTelegramMessage(text) {
  if (!bot) throw new Error('TELEGRAM_BOT_TOKEN no está definido.');
  if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID no está definido.');
  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    try {
      await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, chunks[i], { parse_mode: 'HTML' });
    } catch (err) {
      if (err.message && err.message.includes('parse entities')) {
        // Fallback: si falla el parseo de HTML en Telegram, enviar texto plano sin etiquetas
        await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, chunks[i]);
      } else {
        throw err;
      }
    }
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`Mensaje enviado exitosamente a Telegram (${chunks.length} chunk(s)).`);
}

// Solo iniciar el bot cuando este módulo se ejecuta directamente
if (require.main === module && bot) {
  bot.use(session());

  bot.start((ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return ctx.reply('â›” No autorizado.');
    return ctx.reply(
      'ðŸ¤– <b>Jarvis â€” Life OS</b>\n\nComandos:\nâ€¢ /start â€” MenÃº\nâ€¢ /tareas â€” Pendientes\nâ€¢ /ping â€” Prueba\n\nðŸ’¬ O simplemente escrÃ­beme y te respondo con IA.',
      { parse_mode: 'HTML' }
    );
  });

  bot.command('ping', (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    ctx.reply('ðŸ“ Pong!');
  });

  bot.command('tareas', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    try {
      const briefing = await pending.formatForBriefing();
      await ctx.reply(briefing, { parse_mode: 'HTML' });
    } catch (e) {
      ctx.reply('âŒ Error al obtener tareas: ' + e.message);
    }
  });

  bot.on('text', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    const msg = ctx.message.text;
    if (msg.startsWith('/')) return; // deja pasar comandos

    try {
      ctx.sendChatAction('typing');
      const { askLLM } = require('../ai/llm_service');
      const response = await askLLM(
        'Eres Jarvis, asistente personal de Jeiser. Responde en espaÃ±ol, sÃ© conciso (max 3-4 lÃ­neas). Conoces su contexto: vive en Colombia, estudia en CESDE, usa GitHub Actions para automatizar su vida.',
        [{ role: 'user', content: msg }]
      );
      const reply = response?.content || 'No pude procesar tu mensaje.';
      await ctx.reply(reply, { parse_mode: 'HTML' });
    } catch (e) {
      ctx.reply('ðŸ’¥ Error: ' + e.message.substring(0, 200));
    }
  });

  bot.launch();
  console.log('ðŸ¤– Bot de Telegram (Telegraf) iniciado en modo notificaciones (one-way).');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { sendTelegramMessage, bot };
