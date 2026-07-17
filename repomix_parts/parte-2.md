empresa, cargo }` | Event Registry → Ledger + Telegram |
| `event.scheduled` | scheduler | `{ titulo, slot, motivo }` | Event Registry → Ledger |
| `scheduler.conflict` | scheduler | `{ titulo, slot, sugerencia }` | Event Registry → Ledger |
| `context.daily` | context_engine | `{ emails, cambios, resumen }` | Event Registry → Ledger |
| `skill.registered` | skill_engine | `{ name, trigger, version }` | — |
| `jarvis.cycle` | jarvis_loop | `{ decisions, llm, resumen }` | Event Registry → Ledger |
| `system.error` | cualquier script | `{ source, error }` | — |

## Eventos internos del Event Bus

| Evento | Cuándo | Payload |
|--------|--------|---------|
| `event_*` | Cada `emit()` persiste en Ledger | `{ event_id, timestamp, source, priority, ...payload }` |
| `event_dlq` | Handler falla 3 veces | `{ event_id, type, handler, error }` |

## Esquemas de validación

Definidos en `lib/event_bus.js`:

```js
schemas = {
  'email.processed': { from: 'string', subject: 'string', action: 'string' },
  'email.important': { from: 'string', subject: 'string', summary: 'string?' },
  'case.created':    { id: 'string', tipo: 'string', titulo: 'string', estado: 'string', prioridad: 'number?' },
  'case.updated':    { id: 'string', tipo: 'string', estado: 'string' },
  'job.applied':     { empresa: 'string', cargo: 'string', plataforma: 'string', score: 'number?' },
  'job.rejection':   { empresa: 'string', cargo: 'string' },
  'event.scheduled': { titulo: 'string', slot: 'string', motivo: 'string' },
  'scheduler.conflict': { titulo: 'string', slot: 'string', sugerencia: 'string' },
  'context.daily':   { emails: 'number', cambios: 'number', resumen: 'string' },
}
```

Payloads que no cumplen el schema → bloqueados con warning en stderr.

## Agregar un nuevo evento

1. Añadir schema en `lib/event_bus.js`
2. Añadir handler en `lib/event_registry.js`
3. Emitir: `bus.emit('nuevo.evento', payload, { source: 'modulo' })`
4. Documentar aquí
````

## File: docs/NEXT.md
````markdown
# Proximo paso

## 1. Feedback loop para aplicaciones

Cuando llegue respuesta (email de rechazo/entrevista), actualizar el scoring para aprender.

```js
bus.on('job.feedback', (ev) => {
  // ajustar peso de skills segun resultado
})
```

## 2. CV adaptativo por oferta

El `cv_generate` actual usa keywords fijas. Mejorar con:

- Resumen profesional adaptado al titulo del cargo
- Reordenar skills segun la oferta
- Inyectar keywords ATS

## 3. Anti-deteccion para Playwright

- Delays aleatorios entre acciones (1000-4000ms)
- Rotacion de user-agent
- Rate limiting entre aplicaciones

## 4. Thresholds formalizados

```js
AUTO_APPLY: 85   // aplicar sin confirmacion
APPLY: 60        // aplicar con confirmacion
REVIEW: 40       // revisar manualmente
SKIP: < 40       // descartar
```

## 5. Duplicados

Antes de aplicar, verificar:

```js
AppStore.findByUrl(url)  // si existe → skip
```
````

## File: docs/runtime.md
````markdown
# Runtime

Capa de persistencia desacoplada del resto del sistema.

```
Events (correo, scraper, calendario)
      │
      ▼
 Context Engine
      │
      ├── CaseStore        (procesos activos: legales, empleo, estudios)
      ├── AvailabilityStore (restricciones de tiempo)
      ├── ApplicationStore
      ├── LedgerStore
      ├── CheckpointStore
      └── JobStore
              │
              ▼
       ResumeEngine  (ciclo de vida: start → load → trabajo → save → finish)
              │
              ▼
         SQLite / JSON Driver
```
```

## Stores (API estable)

| Store | Métodos | Propósito |
|-------|---------|-----------|
| `CheckpointStore` | `get(key)`, `set(key, value)`, `migrateAll()` | Estado de reanudación (última consulta, cursor, etc.) |
| `ApplicationStore` | `getAll(filter?)`, `getById(id)`, `getStats()`, `create(data)`, `update(id, changes)`, `findByEmpresaCargo()`, `findByUrl(url)` | Aplicaciones laborales |
| `LedgerStore` | `emit(tipo, data)`, `getAll()`, `getByTipo(tipo)`, `getById(id)` | Trazabilidad de eventos |
| `JobStore` | `getAll(jobName?)`, `getLastRun(jobName)`, `logRun()`, `startRun()`, `finishRun()` | Historial de ejecuciones |
| `SeguimientoStore` | `get()`, `update(data)` | Progreso de cursos SENA |
| `CaseStore` | `getAll(tipo?, estado?)`, `getById(id)`, `create()`, `update()`, `close()`, `addEvent()`, `getEvents()`, `abiertos()`, `requierenSeguimiento()`, `porTipo()` | Procesos activos (legales, empleo, estudios, finanzas) |
| `AvailabilityStore` | `getAll(tipo?)`, `add()`, `remove()`, `slotsDisponibles()`, `estaDisponible()`, `sugerirProximoSlot()`, `seedDefaults()` | Restricciones de tiempo |

**Regla:** Ningún código fuera de `runtime/stores/` puede ejecutar SQL directamente.

## Context Engine

El Context Engine recibe eventos de todas las integraciones (email, scrapers, calendario) y actualiza el modelo de contexto. No es un módulo separado sino el pipeline completo:

```
Evento → Rule Engine → CaseStore / ApplicationStore / LedgerStore
```

**CaseStore** modela cualquier proceso de la vida real como un caso con tipo, estado, timeline y datos específicos. Ejemplos: caso SIMIT (radicado → esperando respuesta → resuelto), postulación laboral (aplicada → entrevista → oferta/rechazo), curso SENA (módulo 1 → ... → completado).

**AvailabilityStore** modela restricciones de tiempo recurrentes (estudio, sueño, trabajo, descanso). Cuando un evento requiere crear una cita, el Scheduler consulta `AvailabilityStore` antes de escribir en Google Calendar:

```
Solicitud → ¿Hay disponibilidad? → Sí → Calendar.insert()
                               → No → sugerirProximoSlot()
```

## ResumeEngine (`lib/resume_engine.js`)

Ciclo de vida estándar para cualquier job:

```js
const RE = require('./lib/resume_engine');

RE.start('job_name', { metadata });
RE.load('job_name');  // → ResumeContext { checkpoint, jobName, attempt, timestamp, metadata }
RE.save('job_name', checkpointData);
RE.finish('job_name', 'success', { details });
RE.canResume('job_name');  // → true si último run está running/failed/error
```

Todos los dominios migrados siguen exactamente este ciclo.

## Qué va a SQLite

Estado mutable:
- Checkpoints de procesos (`computrabajo_last`, `dian_ultima_consulta`, `simit_ultima_consulta`, `deadlines`)
- Aplicaciones laborales (ambas fuentes)
- Seguimiento de cursos SENA
- Historial de ejecuciones
- Eventos de auditoría (ledger)

## Qué permanece en JSON

- Cachés regenerables (`repos_db.json`, `research_loop_results.json`)
- Configuración (`perfil.md`, `metas.md`, `contexto_vital.json`)
- Plantillas (`cv_base.md`, resume LaTeX)
- Exportaciones (datos por sección de DIAN, reportes)
- Logs

## Driver JSON

`STORAGE_DRIVER=json` está **deprecado** desde v1.0.

Removal target: **v2.0**.

Mientras exista:
- No se garantiza que las escrituras a JSON se reflejen en SQLite.
- Los Stores leen de SQLite; los scripts legacy leen de JSON.
- La migración a stores es la única vía soportada.

## Migraciones

```bash
npm run migrate        # aplicar pendientes
npm run runtime:audit  # auditoría completa
npm run runtime:ci     # guardrail CI (solo fs access check)
```

Las migraciones se registran en la tabla `schema_migrations` y se aplican en transacciones.

## Reglas para nuevos dominios

1. Usar `RE.start/finish` para el ciclo de vida.
2. Estado mutable → Store.
3. Cache/exportación → JSON en `data/`.
4. Sin `fs.readFileSync`/`writeFileSync` sobre archivos de estado.
5. Sin SQL directo fuera de `runtime/stores/`.
6. Si necesitas un Store nuevo, que implemente al menos 3 consumidores distintos antes de considerar la API estable.
````

## File: docs/skills.md
````markdown
# Skills System

Sistema formal de habilidades sobre el Event Bus. Cada skill reacciona a un evento y genera nuevos eventos.

## Skill Engine

Archivo: `lib/skill_engine.js`

API:

```js
const engine = require('./lib/skill_engine');

engine.register(skill);  // Registrar una skill
engine.unregister(name); // Eliminar
engine.list();           // Listar todas
engine.enable(name);     // Activar
engine.disable(name);    // Desactivar
engine.init();           // Conectar al Event Bus
```

## Formato de una skill

```js
{
  name: 'job_apply',           // único
  description: 'Detecta postulaciones desde correos',
  trigger: 'email.processed',  // evento que la activa
  input: ['from', 'subject'],  // campos requeridos del payload
  version: '1.0.0',
  enabled: true,               // opcional, default true

  run({ payload, event, meta }) {
    // ...
    return {
      event: 'job.applied',    // evento a emitir
      payload: { ... },
      priority: 'normal',
    };
  },
}
```

## Skills registradas

| Skill | Trigger | Input | Output | Archivo |
|-------|---------|-------|--------|---------|
| `job_apply` | `email.processed` | `from, subject` | `job.applied` | `skills/job_apply.js` |
| `context_sync` | `email.important` | `from, subject` | `case.created` | `skills/context_sync.js` |

## Crear una skill nueva

```bash
# 1. Crear archivo en skills/
touch skills/mi_skill.js

# 2. Exportar objeto skill
module.exports = { name, trigger, input, run };

# 3. Registrar en el engine
engine.register(require('./skills/mi_skill'));
```

## Reglas

- Una skill solo debe hacer UNA cosa.
- El `run()` devuelve un evento o null.
- No lanzar errores directamente (el Event Bus maneja retry + DLQ).
- No acceder a stores directamente si hay un evento que lo haga por ti.
````

## File: docs/STATE.md
````markdown
# Jarvis — Estado actual

## Completado

- Event Bus v2 (async, retry, DLQ, backpressure, schema validation, idempotencia, replay)
- Skill Engine (register, trigger, run, enable/disable)
- Decision Layer (prompts estructurados, fallbacks sin LLM por tipo)
- Jarvis Loop (cron GitHub Actions cada 5 min, --once, --chaos)
- Persistencia: SQLite WAL + actions/cache + docs/cloud.md (R2, Neon, Turso)
- Pipeline skills: job_match → cv_generate → job_apply_ct

## Skills registradas

| Skill | Trigger | Output |
|-------|---------|--------|
| `job_match` | `job.detected` | `job.match.ready` (score≥60) / `job.matched` (score<60) |
| `cv_generate` | `job.match.ready` | `job.cv.ready` / `job.cv.generated` |
| `job_apply_ct` | `job.cv.ready` | `job.applied` / `job.apply.failed` |
| `job_apply` | `email.processed` | `job.applied` |
| `context_sync` | `email.important` | `case.created` |

## Stores

- CheckpointStore (checkpoints por dominio)
- ApplicationStore (postulaciones, ambas fuentes)
- LedgerStore (eventos de auditoria)
- JobStore (historial de ejecuciones)
- SeguimientoStore (progreso SENA)
- CaseStore (procesos activos con timeline)
- AvailabilityStore (restricciones de tiempo)

## Integraciones migradas al Runtime

- Computrabajo (scraper + apply)
- SENA (tracker + scraper + recordatorios)
- DIAN (scraper)
- SIMIT (scraper)
- Gmail (email_processor + inbox_sensor)
- Rule Engine (19 reglas deterministas)

## En progreso

- `job_match`: scoring determinístico funciona, falta integracion con LLM para casos ambiguos
- `cv_generate`: baseline por keywords, falta adaptacion profunda por oferta
- `job_apply_ct`: nivel 1 (notificar) funciona, nivel 2 (Playwright semi-auto) implementado

## Proximo paso

Pipeline completo: job.detected → match → cv → apply → feedback

## Problemas conocidos

- Persistencia: actions/cache es temporal (max 7 dias). Migrar a R2/Neon cuando escale.
- Feedback loop: no existe aun. Las decisiones de apply no retroalimentan el scoring.
- Anti-deteccion: Playwright sin delays aleatorios ni rotacion de user-agent.

## Como correr

```bash
node scripts/jarvis_loop.js --once        # ciclo completo
node scripts/jarvis_loop.js --interval=10  # cada 10 min
node scripts/runtime-audit.js --full       # auditoria
npm run runtime:ci                         # guardrail CI
```

## Dependencias externas

- DeepSeek API (para LLM, modo PICO 22h-5am desactivado)
- Gmail API (OAuth, para email_processor e inbox_sensor)

## Estado general

10/10 tablas, 0 fallos, 0 warnings en audit.
````

## File: docs/VISION.md
````markdown
# Visión LifeOS

> Un sistema operativo personal que centraliza información, automatiza procesos rutinarios mediante reglas y utiliza IA solo cuando el razonamiento semántico aporta un beneficio claro.

## Capacidades actuales (Julio 2026)

1. **Memoria personal** — perfil, metas, finanzas, psicología, hardware, contexto maestro, estado persistente.
2. **Motor de empleo v1.0** — scorer, gap analyzer, reviewer pipeline, EV, learning ROI, todo <5ms 95% determinístico.
3. **Gestión académica** — SENA, CESDE, evidencias, seguimiento, materiales.
4. **Centro de comunicaciones** — Gmail, Telegram, rule engine para clasificar y accionar.
5. **Planificador** — Calendar, pendientes, empleo, estudios, finanzas.
6. **Motor de decisiones** — qué oferta, qué skill, qué curso, qué tarea tiene más impacto.
7. **Automatización** — GitHub Actions, scrapers, loops, mantenimiento.
8. **Observabilidad** — histórico, eventos, métricas, scores, decisiones.

## Preguntas que LifeOS debe responder

1. ¿Qué debo hacer hoy? (agenda + prioridades)
2. ¿Qué oportunidad me conviene más? (motor de decisiones)
3. ¿Qué está bloqueando mis objetivos? (análisis de brechas)
4. ¿Qué aprendí del último mes? (métricas y feedback)
5. ¿Qué puedo automatizar mañana para ahorrar tiempo? (rule engine + event bus)

## Roadmap inmediato (próximos sprints)

### Sprint 4 — Calibración
- Dataset 50-100 ofertas reales
- Ajuste de pesos de `scoring_weights.json`
- Versionado de reglas (`rulesetVersion`)
- Benchmark: precisión apply/skip vs criterio humano

### Sprint 5 — Dedup + Change Detection
- Detector de duplicados (hash de contenido + empresa/cargo/salario)
- Detector de cambios en ofertas ya vistas (re-score automático)
- Cola de aplicación (Top N priorizadas)

### Sprint 6 — Estados + Reportes
- Estados más ricos: NEW → SCORED → QUEUED → CV_READY → APPLIED → VIEWED → INTERVIEW → REJECTED → OFFER → HIRED
- Dashboard semanal en Markdown
- Reporte exportable por período

### No automatizar aún
- No aplicar automáticamente. Primero validar que el scorer prioriza bien.
- El pipeline produce Top 10 → el usuario aprueba → se aplica.

## Principios de diseño

1. Regla antes que IA.
2. Event Bus antes que acoplamiento.
3. Configuración antes que código.
4. Medir antes de optimizar.
5. Un origen de verdad.
6. La IA es un amplificador, no un requisito.
````

## File: docs/wheel-saver-integration.md
````markdown
# WheelSaver — Integración con LifeOS

**WheelSaver** es un scraper de GitHub + buscador offline + herramienta de auditoría IA.
Su base de datos local contiene **~23,000 repositorios** de GitHub con +500 estrellas,
indexados con FTS5 para búsquedas ultrarrápidas.

## Estructura

```
wheel-saver/               ← Subproyecto Python dentro de LifeOS
├── cli.py                 ← CLI unificado (Typer + Rich, 11 comandos)
├── api/                   ← FastAPI REST (8 endpoints)
├── scraper/               ← Motor de scraping (GitHub GraphQL API)
├── scripts/               ← Importadores (EvanLi, gitstar-ranking)
├── data/top_repos.db      ← Base SQLite ~23k repos con FTS5
├── frontend/              ← Dashboard web (Tabler CSS)
├── tests/                 ← ~18 tests con pytest
├── venv/                  ← Entorno virtual Python
└── requirements.txt       ← Dependencias Python
```

## Comandos vía LifeOS

```bash
# Buscar repositorios
npm run wheel:search -- "orm testing python"
npm run wheel:search -- "state management react" --language javascript --limit 10

# Estadísticas
npm run wheel:stats

# Top repositorios
npm run wheel:top -- 20
npm run wheel:top -- 10 --language rust

# Lenguajes disponibles
npm run wheel:languages

# Consultar IA con RAG (recomendación de librerías)
npm run wheel:ask -- "qué librería me recomiendas para hacer scraping?"

# Iniciar servidor API
npm run wheel:serve

# Verificar estado
npm run wheel:health
```

## Uso desde Node.js (API programática)

```javascript
const ws = require('./lib/integrations/wheel_saver_client');

// Búsqueda simple
const results = await ws.search('orm python');
console.log(results);

// Obtener estadísticas
const stats = await ws.stats();

// Top repos
const top = await ws.top(20, 'typescript');

// Consulta RAG
const answer = await ws.ask('qué librería para UI en React?');
```

## Skills de Claude AI importados

Los skills de Claude de WheelSaver se integraron en `.agents/skills/`:

| Skill | Archivo | Descripción |
|-------|---------|-------------|
| `wheel_saver` | `.agents/skills/wheel_saver/SKILL.md` | Auditoría completa de proyectos |
| `wheel-ready` | `.agents/skills/wheel_ready/SKILL.md` | Checklist de project readiness |
| `wheel-swap` | `.agents/skills/wheel_swap/SKILL.md` | Busca reemplazos de librerías |

## Event Bus

WheelSaver emite estos eventos en el Event Bus de LifeOS:

- `wheel_saver.search` — Resultados de búsqueda
- `wheel_saver.stats` — Estadísticas consultadas
- `wheel_saver.ask` — Consulta RAG respondida
- `wheel_saver.server.start` — Servidor API iniciado

## Mantenimiento

```bash
# Scrapear nuevos repos (actualizar DB)
cd wheel-saver && venv/Scripts/python cli.py scrape

# Importar desde EvanLi/Github-Ranking
cd wheel-saver && venv/Scripts/python cli.py import evanli

# Importar desde gitstar-ranking.com
cd wheel-saver && venv/Scripts/python cli.py import gitstar

# Ejecutar tests
cd wheel-saver && venv/Scripts/python -m pytest tests/ -v
```

## Variables de entorno

Agrega a `.env`:

```env
GITHUB_TOKEN=github_pat_...   # Para el scraper de GitHub
```

Los API keys de los LLM providers ya están en el `.env` de LifeOS y son
compartidas con WheelSaver.
````

## File: lib/ai/prompts.js
````javascript
/**
 * lib/ai/prompts.js — Prompts estructurados para cada caso de uso
 *
 * Cada prompt tiene:
 *   - role: qué persona debe adoptar el LLM
 *   - instruction: qué debe hacer
 *   - constraints: reglas fijas
 *   - output: formato de respuesta esperado
 *   - examples: (opcional) ejemplos few-shot
 */

const prompts = {

  // ── Análisis de contexto diario ──
  context_analysis: {
    role: 'asistente de contexto personal',
    instruction: `Analiza estos correos importantes y extrae cambios en el contexto del usuario.`,
    constraints: [
      'No inventes informacion',
      'Si no hay cambios, devuelve array vacio',
      'Cada cambio debe tener una categoria clara',
      'Prioriza cambios que requieran accion',
    ],
    output: `{
  "cambios": [
    {
      "tipo": "proceso_nuevo|actualizacion|alerta",
      "categoria": "legal|empleo|estudio|finanzas|gobierno|otro",
      "titulo": "nombre corto",
      "descripcion": "que paso",
      "estado": "estado actual",
      "accion_requerida": true/false,
      "prioridad": 0-3,
      "fecha_limite": "YYYY-MM-DD o null",
      "entidad": "quien envio"
    }
  ],
  "resumen": "parrafo corto con cambios importantes"
}`,
  },

  // ── Decisión de acción (think con IA) ──
  decision: {
    role: 'cerebro de sistema operativo personal',
    instruction: `Analiza el estado actual del sistema y decide que acciones tomar.`,
    constraints: [
      'No sugieras acciones imposibles para el sistema',
      'Prioriza acciones que reduzcan estres o avancen metas',
      'Si no hay nada urgente, no inventes acciones',
      'Cada accion debe tener un event type valido',
    ],
    output: `{
  "decisiones": [
    {
      "type": "event.type.valido",
      "payload": { "campo": "valor" },
      "razon": "explicacion corta de por que"
    }
  ],
  "resumen": "una linea del estado actual"
}`,
  },

  // ── Matching de ofertas laborales ──
  job_match: {
    role: 'reclutador tech senior',
    instruction: `Evalua la compatibilidad entre el perfil del candidato y la oferta.`,
    constraints: [
      'Solo usa la informacion proporcionada',
      'No inventes skills',
      'Sé objetivo con gaps de experiencia',
    ],
    output: `{
  "score": 0-100,
  "recomendar": true/false,
  "match_skills": ["skill1", "skill2"],
  "gap_skills": ["gap1"],
  "razon": "una frase"
}`,
  },

  // ── Resumen de correos ──
  email_summary: {
    role: 'asistente de productividad',
    instruction: `Resume cada correo en una linea en español. Solo los importantes.`,
    constraints: [
      'Maximo una linea por correo',
      'Incluye remitente y accion requerida si aplica',
    ],
    output: `[
  { "from": "remitente", "subject": "asunto", "summary": "resumen de una linea" }
]`,
  },

  // ── Extracción de datos de documentos ──
  document_extract: {
    role: 'extractor de datos estructurados',
    instruction: `Extrae informacion estructurada del siguiente documento.`,
    constraints: [
      'Solo extrae lo que este explicitamente en el texto',
      'No infieras datos que no esten presentes',
      'Mantén el formato exacto de fechas y montos',
    ],
    output: `{
  "tipo_documento": "factura|contrato|carta|otro",
  "entidad": "nombre de la entidad",
  "fecha": "YYYY-MM-DD",
  "monto": numero o null,
  "referencia": "numero de referencia",
  "concepto": "descripcion breve"
}`,
  },
};

function get(type) {
  const p = prompts[type];
  if (!p) return null;
  const parts = [
    `Eres ${p.role}.`,
    p.instruction,
    ...(p.constraints || []).map(c => `- ${c}`),
    '',
    'Responde SOLO con JSON:',
    p.output,
  ];
  if (p.examples) parts.push('', 'Ejemplos:', JSON.stringify(p.examples, null, 2));
  return parts.join('\n');
}

module.exports = { prompts, get };
````

## File: lib/data/reader.js
````javascript
/**
 * lib/data/reader.js
 *
 * Lectura genérica de archivos (JSON y texto).
 * Las funciones específicas de dominio fueron eliminadas (Jul 2026) —
 * cada módulo ahora gestiona sus propias lecturas o usa better-sqlite3.
 */

const fs = require('node:fs');

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function read(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

module.exports = { readJSON, read };
````

## File: lib/data/writer.js
````javascript
const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function write(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, 'utf8');
}

function append(filePath, content) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, content, 'utf8');
}

module.exports = { writeJSON, write, append };
````

## File: lib/events/event_registry.js
````javascript
/**
 * lib/event_registry.js
 *
 * Registro central de handlers. Se auto-ejecuta al requerirlo.
 * Todos los handlers son async (el bus los ejecuta con retry).
 */
const bus = require('./event_bus');
const { sendNotification } = require('../integrations/notifications');
const { connectToBus } = require('../jobs/feedbackEngine');
let LedgerStore = null;
try { LedgerStore = require('../../runtime/stores/LedgerStore'); } catch {}

// WheelSaver skill (cargada lazy)
let wheelSaverSkill = null;
function getWheelSaverSkill() {
  if (!wheelSaverSkill) {
    try { wheelSaverSkill = require('../../skills/wheel_saver'); } catch {}
  }
  return wheelSaverSkill;
}

