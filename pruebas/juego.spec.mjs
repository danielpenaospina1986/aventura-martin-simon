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
  //
  // Y nube 0 a proposito tambien: el tablero de puntajes de las pruebas tiene
  // que ser el del navegador y nada mas. Con la nube encendida, cada pasada de
  // la suite escribiria partidas inventadas en el tablero DE VERDAD de los
  // ninos, del que depende el premio de diciembre, y ademas se traeria los
  // puntajes reales a mitad de una medida.
  await page.goto(`/?densidad=1&nube=0${extra}`);
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
  // Ojo con el ancho: en un telefono la pantalla del juego es mas ancha de 640,
  // asi que se le pregunta al juego en vez de darlo por hecho.
  const caja = await page.evaluate(async () => {
    const { MUNDO } = await import('/src/config/ajustes.js');
    const c = document.querySelector('#juego canvas').getBoundingClientRect();
    return { x: c.x, y: c.y, w: c.width, h: c.height, ancho: MUNDO.ancho, alto: MUNDO.alto };
  });
  return (gx, gy) => ({
    x: caja.x + (gx / caja.ancho) * caja.w,
    y: caja.y + (gy / caja.alto) * caja.h,
  });
}

// Donde cae la tarjeta del mundo. Ahora se ensena UNA sola, grande, y se pasa
// de una a otra deslizando: se le pregunta a la escena en vez de repetir aqui
// las cuentas.
async function sitioDeLaTarjeta(page) {
  return page.evaluate(() => {
    const e = window.juego.scene.getScene('mundos');
    return { x: e.marco.x, y: e.marco.y, mundo: e.indice };
  });
}

// Donde esta cada boton tactil, preguntandoselo al juego: sus sitios dependen
// del ancho de la pantalla.
// Cuantos mundos hay, preguntandoselo al juego: van creciendo.
async function cuantosMundos(page) {
  return page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    return TOTAL_NIVELES;
  });
}

