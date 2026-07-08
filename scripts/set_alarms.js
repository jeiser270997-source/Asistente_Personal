const { execSync } = require('node:child_process');

const adbPath = 'C:\\Users\\dev\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

const alarms = [
  // Lunes, Viernes y Sábado temprano (5 AM)
  { h: 5, m: 0, days: '2,6,7', msg: 'DIDI_AM_META_260K' },
  
  // Martes y Jueves temprano (6 AM)
  { h: 6, m: 0, days: '3,5', msg: 'DESPERTAR_LLEVAR_DOMINICK' },
  
  // Martes y Jueves (salir hacia escuela a las 8 AM)
  { h: 8, m: 0, days: '3,5', msg: 'SALIR_HACIA_ESCUELA' },
  
  // Buscar Dominick todos los días de semana (10:30 AM)
  { h: 10, m: 30, days: '2,3,4,5,6', msg: 'BUSCAR_DOMINICK_ESCUELA' },
  
  // Miércoles Natación Dominick (1 PM para clase de 2 PM)
  { h: 13, m: 0, days: '4', msg: 'NATACION_DOMINICK' },
  
  // Lunes, Martes, Jueves, Viernes: DiDi PM turno de la tarde
  { h: 15, m: 15, days: '2,3,5,6', msg: 'DIDI_PM_META_260K' },
  
  // Lunes, Miércoles, Viernes: Enrutar a casa para clase CESDE (5 PM)
  { h: 17, m: 0, days: '2,4,6', msg: 'ENRUTAR_A_CASA_CESDE_VIRTUAL' },
  
  // Sábado: Bootcamp Presencial (5 AM) - Empieza en Julio 25 aprox
  { h: 5, m: 0, days: '7', msg: 'CESDE_PRESENCIAL_BOOTCAMP' },
  
  // Domingo: Fútbol Dominick
  { h: 9, m: 0, days: '1', msg: 'FUTBOL_DOMINICK' },

  // Domingo: Empezar jornada DiDi Dominical (10:30 AM)
  { h: 10, m: 30, days: '1', msg: 'DIDI_DOMINGO_LARGO' }
];

for (const a of alarms) {
  const cmd = `${adbPath} shell am start -a android.intent.action.SET_ALARM --ei android.intent.extra.alarm.HOUR ${a.h} --ei android.intent.extra.alarm.MINUTES ${a.m} --eia android.intent.extra.alarm.DAYS ${a.days} --ez android.intent.extra.alarm.SKIP_UI true --es android.intent.extra.alarm.MESSAGE \"${a.msg}\"`;
  try {
    console.log(`Setting alarm: ${a.msg} at ${a.h}:${a.m} on days ${a.days}`);
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    console.error(`Error setting ${a.msg}: ${e.message}`);
  }
}
console.log('All recurring alarms set clean!');
