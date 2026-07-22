# 🗺️ RUTA DE ESTUDIO UNIFICADA: QA AUTOMATION JUNIOR & DEV JUNIOR (v3.0)
> **Estudiante:** Jeiser Gutiérrez · **Última actualización:** 22 de julio de 2026
> **Sincronización:** LifeOS + SENA (Bases de Datos, Scrum, MySQL, Python) + CESDE (Desarrollo de Software)

---

## 🎯 Perfil Objetivo de Salida
**QA Automation Junior / Junior Software Engineer**
- **Core Dev:** Node.js, TypeScript, Express, REST APIs, JSON, Git/GitHub.
- **Bases de Datos (SENA Aligned):** SQL Raw (DDL, DML, JOINs, Group By, Indexes), Modelo Entidad-Relación (MER), Normalización (1FN, 2FN, 3FN), PostgreSQL, Drizzle ORM, SQLite.
- **QA Automation & Testing:** Playwright (UI + POM + Stealth), API Testing (Postman + Supertest/Playwright API), Vitest (Unit/Integration), Test Cases, Bug Reports.
- **Metodologías & DevOps (SENA Scrum Aligned):** Scrum Framework, User Stories, Docker Compose, CI/CD en GitHub Actions, variables de entorno.

---

## 🚀 HITOS DE LA RUTA DE APRENDIZAJE

### 📌 Hito 1: Bases de Datos Relacionales & SQL Raw → ORM (Semanas 1-2) — ⏳ ACTIVO (Alineado SENA BD & MySQL)
*   **Propósito:** Dominar los fundamentos de bases de datos relacionales desde la teoría SENA hasta la persistencia en código de producción.
*   **Contenidos SENA integrados:** MER, MR, Normalización (1FN, 2FN, 3FN), SQL DDL (`CREATE`, `ALTER`), SQL DML (`SELECT`, `WHERE`, `JOIN`, `GROUP BY`, `TRANSACTION`).
*   **Entregables Técnicos:**
    1. [ ] **Diseño BD (SENA):** Crear diagrama Entidad-Relación y script SQL DDL para la base de datos de LifeOS (`applications`, `jobs`, `events`, `users`).
    2. [ ] **Consultas SQL Complejas:** Escribir consultas SQL nativas con `INNER JOIN`, `LEFT JOIN`, `GROUP BY` y agregaciones para métricas de postulaciones y finanzas.
    3. [ ] **Infraestructura Docker:** Levantar contenedor de **PostgreSQL 16** en `docker-compose.yml` con volúmenes y credenciales en `.env`.
    4. [ ] **Integración ORM:** Configurar **Drizzle ORM** sobre PostgreSQL y migrar los datos de SQLite a Postgres de forma transparente.
    5. [ ] **API Endpoint:** Crear endpoint `GET /api/v1/status` y `GET /api/v1/metrics` usando Express/Node.js que consulte la DB Postgres.

---

