// ---------------------------------------------------------------------------
// MENU
// Lista de opciones que se maneja con flechas + Enter, o con el raton.
// La usan el titulo, la seleccion de personaje, la pausa y la victoria.
// ---------------------------------------------------------------------------

import { COLORES, FUENTE } from '../config/estilo.js';

export class Menu {
  constructor(escena, opciones, config = {}) {
    this.escena = escena;
    this.opciones = opciones;
    this.indice = config.indiceInicial || 0;
    this.horizontal = config.horizontal || false;
    this.separacion = config.separacion || (this.horizontal ? 260 : 52);
    this.tamano = config.tamano || FUENTE.opcion;

    const x = config.x ?? escena.scale.width / 2;
    const y = config.y ?? escena.scale.height / 2;

    this.etiquetas = opciones.map((opcion, i) => {
      const px = this.horizontal ? x + (i - (opciones.length - 1) / 2) * this.separacion : x;
      const py = this.horizontal ? y : y + i * this.separacion;

      const etiqueta = escena.add
        .text(px, py, opcion.etiqueta, {
          fontFamily: FUENTE.familia,
          fontSize: `${this.tamano}px`,
          color: COLORES.textoSuave,
          stroke: '#16202c',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });

      etiqueta.on('pointerover', () => this.mover(i));
      etiqueta.on('pointerdown', () => {
        this.mover(i);
        this.confirmar();
      });
      return etiqueta;
    });

    this.pintar();
    this.escucharTeclado();
  }

  escucharTeclado() {
    const teclado = this.escena.input.keyboard;
    const anterior = this.horizontal ? 'keydown-LEFT' : 'keydown-UP';
    const siguiente = this.horizontal ? 'keydown-RIGHT' : 'keydown-DOWN';

    this.manejadores = [
      [anterior, () => this.mover(this.indice - 1)],
      [siguiente, () => this.mover(this.indice + 1)],
      ['keydown-A', () => this.horizontal && this.mover(this.indice - 1)],
      ['keydown-D', () => this.horizontal && this.mover(this.indice + 1)],
      ['keydown-W', () => !this.horizontal && this.mover(this.indice - 1)],
      ['keydown-S', () => !this.horizontal && this.mover(this.indice + 1)],
      ['keydown-ENTER', () => this.confirmar()],
      ['keydown-SPACE', () => this.confirmar()],
    ];
    this.manejadores.forEach(([evento, fn]) => teclado.on(evento, fn));

    this.escena.events.once('shutdown', () => this.destruir());
  }

  mover(nuevo) {
    const total = this.opciones.length;
    this.indice = ((nuevo % total) + total) % total;
    this.pintar();
  }

  pintar() {
    this.etiquetas.forEach((etiqueta, i) => {
      const elegida = i === this.indice;
      etiqueta.setColor(elegida ? COLORES.textoAcento : COLORES.textoSuave);
      etiqueta.setScale(elegida ? 1.08 : 1);
      etiqueta.setText(elegida ? `▶  ${this.opciones[i].etiqueta}  ◀` : this.opciones[i].etiqueta);
    });
    if (this.alCambiar) this.alCambiar(this.indice);
  }

  confirmar() {
    const opcion = this.opciones[this.indice];
    if (opcion && opcion.alElegir) opcion.alElegir(this.indice);
  }

  destruir() {
    const teclado = this.escena.input.keyboard;
    if (teclado && this.manejadores) {
      this.manejadores.forEach(([evento, fn]) => teclado.off(evento, fn));
    }
    this.manejadores = null;
  }
}

export default Menu;
