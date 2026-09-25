# Las aventuras de Martin y Simon

Biblia del juego. Este archivo es la referencia maestra del proyecto y se actualiza
cada vez que tomamos una decision nueva.

---

## 1. Que es

Videojuego de plataformas 2D para PC, que corre en el navegador, hecho para Martin y
Simon (los hijos de Daniel). Titulo: **"Las aventuras de Samaon y Martain"**. Samaon y Martain son los
sobrenombres que Daniel usa para ellos en los cuentos que les inventa; en el
codigo los identificadores siguen siendo `simon` y `martin`.

- Todo lo que aparece **en pantalla** va en espanol, con tildes correctas.
- En el **codigo** y en los **nombres de archivo**, espanol **sin tildes ni enies**
  (`seleccion`, `nivel`, `constructor-nivel.js`).

## 2. Tecnica

| Tema | Decision |
|---|---|
| Motor | Phaser **4.2.1** (ultima estable) |
| Empaquetador | Vite **8.3.0** |
| Lenguaje | JavaScript (ES modules), sin TypeScript |
| Resolucion interna | **640 x 360**; el juego piensa siempre en esta pantalla |
| Densidad de dibujo | **1, 2 o 3 pixeles de verdad por punto**, segun la pantalla |
| Escalado | `Phaser.Scale.FIT` + `CENTER_BOTH` (se adapta a la ventana sin deformarse) |
| Modo | antialias **encendido** (el estilo es dibujo animado, no pixel art) |
| Tipografia | Chailce Noggin, completada a mano (ver seccion 10) |
| Grilla | **32 x 32 px** |
| Fisica | Arcade Physics |
| Node | v24 LTS |
| Publicado en | https://danielpenaospina1986.github.io/aventura-martin-simon/ |
| Repositorio | https://github.com/danielpenaospina1986/aventura-martin-simon (publico) |

Comandos:

```
npm run dev       # servidor de desarrollo (Vite)
npm run build     # compilar a dist/
npm run preview   # servir dist/ compilado
```

## 3. Estructura del proyecto

```
aventura-martin-simon/
  README.md             portada del repositorio publico
  JUGAR.bat             arranque con doble clic (Windows)
  COMO-JUGAR.txt        controles y reglas, para tener a mano
  index.html            contenedor del canvas
  vite.config.js
  CLAUDE.md             esta biblia
  src/
    main.js             arranque de Phaser y registro de escenas
    config/
      ajustes.js        TODOS los valores de ajuste (gravedad, velocidad, salto,
                        coyote time, buffer, tiempos) en un solo lugar
      personajes.js     datos de Martin y Simon (medidas, colores, habilidad)
      estilo.js         paleta, tipografias y medidas visuales centralizadas
      ciudades.js       el pavimento y las cornisas de cada ciudad
      historia.js       todos los textos del cuento, en un solo sitio
    escenas/
      EscenaTitulo.js
      EscenaSeleccion.js
      EscenaNivel.js
      EscenaVictoria.js
      EscenaPausa.js
      EscenaNombre.js   quien juega: se teclea el nombre de la sesion
      EscenaRelato.js   la resena de cada ciudad
      EscenaFinal.js    fin de partida y tablero de mejores puntajes
    entidades/
      Jugador.js        movimiento, habilidades, estados
      Enemigo.js        caminar y dar la vuelta en bordes y paredes
      JefeBase.js       lo que comparten los cinco guardianes del bano
      jefes/            uno por ciudad, cada cual con su forma de caer
    sistemas/
      controles.js      mapeo de teclas por jugador (preparado para 2 jugadores)
      constructor-nivel.js  convierte el mapa de texto en objetos del mundo
      planos.js         el plano de delante de la camara multiplanar
      hud.js            monedas, corazones, vidas y nombre del personaje
      sesion.js         quien esta jugando (el nombre, hasta 10 letras)
      puntajes.js       el tablero de los diez mejores
      cuento.js         cuando se cuenta cada cosa
      dibujo.js         fabrica de graficos provisionales (rectangulos)
    assets/
      fondo-barrio.jpg          fondo del juego (version tratada, la que se carga)
      fondo-barrio-original.jpg ilustracion original, solo como fuente
      cara-martin.png           carita de Martin, limpia y recortada
      cara-simon.png            carita de Simon, limpia y recortada
      caras-origen/             dibujos de partida (NO se versionan)
    niveles/
      index.js          la lista de niveles, en orden
      nivel1.js .. nivel5.js   un mapa de texto por tablero
  herramientas/
    validar-niveles.mjs comprueba que los cinco niveles son terminables
    generar-niveles.mjs escribe los mapas de src/niveles/
    tratar-fondo.mjs    suaviza la ilustracion de fondo
    preparar-caras.mjs  limpia y recorta las caritas de los ninos
    preparar-fondos.mjs tapa marcas y trata los fondos de cada ciudad
    preparar-sprites.mjs recorta y alinea las poses de un personaje
    lib/contorno.mjs    el contorno de tinta, compartido por las herramientas
    preparar-portada.mjs ajusta la portada y saca su version borrosa
    completar-fuente.mjs anade acentos y signos a la tipografia
  pruebas/
    juego.spec.mjs      pruebas automaticas con Playwright
  capturas/             imagenes que generan las pruebas (no se versionan)
  imagenes/             capturas del README (si se versionan)
  .github/workflows/
    desplegar.yml       compila y publica en GitHub Pages en cada push a main
```

Comprobar un nivel despues de editarlo a mano:

```
npm run validar
```

Pasar las pruebas automaticas (abren el juego en un navegador de verdad,
comprueban que no hay errores y guardan capturas en `capturas/`):

```
npm run probar
```

**Regla de oro:** lo visual esta centralizado (`config/estilo.js` y `sistemas/dibujo.js`)
para que cambiar rectangulos por sprites mas adelante sea reemplazar archivos, no
reescribir la logica del juego.

## 3bis. Historia

**"La gran fuga del bano".** Es la hora del bano. Mama llena la banera y llama a
Samaon y Martain, pero ellos salen corriendo y se escapan por las cinco ciudades
que han marcado su vida. **Ganar es terminar la partida sin banarse.**

Todo el mundo del juego quiere banarlos: los bichos son baneras con ojos que les
tiran agua con jabon, y cada jefe es un guardian del bano. El tono es de
**travesura, nunca de miedo**: los jefes son comicos y, cuando pierden, los
empapados son ellos.

### Las cinco ciudades

| # | Ciudad | Que es para ellos |
|---|---|---|
| 1 | Space Coast | Donde nacieron los dos |
| 2 | Medellin | La ciudad de sus papas, donde se criaron hasta los 5 y los 6 anos |
| 3 | Atlanta | Donde viven ahora. Aqui les sale al paso **Dona Zully** |
| 4 | Miami | Las vacaciones de siempre, y la casa de la tia |
| 5 | Cartagena | El paseo que no se les olvida |

### Como se cuenta

**No hay hilo de historia.** Lo anterior es el mundo en el que pasa el juego, no
un cuento que se narre: no hay vinetas de apertura ni de despedida. Lo unico que
se cuenta es:

- Una **resena** de cada ciudad, antes de su tablero, con su recuerdo. Es lo que
  mas adelante llevara la **ilustracion de entrada** de cada mundo.
- **Cada jefe** dice una frase al empezar la pelea y otra al perder.

Los textos estan en `src/config/historia.js`; quien pinta la resena es
`EscenaRelato` (panel `panelDeco`, se pasa con **Enter** o clic) y quien decide
cuando sale es `sistemas/cuento.js`. `EscenaRelato` sigue aceptando varias
vinetas aunque hoy le llegue una sola: es lo que la hacia servir tambien para la
intro y el final.

El juego habla el idioma del cuento: un golpe es **mojarse** (el nino chorrea y
suelta burbujas), quedarse sin corazones es **"¡Te banaron!"** y el fin de
partida, **"¡A la banera!"**. Siempre en broma. Las reglas de corazones, vidas y
puntaje **no cambian**: solo como se cuentan.

## 4. Personajes

Ambos tienen **exactamente la misma velocidad y el mismo salto**. La unica diferencia
es la habilidad.

> Cada personaje tiene ademas su **carita** (`datos.cara`), que sale en la pantalla
> de seleccion y arriba, junto al contador de monedas, mientras se juega.

### Martain (Martin) — el samurai
- **Dibujo propio**: samurai con gorra al reves, kimono, katana y sandalias.
- Sprite de **86 x 86 px**, caja de colision de **24 x 58** (mas estrecho que
  Samaon: es el delgado).
- **Nueve poses**: quieto, ciclo de carrera de cuatro (contacto, paso bajo,
  empuje, vuelo), dos de ataque, dolor y victoria. La de ataque ya trae dibujado
  el arco de la katana, asi que no se pinta otro encima.
- **Habilidad:** golpe de katana hacia adelante. Aparece un arco blanco breve
  delante de el que elimina a los enemigos que toque.

### Samaon (Simon) — el constructor
- **Ya tiene dibujo propio** (no es un rectangulo). Sudadera azul con parches,
  vaqueros y zapatos hechos de piezas de construccion.
- Sprite de **86 x 86 px** (lienzo cuadrado con todas las poses a la misma
  altura), caja de colision de **30 x 58**.
- **Nueve poses dibujadas**: quieto, ciclo de carrera de cinco (contacto, paso
  bajo, empuje, empuje, vuelo), lanzar, recibir golpe y victoria. La de vuelo,
  con los dos pies en el aire, se usa tambien para cuando esta saltando.
- Los dibujos de partida se preparan con `herramientas/preparar-sprites.mjs`.
- **Habilidad:** lanzar bloques de **32 x 32** hacia adelante. El bloque sale casi
  recto y va cayendo; alcanza unos **167 px** (5 casillas) antes de tocar el suelo.
  Derriba a los enemigos que toque y se deshace al chocar con algo.
  - Maximo **3 bloques** volando a la vez.
  - Antes construia bloques para subir. Se cambio para que los dos personajes
    tengan un golpe y los dos puedan pelear con el jefe.

### Los bichos

El bicho de a pie es una **banera con ojos** (96 x 86, la altura de los ninos).
Tiene cinco poses: quieta, dos de caminar, agachada y saltando. Su caja de
colision va bastante por dentro del dibujo (54 x 60): si midiera lo que el
dibujo seria mas alta que el propio nino y saltarla quedaria al filo.

