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
  await page.goto('/');
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
  await esperarEscena(page, 'seleccion');
  if (personaje === 'simon') await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nivel');
  await page.waitForTimeout(600); // fundido de entrada
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
      bloques: j.bloques.length,
      totalMonedas: n.nivel.totalMonedas,
    };
  });

// ---------------------------------------------------------------------------

test('las tres pantallas se ven bien y no hay errores en la consola', async ({ page }) => {
  const errores = vigilarErrores(page);

  await abrirJuego(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/01-titulo.png` });

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'seleccion');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${CAPTURAS}/02-seleccion.png` });

  await page.keyboard.press('Enter');
  await esperarEscena(page, 'nivel');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${CAPTURAS}/03-nivel-martin.png` });

  expect(errores).toEqual([]);
});

test('el jugador corre y salta con la altura prevista', async ({ page }) => {
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  const inicio = await estadoJugador(page);
  expect(inicio.enSuelo).toBe(true);

  // correr a la derecha
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);
  const corriendo = await estadoJugador(page);
  expect(corriendo.x - inicio.x).toBeGreaterThan(90);

  // saltar sin soltar: debe acercarse a la altura maxima calculada (114,6 px)
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);
  const antes = await estadoJugador(page);
  await page.keyboard.down('Space');
  await page.waitForTimeout(330);
  const pico = await estadoJugador(page);
  await page.keyboard.up('Space');
  const altura = antes.y - pico.y;
  expect(altura).toBeGreaterThan(95);
  expect(altura).toBeLessThan(125);

  await page.waitForTimeout(700);
  const alAterrizar = await estadoJugador(page);
  expect(alAterrizar.enSuelo).toBe(true);

  expect(errores).toEqual([]);
});

test('el salto corto sube menos que el salto largo', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const medir = async (ms) => {
    const antes = await estadoJugador(page);
    await page.keyboard.down('Space');
    await page.waitForTimeout(ms);
    await page.keyboard.up('Space');
    await page.waitForTimeout(340 - ms);
    const pico = await estadoJugador(page);
    await page.waitForTimeout(900);
    return antes.y - pico.y;
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
    n.jugadores[0].setPosition(8 * 32, 13 * 32 + 10);
  });
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowRight');

  const estado = await estadoJugador(page);
  expect(estado.monedas).toBeGreaterThanOrEqual(3);
  expect(estado.totalMonedas).toBe(29);
});

test('Martín elimina enemigos con la katana', async ({ page }) => {
  await entrarAlNivel(page, 'martin');
  const antes = await estadoJugador(page);
  expect(antes.enemigos).toBe(5);

  // el enemigo se queda quieto para que la prueba sea siempre igual
  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const enemigo = n.enemigos.getChildren()[0];
    enemigo.direccion = 0;
    enemigo.body.setVelocity(0, 0);
    window.__enemigoDePrueba = enemigo;
    j.setPosition(enemigo.x - 34, enemigo.y - 14);
    j.body.setVelocity(0, 0);
    j.mirando = 1;
  });
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyX');
  await page.waitForTimeout(250);

  const despues = await estadoJugador(page);
  expect(despues.enemigos).toBe(4);
  expect(await page.evaluate(() => window.__enemigoDePrueba.active)).toBe(false);
});

test('saltar encima de un enemigo lo elimina', async ({ page }) => {
  await entrarAlNivel(page, 'simon');

  await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const enemigo = n.enemigos.getChildren()[0];
    enemigo.body.setVelocity(0, 0);
    enemigo.direccion = 0;
    j.setPosition(enemigo.x, enemigo.y - 90);
    j.body.setVelocity(0, 0);
  });
  await page.waitForTimeout(700);

  const despues = await estadoJugador(page);
  expect(despues.enemigos).toBe(4);
  expect(despues.monedas).toBe(0);
});

test('Simón construye bloques y nunca tiene más de tres', async ({ page }) => {
  await entrarAlNivel(page, 'simon');
  expect((await estadoJugador(page)).personaje).toBe('simon');

  // con la tecla, tal como lo hara un nino
  await page.keyboard.press('KeyX');
  await page.waitForTimeout(300);
  expect((await estadoJugador(page)).bloques).toBe(1);

  // la regla del maximo: al poner el cuarto desaparece el mas viejo
  const resultado = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const puestos = [];
    for (let i = 0; i < 4; i += 1) {
      const col = 40 + i;
      const fila = 10;
      if (n.casillaLibre(col, fila, j)) {
        n.colocarBloque(col, fila, j);
        puestos.push(`${col},${fila}`);
      }
    }
    return {
      puestos,
      bloquesDelJugador: j.bloques.length,
      casillasOcupadas: n.casillasOcupadas.size,
    };
  });

  expect(resultado.puestos.length).toBe(4);
  expect(resultado.bloquesDelJugador).toBe(3);
  expect(resultado.casillasOcupadas).toBe(3);
});

test('caer a un hueco devuelve al checkpoint sin perder monedas', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const monedas = await page.evaluate(() => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    j.monedas = 7; // como si ya hubiese recogido siete
    // tirarlo por el primer hueco (columnas 26-28)
    j.setPosition(27 * 32 + 16, 13 * 32);
    j.body.setVelocity(0, 400);
    return j.monedas;
  });
  expect(monedas).toBe(7);

  await page.waitForTimeout(1600);
  const despues = await estadoJugador(page);
  expect(despues.monedas).toBe(7); // no se pierde nada
  expect(despues.y).toBeLessThan(500); // ha vuelto arriba
  expect(despues.x).toBeLessThan(27 * 32); // ha vuelto al principio
});

test('el checkpoint se activa aunque se pase saltando por encima', async ({ page }) => {
  await entrarAlNivel(page, 'martin');

  const resultado = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const b = n.nivel.checkpoints.getChildren()[0];
    const antes = { activo: b.activo, reaparicion: Math.round(j.reaparicion.x) };

    // pasar por encima a la altura maxima del salto (114,6 px sobre el suelo)
    j.setPosition(b.x, 13 * 32 + 10 - 114);
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
    j.setPosition(n.nivel.meta.x, n.nivel.meta.y);
  });

  await esperarEscena(page, 'victoria');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${CAPTURAS}/06-victoria.png` });
  expect(errores).toEqual([]);
});

