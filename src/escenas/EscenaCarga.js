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
import fondoSpaceCoast from '../assets/fondos/space-coast.jpg';
import fondoMedellin from '../assets/fondos/medellin.jpg';
import fondoAtlanta from '../assets/fondos/atlanta.jpg';
import fondoMiami from '../assets/fondos/miami.jpg';
import fondoCartagena from '../assets/fondos/cartagena.jpg';

// Un fondo por ciudad. La clave la arma TEXTURAS.fondoDe con el mismo nombre
// que lleva cada nivel en su campo "fondo".
const FONDOS_CIUDAD = {
  'space-coast': fondoSpaceCoast,
  medellin: fondoMedellin,
  atlanta: fondoAtlanta,
  miami: fondoMiami,
  cartagena: fondoCartagena,
};
import caraMartin from '../assets/cara-martin.png';
import caraSimon from '../assets/cara-simon.png';
import simonQuieto from '../assets/simon/quieto.png';
import simonCorre1 from '../assets/simon/corre1.png';
import simonCorre2 from '../assets/simon/corre2.png';
import simonLanza from '../assets/simon/lanza.png';

export class EscenaCarga extends Phaser.Scene {
  constructor() {
    super('carga');
  }

  preload() {
    this.load.image(TEXTURAS.fondo, fondoBarrio);
    Object.entries(FONDOS_CIUDAD).forEach(([ciudad, url]) => {
      this.load.image(TEXTURAS.fondoDe(ciudad), url);
    });
    this.load.image(TEXTURAS.caraMartin, caraMartin);
    this.load.image(TEXTURAS.caraSimon, caraSimon);
    this.load.image(TEXTURAS.simonQuieto, simonQuieto);
    this.load.image(TEXTURAS.simonCorre1, simonCorre1);
    this.load.image(TEXTURAS.simonCorre2, simonCorre2);
    this.load.image(TEXTURAS.simonLanza, simonLanza);
  }

  create() {
    generarTexturas(this);
    // La tipografia tiene que estar lista antes del primer cartel.
    cargarFuente().then(() => this.scene.start('titulo'));
  }
}

export default EscenaCarga;
