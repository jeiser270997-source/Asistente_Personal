const { authorize } = require('../../Herramientas/Gmail_Cleaner/auth');
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const temporal = require('./temporal'); // Conectar con la memoria

// Lóbulo Sensorial - Procesa inputs externos de manera silenciosa
class LobuloOccipital {
  async barrerBandejaEntrada() {
    console.log('[Occipital] Iniciando barrido visual de la bandeja de entrada...');
    try {
      const auth = await authorize();
      const gmail = google.gmail({ version: 'v1', auth });
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox is:unread',
        maxResults: 10
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) {
        console.log('[Occipital] Bandeja limpia. Sin nuevos estímulos.');
        return;
      }

      let nuevosDatos = '';
      for (const msg of messages) {
        const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From'] });
        const headers = detail.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
        const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
        
        nuevosDatos += `- Recibido de ${from}: ${subject}\n`;
      }

      // Consolidar en memoria sin interrumpir el frontal
      this.consolidarMemoria(nuevosDatos);

    } catch (error) {
      console.error('[Occipital] Falla en los receptores visuales:', error.message);
    }
  }

  consolidarMemoria(datos) {
    if (!datos) return;
    const notasPath = path.join(__dirname, '..', '..', 'data', 'notas.md');
    const timestamp = new Date().toISOString();
    const bloque = `\n\n## Percepción Automática (${timestamp})\n${datos}`;
    
    fs.appendFileSync(notasPath, bloque);
    console.log('[Occipital] Estímulos guardados en notas.md.');
    
    // Forzar al lóbulo temporal a reindexar la nueva información
    temporal.reindex();
  }
}

module.exports = new LobuloOccipital();
