# Plan de Migración: data/

## Política de data/

| Carpeta   | Versionado | Regenerable | Contenido |
|-----------|-----------|-------------|-----------|
| config/   | ✅ Sí      | ❌ No       | Configuración estática del sistema |
| state/    | ✅ Sí      | ❌ No       | Estado persistente de negocio |
| cache/    | ❌ No      | ✅ Sí       | Datos regenerables de APIs externas |
| sources/  | depende    | depende     | Documentos fuente (descargas, prompts) |
| user/     | ✅ Sí      | ❌ No       | Datos personales del usuario |
| artifacts/| ❌ No      | ✅ Sí       | Reportes, CVs, PDFs generados |

## Archivos a Gitignorar

Ya están gitignorados tras el P0:
- `cache/*`
- `sources/sena/materiales/`
- `sources/documentos/`
- `sources/cesde/documentos/`
- `artifacts/*`
- `state/memoria/` (si existe)

## Tabla de Migración

### config/ (versionado)

| Ruta actual | Ruta nueva | Lectores | Escritores | Riesgo |
|------------|-----------|----------|------------|--------|
| data/rules.json | data/config/rules.json | lib/runtime/rule_engine.js | Manual | Bajo |

### state/ (versionado)

| Ruta actual | Ruta nueva | Lectores | Escritores | Riesgo |
|------------|-----------|----------|------------|--------|
| data/masterledger.json | data/state/masterledger.json | runtime-audit.js | runtime | Medio |
| data/state/contexto_maestro/ | data/state/contexto_maestro/ | brain_orch, reflexion, sena_scraper, moodle_tracker | varios | **Alto** |
| data/state/sena/seguimiento.json | data/state/sena/seguimiento.json | runtime-audit, docs/index.html | moodle_tracker | Medio |
| data/state/sena/historial_ejecuciones.json | data/state/sena/historial_ejecuciones.json | runtime-audit | scraper | Bajo |
| data/state/sena/deadlines.json | data/state/sena/deadlines.json | runtime-audit | scraper | Bajo |
| data/state/simit/alertas.json | data/state/simit/alertas.json | runtime-audit | simit_scraper | Bajo |
| data/cache/bootcamp/progreso.json | data/state/bootcamp/progreso.json | - | Manual | Bajo |
| data/cache/bootcamp/curriculum.json | data/state/bootcamp/curriculum.json | docs/index.html | Manual | Bajo |

### cache/ (NO versionado, ya gitignorado)

