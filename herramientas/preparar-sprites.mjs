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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ALTO_PERSONAJE = 240; // alto del muneco dentro del lienzo, en pixeles
const LIENZO = { ancho: 260, alto: 260 };
const SERVIDOR = 'http://127.0.0.1:5173';

const PERSONAJES = [
  {
    nombre: 'simon',
    origen: 'src/assets/simon-origen',
    destino: 'src/assets/simon',
    // poses sueltas, una por archivo
    poses: ['quieto', 'lanza'],
    // hojas con varias poses en rejilla. "recorteAbajo" quita la franja de la
    // etiqueta que llevan escrita debajo de cada dibujo.
    // Las poses se buscan solas dentro de la hoja: no hace falta que esten en
    // una rejilla regular (en la de carrera, la fila de abajo va centrada).
    // Los nombres se asignan en orden de lectura.
    hojas: [
      { archivo: 'hoja-carrera', nombres: ['corre1', 'corre2', 'corre3', 'corre4', 'corre5'] },
      { archivo: 'hoja-extras', nombres: ['golpe', 'victoria'] },
    ],
  },
  {
    nombre: 'banera',
    // su espuma blanca es casi gris puro: con la tolerancia de siempre se iba
    // con el fondo y el bicho quedaba agujereado
    tolerancia: 5,
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/bichos/banera',
    poses: [],
    hojas: [
      {
        archivo: 'banera',
        nombres: ['quieta', 'anda1', 'anda2', 'carga', 'lanza'],
      },
    ],
  },
  {
    nombre: 'paloma',
    tolerancia: 6,
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/bichos/paloma',
    poses: [],
    extension: 'webp',
    hojas: [
      {
        archivo: 'paloma',
        extension: 'webp',
        nombres: ['vuela1', 'vuela2', 'vuela3', 'vuela4', 'vuela5', 'suelta1', 'suelta2', 'vuela6'],
      },
    ],
  },
  {
    nombre: 'martin',
    origen: 'src/assets/martin-origen',
    destino: 'src/assets/martin',
    poses: ['quieto'],
    // La hoja trae, en orden de lectura: dolor, victoria, el ciclo de carrera
    // de cuatro y dos de ataque con la katana.
    hojas: [
      {
        archivo: 'hoja',
        nombres: ['golpe', 'victoria', 'corre1', 'corre2', 'corre3', 'corre4', 'ataque1', 'ataque2'],
      },
    ],
  },
];

// El navegador solo se usa como lienzo de dibujo: las imagenes se le pasan ya
// leidas, no por el servidor. Asi la herramienta no depende de que el servidor
// este levantado, y sobre todo no se corta si Vite recarga la pagina a mitad.
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto('about:blank');

const comoDatos = (ruta) => {
  const tipo = ruta.endsWith('.webp') ? 'webp' : ruta.endsWith('.png') ? 'png' : 'jpeg';
  return `data:image/${tipo};base64,${readFileSync(ruta).toString('base64')}`;
};

