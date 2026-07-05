# MF_AA3_Reglas_para_la_normalizacion_de_una_base_de_datos
> Convertido de PDF | 5/7/2026, 12:08:17 p. m.

Reglas para la

normalización en una base

de datos



-- 1 of 17 --



Tabla de contenido

### Introducción .................................................................................................................. 5

Mapa conceptual ........................................................................................................... 6

1. Conceptos básicos ................................................................................................... 7

1.1 Normalización ........................................................................................................... 7

1.2 Reglas de normalización ........................................................................................... 7

1.2.1 La primera forma normal (1FN) .............................................................................. 8

1.2.2 Segunda forma normal (2NF) ................................................................................. 9

1.2.3 Tercera forma normal (3NF) ................................................................................. 11

2. Modelo Entidad Relación (E-R) .............................................................................. 14

Referentes bibliográficos ........................................................................................... 16

Créditos........................................................................................................................ 17



-- 2 of 17 --



Lista de figuras

Figura 1. Mapa conceptual .............................................................................................. 6

Figura 2. Creación de nuevas tablas ............................................................................. 11

Figura 3. Nuevas tablas (3FN) ...................................................................................... 12

Figura 4. Tabla Estudiantes normalizada ...................................................................... 13

Figura 5. Diagrama E-R ................................................................................................ 15



-- 3 of 17 --



Lista de tablas

Tabla 1. Primera forma normal (1FN).............................................................................. 8

Tabla 2. Estudiantes........................................................................................................ 9

Tabla 3. Materia .............................................................................................................. 9

Tabla 4. Materia/Segunda forma normal (2FN) ............................................................. 10

Tabla 5. Estudiante/Tercera forma normal (3FN) .......................................................... 12

Tabla 6. Componentes E-R ........................................................................................... 14



-- 4 of 17 --



5

Introducción

En este material se expone a los aprendices los conceptos de reglas de normalización

para bases de datos, los cuales podrán ser aplicados dentro de una organización, de

igual manera, estarán en la capacidad de diseñar una base de datos.



-- 5 of 17 --



6

Mapa conceptual

En el mapa conceptual que se comparte a continuación, se evidencia la interrelación

temática del contenido que se plantea en este material de formación:

Figura 1. Mapa conceptual

Fuente: SENA (2019)



-- 6 of 17 --



7

1. Conceptos básicos

1.1 Normalización

Las bases de datos están compuestas por información que se relaciona entre sí, esto

lleva a que, al momento de crear bases de datos relacionales, se debe establecer una

serie de reglas que garantice que los datos no se repitan, que estén siempre

actualizadas las tablas que la componen y asegure la integridad de la información, en

otras palabras, es necesario normalizar la base de datos.

La normalización de la base de datos consiste en aplicar reglas con el fin de cumplir

tres objetivos:

 Evitar que la información en la base de datos sea duplicada.

 Evitar problemas al momento de alimentar y actualizar la información de la base de

datos.

 Cumplir con las políticas de seguridad como es la integridad de los datos.

1.2 Reglas de normalización

Para garantizar que la base de datos se encuentra normalizada se debe cumplir con

tres reglas básicas:



-- 7 of 17 --



8

1.2.1 Primera forma normal (1FN)

Hay que garantizar que los campos sean únicos, lo que en normalización se llama

atómico, que permita crear tablas individuales. La tabla primera debe contener la llave

primaria con la que se va a relacionar con los otros campos y, por último, se deben

eliminar todos los datos repetidos.

Ejemplo 1:

Para entender mejor cómo se aplica 1FN se utilizará una base de datos Estudiantes:

Estudiantes

Tabla 1. Primera forma normal (1FN)

Cod_

estudiante

Nombre Apellido Dirección Teléfono Nom_materia Cod_

materia

Carrera

123 Jaime Ramos Cr 2 15-8 3129518795 Física 789 Sistemas

123 Jaime Ramos Cr 2 15-8 3129518795 Inglés 951 Sistemas

123 Jaime Ramos Cr 2 15-8 3129518795 Matemáticas 357 Sistemas

369 Andrea Oliveros Cr 3 12-

36

3258796128 Física 789 Medicina

259 Luz Páez Cl 4 29-1 3108942501 Física 789 Informática

Fuente: SENA (2019)

Primero se realiza el análisis de la tabla:

Se puede observar que en el atributo Cod_estudiante, nombre, apellido, dirección y

teléfono se encuentran registros repetidos, por lo tanto, existe redundancia. Lo cual

conlleva a ocupar mucho espacio.

Se aplicará la primera forma normal:



-- 8 of 17 --



9

Se definirá una clave primaria (PK) que es un atributo que puede relacionar una o más

tablas, para el ejemplo sería Cod_estudiante con el cual se van a relacionar dos tablas:

Estudiante y Materias así:

Tabla 2. Estudiante

Cod_

estudiante

Nombre Apellido Dirección Teléfono Nom_materia Cod_

carrera

123 Jaime Ramos Cr 2 15-8 3129518795 Sistemas 312

369 Andrea Oliveros Cr 3 12-36 3258796128 Medicina 316

259 Luz Páez Cl 4 29-1 3108942501 Informática 326

Fuente: SENA (2019)

Tabla 3. Materia

Fuente: SENA (2019)

Después de haber aplicado 1FN a la tabla Estudiante, se puede verificar que los

registros son atómicos y que no se han modificado ni eliminado, en conclusión, se

cumple con los objetivos de 1FN.

