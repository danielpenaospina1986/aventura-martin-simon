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

// Los ocho, colocados por DONDE VIVE CADA UNO y no por el orden en que se
// fueron dibujando. Lo pidio Daniel y tiene toda la logica del mundo:
//
//   Simon Malvado va a Space Coast, que es de donde son los ninos.
//   Papa Inodoro va a Medellin, que es de donde sale su "berriondo".
//   El Abuelo va a la finca, que es donde vive: ya no baja a la ciudad, ahora
//   los espera en su tierra con la camioneta y las canastillas de fruta.
//
// Ojo al mover un jefe de ciudad: su NOMBRE y sus FRASES viven en historia.js
// y van por CIUDAD, no por clase. Hay que mudarlos con el, o la ciudad enseña
// el dibujo de uno con el nombre de otro.
const POR_CIUDAD = {
  'space-coast': SimonMalvado,
  medellin: PapaInodoro,
  atlanta: DonaZully,
  miami: MartinMalvado,
  cartagena: JeanLuke,
  orlando: TioCamilo,
  'lake-lanier': Chad,
  finca: Abuelo,
};

export function jefeDeCiudad(ciudad) {
  return POR_CIUDAD[ciudad] || Provisional;
}

export default jefeDeCiudad;
