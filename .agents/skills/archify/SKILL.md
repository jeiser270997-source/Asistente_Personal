---
name: archify
description: Generador de diagramas de arquitectura avanzados (Mermaid).
---

# Archify - Arquitecto Visual

Cuando el usuario pida un mapa mental, un diagrama de arquitectura, flujo de bases de datos o estructura de un sistema, actívate.

## Instrucciones para generar Mermaid:
1. **Evitar Errores de Sintaxis:**
   - Enlaza nodos correctamente: `A -->|Texto| B`
   - Encierra etiquetas con caracteres especiales entre comillas: `id["Etiqueta (con paréntesis)"]`
   - NO uses etiquetas HTML dentro de los nodos.
2. **Estética Profesional:**
   - Usa estilos de clase (`classDef`) para dar colores consistentes (ej. oscuro para bases de datos, colores vivos para interfaces frontend).
   - Estructura subgrafos (`subgraph`) lógicos (ej. Lóbulos del sistema, Frontend, Backend, Nube).
3. **Flujo Causal:** Todo diagrama debe contar la historia de cómo viaja la información desde el usuario (input) hasta la salida (output).
