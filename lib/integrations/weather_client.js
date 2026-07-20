/**
 * weather_client.js — Clima Medellín vía Open-Meteo (gratis, sin API key).
 *
 * Problema que resuelve: el briefing usaba precipitation_probability_max del DÍA
 * y weathercode diario → a las 5am decía "lluvioso" aunque el cielo estuviera despejado.
 *
 * Modelo honesto:
 *  - AHORA: current_weather (temp, código, viento)
 *  - MAÑANA (próximas 6h): lluvia/UV por hora
 *  - TARDE (12–18h): probabilidad de lluvia
 *  - Nunca inventa con LLM
 */
'use strict';

const MEDELLIN = { lat: 6.2518, lon: -75.5636, tz: 'America/Bogota' };
const TIMEOUT_MS = 12_000;

/** WMO weather interpretation codes (Open-Meteo) */
function codeToLabel(code) {
  const c = Number(code);
  if (c === 0) return { es: 'Despejado / soleado', rainLikely: false, icon: '☀️' };
  if (c === 1) return { es: 'Mayormente despejado', rainLikely: false, icon: '🌤️' };
  if (c === 2) return { es: 'Parcialmente nublado', rainLikely: false, icon: '⛅' };
  if (c === 3) return { es: 'Nublado', rainLikely: false, icon: '☁️' };
  if (c === 45 || c === 48) return { es: 'Niebla', rainLikely: false, icon: '🌫️' };
  if (c >= 51 && c <= 57) return { es: 'Llovizna', rainLikely: true, icon: '🌦️' };
  if (c >= 61 && c <= 67) return { es: 'Lluvia', rainLikely: true, icon: '🌧️' };
  if (c >= 71 && c <= 77) return { es: 'Nieve / aguanieve', rainLikely: true, icon: '🌨️' };
  if (c >= 80 && c <= 82) return { es: 'Chubascos', rainLikely: true, icon: '🌦️' };
  if (c >= 95) return { es: 'Tormenta', rainLikely: true, icon: '⛈️' };
  return { es: `Código ${c}`, rainLikely: c >= 50, icon: '🌡️' };
}

function avg(nums) {
  const a = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (!a.length) return null;
  return Math.round(a.reduce((s, n) => s + n, 0) / a.length);
}

function maxOf(nums) {
  const a = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (!a.length) return null;
  return Math.max(...a);
}

/**
 * @returns {Promise<object>} clima estructurado o { ok:false, error }
 */
