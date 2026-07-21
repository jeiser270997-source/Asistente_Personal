# ESTADO VIVO (Perfil Maestro de Jeiser)
**Última actualización:** 2026-07-21 (auditoría Gmail completa + scraper Itagüí — respuesta Itagüí C14 leída, C14 confirmada pagada, DP calibración C29 radicado HOY)

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

## 💰 Financiero y Vehículo (Toyota Corolla KEW496)
- **Ingreso actual:** Conductor DiDi (Meta: $260,000 COP brutos / $200,000 netos diarios)
- **Gastos Fijos Detectados:** Arriendo ($1,300,000) + Servicios EPM (~$308,000). Total base mensual: ~$1.6M
- **Métricas de Operación y Gasolina (KEW496):**
  - **Gasolina:** Galón entre $16.000 y $16.500 COP. Tanqueo de $30.000 COP rinde 60 km.
  - **Costo de combustible por km:** **$500 COP / km**.
  - **Cobro de referencia por km:** **$2.000 COP / km**.
  - **Ganancia Neta por km:** **$1.500 COP / km** (Margen del 75%).
  - **Estrategia DiDi:** **Viajes cortos exclusivamente** (máximo 20 minutos totales entre recogida y entrega, zonas planas, evitar trancones).
  - **Horario estricto:** Turnos AM (05:00-10:30) y PM (15:30-20:00). **Prohibido conducir entre 10:30 AM y 3:30 PM** por ola de calor.
- **Deuda DIAN AG2023:** ~$9.8M vencida. **REGLA HIERRO: NO firmar 814, NO pagar, NO contactar Cobranzas.** Prescripcion ~09/2029.
- **Deuda DIAN AG2024:** ~$524K (sanción mínima mora). Petición 2026DP000161298 asignada 09/06/2026, en espera.
- **SIMIT — Total deuda:** ~$1.867.199 (3 multas activas en sistema, **verificado en tiempo real 21/07/2026**)
  - 🟡 **C29 Medellín #0000679154** — $658,900 COP ($572.628 + intereses $86.272). Pendiente pago.
  - 🟢 **C14 Itagüí #0000430265** — ✅ **ANULADO POR ITAGÜÍ.** PDF de solicitud enviado a Martha (FCM/SIMIT) el 21/07/2026 para descargue en portal nacional.
  - ⛔ **C29 Itagüí #0000838097** — $639,018 COP ($705,380 proyectado). **Recurso de reposición + DP calibración DEI radicado (AI26072102803271). PDF oficial enviado a FCM/SIMIT.**
- **Vehículos:** KEW496 (Toyota Corolla 2010, SOAT hasta 31-Dic-2026) · BXU28C (moto — SOAT y RTM vencidos, NO circular)

## 🎓 Académico / Educativo
- **Institución principal:** CESDE, Medellín — **Beca 70%**
- **Técnico Laboral en Desarrollo de Software (CESDE):** Presencial (Aula 406)
  - 📅 **Sábados (07:30 a 18:00):** Gestión de BD, Intro Programación, Lógica.
  - 📌 *Inicia:* Sábado 25 de julio de 2026
- **SENA Virtual (Estrategia 4 cursos simultáneos máximo):**
  1. 🟢 **Ficha 3565476 (NUEVO - En Formación):** *Aplicación del Marco de Trabajo Scrum para Proyectos de Desarrollo de Software* (Bienvenida recibida 21/07/2026. 📅 Agendado en Google Calendar para Mié 22/07 5:00 PM con aviso 1h antes + Link Zoom).
  2. 🟢 **Ficha 3549155 (En Formación):** *Bases de Datos Generalidades y Sistemas de Gestión* (Zajuna).
  3. 🟡 **Ficha 2459016 (Preinscrito):** *Construcción de Bases de Datos con MySQL*.
  4. 🟡 **Ficha 2253040 (Preinscrito):** *Variables y Estructuras de Control en Python*.
  5. 🏆 **Ficha 3510166 (Certificado/Aprobado):** *Excel 2016*.

## 💼 Laboral & Estrategia de Postulaciones
- **Estado:** Búsqueda activa QA Automation / Soporte TI.
- **Política de Postulación:** **100% MANUAL por Jeiser.**
  - El scraper de background busca vacantes en Computrabajo y calcula el score.
  - En el briefing de las 8:15 AM se le envían las 2-3 mejores vacantes con score > 65/100 para que Jeiser ingrese y aplique manualmente.
  - Cero auto-apply ciego para evitar quemar postulaciones con CVs no alineados.
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
2. **C14 — Limpiar SIMIT:** Buscar comprobante de pago en historial del portal Itagüí y enviarlo a SIMIT para que descarguen el fantasma.
3. **C29 Itagüí — Silencio Adm:** Preparar seguimiento ~24-26 Jul si no responden al recurso reposición.
4. **C29 Medellín — Pendiente defensa:** Sin acción aún. Decidir estrategia.
*Nota: Excel SENA aprobado (falta bajar certificado). El gap 2022-2024 se cubre con DiDi y estudios autónomos (vibecoding).*

## 🔑 Credenciales (referencia — solo en .env / gestor de contraseñas)
- **SENA Moodle / DIAN MUISCA / Computrabajo / CC / placas:** ver `.env` y gestor de contraseñas.
- **No versionar** usuarios, cédula, emails ni contraseñas en este archivo.

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
