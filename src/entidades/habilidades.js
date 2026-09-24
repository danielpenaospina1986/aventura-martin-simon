// ---------------------------------------------------------------------------
// HABILIDADES
// Una funcion por habilidad. Recibe (jugador, escena) y devuelve los
// milisegundos de recarga. Anadir una habilidad nueva = anadir una funcion
// aqui y nombrarla en src/config/personajes.js.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { KATANA, LANZAMIENTO, RENDER } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';

// --- Martin: golpe de katana ------------------------------------------------

function katana(jugador, escena) {
  const dir = jugador.mirando;
  const y = jugador.y + KATANA.desfaseY;
  const x = jugador.x + dir * (jugador.datos.ancho / 2 + 10);

  // Si el personaje tiene pose de ataque, el arco ya viene dibujado en ella y
  // pintar otro encima queda doble.
  const arco = jugador.datos.poses && jugador.datos.poses.atacar ? null : escena.add
    .image(x, y, TEXTURAS.arcoKatana)
    .setDepth(30)
    .setFlipX(dir < 0)
    // la textura se genera a la densidad del render: su escala natural es 1/D
    .setScale(0.85 / RENDER.densidad);
  if (arco) {
    escena.tweens.add({
      targets: arco,
      alpha: { from: 1, to: 0 },
      scaleX: (dir < 0 ? -1.2 : 1.2) / RENDER.densidad,
      scaleY: 1.2 / RENDER.densidad,
      duration: KATANA.duracionMs,
      onComplete: () => arco.destroy(),
    });
  }

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

  // Lo que cuelgue en la arena de un jefe (los materos del Carrotanque) se
  // lleva el golpe igual: es justo asi como se le gana.
  if (escena.golpearColgantes) escena.golpearColgantes(zona, jugador.x);

  // el jefe tambien se lleva lo suyo
  if (escena.jefe && escena.jefe.active) {
    if (Phaser.Geom.Intersects.RectangleToRectangle(zona, escena.jefe.getBounds())) {
      escena.golpearJefe(jugador.x);
    }
  }

  return KATANA.recargaMs;
}

// --- Simon: lanzar bloques ---------------------------------------------------

function lanzar(jugador, escena) {
  if (escena.proyectilesVivos() >= LANZAMIENTO.maximo) return 120;
  escena.lanzarBloque(jugador);
  return LANZAMIENTO.recargaMs;
}

export const HABILIDADES = { katana, lanzar };

export default HABILIDADES;
