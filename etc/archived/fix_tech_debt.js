/**
 * fix_tech_debt.js
 * Script Maestro de Saneamiento de Deuda Técnica (P0)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("\n═══════════════════════════════════════════════════════");
console.log("     LIFEOS TECH-DEBT SANITIZER (NODE.JS MODE)         ");
console.log("═══════════════════════════════════════════════════════\n");

function runCommand(command, ignoreError = false) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    if (!ignoreError) {
      console.error(`\n[❌] Error ejecutando: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
console.log("[🚀] Paso 1: Eliminar bases de datos del tracking de Git...");
const dbsToUntrack = ["runtime/lifeos.db", "data/memoria_hipocampo.db"];

dbsToUntrack.forEach((db) => {
  if (fs.existsSync(db)) {
    runCommand(`git rm --cached ${db}`, true);
    console.log(`  [✅] Sacado de Git tracking: ${db}`);
  } else {
    console.log(`  [⚠️] Archivo no encontrado en local: ${db}`);
  }
});

// ─────────────────────────────────────────────────────────────
console.log("\n[🚀] Paso 2: Parchear .gitignore...");
const gitignorePath = path.join(__dirname, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  let content = fs.readFileSync(gitignorePath, "utf8");

  // Eliminar las excepciones que obligaban a subir las DBs a Git
  content = content.replace(/^!data\/memoria_hipocampo\.db\r?\n?/gm, "");
  content = content.replace(/^!runtime\/lifeos\.db\r?\n?/gm, "");

  fs.writeFileSync(gitignorePath, content, "utf8");
  console.log("  [✅] .gitignore parcheado. Las DBs ahora serán ignoradas.");
}

// ─────────────────────────────────────────────────────────────
console.log("\n[🚀] Paso 3: Parchear workflows de GitHub Actions...");
const workflowsDir = path.join(__dirname, ".github", "workflows");
let patchedCount = 0;

if (fs.existsSync(workflowsDir)) {
  const workflows = fs
    .readdirSync(workflowsDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  workflows.forEach((file) => {
    const wfPath = path.join(workflowsDir, file);
    let wfContent = fs.readFileSync(wfPath, "utf8");

    if (
      wfContent.includes("runtime/lifeos.db") ||
      wfContent.includes("data/memoria_hipocampo.db")
    ) {
      // Remover las menciones a los archivos .db
      wfContent = wfContent.replace(/ runtime\/lifeos\.db/g, "");
      wfContent = wfContent.replace(/ data\/memoria_hipocampo\.db/g, "");
      wfContent = wfContent.replace(/runtime\/lifeos\.db /g, "");
      wfContent = wfContent.replace(/data\/memoria_hipocampo\.db /g, "");

      fs.writeFileSync(wfPath, wfContent, "utf8");
      console.log(`  [✅] Parcheado: ${file}`);
      patchedCount++;
    }
  });
}

if (patchedCount === 0) {
  console.log(
    "  [⚠️] No se encontraron workflows que necesiten parcheo (o ya estaban corregidos).",
  );
}

// ─────────────────────────────────────────────────────────────
console.log("\n[🚀] Paso 4: Validar cambios y Comitear a GitHub...");

const status = runCommand("git status --porcelain");
if (!status || status.trim() === "") {
  console.log(
    "  [⚠️] No hay cambios para comitear. El repositorio ya está saneado.\n",
  );
  process.exit(0);
}

console.log("  Aplicando commit...");
runCommand("git add .");
runCommand(
  'git commit -m "chore(tech-debt): Saneamiento P0. Eliminar DBs de git tracking y parchear actions"',
);

console.log("  Haciendo push al servidor (esto puede tardar unos segundos)...");
runCommand("git push origin main");

console.log("  [✅] ¡Deuda técnica P0 resuelta! Cambios subidos a GitHub.\n");

console.log("═══════════════════════════════════════════════════════");
console.log("  RECOMENDACIÓN POST-SCRIPT:");
console.log(
  "  Como las DBs ya no subirán a GitHub, la próxima vez que se ejecuten",
);
console.log(
  "  tus Actions, vivirán en caché. Cuando quieras persistencia real",
);
console.log("  en la nube, implementa Litestream con Cloudflare R2.");
console.log("═══════════════════════════════════════════════════════\n");
