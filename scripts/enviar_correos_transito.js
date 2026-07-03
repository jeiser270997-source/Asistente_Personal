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
  const toSimit = 'contactosimit@fcm.org.co, transitoitagui@itagui.gov.co';
  const subjectSimit = 'SOLICITUD DE DESCARGUE INMEDIATO - COMPARENDO 0000430265 ANULADO POR ITAGÜÍ';
  const bodySimit = `
    <p>Señores SIMIT / Federación Colombiana de Municipios:</p>
    <p>Por medio de la presente, solicito la actualización de la plataforma SIMIT y el descargue inmediato del comparendo No. <strong>0000430265</strong> (Placa KEW496).</p>
    <p>La Secretaría de Movilidad de Itagüí ya resolvió favorablemente la nulidad de esta obligación, y la misma ya no figura en el estado de cuenta local de la Alcaldía de Itagüí. Sin embargo, en el sistema SIMIT nacional sigue apareciendo un cobro coactivo inexistente por valor de $566.587.</p>
    <p>Solicito se proceda a sincronizar las bases de datos de manera inmediata para corregir este reporte negativo, garantizando mi derecho constitucional al Habeas Data.</p>
    <p>Atentamente,<br>Jeiser Abraham Gutiérrez Torres<br>CC 1019156838</p>
  `;

  // CORREO 2: ITAGÜÍ (Derecho de Petición multa nueva)
  const toItagui = 'atencionalciudadano@itagui.gov.co, transitoitagui@itagui.gov.co';
  const subjectItagui = 'DERECHO DE PETICIÓN - SOLICITUD NULIDAD FOTODETECCIÓN 0000838097 (PLACA KEW496)';
  const bodyItagui = `
    <p><strong>DERECHO DE PETICIÓN (Art. 23 Constitución Política)</strong></p>
    <p><strong>Señores Secretaría de Movilidad de Itagüí:</strong></p>
    <p>Yo, Jeiser Abraham Gutiérrez Torres, identificado con CC 1019156838, actuando en nombre propio, presento Derecho de Petición respecto a la Resolución del comparendo No. <strong>0000838097</strong> (Infracción C29, Placa KEW496), fechada el 22/06/2026, fundamentado en lo siguiente:</p>
    <ol>
      <li>Me he enterado de la existencia de esta resolución al consultar la plataforma SIMIT, sin haber recibido notificación personal en debida forma que garantice mi derecho a la defensa.</li>
      <li>Invoco la <strong>Sentencia C-038 de 2020 de la Corte Constitucional</strong>, la cual declaró inexequible la solidaridad entre el propietario del vehículo y el conductor. La Secretaría de Movilidad tiene la carga probatoria de identificar plenamente quién conducía el vehículo al momento de la presunta infracción.</li>
      <li>Al no existir plena prueba de mi identidad como infractor, la sanción carece de validez legal.</li>
    </ol>
    <p><strong>PETICIONES:</strong></p>
    <ol>
      <li>Solicito la revocatoria directa y nulidad de la Resolución sancionatoria asociada al comparendo 0000838097.</li>
      <li>Solicito la suspensión inmediata de cualquier medida cautelar o cobro coactivo derivado de este comparendo mientras se resuelve de fondo esta petición.</li>
      <li>Solicito copia de la guía de envío de la empresa de mensajería con la cual presuntamente se me notificó este comparendo.</li>
    </ol>
    <p>Recibiré notificaciones en este mismo correo electrónico.</p>
    <p>Atentamente,<br>Jeiser Abraham Gutiérrez Torres<br>CC 1019156838</p>
  `;

  try {
    console.log('1. Enviando solicitud de descargue SIMIT (Multa 0000430265)...');
    const rawSimit = generarMensajeCodificado(toSimit, subjectSimit, bodySimit);
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: rawSimit } });
    console.log('✅ Correo SIMIT enviado.');

    console.log('2. Enviando Derecho de Petición Itagüí (Multa 0000838097)...');
    const rawItagui = generarMensajeCodificado(toItagui, subjectItagui, bodyItagui);
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: rawItagui } });
    console.log('✅ Correo Itagüí enviado.');

    console.log('\n🎉 Todos los correos de tránsito se enviaron correctamente.');
  } catch (error) {
    console.error('❌ Error en el proceso de envío:', error.message);
  }
}

authorize().then(procesarEnvios).catch(console.error);
