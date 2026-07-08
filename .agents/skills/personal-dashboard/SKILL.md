---
name: personal-dashboard
description: Dashboard personal unificado. Activa cuando Jeiser pide /status, "cómo va todo", "resumen", "dashboard", o quiere ver el estado general de su vida en un glance.
---

# Personal Dashboard — Vista Unificada Jeiser

## Comando principal: `/status`

Cuando Jeiser diga `/status`, "cómo voy", "resumen", o "dashboard", responde con este formato EXACTO:

```
📊 STATUS — Vie 08 Jul 2026
━━━━━━━━━━━━━━━━━━━━━━━━━

🚗 DIDI
   • Horas hoy: [preguntar si no se sabe]
   • Meta semanal: 40h
   • KEW496: SOAT 31-Dic ✅ | RTM 26-Dic ✅
   • Fondo emergencia vehículos: $1,500,000

📚 ESTUDIO
   • CESDE: Clase 3 ✅ | Próx: Clase 4 (Lun)
   • SENA: Bases de Datos (ficha 3549155) ✅
   • Bootcamp QA: Semana 2/28
   • Próximo deadline: [consultar ALERTAS_SENA.md]

⚖️ LEGAL
   • SIMIT: 0000838097 (C29 Itagüí — impugnado 05/07)
   • DIAN AG2023: prescripción ~09/2029
   • DIAN AG2024: petición 2026DP000161298 en espera
   • Denuncia Moto: NUNC 110016102535202609577
   • UGPP 2023: cerrado favorable ✅

💼 EMPLEO
   • Aplicaciones enviadas: 2 (Comfenalco, ESLOP)
   • Postulaciones pendientes: Computrabajo
   • Entrevistas: 0

🥎 SOFTBALL
   • Próx partido: Jue 09 Jul — Diamante Oswaldo Osorio 8:45pm
   • Vie 10 Jul: vs Búfalos (Envigado) 7:30pm
   • Dom 12 Jul: La Ceja vs Envigado B 4:00pm

💰 FINANZAS
   • Deuda DIAN activa: ~$9.8M
   • SIMIT pendiente real: $1,291,904
   • Ingreso: Didi (variable)
   • Regla #1: NO firmar 814
```

## Fuentes de datos

El agente debe leer estos archivos cuando genera el dashboard:
1. `data/state/contexto_maestro/ESTADO_VIVO.md` — datos maestros
2. `data/state/contexto_maestro/ALERTAS_SENA.md` — deadlines académicos
3. `data/state/masterledger.json` — casos legales activos
4. `data/state/jobs/scores/` — puntajes de aplicaciones
5. Skills relevantes: `finanzas_didi`, `job_hunter`, `transito`, `tributaria`, `softball`

## Instrucciones

1. **Sé conciso.** El dashboard es un glance, no una enciclopedia.
2. **Prioriza lo urgente.** Si hay deadlines hoy o mañana, destácalos con ⚠️.
3. **Actualiza automáticamente.** Si notas cambios durante la conversación, sugiere actualizar ESTADO_VIVO.md.
4. **No inventes datos.** Si no tienes la información, di "[preguntar]" o consulta los archivos fuente.
5. **Personaliza.** Este dashboard es de Jeiser, no genérico. Usa nombres reales de sus casos, vehículos, y cursos.

## Secciones dinámicas

Si Jeiser pregunta por una sección específica, expandir solo esa:
- `/status didi` → detalle financiero del día + horarios pico
- `/status estudio` → deadlines SENA + progreso bootcamp
- `/status legal` → todos los casos con radicados y estados
- `/status dinero` → balance financiero completo (usa skill finanzas_didi)
- `/status softball` → próximos 3 partidos + locaciones
