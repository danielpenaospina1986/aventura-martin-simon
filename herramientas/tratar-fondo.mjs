// ---------------------------------------------------------------------------
// TRATAR EL FONDO
//
// Coge la ilustracion original (src/assets/fondo-barrio-original.jpg), la
// desenfoca un poco y le baja el color, y guarda el resultado en
// src/assets/fondo-barrio.jpg, que es el que usa el juego.
//
// Por que: la ilustracion tiene muchisimo detalle y lineas oscuras por toda la
// pantalla. Sin tratar, el personaje, las monedas y los enemigos se pierden
// dentro del dibujo. Tratada, sigue reconociendose pero deja jugar.
//
// Se ejecuta con el servidor de desarrollo levantado (npm run dev):
//
//   node herramientas/tratar-fondo.mjs
//
// Para cambiar el resultado, tocar FILTRO (es un filtro CSS normal):
//   mas nitido  -> bajar el blur
//   mas colorido -> subir el saturate
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { writeFileSync, existsSync } from 'node:fs';

const FILTRO = 'blur(2.5px) saturate(0.72) brightness(1.10)';
const CALIDAD = 0.86;
const ORIGEN = 'src/assets/fondo-barrio-original.jpg';
const DESTINO = 'src/assets/fondo-barrio.jpg';
const SERVIDOR = 'http://127.0.0.1:5173';

if (!existsSync(ORIGEN)) {
  console.error(`No encuentro ${ORIGEN}`);
  process.exit(1);
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

const datos = await pagina.evaluate(
  async ({ filtro, origen, calidad }) => {
    const imagen = new Image();
    imagen.src = `/${origen}`;
    await imagen.decode();

    const lienzo = document.createElement('canvas');
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;

    const ctx = lienzo.getContext('2d');
    ctx.filter = filtro;
    ctx.drawImage(imagen, 0, 0);

    return lienzo.toDataURL('image/jpeg', calidad);
  },
  { filtro: FILTRO, origen: ORIGEN, calidad: CALIDAD },
);

const contenido = Buffer.from(datos.split(',')[1], 'base64');
writeFileSync(DESTINO, contenido);

console.log(`  Filtro:  ${FILTRO}`);
console.log(`  Escrito: ${DESTINO} (${(contenido.length / 1024).toFixed(0)} KB)`);

await navegador.close();
