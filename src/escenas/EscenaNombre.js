// ---------------------------------------------------------------------------
// QUIEN JUEGA
//
// Se escribe el nombre al entrar, y ese nombre es el identificador de la
// sesion: lo que se apunta luego en el tablero de mejores puntajes.
//
// Se teclea de verdad, letra a letra, en vez de usar un cuadro del navegador:
// asi no se sale del juego ni aparece un teclado con otra tipografia.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER } from '../config/ajustes.js';
import { COLORES, FUENTE } from '../config/estilo.js';
import { pintarFondoDeMenu, panelDeco } from '../sistemas/dibujo.js';
import { hayTactil } from '../sistemas/tactil.js';
import { LARGO_MAXIMO, guardarNombre, limpiarNombre, nombreDeSesion } from '../sistemas/sesion.js';
import { mejoresPuntajes } from '../sistemas/puntajes.js';

export class EscenaNombre extends Phaser.Scene {
  constructor() {
    super('nombre');
  }

  create() {
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;

    pintarFondoDeMenu(this, ancho, alto, { velo: 0.5 });

    this.nombre = nombreDeSesion();

    this.add
      .text(ancho / 2, 52, '¿Quién juega?', {
        fontFamily: FUENTE.familia,
        fontSize: '30px',
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // En un telefono no hay teclado, asi que se pinta uno aqui mismo. Y si se
    // pinta, no cabe el tablero de los mejores: se deja para el titulo.
    this.conTeclado = hayTactil();

    const pista = this.conTeclado
      ? `Toca las letras (hasta ${LARGO_MAXIMO}) y luego LISTO`
      : `Escribe tu nombre (hasta ${LARGO_MAXIMO} letras) y pulsa Enter`;

    this.add
      .text(ancho / 2, 80, pista, {
        fontFamily: FUENTE.familia,
        fontSize: '12px',
        color: COLORES.textoClaro,
        stroke: '#1b1410',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // el hueco donde se escribe
    panelDeco(this, ancho / 2, 128, 300, 48, { alpha: 0.78 });
    this.escrito = this.add
      .text(ancho / 2, 128, '', {
        fontFamily: FUENTE.familia,
        fontSize: '24px',
        color: COLORES.textoClaro,
      })
      .setOrigin(0.5);

    this.cursor = this.add
      .text(ancho / 2, 128, '_', {
        fontFamily: FUENTE.familia,
        fontSize: '24px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0, 0.5);
    this.tweens.add({
      targets: this.cursor,
      alpha: { from: 1, to: 0 },
      duration: 480,
      yoyo: true,
      repeat: -1,
    });

    this.aviso = this.add
      .text(ancho / 2, 162, '', {
        fontFamily: FUENTE.familia,
        fontSize: '11px',
        color: COLORES.textoSuave,
      })
      .setOrigin(0.5);

    if (this.conTeclado) this.pintarTecladoEnPantalla(ancho / 2, 186);
    else this.pintarTabla(ancho / 2, 250);
    this.pintar();
    this.escucharTeclado();
  }

  // --- el teclado de la pantalla --------------------------------------------
  //
  // Las mismas letras que acepta `limpiarNombre`, con la ene incluida, que este
  // juego esta en espanol. Cada tecla es un rectangulo con su letra encima; se
  // tocan, no se escriben.
  pintarTecladoEnPantalla(cx, arriba) {
    const filas = ['ABCDEFGHIJ', 'KLMNÑOPQRS', 'TUVWXYZ'];
    const paso = 52;
    const anchoTecla = 44;
    const altoTecla = 32;
    const separacion = 38;

    filas.forEach((fila, f) => {
      const letras = fila.split('');
      const inicio = cx - ((letras.length - 1) * paso) / 2;
      letras.forEach((letra, i) => {
        this.tecla(inicio + i * paso, arriba + f * separacion, anchoTecla, altoTecla, letra, () =>
          this.escribir(letra),
        );
      });
    });

    // la fila de abajo: espacio, borrar y listo
    const abajo = arriba + filas.length * separacion + 6;
    this.tecla(cx - 180, abajo, 140, altoTecla, 'ESPACIO', () => this.escribir(' '));
    this.tecla(cx, abajo, 140, altoTecla, 'BORRAR', () => {
      this.nombre = this.nombre.slice(0, -1);
      this.pintar();
    });
    this.tecla(cx + 180, abajo, 140, altoTecla, 'LISTO', () => this.confirmar(), true);
  }

  tecla(x, y, ancho, alto, texto, alTocar, destacada = false) {
    const fondo = this.add
      .rectangle(x, y, ancho, alto, COLORES.decoFondo, 0.82)
      .setStrokeStyle(2, destacada ? COLORES.textoAcento : COLORES.decoMarco, 0.95)
      .setInteractive({ useHandCursor: true });

    const etiqueta = this.add
      .text(x, y, texto, {
        fontFamily: FUENTE.familia,
        fontSize: texto.length > 1 ? '13px' : '19px',
        color: destacada ? COLORES.textoAcento : COLORES.textoClaro,
      })
      .setOrigin(0.5);

    fondo.on('pointerdown', () => {
      fondo.setFillStyle(COLORES.decoMarco, 0.9);
      alTocar();
    });
    const apagar = () => fondo.setFillStyle(COLORES.decoFondo, 0.82);
    fondo.on('pointerup', apagar);
    fondo.on('pointerout', apagar);
    return { fondo, etiqueta };
  }

  escribir(letra) {
    const propuesto = limpiarNombre(this.nombre + letra);
    if (propuesto === this.nombre && this.nombre.length >= LARGO_MAXIMO) {
      this.aviso.setText(`Con ${LARGO_MAXIMO} letras basta`);
    }
    this.nombre = propuesto;
    this.pintar();
  }

  escucharTeclado() {
    const teclado = this.input.keyboard;

    // Se escuchan las teclas de verdad para poder aceptar tildes y enies, que
    // en este juego hacen falta.
    this.alTeclear = (evento) => {
      const tecla = evento.key;
      if (tecla === 'Enter') {
        this.confirmar();
        return;
      }
      if (tecla === 'Backspace') {
        this.nombre = this.nombre.slice(0, -1);
        this.pintar();
        return;
      }
      if (tecla === 'Escape') {
        this.scene.start('titulo');
        return;
      }
      if (tecla.length !== 1) return;

      const propuesto = limpiarNombre(this.nombre + tecla);
      if (propuesto === this.nombre && this.nombre.length >= LARGO_MAXIMO) {
        this.aviso.setText(`Con ${LARGO_MAXIMO} letras basta`);
      }
      this.nombre = propuesto;
      this.pintar();
    };

    teclado.on('keydown', this.alTeclear);
    this.events.once('shutdown', () => teclado.off('keydown', this.alTeclear));

    // Con el teclado en pantalla NO vale tocar en cualquier sitio para
    // confirmar: el primer toque en una letra se llevaria la pantalla por
    // delante. Ahi se confirma con LISTO.
    if (!this.conTeclado) this.input.once('pointerdown', () => this.confirmar());
  }

  pintar() {
    this.escrito.setText(this.nombre);
    // el cursor va justo detras de lo escrito
    this.cursor.setX(MUNDO.ancho / 2 + this.escrito.width / 2 / this.escrito.scaleX + 2);
    if (this.nombre.length < LARGO_MAXIMO) this.aviso.setText('');
  }

  confirmar() {
    const limpio = limpiarNombre(this.nombre).trim();
    if (!limpio) {
      this.aviso.setText('Escribe un nombre para empezar');
      return;
    }
    guardarNombre(limpio);
    this.scene.start('seleccion');
  }

  // Los mejores, para que se vea a quien hay que ganarle.
  pintarTabla(cx, cy) {
    const filas = mejoresPuntajes().slice(0, 5);
    if (!filas.length) return;

    const alto = 30 + filas.length * 16;
    panelDeco(this, cx, cy, 260, alto, { alpha: 0.72 });
    const arriba = cy - alto / 2;

    this.add
      .text(cx, arriba + 14, 'Los mejores', {
        fontFamily: FUENTE.familia,
        fontSize: '13px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);

    filas.forEach((fila, i) => {
      const y = arriba + 32 + i * 16;
      this.add
        .text(cx - 108, y, `${i + 1}.  ${fila.nombre}`, {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color: COLORES.textoClaro,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(cx + 108, y, String(fila.puntos), {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color: COLORES.textoAcento,
        })
        .setOrigin(1, 0.5);
    });
  }
}

export default EscenaNombre;
