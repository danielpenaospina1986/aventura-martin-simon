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
  NUBE.md               como encender el tablero compartido (Firebase)
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
      nube.js           la direccion del tablero compartido, y nada mas
    escenas/
      EscenaTitulo.js
      EscenaSeleccion.js
      EscenaMundos.js   a que mundo se va
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
      tactil.js         los botones en pantalla, para jugar en un telefono
      constructor-nivel.js  convierte el mapa de texto en objetos del mundo
      planos.js         el plano de delante de la camara multiplanar
      hud.js            monedas, corazones, vidas y nombre del personaje
      sesion.js         quien esta jugando (el nombre, hasta 10 letras)
      puntajes.js       el tablero de los diez mejores
      tablero-remoto.js el mismo tablero, pero en la nube
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
    validar-niveles.mjs comprueba que todos los niveles son terminables
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

### Los ocho mundos

**Los ocho tienen ya su arte y su jefe propios.** Ninguno queda en obra: cada
uno con su ilustracion de fondo, su guardian dibujado y lo que ese guardian
tira. Lo unico que sigue prestado en algunos son los adornos de los planos de
delante y de detras.

| # | Ciudad | Que es para ellos |
|---|---|---|
| 1 | Space Coast | Donde nacieron los dos. Aqui les sale al paso **Simon Malvado** |
| 2 | Medellin | La ciudad de sus papas, donde se criaron hasta los 5 y los 6 anos. Aqui les sale al paso **Papa Inodoro** |
| 3 | Atlanta | Donde viven ahora. Aqui les sale al paso **Dona Zully** |
| 4 | Miami | Las vacaciones de siempre, y la casa de la tia. Aqui les sale al paso **Martin Malvado** |
| 5 | Cartagena | El paseo que no se les olvida. Aqui les sale al paso **Jean Luke** |
| 6 | Orlando | El viaje de los parques. Aqui les sale al paso **el Tio Camilo** |
| 7 | Lake Lanier | El lago de los fines de semana. Aqui les sale al paso **Chad**, el chef |
| 8 | La finca | **El Refugio**, la finca ganadera de los abuelos en el Magdalena Medio. Aqui les sale al paso **el Abuelo** |

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

Volando **no choca con el terreno**: va por el aire. El choque solo cuenta
cuando ya la han derribado, que es cuando tiene que caer y quedarse en el suelo.
Con el choque siempre puesto, cualquier bloque alto le hacia de presa.

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
> cartel de **"¡CUIDADO CON LA BERRIONDA VACA!"**, en la caja art deco de la
> casa y clavado en pantalla, no en el mundo: es un aviso, tiene que poder
> leerse aunque la vaca ya venga lanzada.

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

### Y en cada mundo es otra cosa

La vaca es de **la finca**, que es de donde salio el cuento. En los demas
mundos el bicho **se comporta exactamente igual** —entra por un lado, se
planta, avisa, embiste y se derriba igual— pero es lo que de verdad te
atropellaria alli:

| Mundo | Que embiste |
|---|---|
| Space Coast | una **vaca marciana**, de tres ojos y antenas |
| Medellin | un **bus**: el blanco de *Comercial Hotelera* o el verde de *Circular Sur 303* |
| Atlanta | **Alma**, la pastora alemana de los ninos, que esta loca |
| Miami | **Melo**, el pastor australiano de un ojo azul y otro cafe |
| Cartagena | un **clasico de La Habana**: el descapotable, el sedan o la camioneta |
| Orlando | un **vagon de montana rusa** desbocado, con sus ninos dentro |
| Lake Lanier | **Alma** otra vez, que los fines de semana se va con ellos |
| La finca | la **vaca berrionda** de siempre |

Cada juego de dibujos es una **piel**: seis poses con los mismos nombres
(`anda1`, `anda2`, `avisa`, `embiste1`, `embiste2`, `tumbada`), en su carpeta de
`src/assets/bichos/`. Quien guarda cual va en `config/bichos.js`.

Una ciudad puede tener **varias y se sortean** (Medellin dos, Cartagena tres):
asi el tablero no se hace previsible sin dibujar una pelea nueva. Las pruebas
fijan cual sale (`escena.pielDeLosBichos`) para no medir a cara o cruz.

**Y cada piel trae SU cartel** (`AVISOS_DE_BICHO`, en `historia.js`): en Atlanta
viene Alma y dice "¡CUIDADO CON ALMA, QUE ESTA LOCA!", en Orlando "¡CUIDADO CON
LA MONTANA RUSA!". Avisar de una vaca cuando lo que viene es un perro no tiene
ninguna gracia. Va por **piel** y no por ciudad, porque una ciudad puede tener
varias. La caja se mide sobre el texto: con el ancho clavado en 400, al de Melo
—el mas largo— le quedaban dos letras fuera.

Las pieles **no se importan una a una**: `EscenaCarga` las recoge con
`import.meta.glob`, asi que anadir una es dejar su carpeta ahi y nombrarla en
`bichos.js`. Sesenta lineas de import a mano no las mantiene nadie.

### Los jefes

Al final de cada tablero espera un **guardian del bano**: mide **172 x 172**, el
doble que un nino, y mientras viva **la meta esta cerrada** y se dibuja apagada.
Hay un **checkpoint justo antes de su arena**, asi que pelear no castiga.

**Se le puede pisar desde el suelo.** El dibujo mide el doble, pero su caja no:
va por dentro, de 104 px de alto, igual que la banera. El salto sube 114 px, asi
que con una **carrerilla** el nino le pasa por encima de la cabeza y se le deja
caer; la plataforma de la arena sigue estando, pero ya no es la unica manera.
Ademas, **pasarle por encima subiendo no castiga**: solo cuenta lo que pase
bajando. Sin eso, el nino se metia en su caja mientras subia, se llevaba el
golpe antes de llegar arriba y no habia salto que valiera.

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
  antes, que si no nadie la lee) y otra al perder, de `config/historia.js`. La
  frase se **sujeta dentro de la pantalla**: el jefe pelea en el borde derecho
  de su arena y una frase larga se salia media por la derecha.
- Un jefe puede traer **dibujo de derrota** (`texturaDeDerrota`). El sprite se
  destruye en cuanto cae, asi que sin eso la pose no se llegaria a ver nunca: la
  escena deja la imagen un momento en su sitio mientras se va.
- **Los ocho tienen dibujos de verdad.** Los tres ultimos **comparten pelea**
  con uno de los cinco primeros —cada uno hereda de su clase— pero todo lo que
  se ve es suyo: sus poses, lo que tira y cuanto aguanta.

  | Jefe | Pelea como | Porque |
  |---|---|---|
  | el Tio Camilo | Jean Luke | lo pidio Daniel |
  | Chad | Martin Malvado | tira desde la torre y baja a burlarse |
  | Simon Malvado | Papa Inodoro | escupe, se enoja y embiste |

  Lo que cambia de un jefe al otro va en un solo bulto (`suyo`) que se pasa al
  constructor, porque las vidas y la caja hacen falta **dentro** del `super()`:
  la barra se monta ahi, y cambiarlas despues la dejaria con un puntito de
  menos. Si algun dia una pelea la comparten tres, se sube a una base propia;
  con dos, partirla seria inventarse una abstraccion de mas.
- Lo que **tira** un jefe no lo sabe la escena: lo dice el jefe, en su
  `municion` (que dibujo lleva quieto, en el aire y roto, y si al romperse echa
  chispas o burbujas). Vale para las tres familias de proyectil: los que salen
  rectos (`TIRO_DE_JEFE`), los que ruedan por el suelo (`RELLENO`) y los que van
  en arco y se estrellan (`HELADITO`). Las medidas del vuelo son las mismas
  dentro de cada familia, porque la pelea es la misma; lo que cambia es lo que
  se ve.

#### 1. Space Coast: Papa Inodoro

Una **cabeza saliendo de un retrete**, con la cara de Daniel. Es el primero de
los cinco: los guardianes del bano van a ser todos **versiones bizarras del
papa**, que es lo que le da la gracia al chiste de un juego sobre escaparse del
bano. **Aguanta cuatro golpes.**

Hace dos cosas, las dos con aviso:

- **Escupe heladitos de chocolate** (si, por lo que parecen). Salen en arco, dan
  tumbos y se estrellan contra el suelo dejando su mancha. Solo hacen dano en el
  aire: la mancha ya no toca a nadie.
- Cuando se harta, **se enoja** —cara roja y vapor por las orejas— y **embiste**
  de lado a lado.

Al final de la embestida **se estampa y se queda aturdido** unos segundos, y
**esa es la unica ventana** para darle: pisandolo, con la katana o con un
bloque. Fuera de ella el golpe rebota con un ¡clonc! y no cuenta. Los golpes
**no le cortan la ventana**, asi que en una caben dos o tres.

Sus dibujos son de verdad (`src/assets/jefes/inodoro/`): ocho poses de el
—quieto, brinco, escupe, enojado, embiste, aturdido, golpe y derrotado— y tres
del heladito (volando, dando tumbos y estrellado).

#### 2. Medellin: el Abuelo

El abuelo baja de la finca en su **pickup doble cabina gris**, con el tanque de
agua en el platon y la idea muy clara de banar a sus nietos. Sombrero vueltiao y
poncho, para que no haya duda de quien es. Ronda su arena, avisa acelerando en
el sitio, y **embiste** de lado a lado; al chocar se queda resoplando unos
segundos, que es la unica pausa que da. **Aguanta cuatro canastillas.**

**A el no se le pega**: los golpes rebotan con un ¡clonc!. Lo que lo para son
las **canastillas de fruta** de los balcones —las canastillas de plastico de los
mercados, rebosando mango, banano y naranja—, que cuelgan por encima de la
cabeza del nino. Se les da desde abajo —con la katana, con un bloque o con un
cabezazo en pleno salto, las tres valen— y caen rectas, con una **sombra** en el
suelo que avisa donde. Si una le cae encima, abollon.

