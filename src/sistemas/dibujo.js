// ---------------------------------------------------------------------------
// DIBUJO
// Fabrica de graficos provisionales: genera todas las texturas del juego a
// base de rectangulos. Es el UNICO archivo que sabe como se ve cada cosa.
//
// Para pasar a pixel art mas adelante: reemplazar este archivo por uno que
// haga escena.load.image(TEXTURAS.suelo, "assets/suelo.png"), etc. Las claves
// de TEXTURAS no cambian, asi que el resto del juego sigue igual.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { COLORES, FONDO, PLANOS, TEXTURAS, TINTA } from '../config/estilo.js';
import { CIUDADES, ciudadDe } from '../config/ciudades.js';
import { PERSONAJES } from '../config/personajes.js';
import { ENEMIGO, JEFE, MUNDO, RENDER } from '../config/ajustes.js';

// Las texturas se dibujan a la densidad del render, no al tamano del juego: si
// una moneda de 18 px se generase con 18 pixeles y luego la camara la ampliase,
// se veria dentada. El codigo de dibujo no se entera: se le escala el pincel y
// sigue pensando en las medidas de siempre.
//
// A cambio, cualquier objeto que use una de estas texturas mide D veces mas de
// la cuenta. Los que llaman a setDisplaySize ya se apanan solos; para los demas
// estan aEscalaDeJuego() y mosaico().
function generar(escena, clave, ancho, alto, pintar) {
  if (escena.textures.exists(clave)) return;
  const d = RENDER.densidad;
  const g = escena.add.graphics({ x: 0, y: 0 }).setVisible(false);
  pintar(g);
  g.setScale(d);
  g.generateTexture(clave, Math.ceil(ancho * d), Math.ceil(alto * d));
  g.destroy();
}

// La escala "natural" de cualquier objeto que use una textura generada: no es
// 1, porque la textura se dibuja a la densidad del render. Todo lo que anime la
// escala tiene que ir en proporcion a esta, o el objeto acabara del tamano de
// su textura, que es D veces mayor.
export function escalaDeJuego() {
  return 1 / RENDER.densidad;
}

// Devuelve a su tamano de juego un objeto que use una textura generada.
export function aEscalaDeJuego(objeto) {
  return objeto.setScale(escalaDeJuego());
}

// Un tramo de terreno: la textura se repite al tamano del juego, no al de la
// textura, que es D veces mayor.
export function mosaico(escena, x, y, ancho, alto, clave) {
  const t = escena.add.tileSprite(x, y, ancho, alto, clave).setOrigin(0, 0);
  t.setTileScale(1 / RENDER.densidad);
  return t;
}

function caja(g, x, y, ancho, alto, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, ancho, alto);
}

// --- pinceles del estilo de los anos 30 -------------------------------------
// Todo lleva contorno de tinta negra y formas redondeadas: es lo que separa un
// dibujo animado antiguo de un juego de pixeles.

function tintaRedonda(g, x, y, ancho, alto, radio, relleno, grosor = 3) {
  g.fillStyle(relleno, 1);
  g.fillRoundedRect(x, y, ancho, alto, radio);
  g.lineStyle(grosor, TINTA, 1);
  g.strokeRoundedRect(x, y, ancho, alto, radio);
}

function tintaCirculo(g, x, y, radio, relleno, grosor = 3) {
  g.fillStyle(relleno, 1);
  g.fillCircle(x, y, radio);
  g.lineStyle(grosor, TINTA, 1);
  g.strokeCircle(x, y, radio);
}

// Brillo tipo celuloide: una manchita clara arriba a la izquierda.
function brillo(g, x, y, radio) {
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(x, y, radio);
}

// --- personajes -------------------------------------------------------------

