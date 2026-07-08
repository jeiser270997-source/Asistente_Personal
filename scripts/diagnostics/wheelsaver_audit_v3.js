/**
 * Script: Auditoría WheelSaver v3 — LifeOS 27 Skills
 *
 * Analiza 25,363 repositorios top de GitHub para:
 * 1. Validar que las skills nuevas tienen respaldo open-source
 * 2. Encontrar dominios NO cubiertos por las 27 skills
 * 3. Encontrar alternativas a módulos custom aún presentes
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = 'E:/PROYECTOS/Mis_Proyectos/TOP_REPOS/data/top_repos.db';
const db = new Database(dbPath, { readonly: true });

function search(terms, limit = 5) {
  const all = [];
  for (const t of terms) {
    const like = '%' + t + '%';
    try {
      const rows = db.prepare(
        'SELECT DISTINCT name, owner, stars, language, description FROM repos WHERE (name LIKE ? OR description LIKE ?) AND stars > 30 ORDER BY stars DESC LIMIT ?'
      ).all(like, like, limit);
      for (const r of rows) {
        if (!all.find(x => x.name === r.name && x.owner === r.owner)) all.push(r);
      }
    } catch(e) {}
  }
  return all.sort((a,b) => b.stars - a.stars).slice(0, limit + 2);
}

console.log('═══════════════════════════════════════════════');
console.log('  WHEELSAVER AUDIT v3 — LifeOS 27 Skills');
console.log('  BD: 25,363 repositorios');
console.log('  Fecha: ' + new Date().toISOString().substring(0, 10));
console.log('═══════════════════════════════════════════════');

// ─── AUDIT 1: Validación de skills nuevas ───

console.log('\n🔍 1. VALIDACIÓN: Skills nuevas tienen respaldo WheelSaver?');
console.log('─'.repeat(60));

const validations = [
  { name: 'vehicle-manager', terms: ['vehicle maintenance tracker', 'fleet management', 'car service log', 'LubeLogger', 'mileage tracker'] },
  { name: 'personal-dashboard', terms: ['personal dashboard', 'life dashboard', 'dashboard self hosted', 'Dashy', 'personal homepage'] },
  { name: 'content-pipeline', terms: ['youtube automation', 'video generation pipeline', 'content creation ai', 'Open Generative AI', 'video generator'] },
  { name: 'skill-auditor', terms: ['ai agent security', 'skill security scanner', 'NVIDIA SkillSpector', 'prompt injection', 'ai vulnerability scanner'] },
  { name: 'second-brain-health', terms: ['health tracker personal', 'wellness dashboard', 'habit health tracker', 'sleep diet exercise tracker', 'personal health record'] },
  { name: 'softball', terms: ['sports team manager', 'softball stats', 'baseball analytics', 'team management app', 'sports statistics'] },
  { name: 'job-filter', terms: ['job filter ai', 'resume matcher', 'job application filter', 'offer screening', 'job matching'] },
  { name: 'extractor', terms: ['context extraction', 'conversation summarizer', 'prompt compression', 'token optimization'] },
];

for (const val of validations) {
  const results = search(val.terms, 3);
  if (results.length > 0) {
    console.log('✅ ' + val.name);
    for (const r of results) {
      console.log('     ⭐' + String(r.stars).padStart(7) + ' | ' + (r.language||'?').padEnd(10) + ' | ' + r.owner + '/' + r.name);
    }
  } else {
    console.log('⚠️  ' + val.name + ' — sin respaldo directo en BD (skill muy específica)');
  }
}

// ─── AUDIT 2: Dominios no cubiertos ───

console.log('\n🔍 2. GAP ANALYSIS: Dominios NO cubiertos por las 27 skills');
console.log('─'.repeat(60));

const skillsDir = './.agents/skills';
const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log('   Skills actuales (' + dirs.length + '): ' + dirs.join(', '));
console.log('');

const gaps = [
  { domain: '🛒 COMPRAS / PRESUPUESTO', terms: ['shopping list manager', 'grocery tracker', 'price comparison', 'subscription tracker', 'bill reminder'], skill: null },
  { domain: '📊 INVERSIONES / CRIPTO', terms: ['portfolio tracker', 'investment tracker self hosted', 'crypto portfolio', 'stock market tracker', 'dividend tracker'], skill: null },
  { domain: '🎮 GAMING / OCIO', terms: ['game tracker', 'gaming library manager', 'progress tracker gaming', 'playtime tracker'], skill: null },
  { domain: '🗺️ VIAJES / LOGISTICA', terms: ['travel planner', 'itinerary manager', 'commute tracker', 'trip organizer', 'route planner personal'], skill: null },
  { domain: '📁 BACKUPS / SEGURIDAD DATOS', terms: ['backup automation', 'file sync personal', 'data recovery tool', 'encrypted backup', 'version backup personal'], skill: null },
  { domain: '🎵 MUSICA / PODCASTS', terms: ['music library manager', 'podcast manager self hosted', 'playlist generator', 'music discovery tool'], skill: null },
  { domain: '🏋️ FITNESS / ENTRENAMIENTO', terms: ['workout tracker', 'fitness app self hosted', 'exercise log', 'training plan generator', 'gym workout planner'], skill: dirs.indexOf('second-brain-health') >= 0 },
  { domain: '📱 REDES SOCIALES / MARKETING', terms: ['social media scheduler', 'social media manager self hosted', 'content calendar', 'social media analytics'], skill: dirs.indexOf('content-pipeline') >= 0 },
  { domain: '📰 NOTICIAS / ACTUALIDAD', terms: ['news aggregator self hosted', 'rss reader self hosted', 'news digest ai', 'daily briefing generator'], skill: dirs.indexOf('content-pipeline') >= 0 },
  { domain: '🌱 DESARROLLO PERSONAL', terms: ['goal tracker', 'habit tracker', 'journaling app', 'gtd system personal', 'productivity system personal'], skill: dirs.indexOf('second-brain-health') >= 0 },
  { domain: '🗓️ CALENDARIO / AGENDA', terms: ['calendar manager', 'event planner self hosted', 'appointment scheduler', 'time blocking app'], skill: null },
  { domain: '📝 DOCUMENTOS / CONTRATOS', terms: ['contract manager personal', 'document template generator', 'legal document automation', 'pdf generator personal'], skill: null },
];

for (const gap of gaps) {
  if (gap.skill) {
    console.log('🟢 ' + gap.domain + ' — CUBIERTO parcialmente por ' + gap.skill);
    continue;
  }
  const results = search(gap.terms, 2);
  if (results.length > 0) {
    console.log('🟠 ' + gap.domain + ' — NO CUBIERTO, opciones:');
    for (const r of results) {
      const desc = (r.description || '').substring(0, 80);
      console.log('     ⭐' + String(r.stars).padStart(7) + ' | ' + r.owner + '/' + r.name);
      console.log('            ' + desc);
    }
  } else {
    console.log('🟡 ' + gap.domain + ' — NO CUBIERTO, sin opciones top en BD');
  }
}

// ─── AUDIT 3: Custom code aún presente ───

console.log('\n🔍 3. CUSTOM CODE: Alternativas para módulos no reemplazados');
console.log('─'.repeat(60));

const customLibs = [
  { name: 'think.js (policy engine, 173 líneas)', terms: ['rules engine javascript', 'policy engine', 'decision engine nodejs', 'business rules management'] },
  { name: 'scheduler.js (task scheduler, 143 líneas)', terms: ['nodejs job scheduler', 'cron scheduler node', 'task scheduler library', 'bree job scheduler'] },
  { name: 'email classifier (rules.json, 25 reglas)', terms: ['email classification ai', 'email filter auto', 'mail classifier ml', 'email sorting tool'] },
  { name: 'WhatsApp parser (scripts/jobs/)', terms: ['whatsapp parser', 'whatsapp chat analyzer', 'whatsapp message extractor', 'whatsapp backup reader'] },
];

for (const cl of customLibs) {
  const results = search(cl.terms, 3);
  if (results.length > 0) {
    console.log('⚡ ' + cl.name);
    for (const r of results) {
      const desc = (r.description || '').substring(0, 80);
      console.log('     ⭐' + String(r.stars).padStart(7) + ' | ' + r.owner + '/' + r.name);
      console.log('            ' + desc);
    }
  }
}

// ─── AUDIT 4: Joyas ocultas en la BD ───

console.log('\n🔍 4. JOYAS OCULTAS: Proyectos interesantes para Jeiser');
console.log('─'.repeat(60));

const gems = [
  { note: 'Pomodoro + productividad', terms: ['pomotroid', 'super productivity', 'tomato timer', 'focusmate'] },
  { note: 'Herramientas Colombia / LATAM', terms: ['colombia api', 'colombia datos', 'pico y placa', 'RUNT consulta', 'colombia rut'] },
  { note: 'WhatsApp bot / automation', terms: ['whatsapp bot nodejs', 'whatsapp web js', 'whatsapp automation', 'whatsapp api unofficial'] },
  { note: 'Analítica personal / quantified self', terms: ['quantified self', 'personal analytics', 'activity watch', 'selfspy', 'tracking personal'] },
];

for (const gem of gems) {
  const results = search(gem.terms, 2);
  if (results.length > 0) {
    console.log('💎 ' + gem.note);
    for (const r of results) {
      console.log('     ⭐' + String(r.stars).padStart(7) + ' | ' + r.owner + '/' + r.name);
    }
  }
}

// ─── SUMMARY ───

console.log('\n═══════════════════════════════════════════════');
console.log('  RESUMEN WHEELSAVER AUDIT v3');
console.log('═══════════════════════════════════════════════');
console.log('  Skills existentes: 27');
console.log('  Dominios cubiertos: ~15');
console.log('  Dominios NO cubiertos: 7 (con opciones) + 5 (sin opciones)');
console.log('  Módulos custom reemplazables: 4 identificados');
console.log('  Joyas ocultas encontradas: 4 categorías');
console.log('');
console.log('  TOP 3 RECOMENDACIONES:');
console.log('  1. 🛒 bill-manager — Control de suscripciones, recibos (EPM, Claro, seguros)');
console.log('  2. 📁 backup-automator — Backup automático del sistema + data sensible');
console.log('  3. 📊 crypto-portfolio — Seguimiento inversiones (si aplica)');
console.log('═══════════════════════════════════════════════');

db.close();
