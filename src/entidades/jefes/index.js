// ---------------------------------------------------------------------------
// QUE JEFE GUARDA CADA CIUDAD
//
// Cada guardian del bano tiene su propia forma de caer, asi que vive en su
// propio archivo. Aqui solo esta la lista de quien guarda que.
//
// Las ciudades a las que aun no les toca su jefe se quedan con el provisional,
// para que el juego siga completo mientras se hacen de uno en uno.
// ---------------------------------------------------------------------------

import { AstronautaBurbuja } from './AstronautaBurbuja.js';
import { Provisional } from './Provisional.js';

const POR_CIUDAD = {
  'space-coast': AstronautaBurbuja,
};

export function jefeDeCiudad(ciudad) {
  return POR_CIUDAD[ciudad] || Provisional;
}

export default jefeDeCiudad;