1.2.2 Segunda forma normal (2FN)

Para continuar con la aplicación de la 2FN, la base de datos, necesariamente, debe

haber pasado por 1FN.

Para empezar a entender 2FN, se deben tratar los términos de dependencia funcional y

la dependencia transitiva.

Cod_

estudiante

Nom_materia Cod_

materia

123 Física 780

123 Inglés 782

123 Matemáticas 783

369 Física 780

259 Alemán 789



-- 9 of 17 --



10

Dependencia funcional: dependencia que existe entre atributos a través de una llave

primaria (PK), sin esta los otros atributos no pueden existir.

Dependencia transitiva: dependencia entre atributos con la llave primaria (PK), se

mantiene a través de otros atributos de forma transitoria.

Los objetivos de la segunda forma normal consisten en:

 Determinar las dependencias de las tablas obtenidas en 1FN.

 Crear tablas con las claves primarias (PK) de las cuales dependen.

Tabla 4. Materia/Segunda forma normal (2FN)

Fuente: SENA (2019)

La tabla Materia está compuesta por los atributos Cod_estudiante, Nom_materia y

Cod_materia, por lo tanto, se puede concluir que el atributo Nom_materia no puede

existir sin el atributo Cod_materia, existe una dependencia funcional y el

Cod_estudiante no afecta en nada al atributo materia, en consecuencia, se podrían

crear dos tablas de la siguiente manera:

Cod_

estudiante

Nom_materia Cod_

materia

123 Física 780

123 Inglés 782

123 Matemáticas 783

369 Física 780

259 Alemán 789



-- 10 of 17 --



11

Figura 2. Creación de nuevas tablas

Fuente de imágenes: SENA (2019)

De la tabla Materias, se generaron dos tablas (Materia y Codigo_es) que se encuentran

relacionadas con Cod_materia.

Hasta aquí se lleva la tabla Estudiante normalizada en 2FN.

1.2.3 Tercera forma normal (3FN)

Los objetivos de esta forma 3FN son:

 Determinar las dependencias que existen en los atributos con las claves no

primarias.

 Crear nuevas tablas de acuerdo a las dependencias encontradas.



-- 11 of 17 --



12

Tabla 5. Estudiante/Tercera forma normal (3FN)

Cod_

estudiante

Nombre Apellido Dirección Teléfono Nom_carrera Cod_

carrera

123 Jaime Ramos Cr 2 15-8 3129518795 Sistemas 312

369 Andrea Oliveros Cr 3 12-36 3258796128 Medicina 316

259 Luz Páez Cl 4 29-1 3108942501 Informática 326

Fuente: SENA (2019)

La tabla Estudiante tiene el atributo carrera que tiene una dependencia transitoria con

el Cod_estudiante, por lo tanto, carrera puede generar una tabla nueva.

Figura 3. Nuevas tablas (3FN)

Fuente de figuras: SENA (2019)

Se han generado dos tablas nuevas que se encuentran relacionadas con el atributo

Cod_carrera.



-- 12 of 17 --



13

En conclusión, la tabla Estudiante quedó normalizada así:

Figura 4. Tabla Estudiantes normalizada

Fuente de figuras: SENA (2019)

Se puede analizar que cada tabla tiene llaves primarias que aseguran que los registros

allí almacenados serán únicos, con esto se evita la redundancia y pérdida de

información, los datos se encuentran relacionados.



-- 13 of 17 --



14

2. Modelo Entidad Relación (E-R)

Peter Chen crea en 1976 una herramienta que permite representar, gráficamente y de

manera lógica, información involucrada en una base datos, al mismo tiempo, describe

las relaciones y restricciones existentes en las entidades que la componen.

Componentes de diagrama Entidad-Relación

Tabla 6. Componentes E-R

Entidad: se define como un objeto, persona o

concepto, que va ser gestionado en la base de

datos. Se representa gráficamente por un

rectángulo.

Atributo: describe algunas propiedades de la

entidad. Se representa gráficamente por un ovalo.

Relación: es el conector que existe entre una o

más entidades, se representa por un rombo.

Conector: define un vínculo entre las identidades.

Se representanta mediante una línea.

Fuente: SENA (2019)

Cardinalidad o mapeo: hace referencia al tipo de relación que existe entre entidades.

Estas son:

 Uno a uno: a cada elemento de una entidad le corresponde un solo elemento de la

otra entidad.



-- 14 of 17 --



15

 Uno a muchos: un elemento de una entidad está relacionado con varios elementos

de otra entidad.

 Muchos a muchos: varios elementos de una entidad están relacionados con varios

elementos de otra entidad.

Ejemplo:

Diagrama Entidad-Relación (Estudiantes)

Figura 5. Diagrama E-R

Fuente: SENA (2019)

Una carrera tiene varios estudiantes, un estudiante solo estudia una carrera.

Relación es: uno a muchos (1:N).

Un estudiante tiene muchas materias y una materia tiene varios estudiantes.

Relación es: mucho a muchos (N:M).



-- 15 of 17 --



16

Referentes bibliográficos

Mircrosoft. (2017). Fundamentos de la normalización de bases de datos. Recuperado

de https://support.microsoft.com/es-co/help/283878/description-of-the-database-

normalization-basics

Sánchez, J. (s.f.). Manual de Gestión de Bases de Datos – Modelo Entidad/Relación.

Recuperado de https://jorgesanchez.net/manuales/gbd/entidad-relacion.html



-- 16 of 17 --



17

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



-- 17 of 17 --