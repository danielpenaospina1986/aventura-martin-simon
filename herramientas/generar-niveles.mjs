// ---------------------------------------------------------------------------
// GENERAR LOS NIVELES
//
// Los mapas se escriben aqui por tramos y la herramienta los convierte en los
// archivos de src/niveles/. Se hace asi, y no a mano, porque un mapa es una
// rejilla de 100 x 17 caracteres y alinear eso a ojo es imposible.
//
//   node herramientas/generar-niveles.mjs
//   npm run validar        (comprueba que los cinco se pueden terminar)
//
// Los archivos que salen SI son editables a mano si se quiere retocar una
// casilla suelta: son texto plano con una regla de columnas arriba.
//
// Recordatorio de lo que puede hacer un personaje (lo calcula el validador):
//   salto ....... 3,58 casillas de alto
//   distancia ... 4,11 casillas en llano
// Asi que: desniveles de 3 casillas y huecos de 3 casillas van sobrados.
// ---------------------------------------------------------------------------

import { writeFileSync } from 'node:fs';

const FILAS = 17;
const SUELO_BASE = 14; // fila donde esta el suelo de casi todo

// --- utilidades para pintar sobre la rejilla --------------------------------

function crearLienzo(columnas) {
  return Array.from({ length: FILAS }, () => Array(columnas).fill('.'));
}

// Un tramo de terreno: se rellena desde filaTope hasta abajo del todo.
function terreno(mapa, desde, hasta, filaTope = SUELO_BASE) {
  for (let col = desde; col <= hasta; col += 1) {
    for (let fila = filaTope; fila < FILAS; fila += 1) mapa[fila][col] = '#';
  }
}

function plataforma(mapa, col, fila, largo) {
  for (let i = 0; i < largo; i += 1) mapa[fila][col + i] = '=';
}

function repisa(mapa, col, fila, largo) {
  for (let i = 0; i < largo; i += 1) mapa[fila][col + i] = '#';
}

function poner(mapa, fila, col, texto) {
  for (let i = 0; i < texto.length; i += 1) mapa[fila][col + i] = texto[i];
}

function monedasEn(mapa, fila, col, cantidad, paso = 1) {
  for (let i = 0; i < cantidad; i += 1) mapa[fila][col + i * paso] = 'C';
}

// Arco de monedas sobre un hueco: sigue la curva del salto.
function arcoDeMonedas(mapa, colInicio, ancho, filaBase) {
  for (let i = 0; i < ancho; i += 1) {
    const centro = (ancho - 1) / 2;
    const altura = Math.round(1.6 * (1 - ((i - centro) / (centro + 0.5)) ** 2));
    mapa[filaBase - altura][colInicio + i] = 'C';
  }
}

// --- los cinco tableros -----------------------------------------------------

const NIVELES = [];

// ---------------------------------------------------------------- 1. El barrio
{
  const columnas = 96;
  const m = crearLienzo(columnas);

  terreno(m, 0, 25);
  terreno(m, 29, 51);
  terreno(m, 55, 69);
  terreno(m, 72, 95);
  repisa(m, 95, 10, 1); // pared que cierra la arena del jefe
  for (let f = 10; f <= 13; f += 1) m[f][95] = '#';

  poner(m, 13, 3, 'P');
  monedasEn(m, 13, 8, 3);
  plataforma(m, 13, 11, 4);
  monedasEn(m, 10, 14, 2);

  poner(m, 13, 20, 'E');
  monedasEn(m, 13, 22, 2);

  arcoDeMonedas(m, 26, 3, 12); // sobre el primer hueco

  plataforma(m, 32, 11, 3);
  monedasEn(m, 10, 33, 1);
  plataforma(m, 37, 9, 3);
  monedasEn(m, 8, 38, 1);
  plataforma(m, 42, 7, 3);
  monedasEn(m, 6, 43, 1);

  poner(m, 13, 48, 'K');

  monedasEn(m, 13, 56, 2);
  poner(m, 13, 58, 'E');
  poner(m, 13, 61, 'E');
  poner(m, 13, 64, 'E');
  monedasEn(m, 13, 66, 2);

  monedasEn(m, 12, 70, 2);
  plataforma(m, 72, 11, 2);
  repisa(m, 74, 8, 6);
  monedasEn(m, 7, 74, 6);

  poner(m, 13, 80, 'K');
  monedasEn(m, 13, 82, 3);
  poner(m, 13, 87, 'J');
  poner(m, 13, 94, 'M');

  NIVELES.push({
    archivo: 'nivel1.js',
    constante: 'NIVEL_1',
    nombre: 'El barrio',
    mapa: m,
    pistas: [
      { col: 5, fila: 11, texto: '← →  para moverte' },
      { col: 12, fila: 9, texto: 'Espacio para saltar' },
      { col: 31, fila: 10, texto: 'Sube por las plataformas' },
      { col: 57, fila: 11, texto: 'Pulsa X para atacar' },
      { col: 75, fila: 11, texto: 'Ahí arriba hay premios' },
      { col: 84, fila: 9, texto: '¡El jefe!' },
      { col: 84, fila: 10, texto: 'Sáltale encima o atácale: aguanta 3 golpes' },
    ],
  });
}

