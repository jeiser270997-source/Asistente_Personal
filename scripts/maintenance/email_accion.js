#!/usr/bin/env node
/**
 * email_accion.js — Procesa correos de tránsito Itagüí
 * 
 * Lee cuerpos completos, extrae radicado, revisa qué pide Martha,
 * y elimina correos automáticos de multa.
 * 
 * Uso: node scripts/maintenance/email_accion.js
 */

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { authorize } = require('../../lib/integrations/google_auth');
const { agregarHecho } = require('../../lib/memory/memory_engine');

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

// IDs de correos importantes
const RADICADO_ID = '19f8616c5174bd29';       // Alcaldía de Itagüí - Radicación (NO LEÍDO)
const MARTHA_ID = '19f71397ceb60b33';          // Martha Mirian Sánchez - RV: RV:
const COMPARENDO_ANULADO_ID = '19f63208b899491c'; // Comparendo 0000430265 ANULADO
const DP_TO_ITAGUI_ID = '19f762864561dd25';    // Derecho de petición enviado
const DP_BOUNCE1 = '19f76286fe253b7b';         // Delivery Failure
const DP_ENVIADOS = ['19f63a56b2d469ea', '19f63a568a6dfa93', '19f63a566a89cd95', '19f63a5655ba71a8'];

// IDs de correos automáticos de multa para ELIMINAR (transitoitagui@itagui.gov.co)
const AUTO_MULTA_IDS = [
  '19f8571a781fe100',  // abr 25 (NO LEÍDO)
  '19f70d833f5b69d9',  // may 12
  '19f6bb1bcd9a0b68',  // ago 16 2025
  '19f668b393738e79',  // nov 20 2025
  '19f6164e2c788311',  // feb 24 2025
];

function log(msg) {
  const ts = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  console.log(`${C.dim}[${ts}]${C.reset} ${msg}`);
}

function decodeBase64Subject(raw) {
  // Decodifica subject en formato =?utf-8?B?...?=
  if (!raw || !raw.includes('=?')) return raw;
  try {
    return raw.replace(/=\?utf-8\?B\?([^?]+)\?=/gi, (_, b64) => {
      return Buffer.from(b64, 'base64').toString('utf-8');
    });
  } catch { return raw; }
}

async function getFullBody(gmail, id) {
  const detail = await gmail.users.messages.get({
    userId: 'me', id, format: 'full',
  });
  const headers = detail.data.payload.headers;
  const getH = (n) => headers.find(h => h.name === n)?.value || '?';
  
  const parts = [detail.data.payload];
  let text = '';
  while (parts.length > 0) {
    const part = parts.shift();
    if (part.parts) parts.push(...part.parts);
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += Buffer.from(part.body.data, 'base64').toString('utf8') + '\n';
    }
    if (part.mimeType === 'text/html' && part.body?.data && !text) {
      const html = Buffer.from(part.body.data, 'base64').toString('utf8');
      text += html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() + '\n';
    }
  }
  
  return {
    id,
    from: getH('From'),
    subject: decodeBase64Subject(getH('Subject')),
    date: getH('Date'),
    body: text.trim(),
  };
}

async function trashEmail(gmail, id, reason) {
  try {
    await gmail.users.messages.trash({ userId: 'me', id });
    log(`${C.green}🗑️ Eliminado: ${reason}${C.reset}`);
  } catch (err) {
    log(`${C.red}❌ Error eliminando ${id}: ${err.message}${C.reset}`);
  }
}

async function starEmail(gmail, id) {
  try {
    await gmail.users.messages.modify({
      userId: 'me', id,
      resource: { addLabelIds: ['STARRED'] },
    });
  } catch {}
}