for (const personaje of PERSONAJES) {
  if (!existsSync(personaje.destino)) mkdirSync(personaje.destino, { recursive: true });

  // --- 1. reunir todas las poses del personaje, sueltas y de hojas ---
  const trabajos = [];

  for (const pose of personaje.poses || []) {
    const origen = `${personaje.origen}/${pose}.${personaje.extension || 'jpg'}`;
    if (!existsSync(origen)) {
      console.error(`  falta ${origen}`);
      continue;
    }
    trabajos.push({ nombre: pose, origen: comoDatos(origen), zona: null });
  }

  for (const hoja of personaje.hojas || []) {
    const origen = `${personaje.origen}/${hoja.archivo}.${hoja.extension || 'jpg'}`;
    if (!existsSync(origen)) {
      console.error(`  falta ${origen}`);
      continue;
    }
    const datos = comoDatos(origen);
    const zonas = await buscarPoses(pagina, datos, personaje.tolerancia);
    console.log(`  ${hoja.archivo}: encontradas ${zonas.length} poses`);
    for (let i = 0; i < zonas.length && i < hoja.nombres.length; i += 1) {
      trabajos.push({ nombre: hoja.nombres[i], origen: datos, zona: zonas[i] });
    }
  }

  // --- 2. medirlas todas y sacar UN factor de escala para el personaje ---
  //
  // Si cada pose se escalara a su propia altura, el personaje encogeria y
  // creceria al animarse: en un aleteo, la pose con las alas abiertas es mas
  // alta que la de las alas pegadas, y esa diferencia es justo la animacion.
  const medidas = [];
  for (const trabajo of trabajos) {
    const m = await medirPose(pagina, {
      origen: trabajo.origen,
      zona: trabajo.zona,
      tolerancia: personaje.tolerancia,
      altoPersonaje: ALTO_PERSONAJE,
      lienzoAncho: LIENZO.ancho,
      lienzoAlto: LIENZO.alto,
    });
    medidas.push(m);
  }

  const altoMaximo = Math.max(...medidas.map((m) => m.alto));
  const anchoMaximo = Math.max(...medidas.map((m) => m.ancho));
  const factor = Math.min(
    ALTO_PERSONAJE / altoMaximo,
    (LIENZO.ancho * 0.96) / anchoMaximo,
  );

  // --- 3. recortarlas con ese factor ---
  for (let i = 0; i < trabajos.length; i += 1) {
    const trabajo = trabajos[i];
    const resultado = await recortarPose(pagina, {
      origen: trabajo.origen,
      zona: trabajo.zona,
      tolerancia: personaje.tolerancia,
      altoPersonaje: ALTO_PERSONAJE,
      lienzoAncho: LIENZO.ancho,
      lienzoAlto: LIENZO.alto,
      factor,
    });
    if (!resultado.url) continue;

    const contenido = Buffer.from(resultado.url.split(',')[1], 'base64');
    writeFileSync(`${personaje.destino}/${trabajo.nombre}.png`, contenido);
    console.log(
      `  ${personaje.nombre}/${trabajo.nombre.padEnd(9)} ${(contenido.length / 1024).toFixed(0).padStart(3)} KB` +
        `  · ${resultado.recorte}`,
    );
  }
  console.log(`  (factor comun ${factor.toFixed(3)} para ${trabajos.length} poses)
`);
}

await navegador.close();

// ---------------------------------------------------------------------------

// Busca los dibujos sueltos dentro de una hoja. Quita el fondo, mira que filas
// y que columnas tienen algo, y de ahi saca los rectangulos. Descarta lo que sea
// demasiado bajo para ser un personaje: son las etiquetas escritas debajo.
async function buscarPoses(pagina, origen, tolerancia) {
  return pagina.evaluate(async ({ origen, tolerancia }) => {
    const imagen = new Image();
    imagen.src = origen;
    await imagen.decode();

    const ancho = imagen.naturalWidth;
    const alto = imagen.naturalHeight;
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imagen, 0, 0);

    const datos = ctx.getImageData(0, 0, ancho, alto);
    const p = datos.data;
    const tol = tolerancia || 24;
    const esFondo = (i) => {
      const r = p[i];
      const g = p[i + 1];
      const b = p[i + 2];
      return r > 92 && Math.abs(r - g) < tol && Math.abs(g - b) < tol && Math.abs(r - b) < tol;
    };

    const hay = new Uint8Array(ancho * alto);
    for (let i = 0; i < ancho * alto; i += 1) hay[i] = esFondo(i * 4) ? 0 : 1;

    const bandas = [];
    let desde = null;
    for (let y = 0; y <= alto; y += 1) {
      let ocupada = false;
      if (y < alto) {
        for (let x = 0; x < ancho; x += 1) {
          if (hay[y * ancho + x]) { ocupada = true; break; }
        }
      }
      if (ocupada && desde === null) desde = y;
      if (!ocupada && desde !== null) {
        if (y - desde > alto * 0.18) bandas.push({ y: desde, alto: y - desde });
        desde = null;
      }
    }

    const zonas = [];
    for (const banda of bandas) {
      let inicio = null;
      // Se pide un minimo de pixeles para dar una columna por ocupada: con un
      // solo pixel suelto, dos dibujos vecinos se quedaban pegados en uno.
      const minimoPixeles = Math.max(3, Math.round(banda.alto * 0.035));
      for (let x = 0; x <= ancho; x += 1) {
        let cuenta = 0;
        if (x < ancho) {
          for (let y = banda.y; y < banda.y + banda.alto; y += 1) {
            if (hay[y * ancho + x]) cuenta += 1;
          }
        }
        const ocupada = cuenta >= minimoPixeles;
        if (ocupada && inicio === null) inicio = x;
        if (!ocupada && inicio !== null) {
          const anchoIsla = x - inicio;
          if (anchoIsla > ancho * 0.06) {
            zonas.push({ x: inicio, y: banda.y, ancho: anchoIsla, alto: banda.alto });
          }
          inicio = null;
        }
      }
    }
    return zonas;
  }, { origen, tolerancia });
}

