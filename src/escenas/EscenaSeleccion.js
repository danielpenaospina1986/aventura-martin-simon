// ---------------------------------------------------------------------------
// SELECCION DE PERSONAJE
// Los dos corren y saltan igual. Lo que cambia es la habilidad.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { COLORES, FONDO, FUENTE } from '../config/estilo.js';
import { PERSONAJES, ORDEN_PERSONAJES } from '../config/personajes.js';
import { pintarFondo } from '../sistemas/dibujo.js';
import { Menu } from '../sistemas/menu.js';

export class EscenaSeleccion extends Phaser.Scene {
  constructor() {
    super('seleccion');
  }

  create() {
    const { width: ancho, height: alto } = this.scale;
    pintarFondo(this, ancho, alto, { veloExtra: FONDO.veloMenus });

    this.add.rectangle(0, alto - 50, ancho, 50, COLORES.tierra).setOrigin(0, 0);
    this.add.rectangle(0, alto - 50, ancho, 9, COLORES.hierba).setOrigin(0, 0);

    this.add
      .text(ancho / 2, 56, '¿Quién va a jugar?', {
        fontFamily: FUENTE.familia,
        fontSize: '40px',
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 8,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(ancho / 2, 100, 'Los dos corren y saltan igual: cambia la habilidad', {
        fontFamily: FUENTE.familia,
        fontSize: '18px',
        color: COLORES.textoSuave,
        stroke: '#16202c',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // --- tarjetas ---
    this.tarjetas = ORDEN_PERSONAJES.map((id, i) => {
      const datos = PERSONAJES[id];
      const x = ancho / 2 + (i - (ORDEN_PERSONAJES.length - 1) / 2) * 300;
      const y = 280;

      const marco = this.add
        .rectangle(x, y, 264, 316, COLORES.panel, 0.55)
        .setStrokeStyle(3, COLORES.panelBorde, 0.9);

      const figura = this.add
        .image(x, y - 76, datos.textura)
        .setOrigin(0.5, 0.5)
        .setScale(2.4);

      this.tweens.add({
        targets: figura,
        y: figura.y - 10,
        duration: 820,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 200,
      });

      const nombre = this.add
        .text(x, y + 22, datos.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: '30px',
          color: COLORES.textoClaro,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const habilidad = this.add
        .text(x, y + 54, datos.nombreHabilidad, {
          fontFamily: FUENTE.familia,
          fontSize: '19px',
          color: COLORES.textoAcento,
        })
        .setOrigin(0.5);

      const descripcion = this.add
        .text(x, y + 102, datos.descripcion, {
          fontFamily: FUENTE.familia,
          fontSize: '16px',
          color: COLORES.textoSuave,
          align: 'center',
          lineSpacing: 5,
        })
        .setOrigin(0.5);

      return { datos, marco, figura, nombre, habilidad, descripcion };
    });

    // --- menu de eleccion ---
    this.menu = new Menu(
      this,
      ORDEN_PERSONAJES.map((id) => ({
        etiqueta: PERSONAJES[id].nombre,
        alElegir: () => this.scene.start('nivel', { personajeId: id }),
      })),
      { x: ancho / 2, y: 478, horizontal: true, separacion: 300, tamano: 26 },
    );
    this.menu.alCambiar = (indice) => this.resaltar(indice);
    this.resaltar(0);

    this.add
      .text(ancho / 2, 516, '← →  elegir        Enter o clic  empezar        Esc  volver', {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoSuave,
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.input.keyboard.once('keydown-ESC', () => this.scene.start('titulo'));
  }

  resaltar(indice) {
    if (!this.tarjetas) return;
    this.tarjetas.forEach((tarjeta, i) => {
      const elegida = i === indice;
      tarjeta.marco.setStrokeStyle(elegida ? 4 : 3, elegida ? 0xffd54a : COLORES.panelBorde, 0.95);
      tarjeta.marco.setFillStyle(COLORES.panel, elegida ? 0.75 : 0.45);
      tarjeta.figura.setScale(elegida ? 2.7 : 2.2);
      tarjeta.nombre.setColor(elegida ? COLORES.textoAcento : COLORES.textoClaro);
    });
  }
}

export default EscenaSeleccion;
