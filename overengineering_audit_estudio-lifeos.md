# Auditoría de deuda técnica y complejidad — LifeOS

> Auditada el 15 de julio de 2026 | Complejidad evitable: **25/100 (⚠️ warning)**
>
> Alcance: código fuente, configuración, documentación y verificaciones locales. No se ejecutaron scrapers ni la rutina diaria, ya que producen efectos externos.

## Resumen ejecutivo

LifeOS no necesita una re-arquitectura: su arquitectura local, single-tenant y *Run & Die* es adecuada. La deuda principal es de **consolidación incompleta**: quedan rutas legacy, documentación/configuración obsoleta, dos implementaciones del migrador y componentes operativos sin pruebas. Es riesgo de mantenimiento, no un problema de escalabilidad.

| Dimensión | Puntos | Evaluación |
|---|---:|---|
| Arquitectura | 5 | Aplicación local razonable; el subproyecto WheelSaver añade un runtime Python/API para una integración que hoy no funciona. |
| Dependencias | 10 | `valibot` no tiene importaciones en código de ejecución; hay tres proyectos Node/Python sin una frontera de mantenimiento explícita. |
| Patrones | 10 | Dos runners de migraciones divergen y el acceso al estado aún tiene una ruta legacy. |
| Single-tenant | 0 | Correcto: no hay multi-tenant, roles ni infraestructura SaaS injustificada. |
| **Total** | **25** | **⚠️ Revisar y simplificar selectivamente.** |

## Verificaciones realizadas

- `npm test`: **8 archivos, 56 pruebas, todas exitosas**.
- `npx tsc --noEmit`: exitoso.
- `npm run runtime:ci`: exitoso, 0 fallos y 0 advertencias.
- Se inspeccionaron 151 archivos JS/TS de `lib`, `scripts`, `runtime` y `tests`; solo 8 son pruebas.
- WheelSaver local: `wheel-saver/data/top_repos.db` existe pero `repos` contiene **0** filas. `python cli.py stats` falla al formatear `stars_min = None`.

---

## Hallazgos por prioridad

### 🔴 P0 — La migración de `scripts/data` no está terminada

**Evidencia:** `scripts/integrations/email_processor.js` e `inbox_sensor.js` usan `scripts/data/processed_emails.json`; `mcp/lifeos_server.js` también lo lee. La carpeta reapareció como no rastreada. Esto contradice `AGENTS.md` y `docs/DEEP_AUDIT_FIXES_PLAN.md`, que declaran `scripts/data/` archivado y fuera del runtime.

- **Costo actual:** existen dos fuentes potenciales de estado y el proceso depende del directorio de ejecución; la auditoría de rutas no lo detecta porque su guardrail no cubre esta ruta.
- **Solución:** migrar ese checkpoint a `CheckpointStore` (preferible) o añadir un `PATHS.EMAIL_PROCESSED`; retirar los tres accesos legacy y agregar una prueba de migración/lectura.
- **Criterio de cierre:** `rg -n -F 'scripts/data' lib scripts runtime mcp` no devuelve código de runtime y la carpeta no se recrea tras procesar correos.

### 🔴 P0 — Dos migradores para la misma base de datos pueden divergir

**Evidencia:** `runtime/migrate.js` y `runtime/stores/Database.js` repiten creación de `schema_migrations`, escaneo, checksum y aplicación de `runtime/migrations/*.sql`. Ya difieren: el CLI exige que la DB exista, guarda checksum y tiene `--dry-run`; el store crea la DB implícitamente, ignora checksums existentes y gestiona backup de otra manera.

- **Costo actual:** una migración puede comportarse distinto desde `npm run migrate` que al arrancar la aplicación. El checksum guardado no se usa para detectar una migración modificada.
- **Solución:** extraer un único `runtime/migrations/runner.js`, usado tanto por el CLI como por `Database.getDb()`. Elegir una sola política de creación, backup, checksum y transacción; fallar si un checksum aplicado cambia.
- **Pruebas mínimas:** DB nueva, DB ya migrada, checksum alterado, rollback ante SQL inválido y ejecución simultánea.

### 🟡 P1 — La automatización crítica no es testeable de forma segura

**Evidencia:** `AGENTS.md` documenta `npm run daily:test`, pero no existe en `package.json`. `daily_routine.js` tiene `SHUTDOWN_AFTER_RUN = true` fijo, por lo que `npm run daily` puede apagar el equipo. No hay pruebas para `daily_routine.js`, `event_worker.js` ni los adaptadores de scrapers.

- **Costo actual:** no hay ensayo de la orquestación sin red, Telegram, navegador ni apagado. La cobertura actual se concentra en reglas y stores.
- **Solución:** introducir flags explícitos y seguros: `--dry-run`, `--no-shutdown` y `--only <fase>`, con `daily:test` apuntando a `node scripts/daily_routine.js --dry-run --no-shutdown`. Inyectar el ejecutor de procesos y el apagado para probar el orden, los reintentos y los fallos parciales.
- **Criterio de cierre:** una prueba valida fases, skip de lunes/fin de semana, reintento y que ningún comando de apagado se invoca en modo test.