// Mide una pose sin escribirla: sirve para calcular el factor comun.
async function medirPose(pagina, opciones) {
  return recortarPose(pagina, { ...opciones, soloMedir: true });
}

async function recortarPose(pagina, opciones) {
  return pagina.evaluate(
      async ({ origen, zona, altoPersonaje, lienzoAncho, lienzoAlto, factor, soloMedir, tolerancia }) => {
        const imagen = new Image();
        imagen.src = origen;
        await imagen.decode();

        // Si viene de una hoja, se recorta primero la celda que toca; si no,
        // se trabaja con la imagen entera.
        let origenX = 0;
        let origenY = 0;
        let ancho = imagen.naturalWidth;
        let alto = imagen.naturalHeight;

        if (zona) {
          origenX = zona.x;
          origenY = zona.y;
          ancho = zona.ancho;
          alto = zona.alto;
        }

        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(imagen, origenX, origenY, ancho, alto, 0, 0, ancho, alto);

        // --- quitar el damero del fondo, entrando desde los bordes ---
        const datos = ctx.getImageData(0, 0, ancho, alto);
        const p = datos.data;
        const visto = new Uint8Array(ancho * alto);
        // El damero es gris y claro, pero no siempre igual: en unas poses es
        // gris puro y en otras viene tenido y mas oscuro (hasta 96). Por eso el
        // umbral es bajo y la tolerancia de color, ancha. Al dibujo no le afecta:
        // la piel, la ropa y el pelo tienen mucha mas diferencia entre canales.
        // El damero es gris puro; el dibujo, aunque parezca blanco, casi
        // siempre tira un poco a calido o a frio. La tolerancia dice cuanto se
        // permite: en un dibujo con espuma blanca hay que apretarla, o la
        // espuma se va con el fondo.
        const tol = tolerancia || 24;
        const esFondo = (i) => {
          const r = p[i];
          const g = p[i + 1];
          const b = p[i + 2];
          return (
            r > 92 && Math.abs(r - g) < tol && Math.abs(g - b) < tol && Math.abs(r - b) < tol
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
        // Con la tolerancia apretada quedan restos del damero pegados al
        // contorno (la compresion del JPG tine un poco esos bordes). Se limpian
        // con unas pasadas suaves: un pixel grisaceo con vecinos transparentes
        // era fondo, no dibujo.
        const transparente = (x, y) => {
          if (x < 0 || y < 0 || x >= ancho || y >= alto) return true;
          return p[(y * ancho + x) * 4 + 3] === 0;
        };
        for (let pasada = 0; pasada < 3; pasada += 1) {
          const quitar = [];
          for (let y = 0; y < alto; y += 1) {
            for (let x = 0; x < ancho; x += 1) {
              const i = (y * ancho + x) * 4;
              if (p[i + 3] === 0) continue;
              const r = p[i];
              const g = p[i + 1];
              const b = p[i + 2];
              const grisaceo =
                r > 120 && Math.abs(r - g) < 26 && Math.abs(g - b) < 26 && Math.abs(r - b) < 26;
              if (!grisaceo) continue;
              const vecinos =
                Number(transparente(x + 1, y)) +
                Number(transparente(x - 1, y)) +
                Number(transparente(x, y + 1)) +
                Number(transparente(x, y - 1));
              if (vecinos >= 2) quitar.push(i);
            }
          }
          if (!quitar.length) break;
          quitar.forEach((i) => {
            p[i + 3] = 0;
          });
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

        // una celda vacia (las hojas no siempre estan completas)
        if (anchoUtil < 20 || altoUtil < 20) return { url: null, recorte: 'vacia' };

        if (soloMedir) return { url: null, ancho: anchoUtil, alto: altoUtil };

        // --- todas las poses con el MISMO factor, apoyadas abajo ---
        const salida = document.createElement('canvas');
        salida.width = lienzoAncho;
        salida.height = lienzoAlto;
        const sctx = salida.getContext('2d');
        sctx.imageSmoothingQuality = 'high';

        const escala = factor || altoPersonaje / altoUtil;
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
          ancho: anchoUtil,
          alto: altoUtil,
        };
      },
    opciones,
  );
}
