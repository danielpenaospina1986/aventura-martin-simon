// ---------------------------------------------------------------------------
// EFECTOS
// Pequenas animaciones de premio. Hechas con tweens para no depender del
// sistema de particulas: son faciles de cambiar cuando llegue el arte final.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { PREMIO, RENDER } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';

// Las texturas se generan a la densidad del render, asi que un objeto recien
// creado mide D veces de mas y su escala "natural" es esta, no 1. Todo lo que
// anime la escala tiene que ir en proporcion.
const BASE = () => 1 / RENDER.densidad;

// Nube de estrellitas: se usa al eliminar a un enemigo.
export function estrellitas(escena, x, y, cantidad = 9) {
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = (Math.PI * 2 * i) / cantidad + Phaser.Math.FloatBetween(-0.2, 0.2);
    const distancia = Phaser.Math.Between(26, 56);
    const estrella = escena.add
      .image(x, y, TEXTURAS.estrella)
      .setDepth(40)
      .setScale(BASE() * Phaser.Math.FloatBetween(0.7, 1.2));

    escena.tweens.add({
      targets: estrella,
      x: x + Math.cos(angulo) * distancia,
      y: y + Math.sin(angulo) * distancia - 14,
      alpha: { from: 1, to: 0 },
      angle: Phaser.Math.Between(-220, 220),
      scale: BASE() * 0.2,
      duration: Phaser.Math.Between(340, 520),
      ease: 'Quad.easeOut',
      onComplete: () => estrella.destroy(),
    });
  }
}

// Destello al recoger una moneda (sushi o bloque, segun el personaje).
export function brilloMoneda(escena, x, y, textura = TEXTURAS.moneda) {
  const brillo = escena.add
    .image(x, y, textura)
    .setDepth(40)
    .setDisplaySize(PREMIO.ancho, PREMIO.alto);
  escena.tweens.add({
    targets: brillo,
    y: y - 34,
    alpha: { from: 1, to: 0 },
    scale: { from: brillo.scaleX, to: brillo.scaleX * 1.9 },
    duration: 320,
    ease: 'Quad.easeOut',
    onComplete: () => brillo.destroy(),
  });
}

// Texto que sube y se desvanece.
export function textoFlotante(escena, x, y, texto, color = COLORES.textoAcento) {
  const etiqueta = escena.add
    .text(x, y, texto, {
      fontFamily: FUENTE.familia,
      fontSize: '18px',
      color,
      stroke: '#16202c',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(45);

  escena.tweens.add({
    targets: etiqueta,
    y: y - 40,
    alpha: { from: 1, to: 0 },
    duration: 700,
    ease: 'Quad.easeOut',
    onComplete: () => etiqueta.destroy(),
  });
}

// Polvo cuadrado, para cuando desaparece un bloque construido.
export function polvo(escena, x, y) {
  for (let i = 0; i < 6; i += 1) {
    const trozo = escena.add
      .rectangle(x, y, 7, 7, COLORES.bloque)
      .setDepth(40);
    escena.tweens.add({
      targets: trozo,
      x: x + Phaser.Math.Between(-28, 28),
      y: y + Phaser.Math.Between(-10, 26),
      alpha: 0,
      angle: Phaser.Math.Between(-180, 180),
      duration: Phaser.Math.Between(260, 420),
      onComplete: () => trozo.destroy(),
    });
  }
}
