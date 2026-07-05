# MC_AA1_Historia_evolucion_bases_datos
> Convertido de PDF | 5/7/2026, 12:08:16 p. m.

1

CARRERA:

Ingeniería en Sistemas Computacionales.

MATERIA:

Base de Datos

TEMA:

“Historia y Evolución de las Bases de Datos”

MAESTRO:

Giovanni Ayala Zúñiga

ALUMNO:

Joaquín Rodrigo Salvatierra Alberú.

Los Mochis, Sinaloa, enero de 2009



-- 1 of 10 --



2

## INDICE

Páginas

Portada

Introducción

Historia y evolución de las bases de datos 4

Década de 1950 y principios de 1960 4

Finales de la década de 1960 y la década de 1970 4

Década de 1980 5

Principio de la década de 1990 6

Finales de la década de 1990 6

Actualidad 6

Bases de datos orientadas a objetos 6

Conclusiones

Bibliografía



-- 2 of 10 --



3

## INTRODUCCIÓN

Las bases de datos son una de las herramientas más utilizadas en la actualidad para el

almacenamiento ordenado de información en todas las grandes empresas.

La finalidad de este trabajo es dar una perspectiva histórica sobre la creación de estos

dispositivos y su evolución a través del tiempo hasta llegar a ser lo que ahora son.



-- 3 of 10 --



4

Historia y evolución de las Bases de Datos

La automatización de las tareas de procesamiento de datos precede a las computadoras. Las

tarjetas perforadas, inventadas por Hollerith, se usaron en los principios del siglo XX para

registrar los datos del censo de los EE.UU., y se usaron sistemas mecánicos para procesar las

tarjetas y para tabular los resultados. Las tarjetas perforadas posteriormente se usaron

ampliamente como medio para introducir datos en las computadoras.

Se dice que los sistemas de bases de datos tienen sus raíces en el proyecto estadounidense

Apolo de mandar al hombre a la luna, en los años sesenta. En aquella época, no había ningún

sistema que permitiera gestionar la inmensa cantidad de información que requería el

proyecto. La primera empresa encargada del proyecto, NAA (North American Aviation),

desarrolló un software denominado GUAM (General Update Access Method) que estaba

basado en el concepto de que varias piezas pequeñas se unen para formar una pieza más

grande, y así sucesivamente hasta que el producto final está ensamblado. Esta estructura, que

tiene la forma de un árbol, es lo que se denomina una estructura jerárquica.

Las técnicas de almacenamiento de datos han evolucionado a lo largo de la historia:

Década de 1950 y principios de 1960

Se desarrollan las cintas magnéticas para el almacenamiento de datos. Las tareas de

procesamiento de datos tales como las nóminas fueron automatizadas, con los datos

almacenados en cintas. El procesamiento de datos consistía en leer datos de una o más cintas

y escribir datos en una nueva cinta. Los datos también se podían introducir desde paquetes de

tarjetas perforadas e impresos en impresoras. Por ejemplo, los aumentos de sueldo se

procesaban introduciendo los aumentos en las tarjetas perforadas y leyendo el paquete de

cintas perforadas en sincronización con una cinta que contenía los detalles maestros de los

salarios. Los registros debían estar igualmente ordenados. Los aumentos de sueldo tenían que

añadirse a los sueldos leídos de la cinta maestra, y escribirse en una nueva cinta; esta nueva

cinta se convertía en la nueva cinta maestra. Las cintas solo se podían leer secuencialmente, y

los tamaños de datos eran mucho mayores que la memoria principal; así, los programas de

procesamiento de datos tenían que procesar los datos según un determinado orden, leyendo y

mezclando datos de cintas y paquetes de tarjetas perforadas.

Finales de la década de 1960 y la década de 1970

El amplio uso de los discos fijos a finales de la década de los 60 cambió en gran medida el

escenario del procesamiento de datos, ya que los discos fijos permitieron el acceso directo a

los datos. La ubicación de los datos en disco no era importante, ya que a cualquier posición del

disco se podía acceder en sólo decenas de milisegundos. Los datos se liberaron de la tiranía de



-- 4 of 10 --



5

la secuencialidad. Con los discos pudieron desarrollarse las bases de datos de red y jerárquicas,

que permitieron que las estructuras de datos tales como listas y árboles pudieran almacenarse

