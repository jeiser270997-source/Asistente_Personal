# Life OS - Segundo Cerebro de Jeiser v2.5
**Última actualización:** 2026-07-21 (+🐘 Facebook repo hunter, job_loop fix, email inbox-zero)

## Principios de diseño (constitución del proyecto)

1. **Regla antes que IA.** Si puede resolverse con reglas determinísticas, no usar LLM.
2. **Event Bus antes que acoplamiento.** Los módulos emiten eventos; no conocen a sus consumidores.
3. **Configuración antes que código.** Las reglas viven en JSON, no en ifs dispersos.
4. **Medir antes de optimizar.** Toda automatización debe producir métricas.
5. **Un origen de verdad.** No duplicar estado; usar `lib/data/paths.js` como acceso centralizado.
6. **El Sistema es el Cuerpo, el Agente es el Cerebro.** LifeOS funciona determinísticamente como un cuerpo autónomo local. Al no existir APIs de LLM gratuitas/continuas para procesos en segundo plano 24/7, la inteligencia interactiva y el razonamiento analítico los aporta el Agente de IA (Antigravity, OpenCode, etc.) impulsado por modelos como **DeepSeek V4 Flash** al iniciar una sesión interactiva.
7. **Single-Tenant Absoluto (NO SaaS).** Este sistema es personal y exclusivo para Jeiser. Cero sobre-ingeniería para escalabilidad multi-usuario o microservicios innecesarios.
8. **Filtro anti-ciclo de auditoría (Regla de los 90 Días).** Máximo 1 auditoría completa por trimestre. No re-auditar por deporte ni generar reportes teóricos sin ejecución. Próxima auditoría autorizada: **No antes de Octubre 2026**, únicamente bajo trigger válido (fallo ejecutable reproducible, regresión de tests, o nuevo módulo mayor).
9. **Normas APA (7ma Edición) Globales.** Todo documento, informe académico, guía de estudio, resumen o entregable SENA/CESDE generado por el Agente debe cumplir con el estándar APA 7ª edición (estructura formal de títulos Nivel 1-3, citas parentéticas/narrativas `(Autor, Año)`, tablas con título descriptivo en cursiva y sección de Referencias alfabética).

## Modelo Operativo "Cuerpo & Cerebro" (Agentes + DeepSeek V4 Flash)

**Concepto Clave:**
- **LifeOS = El Cuerpo:** Contiene la estructura física (scripts Node.js/TypeScript, base de datos SQLite WAL `data/memoria_hipocampo.db`, Rule Engine determinista, Event Bus con Transactional Outbox, scrapers Playwright/Cheerio y notificaciones). Se ejecuta localmente on-demand (`npm run morning`, `npm run session`) sin requerir llamadas de pago a LLM 24/7.
- **Agente de IA = El Cerebro:** Dado que no se cuenta con APIs gratis de LLM en producción continua, la inteligencia interactiva reside en el agente (ej. Antigravity o OpenCode CLI con DeepSeek V4 Flash). Al abrir una sesión, el agente actua como el cerebro que habita el cuerpo: lee `ESTADO_VIVO.md`, consulta memorias en SQLite, ejecuta `npm test`, repara scrapers y responde a las necesidades de Jeiser.

| Qué sí hace el Agente | Qué no hace |
|-----------------------|-------------|
| Diagnóstico activo + fix puntual tras fallo reproducible | "Auditar por deporte" sin síntoma ni bug |
| Correr `npm test` y mantener 100% tests verdes | Añadir frameworks/microservicios "por si acaso" |
| Ajustar selectores CSS/XPath o reglas JSON deterministas | Reescribir arquitecturas estables que ya funcionan |
| Commits limpios con verificación empírica previa | Refactors cosméticos masivos que metan deuda técnica |

**Gate antes de tocar código:**
1. ¿Hay error reproducible o test fallando? → arreglar.
2. ¿Solo "mejoraría"? → NO, es mantenimiento diferible.
3. Tras fix: `npm test` (y `npm run runtime:ci` si tocó paths/stores).

**Optimizado para agentes:** sí a nivel de contrato (AGENTS.md, paths canónicos, fail-closed, tests de política, semi-auto jobs). No es a prueba de alucinaciones: DeepSeek puede romper scrapers o inventar deps — el freno es tests + no poner `--auto` en PM2 + principio 8.