- Camina y da la vuelta en bordes y paredes, como siempre.
- De vez en cuando **se planta, se agacha y salta tirando agua con jabon**. Si el
  agua alcanza al nino, cuenta como un golpe (parpadea, vuelve al checkpoint y
  pierde tres monedas).
- Los tiempos son **al azar**, para que no se aprendan de memoria, y **se acortan
  segun avanza la partida**: en Space Coast ataca poco y en Cartagena, a menudo.
- Solo ataca si el nino esta **a tiro y por delante**; si no, seria injusto.
- De momento es el mismo bicho en los cinco tableros. La idea es personalizarlo
  por ciudad mas adelante.

### La paloma

Cruza volando por la **franja de arriba**, la que se dejo libre en los tableros.
Vuela recto, sin perseguir: se la ve venir y da tiempo a apartarse. Al pasar
justo por encima del nino **suelta lo que suelta**, y si le cae encima cuenta
como un golpe. Aparece cada cierto tiempo al azar, y mas a menudo segun avanza
la partida.

**Se le puede saltar encima** y aguanta dos: al primero se queda aturdida, va
mas despacio y da tumbos; al segundo se cae, rueda por el aire, se estampa
contra el suelo, titila y desaparece, dejando su premio donde cayo. Tocarla de
lado no hace nada: va por el aire y castigar un roce seria injusto.

De cada tres, mas o menos una baja a volar **a la altura del segundo piso**
(`PALOMA.probabilidadMedia`), rozando las plataformas. Ahi ya no se la ve pasar
por arriba: estorba, hay que saltarla o pisarla desde la plataforma.

### La vaca berrionda

El **bicho intermedio**: ni se pasea por una plataforma como una banera ni
guarda una arena como un jefe. **Entra corriendo por un lado del cuadro**, al
azar por la derecha o por la izquierda, cruza el tablero y, cuando tiene al nino
delante, **baja la cabeza y embiste**.

> **De donde sale.** A Martin lo persiguio una vaca en la finca de los abuelos y
> casi se lo lleva por delante. Por eso, cuando entra una, sale en pantalla el
> cartel de **"¡CUIDADO CON LA BERRIONDA VACA!"** (`AVISOS.vaca`), en la caja
> art deco de la casa y clavado en pantalla, no en el mundo: es un aviso, tiene
> que poder leerse aunque la vaca ya venga lanzada.

Es una **Holstein de manchas amarillas** con cara de pocos amigos, dibujada por
Daniel. Seis poses (`src/assets/bichos/vaca/`): dos de trote, una de aviso, dos
de galope y una tumbada.

- Se le ve venir: antes de acelerar se planta un momento, agacha la cabeza y
  resopla (esa es la pose de aviso).
- **Se salta los huecos del suelo ella sola.** Si no, en cuanto pillara el
  primero se caeria al vacio y no llegaria a cruzarse con nadie.
- Se le gana como a cualquier bicho: **pisandola, con la katana o con un
  bloque**, y da lo mismo que ellos. De frente no hay quien la pare.
- Al derribarla **no se esfuma**: se cae patas arriba, con las X en los ojos y
  sus estrellitas, titila y desaparece dejando el premio donde cayo, igual que
  la paloma. Se le dejan la gravedad y el suelo para que se acueste donde toque:
  quitandole el cuerpo se quedaba flotando si la pisaban en pleno salto sobre un
  hueco.
- No entra en la **arena del jefe**: bastante tiene el nino con el jefe.
- Al volver al checkpoint **se van las vacas que vengan lanzadas**: reaparecer
  delante de una embestida no es dificultad, es un callejon sin salida.

Vive en `entidades/Vaca.js` y en su propio grupo (`escena.vacas`), no en el de
los bichos: asi lo que cuenta enemigos en pantalla sigue contando baneras.

### Los jefes

Al final de cada tablero espera un **guardian del bano**: mide **172 x 172**, el
doble que un nino, y mientras viva **la meta esta cerrada** y se dibuja apagada.
Hay un **checkpoint justo antes de su arena**, asi que pelear no castiga.

Su arena es **la pantalla entera**, las 20 ultimas columnas del tablero, con el
suelo seguido y sin huecos (ver la seccion 9). Todo lo que el jefe necesite
mirar del terreno va en su `prepararArena()`, que la escena llama cuando el
tablero ya esta montado.

Lo comun esta en `entidades/JefeBase.js` (vidas con su barra de puntitos,
parpadeo tras cada golpe, el aviso antes de atacar) y **como se le gana** lo
pone cada uno, en `entidades/jefes/`. Quien guarda que ciudad se decide en
`entidades/jefes/index.js`. Las cinco tienen ya el suyo; queda como respaldo el
**provisional**, el bicho morado de siempre.

Reglas para los cinco:

- **Cualquiera de los dos ninos puede ganarle.** Ninguna pelea puede pedir la
  katana de Martain ni los bloques de Samaon.
- **Ningun ataque llega sin avisar**: el jefe se pone en tension, se tine y sale
  un signo encima antes de cada golpe.
- **Durante la pelea caen corazones** de vez en cuando (`JEFE.corazonMinMs` y
  `corazonMaxMs`): pelear con un jefe no puede costar la partida.
- **Un jefe no ataca mientras no haya nadie en su arena**
  (`hayAlguienEnLaArena`, `JEFE.alcanceArena`). Ademas de raro, a Dona Zully le
  costo la vida: sus chorros rebotaban en sus propias sombrillas y se empapaba
  sola, asi que se derrotaba a si misma en doce segundos, mucho antes de que el
  nino llegara. Quien jugaba encontraba la arena vacia.
- Cada uno **dice una frase** al empezar (cuando el nino pisa su arena, no
  antes, que si no nadie la lee) y otra al perder, de `config/historia.js`.
- Mientras no haya arte, se dibujan **por codigo** con los pinceles de tinta.

#### 1. Space Coast: el Astronauta Burbuja

Un astronauta grandote con el casco lleno de agua jabonosa y un patico de caucho
flotando dentro. **Aguanta cuatro golpes.**

No vale pegarle cuando uno quiera: camina por su arena, avisa, y pega un
**pisoton lunar** que sacude la pantalla. Despues se queda unos segundos con las
botas rebosando espuma, y **esa es la ventana** para darle: pisandolo, con la
katana o con un bloque. Fuera de ella el golpe rebota con un ¡clonc! y no cuenta.

Con el tercer golpe queda **mareado** y ya no vuelve a andar: da tumbos en el
sitio esperando el remate, que lo manda flotando al espacio.

#### 2. Medellin: el Carrotanque

El camion del agua que sube a repartir bano a domicilio. Ronda su arena, avisa,
y **embiste** de lado a lado; al chocar se queda resoplando unos segundos, que
es la unica pausa que da. **Aguanta cuatro materos.**

**A el no se le pega**: los golpes rebotan con un ¡clonc!. Lo que lo para son
los **materos** de los balcones, que cuelgan por encima de la cabeza del nino.
Se les da desde abajo —con la katana, con un bloque o con un cabezazo en pleno
salto, las tres valen— y caen rectos, con una **sombra** en el suelo que avisa
donde. Si uno le cae encima, abollon.

Cuelgan a la altura justa (`MATERO.altura`): por encima del nino de pie, pero al
alcance de un salto. Por eso la pelea no pide habilidad ninguna. Cuando uno se
rompe **sale otro en su sitio** a los pocos segundos: quedarse sin materos seria
quedarse sin pelea.

Al cuarto se vara, cubierto de flores, como una silleta.

#### 3. Atlanta: Dona Zully

La mama, con su gorro de bano, su cepillo y su manguera. **Aguanta cuatro
rebotes.** No persigue a nadie: se planta, se vuelve hacia el nino y dispara
chorros a presion.

**A ella no se le pega.** En la arena hay **tres sombrillas** clavadas; si el
nino se pone detras de una, el chorro da en la sombrilla, **rebota** y vuelve a
empaparla. Entre sombrilla y sombrilla queda hueco a proposito: si la taparan
entera, el chorro no llegaria nunca y la pelea se ganaria sola. Mientras tanto le
caen jabones del techo, para que quedarse quieto detras de una sombrilla no sea
tan comodo.

Se reparten por el trozo de arena que ella vigila (`SOMBRILLA.arenaMaxima`, a
juego con `JEFE.alcanceArena`), y ninguna se planta **debajo de la plataforma**:
la copa la atravesaria.

Por eso esta pelea **no pide habilidad ninguna**: esconderse vale igual para
Samaon y para Martain.

Sus dibujos son de verdad (`src/assets/jefes/zully/`), sacados de la hoja que
paso Daniel: cuatro poses de cuerpo (quieta, la mirada, empapada y victoria) y
cuatro de manguera.

#### 4. Miami: el Salvavidas

El socorrista que no piensa dejar entrar al mar a dos ninos sin banar. Se pasa
la pelea subido a sus **torres de vigia**, tirando **flotadores** que ruedan por
la arena y hay que saltar. **Aguanta ocho golpes.**

Arriba no se le llega. Cada dos flotadores **baja** a dar la charla, y ahi vale
cualquier golpe: pisarlo, la katana o un bloque. Los golpes **no le cortan la
bajada**: mientras esta abajo se le puede dar varias veces, con el parpadeo de
por medio. Cortandola al primero, aguantar ocho salia a mas de un minuto.

Es la pelea mas larga de las cinco, y por eso es en la que mas corazones caen.
Al octavo se resbala con su propio bloqueador.

Las torres son **decorado**: nadie se sube a ellas, pero marcan por donde va a
saltar, que es lo que hace la pelea legible. Al subirse se pone **claramente**
mas alto que en el suelo: mide 172 px y, con poca diferencia, "esta arriba, no
le llego" y "ha bajado, dale" se veian igual.

#### 5. Cartagena: el Capitan Tapon

El ultimo guardian, y el mas terco: un capitan de banera con su casaca, su
sombrero de pico y, colgado a la espalda con su cadena, un **tapon** enorme.
Todo el agua de la partida esta ahi dentro. **Aguanta cinco tirones.**

Marcha por su arena y dispara **balas de espuma**; cuando se le acaban, se da la
vuelta a **recargar** y ahi se le ve el tapon. Un golpe al tapon en ese momento
—pisandolo, con la katana o con un bloque— y se le sale un poco. El tiron no le
corta la recarga, asi que en una ventana caben dos.

