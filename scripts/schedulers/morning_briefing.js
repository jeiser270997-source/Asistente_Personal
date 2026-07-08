/**
 * scripts/schedulers/morning_briefing.js
 * 
 * Orquestador proactivo que se ejecuta a las 6:00 AM.
 * Reemplaza al bot conversacional enviando un informe ejecutivo
 * y estructurando directamente el calendario vacío.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { createEvent } = require('../integrations/gworkspace_manager');
const { askLLM } = require('../../lib/ai/llm_service');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const ESTADO_VIVO_PATH = path.join(__dirname, '..', '..', 'data', 'state', 'contexto_maestro', 'ESTADO_VIVO.md');

async function sendTelegramMessage(text) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.log('⚠️ No hay token de Telegram, pero el mensaje sería:\n', text);
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

// ================= CLIMA =================
async function getMedellinWeather() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=6.2518&longitude=-75.5636&daily=weathercode,precipitation_probability_max,uv_index_max&timezone=America%2FBogota');
    const data = await res.json();
    const probLluvia = data.daily.precipitation_probability_max[0];
    const uvMax = data.daily.uv_index_max[0];
    const codigo = data.daily.weathercode[0];
    
    let estado = "Despejado/Nublado";
    if (codigo >= 50 && codigo <= 69) estado = "Lluvia ligera";
    if (codigo >= 80) estado = "Lluvia fuerte / Tormenta";
    
    return { probLluvia, estado, uvMax };
  } catch {
    return { probLluvia: 0, estado: "Desconocido", uvMax: 5 };
  }
}

// ================= SIMIT =================
function getSimitStatus() {
  try {
    const p = path.join(__dirname, '..', '..', 'data', 'simit.json');
    if (fs.existsSync(p)) {
      const simitData = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (simitData.total_deuda_activa > 0) {
        return `⚠️ *ALERTA SIMIT:* Tienes comparendos activos. Deuda total: $${simitData.total_deuda_activa.toLocaleString('es-CO')} COP.`;
      }
      return "✅ *SIMIT:* Estás a paz y salvo.";
    }
  } catch (e) {}
  return "ℹ️ *SIMIT:* No se encontró información actual.";
}

function getTodayTasks() {
  const day = new Date().getDay(); // 0 = Dom, 1 = Lun, 2 = Mar...
  let didiTask = null;

  if (day === 1 || day === 5) {
    // Lunes y Viernes
    didiTask = [
      { title: '🚕 DiDi AM (Fresco)', duration: 5.5, priority: 1, type: 'Ingresos' },
      { title: '🚗 Recoger a Dominick', duration: 0.5, priority: 1, type: 'Familiar' },
      { title: '🚕 DiDi PM (Corto pre-clase)', duration: 2, priority: 1, type: 'Ingresos' },
      { title: '💻 Clase CESDE (Virtual)', duration: 2, priority: 1, type: 'Estudio' }
    ];
  } else if (day === 2 || day === 4) {
    // Martes y Jueves
    didiTask = [
      { title: '🚗 Llevar a Dominick a la escuela', duration: 0.5, priority: 1, type: 'Familiar' },
      { title: '🚕 DiDi AM (Corto post-escuela)', duration: 3, priority: 1, type: 'Ingresos' },
      { title: '🚗 Recoger a Dominick', duration: 0.5, priority: 1, type: 'Familiar' },
      { title: '🚕 DiDi PM (Extendido para meta)', duration: 6.5, priority: 1, type: 'Ingresos' }
    ];
  } else if (day === 6) {
    // Sábado
    didiTask = [
      { title: '🚀 Técnico CESDE (Presencial)', duration: 11, priority: 1, type: 'Estudio' },
      { title: '🚕 DiDi Noche', duration: 5, priority: 1, type: 'Ingresos' }
    ];
  } else if (day === 0) {
    // Domingo
    didiTask = [
      { title: '⚽ Chiquifútbol Dominick', duration: 1, priority: 1, type: 'Familiar' },
      { title: '🚕 DiDi Jornada Larga', duration: 9, priority: 1, type: 'Ingresos' }
    ];
  } else if (day === 3) {
    // Miércoles (Pico y Placa)
    didiTask = [
      { title: '🚗 Recoger a Dominick', duration: 0.5, priority: 1, type: 'Familiar' },
      { title: '🏊 Natación Dominick', duration: 1, priority: 1, type: 'Familiar' },
      { title: '💈 Corte de Cabello (Verificar si toca)', duration: 1, priority: 2, type: 'Cuidado Personal' },
      { title: '💻 Clase CESDE (Virtual)', duration: 2, priority: 1, type: 'Estudio' },
      { title: '🚗 Lavar el Carro (DLavar $4k)', duration: 1, priority: 2, type: 'Mantenimiento' },
      { title: '🛑 Día libre de conducción (Pico y Placa)', duration: 0, priority: 2, type: 'Descanso' }
    ];
  }

  // Agregamos siempre la constante de Job Hunter
  didiTask.push({ title: 'Aplicar a 5 ofertas en Computrabajo', duration: 1, priority: 1, type: 'Empleo' });

  return didiTask;
}

async function runMorningBriefing() {
  console.log('🌅 Iniciando Morning Briefing...');
  const tasks = getTodayTasks();
  const clima = await getMedellinWeather();
  const simit = getSimitStatus();
  
  let report = '☕ *MORNING BRIEFING - LIFEOS*\n';
  report += `📅 Fecha: ${new Date().toISOString().split('T')[0]}\n`;
  report += `🌤️ *Clima Hoy:* ${clima.estado} | Lluvia: ${clima.probLluvia}% | UV Max: ${clima.uvMax}\n\n`;
  report += `${simit}\n\n`;

  // === CHECK PICO Y PLACA ===
  const today = new Date();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const dayName = days[today.getDay()];
  
  let picoPlacaData = {
    Lunes: ["1", "7"], Martes: ["0", "3"], Miercoles: ["4", "6"], Jueves: ["5", "9"], Viernes: ["2", "8"]
  };
  const PICO_FILE = path.join(__dirname, '..', '..', 'data', 'pico_placa.json');
  if (fs.existsSync(PICO_FILE)) {
    picoPlacaData = JSON.parse(fs.readFileSync(PICO_FILE, 'utf8'));
  }
  
  const placa = "6"; // La Toyota Corolla KEW496 de Jeiser
  if (picoPlacaData[dayName] && picoPlacaData[dayName].includes(placa)) {
    report += `🚗 🚫 *¡ATENCIÓN! HOY TIENES PICO Y PLACA* (Termina en ${placa})\n\n`;
  }
  
  // Alerta de cambio de semestre (agosto en adelante)
  if (today.getMonth() >= 7 && picoPlacaData.Miercoles && picoPlacaData.Miercoles.includes("6")) {
    report += `⚠️ *NOTA:* Ya estamos en el segundo semestre y la rotación guardada sigue siendo la vieja. ¡Verifica si el pico y placa ya cambió!\n\n`;
  }
  // === FIN PICO Y PLACA ===

  report += '🚨 *PRIORIDADES DEL DÍA*\n';
  
  const p1 = tasks.filter(t => t.priority === 1);
  const p2 = tasks.filter(t => t.priority === 2);
  
  p1.forEach(t => report += `🔴 [Alta] ${t.title} (${t.duration}h)\n`);
  p2.forEach(t => report += `🟡 [Media] ${t.title} (${t.duration}h)\n`);
  
  report += '\n_Tu calendario ha sido estructurado automáticamente con estos bloques._';

  // --- SARGENTO FINANCIERO (Rewrite con DeepSeek) ---
  console.log('🧠 Solicitando reescritura al Sargento Financiero (DeepSeek)...');
  try {
    const sargentoPrompt = `Eres el 'Sargento Financiero', el alter ego estricto, implacable y motivador de LifeOS para Jeiser.
Jeiser tiene gastos fijos de $1.6M mensuales (Arriendo + Servicios), debe el semestre del CESDE y gana su dinero manejando DiDi con una meta de $260,000 diarios en Medellín bajo un fuerte calor. Su meta de vida es conseguir un trabajo estable en QA Automation.
    
A continuación, tienes el reporte crudo del día (clima, tránsito, tareas). REESCRIBE este reporte usando un tono militar, exigente pero motivador (Sinceridad Radical). No le tengas lástima. Recuérdale brutalmente lo que tiene que pagar si no sale a manejar o si pierde el tiempo. Usa emojis agresivos (🔥, 🚨, 💰, 💀, 🚗). Mantén toda la información técnica (clima, probabilidad de lluvia, tareas, etc.) pero inyecta tu regaño y motivación en la introducción y conclusión. 
NO uses etiquetas markdown de código al devolver tu respuesta.

REPORTE CRUDO:
${report}`;

    const llmRes = await askLLM(sargentoPrompt, [], [], 0.3);
    if (llmRes && llmRes.content) {
      report = llmRes.content.trim().replace(/^```(markdown|md)?\n/, '').replace(/\n```$/, '');
    }
  } catch (e) {
    console.error('❌ Error con el Sargento Financiero (fallback a crudo):', e.message);
  }

  // Enviar a Telegram
  await sendTelegramMessage(report);
  console.log('✅ Briefing enviado a Telegram.');

  // Agendar en Google Calendar
  console.log('🗓️  Agendando en Google Calendar (recién purgado)...');
  
  const today = new Date();
  today.setHours(9, 0, 0, 0); // Empezamos a agendar desde las 9 AM
  
  for (const t of tasks) {
    const startISO = today.toISOString();
    try {
      await createEvent(t.title, startISO, t.duration, `Prioridad: ${t.priority} | Tipo: ${t.type}`);
      console.log(`  ➕ Evento creado: ${t.title} a las ${today.getHours()}:00`);
    } catch (e) {
      console.error(`  ❌ Error agendando ${t.title}:`, e.message);
    }
    // Añadir tiempo del bloque + 30 min descanso
    today.setHours(today.getHours() + t.duration, 30);
  }
  
  console.log('🎉 Morning Briefing Finalizado con éxito.');
}

if (require.main === module) {
  runMorningBriefing().catch(e => console.error(e));
}

module.exports = { runMorningBriefing };