// --------------------------------------------------------------- 2. Los tejados
{
  const columnas = 104;
  const m = crearLienzo(columnas);

  terreno(m, 0, 19);
  terreno(m, 23, 40, 13); // se sube un escalon
  terreno(m, 44, 62, 12);
  terreno(m, 66, 78, 13);
  terreno(m, 82, 103);
  for (let f = 10; f <= 13; f += 1) m[f][103] = '#';

  poner(m, 13, 3, 'P');
  monedasEn(m, 13, 7, 3);
  poner(m, 13, 15, 'E');

  arcoDeMonedas(m, 20, 3, 12);
  plataforma(m, 21, 11, 2);

  monedasEn(m, 12, 26, 3);
  poner(m, 12, 31, 'E');
  plataforma(m, 34, 10, 3);
  monedasEn(m, 9, 35, 2);

  arcoDeMonedas(m, 41, 3, 11);

  poner(m, 11, 47, 'K');
  monedasEn(m, 11, 50, 2);
  poner(m, 11, 53, 'E');
  poner(m, 11, 56, 'E');
  plataforma(m, 58, 9, 3);
  monedasEn(m, 8, 59, 2);

  arcoDeMonedas(m, 63, 3, 11);
  monedasEn(m, 12, 68, 3);
  poner(m, 12, 73, 'E');
  plataforma(m, 75, 10, 3);
  monedasEn(m, 9, 76, 2);

  arcoDeMonedas(m, 79, 3, 12);

  poner(m, 13, 85, 'K');
  monedasEn(m, 13, 88, 3);
  poner(m, 13, 94, 'J');
  poner(m, 13, 102, 'M');

  NIVELES.push({
    archivo: 'nivel2.js',
    constante: 'NIVEL_2',
    nombre: 'Los tejados',
    mapa: m,
    pistas: [
      { col: 6, fila: 11, texto: 'Se sube por los tejados' },
      { col: 34, fila: 8, texto: 'Arriba hay más premios' },
      { col: 85, fila: 10, texto: '¡Otro jefe!' },
    ],
  });
}

// --------------------------------------------------------------- 3. El mercado
{
  const columnas = 108;
  const m = crearLienzo(columnas);

  terreno(m, 0, 22);
  terreno(m, 26, 44);
  terreno(m, 48, 66);
  terreno(m, 70, 86);
  terreno(m, 90, 107);
  for (let f = 10; f <= 13; f += 1) m[f][107] = '#';

  poner(m, 13, 3, 'P');
  monedasEn(m, 13, 6, 4);
  poner(m, 13, 13, 'E');
  poner(m, 13, 17, 'E');

  // toldos del mercado: plataformas bajas y seguidas
  plataforma(m, 10, 11, 3);
  monedasEn(m, 10, 11, 2);
  plataforma(m, 16, 10, 3);
  monedasEn(m, 9, 17, 2);

  arcoDeMonedas(m, 23, 3, 12);

  plataforma(m, 28, 11, 3);
  plataforma(m, 33, 9, 3);
  monedasEn(m, 8, 34, 2);
  plataforma(m, 38, 11, 3);
  poner(m, 13, 30, 'E');
  poner(m, 13, 36, 'E');
  monedasEn(m, 13, 41, 3);

  arcoDeMonedas(m, 45, 3, 12);

  poner(m, 13, 50, 'K');
  monedasEn(m, 13, 53, 3);
  poner(m, 13, 57, 'E');
  poner(m, 13, 60, 'E');
  poner(m, 13, 63, 'E');
  repisa(m, 54, 9, 5);
  monedasEn(m, 8, 54, 5);
  plataforma(m, 51, 11, 2);

  arcoDeMonedas(m, 67, 3, 12);

  monedasEn(m, 13, 72, 3);
  plataforma(m, 77, 11, 4);
  monedasEn(m, 10, 78, 3);
  poner(m, 13, 83, 'E');

  arcoDeMonedas(m, 87, 3, 12);

  poner(m, 13, 92, 'K');
  monedasEn(m, 13, 95, 3);
  poner(m, 13, 99, 'J');
  poner(m, 13, 106, 'M');

  NIVELES.push({
    archivo: 'nivel3.js',
    constante: 'NIVEL_3',
    nombre: 'El mercado',
    mapa: m,
    pistas: [
      { col: 8, fila: 8, texto: 'Salta por los toldos' },
      { col: 56, fila: 11, texto: 'Aquí hay muchos bichos' },
      { col: 93, fila: 10, texto: '¡El jefe del mercado!' },
    ],
  });
}

