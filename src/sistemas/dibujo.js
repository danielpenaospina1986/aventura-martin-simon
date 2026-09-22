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
import { COLORES, FONDO, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { MUNDO } from '../config/ajustes.js';

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

// --- personajes -------------------------------------------------------------

function generarPersonaje(escena, datos) {
  generar(escena, datos.textura, datos.ancho, datos.alto, (g) => {
    const { ancho, alto, color, colorPelo, altoPelo } = datos;
    // cuerpo
    caja(g, 0, 0, ancho, alto, color);
    // sombras para que no sea un rectangulo plano
    caja(g, 0, alto - 4, ancho, 4, 0x000000, 0.18);
    caja(g, ancho - 3, 0, 3, alto, 0x000000, 0.12);
    // pelo: franja de arriba
    caja(g, 0, 0, ancho, altoPelo, colorPelo);
    caja(g, 0, altoPelo - 2, ancho, 2, 0x000000, 0.15);
    // ojos (el sprite se voltea segun hacia donde mira)
    const ojoY = altoPelo + 5;
    caja(g, ancho - 9, ojoY, 3, 4, 0xffffff, 0.95);
    caja(g, ancho - 15, ojoY, 3, 4, 0xffffff, 0.95);
    // contorno
    g.lineStyle(1, 0x000000, 0.35);
    g.strokeRect(0.5, 0.5, ancho - 1, alto - 1);
  });
}

// --- escenario y objetos ----------------------------------------------------

export function generarTexturas(escena) {
  const c = MUNDO.casilla;

  // suelo solido: tierra con hierba arriba
  generar(escena, TEXTURAS.suelo, c, c, (g) => {
    caja(g, 0, 0, c, c, COLORES.tierra);
    caja(g, 0, 0, c, 7, COLORES.hierba);
    caja(g, 0, 7, c, 3, COLORES.hierbaOscura);
    caja(g, 0, c - 3, c, 3, COLORES.tierraOscura);
    g.lineStyle(1, 0x000000, 0.18);
    g.strokeRect(0.5, 0.5, c - 1, c - 1);
  });

  // tierra: igual que el suelo pero sin hierba (para las capas de debajo)
  generar(escena, TEXTURAS.tierra, c, c, (g) => {
    caja(g, 0, 0, c, c, COLORES.tierra);
    caja(g, 0, 0, c, 3, COLORES.tierraOscura);
    caja(g, 0, c - 3, c, 3, COLORES.tierraOscura);
    caja(g, 6, 10, 7, 5, COLORES.tierraOscura, 0.5);
    caja(g, 19, 20, 8, 5, COLORES.tierraOscura, 0.5);
    g.lineStyle(1, 0x000000, 0.12);
    g.strokeRect(0.5, 0.5, c - 1, c - 1);
  });

  // plataforma que se atraviesa desde abajo (mas fina)
  generar(escena, TEXTURAS.plataforma, c, 12, (g) => {
    caja(g, 0, 0, c, 12, COLORES.plataforma);
    caja(g, 0, 0, c, 3, 0xffffff, 0.25);
    caja(g, 0, 9, c, 3, COLORES.plataformaBorde);
    g.lineStyle(1, 0x000000, 0.25);
    g.strokeRect(0.5, 0.5, c - 1, 11);
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

  // enemigo: bichito que camina
  generar(escena, TEXTURAS.enemigo, 28, 22, (g) => {
    caja(g, 0, 2, 28, 20, COLORES.enemigo);
    caja(g, 0, 18, 28, 4, COLORES.enemigoOscuro);
    caja(g, 4, 0, 20, 4, COLORES.enemigoOscuro);
    caja(g, 5, 7, 6, 6, COLORES.enemigoOjo);
    caja(g, 17, 7, 6, 6, COLORES.enemigoOjo);
    caja(g, 7, 9, 3, 4, 0x1b1b22);
    caja(g, 19, 9, 3, 4, 0x1b1b22);
    g.lineStyle(1, 0x000000, 0.3);
    g.strokeRect(0.5, 2.5, 27, 19);
  });

  // el jefe: un bicho grande con cuernos (72 x 72)
  const jefe = (colorCuerpo) => (g) => {
    caja(g, 0, 14, 72, 58, colorCuerpo);
    caja(g, 0, 62, 72, 10, COLORES.jefeOscuro);
    caja(g, 5, 9, 62, 7, COLORES.jefeOscuro);
    // cuernos
    g.fillStyle(COLORES.jefeCuerno, 1);
    g.fillTriangle(6, 15, 22, 15, 12, 0);
    g.fillTriangle(50, 15, 66, 15, 60, 0);
    // ojos grandes y cejas de enfadado
    caja(g, 12, 26, 20, 18, COLORES.enemigoOjo);
    caja(g, 40, 26, 20, 18, COLORES.enemigoOjo);
    caja(g, 19, 32, 9, 12, 0x1b1b22);
    caja(g, 47, 32, 9, 12, 0x1b1b22);
    caja(g, 10, 20, 24, 6, COLORES.jefeOscuro);
    caja(g, 38, 20, 24, 6, COLORES.jefeOscuro);
    // boca con dientes
    caja(g, 22, 52, 28, 8, COLORES.jefeOscuro);
    caja(g, 27, 52, 5, 8, 0xffffff);
    caja(g, 40, 52, 5, 8, 0xffffff);
    g.lineStyle(2, 0x000000, 0.35);
    g.strokeRect(1, 15, 70, 56);
  };
  generar(escena, TEXTURAS.jefe, 72, 72, jefe(COLORES.jefe));
  generar(escena, TEXTURAS.jefeEnfadado, 72, 72, jefe(0xa63bbd));

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

// Fondo de todas las pantallas. Si la ilustracion esta cargada se usa esa; si
// no (por ejemplo si fallase la carga), se dibuja el cielo de siempre.
export function pintarFondo(escena, ancho, alto, opciones = {}) {
  const { veloExtra = 0, conNubes = true } = opciones;
  if (escena.textures.exists(TEXTURAS.fondo)) {
    return pintarFondoIlustrado(escena, ancho, alto, veloExtra);
  }
  pintarFondoDibujado(escena, ancho, alto, conNubes);
  return { ajustarParallax() {} };
}

function pintarFondoIlustrado(escena, ancho, alto, veloExtra = 0) {
  const fuente = escena.textures.get(TEXTURAS.fondo).getSourceImage();
  const escala = Math.max(ancho / fuente.width, alto / fuente.height) * FONDO.sobreancho;

  const imagen = escena.add
    .image(ancho / 2, alto / 2, TEXTURAS.fondo)
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
