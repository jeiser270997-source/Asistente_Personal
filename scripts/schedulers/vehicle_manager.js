/**
 * scripts/schedulers/vehicle_manager.js
 * 
 * Gerente de Mantenimiento de Flota (Corolla XLi 2010).
 * Calcula días desde el último mantenimiento y devuelve alertas.
 */

const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'state', 'vehicle_state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  // Estado inicial por defecto si no existe
  return {
    ultima_presion_llantas: "2026-06-20", 
    ultimo_lavado: "2026-06-20",
    ultimo_corte_cabello: "2026-06-20"
  };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function checkMaintenance() {
  const state = loadState();
  const today = new Date();
  let alerts = [];

  // Chequeo 1: Presión de Llantas (Cada 15 días)
  const lastTireCheck = new Date(state.ultima_presion_llantas || "2026-06-20");
  const diffTires = Math.floor((today - lastTireCheck) / (1000 * 60 * 60 * 24));
  if (diffTires >= 15) {
    alerts.push("⚠️ <b>MANTENIMIENTO:</b> Han pasado 15 días. Calibra tus llantas a <b>32 PSI</b> hoy mismo (en frío) para no destruir la suspensión.");
    state.ultima_presion_llantas = today.toISOString().split('T')[0];
  }

  // Chequeo 2: Lavado (Cada 15 días)
  const lastWash = new Date(state.ultimo_lavado || "2026-06-20");
  const diffWash = Math.floor((today - lastWash) / (1000 * 60 * 60 * 24));
  if (diffWash >= 15) {
    alerts.push("🚿 <b>LAVADO RECOMENDADO:</b> Aplica el Algoritmo Pit-Stop de $4.000 COP en Dlavar:\n- 1 min Agua ($1k)\n- 1 min Espuma ($1k). *Restriega a mano con tu guante*\n- 2 min Agua Profunda ($2k)\n- *Aspira en casa.*");
    state.ultimo_lavado = today.toISOString().split('T')[0];
  }

  // Chequeo 3: Mantenimiento Personal / Barbería (Zero-Thinking)
  // Pico y Placa del 6 es el Miercoles (dia 3)
  const diaSemana = today.getDay();
  const lastCorte = new Date(state.ultimo_corte_cabello || "2026-06-20");
  const diffCorte = Math.floor((today - lastCorte) / (1000 * 60 * 60 * 24));
  
  if (diffCorte >= 12 && diaSemana === 3) { // Miercoles
    alerts.push("🧔🏻‍♂️ <b>MANTENIMIENTO PERSONAL:</b> Hoy es Miércoles (Pico y Placa). No puedes trabajar en DiDi. Tienes ORDEN DIRECTA de ir a San Antonio de Prado a las 10:00 AM o 2:00 PM a recortar barba y desvanecer laterales. Cero excusas.");
    state.ultimo_corte_cabello = today.toISOString().split('T')[0];
  }

  // Chequeo 4: Gasolina (Día 1 del mes)
  if (today.getDate() === 1) {
    alerts.push("⛽ <b>ACTUALIZACIÓN FINANCIERA:</b> Hoy es día 1. Revisa si MinEnergia subió la gasolina. Si subió, ajusta tu gasto diario de $60.000 en el archivo didi_config.json.");
  }

  saveState(state);
  return alerts.join("\n\n");
}

module.exports = { checkMaintenance };
