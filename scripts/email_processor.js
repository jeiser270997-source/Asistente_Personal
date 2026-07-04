require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { authorize: googleAuthorize } = require('../lib/google_auth');
const { sendTelegramMessage } = require('../lib/telegram');
const { escapeHTML, truncate } = require('../lib/sanitize');
const pending = require('../lib/pending');
const jobTracker = require('../lib/job_tracker');

const BASE_DIR = path.resolve(__dirname, '..');
const LOG_DIR = path.join(BASE_DIR, 'logs');
const PROCESSED_FILE = path.join(BASE_DIR, 'data', 'processed_emails.json');
const RULES_PATH = path.join(BASE_DIR, 'Herramientas', 'Gmail_Cleaner', 'cleaner_config.json');

const SCOPES = ['https://mail.google.com/'];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  ensureDir(LOG_DIR);
  fs.appendFileSync(path.join(LOG_DIR, 'email_processor.log'), line + '\n');
}

function getColombiaNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

function loadRules() {
  try {
    return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
  } catch {
    log('⚠️ No se pudo cargar cleaner_config.json, usando reglas vacias');
    return [];
  }
}

function loadProcessed() {
  try {
    return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveProcessed(ids) {
  ensureDir(path.dirname(PROCESSED_FILE));
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(ids, null, 2), 'utf8');
}

function shouldTrash(from, subject, rules) {
  const fromLower = (from || '').toLowerCase();
  const subjectLower = (subject || '').toLowerCase();
  for (const rule of rules) {
    const fromMatch = !rule.fromPatterns || rule.fromPatterns.some(p => fromLower.includes(p));
    const subjectMatch = !rule.subjectPatterns || rule.subjectPatterns.some(p => subjectLower.includes(p));
    if (fromMatch && subjectMatch) return rule.reason;
  }
  return null;
}

const IMPORTANT_KEYWORDS = [
  'dian', 'simit', 'cesde', 'sena', 'solvo', 'concentrix',
  'multa', 'comparendo', 'tarea', 'urgente',
  'notificación judicial', 'embargo', 'mandamiento',
  'citación', 'requerimiento', 'entrevista',
  'factura', 'contrato', 'nomina', 'salario',
];

function isImportant(from, subject) {
  const text = `${from} ${subject}`.toLowerCase();
  return IMPORTANT_KEYWORDS.some(kw => text.includes(kw));
}

const JOB_PLATFORMS = [
  { name: 'Computrabajo', fromPattern: 'computrabajo', subjectPatterns: ['postulaci.n recibida', 'has aplicado', 'solicitud recibida', 'confirmaci.n de postulaci.n'] },
  { name: 'LinkedIn', fromPattern: 'linkedin', subjectPatterns: ['application received', 'ha recibido tu solicitud', 'solicitud recibida', 'te has postulado', 'you applied'] },
  { name: 'Indeed', fromPattern: 'indeed', subjectPatterns: ['application submitted', 'solicitud enviada', 'confirmaci.n'] },
];

function detectJobApplication(from, subject, body) {
  const text = `${from} ${subject} ${body || ''}`.toLowerCase();
  for (const plat of JOB_PLATFORMS) {
    if (!text.includes(plat.fromPattern)) continue;
    const subjectMatch = plat.subjectPatterns.some(p => text.includes(p.toLowerCase()));
    if (!subjectMatch) continue;
    return plat.name;
  }
  return null;
}

function parseJobFromEmail(subject, body) {
  const lines = (body || subject || '').split('\n').filter(Boolean);
  let empresa = '?', cargo = '?', url = '';

  const cargoMatch = subject.match(/(?:para|como|aplicado a|apply for|postulado a)\s*(.+?)(?:en|$)/i);
  if (cargoMatch) cargo = cargoMatch[1].trim();

  const empresaMatch = (body || '').match(/(?:empresa|compañía|company|en)\s*:?\s*([^\n]+)/i);
  if (empresaMatch) empresa = empresaMatch[1].trim();

  const urlMatch = (body || '').match(/https?:\/\/[^\s]+(?:vacante|job|oferta|postulacion)[^\s]*/i);
  if (urlMatch) url = urlMatch[0].trim();

  return { empresa, cargo, url };
}

async function fetchUnreadEmails(auth, hoursBack = 6) {
  const gmail = google.gmail({ version: 'v1', auth });
  const now = new Date();
  const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  const query = `in:inbox is:unread after:${Math.floor(since.getTime() / 1000)}`;

  log(`📬 Query: "${query}"`);

  const res = await gmail.users.messages.list({
    userId: 'me', q: query, maxResults: 100
  });

  const messageRefs = res.data.messages || [];
  log(`📬 Encontrados ${messageRefs.length} correos no leidos`);

  if (messageRefs.length === 0) return [];

  const processed = loadProcessed();
  const emails = [];

  for (const ref of messageRefs) {
    if (processed.includes(ref.id)) {
      log(`⏭️ Saltando ya procesado: ${ref.id}`);
      continue;
    }
    const detail = await gmail.users.messages.get({
      userId: 'me', id: ref.id, format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date']
    });
    const headers = detail.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || '?';
    const subject = headers.find(h => h.name === 'Subject')?.value || '?';
    const date = headers.find(h => h.name === 'Date')?.value || '?';
    emails.push({ id: ref.id, from, subject, date });
  }

  return emails;
}

async function getEmailBody(gmail, id) {
  try {
    const detail = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
    const parts = [detail.data.payload];
    let text = '';
    while (parts.length > 0) {
      const part = parts.shift();
      if (part.parts) parts.push(...part.parts);
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf8') + '\n';
      }
    }
    return text.trim().substring(0, 2000);
  } catch {
    return '(contenido no disponible)';
  }
}

