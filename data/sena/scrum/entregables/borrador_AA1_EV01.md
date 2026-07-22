# INFORME TÉCNICO DE HISTORIAS DE USUARIO Y REQUERIMIENTOS DEL CLIENTE BAJO EL MARCO DE TRABAJO SCRUM
**Programa de Formación:** Aplicación del Marco de Trabajo Scrum para Proyectos de Desarrollo de Software  
**Código de Ficha:** 3565476  
**Aprendiz:** Jeiser Abraham Gutiérrez Torres  
**Instructora:** Ayda Andrea Franco Villamil  
**Institución:** Servicio Nacional de Aprendizaje (SENA) — Centro de Formación  
**Estándar de Formato:** Normas APA 7.ª Edición  
**Evidencia Evaluativa:** AA1-EV01  
**Fecha de Elaboración:** 22 de Julio de 2026  

---

## Resumen Ejecutivo

El presente documento constituye el informe técnico y marco metodológico para la especificación, análisis y documentación de requerimientos de software mediante Historias de Usuario (*User Stories*) en el contexto de proyectos desarrollados bajo el marco de trabajo ágil Scrum. El proyecto seleccionado como caso de estudio corresponde a la plataforma web de gestión y ejecución de pruebas de calidad de software automatizadas denominada **QA-Hub Platform**. 

Se desarrolla una estructura detallada compuesta por doce (12) Historias de Usuario organizadas en el *Product Backlog*, cada una equipada con su respectiva declaración de valor, criterios de aceptación formalizados bajo la sintaxis Gherkin (*Given-When-Then*), priorización bajo el método MoSCoW, estimación de esfuerzo en Puntos de Historia (*Story Points* mediante escala Fibonacci) y trazabilidad con los objetivos de negocio. Asimismo, se definen los acuerdos de equipo de *Definition of Ready* (DoR) y *Definition of Done* (DoD), la caracterización de los roles de Scrum y el impacto del enfoque ágil en la reducción de la deuda técnica en el desarrollo de software.

---

## 1. Introducción

En el desarrollo de software tradicional orientado por cascada (*Waterfall*), la ingeniería de requerimientos solía plasmarse en extensos Especificaciones de Requerimientos de Software (SRS) de carácter estático y rígido. Este enfoque frecuentemente derivaba en divergencias significativas entre lo construido por el equipo de desarrollo y las expectativas cambiantes del cliente o mercado (Sommerville, 2011).

El marco de trabajo Scrum revoluciona esta dinámica sustituyendo la documentación estática por una lista viva y priorizada denominada *Product Backlog* (Schwaber & Sutherland, 2020). La unidad fundamental de información dentro del *Product Backlog* es la Historia de Usuario. De acuerdo con Cohn (2004), una historia de usuario no representa un contrato cerrado, sino una invitación a la conversación entre el *Product Owner*, el equipo de desarrollo (*Developers*) y los interesados (*Stakeholders*). 

Este informe expone cómo la correcta articulación de historias de usuario, complementada con el enfoque de Desarrollo Guiado por Comportamiento (*Behavior-Driven Development* - BDD), garantiza que cada incremento entregado al final de un Sprint aporte valor real y medible al cliente final.

---

## 2. Marco Teórico y Fundamentos Metodológicos

### 2.1 El Marco de Trabajo Scrum
Scrum es un marco de trabajo liviano que ayuda a las personas, equipos y organizaciones a generar valor a través de soluciones adaptativas para problemas complejos (Schwaber & Sutherland, 2020). Se fundamenta en el empirismo y el pensamiento *Lean*. El empirismo afirma que el conocimiento procede de la experiencia y que las decisiones se toman basándose en lo que se observa.

Los tres pilares empíricos de Scrum son:
1. **Transparencia:** Los procesos y el trabajo deben ser visibles para quienes realizan el trabajo y para quienes lo reciben.
2. **Inspección:** Los artefactos de Scrum y el progreso hacia los objetivos deben inspeccionarse con frecuencia y diligencia.
3. **Adaptación:** Si se detecta que algún aspecto se desvía de límites aceptables, el proceso o el material que se procesa debe ajustarse.

### 2.2 Anatomía de una Historia de Usuario (Las 3 C)
Según Jeffries (2001), una historia de usuario efectiva consta de tres elementos esenciales conocidos como el modelo de las **3 C**:
* **Card (Tarjeta):** La representación física o digital que resume el Requerimiento usando la sintaxis estándar (*Como... Quiero... Para...*).
* **Conversation (Conversación):** El intercambio continuo de detalles entre el *Product Owner* y el equipo de desarrollo durante la refinación (*Refinement*).
* **Confirmation (Confirmación):** Los criterios de aceptación verificables que determinan cuándo la historia ha sido implementada con éxito.