### 📌 Hito 2: Pruebas de API REST & Backend Testing (Semanas 3-4) (Alineado Postman & HTTP Specs)
*   **Propósito:** Dominar la automatización de pruebas de API REST (la habilidad #1 más demandada en QA Junior en Colombia).
*   **Contenidos integrados:** Verbos HTTP (GET, POST, PUT, DELETE), Status Codes (2xx, 4xx, 5xx), Encabezados, JWT Authentication, JSON Schema Validation.
*   **Entregables Técnicos:**
    1. [ ] **Postman Collection:** Diseñar Colección de Postman completa con tests automáticos en JavaScript (`pm.test()`, `pm.expect()`) para los endpoints de LifeOS.
    2. [ ] **API Automation con Playwright API Request:** Automatizar pruebas de integración de API en código TypeScript usando `request` context de Playwright (sin navegador GUI).
    3. [ ] **Validación de Schemas con Zod:** Implementar contratos de entrada/salida validados dinámicamente con Zod.
    4. [ ] **Unit & Integration Testing con Vitest:** Mantener 100% verde la suite de unit tests (`rule_engine`, `scorer`, `event_bus`).

---

### 📌 Hito 3: Automatización E2E Web Resiliente con Playwright (Semanas 5-6) (Alineado QA UI Automation)
*   **Propósito:** Crear suites de automatización de interfaz web robustas, mantenibles y profesionales con patrones de diseño de la industria.
*   **Contenidos integrados:** Page Object Model (POM), Locators avanzadas (role, label, testid), Emulación (stealth, user-agents), Manejo de Sesiones (Cookies/Storage State).
*   **Entregables Técnicos:**
    1. [ ] **Patrón POM (Page Object Model):** Refactorizar scrapers y bots de LifeOS aplicando la arquitectura POM limpia.
    2. [ ] **Manejo de Sesión (Storage State):** Reutilizar cookies de autenticación para evitar logins innecesarios en Computrabajo / Zajuna.
    3. [ ] **Playwright Stealth & Evasión:** Implementar rotación de user-agents y emulación de navegador real para evitar bloqueos por bot detection.
    4. [ ] **Reportes y Trazabilidad:** Configurar generación automática de reportes HTML de Playwright con capturas de pantalla y videos en fallos.

---

### 📌 Hito 4: Metodología QA, Scrum & Gestión de Defectos (Semanas 7-8) (Alineado SENA Scrum & CESDE)
*   **Propósito:** Dominar los procesos metodológicos y la cultura QA dentro de equipos ágiles de desarrollo.
*   **Contenidos SENA integrados:** Scrum Roles, Ceremonias (Planning, Daily, Review, Retro), Artefactos (Product/Sprint Backlog), Criterios de Aceptación, Test Plans.
*   **Entregables Técnicos:**
    1. [ ] **Documentación QA:** Redactar un Test Plan formal y 5 Casos de Prueba (Test Cases) bajo formato estándar para un módulo clave de LifeOS.
    2. [ ] **Gestión de Defectos:** Documentar Bug Reports profesionales con pasos de reproducción, severidad vs prioridad y logs esperados vs obtenidos.
    3. [ ] **Simulación Agile (Jira/GitHub Projects):** Configurar un tablero Kanban/Scrum en GitHub Projects etiquetando User Stories, Bugs y Tasks.

---

### 📌 Hito 5: CI/CD Pipeline, Docker & Deploy (Semanas 9-10) (Alineado SRE & DevOps Junior)
*   **Propósito:** Integrar la automatización de pruebas y la aplicación en tuberías de integración continua.
*   **Entregables Técnicos:**
    1. [ ] **GitHub Actions Workflow:** Configurar CI pipeline que ejecute `npm test` y `npx playwright test` automáticamente en cada Pull Request.
    2. [ ] **Dockerización Completa:** Crear `Dockerfile` multi-stage para Node.js y Playwright Headless.
    3. [ ] **Uptime & Health Monitoring:** Integrar Uptime Kuma + Prometheus metrics endpoint para alertas automáticas en Telegram/ntfy.

---

## 🎓 REGLAS DE LA SESIÓN DE ESTUDIO (Feynman & Sócrates)
Cuando Jeiser inicie sesión de estudio ("quiero estudiar", "estudiemos", "abramos sesión"):
1.  **Adoptar Rol:** Tech Lead / Mentor Socrático. No dar respuestas de código servidas. Explicar conceptos usando la **Técnica Feynman** (analogías simples y directas).
2.  **Verificar Hito Activo:** Consultar este archivo, ubicar la tarea pendiente del Hito y proponer el reto del día.
3.  **Code Review Estricto:** Buscar fugas de memoria, falta de tipos en TS, ausencia de `try/catch` o selectores frágiles.
4.  **Sincronización SENA/CESDE:** Si Jeiser tiene dudas sobre guías del SENA (BD/Scrum/MySQL/Python) o clases del CESDE, resolverlas aplicando Feynman antes de pasar a la práctica.
