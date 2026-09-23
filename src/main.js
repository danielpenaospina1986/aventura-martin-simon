// ---------------------------------------------------------------------------
// LAS AVENTURAS DE MARTIN Y SIMON
// Arranque del juego: configuracion de Phaser y registro de escenas.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, FISICA, RENDER } from './config/ajustes.js';
import { EscenaCarga } from './escenas/EscenaCarga.js';
import { EscenaTitulo } from './escenas/EscenaTitulo.js';
import { EscenaSeleccion } from './escenas/EscenaSeleccion.js';
import { EscenaNivel } from './escenas/EscenaNivel.js';
import { EscenaPausa } from './escenas/EscenaPausa.js';
import { EscenaVictoria } from './escenas/EscenaVictoria.js';

// Los textos se rasterizan al tamano que se les pide y luego la camara los
// amplia, asi que con zoom saldrian borrosos. Se les sube la resolucion a la
// misma densidad, de una vez y para todos, envolviendo la fabrica de Phaser.
const fabricaDeTexto = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.register('text', function (x, y, contenido, estilo) {
  const texto = fabricaDeTexto.call(this, x, y, contenido, estilo);
  if (texto.setResolution) texto.setResolution(RENDER.densidad);
  return texto;
});

const configuracion = {
  type: Phaser.AUTO,
  parent: 'juego',
  backgroundColor: '#10131c',
  // Nada de pixel art: el juego va hacia dibujo animado de los anos 30, con
  // curvas y contornos suaves.
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // El lienzo tiene mas pixeles que el juego; la camara de cada escena va
    // con el mismo zoom, asi que las coordenadas siguen siendo 640 x 360.
    width: MUNDO.ancho * RENDER.densidad,
    height: MUNDO.alto * RENDER.densidad,
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
