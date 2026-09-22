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

Comandos:

```
npm run dev       # servidor de desarrollo (Vite)
npm run build     # compilar a dist/
npm run preview   # servir dist/ compilado
```

## 3. Estructura del proyecto

```
aventura-martin-simon/
  index.html            contenedor del canvas
  vite.config.js
  CLAUDE.md             esta biblia
  JUGAR.bat             arranque con doble clic (Windows)
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
    niveles/
      nivel1.js         mapa del nivel 1 como texto editable a mano
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
