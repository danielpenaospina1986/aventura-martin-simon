// ---------------------------------------------------------------------------
// COMPLETAR LA FUENTE
//
// La tipografia del juego (Chailce Noggin) viene con 81 glifos: letras,
// numeros y cuatro signos. No trae ni acentos, ni ene, ni los signos de
// apertura. Como TODO el juego esta en espanol, sin esos caracteres el texto
// saldria mezclando dos tipografias, que canta muchisimo.
//
// Esta herramienta genera una version completa:
//   - compone a e i o u con acento (y sus mayusculas) dibujando el acento
//     encima de la letra, centrado sobre ella;
//   - compone la ene con una tilde ondulada;
//   - crea los signos de apertura girando 180 grados los de cierre;
//   - a la i le quita su punto antes de ponerle el acento, como se hace en
//     tipografia de verdad.
//
//   node herramientas/completar-fuente.mjs <origen.ttf>
//
// El resultado se guarda en src/assets/fuente-juego.ttf, que es la que carga
// el juego. El TTF de partida no se versiona.
// ---------------------------------------------------------------------------

import opentype from 'opentype.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ORIGEN = process.argv[2] || 'src/assets/fuentes/origen.ttf';
const DESTINO = 'src/assets/fuente-juego.ttf';

if (!existsSync(ORIGEN)) {
  console.error(`No encuentro ${ORIGEN}`);
  process.exit(1);
}

const datos = readFileSync(ORIGEN);
const fuente = opentype.parse(datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength));

// --- piezas de los acentos, dibujadas a mano -------------------------------
// Coordenadas en unidades de la fuente (1000 por eme). El (0,0) de cada pieza
// es su centro abajo; luego se coloca centrada sobre la letra.

function acentoAgudo() {
  const p = new opentype.Path();
  p.moveTo(-105, 0);
  p.lineTo(5, 0);
  p.lineTo(115, 185);
  p.lineTo(5, 185);
  p.closePath();
  return p;
}

function acentoTilde() {
  const p = new opentype.Path();
  p.moveTo(-160, 30);
  p.quadraticCurveTo(-80, 125, 0, 55);
  p.quadraticCurveTo(80, -10, 160, 80);
  p.lineTo(160, 15);
  p.quadraticCurveTo(80, -75, 0, -10);
  p.quadraticCurveTo(-80, 60, -160, -35);
  p.closePath();
  return p;
}

// --- utilidades sobre contornos --------------------------------------------

// Separa un path en sus contornos (cada uno empieza con un moveTo).
function contornos(path) {
  const lista = [];
  let actual = null;
  path.commands.forEach((c) => {
    if (c.type === 'M') {
      actual = [];
      lista.push(actual);
    }
    if (actual) actual.push(c);
  });
  return lista;
}

function limitesDe(comandos) {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  comandos.forEach((c) => {
    [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']].forEach(([cx, cy]) => {
      if (c[cx] === undefined) return;
      x1 = Math.min(x1, c[cx]);
      x2 = Math.max(x2, c[cx]);
      y1 = Math.min(y1, c[cy]);
      y2 = Math.max(y2, c[cy]);
    });
  });
  return { x1, y1, x2, y2 };
}

// La i lleva punto. Para ponerle acento hay que quitarselo antes: se descarta
// el contorno que flota separado por encima del resto.
function sinPuntoSuperior(path) {
  const trozos = contornos(path);
  if (trozos.length < 2) return path;

  const conLimites = trozos.map((c) => ({ comandos: c, limites: limitesDe(c) }));
  const masAlto = conLimites.reduce((a, b) => (b.limites.y1 > a.limites.y1 ? b : a));
  const resto = conLimites.filter((c) => c !== masAlto);
  const techoDelResto = Math.max(...resto.map((c) => c.limites.y2));

  // solo se quita si de verdad esta separado del cuerpo de la letra
  if (masAlto.limites.y1 <= techoDelResto) return path;

  const nuevo = new opentype.Path();
  resto.forEach((c) => nuevo.commands.push(...c.comandos));
  return nuevo;
}