Es el final y tiene su gracia: al jefe final de un juego que se llama "La gran
fuga del bano" se le gana **quitandole el tapon**.

## 5. Sensacion de movimiento

Valores en `src/config/ajustes.js`:

- Salto **variable**: si sueltas el boton antes, el salto es mas corto.
- Caida **mas rapida** que la subida (gravedad multiplicada al bajar).
- **Coyote time** ~100 ms: puedes saltar poco despues de salir de una plataforma.
- **Buffer de salto** ~100 ms: si pulsas salto justo antes de aterrizar, salta igual.
- Cajas de colision **algo mas pequenas** que el dibujo del personaje (perdona roces).

## 6bis. El marcador

| Cosa | Puntos |
|---|---|
| Recoger un premio | **+1** |
| Vencer a un bicho pequeno | **+2** |
| Que te toque un enemigo o caerte a un hueco | **-3** |
| Derrotar a un jefe | **+10** |

El marcador nunca baja de cero. Se arrastra de un nivel al siguiente, asi que al
final refleja la partida entera: lo que ganaste menos lo que costo llegar.

Los dos recogen lo mismo: **rollos de sushi**. Antes cada uno tenia su premio
(sushi para Martain, bloques de armar para Samaon), pero se volvio atras.

## 6. Reglas amables

Filosofia: juego **generoso y sin castigos fuertes**.

### Corazones y vidas

- Cada golpe quita **un corazon**. Se empieza cada tablero con **cinco**.
- Al quedarse sin corazones se pierde **una vida** y se sigue jugando desde el
  ultimo checkpoint, con los cinco corazones repuestos.
- Las vidas son **tres para toda la partida** y se arrastran de un tablero a
  otro. Al perder la ultima se acaba la partida (`EscenaFinal`), que no es un
  regano: cuenta hasta donde llego y ofrece volver a intentarlo.
- Algunos bichos, **al azar**, sueltan un corazon en vez de monedas; algunas
  palomas derribadas dejan una **vida extra** donde cayeron. El azar se guarda en
  la escena (`probabilidadCorazon`, `probabilidadVidaExtra`) para poder apagarlo
  desde las pruebas.

- Un golpe **no devuelve al checkpoint**: el nino se queda donde estaba,
  parpadeando un momento. Al checkpoint solo se vuelve cuando se acaban los
  corazones (y quedan vidas), o al caerse por un hueco, que ahi no hay donde
  quedarse.
- Saltar encima de un enemigo lo elimina.
- Los enemigos eliminados desaparecen en una **nube de estrellitas**.
- El jefe es el unico que aguanta mas de un golpe (tres), y tocarle de lado tampoco
  castiga mas que un enemigo normal: se vuelve al checkpoint de al lado.
- Todo nivel se puede terminar con **cualquiera de los dos**. Las habilidades abren
  atajos y monedas extra, nunca son obligatorias para llegar a la meta.

## 7. Pantallas

```
titulo -> quien juega -> seleccion de personaje -> nivel -> victoria
                                                     |        |-> jugar otra vez
                                                     |        |-> cambiar personaje
                                                     |-> sin vidas -> fin de partida
```

En **quien juega** se teclea el nombre (hasta 10 letras), que hace de
identificador de la sesion: es lo que se apunta en el tablero de mejores
puntajes. Se guarda en el navegador para no escribirlo cada vez.

Se apunta una partida **al acabarse las vidas Y al pasarse los cinco tableros**.
Antes solo lo primero, asi que quien se lo terminaba entero —el que mas puntos
hacia— no salia nunca en el tablero.

El **tablero de mejores puntajes** guarda solo los **diez** mejores: en cuanto
entra uno nuevo, el que queda en el puesto once se borra, para no ir llenando el
navegador de partidas viejas. Vive en el navegador de cada equipo, asi que cada
casa tiene el suyo.

- **Esc** pausa el nivel y permite volver al menu.

## 8. Controles

| Accion | Teclas |
|---|---|
| Moverse | Flecha izquierda / derecha, o A / D |
| Saltar | Flecha arriba, W o Espacio |
| Habilidad | X o F |
| Confirmar en menus | Enter o clic |
| Pausa | Esc |
| Ver cajas de colision | H |

El mapeo vive en `src/sistemas/controles.js`, hecho por **perfiles de jugador**, para
que agregar un segundo jugador simultaneo sea anadir un perfil, no reescribir nada.

## 9. Formato de niveles

Cada nivel es un **mapa de texto** en su propio archivo, editable a mano. Cada caracter
es una casilla de 32 x 32.

| Simbolo | Significado |
|---|---|
| `#` | suelo / bloque solido |
| `=` | plataforma que se atraviesa desde abajo |
| `C` | moneda |
| `E` | enemigo |
| `J` | jefe (ocupa mas de una casilla; se apoya en la suya) |
| `K` | checkpoint |
| `M` | meta |
| `P` | posicion de inicio |
| `.` | vacio |

### Las tres alturas

El tablero tiene **tres alturas y solo tres**, y una franja libre arriba:

```
 fila 0-2   franja libre, reservada para los bichos voladores que vendran
 fila 3     TERCER nivel   (se llega saltando desde el segundo)
 fila 6     SEGUNDO nivel  (se llega saltando desde el suelo)
 fila 9     SUELO          (por donde se camina)
 fila 10-11 subsuelo
```

Entre altura y altura hay 3 casillas (96 px) y el salto llega a 3,58, asi que se
sube de una a otra pero nunca del suelo al tercero de un tiron.

Los **huecos del suelo no pasan de dos casillas**. El salto cubre 131 px en
llano, pero el nino no es un punto: despega cuando su pie delantero llega al
borde y aterriza cuando el trasero pasa al otro lado, asi que hay que cruzar el
hueco **mas su propio ancho**. Con tres casillas (96 + 30 = 126 px) la ventana
para despegar se queda en 10 px, unas milesimas, y se falla casi siempre.
`npm run validar` lo comprueba.

### Los cinco tableros

Cada tablero es una **ciudad**, con su propio fondo ilustrado:

| # | Ciudad | Tamano | Pantallas | Premios | Bichos |
|---|---|---|---|---|---|
| 1 | Space Coast | 122 x 12 | 6,1 | 61 | 4 |
| 2 | Medellin | 138 x 12 | 6,9 | 70 | 7 |
| 3 | Atlanta | 154 x 12 | 7,7 | 80 | 9 |
| 4 | Miami | 170 x 12 | 8,5 | 89 | 10 |
| 5 | Cartagena | 186 x 12 | 9,3 | 100 | 11 |

El fondo de cada una vive en `src/assets/fondos/` y el nivel lo nombra en su
campo `fondo`.

Todos tienen **tres checkpoints** y **un jefe** antes de la meta. Se juegan en
orden y el marcador se arrastra de uno a otro: la partida son los cinco.

### Los motivos

Los mapas se escriben en `herramientas/generar-niveles.mjs` y se generan con
`npm run niveles`. Un tablero no se dibuja columna a columna, sino como una
**lista de tramos y huecos**: cada tramo es un trozo de suelo seguido y lleva
encima un **motivo**, de los siete que hay en `MOTIVOS`.

| Motivo | Que trae |
|---|---|
| `inicio` | el arranque, sin un solo bicho: es para aprender a andar y saltar |
| `escalera` | del suelo al segundo piso y de ahi al tercero |
| `patio` | dos bichos abajo y premios a media altura |
| `repisa` | la repisa del premio gordo, cinco premios seguidos arriba |
| `balcones` | se sube, se cruza por arriba y se baja al otro lado |
| `bichos` | tres bichos seguidos, para lucir la katana o los bloques |
| `llano` | un respiro entre dos apreturas |

Los tramos miden 14 casillas (16 el de arranque) y entre uno y otro va un
**hueco de dos**, con su arco de premios. Alargar un tablero es anadirle
motivos, y por eso los cinco pudieron pasar de 4-5 pantallas a 6-9 sin tener que
recolocar nada a mano.

### La arena del jefe

Las **20 ultimas columnas** de cada tablero son la arena, y 20 x 32 = 640 px es
**la pantalla entera**. Como no queda tablero por detras, al llegar la camara ya
no puede seguir avanzando: la pelea se ve de un vistazo y completa, como el
escenario de un teatro, y ni el jefe ni el nino se salen nunca de cuadro.

- Suelo **seguido, sin un solo hueco**: nadie se cae peleando.
- Delante va un **porche** de cuatro casillas con el ultimo checkpoint, asi que
  se entra descansado y reaparecer no cuesta el camino de vuelta.
- Dentro: una **plataforma** para dejarse caer sobre el jefe (mide el doble que
  un nino y desde el suelo el salto no llega a su coronilla), el **jefe** a dos
  tercios de la pantalla y la **meta** al fondo.
- Lo que cada jefe planta en su arena (las sombrillas de Dona Zully, por
  ejemplo) lo reparte el mismo, en `prepararArena()`.

## 8bis. Que se vea nitido

El juego piensa en una pantalla de **640 x 360** y eso no se toca: la casilla
mide 32, el salto sube 114 px y los mapas valen tal cual. Lo que cambia es
cuantos pixeles de verdad se gastan en dibujar cada punto.

Antes el lienzo tenia 640 x 360 pixeles y el navegador lo estiraba a lo que
midiera la ventana. Un monitor de 1920 lo agrandaba tres veces, asi que cada
punto del juego se veia como un cuadrado de 3 x 3: de ahi el dentado de los
personajes.

Ahora el lienzo tiene **densidad** veces mas pixeles y la camara de cada escena
va con ese mismo zoom, asi que las coordenadas siguen siendo las de siempre.
`RENDER.densidad` (en `ajustes.js`) se calcula sola al arrancar: la que haga
falta para que cada punto caiga en un pixel de verdad, y ni uno mas. En una
ventana de 1280 x 720 sale 2; a pantalla completa en 1920 x 1080, 3. Se puede
forzar desde la barra de direcciones con `?densidad=1`.

Tres cosas que hay que tener en cuenta al tocar codigo:

