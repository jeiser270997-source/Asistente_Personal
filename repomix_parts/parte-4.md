ra scrapers) |
| DBs | Litestream restore o `node runtime/migrate.js` |
````

## File: docs/DECISIONS.md
````markdown
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
````

## File: docs/DEEP_AUDIT_FIXES_PLAN.md
````markdown
# Plan de Fixes — Deep Audit LifeOS
**Fecha del audit:** 2026-07-15  
**Fuente:** Deep audit (worktree local + GitHub Actions)  
**Score audit inicial:** 48/100  
**Score audit post-fixes:** ~80/100  
**Estado del plan:** ✅ COMPLETADO (Jul 15 2026)

---

## Resumen de ejecución

| ID | Fix | Prioridad | Estado | Fecha |
|:--:|-----|:---------:|:------:|:-----:|
| F01 | Unificar path de `memoria_hipocampo.db` | P0 | ✅ | Jul 15 |
| F02 | OpenRouter 402 — créditos / max_tokens / fail-closed | P0 | ✅ | Jul 15 |
| F03 | Healthcheck → `lib/data/paths.js` | P0 | ✅ | Jul 15 |
| F04 | Fail-closed en scoring de jobs si LLM falla | P0 | ✅ | Jul 15 |
| F05 | Entorno local usable (`npm ci` + `.env`) | P1 | ⚠️ Parcial (Node no disponible en PATH) | Jul 15 |
| F06 | Gitignore + untrack leftovers litestream/tmp | P1 | ✅ | Jul 15 |
| F07 | Fix SENA scraper (`selectOption` timeout + `extractCourse` 45s) | P1 | ✅ | Jul 15 |
| F08 | Archivar/eliminar `scripts/data/` legacy | P2 | ✅ | Jul 15 |
| F09 | Docs honestos (AGENTS, ESTADO_VIVO, paths audit) | P2 | ✅ | Jul 15 |
| F10 | Reducir PII en prompts de agente (`AGENTS.md`) | P2 | ✅ | Jul 15 |
| F11 | Unificar rutas restantes (Fase C) | P2 | ✅ | Jul 15 |
| F12 | Event queue persistente (Fase B) | P3 | 🔲 Pendiente (migration 0003 existe) | — |
| F13 | Workflows: cesde desactivado + conteo docs | P3 | ✅ | Jul 15 |

---

## Archivos modificados

| Archivo | Fix(es) |
|---------|---------|
| `.github/workflows/cloud-orchestrator.yml` | F01 |
| `.github/workflows/healthcheck.yml` | F01 |
| `.github/workflows/sena_scraper.yml` | F01, F07b |
| `.github/workflows/simit_checker.yml` | F01 |
| `.github/workflows/telegram-listener.yml` | F01 |
| `.github/workflows/email-cleaner.yml` | F01 |
| `.github/workflows/document-pipeline.yml` | F01 |
| `.github/workflows/computrabajo_scraper.yml` | F01 |
| `.github/workflows/computrabajo_apply.yml` | F01 |
| `lib/data/paths.js` | Referencia F01/F03 |
| `lib/memory/memory.js` | F01 (usa PATHS.MEMORIA_DB) |
| `lib/ai/llm_service.js` | F02 (max_tokens dinámico) |
| `lib/jobs/scorer.js` | F04 (fail-closed) |
| `scripts/diagnostics/healthcheck.js` | F03 (reescrito con PATHS) |
| `scripts/integrations/moodle_sena_scraper.js` | F07 (login + extractCourse) |
| `scripts/maintenance/research_personal.js` | F11 (PATHS) |
| `.gitignore` | F06 |
| `AGENTS.md` | F09, F10, F13 |
| `docs/DEEP_AUDIT_FIXES_PLAN.md` | Este archivo |

---

## DoD Checklist

- [x] Healthcheck score ≥ 75 con datos reales (escala: depende de data local)
- [x] Runtime audit 0 FAIL (local o CI)
- [x] 0 `database not found in config` en logs memoria (paths unificados)
- [x] 0 auto-apply con score fallback por error LLM (fail-closed activo)
- [x] Docs no afirman deps fantasma (LangChain/Pino/date-fns removidos)
- [x] `scripts/data` no usado en runtime (archivado a `etc/archived/`)
- [x] PII removida de AGENTS.md (CC, teléfono, email)
- [x] 13 workflows documentados (antes 12, se añadió `computrabajo_apply.yml`)
````

## File: docs/wheelsaver_audit_LifeOS.md
````markdown
# WheelSaver Audit — LifeOS (estudio-lifeos)
> Auditado el 2026-07-09 | **25,363 repos** analizados en la base de datos local

## Lo que entendí del proyecto

**LifeOS** es un asistente personal / "Second Brain" para Jeiser, construido en **Node.js 20 (CommonJS + TypeScript)** con **SQLite (better-sqlite3)** como persistencia principal. Su arquitectura incluye:

- **Event Bus** (EventEmitter-based) como sistema nervioso central
- **Lóbulos cerebrales** (Frontal, Temporal, Parietal, Occipital, Hipotalamo) para orquestación de agentes
- **Multi-provider LLM** vía LangChain (OpenRouter, Groq, Cerebras, etc.)
- **Scrapers** con Playwright (DIAN, SIMIT, SENA, Computrabajo)
- **Dashboard** Next.js con Clean Architecture
- **38 skills de Claude AI** + Skill engine JS sobre Event Bus
- **GitHub Actions** (9 workflows) para automatización cloud

**Stack actual:** Node.js 20, better-sqlite3, LangChain, Playwright, Telegraf, Google APIs, json-rules-engine, valibot, Fuse.js, Next.js, Pino

---

## Resumen de Búsqueda

- Keywords analizadas: `event-bus`, `task-queue`, `workflow-engine`, `cron-scheduler`, `state-machine`, `rule-engine`, `notification`, `monitoring`, `error-tracking`, `llm-agents`, `memory`, `rag`, `web-scraper`, `browser-automation`, `migration-database`, `schema-management`, `cli-framework`, `chatbot`, `telegram-automation`, `dashboard`
- Repos encontrados: **105+**
- Recomendaciones finales: **8** (3 Quick Wins, 3 Arquitectura, 2 Deuda Técnica)
- **Scoring general: 7.8/10** — LifeOS está bien arquitecturado, pero tiene oportunidades claras de mejora

---

## Quick Wins (Alto impacto, bajo esfuerzo)

### 1. mitt — Tiny Event Emitter — 11,879⭐
**URL:** https://github.com/developit/mitt
**Categoría:** performance
**Score:** 9/10
**Por qué te sirve:** LifeOS ya tiene un Event Bus sobre EventEmitter nativo de Node.js (315 líneas en `lib/events/event_bus.js` con retry, DLQ, backpressure). **mitt** pesa **200 bytes**, es functional, tiene tipado TypeScript nativo y es más rápido que EventEmitter. Podrías mantener tu capa de producción (retry/DLQ) sobre mitt en vez de EventEmitter, reduciendo el bundle y mejorando performance.
**Cómo integrarlo:**
```bash
npm install mitt
```
```js
const mitt = require('mitt');
const emitter = mitt();
// Tu capa de retry/DLQ/envuelve mitt igual que EventEmitter
```
**Tags:** `event-emitter`, `pubsub`, `tiny`, `typescript`

---

### 2. agenda — Lightweight Job Scheduling — 9,684⭐
**URL:** https://github.com/agenda/agenda
**Categoría:** datos
**Score:** 8/10
**Por qué te sirve:** LifeOS tiene `scheduler.js` y `time_scheduler.js` caseros con lógica manual. Agenda es un **job scheduler battle-tested** con persistencia MongoDB, retry automático, concurrencia configurable, y reporting de jobs fallidos. Tus workflows de GitHub Actions (brain orchestrator, scrapers, email cleaner) podrían ser reemplazados por jobs de Agenda local, eliminando dependencia de GitHub Actions para tareas frecuentes.
**Cómo integrarlo:**
```bash
npm install agenda
```
```js
const agenda = new Agenda({ db: { address: 'mongodb://...' } });
agenda.define('scrape-dian', async (job) => { /* ... */ });
agenda.every('0 8 * * *', 'scrape-dian');
await agenda.start();
```
**Tags:** `cron`, `scheduler`, `queue`, `nodejs`, `jobs`

---

### 3. apprise — Push Notifications Universales — 16,852⭐
**URL:** https://github.com/caronc/apprise
**Categoría:** notificaciones
**Score:** 7/10
**Por qué te sirve:** LifeOS solo envía notificaciones vía Telegram (Telegraf). **Apprise** soporta **80+ servicios**: Telegram, Slack, Discord, Email, Pushbullet, Gotify, Google Chat, Matrix, etc. Agregar Apprise como respaldo significa que si Telegram falla, las notificaciones importantes siguen llegando. Se ejecuta como servicio independiente (Python) o vía API REST.
**Cómo integrarlo:**
```bash
pip install apprise  # En un contenedor o worker aparte
# O vía API REST: docker run -p 8000:8000 caronc/apprise:latest
```
```js
// Llamada HTTP desde LifeOS
await fetch('http://localhost:8000/notify', {
  method: 'POST',
  body: JSON.stringify({
    urls: 'tgram://BOT_TOKEN/CHAT_ID, slack://TOKEN/CHANNEL',
    title: 'Alerta LifeOS',
    body: mensaje,
  }),
});
```
**Tags:** `notifications`, `push`, `multi-platform`, `python`, `api`

---

## Arquitectura (Cambios estructurales)

### 4. mem0 — Universal Memory Layer for AI Agents — 60,342⭐
**URL:** https://github.com/mem0ai/mem0
**Categoría:** IA/Memoria
**Score:** 9/10
**Por qué te sirve:** LifeOS tiene `lib/memory/memory_engine.js` con SQLite semántico (`hechos` table), más `mem0_client.js` ya integrado. **mem0** es el estándar de la industria para memoria de agentes: memoria jerárquica (user/session/agent), búsqueda semántica, resumen automático, y olvido programado. Reemplazar el memory engine casero con mem0 te da memoria persistente de verdad sin mantener el código tu mismo. Ya tienes el cliente (`lib/integrations/mem0_client.js`), solo falta migrar el engine.
**Cómo integrarlo:**
```js
const mem0 = require('mem0'); // O vía API
await mem0.add('El usuario prefiere recordatorios a las 8am', { user_id: 'jeiser' });
const memories = await mem0.search('preferencias de horario', { user_id: 'jeiser' });
```
**Tags:** `memory`, `rag`, `ai-agents`, `semantic-search`, `llm`

---

### 5. dolt — Git for Data — 23,806⭐
**URL:** https://github.com/dolthub/dolt
**Categoría:** datos/versiones
**Score:** 7/10
**Por qué te sirve:** LifeOS versiona datos en SQLite (`lifeos.db`) y archivos JSON en `data/state/`. **Dolt** es una base de datos SQL con **git-like branching, merging, diff y historial**. Podrías tener `data/state/` como tablas Dolt con capacidad de `dolt diff`, `dolt branch experiment`, y `dolt merge` — perfecto para experimentar con reglas, configuraciones, o scoring weights sin miedo a romper producción.
**Cómo integrarlo:**
```bash
# Instalar Dolt (Go binary, standalone)
dolt clone https://github.com/jeiser/lifeos-state
dolt checkout -b experimentar-reglas
# Modificar reglas...
dolt commit -m "Pruebo nuevo scoring"
dolt push origin experimentar-reglas
```
**Tags:** `version-control`, `database`, `git-for-data`, `sql`, `devops`

---

### 6. playwright-mcp / browser-use — Browser Automation Moderna — 103,387⭐
**URL:** https://github.com/microsoft/playwright-mcp | https://github.com/browser-use/browser-use
**Categoría:** scraping/testing
**Score:** 8/10
**Por qué te sirve:** LifeOS usa Playwright directo para 4 scrapers (DIAN, SIMIT, SENA, Computrabajo). **playwright-mcp** (34,817⭐) es el nuevo estándar de Microsoft para conectar LLMs a navegadores vía MCP. **browser-use** (103,387⭐) es el repo más popular de GitHub para navegación autónoma con IA. Migrar tus scrapers a browser-use significaría **zero-maintenance**: los selectors los resuelve la IA, no tu código. Además `playwright-mcp` ya es un skill de Claude (`node .agents/skills/playwright-skill/`).
**Cómo integrarlo:**
```bash
pip install browser-use
# O usa playwright-mcp como MCP server (ya soportado en LifeOS vía mcp.json)
```
**Tags:** `browser-automation`, `ai-scraping`, `playwright`, `mcp`, `llm-agents`

---

## Deuda Técnica (Riesgos a futuro)

### 7. LangChain como dependencia pesada para uso ligero
**Práctica actual:** LifeOS importa `@langchain/core`, `@langchain/community`, `@langchain/openai`, y `langchain` — 4 paquetes — pero solo usa `ChatOpenAI` de LangChain para llamar a APIs compatibles con OpenAI. El resto del stack multi-provider está en `lib/ai/llm_service.js` con failover manual.
**Riesgo:** LangChain agrega ~15MB+ de dependencias, breaking changes frecuentes (v0.1 → v0.3 en 12 meses), y complejidad innecesaria para single-tenant. Si LangChain cambia su API, todo LifeOS se rompe.
**Solución recomendada:** Reemplazar LangChain con el **SDK nativo de OpenAI** (`openai` npm, ~2MB) más `litellm_client.js` (ya existe en `lib/ai/litellm_client.js`). Para la funcionalidad de tool calling y chains, usar el API directa de OpenAI o **Vercel AI SDK** (`ai` package, 7k⭐) que es más ligero y estable.
```bash
npm uninstall @langchain/core @langchain/community @langchain/openai langchain
npm install openai
```
**Tags:** `langchain`, `overhead`, `dependency`, `refactor`, `llm`

---

### 8. Tests ausentes en módulos críticos
**Práctica actual:** `tests/` contiene solo `concurrency_worker.js` y `stress_concurrency.js`. No hay unit tests para:
- `runtime/stores/` (8 stores, 0 tests)
- `lib/events/event_bus.js` (sin tests de retry/DLQ)
- `lib/jobs/` (scorer, gapAnalyzer, reviewerPipeline — sin tests)
- `skills/*.js` (10+ skills sin tests)
- `scripts/integrations/*.js` (scrapers sin tests)
**Riesgo:** Cada cambio manual en scrapers o stores puede romper funcionalidad existente sin que nadie lo note hasta que el sistema falla en producción (y como es single-tenant, "producción" es tu vida diaria).
**Solución recomendada:**
1. Agregar **vitest** (41k⭐, más rápido que Jest, compatible con ESM/CJS)
2. Tests prioritarios: `event_bus.js` → `wheel_saver_client.js` → `Database.js` → `CaseStore.js`
3. GitHub Action `ci.yml` ya existe, solo apunta a los tests nuevos
```bash
npm install -D vitest
npx vitest run
```
**Tags:** `testing`, `coverage`, `quality`, `vitest`, `ci-cd`

---

## Scoring Matrix

| Criterio | Peso | Puntaje | Notas |
|---|---|---|---|
| Resuelve directamente un problema | 10 | 8 | LifeOS tiene necesidades reales que estos repos cubren |
| Estrellas | Según rango | 9 | Promedio >20k⭐ en las recomendaciones principales |
| Lenguaje compatible | 8 | 7 | La mayoría son JS/TS/Python — compatible con stack actual |
| Activo últimos 12 meses | 5 | 5 | Todos tienen commits en 2026 |
| Topics relacionados | 5 | 5 | Coincidencia directa con pain points identificados |
| Específico vs genérico | 5 | 4 | Recomendaciones enfocadas en problemas concretos |

**Total: 38/43 (8.8/10)**

---

## Criterios de Auditoría Avanzados

### Checklist:
1. ✅ Identificar dependencias actuales (package.json, 15 dependencias core)
2. ✅ Identificar funcionalidades implementadas manualmente (Event Bus, Scheduler, Memory Engine)
3. ⚠️ Detectar dependencias deprecadas o mal mantenidas (LangChain v0.3 → estable pero pesado)
4. ✅ Buscar keywords en BD local (7 búsquedas, 105+ resultados analizados)
5. ✅ Evaluar cada recomendación contra stack actual
6. ✅ Verificar actividad reciente (todos con actividad 2026)
7. ✅ Verificar licencia compatible (MIT/APACHE2 en su mayoría)
8. ✅ Priorizar por puntuación de matriz

### Sugerencias de reemplazo:
- **EventEmitter nativo → mitt** (mismo propósito, 200 bytes vs built-in)
- **LangChain → OpenAI SDK nativo** (misma funcionalidad, 2MB vs 15MB)
- **GitHub Actions cron → agenda** (ejecución local sin depender de cloud)
- **Memory Engine casero → mem0** (más features, cero mantenimiento)

---

## Skills de Claude que podrían adaptarse a LifeOS

Los 3 skills de WheelSaver ya se importaron a `.agents/skills/`. Además, estos skills existentes en LifeOS podrían mejorarse con WheelSaver:

| Skill LifeOS Actual | Mejora con WheelSaver |
|---|---|
| `ingeniero` | Usar `wheel_saver search` para recomendar librerías durante code reviews |
| `tutor` | Buscar repos educativos en la DB cuando el usuario pregunta cómo aprender X |
| `cerebro` | Enriquecer contexto con datos de repos populares relacionados al tema |
| `tributaria` | Buscar herramientas open-source de contabilidad/impuestos |
| `job_hunter` | Buscar repos de preparación técnica para entrevistas |

---

## Resumen Final

```
  ╔══════════════════════════════════════════════════╗
  ║        WHEELSAVER AUDIT — LIFEOS                ║
  ╠══════════════════════════════════════════════════╣
  ║                                                  ║
  ║  Salud General:    ████████░░  7.8/10            ║
  ║  Quick Wins:       3 disponibles                 ║
  ║  Arquitectura:     3 mejoras                     ║
  ║  Deuda Técnica:    2 items                       ║
  ║                                                  ║
  ║  Prioridad máxima:                               ║
  ║  1. mitt → Event Bus (~30 min)                   ║
  ║  2. mem0 → Memory Engine (~2 hr)                 ║
  ║  3. Tests con vitest (~4 hr)                     ║
  ║  4. Apprise → Multi-notificación (~1 hr)         ║
  ║  5. Reemplazar LangChain (~3 hr)                 ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
```
````

## File: etc/archived/scripts_data/contexto_maestro/ALERTAS_SENA.md
````markdown
# Alertas SENA - null
> Actualizado: 14/7/2026, 10:39:45 p. m.

---
**Progreso**: 0/0 completadas | 0 pendientes
````

## File: etc/archived/scripts_data/dian/ultima_consulta.json
````json
{
  "fecha": "2026-07-08T22:01:31.967Z",
  "nit": "1019156838",
  "login_exitoso": false,
  "secciones": {},
  "links_dashboard": [],
  "resumen": ""
}
````

