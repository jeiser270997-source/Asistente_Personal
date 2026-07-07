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
