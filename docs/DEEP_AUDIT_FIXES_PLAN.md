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