### 2.3 Criterios de Calidad INVEST
Para asegurar la calidad técnica de las historias de usuario en el *Product Backlog*, se aplica el acrónimo INVEST propuesto por Bill Wake (2003):
* **I - Independent (Independiente):** Evitar dependencias acopladas entre historias.
* **N - Negotiable (Negociable):** Los detalles se acuerdan en la conversación, no están tallados en piedra.
* **V - Valuable (Valiosa):** Aporta valor percibido al usuario final o al negocio.
* **E - Estimable (Estimable):** El equipo de desarrollo tiene suficiente claridad para dimensionar su esfuerzo.
* **S - Small (Pequeña):** Lo suficientemente acotada para completarse dentro de un solo Sprint.
* **T - Testable (Testable):** Cuenta con criterios de aceptación claros para ejecutar pruebas funcionales.

---

## 3. Descripción del Proyecto: Plataforma QA-Hub

El proyecto **QA-Hub Platform** es una herramienta SaaS (*Software as a Service*) diseñada para optimizar los ciclos de prueba en equipos de ingeniería de software. La plataforma permite a los equipos de desarrollo y aseguramiento de calidad (QA) gestionar suites de prueba automatizadas (utilizando frameworks como Playwright y Postman), disparar ejecuciones continuas integradas con pipelines de CI/CD, analizar reportes de cobertura en tiempo real y recibir alertas automatizadas ante fallos críticos en el código.

### 3.1 Roles del Sistema
* **QA Automation Engineer:** Encargado de crear, mantener y ejecutar suites de pruebas automatizadas.
* **Desarrollador / Dev Lead:** Recibe alertas inmediatas ante fallos en pruebas de integración y Staging.
* **Product Owner / QA Manager:** Analiza métricas ejecutivas de estabilidad, cobertura y calidad del software.
* **Administrador del Sistema:** Gestiona accesos, permisos y configuraciones de entornos de ejecución.

---

## 4. Definición de Acuerdos de Equipo

### 4.1 Definition of Ready (DoR - Definición de Listo)
Una historia de usuario se considera lista (*Ready*) para ser seleccionada en el *Sprint Planning* únicamente si cumple con:
1. Sintaxis completa (*Como / Quiero / Para*).
2. Mínimo dos (2) criterios de aceptación redactados en sintaxis Gherkin.
3. Estimación realizada por el equipo de desarrollo en Puntos de Historia.
4. Diseños UI/UX o maquetas adjuntas (si aplica).
5. Sin dependencias bloqueantes externas.

### 4.2 Definition of Done (DoD - Definición de Hecho)
Una historia de usuario se declara terminada (*Done*) al finalizar el Sprint si cumple con:
1. Código fuente revisado mediante *Pull Request* con aprobación de al menos dos pares.
2. Cobertura de pruebas unitarias superior al 80%.
3. Pruebas automatizadas E2E ejecutadas y pasando al 100% en el entorno de *Staging*.
4. Documentación técnica y notas de versión (*Release Notes*) actualizadas.
5. Despliegue exitoso en el ambiente de pruebas de integración.

---

## 5. Matriz Completa de Historias de Usuario (Product Backlog)

### Historia de Usuario 1 (`US-01`)
* **Título del Requerimiento:** Autenticación e Inicio de Sesión Seguro con OAuth2 / JWT.
* **Declaración de Valor:**
  > **Como** QA Automation Engineer,  
  > **quiero** autenticarme en la plataforma QA-Hub utilizando mis credenciales institucionales o proveedor OAuth2,  
  > **para** acceder de manera segura a mis paneles de control y suites de prueba de la organización.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Autenticación exitosa.**
    * **Dado** que el usuario se encuentra en la página de inicio de sesión `/login`,
    * **Cuando** ingresa un correo corporativo válido y la contraseña correcta,
    * **Entonces** el sistema autentica al usuario en menos de 1.5 segundos, retorna un token JWT firmado y redirige al dashboard `/dashboard`.
  * **Escenario 2: Intento de inicio de sesión con contraseña errónea.**
    * **Dado** que el usuario ingresa una contraseña incorrecta,
    * **Cuando** presiona el botón *"Iniciar Sesión"*,
    * **Entonces** la plataforma muestra el mensaje de alerta *"Credenciales inválidas"* y bloquea la cuenta tras 5 intentos fallidos consecutivos.
