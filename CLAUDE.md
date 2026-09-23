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
| Resolucion interna | **640 x 360** (pequena a proposito: al escalarse, todo se ve al doble) |
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
    escenas/
      EscenaTitulo.js
      EscenaSeleccion.js
      EscenaNivel.js
      EscenaVictoria.js
      EscenaPausa.js
    entidades/
      Jugador.js        movimiento, habilidades, estados
      Enemigo.js        caminar y dar la vuelta en bordes y paredes
    sistemas/
      controles.js      mapeo de teclas por jugador (preparado para 2 jugadores)
      constructor-nivel.js  convierte el mapa de texto en objetos del mundo
      hud.js            monedas y nombre del personaje
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
    colorear-portada.mjs colorea la ilustracion de portada
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

### Los bichos y el jefe

Los bichos miden **76 x 86**, la misma altura que los ninos: mas bajos costaba
darles y no daban ningun respeto.

Al final del nivel espera el jefe, que mide **172 x 172**, el doble que un nino,
con **3 vidas**. Como no se le puede saltar encima desde el suelo (el salto no
llega), cada arena lleva una **plataforma a un lado** para subirse y dejarse caer
sobre el. Con la katana o con un bloque se le alcanza desde el suelo. Camina de
un lado a otro de su arena y da la vuelta en los bordes; no persigue.

- Se le hace dano de tres maneras, para que los dos ninos puedan con el:
  saltandole encima, con la katana de Martin o con un bloque de Simon.
- Tras cada golpe parpadea y no se le puede volver a dar durante un momento.
- Lleva **tres puntitos encima de la cabeza** que se van apagando.
- **Mientras viva, la meta esta cerrada** y se dibuja apagada. Al derrotarlo se
  enciende y ya se puede terminar el nivel.
- Hay un **checkpoint justo antes de su arena**: morir peleando no castiga.

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

Cada personaje recoge lo suyo: **Martin rollos de sushi** y **Simon bloques de
armar** con seis cilindros encima. Es solo el dibujo; puntuan igual.

## 6. Reglas amables

Filosofia: juego **generoso y sin castigos fuertes**.

- **Sin vidas y sin game over.**
- Tocar un enemigo de lado o caer a un hueco: el personaje parpadea y reaparece en el
  ultimo checkpoint. **No pierde monedas.**
- Saltar encima de un enemigo lo elimina.
- Los enemigos eliminados desaparecen en una **nube de estrellitas**.
- El jefe es el unico que aguanta mas de un golpe (tres), y tocarle de lado tampoco
  castiga mas que un enemigo normal: se vuelve al checkpoint de al lado.
- Todo nivel se puede terminar con **cualquiera de los dos**. Las habilidades abren
  atajos y monedas extra, nunca son obligatorias para llegar a la meta.

## 7. Pantallas

```
titulo -> seleccion de personaje -> nivel -> victoria
                                              |-> jugar otra vez
                                              |-> cambiar personaje
```

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
 fila 10    subsuelo
```

Entre altura y altura hay 3 casillas (96 px) y el salto llega a 3,58, asi que se
sube de una a otra pero nunca del suelo al tercero de un tiron.

### Los cinco tableros

Cada tablero es una **ciudad**, con su propio fondo ilustrado:

| # | Ciudad | Tamano | Premios | Enemigos |
|---|---|---|---|---|
| 1 | Space Coast | 96 x 17 | 28 | 4 |
| 2 | Medellin | 104 x 17 | 31 | 5 |
| 3 | Atlanta | 108 x 17 | 42 | 8 |
| 4 | Miami | 112 x 17 | 42 | 5 |
| 5 | Cartagena | 116 x 17 | 48 | 7 |

El fondo de cada una vive en `src/assets/fondos/` y el nivel lo nombra en su
campo `fondo`. La historia de cada ciudad esta por escribir.

Todos tienen **dos checkpoints** y **un jefe** antes de la meta. Se juegan en
orden y el marcador se arrastra de uno a otro: la partida son los cinco.

Los mapas se escriben en `herramientas/generar-niveles.mjs` y se generan con
`npm run niveles`. La historia y el arte de cada tablero estan por decidir.

**Nivel 1:** unas 3 pantallas de largo (96 x 17 casillas). Arranque tranquilo para
aprender, escalera de plataformas, tres huecos, **28 monedas**, **4 enemigos**,
**dos checkpoints** (uno a la mitad y otro antes del jefe), una repisa alta con 6
monedas a la que se sube por una plataforma, un grupo de enemigos donde luce la
katana de Martin, y al final la **arena del jefe** con la meta detras.

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
- **Fondo actual:** ilustracion de un barrio de ladera con metrocable, aportada por
  Daniel el 2026-09-22. No contiene marcas ni personajes de franquicias.
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
- **2026-09-22** — La ventana del juego baja a **640 x 360**. Es la forma limpia
  de que todo se vea al doble de grande sin tocar la casilla ni la fisica: solo
  se ve menos mundo, mas grande. Los textos y los paneles se reescalaron a mano.
- **2026-09-22** — El tablero pasa a tener **tres alturas** y una franja libre
  arriba para los voladores. Los cinco mapas se rehicieron con esa estructura.
- **2026-09-22** — Los personajes pasan a **86 px**, los bichos a la misma altura
  y el jefe a **172**, el doble. Al agrandarlos, la katana y los bloques, que
  salian a la altura del pecho, pasaban por encima de los bichos; ahora la zona
  de golpe va del pecho a los pies.
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
