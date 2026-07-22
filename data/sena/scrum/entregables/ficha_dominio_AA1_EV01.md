# 🧠 FICHA DE DOMINIO Y DEFENSA RÁPIDA (AA1-EV01: Historias de Usuario en Scrum)
**Tiempo de Lectura:** 3 minutos  
**Objetivo:** Dominar los conceptos clave y decisiones tomadas en el entregable para responder ante la instructora Ayda Franco sin vacilación.

---

## 1. ¿De qué trata tu entregable?
Desarrollaste un **Informe de Requerimientos y Product Backlog** para una plataforma web de pruebas de software automatizadas (**QA-Hub**). Convertiste los requerimientos del cliente en **Historias de Usuario (User Stories)** estructuradas.

---

## 2. Conceptos Clave que Debes Dominar (Las 3 C y INVEST)

* **¿Qué es una Historia de Usuario?**
  Es una explicación breve y en lenguaje natural de una funcionalidad, escrita desde la perspectiva del usuario final.
* **Modelo de las 3 C (Jeffries):**
  1. **Card (Tarjeta):** La frase estándar: *"Como [Rol], quiero [Acción], para [Beneficio]"*.
  2. **Conversation (Conversación):** La discusión entre el Product Owner y el equipo para aclarar dudas.
  3. **Confirmation (Confirmación):** Los **Criterios de Aceptación** (Gherkin: *Given-When-Then* / *Dado-Cuando-Entonces*) que definen cuándo está lista.
* **Criterios INVEST (Bill Wake):**
  Las historias deben ser: **I**ndependientes, **N**egociables, **V**aliosas, **E**stimables, **S**mall (Pequeñas) y **T**estables (Probables).

---

## 3. Tus Decisiones Técnicas en la Entrega (Lo que vas a defender)

* **Formato BDD / Gherkin para Criterios de Aceptación:**
  Decidiste usar la sintaxis *Dado / Cuando / Entonces* porque conecta directamente el requerimiento del negocio con las pruebas automatizadas (Playwright), ahorrando tiempo entre desarrollo y QA.
* **Estimación en Story Points (Escala Fibonacci):**
  Usaste Puntos de Historia (`1, 2, 3, 5, 8, 13`) para medir la complejidad relativa en lugar de horas.
* **Priorización MoSCoW:**
  Clasificaste las funcionalidades en:
  - **Must Have (Obligatorias):** Login seguro OAuth2 (`US-01`), Configuración de Suites (`US-02`), Disparo de Tests (`US-03`).
  - **Should Have (Deseables):** Dashboard de métricas (`US-04`), Alertas en Telegram (`US-05`).
  - **Could Have (Opcionales):** Reportes en PDF (`US-06`).

---

## 4. Respuestas Rápidas para la Instructora

* **Instructora:** *"¿Por qué incluyó criterios en Gherkin?"*
  * **Tu respuesta:** *"Instructora, utilicé sintaxis Gherkin (Dado-Cuando-Entonces) porque facilita el Behavior-Driven Development (BDD), permitiendo que los criterios de aceptación sirvan como base directa para la automatización de pruebas."*
* **Instructora:** *"¿Quién redacta y aprueba estas historias en Scrum?"*
  * **Tu respuesta:** *"El Product Owner las lidera y prioriza en el Product Backlog, pero se refinan en conversación con los Developers durante el Sprint Planning y Refinement."*