* **Priorización (MoSCoW):** *Must Have* (Imprescindible).
* **Estimación de Esfuerzo:** 3 Story Points (Escala Fibonacci).

---

### Historia de Usuario 2 (`US-02`)
* **Título del Requerimiento:** Gestión y Registro de Suites de Prueba Automatizadas.
* **Declaración de Valor:**
  > **Como** QA Automation Engineer,  
  > **quiero** registrar y configurar una nueva suite de pruebas especificando el repositorio Git y el navegador objetivo,  
  > **para** organizar los scripts de prueba de Playwright según los módulos de la aplicación.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Creación correcta de suite.**
    * **Dado** que el usuario llena el formulario con el nombre de la suite, URL del repositorio Git y selecciona los navegadores (Chromium, Firefox, WebKit),
    * **Cuando** hace clic en *"Guardar Suite"*,
    * **Entonces** la aplicación valida la conectividad con el repositorio y registra la suite en la base de datos con estado *"Activa"*.
* **Priorización (MoSCoW):** *Must Have* (Imprescindible).
* **Estimación de Esfuerzo:** 5 Story Points.

---

### Historia de Usuario 3 (`US-03`)
* **Título del Requerimiento:** Disparo de Ejecución Manual y Programada de Pruebas E2E.
* **Declaración de Valor:**
  > **Como** Desarrollador / Lider de QA,  
  > **quiero** ejecutar manualmente una suite de pruebas o programar su disparo mediante cron job,  
  > **para** verificar la estabilidad del código tras cada nuevo commit o despliegue.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Ejecución bajo demanda.**
    * **Dado** que la suite se encuentra en estado *"Activa"*,
    * **Cuando** el usuario presiona el botón *"Ejecutar Ahora"*,
    * **Entonces** la plataforma levanta un contenedor aislado de Docker y comienza el reporte en vivo de la prueba.
* **Priorización (MoSCoW):** *Must Have* (Imprescindible).
* **Estimación de Esfuerzo:** 8 Story Points.

---

### Historia de Usuario 4 (`US-04`)
* **Título del Requerimiento:** Dashboard Ejecutivo de Métricas de Calidad y Cobertura.
* **Declaración de Valor:**
  > **Como** Product Owner / QA Manager,  
  > **quiero** visualizar gráficos interactivos con el porcentaje de pruebas pasadas, fallidas y salteadas,  
  > **para** evaluar objetivamente la calidad del software antes de autorizar un pase a producción.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Actualización de gráficos post-ejecución.**
    * **Dado** que una suite de pruebas finaliza su ciclo,
    * **Cuando** el Product Owner ingresa al panel `/metrics`,
    * **Entonces** los indicadores clave de desempeño (KPIs) y gráficos de dona se actualizan dinámicamente mostrando el índice de aprobados vs. fallados.
* **Priorización (MoSCoW):** *Should Have* (Debería tener).
* **Estimación de Esfuerzo:** 5 Story Points.

---

### Historia de Usuario 5 (`US-05`)
* **Título del Requerimiento:** Sistema de Notificaciones de Alertas Críticas por Telegram y Email.
* **Declaración de Valor:**
  > **Como** Desarrollador de Software,  
  > **quiero** recibir un mensaje instantáneo en Telegram cuando falle un test de severidad crítica,  
  > **para** corregir el bug de forma inmediata sin necesidad de revisar la plataforma manualmente.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Notificación de error crítico.**
    * **Dado** que un test etiquetado como `SEVERITY_CRITICAL` falla durante la ejecución automatizada,
    * **Cuando** se registra la falla en la base de datos,
    * **Entonces** el bot de Telegram de la plataforma envía una alerta notificando el nombre del test, el stack trace del error y el enlace al video de la ejecución.
* **Priorización (MoSCoW):** *Should Have* (Debería tener).
* **Estimación de Esfuerzo:** 5 Story Points.

---

### Historia de Usuario 6 (`US-06`)
* **Título del Requerimiento:** Exportación de Informes de Pruebas en PDF y HTML.
* **Declaración de Valor:**
  > **Como** QA Manager,  
  > **quiero** exportar el informe de resultados de un Sprint en formato PDF formal con normas corporativas,  
  > **para** adjuntarlo a las entregas de auditoría y revisión de cumplimiento con clientes externos.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Exportación exitosa a PDF.**
    * **Dado** que se ha seleccionado el rango de fechas de un Sprint finalizado,
    * **Cuando** el usuario hace clic en *"Descargar Informe PDF"*,
    * **Entonces** el sistema genera un documento formateado con encabezados, tablas de resultados y resumen ejecutivo en menos de 5 segundos.
