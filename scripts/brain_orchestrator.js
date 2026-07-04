require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { google } = require('googleapis');
const { sendTelegramMessage } = require('../lib/telegram');
const { escapeHTML, truncate } = require('../lib/sanitize');
const pending = require('../lib/pending');
const { authorize: googleAuthorize } = require('../lib/google_auth');

const BASE_DIR = path.resolve(__dirname, '..');
const LOG_DIR = path.join(BASE_DIR, 'logs');
const CONTEXTO_DIR = path.join(BASE_DIR, 'data', 'contexto_maestro');
const SKILL_PATH = path.join(BASE_DIR, 'skills', 'cerebro.md');
const ESTADO_VIVO_PATH = path.join(CONTEXTO_DIR, 'ESTADO_VIVO.md');
const REGISTRO_ESTUDIO_PATH = path.join(CONTEXTO_DIR, 'REGISTRO_DE_ESTUDIO.md');
const NOTAS_FILE = path.join(BASE_DIR, 'data', 'notas.md');
const ALERTAS_SENA_PATH = path.join(CONTEXTO_DIR, 'ALERTAS_SENA.md');

const COL_HOLIDAYS_2026 = [
  '2026-01-01','2026-01-12','2026-03-23','2026-03-24','2026-03-25',
  '2026-03-26','2026-03-27','2026-03-28','2026-03-29','2026-05-01',
  '2026-05-18','2026-06-01','2026-06-15','2026-07-20','2026-08-07',
  '2026-08-17','2026-10-12','2026-11-02','2026-11-16','2026-12-08',
  '2026-12-25'
];

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function detectTailscaleIP() {
  try {
    const ip = execSync('tailscale ip -4', { encoding: 'utf8', timeout: 5000 }).trim();
    if (ip && /^\d/.test(ip)) return ip;
  } catch {}
  try {
    const host = execSync('hostname', { encoding: 'utf8', timeout: 3000 }).trim();
    return host || 'localhost';
  } catch {
    return 'localhost';
  }
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  ensureLogDir();
  fs.appendFileSync(path.join(LOG_DIR, 'brain_orchestrator.log'), line + '\n');
}

function getColombiaDate() {
  const now = new Date();
  const col = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return col;
}

function determineDayType(date) {
  const dow = date.getDay();
  const dateStr = date.toISOString().split('T')[0];

  if (COL_HOLIDAYS_2026.includes(dateStr)) return 'DomingoFestivo';
  if (dow === 0) return 'DomingoFestivo';
  if (dow === 6) return 'Sábado';
  if (dow === 3) return 'Miércoles-PicoPlaca';
  return 'Normal';
}

function formatDateColombia(date) {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n*/, '');
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    log(`⚠️ No se pudo leer: ${p}`);
    return '';
  }
}

async function authorize() {
  const SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/calendar.readonly'];
  return googleAuthorize(SCOPES);
}

async function fetchRecentEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const query = `in:inbox is:unread after:${Math.floor(oneDayAgo.getTime() / 1000)}`;

  log(`[DEBUG GMAIL] Consultando correos no leídos con query: '${query}'`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const emails = [];
    let pageToken;
    const allMessages = [];

    do {
      const res = await gmail.users.messages.list(
        { userId: 'me', q: query, maxResults: 50, pageToken },
        { signal: controller.signal }
      );
      const batch = res.data.messages || [];
      allMessages.push(...batch);
      pageToken = res.data.nextPageToken;
    } while (pageToken && allMessages.length < 100);

    log(`[DEBUG GMAIL] Respuesta recibida. Mensajes encontrados: ${allMessages.length}`);

    if (allMessages.length === 0) return [];

    for (const msg of allMessages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['From', 'Subject'] });
      const headers = detail.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '?';
      const subject = headers.find(h => h.name === 'Subject')?.value || '?';
      log(`[DEBUG GMAIL] Procesando correo de: ${from} | Asunto: ${subject}`);
      emails.push({ id: msg.id, from, subject });
    }
    return emails;
  } catch (err) {
    if (err.name === 'AbortError') {
      log('⚠️ [GMAIL] Timeout de 15s alcanzado en la consulta de Gmail.');
      return [];
    }
    log(`⚠️ [GMAIL] Error en API: ${err.message}`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCalendarEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20
  });
  return (res.data.items || []).map(e => ({
    summary: e.summary || 'Sin título',
    start: e.start?.dateTime || e.start?.date || '?',
    end: e.end?.dateTime || e.end?.date || '?'
  }));
}