**DeepSeek horario:** preferir valle (11pm–8am COT) para tokens baratos; fuera de valle el runtime LifeOS usa fallbacks. El *agente de coding* con DeepSeek es independiente del horario del `llm_service` de producción.

## Arquitectura general (patrón LifeOS)

```
Fuente → Normalizer → Rule Engine → {conocido → Action | ambiguo → LLM}
                                         → Event Bus → Persistencia → Métricas
```

Este patrón aplica a: Gmail, Calendar, SENA, DIAN, SIMIT, finanzas, Telegram, y futuros módulos.

## Arquitectura (Julio 2026)

```
📱 Telegram → 🖥️ Local Runtime (on-demand: npm run session)
  (solo envía mensajes, ya no escucha comandos)
                                         ↓
                          🧠 DeepSeek V4 Flash / Gemini / OpenRouter (multi-proveedor)
                                         ↓
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
       🚗 SIMIT (auto)           🎓 SENA (auto)           💼 Jobs (auto)
              │                          │                          │
              │                          │                 Computrabajo scraper
              │                          │                 Auto-apply + CV tailor
              └──────────────────────────┼──────────────────────────┘
                                         ▼
              ┌──────────── 💾 Memoria Persistente ─────────────────┐
              │  SQLite: data/memoria_hipocampo.db (infinita)        │
              │  MD: data/state/contexto_maestro/ESTADO_VIVO.md     │
              └─────────────────────────────────────────────────────┘
                                         ↓
         ⚖ Tributaria v6  │  🚦 Transito v1  │  🎯 Bootcamp QA  │  💼 Job Hunter
```

## CONTEXTO RÁPIDO — Leer al inicio de cada sesión

**Jeiser** · Medellín, Colombia · Conductor DiDi → busca trabajo QA Automation Junior
*Datos personales detallados en `data/state/contexto_maestro/ESTADO_VIVO.md`*

**Perfil técnico:** QA Automation Junior · Playwright · JS/TS · Node.js · Git · GitHub Actions · Postman · SQL
**Stack real:** `better-sqlite3` · `openai` · `playwright` · `telegraf` · `json-rules-engine` · `fuse.js` · `googleapis` · `cheerio`
**Proyecto clave:** LifeOS (~~13 workflows GHA~~ → 19 procesos PM2 local, scraping SIMIT/SENA/DIAN/CT, LLM multi-proveedor)
**CESDE:** Sábados 7am-6pm (próximo horario) · Lun/Mié/Vie 6-8pm
**SENA:** Bases de Datos (Zajuna) + Excel (Zajuna) — ambos en curso

**Perfil:**
- Falso Junior — aplica a QA Automation Junior pero diseña arquitectura Cloud/SRE
- Hustler pragmático: trabaja en DiDi, estudia CESDE/SENA y programa infraestructura compleja
- Trato: comunicación técnica directa, cero explicaciones básicas

## Conexiones y APIs Disponibles (Herramientas del Cuerpo)

LifeOS cuenta con integraciones locales y servicios conectados sin depender de suscripciones LLM de pago:

| API / Integración | Propósito y Uso | Modo |
|-------------------|-----------------|------|
| **Gmail API** (`googleapis`) | Leer, clasificar, etiquetar correos y ejecutar Inbox Zero | Interactivo / Script determinista |
| **Google Calendar API** | Consultar agenda, horarios CESDE, clases SENA y bloques de trabajo | Interactivo / Script |
| **Telegram Bot API** (`telegraf`) | Envío de notificaciones matutinas, briefs y alertas urgentes | Salida de alertas |
| **Scrapers (Playwright / Cheerio)** | Extracción de datos en SIMIT (multas), SENA Zajuna (tareas), Computrabajo (QA jobs) y DIAN | Interactivo / Script |
| **Persistencia SQLite WAL** | Memoria continua de hechos, aplicaciones y casos (`data/memoria_hipocampo.db`) | Local continuo |
| **ntfy / Apprise** | Notificaciones push de alta prioridad en dispositivos | Salida de notificaciones |

## Capacidades: ¿Qué puede hacer el Agente en Sesión?

