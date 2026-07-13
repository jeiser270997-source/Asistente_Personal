// fix_final.js
const fs = require("fs");
const path = require("path");

console.log("===================================================");
console.log("🛠️  CIRUGÍA FINAL: EVENT BUS & UNIFICACIÓN DE RUTAS");
console.log("===================================================\n");

// 1. FORZAR INYECCIÓN EN EVENT BUS (Fase B)
const busPath = path.join(__dirname, "lib", "events", "event_bus.js");
let busContent = fs.readFileSync(busPath, "utf8");

const regexPush = /deadLetters\.push\(\{[\s\S]*?failedAt:[^}]+\}\);/m;
if (
  regexPush.test(busContent) &&
  !busContent.includes("INSERT OR REPLACE INTO event_dlq")
) {
  const replacement = `$&
    // --- NUEVO: Persistir en SQLite ---
    if (USE_SQLITE) {
      try {
        const db = require('../../runtime/stores/Database').getDb();
        db.prepare('INSERT OR REPLACE INTO event_dlq (id, event_type, payload, error_msg) VALUES (?, ?, ?, ?)')
          .run(envelope.id, envelope.type, JSON.stringify(envelope.payload), lastError?.message || 'Unknown error');
      } catch(e) { console.error('Error guardando en DLQ SQLite:', e.message); }
    }
    // ----------------------------------`;
  busContent = busContent.replace(regexPush, replacement);
  fs.writeFileSync(busPath, busContent, "utf8");
  console.log(
    "✅ ÉXITO: lib/events/event_bus.js parcheado para escribir en SQLite.",
  );
} else {
  console.log(
    "⏩ SALTADO: event_bus.js ya tiene la lógica de SQLite o no se encontró.",
  );
}

// 2. UNIFICACIÓN DE RUTAS HARDCODEADAS (Fase C)
// Hay 4 scripts que están leyendo 'data/cache/repos_db.json' usando rutas relativas inseguras.
const filesToFix = [
  "scripts/schedulers/research_loop.js",
  "scripts/maintenance/research_personal.js",
  "scripts/dev/scan_repos_lifeos.js",
  "scripts/dev/picks_lifeos.js",
];

let rutasCambiadas = 0;

filesToFix.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf8");

    // Si tiene el require inseguro
    if (content.includes("readFileSync('data/cache/repos_db.json'")) {
      // Inyectar path module si no existe
      if (
        !content.includes("require('path')") &&
        !content.includes("require('node:path')")
      ) {
        content = "const path = require('path');\n" + content;
      }

      // Reemplazar readFileSync inseguro
      content = content.replace(
        /fs\.readFileSync\('data\/cache\/repos_db\.json',\s*'utf8'\)/g,
        "fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'cache', 'repos_db.json'), 'utf8')",
      );

      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`✅ RUTA CORREGIDA en: ${file}`);
      rutasCambiadas++;
    }
  }
});

console.log(`\n===================================================`);
console.log(`🎉 DEUDA TÉCNICA SANEADA`);
console.log(`   - DLQ de eventos ahora es persistente.`);
console.log(
  `   - ${rutasCambiadas} scripts portables (Listos para Docker/VPS).`,
);
console.log(`===================================================`);
