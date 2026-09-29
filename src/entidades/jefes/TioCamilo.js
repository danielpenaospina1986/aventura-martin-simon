// ---------------------------------------------------------------------------
// ORLANDO: EL TIO CAMILO
//
// Un diablo colorado y barrigon con la cara del tio: cachos, rabo de punta de
// flecha y el escudo de su equipo en la barriga. Ronda su arena con un costal
// de balones al hombro y los tira EN LLAMAS.
//
// Como se le gana: igual que a Jean Luke, y por eso hereda de el. Marcha y
// tira; cuando se le acaban los balones se agacha de espaldas a rebuscar en el
// costal, y ahi se queda desprevenido. Un golpe en ese momento —pisandolo, con
// la katana o con un bloque— y lo encaja. Al sexto se sienta a llorar.
//
// Que herede de Jean Luke y no de JefeBase es a proposito: la pelea es LA
// MISMA, hasta en los tiempos, y lo unico suyo son sus dibujos, lo que tira y
// cuanto aguanta. Si algun dia sale un tercero con esta pelea, esto se sube a
// una base propia; con dos, partirlo seria inventarse una abstraccion de mas.
// ---------------------------------------------------------------------------

import { TEXTURAS } from '../../config/estilo.js';
import { JeanLuke } from './JeanLuke.js';

const LO_DEL_TIO_CAMILO = {
  marcha: TEXTURAS.tioCamiloMarcha,
  apunta: TEXTURAS.tioCamiloApunta,
  tira: TEXTURAS.tioCamiloTira,
  recarga: TEXTURAS.tioCamiloRecarga,
  golpe: TEXTURAS.tioCamiloGolpe,
  derrotado: TEXTURAS.tioCamiloDerrotado,

  // Uno mas que Jean Luke. Orlando va despues de Cartagena y tiene que
  // notarse, pero sin pasarse: la pelea es la misma, y ocho ya se hacia larga
  // cuando lo probamos con Martin Malvado.
  vidas: 6,

  // Balones en llamas, no globos de agua. Y al romperse echa CHISPAS: las
  // burbujas del globo sobre una bola de fuego quedaban de chiste, y no del
  // bueno.
  municion: {
    quieta: TEXTURAS.balon,
    vuela: TEXTURAS.balonVuela,
    seRompe: TEXTURAS.balonRevienta,
    echaChispas: true,
  },
};

export class TioCamilo extends JeanLuke {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, direccion, LO_DEL_TIO_CAMILO);
  }
}

export default TioCamilo;
