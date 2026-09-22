// ---------------------------------------------------------------------------
// HUD
// Carita del nino que esta jugando, su nombre y las monedas. Se dibuja fijo en
// pantalla (no se mueve con la camara). Preparado para varios jugadores:
// recibe un array y apila una fila por jugador.
// ---------------------------------------------------------------------------

import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';

const FILA = { ancho: 286, alto: 44, margen: 12, separacion: 8 };

export class Hud {
  constructor(escena, jugadores, totalMonedas) {
    this.escena = escena;
    this.jugadores = jugadores;
    this.totalMonedas = totalMonedas;
    this.filas = [];

    jugadores.forEach((jugador, i) => {
      const y = FILA.margen + i * (FILA.alto + FILA.separacion);
      const centroY = y + FILA.alto / 2;

      const panel = escena.add
        .rectangle(FILA.margen, y, FILA.ancho, FILA.alto, COLORES.panel, 0.62)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(100)
        .setStrokeStyle(2, COLORES.panelBorde, 0.9);

      // carita del nino, sobre un disco claro para que se recorte bien
      const disco = escena.add
        .circle(FILA.margen + 24, centroY, 17, 0xfdf3e0, 1)
        .setScrollFactor(0)
        .setDepth(101)
        .setStrokeStyle(2, 0xffffff, 0.9);

      const cara = escena.add
        .image(FILA.margen + 24, centroY, jugador.datos.cara)
        .setDisplaySize(34, 34)
        .setScrollFactor(0)
        .setDepth(102);

      const nombre = escena.add
        .text(FILA.margen + 50, centroY, jugador.datos.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: `${FUENTE.hud}px`,
          color: COLORES.textoClaro,
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101);

      const icono = escena.add
        .image(FILA.margen + 176, centroY, jugador.datos.moneda)
        .setScrollFactor(0)
        .setDepth(101);

      const contador = escena.add
        .text(FILA.margen + 196, centroY, '0', {
          fontFamily: FUENTE.familia,
          fontSize: `${FUENTE.hud}px`,
          color: COLORES.textoAcento,
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101);

      // setDisplaySize deja su propia escala: hay que recordarla para poder
      // animar la carita sin deformarla.
      this.filas.push({ panel, disco, cara, nombre, icono, contador, escalaCara: cara.scaleX });
    });

    this.ayuda = escena.add
      .text(
        escena.scale.width - 12,
        escena.scale.height - 10,
        'Esc  pausa      H  cajas de colisión',
        {
          fontFamily: FUENTE.familia,
          fontSize: '14px',
          color: COLORES.textoSuave,
        },
      )
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.75);
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
          scale: { from: 1.5, to: 1 },
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
