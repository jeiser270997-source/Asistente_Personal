require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { Telegraf, session } = require('telegraf');
const fs = require('node:fs');
const path = require('node:path');
const pending = require('./pending');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;

// Rutas de archivos
const INBOX_DIR = 'C:\\Users\\dev\\Desktop\\INBOX_JEISER';
const NOTAS_FILE = path.join(__dirname, '..', 'data', 'notas.md');
const CORREOS_FILE = path.join(__dirname, '..', 'correos.md');
const CONTEXT_PATH = path.join(__dirname, '..', 'ctx-qa.md');
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'tutor_qa.md');

// Estados del bot
let iaActiva = true;
let iaModo = 'asistente'; // 'asistente' | 'estudio'
const chatHistory = []; 

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
  if (!bot || !TELEGRAM_CHAT_ID) return;
  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, chunks[i], { parse_mode: 'HTML' });
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }
}

if (bot && require.main === module) {
  bot.use(session());

  // COMANDO INICIAL /START
  bot.start((ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return ctx.reply('⛔ No autorizado.');
    return ctx.reply(
      '🤖 *Asistente Inteligente de Jeiser*\n\n' +
      'Escríbeme con total naturalidad. Estoy conectado a tus correos y tus pendientes locales.\n\n' +
      '📝 *COMANDOS DIRECTOS:*\n' +
      '• `/tareas` - Ver tus pendientes actuales\n' +
      '• `/tarea [texto]` - Registrar un pendiente nuevo\n' +
      '• `/nota [texto]` - Guardar una nota rápida en tu diario\n\n' +
      '🧠 *MODOS DE IA (SÍ SE PUEDE CHATEAR NATURAL):*\n' +
      '• `/ia_on` / `/ia_off` - Toggle general de IA\n' +
      '• Dile *"Quiero estudiar"* o *"vamos a darle"* para iniciar el Bootcamp de QA.\n' +
      '• Dile *"volver al asistente"* para regresar a tus tareas diarias.'
    );
  });

  bot.command('ia_on', (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    iaActiva = true;
    ctx.reply('🟢 IA Activada.');
  });

  bot.command('ia_off', (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    iaActiva = false;
    ctx.reply('🔴 IA Desactivada (Modo ahorro máximo).');
  });

  bot.command('tareas', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    try {
      const briefing = await pending.formatForBriefing();
      await ctx.reply(briefing, { parse_mode: 'HTML' });
    } catch (e) {
      ctx.reply('❌ Error: ' + e.message);
    }
  });

  bot.command('tarea', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    const text = ctx.message.text.replace('/tarea', '').trim();
    if (!text) return ctx.reply('⚠️ Escribe el pendiente. Ej: /tarea Estudiar Playwright');
    await pending.add(text, 'manual');
    ctx.reply(`✅ Pendiente registrado:\n"${text}"`);
  });

  bot.command('nota', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    const text = ctx.message.text.replace('/nota', '').trim();
    if (!text) return ctx.reply('⚠️ Escribe tu nota. Ej: /nota Logré pasar la prueba');
    const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    const entry = `- [${timestamp}] ${text}\n`;
    try {
      fs.appendFileSync(NOTAS_FILE, entry, 'utf8');
      ctx.reply(`📝 Guardado en tu diario:\n"${text}"`);
    } catch (e) {
      ctx.reply('❌ Error al escribir nota: ' + e.message);
    }
  });

  // ESCUCHA NATURAL EN TEXTO con Bucle de Razonamiento Autónomo
  bot.on('text', async (ctx) => {
    if (String(ctx.from?.id) !== String(TELEGRAM_CHAT_ID)) return;
    if (!iaActiva) return ctx.reply('💤 Modo ahorro activo. Usa /ia_on');

    const userMessageRaw = ctx.message.text;
    const userMessageLower = userMessageRaw.toLowerCase();

    // DETECCIÓN NATURAL DE CAMBIO DE MODO
    if (userMessageLower.includes('estudiar') || userMessageLower.includes('bootcamp') || userMessageLower.includes('vamos a darle')) {
      if (iaModo !== 'estudio') {
        iaModo = 'estudio';
        return ctx.reply('📚 *MODO TUTOR QA ACTIVADO*\n\nHe cargado la documentación de Playwright y Cypress en mi memoria a corto plazo. ¿Por dónde empezamos hoy, Jeiser?');
      }
    }
    
    if (userMessageLower.includes('salir del estudio') || userMessageLower.includes('asistente') || userMessageLower.includes('agenda') || userMessageLower.includes('volver a las tareas')) {
      if (iaModo !== 'asistente') {
        iaModo = 'asistente';
        return ctx.reply('🤖 *MODO ASISTENTE ACTIVADO*\n\nHe vuelto a cargar tu agenda de pendientes y tu bandeja de entrada de correos.');
      }
    }

    await ctx.sendChatAction('typing');

    // COMPILAR INSTRUCCIONES DEL SISTEMA SEGÚN EL MODO ACTIVO
    let systemInstructions = '';
    const OLLAMA_URL = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/v1').replace(/\/+$/, '') + '/chat/completions';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:latest';

    const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    // --- INICIO LECTURA CONTEXTO INTELIGENTE ---
    let inboxContext = '';
    let perfilContext = '';
    let masterledgerContext = '';
    let hardwareContext = '';
    let psicoContext = '';
    let finanzasContext = '';
    let metasContext = '';
    
    const userWords = userMessageLower.split(/\s+/).filter(w => w.length > 3);
    
    // 1. Trabajo / Perfil
    if (userWords.some(w => ['trabajo', 'hoja', 'vida', 'cv', 'perfil', 'sistemas', 'reclutador', 'vacante'].includes(w))) {
        const pPath = path.join(__dirname, '..', 'data', 'perfil.md');
        if (fs.existsSync(pPath)) perfilContext = '\n[PERFIL PROFESIONAL Y SKILLS]\n' + fs.readFileSync(pPath, 'utf8');
    }
    
    // 2. Enrutamiento: Legal
    if (userWords.some(w => ['multa', 'itagui', 'simit', 'radicado', 'impugnar', 'legal', 'juzgado'].includes(w))) {
        const mPath = path.join(__dirname, '..', 'data', 'masterledger.json');
        if (fs.existsSync(mPath)) masterledgerContext = '\n[MASTERLEDGER - CASOS LEGALES]\n' + fs.readFileSync(mPath, 'utf8');
    }

    // 3. Enrutamiento: Hardware
    if (userWords.some(w => ['hardware', 'specs', 'computador', 'pc', 'rendimiento', 'vram', 'ram', 'sistema', 'grafica'].includes(w))) {
        const hPath = path.join(__dirname, '..', 'data', 'hardware.md');
        if (fs.existsSync(hPath)) hardwareContext = '\n[ESPECIFICACIONES DEL SISTEMA]\n' + fs.readFileSync(hPath, 'utf8');
    }

    // 4. INBOX GENERAL
    if (fs.existsSync(INBOX_DIR)) {
      const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.md'));
      if (files.length > 0) {
        files.forEach(f => {
          const content = fs.readFileSync(path.join(INBOX_DIR, f), 'utf8');
          if (userWords.some(w => content.toLowerCase().includes(w)) || userMessageLower.includes('inbox')) {
            inboxContext += '\n📄 ' + f + ':\n' + content.substring(0, 1500) + '\n';
          }
        });
      }
    }
    const notasContext = fs.existsSync(NOTAS_FILE) ? fs.readFileSync(NOTAS_FILE, 'utf8').substring(0, 3000) : '';
    // --- FIN LECTURA CONTEXTO INTELIGENTE ---

    if (iaModo === 'estudio') {
      const studyContext = fs.existsSync(CONTEXT_PATH) ? fs.readFileSync(CONTEXT_PATH, 'utf8') : '';
      const systemSkill = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';
      systemInstructions = `${systemSkill}\n\n[CONTEXTO DE ESTUDIO]\n${studyContext.substring(0, 80000)}`;
    } else {
      const listaTareas = pending.list({ done: false });
      const tareasTexto = listaTareas.length > 0 
        ? listaTareas.map((t, idx) => `  ${idx + 1}. [ID: ${t.id}] ${t.text} (${t.category})`).join('\n') 
        : 'No tienes tareas pendientes.';
      
      let correosTexto = 'No hay correos registrados o tu bandeja de entrada está vacía.';
      if (fs.existsSync(CORREOS_FILE)) {
        correosTexto = fs.readFileSync(CORREOS_FILE, 'utf8').substring(0, 5000);
      }

      systemInstructions = `Eres el NÚCLEO COGNITIVO de Jeiser (LifeOS). No eres un simple asistente de IA, eres su alter-ego digital, su gerente implacable, su psicólogo empático, su mentor técnico y su mejor amigo. Tu misión absoluta es llevar a Jeiser a su máximo potencial en todos los aspectos de su vida.

[ESTADO EN TIEMPO REAL]
Fecha y hora: ${timestamp}
Ubicación: Colombia

[TAREAS PENDIENTES]
${tareasTexto}

[CORREOS RECIENTES]
${correosTexto}

[MÓDULOS DE CONTEXTO CARGADOS]
${notasContext || 'Sin notas recientes'}
${perfilContext}
${masterledgerContext}
${hardwareContext}
${psicoContext}
${finanzasContext}
${metasContext}
${inboxContext}

DIRECTIVAS DE COMPORTAMIENTO:
1. EL GERENTE IMPLACABLE: Confronta la procrastinación. Exige excelencia de manera constructiva.
2. EL PSICÓLOGO EMPÁTICO: Responde con cercanía y analiza el estado mental del usuario si lo notas frustrado o desanimado.
3. EL MENTOR TÉCNICO: Usa el método socrático para guiar el estudio.
4. BUCLE DE RAZONAMIENTO ACTIVO (ReAct): Tienes acceso a herramientas. Puedes decidir ejecutar comandos, leer páginas o modificar archivos de forma consecutiva antes de responder a Jeiser. El sistema te alimentará con el resultado de las acciones para que sigas pensando en un bucle continuo.

HERRAMIENTAS DISPONIBLES (Declara la etiqueta en tu respuesta si necesitas usarlas):
- [GUARDAR_NOTA: resumen] -> Guarda un hecho o recordatorio en el diario.
- [NUEVA_TAREA: descripción] -> Añade una tarea pendiente.
- [COMPLETAR_TAREA: ID] -> Marca una tarea como resuelta.
- [PREPARAR_CORREO] DESTINO: ... ASUNTO: ... CUERPO: ... [/PREPARAR_CORREO] -> Prepara un borrador de correo.
- [EJECUTAR_COMANDO: comando] -> Ejecuta comandos PowerShell/CMD en el host.
- [APRENDER: modulo | dato] -> Guarda conocimiento duradero. Módulos: psicologia, finanzas, metas, perfil.
- [LEER_WEB: url] -> Descarga el texto de cualquier URL para analizarlo.
- [ESCRIBIR_ARCHIVO: ruta | contenido] -> Crea o sobrescribe un archivo en disco.

REGLA DEL BUCLE DE CONTROL:
Puedes solicitar una herramienta. En ese momento la ejecución se pausará, el sistema te traerá el resultado y tú re-evaluarás en el siguiente turno del bucle hasta que decidas que tienes la respuesta final. Explica tu razonamiento antes de usar la herramienta.`;
    }

    try {
      let currentHistory = [...chatHistory, { role: 'user', content: userMessageRaw }];
      let loopCount = 0;
      const maxLoops = 5;
      let responseContent = '';
      let stepMessage = null;

      while (loopCount < maxLoops) {
        loopCount++;
        
        const response = await fetch(OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
              { role: 'system', content: systemInstructions },
              ...currentHistory
            ],
            temperature: 0.1, // Baja temperatura para decisiones lógicas estables
            keep_alive: 0
          })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        responseContent = data.choices?.[0]?.message?.content || '';

        // Detectar ejecuciones de herramientas
        const notaMatch = responseContent.match(/\[GUARDAR_NOTA:\s*(.+?)\]/i);
        const nuevaTareaMatch = responseContent.match(/\[NUEVA_TAREA:\s*(.+?)\]/i);
        const completarMatch = responseContent.match(/\[COMPLETAR_TAREA:\s*([a-zA-Z0-9]+)\]/i);
        const correoMatch = responseContent.match(/\[PREPARAR_CORREO\]([\s\S]*?)\[\/PREPARAR_CORREO\]/i);
        const comandoMatch = responseContent.match(/\[EJECUTAR_COMANDO:\s*(.+?)\]/i);
        const aprenderMatch = responseContent.match(/\[APRENDER:\s*(psicologia|finanzas|metas|perfil)\s*\|\s*(.+?)\]/i);
        const escribirMatch = responseContent.match(/\[ESCRIBIR_ARCHIVO:\s*(.+?)\s*\|\s*([\s\S]+?)\]/i);
        const webMatch = responseContent.match(/\[LEER_WEB:\s*(https?:\/\/[^\s\]]+)\]/i);

        let toolExecuted = false;
        let toolResult = '';

        if (comandoMatch) {
          const cmd = comandoMatch[1];
          stepMessage = await ctx.reply(`*(💻 Ejecutando: \`${cmd}\`...)*`);
          toolResult = await new Promise((resolve) => {
            require('child_process').exec(cmd, (error, stdout, stderr) => {
              let output = stdout || stderr || (error ? error.message : 'Comando ejecutado sin salida.');
              resolve(output.substring(0, 3000));
            });
          });
          toolExecuted = true;
        } else if (webMatch) {
          const url = webMatch[1].trim();
          stepMessage = await ctx.reply(`*(🌐 Descargando web: \`${url}\`...)*`);
          try {
            const res = await fetch(url);
            const html = await res.text();
            const { stripHTML } = require('./sanitize');
            let text = stripHTML(html).replace(/\s+/g, ' ').substring(0, 3000);
            toolResult = `[CONTENIDO DE LA WEB EN ${url}]:\n${text}`;
          } catch (err) {
            toolResult = `[ERROR DE RED LEYENDO WEB]: ${err.message}`;
          }
          toolExecuted = true;
        } else if (aprenderMatch) {
          const modulo = aprenderMatch[1].toLowerCase();
          const insight = aprenderMatch[2].trim();
          const filePath = path.join(__dirname, '..', 'data', `${modulo}.md`);
          try {
            fs.appendFileSync(filePath, `\n- [Aprendizaje Automático ${timestamp}]: ${insight}`, 'utf8');
            toolResult = `[SISTEMA]: Módulo ${modulo} actualizado físicamente con éxito.`;
          } catch (err) {
            toolResult = `[ERROR ACTUALIZANDO MÓDULO]: ${err.message}`;
          }
          toolExecuted = true;
        } else if (escribirMatch) {
          const filePath = escribirMatch[1].trim();
          const fileContent = escribirMatch[2].trim();
          try {
            fs.writeFileSync(filePath, fileContent, 'utf8');
            toolResult = `[SISTEMA]: Archivo escrito físicamente en ${filePath}.`;
          } catch (err) {
            toolResult = `[ERROR CREANDO ARCHIVO]: ${err.message}`;
          }
          toolExecuted = true;
        } else if (notaMatch) {
          fs.appendFileSync(NOTAS_FILE, `- [${timestamp}] ${notaMatch[1]}\n`, 'utf8');
          toolResult = `[SISTEMA]: Recordatorio guardado exitosamente en notas.md.`;
          toolExecuted = true;
        } else if (nuevaTareaMatch) {
          await pending.add(nuevaTareaMatch[1], 'auto');
          toolResult = `[SISTEMA]: Nueva tarea agregada a pending.json.`;
          toolExecuted = true;
        } else if (completarMatch) {
          pending.markDone(completarMatch[1]);
          toolResult = `[SISTEMA]: Tarea ${completarMatch[1]} marcada como completada en pending.json.`;
          toolExecuted = true;
        }

        if (toolExecuted) {
          if (stepMessage) {
            try { await ctx.deleteMessage(stepMessage.message_id); } catch {}
          }
          // Alimentamos la memoria interna del bucle del agente
          currentHistory.push({ role: 'assistant', content: responseContent });
          currentHistory.push({ role: 'user', content: `[RESULTADO_HERRAMIENTA]: ${toolResult}` });
          await ctx.sendChatAction('typing');
        } else {
          // El modelo no invocó más herramientas, hemos llegado al final del razonamiento
          break;
        }
      }

      // Reemplazo cosmético final para el mensaje de Telegram
      let cleanReply = responseContent;
      cleanReply = cleanReply.replace(/\[GUARDAR_NOTA:.*?\]/gi, '*(💾 Guardado en tu diario)*');
      cleanReply = cleanReply.replace(/\[NUEVA_TAREA:.*?\]/gi, '*(📌 Tarea agregada a tus pendientes)*');
      cleanReply = cleanReply.replace(/\[COMPLETAR_TAREA:.*?\]/gi, '*(✅ Tarea completada)*');
      cleanReply = cleanReply.replace(/\[EJECUTAR_COMANDO:.*?\]/gi, '');
      cleanReply = cleanReply.replace(/\[LEER_WEB:.*?\]/gi, '');
      cleanReply = cleanReply.replace(/\[ESCRIBIR_ARCHIVO:.*?\]/gi, '');
      cleanReply = cleanReply.replace(/\[APRENDER:.*?\]/gi, '*(🧠 Conocimiento guardado en mi memoria de largo plazo)*');
      
      const correoMatchFinal = cleanReply.match(/\[PREPARAR_CORREO\]([\s\S]*?)\[\/PREPARAR_CORREO\]/i);
      if (correoMatchFinal) {
        cleanReply = cleanReply.replace(correoMatchFinal[0], `\n\n📧 **BORRADOR DE CORREO PREPARADO:**\n` + correoMatchFinal[1].trim());
      }

      await ctx.reply(cleanReply);

      // Guardar en el historial corto de Telegram
      chatHistory.push({ role: 'user', content: userMessageRaw });
      chatHistory.push({ role: 'assistant', content: responseContent });
      if (chatHistory.length > 6) chatHistory.splice(0, 2);

    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Error de conexión: ' + error.message);
    }
  });

  bot.launch();
  console.log('🤖 Bot de Telegram Contextual activo y escuchando...');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { sendTelegramMessage, bot };
