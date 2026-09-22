// ---------------------------------------------------------------------------
// CONSTRUCTOR DE NIVEL
// Convierte el mapa de texto de src/niveles/*.js en objetos del mundo.
// Es el unico sitio que sabe que significa cada simbolo.
// ---------------------------------------------------------------------------

import { JEFE, MUNDO } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { Enemigo } from '../entidades/Enemigo.js';
import { Jefe } from '../entidades/Jefe.js';

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

export function construirNivel(escena, nivel, opciones = {}) {
  // Cada personaje recoge lo suyo: sushi para Martin, bloques para Simon.
  const texturaMoneda = opciones.texturaMoneda || TEXTURAS.moneda;
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

  for (let fila = 0; fila < filas; fila += 1) {
    for (let col = 0; col < columnas; col += 1) {
      const simbolo = mapa[fila][col];
      const x = centroX(col);
      const y = centroY(fila);

      switch (simbolo) {
        case SIMBOLOS.SOLIDO: {
          // solo la casilla de mas arriba lleva hierba
          const alAire = fila === 0 || mapa[fila - 1][col] !== SIMBOLOS.SOLIDO;
          solidos.create(x, y, alAire ? TEXTURAS.suelo : TEXTURAS.tierra);
          break;
        }

        case SIMBOLOS.PLATAFORMA: {
          // se dibuja pegada al techo de la casilla y solo frena desde arriba
          const p = plataformas.create(x, fila * C + 6, TEXTURAS.plataforma);
          p.body.checkCollision.down = false;
          p.body.checkCollision.left = false;
          p.body.checkCollision.right = false;
          break;
        }

        case SIMBOLOS.MONEDA: {
          const moneda = monedas.create(x, y, texturaMoneda);
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
          const enemigo = new Enemigo(escena, x, y, col % 2 === 0 ? -1 : 1);
          enemigos.add(enemigo);
          break;
        }

        case SIMBOLOS.JEFE: {
          // se le coloca apoyado en el suelo de su casilla
          jefe = new Jefe(escena, x, baseY(fila) - JEFE_ALTO / 2, -1);
          break;
        }

        case SIMBOLOS.CHECKPOINT: {
          const bandera = checkpoints.create(
            x,
            baseY(fila) - 22,
            TEXTURAS.checkpointApagado,
          );
          bandera.setDepth(4);
          bandera.activo = false;
          bandera.col = col;
          bandera.fila = fila;
          // La zona de contacto es una columna alta: asi no se puede pasar de
          // largo saltando por encima y quedarse sin checkpoint.
          bandera.body.setSize(C, C * 10, true);
          break;
        }

        case SIMBOLOS.META: {
          meta = escena.physics.add.staticSprite(x, baseY(fila) - 31, TEXTURAS.meta);
          meta.setDepth(4);
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

  // carteles de ayuda flotando en el mundo
  (nivel.pistas || []).forEach((pista) => {
    escena.add
      .text(centroX(pista.col), centroY(pista.fila), pista.texto, {
        fontFamily: FUENTE.familia,
        fontSize: `${FUENTE.pista}px`,
        color: COLORES.textoClaro,
        align: 'center',
        stroke: '#16202c',
        strokeThickness: 5,
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