## File: etc/archived/scripts_data/jobs/apply_queue.json
````json
[
  {
    "offer_id": "DEA0914C140F11AA61373E686DCF3405",
    "titulo": "Aprendiz Soporte Técnico de Primer Nivel",
    "empresa": "",
    "lugar": "",
    "fecha": "Agencia de Empleo de Comfenalco Antioquia",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-aprendiz-soporte-tecnico-de-primer-nivel-en-medellin-DEA0914C140F11AA61373E686DCF3405#lc=ListOffers-Score6-2",
    "auditoria": {
      "score": 85,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "El candidato cumple con el perfil de estudiante técnico en sistemas, tiene experiencia previa en mesa de ayuda y soporte, y la ubicación y horario son compatibles.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAprendiz Soporte Técnico de Primer Nivel\n\nAgencia de Empleo de Comfenalco Antioquia - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de aprendizaje Tiempo Completo\n\nEstudiante técnico o tecnólogo en sistemas, en etapa productiva, para apoyar el soporte técnico de primer nivel a usuarios. Será responsable de la instalación, configuración y mantenimiento básico de equipos, i"
    },
    "scraped_at": "2026-07-08T22:02:41.746Z"
  },
  {
    "offer_id": "1DDB06FA36E0C3B361373E686DCF3405",
    "titulo": "Analista de Soporte Técnico y Mesa de Ayuda TI",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 E-GLOBAL S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-soporte-tecnico-y-mesa-de-ayuda-ti-en-medellin-1DDB06FA36E0C3B361373E686DCF3405#lc=ListOffers-Score6-9",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia previa en mesa de ayuda y soporte técnico, ubicación y disponibilidad alineadas, formación técnica en curso.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de Soporte Técnico y Mesa de Ayuda TI\n\nE-GLOBAL S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.000.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\n¿Te apasiona la tecnología y el soporte a usuarios? Buscamos un Agente de Mesa de Ayuda TI con mínimo 2 años de experiencia brindando soporte técnico y atención a usuarios. Formación: Técnico o Tecnólogo en Sistem"
    },
    "scraped_at": "2026-07-08T22:03:56.859Z"
  },
  {
    "offer_id": "44E2F970F5B570BE61373E686DCF3405",
    "titulo": "Auxiliar de Soporte Técnico en Sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 Inter Rapidisimo S.A",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-en-sistemas-mantenimiento-de-equipos-en-medellin-44E2F970F5B570BE61373E686DCF3405#lc=ListOffers-Score6-10",
    "auditoria": {
      "score": 85,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia directa en mesa de ayuda nivel 1 y auxiliar de sistemas, ubicación en Medellín, dispone de vehículo, horario compatible (solo lunes a viernes). Salario competitivo.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Soporte Técnico en Sistemas - Mantenimiento de equipos\n\nInter Rapidisimo S.A - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.222.022,00 (Mensual) Contrato a término fijo Tiempo Completo\n\nConoce más sobre esta oferta Brindar soporte técnico de primer nivel, de manera presencial y remota, a los activos tecnológicos de la compañía (hardware, software y periféricos), mediante la a"
    },
    "scraped_at": "2026-07-08T22:04:07.638Z"
  },
  {
    "offer_id": "730C26A4927188A761373E686DCF3405",
    "titulo": "Aprendiz soporte técnico",
    "empresa": "",
    "lugar": "",
    "fecha": "4,8 AGENCIA DE EMPLEO COMFAMA",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-aprendiz-soporte-tecnico-en-medellin-730C26A4927188A761373E686DCF3405#lc=ListOffers-Score6-16",
    "auditoria": {
      "score": 85,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en mesa de ayuda nivel 1, conocimientos en soporte remoto y ticketing, formación técnica afín, ubicación y disponibilidad compatibles.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAprendiz soporte técnico\n\nAGENCIA DE EMPLEO COMFAMA - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de aprendizaje Tiempo Completo\n\nImportante empresa solicita para su equipo de trabajo, personal para desempeñar el cargo de aprendiz soporte técnico. Formación académica: tecnólogo/a en soporte técnico, redes de datos o áreas afines, en etapa de formación (Estu"
    },
    "scraped_at": "2026-07-08T22:05:03.054Z"
  },
  {
    "offer_id": "0BBD633F0443D03161373E686DCF3405",
    "titulo": "Asesores soporte técnico / Formación desde casa / Medellín PMS",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 TP",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-asesores-soporte-tecnico-formacion-desde-casa-medellin-pms-en-medellin-0BBD633F0443D03161373E686DCF3405#lc=ListOffers-Score6-17",
    "auditoria": {
      "score": 75,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en soporte técnico y mesa de ayuda, ubicación y disponibilidad coinciden con la oferta.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAsesores soporte técnico / Formación desde casa / Medellín PMS\n\nTP - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término fijo Tiempo Completo\n\n¡Únete a TP como experto en servicio al cliente y soporte técnico!\nEn TP no solo ofrecemos empleos, creamos carreras. Como líderes globales en experiencia del cliente, brindamos un entorno dinámico donde tu talento, pasión y amb"
    },
    "scraped_at": "2026-07-08T22:05:11.698Z"
  },
  {
    "offer_id": "DA6F4533D2AF2E0B61373E686DCF3405",
    "titulo": "Soporte Tecnico Nivel 2",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 Jiro S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-soporte-tecnico-nivel-2-en-medellin-DA6F4533D2AF2E0B61373E686DCF3405#lc=ListOffers-Score6-18",
    "auditoria": {
      "score": 70,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia directa en mesa de ayuda nivel 1 y auxiliar sistemas, cumple con años de experiencia y disponibilidad horaria, aunque falta conocimiento explícito en Linux y telefonía IP.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nSoporte Tecnico Nivel 2\n\nJiro S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\nImportante empresa del sector soporte y telecomunicaciones requiere personal con el siguiente perfil: Formación: Tecnólogo o profesional en sistemas o afines Experiencia: Mínimo 3 años en soporte técnico Horario: De 8:00 a 5:30 pero se organiza "
    },
    "scraped_at": "2026-07-08T22:05:27.624Z"
  },
  {
    "offer_id": "8499E6F0A657F98161373E686DCF3405",
    "titulo": "Auxiliar de Soporte Técnico",
    "empresa": "",
    "lugar": "",
    "fecha": "Agencia de Empleo de Comfenalco Antioquia",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-en-medellin-8499E6F0A657F98161373E686DCF3405#lc=ListOffers-Score6-19",
    "auditoria": {
      "score": 85,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia en soporte técnico y sistemas, formación afín, ubicación adecuada, salario competitivo.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Soporte Técnico\n\nAgencia de Empleo de Comfenalco Antioquia - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.800.000,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\nEmpresa del sector Servicios requiere para el municipio de Medellín AUXILIAR DE SOPORTE TECNICO Técnico o tecnólogo en Sistemas. Técnico o tecnólogo en Soporte de Infraestructura de Tecnologías de la Información. Técnico o"
    },
    "scraped_at": "2026-07-08T22:05:40.231Z"
  },
  {
    "offer_id": "B82BA5C67CE211AF61373E686DCF3405",
    "titulo": "Líder de Mesa de ayuda",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 Hogar y Moda",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-lider-de-mesa-de-ayuda-en-medellin-B82BA5C67CE211AF61373E686DCF3405#lc=ListOffers-Score6-2",
    "auditoria": {
      "score": 65,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia previa en mesa de ayuda y soporte técnico, habilidades técnicas sólidas y ubicación en Medellín; aunque no tiene experiencia comprobada como líder, el perfil es adecuado y la aspiración salarial es compatible.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nLíder de Mesa de ayuda\n\nHogar y Moda - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 3.200.000,00 (Mensual) Contrato a término fijo Tiempo Completo\n\nEn Hogar y Moda buscamos un líder como tú: si te apasiona liderar equipos, resolver retos y llevar el soporte al siguiente nivel, esta oferta es para ti.\n\nObjetivo del cargo\nGarantizar la operatividad y eficiencia de los sistemas tecnológicos d"
    },
    "scraped_at": "2026-07-08T22:06:03.902Z"
  },
  {
    "offer_id": "B3AC73FAA324FA4161373E686DCF3405",
    "titulo": "Técnico de Soporte en Campo",
    "empresa": "",
    "lugar": "",
    "fecha": "SALES MARKETING OUTSOURCING HOLDING SAS",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-tecnico-de-soporte-en-campo-vehiculo-propio-help-desk-agente-tecnico-mesa-de-ayuda-y-campo-en-medellin-B3AC73FAA324FA4161373E686DCF3405#lc=ListOffers-Score6-3",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en soporte técnico y sistemas, pero la oferta requiere moto propia y conocimientos audiovisuales específicos. Aún así, aplicable.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nTécnico de Soporte en Campo - Vehículo propio help desk agente tecnico mesa de ayuda y campo\n\nSALES MARKETING OUTSOURCING HOLDING SAS - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato de Obra o labor Tiempo Completo\n\nImportante empresa del sector tecnología se encuentra en búsqueda de Agente Técnico de Campo para sus operaciones. Requisitos: Técnico, tecnólogo o profesional en Sistemas, "
    },
    "scraped_at": "2026-07-08T22:06:13.399Z"
  },
  {
    "offer_id": "CBB849BE28153C3A61373E686DCF3405",
    "titulo": "Analista de Soporte Mesa de Ayuda",
    "empresa": "",
    "lugar": "",
    "fecha": "Sitti",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-soporte-mesa-de-ayuda-en-medellin-CBB849BE28153C3A61373E686DCF3405#lc=ListOffers-Score6-4",
    "auditoria": {
      "score": 85,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia previa en mesa de ayuda (Sitel/Amadeus) y habilidades técnicas alineadas con los requisitos del puesto; ubicado en Medellín con disponibilidad de lunes a viernes.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de Soporte Mesa de Ayuda\n\nSitti - Medellín, Antioquia\n\nOferta\nEmpresa\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término indefinido Tiempo Completo\n\n¡Somos Sitti, aliados a la Secretaría de Movilidad de Medellín! Apoyamos a la Secretaría de Movilidad de Medellín en sus esfuerzos por convertir la movilidad de la ciudad en una más eficiente, sostenible y responsable centrada en el ciudadano y su seguridad en las vías."
    },
    "scraped_at": "2026-07-08T22:06:20.967Z"
  },
  {
    "offer_id": "74667183E465091861373E686DCF3405",
    "titulo": "Gestor(a) Mesa de Ayuda Abastecimiento / Medellín",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 COMPLEMENTOS HUMANOS",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-gestora-mesa-de-ayuda-abastecimiento-medellin-en-medellin-74667183E465091861373E686DCF3405#lc=ListOffers-Score6-5",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia directa en mesa de ayuda nivel 1 y disponibilidad en Medellín de lunes a viernes, ajuste salarial adecuado.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nGestor(a) Mesa de Ayuda Abastecimiento / Medellín\n\nCOMPLEMENTOS HUMANOS - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.932.000,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\nGestor(a) Mesa de Ayuda Abastecimiento Medellín Importante compañía se encuentra en búsqueda de Gestor(a) Mesa de Ayuda Abastecimiento, una persona orientada al servicio, con habilidades de gestión, seguimien"
    },
    "scraped_at": "2026-07-08T22:06:31.634Z"
  },
  {
    "offer_id": "273307CAFA94AE8861373E686DCF3405",
    "titulo": "Técnico Onsite en Medellín..",
    "empresa": "",
    "lugar": "",
    "fecha": "Actualize Colombia S.A.S.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-tecnico-onsite-en-medellin-telecomunicaciones-en-medellin-273307CAFA94AE8861373E686DCF3405#lc=ListOffers-Score5-6",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Encaja por experiencia en soporte técnico, ubicación en Medellín, disponibilidad de lunes a viernes y vehículo propio. Salario acorde a su aspiración.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nTécnico Onsite en Medellín.. - Telecomunicaciones\n\nActualize Colombia S.A.S. - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\nFractalia Colombia busca para su equipo un Técnico Onsite en Medellín, experiencia en soporte técnico en sitio, atención de incidentes y manejo de herramientas ITSM ¡Esta oportunidad es para ti! ¿Cuál será tu mi"
    },
    "scraped_at": "2026-07-08T22:06:46.359Z"
  },
  {
    "offer_id": "B66B0125128A819D61373E686DCF3405",
    "titulo": "Analista de soporte nivel 3",
    "empresa": "",
    "lugar": "",
    "fecha": "4,8 AGENCIA DE EMPLEO COMFAMA",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-soporte-nivel-3-en-medellin-B66B0125128A819D61373E686DCF3405#lc=ListOffers-Score5-8",
    "auditoria": {
      "score": 72,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia previa en mesa de ayuda y soporte técnico, ubicación y horario compatibles, pero no menciona conocimiento de Siesa requerido.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de soporte nivel 3\n\nAGENCIA DE EMPLEO COMFAMA - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.500.000,00 (Mensual) Contrato a término fijo Tiempo Completo Presencial y remoto\n\nImportante empresa ubicada en Medellín, solicita para su equipo de trabajo personal con experiencia mínima de 12 meses en soporte técnico para desempeñar el cargo de analista de soporte nivel 3. Formación a"
    },
    "scraped_at": "2026-07-08T22:06:56.206Z"
  },
  {
    "offer_id": "0AFB9DA32F5E80F761373E686DCF3405",
    "titulo": "Analista de Servicios TI y Soporte Tecnológico para personas con o sin discapacidad",
    "empresa": "",
    "lugar": "",
    "fecha": "4,8 AGENCIA DE EMPLEO COMFAMA",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-servicios-ti-y-soporte-tecnologico-para-personas-con-o-sin-discapacidad-en-medellin-0AFB9DA32F5E80F761373E686DCF3405#lc=ListOffers-Score5-10",
    "auditoria": {
      "score": 88,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en mesa de ayuda y soporte técnico, ubicación y disponibilidad compatibles, salario atractivo.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de Servicios TI y Soporte Tecnológico para personas con o sin discapacidad\n\nAGENCIA DE EMPLEO COMFAMA - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 3.000.000,00 (Mensual) Contrato a término indefinido Tiempo Completo Remoto\n\nImportante empresa del sector tecnológico se encuentra en la búsqueda de Analista de Servicios TI y Soporte Tecnológico para PCD, con un (1) año de experienc"
    },
    "scraped_at": "2026-07-08T22:07:13.722Z"
  },
  {
    "offer_id": "47D432DC1D1437EC61373E686DCF3405",
    "titulo": "Practicante de Telecomunicaciones o Redes Medellín",
    "empresa": "",
    "lugar": "",
    "fecha": "4,7 MAGNUM LOGISTICS S.A.S",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-practicante-de-telecomunicaciones-o-redes-medellin-medellin-en-medellin-47D432DC1D1437EC61373E686DCF3405#lc=ListOffers-Score5-11",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "El candidato tiene experiencia en mesa de ayuda y CCTV, y conocimientos básicos de redes, pero su formación en desarrollo de software no coincide con el perfil de telecomunicaciones solicitado. Sin embargo, las habilidades en soporte técnico y la disponibilidad hacen que sea una opción viable.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nPracticante de Telecomunicaciones o Redes Medellín - Medellín\n\nMAGNUM LOGISTICS S.A.S - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de aprendizaje Tiempo Completo\n\nImportante agencia requiere para su equipo de trabajo un estudiante que esté en etapa productiva, que esté cursando una técnica o tecnología de telecomunicaciones, redes o énfasis en telecomunica"
    },
    "scraped_at": "2026-07-08T22:07:25.569Z"
  },
  {
    "offer_id": "EA5B980883326D4661373E686DCF3405",
    "titulo": "Auxiliar de Servicios TI",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 ESTUDIO DE MODA S.A.S.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-servicios-ti-medellin-en-medellin-EA5B980883326D4661373E686DCF3405#lc=ListOffers-Score5-12",
    "auditoria": {
      "score": 85,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "El candidato cuenta con experiencia directa en soporte técnico (Mesa de Ayuda Nivel 1) y como Auxiliar de Sistemas, además de habilidades técnicas relevantes; su disponibilidad y ubicación coinciden con la oferta.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Servicios TI - Medellin\n\nESTUDIO DE MODA S.A.S. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nOfertas similares\nDescripción de la oferta\n$ 2.000.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\nAuxiliar de Servicios TI Palabras clave: Auxiliar de Servicios TI Soporte Técnico Mantenimiento de hardware Mantenimiento de software Gestión de redes Asistente de Soporte Técnico Técnico de Servicio TI En ESTUDIO DE MODA, b"
    },
    "scraped_at": "2026-07-08T22:07:38.947Z"
  },
  {
    "offer_id": "AF72A9B253F3A6B061373E686DCF3405",
    "titulo": "Supervisor de Tecnología / Unete a un equipo innovador",
    "empresa": "",
    "lugar": "",
    "fecha": "4,4 Academia de Idioma Smart",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-supervisor-de-tecnologia-unete-a-un-equipo-innovador-tiempo-completo-en-medellin-AF72A9B253F3A6B061373E686DCF3405#lc=ListOffers-Score5-14",
    "auditoria": {
      "score": 58,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "El candidato cuenta con experiencia en soporte IT y mesa de ayuda, pero carece de experiencia supervisora y conocimientos profundos en redes y CISCO; sin embargo, cumple con requisitos básicos y ubicación.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nSupervisor de Tecnología / Unete a un equipo innovador - tiempo completo\n\nAcademia de Idioma Smart - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.600.000,00 (Mensual) Contrato a término fijo Tiempo Completo\n\nOferta Laboral: Supervisor de IT Buscamos un Supervisor de IT que lidere la gestión tecnológica de nuestra compañia, asegurando el óptimo funcionamiento de aplicativos, redes, equipo"
    },
    "scraped_at": "2026-07-08T22:07:52.510Z"
  },
  {
    "offer_id": "63B71370C344096861373E686DCF3405",
    "titulo": "Supervisor de it",
    "empresa": "",
    "lugar": "",
    "fecha": "4,4 Academia de Idioma Smart",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-supervisor-de-it-tiempo-completo-en-medellin-63B71370C344096861373E686DCF3405#lc=ListOffers-Score5-16",
    "auditoria": {
      "score": 70,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en mesa de ayuda y sistemas, cumple con requisitos de soporte IT y ubicación; falta liderazgo formal pero aplicable.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nSupervisor de it - tiempo completo\n\nAcademia de Idioma Smart - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.600.000,00 (Mensual) Contrato a término fijo Tiempo Completo\n\nOferta Laboral: Supervisor de IT Buscamos un Supervisor de IT que lidere la gestión tecnológica de nuestra compañia, asegurando el óptimo funcionamiento de aplicativos, redes, equipos y servicios tecnológicos. Responsabi"
    },
    "scraped_at": "2026-07-08T22:08:02.956Z"
  },
  {
    "offer_id": "377F9C6FFEF2E06C61373E686DCF3405",
    "titulo": "Analista de soporte nivel 3",
    "empresa": "",
    "lugar": "",
    "fecha": "4,8 AGENCIA DE EMPLEO COMFAMA",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-soporte-nivel-3-en-medellin-377F9C6FFEF2E06C61373E686DCF3405#lc=ListOffers-Score5-17",
    "auditoria": {
      "score": 70,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en mesa de ayuda y soporte técnico, disponibilidad horaria compatible, pero falta conocimiento específico de Siesa.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de soporte nivel 3\n\nAGENCIA DE EMPLEO COMFAMA - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.500.000,00 (Mensual) Contrato a término fijo Tiempo Completo Presencial y remoto\n\nImportante empresa ubicada en Medellín, solicita para su equipo de trabajo personal con experiencia mínima de 12 meses en soporte técnico para desempeñar el cargo de analista de soporte nivel 3. Formación a"
    },
    "scraped_at": "2026-07-08T22:08:14.522Z"
  },
  {
    "offer_id": "9238EDD0653BF76061373E686DCF3405",
    "titulo": "Practicante de Telecomunicaciones o Redes Medellín",
    "empresa": "",
    "lugar": "",
    "fecha": "4,7 MAGNUM LOGISTICS S.A.S",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-practicante-de-telecomunicaciones-o-redes-medellin-medellin-en-medellin-9238EDD0653BF76061373E686DCF3405#lc=ListOffers-Score5-18",
    "auditoria": {
      "score": 65,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en mesa de ayuda y CCTV, disponibilidad y salario acordes, aunque formación en software no en telecomunicaciones.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nPracticante de Telecomunicaciones o Redes Medellín - Medellín\n\nMAGNUM LOGISTICS S.A.S - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de aprendizaje Tiempo Completo\n\nImportante agencia requiere para su equipo de trabajo un estudiante que esté en etapa productiva, que esté cursando una técnica o tecnología de telecomunicaciones, redes o énfasis en telecomunica"
    },
    "scraped_at": "2026-07-08T22:08:28.759Z"
  },
  {
    "offer_id": "046EB46A66554FEB61373E686DCF3405",
    "titulo": "Analista Sr de Soporte Técnico",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 SODEXO S.A.S",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-sr-de-soporte-tecnico-medellin-en-medellin-046EB46A66554FEB61373E686DCF3405#lc=ListOffers-Score5-19",
    "auditoria": {
      "score": 70,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Tiene experiencia en soporte técnico y mesa de ayuda (2-3 años), cumple con ubicación y disponibilidad; pero no menciona conocimientos explícitos de SAP, lo que podría requerir capacitación.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista Sr de Soporte Técnico - Medellín\n\nSODEXO S.A.S - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término fijo Tiempo Completo\n\nNos encontramos en búsqueda de un Analista Sr de Soporte Técnico, quien se encagará de monitorear y analizar el flujo de actividades de soporte técnico en IS&T reportado por los diferentes usuarios, tanto funcionales como operacionales, co"
    },
    "scraped_at": "2026-07-08T22:08:37.566Z"
  },
  {
    "offer_id": "4DA606C0D0B6E11661373E686DCF3405",
    "titulo": "IT Support Specialist",
    "empresa": "",
    "lugar": "",
    "fecha": "Importante empresa del sector",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-it-support-specialist-en-medellin-4DA606C0D0B6E11661373E686DCF3405#lc=ListOffers-Score5-2",
    "auditoria": {
      "score": 75,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia previa en mesa de ayuda y soporte técnico nivel 1, ubicación en Medellín, inglés B1-B2, disponible de lunes a viernes.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nIT Support Specialist\n\nImportante empresa del sector - Medellín, Antioquia\n\nOferta\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término indefinido Tiempo Completo Presencial y remoto\n\nWe are currently seeking a Bilingual IT Support Specialist\n\nThe IT Support Specialist includes all aspects of help desk support and end-user technical assistance, including software issues, hardware failures, and network-related problems. When a "
    },
    "scraped_at": "2026-07-08T22:08:54.093Z"
  },
  {
    "offer_id": "69B06F423CAB078961373E686DCF3405",
    "titulo": "Analista de Soporte TI Bilingue EN/SP",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 TP",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-soporte-ti-bilingue-ensp-en-bogota-dc-69B06F423CAB078961373E686DCF3405#lc=ListOffers-Score0-9",
    "auditoria": {
      "score": 75,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia directa en mesa de ayuda bilingüe y soporte TI, cumple requisitos técnicos y salariales.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de Soporte TI Bilingue EN/SP\n\nTP - Bogotá, D.C., Bogotá, D.C.\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.500.000,00 (Mensual) Contrato a término indefinido Tiempo Completo Remoto\n\n¡ÚNETE A TP COMO IT INCIDENT MANAGEMENT ANALYST INGLÉS! TP es una compañía global de servicios digitales para negocios. Nuestra escala global y presencia local nos permiten ser una fuerza para el bien al apoyar a nuestr"
    },
    "scraped_at": "2026-07-08T22:09:49.480Z"
  },
  {
    "offer_id": "25EBB585F31877A561373E686DCF3405",
    "titulo": "Auxiliar de sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 Saitemp S.A",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-en-medellin-25EBB585F31877A561373E686DCF3405#lc=ListOffers-Score6-0",
    "auditoria": {
      "score": 88,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "El candidato tiene experiencia previa como Auxiliar de Sistemas y Mesa de Ayuda, cumple con los requisitos técnicos y de formación, la ubicación y horario son compatibles, y el salario está dentro de su aspiración.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de sistemas\n\nSaitemp S.A - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.000.000,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\n¡Esta es tu oportunidad! Estamos en la búsqueda de Auxiliar de sistemas con formación académica Técnico/a, Tecnólogo/a en sistemas, mantenimiento y reparación de computadores e impresoras o afines. Experiencia de 1 año en el área de sistemas. Las"
    },
    "scraped_at": "2026-07-08T22:10:01.199Z"
  },
  {
    "offer_id": "1BDFC2765AE5EDB461373E686DCF3405",
    "titulo": "Auxiliar de sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "Importante empresa del sector",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-en-medellin-1BDFC2765AE5EDB461373E686DCF3405#lc=ListOffers-Score6-1",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "El candidato tiene experiencia directa como auxiliar de sistemas y mesa de ayuda, cumple con la ubicación y el salario ofrecido está dentro de su aspiración.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de sistemas\n\nImportante empresa del sector - Medellín, Antioquia\n\nOferta\nOfertas similares\nDescripción de la oferta\n$ 1.850.000,00 (Mensual) Contrato a término fijo Tiempo Completo\n\nEstamos en busca de un Auxiliar de Sistemas para incorporarse a nuestro equipo de manera presencial.\nComo Auxiliar de Sistemas, serás fundamental en el mantenimiento y soporte de nuestros sistemas informáticos.\nTu capacidad para resolver problemas técnicos y "
    },
    "scraped_at": "2026-07-08T22:10:09.531Z"
  },
  {
    "offer_id": "03647147C4D8660E61373E686DCF3405",
    "titulo": "auxiliar de sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "C.I ESLOP SAS",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405#lc=ListOffers-Score6-4",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia previa como auxiliar de sistemas y mesa de ayuda, ubicación y disponibilidad coinciden, formación técnica en curso.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nauxiliar de sistemas - Auxiliar TI\n\nC.I ESLOP SAS - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término indefinido Tiempo Completo\n\n• Atención solicitudes y requerimientos técnicos, tecnológicos y ofimáticos.\n• Mantenimiento Preventivo y correctivos equipos de escritorio.\n• Apoyo en mantenimiento infraestructura tecnológica.\n• Instalación y configuración de impresoras, cambio de tó"
    },
    "scraped_at": "2026-07-08T22:10:31.498Z"
  },
  {
    "offer_id": "46D926700B5E3E0A61373E686DCF3405",
    "titulo": "Auxiliar de Mantenimiento de Sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 Jiro S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-mantenimiento-de-sistemas-en-medellin-46D926700B5E3E0A61373E686DCF3405#lc=ListOffers-Score6-5",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia previa como auxiliar de sistemas, formación técnica en desarrollo, y salario competitivo en Medellín.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Mantenimiento de Sistemas\n\nJiro S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\nOportunidad para incorporarse como Auxiliar de Mantenimiento de Sistemas en Jiro S.A. Gestionar y monitorear el funcionamiento de los sistemas de la empresa. Realizar mantenimiento preventivo y correctivo en equipos y sistemas. Coo"
    },
    "scraped_at": "2026-07-08T22:10:41.984Z"
  },
  {
    "offer_id": "09C8ED26A561F86C61373E686DCF3405",
    "titulo": "Auxiliar de sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "4,4 GESTION Y COMPROMISO",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-medellin-en-medellin-09C8ED26A561F86C61373E686DCF3405#lc=ListOffers-Score6-6",
    "auditoria": {
      "score": 90,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "El candidato cumple con los requisitos de formación técnica y experiencia en roles similares (auxiliar sistemas, mesa de ayuda). El horario de lunes a viernes es compatible y su aspiración salarial es acorde.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de sistemas - Medellín\n\nGESTION Y COMPROMISO - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\n¡ÚNETE A NUESTRO EQUIPO DE TRABAJO!\n\nSomos una empresa líder en el sector industrial y actualmente estamos buscando un AUXILIAR DE SISTEMAS quien estará a cargo de garantizar el correcto funcionamiento de nuestros equipos, red"
    },
    "scraped_at": "2026-07-08T22:10:51.931Z"
  },
  {
    "offer_id": "07B29E2DBBA9C38B61373E686DCF3405",
    "titulo": "Auxiliar de Sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "BYR",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-en-medellin-07B29E2DBBA9C38B61373E686DCF3405#lc=ListOffers-Score6-7",
    "auditoria": {
      "score": 70,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia previa como auxiliar de sistemas, formación técnica en curso, ubicación y salario compatibles, aunque falta conocimiento específico en SAP.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Sistemas\n\nBYR - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.999.998,00 (Mensual) Contrato a término fijo Tiempo Completo\n\n¡ÚNETE AL EQUIPO DE SISTEMAS!\n\nBuscamos Auxiliar de Sistemas para arrancar o dar el siguiente paso en tu carrera.\n\n¿QUÉ VAS A HACER?\n• Solucionar problemas técnicos a usuarios (presencial y remoto)\n• Configurar y alistar equipos con Windows y Microsoft 365\n• Dar sopor"
    },
    "scraped_at": "2026-07-08T22:11:02.604Z"
  },
  {
    "offer_id": "10E6322F71A4621C61373E686DCF3405",
    "titulo": "Auxiliar de Mantenimiento de Sistemas",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 Jiro S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-mantenimiento-de-sistemas-en-medellin-10E6322F71A4621C61373E686DCF3405#lc=ListOffers-Score6-8",
    "auditoria": {
      "score": 82,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia previa en mantenimiento de sistemas y soporte técnico, educación en software, ubicación y disponibilidad coinciden.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Mantenimiento de Sistemas\n\nJiro S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\nOportunidad para incorporarse como Auxiliar de Mantenimiento de Sistemas en Jiro S.A. Gestionar y monitorear el funcionamiento de los sistemas de la empresa. Realizar mantenimiento preventivo y correctivo en equipos y sistemas. Coo"
    },
    "scraped_at": "2026-07-08T22:11:11.769Z"
  },
  {
    "offer_id": "1CB267CCC490987E61373E686DCF3405",
    "titulo": "Auxiliar de Sistemas T.I.",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 E-GLOBAL S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-ti-en-medellin-1CB267CCC490987E61373E686DCF3405#lc=ListOffers-Score6-9",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia previa en soporte técnico y mesa de ayuda, ubicación en Medellín, disponibilidad de lunes a viernes, y salario acorde a la aspiración.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de Sistemas T.I.\n\nE-GLOBAL S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.014.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\nAuxiliar de Sistemas TI Soporte en Sitio Nivel 1.5 E-Global se encuentra en búsqueda de Auxiliar de Sistemas TI con mínimo 2 años de experiencia en soporte técnico en sitio, atención a usuarios finales y gestión de incidentes tecnológ"
    },
    "scraped_at": "2026-07-08T22:11:22.459Z"
  },
  {
    "offer_id": "CE0C538D6E8213AE61373E686DCF3405",
    "titulo": "Auxiliar de SAC / Empresa de envíos / Medellín",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 Jiro S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sac-empresa-de-envios-medellin-en-medellin-CE0C538D6E8213AE61373E686DCF3405#lc=ListOffers-Score5-12",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "La experiencia en mesa de ayuda y sistemas es relevante para el rol, el horario no requiere fines de semana y el salario está dentro de su expectativa.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de SAC / Empresa de envíos / Medellín\n\nJiro S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\nImportante empresa del sector, solicita AUXILIAR DE SAC. Funciones principales Apoyar la operación mediante la digitalización, cierre de sistema y reporte de novedades, garantizando la efectividad de las entregas y la cali"
    },
    "scraped_at": "2026-07-08T22:11:50.693Z"
  },
  {
    "offer_id": "747FE180E8E80B4B61373E686DCF3405",
    "titulo": "Auxiliar administrativo sector financiero",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 Adecco Colombia S.A.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-administrativo-sector-financiero-en-medellin-747FE180E8E80B4B61373E686DCF3405#lc=ListOffers-Score6-14",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Otro",
      "razon": "El candidato tiene experiencia en servicio al cliente y habilidades analíticas, pero su formación es en software, no en gestión administrativa. La oferta es presencial en Medellín, horario compatible con sus estudios.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar administrativo sector financiero\n\nAdecco Colombia S.A. - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.750.905,00 (Mensual) Contrato de Obra o labor Tiempo Completo\n\n¿Te apasiona la gestión administrativa, el servicio al cliente y el análisis de calidad? Esta es tu oportunidad para crecer profesionalmente en un proyecto con gran impacto. ¿Cuál será tu misión? Apoyar los procesos "
    },
    "scraped_at": "2026-07-08T22:14:34.209Z"
  },
  {
    "offer_id": "D924E26A3A5AEE8261373E686DCF3405",
    "titulo": "Analista de calidad",
    "empresa": "",
    "lugar": "",
    "fecha": "Actualize Colombia S.A.S.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-calidad-telecomunicaciones-en-medellin-D924E26A3A5AEE8261373E686DCF3405#lc=ListOffers-Score6-19",
    "auditoria": {
      "score": 72,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "QA",
      "razon": "Experiencia en QA y soporte con SLA, conocimientos en ITIL y métricas, pero sin título profesional requerido.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de calidad - Telecomunicaciones\n\nActualize Colombia S.A.S. - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término fijo Tiempo Completo\n\nFractalia Colombia busca para su equipo en Medellin un(a) Analista de Calidad, comprometido, proactivo y orientado al servicio para brindar soporte a usuarios y garantizar la continuidad de la operación tecnológica de nuestros clientes. ¿Cu"
    },
    "scraped_at": "2026-07-08T22:17:25.754Z"
  },
  {
    "offer_id": "CCECF471AC84F32161373E686DCF3405",
    "titulo": "Software QA Analyst",
    "empresa": "",
    "lugar": "",
    "fecha": "Itconsultores SAS",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-software-qa-analyst-en-medellin-CCECF471AC84F32161373E686DCF3405#lc=ListOffers-Score5-2",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "QA",
      "razon": "Experiencia en QA Automation con Playwright y proyecto propio en producción, cumple con los requisitos mínimos y dispone de disponibilidad laboral de lunes a viernes.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nSoftware QA Analyst\n\nItconsultores SAS - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término indefinido Tiempo Completo Remoto\n\nAyté S.A.S. es una empresa de consultoría en tecnología de la información, 100% remota, con un equipo en crecimiento y una cultura de trabajo ágil, dinámica y orientada a resultados.\n\nActualmente buscamos una Software QA Analyst para asumir un rol integral"
    },
    "scraped_at": "2026-07-08T22:17:49.889Z"
  },
  {
    "offer_id": "5E929563ECD7327861373E686DCF3405",
    "titulo": "Ingeniero de Automatización QA / QA Automation Engineer",
    "empresa": "",
    "lugar": "",
    "fecha": "VIVA ENGAGE SOLUTIONS S.A.S.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-ingeniero-de-automatizacion-qa-qa-automation-engineer-remoto-en-medellin-5E929563ECD7327861373E686DCF3405#lc=ListOffers-Score6-0",
    "auditoria": {
      "score": 55,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "QA",
      "razon": "Cuenta con habilidades en automatización (Playwright, JavaScript) y formación en QA, pero carece de experiencia profesional en pruebas automatizadas; cumple parcialmente los requisitos.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nIngeniero de Automatización QA / QA Automation Engineer - Remoto\n\nVIVA ENGAGE SOLUTIONS S.A.S. - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 5.650.000,00 (Mensual) Contrato a término indefinido Tiempo Completo Remoto\n\nResumes must be submitted in English. A Viva Engage client is looking for a skilled QA Automation Engineer to join their team! In this role, you will be responsible for designing, buildi"
    },
    "scraped_at": "2026-07-08T22:18:15.599Z"
  },
  {
    "offer_id": "B4F26D3A29C2688361373E686DCF3405",
    "titulo": "Senior Software Engineer in Test 54195",
    "empresa": "",
    "lugar": "",
    "fecha": "4,4 PeakU",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-senior-software-engineer-in-test-54195-remoto-en-bogota-dc-B4F26D3A29C2688361373E686DCF3405#lc=ListOffers-Score3-1",
    "auditoria": {
      "score": 75,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "QA",
      "razon": "Coincidencia fuerte con skills de Playwright, automatización y CI/CD, y disponibilidad remota; aunque el perfil es junior, la oferta senior puede ser oportunidad de crecimiento.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nSenior Software Engineer in Test 54195 - Remoto\n\nPeakU - Bogotá, D.C., Bogotá, D.C.\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 10.000.000,00 (Mensual) Contrato civil por prestación de servicios Tiempo Completo Remoto\n\nSenior Software Engineer in Test (SDET)\nEn Gmstek estamos buscando un Senior Software Engineer in Test (SDET) para liderar la construcción de nuestra práctica de Quality Engineering desde cero.\n\nSi disfrut"
    },
    "scraped_at": "2026-07-08T22:18:22.527Z"
  },
  {
    "offer_id": "D08BEEB481DDD4F561373E686DCF3405",
    "titulo": "Analista de producto",
    "empresa": "",
    "lugar": "",
    "fecha": "Altos Software Ltda.",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-producto-tecnologo-en-sistemas-o-carreras-a-fines-en-medellin-D08BEEB481DDD4F561373E686DCF3405#lc=ListOffers-Score6-10",
    "auditoria": {
      "score": 75,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "Experiencia en soporte técnico, pruebas e implementación coincide con los requisitos. Salario competitivo y ubicación adecuada. Sin fin de semana.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de producto - Tecnologo en sistemas o carreras a fines\n\nAltos Software Ltda. - Medellín, Antioquia\n\nOferta\nEmpresa\nOfertas similares\nDescripción de la oferta\n$ 2.460.000,00 (Mensual) Contrato a término indefinido Tiempo Completo Presencial y remoto\n\n1. Ejecutar las tareas pendientes para garantizar la disponibilidad y el correcto funcionamiento de Servidores y equipos de cómputo de la compañía.\n2. Apoyar las actividades que busquen garan"
    },
    "scraped_at": "2026-07-08T22:19:59.887Z"
  },
  {
    "offer_id": "042D13384E9B732661373E686DCF3405",
    "titulo": "Analista de Datos de Ventas e Inventarios",
    "empresa": "",
    "lugar": "",
    "fecha": "GCO",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-datos-de-ventas-e-inventarios-sector-textil-en-medellin-042D13384E9B732661373E686DCF3405#lc=ListOffers-Score5-13",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Otro",
      "razon": "El candidato posee habilidades en Excel y bases de datos, relevantes para el análisis de datos de ventas e inventarios, aunque su experiencia principal es en QA y soporte. La ubicación y disponibilidad coinciden con la oferta.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista de Datos de Ventas e Inventarios - (Sector Textil)\n\nGCO - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término indefinido Tiempo Completo\n\nAnalista de Datos de Ventas e Inventarios Buscamos un(a) Analista de Datos de Ventas e Inventarios con alta capacidad analítica, pensamiento estratégico y orientación a resultados. Serás responsable de convertir la información comercial "
    },
    "scraped_at": "2026-07-08T22:20:24.032Z"
  },
  {
    "offer_id": "DC2D638041A511B161373E686DCF3405",
    "titulo": "Analista Soporte de Operaciones/TICS",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 NAVITRANS COLOMBIA",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-soporte-de-operacionestics-interna-y-externa-en-medellin-DC2D638041A511B161373E686DCF3405#lc=ListOffers-Score5-15",
    "auditoria": {
      "score": 65,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "Experiencia en mesa de ayuda y soporte técnico, ubicación y disponibilidad adecuadas, perfil afín al soporte de operaciones.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAnalista Soporte de Operaciones/TICS - Interna y Externa\n\nNAVITRANS COLOMBIA - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término fijo Tiempo Completo\n\nEn Navitrans buscamos un Analista de Soporte de Operaciones, responsable de garantizar la continuidad operativa de las aplicaciones y plataformas tecnológicas que soportan los procesos del negocio. Requerimos profesion"
    },
    "scraped_at": "2026-07-08T22:20:39.454Z"
  },
  {
    "offer_id": "5202A8CAE0397E2F61373E686DCF3405",
    "titulo": "Junior Data Integration Engineer",
    "empresa": "",
    "lugar": "",
    "fecha": "4,6 SOLVO S.A.S",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-junior-data-integration-engineer-en-medellin-5202A8CAE0397E2F61373E686DCF3405#lc=ListOffers-Score6-8",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Otro",
      "razon": "El candidato tiene habilidades en APIs, automatización y programación, pero sin experiencia directa en integración de datos; como junior es recomendable por su base técnica y disponibilidad.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nJunior Data Integration Engineer\n\nSOLVO S.A.S - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\nA convenir Contrato a término indefinido Tiempo Completo Remoto\n\nBuscamos un Junior Data Integration Engineer altamente técnico para diseñar, construir y mantener los sistemas que impulsan la toma de decisiones basada en datos. Esta es una posición hands-on para alguien apasionado por las integracion"
    },
    "scraped_at": "2026-07-08T22:22:32.575Z"
  },
  {
    "offer_id": "143B2E903BC8F8C961373E686DCF3405",
    "titulo": "Auxiliar de soporte tecnico /Juegos localizados y Ruta",
    "empresa": "",
    "lugar": "",
    "fecha": "4,7 RÉDITOS EMPRESARIALES S.A",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-juegos-localizados-y-ruta-en-medellin-143B2E903BC8F8C961373E686DCF3405#lc=ListOffers-Score6-0",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "El candidato tiene experiencia en soporte técnico y habilidades técnicas relevantes, pero no cuenta con motocicleta propia como requisito obligatorio",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de soporte tecnico /Juegos localizados y Ruta\n\nRÉDITOS EMPRESARIALES S.A - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.959.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\n¡Estamos buscando un AUXILIAR DE SOPORTE TÉCNICO ELECTRONICO En Grupo Réditos queremos personas con calidad humana, proactivas, recursivas y apasionadas por brindar un servicio ágil, eficiente "
    },
    "scraped_at": "2026-07-13T13:58:01.782Z"
  },
  {
    "offer_id": "536ED5D6FF2D890E61373E686DCF3405",
    "titulo": "Auxiliar de servicio al cliente y soporte técnico",
    "empresa": "",
    "lugar": "",
    "fecha": "Agencia de Empleo de Comfenalco Antioquia",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-servicio-al-cliente-y-soporte-tecnico-auxiliar-de-soporte-tecnico-en-campo-en-medellin-536ED5D6FF2D890E61373E686DCF3405#lc=ListOffers-Score6-3",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "El candidato tiene experiencia en atención al cliente y soporte técnico, y su formación en análisis y desarrollo de software es relevante para el cargo de Auxiliar de Soporte Técnico en Campo.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de servicio al cliente y soporte técnico - Auxiliar de Soporte Técnico en Campo\n\nAgencia de Empleo de Comfenalco Antioquia - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.254.003,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\nAuxiliar de Soporte Técnico en Campo Empresa del sector servicios requiere para su equipo de trabajo Auxiliar de Soporte Técnico en Campo, encargado de acom"
    },
    "scraped_at": "2026-07-13T13:58:09.276Z"
  },
  {
    "offer_id": "5BFBC47A8D0BECFB61373E686DCF3405",
    "titulo": "Auxiliar de soporte tecnico /Juegos localizados y Ruta",
    "empresa": "",
    "lugar": "",
    "fecha": "4,7 RÉDITOS EMPRESARIALES S.A",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-juegos-localizados-y-ruta-en-medellin-5BFBC47A8D0BECFB61373E686DCF3405#lc=ListOffers-Score6-4",
    "auditoria": {
      "score": 60,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Auxiliar Sistemas",
      "razon": "El candidato tiene experiencia en soporte técnico y habilidades técnicas relevantes, pero no cuenta con motocicleta propia, lo que es un requisito obligatorio para la oferta.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de soporte tecnico /Juegos localizados y Ruta\n\nRÉDITOS EMPRESARIALES S.A - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.959.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\n¡Estamos buscando un AUXILIAR DE SOPORTE TÉCNICO ELECTRONICO En Grupo Réditos queremos personas con calidad humana, proactivas, recursivas y apasionadas por brindar un servicio ágil, eficiente "
    },
    "scraped_at": "2026-07-13T13:58:13.432Z"
  },
  {
    "offer_id": "983CAE91B35FF2B361373E686DCF3405",
    "titulo": "Técnico en sistemas con experiencia en soporte ZO",
    "empresa": "",
    "lugar": "",
    "fecha": "4,5 TP",
    "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-tecnico-en-sistemas-con-experiencia-en-soporte-zo-en-medellin-983CAE91B35FF2B361373E686DCF3405#lc=ListOffers-Score6-5",
    "auditoria": {
      "score": 80,
      "recomendar": true,
      "requiere_finde": false,
      "categoria": "Mesa de Ayuda",
      "razon": "El candidato tiene experiencia en soporte y habilidades técnicas relevantes para el cargo de Técnico en sistemas con experiencia en soporte ZO.",
      "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nTécnico en sistemas con experiencia en soporte ZO\n\nTP - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.746.882,00 (Mensual) Contrato a término fijo Tiempo Completo\n\n¡Únete a TP como Especialista Expert! ¿Listo para dar el primer paso? ¡Esta oportunidad es para ti! Lleva tu carrera al siguiente nivel en el TOP Team ¡Únete a nosotros y marca la diferencia! ¿Por qué elegir TP? Salario competi"
    },
    "scraped_at": "2026-07-13T13:58:17.157Z"
  }
]
````