async function sitiosTactiles(page) {
  const sitios = await page.evaluate(async () => {
    const { sitiosDeLosBotones } = await import('/src/sistemas/tactil.js');
    const { MUNDO } = await import('/src/config/ajustes.js');
    return sitiosDeLosBotones(MUNDO.ancho);
  });
  return Object.fromEntries(sitios.map((s) => [s.nombre, s]));
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

  // Entre el personaje y el tablero se elige mundo. Aqui se entra siempre al
  // primero, que es el que viene marcado.
  await esperarEscena(page, 'mundos');
  await page.keyboard.press('Enter');

  // Y entre la eleccion y el tablero va la resena; Esc la salta.
  await esperarEscena(page, 'relato');
  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');
  // Se espera a que el nino haya ATERRIZADO, no 600 ms de reloj. Nace un poco
  // por encima del suelo y cae; con la maquina lenta en 600 ms todavia venia
  // bajando, y cualquier prueba que mirase su estado nada mas entrar se
  // encontraba con que NO estaba en el suelo. Esperar el aterrizaje cubre
  // ademas el fundido de entrada, que es lo que ese reloj queria cubrir.
  await page.waitForFunction(
    () => {
      const n = window.juego.scene.getScene('nivel');
      return Boolean(n && n.jugadores && n.jugadores[0] && n.jugadores[0].body.blocked.down);
    },
    null,
    { timeout: 20000 },
  );

  // Se apaga el azar de los regalos: unos bichos sueltan corazon en vez de
  // monedas, y con eso suelto no hay forma de medir cuanto da un bicho.
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    n.probabilidadCorazon = 0;
    n.probabilidadVidaExtra = 0;
    // Y no entran vacas ni palomas por su cuenta: cruzan solas y, en una
    // prueba que mide monedas, saltos o golpes, meterian ruido sin avisar. Un
    // golpe de paloma en mitad de un salto cambia la medida entera. Las pruebas
    // que SI quieren una se la traen ellas.
    n.proximaVaca = Number.MAX_SAFE_INTEGER;
    n.proximaPaloma = Number.MAX_SAFE_INTEGER;
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
  await esperarEscena(page, 'mundos');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/04-mundos.png` });

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'relato');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/05-relato.png` });

  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${CAPTURAS}/06-nivel.png` });

  expect(errores).toEqual([]);
});

test('el jugador corre y salta con la altura prevista', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const inicio = await estadoJugador(page);
  expect(inicio.enSuelo).toBe(true);

  // Se juega DESDE DENTRO. Pedirle a Playwright que pulse o suelte una tecla
  // cuesta un viaje de ida y vuelta, y con la maquina cargada ese viaje dura
  // varios fotogramas: se leia la velocidad cuando el nino ya habia frenado, o
  // se soltaba el salto mucho despues de lo pedido. `tocar` es la misma puerta
  // por la que entran los mandos tactiles, asi que al juego le da exactamente
  // igual de donde le llegue.
  const medido = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const c = j.controles;
    const espera = () => new Promise((r) => setTimeout(r, 8));

    // Correr. Se mira la velocidad que ALCANZA, no cuanto recorre en un tiempo
    // de reloj: en una maquina lenta el juego va a menos fotogramas por segundo
    // y recorreria menos, y la prueba fallaria sin que el juego este mal.
    const partidaX = j.x;
    c.tocar('derecha', true);
    let velocidad = 0;
    for (let i = 0; i < 600 && velocidad < 210; i += 1) {
      velocidad = Math.max(velocidad, Math.round(j.body.velocity.x));
      await espera();
    }
    const avanzo = j.x - partidaX;
    c.tocar('derecha', false);
    for (let i = 0; i < 600 && Math.abs(j.body.velocity.x) > 1; i += 1) await espera();

    // Saltar sin soltar: se sigue la subida hasta el punto mas alto, en vez de
    // mirar la altura en un instante fijo.
    const partidaY = j.y;
    let masAlto = j.y;
    c.tocar('saltar', true);
    for (let i = 0; i < 1200; i += 1) {
      masAlto = Math.min(masAlto, j.y);
      if (j.body.velocity.y >= 0 && partidaY - j.y > 10) break;
      await espera();
    }
    const altura = partidaY - masAlto;
    c.tocar('saltar', false);
    for (let i = 0; i < 1200 && !j.body.blocked.down; i += 1) await espera();

    return { velocidad, avanzo, altura, enSuelo: j.body.blocked.down };
  });

  expect(medido.velocidad).toBe(210); // la velocidad de ajustes.js
  expect(medido.avanzo).toBeGreaterThan(0);
  expect(medido.altura).toBeGreaterThan(95);
  expect(medido.altura).toBeLessThan(130);
  expect(medido.enSuelo).toBe(true);

  expect(errores).toEqual([]);
});

test('el salto corto sube menos que el salto largo', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  // Igual que el de arriba, y aqui el viaje de ida y vuelta era MORTAL: el
  // juego no recorta el salto en el mismo fotograma en que se salta
  // (`puedeRecortar`), para que un toque cortisimo de un saltito de verdad. Si
  // la orden de soltar tarda varios fotogramas en llegar, el salto "corto" se
  // soltaba ya llegando arriba y median los dos lo mismo.
  const medir = (subidaAntesDeSoltar) =>
    page.evaluate(async (umbral) => {
      const j = window.juego.scene.getScene('nivel').jugadores[0];
      const c = j.controles;
      const espera = () => new Promise((r) => setTimeout(r, 8));
      const partida = j.y;
      let masAlto = j.y;
      let soltado = false;

      c.tocar('saltar', true);
      for (let i = 0; i < 1200; i += 1) {
        masAlto = Math.min(masAlto, j.y);
        const subido = partida - j.y;
        // Se suelta cuando ha SUBIDO lo que se le pide. Lo de "o ya va bajando"
        // le exige haber despegado: de pie la velocidad vertical tambien es
        // cero, y sin eso soltaria antes de empezar a subir.
        if (!soltado && (subido >= umbral || (subido > 6 && j.body.velocity.y >= 0))) {
          c.tocar('saltar', false);
          soltado = true;
        }
        if (soltado && subido > 6 && j.body.velocity.y >= 0) break;
        await espera();
      }
      c.tocar('saltar', false);

      // A tierra antes del siguiente salto: si el segundo sale con el nino
      // todavia en el aire, no se mide un salto.
      for (let i = 0; i < 1200 && !j.body.blocked.down; i += 1) await espera();
      return partida - masAlto;
    }, subidaAntesDeSoltar);

  // El corto se suelta en cuanto ha despegado; el largo se aguanta hasta
  // arriba, que es lo que de verdad se quiere comparar.
  const corto = await medir(10);
  const largo = await medir(9999);
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

  // Se esperan los SUCESOS: que el bloque salga y que se deshaga. Esperar 100
  // ms de reloj a que salga y 1200 a que se rompa es echarlo a suertes: con la
  // suite entera por delante el navegador va lento, y el bloque no habia salido
  // todavia cuando se le preguntaba.
  const cuantosBloques = (cuantos) =>
    page.waitForFunction(
      (n) => window.juego.scene.getScene('nivel').proyectiles.getChildren().length === n,
      cuantos,
      { timeout: 15000 },
    );

  await page.keyboard.press('KeyX');
  await cuantosBloques(1);

  // y solo se va cuando toca el suelo, no antes
  await cuantosBloques(0);
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
      const antes = n.jefe.vidas;
      n.jefe.invulnerableHasta = 0; // sin esperar el parpadeo
      j.setPosition(n.jefe.x, n.jefe.body.top - 70);
      j.body.setVelocity(0, 140);

      // Se espera a que el golpe CUENTE, no 420 ms de reloj. Con la suite
      // entera por delante el navegador va lento, la caida no habia llegado a
      // tocar al jefe y ese golpe se perdia: al final quedaba en pie y la
      // prueba fallaba sin que el juego estuviera mal.
      for (let i = 0; i < 200 && n.jefe && n.jefe.active && n.jefe.vidas === antes; i += 1) {
        await new Promise((r) => setTimeout(r, 25));
      }
    });
  };

  // Se le salta encima HASTA QUE CAE, no exactamente `vidas` veces.
  //
  // Dando los golpes contados, si uno se pierde —y se pierde: el salto espera
  // a que el golpe cuente, pero con un tope, y con la maquina al doble de lenta
  // ese tope se agota— el jefe se queda en pie con una vida y la espera final
  // revienta. Con unos cuantos intentos de mas, un golpe perdido se recupera
  // solo. El bucle para en cuanto el jefe ya no esta, asi que no cuesta tiempo
  // cuando todo va bien.
  const vidas = await page.evaluate(() => window.juego.scene.getScene('nivel').jefe.vidas);
  const sigueEnPie = () =>
    page.evaluate(() => Boolean(window.juego.scene.getScene('nivel').jefe));
  for (let i = 0; i < vidas + 6; i += 1) {
    if (!(await sigueEnPie())) break;
    await saltarEncima();
  }
  await page.waitForFunction(() => !window.juego.scene.getScene('nivel').jefe, null, {
    timeout: 20000,
  });

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
      // Lo que tira ESTE jefe, sea quien sea. Lo que se prueba aqui es la
      // mecanica —sale, vuela, se estrella y deja de hacer dano—, no el dibujo:
      // esta pelea la comparten dos jefes y pueden cambiar de ciudad.
      suya: { sale: n.jefe.municion.quieta, rota: n.jefe.municion.seRompe },
    };
  });

  expect(resultado.alSalir.textura).toBe(resultado.suya.sale);
  expect(resultado.alSalir.cuerpo).toBe(true);
  expect(resultado.estrellado).toBe(true);
  expect(resultado.textura).toBe(resultado.suya.rota);
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

  const antes = await page.evaluate(
    () => window.juego.scene.getScene('nivel').jefe.vidas,
  );

  // El bloque tarda lo suyo en cruzar los 190 px, y la ventana del jefe dura lo
  // que dura: si se cierra por el camino, el golpe rebota con un ¡clonc! y esa
  // tirada se pierde. Con la maquina cargada eso pasa a menudo, asi que se
  // prueba en VARIAS ventanas en vez de jugarselo todo a la primera.
  let despues = null;
  for (let intento = 0; intento < 6 && !despues; intento += 1) {
    await esperarJefeExpuesto(page);
    await page.evaluate(() => {
      const n = window.juego.scene.getScene('nivel');
      const j = n.jugadores[0];
      j.setPosition(n.jefe.x - 190, j.y);
      j.body.setVelocity(0, 0);
      j.mirando = 1;
    });
    await page.keyboard.press('KeyX');

    // Se espera al SUCESO (que le baje una vida) y no a un tiempo de reloj.
    const estado = await page.evaluate(async (antes) => {
      const n = window.juego.scene.getScene('nivel');
      for (let i = 0; i < 60 && n.jefe && n.jefe.vidas === antes; i += 1) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return {
        existe: !!n.jefe,
        activo: n.jefe ? n.jefe.active : false,
        vidas: n.jefe ? n.jefe.vidas : 0,
      };
    }, antes);
    if (estado.vidas !== antes) despues = estado;
  }

  expect(despues, 'el bloque no le llego a bajar ninguna vida').not.toBeNull();
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
    // El tablero montado, no un tiempo de reloj (ver la prueba de la sombrilla).
    // Y se mira que sea EL DE ATLANTA: con solo preguntar si hay jefe, se
    // pillaba el del tablero anterior, que todavia no se habia apagado, y lo
    // que se media era el jefe de otra ciudad. Estuvo escondido hasta que los
    // dos jefes dejaron de tener las mismas vidas.
    for (let i = 0; i < 80; i += 1) {
      const e = window.juego.scene.getScene('nivel');
      if (e && e.indiceNivel === 2 && e.jefe && e.jefe.active) break;
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

    // Se apunta POR QUE ESTADOS PASA, en vez de mirar el que tenga en dos
    // instantes fijos de reloj. La banera hace carga, lanza y vuelve a andar:
    // con la maquina cargada, a los 850 ms ya habia terminado y se la pillaba
    // en 'anda'. Eso no es un fallo del juego, es haber llegado tarde a mirar.
    const pasoPor = new Set();
    let peligros = 0;
    for (let i = 0; i < 400; i += 1) {
      pasoPor.add(banera.estado);
      peligros = Math.max(
        peligros,
        n.peligros.getChildren().filter((p) => p.active).length,
      );
      if (pasoPor.has('carga') && pasoPor.has('lanza') && peligros >= 1) break;
      await new Promise((r) => setTimeout(r, 15));
    }
    return { pasoPor: [...pasoPor], peligros };
  });

  expect(resultado.pasoPor).toContain('carga');
  expect(resultado.pasoPor).toContain('lanza');
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

  // Ya no hay vinetas de apertura, pero si una pantalla para elegir mundo.
  await esperarEscena(page, 'mundos');
  await page.keyboard.press('Enter');
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
  await esperarEscena(page, 'mundos');
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

test('derrotar al jefe da el premio de su mundo', async ({ page }) => {
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

  const resultado = await page.evaluate(async () => {
    const { premioDeJefe } = await import('/src/config/ajustes.js');
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    return {
      monedas: j.monedas,
      jefes: j.jefesDerrotados,
      deJefes: j.puntosDeJefes,
      jefe: !!n.jefe,
      premio: premioDeJefe(n.indiceNivel),
    };
  });

  expect(resultado.jefe).toBe(false);
  expect(resultado.jefes).toBe(1);
  // el de Space Coast paga 100, que es el premio gordo de la partida
  expect(resultado.premio).toBe(100);
  expect(resultado.monedas).toBe(monedasAntes + resultado.premio);
  expect(resultado.deJefes).toBe(resultado.premio);
});

test('todos los niveles cargan con su jefe y sus tres checkpoints', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');
  const TOTAL = await cuantosMundos(page);

  for (let indice = 0; indice < TOTAL; indice += 1) {
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
  await page.screenshot({ path: `${CAPTURAS}/07-victoria.png` });
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
  // El Abuelo vive en LA FINCA (el mundo 8), no en Medellin: los jefes se
  // colocaron por donde vive cada uno.
  await entrarALaArena(page, 7);

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

test('a Martín Malvado solo se le da cuando baja de la torre', async ({ page }) => {
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

  expect(resultado.clase).toBe('MartinMalvado');
  expect(resultado.torres).toBeGreaterThanOrEqual(2);
  expect(resultado.enAlto).toBeGreaterThan(0); // que de verdad estuvo arriba
  expect(resultado.deFrenteEnAlto).toBe(0); // y que ahi no se le hizo nada
  expect(resultado.vidas).toBe(resultado.vidasAntes - 1);
  expect(errores).toEqual([]);
});

test('a Jean Luke solo se le da mientras rebusca en su balde', async ({ page }) => {
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

    // de espaldas, agachado sobre el balde, si
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

  expect(resultado.clase).toBe('JeanLuke');
  expect(resultado.deCara).toBeGreaterThan(0);
  expect(resultado.contaronDeCara).toBe(0);
  expect(resultado.vidas).toBe(resultado.vidasAntes - 1);
  expect(errores).toEqual([]);
});

test('cada ciudad tiene su jefe, y los cinco primeros su propio truco', async ({ page }) => {
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
    'SimonMalvado', 'PapaInodoro', 'DonaZully', 'MartinMalvado', 'JeanLuke',
  ]);
  // ninguno es el provisional, y todos aguantan mas de un golpe
  jefes.forEach((j) => expect(j.vidas).toBeGreaterThan(2));
});

test('desde el suelo se le llega a la coronilla al jefe, en todas las ciudades', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const medidas = await page.evaluate(async () => {
    const { ALCANCE, MUNDO } = await import('/src/config/ajustes.js');
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    // hasta donde llegan los pies del nino con un salto desde el suelo
    const pies = suelo - ALCANCE.alturaSaltoPx;

    const salida = [];
    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      await new Promise((r) => setTimeout(r, 1300));
      const n = window.juego.scene.getScene('nivel');
      // El techo de su caja, contado desde el suelo: asi da igual donde ande el
      // jefe en ese momento (Martin Malvado, por ejemplo, se sube a sus torres).
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
  //
  // Necesita mas tiempo del de casa: son cinco ciudades por cuatro carrerillas,
  // cada una con su salto entero en tiempo de reloj. Con el minuto por defecto
  // se quedaba al filo, y en cuanto la maquina iba cargada se pasaba.
  test.setTimeout(180000);
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
      // algo": Martin Malvado se pasa la pelea saltando, y pillandolo sobre la
      // plataforma de su arena el nino no salta al jefe, salta a la plataforma.
      const { MUNDO } = await import('/src/config/ajustes.js');
      const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
      n.jefe.puedeRecibirGolpe = () => true;
      n.jefe.actualizar = () => {};
      n.jefe.body.setAllowGravity(false);
      n.jefe.body.setVelocity(0, 0);
      // Se le planta en el suelo del tablero: Martin Malvado se pasa la pelea
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
        // Se despeja lo que el jefe haya dejado por el suelo: un pegote de
        // relleno rodando por la carrerilla congela al nino a media zancada
        // y se pierde el salto.
        [n.rellenos, n.tirosDeJefe, n.heladitos, n.chorros, n.peligros].forEach((g) => {
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

test('se elige a que mundo ir, y se entra a ese', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'mundos');

  // todos estan abiertos desde el principio, sin desbloquear nada: hay un
  // puntito por mundo, y se puede llegar a cualquiera
  const cuantos = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    return {
      puntitos: window.juego.scene.getScene('mundos').puntitos.length,
      niveles: TOTAL_NIVELES,
    };
  });
  expect(cuantos.puntitos).toBe(cuantos.niveles);
  expect(cuantos.niveles).toBeGreaterThanOrEqual(8);

  // tres a la derecha: Miami
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
  }
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'relato');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nivel');

  const donde = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    return { ciudad: n.datosNivel.fondo, indice: n.indiceNivel };
  });
  expect(donde.indice).toBe(3);
  expect(donde.ciudad).toBe('miami');
});

test('la pantalla de mundos ensena uno solo, y dice por cual va', async ({ page }) => {
  // Lo pidio Daniel despues de probarlo en el telefono: con ocho mundos en
  // rejilla, cada tarjeta se quedaba en 104 x 68 px y no habia forma ni de
  // verlas ni de acertarles con el dedo.
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'mundos');

  const alEntrar = await page.evaluate(async () => {
    const { MUNDO } = await import('/src/config/ajustes.js');
    const e = window.juego.scene.getScene('mundos');
    return {
      dice: e.cuenta.text,
      nombre: e.nombre.text,
      // la tarjeta ocupa de verdad la pantalla, no es una estampilla
      anchoTarjeta: Math.round(e.marco.width),
      anchoPantalla: MUNDO.ancho,
      flechas: e.flechas.length,
      puntitos: e.puntitos.length,
    };
  });

  expect(alEntrar.dice).toBe('Mundo 1 de 8');
  expect(alEntrar.nombre).toBe('Space Coast');
  // mas de la mitad del ancho de la pantalla: eso es "grande"
  expect(alEntrar.anchoTarjeta).toBeGreaterThan(alEntrar.anchoPantalla / 2);
  expect(alEntrar.flechas).toBe(2);
  expect(alEntrar.puntitos).toBe(8);

  // Las flechas del teclado pasan de mundo. Se espera A QUE LLEGUE, no a un
  // tiempo de reloj: pulsar y leer de seguido es echarlo a suertes, porque la
  // tecla tarda lo que tarda en llegarle al juego. Es lo mismo que ya hace
  // `entrarAlNivel` con la flecha de la seleccion de personaje.
  const irHasta = async (tecla, cual) => {
    await page.keyboard.press(tecla);
    await page.waitForFunction(
      (k) => window.juego.scene.getScene('mundos').indice === k,
      cual,
      { timeout: 10000 },
    );
    // El juego ignora A PROPOSITO un cambio que llegue a menos de 90 ms del
    // anterior (ver ESPERA_ENTRE_MUNDOS): hace falta porque Phaser puede
    // entregar un mismo keydown varias veces. Aqui se le deja pasar esa ventana
    // antes de la siguiente tecla; si no, la siguiente se perderia. No es
    // esperar una carrera, es respetar una regla del juego.
    await page.waitForTimeout(120);
  };

  await irHasta('ArrowRight', 1);
  await irHasta('ArrowRight', 2);
  const trasDos = await page.evaluate(() => {
    const e = window.juego.scene.getScene('mundos');
    return { dice: e.cuenta.text, nombre: e.nombre.text };
  });
  expect(trasDos.dice).toBe('Mundo 3 de 8');
  expect(trasDos.nombre).toBe('Atlanta');

  // y hacia atras desde el primero se da la vuelta al ultimo
  await page.evaluate(() => window.juego.scene.getScene('mundos').mostrar(0));
  await irHasta('ArrowLeft', 7);
  const dandoLaVuelta = await page.evaluate(
    () => window.juego.scene.getScene('mundos').cuenta.text,
  );
  expect(dandoLaVuelta).toBe('Mundo 8 de 8');
});

test('una sola pulsacion mueve UN mundo, no cuatro', async ({ page }) => {
  // Esto se rompio de verdad y no era cosa de las pruebas: en Phaser 4 un
  // `keydown-X` puede llegar VARIAS VECES por una sola pulsacion. El plugin de
  // teclado encola los eventos del navegador y los vacia en su `update()`, y al
  // SOLTAR la tecla provoca otro vaciado que vuelve a emitir el keydown ya
  // procesado. Medido con la pila de llamadas: una pulsacion llegaba a mover
  // cinco mundos, y el numero cambiaba en cada intento.
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'mundos');

  // se cuentan los keydown que le llegan al NAVEGADOR, para poder comparar
  await page.evaluate(() => {
    window.__teclas = 0;
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'ArrowRight') window.__teclas += 1;
      },
      true,
    );
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);

  const tras = await page.evaluate(() => ({
    indice: window.juego.scene.getScene('mundos').indice,
    teclas: window.__teclas,
  }));

  // una tecla, un mundo
  expect(tras.teclas).toBe(1);
  expect(tras.indice).toBe(1);
});

test('se puede volver a elegir mundo una segunda vez, sin quedarse colgado', async ({ page }) => {
  // El bug que conto Daniel: jugaba, pausaba, se salia a "Cambiar personaje",
  // elegia mundo... y la pantalla no respondia. No entraba a ninguno.
  //
  // La culpa era de `yendo`, la bandera que evita que un doble clic arranque dos
  // partidas: Phaser REUTILIZA la instancia de la escena, y el `init` no la
  // volvia a poner en false. Asi que la primera vez funcionaba y de la segunda
  // en adelante `empezar()` se salia por la primera linea, en silencio.
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');

  // --- PRIMERA vez: se entra a un mundo ---
  await esperarEscena(page, 'mundos');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'relato');
  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');

  // --- se pausa y se sale a cambiar personaje ---
  await page.evaluate(() => window.juego.scene.getScene('nivel').pausar());
  await esperarEscena(page, 'pausa');
  await page.evaluate(() => window.juego.scene.getScene('pausa').salirA('seleccion'));
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');

  // --- SEGUNDA vez: tiene que dejar entrar igual ---
  await esperarEscena(page, 'mundos');
  const alVolver = await page.evaluate(() => window.juego.scene.getScene('mundos').yendo);
  expect(alVolver).toBe(false); // la bandera se rearma al volver a entrar

  await page.keyboard.press('Enter');
  // si la pantalla se quedo muerta, esto se queda esperando y falla
  await esperarEscena(page, 'relato');
  await page.keyboard.press('Escape');
  await esperarEscena(page, 'nivel');

  const jugando = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    return Boolean(n && n.jugadores && n.jugadores[0]);
  });
  expect(jugando).toBe(true);
});

test('las flechas de los lados cambian de mundo con un clic', async ({ page }) => {
  await abrirJuego(page);
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nombre');
  await page.keyboard.type('Prueba', { delay: 20 });
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'mundos');

  const donde = await dondeTocar(page);
  const sitios = await page.evaluate(() =>
    window.juego.scene
      .getScene('mundos')
      .flechas.map((f) => ({ x: f.disco.x, y: f.disco.y, hacia: f.haciaDonde })),
  );

  // Igual que con el teclado: se espera a que LLEGUE al mundo, y despues se
  // deja pasar la ventana de 90 ms que el juego ignora a proposito.
  const esperarMundo = async (cual) => {
    await page.waitForFunction(
      (k) => window.juego.scene.getScene('mundos').indice === k,
      cual,
      { timeout: 10000 },
    );
    await page.waitForTimeout(120);
  };

  const derecha = sitios.find((f) => f.hacia > 0);
  const p = donde(derecha.x, derecha.y);
  await page.mouse.click(p.x, p.y);
  await esperarMundo(1);

  // y la de la izquierda vuelve
  const izquierda = sitios.find((f) => f.hacia < 0);
  const q = donde(izquierda.x, izquierda.y);
  await page.mouse.click(q.x, q.y);
  await esperarMundo(0);
});

test('cada mundo tiene SU bicho embistiendo, con sus propios dibujos', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const salio = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const { TEXTURAS } = await import('/src/config/estilo.js');
    const fuera = [];

    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      for (let v = 0; v < 150; v += 1) {
        const e = window.juego.scene.getScene('nivel');
        if (e && e.indiceNivel === i && e.nivel) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const n = window.juego.scene.getScene('nivel');

      // se sueltan varios, que donde hay variantes se echa a suertes
      const pieles = new Set();
      let dibujoBueno = true;
      for (let k = 0; k < 10; k += 1) {
        n.proximaVaca = 0;
        n.gestionarVacas(1);
        const hijos = n.vacas.getChildren();
        const ultima = hijos[hijos.length - 1];
        if (ultima) {
          pieles.add(ultima.piel);
          // y sale con SU dibujo, no con el de la vaca
          if (ultima.texture.key !== TEXTURAS.bichoDe(ultima.piel, 'anda1')) dibujoBueno = false;
          ultima.destroy();
        }
        await new Promise((r) => setTimeout(r, 15));
      }
      fuera.push({ ciudad: n.datosNivel.fondo, pieles: [...pieles].sort(), dibujoBueno });
    }
    return fuera;
  });

  const porCiudad = Object.fromEntries(salio.map((s) => [s.ciudad, s.pieles]));

  // Cada mundo, el suyo. La vaca de siempre se queda SOLO en la finca, que es
  // de donde salio el cuento.
  expect(porCiudad['space-coast']).toEqual(['vaca-marciana']);
  expect(porCiudad.atlanta).toEqual(['alma']);
  expect(porCiudad.miami).toEqual(['melo']);
  expect(porCiudad.orlando).toEqual(['vagoneta']);
  expect(porCiudad['lake-lanier']).toEqual(['alma']);
  expect(porCiudad.finca).toEqual(['vaca']);

  // Medellin y Cartagena tienen varias y las sortean: en diez tiradas tienen
  // que haber salido por lo menos dos distintas.
  expect(porCiudad.medellin.length).toBeGreaterThan(1);
  porCiudad.medellin.forEach((p) => expect(p).toMatch(/^bus-/));
  expect(porCiudad.cartagena.length).toBeGreaterThan(1);
  porCiudad.cartagena.forEach((p) => expect(p).toMatch(/^clasico-/));

  // y ninguno sale con el dibujo de otro
  salio.forEach((s) => expect(s.dibujoBueno).toBe(true));
  expect(errores).toEqual([]);
});

// Va a un mundo por su numero y espera a que ESTE montado, mirando que el
// tablero que hay puesto sea de verdad el suyo. No vale esperar un tiempo de
// reloj: con la maquina cargada el tablero no ha llegado a montarse.
async function irAlMundo(page, indice, ciudad) {
  await page.evaluate((i) => {
    window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
  }, indice);
  await page.waitForFunction(
    (c) => {
      const n = window.juego.scene.getScene('nivel');
      return Boolean(
        n && n.datosNivel && n.datosNivel.fondo === c && n.sys.settings.status === 5 && n.jefe,
      );
    },
    ciudad,
    { timeout: 20000 },
  );
}

test('los ocho mundos tienen su fondo y su jefe propios, sin obra ninguna', async ({
  page,
}) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const mundos = await page.evaluate(async () => {
    const { TEXTURAS } = await import('/src/config/estilo.js');
    const { jefeDelCuento } = await import('/src/config/historia.js');
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const salida = [];

    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      // se espera a que el tablero ESTE, no un tiempo de reloj
      for (let v = 0; v < 150; v += 1) {
        const n = window.juego.scene.getScene('nivel');
        if (n && n.jefe && n.datosNivel && n.indiceNivel === i) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const n = window.juego.scene.getScene('nivel');
      salida.push({
        ciudad: n.datosNivel.fondo,
        clase: n.jefe ? n.jefe.constructor.name : null,
        seLlama: jefeDelCuento(n.datosNivel.fondo).nombre,
        // "en obra" = no tiene fondo propio, asi que se le pinta la obra
        enObra: !window.juego.textures.exists(TEXTURAS.fondoDe(n.datosNivel.fondo)),
        // y su jefe sale con SU dibujo, no con el de otro
        suDibujo: n.jefe ? n.jefe.texture.key : null,
      });
    }
    return salida;
  });

  expect(mundos.map((m) => m.ciudad)).toEqual([
    'space-coast', 'medellin', 'atlanta', 'miami', 'cartagena',
    'orlando', 'lake-lanier', 'finca',
  ]);

  // Ya no queda ningun mundo en obra: los ocho tienen su ilustracion.
  mundos.forEach((m) => {
    expect(m.enObra).toBe(false);
    expect(m.clase).not.toBeNull();
  });

  // Y cada uno tiene SU clase de jefe, ninguna repetida. El orden es el de
  // DONDE VIVE cada uno, no el de cuando se dibujaron.
  expect(mundos.map((m) => m.clase)).toEqual([
    'SimonMalvado', 'PapaInodoro', 'DonaZully', 'MartinMalvado', 'JeanLuke',
    'TioCamilo', 'Chad', 'Abuelo',
  ]);

  // Y —esto es lo que se cuela al mudar un jefe— con SU nombre, no con el del
  // que estaba antes en esa ciudad: el nombre vive en historia.js, que va por
  // ciudad y no por clase, asi que hay que mudarlo con el.
  expect(mundos.map((m) => m.seLlama)).toEqual([
    'Simón Malvado', 'Papá Inodoro', 'Doña Zully', 'Martín Malvado', 'Jean Luke',
    'el Tío Camilo', 'Chad', 'el Abuelo',
  ]);

  expect(errores).toEqual([]);
});

test('ningun jefe usa un dibujo que no sea suyo, en ninguna pose', async ({ page }) => {
  test.setTimeout(180000); // ocho ciudades, y a cada jefe hay que dejarle pelear
  // El fallo que conto Daniel: en Space Coast sale Simon Malvado, pero en
  // varias poses se veia a Papa Inodoro. `texturaDeAhora()` si estaba
  // parametrizada, pero habia CUATRO `setTexture` escritos a mano dentro de los
  // metodos que cambian de estado (escupir, enojarse, embestir, aturdirse), y
  // esos se quedaron apuntando al jefe original. Como los dos comparten pelea,
  // no daba ningun error: solo salia el muneco equivocado.
  //
  // Todos los dibujos de un jefe se llaman `tex-FAMILIA-pose`, asi que la regla
  // es facil de comprobar: se le deja pelear de verdad y TODO lo que se ponga
  // tiene que ser de UNA sola familia.
  await entrarAlNivel(page, 'martin');

  const revoltijo = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const familiaDe = (clave) => String(clave).split('-')[1] || String(clave);
    const malos = [];

    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      for (let v = 0; v < 200; v += 1) {
        const e = window.juego.scene.getScene('nivel');
        if (e && e.indiceNivel === i && e.jefe) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const n = window.juego.scene.getScene('nivel');
      const jefe = n.jefe;
      if (!jefe) continue;

      // se le planta el nino delante, que si no el jefe no pelea
      const j = n.jugadores[0];
      j.setPosition(jefe.x - 170, jefe.y);
      j.body.setVelocity(0, 0);

      const vistos = new Set();
      for (let k = 0; k < 240; k += 1) {
        if (jefe.active && jefe.texture) vistos.add(jefe.texture.key);
        await new Promise((r) => setTimeout(r, 40));
      }

      const familias = [...new Set([...vistos].map(familiaDe))];
      if (familias.length > 1) {
        malos.push({ ciudad: n.datosNivel.fondo, jefe: jefe.constructor.name, familias });
      }
    }
    return malos;
  });

  expect(revoltijo).toEqual([]);
});

test('los tres jefes nuevos tiran lo suyo, no lo del jefe del que heredan', async ({ page }) => {
  // Los tres heredan la pelea de otro, asi que lo que hay que vigilar es que no
  // se les haya quedado la municion del original.
  await entrarAlNivel(page, 'martin');

  const mirar = async (indice, ciudad, comoLanza) => {
    await irAlMundo(page, indice, ciudad);
    return page.evaluate(
      async ({ comoLanza }) => {
        const n = window.juego.scene.getScene('nivel');
        const j = n.jugadores[0];
        j.setPosition(n.jefe.x - 520, j.y);
        j.body.setVelocity(0, 0);
        const tiro = n[comoLanza](n.jefe, n.jefe.direccion);
        return {
          jefe: n.jefe.constructor.name,
          golpes: n.jefe.vidasMaximas,
          tira: tiro.texture.key,
          seRompeCon: tiro.seRompeCon,
        };
      },
      { comoLanza },
    );
  };

  const camilo = await mirar(5, 'orlando', 'lanzarTiroDeJefe');
  const chad = await mirar(6, 'lake-lanier', 'lanzarRelleno');
  const simon = await mirar(0, 'space-coast', 'escupirHeladito');

  expect(camilo.jefe).toBe('TioCamilo');
  expect(camilo.tira).toBe('tex-balon');
  expect(camilo.seRompeCon).toBe('tex-balon-revienta');
  expect(camilo.golpes).toBe(6);

  expect(chad.jefe).toBe('Chad');
  expect(chad.tira).toBe('tex-panqueque');
  expect(chad.seRompeCon).toBe('tex-panqueque-splat');
  expect(chad.golpes).toBe(8);

  expect(simon.jefe).toBe('SimonMalvado');
  expect(simon.tira).toBe('tex-juguete1');
  expect(simon.seRompeCon).toBe('tex-juguete-splat');
  expect(simon.golpes).toBe(5);
});

test('a los jefes de siempre no se les cambio la municion al compartir pelea', async ({
  page,
}) => {
  await entrarAlNivel(page, 'martin');

  const mirar = async (indice, ciudad, comoLanza) => {
    await irAlMundo(page, indice, ciudad);
    return page.evaluate(
      async ({ comoLanza }) => {
        const n = window.juego.scene.getScene('nivel');
        const tiro = n[comoLanza](n.jefe, n.jefe.direccion);
        return { jefe: n.jefe.constructor.name, tira: tiro.texture.key };
      },
      { comoLanza },
    );
  };

  const inodoro = await mirar(1, 'medellin', 'escupirHeladito');
  const malvado = await mirar(3, 'miami', 'lanzarRelleno');
  const luke = await mirar(4, 'cartagena', 'lanzarTiroDeJefe');

  expect(inodoro.jefe).toBe('PapaInodoro');
  expect(inodoro.tira).toBe('tex-helado1');
  expect(malvado.jefe).toBe('MartinMalvado');
  expect(malvado.tira).toBe('tex-relleno');
  expect(luke.jefe).toBe('JeanLuke');
  expect(luke.tira).toBe('tex-globo');
});

test('el Tío Camilo es suyo: sus dibujos, sus balones y seis golpes', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');
  await irAlMundo(page, 5, 'orlando');

  const camilo = await page.evaluate(async () => {
    const { TEXTURAS } = await import('/src/config/estilo.js');
    const n = window.juego.scene.getScene('nivel');
    const jefe = n.jefe;

    // se le pone el nino delante, que si no no pelea
    const j = n.jugadores[0];
    j.setPosition(jefe.x - 200, jefe.y);
    j.body.setVelocity(0, 0);

    // y se le hace tirar uno a mano, para ver con que lo dibuja
    const tiro = n.lanzarTiroDeJefe(jefe);

    return {
      clase: jefe.constructor.name,
      vidas: jefe.vidasMaximas,
      // los puntitos de la barra tienen que ser tantos como golpes aguanta
      puntos: jefe.puntos.length,
      suDibujo: jefe.texture.key,
      esElSuyo: jefe.texture.key === TEXTURAS.tioCamiloMarcha,
      // y el proyectil, un balon y no un globo de agua
      tira: tiro.texture.key,
      esBalon: tiro.texture.key === TEXTURAS.balon,
      seRompeCon: tiro.seRompeCon === TEXTURAS.balonRevienta,
      echaChispas: tiro.echaChispas,
      derrotaConLaSuya: jefe.texturaDeDerrota === TEXTURAS.tioCamiloDerrotado,
    };
  });

  expect(camilo.clase).toBe('TioCamilo');
  expect(camilo.esElSuyo).toBe(true);
  expect(camilo.derrotaConLaSuya).toBe(true);
  // aguanta uno mas que Jean Luke, y la barra lo dice
  expect(camilo.vidas).toBe(6);
  expect(camilo.puntos).toBe(6);
  // tira balones en llamas, no globos de agua
  expect(camilo.esBalon).toBe(true);
  expect(camilo.seRompeCon).toBe(true);
  expect(camilo.echaChispas).toBe(true);
  expect(errores).toEqual([]);
});

test('lo que tira un jefe VUELA: no es un bloque de los de Samaon', async ({ page }) => {
  // Esto se rompio de verdad, y en silencio. Al sacar el proyectil del jefe a
  // su propio grupo se le puso de nombre `proyectiles`... que ya eran los
  // BLOQUES que lanza Samaon. El segundo pisaba al primero, asi que lo que
  // tiraba el jefe nacia con gravedad y con el choque contra el suelo puesto:
  // se estrellaba en el sitio sin volar un pixel. Y como el sprite salia con su
  // dibujo correcto, por una captura no se notaba.
  await entrarAlNivel(page, 'martin');
  await irAlMundo(page, 5, 'orlando');

  const vuelo = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    // lejos del jefe, que si le da al nino se rompe y no se mide nada
    j.setPosition(n.jefe.x - 520, j.y);
    j.body.setVelocity(0, 0);

    const tiro = n.lanzarTiroDeJefe(n.jefe);
    const salioEn = { x: tiro.x, y: tiro.y };
    const suGrupo = n.tirosDeJefe.contains(tiro);
    const enLosBloques = n.proyectiles.contains(tiro);

    // Se espera a que RECORRA, no a que pasen 500 ms de reloj: con la maquina
    // cargada pasa menos tiempo de juego en el mismo tiempo de reloj y el tiro
    // no habia llegado a los 80 px que se le piden. Si de verdad estuviera roto
    // —naciendo con gravedad, como cuando el grupo se llamaba igual que el de
    // los bloques— no se movera, el bucle se agotara y `avanzo` seguira en
    // cero, que es lo que tiene que cazar.
    let cayo = 0;
    for (let i = 0; i < 600 && tiro.active && Math.abs(tiro.x - salioEn.x) < 90; i += 1) {
      cayo = Math.max(cayo, Math.abs(tiro.y - salioEn.y));
      await new Promise((r) => setTimeout(r, 10));
    }
    cayo = Math.max(cayo, Math.abs(tiro.y - salioEn.y));
    return {
      suGrupo,
      enLosBloques,
      // ha recorrido camino de lado
      avanzo: Math.abs(tiro.x - salioEn.x),
      // y NO se ha caido en todo el camino: va por el aire
      cayo,
      sigueVivo: tiro.active,
      seEstiro: tiro.texture.key,
    };
  });

  // va en SU grupo, no en el de los bloques
  expect(vuelo.suGrupo).toBe(true);
  expect(vuelo.enLosBloques).toBe(false);
  // cruza de verdad (a 220 px/s, en medio segundo son mas de 80)
  expect(vuelo.avanzo).toBeGreaterThan(80);
  // y no le tira la gravedad
  expect(Math.abs(vuelo.cayo)).toBeLessThan(4);
  expect(vuelo.sigueVivo).toBe(true);
  // en cuanto sale se pone la pose de volar
  expect(vuelo.seEstiro).toContain('vuela');
});

test('cada jefe paga segun lo dificil que sea su mundo', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const premios = await page.evaluate(async () => {
    const { premioDeJefe } = await import('/src/config/ajustes.js');
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    return Array.from({ length: TOTAL_NIVELES }, (_, i) => premioDeJefe(i));
  });
  // 100 el primero, y 20 mas por cada mundo mas dificil
  expect(premios.slice(0, 5)).toEqual([100, 120, 140, 160, 180]);
  expect(premios[premios.length - 1]).toBe(100 + 20 * (premios.length - 1));

  // y lo que suma al marcador es eso, no un numero fijo
  const cobrado = await page.evaluate(async () => {
    const salida = [];
    for (const i of [0, 4]) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      await new Promise((r) => setTimeout(r, 1400));
      const n = window.juego.scene.getScene('nivel');
      const j = n.jugadores[0];
      const antes = j.monedas;
      n.jefe.vidas = 1;
      n.jefe.invulnerableHasta = 0;
      n.jefe.puedeRecibirGolpe = () => true;
      n.golpearJefe(n.jefe.x - 40);
      await new Promise((r) => setTimeout(r, 200));
      salida.push({ indice: i, gano: j.monedas - antes, deJefes: j.puntosDeJefes });
    }
    return salida;
  });

  expect(cobrado[0].gano).toBe(100);
  expect(cobrado[1].gano).toBe(180);
  // y se guarda aparte, para que el marcador final no tenga que multiplicar
  expect(cobrado[1].deJefes).toBe(180);
});

// ---------------------------------------------------------------------------
// EL TABLERO DE PUNTAJES
//
// Lo importante de verdad: los ninos juegan una tarde y tiene que quedar
// rastro. Antes solo se apuntaba al quedarse sin vidas o al pasarse los cinco
// mundos de un tiron, asi que muchas sesiones no dejaban nada.
// ---------------------------------------------------------------------------

test('una misma partida ocupa UNA fila del tablero, con su mejor puntaje', async ({ page }) => {
  await abrirJuego(page);

  const tabla = await page.evaluate(async () => {
    const { anotarPuntaje, nuevaPartida, borrarPuntajes, puestoDe } = await import(
      '/src/sistemas/puntajes.js'
    );
    borrarPuntajes();

    const mia = nuevaPartida();
    anotarPuntaje('MARTIN', 120, { nivel: 1, partida: mia });
    anotarPuntaje('MARTIN', 340, { nivel: 2, partida: mia });
    // vuelve a un mundo facil y hace menos: se queda con lo mejor que hizo
    anotarPuntaje('MARTIN', 300, { nivel: 3, partida: mia });
    // y otra partida distinta si abre su propia fila
    anotarPuntaje('SAMAON', 90, { nivel: 1, partida: nuevaPartida() });

    return {
      filas: (await import('/src/sistemas/puntajes.js')).mejoresPuntajes().map((f) => ({
        nombre: f.nombre,
        puntos: f.puntos,
      })),
      puesto: puestoDe(mia),
    };
  });

  expect(tabla.filas).toEqual([
    { nombre: 'MARTIN', puntos: 340 },
    { nombre: 'SAMAON', puntos: 90 },
  ]);
  expect(tabla.puesto).toBe(1);
});

test('acabar un mundo apunta el puntaje, sin tener que morirse', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  await page.evaluate(async () => {
    const { borrarPuntajes } = await import('/src/sistemas/puntajes.js');
    borrarPuntajes();
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];

    // Tocar la meta no es instantaneo: hace falta que la fisica vea el solape,
    // y con la suite entera por delante eso son varios fotogramas. En ese rato
    // le puede caer encima una paloma y el puntaje ya no seria 250. Se apagan
    // los voladores y las vacas mientras dura la medida.
    n.proximaPaloma = Number.MAX_SAFE_INTEGER;
    n.proximaVaca = Number.MAX_SAFE_INTEGER;

    j.monedas = 250;
    // se quita el jefe de en medio y se toca la meta
    if (n.jefe) {
      n.jefe.destroy();
      n.jefe = null;
    }
    n.abrirMeta();
    j.setPosition(n.nivel.meta.x, n.nivel.meta.y);
  });
  await esperarEscena(page, 'victoria');

  const apuntado = await page.evaluate(async () => {
    const { mejoresPuntajes } = await import('/src/sistemas/puntajes.js');
    const v = window.juego.scene.getScene('victoria');
    return { filas: mejoresPuntajes(), dice: v.loApuntado() };
  });

  expect(apuntado.filas.length).toBe(1);
  expect(apuntado.filas[0].puntos).toBe(250);
  expect(apuntado.filas[0].nombre).toBe('Prueba');
  // y se le dice al nino, que de esto depende el premio
  expect(apuntado.dice).toContain('Apuntado como Prueba');
  expect(apuntado.dice).toContain('1.º');
});

test('salirse al menu desde la pausa tambien apunta', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  await page.evaluate(async () => {
    const { borrarPuntajes } = await import('/src/sistemas/puntajes.js');
    borrarPuntajes();
    const n = window.juego.scene.getScene('nivel');
    n.jugadores[0].monedas = 77;
    n.pausar();
  });
  await esperarEscena(page, 'pausa');

  // Se elige "Volver al menu" por la escena y no a teclazos: con la suite
  // entera por delante, las teclas llegaban antes de que el menu escuchara.
  await page.waitForFunction(
    () => {
      const e = window.juego.scene.getScene('pausa');
      return Boolean(e && e.salirA);
    },
    null,
    { timeout: 10000 },
  );
  await page.evaluate(() => window.juego.scene.getScene('pausa').salirA('titulo'));
  await esperarEscena(page, 'titulo');

  const filas = await page.evaluate(async () => {
    const { mejoresPuntajes } = await import('/src/sistemas/puntajes.js');
    return mejoresPuntajes();
  });
  expect(filas.length).toBe(1);
  expect(filas[0].puntos).toBe(77);
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
      piel: vaca.piel,
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
  // El trote se anima: las dos poses de andar salen. Las claves se piden por
  // el nombre de la POSE, no escritas a mano: ahora hay una piel por mundo y
  // la clave la arma TEXTURAS.bichoDe, asi que escribirlas aqui era atarse a
  // como se llaman hoy.
  const suya = (pose) => `tex-bicho-${resultado.piel}-${pose}`;
  expect(resultado.texturas).toContain(suya('anda1'));
  expect(resultado.texturas).toContain(suya('anda2'));
  expect(resultado.texturas).toContain(suya('avisa'));
  expect(resultado.derribada).toBe(true);
  expect(resultado.texturaFinal).toBe(suya('tumbada'));
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

  await page.evaluate(async () => {
    const { borrarPuntajes } = await import('/src/sistemas/puntajes.js');
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
  });

  // Se espera a que la escena ESTE, no 900 ms de reloj. Con la suite entera por
  // delante el navegador va lento, la pantalla de victoria no habia llegado a
  // montarse y la prueba leia un tablero todavia vacio. Es la regla de casa
  // desde hace tiempo y esta se habia quedado sin aplicar.
  await esperarEscena(page, 'victoria');

  const resultado = await page.evaluate(async () => {
    const { mejoresPuntajes } = await import('/src/sistemas/puntajes.js');
    return { tabla: mejoresPuntajes() };
  });

  expect(resultado.tabla.length).toBe(1);
  expect(resultado.tabla[0].puntos).toBe(77);
});

test('la barra de vida del jefe nunca pesa mas que el jefe', async ({ page }) => {
  // Lo pidio Daniel: los puntitos eran tan gordos que la barra del que aguanta
  // ocho media 288 px —casi media pantalla, y mas ancha que el propio jefe, que
  // mide 172—, asi que a veces pesaba mas a la vista que el bicho al que hay
  // que mirar. Se comprueba en el PEOR caso, que es el de mas golpes.
  await entrarAlNivel(page, 'martin');

  const barras = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const salida = [];
    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      // se espera a que el tablero este montado y con su jefe puesto
      for (let v = 0; v < 120; v += 1) {
        const n = window.juego.scene.getScene('nivel');
        if (n && n.jefe && n.jefe.chapa && n.datosNivel && n.indiceNivel === i) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const n = window.juego.scene.getScene('nivel');
      if (!n.jefe || !n.jefe.chapa) continue;
      salida.push({
        ciudad: n.datosNivel.fondo,
        golpes: n.jefe.vidasMaximas,
        barra: Math.round(n.jefe.chapa.width),
        jefe: Math.round(n.jefe.displayWidth),
      });
    }
    return salida;
  });

  expect(barras.length).toBeGreaterThan(5);
  barras.forEach((b) => {
    // la barra cabe dentro del ancho del jefe
    expect(b.barra).toBeLessThanOrEqual(b.jefe);
    // y no se come la pantalla: menos de un cuarto de los 640 de ancho
    expect(b.barra).toBeLessThan(160);
    // pero sigue teniendo un puntito por golpe, que para eso esta
    expect(b.golpes).toBeGreaterThan(0);
  });
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

test('todas las ciudades traen decorado de fondo y algo por delante', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const ciudades = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const salida = [];
    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
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

test('al salir una vaca sale su cartel de aviso, y dice lo que es', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const { avisoDeBicho } = await import('/src/config/historia.js');
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
    const bicho = n.vacas.getChildren().find((v) => v.active);
    const letrero = (n.cartelDeVaca || []).find((pieza) => pieza && pieza.text);
    return {
      antes,
      salio,
      cartel: !!n.cartelDeVaca,
      dice: letrero ? letrero.text : null,
      tocaba: bicho ? avisoDeBicho(bicho.piel) : null,
    };
  });

  expect(resultado.antes).toBe(false); // sin vacas, sin cartel
  expect(resultado.salio).toBe(true);
  expect(resultado.cartel).toBe(true);
  expect(resultado.dice).toBe(resultado.tocaba);
});

test('el cartel dice lo que viene, y en ningun mundo avisa de una vaca que no hay', async ({
  page,
}) => {
  // Lo conto Daniel: en Atlanta viene Alma, la pastora alemana, y el cartel
  // seguia diciendo "¡CUIDADO CON LA BERRIONDA VACA!". El cartel va por PIEL,
  // no por ciudad, porque Medellin tiene dos buses y Cartagena tres carros.
  await entrarAlNivel(page, 'simon');

  const porMundo = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const { avisoDeBicho } = await import('/src/config/historia.js');
    const { pielesDeCiudad } = await import('/src/config/bichos.js');
    const fuera = [];

    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'simon', indiceNivel: i });
      for (let v = 0; v < 200; v += 1) {
        const e = window.juego.scene.getScene('nivel');
        if (e && e.indiceNivel === i && e.nivel) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const n = window.juego.scene.getScene('nivel');
      const ciudad = n.datosNivel.fondo;

      // se prueban TODAS las pieles de la ciudad, que donde hay varias se
      // sortea y si no se fijan saldria siempre la misma
      const suyas = pielesDeCiudad(ciudad);
      for (let k = 0; k < suyas.length; k += 1) {
        n.pielDeLosBichos = k;
        // El PRIMERO de cada mundo no se limpia a mano a proposito: asi se
        // comprueba de paso que al cambiar de tablero el cartel vuelve a salir.
        // Se quita solo al acabar su tween, y ese tween muere al reiniciar la
        // escena, con lo que se quedaba puesto para siempre y el aviso no
        // volvia a aparecer. Entre pieles de una misma ciudad si hay que
        // quitarlo, que si no el segundo bicho no traeria el suyo.
        if (k > 0 && n.cartelDeVaca) {
          // hay que matarle el tween ANTES: se va solo con un yoyo y, si se le
          // destruyen las piezas por debajo, su onComplete revienta
          n.tweens.killTweensOf(n.cartelDeVaca);
          n.cartelDeVaca.forEach((pieza) => pieza.destroy());
          n.cartelDeVaca = null;
        }
        n.vacas.getChildren().forEach((v) => v.destroy());

        let bicho = null;
        for (let t = 0; t < 20 && !bicho; t += 1) {
          n.proximaVaca = 0;
          n.gestionarVacas(1);
          const hijos = n.vacas.getChildren();
          bicho = hijos[hijos.length - 1] || null;
          await new Promise((r) => setTimeout(r, 15));
        }
        const letrero = (n.cartelDeVaca || []).find((pieza) => pieza && pieza.text);
        fuera.push({
          ciudad,
          piel: bicho ? bicho.piel : null,
          dice: letrero ? letrero.text : null,
          tocaba: bicho ? avisoDeBicho(bicho.piel) : null,
        });
      }
    }
    return fuera;
  });

  expect(porMundo.length).toBeGreaterThanOrEqual(8);
  porMundo.forEach((m) => {
    expect(m.piel, `${m.ciudad} no saco bicho`).not.toBeNull();
    expect(m.dice, `${m.ciudad} no saco cartel`).not.toBeNull();
    // dice lo que toca
    expect(m.dice, `${m.ciudad} (${m.piel})`).toBe(m.tocaba);
    // y no llama vaca a lo que no lo es
    if (!String(m.piel).includes('vaca')) {
      expect(m.dice, `${m.ciudad} (${m.piel}) llama vaca a lo que no lo es`).not.toContain('VACA');
    }
  });
});

test('lo que tira un bicho mide lo mismo en los ocho mundos', async ({ page }) => {
  // Lo conto Daniel: en Medellin los balones de Mini Papa salian ENORMES.
  //
  // El tamano se sacaba de la escala (`aEscalaDeJuego`, que la pone en
  // 1/densidad), y eso solo vale cuando la textura se dibuja por codigo: la del
  // agua se genera a 30x30 por la densidad, asi que a esa escala sale de 30 px.
  // Pero desde que cada bicho tira LO SUYO, lo que llega puede ser una imagen
  // cargada: el balon es un webp de 260x260 y salia de 260 px, ocho veces y
  // media mas grande. Al gas del raton de Orlando le pasaba igual.
  //
  // Esto no lo ve el compilador ni una captura de la pantalla de inicio: hay
  // que hacerles tirar y medir lo que sale.
  await entrarAlNivel(page, 'martin');

  const tiros = await page.evaluate(async () => {
    const { TOTAL_NIVELES } = await import('/src/niveles/index.js');
    const { AGUA } = await import('/src/config/ajustes.js');
    const fuera = [];
    for (let i = 0; i < TOTAL_NIVELES; i += 1) {
      window.juego.scene.start('nivel', { personajeId: 'martin', indiceNivel: i });
      for (let v = 0; v < 200; v += 1) {
        const e = window.juego.scene.getScene('nivel');
        if (e && e.indiceNivel === i && e.nivel) break;
        await new Promise((r) => setTimeout(r, 40));
      }
      const n = window.juego.scene.getScene('nivel');
      const bicho = n.enemigos.getChildren()[0];
      if (!bicho) continue;
      n.lanzarAgua(bicho);
      const hijos = n.peligros.getChildren();
      const tiro = hijos[hijos.length - 1];
      fuera.push({
        ciudad: n.datosNivel.fondo,
        dibujo: tiro.texture.key,
        ancho: Math.round(tiro.displayWidth),
        alto: Math.round(tiro.displayHeight),
        caja: Math.round(tiro.body.width * (tiro.scaleX || 1)),
        tamano: AGUA.tamano,
      });
      tiro.destroy();
    }
    return fuera;
  });

  expect(tiros.length).toBeGreaterThanOrEqual(8);
  tiros.forEach((t) => {
    expect(t.ancho, `${t.ciudad} tira ${t.dibujo} de ${t.ancho} px`).toBe(t.tamano);
    expect(t.alto, `${t.ciudad} tira ${t.dibujo} de ${t.alto} px de alto`).toBe(t.tamano);
    // y su caja mide lo mismo en pantalla, venga la textura de donde venga
    expect(t.caja, `${t.ciudad}: la caja de ${t.dibujo}`).toBe(t.tamano - 8);
  });
});

test('los textos se dibujan a la densidad del render, no a 1x', async ({ page }) => {
  // Esta se abre a densidad 3 a proposito: a 1 no probaria nada, porque
  // "resolucion 1" seria lo correcto y lo roto a la vez. Aqui no se juega, solo
  // se miran propiedades, asi que el navegador lento no estorba.
  await page.goto('/?densidad=3&nube=0');
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
// EL TABLERO DE LA NUBE
//
// El tablero vivia en el navegador de cada equipo, asi que el telefono de
// Martain y el portatil de Samaon tenian cada uno el suyo y no habia forma de
// compararlos. De este tablero depende el premio de diciembre, asi que lo que
// se comprueba aqui es que NO SE PIERDE NADA: ni cuando la nube contesta, ni
// cuando no contesta, ni cuando se cae el wifi a mitad.
//
// Ninguna de estas pruebas habla con Firebase: se le pone al juego una nube de
// mentira cambiando `window.fetch`, y al acabar se deja todo como estaba.
// ---------------------------------------------------------------------------

test('las pruebas nunca hablan con la nube de verdad', async ({ page }) => {
  await abrirJuego(page);

  // Esta es la red de seguridad de todas las demas: con la nube encendida, cada
  // pasada de la suite dejaria partidas inventadas en el tablero DE VERDAD de
  // los ninos. `abrirJuego` abre siempre con ?nube=0, y esto lo vigila.
  const apagada = await page.evaluate(async () => {
    const { hayNube } = await import('/src/config/nube.js');
    return hayNube();
  });

  expect(apagada).toBe(false);
});

test('el tablero de casa y el de la nube se ven como uno solo', async ({ page }) => {
  await abrirJuego(page);

  const fundido = await page.evaluate(async () => {
    const { fundirTableros } = await import('/src/sistemas/puntajes.js');

    const deCasa = [
      { nombre: 'MARTIN', puntos: 300, partida: 'p1', fecha: 2 },
      { nombre: 'MARTIN', puntos: 150, partida: 'p3', fecha: 5 },
    ];
    // la nube sabe mas de p1: se siguio jugando desde el telefono
    const deLaNube = [
      { nombre: 'MARTIN', puntos: 520, partida: 'p1', fecha: 3 },
      { nombre: 'SAMAON', puntos: 410, partida: 'p2', fecha: 4 },
    ];

    return fundirTableros(deCasa, deLaNube).map((f) => ({
      nombre: f.nombre,
      puntos: f.puntos,
      partida: f.partida,
    }));
  });

  // una partida, UNA fila, con el mejor puntaje que se le conozca
  expect(fundido).toEqual([
    { nombre: 'MARTIN', puntos: 520, partida: 'p1' },
    { nombre: 'SAMAON', puntos: 410, partida: 'p2' },
    { nombre: 'MARTIN', puntos: 150, partida: 'p3' },
  ]);
});

test('al fundir los dos tableros siguen cabiendo solo diez', async ({ page }) => {
  await abrirJuego(page);

  const salio = await page.evaluate(async () => {
    const { fundirTableros } = await import('/src/sistemas/puntajes.js');
    const monton = (desde, cuantas) =>
      Array.from({ length: cuantas }, (nada, i) => ({
        nombre: `J${desde + i}`,
        puntos: (desde + i) * 10,
        partida: `p${desde + i}`,
        fecha: desde + i,
      }));
    const todas = fundirTableros(monton(1, 9), monton(10, 9));
    return { cuantas: todas.length, mejor: todas[0].puntos };
  });

  expect(salio.cuantas).toBe(10);
  expect(salio.mejor).toBe(180);
});

test('lo que no se pudo subir se guarda y se reintenta cuando vuelve el internet', async ({
  page,
}) => {
  await abrirJuego(page);

  const resultado = await page.evaluate(async () => {
    const nube = await import('/src/config/nube.js');
    const puntajes = await import('/src/sistemas/puntajes.js');

    const deVerdad = window.fetch;
    const idas = [];
    let hayInternet = false;

    window.fetch = async (url, opciones = {}) => {
      const metodo = (opciones && opciones.method) || 'GET';
      idas.push({ url: String(url), metodo });
      if (!hayInternet) throw new Error('sin internet');
      return { ok: true, json: async () => ({}) };
    };

    try {
      puntajes.borrarPuntajes();
      nube.apuntarLaNubeA('https://tablero-de-mentira.invalid');

      const mia = puntajes.nuevaPartida();
      puntajes.anotarPuntaje('MARTIN', 250, { nivel: 1, partida: mia });
      // la subida va por detras: se le da un momento para que falle y encole
      await new Promise((listo) => setTimeout(listo, 80));

      const enCola = JSON.parse(
        window.localStorage.getItem('aventura-nube-pendientes') || '[]',
      );

      // vuelve el wifi
      hayInternet = true;
      await puntajes.sincronizarTablero();

      return {
        encoladas: enCola.map((f) => f.puntos),
        // el tablero de casa no se entero de nada de esto
        deCasa: puntajes.mejoresPuntajes().length,
        quedanPendientes: JSON.parse(
          window.localStorage.getItem('aventura-nube-pendientes') || '[]',
        ).length,
        subida: idas.some(
          (i) => i.metodo === 'PUT' && i.url.includes('/puntajes/' + mia + '.json'),
        ),
      };
    } finally {
      window.fetch = deVerdad;
      nube.apuntarLaNubeA();
      puntajes.borrarPuntajes();
    }
  });

  // se cayo el wifi, pero la partida no se perdio
  expect(resultado.encoladas).toEqual([250]);
  expect(resultado.deCasa).toBe(1);
  // y al volver, se subio y la cola quedo limpia
  expect(resultado.subida).toBe(true);
  expect(resultado.quedanPendientes).toBe(0);
});

test('una fila que la base rechaza no se queda taponando la cola', async ({ page }) => {
  await abrirJuego(page);

  const resultado = await page.evaluate(async () => {
    const nube = await import('/src/config/nube.js');
    const puntajes = await import('/src/sistemas/puntajes.js');

    const deVerdad = window.fetch;
    let comoContesta = 'caida';

    window.fetch = async (url, opciones = {}) => {
      const metodo = (opciones && opciones.method) || 'GET';
      if (metodo !== 'PUT') return { ok: true, json: async () => ({}) };
      if (comoContesta === 'caida') throw new Error('sin internet');
      // la base contesta, y dice que no: el reglamento no deja bajar un puntaje
      return { ok: false, status: 401, json: async () => ({}) };
    };

    try {
      puntajes.borrarPuntajes();
      nube.apuntarLaNubeA('https://tablero-de-mentira.invalid');

      puntajes.anotarPuntaje('MARTIN', 90, { nivel: 1, partida: puntajes.nuevaPartida() });
      await new Promise((listo) => setTimeout(listo, 80));
      const trasCaerse = JSON.parse(
        window.localStorage.getItem('aventura-nube-pendientes') || '[]',
      ).length;

      // vuelve el internet, pero la base la rechaza
      comoContesta = 'rechaza';
      await puntajes.sincronizarTablero();
      const trasElRechazo = JSON.parse(
        window.localStorage.getItem('aventura-nube-pendientes') || '[]',
      ).length;

      return { trasCaerse, trasElRechazo };
    } finally {
      window.fetch = deVerdad;
      nube.apuntarLaNubeA();
      puntajes.borrarPuntajes();
    }
  });

  // sin internet se guarda, que eso es culpa del camino
  expect(resultado.trasCaerse).toBe(1);
  // pero si la base la rechaza, se tira: reintentarla es quedarsela para
  // siempre y dejar detras a todas las que si podrian subir
  expect(resultado.trasElRechazo).toBe(0);
});

test('una partida de cero puntos no se sube: no hay nada que rastrear', async ({ page }) => {
  await abrirJuego(page);

  const puso = await page.evaluate(async () => {
    const nube = await import('/src/config/nube.js');
    const puntajes = await import('/src/sistemas/puntajes.js');

    const deVerdad = window.fetch;
    const idas = [];
    window.fetch = async (url, opciones = {}) => {
      idas.push((opciones && opciones.method) || 'GET');
      return { ok: true, json: async () => ({}) };
    };

    try {
      puntajes.borrarPuntajes();
      nube.apuntarLaNubeA('https://tablero-de-mentira.invalid');

      puntajes.anotarPuntaje('NADIE', 0, { nivel: 1, partida: puntajes.nuevaPartida() });
      await new Promise((listo) => setTimeout(listo, 80));
      const sinPuntos = idas.filter((m) => m === 'PUT').length;

      puntajes.anotarPuntaje('MARTIN', 12, { nivel: 1, partida: puntajes.nuevaPartida() });
      await new Promise((listo) => setTimeout(listo, 80));

      return { sinPuntos, conPuntos: idas.filter((m) => m === 'PUT').length };
    } finally {
      window.fetch = deVerdad;
      nube.apuntarLaNubeA();
      puntajes.borrarPuntajes();
    }
  });

  expect(puso.sinPuntos).toBe(0);
  expect(puso.conPuntos).toBe(1);
});

test('si la nube no contesta, el juego sigue con el tablero de casa', async ({ page }) => {
  await abrirJuego(page);

  const resultado = await page.evaluate(async () => {
    const nube = await import('/src/config/nube.js');
    const puntajes = await import('/src/sistemas/puntajes.js');

    const deVerdad = window.fetch;
    // una nube que se queda colgada para siempre: es el caso peor
    window.fetch = (url, opciones = {}) =>
      new Promise((nada, mal) => {
        const senal = opciones && opciones.signal;
        if (senal) senal.addEventListener('abort', () => mal(new Error('se acabo el plazo')));
      });

    try {
      puntajes.borrarPuntajes();
      nube.apuntarLaNubeA('https://tablero-de-mentira.invalid');
      puntajes.anotarPuntaje('MARTIN', 480, { nivel: 2, partida: puntajes.nuevaPartida() });

      // no puede quedarse esperando para siempre ni puede reventar
      const desde = Date.now();
      const tabla = await puntajes.sincronizarTablero();
      return { puntos: tabla.map((f) => f.puntos), tardo: Date.now() - desde };
    } finally {
      window.fetch = deVerdad;
      nube.apuntarLaNubeA();
      puntajes.borrarPuntajes();
    }
  });

  expect(resultado.puntos).toEqual([480]);
  // se corta sola por el plazo (6 s), no se queda colgada
  expect(resultado.tardo).toBeLessThan(20000);
});

test('cuando contesta la nube, el tablero del titulo se repinta con lo que trae', async ({
  page,
}) => {
  await abrirJuego(page);

  const textos = await page.evaluate(async () => {
    const nube = await import('/src/config/nube.js');
    const puntajes = await import('/src/sistemas/puntajes.js');

    const deVerdad = window.fetch;
    window.fetch = async (url, opciones = {}) => {
      const metodo = (opciones && opciones.method) || 'GET';
      if (metodo !== 'GET') return { ok: true, json: async () => ({}) };
      // lo que hizo el otro nino, desde otro aparato
      return {
        ok: true,
        json: async () => ({
          pDeOtroAparato: {
            nombre: 'SAMAON',
            puntos: 777,
            personaje: 'Samaon',
            nivel: 3,
            fecha: 1,
          },
        }),
      };
    };

    try {
      // el tablero de este equipo esta vacio: todo lo que salga viene de la nube
      puntajes.borrarPuntajes();
      nube.apuntarLaNubeA('https://tablero-de-mentira.invalid');

      window.juego.scene.start('titulo');
      await new Promise((listo) => setTimeout(listo, 700));

      return window.juego.scene
        .getScene('titulo')
        .children.list.filter((o) => o.type === 'Text')
        .map((o) => o.text);
    } finally {
      window.fetch = deVerdad;
      nube.apuntarLaNubeA();
      puntajes.borrarPuntajes();
    }
  });

  const todo = textos.join(' | ');
  expect(todo).toContain('SAMAON');
  expect(todo).toContain('777');
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

    // los dos dedos a la vez: el boton de andar a la derecha y el de saltar
    const sitios = await sitiosTactiles(page);
    const andar = enPantalla(sitios.derecha.x, sitios.derecha.y);
    const salto = enPantalla(sitios.salto.x, sitios.salto.y);
    await dedos('touchStart', [{ ...andar, id: 1 }, { ...salto, id: 2 }]);

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

  test('deslizar el pulgar de un boton de andar al otro cambia de lado', async ({ page }) => {
    await entrarAlNivel(page, 'martin', '&tactil=1');
    const enPantalla = await dondeTocar(page);
    const sitios = await sitiosTactiles(page);
    const cdp = await page.context().newCDPSession(page);
    const dedos = (tipo, puntos) =>
      cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: puntos });

    const derecha = enPantalla(sitios.derecha.x, sitios.derecha.y);
    const izquierda = enPantalla(sitios.izquierda.x, sitios.izquierda.y);

    await dedos('touchStart', [{ ...derecha, id: 1 }]);
    await page.waitForTimeout(300);
    const haciaLaDerecha = await page.evaluate(() =>
      Math.round(window.juego.scene.getScene('nivel').jugadores[0].body.velocity.x),
    );

    // sin levantar el dedo: los ninos no lo levantan, lo deslizan
    await dedos('touchMove', [{ ...izquierda, id: 1 }]);
    await page.waitForTimeout(300);
    const haciaLaIzquierda = await page.evaluate(() =>
      Math.round(window.juego.scene.getScene('nivel').jugadores[0].body.velocity.x),
    );

    await dedos('touchEnd', [])
    await page.waitForTimeout(250);
    const quieto = await page.evaluate(() =>
      Math.round(window.juego.scene.getScene('nivel').jugadores[0].body.velocity.x),
    );

    expect(haciaLaDerecha).toBe(210);
    expect(haciaLaIzquierda).toBe(-210);
    expect(quieto).toBe(0);
  });

  test('el dedo tambien ataca y pausa', async ({ page }) => {
    await entrarAlNivel(page, 'simon', '&tactil=1');
    const enPantalla = await dondeTocar(page);

    const antes = await page.evaluate(() =>
      window.juego.scene.getScene('nivel').proyectilesVivos(),
    );
    const sitios = await sitiosTactiles(page);
    const ataque = enPantalla(sitios.ataque.x, sitios.ataque.y);
    await page.touchscreen.tap(ataque.x, ataque.y);
    await page.waitForTimeout(250);
    const despues = await page.evaluate(() =>
      window.juego.scene.getScene('nivel').proyectilesVivos(),
    );
    expect(despues).toBe(antes + 1); // Samaon ha lanzado su bloque

    const pausa = enPantalla(sitios.pausa.x, sitios.pausa.y);
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
    await esperarEscena(page, 'mundos');
    // y de ahi, tocando la tarjeta del mundo que se este enseñando
    const tarjeta = await sitioDeLaTarjeta(page);
    await tocar(tarjeta.x, tarjeta.y);
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

    await page.keyboard.press('Enter');
    await esperarEscena(page, 'mundos');
    await page.waitForTimeout(200);
    const enMundos = await textos();
    // Ahora se ensena un mundo a la vez: el aviso habla de deslizar y tocar.
    expect(enMundos).toContain('Desliza');
    expect(enMundos).toContain('toca');
    expect(enMundos).not.toMatch(/Enter|Esc|Flechas/);
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

test.describe('un iphone acostado', () => {
  // 844 x 390 es un iPhone de los de ahora: 2,16 a 1, mucho mas alargado que
  // los 16 a 9 del juego.
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test('el juego llena la pantalla, sin franjas negras a los lados', async ({ page }) => {
    await abrirJuego(page, '&tactil=1');
    const medidas = await page.evaluate(async () => {
      const { MUNDO } = await import('/src/config/ajustes.js');
      const c = document.querySelector('#juego canvas').getBoundingClientRect();
      return {
        ancho: MUNDO.ancho,
        alto: MUNDO.alto,
        lienzo: { x: Math.round(c.x), ancho: Math.round(c.width), alto: Math.round(c.height) },
      };
    });

    // el alto y la casilla no se tocan: lo que cambia es cuanto mundo se ve
    expect(medidas.alto).toBe(360);
    expect(medidas.ancho).toBe(780);
    // y el lienzo llega de borde a borde
    expect(medidas.lienzo.x).toBe(0);
    expect(medidas.lienzo.ancho).toBe(844);
    expect(medidas.lienzo.alto).toBe(390);
  });

  test('los botones de la derecha van pegados a SU borde', async ({ page }) => {
    await entrarAlNivel(page, 'martin', '&tactil=1');
    const sitios = await sitiosTactiles(page);
    // los de andar, contra el borde izquierdo; los otros, contra el derecho
    expect(sitios.izquierda.x).toBeLessThan(100);
    expect(780 - sitios.salto.x).toBeLessThan(100);
    expect(sitios.pausa.x).toBe(390);
    // y las areas de los dos de andar no se pisan, que si no una se come a la otra
    const separacion = sitios.derecha.x - sitios.izquierda.x;
    expect(separacion).toBeGreaterThanOrEqual(sitios.izquierda.radio * 2 * 1.3);
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

  // y la pantalla se queda en los 640 de siempre: en el ordenador no cambia nada
  const ancho = await page.evaluate(async () => {
    const { MUNDO } = await import('/src/config/ajustes.js');
    return MUNDO.ancho;
  });
  expect(ancho).toBe(640);

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
