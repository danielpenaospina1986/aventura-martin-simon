// ---------------------------------------------------------------------------
// LOS NIVELES, EN ORDEN
// Anadir uno nuevo es crearlo en herramientas/generar-niveles.mjs y sumarlo a
// esta lista. El juego los encadena en este orden.
// ---------------------------------------------------------------------------

import { NIVEL_1 } from './nivel1.js';
import { NIVEL_2 } from './nivel2.js';
import { NIVEL_3 } from './nivel3.js';
import { NIVEL_4 } from './nivel4.js';
import { NIVEL_5 } from './nivel5.js';
import { NIVEL_6 } from './nivel6.js';
import { NIVEL_7 } from './nivel7.js';
import { NIVEL_8 } from './nivel8.js';

export const NIVELES = [NIVEL_1, NIVEL_2, NIVEL_3, NIVEL_4, NIVEL_5, NIVEL_6, NIVEL_7, NIVEL_8];

export const TOTAL_NIVELES = NIVELES.length;

export function nivelPorIndice(indice) {
  return NIVELES[Math.max(0, Math.min(indice, NIVELES.length - 1))];
}

export default NIVELES;
