# MC_AA1_bases_de_datos
> Convertido de PDF | 5/7/2026, 12:08:15 p. m.

## UNIVERSITAT JAUME I DE CASTELLÓ

Departamento de Ingeniería y Ciencia de la Computación

Bases de Datos

Mercedes Marqués

Enero de 2009



-- 1 of 227 --



-- 2 of 227 --



Este texto se ha elaborado para dar soporte a un curso sobre Bases de Datos orientado a las

Ingenierías Informáticas.

El contenido se ha dividido en tres partes. La primera parte realiza un estudio del modelo

relacional: la estructura de datos, las reglas para mantener la integridad de la base de datos y los

lenguajes relacionales, que se utilizan para manipular las bases de datos. Dentro de los lenguajes

relacionales se hace una presentación exahustiva del lenguaje SQL, que es el lenguaje estándar de

acceso a las bases de datos relacionales.

La segunda parte del texto plantea una metodología de diseño de bases de datos relacionales,

comenzando por el diseño conceptual mediante el modelo entidad–relación. La siguiente etapa del

diseño se aborda estableciendo una serie de relas para obtener el esquema lógico de la base de datos,

y la tercera y última etapa trata del diseño físico en SQL.

La tecera parte del texto plantea introducciones a temas más avanzados sobre bases de datos,

como son los disparadores y la incorporación de características de la orientación a objetos mediante

el modelo objeto–relacional. Además, en esta última parte se realiza un recorrido por los distintos

módulos que forman parte de un sistema de gestión de bases de datos, lo que permite conocer toda

su funcionalidad.

Al principio de cada capítulo hay un apartado titulado Introducción y objetivos en el que se

motiva el estudio del tema y se plantean los objetivos de aprendizaje que debe conseguir el es-

tudiantado. El texto incluye ejemplos y ejercicios resueltos para ayudar a la comprensión de los

contenidos. Este material se complementa con actividades a realizar por el estudiantado, que serán

publicadas en un entorno virtual de aprendizaje.



-- 3 of 227 --



-- 4 of 227 --



Índice general

I Bases de datos relacionales 1

1. Conceptos de bases de datos 3

1.1. Base de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

1.2. Sistema de gestión de bases de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

1.3. Personas en el entorno de las bases de datos . . . . . . . . . . . . . . . . . . . . . . . 6

1.4. Historia de los sistemas de bases de datos . . . . . . . . . . . . . . . . . . . . . . . . 7

1.5. Ventajas e inconvenientes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10

1.5.1. Ventajas por la integración de datos . . . . . . . . . . . . . . . . . . . . . . . 11

1.5.2. Ventajas por la existencia del SGBD . . . . . . . . . . . . . . . . . . . . . . . 11

1.5.3. Desventajas de los sistemas de bases de datos . . . . . . . . . . . . . . . . . . 13

2. Modelo relacional 15

2.1. Modelos de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 16

2.2. Estructura de datos relacional . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18

2.2.1. Relaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18

2.2.2. Propiedades de las relaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . 21

2.2.3. Tipos de relaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 21

2.2.4. Claves . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22

2.3. Esquema de una base de datos relacional . . . . . . . . . . . . . . . . . . . . . . . . . 23

2.4. Reglas de integridad . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 27

2.4.1. Nulos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 27

2.4.2. Regla de integridad de entidades . . . . . . . . . . . . . . . . . . . . . . . . . 28

2.4.3. Regla de integridad referencial . . . . . . . . . . . . . . . . . . . . . . . . . . 28

2.4.4. Reglas de negocio . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 29

v



-- 5 of 227 --



3. Lenguajes relacionales 31

3.1. Manejo de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 31

3.2. Álgebra relacional . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 32

3.3. Cálculo relacional . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 37

3.3.1. Cálculo orientado a tuplas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 38

3.3.2. Cálculo orientado a dominios . . . . . . . . . . . . . . . . . . . . . . . . . . . 41

3.4. Otros lenguajes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 41

4. Lenguaje SQL 43

4.1. Bases de datos relacionales . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 43

4.2. Descripción de la base de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 44

4.3. Visión general del lenguaje . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 46

4.3.1. Creación de tablas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 47

4.3.2. Inserción de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 49

4.3.3. Consulta de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 50

4.3.4. Actualización y eliminación de datos . . . . . . . . . . . . . . . . . . . . . . . 50

4.4. Estructura básica de la sentencia SELECT . . . . . . . . . . . . . . . . . . . . . . . . . 51

4.4.1. Expresiones en SELECT y WHERE . . . . . . . . . . . . . . . . . . . . . . . . . . 52

4.4.2. Nulos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 52

4.4.3. Tipos de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 53

4.5. Funciones y operadores . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 53

4.5.1. Operadores lógicos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 53

4.5.2. Operadores de comparación . . . . . . . . . . . . . . . . . . . . . . . . . . . . 54

4.5.3. Operadores matemáticos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 54

4.5.4. Funciones matemáticas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 54

4.5.5. Operadores y funciones de cadenas de caracteres . . . . . . . . . . . . . . . . 55

4.5.6. Operadores y funciones de fecha . . . . . . . . . . . . . . . . . . . . . . . . . 56

4.5.7. Función CASE . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59

4.5.8. Funciones COALESCE y NULLIF . . . . . . . . . . . . . . . . . . . . . . . . . . . 59

4.5.9. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 60

4.6. Operaciones sobre conjuntos de filas . . . . . . . . . . . . . . . . . . . . . . . . . . . 61

4.6.1. Funciones de columna . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62

4.6.2. Cláusula GROUP BY . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 64

4.6.3. Cláusula HAVING . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 65

4.6.4. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 65

4.6.5. Algunas cuestiones importantes . . . . . . . . . . . . . . . . . . . . . . . . . . 67

vi



-- 6 of 227 --



4.7. Subconsultas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 68

4.7.1. Subconsultas en la cláusula WHERE . . . . . . . . . . . . . . . . . . . . . . . . 68

4.7.2. Subconsultas en la cláusula HAVING . . . . . . . . . . . . . . . . . . . . . . . . 74

4.7.3. Subconsultas en la cláusula FROM . . . . . . . . . . . . . . . . . . . . . . . . . 75

4.7.4. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 75

4.7.5. Algunas cuestiones importantes . . . . . . . . . . . . . . . . . . . . . . . . . . 77

4.8. Consultas multitabla . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78

4.8.1. La concatenación: JOIN . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78

4.8.2. Sintaxis original de la concatenación . . . . . . . . . . . . . . . . . . . . . . . 82

4.8.3. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 83

4.8.4. Algunas cuestiones importantes . . . . . . . . . . . . . . . . . . . . . . . . . . 84

4.9. Operadores de conjuntos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 85

4.9.1. Operador UNION . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 85

4.9.2. Operador INTERSECT . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 86

4.9.3. Operador EXCEPT . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 86

4.9.4. Sentencias equivalentes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 87

4.9.5. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 87

4.10. Subconsultas correlacionadas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 88

4.10.1. Referencias externas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 89

4.10.2. Operadores EXISTS, NOT EXISTS . . . . . . . . . . . . . . . . . . . . . . . . . 89

4.10.3. Sentencias equivalentes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 91

4.10.4. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 91

II Diseño de bases de datos 95

5. Metodología de diseño de bases de datos 97

5.1. Necesidad de metodologías de diseño . . . . . . . . . . . . . . . . . . . . . . . . . . . 97

5.2. Ciclo de vida . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 99

5.2.1. Planificación del proyecto . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 100

5.2.2. Definición del sistema . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 100

5.2.3. Recolección y análisis de los requisitos . . . . . . . . . . . . . . . . . . . . . . 101

5.2.4. Diseño de la base de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 101

5.2.5. Selección del SGBD . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 102

5.2.6. Diseño de la aplicación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 102

5.2.7. Prototipado . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 102

vii



-- 7 of 227 --



5.2.8. Implementación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 103

5.2.9. Conversión y carga de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . 103

5.2.10. Prueba . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 103

5.2.11. Mantenimiento . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 104

5.3. Diseño de bases de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 104

5.3.1. Diseño conceptual . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 104

5.3.2. Diseño lógico . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 105

5.3.3. Diseño físico . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 105

5.4. Diseño de transacciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106

5.5. Herramientas CASE . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 107

6. Diseño conceptual 109

6.1. Modelo entidad–relación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 109

6.1.1. Entidades . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 111

6.1.2. Relaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112

6.1.3. Atributos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 114

6.1.4. Dominios . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 116

6.1.5. Identificadores . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117

6.1.6. Jerarquías de generalización . . . . . . . . . . . . . . . . . . . . . . . . . . . . 118

6.1.7. Diagrama entidad–relación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119

6.2. Recomendaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119

6.3. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 123

7. Diseño lógico relacional 127

7.1. Esquema lógico . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 127

7.2. Metodología de diseño . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 129

7.2.1. Entidades fuertes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 130

7.2.2. Entidades débiles . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 131

7.2.3. Relaciones binarias . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 131

7.2.4. Jerarquías de generalización . . . . . . . . . . . . . . . . . . . . . . . . . . . . 137

7.2.5. Normalización . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 139

7.3. Restricciones de integridad . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 144

7.4. Desnormalización . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145

7.5. Reglas de comportamiento de las claves ajenas . . . . . . . . . . . . . . . . . . . . . 147

7.6. Cuestiones adicionales . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 150

7.7. Ejemplos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 151

viii



-- 8 of 227 --



8. Diseño físico en SQL 155

8.1. Metodología de diseño . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156

8.1.1. Traducir el esquema lógico . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156

8.1.2. Diseñar la representación física . . . . . . . . . . . . . . . . . . . . . . . . . . 158

8.1.3. Diseñar los mecanismos de seguridad . . . . . . . . . . . . . . . . . . . . . . . 163

8.1.4. Monitorizar y afinar el sistema . . . . . . . . . . . . . . . . . . . . . . . . . . 163

8.2. Vistas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 163

III Conceptos avanzados 169

9. Actividad en bases de datos relacionales 171

9.1. Bases de datos activas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 171

9.2. El modelo evento–condición–acción . . . . . . . . . . . . . . . . . . . . . . . . . . . . 172

9.3. Disparadores en SQL . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 174

9.4. Procesamiento de reglas activas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 176

9.5. Aplicaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 176

9.6. Vistas y disparadores . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 178

10.El modelo objeto–relacional 181

10.1. Necesidad de la orientación a objetos . . . . . . . . . . . . . . . . . . . . . . . . . . . 181

10.2. Debilidades de los SGBD relacionales . . . . . . . . . . . . . . . . . . . . . . . . . . . 183

10.3. Orientación a objetos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 184

10.4. SGBD objeto–relacionales . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 187

10.5. Objetos en el estándar de SQL . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 188

10.6. Mapeo objeto–relacional . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 190

11.Sistemas de gestión de bases de datos 191

11.1. Arquitectura de un SGBD . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 192

11.2. Diccionario de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 193

11.3. Procesamiento de consultas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 194

11.3.1. Descomposición de la consulta . . . . . . . . . . . . . . . . . . . . . . . . . . 197

11.3.2. Optimización de la consulta . . . . . . . . . . . . . . . . . . . . . . . . . . . . 198

11.4. Procesamiento de transacciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 200

11.4.1. Propiedades de las transacciones . . . . . . . . . . . . . . . . . . . . . . . . . 201

11.5. Control de concurrencia . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 202

11.5.1. Protocolo de bloqueo en dos fases . . . . . . . . . . . . . . . . . . . . . . . . 203

ix



-- 9 of 227 --



x

11.5.2. Técnicas de ordenación por marcas de tiempo . . . . . . . . . . . . . . . . . . 204

11.5.3. Control de concurrencia optimista . . . . . . . . . . . . . . . . . . . . . . . . 205

11.6. Transacciones en SQL estándar . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 205

11.7. Recuperación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 207

11.7.1. El diario . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 208

11.7.2. Algoritmos de recuperación . . . . . . . . . . . . . . . . . . . . . . . . . . . . 209

11.7.3. Protocolo de escritura adelantada . . . . . . . . . . . . . . . . . . . . . . . . . 209

11.7.4. Recuperación ante fallos en los medios de almacenamiento . . . . . . . . . . . 210

11.8. Seguridad . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 211

11.8.1. Control de accesos discrecional . . . . . . . . . . . . . . . . . . . . . . . . . . 212

11.8.2. Vistas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 214

11.8.3. Control de accesos obligatorio . . . . . . . . . . . . . . . . . . . . . . . . . . . 215



-- 10 of 227 --



Parte I

Bases de datos relacionales

1



-- 11 of 227 --



-- 12 of 227 --



### Capítulo 1

Conceptos de bases de datos

### Introducción y objetivos

El inicio de un curso sobre bases de datos debe ser, sin duda, la definición de base de datos

y la presentación de los sistemas de gestión de bases de datos, el software que facilita la creación

y manipulación de las mismas al personal informático. Algunos de estos sistemas, ampliamente

utilizados, son PostgreSQL, MySQL y Oracle.

Ya que este texto está dirigido a estudiantado de las ingenierías informáticas, es interesante

conocer qué papeles puede desempeñar el personal informático en el entorno de una base de datos.

Éstas han tenido sus predecesores en los sistemas de ficheros y tienen por delante un amplio hori-

zonte, por lo que antes de comenzar su estudio resulta conveniente ubicarse en el tiempo haciendo

un recorrido por su evolución histórica. El capítulo termina con una exposición sobre las ventajas y

desventajas que las bases de datos conllevan.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Definir qué es una base de datos y qué es un sistema de gestión de bases de datos.

Reconocer los subsistemas que forma parte de un sistema de gestión de bases de datos.

Enumerar las personas que aparecen en el entorno de una base de datos y sus tareas.

Asociar los distintos tipos de sistemas de gestión de bases de datos a las generaciones a las

que pertenecen.

Enumerar las ventajas y desventajas de los sistemas de bases de datos y asociarlas al motivo

por el que se producen: la integración de datos o el sistema de gestión de la base de datos.

3



-- 13 of 227 --



4 1.1. BASE DE DATOS

1.1. Base de datos

Una base de datos es un conjunto de datos almacenados en memoria externa que están orga-

nizados mediante una estructura de datos. Cada base de datos ha sido diseñada para satisfacer

los requisitos de información de una empresa u otro tipo de organización, como por ejemplo, una

universidad o un hospital.

Una base de datos se puede percibir como un gran almacén de datos que se define y se crea una

sola vez, y que se utiliza al mismo tiempo por distintos usuarios. Antes de existir las bases de datos,

los programas debían manejar los datos que se encontraban almacenados en ficheros desconectados

y con información redundante. En una base de datos todos los datos se integran con una mínima

cantidad de duplicidad. De este modo, la base de datos no pertenece a un solo departamento sino

que se comparte por toda la organización. Además, la base de datos no sólo contiene los datos de

la organización, también almacena una descripción de dichos datos. Esta descripción es lo que se

denomina metadatos, se almacena en el diccionario de datos o catálogo y es lo que permite que

exista lo que se denomina independencia de datos lógica–física, de la que se hablará más adelante.

1.2. Sistema de gestión de bases de datos

El sistema de gestión de la base de datos (en adelante SGBD) es una aplicación que permite a

los usuarios definir, crear y mantener la base de datos, además de proporcionar un acceso controlado

a la misma. Se denomina sistema de bases de datos al conjunto formado por la base de datos, el

SGBD y los programas de aplicación que dan servicio a la empresa u organización.

El modelo seguido con los sistemas de bases de datos, en donde se separa la definición de los

datos de los programas de aplicación, es muy similar al modelo que se sigue en la actualidad para el

desarrollo de programas con lenguajes orientados a objetos, en donde se da una definición interna de

un objeto y una definición externa separada. Los usuarios del objeto sólo ven la definición externa y

no se deben preocupar de cómo se define internamente el objeto y ni cómo está implementado. Una

ventaja de este modelo, conocido como abstracción de datos, es que se puede cambiar la definición

interna de un objeto sin afectar a sus usuarios ya que la definición externa no se ve alterada. Del

mismo modo, los sistemas de bases de datos separan la definición de la estructura de los datos, de

los programas de aplicación y almacenan esta definición en la base de datos. Si se añaden nuevas

estructuras de datos o se modifican las ya existentes, los programas de aplicación no se ven afectados

si no dependen directamente de aquello que se ha modificado. Todo esto es gracias a la existencia

del SGBD, que se sitúa entre la base de datos y los programas de aplicación.



-- 14 of 227 --



### CAPÍTULO 1. CONCEPTOS DE BASES DE DATOS 5

En general, un SGBD proporciona los siguientes servicios:

Permite la definición de la base de datos mediante un lenguaje de definición de datos. Este

lenguaje permite especificar la estructura y el tipo de los datos, así como las restricciones

sobre los datos.

Permite la inserción, actualización, eliminación y consulta de datos mediante un lenguaje

de manejo de datos. El hecho de disponer de un lenguaje para realizar consultas reduce el

problema de los sistemas de ficheros, en los que el usuario tiene que trabajar con un conjunto

fijo de consultas, o bien, dispone de un gran número de programas de aplicación costosos de

gestionar.

Hay dos tipos de lenguajes de manejo de datos: los procedurales y los no procedurales. Estos

dos tipos se distinguen por el modo en que acceden a los datos. Los lenguajes procedurales

manipulan la base de datos registro a registro, mientras que los no procedurales operan sobre

conjuntos de registros. En los lenguajes procedurales se especifica qué operaciones se deben

realizar para obtener los datos resultado, mientras que en los lenguajes no procedurales se

especifica qué datos deben obtenerse sin decir cómo hacerlo. El lenguaje no procedural más

utilizado es el SQL (Structured Query Language) que, de hecho, es un estándar y es el lenguaje

de los SGBD relacionales.

Proporciona un acceso controlado a la base de datos mediante:

• Un sistema de seguridad, de modo que los usuarios no autorizados no puedan acceder a

la base de datos.

• Un sistema de integridad que mantiene la integridad y la consistencia de los datos.

• Un sistema de control de concurrencia que permite el acceso compartido a la base de

datos.

• Un sistema de control de recuperación que restablece la base de datos después de que se

produzca un fallo del hardware o del software.

• Un diccionario de datos o catálogo, accesible por el usuario, que contiene la descripción

de los datos de la base de datos.

A diferencia de los sistemas de ficheros, en los que los programas de aplicación trabajan direc-

tamente sobre los ficheros de datos, el SGBD se ocupa de la estructura física de los datos y de su

almacenamiento. Con esta funcionalidad, el SGBD se convierte en una herramienta de gran utili-

dad. Sin embargo, desde el punto de vista del usuario, se podría discutir que los SGBD han hecho

las cosas más complicadas, ya que ahora los usuarios ven más datos de los que realmente quieren



-- 15 of 227 --



6 1.3. PERSONAS EN EL ENTORNO DE LAS BASES DE DATOS

o necesitan, puesto que ven la base de datos completa. Conscientes de este problema, los SGBD

proporcionan un mecanismo de vistas que permite que cada usuario tenga su propia vista o visión

de la base de datos. El lenguaje de definición de datos permite definir vistas como subconjuntos de

la base de datos.

Todos los SGBD no presentan la misma funcionalidad, depende de cada producto. En general,

los grandes SGBD multiusuario ofrecen todas las funciones que se acaban de citar e incluso más.

Los sistemas modernos son conjuntos de programas extremadamente complejos y sofisticados, con

millones de líneas de código y con una documentación consistente en varios volúmenes. Lo que se

pretende es proporcionar un sistema que permita gestionar cualquier tipo de requisitos y que tenga

un 100 % de fiabilidad ante cualquier tipo de fallo. Los SGBD están en continua evolución, tratando

de satisfacer los requisitos de todo tipo de usuarios. Por ejemplo, muchas aplicaciones de hoy en

día necesitan almacenar imágenes, vídeo, sonido, etc. Para satisfacer a este mercado, los SGBD

deben evolucionar. Conforme vaya pasando el tiempo irán surgiendo nuevos requisitos, por lo que

los SGBD nunca permanecerán estáticos.

1.3. Personas en el entorno de las bases de datos

Hay cuatro grupos de personas que intervienen en el entorno de una base de datos: el adminis-

trador de la base de datos, los diseñadores de la base de datos, los programadores de aplicaciones y

los usuarios.

El administrador de la base de datos se encarga de la implementación de la base de datos, realiza

el control de la seguridad y de la concurrencia, mantiene el sistema para que siempre se encuentre

operativo y se encarga de que los usuarios y las aplicaciones obtengan buenas prestaciones. El

administrador debe conocer muy bien el SGBD que se esté utilizando, así como el equipo informático

sobre el que esté funcionando.

Los diseñadores de la base de datos realizan el diseño de la base de datos, debiendo identificar

los datos, las relaciones entre datos y las restricciones sobre los datos y sus relaciones. El diseñador

de la base de datos debe tener un profundo conocimiento de los datos de la empresa y también debe

conocer sus reglas de negocio. Las reglas de negocio describen las características principales sobre

el comportamiento de los datos tal y cómo las ve la empresa. Para obtener un buen resultado, el

diseñador de la base de datos debe implicar en el proceso a todos los usuarios de la base de datos,

tan pronto como sea posible.

Una vez se ha diseñado e implementado la base de datos, los programadores de aplicaciones

se encargan de implementar los programas de aplicación que servirán a los usuarios finales. Estos

programas de aplicación son los que permiten consultar datos, insertarlos, actualizarlos y eliminarlos.

Estos programas se escriben mediante lenguajes de tercera generación o de cuarta generación.



-- 16 of 227 --



### CAPÍTULO 1. CONCEPTOS DE BASES DE DATOS 7

Los usuarios finales son los clientes de la base de datos: la base de datos ha sido diseñada e

implementada, y está siendo mantenida, para satisfacer sus requisitos en la gestión de su información.

1.4. Historia de los sistemas de bases de datos

Los predecesores de los sistemas de bases de datos fueron los sistemas de ficheros. Un sistema

de ficheros está formado por un conjunto de ficheros de datos y los programas de aplicación que

permiten a los usuarios finales trabajar sobre los mismos. No hay un momento concreto en que los

sistemas de ficheros hayan cesado y hayan dado comienzo los sistemas de bases de datos. De hecho,

todavía existen sistemas de ficheros en uso.

Se dice que los sistemas de bases de datos tienen sus raíces en el proyecto estadounidense de

mandar al hombre a la luna en los años sesenta, el proyecto Apolo. En aquella época, no había ningún

sistema que permitiera gestionar la inmensa cantidad de información que requería el proyecto. La

primera empresa encargada del proyecto, NAA (North American Aviation), desarrolló una aplicación

denominada GUAM (General Update Access Method) que estaba basada en el concepto de que varias

piezas pequeñas se unen para formar una pieza más grande, y así sucesivamente hasta que el producto

final está ensamblado. Esta estructura, que tiene la forma de un árbol, es lo que se denomina una

estructura jerárquica. A mediados de los sesenta, IBM se unió a NAA para desarrollar GUAM en lo

que después fue IMS (Information Management System). El motivo por el cual IBM restringió IMS

al manejo de jerarquías de registros fue el de permitir el uso de dispositivos de almacenamiento serie,

más exactamente las cintas magnéticas, ya que era un requisito del mercado por aquella época.

A mitad de los sesenta General Electric desarrolló IDS (Integrated Data Store). Este trabajo

fue dirigido por uno de los pioneros en los sistemas de bases de datos, Charles Bachmann. IDS

era un nuevo tipo de sistema de bases de datos conocido como sistema de red, que produjo un

gran efecto sobre los sistemas de información de aquella generación. El sistema de red se desarrolló,

en parte, para satisfacer la necesidad de representar relaciones entre datos más complejas que las

que se podían modelar con los sistemas jerárquicos, y, en parte, para imponer un estándar de

bases de datos. Para ayudar a establecer dicho estándar, el grupo CODASYL (Conference on Data

Systems Languages), formado por representantes del gobierno de EEUU y representantes del mundo

empresarial, formaron un grupo denominado DBTG (Data Base Task Group), cuyo objetivo era

definir unas especificaciones estándar que permitieran la creación de bases de datos y el manejo de

los datos. El DBTG presentó su informe final en 1971 y aunque éste no fue formalmente aceptado

por ANSI (American National Standards Institute), muchos sistemas se desarrollaron siguiendo

la propuesta del DBTG. Estos sistemas son los que se conocen como sistemas de red, sistemas

CODASYL o DBTG.

Los sistemas jerárquico y de red constituyen la primera generación de los SGBD. Estos sistemas



-- 17 of 227 --



8 1.4. HISTORIA DE LOS SISTEMAS DE BASES DE DATOS

presentan algunos inconvenientes:

Es necesario escribir complejos programas de aplicación para responder a cualquier tipo de

consulta de datos, por simple que ésta sea.

La independencia de datos es mínima.

No tienen un fundamento teórico.

En 1970 Edgar Frank Codd, de los laboratorios de investigación de IBM, escribió un artículo

presentando el modelo relacional. En este artículo presentaba también los inconvenientes de los siste-

mas previos, el jerárquico y el de red. Pasó casi una década hasta que se desarrollaron los primeros

sistemas relacionales. Uno de los primeros es System R, de IBM, que se desarrolló para probar

la funcionalidad del modelo relacional, proporcionando una implementación de sus estructuras de

datos y sus operaciones. Esto condujo a dos grandes desarrollos:

El desarrollo de un lenguaje de consultas estructurado denominado SQL, que se ha convertido

en el lenguaje estándar de los sistemas relacionales.

La producción de varios SGBD relacionales durante los años ochenta, como DB2 y SLQ/DS

de IBM, y Oracle de Oracle Corporation.

Hoy en día, existen cientos de SGBD relacionales, tanto para microordenadores como para sistemas

multiusuario, aunque muchos no son completamente fieles al modelo relacional.

Los SGBD relacionales constituyen la segunda generación de los SGBD. Sin embargo, el modelo

relacional también tiene sus debilidades, siendo una de ellas su limitada capacidad al modelar los

datos. Se ha hecho mucha investigación desde entonces tratando de resolver este problema. En 1976,

Peter Chen presentó el modelo entidad–relación, que es la técnica más utilizada en el diseño de bases

de datos. En 1979, Codd intentó subsanar algunas de las deficiencias de su modelo relacional con

una versión extendida denominada RM/T (1979) y más recientemente RM/V2 (1990). Los intentos

de proporcionar un modelo de datos que represente al mundo real de un modo más fiel han dado

lugar a los modelos de datos semánticos.

La evolución reciente de la tecnología de bases de datos viene marcada por el afianzamiento

de las bases de datos orientadas a objetos, la extensión de las bases de datos relacionales y el

procesamiento distribuido. Esta evolución representa la tercera generación de los SGBD.

Por su parte, los sistemas de gestión de bases de datos relacionales han ido evolucionando estos

últimos años para soportar objetos y reglas, y para ampliar el lenguaje SQL y hacerlo más extensible

y computacionalmente completo, dando lugar a lo que se conocen como sistemas objeto–relacionales.



-- 18 of 227 --



### CAPÍTULO 1. CONCEPTOS DE BASES DE DATOS 9

Durante la última década, el impacto de los avances en la tecnología de las comunicaciones ha

sido muy importante. Esto ha contribuido a que en las empresas se haya producido una mayor

distribución de la gestión automática de la información, en contraste con la filosofía centralizadora

predominante en la tecnología inicial de bases de datos. Las bases de datos distribuidas posibilitan

el proceso de datos pertenecientes a distintas bases de datos conectadas entre sí. El emplazamiento

lógico de cada una de las bases de datos se denomina nodo, conteniendo cada uno su sistema de

gestión de bases de datos, junto con las utilidades y facilidades propias del soporte distribuido.

Los nodos, por lo general, están ubicados en emplazamientos físicos distantes geográficamente, y se

encuentran conectados por una red de comunicación de datos.

Por otra parte, los sistemas de bases de datos activas han sido propuestos como otro paradigma de

gestión de datos que satisface las necesidades de aquellas aplicaciones que requieren una respuesta

puntual a situaciones críticas. Como ejemplos se pueden citar el control del tráfico aéreo o las

aplicaciones de control de plantas industriales. Este paradigma también puede ser utilizado para

soportar varias de las funciones del propio sistema de gestión de bases de datos, como son el control

de accesos, el control de la integridad, el mantenimiento de vistas o el mantenimiento de atributos

derivados. El factor común en todas estas aplicaciones es la necesidad de responder a sucesos, tanto

externos como internos al propio sistema. A diferencia de los sistemas pasivos, un sistema de gestión

de bases de datos activas responde automáticamente ante determinadas circunstancias descritas por

el diseñador. La mayoría de los sistemas de gestión de bases de datos comerciales incorporan la

posibilidad de definir reglas, por lo que son, en cierto modo, sistemas activos.

Las investigaciones sobre la relación entre la teoría de las bases de datos y la lógica se remontan

a finales de la década de los setenta. Estas investigaciones han dado lugar a las bases de datos

deductivas, que permiten derivar nuevas informaciones a partir de las introducidas explícitamente

por el usuario. Esta función deductiva se realiza mediante la adecuada explotación de ciertas reglas

de conocimiento relativas al dominio de la aplicación, utilizando para ello técnicas de programación

lógica y de inteligencia artificial.

Los sistemas de múltiples bases de datos permiten realizar operaciones que implican a varios

sistemas de bases de datos, cada uno de los cuales puede ser centralizado o distribuido. Cada

sistema de bases de datos que participa es denominado componente. Si todos los sistemas de gestión

de bases de datos de los diferentes componentes son iguales, el sistema de múltiples bases de datos

es homogéneo; en caso contrario, es heterogéneo. Un sistema de múltiples bases de datos es un

sistema federado de bases de datos si permite una doble gestión: una de carácter global, realizada

por el sistema de gestión de bases de datos federadas y otra en modo autónomo e independiente del

sistema federado, por parte de los sistemas componentes.

La influencia de la Web lo abarca todo. En su desarrollo se han ignorado las técnicas de bases de



-- 19 of 227 --



10 1.5. VENTAJAS E INCONVENIENTES

datos, por lo que se han repetido los errores cometidos en las primeras generaciones de los sistemas

de gestión de bases de datos. La Web se puede ver como una nueva interfaz de acceso a bases de

datos y muchos sistemas de gestión de bases de datos ya proporcionan almacenamiento y acceso

a datos a través de XML. Pero la Web puede también ser considerada como una inmensa base de

datos, siendo éste un tema de investigación en pleno auge.

Por otra parte, los grandes almacenes de datos (data warehouses) ya han demostrado que si

son implementados convenientemente, pueden ser de gran ayuda en la toma de decisiones y en

el procesamiento analítico en tiempo real OLAP (On-Line Analytical Processing). Los datos son

extraídos periódicamente de otras fuentes y son integrados en el almacén. Estos datos, relevantes

para la empresa, son no volátiles y se agrupan según diversas granularidades en el tiempo y en otras

dimensiones. En la actualidad, existe una gran competencia entre las extensiones de los sistemas de

gestión de bases de datos comerciales para incorporar las características de este tipo de sistemas, y

la creación de productos específicos.

La explotación de datos (data mining o knowledge discovery in databases) trata de descubrir

conocimientos útiles y previamente no conocidos a partir de grandes volúmenes de datos, por lo que

no sólo integra técnicas de bases de datos, sino también de la estadística y de la inteligencia artifi-

cial. Las investigaciones se han plasmado rápidamente en productos comerciales, con un desarrollo

reciente bastante importante.

Existen también muchos trabajos de investigación en temas tales como las bases de datos tem-

porales y las bases de datos multimedia. Las bases de datos temporales intentan, en primer lugar,

definir un modelo de datos que capture la semántica del tiempo en el mundo real, y, en segundo

lugar, realizar una implementación eficiente de tal modelo. Los recientes avances en el almacena-

miento de distintos tipos de información, como voz, imágenes o sonido, han tenido su influencia en

las bases de datos dando lugar a las bases de datos multimedia.

La rápida evolución que la tecnología de bases de datos ha experimentado en la última década,

así como la variedad de nuevos caminos abiertos, han conducido a investigadores y asociaciones

interesadas, a reflexionar sobre el futuro de esta tecnología. Estas reflexiones quedan recogidas en

numerosos debates y manifiestos que intentan poner orden en un campo en continua expansión.

1.5. Ventajas e inconvenientes de los sistemas de bases de datos

Los sistemas de bases de datos presentan numerosas ventajas que se pueden dividir en dos grupos:

las que se deben a la integración de datos y las que se deben a la interfaz común que proporciona

el SGBD.



-- 20 of 227 --



### CAPÍTULO 1. CONCEPTOS DE BASES DE DATOS 11

1.5.1. Ventajas por la integración de datos

Control sobre la redundancia de datos. Los sistemas de ficheros almacenan varias copias de los

mismos datos en ficheros distintos. Esto hace que se desperdicie espacio de almacenamiento,

además de provocar la falta de consistencia de datos (copias que no coinciden). En los sistemas

de bases de datos todos estos ficheros están integrados, por lo que no se almacenan varias copias

de los mismos datos. Sin embargo, en una base de datos no se puede eliminar la redundancia

completamente, ya que en ocasiones es necesaria para modelar las relaciones entre los datos,

o bien es necesaria para mejorar las prestaciones.

Consistencia de datos. Eliminando o controlando las redundancias de datos se reduce en gran

medida el riesgo de que haya inconsistencias. Si un dato está almacenado una sola vez, cual-

quier actualización se debe realizar sólo una vez, y está disponible para todos los usuarios

inmediatamente. Si un dato está duplicado y el sistema conoce esta redundancia, el propio

sistema puede encargarse de garantizar que todas las copias se mantienen consistentes. Des-

graciadamente, no todos los SGBD de hoy en día se encargan de mantener automáticamente

la consistencia.

Más información sobre la misma cantidad de datos. Al estar todos los datos integrados, se

puede extraer información adicional sobre los mismos.

Compartición de datos. En los sistemas de ficheros, los ficheros pertenecen a las personas o a

los departamentos que los utilizan. Pero en los sistemas de bases de datos, la base de datos

pertenece a la empresa y puede ser compartida por todos los usuarios que estén autorizados.

Además, las nuevas aplicaciones que se vayan creando pueden utilizar los datos de la base de

datos existente.

Mantenimiento de estándares. Gracias a la integración es más fácil respetar los estándares

necesarios, tanto los establecidos a nivel de la empresa como los nacionales e internacionales.

Estos estándares pueden establecerse sobre el formato de los datos para facilitar su intercambio,

pueden ser estándares de documentación, procedimientos de actualización y también reglas de

acceso.

1.5.2. Ventajas por la existencia del SGBD

Mejora en la integridad de datos. La integridad de la base de datos se refiere a la validez de

los datos almacenados. Normalmente, la integridad se expresa mediante restricciones o reglas

que no se pueden violar. Estas restricciones se pueden aplicar tanto a los datos, como a sus

relaciones, y es el SGBD quien se debe encargar de mantenerlas.



-- 21 of 227 --



12 1.5. VENTAJAS E INCONVENIENTES

Mejora en la seguridad. La seguridad de la base de datos es la protección de la base de datos

frente a usuarios no autorizados. Sin unas buenas medidas de seguridad, la integración de datos

en los sistemas de bases de datos hace que éstos sean más vulnerables que en los sistemas de

ficheros. Sin embargo, los SGBD permiten mantener la seguridad mediante el establecimiento

de claves para identificar al personal autorizado a utilizar la base de datos. Las autorizaciones

se pueden realizar a nivel de operaciones, de modo que un usuario puede estar autorizado a

consultar ciertos datos pero no a actualizarlos, por ejemplo.

Mejora en la accesibilidad a los datos. Muchos SGBD proporcionan lenguajes de consultas o

generadores de informes que permiten al usuario hacer cualquier tipo de consulta sobre los

datos, sin que sea necesario que un programador escriba una aplicación que realice tal tarea.

Mejora en la productividad. El SGBD proporciona muchas de las funciones estándar que el

programador necesita escribir en un sistema de ficheros. A nivel básico, el SGBD proporciona

todas las rutinas de manejo de ficheros típicas de los programas de aplicación. El hecho de

disponer de estas funciones permite al programador centrarse mejor en la función específica

requerida por los usuarios, sin tener que preocuparse de los detalles de implementación de bajo

nivel. Muchos SGBD también proporcionan un entorno de cuarta generación consistente en

un conjunto de herramientas que simplifican, en gran medida, el desarrollo de las aplicaciones

que acceden a la base de datos. Gracias a estas herramientas, el programador puede ofrecer

una mayor productividad en un tiempo menor.

Mejora en el mantenimiento gracias a la independencia de datos. En los sistemas de ficheros,

las descripciones de los datos se encuentran inmersas en los programas de aplicación que

los manejan. Esto hace que los programas sean dependientes de los datos, de modo que un

cambio en su estructura, o un cambio en el modo en que se almacena en disco, requiere cambios

importantes en los programas cuyos datos se ven afectados. Sin embargo, los SGBD separan

las descripciones de los datos de las aplicaciones. Esto es lo que se conoce como independencia

de datos, gracias a la cual se simplifica el mantenimiento de las aplicaciones que acceden a la

base de datos.

Aumento de la concurrencia. En algunos sistemas de ficheros, si hay varios usuarios que pueden

acceder simultáneamente a un mismo fichero, es posible que el acceso interfiera entre ellos de

modo que se pierda información o, incluso, que se pierda la integridad. La mayoría de los SGBD

gestionan el acceso concurrente a la base de datos y garantizan que no ocurran problemas de

este tipo.

Mejora en los servicios de copias de seguridad y de recuperación ante fallos. Muchos sistemas



-- 22 of 227 --



### CAPÍTULO 1. CONCEPTOS DE BASES DE DATOS 13

de ficheros dejan que sea el usuario quien proporcione las medidas necesarias para proteger los

datos ante fallos en el sistema o en las aplicaciones. Los usuarios tienen que hacer copias de

seguridad cada día, y si se produce algún fallo, utilizar estas copias para restaurarlos. En este

caso, todo el trabajo realizado sobre los datos desde que se hizo la última copia de seguridad

se pierde y se tiene que volver a realizar. Sin embargo, los SGBD actuales funcionan de modo

que se minimiza la cantidad de trabajo perdido cuando se produce un fallo.

1.5.3. Desventajas de los sistemas de bases de datos

Complejidad. Los SGBD son conjuntos de programas muy complejos con una gran funciona-

lidad. Es preciso comprender muy bien esta funcionalidad para poder sacar un buen partido

de ellos.

Tamaño. Los SGBD son programas complejos y muy extensos que requieren una gran cantidad

de espacio en disco y de memoria para trabajar de forma eficiente.

Coste económico del SGBD. El coste de un SGBD varía dependiendo del entorno y de la

funcionalidad que ofrece. Por ejemplo, un SGBD para un ordenador personal puede costar

500 e, mientras que un SGBD para un sistema multiusuario que dé servicio a cientos de

usuarios puede costar entre 10.000 y 100.000 e. Además, hay que pagar una cuota anual de

mantenimiento que suele ser un porcentaje del precio del SGBD. Sin embargo, en los últimos

años han surgido SGBD libres (open source) que no tienen nada que envidiar a muchos SGBD

comerciales.

Coste del equipamiento adicional. Tanto el SGBD, como la propia base de datos, pueden

hacer que sea necesario adquirir más espacio de almacenamiento. Además, para alcanzar las

prestaciones deseadas, es posible que sea necesario adquirir una máquina más grande o una

máquina que se dedique solamente al SGBD. Todo esto hará que la implantación de un sistema

de bases de datos sea más cara.

Coste de la conversión. En algunas ocasiones, el coste del SGBD y el coste del equipo infor-

mático que sea necesario adquirir para su buen funcionamiento, es insignificante comparado

al coste de convertir la aplicación actual en un sistema de bases de datos. Este coste incluye el

coste de enseñar a la plantilla a utilizar estos sistemas y, probablemente, el coste del personal

especializado para ayudar a realizar la conversión y poner en marcha el sistema. Este coste

es una de las razones principales por las que algunas empresas y organizaciones se resisten a

cambiar su sistema actual de ficheros por un sistema de bases de datos.



-- 23 of 227 --



14 1.5. VENTAJAS E INCONVENIENTES

Prestaciones. Un sistema de ficheros está escrito para una aplicación específica, por lo que

sus prestaciones suelen ser muy buenas. Sin embargo, los SGBD están escritos para ser más

generales y ser útiles en muchas aplicaciones, lo que puede hacer que algunas de ellas no sean

tan rápidas como antes.

Vulnerable a los fallos. El hecho de que todo esté centralizado en el SGBD hace que el sistema

sea más vulnerable ante los fallos que puedan producirse.



-- 24 of 227 --



### Capítulo 2

Modelo relacional

### Introducción y objetivos

En este capítulo se presentan los principios básicos del modelo relacional, que es el modelo de

datos en el que se basan la mayoría de los SGBD en uso hoy en día. En primer lugar se presenta la

estructura de datos relacional y a continuación las reglas de integridad que deben cumplirse sobre

la misma.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Definir qué es un modelo de datos y describir cómo se clasifican los modelos de datos.

Definir los distintos modelos lógicos de bases de datos.

Definir la estructura de datos relacional y todas sus partes.

Enumerar las propiedades de las relaciones.

Definir los tipos de relaciones.

Definir superclave, clave candidata, clave primaria. y clave ajena

Definir el concepto de nulo.

Definir la regla de integridad de entidades y la regla de integridad referencial.

Definir qué es una regla de negocio.

Dar un ejemplo completo de una base de datos formada por, al menos, dos relaciones con

claves ajenas.

15



-- 25 of 227 --



16 2.1. MODELOS DE DATOS

2.1. Modelos de datos

Una de las características fundamentales de los sistemas de bases de datos es que proporcionan

cierto nivel de abstracción de datos, al ocultar las características sobre el almacenamiento físico

que la mayoría de usuarios no necesita conocer. Los modelos de datos son el instrumento principal

para ofrecer dicha abstracción. Un modelo de datos es un conjunto de conceptos que sirven para

describir la estructura de una base de datos, es decir, los datos, las relaciones entre los datos y

las restricciones que deben cumplirse sobre los datos. Los modelos de datos contienen también un

conjunto de operaciones básicas para la realización de consultas (lecturas) y actualizaciones de datos.

Además, los modelos de datos más modernos incluyen mecanismos para especificar comportamiento

ante las acciones que se realizan sobre la base de datos.

Los modelos de datos se pueden clasificar dependiendo de los tipos de conceptos que ofrecen para

describir la estructura de la base de datos. Los modelos de datos de alto nivel, o modelos conceptuales,

disponen de conceptos muy cercanos al modo en que la mayoría de los usuarios percibe los datos,

mientras que los modelos de datos de bajo nivel, o modelos físicos, proporcionan conceptos que

describen los detalles de cómo se almacenan los datos en el ordenador. Los conceptos de los modelos

físicos están dirigidos al personal informático, no a los usuarios finales. Entre estos dos extremos

se encuentran los modelos lógicos, cuyos conceptos pueden ser entendidos por los usuarios finales,

aunque no están demasiado alejados de la forma en que los datos se organizan físicamente. Los

modelos lógicos ocultan algunos detalles de cómo se almacenan los datos, pero pueden implementarse

de manera directa en un ordenador.

Los modelos conceptuales utilizan conceptos como entidades, atributos y relaciones. Una entidad

representa un objeto o concepto del mundo real como, por ejemplo, un empleado de una empresa o

una de sus oficinas. Un atributo representa alguna propiedad de interés de una entidad como, por

ejemplo, el nombre o el salario del empleado. Una relación describe una interacción entre dos o más

entidades, por ejemplo, la relación que hay entre un empleado y la oficina donde trabaja.

Cada SGBD soporta un modelo lógico, siendo los más comunes el relacional, el de red y el

jerárquico. Estos modelos representan los datos valiéndose de estructuras de registros, por lo que

también se denominan modelos orientados a registros. Hay una nueva familia de modelos lógicos,

son los modelos orientados a objetos, que están más próximos a los modelos conceptuales.

Los modelos físicos describen cómo se almacenan los datos en el ordenador: el formato de los

registros, la estructura de los ficheros (desordenados, ordenados, etc.) y los métodos de acceso

utilizados (índices, etc.).

A la descripción de una base de datos mediante un modelo de datos se le denomina esquema de

la base de datos. Este esquema se especifica durante el diseño, y no es de esperar que se modifique



-- 26 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 17

a menudo. Sin embargo, los datos que se almacenan en la base de datos pueden cambiar con mucha

frecuencia: se insertan datos, se actualizan, etc. Los datos que la base de datos contiene en un

determinado momento se denominan estado de la base de datos u ocurrencia de la base de datos.

La distinción entre el esquema y el estado de la base de datos es muy importante. Cuando

definimos una nueva base de datos, sólo especificamos su esquema al SGBD. En ese momento, el

estado de la base de datos es el estado vacío, sin datos. Cuando se cargan datos por primera vez,

la base datos pasa al estado inicial. De ahí en adelante, siempre que se realice una operación de

actualización de la base de datos, se tendrá un nuevo estado. El SGBD se encarga, en parte, de

garantizar que todos los estados de la base de datos sean estados válidos que satisfagan la estructura

y las restricciones especificadas en el esquema. Por lo tanto, es muy importante que el esquema que

se especifique al SGBD sea correcto y se debe tener muchísimo cuidado al diseñarlo. El SGBD

almacena el esquema en su catálogo o diccionario de datos, de modo que se pueda consultar siempre

que sea necesario.

En 1970, el modo en que se veían las bases de datos cambió por completo cuando E.F. Codd

introdujo el modelo relacional. En aquellos momentos, el enfoque existente para la estructura de las

bases de datos utilizaba punteros físicos (direcciones de disco) para relacionar registros de distintos

ficheros. Si, por ejemplo, se quería relacionar un registro A con un registro B, se debía añadir al

registro A un campo conteniendo la dirección en disco del registro B. Este campo añadido, un

puntero físico, siempre señalaría desde el registro A al registro B. Codd demostró que estas bases

de datos limitaban en gran medida los tipos de operaciones que los usuarios podían realizar sobre

los datos. Además, estas bases de datos eran muy vulnerables a cambios en el entorno físico. Si se

añadían los controladores de un nuevo disco al sistema y los datos se movían de una localización física

a otra, se requería una conversión de los ficheros de datos. Estos sistemas se basaban en el modelo

de red y el modelo jerárquico, los dos modelos lógicos que constituyeron la primera generación de

los SGBD.

El modelo relacional representa la segunda generación de los SGBD. En él, todos los datos están

estructurados a nivel lógico como tablas formadas por filas y columnas, aunque a nivel físico pueden

tener una estructura completamente distinta. Un punto fuerte del modelo relacional es la sencillez

de su estructura lógica. Pero detrás de esa simple estructura hay un fundamento teórico importante

del que carecen los SGBD de la primera generación, lo que constituye otro punto a su favor.

Dada la popularidad del modelo relacional, muchos sistemas de la primera generación se han

modificado para proporcionar una interfaz de usuario relacional, con independencia del modelo

lógico que soportan (de red o jerárquico). Por ejemplo, el sistema de red IDMS ha evolucionado a

IDMS/R e IDMS/SQL, ofreciendo una visión relacional de los datos.

En los últimos años, se han propuesto algunas extensiones al modelo relacional para capturar



-- 27 of 227 --



18 2.2. ESTRUCTURA DE DATOS RELACIONAL

mejor el significado de los datos, para disponer de los conceptos de la orientación a objetos y para

disponer de capacidad deductiva.

El modelo relacional, como todo modelo de datos, tiene que ver con tres aspectos de los datos,

que son los que se presentan en los siguientes apartados de este capítulo: qué características tiene

la estructura de datos, cómo mantener la integridad de los datos y cómo realizar el manejo de los

mismos.

2.2. Estructura de datos relacional

La estructura de datos del modelo relacional es la relación. En este apartado se presenta esta

estructura de datos, sus propiedades, los tipos de relaciones y qué es una clave de una relación. Para

facilitar la comprensión de las definiciones formales de todos estos conceptos, se dan antes unas

definiciones informales que permiten asimilar dichos conceptos a otros que resulten familiares.

2.2.1. Relaciones

Definiciones informales

El modelo relacional se basa en el concepto matemático de relación, que gráficamente se represen-

ta mediante una tabla. Codd, que era un experto matemático, utilizó una terminología perteneciente

a las matemáticas, en concreto de la teoría de conjuntos y de la lógica de predicados.

Una relación es una tabla con columnas y filas. Un SGBD sólo necesita que el usuario pueda

percibir la base de datos como un conjunto de tablas. Esta percepción sólo se aplica a la estructura

lógica de la base de datos, no se aplica a la estructura física de la base de datos, que se puede

implementar con distintas estructuras de almacenamiento.

Un atributo es el nombre de una columna de una relación. En el modelo relacional, las relaciones

se utilizan para almacenar información sobre los objetos que se representan en la base de datos. Una

relación se representa gráficamente como una tabla bidimensional en la que las filas corresponden a

registros individuales y las columnas corresponden a los campos o atributos de esos registros. Los

atributos pueden aparecer en la relación en cualquier orden.

Por ejemplo, la información de los clientes de una empresa determinada se representa mediante

la relación CLIENTES de la figura 2.1, que tiene columnas para los atributos codcli (código del

cliente), nombre (nombre y apellidos del cliente), dirección (calle y número donde se ubica el

cliente), codpostal (código postal correspondiente a la dirección del cliente) y codpue (código de

la población del cliente). La información sobre las poblaciones se representa mediante la relación

PUEBLOS de la misma figura, que tiene columnas para los atributos codpue (código de la población),

nombre (nombre de la población) y codpro (código de la provincia en que se encuentra la población).



-- 28 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 19

## CLIENTES

codcli nombre dirección codpostal codpro

333 Sos Carretero, Jesús Mosen Compte, 14 12964 53596

336 Miguel Archiles, Ramon Hisant Bernardo Mundina, 132-5 12652 07766

342 Pinel Huerta, Vicente Francisco Sempere, 37-10 12112 07766

345 López Botella, Mauro Avenida del Puerto, 20-1 12439 12309

348 Palau Martínez, Jorge Raval de Sant Josep, 97-2 12401 12309

354 Murría Vinaiza, José Ciudadela, 90-18 12990 12309

357 Huguet Peris, Juan Angel Calle Mestre Rodrigo, 7 12930 12309

## PUEBLOS

codpue nombre codpro

07766 Burriana 12

12309 Castellón 12

17859 Enramona 12

46332 Soneja 12

53596 Villarreal 12

Figura 2.1: Relaciones que almacenan los datos de los clientes y sus poblaciones.

Atributo Nombre del Dominio Descripción Definición

codcli codli_dom Posibles códigos de cliente número hasta 5 dígitos

nombre nombre_dom Nombres de personas: apellido1 apellido2, nombre 50 caracteres

dirección dirección_dom Domicilios de España: calle, número 50 caracteres

codpostal codpostal_dom Códigos postales de España 5 caracteres

codpue codpue_dom Códigos de las poblaciones de España 5 caracteres

Figura 2.2: Dominios de los atributos de la relación que almacena los datos de los clientes.

Un dominio es el conjunto de valores legales de uno o varios atributos. Los dominios constituyen

una poderosa característica del modelo relacional. Cada atributo de una base de datos relacional

se define sobre un dominio, pudiendo haber varios atributos definidos sobre el mismo dominio. La

figura 2.2 muestra los dominios de los atributos de la relación CLIENTES.

El concepto de dominio es importante porque permite que el usuario defina, en un lugar común,

el significado y la fuente de los valores que los atributos pueden tomar. Esto hace que haya más

información disponible para el sistema cuando éste va a ejecutar una operación relacional, de modo

que las operaciones que son semánticamente incorrectas, se pueden evitar. Por ejemplo, no tiene

sentido comparar el nombre de una calle con un número de teléfono, aunque los dos atributos

sean cadenas de caracteres. Sin embargo, el importe mensual del alquiler de un inmueble no estará

definido sobre el mismo dominio que el número de meses que dura el alquiler, pero sí tiene sentido

multiplicar los valores de ambos dominios para averiguar el importe total al que asciende el alquiler.

Los SGBD relacionales no ofrecen un soporte completo de los dominios ya que su implementación

es extremadamente compleja.



-- 29 of 227 --



20 2.2. ESTRUCTURA DE DATOS RELACIONAL

Una tupla es una fila de una relación. Los elementos de una relación son las tuplas o filas de la

tabla. En la relación CLIENTES, cada tupla tiene cinco valores, uno para cada atributo. Las tuplas

de una relación no siguen ningún orden.

El grado de una relación es el número de atributos que contiene. La relación CLIENTES es de

grado cinco porque tiene cinco atributos. Esto quiere decir que cada fila de la tabla es una tupla

con cinco valores. El grado de una relación no cambia con frecuencia.

La cardinalidad de una relación es el número de tuplas que contiene. Ya que en las relaciones se

van insertando y borrando tuplas a menudo, la cardinalidad de las mismas varía constantemente.

Una base de datos relacional es un conjunto de relaciones normalizadas. Una relación está nor-

malizada si en la intersección de cada fila con cada columna hay un solo valor.

Definiciones formales

Una relación R definida sobre un conjunto de dominios D1, D2, . . . , Dn consta de:

Cabecera: conjunto fijo de pares atributo:dominio

{(A1 : D1), (A2 : D2), . . . (An : Dn)}

donde cada atributo Aj corresponde a un único dominio Dj y todos los Aj son distintos, es

decir, no hay dos atributos que se llamen igual. El grado de la relación R es n.

Cuerpo: conjunto variable de tuplas. Cada tupla es un conjunto de pares atributo:valor :

{(A1 : vi1), (A2 : vi2), . . . (An : vin)}

con i = 1, 2, . . . m, donde m es la cardinalidad de la relación R. En cada par (Aj : vij ) se tiene

que vij ∈ Dj .

La relación CLIENTES de la figura 2.1 tiene la siguiente cabecera:

{ (codcli:codcli_dom), (nombre:nombre_dom), (dirección:dirección_dom),

(codpostal:codpostal_dom), (codpue:codpue_dom) }

Siendo la siguiente una de sus tuplas:

{ (codcli:333), (nombre:Sos Carretero, Jesús), (dirección:Mosen Compte, 14),

(codpostal:12964), (codpue:53596) }

Este conjunto de pares no está ordenado, por lo que esta tupla y la siguiente, son la misma:



-- 30 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 21

{ (nombre:Sos Carretero, Jesús), (codpostal:12964),

(codcli:333), (dirección:Mosen Compte, 14), (codpue:53596) }

Las relaciones se suelen representar gráficamente mediante tablas. Los nombres de las columnas

corresponden a los nombres de los atributos y las filas son cada una de las tuplas de la relación. Los

valores que aparecen en cada una de las columnas pertenecen al conjunto de valores del dominio

sobre el que está definido el atributo correspondiente.

2.2.2. Propiedades de las relaciones

Las relaciones tienen las siguientes características:

Cada relación tiene un nombre y éste es distinto del nombre de todas las demás.

Los valores de los atributos son atómicos: en cada tupla, cada atributo toma un solo valor. Se

dice que las relaciones están normalizadas.

No hay dos atributos que se llamen igual.

El orden de los atributos no importa: los atributos no están ordenados.

Cada tupla es distinta de las demás: no hay tuplas duplicadas.

El orden de las tuplas no importa: las tuplas no están ordenadas.

2.2.3. Tipos de relaciones

En un SGBD relacional pueden existir varios tipos de relaciones, aunque no todos manejan todos

los tipos.

Relaciones base. Son relaciones reales que tienen nombre y forman parte directa de la base de

datos almacenada, se dice que son autónomas.

Vistas. También denominadas relaciones virtuales, son relaciones con nombre y derivadas (no

autónomas): se representan mediante su definición en términos de otras relaciones con nombre,

no poseen datos almacenados propios.

Instantáneas. Son relaciones con nombre y derivadas. Pero a diferencia de las vistas, son reales,

no virtuales: están representadas no sólo por su definición en términos de otras relaciones con

nombre, sino también por sus propios datos almacenados. Son relaciones de sólo de lectura y

se refrescan periódicamente.



-- 31 of 227 --



22 2.2. ESTRUCTURA DE DATOS RELACIONAL

Resultados de consultas. Son las relaciones resultantes de alguna consulta especificada. Pueden

tener nombre y no persisten en la base de datos.

Resultados intermedios. Son las relaciones que contienen los resultados de las subconsultas.

Normalmente no tienen nombre y tampoco persisten en la base de datos.

Resultados temporales. Son relaciones con nombre, similares a las relaciones base o a las instan-

táneas, pero la diferencia es que se destruyen automáticamente en algún momento apropiado.

2.2.4. Claves

Ya que en una relación no hay tuplas repetidas, éstas se pueden distinguir unas de otras, es

decir, se pueden identificar de modo único. La forma de identificarlas es mediante los valores de sus

atributos. Se denomina superclave a un atributo o conjunto de atributos que identifican de modo

único las tuplas de una relación. Se denomina clave candidata a una superclave en la que ninguno

de sus subconjuntos es una superclave de la relación. El atributo o conjunto de atributos K de la

relación R es una clave candidata para R si y sólo si satisface las siguientes propiedades:

Unicidad: nunca hay dos tuplas en la relación R con el mismo valor de K.

Irreducibilidad (minimalidad): ningún subconjunto de K tiene la propiedad de unicidad, es

decir, no se pueden eliminar componentes de K sin destruir la unicidad.

Cuando una clave candidata está formada por más de un atributo, se dice que es una clave

compuesta. Una relación puede tener varias claves candidatas. Por ejemplo, en la relación PUEBLOS

de la figura 2.1, el atributo nombre no es una clave candidata ya que hay pueblos en España con el

mismo nombre que se encuentran en distintas provincias. Sin embargo se ha asignado un código único

a cada población, por lo que el atributo codpue sí es una clave candidata de la relación PUEBLOS.

También es una clave candidata de esta relación la pareja formada por los atributos nombre y

codpro, ya que no hay dos poblaciones en la misma provincia que tengan el mismo nombre.

Para identificar las claves candidatas de una relación no hay que fijarse en un estado o instancia

de la base de datos. El hecho de que en un momento dado no haya duplicados para un atributo o

conjunto de atributos, no garantiza que los duplicados no sean posibles. Sin embargo, la presencia

de duplicados en un estado de la base de datos sí es útil para demostrar que cierta combinación de

atributos no es una clave candidata. El único modo de identificar las claves candidatas es conociendo

el significado real de los atributos, ya que esto permite saber si es posible que aparezcan duplicados.

Sólo usando esta información semántica se puede saber con certeza si un conjunto de atributos

forman una clave candidata. Por ejemplo, viendo la instancia anterior de la relación CLIENTES se

podría pensar que el atributo nombre es una clave candidata. Pero ya que este atributo es el nombre



-- 32 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 23

de un cliente y es posible que haya dos clientes con el mismo nombre, el atributo no es una clave

candidata.

Se denomina clave primaria de una relación a aquella clave candidata que se escoge para iden-

tificar sus tuplas de modo único. Ya que una relación no tiene tuplas duplicadas, siempre hay una

clave candidata y, por lo tanto, la relación siempre tiene clave primaria. En el peor caso, la clave

primaria estará formada por todos los atributos de la relación, pero normalmente habrá un pequeño

subconjunto de los atributos que haga esta función.

Las claves candidatas que no son escogidas como clave primaria son denominadas claves alter-

nativas. Por ejemplo, la clave primaria de la relación PUEBLOS es el atributo codpue, siendo la pareja

formada por nombre y codpro otra clave alternativa. En la relación CLIENTES sólo hay una clave

candidata que es el atributo codcli, por lo que esta clave candidata es la clave primaria.

Una clave ajena es un atributo o un conjunto de atributos de una relación cuyos valores coinciden

con los valores de la clave primaria de alguna otra relación (puede ser la misma). Las claves ajenas

representan relaciones entre datos. El atributo codpue de CLIENTES relaciona a cada cliente con su

población. Este atributo es una clave ajena cuyos valores hacen referencia al atributo codpue, clave

primaria de PUEBLOS. Se dice que un valor de clave ajena representa una referencia a la tupla que

contiene el mismo valor en su clave primaria (tupla referenciada).

2.3. Esquema de una base de datos relacional

Una base de datos relacional es un conjunto de relaciones. Para representar el esquema de una

base de datos relacional se debe dar el nombre de sus relaciones, los atributos de éstas, los dominios

sobre los que se definen estos atributos, las claves primarias y las claves ajenas.

El esquema de la base de datos de la empresa con la que trabajaremos en este libro es el siguiente:

CLIENTES (codcli, nombre, dirección, codpostal, codpue)

VENDEDORES (codven, nombre, dirección, codpostal, codpue, codjefe)

PUEBLOS (codpue, nombre, codpro)

PROVINCIAS (codpro, nombre)

ARTÍCULOS (codart, descrip, precio, stock, stock_min, dto)

FACTURAS (codfac, fecha, codcli, codven, iva, dto)

LÍNEAS_FAC (codfac, línea, cant, codart, precio, dto)

En el esquema anterior, los nombres de las relaciones aparecen seguidos de los nombres de los

atributos encerrados entre paréntesis. Las claves primarias son los atributos subrayados. Las claves

ajenas se representan mediante los siguientes diagramas referenciales:



-- 33 of 227 --



24 2.3. ESQUEMA DE UNA BASE DE DATOS RELACIONAL

CLIENTES codpue

−→ PUEBLOS : Población del cliente.

VENDEDORES codpue

−→ PUEBLOS : Población del vendedor.

VENDEDORES codjefe

−→ VENDEDORES : Jefe del vendedor.

PUEBLOS codpro

−→ PROVINCIAS : Provincia en la que se encuentra la población.

FACTURAS codcli

−→ CLIENTES : Cliente al que pertenece la factura.

FACTURAS codven

−→ VENDEDORES : Vendedor que ha realizado la venta.

LÍNEAS_FAC codfac

−→ FACTURAS : Factura en la que se encuentra la línea.

LÍNEAS_FAC codart

−→ ARTÍCULOS : Artículo que se compra en la línea de factura.

La tabla PROVINCIAS almacena información sobre las provincias de España. De cada provincia

se almacena su nombre (nombre) y un código que la identifica (codpro). La tabla PUEBLOS contiene

los nombres (nombre) de los pueblos de de España. Cada pueblo se identifica por un código que

es único (codpue) y tiene una referencia a la provincia a la que pertenece (codpro). La tabla

CLIENTES contiene los datos de los clientes: código que identifica a cada uno (codcli), nombre

y apellidos (nombre), calle y número (dirección), código postal (codpostal) y una referencia a

su población (codpue). La tabla VENDEDORES contiene los datos de los vendedores de la empresa:

código que identifica a cada uno (codven), nombre y apellidos (nombre), calle y número (dirección),

código postal (codpostal), una referencia a su población (codpue) y una referencia al vendedor del

que depende (codjefe), si es el caso. En la tabla ARTÍCULOS se tiene el código que identifica a

cada artículo (codart), su descripción (descrip), el precio de venta actual (precio), el número de

unidades del artículo que hay en el almacén (stock), la cantidad mínima que se desea mantener

almacenada (stock_min) y, si el artículo está en oferta, el descuento (dto) que se debe aplicar

cuando se venda. La tabla FACTURAS contiene las cabeceras de las facturas correspondientes a las

compras realizadas por los clientes. Cada factura tiene un código único (codfac), la fecha en que se

ha realizado (fecha), así como el IVA (iva) y el descuento que se le ha aplicado (dto). Cada factura

hace referencia al cliente al que pertenece (codcli) y al vendedor que la ha realizado (codven).

Las líneas de cada factura se encuentran en la tabla LÍNEAS_FAC, identificándose cada una por el

número de línea que ocupa dentro de la factura (codfac, línea). En cada una de ellas se especifica

la cantidad de unidades (cant) del artículo que se compra (codart), el precio de venta por unidad

(precio) y el descuento que se aplica sobre dicho precio (dto), si es que el artículo estaba de oferta

cuando se vendió.

A continuación se muestra un estado de la base de datos cuyo esquema se acaba de definir.



-- 34 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 25

## CLIENTES

codcli nombre dirección codpostal codpro

333 Sos Carretero, Jesús Mosen Compte, 14 12964 53596

336 Miguel Archiles, Ramon Hisant Bernardo Mundina, 132-5 12652 07766

342 Pinel Huerta, Vicente Francisco Sempere, 37-10 12112 07766

345 López Botella, Mauro Avenida del Puerto, 20-1 12010 12309

348 Palau Martínez, Jorge Raval de Sant Josep, 97-2 12003 12309

354 Murría Vinaiza, José Ciudadela, 90-18 12003 12309

357 Huguet Peris, Juan Angel Calle Mestre Rodrigo, 7 12100 12309

## VENDEDORES

codven nombre dirección codpostal codpue codjefe

5 Guillén Vilar, Natali a Sant Josep, 110 12597 53596 105

105 Poy Omella, Paloma Sanchis Tarazona, 103-1 12257 46332

155 Rubert Cano, Diego Benicarló Residencial, 154 12425 17859 5

455 Agost Tirado, Jorge Pasaje Peñagolosa, 21-19 12914 53596 5

## PUEBLOS

codpue nombre codpro

07766 Burriana 12

12309 Castellón 12

17859 Enramona 12

46332 Soneja 12

53596 Villarreal 12

## PROVINCIAS

codpro nombre

03 Alicante

12 Castellón

46 Valencia



-- 35 of 227 --



26 2.3. ESQUEMA DE UNA BASE DE DATOS RELACIONAL

## ARTÍCULOS

codart descrip precio stock stock_min dto

IM3P32V Interruptor Magnetotérmico 4p, 2 27.01 1 1

im4P10L Interruptor Magnetotérmico 4p, 4 32.60 1 1 15

L14340 Bases De Fusibles Cuchillas T0 0.51 3 3

L17055 Bases De Fusible Cuchillas T3 7.99 3 3

L76424 Placa 2 E. Legrand Serie Mosaic 2.90 5 2

L85459 Tecla Legrand Marfil 2.80 0 4

L85546 Tecla Difusores Legrand Bronce 1.05 13 5 5

L92119 Portalanparas 14 Curbo 5.98 2 1

ME200 Marco Bjc Ibiza 2 Elementos 13.52 1 1

N5072 Pulsador Luz Piloto Niessen Trazo 1.33 11 2

N8017BA Relog Orbis Con Reserva De Cuerda 3.40 7 4

P605 Caja 1 Elem. Plastimetal 1.65 16 9

P695 Interruptor Rotura Brusca 100 A M 13.22 1 1

P924 Interruptor Marrón Dec. Con Visor 2.39 8 3

REF1X20 Regleta Fluorescente 1x36 Bajo F 8.71 1 1

S3165136 Bloque Emergencia Satf 150 L 4.81 6 3

T4501 Tubo Empotrar 100 2.98 0 5

TE7200 Doble Conmutador Bjc Ibiza Blanco 13.22 1 1

TFM16 Curva Tubo Hierro 11 0.33 23 13

TH11 Curva Tubo Hierro 29 1.42 20 3

THC21 Placa Mural Felmax 1.56 1 1

ZNCL Base T,t Lateral Ticino S, Tekne 41.71 1 1 10

## FACTURAS

codfac fecha codcli codven iva dto

6643 16/07/2007 333 105 16 10

6645 16/07/2007 336 105 0 20

6654 31/07/2007 357 155 7 0

6659 08/08/2007 342 5 0 0

6680 10/09/2007 348 455 7 0

6723 06/11/2007 342 5 16 0

6742 17/12/2007 333 105 7 20



-- 36 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 27

LÍNEAS_FAC

codfac linea cant codart precio dto

6643 1 6 L14340 0.51 20

6643 2 1 N5072 1.33 0

6643 3 2 P695 13.22 0

6645 1 10 ZNCL 41.71 0

6645 2 6 N8017BA 3.40 0

6645 3 3 TE7200 13.22 0

6645 4 4 L92119 5.98 0

6654 1 6 REF1X20 8.71 50

6659 1 8 THC21 1.56 0

6659 2 12 L17055 7.99 25

6659 3 9 L76424 2.90 0

6680 1 12 T4501 2.98 0

6680 2 11 im4P10L 32.60 0

6723 1 5 L85459 2.80 5

6742 1 9 ME200 13.52 0

6742 2 8 S3165136 4.81 5

2.4. Reglas de integridad

Una vez definida la estructura de datos del modelo relacional, pasamos a estudiar las reglas de

integridad que los datos almacenados en dicha estructura deben cumplir para garantizar que son

correctos.

Al definir cada atributo sobre un dominio se impone una restricción sobre el conjunto de valores

permitidos para cada atributo. A este tipo de restricciones se les denomina restricciones de dominios.

Hay además dos reglas de integridad muy importantes que son restricciones que se deben cumplir

en todas las bases de datos relacionales y en todos sus estados (las reglas se deben cumplir todo

el tiempo). Estas reglas son la regla de integridad de entidades y la regla de integridad referencial.

Antes de definirlas, es preciso conocer el concepto de nulo.

2.4.1. Nulos

Cuando en una tupla un atributo es desconocido, se dice que es nulo. Un nulo no representa el

valor cero ni la cadena vacía ya que éstos son valores que tienen significado. El nulo implica ausencia

de información, bien porque al insertar la tupla se desconocía el valor del atributo, o bien porque

para dicha tupla el atributo no tiene sentido.

Ya que los nulos no son valores, deben tratarse de modo diferente, lo que causa problemas de



-- 37 of 227 --



28 2.4. REGLAS DE INTEGRIDAD

implementación. De hecho, no todos los SGBD relacionales soportan los nulos.

2.4.2. Regla de integridad de entidades

La primera regla de integridad se aplica a las claves primarias de las relaciones base: ninguno de

los atributos que componen la clave primaria puede ser nulo.

Por definición, una clave primaria es una clave irreducible que se utiliza para identificar de modo

único las tuplas. Que es irreducible significa que ningún subconjunto de la clave primaria sirve para

identificar las tuplas de modo único. Si se permite que parte de la clave primaria sea nula, se está

diciendo que no todos sus atributos son necesarios para distinguir las tuplas, con lo que se contradice

la irreducibilidad.

Nótese que esta regla sólo se aplica a las relaciones base y a las claves primarias, no a las claves

alternativas.

2.4.3. Regla de integridad referencial

La segunda regla de integridad se aplica a las claves ajenas: si en una relación hay alguna clave

ajena, sus valores deben coincidir con valores de la clave primaria a la que hace referencia, o bien,

deben ser completamente nulos.

La regla de integridad referencial se enmarca en términos de estados de la base de datos: indica

lo que es un estado ilegal, pero no dice cómo puede evitarse. La cuestión ahora es plantearse qué

hacer si estando en un estado legal, llega una petición para realizar una operación que conduce a

un estado ilegal. Existen dos opciones: rechazar la operación, o bien aceptar la operación y realizar

operaciones adicionales compensatorias que conduzcan a un estado legal.

Para hacer respetar la integridad referencial se debe contestar, para cada clave ajena, a las tres

preguntas que se plantean a continuación:

Regla de los nulos: ¿Tiene sentido que la clave ajena acepte nulos?

Regla de borrado: ¿Qué ocurre si se intenta borrar la tupla referenciada por la clave ajena?

• Restringir: no se permite borrar la tupla referenciada.

• Propagar: se borra la tupla referenciada y se propaga el borrado a las tuplas que la

referencian mediante la clave ajena.

• Anular: se borra la tupla referenciada y las tuplas que la referenciaban ponen a nulo la

clave ajena (sólo si acepta nulos).

• Valor por defecto: se borra la tupla referenciada y las tuplas que la referenciaban ponen

en la clave ajena el valor por defecto establecido para la misma.



-- 38 of 227 --



### CAPÍTULO 2. MODELO RELACIONAL 29

Regla de modificación: ¿Qué ocurre si se intenta modificar el valor de la clave primaria de la

tupla referenciada por la clave ajena?

• Restringir: no se permite modificar el valor de la clave primaria de la tupla referenciada.

• Propagar: se modifica el valor de la clave primaria de la tupla referenciada y se propaga

la modificación a las tuplas que la referencian mediante la clave ajena.

• Anular: se modifica la tupla referenciada y las tuplas que la referenciaban ponen a nulo

la clave ajena (sólo si acepta nulos).

• Valor por defecto: se modifica la tupla referenciada y las tuplas que la referenciaban

ponen en la clave ajena el valor por defecto establecido para la misma.

2.4.4. Reglas de negocio

Además de las dos reglas de integridad anteriores, es posible que sea necesario imponer ciertas

restricciones específicas sobre los datos que forman parte de la estrategia de funcionamiento de la

empresa. A estas reglas se las denominadas reglas de negocio.

Por ejemplo, si en cada oficina de una determinada empresa sólo puede haber hasta veinte

empleados, el SGBD debe dar la posibilidad al usuario de definir una regla al respecto y debe

hacerla respetar. En este caso, no debería permitir dar de alta un empleado en una oficina que ya

tiene los veinte permitidos. No todos los SGBD relacionales permiten definir este tipo de restricciones

y hacerlas respetar.



-- 39 of 227 --



30 2.4. REGLAS DE INTEGRIDAD



-- 40 of 227 --



### Capítulo 3

Lenguajes relacionales

### Introducción y objetivos

La tercera parte de un modelo de datos es la de la manipulación de los datos. En este capítulo

se presentan el álgebra relacional y el cálculo relacional, definidos por E.F. Codd como la base de

los lenguajes relacionales.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Emplear los operadores del álgebra relacional para responder a cualquier consulta de datos.

Emplear los operadores del cálculo relacional orientado a tuplas para responder a consultas

de datos que no requieran operaciones de resumen.

Describir la diferencia entre el cálculo relacional orientado a tuplas y el cálculo relacional

orientado a dominios.

Enumerar otros lenguajes relacionales distintos al álgebra y el cálculo relacional.

3.1. Manejo de datos

Son varios los lenguajes utilizados por los SGBD relacionales para manejar las relaciones. Algunos

de ellos son procedurales, lo que quiere decir que el usuario indica al sistema exactamente cómo

debe manipular los datos. Otros son no procedurales, que significa que el usuario indica qué datos

necesita, en lugar de establecer cómo deben obtenerse. Se puede decir que el álgebra relacional es un

lenguaje procedural de alto nivel, mientras que el cálculo relacional es un lenguaje no procedural.

Sin embargo, ambos lenguajes son equivalentes: para cada expresión del álgebra, se puede encontrar

una expresión equivalente en el cálculo, y viceversa.

31



-- 41 of 227 --



32 3.2. ÁLGEBRA RELACIONAL

El álgebra relacional (o el cálculo relacional) se utilizan para medir la potencia de los lenguajes

relacionales. Si un lenguaje permite obtener cualquier relación que se pueda derivar mediante el

álgebra relacional, se dice que es relacionalmente completo. La mayoría de los lenguajes relacionales

son relacionalmente completos, pero tienen más potencia que el álgebra o el cálculo porque se les

han añadido operadores especiales.

Tanto el álgebra como el cálculo son lenguajes formales no muy amigables, sin embargo es

conveniente estudiarlos porque sirven para ilustrar las operaciones básicas que todo lenguaje de

manejo datos debe ofrecer. Además, han sido la base para otros lenguajes relacionales de manejo

de datos de más alto nivel.

3.2. Álgebra relacional

El álgebra relacional es un lenguaje formal con una serie de operadores que trabajan sobre una

o varias relaciones para obtener otra relación resultado, sin que cambien las relaciones originales.

Tanto los operandos como los resultados son relaciones, por lo que la salida de una operación puede

ser la entrada de otra operación. Esto permite anidar expresiones del álgebra, del mismo modo que se

pueden anidar las expresiones aritméticas. A esta propiedad se le denomina clausura: las relaciones

son cerradas bajo el álgebra, del mismo modo que los números son cerrados bajo las operaciones

aritméticas.

En este capítulo se describen, en primer lugar, los ocho operadores originalmente propuestos por

Codd y después se estudian algunos operadores adicionales que añaden potencia al lenguaje.

De los ocho operadores, sólo hay cinco que son fundamentales: restricción, proyección, producto

cartesiano, unión y diferencia, que permiten realizar la mayoría de las operaciones de obtención de

datos. Los operadores no fundamentales son la concatenación (join), la intersección y la división,

que se pueden expresar a partir de los cinco operadores fundamentales.

La restricción y la proyección son operaciones unarias porque operan sobre una sola relación. El

resto de las operaciones son binarias porque trabajan sobre pares de relaciones. En las definiciones

que se presentan a continuación, se supone que R y S son dos relaciones cuyos atributos son A=(a1,

a2, ..., aN ) y B=(b1, b2, ..., bM ) respectivamente.

Todos los ejemplos de este capítulo están basados en el esquema de la base de datos relacional

presentada en el capítulo anterior (apartado 2.3).

Restricción : R WHERE condición

La restricción, también denominada selección, opera sobre una sola relación R y da como

resultado otra relación cuyas tuplas son las tuplas de R que satisfacen la condición especificada.

Esta condición es una comparación en la que aparece al menos un atributo de R, o una



-- 42 of 227 --



### CAPÍTULO 3. LENGUAJES RELACIONALES 33

combinación booleana de varias de estas comparaciones.

Ejemplo 3.1 Obtener todos los artículos que tienen un precio superior a 10 e.

ARTICULOS WHERE precio>10

codart descrip precio stock stock_min dto

IM3P32V Interruptor Magnetotérmico 4p, 2 27.01 1 1

im4P10L Interruptor Magnetotérmico 4p, 4 32.60 1 1 15

ME200 Marco Bjc Ibiza 2 Elementos 13.52 1 1

P695 Interruptor Rotura Brusca 100 A M 13.22 1 1

TE7200 Doble Conmutador Bjc Ibiza Blanco 13.22 1 1

ZNCL Base T,t Lateral Ticino S, Tekne 41.71 1 1 10

Ejemplo 3.2 Obtener los artículos cuyo stock es de menos de 5 unidades y además se ha quedado

al mínimo o por debajo.

ARTÍCULOS WHERE stock<5 AND stock<stock_min

codart descrip precio stock stock_min dto

IM3P32V Interruptor Magnetotérmico 4p, 2 27.01 1 1

im4P10L Interruptor Magnetotérmico 4p, 4 32.60 1 1 15

L14340 Bases De Fusibles Cuchillas T0 0.51 3 3

L17055 Bases De Fusible Cuchillas T3 7.99 3 3

L85459 Tecla Legrand Marfil 2.80 0 4

... ... ... ... ...

Proyección : R[ai, ..., ak]

La proyección opera sobre una sola relación R y da como resultado otra relación que contiene

un subconjunto vertical de R, extrayendo los valores de los atributos especificados y eliminando

duplicados.

Ejemplo 3.3 Obtener un listado de vendedores mostrando su código, su nombre y su código postal.

VENDEDORES [codven,nombre,codpostal]

codven nombre codpostal

5 Guillén Vilar, Natalia 12597

105 Poy Omella, Paloma 12257

155 Rubert Cano, Diego 12425

455 Agost Tirado, Jorge 12914



-- 43 of 227 --



34 3.2. ÁLGEBRA RELACIONAL

Ejemplo 3.4 Obtener los códigos de las poblaciones de los clientes.

CLIENTES [codpue]

codpue

53596

07766

12309

Producto cartesiano : R TIMES S

El producto cartesiano obtiene una relación cuyas tuplas están formadas por la concatenación

de todas las tuplas de R con todas las tuplas de S.

La restricción y la proyección son operaciones que permiten extraer información de una sola

relación. Habrá casos en que sea necesario combinar la información de varias relaciones. El producto

cartesiano multiplica dos relaciones, definiendo una nueva relación que tiene todos los pares posibles

de tuplas de las dos relaciones. Si la relación R tiene P tuplas y N atributos y la relación S tiene

Q tuplas y M atributos, la relación resultado tendrá P ∗ Q tuplas y N + M atributos. Ya que es

posible que haya atributos con el mismo nombre en las dos relaciones, el nombre de la relación se

antepondrá al del atributo en este caso para que los nombres de los atributos sigan siendo únicos

en la relación resultado.

Una vez realizado el producto cartesiano de dos relaciones, se puede realizar una restricción

que elimine aquellas tuplas cuya información no esté relacionada, como se muestra en el siguiente

ejemplo.

Ejemplo 3.5 Obtener los nombres de las poblaciones a las que pertenecen los clientes.

( CLIENTES[codpue] TIMES PUEBLOS ) WHERE CLIENTES.codpue = PUEBLOS.codpue

CLIENTES.codpue PUEBLOS.codpue nombre codpro

53596 53596 Villarreal 12

07766 07766 Burriana 12

12309 12309 Castellón 12

La combinación del producto cartesiano y la restricción del modo en que se acaba de realizar, se

puede reducir a la operación de concatenación (JOIN) que se presenta más adelante.

Unión : R UNION S

La unión de dos relaciones R y S, con P y Q tuplas respectivamente, es otra relación que tiene

como mucho P + Q tuplas siendo éstas las tuplas que se encuentran en R o en S o en ambas

relaciones a la vez. Para poder realizar esta operación, R y S deben ser compatibles para la

unión.



-- 44 of 227 --



### CAPÍTULO 3. LENGUAJES RELACIONALES 35

Se dice que dos relaciones son compatibles para la unión si ambas tienen la misma cabecera,

es decir, si tienen el mismo número de atributos y éstos se encuentran definidos sobre los mismos

dominios en ambas tablas respectivamente. En muchas ocasiones será necesario realizar proyecciones

para hacer que dos relaciones sean compatibles para la unión.

Ejemplo 3.6 Obtener un listado de los códigos de las poblaciones donde hay clientes o vendedores.

CLIENTES[codpue] UNION VENDEDORES[codpue]

codpue

53596

07766

12309

46332

17859

Diferencia : R EXCEPT S

La diferencia obtiene una relación que tiene las tuplas que se encuentran en R y no se encuen-

tran en S. Para realizar esta operación, R y S deben ser compatibles para la unión.

Ejemplo 3.7 Obtener un listado de las poblaciones en donde hay clientes y no hay vendedores.

CLIENTES[codpue] EXCEPT VENDEDORES[codpue]

codpue

07766

12309

Concatenación (Join) : R JOIN S

La concatenación de dos relaciones R y S obtiene como resultado una relación cuyas tuplas

son todas las tuplas de R concatenadas con todas las tuplas de S que en los atributos comunes

(aquellos que se llaman igual) tienen los mismos valores. Estos atributos comunes aparecen

una sola vez en el resultado.

Ejemplo 3.8 Obtener los datos de las poblaciones en las que hay clientes.

CLIENTES[codpue] JOIN PUEBLOS

Esta expresión obtiene el mismo resultado que la expresión final del ejemplo 3.5, ya que la

operación de concatenación es, en realidad, un producto cartesiano y una restricción de igualdad

sobre los atributos comunes.



-- 45 of 227 --



36 3.2. ÁLGEBRA RELACIONAL

Concatenación externa (Outer–join) : R LEFT OUTER JOIN S

La concatenación externa por la izquierda es una concatenación en la que las tuplas de R (que

se encuentra a la izquierda en la expresión) que no tienen valores en común con ninguna tupla

de S, también aparecen en el resultado.

Ejemplo 3.9 Obtener un listado de todos los clientes (código y nombre) y las facturas que se les

han realizado. Si no tienen facturas también deben aparecer en el resultado.

CLIENTES[codcli,nombre] LEFT OUTER JOIN FACTURAS

codfac fecha codcli nombre codven iva dto

6643 16/07/2007 333 Sos Carretero, Jesús 105 16 10

6645 16/07/2007 336 Miguel Archiles, Ramon 105 0 20

6654 31/07/2007 357 Huguet Peris, Juan Angel 155 7 0

6659 08/08/2007 342 Pinel Huerta, Vicente 5 0 0

6680 10/09/2007 348 Palau Martínez, Jorge 455 7 0

6723 06/11/2007 342 Pinel Huerta, Vicente 5 16 0

6742 17/12/2007 333 Sos Carretero, Jesús 105 7 20

345 López Botella, Mauro

354 Murría Vinaiza, José

La expresión S RIGHT OUTER JOIN R es equivalente a R LEFT OUTER JOIN S. Cuando en ambas

relaciones hay tuplas que no se pueden concatenar y se desea que en el resultado aparezcan también

todas estas tuplas (tanto las de una relación como las de la otra), se puede utilizar la concatenación

externa completa: R FULL OUTER JOIN S

Intersección : R INTERSECT S

La intersección obtiene como resultado una relación que contiene las tuplas de R que también

se encuentran en S. Para realizar esta operación, R y S deben ser compatibles para la unión.

La intersección se puede expresar en términos de diferencias:

R INTERSECT S = R EXCEPT ( R EXCEPT S )

División : R DIVIDE BY S

Suponiendo que la cabecera de R es el conjunto de atributos A y que la cabecera de S es el

conjunto de atributos B, tales que B es un subconjunto de A, y si C = A - B (los atributos de R

que no están en S), la división obtiene una relación cuya cabecera es el conjunto de atributos

C y que contiene las tuplas de R que están acompañadas de todas las tuplas de S.



-- 46 of 227 --



### CAPÍTULO 3. LENGUAJES RELACIONALES 37

Ejemplo 3.10 Obtener clientes que han realizado compras a todos los vendedores.

FACTURAS[codcli,codven] DIVIDE BY VENDEDORES[codven]

Además de las operaciones que Codd incluyó en el álgebra relacional, otros autores han aportado

otras operaciones para dar más potencia al lenguaje. Es de especial interés la agrupación (también

denominada resumen) que añade capacidad computacional al álgebra.

Agrupación : SUMMARIZE R GROUP BY(ai,...,ak) ADD cálculo AS atributo

Esta operación agrupa las tuplas de R que tienen los mismos valores en los atributos espe-

cificados y realiza un cálculo sobre los grupos obtenidos. La relación resultado tiene como

cabecera los atributos por los que se ha agrupado y el cálculo realizado, al que se da el nombre

especificado en atributo.

Los cálculos que se pueden realizar sobre los grupos de filas son: suma de los valores de un

atributo (SUM(ap)), media de los valores de un atributo (AVG(ap)), máximo y mínimo de los valores

de un atributo (MAX(ap), MIN(ap)) y número de tuplas en el grupo (COUNT(*)). La relación resultado

tendrá tantas filas como grupos se hayan obtenido.

Ejemplo 3.11 Obtener el número de artículos (unidades en total) de cada factura.

SUMMARIZE LÍNEAS_FAC GROUP BY(codfac) ADD SUM(cant) AS cant_total

codfac cant_total

6643 9

6645 23

6654 6

6659 29

6680 23

6723 5

6742 17

3.3. Cálculo relacional

El álgebra relacional y el cálculo relacional son formalismos diferentes que representan distintos

estilos de expresión del manejo de datos en el ámbito del modelo relacional. El álgebra relacional

proporciona una serie de operaciones que se pueden usar para indicar al sistema cómo construir la

relación deseada a partir de las relaciones de la base de datos. El cálculo relacional proporciona una



-- 47 of 227 --



38 3.3. CÁLCULO RELACIONAL

notación para formular la definición de la relación deseada en términos de las relaciones de la base

de datos.

El cálculo relacional toma su nombre del cálculo de predicados, que es una rama de la lógica.

Hay dos tipos de cálculo relacional, el orientado a tuplas, propuesto por Codd, y el orientado

a dominios, propuesto por otros autores. El estudio del cálculo relacional se hará aquí mediante

definiciones informales. Las definiciones formales se pueden encontrar en la bibliografía.

En el cálculo de predicados (lógica de primer orden), un predicado es una función con argumentos

que se puede evaluar a verdadero o falso. Cuando los argumentos se sustituyen por valores, la función

lleva a una expresión denominada proposición, que puede ser verdadera o falsa. Por ejemplo, las

frases ‘Paloma Poy es una vendedora de la empresa’ y ‘Paloma Poy es jefa de Natalia Guillén’ son

proposiciones, ya que se puede determinar si son verdaderas o falsas. En el primer caso, la función

‘es una vendedora de la empresa’ tiene un argumento (Paloma Poy) y en el segundo caso, la función

‘es jefa de’ tiene dos argumentos (Paloma Poy y Natalia Guillén).

Si un predicado tiene una variable, como en ‘x es una vendedora de la empresa’, esta variable

debe tener un rango asociado. Cuando la variable se sustituye por alguno de los valores de su rango,

la proposición puede ser cierta; para otros valores puede ser falsa. Por ejemplo, si el rango de x es

el conjunto de todas las personas y reemplazamos x por Paloma Poy, la proposición ‘Paloma Poy

es una vendedora de la empresa’ es cierta. Pero si reemplazamos x por el nombre de una persona

que no es vendedora de la empresa, la proposición es falsa.

Si F es un predicado, la siguiente expresión devuelve el conjunto de todos los valores de x para

los que F es cierto:

x WHERE F(x)

Los predicados se pueden conectar mediante AND, OR y NOT para formar predicados compuestos.

3.3.1. Cálculo orientado a tuplas

En el cálculo relacional orientado a tuplas, lo que interesa es encontrar tuplas para las que se

cumple cierto predicado. El cálculo orientado a tuplas se basa en el uso de variables tupla. Una

variable tupla es una variable cuyo rango de valores son las tuplas de una relación.

Por ejemplo, para especificar el rango de la variable tupla AX sobre la relación ARTÍCULOS se utiliza

la siguiente expresión:

## RANGE OF AX IS ARTÍCULOS

Para expresar la consulta ‘obtener todas las tuplas AX para las que F(AX) es cierto’, se escribe la

siguiente expresión:



-- 48 of 227 --



### CAPÍTULO 3. LENGUAJES RELACIONALES 39

AX WHERE F(AX)

donde F es lo que se denomina una fórmula bien formada. Por ejemplo, para expresar la consulta

‘obtener los datos de los artículos con un precio superior a 10 e’ se puede escribir:

## RANGE OF AX IS ARTÍCULOS

AX WHERE AX.precio > 10

AX.precio se refiere al valor del atributo precio para la tupla AX. Para que se muestren solamente

algunos atributos, por ejemplo, codart y descrip, en lugar de todos los atributos de la relación, se

deben especificar éstos en la lista de objetivos:

## RANGE OF AX IS ARTÍCULOS

AX.codart, AX.descrip WHERE AX.precio > 10

Hay dos cuantificadores que se utilizan en las fórmulas bien formadas para indicar a cuántas ins-

tancias se aplica el predicado. El cuantificador existencial ∃ (existe) se utiliza en las fórmulas bien

formadas que deben ser ciertas para al menos una instancia.

## RANGE OF CX IS CLIENTES

∃CX (CX.codcli = FX.codcli AND CX.codpostal = 12003)

Esta fórmula bien formada dice que ‘existe un cliente que tiene el mismo código que el código de

cliente de la tupla que ahora se encuentra en la variable de FACTURAS, FX, y cuyo código postal es

12003’. El cuantificador universal ∀ (para todo) se utiliza en las fórmulas bien formadas que deben

ser ciertas para todas las instancias.

## RANGE OF VX IS VENDEDORES

∀VX (VX.codpue 6 = 37758)

Esta fórmula bien formada dice que ‘para todas las tuplas de VENDEDORES, la población no es la del

código 37758’. Utilizando las reglas de las operaciones lógicas, esta fórmula bien formada se puede

escribir también del siguiente modo:

NOT ∃PX (VX.codpue = 37758)

que dice que ‘no hay ningún vendedor cuya población sea la del código 37758’.

Las variables tupla que no están cuantificadas por ∀ o ∃ se denominan variables libres. Si están

cuantificadas, se denominan variables ligadas. El cálculo, al igual que cualquier lenguaje, tiene una

sintaxis que permite construir expresiones válidas. Para que una expresión no sea ambigua y tenga

sentido, debe seguir esta sintaxis:



-- 49 of 227 --



40 3.3. CÁLCULO RELACIONAL

Si P es una fórmula bien formada n–ária (un predicado con n argumentos) y t1, t2, . . . , tn son

constantes o variables, entonces P (t1, t2, . . . , tn) es también una fórmula bien formada.

Si t1 y t2 son constantes o variables del mismo dominio y θ es un operador de comparación

(<, ≤, >, ≥, =, 6 =), entonces t1θt2 es una fórmula bien formada.

Si P1 y P2 son fórmulas bien formadas, también lo son su conjunción P1 AND P2, su disyunción

P1 OR P2 y la negación NOT P1. Además, si P es una fórmula bien formada que tiene una

variable libre X, entonces ∃X(P ) y ∀X(P ) también son fórmulas bien formadas.

Ejemplo 3.12 Obtener un listado de los clientes que tienen facturas con descuento.

Esta petición se puede escribir en términos del cálculo: ‘un cliente debe salir en el listado si existe

alguna tupla en FACTURAS que tenga su código de cliente y que tenga descuento (dto)’.

## RANGE OF CX IS CLIENTES

## RANGE OF FX IS FACTURAS

CX WHERE ∃FX (FX.codcli = CX.codcli AND FX.dto > 0)

Nótese que formulando la consulta de este modo no se indica la estrategia a seguir para ejecutarla,

por lo que el sistema tiene libertad para decidir qué operaciones hacer y en qué orden. En el álgebra

relacional se hubiera formulado así: ‘Hacer una restricción sobre FACTURAS para obtener las tuplas

que tienen descuento, y hacer después una concatenación con CLIENTES.

Ejemplo 3.13 Obtener los clientes que tienen descuento en todas sus facturas.

## RANGE OF CX IS CLIENTES

## RANGE OF FX IS FACTURAS

CX WHERE ∀FX (FX.codcli 6 = CX.codcli OR FX.dto > 0)

La expresión anterior es equivalente a esta otra:

CX WHERE NOT ∃FX (FX.codcli = CX.codcli AND FX.dto ≤ 0)

Y también es equivalente a la siguiente:

CX WHERE ∀FX (IF FX.codcli = CX.codcli THEN FX.dto > 0)

ya que la expresión IF p THEN q es equivalente a la expresión NOT p OR q.



-- 50 of 227 --



### CAPÍTULO 3. LENGUAJES RELACIONALES 41

3.3.2. Cálculo orientado a dominios

En el cálculo relacional orientado a dominios las variables toman sus valores en dominios, en

lugar de tomar valores de tuplas de relaciones. Otra diferencia con el cálculo orientado a tuplas es

que en el cálculo orientado a dominios hay un tipo de comparación adicional, a la que se denomina

ser miembro de. Esta condición tiene la forma:

R(a1:v1, a2:v2, ...)

donde los ai son atributos de la relación R y los vi son variables dominio o constantes. La condición

se evalúa a verdadero si existe alguna tupla en R que tiene los valores especificados en los atributos

especificados. Por ejemplo, la siguiente condición:

VENDEDORES(codpostal:12003, codjefe:5)

se evaluará a verdadero si hay algún empleado con código postal 12003 y cuyo jefe es el vendedor

5. Y la condición:

VENDEDORES(codpostal:cpx, codjefe:cjx)

será cierta si hay alguna tupla en VENDEDORES que tenga en codpostal el valor actual de la variable

dominio cpx y que tenga en codjefe el valor actual de la variable dominio cjx.

Ejemplo 3.14 Obtener el nombre de los vendedores cuyo jefe no es el 5, y cuyo código postal es

12003.

nmx WHERE ∃cjx ∃cpx (cjx 6 = 5 AND cpx = 12003

AND VENDEDORES(nombre:nmx, codjefe:cjx, codpostal:cpx))

3.4. Otros lenguajes

Aunque el cálculo relacional es difícil de entender y de usar, tiene una propiedad muy atractiva:

es un lenguaje no procedural. Esto ha hecho que se busquen técnicas no procedurales algo más sen-

cillas, resultando en dos nuevas categorías de lenguajes relacionales: orientados a transformaciones

y gráficos.

Los lenguajes orientados a transformaciones son lenguajes no procedurales que utilizan relacio-

nes para transformar los datos de entrada en la salida deseada. Estos lenguajes tienen estructuras

que son fáciles de utilizar y que permiten expresar lo que se desea en términos de lo que se conoce.

Uno de estos lenguajes es SQL (Structured Query Language).



-- 51 of 227 --



42 3.4. OTROS LENGUAJES

Los lenguajes gráficos visualizan en pantalla una fila vacía de cada una de las tablas que indica

el usuario. El usuario rellena estas filas con un ejemplo de lo que desea y el sistema devuelve los

datos que siguen tal ejemplo. Uno de estos lenguajes es QBE (Query–by–Example).

Otra categoría son los lenguajes de cuarta generación (4GL), que permiten diseñar una aplica-

ción a medida utilizando un conjunto limitado de órdenes en un entorno amigable (normalmente

un entorno de menús). Algunos sistemas aceptan cierto lenguaje natural, una versión restringida

del idioma inglés, al que algunos llaman lenguaje de quinta generación (5GL), aunque todavía se

encuentra en desarrollo.



-- 52 of 227 --



### Capítulo 4

Lenguaje SQL

### Introducción y objetivos

Las siglas SQL corresponden a Structured Query Language, un lenguaje estándar que permite

manejar los datos de una base de datos relacional. La mayor parte de los SGBD relacionales im-

plementan este lenguaje y mediante él se realizan todo tipo de accesos a la base de datos. En este

### capítulo se hace una presentación del lenguaje SQL, haciendo énfasis en la sentencia de consulta de

datos, la sentencia SELECT.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Emplear la sentencia CREATE TABLE para crear tablas a partir de una especificación dada.

Emplear las sentencias INSERT, UPDATE, DELETE para insertar, actualizar y borrar datos de

tablas de una base de datos.

Emplear la sentencia SELECT para responder a cualquier consulta de datos sobre una base de

datos dada.

Especificar una sentencia SELECT equivalente a otra dada que no haga uso de los operadores

que se indiquen, con el objetivo de intentar acelerar el tiempo de respuesta.

4.1. Bases de datos relacionales

Como se ha visto capítulos anteriores, una base de datos relacional está formada por un conjunto

de relaciones. A las relaciones, en SQL, se las denomina tablas. Cada tabla tiene una serie de columnas

(son los atributos). Cada columna tiene un nombre distinto y es de un tipo de datos (entero, real,

carácter, fecha, etc.). En las tablas se insertan filas (son las tuplas), que después se pueden consultar,

modificar o borrar.

43



-- 53 of 227 --



44 4.2. DESCRIPCIÓN DE LA BASE DE DATOS

No se debe olvidar que cada tabla tiene una clave primaria, que estará formada por una o

varias columnas de esa misma tabla. Sobre las claves primarias se debe hacer respetar una regla de

integridad fundamental: la regla de integridad de entidades. La mayoría de los SGBD relacionales

se encargan de hacer respetar esta regla automáticamente.

Por otra parte, las relaciones entre los datos de distintas tablas se establecen mediante las claves

ajenas. Una clave ajena es una columna o un conjunto de columnas de una tabla que hace referencia

a la clave primaria de otra tabla (o de ella misma). Para las claves ajenas también se debe cumplir

una regla de integridad fundamental: la regla de integridad referencial. Muchos SGBD relacionales

permiten que el usuario establezca las reglas de comportamiento de las claves ajenas que permiten

hacer respetar esta regla.

4.2. Descripción de la base de datos

En este apartado se presenta de nuevo la base de datos con la que se ha trabajado en capítulos

anteriores y que es la que se utilizará para estudiar el lenguaje SQL en este capítulo. Para evitar

problemas de implementación se han omitido las tildes en los nombres de tablas y columnas.

La base de datos está formada por las tablas que aparecen a continuación. Las columnas subra-

yadas representan la clave primaria de cada tabla.

CLIENTES (codcli, nombre, direccion, codpostal, codpue)

VENDEDORES (codven, nombre, direccion, codpostal, codpue, codjefe)

PUEBLOS (codpue, nombre, codpro)

PROVINCIAS (codpro, nombre)

ARTICULOS (codart, descrip, precio, stock, stock_min, dto)

FACTURAS (codfac, fecha, codcli, codven, iva, dto)

LINEAS_FAC (codfac, linea, cant, codart, precio, dto)

A continuación se especifican las claves ajenas y si aceptan nulos:

CLIENTES codpue

−→ PUEBLOS : No acepta nulos.

VENDEDORES codpue

−→ PUEBLOS : No acepta nulos.

VENDEDORES codjefe

−→ VENDEDORES : Acepta nulos.

PUEBLOS codpro

−→ PROVINCIAS : Acepta nulos.

FACTURAS codcli

−→ CLIENTES : Acepta nulos.

FACTURAS codven

−→ VENDEDORES : Acepta nulos.

LINEAS_FAC codfac

−→ FACTURAS : No acepta nulos.

LINEAS_FAC codart

−→ ARTICULOS : No acepta nulos.



-- 54 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 45

La información contenida en esta base de datos pertenece a una empresa de venta de artículos

eléctricos. A continuación se describe el contenido de cada tabla.

La tabla PROVINCIAS almacena información sobre las provincias de España. De cada provincia

se almacena su nombre (nombre) y un código que la identifica (codpro).

La tabla PUEBLOS contiene los nombres (nombre) de los pueblos de de España. Cada pueblo

se identifica por un código que es único (codpue) y tiene una referencia a la provincia a la que

pertenece (codpro).

La tabla CLIENTES contiene los datos de los clientes: código que identifica a cada uno (codcli),

nombre y apellidos (nombre), calle y número (direccion), código postal (codpostal) y una refe-

rencia a su población (codpue).

La tabla VENDEDORES contiene los datos de los vendedores de la empresa: código que identifica

a cada uno (codven), nombre y apellidos (nombre), calle y número (direccion), código postal

(codpostal), una referencia a su población (codpue) y una referencia al vendedor del que depende

(codjefe), si es el caso.

En la tabla ARTICULOS se tiene el código que identifica a cada artículo (codart), su descripción

(descrip), el precio de venta actual (precio), el número de unidades del artículo que hay en el

almacén (stock), si se conocen, la cantidad mínima que se desea mantener almacenada (stock_min),

si es que la hay, y si el artículo está en oferta, el descuento (dto) que se debe aplicar cuando se

venda.

La tabla FACTURAS contiene las cabeceras de las facturas correspondientes a las compras reali-

zadas por los clientes. Cada factura tiene un código único (codfac), la fecha en que se ha realizado

(fecha), así como el IVA (iva) y el descuento que se le ha aplicado (dto). Si el iva o el descuento no

se especifican, se deben interpretar como el valor cero (sin iva o sin descuento)1. Cada factura hace

### referencia al cliente al que pertenece (codcli) y al vendedor que la ha realizado (codven). Ambas

claves ajenas aceptan nulos.

Las líneas de cada factura se encuentran en la tabla LINEAS_FAC, identificándose cada una por el

número de línea que ocupa dentro de la factura (codfac, linea). En cada una de ellas se especifica

la cantidad de unidades (cant) del artículo que se compra (codart), el precio de venta por unidad

(precio) y el descuento que se aplica sobre dicho precio (dto), si es que el artículo está en promoción.

Si el descuento no se especifica, se debe interpretar como sin descuento (valor cero).

La figura 4.1 muestra el esquema de la base de datos gráficamente.

1Es un mal uso de los nulos, ya que interpretar los nulos con valores supone un trabajo extra cuando se hacen las

consultas. Sin embargo, en muchas bases de datos se hace este mal uso de los nulos y, por lo tanto, el estudio del SQL

requiere aprender manejarse con ellos.



-- 55 of 227 --



46 4.3. VISIÓN GENERAL DEL LENGUAJE

codfac

linea

cant

codart

dto

precio

LINEAS_FAC

codfac

fecha

codcli

codven

iva

dto

## FACTURAS

codven

nombre

direccion

codpostal

codpue

codjefe

## VENDEDORES

codpue

nombre

codpro

## PUEBLOS

codpro

nombre

## PROVINCIAS

codcli

nombre

direccion

codpostal

codpue

## CLIENTES

codart

descrip

precio

stock

stock_min

## ARTICULOS

dto

Figura 4.1: Esquema de la base de datos que se utilizará en los ejemplos.

4.3. Visión general del lenguaje

Normalmente, cuando un SGBD relacional implementa el lenguaje SQL, todas las acciones que

se pueden llevar a cabo sobre el sistema se realizan mediante sentencias de este lenguaje. Dentro de

SQL hay varios tipos de sentencias que se agrupan en tres conjuntos:

Sentencias de definición de datos: son las sentencias que permiten crear tablas, alterar su

definición y eliminarlas. En una base de datos relacional existen otros tipos de objetos además

de las tablas, como las vistas, los índices y los disparadores, que se estudiarán más adelante. Las

sentencias para crear, alterar y eliminar vistas e índices también pertenecen a este conjunto.

Sentencias de manejo de datos: son las sentencias que permiten insertar datos en las tablas,

consultarlos, modificarlos y borrarlos.

Sentencias de control: son las sentencias que utilizan los administradores de la base de datos

para realizar sus tareas, como por ejemplo crear usuarios y concederles o revocarles privilegios.

Las sentencias de SQL se pueden escribir tanto en mayúsculas como en minúsculas y lo mismo

sucede con los nombres de las tablas y de las columnas. Para facilitar la lectura de los ejemplos, se

utilizarán mayúsculas para las palabras clave del lenguaje y minúsculas para los nombres de tablas

y de columnas. En los ejemplos se introducirán espacios en blanco para tabular las expresiones. Las

sentencias de SQL terminan siempre con el carácter punto y coma (;).



-- 56 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 47

4.3.1. Creación de tablas

Para crear una tabla en una base de datos se utiliza la sentencia CREATE TABLE. Su sintaxis es

la siguiente:

CREATE TABLE nombre_tabla (

{ nombre_columna tipo_datos [ DEFAULT expr ][ restrición_columna [, ... ] ]

| restricción_tabla } [, ... ]

)

donde restricción_columna es:

[ CONSTRAINT nombre_restricción ]

{ NOT NULL | NULL | UNIQUE | PRIMARY KEY | CHECK (expr) |

REFERENCES tablaref [ ( columnaref ) ]

[ ON DELETE acción ] [ ON UPDATE acción ] }

[ DEFERRABLE | NOT DEFERRABLE ] [ INITIALLY DEFERRED | INITIALLY IMMEDIATE ]

y restricción_tabla es:

[ CONSTRAINT nombre_restricción ]

{ UNIQUE ( nombre_columna [, ... ] ) |

PRIMARY KEY ( nombre_columna [, ... ] ) |

CHECK ( expr ) |

FOREIGN KEY ( nombre_columna [, ... ] )

REFERENCES tablaref [ ( columnaref [, ... ] ) ]

[ MATCH FULL | MATCH PARTIAL ] [ ON DELETE acción ] [ ON UPDATE acción ] }

nombre_tabla : Nombre de la nueva tabla.

nombre_columna : Nombre de una columna de la tabla.

tipo_datos : Tipo de datos de la columna.

DEFAULT expr : Asigna un valor por defecto a la columna junto a la que aparece; este valor

se utilizará cuando en una inserción no se especifique valor para la columna.

CONSTRAINT nombre_restricción : A las restricciones que se definen sobre columnas y sobre

tablas se les puede dar un nombre (si no se hace, el sistema generará un nombre automática-

mente).

NOT NULL : La columna no admite nulos.



-- 57 of 227 --



48 4.3. VISIÓN GENERAL DEL LENGUAJE

NULL : La columna admite nulos (se toma por defecto si no se especifica NOT NULL).

UNIQUE ( restricción de columna ) y UNIQUE ( nombre_columna [, ... ] ) (restricción de

tabla) : Indica que una columna o un grupo de columnas sólo pueden tener valores únicos

(constituyen una clave alternativa).

PRIMARY KEY (restricción de columna) y PRIMARY KEY ( nombre_columna [, ... ] ) (res-

tricción de tabla) : Indica la columna o grupo de columnas que forman la clave primaria de la

tabla. Los valores de la clave primaria, además de ser únicos, deberán ser no nulos.

CHECK ( expr ) : Permite especificar reglas de integridad específicas que se comprueban para

cada fila que se inserta o que se actualiza. La expresión es un predicado que produce un

resultado booleano. Si se especifica a nivel de columna, en la expresión sólo se puede hacerse

### referencia a esta columna. Si se especifica a nivel de tabla, en la expresión pueden aparecer

varias columnas. Por ahora no se puede incluir subconsultas en esta cláusula.

Restricción de columna:

REFERENCES tablaref [ ( columnaref ) ]

[ ON DELETE acción ] [ ON UPDATE acción ]

Restricción de tabla:

FOREIGN KEY ( nombre_columna [, ... ] )

REFERENCES tablaref [ ( columnaref [, ... ] ) ]

[ MATCH FULL | MATCH PARTIAL ] [ ON DELETE acción ] [ ON UPDATE acción ]

La restricción de columna REFERENCES permite indicar que la columna hace referencia a una

columna de otra tabla. Si la referencia se hace a la clave primaria, no es necesario especificar

el nombre de la columna a la que se hace referencia (estamos definiendo una clave ajena).

Cuando se añade o actualiza un valor en esta columna, se comprueba que dicho valor existe

en la columna referenciada. Cuando la restricción es a nivel de tabla (FOREIGN KEY) hay dos

tipos de comprobación: MATCH FULL y MATCH PARTIAL. Con MATCH FULL, si la clave ajena está

formada por varias columnas y admite nulos, esta comprobación es la que corresponde a la

regla de integridad referencial: en cada fila, o todas las columnas de la clave ajena tienen

valor o ninguna de ellas lo tiene (todas son nulas), pero no se permite que en una misma fila,

algunas sean nulas y otras no. Con MATCH PARTIAL, si la clave ajena está formada por varias

columnas y admite nulos, se permiten claves ajenas parcialmente nulas y se comprueba que

en la tabla referenciada se podría referenciar a alguna de sus filas si los nulos se sustituyeran

por los valores adecuados.

Además se pueden establecer reglas de comportamiento para cada clave ajena cuando se



-- 58 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 49

borra o se actualiza el valor referenciado. En ambos casos hay cuatro posibles opciones que

se enumeran a continuación. NO ACTION produce un error por intento de violación de una

restricción. RESTRICT es igual que NO ACTION. CASCADE borra/actualiza las filas que hacen

### referencia al valor borrado/actualizado. SET NULL pone un nulo en las filas donde se hacía

### referencia al valor borrado/actualizado. SET DEFAULT pone el valor por defecto en las filas

donde se hacía referencia al valor borrado/actualizado.

A continuación se muestra la sentencia de creación de la tabla LINEAS_FAC:

CREATE TABLE lineas_fac (

codfac NUMERIC(6,0) NOT NULL,

linea NUMERIC(2,0) NOT NULL,

cant NUMERIC(5,0) NOT NULL,

codart VARCHAR(8) NOT NULL,

precio NUMERIC(6,2) NOT NULL,

dto NUMERIC(2,0),

CONSTRAINT cp_lineas_fac PRIMARY KEY (codfac, linea),

CONSTRAINT ca_lin_fac FOREIGN KEY (codfac) REFERENCES facturas(codfac)

ON UPDATE CASCADE ON DELETE CASCADE,

CONSTRAINT ca_lin_art FOREIGN KEY (codart) REFERENCES articulos(codart)

ON UPDATE CASCADE ON DELETE RESTRICT,

CONSTRAINT ri_dto_lin CHECK (dto BETWEEN 0 AND 50)

);

4.3.2. Inserción de datos

Una vez creada una tabla podemos introducir datos en ella mediante la sentencia INSERT, como

se muestra en los siguientes ejemplos:

INSERT INTO facturas (codfac, fecha, codcli, codven, iva, dto )

VALUES (6600, ’30/04/2007’, 111, 55, 0, NULL);

INSERT INTO lineas_fac (codfac, linea, cant, codart, precio, dto)

VALUES (6600, 1, 4, ’L76425’, 3.16, 25 );

INSERT INTO lineas_fac (codfac, linea, cant, codart, precio, dto)

VALUES (6600, 2, 5, ’B14017’, 2.44, 25 );

INSERT INTO lineas_fac (codfac, linea, cant, codart, precio, dto)

VALUES (6600, 3, 7, ’L92117’, 4.39, 25 );



-- 59 of 227 --



50 4.3. VISIÓN GENERAL DEL LENGUAJE

Mediante estas sentencias se ha introducido la cabecera de una factura y tres de sus líneas. Nótese

que tanto las cadenas de caracteres como las fechas, se introducen entre comillas simples. Para

introducir nulos se utiliza la expresión NULL.

Algunos SGBD relacionales permiten insertar varias filas en una misma tabla mediante una

sola sentencia INSERT, realizando las inserciones de un modo más eficiente que si se hace mediante

varias sentencias independientes. Así, la tres inserciones que se han realizado en la tabla LINEAS_FAC

también se pueden realizar mediante la siguiente sentencia:

INSERT INTO lineas_fac (codfac, linea, cant, codart, precio, dto)

VALUES (6600, 1, 4, ’L76425’, 3.16, 25 ),

(6600, 2, 5, ’B14017’, 2.44, 25 ),

(6600, 3, 7, ’L92117’, 4.39, 25 );

4.3.3. Consulta de datos

Una vez se ha visto cómo almacenar datos en la base de datos interesa conocer cómo se puede

acceder a dichos datos para consultarlos. Para ello se utiliza la sentencia SELECT. Por ejemplo:

SELECT *

FROM facturas;

En primer lugar aparece la palabra SELECT, que indica que se va a realizar una consulta. A conti-

nuación, el * indica que se desea ver el contenido de todas las columnas de la tabla consultada. El

nombre de esta tabla es el que aparece tras la palabra FROM, en este caso, la tabla facturas.

Esta sentencia es, sin lugar a dudas, la más compleja del lenguaje de manejo de datos y es por

ello que gran parte de este capítulo se centra en su estudio.

4.3.4. Actualización y eliminación de datos

Una vez insertados los datos es posible actualizarlos o eliminarlos mediante las sentencias UPDATE

y DELETE, respectivamente. Para comprender el funcionamiento de estas dos sentencias es impres-

cindible conocer bien el funcionamiento de la sentencia SELECT. Esto es así porque para poder

actualizar o eliminar datos que se han almacenado es preciso encontrarlos antes. Y por lo tanto, la

cláusula de estas sentencias que establece las condiciones de búsqueda de dichos datos (WHERE) se

especifica del mismo modo que las condiciones de búsqueda cuando se hace una consulta.

Sin embargo, antes de pasar al estudio de la sentencia SELECT se muestran algunos ejemplos de

estas dos sentencias.



-- 60 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 51

UPDATE facturas DELETE FROM facturas

SET dto = 0 WHERE codcli = 333;

WHERE dto IS NULL;

UPDATE facturas DELETE FROM facturas

SET codven = 105 WHERE iva = ( SELECT MIN(iva)

WHERE codven IN ( SELECT codven FROM facturas );

FROM vendedores

WHERE codjefe = 105 );

4.4. Estructura básica de la sentencia SELECT

La sentencia SELECT consta de varias cláusulas. A continuación se muestran algunas de ellas:

SELECT [ DISTINCT ] { * | columna [ , columna ] }

FROM tabla

[ WHERE condición_de_búsqueda ]

[ ORDER BY columna [ ASC | DESC ] [ ,columna [ ASC | DESC ] ];

El orden en que se tienen en cuenta las distintas cláusulas durante la ejecución y la función de

cada una de ellas es la siguiente:

FROM : especifica la tabla sobre la que se va a realizar la consulta.

WHERE : si sólo se debe mostrar un subconjunto de las filas de la tabla, aquí se especifica la

condición que deben cumplir las filas a mostrar; esta condición será un predicado booleano

con comparaciones unidas por AND/OR.

SELECT : aquí se especifican las columnas a mostrar en el resultado; para mostrar todas las

columnas se utiliza *.

DISTINCT : es un modificador que se utiliza tras la cláusula SELECT para que no se muestren

filas repetidas en el resultado (esto puede ocurrir sólo cuando en la cláusula SELECT se prescinde

de la clave primaria de la tabla o de parte de ella, si es compuesta).

ORDER BY : se utiliza para ordenar el resultado de la consulta.

La cláusula ORDER BY, si se incluye, es siempre la última en la sentencia SELECT. La ordenación

puede ser ascendente o descendente y puede basarse en una sola columna o en varias.



-- 61 of 227 --



52 4.4. ESTRUCTURA BÁSICA DE LA SENTENCIA SELECT

La sentencia del siguiente ejemplo muestra los datos de todos los clientes, ordenados por el

código postal descendentemente. Además, todos los clientes de un mismo código postal aparecerán

ordenados por el nombre ascendentemente.

SELECT *

FROM clientes

ORDER BY codpostal DESC, nombre;

4.4.1. Expresiones en SELECT y WHERE

En las cláusulas SELECT y WHERE, además de columnas, también se pueden incluir expresiones

que contengan columnas y constantes, así como funciones. Las columnas y expresiones especificadas

en la cláusula SELECT se pueden renombrar al mostrarlas en el resultado mediante AS.

Si el resultado de una consulta se debe mostrar ordenado según el valor de una expresión de la

cláusula SELECT, esta expresión se indica en la cláusula ORDER BY mediante el número de orden que

ocupa en la cláusula SELECT.

SELECT precio, ROUND(precio * 0.8, 2) AS rebajado

FROM articulos

ORDER BY 2;

4.4.2. Nulos

Cuando no se ha insertado un valor en una columna de una fila se dice que ésta es nula. Un nulo

no es un valor: un nulo implica ausencia de valor. Para saber si una columna es nula se debe utilizar

el operador de comparación IS NULL y para saber si no es nula, el operador es IS NOT NULL.

Cuando se realiza una consulta de datos, los nulos se pueden interpretar como valores mediante

la función COALESCE(columna, valor_si_nulo). Esta función devuelve valor_si_nulo en las filas

donde columna es nula; si no, devuelve el valor de columna.

SELECT codfac, fecha, codcli, COALESCE(iva, 0) AS iva, iva AS iva_null,

COALESCE(dto, 0) AS dto

FROM facturas

WHERE codcli < 50

AND (iva = 0 OR iva IS NULL);

Nótese que la condición (iva=0 OR iva IS NULL) se puede sustituir por COALESCE(iva,0)=0.



-- 62 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 53

4.4.3. Tipos de datos

Los tipos de datos disponibles se deben consultar en el manual del SGBD relacional que se esté

utilizando. Puesto que las prácticas de las asignaturas para las que se edita este libro se realizan

bajo PostgreSQL, se presentan aquí los tipos de datos que se han usado en este SGBD para crear

las tablas. Todos los tipos utilizados pertenecen del estándar de SQL.

VARCHAR(n) : Cadena de hasta n caracteres.

NUMERIC(n,m) : Número con n dígitos, de los cuales m se encuentran a la derecha del punto

decimal.

DATE : Fecha formada por día, mes y año. Para guardar fecha y hora se debe utilizar el tipo

TIMESTAMP.

BOOLEAN : Aunque este tipo no se ha utilizado en la base de datos de prácticas, es interesante

conocer su existencia. El valor verdadero se representa mediante TRUE y el falso mediante

FALSE. Cuando se imprimen estos valores, se muestra el carácter ’t’ para verdadero y el

carácter ’f’ para falso.

Hay que tener siempre en cuenta que el nulo no es un valor, sino que implica ausencia de valor.

El nulo se representa mediante NULL y cuando se imprime no se muestra nada.

4.5. Funciones y operadores

4.5.1. Operadores lógicos

Los operadores lógicos son AND, OR y NOT. SQL utiliza una lógica booleana de tres valores y la

evaluación de las expresiones con estos operadores es la que se muestra en la siguiente tabla:

a b a AND b a OR b NOT b

True True True True False

True False False True True

True Null Null True Null

False False False False

False Null False Null

Null Null Null Null



-- 63 of 227 --



54 4.5. FUNCIONES Y OPERADORES

4.5.2. Operadores de comparación

< Menor que.

> Mayor que.

<= Menor o igual que.

>= Mayor o igual que.

= Igual que.

<> != Distinto de.

a BETWEEN x AND y Equivale a: a >= x AND a <= y

a NOT BETWEEN x AND y Equivale a: a < x OR a > y

a IS NULL Devuelve True si a es nulo.

a IS NOT NULL Devuelve True si a es no nulo.

a IN (v1, v2, ...) Equivale a: a = v1 OR a = v2 OR ...

4.5.3. Operadores matemáticos

+ Suma.

- Resta.

* Multiplicación.

/ División (si es entre enteros, trunca el resultado).

% Resto de la división entera.

ˆ Potencia (3ˆ2 = 9).

|/ Raíz cuadrada (|/25 = 5).

||/ Raíz cúbica (||/27 = 3).

! Factorial (5! = 120).

!! Factorial como operador prefijo (!!5 = 120).

@ Valor absoluto.

No se han incluido en esta lista los operadores que realizan operaciones sobre tipos de datos

binarios.

4.5.4. Funciones matemáticas

ABS(x) Valor absoluto de x.

SIGN(x) Devuelve el signo de x (-1, 0, 1).

MOD(x,y) Resto de la división entera de x entre y.

SQRT(x) Raíz cuadrada de x.

CBRT(x) Raíz cúbica de x.



-- 64 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 55

CEIL(x) Entero más cercano por debajo de x.

FLOOR(x) Entero más cercano por encima de x.

ROUND(x) Redondea al entero más cercano.

ROUND(x,n) Redondea x a n dígitos decimales, si n es positivo. Si n es negativo, redondea al entero

más cercano a x y múltiplo de 10n.

TRUNC(x) Trunca x.

TRUNC(x,n) Trunca x a n dígitos decimales, si n es positivo. Si n es negativo, trunca al entero

más cercano por debajo de x y múltiplo de 10n.

Además de éstas, se suelen incluir otras muchas funciones para: calcular logaritmos, convertir

entre grados y radianes, funciones trigonométricas, etc. Se aconseja consultar los manuales del SGBD

que se esté utilizando para conocer las funciones que se pueden utilizar y cuál es su sintaxis.

4.5.5. Operadores y funciones de cadenas de caracteres

En SQL, las cadenas de caracteres se delimitan por comillas simples: ’cadena’. Los operadores

y funciones para trabajar con cadenas son los siguientes:

cadena || cadena Concatena dos cadenas.

cadena LIKE expr Devuelve TRUE si la cadena sigue el patrón de

la cadena que se pasa en expr. En expr se puede

utilizar comodines: _ para un solo carácter y % para

cero ó varios caracteres.

LENGTH(cadena) Número de caracteres que tiene la cadena.

CHAR_LENGTH(cadena) Es la función del estándar equivalente a LENGTH.

POSITION(subcadena IN cadena) Posición de inicio de la subcadena en la cadena.

SUBSTR(cadena, n [, long]) Devuelve la subcadena de la cadena que empieza

en la posición n (long fija el tamaño máximo

de la subcadena; si no se especifica, devuelve hasta el final).

SUBSTRING(cadena FROM n [FOR long]) Es la función del estándar equivalente a SUBSTR: devuelve

la subcadena de la cadena que empieza en la posición n

(long fija el tamaño máximo de la subcadena; si no se

especifica, devuelve hasta el final).

LOWER(cadena) Devuelve la cadena en minúsculas.

UPPER(cadena) Devuelve la cadena en mayúsculas.

BTRIM(cadena) Elimina los espacios que aparecen por delante y

por detrás en la cadena.



-- 65 of 227 --



56 4.5. FUNCIONES Y OPERADORES

LTRIM(cadena) Elimina los espacios que aparecen por delante

(izquierda) en la cadena.

RTRIM(cadena) Elimina los espacios que aparecen por detrás

(derecha) de la cadena.

BTRIM(cadena, lista) Elimina en la cadena la subcadena formada sólo por

caracteres que aparecen en la lista, tanto por delante

como por detrás.

SELECT BTRIM(’–++-+Hola+-mundo++–+-’, ’+-’);

LTRIM(cadena, lista) Funciona como BTRIM pero sólo por delante (izquierda).

RTRIM(cadena, subcadena) Funciona como BTRIM pero sólo por detrás (derecha).

TRIM(lado lista FROM cadena) Es la función del estándar equivalente a BTRIM si lado

es BOTH, equivalente a LTRIM si lado es LEADING y

equivalente a RTRIM si lado es TRAILING.

SELECT TRIM(BOTH ’+-’ FROM ’–++-+Hola+-mundo++–+-’);

CHR(n) Devuelve el carácter cuyo código ASCII viene dado por n.

INITCAP(cadena) Devuelve la cadena con la primera letra de cada palabra

en mayúscula y el resto en minúsculas.

LPAD(cadena, n, [, c]) Devuelve la cadena rellenada por la izquierda con el

carácter c hasta completar la longitud especificada

por n (si no se especifica c, se rellena de espacios).

Si la longitud de la cadena es de más de n caracteres,

se trunca por el final.

RPAD(cadena, n, [, c]) Devuelve la cadena rellenada por la derecha con el

carácter c hasta completar la longitud especificada

por n (si no se especifica c, se rellena de espacios).

Si la longitud de la cadena es de más de n caracteres,

se trunca por el final.

4.5.6. Operadores y funciones de fecha

El tipo de datos DATE2 tiene operadores y funciones, como el resto de tipos. En este apartado

se muestran aquellos más utilizados, pero se remite al lector a los manuales del SGBD que esté

utilizando para conocer el resto.

En primer lugar se verán las funciones que permiten convertir entre distintos tipos de datos.

2 En PostgreSQL se puede escoger el modo de visualizar las fechas mediante SET DATESTYLE. Para visualizar las

fechas con formato día/mes/año se debe ejecutar la orden SET DATESTYLE TO EUROPEAN, SQL;



-- 66 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 57

Todas ellas tienen la misma estructura: se les pasa un dato de un tipo, que se ha de convertir a otro

tipo según el patrón indicado mediante un formato.

TO_CHAR(dato, formato) Convierte el dato de cualquier tipo a cadena de caracteres.

TO_DATE(dato, formato) Convierte el dato de tipo cadena a fecha.

TO_NUMBER(dato, formato) Convierte el dato de tipo cadena a número.

A continuación se muestran algunos de los patrones que se pueden especificar en los formatos:

Conversiones fecha/hora:

HH Hora del día (1-12).

HH12 Hora del día (1-12).

HH24 Hora del día (1-24).

MI Minuto (00-59).

SS Segundo (00-59).

YYYY Año.

YYY Últimos tres dígitos del año.

YY Últimos dos dígitos del año.

Y Ultimo dígito del año.

MONTH Nombre del mes.

MON Nombre del mes abreviado.

DAY Nombre del día.

DY Nombre del día abreviado.

DDD Número del día dentro del año (001-366).

DD Número del día dentro del mes (01-31).

D Número del día dentro de la semana (1-7 empezando en domingo).

WW Número de la semana en el año (1-53).

W Número de la semana en el mes (1-5).

Q Número del trimestre (1-4).

Conversiones numéricas:

9 Dígito numérico.

S Valor negativo con signo menos.

. Punto decimal.

, Separador de miles.

Cuando el formato muestra un nombre, utilizando en el patrón de forma adecuada las mayúsculas

y minúsculas, se cambia el modo en que se muestra la salida. Por ejemplo, MONTH muestra el nombre



-- 67 of 227 --



58 4.5. FUNCIONES Y OPERADORES

del mes en mayúsculas, Month lo muestra sólo con la inicial en mayúscula y month lo muestra todo

en minúsculas. Cualquier carácter que se especifique en el formato y que no coincida con ningún

patrón, se copia en la salida del mismo modo en que está escrito. A continuación se muestran algunos

ejemplos:

SELECT TO_CHAR(CURRENT_TIMESTAMP, ’HH12 horas MI m. SS seg.’);

SELECT TO_CHAR(CURRENT_DATE, ’Day, dd of month, yyyy’);

SELECT TO_NUMBER(’-12,454.8’,’S99,999.9’);

Las funciones de fecha más habituales son las siguientes:

CURRENT_DATE Función del estándar que devuelve la fecha actual

(el resultado es de tipo DATE).

CURRENT_TIME Función del estándar que devuelve la hora actual

(el resultado es de tipo TIME).

CURRENT_TIMESTAMP Función del estándar que devuelve la fecha y hora actuales

(el resultado es de tipo TIMESTAMP).

EXTRACT(campo FROM dato) Función estándar que devuelve la parte del dato (fecha u hora)

indicada por campo. El resultado es de tipo DOUBLE PRECISION.

En campo se pueden especificar las siguientes partes:

day : día del mes (1:31)

dow : día de la semana (0:6 empezando en domingo)

doy : día del año (1:366)

week : semana del año

month : mes del año (1:12)

quarter : trimestre del año (1:4)

year : año

hour : hora

minute : minutos

second : segundos

A continuación se muestran algunos ejemplos de uso de estas funciones:

SELECT CURRENT_TIMESTAMP;

SELECT 365 - EXTRACT(DOY FROM CURRENT_DATE) AS dias_faltan;

SELECT EXTRACT(WEEK FROM TO_DATE(’24/09/2008’,’dd/mm/yyyy’));

Para sumar o restar días a una fecha se utilizan los operadores + y -. Por ejemplo, para sumar

siete días a la fecha actual se escribe: CURRENT_DATE + 7.



-- 68 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 59

4.5.7. Función CASE

Los lenguajes de programación procedurales suelen tener sentencias condicionales: si una condi-

ción es cierta entonces se realiza una acción, en caso contrario se realiza otra acción distinta. SQL

no es un lenguaje procedural, sin embargo permite un control condicional sobre los datos devueltos

en una consulta, mediante la función CASE.

A continuación se muestra un ejemplo que servirá para explicar el modo de uso de esta función:

SELECT codart, precio,

CASE WHEN stock > 500 THEN precio * 0.8

WHEN stock BETWEEN 200 AND 500 THEN precio * 0.9

ELSE precio

END AS precio_con_descuento

FROM articulos;

Esta sentencia muestra, para cada artículo, su código, su precio y un precio con descuento que

se obtiene en función de su stock: si el stock es superior a 500 unidades, el descuento es del 20 %

(se multiplica el precio por 0.8), si el stock está entre las 200 y las 500 unidades, el descuento es del

10 % (se multiplica el precio por 0.9) y sino, el precio se mantiene sin descuento.

La columna con el precio de descuento se renombra (precio_con_descuento). La función CASE

termina con END y puede tener tantas cláusulas WHEN . . . THEN como se precise.

4.5.8. Funciones COALESCE y NULLIF

La sintaxis de estas funciones es la siguiente:

COALESCE( valor [, ...] )

NULLIF( valor1, valor2 )

La función COALESCE devuelve el primero de sus parámetros que es no nulo. La función NULLIF

devuelve un nulo si valor1 y valor2 son iguales; si no, devuelve valor1. Estas dos funciones se

transforman internamente a expresiones equivalentes con la función CASE.

Por ejemplo, la siguiente sentencia:

SELECT codart, descrip, COALESCE(stock, stock_min, -1)

FROM articulos;

es equivalente a esta otra:

SELECT codart, descrip, CASE WHEN stock IS NOT NULL THEN stock

WHEN stock_min IS NOT NULL THEN stock_min



-- 69 of 227 --



60 4.5. FUNCIONES Y OPERADORES

ELSE -1 END

FROM articulos;

Del mismo modo, la siguiente sentencia:

SELECT codart, descrip, NULLIF(stock, stock_min)

FROM articulos;

es equivalente a esta otra:

SELECT codart, descrip, CASE WHEN stock=stock_min THEN NULL

ELSE stock END

FROM articulos;

Hay que tener siempre mucha precaución con las columnas que aceptan nulos y tratarlos ade-

cuadamente cuando se deba hacer alguna restricción (WHERE) sobre dicha columna.

4.5.9. Ejemplos

Ejemplo 4.1 Se quiere obtener un listado con el código y la fecha de las facturas del año pasado

que pertenecen a clientes cuyo código está entre el 50 y el 80. El resultado debe aparecer ordenado

por la fecha descendentemente.

Consultando la descripción de la tabla de FACTURAS puede verse que la columna fecha es de tipo

DATE. Por lo tanto, para obtener las facturas del año pasado se debe obtener el año en curso

(CURRENT_DATE) y quedarse con aquellas cuyo año es una unidad menor. El año de una fecha se

obtiene utilizando la función EXTRACT tal y como se muestra a continuación.

SELECT codfac, fecha

FROM facturas

WHERE EXTRACT(year FROM CURRENT_DATE) - EXTRACT(year FROM fecha) = 1

AND codcli BETWEEN 50 AND 80

ORDER BY fecha DESC;

Ejemplo 4.2 Mostrar la fecha actual en palabras.

SELECT TO_CHAR(CURRENT_DATE, ’Day, dd of month of yyyy’) AS fecha;

Al ejecutar esta sentencia se observa que quedan huecos demasiado grandes entre algunas palabras:

Sunday , 20 of july of 2008



-- 70 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 61

Esto es así porque para la palabra del día de la semana y la palabra del mes se está dejando el

espacio necesario para mostrar la palabra más larga que puede ir en ese lugar. Si se desea eliminar

los blancos innecesarios se debe hacer uso de la función RTRIM. Por ejemplo:

SELECT RTRIM(TO_CHAR(CURRENT_DATE, ’Day’)) ||

RTRIM(TO_CHAR(CURRENT_DATE, ’, dd of month’)) ||

TO_CHAR(CURRENT_DATE, ’ of yyyy’) AS fecha;

Sunday, 20 of july of 2008

Ejemplo 4.3 Se quiere obtener un listado con los códigos de los vendedores que han hecho ventas

al cliente cuyo código es el 54.

La información que se solicita se extrae de la tabla de FACTURAS: el código de vendedor de las facturas

de dicho cliente. Puesto que el cliente puede tener varias facturas con el mismo vendedor (codven

no es clave primaria ni clave alternativa en esta tabla), se debe utilizar el modificador DISTINCT.

SELECT DISTINCT codven

FROM facturas

WHERE codcli = 54;

Es muy importante saber de antemano cuándo se debe utilizar el modificador DISTINCT.

4.6. Operaciones sobre conjuntos de filas

En el apartado anterior se han presentado algunos de los operadores y de las funciones que se

pueden utilizar en las cláusulas SELECT y WHERE de la sentencia SELECT. Mediante estos operadores

y funciones construimos expresiones a nivel de fila. Por ejemplo, en la siguiente sentencia:

SELECT DISTINCT EXTRACT(month FROM fecha) AS meses

FROM facturas

WHERE codcli IN (45, 54, 87, 102)

AND EXTRACT(year FROM CURRENT_DATE)-1 = EXTRACT(year FROM fecha);

se parte de la tabla FACTURAS y se seleccionan las filas que cumplen la condición de la cláusula

WHERE. A continuación, se toma el valor de la fecha de cada fila seleccionada, se extrae el mes y se

muestra éste sin repeticiones.

En este apartado se muestra cómo se pueden realizar operaciones a nivel de columna, teniendo

en cuenta todas las filas de una tabla (sin cláusula WHERE) o bien teniendo en cuenta sólo algunas



-- 71 of 227 --



62 4.6. OPERACIONES SOBRE CONJUNTOS DE FILAS

de ellas (con cláusula WHERE). Además se muestra cómo las funciones de columna se pueden aplicar

sobre grupos de filas cuando se hace uso de la cláusula GROUP BY. Este uso se hace necesario cuando

los cálculos a realizar no son sobre todas las filas de una tabla o sobre un subconjunto, sino que se

deben realizar repetidamente para distintos grupos de filas.

4.6.1. Funciones de columna

En ocasiones es necesario contar datos: ¿cuántos clientes hay en Castellón? O también hacer

cálculos sobre ellos ¿a cuánto asciende el iva cobrado en la factura 3752? SQL proporciona una

serie de funciones que se pueden utilizar en la cláusula SELECT y que actúan sobre los valores de las

columnas para realizar diversas operaciones como, por ejemplo, sumarlos, obtener el valor máximo

o el valor medio, entre otros. Las funciones de columna más habituales son las que se muestran a

continuación:

COUNT(*) Cuenta filas.

COUNT(columna) Cuenta valores no nulos.

SUM(columna) Suma los valores de la columna.

MAX(columna) Obtiene el valor máximo de la columna.

MIN(columna) Obtiene el valor mínimo de la columna.

AVG(columna) Obtiene la media de los valores de la columna.

Si no se realiza ninguna restricción en la cláusula WHERE de una sentencia SELECT que utiliza

funciones de columna, éstas se aplican sobre todas las filas de la tabla especificada en la cláusula

FROM. Cuando se realiza una restricción mediante WHERE, las funciones se aplican sólo sobre las filas

que la restricción ha seleccionado.

A continuación se muestran algunos ejemplos:

SELECT AVG(cant)

FROM lineas_fac; -- cantidad media por línea de factura

SELECT AVG(cant)

FROM lineas_fac -- cantidad media por línea de factura

WHERE codart = ’TLFXK2’; -- del artículo TLFXK2

SELECT SUM(cant) AS suma, COUNT(*) AS lineas

FROM lineas_fac; -- se puede hacer varios cálculos a la vez

La función COUNT( ) realiza operaciones distintas dependiendo de su argumento:



-- 72 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 63

COUNT(*) Cuenta filas.

COUNT(columna) Cuenta el número de valores no nulos en la columna.

COUNT(DISTINCT columna) Cuenta el número de valores distintos y no nulos en la columna.

A continuación se muestra su uso mediante un ejemplo. Se ha creado una tabla P que contiene

los datos de una serie de piezas:

SELECT * FROM P;

pnum | pnombre | color | peso | ciudad

------+------------+------------+------+------------

P1 | tuerca | verde | 12 | París

P2 | perno | rojo | | Londres

P3 | birlo | azul | 17 | Roma

P4 | birlo | rojo | 14 | Londres

P5 | leva | | 12 | París

P6 | engrane | rojo | 19 | París

y se ha ejecutado la siguiente sentencia:

SELECT COUNT(*) AS cuenta1, COUNT(color) AS cuenta2,

COUNT(DISTINCT color) AS cuenta3

FROM P;

El resultado de ejecutarla será el siguiente:

cuenta1 | cuenta2 | cuenta3

---------+---------+---------

6 | 5 | 3

A la vista de los resultado se puede decir que cuenta1 contiene el número de piezas, cuenta2

contiene el número de piezas con color y cuenta3 contiene el número de colores de los que hay

piezas.

Las funciones de columna (SUM, MAX, MIN, AVG) ignoran los nulos, es decir, los nulos no se

tienen en cuenta en los cálculos. Según esto ¿coincidirá siempre el valor de media1 y media2 al

ejecutar la siguiente sentencia?

SELECT AVG(dto) AS media1, SUM(dto)/COUNT(*) AS media2

FROM lineas_fac;



-- 73 of 227 --



64 4.6. OPERACIONES SOBRE CONJUNTOS DE FILAS

La respuesta es no. En media1 se devuelve el valor medio de los descuentos no nulos, mientras que

en media2 se devuelve el valor medio de los descuentos (interpretándose los descuentos nulos como

el descuento cero).

Como se ha visto, la función AVG calcula la media de los valores no nulos de una columna. Si la

tabla de la cláusula FROM es la de artículos, la media es por artículo; si la tabla de la cláusula FROM

es la de facturas, la media es por factura. Cuando se quiere calcular otro tipo de media se debe

hacer el cálculo mediante un cociente. Por ejemplo, el número medio de facturas por mes durante

el año pasado se obtiene dividiendo el número de facturas del año pasado entre doce meses:

SELECT COUNT(*)/12 AS media_mensual

FROM facturas

WHERE EXTRACT(year FROM fecha) = EXTRACT(year FROM CURRENT_DATE) - 1;

Es importante tener en cuenta que la función COUNT devuelve un entero y que las operaciones

entre enteros devuelven resultados enteros. Es decir, la operación SELECT 2/4; devuelve el resultado

cero. Por lo tanto es conveniente multiplicar uno de los operandos por 1.0 para asegurarse de que

se opera con números reales. En este caso, será necesario redondear los decimales del resultado a lo

que sea preciso:

SELECT ROUND(COUNT(*)*1.0/12,2) AS media_mensual

FROM facturas

WHERE EXTRACT(year FROM fecha) = EXTRACT(year FROM CURRENT_DATE) - 1;

4.6.2. Cláusula GROUP BY

La cláusula GROUP BY forma grupos con las filas que tienen en común los valores de una o

varias columnas. Sobre cada grupo se pueden aplicar las funciones de columna que se han estado

utilizando hasta ahora (SUM, MAX, MIN, AVG, COUNT), denominándose ahora funciones de grupo.

Estas funciones, utilizadas en la cláusula SELECT, se aplican una vez para cada grupo.

La siguiente sentencia cuenta cuántas facturas tiene cada cliente el año pasado:

SELECT codcli, COUNT(*)

FROM facturas

WHERE EXTRACT(year FROM fecha) = EXTRACT(year FROM CURENT_DATE) - 1

GROUP BY codcli;

El modo en que se ejecuta la sentencia se explica a continuación. Se toma la tabla de facturas

(FROM) y se seleccionan las filas que cumplen la restricción (WHERE). A continuación, las facturas se

separan en grupos, de modo que en un mismo grupo sólo hay facturas de un mismo cliente (GROUP



-- 74 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 65

BY codcli), habiendo tantos grupos como clientes hay con facturas del año pasado. Finalmente, de

cada grupo se muestra el código del cliente y el número de facturas que hay en el grupo (son las

facturas de ese cliente): COUNT(*).

4.6.3. Cláusula HAVING

En la cláusula HAVING, que puede aparecer tras GROUP BY, se utilizan las funciones de grupo

para hacer restricciones sobre los grupos que se han formado. La sintaxis de la sentencia SELECT,

tal y como se ha visto hasta el momento, es la siguiente:

SELECT [ DISTINCT ] { * | columna [ , columna ] }

FROM tabla

[ WHERE condición_de_búsqueda ]

[ GROUP BY columna [, columna ]

[ HAVING condición_para_el_grupo ] ]

[ ORDER BY columna [ ASC | DESC ] [ , columna [ ASC | DESC ] ];

En las consultas que utilizan GROUP BY se obtiene una fila por cada uno de los grupos producidos.

Para ejecutar la cláusula GROUP BY se parte de las filas de la tabla que cumplen el predicado estable-

cido en la cláusula WHERE y se agrupan en función de los valores comunes en la columna o columnas

especificadas. Mediante la cláusula HAVING se realiza una restricción sobre los grupos obtenidos por

la cláusula GROUP BY, seleccionándose aquellos que cumplen el predicado establecido en la condición.

Es importante destacar que en la condición de la cláusula HAVING sólo pueden aparecer columnas

por las que se ha agrupado y funciones de grupo sobre cualquier otra columna de la tabla. Lo mismo

ocurre en la cláusula SELECT: sólo se pueden mostrar columnas que aparecen en la cláusula GROUP

BY y funciones de grupo sobre cualquier otra columna. Cuando en las cláusulas SELECT o HAVING

aparecen columnas que no se han especificado en la cláusula GROUP BY y que tampoco están afectadas

por una función de grupo, se produce un error.

4.6.4. Ejemplos

Ejemplo 4.4 Se quiere obtener el importe medio por factura, sin tener en cuenta los descuentos ni

el iva.

El importe medio por factura se calcula obteniendo primero la suma del importe de todas las facturas

y dividiendo después el resultado entre el número total de facturas. La suma del importe de todas

las facturas se obtiene sumando el importe de todas las líneas de factura. El importe de cada línea

se calcula multiplicando el número de unidades pedidas (cant) por el precio unitario (precio).

Por lo tanto, la solución a este ejercicio es la siguiente:



-- 75 of 227 --



66 4.6. OPERACIONES SOBRE CONJUNTOS DE FILAS

SELECT ROUND(SUM(cant*precio)/COUNT(DISTINCT codfac),2) AS importe_medio

FROM lineas_fac;

Se ha redondeado a dos decimales porque el resultado es una cantidad en euros.

Ejemplo 4.5 Se quiere obtener la fecha de la primera factura del cliente cuyo código es el 210,

la fecha de su última factura (la más reciente) y el número de días que han pasado entre ambas

facturas.

Como se ha comentado antes, algunas funciones de columna se pueden utilizar también sobre las

fechas. En general, las funciones MIN y MAX se pueden utilizar sobre todo aquel tipo de datos en el

que haya definida una ordenación: tipos numéricos, cadenas y fechas.

Ambas funciones sirven, por lo tanto, para obtener la fecha de la primera y de la última factura.

Restando ambas fechas se obtiene el número de días que hay entre ambas.

SELECT MIN(fecha) AS primera, MAX(fecha) AS ultima,

MAX(fecha) - MIN(fecha) AS dias

FROM facturas

WHERE codcli = 210;

Ejemplo 4.6 Se quiere obtener un listado con los clientes que tienen más de cinco facturas con

16 % de iva, indicando cuántas de ellas tiene cada uno.

Para resolver este ejercicio se deben tomar las facturas (tabla FACTURAS) y seleccionar aquellas con

16 % de iva (WHERE). A continuación se deben agrupar las facturas (GROUP BY) de manera que haya

un grupo para cada cliente (columna codcli). Una vez formados los grupos, se deben seleccionar

aquellos que contengan más de cinco facturas (HAVING). Por último, se debe mostrar (SELECT) el

código de cada cliente y su número de facturas.

SELECT codcli, COUNT(*) AS facturas

FROM facturas

WHERE iva = 16

GROUP BY codcli

HAVING COUNT(*) > 5;

Ejemplo 4.7 Se quiere obtener un listado con el número de facturas que hay en cada año, de modo

que aparezca primero el año con más facturas. Además, para cada año se debe mostrar el número

de clientes que han hecho compras y en cuántos días del año se han realizado éstas.



-- 76 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 67

SELECT EXTRACT(year FROM fecha) AS año, COUNT(*) AS nfacturas,

COUNT(DISTINCT codcli) AS nclientes,

COUNT(DISTINCT codven) AS nvendedores,

COUNT(DISTINCT fecha) AS ndias

FROM facturas

GROUP BY EXTRACT(year FROM fecha)

ORDER BY nfacturas DESC; -- nfacturas es el nombre que se ha

-- dado a COUNT(*) en el SELECT

Como se ve en el ejemplo, es posible utilizar expresiones en la cláusula GROUP BY. Por otra parte,

el ejemplo también muestra cómo en la cláusula ORDER BY se puede hacer referencia a los nombres

con que se renombran las expresiones del SELECT. Esto es así porque la cláusula ORDER BY se ejecuta

tras el SELECT.

Ejemplo 4.8 De los clientes cuyo código está entre el 240 y el 250, mostrar el número de facturas

que cada uno tiene con cada iva distinto.

SELECT codcli, COALESCE(iva,0) AS iva, COUNT(*) AS facturas

FROM facturas

WHERE codcli BETWEEN 240 AND 250

GROUP BY codcli, COALESCE(iva,0);

Para resolver el ejercicio, se han agrupado las facturas teniendo en cuenta dos criterios: el cliente

y el iva. De este modo, quedan en el mismo grupo las facturas que son de un mismo cliente y con

un mismo tipo de iva. Puesto que en la base de datos con que se trabaja se debe interpretar el iva

nulo como cero, se ha utilizado la función COALESCE. Si no se hubiera hecho esto, las facturas de

cada cliente con iva nulo habrían dado lugar a un nuevo grupo (distinto del de iva cero), ya que la

cláusula GROUP BY no ignora los nulos sino que los toma como si fueran todos un mismo valor.

4.6.5. Algunas cuestiones importantes

A continuación se plantean algunas cuestiones que es importante tener en cuenta cuando se

realizan agrupaciones.

Cuando se utilizan funciones de grupo en la cláusula SELECT sin que haya GROUP BY, el resul-

tado de ejecutar la consulta tiene una sola fila.

A diferencia del resto de funciones que proporciona SQL, las funciones de grupo sólo se utilizan

en las cláusulas SELECT y HAVING, nunca en la cláusula WHERE.



-- 77 of 227 --



68 4.7. SUBCONSULTAS

La sentencia SELECT tiene dos cláusulas para realizar restricciones: WHERE y HAVING. Es muy

importante saber situar cada restricción en su lugar: las restricciones que se deben realizar

a nivel de filas, se sitúan en la cláusula WHERE; las restricciones que se deben realizar sobre

grupos (normalmente involucran funciones de grupo), se sitúan en la cláusula HAVING.

El modificador DISTINCT puede ser necesario en la cláusula SELECT de una sentencia que tiene

GROUP BY sólo cuando las columnas que se muestren en la cláusula SELECT no sean todas las

que aparecen en la cláusula GROUP BY.

Una vez formados los grupos mediante la cláusula GROUP BY (son grupos de filas, no hay que

olvidarlo), del contenido de cada grupo sólo es posible conocer el valor de las columnas por las

que se ha agrupado (ya que dentro del grupo, todas las filas tienen dichos valores en común),

por lo que sólo estas columnas son las que pueden aparecer, directamente, en las cláusulas

SELECT y HAVING. Además, en estas cláusulas, se pueden incluir funciones de grupo que actúen

sobre las columnas que no aparecen en la cláusula GROUP BY.

4.7. Subconsultas

Una subconsulta es una sentencia SELECT anidada en otra sentencia SQL, que puede ser otra

SELECT o bien cualquier sentencia de manejo de datos (INSERT, UPDATE, DELETE). En este apartado

se muestra cómo el uso de subconsultas en las cláusulas WHERE y HAVING otorga mayor potencia para

la realización de restricciones. Además, en este apartado se introduce el uso de subconsultas en la

cláusula FROM.

Las subconsultas se pueden anidar unas dentro de otras tanto como sea necesario3.

4.7.1. Subconsultas en la cláusula WHERE

La cláusula WHERE se utiliza para realizar restricciones a nivel de filas. El predicado que se evalúa

para realizar una restricción está formado por comparaciones unidas por los operadores AND/OR.

Cada comparación involucra dos operandos que pueden ser:

(a) Dos columnas de la tabla sobre la que se realiza la consulta.

SELECT * -- artículos cuyo stock es el mínimo deseado

FROM articulos

WHERE stock = stock_min;

(b) Una columna de la tabla de la consulta y una constante.

3Cada SGBD puede tener un nivel máximo de anidamiento, que difícilmente se alcanzará.



-- 78 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 69

SELECT * -- artículos cuya descripción empieza por prolong

FROM articulos

WHERE UPPER(descrip) LIKE ’PROLONG%’;

(c) Una columna o una constante y una subconsulta sobre alguna tabla de la base de datos.

SELECT * -- artículos vendidos con descuento mayor del 45%

FROM articulos

WHERE codart IN ( SELECT codart FROM lineas_fac WHERE dto > 45 );

Además de los dos operandos, cada comparación se realiza con un operador. Hay una serie de

operadores que se pueden utilizar con las subconsultas para establecer predicados en las restricciones.

Son los que se muestran a continuación.

expresión operador ( subconsulta )

En este predicado la subconsulta debe devolver un solo valor (una fila con una columna).

El predicado se evalúa a verdadero si la comparación indicada por el operador (=, <>, >,

<, >=, <=), entre el resultado de la expresión y el de la subconsulta, es verdadero. Si la

subconsulta devuelve más de un valor (una columna con varias filas o más de una columna),

se produce un error de ejecución.

SELECT * -- facturas con descuento máximo

FROM facturas

WHERE dto = ( SELECT MAX(dto) FROM facturas );

(expr1, expr2, ...) operador ( subconsulta )

En un predicado de este tipo, la subconsulta debe devolver una sola fila y tantas columnas

como las especificadas entre paréntesis a la izquierda del operador.

Las expresiones de la izquierda expr1, expr2, ... se evalúan y la fila que forman se compara,

utilizando el operador, con la fila que devuelve la subconsulta.

El predicado se evalúa a verdadero si el resultado de la comparación es verdadero para la fila

devuelta por la subconsulta. En caso contrario se evalúa a falso. Si la subconsulta no devuelve

ninguna fila, se evalúa a nulo4.

Dos filas se consideran iguales si los atributos correspondientes son iguales y no nulos en ambas;

se consideran distintas si algún atributo es distinto en ambas filas y no nulo. En cualquier otro

caso, el resultado del predicado es desconocido (nulo).

4Hay que tener en cuenta que una restricción se cumple si el resultado de su predicado es verdadero; si el predicado

es falso o nulo, se considera que la restricción no se cumple.



-- 79 of 227 --



70 4.7. SUBCONSULTAS

Si la subconsulta devuelve más de una fila, se produce un error de ejecución.

SELECT * -- facturas con descuento máximo e iva máximo

FROM facturas

WHERE (dto, iva) = ( SELECT MAX(dto), MAX(iva) FROM facturas );

expresión IN ( subconsulta )

El operador IN ya ha sido utilizado anteriormente, especificando una lista de valores entre

paréntesis. Otro modo de especificar esta lista de valores es incluyendo una subconsulta que

devuelva una sola columna. En este caso, el predicado se evalúa a verdadero si el resultado de

la expresión es igual a alguno de los valores de la columna devuelta por la subconsulta.

El predicado se evalúa a falso si no se encuentra ningún valor en la subconsulta que sea igual

a la expresión; cuando la subconsulta no devuelve ninguna fila, también se evalúa a falso.

Si el resultado de la expresión es un nulo, o ninguno de los valores de la subconsulta es igual

a la expresión y la subconsulta ha devuelto algún nulo, el predicado se evalúa a nulo.

SELECT codpue, nombre -- pueblos en donde hay algún cliente

FROM pueblos

WHERE codpue IN ( SELECT codpue FROM clientes);

(expr1, expr2, ...) IN ( subconsulta )

En este predicado la subconsulta debe devolver tantas columnas como las especificadas entre

paréntesis a la izquierda del operador IN.

Las expresiones de la izquierda expr1, expr2, ... se evalúan y la fila que forman se compara

con las filas de la subconsulta, una a una.

El predicado se evalúa a verdadero si se encuentra alguna fila igual en la subconsulta. En caso

contrario se evalúa a falso (incluso si la subconsulta no devuelve ninguna fila).

Dos filas se consideran iguales si los atributos correspondientes son iguales y no nulos en ambas;

se consideran distintas si algún atributo es distinto en ambas filas y no nulo. En cualquier otro

caso, el resultado del predicado es desconocido (nulo).

Si la subconsulta devuelve alguna fila de nulos y el resto de las filas son distintas de la fila de

la izquierda del operador IN, el predicado se evalúa a nulo.

SELECT DISTINCT codcli -- clientes que han comprado en algún mes

FROM facturas -- en que ha comprado el cliente especificado

WHERE ( EXTRACT(month FROM fecha), EXTRACT(year FROM fecha) )



-- 80 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 71

IN ( SELECT EXTRACT(month FROM fecha), EXTRACT(year FROM fecha)

FROM facturas

WHERE codcli = 282);

expresión NOT IN ( subconsulta )

Cuando IN va negado, el predicado se evalúa a verdadero si la expresión es distinta de todos

los valores de la columna devuelta por la subconsulta.

También se evalúa a verdadero cuando la subconsulta no devuelve ninguna fila. Si se encuentra

algún valor igual a la expresión, se evalúa a falso.

Si el resultado de la expresión es un nulo, o si la subconsulta devuelve algún nulo y valores

distintos a la expresión, el predicado se evalúa a nulo.

SELECT COUNT(*) -- número de clientes que no tienen facturas

FROM clientes

WHERE codcli NOT IN ( SELECT codcli

FROM facturas

WHERE codcli IS NOT NULL );

Nótese que en el ejemplo se ha incluido la restricción codcli IS NOT NULL en la subconsulta

porque la columna FACTURAS.codcli acepta nulos. Un nulo en esta columna haría que el

predicado NOT IN se evaluara a nulo para todos los clientes de la consulta principal.

(expr1, expr2, ...) NOT IN ( subconsulta )

En este predicado la subconsulta debe devolver tantas columnas como las especificadas en-

tre paréntesis a la izquierda del operador NOT IN. Las expresiones de la izquierda expr1,

expr2, ... se evalúan y la fila que forman se compara con las filas de la subconsulta, fila a

fila.

El predicado se evalúa a verdadero si no se encuentra ninguna fila igual en la subconsulta.

También se evalúa a verdadero si la subconsulta no devuelve ninguna fila. Si se encuentra

alguna fila igual, se evalúa a falso.

Dos filas se consideran iguales si los atributos correspondientes son iguales y no nulos en ambas;

se consideran distintas si algún atributo es distinto en ambas filas y no nulo. En cualquier otro

caso, el resultado del predicado es desconocido (nulo).

Si la subconsulta devuelve alguna fila de nulos y el resto de las filas son distintas de la fila de

la izquierda del operador NOT IN, el predicado se evalúa a nulo.



-- 81 of 227 --



72 4.7. SUBCONSULTAS

SELECT DISTINCT codcli -- clientes que no tienen facturas con iva y dto

FROM facturas -- como tienen los clientes del rango especificado

WHERE ( COALESCE(iva,0), COALESCE(dto,0) )

NOT IN ( SELECT COALESCE(iva,0), COALESCE(dto,0)

FROM facturas

WHERE codcli BETWEEN 171 AND 174);

expresión operador ANY ( subconsulta )

En este uso de ANY la subconsulta debe devolver una sola columna. El operador es una

comparación (=, <>, >, <, >=, <=).

El predicado se evalúa a verdadero si la comparación establecida por el operador es verdadera

para alguno de los valores de la columna devuelta por la subconsulta. En caso contrario se

evalúa a falso.

SELECT * -- facturas con descuentos como los de las facturas sin iva

FROM facturas

WHERE dto = ANY( SELECT dto FROM facturas WHERE COALESCE(iva,0) = 0 );

Si la subconsulta no devuelve ninguna fila, devuelve falso. Si ninguno de los valores de la

subconsulta coincide con la expresión de la izquierda del operador y en la subconsulta se ha

devuelto algún nulo, se evalúa a nulo.

En lugar de ANY puede aparecer SOME, son sinónimos. El operador IN es equivalente a = ANY.

(expr1, expr2, ...) operador ANY ( subconsulta )

En este uso de ANY la subconsulta debe devolver tantas columnas como las especificadas entre

paréntesis a la izquierda del operador. Las expresiones de la izquierda expr1, expr2, ... se

evalúan y la fila que forman se compara con las filas de la subconsulta, fila a fila. En la versión

actual de PostgreSQL sólo se pueden utilizar los operadores =, <>.

El predicado se evalúa a verdadero si la comparación establecida por el operador es verdadera

para alguna de las filas devueltas por la subconsulta. En caso contrario se evalúa a falso

(incluso si la subconsulta no devuelve ninguna fila).

Dos filas se consideran iguales si los atributos correspondientes son iguales y no nulos en ambas;

se consideran distintas si algún atributo es distinto en ambas filas y no nulo. En cualquier otro

caso, el resultado del predicado es desconocido (nulo).

Si la subconsulta devuelve alguna fila de nulos, el predicado no podrá ser falso (será verdadero

o nulo).



-- 82 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 73

SELECT DISTINCT codcli -- clientes que han comprado algún mes

FROM facturas -- en que ha comprado el cliente especificado

WHERE ( EXTRACT(month FROM fecha), EXTRACT(year FROM fecha) )

= ANY( SELECT EXTRACT(month FROM fecha), EXTRACT(year FROM fecha)

FROM facturas

WHERE codcli = 282);

En lugar de ANY puede aparecer SOME, son sinónimos.

expresión operador ALL ( subconsulta )

En este uso de ALL la subconsulta debe devolver una sola columna. El operador es una

comparación (=, <>, >, <, >=, <=).

El predicado se evalúa a verdadero si la comparación establecida por el operador es verdadera

para todos los valores de la columna devuelta por la subconsulta. También se evalúa a verda-

dero cuando la subconsulta no devuelve ninguna fila. En caso contrario se evalúa a falso. Si

la subconsulta devuelve algún nulo, el predicado se evalúa a nulo

SELECT * -- facturas con descuento máximo

FROM facturas

WHERE dto >= ALL ( SELECT COALESCE(dto,0) FROM facturas );

Nótese que, si en el ejemplo anterior, la subconsulta no utiliza COALESCE para convertir los

descuentos nulos en descuentos cero, la consulta principal no devuelve ninguna fila porque al

haber nulos en el resultado de la subconsulta, el predicado se evalúa a nulo.

El operador NOT IN es equivalente a <>ALL.

(expr1, expr2, ...) operador ALL ( subconsulta )

En este uso de ALL la subconsulta debe devolver tantas columnas como las especificadas entre

paréntesis a la izquierda del operador.

Las expresiones de la izquierda expr1, expr2, ... se evalúan y la fila que forman se compara

con las filas de la subconsulta, fila a fila. En la versión actual de PostgreSQL sólo se pueden

utilizar los operadores =, <>.

El predicado se evalúa a verdadero si la comparación establecida por el operador es verdadera

para todas las filas devueltas por la subconsulta; cuando la subconsulta no devuelve ninguna

fila también se evalúa a verdadero. En caso contrario se evalúa a falso.



-- 83 of 227 --



74 4.7. SUBCONSULTAS

Dos filas se consideran iguales si los atributos correspondientes son iguales y no nulos en ambas;

se consideran distintas si algún atributo es distinto en ambas filas y no nulo. En cualquier otro

caso, el resultado del predicado es desconocido (nulo).

Si la subconsulta devuelve alguna fila de nulos, el predicado no podrá ser verdadero (será falso

o nulo).

SELECT * -- muestra los datos del cliente especificado si

FROM clientes -- siempre ha comprado sin descuento y con 16% de iva

WHERE codcli = 162

AND ( 16, 0 ) = ALL (SELECT COALESCE(iva,0), COALESCE(dto,0)

FROM facturas

WHERE codcli = 162 );

Cuando se utilizan subconsultas en predicados, el SGBD no obtiene el resultado completo de la

subconsulta, a menos que sea necesario. Lo que hace es ir obteniendo filas de la subconsulta hasta

que es capaz de determinar si el predicado es verdadero.

4.7.2. Subconsultas en la cláusula HAVING

La cláusula HAVING permite hacer restricciones sobre grupos y necesariamente va precedida de

una cláusula GROUP BY. Para hacer este tipo de restricciones también es posible incluir subconsultas

cuando sea necesario.

La siguiente consulta obtiene el código del pueblo que tiene más clientes:

SELECT codpue

FROM clientes

GROUP BY codpue

HAVING COUNT(*) >= ALL ( SELECT COUNT(*)

FROM clientes

GROUP BY codpue );

En primer lugar se ejecuta la subconsulta, obteniéndose una columna de números en donde cada

uno indica el número de clientes en cada pueblo. La subconsulta se sustituye entonces por los valores

de esta columna, por ejemplo:

SELECT codpue

FROM clientes

GROUP BY codpue

HAVING COUNT(*) >= ALL (1,4,7,9,10);



-- 84 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 75

Por último se ejecuta la consulta principal. Para cada grupo se cuenta el número de clientes que

tiene. Pasan la restricción del HAVING aquel o aquellos pueblos que en esa cuenta tienen el máximo

valor.

4.7.3. Subconsultas en la cláusula FROM

También es posible incluir subconsultas en la cláusula FROM, aunque en este caso no se utilizan

para construir predicados sino para realizar una consulta sobre la tabla que se obtiene como resultado

de ejecutar otra consulta. Siempre que se utilice una subconsulta en el FROM se debe dar un nombre

a la tabla resultado mediante la cláusula AS.

SELECT COUNT(*), MAX(ivat), MAX(dtot)

FROM ( SELECT DISTINCT COALESCE(iva,0) AS ivat, COALESCE(dto,0) AS dtot

FROM facturas ) AS t;

La consulta anterior cuenta las distintas combinaciones de iva y descuento y muestra el valor máximo

de éstos. Nótese que se han renombrado las columnas de la subconsulta para poder referenciarlas

en la consulta principal. Esta consulta no se puede resolver si no es de este modo ya que COUNT no

acepta una lista de columnas como argumento.

4.7.4. Ejemplos

Ejemplo 4.9 Se quiere obtener los datos completos del cliente al que pertenece la factura 5886.

Para dar la respuesta podemos hacerlo en dos pasos, es decir, con dos consultas separadas:

SELECT codcli FROM facturas WHERE codfac = 5886;

codcli

--------

264

SELECT *

FROM clientes

WHERE codcli = 264;

codcli | nombre | direccion | codpostal | codpue

--------+-----------------------------+--------------------+-----------+--------

264 | ADELL VILLALONGA, LUIS JOSE | MANUEL BECERRA, 61 | 12712 | 28097



-- 85 of 227 --



76 4.7. SUBCONSULTAS

Puesto que es posible anidar las sentencias SELECT para obtener el resultado con una sola consulta,

una solución que obtiene el resultado en un solo paso es la siguiente:

SELECT *

FROM clientes

WHERE codcli = ( SELECT codcli FROM facturas WHERE codfac = 5886 );

Se ha utilizado el operador de comparación = porque se sabe con certeza que la subconsulta

devuelve un solo código de cliente, ya que la condición de búsqueda es de igualdad sobre la clave

primaria de la tabla del FROM.

Ejemplo 4.10 Se quiere obtener los datos completos de los clientes que tienen facturas en agosto

del año pasado. El resultado se debe mostrar ordenado por el nombre del cliente.

De nuevo se puede dar la respuesta en dos pasos:

SELECT codcli FROM facturas

WHERE EXTRACT(month FROM fecha)=8

AND EXTRACT(year FROM fecha) = EXTRACT(year FROM CURRENT_DATE)-1;

codcli

--------

105

12

.

.

.

342

309

357

SELECT *

FROM clientes

WHERE codcli IN (105,12,...,342,309,357);

codcli | nombre | direccion | codpostal | codpue

--------+--------------------------------+------------------------+-----------+--------

105 | EGEA HERNANDEZ, CARLOS ANTONIO | PASAJE PEÑAGOLOSA, 108 | 37812 | 31481

12 | VIVES GOZALBO, INMACULADA | DE BAIX, 123 | 50769 | 21104

....



-- 86 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 77

Se ha utilizado el operador IN porque la primera consulta devuelve varias filas. Esto debe saberse

sin necesidad de probar la sentencia. Como esta vez no se seleccionan las facturas por una columna

única (clave primaria o clave alternativa), es posible que se obtengan varias filas y por lo tanto se

debe utilizar IN.

Tal y como se ha hecho en el ejemplo anterior, ambas sentencias pueden integrarse en una sola:

SELECT *

FROM clientes

WHERE codcli IN ( SELECT codcli FROM facturas

WHERE EXTRACT(month FROM fecha)=8

AND EXTRACT(year FROM fecha) =

EXTRACT(year FROM CURRENT_DATE)-1 )

ORDER BY nombre;

4.7.5. Algunas cuestiones importantes

A continuación se plantean algunas cuestiones que es importante tener en cuenta cuando se

realizan subconsultas.

Las subconsultas utilizadas en predicados del tipo expresión operador ( subconsulta ) o

(expr1, expr2, ...) operador ( subconsulta ) deben devolver siempre una sola fila; en

otro caso, se producirá un error. Si la subconsulta ha de devolver varias filas se debe utilizar

IN, NOT IN, operador ANY, operador ALL.

Es importante ser cuidadosos con las subconsultas que pueden devolver nulos. Una restricción

se supera si el predicado se evalúa a verdadero; no se supera si se evalúa a falso o a nulo. Dos

casos que no conviene olvidar son los siguientes:

• NOT IN se evalúa a verdadero cuando la subconsulta no devuelve ninguna fila; si la sub-

consulta devuelve un nulo/fila de nulos, se evalúa a nulo.

• operador ALL se evalúa a verdadero cuando la subconsulta no devuelve ninguna fila; si

la subconsulta devuelve un nulo/fila de nulos, se evalúa a nulo.

Cuando se utilizan subconsultas en la cláusula FROM es preciso renombrar las columnas del

SELECT de la subconsulta que son expresiones. De ese modo será posible hacerles referencia en

la consulta principal. Además, la tabla resultado de la subconsulta también se debe renombrar

en el FROM de la consulta principal.



-- 87 of 227 --



78 4.8. CONSULTAS MULTITABLA

4.8. Consultas multitabla

En este apartado se muestra cómo hacer consultas que involucran a datos de varias tablas.

Aunque mediante las subconsultas se ha conseguido realizar consultas de este tipo, aquí se verá que

en ocasiones, es posible escribir consultas equivalentes que no hacen uso de subconsultas y que se

ejecutan de modo más eficiente. El operador que se introduce es la concatenación (JOIN).

4.8.1. La concatenación: JOIN

La concatenación es una de las operaciones más útiles del lenguaje SQL. Esta operación permite

combinar información de varias tablas sin necesidad de utilizar subconsultas para ello.

La concatenación natural (NATURAL JOIN) de dos tablas R y S obtiene como resultado una tabla

cuyas filas son todas las filas de R concatenadas con todas las filas de S que en las columnas que se

llaman igual tienen los mismos valores. Las columnas por las que se hace la concatenación aparecen

una sola vez en el resultado.

La siguiente sentencia hace una concatenación natural de las tablas FACTURAS y CLIENTES. Ambas

tablas tienen una columna con el mismo nombre, codcli, siendo FACTURAS.codcli una clave ajena

a CLIENTES.codcli (clave primaria).

SELECT *

FROM facturas NATURAL JOIN clientes;

Según la definición de la operación NATURAL JOIN, el resultado tendrá las siguientes columnas:

codfac, fecha, codven, iva, dto, codcli, nombre, direccion, codpostal, codpro. En el

resultado de la concatenación cada fila representa una factura que cuenta con sus datos (la cabecera)

y los datos del cliente al que pertenece. Si alguna factura tiene codcli nulo, no aparece en el resultado

de la concatenación puesto que no hay ningún cliente con el que pueda concatenarse.

Cambiando el contenido de la cláusula SELECT, cambia el resultado de la consulta. Por ejemplo:

SELECT DISTINCT codcli, nombre, direccion, codpostal, codpue

FROM facturas NATURAL JOIN clientes;

Esta sentencia muestra los datos de los clientes que tienen facturas. Puesto que se ha hecho la

concatenación, si hay clientes que no tienen facturas, no se obtienen en el resultado ya que no tienen

ninguna factura con la que concatenarse.

A continuación se desea modificar la sentencia anterior para que se obtenga también el nombre

de la población del cliente. Se puede pensar que el nombre de la población se puede mostrar tras

hacer una concatenación natural con la tabla PUEBLOS. El objetivo es concatenar cada cliente con

su población a través de la clave ajena codpue, sin embargo, la concatenación natural no es útil en



-- 88 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 79

este caso porque las tablas PUEBLOS y CLIENTES tienen también otra columna que se llama igual: la

columna nombre. CLIENTES.nombre contiene el nombre de cada cliente y PUEBLOS.nombre contiene

el nombre de cada pueblo. Ambos nombres no significan lo mismo, por lo que la concatenación

natural a través de ellas no permite obtener el resultado que se desea.

¿Qué se obtendrá como resultado al ejecutar la siguiente sentencia?

SELECT *

FROM facturas NATURAL JOIN clientes NATURAL JOIN pueblos;

Se obtendrán las facturas de los clientes cuyo nombre completo coincide con el nombre de su pueblo.

Cuando se quiere concatenar varias tablas que tienen varios nombres de columnas en común y

no todos han de utilizarse para realizar la concatenación, se puede disponer de la operación INNER

JOIN, que permite especificar las columnas sobre las que hacer la operación mediante la cláusula

USING.

SELECT DISTINCT codcli, clientes.nombre, codpue, pueblos.nombre

FROM facturas INNER JOIN clientes USING (codcli)

INNER JOIN pueblos USING (codpue);

Nótese que, en la consulta anterior, algunas columnas van precedidas por el nombre de la tabla

a la que pertenecen. Esto es necesario cuando hay columnas que se llaman igual en el resultado:

se especifica el nombre de la tabla para evitar ambigüedades. Esto sucede cuando las tablas que

se concatenan tienen nombres de columnas en común y la concatenación no se hace a través de

ellas, como ha sucedido en el ejemplo con las columnas CLIENTES.nombre y PUEBLOS.nombre. En el

resultado hay dos columnas nombre y, sin embargo, una sola columna codcli y una sola columna

codpue (estas dos últimas aparecen sólo una vez porque las concatenaciones se han hecho a través

de ellas).

En realidad, en SQL el nombre de cada columna está formado por el nombre de su tabla,

un punto y el nombre de la columna (FACTURAS.iva, CLIENTES.nombre). Por comodidad, cuando

no hay ambigüedad al referirse a una columna, se permite omitir el nombre de la tabla a la que

pertenece, que es lo que se había estado haciendo hasta ahora.

Cuando las columnas por las que se hace la concatenación no se llaman igual en las dos tablas,

se utiliza ON para especificar la condición de concatenación de ambas columnas, tal y como se ve en

el siguiente ejemplo. En él se introduce también el uso de alias para las tablas, lo que permite no

tener que escribir el nombre completo para referirse a sus columnas:

SELECT v.codven, v.nombre AS vendedor, j.codven AS codjefe, j.nombre AS jefe

FROM vendedores AS v INNER JOIN vendedores AS j ON (v.codjefe=j.codven);



-- 89 of 227 --



80 4.8. CONSULTAS MULTITABLA

Esta sentencia obtiene el código y el nombre de cada vendedor, junto al código y el nombre del

vendedor que es su jefe.

Es aconsejable utilizar siempre alias para las tablas cuando se hagan consultas multitabla, y

utilizarlos para especificar todas las columnas, aunque no haya ambigüedad. Es una cuestión de

estilo.

Ya que este tipo de concatenación (INNER JOIN) es el más habitual, se permite omitir la palabra

INNER al especificarlo, tal y como se muestra en el siguiente ejemplo:

SELECT DISTINCT c.codcli, c.nombre, c.codpue, p.nombre

FROM facturas AS f JOIN clientes AS c USING (codcli)

JOIN pueblos AS p USING (codpue)

WHERE COALESCE(f.iva,0) = 16

AND COALESCE(f.dto,0) = 0;

Aunque la operación de NATURAL JOIN es la que originalmente se definió en el modelo relacional,

su uso en SQL no es aconsejable puesto que la creación de nuevas columnas en tablas de la base de

datos puede dar lugar a errores en las sentencias que las consultan, si estas nuevas columnas tienen

el mismo nombre que otras columnas de otras tablas con las que se han de concatenar.

Es recomendable, al construir las concatenaciones, especificar las tablas en el mismo orden en

el que aparecen en el diagrama referencial (figura 4.2). De este modo será más fácil depurar las

sentencias, así como identificar qué hace cada una: en el resultado de una consulta escrita de este

modo, cada fila representará lo mismo que representa cada fila de la primera tabla que aparezca en

la cláusula FROM y en este resultado habrá, como mucho, tantas filas como filas hay en dicha tabla.

LINEAS_FAC FACTURAS CLIENTES

## VENDEDORES	ARTICULOS

## PUEBLOS PROVINCIAS

Figura 4.2: Diagrama referencial de la base de datos.

Hay un aspecto que todavía no se han tenido en cuenta: los nulos en las columnas a través de

las que se realizan las concatenaciones. Por ejemplo, si se quiere obtener un listado con las facturas

del mes de diciembre del año pasado, donde aparezcan los nombres del cliente y del vendedor, se

puede escribir la siguiente consulta:



-- 90 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 81

SELECT f.codfac, f.fecha, f.codcli, c.nombre, f.codven, v.nombre

FROM facturas AS f JOIN clientes AS c USING (codcli)

JOIN vendedores AS v USING (codven)

WHERE EXTRACT(month FROM f.fecha) = 12

AND EXTRACT(year FROM f.fecha) = EXTRACT(year FROM CURRENT_DATE)-1;

De todas las facturas que hay en dicho mes, aparecen en el resultado sólo algunas. Esto es debido a

que las columnas FACTURAS.codcli y FACTURAS.codven aceptan nulos. Las facturas con algún nulo

en alguna de estas columnas son las que no aparecen en el resultado.

Para evitar estos problemas, se puede hacer uso de la operación OUTER JOIN con tres variantes:

LEFT, RIGHT, FULL. Con LEFT/RIGHT OUTER JOIN en el resultado se muestran todas las filas de

la tabla de la izquierda/derecha. Aquellas que no tienen nulos en la columna de concatenación, se

concatenan con las filas de la otra tabla mediante INNER JOIN; las filas de la tabla de la izquier-

da/derecha que tienen nulos en la columna de concatenación aparecen en el resultado concatenadas

con una fila de nulos. Con FULL OUTER JOIN se hacen ambas operaciones: LEFT OUTER JOIN y RIGHT

OUTER JOIN.

Teniendo en cuenta que, tanto FACTURAS.codcli como FACTURAS.codven aceptan nulos, el modo

correcto de realizar la consulta en este último ejemplo será:

SELECT f.codfac, f.fecha, f.codcli, c.nombre, f.codven, v.nombre

FROM facturas AS f LEFT OUTER JOIN clientes AS c USING (codcli)

LEFT OUTER JOIN vendedores AS v USING (codven)

WHERE EXTRACT(month FROM f.fecha) = 12

AND EXTRACT(year FROM f.fecha) = EXTRACT(year FROM CURRENT_DATE)-1;

Como se ha visto, el OUTER JOIN tiene sentido cuando no se quiere perder filas en una concatena-

ción cuando una de las columnas que interviene acepta nulos. Otro caso en que esta operación tiene

sentido es cuando las filas de una tabla no tienen filas para concatenarse en la otra tabla porque no

son referenciadas por ninguna de ellas. Es el caso del siguiente ejemplo:

SELECT c.codcli, c.nombre, COUNT(f.codfac) AS nfacturas

FROM facturas AS f RIGHT OUTER JOIN clientes AS c USING (codcli)

GROUP BY c.codcli, c.nombre

ORDER BY 3 DESC;

Esta sentencia obtiene un listado con todos los clientes de la tabla CLIENTES y el número de facturas

que cada uno tiene. Si algún cliente no tiene ninguna factura (no es referenciado por ninguna fila de

la tabla de FACTURAS), también aparecerá en el resultado y la cuenta del número de facturas será

cero.



-- 91 of 227 --



82 4.8. CONSULTAS MULTITABLA

4.8.2. Sintaxis original de la concatenación

En versiones anteriores del estándar de SQL la concatenación no se realizaba mediante JOIN, ya

que esta operación no estaba implementada directamente. En el lenguaje teórico en el que se basa

SQL, el álgebra relacional, la operación de concatenación sí existe, pero ya que no es una operación

primitiva, no fue implementada en SQL en un principio. No es una operación primitiva porque se

puede llevar a cabo mediante la combinación de otras dos operaciones: el producto cartesiano y

la restricción. La restricción se lleva a cabo mediante la cláusula WHERE, que ya es conocida. El

producto cartesiano se lleva a cabo separando las tablas involucradas por una coma en la cláusula

FROM, tal y como se muestra a continuación:

SELECT *

FROM facturas, clientes;

La sentencia anterior combina todas las filas de la tabla facturas con todas las filas de la tabla

clientes. Si la primera tiene n filas y la segunda tiene m filas, el resultado tendrá n × m filas.

Para hacer la concatenación de cada factura con el cliente que la ha solicitado, se debe hacer

una restricción: de las n × m filas hay que seleccionar aquellas en las que coinciden los valores de

las columnas codcli.

SELECT *

FROM facturas, clientes

WHERE facturas.codcli = clientes.codcli;

La siguiente consulta, que utiliza el formato original para realizar las concatenaciones. Obtiene

los datos de las facturas con 16 % de iva y sin descuento, con el nombre del cliente:

SELECT facturas.codfac, facturas.fecha, facturas.codcli, clientes.nombre,

facturas.codven

FROM facturas, clientes

WHERE facturas.codcli = clientes.codcli -- concatenación

AND COALESCE(facturas.iva,0) = 16 -- restricción

AND COALESCE(facturas.dto,0) = 0; -- restricción

No hay que olvidar que la concatenación que se acaba de mostrar utiliza una sintaxis que

ha quedado obsoleta en el estándar de SQL. La sintaxis del estándar actual es más aconsejable

porque permite identificar más claramente qué son restricciones (aparecerán en el WHERE) y qué son

condiciones de concatenación (aparecerán en el FROM con la palabra clave JOIN). Sin embargo, es

importante conocer esta sintaxis porque todavía es muy habitual su uso.



-- 92 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 83

4.8.3. Ejemplos

Ejemplo 4.11 Obtener los datos completos del cliente al que pertenece la factura 5886.

Una versión que utiliza subconsultas es la siguiente:

SELECT *

FROM clientes

WHERE codcli = ( SELECT codcli FROM facturas WHERE codfac = 5886 );

Una versión que utiliza JOIN es la siguiente:

SELECT c.*

FROM facturas f JOIN clientes c USING (codcli)

WHERE f.codfac = 5886;

Ejemplo 4.12 Obtener el código de las facturas en las que se ha pedido el artículo que tiene ac-

tualmente el precio más caro.

Una versión en donde se utiliza el JOIN de subconsultas en el FROM es la siguiente:

SELECT DISTINCT l.codfac

FROM lineas_fac AS l JOIN articulos AS a USING (codart)

JOIN (SELECT MAX(precio) AS precio

FROM articulos) AS t ON (a.precio = t.precio);

En la siguiente versión se utiliza la subconsulta para hacer una restricción.

SELECT DISTINCT l.codfac

FROM lineas_fac AS l JOIN articulos AS a USING (codart)

WHERE a.precio = (SELECT MAX(precio)

FROM articulos) ;

A continuación se muestra una versión que utiliza sólo subconsultas:

SELECT DISTINCT codfac

FROM lineas_fac

WHERE codart IN (SELECT codart

FROM articulos

WHERE precio = (SELECT MAX(precio) FROM articulos));

Ejemplo 4.13 Para cada vendedor de la provincia de Castellón, mostrar su nombre y el nombre

de su jefe inmediato.



-- 93 of 227 --



84 4.8. CONSULTAS MULTITABLA

SELECT emp.codven, emp.nombre AS empleado, jef.nombre AS jefe

FROM vendedores AS emp JOIN vendedores AS jef ON (emp.codjefe = jef.codven)

JOIN pueblos AS pue ON (emp.codpue = pue.codpue)

WHERE pue.codpro = ’12’;

Nótese que ambas concatenaciones deben hacerse mediante ON: la primera porque las columnas de

concatenación no tienen el mismo nombre, la segunda porque al concatenar con PUEBLOS hay dos

columnas codpue en la tabla de la izquierda: emp.codpue y jef.codven.

4.8.4. Algunas cuestiones importantes

A continuación se plantean algunas cuestiones que es importante tener en cuenta cuando se

realizan concatenaciones.

Al hacer un NATURAL JOIN es importante fijarse muy bien en los nombres de las columnas

de las tablas que participan en la operación, ya que se concatenan las filas de ambas tablas

que en los atributos se llaman igual tienen los mismos valores. Concatenar filas por columnas

no deseadas implica tener en cuenta más restricciones, con lo que los resultados obtenidos

no son correctos. Es más aconsejable utilizar INNER JOIN, ya que no pueden producirse estos

problemas al especificarse explícitamente las columnas de concatenación.

En la vida de una base de datos puede ocurrir que a una tabla se le deban añadir nuevas

columnas para que pueda almacenar más información. Si esta tabla se ha utilizado para

realizar algún NATURAL JOIN en alguna de las consultas de los programas de aplicación, hay

que ser cuidadosos al escoger el nombre ya que si una nueva columna se llama igual que otra

columna de la otra tabla participante, la concatenación que se hará ya no será la misma. Es

posible evitar este tipo de problemas utilizando siempre INNER JOIN ya que éste requiere que

se especifiquen las columnas por las que realizar la concatenación y aunque se añadan nuevas

columnas a las tablas, no cambiará la operación realizada aunque haya nuevas coincidencias

de nombres en ambas tablas.

Ordenar las tablas en el FROM tal y como aparecen en los diagramas referenciales ayuda a

tener un mayor control de la consulta en todo momento: es posible saber si se ha olvidado

incluir alguna tabla intermedia y es posible saber qué representa cada fila del resultado de la

concatenación de todas las tablas implicadas. Además, será más fácil decidir qué incluir en la

función COUNT() cuando sea necesaria, y también será más fácil determinar si en la proyección

final (SELECT) es necesario el uso de DISTINCT.



-- 94 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 85

4.9. Operadores de conjuntos

Los operadores de conjuntos del álgebra relacional son: el producto cartesiano, la unión, la

intersección y la diferencia. El producto cartesiano se realiza en SQL especificando en la cláusula

FROM las tablas involucradas en la operación, separadas por comas, tal y como se ha indicado

anteriormente. A continuación se muestra cómo utilizar el resto de los operadores de conjuntos en

las consultas en SQL.

La sintaxis para las uniones, intersecciones y diferencias es la siguiente:

sentencia_SELECT

UNION | INTERSECT | EXCEPT [ ALL ]

sentencia_SELECT

[ ORDER BY columna [ ASC | DESC ] [ , columna [ ASC | DESC ] ];

Nótese que la cláusula ORDER BY sólo puede aparecer una vez en la consulta al final de la misma.

La ordenación se realizará sobre el resultado de la unión, intersección o diferencia.

Para poder utilizar cualquiera de estos tres nuevos operadores, las cabeceras de las sentencias

SELECT involucradas deben devolver el mismo número de columnas, y las columnas correspondientes

en ambas sentencias deberán ser del mismo tipo de datos.

4.9.1. Operador UNION

Este operador devuelve como resultado todas las filas que devuelve la primera sentencia SELECT,

más aquellas filas de la segunda sentencia SELECT que no han sido ya devueltas por la primera. En

el resultado no se muestran duplicados.

Se puede evitar la eliminación de duplicados especificando la palabra clave ALL. En este caso, si

una fila aparece m veces en la primera sentencia y n veces en la segunda, en el resultado aparecerá

m + n veces.

Si se realizan varias uniones, éstas se evalúan de izquierda a derecha, a menos que se utilicen

paréntesis para establecer un orden distinto.

La siguiente sentencia muestra los códigos de las poblaciones donde hay clientes o donde hay

vendedores:

SELECT codpue FROM clientes

## UNION

SELECT codpue FROM vendedores;



-- 95 of 227 --



86 4.9. OPERADORES DE CONJUNTOS

4.9.2. Operador INTERSECT

Este operador devuelve como resultado las filas que se encuentran tanto en el resultado de la

primera sentencia SELECT como en el de la segunda sentencia SELECT. En el resultado no se muestran

duplicados.

Se puede evitar la eliminación de duplicados especificando la palabra clave ALL. En este caso,

si una misma fila aparece m veces en la primera sentencia y n veces en la segunda, en el resultado

esta fila aparecerá min(m, n) veces.

Si se realizan varias intersecciones, éstas se evalúan de izquierda a derecha, a menos que se

utilicen paréntesis para establecer un orden distinto. La intersección tiene más prioridad, en el

orden de evaluación, que la unión, es decir, A UNION B INTERSECT C se evalúa como A UNION (B

INTERSECT C).

La siguiente sentencia muestra los códigos de las poblaciones donde hay clientes y también hay

vendedores:

SELECT codpue FROM clientes

## INTERSECT

SELECT codpue FROM vendedores;

4.9.3. Operador EXCEPT

Este operador devuelve como resultado las filas que se encuentran en el resultado de la primera

sentencia SELECT y no se encuentran en el resultado de la segunda sentencia SELECT. En el resultado

no se muestran duplicados.

Se puede evitar la eliminación de duplicados especificando la palabra clave ALL. En este caso,

si una misma fila aparece m veces en la primera sentencia y n veces en la segunda, en el resultado

esta fila aparecerá max(m − n, 0) veces.

Si se realizan varias diferencias, éstas se evalúan de izquierda a derecha, a menos que se utilicen

paréntesis para establecer un orden distinto. La diferencia tiene la misma prioridad, en el orden de

evaluación, que la unión.

La siguiente sentencia muestra los códigos de las poblaciones donde hay clientes y no hay ven-

dedores:

SELECT codpue FROM clientes

## EXCEPT

SELECT codpue FROM vendedores;

La diferencia no es una operación conmutativa, mientras que el resto de los operadores de conjuntos

sí lo son.



-- 96 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 87

4.9.4. Sentencias equivalentes

En muchas ocasiones, una misma consulta de datos puede responderse mediante distintas sen-

tencias SELECT que utilizan operadores diferentes. Cada una de ellas dará, por lo general, un tiempo

de respuesta diferente, pudiéndose considerar que una es mejor que otra en este aspecto.

El que una sentencia sea mejor en unas circunstancias no garantiza que vaya a serlo siempre:

puede que al evolucionar el estado de la base de datos, una sentencia que era la mejor, deje de serlo

porque las tablas hayan cambiado de tamaño o se haya creado o eliminado algún índice.

Es por todo lo anterior, que se considera importante que, ante una consulta de datos, sea posible

obtener varias sentencias alternativas. En este apartado se presentan algunas equivalencias entre

operadores que se pueden utilizar para obtener sentencias equivalentes.

Una concatenación es equivalente a una expresión con el operador IN y una subconsulta.

Dependiendo del número de filas que obtenga la subconsulta, será más o menos eficiente que

la concatenación con JOIN.

Una restricción con dos comparaciones unidas por OR es equivalente a la unión de dos sentencias

SELECT, situando cada una de estas comparaciones en una sentencia distinta.

Una restricción con dos comparaciones unidas por AND es equivalente a la intersección de dos

sentencias SELECT, situando cada una de estas comparaciones en una sentencia distinta.

Una restricción con dos comparaciones unidas por AND NOT es equivalente a la diferencia de

dos sentencias SELECT, situando la primera comparación en la primera sentencia y la segunda

comparación en la segunda sentencia (conviene recordar que esta operación no es conmutativa).

El operador NOT IN puede dar resultados inesperados cuando la subconsulta devuelve algún

nulo. En general, es más aconsejable trabajar con operadores en positivo (sin NOT) (en el

ejemplo que se ofrece después se verá el porqué). Una restricción con el operador NOT IN y

una subconsulta, es equivalente a una restricción con IN y una subconsulta con EXCEPT.

4.9.5. Ejemplos

Ejemplo 4.14 Obtener los datos de las poblaciones donde hay vendedores y no hay clientes.

SELECT *

FROM ( SELECT codpue FROM vendedores

## EXCEPT

SELECT codpue FROM clientes ) AS t

JOIN pueblos USING (codpue)



-- 97 of 227 --



88 4.10. SUBCONSULTAS CORRELACIONADAS

JOIN provincias USING (codpro);

La tabla t contiene los códigos de las poblaciones en donde hay vendedores y no hay clientes. Tras

concatenarla con PUEBLOS y PROVINCIAS se obtienen los datos completos de dichas poblaciones.

Ejemplo 4.15 ¿Cuántos clientes hay que entre todas sus facturas no tienen ninguna con 16 % de

iva?

La siguiente solución utiliza el operador NOT IN. Nótese que es preciso tener en cuenta dos restric-

ciones: la primera es que en la subconsulta del NOT IN se debe evitar los nulos, y la segunda es que

hay que asegurarse de que los clientes seleccionados hayan realizado alguna compra (deben tener

alguna factura).

SELECT COUNT(*) AS clientes

FROM clientes

WHERE codcli NOT IN ( SELECT codcli FROM facturas

WHERE COALESCE(iva,0) = 16

AND codcli IS NOT NULL ) -- evita nulos

AND codcli IN (SELECT codcli FROM facturas); -- con facturas

Una sentencia equivalente sin NOT IN y que utiliza un operador de conjuntos, es la siguiente:

SELECT COUNT(*) AS clientes

FROM ( SELECT codcli FROM facturas -- clientes con alguna factura

EXCEPT -- menos

SELECT codcli FROM facturas -- clientes que tienen alguna con 16%

WHERE COALESCE(iva,0) = 16 ) AS t;

Trabajando en positivo no es preciso preocuparse por los nulos en FACTURAS.codcli, además no se

cuelan en el resultado los clientes sin facturas y tampoco es necesario recorrer la tabla de CLIENTES

para contarlos. Además, suele suceder que las consultas así formuladas consiguen mejores tiempos

de respuesta que las que utilizan NOT IN, quizá porque hay ciertas comprobaciones que se evitan.

4.10. Subconsultas correlacionadas

Una subconsulta correlacionada es una consulta anidada que contiene referencias a columnas de

las tablas que se encuentran en el FROM de la consulta principal. Son lo que se denomina referencias

externas.

Como ya se ha visto, las subconsultas dotan al lenguaje SQL de una gran potencia. Estas pueden

utilizarse para hacer restricciones, tanto en la cláusula WHERE como en la cláusula HAVING, y también



-- 98 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 89

en la cláusula FROM. Hasta ahora, dichas subconsultas podían tratarse de modo independiente y,

para comprender mejor el funcionamiento de la sentencia, se podía suponer que la subconsulta se

ejecuta en primer lugar, sustituyéndose ésta en la sentencia SELECT principal por su valor, como se

muestra en el siguiente ejemplo:

SELECT * -- facturas con descuento máximo

FROM facturas

WHERE dto = ( SELECT MAX(dto) FROM facturas );

en primer lugar se obtiene el descuento máximo de las facturas, se sustituye la subconsulta por este

valor y, por último, se ejecuta la consulta principal.

4.10.1. Referencias externas

En ocasiones sucede que la subconsulta se debe recalcular para cada fila de la consulta principal,

estando la subconsulta parametrizada mediante valores de columnas de la consulta principal. A este

tipo de subconsultas se les llama subconsultas correlacionadas y a los parámetros de la subconsulta

que pertenecen a la consulta principal se les llama referencias externas.

La siguiente sentencia obtiene los datos de las facturas que tienen descuento en todas sus líneas:

SELECT *

FROM facturas AS f

WHERE 0 < ( SELECT MIN(COALESCE(l.dto,0))

FROM lineas_fac AS l

WHERE l.codfac = f.codfac );

La referencia externa es f.codfac ya que es una columna de la consulta principal. En este caso, se

puede imaginar que la consulta se ejecuta del siguiente modo. Se recorre, fila a fila, la tabla de las

facturas. Para cada fila se ejecuta la subconsulta, sustituyendo f.codfac por el valor que tiene en

la fila actual de la consulta principal. Es decir, para cada factura se obtiene el descuento mínimo

en sus líneas. Si este descuento mínimo es mayor que cero, significa que la factura tiene descuento

en todas sus líneas, por lo que se muestra en el resultado. Si no es así, la factura no se muestra. En

cualquiera de los dos casos, se continua procesando la siguiente factura: se obtienen sus líneas y el

descuento mínimo en ellas, etc.

4.10.2. Operadores EXISTS, NOT EXISTS

En un apartado anterior se han presentado los operadores que se pueden utilizar con las sub-

consultas para hacer restricciones en las cláusulas WHERE y HAVING. En aquel momento no se citó,



-- 99 of 227 --



90 4.10. SUBCONSULTAS CORRELACIONADAS

intencionadamente, un operador ya que éste se utiliza siempre con referencias externas: el operador

EXISTS.

EXISTS ( subconsulta )

La subconsulta se evalúa para determinar si devuelve o no alguna fila. Si devuelve al menos

una fila, se evalúa a verdadero. Si no devuelve ninguna fila, se evalúa a falso. La subconsulta

puede tener referencias externas, que actuarán como constantes durante la evaluación de la

subconsulta.

En la ejecución de la subconsulta, en cuanto se devuelve la primera fila, se devuelve verdadero,

sin terminar de obtener el resto de las filas.

Puesto que el resultado de la subconsulta carece de interés (sólo importa si se devuelve o no

alguna fila), se suele escribir las consultas indicando una constante en la cláusula SELECT en

lugar de * o cualquier columna:

SELECT * -- facturas que en alguna línea no tiene dto

FROM facturas AS f

WHERE EXISTS ( SELECT 1 -- el resultado temporal será más pequeño

FROM lineas_fac AS l

WHERE l.codfac = f.codfac

AND COALESCE(dto,0)=0);

NOT EXISTS ( subconsulta )

La subconsulta se evalúa para determinar si devuelve o no alguna fila. Si devuelve al menos

una fila, se evalúa a falso. Si no devuelve ninguna fila, se evalúa a verdadero. La subconsulta

puede tener referencias externas, que actuarán como constantes durante la evaluación de la

subconsulta.

En la ejecución de la subconsulta, en cuanto se devuelve la primera fila, se devuelve falso, sin

terminar de obtener el resto de las filas.

Puesto que el resultado de la subconsulta carece de interés (sólo importa si se devuelve o no

alguna fila), se suele escribir las consultas indicando una constante en la cláusula SELECT en

lugar de * o cualquier columna:

SELECT * -- facturas que no tienen líneas sin descuento

FROM facturas AS f

WHERE NOT EXISTS ( SELECT 1 -- el resultado temporal será más pequeño

FROM lineas_fac AS l



-- 100 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 91

WHERE l.codfac = f.codfac

AND COALESCE(dto,0)=0);

4.10.3. Sentencias equivalentes

Algunos SGBD no son eficientes procesando consultas que tienen subconsultas anidadas con

referencias externas, por lo que es muy conveniente saber encontrar sentencias equivalentes que no

las utilicen, si es posible.

Por ejemplo, la siguiente sentencia también obtiene los datos de las facturas que tienen descuento

en todas sus líneas. Utiliza una subconsulta en la cláusula FROM y no posee referencias externas.

SELECT *

FROM facturas JOIN

( SELECT codfac

FROM lineas_fac

GROUP BY codfac

HAVING MIN(COALESCE(dto,0))>0 ) AS lf

USING (codfac);

Una sentencia equivalente, que tampoco utiliza referencias externas, es la siguiente:

SELECT *

FROM facturas

WHERE codfac IN ( SELECT codfac

FROM lineas_fac

GROUP BY codfac

HAVING MIN(COALESCE(dto,0))>0 );

4.10.4. Ejemplos

Ejemplo 4.16 ¿Cuántos clientes hay que en todas sus facturas han pagado 16 % de iva?

En la primera versión se van a utilizar operadores de conjuntos:

SELECT COUNT(*) AS clientes

FROM (SELECT codcli FROM facturas WHERE iva = 16

## EXCEPT

SELECT codcli FROM facturas WHERE COALESCE(iva,0) <> 16) AS t;

La siguiente sentencia no utiliza la subconsulta del FROM, pero seguramente será más cara porque

hay que acceder a la tabla clientes:



-- 101 of 227 --



92 4.10. SUBCONSULTAS CORRELACIONADAS

SELECT COUNT(*) AS clientes

FROM clientes

WHERE codcli IN (SELECT codcli FROM facturas WHERE iva = 16

## EXCEPT

SELECT codcli FROM facturas WHERE COALESCE(iva,0) <> 16);

La siguiente versión utiliza NOT IN, aunque ya se sabe que puede dar problemas cuando hay nulos:

SELECT COUNT(*) AS clientes

FROM clientes

WHERE codcli IN (SELECT codcli FROM facturas

WHERE iva = 16)

AND codcli NOT IN (SELECT codcli FROM facturas

WHERE COALESCE(iva,0) <> 16 AND codcli IS NOT NULL);

La siguiente sentencia sigue una estrategia diferente: se ha pagado siempre el 16 % de iva si el iva

máximo y el mínimo son ambos 16.

SELECT COUNT(*) AS clientes

FROM clientes

WHERE codcli IN (SELECT codcli FROM facturas

GROUP BY codcli

HAVING MAX(COALESCE(iva,0)) = 16

AND MIN(COALESCE(iva,0)) = 16 );

Con la subconsulta en el FROM es posible evitar la visita de la tabla de los clientes:

SELECT COUNT(*) AS clientes

FROM (SELECT codcli FROM facturas

GROUP BY codcli

HAVING MAX(COALESCE(iva,0)) = 16

AND MIN(COALESCE(iva,0)) = 16 ) AS t;

Ejemplo 4.17 ¿Cuántos pueblos hay en donde no tenemos clientes?

Una versión con operadores de conjuntos es la siguiente:

SELECT COUNT(*) AS pueblos

FROM (SELECT codpue FROM pueblos

## EXCEPT

SELECT codpue FROM clientes) AS t;



-- 102 of 227 --



### CAPÍTULO 4. LENGUAJE SQL 93

Otra versión es la que utiliza NOT IN.

SELECT COUNT(*) AS pueblos

FROM pueblos

WHERE codpue NOT IN (SELECT codpue FROM clientes);

Ejemplo 4.18 Para proponer ofertas especiales a los buenos clientes, se necesita un listado con los

datos de aquellos que en los últimos quince meses (los últimos 450 días) han hecho siempre facturas

por un importe superior a 400 e.

Se puede pensar en obtener el resultado recorriendo, uno a uno, los clientes. Para cada cliente

comprobar, mediante una subconsulta, la restricción: que todas sus facturas de los últimos 450 días

tengan un importe superior a 400 e. Ya que la subconsulta se ha de ejecutar para cada cliente,

llevará una referencia externa.

La restricción que se ha de cumplir sobre todas las facturas de ese periodo se puede comprobar

con ALL o con NOT EXISTS: o bien todas las facturas del cliente (en el periodo) tienen un importe

superior a 400 e, o bien no existen facturas de ese cliente (en el periodo) con un importe igual o

inferior a 400 e.

Se debe tener en cuenta que con los dos operadores (ALL, NOT EXISTS) se obtendrán también en

el resultado los clientes que no tienen ninguna factura, por lo que será preciso asegurarse de que los

clientes seleccionados hayan comprado en alguna ocasión en dicho periodo.

A continuación se muestran las dos versiones de la consulta que utilizan las referencias externas

tal y como se ha explicado.

SELECT c.codcli, c.nombre

FROM clientes c

WHERE 400 < ALL ( SELECT SUM(l.cant*l.precio)

FROM lineas_fac l JOIN facturas f USING(codfac)

WHERE f.fecha >= CURRENT_DATE - 450

AND f.codcli = c.codcli -- referencia externa

GROUP BY f.codfac )

AND c.codcli IN ( SELECT f.codcli

FROM facturas f

WHERE f.fecha >= CURRENT_DATE - 450 )

ORDER BY c.nombre;

Nótese que con NOT EXISTS el predicado sobre el importe de las facturas es el único que debe

aparecer negado.



-- 103 of 227 --



94 4.10. SUBCONSULTAS CORRELACIONADAS

SELECT c.codcli, c.nombre

FROM clientes c

WHERE NOT EXISTS ( SELECT 1

FROM lineas_fac l JOIN facturas f USING(codfac)

WHERE f.fecha >= CURRENT_DATE - 450

AND f.codcli = c.codcli -- referencia externa

GROUP BY f.codfac

HAVING SUM(l.cant*l.precio) <= 400 )

AND c.codcli IN ( SELECT f.codcli

FROM facturas f

WHERE f.fecha >= CURRENT_DATE - 450 )

ORDER BY c.nombre;

En la siguiente versión se evitan las referencias externas utilizando operadores de conjuntos.

Obsérvese la subconsulta: del conjunto de los clientes que alguna vez han comprado en ese periodo

con facturas de más de 400 e, se deben eliminar aquellos que además han comprado alguna de

400 e o menos. Puesto que se utiliza el operador IN, no es necesaria la restricción adicional que

comprueba que los clientes seleccionados hayan comprado alguna vez en el periodo: si están en la

lista es porque lo han hecho.

SELECT c.codcli, c.nombre

FROM clientes c

WHERE c.codcli IN ( SELECT f.codcli

FROM lineas_fac l JOIN facturas f USING(codfac)

WHERE f.fecha >= CURRENT_DATE - 450

GROUP BY f.codcli, f.codfac

HAVING SUM(l.cant*l.precio) > 400

## EXCEPT

SELECT f.codcli

FROM lineas_fac l JOIN facturas f USING(codfac)

WHERE f.fecha >= CURRENT_DATE - 450

GROUP BY f.codcli, f.codfac

HAVING SUM(l.cant*l.precio) <= 400 )

ORDER BY c.nombre;



-- 104 of 227 --



Parte II

Diseño de bases de datos

95



-- 105 of 227 --



-- 106 of 227 --



### Capítulo 5

Metodología de diseño

de bases de datos

### Introducción y objetivos

Una vez estudiado el modelo relacional de bases de datos, abordamos en esta segunda parte

su diseño. El diseño de una base de datos debe realizarse siguiendo una metodología que garantice

que se tienen en cuenta todos los requisitos de información y funcionales de la futura aplicación

informática que la utilizará. En este capítulo se revisa el ciclo de vida de los sistemas de información

ya que el diseño de la base de datos es una de sus etapas. A continuación se introduce brevemente

la metodología de diseño que se abordará en detalle en los tres capítulos que siguen a éste.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Justificar la necesidad de utilizar metodologías en el diseño de bases de datos.

Enumerar las etapas del ciclo de vida de un sistema de información y describir el objetivo de

cada una de ellas.

Describir las etapas del diseño de una base de datos.

Justificar la necesidad de analizar no sólo los datos, sino también las transacciones, cuando se

debe diseñar una base de datos.

5.1. Necesidad de metodologías de diseño

Cuando se trata de construir una base de datos sucede como cuando queremos que nos construyan

una casa. Para la construcción de la casa no contratamos directamente a un constructor que la vaya

97



-- 107 of 227 --



98 5.1. NECESIDAD DE METODOLOGÍAS DE DISEÑO

haciendo sobre la marcha y como él quiera, sino que buscamos primero a un arquitecto que la diseñe

en función de nuestras necesidades y contratamos al constructor después. El arquitecto, además

de tener en cuenta nuestros requisitos, también tendrá en cuenta otros requisitos relativos a las

estructuras, el sistema eléctrico o la seguridad.

Preocuparse por el diseño de las bases de datos es fundamental para la integridad los datos. Si

una base de datos está mal diseñada, los usuarios tendrán dificultades a la hora de acceder a los

datos, las búsquedas podrán producir información errónea y podrán perderse datos o modificarse de

manera incorrecta. Un mal diseño puede repercutir muy negativamente a la empresa propietaria de

los datos. De hecho, si los datos de una base de datos van a influir en la gestión del negocio, si van

a servir para tomar decisiones de la empresa, el diseño de la base de datos debe ser una verdadera

preocupación.

El diseño de una base de datos se lleva a cabo en tres etapas: diseño conceptual, diseño lógico y

diseño físico. Volviendo al símil con la construcción de una casa, el diseño conceptual y el lógico co-

rresponden con la fase de elaboración de los planos arquitectónicos, mientras que la implementación

física de la base de datos es la casa ya construida. Concretamente, diseño lógico describe el tamaño,

la forma y los sistemas necesarios para la base de datos: contiene las necesidades en cuanto a infor-

mación a almacenar y el modo en que se opera con ella. Después, se construye la implementación

física del diseño lógico de la base de datos mediante el SGBD. Si pensamos en un sistema relacional,

una vez creadas las tablas, establecidas las relaciones y los requisitos de integridad necesarios, la

base de datos está finalizada. Después ya se pueden crear las aplicaciones que permitan interactuar

con los datos de la base de datos. Con un buen diseño se puede garantizar de que las aplicaciones

proporcionarán la información oportuna y, sobre todo, la información correcta.

Hay ciertos factores que se consideran críticos en el diseño de bases de datos. Los que se citan

a continuación son de gran importancia para afrontar con éxito el diseño de bases de datos.

Trabajar interactivamente con los usuarios, tanto como sea posible.

Utilizar una metodología estructurada durante todo el proceso de modelado de los datos.

Emplear una metodología orientada a los datos (frente a una orientada a las funciones).

Incluir en el modelado de los datos todo tipo de consideraciones estructurales, semánticas y

de integridad.

Utilizar diagramas para representar los datos siempre que sea posible.

Mantener un diccionario de datos para complementar los diagramas.

Estar dispuesto a repetir fases del diseño.



-- 108 of 227 --



### CAPÍTULO 5. METODOLOGÍA DE DISEÑO DE BASES DE DATOS 99

5.2. Ciclo de vida de los sistemas de información

Un sistema de información es el conjunto de recursos que permiten recoger, gestionar, controlar

y difundir la información de toda una empresa u organización.

Desde los años setenta, los sistemas de bases de datos han ido reemplazando a los sistemas de

ficheros en los sistemas de información de las empresas. Al mismo tiempo, se ha ido reconociendo

la gran importancia que tienen los datos que éstas manejan, convirtiéndose en uno de sus recursos

más importantes. Esto ha hecho que muchas empresas tengan departamentos que se encarguen de

gestionar toda su información, que estará almacenada en una base de datos. Aparecen los papeles

del administrador de datos y del administrador de la base de datos, que son las personas encargadas

de supervisar y controlar todas las actividades relacionadas con los datos de la empresa y con el

ciclo de vida de las aplicaciones de bases de datos, respectivamente.

Un sistema de información está formado por los siguientes componentes:

La base de datos.

El SGBD.

Los programas de aplicación.

Los dispositivos físicos (ordenadores, dispositivos de almacenamiento, etc.).

El personal que utiliza y que desarrolla el sistema.

La base de datos es un componente fundamental de un sistema de información. El ciclo de vida de

un sistema de información está ligado al ciclo de vida del sistema de base de datos sobre el que se

apoya.

Las etapas del ciclo de vida de una sistema de información que se apoya sobre una base de datos

son las siguientes:

1. Planificación del proyecto.

2. Definición del sistema.

3. Recolección y análisis de los requisitos.

4. Diseño de la base de datos.

5. Selección del SGBD.

6. Diseño de la aplicación.

7. Prototipado.



-- 109 of 227 --



100 5.2. CICLO DE VIDA

8. Implementación.

9. Conversión y carga de datos.

10. Prueba.

11. Mantenimiento.

Estas etapas no son estrictamente secuenciales. De hecho hay que repetir algunas de las etapas

varias veces, haciendo lo que se conocen como ciclos de realimentación. Por ejemplo, los problemas

que se encuentran en la etapa del diseño de la base de datos pueden requerir una recolección de

requisitos adicional y su posterior análisis.

A continuación, se muestran las tareas más importantes que se realizan en cada etapa.

5.2.1. Planificación del proyecto

Esta etapa conlleva la planificación de cómo se pueden llevar a cabo las etapas del ciclo de vida

de la manera más eficiente. Hay tres componentes principales: el trabajo que se ha de realizar, los

recursos para llevarlo a cabo y el dinero para pagar por todo ello. Como apoyo a esta etapa, se

necesitará un esquema de datos en donde se muestren las entidades principales de la empresa y sus

relaciones, y en donde se identifiquen las principales áreas funcionales. En el esquema se tiene que

mostrar también qué datos comparten las distintas áreas funcionales de la empresa.

La planificación de la base de datos también incluye el desarrollo de estándares que especifiquen

cómo realizar la recolección de datos, cómo especificar su formato, qué documentación será necesaria

y cómo se va a llevar a cabo el diseño y la implementación. El desarrollo y el mantenimiento de los

estándares puede llevar bastante tiempo, pero si están bien diseñados, son una base para el personal

informático en formación y para medir la calidad, además, garantizan que el trabajo se ajusta a

unos patrones, independientemente de las habilidades y la experiencia del diseñador. Por ejemplo,

se pueden establecer reglas sobre cómo dar nombres a los datos, lo que evitará redundancias e

inconsistencias. Se deben documentar todos los aspectos legales sobre los datos y los establecidos

por la empresa como, por ejemplo, qué datos deben tratarse de modo confidencial.

5.2.2. Definición del sistema

En esta etapa se especifica el ámbito y los límites de la aplicación de bases de datos, así como

con qué otros sistemas interactúa. También hay que determinar quienes son los usuarios y las áreas

de aplicación.



-- 110 of 227 --



### CAPÍTULO 5. METODOLOGÍA DE DISEÑO DE BASES DE DATOS 101

5.2.3. Recolección y análisis de los requisitos

En esta etapa se recogen y analizan los requisitos de los usuarios y de las áreas funcionales de

la empresa u organización. Esta información se puede recoger de varias formas:

Entrevistando al personal de la empresa, concretamente, a aquellos que son considerados

expertos en las áreas de interés.

Observando el funcionamiento de la empresa.

Examinando documentos, sobre todo aquellos que se utilizan para recoger o visualizar infor-

mación.

Utilizando cuestionarios para recoger información de grandes grupos de usuarios.

Utilizando la experiencia adquirida en el diseño de sistemas similares.

La información recogida debe incluir las principales áreas funcionales y los grupos de usuarios,

la documentación utilizada o generada por todos ellos, las transacciones que realizan y una lista

priorizada de todos sus requisitos.

Esta etapa tiene como resultado un conjunto de documentos con las especificaciones de requisitos

de los usuarios, en donde se describen las operaciones que se realizan en la empresa desde distintos

puntos de vista.

La información recogida se debe estructurar utilizando técnicas de especificación de requisitos,

como por ejemplo técnicas de análisis y diseño estructurado y diagramas de flujo de datos. También

las herramientas CASE (Computer–Aided Software Engineering) pueden proporcionar una asistencia

automatizada que garantice que los requisitos son completos y consistentes.

5.2.4. Diseño de la base de datos

Esta etapa consta de tres fases: diseño conceptual, diseño lógico y diseño físico de la base de

datos. La primera fase consiste en la producción de un esquema conceptual de los datos, que es

independiente de todas las consideraciones físicas. Este modelo se refina después en un esquema

lógico eliminando las construcciones que no se pueden representar en el modelo de base de datos

escogido (relacional, orientado a objetos, etc.). En la tercera fase, el esquema lógico se traduce en un

esquema físico para el SGBD escogido. La fase de diseño físico debe tener en cuenta las estructuras

de almacenamiento y los métodos de acceso necesarios para proporcionar un acceso eficiente a la

base de datos en memoria secundaria.

Los objetivos del diseño de la base de datos son:



-- 111 of 227 --



102 5.2. CICLO DE VIDA

Representar los datos que requieren las principales áreas funcionales y los usuarios, y repre-

sentar las relaciones entre dichos datos.

Proporcionar un modelo de los datos que soporte las transacciones que se vayan a realizar

sobre los datos.

Especificar un esquema que alcance las prestaciones requeridas para el sistema.

5.2.5. Selección del SGBD

Si no se dispone de un SGBD, o el que hay se encuentra obsoleto, se debe escoger un SGBD que

sea adecuado para el sistema de información. Esta elección se debe hacer antes del diseño lógico.

5.2.6. Diseño de la aplicación

En esta etapa se diseñan los programas de aplicación que usarán y procesarán la base de datos.

Esta etapa y el diseño de la base de datos, son paralelas. En la mayor parte de los casos no se puede

finalizar el diseño de las aplicaciones hasta que se ha terminado con el diseño de la base de datos.

Por otro lado, la base de datos existe para dar soporte a las aplicaciones, por lo que habrá una

realimentación desde el diseño de las aplicaciones al diseño de la base de datos.

En esta etapa hay que asegurarse de que toda la funcionalidad especificada en los requisitos de

usuario se encuentra en el diseño de la aplicación.

Además, habrá que diseñar las interfaces de usuario, aspecto muy importante que no se debe

ignorar. El sistema debe ser fácil de aprender, fácil de usar, ser directo y estar dispuesto a tolerar

ciertos fallos de los usuarios.

5.2.7. Prototipado

Esta etapa, que es opcional, es para construir prototipos de la aplicación que permitan a los

diseñadores y a los usuarios probar el sistema. Un prototipo es un modelo de trabajo de las aplica-

ciones del sistema. El prototipo no tiene toda la funcionalidad del sistema final, pero es suficiente

para que los usuarios puedan utilizar el sistema e identificar qué aspectos están bien y cuáles no

son adecuados, además de poder sugerir mejoras o la inclusión de nuevos elementos. Este proceso

permite que quienes diseñan e implementan el sistema sepan si han interpretado correctamente los

requisitos de los usuarios. Otra ventaja de los prototipos es que se construyen rápidamente.

Esta etapa es imprescindible cuando el sistema que se va a implementar tiene un gran coste,

alto riesgo o utiliza nuevas tecnologías.



-- 112 of 227 --



### CAPÍTULO 5. METODOLOGÍA DE DISEÑO DE BASES DE DATOS 103

5.2.8. Implementación

En esta etapa se crean las definiciones de la base de datos a nivel conceptual, externo e interno,

así como los programas de aplicación. La implementación de la base de datos se realiza mediante

las sentencias del lenguaje de definición de datos del SGBD escogido. Estas sentencias se encargan

de crear el esquema de la base de datos, los ficheros en donde se almacenarán los datos y las vistas

de los usuarios.

Los programas de aplicación se implementan utilizando lenguajes de tercera o cuarta generación.

Partes de estas aplicaciones son transacciones sobre la base de datos, que se implementan mediante

el lenguaje de manejo de datos del SGBD. Las sentencias de este lenguaje se pueden embeber en un

lenguaje de programación anfitrión como Visual Basic, Delphi, C, C++ o Java, entre otros. En esta

etapa también se implementan los menús, los formularios para la introducción de datos y los infor-

mes de visualización de datos. Para ello, el SGBD puede disponer de lenguajes de cuarta generación

que permiten el desarrollo rápido de aplicaciones mediante lenguajes de consultas no procedura-

les, generadores de informes, generadores de formularios, generadores de gráficos y generadores de

aplicaciones.

En esta etapa también se implementan todos los controles de seguridad e integridad. Algunos de

estos controles se pueden implementar mediante el lenguaje de definición de datos y otros puede que

haya que implementarlos mediante utilidades del SGBD o mediante los programas de aplicación.

5.2.9. Conversión y carga de datos

Esta etapa es necesaria cuando se está reemplazando un sistema antiguo por uno nuevo. Los

datos se cargan desde el sistema viejo al nuevo directamente o, si es necesario, se convierten al

formato que requiera el nuevo SGBD y luego se cargan. Si es posible, los programas de aplicación

del sistema antiguo también se convierten para que se puedan utilizar en el sistema nuevo.

5.2.10. Prueba

En esta etapa se prueba y valida el sistema con los requisitos especificados por los usuarios. Para

ello, se debe diseñar una batería de test con datos reales, que se deben llevar a cabo de manera

metódica y rigurosa. Es importante darse cuenta de que la fase de prueba no sirve para demostrar que

no hay fallos, sirve para encontrarlos. Si la fase de prueba se lleva a cabo correctamente, descubrirá

los errores en los programas de aplicación y en la estructura de la base de datos. Además, demostrará

que los programas parecen trabajar tal y como se especificaba en los requisitos y que las prestaciones

deseadas parecen obtenerse. Por último, en las pruebas se podrá hacer una medida de la fiabilidad

y la calidad del software desarrollado.



-- 113 of 227 --



104 5.3. DISEÑO DE BASES DE DATOS

5.2.11. Mantenimiento

Una vez que el sistema está completamente implementado y probado, se pone en marcha. El

sistema está ahora en la fase de mantenimiento en la que se llevan a cabo las siguientes tareas:

Monitorización de las prestaciones del sistema. Si las prestaciones caen por debajo de un

determinado nivel, puede ser necesario reorganizar la base de datos.

Mantenimiento y actualización del sistema. Cuando sea necesario, los nuevos requisitos que

vayan surgiendo se incorporarán al sistema, siguiendo de nuevo las etapas del ciclo de vida

que se acaban de presentar.

5.3. Diseño de bases de datos

En este apartado se describen con más detalle los objetivos de cada una de las etapas del diseño

de bases de datos: diseño conceptual, diseño lógico y diseño físico. La metodología a seguir en cada

una de estas etapas se describe con detalle en capítulos posteriores.

5.3.1. Diseño conceptual

En esta etapa se debe construir un esquema de la información que se usa en la empresa, indepen-

dientemente de cualquier consideración física. A este esquema se le denomina esquema conceptual.

Al construir el esquema, los diseñadores descubren la semántica (significado) de los datos de la

empresa: encuentran entidades, atributos y relaciones. El objetivo es comprender:

La perspectiva que cada usuario tiene de los datos.

La naturaleza de los datos, independientemente de su representación física.

El uso de los datos a través de las áreas funcionales.

El esquema conceptual se puede utilizar para que el diseñador transmita a la empresa lo que ha

entendido sobre la información que ésta maneja. Para ello, ambas partes deben estar familiarizadas

con la notación utilizada en el esquema. La más popular es la notación del modelo entidad–relación,

que se describe en el capítulo dedicado al diseño conceptual.

El esquema conceptual se construye utilizando la información que se encuentra en la especifi-

cación de los requisitos de usuario. El diseño conceptual es completamente independiente de los

aspectos de implementación, como puede ser el SGBD que se vaya a usar, los programas de apli-

cación, los lenguajes de programación, el hardware disponible o cualquier otra consideración física.

Durante todo el proceso de desarrollo del esquema conceptual éste se prueba y se valida con los



-- 114 of 227 --



### CAPÍTULO 5. METODOLOGÍA DE DISEÑO DE BASES DE DATOS 105

requisitos de los usuarios. El esquema conceptual es una fuente de información para el diseño lógico

de la base de datos.

5.3.2. Diseño lógico

El diseño lógico es el proceso de construir un esquema de la información que utiliza la empresa,

basándose en un modelo de base de datos específico, independiente del SGBD concreto que se vaya

a utilizar y de cualquier otra consideración física.

En esta etapa, se transforma el esquema conceptual en un esquema lógico que utilizará las

estructuras de datos del modelo de base de datos en el que se basa el SGBD que se vaya a utilizar,

como puede ser el modelo relacional, el modelo de red, el modelo jerárquico o el modelo orientado

a objetos. Conforme se va desarrollando el esquema lógico, éste se va probando y validando con los

requisitos de usuario.

La normalización es una técnica que se utiliza para comprobar la validez de los esquemas lógicos

basados en el modelo relacional, ya que asegura que las tablas obtenidas no tienen datos redundantes.

Esta técnica se presenta en el capítulo dedicado al diseño lógico de bases de datos.

El esquema lógico es una fuente de información para el diseño físico. Además, juega un papel

importante durante la etapa de mantenimiento del sistema, ya que permite que los futuros cambios

que se realicen sobre los programas de aplicación o sobre los datos, se representen correctamente en

la base de datos.

Tanto el diseño conceptual, como el diseño lógico, son procesos iterativos, tienen un punto de

inicio y se van refinando continuamente. Ambos se deben ver como un proceso de aprendizaje en

el que el diseñador va comprendiendo el funcionamiento de la empresa y el significado de los datos

que maneja. El diseño conceptual y el diseño lógico son etapas clave para conseguir un sistema que

funcione después correctamente. Si el esquema no es una representación fiel de la empresa, será difícil,

sino imposible, definir todas las vistas de usuario (esquemas externos), o mantener la integridad de

la base de datos. También puede ser difícil definir la implementación física o el mantener unas

prestaciones aceptables del sistema. Además, hay que tener en cuenta que la capacidad de ajustarse

a futuros cambios es un sello que identifica a los buenos diseños de bases de datos. Por todo esto,

es fundamental dedicar el tiempo y las energías necesarias para producir el mejor esquema que sea

posible.

5.3.3. Diseño físico

El diseño físico es el proceso de producir la descripción de la implementación de la base de datos

en memoria secundaria: determinar las estructuras de almacenamiento y los métodos de acceso que

garanticen un acceso eficiente a los datos.



-- 115 of 227 --



106 5.4. DISEÑO DE TRANSACCIONES

Para llevar a cabo esta etapa, se debe haber decidido cuál es el SGBD que se va a utilizar, ya

que el esquema físico se adapta a él. Entre el diseño físico y el diseño lógico hay una realimentación,

ya que algunas de las decisiones que se tomen durante el diseño físico para mejorar las prestaciones,

pueden afectar a la estructura del esquema lógico.

En general, el propósito del diseño físico es describir cómo se va a implementar físicamente el

esquema lógico obtenido en la fase anterior. Concretamente, en el modelo relacional, esto consiste

en:

Obtener un conjunto de tablas y determinar las restricciones que se deben cumplir sobre ellas.

Determinar las estructuras de almacenamiento y los métodos de acceso que se van a utilizar

para conseguir unas prestaciones óptimas.

Diseñar el modelo de seguridad del sistema.

5.4. Diseño de transacciones

Cuando se diseñan las aplicaciones, se deben diseñar también las transacciones que éstas con-

tienen y que son las encargadas de trabajar sobre la base de datos. Una transacción es un conjunto

de acciones llevadas a cabo por un usuario o un programa de aplicación, que acceden o cambian

el contenido de la base de datos. Las transacciones representan eventos del mundo real, como dar

de alta un nuevo cliente, registrar una factura o dar de baja un artículo que ya no está a la venta.

Estas transacciones se deben realizar sobre la base de datos para que ésta siga siendo un fiel reflejo

de la realidad.

Una transacción puede estar compuesta por varias operaciones sobre la base de datos, como

registrar una factura, que requiere insertar datos en varias tablas. Sin embargo, desde el punto de

vista del usuario, estas operaciones conforman una sola tarea. Desde el punto de vista del SGBD,

una transacción lleva a la base de datos de un estado consistente a otro estado consistente. El SGBD

garantiza la consistencia de la base de datos incluso si se produce algún fallo, y también garantiza que

una vez se ha finalizado una transacción, los cambios realizados por ésta quedan permanentemente

en la base de datos, no se pueden perder ni deshacer (a menos que se realice otra transacción que

compense el efecto de la primera). Si la transacción no se puede finalizar por cualquier motivo, el

SGBD garantiza que los cambios realizados por esta transacción son deshechos.

El objetivo del diseño de las transacciones es definir y documentar las características de alto

nivel de las transacciones que requiere el sistema. Esta tarea se debe llevar a cabo al principio del

proceso de diseño para garantizar que el esquema lógico es capaz de soportar todas las transacciones

necesarias. Las características que se deben recoger de cada transacción son las siguientes:



-- 116 of 227 --



### CAPÍTULO 5. METODOLOGÍA DE DISEÑO DE BASES DE DATOS 107

Datos que utiliza la transacción.

Características funcionales de la transacción.

Salida de la transacción.

Importancia para los usuarios.

Frecuencia de utilización.

Hay tres tipos de transacciones:

En las transacciones de recuperación se accede a los datos para visualizarlos en la pantalla a

modo de informe.

En las transacciones de actualización se insertan, borran o actualizan datos de la base de

datos.

En las transacciones mixtas se mezclan operaciones de recuperación de datos y de actualiza-

ción.

El diseño de las transacciones utiliza la información dada en las especificaciones de requisitos de

usuario.

5.5. Herramientas CASE

Cuando se hace la planificación de la base de datos, la primera etapa del ciclo de vida de las

aplicaciones de bases de datos, también se puede escoger una herramienta CASE que permita llevar

a cabo el resto de tareas del modo más eficiente y efectivo posible. Una herramienta CASE suele

incluir:

Un diccionario de datos para almacenar información sobre los datos de la aplicación de bases

de datos.

Herramientas de diseño para dar apoyo al análisis de datos.

Herramientas que permitan desarrollar el modelo de datos corporativo, así como los esquemas

conceptual y lógico.

Herramientas para desarrollar los prototipos de las aplicaciones.

El uso de las herramientas CASE puede mejorar la productividad en el desarrollo de una aplicación

de bases de datos. Y por productividad se entiende tanto la eficiencia en el desarrollo, como la



-- 117 of 227 --



108 5.5. HERRAMIENTAS CASE

efectividad del sistema desarrollado. La eficiencia se refiere al coste, tanto en tiempo como en

dinero, de desarrollar la aplicación. La efectividad se refiere al grado en que el sistema satisface las

necesidades de los usuarios. Para obtener una buena productividad, subir el nivel de efectividad

puede ser más importante que aumentar la eficiencia.



-- 118 of 227 --



### Capítulo 6

Diseño conceptual

### Introducción y objetivos

El primer paso en el diseño de una base de datos es la producción del esquema conceptual. En este

### capítulo se presenta una metodología para producir estos esquemas, denominada entidad–relación

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Captar una realidad determinada, correspondiente a unos requisitos de usuario, y plasmarla

en un esquema conceptual mediante un diagrama entidad-relación.

Interpretar un esquema conceptual dado, extrayendo de él los requisitos de datos de los usua-

rios que se hayan reflejado.

6.1. Modelo entidad–relación

El diseño conceptual parte de las especificaciones de requisitos de los usuarios y su resultado es el

esquema conceptual de la base de datos. Una opción para recoger los requisitos consiste en examinar

los diagramas de flujo de datos, que se pueden haber producido previamente, para identificar cada

una de las áreas funcionales. La otra opción consiste en entrevistar a los usuarios, examinar los

procedimientos, los informes y los formularios, y también observar el funcionamiento de la empresa.

Un esquema conceptual es una descripción de alto nivel de la estructura de la base de datos,

independientemente del SGBD que se vaya a utilizar para manipularla. Para especificar los esquemas

conceptuales se utilizan modelos conceptuales. Los modelos conceptuales se utilizan para representar

la realidad a un alto nivel de abstracción. Mediante los modelos conceptuales se puede construir

una descripción de la realidad fácil de entender. En el diseño de bases de datos se usan primero los

modelos conceptuales para lograr una descripción de alto nivel de la realidad, y luego se transforma

el esquema conceptual en un esquema lógico (diseño lógico).

109



-- 119 of 227 --



110 6.1. MODELO ENTIDAD–RELACIÓN

Los modelos conceptuales deben ser buenas herramientas para representar la realidad, por lo

que deben poseer las siguientes cualidades:

Expresividad: deben tener suficientes conceptos para expresar perfectamente la realidad.

Simplicidad: deben ser simples para que los esquemas sean fáciles de entender.

Minimalidad: cada concepto debe tener un significado distinto.

Formalidad: todos los conceptos deben tener una interpretación única, precisa y bien definida.

En general, un modelo no es capaz de expresar todas las propiedades de una realidad determinada,

por lo que hay que añadir afirmaciones que complementen el esquema.

El modelo entidad-relación es el modelo conceptual más utilizado para el diseño conceptual

de bases de datos. Fue introducido por Peter Chen en 1976. El modelo entidad–relación está for-

mado por un conjunto de conceptos que permiten describir la realidad mediante un conjunto de

representaciones gráficas y lingüísticas. Estos conceptos se muestran en la figura 6.1:

relación	entidad

atributo identificador

atributo compuesto

jerarquía de generalización

Figura 6.1: Conceptos del modelo entidad–relación.

Originalmente, el modelo entidad-relación sólo incluía los conceptos de entidad, relación y atri-

buto. Más tarde, se añadieron otros conceptos, como los atributos compuestos y las jerarquías de

generalización, en lo que se ha denominado modelo entidad-relación extendido.

Las tareas a realizar en el diseño conceptual son las siguientes:

1. Identificar las entidades.

2. Identificar las relaciones.



-- 120 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 111

3. Identificar los atributos y asociarlos a entidades y relaciones.

4. Determinar los dominios de los atributos.

5. Determinar los identificadores.

6. Determinar las jerarquías de generalización (si las hay).

7. Dibujar el diagrama entidad–relación.

8. Revisar el esquema conceptual local con el usuario.

6.1.1. Entidades

En primer lugar hay que definir los principales conceptos que interesan al usuario. Estos con-

ceptos serán las entidades. Una forma de identificar las entidades es examinar las especificaciones

de requisitos de usuario. En estas especificaciones se buscan los nombres o los sintagmas nominales

que se mencionan (por ejemplo: código del cliente, nombre del cliente, número de la factura, fecha

de la factura, iva de la factura). También se buscan conceptos importantes como personas, lugares

o conceptos abstractos, excluyendo aquellos nombres que sólo son propiedades de otros objetos. Por

ejemplo, se pueden agrupar el código del cliente y el nombre del cliente en una entidad denominada

cliente, y agrupar el número de la factura, la fecha de la factura y el iva de la factura en otra entidad

denominada factura.

Otra forma de identificar las entidades es buscar aquellos conceptos que existen por sí mismos.

Por ejemplo, vendedor es una entidad porque los vendedores existen, sepamos o no sus nombres,

direcciones y teléfonos. Siempre que sea posible, el usuario debe colaborar en la identificación de las

entidades.

A veces, es difícil identificar las entidades por la forma en que aparecen en las especificaciones

de requisitos. Los usuarios, a veces, hablan utilizando ejemplos o analogías. En lugar de hablar de

vendedores en general, hablan de personas concretas, o bien, hablan de los puestos que ocupan esas

personas.

Para complicarlo aún más, los usuarios usan, muchas veces, sinónimos y homónimos. Dos pala-

bras son sinónimos cuando tienen el mismo significado. Los homónimos ocurren cuando la misma

palabra puede tener distintos significados dependiendo del contexto.

No siempre es obvio saber si un concepto es una entidad, una relación o un atributo. El análisis

es subjetivo, por lo que distintos diseñadores pueden hacer distintas interpretaciones, aunque todas

igualmente válidas. Todo depende de la opinión y la experiencia de cada uno. Los diseñadores de

bases de datos deben tener una visión selectiva y clasificar las cosas que observan dentro del contexto

de la empresa u organización. A partir de unas especificaciones de usuario es posible que no se pueda



-- 121 of 227 --



112 6.1. MODELO ENTIDAD–RELACIÓN

deducir un conjunto único de entidades, pero después de varias iteraciones del proceso de análisis,

se llegará a obtener un conjunto de entidades que sean adecuadas para el sistema que se ha de

construir.

Conforme se van identificando las entidades, se les dan nombres que tengan un significado y

que sean obvias para el usuario. Los nombres de las entidades y sus descripciones se anotan en

el diccionario de datos. Cuando sea posible, se debe anotar también el número aproximado de

ocurrencias de cada entidad. Si una entidad se conoce por varios nombres, éstos se deben anotar

en el diccionario de datos como alias o sinónimos. En el modelo entidad–relación, las entidades se

representan mediante un rectángulo que posee dentro el nombre de la entidad.

Ejemplo 6.1 Entidades.

CIUDADES y ASIGNATURAS se han representado como entidades porque de ellas se requiere

almacenar información: nombre de la ciudad, provincia en la que se encuentra, número de habitantes,

nombre de la asignatura, créditos teóricos y prácticos, titulación a la que pertenece, etc.

CIUDAD es una entidad;

Alicante, Toledo son ocurrencias de CIUDAD.

ASIGNATURA ASIGNATURA es una entidad;

Lengua, Ciencias son ocurrencias de ASIGNATURA.

## CIUDAD

Figura 6.2: Ejemplos de dos entidades y de ocurrencias de las mismas.

6.1.2. Relaciones

Una vez definidas las entidades, se deben definir las relaciones existentes entre ellas. Del mismo

modo que para identificar las entidades se buscaban nombres en las especificaciones de requisitos,

para identificar las relaciones se suelen buscar las expresiones verbales. Por ejemplo: ciudad donde

ha nacido el estudiante y ciudades en que ha residido; cada director tiene a su cargo a un conjunto

de empleados. Si las especificaciones de requisitos reflejan estas relaciones es porque son importantes

para la empresa y, por lo tanto, se deben reflejar en el esquema conceptual. La mayoría de las rela-

ciones son binarias (entre dos entidades), pero también puede haber relaciones en las que participen

más de dos entidades, así como relaciones recursivas.

Es muy importante repasar las especificaciones para comprobar que todas las relaciones, explíci-

tas o implícitas, se han encontrado. Si se tienen pocas entidades, se puede comprobar por parejas si

hay alguna relación entre ellas. De todos modos, las relaciones que no se identifican ahora se suelen

encontrar cuando se valida el esquema con las transacciones que debe soportar.



-- 122 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 113

Una vez identificadas todas las relaciones, hay que determinar la cardinalidad mínima y máxima

con la que participa cada entidad en cada una de ellas. De este modo, el esquema representa de un

modo más explícito la semántica de las relaciones. La cardinalidad es un tipo de restricción que se

utiliza para comprobar y mantener la calidad de los datos.

La cardinalidad mínima indica si la participación de la entidad en la relación es opcional (se

indica con 0) o si es obligatoria (se indica con 1). Que sea obligatoria implica que todas las ocurrencias

de la entidad deberán relacionarse con, al menos, una ocurrencia de la entidad que se encuentra al

otro lado de la relación. La cardinalidad máxima indica si cada ocurrencia de la entidad sólo puede

relacionarse con una ocurrencia de la entidad del otro lado de la relación (se indica con 1), o si

puede relacionarse con varias a la vez (se indica con n).

Conforme se van identificando las relaciones, se les van asignando nombres que tengan significado

para el usuario. En el diccionario de datos se anotan los nombres de las relaciones, su descripción y

las restricciones que existen sobre ellas.

Ejemplo 6.2 Tipos de relaciones.

Las entidades se relacionan entre ellas o consigo mismas, representándose esto en el esquema con-

ceptual mediante líneas y un rombo en donde se da nombre a la relación. En la línea se expresa

la cardinalidad con la que cada entidad participa en la relación mediante dos componentes entre

paréntesis.

(0,n)

(1,n) (0,n)

(1,1)

obligatoria opcional

nacido

residido

dirigir

(1,1)

(0,n)	dirige a

es dirigido por

(a) (b)

## ESTUDIANTE EMPLEADO	CIUDAD

Figura 6.3: Ejemplos de relaciones.

Los esquemas de la figura 6.3 corresponden a los siguientes requisitos:

(a) De cada estudiante se sabe la ciudad en donde ha nacido (será una y sólo una) y también las

ciudades en donde ha residido (al menos aquella en la que reside en la actualidad).

(b) Cada empleado es dirigido por otro empleado (obligatoriamente por un y sólo por uno) y un

empleado puede ser director de varios empleados (o no serlo de ninguno).



-- 123 of 227 --



114 6.1. MODELO ENTIDAD–RELACIÓN

6.1.3. Atributos

El siguiente paso consiste en identificar los atributos y asociarlos con las entidades y las relaciones

en función de su significado. Al igual que con las entidades, para identificar los atributos se buscan

nombres en las especificaciones de requisitos. Son atributos los nombres que identifican propiedades,

cualidades, identificadores o características de entidades o de relaciones.

Lo más sencillo es preguntarse, para cada entidad y cada relación, qué información se quiere saber

de ellas. La respuesta a esta pregunta se debe encontrar en las especificaciones de requisitos. Pero, en

ocasiones, será necesario preguntar a los usuarios para que aclaren los requisitos. Desgraciadamente,

los usuarios pueden dar respuestas a esta pregunta que también contengan otros conceptos, por lo

que hay que considerar sus respuestas con mucho cuidado.

Al identificar los atributos, hay que tener en cuenta si son simples o compuestos. Por ejemplo,

el atributo dirección puede ser simple, teniendo la dirección completa como un solo valor: ‘San

Rafael 45, Almazora’; o puede ser un atributo compuesto, formado por la calle (‘San Rafael’), el

número (‘45’) y la población (‘Almazora’). El escoger entre atributo simple o compuesto depende

de los requisitos del usuario. Si el usuario no necesita acceder a cada uno de los componentes de

la dirección por separado, se puede representar como un atributo simple. Pero si el usuario quiere

acceder a los componentes de forma individual, entonces se debe representar como un atributo

compuesto.

En el esquema conceptual se debe reflejar la cardinalidad mínima y máxima de cada atributo,

ya sea simple o compuesto. La cardinalidad mínima indica si el atributo es opcional (se expresa con

0) o si es obligatorio (se expresa con 1). La cardinalidad máxima indica si el atributo tiene, como

mucho, un solo valor (se indica con 1) o si puede tener varios valores, es decir, si es multievaluado

(se indica con n). Puesto que el valor más usual en la cardinalidad de los atributos es (1, 1) (tienen

un valor y sólo uno), ésta se omite para estos casos, siendo el valor por defecto.

En esta fase también se deben identificar los atributos derivados o calculados, que son aquellos

cuyo valor se puede calcular a partir de los valores de otros atributos. Por ejemplo, el número de

estudiantes matriculados, la edad de los estudiantes o el número ciudades en que residen los estu-

diantes. Algunos diseñadores no representan los atributos derivados en los esquemas conceptuales.

Si se hace, se debe indicar claramente que el atributo es derivado y a partir de qué atributos se

obtiene su valor. El momento en que hay que considerar los atributos derivados es en el diseño físico.

Cuando se están identificando los atributos, se puede descubrir alguna entidad que no se ha

identificado previamente, por lo que hay que volver al principio introduciendo esta entidad y viendo

si se relaciona con otras entidades.

Es muy útil elaborar una lista con los atributos que aparecen en los requisitos e ir eliminándolos

de la lista conforme se vayan asociando a una entidad o relación. De este modo, uno se puede



-- 124 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 115

asegurar de que cada atributo se asocia a una sola entidad o relación, y que cuando la lista se ha

acabado, se han asociado todos los atributos.

Hay que tener mucha precaución cuando parece que un mismo atributo se debe asociar a varias

entidades. Esto puede ser por una de las siguientes causas:

Se han identificado varias entidades, como director, supervisor y administrativo, cuando, de

hecho, pueden representarse como una sola entidad denominada empleados. En este caso, se

puede escoger entre introducir una jerarquía de generalización (se presentan más adelante), o

dejar las entidades que representan cada uno de los puestos que ocupan los empleados.

Se ha identificado una relación entre entidades. En este caso, se debe asociar el atributo a

una sola de las entidades y hay que asegurarse de que la relación ya se había identificado

previamente. Si no es así, se debe actualizar el esquema y el diccionario, para recoger la nueva

relación.

Conforme se van identificando los atributos, se les asignan nombres que tengan significado para

el usuario. De cada atributo se debe anotar la siguiente información en el diccionario:

Nombre y descripción del atributo.

Alias o sinónimos por los que se conoce al atributo.

Tipo de dato y longitud.

Valores por defecto del atributo (si se especifican).

Si el atributo es compuesto, especificar qué atributos simples lo forman y describirlos como se

indica en esta lista.

Si el atributo es derivado, indicar cómo se calcula su valor.

Ejemplo 6.3 Atributos simples.

De los estudiantes del diagrama de la figura 6.4 se quiere conocer el nombre, el dni y la carrera que

están estudiando. Conocer la ciudad de nacimiento es, en este caso, opcional (cardinalidad (0, 1))

y, si se conoce, se conocerá también la fecha de nacimiento. Es por ello que este último atributo

está en la relación y no en la entidad estudiante: va ligado a conocer o no la ciudad de nacimiento.

Además, de los estudiantes también interesan las ciudades en donde han residido y la fecha en que

han comenzado a hacerlo en cada una de ellas. De las ciudades interesa su nombre y su número

de habitantes, y si es posible, su altitud. El que las ciudades participen en ambas relaciones con

cardinalidad (0, n) significa que hay ciudades en donde puede que no haya nacido ningún estudiante o



-- 125 of 227 --



116 6.1. MODELO ENTIDAD–RELACIÓN

(0,n)

(1,n) (0,n)

nacido

residido

dni

carrera

fecha inicio

fecha nacimiento

habitantes

nombre

altitud

nombre

(0,1)

(0,1)

## ESTUDIANTE CIUDAD

Figura 6.4: Ejemplo de atributos simples.

que hayan nacido varios, y que hay ciudades en donde puede que no haya residido ningún estudiante

o que hayan residido varios.

Ejemplo 6.4 Atributos compuestos.

lugar residencia

ciudad

ciudad

lugar nacimiento

fecha inicio	nombre

dni

(0,n)

(1,n)

(0,1)

fecha

## EMPLEADO

título

Figura 6.5: Ejemplo de atributos compuestos.

El diagrama de la figura 6.5 corresponde a unos requisitos muy similares a los del ejemplo anterior:

datos de empleados, lugar de nacimiento y lugares de residencia. En este caso, as ciudades no

se han considerado como entidad porque de ellas no hay que conocer otras propiedades aparte

de su nombre. En este ejemplo aparecen atributos compuestos y atributos multievaluados (con

cardinalidad máxima n). La interpretación del esquema es la siguiente: de los empleados interesa

su nombre y su dni, además del título o títulos que tienen, si es el caso (puede haber empleados sin

titulación). Si se conoce el lugar de nacimiento, interesa el nombre de la ciudad y la fecha. Además,

interesa conocer los lugares en que ha residido y, para cada uno de ellos, el nombre de la ciudad y

la feche de inicio de la residencia.

6.1.4. Dominios

En este paso se deben determinar los dominios de los atributos. El dominio de un atributo es

el conjunto de valores que puede tomar el atributo. Por ejemplo el dominio de los dni son las tiras



-- 126 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 117

de nueve caracteres en donde los ocho primeros son dígitos numéricos y el último es un carácter de

control que se obtiene al aplicar un determinado algoritmo; el dominio de los códigos postales en

España son cadenas de cinco dígitos, correspondiendo los dos primeros a un número de provincia

válido.

Un esquema conceptual está completo si incluye los dominios de cada atributo: los valores per-

mitidos para cada atributo, su tamaño y su formato. También se puede incluir información adicional

sobre los dominios como, por ejemplo, las operaciones que se pueden realizar sobre cada atributo,

qué atributos pueden compararse entre sí o qué atributos pueden combinarse con otros. Aunque

sería muy interesante que el sistema final respetara todas estas indicaciones sobre los dominios, esto

es todavía una línea abierta de investigación. Toda la información sobre los dominios se debe anotar

también en el diccionario de datos.

6.1.5. Identificadores

Cada entidad tiene al menos un identificador. En este paso, se trata de encontrar todos los

identificadores de cada una de las entidades. Los identificadores pueden ser simples o compuestos.

De cada entidad se escogerá uno de los identificadores como clave primaria en la fase del diseño

lógico. Todos los identificadores de las entidades se deben anotar en el diccionario de datos.

Cuando se determinan los identificadores es fácil darse cuenta de si una entidad es fuerte o

débil. Si una entidad tiene al menos un identificador, es fuerte (otras denominaciones son padre,

propietaria o dominante). Si una entidad no tiene atributos que le sirvan de identificador, es débil

(otras denominaciones son hijo, dependiente o subordinada).

Ejemplo 6.5 Identificadores de entidades fuertes.

El diagrama de la figura 6.6 muestra cómo se identifican estudiantes y ciudades. No conviene olvidar

que estamos trabajando ante unos supuestos requisitos. En este caso, se sabe que los estudiantes se

identifican de modo único por su dni y las ciudades por su nombre.

Ejemplo 6.6 Identificadores de entidades débiles.

En el diagrama de la figura 6.7 se muestra una entidad débil: la de los empleados. Cada empleado

se identifica por su número de empleado dentro de su departamento. Nótese que los departamentos

tienen dos posibles formas de identificarse: bien mediante su número o bien mediante su nombre.

Por lo tanto hay también dos maneras de identificar a los empleados: por la combinación de su

número de empleado y el número de su departamento o bien por la combinación de su número de

empleado y el nombre de su departamento.



-- 127 of 227 --



118 6.1. MODELO ENTIDAD–RELACIÓN

(0,n)

(1,n) (0,n)

nacido

residido

ESTUDIANTE	dni

carrera

fecha inicio

fecha nacimiento

habitantes

nombre

altitud

nombre

(0,1)

(0,1)

## CIUDAD

Figura 6.6: Ejemplo de identificador de entidades fuertes.

num_depto

nombre

presupuesto

(1,n)

trabaja fecha_ingreso

num_emp

(1,1)

## DEPARTAMENTO EMPLEADO

nombre

Figura 6.7: Ejemplo de identificador de entidad débil.

6.1.6. Jerarquías de generalización

En este paso hay que observar las entidades que se han identificado hasta el momento. Hay

que ver si es necesario reflejar las diferencias entre distintas ocurrencias de una entidad, con lo

que surgirán nuevas subentidades de esta entidad genérica; o bien, si hay entidades que tienen

características en común y que realmente son subentidades de una nueva entidad genérica.

En cada jerarquía hay que determinar la cardinalidad mínima y máxima. La cardinalidad mínima

expresa si cada ocurrencia de la entidad está obligada o no a estar clasificada en alguna subentidad.

Si está obligada se dice que la jerarquía es total y si no lo está, se dice que es parcial. La cardinalidad

máxima expresa si cada ocurrencia de la entidad se clasifica sólo como una subentidad o si puede

estar clasificada como varias. Si lo está sólo en una, se dice que es exclusiva, sino es superpuesta.

Esta cardinalidad se expresa bien con letras o bien con números: (p/t, e/s) ≡ (0/1, 1/n)

Ejemplo 6.7 Jerarquía de generalización.

La figura 6.8 muestra una jerarquía que clasifica las pólizas de una compañía de seguros. Todas

ellas tienen un número que las identifica, una fecha de inicio y una fecha de finalización. Además,

si una póliza es de un seguro de vida, se conoce la información de sus beneficiarios (puede ser más

de uno). Si la póliza es de un seguro de automóvil, se conoce la matrícula del mismo. Puesto que

un atomóvil sólo puede tener una póliza, su matrícula es también un identificador de la misma. Por

último, si la póliza es de un seguro de vivienda, se conoce el domicilio de la vivienda asegurada.



-- 128 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 119

(1,n)

domicilio	beneficiario

dni nombre fecha_nacim

matrícula

## DE AUTOMÓVIL DE VIVIENDA	DE VIDA

(1,1)

fecha_fin

fecha_ini

número

## PÓLIZA

Figura 6.8: Ejemplo de jerarquía de generalización.

6.1.7. Diagrama entidad–relación

Una vez identificados todos los conceptos (entidades, atributos, relaciones, etc.), se debe dibujar

el diagrama entidad–relación correspondiente a cada una de las vistas de los usuarios. Se obtienes

así los esquemas conceptuales locales.

Antes de dar por finalizada la fase del diseño conceptual, se debe revisar cada esquema conceptual

local con los usuarios. Estos esquemas están formados por cada diagrama entidad–relación y toda

la documentación que describe cada esquema. Si se encuentra alguna anomalía, hay que corregirla

haciendo los cambios oportunos, por lo que posiblemente haya que repetir alguno de los pasos

anteriores. Este proceso debe repetirse hasta que se esté seguro de que cada esquema conceptual es

una fiel representación de la parte de la empresa que se está tratando de modelar.

6.2. Recomendaciones

Este apartado dan algunas recomendaciones para dibujar los esquemas conceptuales y se mues-

tran los errores más comunes que se cometen en los diagramas.

Dos entidades no se pueden conectar directamente con una línea (ver figura 6.9). La forma de

conectar entidades es mediante relaciones.

## PROFESOR ASIGNATURA

## INCORRECTO

Figura 6.9: No es correcto conectar entidades directamente (excepto si forman parte de una jerar-

quía).



-- 129 of 227 --



120 6.2. RECOMENDACIONES

No puede haber conexiones entre dos relaciones (ver figura 6.10).

## PROFESOR ASIGNATURA

## SEMESTRE

imparte

en

## INCORRECTO

Figura 6.10: No es correcto conectar relaciones.

Los atributos se asocian a entidades y a relaciones, pero no se asocian a las líneas que las

conectan (ver figura 6.11).

LIBRO	toma

fecha

## ESTUDIANTE

## INCORRECTO

Figura 6.11: No es correcto colocar atributos fuera de entidades y relaciones.

Cuando una entidad participa en una relación, se debe indicar siempre la cardinalidad con la

que participa (0/1, 1/n).

Un atributo es una propiedad de una entidad o de una relación. Cada atributo se dibuja sólo

una vez en el esquema.

Puede haber nombres de atributos iguales en distintas entidades siempre que tengan signifi-

cados diferentes. Por ejemplo, la entidad ESTUDIANTE tiene un atributo nombre y la entidad

UNIVERSIDAD también puede tener un atributo nombre, teniendo, cada uno de estos atributos,

un significado diferente.

Los atributos simples se representan mediante círculos pequeños conectados directamente a

la entidad o la relación con una línea en la que se especifica la cardinalidad. La cardinalidad

por defecto es (1, 1). Junto a cada círculo se especifica el nombre del atributo (el nombre que

debe ser significativo). Los atributos que no forman parte de un atributo compuesto deben

unirse con líneas independientes a la entidad (no es correcto hacerlo como se muestra en la

figura 6.12).



-- 130 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 121

domicilio

fecha_nacim

apellidos

nombre

## ESTUDIANTE

## INCORRECTO

Figura 6.12: No es correcto usar una misma línea para los atributos.

Los atributos compuestos se representan mediante un óvalo, especificando su nombre en el inte-

rior. Cada atributo compuesto tendrá uno o varios atributos simples conectados directamente

a él mediante una línea. El atributo compuesto estará conectado a la entidad o la relación

mediante una línea en la que se especificará la cardinalidad. La cardinalidad por defecto es

(1, 1).

La cardinalidad de un atributo no expresa su rango de valores (ver figura 6.13). El rango de

valores posibles es el dominio sobre el que se define el atributo. La cardinalidad es el número

de valores distintos que puede tener el atributo a la vez.

edad

(0,n)

## PERSONA

## INCORRECTO

Figura 6.13: No es correcto usar la cardinalidad para expresar el rango de valores.

Si un atributo tiene un número fijo de posibles valores, éstos no se dibujan como componentes

de un atributos compuesto (ver figura 6.14). Al especificar el dominio del atributo será cuando

se especifiquen los posibles valores.

ALUMNO etapa

secundaria

primaria

infantil

## INCORRECTO

Figura 6.14: No es correcto usar los atributos compuestos para expresar rangos de valores.

Todas las entidades deben tener, al menos, un identificador. Cada identificador se representa

mediante un círculo relleno. Los atributos con cardinalidad máxima n no pueden ser identifi-

cadores. En el diseño conceptual se deben tener en cuenta todos los posibles identificadores y



-- 131 of 227 --



122 6.2. RECOMENDACIONES

dibujarlos1.

Cuando un identificador está formado por varios atributos, éstos no tendrán su círculo colo-

reado (ver figura 6.15). Los atributos que forman el identificador se deben dejar sin colorear,

se conectan mediante una línea y es al final de la misma donde se dibuja un círculo coloreado,

indicando así que la combinación de todos los atributos conectados forman un identificador

de la entidad.

colegio

MEDICO num_colegiado

## INCORRECTO

Figura 6.15: No es correcto colorear los atributos simples que forman un identificador compuesto.

Las relaciones no tienen identificadores (ver figura 6.16).

LIBRO	toma

fecha

## ESTUDIANTE

## INCORRECTO

Figura 6.16: No es correcto poner identificadores a las relaciones.

Una entidad débil es aquella que depende de otra para identificarse. Su participación en la

relación con la entidad de la que depende será siempre (1, 1). El identificador de la entidad

débil estará formado por uno o varios de sus atributos, en combinación con el identificador

de la entidad de la que depende. Esto se expresa conectando con un línea dichos atributos,

y la línea que conecta a la otra entidad con la relación de dependencia. Al final de la línea

se dibujará un círculo coloreado, expresando así el identificador. Los demás atributos que lo

forman no deben colorearse (ver figura 6.17)

1Todos ellos serán claves candidatas en la etapa del diseño lógico: uno terminará siendo la clave primaria (PRIMARY

KEY) y el resto serán claves alternativas (UNIQUE).



-- 132 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 123

EMPLEADO DEPARTAMENTO	trabaja

num_depto	num_emp

## INCORRECTO

Figura 6.17: No es correcto colorear los atributos simples que forman parte de un identificador

compuesto.

6.3. Ejemplos

Ejemplo 6.8 Asociación de cines

“La asociación de cines de una ciudad quiere crear un servicio telefónico en el que se pueda hacer

cualquier tipo de consulta sobre las películas que se están proyectando actualmente. Algunos ejem-

plos de consultas son las siguientes: en qué cines hacen una determinada película y el horario de

los pases, qué películas de dibujos animados se están proyectando y dónde, qué películas hay en un

determinado cine, etc. La aplicación informática que se va a implementar necesitará de una base

de datos relacional que contenga toda esta información. Como primer paso, en este ejercicio se pide

realizar el esquema conceptual.

En concreto, para cada cine se debe dar el título de la película y el horario de los pases, además del

nombre del director de la misma, el nombre de hasta tres de sus protagonistas, el género (comedia,

intriga, etc.) y la clasificación (todos los públicos, a partir de 13 años, a partir de 18 años, etc.).

Para cada cine también se almacenará la calle y número donde está, el teléfono y los distintos

precios según el día (día del espectador, día del jubilado, festivos y vísperas, carné de estudiante,

etc.). Hay que tener en cuenta que algunos cines tienen varias salas en las que se pasan distintas

películas y también que en un mismo cine se pueden pasar películas distintas en diferentes pases.”

tarifa

precio tipo

## CINE

nombre

calle

número

teléfono

(1,n)

pasa

hora

(1,n)

(1,n)	(1,n)

(0,n)

título

PELÍCULA (1,3)

director

género

protagonista

clasificación

Figura 6.18: Esquema conceptual para el caso de la asociación de cines.



-- 133 of 227 --



124 6.3. EJEMPLOS

A partir de los requisitos especificados se ha obtenido el esquema conceptual de la figura 6.18.

Se han identificado dos entidades: los cines y las películas. Son atributos de los cines su nombre,

su dirección, su número de teléfono y la tarifa de precios (cada tipo de tarifa tiene un precio). Las

películas tienen como atributos el título, el director, los nombres de hasta tres de sus protagonistas,

el género y la clasificación.

La relación entre cines y películas se establece cuando éstos las incluyen en sus pases. Una

película se puede pasar en varios horarios y es por eso que se han incluido éstos en la relación

La siguiente tabla muestra las características de los atributos del esquema:

Atributo Tipo de dato Dominio Ejemplo

nombre cadena Neocine Castellón

calle cadena Paseo Buenavista

número cadena s/n

teléfono cadena 964 280 121

tarifa.precio moneda > 0 4,50

tarifa.tipo cadena Día del espectador

hora hora 20:15

título cadena El niño con el pijama de rayas

director cadena Mark Herman

protagonista cadena David Thewlis

género cadena drama

clasificación cadena 7 años

Ejemplo 6.9 Catálogo de un portal web.

“Se desea incorporar un catálogo a un portal web y como primer paso, en este ejercicio se va a

obtener el esquema conceptual de la base de datos que le dará soporte.

El catálogo se va a organizar como una lista jerárquica de temas. Cada tema final de la je-

rarquía tendrá un conjunto de enlaces a páginas web recomendadas. Por ejemplo, un tema podría

ser PostgreSQL. Dentro de la jerarquía, éste podría ser un subtema (hijo) del tema Sistemas de

gestión de bases de datos. El tema MySQL podría ser otro subtema de éste último.

De cada tema final hay varias páginas web recomendadas. En el tema PostgreSQL una página

podría ser www.postgresql.org y otra página podría ser la web donde están colgados estos apuntes.

De cada página se guarda la URL y el título.

Para cada página se almacena una prioridad en cada tema en que se recomienda. Esta prioridad

sirve para ordenarlas al mostrar los resultados de las búsquedas en el catálogo de temas. Por ejemplo,



-- 134 of 227 --



### CAPÍTULO 6. DISEÑO CONCEPTUAL 125

la página www.postgresql.org tendría una prioridad mayor que la de los apuntes que tienes en tus

manos.

Cada tema tiene una serie de palabras clave asociadas, cada una con un número que permite

ordenarlas según su importancia dentro del tema. Por ejemplo, el tema PostgreSQL podría tener

las palabras clave (1) relacional, (2) multiusuario y (3) libre.

También se quiere guardar información sobre las consultas que se han realizado sobre cada tema

del catálogo. Cada vez que se consulte un tema se guardará la IP de la máquina desde la que se ha

accedido y la fecha y hora de la consulta.

Algunas páginas web son evaluadas por voluntarios. La calificación que otorgan es: **** , ***,

** o *. Se debe almacenar información sobre los voluntarios (nombre y correo electrónico) y las

evaluaciones que han hecho de cada página: calificación y fecha en que se ha valorado. Una misma

página puede ser evaluada por distintos voluntarios y, ya que las páginas van cambiando su estructura

y contenidos, pueden ser valoradas en más de una ocasión por un mismo voluntario. En el caso de

repetir una evaluación de una misma página por un mismo voluntario, sólo interesa almacenar la

última evaluación realizada (la más reciente).”

A partir de estos requisitos, se ha obtenido el esquema conceptual de la figura 6.19.

palabras consultas

contiene evalúa

título

palabra importancia ip fecha_hora

tema

url

calificación

fecha	prioridad

(0,n) (1,n) (0,n) (1,n)

email nombre

(0,1) (0,n)

jerarq

es_hijo_de es_padre_de

(1,n) (0,n)

## TEMA PÁGINA VOLUNTARIO

Figura 6.19: Esquema conceptual para el caso del catálogo web.

Se han identificado tres entidades: los temas del catálogo, las páginas web a las que apuntan los

temas y los voluntarios que califican las páginas. Se han considerado atributos del tema su nombre,

las palabras clave con su importancia (atributo compuesto con múltiples valores) y las consultas

que se van realizando (IP e instante de tiempo).

La jerarquía de temas del catálogo se ha representado mediante una relación de la entidad de

los temas consigo misma, de manera que algunas ocurrencias de esta entidad están relacionadas con

otras ocurrencias de la misma. Cuando se establece una de estas relaciones, es importante etiquetar



-- 135 of 227 --



126 6.3. EJEMPLOS

los caminos. Así se tiene que cada tema hijo, lo es sólo de un tema, y si es padre, puede serlo de

varios temas.

Otra entidad identificada es la de las páginas web. De cada página se tiene la URL y el título,

y puede ser apuntada por varios temas de la jerarquía.

La tercera entidad es la correspondiente a los voluntarios que califican las páginas. Cada volun-

tario tiene una dirección de correo electrónico (email) y su nombre. La relación entre voluntarios y

páginas se establece cada vez que un voluntario califica una página. Los posibles valores del atributo

calificación son

En la siguiente tabla se muestran algunas características de los atributos. Nos hemos permitido

la libertad de especificar tipos como ip o url, ya que éstos tienen especificaciones conocidas y bien

definidas. Las longitudes de las cadenas no se han especificado ya que en los requisitos del ejercicio

no se ha proporcionado información al respecto.

Atributo Tipo de dato Dominio Ejemplo

### tema cadena PostgreSQL

palabra cadena relacional

importancia entero > 0 2

ip ip 164.12.123.65

fecha_hora instante 11/10/2008 13:23:10

prioridad entero > 0 5

url url www.postgresql.org

título cadena The world’s most advanced

open source database

email correo electrónico persona@servicio.com

nombre cadena Mafalda Goreiro

fecha fecha fecha actual 11/10/2008

calificación cadena ∗ ∗ ∗∗, ∗ ∗ ∗, ∗∗, ∗ ****



-- 136 of 227 --



### Capítulo 7

Diseño lógico relacional

### Introducción y objetivos

Una vez realizado el diseño conceptual, y obtenido el esquema correspondiente mediante un

diagrama entidad–relación, se debe proceder con la etapa del diseño lógico. En esta etapa se debe

decidir el modelo lógico de base de datos que se va a utilizar para llevar a cabo la implementación.

Puesto que el modelo relacional es el modelo lógico de bases de datos más extendido, en este capítulo

se presenta la metodología de diseño para este modelo.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Obtener un conjunto de tablas a partir de un esquema conceptual (expresado mediante un

diagrama entidad–relación) y de las especificaciones adicionales expresadas en el diccionario

de datos.

Establecer para cada tabla: la clave primaria, las claves alternativas, las claves ajenas y las

reglas de integridad para las mismas.

Establecer las restricciones y reglas de negocio que se deben hacer sobre las tablas y sobre sus

columnas.

Obtener un diagrama entidad–relación a partir de un conjunto de tablas.

7.1. Esquema lógico

El diseño lógico es el proceso de construir un esquema de la información que utiliza la empresa,

basándose en un modelo de base de datos específico e independiente del SGBD concreto que se vaya

a utilizar, así como de cualquier otra consideración física. Mientras que el objetivo fundamental del

diseño conceptual es la compleción y expresividad del esquema conceptual, el objetivo del diseño

127



-- 137 of 227 --



128 7.1. ESQUEMA LÓGICO

lógico es obtener una representación que use, del modo más eficiente posible, los recursos que el

modelo de SGBD posee para estructurar los datos y para modelar las restricciones

En esta etapa, se transforma el esquema conceptual, obtenido en la etapa anterior del diseño,

en un esquema lógico que utilizará las estructuras de datos del modelo de base de datos en el que se

basa el SGBD que se vaya a utilizar. Los modelos de bases de datos más extendidos son el modelo

relacional, el modelo de red y el modelo jerárquico. El modelo orientado a objetos es también muy

popular, existiendo SGBD objeto–relacionales que implementan el modelo relacional e incorporan

características de la orientación a objetos.

El esquema lógico es una fuente de información para el diseño físico. Además, juega un papel

importante durante la etapa de mantenimiento del sistema, ya que permite que los futuros cambios

que se realicen sobre los programas de aplicación o sobre los datos, se representen correctamente en

la base de datos.

Tanto el diseño conceptual, como el diseño lógico, son procesos iterativos, tienen un punto de

inicio y se van refinando continuamente. Ambos se deben ver como un proceso de aprendizaje en

el que el diseñador va comprendiendo el funcionamiento de la empresa y el significado de los datos

que maneja. El diseño conceptual y el diseño lógico son etapas clave para conseguir un sistema

que funcione correctamente. Si la base de datos no es una representación fiel de la empresa, será

difícil, sino imposible, definir todas las vistas de los usuarios (los esquemas externos), o mantener la

integridad de la misma. También puede ser difícil definir la implementación física o mantener unas

prestaciones aceptables del sistema. Además, hay que tener en cuenta que la capacidad de ajustarse

a futuros cambios es un sello que identifica a los buenos diseños de bases de datos. Por todo esto,

es fundamental dedicar el tiempo y las energías necesarias para producir el mejor esquema posible.

La estructura de datos del modelo relacional es la relación (capítulo 2), a la que coloquialmente

denominamos tabla, término utilizado en la implementación de este modelo por parte del lenguaje

SQL (capítulo 4).

El objetivo de esta etapa es obtener el esquema lógico, que estará formado por las tablas de la

base de datos en tercera forma normal1, a partir de la especificación realizada en la etapa del diseño

conceptual. Una vez obtenidas las tablas, se considerará la posibilidad de modificar el esquema de

la base de datos para conseguir una mayor eficiencia.

No se debe olvidar que, si en esta etapa se detecta alguna carencia o error en la etapa del diseño

conceptual, se debe subsanar, dando lugar a una nueva versión de la documentación que se ha

producido en dicha etapa.

Para cada tabla del esquema lógico se debe especificar:

Nombre y descripción de la información que almacena. Es conveniente indicar si corresponde

1La tercera forma normal se presenta en el apartado 7.2.5, que trata la normalizacion.



-- 138 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 129

a una entidad, una relación o un atributo.

Para cada columna indicar: nombre, tipo de datos (puede ser un tipo de SQL), si admite nulos,

el valor por defecto (si lo tiene) y el rango de valores (mediante un predicado en SQL).

Indicar la clave primaria y si se ha de generar automáticamente.

Indicar las claves alternativas.

Indicar las claves ajenas y sus reglas de comportamiento ante el borrado y la modificación de

la clave primaria a la que referencian.

Si alguna columna es un dato derivado (su valor se calcula a partir de otros datos de la base

de datos) indicar cómo se obtiene su valor.

Especificar las restricciones a nivel de fila de cada tabla, si las hay. Estas restricciones son

aquellas que involucran a una o varias columnas dentro de una misma fila.

Especificar otras restricciones no expresadas antes (serán aquellas que involucran a varias filas

de una misma tabla o a filas de varias tablas a la vez).

Especificar las reglas de negocio, que serán aquellas acciones que se deban llevar a cabo de

forma automática como consecuencia de actualizaciones que se realicen sobre la base de datos.

Introducir tablas de referencia para establecer listas de valores para las columnas que las

necesiten.

Una vez obtenido el esquema de la base de datos en tercera forma normal, y teniendo en cuenta

los requisitos en cuanto a transacciones, volumen de datos y prestaciones deseadas, se pueden realizar

ciertos cambios que ayuden a conseguir una mayor eficiencia en el acceso a la base de datos:

Introducir redundancias desnormalizando algunas tablas o añadiendo datos derivados.

Partir tablas horizontalmente (por casos) o verticalmente (por columnas).

7.2. Metodología de diseño

En este apartado se presentan los pasos a seguir para obtener un conjunto de tablas a partir del

esquema conceptual. A cada tabla se le dará un nombre, y el nombre de sus atributos aparecerá, a

continuación, entre paréntesis. El atributo o atributos que forman la clave primaria se subrayarán.

Las claves ajenas, mecanismo que se utiliza para representar las relaciones entre entidades en el

modelo relacional, se especificarán aparte indicando la tabla a la que hacen referencia.



-- 139 of 227 --



130 7.2. METODOLOGÍA DE DISEÑO

7.2.1. Entidades fuertes

En el esquema lógico se debe crear una tabla para cada entidad fuerte, incluyendo todos sus

atributos simples con cardinalidad máxima 1. De los atributos compuestos con cardinalidad máxima

1 incluir sólo sus componentes.

Cada atributo con cardinalidad máxima n se incluirá como una tabla dentro de la tabla co-

rrespondiente a la entidad. Si el atributo es simple, la tabla interna tendrá una sola columna; si el

atributo es compuesto, la tabla interna tendrá tantas columnas como componentes tenga éste.

Cada uno de los identificadores de la entidad será una clave candidata. De entre las claves

candidatas hay que escoger la clave primaria; el resto serán claves alternativas. Para escoger la clave

primaria entre las claves candidatas se pueden seguir las siguientes indicaciones:

Escoger la clave candidata que tenga menos atributos.

Escoger la clave candidata cuyos valores no tengan probabilidad de cambiar en el futuro.

Escoger la clave candidata cuyos valores no tengan probabilidad de perder la unicidad en el

futuro.

Escoger la clave candidata con el mínimo número de caracteres (si es de tipo cadena).

Escoger la clave candidata más fácil de utilizar desde el punto de vista de los usuarios.

Ejemplo 7.1 Entidad fuerte con atributos.

El diagrama de la figura 7.1 contiene los datos de interés de los libros de una biblioteca: título

(formado por un título principal y el subtítulo), ISBN, editorial, autores, idioma en que está escrito

y ediciones (cada edición tiene un número y se ha publicado en un año).

LIBRO	edición

número año

isbn

idioma

autor

título

título principal subtítulo

(1,n)

(1,n) editorial

Figura 7.1: Entidad con atributos.

El esquema lógico correspondiente es el siguiente:

LIBRO(isbn,título_principal,subtítulo,editorial,AUTOR(autor),idioma,EDICIÓN(número,año))



-- 140 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 131

7.2.2. Entidades débiles

En el esquema lógico se debe crear una tabla para cada entidad débil, teniendo en cuenta todos

sus atributos tal y como se ha hecho con las entidades fuertes. Una entidad débil participa en una

relación con la entidad fuerte de la que depende y la cardinalidad con la que participa será siempre

(1, 1): cada ocurrencia de la entidad débil se relaciona con una y sólo una ocurrencia de la entidad

fuerte, de la que necesita para identificarse. Por el hecho de participar de este modo en la relación

y por ser débil, a la tabla que le corresponde se le debe añadir una clave ajena a la tabla de la

entidad fuerte de la que depende. Para ello, se incluye la clave primaria de la tabla que representa

a la entidad fuerte (padre) en la nueva tabla creada para la entidad débil. A continuación, se debe

determinar la clave primaria de la nueva tabla.

Ejemplo 7.2 Entidad débil con atributos.

El diagrama de la figura 7.2 corresponde al ejemplo 6.6 del capítulo 6. El esquema lógico correspon-

num_depto

nombre

presupuesto

(1,n)

trabaja fecha_ingreso

num_emp

(1,1)

## DEPARTAMENTO EMPLEADO

nombre

Figura 7.2: Ejemplo de identificador de entidad débil.

diente es el siguiente:

DEPARTAMENTO(num_depto, nombre, presupuesto)

DEPARTAMENTO.nombre es una clave alternativa

EMPLEADO(num_emp, num_depto, nombre, fecha_ingreso)

EMPLEADO.num_depto es una clave ajena a DEPARTAMENTO

7.2.3. Relaciones binarias

Una relación binaria es aquella en la que participan dos entidades, o bien una sola entidad

cuyas ocurrencias se relacionan entre ellas (autorrelación). En los diagramas entidad–relación, para

cada entidad, se especifica la cardinalidad con la que participa en cada relación. Según sean las

cardinalidades máximas, las relaciones binarias se clasifican como se especifica a continuación:

Uno a uno: ambas entidades participan con cardinalidad máxima 1. Si una participa de forma

opcional y la otra lo hace de manera obligatoria, esta última es considerada la entidad hija,

mientras que la primera es la entidad madre.



-- 141 of 227 --



132 7.2. METODOLOGÍA DE DISEÑO

Uno a muchos: una entidad participa con cardinalidad máxima 1 (será la entidad hija) mien-

tras que la otra lo hace con cardinalidad máxima n (será la entidad madre).

Muchos a muchos: ambas entidades participan con cardinalidad máxima n.

En función del tipo de relación hay distintas posibilidades para representarlas en el esquema

lógico.

Relaciones binarias uno a uno

Antes de transformar las relaciones uno a uno, es preciso revisarlas, ya que es posible que se

hayan identificado dos entidades que representen el mismo concepto pero con nombres diferentes

(sinónimos). Si así fuera, ambas entidades deben integrarse en una sola y después se debe obtener

la tabla correspondiente.

Hay dos formas distintas de representar, en el esquema lógico, una relación binaria uno a uno

entre entidades fuertes. Una vez obtenidas las tablas correspondientes a las entidades participantes

en la relación las opciones son:

(a) Incluir en una de las tablas (sólo en una de ellas) una clave ajena a la otra tabla. Esta clave

ajena será, a su vez, una clave alternativa, ya que cada ocurrencia de un lado sólo puede

relacionarse con una ocurrencia del otro lado y viceversa. Además, se deben incluir en la

misma tabla los atributos de la relación.

La clave ajena aceptará nulos o no, en función de la cardinalidad mínima con la que participe

la entidad correspondiente en la relación: si es 0, la participación es opcional por lo que debe

aceptar nulos; si es 1, la participación es obligatoria y no debe aceptarlos. Los atributos de la

relación que se han incluido en la tabla sólo aceptarán nulos si son opcionales, o bien cuando

la clave ajena deba aceptar nulos (participación opcional).

(b) Crear una nueva tabla para almacenar las ocurrencias de la relación. Esta tabla contendrá una

clave ajena a cada una de las tablas correspondientes a las entidades participantes, además de

incluir los atributos de la relación. Ninguna de las claves ajenas aceptará nulos, ya que la tabla

almacena ocurrencias de la relación. Además, ambas claves ajenas serán claves candidatas: se

escogerá una de ellas como clave primaria y la otra quedará como clave alternativa.

Si la relación corresponde a una entidad débil con la entidad fuerte de la que depende, lo único

que se debe hacer es añadir los atributos de la relación (si los tiene), a la tabla de la entidad débil,

puesto que ésta ya contiene la clave ajena a la tabla de la entidad fuerte, que además de ayudarle

a identificarse (será una clave candidata), expresa la relación. Cuando se tiene una relación binaria



-- 142 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 133

uno a uno entre una entidad débil y una fuerte, puede ser conveniente plantearse la posibilidad de

integrar las dos entidades en una sola, como si se tratara de sinónimos.

Ejemplo 7.3 Relación uno a uno.

El diagrama de la figura 7.3 contiene información de los empleados (código y nombre), de los

vehículos que éstos conducen (matrícula y modelo) y desde cuando lo hacen. A continuación se

matrícula modelo codemp nombre

(1,1) (0,1)

conduce EMPLEADO	VEHÍCULO

fecha_inicio

Figura 7.3: Relación de uno a uno.

muestran tres posibles esquemas lógicos correspondientes a este diagrama:

(a.1) Puesto que la entidad de los vehículos participa de forma obligatoria en la relación, pue-

de considerarse entidad hija (todas sus ocurrencias están relacionadas con algún empleado),

introduciéndose en ella la relación:

EMPLEADO(codemp, nombre)

VEHÍCULO(matrícula, modelo, codemp, fecha_inicio)

VEHÍCULO.codemp es una clave ajena a EMPLEADO, no acepta nulos

VEHÍCULO.codemp es también una clave alternativa

(a.2) Aunque la entidad de los vehículos es la entidad hija, al ser una relación uno a uno, también es

posible incluir la relación en la entidad de los empleados. Esto puede ser conveniente cuando

se sabe que los accesos de una tabla a la otra se van a hacer siempre en la misma dirección,

de EMPLEADO a VEHÍCULO:

VEHÍCULO(matrícula, modelo)

EMPLEADO(codemp, nombre, matrícula, fecha_inicio)

EMPLEADO.matrícula es una clave ajena a VEHÍCULO, acepta nulos

EMPLEADO.matrícula es también una clave alternativa

EMPLEADO.matrícula, EMPLEADO.fecha_inicio son ambas nulas o no nulas a la

vez

Nótese que, por el hecho de participar de manera opcional en la relación, la clave ajena y el

atributo de la relación deben aceptar nulos, y que ambos deben ser nulos o no nulos a la vez.

Esta restricción se puede expresar sin ambigüedad en forma de predicado SQL:



-- 143 of 227 --



134 7.2. METODOLOGÍA DE DISEÑO

(EMPLEADO.matrícula IS NULL AND EMPLEADO.fecha_inicio IS NULL)

OR (EMPLEADO.matrícula IS NOT NULL AND EMPLEADO.fecha_inicio IS NOT NULL)

(b) Otro modo de representar la relación es mediante una tabla aparte:

EMPLEADO(codemp, nombre)

VEHÍCULO(matrícula, modelo)

CONDUCE(matrícula, codemp, fecha_inicio)

CONDUCE.matrícula es una clave ajena a VEHÍCULO, no acepta nulos

CONDUCE.codemp es una clave ajena a EMPLEADO, no acepta nulos

CONDUCE.codemp es también una clave alternativa

Nótese que ninguna de las claves ajenas acepta nulos, aún habiendo una entidad que participa

de manera opcional. Esto es así porque la tabla CONDUCE almacena ocurrencias de una relación,

no de una entidad: si la relación no se da para algún empleado, éste no aparece en la tabla.

Escoger una u otra opción para representar cada relación uno a uno dependerá, en gran medida, de

cómo se va a acceder a las tablas y del número de ocurrencias de las entidades que van a participar

en la relación. Se tratará siempre de favorecer los accesos más frecuentes y que requieran un tiempo

de respuesta menor.

Por ejemplo, en el esquema (a.1) dar de alta un vehículo conlleva ejecutar una sola sentencia

INSERT en la tabla VEHÍCULO, mientras que hacerlo en los esquemas (a.2) y (b) conlleva ejecutar dos

sentencias (un INSERT y un UPDATE, o dos INSERT). Sin embargo, en estos dos últimos esquemas, un

recorrido completo de la tabla VEHÍCULO para obtener la matrícula y el modelo es más rápido puesto

que cada fila almacena menos datos. Por otra parte, mantener la restricción de que todo vehículo

debe estar relacionado con algún empleado (con la fecha de inicio), es trivial en el esquema (a.1)

exigiendo que ambos atributos no acepten nulos, mientras que hacerlo en los otros dos esquemas

requiere el uso de transacciones.

En resumen, cada esquema será más conveniente para ciertos tipos de accesos, por lo que se

tratará de favorecer aquellos que sean críticos.

Relaciones binarias uno a muchos

Cuando la relación entre dos entidades fuertes es de uno a muchos, sigue habiendo dos modos de

representarla en el esquema lógico: mediante una clave ajena o mediante una tabla aparte, aunque el

modo de hacerlo varía respecto a las relaciones de uno a uno, tal y como se muestra a continuación:

(a) Incluir en la tabla hija (aquella cuya entidad participa con cardinalidad máxima 1) una clave

ajena a la tabla madre, junto con los atributos de la relación. La clave ajena aceptará nulos



-- 144 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 135

o no, en función de la cardinalidad mínima con la que participe la entidad hija en la relación:

si es 0, la participación es opcional por lo que debe aceptar nulos; si es 1, la participación

es obligatoria y no debe aceptarlos. Los atributos de la relación que se han incluido en la

tabla sólo aceptarán nulos si son opcionales, o bien cuando la clave ajena deba aceptar nulos

(participación opcional).

(b) Crear una nueva tabla para almacenar las ocurrencias de la relación. Esta tabla contendrá una

clave ajena a cada una de las tablas correspondientes a las entidades participantes, además

de incluir los atributos de la relación. Ninguna de las claves ajenas aceptará nulos, ya que

la tabla almacena ocurrencias de la relación. La clave primaria será la clave ajena a la tabla

correspondiente a la entidad hija, ya que cada ocurrencia de ésta sólo puede aparecer una vez

en la tabla.

Si la relación corresponde a una entidad débil con la entidad fuerte de la que depende, lo único

que se debe hacer es añadir los atributos de la relación (si los tiene), a la tabla de la entidad débil,

puesto que ésta ya contiene la clave ajena a la tabla de la entidad fuerte, que además de ayudarle

a identificarse (formará parte de su clave primaria), expresa la relación.

Ejemplo 7.4 Relación uno a muchos.

El diagrama de la figura 7.4 contiene información de los profesores (código y nombre) y de los

estudiantes (código y nombre). Algunos profesores tutorizan estudiantes y cada estudiante sólo

puede ser tutorizado por un profesor.

nombre	codpro nombre codest

fecha_inicio

## PROFESOR

(0,n) (0,1)

ESTUDIANTE	tutoriza

Figura 7.4: Relación de uno a muchos.

A continuación se muestran los dos posibles esquemas lógicos correspondientes a este diagrama:

(a) PROFESOR(codpro, nombre)

ESTUDIANTE(codest, nombre, codpro, fecha_inicio)

ESTUDIANTE.codpro es una clave ajena a PROFESOR, acepta nulos

Se debe cumplir la siguiente restricción:

(ESTUDIANTE.codpro IS NULL AND ESTUDIANTE.fecha_inicio IS NULL)

OR (ESTUDIANTE.codpro IS NOT NULL AND ESTUDIANTE.fecha_inicio IS NOT NULL)



-- 145 of 227 --



136 7.2. METODOLOGÍA DE DISEÑO

(b) Otro modo de representar la relación es mediante una tabla aparte:

PROFESOR(codpro, nombre)

ESTUDIANTE(codest, nombre)

TUTORIZA(codest, codpro, fecha_inicio)

TUTORIZA.codest es una clave ajena a ESTUDIANTE, no acepta nulos

TUTORIZA.codpro es una clave ajena a PROFESOR, no acepta nulos

Relaciones binarias muchos a muchos

Para las relaciones binarias de muchos a muchos la única opción que existe es crear una tabla

aparte para almacenar las ocurrencias de la relación. Esta tabla contendrá una clave ajena a cada

una de las tablas correspondientes a las entidades participantes, además de incluir los atributos de la

relación. Ninguna de las claves ajenas aceptará nulos. La clave primaria de esta tabla se determina

en función de que la relación tenga o no atributos:

(a) Si la relación no tiene atributos, la clave primaria está formada por las dos claves ajenas (será

una clave primaria compuesta).

(b) Si la relación tiene atributos, la clave primaria depende del significado de la relación. No

hay que olvidar que las claves candidatas de una tabla son restricciones que sus filas deben

cumplir (sus valores no se pueden repetir) y, por lo tanto, será el significado de la relación (qué

relaciones se pueden dar y cuáles no) el que nos ayudará a determinar las claves candidatas

y, a partir de ellas, la clave primaria.

Ejemplo 7.5 Relación muchos a muchos.

El diagrama de la figura 7.5 contiene información de los médicos (código y nombre) y de los pacientes

(código y nombre) de un centro médico, con información de las citas que éstos tienen concertadas.

Se debe tener en cuenta que un paciente puede tener concertadas varias citas con el mismo médico.

A continuación se muestra el esquema lógico correspondiente al diagrama anterior.

nombre	nombre	codmed codpac

(0,n)

## PACIENTE	MÉDICO

fecha	hora

cita

(0,n)

Figura 7.5: Relación de muchos a muchos.



-- 146 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 137

MÉDICO(codmed, nombre)

PACIENTE(codpac, nombre)

CITA(codmed, codpac, fecha, hora) ¡falta escoger la clave primaria!

CITA.codmed es una clave ajena a MÉDICO, no acepta nulos

CITA.codpac es una clave ajena a PACIENTE, no acepta nulos

Para escoger la clave primaria de la tabla CITA se debe buscar antes las claves candidatas, que

dependerán del significado de la relación:

(codmed, fecha, hora) es una clave candidata, porque un médico no puede tener más de

una cita el mismo día a la misma hora.

(codpac, fecha, hora) es una clave candidata, porque un paciente no puede tener más de

una cita el mismo día a la misma hora.

Nótese que (codmed, codpac) no es una clave candidata, ya que un mismo paciente puede tener

varias citas con un mismo médico.

7.2.4. Jerarquías de generalización

En las jerarquías se denomina entidad madre a la entidad genérica y entidades hijas a las

subentidades. Hay tres opciones distintas para representar las jerarquías. La elección de la más

adecuada se hará en función de su tipo (total o parcial y exclusiva o superpuesta) y del tipo y

frecuencia en los accesos a los datos. Estas opciones se presentan a continuación:

(a) Crear una tabla por cada entidad (madre e hijas). Las tablas de las entidades hijas heredan

como clave primaria la clave primaria de la entidad madre. La clave primaria de las hijas es

una clave ajena a la entidad madre. Esta representación se puede hacer para cualquier tipo

de jerarquía, ya sea total o parcial y exclusiva o superpuesta.

(b) Crear una tabla por cada entidad hija, heredando cada una los atributos de la entidad madre.

Esta representación sólo se puede hacer para jerarquías totales y exclusivas.

(c) Integrar todas las entidades en una sola tabla, incluyendo en ella los atributos de la entidad

madre, los atributos de todas las hijas y un atributo discriminativo para indicar el subcon-

junto al cual pertenece la entidad en consideración. Esta representación se puede utilizar para

cualquier tipo de jerarquía. Si la jerarquía es superpuesta, el atributo discriminativo deberá

ser multievaluado o bien se deberá incluir uno de estos atributos por cada subentidad.



-- 147 of 227 --



138 7.2. METODOLOGÍA DE DISEÑO

Ejemplo 7.6 Jerarquía de generalización.

El diagrama de la figura 7.6 corresponde al ejemplo 6.7 del capítulo 6. A continuación se muestran

(1,n)

domicilio	beneficiario

dni nombre fecha_nacim

matrícula

## DE AUTOMÓVIL DE VIVIENDA	DE VIDA

(1,1)

fecha_fin

fecha_ini

número

## PÓLIZA

Figura 7.6: Ejemplo de jerarquía de generalización.

los tres posibles esquemas lógicos correspondientes al diagrama anterior.

(a) PÓLIZA(número, fecha_ini, fecha_fin)

PÓLIZA_VIDA(número, BENEFICIARIO(dni, nombre, fecha_nacim))

PÓLIZA_VIDA.número es una clave ajena a PÓLIZA

PÓLIZA_AUTOMÓVIL(número, matrícula)

PÓLIZA_AUTOMÓVIL.matrícula es una clave alternativa

PÓLIZA_AUTOMÓVIL.número es una clave ajena a PÓLIZA

PÓLIZA_VIVIENDA(número, domicilio)

PÓLIZA_VIVIENDA.número es una clave ajena a PÓLIZA

(b) PÓLIZA_VIDA(número, fecha_ini, fecha_fin, BENEFICIARIO(dni, nombre, fecha_nacim))

PÓLIZA_AUTOMÓVIL(número, fecha_ini, fecha_fin, matrícula)

PÓLIZA_AUTOMÓVIL.matrícula es una clave alternativa

PÓLIZA_VIVIENDA(número, fecha_ini, fecha_fin, domicilio)

(c) PÓLIZA(número, fecha_ini, fecha_fin, tipo, BENEFICIARIO(dni, nombre, fecha_nacim),

matrícula, domicilio)

PÓLIZA.tipo ∈ {’vida’,’automóvil’,’vivienda’} atributo discriminativo

PÓLIZA.matrícula es una clave alternativa

PÓLIZA.matrícula, PÓLIZA.domicilio aceptan nulos



-- 148 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 139

Una vez obtenidas las tablas con sus atributos, claves primarias, claves alternativas y claves

ajenas, deben normalizarse. La normalización se utiliza para mejorar el esquema lógico, de modo

que satisfaga ciertas restricciones que eviten la duplicidad de datos. La normalización garantiza que

el esquema resultante se encuentra más próximo al modelo de la empresa, que es consistente y que

tiene la mínima redundancia y la máxima estabilidad.

7.2.5. Normalización

La normalización es una técnica para diseñar la estructura lógica de los datos de un sistema

de información en el modelo relacional, desarrollada por E. F. Codd en 1972. Es una estrategia de

diseño de abajo a arriba: se parte de los atributos y éstos se van agrupando en tablas según su

afinidad. Aquí no se utilizará la normalización como una técnica de diseño de bases de datos, sino

como una etapa posterior a la correspondencia entre el esquema conceptual y el esquema lógico,

que elimine las dependencias entre atributos no deseadas.

En la mayoría de las ocasiones, una base de datos completamente normalizada no proporciona la

máxima eficiencia, sin embargo, el objetivo en esta etapa es conseguir una base de datos normalizada

por las siguientes razones:

Un esquema normalizado organiza los datos de acuerdo a sus dependencias funcionales, es

decir, de acuerdo a sus relaciones lógicas.

El esquema lógico no tiene porqué ser el esquema final. Debe representar lo que el diseña-

dor entiende sobre la naturaleza y el significado de los datos de la empresa. Si se establecen

unos objetivos en cuanto a prestaciones, el diseño físico cambiará el esquema lógico de modo

adecuado. Una posibilidad es que algunas tablas normalizadas se desnormalicen. Pero la des-

normalización no implica que se haya malgastado tiempo normalizando, ya que mediante este

proceso el diseñador aprende más sobre el significado de los datos. De hecho, la normalización

obliga a entender completamente cada uno de los atributos que se han de representar en la

base de datos.

Un esquema normalizado es robusto y carece de redundancias, por lo que está libre de ciertas

anomalías que las redundancias pueden provocar cuando se actualiza la base de datos.

Los equipos informáticos de hoy en día son cada vez más potentes, por lo que en ocasiones es

más razonable implementar bases de datos fáciles de manejar (las normalizadas), a costa de

un tiempo adicional de proceso.

La normalización produce bases de datos con esquemas flexibles que pueden extenderse con

facilidad.



-- 149 of 227 --



140 7.2. METODOLOGÍA DE DISEÑO

De lo que se trata es de obtener un conjunto de tablas que se encuentren en la forma normal de

Boyce–Codd. Para ello, hay que pasar por la primera, segunda y tercera formas normales.

Dependencia funcional

Uno de los conceptos fundamentales en la normalización es el de dependencia funcional. Una

dependencia funcional es una relación entre atributos de una misma tabla. Si x e y son atributos de

la relación R, se dice que y es funcionalmente dependiente de x (se denota por x −→ y) si cada valor

de x tiene asociado un solo valor de y (x e y pueden constar de uno o varios atributos). A x se le

denomina determinante, ya que x determina el valor de y. Se dice que el atributo y es completamente

dependiente de x si depende funcionalmente de x y no depende de ningún subconjunto de x.

La dependencia funcional es una noción semántica. Si hay o no dependencias funcionales entre

atributos no lo determina una serie abstracta de reglas, sino, más bien, los modelos mentales del

usuario y las reglas de negocio de la organización o empresa para la que se desarrolla el sistema

de información. Cada dependencia funcional es una restricción y representa una relación de uno a

muchos (o de uno a uno).

En el proceso de normalización se debe ir comprobando que cada tabla cumple una serie de

reglas que se basan en la clave primaria y las dependencias funcionales. Cada regla que se cumple

aumenta el grado de normalización. Si una regla no se cumple, la tabla se debe descomponer en

varias tablas que sí la cumplan.

La normalización se lleva a cabo en una serie pasos. Cada paso corresponde a una forma nor-

mal que tiene unas propiedades. Conforme se va avanzando en la normalización, las tablas tienen

un formato más estricto (más fuerte) y, por lo tanto, son menos vulnerables a las anomalías de

actualización. El modelo relacional sólo requiere un conjunto de tablas en primera forma normal

(en caso contrario no se pueden implementar). Las restantes formas normales son opcionales. Sin

embargo, para evitar las anomalías de actualización, es recomendable llegar al menos a la tercera

forma normal.

Primera forma normal

Una tabla está en primera forma normal (1FN) si, y sólo si, todos los dominios de sus atributos

contienen valores atómicos, es decir, no hay grupos repetitivos. Un grupo repetitivo es un atributo

que puede tener múltiples valores para cada fila de la relación. Son los atributos que tienen forma

de tabla.

Si una tabla no está en 1FN, hay que eliminar de ella los grupos repetitivos. La forma de eliminar

los grupos repetitivos consiste en poner cada uno de ellos como una tabla aparte, heredando la clave

primaria de la tabla en la que se encontraban. La clave primaria de esta nueva tabla estará formada



-- 150 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 141

por la combinación de la clave primaria que tenía cuando era un grupo repetitivo, y la clave primaria

que ha heredado en forma de clave ajena. Se dice que conjunto de tablas se encuentra en 1FN si

ninguna de ellas tiene grupos repetitivos.

Ejemplo 7.7 Pasar una tabla a 1FN.

La tabla PRODUCTO que se muestra a continuación no se encuentra en 1FN, ya que tiene un grupo

repetitivo:

PRODUCTO(codprod, nombre, VERSIÓN(número, fecha, ventas))

Para pasarla a 1FN se debe eliminar el grupo repetitivo:

PRODUCTO(codprod, nombre)

VERSIÓN(codprod, número, fecha, ventas)

VERSIÓN.codprod es una clave ajena a PRODUCTO

Segunda forma normal

Una tabla está en segunda forma normal (2FN) si, y sólo si, está en 1FN y, además, cada atributo

que no forma parte de la clave primaria es completamente dependiente de la clave primaria.

La 2FN se aplica a las tablas que tienen claves primarias compuestas por dos o más atributos. Si

una tabla está en 1FN y su clave primaria es simple (tiene un solo atributo), entonces también está

en 2FN. Las tablas que no están en 2FN pueden sufrir anomalías cuando se realizan actualizaciones

sobre ellas.

Para pasar una tabla en 1FN a 2FN hay que eliminar las dependencias parciales de la clave

primaria. Para ello, se eliminan los atributos que son funcionalmente dependientes y se ponen en

una nueva tabla con una copia de su determinante. Su determinante estará formado por los atributos

de la clave primaria de los que dependen.

Ejemplo 7.8 Pasar una tabla en 1FN a 2FN.

En la tabla INSCRIPCIÓN que aparece a continuación existe una dependencia funcional parcial de la

clave primaria:

INSCRIPCIÓN(estudiante, actividad, precio)

Dependencia funcional parcial: actividad −→ precio

Esta dependencia existe porque cada actividad tiene un precio, independientemente del estudiante

que se inscriba. Las anomalías que se pueden producir si se mantiene esta dependencia dentro de la

tabla son varias. Por una parte, no es posible conocer el precio de una actividad si no hay personas



-- 151 of 227 --



142 7.2. METODOLOGÍA DE DISEÑO

inscritas, ya sea porque no se ha inscrito ninguna o porque todas las que lo están cancelan su

inscripción. Por otra parte, y que es aún más grave, si se cambia el precio de una actividad y no se

cambia para todas las personas inscritas, se tendrá una falta de integridad ya que habrá dos precios

para la misma actividad, uno correcto y otro erróneo. Para pasar la tabla a 2FN se debe eliminar

el atributo de la dependencia parcial, que se lleva una copia de su determinante:

ACTIVIDAD(actividad, precio)

INSCRIPCIÓN(estudiante, actividad)

INSCRIPCIÓN.actividad es una clave ajena a ACTIVIDAD

De este modo se evitan las anomalías citadas anteriormente: puede conocerse el precio de las acti-

vidades sin haber inscripciones y, puesto que el precio sólo está almacenado una vez, si se cambia

éste, será el mismo para todas las inscripciones.

Tercera forma normal

Una tabla está en tercera forma normal (3FN) si, y sólo si, está en 2FN y, además, cada atributo

que no forma parte de la clave primaria no depende transitivamente de la clave primaria. La depen-

dencia x −→ z es transitiva si existen las dependencias x −→ y, y −→ z, siendo x, y, z atributos o

conjuntos de atributos de una misma tabla.

Aunque las relaciones en 2FN tienen menos redundancias que las relaciones en 1FN, todavía

pueden sufrir anomalías frente a las actualizaciones. Para pasar una relación en 2FN a 3FN hay que

eliminar las dependencias transitivas. Para ello, se eliminan los atributos que dependen transitiva-

mente y se ponen en una nueva relación con una copia de su determinante (el atributo o atributos

no clave de los que dependen).

Ejemplo 7.9 Pasar una tabla en 2FN a 3FN.

En la tabla HABITA existe una dependencia funcional transitiva:

HABITA(inquilino, edificio, alquiler)

Dependencia funcional transitiva: edificio −→ alquiler

Esta dependencia existe porque cada edificio tiene un alquiler, independientemente del inquilino que

lo habite. Una vez más, mantener esta dependencia dentro de la tabla puede dar lugar a diversas

anomalías: no es posible conocer el alquiler de un edificio si no hay inquilinos y si se modifica el

precio del alquiler de un edificio sólo para algunos inquilinos se viola una regla del negocio, ya que

todos los inquilinos del mismo edificio deben pagar lo mismo. Para pasar la tabla a 3FN se debe

eliminar el atributo de la dependencia transitiva, que se lleva una copia de su determinante:



-- 152 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 143

ALQUILER(edificio, alquiler)

HABITA(inquilino, edificio)

HABITA.edificio es una clave ajena a ALQUILER

Descomponiendo la tabla de este modo, se evitan las anomalías que se han citado.

Forma normal de Boyce–Codd

Una tabla está en la forma normal de Boyce–Codd (BCFN) si, y sólo si, todo determinante es

una clave candidata.

La 2FN y la 3FN eliminan las dependencias parciales y las dependencias transitivas de la clave

primaria. Pero este tipo de dependencias todavía pueden existir sobre otras claves candidatas, si

éstas existen. La BCFN es más fuerte que la 3FN, por lo tanto, toda tabla en BCFN está en 3FN.

La violación de la BCFN es poco frecuente ya que se da bajo ciertas condiciones que raramente

se presentan. Se debe comprobar si una tabla viola la BCFN si tiene dos o más claves candidatas

compuestas que tienen al menos un atributo en común.

Cómo saber si se ha hecho bien la normalización

En primer lugar, hay que fijarse en que las dependencias funcionales no deseadas han desapare-

cido. Las únicas dependencias que deben quedar son las que son de la clave primaria completa.

Al normalizar una tabla (2FN y 3FN) lo que se hace es obtener distintas proyecciones de ella, para

repartir sus columnas en varias tablas de modo que se eliminen las dependencias no deseadas (no son

más que redundancias de datos). Por lo tanto, el conjunto de tablas que se obtiene al normalizar

debe permitir recuperar la tabla original haciendo concatenaciones (JOIN ). Si nos fijamos en el

ejemplo 7.8, las proyecciones que se han hecho son:

ACTIVIDAD := SELECT actividad, precio FROM INSCRIPCIÓN;

INSCRIPCIÓN := SELECT estudiante, actividad FROM INSCRIPCIÓN;

Y a partir de ellas es posible recuperar la tabla original:

INSCRIPCIÓN := SELECT * FROM ACTIVIDAD JOIN INSCRIPCIÓN USING(actividad);

Algo que puede ser también de utilidad, para comprobar si se ha normalizado correctamente, es

que la clave primaria de cada tabla debe ser distinta. Por ejemplo, supongamos que la tabla original

de inscripciones tenía 3500 filas, que corresponden a las inscripciones de 2800 estudiantes en 32

actividades distintas. La nueva tabla de inscripciones tendrá 3500 filas, mientras que la nueva tabla

de actividades tendrá 32 filas. La tabla de inscripciones mantiene su clave primaria y, por lo tanto,

mantiene su número de filas. La tabla de actividades tiene como clave primaria la columna de la que



-- 153 of 227 --



144 7.3. RESTRICCIONES DE INTEGRIDAD

salía una dependencia no deseada en la tabla original, tendrá tantas filas como actividades distintas

existen.

Si no se hacen bien las proyecciones y se obtiene más de una tabla con la misma clave primaria,

las flechas no deseadas seguirán estando presentes, quizás en otra tabla, continuando presentes las

dependencias funcionales no deseadas.

7.3. Restricciones de integridad

La definición de las restricciones de integridad se lleva a cabo en la etapa del diseño lógico. Las

restricciones son reglas que se quiere imponer para proteger la base de datos, de modo que no pueda

llegar a un estado inconsistente en el que los datos no reflejen la realidad o sean contradictorios.

Hay cinco tipos de restricciones de integridad.

(a) Datos requeridos. Algunos atributos deben contener valores en todo momento, es decir, no

admiten nulos.

(b) Restricciones de dominios. Todos los atributos tienen un dominio asociado, que es el conjunto

de valores que cada atributo puede tomar.

(c) Integridad de entidades. El identificador de una entidad no puede ser nulo, por lo tanto, las

claves primarias de las tablas no admiten nulos.

(d) Integridad referencial. Una clave ajena enlaza cada fila de la tabla hija con la fila de la tabla

madre que tiene el mismo valor en su clave primaria. La integridad referencial dice que si una

clave ajena tiene valor (si es no nula), ese valor debe ser uno de los valores de la clave primaria

a la que referencia. Hay varios aspectos a tener en cuenta sobre las claves ajenas para lograr

que se cumpla la integridad referencial.

1. ¿Admite nulos la clave ajena? Cada clave ajena expresa una relación. Si la participación

de la entidad hija en la relación es obligatoria (cardinalidad mínima 1), entonces la clave

ajena no admite nulos; si es opcional (cardinalidad mínima 0), la clave ajena debe aceptar

nulos.

2. ¿Qué hacer cuando se quiere borrar una ocurrencia de la entidad madre que tiene alguna

hija? Esto es lo mismo que preguntarse qué hacer cuando se quiere borrar una fila que

está siendo referenciada por otra fila a través de una clave ajena. Hay varias respuestas

posibles:

• Restringir: no se pueden borrar filas que están siendo referenciadas por otras filas.



-- 154 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 145

• Propagar: se borra la fila deseada y se propaga el borrado a todas las filas que le

hacen referencia.

• Anular: se borra la fila deseada y todas las referencias que tenía se ponen, automá-

ticamente, a nulo (esta opción sólo es válida si la clave ajena acepta nulos).

• Valor por defecto: se borra la fila deseada y todas las referencias toman, automática-

mente, el valor por defecto (esta opción sólo es válida si se ha especificado un valor

por defecto para la clave ajena).

3. ¿Qué hacer cuando se quiere modificar la clave primaria de una fila que está siendo

referenciada por otra fila a través de una clave ajena? Las respuestas posibles son las

mismas que en el caso anterior. Cuando se escoge propagar, se actualiza la clave primaria

en la fila deseada y se propaga el cambio a los valores de clave ajena que le hacían

referencia.

(e) Restricciones y reglas de negocio. Cualquier operación que se realice sobre los datos debe

cumplir las restricciones y las reglas que impone el funcionamiento de la empresa. Hablamos

de restricciones cuando se dan ciertas condiciones que no deben violarse y hablamos de reglas

de negocio cuando se requiere la ejecución automática de ciertas acciones ante determinados

eventos.

Todas las restricciones de integridad establecidas en este paso se deben reflejar en la documentación

del esquema lógico para que puedan ser tenidas en cuenta durante la fase del diseño físico.

7.4. Desnormalización

Una de las tareas que se realiza en el diseño lógico, después de obtener un esquema lógico

normalizado, es la de considerar la introducción de redundancias controladas y otros cambios en

el esquema. En ocasiones puede ser conveniente relajar las reglas de normalización introduciendo

redundancias de forma controlada con objeto de mejorar las prestaciones del sistema.

En la etapa del diseño lógico se recomienda llegar, al menos, hasta la tercera forma normal para

obtener un esquema con una estructura consistente y sin redundancias. Pero a menudo sucede que

las bases de datos así normalizadas no proporcionan la máxima eficiencia, con lo que es necesario

volver atrás y desnormalizar algunas tablas, sacrificando los beneficios de la normalización para

mejorar las prestaciones. Es importante hacer notar que la desnormalización sólo debe realizarse

cuando se estime que el sistema no puede alcanzar las prestaciones deseadas. Y desde luego, el que en

ocasiones sea necesario desnormalizar no implica eliminar la fase de normalización del diseño lógico

ya que la normalización obliga al diseñador a entender completamente cada uno de los atributos

que se han de representar en la base de datos.



-- 155 of 227 --



146 7.4. DESNORMALIZACIÓN

Además hay que tener en cuenta los siguientes factores:

La desnormalización hace que la implementación sea más compleja.

La desnormalización hace que se sacrifique la flexibilidad.

La desnormalización puede hacer que los accesos a datos sean más rápidos, pero ralentiza las

actualizaciones.

Por regla general, la desnormalización puede ser una opción viable cuando las prestaciones que

se obtienen no son las deseadas y las tablas involucradas se actualizan con poca frecuencia, pero se

consultan muy a menudo. Las redundancias que se pueden incluir al desnormalizar son de varios

tipos: se pueden introducir datos derivados (calculados a partir de otros datos), se pueden duplicar

atributos o se puede hacer concatenaciones (JOIN) de tablas. El incluir redundancias dependerá del

coste adicional de almacenarlas y mantenerlas consistentes, frente al beneficio que se consigue al

realizar consultas.

No se puede establecer una serie de reglas que determinen cuándo desnormalizar tablas, pero

hay algunas situaciones bastante comunes en donde puede considerarse esta posibilidad:

Combinar relaciones de uno a uno. Esto puede ser conveniente cuando hay tablas involucradas

en relaciones de uno a uno, se accede a ellas de manera conjunta con frecuencia y casi no se

accede a ellas por separado.

Tablas de referencia. Las tablas de referencia (lookup tables) son listas de valores posibles de

una o varias columnas de la base de datos. La lista normalmente consta de una descripción

(valor) y un código. Este tipo de tablas son un caso de relación de uno a muchos y con ellas

es muy fácil validar los datos. Mediante ellas se puede ahorrar espacio en las tablas donde se

usan los valores de referencia ya que se puede escribir sólo el código (como una clave ajena) y

no el valor en sí (descripción).

Si las tablas de referencia se utilizan a menudo en las consultas, se puede considerar la in-

troducción de la descripción junto con el código en la tabla hijo, manteniendo la tabla de

### referencia para validación de datos cuando éstos se introducen en la base de datos. De esta

forma se evitan los JOIN con la tabla de referencia al hacer las consultas. En este caso, se

puede eliminar la restricción de la clave ajena ya que no es necesario mantener la integridad

referencial, al copiarse los valores en la tabla hijo.

Duplicar atributos no clave en relaciones de uno a muchos. Para evitar operaciones de JOIN

entre tablas, se puede incluir atributos de la tabla madre en la tabla hija de las relaciones de

uno a muchos.



-- 156 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 147

Duplicar claves ajenas en relaciones de uno a muchos. Para evitar operaciones de JOIN, se

puede incluir claves ajenas de una tabla en otra tabla con la que se relaciona (habrá que tener

en cuenta ciertas restricciones).

Duplicar atributos en relaciones de muchos a muchos. Durante el diseño lógico se crea una

nueva tabla para almacenar las ocurrencias de una relación de muchos a muchos, de modo que

si se quiere obtener la información de la relación de muchos a muchos, se tiene que realizar el

JOIN de tres tablas. Para evitar algunos de estos JOIN se puede incluir algunos de los atributos

de las tablas originales en la tabla intermedia.

Introducir grupos repetitivos. Los grupos repetitivos se eliminan en el primer paso de la nor-

malización para conseguir la primera forma normal. Estos grupos se eliminan introduciendo

una nueva tabla, generando una relación de uno a muchos. A veces, puede ser conveniente

reintroducir los grupos repetitivos para mejorar las prestaciones. El grupo repetitivo debe

desplegarse dentro de la tabla, por lo que la clave primaria de la tabla original deberá incluir

a la clave primaria del grupo repetitivo.

Partir tablas. Las tablas se pueden partir horizontalmente (por casos) o verticalmente (por

atributos) de modo que a partir de una tabla grande, que tiene datos que no se acceden con

frecuencia, se obtengan tablas más pequeñas, algunas de las cuales contienen sólo datos que

sí se acceden muy a menudo.

Todas las transformaciones y redundancias que se introduzcan en este paso se deben documentar

y razonar. El esquema lógico se debe actualizar para reflejar los cambios introducidos.

7.5. Reglas de comportamiento de las claves ajenas

Para cada clave ajena que aparece en el esquema lógico se debe especificar sus reglas de com-

portamiento ante el borrado y la modificación de la clave primaria a la que han referencia. Además,

para cada una se debe establecer si acepta nulos o no. En gran medida, las reglas de las claves ajenas

son establecidas por los propietarios de los datos.

Las claves ajenas y sus reglas se han estudiado en el capítulo 2 (apartado 2.4.3), por lo que en

este apartado se estudiará el establecimiento de las mismas con un caso práctico:

EMPLEADO(codemp, nombre, matrícula, fecha_ini)

VEHíCULO(matrícula, modelo)

En esta base de datos hay datos de empleados y de vehículos. Cada empleado conduce un solo

vehículo y cada vehículo puede ser conducido por distintos empleados. En este caso se ha incluido



-- 157 of 227 --



148 7.5. REGLAS DE COMPORTAMIENTO DE LAS CLAVES AJENAS

la clave ajena que representa la relación, en la tabla que contiene la información de los empleados,

de modo que cada empleado hace referencia al vehículo que conduce. A continuación se plantean

las preguntas que hay que responder para establecer las reglas de las claves ajenas:

¿Acepta nulos la clave ajena?, es decir ¿puede haber algún empleado que no conduzca ningún

vehículo? La respuesta aparece en el esquema conceptual, en la cardinalidad mínima con la

que participa la entidad EMPLEADO en la relación: si es 0 significa que sí puede haber empleados

sin vehículo, por lo que la clave ajena debe aceptar nulos; si es 1 significa que todo empleado

debe conducir algún vehículo, por lo que en este caso no debe aceptar nulos.

¿Cuál es la regla de borrado?, es decir ¿qué hacer cuando se intenta borrar un vehículo que es

conducido por algún empleado? Las posibles respuestas son:

• Propagar : se borra el vehículo (se elimina su fila de la tabla) y se borran los empleados

que lo conducen (también se borran las filas que hacen referencia a ese vehículo).

• Restringir : no se puede borrar un vehículo que es conducido por algún empleado. En este

caso, lo recomendable es pedir que el propietario de los datos especifique un procedimiento

a seguir: dar sólo un aviso al usuario; dar un aviso y mostrar los datos del empleado dando

la posibilidad de cambiarle el vehículo; etc.

• Anular : se borra el vehículo y en las filas de los empleados que lo conducen, la clave

ajena, que contenía la matrícula del vehículo, se pone a nulo. Esta opción sólo es posible

cuando la clave ajena acepta nulos.

• Valor por defecto: se borra el vehículo y en las filas de los empleados que lo conducen,

la clave ajena, que contenía la matrícula del vehículo, se pone el valor por defecto. Esta

opción sólo es posible cuando la clave ajena tiene un valor por defecto.

¿Cuál es la regla de modificación?, es decir ¿qué hay que hacer cuando se intenta modificar la

matrícula de un vehículo que es conducido por algún empleado? Las posibles respuestas son:

• Propagar : se modifica la matrícula del vehículo y en las filas de los empleados que lo

conducen se cambia el valor de la clave ajena (la matrícula) para que le siga haciendo

referencia. Al fin y al cabo, el vehículo es el mismo, sólo ha cambiado el valor de una de

sus propiedades (quizá porque se tecleó mal al introducirla).

• Restringir : no se puede modificar la matrícula de un vehículo que es conducido por algún

empleado. En este caso lo normal es pedir que el propietario de los datos especifique un

procedimiento a seguir: dar un aviso al usuario, etc.



-- 158 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 149

• Anular : se modifica la matrícula del vehículo y en las filas de los empleados que lo

conducen, la clave ajena, que contenía la matrícula del vehículo, se pone a nulo. De

nuevo, esta opción sólo es posible cuando la clave ajena acepta nulos.

• Valor por defecto: se modifica la matrícula del vehículo y en las filas de los empleados

que lo conducen, la clave ajena, que contenía la matrícula del vehículo, toma el valor por

defecto. De nuevo, esta opción sólo es posible cuando la clave ajena tiene un valor por

defecto.

Algunos SGBD no permiten especificar la regla de modificación. Esto es así porque si se

necesita, es fácil implementarla mediante disparadores, pero no se ha estimado necesario ya

que una clave primaria bien elegida será una clave que nunca cambiará de valor. Las claves

primarias no deben ser columnas que representen propiedades de las entidades, sino columnas

sin significado, que se pueden añadir a propósito, para las que se van generando valores únicos

de manera automática, cuya función es solamente la de identificar las filas. Ya que este tipo

de claves primarias se generan de modo automático, nunca cambian de valor (ni siquiera el

usuario necesita saber que existen) por lo que este tipo de operación (modificación) no suele

realizarse nunca.

Como se ha visto, las respuestas a las cuestiones anteriores están en los usuarios de los datos.

Sin embargo, hay ocasiones en las que es el diseñador quien debe decidir las reglas de determinadas

claves ajenas. Vemos aquí cuáles son esas ocasiones:

Jerarquías. Cuando se escoge representar una jerarquía del modo más general (el que funciona

para todo tipo de jerarquía), se introduce una tabla por la entidad genérica y una tabla

por cada subentidad. Las tablas correspondientes a las subentidades tienen, cada una, una

clave ajena a la tabla correspondiente a la entidad. Esta clave ajena será también una clave

candidata (podrá ser la clave primaria o podrá serlo cualquier otro identificador alternativo).

Pues bien, esta clave ajena que tiene cada tabla de subentidad no acepta nulos y la regla

del borrado será, por lo general, propagar. Esto debe ser así porque para el propietario de la

información, la jerarquía del esquema conceptual es tan solo una clasificación: si quiere borrar

una ocurrencia de una entidad, no se le puede decir que no puede hacerlo (restringir) por el

hecho de que esa ocurrencia haya sido clasificada de algún modo.

Atributos con múltiples valores. Cuando una entidad tiene un atributo que puede tener varios

valores (cuando la cardinalidad máxima del atributo es n), tras la normalización, se tiene

una tabla que contendrá los distintos valores del atributo para cada ocurrencia de la entidad.

Por ejemplo, podemos tener una entidad empleado con un atributo con múltiples valores en

donde se indiquen los títulos académicos que tiene cada empleado. Este atributo dará lugar



-- 159 of 227 --



150 7.6. CUESTIONES ADICIONALES

a una tabla que tendrá una clave ajena a la tabla de empleados; esta clave ajena formará

parte de la clave primaria junto con el nombre del título, por ejemplo. Esta clave ajena no

aceptará nulos y la regla de borrado será siempre propagar. En realidad, esta tabla ha aparecido

porque en el modelo relacional es así como se representan los atributos con múltiples valores,

mediante una nueva tabla. Para el usuario, el empleado es una entidad, pero en la base de

datos la información se ha repartido en varias tablas. En este caso, no tiene sentido restringir el

borrado. Lo que se debe hacer es que cuando un usuario intenta borrar una ocurrencia de una

entidad, se debe propagar el borrado de ésta a cualquier otra tabla que almacene propiedades

el empleado que hayan surgido a causa de atributos con múltiples valores.

7.6. Cuestiones adicionales

Una vez obtenido el esquema lógico, éste se debe validar frente a las transacciones de los usua-

rios. El objetivo de este paso es validar el esquema lógico para garantizar que puede soportar las

transacciones requeridas por los correspondientes usuarios. Estas transacciones se encontrarán en las

especificaciones de requisitos de usuario. Lo que se debe hacer es tratar de realizar las transacciones

de forma manual utilizando el diagrama entidad–relación, el diccionario de datos y las conexiones

que establecen las claves ajenas de las tablas. Si todas las transacciones se pueden realizar, el es-

quema queda validado. Pero si alguna transacción no se puede realizar, seguramente será porque

alguna entidad, relación o atributo no se ha incluido en el esquema.

Además, para garantizar que cada esquema lógico local es una fiel representación de la vista del

usuario lo que se debe hacer es comprobar con él que lo reflejado en el esquema y en la documentación

es correcto y está completo.

El esquema lógico refleja la estructura de los datos a almacenar que maneja la empresa. Un

diagrama de flujo de datos muestra cómo se mueven los datos en la empresa y los almacenes en

donde se guardan. Si se han utilizado diagramas de flujo de datos para modelar las especificaciones de

requisitos de usuario, se pueden utilizar para comprobar la consistencia y completitud del esquema

lógico desarrollado. Para ello:

Cada almacén de datos debe corresponder con una o varias entidades completas.

Los atributos en los flujos de datos deben corresponder a alguna entidad.

Una última cuestión a tener en cuenta es la de estudiar el crecimiento futuro. En este paso, se

trata de comprobar que el esquema obtenido puede acomodar los futuros cambios en los requisitos

con un impacto mínimo. Si el esquema lógico se puede extender fácilmente, cualquiera de los cambios

previstos se podrá incorporar al mismo con un efecto mínimo sobre los usuarios existentes.



-- 160 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 151

7.7. Ejemplos

En este apartado se obtendrá el esquema lógico correspondiente a los dos ejemplos presentados

en el apartado 6.3 del capítulo 6 de diseño conceptual.

Ejemplo 7.10 Asociación de cines

Comenzamos la obtención de las tablas a partir de las entidades:

CINES(nombre, calle, número, teléfono, TARIFA(tipo, precio))

PELÍCULAS(título, director, protagonista1, protagonista2, protagonista3, género,

clasificación)

Los atributos PELÍCULAS.protagonista2 y PELÍCULAS.protagonista3 aceptan nulos

Puesto que se debe almacenar el nombre de hasta tres protagonistas, se ha escogido representar el

atributo como tres columnas, en lugar de hacerlo como un atributo multievaluado. De esta forma,

toda la información de una película está en una misma fila. Nótese que los nombres de las entidades

se han puesto en plural al obtener las tablas correspondientes2.

Veamos ahora cómo se debe representar la relación entre los cines y las películas que pasan (la

cartelera):

CARTELERA(nombre_cine, título_película, PASES(hora))

CARTELERA.nombre_cine es clave ajena a CINES

CARTELERA.título_película es clave ajena a PELÍCULAS

Se han renombrado las columnas que son claves ajenas, de modo que llevan detrás el nombre de

la tabla a la que hacen referencia.

Una vez obtenidas las tablas, se debe pasar a la normalización. Las tablas CINES y CARTELERA

no están en 1FN, por lo que debemos normalizarlas:

CINES(nombre, calle, número, teléfono)

TARIFA(nombre_cine, tipo, precio)

TARIFA.nombre_cine es clave ajena a CINES

CARTELERA(nombre_cine, título_película)

CARTELERA.nombre_cine es clave ajena a CINES

CARTELERA.título_película es clave ajena a PELÍCULAS

PASES(nombre_cine, título_película, hora)

(PASES.nombre_cine, PASES.título_película) es clave ajena a CARTELERA

2Esta es una cuestión de notación. El diseñador debe escoger una notación para nombrar tablas, columnas y claves.



-- 161 of 227 --



152 7.7. EJEMPLOS

Nótese que la clave ajena de PASES a CARTELERA es una clave ajena compuesta.

Las tablas obtenidas están en 1FN y también en 2FN y 3FN, al no haber dependencias funcio-

nales no deseadas, por lo que el esquema lógico contiene ya las tablas normalizadas. El diagrama

de la figura 7.7 muestra las tablas de la base de datos. El recuadro superior de cada tabla contiene

la clave primaria. Mediante flechas se han indicado las claves ajenas y sobre estas flechas, se han

indicado las reglas de comportamiento de las mismas.

nombre_cine

## CARTELERA

título_película

nombre_cine

tipo

precio

## TARIFA

Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Prop.

Modif.: Prop.

clasificación

título

director

protagonista1

protagonista2

protagonista3

género

## PELÍCULAS

nombre

calle

número

teléfono

nombre_cine

título_película

hora

## PASES

## CINES

Figura 7.7: Esquema relacional correspondiente al caso de la asociación de cines.

Ejemplo 7.11 Catálogo de un portal web.

Comenzamos la obtención de las tablas a partir de las entidades:

TEMAS(tema, PALABRAS(palabra, importancia), CONSULTAS(ip, fecha_hora))

PÁGINAS(url, título)

VOLUNTARIOS(email, nombre)

Por comodidad, pasamos ahora la tabla TEMAS a 1FN, ya que debemos incluir columnas en ella para

representar las relaciones.

TEMAS(tema)

PALABRAS(tema, palabra, importancia)

PALABRAS.tema es clave ajena a TEMAS



-- 162 of 227 --



### CAPÍTULO 7. DISEÑO LÓGICO RELACIONAL 153

CONSULTAS(tema, ip, fecha_hora)

CONSULTAS.tema es clave ajena a TEMAS

Incluimos ahora las relaciones en el esquema lógico:

TEMAS(tema, tema_padre)

TEMAS.tema_padre es clave ajena a TEMAS

CONTENIDO(url_página, tema, prioridad)

(CONTENIDO.url_página, CONTENIDO.prioridad) es clave alternativa

CONTENIDO.url_página es clave ajena a PÁGINAS

CONTENIDO.tema es clave ajena a TEMAS

EVALUACIONES(email_voluntario, url_página, fecha, calificación)

EVALUACIONES.email_voluntario es clave ajena a VOLUNTARIOS

EVALUACIONES.url_página es clave ajena a PÁGINAS

La clave primaria de la tabla EVALUACIONES no permite que haya más de una evaluación de un

mismo voluntario con una misma página. Se deberá establecer un mecanismo que, ante una nueva

evaluación de una página ya evaluada antes por el mismo voluntario, sustituya la evaluación previa

por la que se acabe de realizar.

Las tablas que se han obtenido están en 3FN (no hay dependencias funcionales no deseadas). La

figura 7.8 muestra las tablas que se acaban de obtener, con las claves primarias y las claves ajenas.



-- 163 of 227 --



154 7.7. EJEMPLOS

tema

palabra

importancia

## PALABRAS

tema

ip

## CONSULTAS

fecha_hora

calificación

fecha

email_voluntario

url_página

## EVALUACIONES

Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Rest.

Modif.: Prop. Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Prop.

Modif.: Prop.

Nulos: no

Borrado: Rest.

Modif.: Prop.

prioridad

url_página

tema

## CONTENIDO

email

nombre

## VOLUNTARIOS

url

título

## PÁGINAS

tema

tema_padre

## TEMAS

Figura 7.8: Esquema relacional correspondiente al caso del catálogo web.



-- 164 of 227 --



### Capítulo 8

Diseño físico en SQL

### Introducción y objetivos

El diseño físico es el proceso de producir la descripción de la implementación de la base de

datos en memoria secundaria, a partir del esquema lógico obtenido en la etapa anterior. Para

especificar dicha implementación se deben determinar las estructuras de almacenamiento y escoger

los mecanismos necesarios para garantizar un acceso eficiente a los datos. Puesto que el esquema

lógico utiliza el modelo relacional, la implementación del diseño físico se realizará en SQL.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Traducir el esquema lógico de una base de datos dada a un conjunto de sentencias SQL de

creación de tablas que la implementen fielmente.

Acudir a los manuales del SGBD escogido para la implementación y obtener en ellos toda

la información necesaria para llevar a cabo la implementación sobre el mismo (sintaxis del

lenguaje, los tipos de datos, etc.).

Escoger las organizaciones de ficheros más apropiadas en función de las que tenga disponible

el SGBD que se vaya a utilizar.

Decidir qué índices deben crearse con el objetivo de aumentar las prestaciones en el acceso a

los datos.

Diseñar las vistas necesarias para proporcionar seguridad y facilitar el manejo de la base de

datos.

155



-- 165 of 227 --



156 8.1. METODOLOGÍA DE DISEÑO

8.1. Metodología de diseño

Mientras que en el diseño lógico se especifica qué se guarda, en el diseño físico se especifica cómo

se guarda.

Para llevar a cabo esta etapa se debe haber decidido cuál es el SGBD que se va a utilizar, ya

que el esquema físico se adapta a él. El diseñador debe conocer muy bien toda la funcionalidad del

SGBD concreto y también el sistema informático sobre el que éste va a trabajar.

El diseño físico no es una etapa aislada, ya que algunas decisiones que se tomen durante su

desarrollo, por ejemplo para mejorar las prestaciones, pueden provocar una reestructuración del

esquema lógico. De este modo, entre el diseño físico y el diseño lógico hay una realimentación.

En general, el propósito del diseño físico es describir cómo se va a implementar físicamente el

esquema lógico obtenido en la fase anterior. Concretamente, en el modelo relacional, esto consiste

en:

Obtener un conjunto de sentencias para crear las tablas de la base de datos y para mantener

las restricciones que se deben cumplir sobre ellas.

Determinar las estructuras de almacenamiento y los métodos de acceso que se van a utilizar

para conseguir unas prestaciones óptimas.

Diseñar el modelo de seguridad del sistema.

En los siguientes apartados se detallan cada una de las etapas que componen la fase del diseño físico.

8.1.1. Traducir el esquema lógico

La primera fase del diseño físico consiste en traducir el esquema lógico a un esquema (físico) que

se pueda implementar en el SGBD escogido. Para ello, es necesario conocer toda la funcionalidad

que éste ofrece.

Sentencias de creación de las tablas

Las tablas se definen mediante el lenguaje de definición de datos del SGBD. Para ello, se utiliza la

información producida durante el diseño lógico: el esquema lógico y toda la documentación asociada

(diccionario de datos). El esquema físico consta de un conjunto de tablas y, para cada una de ellas,

se especifica:

El nombre. Es conveniente adoptar unas reglas para nombrar las tablas, de manera que aporten

información sobre el tipo de contenido. Por ejemplo, a las tablas de referencia se les puede

añadir el prefijo o el sufijo REF, a las tablas que almacenan información de auditoría ponerles



-- 166 of 227 --



### CAPÍTULO 8. DISEÑO FÍSICO EN SQL 157

el prefijo/sufijo AUDIT, a las tablas que sean de uso para un solo departamento, ponerles como

prefijo/sufijo las siglas del mismo, etc.

La lista de columnas con sus nombres. De nuevo resulta conveniente adoptar una serie de

reglas para nombrarlas. Alguna reglas habituales son: poner el sufijo PK a las claves primarias

(PRIMARY KEY), poner el sufijo FK a las claves ajenas (FOREIGN KEY), usar el nombre de la clave

primaria a la que se apunta en el nombre de una clave ajena o el nombre de su tabla, usar el

mismo nombre para las columnas que almacenan el mismo tipo de información (por ejemplo,

si en varias tablas se guarda una columna con la fecha en que se ha insertado cada fila, usar

en todas ellas el mismo nombre para dicha columna), etc. Además, para cada columna se debe

especificar:

• Su dominio: tipo de datos, longitud y restricciones de dominio (se especifican con la

cláusula CHECK).

• El valor por defecto, que es opcional (DEFAULT).

• Si admite nulos o no (NULL/NOT NULL).

La clave primaria (PRIMARY KEY), las claves alternativas (UNIQUE) y las claves ajenas (FOREIGN

KEY), si las tiene.

Las reglas de comportamiento de las claves ajenas (ON UPDATE, ON DELETE).

A continuación, se muestra un ejemplo de la creación de las tablas FACTURAS y LINEAS_FAC (con

las que se trabaja en el capítulo 4) utilizando la especificación de SQL del SGBD libre PostgreSQL.

CREATE TABLE facturas (

codfac NUMERIC(6,0) NOT NULL,

fecha DATE NOT NULL,

codcli NUMERIC(5,0),

codven NUMERIC(5,0),

iva NUMERIC(2,0),

dto NUMERIC(2,0),

CONSTRAINT cp_facturas PRIMARY KEY (codfac),

CONSTRAINT ca_fac_cli FOREIGN KEY (codcli) REFERENCES clientes(codcli)

ON UPDATE CASCADE ON DELETE SET NULL,

CONSTRAINT ca_fac_ven FOREIGN KEY (codven) REFERENCES vendedores(codven)

ON UPDATE CASCADE ON DELETE SET NULL,

CONSTRAINT ri_dto_fac CHECK (dto BETWEEN 0 AND 50)

);



-- 167 of 227 --



158 8.1. METODOLOGÍA DE DISEÑO

CREATE TABLE lineas_fac (

codfac NUMERIC(6,0) NOT NULL,

linea NUMERIC(2,0) NOT NULL,

cant NUMERIC(5,0) NOT NULL,

codart VARCHAR(8) NOT NULL,

precio NUMERIC(6,2) NOT NULL,

dto NUMERIC(2,0),

CONSTRAINT cp_lineas_fac PRIMARY KEY (codfac, linea),

CONSTRAINT ca_lin_fac FOREIGN KEY (codfac) REFERENCES facturas(codfac)

ON UPDATE CASCADE ON DELETE CASCADE,

CONSTRAINT ca_lin_art FOREIGN KEY (codart) REFERENCES articulos(codart)

ON UPDATE CASCADE ON DELETE RESTRICT,

CONSTRAINT ri_dto_lin CHECK (dto BETWEEN 0 AND 50)

);

Mantenimiento de restricciones y reglas de negocio

Las actualizaciones que se realizan sobre las tablas de la base de datos deben observar ciertas

restricciones o producir determinadas consecuencias que imponen las reglas de funcionamiento de

la empresa. Algunos SGBD proporcionan mecanismos que permiten definir restricciones y reglas, y

vigilan su cumplimiento.

Un mecanismo para definir restricciones es la cláusula CONSTRAINT ... CHECK. Un ejemplo de

ella se puede observar en las sentencias de creación de las tablas FACTURAS y LINEAS_FAC, sobre

la columna dto. Otro mecanismo son los disparadores (TRIGGER), que también se utilizan para

establecer reglas de negocio en las que se requiere la realización de alguna acción como consecuencia

de algún evento. Los disparadores se introducen en el capítulo 9.

Hay algunas reglas que no las pueden manejar todos los SGBD, como por ejemplo ‘a las 20:30

del último día laborable de cada año archivar los pedidos servidos y borrarlos’. Para algunas reglas

habrá que escribir programas de aplicación específicos. Por otro lado, hay SGBD que no permiten

la definición de reglas, por lo que éstas deberán incluirse en los programas de aplicación.

Todas las reglas que se definan deben estar documentadas. Si hay varias opciones posibles para

implementarlas, hay que explicar porqué se ha escogido la opción implementada.

8.1.2. Diseñar la representación física

Uno de los objetivos principales del diseño físico es almacenar los datos de modo eficiente. Para

medir la eficiencia hay varios factores que se deben tener en cuenta:



-- 168 of 227 --



### CAPÍTULO 8. DISEÑO FÍSICO EN SQL 159

Rendimiento de transacciones. Es el número de transacciones que se quiere procesar en un

intervalo de tiempo.

Tiempo de respuesta. Es el tiempo que tarda en ejecutarse una transacción. Desde el punto

de vista del usuario, este tiempo debería ser el mínimo posible.

Espacio en disco. Es la cantidad de espacio en disco que hace falta para los ficheros de la base

de datos. Normalmente, el diseñador querrá minimizar este espacio.

Lo que suele suceder es que todos estos factores no se pueden satisfacer a la vez. Por ejemplo,

para conseguir un tiempo de respuesta mínimo puede ser necesario aumentar la cantidad de datos

almacenados, ocupando más espacio en disco. Por lo tanto el diseñador deberá ir ajustando estos

factores para conseguir un equilibrio razonable. El diseño físico inicial no será el definitivo, sino que

habrá que ir monitorizándolo para observar sus prestaciones e ir ajustándolo como sea oportuno.

Muchos SGBD proporcionan herramientas para monitorizar y afinar el sistema.

Hay algunas estructuras de almacenamiento que son muy eficientes para cargar grandes canti-

dades de datos en la base de datos, pero no son eficientes para el resto de operaciones, por lo que se

puede escoger dicha estructura de almacenamiento para inicializar la base de datos y cambiarla, a

continuación, para su posterior operación. Los tipos de organizaciones de ficheros disponibles varían

en cada SGBD y algunos sistemas proporcionan más estructuras de almacenamiento que otros. Es

muy importante que el diseñador del esquema físico sepa qué estructuras de almacenamiento le

proporciona el SGBD y cómo las utiliza.

Para mejorar las prestaciones, el diseñador del esquema físico debe saber cómo interactúan los

dispositivos involucrados y cómo esto afecta a las prestaciones:

Memoria principal. Los accesos a memoria principal son mucho más rápidos que los accesos

a memoria secundaria (decenas o centenas de miles de veces más rápidos). Generalmente,

cuanta más memoria principal se tenga, más rápidas serán las aplicaciones. Si no hay bastante

memoria disponible para todos los procesos, el sistema operativo debe transferir páginas a

disco para liberar memoria (memoria virtual). Cuando estas páginas se vuelven a necesitar,

hay que volver a traerlas desde el disco (fallos de página). A veces, es necesario llevar procesos

enteros a disco (swapping) para liberar memoria. El hacer estas transferencias con demasiada

frecuencia empeora las prestaciones.

CPU. La CPU controla los recursos del sistema y ejecuta los procesos de usuario. El principal

### objetivo con este dispositivo es lograr que no haya bloqueos de procesos para conseguirla. Si

el sistema operativo, o los procesos de los usuarios, hacen muchas demandas de CPU, ésta se

convierte en un cuello de botella. Esto suele ocurrir cuando hay muchas faltas de página o se

realiza mucho swapping.



-- 169 of 227 --



160 8.1. METODOLOGÍA DE DISEÑO

Entrada/salida a disco. Los discos tienen una velocidad de entrada/salida. Cuando se requieren

datos a una velocidad mayor que ésta, el disco se convierte en un cuello de botella. Dependiendo

de cómo se organicen los datos en el disco, se conseguirá reducir la probabilidad de empeorar

las prestaciones. Los principios básicos que se deberían seguir para repartir los datos en los

discos son los siguientes:

• Los ficheros del sistema operativo deben estar separados de los ficheros de la base de

datos.

• Los ficheros de datos deben estar separados de los ficheros de índices.

• Los ficheros con los diarios de operaciones deben estar separados del resto de los ficheros

de la base de datos.

Red. La red se convierte en un cuello de botella cuando tiene mucho tráfico y cuando hay

muchas colisiones.

Cada uno de estos recursos afecta a los demás, de modo que una mejora en alguno de ellos puede

influir en otros.

Analizar las transacciones

Para realizar un buen diseño físico es necesario conocer las consultas y las transacciones que se

van a ejecutar sobre la base de datos. Esto incluye tanto información cualitativa, como cuantitativa.

Para cada transacción, hay que especificar:

La frecuencia con que se va a ejecutar.

Las tablas y los atributos a los que accede la transacción, y el tipo de acceso: consulta,

inserción, modificación o eliminación. Por ejemplo, los atributos que se modifican a menudo

no son buenos candidatos para construir índices.

Las restricciones temporales impuestas sobre la transacción. Los atributos utilizados en los

predicados de la transacción pueden ser candidatos para construir estructuras de acceso.

Escoger las organizaciones de ficheros

El objetivo de este paso es escoger la organización de ficheros óptima para cada tabla. Por

ejemplo, un fichero desordenado es una buena estructura cuando se va a cargar gran cantidad de

datos en una tabla al inicializarla, cuando la tabla tiene pocas filas, también cuando en cada acceso se

deben obtener todas las filas de la tabla, o cuando la tabla tiene una estructura de acceso adicional,

como puede ser un índice.



-- 170 of 227 --



### CAPÍTULO 8. DISEÑO FÍSICO EN SQL 161

Por otra parte, los ficheros dispersos (hashing) son apropiados cuando se accede a las filas a

través de los valores exactos de alguno de sus campos (condición de igualdad en el WHERE). Si la

condición de búsqueda es distinta de la igualdad (búsqueda por rango, por patrón, etc.) entonces la

dispersión no es una buena opción.

Algunos SGBD proporcionan otras organizaciones alternativas a estas. Las organizaciones de

ficheros elegidas deben documentarse, justificando en cada caso la opción escogida.

Escoger los índices a crear y sus tipos

Los índices son estructuras adicionales que se utilizan para acelerar el acceso a las tablas en

respuesta a ciertas condiciones de búsqueda. Algunos tipos de índices, los denominados caminos

de acceso secundario, no afectan al emplazamiento físico de los datos en el disco y lo que hacen

es proporcionar caminos de acceso alternativos para encontrar los datos de modo eficiente basán-

dose en los campos de indexación. Hay que tener en cuenta que los índices conllevan un coste de

mantenimiento que hay que sopesar frente a la ganancia en prestaciones.

Cada SGBD proporcionará uno o varios tipos de índices entre los que escoger. Los más habituales

son los índices basados en árboles B+ (o árboles B*) y los basados en la dispersión (hash).

Un índice con estructura de árbol B+ es un árbol de búsqueda que siempre está equilibrado

(todas las hojas se encuentran al mismo nivel) y en el que el espacio desperdiciado por la eliminación,

si lo hay, nunca será excesivo. Los algoritmos para insertar y eliminar son complejos para poder

mantener estas restricciones. No obstante, la mayor parte de las inserciones y eliminaciones son

procesos simples que se complican sólo en circunstancias especiales: cuando se intenta insertar en

un nodo que está lleno o cuando se intenta borrar en un nodo que está ocupado hasta la mitad.

Las simulaciones muestran que un índice con estructura de árbol B+ de cuatro niveles contiene

unos cien millones de nodos hoja, lo que indica que en cuatro accesos se puede llegar a los datos,

incluso si la tabla es muy grande. Este tipo de índices es útil tanto en búsquedas con la condición

de igualdad sobre el campo de indexación, como para hacer búsquedas por rangos.

Un índice basado en la dispersión es un fichero disperso en el que las entradas se insertan en el

índice aplicando una función sobre el campo de indexación. Aunque el acceso a los datos es muy

rápido (es casi un acceso directo), este tipo de índices sólo se pueden usar cuando la condición de

búsqueda es la igualdad sobre el campo de indexación.

A la hora de seleccionar los índices a crear, se pueden seguir las siguientes indicaciones:

Crear un índice sobre la clave primaria de cada tabla.

La mayor parte de los SGBD relacionales crean un índice único de manera automática sobre la

clave primaria de cada tabla porque es el mecanismo que utilizan para mantener la unicidad.



-- 171 of 227 --



162 8.1. METODOLOGÍA DE DISEÑO

No crear índices sobre tablas pequeñas. Si el SGBD ha creado índices automáticamente sobre

este tipo de tablas, se pueden eliminar (DROP INDEX).

Aquí conviene tener en cuenta que, en la mayor parte de los SGBD, no se permite eliminar

un índice creado sobre una clave primaria a la que apunta una clave ajena, ya que este índice

se utiliza para mantener la integridad referencial.

Crear un índice sobre las claves ajenas que se utilicen con frecuencia en operaciones de JOIN.

Crear un índice sobre los atributos que se utilizan con frecuencia para hacer restricciones

WHERE (son condiciones de búsqueda).

Crear un índice único sobre las claves alternativas que se utilizan para hacer búsquedas.

Al igual que ocurre con las claves primarias, los SGBD suelen mantener la unicidad de las

claves alternativas mediante un índice único que crean automáticamente.

Evitar los índices sobre atributos que se modifican a menudo.

Evitar los índices sobre atributos poco selectivos: aquellos en los que la consulta selecciona

una porción significativa de la tabla (más del 15 % de las filas).

Evitar los índices sobre atributos formados por tiras de caracteres largas.

Evitar los índices sobre tablas que se actualizan mucho y que se consultan muy esporádica-

mente (tablas de auditoría o diarios). Si se han creado índices sobre este tipo de tablas, podría

ser aconsejable eliminarlos.

Revisar si hay índices redundantes o que se solapan y eliminar los que no sean necesarios.

Los índices creados se deben documentar, explicando las razones de su elección.

Estimar la necesidad de espacio en disco

El diseñador debe estimar el espacio necesario en disco para la base de datos. Esto es espe-

cialmente importante en caso de que se tenga que adquirir nuevo equipamiento informático, Esta

estimación depende del SGBD que se vaya a utilizar y del hardware. En general se debe estimar el

número de filas de cada tabla y su tamaño. También se debe estimar el factor de crecimiento de

cada tabla.



-- 172 of 227 --



### CAPÍTULO 8. DISEÑO FÍSICO EN SQL 163

8.1.3. Diseñar los mecanismos de seguridad

Los datos constituyen un recurso esencial para la empresa, por lo tanto su seguridad es de

vital importancia. Durante el diseño lógico se habrán especificado los requerimientos en cuanto

a seguridad que en esta fase se deben implementar. Para llevar a cabo esta implementación, el

diseñador debe conocer las posibilidades que ofrece el SGBD que se vaya a utilizar.

Diseñar las vistas de los usuarios

El objetivo de este paso es diseñar las vistas o esquemas externos de los usuarios, correspondientes

a los esquemas lógicos de cada grupo de usuarios. Cada esquema externo estará formado por tablas

y vistas (VIEW) de SQL. Las vistas, además de preservar la seguridad, mejoran la independencia de

datos, reducen la complejidad y permiten que los usuarios vean los datos en el formato deseado.

Diseñar las reglas de acceso

El administrador de la base de datos asigna a cada usuario un identificador que tendrá una

contraseña asociada por motivos de seguridad. Para cada usuario o grupo de usuarios se otorgarán

privilegios para realizar determinadas acciones sobre determinados objetos de la base de datos. Por

ejemplo, los usuarios de un determinado grupo pueden tener permiso para consultar los datos de

una tabla concreta y no tener permiso para actualizarlos.

8.1.4. Monitorizar y afinar el sistema

Una vez implementado el esquema físico de la base de datos, ésta se debe poner en marcha

para observar sus prestaciones. Si éstas no son las deseadas, el esquema deberá cambiar para in-

tentar satisfacerlas. Una vez afinado el esquema, éste no permanecerá estático, ya que tendrá que

ir cambiando conforme lo requieran los nuevos requisitos de los usuarios. Los SGBD proporcionan

herramientas para monitorizar el sistema mientras está en funcionamiento.

8.2. Vistas

Hay tres características importantes inherentes a los sistemas de bases de datos: la separación

entre los programas de aplicación y los datos, el manejo de múltiples vistas por parte de los usuarios

(esquemas externos) y el uso de un catálogo o diccionario para almacenar el esquema de la base de

datos. En 1975, el comité ANSI–SPARC (American National Standard Institute– Standards Planning

and Requirements Committee) propuso una arquitectura de tres niveles para los sistemas de bases

de datos, que resulta muy útil a la hora de conseguir estas tres características.



-- 173 of 227 --



164 8.2. VISTAS

Esquema fisico

## SGBD

Esquema externo 1 Esquema externo 2 Esquema externo 3

Esquema conceptual

Figura 8.1: Arquitectura ANSI–SPARC para los Sistemas de Bases de Datos.

El objetivo de la arquitectura de tres niveles es el de separar los programas de aplicación de la

base de datos física. En esta arquitectura, el esquema de una base de datos se define en tres niveles

de abstracción distintos (ver figura 8.1):

1. En el nivel interno se describe la estructura física de la base de datos mediante un esquema

interno. Este esquema se especifica mediante un modelo físico y describe todos los detalles

para el almacenamiento de la base de datos, así como los métodos de acceso.

2. En el nivel conceptual se describe la estructura de toda la base de datos para una comunidad

de usuarios (todos los de una empresa u organización), mediante un esquema conceptual. Este

esquema oculta los detalles de las estructuras de almacenamiento y se concentra en describir

entidades, atributos, relaciones, operaciones de los usuarios y restricciones. En este nivel se

puede utilizar un modelo conceptual o un modelo lógico para especificar el esquema.

3. En el nivel externo se describen varios esquemas externos o vistas de usuario. Cada esquema

externo describe la parte de la base de datos que interesa a un grupo de usuarios determinado

y oculta a ese grupo el resto de la base de datos. En este nivel se puede utilizar un modelo

conceptual o un modelo lógico para especificar los esquemas.

La mayoría de los SGBD no distinguen del todo los tres niveles. Algunos incluyen detalles del

nivel físico en el esquema conceptual. En casi todos los SGBD que se manejan vistas de usuario,

los esquemas externos se especifican con el mismo modelo de datos que describe la información a

nivel conceptual, aunque en algunos se pueden utilizar diferentes modelos de datos en los niveles

conceptual y externo.



-- 174 of 227 --



### CAPÍTULO 8. DISEÑO FÍSICO EN SQL 165

Hay que destacar que los tres esquemas no son más que descripciones de los mismos datos pero

con distintos niveles de abstracción. Los únicos datos que existen realmente están a nivel físico,

almacenados en un dispositivo como puede ser un disco. En un SGBD basado en la arquitectura de

tres niveles, cada grupo de usuarios hace referencia exclusivamente a su propio esquema externo.

La arquitectura de tres niveles es útil para explicar el concepto de independencia de datos, que

se puede definir como la capacidad para modificar el esquema en un nivel del sistema sin tener que

modificar el esquema del nivel inmediato superior. Se pueden definir dos tipos de independencia de

datos:

La independencia lógica es la capacidad de modificar el esquema conceptual sin tener que

alterar los esquemas externos ni los programas de aplicación. Se puede modificar el esquema

conceptual para ampliar la base de datos o para reducirla. Si, por ejemplo, se reduce la base

de datos eliminando una entidad, los esquemas externos que no se refieran a ella no deberán

verse afectados.

La independencia física es la capacidad de modificar el esquema interno sin tener que alterar

el esquema conceptual (o los externos). Por ejemplo, puede ser necesario reorganizar ciertos

ficheros físicos con el fin de mejorar el rendimiento de las operaciones de consulta o de ac-

tualización de datos. Dado que la independencia física se refiere sólo a la separación entre

las aplicaciones y las estructuras físicas de almacenamiento, es más fácil de conseguir que la

independencia lógica.

Cada esquema externo estará formado por un conjunto de tablas (TABLE) y un conjunto de vistas

(VIEW). En la arquitectura de tres niveles estudiada se describe una vista externa como la estructura

de la base de datos tal y como la ve un usuario en particular. En el modelo relacional, el término

vista tiene un significado un tanto diferente. En lugar de ser todo el esquema externo de un usuario,

una vista es una tabla virtual, una tabla que en realidad no existe como tal.

Una vista es el resultado dinámico de una o varias operaciones relacionales realizadas sobre las

tablas. La vista es una tabla virtual que se produce cuando un usuario la consulta. Al usuario le

parece que la vista es una tabla que existe y la puede manipular como si se tratara de una tabla,

pero la vista no está almacenada físicamente. El contenido de una vista está definido como una

consulta sobre una o varias tablas.

En SQL, la sentencia que permite definir una vista es la siguiente:

CREATE VIEW nombre_vista [ ( nombre_col, ... ) ]

AS sentencia_SELECT

[ WITH CHECK OPTION ];



-- 175 of 227 --



166 8.2. VISTAS

Las columnas de la vista se pueden nombrar especificando la lista entre paréntesis. Si no se especifican

nuevos nombres, los nombres son los mismos que los de las columnas de las tablas especificadas en

la sentencia SELECT.

La opción WITH CHECK OPTION impide que se realicen inserciones y actualizaciones sobre la vista

que no cumplan las restricciones especificadas en la misma. Por ejemplo, si se crea una vista que

selecciona los clientes con códigos postales de la provincia de Castellón (aquellos que empiezan

por 12) y se especifica esta cláusula, el sistema no permitirá actualizaciones de códigos postales de

clientes de esta provicia si los nuevos códigos postales son de una provincia diferente. Del mismo

modo, a través de la vista sólo será posible insertar clientes con códigos postales de Castellón.

Es como si se hubiera establecido una restricción de tipo CHECK con el predicado del WHERE de la

definición de la vista.

Cualquier operación que se realice sobre la vista se traduce automáticamente a operaciones sobre

las tablas de las que se deriva. Las vistas son dinámicas porque los cambios que se realizan sobre

las tablas que afectan a una vista se reflejan inmediatamente sobre ella. Cuando un usuario realiza

un cambio sobre la vista (no todo tipo de cambios están permitidos), este cambio se realiza sobre

las tablas de las que se deriva.

Las vistas son útiles por varias razones:

Proporcionan un poderoso mecanismo de seguridad, ocultando partes de la base de datos a

ciertos usuarios. El usuario no sabrá que existen aquellos atributos que se han omitido al

definir una vista.

Permiten que los usuarios accedan a los datos en el formato que ellos desean o necesitan, de

modo que los mismos datos pueden ser vistos con formatos distintos por distintos usuarios.

CREATE VIEW domicilios ( codcli, nombre, direccion, poblacion ) AS

SELECT c.codcli, c.nombre, c.direccion, c.codpostal || ’ - ’

|| pu.nombre || ’ (’ || pr.nombre || ’)’

FROM clientes c JOIN pueblos pu USING(codpue)

JOIN provincias pr USING(codpro);

SELECT * FROM domicilios;

codcli nombre direccion poblacion

------ ------ --------- ------------------------------

210 Luis C/Pez, 3 12540 - Villarreal (Castellón)



-- 176 of 227 --



### CAPÍTULO 8. DISEÑO FÍSICO EN SQL 167

Se pueden simplificar operaciones sobre las tablas que son complejas. Por ejemplo, se puede

definir una vista que muestre cada vendedor con el nombre de su jefe:

CREATE VIEW vj ( codven, nombreven, codjefe, nombrejefe )

SELECT v.codven, v.nombre, j.codven, j.nombre

FROM vendedores v LEFT OUTER JOIN vendedores j

ON (v.codjefe=j.codven);

El usuario puede hacer restricciones y proyecciones sobre la vista, que el SGBD traducirá en

las operaciones equivalentes sobre el JOIN.

SELECT f.codfac, f.fecha, vj.vendedor, vj.jefe

FROM facturas f JOIN vj USING(codven)

WHERE ... ;

Las vistas proporcionan independencia de datos a nivel lógico, que también se da cuando se

reorganiza el nivel conceptual. Si se añade un atributo a una tabla, los usuarios no se percatan

de su existencia si sus vistas no lo incluyen. Si una tabla existente se reorganiza o se divide en

varias tablas, se pueden crear vistas para que los usuarios la sigan viendo como al principio.

Las vistas permiten que se disponga de información expresada en forma de reglas generales de

conocimiento relativas al funcionamiento de la organización. Una de estas reglas puede ser ‘los

artículos en oferta son los que tienen descuento’ y se puede definir una vista que contenga sólo

estos artículos, aunque ninguna columna de la base de datos indique cómo ha de considerarse

cada artículo (es el conocimiento).

CREATE VIEW articulos_oferta AS

SELECT *

FROM articulos

WHERE dto > 0 ;

Cuando se actualiza una tabla, el cambio se refleja automáticamente en todas las vistas que

la referencian. Del mismo modo, si se actualiza una vista, las tablas de las que se deriva deberían

reflejar el cambio. Sin embargo, hay algunas restricciones respecto a los tipos de modificaciones que

se pueden realizar sobre las vistas. En el estándar de SQL se definen las condiciones bajo las que una

vista es actualizable o es insertable. Básicamente, una vista es actualizable si se puede identificar

de modo único la fila a la que afecta la actualización.



-- 177 of 227 --



168 8.2. VISTAS

Una vista definida sobre varias tablas es actualizable si contiene las claves primarias de todas

ellas y los atributos que no aceptan nulos.

Una columna de una vista definida sobre varias tablas se podrá actualizar si se obtiene direc-

tamente de una sola de las columnas de alguna de las tablas y si la clave primaria de dicha

tabla está incluida en la vista.

Las vistas definidas con operaciones de conjuntos pueden ser actualizables, pero no son inser-

tables (no se puede determinar en qué tabla hacer la inserción).

Ya que el estándar permite que sean actualizables un conjunto muy restringido de vistas, en ocasiones

será necesario hacer que una vista sea actualizable mediante disparadores o reglas del tipo en lugar

de.



-- 178 of 227 --



Parte III

Conceptos avanzados

169



-- 179 of 227 --



-- 180 of 227 --



### Capítulo 9

Actividad en bases de datos

relacionales

### Introducción y objetivos

En muchas aplicaciones, la base de datos debe evolucionar independientemente de la intervención

del usuario como respuesta a un suceso o una determinada situación. Los SGBD tradicionales son

pasivos, por lo que la evolución de la base de datos se programa en el código de las aplicaciones.

En los SGBD activos esta evolución es autónoma y se define en el mismo esquema de la base de

datos. En este capítulo se introducen los disparadores, que permiten hacer de un SGBD relacional

un sistema que también es activo.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Definir qué es una base de datos activa y en qué consiste el modelo evento-condición-acción.

Identificar ante qué restricciones se deben implementar disparadores.

Implementar disparadores para mantener restricciones y reglas de negocio.

Implementar disparadores que permitan que una vista sea actualizable.

9.1. Bases de datos activas

El poder especificar reglas con una serie de acciones que se ejecutan automáticamente cuando se

producen ciertos eventos, es una de las mejoras de los SGBD que se consideran de gran importancia

desde hace algún tiempo. Mediante estas reglas se puede hacer respetar reglas de integridad, generar

datos derivados, controlar la seguridad o implementar reglas de negocio. De hecho, la mayoría de

171



-- 181 of 227 --



172 9.2. EL MODELO EVENTO–CONDICIÓN–ACCIÓN

los sistemas relacionales comerciales disponen de disparadores (triggers). Se ha hecho mucha inves-

tigación sobre lo que debería ser un modelo general de bases de datos activas desde que empezaron

a aparecer los primeros disparadores. El modelo que se viene utilizando para especificar bases de

datos activas es el modelo evento–condición–acción.

Mediante los sistemas de bases de datos activas se consigue un nuevo nivel de independencia de

datos: la independencia de conocimiento. El conocimiento que provoca una reacción se elimina de

los programas de aplicación y se codifica en forma de reglas activas. De este modo, al encontrarse las

reglas definidas como parte del esquema de la base de datos, se comparten por todos los usuarios, en

lugar de estar replicadas en todos los programas de aplicación. Cualquier cambio sobre el compor-

tamiento reactivo se puede llevar a cabo cambiando solamente las reglas activas, sin necesidad de

modificar las aplicaciones. Además, mediante los sistemas de bases de datos activas se hace posible

el integrar distintos subsistemas (control de accesos, gestión de vistas, etc.) y se extiende el ámbito

de aplicación de la tecnología de bases de datos a otro tipo de aplicaciones.

Uno de los problemas que ha limitado el uso extensivo de reglas activas, a pesar de su potencial

para simplificar el desarrollo de bases de datos y de aplicaciones, es el hecho de que no hay técnicas

fáciles de usar para diseñar, escribir y verificar reglas. Por ejemplo, es bastante difícil verificar que

un conjunto de reglas es consistente, es decir, que no se contradice. También es difícil garantizar

la terminación de un conjunto de reglas bajo cualquier circunstancia. Para que las reglas activas

alcancen todo su potencial, es necesario desarrollar herramientas para diseñar, depurar y monitorizar

reglas activas que puedan ayudar a los usuarios en el diseño y depuración de sus reglas.

9.2. El modelo evento–condición–acción

Un sistema de bases de datos activas es un SGBD que contiene un subsistema que permite

la definición y la gestión de reglas de producción (reglas activas). Las reglas siguen el modelo

evento–condición–acción (modelo ECA): cada regla reacciona ante un determinado evento, evalúa

una condición y, si ésta es cierta, ejecuta un acción. La ejecución de las reglas tiene lugar bajo el

control de un subsistema autónomo, denominado motor de reglas, que se encarga de detectar los

eventos que van sucediendo y de planificar las reglas para que se ejecuten.

En el modelo ECA una regla tiene tres componentes:

El evento (o eventos) que dispara la regla. Estos eventos pueden ser operaciones de consulta o

actualización que se aplican explícitamente sobre la base de datos. También pueden ser eventos

temporales (por ejemplo, que sea una determinada hora del día) u otro tipo de eventos externos

(definidos por el usuario).

La condición que determina si la acción de la regla se debe ejecutar. Una vez ocurre el evento



-- 182 of 227 --



### CAPÍTULO 9. ACTIVIDAD EN BASES DE DATOS RELACIONALES 173

disparador, se puede evaluar una condición (es opcional). Si no se especifica condición, la

acción se ejecutará cuando suceda el evento. Si se especifica condición, la acción se ejecutará

sólo si la condición se evalúa a verdadero.

La acción a realizar puede ser una transacción sobre la base de datos o un programa externo

que se ejecutará automáticamente.

Casi todos los sistemas relacionales incorporan reglas activas simples denominadas disparadores

(TRIGGER en SQL), que están basados en el modelo ECA:

Los eventos son sentencias SQL de manejo de datos (INSERT, DELETE, UPDATE).

La condición (que es opcional) es un predicado booleano expresado en SQL.

La acción es un secuencia de sentencias SQL, que pueden estar inmersas en un lenguaje de

programación integrado en el producto que se esté utilizando (por ejemplo, PL/SQL en Oracle

o PL/pgSQL en PostgreSQL).

El modelo ECA se comporta de un modo simple e intuitivo: cuando ocurre el evento, si la condición

es verdadera, entonces se ejecuta la acción. Se dice que el disparador es activado por el evento, es

considerado durante la verificación de su condición y es ejecutado si la condición es cierta. Sin embar-

go, hay diferencias importantes en el modo en que cada sistema define la activación, consideración

y ejecución de disparadores.

Los disparadores relacionales tienen dos niveles de granularidad: a nivel de fila y a nivel de

sentencia. En el primer caso, la activación tiene lugar para cada fila involucrada en la operación y se

dice que el sistema tiene un comportamiento orientado a filas. En el segundo caso, la activación tiene

lugar sólo una vez para cada sentencia SQL, refiriéndose a todas las filas invocadas por la senten-

cia, con un comportamiento orientado a conjuntos. Además, los disparadores tienen funcionalidad

inmediata o diferida. La evaluación de los disparadores inmediatos normalmente sucede inmediata-

mente después del evento que lo activa (opción AFTER), aunque también puede precederlo (opción

BEFORE) o ser evaluados en lugar de la ejecución del evento (opción INSTEAD OF). La evaluación

diferida de los disparadores tiene lugar al finalizar la transacción en donde se han activado (tras la

sentencia COMMIT). Un disparador puede activar otro disparador. Esto ocurre cuando la acción de

un disparador es también el evento de otro disparador. En este caso, se dice que los disparadores se

activan en cascada.



-- 183 of 227 --



174 9.3. DISPARADORES EN SQL

9.3. Disparadores en SQL

La sentencia SQL para crear un disparador tiene la sintaxis que se muestra a continuación:

CREATE TRIGGER disparador

{ BEFORE | AFTER | INSTEAD OF }

{ INSERT | DELETE | UPDATE OF [ col, ... ] } ON tabla

[ REFERENCING { OLD [ ROW ] [ AS ] nombre_old

| NEW [ ROW ] [ AS ] nombre_new

| OLD_TABLE [ AS ] nombre_old_table

| NEW_TABLE [ AS ] nombre_new_table } ]

[ FOR EACH { ROW | STATEMENT } ]

[ WHEN ( condición ) ]

{ sentencia_SQL | bloque SQL/PSM | CALL procedimiento_SQL }

El evento que activa un disparador en SQL pueden ser una o varias acciones (actualizaciones)

sobre una tabla de la base de datos: INSERT, UPDATE, DELETE. Cuando se considera y se ejecuta un

disparador, se instancian dos parámetros que contienen los valores antes y después de ser actualiza-

dos. Si el disparador es a nivel de fila, se instancian NEW y OLD; si es a nivel de sentencia, se instancian

NEW_TABLE y OLD_TABLE. Estos parámetros pueden ser utilizarse tanto en la condición (considera-

ción) como en la acción (ejecución) del disparador, y se pueden renombrar mediante la cláusula

REFERENCING. Si el evento es un INSERT, sólo toman valor los parámetros NEW y si es un DELETE sólo

toman valor los parámetros OLD. En los UPDATE están definidos ambos tipos de parámetros, NEW y

OLD.

La condición que se especifica en la cláusula WHEN es un predicado escrito en SQL. La acción

a ejecutar cuando se cumple la condición del disparador puede ser una sentencia de SQL, un blo-

que escrito en un lenguaje procedural que soporte el SGBD (el del estándar de SQL se denomina

SQL/PSM) o una llamada a un procedimiento escrito en SQL/PSM o algún otro lenguaje de pro-

gramación.

La granularidad del disparador se especifica mediante FOR EACH ROW, si es a nivel de fila, o FOR

EACH STATEMENT si es a nivel de sentencia. Cuando el disparador es a nivel de fila, se considera (y

si es el caso, se ejecuta) una vez para cada fila a la que afecta el evento. Cuando el disparador es

a nivel de sentencia, se considera (y si es el caso, se ejecuta) una sola vez, independientemente del

número de filas a las que afecte el evento disparador. El valor por defecto es FOR EACH STATEMENT.

La evaluación de los disparadores se puede realizar justo después del evento que los activa (opción

AFTER), o justo antes (opción BEFORE). Cuando el disparador se define sobre una vista, puede ser

ser evaluado en lugar de la ejecución del evento (opción INSTEAD OF).



-- 184 of 227 --



### CAPÍTULO 9. ACTIVIDAD EN BASES DE DATOS RELACIONALES 175

La ejecución de los eventos INSERT, DELETE y UPDATE de SQL se entremezclan con la ejecución

de los disparadores que activan siguiendo el algoritmo que se especifica a continuación:

1. Se consideran los disparadores de tipo BEFORE a nivel de sentencia (FOR EACH STATEMENT) y

se ejecutan, si es el caso.

2. Para cada fila de la tabla a la que afecta el evento:

a) Se consideran los disparadores a nivel de fila de tipo BEFORE y se ejecutan, si es el caso.

En este tipo de disparadores se puede hacer una asignación sobre NEW en el bloque de la

acción.

b) La sentencia correspondiente al evento se realiza sobre la fila y, a continuación, se realizan

las comprobaciones de las restricciones de integridad que se hayan especificado (CHECK).

c) Se consideran los disparadores a nivel de fila de tipo AFTER y se ejecutan si es el caso.

3. Se llevan a cabo las comprobaciones de las restricciones de integridad especificadas para la

tabla (cláusulas CONSTRAINT).

4. Se consideran los disparadores a nivel de sentencia de tipo AFTER y se ejecutan, si es el caso.

Si se produce algún error durante la evaluación de un disparador (porque se viola alguna restricción

o falla alguna sentencia activada por el código del disparador), se deshacen todas las modificaciones

llevadas a cabo como consecuencia del evento que lo ha activado.

Cuando hay varios disparadores que se activan ante un mismo evento, cada SGBD sigue su

propio criterio para ordenar su ejecución: por orden alfabético, por orden de creación, etc. Lo más

aconsejable, cuando hay varios disparadores del mismo tipo para el mismo evento, es combinarlos

todos en un único disparador, de modo que se pueda establecer el orden en que se han de ejecutar

las operaciones de las acciones de los distintos disparadores.

Cuando se crea un disparador, éste está habilitado. Los disparadores pueden ser deshabilitados y

volver a ser habilitados más tarde. Mientras un disparador está deshabilitado no se activa. Algunos

SGBD permiten que en la acción que se especifica mediante el bloque de código procedural se

puedan utilizar condiciones especiales para ejecutar secciones específicas dependiendo del tipo de

evento que ha activado el disparador:

INSERTING es verdadero si el disparador ha sido activado por una sentencia INSERT.

DELETING es verdadero si el disparador ha sido activado por una sentencia DELETE.

UPDATING es verdadero si el disparador ha sido activado por una sentencia UPDATE.

UPDATING(col) es verdadero si el disparador ha sido activado por una sentencia UPDATE que

actualiza la columna col.



-- 185 of 227 --



176 9.4. PROCESAMIENTO DE REGLAS ACTIVAS

9.4. Procesamiento de reglas activas

Hay dos algoritmos alternativos para el procesamiento de las reglas activadas por una sentencia:

el algoritmo iterativo y el algoritmo recursivo. Ambos se detallan a continuación.

Algoritmo Iterativo

mientras existan reglas activadas:

1. seleccionar una regla activada R

2. comprobar la condición de R

3. si la condición es cierta, ejecutar la acción de R

fin mientras

Algoritmo Recursivo

mientras existan reglas activadas:

1. seleccionar una regla activada R

2. comprobar la condición de R

3. si la condición es cierta

3.1. ejecutar la acción de R

3.2. ejecutar este algoritmo para las reglas

activadas por la acción de R

fin mientras

Tanto en el estándar de SQL, como en Oracle y PostgreSQL, el tipo de procesamiento es re-

cursivo. El orden en que se van seleccionando las reglas de entre el conjunto de reglas activadas

viene determinado por cada SGBD. Por ejemplo, en Oracle es indeterminado para disparadores del

mismo tipo, mientras que en PostgreSQL se van activando por orden alfabético. La terminación

del algoritmo de ejecución de reglas se asegura estableciendo un límite máximo al número de reglas

disparadas durante la ejecución del algoritmo (normalmente es 32).

9.5. Aplicaciones de las bases de datos activas

Las aplicaciones clásicas de las reglas activas son internas a la base de datos: el gestor de reglas

activas trabaja como un subsistema del SGBD implementando algunas de sus funciones. En este

caso, los disparadores son generados por el sistema y no son visibles por parte de los usuarios. La

característica típica de las aplicaciones internas es la posibilidad de dar una especificación declarativa

de las funciones, a partir de la que derivar las reglas activas. Ejemplos de ello son el mantenimiento

de la integridad referencial (FOREIGN KEY) y el mantenimiento de restricciones de dominio (CHECK).



-- 186 of 227 --



### CAPÍTULO 9. ACTIVIDAD EN BASES DE DATOS RELACIONALES 177

En la mayoría de los SGBD, la condición de las restricciones expresadas mediante la cláusula

CHECK debe cumplir lo siguiente:

Debe ser una expresión booleana que se pueda evaluar usando los valores de la fila que se

inserta o que se actualiza.

No puede contener subconsultas.

No puede incluir funciones que devuelven la fecha del sistema, la hora, el identificador del

usuario, etc.

Por lo tanto, en muchas ocasiones no se pueden establecer restricciones de integridad mediante esta

cláusula y es necesario el uso de disparadores.

La gestión de las restricciones de integridad mediante el uso de reglas activas requiere que

primero se expresen las restricciones en forma de predicado SQL. El predicado corresponderá a la

parte de la condición de una o más reglas activas asociadas a la restricción; hay que notar, sin

embargo, que el predicado debe aparecer negado en la regla, de modo que su consideración lleva al

valor verdadero cuando se viola la restricción. Después de esto, el diseñador se debe concentrar en

los eventos que pueden originar la violación de la restricción. Estos eventos serán los que se incluirán

en las reglas activas. Por último, el diseñador tendrá que decidir qué acción llevar a cabo cuando se

viola la restricción. Por ejemplo, la acción podría ser la de forzar un rollback parcial de la sentencia

que ha causado la violación, o bien realizar alguna acción compensatoria que corrija la violación de

la restricción.

También se pueden utilizar reglas activas para mantener datos derivados, como puede ser el

importe total de una factura o la nota media del expediente de un estudiante. Una aplicación similar

es la de utilizar reglas activas para mantener la consistencia de las vistas materializadas (vistas cuyo

resultado también se almacena en la base de datos) cuando cambian los datos de las tablas sobre

las que están definidas. Esta aplicación tiene más relevancia cuando se piensa en la tecnología de

los grandes almacenes de datos (data warehousing). Y otra aplicación también relacionada es el

mantenimiento de la consistencia de tablas replicadas en bases de datos distribuidas, especificando

reglas que modifiquen las réplicas cuando las tablas originales son modificadas.

Otra aplicación importante es el permitir la notificación de que está ocurriendo algún suceso

de interés. Por ejemplo, se puede utilizar un sistema de bases de datos activas para monitorizar

la temperatura de un horno industrial. La aplicación puede insertar periódicamente en la base de

datos las lecturas de los sensores de temperatura y se pueden crear reglas que se activen cuando se

alcancen niveles peligrosos, disparando una alarma.

También se pueden utilizar reglas activas para mantener la seguridad y para realizar auditorías

sobre el acceso a los datos. Una última aplicación de las bases de datos activas es el mantenimiento



-- 187 of 227 --



178 9.6. VISTAS Y DISPARADORES

de otras reglas, clasificadas como externas, que expresan conocimiento específico de la aplicación y

que están más allá de los esquemas predefinidos y rígidos. Estas reglas son las denominadas reglas

de negocio ya que expresan las estrategias de una organización para llevar a cabo sus funciones

primarias. En el caso de las reglas de negocio no hay técnicas de derivación de reglas basadas en las

especificaciones. Es por ello que cada problema se debe afrontar por separado.

9.6. Vistas y disparadores

Como se ha visto en el capítulo 8 sobre diseño físico, cuando se actualiza una tabla, el cambio

se ve reflejado desde todas las vistas que la referencian. Del mismo modo, si se actualiza una vista,

las tablas de las que se deriva deberían reflejar el cambio. Sin embargo, hay algunas restricciones

respecto a los tipos de modificaciones que se pueden realizar sobre las vistas. De hecho, el estándar

de SQL permite que sean actualizables un conjunto restringido de vistas. Por lo tanto, cuando sea

necesario, es posible hacer que una vista sea actualizable mediante disparadores de tipo INSTEAD OF.

Ejemplo 9.1 Disparador INSTEAD OF sobre una vista.

Las tablas que aparecen a continuación almacenan la información de interés de las cuentas de una

entidad bancaria. Cada cuenta tiene un número de cuenta y se conoce su saldo. Las cuentas pueden

ser de ahorro o cuentas corrientes. De las primeras se conoce el interés anual que reciben y de las

segundas la cantidad límite por la que se puede tener un descubierto.

CTAS_AHORRO(num_cta, saldo, interes_anual) CTAS_CORRIENTES(num_cta, saldo,

lim_descubierto)

Y se ha definido la siguiente vista:

CREATE VIEW cuentas(num_cta, saldo, tipo, interes_anual, lim_descubierto) AS

SELECT num_cta, saldo, ’ahorro’, interes_anual, NULL

FROM ctas_ahorro

## UNION

SELECT num_cta, saldo, ’corriente’, NULL, lim_descubierto

FROM ctas_corrientes;



-- 188 of 227 --



### CAPÍTULO 9. ACTIVIDAD EN BASES DE DATOS RELACIONALES 179

El disparador que permite actualizar el saldo de las cuentas a través de la vista mediante sen-

tencias del tipo: UPDATE cuentas SET saldo = ... WHERE num_cta = ..., es el siguiente:

CREATE OR REPLACE TRIGGER trg_cuentas_view

INSTEAD OF UPDATE ON cuentas

## FOR EACH ROW

## BEGIN

IF ( :NEW.tipo = ’ahorro’ ) THEN

UPDATE ctas_ahorro

SET saldo = :NEW.saldo

WHERE num_cta = :NEW.num_cta;

## ELSE

UPDATE ctas_corrientes

SET saldo = :NEW.saldo

WHERE num_cta = :NEW.num_cta;

END IF;

END;



-- 189 of 227 --



180 9.6. VISTAS Y DISPARADORES



-- 190 of 227 --



### Capítulo 10

El modelo objeto–relacional

### Introducción y objetivos

Existen aplicaciones para las cuales las bases de datos relacionales no son adecuadas ya que

manejan objetos complejos. Por otra parte, el paradigma de programación más popular en la ac-

tualidad es la programación orientada objetos. Todo ello ha generado la necesidad de incorporar los

objetos al mundo de las bases de datos. En este capítulo se presentan las bases de datos orientadas

a objetos y las bases de datos objeto–relacionales.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Explicar las características de las bases de datos orientadas a objetos y sus diferencias con las

relacionales.

Explicar las nuevas características del estándar actual de SQL que incorpora la orientación a

objetos en las bases de datos relacionales.

Buscar en los manuales de un SGBD las características que presenta del modelo objeto-

relacional.

Explicar el problema del mapeo objeto–relacional.

10.1. Necesidad de la orientación a objetos

Los modelos de bases de datos tradicionales (relacional, red y jerárquico) han sido capaces de

satisfacer las necesidades, en cuanto a bases de datos, de las aplicaciones de gestión tradicionales.

Sin embargo, presentan algunas deficiencias cuando se trata de aplicaciones más complejas o sofisti-

cadas como, por ejemplo, el diseño y fabricación en ingeniería (CAD/CAM, CIM), la ingeniería del

software (CASE), los experimentos científicos, los sistemas de información geográfica o los sistemas

181



-- 191 of 227 --



182 10.1. NECESIDAD DE LA ORIENTACIÓN A OBJETOS

multimedia. Los requisitos y las características de estas nuevas aplicaciones difieren en gran medida

de las típicas aplicaciones de gestión: la estructura de los objetos es más compleja, las transacciones

son de larga duración, se necesitan nuevos tipos de datos para almacenar imágenes y textos, y hace

falta definir operaciones no estándar, específicas para cada aplicación.

Las bases de datos orientadas a objetos se crearon para tratar de satisfacer las necesidades de

estas nuevas aplicaciones. La orientación a objetos ofrece flexibilidad para manejar algunos de estos

requisitos y no está limitada por los tipos de datos y los lenguajes de consulta de los sistemas de

bases de datos tradicionales. Una característica clave de las bases de datos orientadas a objetos es

la potencia que proporcionan al diseñador al permitirle especificar tanto la estructura de objetos

complejos, como las operaciones que se pueden aplicar sobre dichos objetos.

Otro motivo para la creación de las bases de datos orientadas a objetos es el creciente uso de los

lenguajes orientados a objetos para desarrollar aplicaciones. Las bases de datos se han convertido

en piezas fundamentales de muchos sistemas de información y las bases de datos tradicionales son

difíciles de utilizar cuando las aplicaciones que acceden a ellas están escritas en un lenguaje de

programación orientado a objetos como C++ o Java. Las bases de datos orientadas a objetos se

han diseñado para que se puedan integrar directamente con aplicaciones desarrolladas con lenguajes

orientados a objetos, habiendo adoptado muchos de los conceptos de estos lenguajes.

Los fabricantes de los SGBD relacionales también se han dado cuenta de las nuevas necesidades

en el modelado de datos, por lo que las nuevas versiones de sus sistemas incorporan muchos de

los rasgos propuestos para las bases de datos orientadas a objetos, como ha ocurrido con Informix,

PostgreSQL y Oracle, entre otros. Esto ha dado lugar al modelo relacional extendido y a los sistemas

que lo implementan se les denomina sistemas objeto–relacionales. A partir de la versión SQL:1999

del estándar incluye algunas de las características de la orientación a objetos.

Durante los últimos años se han creado prototipos experimentales de sistemas de bases de datos

orientadas a objetos y también sistemas comerciales. Conforme éstos fueron apareciendo, surgió

la necesidad de establecer un modelo estándar y un lenguaje. Para ello, los fabricantes de los

SGBD orientados a objetos formaron un grupo denominado ODMG (Object Database Management

Group), que propuso el estándar ODMG–93 y que ha ido evolucionando, apareciendo después nuevas

versiones. El uso de estándares proporciona portabilidad, permitiendo que una aplicación se pueda

ejecutar sobre sistemas distintos con mínimas modificaciones. Los estándares también proporcionan

interoperabilidad, permitiendo que una aplicación pueda acceder a varios sistemas diferentes. Y una

tercera ventaja de los estándares es que permiten que los usuarios puedan comparar entre distintos

sistemas comerciales, dependiendo de qué partes del estándar proporcionan.



-- 192 of 227 --



### CAPÍTULO 10. EL MODELO OBJETO–RELACIONAL 183

10.2. Debilidades de los SGBD relacionales

El modelo relacional tiene una sólida base teórica, basada en la lógica de predicados de primer

orden. Gracias a esta teoría se ha desarrollado un lenguaje declarativo, el SQL, que se ha convertido

en un estándar para el acceso a las bases de datos relacionales. Otra virtud es que el modelo relacional

es muy simple. También es muy apropiado para los sistemas de procesamiento de transacciones en

línea (OLTP) y ofrece gran independencia de datos. Sin embargo, también tiene algunas debilidades,

que se citan a continuación:

Pobre representación de las entidades del mundo real, siendo necesario descomponerlas para

almacenarlas en varias tablas y tener que realizar muchos JOIN para recuperarlas.

La tabla tiene una sobrecarga semántica, porque se utiliza para almacenar tanto entidades

como relaciones, sin que haya posibilidad de distinguir automáticamente qué representa cada

tabla, por lo que no se puede explotar la semántica en los operadores. Sucede lo mismo con

las relaciones: se expresan todas como claves ajenas y en cada clave ajena no se expresa lo

que representa la relación, su significado.

Se ofrece un soporte muy limitado para expresar y mantener las reglas de integridad y las

reglas de negocio. Algunos sistemas no dan ningún soporte en absoluto, por lo que se deben

construir en los programas de aplicación, duplicándose el esfuerzo dedicado a realizarlas y

aumentando la posibilidad de que aparezcan inconsistencias.

La estructura de los datos es homogénea: cada fila de una misma tabla tiene la misma estruc-

tura, los mismos atributos. Además, en todas las filas los valores de cada atributo pertenecen

a un solo dominio. Y en la intersección de cada fila con cada columna sólo puede aparecer un

valor atómico. Esta estructura es demasiado restrictiva para muchos objetos del mundo real,

que tienen una estructura compleja, por lo que acceder a los mismos cuando se almacenan en

una base de datos relacional, requiere realizar muchos JOIN.

El modelo relacional tiene un conjunto fijo de operaciones, que viene dado por la especificación

del estándar de SQL. Esto resulta muy restrictivo para modelar el comportamiento de muchos

objetos del mundo real.

Es difícil manejar consultas recursivas, es decir, consultas sobre relaciones que una tabla tiene

consigo misma.

Cuando se programan aplicaciones que acceden a bases de datos es necesario embeber las

sentencias del lenguaje declarativo SQL, con las sentencias de un lenguaje procedural, por



-- 193 of 227 --



184 10.3. ORIENTACIÓN A OBJETOS

lo que hay una mezcla de paradigmas de programación que complica el trabajo. Además, el

lenguaje SQL dispone de nuevos tipos de datos que no existen en los lenguajes procedurales y,

por lo tanto, es necesario invertir tiempo en hacer las conversiones oportunas, lo que resulta

poco eficiente. Se calcula que el 30 % del código se dedica a estas tareas de conversión.

Las transacciones de las aplicaciones de gestión suelen ser de muy corta duración por lo que el

control de la concurrencia suele estar basado en bloqueos. Este tipo de control no es adecuado

para transacciones de larga duración, como las de otras aplicaciones que no son las típicas de

gestión.

Los cambios en el esquema de la base de datos son complejos, ya que han de intervenir los

administradores de la base de datos para cambiar la estructura de la base de datos y quizá

los programas de aplicación.

Los sistemas relacionales se han diseñado para realizar accesos asociativos y son pobres en el

acceso navegacional (acceso moviéndose entre registros individuales).

10.3. Orientación a objetos

El término orientado a objetos tiene su origen en los lenguajes de programación orientados

a objetos. Hoy en día, los conceptos de orientación a objetos se aplican al área de las bases de

datos, la ingeniería del software, la inteligencia artificial, etc. Con los lenguajes orientados a objetos

surgieron los tipos abstractos de datos, que ocultan las estructuras de datos internas y especifican

todas las operaciones posibles que se pueden aplicar a un objeto. A esto es a lo que se denomina

encapsulamiento.

Un objeto tiene dos componentes: estado (valor) y comportamiento (operaciones). Es algo similar

a una variable en un lenguaje de programación, excepto en que tiene una estructura de datos

compleja y una serie de operaciones específicas definidas por el programador. Los objetos, en un

lenguaje de programación, sólo existen durante la ejecución del programa, por lo que se denominan

objetos transitorios. Una base de datos orientada a objetos puede extender la existencia de los

objetos de modo que están almacenados permanentemente, por lo que persisten aún al finalizar los

programas que los manipulan. Se dice que las bases de datos orientadas a objetos almacenan objetos

persistentes, que pueden ser accedidos por distintos programas y aplicaciones.

Un objetivo de las bases de datos orientadas a objetos es mantener una correspondencia directa

entre los objetos del mundo real y los de la base de datos, de modo que los objetos no pierdan su

integridad y su identidad, y puedan ser identificados y manipulados fácilmente. Para ello, las bases

de datos orientadas a objetos proporcionan un identificador de objeto (OID) que es único y que es



-- 194 of 227 --



### CAPÍTULO 10. EL MODELO OBJETO–RELACIONAL 185

generado por el sistema automáticamente para cada objeto. Es similar a la clave primaria de una

tabla en una base de datos relacional: si el valor de la clave primaria de una tupla cambia, la tupla

tiene una nueva identidad, aunque representa al mismo objeto del mundo real. Por otra parte, un

objeto del mundo real se puede identificar mediante claves con distintos nombres en distintas tablas,

siendo difícil darse cuenta de que dichas claves representan al mismo objeto.

Otra característica de las bases de datos orientadas a objetos es que los objetos pueden tener

una estructura compleja, tanto como sea necesario para mantener toda la información necesaria

que describe al objeto. En las bases de datos relacionales los objetos con estructura compleja se

almacenan distribuidos en varias tablas, perdiendo toda correspondencia directa entre el objeto en

el mundo real y el objeto en la base de datos.

La estructura interna de un objeto en un lenguaje de programación orientado a objetos incluye

la especificación de variables instancia, que guardan los valores que definen el estado interno del

objeto. Aquí una variable instancia es similar al concepto de atributo, excepto que las variables

instancia están encapsuladas en el objeto y no son visibles desde el exterior por los usuarios, mientras

que en las bases de datos relacionales el usuario necesita saber los nombres de los atributos para

poder especificar condiciones de selección sobre ellos. Los sistemas orientados a objetos permiten la

definición de operaciones o funciones (comportamiento) que se pueden aplicar a los objetos. Estas

operaciones se definen en dos partes. La primera parte se denomina interfaz de la operación y

especifica su nombre y sus argumentos (parámetros). La segunda parte es el método o cuerpo, que

especifica la implementación de la operación. Las operaciones se invocan pasando un mensaje a un

objeto que incluye el nombre de la operación y los parámetros. Entonces el objeto ejecuta el método

de esa operación. Esta encapsulación permite que se pueda modificar la estructura interna de un

objeto y la implementación de sus operaciones, sin la necesidad de afectar a los programas externos

que la invocan. Por lo tanto, la encapsulación proporciona una forma de independencia de datos y

operaciones.

Otro concepto clave en los sistemas orientados a objetos son las jerarquías de tipos y clases, y

la herencia. Esto permite la especificación de nuevos tipos o clases que heredan su estructura y sus

operaciones de tipos o clases definidos previamente. Por lo tanto, la especificación de los tipos de

objetos se puede llevar a cabo sistemáticamente. Eso hace más fácil el desarrollo de los tipos de

datos y permite reutilizar definiciones de tipos en la creación de nuevos tipos.

Las relaciones entre objetos se representan mediante un par de referencias inversas, es decir, en

cada relación los dos objetos se hacen referencia el uno al otro y se mantiene la integridad referencial.

Algunos sistemas orientados a objetos permiten trabajar con múltiples versiones del mismo

objeto, algo esencial en las aplicaciones de diseño e ingeniería. Por ejemplo, se puede querer mantener

la versión antigua de un objeto mientras no se haya verificado la nueva versión.



-- 195 of 227 --



186 10.3. ORIENTACIÓN A OBJETOS

Otro concepto de la orientación a objetos es el polimorfismo de las operaciones que indica la

capacidad de una operación de ser aplicada a diferentes tipos de objetos, es decir, un nombre de

operación puede referirse a distintas implementaciones dependiendo del tipo del objeto al que se

aplica. Por ejemplo, una operación que calcula el área de un objeto geométrico tendrá distinta

implementación dependiendo de si el objeto es un triángulo, un círculo o un cuadrado.

El desarrollo del paradigma orientado a objetos aporta un gran cambio en el modo en que

vemos los datos y los procedimientos que actúan sobre ellos. Tradicionalmente, los datos y los

procedimientos se han almacenado separados: los datos y sus relaciones en la base de datos, y los

procedimientos en los programas de aplicación. La orientación a objetos, sin embargo, combina los

procedimientos de una entidad con sus datos.

Esta combinación se considera como un paso adelante en la gestión de datos. Las entidades

son unidades autocontenidas que se pueden reutilizar con relativa facilidad. En lugar de ligar el

comportamiento de una entidad a un progama de aplicación, el comportamiento es parte de la

entidad en sí, por lo que en cualquier lugar en el que se utilice la entidad, se comporta de un modo

predecible y conocido.

El modelo orientado a objetos también soporta relaciones de muchos a muchos, siendo el primer

modelo que lo permite. Aún así se debe ser muy cuidadoso cuando se diseñan estas relaciones para

evitar pérdidas de información.

Por otra parte, las bases de datos orientadas a objetos son navegacionales: el acceso a los datos

es a través de las relaciones, que se almacenan con los mismos datos. Esto se considera un paso

atrás. Las bases de datos orientadas a objetos no son apropiadas para realizar consultas ad hoc,

al contrario que las bases de datos relacionales, aunque normalmente las soportan. La naturaleza

navegacional de las bases de datos orientadas a objetos implica que las consultas deben seguir

relaciones predefinidas y que no pueden insertarse nuevas relaciones “al vuelo”.

No parece que las bases de datos orientadas a objetos vayan a reemplazar a las bases de datos

relacionales en todas las aplicaciones del mismo modo en que éstas reemplazaron a sus predecesoras.

Los objetos han entrado en el mundo de las bases de datos de varias formas:

SGBD orientados a objetos puros: son SGBD basados completamente en el modelo orientado

a objetos.

SGBD híbridos u objeto–relacionales: son SGBD relacionales que permiten almacenar objetos

en sus relaciones (tablas).

A continuación, y como motivación adicional, se citan las ventajas de la orientación a objetos

en programación:



-- 196 of 227 --



### CAPÍTULO 10. EL MODELO OBJETO–RELACIONAL 187

Un programa orientado a objetos consta de módulos independientes, por lo que se pueden

reutilizar en distintos programas, ahorrando tiempo de desarrollo.

El interior de una clase se puede modificar como sea necesario siempre que su interfaz pública

no cambie, de modo que estas modificaciones no afectarán a los programas que utilizan la

clase.

Los programas orientados a objetos separan la interfaz de usuario de la gestión de los datos,

haciendo posible la modificación de una independientemente de la otra.

La herencia añade una estructura lógica al programa relacionando clases desde lo general a lo

más específico, haciendo que el programa sea más fácil de entender y, por lo tanto, más fácil

de mantener.

10.4. SGBD objeto–relacionales

El modo en que los objetos han entrado en el mundo de las bases de datos relacionales es en

forma de dominios, actuando como el tipo de datos de una columna. Hay dos implicaciones muy

importantes por el hecho de utilizar una clase como un dominio:

Es posible almacenar múltiples valores en una columna de una misma fila ya que un objeto

suele contener múltiples valores. Sin embargo, si se utiliza una clase como dominio de una

columna, en cada fila esa columna sólo puede contener un objeto de la clase (se sigue man-

teniendo la restricción del modelo relacional de contener datos atómicos en la intersección de

cada fila con cada columna).

Es posible almacenar procedimientos en las relaciones porque un objeto está enlazado con el

código de los procesos que sabe realizar (los métodos de su clase).

Otro modo de incorporar objetos en las bases de datos relacionales es construyendo tablas de

objetos, donde cada fila es un objeto.

Ya que un sistema objeto–relacional es un sistema relacional que permite almacenar objetos

en sus tablas, la base de datos sigue sujeta a las restricciones que se aplican a todas las bases de

datos relacionales y conserva la capacidad de utilizar operaciones de concatenación (JOIN) para

implementar las relaciones “al vuelo”.

A continuación se describen, brevemente, las características objeto–relacionales que incorpora

el estándar de SQL. El estudio de las características objeto–relacionales que incorporan los SGBD

actuales, como Oracle o PostgreSQL, se aplaza a un curso más avanzado sobre la materia.



-- 197 of 227 --



188 10.5. OBJETOS EN EL ESTÁNDAR DE SQL

10.5. Objetos en el estándar de SQL

Ya que los SGBD relacionales ofrecen muchas características muy atractivas (control de con-

currencia, recuperación, mantenimiento de índices, lenguajes de consultas, etc.), se les exige que

evolucionen para satisfacer a otros tipos de aplicaciones, distintas de las típicas de gestión empre-

sarial, con nuevas necesidades en cuanto a almacenamiento y manipulación de datos. Es por esto

que a partir del estándar SQL:1999, el lenguaje SQL es objeto–relacional. Además, es activo, ya

que incorpora los disparadores y es deductivo, permitiendo la definición de vistas en función de sí

mismas (vistas recursivas).

Por ejemplo, cuando se necesita almacenar imágenes, sonido o vídeos, los sistemas relacionales

sólo soportan el tipo BLOB (binary large object ) y no proporcionan funciones ni operadores para

manipularlos, además de que se almacenan en la misma tabla en la que se encuentran (el acceso a

la tabla será lento por ser sus filas muy grandes). El estándar de SQL proporciona dos tipos LOB

para este tipo de datos: BLOB (binay large object) y CLOB (character large object ). Estos tipos se

almacenan por separado de las filas en que aparecen y se pueden comparar (=, <>) y utilizar sobre

ellos funciones predefinidas, como por ejemplo SUBSTR sobre el tipo CLOB.

Además, el estándar de SQL permite definir nuevos tipos de datos (tipos de datos definidos por el

usuario) cuya estructura se puede definir bien internamente, a partir de otros tipos, siendo entonces

conocida por el SGBD; o bien externamente, mediante un lenguaje orientado a objetos, siendo

entonces lo que se denomina un tipo abstracto de datos ya que el SGBD no conoce su estructura

interna.

El estándar proporciona también dos tipos de datos estructurados, cada uno con sus operadores,

de manera que las columnas de las tablas ya no han de contener necesariamente valores atómicos:

ROW(campo1 tipo1, campo2 tipo2, ...) define una fila de campos, pudiendo ser cada uno

de un tipo distinto. Para referirse a los campos se utiliza la notación punto; si un campo es a

su vez de tipo ROW, se usa también la notación punto para seguir el camino hasta el dato.

tipo ARRAY[i] define un vector de hasta i elementos del mismo tipo (los elementos de un

ARRAY no pueden ser a su vez de tipo ARRAY). La función CARDINALITY devuelve el número

de elementos de un ARRAY. También es posible concatenar dos datos de este tipo mediante el

operador ||

Por problemas de última hora en sus especificaciones, no se incluyeron otros tipos estructura-

dos que sí se esperan para el próximo estándar: LISTOF(tipo) (lista), SETOF(tipo) (conjunto, sin

duplicados) y BAGOF(tipo) (multiconjunto o conjunto con duplicados).

Cuando se definen tipos abstractos de datos (TAD), el SGBD no necesita conocer cómo se

almacena el tipo ni cómo trabajan sus métodos, sólo ha de saber qué métodos hay definidos sobre



-- 198 of 227 --



### CAPÍTULO 10. EL MODELO OBJETO–RELACIONAL 189

el tipo y los tipos de los datos de entrada y de salida de cada método (sólo necesita saber invocar el

método y qué tipo de datos esperar como resultado). A esto es a lo que se denomina encapsulamiento.

En el siguiente ejemplo se muestra la definición de una función definida externamente en el

fichero /home/bart/funcion.class en JAVA.

CREATE FUNCTION funcion(tipo1, tipo2, ...) RETURNS tipo_datos_salida

AS EXTERNAL NAME ’/home/bart/funcion.class’ LANGUAGE ’java’;

tipo1, tipo2, ... son los tipos de datos de los parámetros de entrada.

Cuando se define un TAD, se deben especificar siempre dos funciones (que también serán defi-

nidas por el usuario) para realizar la entrada y la salida:

CREATE ABSTRACT DATA TYPE nombre_tad

(INTERNALLENGTH=num_bytes, INPUT=funcion_in, OUTPUT=funcion_out);

funcion_in será una función que reciba una cadena de caracteres y devuelva un dato de tipo

nombre_tad; funcion_out será una función que reciba un dato de tipo nombre_tab y que devuelva

una cadena. Estás funciones serán invocadas por el SGBD automáticamente cuando se escriba y se

lea un valor del nuevo TAD.

En el estándar de SQL se implementa el concepto de herencia en los tipos:

CREATE TYPE subtipo UNDER tipo (atrib1 tipo1, atrib2 tipo2, ...);

De este modo, el subtipo hereda del tipo todos sus métodos y atributos, añadiendo nuevos atributos

atrib1, atrib2, ... (especialización). Aquí subtipo y tipo no sólo se relacionan, como ocurre

en el modelo relacional cuando especificamos una clasificación, sino que un elemento de un subtipo

siempre puede ser considerado como un elemento del súpertipo o tipo genérico.

La herencia puede darse también en las tablas, además de en los tipos:

CREATE TABLE t OF tipo;

CREATE TABLE st OF subtipo UNDER t;

De este modo, al consultar la tabla t también se recorre la tabla st. Para recorrer sólo t en la

consulta se utiliza la palabra clave ONLY en la cláusula FROM.

Entre los métodos se puede dar la sobrecarga (un mismo nombre de método con distintos pa-

rámetros y distintas implementaciones) y el polimorfismo (en una jerarquía de tipos, cada subtipo

puede tener una implementación distinta para un mismo método).

En una base de datos orientada a objetos, cada objeto tiene un identificador único que es distinto

del resto de identificadores de objetos de toda la base de datos, que nunca cambia y que nunca vuelve



-- 199 of 227 --



190 10.6. MAPEO OBJETO–RELACIONAL

a utilizarse, aunque el objeto termine su existencia. A este identificador se le denomina oid. El tipo

de un oid es similar al tipo de un puntero en un lenguaje de programación.

En el estándar cada fila de una tabla puede tener un oid. Para ello, la tabla se debe definir en

función de un tipo estructurado CREATE TABLE ...OF ... y se le debe asociar el tipo REF:

CREATE TABLE t OF tipo REF IS SYSTEM GENERATED;

El tipo REF contiene valores que son oid. El estándar de SQL exige que cada columna de tipo REF

vaya asociada a una tabla, para lo que se utiliza la palabra clave SCOPE:

CREATE TABLE tt (colref REF(tipo) SCOPE t, ...);

De este modo, las filas de la tabla tt harán referencia, mediante la columna colref, a filas de la

tabla t. Es importante hacer notar aquí que las referencias son navegacionales. Para seguir una

### referencia y obtener los valores de los datos referenciados se utiliza el método DEREF(). Por ejemplo,

si la tabla t tiene un atributo llamado a, se puede obtener su valor en la fila referenciada por una

fila de la tabla tt mediante la expresión tt.DEREF(colref).a o bien utilizando un operador flecha

al estilo de JAVA: tt.colref→a.

10.6. Mapeo objeto–relacional

Cuando se programan aplicaciones utilizando lenguajes orientados a objetos y que deben acce-

der a bases de datos relacionales, surge el problema del mapeo objeto–relacional: las clases deben

mapearse a las tablas de la base de datos, de modo que los objetos del programa sean persistentes.

Lo que se hace necesario es una capa que traduzca las operaciones sobre los objetos a sentencias

SQL sobre las tablas de la base de datos relacional. Se han desarrollado múltiples herramientas que

tratan de automatizar este proceso. Actualmente Hibernate es la infraestructura más popular para

programar en Java.



-- 200 of 227 --



### Capítulo 11

Sistemas de gestión de bases de datos

### Introducción y objetivos

Puesto que toda base de datos va ligada a un SGBD, es interesante conocer qué funciones realiza

y de qué manera interactúa el personal informático con él, en función de su papel (programador,

administrador, etc.). En este capítulo se presentan de manera introductoria las técnicas que se

utilizan para implementar los SGBD según una arquitectura genérica, en la que se basan la mayor

parte de los SGBD que existen en el mercado.

Al finalizar este capítulo, el estudiantado debe ser capaz de:

Describir la arquitectura de un SGBD genérico.

Enumerar los tipos de información que se almacenan en el diccionario de datos y para qué se

utilizan.

Buscar en los manuales de un SGBD cómo se accede al diccionario de datos y qué información

almacena.

Describir cómo se lleva a cabo el procesamiento de consultas.

Buscar en los manuales de un SGBD qué herramientas proporciona para estudiar los planes

de ejecución y cómo influir en la fase de optimización.

Describir la necesidad del procesamiento de transacciones.

Buscar en los manuales de un SGBD qué soporte da al manejo de transacciones y qué niveles

de aislamiento implementa.

191



-- 201 of 227 --



192 11.1. ARQUITECTURA DE UN SGBD

Describir cómo se realiza la recuperación ante fallos.

Buscar en los manuales de un SGBD información sobre las posibilidades ofrece en cuanto a la

recuperación.

Describir las distintas herramientas que se pueden utilizar para garantizar la seguridad en las

bases de datos.

Buscar en los manuales de un SGBD información sobre cómo se garantiza la seguridad.

11.1. Arquitectura de un SGBD

En general, la arquitectura de un SGBD está formada por los siguientes módulos:

Procesador de consultas. El SGBD acepta sentencias SQL y las analiza y traduce al álgebra

relacional, pasándoselas después al optimizador de consultas, que produce un plan de ejecución

eficiente para la sentencia.

Gestor de ficheros. El SGBD hace su propia gestión de ficheros, manteniendo información

sobre qué bloques de disco ocupa cada fichero y qué datos de la base de datos se ubican en

ellos. Este gestor también se encarga de manejar los buffers de entrada/salida entre el disco

y la memoria. Además, se encarga de gestionar el espacio en disco, añadiendo o eliminando

bloques en los ficheros conforme sea necesario.

Gestor de transacciones. Garantiza que las peticiones de bloqueos y las liberaciones de éstos,

se lleven a cabo siguiendo un protocolo concreto y planifica la ejecución de las transacciones

concurrentes.

Gestor de bloqueos. Para realizar su tarea, el gestor de transacciones se vale del gestor de

bloqueos, que mantiene información sobre los bloqueos realizados sobre los objetos de la base

de datos.

Gestor de recuperación. El SGBD realiza el control de la concurrencia y la recuperación ante

fallos llevando un riguroso control de las peticiones de los usuarios y manteniendo un diario

con todos los cambios realizados por estas peticiones sobre la base de datos. Este módulo es

el encargado de mantener este diario y de restablecer el sistema a un estado consistente tras

ocurrir cualquier fallo.

Gestor de seguridad. El SGBD permite establecer privilegios de acceso sobre los usuarios y se

encarga de garantizar que estos privilegios sean siempre respetados.



-- 202 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 193

11.2. Diccionario de datos

Una parte muy importante de todo SGBD es el diccionario de datos o catálogo. El diccionario de

datos es una mini-base de datos y su función principal es almacenar los esquemas o descripciones de

las bases de datos que el SGBD mantiene. Esta información es lo que se suele denominar metadatos.

Además, el diccionario de datos almacena otro tipo de información necesaria para distintos módulos

del SGBD como, por ejemplo, el optimizador de consultas o el módulo que se encarga de la seguridad.

Más concretamente, en una base de datos relacional, el diccionario de datos está formado por

un conjunto de tablas de sólo lectura que contienen:

Las definiciones de todos los objetos que forman parte del esquema de la base de datos: tablas,

vistas, índices, sinónimos, procedimientos, funciones, disparadores, etc.

Cuánto espacio se ha reservado para los objetos de la base de datos y cómo se está utilizando

este espacio.

Valores por defecto de las columnas.

Información sobre reglas de integridad (claves primarias, claves alternativas UNIQUE, claves

ajenas, restricciones CHECK).

Los nombres de los usuarios y los privilegios que posee cada uno de ellos.

Información de auditoría como, por ejemplo, quién ha creado o modificado la definición de los

objetos de la base de datos.

Información estadística sobre el contenido de las tablas de la base de datos y también sobre

el contenido de los índices.

El diccionario de datos es una herramienta importante, tanto para los usuarios como para los

diseñadores de aplicaciones y los administradores de la base de datos. Para acceder al diccionario

de datos se realizan consultas mediante el lenguaje SQL.

Normalmente, un diccionario de datos está formado por tablas base y por vistas. Las tablas base

sólo son accesibles por el propio sistema y poseen la información codificada. Esta información se

hace accesible a los usuarios mediante una serie de vistas que resumen y visualizan los datos del

diccionario.

El diccionario de datos tiene tres usos principalmente:

El SGBD accede al diccionario para obtener información sobre los usuarios y sus privilegios,

sobre los objetos de la base de datos, estadísticas sobre ellos y las estructuras de almacena-

miento.



-- 203 of 227 --



194 11.3. PROCESAMIENTO DE CONSULTAS

El SGBD modifica el diccionario cada vez que se ejecuta una sentencia del lenguaje de defini-

ción de datos.

Los usuarios del SGBD pueden acceder al diccionario para obtener información sobre la base

de datos.

Los datos de las tablas base del diccionario de datos son necesarios para que el SGBD funcione,

por lo tanto él es el único que puede escribir o modificar la información del diccionario. Mientras la

base de datos está en uso, el SGBD consulta el diccionario de datos para asegurarse de que existen

los objetos de la base de datos a los que los usuarios quieren acceder y que éstos tienen los privilegios

correspondientes.

Ya que el SGBD debe consultar el diccionario de datos muy a menudo, lo mantiene en su caché

para que el acceso sea más rápido y, mientras la base de datos esté abierta, el diccionario estará

accesible.

El estándar actual de SQL realiza la especificación del diccionario en el documento SQL/Schemata.

En él proponen la especificación de 85 vistas de sólo lectura pertenecientes al esquema denominado

INFORMATION_SCHEMA. Las últimas versiones de PostgreSQL y de MySQL proporcionan este esquema

aunque incompleto. Oracle tiene un gran diccionario de datos y no sigue el estándar.

11.3. Procesamiento de consultas

Otro aspecto muy importante de los SGBD es el procesamiento de las consultas. Toda consulta

expresada en un lenguaje de alto nivel, como SQL, debe ser reconocida, analizada y validada. El

reconocedor identifica los símbolos del lenguaje en el texto de la consulta (palabras reservadas de

SQL, nombres de atributos y nombres de tablas) y el analizador comprueba la sintaxis de la consulta

para determinar si se ha expresado de acuerdo a las reglas de la gramática del lenguaje de consultas.

Además, la consulta se valida comprobando que todos los nombres de los atributos y de las tablas

son válidos. Entonces se crea una representación interna de la consulta, normalmente mediante

una estructura en forma de árbol, denominada árbol de consulta. A partir de aquí, el SGBD debe

determinar una estrategia de ejecución para obtener los datos de la consulta de los ficheros de la

base de datos. Lo típico es que una misma consulta tenga varias estrategias de ejecución posibles,

por lo que los SGBD poseen un módulo que se encarga de escoger la más apropiada. Este módulo

es el optimizador de consultas. Una vez escogido el plan de ejecución, el generador de código genera

las sentencias que ejecutan dicho plan. A continuación, el procesador de la base de datos ejecuta la

consulta para producir el resultado. Si ocurre algún error de ejecución, es este último módulo el que

se encarga de generar el mensaje de error correspondiente.



-- 204 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 195

En realidad, el término optimizador no es del todo correcto, ya que, en algunos casos, el plan de

ejecución escogido no es el óptimo, es tan solo una estrategia razonablemente eficiente para ejecutar

la consulta. Normalmente, encontrar la estrategia óptima requiere mucho tiempo y también requiere

información sobre la implementación de los ficheros, e incluso sobre su contenido, información que

puede no estar disponible en el diccionario de datos.

En los lenguajes navegacionales o de bajo nivel, como los de los sistemas jerárquicos y de red,

es el programador quien escoge la estrategia de ejecución de las consultas en el momento de escribir

la aplicación. Si un SGBD sólo proporciona un lenguaje navegacional, tiene poca oportunidad de

participar en la optimización de consultas; es al programador a quien compete el escoger la estrategia

de ejecución óptima. Los lenguajes de consultas de alto nivel, como SQL en los sistemas relacionales

y OQL en los sistemas orientados a objetos, son declarativos, ya que mediante ellos se especifica el

resultado que se pretende obtener y no cómo debe obtenerse. Por lo tanto, con los lenguajes de alto

nivel, es necesaria la optimización de consultas. En este apartado se describe el procesamiento y la

optimización de consultas en los SGBD relacionales. La mayoría de estas técnicas se han adaptado

para los SGBD orientados a objetos.

Cada SGBD posee varios algoritmos distintos para implementar cada una de las operaciones

relacionales como, por ejemplo, la restricción, la concatenación o combinaciones de estas operaciones.

El optimizador de consultas sólo puede considerar aquellas estrategias de ejecución que se pueden

implementar mediante estos algoritmos y que se aplican a la consulta especificada y al diseño físico

concreto de la base de datos que se está consultando.

Para la implementación de la optimización de consultas hay dos técnicas. La primera de ellas se

basa en reglas heurísticas1 para ordenar las operaciones en la estrategia de ejecución de la consulta.

La segunda técnica conlleva la estimación sistemática del coste de distintas estrategias de ejecución y

la elección del plan de ejecución que tiene el menor coste estimado. Normalmente, los optimizadores

de consultas combinan las dos técnicas.

En el procesamiento de consultas los objetivos son:

Optimizar el tiempo total de ejecución.

Optimizar el uso de los recursos.

Cuando se trata de optimizar el uso de los recursos, lo apropiado es la ejecución paralela. Si varios

procesos colaboran para obtener el resultado, los recursos están mejor aprovechados y, en general,

también se mejora el tiempo de respuesta. El paralelismo es apropiado cuando se trabaja con

sistemas en los que se debe procesar grandes cantidades de información, como se hace con los

1Una regla heurística es una regla que funciona bien en la mayoría de los casos, aunque no se garantiza que funcione

bien en todos los casos posibles.



-- 205 of 227 --



196 11.3. PROCESAMIENTO DE CONSULTAS

grandes almacenes de datos (data warehouses), a los que acceden de modo concurrente unos pocos

usuarios. Sin embargo, en las aplicaciones típicas de procesamiento de transacciones en línea (OLTP)

el acceso concurrente es mucho mayor por parte de los usuarios y se accede a pequeñas cantidades

de datos en transacciones de muy corta duración. En este caso, el paralelismo no es una buena

solución.

En general, cuando se trata de reducir el tiempo total de respuesta se debe optimizar el proce-

dimiento que se va a seguir en la ejecución. Para ello, se pueden reestructurar las sentencias SQL,

reestructurar los índices, reestructurar los datos, modificar o deshabilitar disparadores y restriccio-

nes, mantener las consultas compiladas (conservando sus planes de ejecución), etc. Encontrar la

solución óptima es un problema intratable, por lo que se trata de encontrar una solución cercana a

la solución óptima. Para ello, es necesario conocer una serie de estadísticas sobre la base de datos:

tamaño de las tablas, número de filas de cada tabla que caben en un bloque de disco, número de

valores distintos de cada atributo dentro de cada tabla, número de niveles de los índices, etc. Man-

tener estas estadísticas actualizadas es también una operación costosa, por lo que su mantenimiento

se realiza de forma periódica.

Generalmente, el procesamiento de consultas se realiza en las siguientes etapas:

Descomposición. A partir de la sentencia SQL, se obtiene una expresión del álgebra relacional

equivalente que es sintáctica y semánticamente correcta. Durante esta etapa se accede al

diccionario de datos para consultar las definiciones de tablas y vistas de la base de datos:

nombre y tipo de datos de cada columna, restricciones de integridad, etc.

Optimización. A partir de la expresión del álgebra relacional generada en la etapa anterior, se

obtiene un plan de ejecución eficiente para ejecutar la consulta basándose en las estadísticas

sobre la base de datos que se almacenen en el diccionario de datos: número de filas de cada

tabla, columnas sobre las que se han definido índices, etc.

Generación de código. A partir del plan de ejecución se genera el código de la consulta.

Ejecución. El código que se ejecuta accede a la base de datos para obtener el resultado de la

sentencia SQL.

Las tres primeras etapas del procesamiento de consultas (descomposición, optimización y gene-

ración de código) forman la fase de compilación. Esta compilación puede ser dinámica o estática.

Cuando la compilación es dinámica, las tres etapas tienen lugar cada vez que se procesa una consul-

ta. Ya que estas etapas consumen tiempo, no se puede encontrar siempre el mejor plan de ejecución

(aunque sí uno que sea bastante bueno). Sin embargo, la información estadística que se maneja es la

más actualizada que hay disponible. Cuando la compilación es estática, tiene lugar solamente una



-- 206 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 197

vez y se dedica más tiempo para conseguir la mejor estrategia. Lo que sucede en este caso es que al

ejecutarla es posible que haya dejado de serlo. Una opción intermedia es realizar una compilación

híbrida: la compilación es estática, pero hay que recompilar cuando se detectan cambios impor-

tantes en las estadísticas de la base de datos que se guardan en el diccionario y que se actualizan

periódicamente.

11.3.1. Descomposición de la consulta

La descomposición de la consulta se lleva a cabo en varias etapas: análisis, normalización, análisis

semántico, simplificación y reestructuración de la consulta. No todos los SGBD implementan todas

estas etapas ni las llevan a cabo en este mismo orden.

1. Análisis. En la primera etapa se realiza el análisis léxico y sintáctico de la consulta y se

realiza su conversión a alguna representación interna que sea más adecuada para manejarla

en el sistema, eliminando consideraciones externas, como la sintaxis concreta del lenguaje de

consultas que se esté utilizando. Por lo general, la forma interna seleccionada es algún tipo de

árbol de consulta y está basado en el álgebra relacional.

2. Normalización. En esta etapa se convierte la consulta a una forma normalizada más manejable.

El predicado de la sentencia, que puede ser bastante complejo, se puede convertir a una de las

formas normales que se citan a continuación:

Forma normal conjuntiva: consiste en una secuencia de conjunciones conectadas por el

operador AND. Cada conjunción contiene uno o varios términos conectados por el operador

OR.

Forma normal disyuntiva: consiste en una secuencia de disyunciones conectadas por el

operador OR. Cada disyunción contiene uno o varios términos conectados por el operador

AND.

3. Análisis semántico. En esta etapa se eliminan las consultas normalizadas que están mal formu-

ladas o que son contradictorias. Por ejemplo, se puede considerar erróneo el predicado: dto=0

AND dto=20 ya que es contradictorio. Sin embargo, no hay acuerdo entre los distintos SGBD

sobre cómo actuar en estos casos, porque se podría avisar al usuario de que hay un error o

bien se podría evaluar la expresión a falso y continuar con la sentencia. En este último caso,

la expresión (dto=0 AND dto=20) OR iva=16 se simplificaría a iva=16.

Existen algunos algoritmos que permiten determinar la corrección de las consultas que no

poseen disyunciones ni negaciones. Estos algoritmos generan un grafo a partir de la consulta

y a partir del grafo realizan la verificación.



-- 207 of 227 --



198 11.3. PROCESAMIENTO DE CONSULTAS

4. Simplificación. En esta etapa se detectan las expresiones redundantes, se eliminan subexpre-

siones comunes y se transforma la consulta en otra semánticamente equivalente más fácil y

más eficiente de calcular. Aquí se consideran las restricciones de acceso, las definiciones de las

vistas y las reglas de integridad.

5. Reestructuración de la consulta. El último paso de la descomposición de la consulta consiste

en reestructurarla para obtener una implementación más eficiente. Para ello se utilizan reglas

heurísticas aplicando transformaciones sobre las operaciones del álgebra relacional.

11.3.2. Optimización de la consulta

Una vez convertida la representación interna de la consulta a una forma más adecuada, se debe

decidir cómo ejecutarla. En esta etapa entran en juego consideraciones tales como la existencia de

índices u otras rutas de acceso físicas, la distribución de los valores de los datos, el agrupamiento

físico de los datos almacenados, etc.

La estrategia básica es considerar la consulta como la especificación de una serie de operaciones

de bajo nivel (concatenar, restringir, agrupar, etc.) con cierta interdependencia entre sí. Para cada

operación de bajo nivel (y probablemente, para diversas combinaciones comunes de estas operacio-

nes), se dispondrá de un conjunto de procedimientos de implementación predefinidos. Por ejemplo,

habrá un conjunto de procedimientos para la implementación de la restricción: uno para el caso en

que la restricción es una comparación de igualdad sobre la clave primaria, otro donde el atributo de

la restricción esté indexado, etc. Cada uno de ellos tendrá una fórmula de coste asociada que indica

el coste de ejecutar ese procedimiento (generalmente en términos de entrada/salida a disco).

Utilizando la información del diccionario de datos referente al estado actual de la base de datos y

utilizando también la información de interdependencia entre operaciones, el optimizador seleccionará

uno o más procedimientos candidatos para la implementación de cada una de las operaciones de

bajo nivel de la consulta. A partir de ellos construirá un conjunto de planes de consulta candidatos,

seguida de una selección del mejor de esos planes, es decir, el que considera más barato. Cada plan

de consulta se construye mediante la combinación de una serie de procedimientos de implementación

candidatos: uno de ellos para cada una de las operaciones de bajo nivel de la consulta. Generalmente,

existirán muchos planes posibles para una consulta dada. De hecho, en la práctica no es buena idea

generar todos los planes posibles, ya que habrá demasiados y la tarea de seleccionar el más barato

puede llegar a ser excesivamente cara por sí misma, por lo tanto es muy necesaria alguna técnica

que mantenga, dentro de unos límites razonables, al conjunto generado. Es lo que se denomina una

técnica de reducción del espacio de búsqueda.

Normalmente, la selección del plan más barato necesita un método que asigne un coste a cualquier

plan dado. Por supuesto, el coste de un plan dado es básicamente la suma de los costes de los



-- 208 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 199

procedimientos individuales que forman el plan y, por lo tanto, lo que el optimizador tiene que

hacer es evaluar las fórmulas de coste de esos procedimientos individuales. El problema es que esas

fórmulas de coste dependerán del tamaño de las tablas a procesar, y debido a que muchas consultas

involucran la generación de resultados intermedios durante la ejecución, el optimizador tendrá que

estimar el tamaño de esos resultados intermedios para evaluar las fórmulas.

La estimación del coste de las operaciones se hace siempre teniendo en cuenta sólo el tiempo

de entrada/salida, puesto que es en lo que se consume más tiempo y además, siempre es posible

paralelizar la entrada/salida con el procesamiento de los datos en memoria, por lo que el coste de

este procesamiento puede despreciarse frente al primero.

En cuanto a los distintos algoritmos alternativos para implementar cada operador relacional, se

pueden agrupar según la técnica que utilizan:

Indexando: si se especifica una condición de concatenación o una restricción sobre una columna

que está indexada, se puede usar el índice para buscar las filas que cumplan la condición.

Iterando: examinando todas las filas de las tablas involucradas, una tras otra. Si los campos

necesitados forman parte de un índice, se recorre éste para obtenerlos, en lugar de recorrer la

tabla.

Particionando: partiendo en grupos las filas, según una clave de ordenación, se puede des-

componer una operación en un conjunto de operaciones más baratas sobre las particiones.

Ordenación y dispersión (hashing) son dos técnicas de particionado muy habituales.

El éxito al estimar el tamaño y el coste de las operaciones del álgebra relacional depende de la

cantidad y la actualidad de la información estadística que el SGBD mantiene en el diccionario de

datos. Normalmente, el SGBD almacena la siguiente información:

Para cada tabla base T interesa:

nfilas(T): Número de filas que almacena la tabla T (cardinalidad).

bfactor(T): Número de filas de T que caben en un bloque de disco.

nbloques(T): Número de bloques que ocupa la tabla T (=nfilas(T)/bfactor(T)).

Para cada atributo A de la tabla T interesa:

ndistintoA(T): Número de valores distintos que tiene el atributo A en T.

minA(T),maxA(T): Valor mínimo y valor máximo del atributo A en T.

SCA(T): Cardinalidad de selección del atributo A en T. Es el número

medio de filas que satisfacen una condición de igualdad

sobre el atributo A.



-- 209 of 227 --



200 11.4. PROCESAMIENTO DE TRANSACCIONES

Si suponemos que los valores de A están uniformemente distribuidos en T y que hay al menos

un valor que satisface la condición, entonces: SCA(T)=1, si A es un atributo clave de T, y

SCA(T)=nfilas(T)/ndistintoA (T), si A no es clave. También se puede estimar la cardinalidad

de selección SCA(T) para otras condiciones:

A>c nfilas(T)∗((maxA(T) − c)/(maxA(T) − minA(T)))

A<c nfilas(T)∗((c − maxA(T))/(maxA(T) − minA(T)))

A IN (c1, c2,. . . cn) (nfilas(T)/ndistintoA (T)) ∗ n

Para cada índice I con estructura de árbol, definido sobre el conjunto de atributos A interesa:

nnivelesA(I): Número de niveles de I.

nhbloquesA(I): Número de bloques que ocupan las hojas de I.

El estudio de las distintas implementaciones disponibles para cada operación del álgebra rela-

cional se reserva para un curso más avanzado en la materia.

11.4. Procesamiento de transacciones

El concepto de transacción proporciona un mecanismo para describir unidades lógicas en el

procesamiento sobre bases de datos. Los sistemas de procesamiento de transacciones son sistemas con

grandes bases de datos y cientos de usuarios concurrentes que ejecutan sus transacciones. Algunos

ejemplos de éstos son los sistemas de reservas, los sistemas bancarios, los mercados de valores o los

sistemas de los supermercados.

En estos sistemas se requiere una alta disponibilidad y también una respuesta rápida para los

cientos de usuarios concurrentes. El concepto de transacción se utiliza para representar una unidad

lógica de procesamiento sobre la base de datos que se debe ejecutar en su totalidad para garantizar la

corrección. El problema del control de la concurrencia sucede cuando varias transacciones lanzadas

por varios usuarios interfieren unas con otras de modo que se producen resultados erróneos. Cuando

una transacción se lanza al SGBD para ser ejecutada, el sistema es responsable de que, o bien todas

las operaciones de la transacción se ejecuten con éxito, con lo que su efecto quedará permanentemente

en la base de datos, o bien la transacción no tenga ningún efecto sobre la base de datos ni sobre

ninguna otra transacción. Esto último es necesario cuando la transacción falla tras la ejecución de

alguna de sus operaciones.

Hay varias técnicas de control de concurrencia que garantizan que varias transacciones, que se

ejecutan concurrentemente, no interfieran. La mayoría de estas técnicas garantizan la serializabilidad

de planes mediante el uso de protocolos (conjuntos de reglas). Hay un conjunto de protocolos que



-- 210 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 201

utilizan la técnica de bloquear ítems de datos para prevenir que varias transacciones accedan a

los mismos concurrentemente. La mayoría de los SGBD comerciales utilizan protocolos de bloqueo.

Otro conjunto de protocolos de control de concurrencia son los que utilizan marcas de tiempo

(timestamps). Una marca de tiempo es un identificador único que genera el sistema para cada

transacción y que las ordena en el tiempo. También existen los protocolos de control de concurrencia

multiversión, que mantienen varias versiones de cada dato, y protocolos basados en el concepto de

validación o certificación de transacciones, a los que se suele llamar protocolos optimistas.

Los usuarios escriben programas que acceden a las bases de datos para consultarlos y actua-

lizarlos utilizando los lenguajes de alto nivel que proporcionan los SGBD. Para entender cómo el

SGBD maneja estas peticiones de acceso a datos, respecto al control de la concurrencia y también

respecto a la recuperación ante fallos, hay que ver una transacción como un conjunto de lecturas y

escrituras de objetos de la base de datos:

Para leer un objeto de la base de datos, primero hay que traerlo a memoria principal desde el

disco y a continuación, se copia a la variable correspondiente del programa.

Para escribir un objeto de la base de datos, se modifica una copia suya en memoria y a

continuación se escribe en el disco.

Llamamos objeto de la base de datos a cualquier unidad de información que los programas leen

o escriben; pueden ser bloques de disco, conjuntos de registros, registros individuales, campos, etc.

En cualquier caso, esto no influye en cómo se realiza el control de la concurrencia ni la recuperación.

11.4.1. Propiedades de las transacciones

Las transacciones deben tener las siguientes propiedades:

1. Atomicidad (Atomicity). Los usuarios deben ver la ejecución de cada transacción como algo

atómico y no deben preocuparse por el efecto de las transacciones que no han llegado a terminar

cuando, por ejemplo, hay un fallo en el sistema. El responsable de mantener la atomicidad es

el subsistema de recuperación del SGBD.

2. Preservación de la consistencia (Consistency). Cuando una transacción se ejecuta de forma

aislada, sin que se ejecuten concurrentemente otras transacciones, se debe mantener la consis-

tencia de la base de datos. Los responsables de mantener esta propiedad son los programadores

de las aplicaciones que trabajan sobre la base de datos y el módulo del SGBD que se encarga

de mantener la integridad.

3. Aislamiento (Isolation). Los usuarios deben percibir sus transacciones como si se ejecutaran

de forma aislada, sin tener en cuenta el efecto de otras transacciones que se ejecuten concu-



-- 211 of 227 --



202 11.5. CONTROL DE CONCURRENCIA

rrentemente, incluso cuando el SGBD intercala las operaciones de varias transacciones para

obtener mejores prestaciones. El responsable de mantener esta propiedad es el subsistema de

control de concurrencia.

4. Durabilidad o persistencia (Durability). Cuando el SGBD informa al usuario de que su transac-

ción ha finalizado, sus efectos sobre la base de datos deben permanecer, incluso si ocurre un

fallo del sistema antes de que los cambios producidos por la transacción se hayan reflejado

sobre el disco. El responsable de mantener esta propiedad es el subsistema de recuperación

del SGBD.

Para referirse a este conjunto de propiedades se utiliza el acrónimo ACID (se dice que son las

propiedades ácidas de las transacciones).

Las transacciones pasan por varios estados:

Estado activo: se entra en este estado cuando empieza la transacción. Durante este estado se

realizan las lecturas y escrituras.

Estado de fallo: cuando estando en estado activo, falla alguna operación o cuando se aborta

la transacción una vez realizadas todas sus operaciones.

Estado confirmado: cuando después de realizar todas las operaciones, se realiza COMMIT para

hacer los cambios permanentes.

Estado finalizado: estado al que pasa la transacción después del estado confirmado o del estado

de fallo.

11.5. Control de concurrencia

El SGBD ve una transacción como una lista de acciones. Estas acciones son lecturas y escrituras

de objetos de la base de datos (R(x), W(x)). Para hacer permanentes los cambios llevados a cabo

por las acciones de una transacción ésta debe especificar como su última acción la operación de

confirmación COMMIT. Una transacción también puede abortar, lo que hace que finalice y que se

deshagan todas las acciones que ha llevado a cabo desde que empezó.

Se define un plan P de un conjunto de n transacciones T1, T2,. . . , Tn como una ordenación de

las acciones de las transacciones, con la restricción de que las acciones de cada transacción Ti deben

aparecer en P en el mismo orden en que aparecen en Ti.

Ya que la ejecución concurrente de varias transacciones permite que se intercalen sus acciones,

el control de la concurrencia consistirá en aceptar algunos planes (los que sean correctos) y rechazar



-- 212 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 203

otros. Para ver qué algoritmos se pueden utilizar para aceptar sólo planes correctos, hace falta saber

qué es un plan serie y un plan serializable.

Los planes serie son aquellos en los que las transacciones se ejecutan en serie, una tras otra

(no se intercalan sus operaciones). En un plan serie, en cada momento sólo hay una transacción

activa. Todo plan serie es correcto. Los planes no serie son los planes en los que se intercalan las

operaciones de las distintas transacciones. Un plan no serie es serializable si es equivalente a algún

plan serie de las mismas transacciones.

De lo que se trata, en el control de la concurrencia, es de encontrar planes equivalentes a algún

plan serie (planes serializables). En la práctica no se utilizan algoritmos que comprueban si los

planes son serializables. En lugar de eso se utilizan protocolos que garantizan que sólo sucederán

planes serializables, como el protocolo de bloqueo en dos fases (two–phase locking).

11.5.1. Protocolo de bloqueo en dos fases

El método de control de concurrencia más utilizado es el basado en bloqueos. Todas las lecturas y

escrituras se deben hacer de modo protegido mediante tres primitivas2: bloqueo de lectura, bloqueo

de escritura y desbloqueo.

El planificador del SGBD recibe una secuencia de peticiones de ejecución de estas primitivas

por parte de las transacciones. Durante la ejecución de las lecturas y escrituras se deben cumplir

las siguientes restricciones:

Cada lectura debe ir precedida de un bloqueo de lectura. Es un bloqueo compartido. Más

adelante habrá un desbloqueo.

Cada escritura debe ir precedida de un bloqueo de escritura. Es un bloqueo exclusivo. Más

adelante habrá un desbloqueo.

Cuando una transacción sigue estas reglas, se dice que está bien formada respecto a los bloqueos.

Normalmente, es el propio sistema quien, ante las lecturas y escrituras, solicita los bloqueos y los

libera, por lo que las transacciones están bien formadas siempre.

El planificador puede admitir o denegar una petición de bloqueo. Si se admite, se dice que el

recurso ha sido adquirido por la transacción. Si se deniega, la transacción se pone en estado de

espera. La espera termina cuando se libera el bloqueo y el recurso queda disponible.

Mediante los bloqueos se obtienen planes no serializables, por lo que se obtienen resultados

incorrectos. Hay que utilizar un protocolo que indique dónde colocar los bloqueos y desbloqueos de

2Los bloqueos binarios (bloquear/desbloquear) son demasiado restrictivos para las bases de datos ya que se debe

permitir que varias transacciones puedan leer a la vez.



-- 213 of 227 --



204 11.5. CONTROL DE CONCURRENCIA

objetos en las transacciones: es el protocolo de bloqueo de dos fases. En el protocolo básico, hay dos

fases:

Fase de crecimiento: se adquieren bloqueos y no se libera ninguno.

Fase de decrecimiento: se liberan bloqueos y no se pueden adquirir otros.

Si todas las transacciones siguen este protocolo, la serializabilidad de los planes está garantizada.

El protocolo de bloqueo de dos fases garantiza la serializabilidad, pero no permite que sucedan

todos los planes serializables posibles, es decir, algunos planes serializables no podrán tener lugar.

Además, se pueden realizar lecturas sucias: una transacción libera un bloqueo exclusivo sobre un

objeto x, otra transacción lee x y la primera transacción aborta: la segunda transacción ha visto

un valor de x que nunca ha estado ahí. Mediante el protocolo en dos fases estricto los bloqueos de

una transacción sólo se liberan cuando ésta finaliza, evitando así las lecturas sucias. Así es como

funcionan la mayoría de los SGBD comerciales. El uso de bloqueos puede causar dos problemas

adicionales, bloqueo mutuo (deadlock ) e inanición (starvation), para los que existen también técnicas

que permiten bien evitarlos o bien detectarlos. El estudio de estas técnicas se reserva para un curso

más avanzado en la materia.

11.5.2. Técnicas de ordenación por marcas de tiempo

Una alternativa al uso de bloqueos es el protocolo de ordenación por marcas de tiempo, que

garantiza la serializabilidad basándose en el orden de las marcas de tiempo de las transacciones.

Este método es más fácil de manejar pero es menos eficiente que el bloqueo en dos fases.

Una marca de tiempo (timestamp) es un identificador único de cada transacción (generado por

el sistema) y que las ordena en el tiempo (es como su instante de inicio). Los planes serializables que

genera este protocolo son equivalentes al plan serie resultante de ejecutar las transacciones según el

orden de su marca de tiempo (es decir, conforme se han ido generando).

El control de la concurrencia se lleva a cabo del siguiente modo:

A cada transacción se le asigna una marca de tiempo que representa el momento en el que

empieza.

Un plan se acepta sólo si refleja el ordenamiento serie de las transacciones basadas en el valor

de su marca de tiempo.

Cada objeto x tiene dos indicadores: la marca de tiempo de lectura RTM(x), que corresponde a la

transacción más joven que lo ha leído con éxito, y la marca de tiempo de escritura WTM(x), que

corresponde a la transacción más joven que lo ha escrito con éxito.



-- 214 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 205

El planificador utiliza la siguiente política: una transacción no puede leer ni escribir un dato

escrito por una transacción con mayor marca y no puede escribir un dato que ha sido leído por una

transacción con mayor marca. El problema de esta técnica es que se abortan muchas transacciones.

Una modificación de este método es el control de concurrencia multiversión. En este caso lo

que se hace es mantener varias copias de cada objeto de la base de datos: una copia por cada

transacción que lo modifica. Cada vez que una transacción escribe un objeto, el valor antiguo no

se borra sino que se crea una nueva copia con un WTMn(x) correspondiente. En cuanto a lectura,

hay un solo RTM(x) global. En cada momento hay n≥1 copias activas del objeto. Mediante este

método, las peticiones de lectura nunca se rechazan sino que se dirigen a la versión correcta de los

datos de acuerdo a la marca de tiempo de la transacción que hace la petición. De este modo se

mantiene la serializabilidad del plan que se está ejecutando. La idea es que algunas operaciones de

lectura que con otras técnicas serían rechazadas, se acepten leyendo una versión antigua del dato. El

inconveniente es que se requiere mucho espacio de almacenamiento. Hay bases de datos en donde es

preciso mantener varias versiones de cada dato para tener un historial de su evolución. El caso más

extremo es el de las bases de datos temporales. En estas bases de datos no existe la penalización

del espacio de almacenamiento.

11.5.3. Control de concurrencia optimista

Las técnicas vistas hasta ahora hacen las comprobaciones antes de realizar las operaciones sobre

la base de datos. Estas comprobaciones sobrecargan la transacción haciendo que sea más lenta.

Las técnicas optimistas, denominadas de validación o certificación, no hacen comprobaciones mien-

tras la transacción se ejecuta. Hay muchos esquemas que utilizan esta técnica. En uno de ellos, las

actualizaciones no se aplican sobre los objetos de la base de datos hasta que la transacción termi-

na. Las actualizaciones se aplican sobre copias locales. Al final de la transacción hay una fase de

validación en donde se comprueba si alguna de las actualizaciones violan la serializabilidad. Si se

viola, la transacción se aborta. La idea es hacer todas las comprobaciones a la vez. Si hay pocas

interferencias, muchas transacciones acabarán bien. Si hay muchas interferencias, se abortarán mu-

chas transacciones. Estas técnicas se denominan optimistas porque suponen que va a haber pocas

interferencias y que por eso no hace falta hacer comprobaciones mientras se ejecuta la transacción.

11.6. Soporte de transacciones en el estándar de SQL

En SQL, una transacción empieza automáticamente cuando un usuario realiza su primera ope-

ración de acceso a la base de datos. Las siguientes operaciones forman parte de la transacción,

que finaliza cuando se hacen los cambios permanentes mediante COMMIT o cuando la transacción se



-- 215 of 227 --



206 11.6. TRANSACCIONES EN SQL ESTÁNDAR

aborta mediante ROLLBACK.

Para cada transacción se debe poder establecer el modo de acceso y el nivel de aislamiento. Hay

dos modos de acceso:

READ ONLY: la transacción no puede modificar la base de datos, sólo puede leerlos, por lo que

sólo necesita bloqueos compartidos, aumentando así el nivel de concurrencia.

READ WRITE: la transacción puede leer y modificar datos.

El nivel de aislamiento controla hasta qué punto se expone una transacción a las acciones de

otras transacciones que se ejecutan concurrentemente, ya que dependiendo del nivel, se pueden

producir algunas de estas anomalías:

Lectura sucia: una transacción lee datos que han sido escritos por otra transacción que aún

no ha hecho COMMIT.

Lectura irrepetible: una transacción lee datos que ha leído previamente y encuentra que otra

transacción finalizada ha modificado o borrado los datos.

Lectura fantasma: una transacción vuelve a ejecutar una consulta que obtiene un conjunto de

filas y encuentra que otra transacción finalizada ha insertado filas que satisfacen su condición

de búsqueda.

La tabla siguiente muestra los distintos niveles de aislamiento y las anomalías que pueden suceder

en cada uno de ellos:

Nivel de aislamiento lectura sucia lectura irrepetible lectura fantasma

SERIALIZABLE no no no

REPEATABLE READ no no posible

READ COMMITTED no posible posible

READ UNCOMMITTED posible posible posible

En cada nivel de aislamiento se utiliza un protocolo en cuanto a los bloqueos:

SERIALIZABLE: la transacción sólo lee de transacciones finalizadas, lo que lee o escribe no lo

modifican otras transacciones hasta que ella finaliza y si la transacción lee un conjunto de

valores basándose en alguna condición de búsqueda (WHERE), se garantiza que dicho conjunto

no será cambiado por otra transacción hasta que ella finalice. Bloquea objetos y conjuntos

de objetos (por ejemplo, un conjunto de filas). Las transacciones liberan los bloqueos cuando

finalizan.



-- 216 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 207

REPEATABLE READ: la transacción sólo lee de transacciones finalizadas y lo que lee o escribe

no lo modifican otras transacciones hasta que ella finaliza (sí pueden hacer inserciones, por

lo que puede haber lectura fantasma). Bloquea objetos, pero no conjuntos de objetos. Las

transacciones liberan los bloqueos cuando finalizan.

READ COMMITTED: la transacción sólo lee de transacciones finalizadas y nada escrito por ella

puede ser modificado por otra transacción. Los bloqueos de lectura se liberan inmediatamente.

Los bloqueos de escritura los mantiene hasta que finaliza.

READ UNCOMMITTED: no obtiene ningún tipo de bloqueos. Se requiere que sea READ ONLY (no

puede escribir).

El nivel más aconsejable es el serializable pero hay transacciones que se pueden ejecutar con un

nivel de aislamiento menor. De ese modo se requieren menos bloqueos, lo que puede contribuir a

obtener mejores prestaciones. El nivel de aislamiento y el modo de acceso se puede escoger mediante

la sentencia SET TRANSACTION ISOLATION LEVEL nivel_aislam modo_acceso.

Cuando se definen reglas de integridad en el esquema de la base de datos surge una cuestión:

¿cuándo se comprueba si no se violan estas reglas? Por defecto, una regla de integridad se comprueba

después de cada sentencia SQL que puede hacer que se viole. Si se viola la regla, la sentencia se

rechaza. Sin embargo, este modo de funcionamiento es, a veces, demasiado inflexible. Por ejemplo,

cuando hay un ciclo referencial y ninguna clave ajena del ciclo acepta nulos, no es posible insertar la

primera fila a menos que se pueda retrasar la comprobación de la integridad. Para ello SQL permite

que las restricciones se comprueben de modo inmediato (INMEDIATE) o al final de la transacción

(DEFERRED).

11.7. Recuperación

En todo sistema de bases de datos existe la posibilidad de que ocurra un fallo del sistema o

un fallo en un dispositivo. Si esto sucede y afecta a la base de datos, ésta debe recuperarse. Los

objetivos, tras un fallo, son el asegurar que los efectos de las transacciones finalizadas se reflejen

sobre la base de datos recuperada y volver a encontrarse en un estado operativo tan pronto como

sea posible.

La recuperación de transacciones ante fallos normalmente significa que la base de datos se recarga

con el estado consistente más reciente en el que estuvo justo antes de producirse el fallo. Para hacer

esto, el sistema debe mantener un diario con información sobre los cambios que las transacciones

realizan sobre los datos. La estrategia típica es la siguiente:



-- 217 of 227 --



208 11.7. RECUPERACIÓN

Si el daño es físico, la base de datos se recupera a partir de la última copia de seguridad y se

rehacen todas las transacciones que habían finalizado cuando se produjo el fallo.

Si el daño no es físico, pero la base de datos está en un estado inconsistente, se deshacen las

operaciones que pueden haber causado la inconsistencia y es posible que haga falta rehacer

otras operaciones.

11.7.1. El diario

Para poder recuperarse, se mantiene un diario (system log) con todas las operaciones que se

van realizando y que afectan a los datos de la base de datos. El diario se mantiene en disco y de

él también se hacen copias de seguridad. Las entradas del diario son, en general, de los siguientes

tipos:

[idT, begin] : empieza la transacción con el identificador idT.

[idT, update, page, length, offset, old, new] : la transacción idT ha actualizado la

página page, la longitud de la actualización es length bytes, la posición el la página en la que

empieza la modificación es offset, el valor anterior de lo modificado es old y el nuevo valor

es new.

[idT, commit] : la transacción idT ha hecho COMMIT.

[idT, abort] : la transacción idT ha abortado.

La recuperación será más o menos complicada de realizar, dependiendo de dos cuestiones fun-

damentales:

¿Qué se hace cuando un bloque de datos que se encuentra en memoria, y que ha sido modificado

por una transacción T, debe ser reemplazado por otro bloque? Si se permiten los robos (steal

approach), el bloque de memoria se escribirá en disco y será reemplazado en memoria. Si no

se permiten robos, este bloque no podrá ser reemplazado hasta que T finalice.

¿Qué se hace cuando una transacción finaliza confirmando sus cambios con COMMIT? Se pueden

guardar forzosamente sus cambios sobre la base de datos (force approach) o bien se pueden

guardar los cambios más adelante, en cualquier otro momento.

Lo más simple para la recuperación es no permitir robos y forzar escrituras. Cuando se permiten

los robos, si algún bloque de una transacción T ha sido robado y T aborta, los cambios realizados

por T sobre los bloques robados se deben deshacer sobre la base de datos. Si no se permiten los

robos, esta situación nunca se dará, por lo que la recuperación será más sencilla. Por otra parte, si



-- 218 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 209

no se realiza la escritura forzosa, puede ocurrir que cuando se produzca un fallo del sistema, después

de que una transacción T haya confirmado sus cambios, pero antes de que éstos se hayan reflejado

sobre la base de datos, al volver a poner en marcha el sistema, en la recuperación debe rehacer T.

La recuperación es más sencilla si se fuerza la escritura tras cada confirmación.

Sin embargo, un sistema que no permite robos y que fuerza las escrituras, no es práctico ni

realista. Ya que la memoria es limitada, el hecho de no permitir robos limita la concurrencia. Ya

que las transacciones suelen ser de muy corta duración, el forzar la escritura provoca una cantidad

excesiva de operaciones de entrada/salida. Por lo tanto, lo más apropiado es permitir robos y no

forzar la escritura tras cada confirmación. Lo que se hará es forzar la escritura de los bloques de

memoria cada cierto tiempo. Esta escritura se debe registrar también en el diario y es lo que se

denomina checkpoint.

11.7.2. Algoritmos de recuperación

Hay varios tipos de algoritmos de recuperación:

De actualización diferida (no–undo/redo). La base de datos en disco se actualiza después

de que la transacción haya finalizado. Si una transacción falla, no hay nada que deshacer

(no–undo). Puede que haya que rehacer (redo) algunas operaciones de transacciones que han

finalizado, pero que aún no se han reflejado en disco.

De actualización inmediata (undo/redo). Se hacen actualizaciones en disco antes de que finalice

la transacción. Como también se guardan en el diario, se puede hacer recuperación. Si una

transacción falla, las operaciones se deben deshacer (undo) sobre la base de datos en disco, y

es posible que haya que rehacer (redo) algunas operaciones. Una variación de este algoritmo

hace todas las actualizaciones antes de que la transacción finalice (undo/no–redo).

El SGBD dispone de un área de memoria formada por páginas en las que se almacenan los bloques

de disco que son accedidos. La gestión de este área la realiza el SGBD llamando a rutinas del sistema

operativo. Cada página tiene una variable que indica si el bloque ha sido o no modificado (dirty).

Cuando se reemplaza un bloque, si éste ha sido modificado, hay que volver a escribirlo en disco.

Además, las páginas tienen un contador, denominado pin, que indica el número de transacciones

que han solicitado el bloque y que todavía no lo han liberado. Si no se permiten los robos, sólo se

podrá reemplazar un bloque si su contador tiene el valor cero.

11.7.3. Protocolo de escritura adelantada

Cuando se mantiene un diario para la recuperación, se debe garantizar que los bloques del diario

(que también estarán en memoria) se escriben en disco antes que los bloques de datos a los que



-- 219 of 227 --



210 11.7. RECUPERACIÓN

afectan las operaciones del diario. Es lo que se denomina write–ahead logging o protocolo de escritura

adelantada.

El subsistema de recuperación del SGBD debe mantener un listado de transacciones activas, así

como un listado de transacciones finalizadas y transacciones abortadas desde el último checkpoint.

Los checkpoint también se registran en el diario. Se registra un checkpoint cuando el sistema escribe

en la base de datos física todas las páginas del SGBD que han sido modificadas (dirty). Todas las

transacciones que hayan finalizado antes del checkpoint, no necesitan ser rehechas en caso de un fallo

del sistema porque todas sus actualizaciones se han realizado sobre la base de datos. Los checkpoint

se realizan habitualmente cada m minutos o cada t transacciones finalizadas. Estos son parámetros

del sistema que fija el administrador de la base de datos.

Hacer un checkpoint consiste en realizar las siguientes operaciones:

Suspender la ejecución de todas las transacciones.

Escribir todas las páginas modificadas en disco.

Escribir el registro de checkpoint en el diario.

Escribir el diario en disco.

Reanudar las ejecuciones de todas las transacciones.

El registro de checkpoint tiene, además, un listado de transacciones activas y su primer y último

registro en el diario (todas las entradas del diario correspondientes a una misma transacción forman

una lista enlazada).

En general, en la recuperación se realizarán las siguientes operaciones:

Deshacer todas las operaciones de actualización de las transacciones activas en el momento

del fallo, que también estaban activas en el último checkpoint.

Rehacer todas las operaciones de escritura de las transacciones finalizadas antes del fallo, que

estaban activas en el último checkpoint.

11.7.4. Recuperación ante fallos en los medios de almacenamiento

Cuando se rompe un disco, para la recuperación se utilizan las copias de seguridad de la base de

datos y las copias de seguridad de los diarios. Las copias de seguridad de los diarios se deben realizar

con más frecuencia que las de la base de datos, porque así se pueden recuperar más transacciones

desde la última copia de seguridad de la base de datos.



-- 220 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 211

11.8. Seguridad

El contenido de la base de datos de cualquier organización es un bien corporativo, por lo que se

debe proteger el valor de los datos, garantizar la privacidad y controlar el acceso.

Los objetivos a considerar al diseñar una aplicación de bases de datos segura son:

Privacidad: la información no debe estar disponible para los usuarios no autorizados.

Integridad: sólo los autorizados pueden modificar los datos.

Disponibilidad: los usuarios autorizados no deben ver denegados sus accesos.

Para conseguir estos objetivos se debe establecer una política de seguridad (qué datos proteger y

qué usuarios pueden acceder a qué datos) y utilizar los mecanismos de seguridad del SGBD para

poder seguir esta política.

Los SGBD suelen tener un subsistema de seguridad que se encarga de garantizar la seguridad

de la base de datos frente a accesos no autorizados. Esto es necesario en sistemas de bases de datos

multiusuario en los que no todos los usuarios pueden acceder a cualquier porción de la base de datos.

Hay dos tipos de control de accesos:

Control de accesos discrecional: se basa en privilegios (derechos de acceso). Un privilegio

permite a un usuario acceder a un cierto objeto de una determinada manera (lectura, modi-

ficación, etc.). Cuando un usuario crea un objeto, tiene todos los privilegios sobre él y puede

ceder estos privilegios de forma discrecional a otros usuarios. Este tipo de control es efectivo

pero tiene debilidades: se controla el acceso a los datos, pero después no se controla qué se

hace con ellos.

Control de accesos obligatorio: basado en políticas que abarcan todo el sistema y que no

pueden cambiar los usuarios individuales. Cada objeto de la base de datos tiene un nivel de

seguridad y cada usuario tiene una acreditación para cada nivel de seguridad. Se imponen

unas reglas sobre la lectura y escritura de los objetos por parte de los usuarios. Se trata de

que los datos sensibles no puedan llegar a usuarios sin la acreditación necesaria.

Un segundo problema de seguridad es prevenir que personas no autorizadas accedan al sistema,

bien para obtener información o bien para modificarla. Para restringir el acceso al sistema se realiza

un control de accesos creando cuentas con claves para los usuarios.

Un tercer problema de seguridad es el que aparece en las bases de datos estadísticas. En estas

bases de datos se puede extraer información estadística sobre la población basándose en ciertos

criterios, pero no se puede acceder a la información confidencial sobre individuos concretos. La



-- 221 of 227 --



212 11.8. SEGURIDAD

protección no es sólo sobre los datos individuales, sino también contra cierto tipo de consultas que

pueden servir para deducir ciertos aspectos individuales.

Un cuarto aspecto sobre seguridad es el cifrado de datos que se utiliza para proteger datos

sensibles, como los números de tarjetas de crédito, y que se envían a través de redes de comunicación.

El administrador de la base de datos es quien se encarga de conceder privilegios a los usuarios,

clasificando datos y usuarios según indique la política de la organización. El administrador de la

base de datos puede realizar las siguientes acciones:

Crear cuentas con claves para usuarios individuales o grupos de usuarios mediante las cuales

puedan acceder al sistema.

Conceder privilegios sobre las cuentas creadas.

Denegar (revocar) privilegios que previamente han sido concedidos.

Asignar niveles de seguridad a las distintas cuentas de usuario.

11.8.1. Control de accesos discrecional

En este apartado consideramos los sistemas de bases de datos relacionales y nos basamos en el

sistema de privilegios que se diseñó para SQL y que forma parte del estándar actual. El SGBD debe

proporcionar acceso selectivo a cada tabla de la base de datos para cada cuenta de usuario concreta.

También se deben controlar las operaciones que se pueden realizar sobre dichas tablas.

Hay dos niveles para asignar privilegios de uso del sistema de base de datos:

A nivel de cuentas de usuario: sobre cada cuenta se establecen unos privilegios independien-

temente de las tablas de la base de datos.

A nivel de las tablas: se pueden controlar los privilegios de acceso sobre cada tabla base o

cada vista de la base de datos.

A nivel de cuentas, los privilegios que se pueden conceder son:

Para crear esquemas o tablas (CREATE SCHEMA, CREATE TABLE).

Para crear vistas (CREATE VIEW).

Para cambiar el esquema añadiendo o eliminando atributos en las tablas (ALTER).

Para insertar, borrar o actualizar tuplas (INSERT, DELETE, UPDATE).

Para realizar consultas (SELECT).



-- 222 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 213

A nivel de tablas base y vistas, se especifica para cada usuario qué privilegios tiene sobre cada

una. Algunos privilegios se pueden especificar sobre atributos (columnas) de las tablas/vistas.

GRANT privilegios ON objeto TO usuarios [WITH GRANT OPTION];

Donde un objeto es una tabla base o una vista, y los privilegios pueden ser SELECT, INSERT,

UPDATE, DELETE, REFERENCES(atrib). Con INSERT y UPDATE se puede especificar una lista de atri-

butos que serán aquellos sobre los que se puede insertar y actualizar. El privilegio REFERENCES(atrib)

permite crear tablas base con claves ajenas que referencien al atributo especificado.

Cuando un usuario concede cierto permiso a otro usuario sobre alguno de sus objetos, puede

darle este permiso con la opción GRANT OPTION, lo que permite que el usuario que recibe el permiso

pueda propagar éste a otros usuarios. Se han desarrollado técnicas para limitar la propagación de

privilegios, aunque éstas todavía no han sido implementadas por los SGBD.

En el estándar de SQL los privilegios se otorgan a identificadores de autorización, que algunos

SGBD denominan roles. Una vez creados los roles por parte del administrador de la base de datos,

se puede hacer que cada usuario pertenezca a uno o varios de ellos. De este modo, se facilita la

gestión de los privilegios:

En lugar de otorgar los mismos privilegios explícitamente a distintos usuarios, se otorgan los

privilegios para un grupo de usuarios a un rol y, a continuación, se otorga el rol a esos usuarios.

Si los privilegios de un grupo deben cambiar, sólo es necesario modificar los privilegios del rol

al que pertenecen.

Se puede habilitar y deshabilitar de forma selectiva los roles otorgados a un usuario. Esto

permite controlar los privilegios de un usuario determinado ante una situación dada.

El diccionario de datos almacenará información sobre los roles existentes, por lo que se pueden

diseñar aplicaciones que consulten el diccionario y que automáticamente habiliten (o deshabi-

liten) roles selectivos cuando un usuario trata de ejecutar una aplicación mediante un nombre

de usuario determinado.

Los roles se pueden proteger mediante una palabra clave. Se pueden crear aplicaciones que,

de forma específica, habiliten un rol cuando se da la palabra clave correcta. Los usuarios no

pueden habilitar el rol si no conocen la palabra clave.

Del mismo modo que los SGBD tienen mecanismos para conceder accesos, deben tener meca-

nismos para revocarlos o denegarlos.

REVOKE [ GRANT OPTION FOR ] privilegios ON objeto FROM usuarios

{ RESTRICT | CASCADE };



-- 223 of 227 --



214 11.8. SEGURIDAD

Con CASCADE, si se quitan los privilegios al usuario X, quedan abandonados los privilegios conce-

didos por X cuando tenía el privilegio con WITH GRANT OPTION. Todos los privilegios que quedan

abandonados son también revocados y así sucesivamente. Con RESTRICT no se revoca el privilegio

si ello provoca que queden privilegios abandonados.

El SGBD mantiene una tabla de privilegios en el diccionario de datos que contiene quién da

cada privilegio, quién lo recibe, el privilegio concedido y si se concede WITH GRANT OPTION. Para

realizar un manejo correcto de las cancelaciones de los privilegios, se pueden dibujar grafos de

autorizaciones, en donde cada nodo es un rol o un usuario y hay un arco por cada privilegio que

se ha concedido. Además hay un nodo denominado sistema del que salen arcos a los nodos que han

creado los objetos (es como si el sistema les hubiera concedido los privilegios que tienen sobre sus

objetos, con la diferencia que no se los pueden revocar). Cuando un usuario A revoca un privilegio

concedido al usuario B, se elimina del grafo el arco que hay de A a B. Esto puede provocar que

queden arcos abandonados, por lo que otros privilegios también serán revocados en consecuencia.

Los únicos arcos que perduran son los que hacen que se cumpla la siguiente afirmación: si un nodo

N tiene arcos de salida, hay un camino del nodo sistema a N con el mismo privilegio y con WITH

GRANT OPTION.

Cuando un usuario recibe privilegios de otros, estos privilegios se tratan como si se hubieran

recibido antes de que él pase ningún otro privilegio a un tercero. Por ejemplo, el usuario A otorga

un privilegio determinado al usuario B, con la opción de propagarlo (WITH GRANT OPTION). A con-

tinuación, el usuario B otorga ese mismo privilegio a C y C, a su vez, se lo otorga a B (siempre

con la opción de propagarlo). Después de esto, el usuario A otorga también el privilegio a C y se

lo revoca a B. Como B ha recibido ese mismo privilegio también de C, y C goza aún del privilegio

otorgado por A, el usuario B no pierde el privilegio, aunque lo recibió de C después de pasárselo a

C él mismo. Sólo si A también lo revoca a C, ambos B y C perderán el privilegio.

11.8.2. Vistas

Mediante las vistas se puede hacer que ciertos usuarios vean solamente ciertos campos o ciertas

filas de una tabla, de modo que las vistas también proporcionan un mecanismo de seguridad adi-

cional: los datos ocultos al usuario mediante la vista no son accesible por él. Por otra parte, cuando

un usuario crea una vista:

Debe tener permiso SELECT sobre todas las tablas sobre las que se define la vista y, por lo

tanto, tendrá permiso SELECT sobre ella.

Podrá pasar el permiso SELECT a otros usuarios si ha recibido dicho permiso con WITH GRANT

OPTION sobre todas las tablas que consulta la vista.



-- 224 of 227 --



### CAPÍTULO 11. SISTEMAS DE GESTIÓN DE BASES DE DATOS 215

Si la vista es actualizable y el usuario tiene privilegios para actualizar las tablas en las que se

basa, entonces también tendrá dichos privilegios sobre la vista.

Cuando un usuario recibe permiso SELECT sobre una vista, puede consultarla pero no puede consultar

directamente las tablas en las que se se basa.

Una vista puede ser eliminada si el creador pierde el privilegio SELECT sobre alguna de las tablas

en las que se basa. Por ejemplo, el usuario A posee la tabla T y concede el privilegio SELECT sobre

T al usuario B. El usuario B crea la vista V1 sobre T y concede el privilegio SELECT al usuario C

sobre V1. A continuación el usuario C crea la vista V2 sobre V1. Si A revoca el privilegio concedido

a B, las vistas V1 y V2 son eliminadas del sistema automáticamente (dejan de existir).

Por otra parte, si se ganan privilegios sobre las tablas, se ganan sobre la vista. Por ejemplo,

siguiendo con el caso anterior, el usuario A concede el privilegio SELECT sobre T al usuario B, éste

crea la vista V1 sobre T y concede el privilegio SELECT al usuario C sobre V1. A continuación el

usuario C crea la vista V2 sobre V1. Si A concede el privilegio INSERT sobre T a B,

si es sin opción de ceder el privilegio, entonces B adquiere el privilegio INSERT sobre V1 pero

no puede cederlo a C;

si es con opción de ceder el privilegio, entonces B adquiere el privilegio INSERT sobre V1 y

puede cederlo a C.

11.8.3. Control de accesos obligatorio

El control de accesos discrecional tiene algunas deficiencias. Una de ellas es que se pueden

introducir caballos de troya. Un caballo de troya es una aplicación que normalmente realiza algo

útil y que además, sin que el usuario lo sepa, se dedica a extraer datos de la base de datos, poniéndolos

a disposición de usuarios no autorizados. Por ejemplo, un usuario A crea una tabla T1. Este usuario

da permiso al usuario B para que pueda realizar inserciones sobre T1. Sin que B lo sepa, A tiene

acceso al código de la aplicación que maneja B e introduce en ella el caballo de troya: desde la

aplicación, que será ejecutada por B, se copian datos de la tabla T2 a la que B tiene acceso, en

la tabla T1 de A, que es un usuario no autorizado a acceder a T2. De este modo, un usuario no

autorizado tiene acceso a los datos porque ha conseguido que un usuario autorizado se los haga

llegar.

El control de accesos discrecional es el que se ha venido utilizando en los sistemas relacionales.

Este es un método de todo o nada: un usuario tiene o no tiene un cierto permiso. En muchas

aplicaciones hace falta una política de seguridad adicional para clasificar datos y usuarios basándose

en clases o niveles de seguridad, de manera que además de controlarse el acceso a los datos, se

controla lo que se hace después con ellos.



-- 225 of 227 --



216 11.8. SEGURIDAD

La mayoría de los SGBD no proporcionan mecanismos para realizar este tipo de control, aunque

es necesario en cierto tipo de aplicaciones. Las clases o niveles típicos de seguridad son alto secreto

(AS), secreto (S), confidencial (C) y no clasificado (N), donde AS ≥ S ≥ C ≥ N.

El modelo que se suele utilizar para el control de accesos obligatorio es el modelo Bell–LaPadula.

En este modelo se clasifica cada sujeto (usuario, cuenta, programa) y objeto (tabla, fila, columna,

vista, operación) en uno de los niveles de seguridad (AS, S, C, N). Nos referimos a la clasificación

del sujeto S como nivel(S) y a la del objeto O como nivel(O). En el modelo hay dos restricciones

que se deben cumplir en el acceso a los datos:

Propiedad de seguridad simple: el sujeto S puede leer el objeto O sólo si nivel(S)≥nivel(O).

Propiedad *: el sujeto S puede escribir el objeto O sólo si nivel(S)≤nivel(O) (no se puede

escribir un objeto O y darle una clasificación menor que la que el sujeto posee, así se evita

que, por ejemplo, un usuario lea un objeto de AS y lo escriba como N, ya que así dejaría ver

a todos algo que es alto secreto).

Veamos cómo se evitan de este modo los caballos de Troya siguiendo con el ejemplo con el que

hemos empezado este apartado. En este ejemplo, los niveles asignados podrían ser: nivel(B)=S,

nivel(T2)=S y nivel(A)=C. El usuario A sólo puede crear objetos con nivel C o menor, por lo que

nivel(T1)≤C. Cuando la aplicación que maneja B intenta escribir en T1 los datos de T2 el sistema

no permite la operación, ya que nivel(B)>nivel(T1).

Mediante el control de accesos obligatorio se tienen políticas que en muchas ocasiones se consi-

deran demasiado rígidas, por lo que lo normal es combinar ambos controles de acceso.



-- 226 of 227 --



Bibliografía

[1] C. Batini, S. Ceri, S.B. Navathe (1994)

Diseño Conceptual de Bases de Datos. Un enfoque de entidades–interrelaciones. Addison–

Wesley / Díaz de Santos.

[2] M. Celma, J.C. Casamayor, L. Mota (2003)

Bases de Datos Relacionales. Pearson – Prentice Hall.

[3] T. Connolly, C. Begg, A. Strachan (1998)

Database Systems. A Practical Approach to Design, Implementation and Management. Segunda

edición. Addison–Wesley.

[4] C.J. Date (1995)

An Introduction to Database Systems. Sexta Edición. Addison–Wesley.

[5] R. Elmasri, S.B. Navathe (2002)

Fundamentos de Sistemas de Bases de Datos.

Tercera Edición. Addison–Wesley.

[6] M.J. Hernández (1997)

Database Design for Mere Mortals.

Addison–Wesley Developers Press

[7] R. Ramakrishnan, J. Gehrke (2003)

Database Management Systems. Tercera Edición. McGraw–Hill

217



-- 227 of 227 --