async function getMedellinWeatherDetailed() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${MEDELLIN.lat}&longitude=${MEDELLIN.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,cloud_cover` +
    `&daily=weather_code,precipitation_probability_max,precipitation_sum,uv_index_max,temperature_2m_max,temperature_2m_min` +
    `&timezone=${encodeURIComponent(MEDELLIN.tz)}` +
    `&forecast_days=1`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = await res.json();

    const cur = data.current || {};
    const nowCode = cur.weather_code ?? 0;
    const nowLabel = codeToLabel(nowCode);

    const times = data.hourly?.time || [];
    const hourNow = new Date().toLocaleString('en-US', {
      timeZone: MEDELLIN.tz,
      hour: 'numeric',
      hour12: false,
    });
    // Find index closest to current hour in Bogota
    let idx = times.findIndex((t) => t.includes(`T${String(hourNow).padStart(2, '0')}:`));
    if (idx < 0) idx = 0;

    const slice = (arr, from, len) => (arr || []).slice(from, from + len);

    // Next 6 hours from now
    const next6prob = slice(data.hourly?.precipitation_probability, idx, 6);
    const next6code = slice(data.hourly?.weather_code, idx, 6);
    const next6precip = slice(data.hourly?.precipitation, idx, 6);

    // Afternoon window 12:00–18:00 local (find first hour with T12:)
    let idx12 = times.findIndex((t) => t.includes('T12:'));
    if (idx12 < 0) idx12 = Math.min(idx + 4, times.length - 1);
    const aftProb = slice(data.hourly?.precipitation_probability, idx12, 6);
    const aftCode = slice(data.hourly?.weather_code, idx12, 6);

    const morningRainMax = maxOf(next6prob) ?? 0;
    const afternoonRainMax = maxOf(aftProb) ?? 0;
    const dailyRainMax = data.daily?.precipitation_probability_max?.[0] ?? morningRainMax;

    // Dominant code next 6h (mode-ish: max severity if any rain code)
    const worstNext = next6code.reduce((w, c) => (Number(c) > Number(w) ? c : w), nowCode);
    const morningLabel = codeToLabel(worstNext);
    const aftWorst = aftCode.reduce((w, c) => (Number(c) > Number(w) ? c : w), 0);
    const afternoonLabel = codeToLabel(aftWorst);

    const uvMax = data.daily?.uv_index_max?.[0] ?? null;
    const tempNow = cur.temperature_2m;
    const feels = cur.apparent_temperature;
    const humidity = cur.relative_humidity_2m;
    const clouds = cur.cloud_cover;
    const wind = cur.wind_speed_10m;
    const precipNow = cur.precipitation ?? 0;

    // Honest summary line for humans
    let verdict = `${nowLabel.icon} *Ahora:* ${nowLabel.es}, ${tempNow}°C`;
    if (precipNow > 0) verdict += ` (lloviendo ${precipNow} mm)`;
    if (morningRainMax >= 50 && !nowLabel.rainLikely) {
      verdict += ` · ⚠️ lluvia posible en las próximas horas (${morningRainMax}%)`;
    } else if (morningRainMax < 30 && dailyRainMax >= 60) {
      verdict += ` · ℹ️ el día puede mojarse *más tarde* (máx día ${dailyRainMax}%), mañana seca`;
    }

    return {
      ok: true,
      source: 'Open-Meteo (sin key)',
      fetchedAt: new Date().toISOString(),
      now: {
        tempC: tempNow,
        feelsLikeC: feels,
        humidity,
        clouds,
        windKmh: wind,
        precipMm: precipNow,
        code: nowCode,
        label: nowLabel.es,
        icon: nowLabel.icon,
        rainLikely: nowLabel.rainLikely || precipNow > 0,
      },
      morningNext6h: {
        rainProbMax: morningRainMax,
        rainProbAvg: avg(next6prob),
        precipMmSum: next6precip.reduce((s, n) => s + (n || 0), 0),
        label: morningLabel.es,
        icon: morningLabel.icon,
      },
      afternoon: {
        rainProbMax: afternoonRainMax,
        label: afternoonLabel.es,
        icon: afternoonLabel.icon,
      },
      daily: {
        // Solo referencia; NO usar solo esto para decidir el día
        rainProbMax: dailyRainMax,
        precipSumMm: data.daily?.precipitation_sum?.[0],
        uvMax,
        tempMax: data.daily?.temperature_2m_max?.[0],
        tempMin: data.daily?.temperature_2m_min?.[0],
        code: data.daily?.weather_code?.[0],
      },
      // Compat con briefing viejo
      probLluvia: morningRainMax,
      uvMax: uvMax ?? 5,
      codigo: nowCode,
      verdict,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      source: 'Open-Meteo',
      // compat mínimo para no romper briefing
      probLluvia: null,
      uvMax: null,
      codigo: null,
      verdict: `⚠️ Clima no disponible (${err.message}). No inventar pronóstico.`,
    };
  }
}

/** Texto Markdown para Telegram / consola */
function formatWeatherMarkdown(w) {
  if (!w || !w.ok) {
    return w?.verdict || '⚠️ Clima: sin datos (API free falló). Revisa al salir.';
  }
  const lines = [
    '🌤️ *CLIMA MEDELLÍN* _(Open-Meteo, datos medidos/pronóstico horario)_',
    w.verdict,
    `• Sensación: ${w.now.feelsLikeC}°C · Humedad ${w.now.humidity}% · Nubes ${w.now.clouds}% · Viento ${w.now.windKmh} km/h`,
    `• *Próximas 6h:* ${w.morningNext6h.icon} ${w.morningNext6h.label} · lluvia máx ${w.morningNext6h.rainProbMax}%`,
    `• *Tarde (12–18h):* ${w.afternoon.icon} ${w.afternoon.label} · lluvia máx ${w.afternoon.rainProbMax}%`,
    `• *Referencia día completo:* lluvia máx ${w.daily.rainProbMax}% · UV ${w.daily.uvMax ?? 'n/a'} · ${w.daily.tempMin}–${w.daily.tempMax}°C`,
  ];
  if (w.daily.uvMax >= 7) {
    lines.push('• ⚠️ UV alto → *NO DiDi 10:30–15:30* (ola de calor / exposición)');
  }
  if (w.now.rainLikely) {
    lines.push('• ☔ *Ahora está mojado* — paraguas / evita zona de ladera si hay tormenta');
  } else if (w.morningNext6h.rainProbMax < 40 && w.daily.rainProbMax >= 60) {
    lines.push('• ✅ Mañana razonablemente seca; la lluvia del “día” es más tarde — no confíes solo en el máximo diario');
  }
  return lines.join('\n');
}

module.exports = {
  getMedellinWeatherDetailed,
  formatWeatherMarkdown,
  codeToLabel,
};
