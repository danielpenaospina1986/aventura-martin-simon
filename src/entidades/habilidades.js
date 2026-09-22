// ---------------------------------------------------------------------------
// HABILIDADES
// Una funcion por habilidad. Recibe (jugador, escena) y devuelve los
// milisegundos de recarga. Anadir una habilidad nueva = anadir una funcion
// aqui y nombrarla en src/config/personajes.js.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { KATANA, CONSTRUCCION, MUNDO } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';

// --- Martin: golpe de katana ------------------------------------------------

function katana(jugador, escena) {
  const dir = jugador.mirando;
  const y = jugador.y + KATANA.desfaseY;
  const x = jugador.x + dir * (jugador.datos.ancho / 2 + 10);

  // arco blanco breve
  const arco = escena.add
    .image(x, y, TEXTURAS.arcoKatana)
    .setDepth(30)
    .setFlipX(dir < 0)
    .setScale(0.85);
  escena.tweens.add({
    targets: arco,
    alpha: { from: 1, to: 0 },
    scaleX: dir < 0 ? -1.2 : 1.2,
    scaleY: 1.2,
    duration: KATANA.duracionMs,
    onComplete: () => arco.destroy(),
  });

  // zona de dano: se comprueba una sola vez, en el momento del golpe
  const zona = new Phaser.Geom.Rectangle(
    dir > 0 ? jugador.x : jugador.x - KATANA.alcance,
    y - KATANA.alto / 2,
    KATANA.alcance,
    KATANA.alto,
  );

  escena.enemigos
    .getChildren()
    .slice()
    .forEach((enemigo) => {
      if (!enemigo.active) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(zona, enemigo.getBounds())) {
        escena.eliminarEnemigo(enemigo);
      }
    });

  return KATANA.recargaMs;
}

// --- Simon: construir bloques -----------------------------------------------

function construir(jugador, escena) {
  const c = MUNDO.casilla;
  let col;
  let fila;

  if (jugador.enSuelo) {
    // en el piso: la casilla de adelante, a la altura de sus pies
    col = Math.floor((jugador.x + jugador.mirando * c) / c);
    fila = Math.floor((jugador.body.bottom - 1) / c);
  } else {
    // en el aire: justo debajo de el
    col = Math.floor(jugador.x / c);
    fila = Math.ceil(jugador.body.bottom / c);
  }

  if (!escena.casillaLibre(col, fila, jugador)) return 120;

  escena.colocarBloque(col, fila, jugador);
  return CONSTRUCCION.recargaMs;
}

export const HABILIDADES = { katana, construir };

export default HABILIDADES;
