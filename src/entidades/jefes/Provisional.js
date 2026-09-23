// ---------------------------------------------------------------------------
// EL JEFE PROVISIONAL
//
// El bicho morado de siempre: camina de un lado a otro de su arena y se le da
// como sea (pisandolo, con la katana o con un bloque). Es el que guarda las
// ciudades a las que todavia no les toca su jefe de verdad.
// ---------------------------------------------------------------------------

import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

export class Provisional extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.jefe,
      texturaHerida: TEXTURAS.jefeEnfadado,
      direccion,
    });
  }
}

export default Provisional;