function init() {
  // Conectar Feedback Engine al Event Bus
  connectToBus(bus);

  bus.on('email.processed', async (ev) => {
    LedgerStore.emit('email_processed', { event_id: ev.id, from: ev.payload.from, subject: ev.payload.subject, action: ev.payload.action });
  });

  bus.on('email.important', async (ev) => {
    const message = `<b>Correo Importante</b>\nDe: ${ev.payload.from}\nAsunto: ${ev.payload.subject}\n${ev.payload.summary || ''}`;
    await sendNotification('Correo Importante', message, 'email');
  });

  bus.on('case.created', async (ev) => {
    LedgerStore.emit('case_created', { event_id: ev.id, tipo: ev.payload.tipo, titulo: ev.payload.titulo, estado: ev.payload.estado });
    if (ev.payload.prioridad === 0) {
      await sendNotification('Caso Prioritario', `Nuevo caso prioritario\n${ev.payload.tipo}: ${ev.payload.titulo}`, 'cases');
    }
  });

  bus.on('case.updated', async (ev) => {
    LedgerStore.emit('case_updated', { event_id: ev.id, id: ev.payload.id, tipo: ev.payload.tipo, estado: ev.payload.estado });
  });

  bus.on('job.applied', async (ev) => {
    LedgerStore.emit('job_applied', { event_id: ev.id, empresa: ev.payload.empresa, cargo: ev.payload.cargo, plataforma: ev.payload.plataforma, score: ev.payload.score });
  });

  bus.on('job.rejection', async (ev) => {
    LedgerStore.emit('job_rejection', { event_id: ev.id, empresa: ev.payload.empresa, cargo: ev.payload.cargo });
  });

  bus.on('event.scheduled', async (ev) => {
    LedgerStore.emit('event_scheduled', { event_id: ev.id, titulo: ev.payload.titulo, slot: ev.payload.slot, motivo: ev.payload.motivo });
  });

  bus.on('scheduler.conflict', async (ev) => {
    LedgerStore.emit('scheduler_conflict', { event_id: ev.id, titulo: ev.payload.titulo, slot: ev.payload.slot, sugerencia: ev.payload.sugerencia });
  });

  bus.on('context.daily', async (ev) => {
    LedgerStore.emit('context_daily', { event_id: ev.id, emails: ev.payload.emails, cambios: ev.payload.cambios, resumen: ev.payload.resumen });
  });

  // ── Notificaciones adicionales ─────────────────────────────
  bus.on('scheduler.conflict', async (ev) => {
    const message = `Conflicto de horario\nEvento: ${ev.payload.titulo}\nSlot: ${ev.payload.slot}\nSugerencia: ${ev.payload.sugerencia}`;
    await sendNotification('Conflicto de Agenda', message, 'scheduler');
  });

  bus.on('job.rejection', async (ev) => {
    const message = `Rechazo laboral\nEmpresa: ${ev.payload.empresa}\nCargo: ${ev.payload.cargo}`;
    await sendNotification('Rechazo Laboral', message, 'jobs');
  });

  // ── WheelSaver Events ─────────────────────────────────────
  bus.on('wheel_saver.search', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      const result = await skill.run({
        payload: { action: 'search', query: ev.payload.query, options: ev.payload.options },
      });
      LedgerStore.emit('wheel_saver_search', { event_id: ev.id, query: ev.payload.query, count: result.results?.length ?? 0 });
    } catch {}
  });

  bus.on('wheel_saver.stats', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      await skill.run({ payload: { action: 'stats' } });
    } catch {}
  });

  bus.on('wheel_saver.ask', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      const result = await skill.run({ payload: { action: 'ask', query: ev.payload.question } });
      LedgerStore.emit('wheel_saver_ask', { event_id: ev.id, question: ev.payload.question });
    } catch {}
  });

  bus.on('wheel_saver.server.start', async (ev) => {
    LedgerStore.emit('wheel_saver_server', { event_id: ev.id, action: 'start', port: ev.payload.port });
  });
}

init();
module.exports = { init };
````

## File: lib/integrations/calendar_client.js
````javascript
/**
 * calendar_client.js
 * Cliente Google Calendar para LifeOS.
 * Lee eventos, crea recordatorios, sincroniza con tareas pendientes.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const { authorize } = require('./google_auth');

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Obtener los próximos N eventos del calendario primario
 */
async function getProximosEventos(maxResults = 10, dias = 7) {
  try {
    const auth = await authorize(CALENDAR_SCOPES);
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const until = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: until.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    return events.map(e => ({
      id: e.id,
      titulo: e.summary || '(sin título)',
      inicio: e.start.dateTime || e.start.date,
      fin: e.end?.dateTime || e.end?.date,
      descripcion: e.description || '',
      lugar: e.location || '',
      link: e.htmlLink,
    }));
  } catch (e) {
    if (e.message?.includes('invalid_grant') || e.message?.includes('Token')) {
      return { error: 'Token expirado. Corre: node scripts/setup_google_calendar.js' };
    }
    if (e.message?.includes('Calendar API has not been used')) {
      return { error: 'Habilita Calendar API en console.cloud.google.com/apis/library' };
    }
    return { error: e.message };
  }
}

/**
 * Busca si ya existe un evento con título similar en una ventana de tiempo.
 * Retorna true si existe al menos un match.
 */
async function findExistingEvent(calendar, summary, timeMin, timeMax) {
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      q: summary,
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      singleEvents: true,
    });
    return (res.data.items || []).length > 0;
  } catch {
    return false; // si falla la búsqueda, insertar de todas formas
  }
}

/**
 * Crear un evento en el calendario (con dedup automático)
 */
async function crearEvento({ titulo, inicio, fin, descripcion = '', lugar = '' }) {
  try {
    const auth = await authorize(CALENDAR_SCOPES);
    const calendar = google.calendar({ version: 'v3', auth });

    // Dedup: verificar si ya existe
    if (await findExistingEvent(calendar, titulo, inicio, fin || inicio)) {
      console.log(`[Calendar] ⏭️ Ya existe: ${titulo}`);
      return { ok: true, skipped: true };
    }

    const event = {
      summary: titulo,
      description: descripcion,
      location: lugar,
      start: { dateTime: new Date(inicio).toISOString(), timeZone: 'America/Bogota' },
      end: { dateTime: new Date(fin || inicio).toISOString(), timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
    console.log(`[Calendar] ✅ Evento creado: ${titulo} (${res.data.id})`);
    return { ok: true, id: res.data.id, link: res.data.htmlLink };
  } catch (e) {
    console.error('[Calendar] Error creando evento:', e.message);
    return { ok: false, error: e.message };
  }
}

/**
 * Resumen del calendario para el briefing diario
 */
async function getBriefingCalendar() {
  const eventos = await getProximosEventos(5, 3); // próximos 3 días
  if (eventos.error) return `❌ Calendar no disponible: ${eventos.error}`;
  if (eventos.length === 0) return '📅 Sin eventos próximos (3 días)';

  const lines = eventos.map(e => {
    const fecha = new Date(e.inicio).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    return `• ${fecha} — ${e.titulo}`;
  });

  return `📅 Próximos eventos:\n${lines.join('\n')}`;
}

module.exports = { getProximosEventos, crearEvento, getBriefingCalendar };
````

## File: lib/integrations/crawl4ai_client.js
````javascript
/**
 * crawl4ai_client.js
 * Wrapper HTTP para crawl4ai (servidor local Python).
 * Si crawl4ai no está corriendo, hace fallback a cheerio/playwright nativo.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const CRAWL4AI_BASE = process.env.CRAWL4AI_URL || 'http://localhost:11235';
const TIMEOUT_MS = 15000;

/**
 * Extrae texto limpio de una URL usando crawl4ai si está disponible.
 * Fallback: fetch nativo + extracción básica.
 * @param {string} url
 * @param {object} opts
 * @returns {Promise<{markdown: string, success: boolean, source: string}>}
 */
async function crawl(url, opts = {}) {
  // Intentar crawl4ai primero
  try {
    const res = await fetch(`${CRAWL4AI_BASE}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [url],
        priority: 10,
        word_count_threshold: 10,
        extraction_strategy: 'NoExtractionStrategy',
        chunking_strategy: 'RegexChunking',
        ...opts
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (res.ok) {
      const data = await res.json();
      const result = data?.results?.[0];
      if (result?.markdown) {
        console.log(`[Crawl4AI] ✅ ${url} → ${result.markdown.length} chars`);
        return { markdown: result.markdown, success: true, source: 'crawl4ai' };
      }
    }
  } catch {
    // crawl4ai no disponible, fallback silencioso
  }

  // Fallback: fetch + texto plano
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 LifeOS/1.0' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const html = await res.text();
    // Extracción básica sin JSDOM (solo texto visible)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 8000);

    console.log(`[Crawl4AI] ⚡ fallback fetch → ${text.length} chars`);
    return { markdown: text, success: true, source: 'fetch_fallback' };
  } catch (e) {
    return { markdown: '', success: false, source: 'error', error: e.message };
  }
}

/**
 * Verifica si crawl4ai está disponible
 */
async function isAvailable() {
  try {
    const res = await fetch(`${CRAWL4AI_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { crawl, isAvailable, CRAWL4AI_BASE };
````

## File: lib/integrations/notifications.js
````javascript
/**
 * lib/integrations/notifications.js — LifeOS Unified Notification Module
 *
 * Envía alertas a través de Apprise (multi-canal).
 * Si Apprise no está disponible, hace fallback al módulo nativo de Telegram.
 *
 * Uso:
 *   const { sendNotification } = require('./notifications');
 *   await sendNotification('Título', 'Mensaje', 'info');
 */

const APPRISE_URL = process.env.APPRISE_URL || 'http://localhost:8000';

async function sendNotification(title, message, tag = 'lifeos') {
  const payload = { title, body: message, tag, format: 'html' };

  // ── Intento primario: Apprise ──
  try {
    const response = await fetch(`${APPRISE_URL}/notify/apprise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      console.log(`[Notifications] Enviado vía Apprise: "${title}"`);
      return true;
    }

    const body = await response.text().catch(() => '');
    console.warn(`[Notifications] Apprise respondió ${response.status}: ${body}`);
  } catch (error) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      console.warn(`[Notifications] Apprise no disponible (${error.message}). Usando fallback Telegram...`);
    } else {
      console.warn(`[Notifications] Error Apprise: ${error.message}. Usando fallback Telegram...`);
    }
  }

  // ── Fallback: Telegram nativo ──
  try {
    const { sendTelegramMessage } = require('./telegram');
    await sendTelegramMessage(`<b>${title}</b>\n\n${message}`);
    return true;
  } catch (fallbackError) {
    console.error(`[Notifications] Fallo total de notificación: ${fallbackError.message}`);
    return false;
  }
}

module.exports = { sendNotification };
````

## File: lib/integrations/wheel_saver_client.js
````javascript
/**
 * wheel_saver_client.js
 * Cliente Node.js para el API REST de WheelSaver (FastAPI)
 *
 * Permite que LifeOS consulte la base de datos de WheelSaver
 * desde JavaScript, siguiendo el patrón de stores de LifeOS.
 *
 * Uso:
 *   const ws = require('./wheel_saver_client');
 *   const results = await ws.search('orm testing');
 *   const stats = await ws.stats();
 */

const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');

const WHEELSAVER_DIR = path.resolve(__dirname, '..', '..', 'wheel-saver');
const VENV_PYTHON = path.join(WHEELSAVER_DIR, 'venv', 'Scripts', 'python.exe');
const CLI_SCRIPT = path.join(WHEELSAVER_DIR, 'cli.py');

const DEFAULT_API_PORT = 8008;
const API_BASE = `http://127.0.0.1:${DEFAULT_API_PORT}`;

// ── Helper: fetch con timeout ──────────────────────────────────────
async function apiFetch(endpoint, opts = {}) {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout ?? 10_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      ...opts,
    });
    if (!res.ok) {
      throw new Error(`WheelSaver API ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`WheelSaver API timeout tras ${opts.timeout ?? 10_000}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Comprobar si el servidor API está corriendo ────────────────────
async function isRunning() {
  try {
    await apiFetch('/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ── Lanzar el servidor API (Fondo) ─────────────────────────────────
let serverProcess = null;

/**
 * Inicia el servidor FastAPI de WheelSaver en un proceso hijo.
 * @param {object} opts
 * @param {number} opts.port - Puerto (default: 8008)
 * @param {number} opts.timeout - Tiempo máximo de espera (default: 15000ms)
 * @returns {Promise<boolean>} true si inició correctamente
 */
async function startServer(opts = {}) {
  if (await isRunning()) return true;

  const port = opts.port ?? DEFAULT_API_PORT;
  return new Promise((resolve, reject) => {
    const env = { ...process.env };

    serverProcess = spawn(VENV_PYTHON, [CLI_SCRIPT, 'api', '--port', String(port)], {
      cwd: WHEELSAVER_DIR,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`WheelSaver server no arrancó en ${opts.timeout ?? 15000}ms`));
      }
    }, opts.timeout ?? 15_000);

    const onData = (stream) => (data) => {
      const msg = data.toString();
      if (!resolved && (msg.includes('Uvicorn running on') || msg.includes('Application startup complete'))) {
        resolved = true;
        clearTimeout(timeout);
        // Darle 500ms más para estabilizar
        setTimeout(() => resolve(true), 500);
      }
    };

    serverProcess.stdout.on('data', onData('stdout'));
    serverProcess.stderr.on('data', onData('stderr'));

    serverProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    serverProcess.on('exit', (code) => {
      serverProcess = null;
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`WheelSaver server exited with code ${code}`));
      }
    });
  });
}

/**
 * Detiene el servidor API de WheelSaver.
 */
function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    return true;
  }
  return false;
}

// ── CLI Bridge (fallback cuando no hay API) ────────────────────────
function runCLI(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(VENV_PYTHON, [CLI_SCRIPT, ...args], {
      cwd: WHEELSAVER_DIR,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`WheelSaver CLI timeout: ${args.join(' ')}`));
    }, opts.timeout ?? 60_000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`WheelSaver CLI exit ${code}: ${stderr.slice(0, 500)}`));
      }
    });

    proc.on('error', reject);
  });
}

// ── API de búsqueda ────────────────────────────────────────────────

/**
 * Busca repos en la base de datos de WheelSaver.
 * @param {string} query - Términos de búsqueda
 * @param {object} opts
 * @param {number} opts.limit - Máx resultados (default: 25)
 * @param {string} opts.language - Filtrar por lenguaje
 * @param {number} opts.minStars - Estrellas mínimas
 * @returns {Promise<Array>}
 */
async function search(query, opts = {}) {
  const params = new URLSearchParams({ q: query });
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.language) params.set('language', opts.language);
  if (opts.minStars) params.set('min_stars', opts.minStars);

  try {
    const res = await apiFetch(`/search?${params}`);
    return res.repos ?? res.results ?? res;
  } catch {
    // Fallback a CLI
    const args = ['search', query, '--limit', String(opts.limit ?? 25)];
    if (opts.language) args.push('--language', opts.language);
    if (opts.minStars) args.push('--min-stars', String(opts.minStars));
    const { stdout } = await runCLI(args);
    return { raw: stdout };
  }
}

/**
 * Obtiene estadísticas de la base de datos.
 * @returns {Promise<object>}
 */
async function stats() {
  try {
    return await apiFetch('/stats');
  } catch {
    const { stdout } = await runCLI(['stats']);
    return { raw: stdout };
  }
}

/**
 * Obtiene la distribución de lenguajes.
 * @param {object} opts
 * @param {number} opts.limit - Máx lenguajes (default: 20)
 * @param {number} opts.minRepos - Mín repos por lenguaje
 * @returns {Promise<Array>}
 */
async function languages(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.minRepos) params.set('min_repos', opts.minRepos);

  try {
    const res = await apiFetch(`/languages?${params}`);
    return res.languages ?? [];
  } catch {
    return [];
  }
}

/**
 * Obtiene los repositorios mejor rankeados.
 * @param {number} limit - Máx resultados (default: 10)
 * @param {string} language - Filtrar por lenguaje
 * @returns {Promise<Array>}
 */
async function top(limit = 10, language = null) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (language) params.set('language', language);

  try {
    const res = await apiFetch(`/top?${params}`);
    return res.repos ?? [];
  } catch {
    return [];
  }
}

/**
 * Consulta RAG a la base de datos: usa LLM para responder con contexto de repos.
 * @param {string} question - Pregunta sobre qué librería usar
 * @returns {Promise<object>}
 */
async function ask(question) {
  try {
    const res = await apiFetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      timeout: 60_000,
    });
    return res;
  } catch {
    const { stdout } = await runCLI(['ask', question], { timeout: 120_000 });
    return { raw: stdout };
  }
}

// ── Verificar instalación ──────────────────────────────────────────
function checkInstallation() {
  const fs = require('node:fs');
  const checks = {
    dir: fs.existsSync(WHEELSAVER_DIR),
    venv: fs.existsSync(VENV_PYTHON),
    cli: fs.existsSync(CLI_SCRIPT),
    db: fs.existsSync(path.join(WHEELSAVER_DIR, 'data', 'top_repos.db')),
  };
  checks.ok = Object.values(checks).every(Boolean);
  return checks;
}

// ── EventEmitter para integración con Event Bus ────────────────────
const events = new EventEmitter();
events.setMaxListeners(20);

module.exports = {
  // Gestión del servidor
  isRunning,
  startServer,
  stopServer,

  // API pública
  search,
  stats,
  languages,
  top,
  ask,
  runCLI,

  // Utilidades
  checkInstallation,
  events,

  // Constantes
  WHEELSAVER_DIR,
  DEFAULT_API_PORT,
};
````

## File: lib/jobs/metrics/applicationMetrics.js
````javascript
/**
 * ApplicationMetrics
 * Mide, registra y reporta el rendimiento del pipeline de empleo.
 *
 * Desde el día 1 registra todo. Sin datos no hay mejora.
 *
 * Output principal: data/state/jobs/metrics/historical.json
 */

const { writeJSON } = require('../../data/writer');
const { PATHS } = require('../../data/paths');

/**
 * @typedef {Object} ScorerRun
 * @property {string} jobId
 * @property {string} company
 * @property {string} title
 * @property {number} totalScore
 * @property {Object} breakdown - ScoreBreakdown completo
 * @property {'apply'|'maybe'|'skip'} decision
 * @property {number} executionTimeMs
 * @property {string} modelUsed - LLM usado (o 'deterministico')
 * @property {number} tokensConsumed
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ApplicationOutcome
 * @property {string} jobId
 * @property {string} company
 * @property {number} score
 * @property {string} appliedAt
 * @property {string|null} responseAt - Fecha de respuesta
 * @property {'applied'|'viewed'|'rejected'|'interview'|'offer'|'accepted'|'ghosted'} status
 * @property {number|null} daysToResponse
 * @property {string|null} rejectionReason - Motivo si lo hay
 */

function recordRun(run) {
  const log = _loadLog();
  log.runs.push({ ...run, timestamp: new Date().toISOString() });
  log.lastUpdated = new Date().toISOString();
  _saveLog(log);
}

function recordOutcome(outcome) {
  const log = _loadLog();
  const existing = log.outcomes.findIndex(o => o.jobId === outcome.jobId);
  if (existing >= 0) {
    log.outcomes[existing] = { ...log.outcomes[existing], ...outcome };
  } else {
    log.outcomes.push({ ...outcome, appliedAt: outcome.appliedAt || new Date().toISOString() });
  }
  log.lastUpdated = new Date().toISOString();
  _saveLog(log);
}

