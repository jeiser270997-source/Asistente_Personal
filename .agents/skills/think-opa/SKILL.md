---
name: think-opa
description: Motor de políticas de decisión inspirado en Open Policy Agent (11,951⭐). Mejora la lógica de think.js con reglas declarativas. Activa cuando Jeiser habla de decisiones, política de prioridad, reglas de negocio, o automatización de criterios.
---

# Think OPA — Motor de Políticas Declarativas

## Inspiración

Basado en **Open Policy Agent (OPA)** (11,951⭐ en GitHub) — estándar de la industria para políticas declarativas en cloud/DevOps. El principio fundamental: *"Separar la lógica de decisión del código de ejecución."*

## ¿Por qué reemplazar think.js?

`lib/think/think.js` (173 líneas) evalúa 6 políticas (sobrecarga, estancamiento laboral, casos urgentes, estudio vencido, errores del sistema, tiempo libre) en JavaScript imperativo. Con OPA:

| Aspecto | think.js (actual) | think-opa (propuesto) |
|---------|------------------|----------------------|
| Lógica | JavaScript en funciones | Reglas declarativas en Rego (formato JSON) |
| Cambiar reglas | Editar código JS | Editar un archivo JSON |
| Testing | Manual | Unitario con inputs de prueba |
| Escalabilidad | 6 políticas fijas | N políticas agregables |

## Políticas actuales de LifeOS (traducidas a reglas)

### 1. ⚠️ Sobrecarga
```
IF pendientes > 3 AND hay evento hoy AND horas_sueno < 6
THEN prioridad = "descanso" | acción = "recordar dormir"
```

### 2. 💼 Estancamiento laboral
```
IF sin_aplicaciones > 7 días AND aplicaciones_totales < 5
THEN prioridad = "empleo" | acción = "sugerir revisar ofertas"
```

### 3. ⚖️ Casos urgentes
```
IF hay_multa_vencida OR hay_caso_legal_con_vencimiento < 3 días
THEN prioridad = "legal" | acción = "alertar caso urgente"
```

### 4. 📚 Estudio vencido
```
IF deadline_SENA < 2 días AND avance_SENA < 80%
THEN prioridad = "estudio" | acción = "recordar entregar"
```

### 5. 🔧 Errores del sistema
```
IF workflows_fallando > 3
THEN prioridad = "sistema" | acción = "revisar GitHub Actions"
```

### 6. 🎯 Tiempo libre
```
IF sin_eventos_hoy AND trabajo_hoy < 4h AND sin_deadlines_cerca
THEN prioridad = "ocio" | acción = "sugerir descanso o softball"
```

## Reglas agregables (nuevas)

### 7. 🚗 Mantenimiento vehicular
```
IF km_desde_ultimo_cambio > 4000
THEN prioridad = "vehiculo" | acción = "recordar cambio de aceite"
```

### 8. 💸 Alerta financiera
```
IF gastos_hormiga_semana > $100,000 AND saldo_disponible < $500,000
THEN prioridad = "finanzas" | acción = "alerta de gastos excesivos"
```

## Formato de reglas (recomendado para LifeOS)

```json
{
  "politicas": [
    {
      "id": "sobrecarga",
      "condiciones": { "pendientes_gt": 3, "hay_evento_hoy": true, "horas_sueno_lt": 6 },
      "prioridad": "descanso",
      "accion": "recordar dormir",
      "mensaje": "Jeiser, has tenido poco sueño y tienes muchas tareas. Prioriza descansar."
    },
    {
      "id": "mantenimiento_vehiculo",
      "condiciones": { "km_desde_ultimo_cambio_gt": 4000 },
      "prioridad": "vehiculo",
      "accion": "recordar cambio de aceite",
      "mensaje": "El Vehículo Principal lleva más de 4,000 km sin cambio de aceite. Programa taller."
    }
  ]
}
```

## Instrucciones para el agente

1. **Si Jeiser menciona decisiones del asistente** (sobrecarga, qué hacer hoy, prioridades), aplicar las 6 políticas base.
2. **Las reglas se evalúan en orden de prioridad.** La de mayor prioridad gana.
3. **Si hay conflicto entre reglas** (ej: estudio vencido Y sobrecarga), priorizar la que tiene deadline más cercano.
4. **Las reglas están en data/config/politicas.json** (si existe) o en las defaults de esta skill.
5. **Sugerir nuevas políticas** cuando Jeiser mencione patrones recurrentes de decisión.

## Ventajas sobre think.js actual

- ✅ **Reglas configurables** sin tocar código — cambiar lógica editando JSON
- ✅ **Evaluación determinista** — siempre mismo resultado para mismos inputs
- ✅ **Extensible** — agregar nueva política = agregar entrada en el JSON
- ✅ **Testeable** — se puede probar cada regla independientemente
- ✅ **Transparente** — Jeiser puede leer y entender las reglas