- **El texto tambien se rasteriza, y por defecto a 1x.** Phaser dibuja cada
  texto en su propia textura al tamano que se le pide, y luego la camara la
  amplia: a densidad 3, una letra de 16 px se pintaba en 16 y se estiraba a 48,
  de ahi que los textos y los carteles se vieran pixelados al lado de las
  ilustraciones. En `main.js` se le pide a TODOS que se dibujen a
  `RENDER.densidad`; en pantalla ocupan lo mismo, pero la textura sale D veces
  mayor.

  Ojo con el como: se parchea el **prototipo** de la fabrica de Phaser, no con
  `register`. En Phaser 4, registrar un nombre que ya existe no lo reemplaza, y
  el envoltorio se quedaba sin llamar. Hay una prueba que lo vigila, y se abre a
  densidad 3 a proposito: a 1 no probaria nada.

  Las **cajas de dialogo** (`panelDeco`) no tenian este problema: son Graphics,
  se dibujan como vectores a la resolucion final.

- **Las texturas que se dibujan por codigo se generan a esa densidad.** Quien
  use una y llame a `setDisplaySize` no tiene que hacer nada; quien no, tiene
  que pasar por `aEscalaDeJuego()` (o por `mosaico()`, si es terreno), o saldra
  del tamano de la textura, que es D veces mayor. Y lo que anime la escala tiene
  que ir en proporcion a `1 / densidad`, no a 1. Al jefe se le olvido y salio
  del doble de grande: si algo se ve desproporcionado, es lo primero que hay que
  mirar.
- **`setScrollFactor` no sirve con el zoom**: descoloca todo lo que no vaya a
  velocidad 1. Los planos y el HUD se mueven a mano con `Planos`, en
  `sistemas/planos.js`.

## 9bis. La camara multiplanar

La tecnica de los dibujos animados de los anos 30: el decorado se pinta en
varias laminas separadas y la camara las mueve a distinta velocidad. Lo que esta
cerca pasa deprisa, lo que esta lejos casi no se mueve, y de ahi sale la
profundidad.

| Plano | Que lleva | Velocidad | Donde vive |
|---|---|---|---|
| **Fondo** | la ilustracion de la ciudad | **0,16** | `dibujo.js`, `pintarFondo` |
| **Detras** | decorado grande que pasa por detras del nino y del suelo | **0,72** | `sistemas/planos.js` |
| **Medio** | el mundo: suelo, cornisas, bichos, premios | **1** | `constructor-nivel.js` |
| **Frente** | lo que cruza pegado a la camara | **1,45** | `sistemas/planos.js` |

Se gradua en `PLANOS`, dentro de `src/config/estilo.js`. Cada plano se mueve a
mano, en `Planos`: `setScrollFactor` no se lleva con el zoom de la camara.

- **El fondo va sin velo.** Antes llevaba encima un degradado blanco para que no
  se comiera al personaje; el resultado eran ciudades lavadas. Ahora se lee como
  fondo porque esta desenfocado y porque se mueve despacio, que es como se hace
  de verdad. El color queda intacto.
- El fondo se **ancla por la izquierda**. Centrado haria falta margen a los dos
  lados, o sea el doble de ampliacion para el mismo recorrido, y ampliar de mas
  emborrona el dibujo y recorta el cielo.
- **El plano medio se viste de su ciudad** (`src/config/ciudades.js`): arena en
  Space Coast, baldosa y ladrillo en Medellin, asfalto con su linea en Atlanta,
  acera art deco en Miami y piedra colonial en Cartagena. La casilla se repite
  en mosaico, asi que el dibujo casa consigo mismo por los cuatro lados y nunca
  lleva marco.
- **El plano de delante es de cada ciudad.** Su lista va en `frente`, dentro de
  `src/config/ciudades.js`. Space Coast tiene palmeras, un vecino de otro
  planeta dandose un bano y un astronauta flotando arriba; Medellin, guayacanes
  en flor, una palmera alta, una olla de frijoles y el gato de la hinchada, que
  va llorando porque Martain le mocho la cola. Las tres que faltan siguen con
  los adornos provisionales (ramas, farol, matorral), que es lo que pone
  `montarPrimerPlano` cuando una ciudad no trae ninguno propio de delante.
- **El decorado del pueblo** es lo que va DETRAS. Cada ciudad tiene su lista en
  `ciudades.js`: Space Coast, `DECORADO_DE_COCOA` (la casa de Florida con su
  cocodrilo, el jeep de los surfistas y el letrero del muelle); Medellin,
  `DECORADO_DE_PUEBLO` (la chiva camino del estadio, dos guayacanes grandes y
  una casa de pueblo con su bandera). Atlanta, Miami y Cartagena **usan el de
  Medellin de prestado** hasta que llegue el suyo, que es lo que se ha hecho
  siempre aqui con lo que falta.

  Sus medidas (lienzos de 480-660 px, contorno a la mitad, opaco, apoyado en la
  linea del suelo) **estan probadas y valen de patron** para lo que venga: un
  recurso nuevo para esta capa se prepara igual y se cuelga de esa misma lista.
- **En la arena del jefe no se planta nada por delante.** Al final del tablero
  la camara ya no avanza, asi que un adorno que caiga ahi se queda clavado en
  mitad del cuadro y tapa al jefe justo cuando hay que verle venir el golpe. Lo
  corta `topeDeArena`, en `montarPrimerPlano`. Los de `detras: true` si siguen:
  decoran sin estorbar.
- Los adornos de suelo **nacen del borde de abajo de la pantalla**, no de la
  linea por donde camina el nino: estan mas cerca que el suelo, asi que su base
  queda fuera de cuadro, que es lo que los pone delante de todo. Por eso sus
  alturas son mas cortas de lo que pareceria: lo que se ve de un arbol de 150 px
  es solo lo que asoma por encima del suelo, y con la altura "real" taparia al
  nino entero y no se podria jugar.
- Un adorno puede llevar **`detras: true`** y entonces pasa por DETRAS del nino
  y del suelo, mas despacio, como decorado de la ciudad. Es lo que hacen en
  Medellin la chiva, los guayacanes grandes y la casa de pueblo.
- Los de **delante** van un poco translucidos, que cruzan por encima del nino;
  los de **detras, no**: no tapan a nadie, y bajarles la opacidad solo los
  dejaba desvaidos contra la ilustracion de la ciudad.
- Los de delante **nacen del borde de abajo de la pantalla**; los de **detras**
  apoyan en la **linea del suelo**, hundidos un pelin por detras del terreno
  (`PLANOS.detras.hundido`). Son la ambientacion del pueblo, no cosas que
  floten. Se probo de las otras dos maneras y las dos estaban mal: naciendo del
  borde de abajo (como los de delante, que estan mas CERCA que el suelo) el
  terreno les comia el tercio inferior y solo asomaban los tejados; a la linea
  del suelo subida un 10%, se veian volando.
- Y llevan el **contorno a la mitad** (`contornoRelativo` en
  `preparar-sprites.mjs`). Con la linea de los de delante se veian recortados a
  tijera contra la ilustracion de la ciudad.

## 10. Arte y licencias

### Estilo

**Dibujo animado de los anos 30**, con aire art deco: contorno de tinta negra
grueso, formas redondeadas, ojos grandes, zapatones, y una paleta de cremas,
sepias y colores apagados. Nada de pixel art.

Los pinceles de ese estilo (`tintaRedonda`, `tintaCirculo`, `brillo`) viven en
`src/sistemas/dibujo.js`, y las cajas de dialogo en `panelDeco`. Todo lo que se
dibuje nuevo deberia usarlos, para que el juego hable un solo idioma visual.

- Todo el arte es **100% original** o de paquetes con **licencia libre** (Kenney, CC0).
- **Prohibido** usar personajes, sprites, disenos, tipografias o musica de marcas o
  franquicias conocidas.
  - **Con una excepcion, que Daniel decidio:** el decorado de las ciudades va
    tal cual, con sus rotulos, sus escudos y sus mascotas — los fondos de
    Atlanta y Miami, y el gato de la hinchada de Medellin, que lleva la
    camiseta con su patrocinador. El juego es un regalo para Martin y Simon,
    no tiene fin comercial y el enlace no esta en ningun sitio. Si algun dia
    esto saliera de casa, es lo primero que habria que quitar.
- **Fondos:** las cinco ciudades van **tal cual**, sin tocarles color ni
  enfoque. Lo que las manda al fondo es que se mueven despacio y que todo lo
  de delante lleva contorno de tinta. Antes se les bajaba la saturacion
  (quedaban lavadas) y luego se les dejaba un desenfoque (quedaban
  emborronadas).
- **Tipografia:** Chailce Noggin, de ripoof (2021), que da el aire de dibujo
  animado de los anos 30. No declara licencia en sus metadatos: si algun dia hay
  que sustituirla, es cambiar un archivo. Venia con 81 glifos y **sin acentos,
  sin ene y sin signos de apertura**; como todo el juego esta en espanol, se
  completa con `herramientas/completar-fuente.mjs` hasta 105 glifos.
- **Caritas de los ninos:** dibujos de Martin y Simon generados con Gemini a peticion
  de Daniel, pidiendo un aire de dibujo animado antiguo. Un estilo de dibujo se puede
  usar libremente, pero el generador colo dos marcas registradas: un emblema en la
  gorra de Martin y un texto en el hombro de Simon. Las dos se tapan con
  `herramientas/preparar-caras.mjs`, y los dibujos de partida **no se suben al
  repositorio** (van en `.gitignore`). Lo que se publica son los PNG ya limpios.

### El contorno de tinta

Todo dibujo recortado lleva un **contorno negro grueso por fuera**, que es la
marca de la casa de los dibujos animados de los anos 30: personajes, bichos,
banderas, puertas, premios, corazones y las caritas de los ninos.

Lo pone `herramientas/lib/contorno.mjs`, que usan tanto `preparar-sprites.mjs`
como `preparar-caras.mjs`. Se hace sacando la silueta del dibujo (el mismo
dibujo tenido de negro) y estampandola alrededor en circulo, antes de volver a
poner el dibujo encima. El grosor, `CONTORNO`, va en pixeles del lienzo de 260;
como en pantalla los dibujos se ven a un tercio, un contorno de 10 se lee como
una linea de 3 px.

Dos cuidados:

- Va **al final**, sobre el recorte ya limpio. Hecho sobre el original, el
  contorno rodearia tambien la basura que luego se quita.
- Antes hay que **quitar la pelusa** del recorte (`quitarMotas`): puntitos de
  dos o tres pixeles que sobraron del fondo y que, con contorno, se convierten
  en borrones negros.

