# Arquitectura LifeOS

## Estructura del proyecto

```
scripts/              → Entrypoints. Sin lógica de negocio.
  jobs/               → Scrapers, aplicaciones, CV
  schedulers/         → brain, jarvis, research, context
  integrations/       → Gmail, Telegram, DIAN, SIMIT, SENA, CESDE
  diagnostics/        → healthcheck, runtime-audit, debug
  maintenance/        → reflexión nocturna, research personal
  dev/                → herramientas de desarrollo internas

lib/                  → Lógica del sistema.
  ai/                 → LLM service, prompts, decisiones
  lobulos/            → Módulos cerebrales (frontal, parietal, temporal, etc)
  memory/             → Memoria persistente del agente
  context/            → Contexto y estado
  events/             → Event Bus
  data/               → Capa de acceso a datos (paths, reader, writer)
  integrations/       → Clientes externos (Google, Telegram, Crawl4AI)
  runtime/            → Reglas, sanitize, resume engine
  scheduling/         → Programación de tareas
  skills/             → Skill engine
  think/              → Ciclo de pensamiento del agente
  jobs/               → Módulo de empleo
    types/            → Modelos de datos
    contracts/        → Interfaces de servicios
    metrics/          → Métricas e histórico
    reviewers/        → Revisores de CV
    docs/             → Pipeline, state machine, persistencia

data/                 → Datos del sistema.
  config/             → Configuración estática (versionada)
  state/              → Estado persistente (versionada)
  cache/              → Datos regenerables (NO versionada)
  sources/            → Documentos fuente
  user/               → Datos personales (versionada)
  artifacts/          → PDFs, reportes generados (NO versionada)

runtime/              → Runtime stores (SQLite)

docs/                 → Documentación
```

## Pipeline de empleo

```
Fuente externa (Computrabajo, LinkedIn, etc)
    │
    ▼
Normalizer          → Convierte datos crudos a JobPosting
    │
    ▼
Scorer              → Score híbrido: 70% reglas + 30% LLM (opt-in)
    │                → ScoreBreakdown, EV (Expected Value)
    │
    ▼
GapAnalyzer         → Cobertura %, skills faltantes, Learning ROI
    │
    ▼
ReviewerPipeline    → 3 revisores determinísticos (ATS, Consistency, Technical)
    │                → 1 revisor LLM opcional (Recruiter)
    │
    ▼
Decision            → apply / maybe / skip
    │
    ▼
Event Bus           → job.scored, job.gap_analyzed
    │
    ▼
historical.json     → Dataset para feedback loop
```

## Filosofía de diseño

1. **Determinístico primero.** ≥90% de decisiones sin IA.
2. **LLM solo para juicio semántico.** Narrativa, tono, alineación.
3. **Medible desde el día 1.** Cada ejecución genera métricas.
4. **Desacoplado.** Scorer no conoce a sus consumidores (Event Bus).
5. **Estructura por tipo.** `data/` separa config/state/cache/sources/user/artifacts.

## Política de data/

| Carpeta   | Versionado | Regenerable |
|-----------|-----------|-------------|
| config/   | ✅ Sí      | ❌ No       |
| state/    | ✅ Sí      | ❌ No       |
| cache/    | ❌ No      | ✅ Sí       |
| sources/  | depende    | depende     |
| user/     | ✅ Sí      | ❌ No       |
| artifacts/| ❌ No      | ✅ Sí       |
