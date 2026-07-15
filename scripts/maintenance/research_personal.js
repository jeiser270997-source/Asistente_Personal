const path = require('path');
/**
 * research_personal.js — Research loop ×5 personalizado para Jeiser
 * Perfil: QA Student + Didi Driver + DIAN stress + autodidacta + Colombia
 */
const fs = require('fs');
const { PATHS, DIR } = require('../../lib/data/paths');
const db = JSON.parse(fs.readFileSync(PATHS.REPOS_DB, 'utf8'));
console.log(`\n🧠 Research Personal Loop ×5 — ${db.length} repos\n${'═'.repeat(70)}\n`);

function search(keywords, minStars = 50, limit = 12) {
  const scored = [];
  for (const r of db) {
    const txt = `${r.name} ${r.desc || ''} ${r.lang || ''}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (r.name.toLowerCase().includes(kw)) score += 5;
      else if ((r.desc || '').toLowerCase().includes(kw)) score += 3;
      else if (txt.includes(kw)) score += 1;
    }
    if (score > 0 && r.stars >= minStars) scored.push({ ...r, _score: score });
  }
  return scored.sort((a, b) => b._score !== a._score ? b._score - a._score : b.stars - a.stars).slice(0, limit);
}

const results = {};

// ── PASADA 1: Estudio / Aprendizaje / QA ───────────────────────
// Jeiser: CESDE (QA Bootcamp), SENA, Feynman, Pomodoro, spaced repetition
results['📚 Estudio / QA / Aprendizaje'] = search(
  ['anki','spaced repetition','flashcard','pomodoro','study','learning','feynman',
   'qa','test automation','playwright','cypress','jest','selenium','testing tutorial',
   'roadmap','developer roadmap','computer science','self-learning'],
  200, 15
);

// ── PASADA 2: Psicología / Bienestar / Mindfulness ─────────────
// Jeiser: estrés moderado, descarga cognitiva, necesita empatía directa
results['🧘 Psicología / Bienestar / Mindfulness'] = search(
  ['mental health','mindfulness','meditation','stress','anxiety','burnout',
   'cognitive','productivity psychology','mood tracker','habit','journaling',
   'stoic','wellbeing','self-improvement','resilience','focus'],
  100, 12
);

// ── PASADA 3: Finanzas Personales / Deuda ──────────────────────
// Jeiser: DIAN deuda 0.8M, Didi driver, gastos hormiga, ahorro activo
results['💰 Finanzas Personales / Deuda / Ahorro'] = search(
  ['personal finance','budget','money','debt','expense','savings','financial',
   'income','invoice','tax','freelance income','gig economy','driver earnings',
   'finanzas','presupuesto','ahorro','deuda','gastos'],
  100, 12
);

// ── PASADA 4: Carrera / Empleo Tech Colombia ───────────────────
// Jeiser: QA Junior/Semi-senior, Computrabajo, LinkedIn, Colombia
results['💼 Carrera / Empleo / Job Search'] = search(
  ['job search','resume','cv','career','interview','portfolio','linkedin',
   'roadmap engineer','developer','junior','career change','tech job',
   'qa engineer','test engineer','remote work','freelance','job board'],
  200, 12
);

// ── PASADA 5: Hábitos / Productividad / Autodisciplina ─────────
// Jeiser: conductor + estudiante simultáneo, gestión de tiempo crítica
results['⚡ Hábitos / Productividad / Autodisciplina'] = search(
  ['habit tracker','productivity','pomodoro','todo','task manager','gtd',
   'second brain','obsidian','notion','time management','daily planner',
   'goal tracking','atomic habits','deep work','focus','discipline',
   'self-discipline','routine','morning routine'],
  200, 12
);

// ── PRINT ───────────────────────────────────────────────────────
let report = '';
for (const [cat, repos] of Object.entries(results)) {
  report += `\n${cat}\n${'─'.repeat(70)}\n`;
  if (!repos.length) { report += '  (sin resultados)\n'; continue; }
  repos.forEach((r, i) => {
    const stars = r.stars.toLocaleString();
    const desc  = (r.desc || '').substring(0, 100);
    const lang  = r.lang && r.lang !== '?' ? ` [${r.lang}]` : '';
    report += `  ${i+1}. [${stars}⭐${lang}] ${r.name}\n`;
    if (desc) report += `     ${desc}\n`;
    report += `     ${r.url}\n\n`;
  });
}

console.log(report);
const outDir = path.join(DIR.CACHE, 'research');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'research_personal_results.json'), JSON.stringify(results, null, 2));
console.log('✅ Guardado en data/cache/research/research_personal_results.json\n');