Lo que se dibuja por codigo (corazones, jefe, vida extra) lleva su contorno a
mano, pintando la forma dos veces: la de detras en tinta y un poco mas grande.

### El fondo y la legibilidad

La ilustracion tiene mucho detalle y lineas oscuras por toda la pantalla. Tal cual,
el personaje, las monedas y los enemigos se pierden dentro del dibujo. Por eso:

1. Se trata una vez con `node herramientas/tratar-fondo.mjs` (desenfoque suave y
   menos color) y el juego carga la version tratada.
2. Encima lleva un **velo blanco en degradado**: suave arriba (se ve el cielo y el
   metrocable) y mas fuerte abajo, que es donde se juega.
3. En los menus se suma un velo extra, porque hay mucho texto.

Todo se gradua en `FONDO`, dentro de `src/config/estilo.js`. Si algun dia el fondo
tapa demasiado el juego, se sube `veloAbajo`; si se quiere ver mejor el dibujo, se
baja.

## 11. Hoja de ruta (no implementar todavia)

1. Cambiar rectangulos por sprites en pixel art.
2. Modo 2 jugadores simultaneos, con teclado compartido y mandos tipo Xbox.
3. Niveles disenados en Tiled.
4. Sonidos y voces grabadas de los ninos.
5. Mas niveles.
6. Publicar en web o empaquetar como app de Windows.

## 12. Registro de decisiones

- **2026-09-22** — Proyecto creado con Vite + Phaser 4.2.1 en JavaScript puro.
  Sin TypeScript para mantenerlo simple y editable a mano.
- **2026-09-22** — Se usa Arcade Physics (no Matter): mas simple y suficiente para
  un plataformas clasico.
- **2026-09-22** — Los niveles se escriben como mapas de texto en vez de Tiled, para
  que Daniel pueda editarlos con el bloc de notas. Tiled queda para la fase 3.
- **2026-09-22** — Los graficos provisionales no son imagenes sueltas: se generan por
  codigo en `src/sistemas/dibujo.js` y se registran con las claves de `TEXTURAS`.
  Al pasar a pixel art solo hay que cambiar ese archivo por uno que cargue PNG con
  las mismas claves.
- **2026-09-22** — Existe `herramientas/validar-nivel.mjs`, que calcula la parabola
  real del salto a partir de `ajustes.js` y comprueba que la meta se alcanza sin usar
  habilidades. Se ejecuta despues de tocar un nivel o los valores de movimiento.
- **2026-09-22** — Los efectos (estrellitas, polvo, brillos) se hacen con tweens y no
  con el sistema de particulas: menos dependencias y mas facil de sustituir.
- **2026-09-22** — `window.juego` expone la instancia de Phaser para depurar desde la
  consola del navegador y para las pruebas automaticas con Playwright.
- **2026-09-22** — Los controles no se leen muestreando la tecla una vez por
  fotograma, sino escuchando sus eventos. Un toque muy corto (mas rapido que un
  fotograma) se perdia, y los ninos dan toques muy cortos.
- **2026-09-22** — El checkpoint y la meta tienen una zona de contacto alta (10
  casillas). Con la zona pegada al suelo se podian pasar de largo saltando por
  encima y el nivel se volvia injusto.
- **2026-09-22** — Los huecos se pintan con un fondo oscuro para que se lean como
  precipicios: con el paisaje de fondo a la vista no se distinguian.
- **2026-09-22** — El fondo pasa de ser un cielo dibujado por codigo a una
  ilustracion de un barrio con metrocable. El cielo dibujado se conserva como
  respaldo por si la imagen no cargase.
- **2026-09-22** — Las caritas de los ninos salen en la seleccion de personaje y en
  el HUD. Se guardan como PNG cuadrados de 256x256 con fondo transparente y se
  dibujan sobre un disco claro, porque el pelo oscuro y la gorra negra se perdian
  sobre el panel del HUD.
- **2026-09-22** — La ilustracion se usa **tratada**, no tal cual: se comprobo con
  capturas que sin tratar el personaje rojo desaparecia entre las casas rojas y las
  monedas se confundian con las fachadas amarillas. El tratamiento ademas la deja en
  157 KB en vez de 364 KB.
- **2026-09-22** — El juego se publica en GitHub Pages desde un repositorio
  **publico** (`danielpenaospina1986/aventura-martin-simon`), para que los ninos
  puedan jugar desde cualquier equipo sin instalar nada. Pages solo es gratuito en
  repositorios publicos.
- **2026-09-22** — El despliegue es automatico con GitHub Actions en cada push a
  `main`: instala, valida el nivel, compila y publica. No hay subida manual de
  archivos, al contrario que en el proyecto Pavas.
- **2026-09-22** — GitHub Pages se activa **una sola vez a mano** en
  Ajustes > Pages > Source: "GitHub Actions". Se intento que lo hiciera el propio
  workflow con `enablement: true`, pero el token de Actions no tiene permiso para
  crear el sitio y la ejecucion fallaba.
- **2026-09-22** — Simon deja de construir bloques y pasa a **lanzarlos**. La idea es
  que los dos personajes tengan un golpe, para que cualquiera de los dos pueda
  derrotar al jefe. Al perder la habilidad de subir, la repisa alta dejo de ser
  exclusiva suya: ahora se llega con una plataforma nueva, y `npm run validar`
  confirma que no queda ninguna moneda inalcanzable.
- **2026-09-22** — El bloque lanzado sale **casi recto** y no en arco alto: con mas
  impulso hacia arriba pasaba por encima de los enemigos, que son bajitos.
- **2026-09-22** — En los callbacks de colision de Phaser **no se puede dar por hecho
  el orden de los dos objetos**: cuando enfrenta un grupo con un sprite suelto, los
  invierte. Por fiarse del orden, el bloque lanzado destruia al jefe en vez de
  romperse el. Ahora siempre se comprueba cual de los dos es el proyectil.
- **2026-09-22** — El juego pasa de cinco a **cinco tableros encadenados**, cada
  uno con su jefe, y el marcador se arrastra entre ellos. Los mapas se escriben
  por tramos en una herramienta, porque alinear a ojo una rejilla de 116 x 17
  caracteres no es razonable.
- **2026-09-22** — El terreno ya no se monta casilla a casilla, sino por tramos:
  cada fila de casillas seguidas es un solo rectangulo con un unico cuerpo de
  fisica. Se paso de mas de 500 cuerpos por nivel a unos 60.
- **2026-09-22** — Las pruebas de movimiento **no miden distancia contra reloj**,
  sino la velocidad que alcanza el jugador y el punto mas alto del salto. Medir
  contra reloj las hacia fallar en maquinas lentas sin que el juego estuviese mal.
  (El entorno de pruebas dibuja por software, sin tarjeta grafica, y va a 20-40
  fotogramas por segundo; en un equipo normal el juego va suelto.)
- **2026-09-22** — Los graficos dejan de ser rectangulos planos y pasan al estilo
  de dibujo animado de los anos 30: contorno de tinta, formas redondeadas y
  paleta apagada. Los personajes tienen cabeza, cuerpo y zapatones; los enemigos
  y el jefe son bichos redondos con ojos grandes.
- **2026-09-22** — Cada nivel es una ciudad con su fondo: Space Coast, Medellin,
  Atlanta, Miami y Cartagena.
- **2026-09-22** — Los fondos de Atlanta y Miami traian **marcas registradas** bien
  visibles (un simbolo deportivo muy protegido, el logotipo de una marca de
  refrescos y nombres de hoteles). Se tapan con `preparar-fondos.mjs`, que en su
  lugar dibuja motivos art deco. Los originales no se suben al repositorio.
- **2026-09-22** — Simon estrena dibujo de verdad. Las poses vienen en lienzos
  grandes y se reducen en el juego; **Arcade mide la caja de colision en pixeles
  de la textura y luego le aplica la escala del sprite**, asi que hay que dividir
  por la escala o la caja sale diminuta (28x54 se quedaba en 7x14).
- **2026-09-22** — Vencer a un bicho pequeno da **2 monedas**. Antes no daba nada.
- **2026-09-22** — Los personajes pasan a llamarse **Samaon y Martain**, y el juego
  con ellos. En el codigo siguen siendo `simon` y `martin`.
- **2026-09-22** — Las hojas de poses se recortan **buscando los dibujos solos**,
  no por rejilla: en la hoja de carrera la fila de abajo va centrada y una rejilla
  fija los partia por la mitad. Se pide un minimo de pixeles por columna para
  separar dibujos que casi se tocan.
- **2026-09-22** — Las herramientas de imagen ya no dependen del servidor: reciben
  la imagen leida. Vite recargaba la pagina a media faena y las cortaba.
- **2026-09-22** — La portada se colorea mapeando la luz de cada punto a una rampa
  de color (tinta, rojo, teja, naranja, mostaza, crema), como se hacia en los
  carteles de los anos 30, en vez de inventar un color por objeto.
  *(Reemplazada el 2026-09-23: la portada nueva ya viene a color.)*
- **2026-09-23** — Portada nueva, ya a color y con el titulo dibujado dentro de su
  cartel art deco, arriba a la derecha. La pantalla de titulo no escribe ningun
  titulo: cuelga una **caja art deco translucida justo debajo del cartel**, en el
  hueco que la ilustracion deja libre, y ahi van el "pulsa Enter" y los
  controles. La posicion del cartel se guarda en tanto por uno sobre el dibujo,
  no en pixeles, para que siga cuadrando si cambia la resolucion.
- **2026-09-23** — Los demas menus van sobre **la misma portada, desenfocada**.
  El desenfoque se cuece de antemano en `preparar-portada.mjs` y no en el juego,
  porque desenfocar por codigo se paga cada vez que se entra en un menu. Encima
  lleva un velo **oscuro**, no blanco: oscurecer mantiene los colores y da
  contraste al texto, mientras que el velo blanco dejaba la ilustracion lavada.
- **2026-09-23** — Nada de flechas dibujadas en los textos: la tipografia no trae
  esos signos y salian rotos. Se dicen con palabras.
- **2026-09-23** — El juego pasa a **camara multiplanar**, con tres planos a
  0,16 / 1 / 1,45. Ver la seccion 9bis.
- **2026-09-23** — **Fuera el velo blanco de los fondos.** Estaba ahi para que el
  personaje no se perdiera dentro del dibujo, pero dejaba las cinco ciudades
  lavadas. Lo que separa el fondo del juego ya no es apagarlo, sino el
  desenfoque y la velocidad. El tratamiento de `preparar-fondos.mjs` se queda
  solo en `blur(3px)`, sin tocar saturacion ni brillo.
