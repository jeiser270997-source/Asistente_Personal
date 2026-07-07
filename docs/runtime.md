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
