# ESTADO VIVO (Perfil Maestro de Jeiser)
**Última actualización:** 2026-07-08 (upgrade masivo LifeOS: 8 fases + 10 nuevas skills WheelSaver + 30 skills locales 100%)

## 👤 Identidad
- **Nombre:** Jeiser Abraham Gutierrez Torres
- **CC:** 1019156838
- **Teléfono:** +57 304 461 5613
- **Email:** jeiser270997@gmail.com
- **Ubicación:** Urb. Villa Eloisa, Bloque 25 Apto 102, Medellín, Colombia
- **Acceso al sistema:** SSH vía Tailscale → OpenCode (interacción directa)
- **Canal Telegram:** Activo (algunos workflows desactivados por errores puntuales)

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
- **Denuncia Moto BXU28C:** NUNC 110016102535202609577 (abuso de confianza) — Fiscalía 11, radicada 20/05/2026. Consultar estado: https://www.fiscalia.gov.co/colombia/servicios-de-informacion-al-ciudadano/consultas/
- **Denuncia NUNC 110016102838202604358:** Caso separado — Fiscalía 68 U. Intervención Temprana Bogotá. 21/05/2026: sin avances sustanciales. Contacto: fis68loctempranabog@fiscalia.gov.co

## 🎓 Académico / Educativo
- **Institución principal:** CESDE, Medellín — **Beca 70%**
- **Curso introductorio (becados):** Obligatorio · Presencial · 6–8pm
  - Clase 3: Lun 6 Jul ✅
  - Clase 4: Mié 8 Jul
  - Clase 5: Vie 10 Jul
  - Clase 6: Mié 15 Jul
  - Clase 7: Vie 17 Jul
  - Clase 8: Mié 22 Jul
  - Clase 9: Vie 24 Jul → **Asignación del taller**
  - Clase 10: Lun 27 Jul → **Entrega del taller** (deadline real)
  - 📅 Recordatorios en Google Calendar (`data/artifacts/cesde_introductorio_julio2026.ics`)
- **CESDE Bootcamp QA presencial:** Inicia **Sábado 25 de julio de 2026** (7am–6pm)
- **SENA — Bases de Datos:** (ficha 3549155, Zajuna) ✅ AA1 + AA2 entregadas. AA3 en curso (08-20 Jul)
- **SENA — Excel:** Plataforma Zajuna — pendiente confirmar nombre exacto

## 💼 Laboral
- **Estado:** Búsqueda activa QA/Tech en Medellín + remoto
- **Disponibilidad:** Lunes–Viernes tiempo completo
- **Aplicaciones enviadas hoy (07/07/2026):**
  - ✅ Comfenalco Antioquia — Auxiliar Soporte Técnico ($1.800.000)
  - ✅ C.I ESLOP SAS — Auxiliar TI ($2.000.000)
- **CV base:** `data/artifacts/jobs/cv_jeiser.html`
- **CV optimizado soporte TI:** `data/artifacts/jobs/cv_jeiser_soporte_ti.pdf` ← usar para roles soporte/sistemas
- **Scraper:** `scripts/revisar_ofertas.js` ✅ funciona (login OAuth + scoring DeepSeek)
- **Auto-apply:** `scripts/computrabajo_apply.js` ✅ funciona (login + preguntas selección)

## 🚗 Experiencia Laboral
- **DiDi Colombia** — Conductor independiente (2022 – Presente)
- **Coovisocial** — Vigilante Medios Tecnológicos CCTV (Sep 2019 – Oct 2021)
- **Sitel Group (Concentrix)** — Agente Nivel 1 Iberia/Amadeus (Oct 2021 – Dic 2021)
- **Nota:** Período 2022-2024 sin registrar. Preguntar a Jeiser.

## 🏗️ Sistema LifeOS
- **Arquitectura:** Node.js + Lóbulos (Frontal, Temporal, Parietal, Occipital, Hipotálamo)
- **Memoria:** SQLite persistente (`memoria_hipocampo.db`) — hechos.json migrado a SQLite (Jul 2026)
- **LLM:** DeepSeek V4 Flash (horario valle 11pm-8am Colombia)
- **Fallback:** Gemini Flash / OpenRouter Free
- **Workflows activos:** 12 (todos ubuntu-22.04) — ver tabla abajo

