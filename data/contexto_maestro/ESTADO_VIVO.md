# ESTADO VIVO (Perfil Maestro de Jeiser)
**Última actualización:** 2026-07-06 (sesión nocturna automatización completa)

## 👤 Identidad
- **Nombre:** Jeiser Abraham Gutierrez Torres
- **CC:** 1019156838
- **Teléfono:** +57 304 461 5613
- **Email:** jeiser270997@gmail.com
- **Ubicación:** Urb. Villa Eloisa, Bloque 25 Apto 102, Medellín, Colombia
- **Acceso al sistema:** SSH vía Tailscale → OpenCode (interacción directa)
- **Canal Telegram:** Notificaciones automáticas (SIMIT, SENA, jobs, DIAN)

## 🧠 Psicológico
- **Estrés actual:** Moderado. Usa el asistente para liberar carga cognitiva.
- **Estilo preferido:** Respuestas cortas, directas, sin adulación. Si está equivocado, decirlo.
- **Filosofía:** Verdad radical. Cero rodeos.

## 💰 Financiero
- **Ingreso actual:** Conductor DiDi (variable, flexible)
- **Deuda DIAN AG2023:** ~$9.8M vencida. **REGLA HIERRO: NO firmar 814, NO pagar, NO contactar Cobranzas.** Prescripción ~09/2029.
- **Deuda DIAN AG2024:** ~$524K (sanción mínima mora). Petición 2026DP000161298 asignada 09/06/2026, en espera.
- **DIAN AG2025:** NO OBLIGADO. No declarar.
- **UGPP 2023:** Cerrado favorable 12/06/2026.
- **SIMIT comparendo:** 0000838097 (C29 Itagüí) — Recurso de reposición enviado 05/07/2026. En espera.
- **Vehículos:** KEW496 (Toyota Corolla 2010, SOAT hasta 31-Dic-2026) · BXU28C (moto — SOAT y RTM vencidos, NO circular)

## 🎓 Académico / Educativo
- **Institución principal:** CESDE, Medellín — Beca 70%
- **Curso introductorio (becados):** Obligatorio · Presencial + virtual · 6–8pm
  - Clase 3: Lun 6 Jul ✅ (hoy)
  - Clase 4: Mié 8 Jul
  - Clase 5: Vie 10 Jul
  - Clase 6: Mié 15 Jul
  - Clase 7: Vie 17 Jul
  - Clase 8: Mié 22 Jul
  - Clase 9: Vie 24 Jul → **Asignación del taller**
  - Clase 10: Lun 27 Jul → **Entrega del taller** (deadline real)
- **CESDE Bootcamp QA presencial:** Inicia **Sábado 25 de julio de 2026** (7am–6pm)
- **SENA — Bases de Datos:** (ficha 3549155, Zajuna) ✅ En curso
- **SENA — Excel:** Plataforma Zajuna — pendiente confirmar nombre exacto

## 💼 Laboral
- **Estado:** Búsqueda activa QA/Tech en Medellín + remoto
- **Disponibilidad:** Lunes–Viernes tiempo completo (Sábado ocupado CESDE)
- **Mejor match encontrado:** Software QA Analyst — score 55-65/100 (Itconsultores SAS, Medellín)
- **Gap principal:** 1 año experiencia formal en QA (skills técnicas ✅, exp formal ❌)
- **Plataformas activas:** Computrabajo (scrapeado diario Lun-Vie 8am)
- **CV:** `data/jobs/cv_jeiser.html` (formato sb2nov/resume) · Copia en Escritorio
- **Auto-apply:** `scripts/computrabajo_apply.js` — login Computrabajo pendiente de fix selector

## 🚗 Experiencia Laboral (pendiente detalles del usuario)
- **DiDi Colombia** — Conductor independiente (2024 – Presente)
- **Experiencia anterior:** Pendiente que Jeiser confirme empresas y cargos

## 🏗️ Sistema LifeOS
- **Arquitectura:** Node.js + Lóbulos (Frontal, Temporal, Parietal, Occipital, Hipotálamo)
- **Memoria:** SQLite persistente (`memoria_hipocampo.db`) + `data/memoria/hechos.json`
- **LLM:** DeepSeek V4 Flash (horario valle 11pm-8am Colombia)
- **Fallback:** Gemini Flash / OpenRouter Free
- **Workflows activos:** 12 (todos ubuntu-22.04)

## 🤖 Automatizaciones Producción (12 workflows)
| Workflow | Frecuencia | Estado |
|----------|-----------|:------:|
| `telegram-listener.yml` | Cada 3 min | ✅ |
| `sena_scraper.yml` | Lun-Vie 6am | ✅ |
| `simit_checker.yml` | Diario 7am | ✅ |
| `cloud-orchestrator.yml` | Diario 7am | ✅ |
| `email-cleaner.yml` | Cada 3h | ✅ |
| `recordatorio_cesde.yml` | Lun/Mié/Vie 5pm + Sáb 9pm | ✅ |
| `recordatorio_deepseek.yml` | 6am/7pm/10pm | ✅ |
| `document-pipeline.yml` | Diario 9am | ✅ |
| `healthcheck.yml` | Diario 8am | ✅ |
| `ci.yml` | Push | ✅ |
| `computrabajo_scraper.yml` | Lun-Vie 8am | ✅ NEW |
| `dian_scraper.yml` | Lunes 9am | ✅ NEW |

## 📋 Scripts Job Hunter (NEW — 2026-07-06)
| Script | Uso |
|--------|-----|
| `scripts/computrabajo_scraper.js` | Scraping diario, 38-43 ofertas QA |
| `scripts/computrabajo_apply.js` | Auto-apply con score IA (login CT pendiente fix) |
| `scripts/cv_tailorer.js` | CV personalizado por oferta (HTML sb2nov) |
| `scripts/job_loop.js` | Pipeline completo: scrape→analiza→tailoring |
| `scripts/dian_scraper.js` | Login DIAN MUISCA + extracción exhaustiva |

## ⚠️ Pendientes Críticos
1. **Experiencia laboral anterior de Jeiser** — no registrada. Preguntar al inicio.
2. **SENA Excel** — confirmar nombre exacto del curso para el CV.
3. **DIAN obligaciones detalle** — navegar desde Dashboard haciendo click (no URL directa).
4. **CESDE Taller** — se asigna el Vie 24 Jul, entrega Lun 27 Jul.

## 🔑 Credenciales (referencia)
- **SENA Moodle:** `1019156838` / `A125230aaa.`
- **DIAN MUISCA:** `1019156838` / `A125%230aa` (CC)
- **Computrabajo:** `jeiser270997@gmail.com` / `A125%230a`
- **Placa:** KEW496 · CC: 1019156838
