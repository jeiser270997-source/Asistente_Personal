# Decisiones arquitectonicas

## Runtime sobre SQLite (no Postgres/Redis)

**Contexto:** Proyecto unipersonal, datos < 1GB, sin necesidad de concurrencia real.
**Decisión:** SQLite con WAL. Suficiente para el volumen actual. Migrar a Postgres solo si aparecen multiples usuarios o necesidad de acceso concurrente real.

## PM2 local como runtime (reemplazo de GitHub Actions)

**Contexto original:** El sistema usaba GitHub Actions con cron + cache (13 workflows).
**Problema:** Cache efímero (7 días), latencia de restore, dependencia de cloud para runtime.
**Decisión actual (Jul 2026):** PM2 en máquina local (Windows/Linux) con `ecosystem.config.js`.
- Procesos daemon (Telegram) con autorestart.
- Procesos cron (scrapers, healthcheck, etc.) con `cron_restart`.
- Sin dependencia de GitHub ni Litestream.
- Backups a Google Drive via script dedicado.
- Si se necesita acceso remoto: Tailscale + SSH.

## Stores sin ORM

**Contexto:** Necesitamos abstraer el backend sin añadir complejidad.
**Decisión:** Stores planos en CommonJS. Cada store encapsula SQL. Sin Sequelize/Prisma/Knex. La API de stores es la unica interfaz entre los scripts y la DB.

## Decision layer centralizado (no IA dispersa)

**Contexto:** Varios modulos necesitan LLM para diferentes tareas.
**Decisión:** Un unico punto de entrada (`lib/ai/decision.js`) con prompts estructurados y fallbacks sin LLM. Todo el uso de IA pasa por ahi.

## Event Bus en proceso (no cola externa)

**Contexto:** El sistema es monotask (PM2 local, una máquina).
**Decisión:** Pub/sub en memoria con persistencia en LedgerStore. Con PM2, los procesos comparten SQLite (WAL mode) para persistencia entre reinicios. Si aparecen workers separados o microservicios, migrar a Redis/Cola.

## Fallbacks obligatorios sin LLM

**Contexto:** DeepSeek tiene horario PICO (22h-5am Colombia) y puede fallar.
**Decisión:** Todo componente que use LLM debe tener un fallback deterministico. El sistema funciona completo sin IA.

## Skills como sistema formal (no scripts sueltos)

**Contexto:** Nuevas capacidades se agregan constantemente.
**Decisión:** Skills con trigger, input, run(), output. Registradas en Skill Engine. Event-driven, no llamadas directas.

## Rule Engine antes que heuristicas (email classifier ordering)

**Contexto:** `email_processor.js` clasificaba correos llamando `isImportant()` (heuristicas JUNK_KEYWORDS) PRIMERO, y solo después el `ruleEngine.matchAll()` (reglas determinísticas basadas en remitente/dominio). Esto causaba que correos legítimos de dominios conocidos (SENA, Google Security) se clasificaran como Basura si el `from` contenía palabras como `noreply` o `senavirtual`.
**Decisión:** Invertir el orden: rule_engine (reglas determinísticas de alta precisión) PRIMERO, `isImportant()` SOLO si ninguna regla matchea. Principio: reglas concretas > heuristicas.
- Si rule_engine matchea → se ejecuta la acción y se salta `isImportant()`
- Si no matchea → `isImportant()` clasifica como importante o basura
- Adjuntos: extraídos a función `processAttachments()` compartida entre todos los handlers
- `noreply`/`no-reply` eliminados de JUNK_KEYWORDS por causar falsos negativos

## Job Hunter semi-auto por defecto (2026-07-20)

**Contexto:** `job_loop.js` postulaba en LIVE si no se pasaba `--dry-run`. PM2 lo lanzaba sin flags → postulaciones no supervisadas. `computrabajo_apply.js` no tenía `main` (proceso PM2 no-op). La doc prometía semi-auto y el código no lo cumplía.
**Decisión:**
- Default = SEMI-AUTO (`dryRun=true`). LIVE solo con `--auto` explícito.
- Si coexisten `--auto` y `--dry-run`, gana dry-run (fail-safe).
- PM2 (`ecosystem.config.js`) pasa `args: "--dry-run"` a `job-loop` y `computrabajo-apply`.
- Nunca poner `--auto` en ecosystem sin aprobación humana.
- Tests de política en `tests/job_apply_policy.test.js`.

## Email LLM always sensitive (FIX-009, 2026-07-20)

**Contexto:** Heurística de keywords dejaba pasar correos con PII genérica (nómina, cédula, CESDE) a proveedores cloud.
**Decisión:** Single-tenant → `summarizeEmails` siempre llama `askLLM(..., sensitive=true)`. Costo de proxy local irrelevante frente a filtrar PII personal.

## Filtro anti-ciclo de auditoría + ops con agentes (2026-07-20)

**Contexto:** Ciclo vicioso de auditorías (R1–R6) sin síntoma nuevo; riesgo de sobre-ingeniería y churn.
**Decisión:** Principio 8 en AGENTS.md — si no está roto y cumple función, solo mantenimiento. Nueva ronda solo con fallo real, regresión de tests o requisito explícito de Jeiser. Operación con DeepSeek V4 Flash + tools documentada en `docs/AGENT_OPS.md`: viable con frenos (tests, semi-auto, scope mínimo).
