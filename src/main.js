// ---------------------------------------------------------------------------
// LAS AVENTURAS DE MARTIN Y SIMON
// Arranque del juego: configuracion de Phaser y registro de escenas.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, FISICA, RENDER } from './config/ajustes.js';
import { EscenaCarga } from './escenas/EscenaCarga.js';
import { EscenaTitulo } from './escenas/EscenaTitulo.js';
import { EscenaNombre } from './escenas/EscenaNombre.js';
import { EscenaSeleccion } from './escenas/EscenaSeleccion.js';
import { EscenaRelato } from './escenas/EscenaRelato.js';
import { EscenaNivel } from './escenas/EscenaNivel.js';
import { EscenaPausa } from './escenas/EscenaPausa.js';
import { EscenaVictoria } from './escenas/EscenaVictoria.js';
import { EscenaFinal } from './escenas/EscenaFinal.js';

// Los textos se rasterizan al tamano que se les pide y luego la camara los
// amplia, asi que con zoom saldrian pixelados: a densidad 3, una letra de 16 px
// se dibuja en una textura de 16 y se estira a 48. Se les pide a todos que se
// dibujen a la densidad del render; en pantalla ocupan lo mismo, pero nitidos.
//
// Se parchea el PROTOTIPO de la fabrica y no con `register`: en Phaser 4,
// registrar un nombre que ya existe no lo reemplaza, asi que el envoltorio se
// quedaba sin llamar y los textos seguian saliendo a 1x.
const fabricaDeTexto = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, contenido, estilo) {
  return fabricaDeTexto.call(this, x, y, contenido, {
    resolution: RENDER.densidad,
    ...(estilo || {}),
  });
};

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
  scene: [
    EscenaCarga,
    EscenaTitulo,
    EscenaNombre,
    EscenaSeleccion,
    EscenaRelato,
    EscenaNivel,
    EscenaPausa,
    EscenaVictoria,
    EscenaFinal,
  ],
};

export const juego = new Phaser.Game(configuracion);

// Acceso desde la consola del navegador y desde las pruebas automaticas.
window.juego = juego;

export default juego;