en disco. Los programadores pudieron construir y manipular estas estructuras de datos.

El sistema de red se desarrolló, en parte, para satisfacer la necesidad de representar relaciones

entre datos más complejas que las que se podían modelar con los sistemas jerárquicos, y, en

parte, para imponer un estándar de bases de datos. Para ayudar a establecer dicho estándar,

CODASYL (Conference on Data Systems Languages), formado por representantes del gobierno

de EEUU y representantes del mundo empresarial, formaron un grupo denominado DBTG

(Data Base Task Group), cuyo objetivo era definir unas especificaciones estándar que

permitieran la creación de bases de datos y el manejo de los datos. El DBTG presentó su

informe final en 1971 y aunque éste no fue formalmente aceptado por ANSI (American

National Standards Institute), muchos sistemas se desarrollaron siguiendo la propuesta del

DBTG. Estos sistemas son los que se conocen como sistemas de red, o sistemas CODASYL o

DBTG.

Los sistemas jerárquico y de red constituyen la primera generación de los SGBD. Pero estos

sistemas presentan algunos inconvenientes:

 Es necesario escribir complejos programas de aplicación para responder a cualquier

tipo de consulta de datos, por simple que ésta sea.

 La independencia de datos es mínima.

 No tienen un fundamento teórico.

Un artículo histórico de Codd definió el modelo relacional y formas no procedimentales de

consultar los datos en el modelo relacional, y nacieron las bases de datos relacionales. La

simplicidad del modelo relacional y la posibilidad de ocultar completamente los detalles de

implementación al programador fueron realmente atractivas.

Década de 1980

Aunque académicamente interesante, el modelo relacional no se usó inicialmente en la

práctica debido a sus inconvenientes por el rendimiento; las bases de datos relacionales no

pudieron competir con el rendimiento de las bases de datos de red y jerárquicas existentes.

Esta situación cambió con System R, un proyecto innovador en IBM Research que desarrolló

técnicas para la construcción de un sistema de base de datos relacionales eficiente. En los

principios de la década de 1980 las bases de datos relacionales llegaron a competir con los

sistemas de bases de datos jerárquicas y de red incluso en el área de rendimiento. Las bases de

datos relacionales fueron tan sencillas de usar que finalmente reemplazaron a las bases de

datos jerárquicas y de red; los programadores que usaban estas bases de datos estaban

forzados a tratar muchos detalles de implementación de bajo nivel y tenían que codificar sus

consultas de forma procedimental. Aún más importante, debían tener presente el rendimiento

durante el diseño de sus programas, lo que implicaba un gran esfuerzo. En cambio, en una

base de datos relacional, casi todas estas tareas de bajo nivel se realizan automáticamente por

la base de datos, liberando al programador en el nivel lógico. La década de 1980 también fue



-- 5 of 10 --



6

testigo de una gran investigación en las bases de datos paralelas y distribuidas, así como del

trabajo inicial de las bases de datos orientadas a objetos.

Principio de la década de 1990

El lenguaje SQL se diseñó fundamentalmente para las aplicaciones de ayuda a la toma de

decisiones, que son intensivas en consultas, mientras que el objetivo principal de las bases de

datos en la década de 1980 fue las aplicaciones de un procesamiento de procesamiento de

transacciones, que son intensivas en actualizaciones. La ayuda a la toma de decisiones y las

consultas reemergieron como una importante área de la aplicación para las bases de datos. Las

herramientas para analizar grandes cantidades de datos experimentaron un gran crecimiento

de uso.

Finales de la década de 1990

El principal acontecimiento fue el crecimiento explosivo del World Wide Web. Las bases de

datos se implementaron mucho más extensivamente que nunca antes. Los sistemas de bases

de datos tienen ahora soporte para tasas de transacciones muy altas, así como muy alta

fiabilidad y disponibilidad 24 x 7. Los sistemas de base de datos también tuvieron interfaces

Web a los datos.

Actualidad

Hoy en día, existen cientos de SGBD relacionales, tanto para microordenadores como para

sistemas multiusuario, aunque muchos no son completamente fieles al modelo relacional.

Otros sistemas relacionales multiusuario son INGRES de Computer Associates, Informix de

Informix Software Inc. y Sybase de Sybase Inc. Ejemplos de sistemas relacionales de

microordenadores son Paradox y dBase IV de Borland, Access de Microsoft, FoxPro y R: base

