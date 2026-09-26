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

// --- motivos -----------------------------------------------------------------
//
// Trozos de tablero que se repiten. Cada uno se pinta sobre un tramo de suelo
// ya abierto y recibe su primera columna; estan pensados para tramos de 14
// casillas (el de arranque, para 16). Componer los tableros con motivos, en vez
// de columna a columna, es lo que permite alargarlos sin liarse: un tablero
// pasa a ser una lista de tramos y huecos.

const MOTIVOS = {
  // El arranque: sitio de sobra para trastear antes de que pase nada. Aqui no
  // se pone ningun bicho a proposito: el primer tramo es para aprender a andar
  // y a saltar sin que nadie moleste.
  inicio(m, c) {
    poner(m, SOBRE_SUELO, c + 3, 'P');
    premios(m, SOBRE_SUELO, c + 6, 3);
    plataformaMedia(m, c + 10, 4);
    premios(m, SOBRE_MEDIO, c + 11, 3);
  },

  // Escalera de tres alturas: del suelo al segundo piso y de ahi al tercero.
  escalera(m, c) {
    plataformaMedia(m, c + 1, 4);
    premios(m, SOBRE_MEDIO, c + 2, 3);
    plataformaAlta(m, c + 6, 4);
    premios(m, SOBRE_ALTO, c + 7, 3);
    poner(m, SOBRE_SUELO, c + 12, 'E');
  },

  // Un patio con bichos abajo y premios a media altura.
  patio(m, c) {
    plataformaMedia(m, c + 2, 5);
    premios(m, SOBRE_MEDIO, c + 3, 4);
    poner(m, SOBRE_SUELO, c + 3, 'E');
    poner(m, SOBRE_SUELO, c + 9, 'E');
    premios(m, SOBRE_SUELO, c + 6, 3);
  },

  // La repisa del premio gordo: cinco premios seguidos alla arriba.
  repisa(m, c) {
    plataformaMedia(m, c + 1, 4);
    premios(m, SOBRE_MEDIO, c + 2, 2);
    repisaAlta(m, c + 6, 5);
    premios(m, SOBRE_ALTO, c + 6, 5);
    poner(m, SOBRE_SUELO, c + 12, 'E');
  },

  // Balcones: se sube, se cruza por arriba y se baja al otro lado.
  balcones(m, c) {
    plataformaMedia(m, c + 1, 3);
    plataformaAlta(m, c + 5, 4);
    premios(m, SOBRE_ALTO, c + 6, 3);
    plataformaMedia(m, c + 10, 3);
    premios(m, SOBRE_MEDIO, c + 10, 3);
    premios(m, SOBRE_SUELO, c + 6, 3);
  },

  // Tramo de bichos, para lucir la katana o los bloques.
  bichos(m, c) {
    poner(m, SOBRE_SUELO, c + 2, 'E');
    poner(m, SOBRE_SUELO, c + 6, 'E');
    poner(m, SOBRE_SUELO, c + 10, 'E');
    plataformaMedia(m, c + 4, 5);
    premios(m, SOBRE_MEDIO, c + 5, 4);
    premios(m, SOBRE_SUELO, c + 12, 2);
  },

  // Un llano tranquilo, para respirar entre dos apreturas.
  llano(m, c) {
    premios(m, SOBRE_SUELO, c + 2, 3);
    plataformaMedia(m, c + 6, 4);
    premios(m, SOBRE_MEDIO, c + 7, 3);
    premios(m, SOBRE_SUELO, c + 11, 2);
  },
};

// --- el tablero, por tramos --------------------------------------------------

const MAX_COLUMNAS = 260; // lienzo de sobra: al cerrar se recorta a lo usado

// LA ARENA DEL JEFE ES UNA PANTALLA ENTERA. La pantalla mide 640 px = 20
// casillas, y la arena son las 20 ultimas columnas del tablero. Como no queda
// tablero por detras, la camara ya no puede seguir avanzando: al entrar, la
// pelea se ve de un vistazo y completa, como el escenario de un teatro, y ni el
// jefe ni el nino se salen nunca de cuadro.
//
// Delante va un porche corto con el ultimo checkpoint, para que se entre a la
// arena descansado y reaparecer no cueste el camino de vuelta.
const ARENA = 20;
const PORCHE = 4;