Cuando Jeiser inicia una sesión interactiva (Antigravity / OpenCode + DeepSeek V4 Flash), el Agente actúa como el **Cerebro Activo** y puede:

1. **Gestión de Correo (Gmail):** Procesar la bandeja de entrada, mover promociones a spam, filtrar notificaciones importantes de SENA/DIAN y aplicar `EMAIL_INBOX_ZERO=true`.
2. **Organización de Calendario y Agenda:** Revisar horarios, verificar choques entre estudio CESDE (Sábados/Noches), clases SENA y jornadas de conducción DiDi.
3. **Estudio Interactivo & Bootcamp QA Personalizado:**
   - Guiar la ruta de aprendizaje de **QA Automation Junior** (28 semanas: Playwright, TS, Postman, SQL, Docker).
   - Utilizar la **Técnica Feynman** y preguntas socráticas para resolver dudas, repasar bases de datos Zajuna y realizar talleres.
4. **Búsqueda Laboral & Tailoring de CV:** Analizar ofertas de empleo QA en Colombia, calcular match empírico (`scorer.js`) y adaptar el CV para cada postulación.
5. **Diagnóstico y Reparación de Código:** Correr `npm test`, arreglar scrapers caídos por cambio de HTML y mantener el proyecto en 100% verde.

## Únicas Automatizaciones en Segundo Plano (Strictly Deterministic — SIN LLM)

Para evitar alucinaciones, cuotas caídas de APIs gratis, costos y errores por respuestas variables, **las automatizaciones en background son 100% determinísticas (Zero LLM)** y sencillas:

```bash
npm run morning          # Ejecución matutina automática
npm run session          # Sesión local programada
```

| Horario | Función Automática | LLM Usado | Canal |
|---------|--------------------|-----------|-------|
| **05:00 AM / 06:00 AM** | **Briefing Matutino:** Pico y Placa (KEW496), clima, estado de clases SENA/CESDE y tareas del día | ❌ NINGUNO (Reglas JSON / SQL) | Telegram |
| **08:15 AM** | **Briefing de Inicio de Trabajo:** Recordatorio de arranque de jornada laboral/estudio | ❌ NINGUNO (Reglas deterministas) | Telegram |

> ⚠️ **REGLA INQUEBRANTABLE:** Ninguna automatización de fondo (cron/background) debe depender de llamadas a APIs de LLM gratuitas. Todo el background debe ser determinista, rápido, liviano y cero fallos.

## Catálogo de Skills Disponibles

| Skill | Función y Uso |
|-------|---------------|
| **qa_bootcamp** | Tutoría socrática especializada en QA Automation, Playwright, TS y roadmap de 28 semanas. |
| **tutor** | Explicación académica mediante la Técnica Feynman (simplificar conceptos complejos). |
| **career-qa** / **job_hunter** | Estrategia laboral QA, optimización de perfil, simulación de entrevistas y tailoring de CV. |
| **finanzas_didi** | Control presupuestal para ingresos DiDi, deudas tributarias DIAN y metas de ahorro. |
| **transito-colombia-defensa** | Asesoría legal en tránsito colombiano, derechos en retenes e impugnación de fotomultas SIMIT. |
| **tributaria-colombia-defensa** | Defensa y seguimiento de obligaciones tributarias persona natural ante la DIAN (UVT 2026). |
| **anti-sycophancy** | Sinceridad radical (cero adulación, prioriza la verdad objetiva). |
| **buen_gusto** | Filtro anti-slop para garantizar comunicación pulida, profesional y estética. |
| **ciberseguridad** | Buenas prácticas de seguridad en software bajo estándares MITRE/NIST. |
| **memory-engine** | Gestión de persistencia semántica y contextual en la DB SQLite. |

## Automatizaciones CLI

## Comandos Rápidos (SSH / Local)