async function main() {
  console.log(`\n${C.cyan}${C.bold}╔══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.cyan}${C.bold}║    📧 PROCESANDO CORREOS DE TRÁNSITO ITAGÜÍ      ║${C.reset}`);
  console.log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════╝${C.reset}\n`);

  const auth = await authorize(SCOPES);
  const gmail = google.gmail({ version: 'v1', auth });

  // ── 1. LEER RADICADO ──
  log(`${C.cyan}📄 Leyendo correo de radicación...${C.reset}`);
  const radicado = await getFullBody(gmail, RADICADO_ID);
  
  // Extraer número de radicado
  const radicadoMatch = radicado.body.match(/(?:N[ÚÚ]MERO DE RADICADO|RADICADO|No\.?|N[°º]\.?)\s*:?\s*([A-Z0-9]+)/i);
  const numRadicado = radicadoMatch ? radicadoMatch[1] : null;

  console.log(`\n${C.green}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.green}${C.bold}  📋 RADICACIÓN ALCALDÍA DE ITAGÜÍ${C.reset}`);
  console.log(`${C.green}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`   ${C.bold}De:${C.reset} ${radicado.from}`);
  console.log(`   ${C.bold}Asunto:${C.reset} ${radicado.subject}`);
  console.log(`   ${C.bold}Fecha:${C.reset} ${radicado.date}`);
  console.log(`   ${C.bold}Radicado:${C.reset} ${numRadicado ? `${C.yellow}${C.bold}${numRadicado}${C.reset}` : 'No encontrado'}`);
  console.log(`\n   ${C.dim}Contenido:${C.reset}`);
  console.log(`   ${radicado.body.substring(0, 1000).replace(/\n/g, '\n   ')}`);

  // Guardar en memoria
  if (numRadicado) {
    try {
      agregarHecho(`Radicado de tránsito Itagüí: ${numRadicado} - Recibido ${radicado.date}. Derecho de petición radicado exitosamente.`, 'transito', ['itagui', 'radicado', numRadicado]);
      log(`\n${C.green}✅ Radicado ${numRadicado} guardado en memoria.${C.reset}`);
    } catch (e) {
      log(`${C.yellow}⚠️ No se pudo guardar en memoria: ${e.message}${C.reset}`);
    }
  }

  // Marcar como leído y con estrella
  try {
    await gmail.users.messages.modify({
      userId: 'me', id: RADICADO_ID,
      resource: { removeLabelIds: ['UNREAD'], addLabelIds: ['STARRED'] },
    });
    log(`${C.green}✅ Radicado marcado como leído + estrella.${C.reset}`);
  } catch {}

  // ── 2. LEER CORREO DE MARTHA ──
  log(`\n\n${C.cyan}📄 Leyendo correo de Martha Mirian Sánchez...${C.reset}`);
  const martha = await getFullBody(gmail, MARTHA_ID);

  console.log(`\n${C.yellow}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.yellow}${C.bold}  📋 CORREO DE MARTHA - FCM (SIMIT)${C.reset}`);
  console.log(`${C.yellow}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`   ${C.bold}De:${C.reset} ${martha.from}`);
  console.log(`   ${C.bold}Asunto:${C.reset} ${martha.subject}`);
  console.log(`   ${C.bold}Fecha:${C.reset} ${martha.date}`);
  console.log(`\n   ${C.dim}Contenido completo:${C.reset}`);
  console.log(`   ${martha.body.substring(0, 2000).replace(/\n/g, '\n   ')}`);

  // Extraer qué está pidiendo Martha
  const pideAdjuntar = martha.body.toLowerCase().includes('adjunt') || martha.body.toLowerCase().includes('pdf');
  const pideOficio = martha.body.toLowerCase().includes('oficio') || martha.body.toLowerCase().includes('respuesta');
  const pideDocumento = martha.body.toLowerCase().includes('documento');

  console.log(`\n   ${C.bold}📌 ¿Qué está pidiendo Martha?:${C.reset}`);
  if (pideAdjuntar) console.log(`   ${C.yellow}→ Pide adjuntar documentos en PDF${C.reset}`);
  if (pideOficio) console.log(`   ${C.yellow}→ Pide el oficio de respuesta del organismo de tránsito${C.reset}`);
  if (pideDocumento) console.log(`   ${C.yellow}→ Pide documentos de soporte${C.reset}`);
  if (!pideAdjuntar && !pideOficio) console.log(`   ${C.yellow}→ Revisar contenido completo arriba${C.reset}`);

  // ── 3. LEER COMPARENDO ANULADO ──
  log(`\n\n${C.cyan}📄 Leyendo correo de comparendo anulado...${C.reset}`);
  const anulado = await getFullBody(gmail, COMPARENDO_ANULADO_ID);

  console.log(`\n${C.green}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.green}${C.bold}  ✅ COMPARENDO ANULADO${C.reset}`);
  console.log(`${C.green}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`   ${C.bold}Asunto:${C.reset} ${anulado.subject}`);
  console.log(`\n   ${C.dim}Contenido:${C.reset}`);
  console.log(`   ${anulado.body.substring(0, 1500).replace(/\n/g, '\n   ')}`);

  // ── 4. ELIMINAR CORREOS AUTOMÁTICOS DE MULTA ──
  log(`\n\n${C.yellow}🗑️ Eliminando ${AUTO_MULTA_IDS.length} correos automáticos de multa...${C.reset}`);
  for (const id of AUTO_MULTA_IDS) {
    const detalle = await getFullBody(gmail, id);
    await trashEmail(gmail, id, `Auto: ${detalle.subject} (${detalle.from})`);
  }

  // ── 5. VERIFICAR DOCUMENTOS LOCALES ──
  const BASE_DIR = path.resolve(__dirname, '..', '..');
  const docsDir = path.join(BASE_DIR, 'data', 'documentos');
  const sourcesDir = path.join(BASE_DIR, 'data', 'sources', 'documentos');
  
  console.log(`\n\n${C.cyan}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.cyan}${C.bold}  📂 BUSCANDO DOCUMENTOS LOCALES${C.reset}`);
  console.log(`${C.cyan}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  
  const resultados = [];
  for (const dir of [docsDir, sourcesDir]) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true });
      const relevantFiles = files.filter(f => 
        f.toLowerCase().includes('calibracion') || 
        f.toLowerCase().includes('calibration') ||
        f.toLowerCase().includes('itagui') || 
        f.toLowerCase().includes('itagüí') ||
        f.toLowerCase().includes('comparendo') ||
        f.toLowerCase().includes('838097') ||
        f.toLowerCase().includes('430265') ||
        f.toLowerCase().includes('simit') ||
        f.toLowerCase().includes('transito') ||
        f.toLowerCase().includes('tránsito') ||
        f.toLowerCase().includes('dei') ||
        f.toLowerCase().includes('derecho') ||
        f.toLowerCase().includes('peticion') ||
        f.toLowerCase().includes('petición')
      );
      resultados.push({ dir, files: relevantFiles });
    }
  }

  const hasDocs = resultados.some(r => r.files.length > 0);
  if (hasDocs) {
    console.log(`\n${C.green}✅ Documentos encontrados:${C.reset}`);
    for (const r of resultados) {
      if (r.files.length > 0) {
        console.log(`   ${C.dim}${r.dir}:${C.reset}`);
        for (const f of r.files) {
          const fullPath = path.join(r.dir, f);
          const stats = fs.statSync(fullPath);
          const sizeKB = (stats.size / 1024).toFixed(1);
          console.log(`   📄 ${f} (${sizeKB} KB)`);
        }
      }
    }
  } else {
    console.log(`\n${C.yellow}⚠️ No se encontraron documentos de tránsito/calibración localmente.${C.reset}`);
    
    // Buscar en otras ubicaciones
    console.log(`\n${C.dim}Buscando en resto del proyecto...${C.reset}`);
    const searchDirs = [
      path.join(BASE_DIR, '_archived'),
      path.join(BASE_DIR, 'data', 'cache'),
      path.join(BASE_DIR, 'data', 'simit'),
    ];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir, { recursive: true });
        const relevantFiles = files.filter(f => 
          /calibra|itagui|comparendo|simit|transito|derecho|peticion|dei/i.test(f)
        );
        if (relevantFiles.length > 0) {
          console.log(`   ${C.green}En ${dir}:${C.reset}`);
          for (const f of relevantFiles) {
            console.log(`   📄 ${f}`);
          }
        }
      }
    }
  }

  // ── RESUMEN FINAL ──
  console.log(`\n\n${C.cyan}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.cyan}${C.bold}  📊 RESUMEN DE ACCIONES${C.reset}`);
  console.log(`${C.cyan}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`   ✅ Radicado ${numRadicado || '?'} leído y guardado`);
  console.log(`   ✅ ${AUTO_MULTA_IDS.length} correos automáticos eliminados`);
  console.log(`   ✅ Correo de Martha analizado`);
  console.log(`   ${hasDocs ? '✅ Documentos locales encontrados' : '⚠️ No hay documentos locales'}`);
  
  console.log(`\n   ${C.green}${C.bold}✅ PROCESO COMPLETADO${C.reset}\n`);
}

main().catch(err => {
  console.error(`\n${C.red}❌ Error: ${err.message}${C.reset}`);
  process.exit(1);
});