function nuevoTablero() {
  return { m: crearLienzo(MAX_COLUMNAS), tramos: [], cursor: 0 };
}

// Abre un tramo de suelo seguido y le pinta su motivo encima. Devuelve la
// primera columna, para poder clavar ahi un checkpoint.
function tramo(t, largo, motivo) {
  const desde = t.cursor;
  t.tramos.push([desde, desde + largo - 1]);
  t.cursor = desde + largo;
  if (motivo) MOTIVOS[motivo](t.m, desde);
  return desde;
}

// Un hueco en el suelo, con su arco de premios por encima. Nunca de mas de dos
// casillas: con tres el salto llega por los pelos y se falla casi siempre.
function hueco(t, largo = 2) {
  arco(t.m, t.cursor - 1, largo + 1, SOBRE_SUELO);
  t.cursor += largo;
}

function checkpoint(t, col) {
  poner(t.m, SOBRE_SUELO, col, 'K');
}

// La arena del jefe, al final de todo: suelo seguido sin un solo hueco, el jefe
// plantado en el centro y la meta al fondo.
function arenaDelJefe(t) {
  const porche = tramo(t, PORCHE + ARENA);
  const a = porche + PORCHE; // primera columna de la pantalla del jefe

  checkpoint(t, porche + 1);
  // La plataforma para dejarse caer sobre el: mide el doble que un nino y desde
  // el suelo el salto no llega a su coronilla.
  plataformaMedia(t.m, a + 6, 3);
  poner(t.m, SOBRE_SUELO, a + 13, 'J');
  poner(t.m, SOBRE_SUELO, a + 18, 'M');
}

// Cierra el tablero: pinta el suelo de todos los tramos y recorta el lienzo a lo
// que se haya usado.
//
// Antes levantaba ademas una PARED de seis casillas en la ultima columna, para
// que el jefe no se escapara por la derecha. Ya no hace falta —el jefe se
// sujeta a los bordes de su arena, que se sacan del suelo— y ademas hacia de
// presa: las palomas que cruzan a la altura del segundo piso y las vacas que
// vienen corriendo chocaban con ella, se quedaban clavadas y se iban
// amontonando detras de la puerta, que es el unico sitio del tablero del que no
// se puede salir.
function cerrarTablero(t) {
  const columnas = t.cursor;
  t.tramos.forEach(([desde, hasta]) => suelo(t.m, desde, hasta));
  return t.m.map((fila) => fila.slice(0, columnas));
}

// --- los cinco tableros -----------------------------------------------------

const NIVELES = [];

// --------------------------------------------------------------- 1. Space Coast
{
  const t = nuevoTablero();

  tramo(t, 16, 'inicio');
  hueco(t);
  tramo(t, 14, 'escalera');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'llano') + 1);
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  tramo(t, 14, 'repisa');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'balcones') + 1);
  hueco(t);
  arenaDelJefe(t);

  NIVELES.push({
    archivo: 'nivel1.js',
    constante: 'NIVEL_1',
    nombre: 'Space Coast',
    fondo: 'space-coast',
    mapa: cerrarTablero(t),
    pistas: [
      { col: 4, fila: 7, texto: 'Flechas para moverte' },
      { col: 10, fila: 4, texto: 'Espacio: saltar' },
      { col: 25, fila: 1, texto: 'Tres alturas' },
      { col: 53, fila: 7, texto: 'X: atacar' },
      { col: 72, fila: 1, texto: 'Premio gordo' },
      { col: 106, fila: 5, texto: '¡El jefe!' },
    ],
  });
}

