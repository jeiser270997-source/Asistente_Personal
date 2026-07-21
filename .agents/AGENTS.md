# Life OS - Segundo Cerebro de Jeiser v2.5
**Última actualización:** 2026-07-21 (Paradigma Cuerpo & Cerebro + Scorer Fix + AGENTS.md unificado)

## Principios de diseño (constitución del proyecto)

1. **Regla antes que IA.** Si puede resolverse con reglas determinísticas, no usar LLM.
2. **Event Bus antes que acoplamiento.** Los módulos emiten eventos; no conocen a sus consumidores.
3. **Configuración antes que código.** Las reglas viven en JSON, no en ifs dispersos.
4. **Medir antes de optimizar.** Toda automatización debe producir métricas.
5. **Un origen de verdad.** No duplicar estado; usar `lib/data/paths.js` como acceso centralizado.
6. **El Sistema es el Cuerpo, el Agente es el Cerebro.** LifeOS funciona determinísticamente como un cuerpo autónomo local. Al no existir APIs de LLM gratuitas/continuas para procesos en segundo plano 24/7, la inteligencia interactiva y el razonamiento analítico los aporta el Agente de IA (Antigravity, OpenCode, etc.) impulsado por modelos como **DeepSeek V4 Flash** al iniciar una sesión interactiva.
7. **Single-Tenant Absoluto (NO SaaS).** Este sistema es personal y exclusivo para Jeiser. Cero sobre-ingeniería para escalabilidad multi-usuario o microservicios innecesarios.
8. **Filtro anti-ciclo de auditoría.** Si no está roto y cumple su función → solo mantenimiento. No re-auditar por deporte. Nueva ronda solo con: fallo real, regresión de tests, o cambio de requisito de Jeiser.

## Modelo Operativo "Cuerpo & Cerebro" (Agentes + DeepSeek V4 Flash)

**Concepto Clave:**
- **LifeOS = El Cuerpo:** Contiene la estructura física (scripts Node.js/TypeScript, base de datos SQLite WAL `data/memoria_hipocampo.db`, Rule Engine determinista, Event Bus con Transactional Outbox, scrapers Playwright/Cheerio y notificaciones). Se ejecuta localmente on-demand (`npm run morning`, `npm run session`) sin requerir llamadas de pago a LLM 24/7.
- **Agente de IA = El Cerebro:** Dado que no se cuenta con APIs gratis de LLM en producción continua, la inteligencia interactiva reside en el agente (ej. Antigravity o OpenCode CLI con DeepSeek V4 Flash). Al abrir una sesión, el agente actúa como el cerebro que habita el cuerpo: lee `ESTADO_VIVO.md`, consulta memorias en SQLite, ejecuta `npm test`, repara scrapers y responde a las necesidades de Jeiser.

| Qué sí hace el Agente | Qué no hace |
|-----------------------|-------------|
| Diagnóstico activo + fix puntual tras fallo reproducible | "Auditar por deporte" sin síntoma ni bug |
| Correr `npm test` y mantener 100% tests verdes | Añadir frameworks/microservicios "por si acaso" |
| Ajustar selectores CSS/XPath o reglas JSON deterministas | Reescribir arquitecturas estables que ya funcionan |
| Commits limpios con verificación empírica previa | Refactors cosméticos masivos que metan deuda técnica |

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

**Perfil Psicológico y Operativo (SRE Mindset):**
- **Nivel real:** Falso Junior (Aplica a QA Automation Junior pero diseña arquitectura Cloud/SRE).
- **Mindset:** Hustler pragmático. Trabaja en DiDi, estudia CESDE/SENA y programa infraestructura compleja. Odia el trabajo manual.
- **Trato requerido:** Comunicación técnica directa, cero explicaciones básicas. Fomentar su marketing personal para potenciar su transición laboral.

**⚠️ PENDIENTES ACTIVOS:**
1. Experiencia laboral anterior de Jeiser — NO registrada. Preguntar.
2. SENA Excel — confirmar nombre exacto del curso para el CV.
3. ✅ Fix login Computrabajo — Resuelto (Flujo 2 pasos implementado).
4. DIAN obligaciones detalle — navegar Dashboard por clicks (no URL directa).
5. SENA Actividad 2 — Cuadro Comparativo + Taller (vence 07/07/2026 ⚠️ HOY).

## Conexiones y APIs Disponibles (Herramientas del Cuerpo)

LifeOS cuenta con integraciones locales y servicios conectados sin depender de suscripciones LLM de pago:

| API / Integración | Propósito y Uso | Modo |
|-------------------|-----------------|------|
| **Gmail API** (`googleapis`) | Leer, clasificar, etiquetar correos y ejecutar Inbox Zero | Interactivo / Script determinista |
| **Google Calendar API** | Consultar agenda, horarios CESDE, clases SENA y bloques de trabajo | Interactivo / Script |
| **Telegram Bot API** (`telegraf`) | Envío de notificaciones matutinas, briefs y alertas urgentes | Salida de alertas |
| **Scrapers (Playwright / Cheerio)** | Extracción de datos en SIMIT (multas), SENA Zajuna (tareas), Computrabajo (QA jobs) y DIAN | Interactivo / Script |
| **Persistencia SQLite WAL** | Memoria continua de hechos, aplicaciones y casos (`data/memoria_hipocampo.db`) | Local continuo |
| **ntfy / Apprise** | Notificaciones push de alta prioridad en dispositivos | Salida de notificaciones |

## Capacidades: ¿Qué puede hacer el Agente en Sesión?