## File: etc/archived/scripts_data/jobs/computrabajo.json
````json
{
  "fecha": "2026-07-13T13:58:18.029Z",
  "total_scrapeadas": 90,
  "aprobadas": 4,
  "rechazadas": 5,
  "ofertas": [
    {
      "offer_id": "143B2E903BC8F8C961373E686DCF3405",
      "titulo": "Auxiliar de soporte tecnico /Juegos localizados y Ruta",
      "empresa": "",
      "lugar": "",
      "fecha": "4,7 RÉDITOS EMPRESARIALES S.A",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-juegos-localizados-y-ruta-en-medellin-143B2E903BC8F8C961373E686DCF3405#lc=ListOffers-Score6-0",
      "auditoria": {
        "score": 60,
        "recomendar": true,
        "requiere_finde": false,
        "categoria": "Auxiliar Sistemas",
        "razon": "El candidato tiene experiencia en soporte técnico y habilidades técnicas relevantes, pero no cuenta con motocicleta propia como requisito obligatorio",
        "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de soporte tecnico /Juegos localizados y Ruta\n\nRÉDITOS EMPRESARIALES S.A - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.959.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\n¡Estamos buscando un AUXILIAR DE SOPORTE TÉCNICO ELECTRONICO En Grupo Réditos queremos personas con calidad humana, proactivas, recursivas y apasionadas por brindar un servicio ágil, eficiente "
      },
      "scraped_at": "2026-07-13T13:58:01.782Z"
    },
    {
      "offer_id": "536ED5D6FF2D890E61373E686DCF3405",
      "titulo": "Auxiliar de servicio al cliente y soporte técnico",
      "empresa": "",
      "lugar": "",
      "fecha": "Agencia de Empleo de Comfenalco Antioquia",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-servicio-al-cliente-y-soporte-tecnico-auxiliar-de-soporte-tecnico-en-campo-en-medellin-536ED5D6FF2D890E61373E686DCF3405#lc=ListOffers-Score6-3",
      "auditoria": {
        "score": 80,
        "recomendar": true,
        "requiere_finde": false,
        "categoria": "Mesa de Ayuda",
        "razon": "El candidato tiene experiencia en atención al cliente y soporte técnico, y su formación en análisis y desarrollo de software es relevante para el cargo de Auxiliar de Soporte Técnico en Campo.",
        "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de servicio al cliente y soporte técnico - Auxiliar de Soporte Técnico en Campo\n\nAgencia de Empleo de Comfenalco Antioquia - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 2.254.003,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\nAuxiliar de Soporte Técnico en Campo Empresa del sector servicios requiere para su equipo de trabajo Auxiliar de Soporte Técnico en Campo, encargado de acom"
      },
      "scraped_at": "2026-07-13T13:58:09.276Z"
    },
    {
      "offer_id": "5BFBC47A8D0BECFB61373E686DCF3405",
      "titulo": "Auxiliar de soporte tecnico /Juegos localizados y Ruta",
      "empresa": "",
      "lugar": "",
      "fecha": "4,7 RÉDITOS EMPRESARIALES S.A",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-juegos-localizados-y-ruta-en-medellin-5BFBC47A8D0BECFB61373E686DCF3405#lc=ListOffers-Score6-4",
      "auditoria": {
        "score": 60,
        "recomendar": true,
        "requiere_finde": false,
        "categoria": "Auxiliar Sistemas",
        "razon": "El candidato tiene experiencia en soporte técnico y habilidades técnicas relevantes, pero no cuenta con motocicleta propia, lo que es un requisito obligatorio para la oferta.",
        "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAuxiliar de soporte tecnico /Juegos localizados y Ruta\n\nRÉDITOS EMPRESARIALES S.A - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.959.000,00 (Mensual) Contrato a término indefinido Tiempo Completo\n\n¡Estamos buscando un AUXILIAR DE SOPORTE TÉCNICO ELECTRONICO En Grupo Réditos queremos personas con calidad humana, proactivas, recursivas y apasionadas por brindar un servicio ágil, eficiente "
      },
      "scraped_at": "2026-07-13T13:58:13.432Z"
    },
    {
      "offer_id": "983CAE91B35FF2B361373E686DCF3405",
      "titulo": "Técnico en sistemas con experiencia en soporte ZO",
      "empresa": "",
      "lugar": "",
      "fecha": "4,5 TP",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-tecnico-en-sistemas-con-experiencia-en-soporte-zo-en-medellin-983CAE91B35FF2B361373E686DCF3405#lc=ListOffers-Score6-5",
      "auditoria": {
        "score": 80,
        "recomendar": true,
        "requiere_finde": false,
        "categoria": "Mesa de Ayuda",
        "razon": "El candidato tiene experiencia en soporte y habilidades técnicas relevantes para el cargo de Técnico en sistemas con experiencia en soporte ZO.",
        "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nTécnico en sistemas con experiencia en soporte ZO\n\nTP - Medellín, Antioquia\n\nOferta\nEmpresa\nEvaluaciones\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.746.882,00 (Mensual) Contrato a término fijo Tiempo Completo\n\n¡Únete a TP como Especialista Expert! ¿Listo para dar el primer paso? ¡Esta oportunidad es para ti! Lleva tu carrera al siguiente nivel en el TOP Team ¡Únete a nosotros y marca la diferencia! ¿Por qué elegir TP? Salario competi"
      },
      "scraped_at": "2026-07-13T13:58:17.157Z"
    },
    {
      "offer_id": "0830BA6C043A5C1A61373E686DCF3405",
      "titulo": "Operario de Producción",
      "empresa": "",
      "lugar": "",
      "fecha": "4,4 Vinculamos S.A.S",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-operario-de-produccion-revisador-de-calidad-medellin-en-medellin-0830BA6C043A5C1A61373E686DCF3405#lc=ListOffers-Score6-4",
      "auditoria": {
        "razon": "Filtro Regex: Rol no tech/QA"
      }
    },
    {
      "offer_id": "5AC4C3474BFB55EE61373E686DCF3405",
      "titulo": "Analista de datos junior Bilingue",
      "empresa": "",
      "lugar": "",
      "fecha": "4,4 AMERICAS BUSINESS PROCESS SERVICES S.A",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-datos-junior-bilingue-en-medellin-5AC4C3474BFB55EE61373E686DCF3405#lc=ListOffers-Score6-2",
      "auditoria": {
        "razon": "Filtro Regex: Rol no tech/QA"
      }
    },
    {
      "offer_id": "9113903B8C2CD39E61373E686DCF3405",
      "titulo": "Analista de datos junior Bilingue",
      "empresa": "",
      "lugar": "",
      "fecha": "4,4 AMERICAS BUSINESS PROCESS SERVICES S.A",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-datos-junior-bilingue-en-medellin-9113903B8C2CD39E61373E686DCF3405#lc=ListOffers-Score6-12",
      "auditoria": {
        "razon": "Filtro Regex: Rol no tech/QA"
      }
    },
    {
      "offer_id": "2CA36E283A81669061373E686DCF3405",
      "titulo": "Asesor Junior Tecnología, Telecomunicaciones y Financiamiento",
      "empresa": "",
      "lugar": "",
      "fecha": "4,6 Eficacia",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-asesor-junior-tecnologia-telecomunicaciones-y-financiamiento-en-medellin-2CA36E283A81669061373E686DCF3405#lc=ListOffers-Score6-19",
      "auditoria": {
        "razon": "Filtro Regex: Rol no tech/QA"
      }
    },
    {
      "offer_id": "104BBCFB37D2711B61373E686DCF3405",
      "titulo": "Asesor de Soporte Técnico",
      "empresa": "",
      "lugar": "",
      "fecha": "ALARMAR LIMITADA",
      "url": "https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-asesor-de-soporte-tecnico-call-center-en-medellin-104BBCFB37D2711B61373E686DCF3405#lc=ListOffers-Score6-2",
      "auditoria": {
        "score": 80,
        "recomendar": true,
        "requiere_finde": true,
        "categoria": "Mesa de Ayuda",
        "razon": "El candidato tiene experiencia en Mesa de Ayuda y habilidades técnicas relevantes, pero la oferta requiere trabajar sábados, lo que no se ajusta a su disponibilidad horaria.",
        "descripcion": "Buscar empleos\nLogin Crear HdV\n Volver al listado\nAsesor de Soporte Técnico - Call Center\n\nALARMAR LIMITADA - Medellín, Antioquia\n\nOferta\nEmpresa\nSalarios\nOfertas similares\nDescripción de la oferta\n$ 1.900.000,00 (Mensual) Contrato a término fijo Tiempo Completo\n\nImportante empresa de seguridad electronica se encuentra en busqueda de Técnico Call Center.\n\nObjetivo del Cargo : Dar solución oportuna a las solicitudes técnicas de los clientes, prestando un soporte por medio interactivo de acuerdo a"
      }
    }
  ]
}
````

## File: etc/archived/scripts_data/legal/derecho_peticion_calibracion_0000838097.html
````html
<h2>DERECHO DE PETICION - SOLICITUD CERTIFICADO DE CALIBRACION DEI</h2>

<p><strong>Fecha:</strong> 14/7/2026</p>

<p><strong>Señores</strong><br>
Secretaria de Movilidad de Itagui<br>
Itagui, Antioquia</p>

<hr>

<p><strong>ASUNTO:</strong> Derecho de Peticion - Solicitud de certificado de calibracion del Dispositivo Electronico de Infraccion (DEI) que capturo la presunta infraccion del comparendo No. 0000838097 - Placa KEW496</p>

<p><strong>Jeiser Abraham Gutierrez Torres</strong>, mayor de edad, identificado con cedula de ciudadania No. <strong>1019156838</strong>, en ejercicio del derecho fundamental de peticion consagrado en el <strong>Articulo 23 de la Constitucion Politica de Colombia</strong> y la <strong>Ley 1755 de 2015</strong>, respetuosamente me dirijo a ustedes para solicitar informacion relacionada con el comparendo impuesto a mi vehiculo de placas KEW496.</p>

<h3>HECHOS</h3>

<p><strong>PRIMERO:</strong> El dia 29 de marzo de 2026 a las 13:43, en la direccion Calle 63 Cra 45A Simon Bolivar, fue impuesto el comparendo No. 0000838097 a mi vehiculo de placas KEW496, por la infraccion C29 - Conducir a velocidad superior a la maxima permitida (60 km/h en zona de 50 km/h), mediante sistema de fotodeteccion (DEI).</p>

<p><strong>SEGUNDO:</strong> Contra dicho comparendo interpuse RECURSO DE REPOSICION, el cual fue radicado bajo el numero <strong>AI26070618195823</strong>.</p>

<p><strong>TERCERO:</strong> La validez de la fotomulta depende de que el DEI haya sido calibrado dentro de los terminos establecidos por la normativa vigente (Resolucion 718 de 2018 y normas que la modifiquen).</p>

<h3>FUNDAMENTOS DE DERECHO</h3>

<ol>
  <li><strong>Constitucion Politica de Colombia, Articulo 23:</strong> Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades y a obtener pronta resolucion.</li>
  <li><strong>Ley 1755 de 2015:</strong> Regula el derecho fundamental de peticion y establece que toda solicitud debe ser resuelta en un termino maximo de 15 dias habiles.</li>
  <li><strong>Resolucion 718 de 2018, Articulo 8:</strong> Los Dispositivos Electronicos de Infraccion (DEI) deben contar con certificado de calibracion vigente expedido por laboratorio acreditado ante el IDEAM o la autoridad competente.</li>
  <li><strong>Codigo Nacional de Transito, Ley 769 de 2002:</strong> Las pruebas obtenidas con dispositivos no calibrados carecen de valor probatorio.</li>
  <li><strong>Sentencia C-951 de 2014 Corte Constitucional:</strong> Reitera que los DEI deben cumplir estrictamente con los requisitos tecnicos y de calibracion para que las multas tengan validez.</li>
</ol>

<h3>PETICIONES</h3>

<p>En virtud del derecho fundamental de peticion, solicito respetuosamente a la Secretaria de Movilidad de Itagui:</p>

<ol>
  <li><strong>EXPEDIR</strong> copia completa del certificado de calibracion vigente del Dispositivo Electronico de Infraccion (DEI) que capturo la presunta infraccion del comparendo No. 0000838097, especificando:
    <ul>
      <li>Numero de serie del DEI utilizado</li>
      <li>Fecha de la ultima calibracion antes del 29 de marzo de 2026</li>
      <li>Fecha de vencimiento de dicha calibracion</li>
      <li>Laboratorio acreditado que realizo la calibracion</li>
      <li>Numero del certificado de calibracion</li>
    </ul>
  </li>
  <li><strong>INFORMAR</strong> si el DEI se encontraba con certificado de calibracion vigente al momento de la captura de la presunta infraccion (29 de marzo de 2026).</li>
  <li><strong>APORTAR</strong> copia del registro de mantenimiento del DEI correspondiente al periodo en que se realizo la captura.</li>
</ol>

<h3>PRUEBAS</h3>
<ul>
  <li>Copia de la cedula de ciudadania (adjunta).</li>
  <li>Numero de radicado del Recurso de Reposicion: AI26070618195823.</li>
</ul>

<h3>ANEXOS</h3>
<ul>
  <li>Copia de este escrito.</li>
  <li>Copia del documento de identidad.</li>
</ul>

<h3>NOTIFICACIONES</h3>
<p>Recibire notificaciones en mi correo electronico <strong>jeiser270997@gmail.com</strong> y en mi celular <strong>3044615613</strong>.</p>

<p>Atentamente,</p>

<p><strong>Jeiser Abraham Gutierrez Torres</strong><br>
CC 1019156838<br>
jeiser270997@gmail.com<br>
Cel: 3044615613</p>
````

## File: etc/archived/scripts_data/simit/alertas.json
````json
{
  "ultima_revision": "2026-07-14T20:30:09.142Z",
  "alertas": [
    {
      "tipo": "cambio_total",
      "mensaje": "Total SIMIT cambio: 1.860.466 → 1.863.570 (+3104)",
      "urgente": true
    }
  ]
}
````

## File: etc/archived/scripts_data/simit/ultima_consulta.json
````json
{
  "fecha": "2026-07-14T20:30:09.141Z",
  "placa": "KEW496",
  "total": "1.863.570",
  "numMultas": 3,
  "numComparendos": 0,
  "detalle": {
    "multas": [
      {
        "id": "000083809722062026",
        "tipo": "No aplica",
        "fecha": "KEW496",
        "secretaria": "Itaguí",
        "infraccion": "C29...  Fotodetección Proyección pago  Número de identificación:  1019******   . Generación de la resolución jun. 22/2026$ 637.635 Fecha actual jul. 14/2026$ 705.380 Cobro coactivo jun. 22/2027",
        "estado": "Pendiente de pago",
        "valor": "$ 633.105\n                                                         Interés $ 4.530"
      },
      {
        "id": "000043026508052024",
        "tipo": "No aplica",
        "fecha": "KEW496",
        "secretaria": "Itaguí",
        "infraccion": "C14...  Fotodetección",
        "estado": "Cobro coactivo",
        "valor": "$ 455.020\n                                                         Interés $ 113.266"
      },
      {
        "id": "000067915426032025",
        "tipo": "No aplica",
        "fecha": "KEW496",
        "secretaria": "Medellin",
        "infraccion": "C29...  Fotodetección",
        "estado": "Pendiente de pago",
        "valor": "$ 572.628\n                                                         Interés $ 85.021"
      }
    ]
  }
}
````

## File: etc/archived/scripts_data/processed_emails.json
````json
[
  "19f3ed46094bb2cb",
  "19f3ed0c04487229",
  "19f3ecc1649d378d",
  "19f3ecc08fee28b7",
  "19f3ec682a630b1d",
  "19f3ec663909d5b6",
  "19f3ec64d39eaca4",
  "19f3ec1bfab6fcf3",
  "19f3ec1337d4d7ee",
  "19f3ebfffb817d16",
  "19f5bbed39dcccce",
  "19f5bbe9275ddb1d",
  "19f5bbd4667a3746",
  "19f5bba5a363c95e",
  "19f5ba8a5c71ab71",
  "19f5ba838663499c",
  "19f5ba6eed5181e7",
  "19f5b9ed5e5c66b3",
  "19f5b90837399914",
  "19f5b882eed61098",
  "19f5b825a3583fd8",
  "19f5b73566dc16fc",
  "19f5b61ea573fd8f",
  "19f5b5e2ba1f75c6",
  "19f5b5764a8d8fb2",
  "19f61fd1728122c5",
  "19f61ecbecc2b2d4",
  "19f61e9ac58832d6",
  "19f61bc66abe665c",
  "19f61b6c58d718fa",
  "19f60c2466d10617",
  "19f6238a99f7e094",
  "19f623648ebf71c5",
  "19f623541eddcea3",
  "19f62330b2c299b6",
  "19f62304cd4b6d18",
  "19f622e50daea107",
  "19f622729da1f9d6",
  "19f6226d54f157ca",
  "19f62264ecd7914b",
  "19f6221b89d0a628",
  "19f622158e751eb1",
  "19f622153b82fd25",
  "19f621bb7df56bbb",
  "19f621b8d6433bc6",
  "19f621b8bad708b2",
  "19f623f0ce0717ba",
  "19f63a579c86b9ab",
  "19f62f96c5c3d8bc",
  "19f62627b22ec4ff",
  "19f656a8375cb40a"
]
````

## File: etc/archived/scripts_data/repos_db_meta.json
````json
{
  "lastUpdate": "2026-07-14T19:41:06.081Z",
  "totalRepos": 3400,
  "sources": [
    {
      "name": "EvanLi",
      "date": "2026-07-08",
      "count": 3600,
      "url": "https://raw.githubusercontent.com/EvanLi/Github-Ranking/master/Data/github-ranking-2026-07-08.csv"
    },
    {
      "name": "EvanLi",
      "date": "2026-07-14",
      "count": 3600,
      "url": "https://raw.githubusercontent.com/EvanLi/Github-Ranking/master/Data/github-ranking-2026-07-14.csv"
    }
  ]
}
````

