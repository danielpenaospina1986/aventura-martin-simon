// ---------------------------------------------------------------------------
// CONSTRUCTOR DE NIVEL
// Convierte el mapa de texto de src/niveles/*.js en objetos del mundo.
// Es el unico sitio que sabe que significa cada simbolo.
// ---------------------------------------------------------------------------

import { CHECKPOINT, ENEMIGO, JEFE, META, MUNDO, PREMIO } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { aEscalaDeJuego, mosaico } from './dibujo.js';
import { ciudadDe } from '../config/ciudades.js';
import { Enemigo } from '../entidades/Enemigo.js';
import { jefeDeCiudad } from '../entidades/jefes/index.js';
import { hayTactil } from './tactil.js';

export const SIMBOLOS = {
  SOLIDO: '#',
  PLATAFORMA: '=',
  MONEDA: 'C',
  ENEMIGO: 'E',
  JEFE: 'J',
  CHECKPOINT: 'K',
  META: 'M',
  INICIO: 'P',
  VACIO: '.',
};

const C = MUNDO.casilla;
const JEFE_ALTO = JEFE.alto;

// centro de una casilla
export const centroX = (col) => col * C + C / 2;
export const centroY = (fila) => fila * C + C / 2;
// suelo de una casilla (donde se apoyan las cosas)
export const baseY = (fila) => (fila + 1) * C;

// Lo que dicen los carteles de ayuda cuando se juega con el dedo.
const EN_TACTIL = {
  'Flechas para moverte': 'Botones para moverte',
  'Espacio: saltar': 'Botón grande: saltar',
  'X: atacar': 'Botón de la estrella: atacar',
};

