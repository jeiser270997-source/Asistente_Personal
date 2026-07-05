require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../lib/llm_service');

const STATE_FILE = path.join(__dirname, '..', 'data', 'telegram_state.json');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return { lastUpdateId: 0 };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

async function apiCall(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  const state = loadState();
  console.log(`🔄 Ultimo update_id procesado: ${state.lastUpdateId}`);

  // Get updates since last processed
  const updatesRes = await fetch(
    `${API}/getUpdates?offset=${state.lastUpdateId + 1}&timeout=5&allowed_updates=["message"]`
  );
  const data = await updatesRes.json();

  if (!data.ok) {
    console.log(`❌ Error getUpdates: ${JSON.stringify(data)}`);
    process.exit(1);
  }

  const updates = data.result || [];
  console.log(`📩 ${updates.length} mensajes nuevos`);

  if (updates.length === 0) {
    console.log('✅ Sin mensajes, guardando estado.');
    saveState(state);
    return;
  }

  const SYSTEM_PROMPT = `Eres Jarvis, asistente personal de Jeiser Gutiérrez. Contexto:
- Vive en Colombia (UTC-5), estudia en CESDE programación
- Tiene 3 comparendos en SIMIT pendientes (Itagüí y Medellín, ~$1.8M total)
- Usa GitHub Actions para automatizar su correo, tareas y rutinas diarias
- Clases CESDE: Lun/Mar/Mie/Vie 6-8 PM Colombia
- Responde SIEMPRE en español, sé conciso (2-5 líneas max), útil y directo.`;

  for (const update of updates) {
    const msg = update.message;
    if (!msg || !msg.text) continue;
    if (String(msg.from?.id) !== String(CHAT_ID)) {
      console.log(`⛔ Mensaje de usuario no autorizado: ${msg.from?.id}`);
      continue;
    }

    const text = msg.text;
    if (text.startsWith('/')) {
      console.log(`⏭️ Comando ignorado: ${text}`);
      continue;
    }

    console.log(`💬 [${msg.from.first_name}]: ${text}`);

    try {
      const start = Date.now();
      const response = await askLLM(SYSTEM_PROMPT, [{ role: 'user', content: text }]);
      const reply = response?.content || 'Lo siento, no pude procesar tu mensaje.';
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`🤖 Respuesta (${elapsed}s): ${reply.substring(0, 100)}...`);

      await apiCall('sendMessage', {
        chat_id: CHAT_ID,
        text: reply,
        parse_mode: 'HTML'
      });
    } catch (e) {
      console.error(`❌ Error procesando mensaje: ${e.message}`);
      await apiCall('sendMessage', {
        chat_id: CHAT_ID,
        text: '💥 Error al procesar tu mensaje. Intenta de nuevo.'
      });
    }
  }

  // Save last update_id
  state.lastUpdateId = updates[updates.length - 1].update_id;
  saveState(state);
  console.log(`💾 Estado guardado: lastUpdateId=${state.lastUpdateId}`);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