async function summarizeEmails(emails) {
  if (emails.length === 0) return [];

  const prompt = `Resume cada correo IMPORTANTE en UNA linea en español. 
Solo responde con un array JSON plano: 
[{"from": "remitente", "subject": "asunto", "summary": "resumen de una linea"}]

Correos:
${emails.map(e => `- De: ${e.from} | Asunto: ${e.subject} | Cuerpo: ${e.body.substring(0, 500)}`).join('\n')}`;

  const providers = [
    {
      name: 'Gemini Flash', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: process.env.GEMINI_API_KEY, model: 'gemini-2.5-flash'
    },
    {
      name: 'OpenRouter Free', url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.5-flash-free-1'
    },
  ];

  for (const p of providers) {
    if (!p.key || p.key === 'undefined') continue;
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, max_tokens: 1000
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return emails.map(e => ({ from: e.from, subject: e.subject, summary: '(resumen no disponible)' }));
}

async function processEmails() {
  log('🚀 Iniciando Email Processor...');
  const now = getColombiaNow();
  const hoursBack = parseInt(process.env.EMAIL_SCAN_HOURS || '6', 10);

  try {
    const auth = await googleAuthorize(SCOPES);
    const rules = loadRules();
    const rawEmails = await fetchUnreadEmails(auth, hoursBack);

    if (rawEmails.length === 0) {
      log('✅ Sin correos nuevos para procesar');
      log('--- FIN ---');
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth });
    const trashCandidates = [];
    const importantEmails = [];
    const restEmails = [];
    const processedIds = loadProcessed();
    const jobAppsRegistered = [];

    for (const email of rawEmails) {
      const body = await getEmailBody(gmail, email.id);
      const jobPlatform = detectJobApplication(email.from, email.subject, body);
      if (jobPlatform) {
        const parsed = parseJobFromEmail(email.subject, body);
        const result = jobTracker.logApplication({
          empresa: parsed.empresa, cargo: parsed.cargo,
          plataforma: jobPlatform, url: parsed.url,
          detalles: email.subject + '\n' + body.substring(0, 300)
        });
        if (!result.duplicado) {
          jobAppsRegistered.push({ ...parsed, plataforma: jobPlatform, eval: result.evaluacion });
          log(`💼 Postulacion registrada: ${parsed.empresa} - ${parsed.cargo} (${jobPlatform}) fit: ${result.evaluacion?.score || '?'}%`);
        }
        try { await gmail.users.messages.trash({ userId: 'me', id: email.id });
          log(`🗑️ Correo de postulacion eliminado: ${email.subject}`); } catch {}
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        continue;
      }
      const trashReason = shouldTrash(email.from, email.subject, rules);
      if (trashReason) {
        trashCandidates.push({ ...email, reason: trashReason });
      } else if (isImportant(email.from, email.subject)) {
        importantEmails.push({ ...email, body });
      } else {
        restEmails.push(email);
      }
    }

    for (const e of trashCandidates) {
      try {
        await gmail.users.messages.trash({ userId: 'me', id: e.id });
        log(`🗑️ Enviado a papelera: [${e.reason}] ${e.subject}`);
      } catch (err) {
        log(`⚠️ Error al enviar a papelera: ${err.message}`);
      }
      if (!processedIds.includes(e.id)) processedIds.push(e.id);
    }

    let summaries = [];
    if (importantEmails.length > 0) {
      log(`📌 Resumiendo ${importantEmails.length} correos importantes via LLM...`);
      summaries = await summarizeEmails(importantEmails);
      for (const e of importantEmails) {
        try {
          await gmail.users.messages.modify({
            userId: 'me', id: e.id,
            resource: { removeLabelIds: ['UNREAD'] }
          });
        } catch {}
        if (!processedIds.includes(e.id)) processedIds.push(e.id);
      }
    }

    for (const e of restEmails) {
      try {
        await gmail.users.messages.modify({
          userId: 'me', id: e.id,
          resource: { removeLabelIds: ['UNREAD'] }
        });
      } catch {}
      if (!processedIds.includes(e.id)) processedIds.push(e.id);
    }

    if (processedIds.length > 500) {
      saveProcessed(processedIds.slice(-300));
    } else {
      saveProcessed(processedIds);
    }

    let report = `<b>📬 Resumen de Correos</b>\n`;
    report += `Escaneados: ${rawEmails.length} | 🗑️ ${trashCandidates.length} basura eliminada`;

    if (jobAppsRegistered.length > 0) {
      report += `\n\n<b>💼 Postulaciones Detectadas:</b>\n`;
      for (const j of jobAppsRegistered) {
        const fitIcon = j.eval?.compatible ? '✅' : '⚠️';
        report += `\n${fitIcon} <b>${escapeHTML(j.empresa)}</b> - ${escapeHTML(j.cargo || '?')}\n  ${j.plataforma} | fit: ${j.eval?.score || '?'}%`;
      }
    }

    if (summaries.length > 0) {
      report += `\n\n<b>📌 Importantes:</b>\n`;
      for (const s of summaries) {
        report += `\n• <b>${escapeHTML(s.subject || '?')}</b>\n  ${escapeHTML(s.from || '?')}\n  ${escapeHTML(s.summary || '')}`;
      }
    }

    if (restEmails.length > 0) {
      report += `\n\n📖 ${restEmails.length} correos marcados como leidos (sin accion necesaria)`;
    }

    await sendTelegramMessage(truncate(report, 3500));
    log('✅ Reporte enviado por Telegram');

    if (trashCandidates.length > 0) {
      for (const e of trashCandidates) {
        await pending.add(`Correo basura eliminado: ${e.subject} (${e.reason})`, 'email');
      }
    }

  } catch (err) {
    log(`❌ Error: ${err.message}`);
    try {
      await sendTelegramMessage(`⚠️ <b>Email Processor Error:</b>\n<code>${escapeHTML(err.message)}</code>`);
    } catch {}
    process.exit(1);
  }

  log('--- FIN ---');
}

processEmails();
