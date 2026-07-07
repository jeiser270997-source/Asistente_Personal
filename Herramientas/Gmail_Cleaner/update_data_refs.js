const fs = require('fs');
const path = require('path');

const BASE = 'E:/PROYECTOS/Asistente_Personal';

// Mapping of old paths -> new paths for ALL references
// These are the literal string replacements to apply
const replacements = [
  // ── Config ──
  ["'data/config/rules.json'", "'data/config/rules.json'"],

  // ── State ──
  ["'data/state/masterledger.json'", "'data/state/masterledger.json'"],
  ["data/state/contexto_maestro/ALERTAS_SENA.md", "data/state/contexto_maestro/ALERTAS_SENA.md"],
  ["data/state/contexto_maestro/ESTADO_VIVO.md", "data/state/contexto_maestro/ESTADO_VIVO.md"],
  ["data/state/contexto_maestro", "data/state/contexto_maestro"],

  // ── Cache (were already gitignored, but scripts may reference them) ──
  ["'data/cache/repos_db.json'", "'data/cache/repos_db.json'"],
  ["`data/cache/repos_db.json`", "`data/cache/repos_db.json`"],
  ["data/cache/repos_db_meta.json", "data/cache/repos_db_meta.json"],
  ["data/cache/repos_lifeos_filtered.json", "data/cache/repos_lifeos_filtered.json"],
  ["data/cache/repos_picks.json", "data/cache/repos_picks.json"],
  ["data/cache/research/research_loop_results.json", "data/cache/research/research_loop_results.json"],
  ["data/cache/research/research_loop_report.md", "data/cache/research/research_loop_report.md"],
  ["data/cache/research/research_personal_results.json", "data/cache/research/research_personal_results.json"],
  ["data/cache/research/research_personal_report.md", "data/cache/research/research_personal_report.md"],
  ["data/cache/repos_lifeos_report.md", "data/cache/repos_lifeos_report.md"],
  ["data/cache/top_repos.json", "data/cache/top_repos.json"],
  ["data/cache/dian", "data/cache/dian"],
  ["data/cache/simit/ultima_consulta.json", "data/cache/simit/ultima_consulta.json"],
  ["data/cache/simit_multas.json", "data/cache/simit_multas.json"],
  ["data/cache/bootcamp", "data/cache/bootcamp"],

  // ── SENA cache ──
  ["data/cache/sena/calificaciones.json", "data/cache/sena/calificaciones.json"],
  ["data/cache/sena/curso.json", "data/cache/sena/curso.json"],
  ["data/cache/sena/cronograma_fechas.json", "data/cache/sena/cronograma_fechas.json"],

  // ── Jobs cache ──
  ["data/cache/jobs/computrabajo.json", "data/cache/jobs/computrabajo.json"],
  ["data/cache/jobs/computrabajo_last.json", "data/cache/jobs/computrabajo_last.json"],
  ["data/cache/jobs/canal_juniorjobs.json", "data/cache/jobs/canal_juniorjobs.json"],

  // ── User ──
  ["'data/user/perfil.md'", "'data/user/perfil.md'"],
  ["`data/user/perfil.md`", "`data/user/perfil.md`"],
  ["data/user/metas.md", "data/user/metas.md"],
  ["data/user/finanzas.md", "data/user/finanzas.md"],

  // ── Sources ──
  ["data/sources/sena/materiales", "data/sources/sena/materiales"],
  ["data/sources/sena/evidencias", "data/sources/sena/evidencias"],
  ["data/sources/cesde/comunicados", "data/sources/cesde/comunicados"],
  ["data/sources/cesde/clase4", "data/sources/cesde/clase4"],
  ["data/sources/documentos", "data/sources/documentos"],

  // ── Jobs sources ──
  ["data/sources/jobs/cv_base.md", "data/sources/jobs/cv_base.md"],
  ["data/sources/jobs/sample_jobs.txt", "data/sources/jobs/sample_jobs.txt"],

  // ── Artifacts ──
  ["data/artifacts/jobs/cv_tailored", "data/artifacts/jobs/cv_tailored"],
  ["data/artifacts/jobs/cv_jeiser.html", "data/artifacts/jobs/cv_jeiser.html"],
  ["data/artifacts/jobs/cv_jeiser_soporte_ti.html", "data/artifacts/jobs/cv_jeiser_soporte_ti.html"],
  ["data/artifacts/jobs/cv_jeiser_soporte_ti.pdf", "data/artifacts/jobs/cv_jeiser_soporte_ti.pdf"],
  ["data/artifacts/cesde_introductorio_julio2026.ics", "data/artifacts/cesde_introductorio_julio2026.ics"],

  // ── State tracked ──
  ["data/state/sena/seguimiento.json", "data/state/sena/seguimiento.json"],
  ["data/state/sena/historial_ejecuciones.json", "data/state/sena/historial_ejecuciones.json"],
  ["data/state/sena/deadlines.json", "data/state/sena/deadlines.json"],
  ["data/state/simit/alertas.json", "data/state/simit/alertas.json"],
  ["data/cache/bootcamp/curriculum.json", "data/state/bootcamp/curriculum.json"],
  ["data/cache/bootcamp/progreso.json", "data/state/bootcamp/progreso.json"],

  // ── Config ──
  ["data/config/jobs/computrabajo_target.json", "data/config/jobs/computrabajo_target.json"],
];

// Collect all JS, YML, HTML, MD files (skip node_modules, .git, backup)
const files = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.backup_')) continue;
      collect(full);
    } else if (/\.(js|yml|yaml|html|md)$/i.test(entry.name)) {
      files.push(full);
    }
  }
}
collect(BASE);

let totalFiles = 0;
let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  let fileChanged = false;

  for (const [oldStr, newStr] of replacements) {
    // Only replace if the old string appears as a path reference
    const escaped = oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const newContent = content.replace(regex, newStr);
    if (newContent !== content) {
      const count = (content.match(regex) || []).length;
      content = newContent;
      fileChanged = true;
      totalChanges += count;
    }
  }

  if (fileChanged) {
    fs.writeFileSync(file, content, 'utf8');
    totalFiles++;
    const rel = path.relative(BASE, file);
    console.log('  ' + rel);
  }
}

console.log('\nActualizados: ' + totalFiles + ' archivos, ' + totalChanges + ' referencias');