| Ruta actual | Ruta nueva | Lectores | Escritores | Riesgo |
|------------|-----------|----------|------------|--------|
| data/repos_db.json | data/cache/repos_db.json | research_loop, research_personal, scan_repos, picks, query_repos | update_repos_db | **Alto** |
| data/cache/repos_db_meta.json | data/cache/repos_db_meta.json | - | update_repos_db | Bajo |
| data/cache/research/research_loop_results.json | data/cache/research/research_loop_results.json | - | research_loop | Bajo |
| data/cache/research/research_personal_results.json | data/cache/research/research_personal_results.json | - | research_personal | Bajo |
| data/cache/dian/* | data/cache/dian/ | dian_scraper | dian_scraper | Medio |
| data/cache/simit/ultima_consulta.json | data/cache/simit/ultima_consulta.json | healthcheck | simit_scraper | Medio |
| data/cache/jobs/computrabajo.json | data/cache/jobs/computrabajo.json | computrabajo_scraper, cv_tailorer, job_loop | scraper | Medio |
| data/cache/jobs/canal_juniorjobs.json | data/cache/jobs/canal_juniorjobs.json | whatsapp_parser | scraper | Bajo |

### sources/ (depende del contenido)

| Ruta actual | Ruta nueva | Lectores | Escritores | Riesgo |
|------------|-----------|----------|------------|--------|
| data/sources/documentos/* | data/sources/documentos/ | document_pipeline | download_attachments | Medio |
| data/sources/cesde/comunicados/ | data/sources/cesde/comunicados/ | - | Manual | Bajo |
| data/sources/cesde/clase4/ | data/sources/cesde/clase4/ | - | Manual | Bajo |
| data/sources/sena/materiales/ | data/sources/sena/materiales/ | sena_pdf2md, moodle_downloader | moodle_downloader | **Alto** |
| data/sena/prompt_aa2_*.txt | data/sources/sena/prompts/ | - | Manual | Bajo |

### user/ (versionado)

| Ruta actual | Ruta nueva | Lectores | Escritores | Riesgo |
|------------|-----------|----------|------------|--------|
| data/perfil.md | data/user/perfil.md | job_hunter skill | Manual | Medio |
| data/user/metas.md | data/user/metas.md | - | Manual | Bajo |
| data/user/finanzas.md | data/user/finanzas.md | - | Manual | Bajo |
| data/psicologia.md | data/user/psicologia.md | - | Manual | Bajo |
| data/hardware.md | data/user/hardware.md | - | Manual | Bajo |

### artifacts/ (NO versionado)

| Ruta actual | Ruta nueva | Lectores | Escritores | Riesgo |
|------------|-----------|----------|------------|--------|
| data/artifacts/jobs/cv_tailored/* | data/artifacts/jobs/cv_tailored/ | runtime-audit | cv_tailorer, job_loop | Bajo |
| data/artifacts/jobs/cv_jeiser.html | data/artifacts/jobs/cv.html | - | apply_optimized | Bajo |
| data/artifacts/jobs/cv_jeiser_soporte_ti.pdf | data/artifacts/jobs/cv_soporte_ti.pdf | apply_optimized | apply_optimized | Bajo |
| data/sources/sena/evidencias/ | data/artifacts/sena/evidencias/ | - | Manual | Bajo |

## Referencias críticas a actualizar

### 🔴 Hardcodeadas (ruta relativa sin __dirname)
1. `scripts/schedulers/research_loop.js:6,84` — `'data/cache/repos_db.json'`
2. `scripts/maintenance/research_personal.js:6,88` — `'data/cache/repos_db.json'`
3. `scripts/dev/scan_repos_lifeos.js:3,51` — `'data/cache/repos_db.json'`
4. `scripts/dev/picks_lifeos.js:3,76` — `'data/cache/repos_db.json'`

### 🟡 Workflows con rutas a data/
1. `update_repos_db.yml:39` — `git add data/repos_db.json`
2. `simit_checker.yml:31` — `git add data/simit/`
3. `sena_scraper.yml:35` — `git add data/sena/`
4. `healthcheck.yml:30` — `git add data/audit/`
5. `dian_scraper.yml:36` — `git add data/cache/dian/`
6. `computrabajo_scraper.yml:36` — `git add data/jobs/`

### 🟡 docs/index.html (6 rutas fetch)
1. `loadJSON('data/cache/simit_multas.json')`
2. `loadJSON('data/cache/simit/ultima_consulta.json')`
3. `loadJSON('data/state/sena/seguimiento.json')`
4. `loadJSON('data/cache/bootcamp/curriculum.json')`
5. `loadJSON('data/memoria/hechos.json')`
6. `loadJSON('data/audit/health.json')`

### 🟢 Dinámicas (~60 referencias con path.join)
Todas usan `__dirname` + `path.join`. Se actualizan reemplazando la constante BASE_DIR o importando paths.js.

## Capa de resolución: lib/data/paths.js

Se creará un módulo centralizado con todas las rutas:

```js
const PATHS = {
  CONFIG: { RULES, ... },
  STATE: { MASTER_LEDGER, CONTEXTO_MAESTRO, SENA_TRACKING, ... },
  CACHE: { REPOS_DB, DIAN, SIMIT_MULTAS, ... },
  SOURCES: { SENA_MATERIALES, DOCUMENTOS, CESDE, ... },
  USER: { PROFILE, METAS, FINANZAS, ... },
  ARTIFACTS: { JOBS, SENA_EVIDENCIAS, ... },
};
```

## Orden de ejecución

1. Crear `lib/data/paths.js`
2. Crear las nuevas carpetas (config/, state/, cache/, sources/, user/, artifacts/)
3. Mover archivos (git mv para versionados, mv para no versionados)
4. Actualizar las ~60 referencias dinámicas (importar paths.js)
5. Actualizar las 4 hardcodeadas críticas
6. Actualizar los 6 workflows
7. Actualizar docs/index.html (6 fetch URLs)
8. Actualizar .gitignore con las nuevas rutas
9. Commit
