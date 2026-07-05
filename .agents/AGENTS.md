# Life OS - Segundo Cerebro de Jeiser v2.0

## Arquitectura (Julio 2026) — 72/100 seguridad, 82/100 funcionalidad

```
📱 Telegram ← → ☁️ GitHub Actions (24/7) ← → 🧠 DeepSeek V4 Flash (unico LLM)
                         ↓
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    🚗 SIMIT        🎓 SENA         💼 Jobs
    (auto)          (auto)          (manual→auto)
           │             │             │
           └─────────────┼─────────────┘
                         ▼
                  🧠 Memory Engine (22 hechos, auto-carga en contexto)
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ⚖ Tributaria   🚦 Transito    🎯 Bootcamp QA
    v6.0           v1.0           28 semanas
```

## Skills de Produccion

| Skill | Version | Estado |
|-------|---------|--------|
| **transito-colombia-defensa** | v1.0 | ✅ Produccion |
| **tributaria-colombia-defensa** | v6.0 | ✅ Produccion |
| **bootcamp-qa** | v1.0 | ✅ Runtime + curriculum |
| **memory-engine** | v1.0 | ✅ 22 hechos, busqueda semantica |

## Automatizaciones Cloud (8 GitHub Actions)

| Workflow | Frecuencia | Estado |
|----------|-----------|:------:|
| `telegram-listener.yml` | Cada 3 min | ✅ |
| `sena_scraper.yml` | Lun-Vie 6am | ✅ |
| `simit_checker.yml` | Diario 7am | ✅ |
| `cloud-orchestrator.yml` | Lun-Vie 7am | ✅ |
| `email-cleaner.yml` | Cada 3h | ✅ |
| `recordatorio_cesde.yml` | Lun/Mie/Vie 5pm | ✅ |
| `reflexion_nocturna.yml` | 11pm | ✅ |
| `ci.yml` | Push | ✅ |

## Auditoria (05/07/2026)

- **007 Security Scan**: 72/100 — Aprobado con ressalvas
- **Ponytail Audit**: ~1200 lineas muertas eliminadas, 16 packages removidos
- **0 dependencias con vulnerabilidades criticas**

## Comandos Rapidos

```bash
# SENA
node scripts/moodle_sena_tracker.js ver
node scripts/moodle_sena_tracker.js completar <id>

# SIMIT
node scripts/simit_scraper.js

# Memoria
node -e "require('./lib/memory_engine').getResumenMemoria()"

# Bootcamp
node scripts/scan_local_repos.js
```
