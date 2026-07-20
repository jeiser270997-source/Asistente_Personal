# Proximo paso

> **Filtro (2026-07-20):** Ronda 6 cerrada (semi-auto jobs, email sensitive, tests).  
> No abrir otra auditoría general sin síntoma. Esta lista es backlog, no obligación.

## 0. En uso diario (no es deuda bloqueante)

- PM2 con job-loop / computrabajo-apply en `--dry-run`
- LIVE solo: `node scripts/jobs/job_loop.js --auto` con supervisión
- Gate: `npm test` + `npm run runtime:ci`
- Agentes: ver `docs/AGENT_OPS.md`

## 1. Feedback loop para aplicaciones

Cuando llegue respuesta (email de rechazo/entrevista), actualizar el scoring para aprender.

```js
bus.on('job.feedback', (ev) => {
  // ajustar peso de skills segun resultado
})
```

## 2. CV adaptativo por oferta

El `cv_generate` actual usa keywords fijas. Mejorar con:

- Resumen profesional adaptado al titulo del cargo
- Reordenar skills segun la oferta
- Inyectar keywords ATS

## 3. Anti-deteccion para Playwright

- Delays aleatorios entre acciones (1000-4000ms)
- Rotacion de user-agent
- Rate limiting entre aplicaciones

## 4. Thresholds formalizados

```js
AUTO_APPLY: 85   // aplicar sin confirmacion
APPLY: 60        // aplicar con confirmacion
REVIEW: 40       // revisar manualmente
SKIP: < 40       // descartar
```

## 5. Duplicados

Antes de aplicar, verificar:

```js
AppStore.findByUrl(url)  // si existe → skip
```
