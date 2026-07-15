# Life OS - Segundo Cerebro de Jeiser v2.5
**Última actualización:** 2026-07-15 (deep audit fixes: paths unificados, fail-closed, docs honestos)

## Principios de diseño (constitución del proyecto)

1. **Regla antes que IA.** Si puede resolverse con reglas determinísticas, no usar LLM.
2. **Event Bus antes que acoplamiento.** Los módulos emiten eventos; no conocen a sus consumidores.
3. **Configuración antes que código.** Las reglas viven en JSON, no en ifs dispersos.
4. **Medir antes de optimizar.** Toda automatización debe producir métricas.
5. **Un origen de verdad.** No duplicar estado; usar `lib/data/paths.js` como acceso centralizado.
6. **La IA es un amplificador, no un requisito.** El sistema debe funcionar aunque el LLM esté deshabilitado.
7. **Single-Tenant Absoluto (NO SaaS).** Este sistema es personal y exclusivo para Jeiser.

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
**Stack real:** `better-sqlite3` · `openai` · `playwright` · `telegraf` · `json-rules-engine` · `valibot` · `fuse.js` · `googleapis` · `cheerio`
**Proyecto clave:** LifeOS (~~13 workflows GHA~~ → 18 procesos PM2 local, scraping SIMIT/SENA/DIAN/CT, LLM multi-proveedor)
**CESDE:** Sábados 7am-6pm (próximo horario) · Lun/Mié/Vie 6-8pm
**SENA:** Bases de Datos (Zajuna) + Excel (Zajuna) — ambos en curso

**Perfil:**
- Falso Junior — aplica a QA Automation Junior pero diseña arquitectura Cloud/SRE
- Hustler pragmático: trabaja en DiDi, estudia CESDE/SENA y programa infraestructura compleja
- Trato: comunicación técnica directa, cero explicaciones básicas

## Automatizaciones

~~13 GitHub Actions~~ eliminados Jul 2026 (deep audit).
Runtime local vía PM2 (`ecosystem.config.js`). Arrancar con `pm2 start`.

| Proceso | Tipo | Schedule (UTC) |
|---------|:----:|:--------------:|
| jarvis-telegram | daemon | always-on |
| brain-orchestrator | cron | 7am COT (12pm) |
| context-engine-daily | cron | 6am COT (11am) |
| morning-briefing | cron (tsx) | 7am COT (12pm) |
| email-cleaner | cron | cada 3h |
| inbox-sensor | cron | */15 min |
| sena-scraper | cron | lun-vie 6am COT (11am) |
| sena-tracker | cron | 7am COT (12pm) |
| simit-checker | cron | 7am COT (12pm) |
| dian-scraper | cron | lun 9am COT (2pm) |
| computrabajo-scraper | cron | lun-vie 8am COT (1pm) |
| computrabajo-apply ⚠️ | cron | lun-vie 9am COT (2pm) |
| job-loop | cron | lun-vie 10am COT (3pm) |
| healthcheck | cron | 8am COT (1pm) |
| recordatorio-deepseek | cron | 6am/7pm/10pm COT |
| document-pipeline | cron | 9am COT (2pm) |
| vehicle-manager | cron | 6am COT (11am) |
| backup-dbs | cron (tsx) | 11pm COT (4am) |

> **⚠️ computrabajo-apply**: Opera en modo SEMI-AUTO por defecto (sin flag `--auto`).
> Si no hay token Telegram configurado, no aplica ofertas. Nunca ejecutar con `--auto`
> sin supervisión humana. Política: modo semi-auto siempre, full-auto solo con aprobación explícita.

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

## Auditoría (15/07/2026 — deep audit completo)

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

**Stack real (`package.json`):** `better-sqlite3` · `openai` · `playwright` · `telegraf` · `json-rules-engine` · `valibot` · `fuse.js` · `googleapis` · `cheerio` · `dotenv`

## Reglas de Comportamiento

- **Sinceridad Radical**: Si Jeiser está equivocado, decirlo directamente.
- **Anti-adulación**: Prohibido "esto es oro puro", "excelente pregunta", etc.
- **Prioriza la verdad** sobre la validación emocional.
- **DeepSeek**: Solo usar en horario valle (11pm–8am Colombia). Fuera usar fallback.
- **Al inicio de sesión**: Leer `ESTADO_VIVO.md` primero, luego responder.
- **Regla GitHub**: Si existe repo en GitHub para la tarea, usarlo. Inventar solo si no existe.