### 🟡 P1 — WheelSaver está integrado pero no es funcional ni verificable

**Evidencia:** el repositorio anidado aporta venv Python, FastAPI, CLI y frontend; su DB de 48 KB está vacía (0 repos). Las búsquedas no retornan resultados y `stats` lanza un `TypeError` por valores `None`. Aun así, LifeOS mantiene un cliente Node de ~9 KB, un CLI de ~10 KB, scripts npm y eventos para esa integración.

- **Costo actual:** un runtime extra, rutas Windows rígidas (`venv/Scripts/python.exe`) y superficie operativa sin valor hasta que se cargue la base.
- **Solución:** decidir una de dos rutas: (A) tratar WheelSaver como herramienta de desarrollo independiente, quitar cliente/eventos/scripts del runtime LifeOS; o (B) mantenerlo como feature, corregir stats vacío, añadir `install-check`/health a CI y un estado explícito `not_ready` si `repos = 0`.
- **Nota WheelSaver:** se hicieron búsquedas locales de alternativas; no pueden respaldar una recomendación porque la BD está vacía. Primero hay que poblarla o retirar la integración activa.

### 🟡 P1 — Documentación y configuración contradicen el runtime actual

**Evidencia:** el `README.md` de raíz es el README de Litestream, no el de LifeOS. El README del dashboard aún es el template de `create-next-app`. `deuda_tecnica_plan.md` habla de GitHub Actions y PM2, ya eliminados. Siguen presentes `litestream.yml`, `docker-compose.yml` y `ecosystem.config.archived.js`; su condición de soporte no está definida.

- **Costo actual:** cualquier sesión nueva parte de instrucciones falsas y puede reintroducir mecanismos retirados.
- **Solución:** reescribir ambos README con propósito, arranque, datos, límites y Run & Die. Mover planes históricos/configuración no operativa a `etc/archived/` con un `README` que indique si Litestream/Docker son soportados o experimentales.
- **Criterio de cierre:** todos los comandos documentados existen y una búsqueda de `PM2`, `GitHub Actions` y `daily:test` solo encuentra contexto histórico correcto.

### 🟢 P2 — Dependencia sin uso y fronteras de proyecto difusas

**Evidencia:** `valibot` aparece en manifiestos y documentación, pero no hay importaciones en `lib`, `scripts`, `runtime`, `tests` ni `mcp`. El árbol contiene tres unidades con lockfiles/manifiestos separados: LifeOS raíz, `dashboard/` y `wheel-saver/`.

- **Solución:** quitar `valibot` con `npm uninstall valibot` o incorporar validación en los límites reales de entrada. Declarar en el README raíz que dashboard y WheelSaver son subproyectos opcionales, con sus comandos y ciclo de release propios.

### 🟢 P2 — Rutas canónicas adoptadas a medias

Además de `scripts/data`, hay accesos directos a `data/` en scripts de desarrollo, diagnósticos y jobs. Algunos son solo mensajes/comentarios y otros son I/O real (`check_schema.js`, constructores de CV, `ct_update_profile.js`, backups). Esto no rompe hoy, pero debilita el principio de `lib/data/paths.js` como fuente única.

- **Solución:** priorizar primero los procesos de producción; ampliar `PATHS` para artefactos de CV, logs de Computrabajo y backups. No convertir comentarios ni scripts puramente desechables por deporte.

---

## Recomendaciones de WheelSaver

No se recomienda añadir otra librería para los hallazgos P0/P1: son problemas de consolidación, pruebas y documentación, no de falta de framework. La búsqueda local de WheelSaver no produjo candidatos porque su índice contiene 0 repositorios; además su comando de estadísticas falla en ese estado. Corregir o desacoplar WheelSaver precede cualquier recomendación basada en él.

## Orden de ejecución propuesto

1. Corregir el checkpoint `scripts/data` y añadir su prueba de regresión.
2. Unificar el runner de migraciones y probar checksums/rollback.
3. Hacer `daily` ensayable sin apagado; restaurar el contrato `daily:test` o eliminarlo de la documentación.
4. Decidir si WheelSaver es herramienta externa o feature soportada; eliminar el camino que no se elija.
5. Sanear README, dashboard README y artefactos históricos.

## Lo que no cambiaría

- SQLite y `better-sqlite3`: adecuados para un sistema personal local.
- Event bus + transactional outbox: el patrón está justificado por procesos Run & Die; falta prueba e integración completa, no reemplazo.
- Playwright, Google APIs y Telegraf: responden a integraciones reales, no son sobre-ingeniería.
- La política single-tenant y el esquema Run & Die: son una simplificación correcta frente al PM2/GitHub Actions anterior.
