// ---------------------------------------------------------------------------
// COLOREAR LA PORTADA
//
// La ilustracion de portada viene en blanco y negro. En vez de inventarse un
// color por objeto (que quedaria sucio), se colorea como se hacia en los
// carteles de los anos 30: mapeando la luz de cada punto a una rampa de color.
// Lo oscuro va a tinta marron, los medios a rojo ladrillo y naranja, y las
// luces a crema y mostaza.
//
//   node herramientas/colorear-portada.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ORIGEN = 'src/assets/portada-origen/portada.jpg';
const DESTINO = 'src/assets/portada.jpg';

// La rampa: de sombra a luz. Se interpola entre estas paradas.
const RAMPA = [
  { en: 0.0, color: [27, 20, 16] },     // tinta
  { en: 0.28, color: [122, 46, 38] },   // rojo oscuro
  { en: 0.5, color: [196, 86, 48] },    // teja
  { en: 0.7, color: [232, 158, 70] },   // naranja tostado
  { en: 0.86, color: [243, 206, 120] }, // mostaza clara
  { en: 1.0, color: [250, 240, 214] },  // crema
];

if (!existsSync(ORIGEN)) {
  console.error(`No encuentro ${ORIGEN}`);
  process.exit(1);
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto('about:blank');

const datosImagen = `data:image/jpeg;base64,${readFileSync(ORIGEN).toString('base64')}`;

const url = await pagina.evaluate(
  async ({ origen, rampa }) => {
    const imagen = new Image();
    imagen.src = origen;
    await imagen.decode();

    const lienzo = document.createElement('canvas');
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imagen, 0, 0);

    const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
    const p = datos.data;

    const enLaRampa = (t) => {
      for (let i = 0; i < rampa.length - 1; i += 1) {
        const a = rampa[i];
        const b = rampa[i + 1];
        if (t <= b.en) {
          const k = (t - a.en) / (b.en - a.en || 1);
          return [
            a.color[0] + (b.color[0] - a.color[0]) * k,
            a.color[1] + (b.color[1] - a.color[1]) * k,
            a.color[2] + (b.color[2] - a.color[2]) * k,
          ];
        }
      }
      return rampa[rampa.length - 1].color;
    };

    // tabla de 256 entradas, para no interpolar en cada pixel
    const tabla = [];
    for (let i = 0; i < 256; i += 1) tabla.push(enLaRampa(i / 255));

    for (let i = 0; i < p.length; i += 4) {
      // luminancia perceptual
      const luz = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255;
      // un poco de contraste, que el original es plano
      const ajustada = Math.min(1, Math.max(0, (luz - 0.5) * 1.18 + 0.5));
      const c = tabla[Math.round(ajustada * 255)];
      p[i] = c[0];
      p[i + 1] = c[1];
      p[i + 2] = c[2];
    }
    ctx.putImageData(datos, 0, 0);

    return lienzo.toDataURL('image/jpeg', 0.9);
  },
  { origen: datosImagen, rampa: RAMPA },
);

const contenido = Buffer.from(url.split(',')[1], 'base64');
writeFileSync(DESTINO, contenido);
console.log(`  ${DESTINO} (${(contenido.length / 1024).toFixed(0)} KB)`);

await navegador.close();
