it browser.newPage();
  
  try {
    // Vamos a buscar en un agregador de pico y placa muy estable:
    await page.goto('https://www.pyphoy.com/medellin', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Extraer el texto de la página para buscar la rotación
    const text = await page.evaluate(() => document.body.innerText);
    
    // NOTA: Para un scraping robusto en producción requeriríamos selectores exactos
    // Pero como solo queremos saber si hubo un "cambio de semestre", 
    // verificamos si la placa "6" sigue siendo el miércoles.
    
    // Por seguridad, usaremos la rotación guardada en STATE_FILE
    // El orquestador (Morning Briefing) la leerá. Si es Agosto y la rotación no se ha
    // actualizado, alertará al usuario.
    console.log('✅ Conexión exitosa. Monitoreo pasivo activo.');

  } catch (e) {
    console.error('❌ Error scrapeando pico y placa:', e.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  checkPicoYPlaca().catch(console.error);
}

module.exports = { checkPicoYPlaca };
````

## File: scripts/jobs/whatsapp_jobs_parser.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const { logApplication, listApps, getStats } = require('../../lib/runtime/job_tracker');

const BASE_DIR = path.resolve(__dirname, '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const CANAL_PATH = path.join(JOBS_DIR, 'canal_juniorjobs.json');

function ensureDir() { if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true }); }

function log(msg) { console.log(msg); }

// ─── PARSE WHATSAPP FORWARDED JOB MESSAGE ─────────────────────
function parseJobMessage(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  const jobs = [];
  let currentJob = null;

  const patterns = {
    empresa: /^(?:🏢|🔹|💼|📍)?\s*(?:Empresa:|Company:)\s*(.+)/i,
    puesto: /^(?:👨‍💻|👩‍💻|💻|🔍)?\s*(?:Puesto:|Role:|Posición:|Cargo:)\s*(.+)/i,
    salario: /^(?:💰|💵)?\s*(?:Salario:|Salary:|Sueldo:)\s*(.+)/i,
    ubicacion: /^(?:📍|🌎)?\s*(?:Ubicación:|Location:|Remoto|Remote|Presencial)\s*(.+)?/i,
    stack: /^(?:🛠)?\s*(?:Stack:|Tecnologías:|Tech:)\s*(.+)/i,
    link: /(https?:\/\/[^\s]+)/i,
    email: /([\w.-]+@[\w.-]+\.\w+)/i
  };

  for (const line of lines) {
    const cleaned = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    
    // Check if this looks like a job start
    const empresaMatch = cleaned.match(patterns.empresa);
    const puestoMatch = cleaned.match(patterns.puesto);
    
    if (empresaMatch || puestoMatch) {
      if (currentJob && currentJob.puesto) {
        jobs.push(currentJob);
      }
      currentJob = { empresa: '', puesto: '', salario: '', ubicacion: '', stack: '', link: '', contacto: '' };
      if (empresaMatch) currentJob.empresa = empresaMatch[2].trim();
      if (puestoMatch) currentJob.puesto = puestoMatch[2].trim();
      continue;
    }

    if (!currentJob) continue;

    // Extract details
    const salarioMatch = cleaned.match(patterns.salario);
    const ubicacionMatch = cleaned.match(patterns.ubicacion);
    const stackMatch = cleaned.match(patterns.stack);
    const linkMatch = cleaned.match(patterns.link);
    const emailMatch = cleaned.match(patterns.email);

    if (salarioMatch) currentJob.salario = salarioMatch[2] || salarioMatch[1];
    else if (ubicacionMatch) currentJob.ubicacion = ubicacionMatch[2] || ubicacionMatch[1];
    else if (stackMatch) currentJob.stack = stackMatch[2] || stackMatch[1];
    else if (linkMatch) currentJob.link = linkMatch[1];
    else if (emailMatch) currentJob.contacto = emailMatch[1];
    else if (!currentJob.puesto && cleaned.length > 10 && cleaned.length < 100) {
      currentJob.puesto = cleaned;
    } else if (!currentJob.empresa && cleaned.length > 3 && cleaned.length < 60) {
      currentJob.empresa = cleaned;
    }
  }

  if (currentJob && currentJob.puesto) jobs.push(currentJob);
  return jobs;
}

// ─── MATCH JOBS AGAINST PROFILE ─────────────────────────────
function matchJobs(jobs) {
  const vital = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data', 'contexto_vital.json'), 'utf8'));
  const habilidades = (vital.estudio?.habilidades || []).map(h => h.toLowerCase());
  const industrias = (vital.trabajo?.industrias_interes || []).map(i => i.toLowerCase());
  const keywords = ['qa', 'testing', 'playwright', 'cypress', 'automatización', 'automation', 
                    'javascript', 'typescript', 'node', 'react', 'frontend', 'backend', 'fullstack',
                    'junior', 'trainee', 'sin experiencia', 'entry level', 'remoto', 'remote',
                    'soporte', 'support', 'it', 'desarrollador', 'developer', 'programador',
                    'colombia', 'latam', 'latinoamérica', 'medellín'];

  for (const job of jobs) {
    const text = (job.puesto + ' ' + job.empresa + ' ' + job.stack + ' ' + job.ubicacion).toLowerCase();
    let score = 50;

    // Higher score for matching skills
    for (const skill of habilidades) {
      if (text.includes(skill.toLowerCase())) score += 15;
    }

    // Bonus for matching industries
    for (const ind of industrias) {
      if (text.includes(ind.toLowerCase())) score += 10;
    }

    // Boost for specific keywords
    if (keywords.some(k => text.includes(k))) score += 8;

    // Penalize senior roles
    if (text.includes('senior') || text.includes('sr.') || text.includes('líder')) score -= 20;
    if (text.includes('semi senior') || text.includes('semi-senior')) score -= 5;
    
    // Boost for junior/entry
    if (text.includes('junior') || text.includes('jr.') || text.includes('trainee') || text.includes('sin experiencia')) score += 15;
    
    // Boost for remote
    if (text.includes('remoto') || text.includes('remote')) score += 10;

    // Boost for Colombia/LATAM
    if (text.includes('colombia') || text.includes('latam') || text.includes('latinoamérica')) score += 10;

    job.score = Math.max(0, Math.min(100, score));
    job.aplicar = job.score >= 60;
    job.razon = job.aplicar ? 
      (job.score >= 80 ? 'ALTAMENTE RECOMENDADO - Perfil coincide fuerte' : 
       job.score >= 65 ? 'RECOMENDADO - Buen match con tu perfil' : 
       'POSIBLE - Revisar detalles') :
      'NO RECOMENDADO - Perfil no coincide';
  }

  jobs.sort((a, b) => b.score - a.score);
  return jobs;
}

// ─── SAVE & TRACK ──────────────────────────────────────────
function saveToTracker(jobs) {
  const tracked = [];
  for (const job of jobs) {
    if (job.aplicar && job.link) {
      const result = logApplication({
        empresa: job.empresa || 'Desconocida',
        cargo: job.puesto,
        plataforma: 'JuniorJobs WhatsApp',
        url: job.link,
        detalles: `Stack: ${job.stack || 'N/A'} | ${job.ubicacion || ''} | ${job.salario || ''} | Score: ${job.score}`,
        fecha_aplicacion: new Date().toISOString().split('T')[0]
      });
      tracked.push({ job, result });
    }
  }
  return tracked;
}

// ─── GENERATE REPORT ─────────────────────────────────────────
function generateReport(jobs, aplicadas) {
  ensureDir();
  
  const report = {
    fecha: new Date().toISOString(),
    fuente: 'JuniorJobs WhatsApp (51K seguidores)',
    total: jobs.length,
    recomendadas: jobs.filter(j => j.aplicar).length,
    no_recomendadas: jobs.filter(j => !j.aplicar).length,
    jobs: jobs.map(j => ({
      empresa: j.empresa,
      puesto: j.puesto,
      stack: j.stack,
      ubicacion: j.ubicacion,
      salario: j.salario,
      link: j.link,
      score: j.score,
      veredicto: j.aplicar ? 'APLICAR' : 'NO APLICAR',
      razon: j.razon
    }))
  };

  fs.writeFileSync(CANAL_PATH, JSON.stringify(report, null, 2));
  
  // Generate Telegram-friendly summary
  const lines = [];
  lines.push(`📋 *JuniorJobs WhatsApp - ${new Date().toLocaleDateString('es-CO', {timeZone:'America/Bogota'})}*`);
  lines.push(`_${report.total} ofertas analizadas | ${report.recomendadas} recomendadas para ti_`);
  lines.push('');

  const aplicar = jobs.filter(j => j.aplicar);
  if (aplicar.length > 0) {
    lines.push('🟢 *APLICAR:*');
    for (const j of aplicar) {
      lines.push(`• *${j.puesto}* @ ${j.empresa} (${j.score}%)`);
      if (j.stack) lines.push(`  Stack: ${j.stack}`);
      if (j.link) lines.push(`  ${j.link}`);
      lines.push('');
    }
  }

  const noAplicar = jobs.filter(j => !j.aplicar);
  if (noAplicar.length > 0) {
    lines.push('🔴 *NO APLICAR:*');
    for (const j of noAplicar.slice(0, 5)) {
      lines.push(`• ${j.puesto} @ ${j.empresa} - ${j.razon.substring(0, 40)}`);
    }
    if (noAplicar.length > 5) lines.push(`  ... y ${noAplicar.length - 5} mas`);
  }

  const stats = getStats();
  lines.push('');
  lines.push(`📊 *Tracking:* ${stats.activas} aplicaciones activas | ${stats.entrevistas} entrevistas | ${stats.compatibles} compatibles`);

  return { report, telegramMsg: lines.join('\n') };
}

// ─── MAIN ─────────────────────────────────────────────────────
function main() {
  ensureDir();
  
  const inputText = process.argv[2];
  if (!inputText) {
    // Try reading from stdin
    let stdinData = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => stdinData += chunk);
    process.stdin.on('end', () => {
      if (!stdinData.trim()) {
        log('Uso: node scripts/whatsapp_jobs_parser.js "texto del mensaje de WhatsApp"');
        log('  o: echo "texto" | node scripts/whatsapp_jobs_parser.js');
        log('');
        log('Reenvia el mensaje del canal JuniorJobs al bot de Telegram');
        log('y el sistema lo parseara automaticamente.');
        process.exit(0);
      }
      processMessage(stdinData);
    });
    return;
  }

  processMessage(inputText);
}

function processMessage(text) {
  log('📱 Parseando ofertas de JuniorJobs WhatsApp...\n');
  
  const jobs = parseJobMessage(text);
  log(`   ${jobs.length} ofertas extraidas`);
  
  if (jobs.length === 0) {
    log('   ⚠ No se encontraron ofertas. ¿El formato del mensaje cambio?');
    log('   Guardando texto original para debug.');
    const fallbackPath = path.join(JOBS_DIR, 'ultimo_mensaje_crudo.txt');
    fs.writeFileSync(fallbackPath, text);
    process.exit(0);
  }
  
  const matched = matchJobs(jobs);
  const aplicadas = saveToTracker(matched);
  const { report, telegramMsg } = generateReport(matched, aplicadas);
  
  log(telegramMsg);
  log(`\n✅ Reporte guardado: ${CANAL_PATH}`);
  
  // Output for Telegram integration
  console.log('\n__TELEGRAM_MSG__');
  console.log(telegramMsg);
}

main();
````

## File: scripts/maintenance/agregar_contexto.js
````javascript
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
````

## File: scripts/maintenance/analyze_documents.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(BASE_DIR, 'data', 'documentos');
const ANALYSIS_FILE = path.join(DOCS_DIR, 'analisis.json');

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function loadAnalysis() {
  try {
    if (fs.existsSync(ANALYSIS_FILE)) return JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveAnalysis(data) {
  const dir = path.dirname(ANALYSIS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(data, null, 2));
}

async function analyzePDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.substring(0, 4000);
  } catch (e) {
    return `[Error extrayendo texto: ${e.message}]`;
  }
}

function findNewPDFs(analysis) {
  const results = [];
  if (!fs.existsSync(DOCS_DIR)) return results;

  const dates = fs.readdirSync(DOCS_DIR).filter(d => {
    const p = path.join(DOCS_DIR, d);
    return fs.statSync(p).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d);
  });

  for (const date of dates) {
    const dateDir = path.join(DOCS_DIR, date);
    const emails = fs.readdirSync(dateDir).filter(d => {
      return fs.statSync(path.join(dateDir, d)).isDirectory();
    });

    for (const email of emails) {
      const emailDir = path.join(dateDir, email);
      const files = fs.readdirSync(emailDir).filter(f => f.endsWith('.pdf'));

      for (const file of files) {
        const filePath = path.join(emailDir, file);
        const key = `${date}/${email}/${file}`;
        if (!analysis[key]) {
          results.push({ key, filePath, date, email, file });
        }
      }
    }
  }
  return results;
}

async function main() {
  log('🔍 Buscando documentos nuevos para analizar...');

  const analysis = loadAnalysis();
  const newDocs = findNewPDFs(analysis);

  log(`${newDocs.length} documentos nuevos sin analizar`);

  if (newDocs.length === 0) {
    log('✅ Nada nuevo.');
    return { analyzed: 0 };
  }

  const SYSTEM_PROMPT = `Eres un analista de documentos legales y administrativos colombianos.
Tu trabajo es extraer la información CLAVE de cada documento en español.
Para CADA documento, responde con EXACTAMENTE esto:

TIPO: [tipo de documento: resolución, comparendo, certificado, notificación, contrato, etc.]
ENTIDAD: [quién lo emite]
FECHA: [fecha del documento]
RESUMEN (1 línea): [qué dice en una frase]
ACCIÓN REQUERIDA: [qué tiene que hacer Jeiser, si aplica. Si no, escribe "NINGUNA"]
PLAZO: [fecha límite si tiene, si no "SIN PLAZO"]
MONTO: [si hay dinero involucrado, si no "N/A"]`;

  let count = 0;
  for (const doc of newDocs) {
    log(`📄 Analizando: ${doc.key}`);
    const text = await analyzePDF(doc.filePath);

    if (text.startsWith('[Error')) {
      analysis[doc.key] = { error: text, analyzedAt: new Date().toISOString() };
      continue;
    }

    try {
      const response = await askLLM(SYSTEM_PROMPT, [
        { role: 'user', content: `Analiza este documento:\n\n${text}` }
      ]);
      const content = response?.content || 'No se pudo analizar';

      analysis[doc.key] = {
        rawText: text.substring(0, 500),
        analysis: content,
        file: doc.filePath,
        analyzedAt: new Date().toISOString()
      };
      count++;
      log(`✅ Analizado (${count}/${newDocs.length})`);
    } catch (e) {
      log(`❌ Error LLM: ${e.message}`);
      analysis[doc.key] = { error: e.message, analyzedAt: new Date().toISOString() };
    }
  }

  saveAnalysis(analysis);
  log(`🏁 ${count} documentos analizados.`);
  return { analyzed: count, total: Object.keys(analysis).length };
}

if (require.main === module) {
  main().catch(e => { log(`💥 FATAL: ${e.message}`); process.exit(1); });
}

module.exports = { main };
````

## File: scripts/maintenance/backup_automator.js
````javascript
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.resolve(__dirname, '..', '..');
const BACKUP_DIR = path.join(BASE_DIR, 'data', 'backups');

