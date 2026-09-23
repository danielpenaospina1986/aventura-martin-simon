// ---------------------------------------------------------------------------
// PANTALLA DE TITULO
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';

export class EscenaTitulo extends Phaser.Scene {
  constructor() {
    super('titulo');
  }

  create() {
    const { width: ancho, height: alto } = this.scale;

    // La portada ya trae el titulo dibujado, asi que aqui no se escribe: se
    // pone la ilustracion a pantalla completa y encima solo lo justo.
    const fuente = this.textures.get(TEXTURAS.portada).getSourceImage();
    const escala = Math.max(ancho / fuente.width, alto / fuente.height);
    this.add
      .image(ancho / 2, alto / 2, TEXTURAS.portada)
      .setScale(escala)
      .setDepth(-100);

    // un velo abajo, para que se lean los textos sobre el dibujo
    const velo = this.add.graphics().setDepth(-50);
    velo.fillGradientStyle(
      COLORES.decoFondo,
      COLORES.decoFondo,
      COLORES.decoFondo,
      COLORES.decoFondo,
      0,
      0,
      0.82,
      0.82,
    );
    velo.fillRect(0, alto - 180, ancho, 180);

    this.add
      .text(
        ancho / 2,
        alto - 122,
        '← →  o  A D   moverse        ↑  W  o  Espacio   saltar        X  o  F   habilidad',
        {
          fontFamily: FUENTE.familia,
          fontSize: '17px',
          color: COLORES.textoSuave,
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const empezar = this.add
      .text(ancho / 2, alto - 66, 'Pulsa Enter o haz clic para empezar', {
        fontFamily: FUENTE.familia,
        fontSize: `${FUENTE.opcion}px`,
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: empezar,
      alpha: { from: 1, to: 0.55 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const comenzar = () => this.scene.start('seleccion');
    this.input.keyboard.once('keydown-ENTER', comenzar);
    this.input.keyboard.once('keydown-SPACE', comenzar);
    this.input.once('pointerdown', comenzar);
  }
}

export default EscenaTitulo;
