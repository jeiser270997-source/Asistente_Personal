const { google } = require('googleapis');
const { authorize } = require('../lib/google_auth');
const { agregarHecho } = require('../lib/memory_engine');

const NOMBRE = 'Jeiser Abraham Gutierrez Torres';
const CC = '1019156838';
const PLACA = 'KEW496';
const DIRECCION = 'KR 100 A No. 12 ...'; // RUNT address

const COMPARENDO = {
  id: '0000838097',
  fecha: '22 de junio de 2026',
  infraccion: 'C29 - Conducir a velocidad superior a la maxima permitida',
  deteccion: 'Fotodeteccion (DEI)',
  secretaria: 'Secretaria de Movilidad de Itagui',
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

const CUERPO_IMPUGNACION = `
<h2>RECURSO DE REPOSICION - COMPARENDO ${COMPARENDO.id}</h2>

<p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}</p>

<p><strong>Señores</strong><br>
${COMPARENDO.secretaria}<br>
Itagui, Antioquia</p>

<hr>

<p><strong>ASUNTO:</strong> Recurso de Reposicion contra Comparendo No. ${COMPARENDO.id} - Placa ${PLACA}</p>

<p><strong>${NOMBRE}</strong>, mayor de edad, identificado con cedula de ciudadania No. <strong>${CC}</strong>, con domicilio en la direccion registrada en el RUNT, por medio del presente escrito presento <strong>RECURSO DE REPOSICION</strong> contra el comparendo de la referencia, con base en los siguientes:</p>

<h3>HECHOS</h3>

<p><strong>PRIMERO:</strong> El dia ${COMPARENDO.fecha}, la ${COMPARENDO.secretaria} impuso el comparendo No. ${COMPARENDO.id} por la infraccion ${COMPARENDO.infraccion}, mediante sistema de ${COMPARENDO.deteccion}, por un valor de ${COMPARENDO.valor}.</p>

<p><strong>SEGUNDO:</strong> El suscrito NO ha recibido notificacion fisica del comparendo en la direccion registrada ante el RUNT (${DIRECCION}), incumpliendo lo establecido en el articulo 135 del Codigo Nacional de Transito y la Ley 1843 de 2017.</p>

<p><strong>TERCERO:</strong> La imposicion de la multa sin notificacion en debida forma vulnera mi derecho fundamental al debido proceso (Articulo 29 Constitucion Politica) y mi derecho de defensa y contradiccion.</p>

<h3>FUNDAMENTOS DE DERECHO</h3>

<ol>
  <li><strong>Ley 1843 de 2017, Articulo 7:</strong> Establece que las autoridades de transito deben notificar la infraccion dentro de los tres (3) dias habiles siguientes a la validacion del comparendo, mediante notificacion fisica a la direccion registrada en el RUNT.</li>
  <li><strong>Codigo Nacional de Transito, Articulo 135:</strong> Regula el procedimiento de notificacion de comparendos por medios electronicos.</li>
  <li><strong>Constitucion Politica, Articulo 29:</strong> Garantiza el debido proceso en todas las actuaciones judiciales y administrativas, incluyendo el derecho a ser notificado, presentar pruebas y controvertir las que se alleguen en su contra.</li>
  <li><strong>Resolucion 718 de 2018:</strong> Establece los requisitos tecnicos que deben cumplir los Dispositivos Electronicos de Infraccion (DEI), incluyendo certificacion de calibracion vigente y senalizacion adecuada.</li>
  <li><strong>Sentencia C-980 de 2010 de la Corte Constitucional:</strong> Reconoce que la notificacion es un elemento estructural del debido proceso, y su omision genera nulidad de la actuacion administrativa.</li>
</ol>

<h3>PETICIONES</h3>

<p>Solicito respetuosamente a la ${COMPARENDO.secretaria}:</p>

<ol>
  <li><strong>REVOCAR</strong> el comparendo No. ${COMPARENDO.id} por indebida notificacion y violacion al debido proceso.</li>
  <li><strong>APORTAR</strong> al expediente el certificado de calibracion vigente del Dispositivo Electronico de Infraccion (DEI) utilizado para la imposicion de esta multa.</li>
  <li><strong>APORTAR</strong> la evidencia fotografica que soporta la infraccion, donde se identifique claramente la placa del vehiculo, fecha, hora, velocidad y ubicacion.</li>
  <li><strong>ORDENAR</strong> el descargue inmediato de esta obligacion del sistema SIMIT en caso de que el recurso sea resuelto favorablemente.</li>
</ol>

<h3>PRUEBAS</h3>
<ul>
  <li>Copia de la cedula de ciudadania.</li>
  <li>Certificado de tradicion del vehiculo ${PLACA} (si se requiere).</li>
  <li>Estado de cuenta SIMIT donde consta la multa.</li>
  <li>Las que se allegaran en el termino probatorio.</li>
</ul>

<h3>ANEXOS</h3>
<ul>
  <li>Copia de este escrito.</li>
  <li>Copia de documento de identidad.</li>
</ul>

<h3>NOTIFICACIONES</h3>
<p>Recibire notificaciones en la direccion registrada en el RUNT (${DIRECCION}) y en el correo electronico <strong>jeiser270997@gmail.com</strong>.</p>

<p>Cordialmente,</p>

<p><strong>${NOMBRE}</strong><br>
CC ${CC}<br>
jeiser270997@gmail.com<br>
Cel: +57 (el que tengas registrado)</p>
`;

async function enviarImpugnacion() {
  console.log('═══════════════════════════════════════');
  console.log('📧 ENVIANDO RECURSO DE REPOSICION');
  console.log(`   Comparendo: ${COMPARENDO.id}`);
  console.log(`   Placa: ${PLACA}`);
  console.log('═══════════════════════════════════════\n');

  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const recipients = [
    {
      to: 'contactosimit@fcm.org.co',
      cc: '',
      label: 'SIMIT FCM'
    }
  ];

  // Try finding Itagui-specific email
  const itaguiEmails = [
    'contacto@itagui.gov.co',
    'movilidad@itagui.gov.co',
    'secretariamovilidad@itagui.gov.co',
    'pqrs@itagui.gov.co'
  ];

  for (const email of itaguiEmails) {
    recipients.push({ to: email, cc: '', label: 'Itagui Movilidad' });
  }

  const subject = `RECURSO DE REPOSICION - Comparendo ${COMPARENDO.id} - Placa ${PLACA} - ${NOMBRE}`;

  let enviados = 0;
  let fallidos = 0;

  for (const rec of recipients) {
    try {
      console.log(`   Enviando a: ${rec.to} (${rec.label})...`);
      const raw = generarMensajeCodificado(rec.to, rec.cc, subject, CUERPO_IMPUGNACION);
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
      console.log(`   ✅ Enviado a ${rec.label}`);
      enviados++;
    } catch (err) {
      console.log(`   ⚠ ${rec.label}: ${err.message.substring(0, 60)}`);
      fallidos++;
    }
  }

  console.log(`\n✅ ${enviados} correos enviados, ${fallidos} fallidos`);

  // Registrar en memoria
  agregarHecho(
    'legal',
    `Recurso de reposicion contra comparendo ${COMPARENDO.id} (C29 Itagui, ${COMPARENDO.fecha}) enviado por correo el ${new Date().toLocaleDateString('es-CO', {timeZone:'America/Bogota'})}.`,
    ['simit', 'itagui', 'impugnacion', 'recurso'],
    'email_automatico'
  );

  console.log('   📝 Hecho registrado en memoria');
}

enviarImpugnacion().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
