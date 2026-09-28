// ---------------------------------------------------------------------------
// ELEGIR MUNDO
//
// Despues de elegir personaje se elige A DONDE ir. Los cinco mundos estan
// abiertos desde el principio: la gracia no es desbloquearlos, es poder volver
// al que mas guste y seguir sumando puntos.
//
// Cada tarjeta es la ILUSTRACION DE FONDO de esa ciudad, recortada con una
// mascara: es lo que hace que se reconozca de un vistazo sin tener que leer.
// Debajo va lo que paga su jefe, que es lo que invita a meterse en los
// dificiles: el de Space Coast da 100 y cada mundo suma 20 mas.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER, premioDeJefe } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { NIVELES } from '../niveles/index.js';
import { pintarFondoDeMenu } from '../sistemas/dibujo.js';
import { jefeDelCuento } from '../config/historia.js';
import { empezarPartida } from '../sistemas/cuento.js';
import { nuevaPartida } from '../sistemas/puntajes.js';
import { segunElMando } from '../sistemas/tactil.js';

// Las tarjetas van en REJILLA, no en fila: con cinco cabian de una tirada, pero
// con ocho no, y encogerlas hasta que quepan las deja ilegibles y sin sitio
// donde poner el dedo.
const TARJETA = {
  ancho: 104,
  alto: 68,
  separacionX: 14,
  separacionY: 38,
  porFila: 4,
  primeraY: 146,
};

export class EscenaMundos extends Phaser.Scene {
  constructor() {
    super('mundos');
  }