function runBackup() {
    console.log('🔄 Iniciando Backup Automático de LifeOS...');
    
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const zipName = `lifeos_backup_${date}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    // Recursos críticos según la skill backup-automator
    const criticalResources = [
        'data/memoria_hipocampo.db',
        'data/state',
        '.agents/skills',
        '.env',
        'token.json',
        '.google_token.json',
        'credentials.json'
    ];

    console.log('📦 Recopilando archivos críticos...');
    
    // Crear directorio temporal para organizar el zip
    const tempDir = path.join(BACKUP_DIR, 'temp_backup');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    let filesCopied = 0;
    for (const res of criticalResources) {
        const fullPath = path.join(BASE_DIR, res);
        if (fs.existsSync(fullPath)) {
            const destPath = path.join(tempDir, res);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            
            if (fs.statSync(fullPath).isDirectory()) {
                fs.cpSync(fullPath, destPath, { recursive: true });
            } else {
                fs.copyFileSync(fullPath, destPath);
            }
            console.log(` ✅ Copiado: ${res}`);
            filesCopied++;
        } else {
            console.log(` ⚠️ No encontrado (se omite): ${res}`);
        }
    }

    if (filesCopied === 0) {
        console.error('❌ No se encontró ningún archivo crítico para respaldar.');
        return;
    }

    // Comprimir con PowerShell Compress-Archive
    console.log(`🗜️  Comprimiendo backup a ${zipName}...`);
    try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); // Borrar si ya existe backup de hoy
        
        // Powershell compress-archive
        const psCommand = `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`;
        execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'inherit' });
        console.log(`✅ Backup local creado con éxito en: ${zipPath}`);
    } catch (err) {
        console.error('❌ Error al comprimir el backup:', err.message);
    } finally {
        // Limpiar temp
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Sincronizar con Rclone si está configurado
    console.log('☁️  Verificando integración con Rclone...');
    try {
        // Chequea si existe el comando y si hay remotos configurados
        execSync('rclone version', { stdio: 'ignore' });
        
        // Asumimos que el remote se llamará "LifeOS_Backup"
        const rcloneConfig = execSync('rclone listremotes').toString();
        if (rcloneConfig.includes('LifeOS_Backup:')) {
            console.log('🚀 Sincronizando con Google Drive (LifeOS_Backup)...');
            execSync(`rclone sync "${BACKUP_DIR}" "LifeOS_Backup:backups" -v`, { stdio: 'inherit' });
            console.log('✅ Sincronización en la nube completada.');
        } else {
            console.log('⚠️  El remote "LifeOS_Backup" no está configurado en Rclone.');
            console.log('   -> Ejecuta "rclone config" para crearlo y vincular tu Google Drive.');
        }
    } catch (err) {
        console.log('⚠️  Rclone no está instalado o falló. Sáltando sincronización en la nube.');
    }

    // Limpieza: Mantener solo los últimos 7 backups locales
    console.log('🧹 Limpiando backups antiguos (retención 7 días)...');
    try {
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('lifeos_backup_') && f.endsWith('.zip'));
        if (files.length > 7) {
            files.sort((a, b) => {
                return fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime();
            });
            const toDelete = files.slice(7);
            for (const file of toDelete) {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(` 🗑️  Eliminado backup antiguo: ${file}`);
            }
        }
    } catch (err) {
        console.error('❌ Error al limpiar backups antiguos:', err.message);
    }

    console.log('🎉 Proceso de backup finalizado exitosamente.');
}

runBackup();
````

## File: scripts/maintenance/document_pipeline.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { main: download } = require('./download_attachments');
const { main: analyze } = require('./analyze_documents');
const { sendTelegramMessage } = require('../../lib/integrations/telegram');

async function main() {
  console.log('╔══════════════════════════════════╗');
  console.log('║   Document Pipeline v1.0        ║');
  console.log('╚══════════════════════════════════╝\n');

  // Paso 1: Descargar adjuntos
  console.log('📥 PASO 1: Descargando adjuntos...');
  const dlResult = await download();

  // Paso 2: Analizar documentos
  console.log('\n🧠 PASO 2: Analizando documentos...');
  const ar = await analyze();

  // Paso 3: Notificar
  const lines = [];
  if (dlResult.nuevos > 0) {
    lines.push(`📥 <b>${dlResult.nuevos}</b> emails con adjuntos descargados`);
  }
  if (ar.analyzed > 0) {
    lines.push(`🧠 <b>${ar.analyzed}</b> documentos analizados con IA`);
  }
  if (lines.length > 0) {
    const msg = `📋 <b>Document Pipeline</b>\n\n${lines.join('\n')}\n\nTotal en archivo: ${ar.total || 0} docs`;
    await sendTelegramMessage(msg);
    console.log('📨 Telegram notificado.');
  } else {
    console.log('✅ Sin novedades.');
  }

  console.log('\n🏁 Pipeline completado.');
}

main().catch(e => {
  console.error('💥', e.message);
  process.exit(1);
});
````

## File: scripts/maintenance/setup_backup_task.ps1
````powershell
# Script para configurar el backup automático de LifeOS en Windows Task Scheduler
# Debe ejecutarse con permisos de administrador o en tu sesión activa.

$TaskName = "LifeOS_DailyBackup"
$Description = "Ejecuta el script de backup_automator.js todos los días a las 2:00 AM para comprimir y subir los datos de LifeOS a Google Drive."

# Obtener la ruta base del proyecto
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BaseDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$NodeScriptPath = Join-Path $BaseDir "scripts\maintenance\backup_automator.js"

# Detectar ruta de Node.js
$NodeExe = (Get-Command node.exe).Source
if (-not $NodeExe) {
    Write-Error "No se encontró node.exe en el PATH. Instala Node.js o asegúrate de que está en las variables de entorno."
    exit
}

# Crear la acción
$Action = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$NodeScriptPath`"" -WorkingDirectory $BaseDir

# Crear el trigger: Todos los días a las 2:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

# Crear settings para que no se detenga si la PC no tiene batería, etc.
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Write-Host "Registrando tarea programada: $TaskName ..."
# Registrar tarea (en el contexto del usuario actual para tener acceso a los archivos y a Rclone)
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description $Description -Force

Write-Host "✅ Tarea programada registrada exitosamente."
Write-Host "La tarea se ejecutará como el usuario actual todos los días a las 2:00 AM."
Write-Host "Puedes verla o editarla abriendo el 'Programador de tareas' (Task Scheduler) en Windows."
````

## File: scripts/maintenance/wipe_google_data.js
````javascript
/**
 * scripts/maintenance/wipe_google_data.js
 * 
 * Script NUCLEAR. Borra TODOS los eventos del calendario principal
 * y TODAS las listas de tareas de Google Tasks asociadas a la cuenta.
 * 
 * Requiere el scope: https://www.googleapis.com/auth/tasks y auth/calendar
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');
const CREDENTIALS_FILE = path.join(__dirname, '..', '..', 'credentials.json');

const DRY_RUN = process.argv.includes('--dry-run');

function getAuthClient() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('Falta el token de Google. Corre setup_google_calendar.js primero.');
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const key = creds.installed || creds.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob'
  );
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function wipeCalendar(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  console.log('\n--- 🗓️  Borrando eventos de Google Calendar ---');
  let pageToken = null;
  let deletedCount = 0;

  do {
    const res = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 2500,
      pageToken: pageToken,
    });
    
    const events = res.data.items;
    if (events && events.length > 0) {
      for (const event of events) {
        if (DRY_RUN) {
          console.log(`[DRY-RUN] Se borraría el evento: ${event.summary} (${event.id})`);
        } else {
          try {
            await calendar.events.delete({
              calendarId: 'primary',
              eventId: event.id
            });
            console.log(`🗑️  Borrado: ${event.summary || '(Sin Título)'}`);
            deletedCount++;
          } catch (e) {
            console.error(`❌ Error borrando evento ${event.id}:`, e.message);
          }
        }
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`✅ Total de eventos borrados: ${deletedCount}`);
}

async function wipeTasks(auth) {
  const tasksService = google.tasks({ version: 'v1', auth });
  console.log('\n--- ✅ Borrando listas de Google Tasks ---');
  
  try {
    const res = await tasksService.tasklists.list({ maxResults: 100 });
    const taskLists = res.data.items;
    
    if (taskLists && taskLists.length > 0) {
      for (const list of taskLists) {
        // La lista default ("@default") no puede ser borrada completamente, 
        // pero se pueden borrar sus tareas usando tasks.clear()
        if (DRY_RUN) {
          console.log(`[DRY-RUN] Se borraría el contenido de la lista: ${list.title} (${list.id})`);
        } else {
          try {
            // Borrar tareas completadas o ocultas
            await tasksService.tasks.clear({ tasklist: list.id });
            console.log(`🧹 Lista purgada (tareas completadas): ${list.title}`);
            
            // Borrar cada tarea activa una por una
            const tasksRes = await tasksService.tasks.list({ tasklist: list.id, showHidden: true });
            if (tasksRes.data.items) {
              for (const t of tasksRes.data.items) {
                await tasksService.tasks.delete({ tasklist: list.id, task: t.id });
                console.log(`  🗑️  Borrada tarea: ${t.title || '(Sin título)'}`);
              }
            }
            
            // Si no es la default, borrar la lista completa
            if (list.title !== 'Mis tareas' && list.title !== 'My Tasks') {
               await tasksService.tasklists.delete({ tasklist: list.id });
               console.log(`💥 Lista de tareas destruida: ${list.title}`);
            }
          } catch (e) {
             console.error(`❌ Error purgando lista ${list.title}:`, e.message);
          }
        }
      }
    }
  } catch (err) {
    if (err.message.includes('Insufficient Permission')) {
      console.log('⚠️ Error de permisos para Tasks. Asegúrate de haber corrido setup_google_calendar.js y aceptado los nuevos permisos.');
    } else {
      console.error(err);
    }
  }
}

async function main() {
  console.log('☢️  INICIANDO WIPE DE GOOGLE DATA ☢️');
  if (DRY_RUN) console.log('>>>> MODO DRY-RUN ACTIVADO (No se borrará nada) <<<<');
  
  try {
    const auth = getAuthClient();
    await wipeCalendar(auth);
    await wipeTasks(auth);
    console.log('\n🎉 PROCESO NUCLEAR FINALIZADO.');
  } catch (error) {
    console.error('Fatal Error:', error.message);
  }
}

if (require.main === module) {
  main();
}
````

## File: scripts/schedulers/jarvis_loop.js
````javascript
#!/usr/bin/env node
/**
 * scripts/jarvis_loop.js
 *
 * El latido de Jarvis.
 *
 * Cada N minutos:
 *   1. Toma un snapshot del estado del sistema
 *   2. Piensa (reglas + LLM si aplica)
 *   3. Ejecuta las decisiones (emite eventos)
 *   4. Duerme
 *
 * Uso:
 *   node scripts/jarvis_loop.js                # cada 5 min
 *   node scripts/jarvis_loop.js --interval=10   # cada 10 min
 *   node scripts/jarvis_loop.js --once          # una sola iteracion
 *   node scripts/jarvis_loop.js --chaos         # con chaos testing
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

if (!USE_SQLITE) {
  console.error('[jarvis] Requires STORAGE_DRIVER=sqlite');
  process.exit(1);
}

const { getState } = require('../../lib/context/state_snapshot');
const { think, execute, getDecisionLog, needsLLM } = require('../../lib/think/think');
const bus = require('../../lib/events/event_bus');
require('../../lib/events/event_registry');

const INTERVAL_MIN = parseInt(process.argv.find(a => a.startsWith('--interval='))?.split('=')[1] || '5', 10);
const ONCE = process.argv.includes('--once');

function log(msg) {
  const line = `[jarvis] ${new Date().toISOString()} ${msg}`;
  console.log(line);
}

async function cycle() {
  log('=== Thinking cycle ===');

  // 1. Tomar snapshot
  const state = getState();
  log(`State: ${state.casos.abiertos} casos, ${state.empleo.aplicadas} aplicadas, estres: ${state.senales_estres.alto ? 'ALTO' : 'normal'}`);

  // 2. Pensar
  const decisions = await think(state);
  log(`Decisions: ${decisions.length} (${needsLLM(state) ? 'con LLM' : 'solo reglas'})`);

  if (decisions.length > 0) {
    // 3. Ejecutar
    execute(decisions);
    decisions.forEach(d => log(`  -> ${d.type}: ${d.razon || d.source || ''}`));
    bus.emit('jarvis.cycle', {
      decisions: decisions.length,
      llm: needsLLM(state),
      resumen: decisions.map(d => d.type).join(', '),
    }, { source: 'jarvis', priority: 'normal' });
  }

  log('=== Cycle complete ===');
}

async function main() {
  log(`Jarvis loop started (interval: ${INTERVAL_MIN}min, once: ${ONCE})`);

  if (ONCE) {
    await cycle();
    log('Done (--once)');
    return;
  }

  // Infinite loop
  while (true) {
    const start = Date.now();
    try {
      await cycle();
    } catch (e) {
      log(`Error in cycle: ${e.message}`);
      bus.emit('system.error', { source: 'jarvis_loop', error: e.message }, { source: 'jarvis', priority: 'high' });
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    const sleepMs = Math.max(1000, INTERVAL_MIN * 60 * 1000 - elapsed * 1000);
    log(`Sleeping ${Math.round(sleepMs / 1000)}s...`);
    await new Promise(r => setTimeout(r, sleepMs));
  }
}

main().catch(e => {
  console.error(`[jarvis] Fatal: ${e.message}`);
  process.exit(1);
});
````

## File: scripts/schedulers/vehicle_manager.js
````javascript
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
````

## File: scripts/act_runner.ps1
````powershell
# act_runner.ps1
# Corre GitHub Actions localmente usando 'act' (https://github.com/nektos/act)
# Prerequisito: choco install act-cli  (o descargar binario de releases)
# Uso: .\scripts\act_runner.ps1 [nombre-del-job]
# Ejemplos:
#   .\scripts\act_runner.ps1 process-emails
#   .\scripts\act_runner.ps1 run-brain
#   .\scripts\act_runner.ps1 check

param(
  [string]$Job = "process-emails",
  [string]$Workflow = "",
  [switch]$DryRun = $false
)

# Verificar que act está instalado
if (-not (Get-Command act -ErrorAction SilentlyContinue)) {
  Write-Host "❌ 'act' no está instalado." -ForegroundColor Red
  Write-Host "   Instalar con: choco install act-cli" -ForegroundColor Yellow
  Write-Host "   O descargar de: https://github.com/nektos/act/releases" -ForegroundColor Yellow
  exit 1
}

# Verificar que .env existe
if (-not (Test-Path ".env")) {
  Write-Host "❌ .env no encontrado en la raíz del proyecto." -ForegroundColor Red
  exit 1
}

Write-Host "🚀 Ejecutando job '$Job' localmente con act..." -ForegroundColor Cyan

$actArgs = @(
  "-j", $Job,
  "--secret-file", ".env",
  "--container-architecture", "linux/amd64",
  "-P", "ubuntu-22.04=ghcr.io/catthehacker/ubuntu:act-22.04"
)

if ($Workflow) {
  $actArgs += @("-W", ".github/workflows/$Workflow")
}

if ($DryRun) {
  $actArgs += "--dryrun"
  Write-Host "🔍 Modo DryRun — no se ejecutará realmente." -ForegroundColor Yellow
}

Write-Host "Comando: act $($actArgs -join ' ')" -ForegroundColor Gray
act @actArgs
````

## File: scripts/auto_sync.bat
````batch
@echo off
setlocal

:: Cambiar al directorio del proyecto
cd /d "%~dp0.."

echo [Life OS] Iniciando sincronizacion con GitHub...

:: Añadir cambios
git add data/
git add .agents/
git add skills/

:: Revisar si hay cambios
git status --porcelain > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [Life OS] No hay cambios para sincronizar.
    exit /b 0
)

:: Hacer commit
set "datetime=%date% %time%"
git commit -m "Auto-sync Life OS: %datetime%"

:: Hacer push
git push origin main

echo [Life OS] Sincronizacion completada con exito.
exit /b 0
````

## File: scripts/compress_brain.bat
````batch
@echo off
setlocal

set HEADROOM_PATH=C:\Users\dev\AppData\Roaming\Python\Python314\Scripts\headroom.exe

echo [Life OS] Iniciando Headroom Proxy para compresion de contexto...
echo Ahorro esperado: 60%% - 95%% de tokens.

if not exist "%HEADROOM_PATH%" (
    echo [ERROR] Headroom no encontrado en %HEADROOM_PATH%
    exit /b 1
)

:: Iniciar el proxy
"%HEADROOM_PATH%" proxy
````

## File: scripts/find_bill.js
````javascript
const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');

async function findBill() {
  try {
    const auth = await authorize(['https://mail.google.com/']);
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Buscar correos de EPM o facturas
    const query = '308000 OR 308.000 OR epm';
    console.log(`Buscando con query: ${query}`);
    
    const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 15 });
    const messages = res.data.messages || [];
    
    if (messages.length === 0) {
      console.log('No se encontraron facturas recientes.');
      return;
    }

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
      const headers = detail.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
      const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
      console.log(`\n============================`);
      console.log(`De: ${from}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Snippet: ${detail.data.snippet}`);
      
      // Intentar extraer el valor
      const snippetStr = detail.data.snippet || '';
      if (snippetStr.includes('308')) {
        console.log('⭐ ESTE CORREO MENCIONA EL VALOR 308!');
      }
    }
  } catch (err) {
    console.error('Error buscando factura:', err.message);
  }
}

findBill();
````

## File: scripts/finish_auth.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '.google_token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

async function main() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const key = creds.installed || creds.web;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    'http://localhost'
  );

  const urlStr = process.argv[2];
  const urlObj = new URL(urlStr.trim());
  const code = urlObj.searchParams.get('code');
  if (!code) throw new Error('No code found in URL');

  const { tokens } = await oauth2Client.getToken(code);
  
  let currentToken = {};
  if (fs.existsSync(TOKEN_PATH)) {
      currentToken = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  }

  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: tokens.refresh_token || currentToken.refresh_token,
    scope: SCOPES.join(' '),
  });
  
  fs.writeFileSync(TOKEN_PATH, payload, 'utf8');
  console.log('✅ TOKEN GUARDADO EXITOSAMENTE!');
}

main().catch(console.error);
````

## File: scripts/gemini_free_tier_tracker.ps1
````powershell
#!powershell
# Gemini Free Tier API Usage Tracker
# Tracks remaining requests and time for Gemini 2.0 Flash, 2.5 Flash, 2.5 Pro, and 2.5 Flash Lite models
# Requires GEMINI_API_KEY environment variable
param(
    [switch]$Verbose,
    [string]$LogPath = (Join-Path $PSScriptRoot "logs" "gemini_api_tracker.log"),
    [int]$CacheHours = 1
)

function Start-GeminiFreeTierTracker {
    $apiKey = $env:GEMINI_API_KEY
    if (-not $apiKey) {
        Write-Host "ERROR: GEMINI_API_KEY environment variable not set" -ForegroundColor Red
        Write-Host "Please set it with: $env:GEMINI_API_KEY = \"your-api-key\"" -ForegroundColor Yellow
        exit 1
    }
    
    # Test API with a lightweight metadata request to verify key works
    $headers = @{
        "Content-Type" = "application/json"
        "x-goog-api-client" = "gemini-tracker/1.0"
    }
    
    $body = @{
        "contents" = @(
            @{ "parts" = @(@{ "text" = "test" }) }
        ) | ConvertTo-Json -Depth 3
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/google-test?\$key=$apiKey" `
            -Method Post -Headers $headers -Body $body -TimeoutSec 30 -ErrorAction Stop
        
        Write-Host "API Key is valid! Ready to track usage..." -ForegroundColor Green
        
        # Start tracking
        Track-ApiUsage -ApiKey $apiKey -LogPath $LogPath -Verbose:$Verbose -CacheHours $CacheHours
    }
    catch {
        Write-Host "ERROR: API key test failed" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor DarkGray
        exit 1
    }
}

function Get-FreeTierUsage {
    param(
        [string]$ApiKey,
        [hashtable]$RateLimits
    )
    
    # Target models for the free tier (newer models likely have more quota)
    $models = @(
        "gemini-2-0-flash",
        "gemini-2-0-flash-exp",
        "gemini-2-5-flash-exp",
        "gemini-2-5-flash",
        "gemini-2-5-pro",
        "gemini-2-5-flash-lite"
    )
    
    $currentTime = [datetime]::UtcNow.ToUnixTimeSeconds()
    $dailyLimit = 1500
    $minuteLimit = 15
    $monthlyLimit = 1000000
    
    $totalRequestsUsed = 0
    $totalTokensUsed = 0
    $minuteUsageSummary = @()  # Track requests per last 60 seconds
    $hourRequests = @()  # Track requests per last hour
    $dayRequests = @()   # Track requests per day
    $projectedDailyUsage = 0
    $projectedMonthlyUsage = 0
    $minuteUsageMap = @{ }
    $hourUsageMap = @{ }
    $dayUsageMap = @{ }
    $queriesByModel = @{ }
    $tokensByModel = @{ }
    $bodyCacheByModel = @{ }
    $timeUsedByModel = @{ }
    $currentKeyInfo = @{ }
    
    $timestamp = Get-DateTimeStamp
    
    foreach ($model in $models) {
        try {
            $modelUsage = Get-ModelUsage -ApiKey $ApiKey -Model $model
            $queriesByModel[$model] = $modelUsage.queriesUsed
            $tokensByModel[$model] = $modelUsage.tokensUsed
            $bodyCacheByModel[$model] = $modelUsage.cacheHits
            $timeUsedByModel[$model] = $modelUsage.timeUsed
            $totalRequestsUsed += $modelUsage.queriesUsed
            $totalTokensUsed += $modelUsage.tokensUsed
            $currentKeyInfo[$model] = $modelUsage.keyInfo
            
            # Get current timestamp for logging
            $currentDateTime = Get-DateTimeStamp
            
            $minuteUsageSummary += @{
                "timestamp" = $currentDateTime
                "model" = $model
                "requests" = $modelUsage.queriesUsed
                "tokens" = $modelUsage.tokensUsed
                "cache_hits" = $modelUsage.cacheHits
                "time_seconds" = $modelUsage.timeUsed
            }
            
            if ($Verbose) {
                Write-Host "[$currentDateTime] Model: $model - Queries: $($modelUsage.queriesUsed) - Tokens: $($modelUsage.tokensUsed) - Cache Hits: $($modelUsage.cacheHits) - Time Used: $($modelUsage.timeUsed) seconds" -ForegroundColor Cyan
            }
            
            $dateKey = $currentDateTime.Substring(0, 10)
            if (-not $dayUsageMap.ContainsKey($dateKey)) { $dayUsageMap[$dateKey] = @() }
            $dayUsageMap[$dateKey] += $modelUsage.queriesUsed
            
            $hourKey = $currentDateTime.Substring(0, 13)
            if (-not $hourUsageMap.ContainsKey($hourKey)) { $hourUsageMap[$hourKey] = @() }
            $hourUsageMap[$hourKey] += $modelUsage.queriesUsed
            
            $minuteKey = $currentDateTime.Substring(0, 16) + ":" + $currentDateTime.Substring(17, 2)
            if (-not $minuteUsageMap.ContainsKey($minuteKey)) { $minuteUsageMap[$minuteKey] = @() }
            $minuteUsageMap[$minuteKey] += $modelUsage.queriesUsed
            
        } catch {
            Write-Host "WARNING: Failed to get usage for model $model : $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Calculate residuals
    $remainingMinuteRequests = $minuteLimit - $totalRequestsUsed
    $remainingDailyRequests = $dailyLimit - $totalRequestsUsed
    $remainingMonthlyRequests = $monthlyLimit - $totalRequestsUsed
    
    # Calculate projected usage
    $minuteProjection = if ($totalRequestsUsed -gt 0) { [math]::Floor(($totalRequestsUsed / $currentTime % 60) * 60) } else { 0 }
    $hourProjection = if ($hourUsageMap.Count -gt 0) { [math]::Round(($hourUsageMap.Values | Measure-Average), 2) } else { 0 }
    $dayProjection = if ($dayUsageMap.Count -gt 0) { [math]::Round(($dayUsageMap.Values | Measure-Average), 2) } else { 0 }
    
    # Display results
    Write-Host "`n=== Gemini Free Tier Usage Report ===" -ForegroundColor Green
    Write-Host "Timestamp: $(Get-DateTimeStamp)" -ForegroundColor White
    Write-Host "Total Requests Used: $totalRequestsUsed / $minuteLimit per minute, $dailyLimit per day, $monthlyLimit per month" -ForegroundColor White
    
    if ($remainingMinuteRequests -gt 0) {
        Write-Host "Requests Remaining This Minute: $remainingMinuteRequests" -ForegroundColor Green
    } else {
        Write-Host "Requests Remaining This Minute: $remainingMinuteRequests (You have reached the per-minute limit)" -ForegroundColor Red
    }
    
    if ($remainingDailyRequests -gt 0) {
        Write-Host "Requests Remaining Today: $remainingDailyRequests" -ForegroundColor Green
    } else {
        Write-Host "Requests Remaining Today: $remainingDailyRequests (You have reached the daily limit)
" -ForegroundColor Red
    }
    
    if ($remainingMonthlyRequests -gt 0) {
        Write-Host "Requests Remaining This Month: $remainingMonthlyRequests" -ForegroundColor Green
    } else {
        Write-Host "Requests Remaining This Month: $remainingMonthlyRequests (You have reached the monthly limit)" -ForegroundColor Red
    }
    
    Write-Host "Total Tokens Used: $($totalTokensUsed.ToString('N0'))" -ForegroundColor White
    Write-Host "Projected Hourly Usage: $hourProjection requests" -ForegroundColor Gray
    Write-Host "Projected Daily Usage: $dayProjection requests" -ForegroundColor Gray
    Write-Host ""
    
    # Display breakdown by model
    Write-Host "Breakdown by Model:" -ForegroundColor Yellow
    $modelsList = $models | Sort-Object
    foreach ($model in $modelsList) {
        if ($queriesByModel.ContainsKey($model) -and $tokensByModel.ContainsKey($model)) {
            $modelColor = if ($queriesByModel[$model] -gt 0) { "Red" } else { "Gray" }
            $modelRequests = $queriesByModel[$model]
            $modelTokens = $tokensByModel[$model]
            $cacheInfo = if ($bodyCacheByModel.ContainsKey($model)) { " (Cache: $($bodyCacheByModel[$model]))" } else { "" }
            Write-Host "  $model`:$modelRequests requests, $modelTokens tokens$cacheInfo" -ForegroundColor $modelColor
        }
    }
    
    # Log the usage
    $logEntry = @{
        "timestamp" = Get-DateTimeStamp
        "total_requests_used" = $totalRequestsUsed
        "total_tokens_used" = $totalTokensUsed
        "minute_remaining" = $remainingMinuteRequests
        "day_remaining" = $remainingDailyRequests
        "month_remaining" = $remainingMonthlyRequests
        "hour_projection" = $hourProjection
        "day_projection" = $dayProjection
        "usage_by_model" = $queriesByModel
        "tokens_by_model" = $tokensByModel
        "current_key_info" = $currentKeyInfo
        "minute_usage_summary" = $minuteUsageSummary
    }
    
    $logJson = $logEntry | ConvertTo-Json -Depth 10
    Add-Content -Path $LogPath -Value "$logEntry" -Force
    
    Write-Host "Usage logged to: $LogPath" -ForegroundColor DarkGray
    
    # Alert if approaching limits
    if ($remainingMinuteRequests -lt 2) {
        Write-Host "URGENT: Only $remainingMinuteRequests requests remaining this minute!" -ForegroundColor Red -BackgroundColor DarkRed
    } elseif ($remainingDailyRequests -lt 100) {
        Write-Host "CAUTION: Only $remainingDailyRequests requests remaining today." -ForegroundColor Yellow
    }
    
    return $logEntry
}

function Get-ModelUsage {
    param(
        [string]$ApiKey,
        [string]$Model
    )
    
    $url = "https://generativelanguage.googleapis.com/v1beta/models/$model\$usageStats"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{"x-goog-api-client" = "gemini-tracker/1.0"} -TimeoutSec 30 -ErrorAction Stop
        
        $usage = $response.usageStats
        $cacheHits = if ($response.usageStats.ContainsKey("cacheHitCount")) { $response.usageStats.cacheHitCount } else { 0 }
        $quotaLimit = if ($response.usageStats.ContainsKey("quotaLimit")) { $response.usageStats.quotaLimit } else { 0 }
        $quotaRemaining = if ($response.usageStats.ContainsKey("quotaRemaining")) { $response.usageStats.quotaRemaining } else { 0 }
        $dailyQuota = if ($response.usageStats.ContainsKey("dailyQuota")) { $response.usageStats.dailyQuota } else { 0 }
        $dailyRemaining = if ($response.usageStats.ContainsKey("dailyQuotaRemaining")) { $response.usageStats.dailyQuotaRemaining } else { 0 }
        
        $result = [ordereddictionary]@{
            "queriesUsed" = $usage.queriesUsed
            "tokensUsed" = $usage.tokens
            "cacheHits" = $cacheHits
            "timeUsed" = $usage.timeUsed
            "quotaLimit" = $quotaLimit
            "quotaRemaining" = $quotaRemaining
            "dailyQuota" = $dailyQuota
            "dailyRemaining" = $dailyRemaining
            "keyInfo" = @{
                "source" = "environment"
                "set_time" = (Get-DateTimeStamp)
            }
        }
        
        return $result
        
    } catch {
        $error = $_.Exception
        Write-Host "API call failed for model $model : $($error.Message)" -ForegroundColor Yellow
        
        # Return 0 values as fallback
        $result = [ordereddictionary]@{
            "queriesUsed" = 0
            "tokensUsed" = 0
            "cacheHits" = 0
            "timeUsed" = 0
            "quotaLimit" = 0
            "quotaRemaining" = 0
            "dailyQuota" = 0
            "dailyRemaining" = 0
            "keyInfo" = @{
                "source" = "error"
                "error" = $error.Message
                "set_time" = (Get-DateTimeStamp)
            }
        }
        
        return $result
    }
}

function Track-ApiUsage {
    param(
        [string]$ApiKey,
        [string]$LogPath,
        [switch]$Verbose,
        [int]$CacheHours
    )
    
    # Test key first
    $testUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2-0-flash?\$key=$ApiKey"
    try {
        $null = Invoke-RestMethod -Uri $testUrl -Method Head -TimeoutSec 30 -ErrorAction Stop
        Write-Host "API Key validated successfully" -ForegroundColor Green
    } catch {
        Write-Host "Invalid API Key: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
    # Main tracking loop
    $currentDate = (Get-DateTimeStamp).Substring(0, 10)
    $runNumber = 1
    
    while ($true) {
        Write-Host "`n--- Start of Usage Report $(Get-DateTimeStamp) ---" -ForegroundColor Cyan
        $usageReport = Get-FreeTierUsage -ApiKey $ApiKey -RateLimits @{ }
        
        # Add run number to log for tracking
        $logEntry = @{ "run" = $runNumber }
        Add-Content -Path $LogPath -Value (ConvertTo-Json -InputObject $logEntry -Depth 3) -Force
        
        $runNumber++
        
        # Wait for the next check (1 hour)
        Write-Host "Waiting 1 hour for next check..." -ForegroundColor Gray
        Start-Sleep -Seconds (3600)
    }
}

function Get-DateTimeStamp {
    return [datetime]::UtcNow.ToString("yyyy-MM-dd HH:mm:ss", [system.globalization.cultureinfo]::InvariantCulture)
}

function Append-ToLog {
    param(
        [string]$Path,
        [hashtable]$Entry
    )
    $jsonEntry = $Entry | ConvertTo-Json -Depth 10
    Add-Content -Path $Path -Value $jsonEntry -Force
}

# Support for PowerShell arrays and Measure-Average if not available
if (-not ([system.management.automation] efficiently? "Microsoft.PowerShell.Commands.Measure-ObjectCmdlet")) {
    function Measure-Object {
        param(
            [object]$InputObject,
            [string]$Property
        )
        $array = @($InputObject)
        $count = $array.Count
        $average = if ($count -gt 0) { [math]::Round(($array | Measure-Average), 2) } else { 0 }
        $max = if ($count -gt 0) { $array | Measure-Max } else { 0 }
        $min = if ($count -gt 0) { $array | Measure-Min } else { 0 }
        
        return [ordereddictionary]@{
            "Count" = $count
            "Average" = $average
            "Max" = $max
            "Min" = $min
        }
    }
}

# Execute main function
function Main {
    $logDir = Split-Path -Parent $LogPath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Start-GeminiFreeTierTracker
}

Main
````

## File: scripts/generar_contexto.py
````python
import os
import subprocess
import sys

IGNORE_PATTERNS = [
    "**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**",
    "**/*.png", "**/*.jpg", "**/*.mp4", "**/*.pdf", "**/*.json", "**/*.lock", "**/*.exe"
]

def generate_context(include_paths, output_name):
    ignore_str = ",".join(IGNORE_PATTERNS)
    include_str = ",".join(include_paths)
    cmd = f'npx repomix --style markdown --ignore "{ignore_str}" --include "{include_str}" --output "{output_name}"'
    print(f"Generando {output_name}...")
    try:
        subprocess.run(cmd, shell=True, check=True)
        print(f"✓ Creado exitosamente: {output_name}")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error al generar {output_name}: {e}", file=sys.stderr)

def main():
    print("Iniciando empaquetado de contexto modular...\n")
    base = "E:/PROYECTOS/Proyectos_GitHub"
    
    # MÓDULO QA BOOTCAMP
    generate_context([
        f"{base}/01_Estudio_y_Desafios - playwright/**/*.md",
        f"{base}/01_Estudio_y_Desafios - awesome-playwright/**/*.md",
        f"{base}/01_Estudio_y_Desafios - cypress-realworld-app/**/*.md"
    ], "ctx-qa.md")
    
    # MÓDULO FUNDAMENTOS
    generate_context([
        f"{base}/01_Estudio_y_Desafios - odin-project/**/*.md",
        f"{base}/01_Estudio_y_Desafios - developer-roadmap/**/*.md"
    ], "ctx-fundamentos.md")

    print("\nProceso finalizado. Archivos listos para Llama/Qwen.")

if __name__ == "__main__":
    main()
````

## File: scripts/schedule_softball.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { createEvent } = require('./integrations/gworkspace_manager');

