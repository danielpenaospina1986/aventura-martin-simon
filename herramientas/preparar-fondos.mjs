// ---------------------------------------------------------------------------
// PREPARAR LOS FONDOS DE CADA CIUDAD
//
// Por cada ilustracion de partida (src/assets/fondos-origen/) hace dos cosas:
//
//   1. Pone parches donde haga falta. De momento NO hace falta en ninguna: el
//      juego es un regalo de Daniel para sus hijos, sin ningun fin comercial,
//      asi que los rotulos y los logotipos que salgan en las ilustraciones se
//      quedan como estan. Taparlos con palomas convertia a las palomas en las
//      protagonistas del cuadro.
//
//      El mecanismo se conserva por si algun dia hiciera falta: cada parche
//      dice su zona y de que tipo es ('paloma' posa una bandada encima, 'sol'
//      dibuja un sol art deco, y sin tipo rellena con un color de muestra).
//   2. La desenfoca, que es lo que la manda al fondo: el detalle de la
//      ilustracion competia con el personaje y los premios. El color no se
//      toca.
//
//   node herramientas/preparar-fondos.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

// Solo desenfoque. El color se deja intacto a proposito: antes se bajaba la
// saturacion y se subia el brillo para que el personaje no se perdiera dentro
// del dibujo, pero eso dejaba las ciudades lavadas. Ahora el fondo se distingue
// por estar LEJOS (desenfocado y moviendose despacio), no por estar apagado.
const FILTRO = 'blur(3px)';
const CALIDAD = 0.86;

// Las palomas que hacen de parche. Son las mismas que cruzan los tableros.
const PALOMAS = [
  'src/assets/bichos/paloma/vuela4.png',
  'src/assets/bichos/paloma/vuela5.png',
  'src/assets/bichos/paloma/suelta1.png',
];

const CIUDADES = [
  { nombre: 'space-coast', parches: [] },
  { nombre: 'medellin', parches: [] },
  // Atlanta y Miami traen rotulos y emblemas de marcas de verdad. Se dejan: el
  // juego no es comercial y taparlos estropeaba la ilustracion. Las zonas que
  // se llegaron a parchear quedan apuntadas por si alguna vez hicieran falta:
  //   aros [872,368,330,165] · emblema [456,406,92,60] · rotulo [238,512,162,48]
  //   botella [226,344,66,140] · "world of" [52,498,196,68]
  //   nombre [440,522,240,40] · pie del monumento [930,686,218,40]
  { nombre: 'atlanta', parches: [] },
  //   hotel [196,352,200,52] y [238,62,74,280] · fondo [700,218,150,44],
  //   [905,220,130,120] y [1030,225,90,60]
  { nombre: 'miami', parches: [] },
  { nombre: 'cartagena', parches: [] },
];

if (!existsSync('src/assets/fondos')) mkdirSync('src/assets/fondos', { recursive: true });

// El navegador solo hace de lienzo: las imagenes se le pasan ya leidas, no por
// el servidor. Asi la herramienta no depende de que el servidor este levantado
// y, sobre todo, no se corta cuando Vite recarga la pagina a media faena.
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto('about:blank');

