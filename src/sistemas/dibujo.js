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
import { COLORES, FONDO, TEXTURAS, TINTA } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { ENEMIGO, JEFE, MUNDO } from '../config/ajustes.js';

function generar(escena, clave, ancho, alto, pintar) {
  if (escena.textures.exists(clave)) return;
  const g = escena.add.graphics({ x: 0, y: 0 }).setVisible(false);
  pintar(g);
  g.generateTexture(clave, ancho, alto);
  g.destroy();
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

export function generarTexturas(escena) {
  const c = MUNDO.casilla;

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
  const g = escena.add.graphics().setScrollFactor(0);
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
  const escala = Math.max(ancho / fuente.width, alto / fuente.height) * FONDO.sobreancho;

  const imagen = escena.add
    .image(ancho / 2, alto / 2, textura)
    .setScale(escala)
    .setScrollFactor(0)
    .setDepth(-100);

  // Velo: apaga el dibujo para que se sigan viendo bien el personaje, las
  // monedas y los enemigos. Va en degradado, mas fuerte abajo.
  const arriba = Math.min(1, FONDO.veloArriba + veloExtra);
  const abajo = Math.min(1, FONDO.veloAbajo + veloExtra);
  const velo = escena.add.graphics().setScrollFactor(0).setDepth(-99);
  velo.fillGradientStyle(
    FONDO.velo,
    FONDO.velo,
    FONDO.velo,
    FONDO.velo,
    arriba,
    arriba,
    abajo,
    abajo,
  );
  velo.fillRect(0, 0, ancho, alto);

  return {
    imagen,
    // El fondo acompana un poco a la camara, pero nunca tanto como para que se
    // asome el borde: el margen que sobra es el que manda.
    ajustarParallax(anchoMundo) {
      const recorrido = Math.max(1, anchoMundo - ancho);
      const margen = Math.max(0, (imagen.displayWidth - ancho) / 2) * 0.95;
      imagen.setScrollFactor(Math.min(FONDO.parallaxMaximo, margen / recorrido), 0);
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
  fondo.setScrollFactor(0).setDepth(-100);

  const montanas = escena.add.graphics().setScrollFactor(0.2).setDepth(-90);
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
      .setScrollFactor(0.35)
      .setDepth(-80)
      .setAlpha(0.85)
      .setScale(0.7 + (i % 3) * 0.15);
  }
}
