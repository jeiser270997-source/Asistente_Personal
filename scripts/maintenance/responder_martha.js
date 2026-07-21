#!/usr/bin/env node
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { chromium } = require('playwright');
const { authorize } = require('../../lib/integrations/google_auth');
const { agregarHecho } = require('../../lib/memory/memory_engine');

const NOMBRE = process.env.USER_NAME || '[REDACTED]';
const CC = process.env.USER_CC;
const PLACA = process.env.USER_PLATE;
const CELULAR = process.env.USER_PHONE;
const EMAIL = process.env.USER_EMAIL;

const COMPARENDO = {
  id: '0000838097',
  fecha: '29 de marzo de 2026',
  hora: '13:43',
  lugar: 'Calle 63 Cra 45A Simon Bolivar',
  infraccion: 'C29 - Conducir a velocidad superior a la maxima permitida',
  velocidad: '60 km/h en zona de 50 km/h',
  deteccion: 'Fotodeteccion (DEI)',
  secretaria: 'Secretaria de Movilidad de Itagui',
  municipio: 'Itagui',
  valor: '$638,605 COP'
};

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m',
};

function getHtmlCuerpo() {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2.5cm; line-height: 1.6; }
  h2 { text-align: center; font-size: 14pt; margin-bottom: 20px; }
  h3 { font-size: 12pt; margin-top: 20px; }
  hr { margin: 15px 0; }
  ol, ul { margin-left: 20px; }
  li { margin-bottom: 8px; }
  strong { font-weight: bold; }
</style></head>
<body>
<h2>DERECHO DE PETICION - SOLICITUD CERTIFICADO DE CALIBRACION DEI</h2>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}</p>
<p><strong>Señores</strong><br>${COMPARENDO.secretaria}<br>${COMPARENDO.municipio}, Antioquia</p>
<hr>
<p><strong>ASUNTO:</strong> Derecho de Peticion - Solicitud de certificado de calibracion del Dispositivo Electronico de Infraccion (DEI) que capturo la presunta infraccion del comparendo No. ${COMPARENDO.id} - Placa ${PLACA}</p>
<p><strong>${NOMBRE}</strong>, mayor de edad, identificado con cedula de ciudadania No. <strong>${CC}</strong>, en ejercicio del derecho fundamental de peticion consagrado en el <strong>Articulo 23 de la Constitucion Politica de Colombia</strong> y la <strong>Ley 1755 de 2015</strong>, respetuosamente me dirijo a ustedes para solicitar informacion relacionada con el comparendo impuesto a mi vehiculo de placas ${PLACA}.</p>
<h3>HECHOS</h3>
<p><strong>PRIMERO:</strong> El dia ${COMPARENDO.fecha} a las ${COMPARENDO.hora}, en la direccion ${COMPARENDO.lugar}, fue impuesto el comparendo No. ${COMPARENDO.id} a mi vehiculo de placas ${PLACA}, por la infraccion ${COMPARENDO.infraccion} (${COMPARENDO.velocidad}), mediante sistema de fotodeteccion (DEI).</p>
<p><strong>SEGUNDO:</strong> Contra dicho comparendo interpuse RECURSO DE REPOSICION, el cual fue radicado bajo el numero <strong>AI26070618195823</strong>.</p>
<p><strong>TERCERO:</strong> La validez de la fotomulta depende de que el DEI haya sido calibrado dentro de los terminos establecidos por la normativa vigente (Resolucion 718 de 2018 y normas que la modifiquen).</p>
<h3>FUNDAMENTOS DE DERECHO</h3>
<ol>
  <li><strong>Constitucion Politica de Colombia, Articulo 23:</strong> Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades y a obtener pronta resolucion.</li>
  <li><strong>Ley 1755 de 2015:</strong> Regula el derecho fundamental de peticion y establece que toda solicitud debe ser resuelta en un termino maximo de 15 dias habiles.</li>
  <li><strong>Resolucion 718 de 2018, Articulo 8:</strong> Los Dispositivos Electronicos de Infraccion (DEI) deben contar con certificado de calibracion vigente expedido por laboratorio acreditado ante el IDEAM o la autoridad competente.</li>
  <li><strong>Codigo Nacional de Transito, Ley 769 de 2002:</strong> Las pruebas obtenidas con dispositivos no calibrados carecen de valor probatorio.</li>
  <li><strong>Sentencia C-951 de 2014 Corte Constitucional:</strong> Reitera que los DEI deben cumplir estrictamente con los requisitos tecnicos y de calibracion para que las multas tengan validez.</li>
