const fs = require('node:fs');
const path = require('node:path');
const { logApplication, listApps, getStats } = require('../lib/job_tracker');

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
