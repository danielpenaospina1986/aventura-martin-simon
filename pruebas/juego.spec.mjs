// ---------------------------------------------------------------------------
// PRUEBAS DEL JUEGO
// Abren el juego en un navegador de verdad, comprueban que no hay errores en la
// consola, recorren las pantallas y verifican que el movimiento, las
// habilidades y las reglas amables funcionan.
//
//   npm run probar
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

const CAPTURAS = 'capturas';

// Recoge cualquier error de consola o excepcion de la pagina.
function vigilarErrores(page) {
  const errores = [];
  page.on('console', (mensaje) => {
    if (mensaje.type() === 'error') errores.push(`consola: ${mensaje.text()}`);
  });
  page.on('pageerror', (error) => errores.push(`excepcion: ${error.message}`));
  return errores;
}

async function abrirJuego(page, extra = '') {
  // densidad 1 a proposito: aqui el navegador dibuja por software, sin tarjeta
  // grafica, y con la densidad de verdad se queda en 20 fotogramas por segundo.
  // Lo que se prueba es la logica del juego, no lo nitido que se ve.
  await page.goto(`/?densidad=1${extra}`);
  await page.waitForFunction(() => window.juego && window.juego.isRunning, null, {
    timeout: 20000,
  });
  await esperarEscena(page, 'titulo');
}

async function esperarEscena(page, clave) {
  await page.waitForFunction(
    (k) => {
      const escena = window.juego.scene.getScene(k);
      return escena && window.juego.scene.isActive(k) && escena.sys.settings.status === 5;
    },
    clave,
    { timeout: 20000 },
  );
}

// De las coordenadas del juego (640 x 360) a las de la pagina, para tocar con
// el dedo donde toca.
async function dondeTocar(page) {
  const caja = await page.evaluate(() => {
    const c = document.querySelector('#juego canvas').getBoundingClientRect();
    return { x: c.x, y: c.y, w: c.width, h: c.height };
  });
  return (gx, gy) => ({
    x: caja.x + (gx / 640) * caja.w,
    y: caja.y + (gy / 360) * caja.h,
  });
}

// titulo -> seleccion -> nivel, con el personaje pedido
async function entrarAlNivel(page, personaje = 'martin', extra = '') {
  await abrirJuego(page, extra);
  await page.keyboard.press('Enter');

  // Entre el titulo y la seleccion se pregunta quien juega.
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');

  // En la seleccion, Samaon (simon) va primero y Martain (martin) segundo.
  if (personaje === 'martin') {
    // Hay que esperar a que el menu este escuchando: si la flecha llega antes,
    // se entra con el otro personaje y la prueba mide otra cosa.
    await page.waitForFunction(() => {
      const e = window.juego.scene.getScene('seleccion');
      return e && e.menu;
    }, null, { timeout: 10000 });
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => window.juego.scene.getScene('seleccion').menu.indice === 1, null, {
      timeout: 10000,
    });
  }

  await page.keyboard.press('Enter');

  // Entre la seleccion y el tablero va el cuento; Esc lo salta entero.
  await esperarEscena(page, 'relato');
  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');
  await page.waitForTimeout(600); // fundido de entrada

  // Se apaga el azar de los regalos: unos bichos sueltan corazon en vez de
  // monedas, y con eso suelto no hay forma de medir cuanto da un bicho.
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    n.probabilidadCorazon = 0;
    n.probabilidadVidaExtra = 0;
    // Y no entran vacas por su cuenta: cruzan corriendo y, en una prueba que
    // mide monedas o golpes, meterian ruido sin avisar.
    n.proximaVaca = Number.MAX_SAFE_INTEGER;
  });
}

// Deja pasar el tiempo hasta que el jefe esta en su momento vulnerable, sea
// cual sea su truco. Papa Inodoro, por ejemplo, solo se deja dar cuando se
// estampa al final de su embestida y se queda aturdido.
async function esperarJefeExpuesto(page, msMaximo = 12000) {
  // Primero se le pone el nino delante: los jefes no atacan mientras no haya
  // nadie en su arena, asi que en la otra punta del tablero no se expondrian
  // nunca y la espera se iria en blanco.
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    if (!n.jefe || !n.jefe.active) return;
    const j = n.jugadores[0];
    if (Math.abs(j.x - n.jefe.x) > 220) {
      j.setPosition(n.jefe.x - 200, n.jefe.y);
      j.body.setVelocity(0, 0);
    }
  });

  await page.waitForFunction(
    () => {
      const n = window.juego.scene.getScene('nivel');
      return !n.jefe || !n.jefe.active || n.jefe.puedeRecibirGolpe();
    },
    null,
    { timeout: msMaximo },
  );
}

const estadoJugador = (page) =>
  page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    return {
      x: Math.round(j.x),
      y: Math.round(j.y),
      monedas: j.monedas,
      enSuelo: j.enSuelo,
      personaje: j.datos.id,
      enemigos: n.enemigos.getChildren().filter((e) => e.active).length,
      proyectiles: n.proyectilesVivos(),
      recogidas: j.recogidas,
      golpes: j.golpes,
      vidasJefe: n.jefe && n.jefe.active ? n.jefe.vidas : 0,
      enemigosVencidos: j.enemigosVencidos,
      totalMonedas: n.nivel.totalMonedas,
    };
  });

// ---------------------------------------------------------------------------

