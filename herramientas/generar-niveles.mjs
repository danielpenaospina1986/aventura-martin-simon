// ---------------------------------------------------------------------------
// GENERAR LOS NIVELES
//
// Los mapas se escriben aqui por tramos y la herramienta los convierte en los
// archivos de src/niveles/. Se hace asi, y no a mano, porque un mapa es una
// rejilla de 90 x 11 caracteres y alinear eso a ojo es imposible.
//
//   npm run niveles     (escribe los mapas)
//   npm run validar     (comprueba que los cinco se pueden terminar)
//
// EL TABLERO TIENE TRES ALTURAS, y solo tres:
//
//   fila 0-2   franja libre arriba, reservada para los bichos voladores
//   fila 3     TERCER nivel   (se llega saltando desde el segundo)
//   fila 6     SEGUNDO nivel  (se llega saltando desde el suelo)
//   fila 9     SUELO          (por donde se camina)
//   fila 10-11 subsuelo (dos filas: con una sola, el terreno se quedaba 8 px
//              por encima del borde de la pantalla y abajo se veia una franja
//              negra)
//
// Entre altura y altura hay 3 casillas (96 px) y el salto llega a 3,58, asi que
// se sube de una a otra pero nunca del suelo al tercero de un tiron. Encima de
// cada altura quedan 2 casillas libres, que es lo que necesita el personaje.
// ---------------------------------------------------------------------------

import { writeFileSync } from 'node:fs';

const FILAS = 12;
const SUELO = 9;
const MEDIO = 6;
const ALTO = 3;

// donde se apoyan las cosas que van sobre cada altura
const SOBRE_SUELO = SUELO - 1;
const SOBRE_MEDIO = MEDIO - 1;
const SOBRE_ALTO = ALTO - 1;

// --- utilidades para pintar sobre la rejilla --------------------------------

const crearLienzo = (columnas) =>
  Array.from({ length: FILAS }, () => Array(columnas).fill('.'));

// Los huecos entre dos tramos no pasan de DOS casillas. Con tres, el salto
// llega por los pelos: hay que despegar en una ventana de 10 px (unos 48 ms) y
// se falla casi siempre. Con dos sobran 200 ms, que es lo que un nino necesita.
function suelo(mapa, desde, hasta) {
  for (let col = desde; col <= hasta; col += 1) {
    for (let fila = SUELO; fila < FILAS; fila += 1) mapa[fila][col] = '#';
  }
}

function plataforma(mapa, col, largo, fila) {
  for (let i = 0; i < largo; i += 1) mapa[fila][col + i] = '=';
}

const plataformaMedia = (mapa, col, largo) => plataforma(mapa, col, largo, MEDIO);
const plataformaAlta = (mapa, col, largo) => plataforma(mapa, col, largo, ALTO);

function repisaAlta(mapa, col, largo) {
  for (let i = 0; i < largo; i += 1) mapa[ALTO][col + i] = '#';
}

function poner(mapa, fila, col, texto) {
  for (let i = 0; i < texto.length; i += 1) mapa[fila][col + i] = texto[i];
}

function premios(mapa, fila, col, cantidad, paso = 1) {
  for (let i = 0; i < cantidad; i += 1) mapa[fila][col + i * paso] = 'C';
}

// Arco de premios sobre un hueco: sigue la curva del salto.
function arco(mapa, colInicio, ancho, filaBase) {
  for (let i = 0; i < ancho; i += 1) {
    const centro = (ancho - 1) / 2;
    const altura = Math.round(1.5 * (1 - ((i - centro) / (centro + 0.5)) ** 2));
    mapa[filaBase - altura][colInicio + i] = 'C';
  }
}

// El jefe mide el doble que un nino, asi que no se le puede saltar encima desde
// el suelo: el salto no llega. Cada arena lleva una plataforma a un lado, para
// subirse y dejarse caer sobre el.
function plataformaDelJefe(mapa, col) {
  plataformaMedia(mapa, col, 3);
}

// pared que cierra el tablero por la derecha, para que el jefe no se escape
function cerrar(mapa, columnas) {
  for (let f = ALTO; f < FILAS; f += 1) mapa[f][columnas - 1] = '#';
}

// --- los cinco tableros -----------------------------------------------------

const NIVELES = [];

