// ---------------------------------------------------------------------------
// FIN DE LA PARTIDA
//
// Se llega aqui cuando se acaban las tres vidas. No es un castigo ni un regano:
// se cuenta hasta donde llego, se le apunta en el tablero de mejores y se le
// ofrece volver a intentarlo. La idea del juego sigue siendo la de siempre,
// que apetezca jugar otra vez.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { pintarFondoDeMenu, panelDeco } from '../sistemas/dibujo.js';
import { Menu } from '../sistemas/menu.js';
import { empezarNivel } from '../sistemas/cuento.js';
import { anotarPuntaje, mejoresPuntajes } from '../sistemas/puntajes.js';
import { nombreDeSesion } from '../sistemas/sesion.js';
import { AVISOS } from '../config/historia.js';

export class EscenaFinal extends Phaser.Scene {
  constructor() {
    super('final');
  }

  init(datos) {
    const d = datos || {};
    this.personajeId = d.personajeId || 'martin';
    this.monedas = d.monedas || 0;
    this.recogidas = d.recogidas || 0;
    this.golpes = d.golpes || 0;
    this.jefesDerrotados = d.jefesDerrotados || 0;
    this.enemigosVencidos = d.enemigosVencidos || 0;
    this.indiceNivel = d.indiceNivel || 0;
    this.nombreNivel = d.nombreNivel || '';
  }

  create() {
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;

    pintarFondoDeMenu(this, ancho, alto, { velo: 0.52 });

    const datos = PERSONAJES[this.personajeId] || PERSONAJES.martin;
    const jugador = nombreDeSesion();

    // El puntaje se apunta al llegar aqui, no antes: es el de la partida.
    this.tabla = anotarPuntaje(jugador, this.monedas, {
      personaje: datos.nombre,
      nivel: this.indiceNivel + 1,
    });

    this.add
      .text(ancho / 2, 40, AVISOS.finDePartida, {
        fontFamily: FUENTE.familia,
        fontSize: '30px',
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(
        ancho / 2,
        68,
        `${AVISOS.finDePartidaPie}
${datos.nombre} llegó hasta ${this.nombreNivel} con ${this.monedas} puntos`,
        {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color: COLORES.textoClaro,
          stroke: '#1b1410',
          strokeThickness: 4,
          align: 'center',
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    this.pintarTabla(ancho / 2, 200);

    const menu = new Menu(this, [
      {
        etiqueta: 'Jugar otra vez',
        alElegir: () => empezarNivel(this, { personajeId: this.personajeId }),
      },
      { etiqueta: 'Cambiar personaje', alElegir: () => this.scene.start('seleccion') },
    ], { y: 318, separacion: 26 });
    this.menu = menu;
  }

  // El tablero de mejores: solo caben diez, y el que hace el ultimo puntaje se
  // queda resaltado para que se vea donde entro.
  pintarTabla(cx, cy) {
    const filas = mejoresPuntajes();
    const alto = 46 + Math.max(1, filas.length) * 17;
    panelDeco(this, cx, cy, 300, alto, { alpha: 0.82 });

    const arriba = cy - alto / 2;
    this.add
      .text(cx, arriba + 16, 'Mejores puntajes', {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);

    if (!filas.length) {
      this.add
        .text(cx, arriba + 40, 'Todavía no hay ninguno', {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color: COLORES.textoSuave,
        })
        .setOrigin(0.5);
      return;
    }

    const jugador = nombreDeSesion();
    filas.forEach((fila, i) => {
      const y = arriba + 36 + i * 17;
      const suyo = fila.nombre === jugador && fila.puntos === this.monedas;
      const color = suyo ? COLORES.textoAcento : COLORES.textoClaro;

      this.add
        .text(cx - 128, y, `${i + 1}.`, {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color: COLORES.textoSuave,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(cx - 106, y, fila.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(cx + 66, y, fila.personaje || '', {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoSuave,
        })
        .setOrigin(1, 0.5);
      this.add
        .text(cx + 128, y, String(fila.puntos), {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color,
        })
        .setOrigin(1, 0.5);
    });
  }
}

export default EscenaFinal;
