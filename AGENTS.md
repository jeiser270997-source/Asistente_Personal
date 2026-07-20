# Life OS - Segundo Cerebro de Jeiser v2.5
**Última actualización:** 2026-07-20 (wake→sleep, OmniRoute gateway, pico lun 4-ago)

## Principios de diseño (constitución del proyecto)

1. **Regla antes que IA.** Si puede resolverse con reglas determinísticas, no usar LLM.
2. **Event Bus antes que acoplamiento.** Los módulos emiten eventos; no conocen a sus consumidores.
3. **Configuración antes que código.** Las reglas viven en JSON, no en ifs dispersos.
4. **Medir antes de optimizar.** Toda automatización debe producir métricas.
5. **Un origen de verdad.** No duplicar estado; usar `lib/data/paths.js` como acceso centralizado.
6. **La IA es un amplificador, no un requisito.** El sistema debe funcionar aunque el LLM esté deshabilitado.
7. **Single-Tenant Absoluto (NO SaaS).** Este sistema es personal y exclusivo para Jeiser.
8. **Filtro anti-ciclo de auditoría.** Si no está roto y cumple su función → solo mantenimiento. No re-auditar por deporte. Nueva ronda solo con: fallo real, regresión de tests, o cambio de requisito de Jeiser.

## Uso con agentes (DeepSeek V4 Flash + herramientas)

**Modelo operativo (Jul 2026):** Jeiser abre un agente, activa DeepSeek V4 Flash, y pide usar herramientas del repo (leer código, correr tests, arreglar). Si algo se daña, el mismo agente repara.

| Qué sí | Qué no |
|--------|--------|
| Fallo de scraper / test rojo / proceso PM2 caído | "Audita todo otra vez" sin síntoma |
| `npm test` + fix puntual | Reescribir arquitectura sin bug |
| Ajustar selectores o reglas JSON | Añadir frameworks "por si acaso" |
| Commit de fix verificado | Refactor cosmético masivo |

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
📱 Telegram (local via PM2) ← → 🖥️ Local Runtime (PM2 / Task Scheduler)
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

## Automatizaciones

**Runtime canónico (Jul 2026): on-demand, sin PM2, sin PC 24/7.**

Jeiser enciende la PC 1–2 veces al día para organizar. No daemons.

```bash
npm run morning          # ÚNICO auto: 5am wake → informe → sleep otra vez
npm run morning -- --no-sleep
npm run session          # opcional al sentarte (scrapers)
```

| Qué | Cómo |
|-----|------|
| Auto | Solo `morning_wake` (Telegram). **Vuelve a sleep.** Sin LLM. |
| Correo / estudio | Agente + **OmniRoute** (`localhost:20128`). Correo auto **sin** LLM. |
| Calendar / alarmas | **Manual.** LifeOS no escribe Calendar. |
| Pico y placa KEW496 | Desde **2026-08-04: LUNES 05:00–20:00** (`data/config/pico_placa.json`) |
| Free-tier APIs | Configúralas en **OmniRoute**; LifeOS las usa vía gateway (`docs/OMNIROUTE.md`) |

Detalle: `docs/FLUJO_JEISER.md` · `docs/MORNING_WAKE.md` · `docs/OMNIROUTE.md`.

## Comandos Rápidos (SSH / Local)

```bash
# Correos
node scripts/integrations/email_processor.js

# SENA
node scripts/integrations/moodle_sena_tracker.js ver

# SIMIT
node scripts/integrations/simit_scraper.js

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