function copiarComandos(destino, comandos, dx = 0, dy = 0) {
  comandos.forEach((c) => {
    const nuevo = { type: c.type };
    ['x', 'y', 'x1', 'y1', 'x2', 'y2'].forEach((k) => {
      if (c[k] === undefined) return;
      nuevo[k] = k.startsWith('x') ? c[k] + dx : c[k] + dy;
    });
    destino.commands.push(nuevo);
  });
}

function girar180(comandos, centroX, centroY, bajar) {
  return comandos.map((c) => {
    const nuevo = { type: c.type };
    ['', '1', '2'].forEach((sufijo) => {
      const cx = `x${sufijo}`;
      const cy = `y${sufijo}`;
      if (c[cx] === undefined) return;
      nuevo[cx] = 2 * centroX - c[cx];
      nuevo[cy] = 2 * centroY - c[cy] - bajar;
    });
    return nuevo;
  });
}

// --- composicion ------------------------------------------------------------

const glifos = [];
for (let i = 0; i < fuente.glyphs.length; i += 1) glifos.push(fuente.glyphs.get(i));

const AIRE = 40; // separacion entre la letra y el acento

function componer(caracter, base, tipoAcento, nombre) {
  const glifoBase = fuente.charToGlyph(base);
  if (!glifoBase || glifoBase.index === 0) {
    console.warn(`  (falta la letra base "${base}", me salto ${caracter})`);
    return;
  }

  let pathBase = glifoBase.path;
  if (base === 'i') pathBase = sinPuntoSuperior(pathBase);

  const limites = limitesDe(pathBase.commands);
  const centroX = (limites.x1 + limites.x2) / 2;
  const alturaAcento = limites.y2 + AIRE;

  const path = new opentype.Path();
  copiarComandos(path, pathBase.commands);

  const acento = tipoAcento === 'tilde' ? acentoTilde() : acentoAgudo();
  copiarComandos(path, acento.commands, centroX, alturaAcento);

  glifos.push(
    new opentype.Glyph({
      name: nombre,
      unicode: caracter.codePointAt(0),
      advanceWidth: glifoBase.advanceWidth,
      path,
    }),
  );
}

function invertir(caracter, base, nombre) {
  const glifoBase = fuente.charToGlyph(base);
  if (!glifoBase || glifoBase.index === 0) return;

  const limites = limitesDe(glifoBase.path.commands);
  const centroX = (limites.x1 + limites.x2) / 2;
  const centroY = (limites.y1 + limites.y2) / 2;

  const path = new opentype.Path();
  path.commands = girar180(glifoBase.path.commands, centroX, centroY, 190);

  glifos.push(
    new opentype.Glyph({
      name: nombre,
      unicode: caracter.codePointAt(0),
      advanceWidth: glifoBase.advanceWidth,
      path,
    }),
  );
}

// --- signos que la fuente no trae y el juego si usa ------------------------
// Flechas de los controles, triangulos del menu, parentesis y punto medio.
// Se dibujan con el mismo aire grueso y recto que el resto de la tipografia.

function nuevoGlifo(nombre, caracter, ancho, pintar) {
  const path = new opentype.Path();
  pintar(path);
  glifos.push(
    new opentype.Glyph({ name: nombre, unicode: caracter.codePointAt(0), advanceWidth: ancho, path }),
  );
}

function flechaDerecha(p, dx = 0, dy = 0) {
  p.moveTo(60 + dx, 215 + dy);
  p.lineTo(400 + dx, 215 + dy);
  p.lineTo(400 + dx, 110 + dy);
  p.lineTo(620 + dx, 285 + dy);
  p.lineTo(400 + dx, 460 + dy);
  p.lineTo(400 + dx, 355 + dy);
  p.lineTo(60 + dx, 355 + dy);
  p.closePath();
}

