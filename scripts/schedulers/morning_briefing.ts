/**
 * scripts/schedulers/morning_briefing.ts
 *
 * Briefing de sesión (on-demand, 1–2 veces al día). No requiere PM2.
 * Prioridad: SENA/CESDE → SIMIT/PyP → DiDi → empleo (semi-auto).
 * Si el LLM falla, genera un briefing determinista (sin IA).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createEvent } from '../integrations/gworkspace_manager';
import { askLLM } from '../../lib/ai/llm_service';
import { checkMaintenance } from './vehicle_manager';

// Integración de módulos de datos reales de LifeOS (Zajuna & Tráfico)
const { getTrafficReport } = require('../../lib/integrations/tomtom_client');
const SeguimientoStore = require('../../runtime/stores/SeguimientoStore');

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

// ================= CLIMA (Open-Meteo AHORA + horas, no solo máximo del día) =================
async function getMedellinWeather() {
  try {
    const { getMedellinWeatherDetailed } = require('../../lib/integrations/weather_client');
    const w = await getMedellinWeatherDetailed();
    if (!w.ok) {
      return { probLluvia: null, uvMax: null, codigo: null, detail: w, ok: false };
    }
    return {
      probLluvia: w.morningNext6h.rainProbMax,
      uvMax: w.daily.uvMax,
      codigo: w.now.code,
      detail: w,
      ok: true,
    };
  } catch {
    return { probLluvia: null, uvMax: null, codigo: null, ok: false };
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

// ================= ZAJUNA (SENA) PENDIENTS =================
function getZajunaPending(): string {
  try {
    const senaData = SeguimientoStore.get();
    if (senaData && senaData.actividades) {
      const lines: string[] = [];
      const hoy = new Date();
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      const mananaStr = manana.toISOString().split('T')[0];

      for (const [key, act] of Object.entries(senaData.actividades)) {
        const actividad: any = act;
        const incomplete = (actividad.evidencias || []).filter((e: any) => !e.completado);
        if (incomplete.length > 0) {
          const limitStr = actividad.fecha_limite ? ` (Vence: ${actividad.fecha_limite})` : '';
          
          // Detectar vencimientos críticos (hoy o mañana)
          const esCritico = actividad.fecha_limite && (
            actividad.fecha_limite === hoy.toISOString().split('T')[0] ||
            actividad.fecha_limite === mananaStr
          );
          const prefix = esCritico ? '🚨🔴 *CRÍTICO*' : '📌';
          
          lines.push(`${prefix} *${actividad.nombre}*${limitStr}`);
          incomplete.forEach((e: any) => {
            const idInfo = e.id ? ` (ID: ${e.id})` : '';
            lines.push(`  - [ ] _${e.nombre}_${idInfo}`);
          });
        }
      }
      return lines.length > 0 ? lines.join('\n') : '✅ Sin entregas pendientes en Zajuna.';
    }
  } catch (e: any) {
    console.warn(`[Briefing] Error leyendo ZajunaStore: ${e.message}`);
  }
  return 'ℹ️ No se pudieron cargar los datos de Zajuna.';
}

// ================= FECHA HELPER =================
function getIsoTime(hoursStr: string) {
  const d = new Date();
  const [h, m] = hoursStr.split(':');
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d.toISOString();
}

function getJobsQueueSummary(): string {
  try {
    const queuePath = path.join(__dirname, '..', '..', 'data', 'jobs', 'apply_queue.json');
    if (!fs.existsSync(queuePath)) return 'ℹ️ Sin cola de empleo (corre `npm run session` en día laboral).';
    const raw = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    const list = Array.isArray(raw) ? raw : (raw.ofertas || raw.queue || []);
    if (!list.length) return '✅ Cola de postulación vacía.';
    const top = list.slice(0, 3).map((o: any, i: number) =>
      `  ${i + 1}. ${o.titulo || o.title || '?'} — ${o.empresa || ''}`
    ).join('\n');
    return `📋 *${list.length} oferta(s) en cola (semi-auto, no se postulan solas)*\n${top}`;
  } catch {
    return 'ℹ️ No se pudo leer cola de empleo.';
  }
}

/** Agenda del día sin LLM — siempre funciona offline/parcial. */
function buildDeterministicBriefing(ctx: {
  todayIso: string;
  dayName: string;
  dayIndex: number;
  clima: { probLluvia: number; uvMax: number; codigo: number };
  festivoInfo: { es_festivo: boolean; nombre: string };
  pypInfo: { restringidas_hoy: string; tiene_restriccion: boolean };
  simit: string;
  senaPending: string;
  maintenanceAlerts: string;
  trafficReport: string;
  jobsSummary: string;
  baseTasks: any[];
}): { mensaje_telegram: string; eventos: any[] } {
  const { todayIso, dayName, dayIndex, clima, festivoInfo, pypInfo, simit, senaPending, maintenanceAlerts, trafficReport, jobsSummary, baseTasks } = ctx;
  const isSat = dayIndex === 6;
  const isSun = dayIndex === 0;
  const uvWarn = clima.uvMax >= 7 ? ' ⚠️ Ola de calor: NO DiDi 10:30–15:30' : '';
  const pyp = pypInfo.tiene_restriccion
    ? `🚫 *APLICA* (restringidos: ${pypInfo.restringidas_hoy}) — plan B estudio/empleo`
    : `✅ No aplica (restringidos: ${pypInfo.restringidas_hoy || 'n/a'})`;

  let agenda = '';
  if (isSat) {
    agenda = [
      '• 07:30–18:00 *CESDE presencial* (BD / Prog / Lógica) — prioridad absoluta',
      '• Noche: solo si sobra energía → 1 evidencia SENA corta',
      '• DiDi sábado: solo si NO hay clases o ya saliste',
    ].join('\n');
  } else if (isSun) {
    agenda = [
      '• Mañana: familiar / descanso / fútbol Dominick si aplica',
      '• Tarde: DiDi meta parcial o estudio SENA',
      '• Noche: preparar semana (SENA + 5 ofertas semi-auto)',
    ].join('\n');
  } else {
    agenda = [
      '• 05:00–10:30 DiDi AM (meta parcial ~$150k brutos)',
      '• 10:30–15:30 *NO conducir* (calor) → estudio / correos / SENA / CV',
      '• 15:30–20:00 DiDi PM',
      '• 20:00–21:30 SENA o CESDE virtual si toca',
      '• Empleo: revisar cola; postular solo con `job_loop --auto` a mano',
    ].join('\n');
  }

  if (festivoInfo.es_festivo) {
    agenda = `🎉 Festivo: ${festivoInfo.nombre}\n` + agenda + '\n• Sin colegio Dominick si aplica festivo';
  }

  const tasksLine = baseTasks.length
    ? baseTasks.map((t: any) => `• ${t.title} (${t.type || 'tarea'})`).join('\n')
    : '• (sin bloques en schedule.json)';

  const msg = [
    '☕ *LIFEOS BRIEFING DE SESIÓN*',
    `📅 *${dayName}* ${todayIso}`,
    '',
    '🎯 *PRIORIDAD HOY (en orden)*',
    isSat ? '1. CESDE  2. SENA si queda tiempo  3. Descanso' : '1. SENA críticos  2. Correos/organización  3. DiDi  4. Empleo semi-auto',
    '',
    '🌤️ *CLIMA*',
    `• Lluvia: ${clima.probLluvia}% · UV: ${clima.uvMax}${uvWarn}`,
    `• Pico y placa KEW496: ${pyp}`,
    '',
    '🚗 *SIMIT & CARRO*',
    `• ${simit}`,
    `• Mantenimiento: ${maintenanceAlerts || 'OK / sin alertas'}`,
    '• Moto BXU28C: SOAT/RTM vencidos — *NO circular*',
    '',
    '🚨 *SENA (Zajuna)*',
    senaPending,
    '',
    '💼 *EMPLEO*',
    jobsSummary,
    '',
    '🚧 *TRÁFICO*',
    String(trafficReport || 'Sin TomTom (opcional)').slice(0, 400),
    '',
    '📅 *AGENDA SUGERIDA*',
    agenda,
    '',
    '📋 *Schedule base*',
    tasksLine,
    '',
    '_Modo on-demand: sin PM2. Corre `npm run session` cuando te sientes._',
  ].join('\n');

  const eventos: any[] = [];
  if (isSat) {
    eventos.push({ title: '🎓 CESDE presencial', start_time: '07:30', duration_hours: 10.5, description: 'Aula 406 — BD / Prog / Lógica' });
  } else if (!isSun && !pypInfo.tiene_restriccion) {
    eventos.push({ title: '🚕 DiDi AM', start_time: '05:00', duration_hours: 5.5, description: 'Meta AM ~150k' });
    eventos.push({ title: '📚 Estudio / SENA / organización', start_time: '10:30', duration_hours: 5, description: 'Sin DiDi por calor' });
    eventos.push({ title: '🚕 DiDi PM', start_time: '15:30', duration_hours: 4.5, description: 'Meta PM' });
  }

  return { mensaje_telegram: msg, eventos };
}

