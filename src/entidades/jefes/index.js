// ---------------------------------------------------------------------------
// QUE JEFE GUARDA CADA CIUDAD
//
// Cada guardian del bano tiene su propia forma de caer, asi que vive en su
// propio archivo. Aqui solo esta la lista de quien guarda que.
//
// Las cinco ciudades tienen ya el suyo; el provisional se queda como respaldo,
// por si algun dia se anade una ciudad antes que su jefe.
// ---------------------------------------------------------------------------

import { PapaInodoro } from './PapaInodoro.js';
import { Abuelo } from './Abuelo.js';
import { DonaZully } from './DonaZully.js';
import { MartinMalvado } from './MartinMalvado.js';
import { JeanLuke } from './JeanLuke.js';
import { TioCamilo } from './TioCamilo.js';
import { Chad } from './Chad.js';
import { SimonMalvado } from './SimonMalvado.js';
import { Provisional } from './Provisional.js';

const POR_CIUDAD = {
  'space-coast': PapaInodoro,
  medellin: Abuelo,
  atlanta: DonaZully,
  miami: MartinMalvado,
  cartagena: JeanLuke,

  // Y los tres nuevos, que ya tienen tambien los suyos. Cada uno pelea como
  // uno de los cinco primeros, pero es suyo todo lo que se ve:
  //
  //   el Tio Camilo   pelea como Jean Luke        (lo pidio Daniel)
  //   Chad            como Martin Malvado         (tira desde la torre)
  //   Simon Malvado   como Papa Inodoro           (escupe y embiste)
  orlando: TioCamilo,
  'lake-lanier': Chad,
  finca: SimonMalvado,
};

export function jefeDeCiudad(ciudad) {
  return POR_CIUDAD[ciudad] || Provisional;
}

export default jefeDeCiudad;
