# SERVICIO NACIONAL DE APRENDIZAJE — SENA
**Formación profesional integral**

## Actividad de Aprendizaje 3
**Determinar una base de datos teniendo en cuenta las reglas de normalización.**
*Evidencia: Documento - Aplicar la técnica de normalización a una base de datos en una empresa.*

**Programa de formación:** Bases de Datos: Generalidades y Sistemas de Gestión  
**Ficha:** 3549155  
**Aprendiz:** Jeiser Abraham Gutiérrez Torres  
**Instructor:** Rafael Neftalí Lizcano Reyes  

---

## 1. Importancia del Concepto de Normalización

La normalización es un proceso fundamental en el diseño de bases de datos relacionales. Su importancia radica en que permite organizar la información de manera estructurada, eliminando la redundancia de datos (duplicidad) y previniendo anomalías de actualización, inserción y borrado. Al aplicar las reglas de normalización, se protege la integridad referencial de los datos, se optimiza el espacio de almacenamiento en disco y se garantiza que el motor de base de datos responda a las consultas de forma más rápida y exacta. Una base de datos sin normalizar es propensa a inconsistencias que, a nivel empresarial, se traducen en pérdida de dinero y fallos operativos.

---

## 2. Análisis de la Base de Datos Original (Caso Colegio San Jorge)

En la Actividad 2, se planteó un diseño conceptual inicial con las siguientes entidades:

- **Profesores:** cod_profesor (PK), nombres, apellidos, documento_identidad, genero, direccion, telefono, correo, fecha_nacimiento, titulo_academico, cod_curso_dirige.
- **Estudiantes:** cod_estudiante (PK), nombres, apellidos, documento_id, genero, fecha_nacimiento, edad, direccion, telefono_contacto, correo, cod_curso (FK).
- **Materias:** cod_materia (PK), nombre_materia, descripcion, intensidad_horaria, area_conocimiento.
- **Cursos:** cod_curso (PK), nombre_curso, grado, grupo, jornada, año_lectivo, capacidad_maxima.
- **Asignación_Materias_Curso:** cod_curso (PK/FK), cod_materia (PK/FK), cod_profesor (PK/FK), dia_semana, hora_inicio, hora_fin, salon.

A simple vista, el modelo conceptual de la Actividad 2 fue muy bien estructurado, sin embargo, a nivel de diseño lógico, existen atributos que violan las reglas de normalización (por ejemplo, el campo `edad` que es un valor calculable, o los campos de `telefono` que pueden ser multivaluados). A continuación, aplicaremos las tres formas normales.

---

## 3. Proceso de Normalización Paso a Paso

### Primera Forma Normal (1NF)
**Regla:** Eliminar grupos repetitivos. Todos los atributos deben ser atómicos (indivisibles) y no deben existir campos multivaluados.
- **Ajuste realizado:** Un estudiante o un profesor puede tener más de un número de teléfono (fijo, celular 1, celular 2). En la tabla original, el campo `telefono` permitiría ingresar múltiples valores separados por comas, violando la 1NF. 
- **Solución:** Se elimina el campo teléfono de las tablas `Profesores` y `Estudiantes`, y se crean dos nuevas tablas débiles (`Telefonos_Profesor` y `Telefonos_Estudiante`) para garantizar la atomicidad.

### Segunda Forma Normal (2NF)
**Regla:** La tabla debe estar en 1NF y todos sus atributos no clave deben depender completamente de la clave primaria completa (eliminar dependencias parciales).
- **Ajuste realizado:** En la tabla `Asignación_Materias_Curso`, la clave primaria es compuesta (`cod_curso`, `cod_materia`, `cod_profesor`). Atributos como `dia_semana`, `hora_inicio`, `hora_fin` y `salon` dependen completamente de esa combinación, por lo que cumple la 2NF. No obstante, si hubiésemos incluido el `nombre_materia` dentro de la asignación, este dependería solo de `cod_materia` (dependencia parcial). El diseño base se ajusta estrictamente para asegurar que ningún campo descriptivo se mezcle en tablas transaccionales.

### Tercera Forma Normal (3NF)
**Regla:** La tabla debe estar en 2NF y no deben existir dependencias transitivas (los atributos no clave no pueden depender de otros atributos no clave). Adicionalmente, no se deben almacenar campos calculables.
- **Ajuste realizado:** En la tabla `Estudiantes`, existe el atributo `edad`. La edad es un dato dinámico que depende transitivamente del tiempo actual y se puede calcular directamente a partir de la `fecha_nacimiento`. Mantenerlo viola el principio de no redundancia de la 3NF.
- **Solución:** Se elimina el campo `edad` de la estructura de la base de datos. Se calculará a nivel de aplicación o mediante una vista de base de datos (`VIEW`).

---

## 4. Estructura Final (Diccionario de Datos Normalizado)

Tras aplicar 1NF, 2NF y 3NF, el esquema final de la base de datos es el siguiente:

**1. Tabla PROFESORES**
- `cod_profesor` (PK) - INT
- `nombres` - VARCHAR(50)
- `apellidos` - VARCHAR(50)
- `documento_identidad` - VARCHAR(20)
- `genero` - CHAR(1)
- `direccion` - VARCHAR(100)
- `correo` - VARCHAR(100)
- `fecha_nacimiento` - DATE
- `titulo_academico` - VARCHAR(100)
- `cod_curso_dirige` - VARCHAR(10) (FK -> CURSOS)

**2. Tabla TELEFONOS_PROFESOR** *(Nueva por 1NF)*
- `id_telefono` (PK) - INT
- `cod_profesor` (FK) - INT
- `numero_telefono` - VARCHAR(15)

**3. Tabla ESTUDIANTES** *(Se elimina "edad" por 3NF)*
- `cod_estudiante` (PK) - INT
- `nombres` - VARCHAR(50)
- `apellidos` - VARCHAR(50)
- `documento_id` - VARCHAR(20)
- `genero` - CHAR(1)
- `fecha_nacimiento` - DATE
- `direccion` - VARCHAR(100)
- `correo` - VARCHAR(100)
- `cod_curso` (FK -> CURSOS) - VARCHAR(10)

**4. Tabla TELEFONOS_ESTUDIANTE** *(Nueva por 1NF)*
- `id_telefono` (PK) - INT
- `cod_estudiante` (FK) - INT
- `numero_telefono` - VARCHAR(15)

**5. Tabla MATERIAS**
- `cod_materia` (PK) - VARCHAR(10)
- `nombre_materia` - VARCHAR(80)
- `descripcion` - VARCHAR(200)
- `intensidad_horaria` - INT
- `area_conocimiento` - VARCHAR(50)

**6. Tabla CURSOS**
- `cod_curso` (PK) - VARCHAR(10)
- `nombre_curso` - VARCHAR(50)
- `grado` - VARCHAR(10)
- `grupo` - CHAR(1)
- `jornada` - VARCHAR(20)
- `año_lectivo` - INT
- `capacidad_maxima` - INT

**7. Tabla ASIGNACION_MATERIAS_CURSO**
- `cod_curso` (PK / FK) - VARCHAR(10)
- `cod_materia` (PK / FK) - VARCHAR(10)
- `cod_profesor` (PK / FK) - INT
- `dia_semana` - VARCHAR(10)
- `hora_inicio` - TIME
- `hora_fin` - TIME
- `salon` - VARCHAR(10)

---
*Fin del documento.*
