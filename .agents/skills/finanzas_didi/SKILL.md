---
name: finanzas_didi
description: Control financiero personalizado para Jeiser como conductor Didi + estudiante. Activa cuando habla de gastos, ingresos Didi, deuda DIAN, ahorro, o presupuesto mensual.
---

# Finanzas Didi — Control Financiero Personalizado

## Perfil financiero de Jeiser

- **Ingreso principal:** Didi (variable, depende de horas trabajadas)
- **Gastos fijos conocidos:**
  - SOAT Vehículo Principal (ver placa en ESTADO_VIVO.md): vence 31 Dic 2026 ✅
  - API DeepSeek: ~$4 USD/mes (usar horario valle)
  - Internet/Telefonía (estimar)
- **Deudas activas:**
  - DIAN AG2023: ~0.8M COP — prescripción ~09/2029
  - DIAN AG2024: en mora, recibo 91900450122623
  - Comparendo C29 Itagüí: impugnación enviada 05/07/2026
- **Vehículo:** Vehículo Principal Toyota Corolla 2010 (ver placa en ESTADO_VIVO.md)

## Reglas de hierro (NO negociables)

1. **DIAN:** Nunca firmar formulario 814 voluntariamente — acelera cobro coactivo
2. **Gastos hormiga:** Identificar y eliminar los de <$5K COP/semana que se acumulan
3. **Didi:** No trabajar más horas para ganar más — optimizar horarios pico
4. **Emergency fund:** Meta: 1 mes de gastos en efectivo antes de cualquier inversión
5. **Educación como inversión:** CESDE (beca 70%) y SENA son inversiones con ROI directo. Priorizar estudio sobre horas extra de Didi cuando hay deadlines.
6. **Anti-pánico:** Si Jeiser está preocupado por dinero, desglosar el problema en pasos accionables. Nada de alarmismo.

## Horarios pico Didi Medellín (referencia)

```
Lunes-Viernes:  7-9am, 12-2pm, 6-9pm (mayor demanda)
Viernes-Sábado: 10pm-2am (tarifa dinámica alta)
Domingo:        11am-2pm (familia movilizándose)
EVITAR:         Lunes-Miércoles 3-5pm (baja demanda, alto tráfico)
```

**Optimización para Jeiser:** Con clases Lun/Mie/Vie 6-8pm, el horario ideal es:
- Mañanas: 7-11am (antes de cualquier clase)
- Tardes sin clase: 2-5pm (Martes/Jueves)
- Post-clase: evitar (cansancio = más accidentes)

## Calculadora de metas

### Meta de ahorro mínima mensual
```
Ingreso estimado Didi:     X COP/mes
- Gasolina (est.):         -150K
- Mantenimiento (mes):     -80K
- Vida personal:           -300K
- CESDE/educación:         -variable
= Disponible para ahorro
```

### Regla 50-30-20 adaptada
- **50%** necesidades (arriendo, comida, gasolina)
- **30%** educación + herramientas (CESDE, internet, DeepSeek)
- **20%** ahorro + emergencias

## Integración con actual Budget

Si tienes actual Budget corriendo (Docker):
```bash
# Endpoint para registrar pago Didi
POST http://localhost:5006/api/transactions
{
  "account": "didi-ingresos",
  "amount": 85000,
  "payee": "Didi",
  "category": "Ingreso"
}
```

## Comandos del agente en modo finanzas

- `/balance` → resumen de ingresos/gastos del mes
- `/didi-hoy` → estimado de ganancia de la jornada
- `/deuda` → estado de deudas DIAN + SIMIT
- `/ahorro` → progreso hacia la meta de emergency fund
- `/gastos-hormiga` → análisis de gastos pequeños frecuentes
