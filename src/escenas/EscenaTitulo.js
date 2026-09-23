// ---------------------------------------------------------------------------
// PANTALLA DE TITULO
//
// La ilustracion manda: trae el titulo ya dibujado en su cartel, arriba a la
// derecha, y los ninos cargados a la izquierda. Por eso aqui no se escribe
// ningun titulo y todo lo que hay que decir va en una caja art deco colgada
// justo debajo del cartel, en el hueco que la ilustracion deja libre.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { panelDeco } from '../sistemas/dibujo.js';

// Donde cae el cartel del titulo dentro de la ilustracion, en tanto por uno.
// Se mide sobre el dibujo y no en pixeles de pantalla para que siga cuadrando
// si algun dia cambia la resolucion.
const CARTEL = { x1: 0.576, x2: 0.973, y2: 0.255 };

export class EscenaTitulo extends Phaser.Scene {
  constructor() {
    super('titulo');
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de 640 x 360 de siempre.
    // Hay que recentrarla: con zoom, una camara sin tocar mira el centro de su
    // propio tamano en pixeles, que ya no es el centro del juego.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;

    const fuente = this.textures.get(TEXTURAS.portada).getSourceImage();
    const escala = Math.max(ancho / fuente.width, alto / fuente.height);
    this.add
      .image(ancho / 2, alto / 2, TEXTURAS.portada)
      .setScale(escala)
      .setDepth(-100);

    // El dibujo se pinta "a cubrir", asi que puede sobrar por los lados: hay
    // que descontar ese sobrante para saber donde cae el cartel en pantalla.
    const sobraX = (fuente.width * escala - ancho) / 2;
    const sobraY = (fuente.height * escala - alto) / 2;
    const enPantallaX = (t) => t * fuente.width * escala - sobraX;
    const enPantallaY = (t) => t * fuente.height * escala - sobraY;

    const izquierda = enPantallaX(CARTEL.x1);
    const derecha = enPantallaX(CARTEL.x2);
    const bajoElCartel = enPantallaY(CARTEL.y2);

    const anchoCaja = derecha - izquierda;
    const altoCaja = 124;
    const centroX = (izquierda + derecha) / 2;
    const centroY = bajoElCartel + 14 + altoCaja / 2;

    // La caja va translucida a proposito: se tiene que seguir viendo la ciudad
    // de detras, que es la gracia de la portada.
    panelDeco(this, centroX, centroY, anchoCaja, altoCaja, { alpha: 0.62 });

    const empezar = this.add
      .text(centroX, centroY - altoCaja / 2 + 28, 'Pulsa Enter para empezar', {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 4,
        align: 'center',
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

    // Nada de flechas dibujadas: la tipografia no trae esos signos y salian
    // rotos. Se dicen con palabras.
    const controles = [
      ['Moverse', 'flechas  o  A D'],
      ['Saltar', 'arriba  W  Espacio'],
      ['Habilidad', 'X  o  F'],
    ];
    const margen = 20;
    const primeraFila = centroY - altoCaja / 2 + 56;
    controles.forEach(([que, teclas], i) => {
      const y = primeraFila + i * 19;
      this.add
        .text(izquierda + margen, y, que, {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoAcento,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(derecha - margen, y, teclas, {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoSuave,
        })
        .setOrigin(1, 0.5);
    });

    const comenzar = () => this.scene.start('seleccion');
    this.input.keyboard.once('keydown-ENTER', comenzar);
    this.input.keyboard.once('keydown-SPACE', comenzar);
    this.input.once('pointerdown', comenzar);
  }
}

export default EscenaTitulo;
