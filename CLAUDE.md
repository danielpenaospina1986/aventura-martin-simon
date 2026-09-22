# Las aventuras de Martin y Simon

Biblia del juego. Este archivo es la referencia maestra del proyecto y se actualiza
cada vez que tomamos una decision nueva.

---

## 1. Que es

Videojuego de plataformas 2D para PC, que corre en el navegador, hecho para Martin y
Simon (los hijos de Daniel). Titulo provisional: **"Las aventuras de Martin y Simon"**.

- Todo lo que aparece **en pantalla** va en espanol, con tildes correctas.
- En el **codigo** y en los **nombres de archivo**, espanol **sin tildes ni enies**
  (`seleccion`, `nivel`, `constructor-nivel.js`).

## 2. Tecnica

| Tema | Decision |
|---|---|
| Motor | Phaser **4.2.1** (ultima estable) |
| Empaquetador | Vite **8.3.0** |
| Lenguaje | JavaScript (ES modules), sin TypeScript |
| Resolucion interna | **960 x 540** |
| Escalado | `Phaser.Scale.FIT` + `CENTER_BOTH` (se adapta a la ventana sin deformarse) |
| Modo | `pixelArt: true`, `roundPixels: true`, antialias apagado |
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
    niveles/
      nivel1.js         mapa del nivel 1 como texto editable a mano
  herramientas/
    validar-nivel.mjs   comprueba que el nivel es jugable (node)
    tratar-fondo.mjs    suaviza la ilustracion de fondo
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

### Martin — el samurai
- Fisico: delgado. Rectangulo provisional de **22 x 44 px**, color rojo.
- Pelo: castano muy claro (franja arriba del rectangulo).
- Arte final: samurai con katana.
- **Habilidad:** golpe de katana hacia adelante. Aparece un arco blanco breve
  delante de el que elimina a los enemigos que toque.

### Simon — el constructor
- Fisico: grande y robusto. Rectangulo provisional de **30 x 52 px**, color naranja.
- Pelo: negro largo (franja arriba del rectangulo).
- Arte final: casco de obra con el pelo largo saliendo por debajo, overol y cinturon
  de herramientas.
- **Habilidad:** construir bloques de **32 x 32** alineados a la grilla.
  - En el piso: en la casilla de adelante.
  - En el aire: justo debajo de el.
  - Maximo **3 bloques** a la vez; al poner el cuarto desaparece el mas viejo.

## 5. Sensacion de movimiento

Valores en `src/config/ajustes.js`:

- Salto **variable**: si sueltas el boton antes, el salto es mas corto.
- Caida **mas rapida** que la subida (gravedad multiplicada al bajar).
- **Coyote time** ~100 ms: puedes saltar poco despues de salir de una plataforma.
- **Buffer de salto** ~100 ms: si pulsas salto justo antes de aterrizar, salta igual.
- Cajas de colision **algo mas pequenas** que el dibujo del personaje (perdona roces).

## 6. Reglas amables

Filosofia: juego **generoso y sin castigos fuertes**.

- **Sin vidas y sin game over.**
- Tocar un enemigo de lado o caer a un hueco: el personaje parpadea y reaparece en el
  ultimo checkpoint. **No pierde monedas.**
- Saltar encima de un enemigo lo elimina.
- Los enemigos eliminados desaparecen en una **nube de estrellitas**.
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
| `K` | checkpoint |
| `M` | meta |
| `P` | posicion de inicio |
| `.` | vacio |

**Nivel 1:** unas 3 pantallas de largo. Arranque tranquilo para aprender, plataformas,
un par de huecos, 25-30 monedas, 4-5 enemigos, un checkpoint a la mitad y la meta al
final. Incluye una repisa alta con monedas a la que Simon llega construyendo, y un
grupo de enemigos donde luce la katana de Martin.

## 10. Arte y licencias

- Todo el arte es **100% original** o de paquetes con **licencia libre** (Kenney, CC0).
- **Prohibido** usar personajes, sprites, disenos, tipografias o musica de marcas o
  franquicias conocidas.
- **Fondo actual:** ilustracion de un barrio de ladera con metrocable, aportada por
  Daniel el 2026-09-22. No contiene marcas ni personajes de franquicias.

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
- **2026-09-22** — `vite.config.js` usa `base: './'` (rutas relativas). Es lo que
  permite que el juego funcione en una subcarpeta como
  `usuario.github.io/aventura-martin-simon/`.
