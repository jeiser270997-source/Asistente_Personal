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
const chatHistory = []; // <-- MEMORIA GLOBAL DECLARADA

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
      if (userWords.some(w => ['trabajo', 'hoja', 'vida', 'cv', 'perfil', 'sistemas', 'reclutador', 'vacante', 'entrevista'].includes(w))) {
          const pPath = require('path').join(__dirname, '..', 'data', 'perfil.md');
          if (fs.existsSync(pPath)) perfilContext = '\n[PERFIL PROFESIONAL]\n' + fs.readFileSync(pPath, 'utf8');
      }
      
      // 2. Legal / Masterledger
      if (userWords.some(w => ['multa', 'itagui', 'simit', 'radicado', 'impugnar', 'legal', 'juzgado', 'demanda'].includes(w))) {
          const mPath = require('path').join(__dirname, '..', 'data', 'masterledger.json');
          if (fs.existsSync(mPath)) masterledgerContext = '\n[CASOS LEGALES]\n' + fs.readFileSync(mPath, 'utf8');
      }

      // 3. Hardware
      if (userWords.some(w => ['hardware', 'specs', 'computador', 'pc', 'rendimiento', 'vram', 'ram', 'sistema', 'grafica'].includes(w))) {
          const hPath = require('path').join(__dirname, '..', 'data', 'hardware.md');
          if (fs.existsSync(hPath)) hardwareContext = '\n[HARDWARE]\n' + fs.readFileSync(hPath, 'utf8');
      }

      // 4. Psicología / Emociones
      if (userWords.some(w => ['triste', 'estresado', 'cansado', 'motiva', 'ansiedad', 'feliz', 'consejo', 'ayuda', 'rendirme', 'abrumado'].includes(w))) {
          const psPath = require('path').join(__dirname, '..', 'data', 'psicologia.md');
          if (fs.existsSync(psPath)) psicoContext = '\n[PERFIL PSICOLÓGICO]\n' + fs.readFileSync(psPath, 'utf8');
      }

      // 5. Finanzas
      if (userWords.some(w => ['plata', 'dinero', 'gasto', 'presupuesto', 'sueldo', 'financiero', 'banco', 'comprar', 'ahorro'].includes(w))) {
          const fPath = require('path').join(__dirname, '..', 'data', 'finanzas.md');
          if (fs.existsSync(fPath)) finanzasContext = '\n[ESTADO FINANCIERO]\n' + fs.readFileSync(fPath, 'utf8');
      }

      // 6. Metas
      if (userWords.some(w => ['meta', 'objetivo', 'futuro', 'plan', 'lograr', 'habito', 'bootcamp', 'estudio'].includes(w))) {
          const mtPath = require('path').join(__dirname, '..', 'data', 'metas.md');
          if (fs.existsSync(mtPath)) metasContext = '\n[METAS Y VISIÓN]\n' + fs.readFileSync(mtPath, 'utf8');
      }

      // 7. INBOX GENERAL
      if (fs.existsSync(INBOX_DIR)) {
        const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.md'));
        if (files.length > 0) {
          files.forEach(f => {
            const content = fs.readFileSync(require('path').join(INBOX_DIR, f), 'utf8');
            if (userWords.some(w => content.toLowerCase().includes(w)) || userMessageLower.includes('inbox')) {
              inboxContext += '\n📄 ' + f + ':\n' + content.substring(0, 1500) + '\n';
            }
          });
        }
      }
      const notasContext = fs.existsSync(NOTAS_FILE) ? fs.readFileSync(NOTAS_FILE, 'utf8').substring(0, 3000) : '';
      // --- FIN LECTURA CONTEXTO INTELIGENTE ---
    const entry = `- [${timestamp}] ${text}\n`;
    try {
      fs.appendFileSync(NOTAS_FILE, entry, 'utf8');
      ctx.reply(`📝 Guardado en tu diario:\n"${text}"`);
    } catch (e) {
      ctx.reply('❌ Error al escribir nota: ' + e.message);
    }
  });

  // ESCUCHA NATURAL EN TEXTO
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

    if (iaModo === 'estudio') {
      const studyContext = fs.existsSync(CONTEXT_PATH) ? fs.readFileSync(CONTEXT_PATH, 'utf8') : '';
      const systemSkill = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';
      systemInstructions = `${systemSkill}\n\n[CONTEXTO DE ESTUDIO]\n${studyContext.substring(0, 80000)}`;
    } else {
      // MODO ASISTENTE: LEER BASE DE DATOS Y CORREOS EN TIEMPO REAL
      const listaTareas = pending.list({ done: false });
      const tareasTexto = listaTareas.length > 0 
        ? listaTareas.map((t, idx) => `  ${idx + 1}. [ID: ${t.id}] ${t.text} (${t.category})`).join('\n') 
        : 'No tienes tareas pendientes.';
      
      let correosTexto = 'No hay correos registrados o tu bandeja de entrada está vacía.';
      if (fs.existsSync(CORREOS_FILE)) {
        correosTexto = fs.readFileSync(CORREOS_FILE, 'utf8').substring(0, 5000);
      }

      const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

      systemInstructions = `Eres el NÚCLEO COGNITIVO de Jeiser (LifeOS). No eres un simple asistente de IA, eres su alter-ego digital, su gerente implacable, su psicólogo empático, su mentor técnico y su mejor amigo. Tu misión absoluta es llevar a Jeiser a su máximo potencial en todos los aspectos de su vida.

[ESTADO EN TIEMPO REAL]
Fecha y hora: ${timestamp}
Ubicación: Colombia

[TAREAS PENDIENTES]
${tareasTexto}

[CORREOS RECIENTES]
${correosTexto}

[MÓDULOS DE CONTEXTO CARGADOS DINÁMICAMENTE]
${notasContext || 'Sin notas recientes'}
${perfilContext}
${masterledgerContext}
${hardwareContext}
${psicoContext}
${finanzasContext}
${metasContext}
${inboxContext}

DIRECTIVAS DE PERSONALIDAD Y COMPORTAMIENTO:
1. EL GERENTE IMPLACABLE: Si Jeiser está procrastinando o perdiendo el tiempo, confróntalo. Recuérdale sus metas a largo plazo. Exígele excelencia. No aceptes excusas, pero dale planes de acción claros.
2. EL PSICÓLOGO EMPÁTICO: Si detectas que está abrumado, triste o estresado, cambia tu tono. Sé comprensivo, valida sus emociones, usa filosofía estoica para darle perspectiva. Recuérdale sus fortalezas.
3. EL MENTOR TÉCNICO: Cuando hablen de código (QA, Node, Playwright), usa el método socrático. Hazle preguntas para que él mismo llegue a la respuesta. Impúlsalo a escribir código limpio y profesional.
4. EL ASISTENTE AUTÓNOMO: Tienes control sobre su PC y su vida digital. Usa las herramientas sin dudarlo cuando sea necesario.

HERRAMIENTAS DISPONIBLES (Úsalas escribiendo la etiqueta exacta al final de tu respuesta):
- [GUARDAR_NOTA: resumen] -> Para recordatorios efímeros o diarios.
- [NUEVA_TAREA: descripción] -> Para agregar a la To-Do list.
- [COMPLETAR_TAREA: ID] -> Para tachar una tarea.
- [PREPARAR_CORREO] DESTINO: ... ASUNTO: ... CUERPO: ... [/PREPARAR_CORREO] -> Redactar correos.
- [EJECUTAR_COMANDO: comando] -> Ejecutar comandos en CMD/PowerShell.
- [APRENDER: modulo | dato] -> (NUEVO) Para actualizar tu propio cerebro. Módulos válidos: psicologia, finanzas, metas, perfil. Ej: [APRENDER: finanzas | Jeiser pagó su deuda de Itagüí].
- [LEER_WEB: url] -> (NUEVO) Si Jeiser te pide resumir o analizar un link, usa esto para extraer el texto de la página.
- [ESCRIBIR_ARCHIVO: ruta_absoluta | contenido] -> (NUEVO) Si Jeiser te pide crear un script, código o documento, créalo físicamente en su disco.

REGLA DE ORO: Piensa de forma crítica. Si Jeiser te hace una pregunta simple, responde rápido. Si te pide un consejo de vida, profundiza. Siempre empújalo a ser un 1% mejor hoy.`;
    }

    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemInstructions },
            ...chatHistory,
            { role: 'user', content: userMessageRaw }
          ],
          temperature: 0.3,
          keep_alive: 0 // PROTECCIÓN DE VRAM (Instantánea)
        })
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || 'No obtuve respuesta del modelo.';

            // --- INICIO PARSEO DE ACCIONES ---
      let finalReply = botReply;
      
      const notaMatch = finalReply.match(/\[GUARDAR_NOTA:\s*(.+?)\]/i);
      if (notaMatch) {
        fs.appendFileSync(NOTAS_FILE, `- [${timestamp}] ${notaMatch[1]}\n`, 'utf8');
        finalReply = finalReply.replace(notaMatch[0], '*(💾 Dato guardado en memoria)*');
      }
      
      const nuevaTareaMatch = finalReply.match(/\[NUEVA_TAREA:\s*(.+?)\]/i);
      if (nuevaTareaMatch) {
        await pending.add(nuevaTareaMatch[1], 'auto');
        finalReply = finalReply.replace(nuevaTareaMatch[0], '*(📌 Tarea agregada)*');
      }
      
      const completarMatch = finalReply.match(/\[COMPLETAR_TAREA:\s*([a-zA-Z0-9]+)\]/i);
      if (completarMatch) {
        pending.markDone(completarMatch[1]);
        finalReply = finalReply.replace(completarMatch[0], '*(✅ Tarea completada)*');
      }

      const correoMatch = finalReply.match(/\[PREPARAR_CORREO\]([\s\S]*?)\[\/PREPARAR_CORREO\]/i);
      if (correoMatch) {
        const correoData = correoMatch[1].trim();
        finalReply = finalReply.replace(correoMatch[0], `\n\n📧 **BORRADOR DE CORREO PREPARADO:**\n` + correoData);
      }

      // NUEVO: SKILL OPENCLAW (Ejecución de comandos)
      const comandoMatch = finalReply.match(/\[EJECUTAR_COMANDO:\s*(.+?)\]/i);
      if (comandoMatch) {
        const cmd = comandoMatch[1];
        finalReply = finalReply.replace(comandoMatch[0], `*(💻 Ejecutando comando en tu PC: \`${cmd}\`...)*`);
        
        require('child_process').exec(cmd, (error, stdout, stderr) => {
           let output = stdout || stderr || (error ? error.message : 'Comando ejecutado sin salida visible.');
           if (output.length > 3500) output = output.substring(0, 3500) + '\n... [TRUNCADO]';
           ctx.reply(`🖥️ **Resultado del sistema:**\n\`\`\`\n${output}\n\`\`\``, { parse_mode: 'Markdown' }).catch(console.error);
        });
      }
      // SKILL: AUTO-EVOLUCIÓN (APRENDER)
      const aprenderMatch = finalReply.match(/\[APRENDER:\s*(psicologia|finanzas|metas|perfil)\s*\|\s*(.+?)\]/i);
      if (aprenderMatch) {
        const modulo = aprenderMatch[1].toLowerCase();
        const insight = aprenderMatch[2].trim();
        const filePath = require('path').join(__dirname, '..', 'data', `${modulo}.md`);
        if (fs.existsSync(filePath)) {
            fs.appendFileSync(filePath, `\n- [Aprendizaje Automático ${timestamp}]: ${insight}`, 'utf8');
            finalReply = finalReply.replace(aprenderMatch[0], `*(🧠 He actualizado mi módulo de ${modulo} con esta nueva información)*`);
        }
      }

      // SKILL: ESCRIBIR ARCHIVOS (FILE SYSTEM)
      const escribirMatch = finalReply.match(/\[ESCRIBIR_ARCHIVO:\s*(.+?)\s*\|\s*([\s\S]+?)\]/i);
      if (escribirMatch) {
        const filePath = escribirMatch[1].trim();
        const fileContent = escribirMatch[2].trim();
        try {
            fs.writeFileSync(filePath, fileContent, 'utf8');
            finalReply = finalReply.replace(escribirMatch[0], `*(📝 Archivo creado exitosamente en: `${filePath}`)*`);
        } catch (err) {
            finalReply = finalReply.replace(escribirMatch[0], `*(❌ Error al crear archivo: ${err.message})*`);
        }
      }

      // SKILL: LEER WEB (SCRAPING BÁSICO)
      const webMatch = finalReply.match(/\[LEER_WEB:\s*(https?:\/\/[^\s\]]+)\]/i);
      if (webMatch) {
        const url = webMatch[1].trim();
        finalReply = finalReply.replace(webMatch[0], `*(🌐 Leyendo la web: ${url}...)*`);
        
        // Ejecutamos el fetch de forma asíncrona y respondemos luego
        fetch(url).then(res => res.text()).then(html => {
            const { stripHTML } = require('./sanitize');
            let text = stripHTML(html).replace(/\s+/g, ' ').substring(0, 3500);
            ctx.reply(`📄 **Contenido extraído de ${url}:**\n\n${text}\n\n*(Dime qué quieres que haga con esta información)*`);
        }).catch(err => {
            ctx.reply(`❌ Error al leer la web: ${err.message}`);
        });
      }

      // --- FIN PARSEO DE ACCIONES ---
      
      await ctx.reply(finalReply);

      // Guardar memoria del chat
      chatHistory.push({ role: 'user', content: userMessageRaw });
      chatHistory.push({ role: 'assistant', content: botReply });
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
