const { google } = require('googleapis');
const { authorize } = require('./auth');

async function main(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Buscar correos ENVIADOS sobre 0000838097
  console.log('=== CORREOS ENVIADOS SOBRE 0000838097 ===\n');
  const sent = await gmail.users.messages.list({
    userId: 'me', q: 'in:sent 0000838097', maxResults: 10
  });
  if (sent.data.messages) {
    for (const ref of sent.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date']
      });
      const h = msg.data.payload.headers;
      console.log('Asunto: ' + (h.find(x => x.name === 'Subject')?.value || ''));
      console.log('Para: ' + (h.find(x => x.name === 'To')?.value || ''));
      console.log('Fecha: ' + (h.find(x => x.name === 'Date')?.value || ''));
      console.log('---');
    }
  } else {
    console.log('No se encontraron enviados');
  }

  // 2. Buscar correos ENVIADOS sobre fotodeteccion / nulidad
  console.log('\n=== CORREOS ENVIADOS SOBRE FOTODETECCION / NULIDAD ===\n');
  const sent2 = await gmail.users.messages.list({
    userId: 'me', q: 'in:sent (fotodeteccion OR nulidad OR impugnacion) itagui', maxResults: 10
  });
  if (sent2.data.messages) {
    for (const ref of sent2.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date']
      });
      const h = msg.data.payload.headers;
      console.log('Asunto: ' + (h.find(x => x.name === 'Subject')?.value || ''));
      console.log('Para: ' + (h.find(x => x.name === 'To')?.value || ''));
      console.log('Fecha: ' + (h.find(x => x.name === 'Date')?.value || ''));
      console.log('---');
    }
  }

  // 3. Buscar RESPUESTAS de Itagui sobre 0000838097 o fotodeteccion
  console.log('\n=== RESPUESTAS DE ITAGUI SOBRE 0000838097 ===\n');
  const resp = await gmail.users.messages.list({
    userId: 'me', q: 'from:(itagui.gov.co) (0000838097 OR fotodeteccion)', maxResults: 10
  });
  if (resp.data.messages) {
    for (const ref of resp.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      const h = msg.data.payload.headers;
      console.log('Asunto: ' + (h.find(x => x.name === 'Subject')?.value || ''));
      console.log('De: ' + (h.find(x => x.name === 'From')?.value || ''));
      console.log('Fecha: ' + (h.find(x => x.name === 'Date')?.value || ''));
      console.log('---');
    }
  } else {
    console.log('No hay respuestas de Itagüí sobre 0000838097');
  }
}
authorize().then(main).catch(console.error);
