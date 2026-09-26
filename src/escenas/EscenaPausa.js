// ---------------------------------------------------------------------------
// PAUSA
// Se lanza encima del nivel, que queda congelado detras.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER } from '../config/ajustes.js';
import { COLORES, FUENTE } from '../config/estilo.js';
import { Menu } from '../sistemas/menu.js';
import { segunElMando } from '../sistemas/tactil.js';

export class EscenaPausa extends Phaser.Scene {
  constructor() {
    super('pausa');
  }

  init(datos) {
    this.personajeId = (datos && datos.personajeId) || 'martin';
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de 640 x 360 de siempre.
    // Hay que recentrarla: con zoom, una camara sin tocar mira el centro de su
    // propio tamano en pixeles, que ya no es el centro del juego.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;

    this.add.rectangle(0, 0, ancho, alto, 0x0a0f18, 0.72).setOrigin(0, 0);

    this.add
      .rectangle(ancho / 2, alto / 2 - 4, 300, 200, COLORES.panel, 0.92)
      .setStrokeStyle(2, COLORES.panelBorde, 1);

    this.add
      .text(ancho / 2, alto / 2 - 72, 'Pausa', {
        fontFamily: FUENTE.familia,
        fontSize: '30px',
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
      { x: ancho / 2, y: alto / 2 - 14, separacion: 34, tamano: 17 },
    );

    this.add
      .text(ancho / 2, alto / 2 + 86, segunElMando('Esc  seguir jugando', 'Toca una opción'), {
        fontFamily: FUENTE.familia,
        fontSize: '11px',
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