// ================= MAIN RUNNER =================
export async function runMorningBriefing(): Promise<void> {
  const now = new Date();
  const colDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const todayIso = colDate.toISOString().split('T')[0];
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const dayIndex = colDate.getDay();
  const dayName = days[dayIndex];

  console.log(`[Briefing] Sesión: ${dayName} (${todayIso})`);

  const [clima, festivoInfo, maintenanceAlerts, trafficReport] = await Promise.all([
    getMedellinWeather(),
    checkFestivo(todayIso),
    Promise.resolve(checkMaintenance()),
    getTrafficReport().catch(() => 'TomTom no disponible'),
  ]);

  const pypInfo = getPicoYPlacaInfo(dayName, config.placa_vehiculo || '6');
  const simit = getSimitStatus();
  const senaPending = getZajunaPending();
  const jobsSummary = getJobsQueueSummary();

  let baseTasks: any[] = [];
  try {
    if (fs.existsSync(SCHEDULE_PATH)) {
      const scheduleConfig = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
      baseTasks = scheduleConfig[dayIndex.toString()] || [];
    }
  } catch {}

  // Clima honesto: inyectar bloque Open-Meteo AHORA/tarde en el fallback
  let weatherBlock = '';
  try {
    const { formatWeatherMarkdown } = require('../../lib/integrations/weather_client');
    if ((clima as any).detail) weatherBlock = formatWeatherMarkdown((clima as any).detail);
  } catch { /* ignore */ }

  const fallback = buildDeterministicBriefing({
    todayIso, dayName, dayIndex, clima, festivoInfo, pypInfo, simit,
    senaPending, maintenanceAlerts: String(maintenanceAlerts || ''),
    trafficReport: String(trafficReport || ''), jobsSummary, baseTasks,
  });
  if (weatherBlock) {
    fallback.mensaje_telegram = fallback.mensaje_telegram.replace(
      /🌤️ \*CLIMA\*[\s\S]*?(?=\n🚗|\n🚨|\n💼|\n🚧|\n📅|\n🎯)/,
      weatherBlock + '\n\n'
    );
  }

  const prompt = `Eres el asistente logístico de Jeiser (LifeOS, Medellín). Tono: directo, sin adulación, datos duros.
Contexto: conductor DiDi (meta $260k brutos/día), CESDE sábados 7:30–18:00 presencial, SENA Zajuna en curso, busca QA/soporte, NO PC 24/7 (sesión on-demand 1–2 veces al día).
REGLA HIERRO DIAN: no firmar 814, no pagar AG2023 por cobranzas. Moto BXU28C: no circular.

DATOS DE HOY:
- ${todayIso} ${dayName} | Festivo: ${festivoInfo.es_festivo ? festivoInfo.nombre : 'no'}
- Clima lluvia ${clima.probLluvia}% UV ${clima.uvMax} | PyP carro termina en 6: ${pypInfo.tiene_restriccion ? 'SÍ' : 'NO'} (${pypInfo.restringidas_hoy})
- ${simit}
- Mantenimiento: ${maintenanceAlerts || 'n/a'}
- Tráfico: ${String(trafficReport).slice(0, 500)}
- SENA: ${senaPending}
- Empleo: ${jobsSummary}
- Agenda base: ${JSON.stringify(baseTasks)}

Devuelve SOLO JSON:
{
  "mensaje_telegram": "Markdown Telegram, secciones: PRIORIDAD | CLIMA/PyP | SIMIT | SENA | EMPLEO | AGENDA. Máx ~35 líneas. Si sábado: CESDE primero. Si UV>=7: bloquear DiDi 10:30-15:30. Sin regaños largos.",
  "eventos": [ { "title": "...", "start_time": "HH:MM", "duration_hours": 1, "description": "..." } ]
}
Máximo 5 eventos. Si no hay LLM útil, el sistema usará un fallback.`;

  let parsed = fallback;
  try {
    const res = await askLLM(prompt, [], 0.2);
    if (res?.content) {
      const raw = (res.content || '').replace(/```json|```/g, '').trim();
      const j = JSON.parse(raw);
      if (j.mensaje_telegram && typeof j.mensaje_telegram === 'string') {
        parsed = {
          mensaje_telegram: j.mensaje_telegram,
          eventos: Array.isArray(j.eventos) ? j.eventos : fallback.eventos,
        };
        console.log('[Briefing] LLM OK');
      }
    }
  } catch (err: any) {
    console.warn(`[Briefing] LLM falló → fallback determinista: ${err.message?.slice(0, 100)}`);
  }

  // Siempre a consola (sesión local)
  console.log('\n' + parsed.mensaje_telegram.replace(/\*/g, '') + '\n');
  await sendTelegramMessage(parsed.mensaje_telegram);
  console.log('✅ Briefing listo (consola' + (TELEGRAM_TOKEN ? ' + Telegram' : '') + ').');

  // Default: NO Calendar (sesión on-demand). Solo si DISABLE_CALENDAR_SYNC=false
  const calendarOn = process.env.DISABLE_CALENDAR_SYNC === 'false';
  if (!calendarOn) {
    console.log('ℹ️  Calendar sync off (default on-demand). Activa con DISABLE_CALENDAR_SYNC=false');
  } else if (parsed.eventos?.length) {
    console.log(`🗓️  Sincronizando ${parsed.eventos.length} eventos...`);
    for (const ev of parsed.eventos) {
      try {
        const isoStart = getIsoTime(ev.start_time);
        const result: any = await createEvent(ev.title, isoStart, ev.duration_hours, ev.description);
        console.log(result?.skipped ? `  skip ${ev.title}` : `  + ${ev.title} @ ${ev.start_time}`);
      } catch (e: any) {
        console.error(`  x ${ev.title}: ${e.message}`);
      }
    }
  }
}

if (require.main === module) {
  runMorningBriefing().catch(e => console.error(e));
}