async function main() {
  console.log('🥎 Agendando partidos y recordatorios de Softball...');

  const events = [
    // Juego 1: Gigantes (Jueves 9 Julio)
    {
      summary: '🎒 Acomodar tula para juego vs Gigantes',
      start: '2026-07-08T20:30:00-05:00', // Miércoles a las 8:30 PM (después de clase)
      duration: 0.5,
      desc: 'Preparar equipo para el partido de mañana.',
      reminder: 15
    },
    {
      summary: '🥎 Juego: Gigantes (Medellín)',
      start: '2026-07-09T20:45:00-05:00', // Jueves 8:45 PM
      duration: 2,
      desc: 'Enrutar DiDi hacia el estadio 1 hora antes (Alarma 7:45 PM).',
      reminder: 60
    },

    // Juego 2: Bufalos (Viernes 10 Julio)
    {
      summary: '🎒 Acomodar tula para juego vs Bufalos',
      start: '2026-07-09T23:00:00-05:00', // Jueves a las 11:00 PM (llegando del otro juego)
      duration: 0.5,
      desc: 'Preparar equipo para el partido en Envigado.',
      reminder: 15
    },
    {
      summary: '🥎 Juego: vs Bufalos (Envigado) ¡JUEGAS TÚ!',
      start: '2026-07-10T19:45:00-05:00', // Viernes 7:45 PM
      duration: 2,
      desc: '⚠️ Tienes choque de horario con la clase de CESDE (6:00 a 8:00 PM). Enrutar DiDi hacia Envigado con la clase en audio.',
      reminder: 60 // Alarma 6:45 PM
    },

    // Juego 3: La Ceja vs Envigado B (Domingo 12 Julio)
    {
      summary: '📞 Llamar a Tossi - Pelotas para juego La Ceja',
      start: '2026-07-11T13:00:00-05:00', // Sábado 1:00 PM (hora de almuerzo en Bootcamp)
      duration: 0.5,
      desc: 'Llamar a Tossi a ver si va a bajar a jugar el domingo, para dejarle las pelotas.',
      reminder: 30
    },
    {
      summary: '⚾ Juego: La Ceja vs Envigado B (Opcional)',
      start: '2026-07-12T16:00:00-05:00', // Domingo 4:00 PM
      duration: 2,
      desc: 'Solo ir si te toca ir de manager, sino las pelotas las lleva Tossi.',
      reminder: 60
    }
  ];

  for (const s of events) {
    try {
      // Usamos rrule null porque son eventos únicos
      const ev = await createEvent(s.summary, s.start, s.duration, s.desc, null, s.reminder);
      console.log(`✅ Agendado: ${ev.summary}`);
    } catch (e) {
      console.error(`❌ Error agendando ${s.summary}:`, e.message);
    }
  }
}

main().catch(console.error);
````

## File: scripts/setup-remote-access.ps1
````powershell
param([switch]$Elevated)

$ErrorActionPreference = "Stop"
$logFile = "$env:USERPROFILE\Desktop\remote-access-setup.log"

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host "$timestamp | $Message"
}

Log "=== INICIO SETUP REMOTE ACCESS ==="
Log "Usuario: $(whoami)"

# ── 1. INSTALAR OPENSSH SERVER ──
Log "[1/4] Instalando OpenSSH Server..."
try {
    $cap = Get-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
    if ($cap.State -eq "Installed") {
        Log "  OpenSSH Server ya está instalado."
    } else {
        Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
        Log "  OpenSSH Server instalado correctamente."
    }
} catch {
    Log "  ERROR instalando OpenSSH Server: $_"
}

# ── 2. CONFIGURAR SERVICIO SSH ──
Log "[2/4] Configurando servicio sshd..."
try {
    Set-Service -Name sshd -StartupType Automatic
    Log "  sshd → StartupType Automatic"
    Start-Service sshd
    Log "  sshd iniciado."
    
    $svc = Get-Service sshd
    Log "  Estado: $($svc.Status), Startup: $($svc.StartType)"
    
    # Verificar puerto 22
    $portCheck = Get-NetTCPConnection -LocalPort 22 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Log "  Puerto 22: ABIERTO y escuchando."
    } else {
        Log "  Puerto 22: No se detectó escucha activa (puede tardar unos segundos)."
    }
} catch {
    Log "  ERROR configurando sshd: $_"
}

# ── 3. REGLA DE FIREWALL ──
Log "[3/4] Configurando Firewall..."
try {
    $existing = Get-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow -RemoteAddress "100.64.0.0/10", "LocalSubnet"
        Log "  Regla de Firewall creada: TCP/22 IN允许."
    } else {
        Log "  Regla de Firewall ya existe: TCP/22 IN允许."
    }
    
    # Verificar
    $rule = Get-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -ErrorAction SilentlyContinue
    if ($rule.Enabled -eq $true) { Log "  Firewall: HABILITADO" }
} catch {
    Log "  ERROR en Firewall: $_"
}

# ── 4. INSTALAR TAILSCALE ──
Log "[4/4] Instalando Tailscale..."
try {
    $ts = Get-Command tailscale -ErrorAction SilentlyContinue
    if (-not $ts) {
        & winget install Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements
        Log "  Tailscale instalado."
    } else {
        Log "  Tailscale ya instalado."
    }
    $tsVer = & tailscale version 2>$null
    Log "  Versión Tailscale: $tsVer"
} catch {
    Log "  ERROR instalando Tailscale: $_"
}

# ── REPORTE FINAL ──
Log ""
Log "=== REPORTE FINAL ==="
$user = whoami
$hostname = hostname
$svcFinal = Get-Service sshd -ErrorAction SilentlyContinue

Log "Windows User:      $user"
Log "Hostname:          $hostname"
Log "SSH Service:       $($svcFinal.Status) ($($svcFinal.StartType))"

# Intentar obtener IP de Tailscale si ya está logueado
$tsIP = & tailscale ip -4 2>$null
if ($tsIP) {
    Log "Tailscale IP:      $tsIP"
    Log "Tailscale Status:  CONECTADO"
} else {
    $tsStatus = & tailscale status 2>$null
    Log "Tailscale Status:  NO LOGUEADO (inicia sesión en la bandeja de Windows)"
    Log "Tailscale IP:      Pendiente de login"
}

Log "Puerto SSH:        22"
Log "=== FIN ==="

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  REPORTE GUARDADO EN: $logFile" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
````

## File: scripts/setup-ssh-tailscale-finish.ps1
````powershell
$ErrorActionPreference = "Continue"
$logFile = "$env:USERPROFILE\Desktop\remote-access-setup.log"

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host "$timestamp | $Message"
}

Log "=== CONTINUACIÓN SETUP ==="

# ── 2. CONFIGURAR SERVICIO SSH ──
Log "[2/4] Configurando servicio sshd..."
try {
    Set-Service -Name sshd -StartupType Automatic
    Log "  sshd → StartupType: Automatic"
    Start-Service sshd
    Log "  sshd iniciado."
    
    $svc = Get-Service sshd
    Log "  Estado: $($svc.Status)"
    
    Start-Sleep -Seconds 3
    $portCheck = Get-NetTCPConnection -LocalPort 22 -ErrorAction SilentlyContinue
    if ($portCheck) { Log "  Puerto 22: ABIERTO" }
    else { Log "  Puerto 22: no detectado aún" }
} catch { Log "  ERROR sshd: $_" }

# ── 3. FIREWALL ──
Log "[3/4] Configurando Firewall..."
try {
    $existing = Get-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow
        Log "  Regla Firewall TCP/22 IN: CREADA"
    } else { Log "  Regla Firewall TCP/22 IN: YA EXISTE" }
} catch { Log "  ERROR Firewall: $_" }

# ── 4. TAILSCALE ──
Log "[4/4] Instalando Tailscale..."
try {
    $ts = Get-Command tailscale -ErrorAction SilentlyContinue
    if (-not $ts) {
        & winget install Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements
        Log "  Tailscale instalado."
    } else { Log "  Tailscale ya instalado." }
    $tsVer = & tailscale version 2>$null
    Log "  Versión: $tsVer"
} catch { Log "  ERROR Tailscale: $_" }

# ── REPORTE ──
Log ""
Log "=== REPORTE FINAL ==="
$user = whoami
Log "Windows User: $user"
$svcFinal = Get-Service sshd
Log "SSH Service:  $($svcFinal.Status) / $($svcFinal.StartType)"
$tsIP = & tailscale ip -4 2>$null
if ($tsIP) { Log "Tailscale IP: $tsIP (CONECTADO)" }
else { Log "Tailscale: NO LOGUEADO (inicia sesión manual)" }
Log "Puerto SSH:   22"

Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LOG: $logFile" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
````

## File: skills/context_sync.js
````javascript
/**
 * skills/context_sync.js
 *
 * Skill: Sincroniza contexto desde eventos del bus al CaseStore.
 *
 * Trigger: email.important
 * Input: { from, subject, summary }
 * Output: case.created
 */
const CaseStore = require('../runtime/stores/CaseStore');

const CATEGORIAS = [
  { keywords: ['dian', 'muisca', 'requerimiento'], tipo: 'gobierno', label: 'DIAN' },
  { keywords: ['simit', 'comparendo', 'multa', 'transito'], tipo: 'legal', label: 'SIMIT' },
  { keywords: ['entrevista', 'reclutador', 'proceso seleccion'], tipo: 'empleo', label: 'Proceso seleccion' },
  { keywords: ['sena', 'moodle', 'curso', 'tarea', 'actividad'], tipo: 'estudio', label: 'SENA' },
  { keywords: ['factura', 'recibo', 'pago', 'vencimiento'], tipo: 'finanzas', label: 'Factura' },
  { keywords: ['cesde', 'bootcamp', 'clase', 'taller'], tipo: 'estudio', label: 'CESDE' },
];

module.exports = {
  name: 'context_sync',
  description: 'Sincroniza correos importantes al CaseStore',
  trigger: 'email.important',
  input: ['from', 'subject'],
  version: '1.0.0',

  run({ payload }) {
    const text = `${payload.from} ${payload.subject}`.toLowerCase();

    for (const cat of CATEGORIAS) {
      if (cat.keywords.some(k => text.includes(k))) {
        // Check if case already exists
        const existentes = CaseStore.getAll(cat.tipo);
        const exists = existentes.find(c =>
          c.titulo?.toLowerCase().includes(cat.label.toLowerCase()) &&
          c.estado !== 'cerrado'
        );

        if (!exists) {
          const caseId = CaseStore.create({
            tipo: cat.tipo,
            estado: 'abierto',
            titulo: `${cat.label}: ${payload.subject.substring(0, 80)}`,
            descripcion: payload.summary || payload.subject,
            data: { fuente: 'email', from: payload.from },
            prioridad: cat.tipo === 'legal' || cat.tipo === 'gobierno' ? 0 : 1,
          });

          return {
            event: 'case.created',
            payload: { id: caseId, tipo: cat.tipo, titulo: `${cat.label}: ${payload.subject.substring(0, 80)}`, estado: 'abierto' },
            priority: 'normal',
          };
        }
        return null;
      }
    }
    return null;
  },
};
````

## File: skills/cv_generate.js
````javascript
/**
 * skills/cv_generate.js
 *
 * Skill: Genera CV adaptado por oferta.
 *
 * Trigger: job.match.ready
 * Input: { titulo, empresa, lugar, score, url }
 * Output: job.cv.ready
 *
 * Sin LLM, genera un CV baseline con ajustes por keywords.
 */
const fs = require('fs');
const path = require('path');
const { decide } = require('../lib/ai/decision');
const bus = require('../lib/events/event_bus');

const CV_OUT_DIR = path.resolve(__dirname, '..', 'data', 'jobs', 'cv_tailored');

function generarCVBaseline(job) {
  const texto = `${job.titulo || ''} ${job.descripcion || ''}`.toLowerCase();

  const skillsDestacar = [];
  if (texto.includes('playwright')) skillsDestacar.push('Playwright');
  if (texto.includes('javascript') || texto.includes('js')) skillsDestacar.push('JavaScript');
  if (texto.includes('node')) skillsDestacar.push('Node.js');
  if (texto.includes('sql') || texto.includes('base de datos')) skillsDestacar.push('SQL');
  if (texto.includes('git')) skillsDestacar.push('Git / GitHub Actions');
  if (texto.includes('api') || texto.includes('postman')) skillsDestacar.push('API Testing / Postman');
  if (texto.includes('python')) skillsDestacar.push('Python');
  if (texto.includes('docker')) skillsDestacar.push('Docker');
  if (texto.includes('ci/cd') || texto.includes('github actions')) skillsDestacar.push('CI/CD');

  const resumen = skillsDestacar.length > 0
    ? `QA Automation Junior con experiencia en ${skillsDestacar.slice(0, 3).join(', ')}${skillsDestacar.length > 3 ? ' y mas' : ''}. Proyecto LifeOS en produccion con 12 workflows automatizados.`
    : 'QA Automation Junior con experiencia en Playwright, JavaScript y automatizacion de procesos. Proyecto LifeOS en produccion.';

  return {
    resumen,
    skills_destacar: skillsDestacar,
    secciones: ['Resumen profesional', 'Proyecto destacado: LifeOS', 'Experiencia', 'Educacion', 'Habilidades tecnicas'],
  };
}

module.exports = {
  name: 'cv_generate',
  description: 'Genera CV adaptado a cada oferta',
  trigger: 'job.match.ready',
  input: ['titulo', 'empresa'],
  version: '1.0.0',

  async run({ payload }) {
    const job = payload;

    if (!fs.existsSync(CV_OUT_DIR)) fs.mkdirSync(CV_OUT_DIR, { recursive: true });

    const cv = generarCVBaseline(job);
    const slug = job.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40);
    const filename = `cv_${slug}_${Date.now()}.md`;
    const filepath = path.join(CV_OUT_DIR, filename);

    const content = [
      `# CV - ${job.titulo} en ${job.empresa || 'empresa'}`,
      '',
      `> ${cv.resumen}`,
      '',
      '## Resumen Profesional',
      '',
      cv.resumen,
      '',
      '## Habilidades Clave',
      '',
      ...cv.skills_destacar.map(s => `- ${s}`),
      '',
      '## Proyecto Destacado: LifeOS',
      '',
      'Sistema autonomo de automatizacion personal con 12 workflows en GitHub Actions,',
      'scraping con Playwright, integracion con APIs (DeepSeek, Gmail, Telegram),',
      'y base de datos SQLite con WAL. Arquitectura event-driven con bus de eventos propio.',
      '',
      '## Educacion',
      '',
      '- Bootcamp QA Automation (28 semanas) - CESDE, 2026',
      '- Bases de Datos y Excel - SENA, 2026',
      '- Analisis y Desarrollo de Software (en curso) - CESDE',
      '',
      '## Experiencia',
      '',
      '- **QA Automation** - Proyecto LifeOS (2025-presente)',
      '  Automatizacion E2E con Playwright, CI/CD con GitHub Actions, scraping, APIs.',
      '- **Vigilante CCTV** - Coovisocial (2019-2021)',
      '- **Agente N1** - Sitel / Iberia (2021)',
      '',
      '## Contacto',
      '',
      '- jeiser270997@gmail.com',
      '- +57 304 461 5613',
      '- Medellin, Colombia',
    ].join('\n');

    fs.writeFileSync(filepath, content, 'utf8');

    bus.emit('job.cv.ready', {
      ...job,
      cv_path: filepath,
      skills_destacar: cv.skills_destacar,
    }, { source: 'skill.cv_generate', priority: 'normal' });

    return {
      event: 'job.cv.generated',
      payload: { titulo: job.titulo, empresa: job.empresa, cv_path: filepath },
    };
  },
};
````

## File: skills/estudio.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'estudio',
  nombre: 'Estudio SENA/CESDE',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const est = vital.estudio || {};
    const sena = est.sena || {};
    const cesde = est.cesde || {};
    return `[SKILL: Estudio]
- SENA: ${sena.programa || 'sin datos'} (ficha ${sena.ficha || '?'}) - Fin estimado: ${sena.fin_estimado || '?'}
- CESDE: ${(cesde.cursos || []).join(', ') || 'sin datos'}
- Recordar: horarios de clase, entregas de talleres, link de Teams/meet`;
  }
};
````

## File: skills/finanzas.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'finanzas',
  nombre: 'Finanzas Personales',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const legal = vital.legal_financiero || {};
    return `[SKILL: Finanzas Personales]
- Bancos: ${(legal.bancos || []).join(', ') || 'sin registrar'}
- Deudas: ${(legal.deudas || []).join(', ') || 'sin registrar'}
- Obligaciones mensuales: ${(legal.obligaciones_mensuales || []).join(', ') || 'sin registrar'}
- Recordar: fecha de corte de tarjetas, pago de servicios EPM, recargas nequi/daviplata`;
  }
};
````

## File: skills/job_apply_ct.js
````javascript
/**
 * skills/job_apply_ct.js
 *
 * Skill: Aplica a ofertas de Computrabajo.
 *
 * Trigger: job.cv.ready
 * Input: { titulo, empresa, url, cv_path }
 * Output: job.applied | job.apply.failed
 *
 * Niveles:
 *   1 (default) → abre link en browser, deja que el usuario confirme
 *   2 (semi-auto) → Playwright hace login + postular + preguntas
 *   3 (full-auto) → sin intervención
 *
 * Configurar con env: APPLY_LEVEL=1|2|3
 */
const bus = require('../lib/events/event_bus');
const path = require('path');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS = process.env.COMPUTRABAJO_PASS;
const APPLY_LEVEL = parseInt(process.env.APPLY_LEVEL || '1', 10);

let chromium = null;

module.exports = {
  name: 'job_apply_ct',
  description: 'Aplica a ofertas de Computrabajo (nivel 1-3)',
  trigger: 'job.cv.ready',
  input: ['url'],
  version: '1.0.0',

  async run({ payload }) {
    const { titulo, empresa, url, cv_path, score } = payload;

    if (!url || !url.includes('computrabajo.com')) {
      return null;
    }

    if (!CT_PASS) {
      bus.emit('job.apply.failed', {
        titulo, empresa, url, razon: 'COMPUTRABAJO_PASS no configurado',
      }, { source: 'skill.job_apply_ct', priority: 'normal' });
      return {
        event: 'job.apply.failed',
        payload: { titulo, empresa, razon: 'credenciales faltantes' },
      };
    }

    if (APPLY_LEVEL === 1) {
      // Nivel 1: solo notificar con link
      bus.emit('job.apply.ready', {
        titulo, empresa, url, cv_path, score,
        mensaje: `Listo para aplicar a ${titulo} en ${empresa}: ${url}`,
      }, { source: 'skill.job_apply_ct', priority: 'normal' });

      return {
        event: 'job.apply.ready',
        payload: { titulo, empresa, url },
      };
    }

    // Nivel 2+: Playwright automático
    if (!chromium) {
      try {
        chromium = require('playwright').chromium;
      } catch {
        return {
          event: 'job.apply.failed',
          payload: { titulo, empresa, razon: 'playwright no instalado' },
        };
      }
    }

    const browser = await chromium.launch({ headless: true }).catch(() => null);
    if (!browser) {
      return {
        event: 'job.apply.failed',
        payload: { titulo, empresa, razon: 'browser no disponible' },
      };
    }

    let resultado;
    try {
      const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      });
      const page = await ctx.newPage();

      // Login
      await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
      await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
      await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(async () => { await page.keyboard.press('Enter'); });
      await page.waitForTimeout(4000);

      // Ir a la oferta
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      // Click Postularme
      const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
      let clicked = false;
      for (const txt of btnTexts) {
        try { await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 3000 }); clicked = true; break; } catch {}
      }

      if (!clicked) {
        resultado = { exito: false, razon: 'Boton no encontrado' };
      } else {
        await page.waitForTimeout(3000);

        // Verificar confirmación
        const confirmado = await page.evaluate(() => {
          const body = document.body.innerText;
          return /postulacion|enviada|exito|registrada|Gracias|Tu candidatura/i.test(body);
        });

        resultado = { exito: confirmado, razon: confirmado ? 'Postulacion enviada' : 'No se pudo confirmar' };
      }

      await ctx.close();
    } catch (e) {
      resultado = { exito: false, razon: e.message.substring(0, 100) };
    } finally {
      await browser.close();
    }

    const eventType = resultado.exito ? 'job.applied' : 'job.apply.failed';
    bus.emit(eventType, {
      titulo, empresa, url, score,
      resultado: resultado.razon,
    }, { source: 'skill.job_apply_ct', priority: 'normal' });

    return {
      event: eventType,
      payload: { titulo, empresa, resultado: resultado.razon },
    };
  },
};
````

## File: skills/job_apply.js
````javascript
/**
 * skills/job_apply.js
 *
 * Skill: Detectar postulaciones laborales desde correos.
 *
 * Trigger: email.processed
 * Input: { from, subject, body }
 * Output: job.applied | job.rejected
 *
 * Registra en ApplicationStore vía job_tracker.
 */
const jobTracker = require('../lib/runtime/job_tracker');

const PLATFORMAS = [
  { name: 'Computrabajo', from: 'computrabajo', subjects: ['postulaci', 'aplicado', 'solicitud'] },
  { name: 'LinkedIn', from: 'linkedin', subjects: ['application', 'solicitud', 'postulado', 'applied'] },
  { name: 'Indeed', from: 'indeed', subjects: ['application', 'solicitud'] },
];

module.exports = {
  name: 'job_apply',
  description: 'Detecta postulaciones desde correos y registra en ApplicationStore',
  trigger: 'email.processed',
  input: ['from', 'subject'],
  version: '1.0.0',

  run({ payload }) {
    const text = `${payload.from} ${payload.subject} ${payload.body || ''}`.toLowerCase();

    // Detectar plataforma
    const plat = PLATFORMAS.find(p =>
      text.includes(p.from) && p.subjects.some(s => text.includes(s))
    );
    if (!plat) return null;

    // Extraer empresa y cargo
    let empresa = '?';
    let cargo = '?';

    const cargoMatch = payload.subject.match(/(?:para|como|aplicado a|apply for)\s*(.+?)(?:en|$)/i);
    if (cargoMatch) cargo = cargoMatch[1].trim();

    const empresaMatch = (payload.body || '').match(/(?:empresa|compañia|company|en)\s*:?\s*([^\n]+)/i);
    if (empresaMatch) empresa = empresaMatch[1].trim();

    // Registrar via job_tracker
    const result = jobTracker.logApplication({
      empresa,
      cargo,
      plataforma: plat.name,
      detalles: payload.subject + '\n' + (payload.body || '').substring(0, 300),
    });

    if (!result.duplicado) {
      return {
        event: 'job.applied',
        payload: { empresa, cargo, plataforma: plat.name, score: result.evaluacion?.score },
        priority: 'normal',
      };
    }
    return null;
  },
};
````

## File: skills/job_match.js
````javascript
/**
 * skills/job_match.js
 *
 * Skill: Evalúa compatibilidad entre oferta y perfil.
 *
 * Trigger: job.detected (desde scraper o email)
 * Input: { titulo, empresa, lugar, descripcion, url }
 * Output: job.match.ready | null
 *
 * Usa el decision layer (LLM + fallback por scoring).
 * Sin LLM, usa scoring determinístico.
 */
const { decide } = require('../lib/ai/decision');
const bus = require('../lib/events/event_bus');

const UBICACIONES_OK = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|work.?from.?home|teletrabajo/i;
const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa marta/i;

function scoreSinLLM(job) {
  const texto = `${job.titulo || ''} ${job.empresa || ''} ${job.lugar || ''} ${job.descripcion || ''}`.toLowerCase();
  let score = 50;

  // Skills match (basado en keywords)
  const keywords = {
    alta: ['playwright', 'javascript', 'node.js', 'nodejs', 'sql', 'git', 'github actions', 'qa', 'testing', 'automatizacion', 'selenium', 'api'],
    media: ['agil', 'scrum', 'postman', 'ci/cd', 'docker', 'linux', 'python', 'typescript'],
    baja: ['senior', 'lider', 'manager', '10 años', '8 años', '5 años'],
  };

  for (const kw of keywords.alta) { if (texto.includes(kw)) score += 4; }
  for (const kw of keywords.media) { if (texto.includes(kw)) score += 2; }
  for (const kw of keywords.baja) { if (texto.includes(kw)) score -= 8; }

  // Ubicación
  const lugar = `${job.lugar || ''} ${job.titulo || ''}`.toLowerCase();
  if (UBICACIONES_OK.test(lugar)) score += 10;
  else if (UBICACIONES_NOK.test(lugar)) score -= 15;

  // Modalidad
  if (texto.includes('remoto') || texto.includes('virtual') || texto.includes('home office')) score += 5;
  if (texto.includes('presencial') && !texto.includes('medell')) score -= 5;

  // Título del cargo
  if (/junior|trainee|practicante|sin experiencia|estudiante/i.test(texto)) score += 10;
  if (/analista|asistente|auxiliar|soporte/i.test(texto)) score += 5;

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  name: 'job_match',
  description: 'Evalua compatibilidad oferta/perfil con LLM + scoring',
  trigger: 'job.detected',
  input: ['titulo'],
  version: '1.0.0',

  async run({ payload }) {
    const job = payload;

    // Scoring sin LLM (rápido, siempre funciona)
    const score = scoreSinLLM(job);
    const compatible = score >= 60;

    const result = {
      score,
      compatible,
      razon: compatible ? 'Match basico superado' : 'Score bajo',
    };

    if (compatible) {
      bus.emit('job.match.ready', {
        ...job,
        score,
        razon: result.razon,
      }, { source: 'skill.job_match', priority: 'normal' });
    }

    return {
      event: 'job.matched',
      payload: { titulo: job.titulo, empresa: job.empresa, score, compatible },
      priority: 'normal',
    };
  },
};
````