// --------------------------------------------------------------- 1. Space Coast
{
  const columnas = 84;
  const m = crearLienzo(columnas);

  suelo(m, 0, 24);
  suelo(m, 27, 46);
  suelo(m, 49, 62);
  suelo(m, 65, 83);
  cerrar(m, columnas);

  poner(m, SOBRE_SUELO, 3, 'P');
  premios(m, SOBRE_SUELO, 7, 3);

  plataformaMedia(m, 12, 4);
  premios(m, SOBRE_MEDIO, 13, 3);

  poner(m, SOBRE_SUELO, 19, 'E');
  premios(m, SOBRE_SUELO, 21, 2);

  arco(m, 24, 3, SOBRE_SUELO);

  plataformaMedia(m, 29, 4);
  premios(m, SOBRE_MEDIO, 30, 2);
  plataformaAlta(m, 34, 4);
  premios(m, SOBRE_ALTO, 35, 3);
  plataformaMedia(m, 40, 3);

  poner(m, SOBRE_SUELO, 43, 'K');
  arco(m, 46, 3, SOBRE_SUELO);

  premios(m, SOBRE_SUELO, 50, 2);
  poner(m, SOBRE_SUELO, 53, 'E');
  poner(m, SOBRE_SUELO, 56, 'E');
  premios(m, SOBRE_SUELO, 59, 2);
  plataformaMedia(m, 52, 5);
  premios(m, SOBRE_MEDIO, 53, 4);

  arco(m, 63, 2, SOBRE_SUELO);

  plataformaMedia(m, 66, 3);
  repisaAlta(m, 69, 5);
  premios(m, SOBRE_ALTO, 69, 5);

  poner(m, SOBRE_SUELO, 71, 'K');
  plataformaDelJefe(m, 72);
  poner(m, SOBRE_SUELO, 77, 'J');
  poner(m, SOBRE_SUELO, 82, 'M');

  NIVELES.push({
    archivo: 'nivel1.js',
    constante: 'NIVEL_1',
    nombre: 'Space Coast',
    fondo: 'space-coast',
    mapa: m,
    pistas: [
      { col: 4, fila: 7, texto: 'Flechas para moverte' },
      { col: 12, fila: 4, texto: 'Espacio: saltar' },
      { col: 35, fila: 1, texto: 'Tres alturas' },
      { col: 54, fila: 7, texto: 'X: atacar' },
      { col: 77, fila: 5, texto: '¡El jefe!' },
    ],
  });
}

// ------------------------------------------------------------------ 2. Medellin
{
  const columnas = 92;
  const m = crearLienzo(columnas);

  suelo(m, 0, 21);
  suelo(m, 24, 41);
  suelo(m, 44, 59);
  suelo(m, 62, 75);
  suelo(m, 78, 91);
  cerrar(m, columnas);

  poner(m, SOBRE_SUELO, 3, 'P');
  premios(m, SOBRE_SUELO, 6, 3);
  poner(m, SOBRE_SUELO, 14, 'E');

  plataformaMedia(m, 9, 4);
  premios(m, SOBRE_MEDIO, 10, 3);
  plataformaAlta(m, 15, 4);
  premios(m, SOBRE_ALTO, 16, 3);

  arco(m, 21, 3, SOBRE_SUELO);

  premios(m, SOBRE_SUELO, 26, 3);
  poner(m, SOBRE_SUELO, 31, 'E');
  plataformaMedia(m, 29, 5);
  premios(m, SOBRE_MEDIO, 30, 4);
  plataformaAlta(m, 35, 4);
  premios(m, SOBRE_ALTO, 36, 3);

  arco(m, 41, 3, SOBRE_SUELO);

  poner(m, SOBRE_SUELO, 46, 'K');
  poner(m, SOBRE_SUELO, 50, 'E');
  poner(m, SOBRE_SUELO, 54, 'E');
  premios(m, SOBRE_SUELO, 56, 2);
  plataformaMedia(m, 47, 4);
  premios(m, SOBRE_MEDIO, 48, 3);

  arco(m, 59, 3, SOBRE_SUELO);

  premios(m, SOBRE_SUELO, 64, 3);
  poner(m, SOBRE_SUELO, 69, 'E');
  plataformaMedia(m, 63, 4);
  repisaAlta(m, 67, 5);
  premios(m, SOBRE_ALTO, 67, 5);

  arco(m, 75, 3, SOBRE_SUELO);

  poner(m, SOBRE_SUELO, 79, 'K');
  plataformaDelJefe(m, 80);
  poner(m, SOBRE_SUELO, 85, 'J');
  poner(m, SOBRE_SUELO, 90, 'M');

  NIVELES.push({
    archivo: 'nivel2.js',
    constante: 'NIVEL_2',
    nombre: 'Medellín',
    fondo: 'medellin',
    mapa: m,
    pistas: [
      { col: 9, fila: 1, texto: 'Sube por la ladera' },
      { col: 67, fila: 1, texto: 'Premio gordo' },
      { col: 84, fila: 5, texto: '¡El jefe de Medellín!' },
    ],
  });
}