Cuando Jeiser inicia una sesión interactiva (Antigravity / OpenCode + DeepSeek V4 Flash), el Agente actúa como el **Cerebro Activo** y puede:

1. **Gestión de Correo (Gmail):** Procesar la bandeja de entrada, mover promociones a spam, filtrar notificaciones importantes de SENA/DIAN y aplicar `EMAIL_INBOX_ZERO=true`.
2. **Organización de Calendario y Agenda:** Revisar horarios, verificar choques entre estudio CESDE (Sábados/Noches), clases SENA y jornadas de conducción DiDi.
3. **Estudio Interactivo & Bootcamp QA Personalizado:**
   - Guiar la ruta de aprendizaje de **QA Automation Junior** (28 semanas: Playwright, TS, Postman, SQL, Docker).
   - Utilizar la **Técnica Feynman** y preguntas socráticas para resolver dudas, repasar bases de datos Zajuna y realizar talleres.
4. **Búsqueda Laboral & Tailoring de CV:** Analizar ofertas de empleo QA en Colombia, calcular match empírico (`scorer.js`) y adaptar el CV para cada postulación.
5. **Diagnóstico y Reparación de Código:** Correr `npm test`, arreglar scrapers caídos por cambio de HTML y mantener el proyecto en 100% verde.

## Únicas Automatizaciones en Segundo Plano (Strictly Deterministic — SIN LLM)

Para evitar alucinaciones, cuotas caídas de APIs gratis, costos y errores por respuestas variables, **las automatizaciones en background son 100% determinísticas (Zero LLM)** y sencillas:

```bash
npm run morning          # Ejecución matutina automática
npm run session          # Sesión local programada
```

| Horario | Función Automática | LLM Usado | Canal |
|---------|--------------------|-----------|-------|
| **05:00 AM / 06:00 AM** | **Briefing Matutino:** Pico y Placa (KEW496), clima, estado de clases SENA/CESDE y tareas del día | ❌ NINGUNO (Reglas JSON / SQL) | Telegram |
| **08:15 AM** | **Briefing de Inicio de Trabajo:** Recordatorio de arranque de jornada laboral/estudio | ❌ NINGUNO (Reglas deterministas) | Telegram |

> ⚠️ **REGLA INQUEBRANTABLE:** Ninguna automatización de fondo (cron/background) debe depender de llamadas a APIs de LLM gratuitas. Todo el background debe ser determinista, rápido, liviano y cero fallos.

## Catálogo de Skills Disponibles

| Skill | Función y Uso |
|-------|---------------|
| **qa_bootcamp** | Tutoría socrática especializada en QA Automation, Playwright, TS y roadmap de 28 semanas. |
| **tutor** | Explicación académica mediante la Técnica Feynman (simplificar conceptos complejos). |
| **career-qa** / **job_hunter** | Estrategia laboral QA, optimización de perfil, simulación de entrevistas y tailoring de CV. |
| **finanzas_didi** | Control presupuestal para ingresos DiDi, deudas tributarias DIAN y metas de ahorro. |
| **transito-colombia-defensa** | Asesoría legal en tránsito colombiano, derechos en retenes e impugnación de fotomultas SIMIT. |
| **tributaria-colombia-defensa** | Defensa y seguimiento de obligaciones tributarias persona natural ante la DIAN (UVT 2026). |
| **anti-sycophancy** | Sinceridad radical (cero adulación, prioriza la verdad objetiva). |
| **buen_gusto** | Filtro anti-slop para garantizar comunicación pulida, profesional y estética. |
| **ciberseguridad** | Buenas prácticas de seguridad en software bajo estándares MITRE/NIST. |
| **memory-engine** | Gestión de persistencia semántica y contextual en la DB SQLite. |

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

# Backup DBs a Google Drive
npm run backup
```

## Comandos Rápidos (SSH / Local)

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

# Briefing Matutino (Local - Requiere USB)
npm run briefing
```

## Auditoría (08/07/2026)

- **Sintaxis**: ✅ 0 errores. CI/CD reforzado con `npx tsc --noEmit` para archivos TS.
- **TypeScript**: ✅ `morning_briefing.ts` y `set_alarms.ts` refactorizados corriendo vía `tsx`.
- **Workflows**: ✅ 12 activos, todos ubuntu-22.04. Auditados y testeados en local.
- **SIMIT Scraper**: ✅ Bug de variable vacía (`curr.multas` vs `curr.detalle.multas`) corregido. Cero falsas "Multas Resueltas".
- **Brain Orchestrator**: ✅ Rutas absolutas (`BASE_DIR`) corregidas, ya logra procesar correos del SIMIT exitosamente.
- **Backups**: ✅ Tarea automatizada para comprimir `.db` y `.json` y moverlos a Google Drive (`G:\My Drive\LifeOS_Backups\`).
- **Fixes**: ✅ Login Computrabajo arreglado (flujo 2 pasos y detección anti-trampas implementada).

## Reglas de Comportamiento

- **Sinceridad Radical**: Si Jeiser está equivocado, decirlo directamente.
- **Anti-adulación**: Prohibido "esto es oro puro", "excelente pregunta", etc.
- **Prioriza la verdad** sobre la validación emocional.
- **DeepSeek**: Solo usar en horario valle (11pm–8am Colombia). Fuera usar fallback.
- **Al inicio de sesión**: Leer ESTADO_VIVO.md primero, luego responder.
- **Regla GitHub**: Si existe repo en GitHub para la tarea, usarlo. Inventar solo si no existe.
