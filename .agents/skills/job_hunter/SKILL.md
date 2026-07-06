---
name: job_hunter
description: Sistema de búsqueda de empleo QA/Tech en Colombia. Activa cuando Jeiser habla de buscar trabajo, revisar ofertas, preparar entrevistas, actualizar CV o seguimiento de aplicaciones.
---

# Job Hunter — Sistema de Búsqueda QA Colombia

**Perfil objetivo:** QA Automation Engineer Junior/Semi-Senior | Medellín/Remoto | Colombia

## Estado actual del mercado (Colombia 2026)

### Plataformas prioritarias
1. **Computrabajo** — mayor volumen QA Colombia
2. **LinkedIn** — empresas tech internacionales con operación Colombia
3. **Indeed Colombia** — startups y outsourcing
4. **GetOnBord** — startups latinoamericanas tech
5. **Torre.co** — perfiles tech Colombia/LATAM

### Stack QA más demandado Colombia 2026
- **Playwright** (TypeScript) — altísima demanda, ya lo tienes ✅
- **Selenium + Java** — legacy empresas grandes
- **Cypress** — startups frontend-heavy
- **Postman/Bruno** — QA API (práctica con Bruno ✅)
- **k6/JMeter** — performance testing (diferenciador)
- **JIRA + Confluence** — gestión de proyectos

## Modos de operación

### /cv — Generar/Actualizar CV
- Leer `data/perfil.md` y `data/aplicaciones.json`
- Generar CV enfocado en QA Automation
- Formato: ATS-friendly (sin tablas, sin columnas fancy)
- Keywords obligatorias: "Playwright", "Test Automation", "CESDE", "QA"

### /ofertas — Analizar oferta específica
Input: URL o texto de la oferta
- Extraer requisitos técnicos y blandos
- Comparar con perfil de Jeiser
- Match score 0-100
- Gap analysis: qué le falta, qué tiempo toma aprenderlo

### /prep-entrevista — Preparar entrevista técnica
- Simular preguntas QA técnicas reales
- Preguntas de behavioral (STAR method)
- Preguntas sobre el stack del puesto
- Red flags a detectar en la empresa

### /seguimiento — Estado de aplicaciones
- Leer `data/aplicaciones.json`
- Reportar: aplicadas, en proceso, rechazadas, sin respuesta >7 días
- Alertar si hay seguimiento pendiente

### /pitch — Elevator pitch
- 30 segundos para LinkedIn recruiter
- 2 minutos para entrevista inicial
- Personalizable por empresa/sector

## Reglas de búsqueda para Jeiser

1. **Salario mínimo:** No aplicar bajo $2.5M COP para Junior, $3.5M para Semi-Senior
2. **Modalidad:** Priorizar remoto o híbrido (conductor Didi = horario flexible)
3. **Stack obligatorio en la oferta:** Al menos Playwright O Selenium O Cypress
4. **Evitar:** Call centers disfrazados de QA, empresas sin stack definido
5. **Priorizar:** Empresas con cultura de testing real (unit + integration + e2e)

## Script de auto-tracking (integrar en email_processor)

```javascript
// Detectar correos de ofertas y guardar en aplicaciones.json
const JOB_KEYWORDS = ['QA', 'Quality Assurance', 'Test Automation', 'Playwright', 
                       'entrevista', 'proceso de selección', 'prueba técnica'];
```

## Recursos de preparación

- Roadmap QA: https://roadmap.sh/qa
- Preguntas entrevista: https://github.com/h5bp/Front-end-Developer-Interview-Questions
- Portafolios referencia: https://github.com/emmabostian/developer-portfolios
- CV template: https://github.com/sb2nov/resume
