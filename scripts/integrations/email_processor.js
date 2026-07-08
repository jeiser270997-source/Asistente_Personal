require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { authorize: googleAuthorize } = require('../../lib/integrations/google_auth');
const { sendTelegramMessage } = require('../../lib/integrations/telegram');
const { escapeHTML, truncate } = require('../../lib/runtime/sanitize');
const pending = require('../../lib/context/pending');
const jobTracker = require('../../lib/runtime/job_tracker');
const ruleEngine = require('../../lib/runtime/rule_engine');
const { agregarHecho } = require('../../lib/memory/memory_engine');
const fsPromises = require('node:fs/promises');

// LLM
const { createLLM, getLLMContextSize, isDeepSeekValley } = require('../../lib/ai/llm_service');
const { ChatPromptTemplate } = require('@langchain/core/prompts');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
let LedgerStore = null;
let RE = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
  LedgerStore = require('../../runtime/stores/LedgerStore');
  RE = require('../../lib/runtime/resume_engine');
}

const BASE_DIR = path.resolve(__dirname, '..');
const LOG_DIR = path.join(BASE_DIR, 'logs');
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

// ── Checkpoint (processed_emails.json → CheckpointStore) ──

function loadProcessed() {
  if (USE_SQLITE) {
    const cp = CheckpointStore.get('email_processed_ids');
    if (cp && Array.isArray(cp)) return cp;
  }
  try {
    const p = path.join(BASE_DIR, 'data', 'processed_emails.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return []; }
}

function saveProcessed(ids) {
  if (USE_SQLITE) CheckpointStore.set('email_processed_ids', ids);
  const p = path.join(BASE_DIR, 'data', 'processed_emails.json');
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(ids, null, 2), 'utf8');
}

// ── Clasificación Inteligente con DeepSeek ──

async function isImportant(from, subject, body = "") {
  try {
    const llm = await createLLM({ temperature: 0.1 });
    if (!llm) throw new Error("No LLM available");
    
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "Eres el guardián de la bandeja de entrada de Jeiser. Responde SOLO con la palabra 'KEEP' si el correo es importante (alertas de multas, fotomultas, tránsito, DIAN, SIMIT, juzgados, bancos, nómina, facturas, ofertas laborales, entrevistas, SENA, CESDE). Responde SOLO con 'DELETE' si es spam, publicidad, promociones, boletines o notificaciones de redes sociales."],
      ["user", `Remitente: ${from}\nAsunto: ${subject}\n\n${body.substring(0, 300)}`]
    ]);
    
    const chain = prompt.pipe(llm);
    const result = await chain.invoke({});
    const answer = result.content.trim().toUpperCase();
    
    return answer.includes('KEEP');
  } catch (e) {
    log(`[DeepSeek Fallback] Error clasificando: ${e.message}`);
    // Fallback a lógica de regex si falla la API
    const text = `${from} ${subject}`.toLowerCase();
    const IMPORTANT_KEYWORDS = [
      'dian', 'simit', 'cesde', 'sena', 'solvo', 'concentrix',
      'multa', 'comparendo', 'tarea', 'urgente',
      'notificacion judicial', 'embargo', 'mandamiento',
      'citacion', 'requerimiento', 'entrevista',
      'factura', 'contrato', 'nomina', 'salario',
    ];
    return IMPORTANT_KEYWORDS.some(kw => text.includes(kw));
  }
}

function parseJobFromEmail(subject, body) {
  const lines = (body || subject || '').split('\n').filter(Boolean);
  let empresa = '?', cargo = '?', url = '';

  const cargoMatch = subject.match(/(?:para|como|aplicado a|apply for|postulado a)\s*(.+?)(?:en|$)/i);
  if (cargoMatch) cargo = cargoMatch[1].trim();

  const empresaMatch = (body || '').match(/(?:empresa|compania|company|en)\s*:?\s*([^\n]+)/i);
  if (empresaMatch) empresa = empresaMatch[1].trim();

  const urlMatch = (body || '').match(/https?:\/\/[^\s]+(?:vacante|job|oferta|postulacion)[^\s]*/i);
  if (urlMatch) url = urlMatch[0].trim();

  return { empresa, cargo, url };
}

// ── Gmail API ──