test('las pantallas se ven bien y no hay errores en la consola', async ({ page }) => {
  const errores = vigilarErrores(page);

  await abrirJuego(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/01-titulo.png` });

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${CAPTURAS}/02-nombre.png` });

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/03-seleccion.png` });

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'relato');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/04-relato.png` });

  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${CAPTURAS}/05-nivel.png` });

  expect(errores).toEqual([]);
});

test('el jugador corre y salta con la altura prevista', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const inicio = await estadoJugador(page);
  expect(inicio.enSuelo).toBe(true);

  // Correr a la derecha. Se mira la velocidad que alcanza, no cuanto recorre en
  // un tiempo de reloj: en una maquina lenta el juego va a menos fotogramas por
  // segundo y recorreria menos, y la prueba fallaria sin que el juego este mal.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  const corriendo = await page.evaluate(() => {
    const j = window.juego.scene.getScene('nivel').jugadores[0];
    return { x: Math.round(j.x), velocidad: Math.round(j.body.velocity.x) };
  });
  expect(corriendo.velocidad).toBe(210); // la velocidad de ajustes.js
  expect(corriendo.x).toBeGreaterThan(inicio.x);

  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(300);

  // Saltar sin soltar: se sigue la subida hasta el punto mas alto, en vez de
  // mirar la altura en un instante fijo.
  await page.keyboard.down('Space');
  const altura = await page.evaluate(async () => {
    const j = window.juego.scene.getScene('nivel').jugadores[0];
    const partida = j.y;
    let masAlto = j.y;
    // margen largo a proposito: en una maquina lenta el salto tarda mas en
      // tiempo de reloj, y si el bucle se corta antes se mide una altura falsa
      for (let i = 0; i < 400 && !(j.body.velocity.y >= 0 && j.y < partida - 10); i += 1) {
      masAlto = Math.min(masAlto, j.y);
      await new Promise((r) => setTimeout(r, 10));
    }
    return partida - masAlto;
  });
  await page.keyboard.up('Space');

  expect(altura).toBeGreaterThan(95);
  expect(altura).toBeLessThan(130);

  await page.waitForTimeout(1200);
  const alAterrizar = await estadoJugador(page);
  expect(alAterrizar.enSuelo).toBe(true);

  expect(errores).toEqual([]);
});

test('el salto corto sube menos que el salto largo', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const medir = async (ms) => {
    await page.keyboard.down('Space');
    const alturaPromesa = page.evaluate(async () => {
      const j = window.juego.scene.getScene('nivel').jugadores[0];
      const partida = j.y;
      let masAlto = j.y;
      for (let i = 0; i < 400 && !(j.body.velocity.y >= 0 && j.y < partida - 5); i += 1) {
        masAlto = Math.min(masAlto, j.y);
        await new Promise((r) => setTimeout(r, 10));
      }
      return partida - masAlto;
    });
    await page.waitForTimeout(ms);
    await page.keyboard.up('Space');
    const altura = await alturaPromesa;
    await page.waitForTimeout(1200);
    return altura;
  };

  const corto = await medir(70);
  const largo = await medir(330);
  expect(largo).toBeGreaterThan(corto + 20);
});

test('las monedas se recogen y suman en el HUD', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  // colocar al jugador junto a las primeras monedas del suelo
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    n.jugadores[0].setPosition(7 * 32, 9 * 32 - 40);
  });
  // Se espera a que recoja tres, en vez de correr un tiempo fijo: si la maquina
  // va lenta, en 900 ms no le habria dado tiempo y la prueba fallaria sin que el
  // juego este mal.
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => window.juego.scene.getScene('nivel').jugadores[0].recogidas >= 3,
    null,
    { timeout: 15000 },
  );
  await page.keyboard.up('ArrowRight');

  const estado = await estadoJugador(page);
  expect(estado.monedas).toBeGreaterThanOrEqual(3);
  expect(estado.recogidas).toBeGreaterThanOrEqual(3);
  expect(estado.totalMonedas).toBeGreaterThan(30);
});

test('Martín elimina enemigos con la katana', async ({ page }) => {
  await entrarAlNivel(page, 'martin');
  const antes = await estadoJugador(page);
  expect(antes.enemigos).toBeGreaterThan(1);

  // el enemigo se queda quieto para que la prueba sea siempre igual
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const enemigo = n.enemigos.getChildren()[0];
    enemigo.direccion = 0;
    enemigo.body.setVelocity(0, 0);
    window.__enemigoDePrueba = enemigo;
    j.setPosition(enemigo.x - 64, j.y);
    j.body.setVelocity(0, 0);
    j.mirando = 1;
  });
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyX');
  await page.waitForTimeout(250);

  const despues = await estadoJugador(page);
  expect(despues.enemigos).toBe(antes.enemigos - 1);
  expect(await page.evaluate(() => window.__enemigoDePrueba.active)).toBe(false);
});

test('saltar encima de un enemigo lo elimina', async ({ page }) => {
  await entrarAlNivel(page, 'simon');
  const antes = await estadoJugador(page);

  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const enemigo = n.enemigos.getChildren()[0];
    // fuera los premios de alrededor: si no, el nino recoge alguno de camino y
    // la cuenta de monedas mide dos cosas a la vez
    n.nivel.monedas.getChildren().forEach((m) => {
      if (Math.abs(m.x - enemigo.x) < 120) m.destroy();
    });
    enemigo.body.setVelocity(0, 0);
    enemigo.direccion = 0;
    j.setPosition(enemigo.x, enemigo.y - 90);
    j.body.setVelocity(0, 0);
  });
  await page.waitForTimeout(700);

  const despues = await estadoJugador(page);
  expect(despues.enemigos).toBe(antes.enemigos - 1);
  expect(despues.monedas).toBe(2); // vencer a un bicho da dos monedas
});

test('vencer a un bicho pequeño da dos monedas, lo mates como lo mates', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.monedas = 0;
    const antes = n.enemigos.getChildren().filter((e) => e.active).length;
    n.eliminarEnemigo(n.enemigos.getChildren()[0]);
    n.eliminarEnemigo(n.enemigos.getChildren()[1]);
    return {
      antes,
      despues: n.enemigos.getChildren().filter((e) => e.active).length,
      monedas: j.monedas,
      vencidos: j.enemigosVencidos,
    };
  });

  expect(resultado.despues).toBe(resultado.antes - 2);
  expect(resultado.monedas).toBe(4); // dos bichos, dos monedas cada uno
  expect(resultado.vencidos).toBe(2);
});

test('Simón lanza bloques y derriban a los enemigos', async ({ page }) => {
  await entrarAlNivel(page, 'simon');
  const antes = await estadoJugador(page);
  expect(antes.personaje).toBe('simon');

  // un enemigo quieto a unos pasos, para que la prueba sea siempre igual
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const enemigo = n.enemigos.getChildren()[0];
    enemigo.direccion = 0;
    enemigo.body.setVelocity(0, 0);
    window.__enemigoDePrueba = enemigo;
    j.setPosition(enemigo.x - 130, j.y);
    j.body.setVelocity(0, 0);
    j.mirando = 1;
  });
  await page.waitForTimeout(200);

  // con la tecla, tal como lo hara un nino
  //
  // Aqui no se mira cuantos bloques hay en el aire a mitad de vuelo: con el
  // bicho cerca, el bloque ya ha impactado. Que el bloque sale se comprueba en
  // la prueba de al lado, donde no hay nada que golpear.
  await page.keyboard.press('KeyX');
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__enemigoDePrueba.active)).toBe(false);
  expect((await estadoJugador(page)).enemigos).toBe(antes.enemigos - 1);
});

test('no puede haber más de tres bloques volando a la vez', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const maximo = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    let pico = 0;
    for (let i = 0; i < 6; i += 1) {
      j.recargaHabilidad = 0;
      j.controles.pulsada.habilidad = true;
      j.gestionarHabilidad();
      j.controles.pulsada.habilidad = false;
      pico = Math.max(pico, n.proyectilesVivos());
      await new Promise((r) => setTimeout(r, 40));
    }
    return pico;
  });

  expect(maximo).toBe(3);
});

test('el bloque lanzado se deshace al chocar contra el suelo', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  await page.keyboard.press('KeyX');
  await page.waitForTimeout(100);
  expect((await estadoJugador(page)).proyectiles).toBe(1);

  await page.waitForTimeout(1200);
  expect((await estadoJugador(page)).proyectiles).toBe(0);
});

test('la meta está cerrada mientras el jefe siga vivo', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const antes = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    return { vidasJefe: n.jefe.vidas, alphaMeta: n.nivel.meta.alpha };
  });
  expect(antes.vidasJefe).toBeGreaterThan(0); // cada jefe aguanta lo suyo
  expect(antes.alphaMeta).toBeLessThan(1); // se ve apagada

  // plantarse encima de la meta con el jefe vivo: no debe pasar nada
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    n.jugadores[0].setPosition(n.nivel.meta.x, n.nivel.meta.y);
  });
  await page.waitForTimeout(700);

  expect(await page.evaluate(() => window.juego.scene.isActive('nivel'))).toBe(true);
  expect(await page.evaluate(() => window.juego.scene.isActive('victoria'))).toBe(false);
});

test('al jefe se le gana saltándole encima cuando está expuesto', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const saltarEncima = async () => {
    await esperarJefeExpuesto(page);
    await page.evaluate(async () => {
      const n = window.juego.scene.getScene('nivel');
      const j = n.jugadores[0];
      if (!n.jefe || !n.jefe.active) return;
      n.jefe.invulnerableHasta = 0; // sin esperar el parpadeo
      j.setPosition(n.jefe.x, n.jefe.body.top - 70);
      j.body.setVelocity(0, 140);
      await new Promise((r) => setTimeout(r, 420));
    });
  };

  const vidas = await page.evaluate(() => window.juego.scene.getScene('nivel').jefe.vidas);
  for (let i = 0; i < vidas; i += 1) await saltarEncima();
  await page.waitForTimeout(400);

  // derrotado: desaparece y la meta se enciende
  const despues = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    return { jefe: !!n.jefe, alphaMeta: n.nivel.meta.alpha };
  });
  expect(despues.jefe).toBe(false);
  expect(despues.alphaMeta).toBe(1);
  expect(errores).toEqual([]);
});

test('a Papá Inodoro no se le puede dar mientras ronda', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;

    // se espera a pillarlo rondando, que es cuando NO se deja
    for (let i = 0; i < 160 && jefe.estado !== 'ronda'; i += 1) {
      await new Promise((r) => setTimeout(r, 55));
    }
    const antes = jefe.vidas;
    jefe.invulnerableHasta = 0;
    n.golpearJefe(jefe.x - 40);
    // Se mira su ESTADO y no el nombre de la clase: al compilar, los nombres se
    // acortan y la prueba dejaria de valer contra el juego publicado.
    return { estado: jefe.estado, expuesto: jefe.puedeRecibirGolpe(), antes, despues: jefe.vidas };
  });

  expect(resultado.estado).toBe('ronda');
  expect(resultado.expuesto).toBe(false);
  expect(resultado.despues).toBe(resultado.antes); // el golpe rebota
});

test('Papá Inodoro escupe heladitos, embiste y se estampa', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;
    const j = n.jugadores[0];

    // El jefe no hace nada mientras no haya nadie en su arena, asi que primero
    // se le pone el nino delante. Se le deja invulnerable: lo que se mide es lo
    // que hace EL, y si el nino pierde los corazones vuelve al checkpoint, se
    // sale de la arena y el jefe se calla.
    j.setPosition(jefe.x - 220, jefe.y);
    j.body.setVelocity(0, 0);

    const estados = new Set();
    let heladitosVistos = 0;
    let expuestoSinAturdir = false;

    // Se espera al SUCESO (que se estampe) y no a un numero de vueltas: entre
    // que escupe dos heladitos, se enoja y cruza la arena pasan varios segundos.
    for (let i = 0; i < 260; i += 1) {
      j.invulnerableHasta = n.time.now + 4000;
      estados.add(jefe.estado);
      heladitosVistos = Math.max(heladitosVistos, n.heladitos.getChildren().length);
      if (jefe.puedeRecibirGolpe() && jefe.estado !== 'aturdido') expuestoSinAturdir = true;
      if (jefe.estado === 'aturdido') break;
      await new Promise((r) => setTimeout(r, 55));
    }

    // y aturdido SI se deja dar
    const antes = jefe.vidas;
    jefe.invulnerableHasta = 0;
    n.golpearJefe(jefe.x - 40);

    return {
      estados: [...estados],
      heladitosVistos,
      expuestoSinAturdir,
      leContoElGolpe: jefe.vidas === antes - 1,
      // el golpe no le corta la ventana: puede caerle otro
      sigueAturdido: jefe.estado === 'aturdido',
    };
  });

  expect(resultado.estados).toContain('ronda');
  expect(resultado.estados).toContain('escupe');
  expect(resultado.estados).toContain('enojado');
  expect(resultado.estados).toContain('embiste');
  expect(resultado.estados).toContain('aturdido');
  expect(resultado.heladitosVistos).toBeGreaterThan(0);
  expect(resultado.expuestoSinAturdir).toBe(false);
  expect(resultado.leContoElGolpe).toBe(true);
  expect(resultado.sigueAturdido).toBe(true);
  expect(errores).toEqual([]);
});

test('el heladito se estrella al tocar el suelo y deja de hacer daño', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const heladito = n.escupirHeladito(n.jefe);
    const alSalir = { textura: heladito.texture.key, cuerpo: heladito.body.enable };

    for (let i = 0; i < 80 && !heladito.estrellado; i += 1) {
      await new Promise((r) => setTimeout(r, 55));
    }
    return {
      alSalir,
      estrellado: heladito.estrellado === true,
      textura: heladito.texture.key,
      cuerpo: heladito.body.enable,
    };
  });

  expect(resultado.alSalir.textura).toBe('tex-helado1');
  expect(resultado.alSalir.cuerpo).toBe(true);
  expect(resultado.estrellado).toBe(true);
  expect(resultado.textura).toBe('tex-helado-splat');
  expect(resultado.cuerpo).toBe(false); // ya no puede tocar a nadie
});

test('la katana de Martín también hace daño al jefe', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  await esperarJefeExpuesto(page);
  const antes = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.setPosition(n.jefe.x - 108, j.y);
    j.body.setVelocity(0, 0);
    j.mirando = 1;
    return n.jefe.vidas;
  });
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyX');
  await page.waitForTimeout(300);

  expect((await estadoJugador(page)).vidasJefe).toBe(antes - 1);
});

test('el bloque de Simón también hace daño al jefe', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  await esperarJefeExpuesto(page);
  const antes = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.setPosition(n.jefe.x - 190, j.y);
    j.body.setVelocity(0, 0);
    j.mirando = 1;
    return n.jefe.vidas;
  });
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyX');

  // Se espera al SUCESO (que le baje una vida) y no un tiempo de reloj: el
  // bloque tarda lo que tarda en cruzar, y con la suite entera por delante el
  // navegador va mas lento y 600 ms se quedaban cortos.
  const despues = await page.evaluate(async (antes) => {
    const n = window.juego.scene.getScene('nivel');
    for (let i = 0; i < 40 && n.jefe && n.jefe.vidas === antes; i += 1) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return { existe: !!n.jefe, activo: n.jefe ? n.jefe.active : false, vidas: n.jefe ? n.jefe.vidas : 0 };
  }, antes);
  expect(despues.existe).toBe(true);
  expect(despues.activo).toBe(true);
  expect(despues.vidas).toBe(antes - 1);
});

test('ningún jefe se derrota solo mientras el niño no llega', async ({ page }) => {
  // Este es el fallo que conto Daniel: llegaba al final de Atlanta y no habia
  // jefe. Dona Zully disparaba desde que empezaba el tablero, su chorro rebotaba
  // en sus propias sombrillas y se empapaba a si misma: se derrotaba sola en
  // doce segundos, antes de que nadie llegara.
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    n.scene.restart({ indiceNivel: 2, personajeId: 'simon', acumulado: {} });
    // el tablero montado, no un tiempo de reloj (ver la prueba de la sombrilla)
    for (let i = 0; i < 80; i += 1) {
      const e = window.juego.scene.getScene('nivel');
      if (e && e.jefe && e.jefe.active) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    const esc = window.juego.scene.getScene('nivel');
    const vidasAlEmpezar = esc.jefe ? esc.jefe.vidas : 0;
    const lejos = Math.round(Math.abs(esc.jugadores[0].x - esc.jefe.x));

    // se le deja a solas un buen rato, como mientras se recorre el tablero
    await new Promise((r) => setTimeout(r, 14000));

    const despues = window.juego.scene.getScene('nivel');
    return {
      lejos,
      vidasAlEmpezar,
      sigueVivo: !!(despues.jefe && despues.jefe.active),
      vidas: despues.jefe ? despues.jefe.vidas : 0,
    };
  });

  expect(resultado.lejos).toBeGreaterThan(400); // el nino esta lejos de verdad
  expect(resultado.sigueVivo).toBe(true);
  expect(resultado.vidas).toBe(resultado.vidasAlEmpezar); // ni un rasguno
});

test('a Doña Zully se le gana escondiéndose tras una sombrilla', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    // se salta a Atlanta, que es su ciudad
    n.scene.restart({ indiceNivel: 2, personajeId: 'simon', acumulado: {} });
    // Se espera a que el tablero ESTE MONTADO, no un tiempo de reloj: con la
    // suite entera por delante el navegador va mas lento y 1,6 s se quedaban
    // cortos, asi que la escena todavia no tenia jefe y la prueba fallaba sin
    // que el juego estuviese mal.
    for (let i = 0; i < 80; i += 1) {
      const e = window.juego.scene.getScene('nivel');
      if (e && e.jefe && e.jefe.sombrillas) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    const esc = window.juego.scene.getScene('nivel');
    const jefe = esc.jefe;
    const j = esc.jugadores[0];
    // la ultima sombrilla es la mas cercana a ella: la mas comoda para probar
    const sombrilla = jefe.sombrillas && jefe.sombrillas[jefe.sombrillas.length - 1];
    if (!sombrilla) return { sombrillas: 0 };

    // Se le apagan los jabones: aqui se mide el rebote, y quedandose quieto
    // detras de la sombrilla los jabones le caen encima (que es justo para lo
    // que estan, pero enturbia la medida).
    jefe.proximoJabon = Number.MAX_SAFE_INTEGER;

    // de frente no se le puede dar
    jefe.invulnerableHasta = 0;
    const antesDeFrente = jefe.vidas;
    esc.golpearJefe(jefe.x - 40);
    const trasGolpeDeFrente = jefe.vidas;

    // el nino se esconde detras de la sombrilla y espera su chorro
    const vidasAntes = jefe.vidas;
    // Margen largo a proposito: no siempre la empapa el primer chorro, y este
    // navegador dibuja despacio, asi que en segundos de reloj cabe menos juego.
    for (let i = 0; i < 400 && jefe.vidas === vidasAntes; i += 1) {
      jefe.proximoJabon = Number.MAX_SAFE_INTEGER;
      j.x = sombrilla.x - 40;
      j.y = sombrilla.y - 50;
      j.body.setVelocity(0, 0);
      await new Promise((r) => setTimeout(r, 55));
    }

    return {
      sombrillas: jefe.sombrillas.length,
      antesDeFrente,
      trasGolpeDeFrente,
      vidasAntes,
      vidas: jefe.vidas,
    };
  });

  // Cuantas se plantan depende del sitio que tenga su arena. Con la arena de una
  // pantalla entera caben las tres.
  expect(resultado.sombrillas).toBeGreaterThanOrEqual(2);
  expect(resultado.trasGolpeDeFrente).toBe(resultado.antesDeFrente); // de frente, nada
  expect(resultado.vidas).toBe(resultado.vidasAntes - 1); // el rebote sí la empapa

  // No se mira aqui si al nino le cayo algo: en la arena hay ademas baneras y
  // palomas, y esta prueba es del rebote, no de lo demas.
});

test('la bañera se agacha, salta y lanza agua con jabón', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const banera = n.enemigos.getChildren()[0];

    // se le pone el nino a tiro y por delante
    j.setPosition(banera.x - 150, j.y);
    banera.direccion = -1;
    banera.proximoAtaque = 0;

    await new Promise((r) => setTimeout(r, 250));
    const agachada = banera.estado;

    await new Promise((r) => setTimeout(r, 600));
    return {
      agachada,
      despues: banera.estado,
      peligros: n.peligros.getChildren().filter((p) => p.active).length,
    };
  });

  expect(resultado.agachada).toBe('carga');
  expect(resultado.despues).toBe('lanza');
  expect(resultado.peligros).toBeGreaterThanOrEqual(1);
  expect(errores).toEqual([]);
});

test('el agua con jabón cuesta tres monedas si te alcanza', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.monedas = 9;
    const banera = n.enemigos.getChildren()[0];
    banera.direccion = -1;
    j.setPosition(banera.x - 70, j.y);
    n.lanzarAgua(banera);
    // se espera al golpe, no a un reloj: con la maquina cargada el juego va a
    // menos fotogramas y un tiempo fijo se queda corto
    for (let i = 0; i < 120 && j.golpes === 0; i += 1) {
      await new Promise((r) => setTimeout(r, 25));
    }
    return { monedas: j.monedas, golpes: j.golpes };
  });

  expect(resultado.monedas).toBe(6); // 9 - 3
  expect(resultado.golpes).toBe(1);
});

test('la paloma suelta al pasar sobre el niño y le cuesta tres monedas', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.monedas = 12;
    n.proximaPaloma = 999999; // que no salga otra por su cuenta

    const { Paloma } = await import('/src/entidades/Paloma.js');
    const paloma = new Paloma(n, j.x + 120, 2 * 32, -1);
    n.palomas.add(paloma);

    // Se espera al suceso, no a un tiempo de reloj: con los tableros largos
    // este navegador dibuja mas despacio (aqui no hay tarjeta grafica) y en los
    // 1100 ms de antes la paloma todavia no habia llegado sobre el nino.
    const esperarA = async (cumple, msMaximo) => {
      for (let i = 0; i * 50 < msMaximo && !cumple(); i += 1) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return cumple();
    };

    const solto = await esperarA(() => paloma.yaSolto, 8000);
    await esperarA(() => j.golpes > 0, 8000);
    return { solto, monedas: j.monedas, golpes: j.golpes };
  });

  expect(resultado.solto).toBe(true);
  expect(resultado.monedas).toBe(9); // 12 - 3
  expect(resultado.golpes).toBe(1);
  expect(errores).toEqual([]);
});

test('los bichos atacan más a menudo según avanza la partida', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const esperas = await page.evaluate(async () => {
    const medir = async (indice) => {
      window.juego.scene.stop('nivel');
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: indice });
      await new Promise((r) => setTimeout(r, 1100));
      const n = window.juego.scene.getScene('nivel');
      // se toma la media de varias tiradas, que son al azar
      const banera = n.enemigos.getChildren()[0];
      let suma = 0;
      for (let i = 0; i < 40; i += 1) suma += banera.esperaDeAtaque();
      return Math.round(suma / 40);
    };
    return { primero: await medir(0), ultimo: await medir(4) };
  });

  expect(esperas.ultimo).toBeLessThan(esperas.primero);
});

test('caer a un hueco cuesta tres monedas y devuelve al checkpoint', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const monedas = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    // Se quitan los premios de alrededor del hueco: sobre cada uno hay un arco
    // de premios y el nino los recogia de camino, asi que la cuenta no salia.
    n.nivel.monedas.getChildren().forEach((m) => {
      if (Math.abs(m.x - (16 * 32 + 16)) < 140) m.destroy();
    });
    j.monedas = 7; // como si ya hubiese recogido siete
    // tirarlo por el primer hueco
    j.setPosition(16 * 32 + 16, 9 * 32 - 30);
    j.body.setVelocity(0, 400);
    return j.monedas;
  });
  expect(monedas).toBe(7);

  await page.waitForTimeout(1600);
  const despues = await estadoJugador(page);
  expect(despues.monedas).toBe(4); // 7 - 3
  expect(despues.golpes).toBe(1);
  expect(despues.y).toBeLessThan(330); // ha vuelto arriba
  expect(despues.x).toBeLessThan(16 * 32); // ha vuelto al principio
});

test('el niño empieza con cinco corazones y cada golpe le quita uno', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const corazones = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const paso = [j.corazones];
    for (let i = 0; i < 3; i += 1) {
      j.invulnerableHasta = 0;
      n.herirJugador(j);
      await new Promise((r) => setTimeout(r, 60));
      paso.push(j.corazones);
    }
    return paso;
  });

  expect(corazones).toEqual([5, 4, 3, 2]);
});

test('sin corazones se pierde una vida y se reponen', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const vidasAntes = n.vidas;
    for (let i = 0; i < 5; i += 1) {
      j.invulnerableHasta = 0;
      n.herirJugador(j);
      await new Promise((r) => setTimeout(r, 60));
    }
    return { vidasAntes, vidas: n.vidas, corazones: j.corazones };
  });

  expect(resultado.vidasAntes).toBe(3);
  expect(resultado.vidas).toBe(2);
  expect(resultado.corazones).toBe(5); // repuestos, a seguir jugando
});

test('al perder las tres vidas se acaba la partida', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    for (let v = 0; v < 3; v += 1) {
      for (let c = 0; c < 5; c += 1) {
        j.invulnerableHasta = 0;
        n.herirJugador(j);
        await new Promise((r) => setTimeout(r, 30));
      }
    }
  });

  await esperarEscena(page, 'final');
  const vidas = await page.evaluate(() => window.juego.scene.getScene('nivel').vidas);
  expect(vidas).toBe(0);
});

test('un corazon repone y una vida extra suma', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.invulnerableHasta = 0;
    n.herirJugador(j);
    await new Promise((r) => setTimeout(r, 80));
    const tocado = j.corazones;

    n.soltarRegalo(j.x, j.y - 30, 'corazon');
    await new Promise((r) => setTimeout(r, 500));
    const trasCorazon = j.corazones;

    const vidasAntes = n.vidas;
    n.soltarRegalo(j.x, j.y - 30, 'vida');
    await new Promise((r) => setTimeout(r, 500));
    return { tocado, trasCorazon, vidasAntes, vidas: n.vidas };
  });

  expect(resultado.tocado).toBe(4);
  expect(resultado.trasCorazon).toBe(5);
  expect(resultado.vidas).toBe(resultado.vidasAntes + 1);
});

test('a la paloma se le salta encima y al segundo golpe se cae', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const mod = await import('/src/entidades/Paloma.js');
    const j = n.jugadores[0];
    const p = new mod.Paloma(n, j.x + 200, 120, -1);
    n.palomas.add(p);

    p.recibirGolpe();
    const tras1 = p.estado;
    p.recibirGolpe();
    const tras2 = p.estado;

    for (let i = 0; i < 40 && p.estado !== 'suelo'; i += 1) {
      await new Promise((r) => setTimeout(r, 60));
    }
    return { tras1, tras2, final: p.estado };
  });

  expect(resultado.tras1).toBe('aturdida');
  expect(resultado.tras2).toBe('cae');
  expect(resultado.final).toBe('suelo');
});

test('el tablero de puntajes solo guarda los diez mejores', async ({ page }) => {
  await abrirJuego(page);

  const resultado = await page.evaluate(async () => {
    const mod = await import('/src/sistemas/puntajes.js');
    mod.borrarPuntajes();
    for (let i = 1; i <= 14; i += 1) mod.anotarPuntaje(`Jugador${i}`, i * 10, {});
    const diez = mod.mejoresPuntajes();
    const tras = mod.anotarPuntaje('Campeon', 999, {});
    mod.borrarPuntajes();
    return {
      cuantos: diez.length,
      masAlto: diez[0].puntos,
      masBajo: diez[diez.length - 1].puntos,
      primeroTras: tras[0].nombre,
      cuantosTras: tras.length,
    };
  });

  expect(resultado.cuantos).toBe(10);
  expect(resultado.masAlto).toBe(140);
  expect(resultado.masBajo).toBe(50); // del puesto once para abajo se borra
  expect(resultado.primeroTras).toBe('Campeon');
  expect(resultado.cuantosTras).toBe(10);
});

test('el nombre del jugador se recorta a diez letras y se guarda', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');

  await page.keyboard.type('Samaonelmejordetodos', { delay: 15 });
  const escrito = await page.evaluate(() => window.juego.scene.getScene('nombre').nombre);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');

  const guardado = await page.evaluate(() => window.localStorage.getItem('aventura-jugador'));
  expect(escrito).toBe('Samaonelme');
  expect(guardado).toBe('Samaonelme');
});

test('la partida nueva entra derecho por la reseña de la primera ciudad', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');

  // Ya no hay vinetas de apertura: lo primero que se ve es Space Coast.
  await esperarEscena(page, 'relato');
  const tarjeta = await page.evaluate(() => {
    const e = window.juego.scene.getScene('relato');
    return { titulo: e.titulo, texto: e.texto.text, cuantas: e.vinetas.length };
  });
  expect(tarjeta.titulo).toBe('Space Coast');
  expect(tarjeta.texto).toContain('nacieron');
  expect(tarjeta.cuantas).toBe(1);

  // y de ahi, con un Enter, a jugar
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nivel');
});

test('acabar la última ciudad lleva al marcador, sin despedida', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const escenas = await page.evaluate(async () => {
    const mod = await import('/src/sistemas/cuento.js');
    const n = window.juego.scene.getScene('nivel');
    mod.terminarPartida(n, { personajeId: 'martin', monedas: 40, indiceNivel: 4 });
    await new Promise((r) => setTimeout(r, 900));
    return {
      victoria: window.juego.scene.isActive('victoria'),
      relato: window.juego.scene.isActive('relato'),
    };
  });

  expect(escenas.victoria).toBe(true);
  expect(escenas.relato).toBe(false);
});

test('Esc se salta la reseña y deja jugando', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');

  await esperarEscena(page, 'relato');
  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');
});

test('cada ciudad entra con su tarjeta', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const tarjeta = await page.evaluate(async () => {
    const mod = await import('/src/sistemas/cuento.js');
    const n = window.juego.scene.getScene('nivel');
    mod.empezarNivel(n, { personajeId: 'martin', indiceNivel: 1 });
    await new Promise((r) => setTimeout(r, 900));
    const e = window.juego.scene.getScene('relato');
    return { titulo: e.titulo, texto: e.texto.text };
  });

  expect(tarjeta.titulo).toBe('Medellín');
  expect(tarjeta.texto).toContain('papás');
});

test('el marcador nunca baja de cero', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.monedas = 2;
    j.invulnerableHasta = 0;
    n.herirJugador(j);
    return { monedas: j.monedas, golpes: j.golpes };
  });

  expect(resultado.monedas).toBe(0); // 2 - 3 se queda en 0, no en -1
  expect(resultado.golpes).toBe(1);
});

test('derrotar al jefe da diez monedas', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  // Se mide el SALTO de monedas al derrotarlo, no un total: de camino a la
  // arena el nino recibe golpes, y cada golpe le cuesta tres.
  let monedasAntes = null;

  for (let i = 0; i < 8; i += 1) {
    const sigueVivo = await page.evaluate(() => {
      const n = window.juego.scene.getScene('nivel');
      return !!(n.jefe && n.jefe.active);
    });
    if (!sigueVivo) break;

    await esperarJefeExpuesto(page);
    monedasAntes = await page.evaluate(() => {
      const n = window.juego.scene.getScene('nivel');
      const j = n.jugadores[0];
      if (!n.jefe || !n.jefe.active) return null;
      n.jefe.invulnerableHasta = 0;
      const antes = j.monedas;
      n.golpearJefe(j.x);
      return antes;
    });
    await page.waitForTimeout(120);
  }

  const resultado = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    return { monedas: j.monedas, jefes: j.jefesDerrotados, jefe: !!n.jefe };
  });

  expect(resultado.jefe).toBe(false);
  expect(resultado.jefes).toBe(1);
  expect(resultado.monedas).toBe(monedasAntes + 10); // el golpe final da diez
});

test('los cinco niveles cargan con su jefe y sus tres checkpoints', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  for (let indice = 0; indice < 5; indice += 1) {
    const datos = await page.evaluate(async (i) => {
      window.juego.scene.stop('nivel');
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      await new Promise((r) => setTimeout(r, 1100));
      const n = window.juego.scene.getScene('nivel');
      return {
        indice: n.indiceNivel,
        nombre: n.datosNivel.nombre,
        jefe: !!n.jefe,
        checkpoints: n.nivel.checkpoints.getChildren().length,
        premios: n.nivel.totalMonedas,
        meta: !!n.nivel.meta,
      };
    }, indice);

    expect(datos.indice).toBe(indice);
    expect(datos.nombre.length).toBeGreaterThan(0);
    expect(datos.jefe).toBe(true);
    expect(datos.checkpoints).toBe(3);
    expect(datos.premios).toBeGreaterThan(30);
    expect(datos.meta).toBe(true);
  }

  expect(errores).toEqual([]);
});

test('el marcador se arrastra de un nivel al siguiente', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const datos = await page.evaluate(async () => {
    window.juego.scene.stop('nivel');
    window.juego.scene.start('nivel', {
      personajeId: 'simon',
      indiceNivel: 2,
      monedas: 41,
      recogidas: 38,
      golpes: 2,
      jefesDerrotados: 2,
    });
    await new Promise((r) => setTimeout(r, 1100));
    const j = window.juego.scene.getScene('nivel').jugadores[0];
    return { monedas: j.monedas, recogidas: j.recogidas, golpes: j.golpes, jefes: j.jefesDerrotados };
  });

  expect(datos.monedas).toBe(41);
  expect(datos.recogidas).toBe(38);
  expect(datos.golpes).toBe(2);
  expect(datos.jefes).toBe(2);
});

test('el checkpoint se activa aunque se pase saltando por encima', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const b = n.nivel.checkpoints.getChildren()[0];
    const antes = { activo: b.activo, reaparicion: Math.round(j.reaparicion.x) };

    // pasar por encima a la altura maxima del salto (114,6 px sobre el suelo)
    j.setPosition(b.x, 9 * 32 - 40 - 114);
    j.body.setVelocity(120, -40);
    await new Promise((r) => setTimeout(r, 400));

    return { antes, activo: b.activo, reaparicion: Math.round(j.reaparicion.x), banderaX: Math.round(b.x) };
  });

  expect(resultado.antes.activo).toBe(false);
  expect(resultado.activo).toBe(true);
  expect(resultado.reaparicion).toBe(resultado.banderaX);
});

test('Esc abre la pausa y se puede seguir jugando', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  await page.keyboard.press('Escape');
  await esperarEscena(page, 'pausa');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${CAPTURAS}/04-pausa.png` });
  expect(await page.evaluate(() => window.juego.scene.isPaused('nivel'))).toBe(true);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.juego.scene.isPaused('nivel'))).toBe(false);
  expect(errores).toEqual([]);
});

