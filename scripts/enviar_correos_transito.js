const { google } = require('googleapis');
const { authorize } = require('../lib/google_auth');

function generarMensajeCodificado(to, subject, bodyHtml) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const mensajeMime = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyHtml
  ].join('\n');

  return Buffer.from(mensajeMime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function procesarEnvios(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  // CORREO 1: SIMIT (Desactualización multa vieja)
  const toSimit = 'contactosimit@fcm.org.co';
  const subjectSimit = 'SOLICITUD DE DESCARGUE INMEDIATO - COMPARENDO 0000430265 ANULADO POR ITAGÜÍ';
  const bodySimit = `
    <p>Señores SIMIT / Federación Colombiana de Municipios:</p>
    <p>Por medio de la presente, solicito la actualización de la plataforma SIMIT y el descargue inmediato del comparendo No. <strong>0000430265</strong> (Placa KEW496).</p>
    <p>La Secretaría de Movilidad de Itagüí ya resolvió favorablemente la nulidad de esta obligación, y la misma ya no figura en el estado de cuenta local de la Alcaldía de Itagüí. Sin embargo, en el sistema SIMIT nacional sigue apareciendo un cobro coactivo inexistente por valor de $566.587.</p>
    <p>Solicito se proceda a sincronizar las bases de datos de manera inmediata para corregir este reporte negativo, garantizando mi derecho constitucional al Habeas Data.</p>
    <p>Atentamente,<br>Jeiser Abraham Gutiérrez Torres<br>CC 1019156838</p>
  `;

  try {
    console.log('Enviando solicitud de descargue SIMIT (Multa 0000430265)...');
    const rawSimit = generarMensajeCodificado(toSimit, subjectSimit, bodySimit);
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: rawSimit } });
    console.log('✅ Correo SIMIT enviado.');
  } catch (error) {
    console.error('❌ Error en el proceso de envío:', error.message);
  }
}

authorize().then(procesarEnvios).catch(console.error);
