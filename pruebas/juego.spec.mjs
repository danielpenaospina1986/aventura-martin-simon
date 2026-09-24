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

async function abrirJuego(page) {
  // densidad 1 a proposito: aqui el navegador dibuja por software, sin tarjeta
  // grafica, y con la densidad de verdad se queda en 20 fotogramas por segundo.
  // Lo que se prueba es la logica del juego, no lo nitido que se ve.
  await page.goto('/?densidad=1');
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

// titulo -> seleccion -> nivel, con el personaje pedido
async function entrarAlNivel(page, personaje = 'martin') {
  await abrirJuego(page);
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
  });
}

// Deja pasar el tiempo hasta que el jefe esta en su momento vulnerable, sea
// cual sea su truco. El Astronauta Burbuja, por ejemplo, solo se deja dar
// cuando se queda atascado tras su pisoton.
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

test('al Astronauta Burbuja no se le puede dar mientras camina', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;

    // se espera a pillarlo andando, que es cuando NO se deja
    for (let i = 0; i < 160 && jefe.estado !== 'anda'; i += 1) {
      await new Promise((r) => setTimeout(r, 55));
    }
    const antes = jefe.vidas;
    jefe.invulnerableHasta = 0;
    n.golpearJefe(jefe.x - 40);
    // Se mira su ESTADO y no el nombre de la clase: al compilar, los nombres se
    // acortan y la prueba dejaria de valer contra el juego publicado.
    return { estado: jefe.estado, expuesto: jefe.puedeRecibirGolpe(), antes, despues: jefe.vidas };
  });

  expect(resultado.estado).toBe('anda');
  expect(resultado.expuesto).toBe(false);
  expect(resultado.despues).toBe(resultado.antes); // el golpe rebota
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
  await page.waitForTimeout(600);

  // el jefe pierde una vida pero sigue en pie: lo que se rompe es el bloque
  const despues = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    return { existe: !!n.jefe, activo: n.jefe ? n.jefe.active : false, vidas: n.jefe ? n.jefe.vidas : 0 };
  });
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
    await new Promise((r) => setTimeout(r, 1700));

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
    await new Promise((r) => setTimeout(r, 1600));

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

test('la partida nueva empieza contando el cuento', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');

  await esperarEscena(page, 'relato');
  const primera = await page.evaluate(() => window.juego.scene.getScene('relato').texto.text);
  expect(primera).toContain('bañera');

  // las cuatro vinetas de la intro y luego la tarjeta de la ciudad
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(320);
  }
  const tarjeta = await page.evaluate(() => {
    const e = window.juego.scene.getScene('relato');
    return { titulo: e.titulo, texto: e.texto.text };
  });
  expect(tarjeta.titulo).toBe('Space Coast');
  expect(tarjeta.texto).toContain('nacieron');
});

test('Esc se salta el cuento entero y deja jugando', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');

  await esperarEscena(page, 'relato');
  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel'); // de un solo Esc, sin pasar por la tarjeta
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
