#!/usr/bin/env node
/**
 * email_audit.js — Auditoría READ-ONLY de correos
 * 
 * NO modifica nada. Solo lee y reporta.
 * Busca específicamente correos de: tránsito, SIMIT, comparendos, multas,
 * y otros correos importantes de los últimos 7 días.
 * 
 * Uso: node scripts/maintenance/email_audit.js
 *       node scripts/maintenance/email_audit.js --all    (últimos 30 días)
 *       node scripts/maintenance/email_audit.js --search "itagui"  (búsqueda personalizada)
 */

require('dotenv').config();
const { google } = require('googleapis');
const { authorize } = require('../../lib/integrations/google_auth');

// Usamos gmail.modify para reutilizar el token existente (no se llaman operaciones de modificación)
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// Colores para consola
const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function getDaysBack() {
  if (process.argv.includes('--all')) return 30;
  const searchIdx = process.argv.indexOf('--search');
  if (searchIdx !== -1) return 30; // search mode = more days
  return 7;
}

function getSearchTerm() {
  const searchIdx = process.argv.indexOf('--search');
  if (searchIdx !== -1 && process.argv[searchIdx + 1]) {
    return process.argv[searchIdx + 1];
  }
  return null;
}

function pad(s, n = 60) {
  return (s || '').toString().padEnd(n).substring(0, n);
}

function formatDate(ts) {
  const d = new Date(parseInt(ts, 10) * 1000);
  return d.toLocaleDateString('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function highlightKeywords(text, keywords) {
  if (!text) return text;
  let result = text;
  for (const kw of keywords) {
    const regex = new RegExp(`(${kw})`, 'gi');
    result = result.replace(regex, `${C.red}${C.bold}$1${C.reset}`);
  }
  return result;
}

async function fetchMessages(gmail, query) {
  const allMessages = [];
  let pageToken = null;

  do {
    const params = {
      userId: 'me',
      q: query,
      maxResults: 100,
    };
    if (pageToken) params.pageToken = pageToken;

    const res = await gmail.users.messages.list(params);
    const batch = res.data.messages || [];
    allMessages.push(...batch);
    pageToken = res.data.nextPageToken || null;
  } while (pageToken);

  return allMessages;
}

async function getMessageDetail(gmail, id) {
  const detail = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject', 'Date', 'To'],
  });

  const headers = detail.data.payload.headers;
  const getH = (n) => headers.find(h => h.name === n)?.value || '?';

  // Obtener snippet
  const snippet = detail.data.snippet || '';

  // Obtener cuerpo si es necesario para más detalle
  let body = snippet;
  try {
    const full = await gmail.users.messages.get({
      userId: 'me', id, format: 'full',
    });
    const parts = [full.data.payload];
    let text = '';
    while (parts.length > 0) {
      const part = parts.shift();
      if (part.parts) parts.push(...part.parts);
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf8') + '\n';
      }
    }
    body = text.trim() || snippet;
  } catch { body = snippet; }

  const labels = detail.data.labelIds || [];
  const isUnread = labels.includes('UNREAD');
  const isInbox = labels.includes('INBOX');

  return {
    id,
    from: getH('From'),
    subject: getH('Subject'),
    date: getH('Date'),
    dateTs: detail.data.internalDate,
    snippet,
    body: body.substring(0, 500),
    isUnread,
    isInbox,
    labels,
  };
}

function classifyEmail(email) {
  const text = `${email.from} ${email.subject} ${email.body}`.toLowerCase();
  const classifications = [];

  if (/simit|comparendo|multa|infraccion|contravencion/i.test(text)) classifications.push('🚗 SIMIT/Multa');
  if (/transito|tránsito|itagui|itagüí|movilidad/i.test(text)) classifications.push('🚦 Tránsito');
  if (/dian|muisca|tribut|renta|declaracion/i.test(text)) classifications.push('💰 DIAN/Tributaria');
  if (/sena|zajuna|sofia|moodle/i.test(text)) classifications.push('🎓 SENA');
  if (/cesde/i.test(text)) classifications.push('📚 CESDE');
  if (/entrevista|interview/i.test(text)) classifications.push('💼 Entrevista');
  if (/computrabajo|linkedin|vacante|empleo|postul/i.test(text)) classifications.push('💼 Trabajo');
  if (/bancolombia|nequi|daviplata|epm|claro|factura|pago/i.test(text)) classifications.push('💳 Finanzas');
  if (/seguridad|security|verify|código|codigo|2fa|acceso/i.test(text)) classifications.push('🔐 Seguridad');
  if (/universidad|instituto|curso|clase|taller/i.test(text)) classifications.push('📖 Estudio');
  if (/citacion|requerimiento|judicial|embargo|demanda/i.test(text)) classifications.push('⚖️ Legal');

  return classifications.length > 0 ? classifications : ['📄 General'];
}