for (const ciudad of CIUDADES) {
  const origen = `src/assets/fondos-origen/${ciudad.nombre}.jpg`;
  if (!existsSync(origen)) {
    console.error(`  falta ${origen}`);
    continue;
  }

  const url = await pagina.evaluate(
    async ({ ciudad, origen, palomas, filtro, calidad }) => {
      const imagen = new Image();
      imagen.src = origen;
      await imagen.decode();

      const lienzo = document.createElement('canvas');
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imagen, 0, 0);

      const aves = [];
      for (const dato of palomas) {
        const ave = new Image();
        ave.src = dato;
        await ave.decode();
        aves.push(ave);
      }

      const colorDe = (x, y) => {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return `rgb(${d[0]},${d[1]},${d[2]})`;
      };

      for (const parche of ciudad.parches) {
        const [x, y, ancho, alto] = parche.zona;

        if (parche.tipo === 'paloma') {
          // Una bandada posada encima del rotulo. No hace falta borrar nada
          // debajo: con que se coman las letras, el nombre deja de leerse. En
          // los carteles largos se reparten varias, que una sola gigante queda
          // rara.
          // Los rotulos anchos llevan la bandada en fila; los verticales, en
          // columna. Con una sola formula, un rotulo alto y estrecho pedia una
          // paloma del tamano de media ilustracion.
          const enColumna = alto > ancho;
          const cuantas = enColumna
            ? Math.max(1, Math.round(alto / 110))
            : Math.max(1, Math.round(ancho / 150));
          const anchoAve = Math.min(
            210,
            enColumna
              ? Math.max(ancho * 1.8, (alto / cuantas) * 1.3)
              : Math.max((ancho / cuantas) * 1.15, alto * 1.9),
          );

          for (let i = 0; i < cuantas; i += 1) {
            const ave = aves[(parche.pose + i) % aves.length];
            if (!ave) continue;
            const escala = anchoAve / ave.naturalWidth;
            const w = ave.naturalWidth * escala;
            const h = ave.naturalHeight * escala;
            // un poco de vaiven, que no parezcan clavadas en fila
            const vaiven = i % 2 === 0 ? -1 : 1;
            const cx = enColumna
              ? x + ancho / 2 + vaiven * ancho * 0.18
              : x + (ancho * (i + 0.5)) / cuantas;
            const cy = enColumna
              ? y + (alto * (i + 0.5)) / cuantas
              : y + alto / 2 + vaiven * alto * 0.11;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + h * 0.3, w * 0.24, h * 0.045, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // las de en medio miran al otro lado
            ctx.save();
            if (i % 2 === 1) {
              ctx.translate(cx, cy);
              ctx.scale(-1, 1);
              ctx.drawImage(ave, -w / 2, -h / 2, w, h);
            } else {
              ctx.drawImage(ave, cx - w / 2, cy - h / 2, w, h);
            }
            ctx.restore();
          }
        } else {
          const fondo = colorDe(parche.muestra[0], parche.muestra[1]);
          ctx.save();
          ctx.filter = 'blur(9px)';
          ctx.fillStyle = fondo;
          ctx.fillRect(x - 8, y - 8, ancho + 16, alto + 16);
          ctx.restore();
        }

        if (parche.tipo === 'emblema') {
          // Un rombo art deco en el sitio donde habia un emblema de marca. Un
          // relleno liso se lee como borron; un motivo geometrico se lee como
          // parte del cartel, que es lo que habia.
          const cx = x + ancho / 2;
          const cy = y + alto / 2;
          const rx = ancho * 0.3;
          const ry = alto * 0.42;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy - ry);
          ctx.lineTo(cx + rx, cy);
          ctx.lineTo(cx, cy + ry);
          ctx.lineTo(cx - rx, cy);
          ctx.closePath();
          ctx.fillStyle = 'rgba(226,196,114,0.88)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(40,62,86,0.85)';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(40,62,86,0.55)';
          ctx.lineWidth = 2;
          [-0.35, 0, 0.35].forEach((t) => {
            const semi = rx * (1 - Math.abs(t));
            ctx.beginPath();
            ctx.moveTo(cx - semi * 0.7, cy + ry * t);
            ctx.lineTo(cx + semi * 0.7, cy + ry * t);
            ctx.stroke();
          });
          ctx.restore();
        }

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
    {
      ciudad,
      origen: `data:image/jpeg;base64,${readFileSync(origen).toString('base64')}`,
      palomas: PALOMAS.map((ruta) =>
        existsSync(ruta) ? `data:image/png;base64,${readFileSync(ruta).toString('base64')}` : null,
      ).filter(Boolean),
      filtro: FILTRO,
      calidad: CALIDAD,
    },
  );

  const contenido = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(`src/assets/fondos/${ciudad.nombre}.jpg`, contenido);
  console.log(
    `  ${ciudad.nombre.padEnd(12)} ${(contenido.length / 1024).toFixed(0).padStart(4)} KB` +
      (ciudad.parches.length ? `  (${ciudad.parches.length} marcas tapadas)` : ''),
  );
}

await navegador.close();