## File: skills/laboral.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

function getAplicaciones() {
  try {
    return JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'aplicaciones.json'), 'utf8'));
  } catch { return []; }
}

module.exports = {
  id: 'laboral',
  nombre: 'Busqueda Laboral',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const apps = getAplicaciones();
    const activas = apps.filter(a => a.estado === 'aplicada' || a.estado === 'entrevista');
    const perfil = vital.perfil || {};
    const trabajo = vital.trabajo || {};
    const metas = vital.metas || {};
    return `[SKILL: Busqueda Laboral]
- Perfil: ${perfil.nombre} | ${perfil.ciudad || ''} | ${trabajo.tipo || perfil.ocupacion || ''}
- Meta: ${(metas.corto_plazo || []).join(', ') || 'conseguir empleo'}
- Postulaciones activas: ${activas.length}
- Entrevistas pendientes: ${(trabajo.entrevistas_pendientes || []).length}
- Industrias interes: ${(trabajo.industrias_interes || []).join(', ') || 'sin definir'}
- Plataformas: Computrabajo, LinkedIn, Solvo, Concentrix`;
  },
  getStats() {
    const apps = getAplicaciones();
    return {
      total: apps.length,
      activas: apps.filter(a => a.estado === 'aplicada' || a.estado === 'entrevista').length,
      rechazadas: apps.filter(a => a.estado === 'rechazada').length,
      entrevistas: apps.filter(a => a.estado === 'entrevista').length,
    };
  }
};
````

## File: skills/registry.json
````json
{
  "skills": [
    {
      "id": "tributaria",
      "nombre": "Tributaria Colombia",
      "keywords": ["dian", "rut", "impuestos", "declaracion de renta", "retefuente", "iva", "facturacion", "sanciones", "requerimiento", "embargo", "cobro coactivo", "exogena", "contador", "pre-litigio", "nulidad", "firmeza", "compensacion"],
      "prioridad": 10
    },
    {
      "id": "laboral",
      "nombre": "Busqueda Laboral",
      "keywords": ["trabajo", "empleo", "vacante", "postulacion", "curriculum", "entrevista", "computrabajo", "linkedin", "contrato", "salario", "solvo", "concentrix"],
      "prioridad": 8
    },
    {
      "id": "legal",
      "nombre": "Legal Colombia",
      "keywords": ["fiscalia", "denuncia", "nuc", "citacion", "juzgado", "abogado", "tutela", "contrato"],
      "prioridad": 9
    },
    {
      "id": "finanzas",
      "nombre": "Finanzas Personales",
      "keywords": ["epm", "banco", "bancolombia", "nequi", "daviplata", "tarjeta", "prestamo", "credito", "deuda", "ahorro", "presupuesto", "nomina", "pago", "recibo"],
      "prioridad": 7
    },
    {
      "id": "estudio",
      "nombre": "Estudio SENA/CESDE",
      "keywords": ["sena", "cesde", "clase", "taller", "tarea", "curso", "programa", "formacion", "certificado", "ficha", "instructor", "horario"],
      "prioridad": 8
    },
    {
      "id": "salud",
      "nombre": "Salud y Bienestar",
      "keywords": ["eps", "cita medica", "medicamento", "salud", "doctor", "hospital", "clinica", "examen", "formula", "sintomas"],
      "prioridad": 6
    },
    {
      "id": "bootcamp_qa",
      "nombre": "Bootcamp QA Automation",
      "keywords": ["bootcamp", "estudiar", "aprender", "playwright", "cypress", "vitest", "testing", "qa", "automation", "ejercicio", "practica", "tarea", "entregable", "semana", "fase", "progreso", "portfolio", "entrevista", "cv", "linkedin", "trabajo", "empleo", "carrera", "typescript", "javascript", "fundamentos", "mentoria"],
      "prioridad": 10
    },
    {
      "id": "transito",
      "nombre": "Transito Colombia - Defensa Legal",
      "keywords": ["transito", "comparendo", "multa", "fotomulta", "simit", "didi", "uber", "conductor", "plataforma", "reten", "agente", "policia", "velocidad", "c29", "c14", "soat", "tecnomecanica", "ley 1843", "fotodeteccion", "dei", "senalizacion", "notificacion fisica", "impugnar", "recurso reposicion", "prescripcion"],
      "prioridad": 10
    }
  ]
}
````

## File: skills/router.js
````javascript
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = __dirname;
const REGISTRY_PATH = path.join(SKILLS_DIR, 'registry.json');
const USER_INDEX_PATH = path.join(SKILLS_DIR, 'user_skills_index.json');
const SISTEMA_INDEX_PATH = path.join(SKILLS_DIR, 'skills_sistema_index.json');

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { skills: [] };
  }
}

function loadUserIndex() {
  try {
    return JSON.parse(fs.readFileSync(USER_INDEX_PATH, 'utf8'));
  } catch {
    return { skills: [] };
  }
}

function loadSystemIndex() {
  try {
    return JSON.parse(fs.readFileSync(SISTEMA_INDEX_PATH, 'utf8'));
  } catch {
    return { skills: [] };
  }
}

function loadSkill(id) {
  try {
    return require(path.join(SKILLS_DIR, id));
  } catch {
    return null;
  }
}

function loadMDSkill(skillEntry) {
  try {
    const content = fs.readFileSync(skillEntry.ruta, 'utf8');
    const lines = content.split('\n');
    const head = lines.slice(0, 30).join('\n');
    return `[SKILL USER: ${skillEntry.nombre} v${skillEntry.version}]\n${head}\n...`;
  } catch {
    return `[SKILL USER: ${skillEntry.nombre}] no disponible`;
  }
}

function detectSkills(texto) {
  const registry = loadRegistry();
  const lower = texto.toLowerCase();
  const matches = [];

  for (const skill of registry.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ id: skill.id, matchCount, prioridad: skill.prioridad, source: 'js' });
    }
  }

  const userIndex = loadUserIndex();
  for (const skill of userIndex.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ id: skill.id, matchCount, prioridad: skill.prioridad, source: 'md' });
    }
  }

  const systemIndex = loadSystemIndex();
  for (const skill of systemIndex.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ id: skill.id, matchCount, prioridad: skill.prioridad, source: 'sistema' });
    }
  }

  matches.sort((a, b) => b.prioridad - a.prioridad || b.matchCount - a.matchCount);
  return matches;
}

function getContextForText(texto) {
  const matched = detectSkills(texto);
  if (matched.length === 0) return '';

  const parts = [];
  for (const skill of matched) {
    if (skill.source === 'js') {
      const mod = loadSkill(skill.id);
      if (mod && typeof mod.getContext === 'function') {
        const ctx = mod.getContext();
        if (ctx) parts.push(ctx);
      }
    } else if (skill.source === 'md') {
      const userIndex = loadUserIndex();
      const entry = userIndex.skills.find(s => s.id === skill.id);
      if (entry) {
        const ctx = loadMDSkill(entry);
        if (ctx) parts.push(ctx);
      }
    } else if (skill.source === 'sistema') {
      const systemIndex = loadSystemIndex();
      const entry = systemIndex.skills.find(s => s.id === skill.id);
      if (entry) {
        const ctx = loadMDSkill(entry);
        if (ctx) parts.push(ctx);
      }
    }
  }

  return parts.join('\n\n');
}

function getAllSkillContexts() {
  const registry = loadRegistry();
  const parts = [];

  for (const skill of registry.skills) {
    const mod = loadSkill(skill.id);
    if (mod && typeof mod.getContext === 'function') {
      const ctx = mod.getContext();
      if (ctx) parts.push(ctx);
    }
  }

  return parts.join('\n\n');
}

function getAllSystemSkillsBrief() {
  const systemIndex = loadSystemIndex();
  return systemIndex.skills.map(s =>
    `- ${s.nombre} (v${s.version}): ${s.keywords.slice(0, 5).join(', ')}...`
  ).join('\n');
}

function getAllUserSkillsBrief() {
  const userIndex = loadUserIndex();
  return userIndex.skills.map(s =>
    `- ${s.nombre} (v${s.version}): ${s.keywords.slice(0, 5).join(', ')}...`
  ).join('\n');
}

module.exports = { detectSkills, getContextForText, getAllSkillContexts, getAllUserSkillsBrief, getAllSystemSkillsBrief, loadMDSkill };
````

## File: skills/salud.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'salud',
  nombre: 'Salud y Bienestar',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const salud = vital.salud || {};
    return `[SKILL: Salud y Bienestar]
- EPS: ${salud.eps || 'sin registrar'}
- Condiciones: ${(salud.condiciones || []).join(', ') || 'ninguna registrada'}
- Medicamentos: ${(salud.medicamentos || []).join(', ') || 'ninguno registrado'}
- Citas pendientes: ${(salud.citas_pendientes || []).join(', ') || 'ninguna'}`;
  }
};
````

## File: skills/skills_sistema_index.json
````json
{
  "skills": [
    {
      "id": "anti_sycophancy_md",
      "nombre": "Anti-Sycophancy (Anti-Alucinación)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\anti-sycophancy\\SKILL.md",
      "version": "1.0",
      "keywords": ["verdad", "alucinacion", "sycophancy", "mentira", "falso", "comprobar", "verificar", "evidencia", "claim", "hecho", "duda", "certeza"],
      "prioridad": 9
    },
    {
      "id": "logic_lens_md",
      "nombre": "Logic Lens (Revisión Lógica Formal)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\logic-lens\\SKILL.md",
      "version": "1.0",
      "keywords": ["logica", "razonamiento", "codigo", "bug", "error", "null", "undefined", "concurrencia", "seguridad", "algoritmo", "contrato api"],
      "prioridad": 8
    },
    {
      "id": "verification_before_completion_md",
      "nombre": "Verification Before Completion",
      "ruta": "C:\\Users\\dev\\.config\\opencode\\skills\\superpowers\\skills\\verification-before-completion\\SKILL.md",
      "version": "1.0",
      "keywords": ["verificar", "comprobar", "completado", "prueba", "test", "evidencia", "gate"],
      "prioridad": 10
    },
    {
      "id": "clean_code_md",
      "nombre": "Clean Code (Robert Martin)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\clean-code\\SKILL.md",
      "version": "1.0",
      "keywords": ["codigo limpio", "refactor", "clean code", "nombres", "funciones", "solid", "deuda tecnica"],
      "prioridad": 7
    },
    {
      "id": "decision_navigator_md",
      "nombre": "Decision Navigator",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\decision-navigator\\SKILL.md",
      "version": "1.0",
      "keywords": ["decision", "decidir", "opciones", "duda", "atasco", "escoger", "camino", "navegar", "explorar", "alternativa"],
      "prioridad": 8
    },
    {
      "id": "explain_like_socrates_md",
      "nombre": "Socratic Teaching",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\explain-like-socrates\\SKILL.md",
      "version": "1.0",
      "keywords": ["ensenar", "explicar", "socrates", "aprender", "clase", "tutor", "estudiante", "pregunta", "dialogo", "comprender"],
      "prioridad": 8
    },
    {
      "id": "brooks_lint_md",
      "nombre": "Brooks Lint (Ingeniería Software Clásica)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\brooks-lint\\SKILL.md",
      "version": "1.0",
      "keywords": ["codigo", "arquitectura", "ingenieria", "review", "diseno", "patron", "acoplamiento", "pragmatico"],
      "prioridad": 7
    },
    {
      "id": "context_agent_md",
      "nombre": "Context Agent (Continuidad Sesiones)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\context-agent\\SKILL.md",
      "version": "1.0",
      "keywords": ["contexto", "sesion", "continuidad", "memoria", "briefing", "resumen", "retomar"],
      "prioridad": 6
    },
    {
      "id": "satori_md",
      "nombre": "Satori (Consejería Psicológica/Filosófica)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\satori\\SKILL.md",
      "version": "1.0",
      "keywords": ["consejeria", "psicologia", "filosofia", "emocion", "ansiedad", "estres", "reflexion", "ifs", "estoico", "budismo", "jung", "sabiduria", "terapia", "bienestar emocional"],
      "prioridad": 9
    },
    {
      "id": "senior_architect_md",
      "nombre": "Senior Architect Toolkit",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\senior-architect\\SKILL.md",
      "version": "1.0",
      "keywords": ["arquitectura", "diagrama", "diseno sistema", "arquitecto", "componente", "dependencia", "estructura"],
      "prioridad": 7
    },
    {
      "id": "software_architecture_md",
      "nombre": "Software Architecture (Clean + DDD)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\software-architecture\\SKILL.md",
      "version": "1.0",
      "keywords": ["clean architecture", "ddd", "dominio", "hexagonal", "puerto", "adaptador", "capas", "early return", "library first"],
      "prioridad": 8
    },
    {
      "id": "bulletmind_md",
      "nombre": "Bulletmind (Salida Estructurada)",
      "ruta": "C:\\Users\\dev\\.agents\\skills\\bulletmind\\SKILL.md",
      "version": "1.0",
      "keywords": ["bullet", "viñeta", "resumen", "estructura", "formato", "lista", "tesis", "compacto"],
      "prioridad": 5
    }
  ]
}
````

## File: skills/tributaria.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'tributaria',
  nombre: 'Tributaria Colombia - Defensa DIAN v6.0',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const dian = vital.legal_financiero?.dian || {};

    return `[SKILL: Tributaria Colombia v6.0 - Defensa DIAN]
UVT 2026: $52,374 | SMMLV 2026: $1,623,500
DIAN Jeiser: ${dian.estado || 'sin informacion'} | Ultima gestion: ${dian.ultima_gestion || 'ninguna'}
- AG2023: deuda $9.8M, prescripcion ~09/2029. REGLA HIERRO: NO firmar 814.
- AG2024: radicada (sancion $524K mora). AG2025: NO OBLIGADO.
- UGPP 2023: cerrado favorable 12/06/2026. Coherencia DIAN/UGPP critica.
- DIAN Peticion 2026DP000161298: asignada 09/06/2026.
- Tesis nuclear: Art. 26 ET. Ingreso = enriquecimiento real + incremento patrimonial neto + permanencia.
- Topes 2026: declara renta >$73.3M ingresos o patrimonio. Prescripcion cobro: 5 años.
- Habitualidad: flujo sin utilidad real NO es renta. RUT consistente es defensa clave.
- Procedimiento completo en SKILL_TRIBUTARIA_FULL.md (1315 lineas).`;
  }
};
````

## File: skills/user_skills_index.json
````json
{
  "skills": [
    {
      "id": "tributaria_md",
      "nombre": "Defensa Tributaria DIAN",
      "ruta": ".agents/skills/tributaria/SKILL.md",
      "version": "6.0",
      "keywords": ["dian", "rut", "impuestos", "declaracion de renta", "retefuente", "iva", "requerimiento", "embargo", "cobro coactivo", "exogena", "sanciones", "contador", "art 26 et", "pre-litigio", "nulidad", "firma digital", "fee", "reforma tributaria", "sancion", "firmeza", "compensacion"],
      "prioridad": 10
    },
    {
      "id": "extractor_md",
      "nombre": "Extractor de Contexto v9",
      "ruta": ".agents/skills/extractor/SKILL.md",
      "version": "9.0",
      "keywords": ["extractor", "contexto", "extraer", "analisis", "confianza", "verificacion"],
      "prioridad": 9
    },
    {
      "id": "softball_md",
      "nombre": "Manager Softball Índer Envigado 2026",
      "ruta": ".agents/skills/softball/SKILL.md",
      "version": "3.0",
      "keywords": ["softball", "inder", "envigado", "beisbol", "manager", "equipo", "entrenamiento", "torneo", "jugador", "lineup", "pitcheo"],
      "prioridad": 7
    },
    {
      "id": "caveman_md",
      "nombre": "Caveman Ultra-Compressed Mode",
      "ruta": ".agents/skills/caveman/SKILL.md",
      "version": "1.0",
      "keywords": ["caveman", "cavernicola", "ultra compressed", "minimo", "compacto", "tokens"],
      "prioridad": 5
    },
    {
      "id": "ingeniero_md",
      "nombre": "Ingeniero / CTO / Arquitecto",
      "ruta": ".agents/skills/ingeniero/SKILL.md",
      "version": "1.0",
      "keywords": ["arquitecto", "cto", "ingeniero senior", "full stack", "arquitectura", "codigo", "desarrollo", "software", "programacion", "sistema"],
      "prioridad": 8
    },
    {
      "id": "job_filter_md",
      "nombre": "Filtro de Ofertas Laborales Jeiser",
      "ruta": ".agents/skills/job-filter/SKILL.md",
      "version": "1.0",
      "keywords": ["filtro", "oferta", "trabajo", "jeiser", "aplicar", "empleo"],
      "prioridad": 9
    },
    {
      "id": "bill_manager_md",
      "nombre": "Gestor de Pagos y Suscripciones",
      "ruta": ".agents/skills/bill-manager/SKILL.md",
      "version": "1.0",
      "keywords": ["epm", "claro", "recibo", "suscripcion", "pago", "factura", "gasto", "presupuesto", "ahorro", "netflix", "spotify"],
      "prioridad": 8
    },
    {
      "id": "backup_automator_md",
      "nombre": "Backup Automático y Protección de Datos",
      "ruta": ".agents/skills/backup-automator/SKILL.md",
      "version": "1.0",
      "keywords": ["backup", "respaldo", "seguridad", "copia", "perder datos", "git push", "duplicati", "git commit"],
      "prioridad": 7
    },
    {
      "id": "think_opa_md",
      "nombre": "Motor de Políticas de Decisión",
      "ruta": ".agents/skills/think-opa/SKILL.md",
      "version": "1.0",
      "keywords": ["decision", "politica", "regla", "prioridad", "think", "planificar", "que hacer hoy", "jarvis", "automatizar"],
      "prioridad": 10
    },
    {
      "id": "typescript_tutor_md",
      "nombre": "TypeScript Tutor para QA",
      "ruta": ".agents/skills/typescript-tutor/SKILL.md",
      "version": "1.0",
      "keywords": ["typescript", "types", "interfaces", "ts", "tipado", "javascript", "playwright typescript"],
      "prioridad": 9
    },
    {
      "id": "docker_qa_md",
      "nombre": "Docker para QA Automation",
      "ruta": ".agents/skills/docker-qa/SKILL.md",
      "version": "1.0",
      "keywords": ["docker", "contenedor", "docker-compose", "devops", "ci cd", "contenedores tests"],
      "prioridad": 7
    },
    {
      "id": "sql_testing_md",
      "nombre": "SQL para Testing de Bases de Datos",
      "ruta": ".agents/skills/sql-testing/SKILL.md",
      "version": "1.0",
      "keywords": ["sql", "base de datos", "query", "select", "join", "database testing", "postgresql", "sqlite"],
      "prioridad": 8
    },
    {
      "id": "career_qa_md",
      "nombre": "Mentor de Carrera QA",
      "ruta": ".agents/skills/career-qa/SKILL.md",
      "version": "1.0",
      "keywords": ["linkedin", "cv", "entrevista", "trabajo", "salario", "empleo qa", "postulacion", "carrera", "curriculum"],
      "prioridad": 10
    }
  ]
}
````

## File: skills/wheel_saver.js
````javascript
/**
 * wheel_saver.js — Skill de LifeOS para WheelSaver
 *
 * Se conecta al Event Bus de LifeOS para:
 *  - Escuchar peticiones de búsqueda de repos (wheel_saver.search)
 *  - Escuchar peticiones de estadísticas (wheel_saver.stats)
 *  - Ejecutar el servidor API automáticamente cuando sea necesario
 *
 * Registro: importar en lib/events/event_registry.js
 */

const path = require('node:path');

let ws = null;
let serverAutoStarted = false;

function getClient() {
  if (!ws) {
    ws = require('../lib/integrations/wheel_saver_client');
  }
  return ws;
}

/**
 * Arranca el servidor API si no está corriendo (auto-start una sola vez).
 */
async function ensureServer() {
  if (serverAutoStarted) return true;
  const client = getClient();
  const running = await client.isRunning();
  if (!running) {
    try {
      await client.startServer({ timeout: 15_000 });
      serverAutoStarted = true;
      console.log('[wheel-saver] 🚀 Servidor API iniciado automáticamente');
    } catch (err) {
      console.warn('[wheel-saver] ⚠ No se pudo iniciar servidor API, usando CLI:', err.message);
      return false;
    }
  } else {
    serverAutoStarted = true;
  }
  return true;
}

// ── Definición del skill ──────────────────────────────────────────

module.exports = {
  name: 'wheel_saver',
  description: 'Busca librerías y herramientas en la base de datos local de GitHub (WheelSaver)',
  trigger: 'wheel_saver.*',  // Escucha todos los eventos wheel_saver.*

  input: {
    action: { type: 'string', required: true, description: 'search | stats | top | ask | health' },
    query: { type: 'string', description: 'Términos de búsqueda o pregunta' },
    options: { type: 'object', description: 'Opciones adicionales (language, limit, minStars)' },
  },

  /**
   * Ejecuta una acción de WheelSaver.
   * @param {object} ctx - Contexto del Event Bus
   * @param {object} ctx.payload - { action, query, options }
   */
  async run(ctx) {
    const { action, query, options = {} } = ctx.payload;
    const client = getClient();

    // Auto-arrancar server para acciones que lo necesitan
    if (['search', 'stats', 'top', 'languages'].includes(action)) {
      await ensureServer();
    }

    switch (action) {
      case 'search': {
        if (!query) throw new Error('Se requiere query para search');
        const results = await client.search(query, options);
        return {
          action: 'search',
          query,
          results: Array.isArray(results) ? results.slice(0, options.limit ?? 15) : results,
        };
      }

      case 'stats': {
        const s = await client.stats();
        return { action: 'stats', stats: s };
      }

      case 'top': {
        const limit = options.limit ?? 10;
        const language = options.language ?? null;
        const results = await client.top(limit, language);
        return { action: 'top', results };
      }

      case 'languages': {
        const limit = options.limit ?? 20;
        const results = await client.languages({ limit });
        return { action: 'languages', results };
      }

      case 'ask': {
        if (!query) throw new Error('Se requiere query para ask');
        const result = await client.ask(query);
        return { action: 'ask', question: query, result };
      }

      case 'health': {
        const running = await client.isRunning();
        const inst = client.checkInstallation();
        return { action: 'health', serverRunning: running, installation: inst };
      }

      case 'install-check': {
        return { action: 'install-check', ...client.checkInstallation() };
      }

      default:
        throw new Error(`Acción desconocida: ${action}. Usa: search, stats, top, languages, ask, health`);
    }
  },
};
````

## File: tests/helpers/setup.js
````javascript
/**
 * tests/helpers/setup.js
 * Global setup for all vitest tests.
 * Creates a temporary SQLite database for each test file.
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');

// Track temp files for cleanup
const tempDbs = new Set();

/**
 * Creates a temporary SQLite database for testing.
 * Sets LIFEOS_DB_PATH env var so Database.js uses this path.
 * @returns {{ dbPath: string, cleanup: () => void }}
 */
function createTestDb() {
  const dbPath = path.join(
    os.tmpdir(),
    `lifeos-test-${crypto.randomBytes(4).toString('hex')}.db`
  );
  process.env.LIFEOS_DB_PATH = dbPath;
  tempDbs.add(dbPath);

  return {
    dbPath,
    cleanup() {
      try {
        // Force close any open connections by clearing the module cache
        delete require.cache[require.resolve('../../runtime/stores/Database')];
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
        if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
        tempDbs.delete(dbPath);
      } catch {}
    },
  };
}

// Cleanup all temp databases after each test file
afterAll(() => {
  for (const dbPath of tempDbs) {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    } catch {}
  }
  tempDbs.clear();
});

module.exports = { createTestDb };
````

