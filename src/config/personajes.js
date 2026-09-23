// ---------------------------------------------------------------------------
// PERSONAJES
// Misma velocidad y mismo salto para los dos. Lo unico que cambia es la
// habilidad y el aspecto.
// ---------------------------------------------------------------------------

import { TEXTURAS } from './estilo.js';

export const PERSONAJES = {
  martin: {
    id: 'martin',
    nombre: 'Martaín',
    textura: TEXTURAS.martin,
    cara: TEXTURAS.caraMartin,
    moneda: TEXTURAS.monedaMartin,
    nombreMoneda: 'sushis',
    ancho: 22,
    alto: 44,
    color: 0xd93b3b,        // rojo
    colorPelo: 0xe9d6ac,    // castaño muy claro
    altoPelo: 9,
    caja: { ancho: 16, alto: 40 },  // un poco mas pequena que el dibujo
    habilidad: 'katana',
    nombreHabilidad: 'Golpe de katana',
    descripcion: 'Delgado y ágil.\nCorta a los enemigos\ncon un golpe de katana.',
    pistaHabilidad: 'Pulsa X para cortar',
  },
  simon: {
    id: 'simon',
    nombre: 'Samaón',
    textura: TEXTURAS.simonQuieto,
    cara: TEXTURAS.caraSimon,
    // Poses dibujadas. El sprite es el lienzo cuadrado en el que vienen todas
    // encajadas a la misma altura, por eso ancho y alto son iguales.
    poses: {
      quieto: TEXTURAS.simonQuieto,
      // ciclo completo: contacto, paso bajo, empuje, empuje, vuelo
      correr: [
        TEXTURAS.simonCorre1,
        TEXTURAS.simonCorre2,
        TEXTURAS.simonCorre3,
        TEXTURAS.simonCorre4,
        TEXTURAS.simonCorre5,
      ],
      // la ultima del ciclo es la de vuelo: con los dos pies en el aire, vale
      // tal cual para cuando esta saltando
      aire: TEXTURAS.simonCorre5,
      atacar: TEXTURAS.simonLanza,
      golpe: TEXTURAS.simonGolpe,
      victoria: TEXTURAS.simonVictoria,
    },
    msPorPaso: 95, // lo que dura cada pose del ciclo de carrera
    margenPie: 2,   // aire que queda bajo los pies dentro del lienzo
    moneda: TEXTURAS.monedaSimon,
    nombreMoneda: 'bloques',
    ancho: 68,
    alto: 68,
    color: 0xef7d1e,        // naranja (solo para el dibujo de respaldo)
    colorPelo: 0x1b1b22,
    altoPelo: 10,
    caja: { ancho: 28, alto: 54 },
    habilidad: 'lanzar',
    nombreHabilidad: 'Lanzar bloques',
    descripcion: 'Grande y fuerte.\nLanza bloques que\nderriban enemigos.',
    pistaHabilidad: 'Pulsa X para lanzar un bloque',
  },
};

// El orden del titulo: Samaon primero.
export const ORDEN_PERSONAJES = ['simon', 'martin'];
