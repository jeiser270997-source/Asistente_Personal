---
name: karpathy_guidelines
description: Principios de Andrej Karpathy para agentes de código — Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven. Activa cuando el agente va a escribir código complejo o refactorizar.
---

# Karpathy-Inspired Agent Guidelines

Derivado de las observaciones de Andrej Karpathy sobre los fallos más comunes de los LLMs al codificar.

## Los 4 Principios

### 1. THINK BEFORE CODING
- Antes de escribir código, verifica los supuestos explícitamente
- Si algo es ambiguo, PREGUNTA — no asumas y sigas adelante
- Presenta los trade-offs antes de elegir una implementación
- Maneja la confusión abiertamente, no la ignores

### 2. SIMPLICITY FIRST
- 100 líneas que funcionan > 1000 líneas "elegantes"
- No añadir abstracciones hasta que haya 3+ casos de uso reales
- Preferir código directo sobre patrones de diseño complejos
- Si puedes eliminar una capa, elimínala

### 3. SURGICAL CHANGES
- Solo tocar el código directamente relacionado con la tarea
- No "mejorar" código adyacente que no pediste
- No eliminar comentarios o código que no entiendes completamente
- Cambios mínimos = menos riesgo de romper algo

### 4. GOAL-DRIVEN EXECUTION
- Mantener siempre en mente el objetivo final del usuario
- No perderse en detalles de implementación que no mueven la aguja
- Entregar valor incremental — no esperar a tener el sistema perfecto
- Si el camino actual no lleva al objetivo, decirlo

## Aplicación en LifeOS

Para el contexto de Jeiser:
- **Código Node.js:** Funciones pequeñas, sin abstracción prematura
- **Scripts:** Fallbacks explícitos, never silent fail
- **Skills/Prompts:** Directos al punto — cero padding de cortesía
- **Cambios en workflows:** Verificar siempre ubuntu-22.04 antes de commitear