// ------------------------------------------------------------------ 2. Medellin
{
  const t = nuevoTablero();

  tramo(t, 16, 'inicio');
  hueco(t);
  tramo(t, 14, 'escalera');
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'balcones') + 1);
  hueco(t);
  tramo(t, 14, 'llano');
  hueco(t);
  tramo(t, 14, 'bichos');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'repisa') + 1);
  hueco(t);
  arenaDelJefe(t);

  NIVELES.push({
    archivo: 'nivel2.js',
    constante: 'NIVEL_2',
    nombre: 'Medellín',
    fondo: 'medellin',
    mapa: cerrarTablero(t),
    pistas: [
      { col: 19, fila: 1, texto: 'Sube por la ladera' },
      { col: 82, fila: 7, texto: 'Aquí hay muchos bichos' },
      { col: 104, fila: 1, texto: 'Premio gordo' },
      { col: 122, fila: 5, texto: '¡El jefe de Medellín!' },
    ],
  });
}

// ------------------------------------------------------------------- 3. Atlanta
{
  const t = nuevoTablero();

  tramo(t, 16, 'inicio');
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  tramo(t, 14, 'escalera');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'bichos') + 1);
  hueco(t);
  tramo(t, 14, 'balcones');
  hueco(t);
  tramo(t, 14, 'llano');
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'repisa') + 1);
  hueco(t);
  arenaDelJefe(t);

  NIVELES.push({
    archivo: 'nivel3.js',
    constante: 'NIVEL_3',
    nombre: 'Atlanta',
    fondo: 'atlanta',
    mapa: cerrarTablero(t),
    pistas: [
      { col: 40, fila: 1, texto: 'Hasta arriba' },
      { col: 52, fila: 7, texto: 'Aquí hay muchos bichos' },
      { col: 120, fila: 1, texto: 'Premio gordo' },
      { col: 138, fila: 5, texto: '¡El jefe de Atlanta!' },
    ],
  });
}

// --------------------------------------------------------------------- 4. Miami
{
  const t = nuevoTablero();

  tramo(t, 16, 'inicio');
  hueco(t);
  tramo(t, 14, 'balcones');
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'escalera') + 1);
  hueco(t);
  tramo(t, 14, 'bichos');
  hueco(t);
  tramo(t, 14, 'llano');
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  tramo(t, 14, 'escalera');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'repisa') + 1);
  hueco(t);
  arenaDelJefe(t);

  NIVELES.push({
    archivo: 'nivel4.js',
    constante: 'NIVEL_4',
    nombre: 'Miami',
    fondo: 'miami',
    mapa: cerrarTablero(t),
    pistas: [
      { col: 4, fila: 7, texto: 'Cuidado con los huecos' },
      { col: 68, fila: 7, texto: 'Aquí hay muchos bichos' },
      { col: 136, fila: 1, texto: 'Premio gordo' },
      { col: 154, fila: 5, texto: '¡El jefe de Miami!' },
    ],
  });
}

// ----------------------------------------------------------------- 5. Cartagena
{
  const t = nuevoTablero();

  tramo(t, 16, 'inicio');
  hueco(t);
  tramo(t, 14, 'escalera');
  hueco(t);
  tramo(t, 14, 'bichos');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'balcones') + 1);
  hueco(t);
  tramo(t, 14, 'patio');
  hueco(t);
  tramo(t, 14, 'escalera');
  hueco(t);
  tramo(t, 14, 'bichos');
  hueco(t);
  tramo(t, 14, 'llano');
  hueco(t);
  tramo(t, 14, 'balcones');
  hueco(t);
  checkpoint(t, tramo(t, 14, 'repisa') + 1);
  hueco(t);
  arenaDelJefe(t);

  NIVELES.push({
    archivo: 'nivel5.js',
    constante: 'NIVEL_5',
    nombre: 'Cartagena',
    fondo: 'cartagena',
    mapa: cerrarTablero(t),
    pistas: [
      { col: 19, fila: 1, texto: 'Hacia las murallas' },
      { col: 36, fila: 7, texto: 'Aquí hay muchos bichos' },
      { col: 152, fila: 1, texto: 'El premio gordo' },
      { col: 170, fila: 5, texto: '¡El jefe final!' },
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
