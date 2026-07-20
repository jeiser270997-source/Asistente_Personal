/**
 * pico_placa.js — Pico y placa Medellín para LifeOS (KEW496 → dígito 6)
 *
 * Cambio oficial personal (Jeiser):
 *   Desde 2026-08-04: dígito 6 → LUNES, 05:00–20:00
 *   Antes: dígito 6 → JUEVES (esquema anterior en didi_config)
 *
 * Fuente de verdad: data/config/pico_placa.json (si existe) + defaults aquí.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'config', 'pico_placa.json');
const DIDI_PATH = path.join(__dirname, '..', '..', 'data', 'config', 'didi_config.json');

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

/** Esquema hasta 2026-08-03 (legacy didi_config) */
const SCHEME_BEFORE = {
  Lunes: ['5', '8'],
  Martes: ['1', '4'],
  Miercoles: ['2', '0'],
  Jueves: ['3', '6'],
  Viernes: ['7', '9'],
};

/**
 * Esquema desde 2026-08-04.
 * Jeiser confirma: su placa (…6) restringe LUNES 5am–8pm.
 * Días de otros dígitos: se mantienen rotación razonable; el dígito 6 sale de jueves → lunes.
 */
const SCHEME_FROM_2026_08_04 = {
  Lunes: ['6', '9'],      // …6 y …9 (ajuste Jeiser: 6 en lunes)
  Martes: ['1', '4'],
  Miercoles: ['2', '0'],
  Jueves: ['3', '5'],     // 6 ya no jueves
  Viernes: ['7', '8'],
};

const HOURS_DEFAULT = { start: '05:00', end: '20:00' };
const SCHEME_START = '2026-08-04';

function loadJson(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { /* ignore */ }
  return null;
}

function toColombia(d = new Date()) {
  // Fecha/hora “como en Bogotá” para getDay/hours estables
  return new Date(d.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

function getColombiaNow() {
  return toColombia(new Date());
}

function todayIso(d = new Date()) {
  const col = toColombia(d);
  const y = col.getFullYear();
  const m = String(col.getMonth() + 1).padStart(2, '0');
  const day = String(col.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayName(d = new Date()) {
  return DAYS[toColombia(d).getDay()];
}

function parseHm(hm) {
  const [h, m] = String(hm).split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesNow(d = new Date()) {
  const col = toColombia(d);
  return col.getHours() * 60 + col.getMinutes();
}

function getPlateDigit() {
  const file = loadJson(CONFIG_PATH);
  if (file?.placa_last_digit) return String(file.placa_last_digit);
  const env = (process.env.USER_PLATE || 'KEW496').replace(/\D/g, '').slice(-1);
  const didi = loadJson(DIDI_PATH);
  if (didi?.placa_vehiculo) return String(didi.placa_vehiculo).slice(-1);
  return env || '6';
}

function getSchemeForDate(isoDate) {
  const file = loadJson(CONFIG_PATH);
  const start = file?.scheme_from || SCHEME_START;
  if (isoDate >= start) {
    return file?.by_day || SCHEME_FROM_2026_08_04;
  }
  // legacy from didi_config if present
  const didi = loadJson(DIDI_PATH);
  if (didi?.pico_y_placa_medellin) {
    const m = didi.pico_y_placa_medellin;
    return {
      Lunes: (m.lunes || SCHEME_BEFORE.Lunes).map(String),
      Martes: (m.martes || SCHEME_BEFORE.Martes).map(String),
      Miercoles: (m.miercoles || SCHEME_BEFORE.Miercoles).map(String),
      Jueves: (m.jueves || SCHEME_BEFORE.Jueves).map(String),
      Viernes: (m.viernes || SCHEME_BEFORE.Viernes).map(String),
    };
  }
  return SCHEME_BEFORE;
}

function getHours() {
  const file = loadJson(CONFIG_PATH);
  return {
    start: file?.hours?.start || HOURS_DEFAULT.start,
    end: file?.hours?.end || HOURS_DEFAULT.end,
  };
}

/**
 * @returns {{
 *   dayName: string,
 *   placa: string,
 *   rest: string[],
 *   applies: boolean,
 *   inWindow: boolean,
 *   hours: {start:string,end:string},
 *   schemeFrom: string,
 *   message: string
 * }}
 */
function getPicoYPlacaStatus(date = getColombiaNow()) {
  const iso = todayIso(date);
  const name = dayName(date);
  const placa = getPlateDigit();
  const scheme = getSchemeForDate(iso);
  const rest = (scheme[name] || []).map(String);
  const appliesToday = rest.includes(placa);
  const hours = getHours();
  const nowM = minutesNow(date);
  const inWindow = nowM >= parseHm(hours.start) && nowM < parseHm(hours.end);
  const restrictedNow = appliesToday && inWindow;

  let message;
  if (name === 'Sabado' || name === 'Domingo') {
    message = `✅ Fin de semana — sin pico y placa (placa …${placa})`;
  } else if (!appliesToday) {
    message = `✅ Sin pico y placa hoy (${name}) — placa …${placa} libre. Hoy restringen: ${rest.join(' y ') || 'n/a'}`;
  } else if (restrictedNow) {
    message = `🚫 *PICO Y PLACA AHORA* — placa …${placa} | ${name} ${hours.start}–${hours.end}. NO saques el Corolla.`;
  } else {
    message = `⚠️ Pico y placa *hoy* (${name}) placa …${placa}, ventana ${hours.start}–${hours.end}. Fuera de ventana puedes circular.`;
  }

  return {
    dayName: name,
    placa,
    rest,
    applies: appliesToday,
    inWindow,
    restrictedNow,
    hours,
    schemeFrom: iso >= (loadJson(CONFIG_PATH)?.scheme_from || SCHEME_START)
      ? (loadJson(CONFIG_PATH)?.scheme_from || SCHEME_START)
      : 'legacy',
    message,
  };
}

module.exports = {
  getPicoYPlacaStatus,
  getPlateDigit,
  getSchemeForDate,
  SCHEME_START,
  SCHEME_FROM_2026_08_04,
  SCHEME_BEFORE,
};
