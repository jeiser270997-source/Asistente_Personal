# ESTADO VIVO (Perfil Maestro de Jeiser)
**Última actualización:** 2026-07-13 (actualización contexto SIMIT — 3 multas detalladas, C29 Itagüí pagada, C14 Itagüí cobro coactivo)

## 👤 Identidad
- **Nombre:** Jeiser Abraham Gutierrez Torres
- **CC:** [REDACTED - Ver .env]
- **Teléfono:** [REDACTED - Ver .env]
- **Email:** [REDACTED - Ver .env]
- **Ubicación:** [REDACTED - Ver .env]
- **Dispositivo Principal:** Samsung Galaxy S23 Ultra (Android / One UI)
- **Acceso al sistema:** SSH vía Tailscale → OpenCode (interacción directa)
- **Canal Telegram:** Activo (algunos workflows desactivados por errores puntuales)

## 🧠 Psicológico
- **Estrés actual:** Moderado. Usa el asistente para liberar carga cognitiva.
- **Estilo preferido:** Respuestas cortas, directas, sin adulación. Si está equivocado, decirlo.
- **Filosofía:** Verdad radical. Cero rodeos.

## 💰 Financiero
- **Ingreso actual:** Conductor DiDi (Meta: $260,000 COP brutos / $200,000 netos diarios)
- **Gastos Fijos Detectados:** Arriendo ($1,300,000) + Servicios EPM (~$308,000). Total base mensual: ~$1.6M
- **Estrategia DiDi:** Turnos fraccionados (AM 5:00-10:30 y PM 15:30-20:00). 
  - Regla estricta: NO CONDUCIR de 10:30 AM a 3:30 PM por ola de calor.
  - Carro: Toyota Corolla 2010 ([REDACTED - Ver .env]) - Rendimiento 8 km/L.
  - Táctica: Viajes menores a 20 min, zonas planas, maximizar bonos nocturnos.
- **Deuda DIAN AG2023:** ~$9.8M vencida. **REGLA HIERRO: NO firmar 814, NO pagar, NO contactar Cobranzas.** Prescripción ~09/2029.
- **Deuda DIAN AG2024:** ~$524K (sanción mínima mora). Petición 2026DP000161298 asignada 09/06/2026, en espera.
- **DIAN AG2025:** NO OBLIGADO. No declarar.
- **UGPP 2023:** Cerrado favorable 12/06/2026.
- **SIMIT — Total deuda:** ~$1.862.535 (3 multas activas en sistema, **verificado por scraper**)
  - 🔵 **Multa Medellín** — Pendiente pago (Verificado por scraper Medellín: 1 sola multa por $658.364). No se ha pagado porque Medellín no embarga rápido.
  - 🟠 **Multa Itagüí #1** — ✅ **YA PAGADA.** Itagüí embargó y cobró. Sigue apareciendo en SIMIT por demora.
  - ⛔ **Multa Itagüí #2 (Nueva)** — **Peligro de embargo.** (Scraper Itagüí arreglado: superado bug de truncamiento por símbolo '#' en el .env). Estrategia activa: Derecho de petición radicado 02/07/2026. Frena embargos temporalmente. Posible victoria por Silencio Administrativo el ~24 de julio. SIMIT (Martha) pide oficio para descargarla.
- **Vehículos:** KEW496 (Toyota Corolla 2010, SOAT hasta 31-Dic-2026) · BXU28C (moto — SOAT y RTM vencidos, NO circular)
- **Denuncia Moto BXU28C:** NUNC 110016102535202609577 (abuso de confianza) — Fiscalía 11, radicada 20/05/2026. Consultar estado: https://www.fiscalia.gov.co/colombia/servicios-de-informacion-al-ciudadano/consultas/
- **Denuncia NUNC 110016102838202604358:** Caso separado — Fiscalía 68 U. Intervención Temprana Bogotá. 21/05/2026: sin avances sustanciales. Contacto: fis68loctempranabog@fiscalia.gov.co

## 🎓 Académico / Educativo
- **Institución principal:** CESDE, Medellín — **Beca 70%**
- **Técnico Laboral en Desarrollo de Software (CESDE):** Presencial (Aula 406)
  - 📅 **Sábados:**
    - 07:30 - 10:30: Gestión de Bases de Datos
    - 10:30 - 15:00: Introducción a la Programación
    - 15:00 - 18:00: Lógica de Programación
  - 🌐 **Virtual:** Cátedra Ser Emprendedor (Sin horario fijo)
  - 📌 *Inicia:* Sábado 25 de julio de 2026
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
- **Workflows activos:** 0 (migrando a local/PM2 — workflow YAMLs eliminados Jul 2026) — ver tabla abajo

## 🤖 Automatizaciones Producción
| ~~Workflow~~ | ~~Frecuencia~~ | ~~Estado~~ |
|:---|---|:---:|
| Todos los YAML | — | 🗑️ Eliminados Jul 2026 (deep audit) |
| Sustituto local | PM2 / Task Scheduler | 🔄 En migración |

## 📋 Scripts Job Hunter
| Script | Uso | Estado |
|--------|-----|:------:|
| `scripts/revisar_ofertas.js` | Scrape + scoring DeepSeek 0-100 | ✅ ARREGLADO |
| `scripts/computrabajo_apply.js` | Auto-apply + preguntas selección | ✅ FUNCIONA |
| `scripts/cv_tailorer.js` | CV personalizado por oferta | ✅ |
| `scripts/job_loop.js` | Pipeline completo | ✅ |
| `scripts/dian_scraper.js` | Login DIAN MUISCA | ✅ |

## ⚠️ Pendientes
1. **Importar .ics a Google Calendar** — `data/artifacts/cesde_introductorio_julio2026.ics` (Revisar si falta alguna clase).
*Nota: Excel SENA aprobado (falta bajar certificado). El gap 2022-2024 se cubre con DiDi y estudios autónomos (vibecoding).*

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
| LLM Service | fetch() nativo a DeepSeek | openai SDK + LiteLLM client + baseURL DeepSeek + valley/pico |
| Memoria hechos | JSON file (hechos.json) | SQLite (memoria_hipocampo.db) |
| Bootstrap | bootstrap.js custom 40 líneas | dotenv.config() directo |
| Skills duplicadas | 3 skills cargadas 2x | 0 duplicadas |
| Skills externas | 6 rutas a Documents | 100% local (30 skills) |

### Librerías nuevas
`json-rules-engine` · `valibot`

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
