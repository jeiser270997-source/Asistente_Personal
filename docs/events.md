# Event Catalog

Catálogo de todos los eventos del sistema. Cada evento tiene: emisor, payload, consumidores.

## Eventos del sistema

| Evento | Emisor | Payload | Consumidores |
|--------|--------|---------|--------------|
| `email.processed` | email_processor | `{ from, subject, action }` | Event Registry → Ledger, Skill: job_apply |
| `email.important` | email_processor | `{ from, subject, summary }` | Event Registry → Telegram, Skill: context_sync |
| `case.created` | context_engine, skills | `{ id, tipo, titulo, estado, prioridad }` | Event Registry → Ledger + Telegram (P0) |
| `case.updated` | context_engine | `{ id, tipo, estado }` | Event Registry → Ledger |
| `job.applied` | skills, email_processor | `{ empresa, cargo, plataforma, score }` | Event Registry → Ledger |
| `job.rejection` | skills, email_processor | `{ empresa, cargo }` | Event Registry → Ledger + Telegram |
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
