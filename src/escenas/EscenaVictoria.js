// ---------------------------------------------------------------------------
// VICTORIA
// Sin castigos: se celebra y se cuenta como ha quedado el marcador.
//
// El marcador se explica desglosado a proposito, para que los ninos entiendan
// de donde sale cada punto: lo que recogieron, lo que costaron los golpes y lo
// que dio el jefe.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, PREMIO, PUNTOS, RENDER } from '../config/ajustes.js';
import { TOTAL_NIVELES } from '../niveles/index.js';
import { COLORES, FUENTE } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { aEscalaDeJuego, pintarFondoDeMenu, panelDeco } from '../sistemas/dibujo.js';
import { estrellitas } from '../sistemas/efectos.js';
import { Menu } from '../sistemas/menu.js';
import { empezarNivel } from '../sistemas/cuento.js';
import { anotarPuntaje } from '../sistemas/puntajes.js';
import { nombreDeSesion } from '../sistemas/sesion.js';

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
    this.enemigosVencidos = d.enemigosVencidos || 0;
    this.indiceNivel = d.indiceNivel || 0;
    this.nombreNivel = d.nombreNivel || '';
    this.hayOtroNivel = this.indiceNivel + 1 < TOTAL_NIVELES;
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de 640 x 360 de siempre.
    // Hay que recentrarla: con zoom, una camara sin tocar mira el centro de su
    // propio tamano en pixeles, que ya no es el centro del juego.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;
    const datos = PERSONAJES[this.personajeId];
    // los menus van sobre la portada, ya desenfocada de antemano
    pintarFondoDeMenu(this, ancho, alto);

    this.add
      .text(ancho / 2, 38, this.hayOtroNivel ? '¡Nivel superado!' : '¡Lo lograste!', {
        fontFamily: FUENTE.familia,
        fontSize: '34px',
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const subtitulo = this.hayOtroNivel
      ? `${datos.nombre} se ha pasado "${this.nombreNivel}"`
      : `${datos.nombre} se ha pasado los ${TOTAL_NIVELES} niveles`;

    this.add
      .text(ancho / 2, 68, subtitulo, {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoClaro,
        stroke: '#1b1410',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // el personaje dando saltos de alegria, con su carita
    // si el personaje tiene pose de celebracion, se usa esa; si no, su carita
    const celebra = datos.poses && datos.poses.victoria;
    const figura = this.add
      .image(100, 205, celebra || datos.cara)
      .setDisplaySize(celebra ? 130 : 100, celebra ? 130 : 100);
    this.tweens.add({
      targets: figura,
      y: figura.y - 12,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });
    this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => estrellitas(this, 100, 180, 7),
    });

    this.pintarMarcador(ancho / 2 + 62, 198);

    // Pasarse los cinco tableros TAMBIEN cuenta para el tablero de mejores.
    // Antes solo se apuntaba la partida de quien se quedaba sin vidas, asi que
    // quien se lo terminaba entero —el que mas puntos hacia— no salia nunca.
    if (!this.hayOtroNivel) {
      anotarPuntaje(nombreDeSesion(), this.monedas, {
        personaje: datos.nombre,
        nivel: TOTAL_NIVELES,
      });
      this.add
        .text(ancho / 2, 276, 'Tu puntaje quedó en el tablero de mejores', {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color: COLORES.textoAcento,
          stroke: '#1b1410',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
    }

    // Lo que se arrastra al siguiente nivel: la partida es de los cinco.
    const partida = {
      personajeId: this.personajeId,
      monedas: this.monedas,
      recogidas: this.recogidas,
      golpes: this.golpes,
      jefesDerrotados: this.jefesDerrotados,
      enemigosVencidos: this.enemigosVencidos,
    };

    const opciones = [];
    if (this.hayOtroNivel) {
      opciones.push({
        etiqueta: `Siguiente nivel  (${this.indiceNivel + 2} de ${TOTAL_NIVELES})`,
        alElegir: () => empezarNivel(this, { ...partida, indiceNivel: this.indiceNivel + 1 }),
      });
    }
    opciones.push({
      etiqueta: this.hayOtroNivel ? 'Repetir este nivel' : 'Jugar otra vez',
      alElegir: () =>
        empezarNivel(this, {
          personajeId: this.personajeId,
          indiceNivel: this.hayOtroNivel ? this.indiceNivel : 0,
        }),
    });
    opciones.push({ etiqueta: 'Cambiar personaje', alElegir: () => this.scene.start('seleccion') });

    new Menu(this, opciones, {
      x: ancho / 2,
      y: this.hayOtroNivel ? 296 : 302,
      separacion: 27,
      tamano: 16,
    });
  }

  // --- el desglose del marcador ---------------------------------------------

  pintarMarcador(cx, cy) {
    const datos = PERSONAJES[this.personajeId];
    const anchoPanel = 320;
    panelDeco(this, cx, cy, anchoPanel, 204, { escalon: 10 });

    const izquierda = cx - anchoPanel / 2 + 22;
    const derecha = cx + anchoPanel / 2 - 22;

    const linea = (y, texto, valor, color = COLORES.textoSuave) => {
      this.add
        .text(izquierda, y, texto, {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(derecha, y, valor, {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color,
        })
        .setOrigin(1, 0.5);
    };

    this.add
      .text(cx, cy - 72, 'Marcador', {
        fontFamily: FUENTE.familia,
        fontSize: '17px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);

    const perdido = this.golpes * Math.abs(PUNTOS.porGolpe);
    const bonus = this.jefesDerrotados * PUNTOS.porJefe;

    linea(cy - 42, `${datos.nombreMoneda} recogidos`, `+${this.recogidas}`, COLORES.textoClaro);
    linea(
      cy - 21,
      this.golpes === 1 ? '1 golpe o caída' : `${this.golpes} golpes o caídas`,
      perdido ? `-${perdido}` : '0',
      this.golpes ? '#ff8f8f' : COLORES.textoSuave,
    );
    linea(
      cy + 1,
      this.enemigosVencidos === 1 ? '1 bicho vencido' : `${this.enemigosVencidos} bichos vencidos`,
      `+${this.enemigosVencidos * PUNTOS.porEnemigo}`,
      COLORES.textoClaro,
    );
    linea(cy + 23, this.jefesDerrotados ? 'Jefes derrotados' : 'Sin jefe', `+${bonus}`, COLORES.textoClaro);

    // raya de separacion
    const raya = this.add.graphics();
    raya.lineStyle(2, COLORES.decoMarcoOscuro, 0.9);
    raya.beginPath();
    raya.moveTo(izquierda, cy + 42);
    raya.lineTo(derecha, cy + 42);
    raya.strokePath();

    this.add
      .text(izquierda, cy + 64, 'Total', {
        fontFamily: FUENTE.familia,
        fontSize: '20px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0, 0.5);

    this.add
      .image(derecha - 54, cy + 64, datos.moneda)
      .setDisplaySize(PREMIO.ancho, PREMIO.alto);

    this.add
      .text(derecha, cy + 64, String(this.monedas), {
        fontFamily: FUENTE.familia,
        fontSize: '25px',
        color: COLORES.textoAcento,
      })
      .setOrigin(1, 0.5);

    this.add
      .text(cx, cy + 88, this.mensaje(), {
        fontFamily: FUENTE.familia,
        fontSize: '10px',
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
