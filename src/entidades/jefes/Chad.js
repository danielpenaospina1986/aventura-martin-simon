// ---------------------------------------------------------------------------
// LAKE LANIER: CHAD
//
// El chef del lago: gafas oscuras, toque, delantal manchado y un sarten en la
// mano. Se pasa la pelea subido a las torres de vigia tirando **panqueques**,
// que ruedan por la orilla y hay que saltar. **Aguanta ocho.**
//
// Como se le gana: igual que a Martin Malvado, y por eso hereda de el. Arriba
// no se le llega; cada dos panqueques BAJA a burlarse, y ahi vale cualquier
// golpe: pisarlo, la katana o un bloque. Los golpes no le cortan la bajada.
//
// Que herede de Martin Malvado y no de JefeBase es a proposito: la pelea es la
// misma, hasta en los tiempos, y lo unico suyo son sus dibujos y lo que tira.
// Con dos jefes compartiendola, partirla en una base propia seria inventarse
// una abstraccion de mas.
// ---------------------------------------------------------------------------

import { TEXTURAS } from '../../config/estilo.js';
import { MartinMalvado } from './MartinMalvado.js';

const LO_DE_CHAD = {
  vigila: TEXTURAS.chadVigila,
  tira: TEXTURAS.chadTira,
  salta: TEXTURAS.chadSalta,
  baja: TEXTURAS.chadBaja,
  golpe: TEXTURAS.chadGolpe,
  derrotado: TEXTURAS.chadDerrotado,

  // Los mismos ocho que Martin Malvado: la pelea es la suya, y ya esta medida.
  vidas: 8,

  municion: {
    quieta: TEXTURAS.panqueque,
    vuela: TEXTURAS.panquequeGira,
    seRompe: TEXTURAS.panquequeSplat,
  },
};

export class Chad extends MartinMalvado {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, direccion, LO_DE_CHAD);
  }
}

export default Chad;