de Microrim.

Los SGBD relacionales constituyen la segunda generación de los SGBD. Sin embargo, el modelo

relacional también tiene sus fallos, siendo uno de ellos su limitada capacidad al modelar los

datos. Se ha hecho mucha investigación desde entonces tratando de resolver este problema.

En 1976, Chen presentó el modelo entidad-relación, que es la técnica más utilizada en el

diseño de bases de datos. En 1979, Codd intentó subsanar algunas de las deficiencias de su

modelo relacional con una versión extendida denominada RM/T (1979) y más recientemente

RM/V2 (1990).

Bases de datos orientadas a objetos

El origen de las BDOO se encuentra básicamente en las siguientes razones:



-- 6 of 10 --



7

 La existencia de problemas para representar cierta información y modelar ciertos

aspectos del ‘mundo real’, puesto que los modelos clásicos permiten representar gran

cantidad de datos, pero las operaciones y representaciones que se pueden realizar

sobre ellos son bastante simples.

 El paso del modelo de objetos al modelo relacional genera dificultades que en el caso

de las BDOO no surgen ya que el modelo es el mismo.

Por lo tanto, las bases de datos orientadas a objetos surgen básicamente para tratar de paliar

las deficiencias de los modelos anteriores y para proporcionar eficiencia y sencillez a las

aplicaciones.

Las debilidades y limitaciones de los SGBDR son:

 Pobre representación de las entidades del ‘mundo real’.

 Sobrecarga y poca riqueza semánticas.

 Soporte inadecuado para las restricciones de integridad y empresariales

 Estructura de datos homogénea

 Operaciones limitadas

 Dificultades para gestionar las consultas recursivas

 Desadaptación de impedancias

 Problemas asociados a la concurrencia, cambios en los esquemas y el inadecuado

acceso navegacional.

 No ofrecen soporte para tipos definidos por el usuario (sólo dominios)

Mientras que las necesidades de las aplicaciones actuales con respecto a las bases de datos

son:

 Soporte para objetos complejos y datos multimedia

 Identificadores únicos

 Soporte a referencias e interrelaciones

 Manipulación navegacional y de conjunto de registros

 Jerarquías de objetos o tipos y herencia

 Integración de los datos con sus procedimientos asociados

 Modelos extensibles mediante tipos de datos definidos por el usuario

 Gestión de versiones

 Facilidades de evolución

 Transacciones de larga duración

 Interconexión e interoperabilidad

Debido a las limitaciones anteriormente expuestas, el uso de BDOO es más ventajoso si se

presenta en alguno de los siguientes escenarios:

 Un gran número de tipos de datos diferentes

 Un gran número de relaciones entre los objetos

 Objetos con comportamientos complejos



-- 7 of 10 --



8

Se puede encontrar este tipo de complejidad acerca de tipos de datos, relaciones entre

objetos y comportamiento de los objetos principalmente en aplicaciones de ingeniería,

manufacturación, simulaciones, automatización de oficina y en numerosos sistemas de

información. No obstante, las BDOO no están restringidas a estas áreas. Ya que al ofrecer la

misma funcionalidad que su precursoras relacionales, el resto de campos de aplicación tiene la

posibilidad de aprovechar completamente la potencia que las BDOO ofrecen para modelar

situaciones del mundo real.



-- 8 of 10 --



9

## CONCLUSIONES

Del anterior trabajo se puede concluir que las bases de datos fueron creadas por la

necesidad del hombre de almacenar grandes cantidades de información de una

manera más ordenada, para poder obtenerla de la manera más rápida cuando se

necesita.

Las bases de datos comenzaron siendo solo una pequeña evolución del sistema de

archivos pero con el tiempo y la aparición de las bases de datos de red y jerárquicas,

posteriormente las relacionales y finalmente las orientadas a objetos, se ha hecho de

estos dispositivos la herramienta vital en todo sistema de información para grandes

empresas y organizaciones.



-- 9 of 10 --



10

## BIBLIOGRAFÍAS

http://www.itescam.edu.mx/principal/sylabus/fpdb/recursos/r23897.PDF

http://www3.uji.es/~mmarques/f47/apun/node6.html

Silberschatz, Korth, Sudarshan.

Fundamentos de Bases de Datos.

Ed. McGraw Hill. Pag. 13



-- 10 of 10 --