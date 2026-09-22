// ---------------------------------------------------------------------------
// VICTORIA
// Sin castigos: se celebra y se cuenta como ha quedado el marcador.
//
// El marcador se explica desglosado a proposito, para que los ninos entiendan
// de donde sale cada punto: lo que recogieron, lo que costaron los golpes y lo
// que dio el jefe.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { PUNTOS } from '../config/ajustes.js';
import { TOTAL_NIVELES } from '../niveles/index.js';
import { COLORES, FONDO, FUENTE } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { pintarFondo, panelDeco } from '../sistemas/dibujo.js';
import { estrellitas } from '../sistemas/efectos.js';
import { Menu } from '../sistemas/menu.js';

export class EscenaVictoria extends Phaser.Scene {
  constructor() {
    super('victoria');
  }

  init(datos) {
    const d = datos || {};
    this.personajeId = d.personajeId || 'martin';
    this.monedas = d.monedas || 0;
    this.total = d.total || 0;
    this.recogidas = d.recogidas || 0;
    this.golpes = d.golpes || 0;
    this.jefesDerrotados = d.jefesDerrotados || 0;
    this.indiceNivel = d.indiceNivel || 0;
    this.nombreNivel = d.nombreNivel || '';
    this.hayOtroNivel = this.indiceNivel + 1 < TOTAL_NIVELES;
  }

  create() {
    const { width: ancho, height: alto } = this.scale;
    const datos = PERSONAJES[this.personajeId];
    pintarFondo(this, ancho, alto, { veloExtra: FONDO.veloMenus });

    this.add
      .text(ancho / 2, 58, this.hayOtroNivel ? '¡Nivel superado!' : '¡Lo lograste!', {
        fontFamily: FUENTE.familia,
        fontSize: '54px',
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    const subtitulo = this.hayOtroNivel
      ? `${datos.nombre} se ha pasado "${this.nombreNivel}"`
      : `${datos.nombre} se ha pasado los ${TOTAL_NIVELES} niveles`;

    this.add
      .text(ancho / 2, 104, subtitulo, {
        fontFamily: FUENTE.familia,
        fontSize: '22px',
        color: COLORES.textoClaro,
        stroke: '#1b1410',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // el personaje dando saltos de alegria, con su carita
    const figura = this.add.image(150, 300, datos.cara).setDisplaySize(150, 150);
    this.tweens.add({
      targets: figura,
      y: figura.y - 18,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });
    this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => estrellitas(this, 150, 270, 7),
    });

    this.pintarMarcador(ancho / 2 + 90, 300);

    // Lo que se arrastra al siguiente nivel: la partida es de los cinco.
    const partida = {
      personajeId: this.personajeId,
      monedas: this.monedas,
      recogidas: this.recogidas,
      golpes: this.golpes,
      jefesDerrotados: this.jefesDerrotados,
    };

    const opciones = [];
    if (this.hayOtroNivel) {
      opciones.push({
        etiqueta: `Siguiente nivel  (${this.indiceNivel + 2} de ${TOTAL_NIVELES})`,
        alElegir: () => this.scene.start('nivel', { ...partida, indiceNivel: this.indiceNivel + 1 }),
      });
    }
    opciones.push({
      etiqueta: this.hayOtroNivel ? 'Repetir este nivel' : 'Jugar otra vez',
      alElegir: () =>
        this.scene.start('nivel', {
          personajeId: this.personajeId,
          indiceNivel: this.hayOtroNivel ? this.indiceNivel : 0,
        }),
    });
    opciones.push({ etiqueta: 'Cambiar personaje', alElegir: () => this.scene.start('seleccion') });

    new Menu(this, opciones, {
      x: ancho / 2,
      y: this.hayOtroNivel ? 434 : 448,
      separacion: 40,
      tamano: 24,
    });
  }

  // --- el desglose del marcador ---------------------------------------------

  pintarMarcador(cx, cy) {
    const datos = PERSONAJES[this.personajeId];
    const anchoPanel = 470;
    panelDeco(this, cx, cy, anchoPanel, 272);

    const izquierda = cx - anchoPanel / 2 + 34;
    const derecha = cx + anchoPanel / 2 - 34;

    const linea = (y, texto, valor, color = COLORES.textoSuave) => {
      this.add
        .text(izquierda, y, texto, {
          fontFamily: FUENTE.familia,
          fontSize: '20px',
          color,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(derecha, y, valor, {
          fontFamily: FUENTE.familia,
          fontSize: '20px',
          color,
        })
        .setOrigin(1, 0.5);
    };

    this.add
      .text(cx, cy - 92, 'Marcador', {
        fontFamily: FUENTE.familia,
        fontSize: '26px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);

    const perdido = this.golpes * Math.abs(PUNTOS.porGolpe);
    const bonus = this.jefesDerrotados * PUNTOS.porJefe;

    linea(cy - 48, `${datos.nombreMoneda} recogidos`, `+${this.recogidas}`, COLORES.textoClaro);
    linea(
      cy - 16,
      this.golpes === 1 ? '1 golpe o caída' : `${this.golpes} golpes o caídas`,
      perdido ? `-${perdido}` : '0',
      this.golpes ? '#ff8f8f' : COLORES.textoSuave,
    );
    linea(cy + 16, this.jefesDerrotados ? 'Jefe derrotado' : 'Sin jefe', `+${bonus}`, COLORES.textoClaro);

    // raya de separacion
    const raya = this.add.graphics();
    raya.lineStyle(2, COLORES.decoMarcoOscuro, 0.9);
    raya.beginPath();
    raya.moveTo(izquierda, cy + 42);
    raya.lineTo(derecha, cy + 42);
    raya.strokePath();

    this.add
      .text(izquierda, cy + 74, 'Total', {
        fontFamily: FUENTE.familia,
        fontSize: '30px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0, 0.5);

    this.add
      .image(derecha - 82, cy + 74, datos.moneda)
      .setScale(1.5);

    this.add
      .text(derecha, cy + 74, String(this.monedas), {
        fontFamily: FUENTE.familia,
        fontSize: '38px',
        color: COLORES.textoAcento,
      })
      .setOrigin(1, 0.5);

    this.add
      .text(cx, cy + 112, this.mensaje(), {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoSuave,
        align: 'center',
      })
      .setOrigin(0.5);
  }

  mensaje() {
    if (!this.hayOtroNivel) return '¡Te has pasado el juego entero!';
    if (this.golpes === 0) return '¡Sin un solo golpe! Eso tiene mucho mérito.';
    if (this.recogidas >= this.total) return '¡No se te ha escapado ni uno!';
    const otro = this.personajeId === 'martin' ? PERSONAJES.simon : PERSONAJES.martin;
    return `Quedan ${this.total - this.recogidas} por ahí. Prueba con ${otro.nombre}.`;
  }
}

export default EscenaVictoria;
