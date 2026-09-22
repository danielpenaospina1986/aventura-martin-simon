// ---------------------------------------------------------------------------
// PAUSA
// Se lanza encima del nivel, que queda congelado detras.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { COLORES, FUENTE } from '../config/estilo.js';
import { Menu } from '../sistemas/menu.js';

export class EscenaPausa extends Phaser.Scene {
  constructor() {
    super('pausa');
  }

  init(datos) {
    this.personajeId = (datos && datos.personajeId) || 'martin';
  }

  create() {
    const { width: ancho, height: alto } = this.scale;

    this.add.rectangle(0, 0, ancho, alto, 0x0a0f18, 0.72).setOrigin(0, 0);

    this.add
      .rectangle(ancho / 2, alto / 2 - 6, 440, 300, COLORES.panel, 0.9)
      .setStrokeStyle(3, COLORES.panelBorde, 1);

    this.add
      .text(ancho / 2, alto / 2 - 108, 'Pausa', {
        fontFamily: FUENTE.familia,
        fontSize: '46px',
        color: COLORES.textoAcento,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    new Menu(
      this,
      [
        { etiqueta: 'Seguir jugando', alElegir: () => this.reanudar() },
        { etiqueta: 'Cambiar personaje', alElegir: () => this.salirA('seleccion') },
        { etiqueta: 'Volver al menú', alElegir: () => this.salirA('titulo') },
      ],
      { x: ancho / 2, y: alto / 2 - 20, separacion: 52, tamano: 26 },
    );

    this.add
      .text(ancho / 2, alto / 2 + 118, 'Esc  seguir jugando', {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoSuave,
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.input.keyboard.once('keydown-ESC', () => this.reanudar());
  }

  reanudar() {
    this.scene.stop();
    this.scene.resume('nivel');
  }

  salirA(destino) {
    this.scene.stop('nivel');
    this.scene.stop();
    this.scene.start(destino);
  }
}

export default EscenaPausa;
