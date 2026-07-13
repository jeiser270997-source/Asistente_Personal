// upgrade_eventbus.js
const fs = require("fs");
const path = require("path");

console.log("===================================================");
console.log("🛠️ INICIANDO CIRUGÍA: EVENT BUS PERSISTENTE");
console.log("===================================================\n");

// 1. Crear la migración SQL para la Dead Letter Queue
const migrationsDir = path.join(__dirname, "runtime", "migrations");
if (!fs.existsSync(migrationsDir))
  fs.mkdirSync(migrationsDir, { recursive: true });

const migrationPath = path.join(migrationsDir, "0003_event_dlq.sql");
const sqlContent = `-- 0003_event_dlq.sql: Tabla para la Dead Letter Queue
CREATE TABLE IF NOT EXISTS event_dlq (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    error_msg TEXT,
    failed_at TEXT DEFAULT (datetime('now')),
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' -- 'pending', 'resolved'
);
CREATE INDEX IF NOT EXISTS idx_event_dlq_status ON event_dlq(status);
`;

fs.writeFileSync(migrationPath, sqlContent, "utf8");
console.log("✅ CREADO: Migración SQL 0003_event_dlq.sql");

// 2. Parchear lib/events/event_bus.js para usar SQLite
const busPath = path.join(__dirname, "lib", "events", "event_bus.js");
let busContent = fs.readFileSync(busPath, "utf8");

// Buscamos dónde inyectar la lógica de persistencia del DLQ
if (!busContent.includes("INSERT INTO event_dlq")) {
  // Encontramos el bloque donde se empuja a la RAM: deadLetters.push({
  const targetLogic = `deadLetters.push({
      envelope,
      error: lastError?.message,
      handler: name,
      failedAt: new Date().toISOString(),
    });`;

  const newLogic = `deadLetters.push({
      envelope,
      error: lastError?.message,
      handler: name,
      failedAt: new Date().toISOString(),
    });
    // --- NUEVO: Persistir en SQLite ---
    if (USE_SQLITE && LedgerStore) {
      try {
        const db = require('../../runtime/stores/Database').getDb();
        db.prepare(\`INSERT OR REPLACE INTO event_dlq (id, event_type, payload, error_msg) VALUES (?, ?, ?, ?)\`)
          .run(envelope.id, envelope.type, JSON.stringify(envelope.payload), lastError?.message || 'Unknown error');
      } catch(e) { console.error('Error guardando en DLQ SQLite:', e.message); }
    }
    // ----------------------------------`;

  if (busContent.includes(targetLogic)) {
    busContent = busContent.replace(targetLogic, newLogic);
    fs.writeFileSync(busPath, busContent, "utf8");
    console.log(
      "✅ ACTUALIZADO: lib/events/event_bus.js parcheado para escribir en SQLite.",
    );
  } else {
    console.log(
      "⚠️ AVISO: No se pudo inyectar el código en event_bus.js automáticamente (el patrón no coincide).",
    );
  }
} else {
  console.log("⏩ SALTADO: event_bus.js ya tiene la lógica de SQLite.");
}

console.log("\n===================================================");
console.log("🎉 CIRUGÍA COMPLETADA. Ejecuta:");
console.log("   1. node upgrade_eventbus.js");
console.log("   2. npm run migrate  <-- Para crear la tabla en la DB");
console.log("===================================================");
