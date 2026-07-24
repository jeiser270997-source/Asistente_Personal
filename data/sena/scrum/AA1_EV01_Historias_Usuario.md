# Informe de Historias de Usuario (AA1-EV01) — Marco de Trabajo Scrum

> **Programa**: Aplicación del Marco de Trabajo Scrum para Proyectos de Desarrollo de Software (Ficha 3565476)  
> **Instructora**: afrancov@sena.edu.co  
> **Aprendiz**: Jeiser Abraham Gutiérrez Torres  
> **Fecha de Entrega**: 28 de Julio de 2026  
> **Estándar**: Normas APA 7ª Edición  

---

## 1. Introducción

En el marco del desarrollo ágil de software mediante la metodología Scrum, la especificación de requisitos orientados al usuario se realiza a través de las **Historias de Usuario (User Stories)**. El presente informe estructura las historias de usuario para un proyecto de desarrollo de software utilizando el formato estándar: *Como [Rol], Quiero [Acción], Para [Beneficios]* y definiendo los Criterios de Aceptación bajo la técnica INVEST (Independiente, Negociable, Valiosa, Estimable, Pequeña y Testeable).

---

## 2. Definición del Proyecto y Roles del Equipo Scrum

### 2.1 Roles Principales
- **Product Owner**: Responsable de maximizar el valor del producto y gestionar el Product Backlog.
- **Scrum Master**: Facilitador del marco Scrum, removiendo impedimentos y guiando al equipo.
- **Developers (Equipo de Desarrollo)**: Equipo multidisciplinario encargado de convertir los ítems del backlog en incrementos de software funcional.

---

## 3. Matriz de Historias de Usuario (AA1-EV01)

| ID | Historia de Usuario | Criterios de Aceptación (Dado, Cuando, Entonces) | Prioridad | Estimación (Story Points) |
|---|---------------------|--------------------------------------------------|-----------|---------------------------|
| **HU-01** | **Como** cliente registrado,<br/>**Quiero** autenticarme en la plataforma con correo y contraseña,<br/>**Para** acceder a mi panel personal de servicios. | **Dado** que el usuario ingresa sus credenciales válidas,<br/>**Cuando** hace clic en "Iniciar Sesión",<br/>**Entonces** el sistema valida el JWT y lo redirige a su Dashboard en menos de 2 segundos. | Alta | 3 |
| **HU-02** | **Como** administrador del sistema,<br/>**Quiero** visualizar un reporte en tiempo real de transacciones,<br/>**Para** monitorear la salud financiera del servicio. | **Dado** que el administrador ingresa al módulo de métricas,<br/>**Cuando** selecciona el rango de fechas,<br/>**Entonces** el sistema genera una tabla interactiva exportable a CSV. | Media | 5 |
| **HU-03** | **Como** usuario final,<br/>**Quiero** restablecer mi contraseña mediante enlace seguro enviado al correo,<br/>**Para** recuperar el acceso a mi cuenta si olvido la clave. | **Dado** que el usuario solicita recuperación,<br/>**Cuando** ingresa su correo verificado,<br/>**Entonces** el sistema envía un token temporal válido por 15 minutos. | Alta | 3 |

---

## 4. Conclusiones

La correcta formulación de historias de usuario bajo el marco Scrum garantiza una comunicación transparente entre los stakeholders y el equipo de desarrollo, reduciendo reprocesos y asegurando entregas incrementales de alto valor en cada Sprint.

---

## Referencias (APA 7ª Edición)

- Schwaber, K., & Sutherland, J. (2020). *La Guía de Scrum: Las Reglas del Juego*. Scrum.org.
- Cohn, M. (2004). *User Stories Applied: For Agile Software Development*. Addison-Wesley Professional.
