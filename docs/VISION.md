# Visión LifeOS

> Un sistema operativo personal que centraliza información, automatiza procesos rutinarios mediante reglas y utiliza IA solo cuando el razonamiento semántico aporta un beneficio claro.

## Capacidades actuales (Julio 2026)

1. **Memoria personal** — perfil, metas, finanzas, psicología, hardware, contexto maestro, estado persistente.
2. **Motor de empleo v1.0** — scorer, gap analyzer, reviewer pipeline, EV, learning ROI, todo <5ms 95% determinístico.
3. **Gestión académica** — SENA, CESDE, evidencias, seguimiento, materiales.
4. **Centro de comunicaciones** — Gmail, Telegram, rule engine para clasificar y accionar.
5. **Planificador** — Calendar, pendientes, empleo, estudios, finanzas.
6. **Motor de decisiones** — qué oferta, qué skill, qué curso, qué tarea tiene más impacto.
7. **Automatización** — GitHub Actions, scrapers, loops, mantenimiento.
8. **Observabilidad** — histórico, eventos, métricas, scores, decisiones.

## Preguntas que LifeOS debe responder

1. ¿Qué debo hacer hoy? (agenda + prioridades)
2. ¿Qué oportunidad me conviene más? (motor de decisiones)
3. ¿Qué está bloqueando mis objetivos? (análisis de brechas)
4. ¿Qué aprendí del último mes? (métricas y feedback)
5. ¿Qué puedo automatizar mañana para ahorrar tiempo? (rule engine + event bus)

## Roadmap inmediato (próximos sprints)

### Sprint 4 — Calibración
- Dataset 50-100 ofertas reales
- Ajuste de pesos de `scoring_weights.json`
- Versionado de reglas (`rulesetVersion`)
- Benchmark: precisión apply/skip vs criterio humano

### Sprint 5 — Dedup + Change Detection
- Detector de duplicados (hash de contenido + empresa/cargo/salario)
- Detector de cambios en ofertas ya vistas (re-score automático)
- Cola de aplicación (Top N priorizadas)

### Sprint 6 — Estados + Reportes
- Estados más ricos: NEW → SCORED → QUEUED → CV_READY → APPLIED → VIEWED → INTERVIEW → REJECTED → OFFER → HIRED
- Dashboard semanal en Markdown
- Reporte exportable por período

### No automatizar aún
- No aplicar automáticamente. Primero validar que el scorer prioriza bien.
- El pipeline produce Top 10 → el usuario aprueba → se aplica.

## Principios de diseño

1. Regla antes que IA.
2. Event Bus antes que acoplamiento.
3. Configuración antes que código.
4. Medir antes de optimizar.
5. Un origen de verdad.
6. La IA es un amplificador, no un requisito.