- **2026-09-23** — Cada ciudad estrena **su pavimento**. El suelo era el mismo
  bloque de tierra con hierba en los cinco tableros, que es justo la estetica de
  la que se queria salir.
- **2026-09-23** — Las marcas registradas de los fondos ya no se difuminan: se
  posa una **paloma** encima, de las que ya vuelan por el juego. Se come unas
  letras, el rotulo deja de leerse y tiene su gracia. Difuminar dejaba borrones
  que, sin el velo blanco, cantaban muchisimo. Ojo con **clonar** trozos de la
  propia ilustracion para tapar: si el origen esta cerca de la marca se copia la
  propia marca (paso con los aros, que reaparecieron al lado del sol).
- **2026-09-23** — `preparar-fondos.mjs` deja de depender del servidor de
  desarrollo, como ya se hizo con los sprites: Vite recargaba la pagina a media
  faena y la cortaba.
- **2026-09-23** — Los dibujos se veian dentados porque el lienzo tenia 640 x 360
  pixeles y el navegador lo estiraba. Ahora el lienzo va a **densidad** (1, 2 o
  3) y la camara con ese zoom, asi que el juego sigue pensando en 640 x 360 y
  nada de la fisica, los mapas ni el validador se toca. Se probo antes `zoom` en
  la configuracion de escala de Phaser, pero eso solo estira el lienzo por CSS:
  no anade un solo pixel.
- **2026-09-23** — La densidad se calcula sola segun la pantalla, con tope 3:
  mas no se nota y cuesta el cuadrado. Las pruebas automaticas la fuerzan a 1
  con `?densidad=1`, porque alli el navegador dibuja por software y a densidad 3
  el juego se quedaba en 19 fotogramas.
- **2026-09-23** — **`setScrollFactor` no funciona con el zoom de la camara**:
  con zoom, todo lo que no va a velocidad 1 acaba descolocado (el HUD se
  quedaba pegado al mundo y el fondo se iba de cuadro). Los planos y el HUD se
  mueven a mano en `sistemas/planos.js`, contra la esquina izquierda de lo
  visible, y se colocan en `prerender`: hacerlo en el `update` dejaba el HUD
  temblando un fotograma por detras.
- **2026-09-23** — **Los jefes esperan al nino.** Dona Zully se derrotaba a si
  misma: disparaba desde que empezaba el tablero, el chorro rebotaba en sus
  propias sombrillas y volvia a empaparla. Doce segundos y se habia ganado sola,
  asi que al llegar no habia jefe. Hay una prueba que lo vigila: se deja al jefe
  a solas catorce segundos y tiene que seguir entero.
- **2026-09-23** — Dona Zully **no camina**, y plantada en el borde de su arena
  se quedaba pegada al canto derecho de la pantalla: al llegar parecia que no
  hubiera jefe. Ahora se mete un poco hacia dentro, se mece en el sitio y su
  barra de vida **se queda dentro de la pantalla** aunque ella este en el borde.
- **2026-09-23** — Las sombrillas se reparten por **el sitio que tenga cada
  arena**, no a distancias fijas: la de Atlanta es corta (hay un hueco justo
  antes) y tres sombrillas salian una encima de otra, tapandolo todo.
- **2026-09-23** — Atlanta estrena a **Dona Zully**, con los dibujos de verdad.
  A ella no se le pega: hay que esconderse tras una sombrilla para que su propio
  chorro rebote y la empape.
- **2026-09-23** — Un jefe **nace dentro de `construirNivel`**, cuando la escena
  todavia no sabe donde esta el suelo. Lo que necesite mirar el terreno va en
  `prepararArena()`, que la escena llama cuando el tablero ya esta montado.
  Plantando las sombrillas en el constructor, Zully reventaba al nacer y — lo
  peor — la excepcion dejaba en pie al jefe del tablero anterior, asi que en
  Atlanta salia el astronauta.
- **2026-09-23** — El contorno de tinta se queda en **la mitad de grueso** (de
  10 a 5 px del lienzo): marcaba bien la silueta pero se comia el dibujo.
- **2026-09-23** — Los jefes se parten en **una base y uno por ciudad**
  (`JefeBase` + `entidades/jefes/`). Lo comun es la barra, el parpadeo y el
  aviso; lo propio, **como se le gana**, que es lo que hace que cada ciudad se
  juegue distinto. Deja de ser cierto que a todos se les da igual: lo que se
  mantiene es que **cualquiera de los dos ninos puede con todos**.
- **2026-09-23** — Space Coast estrena al **Astronauta Burbuja**: solo se le
  puede dar cuando se queda atascado tras su pisoton. Las pruebas del jefe pasan
  a esperar **su ventana** (`esperarJefeExpuesto`) en vez de dar por hecho que
  esta siempre expuesto; las que miden otra cosa (la meta, el recorrido entero)
  lo derrotan de un tiron, que si no se quedaban en bucle golpeando en vano.
- **2026-09-23** — El tinte de aviso **no se anima con un tween**: es un color,
  no un numero. Animandolo se quedaba pegado y el jefe salia de un solo color,
  como un muneco de plastico.
- **2026-09-23** — El juego estrena **historia**: "La gran fuga del bano". Los
  textos viven todos en `config/historia.js`, las vinetas las pinta
  `EscenaRelato` y cuando sale cada una lo decide `sistemas/cuento.js`. Ninguna
  regla cambia; cambian los textos.
- **2026-09-23** — `EscenaRelato` se **reutiliza** encadenandose consigo misma
  (la intro llama a la tarjeta de ciudad), asi que todo su estado se rearma en
  `init()`. Al principio no se rearmaba la bandera de "ya me estoy yendo" y la
  segunda tanda de vinetas nacia sorda: no respondia a ninguna tecla.
- **2026-09-23** — La pantalla de entrada enseña el **tablero de los mejores**
  debajo de la caja de empezar, y se le quitan los controles: se aprenden
  jugando, que el primer tablero los va diciendo con sus carteles segun hacen
  falta.
- **2026-09-23** — Space Coast y Medellin estrenan su **primer plano propio**.
  Para recortarlos hizo falta un modo nuevo en la herramienta: comparar el
  **color exacto** en vez del tono, porque las hojas de las palmeras son del
  mismo verde que la lamina y por tono se las comia el recorte, dejando solo el
  tronco.
- **2026-09-23** — Un golpe deja al nino **donde estaba**, parpadeando, en vez
  de devolverlo al checkpoint. Al checkpoint se vuelve solo al quedarse sin
  corazones o al caer por un hueco.
- **2026-09-23** — **Fuera el desenfoque de los fondos.** Con el lienzo a mas
  pixeles y el contorno de tinta separando lo de delante, ya no hace falta
  emborronar la ilustracion para que se distinga el juego.
- **2026-09-23** — Todo dibujo recortado lleva ahora **contorno de tinta** por
  fuera, y los banderines de checkpoint y las puertas de salida van al **doble
  de tamano**, que pequenos no se leian. Ver la seccion 10.
- **2026-09-23** — Entran **corazones y vidas**. Cada golpe quita un corazon (se
  empieza con cinco por tablero); sin corazones se pierde una vida (tres por
  partida) y al perder la ultima se acaba. Sigue sin haber castigo fuerte: al
  perder una vida se sigue desde el checkpoint con los corazones repuestos.
- **2026-09-23** — El jugador **escribe su nombre al entrar** y ese nombre es el
  identificador de la sesion. Se teclea dentro del juego, letra a letra, y no
  con un cuadro del navegador: asi no se sale del juego ni sale un teclado con
  otra tipografia.
- **2026-09-23** — El tablero de puntajes guarda **solo diez**. Del puesto once
  para abajo se borra, que era justo lo que pidio Daniel para no llenar la
  memoria de partidas cortas que ya no le importan a nadie.
- **2026-09-23** — El azar de los regalos (que un bicho suelte corazon, que una
  paloma deje vida) se guarda en la escena y no se lee de la constante: con el
  azar suelto, medir en una prueba cuantas monedas da un bicho era echarlo a
  cara o cruz.
- **2026-09-23** — Entran los dibujos de verdad para el premio (sushi, igual
  para los dos), el bloque que lanza Samaon, las banderas de los checkpoints y
  la puerta de salida. Las banderas son la del **pais de cada ciudad** (Medellin
  y Cartagena, Colombia; las otras tres, Estados Unidos) y van **translucidas**
  hasta que se tocan.
- **2026-09-23** — Cuidado con los cuerpos **estaticos** (premios, checkpoint,
  meta): al cambiarles el tamano con `setDisplaySize` hay que llamar despues a
  `refreshBody()`, o el cuerpo se queda con el tamano de la TEXTURA. Los premios
  se recogian desde media pantalla y el checkpoint estaba 107 px descolocado de
  su bandera. Y en un cuerpo estatico, `setSize` va en pixeles de pantalla, sin
  dividir por la escala, al contrario que en los dinamicos.
- **2026-09-23** — El tablero pasa a **12 filas**. Con 11 el terreno acababa en
  352 px y la pantalla mide 360: abajo del todo quedaba una franja negra. La
  camara, en cambio, se queda con el alto de la pantalla, para que no baje a
  mirar el subsuelo de mas y descoloque el HUD.
- **2026-09-23** — Los bloques que lanza Samaon salian enormes: el tween que los
  hace aparecer los llevaba a escala **1**, y la escala natural de un objeto con
  textura generada es `1 / densidad`. Mismo cuidado en el checkpoint y la meta.
  Para eso esta `escalaDeJuego()`.
- **2026-09-23** — El jefe salia del doble de grande: usa una textura dibujada
  por codigo y era el unico que no le fijaba el tamano con `setDisplaySize`, asi
  que se llevaba la textura entera, que se genera a la densidad del render. Su
  caja tambien se corrigio, que se mide en pixeles de textura y luego se escala.
- **2026-09-23** — Los fondos se quedan con sus rotulos y logotipos tal cual. El
  juego es un regalo para Martin y Simon, sin fin comercial, y taparlos con
  palomas convertia a las palomas en las protagonistas del cuadro. El mecanismo
  de parches sigue en `preparar-fondos.mjs` por si hiciera falta.
