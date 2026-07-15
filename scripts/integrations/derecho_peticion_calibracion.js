const { google } = require('googleapis');
const { authorize } = require('../../lib/integrations/google_auth');
const { agregarHecho } = require('../../lib/memory/memory_engine');
const path = require('node:path');
const fs = require('node:fs');

const NOMBRE = 'Jeiser Abraham Gutierrez Torres';
const CC = '1019156838';
const PLACA = 'KEW496';
const CELULAR = '3044615613';
const EMAIL = 'jeiser270997@gmail.com';

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

function generarMensajeCodificado(to, cc, subject, bodyHtml) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const ccLine = cc ? `Cc: ${cc}\n` : '';
  const mensajeMime = [
    `To: ${to}`,
    ccLine,
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

const CUERPO_DERECHO_PETICION = `
<h2>DERECHO DE PETICION - SOLICITUD CERTIFICADO DE CALIBRACION DEI</h2>

<p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}</p>

<p><strong>Señores</strong><br>
${COMPARENDO.secretaria}<br>
${COMPARENDO.municipio}, Antioquia</p>

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

<p><strong>${NOMBRE}</strong><br>
CC ${CC}<br>
${EMAIL}<br>
Cel: ${CELULAR}</p>
`;

async function enviarDerechoPeticion() {
  console.log('═══════════════════════════════════════');
  console.log('📧 ENVIANDO DERECHO DE PETICION');
  console.log('   Asunto: Certificado de Calibracion DEI');
  console.log(`   Comparendo: ${COMPARENDO.id}`);
  console.log(`   Placa: ${PLACA}`);
  console.log('═══════════════════════════════════════\n');

  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const recipients = [
    { to: 'contacto@itagui.gov.co', cc: '', label: 'Contacto Itagui' },
    { to: 'movilidad@itagui.gov.co', cc: '', label: 'Movilidad Itagui' },
    { to: 'contactosimit@fcm.org.co', cc: '', label: 'SIMIT FCM' },
    { to: 'transito@itagui.gov.co', cc: '', label: 'Transito Itagui' },
  ];

  const subject = `DERECHO DE PETICION - Certificado Calibracion DEI - Comparendo ${COMPARENDO.id} - Placa ${PLACA}`;

  let enviados = 0;
  let fallidos = 0;

  for (const rec of recipients) {
    try {
      console.log(`   Enviando a: ${rec.to} (${rec.label})...`);
      const raw = generarMensajeCodificado(rec.to, rec.cc, subject, CUERPO_DERECHO_PETICION);
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
      console.log(`   ✅ Enviado a ${rec.label}`);
      enviados++;
    } catch (err) {
      console.log(`   ⚠ ${rec.label}: ${err.message.substring(0, 60)}`);
      fallidos++;
    }
  }

  // Save a local copy
  const docDir = path.join(__dirname, '..', 'data', 'legal');
  if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
  const docPath = path.join(docDir, `derecho_peticion_calibracion_${COMPARENDO.id}.html`);
  fs.writeFileSync(docPath, CUERPO_DERECHO_PETICION, 'utf8');

  console.log(`\n✅ ${enviados} correos enviados, ${fallidos} fallidos`);
  console.log(`   📄 Copia guardada en: ${docPath}`);

  // Log in memory
  agregarHecho(
    'legal',
    `Derecho de Peticion solicitando certificado de calibracion DEI para comparendo ${COMPARENDO.id} (C29 Itagui, ${COMPARENDO.fecha}) enviado por correo el ${new Date().toLocaleDateString('es-CO', {timeZone:'America/Bogota'})}.`,
    ['simit', 'itagui', 'fotomulta', 'calibracion', 'derecho_peticion'],
    'email_automatico'
  );

  console.log('   📝 Hecho registrado en memoria');
}

enviarDerechoPeticion().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
