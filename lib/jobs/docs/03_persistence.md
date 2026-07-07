# Estrategia de Persistencia

## Dónde se guarda cada cosa

| Dato | Ubicación | Formato | Notas |
|------|-----------|---------|-------|
| Ofertas normalizadas | `data/cache/jobs/` | JSON | Regenerable |
| Scores y desgloses | `data/state/jobs/scores/` | JSON | Versionado |
| Decisiones de aplicación | `data/state/jobs/decisions/` | JSON | Versionado |
| Eventos del feedback | `data/state/jobs/events/` | JSON | Versionado |
| Pesos del scorer | `data/config/jobs/scoring_weights.json` | JSON | Versionado |
| CVs generados | `data/artifacts/jobs/cv_tailored/` | PDF/MD | No versionado |
| Historial aplicaciones | `data/state/masterledger.json` | JSON | Versionado (existente) |

## Integración con masterledger

El `masterledger` existente se conserva como ledger central.
Cada aplicación registra un evento en masterledger con:

```json
{
  "fecha": "2026-07-07",
  "tipo": "job_application",
  "empresa": "Empresa SAS",
  "cargo": "QA Engineer",
  "score": 84,
  "estado": "applied",
  "detalle": "Aplicación automática vía pipeline"
}
```

## Lectura vía lib/data/paths.js

Todas las rutas se resuelven mediante `lib/data/paths.js`.
Ningún módulo de `lib/jobs/` debe contener rutas hardcodeadas.

```js
const { PATHS } = require('../../data/paths');
// ✅ Correcto
const weights = readJSON(PATHS.SCORING_WEIGHTS);
```
