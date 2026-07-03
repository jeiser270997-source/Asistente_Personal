const { Telegraf, session } = require('telegraf');
const pending = require('./pending');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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
  if (!bot || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Faltan credenciales de Telegram.');
    return;
  }
  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, chunks[i], { parse_mode: 'HTML' });
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`✅ Mensaje enviado a Telegram (${chunks.length} chunk(s)).`);
}

// SOLO iniciar el bot en modo "escucha infinita" si ejecutamos este archivo directamente
if (bot && require.main === module) {
  bot.use(session());
  bot.start((ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return ctx.reply('⛔ No autorizado.');
    return ctx.reply('🤖 Asistente Activo\n/tareas - Lista pendientes\n/ping - Test');
  });
  bot.command('ping', (ctx) => {
    if (String(ctx.from?.id) === String(TELEGRAM_CHAT_ID)) ctx.reply('🏓 Pong!');
  });
  bot.command('tareas', async (ctx) => {
    if (String(ctx.from?.id) === String(TELEGRAM_CHAT_ID)) {
      try {
        const briefing = await pending.formatForBriefing();
        await ctx.reply(briefing, { parse_mode: 'HTML' });
      } catch (e) {
        ctx.reply('❌ Error: ' + e.message);
      }
    }
  });
  bot.launch();
  console.log('🤖 Bot de Telegram escuchando comandos...');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { sendTelegramMessage, bot };
