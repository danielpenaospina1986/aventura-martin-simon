// ---------------------------------------------------------------------------
// VICTORIA
// Sin puntuaciones ni castigos: solo celebrar y volver a jugar.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { COLORES, FONDO, FUENTE, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { pintarFondo } from '../sistemas/dibujo.js';
import { estrellitas } from '../sistemas/efectos.js';
import { Menu } from '../sistemas/menu.js';

export class EscenaVictoria extends Phaser.Scene {
  constructor() {
    super('victoria');
  }

  init(datos) {
    this.personajeId = (datos && datos.personajeId) || 'martin';
    this.monedas = (datos && datos.monedas) || 0;
    this.total = (datos && datos.total) || 0;
  }

  create() {
    const { width: ancho, height: alto } = this.scale;
    const datos = PERSONAJES[this.personajeId];
    pintarFondo(this, ancho, alto, { veloExtra: FONDO.veloMenus });

    this.add.rectangle(0, alto - 60, ancho, 60, COLORES.tierra).setOrigin(0, 0);
    this.add.rectangle(0, alto - 60, ancho, 10, COLORES.hierba).setOrigin(0, 0);

    this.add
      .text(ancho / 2, 78, '¡Lo lograste!', {
        fontFamily: FUENTE.familia,
        fontSize: '56px',
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 9,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(ancho / 2, 128, `${datos.nombre} ha llegado a la meta`, {
        fontFamily: FUENTE.familia,
        fontSize: '22px',
        color: COLORES.textoClaro,
        stroke: '#16202c',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // el personaje dando saltos de alegria
    const figura = this.add.image(ancho / 2, 280, datos.textura).setOrigin(0.5, 1).setScale(2.2);
    this.tweens.add({
      targets: figura,
      y: figura.y - 22,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });

    this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => estrellitas(this, ancho / 2, 215, 7),
    });

    // monedas
    this.add.image(ancho / 2 - 62, 312, TEXTURAS.moneda).setScale(1.4);
    this.add
      .text(ancho / 2 - 38, 312, `${this.monedas} de ${this.total} monedas`, {
        fontFamily: FUENTE.familia,
        fontSize: '26px',
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 5,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(ancho / 2, 352, this.mensaje(), {
        fontFamily: FUENTE.familia,
        fontSize: '17px',
        color: COLORES.textoSuave,
        align: 'center',
        stroke: '#16202c',
        strokeThickness: 4,
        lineSpacing: 5,
      })
      .setOrigin(0.5);

    new Menu(
      this,
      [
        {
          etiqueta: 'Jugar otra vez',
          alElegir: () => this.scene.start('nivel', { personajeId: this.personajeId }),
        },
        { etiqueta: 'Cambiar personaje', alElegir: () => this.scene.start('seleccion') },
      ],
      { x: ancho / 2, y: 425, separacion: 48, tamano: 27 },
    );
  }

  mensaje() {
    if (this.total === 0) return '';
    if (this.monedas >= this.total) return '¡Todas las monedas! No se te ha escapado ni una.';
    const otro = this.personajeId === 'martin' ? PERSONAJES.simon : PERSONAJES.martin;
    return `Quedan ${this.total - this.monedas} monedas por ahí.\nPrueba con ${otro.nombre}: su habilidad llega a sitios distintos.`;
  }
}

export default EscenaVictoria;