## 🤖 Automatizaciones Producción
| Workflow | Frecuencia | Estado |
|----------|-----------|:------:|
| `telegram-listener.yml` | Cada 3 min | ✅ |
| `sena_scraper.yml` | Lun-Vie 6am | ✅ |
| `simit_checker.yml` | Diario 7am | ✅ |
| `cloud-orchestrator.yml` | Diario 7am | ✅ |
| `email-cleaner.yml` | Cada 3h | ✅ |
| `recordatorio_cesde.yml` | DESACTIVADO — Google Calendar | ⏸ |
| `recordatorio_deepseek.yml` | 6am/7pm/10pm | ✅ |
| `document-pipeline.yml` | Diario 9am | ✅ |
| `healthcheck.yml` | Diario 8am | ✅ |
| `ci.yml` | Push | ✅ |
| `computrabajo_scraper.yml` | Lun-Vie 8am | ✅ |
| `dian_scraper.yml` | Lunes 9am | ✅ |

## 📋 Scripts Job Hunter
| Script | Uso | Estado |
|--------|-----|:------:|
| `scripts/revisar_ofertas.js` | Scrape + scoring DeepSeek 0-100 | ✅ ARREGLADO |
| `scripts/computrabajo_apply.js` | Auto-apply + preguntas selección | ✅ FUNCIONA |
| `scripts/cv_tailorer.js` | CV personalizado por oferta | ✅ |
| `scripts/job_loop.js` | Pipeline completo | ✅ |
| `scripts/dian_scraper.js` | Login DIAN MUISCA | ✅ |

## ⚠️ Pendientes
1. **Experiencia laboral 2022-2024** — período sin registrar. Preguntar a Jeiser.
2. **SENA Excel** — confirmar nombre exacto del curso.
3. **DIAN obligaciones detalle** — navegar desde Dashboard por clicks.
4. **CESDE Taller** — se asigna Vie 24 Jul, entrega Lun 27 Jul.
5. **Importar .ics a Google Calendar** — `data/artifacts/cesde_introductorio_julio2026.ics`

## 🔑 Credenciales (referencia — almacenadas en .env / gestor de contraseñas)
- **SENA Moodle:** Usuario `1019156838` — contraseña en gestor de contraseñas
- **DIAN MUISCA:** Usuario `1019156838` — contraseña en gestor de contraseñas
- **Computrabajo:** `jeiser270997@gmail.com` — contraseña en gestor de contraseñas
- **Placa:** KEW496 · CC: 1019156838

## 🏗️ Upgrade LifeOS Jul 2026 — WheelSaver Audit

### Cambios arquitectónicos
| Componente | Antes | Después |
|-----------|-------|---------|
| Event Bus | Custom 335 líneas | EventEmitter nativo (234 líneas) + DLQ wrapper |
| Motor de reglas | matchPattern custom 109 líneas | json-rules-engine v7.3.1 + 3 operadores custom |
| LLM Service | fetch() nativo a DeepSeek | LangChain ChatOpenAI + baseURL DeepSeek + valley/pico |
| Memoria hechos | JSON file (hechos.json) | SQLite (memoria_hipocampo.db) |
| Bootstrap | bootstrap.js custom 40 líneas | dotenv.config() directo |
| Skills duplicadas | 3 skills cargadas 2x | 0 duplicadas |
| Skills externas | 6 rutas a Documents | 100% local (30 skills) |

### Librerías nuevas
`json-rules-engine` · `valibot` · `pino` · `date-fns`

### Dependencias eliminadas
`lowdb` (código muerto — 0 referencias en runtime)

### Skills nuevas (8 desde WheelSaver audit)
| Skill | Inspiración |
|-------|------------|
| `vehicle-manager` 🚗 | LubeLogger 2,668⭐ |
| `personal-dashboard` 🖥️ | Dashy 25,756⭐ + OpenClaw 382K⭐ |
| `content-pipeline` 🎥 | ViMax 11,013⭐ |
| `skill-auditor` 🔐 | NVIDIA SkillSpector 9,325⭐ |
| `second-brain-health` 🧠 | My-Brain-Is-Full-Crew 3,226⭐ |
| `bill-manager` 🛒 | Wallos 8,094⭐ |
| `backup-automator` 📁 | Duplicati 14,320⭐ |
| `think-opa` 📊 | Open Policy Agent 11,951⭐ |

### Skills importadas a local (desde Documents)
`extractor` · `job-filter` · `softball`

### Skills eliminadas por duplicación
`psicologo.md` · `tutor.md` · `cerebro.md` · `tutor_qa.md` · `financiero/`
