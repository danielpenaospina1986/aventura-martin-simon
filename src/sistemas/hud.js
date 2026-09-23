// ---------------------------------------------------------------------------
// HUD
// Carita del nino que esta jugando, su nombre y las monedas. Se dibuja fijo en
// pantalla (no se mueve con la camara). Preparado para varios jugadores:
// recibe un array y apila una fila por jugador.
// ---------------------------------------------------------------------------

import { MUNDO } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { aEscalaDeJuego } from './dibujo.js';

const FILA = { ancho: 196, alto: 32, margen: 8, separacion: 6 };

export class Hud {
  constructor(escena, jugadores, totalMonedas, nivel = null) {
    this.escena = escena;
    this.jugadores = jugadores;
    this.totalMonedas = totalMonedas;
    this.filas = [];
    // todo lo que se dibuja aqui queda clavado en pantalla; de eso se ocupa el
    // repartidor de planos, que lo mueve con la camara
    this.piezas = [];

    jugadores.forEach((jugador, i) => {
      const y = FILA.margen + i * (FILA.alto + FILA.separacion);
      const centroY = y + FILA.alto / 2;

      const panel = escena.add
        .rectangle(FILA.margen, y, FILA.ancho, FILA.alto, COLORES.panel, 0.62)
        .setOrigin(0, 0)
        .setDepth(100)
        .setStrokeStyle(2, COLORES.panelBorde, 0.9);

      // carita del nino, sobre un disco claro para que se recorte bien
      const disco = escena.add
        .circle(FILA.margen + 17, centroY, 12, 0xfdf3e0, 1)
        .setDepth(101)
        .setStrokeStyle(1.5, 0xffffff, 0.9);

      const cara = escena.add
        .image(FILA.margen + 17, centroY, jugador.datos.cara)
        .setDisplaySize(24, 24)
        .setDepth(102);

      const nombre = escena.add
        .text(FILA.margen + 34, centroY, jugador.datos.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: `${FUENTE.hud}px`,
          color: COLORES.textoClaro,
        })
        .setOrigin(0, 0.5)
        .setDepth(101);

      const icono = aEscalaDeJuego(
        escena.add.image(FILA.margen + 124, centroY, jugador.datos.moneda).setDepth(101),
      );

      const contador = escena.add
        .text(FILA.margen + 140, centroY, '0', {
          fontFamily: FUENTE.familia,
          fontSize: `${FUENTE.hud}px`,
          color: COLORES.textoAcento,
        })
        .setOrigin(0, 0.5)
        .setDepth(101);

      // setDisplaySize deja su propia escala: hay que recordarla para poder
      // animar la carita sin deformarla.
      this.piezas.push(panel, disco, cara, nombre, icono, contador);
      this.filas.push({
        panel, disco, cara, nombre, icono, contador,
        escalaCara: cara.scaleX,
        escalaIcono: icono.scaleX,
      });
    });

    if (nivel) {
      this.piezas.push(
        escena.add
        .text(MUNDO.ancho - 10, 10, `Nivel ${nivel.numero} de ${nivel.total}`, {
          fontFamily: FUENTE.familia,
          fontSize: '14px',
          color: COLORES.textoAcento,
          stroke: '#1b1410',
          strokeThickness: 5,
        })
        .setOrigin(1, 0)
        .setDepth(101),
      );

      this.piezas.push(
        escena.add
        .text(MUNDO.ancho - 10, 27, nivel.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: '12px',
          color: COLORES.textoClaro,
          stroke: '#1b1410',
          strokeThickness: 4,
        })
        .setOrigin(1, 0)
        .setDepth(101),
      );
    }

    this.ayuda = escena.add
      .text(
        MUNDO.ancho - 12,
        MUNDO.alto - 6,
        'Esc  pausa      H  cajas de colisión',
        {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoSuave,
        },
      )
      .setOrigin(1, 1)
      .setDepth(100)
      .setAlpha(0.75);
    this.piezas.push(this.ayuda);
  }

  actualizar() {
    this.jugadores.forEach((jugador, i) => {
      const fila = this.filas[i];
      if (!fila) return;
      const texto = String(jugador.monedas);
      if (fila.contador.text !== texto) {
        fila.contador.setText(texto);
        this.escena.tweens.add({
          targets: fila.icono,
          scale: { from: fila.escalaIcono * 1.5, to: fila.escalaIcono },
          duration: 200,
          ease: 'Back.easeOut',
        });
      }
    });
  }

  // Un guino cuando al nino le pasa algo: la carita da un brinco.
  animarCara(jugador) {
    const indice = this.jugadores.indexOf(jugador);
    const fila = this.filas[indice];
    if (!fila) return;
    this.escena.tweens.add({
      targets: fila.cara,
      scaleX: { from: fila.escalaCara * 1.25, to: fila.escalaCara },
      scaleY: { from: fila.escalaCara * 1.25, to: fila.escalaCara },
      duration: 240,
      ease: 'Back.easeOut',
    });
    this.escena.tweens.add({
      targets: fila.disco,
      scaleX: { from: 1.2, to: 1 },
      scaleY: { from: 1.2, to: 1 },
      duration: 240,
      ease: 'Back.easeOut',
    });
  }
}

export default Hud;