function generarPersonaje(escena, datos) {
  generar(escena, datos.textura, datos.ancho, datos.alto, (g) => {
    const { ancho, alto, color, colorPelo } = datos;

    const radioCabeza = ancho * 0.42;
    const centroCabeza = radioCabeza + 3;
    const cuelloY = centroCabeza + radioCabeza - 2;
    const altoCuerpo = alto - cuelloY - 5;

    // piernas, un poco separadas
    const anchoPierna = ancho * 0.26;
    tintaRedonda(g, ancho * 0.16, alto - 11, anchoPierna, 10, 4, COLORES.tinta, 2);
    tintaRedonda(g, ancho * 0.58, alto - 11, anchoPierna, 10, 4, COLORES.tinta, 2);
    // zapatones, que son la marca de la epoca
    tintaRedonda(g, ancho * 0.06, alto - 7, anchoPierna + 5, 7, 3, COLORES.crema, 2);
    tintaRedonda(g, ancho * 0.52, alto - 7, anchoPierna + 5, 7, 3, COLORES.crema, 2);

    // cuerpo redondeado
    tintaRedonda(g, 1, cuelloY - 4, ancho - 2, altoCuerpo, ancho * 0.3, color);
    // peto mas claro, para que no sea una mancha plana
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(4, cuelloY - 1, ancho - 8, altoCuerpo * 0.5, 5);

    // brazo asomando por delante
    tintaRedonda(g, ancho - 6, cuelloY + 2, 6, altoCuerpo * 0.55, 3, color, 2);

    // cabeza
    tintaCirculo(g, ancho / 2, centroCabeza, radioCabeza, COLORES.crema);
    // pelo, como un casquete
    g.fillStyle(colorPelo, 1);
    g.slice(
      ancho / 2,
      centroCabeza,
      radioCabeza,
      Phaser.Math.DegToRad(180),
      Phaser.Math.DegToRad(360),
      false,
    );
    g.fillPath();
    g.lineStyle(3, TINTA, 1);
    g.strokeCircle(ancho / 2, centroCabeza, radioCabeza);

    // ojos grandes de dibujo antiguo (mira a la derecha)
    const ojoY = centroCabeza + 1;
    tintaCirculo(g, ancho / 2 + radioCabeza * 0.12, ojoY, radioCabeza * 0.34, 0xffffff, 2);
    tintaCirculo(g, ancho / 2 + radioCabeza * 0.62, ojoY, radioCabeza * 0.3, 0xffffff, 2);
    g.fillStyle(TINTA, 1);
    g.fillCircle(ancho / 2 + radioCabeza * 0.22, ojoY + 1, radioCabeza * 0.16);
    g.fillCircle(ancho / 2 + radioCabeza * 0.68, ojoY + 1, radioCabeza * 0.14);

    // sonrisa
    g.lineStyle(2, TINTA, 1);
    g.beginPath();
    g.arc(
      ancho / 2 + radioCabeza * 0.35,
      centroCabeza + radioCabeza * 0.35,
      radioCabeza * 0.4,
      Phaser.Math.DegToRad(20),
      Phaser.Math.DegToRad(130),
      false,
    );
    g.strokePath();

    brillo(g, ancho / 2 - radioCabeza * 0.45, centroCabeza - radioCabeza * 0.4, radioCabeza * 0.18);
  });
}

// --- escenario y objetos ----------------------------------------------------

// ---------------------------------------------------------------------------
// EL PAVIMENTO DE CADA CIUDAD (plano medio)
//
// Cada patron se pinta dentro de una casilla que luego se repite en mosaico,
// asi que todo tiene que casar consigo mismo por los cuatro lados: las juntas
// que llegan a un borde continuan en el de enfrente, y nada de marcos, que
// convierten el suelo en una cuadricula.
// ---------------------------------------------------------------------------

// arena de playa: ondas suaves y guijarros
function patronArena(g, c, p) {
  caja(g, 0, 0, c, c, p.medio);
  g.fillStyle(p.claro, 0.55);
  g.fillEllipse(8, 7, 18, 7);
  g.fillEllipse(26, 18, 16, 6);
  g.fillEllipse(14, 27, 20, 7);
  g.fillStyle(p.oscuro, 0.6);
  [[6, 14, 2], [20, 9, 1.6], [28, 26, 2.2], [13, 21, 1.4]].forEach(([x, y, r]) =>
    g.fillCircle(x, y, r),
  );
}

// adoquin: dos hiladas por casilla, trabadas entre si
function patronAdoquin(g, c, p) {
  caja(g, 0, 0, c, c, p.medio);
  const junta = (x, y, ancho, alto) => {
    g.fillStyle(p.claro, 1);
    g.fillRect(x + 1, y + 1, ancho - 2, alto - 2);
    g.fillStyle(p.oscuro, 0.55);
    g.fillRect(x + 1, y + alto - 3, ancho - 2, 2);
  };
  // hilada de arriba: juntas en 0 y 16
  junta(0, 0, 16, 16);
  junta(16, 0, 16, 16);
  // hilada de abajo: media pieza de desfase, para que trabe
  junta(-8, 16, 16, 16);
  junta(8, 16, 16, 16);
  junta(24, 16, 16, 16);
}

// baldosa grande de acera, con la junta clara
function patronBaldosa(g, c, p) {
  caja(g, 0, 0, c, c, p.claro);
  g.fillStyle(p.medio, 1);
  g.fillRect(1.5, 1.5, c - 3, c - 3);
  g.fillStyle(p.claro, 0.75);
  g.fillRect(1.5, 1.5, c - 3, 2);
  g.fillStyle(p.oscuro, 0.4);
  g.fillRect(1.5, c - 4, c - 3, 2);
}

// asfalto: liso, con grietas y el trazo de la linea pintada
function patronAsfalto(g, c, p) {
  caja(g, 0, 0, c, c, p.medio);
  g.fillStyle(p.oscuro, 0.5);
  [[5, 6, 2.2], [24, 12, 1.8], [12, 24, 2], [29, 27, 1.6]].forEach(([x, y, r]) =>
    g.fillCircle(x, y, r),
  );
  g.lineStyle(1.2, p.oscuro, 0.55);
  g.beginPath();
  g.moveTo(0, 22);
  g.lineTo(11, 19);
  g.lineTo(22, 23);
  g.lineTo(c, 20);
  g.strokePath();
  if (p.linea) {
    g.fillStyle(p.linea, 0.9);
    g.fillRect(6, 13, 20, 3);
  }
}