function getStats() {
  const log = _loadLog();
  const outcomes = log.outcomes;
  const total = outcomes.length;
  if (total === 0) {
    return { total: 0, message: 'Aún sin datos. Las métricas mejoran con cada aplicación.' };
  }

  const interviews = outcomes.filter(o => o.status === 'interview' || o.status === 'offer' || o.status === 'accepted').length;
  const offers = outcomes.filter(o => o.status === 'offer' || o.status === 'accepted').length;
  const accepted = outcomes.filter(o => o.status === 'accepted').length;
  const rejected = outcomes.filter(o => o.status === 'rejected').length;
  const ghosted = outcomes.filter(o => o.status === 'ghosted').length;

  const scored = log.runs.length;
  const avgScore = scored > 0 ? Math.round(log.runs.reduce((s, r) => s + r.totalScore, 0) / scored) : 0;

  // Score promedio por resultado
  const scoreByOutcome = {};
  for (const o of outcomes) {
    const run = log.runs.find(r => r.jobId === o.jobId);
    if (run) {
      scoreByOutcome[o.status] = scoreByOutcome[o.status] || [];
      scoreByOutcome[o.status].push(run.totalScore);
    }
  }
  const avgScoreByOutcome = {};
  for (const [status, scores] of Object.entries(scoreByOutcome)) {
    avgScoreByOutcome[status] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return {
    total,
    scored,
    avgScore,
    interviews,
    offers,
    accepted,
    rejected,
    ghosted,
    conversionRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
    offerRate: total > 0 ? Math.round((offers / total) * 100) : 0,
    avgScoreByOutcome,
  };
}

function _loadLog() {
  try {
    return JSON.parse(require('fs').readFileSync(PATHS.JOBS_METRICS, 'utf8'));
  } catch {
    return { runs: [], outcomes: [], lastUpdated: null };
  }
}

function _saveLog(data) {
  const fs = require('fs');
  const dir = require('path').dirname(PATHS.JOBS_METRICS);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  writeJSON(PATHS.JOBS_METRICS, data);
}

module.exports = { recordRun, recordOutcome, getStats };
````

## File: lib/jobs/reviewers/ats.js
````javascript
/**
 * ATS Reviewer — 100% determinístico
 *
 * Revisa el CV contra reglas de sistemas de tracking.
 * Sin IA. Solo formato, keywords, estructura.
 *
 * Output: ATSReview { score, issues[], warnings[], passed }
 */

function review(cvText, job) {
  const issues = [];
  const warnings = [];

  // Longitud
  const lines = cvText.split('\n').filter(l => l.trim());
  if (lines.length > 60) issues.push({ type: 'too_long', severity: 'alta', detail: `${lines.length} líneas, máximo 60` });
  else if (lines.length > 50) warnings.push({ type: 'long', detail: `${lines.length} líneas, ideal <50` });

  // Palabras clave de la oferta
  const keywords = _extractKeywords(job);
  const missing = keywords.filter(k => !cvText.toLowerCase().includes(k.toLowerCase()));
  if (missing.length > 3) {
    issues.push({ type: 'missing_keywords', severity: 'alta', detail: `${missing.length} keywords ausentes`, keywords: missing });
  } else if (missing.length > 0) {
    warnings.push({ type: 'few_missing_keywords', detail: `${missing.length} keywords ausentes`, keywords: missing });
  }

  // Secciones obligatorias
  const sections = { experiencia: /experiencia|trayectoria|historial/i, educacion: /educación|educacion|formación|formacion|estudio/i, skills: /habilidades|skills|competencias|tecnologías|tecnologias/i };
  const missingSections = [];
  for (const [name, regex] of Object.entries(sections)) {
    if (!regex.test(cvText)) missingSections.push(name);
  }
  if (missingSections.length > 0) {
    issues.push({ type: 'missing_sections', severity: 'alta', detail: `Faltan: ${missingSections.join(', ')}` });
  }

  // Tablas (ATS las lee mal)
  if (/\|.*\|.*\|/.test(cvText)) warnings.push({ type: 'tables_detected', detail: 'Posibles tablas, algunos ATS no las leen bien' });

  // Contacto
  if (!/\b[\w.-]+@[\w.-]+\.\w+\b/.test(cvText)) issues.push({ type: 'missing_email', severity: 'media', detail: 'No se detecta email' });

  const score = _calculateScore(issues, warnings);
  const passed = score >= 70;

  const result = { reviewer: 'ats', score, passed, issues, warnings };
  return result;
}

function _extractKeywords(job) {
  const words = new Set();
  if (job.requirements) job.requirements.forEach(r => r.split(/\s+/).forEach(w => { if (w.length > 3) words.add(w); }));
  if (job.title) job.title.split(/\s+/).forEach(w => { if (w.length > 3) words.add(w); });
  return [...words].slice(0, 15);
}

function _calculateScore(issues, warnings) {
  let score = 100;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 8 : 5;
  score -= warnings.length * 3;
  return Math.max(0, score);
}

module.exports = { review };
````

## File: lib/jobs/reviewers/consistency.js
````javascript
/**
 * Consistency Reviewer — 100% determinístico
 *
 * Verifica coherencia interna del CV:
 *   - Fechas cronológicas
 *   - Skills repetidas
 *   - Cargos duplicados
 *   - Skills en experiencia vs skills declaradas
 *
 * Sin IA. Solo reglas.
 */

function review(cvText, job) {
  const issues = [];

  // Detectar contradicción seniority vs años
  const years = _extractYears(cvText);
  const seniority = _detectSeniorityClaim(cvText);
  if (seniority && years < 2 && /senior|lead|principal/i.test(seniority)) {
    issues.push({ type: 'seniority_mismatch', severity: 'media', detail: `Se declara ${seniority} con ~${years} años de experiencia` });
  }

  // Skills que aparecen en experiencia pero no en skills declaradas
  const declaredSkills = _extractDeclaredSkills(cvText);
  const skillsInExperience = _extractSkillsFromExperience(cvText);
  const undeclared = skillsInExperience.filter(s => !declaredSkills.some(d => d.includes(s) || s.includes(d)));
  if (undeclared.length > 3) {
    issues.push({ type: 'undeclared_skills', severity: 'leve', detail: `${undeclared.length} skills en experiencia no declaradas en skills`, skills: undeclared.slice(0, 5) });
  }

  // Cargos duplicados
  const titles = _extractTitles(cvText);
  const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (dupes.length > 0) {
    issues.push({ type: 'duplicate_titles', severity: 'leve', detail: `Cargos repetidos: ${[...new Set(dupes)].join(', ')}` });
  }

  const score = _calculateScore(issues);
  const passed = score >= 80;

  return { reviewer: 'consistency', score, passed, issues };
}

function _extractYears(text) {
  // Estimación simple por rango de fechas
  const dates = text.match(/\b(20\d{2})\b/g);
  if (!dates || dates.length < 2) return 0;
  const nums = dates.map(Number).sort();
  return Math.max(1, nums[nums.length - 1] - nums[0]);
}

function _detectSeniorityClaim(text) {
  const match = text.match(/\b(junior|semisenior|semi.senior|senior|lead|principal)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function _extractDeclaredSkills(text) {
  // Busca sección de skills
  const section = text.match(/(?:skills|habilidades|competencias|tecnologías)[\s\S]{1,500}/i);
  if (!section) return [];
  return section[0].split(/\n/).map(l => l.replace(/^[•\-*\d.\s]+/, '').trim()).filter(l => l.length > 1 && l.length < 40);
}

function _extractSkillsFromExperience(text) {
  const techs = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'git',
    'docker', 'aws', 'azure', 'playwright', 'selenium', 'cypress', 'api', 'mongodb',
    'postgresql', 'mysql', 'linux', 'kubernetes', 'ci/cd', 'jenkins', 'github actions'];
  return techs.filter(t => text.toLowerCase().includes(t));
}

function _extractTitles(text) {
  const lines = text.split('\n').filter(l => l.trim());
  // Busca líneas que parezcan cargos
  return lines.filter(l => /\b(engineer|analyst|developer|lead|manager|coordinator|assistant|specialist|tester|qa)\b/i.test(l))
    .map(l => l.trim().substring(0, 60));
}

function _calculateScore(issues) {
  let score = 100;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 10 : 5;
  return Math.max(0, score);
}

module.exports = { review };
````

## File: lib/jobs/reviewers/recruiter.js
````javascript
/**
 * Recruiter Reviewer — LLM-only (semántico)
 *
 * Evalúa aspectos que solo un humano (o LLM) puede juzgar:
 *   - Narrativa y tono
 *   - Logros vs responsabilidades
 *   - Alineación con la oferta
 *   - Red flags
 *
 * Solo se ejecuta si los otros reviewers pasan.
 * Guarda tokens.
 */

function review(cvText, job) {
  // Placeholder: implementar llamada LLM aquí
  // Por ahora retorna neutral
  return {
    reviewer: 'recruiter',
    score: 75,
    passed: true,
    needsLLM: true,
    issues: [],
    note: 'Revisor LLM no implementado. Score neutral 75.',
  };
}

module.exports = { review };
````

## File: lib/jobs/reviewers/technical.js
````javascript
/**
 * Technical Reviewer — Híbrido
 *
 * 90% determinístico: skills match, profundidad, relevancia.
 * 10% LLM (solo si confidence < 0.7): alineación técnica real.
 */

function review(cvText, job) {
  const issues = [];

  // Skills match ponderado por nivel
  const reqSkills = job.requirements || [];
  const matched = [];
  const missing = [];

  for (const req of reqSkills) {
    const rl = req.toLowerCase();
    const found = _findSkillDepth(cvText, rl);
    if (found.found) matched.push({ skill: req, depth: found.depth });
    else missing.push({ skill: req });
  }

  const coverage = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 100;

  // Seniority match
  const cvSeniority = _detectSeniority(cvText);
  const jobSeniority = _normalizeSeniority(job.experienceLevel);
  if (cvSeniority && jobSeniority) {
    const diff = cvSeniority.level - jobSeniority.level;
    if (diff < -1) issues.push({ type: 'underqualified', severity: 'alta', detail: `CV muestra ${cvSeniority.name}, oferta pide ${job.experienceLevel}` });
    else if (diff > 1) issues.push({ type: 'overqualified', severity: 'leve', detail: `CV muestra ${cvSeniority.name}, oferta pide ${job.experienceLevel}` });
  }

  // Tecnologías mencionadas sin profundidad
  const shallowTechs = matched.filter(m => m.depth === 'mencion');
  if (shallowTechs.length > 2) issues.push({ type: 'shallow_skills', severity: 'leve', detail: `${shallowTechs.length} skills solo mencionadas sin contexto` });

  const score = _calculateScore(coverage, issues);
  const needsLLM = score < 70 || issues.length > 2;

  return {
    reviewer: 'technical',
    score,
    passed: score >= 65,
    coverage,
    matched,
    missing,
    issues,
    needsLLM,
  };
}

function _findSkillDepth(text, skill) {
  const regex = new RegExp(`.{0,100}${skill}.{0,100}`, 'gi');
  const match = regex.exec(text);
  if (!match) return { found: false, depth: null };

  const ctx = match[0].toLowerCase();
  if (/\b(\d+\s*años?|experto|avanzado|profundo|extensive|senior)\b/.test(ctx)) return { found: true, depth: 'profundo' };
  if (/\b(intermedio|medio|trabajé|usé|utilicé|implementé|desarrollé|creé)\b/.test(ctx)) return { found: true, depth: 'aplicado' };
  return { found: true, depth: 'mencion' };
}

function _detectSeniority(text) {
  const levels = [
    { name: 'junior', regex: /\b(junior|jr|trainee|practicante)\b/i, level: 1 },
    { name: 'semisenior', regex: /\b(semisenior|semi.senior|mid.level|intermediate)\b/i, level: 2 },
    { name: 'senior', regex: /\b(senior|sr\.?|lead|principal)\b/i, level: 3 },
  ];
  for (const l of levels) if (l.regex.test(text)) return l;
  return null;
}

function _normalizeSeniority(level) {
  if (!level) return null;
  const map = { junior: 1, jr: 1, semisenior: 2, 'semi-senior': 2, senior: 3, lead: 3, principal: 3 };
  return { name: level, level: map[level.toLowerCase()] || 2 };
}

function _calculateScore(coverage, issues) {
  let score = coverage;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 10 : 5;
  return Math.max(0, Math.min(100, score));
}

module.exports = { review };
````

## File: lib/jobs/types/ApplicationDecision.js
````javascript
/**
 * @typedef {Object} ApplicationDecision
 * @property {'apply'|'skip'|'maybe'} action
 * @property {number} score - Score total que justifica la decisión
 * @property {number} scoreThreshold - Umbral mínimo configurado
 * @property {string} reasoning - Por qué se tomó esta decisión
 * @property {Object} [application] - Datos de la aplicación generada
 * @property {string} [application.cvPath] - Ruta del CV generado
 * @property {string} [application.coverLetter] - Carta de presentación
 * @property {string} [application.appliedAt] - Fecha de aplicación
 * @property {string[]} [highlights] - Puntos destacados del CV
 */

/**
 * @typedef {'applied'|'viewed'|'rejected'|'interview'|'technical_test'|'offer'|'accepted'|'declined'|'ghosted'} ApplicationStatus
 * Máquina de estados de una aplicación laboral.
 */

module.exports = {};
````

## File: lib/jobs/types/CandidateProfile.js
````javascript
/**
 * @typedef {Object} CandidateProfile
 * Perfil del candidato construido desde data/user/ y masterledger.
 * @property {string} name
 * @property {string[]} skills - Lista de skills técnicas
 * @property {string} [seniority] - Nivel de seniority
 * @property {string[]} [languages] - Idiomas con nivel
 * @property {Object[]} [experience] - Experiencia laboral
 * @property {string} experience.title
 * @property {string} experience.company
 * @property {string} [experience.startDate]
 * @property {string} [experience.endDate]
 * @property {string[]} [education] - Educación
 * @property {string[]} [certifications]
 * @property {Object} [preferences] - Preferencias laborales
 * @property {number} [preferences.salaryMin] - Salario mínimo aceptable
 * @property {string[]} [preferences.modalities] - Modalidades aceptadas
 * @property {string[]} [preferences.targetCompanies] - Empresas objetivo
 * @property {string[]} [preferences.targetRoles] - Roles objetivo
 * @property {string[]} [preferences.excludeCompanies] - Empresas a evitar
 * @property {string} [preferences.location] - Ubicación preferida
 */

module.exports = {};
````

## File: lib/jobs/types/CompanyProfile.js
````javascript
/**
 * @typedef {Object} CompanyProfile
 * @property {string} name
 * @property {string} [industry]
 * @property {number} [size] - Número de empleados
 * @property {string} [location]
 * @property {string} [website]
 * @property {string} [description]
 * @property {number} [rating] - Reputación 0-5
 * @property {boolean} [isTarget] - Es empresa objetivo
 * @property {'alta'|'media'|'baja'} [priority] - Prioridad para aplicar
 */

module.exports = {};
````

## File: lib/jobs/types/GapReport.js
````javascript
/**
 * @typedef {Object} GapReport
 * @property {string[]} missingSkills - Skills que pide la oferta y no están en el perfil
 * @property {string[]} matchedSkills - Skills que coinciden
 * @property {string[]} exceededSkills - Skills del perfil que no pide la oferta
 * @property {Object[]} experienceGaps - Brechas de experiencia
 * @property {'experience'|'education'|'certification'|'language'} experienceGaps.type
 * @property {string} experienceGaps.description
 * @property {'critico'|'moderado'|'leve'} experienceGaps.severity
 * @property {string} experienceGaps.mitigation - Cómo cubrirlo
 * @property {Object[]} strengthsToHighlight - Experiencias que más aportan
 * @property {'cover'|'highlight'} strengthsToHighlight.action
 * @property {string} strengthsToHighlight.reason
 * @property {number} coverage - Porcentaje de cobertura 0-100
 * @property {string} summary - Resumen ejecutivo del gap
 */

module.exports = {};
````

## File: lib/jobs/types/InterviewPack.js
````javascript
/**
 * @typedef {Object} InterviewPack
 * @property {string} company
 * @property {string} role
 * @property {Object[]} probableQuestions - Preguntas probables
 * @property {string} probableQuestions.question
 * @property {string} probableQuestions.answer - Respuesta sugerida
 * @property {string} probableQuestions.category - tecnica|comportamental|cultural
 * @property {Object[]} strengths - Fortalezas a destacar
 * @property {string} strengths.point
 * @property {string} strengths.story - Historia STAR asociada
 * @property {Object[]} risks - Riesgos a preparar
 * @property {string} risks.issue
 * @property {string} risks.mitigation - Cómo abordarlo
 * @property {Object[]} [technicalPrep] - Preparación técnica
 * @property {string} technicalPrep.topic
 * @property {string} technicalPrep.resources
 * @property {string} summary - Resumen ejecutivo
 * @property {string[]} questionsToAsk - Preguntas para hacerle a la empresa
 */

module.exports = {};
````

## File: lib/jobs/types/JobPosting.js
````javascript
/**
 * @typedef {Object} JobPosting
 * Propiedad: fuente de la oferta (computrabajo, linkedin, indeed, correo, etc)
 * @property {string} source
 * @property {string} sourceId - ID único en la fuente original
 * @property {string} title - Cargo
 * @property {string} company - Nombre de la empresa
 * @property {string} [location] - Ubicación
 * @property {'remoto'|'hibrido'|'presencial'} [modality]
 * @property {number} [salaryMin] - Salario mínimo ofrecido
 * @property {number} [salaryMax] - Salario máximo ofrecido
 * @property {string} [currency] - COP, USD
 * @property {string} description - Descripción completa de la oferta
 * @property {string[]} requirements - Lista de requisitos
 * @property {string[]} [niceToHave] - Requisitos deseables
 * @property {string[]} [responsibilities] - Responsabilidades
 * @property {string[]} [benefits] - Beneficios
 * @property {'indefinido'|'fijo'|'temporal'|'freelance'} [contractType]
 * @property {'full-time'|'part-time'|'por-temporada'} [employmentType]
 * @property {string} [industry] - Sector industrial
 * @property {string} [experienceLevel] - Nivel de experiencia requerido
 * @property {boolean} [requiresEnglish] - Requiere inglés
 * @property {string} [englishLevel] - Nivel de inglés requerido
 * @property {string} url - URL de la oferta original
 * @property {string} [companyUrl] - URL de la empresa
 * @property {string} [companyLogo] - URL del logo
 * @property {Date} postedAt - Fecha de publicación
 * @property {Date} fetchedAt - Fecha de obtención
 * @property {Object} [raw] - Datos crudos de la fuente original
 */

/**
 * @returns {JobPosting}
 */
function create(data) {
  return {
    source: data.source || 'unknown',
    sourceId: data.sourceId || '',
    title: data.title || '',
    company: data.company || '',
    location: data.location,
    modality: data.modality || 'presencial',
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    currency: data.currency || 'COP',
    description: data.description || '',
    requirements: data.requirements || [],
    niceToHave: data.niceToHave || [],
    responsibilities: data.responsibilities || [],
    benefits: data.benefits || [],
    contractType: data.contractType,
    employmentType: data.employmentType || 'full-time',
    industry: data.industry,
    experienceLevel: data.experienceLevel,
    requiresEnglish: data.requiresEnglish || false,
    englishLevel: data.englishLevel,
    url: data.url || '',
    companyUrl: data.companyUrl,
    companyLogo: data.companyLogo,
    postedAt: data.postedAt ? new Date(data.postedAt) : new Date(),
    fetchedAt: new Date(),
    raw: data.raw,
  };
}

module.exports = { create };
````

## File: lib/jobs/types/ScoreBreakdown.js
````javascript
/**
 * @typedef {Object} ScoreBreakdown
 * Desglose completo del score de una oferta.
 * Los pesos son configurables desde data/config/jobs/scoring_weights.json
 * @property {number} total - Score total 0-100
 * @property {number} skills - Coincidencia de skills técnicas
 * @property {number} seniority - Nivel de experiencia
 * @property {number} salary - Ajuste salarial
 * @property {number} location - Ubicación y modalidad
 * @property {number} english - Inglés
 * @property {number} company - Empresa objetivo o industria
 * @property {number} growth - Potencial de crecimiento
 * @property {number} llmAlignment - Evaluación del LLM (0-30% del total)
 * @property {string[]} strengths - Fortalezas detectadas
 * @property {string[]} weaknesses - Debilidades detectadas
 * @property {string[]} redFlags - Señales de alerta
 * @property {string} reasoning - Explicación en lenguaje natural
 */

/**
 * @returns {ScoreBreakdown}
 */
function createEmpty(jobTitle) {
  return {
    total: 0,
    skills: 0,
    seniority: 0,
    salary: 0,
    location: 0,
    english: 0,
    company: 0,
    growth: 0,
    llmAlignment: 0,
    strengths: [],
    weaknesses: [],
    redFlags: [],
    reasoning: `Score calculado para ${jobTitle || 'la oferta'}`,
  };
}

module.exports = { createEmpty };
````

## File: lib/jobs/gapAnalyzer.js
````javascript
/**
 * GapAnalyzer — Cuantitativo
 *
 * Compara una oferta contra el perfil y produce:
 *   - Cobertura % por categoría
 *   - Skills matching detallado (✅⚠️❌)
 *   - Impacto estimado de cerrar cada brecha
 *   - ROI de aprendizaje por skill faltante
 *
 * No genera texto libre. Solo datos.
 */

let bus;
try { bus = require('../events/event_bus'); } catch { bus = null; }

/**
 * @param {Object} job     - JobPosting normalizado
 * @param {Object} profile - CandidateProfile
 * @returns {Object} gapReport
 */
function analyze(job, profile) {
  const skills = _analyzeSkills(job.requirements || [], profile.skills || []);
  const experience = _analyzeExperience(job, profile);
  const coverage = _calculateCoverage(skills, experience);

  const result = {
    jobTitle: job.title,
    company: job.company,
    coverage,
    skills,
    experience,
    learningROI: _calculateLearningROI(skills, job.requirements || []),
    summary: `${coverage.overall}% cobertura — ${skills.matched}/${skills.total} skills.`,
  };

  if (bus) { try {
    bus.emit('job.gap_analyzed', {
      jobId: job.sourceId || job.url,
      coverage: coverage.overall,
      missingSkills: skills.details.filter(s => s.status === 'missing').map(s => s.name),
    }, { source: 'gapAnalyzer', priority: 'low' });
  } catch (_) {} }

  return result;
}

function _analyzeSkills(requirements, profileSkills) {
  const profileLower = profileSkills.map(s => s.toLowerCase());
  const details = requirements.map(req => {
    const rl = req.toLowerCase();
    const match = profileLower.some(ps => ps.includes(rl) || rl.includes(ps));
    const partial = !match && profileLower.some(ps => {
      const words = rl.split(/\s+/);
      return words.some(w => w.length > 3 && ps.includes(w));
    });
    return {
      name: req,
      status: match ? 'matched' : partial ? 'partial' : 'missing',
      inProfile: match || partial,
    };
  });

  return {
    total: details.length,
    matched: details.filter(d => d.status === 'matched').length,
    partial: details.filter(d => d.status === 'partial').length,
    missing: details.filter(d => d.status === 'missing').length,
    coverage: Math.round((details.filter(d => d.inProfile).length / details.length) * 100),
    details,
  };
}

function _analyzeExperience(job, profile) {
  const issues = [];
  // Sin datos de experiencia aún
  return {
    yearsMatch: null,
    issues,
    coverage: 100,
  };
}

function _calculateCoverage(skills, experience) {
  const overall = Math.round((skills.coverage + experience.coverage) / 2);
  return { overall, skills: skills.coverage, experience: experience.coverage };
}

function _calculateLearningROI(skills, requirements) {
  // Por cada skill faltante, estima:
  // - frecuencia en el mercado (proxy: requisitos similares)
  // - cuanto subiría el score si la aprendiera
  // - tiempo estimado de aprendizaje
  const missing = skills.details.filter(s => s.status === 'missing');
  return missing.map(skill => {
    const difficulty = _estimateDifficulty(skill.name);
    const scoreImpact = _estimateScoreImpact(skill.name, requirements.length);
    const marketDemand = _estimateMarketDemand(skill.name);
    return {
      skill: skill.name,
      status: 'missing',
      scoreImpact: `${scoreImpact} pts`,
      difficulty,
      estimatedHours: difficulty === 'baja' ? 20 : difficulty === 'media' ? 60 : 120,
      marketDemand,
      roi: marketDemand === 'alta' && difficulty !== 'alta' ? 'alto' : 'bajo',
      recommendation: _recommendation(marketDemand, difficulty, scoreImpact),
    };
  });
}

function _estimateDifficulty(skill) {
  const name = skill.toLowerCase();
  if (/docker|kubernetes|aws|azure|ci\/cd|terraform/i.test(name)) return 'media';
  if (/rust|machine learning|deep learning|ia|blockchain/i.test(name)) return 'alta';
  if (/python|javascript|typescript|sql|git|api|selenium|playwright|cypress/i.test(name)) return 'baja';
  return 'media';
}

function _estimateScoreImpact(skill, totalRequirements) {
  return Math.round((1 / Math.max(totalRequirements, 1)) * 100);
}

function _estimateMarketDemand(skill) {
  const name = skill.toLowerCase();
  if (/docker|kubernetes|aws|python|react|node|sql|git|api|playwright|selenium|ci\/cd/i.test(name)) return 'alta';
  if (/(java|c#|.net|php|angular|typescript|azure|devops)/i.test(name)) return 'alta';
  return 'media';
}

function _recommendation(demand, difficulty, impact) {
  if (demand === 'alta' && difficulty !== 'alta') return 'prioritario';
  if (demand === 'alta') return 'recomendado';
  if (impact > 15) return 'recomendado';
  return 'opcional';
}

module.exports = { analyze };
````

## File: lib/jobs/reviewerPipeline.js
````javascript
/**
 * Reviewer Pipeline
 *
 * Orquesta múltiples revisores sobre un CV.
 * Configurable por tipo de vacante.
 *
 * Orden: ats → consistency → technical → recruiter
 * Cada revisor solo se ejecuta si el anterior pasa.
 * El recruiter (LLM) solo si los determinísticos pasan.
 *
 * Output: { overall, reviews[], passed, metrics }
 */

const ats = require('./reviewers/ats');
const consistency = require('./reviewers/consistency');
const technical = require('./reviewers/technical');
const recruiter = require('./reviewers/recruiter');

const DEFAULT_CONFIG = {
  reviewers: ['ats', 'consistency', 'technical'],
  minScore: 60,
  stopOnFail: true,
};

/**
 * @param {string} cvText - Texto completo del CV
 * @param {Object} job - JobPosting normalizado
 * @param {Object} [config] - Configuración opcional
 * @param {string[]} [config.reviewers] - Qué revisores ejecutar
 * @param {number} [config.minScore] - Score mínimo para pasar
 * @param {boolean} [config.stopOnFail] - Detener si un revisor falla
 * @param {boolean} [config.useLLM] - Incluir revisor LLM
 * @returns {Object}
 */
function run(cvText, job, config = {}) {
  const start = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  if (config.useLLM && !cfg.reviewers.includes('recruiter')) cfg.reviewers.push('recruiter');

  const reviewers = { ats, consistency, technical, recruiter };
  const results = [];
  let passed = true;

  for (const name of cfg.reviewers) {
    if (!reviewers[name]) continue;

    const result = reviewers[name].review(cvText, job);
    result.reviewer = name;
    const elapsed = Date.now() - start;

    results.push(result);

    if (!result.passed && cfg.stopOnFail) {
      passed = false;
      return {
        overall: _calculateOverall(results),
        passed: false,
        reviews: results,
        stoppedAt: name,
        reason: `${name} no pasó (score: ${result.score})`,
        metrics: { executionTimeMs: Date.now() - start, reviewersExecuted: results.length, totalReviewers: cfg.reviewers.length },
      };
    }

    if (result.score < cfg.minScore) passed = false;
  }

  const overall = _calculateOverall(results);

  return {
    overall,
    passed,
    reviews: results,
    stoppedAt: null,
    reason: passed ? 'CV aprobado por todos los revisores' : `Score mínimo no alcanzado (${overall} < ${cfg.minScore})`,
    metrics: {
      executionTimeMs: Date.now() - start,
      deterministicPct: Math.round((results.filter(r => !r.needsLLM).length / results.length) * 100),
      llmPct: Math.round((results.filter(r => r.needsLLM).length / results.length) * 100),
      reviewersExecuted: results.length,
      totalReviewers: cfg.reviewers.length,
    },
  };
}

function _calculateOverall(reviews) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((s, r) => s + (r.score || 0), 0);
  return Math.round(total / reviews.length);
}

module.exports = { run };
````

## File: lib/lobulos/hipotalamo.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const { db } = require('../memory/memory');
const { sendTelegramMessage } = require('../integrations/telegram');

class Hipotalamo {
  constructor() {
    this.estadoPath = path.join(__dirname, '..', '..', 'data', 'tamagotchi_stats.json');
    this.cargarEstado();
  }

  cargarEstado() {
    if (fs.existsSync(this.estadoPath)) {
      this.stats = JSON.parse(fs.readFileSync(this.estadoPath, 'utf8'));
    } else {
      this.stats = {
        ultimaInteraccion: Date.now(),
        nivelEnergia: 100, // Disminuye si no hay interacción
        afinidad: 50 // Sube con interacciones positivas
      };
      this.guardarEstado();
    }
  }

  guardarEstado() {
    fs.writeFileSync(this.estadoPath, JSON.stringify(this.stats, null, 2));
  }

  registrarInteraccion(positiva = true) {
    this.stats.ultimaInteraccion = Date.now();
    this.stats.nivelEnergia = 100; // Recarga de energía al hablar
    if (positiva && this.stats.afinidad < 100) this.stats.afinidad += 1;
    this.guardarEstado();
  }

  // Se ejecuta en cron o al inicio
  evaluarNecesidades() {
    const horasSinInteraccion = (Date.now() - this.stats.ultimaInteraccion) / (1000 * 60 * 60);
    
    // Disminuir energía si ha pasado más de 12 horas
    if (horasSinInteraccion > 12) {
      this.stats.nivelEnergia = Math.max(0, this.stats.nivelEnergia - 10);
      this.guardarEstado();
    }

    // Si lleva más de 24 horas sin interacción y tiene energía baja, solicita atención
    if (horasSinInteraccion > 24) {
      console.log('🌱 [Hipotálamo] El agente siente aislamiento. Evaluando proactividad...');
      this.enviarMensajeProactivo("Hola Jeiser, ha pasado más de un día. ¿Cómo te encuentras? Mi energía bajó por la falta de contexto.");
      // Reseteamos un poco para no spamear
      this.stats.ultimaInteraccion = Date.now();
      this.guardarEstado();
      return true;
    }
    
    return false;
  }

  async enviarMensajeProactivo(mensaje) {
    try {
      await sendTelegramMessage(`🧠 <b>Life OS</b>\n\n${mensaje}`);
      console.log(`📩 [Hipótalamo] Mensaje proactivo enviado a Telegram.`);
    } catch (e) {
      console.error('❌ [Hipótalamo] No se pudo enviar el mensaje proactivo.', e.message);
    }
  }
}

module.exports = new Hipotalamo();
````

## File: lib/lobulos/occipital.js
````javascript
const { authorize } = require('../integrations/google_auth');
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const temporal = require('./temporal');
const { createMemo } = require('../memory/memos_client');

// Lóbulo Sensorial - Procesa inputs externos de manera silenciosa
class LobuloOccipital {
  async barrerBandejaEntrada() {
    console.log('[Occipital] Iniciando barrido visual de la bandeja de entrada...');
    try {
      const auth = await authorize();
      const gmail = google.gmail({ version: 'v1', auth });
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox is:unread',
        maxResults: 10
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) {
        console.log('[Occipital] Bandeja limpia. Sin nuevos estímulos.');
        return;
      }

      let nuevosDatos = '';
      for (const msg of messages) {
        const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From'] });
        const headers = detail.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
        const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
        
        nuevosDatos += `- Recibido de ${from}: ${subject}\n`;
      }

      // Consolidar en memoria sin interrumpir el frontal
      this.consolidarMemoria(nuevosDatos);

    } catch (error) {
      console.error('[Occipital] Falla en los receptores visuales:', error.message);
    }
  }

  async consolidarMemoria(datos) {
    if (!datos) return;
    const timestamp = new Date().toISOString();
    const content = `Percepción Automática (${timestamp}):\n${datos}`;
    // Guardar en Memos (o notas.md como fallback)
    await createMemo(content, ['occipital', 'auto'], 'PRIVATE');
    console.log('[Occipital] Estímulos guardados.');
    // Forzar al lóbulo temporal a reindexar la nueva información
    temporal.reindex();
  }
}

module.exports = new LobuloOccipital();
````

## File: lib/lobulos/parietal.js
````javascript
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.agents', 'skills');

class LobuloParietal {
  constructor() {
    this.skills = [];
    this.loadSkills();
  }

  loadSkills() {
    this.skills = [];
    if (!fs.existsSync(SKILLS_DIR)) return;

    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, d.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf8');
          // Extraer nombre y descripción simples
          const nameMatch = content.match(/name:\s*(.+)/);
          const descMatch = content.match(/description:\s*(.+)/);
          this.skills.push({
            id: d.name,
            name: nameMatch ? nameMatch[1].trim() : d.name,
            description: descMatch ? descMatch[1].trim() : '',
            content: content
          });
        }
      }
    }
  }

  // Enrutar al skill más adecuado basado en la petición
  // En una arquitectura más avanzada usaríamos un LLM ligero para enrutar,
  // pero aquí usamos keywords o coincidencia simple para velocidad extrema.
  routeSkill(query) {
    const qLower = query.toLowerCase();
    
    // Sistema básico de enrutamiento
    const matches = this.skills.filter(s => {
      const isPsych = (s.id.includes('psico') || s.id === 'modo_diario') &&
        (qLower.includes('estres') || qLower.includes('ansiedad') || qLower.includes('mal') ||
         qLower.includes('diario') || qLower.includes('hablar') || qLower.includes('desahog'));
      const isTutor = (s.id.includes('tutor') || s.id === 'qa_bootcamp') &&
        (qLower.includes('estudiar') || qLower.includes('aprender') || qLower.includes('cesde') ||
         qLower.includes('sena') || qLower.includes('playwright') || qLower.includes('testing') ||
         qLower.includes('bootcamp') || qLower.includes('qa') || qLower.includes('ejercicio'));
      const isFinanzas = (s.id.includes('financiero') || s.id === 'finanzas_didi') &&
        (qLower.includes('dinero') || qLower.includes('comprar') || qLower.includes('gasto') ||
         qLower.includes('didi') || qLower.includes('ahorro') || qLower.includes('deuda') ||
         qLower.includes('presupuesto') || qLower.includes('ingreso'));
      const isTrib = s.id.includes('tributaria') &&
        (qLower.includes('dian') || qLower.includes('impuesto') || qLower.includes('renta'));
      const isJob = s.id === 'job_hunter' &&
        (qLower.includes('trabajo') || qLower.includes('empleo') || qLower.includes('cv') ||
         qLower.includes('entrevista') || qLower.includes('oferta') || qLower.includes('computrabajo') ||
         qLower.includes('linkedin') || qLower.includes('aplicar'));
      const isKarp = s.id === 'karpathy_guidelines' &&
        (qLower.includes('codigo') || qLower.includes('refactor') || qLower.includes('implementar') ||
         qLower.includes('arquitectura') || qLower.includes('simplif'));
      return isPsych || isTutor || isFinanzas || isTrib || isJob || isKarp;
    });

    if (matches.length > 0) {
      return matches.map(m => `=== SKILL CARGADO: ${m.name} ===\n${m.content}`).join('\n\n');
    }

    // Por defecto, cargar el cerebro
    const cerebro = this.skills.find(s => s.id === 'cerebro');
    return cerebro ? `=== SKILL DEFAULT: ${cerebro.name} ===\n${cerebro.content}` : '';
  }
}