function extractBodyText(msg) {
  const parts = [msg.payload];
  let text = '';
  while (parts.length > 0) {
    const part = parts.shift();
    if (part.parts) parts.push(...part.parts);
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += Buffer.from(part.body.data, 'base64').toString('utf8') + '\n';
    }
  }
  return text.trim();
}

const TRASH_PATTERNS = [
  /descuento/i, /oferta/i, /unsubscribe/i, /newsletter/i,
  /promoción/i, /publicidad/i, /BIG School/i,
  /no\s+responda/i, /notificación\s+de\s+envío/i,
  /código\s+de\s+descuento/i, /black\s+friday/i, /cyber\s+day/i,
];

const IMPORTANT_KEYWORDS = [
  'dian', 'simit', 'cesde', 'sena', 'solvo', 'concentrix',
  'multa', 'comparendo', 'tarea', 'urgente',
  'notificación judicial', 'embargo', 'mandamiento',
  'citación', 'requerimiento',
];

async function processInbox(auth, emails) {
  const gmail = google.gmail({ version: 'v1', auth });
  const importantEmails = [];
  let trashCount = 0;

  for (const msg of emails) {
    const textToCheck = `${msg.from} ${msg.subject}`;

    if (TRASH_PATTERNS.some(p => p.test(textToCheck))) {
      try {
        await gmail.users.messages.delete({ userId: 'me', id: msg.id });
        trashCount++;
        log(`🗑️ Eliminado permanentemente: ${msg.subject}`);
      } catch (err) {
        log(`⚠️ Error al eliminar basura: ${err.message}`);
      }
      continue;
    }

    try {
      await gmail.users.messages.modify({
        userId: 'me', id: msg.id,
        resource: { removeLabelIds: ['UNREAD'] }
      });
    } catch (err) {
      log(`⚠️ Error al marcar como leído: ${err.message}`);
    }

    if (IMPORTANT_KEYWORDS.some(kw => textToCheck.toLowerCase().includes(kw))) {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me', id: msg.id, format: 'full'
        });
        const body = extractBodyText(detail.data);
        importantEmails.push({
          from: msg.from,
          subject: msg.subject,
          snippet: body.substring(0, 800),
        });
        log(`📌 Importante: ${msg.subject}`);
      } catch (err) {
        log(`⚠️ Error extrayendo importante: ${err.message}`);
        importantEmails.push({
          from: msg.from, subject: msg.subject,
          snippet: '(error al extraer contenido)'
        });
      }
    } else {
      log(`📖 Marcado como leído: ${msg.subject}`);
    }
  }

  return { importantEmails, trashCount };
}

