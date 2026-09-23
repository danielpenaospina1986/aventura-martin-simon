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
    // su hoja viene sobre verde liso, asi que el detector la recorta por tono y
    // la tolerancia del damero no se usa
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

// Detector de fondo, compartido por las dos fases (buscar poses y recortarlas).
//
// Hay dos clases de original: los que vienen sobre el damero gris y blanco de
// los generadores de imagenes, y los que vienen sobre un color liso, como la
// hoja de baneras que Daniel pidio en verde justamente para que el recorte
// saliera limpio. Se distinguen mirando las cuatro esquinas: si coinciden entre
// si y no son grises, el fondo es liso.
await pagina.evaluate(() => {
  const tonoDe = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return -1;
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };

  window.detectorDeFondo = (p, ancho, alto, tolerancia) => {
    const en = (x, y) => {
      const i = (y * ancho + x) * 4;
      return [p[i], p[i + 1], p[i + 2]];
    };
    const esquinas = [en(2, 2), en(ancho - 3, 2), en(2, alto - 3), en(ancho - 3, alto - 3)];
    const [r0, g0, b0] = esquinas[0];
    const parecidas = esquinas.every(
      ([r, g, b]) => Math.abs(r - r0) < 22 && Math.abs(g - g0) < 22 && Math.abs(b - b0) < 22,
    );
    const casiGris = Math.abs(r0 - g0) < 22 && Math.abs(g0 - b0) < 22 && Math.abs(r0 - b0) < 22;

    if (parecidas && !casiGris) {
      // Fondo de color liso. Se compara por TONO y no por color exacto, porque
      // la sombra que el dibujante pone bajo el bicho es ese mismo verde pero
      // mas oscuro, y tiene que irse con el fondo. Lo que no tiene color (la
      // porcelana, el metal, el contorno negro) se queda siempre.
      const tonoFondo = tonoDe(r0, g0, b0);
      const comoElFondo = (i, margen, satMinima) => {
        const r = p[i];
        const g = p[i + 1];
        const b = p[i + 2];
        const max = Math.max(r, g, b);
        if (max === 0) return false;
        if ((max - Math.min(r, g, b)) / max < satMinima) return false;
        const t = tonoDe(r, g, b);
        if (t < 0) return false;
        const dif = Math.abs(t - tonoFondo);
        return Math.min(dif, 360 - dif) < margen;
      };
      return {
        esFondo: (i) => comoElFondo(i, 34, 0.17),
        // mas ancho, para el halo que deja la compresion del JPG en el contorno
        esResiduo: (i) => comoElFondo(i, 52, 0.10),
      };
    }

    // Damero gris y blanco, como hasta ahora.
    const tol = tolerancia || 24;
    const gris = (i, t, minimo) => {
      const r = p[i];
      const g = p[i + 1];
      const b = p[i + 2];
      return r > minimo && Math.abs(r - g) < t && Math.abs(g - b) < t && Math.abs(r - b) < t;
    };
    return {
      esFondo: (i) => gris(i, tol, 92),
      esResiduo: (i) => gris(i, 26, 120),
    };
  };
});

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
    // cada archivo es su propio grupo: el muneco esta dibujado a una escala
    // distinta en cada uno
    trabajos.push({ nombre: pose, origen: comoDatos(origen), zona: null, grupo: `suelta:${pose}` });
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
      trabajos.push({
        nombre: hoja.nombres[i],
        origen: datos,
        zona: zonas[i],
        grupo: `hoja:${hoja.archivo}`,
      });
    }
  }

  // --- 2. medirlas y sacar un factor de escala POR ARCHIVO DE ORIGEN ---
  //
  // Dentro de una misma hoja, que una pose sea mas alta que otra es la
  // animacion: al correr el muneco se inclina, y eso hay que conservarlo. Asi
  // que las poses de una hoja comparten factor.
  //
  // Entre archivos distintos es al reves: el mismo muneco esta dibujado mas
  // grande en unos que en otros, y eso no es animacion, es el encuadre del
  // dibujante. Si se les da un factor comun, el personaje cambia de tamano al
  // pasar de estar quieto (imagen suelta) a correr (hoja). Por eso cada
  // archivo se normaliza por separado, hasta la misma altura de muneco.
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

  const grupos = new Map();
  trabajos.forEach((trabajo, i) => {
    const m = medidas[i];
    const g = grupos.get(trabajo.grupo) || {
      altoCuerpo: 0,
      altoTotal: 0,
      anchoTotal: 0,
    };
    g.altoCuerpo = Math.max(g.altoCuerpo, m.alto);
    g.altoTotal = Math.max(g.altoTotal, m.altoTotal || m.alto);
    g.anchoTotal = Math.max(g.anchoTotal, m.anchoTotal || m.ancho);
    grupos.set(trabajo.grupo, g);
  });

  // El muneco quiere medir ALTO_PERSONAJE, pero el dibujo entero (con su polvo
  // y sus rayas de movimiento) tiene que caber en el lienzo. Si a algun grupo
  // no le cabe, se rebaja la altura de TODOS: mas vale el muneco un poco mas
  // pequeno que unas poses mayores que otras.
  let altoObjetivo = ALTO_PERSONAJE;
  for (const g of grupos.values()) {
    const tope = Math.min(
      (LIENZO.alto * 0.99) / g.altoTotal,
      (LIENZO.ancho * 0.98) / g.anchoTotal,
    );
    altoObjetivo = Math.min(altoObjetivo, g.altoCuerpo * tope);
  }

  const factores = new Map();
  for (const [nombre, g] of grupos) factores.set(nombre, altoObjetivo / g.altoCuerpo);

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
      factor: factores.get(trabajo.grupo),
    });
    if (!resultado.url) continue;

    const contenido = Buffer.from(resultado.url.split(',')[1], 'base64');
    writeFileSync(`${personaje.destino}/${trabajo.nombre}.png`, contenido);
    console.log(
      `  ${personaje.nombre}/${trabajo.nombre.padEnd(9)} ${(contenido.length / 1024).toFixed(0).padStart(3)} KB` +
        `  · ${resultado.recorte}`,
    );
  }
  const detalle = [...factores]
    .map(([nombre, f]) => `${nombre} x${f.toFixed(3)}`)
    .join(', ');
  console.log(`  (muneco de ${altoObjetivo.toFixed(0)} px · ${detalle})
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
    const { esFondo } = window.detectorDeFondo(p, ancho, alto, tolerancia);

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
        const { esFondo, esResiduo } = window.detectorDeFondo(p, ancho, alto, tolerancia);

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
              if (!esResiduo(i)) continue;
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

        // Ni para medir ni para colocar vale el recuadro entero: incluye el
        // polvo, las rayas de movimiento y la sombra, que cambian de una pose a
        // otra. Lo que interesa es el cuerpo, que es la mancha conectada mas
        // grande del dibujo.
        const mancha = (() => {
          const visitado = new Uint8Array(ancho * alto);
          let mejor = null;
          for (let y0 = 0; y0 < alto; y0 += 1) {
            for (let x0 = 0; x0 < ancho; x0 += 1) {
              const raiz = y0 * ancho + x0;
              if (visitado[raiz] || p[raiz * 4 + 3] <= 24) continue;
              let cuenta = 0;
              let bx1 = x0;
              let bx2 = x0;
              let by1 = y0;
              let by2 = y0;
              const pila = [raiz];
              visitado[raiz] = 1;
              while (pila.length) {
                const idx = pila.pop();
                const x = idx % ancho;
                const y = (idx - x) / ancho;
                cuenta += 1;
                if (x < bx1) bx1 = x;
                if (x > bx2) bx2 = x;
                if (y < by1) by1 = y;
                if (y > by2) by2 = y;
                const vecinos = [idx + 1, idx - 1, idx + ancho, idx - ancho];
                for (let k = 0; k < 4; k += 1) {
                  const v = vecinos[k];
                  if (v < 0 || v >= ancho * alto || visitado[v]) continue;
                  // no saltar de una fila a otra por los lados
                  if (k < 2 && Math.floor(v / ancho) !== y) continue;
                  if (p[v * 4 + 3] <= 24) continue;
                  visitado[v] = 1;
                  pila.push(v);
                }
              }
              if (!mejor || cuenta > mejor.cuenta) {
                mejor = { cuenta, ancho: bx2 - bx1 + 1, alto: by2 - by1 + 1, pie: by2 };
              }
            }
          }
          return mejor;
        })();

        if (soloMedir) {
          return {
            url: null,
            ancho: mancha ? mancha.ancho : anchoUtil,
            alto: mancha ? mancha.alto : altoUtil,
            anchoTotal: anchoUtil,
            altoTotal: altoUtil,
          };
        }

        // --- todas las poses con el MISMO factor, apoyadas abajo ---
        const salida = document.createElement('canvas');
        salida.width = lienzoAncho;
        salida.height = lienzoAlto;
        const sctx = salida.getContext('2d');
        sctx.imageSmoothingQuality = 'high';

        const escala = factor || altoPersonaje / altoUtil;
        const destinoAncho = anchoUtil * escala;
        const destinoAlto = altoUtil * escala;

        // Se apoya el CUERPO en la linea de suelo del lienzo. Alinear por el
        // borde de abajo del dibujo dejaba al bicho flotando en las poses que
        // llevan sombra o salpicadura debajo de los pies.
        const pieDelCuerpo = mancha ? (mancha.pie - minY + 1) * escala : destinoAlto;
        const arriba = lienzoAlto - 6 - pieDelCuerpo;

        sctx.drawImage(
          lienzo,
          minX,
          minY,
          anchoUtil,
          altoUtil,
          (lienzoAncho - destinoAncho) / 2,
          arriba,
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