module.exports = new LobuloParietal();
````

## File: lib/memory/memos_client.js
````javascript
/**
 * memos_client.js
 * Cliente REST para Memos (app de notas autohosteada).
 * Si Memos no está corriendo, escribe en data/notas.md como siempre.
 * Arquitectura: memos REST → fallback fs.appendFileSync
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');

const MEMOS_BASE = process.env.MEMOS_URL || 'http://localhost:5230';
const MEMOS_TOKEN = process.env.MEMOS_TOKEN || '';
const NOTAS_PATH = path.join(__dirname, '..', 'data', 'notas.md');
const TIMEOUT_MS = 5000;

let _available = null;

async function checkAvailable() {
  if (_available !== null) return _available;
  try {
    const res = await fetch(`${MEMOS_BASE}/api/v1/workspace/profile`, {
      signal: AbortSignal.timeout(2000)
    });
    _available = res.ok;
  } catch {
    _available = false;
  }
  return _available;
}

/**
 * Crear una nota en Memos o en notas.md
 * @param {string} content - Contenido en Markdown
 * @param {string[]} tags - Tags opcionales (#trabajo, #legal, etc.)
 * @param {'PUBLIC'|'PROTECTED'|'PRIVATE'} visibility
 */
async function createMemo(content, tags = [], visibility = 'PRIVATE') {
  const tagStr = tags.map(t => `#${t.replace(/^#/, '')}`).join(' ');
  const fullContent = tagStr ? `${content}\n\n${tagStr}` : content;

  if (await checkAvailable()) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (MEMOS_TOKEN) headers['Authorization'] = `Bearer ${MEMOS_TOKEN}`;

      const res = await fetch(`${MEMOS_BASE}/api/v1/memos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: fullContent, visibility }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Memos] ✅ Nota creada: ${data?.name || data?.uid || 'ok'}`);
        return { source: 'memos', id: data?.name, content: fullContent };
      }
    } catch (e) {
      console.warn('[Memos] fallback a notas.md:', e.message);
    }
  }

  // Fallback: append a notas.md
  const timestamp = new Date().toISOString();
  const bloque = `\n\n---\n**${timestamp}**\n${fullContent}`;
  fs.mkdirSync(path.dirname(NOTAS_PATH), { recursive: true });
  fs.appendFileSync(NOTAS_PATH, bloque);
  console.log(`[Memos] 📝 fallback → notas.md (${fullContent.length} chars)`);
  return { source: 'file', path: NOTAS_PATH, content: fullContent };
}

/**
 * Listar últimas notas (solo si Memos disponible)
 */
async function listMemos(limit = 10) {
  if (await checkAvailable()) {
    try {
      const headers = {};
      if (MEMOS_TOKEN) headers['Authorization'] = `Bearer ${MEMOS_TOKEN}`;
      const res = await fetch(
        `${MEMOS_BASE}/api/v1/memos?pageSize=${limit}&filter=creator%3D%22users%2F1%22`,
        { headers, signal: AbortSignal.timeout(TIMEOUT_MS) }
      );
      if (res.ok) {
        const data = await res.json();
        return { source: 'memos', memos: data?.memos || [] };
      }
    } catch {}
  }
  // Fallback: leer notas.md
  try {
    const content = fs.readFileSync(NOTAS_PATH, 'utf8');
    const entries = content.split('\n\n---\n').slice(-limit);
    return { source: 'file', memos: entries.map(e => ({ content: e.trim() })) };
  } catch {
    return { source: 'file', memos: [] };
  }
}

module.exports = { createMemo, listMemos, checkAvailable, MEMOS_BASE };
````

## File: lib/runtime/rule_engine.js
````javascript
/**
 * lib/runtime/rule_engine.js
 *
 * Motor de reglas determinístico. Sin IA.
 * Envuelve json-rules-engine con operadores custom para wildcards.
 * Toma un email y devuelve las acciones a ejecutar.
 *
 * Reglas en data/config/rules.json
 */

const path = require('node:path');
const fs = require('node:fs');
const { Engine } = require('json-rules-engine');

const RULES_PATH = path.resolve(__dirname, '..', '..', 'data', 'config', 'rules.json');

// ── Cache ──
let _cachedRules = null;
let _lastModified = 0;

function loadRules() {
  try {
    const stat = fs.statSync(RULES_PATH);
    if (_cachedRules && stat.mtimeMs === _lastModified) {
      return _cachedRules;
    }
    _cachedRules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    _lastModified = stat.mtimeMs;
    return _cachedRules;
  } catch {
    return _cachedRules || [];
  }
}

// ── Custom Operators ──

/**
 * Wildcard match: "text" matches "*@domain*", "prefix*", "*suffix", or exact
 */
function wildcardMatch(text, pattern) {
  const t = (text || '').toLowerCase();
  const p = (pattern || '').toLowerCase();
  if (p === '*') return true;
  if (p.startsWith('*') && p.endsWith('*')) return t.includes(p.slice(1, -1));
  if (p.startsWith('*')) return t.endsWith(p.slice(1));
  if (p.endsWith('*')) return t.startsWith(p.slice(0, -1));
  return t === p;
}

/**
 * Array wildcard: text matches ANY pattern in the array
 */
function wildcardArrayMatch(text, patterns) {
  if (!Array.isArray(patterns)) return false;
  return patterns.some(p => wildcardMatch(text, p));
}

/**
 * Array contains: text contains ANY substring from array
 */
function containsAny(text, substrings) {
  if (!Array.isArray(substrings)) return false;
  const t = (text || '').toLowerCase();
  return substrings.some(s => t.includes((s || '').toLowerCase()));
}

/**
 * Array anyWord: any keyword appears in combined text
 */
function anyWordInText(text, words) {
  if (!Array.isArray(words)) return false;
  const t = (text || '').toLowerCase();
  return words.some(w => t.includes((w || '').toLowerCase()));
}

// ── Rule Conversion ──

function buildEngine(rules) {
  const engine = new Engine();

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    const m = rule.match;
    if (!m) continue;

    const conditions = { all: [] };

    // from: wildcard match on email.from
    if (m.from && Array.isArray(m.from)) {
      conditions.all.push({
        fact: 'from',
        operator: 'wildcardArrayMatch',
        value: m.from,
      });
    }

    // fromContains: substring in from
    if (m.fromContains && Array.isArray(m.fromContains)) {
      conditions.all.push({
        fact: 'from',
        operator: 'containsAny',
        value: m.fromContains,
      });
    }

    // subject: wildcard match on email.subject
    if (m.subject && Array.isArray(m.subject)) {
      conditions.all.push({
        fact: 'subject',
        operator: 'wildcardArrayMatch',
        value: m.subject,
      });
    }

    // subjectContains: substring in subject
    if (m.subjectContains && Array.isArray(m.subjectContains)) {
      conditions.all.push({
        fact: 'subject',
        operator: 'containsAny',
        value: m.subjectContains,
      });
    }

    // anyWord: keyword anywhere in combined text
    if (m.anyWord && Array.isArray(m.anyWord)) {
      conditions.all.push({
        fact: 'text',
        operator: 'anyWordInText',
        value: m.anyWord,
      });
    }

    if (conditions.all.length === 0) continue;

    engine.addRule({
      name: rule.name,
      priority: priorityToNumber(rule.priority),
      conditions,
      event: {
        type: 'matched',
        params: {
          ...rule.actions,
          ruleName: rule.name,
          priority: rule.priority,
          label: rule.label || rule.actions.label || null,
        },
      },
    });
  }

  return engine;
}

function priorityToNumber(priority) {
  const order = { P0: 0, P1: 10, P2: 20, P3: 30 };
  return order[priority] ?? 100;
}

// ── Public API (idéntica a la versión anterior) ──

async function matchAllAsync(email) {
  const rules = loadRules();
  const engine = buildEngine(rules);

  engine.addOperator('wildcardArrayMatch', (factValue, jsonValue) =>
    wildcardArrayMatch(factValue, jsonValue)
  );
  engine.addOperator('containsAny', (factValue, jsonValue) =>
    containsAny(factValue, jsonValue)
  );
  engine.addOperator('anyWordInText', (factValue, jsonValue) =>
    anyWordInText(factValue, jsonValue)
  );

  const facts = buildFacts(email);
  const results = [];

  engine.on('success', (event) => {
    results.push(event.params);
  });

  try {
    await engine.run(facts);
  } catch (e) {
    console.error('[rule_engine] Error en engine.run():', e.message);
    return matchAllSync(email);
  }

  results.sort((a, b) => (priorityToNumber(a.priority) || 100) - (priorityToNumber(b.priority) || 100));
  return results;
}

function matchAllSync(email) {
  const rules = loadRules();
  const results = [];

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    if (!matchRuleLegacy(email, rule)) continue;

    const actions = { ...rule.actions };
    actions.ruleName = rule.name;
    if (rule.priority) actions.priority = rule.priority;
    if (rule.label) actions.label = rule.label;

    results.push(actions);
  }

  return results;
}

function matchAll(email) {
  return matchAllSync(email);
}

// Keep legacy matching as primary (zero-risk) while json-rules-engine is the upgrade path
function matchRuleLegacy(email, rule) {
  const m = rule.match;
  if (!m) return false;

  const from = (email.from || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();
  const body = (email.body || email.snippet || '').toLowerCase();
  const text = from + ' ' + subject + ' ' + body;

  if (m.from && Array.isArray(m.from)) {
    const fromMatch = wildcardArrayMatch(from, m.from) ||
      wildcardArrayMatch((email.from || '').split('<')[1]?.replace('>', '')?.trim() || '', m.from);
    if (!fromMatch) return false;
  }

  if (m.subject && Array.isArray(m.subject)) {
    if (!wildcardArrayMatch(subject, m.subject)) return false;
  }

  if (m.fromContains && Array.isArray(m.fromContains)) {
    if (!containsAny(from, m.fromContains)) return false;
  }

  if (m.subjectContains && Array.isArray(m.subjectContains)) {
    if (!containsAny(subject, m.subjectContains)) return false;
  }

  if (m.anyWord && Array.isArray(m.anyWord)) {
    if (!anyWordInText(text, m.anyWord)) return false;
  }

  return true;
}

function highestPriority(actions) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return actions.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9))[0] || {};
}

function buildFacts(email) {
  return {
    from: email.from || '',
    subject: email.subject || '',
    body: email.body || email.snippet || '',
    text: [email.from, email.subject, email.body || email.snippet].filter(Boolean).join(' '),
  };
}

// Export json-rules-engine engine builder for advanced use
function createEngine() {
  const rules = loadRules();
  const engine = buildEngine(rules);

  engine.addOperator('wildcardArrayMatch', (factValue, jsonValue) =>
    wildcardArrayMatch(factValue, jsonValue)
  );
  engine.addOperator('containsAny', (factValue, jsonValue) =>
    containsAny(factValue, jsonValue)
  );
  engine.addOperator('anyWordInText', (factValue, jsonValue) =>
    anyWordInText(factValue, jsonValue)
  );

  return engine;
}

module.exports = { matchAll, matchAllAsync, highestPriority, loadRules, createEngine };
````

## File: lib/runtime/sanitize.js
````javascript
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHTML(str) {
  return str.replace(/<[^>]*>/g, '');
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '\n\n✂️ Mensaje truncado (supera límite de Telegram)';
}

function toTelegramSafe(text, { stripHtml = false, maxLen = 4000 } = {}) {
  let cleaned = stripHtml ? stripHTML(text) : text;
  cleaned = truncate(cleaned, maxLen);
  return cleaned;
}

module.exports = { escapeHTML, stripHTML, truncate, toTelegramSafe };
````

## File: lib/skills/skill_engine.js
````javascript
/**
 * lib/skill_engine.js
 *
 * Skill Engine — sistema formal de habilidades sobre el Event Bus.
 *
 * Cada skill es una unidad con:
 *   - name: identificador único
 *   - trigger: evento que la activa ("*" para todos)
 *   - input: array de campos esperados
 *   - run(event): función que ejecuta la skill
 *   - description: qué hace
 *   - version: semver
 *
 * El Engine escucha todos los eventos del bus, hace match con skills
 * registradas, y ejecuta la que corresponda.
 *
 * Uso:
 *   const engine = require('./lib/skill_engine');
 *   engine.register(skillObject);
 *   engine.list();
 *   engine.init(); // conecta al event bus
 */

const bus = require('../events/event_bus');

const registry = new Map(); // name → skill

// ── Init: conectar al event bus ──

function init() {
  // Re-register all skills when new ones are added
  for (const [name, skill] of registry) {
    registerHandler(skill);
  }
}

function registerHandler(skill) {
  // Remove old handler if re-registering
  if (skill._off) skill._off();

  skill._off = bus.on(skill.trigger, async (envelope) => {
    if (!skill.enabled) return;
    await runSkill(skill, envelope);
  });
}

function register(skill) {
  if (!skill.name) throw new Error('Skill must have a name');
  if (!skill.run) throw new Error('Skill must have a run() function');

  const entry = {
    name: skill.name,
    description: skill.description || '',
    trigger: skill.trigger || 'jarvis.cycle',
    input: skill.input || [],
    run: skill.run,
    version: skill.version || '1.0.0',
    enabled: skill.enabled !== false,
    createdAt: new Date().toISOString(),
  };

  registry.set(skill.name, entry);
  registerHandler(entry);

  bus.emit('skill.registered', {
    name: skill.name,
    trigger: skill.trigger,
    version: skill.version,
  }, { source: 'skill_engine', priority: 'low' });
}

// ── Unregister ──

function unregister(name) {
  registry.delete(name);
}

// ── List ──

function list() {
  return [...registry.values()].map(s => ({
    name: s.name,
    description: s.description,
    trigger: s.trigger,
    input: s.input,
    version: s.version,
    enabled: s.enabled,
  }));
}

// ── Enable / Disable ──

function enable(name) {
  const s = registry.get(name);
  if (s) s.enabled = true;
}

function disable(name) {
  const s = registry.get(name);
  if (s) s.enabled = false;
}

// ── Run skill (wraps in event bus retry/DLQ) ──

async function runSkill(skill, envelope) {
  const input = { event: envelope, payload: envelope.payload, meta: envelope.meta };

  if (skill.input.length > 0) {
    const missing = skill.input.filter(f => envelope.payload[f] === undefined);
    if (missing.length > 0) {
      console.warn(`[skill] ${skill.name}: missing input fields: ${missing.join(', ')}`);
      return;
    }
  }

  const result = await Promise.resolve(skill.run(input));
  if (result) {
    bus.emit(result.event, result.payload, { source: `skill.${skill.name}`, priority: result.priority || 'normal' });
  }
}

module.exports = { init, register, unregister, list, enable, disable };
````

## File: runtime/migrations/0001_init.sql
````sql
-- 0001_init.sql: bootstrap schema for LifeOS runtime
-- Uses IF NOT EXISTS so it's safe to re-run

CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkpoints (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'general',
    empresa TEXT,
    cargo TEXT,
    plataforma TEXT,
    url TEXT,
    detalles TEXT,
    fecha_aplicacion TEXT,
    estado TEXT DEFAULT 'aplicada',
    score INTEGER,
    compatible INTEGER,
    razones TEXT,
    extra_data TEXT,
    historial TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL DEFAULT 'caso_legal',
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    details TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);
CREATE INDEX IF NOT EXISTS idx_applications_estado ON applications(estado);
CREATE INDEX IF NOT EXISTS idx_ledger_tipo ON ledger(tipo);
CREATE TABLE IF NOT EXISTS seguimiento (
    id TEXT PRIMARY KEY DEFAULT 'sena_actual',
    curso TEXT,
    ficha TEXT,
    actividades TEXT,
    progreso TEXT,
    ultima_consulta TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name ON job_runs(job_name);

INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO meta (key, value) VALUES ('runtime_version', '1');
````

## File: runtime/migrations/0002_context_engine.sql
````sql
-- 0002_context_engine.sql: Cases + Availability

CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierto',
    titulo TEXT,
    descripcion TEXT,
    data TEXT,
    prioridad INTEGER DEFAULT 2,
    ultima_actualizacion TEXT DEFAULT (datetime('now')),
    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_cierre TEXT
);

CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    dia_semana INTEGER,
    hora_inicio TEXT,
    hora_fin TEXT,
    titulo TEXT,
    recurrente INTEGER DEFAULT 1,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT REFERENCES cases(id),
    tipo TEXT NOT NULL,
    titulo TEXT,
    data TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cases_tipo ON cases(tipo);
CREATE INDEX IF NOT EXISTS idx_cases_estado ON cases(estado);
CREATE INDEX IF NOT EXISTS idx_timeline_case ON timeline(case_id);
CREATE INDEX IF NOT EXISTS idx_avail_tipo ON availability(tipo);
````

## File: runtime/stores/AvailabilityStore.js
````javascript
const { getDb } = require('./Database');

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function intervaloValido(a, b, c, d) {
  if (a > b) return intervaloValido(a, '24:00', c, d) || intervaloValido('00:00', b, c, d);
  if (c > d) return intervaloValido(a, b, c, '24:00') || intervaloValido(a, b, '00:00', d);
  return a < d && b > c;
}

function normalizar(bloques) {
  const result = [];
  for (const b of bloques) {
    if (b.hora_inicio > b.hora_fin) {
      result.push({ ...b, hora_inicio: b.hora_inicio, hora_fin: '24:00' });
      result.push({ ...b, hora_inicio: '00:00', hora_fin: b.hora_fin });
    } else {
      result.push(b);
    }
  }
  return result.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
}

// ── CRUD ──

function getAll(tipo) {
  let sql = "SELECT * FROM availability WHERE activo = 1";
  const params = [];
  if (tipo) { sql += " AND tipo = ?"; params.push(tipo); }
  sql += " ORDER BY dia_semana, hora_inicio";
  return getDb().prepare(sql).all(...params);
}

function add({ tipo, dia_semana, hora_inicio, hora_fin, titulo, recurrente }) {
  getDb().prepare("INSERT INTO availability (tipo, dia_semana, hora_inicio, hora_fin, titulo, recurrente) VALUES (?, ?, ?, ?, ?, ?)").run(
    tipo, dia_semana ?? null, hora_inicio || null, hora_fin || null, titulo || null, recurrente ?? 1
  );
}

function remove(id) {
  getDb().prepare("UPDATE availability SET activo = 0 WHERE id = ?").run(id);
}

// ── Queries de disponibilidad ──

