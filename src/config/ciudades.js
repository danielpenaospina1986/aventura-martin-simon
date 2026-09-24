// ---------------------------------------------------------------------------
// EL SUELO DE CADA CIUDAD
//
// El plano medio es donde se juega, asi que su dibujo tiene que decir en que
// ciudad estamos sin quitarle protagonismo al personaje. Cada una trae su
// pavimento, su subsuelo y el color de sus cornisas.
//
// "pais" dice que bandera lleva el checkpoint: las dos ciudades colombianas la
// de Colombia y las tres de Estados Unidos la suya.
//
// "patron" dice COMO se pinta (lo dibuja sistemas/dibujo.js) y los colores, con
// que. Todo con contorno de tinta y colores apagados, que es el idioma visual
// del juego.
//
// Importante: la casilla se repite en mosaico, asi que el dibujo tiene que
// casar consigo mismo por los cuatro lados. Nada de marcos completos, que
// convierten el suelo en una cuadricula.
// ---------------------------------------------------------------------------

// Los adornos del primer plano, los que cruzan pegados a la camara.
//
// Nacen del borde de abajo de la pantalla, no de la linea por donde camina el
// nino: estan mas cerca que el suelo, asi que su base queda fuera de cuadro.
// Por eso las alturas son mas cortas de lo que pareceria: lo que se ve de un
// arbol de 150 px es solo lo que asoma por encima del suelo. Si se le da la
// altura "real" tapa al nino entero y no se puede jugar.
//
//   desde    de que borde cuelga: 'abajo' (a nivel de suelo) o 'arriba'
//   alto     lo que mide en pantalla; el ancho sale solo, sin deformar
//   cada     cada cuantos pixeles aparece uno
//   desfase  donde empieza la serie, para que no salgan todos alineados
import { TEXTURAS } from './estilo.js';

export const CIUDADES = {
  // Costa espacial: arena de playa y hormigon de plataforma de lanzamiento.
  'space-coast': {
    pais: 'us',
    // costa y cabo de lanzamiento: palmeras, un vecino de otro planeta dandose
    // un bano, y un astronauta flotando alla arriba
    frente: [
      { textura: TEXTURAS.frentePalmera, desde: 'abajo', alto: 152, cada: 820, desfase: 340 },
      { textura: TEXTURAS.frenteAlien, desde: 'abajo', alto: 112, cada: 1180, desfase: 900 },
      { textura: TEXTURAS.frenteAstronauta, desde: 'arriba', alto: 104, cada: 1020, desfase: 520 },
    ],
    pavimento: { patron: 'arena', claro: 0xe6d2a6, medio: 0xd2b98a, oscuro: 0xb09763 },
    subsuelo: { patron: 'estratos', claro: 0xb49b70, medio: 0x9c8460, oscuro: 0x7d6848 },
    cornisa: { cuerpo: 0xd8c49b, borde: 0x8d7850 },
  },

  // Medellin: acera de baldosa y ladrillo rojo debajo.
  medellin: {
    pais: 'co',
    // la ciudad de la hinchada verde, los frijoles y los guayacanes en flor
    frente: [
      { textura: TEXTURAS.frenteGuayacan, desde: 'abajo', alto: 148, cada: 940, desfase: 300 },
      // Las chivas van DETRAS del nino y del suelo, y bien grandes: son el
      // decorado de la ciudad, no un adorno que le pase por delante.
      { textura: TEXTURAS.frenteBus1, desde: 'abajo', alto: 300, cada: 1240, desfase: 760, detras: true },
      { textura: TEXTURAS.frentePalmeraAlta, desde: 'abajo', alto: 210, cada: 1060, desfase: 1180 },
      { textura: TEXTURAS.frenteBus2, desde: 'abajo', alto: 300, cada: 1320, desfase: 1600, detras: true },
      { textura: TEXTURAS.frenteFrijoles, desde: 'abajo', alto: 96, cada: 1140, desfase: 480 },
      // El gato de la hinchada, llorando porque Martain le mocho la cola. Va
      // con su bocadillo, que es el chiste: por eso es mas alto que el resto,
      // para que las dos lineas se puedan leer al pasar.
      { textura: TEXTURAS.frenteGato, desde: 'abajo', alto: 190, cada: 1460, desfase: 900 },
    ],
    pavimento: { patron: 'baldosa', claro: 0xcfc4b0, medio: 0xb5a893, oscuro: 0x8d8070 },
    subsuelo: { patron: 'adoquin', claro: 0xa85f45, medio: 0x8e4d37, oscuro: 0x6b3828 },
    cornisa: { cuerpo: 0xc08f5e, borde: 0x6b4526 },
  },

  // Atlanta: calle de asfalto con su linea pintada, sobre hormigon.
  atlanta: {
    pais: 'us',
    pavimento: { patron: 'asfalto', claro: 0x6a6a6e, medio: 0x55555a, oscuro: 0x3c3c41, linea: 0xd8b44a },
    subsuelo: { patron: 'estratos', claro: 0x807c78, medio: 0x6a6663, oscuro: 0x4e4b48 },
    cornisa: { cuerpo: 0x9c9690, borde: 0x4e4b48 },
  },

  // Miami: acera art deco en rosa palido con junta clara.
  miami: {
    pais: 'us',
    pavimento: { patron: 'baldosa', claro: 0xe7c3bd, medio: 0xd0a49f, oscuro: 0xa87e7a },
    subsuelo: { patron: 'estratos', claro: 0xb99d9b, medio: 0x9d8482, oscuro: 0x7a6563 },
    cornisa: { cuerpo: 0x7fc4c0, borde: 0x3f7a78 },
  },

  // Cartagena: calzada de piedra colonial, ocre y gastada.
  cartagena: {
    pais: 'co',
    pavimento: { patron: 'piedra', claro: 0xdcc28c, medio: 0xc2a670, oscuro: 0x9b8252 },
    subsuelo: { patron: 'piedra', claro: 0xab8f5f, medio: 0x917847, oscuro: 0x6f5c36 },
    cornisa: { cuerpo: 0xd9a05b, borde: 0x8a5f2c },
  },
};

// Si un nivel no dice de que ciudad es, o trae una que no esta, se usa esta.
export const CIUDAD_POR_DEFECTO = 'space-coast';

export function ciudadDe(nombre) {
  return CIUDADES[nombre] || CIUDADES[CIUDAD_POR_DEFECTO];
}

export default CIUDADES;
