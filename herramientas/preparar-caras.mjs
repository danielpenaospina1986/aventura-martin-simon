// ---------------------------------------------------------------------------
// PREPARAR LAS CARITAS
//
// Coge los dibujos de Martin y Simon y los deja listos para usarlos como
// avatares dentro del juego:
//
//   1. Tapa las marcas de la franquicia que el generador de imagenes colo en
//      los dibujos (el emblema de la gorra y el texto del hombro). El estilo de
//      dibujo se puede usar libremente; esas dos marcas concretas no.
//   2. Quita el fondo de cuadros (el damero gris que traen los PNG "con
//      transparencia" cuando se guardan como JPG) y lo deja transparente.
//   3. Recorta a la cabeza y la encuadra centrada en un cuadrado.
//   4. Guarda un PNG de 256x256 con fondo transparente.
//
// Los dibujos de partida NO se suben al repositorio (van en .gitignore), para
// que las marcas no acaben publicadas. Lo que se versiona son los PNG limpios.
//
// Se ejecuta con el servidor de desarrollo levantado (npm run dev):
//
//   node herramientas/preparar-caras.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { writeFileSync, existsSync } from 'node:fs';

const LADO = 256; // tamano del PNG final
const MARGEN = 0.04; // aire alrededor de la cabeza

const CARAS = [
  {
    nombre: 'martin',
    origen: 'src/assets/caras-origen/martin-origen.jpg',
    destino: 'src/assets/cara-martin.png',
    // El emblema de la gorra se tapa con el propio color de la gorra, tomado
    // de un punto limpio de la copa. Clonar un trozo de al lado no vale: la
    // copa linda con el fondo y se arrastraba el damero. [x, y, ancho, alto]
    parches: [{ destino: [330, 195, 145, 115], muestra: [520, 200], redondeo: 26 }],
  },
  {
    nombre: 'simon',
    origen: 'src/assets/caras-origen/simon-origen.jpg',
    destino: 'src/assets/cara-simon.png',
    // El dibujo nuevo de Simon no trae ninguna marca que tapar.
    parches: [],
  },
];

const SERVIDOR = 'http://127.0.0.1:5173';

for (const cara of CARAS) {
  if (!existsSync(cara.origen)) {
    console.error(`No encuentro ${cara.origen}`);
    process.exit(1);
  }
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

try {
  await pagina.goto(SERVIDOR, { timeout: 15000 });
} catch {
  console.error(`No responde ${SERVIDOR}. Arranca antes el servidor con: npm run dev`);
  await navegador.close();
  process.exit(1);
}

for (const cara of CARAS) {
  const resultado = await pagina.evaluate(
    async ({ cara, LADO, MARGEN }) => {
      const imagen = new Image();
      imagen.src = `/${cara.origen}`;
      await imagen.decode();

      const ancho = imagen.naturalWidth;
      const alto = imagen.naturalHeight;

      const lienzo = document.createElement('canvas');
      lienzo.width = ancho;
      lienzo.height = alto;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imagen, 0, 0);

      // --- 1. tapar las marcas ---
      // Dos formas: clonar un trozo limpio de al lado, o rellenar con un color
      // tomado del propio dibujo. El relleno se usa cuando alrededor de la
      // marca hay fondo y clonar arrastraria el damero.
      for (const parche of cara.parches) {
        const [dx, dy, dw, dh] = parche.destino;
        ctx.save();
        if (parche.muestra) {
          const [mx, my] = parche.muestra;
          const c = ctx.getImageData(mx, my, 1, 1).data;
          ctx.filter = 'blur(7px)';
          ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
          ctx.beginPath();
          ctx.roundRect(dx, dy, dw, dh, parche.redondeo || 16);
          ctx.fill();
        } else {
          const [sx, sy, sw, sh] = parche.fuente;
          ctx.filter = 'blur(2px)';
          ctx.drawImage(lienzo, sx, sy, sw, sh, dx, dy, dw, dh);
        }
        ctx.restore();
      }

      // --- 2. quitar el damero del fondo ---
      // Se recorre desde los bordes hacia dentro: asi el blanco de los ojos o
      // de los dientes, que esta rodeado de linea negra, no se toca.
      const datos = ctx.getImageData(0, 0, ancho, alto);
      const p = datos.data;
      const visto = new Uint8Array(ancho * alto);
      // El damero es gris puro y claro. El dibujo, en cambio, tiene color:
      // la piel tira a calido y el pelo y la ropa son cromaticos. Por eso vale
      // con pedir "gris y claro". El umbral es bajo (140) porque el damero de
      // un dibujo llega a 150 y el del otro a 209.
      const esFondo = (i) => {
        const r = p[i];
        const g = p[i + 1];
        const b = p[i + 2];
        return (
          r > 140 &&
          Math.abs(r - g) < 16 &&
          Math.abs(g - b) < 16 &&
          Math.abs(r - b) < 16
        );
      };

      const pila = [];
      for (let x = 0; x < ancho; x += 1) {
        pila.push([x, 0], [x, alto - 1]);
      }
      for (let y = 0; y < alto; y += 1) {
        pila.push([0, y], [ancho - 1, y]);
      }

      while (pila.length) {
        const [x, y] = pila.pop();
        if (x < 0 || y < 0 || x >= ancho || y >= alto) continue;
        const idx = y * ancho + x;
        if (visto[idx]) continue;
        const i = idx * 4;
        if (!esFondo(i)) continue;
        visto[idx] = 1;
        p[i + 3] = 0; // transparente
        pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(datos, 0, 0);

      // --- 3. recortar a lo que queda dibujado ---
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

      // --- 4. encuadrar centrado en un cuadrado ---
      const salida = document.createElement('canvas');
      salida.width = LADO;
      salida.height = LADO;
      const sctx = salida.getContext('2d');
      sctx.imageSmoothingQuality = 'high';

      const lado = Math.max(anchoUtil, altoUtil) * (1 + MARGEN * 2);
      const escala = LADO / lado;
      const destinoAncho = anchoUtil * escala;
      const destinoAlto = altoUtil * escala;

      sctx.drawImage(
        lienzo,
        minX,
        minY,
        anchoUtil,
        altoUtil,
        (LADO - destinoAncho) / 2,
        (LADO - destinoAlto) / 2,
        destinoAncho,
        destinoAlto,
      );

      return {
        url: salida.toDataURL('image/png'),
        recorte: `${anchoUtil}x${altoUtil} desde (${minX},${minY})`,
      };
    },
    { cara, LADO, MARGEN },
  );

  const contenido = Buffer.from(resultado.url.split(',')[1], 'base64');
  writeFileSync(cara.destino, contenido);
  console.log(
    `  ${cara.nombre}: ${cara.destino} (${(contenido.length / 1024).toFixed(0)} KB) · recorte ${resultado.recorte}`,
  );
}

await navegador.close();
