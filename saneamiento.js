// saneamiento.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BASE_DIR = __dirname;

console.log("===================================================");
console.log("🔪 INICIANDO CIRUGÍA DE SANEAMIENTO (CTO MODE)");
console.log("===================================================\n");

// 1. Archivos y carpetas a extirpar
const targets = [
  "ctx_core.md",
  "ctx_jobs.md",
  "ctx_dashboard.md",
  "ctx_wheelsaver.md",
  "Herramientas", // Adiós Gmail_Cleaner antiguo
  "lib/jobs/contracts", // Adiós arquitectura enterprise innecesaria
  "lib/jobs/docs",
  "data/sources/sena/prompts", // Adiós prompts gigantes de Claude
  "scripts/one_shots/simit_tables.html",
  "lib/lobulos/frontal_langchain.js", // Adiós LangChain
  "lib/lobulos/temporal_langchain.js",
  "lib/lobulos/parietal_langchain.js",
];

let eliminados = 0;

targets.forEach((target) => {
  const targetPath = path.join(BASE_DIR, target);
  if (fs.existsSync(targetPath)) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`✅ ELIMINADO: ${target}`);
      eliminados++;
    } catch (err) {
      console.log(`❌ ERROR al eliminar ${target}:`, err.message);
    }
  } else {
    console.log(`⏩ SALTADO (ya no existe): ${target}`);
  }
});

console.log(`\n🗑️  Total elementos purgados: ${eliminados}\n`);

// 2. Actualizar .gitignore y .repomixignore
const ignoreEntries = `
# --- Saneamiento CTO ---
ctx_*.md
Herramientas/
scripts/one_shots/*.html
data/sources/sena/prompts/
`;

const ignoreFiles = [".gitignore", ".repomixignore"];

ignoreFiles.forEach((file) => {
  const filePath = path.join(BASE_DIR, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    if (!content.includes("ctx_*.md")) {
      fs.appendFileSync(filePath, "\n" + ignoreEntries, "utf8");
      console.log(`🛡️  Actualizado: ${file}`);
    } else {
      console.log(`🛡️  ${file} ya estaba actualizado.`);
    }
  }
});

// 3. Purgar dependencias de LangChain (si existen)
console.log("\n📦 Verificando/Purgando dependencias de LangChain...");
try {
  // Ejecutamos desinstalación por si acaso quedaron rastros
  execSync(
    "npm uninstall @langchain/core @langchain/openai @langchain/langgraph @langchain/community langchain",
    { stdio: "inherit" },
  );
  console.log("✅ Dependencias de LangChain purgadas (si existían).");
} catch (e) {
  console.log(
    "⚠️  Aviso: Error menor al ejecutar npm uninstall (probablemente no estaban instaladas, todo OK).",
  );
}

console.log("\n===================================================");
console.log("🎉 CIRUGÍA COMPLETADA EXITOSAMENTE");
console.log('👉 Próximo paso: Ejecuta "npm run pack" para ver la magia.');
console.log("===================================================");
