# Life OS - Segundo Cerebro de Jeiser v2.2
**Última actualización:** 2026-07-06 (sesión completa: DIAN + Jobs + CV)

## Arquitectura (Julio 2026) — 87/100 seguridad, 93/100 funcionalidad

```
📱 Telegram (solo notif) ← → ☁️ GitHub Actions (12 workflows, ubuntu-22.04)
                                         ↓
                          🧠 DeepSeek V4 Flash (único LLM, horario valle)
                                         ↓
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
       🚗 SIMIT (auto)           🎓 SENA (auto)           💼 Jobs (auto)
              │                          │                          │
              │                          │                 Computrabajo scraper
              │                          │                 Auto-apply + CV tailor
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
              │  MD: data/state/contexto_maestro/ESTADO_VIVO.md (perfil)  │
              └─────────────────────────────────────────────────────┘
                                         ↓
         ⚖ Tributaria v6  │  🚦 Transito v1  │  🎯 Bootcamp QA  │  💼 Job Hunter
```

## CONTEXTO RÁPIDO — Leer al inicio de cada sesión

**Jeiser Abraham Gutierrez Torres** · CC 1019156838 · +57 304 461 5613
Medellín, Colombia · jeiser270997@gmail.com · Conductor DiDi → busca trabajo QA Tech

**Perfil técnico:** QA Automation Junior · Playwright · JS · Node.js · Git · GitHub Actions · Postman · SQL
**Proyecto clave:** LifeOS (11 workflows en producción, scraping SIMIT/SENA/DIAN/CT, LLM integration)
**Mejor match laboral:** Software QA Analyst 55-65/100 · Gap único: 1 año exp formal
**CESDE:** Sábados 7am-6pm (próximo horario) · actual Lun/Mié/Vie 6-8pm
**SENA:** Bases de Datos (Zajuna) + Excel (Zajuna) — ambos en curso

**⚠️ PENDIENTES ACTIVOS:**
1. Experiencia laboral anterior de Jeiser — NO registrada. Preguntar.
2. SENA Excel — confirmar nombre exacto del curso para el CV.
3. Fix login Computrabajo — `computrabajo_apply.js` falla selector email.
4. DIAN obligaciones detalle — navegar Dashboard por clicks (no URL directa).
5. SENA Actividad 2 — Cuadro Comparativo + Taller (vence 07/07/2026 ⚠️ HOY).

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

## Automatizaciones Cloud (12 GitHub Actions — todos en ubuntu-22.04)

| Workflow | Frecuencia | Estado |
|----------|-----------|:------:|
| `telegram-listener.yml` | Cada 3 min | ✅ |
| `sena_scraper.yml` | Lun-Vie 6am | ✅ |
| `simit_checker.yml` | Diario 7am | ✅ |
| `cloud-orchestrator.yml` | Diario 7am | ✅ |
| `email-cleaner.yml` | Cada 3h | ✅ |
| `recordatorio_cesde.yml` | Lun/Mié/Vie 5pm + Sáb 2am UTC | ✅ |
| `recordatorio_deepseek.yml` | 6am/7pm/10pm | ✅ |
| `document-pipeline.yml` | Diario 9am | ✅ |
| `healthcheck.yml` | Diario 8am | ✅ |
| `ci.yml` | Push | ✅ |
| `computrabajo_scraper.yml` | Lun-Vie 8am Colombia | ✅ NEW |
| `dian_scraper.yml` | Lunes 9am Colombia | ✅ NEW |

## Scripts Job Hunter (NEW — 2026-07-06)

```bash
# Scraping diario Computrabajo
node scripts/computrabajo_scraper.js

# Pipeline completo: scrape→analiza→tailoring (dry-run)
node scripts/job_loop.js --loops=3 --min-score=40 --dry-run

# Auto-apply (requiere fix login CT)
node scripts/computrabajo_apply.js --auto

# CV personalizado para oferta específica
node scripts/cv_tailorer.js <url_oferta>

# DIAN extracción exhaustiva
node scripts/dian_scraper.js
```

## Comandos Rápidos (SSH)

```bash
# Correos
node scripts/email_processor.js

# SENA
node scripts/moodle_sena_tracker.js ver

# SIMIT
node scripts/simit_scraper.js

# Memoria
node -e "const m=require('./lib/memory_engine'); console.log(JSON.stringify(m.getResumenMemoria(),null,2))"

# Audit completo
node scripts/audit.js

# Reflexión nocturna (manual)
node scripts/reflexion_nocturna.js
```

## Auditoría (06/07/2026)

- **Sintaxis**: ✅ 0 errores
- **Workflows**: ✅ 12 activos, todos ubuntu-22.04
- **DIAN Login**: ✅ Angular mat-select fix funcional
- **Computrabajo Scraper**: ✅ 38-43 ofertas/día
- **CV**: ✅ sb2nov/resume HTML · Escritorio de Jeiser
- **Job Loop**: ✅ Scrape + DeepSeek análisis + tailoring funcional
- **Fix pendiente**: ❌ Login CT en `computrabajo_apply.js` (timeout selector email)

## Reglas de Comportamiento

- **Sinceridad Radical**: Si Jeiser está equivocado, decirlo directamente.
- **Anti-adulación**: Prohibido "esto es oro puro", "excelente pregunta", etc.
- **Prioriza la verdad** sobre la validación emocional.
- **DeepSeek**: Solo usar en horario valle (11pm–8am Colombia). Fuera usar fallback.
- **Al inicio de sesión**: Leer ESTADO_VIVO.md primero, luego responder.
- **Regla GitHub**: Si existe repo en GitHub para la tarea, usarlo. Inventar solo si no existe.
