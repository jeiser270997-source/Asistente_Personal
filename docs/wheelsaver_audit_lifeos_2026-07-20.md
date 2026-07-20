# WheelSaver Audit — LifeOS (personal / single-tenant)
> Auditado el **2026-07-20** | Ronda 6 | 3,382 repos en BD local | Enfoque: sistema personal, **no SaaS**

## Lo que es este proyecto

**LifeOS** es el segundo cerebro local de Jeiser (Medellín): Telegram + PM2 + SQLite + scrapers (SENA/SIMIT/DIAN/Computrabajo) + LLM multi-proveedor solo cuando las reglas no alcanzan.

| Dato | Valor |
|------|-------|
| Tenant | 1 persona (correcto: sin multi-tenant, sin roles SaaS) |
| Stack | Node.js CJS · better-sqlite3 · Playwright · Telegraf · json-rules-engine · OpenAI SDK |
| Runtime | 19 procesos PM2 (`ecosystem.config.js`) |
| Deps runtime | 13 | Dev: 5 |
| Tests | 11 archivos · ~117 casos (vitest) |
| Código JS/TS | ~165 archivos en `lib/`, `scripts/`, `runtime/`, `tests/`, `mcp/` |
| Subproyectos | `dashboard/` (Next.js) · `wheel-saver/` (Python + BD 3.3k repos) |

**Principio de diseño que se respeta bien:** regla determinística antes que IA; event bus; `lib/data/paths.js` como origen de verdad; fail-closed en scoring.

---

## Resumen ejecutivo

```
Salud general:     █████████░  8.6/10  (↑ R6 implementada 2026-07-20)
Single-tenant:     ✅ Correcto
Over-engineering:  ⚠️  18/100 leve
Tests:             ✅ 114/114 pass
Runtime audit CI:  ✅ 0 failures
Riesgo #1:         ✅ CERRADO — job_loop / apply SEMI-AUTO por defecto
```

### Implementado en Ronda 6 (código)

| Fix | Estado | Evidencia |
|-----|:------:|-----------|
| job_loop default SEMI-AUTO + `--auto` LIVE | ✅ | `resolveApplyPolicy`, PM2 `args: --dry-run` |
| computrabajo_apply main + misma política | ✅ | CLI dry-run reporta cola, no postula |
| email always `sensitive=true` | ✅ | `email_processor.js` |
| PII credenciales en ESTADO_VIVO | ✅ | solo puntero a `.env` |
| valibot removido | ✅ | package.json |
| tests de política | ✅ | 7 tests en `job_apply_policy.test.js` |

### Ready checklist (personal, no SaaS)

| Categoría | Estado | Nota |
|-----------|:------:|------|
| 🔬 Testing | ⚠️ | Suite existe (~117 tests). **Este worktree no tiene `node_modules`** → `npm test` no corre sin `npm ci`. |
| 🚀 CI/CD | ❌ | `.github/workflows/` vacío. GHA se eliminó a propósito; falta un gate local documentado (`npm test` + `runtime:ci`). |
| 🐳 Docker | ✅ | `docker-compose.yml`: dashboard + ntfy + uptime-kuma (opcional, OK para personal). |
| 📝 README | ✅ | README real de LifeOS (ya no template Litestream). |
| 🔐 Secrets | ⚠️ | `.env` pattern OK. **PII residual en `ESTADO_VIVO.md`** (CC/usuario SENA, email Computrabajo). |
| 📋 .gitignore | ✅ | Actualizado en rondas previas. |
| 🔧 Git | ⚠️ | Worktree con basura untracked (dumps Sofia, repomix, zip) y `scripts/data/` legacy aún presente. |

---

## Hallazgos por prioridad

### 🔴 P0 — `job_loop` aplica en LIVE por defecto (contradice política semi-auto)

**Evidencia:**
- `ecosystem.config.js` lanza `job-loop` lun–vie **sin** `--dry-run`.
- `job_loop.js`: `DRY_RUN = process.argv.includes('--dry-run')` → default **LIVE**.
- Si score ≥ 40 y `recomendar`, llama `aplicar()` y postula en Computrabajo.
- `computrabajo_apply.js` **no tiene `main`**: solo exporta `applyToOfferSafe`. El proceso PM2 `computrabajo-apply` es **no-op** (carga módulo y sale).
- `AGENTS.md` promete semi-auto y flag `--auto`. **Ese contrato no existe en el código actual.**

**Impacto real (personal):** postulaciones no supervisadas a nombre de Jeiser, riesgo reputacional y de spam a reclutadores.

**Fix mínimo:**
```js
// job_loop.js — default dry-run; solo LIVE con --auto explícito
const AUTO = process.argv.includes('--auto');
const DRY_RUN = !AUTO || process.argv.includes('--dry-run');
```
```js
// ecosystem.config.js
{ name: "job-loop", script: "...", args: "--dry-run", ... }
// o quitar job-loop del ecosystem hasta supervisión
```

**Criterio de cierre:** PM2 nunca postula sin flag explícito; `AGENTS.md` coincide con el código.