```bash
# Correos
node scripts/integrations/email_processor.js

# Inbox zero (marca leídos + etiqueta + saca del inbox)
EMAIL_INBOX_ZERO=true node scripts/integrations/email_processor.js

# SENA
node scripts/integrations/moodle_sena_tracker.js ver

# SIMIT
node scripts/integrations/simit_scraper.js

# Facebook Repo Hunter (midudev, mouredev, theaiempire)
node scripts/integrations/facebook_scraper.js

# Audit
node scripts/diagnostics/runtime-audit.js

# Healthcheck
node scripts/diagnostics/healthcheck.js

# Memoria
node -e "const m=require('./lib/memory/memory_engine'); console.log(JSON.stringify(m.getResumenMemoria(),null,2))"

# Backup DBs
npm run backup

# Briefing Matutino
npm run briefing
```

## Auditorías

### Ronda 1 (15/07/2026 — deep audit completo)

Deep audit ejecutado: score 48→72+ con fixes aplicados.
- **F01**: Path memoria_hipocampo.db unificado → `data/` (canónico)
- **F02**: OpenRouter 402 mitigado (max_tokens dinámico 400-1200)
- **F03**: Healthcheck reescrito con PATHS canónicos (9 checks, no scripts/data)
- **F04**: Fail-closed en scorer — LLM caído = score 0, no auto-apply
- **F06**: Gitignore + untrack litestream leftovers
- **F07**: SENA scraper selectores más resilientes + syntax fix
- **F08**: scripts/data/ archivado a etc/archived/
- **F09/F10**: Docs honestos, PII removida de system prompt global
- **O1**: SENA syntax `})await` corregido
- **O2**: Fail-closed real en 4 scripts de jobs (scraper, apply, job_loop, cv_tailorer)
- **O4**: 13 workflows GHA eliminados

### Ronda 2 (18/07/2026 — seguridad, permisos, event bus, dashboard)

Auditoría de seguridad y robustez.
- **FIX-001** [CRITICAL] — SSRF en `crawl4ai_client.js`: validación `isPrivateIp()` + `isUrlSafe()`. ✅
- **FIX-002** [CRITICAL] — `opencode.json`: permisos granulares (`*: deny`) con allowlist. ✅
- **FIX-003** [CRITICAL] — `.claude/settings.local.json`: retirados patrones git del allowlist. ✅
- **FIX-004** [HIGH] — Event bus conectado a Transactional Outbox (`OutboxStore.insert()`). ✅
- **FIX-005** [LOW] — `bus.drain()` antes de `process.exit()` en jarvis/context. ✅
- **FIX-006** [MEDIUM] — Dashboard API: error sanitizado vs `error.message` crudo. ✅
- **FIX-007** [MEDIUM] — `frontal.js`: `JSON.parse` de tool-call envuelto en try/catch. ✅
- **FIX-008** [LOW] — IPv6 `::` añadido a bloqueo en `isPrivateIp()`. ✅
- **FIX-009** [MEDIUM] — 🔲 Pendiente: `email_processor.js` envía correos al LLM sin `sensitive=true`.

**Protecciones adicionales (18/07/2026):**
- `.gitignore` actualizado con dumps personales, diagnostics, scratch, temp, audit patches
- 7 scripts de jobs obsoletos archivados en `scripts/jobs/_archived/`

### Ronda 3 (18/07/2026 — WheelSaver deep audit + implementación)

Deep audit con WheelSaver: score 92/100, ready checklist 7/7.

| Fix | Descripción | Estado |
|:---:|-------------|:------:|
| **R3-01** | `tests/event_bus.test.js` — 27 tests: emit, retry, DLQ, backpressure, drain, metrics, idempotencia | ✅ |
| **R3-02** | `tests/outbox_store.test.js` — 17 tests: insert, getPending, markFailed, resetStuck, moveToDlq, cleanup | ✅ |
| **R3-03** | `docker-compose.yml` — ntfy (push notifications) + uptime-kuma (monitoreo) añadidos | ✅ |
| **R3-04** | `data/apprise/apprise.yml` — multi-canal: Telegram + ntfy + tags críticos/info | ✅ |
| **R3-05** | `lib/integrations/notifications.js` — triple canal: ntfy → Apprise → Telegram con envío concurrente | ✅ |
| **R3-06** | `scripts/diagnostics/pm2_health_monitor.js` — endpoint HTTP /health + /metrics (Prometheus) para uptime-kuma | ✅ |
| **R3-07** | `ecosystem.config.js` — proceso `pm2-health` añadido (daemon, puerto 9090) | ✅ |
| **R3-08** | `docs/wheelsaver_deep_audit_lifeos_round3.md` — reporte consolidado del deep audit | ✅ |

