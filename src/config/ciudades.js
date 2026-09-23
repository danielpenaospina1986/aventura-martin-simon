// ---------------------------------------------------------------------------
// EL SUELO DE CADA CIUDAD
//
// El plano medio es donde se juega, asi que su dibujo tiene que decir en que
// ciudad estamos sin quitarle protagonismo al personaje. Cada una trae su
// pavimento, su subsuelo y el color de sus cornisas.
//
// "patron" dice COMO se pinta (lo dibuja sistemas/dibujo.js) y los colores, con
// que. Todo con contorno de tinta y colores apagados, que es el idioma visual
// del juego.
//
// Importante: la casilla se repite en mosaico, asi que el dibujo tiene que
// casar consigo mismo por los cuatro lados. Nada de marcos completos, que
// convierten el suelo en una cuadricula.
// ---------------------------------------------------------------------------

export const CIUDADES = {
  // Costa espacial: arena de playa y hormigon de plataforma de lanzamiento.
  'space-coast': {
    pavimento: { patron: 'arena', claro: 0xe6d2a6, medio: 0xd2b98a, oscuro: 0xb09763 },
    subsuelo: { patron: 'estratos', claro: 0xb49b70, medio: 0x9c8460, oscuro: 0x7d6848 },
    cornisa: { cuerpo: 0xd8c49b, borde: 0x8d7850 },
  },

  // Medellin: acera de baldosa y ladrillo rojo debajo.
  medellin: {
    pavimento: { patron: 'baldosa', claro: 0xcfc4b0, medio: 0xb5a893, oscuro: 0x8d8070 },
    subsuelo: { patron: 'adoquin', claro: 0xa85f45, medio: 0x8e4d37, oscuro: 0x6b3828 },
    cornisa: { cuerpo: 0xc08f5e, borde: 0x6b4526 },
  },

  // Atlanta: calle de asfalto con su linea pintada, sobre hormigon.
  atlanta: {
    pavimento: { patron: 'asfalto', claro: 0x6a6a6e, medio: 0x55555a, oscuro: 0x3c3c41, linea: 0xd8b44a },
    subsuelo: { patron: 'estratos', claro: 0x807c78, medio: 0x6a6663, oscuro: 0x4e4b48 },
    cornisa: { cuerpo: 0x9c9690, borde: 0x4e4b48 },
  },

  // Miami: acera art deco en rosa palido con junta clara.
  miami: {
    pavimento: { patron: 'baldosa', claro: 0xe7c3bd, medio: 0xd0a49f, oscuro: 0xa87e7a },
    subsuelo: { patron: 'estratos', claro: 0xb99d9b, medio: 0x9d8482, oscuro: 0x7a6563 },
    cornisa: { cuerpo: 0x7fc4c0, borde: 0x3f7a78 },
  },

  // Cartagena: calzada de piedra colonial, ocre y gastada.
  cartagena: {
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