</ol>
<h3>PETICIONES</h3>
<p>En virtud del derecho fundamental de peticion, solicito respetuosamente a la ${COMPARENDO.secretaria}:</p>
<ol>
  <li><strong>EXPEDIR</strong> copia completa del certificado de calibracion vigente del Dispositivo Electronico de Infraccion (DEI) que capturo la presunta infraccion del comparendo No. ${COMPARENDO.id}, especificando:
    <ul>
      <li>Numero de serie del DEI utilizado</li>
      <li>Fecha de la ultima calibracion antes del ${COMPARENDO.fecha}</li>
      <li>Fecha de vencimiento de dicha calibracion</li>
      <li>Laboratorio acreditado que realizo la calibracion</li>
      <li>Numero del certificado de calibracion</li>
    </ul>
  </li>
  <li><strong>INFORMAR</strong> si el DEI se encontraba con certificado de calibracion vigente al momento de la captura de la presunta infraccion (${COMPARENDO.fecha}).</li>
  <li><strong>APORTAR</strong> copia del registro de mantenimiento del DEI correspondiente al periodo en que se realizo la captura.</li>
</ol>
<h3>PRUEBAS</h3>
<ul>
  <li>Copia de la cedula de ciudadania (adjunta).</li>
  <li>Numero de radicado del Recurso de Reposicion: AI26070618195823.</li>
</ul>
<h3>ANEXOS</h3>
<ul>
  <li>Copia de este escrito.</li>
  <li>Copia del documento de identidad.</li>
</ul>
<h3>NOTIFICACIONES</h3>
<p>Recibire notificaciones en mi correo electronico <strong>${EMAIL}</strong> y en mi celular <strong>${CELULAR}</strong>.</p>
<p>Atentamente,</p>
<p><strong>${NOMBRE}</strong><br>CC ${CC}<br>${EMAIL}<br>Cel: ${CELULAR}</p>
</body></html>`;
}

const PDF_DIR = path.resolve(__dirname, '..', '..', 'data', 'legal');
const PDF_PATH = path.join(PDF_DIR, `derecho_peticion_calibracion_${COMPARENDO.id}.pdf`);

async function generarPdf(html) {
  console.log(`\n   ${C.cyan}Generando PDF con Playwright...${C.reset}`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
    printBackground: true,
  });
  await browser.close();
  const sizeKB = (fs.statSync(PDF_PATH).size / 1024).toFixed(1);
  console.log(`   ${C.green}✅ PDF generado: ${PDF_PATH} (${sizeKB} KB)${C.reset}`);
  return PDF_PATH;
}

function buildReplyMime(to, subject, bodyHtml, pdfPath, threadMessageId) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfB64 = pdfBuffer.toString('base64');
  const boundary = '==BOUNDARY_LIFEOS_DP_8097==';
  const headers = [
    `To: ${to}`,
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `References: ${threadMessageId}`,
    `In-Reply-To: ${threadMessageId}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
  ].join('\n');

  const body = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyHtml,
    `--${boundary}`,
    'Content-Type: application/pdf',
    `Content-Disposition: attachment; filename="derecho_peticion_calibracion_${COMPARENDO.id}.pdf"`,
    'Content-Transfer-Encoding: base64',
    '',
    pdfB64,
    `--${boundary}--`,
  ].join('\n');

  return Buffer.from(headers + body)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function buscarHiloMartha(gmail) {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:mirian.sanchez@fcm.org.co RV',
    maxResults: 5,
  });
  const msgs = res.data.messages || [];
  if (msgs.length === 0) return null;
  for (const msg of msgs) {
    const detail = await gmail.users.messages.get({
      userId: 'me', id: msg.id, format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });
    const headers = detail.data.payload.headers;
    const getH = (n) => headers.find(h => h.name === n)?.value || '';
    const from = getH('From');
    const subject = getH('Subject');
    if (from.toLowerCase().includes('mirian.sanchez') && subject.toLowerCase().includes('rv')) {
      return detail.data;
    }
  }
  return msgs.length > 0 ? (await gmail.users.messages.get({ userId: 'me', id: msgs[0].id })).data : null;
}