  init(datos) {
    const d = datos || {};
    this.personajeId = d.personajeId || 'martin';
    // Lo que se arrastra si se viene de una partida en marcha (desde la
    // pantalla de victoria). Si no viene nada, es una partida nueva.
    this.partida = d.partida || null;
    this.indice = d.indiceNivel || 0;
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de siempre.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;
    pintarFondoDeMenu(this, ancho, alto);

    this.add
      .text(ancho / 2, 38, '¿A dónde quieren ir?', {
        fontFamily: FUENTE.familia,
        fontSize: '27px',
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 6,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(ancho / 2, 66, `Los ${NIVELES.length} están abiertos: el marcador se va sumando`, {
        fontFamily: FUENTE.familia,
        fontSize: '12px',
        color: COLORES.textoSuave,
        stroke: '#16202c',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.montarTarjetas(ancho);

    this.add
      .text(
        ancho / 2,
        alto - 16,
        segunElMando(
          'Flechas  elegir        Enter o clic  empezar        Esc  volver',
          'Toca el mundo al que quieras ir',
        ),
        {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoSuave,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.escucharTeclado();
    this.resaltar(this.indice);
  }

  montarTarjetas(ancho) {
    const pasoX = TARJETA.ancho + TARJETA.separacionX;
    const pasoY = TARJETA.alto + TARJETA.separacionY;
    const porFila = TARJETA.porFila;
    const enLaFila = Math.min(NIVELES.length, porFila);
    const inicio = ancho / 2 - ((enLaFila - 1) * pasoX) / 2;

    this.tarjetas = NIVELES.map((nivel, i) => {
      const x = inicio + (i % porFila) * pasoX;
      const y = TARJETA.primeraY + Math.floor(i / porFila) * pasoY;
      const jefe = jefeDelCuento(nivel.fondo || '');

      // La ilustracion de la ciudad, recortada al trozo de en medio que tiene
      // la forma de la tarjeta y escalada para llenarla. Los mundos que no
      // tienen ilustracion propia todavia van con la obra.
      //
      // Se hace con setCrop y NO con una mascara: en Phaser 4, `setMask` no
      // funciona con WebGL (avisa por consola y dibuja la lamina entera, que se
      // sale por toda la pantalla).
      const suya = TEXTURAS.fondoDe(nivel.fondo || '');
      const textura = this.textures.exists(suya) ? suya : TEXTURAS.fondoEnObra;
      const enObra = textura !== suya;
      let lamina = null;
      if (this.textures.exists(textura)) {
        const fuente = this.textures.get(textura).getSourceImage();
        const forma = TARJETA.ancho / TARJETA.alto;
        let anchoCorte = fuente.width;
        let altoCorte = Math.round(anchoCorte / forma);
        if (altoCorte > fuente.height) {
          altoCorte = fuente.height;
          anchoCorte = Math.round(altoCorte * forma);
        }
        lamina = this.add.image(x, y, textura).setScale(TARJETA.ancho / anchoCorte);
        lamina.setCrop(
          Math.round((fuente.width - anchoCorte) / 2),
          Math.round((fuente.height - altoCorte) / 2),
          anchoCorte,
          altoCorte,
        );
      }

      const marco = this.add
        .rectangle(x, y, TARJETA.ancho, TARJETA.alto)
        .setStrokeStyle(3, COLORES.panelBorde, 0.9)
        .setInteractive({ useHandCursor: true });

      // el nombre, sobre una cinta oscura para que se lea encima del dibujo
      const cinta = this.add.rectangle(
        x,
        y + TARJETA.alto / 2 - 10,
        TARJETA.ancho - 6,
        18,
        COLORES.decoFondo,
        0.74,
      );
      const nombre = this.add
        .text(x, y + TARJETA.alto / 2 - 10, nivel.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color: COLORES.textoClaro,
        })
        .setOrigin(0.5);

      // Lo que paga su jefe, en una chapita arriba: es lo que invita a meterse
      // en los dificiles, asi que tiene que verse sin leer nada mas.
      const chapa = this.add
        .rectangle(x + TARJETA.ancho / 2 - 22, y - TARJETA.alto / 2 + 9, 42, 16, COLORES.decoFondo, 0.8)
        .setStrokeStyle(1, COLORES.decoMarco, 0.9);
      const pago = this.add
        .text(x + TARJETA.ancho / 2 - 22, y - TARJETA.alto / 2 + 9, `+${premioDeJefe(i)}`, {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoAcento,
        })
        .setOrigin(0.5);

      // y debajo, de quien es la arena
      const premio = this.add
        .text(x, y + TARJETA.alto / 2 + 6, enObra ? `${jefe ? jefe.nombre : 'Jefe'}  ·  en obra` : (jefe ? jefe.nombre : 'Jefe'), {
          fontFamily: FUENTE.familia,
          fontSize: '10px',
          color: COLORES.textoSuave,
          align: 'center',
          wordWrap: { width: TARJETA.ancho + 10 },
        })
        .setOrigin(0.5, 0);

      marco.on('pointerover', () => this.resaltar(i));
      marco.on('pointerdown', () => {
        this.resaltar(i);
        this.empezar();
      });

      return { lamina, marco, cinta, nombre, chapa, premio, pago };
    });
  }

  resaltar(nuevo) {
    const total = NIVELES.length;
    this.indice = ((nuevo % total) + total) % total;
    this.tarjetas.forEach((tarjeta, i) => {
      const elegida = i === this.indice;
      tarjeta.marco.setStrokeStyle(elegida ? 4 : 2, elegida ? 0xffd54a : COLORES.panelBorde, 0.95);
      tarjeta.marco.setScale(elegida ? 1.06 : 1);
      if (tarjeta.lamina) tarjeta.lamina.setAlpha(elegida ? 1 : 0.62);
      tarjeta.nombre.setColor(elegida ? COLORES.textoAcento : COLORES.textoClaro);
      tarjeta.pago.setAlpha(elegida ? 1 : 0.6);
      tarjeta.chapa.setAlpha(elegida ? 0.8 : 0.5);
      tarjeta.premio.setAlpha(elegida ? 1 : 0.6);
    });
  }

  escucharTeclado() {
    const teclado = this.input.keyboard;
    this.manejadores = [
      ['keydown-LEFT', () => this.resaltar(this.indice - 1)],
      ['keydown-A', () => this.resaltar(this.indice - 1)],
      ['keydown-RIGHT', () => this.resaltar(this.indice + 1)],
      ['keydown-D', () => this.resaltar(this.indice + 1)],
      // con dos filas, arriba y abajo saltan de una a otra
      ['keydown-UP', () => this.resaltar(this.indice - TARJETA.porFila)],
      ['keydown-W', () => this.resaltar(this.indice - TARJETA.porFila)],
      ['keydown-DOWN', () => this.resaltar(this.indice + TARJETA.porFila)],
      ['keydown-S', () => this.resaltar(this.indice + TARJETA.porFila)],
      ['keydown-ENTER', () => this.empezar()],
      ['keydown-SPACE', () => this.empezar()],
      ['keydown-ESC', () => this.scene.start('seleccion')],
    ];
    this.manejadores.forEach(([evento, fn]) => teclado.on(evento, fn));
    this.events.once('shutdown', () => {
      this.manejadores.forEach(([evento, fn]) => teclado.off(evento, fn));
    });
  }

  empezar() {
    if (this.yendo) return;
    this.yendo = true;
    empezarPartida(this, {
      ...(this.partida || {}),
      personajeId: this.personajeId,
      indiceNivel: this.indice,
      // Si se viene de una partida en marcha se conserva su identificador, para
      // que siga ocupando la misma fila del tablero; si no, empieza una nueva.
      partidaId: (this.partida && this.partida.partidaId) || nuevaPartida(),
    });
  }
}

export default EscenaMundos;
