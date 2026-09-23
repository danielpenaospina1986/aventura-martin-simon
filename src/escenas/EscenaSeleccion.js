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

    this.add.rectangle(0, alto - 34, ancho, 34, COLORES.tierra).setOrigin(0, 0);
    this.add.rectangle(0, alto - 34, ancho, 6, COLORES.hierba).setOrigin(0, 0);

    this.add
      .text(ancho / 2, 38, '¿Quién va a jugar?', {
        fontFamily: FUENTE.familia,
        fontSize: '27px',
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 6,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(ancho / 2, 66, 'Los dos corren y saltan igual: cambia la habilidad', {
        fontFamily: FUENTE.familia,
        fontSize: '12px',
        color: COLORES.textoSuave,
        stroke: '#16202c',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // --- tarjetas ---
    this.tarjetas = ORDEN_PERSONAJES.map((id, i) => {
      const datos = PERSONAJES[id];
      const x = ancho / 2 + (i - (ORDEN_PERSONAJES.length - 1) / 2) * 200;
      const y = 188;

      const marco = this.add
        .rectangle(x, y, 178, 212, COLORES.panel, 0.55)
        .setStrokeStyle(3, COLORES.panelBorde, 0.9);

      // La carita del nino, sobre un disco claro para que destaque
      const disco = this.add.circle(x, y - 52, 50, 0xfdf3e0, 0.95);
      disco.setStrokeStyle(3, 0xffffff, 0.9);

      const figura = this.add
        .image(x, y - 52, datos.cara)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(100, 100);

      // el munequito con el que se juega, pequeno, para que se asocien
      // Ojo con setScale aqui: las texturas de los personajes son lienzos
      // grandes (260 px) y escalarlas "un poco" los hacia gigantes. Se fija el
      // tamano en pixeles, que es lo que miden de verdad en el juego.
      const munequito = this.add
        .image(x + 66, y - 14, datos.textura)
        .setOrigin(0.5, 1)
        .setDisplaySize(datos.ancho * 0.72, datos.alto * 0.72);

      this.tweens.add({
        targets: [figura, disco],
        y: figura.y - 7,
        duration: 820,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 200,
      });

      const nombre = this.add
        .text(x, y + 16, datos.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: '21px',
          color: COLORES.textoClaro,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const habilidad = this.add
        .text(x, y + 40, datos.nombreHabilidad, {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color: COLORES.textoAcento,
        })
        .setOrigin(0.5);

      const descripcion = this.add
        .text(x, y + 72, datos.descripcion, {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoSuave,
          align: 'center',
          lineSpacing: 3,
        })
        .setOrigin(0.5);

      return { datos, marco, disco, figura, munequito, nombre, habilidad, descripcion };
    });

    // --- menu de eleccion ---
    this.menu = new Menu(
      this,
      ORDEN_PERSONAJES.map((id) => ({
        etiqueta: PERSONAJES[id].nombre,
        alElegir: () => this.scene.start('nivel', { personajeId: id }),
      })),
      { x: ancho / 2, y: 316, horizontal: true, separacion: 200, tamano: 18 },
    );
    this.menu.alCambiar = (indice) => this.resaltar(indice);
    this.resaltar(0);

    this.add
      .text(ancho / 2, 344, '← →  elegir        Enter o clic  empezar        Esc  volver', {
        fontFamily: FUENTE.familia,
        fontSize: '11px',
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
      tarjeta.marco.setStrokeStyle(elegida ? 3 : 2, elegida ? 0xffd54a : COLORES.panelBorde, 0.95);
      tarjeta.marco.setFillStyle(COLORES.panel, elegida ? 0.75 : 0.45);
      tarjeta.figura.setDisplaySize(elegida ? 108 : 95, elegida ? 108 : 95);
      tarjeta.disco.setRadius(elegida ? 54 : 47);
      tarjeta.disco.setStrokeStyle(3, elegida ? 0xffd54a : 0xffffff, 0.9);
      tarjeta.munequito.setAlpha(elegida ? 1 : 0.65);
      tarjeta.nombre.setColor(elegida ? COLORES.textoAcento : COLORES.textoClaro);
    });
  }
}

export default EscenaSeleccion;