---

### 🔴 P0 — Worktree incompleto para operar (deps + diagnósticos)

**Evidencia en esta sesión:**
- `node_modules` ausente → vitest no arranca.
- `scripts/diagnostics/*` apareció como **deleted** en el working tree (archivos tracked en git; se restauraron con checkout). Sin ellos fallan healthcheck, pm2-health, `runtime:audit`.
- Sin DB local `data/memoria_hipocampo.db` en este worktree.

**Impacto:** no se puede validar salud del sistema desde este checkout sin `npm ci` + restore + migrate.

**Fix:** `npm ci` en máquina de runtime; no borrar `scripts/diagnostics`; documentar que el worktree de agentes no es el host de producción.

---

### 🟡 P1 — Email → LLM: sensibilidad parcial

**Estado:** Mejor que FIX-009 original. `summarizeEmails` usa heurística (`dian|simit|multa|banco|...`) y pasa `isSensitive`.

**Hueco:** correos con cédula, dirección, nómina, CESDE, o PII genérica **sin** esas keywords salen con `sensitive=false` → pueden ir a proveedores cloud.

**Fix personal (simple):**  
`const isSensitive = true` siempre en email (single-tenant: el costo de proxy local es irrelevante frente a filtrar PII). O ampliar heurística + `sensitive=true` por defecto.

---

### 🟡 P1 — `scripts/data/` zombie

**Estado:** Runtime usa `PATHS.PROCESSED_EMAILS` → `data/processed_emails.json`.  
La carpeta `scripts/data/` **sigue existiendo** (SENA PDFs, simit, processed_emails legacy) y se modifica en el working tree.

**Impacto:** dos mundos de datos; confusión en backups y audits; contradice F08 / principio “un origen de verdad”.

**Fix:** archivar a `etc/archived/scripts_data/` o borrar tras confirmar que nada lee esas rutas; añadir assert en `runtime-audit` que falle si reaparece I/O a `scripts/data`.

---

### 🟡 P1 — PII en estado maestro versionado

`ESTADO_VIVO.md` aún contiene referencias a CC/usuario `1019156838` y email Computrabajo. Para un repo personal (aunque private) es superficie de leak en copias, repomix y worktrees.

**Fix:** dejar solo punteros a `.env` / gestor de contraseñas (el archivo ya tiene `[REDACTED]` en varios campos; completar el resto).

---

### 🟡 P1 — CI declarado pero vacío

Ronda 3 marcó CI ✅. Hoy `.github/workflows/` no tiene workflows. Correcto si la política es 100% local, pero entonces el checklist “CI” es mentira.

**Fix personal:** no reintroducir GHA pesado. Añadir un script único:
```bash
npm test && npm run runtime:ci
```
y documentarlo como gate pre-push local (opcional: un workflow mínimo solo `npm test` sin secrets).

---

### 🟢 P2 — `valibot` sin uso

En `package.json` pero **0 imports** en runtime.  
`npm uninstall valibot` o usarlo en límites reales (parse de JSON de LLM / rules).

---

### 🟢 P2 — Basura en raíz y dumps

Untracked / ruido: `%TEMP%age-windows.zip`, dumps Sofia HTML/PNG, `repomix_parts/`, `GENERARREPOMIX.BAT`, `zajuna_html.txt`, etc.

**Fix:** `.gitignore` + limpieza; no versionar HTML de scrapers.

---

### 🟢 P2 — Cobertura de tests sesgada

Bien cubierto: event bus, outbox, rule engine, scorer, stores, think, frontal FIX-101.  
Casi sin tests: scrapers, `email_processor`, `job_loop`, `daily_routine`, notificaciones, PM2 health.

Para personal: no hace falta 80% coverage. Sí hacen falta **tests de política** (dry-run default, sensitive default, fail-closed).

---

## Over-engineering (matriz single-tenant)

| Dimensión | Pts | Evaluación |
|-----------|----:|------------|
| Arquitectura | 8 | Lóbulos + event bus + outbox + stores. Justificado para agente multi-dominio; no microservicios. |
| Dependencias | 4 | 13 deps core razonables; `valibot` muerto; WheelSaver como subproyecto Python es peso opcional. |
| Patrones | 3 | Outbox/DLQ útil con procesos Run & Die. Ledger + outbox puede solaparse. |
| Single-tenant | 3 | Dashboard con token fail-closed: bien. No hay multi-tenant. Lóbulos son metáfora, no auth roles. |
| **Total** | **18** | ⚠️ Leve — no re-arquitecturar |

**No tocar:** SQLite, PM2 local, rule engine, fail-closed scorer, event bus, single-tenant.

**No adoptar (sobre-ingeniería para 1 usuario):** Kafka, multi-tenant auth, Postgres, Kubernetes, mem0 cloud, LangChain, microservicios por scraper.

---

## Recomendaciones WheelSaver (filtradas para personal)

BD local con 3,382 repos. Solo lo que **añade valor real** a un LifeOS de un usuario:

