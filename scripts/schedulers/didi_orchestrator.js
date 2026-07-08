/**
 * scripts/schedulers/didi_orchestrator.js
 * 
 * Orquestador Logístico Avanzado para DiDi (Smart Shifts).
 * - Integra Clima (Open-Meteo) y Pico y Placa.
 * - Integra Protección Solar (Índice UV).
 * - Integra Inteligencia de Calle (Reddit /r/medellin).
 * - Integra Finanzas (Cálculo de horas vs meta).
 */

require('../../lib/runtime/bootstrap');
const fs = require('node:fs');
const path = require('node:path');
const { checkMaintenance } = require('./vehicle_manager');
const { syncDiDiSchedule } = require('../integrations/didi_calendar_sync');

const configPath = path.join(__dirname, '..', '..', 'data', 'config', 'didi_config.json');
let config = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return console.log("[Telegram] Faltan credenciales.");
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error(`[Telegram Error] ${e.message}`);
  }
}

// ================= CLIMA Y UV =================
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

const { chromium } = require('playwright');

// ================= REDDIT SCRAPER (PLAYWRIGHT) =================
async function getRedditInsights() {
  let browser = null;
  try {
    // Modo "Infiltración": Lanzamos un navegador invisible (headless) simulando ser un humano
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    // Entramos a Reddit /r/medellin ordenado por nuevos
    await page.goto('https://www.reddit.com/r/medellin/new/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Esperamos a que Reddit deje de redirigir y estabilice el DOM
    await page.waitForTimeout(4000);
    
    // Extraemos todo el texto visible del body
    const pageText = await page.evaluate(() => document.body.innerText);
    const posts = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    
    // Filtramos los que hablan de tránsito, didi o uber (ignorando mayúsculas)
    const keywords = ['didi', 'uber', 'transito', 'tránsito', 'reten', 'retén', 'taco', 'bloqueo'];
    const relevantes = posts.filter(title => {
      const t = title.toLowerCase();
      return keywords.some(k => t.includes(k));
    });

    if (relevantes.length > 0) {
      return relevantes.slice(0, 3).join(" | ");
    } else {
      return "Todo tranquilo en redes (Reddit limpio hoy).";
    }
  } catch (err) {
    console.log(`[Reddit Scraper Error]: ${err.message}`);
    return "No se pudo extraer Reddit con Playwright.";
  } finally {
    if (browser) await browser.close();
  }
}

// ================= PICO Y PLACA =================
function getPicoYPlacaInfo(diaSemana, placaStr) {
  const pyp = config.pico_y_placa_medellin || {};
  let placasRestringidas = [];
  
  switch(diaSemana) {
    case 1: placasRestringidas = pyp.lunes || []; break;
    case 2: placasRestringidas = pyp.martes || []; break;
    case 3: placasRestringidas = pyp.miercoles || []; break;
    case 4: placasRestringidas = pyp.jueves || []; break;
    case 5: placasRestringidas = pyp.viernes || []; break;
  }

  return {
    restringidas_hoy: placasRestringidas.join(" y "),
    tiene_restriccion: placasRestringidas.includes(placaStr)
  };
}

// ================= FECHA HELPER =================
function getIsoTime(hoursStr) {
  // hoursStr: "05:00"
  const d = new Date();
  const [h, m] = hoursStr.split(':');
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d.toISOString();
}

// ================= IA GENERATOR =================
async function generateStrategy(clima, pypInfo, redditInfo, diaSemana) {
  const meta_bruta = config.finanzas.meta_diaria_bruta;
  const gasto_gas = config.finanzas.gasto_gasolina_estimado;
  const meta_neta = meta_bruta - gasto_gas;
  const rend_hr = config.finanzas.rendimiento_promedio_hora;
  const horas_necesarias = (meta_bruta / rend_hr).toFixed(1);
  
  const todayIso = new Date().toISOString().split('T')[0];
  let extraRules = "";
  
  // Natacion (Miercoles)
  if (diaSemana === 3 && todayIso <= config.extracurriculares_dominick.natacion.fin_iso) {
    extraRules = `
[REGLA ESPECIAL MIÉRCOLES - NATACIÓN DOMINICK]:
- A las 12:00 PM (Mediodía) DEBES agendar un evento "Prepararse para Natación de Dominick". Jeiser debe pedir Uber/Metro hacia La Estrella (Parque Comfama).
- A las 2:00 PM agendar el evento de clase de Natación.
- Esto anula la jornada de la tarde de DiDi.
`;
  }
  
  // Futbol (Domingo)
  if (diaSemana === 0 && todayIso <= config.extracurriculares_dominick.futbol.fin_iso) {
    extraRules = `
[REGLA ESPECIAL DOMINGO - FÚTBOL DOMINICK]:
- Agendar evento a las 9:30 AM: "⚽ Partido de Dominick (Comfama La Estrella)".
- Angelina lo lleva, pero ponlo en el calendario para que Jeiser sepa dónde están.
`;
  }

  const prompt = `Eres el Despachador Logístico de Jeiser (Conductor DiDi en Medellín). 
DATOS OPERATIVOS DE HOY:
- Clima: ${clima.estado} (${clima.probLluvia}% prob. lluvia). UV Máximo: ${clima.uvMax}.
- Pico y Placa: Placas ${pypInfo.restringidas_hoy}. ¿Restricción hoy?: ${pypInfo.tiene_restriccion ? 'SÍ' : 'NO'}.
- Meta: $${meta_bruta} brutos (Aprox $${meta_neta} netos). Horas necesarias: ~${horas_necesarias}.
- Reddit: "${redditInfo}"
${extraRules}
ITINERARIO ESTRATÉGICO DINÁMICO:
1. Inicio:
   - Despertar: 05:00 AM.
   - Inicio de jornada: 06:00 AM.
2. Mitad de Jornada (Colegio):
   - 11:15 AM: Iniciar enrutamiento ("Viaje con destino") hacia el colegio ${config.zonas.colegio_dominick}.
   - 11:45 AM: Recoger a Dominick.
3. Bifurcación Climática (El Escudo Solar):
   - SI EL UV ES >= 7 (Día de Horno): Oblígalo a descansar de 12:00 PM a 3:00 PM. No puede manejar a esa hora. La jornada de la tarde inicia a las 3:00 PM.
   - SI EL UV ES < 7 (Día de Sombra): Anula el descanso largo. Dale solo 1 hora para almorzar con Dominick (hasta la 1:00 PM) y mándalo a manejar desde la 1:00 PM de corrido para aprovechar el clima fresco y facturar más.
   - IMPORTANTE: Si hay REGLA ESPECIAL MIÉRCOLES o DOMINGO, esa regla tiene prioridad sobre la tarde.
4. Cierre Nocturno (Si aplica):
   - 10:00 PM (22:00): Activar "Viaje con destino" hacia ${config.zonas.base_operaciones}.
   - 11:00 PM (23:00): Cierre absoluto.

INSTRUCCIÓN CRÍTICA:
Debes responder ÚNICA y EXCLUSIVAMENTE con un JSON válido, sin texto adicional.
El JSON debe tener esta estructura:
{
  "mensaje_telegram": "El briefing estratégico en formato HTML...",
  "eventos_calendario": [
    {
      "summary": "Despertar y Preparación",
      "description": "Levantarse...",
      "start_iso": "${getIsoTime("05:00")}",
      "end_iso": "${getIsoTime("06:00")}"
    }
  ]
}
Nota: Genera todos los eventos relevantes (Despertar, Jornadas, Clases Dominick, Enrutamientos, Descansos, y Retorno a Villa Eloisa). Asegúrate de aplicar bien la regla del UV y las Reglas Especiales. Usa formato ISO 8601.`;

  try {
    const response = await fetch('https://api.deepseek.com/beta/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) throw new Error("API LLM falló");
    const jsonStr = await response.json();
    return JSON.parse(jsonStr.choices[0].message.content);
  } catch (err) {
    console.error(err);
    return {
      mensaje_telegram: `⚠️ Error generando estrategia: ${err.message}`,
      eventos_calendario: []
    };
  }
}

async function main() {
  console.log("Iniciando DiDi Orchestrator Avanzado...");
  const diaSemana = new Date().getDay();
  
  const [clima, redditInfo] = await Promise.all([
    getMedellinWeather(),
    getRedditInsights()
  ]);

  const pypInfo = getPicoYPlacaInfo(diaSemana, config.placa_vehiculo);
  const maintenanceAlerts = checkMaintenance();

  console.log(`Clima: UV ${clima.uvMax} | Reddit: ${redditInfo.substring(0,30)}...`);
  console.log("Generando reporte con DeepSeek (JSON)...");
  
  const aiPayload = await generateStrategy(clima, pypInfo, redditInfo, diaSemana);

  let finalMessage = `<b>🚕 DiDi Master Shift - Reporte Diario</b>\n\n${aiPayload.mensaje_telegram}`;
  if (maintenanceAlerts) {
    finalMessage += `\n\n${maintenanceAlerts}`;
  }

  console.log("Enviando a Telegram...");
  await sendTelegram(finalMessage);

  if (aiPayload.eventos_calendario && aiPayload.eventos_calendario.length > 0) {
    console.log("Sincronizando con Google Calendar...");
    await syncDiDiSchedule(aiPayload.eventos_calendario);
  }

  console.log("¡Hecho!");
}

main().catch(console.error);