// piedra colonial: losas irregulares
function patronPiedra(g, c, p) {
  caja(g, 0, 0, c, c, p.oscuro);
  const losa = (puntos, color) => {
    g.fillStyle(color, 1);
    g.fillPoints(puntos.map(([x, y]) => ({ x, y })), true);
  };
  losa([[1, 1], [15, 2], [17, 13], [2, 15]], p.claro);
  losa([[17, 2], [31, 1], [30, 14], [19, 13]], p.medio);
  losa([[2, 17], [13, 16], [15, 30], [1, 31]], p.medio);
  losa([[15, 16], [30, 17], [31, 31], [17, 30]], p.claro);
  g.fillStyle(p.oscuro, 0.4);
  g.fillCircle(9, 9, 1.8);
  g.fillCircle(24, 23, 1.6);
}

// capas de tierra apiladas, para el subsuelo
function patronEstratos(g, c, p) {
  caja(g, 0, 0, c, c, p.medio);
  g.fillStyle(p.claro, 0.45);
  g.fillRect(0, 6, c, 3);
  g.fillRect(0, 21, c, 2);
  g.fillStyle(p.oscuro, 0.5);
  [[9, 12, 2.6], [23, 17, 2.2], [15, 28, 2], [28, 4, 1.8]].forEach(([x, y, r]) =>
    g.fillCircle(x, y, r),
  );
}

const PATRONES = {
  arena: patronArena,
  adoquin: patronAdoquin,
  baldosa: patronBaldosa,
  asfalto: patronAsfalto,
  piedra: patronPiedra,
  estratos: patronEstratos,
};

// Genera el pavimento, el subsuelo y la cornisa de una ciudad.
export function generarSuelosDeCiudad(escena, nombre) {
  const c = MUNDO.casilla;
  const ciudad = ciudadDe(nombre);

  // el que se ve: lleva la linea de tinta arriba, que es el canto de la calle
  generar(escena, TEXTURAS.sueloDe(nombre), c, c, (g) => {
    (PATRONES[ciudad.pavimento.patron] || patronArena)(g, c, ciudad.pavimento);
    // Solo una linea arriba: es el canto por donde se camina. Un marco entero
    // convertiria el terreno en una cuadricula.
    g.lineStyle(2.5, TINTA, 0.9);
    g.beginPath();
    g.moveTo(0, 1.2);
    g.lineTo(c, 1.2);
    g.strokePath();
  });

  // lo de debajo: sin canto, que va tapado
  generar(escena, TEXTURAS.tierraDe(nombre), c, c, (g) => {
    (PATRONES[ciudad.subsuelo.patron] || patronEstratos)(g, c, ciudad.subsuelo);
  });

  // cornisa: la plataforma por la que se anda, con el color de la ciudad
  generar(escena, TEXTURAS.plataformaDe(nombre), c, 12, (g) => {
    tintaRedonda(g, 0.5, 0.5, c - 1, 11, 4, ciudad.cornisa.cuerpo, 2);
    g.lineStyle(1.5, ciudad.cornisa.borde, 0.85);
    g.beginPath();
    g.moveTo(3, 7.5);
    g.lineTo(c - 3, 7.5);
    g.strokePath();
  });
}