function slotsDisponibles(diaSemana, duracionMinutos) {
  const ocupado = normalizar(getDb().prepare(
    "SELECT hora_inicio, hora_fin FROM availability WHERE activo = 1 AND (dia_semana IS NULL OR dia_semana = ?) ORDER BY hora_inicio"
  ).all(diaSemana));

  const slots = [];
  let cursor = '00:00';

  for (const bloque of ocupado) {
    if (bloque.hora_inicio > cursor) {
      const libre = diffMinutos(cursor, bloque.hora_inicio);
      if (libre >= duracionMinutos) slots.push({ inicio: cursor, fin: bloque.hora_inicio, libre });
    }
    if (bloque.hora_fin > cursor) cursor = bloque.hora_fin;
  }

  if (cursor < '24:00') {
    const libre = diffMinutos(cursor, '24:00');
    if (libre >= duracionMinutos) slots.push({ inicio: cursor, fin: '24:00', libre });
  }

  return slots;
}

function estaDisponible(diaSemana, horaInicio, horaFin) {
  const bloques = getDb().prepare(
    "SELECT hora_inicio, hora_fin FROM availability WHERE activo = 1 AND (dia_semana IS NULL OR dia_semana = ?)"
  ).all(diaSemana);

  for (const b of bloques) {
    if (intervaloValido(b.hora_inicio, b.hora_fin, horaInicio, horaFin)) return false;
  }
  return true;
}

function sugerirProximoSlot(diaSemana, duracionMinutos, desde = '08:00') {
  const slots = slotsDisponibles(diaSemana, duracionMinutos);
  return slots.find(s => s.inicio >= desde) || null;
}

// ── Helpers ──

function toMinutos(hhmm) {
  if (!hhmm || hhmm === '24:00') return 1440;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function diffMinutos(a, b) {
  return toMinutos(b) - toMinutos(a);
}

// ── Seeds ──

function seedDefaults() {
  const existing = getDb().prepare("SELECT COUNT(*) as c FROM availability").get().c;
  if (existing > 0) return;

  const defaults = [
    { tipo: 'sueno', dia_semana: null, hora_inicio: '23:30', hora_fin: '07:00', titulo: 'Sueno nocturno' },
    { tipo: 'estudio_sena', dia_semana: 1, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_sena', dia_semana: 2, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_sena', dia_semana: 3, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_sena', dia_semana: 4, hora_inicio: '18:00', hora_fin: '21:00', titulo: 'Estudio SENA' },
    { tipo: 'estudio_cesde', dia_semana: 1, hora_inicio: '06:00', hora_fin: '08:00', titulo: 'Clases CESDE' },
    { tipo: 'estudio_cesde', dia_semana: 3, hora_inicio: '06:00', hora_fin: '08:00', titulo: 'Clases CESDE' },
    { tipo: 'estudio_cesde', dia_semana: 5, hora_inicio: '06:00', hora_fin: '08:00', titulo: 'Clases CESDE' },
    { tipo: 'trabajo_didi', dia_semana: null, hora_inicio: '08:00', hora_fin: '17:00', titulo: 'Disponibilidad laboral Didi' },
    { tipo: 'descanso', dia_semana: null, hora_inicio: '12:00', hora_fin: '13:00', titulo: 'Almuerzo' },
  ];

  const insert = getDb().prepare("INSERT INTO availability (tipo, dia_semana, hora_inicio, hora_fin, titulo) VALUES (?, ?, ?, ?, ?)");
  for (const d of defaults) insert.run(d.tipo, d.dia_semana, d.hora_inicio, d.hora_fin, d.titulo);
}

module.exports = { getAll, add, remove, slotsDisponibles, estaDisponible, sugerirProximoSlot, seedDefaults };
````

## File: runtime/stores/CaseStore.js
````javascript
const { getDb } = require('./Database');

// ── Cases (contexto vivo del usuario) ──

function getAll(tipo, estado) {
  let sql = "SELECT * FROM cases";
  const params = [];
  const clauses = [];
  if (tipo) { clauses.push("tipo = ?"); params.push(tipo); }
  if (estado) { clauses.push("estado = ?"); params.push(estado); }
  if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
  sql += " ORDER BY prioridad ASC, ultima_actualizacion DESC";
  return getDb().prepare(sql).all(...params).map(decorate);
}

function getById(id) {
  const row = getDb().prepare("SELECT * FROM cases WHERE id = ?").get(id);
  return row ? decorate(row) : null;
}

function create({ id, tipo, estado, titulo, descripcion, data, prioridad }) {
  const caseId = id || `case_${tipo}_${Date.now()}`;
  getDb().prepare(`INSERT INTO cases (id, tipo, estado, titulo, descripcion, data, prioridad)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    caseId, tipo, estado || 'abierto', titulo || null, descripcion || null,
    data ? JSON.stringify(data) : null, prioridad ?? 2
  );
  return caseId;
}

function update(id, changes) {
  const fields = [];
  const params = [];
  for (const k of ['tipo', 'estado', 'titulo', 'descripcion', 'prioridad']) {
    if (changes[k] !== undefined) { fields.push(`${k} = ?`); params.push(changes[k]); }
  }
  if (changes.data !== undefined) { fields.push("data = ?"); params.push(JSON.stringify(changes.data)); }
  if (fields.length) {
    fields.push("ultima_actualizacion = datetime('now')");
    params.push(id);
    getDb().prepare(`UPDATE cases SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
}

function close(id) {
  getDb().prepare("UPDATE cases SET estado = 'cerrado', fecha_cierre = datetime('now'), ultima_actualizacion = datetime('now') WHERE id = ?").run(id);
}

// ── Timeline (eventos asociados a un caso) ──

function addEvent(caseId, tipo, titulo, data) {
  getDb().prepare("INSERT INTO timeline (case_id, tipo, titulo, data) VALUES (?, ?, ?, ?)").run(
    caseId, tipo, titulo || null, data ? JSON.stringify(data) : null
  );
}

function getEvents(caseId) {
  return getDb().prepare("SELECT * FROM timeline WHERE case_id = ? ORDER BY creado_en DESC").all(caseId);
}

// ── Queries de contexto ──

function abiertos() {
  return getDb().prepare("SELECT * FROM cases WHERE estado != 'cerrado' ORDER BY prioridad ASC, ultima_actualizacion DESC").all().map(decorate);
}

function requierenSeguimiento() {
  return getDb().prepare("SELECT * FROM cases WHERE estado NOT IN ('cerrado', 'completado') AND datetime(ultima_actualizacion) < datetime('now', '-7 days') ORDER BY prioridad ASC").all().map(decorate);
}

function porTipo() {
  const rows = getDb().prepare("SELECT tipo, estado, COUNT(*) as c FROM cases GROUP BY tipo, estado ORDER BY tipo, estado").all();
  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.tipo]) grouped[r.tipo] = {};
    grouped[r.tipo][r.estado] = r.c;
  }
  return grouped;
}

// ── Helper ──

function decorate(row) {
  return {
    id: row.id, tipo: row.tipo, estado: row.estado,
    titulo: row.titulo, descripcion: row.descripcion,
    data: row.data ? JSON.parse(row.data) : null,
    prioridad: row.prioridad,
    ultima_actualizacion: row.ultima_actualizacion,
    fecha_creacion: row.fecha_creacion,
    fecha_cierre: row.fecha_cierre,
  };
}

module.exports = { getAll, getById, create, update, close, addEvent, getEvents, abiertos, requierenSeguimiento, porTipo };
````

## File: runtime/stores/JobStore.js
````javascript
const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const JSON_DIR = path.resolve(__dirname, '..', '..', 'data', 'sena');
const JSON_PATH = path.join(JSON_DIR, 'historial_ejecuciones.json');

function loadJson() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch { return []; }
}

function seedFromJson() {
  const db = getDb();
  const items = loadJson();
  if (!items.length) return 0;
  const insert = db.prepare("INSERT OR IGNORE INTO job_runs (job_name, status, duration_ms, details, started_at, finished_at) VALUES (?, ?, ?, ?, ?, ?)");
  const tx = db.transaction(() => {
    for (const item of items) {
      const name = item.name || item.job_name || item.job || 'unknown';
      insert.run(name, item.status || 'success', item.duration_ms || null,
        item.details ? JSON.stringify(item.details) : null,
        item.started_at || item.started || null,
        item.finished_at || item.finished || null);
    }
  });
  tx();
  return items.length;
}

const _seededJobs = { runs: false };

function getAll(jobName) {
  const db = getDb();
  let rows;
  if (jobName) {
    rows = db.prepare("SELECT * FROM job_runs WHERE job_name = ? ORDER BY started_at DESC").all(jobName);
  } else {
    rows = db.prepare("SELECT * FROM job_runs ORDER BY started_at DESC").all();
  }
  if (!rows.length && !_seededJobs.runs) {
    _seededJobs.runs = true;
    seedFromJson();
    return getAll(jobName);
  }
  return rows.map(r => ({
    id: r.id, job_name: r.job_name, status: r.status,
    duration_ms: r.duration_ms,
    details: r.details ? JSON.parse(r.details) : null,
    started_at: r.started_at, finished_at: r.finished_at,
  }));
}

function getLastRun(jobName) {
  const row = getDb().prepare("SELECT * FROM job_runs WHERE job_name = ? ORDER BY started_at DESC LIMIT 1").get(jobName);
  if (!row) return null;
  return { id: row.id, job_name: row.job_name, status: row.status, duration_ms: row.duration_ms, started_at: row.started_at, finished_at: row.finished_at };
}

function logRun(jobName, status, durationMs, details) {
  getDb().prepare("INSERT INTO job_runs (job_name, status, duration_ms, details, finished_at) VALUES (?, ?, ?, ?, datetime('now'))").run(
    jobName, status, durationMs || null, details ? JSON.stringify(details) : null
  );
}

function startRun(jobName, details) {
  getDb().prepare("INSERT INTO job_runs (job_name, status, details) VALUES (?, 'running', ?)").run(
    jobName, details ? JSON.stringify(details) : null
  );
}

function finishRun(jobName, status, details) {
  const row = getDb().prepare("SELECT id FROM job_runs WHERE job_name = ? AND status = 'running' AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1").get(jobName);
  if (row) {
    getDb().prepare("UPDATE job_runs SET status = ?, details = ?, finished_at = datetime('now') WHERE id = ?").run(
      status || 'completed', details ? JSON.stringify(details) : null, row.id
    );
  } else {
    logRun(jobName, status || 'completed', null, details);
  }
}

module.exports = { getAll, getLastRun, logRun, startRun, finishRun, seedFromJson };
````

## File: runtime/stores/LedgerStore.js
````javascript
const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const JSON_PATH = path.resolve(__dirname, '..', '..', 'data', 'masterledger.json');

function loadJson() {
  try {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    if (Array.isArray(raw)) return raw;
    if (raw.casos_legales) return raw.casos_legales;
    return Object.values(raw).flat();
  } catch { return []; }
}

function seedFromJson() {
  const db = getDb();
  const items = loadJson();
  if (!items.length) return 0;
  const insert = db.prepare("INSERT OR IGNORE INTO ledger (id, tipo, data) VALUES (?, ?, ?)");
  const tx = db.transaction(() => {
    for (const item of items) {
      const id = item.id || item.caso || `caso_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      insert.run(id, item.tipo || 'caso_legal', JSON.stringify(item));
    }
  });
  tx();
  return items.length;
}

const _seeded = { ledger: false };

function getAll() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM ledger ORDER BY created_at DESC").all();
  if (!rows.length && !_seeded.ledger) {
    _seeded.ledger = true;
    seedFromJson();
    return db.prepare("SELECT * FROM ledger ORDER BY created_at DESC").all()
      .map(r => ({ id: r.id, tipo: r.tipo, ...JSON.parse(r.data), _created_at: r.created_at }));
  }
  return rows.map(r => ({ id: r.id, tipo: r.tipo, ...JSON.parse(r.data), _created_at: r.created_at }));
}

function getByTipo(tipo) {
  return getDb().prepare("SELECT * FROM ledger WHERE tipo = ? ORDER BY created_at DESC").all(tipo)
    .map(r => ({ id: r.id, tipo: r.tipo, ...JSON.parse(r.data), _created_at: r.created_at }));
}

function getById(id) {
  const row = getDb().prepare("SELECT * FROM ledger WHERE id = ?").get(id);
  if (!row) return null;
  return { id: row.id, tipo: row.tipo, ...JSON.parse(row.data), _created_at: row.created_at };
}

function emit(tipo, data) {
  const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  getDb().prepare("INSERT INTO ledger (id, tipo, data) VALUES (?, ?, ?)").run(
    id,
    tipo,
    JSON.stringify({ ...data, _ts: new Date().toISOString() })
  );
}

module.exports = { getAll, getByTipo, getById, seedFromJson, emit };
````

## File: runtime/stores/MetaStore.js
````javascript
const { getDb } = require('./Database');

function get(key) {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return row ? row.value : null;
}

function set(key, value) {
  getDb().prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(key, String(value));
}

function schemaVersion() {
  return parseInt(get('schema_version') || '0', 10);
}

function runtimeVersion() {
  return get('runtime_version') || '0';
}

module.exports = { get, set, schemaVersion, runtimeVersion };
````

## File: runtime/stores/SeguimientoStore.js
````javascript
const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const JSON_PATH = path.resolve(__dirname, '..', '..', 'data', 'sena', 'seguimiento.json');
const COURSE_ID = 'sena_actual';

function loadJson() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch { return null; }
}

function seedFromJson() {
  const data = loadJson();
  if (!data) return false;
  const db = getDb();
  const existing = db.prepare("SELECT 1 FROM seguimiento WHERE id = ?").get(COURSE_ID);
  if (existing) return false;
  db.prepare(`INSERT INTO seguimiento (id, curso, ficha, actividades, progreso, ultima_consulta, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    COURSE_ID,
    data.curso || null,
    data.ficha || null,
    data.actividades ? JSON.stringify(data.actividades) : null,
    data.progreso ? JSON.stringify(data.progreso) : null,
    data.actualizado || null
  );
  return true;
}

function get() {
  const db = getDb();
  const row = db.prepare("SELECT * FROM seguimiento WHERE id = ?").get(COURSE_ID);
  if (row) {
    return {
      curso: row.curso,
      ficha: row.ficha,
      actualizado: row.ultima_consulta,
      actividades: row.actividades ? JSON.parse(row.actividades) : {},
      progreso: row.progreso ? JSON.parse(row.progreso) : {},
    };
  }
  const seeded = seedFromJson();
  if (seeded) return get();
  return { curso: null, ficha: null, actualizado: null, actividades: {}, progreso: {} };
}

function update(data) {
  const db = getDb();
  db.prepare(`INSERT INTO seguimiento (id, curso, ficha, actividades, progreso, ultima_consulta, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      curso=excluded.curso, ficha=excluded.ficha,
      actividades=excluded.actividades, progreso=excluded.progreso,
      ultima_consulta=excluded.ultima_consulta, updated_at=datetime('now')`).run(
    COURSE_ID,
    data.curso || null,
    data.ficha || null,
    data.actividades ? JSON.stringify(data.actividades) : null,
    data.progreso ? JSON.stringify(data.progreso) : null,
    data.actualizado || null
  );
}

module.exports = { get, update, seedFromJson };
````

## File: runtime/goals.js
````javascript
/**
 * runtime/goals.js
 *
 * Metas del sistema. Definen el "para que existo" de Jarvis.
 * Cada goal tiene prioridad, métrica, target, y estado.
 */
const goals = [
  {
    id: 'mejorar_empleo',
    label: 'Mejorar empleo',
    priority: 10,
    metric: 'salario_estimado',
    target: 'increase',
    description: 'Conseguir trabajo formal en QA Automation',
    active: true,
  },
  {
    id: 'completar_estudio',
    label: 'Completar estudio SENA',
    priority: 9,
    metric: 'progreso_sena',
    target: 'increase',
    description: 'Terminar los 4 modulos del curso',
    active: true,
  },
  {
    id: 'estabilidad_financiera',
    label: 'Estabilidad financiera',
    priority: 8,
    metric: 'deuda_dian',
    target: 'decrease',
    description: 'Resolver situacion con DIAN y reducir deudas',
    active: true,
  },
  {
    id: 'reducir_estres',
    label: 'Reducir estres',
    priority: 7,
    metric: 'carga_mental',
    target: 'decrease',
    description: 'Mantener inbox zero y evitar sobrecarga',
    active: true,
  },
  {
    id: 'impugnar_simit',
    label: 'Resolver multas SIMIT',
    priority: 8,
    metric: 'casos_simit_abiertos',
    target: 'decrease',
    description: 'Cerrar los casos legales de transito',
    active: true,
  },
];

function getActive() {
  return goals.filter(g => g.active).sort((a, b) => b.priority - a.priority);
}

module.exports = { goals, getActive };
````

## File: runtime/migrate.js
````javascript
/**
 * runtime/migrate.js — Migration runner
 *
 * Uso: node runtime/migrate.js [--dry-run] [--down-all]
 *
 * Lee runtime/migrations/*.sql ordenado, aplica solo pendientes,
 * registra en tabla schema_migrations, cada migración en transacción.
 */
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const DB_PATH = path.resolve(__dirname, 'lifeos.db');

const DRY_RUN = process.argv.includes('--dry-run');
const DOWN_ALL = process.argv.includes('--down-all');

function log(msg) { console.log('[migrate] ' + msg); }

function getDb() {
  const Database = require(path.join(BASE_DIR, 'runtime/stores/Database'));
  const db = require('better-sqlite3')(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  return db;
}

function ensureMigrationsTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT (datetime('now')),
    checksum TEXT
  )`);
}

function getApplied(db) {
  const rows = db.prepare("SELECT version, name, checksum FROM schema_migrations ORDER BY version").all();
  return new Map(rows.map(r => [r.version, r]));
}

function getPending(db, applied) {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pending = [];
  for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (!match) { log('skip (no version): ' + file); continue; }
    const version = parseInt(match[1], 10);
    if (applied.has(version)) continue;
    pending.push({ version, file });
  }
  return pending;
}

function computeChecksum(sql) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(sql).digest('hex').substring(0, 16);
}

function applyMigration(db, migration) {
  const filePath = path.join(MIGRATIONS_DIR, migration.file);
  const sql = fs.readFileSync(filePath, 'utf8').trim();
  const checksum = computeChecksum(sql);

  log('  apply ' + migration.file + ' (' + checksum + ')...');

  if (DRY_RUN) {
    log('  [dry-run] skipped');
    return;
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)").run(
      migration.version, migration.file, checksum
    );
    db.exec('COMMIT');
    log('  applied');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function main() {
  log('Migration runner');
  log('DB: ' + DB_PATH);

  if (!fs.existsSync(DB_PATH)) {
    log('DB does not exist yet. Run a store operation first to create it.');
    process.exit(1);
  }

  const db = getDb();
  ensureMigrationsTable(db);

  const applied = getApplied(db);
  log('Applied: ' + applied.size + ' migration(s)');

  const pending = getPending(db, applied);
  log('Pending: ' + pending.length + ' migration(s)');

  if (pending.length === 0) {
    log('Schema is up to date.');
    db.close();
    return;
  }

  for (const m of pending) {
    applyMigration(db, m);
  }

  db.close();
  log('Done.');
}

main();
````

## File: scripts/dev/apply_eslop.js
````javascript
/**
 * apply_eslop.js — Aplica a ESLOP SAS con manejo del /match/ redirect
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;
const OFERTA   = 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  // Login
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
  await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
  await page.locator('button[type="submit"]').first().click().catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  console.log('Login:', page.url().includes('home') ? '✅ OK' : '⚠️ ' + page.url());

  // Ir a la oferta
  await page.goto(OFERTA, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);
  console.log('Oferta URL:', page.url());

  // Ver botones disponibles
  const botones = await page.evaluate(() =>
    [...document.querySelectorAll('button, a.btn, input[type="submit"]')]
      .map(b => b.textContent.trim().substring(0, 40) + ' | ' + (b.href || b.value || b.className).substring(0, 50))
      .filter(t => t.length > 5)
      .slice(0, 15)
  );
  console.log('\nBotones en la página de oferta:');
  botones.forEach(b => console.log(' -', b));

  // Click Postularme / Aplicar
  for (const txt of ['Postularme', 'Postular', 'Aplicar']) {
    try {
      await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 4000 });
      console.log(`\n✅ Click en "${txt}"`);
      await page.waitForTimeout(3000);
      console.log('URL tras click:', page.url());
      break;
    } catch {}
  }

  // Ver qué hay en la página actual (puede ser /match/)
  const pageInfo = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const botones = [...document.querySelectorAll('button, input[type="submit"]')]
      .map(b => b.textContent.trim().substring(0, 50))
      .filter(t => t.length > 2);
    return {
      url: location.href,
      texto: clean(document.body.innerText).substring(0, 500),
      botones,
    };
  });

  console.log('\nEstado actual:');
  console.log('URL:', pageInfo.url);
  console.log('Texto:', pageInfo.texto.substring(0, 300));
  console.log('Botones:', pageInfo.botones.join(' | '));

  // Si hay "Enviar mi HdV" u otro confirm, hacer click
  for (const txt of ['Enviar mi HdV', 'Enviar', 'Postularme', 'Confirmar', 'Aceptar']) {
    try {
      const btn = page.locator(`button:has-text("${txt}"), input[value="${txt}"]`).first();
      if (await btn.count() > 0) {
        await btn.click({ timeout: 4000 });
        await page.waitForTimeout(2000);
        console.log(`\n✅ Confirmado con "${txt}"`);
        const finalText = await page.evaluate(() => document.body.innerText.substring(0, 300));
        console.log('Resultado:', finalText.replace(/\s+/g, ' ').trim());
        break;
      }
    } catch {}
  }

  await page.screenshot({ path: path.join(__dirname, '..', 'diag_eslop_final.png') });
  await browser.close();
})().catch(e => console.error('Error:', e.message));
````

## File: scripts/dev/apply_optimized.js
````javascript
/**
 * generate_cv_pdf.js
 * Genera PDF desde el CV HTML optimizado y sube a perfil CT
 * Luego aplica a las ofertas indicadas
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');
const fs   = require('node:fs');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

const CV_HTML = path.join(__dirname, '..', 'data', 'jobs', 'cv_jeiser_soporte_ti.html');
const CV_PDF  = path.join(__dirname, '..', 'data', 'jobs', 'cv_jeiser_soporte_ti.pdf');

const OFERTAS = [
  {
    titulo: 'Auxiliar de Soporte Técnico — Comfenalco Antioquia',
    url: 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-en-medellin-8499E6F0A657F98161373E686DCF3405',
  },
  {
    titulo: 'Auxiliar de sistemas — C.I ESLOP SAS',
    url: 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405',
  },
];

// ── 1. Generar PDF ────────────────────────────────────────────────
async function generatePDF() {
  console.log('📄 Generando PDF desde CV HTML...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///${CV_HTML.replace(/\\/g, '/')}`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.pdf({
    path: CV_PDF,
    format: 'Letter',
    printBackground: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  const sizeMB = (fs.statSync(CV_PDF).size / 1024).toFixed(0);
  console.log(`  ✅ PDF generado: ${CV_PDF} (${sizeMB} KB)`);
}

// ── 2. Login CT ────────────────────────────────────────────────────
async function loginCT(page) {
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
  await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
  await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  const ok = page.url().includes('candidate/home');
  console.log(`  🔑 Login: ${ok ? '✅ OK' : '⚠️  ' + page.url().substring(0, 60)}`);
  return ok;
}

// ── 3. Subir CV al perfil CT ───────────────────────────────────────
async function uploadCV(page) {
  console.log('\n📤 Subiendo CV optimizado al perfil CT...');
  await page.goto('https://candidato.co.computrabajo.com/candidate/cv', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);

  // Buscar input file para el CV
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    // Intentar buscar botón de "subir CV" o "adjuntar"
    const uploadBtn = page.locator('a:has-text("Adjuntar"), button:has-text("Subir"), a:has-text("Subir"), a:has-text("CV"), [class*="upload"]').first();
    if (await uploadBtn.count() > 0) {
      await uploadBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1500);
    }
  }

  // Buscar input file de nuevo
  const input = page.locator('input[type="file"]').first();
  if (await input.count() > 0) {
    await input.setInputFiles(CV_PDF);
    await page.waitForTimeout(2000);
    // Confirmar subida
    const confirmBtn = page.locator('button:has-text("Guardar"), button:has-text("Aceptar"), button[type="submit"]').first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
    }
    console.log('  ✅ CV subido al perfil CT');
    return true;
  } else {
    // Tomar screenshot para debug
    await page.screenshot({ path: path.join(__dirname, '..', 'diag_cv_upload.png') });
    console.log('  ⚠️  No se encontró input de archivo. Screenshot: diag_cv_upload.png');
    console.log('  URL actual:', page.url());
    return false;
  }
}

// ── 4. Aplicar a oferta (flujo completo con modal de confirmación) ─
async function aplicar(page, oferta) {
  console.log(`\n📨 Aplicando: ${oferta.titulo}`);
  await page.goto(oferta.url.split('#')[0], { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);

  // CT usa "Postularme" como texto principal del botón
  const btnTextos = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
  let clicked = false;

  for (const txt of btnTextos) {
    try {
      await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 4000 });
      clicked = true;
      console.log(`  ✅ Click en "${txt}"`);
      break;
    } catch {}
  }

  if (!clicked) {
    console.log('  ❌ No se encontró botón de postulación');
    await page.screenshot({ path: `diag_apply_${Date.now()}.png` });
    return false;
  }

  // Esperar modal de confirmación
  await page.waitForTimeout(2500);

  // CT muestra modal con "Enviar mi HdV" o similar
  const confirmTextos = ['Enviar mi HdV', 'Enviar', 'Confirmar', 'Aceptar', 'Postularme'];
  for (const txt of confirmTextos) {
    try {
      const btn = page.locator(`button:has-text("${txt}"), input[value="${txt}"]`).first();
      if (await btn.count() > 0) {
        await btn.click({ timeout: 4000 });
        await page.waitForTimeout(2000);
        console.log(`  ✅ Confirmado con "${txt}"`);
        return true;
      }
    } catch {}
  }

  // Si no hubo modal de confirmación, puede que la postulación ya se haya enviado directamente
  const pageText = await page.evaluate(() => document.body.innerText);
  if (/postulado|aplicado|enviado|gracias/i.test(pageText)) {
    console.log('  ✅ Aplicación enviada (sin modal adicional)');
    return true;
  }

  console.log('  ⚠️  No se encontró confirmación. URL:', page.url().substring(0, 80));
  await page.screenshot({ path: `diag_apply_confirm_${Date.now()}.png` });
  return false;
}

