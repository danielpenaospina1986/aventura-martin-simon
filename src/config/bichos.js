// ---------------------------------------------------------------------------
// QUE EMBISTE EN CADA MUNDO
//
// El bicho intermedio —el que entra corriendo por un lado del cuadro, se planta
// y embiste— es el mismo en los ocho mundos: entra igual, avisa igual, embiste
// igual y se derriba igual. Lo que cambia es QUE ES.
//
// En la finca sigue siendo la vaca berrionda, que es de donde salio el cuento.
// En los demas es lo que de verdad te atropellaria alli:
//
//   Space Coast  una vaca marciana, que para eso es el cabo de lanzamiento
//   Medellin     un bus, de los que se le vienen encima a uno en la ciudad
//   Atlanta      ALMA, la pastora alemana de los ninos, que esta loca
//   Miami        MELO, el pastor australiano de un ojo azul y otro cafe
//   Cartagena    los carros clasicos, como los de La Habana
//   Orlando      un vagon de montana rusa desbocado, con sus ninos dentro
//   Lake Lanier  Alma otra vez, que a los fines de semana se va con ellos
//   La finca     la vaca de siempre
//
// Una ciudad puede tener VARIAS: Medellin tiene dos buses y Cartagena tres
// carros, y se sortea cual sale cada vez. Asi el tablero no se hace previsible
// sin tener que dibujar seis poses mas por cada variante.
// ---------------------------------------------------------------------------

// Las poses que tiene que traer toda piel. Son las de la vaca, porque la pelea
// es la suya: dos de trote, una de aviso, dos de embestida y una de tumbado.
export const POSES_DE_BICHO = ['anda1', 'anda2', 'avisa', 'embiste1', 'embiste2', 'tumbada'];

// Todas las pieles que existen, por su nombre de carpeta en src/assets/bichos/.
export const PIELES = [
  'vaca',
  'vaca-marciana',
  'bus-hotelera',
  'bus-circular',
  'alma',
  'melo',
  'clasico-cadillac',
  'clasico-buick',
  'clasico-camioneta',
  'vagoneta',
];

// Cuales le tocan a cada ciudad. Si trae varias, se sortea.
const POR_CIUDAD = {
  'space-coast': ['vaca-marciana'],
  medellin: ['bus-hotelera', 'bus-circular'],
  atlanta: ['alma'],
  miami: ['melo'],
  cartagena: ['clasico-cadillac', 'clasico-buick', 'clasico-camioneta'],
  orlando: ['vagoneta'],
  'lake-lanier': ['alma'],
  finca: ['vaca'],
};

// Si una ciudad no dice nada, la vaca de siempre. Es lo que se ha hecho aqui
// con lo que falta, y ademas es el bicho del que salio el cuento.
export const PIEL_POR_DEFECTO = 'vaca';

// Las pieles de una ciudad, para poder mirarlas desde las pruebas.
export function pielesDeCiudad(ciudad) {
  return POR_CIUDAD[ciudad] || [PIEL_POR_DEFECTO];
}

// Que sale ESTA vez. Donde hay varias se echa a suertes; el azar se puede
// apagar pasando un numero, que es lo que hacen las pruebas para no medir a
// cara o cruz.
export function pielDeCiudad(ciudad, cual) {
  const suyas = pielesDeCiudad(ciudad);
  if (cual !== undefined) return suyas[((cual % suyas.length) + suyas.length) % suyas.length];
  return suyas[Math.floor(Math.random() * suyas.length)];
}

export default pielDeCiudad;
