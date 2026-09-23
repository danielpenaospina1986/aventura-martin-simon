// ---------------------------------------------------------------------------
// PREPARAR LA PORTADA
//
// La ilustracion de portada ya viene a color y con el titulo dibujado dentro,
// asi que aqui no se le cambia el color: solo se ajusta de tamano y se guarda
// una segunda version desenfocada.
//
//   portada.jpg       la de la pantalla de titulo, tal cual
//   portada-menu.jpg  la misma, borrosa, que hace de fondo en los demas menus
//
// La borrosa va aparte y no se desenfoca en el juego porque un desenfoque por
// codigo sobre una imagen grande cuesta cada vez que se entra en un menu, y
// aqui se paga una sola vez.
//
//   node herramientas/preparar-portada.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ORIGEN = 'src/assets/portada-origen/portada.jpg';

// El juego dibuja a 640 x 360, asi que la portada nunca se ve a mas de unos
// 650 px de ancho: guardarla a 1280 era pagar el doble de memoria y de
// descarga para nada.
const SALIDAS = [
  { destino: 'src/assets/portada.jpg', ancho: 900, desenfoque: 0, calidad: 0.86 },
  // para los menus: borrosa y mas pequena, que encima lleva mucho texto
  { destino: 'src/assets/portada-menu.jpg', ancho: 640, desenfoque: 6, calidad: 0.8 },
];

if (!existsSync(ORIGEN)) {
  console.error(`No encuentro ${ORIGEN}`);
  process.exit(1);
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto('about:blank');

const datos = `data:image/jpeg;base64,${readFileSync(ORIGEN).toString('base64')}`;

for (const salida of SALIDAS) {
  const url = await pagina.evaluate(
    async ({ origen, ancho, desenfoque, calidad }) => {
      const imagen = new Image();
      imagen.src = origen;
      await imagen.decode();

      const escala = Math.min(1, ancho / imagen.naturalWidth);
      const w = Math.round(imagen.naturalWidth * escala);
      const h = Math.round(imagen.naturalHeight * escala);

      const lienzo = document.createElement('canvas');
      lienzo.width = w;
      lienzo.height = h;
      const ctx = lienzo.getContext('2d');
      ctx.imageSmoothingQuality = 'high';

      if (desenfoque > 0) {
        // Se dibuja un poco mas grande que el lienzo: si no, el desenfoque
        // chupa el blanco de fuera y deja los bordes lavados.
        ctx.filter = `blur(${desenfoque}px)`;
        const margen = desenfoque * 3;
        ctx.drawImage(imagen, -margen, -margen, w + margen * 2, h + margen * 2);
        ctx.filter = 'none';
      } else {
        ctx.drawImage(imagen, 0, 0, w, h);
      }

      return lienzo.toDataURL('image/jpeg', calidad);
    },
    { origen: datos, ancho: salida.ancho, desenfoque: salida.desenfoque, calidad: salida.calidad },
  );

  const contenido = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(salida.destino, contenido);
  console.log(`  ${salida.destino} (${(contenido.length / 1024).toFixed(0)} KB)`);
}

await navegador.close();