export function generarTexturas(escena) {
  const c = MUNDO.casilla;

  // el pavimento de las cinco ciudades
  Object.keys(CIUDADES).forEach((nombre) => generarSuelosDeCiudad(escena, nombre));

  // suelo: tierra con una mata de hierba arriba, con contorno de tinta
  generar(escena, TEXTURAS.suelo, c, c, (g) => {
    caja(g, 0, 0, c, c, COLORES.tierra);
    // hierba ondulada
    g.fillStyle(COLORES.hierba, 1);
    g.fillRect(0, 0, c, 9);
    g.fillCircle(8, 9, 4.5);
    g.fillCircle(24, 9, 4);
    g.fillStyle(COLORES.hierbaOscura, 1);
    g.fillRect(0, 8, c, 2.5);
    // motas de tierra
    g.fillStyle(COLORES.tierraOscura, 0.5);
    g.fillCircle(8, 20, 2.5);
    g.fillCircle(23, 26, 2);
    // solo una linea arriba: el suelo se dibuja repitiendo esta casilla, y un
    // marco completo convertiria el terreno en una cuadricula
    g.lineStyle(2.5, TINTA, 0.9);
    g.beginPath();
    g.moveTo(0, 1.2);
    g.lineTo(c, 1.2);
    g.strokePath();
  });

  // tierra: las capas de debajo, sin hierba
  generar(escena, TEXTURAS.tierra, c, c, (g) => {
    caja(g, 0, 0, c, c, COLORES.tierra);
    g.fillStyle(COLORES.tierraOscura, 0.45);
    g.fillCircle(9, 11, 3);
    g.fillCircle(22, 21, 2.6);
    g.fillCircle(15, 28, 2);
    g.fillCircle(27, 8, 2.2);
  });

  // plataforma: un tablon de madera vieja
  generar(escena, TEXTURAS.plataforma, c, 12, (g) => {
    tintaRedonda(g, 0.5, 0.5, c - 1, 11, 4, COLORES.plataforma, 2);
    g.lineStyle(1.5, COLORES.plataformaBorde, 0.85);
    g.beginPath();
    g.moveTo(4, 7);
    g.lineTo(c - 4, 7);
    g.strokePath();
  });

  // bloque construido por Simon
  generar(escena, TEXTURAS.bloque, c, c, (g) => {
    caja(g, 0, 0, c, c, COLORES.bloque);
    caja(g, 0, 0, c, 4, 0xffffff, 0.3);
    caja(g, 0, c - 4, c, 4, COLORES.bloqueBorde);
    caja(g, 2, 14, c - 4, 3, COLORES.bloqueBorde);
    g.lineStyle(2, COLORES.bloqueBorde, 0.9);
    g.strokeRect(1, 1, c - 2, c - 2);
  });

  // moneda
  generar(escena, TEXTURAS.moneda, 18, 18, (g) => {
    g.fillStyle(COLORES.monedaBorde, 1);
    g.fillCircle(9, 9, 9);
    g.fillStyle(COLORES.moneda, 1);
    g.fillCircle(9, 9, 7);
    caja(g, 7, 4, 4, 10, COLORES.monedaBorde, 0.55);
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(6, 6, 2);
  });

  // El premio de Martin: un rollo de sushi visto desde arriba.
  generar(escena, TEXTURAS.monedaMartin, 22, 22, (g) => {
    g.fillStyle(COLORES.sushiAlga, 1);
    g.fillCircle(11, 11, 11);
    g.fillStyle(COLORES.sushiArroz, 1);
    g.fillCircle(11, 11, 8.5);
    g.fillStyle(COLORES.sushiRelleno, 1);
    g.fillCircle(11, 11, 4.5);
    g.fillStyle(COLORES.sushiRellenoClaro, 1);
    g.fillCircle(9.5, 9.5, 2);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(7, 6.5, 1.6);
  });

  // El premio de Simon: un bloque de armar con seis cilindros encima.
  generar(escena, TEXTURAS.monedaSimon, 26, 22, (g) => {
    // cilindros de la fila de atras
    for (let i = 0; i < 3; i += 1) {
      const cx = 7 + i * 6.5;
      g.fillStyle(COLORES.bloqueArmarOscuro, 1);
      g.fillEllipse(cx, 5.5, 5.4, 3.4);
      g.fillStyle(COLORES.bloqueArmar, 1);
      g.fillEllipse(cx, 4.6, 5.4, 3.4);
    }
    // cilindros de la fila de delante
    for (let i = 0; i < 3; i += 1) {
      const cx = 4.5 + i * 6.5;
      g.fillStyle(COLORES.bloqueArmarOscuro, 1);
      g.fillEllipse(cx, 10, 5.8, 3.6);
      g.fillStyle(COLORES.bloqueArmarClaro, 1);
      g.fillEllipse(cx, 9, 5.8, 3.6);
    }
    // cuerpo del bloque
    caja(g, 0, 10, 26, 11, COLORES.bloqueArmar);
    caja(g, 0, 10, 26, 3, COLORES.bloqueArmarClaro);
    caja(g, 0, 18, 26, 3, COLORES.bloqueArmarOscuro);
    g.lineStyle(1.5, 0x000000, 0.4);
    g.strokeRect(0.75, 10.75, 24.5, 9.5);
  });

  // Enemigo: un bicho redondo con ojos enormes, de la altura de los ninos.
  generar(escena, TEXTURAS.enemigo, ENEMIGO.ancho, ENEMIGO.alto, (g) => {
    const a = ENEMIGO.ancho;
    const h = ENEMIGO.alto;
    const cx = a / 2;

    // piernecillas
    tintaRedonda(g, cx - 24, h - 20, 20, 20, 9, COLORES.enemigoOscuro, 3);
    tintaRedonda(g, cx + 4, h - 20, 20, 20, 9, COLORES.enemigoOscuro, 3);
    // cuerpo
    tintaCirculo(g, cx, h * 0.46, a * 0.44, COLORES.enemigo, 4);
    // ojos
    tintaCirculo(g, cx - 12, h * 0.4, 13, 0xffffff, 3);
    tintaCirculo(g, cx + 13, h * 0.4, 11, 0xffffff, 3);
    g.fillStyle(TINTA, 1);
    g.fillCircle(cx - 10, h * 0.42, 6);
    g.fillCircle(cx + 15, h * 0.42, 5);
    // cejas y boca
    g.lineStyle(4, TINTA, 1);
    g.beginPath();
    g.moveTo(cx - 24, h * 0.26);
    g.lineTo(cx - 4, h * 0.31);
    g.moveTo(cx + 26, h * 0.26);
    g.lineTo(cx + 6, h * 0.31);
    g.strokePath();
    g.beginPath();
    g.arc(cx, h * 0.58, 12, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    g.strokePath();
    brillo(g, cx - 20, h * 0.24, 5);
  });

  // El jefe: el mismo bicho pero al doble de altura que un nino.
  const jefe = (colorCuerpo) => (g) => {
    const a = JEFE.ancho;
    const h = JEFE.alto;
    const cx = a / 2;
    const radio = a * 0.4;
    const centroY = h * 0.5;

    // patas
    tintaRedonda(g, cx - 56, h - 38, 44, 38, 16, COLORES.jefeOscuro, 5);
    tintaRedonda(g, cx + 12, h - 38, 44, 38, 16, COLORES.jefeOscuro, 5);
    // cuernos
    g.fillStyle(COLORES.jefeCuerno, 1);
    g.fillTriangle(cx - 62, centroY - radio * 0.7, cx - 20, centroY - radio * 0.85, cx - 48, 6);
    g.fillTriangle(cx + 62, centroY - radio * 0.7, cx + 20, centroY - radio * 0.85, cx + 48, 6);
    g.lineStyle(5, TINTA, 1);
    g.strokeTriangle(cx - 62, centroY - radio * 0.7, cx - 20, centroY - radio * 0.85, cx - 48, 6);
    g.strokeTriangle(cx + 62, centroY - radio * 0.7, cx + 20, centroY - radio * 0.85, cx + 48, 6);
    // cuerpo
    tintaCirculo(g, cx, centroY, radio, colorCuerpo, 6);
    // cejas de enfado
    g.lineStyle(8, TINTA, 1);
    g.beginPath();
    g.moveTo(cx - 48, centroY - 40);
    g.lineTo(cx - 14, centroY - 22);
    g.moveTo(cx + 48, centroY - 40);
    g.lineTo(cx + 14, centroY - 22);
    g.strokePath();
    // ojos
    tintaCirculo(g, cx - 28, centroY - 2, 25, 0xffffff, 5);
    tintaCirculo(g, cx + 28, centroY - 2, 25, 0xffffff, 5);
    g.fillStyle(TINTA, 1);
    g.fillCircle(cx - 22, centroY + 2, 12);
    g.fillCircle(cx + 34, centroY + 2, 12);
    // boca con dientes
    g.fillStyle(COLORES.jefeOscuro, 1);
    g.fillRoundedRect(cx - 34, centroY + 34, 68, 24, 9);
    g.lineStyle(5, TINTA, 1);
    g.strokeRoundedRect(cx - 34, centroY + 34, 68, 24, 9);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 22, centroY + 34, 12, 12);
    g.fillRect(cx + 10, centroY + 34, 12, 12);
    brillo(g, cx - 42, centroY - radio * 0.6, 8);
  };
  generar(escena, TEXTURAS.jefe, JEFE.ancho, JEFE.alto, jefe(COLORES.jefe));
  generar(escena, TEXTURAS.jefeEnfadado, JEFE.ancho, JEFE.alto, jefe(0xb583cc));

  // El agua con jabon que lanza la banera: un pegote de espuma con burbujas.
  generar(escena, TEXTURAS.agua, 30, 30, (g) => {
    g.fillStyle(0xbfe6f5, 1);
    g.fillCircle(15, 16, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 12, 7);
    g.fillCircle(20, 14, 6);
    g.fillCircle(15, 21, 6);
    g.lineStyle(2.5, 0x4a8fa8, 0.9);
    g.strokeCircle(15, 16, 12);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(9, 9, 2.5);
  });

  // Lo que suelta la paloma.
  generar(escena, TEXTURAS.caida, 22, 26, (g) => {
    g.fillStyle(0xf4f1e6, 1);
    g.fillEllipse(11, 15, 16, 20);
    g.fillEllipse(11, 6, 9, 9);
    g.lineStyle(2, 0x8a8570, 0.9);
    g.strokeEllipse(11, 15, 16, 20);
  });

  // checkpoint: banderin apagado y encendido
  const banderin = (color) => (g) => {
    caja(g, 8, 0, 4, 44, COLORES.mastil);
    caja(g, 4, 40, 12, 4, COLORES.mastil);
    g.fillStyle(color, 1);
    g.fillTriangle(12, 3, 12, 21, 30, 12);
  };
  generar(escena, TEXTURAS.checkpointApagado, 32, 44, banderin(COLORES.banderaApagada));
  generar(escena, TEXTURAS.checkpointEncendido, 32, 44, banderin(COLORES.banderaEncendida));

  // meta: bandera a cuadros
  generar(escena, TEXTURAS.meta, 34, 62, (g) => {
    caja(g, 2, 0, 5, 62, COLORES.mastil);
    caja(g, 0, 58, 12, 4, COLORES.mastil);
    caja(g, 7, 2, 26, 22, COLORES.meta);
    for (let fx = 0; fx < 4; fx += 1) {
      for (let fy = 0; fy < 3; fy += 1) {
        if ((fx + fy) % 2 === 0) {
          caja(g, 7 + fx * 6.5, 2 + fy * 7.33, 6.5, 7.33, 0x16202c, 0.75);
        }
      }
    }
    g.lineStyle(1, 0x000000, 0.35);
    g.strokeRect(7.5, 2.5, 25, 21);
  });

  // estrellita de los efectos
  generar(escena, TEXTURAS.estrella, 12, 12, (g) => {
    g.fillStyle(COLORES.estrella, 1);
    g.fillTriangle(6, 0, 1, 11, 11, 11);
    g.fillTriangle(6, 12, 1, 3, 11, 3);
  });

  // arco blanco de la katana
  generar(escena, TEXTURAS.arcoKatana, 46, 46, (g) => {
    g.lineStyle(7, COLORES.katana, 0.95);
    g.beginPath();
    g.arc(6, 23, 34, Phaser.Math.DegToRad(-58), Phaser.Math.DegToRad(58), false);
    g.strokePath();
    g.lineStyle(3, COLORES.katana, 0.55);
    g.beginPath();
    g.arc(6, 23, 25, Phaser.Math.DegToRad(-46), Phaser.Math.DegToRad(46), false);
    g.strokePath();
  });

  // nube de decoracion
  // --- corazones y vidas ----------------------------------------------------
  //
  // Un corazon de los de siempre: dos lobulos y una punta, con su contorno de
  // tinta y un brillo arriba a la izquierda, como todo en el juego.
  //
  // El contorno se hace pintando el corazon dos veces, el de atras un poco mas
  // grande y en tinta. (Graphics no tiene translate, asi que cada copia lleva
  // sus propias coordenadas.)
  const formaCorazon = (g, cx, cy, ancho, alto, color) => {
    g.fillStyle(color, 1);
    g.fillCircle(cx - ancho * 0.21, cy - alto * 0.17, ancho * 0.29);
    g.fillCircle(cx + ancho * 0.21, cy - alto * 0.17, ancho * 0.29);
    g.fillTriangle(
      cx - ancho * 0.48, cy - alto * 0.08,
      cx + ancho * 0.48, cy - alto * 0.08,
      cx, cy + alto * 0.46,
    );
  };

  // El contorno es la diferencia de tamano entre las dos copias: se deja bien
  // gordo a proposito, que es lo que pide la estetica de los anos 30.
  const corazon = (relleno, conBrillo) => (g) => {
    formaCorazon(g, 13, 12, 26, 24, TINTA);
    formaCorazon(g, 13, 11.2, 19, 17, relleno);
    if (conBrillo) brillo(g, 8.5, 7.5, 2.3);
  };

  generar(escena, TEXTURAS.corazon, 26, 24, corazon(COLORES.corazon, true));
  generar(escena, TEXTURAS.corazonVacio, 26, 24, corazon(COLORES.corazonApagado, false));

  // La vida extra: el mismo corazon pero dorado y con alitas, para que no se
  // confunda con los corazones normales.
  generar(escena, TEXTURAS.vidaExtra, 40, 28, (g) => {
    g.fillStyle(TINTA, 1);
    g.fillEllipse(6, 13, 16, 11);
    g.fillEllipse(34, 13, 16, 11);
    g.fillStyle(0xfaf0d8, 1);
    g.fillEllipse(6, 12.6, 10, 6);
    g.fillEllipse(34, 12.6, 10, 6);

    formaCorazon(g, 20, 14, 24, 22, TINTA);
    formaCorazon(g, 20, 13.2, 17, 15, COLORES.vidaExtra);
    brillo(g, 16, 10, 2.1);
  });

  // --- primer plano ---------------------------------------------------------
  //
  // Van en silueta, sin detalle, por dos razones: asi se leen como algo que
  // pasa pegado a la camara, y asi no compiten con el personaje, que es lo que
  // hay que mirar. Son provisionales: cada ciudad tendra los suyos.
  //
  // El follaje se pinta como una MASA de manchas solapadas, no como hojas
  // sueltas: separadas parecian bolas colgando de un cable.
  const masa = (g, color, manchas) => {
    g.fillStyle(color, 1);
    manchas.forEach(([x, y, rx, ry]) => g.fillEllipse(x, y, rx * 2, ry * 2));
  };

  // rama frondosa que entra desde arriba
  generar(escena, TEXTURAS.frenteRama, 300, 150, (g) => {
    g.lineStyle(16, COLORES.frenteOscuro, 1);
    g.beginPath();
    g.moveTo(-4, 6);
    g.lineTo(104, 36);
    g.lineTo(210, 30);
    g.lineTo(298, 62);
    g.strokePath();
    g.lineStyle(9, COLORES.frenteOscuro, 1);
    [[96, 34, 74, 76], [168, 32, 156, 84], [238, 44, 252, 92]].forEach(([x1, y1, x2, y2]) => {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    });

    masa(g, COLORES.frenteOscuro, [
      [40, 30, 44, 26], [96, 40, 52, 32], [150, 34, 46, 28], [206, 44, 50, 30], [262, 52, 44, 28],
      [66, 72, 40, 26], [128, 84, 46, 30], [190, 78, 42, 27], [246, 88, 38, 25],
      [100, 110, 34, 22], [170, 112, 32, 21],
    ]);
    // unos toques mas claros, que la masa no quede plana
    masa(g, COLORES.frenteHoja, [
      [78, 58, 20, 13], [162, 62, 18, 12], [232, 70, 17, 11], [118, 96, 16, 10],
    ]);
  });

  // farol de calle colgado de su cable, tambien desde arriba
  generar(escena, TEXTURAS.frenteFarol, 120, 200, (g) => {
    g.lineStyle(5, COLORES.frenteOscuro, 1);
    g.beginPath();
    g.moveTo(0, 4);
    g.lineTo(60, 26);
    g.lineTo(120, 4);
    g.strokePath();

    g.lineStyle(7, COLORES.frenteOscuro, 1);
    g.beginPath();
    g.moveTo(60, 26);
    g.lineTo(60, 92);
    g.strokePath();

    // la pantalla del farol, en escalones art deco
    g.fillStyle(COLORES.frenteOscuro, 1);
    g.fillRect(36, 92, 48, 14);
    g.fillRect(28, 106, 64, 12);
    [
      [30, 118, 60, 46],
      [38, 164, 44, 16],
      [48, 180, 24, 12],
    ].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    g.fillStyle(COLORES.frenteHoja, 0.9);
    g.fillRect(38, 126, 44, 6);
    g.fillRect(38, 142, 44, 6);
  });

  // matorral que sube desde el borde de abajo
  //
  // La masa ocupa TODA la altura de la lamina a proposito: si se queda en el
  // tercio de abajo, en el juego solo asoma por la franja de tierra y parece
  // una mancha, en vez de algo que pasa por delante.
  generar(escena, TEXTURAS.frenteMata, 260, 150, (g) => {
    masa(g, COLORES.frenteOscuro, [
      [58, 38, 40, 30], [128, 24, 50, 28], [196, 42, 42, 30],
      [40, 76, 46, 36], [104, 62, 54, 40], [170, 70, 50, 38], [226, 84, 40, 32],
      [70, 112, 52, 38], [140, 106, 56, 42], [206, 118, 46, 34],
      [30, 142, 44, 32], [110, 146, 56, 36], [190, 142, 50, 34],
    ]);
    g.lineStyle(9, COLORES.frenteOscuro, 1);
    [
      [30, 150, 22, 62], [78, 150, 66, 36], [130, 150, 126, 20],
      [178, 150, 186, 40], [228, 150, 238, 66],
    ].forEach(([x1, y1, x2, y2]) => {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    });
    masa(g, COLORES.frenteHoja, [
      [96, 54, 18, 13], [166, 84, 17, 12], [128, 118, 16, 11], [54, 94, 15, 11],
    ]);
  });

  generar(escena, TEXTURAS.nube, 96, 40, (g) => {
    g.fillStyle(COLORES.nube, 0.9);
    g.fillCircle(26, 24, 16);
    g.fillCircle(48, 18, 20);
    g.fillCircle(70, 25, 14);
    g.fillRect(24, 24, 48, 14);
  });

  Object.values(PERSONAJES).forEach((datos) => generarPersonaje(escena, datos));
}