function severityIcon(classifications) {
  const high = ['🚗 SIMIT/Multa', '🚦 Tránsito', '💰 DIAN/Tributaria', '⚖️ Legal', '🔐 Seguridad'];
  if (classifications.some(c => high.includes(c))) return '🔴';
  if (classifications.some(c => c.includes('Entrevista'))) return '🟡';
  return '⚪';
}

async function main() {
  console.log(`${C.cyan}${C.bold}╔══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.cyan}${C.bold}║       📧 EMAIL AUDIT — MODO READ-ONLY           ║${C.reset}`);
  console.log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}NO se modifican labels, NO se marcan leídos, NO se borra nada${C.reset}\n`);

  const daysBack = getDaysBack();
  const searchTerm = getSearchTerm();

  // Construir query
  const since = new Date(Date.now() - daysBack * 86400000);
  const dateStr = `${since.getFullYear()}/${(since.getMonth() + 1).toString().padStart(2, '0')}/${since.getDate().toString().padStart(2, '0')}`;
  
  let query;
  if (searchTerm) {
    query = `after:${dateStr} ${searchTerm}`;
    console.log(`${C.yellow}🔍 Búsqueda personalizada:${C.reset} "${searchTerm}"\n`);
  } else {
    // Buscar todos los correos importantes
    query = `after:${dateStr} (transito OR itagui OR itagüí OR simit OR comparendo OR multa OR dian OR sena OR entrevista OR citacion OR notificacion OR requerimiento)`;
    console.log(`${C.yellow}📅 Últimos ${daysBack} días${C.reset}\n`);
  }

  try {
    console.log(`${C.dim}Autenticando con Gmail (read-only)...${C.reset}`);
    const auth = await authorize(SCOPES);
    const gmail = google.gmail({ version: 'v1', auth });

    console.log(`${C.dim}Query: ${query}${C.reset}\n`);
    const messages = await fetchMessages(gmail, query);
    console.log(`${C.cyan}${C.bold}📊 Total: ${messages.length} correos encontrados${C.reset}\n`);

    if (messages.length === 0) {
      console.log(`${C.green}✅ No se encontraron correos relevantes en los últimos ${daysBack} días.${C.reset}`);
      const allQuery = `after:${dateStr}`;
      console.log(`\n${C.dim}Para ver TODOS los correos recientes (no solo importantes):${C.reset}`);
      console.log(`  node scripts/maintenance/email_audit.js --search "in:inbox"\n`);
      return;
    }

    // Obtener detalles de cada mensaje
    const emails = [];
    for (let i = 0; i < messages.length; i++) {
      process.stdout.write(`\r${C.dim}Procesando ${i + 1}/${messages.length}...${C.reset}`);
      const detail = await getMessageDetail(gmail, messages[i].id);
      emails.push(detail);
    }
    process.stdout.write(`\r${C.green}✓ Procesados ${emails.length} correos${C.reset}  \n\n`);

    // Clasificar y separar
    const transitEmails = [];
    const importantEmails = [];
    const otherEmails = [];

    for (const e of emails) {
      const classes = classifyEmail(e);
      e.classifications = classes;
      e.severity = severityIcon(classes);

      if (classes.some(c => c.includes('Tránsito') || c.includes('SIMIT'))) {
        transitEmails.push(e);
      } else if (['🔴', '🟡'].includes(e.severity)) {
        importantEmails.push(e);
      } else {
        otherEmails.push(e);
      }
    }

    // ── REPORTE DE TRÁNSITO ──
    if (transitEmails.length > 0) {
      console.log(`${C.red}${C.bold}══════════════════════════════════════════════════${C.reset}`);
      console.log(`${C.red}${C.bold}  🚦 CORREOS DE TRÁNSITO / MOVILIDAD${C.reset}`);
      console.log(`${C.red}${C.bold}══════════════════════════════════════════════════${C.reset}`);
      for (const e of transitEmails) {
        const unreadTag = e.isUnread ? `${C.yellow}📩 NO LEÍDO${C.reset} ` : '';
        console.log(`\n${C.red}${C.bold}⚠️  ${e.subject}${C.reset}`);
        console.log(`   ${C.dim}De:${C.reset} ${e.from}`);
        console.log(`   ${C.dim}Fecha:${C.reset} ${formatDate(e.dateTs)} ${unreadTag}`);
        console.log(`   ${C.dim}Categoría:${C.reset} ${e.classifications.join(', ')}`);
        console.log(`   ${C.dim}Resumen:${C.reset} ${highlightKeywords(e.snippet.substring(0, 200), ['itagui', 'itagüí', 'simit', 'comparendo', 'multa', 'transito', 'tránsito'])}`);
        console.log(`   ${C.dim}ID:${C.reset} ${e.id}`);
        // Línea separadora
        console.log(`   ${C.dim}${'─'.repeat(60)}${C.reset}`);
      }
    }

    // ── REPORTE IMPORTANTES (no tránsito) ──
    if (importantEmails.length > 0) {
      console.log(`\n${C.yellow}${C.bold}══════════════════════════════════════════════════${C.reset}`);
      console.log(`${C.yellow}${C.bold}  📌 CORREOS IMPORTANTES${C.reset}`);
      console.log(`${C.yellow}${C.bold}══════════════════════════════════════════════════${C.reset}`);
      for (const e of importantEmails) {
        const unreadTag = e.isUnread ? `${C.yellow}📩 NO LEÍDO${C.reset} ` : '';
        console.log(`\n${e.severity} ${C.bold}${e.subject}${C.reset}`);
        console.log(`   ${C.dim}De:${C.reset} ${e.from}`);
        console.log(`   ${C.dim}Fecha:${C.reset} ${formatDate(e.dateTs)} ${unreadTag}`);
        console.log(`   ${C.dim}Categoría:${C.reset} ${e.classifications.join(', ')}`);
        console.log(`   ${C.dim}Resumen:${C.reset} ${e.snippet.substring(0, 200)}`);
      }
    }

    // ── OTROS ──
    if (otherEmails.length > 0) {
      console.log(`\n${C.dim}${C.bold}══════════════════════════════════════════════════${C.reset}`);
      console.log(`${C.dim}${C.bold}  📄 OTROS CORREOS (${otherEmails.length})${C.reset}`);
      console.log(`${C.dim}${C.bold}══════════════════════════════════════════════════${C.reset}`);
      for (const e of otherEmails) {
        const unreadTag = e.isUnread ? ` ${C.yellow}📩${C.reset}` : '';
        console.log(`   ${C.dim}${formatDate(e.dateTs)}${C.reset}${unreadTag} ${pad(e.subject, 55)} ${C.dim}${e.classifications[0]}${C.reset}`);
      }
    }

    // ── RESUMEN ──
    console.log(`\n${C.cyan}${C.bold}══════════════════════════════════════════════════${C.reset}`);
    console.log(`${C.cyan}${C.bold}  📊 RESUMEN${C.reset}`);
    console.log(`${C.cyan}${C.bold}══════════════════════════════════════════════════${C.reset}`);
    console.log(`   ${C.red}🚦 Tránsito: ${transitEmails.length}${C.reset}`);
    console.log(`   ${C.yellow}📌 Importantes: ${importantEmails.length}${C.reset}`);
    console.log(`   ${C.dim}📄 Otros: ${otherEmails.length}${C.reset}`);
    const totalUnread = emails.filter(e => e.isUnread).length;
    console.log(`   ${totalUnread > 0 ? C.yellow : C.green}📩 No leídos: ${totalUnread}${C.reset}`);
    console.log(`\n${C.dim}   ✅ Auditoría completada. NO se modificó ningún correo.${C.reset}\n`);

  } catch (err) {
    console.error(`\n${C.red}❌ Error: ${err.message}${C.reset}`);
    process.exit(1);
  }
}

main();