// -------------------------------------------------------------- 4. La quebrada
{
  const columnas = 112;
  const m = crearLienzo(columnas);

  terreno(m, 0, 16);
  terreno(m, 20, 30);
  terreno(m, 34, 43);
  terreno(m, 47, 57);
  terreno(m, 61, 72);
  terreno(m, 76, 88);
  terreno(m, 92, 111);
  for (let f = 10; f <= 13; f += 1) m[f][111] = '#';

  poner(m, 13, 3, 'P');
  monedasEn(m, 13, 6, 3);
  poner(m, 13, 12, 'E');

  arcoDeMonedas(m, 17, 3, 12);
  monedasEn(m, 13, 22, 3);
  plataforma(m, 26, 11, 3);
  monedasEn(m, 10, 27, 2);

  arcoDeMonedas(m, 31, 3, 12);
  poner(m, 13, 37, 'E');
  monedasEn(m, 13, 40, 2);

  arcoDeMonedas(m, 44, 3, 12);
  poner(m, 13, 49, 'K');
  plataforma(m, 52, 11, 3);
  monedasEn(m, 10, 53, 3);

  arcoDeMonedas(m, 58, 3, 12);
  poner(m, 13, 63, 'E');
  poner(m, 13, 67, 'E');
  monedasEn(m, 13, 69, 3);

  arcoDeMonedas(m, 73, 3, 12);
  repisa(m, 79, 9, 5);
  monedasEn(m, 8, 79, 5);
  plataforma(m, 76, 11, 2);
  poner(m, 13, 85, 'E');

  arcoDeMonedas(m, 89, 3, 12);
  poner(m, 13, 94, 'K');
  monedasEn(m, 13, 97, 3);
  poner(m, 13, 102, 'J');
  poner(m, 13, 110, 'M');

  NIVELES.push({
    archivo: 'nivel4.js',
    constante: 'NIVEL_4',
    nombre: 'La quebrada',
    mapa: m,
    pistas: [
      { col: 5, fila: 11, texto: 'Aquí hay muchos huecos' },
      { col: 50, fila: 11, texto: 'Con calma y salto largo' },
      { col: 96, fila: 10, texto: '¡El jefe de la quebrada!' },
    ],
  });
}

// ------------------------------------------------------------------ 5. La cima
{
  const columnas = 116;
  const m = crearLienzo(columnas);

  terreno(m, 0, 18);
  terreno(m, 22, 36, 13);
  terreno(m, 40, 52, 12);
  terreno(m, 56, 68, 11);
  terreno(m, 72, 84, 10);
  terreno(m, 88, 98, 12);
  terreno(m, 102, 115);
  for (let f = 9; f <= 13; f += 1) m[f][115] = '#';

  poner(m, 13, 3, 'P');
  monedasEn(m, 13, 6, 3);
  poner(m, 13, 14, 'E');

  arcoDeMonedas(m, 19, 3, 12);
  monedasEn(m, 12, 24, 3);
  poner(m, 12, 29, 'E');
  plataforma(m, 32, 10, 3);
  monedasEn(m, 9, 33, 2);

  arcoDeMonedas(m, 37, 3, 11);
  poner(m, 11, 43, 'K');
  monedasEn(m, 11, 46, 3);
  poner(m, 11, 50, 'E');

  arcoDeMonedas(m, 53, 3, 10);
  monedasEn(m, 10, 58, 3);
  poner(m, 10, 62, 'E');
  poner(m, 10, 65, 'E');
  plataforma(m, 66, 8, 3);
  monedasEn(m, 7, 67, 2);

  arcoDeMonedas(m, 69, 3, 9);
  monedasEn(m, 9, 74, 3);
  poner(m, 9, 79, 'E');
  repisa(m, 76, 6, 5);
  monedasEn(m, 5, 76, 5);
  plataforma(m, 73, 7, 2);

  arcoDeMonedas(m, 85, 3, 11);
  poner(m, 11, 90, 'E');
  monedasEn(m, 11, 93, 3);

  arcoDeMonedas(m, 99, 3, 12);
  poner(m, 13, 104, 'K');
  monedasEn(m, 13, 106, 3);
  poner(m, 13, 110, 'J');
  poner(m, 13, 114, 'M');

  NIVELES.push({
    archivo: 'nivel5.js',
    constante: 'NIVEL_5',
    nombre: 'La cima',
    mapa: m,
    pistas: [
      { col: 6, fila: 11, texto: 'Todo hacia arriba' },
      { col: 74, fila: 4, texto: 'El premio gordo' },
      { col: 106, fila: 10, texto: '¡El jefe final!' },
    ],
  });
}