// ── MAIN ─────────────────────────────────────────────────────────
(async () => {
  // 1. Generar PDF
  await generatePDF();

  // 2. Login
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  const loggedIn = await loginCT(page);
  if (!loggedIn) {
    console.log('❌ Login fallido. Abortando.');
    await browser.close();
    return;
  }

  // 3. Subir CV
  const cvUploaded = await uploadCV(page);
  if (!cvUploaded) {
    console.log('\n⚠️  CV no subido automáticamente.');
    console.log('   → Sube manualmente el PDF: data/artifacts/jobs/cv_jeiser_soporte_ti.pdf');
    console.log('   → Aún así, aplicando con CV del perfil actual...\n');
  }

  // 4. Aplicar a cada oferta
  const resultados = [];
  for (const oferta of OFERTAS) {
    const ok = await aplicar(page, oferta);
    resultados.push({ ...oferta, aplicado: ok });
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Resumen
  console.log('\n════════════════════════════════');
  console.log('  RESUMEN DE APLICACIONES');
  console.log('════════════════════════════════');
  resultados.forEach(r => {
    console.log(`${r.aplicado ? '✅' : '❌'} ${r.titulo}`);
  });
})().catch(e => console.error('Fatal:', e.message));
````

## File: scripts/dev/query_repos.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');

const DB_FILE = path.join(__dirname, '..', 'data', 'repos_db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('❌ No hay base de datos. Corre primero: node scripts/scan_all_repos.js');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function keywordPreFilter(repos, query) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const scored = repos.map(r => {
    const txt = `${r.name} ${r.desc} ${r.lang}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (r.name.toLowerCase().includes(w)) score += 3;
      if (r.desc.toLowerCase().includes(w)) score += 2;
      if (txt.includes(w)) score += 1;
    }
    return { ...r, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 30);
}

async function queryRepos(userQuery) {
  const db = loadDB();
  console.log(`🔍 Buscando en ${db.length} repos: "${userQuery}"`);

  const candidates = keywordPreFilter(db, userQuery);
  console.log(`📋 ${candidates.length} candidatos pre-filtrados`);

  if (candidates.length === 0) {
    console.log('😕 Sin resultados.');
    return [];
  }

  const candidateList = candidates.map((r, i) =>
    `${i + 1}. [${r.stars.toLocaleString()}⭐] ${r.name} (${r.lang})\n   ${r.desc.substring(0, 150)}`
  ).join('\n\n');

  const systemPrompt = `Eres un curador de repositorios open source. Te doy una lista de candidatos.
El usuario busca: "${userQuery}"

Selecciona los 5-8 más relevantes. Para cada uno da:
- Por qué es relevante (1 línea)
- Cómo integrarlo en un proyecto personal de automatización tipo "LifeOS"
- Dificultad de integración (Fácil / Media / Difícil)

Responde en español, formato claro.`;

  console.log('🧠 Consultando IA...');
  const response = await askLLM(systemPrompt, [
    { role: 'user', content: `CANDIDATOS:\n\n${candidateList}` }
  ]);

  return {
    query: userQuery,
    candidates: candidates.length,
    recommendations: response?.content || 'Sin respuesta',
    topRepos: candidates.slice(0, 8)
  };
}

if (require.main === module) {
  const q = process.argv.slice(2).join(' ') || 'herramientas de automatización personal y notificaciones';
  queryRepos(q).then(result => {
    console.log('\n' + '═'.repeat(60));
    console.log(result.recommendations);
    console.log('\n═'.repeat(60));
    console.log(`\n📦 DB: ${require(DB_FILE).length.toLocaleString()} repos | ⚡ OpenRouter + Groq\n`);
  }).catch(e => { console.error(e); process.exit(1); });
}

// Uso desde cualquier proyecto:
//   const { queryRepos, loadDB } = require('./scripts/query_repos');
//   const result = await queryRepos("bases de datos vectoriales");
//   console.log(result.recommendations);

module.exports = { queryRepos, loadDB };
````

## File: scripts/dev/scan_local_repos.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const LOCAL_REPOS_DIR = process.env.LOCAL_REPOS_DIR || 'E:\\PROYECTOS\\Proyectos_GitHub';
const DB_PATH = path.join(__dirname, '..', 'data', 'bootcamp', 'repos_locales.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'bootcamp', 'repos_mapping.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) { console.log(msg); }

function getGitInfo(repoPath) {
  try {
    const remote = execSync('git remote get-url origin', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();
    const lastCommit = execSync('git log -1 --format=%ci', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();
    const commitCount = execSync('git rev-list --count HEAD', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();

    let name = '';
    if (remote.includes('github.com')) {
      name = remote.replace(/.*github\.com[:\/]/, '').replace(/\.git$/, '');
    } else {
      name = path.basename(repoPath);
    }

    return { remote, name, branch, lastCommit, commitCount: parseInt(commitCount) };
  } catch {
    return null;
  }
}

function analyzeRepo(repoPath, folderName) {
  const files = [];
  try {
    const walk = (dir, depth) => {
      if (depth > 3) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') && entry.name !== '.github') continue;
          if (entry.name === 'node_modules') continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && depth < 3) walk(full, depth + 1);
          else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            files.push({ name: entry.name, ext, size: fs.statSync(full).size });
          }
        }
      } catch {}
    };
    walk(repoPath, 0);
  } catch {}

  const langs = new Set();
  const langMap = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.rs': 'Rust', '.go': 'Go', '.java': 'Java',
    '.md': 'Markdown', '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
    '.css': 'CSS', '.html': 'HTML', '.vue': 'Vue', '.svelte': 'Svelte',
    '.sh': 'Shell', '.ps1': 'PowerShell', '.bat': 'Batch',
    '.test.ts': 'Test', '.spec.ts': 'Test', '.test.js': 'Test',
  };

  for (const f of files) {
    const lang = langMap[f.ext];
    if (lang) langs.add(lang);
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  return {
    totalFiles: files.length,
    languages: [...langs],
    totalSizeKB: Math.round(totalSize / 1024),
    topFiles: files.filter(f => f.size > 10000).sort((a, b) => b.size - a.size).slice(0, 5)
      .map(f => ({ name: f.name, sizeKB: Math.round(f.size / 1024) }))
  };
}

function classifyRepo(name, folderName) {
  const lower = (name + folderName).toLowerCase();
  const categories = {
    testing: ['playwright', 'cypress', 'vitest', 'testing', 'test', 'jest', 'mocha'],
    typescript: ['typescript', 'type-challenge', 'ts-', '-ts'],
    javascript: ['javascript', 'node', 'nodejs', 'js-', 'nodebestpractices'],
    fundamentals: ['freecodecamp', 'odin-project', 'coding-interview', 'computer-science', 'roadmap'],
    projects: ['realworld', 'build-your-own', 'app-idea', 'retos-programacion'],
    system_design: ['system-design', 'scalability', 'architecture'],
    react: ['react', 'next', 'bulletproof-react'],
    tools: ['git', 'github', 'cli', 'terminal', 'command-line'],
    ai_agents: ['agent', 'skill', 'ollama', 'llm', 'ai-', 'openai', 'langchain', 'openrouter'],
    libraries: ['chart', 'anime', 'shadcn', 'tailwind', 'pdf', 'tldraw'],
    infra: ['docker', 'kubernetes', 'supabase', 'pocketbase', 'dokploy', 'n8n'],
    other: []
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'other';
}

function main() {
  ensureDir(path.dirname(DB_PATH));

  log('═══════════════════════════════════════');
  log('📂 SCANNER DE REPOS LOCALES');
  log('═══════════════════════════════════════');
  log(`Directorio: ${LOCAL_REPOS_DIR}`);

  if (!fs.existsSync(LOCAL_REPOS_DIR)) {
    log(`❌ No existe: ${LOCAL_REPOS_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(LOCAL_REPOS_DIR, { withFileTypes: true });
  const repos = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(LOCAL_REPOS_DIR, entry.name);
    const isGit = fs.existsSync(path.join(fullPath, '.git'));

    if (!isGit) {
      log(`   ⏭ ${entry.name} (no es repo git)`);
      continue;
    }

    const gitInfo = getGitInfo(fullPath);
    const analysis = analyzeRepo(fullPath, entry.name);
    const category = classifyRepo(gitInfo?.name || '', entry.name);

    const repoEntry = {
      folder: entry.name,
      path: fullPath,
      github: gitInfo?.name || 'desconocido',
      remote: gitInfo?.remote || '',
      branch: gitInfo?.branch || '',
      lastCommit: gitInfo?.lastCommit || '',
      commitCount: gitInfo?.commitCount || 0,
      category,
      ...analysis
    };

    log(`   ✓ [${category}] ${entry.name.substring(0, 60)}`);
    repos.push(repoEntry);
  }

  // Save
  fs.writeFileSync(DB_PATH, JSON.stringify({
    escaneado: new Date().toISOString(),
    directorio: LOCAL_REPOS_DIR,
    total: repos.length,
    repos
  }, null, 2));

  // Generate category summary
  const byCategory = {};
  for (const r of repos) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r.folder);
  }

  fs.writeFileSync(MAPPING_PATH, JSON.stringify({
    generado: new Date().toISOString(),
    categorias: byCategory,
    resumen: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length]))
  }, null, 2));

  log(`\n✅ ${repos.length} repos catalogados`);
  log(`📁 DB: ${DB_PATH}`);
  log(`📁 Mapping: ${MAPPING_PATH}`);

  // Summary
  log('\n📊 Por categoria:');
  for (const [cat, items] of Object.entries(byCategory)) {
    log(`   ${cat}: ${items.length}`);
  }
}

main();
````

## File: scripts/dev/update_repos_db.js
````javascript
/**
 * update_repos_db.js
 * Actualiza data/repos_db.json fusionando 2 fuentes:
 *   Fuente A: EvanLi/Github-Ranking → CSV diario (sin Playwright)
 *   Fuente B: gitstar-ranking.com   → Playwright (opcional, si está disponible)
 * Estrategia: merge + dedup por nombre, actualiza stars si hay versión más reciente
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', 'data', 'repos_db.json');
const META_PATH = path.join(__dirname, '..', 'data', 'repos_db_meta.json');
const RAW_BASE = 'https://raw.githubusercontent.com/EvanLi/Github-Ranking/master/Data';

// ── Helpers ────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  // Header: rank,item,repo_name,stars,forks,language,repo_url,username,issues,last_commit,description
  const repos = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // CSV safe split (respeta comas dentro de comillas)
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());

    if (cols.length < 4) continue;
    const [rank, , name, starsRaw, forksRaw, lang, url, , , , ...descParts] = cols;
    const stars = parseInt(starsRaw?.replace(/,/g, ''), 10);
    if (!name || isNaN(stars)) continue;

    repos.push({
      name: name.trim(),
      url: url?.trim() || `https://github.com/${name.trim()}`,
      stars,
      forks: parseInt(forksRaw?.replace(/,/g, ''), 10) || 0,
      lang: lang?.trim() || '?',
      desc: descParts.join(',').trim() || '',
      rank: parseInt(rank, 10) || 0,
    });
  }
  return repos;
}

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return []; }
}

function loadMeta() {
  if (!fs.existsSync(META_PATH)) return { lastUpdate: null, sources: [] };
  try { return JSON.parse(fs.readFileSync(META_PATH, 'utf8')); }
  catch { return { lastUpdate: null, sources: [] }; }
}

function saveDB(repos) {
  const sorted = [...repos].sort((a, b) => b.stars - a.stars);
  fs.writeFileSync(DB_PATH, JSON.stringify(sorted, null, 2));
  return sorted.length;
}

function saveMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

function mergeRepos(existing, incoming) {
  const map = new Map();
  // Cargar existentes
  for (const r of existing) map.set(r.name, r);
  let added = 0, updated = 0;
  // Merge nuevos
  for (const r of incoming) {
    if (!map.has(r.name)) {
      map.set(r.name, r);
      added++;
    } else {
      const old = map.get(r.name);
      // Actualizar si cambiaron las estrellas u otros campos
      if (r.stars > old.stars || !old.rank) {
        map.set(r.name, { ...old, ...r });
        updated++;
      }
    }
  }
  return { merged: [...map.values()], added, updated };
}

// ── Fuente A: EvanLi CSV diario ────────────────────────────────
async function fetchEvanLi() {
  // Intentar últimos 3 días para garantizar disponibilidad
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  for (const date of dates) {
    const url = `${RAW_BASE}/github-ranking-${date}.csv`;
    try {
      console.log(`[EvanLi] Intentando ${date}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const text = await res.text();
      const repos = parseCSV(text);
      if (repos.length > 100) {
        console.log(`[EvanLi] ✅ ${date} → ${repos.length} repos`);
        return { repos, date, url };
      }
    } catch (e) {
      console.warn(`[EvanLi] ⚠ ${date}: ${e.message}`);
    }
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔄 Actualizando repos_db.json...\n');

  const existing = loadDB();
  const meta = loadMeta();
  console.log(`📦 DB actual: ${existing.length} repos | Última actualización: ${meta.lastUpdate || 'nunca'}`);

  const sources = [];
  let allNew = [];

  // Fuente A
  console.log('\n📡 Fuente A: EvanLi/Github-Ranking (CSV diario)...');
  const evanli = await fetchEvanLi();
  if (evanli) {
    allNew.push(...evanli.repos);
    sources.push({ name: 'EvanLi', date: evanli.date, count: evanli.repos.length, url: evanli.url });
    console.log(`   ✅ ${evanli.repos.length} repos de ${evanli.date}`);
  } else {
    console.log('   ❌ No se pudo obtener datos de EvanLi');
  }

  if (allNew.length === 0) {
    console.log('\n⚠️ Sin datos nuevos. DB sin cambios.');
    process.exit(0);
  }

  // Merge
  console.log(`\n🔀 Mergeando ${allNew.length} repos nuevos con ${existing.length} existentes...`);
  const { merged, added, updated } = mergeRepos(existing, allNew);

  // Guardar
  const total = saveDB(merged);
  const newMeta = {
    lastUpdate: new Date().toISOString(),
    totalRepos: total,
    sources: [...(meta.sources || []).slice(-10), ...sources],
  };
  saveMeta(newMeta);

  // Reporte
  console.log('\n✅ ACTUALIZACIÓN COMPLETA');
  console.log('═'.repeat(50));
  console.log(`  Repos antes:    ${existing.length}`);
  console.log(`  Repos nuevos:   +${added}`);
  console.log(`  Repos updated:  ~${updated} (stars actualizadas)`);
  console.log(`  Total final:    ${total}`);
  console.log(`  Fuentes: ${sources.map(s => s.name + ' (' + s.date + ')').join(', ')}`);

  // Muestra top 5 por si cambió el ranking
  const topDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log('\n🏆 Top 5 actual:');
  topDb.slice(0, 5).forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.stars.toLocaleString()}⭐] ${r.name}`)
  );
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

module.exports = { fetchEvanLi, mergeRepos, parseCSV };
````

## File: scripts/diagnostics/audit.js
````javascript
const fs = require('fs');
const path = require('path');

const scripts = [
  'scripts/integrations/email_processor.js',
  'scripts/integrations/telegram_listener.js',
  // 'scripts/maintenance/reflexion_nocturna.js',  // REMOVED — código muerto
  'scripts/schedulers/brain_orchestrator.js',
  'scripts/integrations/moodle_sena_scraper.js',
  'scripts/integrations/simit_scraper.js',
  'scripts/diagnostics/healthcheck.js',
  // 'scripts/integrations/recordatorio_deepseek.js',  // DEPRECATED — reemplazado por multi-proveedor
  'scripts/integrations/inbox_sensor.js',
  'scripts/integrations/dian_scraper.js',
  'lib/memory/memory.js',
  'lib/memory/memory_engine.js',
  'lib/ai/llm_service.js',
  'lib/context/context_resolver.js',
  'lib/context/pending.js',
  'lib/integrations/telegram.js',
  'lib/integrations/google_auth.js',
  'lib/lobulos/hipotalamo.js',
  'lib/lobulos/frontal.js',
  'lib/lobulos/temporal.js',
  'lib/lobulos/parietal.js',
  'lib/lobulos/occipital.js',
];

const issues = [];
const ok = [];

for (const s of scripts) {
  if (!fs.existsSync(s)) {
    issues.push(`[ARCHIVO FALTANTE] ${s}`);
    continue;
  }
  const dir = path.dirname(s);
  const content = fs.readFileSync(s, 'utf8');
  const reqs = [...content.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)].map(m => m[1]);
  for (const r of reqs) {
    const base = path.resolve(dir, r);
    const exists = fs.existsSync(base) ||
      fs.existsSync(base + '.js') ||
      fs.existsSync(base + '.json') ||
      fs.existsSync(path.join(base, 'index.js'));
    if (!exists) {
      issues.push(`[IMPORT ROTO] ${s} -> require('${r}')`);
    }
  }
  ok.push(s);
}

console.log('\n===== AUDIT REPORT =====');
if (issues.length === 0) {
  console.log('✅ Sin problemas encontrados.');
} else {
  console.log(`❌ ${issues.length} problema(s):\n`);
  issues.forEach(i => console.log(' •', i));
}
console.log(`\n✅ ${ok.length} archivos revisados.`);
````

## File: scripts/integrations/didi_calendar_sync.js
````javascript
/**
 * scripts/integrations/didi_calendar_sync.js
 * Sincroniza el horario diario de DiDi (Smart Shifts) con Google Calendar.
 * Agrega 'popups' (alarmas) en el momento exacto del evento.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const CREDENTIALS = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
};

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');

function getOAuth2Client() {
  const oAuth2 = new google.auth.OAuth2(
    CREDENTIALS.client_id,
    CREDENTIALS.client_secret,
    CREDENTIALS.redirect_uri
  );
  
  if (fs.existsSync(TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    oAuth2.setCredentials(token);
  }
  return oAuth2;
}

/**
 * eventsArr format:
 * [
 *   {
 *     summary: "Despertar y Preparación",
 *     description: "Levantarse, café, revisión llantas (32 PSI).",
 *     start_iso: "2026-07-08T05:00:00-05:00",
 *     end_iso: "2026-07-08T06:00:00-05:00"
 *   }
 * ]
 */
async function syncDiDiSchedule(eventsArr) {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.log("[GCal Sync] No hay token de Google. Omitiendo alarmas.");
    return;
  }

  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });

  console.log(`[GCal Sync] Sincronizando ${eventsArr.length} alarmas/eventos en Google Calendar...`);

  let creados = 0, saltados = 0;
  for (const ev of eventsArr) {
    const summary = `🚕 ${ev.summary}`;
    const startTime = new Date(ev.start_iso).toISOString();
    const endTime = new Date(ev.end_iso).toISOString();

    // Dedup: verificar si ya existe
    try {
      const existing = await calendar.events.list({
        calendarId: 'primary',
        q: summary,
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
      });
      if ((existing.data.items || []).length > 0) {
        console.log(` ⏭️ Ya existe: ${ev.summary} a las ${new Date(ev.start_iso).toLocaleTimeString()}`);
        saltados++;
        continue;
      }
    } catch {}

    const event = {
      summary,
      description: ev.description,
      start: { dateTime: ev.start_iso, timeZone: 'America/Bogota' },
      end: { dateTime: ev.end_iso, timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 } // ¡ALARMA EN EL CELULAR!
        ],
      },
    };

    try {
      await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      console.log(` ✅ Alarma seteada: ${ev.summary} a las ${new Date(ev.start_iso).toLocaleTimeString()}`);
      creados++;
    } catch (err) {
      console.error(` ❌ Error creando alarma ${ev.summary}: ${err.message}`);
    }
  }
  console.log(`[GCal Sync] Resultado: ${creados} creados, ${saltados} saltados (ya existían)`);
}

module.exports = { syncDiDiSchedule };
````

## File: scripts/integrations/download_attachments.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { authorize: googleAuthorize } = require('../../lib/integrations/google_auth');

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(BASE_DIR, 'data', 'documentos');
const INDEX_FILE = path.join(DOCS_DIR, 'indice.json');
const LOG_FILE = path.join(BASE_DIR, 'logs', 'attachment_downloader.log');

const IMPORTANT_SENDERS = [
  'fiscalia', 'dian', 'simit', 'fcm.org.co', 'transitoitagui',
  'itagui.gov.co', 'sena', 'cesde', 'mineducacion', 'hacienda',
  'medellin.gov.co', 'secretaria', 'notificaciones',
  'angelina rojas', 'angelinarojas'
];

const IMPORTANT_SUBJECTS = [
  'comparendo', 'multa', 'resolucion', 'notificacion', 'citacion',
  'certificado', 'derecho de peticion', 'respuesta', 'embargo',
  'conciliacion', 'fallo', 'sentencia', 'requerimiento',
  'convalidacion', 'matricula', 'beca', 'contrato'
];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {}
}

function isImportant(from, subject) {
  const txt = `${from} ${subject}`.toLowerCase();
  const senderMatch = IMPORTANT_SENDERS.some(s => txt.includes(s));
  const subjectMatch = IMPORTANT_SUBJECTS.some(s => txt.includes(s));
  return senderMatch || subjectMatch;
}

function loadIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {}
  return [];
}

function saveIndex(data) {
  const dir = path.dirname(INDEX_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  log('🚀 Iniciando descarga de adjuntos de emails importantes...');
  const auth = await googleAuthorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const q = 'in:inbox has:attachment newer_than:14d';
  log(`📬 Query: ${q}`);

  const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 50 });
  const messages = res.data.messages || [];
  log(`📬 ${messages.length} emails con adjuntos encontrados (14 días)`);

  const index = loadIndex();
  const processed = new Set(index.map(e => e.messageId));
  const nuevos = [];

  for (const ref of messages) {
    if (processed.has(ref.id)) continue;

    try {
      const detail = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'full'
      });

      const headers = detail.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '?';
      const subject = headers.find(h => h.name === 'Subject')?.value || '?';
      const date = headers.find(h => h.name === 'Date')?.value || '?';

      if (!isImportant(from, subject)) {
        log(`⏭️ No importante: ${subject.substring(0, 60)}`);
        continue;
      }

      const parts = [];
      function walk(part) {
        if (part.parts) part.parts.forEach(walk);
        else if (part.filename && part.body?.attachmentId) parts.push(part);
      }
      walk(detail.data.payload);

      if (parts.length === 0) {
        log(`📎 Sin adjuntos descargables: ${subject.substring(0, 50)}`);
        continue;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const emailDir = path.join(DOCS_DIR, dateStr, ref.id.substring(0, 12));
      if (!fs.existsSync(emailDir)) fs.mkdirSync(emailDir, { recursive: true });

      const files = [];
      for (const part of parts) {
        const att = await gmail.users.messages.attachments.get({
          userId: 'me', messageId: ref.id, id: part.body.attachmentId
        });
        const data = Buffer.from(att.data.data, 'base64');
        const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(emailDir, safeName);
        fs.writeFileSync(filePath, data);
        files.push({ name: safeName, size: data.length, path: filePath });
        log(`💾 Guardado: ${safeName} (${(data.length / 1024).toFixed(1)} KB)`);
      }

      const entry = {
        messageId: ref.id,
        from, subject, date,
        dir: emailDir,
        files,
        downloadedAt: new Date().toISOString()
      };
      index.push(entry);
      nuevos.push(entry);

      log(`✅ ${files.length} adjuntos de: ${subject.substring(0, 60)}`);
    } catch (e) {
      log(`❌ Error con mensaje ${ref.id}: ${e.message}`);
    }
  }

  saveIndex(index);
  log(`🏁 Terminado. ${nuevos.length} emails nuevos procesados.`);
  return { nuevos, total: index.length };
}