function dibujarFlechas() {
  nuevoGlifo('arrowright', '→', 700, (p) => flechaDerecha(p));

  nuevoGlifo('arrowleft', '←', 700, (p) => {
    p.moveTo(620, 215);
    p.lineTo(280, 215);
    p.lineTo(280, 110);
    p.lineTo(60, 285);
    p.lineTo(280, 460);
    p.lineTo(280, 355);
    p.lineTo(620, 355);
    p.closePath();
  });

  nuevoGlifo('arrowup', '↑', 620, (p) => {
    p.moveTo(255, 60);
    p.lineTo(365, 60);
    p.lineTo(365, 430);
    p.lineTo(470, 430);
    p.lineTo(310, 650);
    p.lineTo(150, 430);
    p.lineTo(255, 430);
    p.closePath();
  });

  nuevoGlifo('arrowdown', '↓', 620, (p) => {
    p.moveTo(255, 650);
    p.lineTo(365, 650);
    p.lineTo(365, 280);
    p.lineTo(470, 280);
    p.lineTo(310, 60);
    p.lineTo(150, 280);
    p.lineTo(255, 280);
    p.closePath();
  });

  nuevoGlifo('triagrt', '▶', 560, (p) => {
    p.moveTo(120, 70);
    p.lineTo(500, 330);
    p.lineTo(120, 590);
    p.closePath();
  });

  nuevoGlifo('triaglf', '◀', 560, (p) => {
    p.moveTo(500, 70);
    p.lineTo(120, 330);
    p.lineTo(500, 590);
    p.closePath();
  });

  nuevoGlifo('parenleft', '(', 360, (p) => {
    p.moveTo(330, 760);
    p.quadraticCurveTo(70, 290, 330, -180);
    p.lineTo(250, -180);
    p.quadraticCurveTo(-10, 290, 250, 760);
    p.closePath();
  });

  nuevoGlifo('parenright', ')', 360, (p) => {
    p.moveTo(30, 760);
    p.quadraticCurveTo(290, 290, 30, -180);
    p.lineTo(110, -180);
    p.quadraticCurveTo(370, 290, 110, 760);
    p.closePath();
  });

  nuevoGlifo('periodcentered', '·', 300, (p) => {
    p.moveTo(90, 250);
    p.lineTo(210, 250);
    p.lineTo(210, 370);
    p.lineTo(90, 370);
    p.closePath();
  });
}

const ACENTUADAS = [
  ['á', 'a', 'agudo', 'aacute'],
  ['é', 'e', 'agudo', 'eacute'],
  ['í', 'i', 'agudo', 'iacute'],
  ['ó', 'o', 'agudo', 'oacute'],
  ['ú', 'u', 'agudo', 'uacute'],
  ['ü', 'u', 'agudo', 'udieresis'],
  ['ñ', 'n', 'tilde', 'ntilde'],
  ['Á', 'A', 'agudo', 'Aacute'],
  ['É', 'E', 'agudo', 'Eacute'],
  ['Í', 'I', 'agudo', 'Iacute'],
  ['Ó', 'O', 'agudo', 'Oacute'],
  ['Ú', 'U', 'agudo', 'Uacute'],
  ['Ñ', 'N', 'tilde', 'Ntilde'],
];

ACENTUADAS.forEach(([caracter, base, tipo, nombre]) => componer(caracter, base, tipo, nombre));
invertir('¡', '!', 'exclamdown');
invertir('¿', '?', 'questiondown');
dibujarFlechas();

const nueva = new opentype.Font({
  familyName: 'Chailce Noggin ES',
  styleName: 'Regular',
  unitsPerEm: fuente.unitsPerEm,
  ascender: fuente.ascender,
  descender: fuente.descender,
  glyphs: glifos,
});

const salida = Buffer.from(nueva.toArrayBuffer());
writeFileSync(DESTINO, salida);

console.log(`  Glifos: ${fuente.glyphs.length} -> ${glifos.length}`);
console.log(`  Escrito: ${DESTINO} (${(salida.length / 1024).toFixed(0)} KB)`);
