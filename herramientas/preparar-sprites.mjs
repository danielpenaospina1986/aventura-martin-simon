// ---------------------------------------------------------------------------
// PREPARAR LOS SPRITES DE UN PERSONAJE
//
// Coge las poses dibujadas (src/assets/simon-origen/) y las deja listas para el
// juego:
//
//   1. quita el fondo de cuadros y lo deja transparente;
//   2. recorta cada pose a lo que ocupa el personaje;
//   3. las escala TODAS a la misma altura y las pone en un lienzo del mismo
//      tamano, centradas y apoyadas abajo. Esto es lo importante: si cada pose
//      tuviera su propio encuadre, al cambiar de una a otra el personaje daria
//      un salto en pantalla.
//
// Se ejecuta con el servidor de desarrollo levantado (npm run dev):
//
//   node herramientas/preparar-sprites.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ALTO_PERSONAJE = 240; // alto del muneco dentro del lienzo, en pixeles
const LIENZO = { ancho: 260, alto: 260 };
const SERVIDOR = 'http://127.0.0.1:5173';

const PERSONAJES = [
  {
    nombre: 'simon',
    origen: 'src/assets/simon-origen',
    destino: 'src/assets/simon',
    poses: ['quieto', 'corre1', 'corre2', 'lanza'],
  },
];

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

try {
  await pagina.goto(SERVIDOR, { timeout: 15000 });
} catch {
  console.error(`No responde ${SERVIDOR}. Arranca antes el servidor con: npm run dev`);
  await navegador.close();
  process.exit(1);
}

for (const personaje of PERSONAJES) {
  if (!existsSync(personaje.destino)) mkdirSync(personaje.destino, { recursive: true });

  for (const pose of personaje.poses) {
    const origen = `${personaje.origen}/${pose}.jpg`;
    if (!existsSync(origen)) {
      console.error(`  falta ${origen}`);
      continue;
    }

    const resultado = await pagina.evaluate(
      async ({ origen, altoPersonaje, lienzoAncho, lienzoAlto }) => {
        const imagen = new Image();
        imagen.src = `/${origen}`;
        await imagen.decode();

        const ancho = imagen.naturalWidth;
        const alto = imagen.naturalHeight;
        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(imagen, 0, 0);

        // --- quitar el damero del fondo, entrando desde los bordes ---
        const datos = ctx.getImageData(0, 0, ancho, alto);
        const p = datos.data;
        const visto = new Uint8Array(ancho * alto);
        // El damero es gris y claro, pero no siempre igual: en unas poses es
        // gris puro y en otras viene tenido y mas oscuro (hasta 96). Por eso el
        // umbral es bajo y la tolerancia de color, ancha. Al dibujo no le afecta:
        // la piel, la ropa y el pelo tienen mucha mas diferencia entre canales.
        const esFondo = (i) => {
          const r = p[i];
          const g = p[i + 1];
          const b = p[i + 2];
          return (
            r > 92 &&
            Math.abs(r - g) < 24 &&
            Math.abs(g - b) < 24 &&
            Math.abs(r - b) < 24
          );
        };

        const pila = [];
        for (let x = 0; x < ancho; x += 1) pila.push([x, 0], [x, alto - 1]);
        for (let y = 0; y < alto; y += 1) pila.push([0, y], [ancho - 1, y]);

        while (pila.length) {
          const [x, y] = pila.pop();
          if (x < 0 || y < 0 || x >= ancho || y >= alto) continue;
          const idx = y * ancho + x;
          if (visto[idx]) continue;
          const i = idx * 4;
          if (!esFondo(i)) continue;
          visto[idx] = 1;
          p[i + 3] = 0;
          pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        ctx.putImageData(datos, 0, 0);

        // --- recortar a lo que ocupa el personaje ---
        let minX = ancho;
        let minY = alto;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < alto; y += 1) {
          for (let x = 0; x < ancho; x += 1) {
            if (p[(y * ancho + x) * 4 + 3] > 24) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        const anchoUtil = maxX - minX + 1;
        const altoUtil = maxY - minY + 1;

        // --- misma altura para todas las poses, apoyadas abajo ---
        const salida = document.createElement('canvas');
        salida.width = lienzoAncho;
        salida.height = lienzoAlto;
        const sctx = salida.getContext('2d');
        sctx.imageSmoothingQuality = 'high';

        const escala = altoPersonaje / altoUtil;
        const destinoAncho = anchoUtil * escala;
        const destinoAlto = altoUtil * escala;

        sctx.drawImage(
          lienzo,
          minX,
          minY,
          anchoUtil,
          altoUtil,
          (lienzoAncho - destinoAncho) / 2,
          lienzoAlto - destinoAlto - 6,
          destinoAncho,
          destinoAlto,
        );

        return {
          url: salida.toDataURL('image/png'),
          recorte: `${anchoUtil}x${altoUtil}`,
          proporcion: (anchoUtil / altoUtil).toFixed(2),
        };
      },
      {
        origen,
        altoPersonaje: ALTO_PERSONAJE,
        lienzoAncho: LIENZO.ancho,
        lienzoAlto: LIENZO.alto,
      },
    );

    const contenido = Buffer.from(resultado.url.split(',')[1], 'base64');
    writeFileSync(`${personaje.destino}/${pose}.png`, contenido);
    console.log(
      `  ${personaje.nombre}/${pose.padEnd(8)} ${(contenido.length / 1024).toFixed(0).padStart(3)} KB` +
        `  · recorte ${resultado.recorte} (proporcion ${resultado.proporcion})`,
    );
  }
}

await navegador.close();
