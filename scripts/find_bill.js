const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');

async function findBill() {
  try {
    const auth = await authorize(['https://mail.google.com/']);
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Buscar correos de EPM o facturas
    const query = '308000 OR 308.000 OR epm';
    console.log(`Buscando con query: ${query}`);
    
    const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 15 });
    const messages = res.data.messages || [];
    
    if (messages.length === 0) {
      console.log('No se encontraron facturas recientes.');
      return;
    }

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
      const headers = detail.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
      const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
      console.log(`\n============================`);
      console.log(`De: ${from}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Snippet: ${detail.data.snippet}`);
      
      // Intentar extraer el valor
      const snippetStr = detail.data.snippet || '';
      if (snippetStr.includes('308')) {
        console.log('⭐ ESTE CORREO MENCIONA EL VALOR 308!');
      }
    }
  } catch (err) {
    console.error('Error buscando factura:', err.message);
  }
}

findBill();