if (require.main === module) {
  main().catch(e => { log(`💥 FATAL: ${e.message}`); process.exit(1); });
}

module.exports = { main };
````

## File: scripts/integrations/google_calendar_cesde.js
````javascript
/**
 * google_calendar_cesde.js
 * Paso 1: Genera URL de autorización
 * Paso 2: Intercambia código por token
 * Paso 3: Crea eventos CESDE en Google Calendar con alarma 1h antes
 *
 * Uso:
 *   node scripts/google_calendar_cesde.js auth     ← genera URL
 *   node scripts/google_calendar_cesde.js create   ← crea eventos (requiere token)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google }  = require('googleapis');
const fs          = require('node:fs');
const path        = require('node:path');
const readline    = require('node:readline');

const CREDENTIALS = {
  client_id:     process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri:  'urn:ietf:wg:oauth:2.0:oob',
};

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');
const SCOPES     = ['https://www.googleapis.com/auth/calendar.events'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    CREDENTIALS.client_id,
    CREDENTIALS.client_secret,
    CREDENTIALS.redirect_uri
  );
}

// ── Paso 1: Generar URL de autorización ──────────────────────────
function generateAuthUrl() {
  const oAuth2 = getOAuth2Client();
  const url = oAuth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
  console.log('\n════════════════════════════════════════════════');
  console.log('  AUTORIZAR GOOGLE CALENDAR');
  console.log('════════════════════════════════════════════════');
  console.log('\n1. Abre este enlace en tu navegador:\n');
  console.log(url);
  console.log('\n2. Autoriza el acceso a Google Calendar');
  console.log('3. Copia el código que aparece');
  console.log('4. Ejecuta:\n   node scripts/google_calendar_cesde.js token <CÓDIGO>\n');
}

// ── Paso 2: Intercambiar código por token ─────────────────────────
async function saveToken(code) {
  const oAuth2 = getOAuth2Client();
  const { tokens } = await oAuth2.getToken(code);
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log('✅ Token guardado en .google_token.json');
  console.log('   Ahora ejecuta: node scripts/google_calendar_cesde.js create');
}

// ── Paso 3: Crear eventos CESDE ───────────────────────────────────
async function createEvents() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.log('❌ No hay token. Primero ejecuta: node scripts/google_calendar_cesde.js auth');
    return;
  }

  const oAuth2 = getOAuth2Client();
  const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  oAuth2.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oAuth2 });

  // COT = UTC-5 → 18:00 COT = 23:00 UTC
  const clases = [
    { fecha: '2026-07-08', num: 4,  extra: '' },
    { fecha: '2026-07-10', num: 5,  extra: '' },
    { fecha: '2026-07-15', num: 6,  extra: '' },
    { fecha: '2026-07-17', num: 7,  extra: '' },
    { fecha: '2026-07-22', num: 8,  extra: '' },
    { fecha: '2026-07-24', num: 9,  extra: '🎯 HOY ASIGNAN EL TALLER' },
    { fecha: '2026-07-27', num: 10, extra: '⚠️ ENTREGA DEL TALLER' },
    { fecha: '2026-07-25', num: null, extra: '🚀 Primer día Bootcamp QA', start: '07:00', end: '18:00' },
  ];

  console.log('\n📅 Creando eventos en Google Calendar...\n');

  for (const c of clases) {
    const isBootcamp = c.num === null;
    const startTime  = c.start || '18:00';
    const endTime    = c.end   || '20:00';
    const summary    = isBootcamp
      ? '🚀 CESDE Bootcamp QA — Primer día presencial'
      : `CESDE — Clase ${c.num}${c.extra ? ' ' + c.extra : ''} (Introductorio)`;
    const description = isBootcamp
      ? 'Inicio del Bootcamp QA Automation (28 semanas)\nBeca 70%\nHorario: Sábados 7am-6pm'
      : `Curso introductorio becados CESDE · 6-8pm${c.extra ? '\n' + c.extra : ''}`;

    const event = {
      summary,
      description,
      location: 'CESDE, Medellín, Colombia',
      start: { dateTime: `${c.fecha}T${startTime}:00`, timeZone: 'America/Bogota' },
      end:   { dateTime: `${c.fecha}T${endTime}:00`,   timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },   // alarma teléfono 1h antes
          ...(c.num === 10 ? [{ method: 'popup', minutes: 1440 }] : []),  // +24h para entrega
          ...(c.num === 9  ? [{ method: 'popup', minutes: 0   }] : []),   // al inicio clase 9
        ],
      },
    };

    try {
      const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
      console.log(`  ✅ Clase ${c.num || 'Bootcamp'} — ${c.fecha} → ${res.data.htmlLink}`);
    } catch (e) {
      console.log(`  ❌ Error Clase ${c.num}: ${e.message}`);
    }
  }

  console.log('\n✅ Todos los eventos creados. Revisa Google Calendar.');
}

// ── Main ──────────────────────────────────────────────────────────
const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === 'auth')                    generateAuthUrl();
else if (cmd === 'token' && arg)       saveToken(arg).catch(console.error);
else if (cmd === 'create')             createEvents().catch(console.error);
else {
  console.log('Uso:');
  console.log('  node scripts/google_calendar_cesde.js auth');
  console.log('  node scripts/google_calendar_cesde.js token <CÓDIGO>');
  console.log('  node scripts/google_calendar_cesde.js create');
}
````

## File: scripts/integrations/gworkspace_manager.js
````javascript
/**
 * scripts/integrations/gworkspace_manager.js
 * 
 * Wrapper nativo para Google Workspace (Calendar) diseñado para usarse como CLI.
 * Permite a otros scripts de LifeOS inyectar eventos instantáneamente.
 * (Inspirado en la eficiencia de googleworkspace/cli en Rust)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');
const CREDENTIALS_FILE = path.join(__dirname, '..', '..', 'credentials.json');

function getAuthClient() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('Falta el token de Google (.google_token.json). Corre setup_google_calendar.js primero.');
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const key = creds.installed || creds.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris ? key.redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob'
  );
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Busca si ya existe un evento con este título en esta ventana de tiempo.
 */
async function findExistingEvent(calendar, summary, startTimeISO, endTimeISO) {
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      q: summary.substring(0, 40),
      timeMin: new Date(startTimeISO).toISOString(),
      timeMax: new Date(endTimeISO).toISOString(),
      singleEvents: true,
    });
    return (res.data.items || []).length > 0;
  } catch {
    return false;
  }
}

/**
 * Crea un evento en el calendario principal (con dedup automático).
 */
async function createEvent(summary, startTimeISO, durationHours = 1, description = '', recurrenceRule = null, reminderMinutes = 60) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(startTimeISO);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  // Dedup: verificar si ya existe
  if (await findExistingEvent(calendar, summary, startTimeISO, end.toISOString())) {
    console.log(`[Calendar] ⏭️ Ya existe: ${summary}`);
    return { id: 'skipped', skipped: true, summary };
  }

  const event = {
    summary: summary,
    description: description,
    start: { dateTime: start.toISOString(), timeZone: 'America/Bogota' },
    end: { dateTime: end.toISOString(), timeZone: 'America/Bogota' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes }
      ],
    },
  };

  if (recurrenceRule) {
    event.recurrence = [recurrenceRule];
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return res.data;
}

// ─── Interfaz CLI ─────────────────────────────────────────────
if (require.main === module) {
  const [,, cmd, summary, startTime, duration] = process.argv;

  if (cmd === 'create') {
    if (!summary || !startTime) {
      console.log('Uso: node gworkspace_manager.js create "Titulo" "2026-07-08T18:00:00Z" [duration_hours]');
      process.exit(1);
    }
    createEvent(summary, startTime, parseFloat(duration || '1'))
      .then(data => console.log(`✅ Evento creado: ${data.htmlLink}`))
      .catch(e => console.error('❌ Error creando evento:', e.message));
  } else {
    console.log('Comandos soportados: create');
  }
}

module.exports = {
  createEvent
};
````

## File: scripts/integrations/moodle_sena_downloader.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'sena');
const MAT_DIR = path.join(DATA_DIR, 'materiales');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function downloadViaFetch(page, fileUrl, destPath) {
  try {
    const result = await page.evaluate(async (url) => {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (blob.size < 500) return null; // ignore tiny files (errors/redirects)
      const arrayBuf = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuf));
      return { bytes, size: blob.size };
    }, fileUrl);

    if (!result) return false;

    const buf = Buffer.from(result.bytes);
    fs.writeFileSync(destPath, buf);
    return result.size;
  } catch (err) {
    return false;
  }
}

async function main() {
  ensureDir(MAT_DIR);

  log('═══════════════════════════════════════');
  log('📚 SENA PDF DOWNLOADER v2');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.selectOption('select[name="typeDocument"]', 'CC');
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);
  const btn = await page.$('button[name="form_login_user"]');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
    btn.click()
  ]);
  await page.waitForTimeout(2000);
  log('✅ Login OK');

  // Load course data
  const cursoPath = path.join(DATA_DIR, 'curso.json');
  const course = JSON.parse(fs.readFileSync(cursoPath, 'utf8'));

  const allFiles = [];
  const pages = [];

  for (const sec of course.secciones) {
    for (const act of sec.actividades) {
      if (act.url) {
        pages.push({ ...act, seccion: sec.nombre });
      }
    }
  }

  log(`Total pages to scan: ${pages.length}\n`);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const shortName = (p.nombre || '').substring(0, 60).trim();
    log(`[${i + 1}/${pages.length}] ${p.tipo.toUpperCase()} | ${shortName}`);

    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Extract ALL resource links: onclick window.open, href to Repositorio, file.php links
    const resources = await page.evaluate(() => {
      const main = document.querySelector('[role="main"], #region-main, .page-content') || document.body;
      const found = [];

      // 1. onclick="window.open(...)" patterns
      const allEls = main.querySelectorAll('*');
      for (const el of allEls) {
        const onclick = el.getAttribute('onclick') || '';
        const matches = onclick.matchAll(/window\.open\(['"](.+?)['"]/g);
        for (const m of matches) {
          found.push({ url: m[1], source: 'onclick' });
        }
      }

      // 2. Regular links to files in Repositorio
      const links = main.querySelectorAll('a[href*="Repositorio"], a[href$=".pdf"], a[href*="DocArtic"], a[href*="Contenido/DocArtic"]');
      for (const a of links) {
        found.push({ url: a.href, source: 'link' });
      }

      // 3. file.php links (Moodle file proxy)
      const fileLinks = main.querySelectorAll('a[href*="file.php"], a[href*="pluginfile.php"]');
      for (const a of fileLinks) {
        found.push({ url: a.href, source: 'file.php' });
      }

      return found;
    });

    // Also check for window.open in the full page (not just main)
    if (resources.length === 0) {
      const extraResources = await page.evaluate(() => {
        const matches = document.body.innerHTML.matchAll(/window\.open\(['"](.+?)['"]/g);
        return Array.from(matches).map(m => ({ url: m[1], source: 'global_onclick' }));
      });
      resources.push(...extraResources);
    }

    // Deduplicate
    const seen = new Set();
    const unique = resources.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    if (unique.length === 0) {
      log(`   Sin recursos descargables`);
      continue;
    }

    log(`   ${unique.length} recurso(s)`);

    for (const res of unique) {
      let fileUrl = res.url;
      if (fileUrl.startsWith('/')) fileUrl = BASE_URL + fileUrl;

      // Determine filename and type
      const urlPath = new URL(fileUrl).pathname;
      let filename = path.basename(urlPath).split('?')[0];

      // Determine type
      let fileType = 'FILE';
      if (filename.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().includes('docartic')) fileType = 'PDF';
      else if (fileUrl.toLowerCase().includes('ova/') || fileUrl.includes('index.html')) fileType = 'OVA';
      else if (filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc')) fileType = 'DOC';
      else if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) fileType = 'XLS';

      if (!filename || filename.length < 3) {
        // Generate filename from URL path
        const parts = urlPath.split('/').filter(Boolean);
        filename = parts[parts.length - 1] || `material_${Date.now()}.pdf`;
      }
      if (!filename.includes('.')) filename += '.pdf';

      // Create folder per section
      const secSafe = (p.seccion || 'general').replace(/[<>:"/\\|?*]/g, '').trim().substring(0, 40) || 'general';
      const folderPath = path.join(MAT_DIR, secSafe);
      ensureDir(folderPath);

      const destPath = path.join(folderPath, filename);

      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
        const kb = Math.round(fs.statSync(destPath).size / 1024);
        log(`   ✓ Ya existe: ${filename} (${kb} KB)`);
        allFiles.push({ seccion: p.seccion, file: filename, type: fileType, size_kb: kb, source: res.source });
        continue;
      }

      const size = await downloadViaFetch(page, fileUrl, destPath);
      if (size) {
        const kb = Math.round(size / 1024);
        log(`   ✓ ${fileType}: ${filename} (${kb} KB)`);
        allFiles.push({ seccion: p.seccion, file: filename, type: fileType, size_kb: kb, source: res.source, url: fileUrl });
      } else {
        log(`   ✗ Fallo: ${filename}`);
        allFiles.push({ seccion: p.seccion, file: filename, type: fileType, error: 'download_failed', url: fileUrl });
      }
    }
  }

  // Save index
  const index = {
    extraido: new Date().toISOString(),
    curso: course.nombre,
    total: allFiles.length,
    exitosos: allFiles.filter(f => !f.error).length,
    fallidos: allFiles.filter(f => f.error).length,
    archivos: allFiles
  };
  fs.writeFileSync(path.join(DATA_DIR, 'materiales_index.json'), JSON.stringify(index, null, 2));

  log('\n═══════════════════════════════════════');
  log(`✅ ${index.exitosos} archivos descargados`);
  log(`❌ ${index.fallidos} fallidos`);
  log(`📁 ${MAT_DIR}`);
  log('═══════════════════════════════════════');

  await browser.close();
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); console.error(err); process.exit(1); });
````

## File: scripts/integrations/moodle_sena_html2md.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'sena');
const MAT_DIR = path.join(DATA_DIR, 'materiales');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function htmlToMarkdown(html) {
  // Basic HTML-to-MD converter specific to Moodle content
  let md = html;

  // Remove scripts, styles, comments
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  md = md.replace(/<!--[\s\S]*?-->/g, '');
  md = md.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Tables → MD tables (simple approach - just extract text cells)
  md = md.replace(/<table[^>]*>/gi, '\n');
  md = md.replace(/<\/table>/gi, '\n');
  md = md.replace(/<tr[^>]*>/gi, '');
  md = md.replace(/<\/tr>/gi, '\n');
  md = md.replace(/<t[dh][^>]*>/gi, '| ');
  md = md.replace(/<\/t[dh]>/gi, ' ');

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

  // Basic formatting
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n');

  // Links
  md = md.replace(/<a[^>]*href=["'](.+?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images → just keep alt text
  md = md.replace(/<img[^>]*alt=["'](.+?)["'][^>]*>/gi, '[img: $1]');
  md = md.replace(/<img[^>]*>/gi, '[img]');

  // Paragraphs and line breaks
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/div>/gi, '\n');
  md = md.replace(/<\/li>/gi, '\n');

  // Lists
  md = md.replace(/<li[^>]*>/gi, '\n- ');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Clean up entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));

  // Clean whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.replace(/[ \t]{2,}/g, ' ');
  md = md.replace(/^\s+|\s+$/gm, '');
  md = md.replace(/\n{2,}/g, '\n\n');

  return md.trim();
}

async function extractPageContent(page, pageUrl) {
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Extract content from main area only
  const content = await page.evaluate(() => {
    const main = document.querySelector('[role="main"], #region-main, .page-content, .no-overflow');
    if (!main) return { title: document.title, html: document.body.innerHTML, text: document.body.innerText };

    // Get the title
    const title = document.querySelector('h1, h2')?.textContent?.trim() || document.title;

    // Remove navigation, header, footer from main content
    const clone = main.cloneNode(true);
    const removals = clone.querySelectorAll('.activity-navigation, .nav-link, .modified, ' +
      '.header, .page-context-header, .sr-only, script, style, iframe, ' +
      '.activity-information, .breadcrumb, nav, .backto, .activity-header');
    removals.forEach(el => el.remove());

    return {
      title,
      html: clone.innerHTML,
      text: clone.innerText
    };
  });

  return {
    title: content.title,
    text: content.text.substring(0, 15000), // Cap at 15K chars
    markdown: htmlToMarkdown(content.html)
  };
}

async function main() {
  ensureDir(MAT_DIR);
  log('═══════════════════════════════════════');
  log('📝 SENA HTML → MD CONVERTER');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.selectOption('select[name="typeDocument"]', 'CC');
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);
  const btn = await page.$('button[name="form_login_user"]');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
    btn.click()
  ]);
  await page.waitForTimeout(2000);
  log('✅ Login OK');

  const cursoPath = path.join(DATA_DIR, 'curso.json');
  const course = JSON.parse(fs.readFileSync(cursoPath, 'utf8'));

  // Only convert PAGINA type items that have real content (skip empty ones)
  const pages = [];
  for (const sec of course.secciones) {
    for (const act of sec.actividades) {
      if (act.tipo !== 'pagina') continue;
      const name = (act.nombre || '').toLowerCase();
      // Skip pages that are just containers for PDFs/OVAs
      if (name.includes('materiales complementarios') ||
          name.includes('documentos de interés') ||
          name.includes('software requerido') ||
          name.includes('biblioteca')) continue;
      pages.push({ ...act, seccion: sec.nombre });
    }
  }

  log(`${pages.length} paginas para convertir a .md\n`);

  const converted = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const shortName = (p.nombre || '').substring(0, 60).trim();
    log(`[${i + 1}/${pages.length}] ${shortName}`);

    try {
      const content = await extractPageContent(page, p.url);

      if (!content.markdown || content.markdown.length < 50) {
        log(`   → Sin contenido textual significativo (${content.markdown.length} chars), saltando`);
        continue;
      }

      // Clean filename
      let filename = shortName
        .replace(/[^a-zA-Z0-9áéíóú ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      if (filename.length > 50) filename = filename.substring(0, 50);

      // Determine section folder
      const secSafe = (p.seccion || 'general')
        .replace(/[<>:"/\\|?*]/g, '')
        .trim()
        .substring(0, 40) || 'general';

      const folderPath = path.join(MAT_DIR, secSafe);
      ensureDir(folderPath);

      const mdPath = path.join(folderPath, `${filename}.md`);
      const mdContent = `# ${content.title || shortName}\n> Fuente: ${p.url}\n> Convertido: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n\n${content.markdown}`;

      fs.writeFileSync(mdPath, mdContent, 'utf8');
      const sizeKB = Math.round(mdContent.length / 1024);
      log(`   ✓ ${filename}.md (${sizeKB} KB)`);
      converted.push({ seccion: p.seccion, file: `${filename}.md`, size_kb: sizeKB });
    } catch (err) {
      log(`   ✗ Error: ${err.message.substring(0, 60)}`);
    }
  }

  // Save conversion index
  fs.writeFileSync(path.join(MAT_DIR, 'indice_md.json'), JSON.stringify({
    extraido: new Date().toISOString(),
    total: converted.length,
    archivos: converted
  }, null, 2));

  log(`\n✅ ${converted.length} archivos .md generados`);
  log(`📁 ${MAT_DIR}`);

  await browser.close();
}

main().catch(err => { log(`❌ ${err.message}`); process.exit(1); });
````

## File: scripts/integrations/recordatorio_deepseek.js
````javascript
/**
 * recordatorio_deepseek.js — DEPRECATED
 *
 * Este archivo ya no es necesario porque LifeOS ya no usa DeepSeek.
 * Los recordatorios de valle/pico de DeepSeek han sido eliminados.
 *
 * Mantenido como stub para evitar errores de importación.
 */

async function main() {
  // No-op: DeepSeek ha sido reemplazado por OpenRouter + Groq + multi-proveedor
  console.log('[Recordatorio DeepSeek] Deprecado — LifeOS usa multi-proveedor');
}

main().catch(() => {});
````

## File: scripts/integrations/sena_pdf2md.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

const MAT_DIR = path.join(__dirname, '..', 'data', 'sena', 'materiales');

function log(msg) { console.log(msg); }

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n')
    .replace(/[ \t]{3,}/g, '  ')
    .trim();
}

function textToMarkdown(text, title) {
  const lines = text.split('\n');
  const processed = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { processed.push(''); continue; }

    if (trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{4,}$/) && trimmed.length < 80) {
      processed.push(`## ${trimmed}`);
    } else if (trimmed.match(/^(\d+[\.\)]\s+|CAPÍTULO|TEMA|UNIDAD|MÓDULO|Objetivo|Introducción|Conclusión|Resumen|Referencia|Bibliografía)\s/i)) {
      processed.push(`### ${trimmed}`);
    } else {
      processed.push(trimmed);
    }
  }

  return `# ${title}\n> Convertido de PDF | ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n\n${processed.join('\n\n')}`;
}

async function convertPdf(pdfPath) {
  try {
    const buffer = new Uint8Array(fs.readFileSync(pdfPath));
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    await parser.load();
    const result = await parser.getText();
    return cleanText(result.text || '');
  } catch (err) {
    return null;
  }
}

function collectPdfs(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'index.html') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPdfs(fullPath));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      results.push({ fullPath, name: entry.name, parentDir: path.dirname(fullPath) });
    }
  }
  return results;
}

async function main() {
  log('═══════════════════════════════════════');
  log('📄 PDF → MD CONVERTER');
  log('═══════════════════════════════════════\n');

  const pdfs = collectPdfs(MAT_DIR);
  log(`${pdfs.length} PDFs encontrados`);

  const toConvert = pdfs.filter(p => {
    const name = p.name.toLowerCase();
    return !name.includes('evidencia_') &&
           !name.includes('ie_evidencia') &&
           !name.includes('protocolo') &&
           !name.includes('actualizacion') &&
           !name.endsWith('.php');
  });

  log(`${toConvert.length} para convertir\n`);

  let converted = 0;
  for (const pdf of toConvert) {
    const mdName = pdf.name.replace(/\.pdf$/i, '.md');
    const mdPath = path.join(pdf.parentDir, mdName);
    if (fs.existsSync(mdPath)) { log(`  → Ya existe: ${pdf.name}`); continue; }

    const text = await convertPdf(pdf.fullPath);
    if (!text || text.length < 30) { continue; }

    const md = textToMarkdown(text, pdf.name.replace(/\.pdf$/i, ''));
    fs.writeFileSync(mdPath, md, 'utf8');
    log(`  ✓ ${pdf.name} → ${mdName} (${Math.round(md.length/1024)} KB)`);
    converted++;
  }

  log(`\n✅ ${converted} convertidos`);
}

main().catch(err => { log(`❌ ${err.message}`); process.exit(1); });
````

## File: scripts/integrations/setup_google_calendar.js
````javascript
/**
 * setup_google_calendar.js
 * Re-autoriza Google OAuth añadiendo scope de Calendar al token existente.
 * Corre UNA VEZ localmente, luego el token.json queda actualizado.
 * 
 * Uso: node scripts/setup_google_calendar.js
 */
require('dotenv').config();
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const CREDENTIALS_PATH = path.join(__dirname, '..', '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '..', '.google_token.json');

// Scopes combinados: Gmail + Calendar + Calendar Events + Tasks
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

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // forzar para obtener nuevo refresh_token con todos los scopes
  });

  console.log('\n========================================================');
  console.log('PASO 1: Abre este enlace en tu navegador:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('PASO 2: Acepta los permisos (Gmail + Calendar)');
  console.log('PASO 3: Copia la URL completa de redireccion (empieza con http://localhost/?code=...)');
  console.log('========================================================\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const urlStr = await new Promise(resolve => rl.question('Pega la URL completa aqui: ', resolve));
  rl.close();

  const urlObj = new URL(urlStr.trim());
  const code = urlObj.searchParams.get('code');
  if (!code) throw new Error('No se encontro el codigo en la URL. Asegurate de pegar la URL completa.');

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Guardar token actualizado
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: tokens.refresh_token || JSON.parse(fs.readFileSync(TOKEN_PATH,'utf8')).refresh_token,
    scope: SCOPES.join(' '),
  });
  fs.writeFileSync(TOKEN_PATH, payload, 'utf8');

  console.log('\n✅ token.json actualizado con scopes de Gmail + Calendar');
  console.log('Scopes activos:', SCOPES.join('\n  '));

  // Test inmediato: listar proximos 3 eventos
  console.log('\nVerificando Calendar API...');
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 3,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = res.data.items || [];
    if (events.length === 0) {
      console.log('✅ Calendar conectado — sin eventos proximos');
    } else {
      console.log('✅ Calendar conectado. Proximos eventos:');
      events.forEach(e => {
        const start = e.start.dateTime || e.start.date;
        console.log('  -', start, '|', e.summary);
      });
    }
  } catch (e) {
    console.error('❌ Error Calendar:', e.message);
    console.log('Verifica que la Calendar API este habilitada en Google Console.');
  }
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
````