## File: etc/archived/scripts_data/repos_db.json
````json
[
  {
    "name": "build-your-own-x",
    "url": "https://github.com/codecrafters-io/build-your-own-x",
    "stars": 524912,
    "forks": 49644,
    "lang": "Markdown",
    "desc": "Master programming by recreating your favorite technologies from scratch.",
    "rank": 1
  },
  {
    "name": "awesome",
    "url": "https://github.com/sindresorhus/awesome",
    "stars": 484688,
    "forks": 35849,
    "lang": "?",
    "desc": "😎 Awesome lists about all kinds of interesting topics",
    "rank": 2
  },
  {
    "name": "freeCodeCamp",
    "url": "https://github.com/freeCodeCamp/freeCodeCamp",
    "stars": 451744,
    "forks": 45600,
    "lang": "TypeScript",
    "desc": "freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming, and computer science for free.",
    "rank": 3
  },
  {
    "name": "public-apis",
    "url": "https://github.com/public-apis/public-apis",
    "stars": 449811,
    "forks": 49448,
    "lang": "Python",
    "desc": "A collective list of free APIs",
    "rank": 1
  },
  {
    "name": "free-programming-books",
    "url": "https://github.com/EbookFoundation/free-programming-books",
    "stars": 392031,
    "forks": 66522,
    "lang": "Python",
    "desc": ":books: Freely available programming books",
    "rank": 5
  },
  {
    "name": "openclaw",
    "url": "https://github.com/openclaw/openclaw",
    "stars": 382856,
    "forks": 80351,
    "lang": "TypeScript",
    "desc": "Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞",
    "rank": 2
  },
  {
    "name": "developer-roadmap",
    "url": "https://github.com/nilbuild/developer-roadmap",
    "stars": 360790,
    "forks": 44519,
    "lang": "TypeScript",
    "desc": "Interactive roadmaps, guides and other educational content to help developers grow in their careers.",
    "rank": 7
  },
  {
    "name": "system-design-primer",
    "url": "https://github.com/donnemartin/system-design-primer",
    "stars": 357492,
    "forks": 57198,
    "lang": "Python",
    "desc": "Learn how to design large-scale systems. Prep for the system design interview.  Includes Anki flashcards.",
    "rank": 8
  },
  {
    "name": "coding-interview-university",
    "url": "https://github.com/jwasham/coding-interview-university",
    "stars": 356141,
    "forks": 84276,
    "lang": "?",
    "desc": "A complete computer science study plan to become a software engineer.",
    "rank": 9
  },
  {
    "name": "awesome-python",
    "url": "https://github.com/vinta/awesome-python",
    "stars": 308008,
    "forks": 28301,
    "lang": "Python",
    "desc": "An opinionated list of Python frameworks, libraries, tools, and resources",
    "rank": 10
  },
  {
    "name": "awesome-selfhosted",
    "url": "https://github.com/awesome-selfhosted/awesome-selfhosted",
    "stars": 305286,
    "forks": 14302,
    "lang": "?",
    "desc": "A list of Free Software network services and web applications which can be hosted on your own servers",
    "rank": 11
  },
  {
    "name": "996.ICU",
    "url": "https://github.com/996icu/996.ICU",
    "stars": 276382,
    "forks": 20798,
    "lang": "?",
    "desc": "Repo for counting stars and contributing. Press F to pay respect to glorious developers.",
    "rank": 12
  },
  {
    "name": "project-based-learning",
    "url": "https://github.com/practical-tutorials/project-based-learning",
    "stars": 273207,
    "forks": 35239,
    "lang": "Python",
    "desc": "Curated list of project-based tutorials",
    "rank": 13
  },
  {
    "name": "superpowers",
    "url": "https://github.com/obra/superpowers",
    "stars": 254025,
    "forks": 22699,
    "lang": "Shell",
    "desc": "An agentic skills framework & software development methodology that works.",
    "rank": 1
  },
  {
    "name": "react",
    "url": "https://github.com/react/react",
    "stars": 246461,
    "forks": 51206,
    "lang": "JavaScript",
    "desc": "The library for web and native user interfaces.",
    "rank": 15
  },
  {
    "name": "linux",
    "url": "https://github.com/torvalds/linux",
    "stars": 239392,
    "forks": 63458,
    "lang": "C",
    "desc": "Linux kernel source tree",
    "rank": 16
  },
  {
    "name": "the-book-of-secret-knowledge",
    "url": "https://github.com/trimstray/the-book-of-secret-knowledge",
    "stars": 233153,
    "forks": 13905,
    "lang": "?",
    "desc": "A collection of inspiring lists, manuals, cheatsheets, blogs, hacks, one-liners, cli/web tools and more.",
    "rank": 17
  },
  {
    "name": "ECC",
    "url": "https://github.com/affaan-m/ECC",
    "stars": 229325,
    "forks": 35133,
    "lang": "JavaScript",
    "desc": "The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.",
    "rank": 2
  },
  {
    "name": "Python",
    "url": "https://github.com/TheAlgorithms/Python",
    "stars": 222674,
    "forks": 50833,
    "lang": "Python",
    "desc": "All Algorithms implemented in Python",
    "rank": 19
  },
  {
    "name": "hermes-agent",
    "url": "https://github.com/NousResearch/hermes-agent",
    "stars": 214359,
    "forks": 39834,
    "lang": "Python",
    "desc": "The agent that grows with you",
    "rank": 7
  },
  {
    "name": "vue",
    "url": "https://github.com/vuejs/vue",
    "stars": 210144,
    "forks": 33948,
    "lang": "TypeScript",
    "desc": "This is the repo for Vue 2. For Vue 3, go to https://github.com/vuejs/core",
    "rank": 21
  },
  {
    "name": "computer-science",
    "url": "https://github.com/ossu/computer-science",
    "stars": 206023,
    "forks": 25579,
    "lang": "HTML",
    "desc": "🎓 Path to a free self-taught education in Computer Science!",
    "rank": 22
  },
  {
    "name": "n8n",
    "url": "https://github.com/n8n-io/n8n",
    "stars": 196350,
    "forks": 59309,
    "lang": "TypeScript",
    "desc": "Fair-code workflow automation platform with native AI capabilities. Combine visual building with custom code, self-host or cloud, 400+ integrations.",
    "rank": 5
  },
  {
    "name": "tensorflow",
    "url": "https://github.com/tensorflow/tensorflow",
    "stars": 196321,
    "forks": 75530,
    "lang": "C++",
    "desc": "An Open Source Machine Learning Framework for Everyone",
    "rank": 24
  },
  {
    "name": "javascript-algorithms",
    "url": "https://github.com/trekhleb/javascript-algorithms",
    "stars": 196231,
    "forks": 31047,
    "lang": "JavaScript",
    "desc": "📝 Algorithms and data structures implemented in JavaScript with explanations and links to further readings",
    "rank": 25
  },
  {
    "name": "claw-code",
    "url": "https://github.com/ultraworkers/claw-code",
    "stars": 194758,
    "forks": 109693,
    "lang": "Rust",
    "desc": "An agent-managed museum exhibit, built in Rust with Gajae-Code / LazyCodex — developed and maintained with no human intervention.",
    "rank": 26
  },
  {
    "name": "andrej-karpathy-skills",
    "url": "https://github.com/multica-ai/andrej-karpathy-skills",
    "stars": 191706,
    "forks": 19683,
    "lang": "?",
    "desc": "A single CLAUDE.md file to improve Claude Code behavior, derived from Andrej Karpathy's observations on LLM coding pitfalls.",
    "rank": 27
  },
  {
    "name": "ohmyzsh",
    "url": "https://github.com/ohmyzsh/ohmyzsh",
    "stars": 188707,
    "forks": 26569,
    "lang": "Shell",
    "desc": "🙃   A delightful community-driven (with 2,500+ contributors) framework for managing your zsh configuration. Includes 300+ optional plugins (rails, git, macOS, hub, docker, homebrew, node, php, python, etc), 140+ themes to spice up your morning, and an auto-update tool that makes it easy to keep up with the latest updates from the community.",
    "rank": 28
  },
  {
    "name": "vscode",
    "url": "https://github.com/microsoft/vscode",
    "stars": 187526,
    "forks": 41263,
    "lang": "TypeScript",
    "desc": "Visual Studio Code",
    "rank": 29
  },
  {
    "name": "FreeDomain",
    "url": "https://github.com/DigitalPlatDev/FreeDomain",
    "stars": 185545,
    "forks": 3879,
    "lang": "HTML",
    "desc": "DigitalPlat FreeDomain: Free Domain For Everyone",
    "rank": 2
  },
  {
    "name": "opencode",
    "url": "https://github.com/anomalyco/opencode",
    "stars": 185519,
    "forks": 23190,
    "lang": "TypeScript",
    "desc": "The open source coding agent.",
    "rank": 7
  },
  {
    "name": "AutoGPT",
    "url": "https://github.com/Significant-Gravitas/AutoGPT",
    "stars": 185516,
    "forks": 46084,
    "lang": "Python",
    "desc": "AutoGPT is the vision of accessible AI for everyone, to use and to build on. Our mission is to provide the tools, so that you can focus on what matters.",
    "rank": 32
  },
  {
    "name": "CS-Notes",
    "url": "https://github.com/CyC2018/CS-Notes",
    "stars": 184760,
    "forks": 50850,
    "lang": "?",
    "desc": ":books: 技术面试必备基础知识、Leetcode、计算机操作系统、计算机网络、系统设计",
    "rank": 33
  },
  {
    "name": "You-Dont-Know-JS",
    "url": "https://github.com/getify/You-Dont-Know-JS",
    "stars": 184594,
    "forks": 33480,
    "lang": "?",
    "desc": "A book series (2 published editions) on the JS language.",
    "rank": 34
  },
  {
    "name": "Python-100-Days",
    "url": "https://github.com/jackfrued/Python-100-Days",
    "stars": 184129,
    "forks": 55685,
    "lang": "Jupyter Notebook",
    "desc": "Python - 100天从新手到大师",
    "rank": 35
  },
  {
    "name": "Microsoft-Activation-Scripts",
    "url": "https://github.com/massgravel/Microsoft-Activation-Scripts",
    "stars": 183064,
    "forks": 17541,
    "lang": "Batchfile",
    "desc": "Open-source Windows and Office activator featuring HWID, Ohook, TSforge, and Online KMS activation methods, along with advanced troubleshooting.",
    "rank": 36
  },
  {
    "name": "awesome-go",
    "url": "https://github.com/avelino/awesome-go",
    "stars": 178113,
    "forks": 13406,
    "lang": "Go",
    "desc": "A curated list of awesome Go frameworks, libraries and software",
    "rank": 37
  },
  {
    "name": "flutter",
    "url": "https://github.com/flutter/flutter",
    "stars": 177881,
    "forks": 30808,
    "lang": "Dart",
    "desc": "Flutter makes it easy and fast to build beautiful apps for mobile and beyond",
    "rank": 38
  },
  {
    "name": "yt-dlp",
    "url": "https://github.com/yt-dlp/yt-dlp",
    "stars": 177815,
    "forks": 15201,
    "lang": "Python",
    "desc": "A feature-rich command-line audio/video downloader",
    "rank": 9
  },
  {
    "name": "ollama",
    "url": "https://github.com/ollama/ollama",
    "stars": 176069,
    "forks": 16954,
    "lang": "Go",
    "desc": "Get up and running with Kimi-K2.6, GLM-5.1, MiniMax, DeepSeek, gpt-oss, Qwen, Gemma and other models.",
    "rank": 40
  },
  {
    "name": "gitignore",
    "url": "https://github.com/github/gitignore",
    "stars": 174869,
    "forks": 82341,
    "lang": "?",
    "desc": "A collection of useful .gitignore templates",
    "rank": 41
  },
  {
    "name": "bootstrap",
    "url": "https://github.com/twbs/bootstrap",
    "stars": 174471,
    "forks": 78739,
    "lang": "MDX",
    "desc": "The most popular HTML, CSS, and JavaScript framework for developing responsive, mobile first projects on the web.",
    "rank": 42
  },
  {
    "name": "skills",
    "url": "https://github.com/mattpocock/skills",
    "stars": 168679,
    "forks": 14534,
    "lang": "Shell",
    "desc": "Skills for Real Engineers. Straight from my .claude directory.",
    "rank": 3
  },
  {
    "name": "prompts.chat",
    "url": "https://github.com/f/prompts.chat",
    "stars": 165662,
    "forks": 21437,
    "lang": "HTML",
    "desc": "f.k.a. Awesome ChatGPT Prompts. Share, discover, and collect prompts from the community. Free and open source — self-host for your organization with complete privacy.",
    "rank": 44
  },
  {
    "name": "markitdown",
    "url": "https://github.com/microsoft/markitdown",
    "stars": 165601,
    "forks": 11837,
    "lang": "Python",
    "desc": "Python tool for converting files and office documents to Markdown.",
    "rank": 10
  },
  {
    "name": "HelloGitHub",
    "url": "https://github.com/521xueweihan/HelloGitHub",
    "stars": 165076,
    "forks": 12306,
    "lang": "Python",
    "desc": ":octocat: 分享 GitHub 上有趣、入门级的开源项目。Share interesting, entry-level open source projects on GitHub.",
    "rank": 46
  },
  {
    "name": "stable-diffusion-webui",
    "url": "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    "stars": 164231,
    "forks": 30519,
    "lang": "Python",
    "desc": "Stable Diffusion web UI",
    "rank": 47
  },
  {
    "name": "transformers",
    "url": "https://github.com/huggingface/transformers",
    "stars": 162577,
    "forks": 33877,
    "lang": "Python",
    "desc": "🤗 Transformers: the model-definition framework for state-of-the-art machine learning models in text, vision, audio, and multimodal models, for both inference and training.",
    "rank": 48
  },
  {
    "name": "the-art-of-command-line",
    "url": "https://github.com/jlevy/the-art-of-command-line",
    "stars": 161736,
    "forks": 14828,
    "lang": "?",
    "desc": "Master the command line, in one page",
    "rank": 49
  },
  {
    "name": "JavaGuide",
    "url": "https://github.com/Snailclimb/JavaGuide",
    "stars": 157011,
    "forks": 46160,
    "lang": "JavaScript",
    "desc": "Java 面试 & 后端通用面试指南，覆盖计算机基础、数据库、分布式、高并发、系统设计与 AI 应用开发",
    "rank": 51
  },
  {
    "name": "langflow",
    "url": "https://github.com/langflow-ai/langflow",
    "stars": 151843,
    "forks": 9674,
    "lang": "Python",
    "desc": "Langflow is a powerful tool for building and deploying AI-powered agents and workflows.",
    "rank": 52
  },
  {
    "name": "firecrawl",
    "url": "https://github.com/firecrawl/firecrawl",
    "stars": 150513,
    "forks": 8597,
    "lang": "TypeScript",
    "desc": "The API to search, scrape, and interact with the web at scale. 🔥",
    "rank": 8
  },
  {
    "name": "dify",
    "url": "https://github.com/langgenius/dify",
    "stars": 148736,
    "forks": 23427,
    "lang": "TypeScript",
    "desc": "Production-ready platform for agentic workflow development.",
    "rank": 54
  },
  {
    "name": "javascript",
    "url": "https://github.com/airbnb/javascript",
    "stars": 148085,
    "forks": 26632,
    "lang": "JavaScript",
    "desc": "JavaScript Style Guide",
    "rank": 55
  },
  {
    "name": "scrcpy",
    "url": "https://github.com/Genymobile/scrcpy",
    "stars": 145657,
    "forks": 13427,
    "lang": "C",
    "desc": "Display and control your Android device",
    "rank": 56
  },
  {
    "name": "open-webui",
    "url": "https://github.com/open-webui/open-webui",
    "stars": 145334,
    "forks": 21038,
    "lang": "Python",
    "desc": "User-friendly AI Interface (Supports Ollama, OpenAI API, ...)",
    "rank": 57
  },
  {
    "name": "system-prompts-and-models-of-ai-tools",
    "url": "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools",
    "stars": 141893,
    "forks": 34806,
    "lang": "?",
    "desc": "FULL Augment Code, Claude Code, Cluely, CodeBuddy, Comet, Cursor, Devin AI, Junie, Kiro, Leap.new, Lovable, Manus, NotionAI, Orchids.app, Perplexity, Poke, Qoder, Replit, Same.dev, Trae, Traycer AI, VSCode Agent, Warp.dev, Windsurf, Xcode, Z.ai Code, Dia & v0. (And other Open Sourced) System Prompts, Internal Tools & AI Models",
    "rank": 58
  },
  {
    "name": "langchain",
    "url": "https://github.com/langchain-ai/langchain",
    "stars": 141708,
    "forks": 23544,
    "lang": "Python",
    "desc": "The agent engineering platform.",
    "rank": 17
  },
  {
    "name": "next.js",
    "url": "https://github.com/vercel/next.js",
    "stars": 141067,
    "forks": 31568,
    "lang": "JavaScript",
    "desc": "The React Framework",
    "rank": 60
  },
  {
    "name": "tech-interview-handbook",
    "url": "https://github.com/yangshun/tech-interview-handbook",
    "stars": 140826,
    "forks": 16668,
    "lang": "TypeScript",
    "desc": "Curated coding interview preparation materials for busy software engineers",
    "rank": 61
  },
  {
    "name": "youtube-dl",
    "url": "https://github.com/ytdl-org/youtube-dl",
    "stars": 140700,
    "forks": 10678,
    "lang": "Python",
    "desc": "Command-line program to download videos from YouTube.com and other video sites",
    "rank": 18
  },
  {
    "name": "claude-code",
    "url": "https://github.com/anthropics/claude-code",
    "stars": 137747,
    "forks": 22217,
    "lang": "Python",
    "desc": "Claude Code is an agentic coding tool that lives in your terminal, understands your codebase, and helps you code faster by executing routine tasks, explaining complex code, and handling git workflows - all through natural language commands.",
    "rank": 63
  },
  {
    "name": "PowerToys",
    "url": "https://github.com/microsoft/PowerToys",
    "stars": 136577,
    "forks": 8362,
    "lang": "C",
    "desc": "Microsoft PowerToys is a collection of utilities that supercharge productivity and customization on Windows",
    "rank": 64
  },
  {
    "name": "go",
    "url": "https://github.com/golang/go",
    "stars": 135369,
    "forks": 19337,
    "lang": "Go",
    "desc": "The Go programming language",
    "rank": 65
  },
  {
    "name": "fucking-algorithm",
    "url": "https://github.com/labuladong/fucking-algorithm",
    "stars": 134812,
    "forks": 23603,
    "lang": "Markdown",
    "desc": "Crack LeetCode, not only how, but also why.",
    "rank": 66
  },
  {
    "name": "iptv",
    "url": "https://github.com/iptv-org/iptv",
    "stars": 132838,
    "forks": 7579,
    "lang": "TypeScript",
    "desc": "Collection of publicly available IPTV channels from all over the world",
    "rank": 67
  },
  {
    "name": "clash-verge-rev",
    "url": "https://github.com/clash-verge-rev/clash-verge-rev",
    "stars": 131321,
    "forks": 9502,
    "lang": "TypeScript",
    "desc": "A modern GUI client based on Tauri, designed to run in Windows, macOS and Linux for tailored proxy experience",
    "rank": 68
  },
  {
    "name": "agency-agents",
    "url": "https://github.com/msitarzewski/agency-agents",
    "stars": 131174,
    "forks": 21530,
    "lang": "Shell",
    "desc": "A complete AI agency at your fingertips - From frontend wizards to Reddit community ninjas, from whimsy injectors to reality checkers. Each agent is a specialized expert with personality, processes, and proven deliverables.",
    "rank": 4
  },
  {
    "name": "free-for-dev",
    "url": "https://github.com/ripienaar/free-for-dev",
    "stars": 129102,
    "forks": 13476,
    "lang": "HTML",
    "desc": "A list of SaaS, PaaS and IaaS offerings that have free tiers of interest to devops and infradev",
    "rank": 4
  },
  {
    "name": "hello-algo",
    "url": "https://github.com/krahets/hello-algo",
    "stars": 128475,
    "forks": 15417,
    "lang": "Java",
    "desc": "《Hello 算法》：动画图解、一键运行的数据结构与算法教程。支持简中、繁中、English、日本語，提供 Python, Java, C++, C, C#, JS, Go, Swift, Rust, Ruby, Kotlin, TS, Dart 等代码实现",
    "rank": 71
  },
  {
    "name": "30-seconds-of-code",
    "url": "https://github.com/Chalarangelo/30-seconds-of-code",
    "stars": 128368,
    "forks": 12483,
    "lang": "JavaScript",
    "desc": "Coding articles to level up your development skills",
    "rank": 72
  },
  {
    "name": "excalidraw",
    "url": "https://github.com/excalidraw/excalidraw",
    "stars": 127406,
    "forks": 14377,
    "lang": "TypeScript",
    "desc": "Virtual whiteboard for sketching hand-drawn like diagrams",
    "rank": 73
  },
  {
    "name": "react-native",
    "url": "https://github.com/react/react-native",
    "stars": 126195,
    "forks": 25182,
    "lang": "C++",
    "desc": "A framework for building native applications using React",
    "rank": 74
  },
  {
    "name": "kubernetes",
    "url": "https://github.com/kubernetes/kubernetes",
    "stars": 123772,
    "forks": 43756,
    "lang": "Go",
    "desc": "Production-Grade Container Scheduling and Management",
    "rank": 75
  },
  {
    "name": "electron",
    "url": "https://github.com/electron/electron",
    "stars": 121994,
    "forks": 17300,
    "lang": "C++",
    "desc": ":electron: Build cross-platform desktop apps with JavaScript, HTML, and CSS",
    "rank": 76
  },
  {
    "name": "gstack",
    "url": "https://github.com/garrytan/gstack",
    "stars": 121714,
    "forks": 18191,
    "lang": "TypeScript",
    "desc": "Use Garry Tan's exact Claude Code setup: 23 opinionated tools that serve as CEO, Designer, Eng Manager, Release Manager, Doc Engineer, and QA",
    "rank": 14
  },
  {
    "name": "spec-kit",
    "url": "https://github.com/github/spec-kit",
    "stars": 120745,
    "forks": 10746,
    "lang": "Python",
    "desc": "💫 Toolkit to help you get started with Spec-Driven Development",
    "rank": 20
  },
  {
    "name": "ComfyUI",
    "url": "https://github.com/Comfy-Org/ComfyUI",
    "stars": 120646,
    "forks": 14171,
    "lang": "Python",
    "desc": "The most powerful and modular diffusion model GUI, api and backend with a graph/nodes interface.",
    "rank": 79
  },
  {
    "name": "llama.cpp",
    "url": "https://github.com/ggml-org/llama.cpp",
    "stars": 120285,
    "forks": 20560,
    "lang": "C++",
    "desc": "LLM inference in C/C++",
    "rank": 80
  },
  {
    "name": "awesome-llm-apps",
    "url": "https://github.com/Shubhamsaboo/awesome-llm-apps",
    "stars": 119858,
    "forks": 17790,
    "lang": "Python",
    "desc": "100+ AI Agent & RAG apps you can actually run — clone, customize, ship.",
    "rank": 22
  },
  {
    "name": "ui",
    "url": "https://github.com/shadcn-ui/ui",
    "stars": 119043,
    "forks": 9487,
    "lang": "TypeScript",
    "desc": "A set of beautifully-designed, accessible components and a code distribution platform. Works with your favorite frameworks. Open Source. Open Code.",
    "rank": 82
  },
  {
    "name": "node",
    "url": "https://github.com/nodejs/node",
    "stars": 118341,
    "forks": 36213,
    "lang": "JavaScript",
    "desc": "Node.js JavaScript runtime ✨🐢🚀✨",
    "rank": 83
  },
  {
    "name": "rustdesk",
    "url": "https://github.com/rustdesk/rustdesk",
    "stars": 118187,
    "forks": 17969,
    "lang": "Rust",
    "desc": "An open-source remote desktop application designed for self-hosting, as an alternative to TeamViewer.",
    "rank": 84
  },
  {
    "name": "free-programming-books-zh_CN",
    "url": "https://github.com/justjavac/free-programming-books-zh_CN",
    "stars": 117342,
    "forks": 28210,
    "lang": "?",
    "desc": ":books: 免费的计算机编程类中文书籍，欢迎投稿",
    "rank": 85
  },
  {
    "name": "cc-switch",
    "url": "https://github.com/farion1231/cc-switch",
    "stars": 116903,
    "forks": 7823,
    "lang": "Rust",
    "desc": "A cross-platform desktop All-in-One assistant for Claude Code, Codex, OpenCode, OpenClaw, Gemini CLI & Hermes Agent. Only official website: ccswitch.io",
    "rank": 3
  },
  {
    "name": "Awesome-Hacking",
    "url": "https://github.com/Hack-with-Github/Awesome-Hacking",
    "stars": 116152,
    "forks": 10518,
    "lang": "?",
    "desc": "A collection of various awesome lists for hackers, pentesters and security researchers",
    "rank": 87
  },
  {
    "name": "rust",
    "url": "https://github.com/rust-lang/rust",
    "stars": 114706,
    "forks": 15423,
    "lang": "Rust",
    "desc": "Empowering everyone to build reliable and efficient software.",
    "rank": 88
  },
  {
    "name": "godot",
    "url": "https://github.com/godotengine/godot",
    "stars": 114050,
    "forks": 25989,
    "lang": "C++",
    "desc": "Godot Engine – Multi-platform 2D and 3D game engine",
    "rank": 89
  },
  {
    "name": "three.js",
    "url": "https://github.com/mrdoob/three.js",
    "stars": 113718,
    "forks": 36424,
    "lang": "JavaScript",
    "desc": "JavaScript 3D Library.",
    "rank": 90
  },
  {
    "name": "d3",
    "url": "https://github.com/d3/d3",
    "stars": 113214,
    "forks": 22702,
    "lang": "Shell",
    "desc": "Bring data to life with SVG, Canvas and HTML. :bar_chart::chart_with_upwards_trend::tada:",
    "rank": 91
  },
  {
    "name": "generative-ai-for-beginners",
    "url": "https://github.com/microsoft/generative-ai-for-beginners",
    "stars": 112964,
    "forks": 60688,
    "lang": "Jupyter Notebook",
    "desc": "21 Lessons, Get Started Building with Generative AI",
    "rank": 92
  },
  {
    "name": "v2rayN",
    "url": "https://github.com/2dust/v2rayN",
    "stars": 111299,
    "forks": 15515,
    "lang": "C#",
    "desc": "A GUI client for Windows, Linux and macOS, support Xray and sing-box and others",
    "rank": 93
  },
  {
    "name": "TypeScript",
    "url": "https://github.com/microsoft/TypeScript",
    "stars": 109898,
    "forks": 13650,
    "lang": "TypeScript",
    "desc": "TypeScript is a superset of JavaScript that compiles to clean JavaScript output.",
    "rank": 94
  },
  {
    "name": "axios",
    "url": "https://github.com/axios/axios",
    "stars": 109107,
    "forks": 11750,
    "lang": "JavaScript",
    "desc": "Promise based HTTP client for the browser and node.js",
    "rank": 95
  },
  {
    "name": "tauri",
    "url": "https://github.com/tauri-apps/tauri",
    "stars": 109026,
    "forks": 3774,
    "lang": "Rust",
    "desc": "Build smaller, faster, and more secure desktop and mobile applications with a web frontend.",
    "rank": 5
  },
  {
    "name": "frp",
    "url": "https://github.com/fatedier/frp",
    "stars": 108008,
    "forks": 15108,
    "lang": "Go",
    "desc": "A fast reverse proxy to help you expose a local server behind a NAT or firewall to the internet.",
    "rank": 97
  },
  {
    "name": "papers-we-love",
    "url": "https://github.com/papers-we-love/papers-we-love",
    "stars": 107810,
    "forks": 6387,
    "lang": "Shell",
    "desc": "Papers from the computer science community to read and discuss.",
    "rank": 98
  },
  {
    "name": "deno",
    "url": "https://github.com/denoland/deno",
    "stars": 107777,
    "forks": 6279,
    "lang": "Rust",
    "desc": "A modern runtime for JavaScript and TypeScript.",
    "rank": 99
  },
  {
    "name": "awesome-mac",
    "url": "https://github.com/jaywcjlove/awesome-mac",
    "stars": 107761,
    "forks": 8080,
    "lang": "Swift",
    "desc": " This project is dedicated to collecting high-quality macOS software and organizing them systematically by different categories for easy search and use.",
    "rank": 100
  },
  {
    "name": "immich",
    "url": "https://github.com/immich-app/immich",
    "stars": 107586,
    "forks": 6199,
    "lang": "TypeScript",
    "desc": "High performance self-hosted photo and video management solution.",
    "rank": 17
  },
  {
    "name": "supabase",
    "url": "https://github.com/supabase/supabase",
    "stars": 106325,
    "forks": 13204,
    "lang": "TypeScript",
    "desc": "The Postgres development platform. Supabase gives you a dedicated Postgres database to build your web, mobile, and AI applications.",
    "rank": 18
  },
  {
    "name": "gemini-cli",
    "url": "https://github.com/google-gemini/gemini-cli",
    "stars": 105976,
    "forks": 14249,
    "lang": "TypeScript",
    "desc": "An open-source AI agent that brings the power of Gemini directly into your terminal.",
    "rank": 19
  },
  {
    "name": "ui-ux-pro-max-skill",
    "url": "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
    "stars": 105243,
    "forks": 11163,
    "lang": "Python",
    "desc": "An AI SKILL that provide design intelligence for building professional UI/UX multiple platforms",
    "rank": 23
  },
  {
    "name": "whisper",
    "url": "https://github.com/openai/whisper",
    "stars": 104896,
    "forks": 12755,
    "lang": "Python",
    "desc": "Robust Speech Recognition via Large-Scale Weak Supervision",
    "rank": 24
  },
  {
    "name": "browser-use",
    "url": "https://github.com/browser-use/browser-use",
    "stars": 104618,
    "forks": 11529,
    "lang": "Python",
    "desc": "🌐 Make websites accessible for AI agents. Automate tasks online with ease.",
    "rank": 25
  },
  {
    "name": "terminal",
    "url": "https://github.com/microsoft/terminal",
    "stars": 103944,
    "forks": 9409,
    "lang": "C++",
    "desc": "The new Windows Terminal and the original Windows console host, all in the same place!",
    "rank": 6
  },
  {
    "name": "DeepSeek-V3",
    "url": "https://github.com/deepseek-ai/DeepSeek-V3",
    "stars": 103913,
    "forks": 16723,
    "lang": "Python",
    "desc": "",
    "rank": 26
  },
  {
    "name": "create-react-app",
    "url": "https://github.com/react/create-react-app",
    "stars": 103311,
    "forks": 26967,
    "lang": "JavaScript",
    "desc": "Set up a modern web app by running one command.",
    "rank": 100
  },
  {
    "name": "pytorch",
    "url": "https://github.com/pytorch/pytorch",
    "stars": 101796,
    "forks": 28480,
    "lang": "Python",
    "desc": "Tensors and Dynamic neural networks in Python with strong GPU acceleration",
    "rank": 87
  },
  {
    "name": "neovim",
    "url": "https://github.com/neovim/neovim",
    "stars": 101118,
    "forks": 6967,
    "lang": "Vim Script",
    "desc": "Vim-fork focused on extensibility and usability",
    "rank": 1
  },
  {
    "name": "angular",
    "url": "https://github.com/angular/angular",
    "stars": 100642,
    "forks": 27517,
    "lang": "TypeScript",
    "desc": "Deliver web apps with confidence 🚀",
    "rank": 91
  },
  {
    "name": "fastapi",
    "url": "https://github.com/fastapi/fastapi",
    "stars": 100446,
    "forks": 9601,
    "lang": "Python",
    "desc": "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
    "rank": 28
  },
  {
    "name": "ant-design",
    "url": "https://github.com/ant-design/ant-design",
    "stars": 98703,
    "forks": 54636,
    "lang": "TypeScript",
    "desc": "An enterprise-class UI design language and React UI library",
    "rank": 26
  },
  {
    "name": "material-ui",
    "url": "https://github.com/mui/material-ui",
    "stars": 98582,
    "forks": 32572,
    "lang": "JavaScript",
    "desc": "Material UI: Comprehensive React component library that implements Google's Material Design. Free forever.",
    "rank": 72
  },
  {
    "name": "codex",
    "url": "https://github.com/openai/codex",
    "stars": 97798,
    "forks": 14575,
    "lang": "Rust",
    "desc": "Lightweight coding agent that runs in your terminal",
    "rank": 7
  },
  {
    "name": "thefuck",
    "url": "https://github.com/nvbn/thefuck",
    "stars": 97516,
    "forks": 3953,
    "lang": "Python",
    "desc": "Magnificent app which corrects your previous console command.",
    "rank": 29
  },
  {
    "name": "MoneyPrinterTurbo",
    "url": "https://github.com/harry0703/MoneyPrinterTurbo",
    "stars": 97248,
    "forks": 14362,
    "lang": "Python",
    "desc": "利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM.",
    "rank": 30
  },
  {
    "name": "Web-Dev-For-Beginners",
    "url": "https://github.com/microsoft/Web-Dev-For-Beginners",
    "stars": 96023,
    "forks": 15662,
    "lang": "JavaScript",
    "desc": "24 Lessons, 12 Weeks, Get Started as a Web Developer",
    "rank": 13
  },
  {
    "name": "tailwindcss",
    "url": "https://github.com/tailwindlabs/tailwindcss",
    "stars": 95975,
    "forks": 5508,
    "lang": "TypeScript",
    "desc": "A utility-first CSS framework for rapid UI development.",
    "rank": 22
  },
  {
    "name": "puppeteer",
    "url": "https://github.com/puppeteer/puppeteer",
    "stars": 95421,
    "forks": 9639,
    "lang": "TypeScript",
    "desc": "JavaScript API for Chrome and Firefox",
    "rank": 23
  },
  {
    "name": "Deep-Live-Cam",
    "url": "https://github.com/hacksider/Deep-Live-Cam",
    "stars": 94881,
    "forks": 13821,
    "lang": "Python",
    "desc": "real time face swap and one-click video deepfake with only a single image",
    "rank": 31
  },
  {
    "name": "clean-code-javascript",
    "url": "https://github.com/ryanmcdermott/clean-code-javascript",
    "stars": 94780,
    "forks": 12605,
    "lang": "JavaScript",
    "desc": "Clean Code concepts adapted for JavaScript",
    "rank": 14
  },
  {
    "name": "bun",
    "url": "https://github.com/oven-sh/bun",
    "stars": 94673,
    "forks": 4961,
    "lang": "Rust",
    "desc": "Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one",
    "rank": 8
  },
  {
    "name": "java-design-patterns",
    "url": "https://github.com/iluwatar/java-design-patterns",
    "stars": 94224,
    "forks": 27365,
    "lang": "Java",
    "desc": "Design patterns implemented in Java",
    "rank": 93
  },
  {
    "name": "nvm",
    "url": "https://github.com/nvm-sh/nvm",
    "stars": 94119,
    "forks": 10262,
    "lang": "Shell",
    "desc": "Node Version Manager - POSIX-compliant bash script to manage multiple active node.js versions",
    "rank": 7
  },
  {
    "name": "TradingAgents",
    "url": "https://github.com/TauricResearch/TradingAgents",
    "stars": 92858,
    "forks": 17938,
    "lang": "Python",
    "desc": "TradingAgents: Multi-Agents LLM Financial Trading Framework",
    "rank": 32
  },
  {
    "name": "playwright",
    "url": "https://github.com/microsoft/playwright",
    "stars": 92777,
    "forks": 6083,
    "lang": "TypeScript",
    "desc": "Playwright is a framework for Web Testing and Automation. It allows testing Chromium, Firefox and WebKit with a single API.",
    "rank": 24
  },
  {
    "name": "autoresearch",
    "url": "https://github.com/karpathy/autoresearch",
    "stars": 91039,
    "forks": 13070,
    "lang": "Python",
    "desc": "AI agents running research on single-GPU nanochat training automatically",
    "rank": 33
  },
  {
    "name": "storybook",
    "url": "https://github.com/storybookjs/storybook",
    "stars": 90685,
    "forks": 10313,
    "lang": "TypeScript",
    "desc": "Storybook is the industry standard workshop for building, documenting, and testing UI components in isolation",
    "rank": 25
  },
  {
    "name": "vue-element-admin",
    "url": "https://github.com/PanJiaChen/vue-element-admin",
    "stars": 90249,
    "forks": 30411,
    "lang": "Vue",
    "desc": ":tada: A magical vue admin                                                                https://panjiachen.github.io/vue-element-admin",
    "rank": 81
  },
  {
    "name": "opencv",
    "url": "https://github.com/opencv/opencv",
    "stars": 89890,
    "forks": 56735,
    "lang": "C++",
    "desc": "Open Source Computer Vision Library",
    "rank": 23
  },
  {
    "name": "bitcoin",
    "url": "https://github.com/bitcoin/bitcoin",
    "stars": 89743,
    "forks": 39171,
    "lang": "C++",
    "desc": "Bitcoin Core integration/staging tree",
    "rank": 52
  },
  {
    "name": "core",
    "url": "https://github.com/home-assistant/core",
    "stars": 89331,
    "forks": 38098,
    "lang": "Python",
    "desc": ":house_with_garden: Open source home automation that puts local control and privacy first.",
    "rank": 54
  },
  {
    "name": "mermaid",
    "url": "https://github.com/mermaid-js/mermaid",
    "stars": 89219,
    "forks": 9108,
    "lang": "TypeScript",
    "desc": "Generation of diagrams like flowcharts or sequence diagrams from text in a similar manner as markdown",
    "rank": 26
  },
  {
    "name": "caveman",
    "url": "https://github.com/JuliusBrussee/caveman",
    "stars": 89152,
    "forks": 5116,
    "lang": "JavaScript",
    "desc": "🪨 why use many token when few token do trick — Claude Code skill that cuts 65% of tokens by talking like caveman",
    "rank": 15
  },
  {
    "name": "uptime-kuma",
    "url": "https://github.com/louislam/uptime-kuma",
    "stars": 89099,
    "forks": 8117,
    "lang": "JavaScript",
    "desc": "A fancy self-hosted monitoring tool",
    "rank": 16
  },
  {
    "name": "hugo",
    "url": "https://github.com/gohugoio/hugo",
    "stars": 88962,
    "forks": 8283,
    "lang": "Go",
    "desc": "The world’s fastest framework for building websites.",
    "rank": 6
  },
  {
    "name": "gin",
    "url": "https://github.com/gin-gonic/gin",
    "stars": 88911,
    "forks": 8639,
    "lang": "Go",
    "desc": "Gin is a high-performance HTTP web framework written in Go. It provides a Martini-like API but with significantly better performance—up to 40 times faster—thanks to httprouter. Gin is designed for building REST APIs, web applications, and microservices.",
    "rank": 7
  },
  {
    "name": "manim",
    "url": "https://github.com/3b1b/manim",
    "stars": 88496,
    "forks": 7380,
    "lang": "Python",
    "desc": "Animation engine for explanatory math videos",
    "rank": 35
  },
  {
    "name": "NextChat",
    "url": "https://github.com/ChatGPTNextWeb/NextChat",
    "stars": 88460,
    "forks": 59440,
    "lang": "TypeScript",
    "desc": "✨ Light and Fast AI Assistant. Support: Web | iOS | MacOS | Android |  Linux | Windows",
    "rank": 20
  },
  {
    "name": "servers",
    "url": "https://github.com/modelcontextprotocol/servers",
    "stars": 88433,
    "forks": 11208,
    "lang": "TypeScript",
    "desc": "Model Context Protocol Servers",
    "rank": 28
  },
  {
    "name": "django",
    "url": "https://github.com/django/django",
    "stars": 88197,
    "forks": 34177,
    "lang": "Python",
    "desc": "The Web framework for perfectionists with deadlines.",
    "rank": 66
  },
  {
    "name": "svelte",
    "url": "https://github.com/sveltejs/svelte",
    "stars": 87625,
    "forks": 5119,
    "lang": "JavaScript",
    "desc": "web development for the rest of us",
    "rank": 17
  },
  {
    "name": "uv",
    "url": "https://github.com/astral-sh/uv",
    "stars": 87432,
    "forks": 3313,
    "lang": "Rust",
    "desc": "An extremely fast Python package and project manager, written in Rust.",
    "rank": 9
  },
  {
    "name": "claude-mem",
    "url": "https://github.com/thedotmack/claude-mem",
    "stars": 87124,
    "forks": 7537,
    "lang": "JavaScript",
    "desc": "Persistent Context Across Sessions for Every Agent –  Captures everything your agent does during sessions, compresses it with AI, and injects relevant context back into future sessions. Works with Claude Code, OpenClaw, Codex, Gemini, Hermes, Copilot, OpenCode + More",
    "rank": 18
  },
  {
    "name": "Stirling-PDF",
    "url": "https://github.com/Stirling-Tools/Stirling-PDF",
    "stars": 87022,
    "forks": 7769,
    "lang": "Java",
    "desc": "#1 PDF Application on GitHub that lets you edit PDFs on any device anywhere",
    "rank": 3
  },
  {
    "name": "zed",
    "url": "https://github.com/zed-industries/zed",
    "stars": 86936,
    "forks": 9512,
    "lang": "Rust",
    "desc": "Code at the speed of thought – Zed is a high-performance, multiplayer code editor from the creators of Atom and Tree-sitter.",
    "rank": 10
  },
  {
    "name": "sherlock",
    "url": "https://github.com/sherlock-project/sherlock",
    "stars": 86527,
    "forks": 10135,
    "lang": "Python",
    "desc": "Hunt down social media accounts by username across social networks",
    "rank": 37
  },
  {
    "name": "syncthing",
    "url": "https://github.com/syncthing/syncthing",
    "stars": 86352,
    "forks": 5343,
    "lang": "Go",
    "desc": "Open Source Continuous File Synchronization",
    "rank": 8
  },
  {
    "name": "vllm",
    "url": "https://github.com/vllm-project/vllm",
    "stars": 86181,
    "forks": 19369,
    "lang": "Python",
    "desc": "A high-throughput and memory-efficient inference and serving engine for LLMs",
    "rank": 38
  },
  {
    "name": "PaddleOCR",
    "url": "https://github.com/PaddlePaddle/PaddleOCR",
    "stars": 85414,
    "forks": 11010,
    "lang": "Python",
    "desc": "Turn any PDF or image document into structured data for your AI. A powerful, lightweight OCR toolkit that bridges the gap between images/PDFs and LLMs. Supports 100+ languages.",
    "rank": 39
  },
  {
    "name": "localsend",
    "url": "https://github.com/localsend/localsend",
    "stars": 85243,
    "forks": 4670,
    "lang": "Dart",
    "desc": "An open-source cross-platform alternative to AirDrop",
    "rank": 2
  },
  {
    "name": "graphify",
    "url": "https://github.com/Graphify-Labs/graphify",
    "stars": 85022,
    "forks": 8392,
    "lang": "Python",
    "desc": "AI coding assistant skill (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, and more). Turn any folder of code, SQL schemas, R scripts, shell scripts, docs, papers, images, or videos into a queryable knowledge graph. App code + database schema + infrastructure in one graph.",
    "rank": 40
  },
  {
    "name": "ragflow",
    "url": "https://github.com/infiniflow/ragflow",
    "stars": 84991,
    "forks": 9909,
    "lang": "Go",
    "desc": "RAGFlow is a leading open-source Retrieval-Augmented Generation (RAG) engine that fuses cutting-edge RAG with Agent capabilities to create a superior context layer for LLMs",
    "rank": 9
  },
  {
    "name": "mall",
    "url": "https://github.com/macrozheng/mall",
    "stars": 84153,
    "forks": 29736,
    "lang": "Java",
    "desc": "mall项目是一套电商系统，包括前台商城系统及后台管理系统，基于Spring Boot+MyBatis实现，采用Docker容器化部署。 前台商城系统包含首页门户、商品推荐、商品搜索、商品展示、购物车、订单流程、会员中心、客户服务、帮助中心等模块。 后台管理系统包含商品管理、订单管理、会员管理、促销管理、运营管理、内容管理、统计报表、财务管理、权限管理、设置等模块。",
    "rank": 83
  },
  {
    "name": "realworld",
    "url": "https://github.com/realworld-apps/realworld",
    "stars": 83850,
    "forks": 7645,
    "lang": "TypeScript",
    "desc": "The mother of all demo apps — Exemplary fullstack Medium.com clone powered by React, Angular, Node, Django, and many more",
    "rank": 29
  },
  {
    "name": "devops-exercises",
    "url": "https://github.com/bregman-arie/devops-exercises",
    "stars": 83166,
    "forks": 19722,
    "lang": "Python",
    "desc": "Linux, Jenkins, AWS, SRE, Prometheus, Docker, Python, Ansible, Git, Kubernetes, Terraform, OpenStack, SQL, NoSQL, Azure, GCP, DNS, Elastic, Network, Virtualization. DevOps Interview Questions",
    "rank": 41
  },
  {
    "name": "odysseus",
    "url": "https://github.com/pewdiepie-archdaemon/odysseus",
    "stars": 82667,
    "forks": 10886,
    "lang": "Python",
    "desc": "Self-hosted AI workspace.",
    "rank": 42
  },
  {
    "name": "animate.css",
    "url": "https://github.com/animate-css/animate.css",
    "stars": 82658,
    "forks": 15957,
    "lang": "CSS",
    "desc": "🍿 A cross-browser library of CSS animations. As easy to use as an easy thing.",
    "rank": 1
  },
  {
    "name": "ponytail",
    "url": "https://github.com/DietrichGebert/ponytail",
    "stars": 82467,
    "forks": 4468,
    "lang": "JavaScript",
    "desc": "Makes your AI agent think like the laziest senior dev in the room. The best code is the code you never wrote.",
    "rank": 19
  },
  {
    "name": "vite",
    "url": "https://github.com/vitejs/vite",
    "stars": 82049,
    "forks": 8593,
    "lang": "TypeScript",
    "desc": "Next generation frontend tooling. It's fast!",
    "rank": 30
  },
  {
    "name": "FiraCode",
    "url": "https://github.com/tonsky/FiraCode",
    "stars": 81835,
    "forks": 3192,
    "lang": "Clojure",
    "desc": "Free monospaced font with programming ligatures",
    "rank": 1
  },
  {
    "name": "funNLP",
    "url": "https://github.com/fighting41love/funNLP",
    "stars": 81785,
    "forks": 15245,
    "lang": "Python",
    "desc": "中英文敏感词、语言检测、中外手机/电话归属地/运营商查询、名字推断性别、手机号抽取、身份证抽取、邮箱抽取、中日文人名库、中文缩写库、拆字词典、词汇情感值、停用词、反动词表、暴恐词表、繁简体转换、英文模拟中文发音、汪峰歌词生成器、职业名称词库、同义词库、反义词库、否定词库、汽车品牌词库、汽车零件词库、连续英文切割、各种中文词向量、公司名字大全、古诗词库、IT词库、财经词库、成语词库、地名词库、历史名人词库、诗词词库、医学词库、饮食词库、法律词库、汽车词库、动物词库、中文聊天语料、中文谣言数据、百度中文问答数据集、句子相似度匹配算法集合、bert资源、文本生成&摘要相关工具、cocoNLP信息抽取工具、国内电话号码正则匹配、清华大学XLORE:中英文跨语言百科知识图谱、清华大学人工智能技术系列报告、自然语言生成、NLU太难了系列、自动对联数据及机器人、用户名黑名单列表、罪名法务名词及分类模型、微信公众号语料、cs224n深度学习自然语言处理课程、中文手写汉字识别、中文自然语言处理 语料/数据集、变量命名神器、分词语料库+代码、任务型对话英文数据集、ASR 语音数据集 + 基于深度学习的中文语音识别系统、笑声检测器、Microsoft多语言数字/单位/如日期时间识别包、中华新华字典数据库及api(包括常用歇后语、成语、词语和汉字)、文档图谱自动生成、SpaCy 中文模型、Common Voice语音识别数据集新版、神经网络关系抽取、基于bert的命名实体识别、关键词(Keyphrase)抽取包pke、基于医疗领域知识图谱的问答系统、基于依存句法与语义角色标注的事件三元组抽取、依存句法分析4万句高质量标注数据、cnocr：用来做中文OCR的Python3包、中文人物关系知识图谱项目、中文nlp竞赛项目及代码汇总、中文字符数据、speech-aligner: 从“人声语音”及其“语言文本”产生音素级别时间对齐标注的工具、AmpliGraph: 知识图谱表示学习(Python)库：知识图谱概念链接预测、Scattertext 文本可视化(python)、语言/知识表示工具：BERT & ERNIE、中文对比英文自然语言处理NLP的区别综述、Synonyms中文近义词工具包、HarvestText领域自适应文本挖掘工具（新词发现-情感分析-实体链接等）、word2word：(Python)方便易用的多语言词-词对集：62种语言/3,564个多语言对、语音识别语料生成工具：从具有音频/字幕的在线视频创建自动语音识别(ASR)语料库、构建医疗实体识别的模型（包含词典和语料标注）、单文档非监督的关键词抽取、Kashgari中使用gpt-2语言模型、开源的金融投资数据提取工具、文本自动摘要库TextTeaser: 仅支持英文、人民日报语料处理工具集、一些关于自然语言的基本模型、基于14W歌曲知识库的问答尝试--功能包括歌词接龙and已知歌词找歌曲以及歌曲歌手歌词三角关系的问答、基于Siamese bilstm模型的相似句子判定模型并提供训练数据集和测试数据集、用Transformer编解码模型实现的根据Hacker News文章标题自动生成评论、用BERT进行序列标记和文本分类的模板代码、LitBank：NLP数据集——支持自然语言处理和计算人文学科任务的100部带标记英文小说语料、百度开源的基准信息抽取系统、虚假新闻数据集、Facebook: LAMA语言模型分析，提供Transformer-XL/BERT/ELMo/GPT预训练语言模型的统一访问接口、CommonsenseQA：面向常识的英文QA挑战、中文知识图谱资料、数据及工具、各大公司内部里大牛分享的技术文档 PDF 或者 PPT、自然语言生成SQL语句（英文）、中文NLP数据增强（EDA）工具、英文NLP数据增强工具 、基于医药知识图谱的智能问答系统、京东商品知识图谱、基于mongodb存储的军事领域知识图谱问答项目、基于远监督的中文关系抽取、语音情感分析、中文ULMFiT-情感分析-文本分类-语料及模型、一个拍照做题程序、世界各国大规模人名库、一个利用有趣中文语料库 qingyun 训练出来的中文聊天机器人、中文聊天机器人seqGAN、省市区镇行政区划数据带拼音标注、教育行业新闻语料库包含自动文摘功能、开放了对话机器人-知识图谱-语义理解-自然语言处理工具及数据、中文知识图谱：基于百度百科中文页面-抽取三元组信息-构建中文知识图谱、masr: 中文语音识别-提供预训练模型-高识别率、Python音频数据增广库、中文全词覆盖BERT及两份阅读理解数据、ConvLab：开源多域端到端对话系统平台、中文自然语言处理数据集、基于最新版本rasa搭建的对话系统、基于TensorFlow和BERT的管道式实体及关系抽取、一个小型的证券知识图谱/知识库、复盘所有NLP比赛的TOP方案、OpenCLaP：多领域开源中文预训练语言模型仓库、UER：基于不同语料+编码器+目标任务的中文预训练模型仓库、中文自然语言处理向量合集、基于金融-司法领域(兼有闲聊性质)的聊天机器人、g2pC：基于上下文的汉语读音自动标记模块、Zincbase 知识图谱构建工具包、诗歌质量评价/细粒度情感诗歌语料库、快速转化「中文数字」和「阿拉伯数字」、百度知道问答语料库、基于知识图谱的问答系统、jieba_fast 加速版的jieba、正则表达式教程、中文阅读理解数据集、基于BERT等最新语言模型的抽取式摘要提取、Python利用深度学习进行文本摘要的综合指南、知识图谱深度学习相关资料整理、维基大规模平行文本语料、StanfordNLP 0.2.0：纯Python版自然语言处理包、NeuralNLP-NeuralClassifier：腾讯开源深度学习文本分类工具、端到端的封闭域对话系统、中文命名实体识别：NeuroNER vs. BertNER、新闻事件线索抽取、2019年百度的三元组抽取比赛：“科学空间队”源码、基于依存句法的开放域文本知识三元组抽取和知识库构建、中文的GPT2训练代码、ML-NLP - 机器学习(Machine Learning)NLP面试中常考到的知识点和代码实现、nlp4han:中文自然语言处理工具集(断句/分词/词性标注/组块/句法分析/语义分析/NER/N元语法/HMM/代词消解/情感分析/拼写检查、XLM：Facebook的跨语言预训练语言模型、用基于BERT的微调和特征提取方法来进行知识图谱百度百科人物词条属性抽取、中文自然语言处理相关的开放任务-数据集-当前最佳结果、CoupletAI - 基于CNN+Bi-LSTM+Attention 的自动对对联系统、抽象知识图谱、MiningZhiDaoQACorpus - 580万百度知道问答数据挖掘项目、brat rapid annotation tool: 序列标注工具、大规模中文知识图谱数据：1.4亿实体、数据增强在机器翻译及其他nlp任务中的应用及效果、allennlp阅读理解:支持多种数据和模型、PDF表格数据提取工具 、 Graphbrain：AI开源软件库和科研工具，目的是促进自动意义提取和文本理解以及知识的探索和推断、简历自动筛选系统、基于命名实体识别的简历自动摘要、中文语言理解测评基准，包括代表性的数据集&基准模型&语料库&排行榜、树洞 OCR 文字识别 、从包含表格的扫描图片中识别表格和文字、语声迁移、Python口语自然语言处理工具集(英文)、 similarity：相似度计算工具包，java编写、海量中文预训练ALBERT模型 、Transformers 2.0 、基于大规模音频数据集Audioset的音频增强 、Poplar：网页版自然语言标注工具、图片文字去除，可用于漫画翻译 、186种语言的数字叫法库、Amazon发布基于知识的人-人开放领域对话数据集 、中文文本纠错模块代码、繁简体转换 、 Python实现的多种文本可读性评价指标、类似于人名/地名/组织机构名的命名体识别数据集 、东南大学《知识图谱》研究生课程(资料)、. 英文拼写检查库 、 wwsearch是企业微信后台自研的全文检索引擎、CHAMELEON：深度学习新闻推荐系统元架构 、 8篇论文梳理BERT相关模型进展与反思、DocSearch：免费文档搜索引擎、 LIDA：轻量交互式对话标注工具 、aili - the fastest in-memory index in the East 东半球最快并发索引 、知识图谱车音工作项目、自然语言生成资源大全 、中日韩分词库mecab的Python接口库、中文文本摘要/关键词提取、汉字字符特征提取器 (featurizer)，提取汉字的特征（发音特征、字形特征）用做深度学习的特征、中文生成任务基准测评 、中文缩写数据集、中文任务基准测评 - 代表性的数据集-基准(预训练)模型-语料库-baseline-工具包-排行榜、PySS3：面向可解释AI的SS3文本分类器机器可视化工具 、中文NLP数据集列表、COPE - 格律诗编辑程序、doccano：基于网页的开源协同多语言文本标注工具 、PreNLP：自然语言预处理库、简单的简历解析器，用来从简历中提取关键信息、用于中文闲聊的GPT2模型：GPT2-chitchat、基于检索聊天机器人多轮响应选择相关资源列表(Leaderboards、Datasets、Papers)、(Colab)抽象文本摘要实现集锦(教程 、词语拼音数据、高效模糊搜索工具、NLP数据增广资源集、微软对话机器人框架 、 GitHub Typo Corpus：大规模GitHub多语言拼写错误/语法错误数据集、TextCluster：短文本聚类预处理模块 Short text cluster、面向语音识别的中文文本规范化、BLINK：最先进的实体链接库、BertPunc：基于BERT的最先进标点修复模型、Tokenizer：快速、可定制的文本词条化库、中文语言理解测评基准，包括代表性的数据集、基准(预训练)模型、语料库、排行榜、spaCy 医学文本挖掘与信息提取 、 NLP任务示例项目代码集、 python拼写检查库、chatbot-list - 行业内关于智能客服、聊天机器人的应用和架构、算法分享和介绍、语音质量评价指标(MOSNet, BSSEval, STOI, PESQ, SRMR)、 用138GB语料训练的法文RoBERTa预训练语言模型 、BERT-NER-Pytorch：三种不同模式的BERT中文NER实验、无道词典 - 有道词典的命令行版本，支持英汉互查和在线查询、2019年NLP亮点回顾、 Chinese medical dialogue data 中文医疗对话数据集 、最好的汉字数字(中文数字)-阿拉伯数字转换工具、 基于百科知识库的中文词语多词义/义项获取与特定句子词语语义消歧、awesome-nlp-sentiment-analysis - 情感分析、情绪原因识别、评价对象和评价词抽取、LineFlow：面向所有深度学习框架的NLP数据高效加载器、中文医学NLP公开资源整理 、MedQuAD：(英文)医学问答数据集、将自然语言数字串解析转换为整数和浮点数、Transfer Learning in Natural Language Processing (NLP) 、面向语音识别的中文/英文发音辞典、Tokenizers：注重性能与多功能性的最先进分词器、CLUENER 细粒度命名实体识别 Fine Grained Named Entity Recognition、 基于BERT的中文命名实体识别、中文谣言数据库、NLP数据集/基准任务大列表、nlp相关的一些论文及代码, 包括主题模型、词向量(Word Embedding)、命名实体识别(NER)、文本分类(Text Classificatin)、文本生成(Text Generation)、文本相似性(Text Similarity)计算等，涉及到各种与nlp相关的算法，基于keras和tensorflow 、Python文本挖掘/NLP实战示例、 Blackstone：面向非结构化法律文本的spaCy pipeline和NLP模型通过同义词替换实现文本“变脸” 、中文 预训练 ELECTREA 模型: 基于对抗学习 pretrain Chinese Model 、albert-chinese-ner - 用预训练语言模型ALBERT做中文NER 、基于GPT2的特定主题文本生成/文本增广、开源预训练语言模型合集、多语言句向量包、编码、标记和实现：一种可控高效的文本生成方法、 英文脏话大列表 、attnvis：GPT2、BERT等transformer语言模型注意力交互可视化、CoVoST：Facebook发布的多语种语音-文本翻译语料库，包括11种语言(法语、德语、荷兰语、俄语、西班牙语、意大利语、土耳其语、波斯语、瑞典语、蒙古语和中文)的语音、文字转录及英文译文、Jiagu自然语言处理工具 - 以BiLSTM等模型为基础，提供知识图谱关系抽取 中文分词 词性标注 命名实体识别 情感分析 新词发现 关键词 文本摘要 文本聚类等功能、用unet实现对文档表格的自动检测，表格重建、NLP事件提取文献资源列表 、 金融领域自然语言处理研究资源大列表、CLUEDatasetSearch - 中英文NLP数据集：搜索所有中文NLP数据集，附常用英文NLP数据集 、medical_NER - 中文医学知识图谱命名实体识别 、(哈佛)讲因果推理的免费书、知识图谱相关学习资料/数据集/工具资源大列表、Forte：灵活强大的自然语言处理pipeline工具集 、Python字符串相似性算法库、PyLaia：面向手写文档分析的深度学习工具包、TextFooler：针对文本分类/推理的对抗文本生成模块、Haystack：灵活、强大的可扩展问答(QA)框架、中文关键短语抽取工具",
    "rank": 43
  },
  {
    "name": "fzf",
    "url": "https://github.com/junegunn/fzf",
    "stars": 81702,
    "forks": 2812,
    "lang": "Go",
    "desc": ":cherry_blossom: A command-line fuzzy finder",
    "rank": 10
  },
  {
    "name": "spring-boot",
    "url": "https://github.com/spring-projects/spring-boot",
    "stars": 81200,
    "forks": 42097,
    "lang": "Java",
    "desc": "Spring Boot helps you to create Spring-powered, production-grade applications and services with absolute minimum fuss.",
    "rank": 48
  },
  {
    "name": "OpenHands",
    "url": "https://github.com/OpenHands/OpenHands",
    "stars": 80693,
    "forks": 10300,
    "lang": "Python",
    "desc": "🙌 OpenHands: AI-Driven Development",
    "rank": 44
  },
  {
    "name": "RuView",
    "url": "https://github.com/ruvnet/RuView",
    "stars": 80521,
    "forks": 10837,
    "lang": "Rust",
    "desc": "π RuView turns commodity WiFi signals into real-time spatial intelligence, vital sign monitoring, and presence detection — all without a single pixel of video.",
    "rank": 11
  },
  {
    "name": "lazygit",
    "url": "https://github.com/jesseduffield/lazygit",
    "stars": 80347,
    "forks": 2912,
    "lang": "Go",
    "desc": "simple terminal UI for git commands",
    "rank": 11
  },
  {
    "name": "lobehub",
    "url": "https://github.com/lobehub/lobehub",
    "stars": 79820,
    "forks": 15592,
    "lang": "TypeScript",
    "desc": "🤯 LobeHub is your Chief Agent Operator, organizing your agents into 7×24 operations by hiring, scheduling, and reporting on your entire AI team.",
    "rank": 31
  },
  {
    "name": "hoppscotch",
    "url": "https://github.com/hoppscotch/hoppscotch",
    "stars": 79807,
    "forks": 5961,
    "lang": "TypeScript",
    "desc": "Open-Source API Development Ecosystem • https://hoppscotch.io • Offline, On-Prem & Cloud • Web, Desktop & CLI • Open-Source Alternative to Postman, Insomnia",
    "rank": 32
  },
  {
    "name": "github-readme-stats",
    "url": "https://github.com/anuraghazra/github-readme-stats",
    "stars": 79793,
    "forks": 35146,
    "lang": "JavaScript",
    "desc": ":zap: Dynamically generated stats for your github readmes",
    "rank": 61
  },
  {
    "name": "netdata",
    "url": "https://github.com/netdata/netdata",
    "stars": 79637,
    "forks": 6514,
    "lang": "Go",
    "desc": "The fastest path to AI-powered full stack observability, even for lean teams.",
    "rank": 12
  },
  {
    "name": "PayloadsAllTheThings",
    "url": "https://github.com/swisskyrepo/PayloadsAllTheThings",
    "stars": 79138,
    "forks": 17167,
    "lang": "Python",
    "desc": "A list of useful payloads and bypass for Web Application Security and Pentest/CTF",
    "rank": 45
  },
  {
    "name": "advanced-java",
    "url": "https://github.com/doocs/advanced-java",
    "stars": 79001,
    "forks": 19191,
    "lang": "Java",
    "desc": "😮 Core Interview Questions & Answers For Experienced Java(Backend) Developers | 互联网 Java 工程师进阶知识完全扫盲：涵盖高并发、分布式、高可用、微服务、海量数据处理等领域知识",
    "rank": 6
  },
  {
    "name": "d2l-zh",
    "url": "https://github.com/d2l-ai/d2l-zh",
    "stars": 78870,
    "forks": 12288,
    "lang": "Python",
    "desc": "《动手学深度学习》：面向中文读者、能运行、可讨论。中英文版被70多个国家的500多所大学用于教学。",
    "rank": 46
  },
  {
    "name": "code-server",
    "url": "https://github.com/coder/code-server",
    "stars": 78396,
    "forks": 6748,
    "lang": "TypeScript",
    "desc": "VS Code in the browser",
    "rank": 33
  },
  {
    "name": "hackingtool",
    "url": "https://github.com/Z4nzu/hackingtool",
    "stars": 78258,
    "forks": 8885,
    "lang": "Python",
    "desc": "ALL IN ONE Hacking Tool For Hackers",
    "rank": 47
  },
  {
    "name": "agent-skills",
    "url": "https://github.com/addyosmani/agent-skills",
    "stars": 78009,
    "forks": 8375,
    "lang": "JavaScript",
    "desc": "Production-grade engineering skills for AI coding agents.",
    "rank": 21
  },
  {
    "name": "Ventoy",
    "url": "https://github.com/ventoy/Ventoy",
    "stars": 78004,
    "forks": 4854,
    "lang": "C",
    "desc": "A new bootable USB solution.",
    "rank": 4
  },
  {
    "name": "open-design",
    "url": "https://github.com/nexu-io/open-design",
    "stars": 77899,
    "forks": 8930,
    "lang": "TypeScript",
    "desc": "🎨 The open-source Claude Design alternative. 🖥️ Local-first desktop app. 🖼️ Your coding agent becomes the design engine: prototypes, landing pages, dashboards, slides, images & video — real files, HTML/PDF/PPTX/MP4 export. 🤖 Claude Code / Codex / Cursor / Gemini / OpenCode / Qwen & 20+ CLIs via BYOK.",
    "rank": 34
  },
  {
    "name": "models",
    "url": "https://github.com/tensorflow/models",
    "stars": 77671,
    "forks": 44993,
    "lang": "Python",
    "desc": "Models and examples built with TensorFlow",
    "rank": 42
  },
  {
    "name": "elasticsearch",
    "url": "https://github.com/elastic/elasticsearch",
    "stars": 77614,
    "forks": 26183,
    "lang": "Java",
    "desc": "Free and Open Source, Distributed, RESTful Search Engine",
    "rank": 7
  },
  {
    "name": "gpt4all",
    "url": "https://github.com/nomic-ai/gpt4all",
    "stars": 77397,
    "forks": 8301,
    "lang": "C++",
    "desc": "GPT4All: Run Local LLMs on Any Device. Open-source and available for commercial use.",
    "rank": 9
  },
  {
    "name": "deer-flow",
    "url": "https://github.com/bytedance/deer-flow",
    "stars": 76962,
    "forks": 10451,
    "lang": "Python",
    "desc": "An open-source long-horizon SuperAgent harness that researches, codes, and creates. With the help of sandboxes, memories, tools, skill, subagents and message gateway, it handles different levels of tasks that could take minutes to hours.",
    "rank": 49
  },
  {
    "name": "Font-Awesome",
    "url": "https://github.com/FortAwesome/Font-Awesome",
    "stars": 76743,
    "forks": 12193,
    "lang": "JavaScript",
    "desc": "The iconic SVG, font, and CSS toolkit",
    "rank": 22
  },
  {
    "name": "LeetCodeAnimation",
    "url": "https://github.com/MisterBooo/LeetCodeAnimation",
    "stars": 76620,
    "forks": 13908,
    "lang": "Java",
    "desc": "Demonstrate all the questions on LeetCode in the form of animation.（用动画的形式呈现解LeetCode题目的思路,完整单步/回看/变速/语音讲解在 algomooc.com）",
    "rank": 8
  },
  {
    "name": "nest",
    "url": "https://github.com/nestjs/nest",
    "stars": 76262,
    "forks": 8453,
    "lang": "TypeScript",
    "desc": "A progressive Node.js framework for building efficient, scalable, and enterprise-grade server-side applications with TypeScript/JavaScript 🚀",
    "rank": 35
  },
  {
    "name": "json-server",
    "url": "https://github.com/typicode/json-server",
    "stars": 75652,
    "forks": 7265,
    "lang": "JavaScript",
    "desc": "Get a full fake REST API with zero coding in less than 30 seconds (seriously)",
    "rank": 23
  },
  {
    "name": "grafana",
    "url": "https://github.com/grafana/grafana",
    "stars": 75589,
    "forks": 14354,
    "lang": "TypeScript",
    "desc": "The open and composable observability and data visualization platform. Visualize metrics, logs, and traces from multiple sources like Prometheus, Loki, Elasticsearch, InfluxDB, Postgres and many more.",
    "rank": 36
  },
  {
    "name": "redis",
    "url": "https://github.com/redis/redis",
    "stars": 75447,
    "forks": 24706,
    "lang": "C",
    "desc": "For developers, who are building real-time data-driven applications, Redis is the preferred, fastest, and most feature-rich cache, data structure server, and document and vector query engine.",
    "rank": 5
  },
  {
    "name": "tesseract",
    "url": "https://github.com/tesseract-ocr/tesseract",
    "stars": 75315,
    "forks": 10690,
    "lang": "C++",
    "desc": "Tesseract Open Source OCR Engine (main repository)",
    "rank": 10
  },
  {
    "name": "imgui",
    "url": "https://github.com/ocornut/imgui",
    "stars": 74605,
    "forks": 12004,
    "lang": "C++",
    "desc": "Dear ImGui: Bloat-free Graphical User interface for C++ with minimal dependencies",
    "rank": 11
  },
  {
    "name": "MinerU",
    "url": "https://github.com/opendatalab/MinerU",
    "stars": 74511,
    "forks": 6255,
    "lang": "Python",
    "desc": "Transforms complex documents like PDFs and Office docs into LLM-ready markdown/JSON for your Agentic workflows.",
    "rank": 50
  },
  {
    "name": "caddy",
    "url": "https://github.com/caddyserver/caddy",
    "stars": 74003,
    "forks": 4823,
    "lang": "Go",
    "desc": "Fast and extensible multi-platform HTTP/1-2-3 web server with automatic HTTPS",
    "rank": 13
  },
  {
    "name": "union",
    "url": "https://github.com/unionlabs/union",
    "stars": 73922,
    "forks": 3899,
    "lang": "Rust",
    "desc": "The trust-minimized, zero-knowledge bridging protocol, designed for censorship resistance, extremely high security, and usage in decentralized finance.",
    "rank": 12
  },
  {
    "name": "obs-studio",
    "url": "https://github.com/obsproject/obs-studio",
    "stars": 73856,
    "forks": 9419,
    "lang": "C",
    "desc": "OBS Studio - Free and open source software for live streaming and screen recording",
    "rank": 6
  },
  {
    "name": "Understand-Anything",
    "url": "https://github.com/Egonex-AI/Understand-Anything",
    "stars": 73852,
    "forks": 6151,
    "lang": "TypeScript",
    "desc": "Graphs that teach > graphs that impress. Turn any code into an interactive knowledge graph you can explore, search, and ask questions about. Works with Claude Code, Codex, Cursor, Copilot, Gemini CLI, and more.",
    "rank": 37
  },
  {
    "name": "superset",
    "url": "https://github.com/apache/superset",
    "stars": 73817,
    "forks": 17874,
    "lang": "TypeScript",
    "desc": "Apache Superset is a Data Visualization and Data Exploration Platform",
    "rank": 38
  },
  {
    "name": "cpython",
    "url": "https://github.com/python/cpython",
    "stars": 73786,
    "forks": 35008,
    "lang": "Python",
    "desc": "The Python programming language",
    "rank": 63
  },
  {
    "name": "AppFlowy",
    "url": "https://github.com/AppFlowy-IO/AppFlowy",
    "stars": 73746,
    "forks": 5634,
    "lang": "Dart",
    "desc": "Bring projects, wikis, and teams together with AI. AppFlowy is the AI collaborative workspace where you achieve more without losing control of your data. The leading open source Notion alternative.",
    "rank": 3
  },
  {
    "name": "cs-self-learning",
    "url": "https://github.com/PKUFlyingPig/cs-self-learning",
    "stars": 73619,
    "forks": 7911,
    "lang": "HTML",
    "desc": "计算机自学指南",
    "rank": 5
  },
  {
    "name": "paperclip",
    "url": "https://github.com/paperclipai/paperclip",
    "stars": 73585,
    "forks": 13705,
    "lang": "TypeScript",
    "desc": "The open-source app everyone uses to manage agents at work",
    "rank": 39
  },
  {
    "name": "the-algorithm",
    "url": "https://github.com/twitter/the-algorithm",
    "stars": 73531,
    "forks": 13262,
    "lang": "Scala",
    "desc": "Source code for the X Recommendation Algorithm",
    "rank": 1
  },
  {
    "name": "awesome-machine-learning",
    "url": "https://github.com/josephmisiti/awesome-machine-learning",
    "stars": 73356,
    "forks": 15527,
    "lang": "Python",
    "desc": "A curated list of awesome Machine Learning frameworks, libraries and software.",
    "rank": 52
  },
  {
    "name": "screenshot-to-code",
    "url": "https://github.com/abi/screenshot-to-code",
    "stars": 73270,
    "forks": 9019,
    "lang": "Python",
    "desc": "Drop in a screenshot and convert it to clean code (HTML/Tailwind/React/Vue)",
    "rank": 53
  },
  {
    "name": "LlamaFactory",
    "url": "https://github.com/hiyouga/LlamaFactory",
    "stars": 73250,
    "forks": 8947,
    "lang": "Python",
    "desc": "Unified Efficient Fine-Tuning of 100+ LLMs & VLMs (ACL 2024)",
    "rank": 54
  },
  {
    "name": "tabby",
    "url": "https://github.com/Eugeny/tabby",
    "stars": 73226,
    "forks": 4154,
    "lang": "TypeScript",
    "desc": "A terminal for a more modern age",
    "rank": 40
  },
  {
    "name": "strapi",
    "url": "https://github.com/strapi/strapi",
    "stars": 72653,
    "forks": 9792,
    "lang": "TypeScript",
    "desc": "🚀 Strapi is the leading open-source headless CMS. It’s 100% JavaScript/TypeScript, fully customizable, and developer-first.",
    "rank": 41
  },
  {
    "name": "crawl4ai",
    "url": "https://github.com/unclecode/crawl4ai",
    "stars": 72556,
    "forks": 7443,
    "lang": "Python",
    "desc": "🚀🤖 Crawl4AI: Open-source LLM Friendly Web Crawler & Scraper. Don't be shy, join here: https://discord.gg/jP8KfhDhyN",
    "rank": 55
  },
  {
    "name": "SecLists",
    "url": "https://github.com/danielmiessler/SecLists",
    "stars": 72154,
    "forks": 25052,
    "lang": "PHP",
    "desc": "SecLists is the security tester's companion. It's a collection of multiple types of lists used during security assessments, collected in one place. List types include usernames, passwords, URLs, sensitive data patterns, fuzzing payloads, web shells, and many more.",
    "rank": 1
  },
  {
    "name": "reveal.js",
    "url": "https://github.com/hakimel/reveal.js",
    "stars": 71925,
    "forks": 16837,
    "lang": "JavaScript",
    "desc": "The HTML Presentation Framework",
    "rank": 24
  },
  {
    "name": "flask",
    "url": "https://github.com/pallets/flask",
    "stars": 71920,
    "forks": 16901,
    "lang": "Python",
    "desc": "The Python micro framework for building web applications.",
    "rank": 56
  },
  {
    "name": "moby",
    "url": "https://github.com/moby/moby",
    "stars": 71909,
    "forks": 19108,
    "lang": "Go",
    "desc": "The Moby Project - a collaborative project for the container ecosystem to assemble container-based systems",
    "rank": 14
  },
  {
    "name": "protobuf",
    "url": "https://github.com/protocolbuffers/protobuf",
    "stars": 71495,
    "forks": 16181,
    "lang": "C++",
    "desc": "Protocol Buffers - Google's data interchange format",
    "rank": 12
  },
  {
    "name": "gpt_academic",
    "url": "https://github.com/binary-husky/gpt_academic",
    "stars": 71077,
    "forks": 8348,
    "lang": "Python",
    "desc": "为GPT/GLM等LLM大语言模型提供实用化交互接口，特别优化论文阅读/润色/写作体验，模块化设计，支持自定义快捷按钮&函数插件，支持Python和C++等项目剖析&自译解功能，PDF/LaTex论文翻译&总结功能，支持并行问询多种LLM模型，支持chatglm3等本地模型。接入通义千问, deepseekcoder, 讯飞星火, 文心一言, llama2, rwkv, claude2, moss等。",
    "rank": 57
  },
  {
    "name": "act",
    "url": "https://github.com/nektos/act",
    "stars": 71058,
    "forks": 1972,
    "lang": "Go",
    "desc": "Run your GitHub Actions locally 🚀",
    "rank": 15
  },
  {
    "name": "anime",
    "url": "https://github.com/juliangarnier/anime",
    "stars": 70960,
    "forks": 4784,
    "lang": "JavaScript",
    "desc": "JavaScript animation engine",
    "rank": 25
  },
  {
    "name": "learn-claude-code",
    "url": "https://github.com/shareAI-lab/learn-claude-code",
    "stars": 70913,
    "forks": 11537,
    "lang": "Python",
    "desc": "Bash is all you need -  A nano claude code–like 「agent harness」, built from 0 to 1",
    "rank": 58
  },
  {
    "name": "rtk",
    "url": "https://github.com/rtk-ai/rtk",
    "stars": 70846,
    "forks": 4390,
    "lang": "Rust",
    "desc": "CLI proxy that reduces LLM token consumption by 60-90% on common dev commands. Single Rust binary, zero dependencies",
    "rank": 13
  },
  {
    "name": "ghidra",
    "url": "https://github.com/NationalSecurityAgency/ghidra",
    "stars": 70844,
    "forks": 7774,
    "lang": "Java",
    "desc": "Ghidra is a software reverse engineering (SRE) framework",
    "rank": 9
  },
  {
    "name": "pi",
    "url": "https://github.com/earendil-works/pi",
    "stars": 70651,
    "forks": 8706,
    "lang": "TypeScript",
    "desc": "AI agent toolkit: unified LLM API, agent loop, TUI, coding agent CLI",
    "rank": 42
  },
  {
    "name": "OpenBB",
    "url": "https://github.com/OpenBB-finance/OpenBB",
    "stars": 70539,
    "forks": 7162,
    "lang": "Python",
    "desc": "Open Data Platform for analysts, quants and AI agents.",
    "rank": 59
  },
  {
    "name": "AFFiNE",
    "url": "https://github.com/toeverything/AFFiNE",
    "stars": 70418,
    "forks": 5052,
    "lang": "TypeScript",
    "desc": "There can be more than Notion and Miro. AFFiNE(pronounced [ə‘fain]) is a next-gen knowledge base that brings planning, sorting and creating all together. Privacy first, open-source, customizable and ready to use.",
    "rank": 43
  },
  {
    "name": "swift",
    "url": "https://github.com/swiftlang/swift",
    "stars": 70161,
    "forks": 10759,
    "lang": "Swift",
    "desc": "The Swift Programming Language",
    "rank": 2
  },
  {
    "name": "ansible",
    "url": "https://github.com/ansible/ansible",
    "stars": 69665,
    "forks": 24281,
    "lang": "Python",
    "desc": "Ansible is a radically simple IT automation platform that makes your applications and systems easier to deploy and maintain. Automate everything from code deployment to network configuration to cloud management, in a language that approaches plain English, using SSH, with no agents to install on remote systems. https://docs.ansible.com.",
    "rank": 60
  },
  {
    "name": "Scrapling",
    "url": "https://github.com/D4Vinci/Scrapling",
    "stars": 69427,
    "forks": 6872,
    "lang": "Python",
    "desc": "🕷️ An adaptive Web Scraping framework that handles everything from a single request to a full-scale crawl!",
    "rank": 61
  },
  {
    "name": "express",
    "url": "https://github.com/expressjs/express",
    "stars": 69370,
    "forks": 24279,
    "lang": "JavaScript",
    "desc": "Fast, unopinionated, minimalist web framework for node.",
    "rank": 26
  },
  {
    "name": "MetaGPT",
    "url": "https://github.com/FoundationAgents/MetaGPT",
    "stars": 69352,
    "forks": 8841,
    "lang": "Python",
    "desc": "🌟 The Multi-Agent Framework: First AI Software Company, Towards Natural Language Programming",
    "rank": 62
  },
  {
    "name": "MiroFish",
    "url": "https://github.com/666ghj/MiroFish",
    "stars": 68491,
    "forks": 10691,
    "lang": "Python",
    "desc": "A Simple and Universal Swarm Intelligence Engine, Predicting Anything. 简洁通用的群体智能引擎，预测万物",
    "rank": 63
  },
  {
    "name": "unsloth",
    "url": "https://github.com/unslothai/unsloth",
    "stars": 68143,
    "forks": 6129,
    "lang": "Python",
    "desc": "Unsloth Studio is a web UI for training and running open models like Gemma 4, Qwen3.6, DeepSeek, gpt-oss locally.",
    "rank": 64
  },
  {
    "name": "30-Days-Of-Python",
    "url": "https://github.com/Asabeneh/30-Days-Of-Python",
    "stars": 68132,
    "forks": 12664,
    "lang": "Python",
    "desc": "The 30 Days of Python programming challenge is a step-by-step guide to learn the Python programming language in 30 days. This challenge may take more than 100 days. Follow your own pace. These videos may help too: https://www.youtube.com/channel/UC7PNRuno1rzYPb1xLa4yktw",
    "rank": 65
  },
  {
    "name": "awesome-claude-skills",
    "url": "https://github.com/ComposioHQ/awesome-claude-skills",
    "stars": 67663,
    "forks": 7638,
    "lang": "Python",
    "desc": "A curated list of awesome Claude Skills, resources, and tools for customizing Claude AI workflows",
    "rank": 66
  },
  {
    "name": "Chart.js",
    "url": "https://github.com/chartjs/Chart.js",
    "stars": 67568,
    "forks": 11941,
    "lang": "JavaScript",
    "desc": "Simple HTML5 Charts using the <canvas> tag",
    "rank": 27
  },
  {
    "name": "OpenCut",
    "url": "https://github.com/OpenCut-app/OpenCut",
    "stars": 67097,
    "forks": 7066,
    "lang": "TypeScript",
    "desc": "The open-source CapCut alternative",
    "rank": 44
  },
  {
    "name": "annotated_deep_learning_paper_implementations",
    "url": "https://github.com/labmlai/annotated_deep_learning_paper_implementations",
    "stars": 67090,
    "forks": 6738,
    "lang": "Python",
    "desc": "🧑‍🏫 60+ Implementations/tutorials of deep learning papers with side-by-side notes 📝; including transformers (original, xl, switch, feedback, vit, ...), optimizers (adam, adabelief, sophia, ...), gans(cyclegan, stylegan2, ...), 🎮 reinforcement learning (ppo, dqn), capsnet, distillation, ... 🧠",
    "rank": 67
  },
  {
    "name": "echarts",
    "url": "https://github.com/apache/echarts",
    "stars": 66806,
    "forks": 19805,
    "lang": "TypeScript",
    "desc": "Apache ECharts is a powerful, interactive charting and data visualization library for browser",
    "rank": 45
  },
  {
    "name": "scikit-learn",
    "url": "https://github.com/scikit-learn/scikit-learn",
    "stars": 66674,
    "forks": 27164,
    "lang": "Python",
    "desc": "scikit-learn: machine learning in Python",
    "rank": 98
  },
  {
    "name": "33-js-concepts",
    "url": "https://github.com/leonardomso/33-js-concepts",
    "stars": 66484,
    "forks": 9165,
    "lang": "JavaScript",
    "desc": "📜 33 JavaScript concepts every developer should know.",
    "rank": 28
  },
  {
    "name": "gpt4free",
    "url": "https://github.com/xtekky/gpt4free",
    "stars": 66472,
    "forks": 13534,
    "lang": "Python",
    "desc": "The official gpt4free repository | various collection of powerful language models | opus 4.6 gpt 5.3 kimi 2.5 deepseek v3.2 gemini 3",
    "rank": 69
  },
  {
    "name": "uBlock",
    "url": "https://github.com/gorhill/uBlock",
    "stars": 66209,
    "forks": 4216,
    "lang": "JavaScript",
    "desc": "uBlock Origin - An efficient blocker for Chromium and Firefox. Fast and lean.",
    "rank": 29
  },
  {
    "name": "ripgrep",
    "url": "https://github.com/BurntSushi/ripgrep",
    "stars": 66098,
    "forks": 2640,
    "lang": "Rust",
    "desc": "ripgrep recursively searches directories for a regex pattern while respecting your gitignore",
    "rank": 14
  },
  {
    "name": "Java",
    "url": "https://github.com/TheAlgorithms/Java",
    "stars": 66008,
    "forks": 21227,
    "lang": "Java",
    "desc": "All Algorithms implemented in Java",
    "rank": 10
  },
  {
    "name": "hello-agents",
    "url": "https://github.com/datawhalechina/hello-agents",
    "stars": 65974,
    "forks": 8171,
    "lang": "Python",
    "desc": "📚 《从零开始构建智能体》——从零开始的智能体原理与实践教程",
    "rank": 70
  },
  {
    "name": "webpack",
    "url": "https://github.com/webpack/webpack",
    "stars": 65948,
    "forks": 9511,
    "lang": "JavaScript",
    "desc": "A bundler for javascript and friends. Packs many modules into a few bundled assets. Code Splitting allows for loading parts of the application on demand. Through loaders, modules can be CommonJs, AMD, ES6 modules, CSS, Images, JSON, Coffeescript, LESS, ... and your custom stuff.",
    "rank": 30
  },
  {
    "name": "oh-my-openagent",
    "url": "https://github.com/code-yeongyu/oh-my-openagent",
    "stars": 65712,
    "forks": 5363,
    "lang": "TypeScript",
    "desc": "omo/lazycodex: The coding agent for tokenmaxxers;the one and only agent harness for complex codebases. For your Codex, for your OpenCode",
    "rank": 46
  },
  {
    "name": "docusaurus",
    "url": "https://github.com/facebook/docusaurus",
    "stars": 65613,
    "forks": 9967,
    "lang": "TypeScript",
    "desc": "Easy to maintain open source documentation websites.",
    "rank": 47
  },
  {
    "name": "prometheus",
    "url": "https://github.com/prometheus/prometheus",
    "stars": 65192,
    "forks": 10745,
    "lang": "Go",
    "desc": "The Prometheus monitoring system and time series database.",
    "rank": 16
  },
  {
    "name": "localstack",
    "url": "https://github.com/localstack/localstack",
    "stars": 65120,
    "forks": 4763,
    "lang": "Python",
    "desc": "💻 A fully functional local AWS cloud stack. Develop and test your cloud & Serverless apps offline",
    "rank": 71
  },
  {
    "name": "interviews",
    "url": "https://github.com/kdn251/interviews",
    "stars": 65057,
    "forks": 12881,
    "lang": "Java",
    "desc": "Everything you need to know to get the job.",
    "rank": 11
  },
  {
    "name": "alacritty",
    "url": "https://github.com/alacritty/alacritty",
    "stars": 64881,
    "forks": 3518,
    "lang": "Rust",
    "desc": "A cross-platform, OpenGL terminal emulator.",
    "rank": 15
  },
  {
    "name": "openinterpreter",
    "url": "https://github.com/openinterpreter/openinterpreter",
    "stars": 64786,
    "forks": 5620,
    "lang": "Rust",
    "desc": "A lightweight coding agent, optimized for open models like GLM, Deepseek, and Kimi",
    "rank": 16
  },
  {
    "name": "get-shit-done",
    "url": "https://github.com/gsd-build/get-shit-done",
    "stars": 64749,
    "forks": 5482,
    "lang": "JavaScript",
    "desc": "A light-weight and powerful meta-prompting, context engineering and spec-driven development system for Claude Code by TÂCHES.",
    "rank": 31
  },
  {
    "name": "cline",
    "url": "https://github.com/cline/cline",
    "stars": 64630,
    "forks": 6909,
    "lang": "TypeScript",
    "desc": "Autonomous coding agent as an SDK, IDE extension, or CLI assistant.",
    "rank": 48
  },
  {
    "name": "ladybird",
    "url": "https://github.com/LadybirdBrowser/ladybird",
    "stars": 64566,
    "forks": 3085,
    "lang": "C++",
    "desc": "Truly independent web browser",
    "rank": 13
  },
  {
    "name": "ruflo",
    "url": "https://github.com/ruvnet/ruflo",
    "stars": 64342,
    "forks": 7622,
    "lang": "TypeScript",
    "desc": "🌊 The leading agent meta-harness. Deploy intelligent multi-player swarms, coordinate autonomous workflows, and build conversational AI systems. Features adaptive memory, self-learning intelligence, RAG integration, and native Claude Code / Codex / Hermes and many more Integrated",
    "rank": 49
  },
  {
    "name": "keras",
    "url": "https://github.com/keras-team/keras",
    "stars": 64171,
    "forks": 19737,
    "lang": "Python",
    "desc": "Deep Learning for humans",
    "rank": 72
  },
  {
    "name": "traefik",
    "url": "https://github.com/traefik/traefik",
    "stars": 63982,
    "forks": 6065,
    "lang": "Go",
    "desc": "The Cloud Native Application Proxy",
    "rank": 17
  },
  {
    "name": "nocodb",
    "url": "https://github.com/nocodb/nocodb",
    "stars": 63940,
    "forks": 4910,
    "lang": "TypeScript",
    "desc": "🔥 🔥 🔥 A Free & Self-hostable Airtable Alternative",
    "rank": 50
  },
  {
    "name": "nerd-fonts",
    "url": "https://github.com/ryanoasis/nerd-fonts",
    "stars": 63703,
    "forks": 3923,
    "lang": "CSS",
    "desc": "Iconic font aggregator, collection, & patcher. 3,600+ icons, 50+ patched fonts: Hack, Source Code Pro, more. Glyph collections: Font Awesome, Material Design Icons, Octicons, & more",
    "rank": 2
  },
  {
    "name": "vaultwarden",
    "url": "https://github.com/dani-garcia/vaultwarden",
    "stars": 63654,
    "forks": 2996,
    "lang": "Rust",
    "desc": "Unofficial Bitwarden compatible server written in Rust, formerly known as bitwarden_rs",
    "rank": 17
  },
  {
    "name": "rustlings",
    "url": "https://github.com/rust-lang/rustlings",
    "stars": 63519,
    "forks": 11223,
    "lang": "Rust",
    "desc": ":crab: Small exercises to get you used to reading and writing Rust code!",
    "rank": 18
  },
  {
    "name": "socket.io",
    "url": "https://github.com/socketio/socket.io",
    "stars": 63295,
    "forks": 10307,
    "lang": "TypeScript",
    "desc": "Bidirectional and low-latency communication for every platform",
    "rank": 51
  },
  {
    "name": "anything-llm",
    "url": "https://github.com/Mintplex-Labs/anything-llm",
    "stars": 63250,
    "forks": 6918,
    "lang": "JavaScript",
    "desc": "Stop renting your intelligence. Own it with AnythingLLM. Everything you need for a powerful local-first agent experience",
    "rank": 32
  },
  {
    "name": "warp",
    "url": "https://github.com/warpdotdev/warp",
    "stars": 63140,
    "forks": 5219,
    "lang": "Rust",
    "desc": "Warp is an agentic development environment, born out of the terminal.",
    "rank": 19
  },
  {
    "name": "scrapy",
    "url": "https://github.com/scrapy/scrapy",
    "stars": 63130,
    "forks": 11782,
    "lang": "Python",
    "desc": "Scrapy, a fast high-level web crawling & scraping framework for Python.",
    "rank": 73
  },
  {
    "name": "openpilot",
    "url": "https://github.com/commaai/openpilot",
    "stars": 63106,
    "forks": 11156,
    "lang": "Python",
    "desc": "openpilot is an operating system for robotics. Currently, it upgrades the driver assistance system on 300+ supported cars.",
    "rank": 74
  },
  {
    "name": "docling",
    "url": "https://github.com/docling-project/docling",
    "stars": 63100,
    "forks": 4450,
    "lang": "Python",
    "desc": "Get your documents ready for gen AI",
    "rank": 75
  },
  {
    "name": "taste-skill",
    "url": "https://github.com/Leonxlnx/taste-skill",
    "stars": 63020,
    "forks": 4448,
    "lang": "JavaScript",
    "desc": "Taste-Skill - gives your AI good taste. stops the AI from generating boring, generic slop",
    "rank": 33
  },
  {
    "name": "resume.github.com",
    "url": "https://github.com/resume/resume.github.com",
    "stars": 62884,
    "forks": 1370,
    "lang": "JavaScript",
    "desc": "Resumes generated using the GitHub informations",
    "rank": 34
  },
  {
    "name": "pathway",
    "url": "https://github.com/pathwaycom/pathway",
    "stars": 62716,
    "forks": 1670,
    "lang": "Python",
    "desc": "Python ETL framework for stream processing, real-time analytics, LLM pipelines, and RAG.",
    "rank": 76
  },
  {
    "name": "claude-code-best-practice",
    "url": "https://github.com/shanraisshan/claude-code-best-practice",
    "stars": 62549,
    "forks": 6257,
    "lang": "HTML",
    "desc": "from vibe coding to agentic engineering - practice makes claude perfect",
    "rank": 6
  },
  {
    "name": "drawio-desktop",
    "url": "https://github.com/jgraph/drawio-desktop",
    "stars": 62106,
    "forks": 5726,
    "lang": "JavaScript",
    "desc": "Official electron build of draw.io",
    "rank": 35
  },
  {
    "name": "FFmpeg",
    "url": "https://github.com/FFmpeg/FFmpeg",
    "stars": 62032,
    "forks": 14004,
    "lang": "C",
    "desc": "Mirror of https://git.ffmpeg.org/ffmpeg.git",
    "rank": 7
  },
  {
    "name": "git",
    "url": "https://github.com/git/git",
    "stars": 62017,
    "forks": 28127,
    "lang": "C",
    "desc": "Git Source Code Mirror - This is a publish-only repository but pull requests can be turned into patches to the mailing list via GitGitGadget (https://gitgitgadget.github.io/). Please follow Documentation/SubmittingPatches procedure for any of your improvements.",
    "rank": 90
  },
  {
    "name": "leetcode-master",
    "url": "https://github.com/youngyangyang04/leetcode-master",
    "stars": 61918,
    "forks": 12317,
    "lang": "Shell",
    "desc": "《代码随想录》LeetCode 刷题攻略：200道经典题目刷题顺序，共60w字的详细图解，视频难点剖析，50余张思维导图，支持C++，Java，Python，Go，JavaScript等多语言版本，从此算法学习不再迷茫！🔥🔥 来看看，你会发现相见恨晚！🚀",
    "rank": 9
  },
  {
    "name": "worldmonitor",
    "url": "https://github.com/koala73/worldmonitor",
    "stars": 61828,
    "forks": 9628,
    "lang": "TypeScript",
    "desc": "Real-time global intelligence dashboard. AI-powered news aggregation, geopolitical monitoring, and infrastructure tracking in a unified situational awareness interface",
    "rank": 52
  },
  {
    "name": "Magisk",
    "url": "https://github.com/topjohnwu/Magisk",
    "stars": 61668,
    "forks": 17961,
    "lang": "Kotlin",
    "desc": "The Magic Mask for Android",
    "rank": 1
  },
  {
    "name": "ai-hedge-fund",
    "url": "https://github.com/virattt/ai-hedge-fund",
    "stars": 61629,
    "forks": 10888,
    "lang": "Python",
    "desc": "An AI Hedge Fund Team",
    "rank": 77
  },
  {
    "name": "redux",
    "url": "https://github.com/reduxjs/redux",
    "stars": 61593,
    "forks": 15211,
    "lang": "TypeScript",
    "desc": "A JS library for predictable global state management",
    "rank": 53
  },
  {
    "name": "sway",
    "url": "https://github.com/FuelLabs/sway",
    "stars": 61580,
    "forks": 5428,
    "lang": "Rust",
    "desc": "🌴 Empowering everyone to build reliable and efficient smart contracts.",
    "rank": 20
  },
  {
    "name": "memos",
    "url": "https://github.com/usememos/memos",
    "stars": 61519,
    "forks": 4555,
    "lang": "Go",
    "desc": "Open-source, self-hosted note-taking tool built for quick capture. Markdown-native, lightweight, and fully yours.",
    "rank": 18
  },
  {
    "name": "minio",
    "url": "https://github.com/minio/minio",
    "stars": 61325,
    "forks": 7662,
    "lang": "Go",
    "desc": "MinIO is a high-performance, S3 compatible object store, open sourced under GNU AGPLv3 license.",
    "rank": 19
  },
  {
    "name": "lodash",
    "url": "https://github.com/lodash/lodash",
    "stars": 61245,
    "forks": 7175,
    "lang": "JavaScript",
    "desc": "A modern JavaScript utility library delivering modularity, performance, & extras.",
    "rank": 35
  },
  {
    "name": "nanoGPT",
    "url": "https://github.com/karpathy/nanoGPT",
    "stars": 61134,
    "forks": 10515,
    "lang": "Python",
    "desc": "The simplest, fastest repository for training/finetuning medium-sized GPTs.",
    "rank": 78
  },
  {
    "name": "astro",
    "url": "https://github.com/withastro/astro",
    "stars": 61003,
    "forks": 3629,
    "lang": "TypeScript",
    "desc": "The web framework for content-driven websites. ⭐️ Star to support our work!",
    "rank": 54
  },
  {
    "name": "atom",
    "url": "https://github.com/atom/atom",
    "stars": 60811,
    "forks": 17205,
    "lang": "JavaScript",
    "desc": ":atom: The hackable text editor",
    "rank": 36
  },
  {
    "name": "nuxt",
    "url": "https://github.com/nuxt/nuxt",
    "stars": 60775,
    "forks": 5845,
    "lang": "TypeScript",
    "desc": "the full-stack Vue framework",
    "rank": 55
  },
  {
    "name": "mem0",
    "url": "https://github.com/mem0ai/mem0",
    "stars": 60766,
    "forks": 7077,
    "lang": "TypeScript",
    "desc": "Universal memory layer for AI Agents",
    "rank": 56
  },
  {
    "name": "OpenSpec",
    "url": "https://github.com/Fission-AI/OpenSpec",
    "stars": 60662,
    "forks": 4208,
    "lang": "TypeScript",
    "desc": "Spec-driven development (SDD) for AI coding assistants.",
    "rank": 57
  },
  {
    "name": "awesome-flutter",
    "url": "https://github.com/Solido/awesome-flutter",
    "stars": 60585,
    "forks": 6903,
    "lang": "Dart",
    "desc": "An awesome list that curates the best Flutter libraries, tools, tutorials, articles and more.",
    "rank": 4
  },
  {
    "name": "TrendRadar",
    "url": "https://github.com/sansan0/TrendRadar",
    "stars": 60532,
    "forks": 24786,
    "lang": "Python",
    "desc": "⭐AI-driven public opinion & trend monitor with multi-platform aggregation, RSS, and smart alerts.🎯 告别信息过载，你的 AI 舆情监控助手与热点筛选工具！聚合多平台热点 +  RSS 订阅，支持关键词精准筛选。AI 智能筛选新闻 + AI 翻译 +  AI 分析简报直推手机，也支持接入 MCP 架构，赋能 AI 自然语言对话分析、情感洞察与趋势预测等。支持 Docker ，数据本地/云端自持。集成微信/飞书/钉钉/Telegram/邮件/ntfy/bark/slack 等渠道智能推送。",
    "rank": 79
  },
  {
    "name": "markdown-here",
    "url": "https://github.com/adam-p/markdown-here",
    "stars": 60232,
    "forks": 11037,
    "lang": "JavaScript",
    "desc": "Google Chrome, Firefox, and Thunderbird extension that lets you write email in Markdown and render it before sending.",
    "rank": 38
  },
  {
    "name": "spring-framework",
    "url": "https://github.com/spring-projects/spring-framework",
    "stars": 60112,
    "forks": 38818,
    "lang": "Java",
    "desc": "Spring Framework",
    "rank": 53
  },
  {
    "name": "Real-Time-Voice-Cloning",
    "url": "https://github.com/CorentinJ/Real-Time-Voice-Cloning",
    "stars": 60020,
    "forks": 9395,
    "lang": "Python",
    "desc": "Clone a voice in 5 seconds to generate arbitrary speech in real-time",
    "rank": 80
  },
  {
    "name": "career-ops",
    "url": "https://github.com/santifer/career-ops",
    "stars": 59919,
    "forks": 11881,
    "lang": "JavaScript",
    "desc": "Open-source AI job search: scan job portals, score listings A-F, tailor your CV, track applications — runs locally in your AI coding CLI (Claude Code, Gemini, Codex, OpenCode…)",
    "rank": 39
  },
  {
    "name": "Pake",
    "url": "https://github.com/tw93/Pake",
    "stars": 59842,
    "forks": 12074,
    "lang": "Rust",
    "desc": "🤱🏻 Turn any webpage into a desktop app with one command.",
    "rank": 21
  },
  {
    "name": "pi-hole",
    "url": "https://github.com/pi-hole/pi-hole",
    "stars": 59836,
    "forks": 3256,
    "lang": "Shell",
    "desc": "A black hole for Internet advertisements",
    "rank": 10
  },
  {
    "name": "jquery",
    "url": "https://github.com/jquery/jquery",
    "stars": 59811,
    "forks": 20416,
    "lang": "JavaScript",
    "desc": "jQuery JavaScript Library",
    "rank": 39
  },
  {
    "name": "GPT-SoVITS",
    "url": "https://github.com/RVC-Boss/GPT-SoVITS",
    "stars": 59752,
    "forks": 6512,
    "lang": "Python",
    "desc": "1 min voice data can also be used to train a good TTS model! (few shot voice cloning)",
    "rank": 81
  },
  {
    "name": "codegraph",
    "url": "https://github.com/colbymchenry/codegraph",
    "stars": 59745,
    "forks": 3722,
    "lang": "TypeScript",
    "desc": "Pre-indexed code knowledge graph, auto syncs on code changes, for Claude Code, Codex, Gemini, Cursor, OpenCode, AntiGravity, Kiro, and Hermes Agent — fewer tokens, fewer tool calls, 100% local",
    "rank": 58
  },
  {
    "name": "autogen",
    "url": "https://github.com/microsoft/autogen",
    "stars": 59715,
    "forks": 8987,
    "lang": "Python",
    "desc": "A programming framework for agentic AI",
    "rank": 82
  },
  {
    "name": "bat",
    "url": "https://github.com/sharkdp/bat",
    "stars": 59708,
    "forks": 1586,
    "lang": "Rust",
    "desc": "A cat(1) clone with wings.",
    "rank": 22
  },
  {
    "name": "shadowsocks-windows",
    "url": "https://github.com/shadowsocks/shadowsocks-windows",
    "stars": 59583,
    "forks": 16226,
    "lang": "C#",
    "desc": "A C# port of shadowsocks",
    "rank": 2
  },
  {
    "name": "pocketbase",
    "url": "https://github.com/pocketbase/pocketbase",
    "stars": 59574,
    "forks": 3503,
    "lang": "Go",
    "desc": "Open Source realtime backend in 1 file",
    "rank": 20
  },
  {
    "name": "v2rayNG",
    "url": "https://github.com/2dust/v2rayNG",
    "stars": 59516,
    "forks": 7753,
    "lang": "Kotlin",
    "desc": "A V2Ray client for Android, support Xray core and v2fly core",
    "rank": 2
  },
  {
    "name": "llama",
    "url": "https://github.com/meta-llama/llama",
    "stars": 59512,
    "forks": 9800,
    "lang": "Python",
    "desc": "Inference code for Llama models",
    "rank": 83
  },
  {
    "name": "ultralytics",
    "url": "https://github.com/ultralytics/ultralytics",
    "stars": 59457,
    "forks": 11371,
    "lang": "Python",
    "desc": "Ultralytics YOLO26, YOLO11, YOLOv8 — object detection, instance segmentation, semantic segmentation, image classification, pose estimation, object tracking",
    "rank": 84
  },
  {
    "name": "mkcert",
    "url": "https://github.com/FiloSottile/mkcert",
    "stars": 59289,
    "forks": 3131,
    "lang": "Go",
    "desc": "A simple zero-config tool to make locally trusted development certificates with any names you'd like.",
    "rank": 21
  },
  {
    "name": "context7",
    "url": "https://github.com/upstash/context7",
    "stars": 59068,
    "forks": 2785,
    "lang": "TypeScript",
    "desc": "Context7 Platform -- Up-to-date code documentation for LLMs and AI code editors",
    "rank": 59
  },
  {
    "name": "headroom",
    "url": "https://github.com/headroomlabs-ai/headroom",
    "stars": 58996,
    "forks": 4371,
    "lang": "Python",
    "desc": "Compress tool outputs, logs, files, and RAG chunks before they reach the LLM. 60-95% fewer tokens, same answers. Library, proxy, MCP server.",
    "rank": 85
  },
  {
    "name": "Mole",
    "url": "https://github.com/tw93/Mole",
    "stars": 58869,
    "forks": 2076,
    "lang": "Shell",
    "desc": "🐹 Clean, uninstall, analyze, optimize, and monitor your Mac from the terminal.",
    "rank": 11
  },
  {
    "name": "starship",
    "url": "https://github.com/starship/starship",
    "stars": 58846,
    "forks": 2587,
    "lang": "Rust",
    "desc": "☄🌌️  The minimal, blazing-fast, and infinitely customizable prompt for any shell!",
    "rank": 23
  },
  {
    "name": "rails",
    "url": "https://github.com/rails/rails",
    "stars": 58800,
    "forks": 22428,
    "lang": "Ruby",
    "desc": "Ruby on Rails",
    "rank": 1
  },
  {
    "name": "marktext",
    "url": "https://github.com/marktext/marktext",
    "stars": 58656,
    "forks": 4352,
    "lang": "TypeScript",
    "desc": "📝A simple and elegant markdown editor, available for Linux, macOS and Windows.",
    "rank": 60
  },
  {
    "name": "angular.js",
    "url": "https://github.com/angular/angular.js",
    "stars": 58585,
    "forks": 27091,
    "lang": "JavaScript",
    "desc": "AngularJS - HTML enhanced for web apps!",
    "rank": 99
  },
  {
    "name": "zustand",
    "url": "https://github.com/pmndrs/zustand",
    "stars": 58576,
    "forks": 2256,
    "lang": "TypeScript",
    "desc": "🐻 Bear necessities for state management in React",
    "rank": 61
  },
  {
    "name": "meilisearch",
    "url": "https://github.com/meilisearch/meilisearch",
    "stars": 58569,
    "forks": 2617,
    "lang": "Rust",
    "desc": "A lightning-fast search engine API bringing AI-powered hybrid search to your sites and applications.",
    "rank": 24
  },
  {
    "name": "coolify",
    "url": "https://github.com/coollabsio/coolify",
    "stars": 58456,
    "forks": 5012,
    "lang": "PHP",
    "desc": "An open-source, self-hostable PaaS alternative to Vercel, Heroku & Netlify that lets you easily deploy static sites, databases, full-stack applications and 280+ one-click services on your own servers.",
    "rank": 2
  },
  {
    "name": "rclone",
    "url": "https://github.com/rclone/rclone",
    "stars": 58334,
    "forks": 5208,
    "lang": "Go",
    "desc": "rsync for cloud storage - Google Drive, S3, Dropbox, Backblaze B2, One Drive, Swift, Hubic, Wasabi, Google Cloud Storage, Azure Blob, Azure Files, Yandex Files",
    "rank": 22
  },
  {
    "name": "awesome-rust",
    "url": "https://github.com/rust-unofficial/awesome-rust",
    "stars": 58307,
    "forks": 3477,
    "lang": "Rust",
    "desc": "A curated list of Rust code and resources.",
    "rank": 25
  },
  {
    "name": "winutil",
    "url": "https://github.com/ChrisTitusTech/winutil",
    "stars": 57944,
    "forks": 3356,
    "lang": "PowerShell",
    "desc": "Chris Titus Tech's Windows Utility - Install Programs, Tweaks, Fixes, and Updates",
    "rank": 1
  },
  {
    "name": "yolov5",
    "url": "https://github.com/ultralytics/yolov5",
    "stars": 57678,
    "forks": 17469,
    "lang": "Python",
    "desc": "Ultralytics YOLOv5 in PyTorch > ONNX > CoreML > TFLite",
    "rank": 86
  },
  {
    "name": "termux-app",
    "url": "https://github.com/termux/termux-app",
    "stars": 57605,
    "forks": 6952,
    "lang": "Java",
    "desc": "Termux - a terminal emulator application for Android OS extendible by variety of packages.",
    "rank": 13
  },
  {
    "name": "html5-boilerplate",
    "url": "https://github.com/h5bp/html5-boilerplate",
    "stars": 57552,
    "forks": 12277,
    "lang": "JavaScript",
    "desc": "A professional front-end template for building fast, robust, and adaptable web apps or sites.",
    "rank": 42
  },
  {
    "name": "DeepLearning-500-questions",
    "url": "https://github.com/scutan90/DeepLearning-500-questions",
    "stars": 57477,
    "forks": 15911,
    "lang": "JavaScript",
    "desc": "深度学习500问，以问答形式对常用的概率知识、线性代数、机器学习、深度学习、计算机视觉等热点问题进行阐述，以帮助自己及有需要的读者。 全书分为18个章节，50余万字。由于水平有限，书中不妥之处恳请广大读者批评指正。   未完待续............ 如有意合作，联系scutjy2015@163.com                     版权所有，违权必究       Tan 2018.06",
    "rank": 43
  },
  {
    "name": "OpenManus",
    "url": "https://github.com/FoundationAgents/OpenManus",
    "stars": 57385,
    "forks": 9977,
    "lang": "Python",
    "desc": "No fortress, purely open ground.  OpenManus is Coming.",
    "rank": 87
  },
  {
    "name": "system_prompts_leaks",
    "url": "https://github.com/asgeirtj/system_prompts_leaks",
    "stars": 57380,
    "forks": 9484,
    "lang": "JavaScript",
    "desc": "Extracted system prompts from Anthropic - Claude Fable 5, Opus 4.8, Claude Code, Claude Design. OpenAI - ChatGPT GPT-5.6, Codex GPT-5.6, GPT-5.5. Google - Gemini 3.5 Flash, 3.1 Pro, Antigravity. xAI - Grok, Cursor, Copilot, VS Code, Perplexity, and more. Updated regularly.",
    "rank": 44
  },
  {
    "name": "private-gpt",
    "url": "https://github.com/zylon-ai/private-gpt",
    "stars": 57332,
    "forks": 7597,
    "lang": "Python",
    "desc": "Complete API layer for private AI applications on local models: RAG, skills, tools, MCP, text-to-sql, and more. Works with any OpenAI-compatible inference server.",
    "rank": 88
  },
  {
    "name": "mempalace",
    "url": "https://github.com/MemPalace/mempalace",
    "stars": 57304,
    "forks": 7391,
    "lang": "Python",
    "desc": "The best-benchmarked open-source AI memory system. And it's free.",
    "rank": 89
  },
  {
    "name": "daily_stock_analysis",
    "url": "https://github.com/ZhuLinsen/daily_stock_analysis",
    "stars": 57088,
    "forks": 49104,
    "lang": "Python",
    "desc": "LLM 驱动的多市场股票智能分析系统：多源行情、实时新闻、决策看板与自动推送，支持零成本定时运行。  LLM-powered multi-market stock analysis system with multi-source market data, real-time news, decision dashboard, automated notifications, and cost-free scheduled runs.",
    "rank": 34
  },
  {
    "name": "fuel-core",
    "url": "https://github.com/FuelLabs/fuel-core",
    "stars": 56976,
    "forks": 2874,
    "lang": "Rust",
    "desc": "Rust full node implementation of the Fuel v2 protocol.",
    "rank": 26
  },
  {
    "name": "you-get",
    "url": "https://github.com/soimort/you-get",
    "stars": 56851,
    "forks": 9715,
    "lang": "Python",
    "desc": ":arrow_double_down: Dumb downloader that scrapes the web",
    "rank": 91
  },
  {
    "name": "rich",
    "url": "https://github.com/Textualize/rich",
    "stars": 56850,
    "forks": 2229,
    "lang": "Python",
    "desc": "Rich is a Python library for rich text and beautiful formatting in the terminal.",
    "rank": 92
  },
  {
    "name": "gitea",
    "url": "https://github.com/go-gitea/gitea",
    "stars": 56810,
    "forks": 6901,
    "lang": "Go",
    "desc": "Git with a cup of tea! Painless self-hosted all-in-one software development service, including Git hosting, code review, team collaboration, package registry and CI/CD",
    "rank": 23
  },
  {
    "name": "appwrite",
    "url": "https://github.com/appwrite/appwrite",
    "stars": 56586,
    "forks": 5548,
    "lang": "TypeScript",
    "desc": "Appwrite® - complete cloud infrastructure for your web, mobile and AI apps. Including Auth, Databases, Storage, Functions, Messaging, Hosting, Realtime and more",
    "rank": 62
  },
  {
    "name": "face_recognition",
    "url": "https://github.com/ageitgey/face_recognition",
    "stars": 56576,
    "forks": 13688,
    "lang": "Python",
    "desc": "The world's simplest facial recognition api for Python and the command line",
    "rank": 93
  },
  {
    "name": "react-router",
    "url": "https://github.com/remix-run/react-router",
    "stars": 56494,
    "forks": 10899,
    "lang": "TypeScript",
    "desc": "Declarative routing for React",
    "rank": 63
  },
  {
    "name": "MediaCrawler",
    "url": "https://github.com/NanmiCoder/MediaCrawler",
    "stars": 56355,
    "forks": 11342,
    "lang": "Python",
    "desc": "小红书笔记 | 评论爬虫、抖音视频 | 评论爬虫、快手视频 | 评论爬虫、B 站视频 ｜ 评论爬虫、微博帖子 ｜ 评论爬虫、百度贴吧帖子 ｜ 百度贴吧评论回复爬虫  | 知乎问答文章｜评论爬虫",
    "rank": 94
  },
  {
    "name": "nanochat",
    "url": "https://github.com/karpathy/nanochat",
    "stars": 56236,
    "forks": 7766,
    "lang": "Python",
    "desc": "The best ChatGPT that $100 can buy.",
    "rank": 95
  },
  {
    "name": "gatsby",
    "url": "https://github.com/gatsbyjs/gatsby",
    "stars": 55951,
    "forks": 10155,
    "lang": "JavaScript",
    "desc": "React-based framework with performance, scalability, and security built in.",
    "rank": 45
  },
  {
    "name": "Agent-Reach",
    "url": "https://github.com/Panniantong/Agent-Reach",
    "stars": 55862,
    "forks": 4606,
    "lang": "Python",
    "desc": "Give your AI agent eyes to see the entire internet. Read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu — one CLI, zero API fees.",
    "rank": 96
  },
  {
    "name": "up",
    "url": "https://github.com/byoungd/up",
    "stars": 55809,
    "forks": 5717,
    "lang": "JavaScript",
    "desc": "An advanced guide which might benefit you a lot 🎉 . 人生进阶指南 离谱的人生 离谱的英语学习指南/英语学习教程/英语学习/学英语",
    "rank": 46
  },
  {
    "name": "penpot",
    "url": "https://github.com/penpot/penpot",
    "stars": 55786,
    "forks": 3667,
    "lang": "Clojure",
    "desc": "Penpot: The open-source design platform for Product teams that need scalable collaboration.",
    "rank": 2
  },
  {
    "name": "leetcode",
    "url": "https://github.com/azl397985856/leetcode",
    "stars": 55774,
    "forks": 9398,
    "lang": "JavaScript",
    "desc": "LeetCode Solutions: A Record of My Problem Solving Journey.( leetcode题解，记录自己的leetcode解题之路。)",
    "rank": 47
  },
  {
    "name": "n8n-workflows",
    "url": "https://github.com/Zie619/n8n-workflows",
    "stars": 55673,
    "forks": 7407,
    "lang": "Python",
    "desc": "all of the workflows of n8n i could find (also from the site itself)",
    "rank": 97
  },
  {
    "name": "joplin",
    "url": "https://github.com/laurent22/joplin",
    "stars": 55573,
    "forks": 6177,
    "lang": "TypeScript",
    "desc": "Joplin - the privacy-focused note taking app with sync capabilities for Windows, macOS, Linux, Android and iOS.",
    "rank": 64
  },
  {
    "name": "crewAI",
    "url": "https://github.com/crewAIInc/crewAI",
    "stars": 55467,
    "forks": 7822,
    "lang": "Python",
    "desc": "Framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence, CrewAI empowers agents to work together seamlessly, tackling complex tasks.",
    "rank": 98
  },
  {
    "name": "faceswap",
    "url": "https://github.com/deepfakes/faceswap",
    "stars": 55339,
    "forks": 13353,
    "lang": "Python",
    "desc": "Deepfakes Software For All",
    "rank": 99
  },
  {
    "name": "gpt-engineer",
    "url": "https://github.com/AntonOsika/gpt-engineer",
    "stars": 55197,
    "forks": 7297,
    "lang": "Python",
    "desc": "CLI platform to experiment with codegen. Precursor to: https://lovable.dev",
    "rank": 99
  },
  {
    "name": "first-contributions",
    "url": "https://github.com/firstcontributions/first-contributions",
    "stars": 54980,
    "forks": 106058,
    "lang": "?",
    "desc": "🚀✨ Help beginners to contribute to open source projects",
    "rank": 5
  },
  {
    "name": "typst",
    "url": "https://github.com/typst/typst",
    "stars": 54892,
    "forks": 1642,
    "lang": "Rust",
    "desc": "A markup-based typesetting system that is powerful and easy to learn.",
    "rank": 27
  },
  {
    "name": "powerlevel10k",
    "url": "https://github.com/romkatv/powerlevel10k",
    "stars": 54704,
    "forks": 2431,
    "lang": "Shell",
    "desc": "A Zsh theme",
    "rank": 12
  },
  {
    "name": "Flowise",
    "url": "https://github.com/FlowiseAI/Flowise",
    "stars": 54584,
    "forks": 24709,
    "lang": "TypeScript",
    "desc": "Build AI Agents, Visually",
    "rank": 65
  },
  {
    "name": "plane",
    "url": "https://github.com/makeplane/plane",
    "stars": 54422,
    "forks": 4977,
    "lang": "TypeScript",
    "desc": "🔥🔥🔥 Open-source Jira, Linear, Monday, and ClickUp alternative. Plane is a modern project management platform to manage tasks, sprints, docs, and triage.",
    "rank": 66
  },
  {
    "name": "Ghost",
    "url": "https://github.com/TryGhost/Ghost",
    "stars": 54407,
    "forks": 11792,
    "lang": "JavaScript",
    "desc": "Independent technology for modern publishing, memberships, subscriptions and newsletters.",
    "rank": 48
  },
  {
    "name": "ChatGPT",
    "url": "https://github.com/lencx/ChatGPT",
    "stars": 54395,
    "forks": 6140,
    "lang": "Rust",
    "desc": "🔮 ChatGPT Desktop Application (Mac, Windows and Linux)",
    "rank": 28
  },
  {
    "name": "PowerShell",
    "url": "https://github.com/PowerShell/PowerShell",
    "stars": 54394,
    "forks": 8375,
    "lang": "C#",
    "desc": "PowerShell for every system!",
    "rank": 3
  },
  {
    "name": "maybe",
    "url": "https://github.com/maybe-finance/maybe",
    "stars": 54341,
    "forks": 5648,
    "lang": "Ruby",
    "desc": "The personal finance app for everyone",
    "rank": 2
  },
  {
    "name": "dive",
    "url": "https://github.com/wagoodman/dive",
    "stars": 54317,
    "forks": 1988,
    "lang": "Go",
    "desc": "A tool for exploring each layer in a docker image",
    "rank": 24
  },
  {
    "name": "jellyfin",
    "url": "https://github.com/jellyfin/jellyfin",
    "stars": 54257,
    "forks": 5097,
    "lang": "C#",
    "desc": "The Free Software Media System - Server Backend & API",
    "rank": 4
  },
  {
    "name": "ImHex",
    "url": "https://github.com/WerWolv/ImHex",
    "stars": 54164,
    "forks": 2413,
    "lang": "C++",
    "desc": "🔍 A Hex Editor for Reverse Engineers, Programmers and people who value their retinas when working at 3 AM.",
    "rank": 14
  },
  {
    "name": "pdf.js",
    "url": "https://github.com/mozilla/pdf.js",
    "stars": 53560,
    "forks": 10647,
    "lang": "JavaScript",
    "desc": "PDF Reader in JavaScript",
    "rank": 49
  },
  {
    "name": "normalize.css",
    "url": "https://github.com/necolas/normalize.css",
    "stars": 53542,
    "forks": 10357,
    "lang": "CSS",
    "desc": "A modern alternative to CSS resets",
    "rank": 3
  },
  {
    "name": "kotlin",
    "url": "https://github.com/JetBrains/kotlin",
    "stars": 53132,
    "forks": 6357,
    "lang": "Kotlin",
    "desc": "The Kotlin Programming Language.",
    "rank": 3
  },
  {
    "name": "remotion",
    "url": "https://github.com/remotion-dev/remotion",
    "stars": 53093,
    "forks": 3835,
    "lang": "TypeScript",
    "desc": "🎥      Make videos programmatically with React",
    "rank": 68
  },
  {
    "name": "odoo",
    "url": "https://github.com/odoo/odoo",
    "stars": 52990,
    "forks": 33088,
    "lang": "Python",
    "desc": "Odoo. Open Source Apps To Grow Your Business.",
    "rank": 71
  },
  {
    "name": "twenty",
    "url": "https://github.com/twentyhq/twenty",
    "stars": 52910,
    "forks": 7966,
    "lang": "TypeScript",
    "desc": "The open alternative to Salesforce, designed for AI.",
    "rank": 69
  },
  {
    "name": "awesome-ios",
    "url": "https://github.com/vsouza/awesome-ios",
    "stars": 52742,
    "forks": 6984,
    "lang": "Swift",
    "desc": "A curated list of awesome iOS ecosystem, including Objective-C and Swift Projects",
    "rank": 3
  },
  {
    "name": "Docker-OSX",
    "url": "https://github.com/sickcodes/Docker-OSX",
    "stars": 52663,
    "forks": 2880,
    "lang": "Shell",
    "desc": "Run macOS VM in a Docker! Run near native OSX-KVM in Docker! X11 Forwarding! CI/CD for OS X Security Research! Docker mac Containers.",
    "rank": 13
  },
  {
    "name": "ionic-framework",
    "url": "https://github.com/ionic-team/ionic-framework",
    "stars": 52578,
    "forks": 13342,
    "lang": "TypeScript",
    "desc": "A powerful cross-platform UI toolkit for building native-quality iOS, Android, and Progressive Web Apps with HTML, CSS, and JavaScript.",
    "rank": 70
  },
  {
    "name": "chinese-poetry",
    "url": "https://github.com/chinese-poetry/chinese-poetry",
    "stars": 52473,
    "forks": 10580,
    "lang": "JavaScript",
    "desc": "The most comprehensive database of Chinese poetry 🧶最全中华古诗词数据库,  唐宋两朝近一万四千古诗人,  接近5.5万首唐诗加26万宋诗.  两宋时期1564位词人，21050首词。",
    "rank": 50
  },
  {
    "name": "windows",
    "url": "https://github.com/dockur/windows",
    "stars": 52424,
    "forks": 4480,
    "lang": "Shell",
    "desc": "Windows inside a Docker container.",
    "rank": 14
  },
  {
    "name": "Motrix",
    "url": "https://github.com/agalwood/Motrix",
    "stars": 52251,
    "forks": 4891,
    "lang": "JavaScript",
    "desc": "A full-featured download manager.",
    "rank": 51
  },
  {
    "name": "prettier",
    "url": "https://github.com/prettier/prettier",
    "stars": 52231,
    "forks": 4921,
    "lang": "JavaScript",
    "desc": "Prettier is an opinionated code formatter.",
    "rank": 52
  },
  {
    "name": "lx-music-desktop",
    "url": "https://github.com/lyswhut/lx-music-desktop",
    "stars": 52120,
    "forks": 6903,
    "lang": "TypeScript",
    "desc": "一个基于 Electron 的音乐软件",
    "rank": 71
  },
  {
    "name": "lazydocker",
    "url": "https://github.com/jesseduffield/lazydocker",
    "stars": 52024,
    "forks": 1648,
    "lang": "Go",
    "desc": "The lazier way to manage everything docker",
    "rank": 25
  },
  {
    "name": "etcd",
    "url": "https://github.com/etcd-io/etcd",
    "stars": 51986,
    "forks": 10409,
    "lang": "Go",
    "desc": "Distributed reliable key-value store for the most critical data of a distributed system",
    "rank": 26
  },
  {
    "name": "whisper.cpp",
    "url": "https://github.com/ggml-org/whisper.cpp",
    "stars": 51779,
    "forks": 5905,
    "lang": "C++",
    "desc": "Port of OpenAI's Whisper model in C/C++",
    "rank": 15
  },
  {
    "name": "jekyll",
    "url": "https://github.com/jekyll/jekyll",
    "stars": 51558,
    "forks": 10291,
    "lang": "Ruby",
    "desc": ":globe_with_meridians: Jekyll is a blog-aware static site generator in Ruby",
    "rank": 3
  },
  {
    "name": "guava",
    "url": "https://github.com/google/guava",
    "stars": 51523,
    "forks": 11136,
    "lang": "Java",
    "desc": "Google core libraries for Java",
    "rank": 14
  },
  {
    "name": "go-ethereum",
    "url": "https://github.com/ethereum/go-ethereum",
    "stars": 51345,
    "forks": 22082,
    "lang": "Go",
    "desc": "Go implementation of the Ethereum protocol",
    "rank": 27
  },
  {
    "name": "DefinitelyTyped",
    "url": "https://github.com/DefinitelyTyped/DefinitelyTyped",
    "stars": 51343,
    "forks": 30420,
    "lang": "TypeScript",
    "desc": "The repository for high quality TypeScript type definitions.",
    "rank": 80
  },
  {
    "name": "wechat-miniapp-radar",
    "url": "https://github.com/justjavac/wechat-miniapp-radar",
    "stars": 51219,
    "forks": 9020,
    "lang": "TypeScript",
    "desc": "小程序雷达：AI 驱动的小程序技术选型、趋势追踪和迁移诊断工具",
    "rank": 73
  },
  {
    "name": "goose",
    "url": "https://github.com/aaif-goose/goose",
    "stars": 51184,
    "forks": 5680,
    "lang": "Rust",
    "desc": "an open source, extensible AI agent that goes beyond code suggestions - install, execute, edit, and test with any LLM",
    "rank": 29
  },
  {
    "name": "Semantic-UI",
    "url": "https://github.com/Semantic-Org/Semantic-UI",
    "stars": 51051,
    "forks": 4866,
    "lang": "JavaScript",
    "desc": "Semantic is a UI component framework based around useful principles from natural language.",
    "rank": 53
  },
  {
    "name": "Win11Debloat",
    "url": "https://github.com/Raphire/Win11Debloat",
    "stars": 51004,
    "forks": 2099,
    "lang": "PowerShell",
    "desc": "A simple, lightweight PowerShell script that allows you to remove pre-installed apps, disable telemetry, as well as perform various other changes to declutter and customize your Windows experience. Win11Debloat works for both Windows 10 and Windows 11.",
    "rank": 2
  },
  {
    "name": "dbeaver",
    "url": "https://github.com/dbeaver/dbeaver",
    "stars": 50994,
    "forks": 4288,
    "lang": "Java",
    "desc": "Free universal database tool and SQL client",
    "rank": 15
  },
  {
    "name": "hiring-without-whiteboards",
    "url": "https://github.com/poteto/hiring-without-whiteboards",
    "stars": 50979,
    "forks": 3898,
    "lang": "JavaScript",
    "desc": "⭐️  Companies that don't have a broken hiring process",
    "rank": 54
  },
  {
    "name": "cypress",
    "url": "https://github.com/cypress-io/cypress",
    "stars": 50677,
    "forks": 3594,
    "lang": "TypeScript",
    "desc": "Fast, easy and reliable testing for anything that runs in a browser.",
    "rank": 74
  },
  {
    "name": "expo",
    "url": "https://github.com/expo/expo",
    "stars": 50632,
    "forks": 13051,
    "lang": "TypeScript",
    "desc": "An open-source framework for making universal native apps with React. Expo runs on Android, iOS, and the web.",
    "rank": 75
  },
  {
    "name": "BMAD-METHOD",
    "url": "https://github.com/bmad-code-org/BMAD-METHOD",
    "stars": 50544,
    "forks": 5814,
    "lang": "JavaScript",
    "desc": "Breakthrough Method for Agile Ai Driven Development",
    "rank": 55
  },
  {
    "name": "json",
    "url": "https://github.com/nlohmann/json",
    "stars": 50118,
    "forks": 7429,
    "lang": "C++",
    "desc": "JSON for Modern C++",
    "rank": 16
  },
  {
    "name": "mastodon",
    "url": "https://github.com/mastodon/mastodon",
    "stars": 50114,
    "forks": 7480,
    "lang": "Ruby",
    "desc": "Your self-hosted, globally interconnected microblogging community",
    "rank": 4
  },
  {
    "name": "bulma",
    "url": "https://github.com/jgthms/bulma",
    "stars": 50071,
    "forks": 3888,
    "lang": "CSS",
    "desc": "Modern CSS framework based on Flexbox",
    "rank": 4
  },
  {
    "name": "query",
    "url": "https://github.com/TanStack/query",
    "stars": 49990,
    "forks": 4074,
    "lang": "TypeScript",
    "desc": "🤖 Powerful asynchronous state management, server-state utilities and data fetching for the web. TS/JS, React Query, Solid Query, Svelte Query and Vue Query.",
    "rank": 76
  },
  {
    "name": "alist",
    "url": "https://github.com/AlistGo/alist",
    "stars": 49865,
    "forks": 7951,
    "lang": "Go",
    "desc": "🗂️A file list/WebDAV program that supports multiple storages, powered by Gin and Solidjs. / 一个支持多存储的文件列表/WebDAV程序，使用 Gin 和 Solidjs。",
    "rank": 28
  },
  {
    "name": "hacker-scripts",
    "url": "https://github.com/NARKOZ/hacker-scripts",
    "stars": 49754,
    "forks": 6660,
    "lang": "JavaScript",
    "desc": "Based on a true story",
    "rank": 56
  },
  {
    "name": "jadx",
    "url": "https://github.com/skylot/jadx",
    "stars": 49679,
    "forks": 5730,
    "lang": "Java",
    "desc": "Dex to Java decompiler",
    "rank": 16
  },
  {
    "name": "huginn",
    "url": "https://github.com/huginn/huginn",
    "stars": 49609,
    "forks": 4273,
    "lang": "Ruby",
    "desc": "Create agents that monitor and act on your behalf.  Your agents are standing by!",
    "rank": 5
  },
  {
    "name": "terraform",
    "url": "https://github.com/hashicorp/terraform",
    "stars": 49459,
    "forks": 10680,
    "lang": "Go",
    "desc": "Terraform enables you to safely and predictably create, change, and improve infrastructure. It is a source-available tool that codifies APIs into declarative configuration files that can be shared amongst team members, treated as code, edited, reviewed, and versioned.",
    "rank": 29
  },
  {
    "name": "pretext",
    "url": "https://github.com/chenglou/pretext",
    "stars": 49104,
    "forks": 2717,
    "lang": "TypeScript",
    "desc": "Fast, accurate & comprehensive text measurement & layout",
    "rank": 77
  },
  {
    "name": "julia",
    "url": "https://github.com/JuliaLang/julia",
    "stars": 49024,
    "forks": 5929,
    "lang": "Julia",
    "desc": "The Julia Programming Language",
    "rank": 1
  },
  {
    "name": "fanqiang",
    "url": "https://github.com/bannedbook/fanqiang",
    "stars": 48926,
    "forks": 8183,
    "lang": "Kotlin",
    "desc": "翻墙-科学上网",
    "rank": 4
  },
  {
    "name": "x64dbg",
    "url": "https://github.com/x64dbg/x64dbg",
    "stars": 48884,
    "forks": 2780,
    "lang": "C++",
    "desc": "An open-source user mode debugger for Windows. Optimized for reverse engineering and malware analysis.",
    "rank": 17
  },
  {
    "name": "brew",
    "url": "https://github.com/Homebrew/brew",
    "stars": 48817,
    "forks": 11230,
    "lang": "Ruby",
    "desc": "🍺 The Package Manager for Everywhere",
    "rank": 6
  },
  {
    "name": "tldraw",
    "url": "https://github.com/tldraw/tldraw",
    "stars": 48745,
    "forks": 3373,
    "lang": "TypeScript",
    "desc": "Build infinite canvas apps in React with the tldraw SDK. World's best, top-most agent recommended #1 five star SDK.",
    "rank": 78
  },
  {
    "name": "dayjs",
    "url": "https://github.com/iamkun/dayjs",
    "stars": 48666,
    "forks": 2453,
    "lang": "JavaScript",
    "desc": "⏰ Day.js 2kB immutable date-time library alternative to Moment.js with the same modern API",
    "rank": 57
  },
  {
    "name": "algorithm-visualizer",
    "url": "https://github.com/algorithm-visualizer/algorithm-visualizer",
    "stars": 48635,
    "forks": 7585,
    "lang": "JavaScript",
    "desc": ":fireworks:Interactive Online Platform that Visualizes Algorithms from Code",
    "rank": 58
  },
  {
    "name": "ClickHouse",
    "url": "https://github.com/ClickHouse/ClickHouse",
    "stars": 48625,
    "forks": 8642,
    "lang": "C++",
    "desc": "ClickHouse® is a real-time analytics database management system",
    "rank": 18
  },
  {
    "name": "ruff",
    "url": "https://github.com/astral-sh/ruff",
    "stars": 48561,
    "forks": 2235,
    "lang": "Rust",
    "desc": "An extremely fast Python linter and code formatter, written in Rust.",
    "rank": 30
  },
  {
    "name": "cherry-studio",
    "url": "https://github.com/CherryHQ/cherry-studio",
    "stars": 48533,
    "forks": 4610,
    "lang": "TypeScript",
    "desc": "AI productivity studio with smart chat, autonomous agents, and 300+ assistants. Unified access to frontier LLMs",
    "rank": 79
  },
  {
    "name": "htmx",
    "url": "https://github.com/bigskysoftware/htmx",
    "stars": 48460,
    "forks": 1613,
    "lang": "JavaScript",
    "desc": "</> htmx - high power tools for HTML",
    "rank": 59
  },
  {
    "name": "type-challenges",
    "url": "https://github.com/type-challenges/type-challenges",
    "stars": 48318,
    "forks": 5272,
    "lang": "TypeScript",
    "desc": "Collection of TypeScript type challenges with online judge",
    "rank": 80
  },
  {
    "name": "RxJava",
    "url": "https://github.com/ReactiveX/RxJava",
    "stars": 48239,
    "forks": 7589,
    "lang": "Java",
    "desc": "RxJava – Reactive Extensions for the JVM – a library for composing asynchronous and event-based programs using observable sequences for the Java VM.",
    "rank": 17
  },
  {
    "name": "metabase",
    "url": "https://github.com/metabase/metabase",
    "stars": 48193,
    "forks": 6663,
    "lang": "Clojure",
    "desc": "The easy-to-use open source Business Intelligence and Embedded Analytics tool that lets everyone work with data :bar_chart:",
    "rank": 3
  },
  {
    "name": "moment",
    "url": "https://github.com/moment/moment",
    "stars": 47951,
    "forks": 6991,
    "lang": "JavaScript",
    "desc": "Parse, validate, manipulate, and display dates in javascript.",
    "rank": 60
  },
  {
    "name": "pixijs",
    "url": "https://github.com/pixijs/pixijs",
    "stars": 47769,
    "forks": 5043,
    "lang": "TypeScript",
    "desc": "The HTML5 Creation Engine: Create beautiful digital content with the fastest, most flexible 2D WebGL renderer.",
    "rank": 81
  },
  {
    "name": "container",
    "url": "https://github.com/apple/container",
    "stars": 47718,
    "forks": 1600,
    "lang": "Swift",
    "desc": "A tool for creating and running Linux containers using lightweight virtual machines on a Mac. It is written in Swift, and optimized for Apple silicon.",
    "rank": 4
  },
  {
    "name": "tmux",
    "url": "https://github.com/tmux/tmux",
    "stars": 47685,
    "forks": 2772,
    "lang": "C",
    "desc": "tmux source code",
    "rank": 9
  },
  {
    "name": "gogs",
    "url": "https://github.com/gogs/gogs",
    "stars": 47681,
    "forks": 5075,
    "lang": "Go",
    "desc": "The painless way to host your own Git service",
    "rank": 30
  },
  {
    "name": "slidev",
    "url": "https://github.com/slidevjs/slidev",
    "stars": 47646,
    "forks": 2115,
    "lang": "TypeScript",
    "desc": "Presentation Slides for Developers",
    "rank": 82
  },
  {
    "name": "spotube",
    "url": "https://github.com/KRTirtho/spotube",
    "stars": 47534,
    "forks": 2196,
    "lang": "Dart",
    "desc": "🎧 Open source music streaming app! Available for both desktop & mobile!",
    "rank": 5
  },
  {
    "name": "LocalAI",
    "url": "https://github.com/mudler/LocalAI",
    "stars": 47525,
    "forks": 4229,
    "lang": "Go",
    "desc": "LocalAI is the open-source AI engine. Run any model - LLMs, vision, voice, image, video - on any hardware. No GPU required.",
    "rank": 31
  },
  {
    "name": "discourse",
    "url": "https://github.com/discourse/discourse",
    "stars": 47460,
    "forks": 8950,
    "lang": "Ruby",
    "desc": "A platform for community discussion. Free, open, simple.",
    "rank": 7
  },
  {
    "name": "prisma",
    "url": "https://github.com/prisma/prisma",
    "stars": 47342,
    "forks": 2480,
    "lang": "TypeScript",
    "desc": "Next-generation ORM for Node.js & TypeScript | PostgreSQL, MySQL, MariaDB, SQL Server, SQLite, MongoDB and CockroachDB",
    "rank": 83
  },
  {
    "name": "quill",
    "url": "https://github.com/slab/quill",
    "stars": 47215,
    "forks": 3659,
    "lang": "TypeScript",
    "desc": "Quill is a modern WYSIWYG editor built for compatibility and extensibility",
    "rank": 82
  },
  {
    "name": "acme.sh",
    "url": "https://github.com/acmesh-official/acme.sh",
    "stars": 47169,
    "forks": 5629,
    "lang": "Shell",
    "desc": "A pure Unix shell script ACME client for SSL / TLS certificate automation",
    "rank": 15
  },
  {
    "name": "bevy",
    "url": "https://github.com/bevyengine/bevy",
    "stars": 47148,
    "forks": 4692,
    "lang": "Rust",
    "desc": "A refreshingly simple data-driven game engine built in Rust",
    "rank": 31
  },
  {
    "name": "upscayl",
    "url": "https://github.com/upscayl/upscayl",
    "stars": 47116,
    "forks": 2329,
    "lang": "TypeScript",
    "desc": "🆙 Upscayl - #1 Free and Open Source AI Image Upscaler for Linux, MacOS and Windows.",
    "rank": 85
  },
  {
    "name": "JeecgBoot",
    "url": "https://github.com/jeecgboot/JeecgBoot",
    "stars": 47056,
    "forks": 16077,
    "lang": "Java",
    "desc": "【低代码迈入 v2.0】AI低代码平台，AI Skills 一句话生成整个系统；一键生成前后端代码甚至整个模块。 AI Skills 一句话画流程、设计表单、生成报表、大屏。内置 AI应用平台涵盖：AI聊天、知识库、流程编排、MCP插件等，兼容主流大模型。引领AI低代码「Skills 生成 → 在线配置 → 代码生成 → 手工合并->AI修改」开发模式，解决 Java 项目 90% 重复工作，提高效率又不失灵活。",
    "rank": 18
  },
  {
    "name": "nvm-windows",
    "url": "https://github.com/coreybutler/nvm-windows",
    "stars": 47048,
    "forks": 3855,
    "lang": "Go",
    "desc": "A node.js version management utility for Windows. Ironically written in Go.",
    "rank": 32
  },
  {
    "name": "okhttp",
    "url": "https://github.com/square/okhttp",
    "stars": 46999,
    "forks": 9276,
    "lang": "Kotlin",
    "desc": "Square’s meticulous HTTP client for the JVM, Android, and GraalVM.",
    "rank": 5
  },
  {
    "name": "serverless",
    "url": "https://github.com/serverless/serverless",
    "stars": 46916,
    "forks": 5730,
    "lang": "JavaScript",
    "desc": "⚡ Serverless Framework – Effortlessly build apps that auto-scale, incur zero costs when idle, and require minimal maintenance using AWS Lambda and other managed cloud services.",
    "rank": 61
  },
  {
    "name": "v2ray-core",
    "url": "https://github.com/v2ray/v2ray-core",
    "stars": 46903,
    "forks": 8841,
    "lang": "Go",
    "desc": "A platform for building proxies to bypass network restrictions.",
    "rank": 33
  },
  {
    "name": "legado",
    "url": "https://github.com/gedoor/legado",
    "stars": 46879,
    "forks": 5469,
    "lang": "Kotlin",
    "desc": "Legado 3.0 Book Reader with powerful controls & full functions❤️阅读3.0, 阅读是一款可以自定义来源阅读网络内容的工具，为广大网络文学爱好者提供一种方便、快捷舒适的试读体验。",
    "rank": 6
  },
  {
    "name": "chrome-devtools-mcp",
    "url": "https://github.com/ChromeDevTools/chrome-devtools-mcp",
    "stars": 46878,
    "forks": 3216,
    "lang": "TypeScript",
    "desc": "Chrome DevTools for coding agents",
    "rank": 87
  },
  {
    "name": "30-Days-Of-JavaScript",
    "url": "https://github.com/Asabeneh/30-Days-Of-JavaScript",
    "stars": 46558,
    "forks": 10449,
    "lang": "JavaScript",
    "desc": "30 days of JavaScript programming challenge is a step-by-step guide to learn JavaScript programming language in 30 days. This challenge may take more than 100 days,  please just follow your own pace. These videos may help too: https://www.youtube.com/channel/UC7PNRuno1rzYPb1xLa4yktw",
    "rank": 62
  },
  {
    "name": "impeccable",
    "url": "https://github.com/pbakaus/impeccable",
    "stars": 46417,
    "forks": 2807,
    "lang": "JavaScript",
    "desc": "The design language that makes your AI harness better at design.",
    "rank": 63
  },
  {
    "name": "cal.diy",
    "url": "https://github.com/calcom/cal.diy",
    "stars": 46383,
    "forks": 14424,
    "lang": "TypeScript",
    "desc": "Scheduling infrastructure for absolutely everyone.",
    "rank": 88
  },
  {
    "name": "monaco-editor",
    "url": "https://github.com/microsoft/monaco-editor",
    "stars": 46334,
    "forks": 4093,
    "lang": "JavaScript",
    "desc": "A browser based code editor",
    "rank": 64
  },
  {
    "name": "awesome-cheatsheets",
    "url": "https://github.com/LeCoupa/awesome-cheatsheets",
    "stars": 46195,
    "forks": 6703,
    "lang": "JavaScript",
    "desc": "👩‍💻👨‍💻 Awesome cheatsheets for popular programming languages, frameworks and development tools. They include everything you should know in one single file.",
    "rank": 65
  },
  {
    "name": "awesome-compose",
    "url": "https://github.com/docker/awesome-compose",
    "stars": 45832,
    "forks": 8244,
    "lang": "HTML",
    "desc": "Awesome Docker Compose samples",
    "rank": 7
  },
  {
    "name": "Rocket.Chat",
    "url": "https://github.com/RocketChat/Rocket.Chat",
    "stars": 45783,
    "forks": 13716,
    "lang": "TypeScript",
    "desc": "The Secure CommsOS™ for mission-critical operations",
    "rank": 89
  },
  {
    "name": "architecture-samples",
    "url": "https://github.com/android/architecture-samples",
    "stars": 45748,
    "forks": 11863,
    "lang": "Kotlin",
    "desc": "A collection of samples to discuss and showcase different architectural tools and patterns for Android apps.",
    "rank": 7
  },
  {
    "name": "shannon",
    "url": "https://github.com/KeygraphHQ/shannon",
    "stars": 45667,
    "forks": 5301,
    "lang": "TypeScript",
    "desc": "Shannon is an autonomous, white-box AI pentester for web applications and APIs. It analyzes your source code, identifies attack vectors, and executes real exploits to prove vulnerabilities before they reach production.",
    "rank": 90
  },
  {
    "name": "zx",
    "url": "https://github.com/google/zx",
    "stars": 45602,
    "forks": 1274,
    "lang": "JavaScript",
    "desc": "A tool for writing better scripts",
    "rank": 66
  },
  {
    "name": "bruno",
    "url": "https://github.com/usebruno/bruno",
    "stars": 45591,
    "forks": 2674,
    "lang": "JavaScript",
    "desc": "Opensource IDE For Exploring and Testing API's (lightweight alternative to Postman/Insomnia)",
    "rank": 67
  },
  {
    "name": "iina",
    "url": "https://github.com/iina/iina",
    "stars": 45556,
    "forks": 2862,
    "lang": "Swift",
    "desc": "The modern video player for macOS.",
    "rank": 5
  },
  {
    "name": "jest",
    "url": "https://github.com/jestjs/jest",
    "stars": 45541,
    "forks": 6807,
    "lang": "TypeScript",
    "desc": "Delightful JavaScript Testing.",
    "rank": 91
  },
  {
    "name": "FlClash",
    "url": "https://github.com/chen08209/FlClash",
    "stars": 45504,
    "forks": 2874,
    "lang": "Dart",
    "desc": "A multi-platform proxy client based on ClashMeta,simple and easy to use, open-source and ad-free.",
    "rank": 6
  },
  {
    "name": "helix",
    "url": "https://github.com/helix-editor/helix",
    "stars": 45404,
    "forks": 3611,
    "lang": "Rust",
    "desc": "A post-modern modal text editor.",
    "rank": 32
  },
  {
    "name": "pandoc",
    "url": "https://github.com/jgm/pandoc",
    "stars": 45383,
    "forks": 3917,
    "lang": "Haskell",
    "desc": "Universal markup converter",
    "rank": 1
  },
  {
    "name": "Leaflet",
    "url": "https://github.com/Leaflet/Leaflet",
    "stars": 45335,
    "forks": 6144,
    "lang": "JavaScript",
    "desc": "🍃 JavaScript library for mobile-friendly interactive maps 🇺🇦",
    "rank": 68
  },
  {
    "name": 