// ------------------------------------------------------------------- 3. Atlanta
{
  const columnas = 92;
  const m = crearLienzo(columnas);

  suelo(m, 0, 19);
  suelo(m, 22, 37);
  suelo(m, 40, 55);
  suelo(m, 58, 73);
  suelo(m, 76, 91);
  cerrar(m, columnas);

  poner(m, SOBRE_SUELO, 3, 'P');
  premios(m, SOBRE_SUELO, 6, 3);
  poner(m, SOBRE_SUELO, 11, 'E');
  poner(m, SOBRE_SUELO, 15, 'E');

  plataformaMedia(m, 8, 4);
  premios(m, SOBRE_MEDIO, 9, 3);
  plataformaAlta(m, 13, 5);
  premios(m, SOBRE_ALTO, 14, 4);

  arco(m, 19, 3, SOBRE_SUELO);

  premios(m, SOBRE_SUELO, 24, 3);
  poner(m, SOBRE_SUELO, 29, 'E');
  poner(m, SOBRE_SUELO, 33, 'E');
  plataformaMedia(m, 26, 5);
  premios(m, SOBRE_MEDIO, 27, 4);
  plataformaAlta(m, 32, 4);
  premios(m, SOBRE_ALTO, 33, 3);

  arco(m, 37, 3, SOBRE_SUELO);

  poner(m, SOBRE_SUELO, 42, 'K');
  premios(m, SOBRE_SUELO, 45, 3);
  poner(m, SOBRE_SUELO, 50, 'E');
  plataformaMedia(m, 44, 5);
  premios(m, SOBRE_MEDIO, 45, 4);
  plataformaAlta(m, 49, 4);
  premios(m, SOBRE_ALTO, 50, 3);

  arco(m, 55, 3, SOBRE_SUELO);

  premios(m, SOBRE_SUELO, 60, 3);
  poner(m, SOBRE_SUELO, 65, 'E');
  poner(m, SOBRE_SUELO, 69, 'E');
  plataformaMedia(m, 62, 4);
  repisaAlta(m, 66, 5);
  premios(m, SOBRE_ALTO, 66, 5);

  arco(m, 73, 3, SOBRE_SUELO);

  poner(m, SOBRE_SUELO, 78, 'K');
  plataformaDelJefe(m, 79);
  poner(m, SOBRE_SUELO, 85, 'J');
  poner(m, SOBRE_SUELO, 90, 'M');

  NIVELES.push({
    archivo: 'nivel3.js',
    constante: 'NIVEL_3',
    nombre: 'Atlanta',
    fondo: 'atlanta',
    mapa: m,
    pistas: [
      { col: 13, fila: 1, texto: 'Hasta arriba' },
      { col: 50, fila: 7, texto: 'Aquí hay muchos bichos' },
      { col: 84, fila: 5, texto: '¡El jefe de Atlanta!' },
    ],
  });
}

// --------------------------------------------------------------------- 4. Miami
{
  const columnas = 100;
  const m = crearLienzo(columnas);

  suelo(m, 0, 15);
  suelo(m, 18, 29);
  suelo(m, 32, 43);
  suelo(m, 46, 57);
  suelo(m, 60, 71);
  suelo(m, 74, 85);
  suelo(m, 88, 99);
  cerrar(m, columnas);

  poner(m, SOBRE_SUELO, 3, 'P');
  premios(m, SOBRE_SUELO, 6, 3);
  poner(m, SOBRE_SUELO, 11, 'E');
  plataformaMedia(m, 7, 4);
  premios(m, SOBRE_MEDIO, 8, 3);

  arco(m, 15, 3, SOBRE_SUELO);
  premios(m, SOBRE_SUELO, 20, 3);
  plataformaMedia(m, 19, 4);
  plataformaAlta(m, 23, 4);
  premios(m, SOBRE_ALTO, 24, 3);

  arco(m, 29, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 35, 'E');
  premios(m, SOBRE_SUELO, 38, 3);
  plataformaMedia(m, 33, 4);
  premios(m, SOBRE_MEDIO, 34, 3);

  arco(m, 43, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 48, 'K');
  premios(m, SOBRE_SUELO, 51, 3);
  plataformaMedia(m, 47, 5);
  plataformaAlta(m, 52, 4);
  premios(m, SOBRE_ALTO, 53, 3);

  arco(m, 57, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 62, 'E');
  poner(m, SOBRE_SUELO, 66, 'E');
  premios(m, SOBRE_SUELO, 68, 2);
  plataformaMedia(m, 61, 5);
  premios(m, SOBRE_MEDIO, 62, 4);

  arco(m, 71, 3, SOBRE_SUELO);
  premios(m, SOBRE_SUELO, 76, 3);
  poner(m, SOBRE_SUELO, 81, 'E');
  plataformaMedia(m, 75, 4);
  repisaAlta(m, 79, 5);
  premios(m, SOBRE_ALTO, 79, 5);

  arco(m, 85, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 89, 'K');
  plataformaDelJefe(m, 88);
  poner(m, SOBRE_SUELO, 94, 'J');
  poner(m, SOBRE_SUELO, 98, 'M');

  NIVELES.push({
    archivo: 'nivel4.js',
    constante: 'NIVEL_4',
    nombre: 'Miami',
    fondo: 'miami',
    mapa: m,
    pistas: [
      { col: 4, fila: 7, texto: 'Cuidado con los huecos' },
      { col: 79, fila: 1, texto: 'Premio gordo' },
      { col: 93, fila: 5, texto: '¡El jefe de Miami!' },
    ],
  });
}

