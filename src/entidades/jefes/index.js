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
import { Provisional } from './Provisional.js';

const POR_CIUDAD = {
  'space-coast': PapaInodoro,
  medellin: Abuelo,
  atlanta: DonaZully,
  miami: MartinMalvado,
  cartagena: JeanLuke,

  // Orlando ya tiene el suyo, con sus dibujos: el Tio Camilo. Pelea como Jean
  // Luke (lo pidio Daniel), pero es suyo todo lo que se ve.
  orlando: TioCamilo,

  // Los dos que SIGUEN en obra, con jefes prestados hasta que lleguen sus
  // dibujos. Se le da uno distinto a cada uno para que no se jueguen igual:
  //
  //   Lake Lanier  Chad, con la del que tira cosas desde arriba
  //   La finca     Simon Malvado, con la del que escupe y embiste
  //
  // El NOMBRE y las frases de los dos si son suyos: salen de historia.js, que
  // va por ciudad y no por clase.
  'lake-lanier': MartinMalvado,
  finca: PapaInodoro,
};

export function jefeDeCiudad(ciudad) {
  return POR_CIUDAD[ciudad] || Provisional;
}

export default jefeDeCiudad;