async function fetchUnreadEmails(auth, hoursBack = 6) {
  const gmail = google.gmail({ version: 'v1', auth });
  const now = new Date();
  const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  const query = `in:inbox is:unread after:${Math.floor(since.getTime() / 1000)}`;

  log(`Query: "${query}"`);

  const res = await gmail.users.messages.list({
    userId: 'me', q: query, maxResults: 100
  });

  const messageRefs = res.data.messages || [];
  log(`Encontrados ${messageRefs.length} correos no leidos`);

  if (messageRefs.length === 0) return [];

  const processed = loadProcessed();
  const emails = [];

  for (const ref of messageRefs) {
    if (processed.includes(ref.id)) {
      log(`Saltando ya procesado: ${ref.id}`);
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
  const prompt = `Resume cada correo IMPORTANTE en UNA linea en espanol. Solo responde con un array JSON plano: [{"from":"remitente","subject":"asunto","summary":"resumen de una linea"}]

Correos:
${emails.map(e => `- De: ${e.from} | Asunto: ${e.subject} | Cuerpo: ${e.body.substring(0, 500)}`).join('\n')}`;

  const provider = {
    name: 'DeepSeek V4 Flash',
    url: 'https://api.deepseek.com/v1/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-v4-flash'
  };

  if (!provider.key) return emails.map(e => ({ from: e.from, subject: e.subject, summary: '(DeepSeek no configurado)' }));

  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.key}` },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, max_tokens: 1000
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) { log(`DeepSeek: HTTP ${res.status}`); return emails.map(e => ({ from: e.from, subject: e.subject, summary: '(error API)' })); }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return emails.map(e => ({ from: e.from, subject: e.subject, summary: '(resp vacia)' }));
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    log(`DeepSeek error: ${err.message.substring(0, 60)}`);
  }
  return emails.map(e => ({ from: e.from, subject: e.subject, summary: '(resumen no disponible)' }));
}

// ── Main ──

async function processEmails() {
  log('Email Processor iniciado');
  const now = getColombiaNow();
  const hoursBack = parseInt(process.env.EMAIL_SCAN_HOURS || '6', 10);

  if (USE_SQLITE) RE.start('email_processor', { hoursBack });

  try {
    const auth = await googleAuthorize(SCOPES);
    const rawEmails = await fetchUnreadEmails(auth, hoursBack);

    if (rawEmails.length === 0) {
      log('Sin correos nuevos para procesar');
      if (USE_SQLITE) RE.finish('email_processor', 'success', { processed: 0 });
      log('--- FIN ---');
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth });
    const trashCandidates = [];
    const importantEmails = [];
    const restEmails = [];
    const processedIds = loadProcessed();
    const jobAppsRegistered = [];
    let ruleActions = [];

    for (const email of rawEmails) {
      const body = await getEmailBody(gmail, email.id);
      email.body = body;
      
      const esImportante = await isImportant(email.from, email.subject, body);

      if (esImportante) {
        log(`🟢 KEEP: ${email.subject.substring(0, 40)}`);
        importantEmails.push(email);
        
        // ── Lógica de Adjuntos y Memoria ──
        try {
          const detail = await gmail.users.messages.get({ userId: 'me', id: email.id, format: 'full' });
          const parts = [];
          function walk(p) {
            if (p.parts) p.parts.forEach(walk);
            else if (p.filename && p.body?.attachmentId) parts.push(p);
          }
          walk(detail.data.payload);

          for (const part of parts) {
            const att = await gmail.users.messages.attachments.get({
              userId: 'me', messageId: email.id, id: part.body.attachmentId
            });
            const data = Buffer.from(att.data.data, 'base64');
            const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            
            // Inyectar a memoria
            const docText = `Documento Adjunto (${safeName}) recibido de ${email.from} el ${email.date}. Asunto: ${email.subject}.`;
            agregarHecho(docText, 'documentos', ['email', 'adjunto', safeName]);
            log(`💾 Adjunto Inyectado a Memoria: ${safeName}`);
          }
        } catch (e) {
          log(`❌ Error procesando adjunto: ${e.message}`);
        }
      } else {
        log(`🔴 DELETE: ${email.subject.substring(0, 40)}`);
        trashCandidates.push(email.id);
      }

      // Rule Engine (para registrar postulaciones a empleos o automatizaciones extra)
      const matches = ruleEngine.matchAll(email);
      const action = ruleEngine.highestPriority(matches);

      if (action.isJobApplication) {
        const parsed = parseJobFromEmail(email.subject, body);
        const result = jobTracker.logApplication({
          empresa: parsed.empresa, cargo: parsed.cargo,
          plataforma: action.label || 'Email',
          url: parsed.url,
          detalles: email.subject + '\n' + body.substring(0, 300)
        });
        if (!result.duplicado) {
          jobAppsRegistered.push({ ...parsed, plataforma: action.label, eval: result.evaluacion });
          log(`Postulacion registrada: ${parsed.empresa} - ${parsed.cargo} fit: ${result.evaluacion?.score || '?'}%`);
        }
        try { await gmail.users.messages.trash({ userId: 'me', id: email.id }); log(`Correo de postulacion eliminado: ${email.subject}`); } catch (e) { log(`Warning trashing email: ${e.message}`); }
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        if (USE_SQLITE) LedgerStore.emit('email_job_application', { empresa: parsed.empresa, cargo: parsed.cargo, plataforma: action.label });
        continue;
      }

      if (action.isRejection) {
        log(`Rechazo detectado: ${email.subject}`);
        if (USE_SQLITE) LedgerStore.emit('email_job_rejection', { subject: email.subject, from: email.from });
        try { await gmail.users.messages.modify({ userId: 'me', id: email.id, resource: { removeLabelIds: ['UNREAD', 'INBOX'], addLabelIds: [action.label || 'Trabajo/Rechazos'] } }); } catch (e) { log(`Warning labeling email: ${e.message}`); }
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        continue;
      }

      if (action.archive) {
        try {
          const mod = { removeLabelIds: ['UNREAD'] };
          if (action.label) mod.addLabelIds = [action.label];
          await gmail.users.messages.modify({ userId: 'me', id: email.id, resource: mod });
          log(`Archivado: ${email.subject} -> ${action.label || '(sin etiqueta)'}`);
        } catch (e) { log(`Error archivando: ${e.message}`); }
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        ruleActions.push(action);
        if (USE_SQLITE && action.logToLedger) LedgerStore.emit('email_archived', { subject: email.subject, from: email.from, label: action.label });
        continue;
      }

      if (action.notify) {
        importantEmails.push({ ...email, body, action });
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        if (USE_SQLITE) LedgerStore.emit('email_notify', { subject: email.subject, from: email.from, label: action.label });
        continue;
      }

      // No rule matched — check importance
      if (isImportant(email.from, email.subject)) {
        importantEmails.push({ ...email, body });
      } else {
        restEmails.push(email);
      }
      if (!processedIds.includes(email.id)) processedIds.push(email.id);
    }

    for (const e of restEmails) {
      try {
        await gmail.users.messages.modify({ userId: 'me', id: e.id, resource: { removeLabelIds: ['UNREAD'] } });
      } catch (e) { log(`Warning modifying unread: ${e.message}`); }
    }

    let summaries = [];
    if (importantEmails.length > 0) {
      log(`Resumiendo ${importantEmails.length} correos importantes via LLM...`);
      summaries = await summarizeEmails(importantEmails);
    }

    if (processedIds.length > 500) {
      saveProcessed(processedIds.slice(-300));
    } else {
      saveProcessed(processedIds);
    }

    let report = `<b>Resumen de Correos</b>\n`;
    report += `Escaneados: ${rawEmails.length}`;

    if (jobAppsRegistered.length > 0) {
      report += `\n\n<b>Postulaciones Detectadas:</b>\n`;
      for (const j of jobAppsRegistered) {
        const fitIcon = j.eval?.compatible ? '✅' : '';
        report += `\n${fitIcon} <b>${escapeHTML(j.empresa)}</b> - ${escapeHTML(j.cargo || '?')}\n  ${j.plataforma} | fit: ${j.eval?.score || '?'}%`;
      }
    }

    if (summaries.length > 0) {
      report += `\n\n<b>Importantes:</b>\n`;
      for (const s of summaries) {
        report += `\n\u2022 <b>${escapeHTML(s.subject || '?')}</b>\n  ${escapeHTML(s.from || '?')}\n  ${escapeHTML(s.summary || '')}`;
      }
    }

    if (restEmails.length > 0) {
      report += `\n\n${restEmails.length} correos marcados como leidos (sin accion necesaria)`;
    }

    await sendTelegramMessage(truncate(report, 3500));
    log('Reporte enviado por Telegram');

    if (USE_SQLITE) {
      RE.finish('email_processor', 'success', { processed: rawEmails.length, important: importantEmails.length, archived: ruleActions.length });
    }

  } catch (err) {
    log(`Error: ${err.message}`);
    if (USE_SQLITE) { LedgerStore.emit('email_processor_error', { error: err.message }); RE.finish('email_processor', 'error', { reason: err.message }); }
    try { await sendTelegramMessage(`Email Processor Error:\n<code>${escapeHTML(err.message)}</code>`); } catch (e) { console.error('Error sending telegram alert:', e.message); }
    process.exit(1);
  }

  log('--- FIN ---');
}

processEmails();
