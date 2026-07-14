/**
 * scripts/schedulers/morning_briefing.ts
 * 
 * Orquestador Unificado de LifeOS - Sargento Logístico Matutino.
 * Combina clima, UV, Pico y Placa, SIMIT, Mantenimiento y Tareas.
 * Genera el plan diario con una sola llamada al LLM y sincroniza Calendar.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createEvent } from '../integrations/gworkspace_manager';
import { askLLM } from '../../lib/ai/llm_service';
import { checkMaintenance } from './vehicle_manager';
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'config', 'didi_config.json');
const SCHEDULE_PATH = path.join(__dirname, '..', '..', 'config', 'schedule.json');
const SIMIT_PATH = path.join(__dirname, '..', '..', 'data', 'cache', 'simit_multas.json');
const PICO_FILE = path.join(__dirname, '..', '..', 'data', 'pico_placa.json');

let config: any = {};
if (fs.existsSync(CONFIG_PATH)) {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function sendTelegramMessage(text: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.log('⚠️ Telegram no configurado. Mensaje alternativo:\n', text);
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' })
  });
}

// ================= CLIMA Y UV =================
async function getMedellinWeather() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=6.2518&longitude=-75.5636&daily=weathercode,precipitation_probability_max,uv_index_max&timezone=America%2FBogota');
    const data: any = await res.json();
    return {
      probLluvia: data.daily.precipitation_probability_max[0],
      uvMax: data.daily.uv_index_max[0],
      codigo: data.daily.weathercode[0]
    };
  } catch {
    return { probLluvia: 0, uvMax: 5, codigo: 0 };
  }
}

// ================= FESTIVOS (COLOMBIA) =================
async function checkFestivo(dateIso: string) {
  try {
    const year = dateIso.split('-')[0];
    const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/CO`);
    if (!res.ok) return { es_festivo: false, nombre: '' };
    const festivos: any = await res.json();
    const festivoHoy = festivos.find((f: any) => f.date === dateIso);
    if (festivoHoy) return { es_festivo: true, nombre: festivoHoy.localName };
  } catch {}
  return { es_festivo: false, nombre: '' };
}

// ================= SIMIT STATUS =================
function getSimitStatus(): string {
  try {
    if (fs.existsSync(SIMIT_PATH)) {
      const simitData = JSON.parse(fs.readFileSync(SIMIT_PATH, 'utf8'));
      if (simitData.total_deuda_activa > 0) {
        return `⚠️ *SIMIT:* Comparendos activos. Deuda total: $${(simitData.total_deuda_activa).toLocaleString('es-CO')} COP.`;
      }
      return '✅ *SIMIT:* Paz y salvo en multas.';
    }
  } catch (e) {}
  return 'ℹ️ *SIMIT:* No se encontró información actual.';
}

// ================= PICO Y PLACA =================
function getPicoYPlacaInfo(diaNombre: string, placaStr: string) {
  let picoPlacaData: Record<string, string[]> = {
    Lunes: ['1', '7'], Martes: ['0', '3'], Miercoles: ['4', '6'], Jueves: ['5', '9'], Viernes: ['2', '8']
  };
  if (fs.existsSync(PICO_FILE)) {
    picoPlacaData = JSON.parse(fs.readFileSync(PICO_FILE, 'utf8'));
  }
  const restringidas = picoPlacaData[diaNombre] || [];
  return {
    restringidas_hoy: restringidas.join(' y '),
    tiene_restriccion: restringidas.includes(placaStr)
  };
}

// ================= FECHA HELPER =================
function getIsoTime(hoursStr: string) {
  const d = new Date();
  const [h, m] = hoursStr.split(':');
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d.toISOString();
}

// ================= MAIN RUNNER =================
export async function runMorningBriefing(): Promise<void> {
  const now = new Date();
  const colDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const todayIso = colDate.toISOString().split('T')[0];
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const dayName = days[colDate.getDay()];

  console.log(`[Briefing] Procesando día: ${dayName} (${todayIso})`);

  const [clima, festivoInfo, maintenanceAlerts] = await Promise.all([
    getMedellinWeather(),
    checkFestivo(todayIso),
    Promise.resolve(checkMaintenance())
  ]);

  const pypInfo = getPicoYPlacaInfo(dayName, config.placa_vehiculo || '6');
  const simit = getSimitStatus();

  let baseTasks = [];
  try {
    if (fs.existsSync(SCHEDULE_PATH)) {
      const scheduleConfig = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
      baseTasks = scheduleConfig[colDate.getDay().toString()] || [];
    }
  } catch {}

  const prompt = `Eres el 'Sargento Financiero', el alter ego logístico, estricto y motivador de LifeOS para Jeiser (Medellín).
Jeiser tiene gastos fijos de $1.6M mensuales (Arriendo + Servicios), debe el semestre del CESDE y gana su dinero manejando DiDi con una meta de $260,000 brutos diarios. Su meta es ser QA Automation Engineer.

DATOS REALES DE HOY:
- Fecha: ${todayIso} (${dayName})
- Vehículo Principal de Jeiser: Toyota Corolla 2010 (Placa: KEW496, termina en 6)
- Vehículo Secundario (Moto): Placa BXU28C (¡SOAT y RTM vencidos! No circular bajo ninguna circunstancia)
- Festivo: ${festivoInfo.es_festivo ? 'SÍ (' + festivoInfo.nombre + ')' : 'NO'}.
- Clima: ${clima.codigo >= 50 ? 'Lluvia / Tormenta' : 'Despejado/Nublado'} (Lluvia: ${clima.probLluvia}%, UV Máximo: ${clima.uvMax}).
- Pico y Placa: Placas restringidas hoy: ${pypInfo.restringidas_hoy}. ¿Jeiser tiene restricción hoy con su carro placa KEW496?: ${pypInfo.tiene_restriccion ? 'SÍ' : 'NO'}.
- SIMIT: ${simit}
- Mantenimiento Carro (Toyota Corolla): ${maintenanceAlerts || 'Ninguno'}
- Misiones Base (Agenda):
${JSON.stringify(baseTasks, null, 2)}

INSTRUCCIONES DE PLANIFICACIÓN:
Debes estructurar el 'mensaje_telegram' de forma extremadamente organizada y ejecutiva para que Jeiser tenga DATOS DUROS en un solo vistazo.

ESTRUCTURA DEL MENSAJE TELEGRAM (Estricta, conserva los títulos y emojis):
☕ *LIFEOS BRIEFING MATUTINO*
📅 *Fecha:* [Día de la semana, DD de Mes de AAAA]

🌤️ *CLIMA Y CONDICIONES*
• Estado: [Estado del clima]
• Probabilidad de Lluvia: ${clima.probLluvia}%
• Índice UV Máximo: ${clima.uvMax} (Protección solar recomendada)
• Pico y Placa: [Aplica/No aplica hoy para ti, indica explícitamente que tu placa es KEW496 y si descansas o no]

🚗 *SIMIT & MANTENIMIENTO*
• SIMIT: [Resumen de deudas/comparendos o Paz y Salvo]
• Carro: [Alertas de mantenimiento o 'Al día']

📋 *PENDIENTES Y PRIORIDADES DE HOY*
[Muestra la lista de misiones base con sus duraciones y prioridades en forma de viñetas claras]

🎖️ *REGAÑO DEL SARGENTO FINANCIERO*
[Aquí pones el regaño motivacional agresivo, estricto y militar, recordándole las metas, el CESDE y DiDi. Máximo 1 párrafo de 4 líneas.]

_Tus eventos de hoy ya fueron sincronizados en Google Calendar._

Estructura su calendario de hoy en bloques de tiempo (máximo 5 bloques).
   - Si es festivo: el colegio de Dominick está cerrado. No agendes ir por él.
   - Si el UV es >= 7 (Horno): Oblígalo a tomar un descanso largo de 12:00 PM a 3:00 PM y enruta DiDi en la tarde-noche.
   - Si el UV es < 7 (Templado): Que maneje de corrido con descanso corto.
   - Si hay clases de CESDE (clase virtual Lun/Mie/Vie 6-8pm), bloquea ese horario.
   - Añade siempre: \"Aplicar a 5 ofertas en Computrabajo\" (1 hora).

Responde EXCLUSIVAMENTE con este objeto JSON plano, sin markdown de bloques (no incluyas triple tilde invertida):
{
  \"mensaje_telegram\": \"[Usa la estructura estricta arriba]\",
  \"eventos\": [
    { \"title\": \"🚕 DiDi AM (Fresco)\", \"start_time\": \"06:00\", \"duration_hours\": 5.5, \"description\": \"Meta AM: $150k\" },
    { \"title\": \"💻 Aplicar ofertas Computrabajo\", \"start_time\": \"12:00\", \"duration_hours\": 1.0, \"description\": \"QA Hunter\" }
  ]
}
`;

  try {
    const res = await askLLM(prompt, [], 0.3);
    if (!res) throw new Error('askLLM no retornó respuesta');
    const parsed = JSON.parse(res.content || '{}');

    await sendTelegramMessage(parsed.mensaje_telegram);
    console.log('✅ Briefing enviado a Telegram.');

    if (parsed.eventos && parsed.eventos.length > 0) {
      console.log(`🗓️  Sincronizando ${parsed.eventos.length} eventos con Google Calendar...`);
      for (const ev of parsed.eventos) {
        try {
          const isoStart = getIsoTime(ev.start_time);
          const result: any = await createEvent(ev.title, isoStart, ev.duration_hours, ev.description);
          if (result && result.skipped) {
            console.log(`  Skip: ${ev.title} (ya existe un evento similar)`);
          } else {
            console.log(`  + Sincronizado: ${ev.title} a las ${ev.start_time}`);
          }
        } catch (e: any) {
          console.error(`  x Error agendando ${ev.title}: `, e.message);
        }
      }
    }

  } catch (err: any) {
    console.error('❌ Error fatal en el briefing unificado:', err.message);
    await sendTelegramMessage(`💥 *Error de Morning Briefing:* ${err.message}`);
  }
}

if (require.main === module) {
  runMorningBriefing().catch(e => console.error(e));
}