// --- escritura ---------------------------------------------------------------

const LEYENDA = `//   #  suelo solido
//   =  plataforma que se atraviesa desde abajo
//   C  moneda (sushi para Martin, bloque para Simon)
//   E  enemigo
//   J  jefe
//   K  checkpoint
//   M  meta
//   P  inicio del jugador
//   .  vacio`;

function regla(columnas) {
  return (
    '// col:  ' +
    Array.from({ length: Math.ceil(columnas / 10) + 1 }, (_, i) => String(i * 10).padEnd(10, ' '))
      .join('')
      .slice(0, columnas)
  );
}

NIVELES.forEach((nivel, indice) => {
  const filas = nivel.mapa.map((f) => f.join(''));
  const cuenta = (ch) => filas.join('').split(ch).length - 1;

  const cuerpo = filas.map((f, i) => `  '${f}', // ${String(i).padStart(2, ' ')}`).join('\n');
  const pistas = nivel.pistas
    .map((p) => `    { col: ${p.col}, fila: ${p.fila}, texto: '${p.texto}' },`)
    .join('\n');

  const contenido = `// ---------------------------------------------------------------------------
// NIVEL ${indice + 1} - "${nivel.nombre}"
//
// El mapa es texto puro: cada caracter es una casilla de 32x32 px.
// Se puede editar con el bloc de notas. Leyenda:
//
${LEYENDA}
//
// Este archivo lo genera herramientas/generar-niveles.mjs. Se puede retocar a
// mano, pero si se vuelve a ejecutar la herramienta se sobrescribe.
//
// Despues de editar, comprobar que sigue siendo jugable con:
//   npm run validar
// ---------------------------------------------------------------------------

export const ${nivel.constante} = {
  nombre: '${nivel.nombre}',
  mapa: [
${regla(filas[0].length)}
${cuerpo}
  ],

  // Carteles de ayuda que aparecen flotando en el mundo (columna, fila, texto).
  pistas: [
${pistas}
  ],
};

export default ${nivel.constante};
`;

  writeFileSync(`src/niveles/${nivel.archivo}`, contenido, 'utf8');
  console.log(
    `  ${nivel.archivo.padEnd(11)} ${nivel.nombre.padEnd(14)} ${filas[0].length}x${filas.length}  ` +
      `monedas ${String(cuenta('C')).padStart(2)}  enemigos ${cuenta('E')}  ` +
      `checkpoints ${cuenta('K')}  jefe ${cuenta('J')}  meta ${cuenta('M')}`,
  );
});

// indice de niveles
const indice = `// ---------------------------------------------------------------------------
// LOS NIVELES, EN ORDEN
// Anadir uno nuevo es crearlo en herramientas/generar-niveles.mjs y sumarlo a
// esta lista. El juego los encadena en este orden.
// ---------------------------------------------------------------------------

${NIVELES.map((n) => `import { ${n.constante} } from './${n.archivo}';`).join('\n')}

export const NIVELES = [${NIVELES.map((n) => n.constante).join(', ')}];

export const TOTAL_NIVELES = NIVELES.length;

export function nivelPorIndice(indice) {
  return NIVELES[Math.max(0, Math.min(indice, NIVELES.length - 1))];
}

export default NIVELES;
`;
writeFileSync('src/niveles/index.js', indice, 'utf8');
console.log(`\n  src/niveles/index.js con ${NIVELES.length} niveles`);
