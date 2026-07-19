/**
 * lib/integrations/tomtom_client.js
 * Cliente de Tránsito y Enrutamiento de TomTom para LifeOS.
 * Calcula el tráfico real y los retrasos en las rutas de DiDi.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });

const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
const TIMEOUT_MS = 8000;

// Coordenadas fijas de Medellín/AMVA para evaluación de rutas DiDi
const HUBS = {
  LA_ESTRELLA: '6.1556,-75.6436', // Origen habitual (La Triana)
  EL_POBLADO:  '6.2089,-75.5678', // Destino Dinámico Principal (Mañana)
  LAURELES:    '6.2442,-75.5894', // Zona Comercial / Universitaria
  CENTRO:      '6.2442,-75.5694', // Alpujarra / Puntos Administrativos
};

/**
 * Consulta la API de TomTom para calcular una ruta con tráfico en tiempo real.
 * @param {string} originLatLon - "lat,lon"
 * @param {string} destLatLon - "lat,lon"
 * @returns {Promise<{travelTime: number, delay: number, ok: boolean}>}
 */
async function getRouteMetrics(originLatLon, destLatLon) {
  if (!TOMTOM_KEY) {
    return { ok: false, error: 'Falta TOMTOM_API_KEY en .env' };
  }

  const locations = `${originLatLon}:${destLatLon}`;
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${TOMTOM_KEY}&traffic=true&travelMode=car&depart=now`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`TomTom HTTP ${res.status}`);
    }
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) {
      throw new Error('No se encontraron rutas en la respuesta');
    }

    const summary = route.summary;
    return {
      ok: true,
      travelTimeMin: Math.round(summary.travelTimeInSeconds / 60),
      delayMin: Math.round(summary.trafficDelayInSeconds / 60),
      lengthKm: Math.round((summary.lengthInMeters / 1000) * 10) / 10
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Obtiene el reporte de tráfico consolidado para el Morning Briefing.
 */
async function getTrafficReport() {
  if (!TOMTOM_KEY) {
    return '⚠️ *Tránsito TomTom:* API Key no configurada en .env.';
  }

  const [poblado, centro] = await Promise.all([
    getRouteMetrics(HUBS.LA_ESTRELLA, HUBS.EL_POBLADO),
    getRouteMetrics(HUBS.LA_ESTRELLA, HUBS.CENTRO)
  ]);

  const lines = ['🚗 *REPORTE DE TRÁFICO EN VIVO (TomTom)*'];

  if (poblado.ok) {
    const delayText = poblado.delayMin > 0 ? ` (+${poblado.delayMin} min retraso por tráfico)` : ' (Flujo libre)';
    lines.push(`• *La Estrella ➔ El Poblado:* ${poblado.travelTimeMin} min${delayText} | ${poblado.lengthKm} km`);
  } else {
    lines.push(`• *La Estrella ➔ El Poblado:* Error (${poblado.error})`);
  }

  if (centro.ok) {
    const delayText = centro.delayMin > 0 ? ` (+${centro.delayMin} min retraso)` : ' (Flujo libre)';
    lines.push(`• *La Estrella ➔ Alpujarra/Centro:* ${centro.travelTimeMin} min${delayText} | ${centro.lengthKm} km`);
  } else {
    lines.push(`• *La Estrella ➔ Alpujarra/Centro:* Error (${centro.error})`);
  }

  return lines.join('\n');
}

module.exports = { getRouteMetrics, getTrafficReport, HUBS };