Cuelgan a la altura justa (`CANASTILLA.altura`): por encima del nino de pie,
pero al alcance de un salto. Por eso la pelea no pide habilidad ninguna. Cuando
una se rompe **sale otra en su sitio** a los pocos segundos: quedarse sin
canastillas seria quedarse sin pelea.

Al cuarto se vara, enterrado en fruta.

Sus dibujos son de verdad (`src/assets/jefes/abuelo/`): seis poses de el
—ronda, avisa, embiste, resopla, golpe y derrotado— y tres de la canastilla
(colgando, cayendo y reventada). Es el unico jefe **apaisado**: una camioneta no
cabe en el cuadrado de los demas, asi que mide 204 x 136 en vez de 172 x 172.

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

#### 4. Miami: Martin Malvado

La **version mala de Martain**: el mismo nino, pero metido en un disfraz de oso
de peluche viejo, roto y remendado, por el que se le sale el **relleno
amarillo**. Se pasa la pelea subido a las **torres de vigia** de la playa,
tirando **pegotes de relleno** que ruedan por la arena y hay que saltar.
**Aguanta ocho golpes.**

Arriba no se le llega. Cada dos pegotes **baja** a burlarse, y ahi vale
cualquier golpe: pisarlo, la katana o un bloque. Los golpes **no le cortan la
bajada**: mientras esta abajo se le puede dar varias veces, con el parpadeo de
por medio. Cortandola al primero, aguantar ocho salia a mas de un minuto.

Es la pelea mas larga de las cinco, y por eso es en la que mas corazones caen.
Al octavo se queda desinflado, como un peluche pinchado, entre su propio
relleno.

Sus dibujos son de verdad (`src/assets/jefes/malvado/`): seis poses de el
—vigila, tira, salta, baja, golpe y derrotado— y tres del pegote (entero,
rodando y desparramado). Las **torres** siguen dibujadas por codigo: son lo
unico de esa arena que no tiene arte propio.

Las torres son **decorado**: nadie se sube a ellas, pero marcan por donde va a
saltar, que es lo que hace la pelea legible. Al subirse se pone **claramente**
mas alto que en el suelo: mide 172 px y, con poca diferencia, "esta arriba, no
le llego" y "ha bajado, dale" se veian igual.

#### 5. Cartagena: Jean Luke

El jefe final: el **nino maton** de la playa. Gordo, colorado y fanfarron, con
su camiseta de rayas celestes y un balde lleno de **globos de agua**. **Aguanta
cinco.**

Marcha por su arena y **tira globos**; cuando se le acaban, se agacha **de
espaldas sobre el balde** a buscar mas, y ahi se queda desprevenido. Un golpe en
ese momento —pisandolo, con la katana o con un bloque— y se lleva el susto. El
golpe no le corta la recarga, asi que en una ventana caben dos. Cada golpe lo
pone mas nervioso: al volver a la marcha tarda menos en apuntar.

Es el final y tiene su gracia: al ultimo se sienta en el suelo **a llorar y a
llamar a su mama**, empapado con sus propios globos.

Sus dibujos son de verdad (`src/assets/jefes/jeanluke/`): seis poses de el
—marcha, apunta, tira, recarga, golpe y derrotado— y tres del globo (entero,
volando y reventado).

#### 6. Orlando: el Tio Camilo

Un **diablo colorado y barrigon con la cara del tio**: cachos, rabo de punta de
flecha, zapatones y el escudo de su equipo en la barriga. Ronda su arena con un
costal de balones al hombro y los tira **en llamas**. **Aguanta seis.**

Se le gana **igual que a Jean Luke**, y por eso `TioCamilo` hereda de el: marcha
y tira; cuando se le acaban los balones se agacha **de espaldas sobre el
costal** a buscar mas, y ahi se queda desprevenido. Un golpe en ese momento
—pisandolo, con la katana o con un bloque— y lo encaja. Al sexto se sienta a
llorar, empapado.

Que herede de Jean Luke y no de `JefeBase` es a proposito: la pelea es **la
misma**, hasta en los tiempos, y lo unico suyo son sus dibujos, lo que tira y
cuanto aguanta. Todo eso se le pasa al constructor en un solo bulto (`suyo`),
porque las vidas hacen falta **dentro** del `super()`: la barra se monta ahi y
cambiarlas despues la dejaria con un puntito de menos. Si algun dia sale un
tercero con esta pelea, esto se sube a una base propia; con dos, partirlo seria
inventarse una abstraccion de mas.

Aguanta uno mas que Jean Luke porque Orlando va despues de Cartagena y tiene que
notarse, pero sin pasarse: ocho ya se hacia largo cuando se probo con Martin
Malvado.

Sus dibujos son de verdad (`src/assets/jefes/camilo/`): seis poses de el
—marcha, apunta, tira, recarga, golpe y derrotado— y tres del balon (entero,
volando y apagado).

#### 7. Lake Lanier: Chad

El chef del lago: gafas oscuras, toque, delantal manchado y un sarten en la
mano. Se pasa la pelea subido a las **torres de vigia** tirando **panqueques**,
que ruedan por la orilla y hay que saltar. **Aguanta ocho.**

Se le gana **igual que a Martin Malvado**, y por eso `Chad` hereda de el:
arriba no se le llega, y cada dos panqueques **baja** a burlarse, que es cuando
vale cualquier golpe. Los golpes no le cortan la bajada.

Sus dibujos son de verdad (`src/assets/jefes/chad/`): seis poses de el —vigila,
tira, salta, baja, golpe y derrotado— y tres del panqueque (entero, girando y
aplastado en su charco de miel).

#### 8. La finca: Simon Malvado

Un nino regordete con el pelo largo y **cara y cuerpo de muneco de piezas de
armar**. Un malcriado de manual, que se defiende **tirando juguetes**.
**Aguanta cinco.**

Se le gana **igual que a Papa Inodoro**, y por eso `SimonMalvado` hereda de el:
ronda dando brinquitos y tira juguetes en arco; cuando se harta **se enoja** y
**embiste** de lado a lado, y al final de la embestida se estampa y se queda
**aturdido**. Esa es la unica ventana. Al quinto se desarma en el suelo.

A diferencia de Papa Inodoro, lleva la **caja de casa** (`JEFE.caja`) y no la
estrecha: el es un muneco y ocupa su lienzo a lo ancho, mientras que el retrete
dejaba un palmo de aire a cada lado.

Sus dibujos son de verdad (`src/assets/jefes/simonmalvado/`): ocho poses de el
—quieto, brinco, escupe, enojado, embiste, aturdido, golpe y derrotado— y tres
del juguete (volando, dando tumbos y reventado).

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
| Derrotar a un jefe | **+100, y 20 mas por cada mundo mas dificil** |

Un jefe paga **muchisimo mas** que todo lo demas, porque cuesta muchisimo mas:
el premio gordo de una partida es ganarle a uno. Y como no cuestan lo mismo,
tampoco pagan lo mismo:

| Mundo | Jefe | Paga |
|---|---|---|
| 1 Space Coast | Papa Inodoro | +100 |
| 2 Medellin | el Abuelo | +120 |
| 3 Atlanta | Dona Zully | +140 |
| 4 Miami | Martin Malvado | +160 |
| 5 Cartagena | Jean Luke | +180 |
| 6 Orlando | el Tio Camilo | +200 |
| 7 Lake Lanier | Chad | +220 |
| 8 La finca | Simon Malvado | +240 |

Lo calcula `premioDeJefe(indice)`, en `ajustes.js`. Lo que han pagado los jefes
se guarda aparte (`jugador.puntosDeJefes`), porque desde que cada uno paga lo
suyo el marcador final ya no puede sacarlo multiplicando.

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
titulo -> quien juega -> personaje -> MUNDO -> nivel -> victoria
                                                 |        |-> siguiente nivel
                                                 |        |-> elegir otro mundo
                                                 |        |-> cambiar personaje
                                                 |-> sin vidas -> fin de partida