// Caja de dialogo con aire art deco: fondo oscuro, marco doble dorado y las
// esquinas escalonadas. Se usa en todos los paneles del juego para que las
// pantallas tengan el mismo lenguaje.
export function panelDeco(escena, x, y, ancho, alto, opciones = {}) {
  const { alpha = 0.92, escalon = 14 } = opciones;
  const g = escena.add.graphics();
  const x0 = x - ancho / 2;
  const y0 = y - alto / 2;

  // cuerpo con las esquinas cortadas en diagonal
  const esquinas = [
    x0 + escalon, y0,
    x0 + ancho - escalon, y0,
    x0 + ancho, y0 + escalon,
    x0 + ancho, y0 + alto - escalon,
    x0 + ancho - escalon, y0 + alto,
    x0 + escalon, y0 + alto,
    x0, y0 + alto - escalon,
    x0, y0 + escalon,
  ];
  g.fillStyle(COLORES.decoFondo, alpha);
  g.fillPoints(
    esquinas.reduce((puntos, valor, i) => {
      if (i % 2 === 0) puntos.push({ x: valor, y: esquinas[i + 1] });
      return puntos;
    }, []),
    true,
  );

  // marco doble
  const marco = (margen, grosor, color, transparencia) => {
    g.lineStyle(grosor, color, transparencia);
    g.strokeRect(x0 + margen, y0 + margen, ancho - margen * 2, alto - margen * 2);
  };
  marco(4, 3, COLORES.decoMarco, 0.95);
  marco(11, 1.5, COLORES.decoMarcoOscuro, 0.9);

  // remates en las esquinas, como los frisos de los anos 30
  g.lineStyle(3, COLORES.decoMarco, 0.95);
  const remate = 20;
  [
    [x0 + 4, y0 + 4, 1, 1],
    [x0 + ancho - 4, y0 + 4, -1, 1],
    [x0 + 4, y0 + alto - 4, 1, -1],
    [x0 + ancho - 4, y0 + alto - 4, -1, -1],
  ].forEach(([px, py, sx, sy]) => {
    g.beginPath();
    g.moveTo(px + sx * remate, py + sy * 10);
    g.lineTo(px + sx * 10, py + sy * 10);
    g.lineTo(px + sx * 10, py + sy * remate);
    g.strokePath();
  });

  return g;
}

