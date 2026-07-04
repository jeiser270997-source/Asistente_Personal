const { Telegraf, session } = require('telegraf');
const pending = require('./pending');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están definidos.');
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
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, chunks[i], { parse_mode: 'HTML' });
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`Mensaje enviado exitosamente a Telegram (${chunks.length} chunk(s)).`);
}

// Solo iniciar el bot cuando este módulo se ejecuta directamente
if (require.main === module && bot) {
  bot.use(session());

  bot.start((ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return ctx.reply('⛔ No autorizado.');
    return ctx.reply(
      '🤖 <b>Canal de Notificaciones (Life OS)</b>\n\nComandos disponibles:\n• /start — Menú\n• /tareas — Pendientes\n• /ping — Prueba',
      { parse_mode: 'HTML' }
    );
  });

  bot.command('ping', (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    ctx.reply('🏓 Pong!');
  });

  bot.command('tareas', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    try {
      const briefing = await pending.formatForBriefing();
      await ctx.reply(briefing, { parse_mode: 'HTML' });
    } catch (e) {
      ctx.reply('❌ Error al obtener tareas: ' + e.message);
    }
  });

  bot.launch();
  console.log('🤖 Bot de Telegram (Telegraf) iniciado en modo notificaciones (one-way).');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { sendTelegramMessage, bot };