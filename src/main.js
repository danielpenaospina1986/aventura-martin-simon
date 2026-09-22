// ---------------------------------------------------------------------------
// LAS AVENTURAS DE MARTIN Y SIMON
// Arranque del juego: configuracion de Phaser y registro de escenas.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, FISICA } from './config/ajustes.js';
import { EscenaCarga } from './escenas/EscenaCarga.js';
import { EscenaTitulo } from './escenas/EscenaTitulo.js';
import { EscenaSeleccion } from './escenas/EscenaSeleccion.js';
import { EscenaNivel } from './escenas/EscenaNivel.js';
import { EscenaPausa } from './escenas/EscenaPausa.js';
import { EscenaVictoria } from './escenas/EscenaVictoria.js';

const configuracion = {
  type: Phaser.AUTO,
  parent: 'juego',
  backgroundColor: '#10131c',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: MUNDO.ancho,
    height: MUNDO.alto,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: FISICA.gravedad },
      debug: false,
    },
  },
  scene: [EscenaCarga, EscenaTitulo, EscenaSeleccion, EscenaNivel, EscenaPausa, EscenaVictoria],
};

export const juego = new Phaser.Game(configuracion);

// Acceso desde la consola del navegador y desde las pruebas automaticas.
window.juego = juego;

export default juego;