// Fondo de los menus: la portada, ya desenfocada de antemano, a pantalla
// completa. Encima lleva un velo OSCURO y suave, no blanco: oscurecer mantiene
// los colores de la ilustracion y da contraste al texto claro, mientras que el
// velo blanco de antes la dejaba lavada.
export function pintarFondoDeMenu(escena, ancho, alto, opciones = {}) {
  const { velo = 0.34 } = opciones;
  if (!escena.textures.exists(TEXTURAS.portadaMenu)) {
    return pintarFondo(escena, ancho, alto, { veloExtra: FONDO.veloMenus });
  }

  const fuente = escena.textures.get(TEXTURAS.portadaMenu).getSourceImage();
  const escala = Math.max(ancho / fuente.width, alto / fuente.height);
  escena.add
    .image(ancho / 2, alto / 2, TEXTURAS.portadaMenu)
    .setScale(escala)
    .setDepth(-100);

  escena.add
    .rectangle(0, 0, ancho, alto, COLORES.decoFondo, velo)
    .setOrigin(0, 0)
    .setDepth(-99);

  return { ajustarParallax() {} };
}

// Fondo de todas las pantallas. Si la ilustracion esta cargada se usa esa; si
// no (por ejemplo si fallase la carga), se dibuja el cielo de siempre.
export function pintarFondo(escena, ancho, alto, opciones = {}) {
  const { veloExtra = 0, conNubes = true, textura } = opciones;
  const elegida = textura && escena.textures.exists(textura) ? textura : TEXTURAS.fondo;
  if (escena.textures.exists(elegida)) {
    return pintarFondoIlustrado(escena, ancho, alto, veloExtra, elegida);
  }
  pintarFondoDibujado(escena, ancho, alto, conNubes);
  return { ajustarParallax() {} };
}

