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

// Importaciones unificadas de rutas y LLM (FIX-001 & FIX-005)
const { PATHS, DIR } = require('../../lib/data/paths');
const { askLLM } = require('../../lib/ai/llm_service');

const bus = require('../../lib/events/event_bus');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const RE = require('../../lib/runtime/resume_engine');

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
  const cp = CheckpointStore.get('email_processed_ids');
  if (cp && Array.isArray(cp)) return cp;
  try {
    return JSON.parse(fs.readFileSync(PATHS.PROCESSED_EMAILS, 'utf8'));
  } catch { return []; }
}

function saveProcessed(ids) {
  CheckpointStore.set('email_processed_ids', ids);
  ensureDir(path.dirname(PATHS.PROCESSED_EMAILS));
  fs.writeFileSync(PATHS.PROCESSED_EMAILS, JSON.stringify(ids, null, 2), 'utf8');
}

// ── Clasificación Inteligente con LLM ──

async function isImportant(from, subject, body = "") {
  const text = `${from} ${subject} ${body}`.toLowerCase();
  
  // 1. REGLA DE BASURA (Gratis y rápida)
  const JUNK_KEYWORDS = ['newsletter', 'oferta', 'promocion', 'descuento', 'suscripcion', 'publicidad']; // noreply/no-reply eliminados: causaban falsos negativos en correos importantes (Google Security, SENA, etc.)
  if (JUNK_KEYWORDS.some(kw => text.includes(kw))) return false;

  // 2. REGLA DE ORO (Importante)
  const IMPORTANT_KEYWORDS = [
    'dian', 'simit', 'cesde', 'sena', 'solvo', 'concentrix',
    'multa', 'comparendo', 'tarea', 'urgente',
    'notificacion judicial', 'embargo', 'mandamiento',
    'citacion', 'requerimiento', 'entrevista',
    'factura', 'contrato', 'nomina', 'salario', 'postulacion'
  ];
  
  return IMPORTANT_KEYWORDS.some(kw => text.includes(kw));
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

// ── Gmail API Labels ──
const labelCache = {};
async function getOrCreateLabelId(gmail, name) {
  if (labelCache[name]) return labelCache[name];
  
  try {
    const res = await gmail.users.labels.list({ userId: 'me' });
    const labels = res.data.labels || [];
    const existing = labels.find(l => l.name.toLowerCase() === name.toLowerCase());
    
    if (existing) {
      labelCache[name] = existing.id;
      return existing.id;
    }
    
    const created = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
    labelCache[name] = created.data.id;
    return created.data.id;
  } catch (err) {
    log(`Error manejando etiqueta ${name}: ${err.message}`);
    return null;
  }
}

// ── Gmail API Correos ──

async function fetchInboxEmails(auth, hoursBack = 24) {
  const gmail = google.gmail({ version: 'v1', auth });
  const now = new Date();
  const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  const query = `in:inbox after:${Math.floor(since.getTime() / 1000)}`;

  log(`Query: "${query}"`);

  const res = await gmail.users.messages.list({
    userId: 'me', q: query, maxResults: 100
  });

  const messageRefs = res.data.messages || [];
  log(`Encontrados ${messageRefs.length} correos en INBOX`);

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

// ── Procesamiento compartido de adjuntos (extraído a función para reutilizar en rule_engine) ──

async function processAttachments(gmail, email) {
  try {
    const detail = await gmail.users.messages.get({ userId: 'me', id: email.id, format: 'full' });
    const parts = [];
    function walk(p) {
      if (p.parts) p.parts.forEach(walk);
      else if (p.filename && p.body?.attachmentId) parts.push(p);
    }
    walk(detail.data.payload);

    if (parts.length === 0) return;

    // Estructura de guardado canónica (FIX-005)
    const dateStr = new Date().toISOString().split('T')[0];
    const emailDir = path.join(DIR.DOCS, dateStr, email.id.substring(0, 12));
    if (!fs.existsSync(emailDir)) fs.mkdirSync(emailDir, { recursive: true });

    for (const part of parts) {
      const att = await gmail.users.messages.attachments.get({
        userId: 'me', messageId: email.id, id: part.body.attachmentId
      });
      const attData = Buffer.from(att.data.data, 'base64');
      const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = path.join(emailDir, safeName);

      // Escritura física obligatoria (FIX-005)
      fs.writeFileSync(filePath, attData);

      const docText = `Documento Adjunto (${safeName}) recibido de ${email.from} el ${email.date}. Asunto: ${email.subject}. Guardado en: ${filePath}`;
      agregarHecho(docText, 'documentos', ['email', 'adjunto', safeName]);
      log(`💾 Adjunto Guardado en Disco e Inyectado a Memoria: ${safeName} (${filePath})`);
    }
  } catch (e) {
    log(`❌ Error procesando adjunto en ${email.id}: ${e.message}`);
  }
}

async function summarizeEmails(emails) {
  if (emails.length === 0) return [];
  const prompt = `Analiza cada correo IMPORTANTE y responde estrictamente con un array JSON. Para cada correo extrae:
- "id": El id exacto del correo.
- "from": Remitente.
- "subject": Asunto.
- "summary": Resumen de 1 linea.
- "pending_action": Qué acción debo tomar (ej. "Responder confirmando", "Pagar", "Nada"). Si no hay acción, pon null.
- "suggested_label": Inventa una etiqueta corta (1 palabra, ej. "Finanzas", "Trabajo", "Educacion", "SENA", "Personal") que mejor categorice este correo.
Formato obligatorio: [{"id":"...","from":"...","subject":"...","summary":"...","pending_action":"...","suggested_label":"..."}]

Correos:
${emails.map(e => `- ID: ${e.id} | De: ${e.from} | Asunto: ${e.subject} | Cuerpo: ${e.body.substring(0, 500)}`).join('\n')}`;

  // Single-tenant: TODO correo personal puede llevar PII (cédula, dirección, nómina).
  // Siempre sensitive=true → proxy local / fail-closed (FIX-009 cerrado 2026-07-20).
  const isSensitive = true;

  try {
    const res = await askLLM(prompt, [], 0.1, null, isSensitive);
    const raw = (res.content || '').trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    log(`[summarizeEmails] Falló consulta unificada: ${err.message.substring(0, 100)}`);
  }

  // Fallback determinista seguro
  return emails.map(e => ({
    id: e.id,
    from: e.from,
    subject: e.subject,
    summary: '(resumen no disponible)',
    pending_action: null,
    suggested_label: 'Personal'
  }));
}

// ── Main ──

async function processEmails() {
  log('Email Processor iniciado');
  const now = getColombiaNow();
  const hoursBack = parseInt(process.env.EMAIL_SCAN_HOURS || '24', 10);

  RE.start('email_processor', { hoursBack });

  try {
    const auth = await googleAuthorize(SCOPES);
    const rawEmails = await fetchInboxEmails(auth, hoursBack);

    if (rawEmails.length === 0) {
      log('Sin correos nuevos para procesar');
      RE.finish('email_processor', 'success', { processed: 0 });
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

      // ⚠️ ORDEN CORREGIDO: Rule Engine PRIMERO, isImportant() después
      // Antes isImportant() se ejecutaba primero y movía correos a Basura
      // antes de que el rule_engine pudiera clasificarlos correctamente.
      
      // 1. Rule Engine (reglas determinísticas de alta precisión)
      const matches = ruleEngine.matchAll(email);
      const action = ruleEngine.highestPriority(matches);

      // 2. Si el rule_engine matched, ejecutar acción y saltar isImportant()
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
        LedgerStore.emit('email_job_application', { empresa: parsed.empresa, cargo: parsed.cargo, plataforma: action.label });
        continue;
      }

      if (action.isRejection) {
        log(`Rechazo detectado: ${email.subject}`);
        LedgerStore.emit('email_job_rejection', { subject: email.subject, from: email.from });
        try { 
            const labelId = await getOrCreateLabelId(gmail, action.label || 'Trabajo/Rechazos');
            if (labelId) {
                await gmail.users.messages.modify({ userId: 'me', id: email.id, resource: { removeLabelIds: ['UNREAD', 'INBOX'], addLabelIds: [labelId] } }); 
            }
        } catch (e) { log(`Warning labeling email: ${e.message}`); }
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        continue;
      }

      if (action.archive) {
        // Procesar adjuntos antes de archivar
        await processAttachments(gmail, email);
        try {
          const mod = { removeLabelIds: ['UNREAD'] };
          if (action.label) {
              const labelId = await getOrCreateLabelId(gmail, action.label);
              if (labelId) mod.addLabelIds = [labelId];
          }
          await gmail.users.messages.modify({ userId: 'me', id: email.id, resource: mod });
          log(`Archivado: ${email.subject} -> ${action.label || '(sin etiqueta)'}`);
        } catch (e) { log(`Error archivando: ${e.message}`); }
        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        ruleActions.push(action);
        if (action.logToLedger) LedgerStore.emit('email_archived', { subject: email.subject, from: email.from, label: action.label });
        continue;
      }

      if (action.notify) {
        // Procesar adjuntos antes de notificar
        await processAttachments(gmail, email);
        importantEmails.push({ ...email, body, action });

        // 🚨 ALERTA INSTANTÁNEA (FIX-012): Despachar de inmediato mientras conduces
        try {
          bus.emit('email.important', {
            from: email.from,
            subject: email.subject,
            summary: `⚡ NOTIFICACIÓN CRÍTICA DETECTADA: ${action.label || 'Urgente'}\n\n<i>${body.substring(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</i>`
          }, { source: 'email_processor.instant', priority: 'high' });
          log(`🚨 Alerta instantánea emitida para: ${email.subject}`);
        } catch (e) {
          log(`⚠️ Error emitiendo alerta instantánea: ${e.message}`);
        }

        if (!processedIds.includes(email.id)) processedIds.push(email.id);
        LedgerStore.emit('email_notify', { subject: email.subject, from: email.from, label: action.label });
        continue;
      }

      // No rule matched — check importance con isImportant()
      const esImportante = await isImportant(email.from, email.subject, body);
      
      // ── Lógica de Adjuntos y Memoria (solo para importantes) ──
      if (esImportante) {
        log(`🟢 KEEP (Filtro Semántico): ${email.subject.substring(0, 40)}`);
        await processAttachments(gmail, email);
        importantEmails.push({ ...email, body });

        // 🚨 ALERTA INSTANTÁNEA PARA EMAILS SEMÁNTICAMENTE IMPORTANTES (FIX-012)
        // Por ejemplo, invitaciones a entrevistas detectadas por IA que no tenían regla fija
        if (/entrevista|interview|citacion|seleccion|reunion|meeting|prueba/i.test(email.subject + ' ' + body)) {
          try {
            bus.emit('email.important', {
              from: email.from,
              subject: email.subject,
              summary: `💼 <b>PROCESO LABORAL DETECTADO:</b>\n\n<i>${body.substring(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</i>`
            }, { source: 'email_processor.instant_job', priority: 'high' });
            log(`💼 Alerta de proceso laboral emitida para: ${email.subject}`);
          } catch {}
        }
      } else {
        log(`🔴 BASURA (Sin regla ni keyword): ${email.subject.substring(0, 40)}`);
        trashCandidates.push(email.id);
        const basuraId = await getOrCreateLabelId(gmail, 'Basura');
        if (basuraId) {
            try { 
                await gmail.users.messages.modify({ userId: 'me', id: email.id, resource: { removeLabelIds: ['INBOX', 'UNREAD'], addLabelIds: [basuraId] } }); 
            } catch (e) { log(`Warning moviendo a basura: ${e.message}`); }
        }
        restEmails.push(email);
      }
      if (!processedIds.includes(email.id)) processedIds.push(email.id);
    }

    let summaries = [];
    if (importantEmails.length > 0) {
      log(`Resumiendo ${importantEmails.length} correos importantes via LLM...`);
      summaries = await summarizeEmails(importantEmails);
    }
    
    const summaryMap = {};
    for (const s of summaries) {
       if(s.id) summaryMap[s.id] = s;
    }

    // Inbox Zero: Procesar correos restantes (sacar de bandeja y aplicar etiquetas dinámicas)
    for (const e of importantEmails) {
      try {
        const s = summaryMap[e.id];
        const labelsToAdd = [];
        if (s && s.suggested_label && s.suggested_label !== 'null') {
            const labelId = await getOrCreateLabelId(gmail, s.suggested_label);
            if (labelId) labelsToAdd.push(labelId);
        } else {
            labelsToAdd.push('STARRED'); // fallback
        }
        await gmail.users.messages.modify({ userId: 'me', id: e.id, resource: { removeLabelIds: ['UNREAD', 'INBOX'], addLabelIds: labelsToAdd } });
      } catch (err) { log(`Warning modifying important unread: ${err.message}`); }
    }

    for (const e of restEmails) {
      try {
        await gmail.users.messages.modify({ userId: 'me', id: e.id, resource: { removeLabelIds: ['UNREAD', 'INBOX'] } });
      } catch (e) { log(`Warning modifying unread: ${e.message}`); }
    }

    if (processedIds.length > 500) {
      saveProcessed(processedIds.slice(-300));
    } else {
      saveProcessed(processedIds);
    }

    let report = `<b>Resumen de Correos</b>\n`;
    report += `Escaneados: ${rawEmails.length} | Descartados a 'Basura': ${trashCandidates.length}`;

    if (jobAppsRegistered.length > 0) {
      report += `\n\n<b>💼 Postulaciones Detectadas:</b>\n`;
      for (const j of jobAppsRegistered) {
        const fitIcon = j.eval?.compatible ? '✅' : '';
        report += `\n${fitIcon} <b>${escapeHTML(j.empresa)}</b> - ${escapeHTML(j.cargo || '?')}\n  ${j.plataforma} | fit: ${j.eval?.score || '?'}%`;
      }
    }

    if (summaries.length > 0) {
      report += `\n\n<b>📌 Importantes & Pendientes:</b>\n`;
      for (const s of summaries) {
        report += `\n\u2022 <b>${escapeHTML(s.subject || '?')}</b> (${escapeHTML(s.suggested_label || 'Sin etiqueta')})\n  De: ${escapeHTML(s.from || '?')}\n  👁️ ${escapeHTML(s.summary || '')}`;
        if (s.pending_action && s.pending_action.toLowerCase() !== 'null' && s.pending_action.toLowerCase() !== 'nada') {
            report += `\n  <b>⚡ Acción:</b> <i>${escapeHTML(s.pending_action)}</i>`;
        }
      }
    }

    if (restEmails.length > 0) {
      report += `\n\n${restEmails.length} correos secundarios sacados del inbox (Inbox Zero).`;
    }

    await sendTelegramMessage(truncate(report, 3500));
    log('Reporte enviado por Telegram');

    RE.finish('email_processor', 'success', { processed: rawEmails.length, important: importantEmails.length, archived: ruleActions.length });

  } catch (err) {
    log(`Error: ${err.message}`);
    LedgerStore.emit('email_processor_error', { error: err.message });
    RE.finish('email_processor', 'error', { reason: err.message });
    try { await sendTelegramMessage(`Email Processor Error:\n<code>${escapeHTML(err.message)}</code>`); } catch (e) { console.error('Error sending telegram alert:', e.message); }
    process.exit(1);
  }

  log('--- FIN ---');
}

// ── FIX-012: Ejecución segura con await + bus.drain() ──
(async () => {
  try {
    await processEmails();
  } catch (e) {
    console.error('[Email Processor] Fatal:', e.message);
    process.exit(1);
  } finally {
    try {
      await bus.drain();
    } catch (e) {
      console.warn('[Email Processor] bus.drain():', e.message);
    }
    const { close: closeDb } = require('../../runtime/stores/Database');
    closeDb();
  }
})();
