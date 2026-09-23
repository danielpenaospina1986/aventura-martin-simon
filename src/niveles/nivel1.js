// ---------------------------------------------------------------------------
// NIVEL 1 - "Space Coast"
//
// El mapa es texto puro: cada caracter es una casilla de 32x32 px.
// Se puede editar con el bloc de notas. Leyenda:
//
//   #  suelo solido
//   =  plataforma que se atraviesa desde abajo
//   C  premio (sushi para Martain, bloque para Samaon)
//   E  enemigo
//   J  jefe
//   K  checkpoint
//   M  meta
//   P  inicio del jugador
//   .  vacio
//
// El tablero tiene TRES alturas: el suelo (fila 9), el nivel medio (fila 6) y
// el alto (fila 3). Las tres filas de arriba se dejan libres a proposito, para
// los bichos voladores que vendran.
//
// Este archivo lo genera herramientas/generar-niveles.mjs. Se puede retocar a
// mano, pero si se vuelve a ejecutar la herramienta se sobrescribe.
//
// Despues de editar, comprobar que sigue siendo jugable con:
//   npm run validar
// ---------------------------------------------------------------------------

export const NIVEL_1 = {
  nombre: 'Space Coast',
  fondo: 'space-coast',
  mapa: [
// col:  0         10        20        30        40        50        60        70        80  
  '....................................................................................', //  0
  '....................................................................................', //  1
  '...................................CCC...............................CCCCC..........', //  2
  '..................................====...............................#####.........#', //  3
  '...................................................................................#', //  4
  '.............CCC..............CC.....................CCCC..........................#', //  5
  '............====.........C...====.......===....C....=====.........===...===........#', //  6
  '........................C.C...................C.C..............CC..................#', //  7
  '...P...CCC.........E.CC....................K......CC.E..E..CC..........K.....J....M#', //  8
  '#########################..####################..##############..###################', //  9
  '#########################..####################..##############..###################', // 10
  '#########################..####################..##############..###################', // 11
  ],

  // Carteles de ayuda que aparecen flotando en el mundo (columna, fila, texto).
  pistas: [
    { col: 4, fila: 7, texto: 'Flechas para moverte' },
    { col: 12, fila: 4, texto: 'Espacio: saltar' },
    { col: 35, fila: 1, texto: 'Tres alturas' },
    { col: 54, fila: 7, texto: 'X: atacar' },
    { col: 77, fila: 5, texto: '¡El jefe!' },
  ],
};

export default NIVEL_1;
