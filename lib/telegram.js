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
// SOLO iniciar el bot en modo "escucha infinita" si ejecutamos este archivo directamente
if (bot && require.main === module) {
  bot.use(session());
  
  bot.start((ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return ctx.reply('⛔ No autorizado.');
    return ctx.reply('🤖 Asistente Activo\n/tareas - Lista pendientes\n/ping - Test\nO simplemente escríbeme cualquier cosa y te responderé.');
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

  // 👇 NUEVO: ESCUCHAR MENSAJES DE TEXTO Y ENVIARLOS A OLLAMA 👇
  bot.on('text', async (ctx) => {
    // 1. Verificar que seas tú (Seguridad)
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;

    // 2. Mostrar que el bot está "escribiendo..."
    await ctx.sendChatAction('typing');

    const userMessage = ctx.message.text;
    const OLLAMA_URL = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/v1').replace(/\/+$/, '') + '/chat/completions';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:latest';

    try {
      // 3. Enviar la pregunta a tu PC local (Ollama)
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: OLLAMA_MODEL, 
          messages: [
            { role: 'system', content: 'Eres el asistente personal de Jeiser. Responde de forma clara, útil y concisa.' },
            { role: 'user', content: userMessage }
          ], 
          temperature: 0.5,
          keep_alive: "30m" // Mantiene el modelo cargado por si sigues chateando
        })
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || 'No obtuve respuesta del modelo local.';

      // 4. Enviarte la respuesta de vuelta a Telegram
      await ctx.reply(botReply);

    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Error al conectar con Ollama en tu PC. ¿Está encendido?');
    }
  });

  bot.launch();
  console.log('🤖 Bot de Telegram escuchando comandos y mensajes...');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
