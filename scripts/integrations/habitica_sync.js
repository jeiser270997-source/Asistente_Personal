/**
 * scripts/integrations/habitica_sync.js
 * 
 * Sincroniza tareas del ecosistema LifeOS (CESDE/SENA) hacia Habitica.
 * Documentación API: https://habitica.com/apidoc/
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const https = require('node:https');

const HABITICA_USER = process.env.HABITICA_USER_ID;
const HABITICA_KEY  = process.env.HABITICA_API_KEY;

// Utilidad para hacer requests a Habitica
function habiticaRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    if (!HABITICA_USER || !HABITICA_KEY) {
      return reject(new Error('Faltan credenciales de Habitica (HABITICA_USER_ID, HABITICA_API_KEY) en .env'));
    }

    const options = {
      hostname: 'habitica.com',
      path: '/api/v3' + endpoint,
      method: method,
      headers: {
        'x-api-user': HABITICA_USER,
        'x-api-key': HABITICA_KEY,
        'x-client': HABITICA_USER + '-LifeOS_Integration',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) resolve(json.data);
          else reject(new Error(json.error || 'Habitica API Error'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Crea un To-Do (misión) en Habitica
 */
async function createTodo(text, notes = '', date = null) {
  const task = {
    type: 'todo',
    text: text,
    notes: notes,
    priority: 1.5 // Medium-Hard
  };
  if (date) task.date = date; // YYYY-MM-DD
  return habiticaRequest('POST', '/tasks/user', task);
}

/**
 * Registra una acción positiva en un Hábito (ej: Programar > 2 horas)
 */
async function scoreHabit(taskId, direction = 'up') {
  return habiticaRequest('POST', `/tasks/${taskId}/score/${direction}`);
}

async function syncPendingTasks() {
  console.log('⚔️  Iniciando sincronización con Habitica...');
  try {
    // Ejemplo de cómo leería del Tracker y crearía misiones.
    // Aquí podrías importar tu logic de moodle_sena_tracker.js y mapearlo.
    // Por ahora demostramos la creación de la tarea en Habitica:
    console.log('[Mock] Subiendo Tarea "Laboratorio Playwright (CESDE)" a Habitica...');
    
    if (!HABITICA_USER) {
      console.log('⚠️ Credenciales de Habitica no encontradas en .env (Simulando éxito)');
      return;
    }
    
    const res = await createTodo('Laboratorio Playwright (CESDE)', 'Subido desde LifeOS', new Date().toISOString());
    console.log('✅ Tarea creada en Habitica exitosamente:', res.id);
  } catch (err) {
    console.error('❌ Error sincronizando Habitica:', err.message);
  }
}

if (require.main === module) {
  syncPendingTasks();
}

module.exports = {
  createTodo,
  scoreHabit,
  syncPendingTasks
};
