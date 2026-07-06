# Life OS - Segundo Cerebro de Jeiser v2.1

## Arquitectura (Julio 2026) — 85/100 seguridad, 90/100 funcionalidad

```
📱 Telegram (solo notif) ← → ☁️ GitHub Actions (10 workflows, ubuntu-22.04)
                                         ↓
                          🧠 DeepSeek V4 Flash (único LLM, horario valle)
                                         ↓
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
       🚗 SIMIT (auto)           🎓 SENA (auto)           💼 Jobs (auto)
              │                          │                          │
              └──────────────────────────┼──────────────────────────┘
                                         ▼
              ┌──────────── 🧠 Arquitectura Lobular ────────────────┐
              │  Frontal (orquestador) │ Temporal (RAG + memoria)   │
              │  Parietal (tools)      │ Occipital (visual/docs)    │
              │  Hipotálamo (autonomía Tamagotchi)                  │
              └─────────────────────────────────────────────────────┘
                                         ↓
              ┌──────────── 💾 Memoria Persistente ─────────────────┐
              │  SQLite: memoria_hipocampo.db (infinita)            │
              │  JSON: data/memoria/hechos.json (estructurada)      │
              │  MD: data/contexto_maestro/ESTADO_VIVO.md (perfil)  │
              └─────────────────────────────────────────────────────┘
                                         ↓
                 ⚖ Tributaria v6  │  🚦 Transito v1  │  🎯 Bootcamp QA
```

## Skills de Producción

| Skill | Versión | Estado |
|-------|---------|--------|
| **transito-colombia-defensa** | v1.0 | ✅ Producción |
| **tributaria-colombia-defensa** | v6.0 | ✅ UVT 2026 ($52.374) |
| **anti-sycophancy** | v1.0 | ✅ Sinceridad Radical |
| **ingeniero_avanzado** | v1.0 | ✅ Basado en Top 200 GitHub |
| **karpathy_guidelines** | v1.0 | ✅ Think→Code, Simplicity, Surgical |
| **buen_gusto** | v1.0 | ✅ Anti-Slop activo |
| **psicologo** | v1.0 | ✅ Soporte emocional |
| **modo_diario** | v1.0 | ✅ Escucha activa sin filtros |
| **financiero** | v1.0 | ✅ Consejos personalizados |
| **finanzas_didi** | v1.0 | ✅ Budget Didi + DIAN + ahorro |
| **tutor** | v1.0 | ✅ Técnica Feynman |
| **qa_bootcamp** | v1.0 | ✅ 28 semanas CESDE + roadmap |
| **job_hunter** | v1.0 | ✅ QA Colombia + CV + entrevistas |
| **ciberseguridad** | v1.0 | ✅ MITRE/NIST |
| **memory-engine** | v1.0 | ✅ Búsqueda semántica |

## Automatizaciones Cloud (10 GitHub Actions — todos en ubuntu-22.04)

| Workflow | Frecuencia | Estado |
|----------|-----------|:------:|
| `telegram-listener.yml` | Cada 3 min | ✅ |
| `sena_scraper.yml` | Lun-Vie 6am | ✅ |
| `simit_checker.yml` | Diario 7am | ✅ |
| `cloud-orchestrator.yml` | Diario 7am | ✅ |
| `email-cleaner.yml` | Cada 3h | ✅ |
| `recordatorio_cesde.yml` | Lun/Mie/Vie 5pm | ✅ |
| `recordatorio_deepseek.yml` | 6am/7pm/10pm | ✅ |
| `document-pipeline.yml` | Diario 9am | ✅ |
| `healthcheck.yml` | Diario 8am | ✅ |
| `ci.yml` | Push | ✅ |

## Auditoría (06/07/2026)

- **Sintaxis**: ✅ 22 archivos — 0 errores
- **Imports rotos**: ✅ 0 encontrados
- **Vulnerabilidades npm**: ✅ 0 críticas/altas
- **OS workflows**: ✅ Todos fijados a `ubuntu-22.04` (fix better-sqlite3)
- **Bug crítico corregido**: `reflexion_nocturna.js:45` — `.replace()` sin paréntesis
- **Memoria**: SQLite persistente (`better-sqlite3`) — migración desde lowdb ✅

## Comandos Rápidos (SSH)

```bash
# Correos
node scripts/email_processor.js

# SENA
node scripts/moodle_sena_tracker.js ver
node scripts/moodle_sena_tracker.js completar <id>

# SIMIT
node scripts/simit_scraper.js

# Memoria
node -e "const m=require('./lib/memory_engine'); console.log(JSON.stringify(m.getResumenMemoria(),null,2))"

# Audit completo
node scripts/audit.js

# Reflexión nocturna (manual)
node scripts/reflexion_nocturna.js

# Bootcamp repos
node scripts/scan_local_repos.js
```

## Reglas de Comportamiento

- **Sinceridad Radical**: Si Jeiser está equivocado, decirlo directamente.
- **Anti-adulación**: Prohibido "esto es oro puro", "excelente pregunta", etc.
- **Prioriza la verdad** sobre la validación emocional.
- **DeepSeek**: Solo usar en horario valle (11pm–8am Colombia). Fuera de ese horario usar fallback.