- **2026-09-22** — La ventana del juego baja a **640 x 360**. Es la forma limpia
  de que todo se vea al doble de grande sin tocar la casilla ni la fisica: solo
  se ve menos mundo, mas grande. Los textos y los paneles se reescalaron a mano.
- **2026-09-22** — El tablero pasa a tener **tres alturas** y una franja libre
  arriba para los voladores. Los cinco mapas se rehicieron con esa estructura.
- **2026-09-22** — Los personajes pasan a **86 px**, los bichos a la misma altura
  y el jefe a **172**, el doble. Al agrandarlos, la katana y los bloques, que
  salian a la altura del pecho, pasaban por encima de los bichos; ahora la zona
  de golpe va del pecho a los pies.
- **2026-09-23** — Los bichos pasan a ser **baneras con ojos** que, ademas de
  caminar, se agachan y saltan tirando agua con jabon. Y aparece la **paloma**,
  que cruza la franja de arriba y suelta lo suyo. Los dos hacen dano como
  cualquier golpe: no hay muerte en este juego, se vuelve al checkpoint y cuesta
  tres monedas.
- **2026-09-23** — La frecuencia con la que atacan bichos y palomas **se acorta
  segun el nivel**: el primer tablero es un paseo y el ultimo no.
- **2026-09-23** — Cada pose se escala con el factor de **su archivo de origen**,
  no uno comun para todo el personaje. Dentro de una hoja, que una pose sea mas
  alta que otra es la animacion y hay que conservarlo; entre archivos distintos
  es solo el encuadre del dibujante. Con un factor comun, Martain media 240 px
  quieto y 100 corriendo: cambiaba de tamano al echar a andar.
- **2026-09-23** — Las poses se apoyan por el **pie del muneco**, que es la
  mancha conectada mas grande del dibujo, y no por el borde de abajo del
  recuadro. El recuadro incluye la sombra y la salpicadura, y alinear por el
  dejaba al bicho flotando en las poses que las llevan.
- **2026-09-23** — Los bichos se colocan en el mapa **apoyados en el suelo de su
  casilla**, como el jefe, y no centrados en ella. Centrarlos daba igual mientras
  midieran 32 px; al crecer hasta la altura de los ninos, su caja acababa 25 px
  por debajo del suelo y la fisica los dejaba medio enterrados o caminando por
  el aire.
- **2026-09-23** — Los dibujos de los bichos y de la paloma **miran a la
  derecha**, asi que se voltean al ir hacia la izquierda (`setFlipX(dir < 0)`),
  igual que los ninos. Estaba al reves y cruzaban la pantalla de espaldas. Al
  jefe le pasaba lo mismo: sus pupilas tambien miran a la derecha.
- **2026-09-23** — Se aplasta a un bicho si se le cae encima y los pies quedan en
  su **mitad de arriba**. Antes se pedian 16 px justos desde la coronilla: con
  los bichos a la altura de los ninos era casi imposible acertar y el salto
  acababa en choque de lado.
- **2026-09-23** — Al volver al checkpoint **se despeja el terreno**: se borra lo
  que haya en vuelo y los bichos que alcanzan hasta alli se toman un respiro. Sin
  eso, con un checkpoint al alcance de una banera, el nino reaparecia justo para
  recibir el siguiente chorro. En un juego sin vidas eso es un callejon sin
  salida, no una dificultad.
- **2026-09-23** — La hoja de la banera pasa a venir sobre **verde liso** en vez
  del damero gris: entre las piernas del bicho quedaban restos de cuadros. El
  recorte detecta solo que clase de fondo tiene cada original mirando las cuatro
  esquinas, y con fondo liso lo quita **por tono**, no por color exacto, para
  que la sombra del suelo (el mismo verde mas oscuro) se vaya tambien. Lo que no
  tiene color (porcelana, metal, contorno) nunca se toca.
- **2026-09-23** — Los huecos del suelo pasan de tres casillas a **dos**, en los
  cinco tableros. `validar-niveles.mjs` comparaba el hueco con el alcance del
  salto (96 < 131) sin contar que el nino ocupa 30 px: ahora lo cuenta y da
  error. Los 21 huecos de tres casillas que habia eran saltos de milesimas.
- **2026-09-23** — Al recortar sprites, la tolerancia de color es **por
  personaje**: el damero de la banera es gris puro y su espuma casi tambien, asi
  que con la tolerancia de siempre la espuma se iba con el fondo. Ademas, todas
  las poses de un personaje se escalan con **un mismo factor**: si cada una se
  escalara a su altura, en un aleteo el bicho encogeria y creceria.
- **2026-09-22** — La barra de vida del jefe va sobre una chapa oscura: sueltos,
  sus puntos rojos se confundian con los premios, que tambien son rojos.
- **2026-09-22** — Cuidado con `setScale` en los personajes: sus texturas son
  lienzos de 260 px, asi que "escalar un poco" los hacia gigantes en los menus.
  Se fija el tamano en pixeles con setDisplaySize.
- **2026-09-22** — La casilla de suelo **no lleva marco completo**, solo una linea
  arriba: como el terreno se dibuja repitiendo esa casilla, un marco entero
  convertia el suelo en una cuadricula.
- **2026-09-22** — `vite.config.js` usa `base: './'` (rutas relativas). Es lo que
  permite que el juego funcione en una subcarpeta como
  `usuario.github.io/aventura-martin-simon/`.
- **2026-09-23** — Los cinco tableros **se alargan**, de 4-5 pantallas a entre
  6 y 9. Para poder hacerlo sin recolocar nada a mano, el generador deja de
  pintar columna a columna y pasa a componer cada tablero como una **lista de
  tramos y huecos**, con un **motivo** por tramo. Alargar un tablero es anadirle
  motivos. De paso pasan a tener **tres checkpoints**, que con esa longitud dos
  quedaban muy lejos uno de otro.
- **2026-09-23** — La **arena del jefe es la pantalla entera**: las 20 ultimas
  columnas del tablero (20 x 32 = 640 px), con el suelo seguido y sin un solo
  hueco, detras del ultimo checkpoint. Como no queda tablero por detras, la
  camara ya no puede avanzar y la pelea se ve completa y quieta, como el
  escenario de un teatro. Antes la arena era un tramo corto y la camara seguia
  moviendose durante la pelea.
- **2026-09-23** — El primer tramo de cada tablero **no lleva bichos**: es para
  aprender a andar y a saltar. Con uno cerca de la salida, la prueba del salto
  fallaba porque al nino le llovia agua jabonosa mientras saltaba, y eso, mas
  que una prueba rota, era un arranque injusto.
- **2026-09-23** — Con los tableros largos, el navegador de las pruebas (que
  dibuja por software, sin tarjeta grafica) va mas despacio, y las pruebas que
  esperaban **un tiempo de reloj** se quedaron cortas: la paloma no habia
  llegado todavia y a Dona Zully no le habia dado tiempo a mojarse. Se esperan
  sucesos, no segundos, que es la regla que ya valia para el movimiento. Y las
  cuentas de bichos y premios dejan de ser numeros fijos: se miden contra lo que
  tenga el tablero, para que retocar un nivel no rompa media suite.
- **2026-09-24** — Medellin estrena **el gato de la hinchada**, llorando porque
  Martain le mocho la cola. Va con su bocadillo: el gato y el bocadillo son un
  solo dibujo (las orejas se le montan encima, no hay recuadro que los separe)
  y ademas el chiste es el bocadillo, asi que se le da mas alto que a los demas
  adornos para que las dos lineas se lean al pasar.
- **2026-09-24** — El gato va en **su propia entrada** de
  `preparar-sprites.mjs`, no como una hoja mas de `frente`: la altura del
  lienzo se reparte entre TODOS los grupos de un personaje, asi que meterlo ahi
  habria encogido a las palmeras y a los buses. Y la herramienta acepta ahora
  **nombres** (`node herramientas/preparar-sprites.mjs gato`) para rehacer solo
  uno: rehacerlos todos por un dibujo nuevo es lento y vuelve a tocar arte que
  ya estaba bien.
- **2026-09-24** — **En la arena del jefe no se planta ningun adorno de
  delante.** Al final del tablero la camara ya no avanza, asi que el adorno se
  queda clavado en mitad del cuadro: el gato salio justo encima del jefe de
  Medellin y lo tapaba entero. Vale para las cinco ciudades.
- **2026-09-24** — Los dos buses de Medellin se cambian por **una sola chiva**,
  la que dibujo Daniel camino del estadio. Va dos veces en la lista, a distinto
  tamano y a distinto paso, para que se lea como dos chivas a distinta
  distancia y no como la misma calcada. El gato baja al **65%** (de 190 a 124):
  a 190 se comia a las baneras cuando se cruzaban.
- **2026-09-24** — Entran los **tres jefes que faltaban**, y con ellos las cinco
  ciudades quedan con el suyo: el **Carrotanque** de Medellin (embiste, y lo
  paran los materos de los balcones), el **Salvavidas** de Miami (salta de torre
  en torre y solo se le da cuando baja) y el **Capitan Tapon** de Cartagena, el
  final (se le gana quitandole el tapon mientras recarga). Doña Zully pasa a ser
  la de Atlanta tambien en los textos del cuento, que se habian quedado atras.
- **2026-09-24** — "Estar en la arena del jefe" deja de medirse **por distancia
  al jefe** y pasa a medirse por **los bordes de su arena**
  (`bordesDeLaArena`). Los que se mueven se alejaban ellos solos del nino, se
  quedaban "sin nadie cerca" y dejaban de pelear en mitad del combate: al
  Salvavidas le pasaba cada vez que saltaba a la torre del extremo, y se comia
  el 76% de la pelea plantado. Ademas, el jefe **ya no se sale de su arena**: el
  suelo sigue hacia atras por el porche del checkpoint, y metiendose ahi se
  llevaba la pelea fuera de su propia pantalla.
- **2026-09-24** — Los golpes **no cortan la ventana** del Salvavidas ni la del
  Capitan: mientras esta abierta se puede dar dos o tres veces, con el parpadeo
  de por medio. Cortandola al primer golpe, ocho vidas salian a mas de un minuto
  de pelea y cinco tapones a casi otro tanto. Asi las tres peleas nuevas caen
  entre 10 y 25 segundos, que es lo que ya duraban las dos que habia.
