// ---------------------------------------------------------------------------
// PERSONAJES
// Misma velocidad y mismo salto para los dos. Lo unico que cambia es la
// habilidad y el aspecto.
// ---------------------------------------------------------------------------

import { TEXTURAS } from './estilo.js';

export const PERSONAJES = {
  martin: {
    id: 'martin',
    nombre: 'Martín',
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
    nombre: 'Simón',
    textura: TEXTURAS.simon,
    cara: TEXTURAS.caraSimon,
    moneda: TEXTURAS.monedaSimon,
    nombreMoneda: 'bloques',
    ancho: 30,
    alto: 52,
    color: 0xef7d1e,        // naranja
    colorPelo: 0x1b1b22,    // negro
    altoPelo: 10,
    caja: { ancho: 22, alto: 48 },
    habilidad: 'lanzar',
    nombreHabilidad: 'Lanzar bloques',
    descripcion: 'Grande y fuerte.\nLanza bloques que\nderriban enemigos.',
    pistaHabilidad: 'Pulsa X para lanzar un bloque',
  },
};

export const ORDEN_PERSONAJES = ['martin', 'simon'];
