/**
 * scripts/maintenance/wipe_google_data.js
 * 
 * Script NUCLEAR. Borra TODOS los eventos del calendario principal
 * y TODAS las listas de tareas de Google Tasks asociadas a la cuenta.
 * 
 * Requiere el scope: https://www.googleapis.com/auth/tasks y auth/calendar
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');
const CREDENTIALS_FILE = path.join(__dirname, '..', '..', 'credentials.json');

const DRY_RUN = process.argv.includes('--dry-run');

function getAuthClient() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('Falta el token de Google. Corre setup_google_calendar.js primero.');
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const key = creds.installed || creds.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob'
  );
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function wipeCalendar(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  console.log('\n--- 🗓️  Borrando eventos de Google Calendar ---');
  let pageToken = null;
  let deletedCount = 0;

  do {
    const res = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 2500,
      pageToken: pageToken,
    });
    
    const events = res.data.items;
    if (events && events.length > 0) {
      for (const event of events) {
        if (DRY_RUN) {
          console.log(`[DRY-RUN] Se borraría el evento: ${event.summary} (${event.id})`);
        } else {
          try {
            await calendar.events.delete({
              calendarId: 'primary',
              eventId: event.id
            });
            console.log(`🗑️  Borrado: ${event.summary || '(Sin Título)'}`);
            deletedCount++;
          } catch (e) {
            console.error(`❌ Error borrando evento ${event.id}:`, e.message);
          }
        }
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`✅ Total de eventos borrados: ${deletedCount}`);
}

async function wipeTasks(auth) {
  const tasksService = google.tasks({ version: 'v1', auth });
  console.log('\n--- ✅ Borrando listas de Google Tasks ---');
  
  try {
    const res = await tasksService.tasklists.list({ maxResults: 100 });
    const taskLists = res.data.items;
    
    if (taskLists && taskLists.length > 0) {
      for (const list of taskLists) {
        // La lista default ("@default") no puede ser borrada completamente, 
        // pero se pueden borrar sus tareas usando tasks.clear()
        if (DRY_RUN) {
          console.log(`[DRY-RUN] Se borraría el contenido de la lista: ${list.title} (${list.id})`);
        } else {
          try {
            // Borrar tareas completadas o ocultas
            await tasksService.tasks.clear({ tasklist: list.id });
            console.log(`🧹 Lista purgada (tareas completadas): ${list.title}`);
            
            // Borrar cada tarea activa una por una
            const tasksRes = await tasksService.tasks.list({ tasklist: list.id, showHidden: true });
            if (tasksRes.data.items) {
              for (const t of tasksRes.data.items) {
                await tasksService.tasks.delete({ tasklist: list.id, task: t.id });
                console.log(`  🗑️  Borrada tarea: ${t.title || '(Sin título)'}`);
              }
            }
            
            // Si no es la default, borrar la lista completa
            if (list.title !== 'Mis tareas' && list.title !== 'My Tasks') {
               await tasksService.tasklists.delete({ tasklist: list.id });
               console.log(`💥 Lista de tareas destruida: ${list.title}`);
            }
          } catch (e) {
             console.error(`❌ Error purgando lista ${list.title}:`, e.message);
          }
        }
      }
    }
  } catch (err) {
    if (err.message.includes('Insufficient Permission')) {
      console.log('⚠️ Error de permisos para Tasks. Asegúrate de haber corrido setup_google_calendar.js y aceptado los nuevos permisos.');
    } else {
      console.error(err);
    }
  }
}

async function main() {
  console.log('☢️  INICIANDO WIPE DE GOOGLE DATA ☢️');
  if (DRY_RUN) console.log('>>>> MODO DRY-RUN ACTIVADO (No se borrará nada) <<<<');
  
  try {
    const auth = getAuthClient();
    await wipeCalendar(auth);
    await wipeTasks(auth);
    console.log('\n🎉 PROCESO NUCLEAR FINALIZADO.');
  } catch (error) {
    console.error('Fatal Error:', error.message);
  }
}

if (require.main === module) {
  main();
}
