# MC_AA2_Que_es_base_dato_relacional
> Convertido de PDF | 5/7/2026, 12:08:16 p. m.

¿Que es una base de datos relacional?

Prof. Enrique M. Suárez MS

(agosto 2008)

Una base de datos relacional es una base de datos que cumple con el modelo relacional, el cual

es el modelo más utilizado en la actualidad para implementar bases de datos ya planificadas.

Permiten establecer interconexiones (relaciones) entre los datos (que están guardados en tablas),

y a través de dichas conexiones relacionar los datos de ambas tablas, de ahí proviene su nombre:

"Modelo Relacional". Tras ser postuladas sus bases en 1970 por Edgar Frank Codd, de los

laboratorios IBM en San José (California), no tardó en consolidarse como un nuevo paradigma.

Características

Una base de datos relacional se compone de varias tablas o relaciones.

No pueden existir dos tablas con el mismo nombre ni registro.

Cada tabla es a su vez un conjunto de registros (filas y columnas).

La relación entre una tabla padre y un hijo se lleva a cabo por medio de las claves primarias y

ajenas (o foráneas).

Las claves primarias son la clave principal de un registro dentro de una tabla y éstas deben

cumplir con la integridad de datos.

Las claves ajenas se colocan en la tabla hija, contienen el mismo valor que la clave primaria del

registro padre; por medio de éstas se hacen las relaciones.

Elementos

Relaciones base y derivadas

En una base de datos relacional, todos los datos se almacenan y se accede a ellos por medio de

relaciones. Las relaciones que almacenan datos son llamadas "relaciones base" y su

implementación es llamada "tabla". Otras relaciones no almacenan datos, pero son calculadas al

aplicar operaciones relacionales. Estas relaciones son llamadas "relaciones derivadas" y su

implementación es llamada "vista" o "consulta". Las relaciones derivadas son convenientes ya

que expresan información de varias relaciones actuando como si fuera una sola.



-- 1 of 5 --



Restricciones

Una restricción es una condición que obliga el cumplimiento de ciertas condiciones en la base de

datos. Algunas no son determinadas por los usuarios, sino que son inherentemente definidas por

el simple hecho de que la base de datos sea relacional. Algunas otras restricciones las puede

definir el usuario, por ejemplo, usar un campo con valores enteros entre 1 y 10.

Las restricciones proveen un método de implementar reglas en la base de datos. Las restricciones

restringen los datos que pueden ser almacenados en las tablas. Usualmente se definen usando

expresiones que dan como resultado un valor booleano, indicando si los datos satisfacen la

restricción o no.

Las restricciones no son parte formal del modelo relacional, pero son incluidas porque juegan el

rol de organizar mejor los datos. Las restricciones son muy discutidas junto con los conceptos

relacionales.

Dominios

Un dominio describe un conjunto de posibles valores para cierto atributo. Como un dominio

restringe los valores del atributo, puede ser considerado como una restricción. Matemáticamente,

atribuir un dominio a un atributo significa "todos los valores de este atributo deben de ser

elementos del conjunto especificado".

Distintos tipos de dominios son: enteros, cadenas de texto, fecha,no procedurales etc.

Clave única

Cada tabla puede tener uno o más campos cuyos valores identifican de forma única cada registro

de dicha tabla, es decir, no pueden existir dos o más registros diferentes cuyos valores en dichos

campos sean idénticos. Este conjunto de campos se llama clave única.

Pueden existir varias claves únicas en una determinada tabla, y a cada una de éstas suele

llamársele candidata a clave primaria.

Clave primaria

Una clave primaria es una clave única elegida entre todas las candidatas que define

unívocamente a todos los demás atributos de la tabla, para especificar los datos que serán

relacionados con las demás tablas. La forma de hacer esto es por medio de claves foráneas.

Sólo puede existir una clave primaria por tabla y ningún campo de dicha clave puede contener

valores NULL.



-- 2 of 5 --



Clave foránea

Una clave foránea es una referencia a una clave en otra tabla, determina la relación existente en

dos tablas. Las claves foráneas no necesitan ser claves únicas en la tabla donde están y sí a donde

están referenciadas.

Por ejemplo, el código de departamento puede ser una clave foránea en la tabla de empleados. Se

permite que haya varios empleados en un mismo departamento, pero habrá uno y sólo un

departamento por cada clave distinta de departamento en la tabla de empleados.

Clave índice

Las claves índice surgen con la necesidad de tener un acceso más rápido a los datos. Los índices

pueden ser creados con cualquier combinación de campos de una tabla. Las consultas que filtran

registros por medio de estos campos, pueden encontrar los registros de forma no secuencial

usando la clave índice.

Las bases de datos relacionales incluyen múltiples técnicas de ordenamiento, cada una de ellas es

óptima para cierta distribución de datos y tamaño de la relación.