async function buildContext(dayType, dateStr, importantEmails, trashCount, events, estadoVivo, registroEstudio, alertasSena, notasMemoria) {
  const trashLine = trashCount > 0 ? `🗑️ [Gmail] ${trashCount} correos basura eliminados automáticamente.` : '[Gmail] Sin basura detectada.';
  const emailBlock = importantEmails.length === 0
    ? '[Gmail] Sin correos importantes en las últimas 24h.'
    : importantEmails.map(e =>
        `📩 ${e.from}\n   Asunto: ${e.subject}\n   Extracto: ${e.snippet.substring(0, 200)}`
      ).join('\n\n');

  const eventsBlock = events.length === 0
    ? 'Sin eventos programados para hoy.'
    : events.map(e => `- ${e.summary} (${e.start} → ${e.end})`).join('\n');

  const estudioBlock = registroEstudio
    ? registroEstudio
    : 'No disponible';
  const senaBlock = alertasSena
    ? alertasSena
    : 'No disponible';
  const pendingBlock = await pending.formatForBriefing();

  return `
FECHA_HOY: ${dateStr}
TIPO_DIA: ${dayType}
${trashLine}
CORREOS_URENTES:
${emailBlock}
EVENTOS_CALENDARIO:
${eventsBlock}
PENDIENTES:
${pendingBlock}
MEMORIA_LARGO_PLAZO (Notas y recordatorios):
${notasMemoria || 'Sin notas'}
ESTADO_VIVO (contexto legal/financiero):
${estadoVivo || 'No disponible'}
REGISTRO_ESTUDIO (horas acumuladas + progreso bootcamp):
${estudioBlock}
ALERTAS_SENA (tareas y vencimientos):
${senaBlock}
`.trim();
}

const LLM_PROVIDERS = [
  // ── Nivel 1: NVIDIA (build.nvidia.com) — mejor calidad de razonamiento ──
  { name: 'NVIDIA DeepSeek V4 Flash', baseUrl: 'https://integrate.api.nvidia.com/v1', apiKey: process.env.NVIDIA_API_KEY, model: 'deepseek-ai/deepseek-v4-flash', retry: 1 },
  { name: 'NVIDIA Nemotron Super 49B', baseUrl: 'https://integrate.api.nvidia.com/v1', apiKey: process.env.NVIDIA_API_KEY, model: 'nvidia/llama-3.3-nemotron-super-49b-v1', retry: 1 },
  // ── Nivel 2: Cerebras (api.cerebras.ai) — velocidad extrema ──
  { name: 'Cerebras GLM-4.7', baseUrl: 'https://api.cerebras.ai/v1', apiKey: process.env.CEREBRAS_API_KEY, model: 'zai-glm-4.7', retry: 1 },
  { name: 'Cerebras Gemma 4 31B', baseUrl: 'https://api.cerebras.ai/v1', apiKey: process.env.CEREBRAS_API_KEY, model: 'gemma-4-31b', retry: 1 },
  // ── Nivel 3: OpenRouter — modelos gratuitos rotativos ──
  { name: 'OpenRouter Free', baseUrl: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY, model: 'openrouter/free', retry: 1 },
  // ── Nivel 4: Gemini 2.5 Flash — tasas generosas gratuitas ──
  { name: 'Gemini 2.5 Flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKey: process.env.GEMINI_API_KEY, model: 'gemini-2.5-flash', retry: 2 },
  // ── Nivel 5: Ollama Local — último recurso ──
  { name: 'Ollama Local', baseUrl: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/v1', apiKey: 'ollama', model: process.env.OLLAMA_MODEL || 'llama3.1:latest', retry: 1 }
].filter(p => p.apiKey && p.apiKey !== 'undefined');

async function callLLM(systemPrompt, userContext) {
  const lastError = {};

  for (const provider of LLM_PROVIDERS) {
    const maxAttempts = (provider.retry ?? 0) + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const url = `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;
        const body = {
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContext }
          ],
          temperature: 0.3,
          max_tokens: 1500,
          format: "json"
        };

        log(`📡 [${provider.name}] Llamando a ${url} (modelo: ${provider.model})`);

        const headers = { 'Content-Type': 'application/json' };
        if (provider.apiKey) {
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errText = await res.text();
          if (attempt < maxAttempts - 1 && (res.status === 429 || res.status >= 500)) {
            const delay = Math.pow(2, attempt + 1) * 1000;
            log(`⚠️ [${provider.name}] Saturación (${res.status}), reintentando en ${delay/1000}s... (${attempt + 1}/${maxAttempts - 1})`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          lastError[provider.name] = `${res.status}: ${errText}`;
          log(`⚠️ [${provider.name}] Falló (${res.status}), probando siguiente...`);
          break;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          log(`✅ [${provider.name}] Respuesta exitosa.`);
          return content;
        }
        lastError[provider.name] = 'Respuesta vacía';
        break;
      } catch (err) {
        if (attempt < maxAttempts - 1) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          log(`⚠️ [${provider.name}] Error de red, reintentando en ${delay/1000}s... (${attempt + 1}/${maxAttempts - 1})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        lastError[provider.name] = err.message;
        log(`⚠️ [${provider.name}] Error: ${err.message}, probando siguiente...`);
        break;
      }
    }
  }

  const details = Object.entries(lastError).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  throw new Error(`Todos los LLM fallaron:\n${details}`);
}

