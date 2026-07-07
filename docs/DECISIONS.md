# Decisiones arquitectonicas

## Runtime sobre SQLite (no Postgres/Redis)

**Contexto:** Proyecto unipersonal, datos < 1GB, sin necesidad de concurrencia real.
**Decisión:** SQLite con WAL. Suficiente para el volumen actual. Migrar a Postgres solo si aparecen multiples usuarios o necesidad de acceso concurrente real.

## GitHub Actions como runtime (no servidor propio)

**Contexto:** El sistema necesita ejecutarse periodicamente pero no requiere estar always-on.
**Decisión:** GitHub Actions con cron + cache para persistencia. $0/mes. Si el loop de 5 min requiere respuesta en tiempo real, migrar a VPS.

## Stores sin ORM

**Contexto:** Necesitamos abstraer el backend sin añadir complejidad.
**Decisión:** Stores planos en CommonJS. Cada store encapsula SQL. Sin Sequelize/Prisma/Knex. La API de stores es la unica interfaz entre los scripts y la DB.

## Decision layer centralizado (no IA dispersa)

**Contexto:** Varios modulos necesitan LLM para diferentes tareas.
**Decisión:** Un unico punto de entrada (`lib/ai/decision.js`) con prompts estructurados y fallbacks sin LLM. Todo el uso de IA pasa por ahi.

## Event Bus en proceso (no cola externa)

**Contexto:** El sistema es monotask (un loop, una maquina).
**Decisión:** Pub/sub en memoria con persistencia en LedgerStore. Si aparecen workers separados o microservicios, migrar a Redis/Cola.

## Fallbacks obligatorios sin LLM

**Contexto:** DeepSeek tiene horario PICO (22h-5am Colombia) y puede fallar.
**Decisión:** Todo componente que use LLM debe tener un fallback deterministico. El sistema funciona completo sin IA.

## Skills como sistema formal (no scripts sueltos)

**Contexto:** Nuevas capacidades se agregan constantemente.
**Decisión:** Skills con trigger, input, run(), output. Registradas en Skill Engine. Event-driven, no llamadas directas.
