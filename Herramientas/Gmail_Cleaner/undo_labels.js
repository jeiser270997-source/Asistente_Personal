const { google } = require('googleapis');
const { authorize } = require('./auth');

async function undoLabels(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  try {
    const res = await gmail.users.labels.list({ userId: 'me' });
    const labels = res.data.labels;
    
    const lifeOsLabels = labels.filter(l => l.name.startsWith('LifeOS'));
    
    if (lifeOsLabels.length === 0) {
      console.log('No se encontraron etiquetas de LifeOS.');
      return;
    }
    
    console.log(`Borrando ${lifeOsLabels.length} etiquetas...`);
    for (const label of lifeOsLabels) {
      await gmail.users.labels.delete({
        userId: 'me',
        id: label.id
      });
      console.log(`✅ Etiqueta borrada: ${label.name}`);
    }
    console.log('¡Listo! Todas las etiquetas fueron eliminadas.');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

authorize().then(undoLabels).catch(console.error);