async function main() {
  console.log(`\n${C.cyan}${C.bold}╔══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.cyan}${C.bold}║  📬 RESPONDER A MARTHA — FCM/SIMIT               ║${C.reset}`);
  console.log(`${C.cyan}${C.bold}╚══════════════════════════════════════════════════╝${C.reset}\n`);

  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Buscar hilo de Martha
  console.log(`${C.cyan}🔍 Buscando correo de Martha Mirian Sánchez...${C.reset}`);
  const marthaMsg = await buscarHiloMartha(gmail);
  if (!marthaMsg) {
    console.log(`\n${C.red}❌ No se encontró el correo de Martha en la bandeja.${C.reset}`);
    console.log(`   Busca manualmente en Gmail: "from:mirian.sanchez@fcm.org.co RV"`);
    process.exit(1);
  }
  const threadId = marthaMsg.threadId;
  const msgId = marthaMsg.id;
  const headers = marthaMsg.payload.headers;
  const marthaEmail = headers.find(h => h.name === 'From')?.value || 'mirian.sanchez@fcm.org.co';
  const marthaSubject = headers.find(h => h.name === 'Subject')?.value || 'RV: RV:';
  console.log(`   ${C.green}✅ Encontrado: "${marthaSubject}"${C.reset}`);
  console.log(`   ${C.dim}   Thread: ${threadId}${C.reset}`);
  console.log(`   ${C.dim}   From: ${marthaEmail}${C.reset}`);

  // 2. Generar HTML del derecho de petición
  console.log(`\n${C.cyan}📄 Generando derecho de petición (Comparendo ${COMPARENDO.id})...${C.reset}`);
  const html = getHtmlCuerpo();
  if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

  // 3. Convertir a PDF
  try {
    await generarPdf(html);
  } catch (err) {
    console.log(`\n${C.red}❌ Error generando PDF: ${err.message}${C.reset}`);
    console.log(`   ${C.yellow}💡 Puede que falten los navegadores de Playwright.${C.reset}`);
    console.log(`   ${C.yellow}   Ejecuta: npx playwright install chromium${C.reset}`);
    process.exit(1);
  }

  // 4. Armar reply con PDF adjunto
  const subject = `Re: ${marthaSubject}`;
  const bodyHtml = `
<p>Cordial saludo Martha,</p>
<p>Adjunto en formato PDF el Derecho de Peticion solicitando el certificado de calibracion del DEI para el comparendo No. ${COMPARENDO.id}.</p>
<p>Quedo atento a cualquier informacion adicional que requieran para remitir por competencia al organismo de transito de Itagui.</p>
<p>Atentamente,<br><strong>${NOMBRE}</strong></p>
  `.trim();

  console.log(`\n${C.cyan}📤 Enviando respuesta a Martha con PDF adjunto...${C.reset}`);
  const raw = buildReplyMime(marthaEmail, subject, bodyHtml, PDF_PATH, msgId);

  try {
    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId },
    });
    console.log(`\n${C.green}${C.bold}✅ RESPUESTA ENVIADA${C.reset}`);
    console.log(`   ${C.dim}ID: ${sent.data.id}${C.reset}`);
    console.log(`   ${C.dim}Thread: ${threadId}${C.reset}`);
  } catch (err) {
    console.log(`\n${C.red}❌ Error enviando: ${err.message}${C.reset}`);
    process.exit(1);
  }

  // 5. Guardar en memoria
  try {
    agregarHecho(
      'transito',
      `Respuesta enviada a Martha Mirian Sanchez (FCM/SIMIT) con PDF del Derecho de Peticion del comparendo ${COMPARENDO.id} adjunto. Ella lo remitira por competencia a la Secretaria de Movilidad de Itagui.`,
      ['simit', 'fcm', 'martha', 'comparendo_8097', 'derecho_peticion']
    );
    console.log(`   ${C.green}✅ Registrado en memoria.${C.reset}`);
  } catch (e) {
    console.log(`   ${C.yellow}⚠️ Memoria: ${e.message}${C.reset}`);
  }

  console.log(`\n${C.green}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.green}${C.bold}  ✅ PROCESO COMPLETADO${C.reset}`);
  console.log(`${C.green}${C.bold}══════════════════════════════════════════════════${C.reset}`);
  console.log(`   📄 PDF guardado: ${PDF_PATH}`);
  console.log(`   📬 Respondido a: ${marthaEmail}`);
  console.log(`   🔗 Thread: ${threadId}\n`);
}

main().catch(err => {
  console.error(`\n${C.red}❌ Fatal: ${err.message}${C.reset}`);
  process.exit(1);
});