```

### Elegir mundo

**Todos los mundos estan abiertos desde el principio**: la gracia no es
desbloquearlos, es poder volver al que mas guste y seguir sumando. Se elige
despues del personaje, y tambien desde la pantalla de victoria ("Elegir otro
mundo"), que **se lleva el marcador**: asi se puede seguir jugando despues de
pasarselos todos.

Se ensena **UNO SOLO, grande**, y se pasa de uno a otro de tres maneras: las
**flechas de los lados**, **deslizando el dedo** o las **flechas del teclado**.
Arriba dice por cual se va (**"Mundo 4 de 8"**) y abajo hay una fila de
**puntitos**, uno por mundo, para saber donde se esta sin tener que leer. Se
entra **tocando la tarjeta** (o con Enter).

Antes salian los ocho a la vez, en rejilla de cuatro por fila. Con cinco mundos
aquello se leia; con ocho, cada tarjeta se quedaba en 104 x 68 px y en un
telefono no habia forma ni de verlas ni de acertarles con el dedo. **Mas vale
ver uno bien que ocho mal.**

La tarjeta es la **ilustracion de fondo de esa ciudad**, recortada al trozo de
en medio, con el nombre en su cinta, **lo que paga su jefe** en una chapita
arriba —que es lo que invita a meterse en los dificiles— y de quien es la arena
debajo.

Deslizar y tocar se deciden **al levantar el dedo**, no al apoyarlo: hasta
entonces no se sabe si aquello era un toque o un arrastre. Se pide ademas que el
gesto sea **mas horizontal que vertical**, o bajar el dedo por la pantalla
cambiaria de mundo sin querer.

Ojo: el recorte se hace con **`setCrop`, no con una mascara**. En Phaser 4
`setMask` no funciona con WebGL: avisa por consola y dibuja la lamina entera,
que se sale por toda la pantalla.

En **quien juega** se teclea el nombre (hasta 10 letras), que hace de
identificador de la sesion: es lo que se apunta en el tablero de mejores
puntajes. Se guarda en el navegador para no escribirlo cada vez.

### Cuando se apunta un puntaje

**Todo el rato.** Una partida se apunta al **acabar cada mundo**, al **quedarse
sin vidas** y al **salirse al menu** desde la pausa. Antes solo lo primero y lo
ultimo del todo, y pasaba lo que tenia que pasar: los ninos jugaban una tarde
entera, ni se morian ni se pasaban los cinco de un tiron, y no quedaba rastro de
nada. Esto importa de verdad: de este tablero depende el premio que Daniel les
puso para diciembre.

Para que una partida no llene el tablero con sus pasos intermedios, cada una
lleva su **identificador** (`nuevaPartida()`, en `puntajes.js`) y todas sus
anotaciones **actualizan su propia fila** en vez de anadir otra. Se queda con el
puntaje **mas alto** que haya hecho, no con el ultimo.

Y se **dice en pantalla**: la ultima linea del panel de victoria es siempre
"Apuntado como NOMBRE · N.º del tablero". Antes ahi iba una gracia del marcador,
pero esto importa mas y en dos lineas no cabia.

El **tablero de mejores puntajes** guarda solo los **diez** mejores: en cuanto
entra uno nuevo, el que queda en el puesto once se borra, para no ir llenando el
navegador de partidas viejas.

### Un solo tablero, en la nube

Hay **dos tableros**, y `puntajes.js` los hace parecer uno:

- **El de casa** (`localStorage`), que es el que se pinta. Es instantaneo y
  funciona sin internet, asi que el juego **nunca espera a nadie**.
- **El de la nube** (`tablero-remoto.js`), que es el de verdad: el mismo desde
  el telefono, desde el portatil y desde donde sea.

Se apunta **siempre en los dos**: lo de casa al momento, lo de la nube por
detras. Cuando la nube contesta, `sincronizarTablero()` funde lo que trae con lo
de casa y avisa a quien lo este pintando para que lo repinte. Por eso las
pantallas que lo ensenan (titulo, quien juega y fin de partida) lo pintan **dos
veces**: primero con lo que sabe el equipo y luego con lo que sabe todo el
mundo.

Fundir es quedarse con **una fila por partida**, la del mejor puntaje que se le
conozca, venga de donde venga (`fundirTableros`). Es la misma regla que ya valia
dentro de un equipo, aplicada a los dos tableros.

Es una base de datos en tiempo real de **Firebase**, y se le habla **por REST,
con `fetch` pelado**: nada de SDK, que son dos llamadas contadas y el juego ya
pesa lo suyo con Phaser dentro. Como clave de cada fila va el identificador de
la partida, asi que lo de "una partida, una fila" sale gratis.

Tres reglas que no se tocan:

1. **Nunca revienta.** Sin internet, con el wifi malo o con Firebase caido, se
   sigue jugando y se ve el tablero del equipo. Un tablero es un adorno; que un
   nino no pueda jugar por eso, no.
2. **Nunca hace esperar.** Todas las llamadas llevan plazo (`NUBE.esperaMs`, 6
   segundos) y se cortan solas.
3. **Lo que no sube, no se pierde.** Se queda en una cola en el navegador y se
   reintenta a la siguiente. De este tablero depende el premio de diciembre:
   perder la tarde de un nino porque se cayo el wifi no es aceptable.

**Sin direccion configurada todo esto esta apagado** y el juego funciona como
funcionaba, con el tablero de cada equipo. Como encenderlo (y el reglamento que
hay que pegar en Firebase) esta en `NUBE.md`; la direccion, en
`src/config/nube.js` y en ningun otro sitio.

Las **pruebas automaticas no hablan con la nube nunca**: abren el juego con
`?nube=0`. Si no, cada pasada de la suite dejaria partidas inventadas en el
tablero de verdad de los ninos. Hay una prueba que vigila justo eso.

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

En un telefono, todo eso se hace con los **mandos en pantalla** (ver mas abajo).

El mapeo vive en `src/sistemas/controles.js`, hecho por **perfiles de jugador**, para
que agregar un segundo jugador simultaneo sea anadir un perfil, no reescribir nada.

### Con el dedo

En un telefono salen **mandos en pantalla** (`src/sistemas/tactil.js`): abajo a
la izquierda, los dos botones de **andar** (izquierda y derecha); abajo a la
derecha, **saltar** (el grande, con el triangulo) y **atacar** (el de la
estrella). Arriba en medio, uno pequeno de **pausa**, que sin tecla Esc no
habria forma de salir del tablero.

Son pequenos y translucidos a proposito: tienen que estorbar lo menos posible.
Hubo un joystick al principio, pero se comia un cuarto de la pantalla para hacer
lo que hacen dos botones, que en este juego solo se anda a izquierda y derecha.

- Salen solos si el aparato se maneja con el dedo. Se pueden forzar con
  `?tactil=1` (para probarlos en el ordenador) o apagar con `?tactil=0`.
- **No son un mando aparte**: le aprietan a `Controles` las mismas acciones que
  las teclas (`tocar`), asi que el juego no se entera de por donde le llegan. Un
  mando de verdad o un segundo jugador se anadirian igual.
- Van **sujetos a la pantalla** como el HUD, y por eso entran en el mismo
  `planos.fijar`: `setScrollFactor` no se lleva con el zoom.
- Se piden **tres punteros** (`input.addPointer`): con uno solo no se puede
  correr y saltar a la vez, que es media partida.
- El area que responde es **mas ancha que el circulo dibujado**
  (`TACTIL.margenBoton`): los dedos son gordos y fallar un boton en pleno salto
  se paga. Ojo con subirlo: si las areas de los dos de andar se solapan, el de
  la izquierda se come al otro.
- **Deslizar el pulgar de un boton al de al lado cambia de boton**, sin levantar
  el dedo. Los ninos no levantan el dedo: lo arrastran.
- Los de la derecha y el de pausa se colocan **contra su borde**, no en una x
  fija: en un telefono la pantalla del juego es mas ancha de 640 (ver la
  seccion 8bis).
- **Ningun texto habla de teclas.** Todo lo que decia "pulsa Enter", "Esc
  volver" o "Flechas para moverte" dice otra cosa con el dedo ("Toca para
  empezar", "Toca al que quieras"), y la linea de "Esc pausa / H cajas" no sale:
  ademas de sobrar, ese rincon es justo donde cae el boton de saltar. Lo reparte
  `segunElMando(conTeclado, conDedo)`, en `tactil.js`. **En el ordenador no
  cambia nada**: se sigue jugando y leyendo igual que siempre.
- En la **seleccion de personaje** se toca la TARJETA ENTERA, no el nombre de
  abajo: apuntarle con el dedo a una linea de 18 px no hay quien lo haga, y lo
  natural es tocar al nino que uno quiere. Con el raton hace lo de siempre:
  pasar por encima lo resalta y el clic lo elige.
- En la pantalla de **quien juega** sale un **teclado en pantalla** con las
  letras, la ene incluida, y ESPACIO / BORRAR / LISTO. Sin el, en un telefono no
  se podria pasar de ahi.
- De pie, el juego queda en una franja diminuta, asi que sale un cartel de
  **"gira el telefono"**. Es CSS puro, con `(orientation: portrait) and (pointer:
  coarse)`, asi que en un ordenador con la ventana alta no aparece.

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

### Los ocho tableros

Cada tablero es una **ciudad**, con su propio fondo ilustrado:

| # | Ciudad | Tamano | Pantallas | Premios | Bichos |
|---|---|---|---|---|---|
| 1 | Space Coast | 122 x 12 | 6,1 | 61 | 4 |
| 2 | Medellin | 138 x 12 | 6,9 | 70 | 7 |
| 3 | Atlanta | 154 x 12 | 7,7 | 80 | 9 |
| 4 | Miami | 170 x 12 | 8,5 | 89 | 10 |
| 5 | Cartagena | 186 x 12 | 9,3 | 100 | 11 |
| 6 | Orlando | 170 x 12 | 8,5 | 91 | 10 |
| 7 | Lake Lanier | 186 x 12 | 9,3 | 98 | 13 |
| 8 | La finca | 202 x 12 | 10,1 | 107 | 16 |

El fondo de cada una vive en `src/assets/fondos/` y el nivel lo nombra en su
campo `fondo`. **Los ocho lo tienen.** Queda el respaldo de **la obra**
(`TEXTURAS.fondoEnObra`, dibujada por codigo) para el mundo que se anada antes
que su ilustracion: `pintarFondo` no encuentra la suya y pinta esa, que dice de
un vistazo "este mundo esta a medias". Lo mismo en su tarjeta.

Una lamina puede venir con **marco de cartel**, un margen de papel alrededor.
Eso en el juego se ve como una franja clara pegada al borde de la pantalla y
canta muchisimo cuando el fondo se mueve, asi que se recorta: `preparar-fondos.mjs`
acepta un `recorte` por ciudad y corta al mismo formato de la lamina, sin
deformar nada. Le paso a Orlando.

Todos tienen **tres checkpoints** y **un jefe** antes de la meta. Se elige a
cual ir y el marcador se arrastra de uno a otro.

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
- **Nada cierra el tablero por detras.** Hubo una pared de seis casillas en la
  ultima columna, para que el jefe no se escapara; se quito, porque el jefe ya
  se sujeta a los bordes de su arena y la pared hacia de presa: las palomas que
  cruzan a la altura del segundo piso y las vacas que vienen corriendo chocaban
  con ella y se iban amontonando detras de la puerta.
- Delante va un **porche** de cuatro casillas con el ultimo checkpoint, asi que
  se entra descansado y reaparecer no cuesta el camino de vuelta.
- Dentro: una **plataforma** desde la que dejarse caer sobre el jefe, el **jefe**
  a dos tercios de la pantalla y la **meta** al fondo. Ya no es obligatoria: con
  carrerilla se le pisa desde el suelo (ver la seccion 4).
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

### El ancho, en un telefono

El alto son **360 siempre**, y la casilla 32: la fisica, los mapas y el
validador no se enteran de nada de esto. El ANCHO, en cambio, se adapta.

En el ordenador son los **640** de toda la vida. En un telefono no: un iPhone
acostado mide 844 x 390, o sea 2,16 a 1, y un juego de 16 a 9 le deja dos
franjas negras a los lados que se comen un quinto de la pantalla. Para llenarla
sin deformar nada y sin recortar por arriba (ahi esta el HUD) solo queda una
salida: **ver mas mundo a lo ancho**. `MUNDO.ancho` sale de la forma de la
pantalla, topado en 800, y en un iPhone da 780.

Lo que eso obliga a tener en cuenta:

- Nada puede dar por hecho que la pantalla mide 640. Las ilustraciones ya se
  pintaban **a cubrir** (`Math.max(ancho/w, alto/h)`), asi que se adaptan solas;
  el cartel de la portada se mide sobre el dibujo, asi que tambien. Lo que si
  hubo que cambiar son los mandos tactiles, que se colocan contra sus bordes.
- La **arena del jefe** sigue siendo las 20 ultimas columnas (640 px), asi que
  en un telefono se ve la arena entera **y un trozo del porche** de antes. El
  jefe y la meta siguen en cuadro, que es lo que importaba.
- **En el ordenador no cambia absolutamente nada**: solo se ensancha si el
  aparato se maneja con el dedo.

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

  **La finca ya tiene el suyo entero**, y es la primera que lo tiene por los dos
  lados: por detras el abuelo arriando ganado a caballo con su sombrero
  vueltiao, el corral lleno de cebues y el palo de mango; por delante la
  abuelita cocinando frijoles —con su bocadillo, como el gato de Medellin— y los
  tres cachorros (el negro, el negro de pecho y pata blancos, y el blanco del
  ojo tapado). Con eso se le va lo prestado de Medellin.

  **Y Lake Lanier tambien**: por detras la casa victoriana de suburbio de
  Georgia, el roble con sus barbas de musgo espanol —de los de Savannah— y el
  pino alto; por delante la gata negra y el eufonio con cara de travieso, que va
  diciendo "¡MOFONGO!". Con eso se le va lo prestado de Space Coast (el jeep y
  la casa de Florida) y los adornos provisionales. Las palmeras siguen fuera,
  que es un lago de Georgia.

  **Orlando** no usa el de Medellin: un guayacan en flor y una chiva delante de
  una montana rusa se leian fatal. Se le presta el de Space Coast, que tambien
  es Florida —palmeras delante y, por detras, la casa y el jeep—, pero **sin el
  letrero del muelle**, que pone "Cocoa Beach Pier" con todas sus letras. Un
  adorno generico se perdona; uno que nombra otra ciudad, no.

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
- **Los jefes con cara de la familia:** los cinco guardianes van a ser versiones
  bizarras de la familia, generadas con Gemini. Papa Inodoro lleva la cara de
  Daniel, sacada de una foto suya; el Abuelo se reconoce por el sombrero
  vueltiao y el poncho; Martin Malvado es el propio Martain con un disfraz de
  oso roto; y Jean Luke es un nino maton inventado, con camiseta de rayas
  celestes. Se pidio **caricaturesco y comico, nunca cruel**: en este juego los
  jefes dan risa, no miedo. Son sus propias caras y su propia decision, asi que de
  licencia no hay nada que mirar; las hojas de partida no se suben al
  repositorio. La pickup del Abuelo trae dibujado el emblema de su marca, que
  entra en la excepcion de mas arriba.
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
- **2026-09-26** — Space Coast estrena a **Papa Inodoro** y con el se va el
  Astronauta Burbuja, que era provisional y estaba dibujado por codigo. Los
  cinco jefes van a ser versiones bizarras del papa: este es una cabeza saliendo
  de un retrete, con su cara. Escupe heladitos de chocolate, se enoja, embiste y
  se estampa; la ventana es el aturdimiento. Se borran su archivo, sus tres
  texturas de codigo y los colores que solo el usaba.
- **2026-09-26** — La hoja del jefe venia con **el nombre de cada pose escrito
  debajo**, asi que sus zonas van a mano y todas cortan justo por encima de las
  letras (y=366 arriba, y=727 abajo). De paso, la pose de escupir deja fuera el
  heladito que lleva dibujado al lado: en el juego el heladito es un objeto
  aparte y, dibujado encima, saldria doble.
- **2026-09-26** — El heladito va en **su propia entrada** de
  `preparar-sprites.mjs`, como ya paso con el gato: la altura se reparte por
  grupos, asi que metido en la hoja del jefe habria salido del tamano del
  retrete.
- **2026-09-26** — Un jefe puede traer **dibujo de derrota**. Hasta ahora el
  sprite se destruia en cuanto caia, asi que una pose de "me voy por el sifon"
  no se habria visto jamas; ahora la escena la deja un momento en su sitio
  mientras se hunde y se va.
- **2026-09-26** — La frase del jefe se **sujeta dentro de la pantalla** y se
  parte a 460 px en vez de a 300. Centrada en el jefe, que pelea en el borde
  derecho de su arena, "¡NO TAPES EL BANO, BERRIONDO!" se salia media pantalla;
  y partida en dos lineas se metia debajo de su barra de vida.
- **2026-09-26** — Ojo al depurar en el navegador del editor: **Phaser pausa el
  juego cuando la pestana no tiene el foco**, asi que el bucle de fisica no
  corre y los cuerpos se quedan con la escala sin aplicar (`_sy` en 1). Pareció
  que la caja del jefe nuevo estaba rota —453 px de alto y hundida en el
  suelo— y lo que pasaba es que el juego estaba quieto. Medido con Playwright,
  que si tiene foco, la caja sale de 112 x 150 y apoyada en el suelo.
- **2026-09-26** — **Fuera la pared del final del tablero**, en los cinco. Era
  una columna de seis casillas detras de la puerta, puesta para que el jefe no
  se escapara por la derecha; eso ya lo hacen los bordes de la arena. Lo que
  hacia de verdad era de **presa**: las palomas que cruzan a la altura del
  segundo piso y las vacas que vienen corriendo se estampaban contra ella y,
  como solo se borran al salirse del mundo, se iban amontonando ahi. Es el unico
  sitio del tablero del que no se puede salir.
- **2026-09-26** — Una paloma **volando ya no choca con el terreno**: el choque
  solo cuenta cuando la han derribado y tiene que caer. Va por el aire; que un
  bloque alto la pare es lo que la dejaba clavada. Va con un `processCallback`
  en el collider, no quitandolo: derribada si tiene que aterrizar.
- **2026-09-26** — **A los jefes se les puede pisar desde el suelo.** Median el
  doble que un nino y el salto no les llegaba a la coronilla, asi que hacia
  falta la plataforma de la arena. El dibujo **no se toca** —la escala es lo que
  les da empaque— y lo que se recorta es la **caja**, de 158 a 104 px de alto,
  como ya se hacia con la banera: el techo queda en y=184 y los pies del nino
  llegan a 173.
- **2026-09-26** — Con eso solo no bastaba: el nino entraba en la caja del jefe
  **mientras subia**, se llevaba el golpe antes de llegar arriba y el salto no
  servia de nada. Ahora **pasarle por encima subiendo no castiga**; solo cuenta
  lo que pase bajando. Entre las dos cosas, la ventana para despegar pasa de 26
  a unos 77 px, parecida a la de un bicho. Hay una prueba que lo hace de verdad,
  con las teclas, en las cinco ciudades.
- **2026-09-26** — Para medir eso hay que **plantar al jefe en el suelo del
  tablero** a mano. No vale con esperar a que este "apoyado en algo": el
  Salvavidas se pasa la pelea saltando, y pillandolo sobre la plataforma de su
  arena lo que se mide es el salto a la plataforma, no al jefe.
- **2026-09-26** — Medellin estrena **al Abuelo** y con el se va el Carrotanque,
  que estaba dibujado por codigo. La pelea es la misma —no se le pega, lo paran
  las cosas que le caen de los balcones— y lo que cambia es el cuento: ahora es
  el abuelo en su pickup doble cabina, con sombrero vueltiao y poncho, y lo que
  le cae encima son **canastillas de fruta** en vez de materos. Se renombra
  todo: `Carrotanque` pasa a `Abuelo` y `MATERO` a `CANASTILLA`.
- **2026-09-26** — El Abuelo es el primer jefe **apaisado**: 204 x 136 en vez de
  172 x 172, porque una camioneta no cabe en un cuadrado sin nadar en aire. El
  alto de su CAJA es el de todos (104), asi que se le sigue pudiendo pisar
  igual. La prueba de la coronilla deja de exigir que el dibujo mida 172 y pasa
  a exigir lo que de verdad importa: que sea mucho mas grande que un nino y que
  le asome un buen trozo por encima de su propia caja.
- **2026-09-26** — **`limpiarBolsas` se le comio la camioneta entera.** La chapa
  es un gris verdoso (128,144,144) que queda a 148 del turquesa del fondo: pasa
  de sobra el filtro normal (90), pero el de las bolsas encerradas es mucho mas
  ancho a proposito (tolerancia x 2,2 = 198) y la tomo por fondo. El interior de
  la camioneta es una mancha cerrada, asi que se fue entera y el jefe salia como
  una silueta negra con las ventanillas y el abuelo pintados encima. La regla
  que queda: **`limpiarBolsas` solo si el dibujo no tiene ningun color a menos
  de dos tolerancias del fondo**. La vaca puede; la camioneta no.
- **2026-09-26** — La hoja del Abuelo trae DIBUJADA una linea de suelo bajo cada
  pose, como la de la vaca, asi que las zonas van a mano y cortan a un pixel de
  las llantas (y=334 arriba, y=726 abajo). Y la hoja de las canastillas trae en
  la fila de abajo dos poses de la camioneta repetidas: ninguna zona baja de
  y=380.
- **2026-09-26** — El juego se puede jugar **en un telefono**: joystick abajo a
  la izquierda, saltar y atacar abajo a la derecha, y pausa arriba en medio. No
  son un mando aparte, le aprietan a `Controles` las mismas acciones que las
  teclas, asi que ni el Jugador ni nada del juego se entera de por donde le
  llegan.
- **2026-09-26** — Se anadio el **boton de saltar** aunque solo se pidiera el de
  atacar: en un plataformas, saltar empujando la palanca hacia arriba mientras
  se corre es incomodisimo. La palanca hacia arriba tambien salta, de mas, por
  si alguien no encuentra el boton.
- **2026-09-26** — Hacen falta **tres punteros** (`input.addPointer(3)`): Phaser
  trae uno solo mas el raton, y con eso no se puede correr y saltar a la vez.
  Ojo al probarlo: Playwright necesita el navegador con `hasTouch: true`, porque
  si no Phaser no reparte los dedos entre varios punteros y el segundo dedo se
  pierde entero. Se perdio un buen rato persiguiendo eso creyendo que era un
  fallo del juego.
- **2026-09-26** — Las coordenadas del dedo (`pointer.x`) vienen en pixeles del
  LIENZO, que es la pantalla del juego multiplicada por la densidad: hay que
  dividir por ella para pensar en los 640 x 360 de siempre. Es el mismo cuidado
  que ya piden los planos y el HUD.
- **2026-09-26** — El relleno de los mandos va **opaco**, y la transparencia la
  pone `setAlpha`. Poniendola en las dos (0,55 en el color y 0,34 en el objeto)
  se multiplican, y sobre un fondo claro los mandos se veian casi invisibles.
- **2026-09-26** — La pantalla de **quien juega** estrena un teclado en
  pantalla. Sin el, en un telefono el juego era inalcanzable: se teclea el
  nombre y ahi no hay teclado. Con el puesto, tocar en cualquier sitio ya NO
  confirma (se llevaria la pantalla por delante al tocar la primera letra): se
  confirma con LISTO.
- **2026-09-26** — En el telefono **no se podia elegir personaje**: lo unico que
  se podia tocar era el nombre de abajo, una linea de 18 px. Ahora se toca la
  tarjeta entera. Con el raton no cambia nada, solo gana sitio donde hacer clic.
- **2026-09-26** — **Ningun texto habla de teclas cuando se juega con el dedo.**
  En un telefono no hay Enter, ni Esc, ni flechas, y decirselo al nino solo
  despista. Lo reparte `segunElMando`, un ayudante de dos lineas: el mismo aviso
  dicho para el mando que se este usando. En el ordenador todo sigue igual.
- **2026-09-26** — Dos pruebas de jefes esperaban **tiempo de reloj** (600 ms
  para que llegara un bloque, 1,6 s para que se montara un tablero) y empezaron
  a fallar **solo con la suite entera por delante**: sueltas pasaban siempre.
  Con mas pruebas por delante el navegador va mas lento y esos margenes se
  quedaron cortos. Se esperan sucesos, que es la regla de casa desde hace
  tiempo; si una prueba falla en la suite y pasa sola, es esto.
- **2026-09-26** — **Fuera el joystick**, y en su sitio dos botones de andar. Se
  comia un cuarto de la pantalla para hacer lo que hacen dos botones: aqui solo
  se anda a izquierda y derecha. De paso, todos los mandos se achican y se
  vuelven mas translucidos. Deslizar el pulgar de un boton al de al lado cambia
  de boton sin levantar el dedo, que es como se mueven los ninos de verdad.
- **2026-09-26** — **La pantalla del juego se ensancha en un telefono**, de 640
  a lo que pida el aparato (780 en un iPhone), topado en 800. Era la unica forma
  de quitar las franjas negras de los lados sin deformar el dibujo ni recortar
  por arriba, que es donde vive el HUD. El alto sigue en 360 y la casilla en 32,
  asi que la fisica, los mapas y el validador no se enteran: lo unico que cambia
  es cuanto tablero se ve de un vistazo. En el ordenador se queda en 640.
- **2026-09-26** — `esTactil()` se muda de `sistemas/tactil.js` a
  `config/ajustes.js`: de ella depende ahora el ancho de la pantalla, y ajustes
  no puede importar de tactil sin que los dos se hagan un nudo. `tactil.js` la
  reexporta como `hayTactil`, asi que quien ya la usaba no se entera.
- **2026-09-26** — Miami estrena a **Martin Malvado** y con el se va el
  Salvavidas, que estaba dibujado por codigo. La pelea es la misma —arriba no se
  le llega, hay que esperar a que baje— y lo que cambia es quien es: la version
  mala de Martain, en un disfraz de oso roto por el que se le sale el relleno.
  Lo que tira deja de ser un flotador y pasa a ser un **pegote de relleno
  amarillo**, que rueda dando vueltas y se desparrama al romperse. Se renombra
  todo: `Salvavidas` pasa a `MartinMalvado` y `FLOTADOR` a `RELLENO`.
- **2026-09-26** — De esa arena sobreviven **las torres**, que siguen dibujadas
  por codigo: son decorado, pero marcan por donde va a saltar, que es lo que
  hace la pelea legible.
- **2026-09-26** — Su hoja tampoco lleva `limpiarBolsas`: el peto claro de la
  barriga del oso queda a 191 del turquesa del fondo y el filtro de las bolsas
  encerradas es mucho mas ancho que el normal (198), asi que se lo habria
  comido. Es la tercera vez que aparece la misma trampa; la regla esta escrita
  en la entrada del Abuelo.
- **2026-09-27** — A Martin Malvado se le rehacen los fotogramas: en el juego
  salia **demasiado rubio** y no se parecia a Martain. La hoja nueva viene con
  el mismo encuadre exacto que la vieja, asi que las zonas del recorte no se
  tocan.
- **2026-09-27** — Cartagena estrena a **Jean Luke** y con el se va el Capitan
  Tapon, que estaba dibujado por codigo. La pelea es la misma —no se le pega de
  frente, hay que esperar a que se de la vuelta— y lo que cambia es quien es: el
  nino maton de la camiseta de rayas celestes, que tira **globos de agua** desde
  su balde. Se pierde el chiste del tapon, pero se gana el del maton al que se
  le acaba la gracia y se sienta a llamar a su mama. Se renombra todo:
  `CapitanTapon` pasa a `JeanLuke` y `BALA` a `GLOBO`.
- **2026-09-27** — Su hoja trae ESCRITO el nombre de cada pose debajo, asi que
  las zonas van a mano. La de GOLPE ademas empieza mas abajo que las demas,
  porque por encima pasa el letrero de "APUNTA" y un rectangulo no puede
  separarlos de otra forma.
- **2026-09-27** — Con Jean Luke, **los cinco jefes tienen ya dibujos de
  verdad**: no queda ninguno pintado por codigo. De sus arenas solo sobreviven
  al codigo las sombrillas de Dona Zully y las torres de Miami.
- **2026-09-27** — Se puede **elegir a que mundo ir**, no solo con que
  personaje. Los cinco estan abiertos desde el principio y la eleccion tambien
  esta en la pantalla de victoria, llevandose el marcador: lo que se buscaba es
  poder seguir jugando despues de pasarse los cinco, volver al que mas guste y
  seguir sumando puntos.
- **2026-09-27** — Un jefe pasa de dar **10 monedas a dar 100**, y 20 mas por
  cada mundo mas dificil (hasta los 180 de Jean Luke). Con los mundos abiertos,
  esto es lo que hace que valga la pena meterse en los dificiles en vez de
  repetir el primero. Lo que han pagado se guarda en `jugador.puntosDeJefes`,
  porque el marcador final ya no puede sacarlo multiplicando.
- **2026-09-27** — Del menu de victoria se va **"Repetir este nivel"**: con
  "Elegir otro mundo" se puede repetir el mismo, y con cuatro opciones el menu
  se salia de la pantalla por abajo.
- **2026-09-27** — Las tarjetas de mundo se recortan con **`setCrop` y no con
  una mascara**: en Phaser 4, `setMask` no funciona con WebGL. Avisa por consola
  ("This method is not supported in WebGL") y dibuja la lamina entera, que a ese
  tamano ocupa la pantalla de lado a lado.
- **2026-09-28** — **El puntaje se apunta todo el rato**, no solo al final: al
  acabar cada mundo, al quedarse sin vidas y al salirse al menu desde la pausa.
  Los ninos jugaban una tarde y no quedaba rastro, porque ni se morian del todo
  ni se pasaban los cinco mundos de un tiron, que eran los dos unicos sitios
  donde se apuntaba. De este tablero depende el premio de diciembre, asi que
  perder una sesion entera no es un detalle.
- **2026-09-28** — Para que eso no llene el tablero con los pasos intermedios de
  una misma partida, cada partida lleva su **identificador** y sus anotaciones
  **actualizan su fila** en vez de anadir otra, quedandose con el puntaje mas
  alto que hizo. Sin eso, una sesion de cinco mundos ocupaba cinco de los diez
  puestos ella sola.
- **2026-09-28** — La ultima linea del panel de victoria pasa a decir siempre
  **"Apuntado como NOMBRE · N.º del tablero"**. Ahi iba una gracia del marcador
  ("prueba con Samaon", "sin un solo golpe"); en dos lineas no cabia dentro del
  panel y esto importa mas.
- **2026-09-28** — Entran **tres mundos nuevos**: Orlando (el Tio Camilo), Lake
  Lanier (Chad, el chef de los panqueques) y La finca (Simon Malvado). Por ahora
  van **en obra**: el tablero si es suyo, pero el fondo es una obra dibujada por
  codigo y el jefe y los bichos van prestados. Se le da a cada uno la pelea de
  un jefe distinto —Jean Luke, Martin Malvado y Papa Inodoro— para que no se
  jueguen los tres igual. Su nombre y sus frases si son suyos: salen de
  `historia.js`, que va por ciudad y no por clase.
- **2026-09-28** — El fondo "en obra" **no son rayas amarillas a toda
  pantalla**: eso no hay quien lo juegue. Son franjas anchas y apagadas de
  fondo, con una sola cinta de peligro cruzando por el medio. Dice lo que tiene
  que decir sin comerse el juego.
- **2026-09-28** — Las tarjetas de mundo pasan a **rejilla de cuatro por fila**.
  Con cinco cabian de una tirada; con ocho no, y encogerlas hasta que quepan las
  deja ilegibles y sin sitio donde poner el dedo en un telefono.
  *(Se volvio atras el 2026-09-29: ahora se ensena una sola, grande.)*
- **2026-09-28** — Lo que recorre "todos los mundos" deja de contar hasta cinco
  y pregunta `TOTAL_NIVELES`: tres pruebas y el validador daban por hecho que
  eran cinco, y con ocho se quedaban probando la mitad sin quejarse.
- **2026-09-28** — El cartel de Cartagena decia **"¡El jefe final!"**. Con ocho
  mundos, el ultimo ya no es ese: ahora dice su nombre, como los demas.
- **2026-09-29** — El bicho que embiste **cambia de dibujo segun el mundo**: una
  vaca marciana en Space Coast, un bus en Medellin, Alma en Atlanta, Melo en
  Miami, un clasico de La Habana en Cartagena, un vagon de montana rusa en
  Orlando y la vaca de siempre en la finca. La PELEA no cambia ni un pixel: es
  el mismo bicho con otra piel. Donde hay varias (dos buses, tres clasicos) se
  sortea, para que el tablero no se haga previsible sin dibujar una pelea nueva.
- **2026-09-29** — Las pieles se cargan con **`import.meta.glob`** y sus claves
  se arman con `TEXTURAS.bichoDe(piel, pose)`, como ya se hacia con los fondos.
  Diez pieles por seis poses son sesenta archivos: ni sesenta lineas de import
  ni sesenta constantes sueltas las mantiene nadie, y asi anadir una es dejar su
  carpeta ahi y nombrarla en `bichos.js`.
- **2026-09-29** — **Cuarta vez con la trampa de `limpiarBolsas`**, y esta vez
  en tres hojas a la vez. Se les copio la receta de la vaca (tolerancia 120) sin
  mirar sus colores, y el filtro de las bolsas —que corta en tolerancia x 2,2,
  o sea 264— se comio el crema del bus verde (a 234 del fondo), el cafe de Melo
  (212) y el lila de la vaca marciana (156): los tres salieron en **puro
  contorno**. Van sin ese filtro y con la tolerancia bajada a 100, 95 y 70. La
  regla, otra vez: **antes de copiar una receta de recorte hay que medir los
  colores de ESE dibujo**.
- **2026-09-29** — Las otras seis hojas SI llevan el filtro, y lo necesitan:
  varias traen una **sombra ovalada dibujada**, que es el mismo turquesa mas
  oscuro (a unos 115 del fondo), y con la tolerancia de casa se quedaba pegada
  debajo como un halo gris. Es lo mismo que ya le pasaba a la vaca original.
- **2026-09-29** — La pantalla de mundos pasa a **ensenar uno solo, grande**,
  con flechas a los lados, deslizamiento con el dedo, "Mundo 4 de 8" arriba y
  una fila de puntitos abajo. Lo pidio Daniel despues de probarlo en el
  telefono: en rejilla, con ocho, cada tarjeta se quedaba en 104 x 68 px y no
  habia forma ni de verlas ni de acertarles. Mas vale ver uno bien que ocho mal.
- **2026-09-29** — Deslizar y tocar **se deciden al LEVANTAR el dedo**, no al
  apoyarlo: hasta entonces no se sabe si era un toque (que juega) o un arrastre
  (que cambia de mundo). Y se le pide al gesto que sea **mas horizontal que
  vertical**, que si no bajar el dedo por la pantalla cambiaba de mundo sin
  querer.
- **2026-09-29** — Los jefes **se reordenan por donde vive cada uno**, no por el
  orden en que se fueron dibujando: **Simon Malvado** a Space Coast, que es de
  donde son los ninos; **Papa Inodoro** a Medellin, que es de donde sale su
  "berriondo"; y **el Abuelo** a la finca, que es donde vive —ya no baja a la
  ciudad, ahora los espera en su tierra con la camioneta y las canastillas.
  Ojo con esto: el NOMBRE y las FRASES de un jefe viven en `historia.js` y van
  por **ciudad**, no por clase, asi que hay que mudarlos con el. Si no, la
  ciudad enseña el dibujo de uno con el nombre de otro, y no da ningun error.
  Hay una prueba que lo vigila en los ocho mundos.
- **2026-09-28** — **Lake Lanier y La finca salen de la obra, y con eso los
  ocho mundos quedan terminados.** Lake Lanier estrena su lago con el muelle y
  la marina, y a **Chad**, el chef que tira panqueques desde la torre. La finca
  estrena **El Refugio** —la casa blanca de puertas negras, el lago, los cebues
  y la ceiba— y a **Simon Malvado**, el nino de piezas de armar que tira
  juguetes. Los dos heredan la pelea de otro jefe y solo cambian lo que se ve.
- **2026-09-28** — Las otras DOS familias de proyectil (el que rueda por el
  suelo y el que va en arco) pasan tambien a preguntarle al jefe por su
  `municion`, como ya hacia el que sale recto. Sin eso, darle panqueques a Chad
  y juguetes a Simon habria sido duplicar los dos sistemas enteros.
- **2026-09-28** — **Los adornos prestados se eligen por clima, no por
  comodidad.** A Lake Lanier se le pusieron los de Space Coast enteros y las
  PALMERAS cantaban: es un lago de Georgia, de pinos y robles, y van grandes y
  en primer plano, asi que se lo llevaban a otro clima de un vistazo. Se le
  dejan el jeep y la casa por detras (al menos son del mismo pais, y un jeep en
  un lago pega, que es con lo que se remolcan las lanchas) y los provisionales
  por delante.
  Se probo a dejarlo SIN nada detras y no vale: una ciudad sin decorado de fondo
  se ve vacia, y hay una prueba que lo vigila en las ocho. La regla era buena; lo
  perezoso era la solucion.
  En La finca, en cambio, lo de Medellin SI pega —la chiva y la casa de pueblo
  son colombianas—, pero se le quita el guayacan de delante: su ilustracion ya
  viene llena de arboles en flor y el tablero se convertia en una pared amarilla
  por la que no se veia jugar.
- **2026-09-28** — La hoja de Simon Malvado se recorta con **tolerancia 25**, la
  mas baja del proyecto, y con `limpiarBolsas`. Su pose de aturdido trae el
  mareo dibujado como un **disco RELLENO del mismo turquesa del fondo**, que
  quedaba como un plato teal clavado sobre su cabeza. Es una bolsa encerrada de
  manual, pero la cuenta de siempre no valia: el azul CLARO de sus jeans esta a
  solo 66 del turquesa. La ventana es estrecha y existe: el disco esta a 6-20,
  el fondo no se desvia mas de 20, y los jeans estan a 66, asi que la tolerancia
  tiene que caer entre 20 y 30. Se eligio 25.
- **2026-09-28** — Y el juguete que tira, con **tolerancia 50**: su azul queda a
  101 del turquesa, y con la de casa el filtro de residuos (tolerancia x 1,7)
  le habria mordido los bordes.
- **2026-09-28** — La pose del **brinco** de Simon Malvado trae dibujada una
  sombra ovalada debajo, que es justo lo que no queremos (aqui todo se apoya
  solo). Su zona corta a un pixel del muneco y la deja fuera. Al prompt se le
  anadio que no dibujara sombras ni marcos, y los dos fondos siguientes ya
  vinieron limpios.
- **2026-09-28** — La **barra de vida del jefe se achica a la mitad**. Los
  puntitos median 22 px y se repartian cada 34, asi que la de Martin Malvado
  —que aguanta ocho— medi­a 288 px: casi media pantalla y mas ancha que el
  propio jefe, que mide 172. Pesaba mas a la vista que el bicho al que hay que
  mirar, que es justo lo contrario de lo que tiene que hacer. Ahora la de ocho
  se queda en 148. Sus medidas viven en `JEFE.barra` y hay una prueba que
  comprueba, en los ocho mundos, que la barra cabe dentro del ancho del jefe.
- **2026-09-28** — El **encuadre vertical del fondo pasa a ser por ciudad**
  (`fondoBajada`, en `ciudades.js`). El dibujo de Orlando trae el horizonte muy
  abajo —la masa de suelo empieza al 66% de la lamina— y con el encuadre de casa
  el piso del juego tapaba desde el 54%: se comia justo la franja donde estan
  las bases del castillo y de las montanas rusas, asi que el castillo se veia
  cortado y de la ilustracion no se apreciaba casi nada. Subiendolo, su linea de
  suelo cae sobre la del juego. El valor se sujeta entre -0,5 y 0,5: fuera de
  ahi se asomaria el borde de la lamina.
- **2026-09-28** — **Orlando sale de la obra**: estrena fondo propio (el
  horizonte de los parques, con su cielo de rayos art deco) y jefe propio, **el
  Tio Camilo**, un diablo colorado con la cara del tio y el escudo de su equipo
  en la barriga, que tira **balones en llamas**. Pelea como Jean Luke, que es lo
  que pidio Daniel, asi que `TioCamilo` hereda de el y solo cambia sus dibujos,
  su municion y cuanto aguanta.
- **2026-09-28** — Lo que tira un jefe **deja de estar clavado al globo de
  agua**. La escena ya no sabe de globos: le pregunta al jefe por su `municion`
  (los tres dibujos y si echa chispas o burbujas al romperse), y las medidas del
  vuelo, que son las mismas para los dos, se quedan en `TIRO_DE_JEFE`. Sin eso,
  darle balones al Tio Camilo habria sido duplicar el sistema entero.
- **2026-09-28** — **Ojo al renombrar: hay que buscar el nombre nuevo ANTES de
  usarlo.** Al sacar el proyectil del jefe a su propio grupo se le puso
  `proyectiles`... que ya eran los BLOQUES que lanza Samaon, quince lineas mas
  abajo en la misma escena. El segundo `this.proyectiles` pisaba al primero, asi
  que lo que tiraba el jefe nacia en el grupo de los bloques —con gravedad y con
  el choque contra el suelo puesto— y se estrellaba en el sitio sin volar un
  pixel. Y de propina, `romperProyectil` tambien existia ya, asi que el metodo
  nuevo quedaba pisado por el viejo. Dos choques del mismo descuido, y ninguno
  daba error: el sprite salia con su dibujo correcto y por una captura no se
  notaba. Ahora se llaman `tirosDeJefe` y `lanzarTiroDeJefe`, y hay una prueba
  que comprueba que lo que tira el jefe **de verdad vuela** y no cae.
- **2026-09-28** — Un fondo puede venir con **marco de cartel**. El de Orlando
  traia 13 px de papel crema arriba y abajo y 17 a los lados, y eso en el juego
  se ve como una franja clara pegada al borde que canta cuando el fondo se
  mueve. `preparar-fondos.mjs` gana un `recorte` por ciudad, que corta al mismo
  formato de la lamina para no deformar nada.
- **2026-09-28** — La hoja del Tio Camilo **si lleva `limpiarBolsas`**, y es la
  primera de un jefe que lo lleva: el hueco entre su brazo y la boca del costal
  es una bolsa de fondo encerrada y quedaba un parche turquesa pegado al cuerpo.
  Lo que hubo que hacer fue **bajarle la tolerancia a 70**, porque el filtro de
  las bolsas corta en tolerancia x 2,2 y aqui habia DOS cosas cerca del fondo:
  el crema del costal (194) y —la que casi se cuela— sus **lagrimas y el charco**
  de la pose de derrotado, que son celestes y se quedan a 170. Con la tolerancia
  de casa (90) se iban las dos; con 80, las lagrimas se salvaban de milagro,
  solo porque ninguna queda encerrada por tinta. Con 70 corta en 154 y las dos
  quedan con margen. Bajarla no cuesta nada cuando el fondo es liso: este no se
  desvia mas de 11 de su propia muestra.
- **2026-09-28** — El tablero de mejores puntajes **sube a la nube**, a una
  base de datos en tiempo real de Firebase. Vivia en el `localStorage` de cada
  equipo, asi que el telefono de Martain y el portatil de Samaon tenian cada uno
  el suyo y no habia forma de compararlos, que es exactamente lo que hace falta
  para el premio de diciembre. El de casa **no se va**: es el que se pinta, al
  instante, y lo de la nube llega despues y repinta. Asi el juego no espera a
  nadie y sigue funcionando sin internet.
- **2026-09-28** — Se le habla a Firebase **por REST, con `fetch` pelado**, y no
  con su SDK: son dos llamadas contadas (subir una fila, bajar diez) y meter el
  SDK por eso habria engordado un paquete que ya va por 1,5 MB con Phaser
  dentro. La clave de cada fila es el identificador de la partida, con lo que la
  regla de "una partida, una fila" sale sola.
- **2026-09-28** — Lo que no se puede subir **se guarda en una cola** y se
  reintenta. Sin eso, una tarde entera de juego se perdia si el wifi se caia en
  el momento justo, que es la misma clase de agujero que ya nos colo el que solo
  se apuntara al final.
- **2026-09-28** — Subir una fila no contesta si o no, sino **tres cosas**:
  subida, fallo (no se llego) y rechazada (se llego y la base dijo que no).
  Solo se reintenta el fallo. Con un si/no, una fila que la base rechaza —y las
  rechaza, porque su reglamento no deja BAJAR un puntaje— se quedaba en la cola
  para siempre y se reintentaba en cada sincronizacion. Por lo mismo, cuando una
  subida sale bien se saca de la cola lo que hubiera de esa partida: es una
  version vieja, con menos puntos, que ya no colaria.
- **2026-09-28** — La direccion de la base **va a la vista** en el juego
  publicado, y esta bien asi: no es una contrasena, es la puerta. Quien manda es
  el reglamento de la base (en `NUBE.md`), que solo deja leer y escribir
  puntajes, con la forma exacta de un puntaje, y que **solo deja subirlos, nunca
  bajarlos**, con lo que tampoco se pueden borrar filas.
- **2026-09-28** — Las pruebas abren el juego con **`?nube=0`**. Con la nube
  encendida, cada `npm run probar` habria escrito una docena de partidas
  inventadas en el tablero DE VERDAD de los ninos, y ademas se habria traido sus
  puntajes reales a mitad de una medida. Hay una prueba que comprueba que la
  nube esta apagada, que es la red de seguridad de todas las demas.
- **2026-09-28** — Para poder probar la nube sin tocar Firebase, `nube.js`
  expone `apuntarLaNubeA(url)` y las pruebas cambian `window.fetch` por una nube
  de mentira. Asi se puede comprobar lo que de verdad importa —que lo que no
  sube se encola, que se reintenta, que una partida de cero puntos no se sube y
  que con la nube colgada el juego sigue— sin depender de que haya internet.
- **2026-09-28** — Los tableros que se pintan se meten en `loQueDeje()`, un
  ayudante de `dibujo.js` que mira la lista de la escena antes y despues de
  pintar y devuelve lo que quedo puesto. Es lo que permite **repintar** el
  tablero cuando contesta la nube sin ir recogiendo objeto a objeto: un tablero
  son tres docenas de textos sueltos MAS el panel, que lo dibuja `panelDeco` y
  no pasa por las manos de la escena.
- **2026-09-28** — Se acaban las **pruebas que fallan cuando la maquina esta
  cargada**. Llevaban varias sesiones cayendo cuatro o cinco por pasada, unas
  distintas cada vez y todas pasando sueltas, y ya se estaba volviendo normal
  decir "es la maquina". El problema era real y era de las pruebas: cinco sitios
  seguian **esperando tiempo de reloj** en vez del suceso. Con el navegador
  lento, en el mismo tiempo de reloj pasa MENOS tiempo de juego, asi que el nino
  no habia aterrizado, el golpe no habia llegado al jefe o la pantalla de
  victoria no se habia montado. Los cinco pasan a esperar lo que de verdad
  esperan: que toque suelo, que le baje una vida al jefe, que la escena este.
- **2026-09-28** — `entrarAlNivel` **calla tambien a las palomas**, como ya
  callaba a las vacas. Una paloma que suelta lo suyo en mitad de una medida de
  salto o de monedas cambia el resultado entero, y llegan al azar. Las pruebas
  que SI quieren una se la traen ellas, creandola a mano o poniendo su reloj a
  cero, asi que ninguna se entera del cambio.
- **2026-09-28** — La prueba del bloque de Samaon contra el jefe **lo intenta en
  varias ventanas** y no solo en la primera. El bloque tarda lo suyo en cruzar
  190 px y la ventana del jefe dura lo que dura: si se cierra por el camino, el
  golpe rebota con un ¡clonc! y esa tirada se pierde. Eso no es un fallo del
  juego, es la pelea funcionando.
- **2026-09-28** — La prueba que pisa a los jefes **con las teclas** pide 180 s
  de plazo: son cinco ciudades por cuatro carrerillas, cada una con su salto
  entero en tiempo de reloj, y con el minuto de casa se quedaba al filo.

  Y la regla que deja esto, que es la que hay que aplicar la proxima vez: **si
  una prueba falla con la suite entera por delante y pasa suelta, no es la
  maquina, es que esta esperando el reloj en vez del suceso.** Se dijo lo
  contrario durante varias sesiones y se perdio tiempo mirando al sitio
  equivocado. La maquina solo explica lo LENTO; lo que decide si una prueba pasa
  o no es que espere lo que de verdad tiene que esperar.
- **2026-09-29** — La regla de arriba se aplico otra vez y volvio a acertar: la
  prueba del bloque que se deshace contra el suelo esperaba **100 ms de reloj** a
  que el bloque saliera y 1200 a que se rompiera. Con la suite entera por
  delante el bloque no habia salido cuando se le preguntaba. Ahora espera a que
  el grupo tenga uno, y luego a que se quede vacio. **Cuando una prueba falla
  solo en la suite, lo primero es buscarle el `waitForTimeout`.**
- **2026-09-29** — En Space Coast salia **Simon Malvado con varios fotogramas de
  Papa Inodoro**: los de escupir, enojarse, embestir y quedarse aturdido. Al
  parametrizar a `PapaInodoro` para que Simon heredara su pelea se convirtio
  `texturaDeAhora()`, pero se quedaron **cuatro `setTexture` escritos a mano**
  dentro de los metodos que cambian de estado, apuntando todavia al jefe
  original. Como los dos comparten pelea, no daba ningun error: solo salia el
  muneco equivocado. Los otros dos jefes parametrizados (Chad y el Tio Camilo)
  estaban limpios.

  Todos los dibujos de un jefe se llaman `tex-FAMILIA-pose`, asi que la prueba
  que lo vigila es facil y dura: se le deja pelear de verdad en las ocho
  ciudades y **todo lo que se ponga tiene que ser de UNA sola familia**. La regla
  que deja: **al parametrizar una clase para que otra la herede, no basta con el
  metodo que elige la pose; hay que buscar todos los `setTexture` sueltos.**
- **2026-09-29** — El cartel del bicho que embiste decia **"¡CUIDADO CON LA
  BERRIONDA VACA!" en los ocho mundos**, aunque en Atlanta viniera una pastora
  alemana y en Orlando un vagon de montana rusa. Ahora cada piel trae el suyo
  (`AVISOS_DE_BICHO`). Va por **piel** y no por ciudad, porque Medellin tiene dos
  buses y Cartagena tres carros. La caja del cartel se mide sobre el texto: con
  el ancho clavado en 400 px, al de Melo le quedaban dos letras fuera.
- **2026-09-29** — **Quinta vez con la trampa de `limpiarBolsas`, y la peor.** Los
  tres carros de Cartagena y la vagoneta de Orlando salian como garabatos
  negros: se les habian comido los cromados, las llantas de banda blanca, los
  parabrisas y la cara de los ninos. Medido, entre el **30 y el 46 por ciento**
  del dibujo caia por debajo del corte de las bolsas (tolerancia 120 x 2,2 =
  **264**). La vaca, que es de donde se copio la receta, solo tiene el 4 por
  ciento en riesgo, porque su turquesa es mucho mas saturado.

  Esta vez no se arregla apagando el filtro —sin el quedaban parches turquesa
  encerrados debajo de los carros y en la puerta de la camioneta—, sino
  **estrechandolo**: el ensanchado pasa a ser una perilla de cada hoja
  (`holguraBolsa`, 1,2 por defecto) y estas van con **0**, con lo que solo se van
  las bolsas que ya son del color del fondo pelado. La regla de siempre, ahora
  con herramienta para cumplirla: **antes de copiar una receta de recorte hay que
  medir los colores de ESE dibujo.**
- **2026-09-29** — Las zonas de las hojas de bichos dejan de estar puestas a ojo
  y pasan a estar **medidas**: bandas de tinta en vertical y, dentro de cada
  banda, grupos en horizontal. Las de `alma` y `melo` cortaban orejas, hocicos y
  patas. Dos cuidados que hacen falta y que no son evidentes:

  - Lo que va **suelto** (el soplido, las estrellitas) se junta con su pose: es
    parte de ella, aunque no la toque.
  - Cuando dos poses **se tocan** —a Alma le pasa en las dos ultimas y a Melo en
    las tres de abajo— se parte por la columna con **menos tinta**, y en ese
    lado **no se da margen**. Con margen, el recuadro se metia en el vecino y el
    recorte salia con un trocito del otro perro al lado.

  La **vaca sigue con las suyas a mano**, y ahi la medicion automatica no vale:
  su hoja trae DIBUJADA una linea de suelo bajo las dos poses de embestida, como
  la del Abuelo, y medida a la silueta la vaca salia con un palo negro debajo.
- **2026-09-29** — El cartel del bicho **no volvia a salir al cambiar de mundo**.
  Se quita solo al acabar su tween, y al reiniciar la escena ese tween muere sin
  llegar al final: `cartelDeVaca` se quedaba apuntando a unos objetos ya
  destruidos y, como `avisarDeLaVaca` se calla si ya hay uno puesto, no salia
  ninguno mas en toda la sesion. Se rearma en `init()`, que es donde va lo que
  Phaser NO limpia al reutilizar la escena. Es exactamente lo mismo que le paso
  a `yendo` en la pantalla de mundos, asi que ya van dos: **cuando una escena se
  reutiliza, todo estado que no viva en `init()` se arrastra del tablero
  anterior.**
- **2026-09-29** — Dos pruebas que llevaban tiempo cayendo con la suite cargada
  eran, otra vez, esperas de reloj, y una de las dos escondia una razon de
  verdad:

  - La del **salto corto** aguantaba el boton 70 ms de reloj. El juego, a
    proposito, NO recorta el salto en el mismo fotograma en que se salta
    (`puedeRecortar`), para que un toque cortisimo de un saltito de verdad; con
    la maquina cargada un fotograma dura mas de 70 ms, asi que pulsar y soltar
    caian dentro del mismo y el salto "corto" salia ENTERO. Ojo con la condicion
    de apice: de pie la velocidad vertical tambien es cero, asi que hay que
    exigirle haber despegado o suelta antes de empezar.
  - La de la **banera** miraba su estado en dos instantes fijos (250 y 850 ms).
    La banera hace carga, lanza y vuelve a andar, asi que con la maquina lenta
    se la pillaba ya en `anda`. Ahora se apunta por que estados PASA.
- **2026-09-29** — Y la otra mitad de por que fallaban: **habia DOS servidores de
  Vite corriendo a la vez.** Uno se habia dejado a mano para mirar una captura y
  el otro lo levanta la propia suite, que al encontrar el puerto ocupado se va
  al siguiente. Con los dos vigilando el proyecto, la suite pasaba de 6,7 a 13
  minutos, y a la mitad de fotogramas por segundo caen justo las pruebas que
  esperan el reloj. Las esperas malas eran reales y se arreglaron; la maquina
  cargada era **culpa nuestra**, no del equipo. Antes de decir "va lento", mirar
  si hay un `npm run dev` suelto (`netstat -ano | findstr 517`).
- **2026-09-29** — Y con esperar el suceso **no bastaba**: las dos pruebas del
  salto seguian cayendo. Lo que quedaba era el **viaje de ida y vuelta**.
  Pedirle a Playwright que pulse o suelte una tecla, o leer un valor, es una
  llamada al navegador, y con la maquina cargada esa llamada dura VARIOS
  fotogramas: la orden de soltar el salto llegaba cuando el nino ya iba llegando
  arriba, y los dos saltos median lo mismo. Ahora esas dos pruebas se juegan
  **desde dentro**, en un solo `page.evaluate`, apretando con
  `controles.tocar()`, que es la misma puerta por la que entran los mandos
  tactiles: al juego le da igual de donde le llegue.

  La regla, ampliada: **si lo que se mide depende de CUANDO se suelta un boton,
  no se suelta desde fuera.** Y para comprobarlo no hace falta esperar a que la
  maquina se cargue sola: se le frena la CPU al navegador
  (`Emulation.setCPUThrottlingRate`, con un `newCDPSession`) y se mira si la
  prueba aguanta. A 6x, estas dos aguantan.
- **2026-09-29** — **Los adornos nuevos vienen sobre MAGENTA, no sobre
  turquesa**, y esto vale para todo lo que se pida de aqui en adelante. El
  turquesa se parece a los cremas, a los grises y a los verdes, y de ahi salian
  casi todos los destrozos de recorte que hemos tenido —los carros, la
  camioneta del Abuelo, el oso de Martin Malvado, los buses—. Del magenta no se
  parece nada de lo que dibujamos, asi que las tolerancias pueden ir bajas y el
  recorte sale limpio a la primera. De las cinco laminas de la finca, cuatro
  salieron bien de un tiron.

  Al prompt se le pide ademas, siempre: un solo elemento, de cuerpo entero,
  **sin sombra en el suelo, sin linea de suelo, sin marco y sin texto**, y con
  margen de aire alrededor. Cada una de esas cosas nos ha costado una sesion
  alguna vez.
- **2026-09-29** — La finca estrena **su decorado propio**, siete piezas, y se le
  va lo prestado de Medellin. Tres cosas que dejo la faena:

  - **La abuelita vino con una sombra ovalada dibujada** bajo los pies y bajo la
    olla, a pesar de pedir que no. Subir la tolerancia para comersela no valia:
    su vestido blanco esta a 170 del fondo y la sombra a 150, y no caben las
    dos. Se resuelve con `fondosExtra`, declarando el magenta oscuro de la
    sombra como OTRO fondo con su propia tolerancia. Es el mismo mecanismo que
    se invento para el cielo pintado dentro de la casita de Florida.
  - **El cachorro blanco es lo mas apretado del proyecto**: queda a 190 del
    magenta, y el filtro de las bolsas corta en tolerancia x 2,2, asi que la
    tolerancia no puede pasar de 86. Pero con 60 quedaba corta por abajo y los
    dos cachorros negros salian con un **halo morado** pegado al contorno. Se
    queda en 80, que deja el halo fuera y salva el blanco por catorce.
  - `bolsaMinima` baja a **20** en los cachorros y en el corral. Lo que quedaba
    encerrado ahi no eran manchas sino **hilos**: el magenta que se cuela entre
    dos deditos de una pata o por la rendija entre dos tablones. Con el minimo
    de casa (120 puntos) no llegaban a contar como bolsa y se quedaban puestos,
    y un hilo magenta sobre un cachorro negro canta.
- **2026-09-29** — El **palo de mango va DETRAS**, no delante, aunque sea un
  arbol como las palmeras. Mide 252 px y por delante taparia al nino entero; por
  detras hace de finca sin estorbar. La regla que ya valia para el guayacan de
  la finca, dicha al derecho: **lo que mide mas que el nino, detras.**
- **2026-09-29** — Lake Lanier estrena **su decorado propio**, cinco piezas, y
  con eso son dos las ciudades vestidas de lo suyo por los dos lados. El magenta
  volvio a funcionar: las cinco laminas salieron a la primera, sin una sola
  receta que tocar por color.
- **2026-09-29** — **`bolsaMinima` no se podia bajar de verdad.** El minimo de
  una bolsa encerrada se sacaba con `Math.max(bolsaMinima, 0,02% del area)`, asi
  que en una lamina grande mandaba la proporcion y lo que pedia la hoja se
  ignoraba: el eufonio pedia 20 y le tocaban 132, el corral 20 y le tocaban 197.
  Por eso se quedaban puestos los HILOS de fondo —el magenta que se cuela entre
  dos pistones o por la rendija entre dos tablones—, y por eso hubo que
  perseguirlos a mano en la finca. Ahora **lo que diga la hoja manda**, y la
  proporcion se queda solo como valor por defecto para la hoja que no dice nada.

  Se comprobo que esto no toca nada de lo que ya estaba: de las diecinueve hojas
  que piden `bolsaMinima`, en once la proporcion ya era menor que lo pedido, asi
  que salen identicas. Las ocho que cambian son justo las nuevas, las del
  magenta. El eufonio paso de 204 restos de fondo a 8, y el corral de 152 a 0.
- **2026-09-29** — La finca tenia el **encuadre de su fondo en -0,14** y se veia
  una franja tostada lisa cruzando justo por encima del suelo, una linea
  paralela al piso por donde camina el nino: su dibujo acaba al 71% y por debajo
  es un liso, y subirlo tanto metia ese liso en cuadro. Lo conto Daniel.

  Se deja en **cero**, y no en un negativo pequeno (con -0,06 ya no se veia),
  porque en cero el encuadre **no depende de cuanto se amplie la lamina**: el
  desplazamiento se multiplica por lo que sobra de alto, asi que con cualquier
  otro valor una pantalla mas ancha —un telefono, que se lleva `MUNDO.ancho`
  hasta 800— amplia mas, sobra mas alto y la franja volveria a asomar. En cero
  la lamina queda centrada y se ve igual en todas las pantallas.