* **Priorización (MoSCoW):** *Could Have* (Podría tener).
* **Estimación de Esfuerzo:** 3 Story Points.

---

### Historia de Usuario 7 (`US-07`)
* **Título del Requerimiento:** Integración de Webhooks con Pipelines de CI/CD (GitHub Actions / Jenkins).
* **Declaración de Valor:**
  > **Como** Ingeniero DevOps,  
  > **quiero** configurar un endpoint de Webhook protegido en QA-Hub,  
  > **para** desencadenar pruebas automáticas al recibir un evento de `push` o `pull_request` en GitHub.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Trigger de Webhook exitoso.**
    * **Dado** que GitHub envía un payload HTTP POST con firma HMAC válida al endpoint de QA-Hub,
    * **Entonces** la plataforma valida la firma, encola la suite de pruebas correspondiente y retorna una respuesta HTTP 202 Accepted.
* **Priorización (MoSCoW):** *Should Have* (Debería tener).
* **Estimación de Esfuerzo:** 8 Story Points.

---

### Historia de Usuario 8 (`US-08`)
* **Título del Requerimiento:** Almacenamiento y Visualización de Evidencias en Video y Screenshots.
* **Declaración de Valor:**
  > **Como** QA Automation Engineer,  
  > **quiero** inspeccionar el video grabado y las capturas de pantalla tomadas al momento exacto de un fallo en Playwright,  
  > **para** realizar la depuración (*debugging*) del error de forma rápida.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Reproducción de video de prueba fallida.**
    * **Dado** que una prueba falló y generó archivo `.webm` y `.png`,
    * **Cuando** el usuario abre el detalle de la prueba fallida,
    * **Entonces** la plataforma muestra un reproductor multimedia integrado con la línea de tiempo coincidente con la falla.
* **Priorización (MoSCoW):** *Must Have* (Imprescindible).
* **Estimación de Esfuerzo:** 5 Story Points.

---

### Historia de Usuario 9 (`US-09`)
* **Título del Requerimiento:** Asignación de Roles y Permisos Granulares de Usuarios (RBAC).
* **Declaración de Valor:**
  > **Como** Administrador del Sistema,  
  > **quiero** asignar roles (`Admin`, `QA Lead`, `Tester`, `Viewer`) a los usuarios de la plataforma,  
  > **para** restringir la modificación de suites críticas únicamente a personal autorizado.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Restricción de permisos.**
    * **Dado** que un usuario tiene el rol `Viewer`,
    * **Cuando** intenta eliminar o editar una suite de pruebas,
    * **Entonces** el sistema deshabilita las opciones de edición y rechaza las solicitudes API con código HTTP 403 Forbidden.
* **Priorización (MoSCoW):** *Must Have* (Imprescindible).
* **Estimación de Esfuerzo:** 5 Story Points.

---

### Historia de Usuario 10 (`US-10`)
* **Título del Requerimiento:** Comparativa Histórica de Tiempos de Ejecución de Pruebas.
* **Declaración de Valor:**
  > **Como** Lider Técnico,  
  > **quiero** comparar el tiempo de ejecución de las suites de prueba a lo largo de los últimos 5 Sprints,  
  > **para** identificar cuellos de botella e ineficiencias en el rendimiento de los scripts.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Análisis de tendencia de tiempo.**
    * **Dado** que existen datos históricos de más de 3 Sprints,
    * **Cuando** el usuario consulta el gráfico de tendencias de rendimiento,
    * **Entonces** la plataforma despliega una gráfica de líneas mostrando la variación del tiempo de ejecución en segundos.
* **Priorización (MoSCoW):** *Could Have* (Podría tener).
* **Estimación de Esfuerzo:** 3 Story Points.

---