test('el nivel entero se recorre de la salida a la meta', async ({ page }) => {
  test.setTimeout(150000);
  const errores = vigilarErrores(page);
  await entrarAlNivel(page, 'martin');

  // Un "piloto automatico": corre a la derecha con el teclado de verdad y salta
  // cuando se le acaba el suelo, choca con algo o tiene un enemigo delante.
  await page.keyboard.down('ArrowRight');

  const recorrido = await page.evaluate(async () => {
    const n = window.juego.scene.getScene('nivel');
    const j = n.jugadores[0];
    const metaX = n.nivel.meta.x;
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const registro = [];
    let xMaxima = j.x;
    let quieto = 0;

    for (let paso = 0; paso < 900 && !n.terminado; paso += 1) {
      const sueloDelante = n.haySoporteEn(j.x + 30, j.body.bottom + 6);
      const chocando = j.body.blocked.right;
      const enemigoCerca = n.enemigos
        .getChildren()
        .some((e) => e.active && e.x - j.x > 0 && e.x - j.x < 70 && Math.abs(e.y - j.y) < 60);

      if (j.enSuelo && (!sueloDelante || chocando || enemigoCerca || quieto > 6)) {
        j.saltar();
        quieto = 0;
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
      totalMonedas: n.nivel.totalMonedas,
      checkpointActivo: n.nivel.checkpoints.getChildren()[0].activo,
      registro,
    };
  });

  await page.keyboard.up('ArrowRight');
  console.log('  recorrido:', JSON.stringify(recorrido));

  expect(recorrido.terminado).toBe(true);
  expect(recorrido.checkpointActivo).toBe(true);
  expect(recorrido.monedas).toBeGreaterThan(10);
  expect(errores).toEqual([]);
});