function pintarFondoIlustrado(escena, ancho, alto, veloExtra = 0, textura = TEXTURAS.fondo) {
  const fuente = escena.textures.get(textura).getSourceImage();
  const cubrir = Math.max(ancho / fuente.width, alto / fuente.height);

  // Sin velo encima. El fondo se lee como fondo porque esta desenfocado y
  // porque se mueve despacio, no porque este lavado: el velo blanco de antes
  // se comia el color de las ciudades.
  const imagen = escena.add
    .image(ancho / 2, alto / 2, textura)
    .setScale(cubrir * FONDO.sobreancho)
    .setDepth(-100);

  // En los menus si conviene calmarlo, que llevan mucho texto encima.
  if (veloExtra > 0) {
    escena.add
      .rectangle(0, 0, ancho, alto, COLORES.decoFondo, veloExtra)
      .setOrigin(0, 0)
      .setDepth(-99);
  }

  return {
    imagen,
    // Para que el fondo se mueva de verdad hay que darle cuerda: se agranda lo
    // justo para que, yendo a la velocidad del plano, nunca se asome su borde.
    //
    // Se ancla por la IZQUIERDA y no por el centro. Centrado haria falta margen
    // a los dos lados (el doble de ampliacion) para el mismo recorrido, y
    // ampliar de mas emborrona el dibujo y recorta el cielo. Anclado, el fondo
    // empieza pegado al borde izquierdo y termina pegado al derecho, gastando
    // todo el margen en una sola direccion.
    ajustarParallax(anchoMundo) {
      const recorrido = Math.max(1, anchoMundo - ancho);
      const quiere = PLANOS.fondo.velocidad;
      const necesario = ancho + recorrido * quiere;
      const escala = Math.min(
        Math.max(necesario / fuente.width, alto / fuente.height),
        cubrir * PLANOS.fondo.ampliacionMaxima,
      );
      imagen.setScale(escala).setOrigin(0, 0.5).setX(0);
      // se baja un poco: la parte de abajo del dibujo queda tapada por el suelo
      imagen.setY(alto / 2 + Math.max(0, imagen.displayHeight - alto) * PLANOS.fondo.bajada);

      const sobra = Math.max(0, imagen.displayWidth - ancho) * 0.99;
      // La velocidad la mueve el repartidor de planos, no scrollFactor: con el
      // zoom de la camara, scrollFactor descoloca todo lo que no va a 1.
      this.velocidad = Math.min(quiere, sobra / recorrido);
    },
  };
}

function pintarFondoDibujado(escena, ancho, alto, conNubes = true) {
  const fondo = escena.add.graphics();
  fondo.fillGradientStyle(
    COLORES.cieloArriba,
    COLORES.cieloArriba,
    COLORES.cieloAbajo,
    COLORES.cieloAbajo,
    1,
  );
  fondo.fillRect(0, 0, ancho, alto);
  fondo.setDepth(-100);

  const montanas = escena.add.graphics().setDepth(-90);
  montanas.fillStyle(COLORES.montanaLejos, 1);
  for (let x = -100; x < ancho + 200; x += 210) {
    montanas.fillTriangle(x, alto, x + 105, alto - 170, x + 210, alto);
  }
  montanas.fillStyle(COLORES.montana, 1);
  for (let x = -200; x < ancho + 200; x += 260) {
    montanas.fillTriangle(x, alto, x + 130, alto - 115, x + 260, alto);
  }

  if (!conNubes) return;
  for (let i = 0; i < 5; i += 1) {
    escena.add
      .image(60 + i * 200, 60 + (i % 3) * 42, TEXTURAS.nube)
      .setDepth(-80)
      .setAlpha(0.85)
      .setScale(escalaDeJuego() * (0.7 + (i % 3) * 0.15));
  }
}