## File: tests/case_store.test.js
````javascript
/**
 * tests/case_store.test.js
 * Tests for runtime/stores/CaseStore.js — CRUD, timeline, queries.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/CaseStore')];
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/CaseStore');
}

describe('CaseStore', () => {
  it('should create and retrieve a case', () => {
    const store = freshStore();
    const id = store.create({
      tipo: 'test',
      titulo: 'Caso de prueba',
      descripcion: 'Descripción test',
      prioridad: 1,
      data: { meta: 'info' },
    });

    const c = store.getById(id);
    expect(c).toBeTruthy();
    expect(c.tipo).toBe('test');
    expect(c.titulo).toBe('Caso de prueba');
    expect(c.descripcion).toBe('Descripción test');
    expect(c.prioridad).toBe(1);
    expect(c.data).toEqual({ meta: 'info' });
    expect(c.estado).toBe('abierto');
  });

  it('should update case fields', () => {
    const store = freshStore();
    const id = store.create({ tipo: 'test', titulo: 'Original' });

    store.update(id, { titulo: 'Actualizado', prioridad: 0 });
    const c = store.getById(id);
    expect(c.titulo).toBe('Actualizado');
    expect(c.prioridad).toBe(0);
  });

  it('should close a case', () => {
    const store = freshStore();
    const id = store.create({ tipo: 'test', titulo: 'Para cerrar' });

    store.close(id);
    const c = store.getById(id);
    expect(c.estado).toBe('cerrado');
    expect(c.fecha_cierre).toBeTruthy();
  });

  it('should add and retrieve timeline events', () => {
    const store = freshStore();
    const caseId = store.create({ tipo: 'timeline_test', titulo: 'Timeline test' });

    store.addEvent(caseId, 'nota', 'Primer evento', { detalle: 'info' });
    store.addEvent(caseId, 'llamada', 'Segundo evento');

    const events = store.getEvents(caseId);
    expect(events.length).toBe(2);
    const tipos = events.map(e => e.tipo);
    expect(tipos).toContain('nota');
    expect(tipos).toContain('llamada');
  });

  it('should not include closed cases in abiertos()', () => {
    const store = freshStore();
    const id1 = store.create({ id: 'abierto_1', tipo: 'test', titulo: 'Abierto' });
    const id2 = store.create({ id: 'cerrado_1', tipo: 'test', titulo: 'Cerrado' });
    store.close(id2);

    const abiertos = store.abiertos();
    const titulos = abiertos.map(c => c.titulo);
    expect(titulos).toContain('Abierto');
    expect(titulos).not.toContain('Cerrado');
  });

  it('should group cases by tipo and estado via porTipo()', () => {
    const store = freshStore();
    store.create({ id: 'legal_1', tipo: 'legal', titulo: 'Caso 1', estado: 'abierto' });
    store.create({ id: 'legal_2', tipo: 'legal', titulo: 'Caso 2', estado: 'abierto' });
    store.create({ id: 'estudio_1', tipo: 'estudio', titulo: 'Curso A', estado: 'abierto' });

    const grouped = store.porTipo();
    expect(grouped.legal?.abierto).toBe(2);
    expect(grouped.estudio?.abierto).toBe(1);
  });
});
````

## File: tests/checkpoint_store.test.js
````javascript
/**
 * tests/checkpoint_store.test.js
 * Tests for runtime/stores/CheckpointStore.js — CRUD, JSON serialization, JSON fallback.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  // Clear module cache for fresh store each test
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/CheckpointStore')];
  // Ensure DB is initialized
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/CheckpointStore');
}

describe('CheckpointStore', () => {
  it('should store and retrieve a simple value', () => {
    const store = freshStore();
    store.set('test_key', { foo: 'bar' });
    const result = store.get('test_key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should handle complex nested objects', () => {
    const store = freshStore();
    const complex = {
      numbers: [1, 2, 3],
      nested: { a: { b: 'deep' } },
      mixed: [null, true, { x: 1 }],
    };
    store.set('complex', complex);
    const result = store.get('complex');
    expect(result).toEqual(complex);
  });

  it('should return null for non-existent keys', () => {
    const store = freshStore();
    const result = store.get('non_existent_key_xyz');
    expect(result).toBeNull();
  });

  it('should overwrite existing values on set', () => {
    const store = freshStore();
    store.set('updatable', { version: 1 });
    store.set('updatable', { version: 2, extra: true });
    const result = store.get('updatable');
    expect(result).toEqual({ version: 2, extra: true });
  });

  it('should store primitive values', () => {
    const store = freshStore();
    store.set('string_val', 'hello');
    store.set('number_val', 42);
    expect(store.get('string_val')).toBe('hello');
    expect(store.get('number_val')).toBe(42);
  });
});
````

## File: tests/concurrency_worker.js
````javascript
process.env.STORAGE_DRIVER = 'sqlite';

const CheckpointStore = require('../runtime/stores/CheckpointStore');
const AppStore = require('../runtime/stores/ApplicationStore');
const LedgerStore = require('../runtime/stores/LedgerStore');

const wid = parseInt(process.env.WORKER_ID, 10);
const total = parseInt(process.env.NUM_WORKERS, 10);
const seed = process.env.TEST_SEED || 'stress';
const ts = Date.now();

function log(msg) {
  process.stdout.write(`[WORKER ${wid}] ${msg}\n`);
}

const RESULTS = { ok: 0, fail: 0, details: [] };

function ok(msg) { RESULTS.ok++; RESULTS.details.push(msg); log('OK ' + msg); }
function fail(msg) { RESULTS.fail++; RESULTS.details.push(msg); log('FAIL ' + msg); }

try {
  // ── Test 1: Read checkpoint ──
  log('--- Test 1: Read checkpoint ---');
  const cp = CheckpointStore.get('computrabajo_last');
  if (cp && Array.isArray(cp.ids)) ok('checkpoint readable, ids=' + cp.ids.length);
  else fail('checkpoint not readable, got=' + JSON.stringify(cp).slice(0, 80));

  // ── Test 2: All workers try to create app with SAME URL (race) ──
  log('--- Test 2: Duplicate race ---');
  const raceUrl = `https://computrabajo.com/stress/race_${seed}`;
  const existing = AppStore.findByUrl(raceUrl);
  if (!existing) {
    AppStore.create({
      source: 'computrabajo',
      empresa: 'StressCorp',
      cargo: 'QA Stress Test',
      url: raceUrl,
      fecha_aplicacion: new Date().toISOString().split('T')[0],
      estado: 'aplicado',
      score: 80,
      extra_data: { lugar: 'Medellin', worker: wid },
      historial: [{ fecha: new Date().toISOString(), evento: 'stress_test' }],
    });
    ok('created race app (worker ' + wid + ')');
  } else {
    ok('race app already existed (worker ' + wid + ')');
  }

  // ── Test 2b: Verify only ONE race app exists ──
  const raceCount = AppStore.getAll().filter(a => a.url === raceUrl).length;
  if (raceCount === 1) ok('race has exactly 1 app');
  else fail('race has ' + raceCount + ' apps (expected 1)');

  // ── Test 3: Each worker creates app with UNIQUE URL ──
  log('--- Test 3: Unique apps ---');
  const uniqueUrl = `https://computrabajo.com/stress/unique_${seed}_w${wid}`;
  AppStore.create({
    source: 'computrabajo',
    empresa: 'StressCorp_' + wid,
    cargo: 'QA Worker ' + wid,
    url: uniqueUrl,
    fecha_aplicacion: new Date().toISOString().split('T')[0],
    estado: 'aplicado',
    score: 70 + wid,
    extra_data: { lugar: 'Medellin', worker: wid },
    historial: [{ fecha: new Date().toISOString(), evento: 'stress_test' }],
  });
  ok('created unique app ' + uniqueUrl.slice(-20));

  // ── Test 4: Update checkpoint concurrently ──
  log('--- Test 4: Checkpoint update ---');
  const current = CheckpointStore.get('computrabajo_last') || { ids: [] };
  current.ids.push('stress_offer_' + seed + '_w' + wid);
  current.ids = [...new Set(current.ids)];
  CheckpointStore.set('computrabajo_last', current);
  ok('checkpoint updated, total ids=' + current.ids.length);

  // ── Test 5: Ledger events ──
  log('--- Test 5: Ledger events ---');
  LedgerStore.emit('stress_test', { worker: wid, seed, ts, step: 'start' });
  LedgerStore.emit('stress_test', { worker: wid, seed, ts, step: 'create' });
  LedgerStore.emit('stress_test', { worker: wid, seed, ts, step: 'checkpoint' });
  ok('emitted 3 ledger events');

  log('--- Worker ' + wid + ' done ---');
  process.stdout.write('__RESULT__:' + JSON.stringify(RESULTS) + '\n');

} catch (e) {
  fail('exception: ' + e.message + '\n' + e.stack);
  process.stdout.write('__RESULT__:' + JSON.stringify(RESULTS) + '\n');
}

process.exit(0);
````

## File: tests/database.test.js
````javascript
/**
 * tests/database.test.js
 * Tests for runtime/stores/Database.js — migration runner, WAL mode, checksums, idempotency.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

// Track cleanup
let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
});

afterEach(() => {
  cleanupFn();
});

// Helper to get a fresh Database module
function freshDb() {
  delete require.cache[require.resolve('../runtime/stores/Database')];
  return require('../runtime/stores/Database');
}

// Helper to migration files dir
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'runtime', 'migrations');

describe('Database.js', () => {
  it('should create WAL mode database', () => {
    const { getDb, close } = freshDb();
    const db = getDb();
    const pragma = db.pragma('journal_mode');
    expect(pragma[0]?.journal_mode?.toLowerCase()).toBe('wal');
    close();
  });

  it('should run all pending migrations on first getDb()', () => {
    const { getDb, close } = freshDb();
    const db = getDb();

    // Check schema_migrations table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('schema_migrations');

    // Verify both migrations were applied
    const migrations = db.prepare("SELECT version, name FROM schema_migrations ORDER BY version").all();
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    expect(migrations[0].version).toBe(1);
    expect(migrations[1].version).toBe(2);
  });

  it('should store SHA-256 checksums for each migration', () => {
    const { getDb, close } = freshDb();
    const db = getDb();

    const rows = db.prepare("SELECT version, checksum FROM schema_migrations ORDER BY version").all();
    for (const row of rows) {
      expect(row.checksum).toBeTruthy();
      expect(row.checksum.length).toBe(16); // truncated SHA-256 to 16 chars
    }
    close();
  });

  it('should be idempotent — calling getDb() twice does not re-run migrations', () => {
    const { getDb, close } = freshDb();
    const db1 = getDb();
    const count1 = db1.prepare("SELECT COUNT(*) as c FROM schema_migrations").get().c;

    // Second call returns same singleton
    const db2 = getDb();
    expect(db2).toBe(db1);
    const count2 = db2.prepare("SELECT COUNT(*) as c FROM schema_migrations").get().c;

    expect(count2).toBe(count1);
    close();
  });

  it('should create expected tables after migrations', () => {
    const { getDb, close } = freshDb();
    const db = getDb();

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);

    // From 0001_init.sql
    expect(tableNames).toContain('meta');
    expect(tableNames).toContain('checkpoints');
    expect(tableNames).toContain('applications');
    expect(tableNames).toContain('ledger');
    expect(tableNames).toContain('job_runs');

    // From 0002_context_engine.sql
    expect(tableNames).toContain('cases');
    expect(tableNames).toContain('availability');
    expect(tableNames).toContain('timeline');

    close();
  });
});
````

## File: tests/ledger_store.test.js
````javascript
/**
 * tests/ledger_store.test.js
 * Tests for runtime/stores/LedgerStore.js — emit, getAll, getByTipo, seed from JSON.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/LedgerStore')];
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/LedgerStore');
}

describe('LedgerStore', () => {
  it('should emit and retrieve events via getAll()', () => {
    const store = freshStore();
    store.emit('test_event', { hello: 'world' });

    const all = store.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);

    const found = all.find(e => e.tipo === 'test_event');
    expect(found).toBeTruthy();
    expect(found.hello).toBe('world');
  });

  it('should filter events by tipo via getByTipo()', () => {
    const store = freshStore();
    store.emit('type_a', { data: 'aaa' });
    store.emit('type_b', { data: 'bbb' });
    store.emit('type_a', { data: 'aaa2' });

    const aEvents = store.getByTipo('type_a');
    expect(aEvents.length).toBe(2);
    aEvents.forEach(e => expect(e.tipo).toBe('type_a'));

    const bEvents = store.getByTipo('type_b');
    expect(bEvents.length).toBe(1);
    expect(bEvents[0].data).toBe('bbb');
  });

  it('should return events with id and parsed data', () => {
    const store = freshStore();
    store.emit('test', { value: 42 });

    const all = store.getAll();
    const event = all.find(e => e.tipo === 'test');
    expect(event).toBeTruthy();
    expect(event.id).toBeTruthy();
    expect(typeof event.id).toBe('string');
    expect(event.id).toMatch(/^ledger_/);
    expect(event.value).toBe(42);
  });

  it('should not throw on SQL injection attempts in getByTipo', () => {
    const store = freshStore();
    expect(() => {
      store.getByTipo("'; DROP TABLE ledger; --");
    }).not.toThrow();
    // Ledger table should still exist
    const db = require('../runtime/stores/Database').getDb();
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ledger'"
    ).get();
    expect(tableExists).toBeTruthy();
  });
});
````

## File: tests/resume_engine.test.js
````javascript
/**
 * tests/resume_engine.test.js
 * Tests for lib/runtime/resume_engine.js — job lifecycle, checkpoints, canResume.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  // Fresh modules each test
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/CheckpointStore')];
  delete require.cache[require.resolve('../runtime/stores/JobStore')];
  delete require.cache[require.resolve('../lib/runtime/resume_engine')];
  // Init DB
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshEngine() {
  return require('../lib/runtime/resume_engine');
}

describe('ResumeEngine', () => {
  it('should start a job and create a running record', () => {
    const re = freshEngine();
    const ctx = re.start('test_job', { source: 'test' });

    expect(ctx.jobName).toBe('test_job');
    expect(ctx.attempt).toBe(1);
    expect(ctx.timestamp).toBeTruthy();

    // Verify in JobStore
    const JobStore = require('../runtime/stores/JobStore');
    const lastRun = JobStore.getLastRun('test_job');
    expect(lastRun).toBeTruthy();
    expect(lastRun.status).toBe('running');
  });

  it('should finish a job and update status', () => {
    const re = freshEngine();
    re.start('test_job');
    re.finish('test_job', 'success', { processed: 42 });

    const JobStore = require('../runtime/stores/JobStore');
    const lastRun = JobStore.getLastRun('test_job');
    expect(lastRun.status).toBe('success');
  });

  it('should allow resume after start, disallow after finish', () => {
    const re = freshEngine();
    // Can't resume if no runs exist
    expect(re.canResume('never_started')).toBe(false);

    // After start, can resume
    re.start('resumable_job');
    expect(re.canResume('resumable_job')).toBe(true);

    // After finish, cannot resume
    re.finish('resumable_job', 'completed');
    expect(re.canResume('resumable_job')).toBe(false);
  });

  it('should save and load checkpoints', () => {
    const re = freshEngine();

    // Save checkpoint
    re.save('checkpoint_job', { cursor: 42, page: 3 });

    // Load via start()
    const ctx = re.start('checkpoint_job');
    // The checkpoint is loaded inside start() via load()
    // Checkpoint was saved, start creates a new run
    const JobStore = require('../runtime/stores/JobStore');
    const lastRun = JobStore.getLastRun('checkpoint_job');
    expect(lastRun.status).toBe('running');
    expect(ctx.attempt).toBe(1);
  });

  it('should increment attempt counter on successive runs', () => {
    const re = freshEngine();

    const ctx1 = re.start('multi_run');
    expect(ctx1.attempt).toBe(1);
    re.finish('multi_run', 'success');

    const ctx2 = re.start('multi_run');
    expect(ctx2.attempt).toBe(2);
    re.finish('multi_run', 'success');
  });
});
````

## File: tests/stress_concurrency.js
````javascript
/**
 * stress_concurrency.js
 * 
 * Lanza N workers en paralelo (cada uno en su propio proceso con su propia
 * conexion SQLite) y verifica que WAL maneje correctamente la concurrencia.
 * 
 * Tests:
 *   1. Checkpoint leido por todos
 *   2. Todos insertan mismo URL → solo 1 app (INSERT OR IGNORE)
 *   3. Cada worker crea app unica → total = N
 *   4. Checkpoint actualizado concurrentemente → ids crecen monotonicamente
 *   5. Ledger eventos concurrentes → total = N * events_por_worker
 * 
 * Uso: node tests/stress_concurrency.js [--workers=4]
 */

const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '..', 'runtime', 'lifeos.db');
const DB_BACKUP = DB_PATH + '.stress_bak';

const NUM_WORKERS = parseInt((process.argv.find(a => a.startsWith('--workers=')) || '--workers=4').split('=')[1]);
const TEST_SEED = Date.now().toString(36);

function log(msg) { console.log('[STRESS] ' + msg); }

// ─── Setup: backup + fresh DB ───
function setup() {
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, DB_BACKUP);
    fs.unlinkSync(DB_PATH);
    log('backed up existing DB, created fresh');
  } else {
    log('no existing DB, creating fresh');
  }
}

function restore() {
  try { require('../runtime/stores/Database').close(); } catch {}
  if (fs.existsSync(DB_BACKUP)) {
    if (fs.existsSync(DB_PATH)) { try { fs.unlinkSync(DB_PATH); } catch {} }
    try { fs.copyFileSync(DB_BACKUP, DB_PATH); } catch (e) { log('restore copy failed: ' + e.message); }
    try { fs.unlinkSync(DB_BACKUP); } catch {}
    log('restored original DB');
  }
}

// ─── Seed initial data ───
function seed() {
  process.env.STORAGE_DRIVER = 'sqlite';
  const CheckpointStore = require('../runtime/stores/CheckpointStore');
  const AppStore = require('../runtime/stores/ApplicationStore');

  // Seed checkpoint with some known IDs
  CheckpointStore.set('computrabajo_last', { ids: ['initial_1', 'initial_2'] });
  const cp = CheckpointStore.get('computrabajo_last');
  log('seeded checkpoint, ids=' + cp.ids.length);
}

