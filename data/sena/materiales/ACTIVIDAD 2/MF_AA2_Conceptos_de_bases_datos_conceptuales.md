# MF_AA2_Conceptos_de_bases_datos_conceptuales
> Convertido de PDF | 5/7/2026, 12:08:16 p. m.

1

Conceptos de bases de

datos conceptuales



-- 1 of 14 --



Tabla de contenido

### Introducción .................................................................................................................. 4

Mapa conceptual ........................................................................................................... 5

1.Base de Datos Relacional (BDR)............................................................................... 6

2.Modelo Entidad - Relación (E-R) ............................................................................. 10

2.1 Elementos de un modelo Entidad - Relación (E-R) ................................................. 10

2.1.1 Entidad ............................................................................................................... 10

2.1.2 Atributos ............................................................................................................. 10

2.1.3 Relación .............................................................................................................. 10

2.1.4 Llaves o claves ................................................................................................... 12

Referentes bibliográficos ........................................................................................... 13

Créditos........................................................................................................................ 14



-- 2 of 14 --



Lista de figuras

Figura 1. Mapa conceptual .............................................................................................. 5

Figura 2. Modelo relación ................................................................................................ 6

Figura 3. Modelo relación Clientes .................................................................................. 7

Figura 4. Modelo relación Estudiantes ............................................................................ 8

Figura 5. Dominio ............................................................................................................ 8

Figura 6. Relación .......................................................................................................... 8

Figura 7. Tipo relación uno a uno .................................................................................. 11

Figura 8. Tipo relación uno a varios o varios a uno ....................................................... 11

Figura 9. Tipo relación varios a varios........................................................................... 12



-- 3 of 14 --



4

Introducción

La Base de Datos Relacional (BDR) y el modelo Entidad-Relación (E-R) son las

herramientas más utilizadas en la actualidad, a través de este modelo, se puede

organizar la información sobre personas u objetos, clientes y productos, con el fin de

mantener y actualizar la información, a medida que va creciendo el volumen de los

datos.



-- 4 of 14 --



5

Mapa conceptual

En el mapa conceptual que se comparte a continuación, se evidencia la interrelación

temática del contenido que se plantea en este material de formación:

Figura 1. Mapa conceptual

Fuente: SENA (2019)



-- 5 of 14 --



6

1. Base de Datos Relacional (BDR)

Una base de datos relacional es un conjunto de tablas que se encuentra relacionado

entre sí a través de los atributos, cada tabla está compuesta por columnas y filas.

Características:

 Está compuesta de varias tablas que se relacionan a través de una llave primaria

(PK).

 Existe una llave primaria (PK) para cada tabla.

 Las tablas tienen un nombre el cual no se puede repetir, es único para cada tabla.

Columnas: van de arriba hacia abajo, se conoce como campo o atributo y describe el

tipo de dato que va a contener, que puede ser: texto, números o fechas.

Filas: van de izquierda a derecha, se conoce como tupla. Los valores que almacena

una tupla se determinan de acuerdo a los atributos.

Figura 2. Modelo relación

Fuente: SENA (2019)



-- 6 of 14 --



7

Ejemplo:

En un almacén de ropa para dama existe una base de datos con la siguiente

información:

Figura 3. Modelo relación Clientes

Fuente: SENA (2019)

Análisis de la tabla de clientes

Las columnas están identificando a los atributos del cliente como son: nombre, apellido,

cédula, dirección y teléfono.

En las filas están almacenados los registros o tupla que tienen relación con los

atributos de la tabla.

Dominio: son las reglas de valores de los atributos, esto con el fin de determinar un

número de caracteres o los posibles registros que se puedan almacenar en un campo.



-- 7 of 14 --



8

Ejemplo:

Figura 4. Modelo relación Estudiantes

Fuente: SENA (2019)

Definición del dominio para cada atributo

Figura 5. Dominio

Fuente: SENA (2019)

Relación: vínculo o conexión que hay entre los datos de una tupla.

Ejemplo:

Figura 6. Relación

Fuente: SENA (2019)



-- 8 of 14 --



9

La relación de la tupla: nombre: Amparo, apellido: Ruiz, cédula: 2705232, dirección:

AV Boyacá, teléfono: 3025023551.

Llave primaria (PK): atributo único e irrepetible en una tabla o entidad, los ejemplos