- **2026-09-24** — Un jefe con arte propio (Zully) cabe en su dibujo, pero los
  que se dibujan por codigo miden **172 px**, media pantalla. Al Salvavidas hubo
  que separarle bien el sitio de la torre del sitio del suelo: con 26 px de
  diferencia, "esta arriba y no le llego" y "ha bajado, dale" se veian igual.
- **2026-09-24** — Medellin estrena **guayacan y casa de pueblo** dibujados por
  Daniel. El guayacan reemplaza al que salia de la hoja de adornos y sale
  ademas **detras**, de decorado, junto con la chiva y la casa. La chiva baja al
  75% y el gato sube al 110%. El plano de **detras pasa a ir opaco**: no tapa a
  nadie, asi que la opacidad solo lo dejaba desvaido.
- **2026-09-24** — El recorte quita el fondo **entrando desde los bordes**, asi
  que las bolsas de fondo que quedan encerradas dentro del dibujo (entre las
  hojas de una palmera, detras de la baranda de un balcon, bajo el alero de un
  porche) se salvaban y quedaban de turquesa en mitad del recorte. Se limpian
  barriendo la lamina entera por color, pero eso **no se puede hacer siempre**:
  en la hoja de adornos las hojas de las palmeras son del mismo verde que el
  fondo y se las comeria. Por eso va por sabana (`limpiarBolsas`), y solo lo
  piden los dibujos que vienen sobre un turquesa que no aparece en el dibujo.
- **2026-09-24** — El plano de **detras** deja de nacer del borde de abajo y
  pasa a apoyar en la linea del suelo subida un 10%. Estan mas LEJOS que el
  suelo, no mas cerca: naciendo de abajo, el terreno se comia el tercio inferior
  de la casa y de la chiva y solo asomaban los tejados. Y llevan el contorno a
  la mitad, que con el de delante se veian recortados a tijera.
- **2026-09-24** — El lienzo de los recortes deja de ser 260 x 260 para todos:
  cada dibujo puede pedir el suyo (`lienzo`). La chiva se veia dentada y como
  lavada porque se muestra a 280 px de ancho y, a densidad 3, eso son 840
  pixeles de verdad sacados de una textura de 254. Los adornos grandes pasan a
  lienzos de 480-660 px, y **a webp**: en PNG pesaban 700 KB cada uno y asi se
  quedan en 140.
- **2026-09-24** — Pasarse los cinco tableros **tambien apunta el puntaje**.
  Solo se anotaba al quedarse sin vidas, asi que quien se lo terminaba entero
  —el que mas puntos hacia— no salia nunca en el tablero de mejores.
- **2026-09-24** — Entra el **toro**, el bicho intermedio: cruza el tablero
  corriendo y embiste al nino. Va en su propio grupo y no en el de los bichos,
  para que lo que cuenta enemigos en pantalla siga contando baneras; las pruebas
  lo apagan con `proximoToro`, que si no cruzaria corriendo en mitad de una
  medida. Y las palomas bajan de vez en cuando a la altura del segundo piso.
- **2026-09-24** — Las palomas entraban por el borde usando `camara.scrollX`
  tal cual, y con zoom eso no es la esquina izquierda de lo visible: a densidad
  2 aparecian de golpe ya dentro de la pantalla, en vez de venir de fuera. Se
  saca como en `Planos`. Mismo cuidado con los toros.
- **2026-09-24** — El decorado de detras apoya en la **linea del suelo**,
  hundido un pelin por detras del terreno. Subido un 10% por encima de esa linea
  se veia **volando**: son la ambientacion del pueblo, tienen que estar
  plantados. Entre esto, el contorno a la mitad, la opacidad quitada y los
  lienzos grandes, las medidas de esta capa quedan como **patron** para los
  recursos que vengan.
- **2026-09-24** — El decorado de pueblo pasa a estar en **las cinco ciudades**,
  el mismo, hasta que cada una tenga el suyo. Y `montarPrimerPlano` deja de
  elegir entre "los tuyos" o "los provisionales": ahora mira si la ciudad trae
  algo **de delante**, y si no, le completa los provisionales. Sin eso, darles a
  Atlanta, Miami y Cartagena solo el decorado de fondo las habria dejado sin
  nada delante.
- **2026-09-24** — La **barra de vida del jefe se veia desde la primera
  pantalla** del tablero, en una esquina y sin jefe a la vista. Fue culpa de
  sujetarla dentro de la pantalla (para que no se saliera por la derecha con el
  jefe en el borde de su arena): al sujetarla, quedaba visible siempre. Ahora se
  esconde si el jefe no esta en cuadro.
- **2026-09-24** — Space Coast estrena **su propio decorado de fondo**: la casa
  de Florida con el cocodrilo en el jardin, el jeep de los surfistas y el
  letrero del muelle. Se prepararon con las medidas que quedaron de patron para
  esa capa. Dos de las laminas venian sobre **blanco**: el blanco no tiene tono,
  asi que el detector no lo toma por "fondo liso de color" y hay que decirle a
  mano que compare el color exacto. La tercera venia sobre el damero de siempre
  y esa, al reves, NO puede ir por color exacto: solo se iria uno de los dos
  grises.
- **2026-09-24** — `limpiarBolsas` deja de barrer la lamina entera por color y
  pasa a buscar **manchas de fondo encerradas**, con un tamano minimo. Barrer
  por color a secas se comia los brillos blancos de un dibujo sobre fondo
  blanco; mirar manchas de pixeles opacos no sirve, porque la bolsa y el dibujo
  se tocan y salen como una sola. Asi se fue el damero que quedaba entre los
  postes del letrero sin tocar sus letras.
- **2026-09-25** — El toro pasa a ser **la vaca berrionda**, con dibujos de
  verdad: una Holstein de manchas amarillas y mala cara, en seis poses (dos de
  trote, una de aviso, dos de galope y una tumbada). Ya no se dibuja por codigo.
  Y con ella sale el cartel de **"¡CUIDADO CON LA BERRIONDA VACA!"**, porque a
  Martin lo persiguio una en la finca de los abuelos.
- **2026-09-25** — Al derribarla **se le dejan la gravedad y el suelo**. Con el
  cuerpo desactivado se quedaba flotando en el aire cuando la pisaban en pleno
  salto sobre un hueco, que es justo cuando mas se salta.
- **2026-09-25** — Si el lado por el que iba a entrar una vaca no tiene suelo
  (al principio y al final del tablero, uno de los dos cae fuera del mundo), ya
  no se pierde el turno: se prueba el otro lado y, si tampoco, se reintenta a
  los 900 ms. Antes salian **la mitad de veces** de lo que decian sus tiempos.
- **2026-09-25** — El recorte gana `esBolsa`, un test de fondo **mas ancho que
  el normal, solo para las bolsas encerradas**. Un hueco entre dos patas es casi
  todo halo del contorno: el JPG lo deja a 180-200 de distancia del turquesa del
  borde, fuera de la tolerancia, y se quedaba puesto. Solo se ensancha con fondo
  de color saturado; en damero y en fondo por tono, `esBolsa` es `esFondo`, que
  si no se comeria las gaviotas blancas de un letrero. El tamano minimo de una
  bolsa tambien se puede bajar por hoja (`bolsaMinima`).
- **2026-09-25** — La casita de Florida venia con **su propio cielo pintado**
  dentro, en un ovalo detras de la casa, y en el juego se veia como un parche
  azul delante de la ilustracion de la ciudad. El recorte gana `fondosExtra`:
  una hoja puede declarar OTROS colores que tambien son fondo, cada uno con su
  tolerancia. Las ventanas no corrieron peligro porque estan a mas de 170 de ese
  azul y, ademas, van por dentro de la casa, donde el relleno de los bordes no
  entra. Lo que NO se puede usar aqui es `limpiarBolsas`: con el blanco de fondo
  se llevaria por delante las columnas y los marcos, que son casi blancos.
- **2026-09-25** — **Los textos dejan de verse pixelados.** Phaser los rasteriza
  a 1x y la camara los amplia, asi que a densidad 3 se estiraban tres veces
  mientras las ilustraciones iban nitidas. Ahora todos se dibujan a
  `RENDER.densidad`. Habia un intento anterior con `register`, pero en Phaser 4
  registrar un nombre que ya existe **no lo reemplaza**: el envoltorio nunca se
  llamaba. Se parchea el prototipo de la fabrica.
- **2026-09-25** — La pantalla de **victoria se le salia el texto del panel**.
  Venian tres cosas apiladas en el mismo sitio: el "Total", el mensaje del
  marcador y el aviso de que el puntaje quedo apuntado, que se habia anadido
  como un letrero suelto encima. Ahora el aviso va DENTRO del mensaje, en una
  sola linea, y el bloque entero sube para que el menu no pise el panel: con
  tres opciones la primera caia justo encima del borde.
- **2026-09-25** — El marcador de Samaon decia **"bloques recogidos"** con un
  sushi dibujado al lado. Era el nombre viejo, de cuando cada nino tenia su
  premio; se volvio atras hace tiempo y esto se quedo sin cambiar.
- **2026-09-25** — En el panel de victoria, el **total** y la linea de cierre se
  separan un poco mas (de 64 y 84 a 60 y 86). No se montaban, pero el numero va
  a 25 px y casi rozaba el letrero de abajo, que es la misma sensacion de
  apelotonado que se venia a quitar.
- **2026-09-25** — La prueba de la vaca esperaba **40 vueltas de 55 ms** para
  verla embestir, y soltada a 460 px la vaca tarda dos segundos y medio largos
  en bajar la cabeza y arrancar: se quedaba en el filo y fallaba en cuanto el
  navegador iba lento. Se espera al **suceso**, no a un numero de vueltas, que
  es la regla que ya valia para el movimiento y para las palomas.
- **2026-09-25** — **Fuera el hilo de historia.** Se quitan las cuatro vinetas
  de apertura y las tres de despedida: el juego ya no narra un cuento, solo
  presenta cada ciudad con su resena antes de su tablero, que es donde luego ira
  su ilustracion de entrada. `empezarPartida` pasa a ser `empezarNivel` del
  primero y `terminarPartida`, un paso directo al marcador. `EscenaRelato` se
  queda como esta, aceptando varias vinetas aunque hoy le llegue una: es una
  escena de paso y no cuesta nada. Los textos de `INTRO` y `FINAL` se borran de
  `historia.js` (estan en el historial de git): dejar texto muerto en el sitio
  que es la unica fuente de la verdad es justo lo que nos colo el "bloques
  recogidos" de Samaon.
