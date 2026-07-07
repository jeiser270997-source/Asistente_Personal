const { google } = require('googleapis');
const { authorize } = require('./auth');

async function main(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  // Leer los enviados SIN asunto (Jul 5) - probablemente tienen el contenido real
  const sent = await gmail.users.messages.list({
    userId: 'me', q: 'in:sent 0000838097', maxResults: 10
  });

  for (const ref of sent.data.messages || []) {
    const msg = await gmail.users.messages.get({
      userId: 'me', id: ref.id, format: 'full'
    });
    const h = msg.data.payload.headers;
    const subject = h.find(x => x.name === 'Subject')?.value || '(sin asunto)';
    const to = h.find(x => x.name === 'To')?.value || '';
    const date = h.find(x => x.name === 'Date')?.value || '';

    console.log('========================================');
    console.log('Para: ' + to);
    console.log('Asunto: ' + subject);
    console.log('Fecha: ' + date);

    // Extraer cuerpo
    let body = '';
    const parts = msg.data.payload.parts || [];
    for (const p of parts) {
      if (p.mimeType === 'text/plain' && p.body.data) {
        body = Buffer.from(p.body.data, 'base64').toString('utf8');
        break;
      }
      if (p.parts) {
        for (const p2 of p.parts) {
          if (p2.mimeType === 'text/plain' && p2.body.data) {
            body = Buffer.from(p2.body.data, 'base64').toString('utf8');
            break;
          }
        }
      }
    }

    if (body) {
      console.log('---CUERPO (primeros 2000 chars)---');
      console.log(body.substring(0, 2000));
    }

    // Ver si tiene adjuntos
    let attCount = 0;
    function countAtts(parts) {
      for (const p of parts || []) {
        if (p.filename && p.filename.length > 0 && p.body.attachmentId) attCount++;
        if (p.parts) countAtts(p.parts);
      }
    }
    countAtts(msg.data.payload.parts);
    if (attCount > 0) console.log('Adjuntos: ' + attCount);

    console.log('');
  }

  // También buscar respuestas de Itagüí sobre recurso de reposición
  console.log('\n======== RESPUESTAS DE ITAGUI SOBRE RECURSO REPOSICION ========\n');
  const resp = await gmail.users.messages.list({
    userId: 'me', q: 'from:(itagui.gov.co) reposicion', maxResults: 10
  });
  if (resp.data.messages) {
    for (const ref of resp.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      const h = msg.data.payload.headers;
      console.log('De: ' + (h.find(x => x.name === 'From')?.value || ''));
      console.log('Asunto: ' + (h.find(x => x.name === 'Subject')?.value || ''));
      console.log('Fecha: ' + (h.find(x => x.name === 'Date')?.value || ''));
      console.log('---');
    }
  } else {
    console.log('No hay respuestas');
  }
}
authorize().then(main).catch(console.error);