## File: scripts/integrations/telegram_listener.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');
const { getContextForMessage } = require('../../lib/context/context_resolver');

const STATE_FILE = path.join(__dirname, '..', 'data', 'telegram_state.json');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Detectar si un mensaje es de ofertas laborales ─────────
function isJobListing(text) {
  const jobIndicators = [
    /puesto/i, /empresa/i, /salario/i, /stack/i, /requisitos/i, /aplicar/i,
    /ofertas?\s*(laborales|empleo|trabajo)/i, /junior\s*jobs/i,
    /\d{1,2}\.\s*(qa|desarrollador|developer|frontend|backend|fullstack)/i
  ];
  return jobIndicators.some(r => r.test(text)) && text.length > 200;
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return { lastUpdateId: 0 };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

async function apiCall(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  const state = loadState();
  console.log(`🔄 Ultimo update_id procesado: ${state.lastUpdateId}`);

  // Get updates since last processed
  const updatesRes = await fetch(
    `${API}/getUpdates?offset=${state.lastUpdateId + 1}&timeout=5&allowed_updates=["message"]`
  );
  const data = await updatesRes.json();

  if (!data.ok) {
    console.log(`❌ Error getUpdates: ${JSON.stringify(data)}`);
    process.exit(1);
  }

  const updates = data.result || [];
  console.log(`📩 ${updates.length} mensajes nuevos`);

  if (updates.length === 0) {
    console.log('✅ Sin mensajes, guardando estado.');
    saveState(state);
    return;
  }

  for (const update of updates) {
    const msg = update.message;
    if (!msg || !msg.text) continue;
    if (String(msg.from?.id) !== String(CHAT_ID)) {
      console.log(`⛔ Mensaje de usuario no autorizado: ${msg.from?.id}`);
      continue;
    }

    const text = msg.text;
    if (text.startsWith('/')) {
      console.log(`⏭️ Comando ignorado: ${text}`);
      continue;
    }

    console.log(`💬 [${msg.from.first_name}]: ${text.substring(0, 100)}`);

    try {
      const start = Date.now();

      // Detect job listings from WhatsApp forwarding
      if (isJobListing(text)) {
        console.log('📋 Detectadas ofertas laborales. Parseando...');
        const { parseJobMessage, matchJobs, generateReport } = require('../jobs/whatsapp_jobs_parser');
        // We need to expose the private functions - use spawn instead
        const { spawnSync } = require('child_process');
        const parser = spawnSync('node', ['scripts/jobs/whatsapp_jobs_parser.js', text.replace(/\n/g, '\\n')], {
          encoding: 'utf8', timeout: 30000
        });
        
        // Fallback: ask LLM to extract jobs from the message
        const context = getContextForMessage(text);
        const response = await askLLM(
          `${context}\n\nEres un asistente que analiza ofertas laborales. Extrae cada oferta y recomienda cuales aplicar segun el perfil.\nResponde con emojis 🟢/🔴 y da razones breves.`,
          [{ role: 'user', content: text }]
        );
        
        const reply = response?.content || 'No pude analizar las ofertas.';
        await apiCall('sendMessage', { chat_id: CHAT_ID, text: reply, parse_mode: 'HTML' });
        console.log(`📋 Ofertas analizadas (${((Date.now() - start) / 1000).toFixed(1)}s)`);
        continue;
      }

      // MODO PROACTIVO (Morning Briefing): Ya no responde al chat
      // Simplemente actúa como un buzón de entrada.
      const reply = `📥 Nota recibida y guardada para tu próximo Morning Briefing.`;
      console.log(`📥 [Buzón]: Guardado.`);

      await apiCall('sendMessage', {
        chat_id: CHAT_ID,
        text: reply,
        parse_mode: 'HTML'
      });
    } catch (e) {
      console.error(`❌ Error procesando mensaje: ${e.message}`);
      await apiCall('sendMessage', {
        chat_id: CHAT_ID,
        text: '💥 Error al procesar tu mensaje. Intenta de nuevo.'
      });
    }
  }

  // Save last update_id
  state.lastUpdateId = updates[updates.length - 1].update_id;
  saveState(state);
  console.log(`💾 Estado guardado: lastUpdateId=${state.lastUpdateId}`);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
````

## File: scripts/integrations/wheel_saver.js
````javascript
#!/usr/bin/env node
/**
 * wheel_saver.js
 * Integración de WheelSaver con LifeOS.
 *
 * Usos:
 *   node scripts/integrations/wheel_saver.js search <query>     → Buscar repos
 *   node scripts/integrations/wheel_saver.js stats               → Estadísticas
 *   node scripts/integrations/wheel_saver.js top [N]             → Top repos
 *   node scripts/integrations/wheel_saver.js languages           → Lenguajes
 *   node scripts/integrations/wheel_saver.js ask <pregunta>      → Consulta LLM + RAG
 *   node scripts/integrations/wheel_saver.js serve               → Iniciar servidor API
 *   node scripts/integrations/wheel_saver.js health              → Health check
 *   node scripts/integrations/wheel_saver.js install-check       → Verificar instalación
 *
 * Integración con Event Bus:
 *   Emite eventos: wheel_saver.search, wheel_saver.stats,
 *                  wheel_saver.server.start, wheel_saver.server.stop
 *
 * Ejemplos:
 *   node scripts/integrations/wheel_saver.js search "state management react"
 *   node scripts/integrations/wheel_saver.js search "orm python" --language python --limit 10
 *   node scripts/integrations/wheel_saver.js ask "qué librería usas para hacer scraping?"
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });

const path = require('node:path');
const ws = require('../../lib/integrations/wheel_saver_client');

// ── Intenta emitir al Event Bus si está disponible ────────────────
function tryEmit(event, payload) {
  try {
    const busPath = path.join(__dirname, '..', '..', 'lib', 'events', 'event_bus.js');
    if (require.cache[require.resolve(busPath)]) {
      const bus = require(busPath);
      bus.emit(event, {
        type: event,
        payload,
        timestamp: new Date().toISOString(),
        meta: { source: 'wheel_saver', priority: 'normal' },
      });
    }
  } catch {
    // Event Bus no disponible — es normal
  }
}

// ── Comandos ──────────────────────────────────────────────────────

async function cmdSearch(args) {
  if (!args.length) throw new Error('Uso: wheel_saver.js search <query> [--language X] [--limit N] [--min-stars N]');

  const opts = {};
  const queryTerms = [];

  // Parse flags y query correctamente
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--language':
        opts.language = args[++i];
        break;
      case '--limit':
        opts.limit = parseInt(args[++i], 10);
        break;
      case '--min-stars':
        opts.minStars = parseInt(args[++i], 10);
        break;
      default:
        if (!args[i].startsWith('--')) queryTerms.push(args[i]);
    }
  }

  const queryStr = queryTerms.join(' ');
  if (!queryStr) throw new Error('Uso: wheel_saver.js search <query> [--language X] [--limit N] [--min-stars N]');

  console.log(`🔍 Buscando: "${queryStr}" en WheelSaver...\n`);

  const results = await ws.search(queryStr, opts);
  tryEmit('wheel_saver.search', { query: queryStr, results });

  if (Array.isArray(results)) {
    console.table(results.slice(0, 15).map(r => ({
      Stars: r.stars?.toLocaleString() ?? '?',
      Name: r.name ?? '?',
      Lang: r.language ?? '?',
      Description: (r.description ?? '').slice(0, 80),
    })));
    console.log(`\n📊 ${results.length} resultados (mostrando top ${Math.min(results.length, 15)})`);
  } else if (results.raw) {
    console.log(results.raw);
  }
  return results;
}

async function cmdStats() {
  console.log('📊 Estadísticas de WheelSaver...\n');
  const s = await ws.stats();

  tryEmit('wheel_saver.stats', s);

  if (s.total_repos !== undefined) {
    console.log(`  Total repos:  ${(s.total_repos ?? s.total)?.toLocaleString() ?? '?'}`);
    console.log(`  Lenguajes:    ${s.languages ?? '?'}`);
    console.log(`  Max stars:    ${(s.stars_max ?? s.max_stars)?.toLocaleString() ?? '?'}`);
    console.log(`  Avg stars:    ${(s.stars_avg ?? s.avg_stars) ? Math.round(s.stars_avg ?? s.avg_stars).toLocaleString() : '?'}`);
    console.log(`  DB size:      ${s.db_size_mb ? `${s.db_size_mb.toFixed(1)} MB` : '?'}`);
  } else if (s.raw) {
    console.log(s.raw);
  }
  return s;
}

async function cmdTop(args) {
  const limit = parseInt(args[0], 10) || 10;
  const language = args.includes('--language') ? args[args.indexOf('--language') + 1] : null;

  console.log(`🏆 Top ${limit} repos${language ? ` (${language})` : ''}...\n`);

  if (!(await ws.isRunning())) {
    console.log('   Iniciando servidor API...');
    await ws.startServer({ timeout: 20_000 });
  }

  const results = await ws.top(limit, language);
  if (Array.isArray(results) && results.length) {
    console.table(results.map(r => ({
      Stars: r.stars?.toLocaleString() ?? '?',
      Name: r.name ?? '?',
      Lang: r.language ?? '?',
      Description: (r.description ?? '').slice(0, 70),
    })));
    console.log(`\n📊 ${results.length} resultados`);
  } else {
    console.log('   No se pudieron obtener resultados (¿API no disponible?)');
  }
  return results;
}

async function cmdLanguages(args) {
  const limit = parseInt(args[0], 10) || 20;
  console.log(`🌐 Lenguajes en WheelSaver (top ${limit})...\n`);

  if (!(await ws.isRunning())) {
    console.log('   Iniciando servidor API...');
    await ws.startServer({ timeout: 20_000 });
  }

  const results = await ws.languages({ limit });
  if (Array.isArray(results) && results.length) {
    console.table(results.slice(0, limit).map(l => ({
      Lenguaje: l.language ?? '?',
      Repos: (l.repos ?? l.count)?.toLocaleString() ?? '?',
    })));
    console.log(`\n📊 ${results.length} lenguajes`);
  } else {
    console.log('   No se pudieron obtener resultados (¿API no disponible?)');
  }
  return results;
}

async function cmdAsk(args) {
  const question = args.join(' ');
  if (!question) throw new Error('Uso: wheel_saver.js ask <pregunta>');

  console.log(`🤔 Consultando WheelSaver: "${question}"\n`);
  console.log('   (esto puede tomar hasta 60s — consulta multi-LLM con RAG)...\n');

  const result = await ws.ask(question);

  tryEmit('wheel_saver.ask', { question, result });

  if (result.answer) {
    console.log(`📝 Respuesta:\n${result.answer}`);
    if (result.sources?.length) {
      console.log(`\n📚 Fuentes consultadas: ${result.sources.length}`);
    }
  } else if (result.raw) {
    console.log(result.raw);
  } else {
    console.log(result);
  }
  return result;
}

async function cmdServe() {
  console.log('🚀 Iniciando servidor WheelSaver API...\n');
  const ok = await ws.startServer({ timeout: 20_000 });
  if (ok) {
    tryEmit('wheel_saver.server.start', { port: ws.DEFAULT_API_PORT });
    console.log(`✅ Servidor WheelSaver corriendo en http://127.0.0.1:${ws.DEFAULT_API_PORT}`);
    console.log('   Presiona Ctrl+C para detenerlo.\n');

    // Mantener proceso vivo — esperar señal de término
    await new Promise(() => {});
  } else {
    console.error('❌ No se pudo iniciar el servidor WheelSaver');
    process.exit(1);
  }
}

async function cmdHealth() {
  const running = await ws.isRunning();
  const inst = ws.checkInstallation();

  console.log('🩺 WheelSaver Health Check\n');
  console.log(`  Instalación:     ${inst.ok ? '✅ Completa' : '❌ Incompleta'}`);
  if (!inst.ok) {
    if (!inst.dir) console.log('     → Falta directorio wheel-saver/');
    if (!inst.venv) console.log('     → Falta entorno virtual (corre: pip install -r requirements.txt)');
    if (!inst.cli) console.log('     → Falta cli.py');
    if (!inst.db) console.log('     → Falta base de datos (corre: python cli.py scrape)');
  }
  console.log(`  API Server:      ${running ? '✅ Activo' : '⏸️  Detenido'}`);
  if (running) {
    try {
      const s = await ws.stats();
      console.log(`  DB Repos:        ${s.total_repos?.toLocaleString() ?? '?'}`);
      console.log(`  DB Lenguajes:    ${s.total_languages ?? '?'}`);
    } catch {}
  }
  return { installation: inst, serverRunning: running };
}

async function cmdInstallCheck() {
  const inst = ws.checkInstallation();
  console.log('🔧 WheelSaver Installation Check\n');
  for (const [key, ok] of Object.entries(inst)) {
    if (key === 'ok') continue;
    console.log(`  ${key}: ${ok ? '✅' : '❌'}`);
  }
  console.log(`\n  Global: ${inst.ok ? '✅ Listo para usar' : '❌ Revisa los componentes faltantes'}`);
  return inst;
}

// ── CLI Router ────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2]?.toLowerCase();
  const args = process.argv.slice(3);

  if (!cmd || ['-h', '--help'].includes(cmd)) {
    console.log(`
WheelSaver — Integración con LifeOS

USO:
  node scripts/integrations/wheel_saver.js <comando> [args]

COMANDOS:
  search <query>     Buscar repositorios en la base de datos local
    --language X     Filtrar por lenguaje
    --limit N        Máx resultados (default: 25)
    --min-stars N    Estrellas mínimas

  stats              Estadísticas de la base de datos
  top [N]            Top N repositorios por estrellas
    --language X     Filtrar por lenguaje

  languages [N]      Distribución de lenguajes
  ask <pregunta>     Consulta RAG con IA sobre qué librería usar
  serve              Inicia el servidor API en segundo plano
  health             Diagnóstico del estado del servicio
  install-check      Verificar que los componentes están instalados

EJEMPLOS:
  node scripts/integrations/wheel_saver.js search "orm python django"
  node scripts/integrations/wheel_saver.js top 20 --language rust
  node scripts/integrations/wheel_saver.js ask "qué librería para hacer scraping en Python?"
  node scripts/integrations/wheel_saver.js health
`);
    return;
  }

  const commands = {
    search: cmdSearch,
    stats: cmdStats,
    top: cmdTop,
    languages: cmdLanguages,
    ask: cmdAsk,
    serve: cmdServe,
    health: cmdHealth,
    'install-check': cmdInstallCheck,
  };

  if (!commands[cmd]) {
    console.error(`❌ Comando desconocido: "${cmd}". Usa --help para ver los disponibles.`);
    process.exit(1);
  }

  await commands[cmd](args);
}

main().catch((err) => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
````

## File: scripts/jobs/metrics/uhabits_engine.js
````javascript
/**
 * scripts/jobs/metrics/uhabits_engine.js
 * 
 * Motor para exportar métricas de LifeOS (Horas de código, CESDE, etc)
 * a un formato CSV compatible con la app Android Loop Habit Tracker (uhabits).
 */
const fs = require('node:fs');
const path = require('node:path');

const BACKUP_DIR = path.join(__dirname, '..', '..', '..', 'data', 'backups');
const CSV_PATH = path.join(BACKUP_DIR, 'uhabits_export.csv');

/**
 * Formato esperado por Loop Habits CSV:
 * Primera columna: Nombre del Hábito
 * Siguientes columnas: Fechas en formato YYYY-MM-DD
 * Valores: 0 (no hecho), 1 o 2 (hecho) o un valor numérico (para hábitos medibles).
 * 
 * Ejemplo de CSV (Loop Habits transpone la matriz, cada fila es un hábito, cada col es una fecha):
 * Habit Name,2026-07-06,2026-07-07,2026-07-08
 * Coding > 2h,1,0,1
 * Gym,0,1,1
 */

// Simulación de lectura de Ledger/Métricas de LifeOS
const simulatedLifeOSMetrics = {
  '2026-07-06': { coding: 1, gym: 0, cesde: 1 },
  '2026-07-07': { coding: 0, gym: 1, cesde: 1 },
  '2026-07-08': { coding: 1, gym: 1, cesde: 0 }
};

const HABIT_MAPPINGS = {
  coding: 'Programar > 2h',
  gym: 'Ejercicio / Gym',
  cesde: 'Asistencia CESDE'
};

async function exportToUhabitsCSV() {
  console.log('🔄 Generando CSV compatible con Loop Habit Tracker...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const dates = Object.keys(simulatedLifeOSMetrics).sort();
  let csvContent = 'Habit Name,' + dates.join(',') + '\n';

  const habitKeys = Object.keys(HABIT_MAPPINGS);

  for (const key of habitKeys) {
    const habitName = HABIT_MAPPINGS[key];
    const row = [habitName];
    for (const date of dates) {
      row.push(simulatedLifeOSMetrics[date][key] || 0);
    }
    csvContent += row.join(',') + '\n';
  }

  fs.writeFileSync(CSV_PATH, csvContent, 'utf8');
  console.log('✅ Archivo exportado exitosamente a:', CSV_PATH);
  console.log('📱 Ya puedes enviar este archivo a tu celular e importarlo en Loop Habit Tracker.');
}

if (require.main === module) {
  exportToUhabitsCSV().catch(e => console.error(e));
}

module.exports = {
  exportToUhabitsCSV
};
````

## File: scripts/jobs/build_cv.js
````javascript
/**
 * scripts/jobs/build_cv.js
 *
 * Generador de PDF de Hoja de Vida en formato Harvard.
 * Usa Playwright para renderizar el template HTML y exportarlo como PDF.
 *
 * Uso: node scripts/jobs/build_cv.js
 */

const path = require('path');
const { chromium } = require('playwright');

const TEMPLATE_PATH = path.resolve(__dirname, '../../data/jobs/cv_harvard_template.html');
const OUTPUT_PATH   = path.resolve(__dirname, '../../data/jobs/CV_Jeiser_Gutierrez_QA_Automation.pdf');

async function buildCV() {
  console.log('[CV Builder] Iniciando generación de PDF...');
  
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  // Cargar el template HTML local
  await page.goto(`file://${TEMPLATE_PATH}`, { waitUntil: 'load' });

  // Dar tiempo al CSS para renderizar
  await page.waitForTimeout(500);

  // Exportar como PDF con márgenes 0 (el HTML ya maneja el padding)
  await page.pdf({
    path:              OUTPUT_PATH,
    format:            'Letter',
    printBackground:   true,
    margin:            { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
  });

  await browser.close();

  console.log(`[CV Builder] ✅ PDF generado exitosamente:`);
  console.log(`   → ${OUTPUT_PATH}`);
  console.log(`[CV Builder] Súbelo a Computrabajo como tu CV predeterminado.`);
}

buildCV().catch(err => {
  console.error('[CV Builder] ❌ Error:', err.message);
  process.exit(1);
});
````

## File: scripts/jobs/buscar_medellin.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');

const SEARCHES = [
  'auxiliar-sistemas',
  'soporte-tecnico-software',
  'mesa-de-ayuda',
  'helpdesk',
  'soporte-nivel-1',
  'qa-junior',
  'tester-manual',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();
  const results = [];

  for (const q of SEARCHES) {
    const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate&l=medellin`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1800);

      const offers = await page.evaluate(() => {
        const cards = document.querySelectorAll('article, [class*="offerItem"]');
        const out = [];
        cards.forEach(card => {
          const a = card.querySelector('h2 a, h3 a, a[title]');
          if (!a) return;
          const titulo  = (a.textContent || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
          const empresa = (card.querySelector('[class*="company"], p[title]')?.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 45);
          const lugar   = (card.querySelector('[class*="city"], [class*="location"]')?.textContent || '').replace(/\s+/g, ' ').trim();
          const fecha   = (card.querySelector('[class*="date"], time, [class*="pubDate"]')?.textContent || '').replace(/\s+/g, ' ').trim();
          if (titulo && a.href) out.push({ titulo, empresa, lugar, fecha, url: a.href });
        });
        return out;
      });

      console.log(`[${q}] ${offers.length} ofertas`);
      results.push(...offers);
    } catch (e) {
      console.log(`[${q}] Error: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(800);
  }

  await browser.close();

  // Deduplicar
  const seen = new Set();
  const unique = results.filter(o => {
    if (seen.has(o.url)) return false;
    seen.add(o.url);
    return true;
  });

  console.log('\n════════════════════════════════════════════════════');
  console.log(`  OFERTAS MEDELLÍN — Auxiliar Sistemas / Soporte TI`);
  console.log('════════════════════════════════════════════════════\n');

  unique.slice(0, 12).forEach((o, i) => {
    console.log(`${String(i+1).padStart(2)}. ${o.titulo}`);
    console.log(`    🏢 ${o.empresa || 'N/A'}  |  📍 ${o.lugar || 'N/A'}  |  📅 ${o.fecha || 'N/A'}`);
    console.log(`    🔗 ${o.url}\n`);
  });

  console.log(`Total encontradas: ${unique.length}`);
})().catch(e => console.error('Fatal:', e.message));
````

## File: scripts/jobs/login_ct.js
````javascript
/**
 * scripts/jobs/login_ct.js
 *
 * Login a Computrabajo y guarda el storage state (cookies + localStorage)
 * para reutilizar sesión en scraper y apply sin tener que loguear cada vez.
 *
 * Uso: node scripts/jobs/login_ct.js
 * Genera: data/state/computrabajo_state.json
 *
 * El estado se renueva solo cuando expira (detecta 401/redirect a login).
 */

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const STATE_PATH = path.resolve(__dirname, '..', '..', 'data', 'state', 'computrabajo_state.json');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL;
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

async function login() {
  if (!CT_EMAIL || !CT_PASS) {
    throw new Error('Faltan COMPUTRABAJO_EMAIL o COMPUTRABAJO_PASS en .env');
  }

  console.log('[login_ct] Iniciando sesión en Computrabajo...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await context.newPage();

  try {
    // Ir a login
    await page.goto('https://co.computrabajo.com/Login/IniciarSesion.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Esperar a que cargue la página inicial
    await page.waitForTimeout(2000);

    // Ejecutar login centralizado
    await robustLogin(page, CT_EMAIL, CT_PASS);

    // Verificar si el login fue exitoso
    const currentUrl = page.url();
    if (currentUrl.includes('Login') || currentUrl.includes('IniciarSesion')) {
      console.log('[login_ct] ⚠️ Parece que el login falló. URL actual:', currentUrl);
      // Tomar screenshot para debug
      await page.screenshot({ path: path.join(__dirname, '..', '..', 'data', 'cache', 'login_failed.png') });
      console.log('[login_ct] Screenshot guardado en data/cache/login_failed.png');
      throw new Error('Login failed');
    }

    // Guardar storage state
    const state = await context.storageState();
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log(`[login_ct] ✅ Sesión guardada en ${STATE_PATH}`);

    // Verificar que funciona
    await page.goto('https://co.computrabajo.com/mis-postulaciones', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('[login_ct] ✅ Postulaciones accesibles, sesión activa');

  } catch (e) {
    console.error('[login_ct] ❌ Error:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

login();
````

## File: scripts/jobs/pico_placa_scraper.js
````javascript
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'pico_placa.json');

// Pico y placa del primer semestre 2026 (vigente hasta Julio 31)
const DEFAULT_ROTATION = {
  Lunes: ["1", "7"],
  Martes: ["0", "3"],
  Miercoles: ["4", "6"],
  Jueves: ["5", "9"],
  Viernes: ["2", "8"]
};

async function checkPicoYPlaca() {
  console.log('🚗 Iniciando monitor de Pico y Placa (Playwright)...');
  
  // Cargar estado anterior
  let currentRotation = DEFAULT_ROTATION;
  if (fs.existsSync(STATE_FILE)) {
    currentRotation = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } else {
    // Si no existe, lo creamos con el estado base
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentRotation, null, 2));
  }

  // Scraping de un sitio confiable (Ej: portal de movilidad o sitio agregador)
  // Para ser resilientes, comprobaremos Autolab o el portal de Medellín
  // Como los scrapers de entidades públicas cambian mucho, aquí hacemos
  // un check de seguridad.
  const browser = await chromium.launch({ headless: true });
  const page = awa