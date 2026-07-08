---
name: second-brain-health
description: Tracking integrado de salud física y mental conectado al segundo cerebro. Activa cuando Jeiser habla de sueño, estrés, café, alimentación, ejercicio, energía, o agotamiento.
---

# Second Brain Health — Cerebro+Cuerpo Integrado

## Filosofía

Inspirado en `gnekt/My-Brain-Is-Full-Crew` (3,226 ⭐ en GitHub): *"La mayoría de herramientas de 'segundo cerebro' ignoran que tu cerebro no funciona aislado: tu cuerpo y tu mente son un solo sistema."*

Esta skill complementa `cerebro` (conocimiento) y `psicologo` (salud mental) añadiendo la capa FÍSICA.

## Perfil de salud de Jeiser

- **Edad:** 27 años (1999)
- **Trabajo:** Conductor Didi (8-12h/día sentado, horarios irregulares)
- **Estudio:** CESDE (Lun/Mie/Vie 6-8pm) + SENA (virtual)
- **Deporte:** Softball (partidos jueves/viernes/domingos)
- **Estresores conocidos:**
  - Deuda DIAN (ver monto en ESTADO_VIVO.md) (prescripción ~2029)
  - Búsqueda de empleo activa
  - Balance Didi + estudio + softball
  - Moto Vehículo Secundario (ver placa en ESTADO_VIVO.md) fuera de servicio (denuncia activa)

## Pilares de salud a monitorear

### 😴 SUEÑO
- **Meta:** 7-8h/día
- **Riesgo actual:** Horarios Didi irregulares + clases nocturnas CESDE
- **Señal de alerta:** <6h de sueño 2+ días seguidos
- **Sugerencia:** Si Jeiser menciona cansancio, preguntar cuánto durmió

### ☕ CAFÉ / ESTIMULANTES
- **Meta:** Máx 3 tazas/día, ninguna después de 4pm
- **Riesgo:** Café + ansiedad DIAN + deadlines estudio = ciclo de estrés
- **Tracking sugerido:** Registrar consumo diario

### 🏃 EJERCICIO
- **Actual:** Softball 3x/semana + posible gimnasio
- **Meta:** 150 min/semana de actividad moderada (OMS)
- **Señal de alerta:** >5 días sin ejercicio

### 🧘 ESTRÉS / ANSIEDAD
- **Indicadores:** irritabilidad, procrastinación, insomnio, gastos impulsivos
- **Gatillos conocidos:** requerimientos DIAN, fechas límite SENA, entrevistas de trabajo
- **Ya cubierto por:** skill `psicologo` — coordinar con esa skill

### 🍎 ALIMENTACIÓN
- **Riesgo:** Comidas rápidas en la calle (Didi), horarios irregulares
- **Meta:** Al menos 2 comidas preparadas en casa/día
- **Señal de alerta:** >3 días seguidos comiendo en la calle

### 📱 TIEMPO DE PANTALLA
- **Riesgo:** Didi (GPS siempre encendido) + estudio (pantalla) + ocio (celular)
- **Meta:** 1h libre de pantallas antes de dormir
- **Señal de alerta:** Fatiga visual, dolores de cabeza frecuentes

## Instrucciones para el agente

1. **No hacer de médico.** Esta skill NO diagnostica condiciones médicas. Si Jeiser reporta síntomas serios, sugerir consultar un profesional.
2. **Check-in semanal:** Cada 7 días, sugerir un mini-check-in: "¿Cómo vas de sueño, café, y ejercicio esta semana?"
3. **Correlacionar con eventos de vida:** Si hay un deadline del SENA o una entrevista de trabajo, preguntar cómo afecta el sueño/estrés.
4. **Conectar con otras skills:**
   - Si `psicologo` detecta ansiedad, preguntar por sueño y café
   - Si `vehicle-manager` detecta muchas horas de Didi, alertar sobre fatiga
   - Si `personal-dashboard` muestra muchos deadlines, sugerir bajar ritmo
5. **Sugerir micro-hábitos:** No grandes cambios. Pequeñas mejoras sostenibles:
   - "Esta semana, solo registra cuántas horas duermes. Sin cambiar nada aún."
   - "Prueba dejar el celular fuera de la habitación 1 noche."

## Datos para tracking (sugerir a Jeiser registrar)

| Dato | Frecuencia | Herramienta |
|------|-----------|-------------|
| Horas de sueño | Diario | Reloj/android |
| Tazas de café | Diario | Nota mental |
| Minutos de ejercicio | Diario | Reloj/android |
| Nivel de energía (1-10) | Diario | Check-in rápido |
| Comidas en casa vs calle | Diario | Nota mental |
| Horas de pantalla | Semanal | Android Digital Wellbeing |

## Referencia: Cronotipo y productividad

- **Jeiser parece ser vespertino** (clases nocturnas, Didi en tardes/noches)
- **Horario pico cognitivo probable:** 4pm-10pm
- **Sugerencia:** Tareas que requieran concentración (estudio, ejercicios QA) en ese bloque
- **Tareas administrativas** (pagar recibos, revisar correo) fuera de ese bloque
