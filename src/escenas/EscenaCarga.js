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
import portada from '../assets/portada.jpg';
import sushiPng from '../assets/objetos/sushi.png';
import legoPng from '../assets/objetos/lego.png';
import banderaCoPng from '../assets/objetos/bandera-co.png';
import banderaUsPng from '../assets/objetos/bandera-us.png';
import puertaPng from '../assets/objetos/puerta.png';
import portadaMenu from '../assets/portada-menu.jpg';
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
import simonCorre3 from '../assets/simon/corre3.png';
import simonCorre4 from '../assets/simon/corre4.png';
import simonCorre5 from '../assets/simon/corre5.png';
import simonLanza from '../assets/simon/lanza.png';
import simonGolpe from '../assets/simon/golpe.png';
import simonVictoria from '../assets/simon/victoria.png';
import martinQuieto from '../assets/martin/quieto.png';
import martinCorre1 from '../assets/martin/corre1.png';
import martinCorre2 from '../assets/martin/corre2.png';
import martinCorre3 from '../assets/martin/corre3.png';
import martinCorre4 from '../assets/martin/corre4.png';
import martinAtaque1 from '../assets/martin/ataque1.png';
import martinAtaque2 from '../assets/martin/ataque2.png';
import martinGolpe from '../assets/martin/golpe.png';
import martinVictoria from '../assets/martin/victoria.png';
import baneraQuieta from '../assets/bichos/banera/quieta.png';
import baneraAnda1 from '../assets/bichos/banera/anda1.png';
import baneraAnda2 from '../assets/bichos/banera/anda2.png';
import baneraCarga from '../assets/bichos/banera/carga.png';
import baneraLanza from '../assets/bichos/banera/lanza.png';
import palomaVuela1 from '../assets/bichos/paloma/vuela1.png';
import palomaVuela2 from '../assets/bichos/paloma/vuela2.png';
import palomaVuela3 from '../assets/bichos/paloma/vuela3.png';
import palomaVuela4 from '../assets/bichos/paloma/vuela4.png';
import palomaSuelta from '../assets/bichos/paloma/suelta1.png';

export class EscenaCarga extends Phaser.Scene {
  constructor() {
    super('carga');
  }

  preload() {
    this.load.image(TEXTURAS.fondo, fondoBarrio);
    this.load.image(TEXTURAS.portada, portada);
    this.load.image(TEXTURAS.sushi, sushiPng);
    this.load.image(TEXTURAS.lego, legoPng);
    this.load.image(TEXTURAS.banderaCo, banderaCoPng);
    this.load.image(TEXTURAS.banderaUs, banderaUsPng);
    this.load.image(TEXTURAS.puerta, puertaPng);
    this.load.image(TEXTURAS.portadaMenu, portadaMenu);
    Object.entries(FONDOS_CIUDAD).forEach(([ciudad, url]) => {
      this.load.image(TEXTURAS.fondoDe(ciudad), url);
    });
    this.load.image(TEXTURAS.caraMartin, caraMartin);
    this.load.image(TEXTURAS.caraSimon, caraSimon);
    this.load.image(TEXTURAS.simonQuieto, simonQuieto);
    this.load.image(TEXTURAS.simonCorre1, simonCorre1);
    this.load.image(TEXTURAS.simonCorre2, simonCorre2);
    this.load.image(TEXTURAS.simonCorre3, simonCorre3);
    this.load.image(TEXTURAS.simonCorre4, simonCorre4);
    this.load.image(TEXTURAS.simonCorre5, simonCorre5);
    this.load.image(TEXTURAS.simonLanza, simonLanza);
    this.load.image(TEXTURAS.simonGolpe, simonGolpe);
    this.load.image(TEXTURAS.simonVictoria, simonVictoria);
    this.load.image(TEXTURAS.martinQuieto, martinQuieto);
    this.load.image(TEXTURAS.martinCorre1, martinCorre1);
    this.load.image(TEXTURAS.martinCorre2, martinCorre2);
    this.load.image(TEXTURAS.martinCorre3, martinCorre3);
    this.load.image(TEXTURAS.martinCorre4, martinCorre4);
    this.load.image(TEXTURAS.martinAtaque1, martinAtaque1);
    this.load.image(TEXTURAS.martinAtaque2, martinAtaque2);
    this.load.image(TEXTURAS.martinGolpe, martinGolpe);
    this.load.image(TEXTURAS.martinVictoria, martinVictoria);
    this.load.image(TEXTURAS.baneraQuieta, baneraQuieta);
    this.load.image(TEXTURAS.baneraAnda1, baneraAnda1);
    this.load.image(TEXTURAS.baneraAnda2, baneraAnda2);
    this.load.image(TEXTURAS.baneraCarga, baneraCarga);
    this.load.image(TEXTURAS.baneraLanza, baneraLanza);
    this.load.image(TEXTURAS.palomaVuela1, palomaVuela1);
    this.load.image(TEXTURAS.palomaVuela2, palomaVuela2);
    this.load.image(TEXTURAS.palomaVuela3, palomaVuela3);
    this.load.image(TEXTURAS.palomaVuela4, palomaVuela4);
    this.load.image(TEXTURAS.palomaSuelta, palomaSuelta);
  }

  create() {
    generarTexturas(this);
    // La tipografia tiene que estar lista antes del primer cartel.
    cargarFuente().then(() => this.scene.start('titulo'));
  }
}

export default EscenaCarga;