async function run() {
  log('🚀 Iniciando Brain Orchestrator...');
  const now = getColombiaDate();
  const dateStr = formatDateColombia(now);
  const dayType = determineDayType(now);

  try {
    const auth = await authorize();

    const sshIP = detectTailscaleIP();
    // [JARVIS] Mensaje SSH silenciado para evitar spam en Telegram.

    const [rawEmails, events, skillRaw, estadoVivo, registroEstudio, alertasSena, notasMemoria] = await Promise.all([
      fetchRecentEmails(auth),
      fetchCalendarEvents(auth).catch(e => {
        log(`⚠️ [Calendar] ${e.message}`);
        return [];
      }),
      Promise.resolve(readFileSafe(SKILL_PATH)),
      Promise.resolve(readFileSafe(ESTADO_VIVO_PATH)),
      Promise.resolve(readFileSafe(REGISTRO_ESTUDIO_PATH)),
      Promise.resolve(readFileSafe(ALERTAS_SENA_PATH)),
      Promise.resolve(readFileSafe(NOTAS_FILE))
    ]);

    const { importantEmails, trashCount } = await processInbox(auth, rawEmails);

    const systemPrompt = stripFrontmatter(skillRaw || 'Eres el asistente matutino de Jeiser.') + '\n\nIMPORTANTE: Debes responder SIEMPRE con un objeto JSON válido en español con esta estructura exacta (sin markdown, solo JSON plano):\n{\n  "mensaje_telegram": "El reporte detallado para enviar a Telegram...",\n  "nuevas_tareas": ["Descripción tarea 1", "Descripción tarea 2"]\n}';
    const userContext = await buildContext(dayType, dateStr, importantEmails, trashCount, events, estadoVivo, registroEstudio, alertasSena, notasMemoria);

    log(`📋 Contexto preparado: ${dayType}, ${importantEmails.length} importantes, ${trashCount} basura eliminada, ${events.length} eventos`);

    const briefing = await callLLM(systemPrompt, userContext);
    log('✅ Briefing recibido del LLM.');

    let telegramText, nuevasTareas;
    try {
      const parsed = JSON.parse(briefing.trim());
      telegramText = parsed.mensaje_telegram || briefing;
      nuevasTareas = Array.isArray(parsed.nuevas_tareas) ? parsed.nuevas_tareas : [];
    } catch (parseErr) {
      log(`⚠️ No se pudo parsear JSON, usando respuesta cruda: ${parseErr.message}`);
      telegramText = briefing;
      nuevasTareas = [];
    }

    await sendTelegramMessage(truncate(telegramText, 3500));
    log('✅ Briefing enviado por Telegram.');

    for (const tarea of nuevasTareas) {
      await pending.add(tarea, 'auto');
      log(`📌 Tarea añadida: ${tarea}`);
    }
    if (nuevasTareas.length > 0) log(`✅ ${nuevasTareas.length} tarea(s) persistida(s) en pending.json`);

  } catch (err) {
    log(`❌ Error: ${err.message}`);
    try {
      const fallback = `📅 <b>BRIEFING MATUTINO: ${dateStr}</b>\n\n⚠️ <b>Error generando briefing automático:</b>\n<code>${escapeHTML(err.message)}</code>\n\n🔧 Revisa logs en <code>logs/brain_orchestrator.log</code>`;
      await sendTelegramMessage(fallback);
    } catch {}
    process.exit(1);
  }
}

run();



