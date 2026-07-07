require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');
const { getContextForMessage } = require('../../lib/context/context_resolver');

const STATE_FILE = path.join(__dirname, '..', 'data', 'telegram_state.json');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Detectar si un mensaje es de ofertas laborales ─────────
function isJobListing(text) {
  const jobIndicators = [
    /puesto/i, /empresa/i, /salario/i, /stack/i, /requisitos/i, /aplicar/i,
    /ofertas?\s*(laborales|empleo|trabajo)/i, /junior\s*jobs/i,
    /\d{1,2}\.\s*(qa|desarrollador|developer|frontend|backend|fullstack)/i
  ];
  return jobIndicators.some(r => r.test(text)) && text.length > 200;
}

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

    console.log(`💬 [${msg.from.first_name}]: ${text.substring(0, 100)}`);

    try {
      const start = Date.now();

      // Detect job listings from WhatsApp forwarding
      if (isJobListing(text)) {
        console.log('📋 Detectadas ofertas laborales. Parseando...');
        const { parseJobMessage, matchJobs, generateReport } = require('./whatsapp_jobs_parser');
        // We need to expose the private functions - use spawn instead
        const { spawnSync } = require('child_process');
        const parser = spawnSync('node', ['scripts/whatsapp_jobs_parser.js', text.replace(/\n/g, '\\n')], {
          encoding: 'utf8', timeout: 30000
        });
        
        // Fallback: ask LLM to extract jobs from the message
        const context = getContextForMessage(text);
        const response = await askLLM(
          `${context}\n\nEres un asistente que analiza ofertas laborales. Extrae cada oferta y recomienda cuales aplicar segun el perfil.\nResponde con emojis 🟢/🔴 y da razones breves.`,
          [{ role: 'user', content: text }]
        );
        
        const reply = response?.content || 'No pude analizar las ofertas.';
        await apiCall('sendMessage', { chat_id: CHAT_ID, text: reply, parse_mode: 'HTML' });
        console.log(`📋 Ofertas analizadas (${((Date.now() - start) / 1000).toFixed(1)}s)`);
        continue;
      }

      // Normal conversation - load full context
      const context = getContextForMessage(text);
      const response = await askLLM(context, [{ role: 'user', content: text }]);
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
