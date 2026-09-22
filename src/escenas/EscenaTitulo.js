// ---------------------------------------------------------------------------
// PANTALLA DE TITULO
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { COLORES, FUENTE } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { pintarFondo } from '../sistemas/dibujo.js';

export class EscenaTitulo extends Phaser.Scene {
  constructor() {
    super('titulo');
  }

  create() {
    const { width: ancho, height: alto } = this.scale;
    pintarFondo(this, ancho, alto);

    // suelo decorativo
    this.add.rectangle(0, alto - 60, ancho, 60, COLORES.tierra).setOrigin(0, 0);
    this.add.rectangle(0, alto - 60, ancho, 10, COLORES.hierba).setOrigin(0, 0);

    // los dos personajes saludando a los lados del titulo
    const martin = this.add
      .image(ancho / 2 - 340, alto - 58, PERSONAJES.martin.textura)
      .setOrigin(0.5, 1)
      .setScale(2.4);
    const simon = this.add
      .image(ancho / 2 + 340, alto - 58, PERSONAJES.simon.textura)
      .setOrigin(0.5, 1)
      .setScale(2.4)
      .setFlipX(true);

    [martin, simon].forEach((personaje, i) => {
      this.tweens.add({
        targets: personaje,
        y: personaje.y - 16,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 260,
      });
    });

    this.add
      .text(ancho / 2, 104, 'Las aventuras de', {
        fontFamily: FUENTE.familia,
        fontSize: `${FUENTE.subtitulo}px`,
        color: COLORES.textoClaro,
        stroke: '#16202c',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(ancho / 2, 166, 'Martín y Simón', {
        fontFamily: FUENTE.familia,
        fontSize: `${FUENTE.titulo}px`,
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 9,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // panel de controles, siempre a la vista
    const panel = this.add
      .rectangle(ancho / 2, 290, 520, 118, COLORES.panel, 0.55)
      .setStrokeStyle(2, COLORES.panelBorde, 0.9);
    this.add
      .text(
        panel.x,
        panel.y,
        '← →  o  A D   moverse\n↑  W  o  Espacio   saltar\nX  o  F   habilidad        Esc   pausa',
        {
          fontFamily: FUENTE.familia,
          fontSize: '19px',
          color: COLORES.textoSuave,
          align: 'center',
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5);

    const empezar = this.add
      .text(ancho / 2, 404, 'Pulsa Enter o haz clic para empezar', {
        fontFamily: FUENTE.familia,
        fontSize: `${FUENTE.opcion}px`,
        color: COLORES.textoClaro,
        stroke: '#16202c',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: empezar,
      alpha: { from: 1, to: 0.35 },
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
