// ---------------------------------------------------------------------------
// PREPARAR LOS FONDOS DE CADA CIUDAD
//
// Por cada ilustracion de partida (src/assets/fondos-origen/) hace dos cosas:
//
//   1. Tapa las marcas registradas que traiga. Una ciudad se puede dibujar sin
//      problema, pero un logotipo o un simbolo de marca no se publican: el
//      repositorio es publico. Donde habia una marca se pone un motivo art deco.
//   2. La trata para que funcione como fondo: desenfoque suave y menos color.
//      Sin eso, el dibujo tiene tanto detalle que el personaje, los premios y
//      los enemigos se pierden dentro.
//
// Se ejecuta con el servidor de desarrollo levantado (npm run dev):
//
//   node herramientas/preparar-fondos.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const FILTRO = 'blur(2.5px) saturate(0.72) brightness(1.06)';
const CALIDAD = 0.86;
const SERVIDOR = 'http://127.0.0.1:5173';

const CIUDADES = [
  { nombre: 'space-coast', parches: [] },
  { nombre: 'medellin', parches: [] },
  {
    nombre: 'atlanta',
    // Esta ilustracion venia con marcas registradas bien visibles.
    parches: [
      // los aros: se sustituyen por un sol art deco, que pega con el estilo
      { tipo: 'sol', zona: [872, 368, 330, 165], muestra: [840, 300] },
      // el rotulo rojo de la marca de refrescos
      { tipo: 'relleno', zona: [238, 512, 162, 48], muestra: [210, 575] },
      // la botella con su logotipo
      { tipo: 'relleno', zona: [222, 328, 66, 160], muestra: [300, 400] },
      // "world of ..." sobre el edificio
      { tipo: 'relleno', zona: [52, 498, 196, 68], muestra: [150, 600] },
      // el nombre del acuario
      { tipo: 'relleno', zona: [440, 522, 240, 40], muestra: [420, 600] },
      // el pie del monumento
      { tipo: 'relleno', zona: [930, 686, 218, 40], muestra: [900, 740] },
    ],
  },
  {
    nombre: 'miami',
    // nombres de hoteles reales en los rotulos
    parches: [
      { tipo: 'relleno', zona: [28, 350, 350, 75], muestra: [200, 300] },
      { tipo: 'relleno', zona: [905, 220, 130, 120], muestra: [880, 200] },
      { tipo: 'relleno', zona: [1030, 225, 90, 60], muestra: [1010, 200] },
    ],
  },
  { nombre: 'cartagena', parches: [] },
];

if (!existsSync('src/assets/fondos')) mkdirSync('src/assets/fondos', { recursive: true });

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

try {
  await pagina.goto(SERVIDOR, { timeout: 15000 });
} catch {
  console.error(`No responde ${SERVIDOR}. Arranca antes el servidor con: npm run dev`);
  await navegador.close();
  process.exit(1);
}

for (const ciudad of CIUDADES) {
  const origen = `src/assets/fondos-origen/${ciudad.nombre}.jpg`;
  if (!existsSync(origen)) {
    console.error(`  falta ${origen}`);
    continue;
  }

  const url = await pagina.evaluate(
    async ({ ciudad, origen, filtro, calidad }) => {
      const imagen = new Image();
      imagen.src = `/${origen}`;
      await imagen.decode();

      const lienzo = document.createElement('canvas');
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imagen, 0, 0);

      const colorDe = (x, y) => {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return `rgb(${d[0]},${d[1]},${d[2]})`;
      };

      for (const parche of ciudad.parches) {
        const [x, y, ancho, alto] = parche.zona;
        const fondo = colorDe(parche.muestra[0], parche.muestra[1]);

        ctx.save();
        ctx.filter = 'blur(9px)';
        ctx.fillStyle = fondo;
        ctx.fillRect(x - 8, y - 8, ancho + 16, alto + 16);
        ctx.restore();

        if (parche.tipo === 'sol') {
          // un sol naciente con rayos, de los que se ven en todos los carteles
          // art deco de la epoca
          const cx = x + ancho / 2;
          const cy = y + alto * 0.78;
          const radio = Math.min(ancho, alto) * 0.42;

          ctx.save();
          ctx.strokeStyle = 'rgba(216,178,74,0.85)';
          ctx.lineWidth = 5;
          for (let i = 0; i < 9; i += 1) {
            const angulo = Math.PI + (i * Math.PI) / 8;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angulo) * radio * 1.15, cy + Math.sin(angulo) * radio * 1.15);
            ctx.lineTo(cx + Math.cos(angulo) * radio * 2.05, cy + Math.sin(angulo) * radio * 2.05);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(232,198,104,0.92)';
          ctx.beginPath();
          ctx.arc(cx, cy, radio, Math.PI, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = 'rgba(120,92,30,0.9)';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }
      }

      // tratamiento para que funcione como fondo
      const salida = document.createElement('canvas');
      salida.width = lienzo.width;
      salida.height = lienzo.height;
      const sctx = salida.getContext('2d');
      sctx.filter = filtro;
      sctx.drawImage(lienzo, 0, 0);

      return salida.toDataURL('image/jpeg', calidad);
    },
    { ciudad, origen, filtro: FILTRO, calidad: CALIDAD },
  );

  const contenido = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(`src/assets/fondos/${ciudad.nombre}.jpg`, contenido);
  console.log(
    `  ${ciudad.nombre.padEnd(12)} ${(contenido.length / 1024).toFixed(0).padStart(4)} KB` +
      (ciudad.parches.length ? `  (${ciudad.parches.length} marcas tapadas)` : ''),
  );
}

await navegador.close();
