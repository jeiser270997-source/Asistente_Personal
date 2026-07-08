/**
 * scripts/jobs/metrics/uhabits_engine.js
 * 
 * Motor para exportar métricas de LifeOS (Horas de código, CESDE, etc)
 * a un formato CSV compatible con la app Android Loop Habit Tracker (uhabits).
 */
const fs = require('node:fs');
const path = require('node:path');

const BACKUP_DIR = path.join(__dirname, '..', '..', '..', 'data', 'backups');
const CSV_PATH = path.join(BACKUP_DIR, 'uhabits_export.csv');

/**
 * Formato esperado por Loop Habits CSV:
 * Primera columna: Nombre del Hábito
 * Siguientes columnas: Fechas en formato YYYY-MM-DD
 * Valores: 0 (no hecho), 1 o 2 (hecho) o un valor numérico (para hábitos medibles).
 * 
 * Ejemplo de CSV (Loop Habits transpone la matriz, cada fila es un hábito, cada col es una fecha):
 * Habit Name,2026-07-06,2026-07-07,2026-07-08
 * Coding > 2h,1,0,1
 * Gym,0,1,1
 */

// Simulación de lectura de Ledger/Métricas de LifeOS
const simulatedLifeOSMetrics = {
  '2026-07-06': { coding: 1, gym: 0, cesde: 1 },
  '2026-07-07': { coding: 0, gym: 1, cesde: 1 },
  '2026-07-08': { coding: 1, gym: 1, cesde: 0 }
};

const HABIT_MAPPINGS = {
  coding: 'Programar > 2h',
  gym: 'Ejercicio / Gym',
  cesde: 'Asistencia CESDE'
};

async function exportToUhabitsCSV() {
  console.log('🔄 Generando CSV compatible con Loop Habit Tracker...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const dates = Object.keys(simulatedLifeOSMetrics).sort();
  let csvContent = 'Habit Name,' + dates.join(',') + '\n';

  const habitKeys = Object.keys(HABIT_MAPPINGS);

  for (const key of habitKeys) {
    const habitName = HABIT_MAPPINGS[key];
    const row = [habitName];
    for (const date of dates) {
      row.push(simulatedLifeOSMetrics[date][key] || 0);
    }
    csvContent += row.join(',') + '\n';
  }

  fs.writeFileSync(CSV_PATH, csvContent, 'utf8');
  console.log('✅ Archivo exportado exitosamente a:', CSV_PATH);
  console.log('📱 Ya puedes enviar este archivo a tu celular e importarlo en Loop Habit Tracker.');
}

if (require.main === module) {
  exportToUhabitsCSV().catch(e => console.error(e));
}

module.exports = {
  exportToUhabitsCSV
};