// ----------------------------------------------------------------- 5. Cartagena
{
  const columnas = 100;
  const m = crearLienzo(columnas);

  suelo(m, 0, 17);
  suelo(m, 20, 33);
  suelo(m, 36, 49);
  suelo(m, 52, 63);
  suelo(m, 66, 79);
  suelo(m, 82, 99);
  cerrar(m, columnas);

  poner(m, SOBRE_SUELO, 3, 'P');
  premios(m, SOBRE_SUELO, 6, 3);
  poner(m, SOBRE_SUELO, 12, 'E');
  plataformaMedia(m, 8, 4);
  premios(m, SOBRE_MEDIO, 9, 3);
  plataformaAlta(m, 13, 4);
  premios(m, SOBRE_ALTO, 14, 3);

  arco(m, 17, 3, SOBRE_SUELO);
  premios(m, SOBRE_SUELO, 22, 3);
  poner(m, SOBRE_SUELO, 27, 'E');
  plataformaMedia(m, 21, 5);
  premios(m, SOBRE_MEDIO, 22, 4);
  plataformaAlta(m, 27, 4);
  premios(m, SOBRE_ALTO, 28, 3);

  arco(m, 33, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 38, 'K');
  premios(m, SOBRE_SUELO, 41, 3);
  poner(m, SOBRE_SUELO, 46, 'E');
  plataformaMedia(m, 39, 5);
  premios(m, SOBRE_MEDIO, 40, 4);
  plataformaAlta(m, 44, 4);
  premios(m, SOBRE_ALTO, 45, 3);

  arco(m, 49, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 54, 'E');
  poner(m, SOBRE_SUELO, 58, 'E');
  premios(m, SOBRE_SUELO, 60, 2);
  plataformaMedia(m, 53, 5);
  premios(m, SOBRE_MEDIO, 54, 4);

  arco(m, 63, 3, SOBRE_SUELO);
  premios(m, SOBRE_SUELO, 68, 3);
  poner(m, SOBRE_SUELO, 73, 'E');
  plataformaMedia(m, 67, 4);
  repisaAlta(m, 71, 6);
  premios(m, SOBRE_ALTO, 71, 6);

  arco(m, 79, 3, SOBRE_SUELO);
  poner(m, SOBRE_SUELO, 83, 'K');
  plataformaDelJefe(m, 85);
  poner(m, SOBRE_SUELO, 92, 'J');
  poner(m, SOBRE_SUELO, 98, 'M');

  NIVELES.push({
    archivo: 'nivel5.js',
    constante: 'NIVEL_5',
    nombre: 'Cartagena',
    fondo: 'cartagena',
    mapa: m,
    pistas: [
      { col: 8, fila: 1, texto: 'Hacia las murallas' },
      { col: 71, fila: 1, texto: 'El premio gordo' },
      { col: 90, fila: 5, texto: '¡El jefe final!' },
    ],
  });
}

// --- escritura ---------------------------------------------------------------

const LEYENDA = `//   #  suelo solido
//   =  plataforma que se atraviesa desde abajo
//   C  premio (sushi para Martain, bloque para Samaon)
//   E  enemigo
//   J  jefe
//   K  checkpoint
//   M  meta
//   P  inicio del jugador
//   .  vacio`;

const regla = (columnas) =>
  '// col:  ' +
  Array.from({ length: Math.ceil(columnas / 10) + 1 }, (_, i) => String(i * 10).padEnd(10, ' '))
    .join('')
    .slice(0, columnas);

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

export const ${nivel.constante} = {
  nombre: '${nivel.nombre}',
  fondo: '${nivel.fondo}',
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
    `  ${nivel.archivo.padEnd(11)} ${nivel.nombre.padEnd(12)} ${filas[0].length}x${filas.length}  ` +
      `premios ${String(cuenta('C')).padStart(2)}  enemigos ${cuenta('E')}  ` +
      `checkpoints ${cuenta('K')}  jefe ${cuenta('J')}  meta ${cuenta('M')}`,
  );
});

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
