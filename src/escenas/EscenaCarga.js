// ---------------------------------------------------------------------------
// ESCENA DE CARGA
// Genera todas las texturas provisionales y pasa al titulo.
// Cuando llegue el arte de verdad, aqui se hara el load.image de los PNG.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { generarTexturas } from '../sistemas/dibujo.js';
import { TEXTURAS } from '../config/estilo.js';
// Importado asi para que Vite le ponga la ruta correcta tambien al publicarlo
// en una subcarpeta (GitHub Pages).
import fondoBarrio from '../assets/fondo-barrio.jpg';

export class EscenaCarga extends Phaser.Scene {
  constructor() {
    super('carga');
  }

  preload() {
    this.load.image(TEXTURAS.fondo, fondoBarrio);
  }

  create() {
    generarTexturas(this);
    this.scene.start('titulo');
  }
}

export default EscenaCarga;
