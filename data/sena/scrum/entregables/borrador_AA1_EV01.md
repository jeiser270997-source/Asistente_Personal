# INFORME DE HISTORIAS DE USUARIO Y REQUERIMIENTOS DEL CLIENTE
**Programa:** Aplicación del Marco de Trabajo Scrum para Proyectos de Desarrollo de Software  
**Ficha:** 3565476  
**Aprendiz:** Jeiser Abraham Gutiérrez Torres  
**Instructora:** Ayda Andrea Franco Villamil  
**Estándar de Formato:** Normas APA 7.ª Edición  
**Evidencia:** AA1-EV01  

---

## Resumen Ejecutivo

El presente informe consolida la especificación de requerimientos de software mediante la técnica de Historias de Usuario (*User Stories*) en el marco de trabajo ágil Scrum. El proyecto seleccionado corresponde al desarrollo de una plataforma web para la gestión y automatización de pruebas de calidad de software (*QA Automation System*). Se presentan cinco historias de usuario estructuradas con sus respectivos criterios de aceptación formalizados mediante el lenguaje Gherkin (*Given-When-Then*), priorización técnica y estimación de esfuerzo en puntos de historia (*Story Points*).

---

## 1. Introducción

En el desarrollo de software bajo enfoques tradicionales, la especificación de requerimientos se realizaba mediante extensos documentos estáticos. El marco de trabajo Scrum transforma este paradigma introduciendo el concepto de *Product Backlog*, alimentado principalmente por Historias de Usuario (Schwaber & Sutherland, 2020). Una historia de usuario es una representación concisa de una funcionalidad deseada desde la perspectiva del usuario final, centrada en el valor entregado y acompañada de criterios de aceptación verificables (Cohn, 2004).

---

## 2. Definición del Sistema y Dominio del Problema

El proyecto objeto de análisis es el módulo central de una plataforma de gestión de pruebas automatizadas denominada **QA-Hub**. El sistema permite a los ingenieros de calidad (QA Automation Engineers) y analistas de pruebas registrar casos de prueba, configurar ejecuciones automatizadas con herramientas como Playwright y consultar informes sintéticos de resultados de pruebas.

---

## 3. Matriz de Historias de Usuario (Product Backlog)

### Historia de Usuario 1 (`US-01`)
* **Título:** Registro e Inicio de Sesión Seguro de Usuarios QA.
* **Declaración de Valor:**
  > **Como** Analista de QA Automation,  
  > **quiero** autenticarme en la plataforma utilizando mis credenciales institucionales,  
  > **para** acceder al panel principal de gestión de ejecuciones de prueba con la seguridad adecuada.
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** Autenticación exitosa con credenciales válidas.
    * **Dado** que el usuario se encuentra en la página de inicio de sesión de QA-Hub,
    * **Cuando** ingresa un correo electrónico institucional válido y su contraseña correcta,
    * **Entonces** el sistema debe redirigir al Dashboard principal en menos de 2 segundos y generar un token JWT válido.
  * **Escenario 2:** Intento de acceso con contraseña incorrecta.
    * **Dado** que el usuario ingresa una contraseña errónea,
    * **Entonces** el sistema debe mostrar el mensaje de error: *"Credenciales no válidas"* y registrar el intento fallido en los logs de seguridad.
* **Prioridad MoSCoW:** *Must Have* (Imprescindible).
* **Estimación (Story Points):** 3 Puntos.

---

### Historia de Usuario 2 (`US-02`)
* **Título:** Creación y Configuración de Suites de Pruebas Automatizadas.
* **Declaración de Valor:**
  > **Como** QA Automation Engineer,  
  > **quiero** crear una nueva suite de pruebas especificando el repositorio de código y el navegador objetivo (Chromium, Firefox, WebKit),  
  > **para** organizar los scripts de Playwright según la funcionalidad a probar.
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** Creación exitosa de suite de pruebas.
    * **Dado** que el ingeniero QA completa los campos obligatorios (*Nombre*, *URL de Repositorio*, *Navegador Target*),
    * **Cuando** presiona el botón *"Guardar Suite"*,
    * **Entonces** la plataforma debe validar la sintaxis de la URL del repositorio y añadir la suite a la lista de pruebas activas.
* **Prioridad MoSCoW:** *Must Have* (Imprescindible).
* **Estimación (Story Points):** 5 Puntos.

---

### Historia de Usuario 3 (`US-03`)
* **Título:** Disparo Automatizado de Ejecución de Tests E2E.
* **Declaración de Valor:**
  > **Como** Desarrollador / Lider de QA,  
  > **quiero** ejecutar manualmente una suite de pruebas o programar su disparo mediante webhook,  
  > **para** validar la estabilidad del sistema antes de realizar despliegues a producción.
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** Ejecución manual on-demand.
    * **Dado** que la suite de pruebas está en estado *"Lista"*,
    * **Cuando** el usuario hace clic en *"Ejecutar Ahora"*,
    * **Entonces** el sistema debe instanciar el contenedor de pruebas y mostrar el estado *"En Ejecución"*.
* **Prioridad MoSCoW:** *Should Have* (Debería tener).
* **Estimación (Story Points):** 8 Puntos.

---

### Historia de Usuario 4 (`US-04`)
* **Título:** Visualización de Reporte Resumido de Pruebas (Pass/Fail).
* **Declaración de Valor:**
  > **Como** Líder de Proyecto / Product Owner,  
  > **quiero** visualizar un dashboard con el porcentaje de pruebas exitosas y fallidas,  
  > **para** tomar decisiones informadas sobre la liberación de la versión de software.
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** Generación de métricas tras ejecución.
    * **Dado** que finaliza la ejecución de una suite de pruebas,
    * **Entonces** la plataforma debe actualizar inmediatamente el gráfico de dona indicando el total de tests ejecutados, aprobados y fallados.
* **Prioridad MoSCoW:** *Should Have* (Debería tener).
* **Estimación (Story Points):** 5 Puntos.

---

### Historia de Usuario 5 (`US-05`)
* **Título:** Alertas de Notificación de Fallos por Correo y Telegram.
* **Declaración de Valor:**
  > **Como** Ingeniero de Software,  
  > **quiero** recibir una notificación inmediata cuando una prueba automatizada crítica falle en el entorno de Staging,  
  > **para** corregir el defecto sin demoras en el flujo de entrega continua.
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** Notificación automática tras fallo de severidad alta.
    * **Dado** que un test etiquetado como `CRITICAL` resulta fallido,
    * **Entonces** el servicio de notificaciones debe enviar un mensaje a Telegram con el nombre del test y el enlace al log de error.
* **Prioridad MoSCoW:** *Could Have* (Podría tener).
* **Estimación (Story Points):** 3 Puntos.

---

## 4. Conclusiones

La estructuración de requerimientos mediante historias de usuario permite mantener una comunicación clara entre el cliente (Product Owner), el equipo de desarrollo y el equipo de pruebas (*QA*). Al acompañar cada historia con criterios de aceptación en formato Gherkin, se facilita el proceso de automatización de pruebas (*Behavior-Driven Development - BDD*), reduciendo la ambigüedad y garantizando que el incremento entregado al final de cada Sprint cumpla estrictamente con la definición de hecho (*Definition of Done*).

---

## 5. Referencias (Normas APA 7.ª Edición)

* Cohn, M. (2004). *User Stories Applied: For Agile Software Development*. Addison-Wesley Professional.
* Schwaber, K., & Sutherland, J. (2020). *La Guía de Scrum: Las Reglas del Juego*. Scrum.org. https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-Spanish.pdf
