const fs = require('node:fs');
const path = require('node:path');

const VITAL_PATH = path.resolve(__dirname, '..', 'data', 'contexto_vital.json');

function readVital() {
  try {
    return JSON.parse(fs.readFileSync(VITAL_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeVital(data) {
  data._meta.updated = new Date().toISOString();
  fs.writeFileSync(VITAL_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ contexto_vital.json actualizado');
}

function printHelp() {
  console.log(`
USO:
  node scripts/agregar_contexto.js <seccion> <valor>

SECCIONES:
  meta-cp       Agrega meta a corto plazo
  meta-mp       Agrega meta a mediano plazo
  meta-lp       Agrega meta a largo plazo
  nota          Agrega nota de vida
  recordatorio  Agrega recordatorio recurrente
  estudio-sena  Actualiza programa SENA (formato: "Programa|Ficha|Fin")
  estudio-curso Agrega curso CESDE
  trabajo-ent   Agrega entrevista pendiente
  trabajo-post  Agrega postulacion activa
  eps           Actualiza EPS
  cita          Agrega cita medica pendiente
  dian          Actualiza estado DIAN
  simit         Actualiza estado SIMIT
  deuda         Agrega deuda (formato: "Concepto|Monto")
  contacto      Agrega contacto (formato: "Nombre|Info")
  ver           Muestra el contexto vital completo

EJEMPLOS:
  node scripts/agregar_contexto.js meta-cp "Conseguir empleo como desarrollador"
  node scripts/agregar_contexto.js nota "Hoy avance en el proyecto de Gmail Cleaner"
  node scripts/agregar_contexto.js dian "Pendiente de presentar declaracion 2025"
  node scripts/agregar_contexto.js ver
`);
}

const handlers = {
  'meta-cp': (data, val) => { data.metas.corto_plazo.push(val); },
  'meta-mp': (data, val) => { data.metas.mediano_plazo.push(val); },
  'meta-lp': (data, val) => { data.metas.largo_plazo.push(val); },
  'nota': (data, val) => { data.notas_vida.push(`[${new Date().toISOString().split('T')[0]}] ${val}`); },
  'recordatorio': (data, val) => { data.recordatorios_recurrentes.push(val); },
  'estudio-sena': (data, val) => {
    const parts = val.split('|').map(s => s.trim());
    if (parts.length >= 1) data.estudio.sena.programa = parts[0];
    if (parts.length >= 2) data.estudio.sena.ficha = parts[1];
    if (parts.length >= 3) data.estudio.sena.fin_estimado = parts[2];
  },
  'estudio-curso': (data, val) => { data.estudio.cesde.cursos.push(val); },
  'trabajo-ent': (data, val) => { data.trabajo.entrevistas_pendientes.push(val); },
  'trabajo-post': (data, val) => { data.trabajo.postulaciones_activas.push(val); },
  'eps': (data, val) => { data.salud.eps = val; },
  'cita': (data, val) => { data.salud.citas_pendientes.push(val); },
  'dian': (data, val) => { data.legal_financiero.dian.estado = val; data.legal_financiero.dian.ultima_gestion = new Date().toISOString(); },
  'simit': (data, val) => { data.legal_financiero.simit.estado = val; data.legal_financiero.simit.ultima_gestion = new Date().toISOString(); },
  'deuda': (data, val) => { data.legal_financiero.deudas.push({ desc: val, added: new Date().toISOString() }); },
  'contacto': (data, val) => { data.contactos_importantes.push({ info: val, added: new Date().toISOString() }); },
  'ver': (data) => { console.log(JSON.stringify(data, null, 2)); return 'show'; },
};

const section = process.argv[2];
const value = process.argv[3];

if (!section || section === '--help' || section === '-h') {
  printHelp();
  process.exit(0);
}

const data = readVital();
if (!data) {
  console.error('❌ No se pudo leer contexto_vital.json');
  process.exit(1);
}

const handler = handlers[section];
if (!handler) {
  console.error(`❌ Seccion desconocida: "${section}"`);
  printHelp();
  process.exit(1);
}

const result = handler(data, value);
if (result === 'show') {
  process.exit(0);
}

writeVital(data);
if (section === 'nota') {
  const notasPath = path.resolve(__dirname, '..', 'data', 'notas.md');
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  fs.appendFileSync(notasPath, `\n- [${timestamp}] ${value}`, 'utf8');
  console.log('✅ También agregado a data/notas.md');
}
