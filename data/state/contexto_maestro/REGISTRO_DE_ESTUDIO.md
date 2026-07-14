# REGISTRO DE ESTUDIO — RUTA AVANZADA QA ARCHITECT / SRE
> Plan de estudio unificado y personalizado para Jeiser Gutiérrez
> Última actualización: 14 de julio de 2026

## 🎯 Perfil Objetivo: QA Automation Engineer / Backend Platform Developer
Este plan de estudio ensancha la barra horizontal del perfil en T (React básico, Docker, PostgreSQL, System Design) mientras profundiza verticalmente en la especialidad (TypeScript avanzado, Playwright, Arquitecturas resilientes y CI/CD).

---

## 🗺️ HITOS DE LA RUTA PERSONALIZADA

### 🚀 Hito 1: Datos e Infraestructura de Producción (Semanas 1-2) — ⏳ ACTIVO
*   **Propósito:** Dominar la persistencia de datos empresarial y el desacoplamiento limpio de arquitecturas.
*   **Tareas Técnicas:**
    1. [ ] Agregar un servicio de **PostgreSQL** al archivo `docker-compose.yml` con variables de entorno protegidas.
    2. [ ] Configurar **Drizzle-ORM** en el backend de Node.js de LifeOS.
    3. [ ] Escribir una migración segura para mover los registros de la tabla `applications` de SQLite a PostgreSQL.
    4. [ ] Crear un endpoint formal `GET /api/status` en la API de Node.js.
    5. [ ] Refactorizar el dashboard de Next.js para que consuma `/api/status` mediante `fetch()` asíncrono, eliminando completamente `better-sqlite3` del frontend.

### 🧪 Hito 2: Ingeniería de Pruebas de Integración con Vitest (Semanas 3-4)
*   **Propósito:** Escribir pruebas unitarias y de integración que validen lógica de negocio compleja, no solo clics en pantalla.
*   **Tareas Técnicas:**
    1. [ ] Escribir la suite de pruebas unitarias para `rule_engine.js` en Vitest, probando coincidencia de wildcards, prioridades y exclusiones.
    2. [ ] Escribir la suite de pruebas para `scorer.js` mockeando el cliente de LLM para simular comportamientos estables de la IA sin consumir tokens reales.
    3. [ ] Diseñar pruebas de integración para el Event Bus de LifeOS (`event_bus.js`) que validen el reintento de eventos, la deduplicación por hash y la Dead Letter Queue (DLQ).

### 🤖 Hito 3: Automatización E2E Resiliente con Playwright (Semanas 5-6)
*   **Propósito:** Llevar el scraping y la automatización web a nivel de producción, evadiendo bloqueos comunes y manejando estados dinámicos.
*   **Tareas Técnicas:**
    1. [ ] Implementar persistencia de sesión por cookies multiescena en `computrabajo_apply.js` para reducir la necesidad de logueos repetitivos.
    2. [ ] Agregar un módulo de *stealth* o emulación avanzada en Playwright para evadir captchas básicos y bloqueos por user-agent en el scraper de Computrabajo.
    3. [ ] Diseñar un mecanismo de autogestión de excepciones: si un selector CSS cambia, el scraper debe alertar con el selector roto de manera estructurada en lugar de fallar silenciosamente.

---

## 🎓 REGLAS DE LA SESIÓN DE ESTUDIO (Feynman & Sócrates)
Cuando el usuario indique "quiero estudiar", la IA debe:
1.  **Adoptar Rol:** Tech Lead / Mentor Socrático. No des respuestas de código directo. Explica el concepto de forma que lo entendería un niño de 12 años, pon un reto técnico y guía mediante preguntas.
2.  **Verificar Hito Activo:** Consultar este archivo para identificar cuál es el Hito actual y qué tareas técnicas están pendientes.
3.  **Hacer Code Review:** Si el usuario presenta código, evalúalo bajo estándares de clean code, manejo de excepciones y optimización de recursos.
4.  **Cero Adulación:** Mantener una comunicación directa y objetiva (Anti-Sycophancy).
