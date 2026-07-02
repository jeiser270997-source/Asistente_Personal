const { google } = require('googleapis');
const { authorize } = require('./auth');

const CATEGORIES = {
  'LifeOS/Tránsito': 'from:comunicacionsimit@fcm.org.co OR from:serviciosdigitales@movilidadmedellin.com.co OR from:transitoitagui@itagui.gov.co',
  'LifeOS/Legal_y_UGPP': 'from:atencionalciudadano@itagui.gov.co OR from:nuntius.once@fiscalia.gov.co OR from:contactenossgdea@ugpp.gov.co OR subject:NUNC',
  'LifeOS/Educación': 'from:senasofia19@senavirtual.edu.co OR from:mvargas@cesde.edu.co OR from:becascesdecomfama@cesde.edu.co OR from:notificacionesmen@mineducacion.gov.co',
  'LifeOS/Proyectos_y_Empleo': 'from:firebase-noreply@google.com OR from:noreply@github.com OR from:gabriela.avalos@solvoglobal.com'
};

async function getOrCreateLabel(gmail, labelName) {
  // First, check if label exists
  const res = await gmail.users.labels.list({ userId: 'me' });
  const labels = res.data.labels;
  const existingLabel = labels.find(l => l.name === labelName);
  
  if (existingLabel) {
    return existingLabel.id;
  }
  
  // Create label
  console.log(`Creando etiqueta: ${labelName}`);
  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    }
  });
  return created.data.id;
}

async function organizeEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('📁 Iniciando organización de correos por carpetas...');

  // Ensure parent label "LifeOS" exists? Actually Gmail supports creating nested labels implicitly 
  // if you name them "Parent/Child" as long as "Parent" exists or the client supports it.
  // We'll just create the exact names since Gmail handles 'A/B' as nested automatically.

  for (const [labelName, query] of Object.entries(CATEGORIES)) {
    try {
      const labelId = await getOrCreateLabel(gmail, labelName);
      console.log(`Buscando correos para [${labelName}]...`);
      
      let pageToken = undefined;
      let totalMoved = 0;
      
      do {
        const res = await gmail.users.messages.list({
          userId: 'me',
          q: `(${query}) in:inbox`,
          maxResults: 100,
          pageToken: pageToken
        });
        
        const messages = res.data.messages;
        if (messages && messages.length > 0) {
          console.log(`  Encontrados ${messages.length} correos. Moviendo...`);
          
          for (const msg of messages) {
            await gmail.users.messages.modify({
              userId: 'me',
              id: msg.id,
              requestBody: {
                addLabelIds: [labelId],
                removeLabelIds: ['INBOX']
              }
            });
            totalMoved++;
          }
        }
        
        pageToken = res.data.nextPageToken;
      } while (pageToken);
      
      console.log(`✅ Se movieron ${totalMoved} correos a ${labelName}.`);
    } catch (e) {
      console.log(`Error en categoría ${labelName}: ${e.message}`);
    }
  }

  console.log('\n🎉 ¡Todos los correos han sido organizados y archivados correctamente!');
}

authorize().then(organizeEmails).catch(console.error);
