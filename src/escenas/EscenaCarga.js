// ---------------------------------------------------------------------------
// ESCENA DE CARGA
// Genera todas las texturas provisionales y pasa al titulo.
// Cuando llegue el arte de verdad, aqui se hara el load.image de los PNG.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { generarTexturas } from '../sistemas/dibujo.js';
import { cargarFuente } from '../sistemas/fuente.js';
import { TEXTURAS } from '../config/estilo.js';
// Importado asi para que Vite le ponga la ruta correcta tambien al publicarlo
// en una subcarpeta (GitHub Pages).
import fondoBarrio from '../assets/fondo-barrio.jpg';
import caraMartin from '../assets/cara-martin.png';
import caraSimon from '../assets/cara-simon.png';

export class EscenaCarga extends Phaser.Scene {
  constructor() {
    super('carga');
  }

  preload() {
    this.load.image(TEXTURAS.fondo, fondoBarrio);
    this.load.image(TEXTURAS.caraMartin, caraMartin);
    this.load.image(TEXTURAS.caraSimon, caraSimon);
  }

  create() {
    generarTexturas(this);
    // La tipografia tiene que estar lista antes del primer cartel.
    cargarFuente().then(() => this.scene.start('titulo'));
  }
}

export default EscenaCarga;