### Historia de Usuario 11 (`US-11`)
* **Título del Requerimiento:** Reintento Automático de Pruebas Flaky (*Flaky Tests Auto-Retry*).
* **Declaración de Valor:**
  > **Como** QA Automation Engineer,  
  > **quiero** configurar un límite de hasta 2 reintentos automáticos para pruebas inestables (*flaky*),  
  > **para** evitar falsos negativos en el reporte debido a latencias temporales de red.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Reintento exitoso tras fallo por timeout.**
    * **Dado** que un test falla por un timeout transitorio de red en el primer intento,
    * **Cuando** la opción de auto-reintento está activada,
    * **Entonces** el runner ejecuta de nuevo el test hasta 2 veces adicionales y lo marca como `FLAKY_PASSED` si aprueba en el reintento.
* **Priorización (MoSCoW):** *Should Have* (Debería tener).
* **Estimación de Esfuerzo:** 5 Story Points.

---

### Historia de Usuario 12 (`US-12`)
* **Título del Requerimiento:** Integración de Pruebas de API REST / Postman.
* **Declaración de Valor:**
  > **Como** Backend Developer / QA,  
  > **quiero** ejecutar colecciones de Postman (archivos JSON/Newman) dentro de la misma plataforma QA-Hub,  
  > **para** validar los contratos de los servicios Web antes de probar la interfaz gráfica.
* **Criterios de Aceptación (BDD / Gherkin):**
  * **Escenario 1: Ejecución de colección Postman.**
    * **Dado** que el usuario carga una colección válida de Postman y un archivo de variables de entorno,
    * **Cuando** se ejecuta la suite de API,
    * **Entonces** la plataforma procesa las peticiones HTTP y muestra el desglose de códigos de estado (200 OK, 201 Created) y assertions evaluados.
* **Priorización (MoSCoW):** *Should Have* (Debería tener).
* **Estimación de Esfuerzo:** 5 Story Points.

---

## 6. Cuadro de Resumen y Priorización del Product Backlog

| ID Historia | Título del Requerimiento | Prioridad MoSCoW | Story Points | Rol Beneficiado |
| :--- | :--- | :---: | :---: | :--- |
| `US-01` | Autenticación Segura OAuth2 / JWT | **Must Have** | 3 | QA / Tester |
| `US-02` | Gestión de Suites de Pruebas Git/Playwright | **Must Have** | 5 | QA Engineer |
| `US-03` | Disparo Manual y Programado de Pruebas | **Must Have** | 8 | Dev / QA Lead |
| `US-04` | Dashboard de Métricas de Calidad | **Should Have** | 5 | Product Owner |
| `US-05` | Alertas de Fallos por Telegram y Correo | **Should Have** | 5 | Developer |
| `US-06` | Exportación de Informes en PDF/HTML | **Could Have** | 3 | QA Manager |
| `US-07` | Webhooks e Integración CI/CD GitHub | **Should Have** | 8 | DevOps Engineer |
| `US-08` | Almacenamiento de Video y Screenshots | **Must Have** | 5 | QA Engineer |
| `US-09` | Permisos Granulares y Roles (RBAC) | **Must Have** | 5 | Administrador |
| `US-10` | Comparativa Histórica de Tiempos | **Could Have** | 3 | Líder Técnico |
| `US-11` | Reintento Automático de Tests Flaky | **Should Have** | 5 | QA Engineer |
| `US-12` | Integración de Pruebas API / Postman | **Should Have** | 5 | Backend Dev |
| **TOTAL** | **12 Historias de Usuario** | **-** | **60 Points** | **Equipo Scrum** |

---

## 7. Conclusiones

La transformación de requerimientos en Historias de Usuario estructuradas bajo los principios INVEST y validadas mediante BDD/Gherkin permite al equipo de desarrollo y aseguramiento de calidad (QA) mantener un enfoque claro en el valor entregado. Al utilizar historias de usuario bien definidas junto con acuerdos explícitos de *Definition of Ready* (DoR) y *Definition of Done* (DoD), el equipo Scrum logra minimizar la ambigüedad, evitar el retrabajo y asegurar entregables con altos estándares de calidad técnica desde el primer Sprint.

---

## 8. Referencias (Normas APA 7.ª Edición)

* Cohn, M. (2004). *User Stories Applied: For Agile Software Development*. Addison-Wesley Professional.
* Jeffries, C., Anderson, A., & Hendrickson, C. (2001). *Extreme Programming Installed*. Addison-Wesley Professional.
* Schwaber, K., & Sutherland, J. (2020). *La Guía de Scrum: Las Reglas del Juego*. Scrum.org. https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-Spanish.pdf
* Sommerville, I. (2011). *Ingeniería del Software* (9.ª ed.). Pearson Educación.
* Wake, B. (2003). *INVEST in Good Stories, and Smart Tasks*. XP123. https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/