### Ronda 5 (19/07/2026 — Fase 2: Migración, tests seguros, WheelSaver, documentación)

Auditoría de deuda técnica y saneamiento general.

| Fix | Prioridad | Descripción | Estado |
|:---:|:---------:|-------------|:-----:|
| **FIX-016** | 🔴 HIGH | `runtime/migrate.js`: Unificar DB_PATH del migrador standalone con el canónico `data/memoria_hipocampo.db` vía `process.env.LIFEOS_DB_PATH` | ✅ |
| **FIX-017** | 🟠 MEDIUM | `scripts/daily_routine.js`: Args `--dry-run` y `--no-shutdown` para testear rutina sin apagar el host físico | ✅ |
| **FIX-018** | 🟠 MEDIUM | `lib/integrations/wheel_saver_client.js`: Guardas en 6 entrypoints + caché operacional (`_isOperationalCached`) para evitar llamadas con DB vacía | ✅ |
| **FIX-019** | 🔵 LOW | `README.md` + `dashboard/README.md`: Reemplazar templates heredados (Litestream, create-next-app) con documentación real de LifeOS | ✅ |

**Validación:** 87/87 tests exitosos. Sin regresiones.

### Ronda 4 (19/07/2026 — Email Processor fixes + refactor)

Auditoría de clasificación de correos y refactorización.

| Fix | Descripción | Estado |
|:---:|-------------|:------:|
| **R4-01** [CRITICAL] | `email_processor.js`: Reorden del loop — `ruleEngine.matchAll()` ejecutado PRIMERO, `isImportant()` después. Antes isImportant() movía correos a Basura antes de que el rule_engine los clasificara (ej: Confirmación matrícula SENA perdida). | ✅ |
| **R4-02** [HIGH] | `email_processor.js`: Eliminados `'noreply'`/`'no-reply'` de `JUNK_KEYWORDS`. Causaban falsos negativos en alertas legítimas (Google Security, SENA, etc.). | ✅ |
| **R4-03** [MEDIUM] | `email_processor.js`: Refactor — lógica de descarga de adjuntos extraída a función compartida `processAttachments()`. Ahora se llama desde `action.archive`, `action.notify` y fallback `isImportant()`. Antes solo se ejecutaba en el fallback. | ✅ |
| **R4-04** [LOW] | `brain_orchestrator.js`: Keywords sincronizadas con `email_processor.js` + eliminar encoding roto en patrones regex. | ✅ |
| **R4-05** [LOW] | `docs/DECISIONS.md`: Add entry about email classifier ordering. | ✅ |

### Ronda 6 (20/07/2026 — Job semi-auto + PII + deuda operativa)

| Fix | Prioridad | Descripción | Estado |
|:---:|:---------:|-------------|:-----:|
| **R6-01** | 🔴 CRITICAL | `job_loop.js`: default SEMI-AUTO; LIVE solo con `--auto`; PM2 con `--dry-run` | ✅ |
| **R6-02** | 🔴 CRITICAL | `computrabajo_apply.js`: entrypoint `main` + misma política; deja de ser no-op en PM2 | ✅ |
| **R6-03** | 🔴 HIGH | `email_processor.js`: `sensitive=true` siempre al resumir con LLM (FIX-009) | ✅ |
| **R6-04** | 🟠 MEDIUM | PII redactada en `ESTADO_VIVO.md` (credenciales → .env) | ✅ |
| **R6-05** | 🔵 LOW | `valibot` eliminado (0 imports); tests de política en `tests/job_apply_policy.test.js` | ✅ |

## Reglas de Comportamiento

- **Sinceridad Radical**: Si Jeiser está equivocado, decirlo directamente.
- **Anti-adulación**: Prohibido "esto es oro puro", "excelente pregunta", etc.
- **Prioriza la verdad** sobre la validación emocional.
- **DeepSeek**: Solo usar en horario valle (11pm–8am Colombia). Fuera usar fallback.
- **Al inicio de sesión**: Leer `ESTADO_VIVO.md` primero, luego responder.
- **Regla GitHub**: Si existe repo en GitHub para la tarea, usarlo. Inventar solo si no existe.