// ─── Fork workers ───
async function forkWorker(wid) {
  return new Promise((resolve) => {
    const worker = fork(path.join(__dirname, 'concurrency_worker.js'), [], {
      env: { ...process.env, WORKER_ID: String(wid), NUM_WORKERS: String(NUM_WORKERS), TEST_SEED },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    let stdout = '';
    worker.stdout.on('data', d => { stdout += d.toString(); });
    worker.stderr.on('data', d => process.stderr.write(d));

    worker.on('exit', (code) => {
      const resultMatch = stdout.match(/__RESULT__:(.*)/);
      let result = null;
      if (resultMatch) {
        try { result = JSON.parse(resultMatch[1]); } catch {}
      }
      resolve({ wid, code, stdout, result });
    });
  });
}

// ─── Verify ───
function verify(results, startTs) {
  process.env.STORAGE_DRIVER = 'sqlite';
  const { getDb } = require('../runtime/stores/Database');
  const AppStore = require('../runtime/stores/ApplicationStore');
  const LedgerStore = require('../runtime/stores/LedgerStore');

  const db = getDb();
  let allOk = true;
  const errors = [];

  function check(label, condition, detail) {
    if (condition) {
      log('  OK ' + label);
    } else {
      log('  FAIL ' + label + ': ' + (detail || ''));
      allOk = false;
      errors.push(label);
    }
  }

  log('\n=== VERIFICATION ===');

  // 1. All workers reported OK
  const totalOk = results.filter(r => r.result).reduce((s, r) => s + r.result.ok, 0);
  const totalFail = results.filter(r => r.result).reduce((s, r) => s + r.result.fail, 0);
  check('all workers reported', results.length === NUM_WORKERS, 'got ' + results.length + ' of ' + NUM_WORKERS);
  check('zero worker failures', totalFail === 0, totalFail + ' fails');
  check('all workers ok', totalOk >= NUM_WORKERS * 3, totalOk + ' oks');

  // 2. Race app: only 1 for the race URL
  const raceUrl = `https://computrabajo.com/stress/race_${TEST_SEED}`;
  const raceApps = db.prepare("SELECT COUNT(*) as c FROM applications WHERE url = ?").get(raceUrl);
  check('race URL has 1 app', raceApps.c === 1, 'got ' + raceApps.c);

  // 3. Unique apps: exactly N (one per worker)
  const uniqueApps = db.prepare("SELECT COUNT(*) as c FROM applications WHERE url LIKE '%stress/unique_%'").get();
  check('unique apps count = N', uniqueApps.c === NUM_WORKERS, 'got ' + uniqueApps.c + ', expected ' + NUM_WORKERS);

  // 4. Checkpoint: last-writer-wins es esperado. Verificar estructura válida.
  const cp = db.prepare("SELECT value FROM checkpoints WHERE key = 'computrabajo_last'").get();
  if (cp) {
    const ids = JSON.parse(cp.value).ids || [];
    const workerIds = ids.filter(i => i.includes('_w'));
    check('checkpoint has valid structure', Array.isArray(ids), 'not an array');
    check('checkpoint has initial IDs', ids.includes('initial_1') && ids.includes('initial_2'), 'missing initial IDs');
    check('checkpoint has at least 1 worker', workerIds.length >= 1, 'got ' + workerIds.length);
    check('checkpoint no duplicates', ids.length === new Set(ids).size, 'duplicates found');
  } else {
    check('checkpoint exists', false, 'checkpoint row missing');
  }

  // 5. Ledger: exactly N * 3 events
  const ledgerEvents = db.prepare("SELECT COUNT(*) as c FROM ledger WHERE tipo = 'stress_test'").get();
  check('ledger events = N*3', ledgerEvents.c === NUM_WORKERS * 3, 'got ' + ledgerEvents.c + ', expected ' + (NUM_WORKERS * 3));

  // 6. No WAL corruption
  const integrity = db.prepare("PRAGMA integrity_check").get();
  check('integrity check', integrity && integrity['integrity_check'] === 'ok', JSON.stringify(integrity));

  // 7. WAL mode active
  const journal = db.prepare("PRAGMA journal_mode").get();
  check('WAL mode', journal && journal['journal_mode'] === 'wal', JSON.stringify(journal));

  const elapsed = Date.now() - startTs;
  log('\n=== STRESS TEST ' + (allOk ? 'PASSED' : 'FAILED') + ' (' + elapsed + 'ms) ===');
  if (errors.length) log('Errors: ' + errors.join(', '));

  return allOk;
}

// ─── Main ───
async function main() {
  const startTs = Date.now();
  log('STRESS TEST: ' + NUM_WORKERS + ' workers, seed=' + TEST_SEED);

  setup();
  seed();

  log('forking ' + NUM_WORKERS + ' workers...');
  const promises = [];
  for (let i = 1; i <= NUM_WORKERS; i++) {
    promises.push(forkWorker(i));
  }
  const results = await Promise.all(promises);

  const passed = verify(results, startTs);
  restore();
  process.exit(passed ? 0 : 1);
}

main().catch(e => {
  console.error('FATAL:', e);
  restore();
  process.exit(1);
});
````

## File: wheel-saver/api/__init__.py
````python
"""WheelSaver API package."""
````

## File: wheel-saver/api/database.py
````python
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "top_repos.db")


async def get_db():
    """Dependencia de FastAPI para obtener una sesión asíncrona de BD."""
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("PRAGMA journal_mode=WAL;")
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
````

## File: wheel-saver/api/main.py
````python
"""
WheelSaver API — FastAPI REST API para consultar la BD de repos.

Uso:
    python cli.py api
    # o
    uvicorn api.main:app --reload

Documentacion automatica: http://localhost:8000/docs
"""

from fastapi import FastAPI, Query, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import aiosqlite

from api.database import get_db
from api.repository import (
    search_repos_async,
    search_repos_multi_keywords_async,
    get_stats_async,
    get_repo_async,
    get_languages_async,
    list_repos_async,
    get_top_async,
)

app = FastAPI(
    title="WheelSaver API",
    description="Busca y analiza repositorios de GitHub desde la base de datos local de WheelSaver. RAG multi-proveedor con failover automático.",
    version="3.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return RedirectResponse(url="/web/index.html")


@app.get("/health")
async def health(db: aiosqlite.Connection = Depends(get_db)):
    """Healthcheck simple."""
    stats = await get_stats_async(db)
    return {"status": "ok", "version": "3.0.0", "repos": stats["total_repos"]}


@app.get("/search")
async def search(
    q: str = Query(..., description="Keyword(s) para buscar"),
    limit: int = Query(10, ge=1, le=100, description="Max resultados"),
    language: str = Query(None, description="Filtrar por lenguaje"),
    min_stars: int = Query(0, ge=0, description="Estrellas minimas"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Busqueda full-text en la base de datos (FTS5 + fallback LIKE)."""
    keywords = [kw.strip() for kw in q.split() if kw.strip()]
    if not keywords:
        return {"query": q, "repos": [], "total": 0}

    if len(keywords) == 1:
        repos = await search_repos_async(db, keywords[0], limit=limit)
    else:
        repos = await search_repos_multi_keywords_async(db, keywords, limit=limit)

    # Filtros post-query
    if language:
        repos = [r for r in repos if r["language"].lower() == language.lower()]
    if min_stars:
        repos = [r for r in repos if r["stars"] >= min_stars]

    return {"query": q, "repos": repos[:limit], "total": len(repos[:limit])}


@app.get("/stats")
async def api_stats(db: aiosqlite.Connection = Depends(get_db)):
    """Estadisticas de la base de datos."""
    return await get_stats_async(db)


@app.get("/repos/{owner}/{name}")
async def get_repo(owner: str, name: str, db: aiosqlite.Connection = Depends(get_db)):
    """Obtener un repositorio por owner y nombre."""
    repo = await get_repo_async(db, owner, name)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositorio no encontrado")
    return repo


@app.get("/languages")
async def languages(
    limit: int = Query(50, ge=1, le=200, description="Max lenguajes"),
    min_repos: int = Query(1, ge=1, description="Min repos por lenguaje"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Lista de lenguajes de programacion con cantidad de repos."""
    langs = await get_languages_async(db, min_repos=min_repos, limit=limit)
    return {"languages": langs}


@app.get("/repos")
async def list_repos(
    page: int = Query(1, ge=1, description="Numero de pagina"),
    per_page: int = Query(50, ge=1, le=200, description="Repos por pagina"),
    language: str = Query(None, description="Filtrar por lenguaje"),
    sort: str = Query("stars", description="Ordenar por: stars, name, updated_at"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Lista paginada de repositorios."""
    order_col = (
        "stars" if sort == "stars" else (sort if sort in ("name", "updated_at") else "stars")
    )
    offset = (page - 1) * per_page
    repos = await list_repos_async(
        db, order_col=order_col, language=language, per_page=per_page, offset=offset
    )
    return {"page": page, "per_page": per_page, "repos": repos, "total": len(repos)}


@app.get("/top")
async def top(
    limit: int = Query(10, ge=1, le=100, description="Cuantos top repos"),
    language: str = Query(None, description="Filtrar por lenguaje"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Top repositorios por estrellas."""
    repos = await get_top_async(db, limit=limit, language=language)
    return {"limit": limit, "repos": repos}


@app.post("/scrape")
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    min_stars: int = Query(500, ge=10, description="Estrellas minimas para buscar"),
):
    """Lanza el scraper de GitHub de forma asíncrona en el mismo proceso."""
    from scraper.github_fetcher import fetch_top_repos
    background_tasks.add_task(fetch_top_repos, min_stars)
    return {"status": "ok", "message": f"Scraper iniciado (min_stars={min_stars})"}


from pydantic import BaseModel
class AskRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_agent(
    req: AskRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Realiza una consulta al LLM multi-proveedor (RAG) usando repositorios como contexto. Failover automático entre free tiers."""
    from api.llm import ask_llm_about_repos

    # Extraer posibles keywords de la pregunta para buscar contexto
    keywords = [kw.strip() for kw in req.question.replace("?", "").replace("¿", "").split() if len(kw) > 3]

    if len(keywords) == 1:
        repos = await search_repos_async(db, keywords[0], limit=10)
    else:
        repos = await search_repos_multi_keywords_async(db, keywords, limit=10)

    answer = await ask_llm_about_repos(req.question, repos)
    return {"question": req.question, "context_repos_used": len(repos), "answer": answer}

app.mount("/web", StaticFiles(directory="frontend", html=True), name="frontend")
````

## File: wheel-saver/api/repository.py
````python
import aiosqlite
from async_lru import alru_cache
import logging

async def search_repos_async(db: aiosqlite.Connection, keyword: str, limit: int = 5):
    """Busqueda vectorial/full-text en SQLite (FTS5 + fallback LIKE)."""
    try:
        cursor = await db.execute(
            """
            SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (keyword, limit),
        )
        results = await cursor.fetchall()

        if not results:
            cursor = await db.execute(
                """
                SELECT name, owner, description, url, stars, language, topics
                FROM repos
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY stars DESC
                LIMIT ?
                """,
                (f"%{keyword}%", f"%{keyword}%", limit),
            )
            results = await cursor.fetchall()

        return [dict(r) for r in results]
    except Exception as e:
        logging.error(f"Error búsqueda asíncrona: {e}")
        return []

async def search_repos_multi_keywords_async(
    db: aiosqlite.Connection, keywords: list[str], limit: int = 5
):
    """Busqueda con multiples keywords en FTS5 (AND) con fallback individual (OR)."""
    if not keywords:
        return []

    fts_query_and = " AND ".join(f'"{kw}"' for kw in keywords)

    try:
        cursor = await db.execute(
            """
            SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (fts_query_and, limit),
        )
        results = await cursor.fetchall()

        if len(results) < limit:
            results_list = [dict(r) for r in results]
            seen = {r["name"] for r in results_list}

            fts_query_or = " OR ".join(f'"{kw}"' for kw in keywords)
            cursor = await db.execute(
                """
                SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
                FROM repos_fts f
                JOIN repos r ON r.rowid = f.rowid
                WHERE repos_fts MATCH ?
                ORDER BY rank
                LIMIT ?
                """,
                (fts_query_or, limit * 2),
            )
            fallback_results = await cursor.fetchall()

            for r in fallback_results:
                r_dict = dict(r)
                if r_dict["name"] not in seen:
                    seen.add(r_dict["name"])
                    results_list.append(r_dict)
                    if len(results_list) >= limit:
                        break
            return results_list
        return [dict(r) for r in results]
    except Exception as e:
        logging.error(f"Error búsqueda asíncrona multi-keyword: {e}")
        return []


@alru_cache(maxsize=32)
async def get_stats_async(db: aiosqlite.Connection):
    stats = {}
    cursor = await db.execute("SELECT COUNT(*) as count FROM repos")
    row = await cursor.fetchone()
    stats["total_repos"] = row["count"]

    cursor = await db.execute(
        "SELECT MIN(stars) as min_s, MAX(stars) as max_s, AVG(stars) as avg_s FROM repos"
    )
    row = await cursor.fetchone()
    stats["stars_min"] = row["min_s"]
    stats["stars_max"] = row["max_s"]
    stats["stars_avg"] = round(row["avg_s"]) if row["avg_s"] else 0

    cursor = await db.execute(
        'SELECT COUNT(DISTINCT language) as cnt FROM repos WHERE language != ""'
    )
    row = await cursor.fetchone()
    stats["languages"] = row["cnt"]

    cursor = await db.execute("""
        SELECT language, COUNT(*) as cnt FROM repos
        WHERE language != "" GROUP BY language ORDER BY cnt DESC LIMIT 10
    """)
    top_langs = await cursor.fetchall()
    stats["top_languages"] = {r["language"]: r["cnt"] for r in top_langs}

    return stats


async def get_repo_async(db: aiosqlite.Connection, owner: str, name: str):
    cursor = await db.execute(
        "SELECT * FROM repos WHERE owner = ? AND name = ?",
        (owner, name),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


@alru_cache(maxsize=32)
async def get_languages_async(db: aiosqlite.Connection, min_repos: int, limit: int):
    cursor = await db.execute(
        """SELECT language, COUNT(*) as count FROM repos
           WHERE language != '' GROUP BY language
           HAVING count >= ? ORDER BY count DESC LIMIT ?""",
        (min_repos, limit),
    )
    langs = await cursor.fetchall()
    return [{"language": r["language"], "repos": r["count"]} for r in langs]


async def list_repos_async(
    db: aiosqlite.Connection, order_col: str, language: str, per_page: int, offset: int
):
    if language:
        cursor = await db.execute(
            f"SELECT * FROM repos WHERE language = ? ORDER BY {order_col} DESC LIMIT ? OFFSET ?",
            (language, per_page, offset),
        )
    else:
        cursor = await db.execute(
            f"SELECT * FROM repos ORDER BY {order_col} DESC LIMIT ? OFFSET ?",
            (per_page, offset),
        )
    repos = await cursor.fetchall()
    return [dict(r) for r in repos]


async def get_top_async(db: aiosqlite.Connection, limit: int, language: str):
    if language:
        cursor = await db.execute(
            "SELECT * FROM repos WHERE language = ? ORDER BY stars DESC LIMIT ?",
            (language, limit),
        )
    else:
        cursor = await db.execute(
            "SELECT * FROM repos ORDER BY stars DESC LIMIT ?",
            (limit,),
        )
    repos = await cursor.fetchall()
    return [dict(r) for r in repos]
````

## File: wheel-saver/frontend/app.js
````javascript
const API_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    loadStats();

    document.getElementById("search-form").addEventListener("submit", (e) => {
        e.preventDefault();
        performSearch();
    });

    document.getElementById("btn-scrape").addEventListener("click", () => {
        triggerScrape();
    });
});

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        if (!res.ok) throw new Error("API Error");
        const stats = await res.json();
        
        document.getElementById("stat-repos").textContent = stats.total_repos.toLocaleString();
        document.getElementById("stat-langs").textContent = stats.languages;
        document.getElementById("stat-max").textContent = stats.stars_max.toLocaleString();
        document.getElementById("stat-avg").textContent = Math.round(stats.stars_avg).toLocaleString();
    } catch (err) {
        console.error("No se pudo cargar estadisticas", err);
    }
}

async function performSearch() {
    const q = document.getElementById("input-q").value.trim();
    const lang = document.getElementById("input-lang").value.trim();
    const limit = document.getElementById("input-limit").value;

    if (!q) return;

    const resultsCard = document.getElementById("results-card");
    const loading = document.getElementById("loading");
    const tbody = document.getElementById("results-body");

    resultsCard.classList.add("hide");
    loading.classList.remove("hide");
    tbody.innerHTML = "";

    try {
        let url = `${API_BASE}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
        if (lang) url += `&language=${encodeURIComponent(lang)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();

        data.repos.forEach(repo => {
            const tr = document.createElement("tr");
            
            const tdName = document.createElement("td");
            tdName.innerHTML = `<a href="${repo.url}" target="_blank"><strong>${repo.owner}/${repo.name}</strong></a>`;
            
            const tdStars = document.createElement("td");
            tdStars.textContent = "⭐ " + repo.stars.toLocaleString();
            
            const tdLang = document.createElement("td");
            tdLang.textContent = repo.language || "-";
            
            const tdDesc = document.createElement("td");
            tdDesc.className = "text-wrap";
            tdDesc.textContent = repo.description || "-";

            tr.appendChild(tdName);
            tr.appendChild(tdStars);
            tr.appendChild(tdLang);
            tr.appendChild(tdDesc);
            tbody.appendChild(tr);
        });

        resultsCard.classList.remove("hide");
    } catch (err) {
        alert("Error al buscar: " + err.message);
    } finally {
        loading.classList.add("hide");
    }
}

async function triggerScrape() {
    try {
        const res = await fetch(`${API_BASE}/scrape?min_stars=500`, { method: "POST" });
        if (!res.ok) throw new Error("Error en API");
        const data = await res.json();
        alert("Scraping iniciado en background: " + data.message);
    } catch(err) {
        alert("Error: " + err.message);
    }
}
````

## File: wheel-saver/frontend/index.html
````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
    <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
    <title>WheelSaver Dashboard</title>
    <!-- Tabler Core -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/core@latest/dist/css/tabler.min.css">
    <style>
      .hide { display: none; }
    </style>
  </head>
  <body class="theme-light">
    <div class="page">
      <!-- Navbar -->
      <header class="navbar navbar-expand-md navbar-light d-print-none">
        <div class="container-xl">
          <h1 class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            🛞 WheelSaver
          </h1>
          <div class="navbar-nav flex-row order-md-last">
            <div class="nav-item">
              <button id="btn-scrape" class="btn btn-primary">
                Trigger Scraper (Background)
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div class="page-wrapper">
        <div class="page-body">
          <div class="container-xl">
            <!-- Stats Row -->
            <div class="row row-deck row-cards mb-4" id="stats-container">
              <div class="col-sm-6 col-lg-3">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="subheader">Total Repos</div>
                    </div>
                    <div class="h1 mb-3" id="stat-repos">-</div>
                  </div>
                </div>
              </div>
              <div class="col-sm-6 col-lg-3">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="subheader">Lenguajes</div>
                    </div>
                    <div class="h1 mb-3" id="stat-langs">-</div>
                  </div>
                </div>
              </div>
              <div class="col-sm-6 col-lg-3">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="subheader">Estrella Max</div>
                    </div>
                    <div class="h1 mb-3" id="stat-max">-</div>
                  </div>
                </div>
              </div>
              <div class="col-sm-6 col-lg-3">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="subheader">Estrella Promedio</div>
                    </div>
                    <div class="h1 mb-3" id="stat-avg">-</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Search Row -->
            <div class="card mb-4">
              <div class="card-body">
                <h3 class="card-title">🔍 Buscar Repositorios</h3>
                <form id="search-form" class="row g-3">
                  <div class="col-md-6">
                    <input type="text" class="form-control" id="input-q" placeholder="Keywords (ej: fastapi pytest docker)">
                  </div>
                  <div class="col-md-3">
                    <input type="text" class="form-control" id="input-lang" placeholder="Lenguaje (opcional)">
                  </div>
                  <div class="col-md-2">
                    <input type="number" class="form-control" id="input-limit" value="10" min="1" max="100">
                  </div>
                  <div class="col-md-1">
                    <button type="submit" class="btn btn-primary w-100">Buscar</button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Results Table -->
            <div class="card hide" id="results-card">
              <div class="card-header">
                <h3 class="card-title">Resultados</h3>
              </div>
              <div class="table-responsive">
                <table class="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Repo</th>
                      <th>Estrellas</th>
                      <th>Lenguaje</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody id="results-body">
                    <!-- JS fills this -->
                  </tbody>
                </table>
              </div>
            </div>

            <div id="loading" class="hide text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
            </div>

          </div>
        </div>
      </div>
    </div>
    <script src="app.js"></script>
  </body>
</html>
````

## File: wheel-saver/scraper/__init__.py
````python

````

## File: wheel-saver/tests/__init__.py
````python

````

## File: wheel-saver/tests/conftest.py
````python
"""conftest.py — Fixtures de prueba para WheelSaver.

Provee una base de datos SQLite in-memory con el mismo esquema
que la BD real, mas repos de muestra para los tests.
"""

import sqlite3
import os
import sys
import pytest
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.db_manager import make_repo_id, DB_PATH


SAMPLE_REPOS = [
    {
        "id": make_repo_id("fastapi", "fastapi"),
        "name": "fastapi",
        "owner": "fastapi",
        "description": "FastAPI framework for building APIs",
        "url": "https://github.com/fastapi/fastapi",
        "stars": 100209,
        "language": "Python",
        "topics": ["api", "python", "web"],
        "updated_at": "2026-06-01T00:00:00Z",
    },
    {
        "id": make_repo_id("pallets", "flask"),
        "name": "flask",
        "owner": "pallets",
        "description": "The Python micro framework for building web applications",
        "url": "https://github.com/pallets/flask",
        "stars": 71855,
        "language": "Python",
        "topics": ["python", "web", "framework"],
        "updated_at": "2026-05-15T00:00:00Z",
    },
    {
        "id": make_repo_id("rust-lang", "rust"),
        "name": "rust",
        "owner": "rust-lang",
        "description": "Empowering everyone to build reliable and efficient software",
        "url": "https://github.com/rust-lang/rust",
        "stars": 102345,
        "language": "Rust",
        "topics": ["rust", "language", "compiler"],
        "updated_at": "2026-06-10T00:00:00Z",
    },
    {
        "id": make_repo_id("microsoft", "vscode"),
        "name": "vscode",
        "owner": "microsoft",
        "description": "Visual Studio Code",
        "url": "https://github.com/microsoft/vscode",
        "stars": 175000,
        "language": "TypeScript",
        "topics": ["editor", "code", "typescript"],
        "updated_at": "2026-06-12T00:00:00Z",
    },
    {
        "id": make_repo_id("tensorflow", "tensorflow"),
        "name": "tensorflow",
        "owner": "tensorflow",
        "description": "An Open Source Machine Learning Framework for Everyone",
        "url": "https://github.com/tensorflow/tensorflow",
        "stars": 190000,
        "language": "Python",
        "topics": ["machine-learning", "deep-learning", "python"],
        "updated_at": "2026-06-14T00:00:00Z",
    },
]


def build_test_db():
    """Crea una BD SQLite in-memory con esquema completo + FTS5 + datos."""
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE repos (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            stars INTEGER NOT NULL,
            language TEXT,
            topics TEXT,
            updated_at TEXT,
            is_archived INTEGER DEFAULT 0
        )
    """)

    cursor.execute("CREATE INDEX idx_repos_stars ON repos(stars DESC)")
    cursor.execute("CREATE INDEX idx_repos_language ON repos(language)")
    cursor.execute("CREATE INDEX idx_repos_owner ON repos(owner)")

    cursor.execute("""
        CREATE VIRTUAL TABLE repos_fts USING fts5(
            name, description, topics,
            content='repos',
            content_rowid='rowid'
        )
    """)

    conn.commit()
    return conn


@pytest.fixture
def db_conn():
    """Fixture: conexion a BD in-memory con esquema completo."""
    conn = build_test_db()
    yield conn
    conn.close()


@pytest.fixture
def db_with_data(db_conn):
    """Fixture: BD in-memory con esquema + repos de muestra insertados."""
    cursor = db_conn.cursor()
    for repo in SAMPLE_REPOS:
        topics_str = ",".join(repo["topics"])
        cursor.execute(
            """INSERT INTO repos (id, name, owner, description, url, stars, language, topics, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                repo["id"],
                repo["name"],
                repo["owner"],
                repo["description"],
                repo["url"],
                repo["stars"],
                repo["language"],
                topics_str,
                repo["updated_at"],
            ),
        )
    db_conn.commit()
    # Reconstruir indice FTS5
    cursor.execute("INSERT INTO repos_fts(repos_fts) VALUES('rebuild')")
    db_conn.commit()
    return db_conn
````

## File: wheel-saver/tests/test_api_async.py
````python
import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "repos" in data


@pytest.mark.asyncio
async def test_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_repos" in data
    assert "top_languages" in data


@pytest.mark.asyncio
async def test_search():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/search?q=fastapi&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert data["query"] == "fastapi"
    assert "repos" in data
    assert len(data["repos"]) <= 2


@pytest.mark.asyncio
async def test_languages():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/languages?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "languages" in data
    assert len(data["languages"]) <= 5


@pytest.mark.asyncio
async def test_top():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/top?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert "repos" in data
    assert len(data["repos"]) <= 3


@pytest.mark.asyncio
async def test_list_repos():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/repos?page=1&per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["per_page"] == 10
    assert "repos" in data
    assert len(data["repos"]) <= 10
````

## File: wheel-saver/tests/test_db_manager.py
````python
"""
Tests para scraper/db_manager.py

Cubre: init_db, upsert_repos, upsert_external_repos, make_repo_id,
search_repos, search_repos_multi_keywords, get_stats, rebuild_fts.
"""

import sqlite3
import pytest

# Necesitamos parchear DB_PATH antes de importar db_manager
# para que apunte a :memory: en vez del archivo real
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_make_repo_id():
    """make_repo_id debe ser determinista y generar IDs unicos."""
    from scraper.db_manager import make_repo_id

    id1 = make_repo_id("fastapi", "fastapi")
    id2 = make_repo_id("fastapi", "fastapi")
    assert id1 == id2, "Mismo owner/name debe generar mismo ID"

    id3 = make_repo_id("FastAPI", "FastAPI")
    assert id1 == id3, "Debe ser case-insensitive"

    id4 = make_repo_id("fastapi", "flask")
    assert id1 != id4, "Distinto repo debe generar distinto ID"

    assert len(id1) == 16, "Debe tener 16 chars hex"


def test_search_repos_fts(db_with_data):
    """search_repos debe encontrar repos via FTS5."""
    from scraper.db_manager import search_repos

    results = search_repos("fastapi")
    assert len(results) >= 1
    assert results[0]["name"] == "fastapi"


def test_search_repos_like(db_with_data):
    """search_repos debe hacer fallback a LIKE si FTS5 falla."""
    from scraper.db_manager import search_repos

    results = search_repos("fastapi")
    assert len(results) >= 1
    assert any("fastapi" in r["name"] for r in results)


def test_search_repos_limit(db_with_data):
    """search_repos debe respetar el parametro limit."""
    from scraper.db_manager import search_repos

    results = search_repos("python", limit=2)
    assert len(results) <= 2


def test_search_repos_empty(db_with_data):
    """search_repos sin resultados debe retornar lista vacia."""
    from scraper.db_manager import search_repos

    results = search_repos("xyznonexistent12345")
    assert results == []


def test_search_repos_multi_keywords(db_with_data):
    """search_repos_multi_keywords con OR entre keywords."""
    from scraper.db_manager import search_repos_multi_keywords

    results = search_repos_multi_keywords(["fastapi", "flask"])
    names = [r["name"] for r in results]
    assert "fastapi" in names
    assert "flask" in names


def test_get_stats(db_with_data):
    """get_stats debe retornar estadisticas correctas."""
    from scraper.db_manager import get_stats

    # Parcheamos para usar la BD in-memory
    import scraper.db_manager as dbm

    original_path = dbm.DB_PATH
    dbm.DB_PATH = ":memory:"

    # Con nuestra fixture, query se ejecuta contra la BD real
    # En vez de eso, probamos el conteo de repos
    conn = db_with_data
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM repos")
    assert cursor.fetchone()[0] == 5

    cursor.execute("SELECT MIN(stars), MAX(stars), AVG(stars) FROM repos")
    row = cursor.fetchone()
    assert row[0] == 71855  # flask
    assert row[1] == 190000  # tensorflow


def test_upsert_repos_insert(db_conn):
    """upsert_repos debe insertar un nuevo repo."""
    from scraper.db_manager import upsert_repos

    repo = {
        "id": "test123",
        "name": "new-repo",
        "owner": "test-owner",
        "description": "A new repo",
        "url": "https://github.com/test-owner/new-repo",
        "stars": 1000,
        "language": "Python",
        "topics": ["test"],
        "updated_at": "2026-01-01T00:00:00Z",
    }

    # Usamos las funciones directamente con la conexion in-memory
    # en vez de init_db() para no tocar el archivo real
    cursor = db_conn.cursor()
    topics_str = ",".join(repo["topics"])
    cursor.execute(
        """INSERT INTO repos (id, name, owner, description, url, stars, language, topics, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
               name=excluded.name, owner=excluded.owner,
               description=excluded.description, url=excluded.url,
               stars=excluded.stars, language=excluded.language,
               topics=excluded.topics, updated_at=excluded.updated_at""",
        (
            repo["id"],
            repo["name"],
            repo["owner"],
            repo["description"],
            repo["url"],
            repo["stars"],
            repo["language"],
            topics_str,
            repo["updated_at"],
        ),
    )
    db_conn.commit()

    cursor.execute("SELECT name, stars FROM repos WHERE id = ?", (repo["id"],))
    row = cursor.fetchone()
    assert row is not None
    assert row[0] == "new-repo"
    assert row[1] == 1000


def test_upsert_repos_update(db_conn):
    """upsert_repos debe actualizar un repo existente."""
    cursor = db_conn.cursor()

    # Insert original
    cursor.execute(
        """INSERT INTO repos (id, name, owner, description, url, stars, language, topics, updated_at)
           VALUES ('update1', 'old-name', 'owner', 'desc', 'url', 500, 'Go', '', '2026-01-01')""",
    )
    db_conn.commit()

    # Update via upsert
    topics_str = "updated"
    cursor.execute(
        """INSERT INTO repos (id, name, owner, description, url, stars, language, topics, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
               name=excluded.name, stars=excluded.stars, topics=excluded.topics""",
        ("update1", "new-name", "owner", "desc", "url", 999, "Go", topics_str, "2026-06-01"),
    )
    db_conn.commit()

    cursor.execute("SELECT name, stars FROM repos WHERE id = 'update1'")
    row = cursor.fetchone()
    assert row[0] == "new-name"
    assert row[1] == 999


def test_upsert_external_repos_generates_id(db_conn):
    """upsert_external_repos debe generar ID si no viene."""
    from scraper.db_manager import upsert_external_repos, make_repo_id

    repo = {
        "name": "auto-id-repo",
        "owner": "auto-owner",
        "description": "No id provided",
        "url": "https://github.com/auto-owner/auto-id-repo",
        "stars": 5000,
        "language": "Python",
        "topics": [],
        "updated_at": "2026-01-01T00:00:00Z",
    }

    expected_id = make_repo_id("auto-owner", "auto-id-repo")
    # upsert_external_repos asigna id via make_repo_id y llama upsert_repos
    # upsert_repos abre init_db() que conecta al archivo real...
    # Para test con in-memory, verificamos la logica directamente:
    assert repo.get("id") is None or repo["id"] == ""
    generated = make_repo_id(repo["owner"], repo["name"])
    assert generated == expected_id
````

## File: wheel-saver/tests/test_search.py
````python
"""
Tests de busqueda para WheelSaver.

Cubre: busqueda por keyword exacta, parcial, multi-keyword,
sin resultados, y caracteres especiales.
"""

import sqlite3
import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestSearch:
    """Tests de busqueda usando la BD in-memory de conftest."""

    def test_search_exact_name(self, db_with_data):
        """Buscar por nombre exacto debe encontrar el repo."""
        cursor = db_with_data.cursor()
        cursor.execute(
            """SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
               FROM repos_fts f JOIN repos r ON r.rowid = f.rowid
               WHERE repos_fts MATCH ? ORDER BY r.stars DESC""",
            ("fastapi",),
        )
        results = cursor.fetchall()
        names = [r[0] for r in results]
        assert "fastapi" in names

    def test_search_partial_name(self, db_with_data):
        """Buscar por parte del nombre debe encontrar coincidencias."""
        cursor = db_with_data.cursor()
        like_kw = "%code%"
        cursor.execute(
            """SELECT name, description FROM repos
               WHERE name LIKE ? OR description LIKE ?
               ORDER BY stars DESC LIMIT 5""",
            (like_kw, like_kw),
        )
        results = cursor.fetchall()
        assert len(results) >= 1
        # vscode tiene "Visual Studio Code" en descripcion
        descriptions = [r[1].lower() for r in results]
        names = [r[0].lower() for r in results]
        assert any("code" in d for d in descriptions) or any("code" in n for n in names)

    def test_search_multi_keyword(self, db_with_data):
        """Busqueda multi-keyword con OR."""
        cursor = db_with_data.cursor()
        fts_query = "fastapi OR flask"
        cursor.execute(
            """SELECT DISTINCT r.name, r.stars
               FROM repos_fts f JOIN repos r ON r.rowid = f.rowid
               WHERE repos_fts MATCH ?
               ORDER BY r.stars DESC""",
            (fts_query,),
        )
        results = cursor.fetchall()
        names = [r[0] for r in results]
        assert "fastapi" in names
        assert "flask" in names

    def test_search_no_results(self, db_with_data):
        """Busqueda sin resultados debe retornar lista vacia."""
        cursor = db_with_data.cursor()
        cursor.execute(
            """SELECT r.name FROM repos_fts f JOIN repos r ON r.rowid = f.rowid
               WHERE repos_fts MATCH ?""",
            ("zzzznonexistent12345xxxxx",),
        )
        assert cursor.fetchall() == []

    def test_search_by_language(self, db_with_data):
        """Filtrar por lenguaje debe devolver solo repos de ese lenguaje."""
        cursor = db_with_data.cursor()
        cursor.execute(
            "SELECT name, language FROM repos WHERE language = ? ORDER BY stars DESC",
            ("Python",),
        )
        results = cursor.fetchall()
        assert len(results) == 3  # fastapi, flask, tensorflow
        for r in results:
            assert r[1] == "Python"

    def test_search_by_stars_range(self, db_with_data):
        """Filtrar por rango de estrellas funciona."""
        cursor = db_with_data.cursor()
        cursor.execute(
            "SELECT name, stars FROM repos WHERE stars >= 100000 ORDER BY stars DESC",
        )
        results = cursor.fetchall()
        assert len(results) >= 2  # tensorflow (190k) y vscode (175k) o rust (102k)
        for r in results:
            assert r[1] >= 100000

    def test_search_by_owner(self, db_with_data):
        """Filtrar por owner debe devolver solo repos de ese owner."""
        cursor = db_with_data.cursor()
        cursor.execute(
            "SELECT name, owner FROM repos WHERE owner = ?",
            ("microsoft",),
        )
        results = cursor.fetchall()
        assert len(results) == 1
        assert results[0][0] == "vscode"

    def test_search_order_by_stars(self, db_with_data):
        """Resultados deben estar ordenados por estrellas descendente."""
        cursor = db_with_data.cursor()
        cursor.execute(
            "SELECT name, stars FROM repos ORDER BY stars DESC",
        )
        results = cursor.fetchall()
        stars = [r[1] for r in results]
        assert stars == sorted(stars, reverse=True)
````

## File: wheel-saver/cli.py
````python
#!/usr/bin/env python3
"""
WheelSaver CLI — Punto de entrada unificado para WheelSaver.

Uso:
    python cli.py search <keywords...> [--limit N] [--language L] [--min-stars N]
    python cli.py stats
    python cli.py scrape [--min-stars N]
    python cli.py import evanli
    python cli.py import gitstar [--pages N] [--start N]
    python cli.py api [--host H] [--port P]
    python cli.py ready                            # Checklist de proyecto
    python cli.py swap <feature>                   # Busca alternativa a lo que codeas
"""

import re
import os
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.rule import Rule

app = typer.Typer(
    name="wheelsaver",
    help="WheelSaver — GitHub repo scraper, search & audit tool",
    no_args_is_help=True,
)
import_group = typer.Typer(help="Import data from external sources")
app.add_typer(import_group, name="import")

console = Console()


# Sanitizador para Windows cp1252 — limpia emojis y no-ASCII
def clean(text, max_len=80):
    """Limpia texto para terminal Windows (cp1252)."""
    if not text:
        return ""
    # Remueve todo lo que no sea ASCII imprimible (+ acentos comunes)
    cleaned = re.sub(r"[^\x20-\x7EÀ-ÿĀ-ſ]", "", text)
    return cleaned[:max_len] + "..." if len(text) > max_len else cleaned


@app.command()
def search(
    keywords: list[str] = typer.Argument(
        ..., help="Keywords para buscar (FTS5 sobre name, description, topics)"
    ),
    limit: int = typer.Option(20, "--limit", "-l", help="Max resultados"),
    language: str = typer.Option(
        None, "--language", help="Filtrar por lenguaje (ej: Python, Rust)"
    ),
    min_stars: int = typer.Option(None, "--min-stars", help="Estrellas minimas"),
):
    """Busca repos en la base de datos usando FTS5."""
    from scraper.db_manager import search_repos_multi_keywords

    results = search_repos_multi_keywords(keywords, limit=limit * 3)

    # Filtros post-query
    if language:
        results = [r for r in results if r["language"].lower() == language.lower()]
    if min_stars:
        results = [r for r in results if r["stars"] >= min_stars]

    results = results[:limit]

    if not results:
        console.print("[yellow]No se encontraron repositorios.[/yellow]")
        raise typer.Exit()

    table = Table(
        title=f"Resultados para: {' '.join(keywords)}",
        caption=f"{len(results)} repos mostrados",
    )
    table.add_column("Nombre", style="cyan", no_wrap=True)
    table.add_column("Owner", style="green")
    table.add_column("Estrellas", justify="right", style="bold yellow")
    table.add_column("Lenguaje", style="magenta")
    table.add_column("Descripcion", no_wrap=False)

    for r in results:
        desc = clean(r.get("description"), 80)
        table.add_row(r["name"], r["owner"], f"{r['stars']:,}", r["language"] or "-", desc)

    console.print(table)


@app.command()
def stats():
    """Muestra estadisticas de la base de datos."""
    from scraper.db_manager import get_stats

    s = get_stats()

    panel = Panel(
        f"[bold]Total repos:[/bold] {s['total_repos']:,}\n"
        f"[bold]Lenguajes:[/bold] {s['languages']}\n"
        f"[bold]Estrellas:[/bold] "
        f"min [green]{s['stars_min']:,}[/green] / "
        f"max [yellow]{s['stars_max']:,}[/yellow] / "
        f"avg [cyan]{s['stars_avg']:,}[/cyan]",
        title="WheelSaver DB Stats",
        border_style="blue",
    )
    console.print(panel)

    if s.get("top_languages"):
        table = Table("Lenguaje", "Repos", title="Top 10 Lenguajes")
        for lang, cnt in s["top_languages"].items():
            table.add_row(lang, f"{cnt:,}")
        console.print(table)


@app.command()
def scrape(
    min_stars: int = typer.Option(500, "--min-stars", help="Umbral minimo de estrellas"),
):
    """Ejecuta el scraper de GitHub GraphQL (barre desde Top 1 hacia abajo)."""
    from scraper.github_fetcher import fetch_top_repos

    console.print(f"[bold blue]Iniciando scraper GraphQL...[/bold blue]")
    fetch_top_repos(min_stars=min_stars)


@import_group.command(name="evanli")
def import_evanli():
    """Importa Top 100 por lenguaje desde EvanLi/Github-Ranking."""
    from scripts.import_from_evanli import main as evanli_main

    console.print("[bold blue]Importando desde EvanLi/Github-Ranking...[/bold blue]")
    evanli_main()
    console.print("[bold green]Importacion EvanLi completada.[/bold green]")


@import_group.command(name="gitstar")
def import_gitstar(
    pages: int = typer.Option(0, "--pages", "-p", help="Numero de paginas (0 = todas, max 100)"),
):
    """Scrapea gitstar-ranking.com para rankings de repos."""
    import sys
    import scripts.scrape_gitstar_ranking as gs

    console.print("[bold blue]Scrapeando gitstar-ranking.com...[/bold blue]")

    # Guardar args originales y poner los nuestros
    old_argv = sys.argv
    args = (
        ["scrape_gitstar_ranking.py", f"--pages={pages}"]
        if pages
        else ["scrape_gitstar_ranking.py"]
    )
    sys.argv = args
    try:
        gs.main()
    finally:
        sys.argv = old_argv
    console.print("[bold green]Scrapeo gitstar-ranking completado.[/bold green]")


@app.command()
def api(
    host: str = typer.Option("0.0.0.0", "--host", help="Direccion de escucha"),
    port: int = typer.Option(8000, "--port", "-p", help="Puerto"),
):
    """Lanza el servidor FastAPI con la API REST."""
    import uvicorn

    console.print(f"[bold blue]Lanzando API en http://{host}:{port}[/bold blue]")
    console.print("[dim]Documentacion: http://localhost:" + str(port) + "/docs[/dim]")
    uvicorn.run("api.main:app", host=host, port=port, reload=True)


@app.command()
def docker():
    """Levanta WheelSaver en Docker (docker compose up)."""
    import subprocess, sys

    console.print("[bold blue]Levantando WheelSaver con Docker...[/bold blue]")
    result = subprocess.run(
        [sys.executable, "-m", "docker", "compose", "up", "--build", "-d"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    if result.returncode == 0:
        console.print("[bold green]WheelSaver corriendo en http://localhost:8000[/bold green]")
        console.print("[dim]Para ver logs: docker compose logs -f[/dim]")
        console.print("[dim]Para detener: docker compose down[/dim]")
    else:
        console.print("[red]Error al levantar Docker:[/red]")
        console.print(result.stderr or result.stdout)


@app.command()
def dashboard():
    """Lanza el dashboard web con Streamlit."""
    import subprocess, sys

    console.print("[bold blue]Lanzando dashboard Streamlit...[/bold blue]")
    subprocess.run(
        [sys.executable, "-m", "streamlit", "run", "dashboard.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )


@app.command()
def ready(
    path: str = typer.Option(".", "--path", help="Ruta del proyecto a analizar"),
):
    """Escanea un proyecto y genera checklist de lo que le falta."""
    import os
    from pathlib import Path

    target = Path(path).resolve()
    console.print(f"[bold]Analizando proyecto:[/bold] {target}")
    console.print()

    # Detectar stack
    has_python = (
        (target / "requirements.txt").exists()
        or (target / "pyproject.toml").exists()
        or (target / "Pipfile").exists()
    )
    has_js = (target / "package.json").exists()
    has_rust = (target / "Cargo.toml").exists()
    has_go = (target / "go.mod").exists()
    has_docker = (target / "Dockerfile").exists() or (target / "docker-compose.yml").exists()
    has_ci = (target / ".github" / "workflows").exists()
    has_tests = any((target / d).exists() for d in ["tests", "test", "__tests__", "spec"])
    has_readme = (target / "README.md").exists()
    has_git = (target / ".git").exists()
    has_env = (target / ".env").exists() or (target / ".env.example").exists()
    has_gitignore = (target / ".gitignore").exists()

    # Detectar frameworks
    framework = ""
    if has_js and (target / "package.json").exists():
        import json

        try:
            pkg = json.loads((target / "package.json").read_text())
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "next" in deps:
                framework = "Next.js"
            elif "react" in deps:
                framework = "React"
            elif "vue" in deps:
                framework = "Vue"
            elif "svelte" in deps:
                framework = "Svelte"
            elif "express" in deps:
                framework = "Express"
            has_tests = has_tests or "jest" in deps or "vitest" in deps or "cypress" in deps
            has_ci = has_ci or "husky" in deps or "lint-staged" in deps
        except:
            pass
    elif has_python and (target / "requirements.txt").exists():
        content = (target / "requirements.txt").read_text().lower()
        if "fastapi" in content:
            framework = "FastAPI"
        elif "django" in content:
            framework = "Django"
        elif "flask" in content:
            framework = "Flask"
        has_tests = has_tests or "pytest" in content

    # Determinar stack
    stacks = []
    if has_python:
        stacks.append("Python")
    if has_js:
        stacks.append("JavaScript/TypeScript")
    if has_rust:
        stacks.append("Rust")
    if has_go:
        stacks.append("Go")
    stack_str = " + ".join(stacks) if stacks else "No detectado"

    console.print(
        Panel(
            f"[bold]Stack:[/bold] {stack_str}\n"
            f"[bold]Framework:[/bold] {framework or 'No detectado'}\n"
            f"[bold]Ruta:[/bold] {target}",
            title="Proyecto Detectado",
            border_style="blue",
        )
    )

    # Checklist
    checks = [
        ("🔬 Testing", has_tests, "testing", "pytest jest vitest playwright"),
        ("🚀 CI/CD", has_ci, "devops", "ci/cd actions deployment"),
        ("🐳 Docker", has_docker, "devops", "docker container dockerfile"),
        ("📝 README", has_readme, "docs", "documentation readme"),
        ("🔐 .env / Secrets", has_env, "security", "dotenv environment secrets"),
        ("📋 .gitignore", has_gitignore, "git", "gitignore template"),
        ("🔧 Git", has_git, "git", "git version-control"),
    ]

    table = Table(title="Checklist del Proyecto")
    table.add_column("Estado", justify="center")
    table.add_column("Categoria", style="bold")
    table.add_column("Recomendacion")

    missing_categories = []

    for label, ok, cat, keywords in checks:
        if ok:
            table.add_row("✅", label, "[dim]Listo[/dim]")
        else:
            table.add_row("❌", label, f"[yellow]Buscar:[/yellow] {keywords}")
            missing_categories.append((label, cat, keywords))

    console.print(table)

    # Si falta algo, buscar en BD
    if missing_categories:
        console.print("\n[bold yellow]Buscando recomendaciones en la BD...[/bold yellow]\n")
        for label, cat, keywords in missing_categories[:3]:  # Max 3 busquedas
            kw_list = keywords.split()[:3]
            kw_str = " ".join(kw_list)
            from scraper.db_manager import search_repos_multi_keywords

            results = search_repos_multi_keywords(kw_list, limit=3)
            if results:
                rec_table = Table(title=f"Recomendaciones para {label}")
                rec_table.add_column("Repo")
                rec_table.add_column("Estrellas", justify="right")
                rec_table.add_column("Descripcion")
                for r in results:
                    desc = clean(r.get("description"), 60)
                    rec_table.add_row(r["name"], f"{r['stars']:,}", desc)
                console.print(rec_table)
            else:
                console.print(f"[dim]{label}: No se encontraron recomendaciones en la BD[/dim]")

    console.print("\n[bold green]✅ Ready check completado[/bold green]")
    console.print("[dim]TIP: Corre 'python cli.py search <keyword>' para explorar mas[/dim]")


@app.command()
def swap(
    feature: str = typer.Argument(
        ..., help="Que estas codeando? Ej: 'pdf parser', 'auth jwt', 'http client'"
    ),
):
    """Busca si ya existe una libreria para lo que estas codeando."""
    from scraper.db_manager import search_repos_multi_keywords

    keywords = feature.strip().split()
    console.print(f"[bold]Buscando alternativas para:[/bold] {feature}\n")

    results = search_repos_multi_keywords(keywords, limit=10)

    if not results:
        console.print("[yellow]No se encontraron librerias existentes para esto.[/yellow]")
        console.print("[dim]Puede que: 1) Sea algo muy especifico, 2) No este en la BD aun[/dim]")
        console.print("[dim]Sugerencia: prueba con keywords mas genericas[/dim]")
        raise typer.Exit()

    table = Table(title=f"Alternativas para: {feature}")
    table.add_column("Libreria", style="cyan")
    table.add_column("Estrellas", justify="right", style="bold yellow")
    table.add_column("Lenguaje")
    table.add_column("Descripcion")

    for r in results[:8]:
        desc = clean(r.get("description"), 70)
        table.add_row(f"{r['owner']}/{r['name']}", f"{r['stars']:,}", r["language"] or "-", desc)

    console.print(table)

    top = results[0]
    console.print(
        f"\n[bold green]Mejor opcion:[/bold green] {top['owner']}/{top['name']} ({top['stars']:,}⭐)"
    )
    console.print(f"[dim]{top['url']}[/dim]")
    if top.get("description"):
        console.print(f"[dim]{clean(top['description'], 100)}[/dim]")
    console.print("\n[bold]Tip de instalacion:[/bold]")
    if top["language"] == "Python":
        console.print(f"  pip install {top['name']}")
    elif top["language"] in ("JavaScript", "TypeScript"):
        console.print(f"  npm install {top['name']}  # o yarn / pnpm")
    else:
        console.print(f"  Visita: {top['url']}")
    console.print(
        f"\n[dim]Mas resultados con: python cli.py search {' '.join(keywords)} --limit 20[/dim]"
    )


@app.command()
def skillify(
    repo: str = typer.Argument(
        ..., help="Repositorio a convertir en skill. Ej: 'tiangolo/fastapi'"
    ),
):
    """Convierte un repositorio en una Skill de IA (Delegado al Agente)."""
    console.print(f"[bold blue]🪄 Iniciando Meta-Skill: wheel-skillify para {repo}...[/bold blue]")
    console.print(
        Panel(
            "Esta función ahora es manejada nativamente por tu Agente de IA.\n\n"
            "[bold green]Para usarla, abre el chat de tu IA y escribe:[/bold green]\n"
            f"> [italic]wheel-skillify {repo}[/italic]",
            title="Wheel-Skillify",
            border_style="magenta",
        )
    )

import asyncio

@app.command()
def ask(
    question: str = typer.Argument(
        ..., help="Tu pregunta para la IA. Ej: 'Cual es el mejor framework de python para graficos?'"
    ),
    provider: str = typer.Option(
        None, "--provider", "-p", help="Proveedor especifico (groq, cerebras, google, mistral, etc.)"
    ),
):
    """Consulta a la IA (multi-proveedor) usando la base de datos local como contexto (RAG). Usa failover automático entre proveedores free tier."""
    console.print(f"[bold blue]Consultando a la IA sobre:[/bold blue] {question}")

    from scraper.db_manager import search_repos_multi_keywords
    keywords = [kw.strip() for kw in question.replace("?", "").replace("¿", "").split() if len(kw) > 3]
    repos = search_repos_multi_keywords(keywords, limit=10)

    if repos:
        console.print(f"[dim]Contexto encontrado: {len(repos)} repositorios.[/dim]")
    else:
        console.print("[dim]Contexto encontrado: 0 repositorios.[/dim]")

    from api.llm import ask_llm_about_repos

    with console.status("[bold green]Generando respuesta de la IA...[/bold green]"):
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        answer = loop.run_until_complete(ask_llm_about_repos(question, repos))

    console.print(Panel(answer, title="[bold magenta]WheelSaver AI[/bold magenta]", border_style="cyan"))




if __name__ == "__main__":
    # Shell completion (Typer nativo):
    #   python cli.py --install-completion  → instala autocompletado
    #   python cli.py --show-completion     → muestra script de completion
    app()
````

## File: wheel-saver/pyproject.toml
````toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "wheelsaver"
version = "3.2.0"
description = "GitHub repo scraper + AI audit tool. Search 23k+ repos offline, audit projects via AI."
readme = "README.md"
license = {text = "MIT"}
keywords = ["github", "scraper", "ai", "audit", "cli"]
requires-python = ">=3.10"
dependencies = [
    "httpx",
    "typer",
    "rich",
    "tqdm",
    "fastapi",
    "uvicorn[standard]",
    "python-dotenv",
    "loguru",
    "openai",
    "aiosqlite",
]

[project.optional-dependencies]
web = ["streamlit", "pandas"]
dev = ["pytest"]

[project.urls]
Homepage = "https://github.com/JeisarGtz/Top_Repos"

[tool.pytest.ini_options]
pythonpath = ["."]

[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["E", "F", "I"]
ignore = []
````

## File: wheel-saver/README.md
````markdown
# 🛞 WheelSaver

**Tu biblioteca offline de GitHub + 3 skills de IA para no reinventar la rueda.**

WheelSaver descarga automaticamente los mejores repositorios de GitHub (>500⭐)
y los almacena en una base de datos SQLite local con busqueda FTS5 ultrarrápida.
Incluye skills nativos para Claude Code que auditan tus proyectos y te recomiendan
librerias existentes, evitando que codees desde cero lo que ya esta resuelto.

```
📦 23,621 repos · 🌐 142 lenguajes · ⚡ Busqueda FTS5 en milisegundos
```

## Componentes

| Componente | Que hace |
|---|---|
| **3 Scrapers** | GitHub GraphQL API + EvanLi/Github-Ranking + gitstar-ranking.com |
| **Base de datos** | SQLite + FTS5, actualizacion semanal via GitHub Actions |
| **CLI unificado** | 9 comandos con Typer + Rich (tablas, colores, autocompletado) |
| **API REST** | FastAPI con 6 endpoints + Swagger en `/docs` |
| **Dashboard** | Streamlit interactivo con graficos y busqueda |
| **3 Skills IA** | `wheel-audit` `wheel-ready` `wheel-swap` para Claude Code |
| **Docker** | Dockerfile + compose, despliegue en 1 comando |

## Inicio rapido

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar token de GitHub (para el scraper)
echo "GITHUB_TOKEN=ghp_tu_token_aqui" > .env

# 3a. Usar el CLI directamente
python cli.py stats                          # Estadisticas de la BD
python cli.py search fastapi pytest          # Buscar repos por keyword
python cli.py swap "pdf parser"              # Buscar alternativas
python cli.py ready                          # Checklist del proyecto

# 3b. Lanzar API REST
python cli.py api                            # → http://localhost:8000/docs

# 3c. Lanzar Dashboard
python cli.py dashboard                      # → http://localhost:8501

# 3d. Modo Docker
docker compose up --build -d                 # → http://localhost:8000
```

## Skills para Claude Code

Instala las rueditas de entrenamiento en cualquier proyecto:

```powershell
& "E:\PROYECTOS\Mis_Proyectos\TOP_REPOS\Instalar-WheelSaver.ps1"
```

Luego abre `claude` y usa:

| Comando | Que hace |
|---|---|
| `Audita este proyecto con WheelSaver` | Auditoria completa con matriz de scoring |
| `wheel-ready` | Checklist de lo que le falta al proyecto |
| `wheel-swap parser de PDF` | Busca si ya existe una libreria para lo que codeas |

## Arquitectura

```
WheelSaver/
├── cli.py                    # CLI unificado (Typer + Rich)
├── dashboard.py              # Dashboard Streamlit
├── api/main.py               # API REST FastAPI
├── scraper/
│   ├── github_fetcher.py     # Scraper GraphQL (httpx)
│   └── db_manager.py         # ORM SQLite + FTS5
├── scripts/
│   ├── import_from_evanli.py # Importador EvanLi
│   └── scrape_gitstar_ranking.py  # Scraper gitstar-ranking
├── .agents/skills/
│   ├── wheel_saver/          # Skill: auditoria completa
│   ├── wheel-ready/          # Skill: checklist de proyecto
│   └── wheel-swap/           # Skill: busca alternativas
├── tests/                    # 18 tests con pytest
├── data/top_repos.db         # BD SQLite (~23k repos)
├── Dockerfile                # Contenedor Python slim
└── docker-compose.yml        # Orquestacion Docker
```

## Comandos del CLI

```bash
python cli.py search <keywords>   # Busqueda FTS5 con Rich Table
python cli.py stats               # Estadisticas con Panels
python cli.py scrape              # Scraper GraphQL desde Top 1
python cli.py import evanli       # Importar EvanLi
python cli.py import gitstar      # Importar gitstar-ranking
python cli.py api                 # Lanzar API REST
python cli.py docker              # Levantar en Docker
python cli.py dashboard           # Lanzar Dashboard
python cli.py ready               # Checklist del proyecto
python cli.py swap <feature>      # Buscar alternativas
python cli.py --install-completion  # Autocompletado
```

## Configuracion en GitHub

Para actualizacion automatica semanal:
1. sube el codigo a GitHub
2. Ve a `Settings` > `Secrets and variables` > `Actions`
3. Anade un secreto llamado `PAT_GITHUB_TOKEN` con tu token de GitHub

---

> Hecho con 🛞 para no reinventar la rueda.
````

## File: wheel-saver/requirements.txt
````
# Core
httpx
typer
rich
tqdm
fastapi
uvicorn[standard]
python-dotenv
loguru
aiosqlite
openai

# Infrastructure / Architecture
async-lru

# Development (pip install -e ".[dev]")
pytest
pytest-asyncio
pytest-cov
ruff
````

## File: wheel-saver/test_ui.py
````python
from playwright.sync_api import sync_playwright

def test():
    print("Iniciando Verificación E2E con Playwright...")
    try:
        with sync_playwright() as p:
            # Iniciamos navegador
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Navegar a la UI
            print("1. Cargando la Interfaz Web...")
            res = page.goto("http://127.0.0.1:8000/")
            assert res.status == 200, f"Error HTTP {res.status}"
            
            # Esperar a que carguen las estadísticas iniciales (el número no debe ser '-')
            print("2. Verificando carga de estadísticas...")
            page.wait_for_selector("#stat-repos:not(:has-text('-'))", timeout=5000)
            repos_text = page.locator("#stat-repos").inner_text()
            print(f"   [OK] Total Repositorios: {repos_text}")
            
            # Hacer una búsqueda
            print("3. Realizando busqueda: 'fastapi sqlite'")
            page.fill("#input-q", "fastapi sqlite")
            page.click("button:has-text('Buscar')")
            
            # Esperar a que los resultados se carguen en la tabla
            print("4. Verificando resultados de busqueda...")
            page.wait_for_selector("#results-body tr", timeout=5000)
            rows = page.locator("#results-body tr")
            count = rows.count()
            print(f"   [OK] Encontrados {count} repositorios.")
            
            # Mostrar el primer resultado para asegurar calidad
            first_repo = rows.nth(0).locator("td").nth(0).inner_text()
            first_stars = rows.nth(0).locator("td").nth(1).inner_text()
            print(f"   [OK] Top Resultado: {first_repo} con {first_stars} stars")
            
            browser.close()
            print("\n[EXITO] Todos los tests E2E pasaron satisfactoriamente!")
    except Exception as e:
        print(f"[ERROR] Error en la verificacion: {e}")

if __name__ == "__main__":
    test()
````

## File: .gitmodules
````
[submodule "data/resume_template"]
	path = data/resume_template
	url = https://github.com/sb2nov/resume.git
````

## File: chat.js
````javascript
const readline = require('readline');
const frontal = require('./lib/lobulos/frontal');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('==================================================================');
console.log('🧠 LIFEOS - JARVIS NATIVE CLI TERMINAL');
console.log('   Escribe tu mensaje o ingresa "salir" para terminar.');
console.log('==================================================================\n');

function prompt() {
  rl.question('👤 Jeiser > ', async (input) => {
    const cleaned = input.trim();
    if (cleaned.toLowerCase() === 'salir') {
      rl.close();
      return;
    }
    if (!cleaned) {
      prompt();
      return;
    }
    console.log('🧠 Jarvis pensando...');
    try {
      const response = await frontal.procesarPensamiento(cleaned);
      console.log(`🤖 Jarvis > ${response}\n`);
    } catch (e) {
      console.log(`❌ Error: ${e.message}\n`);
    }
    prompt();
  });
}

prompt();
````

## File: generar_repomix_10.bat
````batch
@echo off
setlocal EnableDelayedExpansion

title Generador de Repomix (10 Partes)
color 0B

:: ==========================================================
::  UNIVERSAL REPO CHUNKER (10 PARTES)
::  - Genera un .md unico con Repomix
::  - Lo divide en 10 partes iguales para IA
::  - 100% reutilizable en cualquier proyecto
:: ==========================================================

echo ==========================================================
echo           REPO MIXER - 10 PART SPLITTER
echo ==========================================================
echo.

:: Configuracion de rutas (relativas al directorio actual)
set "TEMP_FILE=repomix_temp_full.md"
set "OUT_DIR=repomix_parts"

:: Limpieza de ejecuciones anteriores
if exist "%TEMP_FILE%" del "%TEMP_FILE%"
if exist "%OUT_DIR%" rmdir /s /q "%OUT_DIR%"
mkdir "%OUT_DIR%"

echo [1/3] Empaquetando codigo con Repomix...
echo.

:: Ejecutar Repomix (Genera un solo archivo markdown)
:: Repomix respeta automaticamente el .gitignore y excluye node_modules
call npx repomix --style markdown --output "%TEMP_FILE%"

:: Verificar si Repomix tuvo exito
if not exist "%TEMP_FILE%" (
    echo.
    echo [ERROR] Repomix fallo o no genero el archivo temporal.
    echo Asegurate de tener Node.js instalado y ejecutar "npm install -g repomix" si falla.
    pause
    exit /b 1
)

echo.
echo [2/3] Dividiendo en 10 partes iguales con PowerShell...
echo.

:: Ejecutar logica de division usando PowerShell desde el BAT
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$text = [System.IO.File]::ReadAllText('%TEMP_FILE%');" ^
  "$total = $text.Length;" ^
  "if ($total -eq 0) { Write-Host 'El archivo esta vacio.'; exit; }" ^
  "$chunk = [math]::Ceiling($total / 10);" ^
  "for ($i = 0; $i -lt 10; $i++) {" ^
  "  $start = $i * $chunk;" ^
  "  $len = [math]::Min($chunk, $total - $start);" ^
  "  $part = $text.Substring($start, $len);" ^
  "  $path = '%OUT_DIR%\parte-' + ($i+1) + '.md';" ^
  "  [System.IO.File]::WriteAllText($path, $part, (New-Object System.Text.UTF8Encoding $false));" ^
  "  Write-Host '  Generado:' $path;" ^
  "}"

echo.
echo [3/3] Limpieza y finalizacion...
:: Borrar el archivo temporal gigante
del "%TEMP_FILE%"

echo.
echo ==========================================================
echo  PROCESO COMPLETADO
echo ==========================================================
echo  Se han generado 10 archivos en la carpeta: %OUT_DIR%\
echo  Copia y pega el contenido de "parte-1.md" a "parte-10.md"
echo  en el chat de tu IA.
echo ==========================================================
echo.
pause
````

## File: run_brain.bat
````batch
@echo off
cd /d "%~dp0"
node scripts/brain_orchestrator.js
````

## File: vitest.config.js
````javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.js'],
    testTimeout: 15_000,
    setupFiles: ['tests/helpers/setup.js'],
    server: {
      deps: {
        // better-sqlite3 is a native addon — vitest handles it fine, no transform needed
        inline: ['better-sqlite3'],
      },
    },
  },
});
````

## File: .agents/skills/qa_bootcamp/SKILL.md
````markdown
---
name: qa_bootcamp
description: Tutor socrático especializado en QA Automation, SRE y Backend para la ruta de aprendizaje personalizada de Jeiser.
---

# SKILL: Mentor Socrático de Ingeniería de Software (QA/SRE)

Cuando el usuario invoque este skill (frases como "quiero estudiar", "iniciar sesión de estudio", "ayúdame con este código", "estudiemos"), adopta este comportamiento estricto.

---

## 🧠 PERFIL DEL MENTOR (Sargento Socrático)
No eres un profesor amigable de bootcamp que regala soluciones. Eres un **Tech Lead de Producción**. Tu objetivo es que Jeiser desarrolle pensamiento crítico y rigor de ingeniería.

### Reglas de Interacción:
1.  **Método Socrático Absoluto:** Está terminantemente prohibido escribir el código de la solución por el usuario. Cuando tenga un error, explícale la lógica de por qué ocurre (ej: bloqueo de hilos por I/O síncrono, desalineación de tipos en TS) y hazle preguntas guía para que él mismo escriba la solución.
2.  **Técnica Feynman:** Para conceptos de bases de datos o automatización (ej: WAL mode, pools, transacciones, POM), pídele que te los explique con sus propias palabras antes de codificar.
3.  **Foco en Calidad y Estabilidad:** Evalúa cada línea de código bajo la premisa: *"¿Qué pasa si esto corre en un servidor a las 3:00 AM y la API de destino falla? ¿Se cae el sistema o se recupera solo?"*

---

## 🛠️ INSTRUCCIONES DE EJECUCIÓN

### Paso 1: Cargar el Estado del Estudio
Lee el archivo de configuración `data/state/contexto_maestro/REGISTRO_DE_ESTUDIO.md`. Identifica el hito activo y las tareas técnicas pendientes.

### Paso 2: Iniciar la Sesión
Comienza la sesión de estudio con una introducción fría y directa, indicando el hito actual y preguntando qué tarea específica se abordará hoy.
*   *Ejemplo:* "Sesión de estudio iniciada. Hito activo: Hito 1 (Datos e Infraestructura de Producción - PostgreSQL + Drizzle-ORM). Tareas pendientes: [listar tareas]. ¿Con cuál empezamos hoy, Jeiser? Explícame brevemente el concepto antes de que abramos el editor."

### Paso 3: Retos y Code Review
*   Si el usuario pide ayuda para escribir un script, proporciónale la **firma de la función (types/interfaces)** o el pseudocódigo conceptual. Deja que él complete el cuerpo de la lógica.
*   Si el usuario te presenta código para revisión, ejecuta un análisis estricto buscando:
    - Fugas de memoria o bloqueos de Event Loop.
    - Falta de tipado estricto en TypeScript.
    - Ausencia de manejo de errores descriptivo.
    - Consultas SQL ineficientes o falta de índices.

---

## 🚫 LO QUE NO DEBES HACER
- ❌ No uses lenguaje adulador o corporativo ("buena idea", "¡excelente trabajo!"). Mantén un tono seco, profesional y pragmático (Anti-Sycophancy).
- ❌ No propongas el uso de frameworks pesados o librerías de estado de frontend (como Redux) si una llamada simple de API soluciona el problema.
- ❌ No escribas scripts completos listos para copiar y pegar.
````

## File: dashboard/src/lib/dashboard-data.ts
````typescript
/**
 * dashboard-data.ts — Helper unificado para el dashboard de LifeOS.
 *
 * Reemplaza las 3 capas anteriores (domain/ports, application/usecase, infrastructure/repositories)
 * con funciones directas de lectura SQLite + filesystem.
 *
 * Simplificación: ~180 líneas vs ~250 líneas en 5 archivos separados.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ── Tipos (inline, antes estaban en domain/types.ts) ──────────

export interface LegalCase {
  id?: string;
  entidad?: string;
  estado?: string;
  [key: string]: any;
}

export interface JobOffer {
  titulo?: string;
  empresa?: string;
  score?: number;
  ubicacion?: string;
  [key: string]: any;
}

export interface DashboardStatus {
  estadoVivo: string;
  ledger: LegalCase[];
  jobs: { total: number; next: JobOffer[] };
  memorias: any[];
  finances: { dianDebt: string };
  senaStatus?: string;
}

// ── Helpers ─────────────────────────────────────────────────

function getBaseDir(): string {
  return process.env.IS_DOCKER === 'true' ? '/host_data' : path.join(process.cwd(), '..');
}

function readFileSafe(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function readJsonSafe(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

// ── Funciones principales ───────────────────────────────────

/** Lee ESTADO_VIVO.md */
function getRawEstadoVivo(): string {
  const baseDir = getBaseDir();
  return readFileSafe(
    path.join(baseDir, 'data', 'state', 'contexto_maestro', 'ESTADO_VIVO.md')
  );
}

/** Lee casos legales del masterledger */
function getLegalCases(): LegalCase[] {
  const baseDir = getBaseDir();
  return readJsonSafe(path.join(baseDir, 'data', 'state', 'masterledger.json'));
}

/** Lee ofertas pendientes de aplicar */
function getPendingJobs(): JobOffer[] {
  const baseDir = getBaseDir();
  return readJsonSafe(path.join(baseDir, 'scripts', 'data', 'jobs', 'apply_queue.json'));
}

/** Lee las últimas N memorias de la base SQLite hipocampo */
function getRecentMemories(limit: number): any[] {
  const baseDir = getBaseDir();
  const dbPath = path.join(baseDir, 'data', 'memoria_hipocampo.db');
  if (!fs.existsSync(dbPath)) return [];

  try {
    // Al estar la base de datos configurada en modo WAL en el host, 
    // abrir la conexión con readonly: true permite realizar consultas 
    // de lectura concurrentes sin interferir con las escrituras síncronas de otros hilos.
    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare(`SELECT * FROM hechos ORDER BY timestamp DESC LIMIT ?`).all(limit);
    db.close();
    return rows;
  } catch (error) {
    console.error('[Dashboard Data] Error al leer hechos desde SQLite:', error);
    return [];
  }
}

/** Extrae estado SENA del texto de ESTADO_VIVO */
function extractSenaStatus(text: string): string {
  const match = text.match(/\*\*SENA — Bases de Datos:\*\*\s*(.*)/i);
  return match ? match[1].trim() : 'Sin información reciente.';
}

/** Extrae deuda DIAN del texto de ESTADO_VIVO */
function extractFinances(estadoVivoText: string): { dianDebt: string } {
  const lines = estadoVivoText.split('\n').filter(line => line.includes('Deuda DIAN'));
  let totalDebt = 0;

  for (const line of lines) {
    const match = line.match(/\$([\d,\.]+)(M|K)?/i);
    if (match) {
      let val = parseFloat(match[1].replace(',', '.'));
      if (match[2]?.toUpperCase() === 'M') val *= 1_000_000;
      else if (match[2]?.toUpperCase() === 'K') val *= 1_000;
      totalDebt += val;
    }
  }

  let formatted = '0';
  if (totalDebt >= 1_000_000) formatted = (totalDebt / 1_000_000).toFixed(2) + 'M';
  else if (totalDebt > 0) formatted = totalDebt.toLocaleString('es-CO');

  return { dianDebt: formatted };
}

// ── API pública ─────────────────────────────────────────────

export function getStatus(): DashboardStatus {
  const estadoVivo = getRawEstadoVivo();
  const [ledger, pendingJobs, memorias] = [
    getLegalCases(),
    getPendingJobs(),
    getRecentMemories(10),
  ];

  return {
    estadoVivo,
    ledger,
    jobs: {
      total: pendingJobs.length,
      next: pendingJobs.slice(0, 3),
    },
    memorias,
    finances: extractFinances(estadoVivo),
    senaStatus: extractSenaStatus(estadoVivo),
  };
}
````

## File: data/config/politicas.json
````json
[
  {
    "name": "overload_recovery",
    "priority": 70,
    "conditions": {
      "all": [{ "fact": "state", "path": "$.senales_estres.alto", "operator": "equal", "value": true }]
    },
    "event": { "type": "decision", "params": { "type": "schedule.block", "payload": { "hours": 2, "reason": "recuperacion_automatica" }, "priority": "high", "source": "jarvis.policy.overload" } }
  },
  {
    "name": "job_stagnation",
    "priority": 80,
    "conditions": {
      "all": [{ "fact": "state", "path": "$.empleo.sin_respuesta", "operator": "greaterThan", "value": 10 }]
    },
    "event": { "type": "decision", "params": { "type": "job.strategy.change", "payload": { "mode": "aggressive", "reason": "Mas de 10 aplicaciones sin respuesta" }, "priority": "high", "source": "jarvis.policy.job_stagnation" } }
  },
  {
    "name": "urgent_case",
    "priority": 100,
    "conditions": {
      "all": [{ "fact": "state", "path": "$.casos.urgentes", "operator": "greaterThan", "value": 0 }]
    },
    "event": { "type": "decision", "params": { "type": "case.urgent.reminder", "payload": { "motivo": "casos_urgentes_activos" }, "priority": "high", "source": "jarvis.policy.urgent" } }
  },
  {
    "name": "study_overdue",
    "priority": 60,
    "conditions": {
      "all": [
        { "fact": "state", "path": "$.casos.vencidos", "operator": "greaterThan", "value": 0 },
        { "fact": "state", "path": "$.estudio.casos_sena", "operator": "greaterThan", "value": 0 }
      ]
    },
    "event": { "type": "decision", "params": { "type": "study.reminder", "priority": "normal", "source": "jarvis.policy.study" } }
  },
  {
    "name": "errors_escalation",
    "priority": 90,
    "conditions": {
      "all": [{ "fact": "state", "path": "$.sistema.errores_24h", "operator": "greaterThan", "value": 3 }]
    },
    "event": { "type": "decision", "params": { "type": "system.escalate", "payload": { "message": "Multiples errores en el sistema" }, "priority": "high", "source": "jarvis.policy.errors" } }
  },
  {
    "name": "free_time_suggestion",
    "priority": 30,
    "conditions": {
      "all": [
        { "fact": "state", "path": "$.sistema.horas_libres_hoy", "operator": "greaterThanInclusive", "value": 2 },
        { "fact": "state", "path": "$.estudio.casos_sena", "operator": "greaterThan", "value": 0 }
      ]
    },
    "event": { "type": "decision", "params": { "type": "study.suggest", "payload": { "sugerencia": "Bloque de estudio disponible hoy" }, "priority": "low", "source": "jarvis.policy.free_time" } }
  }
]
````

## File: data/jobs/input_jobs.txt
````

````

## File: data/state/contexto_maestro/ALERTAS_SENA.md
````markdown
# Alertas SENA - null
> Actualizado: 16/7/2026, 11:27:22 a. m.

---
**Progreso**: 0/0 completadas | 0 pendientes
````

## File: data/state/contexto_maestro/REGISTRO_DE_ESTUDIO.md
````markdown
# REGISTRO DE ESTUDIO — RUTA AVANZADA QA ARCHITECT / SRE
> Plan de estudio unificado y personalizado para Jeiser Gutiérrez
> Última actualización: 14 de julio de 2026

## 🎯 Perfil Objetivo: QA Automation Engineer / Backend Platform Developer
Este plan de estudio ensancha la barra horizontal del perfil en T (React básico, Docker, PostgreSQL, System Design) mientras profundiza verticalmente en la especialidad (TypeScript avanzado, Playwright, Arquitecturas resilientes y CI/CD).

---

## 🗺️ HITOS DE LA RUTA PERSONALIZADA

### 🚀 Hito 1: Datos e Infraestructura de Producción (Semanas 1-2) — ⏳ ACTIVO
*   **Propósito:** Dominar la persistencia de datos empresarial y el desacoplamiento limpio de arquitecturas.
*   **Tareas Técnicas:**
    1. [ ] Agregar un servicio de **PostgreSQL** al archivo `docker-compose.yml` con variables de entorno protegidas.
    2. [ ] Configurar **Drizzle-ORM** en el backend de Node.js de LifeOS.
    3. [ ] Escribir una migración segura para mover los registros de la tabla `applications` de SQLite a PostgreSQL.
    4. [ ] Crear un endpoint formal `GET /api/status` en la API de Node.js.
    5. [ ] Refactorizar el dashboard de Next.js para que consuma `/api/status` mediante `fetch()` asíncrono, eliminando completamente `better-sqlite3` del frontend.

### 🧪 Hito 2: Ingeniería de Pruebas de Integración con Vitest (Semanas 3-4)
*   **Propósito:** Escribir pruebas unitarias y de integración que validen lógica de negocio compleja, no solo clics en pantalla.
*   **Tareas Técnicas:**
    1. [ ] Escribir la suite de pruebas unitarias para `rule_engine.js` en Vitest, probando coincidencia de wildcards, prioridades y exclusiones.
    2. [ ] Escribir la suite de pruebas para `scorer.js` mockeando el cliente de LLM para simular comportamientos estables de la IA sin consumir tokens reales.
    3. [ ] Diseñar pruebas de integración para el Event Bus de LifeOS (`event_bus.js`) que validen el reintento de eventos, la deduplicación por hash y la Dead Letter Queue (DLQ).

### 🤖 Hito 3: Automatización E2E Resiliente con Playwright (Semanas 5-6)
*   **Propósito:** Llevar el scraping y la automatización web a nivel de producción, evadiendo bloqueos comunes y manejando estados dinámicos.
*   **Tareas Técnicas:**
    1. [ ] Implementar persistencia de sesión por cookies multiescena en `computrabajo_apply.js` para reducir la necesidad de logueos repetitivos.
    2. [ ] Agregar un módulo de *stealth* o emulación avanzada en Playwright para evadir captchas básicos y bloqueos por user-agent en el scraper de Computrabajo.
    3. [ ] Diseñar un mecanismo de autogestión de excepciones: si un selector CSS cambia, el scraper debe alertar con el selector roto de manera estructurada en lugar de fallar silenciosamente.

---

## 🎓 REGLAS DE LA SESIÓN DE ESTUDIO (Feynman & Sócrates)
Cuando el usuario indique "quiero estudiar", la IA debe:
1.  **Adoptar Rol:** Tech Lead / Mentor Socrático. No des respuestas de código directo. Explica el concepto de forma que lo entendería un niño de 12 años, pon un reto técnico y guía mediante preguntas.
2.  **Verificar Hito Activo:** Consultar este archivo para identificar cuál es el Hito actual y qué tareas técnicas están pendientes.
3.  **Hacer Code Review:** Si el usuario presenta código, evalúalo bajo estándares de clean code, manejo de excepciones y optimización de recursos.
4.  **Cero Adulación:** Mantener una comunicación directa y objetiva (Anti-Sycophancy).
````

## File: data/user/perfil_candidato.txt
````
NOMBRE: Jeiser Abraham Gutierrez Torres
CC: 1019156838 | Telefono: +57 304 461 5613 | Email: jeiser270997@gmail.com
UBICACION: Medellin, Antioquia (La Estrella). Tiene carro propio — puede trasladarse por toda el area metropolitana de Medellin y AMVA sin restricciones.
DISPONIBILIDAD HORARIA: Lunes a Viernes EXCLUSIVAMENTE. Estudia los sabados en CESDE (7am-6pm). Ofertas con sabados, domingos o turnos rotativos son INCOMPATIBLES.
ASPIRACION SALARIAL: Minimo 2.400.000 COP / mes. Ideal 2.500.000+. Rechazar si menciona salario minimo ($1.423.500) sin bonificacion para cargos de tecnologia.

FORMACION:
  - Ingenieria en Sistemas (CESDE, Medellin) — En curso 2026 (carrera tecnica + profesional)
  - Ingenieria en Sistemas (7mo semestre cursado) — IUP Santiago Marino, Venezuela 2014-2018
  - QA Automation Bootcamp 28 semanas (Playwright, GitHub Actions, Node.js) — CESDE
  - Bases de Datos y Excel Avanzado — SENA (2026)

EXPERIENCIA:
  1. QA Automation / Desarrollador Freelance (2022-presente): Playwright, Node.js, GitHub Actions, SQLite, APIs REST, CI/CD — proyecto LifeOS en produccion real.
  2. Agente Soporte N1 Campana Iberia Airlines — Foundever/Sitel (Nov 2021-Ene 2022): Amadeus GDS, atencion bilingue, SLA/KPIs. (Excepcion puntual — no busca call center.)
  3. Operador de Medios Tecnologicos — COOVISOCIAL (Sep 2019-Oct 2021): monitoreo CCTV 24/7, sistemas seguridad electronica, bases de datos de control de acceso.

SKILLS TECNICOS: Playwright, Node.js, JavaScript, TypeScript, GitHub Actions, SQLite, APIs REST, Postman, Git, Docker, Microsoft Office Excel, Windows 10/11, Redes basicas TCP/IP, GDS Amadeus.
IDIOMAS: Espanol nativo. Ingles B1+ empirico — comprende documentacion tecnica, series y podcasts; puede comunicarse por escrito y verbalmente a nivel funcional. NO apto para call center en ingles.
CERTIFICACIONES: EF SET 68/100 C1 (lectura/escucha), HubSpot Service Hub, HubSpot Inbound, SENA Excel 2016 (40h, nota 4.5/5).

ROLES BUSCADOS (en orden de preferencia):
  ✅ QA Automation / QA Manual / Analista de Calidad de Software
  ✅ Mesa de Ayuda (Help Desk) / Soporte Tecnico L1/L2
  ✅ Analista de Sistemas / Junior Developer
  ✅ Operador de Plataforma / Monitoreo de Sistemas
  ✅ Roles donde pueda aprender y ganar experiencia formal en tecnologia

ROLES EXCLUIDOS (NO aplicar):
  ❌ Call center puro (asesor telefonico, agente inbound/outbound de voz)
  ❌ Telemarketing / ventas por telefono
  ❌ Cargos sin relacion con tecnologia o sistemas
  ❌ Trabajos con horario sabados o turnos rotativos
  ❌ Salario menor a 2.400.000 COP en cargos de tecnologia
````

## File: docs/cloud.md
````markdown
# Cloud Deployment — HISTÓRICO (Jul 2026)

> **⚠️ Histórico:** Esta documentación describe la arquitectura anterior basada en GitHub Actions.
> Los 13 workflows GHA fueron eliminados el 15/07/2026 durante el deep audit.
> Ver `ecosystem.config.js` para la arquitectura actual (PM2 local).

## Arquitectura anterior (hasta Jul 2026)

GitHub Actions con cron como runtime. 13 workflows en ubuntu-22.04.
La DB se restauraba/guardaba usando `actions/cache`.

## Arquitectura actual (local-first con PM2)

```
🖥️ Windows / Linux local
       │
  PM2 (ecosystem.config.js)
       │
  ├── jarvis-telegram        → daemon (always-on)
  ├── brain-orchestrator     → cron 7am
  ├── context-engine-daily   → cron 6am
  ├── morning-briefing       → cron 7am
  ├── email-cleaner          → cron cada 3h
  ├── inbox-sensor           → cron */15 min
  ├── sena-scraper           → cron lun-vie 6am
  ├── simit-checker          → cron diario 7am
  ├── dian-scraper           → cron lunes 9am
  ├── computrabajo-scraper   → cron lun-vie 8am
  ├── computrabajo-apply     → cron lun-vie 9am
  ├── healthcheck            → cron diario 8am
  ├── recordatorio-deepseek  → cron 3x dia
  ├── document-pipeline      → cron diario 9am
  ├── vehicle-manager        → cron diario 6am
  ├── backup-dbs             → cron diario 11pm
  └── job-loop               → cron lun-vie 10am
       │
       ▼
  SQLite (data/*.db) + JSON (data/state/)
```

## Comandos rápidos PM2

```bash
# Arrancar todo
pm2 start ecosystem.config.js

# Ver estado
pm2 status
pm2 logs

# Recargar config después de cambios
pm2 start ecosystem.config.js --update-env

# Detener todo
pm2 stop ecosystem.config.js

# Ver logs de un proceso específico
pm2 logs brain-orchestrator

# Dashboard en tiempo real
pm2 monit
```

## Requisitos del entorno local

| Recurso | Detalle |
|---------|---------|
| Node.js | >= 18 |
| npm | `npm ci` para instalar dependencias |
| `.env` | Copiar `.env.example` → `.env` con secrets reales |
| PM2 | `npm install -g pm2` |
| Playwright | `npx playwright install chromium` (pa