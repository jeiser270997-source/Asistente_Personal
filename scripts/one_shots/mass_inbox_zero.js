require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const { authorize: googleAuthorize } = require('../../lib/integrations/google_auth');

async function massInboxZero() {
  console.log('🧹 Iniciando Inbox Zero Masivo...');
  const auth = await googleAuthorize(['https://mail.google.com/']);
  const gmail = google.gmail({ version: 'v1', auth });

  let pageToken = undefined;
  let totalProcessed = 0;
  let totalTrashed = 0;
  let totalArchived = 0;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 100,
      pageToken
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) break;

    console.log(`🔍 Analizando lote de ${messages.length} correos...`);

    for (const message of messages) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me', id: message.id, format: 'metadata',
          metadataHeaders: ['Subject', 'From']
        });
        
        const headers = msg.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const text = `${from} ${subject}`.toLowerCase();
        
        // Reglas basicas para borrar basura (Newsletters, Promociones, Redes)
        const SPAM_KEYWORDS = ['newsletter', 'oferta', 'descuento', 'promocion', 'rebajas', 'suscripcion', 'linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube', 'noreply', 'no-reply'];
        
        // Reglas basicas para marcar como importantes
        const IMPORTANT_KEYWORDS = ['dian', 'simit', 'cesde', 'sena', 'solvo', 'concentrix', 'multa', 'comparendo', 'tarea', 'urgente', 'notificacion judicial', 'embargo', 'mandamiento', 'citacion', 'requerimiento', 'entrevista', 'factura', 'contrato', 'nomina', 'salario'];

        const isSpam = SPAM_KEYWORDS.some(kw => text.includes(kw));
        const isImportant = IMPORTANT_KEYWORDS.some(kw => text.includes(kw));

        if (isSpam && !isImportant) {
          console.log(`🔴 BORRANDO: ${subject.substring(0, 50)}`);
          await gmail.users.messages.trash({ userId: 'me', id: message.id });
          totalTrashed++;
        } else if (isImportant) {
          console.log(`🟢 ARCHIVANDO Y DESTACANDO: ${subject.substring(0, 50)}`);
          await gmail.users.messages.modify({ userId: 'me', id: message.id, resource: { removeLabelIds: ['INBOX', 'UNREAD'], addLabelIds: ['STARRED'] } });
          totalArchived++;
        } else {
          console.log(`⚪ ARCHIVANDO: ${subject.substring(0, 50)}`);
          await gmail.users.messages.modify({ userId: 'me', id: message.id, resource: { removeLabelIds: ['INBOX', 'UNREAD'] } });
          totalArchived++;
        }
        totalProcessed++;
      } catch (e) {
        console.log(`Error procesando mensaje: ${e.message}`);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`\n========================================================`);
  console.log(`✅ INBOX ZERO COMPLETADO`);
  console.log(`Total procesados en INBOX: ${totalProcessed}`);
  console.log(`Total eliminados a Papelera: ${totalTrashed}`);
  console.log(`Total archivados (fuera del Inbox): ${totalArchived}`);
  console.log(`========================================================\n`);
}

massInboxZero().catch(console.error);
