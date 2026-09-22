// ---------------------------------------------------------------------------
// HUD
// Monedas y nombre del personaje. Se dibuja fijo en pantalla (no se mueve con
// la camara). Preparado para varios jugadores: recibe un array.
// ---------------------------------------------------------------------------

import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';

export class Hud {
  constructor(escena, jugadores, totalMonedas) {
    this.escena = escena;
    this.jugadores = jugadores;
    this.totalMonedas = totalMonedas;
    this.filas = [];

    jugadores.forEach((jugador, i) => {
      const y = 16 + i * 34;

      const panel = escena.add
        .rectangle(12, y, 250, 30, COLORES.panel, 0.55)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(100)
        .setStrokeStyle(2, COLORES.panelBorde, 0.9);

      const nombre = escena.add
        .text(24, y + 15, jugador.datos.nombre, {
          fontFamily: FUENTE.familia,
          fontSize: `${FUENTE.hud}px`,
          color: COLORES.textoClaro,
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101);

      const icono = escena.add
        .image(150, y + 15, TEXTURAS.moneda)
        .setScrollFactor(0)
        .setDepth(101);

      const contador = escena.add
        .text(168, y + 15, `0 / ${totalMonedas}`, {
          fontFamily: FUENTE.familia,
          fontSize: `${FUENTE.hud}px`,
          color: COLORES.textoAcento,
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101);

      this.filas.push({ panel, nombre, icono, contador });
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
      const texto = `${jugador.monedas} / ${this.totalMonedas}`;
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
}

export default Hud;
