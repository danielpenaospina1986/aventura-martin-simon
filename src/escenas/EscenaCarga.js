// ---------------------------------------------------------------------------
// ESCENA DE CARGA
// Genera todas las texturas provisionales y pasa al titulo.
// Cuando llegue el arte de verdad, aqui se hara el load.image de los PNG.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { generarTexturas } from '../sistemas/dibujo.js';

export class EscenaCarga extends Phaser.Scene {
  constructor() {
    super('carga');
  }

  create() {
    generarTexturas(this);
    this.scene.start('titulo');
  }
}

export default EscenaCarga;