export function construirNivel(escena, nivel, opciones = {}) {
  // Cada personaje recoge lo suyo: sushi para Martin, bloques para Simon.
  const texturaMoneda = opciones.texturaMoneda || TEXTURAS.moneda;

  // El plano medio se viste de la ciudad del tablero: el asfalto de Atlanta no
  // se parece a la arena de Space Coast. Si la ciudad no tuviera pavimento
  // propio, se cae al de siempre.
  const ciudad = nivel.fondo || '';
  const conTextura = (clave, respaldo) =>
    escena.textures.exists(clave) ? clave : respaldo;
  const texturaSuelo = conTextura(TEXTURAS.sueloDe(ciudad), TEXTURAS.suelo);
  const texturaTierra = conTextura(TEXTURAS.tierraDe(ciudad), TEXTURAS.tierra);
  const texturaPlataforma = conTextura(TEXTURAS.plataformaDe(ciudad), TEXTURAS.plataforma);

  // El checkpoint lleva la bandera del pais de la ciudad, y la meta es la
  // puerta de salida. Si los dibujos no estuvieran cargados se cae a los de
  // codigo de siempre.
  const bandera =
    ciudadDe(ciudad).pais === 'co' ? TEXTURAS.banderaCo : TEXTURAS.banderaUs;
  const texturaBandera = conTextura(bandera, TEXTURAS.checkpointApagado);
  const texturaMeta = conTextura(TEXTURAS.puerta, TEXTURAS.meta);
  const mapa = nivel.mapa;
  const filas = mapa.length;
  const columnas = mapa[0].length;
  const ancho = columnas * C;
  const alto = filas * C;

  const solidos = escena.physics.add.staticGroup();
  const plataformas = escena.physics.add.staticGroup();
  const monedas = escena.physics.add.staticGroup();
  const checkpoints = escena.physics.add.staticGroup();
  const enemigos = escena.physics.add.group({ allowGravity: true, collideWorldBounds: false });
  let meta = null;
  let jefe = null;
  let inicio = { col: 1, fila: filas - 4 };

  // Fondo oscuro bajo la linea del terreno: hace que los huecos se lean como
  // precipicios en vez de dejar ver el paisaje del fondo.
  const pozo = escena.add.graphics().setDepth(-10);
  pozo.fillStyle(COLORES.abismo, 1);
  // La fila donde empieza el terreno de esa columna: se busca desde abajo, para
  // no confundir una repisa flotante con el suelo.
  const filaSueloDe = (col) => {
    let f = filas - 1;
    if (mapa[f][col] !== SIMBOLOS.SOLIDO) return null; // aqui hay un hueco
    while (f > 0 && mapa[f - 1][col] === SIMBOLOS.SOLIDO) f -= 1;
    return f;
  };
  const filasSuelo = [];
  for (let col = 0; col < columnas; col += 1) filasSuelo.push(filaSueloDe(col));

  // En un hueco no hay terreno del que tomar la altura, asi que se copia la de
  // la columna con terreno mas cercana. Antes se usaba la fila mas alta de todo
  // el mapa, y bastaba una pared alta en cualquier sitio para que el negro de
  // los huecos subiera por toda la pantalla.
  const filaDelHueco = (col) => {
    for (let d = 1; d < columnas; d += 1) {
      const izquierda = filasSuelo[col - d];
      if (izquierda !== null && izquierda !== undefined) return izquierda;
      const derecha = filasSuelo[col + d];
      if (derecha !== null && derecha !== undefined) return derecha;
    }
    return filas - 1;
  };

  for (let col = 0; col < columnas; col += 1) {
    const desde = filasSuelo[col] === null ? filaDelHueco(col) : filasSuelo[col];
    pozo.fillRect(col * C, desde * C, C, alto - desde * C);
  }

  // --- terreno y plataformas, agrupados en tramos ---------------------------
  //
  // Antes se creaba un sprite con su cuerpo por cada casilla: en un nivel largo
  // salian mas de 500 cuerpos de fisica y el juego bajaba a 20 fotogramas por
  // segundo. Ahora cada fila de casillas seguidas es UN solo rectangulo, con un
  // unico cuerpo, y el dibujo se repite con un tileSprite. De 500 cuerpos a 20.
  const tramosDe = (simbolo) => {
    const tramos = [];
    for (let fila = 0; fila < filas; fila += 1) {
      let inicio = null;
      for (let col = 0; col <= columnas; col += 1) {
        const esteEs = col < columnas && mapa[fila][col] === simbolo;
        if (esteEs && inicio === null) inicio = col;
        if (!esteEs && inicio !== null) {
          tramos.push({ fila, desde: inicio, hasta: col - 1 });
          inicio = null;
        }
      }
    }
    return tramos;
  };

  tramosDe(SIMBOLOS.SOLIDO).forEach(({ fila, desde, hasta }) => {
    const ancho = (hasta - desde + 1) * C;
    // solo la franja de mas arriba lleva el canto de la calle
    const alAire = fila === 0 || mapa[fila - 1][desde] !== SIMBOLOS.SOLIDO;
    const trozo = mosaico(escena, desde * C, fila * C, ancho, C, alAire ? texturaSuelo : texturaTierra);
    escena.physics.add.existing(trozo, true);
    solidos.add(trozo);
  });

  tramosDe(SIMBOLOS.PLATAFORMA).forEach(({ fila, desde, hasta }) => {
    const ancho = (hasta - desde + 1) * C;
    const trozo = mosaico(escena, desde * C, fila * C, ancho, 12, texturaPlataforma);
    escena.physics.add.existing(trozo, true);
    // se atraviesa desde abajo y por los lados: solo frena al caer encima
    trozo.body.checkCollision.down = false;
    trozo.body.checkCollision.left = false;
    trozo.body.checkCollision.right = false;
    plataformas.add(trozo);
  });

  for (let fila = 0; fila < filas; fila += 1) {
    for (let col = 0; col < columnas; col += 1) {
      const simbolo = mapa[fila][col];
      const x = centroX(col);
      const y = centroY(fila);

      switch (simbolo) {
        case SIMBOLOS.SOLIDO:
        case SIMBOLOS.PLATAFORMA:
          break; // el terreno se monta por tramos, mas abajo

        case SIMBOLOS.MONEDA: {
          const moneda = monedas.create(x, y, texturaMoneda);
          // Medida explicita: el dibujo del sushi viene en un lienzo grande y
          // sin esto ocupaba media pantalla. Y hay que refrescar el cuerpo: es
          // estatico y se quedaba con el tamano de la TEXTURA, asi que los
          // premios se recogian desde media pantalla de distancia.
          moneda.setDisplaySize(PREMIO.ancho, PREMIO.alto);
          moneda.refreshBody();
          moneda.setDepth(5);
          escena.tweens.add({
            targets: moneda,
            y: y - 4,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: (col % 5) * 120,
          });
          break;
        }

        case SIMBOLOS.ENEMIGO: {
          // Apoyado en el suelo de su casilla, igual que el jefe. Antes se
          // ponia centrado en la casilla, que es lo mismo mientras el bicho
          // mida 32; al crecer hasta la altura de los ninos, su caja acababa
          // 25 px por debajo del suelo y la fisica lo dejaba medio enterrado o
          // lo escupia a caminar por el aire.
          const apoyo = baseY(fila) - ENEMIGO.alto / 2 + (ENEMIGO.margenPie || 0);
          const enemigo = new Enemigo(escena, x, apoyo, col % 2 === 0 ? -1 : 1);
          enemigos.add(enemigo);
          break;
        }

        case SIMBOLOS.JEFE: {
          // se le coloca apoyado en el suelo de su casilla
          const Guardian = jefeDeCiudad(ciudad);
          jefe = new Guardian(escena, x, baseY(fila) - JEFE_ALTO / 2, -1);
          break;
        }

        case SIMBOLOS.CHECKPOINT: {
          const bandera = checkpoints.create(x, baseY(fila) - 26, texturaBandera);
          if (texturaBandera === TEXTURAS.checkpointApagado) aEscalaDeJuego(bandera);
          else bandera.setDisplaySize(CHECKPOINT.ancho, CHECKPOINT.alto);
          // Apagado va translucido; al tocarlo se enciende del todo.
          bandera.setAlpha(CHECKPOINT.alphaApagado);
          bandera.setDepth(4);
          bandera.activo = false;
          bandera.col = col;
          bandera.fila = fila;
          // Al cambiarle el tamano hay que refrescar el cuerpo: en los cuerpos
          // estaticos no se entera solo, y se quedaba donde y como estaba antes
          // (llego a quedar 107 px descolocado del dibujo).
          bandera.refreshBody();
          // La zona de contacto es una columna alta: asi no se puede pasar de
          // largo saltando por encima y quedarse sin checkpoint. En un cuerpo
          // estatico la medida va en pixeles de pantalla, sin escalar.
          bandera.body.setSize(C, C * 10, true);
          break;
        }

        case SIMBOLOS.META: {
          meta = escena.physics.add.staticSprite(x, baseY(fila) - META.alto / 2, texturaMeta);
          if (texturaMeta === TEXTURAS.meta) aEscalaDeJuego(meta);
          else meta.setDisplaySize(META.ancho, META.alto);
          meta.setDepth(4);
          meta.refreshBody();
          // igual que el checkpoint: alta, para que no se pueda saltar por encima
          meta.body.setSize(C, C * 10, true);
          break;
        }

        case SIMBOLOS.INICIO:
          inicio = { col, fila };
          break;

        default:
          break;
      }
    }
  }

  // Con jefe, la meta empieza apagada: no se puede pasar hasta derrotarlo.
  if (meta && jefe) meta.setAlpha(0.4);

  // Carteles de ayuda flotando en el mundo. Los del primer tramo hablan de las
  // teclas, asi que en un telefono dicen otra cosa: ahi no hay flechas ni
  // barra espaciadora que valgan.
  const conMandos = hayTactil() ? EN_TACTIL : {};
  (nivel.pistas || []).forEach((pista) => {
    escena.add
      .text(centroX(pista.col), centroY(pista.fila), conMandos[pista.texto] || pista.texto, {
        fontFamily: FUENTE.familia,
        fontSize: `${FUENTE.pista}px`,
        color: COLORES.textoClaro,
        align: 'center',
        stroke: '#16202c',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0.92);
  });

  // consulta rapida del mapa, sin tocar la fisica
  const casillaEn = (col, fila) => {
    if (fila < 0 || fila >= filas || col < 0 || col >= columnas) return SIMBOLOS.VACIO;
    return mapa[fila][col];
  };

  return {
    mapa,
    filas,
    columnas,
    ancho,
    alto,
    solidos,
    plataformas,
    monedas,
    checkpoints,
    enemigos,
    meta,
    jefe,
    inicio,
    casillaEn,
    totalMonedas: mapa.join('').split(SIMBOLOS.MONEDA).length - 1,
  };
}