Los índices generalmente no se consideran parte de la base de datos, pues son un detalle

agregado. Sin embargo, las claves índices son desarrolladas por el mismo grupo de

programadores que las otras partes de la base de datos.

Procedimientos almacenados

Un procedimiento almacenado es código ejecutable que se asocia y se almacena con la base de

datos. Los procedimientos almacenados usualmente recogen y personalizan operaciones

comunes, como insertar un registro dentro de una tabla, recopilar información estadística, o

encapsular cálculos complejos. Son frecuentemente usados por un API por seguridad o

simplicidad.

Los procedimientos almacenados no son parte del modelo relacional, pero todas las

implementaciones comerciales los incluyen.

Estructura

La base de datos se organiza en dos marcadas secciones; el esquema y los datos (o instancia).

El esquema es la definición de la estructura de la base de datos y principalmente almacena los

siguientes datos:

El nombre de cada tabla

El nombre de cada columna

El tipo de dato de cada columna

La tabla a la que pertenece cada columna



-- 3 of 5 --



Las bases de datos relacionales pasan por un proceso al que se le conoce como normalización, el

resultado de dicho proceso es un esquema que permite que la base de datos sea usada de manera

óptima.

Los datos o instancia es el contenido de la base de datos en un momento dado. Es en sí, el

contenido de todos los registros.

Manipulación de la información

Para manipular la información utilizamos un lenguaje relacional, actualmente se cuenta con dos

lenguajes formales el álgebra relacional y el cálculo relacional. El álgebra relacional permite

describir la forma de realizar una consulta, en cambio, el cálculo relacional sólo indica lo que se

desea devolver.

El lenguaje más común para construir las consultas a bases de datos relacionales es SQL

(Structured Query Language), un estándar implementado por los principales motores o sistemas

de gestión de bases de datos relacionales.

En el modelo relacional los atributos deben estar explícitamente relacionados a un nombre en

todas las operaciones, en cambio, el estándar SQL permite usar columnas sin nombre en

conjuntos de resultados, como el asterisco taquigráfico (*) como notación de consultas.

Al contrario del modelo relacional, el estándar SQL requiere que las columnas tengan un orden

definido, lo cual es fácil de implementar en una computadora, ya que la memoria es lineal.

Es de notar, sin embargo, que en SQL el orden de las columnas y los registros devueltos en cierto

conjunto de resultado nunca está garantizado, a no ser que explícitamente sea especificado por el

usuario.

Manejadores de base de datos relacionales

Existe software exclusivamente dedicado a tratar con bases de datos relacionales. Este software

se conoce como SGBD (Sistema de Gestión de Base de Datos relacional) o RDBMS (del inglés

Relational Database Management System).

Entre los gestores o manejadores actuales más populares encontramos: MySQL, PostgreSQL,

Oracle, DB2, INFORMIX, Interbase, FireBird, Sybase y Microsoft SQL Server.

Ventajas y desventajas

Ventajas

Provee herramientas que garantizan evitar la duplicidad de registros.

Garantiza la integridad referencial, así, al eliminar un registro elimina todos los registros

relacionados dependientes.

Favorece la normalización por ser más comprensible y aplicable.



-- 4 of 5 --



Desventajas

Presentan deficiencias con datos gráficos, multimedia, CAD y sistemas de información

geográfica.

No se manipulan de forma manejable los bloques de texto como tipo de dato.

Las bases de datos orientadas a objetos (BDOO) se propusieron con el objetivo de satisfacer las

necesidades de las aplicaciones anteriores y así, complementar pero no sustituir a las bases de

datos relacionales.

Diseño de las bases de datos relacionales

El primer paso para crear una base de datos, es planificar el tipo de información que se quiere

almacenar en la misma, teniendo en cuenta dos aspectos: la información disponible y la

información que necesitamos.

La planificación de la estructura de la base de datos, en particular de las tablas, es vital para la

gestión efectiva de la misma. El diseño de la estructura de una tabla consiste en una descripción

de cada uno de los campos que componen el registro y los valores o datos que contendrá cada

uno de esos campos.

Los campos son los distintos tipos de datos que componen la tabla, por ejemplo: nombre,

apellido, domicilio. La definición de un campo requiere: el nombre del campo, el tipo de campo,

el ancho del campo, etc.

Los registros constituyen la información que va contenida en los campos de la tabla, por

ejemplo: el nombre del paciente, el apellido del paciente y la dirección de este. Generalmente los

diferentes tipos de campos que se pueden almacenar son los siguientes: Texto (caracteres),

Numérico (números), Fecha / Hora, Lógico (informaciones lógicas si/no, verdadero/falso, etc.),

imágenes.

En resumen, el principal aspecto a tener en cuenta durante el diseño de una tabla es determinar

claramente los campos necesarios, definirlos en forma adecuada con un nombre especificando su

tipo y su longitud.



-- 5 of 5 --