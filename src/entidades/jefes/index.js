// ---------------------------------------------------------------------------
// QUE JEFE GUARDA CADA CIUDAD
//
// Cada guardian del bano tiene su propia forma de caer, asi que vive en su
// propio archivo. Aqui solo esta la lista de quien guarda que.
//
// Las cinco ciudades tienen ya el suyo; el provisional se queda como respaldo,
// por si algun dia se anade una ciudad antes que su jefe.
// ---------------------------------------------------------------------------

import { AstronautaBurbuja } from './AstronautaBurbuja.js';
import { Carrotanque } from './Carrotanque.js';
import { DonaZully } from './DonaZully.js';
import { Salvavidas } from './Salvavidas.js';
import { CapitanTapon } from './CapitanTapon.js';
import { Provisional } from './Provisional.js';

const POR_CIUDAD = {
  'space-coast': AstronautaBurbuja,
  medellin: Carrotanque,
  atlanta: DonaZully,
  miami: Salvavidas,
  cartagena: CapitanTapon,
};

export function jefeDeCiudad(ciudad) {
  return POR_CIUDAD[ciudad] || Provisional;
}

export default jefeDeCiudad;