test('la tecla H muestra y oculta las cajas de colisión', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  await page.keyboard.press('KeyH');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.juego.scene.getScene('nivel').physics.world.drawDebug)).toBe(true);
  await page.screenshot({ path: `${CAPTURAS}/05-cajas-colision.png` });

  await page.keyboard.press('KeyH');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.juego.scene.getScene('nivel').physics.world.drawDebug)).toBe(false);
});

test('llegar a la meta lleva a la pantalla de victoria', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.monedas = 22;
    // Primero el jefe: sin derrotarlo la meta no se abre. Aqui se le derrota de
    // un tiron a proposito: lo que mide esta prueba es la meta, no la pelea, y
    // cada jefe se deja dar en un momento distinto.
    if (n.jefe && n.jefe.active) n.derrotarJefe();
    j.setPosition(n.nivel.meta.x, n.nivel.meta.y);
  });

  await esperarEscena(page, 'victoria');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${CAPTURAS}/06-victoria.png` });
  expect(errores).toEqual([]);
});

test('el nivel entero se recorre de la salida a la meta', async ({ page }) => {
  test.setTimeout(240000);
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  // Un "piloto automatico": corre a la derecha con el teclado de verdad y salta
  // cuando se le acaba el suelo, choca con algo o tiene un enemigo delante.
  //
  // Las dos sondas son distintas a proposito, como salta una persona:
  //   - al bicho se le ve venir de lejos (110 px), porque ahora mide lo que un
  //     nino y saltarle encima tarde acaba en choque de lado;
  //   - al hueco se salta desde el mismo borde (26 px), porque saltar antes de
  //     tiempo se queda corto en los huecos de tres casillas.
  await page.keyboard.down('ArrowRight');

  const recorrido = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const metaX = n.nivel.meta.x;
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const registro = [];
    let xMaxima = j.x;
    let quieto = 0;

    // margen largo: en una maquina lenta el juego va a menos fotogramas y el
    // recorrido necesita mas pasos para cubrir la misma distancia
    for (let paso = 0; paso < 1800 && !n.terminado; paso += 1) {
      const sueloDelante = n.haySoporteEn(j.x + 26, j.body.bottom + 6);
      const chocando = j.body.blocked.right;
      const enemigoCerca = n.enemigos
        .getChildren()
        .some((e) => e.active && e.x - j.x > 0 && e.x - j.x < 110 && Math.abs(e.y - j.y) < 70);

      if (j.enSuelo && (!sueloDelante || chocando || enemigoCerca || quieto > 6)) {
        j.saltar();
        quieto = 0;
      }

      // al llegar al jefe, pelear: se le quitan las tres vidas
      // Al llegar a la arena se le derrota de un tiron: el piloto automatico
      // no sabe pelear, y lo que se mide aqui es que el tablero se recorre
      // entero.
      if (n.jefe && n.jefe.active && Math.abs(n.jefe.x - j.x) < 150) {
        n.derrotarJefe();
      }

      await esperar(32);

      if (j.x > xMaxima + 1) {
        xMaxima = j.x;
        quieto = 0;
      } else {
        quieto += 1;
      }
      if (paso % 40 === 0) registro.push(Math.round(j.x));
    }

    return {
      terminado: n.terminado,
      xFinal: Math.round(j.x),
      xMaxima: Math.round(xMaxima),
      metaX: Math.round(metaX),
      monedas: j.monedas,
      recogidas: j.recogidas,
      totalMonedas: n.nivel.totalMonedas,
      checkpointActivo: n.nivel.checkpoints.getChildren()[0].activo,
      jefeDerrotado: !n.jefe,
      registro,
    };
  });

  await page.keyboard.up('ArrowRight');
  console.log('  recorrido:', JSON.stringify(recorrido));

  expect(recorrido.terminado).toBe(true);
  expect(recorrido.checkpointActivo).toBe(true);
  expect(recorrido.jefeDerrotado).toBe(true);
  expect(recorrido.recogidas).toBeGreaterThan(10);
  expect(errores).toEqual([]);
});

// Lleva al nino a la arena del jefe de un tablero cualquiera y devuelve la
// escena lista para pelear. Se usa en las pruebas de los jefes nuevos.
async function entrarALaArena(page, indiceNivel) {
  await page.evaluate(async (indice) => {
    window.juego.scene.stop('nivel');
    window.juego.scene.start('nivel', { personajeId: 'simon', indiceNivel: indice });
    await new Promise((r) => setTimeout(r, 1800));
    const n = window.juego.scene.getScene('nivel');
    n.probabilidadCorazon = 0;
    n.probabilidadVidaExtra = 0;
    const j = n.jugadores[0];
    j.setPosition(n.jefe.x - 150, n.jefe.y);
    j.body.setVelocity(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  }, indiceNivel);
}

test('al Abuelo no se le pega: lo para una canastilla', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'simon');
  await entrarALaArena(page, 1);

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;
    const clase = jefe.constructor.name;
    const canastillas = n.canastillas.getChildren().length;

    // de frente no se le hace nada, por mucho que se insista
    jefe.invulnerableHasta = 0;
    const antesDeFrente = jefe.vidas;
    n.golpearJefe(jefe.x - 40);
    const trasGolpeDeFrente = jefe.vidas;

    // y ahora una canastilla encima
    const vidasAntes = jefe.vidas;
    for (let i = 0; i < 400 && jefe.vidas === vidasAntes; i += 1) {
      const cerca = n.canastillas
        .getChildren()
        .filter((m) => m.active && !m.cayendo)
        .sort((a, b) => Math.abs(a.x - jefe.x) - Math.abs(b.x - jefe.x))[0];
      if (cerca && Math.abs(cerca.x - jefe.x) < 70) n.tirarCanastilla(cerca, cerca.x);
      await new Promise((r) => setTimeout(r, 55));
    }
    return { clase, canastillas, antesDeFrente, trasGolpeDeFrente, vidasAntes, vidas: jefe.vidas };
  });

  expect(resultado.clase).toBe('Abuelo');
  expect(resultado.canastillas).toBeGreaterThanOrEqual(3);
  expect(resultado.trasGolpeDeFrente).toBe(resultado.antesDeFrente); // de frente, nada
  expect(resultado.vidas).toBe(resultado.vidasAntes - 1); // la canastilla si cuenta
  expect(errores).toEqual([]);
});

test('al Salvavidas solo se le da cuando baja de la torre', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'simon');
  await entrarALaArena(page, 3);

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;
    const clase = jefe.constructor.name;
    const torres = n.torres.length;

    // subido a la torre no se le llega
    let enAlto = 0;
    let deFrenteEnAlto = 0;
    for (let i = 0; i < 40 && jefe.estado !== 'suelo'; i += 1) {
      if (jefe.estado === 'vigila' || jefe.estado === 'tira') {
        enAlto += 1;
        jefe.invulnerableHasta = 0;
        const antes = jefe.vidas;
        n.golpearJefe(jefe.x - 40);
        if (jefe.vidas < antes) deFrenteEnAlto += 1;
      }
      await new Promise((r) => setTimeout(r, 55));
    }

    // cuando baja, si
    const vidasAntes = jefe.vidas;
    for (let i = 0; i < 400 && jefe.vidas === vidasAntes; i += 1) {
      const j = n.jugadores[0];
      j.setPosition(jefe.x - 150, j.y);
      j.body.setVelocity(0, 0);
      if (jefe.puedeRecibirGolpe()) n.golpearJefe(jefe.x - 40);
      await new Promise((r) => setTimeout(r, 55));
    }
    return { clase, torres, enAlto, deFrenteEnAlto, vidasAntes, vidas: jefe.vidas };
  });

  expect(resultado.clase).toBe('Salvavidas');
  expect(resultado.torres).toBeGreaterThanOrEqual(2);
  expect(resultado.enAlto).toBeGreaterThan(0); // que de verdad estuvo arriba
  expect(resultado.deFrenteEnAlto).toBe(0); // y que ahi no se le hizo nada
  expect(resultado.vidas).toBe(resultado.vidasAntes - 1);
  expect(errores).toEqual([]);
});

test('al Capitán Tapón se le gana quitándole el tapón', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'simon');
  await entrarALaArena(page, 4);

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;
    const clase = jefe.constructor.name;

    // de cara no se le hace nada
    let deCara = 0;
    let contaronDeCara = 0;
    for (let i = 0; i < 40 && jefe.estado !== 'recarga'; i += 1) {
      deCara += 1;
      jefe.invulnerableHasta = 0;
      const antes = jefe.vidas;
      n.golpearJefe(jefe.x - 40);
      if (jefe.vidas < antes) contaronDeCara += 1;
      await new Promise((r) => setTimeout(r, 55));
    }

    // de espaldas, recargando, si
    const vidasAntes = jefe.vidas;
    for (let i = 0; i < 400 && jefe.vidas === vidasAntes; i += 1) {
      const j = n.jugadores[0];
      j.setPosition(jefe.x - 150, j.y);
      j.body.setVelocity(0, 0);
      if (jefe.puedeRecibirGolpe()) n.golpearJefe(jefe.x - 40);
      await new Promise((r) => setTimeout(r, 55));
    }
    return { clase, deCara, contaronDeCara, vidasAntes, vidas: jefe.vidas };
  });

  expect(resultado.clase).toBe('CapitanTapon');
  expect(resultado.deCara).toBeGreaterThan(0);
  expect(resultado.contaronDeCara).toBe(0);
  expect(resultado.vidas).toBe(resultado.vidasAntes - 1);
  expect(errores).toEqual([]);
});

test('las cinco ciudades tienen su propio jefe, cada uno con su truco', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const jefes = await page.evaluate(async () => {
    const salida = [];
    for (let i = 0; i < 5; i += 1) {
      window.juego.scene.stop('nivel');
      window.juego.scene.start('nivel', { personajeId: 'simon', indiceNivel: i });
      await new Promise((r) => setTimeout(r, 1300));
      const n = window.juego.scene.getScene('nivel');
      salida.push({
        ciudad: n.datosNivel.fondo,
        clase: n.jefe ? n.jefe.constructor.name : null,
        vidas: n.jefe ? n.jefe.vidas : 0,
      });
    }
    return salida;
  });

  expect(jefes.map((j) => j.clase)).toEqual([
    'PapaInodoro', 'Abuelo', 'DonaZully', 'Salvavidas', 'CapitanTapon',
  ]);
  // ninguno es el provisional, y todos aguantan mas de un golpe
  jefes.forEach((j) => expect(j.vidas).toBeGreaterThan(2));
});

test('desde el suelo se le llega a la coronilla al jefe, en las cinco ciudades', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const medidas = await page.evaluate(async () => {
    const { ALCANCE, MUNDO } = await import('/src/config/ajustes.js');
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    // hasta donde llegan los pies del nino con un salto desde el suelo
    const pies = suelo - ALCANCE.alturaSaltoPx;

    const salida = [];
    for (let i = 0; i < 5; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      await new Promise((r) => setTimeout(r, 1300));
      const n = window.juego.scene.getScene('nivel');
      // El techo de su caja, contado desde el suelo: asi da igual donde ande el
      // jefe en ese momento (el Salvavidas, por ejemplo, se sube a sus torres).
      salida.push({
        ciudad: n.datosNivel.fondo,
        techo: suelo - n.jefe.config.caja.alto,
        pies: Math.round(pies),
        alto: Math.round(n.jefe.displayHeight),
        cajaAlto: n.jefe.config.caja.alto,
      });
    }
    return salida;
  });

  medidas.forEach((m) => {
    // el techo de su caja queda POR DEBAJO de donde llegan los pies: saltando
    // desde el suelo se le puede caer encima, sin usar la plataforma
    expect(m.techo).toBeGreaterThan(m.pies);
    // y con margen de sobra para no rozarlo mientras sube
    expect(m.techo - m.pies).toBeGreaterThan(8);
    // pero el DIBUJO no se ha encogido para conseguirlo: lo que se recorta es la
    // caja. El jefe sigue siendo mucho mas grande que un nino (que mide 86) y
    // le asoma un buen trozo por encima de su propia caja.
    expect(m.alto).toBeGreaterThan(129);
    expect(m.alto - m.cajaAlto).toBeGreaterThanOrEqual(30);
  });
});

test('con carrerilla se le puede caer encima al jefe de cada ciudad', async ({ page }) => {
  // La de arriba comprueba la geometria; esta lo hace de verdad, con las
  // teclas: carrerilla, salto sin soltar y a ver si le cae encima.
  await entrarAlNivel(page, 'martin');

  const resultado = [];
  for (const indice of [0, 1, 2, 3, 4]) {
    await page.evaluate(async (indice) => {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: indice });
      await new Promise((r) => setTimeout(r, 1400));
      const n = window.juego.scene.getScene('nivel');
      // Se le deja quieto y expuesto: lo que se mide es el salto, no su truco.
      // Primero se espera a pillarlo EN EL SUELO DEL TABLERO y ahi se le quita
      // la gravedad, para que la medida se repita. No vale con "esta apoyado en
      // algo": el Salvavidas se pasa la pelea saltando, y pillandolo sobre la
      // plataforma de su arena el nino no salta al jefe, salta a la plataforma.
      const { MUNDO } = await import('/src/config/ajustes.js');
      const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
      n.jefe.puedeRecibirGolpe = () => true;
      n.jefe.actualizar = () => {};
      n.jefe.body.setAllowGravity(false);
      n.jefe.body.setVelocity(0, 0);
      // Se le planta en el suelo del tablero: el Salvavidas se pasa la pelea
      // saltando de torre en torre, y congelado ahi arriba lo que se mediria es
      // otra cosa.
      n.jefe.setPosition(n.jefe.x, suelo - n.jefe.displayHeight / 2);
      await new Promise((r) => setTimeout(r, 120));
      n.proximaVaca = Number.MAX_SAFE_INTEGER;
      n.proximaPaloma = Number.MAX_SAFE_INTEGER;
    }, indice);

    let pisotones = 0;
    for (const salida of [125, 140, 155, 170, 185]) {
      await page.evaluate((salida) => {
        const n = window.juego.scene.getScene('nivel');
        const j = n.jugadores[0];
        n.jefe.vidas = 9;
        n.jefe.invulnerableHasta = 0;
        n.jefe.body.setVelocity(0, 0);
        // Se despeja lo que el jefe haya dejado por el suelo: un flotador del
        // Salvavidas rodando por la carrerilla congela al nino a media zancada
        // y se pierde el salto.
        [n.flotadores, n.balas, n.heladitos, n.chorros, n.peligros].forEach((g) => {
          g.getChildren().slice().forEach((cosa) => cosa.active && cosa.destroy());
        });
        j.setPosition(n.jefe.x - salida, n.jefe.body.bottom - 30);
        j.body.setVelocity(0, 0);
        j.invulnerableHasta = 0;
      }, salida);
      await page.waitForTimeout(260);

      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(40);
      // sin soltar el salto: soltandolo antes el salto es mas corto y no llega
      await page.keyboard.down('Space');
      await page.waitForTimeout(420);
      await page.keyboard.up('Space');
      await page.waitForTimeout(420);
      await page.keyboard.up('ArrowRight');

      const vidas = await page.evaluate(() => window.juego.scene.getScene('nivel').jefe.vidas);
      if (vidas < 9) pisotones += 1;
    }
    const ciudad = await page.evaluate(() => window.juego.scene.getScene('nivel').datosNivel.fondo);
    resultado.push({ ciudad, pisotones });
  }

  // en las cinco, con la carrerilla buena, se le cae encima
  const flojas = resultado.filter((r) => r.pisotones === 0).map((r) => r.ciudad);
  expect(flojas).toEqual([]);
});

test('ni las palomas ni las vacas se represan al final del tablero', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const { Paloma } = await import('/src/entidades/Paloma.js');
    const { Vaca } = await import('/src/entidades/Vaca.js');
    const { MUNDO, VACA } = await import('/src/config/ajustes.js');
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    const fin = n.nivel.ancho;

    // una paloma a la altura del segundo piso y una vaca por el suelo, las dos
    // camino del final del tablero, que es donde estaba la pared
    const paloma = new Paloma(n, fin - 300, 5 * MUNDO.casilla, 1);
    n.palomas.add(paloma);
    const vaca = new Vaca(n, fin - 300, suelo - VACA.alto / 2, 1);
    n.vacas.add(vaca);

    let xPaloma = paloma.x;
    let xVaca = vaca.x;
    for (let i = 0; i < 160 && (paloma.active || vaca.active); i += 1) {
      if (paloma.active) xPaloma = paloma.x;
      if (vaca.active) xVaca = vaca.x;
      await new Promise((r) => setTimeout(r, 55));
    }
    return { palomaViva: paloma.active, vacaViva: vaca.active, xPaloma, xVaca, fin };
  });

  // las dos salen del tablero y se van; no se quedan clavadas contra nada
  expect(resultado.palomaViva).toBe(false);
  expect(resultado.vacaViva).toBe(false);
  expect(resultado.xPaloma).toBeGreaterThan(resultado.fin - 40);
  expect(resultado.xVaca).toBeGreaterThan(resultado.fin - 40);
});

test('la vaca entra corriendo, avisa, embiste y se le puede pisar', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const { Vaca } = await import('/src/entidades/Vaca.js');
    const { VACA, MUNDO } = await import('/src/config/ajustes.js');
    const j = n.jugadores[0];
    j.setPosition(9 * 32, 9 * 32 - 60);
    j.body.setVelocity(0, 0);

    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    // Bien lejos a proposito: baja la cabeza a 240 px, asi que soltandola mas
    // cerca trotaba dos suspiros y no daba tiempo a que cambiara de paso, que
    // es justo lo que se quiere comprobar.
    const vaca = new Vaca(n, j.x + 460, suelo - VACA.alto / 2, -1);
    n.vacas.add(vaca);

    // primero trota (y anima el paso); al tener al nino delante baja la cabeza,
    // resopla y arranca
    // El bucle espera al SUCESO (que embista) y no un numero de vueltas: soltada
    // a 460 px, la vaca trota 220 antes de bajar la cabeza y espera otro medio
    // segundo, o sea dos segundos y medio largos. Con 40 vueltas de 55 ms se
    // quedaba justo en el filo y fallaba en cuanto el navegador iba lento.
    const estados = new Set();
    const texturas = new Set();
    for (let i = 0; i < 100; i += 1) {
      estados.add(vaca.estado);
      texturas.add(vaca.texture.key);
      await new Promise((r) => setTimeout(r, 55));
      if (vaca.estado === 'embiste') break;
    }
    estados.add(vaca.estado);
    texturas.add(vaca.texture.key);

    // y se le pisa como a cualquier bicho
    const antes = j.enemigosVencidos;
    for (let i = 0; i < 26 && !vaca.derribada; i += 1) {
      j.setPosition(vaca.x, vaca.body.top - 44);
      j.body.setVelocity(0, 260);
      await new Promise((r) => setTimeout(r, 50));
    }
    // y se cae al suelo, no se queda flotando
    await new Promise((r) => setTimeout(r, 500));

    return {
      estados: [...estados],
      texturas: [...texturas],
      vencidosAntes: antes,
      vencidosDespues: j.enemigosVencidos,
      derribada: vaca.derribada,
      texturaFinal: vaca.texture.key,
      apoyada: Math.round(vaca.body.bottom) === suelo,
    };
  });

  expect(resultado.estados).toContain('trota');
  expect(resultado.estados).toContain('avisa');
  expect(resultado.estados).toContain('embiste');
  // el trote se anima: las dos poses de andar salen
  expect(resultado.texturas).toContain('tex-vaca-anda1');
  expect(resultado.texturas).toContain('tex-vaca-anda2');
  expect(resultado.texturas).toContain('tex-vaca-avisa');
  expect(resultado.derribada).toBe(true);
  expect(resultado.texturaFinal).toBe('tex-vaca-tumbada');
  expect(resultado.apoyada).toBe(true);
  expect(resultado.vencidosDespues).toBe(resultado.vencidosAntes + 1);
  expect(errores).toEqual([]);
});

test('la paloma también vuela a la altura del segundo piso', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const alturas = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const { PALOMA, MUNDO } = await import('/src/config/ajustes.js');
    const filas = [];
    // se le pide muchas veces: la altura es al azar, asi que se mira el reparto
    for (let i = 0; i < 200; i += 1) {
      n.proximaPaloma = 0;
      n.gestionarPalomas(1);
      const ultima = n.palomas.getChildren()[n.palomas.getChildren().length - 1];
      if (ultima) {
        filas.push(ultima.y / MUNDO.casilla);
        ultima.destroy();
      }
    }
    return {
      cuantas: filas.length,
      porArriba: filas.filter((f) => f <= PALOMA.alturaMaxFila).length,
      porElMedio: filas.filter((f) => f >= PALOMA.alturaMediaMinFila).length,
      masBaja: Math.max(...filas),
    };
  });

  expect(alturas.cuantas).toBeGreaterThan(100);
  expect(alturas.porArriba).toBeGreaterThan(20); // sigue cruzando por arriba
  expect(alturas.porElMedio).toBeGreaterThan(20); // y ahora tambien por el medio
});

test('pasarse el juego entero también apunta el puntaje', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const { borrarPuntajes, mejoresPuntajes } = await import('/src/sistemas/puntajes.js');
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    borrarPuntajes();

    window.juego.scene.stop('nivel');
    window.juego.scene.start('victoria', {
      personajeId: 'martin',
      monedas: 77,
      indiceNivel: TOTAL_NIVELES - 1,
      recogidas: 80,
      golpes: 1,
      jefesDerrotados: 5,
      enemigosVencidos: 4,
    });
    await new Promise((r) => setTimeout(r, 900));
    return { tabla: mejoresPuntajes() };
  });

  expect(resultado.tabla.length).toBe(1);
  expect(resultado.tabla[0].puntos).toBe(77);
});

test('la barra del jefe solo se ve cuando el jefe esta en cuadro', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    await new Promise((r) => setTimeout(r, 400));
    const lejos = n.jefe.chapa.visible;

    const j = n.jugadores[0];
    j.setPosition(n.jefe.x - 150, n.jefe.y);
    j.body.setVelocity(0, 0);
    await new Promise((r) => setTimeout(r, 1500));
    return { lejos, cerca: n.jefe.chapa.visible };
  });

  // al principio del tablero no se le ven los puntitos al jefe en una esquina
  expect(resultado.lejos).toBe(false);
  expect(resultado.cerca).toBe(true);
});

test('las cinco ciudades traen decorado de fondo y algo por delante', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const ciudades = await page.evaluate(async () => {
    const salida = [];
    for (let i = 0; i < 5; i += 1) {
      window.juego.scene.stop('nivel');
      window.juego.scene.start('nivel', { personajeId: 'simon', indiceNivel: i });
      await new Promise((r) => setTimeout(r, 1300));
      const n = window.juego.scene.getScene('nivel');
      const capas = n.planos.capas;
      salida.push({
        ciudad: n.datosNivel.fondo,
        detras: capas.filter((c) => c.velocidad === 0.72).length,
        delante: capas.filter((c) => c.velocidad === 1.45).length,
        // todos los de detras apoyan en la misma linea, la del suelo
        apoyos: [...new Set(capas.filter((c) => c.velocidad === 0.72).map((c) => Math.round(c.objeto.y)))],
      });
    }
    return salida;
  });

  const suelo = 9 * 32;
  ciudades.forEach((c) => {
    expect(c.detras).toBeGreaterThan(5);
    expect(c.delante).toBeGreaterThan(5);
    expect(c.apoyos.length).toBe(1);
    // apoyan en la linea del suelo, hundidos un pelin por detras
    expect(c.apoyos[0]).toBeGreaterThan(suelo);
    expect(c.apoyos[0]).toBeLessThan(suelo + 30);
  });
});

test('al salir una vaca sale su cartel de aviso', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const { AVISOS } = await import('/src/config/historia.js');
    const antes = !!n.cartelDeVaca;

    // se le fuerza la salida: el nino en medio del tablero, para que haya
    // suelo a los dos lados
    const j = n.jugadores[0];
    j.setPosition(20 * 32, 9 * 32 - 60);
    j.body.setVelocity(0, 0);
    await new Promise((r) => setTimeout(r, 600));
    n.proximaVaca = 10;

    let salio = false;
    for (let i = 0; i < 60 && !salio; i += 1) {
      await new Promise((r) => setTimeout(r, 80));
      salio = n.vacas.getChildren().some((v) => v.active);
    }
    return { antes, salio, cartel: !!n.cartelDeVaca, texto: AVISOS.vaca };
  });

  expect(resultado.antes).toBe(false); // sin vacas, sin cartel
  expect(resultado.salio).toBe(true);
  expect(resultado.cartel).toBe(true);
  expect(resultado.texto).toBe('¡CUIDADO CON LA BERRIONDA VACA!');
});

test('los textos se dibujan a la densidad del render, no a 1x', async ({ page }) => {
  // Esta se abre a densidad 3 a proposito: a 1 no probaria nada, porque
  // "resolucion 1" seria lo correcto y lo roto a la vez. Aqui no se juega, solo
  // se miran propiedades, asi que el navegador lento no estorba.
  await page.goto('/?densidad=3');
  await page.waitForFunction(() => window.juego && window.juego.isRunning, null, {
    timeout: 20000,
  });
  await esperarEscena(page, 'titulo');

  const resultado = await page.evaluate(async () => {
    const { RENDER } = await import('/src/config/ajustes.js');
    const escena = window.juego.scene.getScene('titulo');

    const t = escena.add.text(0, 0, 'prueba', { fontSize: '16px' });
    const fuente = t.texture.source[0];
    const info = {
      densidad: RENDER.densidad,
      resolucion: t.style.resolution,
      // la textura sale D veces mas grande que lo que ocupa en pantalla
      vecesMasGrande: Math.round(fuente.width / t.displayWidth),
      // y los que ya estan puestos en la pantalla, igual
      losDeLaPantalla: [
        ...new Set(
          escena.children.list.filter((o) => o.type === 'Text').map((o) => o.style.resolution),
        ),
      ],
    };
    t.destroy();
    return info;
  });

  expect(resultado.densidad).toBe(3);
  expect(resultado.resolucion).toBe(3);
  // la textura sale tres veces mas grande que lo que ocupa en pantalla: eso es
  // lo que hace que la camara, con su zoom, no tenga que estirarla
  expect(resultado.vecesMasGrande).toBe(3);
  resultado.losDeLaPantalla.forEach((r) => expect(r).toBe(3));
});

test('el marcador de victoria cabe en su panel y no pisa el menu', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const mirar = async (datos) => {
      window.juego.scene.stop('nivel');
      window.juego.scene.stop('victoria');
      window.juego.scene.start('victoria', datos);
      await new Promise((r) => setTimeout(r, 800));
      const e = window.juego.scene.getScene('victoria');
      const textos = e.children.list.filter((o) => o.type === 'Text' && o.text);
      const abajo = Math.max(...textos.map((o) => o.y + o.displayHeight / 2));
      // el panel del marcador: se pinta centrado en 172 y mide 204 de alto
      const panelAbajo = 172 + 204 / 2;
      const mensaje = textos.find((o) => o.text.startsWith('¡') && o.style.fontSize === '10px');
      return {
        abajo: Math.round(abajo),
        mensajeAbajo: mensaje ? Math.round(mensaje.y + mensaje.displayHeight / 2) : null,
        panelAbajo,
      };
    };

    return {
      final: await mirar({
        personajeId: 'martin', monedas: 128, indiceNivel: TOTAL_NIVELES - 1,
        recogidas: 140, golpes: 7, jefesDerrotados: 5, enemigosVencidos: 12,
      }),
      media: await mirar({
        personajeId: 'simon', monedas: 40, indiceNivel: 1, nombreNivel: 'Medellín',
        recogidas: 44, golpes: 2, jefesDerrotados: 1, enemigosVencidos: 3,
      }),
    };
  });

  [resultado.final, resultado.media].forEach((pantalla) => {
    // nada se sale de la pantalla por abajo
    expect(pantalla.abajo).toBeLessThan(358);
    // y la linea del mensaje se queda dentro del panel
    if (pantalla.mensajeAbajo !== null) {
      expect(pantalla.mensajeAbajo).toBeLessThan(pantalla.panelAbajo);
    }
  });
});

// ---------------------------------------------------------------------------
// LOS MANDOS TACTILES
//
// Van en su propio bloque porque piden un navegador CON pantalla tactil
// (`hasTouch`): sin eso Phaser no reparte los dedos entre varios punteros y no
// se puede correr y saltar a la vez, que es justo lo que hay que comprobar.
// ---------------------------------------------------------------------------

test.describe('con el dedo', () => {
  test.use({ hasTouch: true });

  test('los mandos tactiles mueven y saltan a la vez', async ({ page }) => {
    const errores = vigilarErrores(page);
    await entrarAlNivel(page, 'martin', '&tactil=1');

    const enPantalla = await dondeTocar(page);
    const cdp = await page.context().newCDPSession(page);
    const dedos = (tipo, puntos) =>
      cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: puntos });

    const partida = await page.evaluate(
      () => window.juego.scene.getScene('nivel').jugadores[0].y,
    );

    // los dos dedos a la vez: la palanca a la derecha y el boton de saltar
    const palanca = enPantalla(140, 288);
    const salto = enPantalla(574, 292);
    await dedos('touchStart', [{ ...palanca, id: 1 }, { ...salto, id: 2 }]);

    const medida = await page.evaluate(async (partida) => {
      const j = window.juego.scene.getScene('nivel').jugadores[0];
      let masAlto = j.y;
      let vxMax = 0;
      for (let i = 0; i < 45; i += 1) {
        masAlto = Math.min(masAlto, j.y);
        vxMax = Math.max(vxMax, j.body.velocity.x);
        await new Promise((r) => setTimeout(r, 14));
      }
      return { salto: Math.round(partida - masAlto), vxMax: Math.round(vxMax) };
    }, partida);

    await dedos('touchEnd', []);
    await page.waitForTimeout(300);
    const quieto = await page.evaluate(() =>
      Math.round(window.juego.scene.getScene('nivel').jugadores[0].body.velocity.x),
    );

    expect(medida.vxMax).toBe(210);          // corre a su velocidad de siempre
    expect(medida.salto).toBeGreaterThan(95); // y salta lo que salta con el teclado
    expect(quieto).toBe(0);                   // al soltar, se para
    expect(errores).toEqual([]);
  });

  test('el dedo tambien ataca y pausa', async ({ page }) => {
    await entrarAlNivel(page, 'simon', '&tactil=1');
    const enPantalla = await dondeTocar(page);

    const antes = await page.evaluate(() =>
      window.juego.scene.getScene('nivel').proyectilesVivos(),
    );
    const ataque = enPantalla(492, 244);
    await page.touchscreen.tap(ataque.x, ataque.y);
    await page.waitForTimeout(250);
    const despues = await page.evaluate(() =>
      window.juego.scene.getScene('nivel').proyectilesVivos(),
    );
    expect(despues).toBe(antes + 1); // Samaon ha lanzado su bloque

    const pausa = enPantalla(320, 24);
    await page.touchscreen.tap(pausa.x, pausa.y);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.juego.scene.isActive('pausa'))).toBe(true);
  });

  test('se elige personaje tocando su tarjeta', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('aventura-jugador', 'PRUEBA');
      } catch {
        /* en incognito no deja, y da igual */
      }
    });
    await abrirJuego(page, '&tactil=1');
    const enPantalla = await dondeTocar(page);
    const tocar = async (gx, gy) => {
      const p = enPantalla(gx, gy);
      await page.touchscreen.tap(p.x, p.y);
      await page.waitForTimeout(220);
    };

    await tocar(320, 200); // el titulo
    await esperarEscena(page, 'nombre');
    await tocar(500, 186 + 3 * 38 + 6); // LISTO, con el nombre ya guardado
    await esperarEscena(page, 'seleccion');

    // La tarjeta de la DERECHA es Martain (el orden es Samaon primero). Se toca
    // el dibujo, no la linea de abajo: apuntarle a 18 px con el dedo no hay
    // quien lo haga.
    await tocar(420, 188);
    await esperarEscena(page, 'relato');
    await tocar(320, 200);
    await esperarEscena(page, 'nivel');
    const quien = await page.evaluate(() => window.juego.scene.getScene('nivel').personajeId);
    expect(quien).toBe('martin');
  });

  test('en el telefono no se habla de teclas', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('aventura-jugador', 'PRUEBA');
      } catch {
        /* en incognito no deja, y da igual */
      }
    });
    await abrirJuego(page, '&tactil=1');
    const textos = () =>
      page.evaluate(() => {
        const dichos = [];
        window.juego.scene.getScenes(true).forEach((escena) => {
          escena.children.list.forEach((o) => {
            if (o.type === 'Text' && o.text) dichos.push(o.text);
          });
        });
        return dichos.join(' | ');
      });

    const enTitulo = await textos();
    expect(enTitulo).toContain('Toca para empezar');
    expect(enTitulo).not.toMatch(/Enter|Esc|Espacio|Flechas/);

    await page.keyboard.press('Enter');
    await esperarEscena(page, 'nombre');
    await page.keyboard.press('Enter'); // por si ya hay nombre guardado
    await esperarEscena(page, 'seleccion');
    await page.waitForTimeout(200);
    const enSeleccion = await textos();
    expect(enSeleccion).toContain('Toca al que quieras');
    expect(enSeleccion).not.toMatch(/Enter|Esc|Flechas/);
  });

  test('en un telefono el nombre se escribe tocando las letras', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* en incognito no deja, y da igual */
      }
    });
    await abrirJuego(page, '&tactil=1');
    await page.keyboard.press('Enter');
    await esperarEscena(page, 'nombre');
    await page.waitForTimeout(300);

    const enPantalla = await dondeTocar(page);
    const tocar = async (gx, gy) => {
      const p = enPantalla(gx, gy);
      await page.touchscreen.tap(p.x, p.y);
      await page.waitForTimeout(90);
    };

    // las filas son ABCDEFGHIJ / KLMNÑOPQRS / TUVWXYZ, de 52 px de paso
    const letra = (fila, i) => [320 - 4.5 * 52 + i * 52, 186 + fila * 38];
    await tocar(...letra(1, 2)); // M
    await tocar(...letra(0, 0)); // A
    await tocar(...letra(1, 8)); // R
    expect(await page.evaluate(() => window.juego.scene.getScene('nombre').nombre)).toBe('MAR');

    await tocar(320, 186 + 3 * 38 + 6); // BORRAR
    expect(await page.evaluate(() => window.juego.scene.getScene('nombre').nombre)).toBe('MA');

    await tocar(500, 186 + 3 * 38 + 6); // LISTO
    await esperarEscena(page, 'seleccion');
  });
});

test.describe('el telefono de pie', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('de pie sale el cartel de girar el telefono', async ({ page }) => {
    await abrirJuego(page, '&tactil=1');
    const cartel = await page.evaluate(
      () => getComputedStyle(document.querySelector('#gira')).display,
    );
    expect(cartel).toBe('flex');
  });
});

test('sin pantalla tactil no salen los mandos', async ({ page }) => {
  await entrarAlNivel(page, 'martin', '&tactil=0');
  const estado = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    return { mandos: Boolean(n.mandos), ayuda: Boolean(n.hud.ayuda) };
  });
  // en el ordenador no estorban, y la ayuda de teclado sigue en su sitio
  expect(estado.mandos).toBe(false);
  expect(estado.ayuda).toBe(true);

  // y el cartel de girar el telefono tampoco sale, aunque la ventana sea alta:
  // la consulta pide ademas que el puntero sea gordo
  const cartel = await page.evaluate(
    () => getComputedStyle(document.querySelector('#gira')).display,
  );
  expect(cartel).toBe('none');
});

test('en el ordenador se siguen diciendo las teclas', async ({ page }) => {
  await abrirJuego(page, '&tactil=0');
  const enTitulo = await page.evaluate(() =>
    window.juego.scene
      .getScenes(true)
      .flatMap((e) => e.children.list.filter((o) => o.type === 'Text' && o.text).map((o) => o.text))
      .join(' | '),
  );
  expect(enTitulo).toContain('Pulsa Enter para empezar');

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.waitForTimeout(200);
  const enSeleccion = await page.evaluate(() =>
    window.juego.scene
      .getScenes(true)
      .flatMap((e) => e.children.list.filter((o) => o.type === 'Text' && o.text).map((o) => o.text))
      .join(' | '),
  );
  expect(enSeleccion).toContain('Flechas');
  expect(enSeleccion).toContain('Enter o clic');
});