### 1. gitleaks — 28,155⭐
**URL:** https://github.com/gitleaks/gitleaks  
**Categoría:** seguridad  
**Por qué:** barrer PII/secrets en `ESTADO_VIVO`, dumps y repomix antes de copiar/compartir.  
**Cómo:**
```bash
gitleaks detect --source . --no-git
```

### 2. uptime-kuma — 89,168⭐ (ya en docker-compose)
**URL:** https://github.com/louislam/uptime-kuma  
**Categoría:** monitoreo  
**Por qué:** ya está declarado; falta usarlo de verdad (apuntar a `pm2-health:9090`).  
**Cómo:** `docker compose up -d uptime-kuma` + monitor HTTP al health endpoint.

### 3. trivy — 36,935⭐
**URL:** https://github.com/aquasecurity/trivy  
**Categoría:** seguridad supply-chain  
**Por qué:** escanear deps Node del root y dashboard sin montar un SOC.  
```bash
trivy fs .
```

### 4. mem0 — 60,934⭐ — **NO integrar ahora**
Sigue siendo tentador vs `memory_engine` casero. Para single-tenant con SQLite + hechos, el ROI es bajo frente al costo de otro runtime/servicio. Revisitar solo si la búsqueda semántica se vuelve dolor diario.

### 5. Scrapling / Scrapy — **NO reemplazar Playwright**
Los scrapers colombianos (SIMIT/SENA/DIAN/CT) son sitios con login y anti-bot; Playwright ya está peinado. Cambiar framework = reescribir sin ganancia clara.

---

## Quick wins (alto impacto, bajo esfuerzo)

1. **Default dry-run en `job_loop` + args en PM2** — 15 min  
2. **`isSensitive = true` fijo en `summarizeEmails`** — 5 min  
3. **`npm uninstall valibot`** (o un uso real) — 5 min  
4. **Redactar CC/email restantes en `ESTADO_VIVO.md`** — 10 min  
5. **Borrar/archivar `scripts/data/` y dumps de raíz** — 20 min  
6. **`npm ci` + `npm test` en el host real** — 10 min  
7. **Un monitor uptime-kuma → pm2-health** — 15 min  

## Arquitectura (solo si duele)

1. Unificar apply: un solo entrypoint (`job_loop` **o** `computrabajo_apply` con main), no dos procesos PM2 inconsistentes.  
2. Tests de política: “sin `--auto` no aplica”, “email siempre sensitive”, “LLM caído → score 0”.  
3. Decidir: WheelSaver como **herramienta de dev** (fuera del runtime PM2) vs feature soportada.

## Deuda que ya se cerró (no reabrir)

| Item | Estado |
|------|:------:|
| Migrador unificado `runtime/migrations/runner.js` | ✅ |
| `PATHS.PROCESSED_EMAILS` canónico | ✅ (runtime) |
| `daily_routine --dry-run --no-shutdown` | ✅ |
| README real LifeOS | ✅ |
| Fail-closed scorer | ✅ |
| SSRF crawl4ai | ✅ |
| Dashboard auth fail-closed + timingSafeEqual | ✅ |
| GHA → PM2 | ✅ |
| Event bus + outbox + tests | ✅ |

---

## Scorecard vs rondas previas

| Área | R3 (18/07) | R6 (20/07) | Delta |
|------|:----------:|:----------:|:-----:|
| Seguridad base | 9 | 8 | PII residual + email no-always-sensitive |
| Auto-apply policy | ⚠️ doc | 🔴 código | job_loop LIVE; apply script no-op |
| Paths canónicos | 8 | 8 | zombie `scripts/data` |
| Tests | 8 | 7 | suite ok; worktree sin deps |
| Docs honestas | 7 | 8 | README arreglado; AGENTS desalineado en jobs |
| Over-eng | 21 | 18 | estable |
| Operabilidad PM2 | 8 | 6 | diagnostics frágiles en worktree; apply process dead |

---

## Orden de acción recomendado (esta semana)

1. Cortar riesgo: `job-loop` → `--dry-run` o sacarlo de PM2.  
2. Email siempre `sensitive=true`.  
3. Limpiar PII de `ESTADO_VIVO` + gitleaks one-shot.  
4. `npm ci && npm test` en el host de producción.  
5. Archivar `scripts/data` y basura de raíz.  
6. Alinear `AGENTS.md` con el comportamiento real de jobs.

---

## Veredicto

LifeOS **no es un SaaS a medias**: la arquitectura single-tenant es correcta y las rondas 1–5 arreglaron lo crítico de seguridad y paths. El problema actual no es “falta de frameworks”; es **disciplina operativa**:

1. Un proceso de empleo que postula solo si no le pones freno.  
2. Documentación que promete semi-auto y un script PM2 que no hace nada.  
3. Estado/PII y carpetas legacy que ensucian el origen de verdad.

**No re-arquitectures.** Cierra P0 de jobs, endurece PII al LLM, limpia zombies. Eso sube el score real más que cualquier librería de la BD.