más particulares son: identificación personal, cédula, placa de un vehículo, cod_de

estudiante, cod_materia.



-- 9 of 14 --



10

2. Modelo Entidad - Relación (E-R)

Es un modelo de base de datos, que permite diseñar esquemas o diagramas a un

sistema de información formado por un grupo de objetos llamados entidades, este

diagrama toma el nombre de Diagrama Entidad-Relación, el cual ayudará a entender la

relación que existe entre los objetos que componen las tablas.

2.1 Elementos de un modelo Entidad - Relación (E-R)

2.1.1 Entidad

Es uno de los elementos más importantes, ya que representa los objetos que pueden

ser reales o abstractos y que permiten diferenciarse unos de otros. Una entidad se

representa mediante un rectángulo.

2.1.2 Atributos

Definen las características o propiedades y aportan información a cada identidad, son

de diferentes tipos. De acuerdo a la identidad, por ejemplo: tipo fecha, tipo numérico o

tipo texto. Un atributo se representa mediante un óvalo.

2.1.3 Relación

Son los vínculos que existen entre entidades, para esto es necesario que varias

entidades compartan ciertos atributos para establecer vínculos entre ellas. Una relación

se representa mediante un rombo. La cantidad de relaciones que puede tener una

entidad se conoce como cardinalidad.



-- 10 of 14 --



11

Existen algunos tipos de relaciones de acuerdo a cómo se relacionan las entidades:

Relación uno a uno: relación existente entre dos entidades, es únicamente con una

entidad y viceversa.

Representación gráfica

Figura 7. Tipo relación uno a uno

Fuente: SENA (2019)

Relación uno a varios o varios a uno: este tipo de relación existe cuando un registro

de una entidad A se encuentra relacionado con varios registros de otra entidad B, pero

con la condición de que la entidad B solo se relaciona con la entidad A.

Representación gráfica

Figura 8. Tipo relación uno a varios o varios a uno

Fuente: SENA (2019)



-- 11 of 14 --



12

Relación varios a varios: esta relación existe entre entidades cuando varios registros

de la entidad A están relacionados con varios registros de la entidad B.

Representación gráfica

Figura 9. Tipo relación varios a varios

Fuente: SENA (2019)

2.1.4 Llaves o claves

Es un atributo especial dentro de una entidad que posee único valor, sirve para vincular

una relación entre registros de varias tablas.

Tipos de llaves o claves

Clave primaria: es un atributo único en una entidad que identifica un registro. Ejemplo:

número de cédula, placa de un automóvil, número de historia clínica de un paciente,

entre otros.

Clave foránea: son los atributos que permiten relacionar las entidades.

Clave índice: son atributos especiales que permiten tener accesos rápidos a los datos,

ya que facilitan hacer filtros para las consultas.



-- 12 of 14 --



13

Referentes bibliográficos

Blázquez, M. (2014, febrero 11). Fundamentos y Diseño de Bases de Datos [Web log

post]. Recuperado de http://ccdoc-

basesdedatos.blogspot.com/2014/02/concepto-definicion-y-aspectos-

basicos.html

Universidad de Murcia. (2006). Bases de datos relacionales. Recuperado de

https://www.um.es/geograf/sigmur/temariohtml/node63_mn.html



-- 13 of 14 --



14

Créditos

Gestor del proceso de recursos digitales

Juan Bautista Londoño Pineda

Responsable de producción y creación

Jhoana Andrea Vásquez Gómez

Evaluador de calidad instruccional

Erika Alejandra Beltrán Cuesta

Desarrollador de contenidos

Olga Elena Meneses Camino

E-pedagogo instruccional

Juan Carlos Ramírez Molina

Evaluador de contenidos

Claudia Marcela Peña Galeano

Desarrollador Full-Stack

Daniel Enciso Arias

Francisco José Lizcano Reyes

Germán Alberto Rodríguez Liévano

Leyson Fabián Castaño Pérez

Luis Felipe Zapata Castaño

Luis Gabriel Urueta Álvarez

Creativo de recursos didácticos

Carlos Andrés Díaz Botero

Cristian Andrés Osorio Caiza

Jessica Orozco Salazar

Maira Camila Olmos Hernández

Melissa Ochoa Alvarado

Centro Agroindustrial - Regional Quindío

Centro Agropecuario - Regional Risaralda

2019



-- 14 of 14 --