// ---------------------------------------------------------------------------
// VALIDADOR DE NIVELES
//
// Comprueba que un nivel es jugable SIN habilidades, es decir, que tanto
// Martin como Simon pueden llegar de la P a la M solo corriendo y saltando.
// Usa los valores reales de src/config/ajustes.js, asi que si algun dia
// cambiamos la gravedad o el salto, basta con volver a ejecutarlo:
//
//   node herramientas/validar-nivel.mjs
// ---------------------------------------------------------------------------

import { NIVEL_1 } from '../src/niveles/nivel1.js';
import { MUNDO, FISICA, JUGADOR, ALCANCE } from '../src/config/ajustes.js';

const C = MUNDO.casilla;
const MARGEN = 0.85; // no damos por bueno un salto pixel-perfect
const ALTO_LIBRE_MINIMO = 2; // casillas: Simon mide 52 px

const SOLIDO = '#';
const PLATAFORMA = '=';

function esBloque(ch) {
  return ch === SOLIDO || ch === PLATAFORMA;
}

// --- modelo de salto --------------------------------------------------------

const h = ALCANCE.alturaSaltoPx;
const gSubida = FISICA.gravedad;
const gCaida = FISICA.gravedad * FISICA.multiplicadorCaida;
const v = JUGADOR.velocidad;

// Distancia horizontal maxima disponible para aterrizar a una diferencia de
// altura dy (positivo = subir), segun la parabola real del salto.
function distanciaMaxima(dy) {
  if (dy > h) return -1; // sencillamente no llega tan alto
  const tSubida = JUGADOR.impulsoSalto / gSubida;
  if (dy <= 0) {
    // baja: sube hasta h y luego cae h + |dy|
    return v * (tSubida + Math.sqrt((2 * (h - dy)) / gCaida));
  }
  // sube: tiempo hasta volver a bajar a la altura dy
  const tBajada = Math.sqrt((2 * (h - dy)) / gCaida);
  return v * (tSubida + tBajada);
}

// --- lectura del mapa -------------------------------------------------------

function analizar(nivel) {
  const mapa = nivel.mapa;
  const filas = mapa.length;
  const cols = mapa[0].length;
  const en = (c, f) => (f < 0 || f >= filas || c < 0 || c >= cols ? '.' : mapa[f][c]);

  const errores = [];
  const avisos = [];

  // 1. todas las filas miden lo mismo
  const anchos = [...new Set(mapa.map((f) => f.length))];
  if (anchos.length !== 1) errores.push(`Las filas no miden lo mismo: ${anchos.join(', ')}`);

  // 2. simbolos validos
  const validos = new Set([SOLIDO, PLATAFORMA, 'C', 'E', 'J', 'K', 'M', 'P', '.']);
  mapa.forEach((fila, f) => {
    [...fila].forEach((ch, c) => {
      if (!validos.has(ch)) errores.push(`Simbolo desconocido "${ch}" en columna ${c}, fila ${f}`);
    });
  });

  // 3. inventario
  const cuenta = {};
  mapa.join('').split('').forEach((ch) => {
    cuenta[ch] = (cuenta[ch] || 0) + 1;
  });
  if ((cuenta.P || 0) !== 1) errores.push(`Debe haber exactamente un inicio P (hay ${cuenta.P || 0})`);
  if ((cuenta.M || 0) !== 1) errores.push(`Debe haber exactamente una meta M (hay ${cuenta.M || 0})`);
  if ((cuenta.K || 0) < 1) avisos.push('El nivel no tiene ningun checkpoint');
  if ((cuenta.J || 0) > 1) errores.push(`Solo puede haber un jefe J (hay ${cuenta.J})`);

  // 4. superficies: tramos horizontales pisables
  const superficies = [];
  for (let f = 0; f < filas; f += 1) {
    let inicio = null;
    for (let c = 0; c <= cols; c += 1) {
      const pisable = esBloque(en(c, f)) && !esBloque(en(c, f - 1));
      if (pisable && inicio === null) inicio = c;
      if (!pisable && inicio !== null) {
        superficies.push({ fila: f, desde: inicio, hasta: c - 1, y: f * C });
        inicio = null;
      }
    }
  }
  superficies.forEach((s, i) => {
    s.id = i;
  });

  // 5. altura libre sobre cada superficie
  superficies.forEach((s) => {
    for (let c = s.desde; c <= s.hasta; c += 1) {
      let libre = 0;
      while (libre < ALTO_LIBRE_MINIMO && !esBloque(en(c, s.fila - 1 - libre))) libre += 1;
      if (libre < ALTO_LIBRE_MINIMO) {
        avisos.push(
          `Techo bajo en columna ${c}, fila ${s.fila}: solo ${libre} casilla(s) libres (Simon necesita ${ALTO_LIBRE_MINIMO})`,
        );
        break;
      }
    }
  });

  // 6. que superficie contiene cada cosa
  const posicion = (simbolo) => {
    for (let f = 0; f < filas; f += 1) {
      const c = mapa[f].indexOf(simbolo);
      if (c !== -1) return { col: c, fila: f };
    }
    return null;
  };
  const superficieBajo = (col, fila) => {
    for (let f = fila; f < filas; f += 1) {
      const s = superficies.find((sup) => sup.fila === f && col >= sup.desde && col <= sup.hasta);
      if (s) return s;
    }
    return null;
  };

  const inicio = posicion('P');
  const meta = posicion('M');
  const jefe = posicion('J');
  const supInicio = inicio && superficieBajo(inicio.col, inicio.fila);
  const supMeta = meta && superficieBajo(meta.col, meta.fila);
  if (!supInicio) errores.push('El inicio P no esta sobre ninguna superficie');
  if (!supMeta) errores.push('La meta M no esta sobre ninguna superficie');

  const supJefe = jefe && superficieBajo(jefe.col, jefe.fila);
  if (jefe && !supJefe) errores.push('El jefe J no esta sobre ninguna superficie');

  // 7. conectividad por saltos reales
  const separacion = (a, b) => {
    if (a.hasta >= b.desde && b.hasta >= a.desde) return 0; // se solapan
    return a.hasta < b.desde ? (b.desde - a.hasta - 1) * C : (a.desde - b.hasta - 1) * C;
  };

  const alcanzable = (a, b) => {
    const dy = a.y - b.y; // positivo = hay que subir
    const dmax = distanciaMaxima(dy);
    if (dmax < 0) return false;
    return separacion(a, b) <= dmax * MARGEN;
  };

  const visitadas = new Set([supInicio ? supInicio.id : -1]);
  const cola = supInicio ? [supInicio] : [];
  while (cola.length) {
    const actual = cola.shift();
    superficies.forEach((otra) => {
      if (visitadas.has(otra.id)) return;
      if (!alcanzable(actual, otra)) return;
      visitadas.add(otra.id);
      cola.push(otra);
    });
  }

  if (supMeta && !visitadas.has(supMeta.id)) {
    errores.push('La meta NO se puede alcanzar solo saltando: haria falta una habilidad');
  }

  // 8. informe de lo que queda fuera de alcance (contenido extra de habilidades)
  const extra = superficies.filter((s) => !visitadas.has(s.id));

  // 9. monedas fuera de alcance
  let monedasExtra = 0;
  mapa.forEach((fila, f) => {
    [...fila].forEach((ch, c) => {
      if (ch !== 'C') return;
      const s = superficieBajo(c, f);
      // una moneda flotando en el aire (sobre un hueco) se pilla en pleno salto
      const enElAire = !s || s.fila - f > 4;
      if (enElAire) return;
      if (!visitadas.has(s.id)) monedasExtra += 1;
    });
  });

  // El jefe necesita sitio para caminar y para que se le pueda esquivar.
  if (supJefe) {
    const anchoArena = (supJefe.hasta - supJefe.desde + 1) * C;
    if (anchoArena < 8 * C) {
      avisos.push(
        `La arena del jefe mide ${anchoArena} px (${supJefe.hasta - supJefe.desde + 1} casillas): se queda corta para esquivarlo`,
      );
    }
    if (!visitadas.has(supJefe.id)) errores.push('No se puede llegar hasta el jefe');
  }

  return { errores, avisos, cuenta, superficies, visitadas, extra, monedasExtra, supJefe };
}

// --- informe ----------------------------------------------------------------

const nivel = NIVEL_1;
const r = analizar(nivel);

console.log('');
console.log(`  NIVEL: ${nivel.nombre}`);
console.log(`  Tamano: ${nivel.mapa[0].length} x ${nivel.mapa.length} casillas`);
console.log(
  `  Mundo:  ${nivel.mapa[0].length * C} x ${nivel.mapa.length * C} px  (${(
    (nivel.mapa[0].length * C) /
    MUNDO.ancho
  ).toFixed(1)} pantallas de ancho)`,
);
console.log('');
console.log('  SALTO (calculado con los valores de ajustes.js)');
console.log(`    altura maxima .......... ${h.toFixed(1)} px = ${(h / C).toFixed(2)} casillas`);
console.log(
  `    distancia en llano ..... ${ALCANCE.distanciaSaltoPx.toFixed(1)} px = ${ALCANCE.distanciaSaltoCasillas.toFixed(2)} casillas`,
);
console.log(`    tiempo de vuelo ........ ${ALCANCE.tiempoVueloS.toFixed(3)} s`);
console.log('');
console.log('  CONTENIDO');
console.log(`    monedas ................ ${r.cuenta.C || 0}`);
console.log(`    enemigos ............... ${r.cuenta.E || 0}`);
console.log(`    checkpoints ............ ${r.cuenta.K || 0}`);
console.log(`    jefe ................... ${r.cuenta.J ? 'si' : 'no'}${r.supJefe ? ` (arena de ${r.supJefe.hasta - r.supJefe.desde + 1} casillas)` : ''}`);
console.log(`    superficies pisables ... ${r.superficies.length}`);
console.log('');
console.log('  ALCANCE SIN HABILIDADES');
console.log(`    superficies alcanzables. ${r.visitadas.size} de ${r.superficies.length}`);
console.log(`    monedas solo con habilidad: ${r.monedasExtra}`);
r.extra.forEach((s) => {
  console.log(`      · repisa en fila ${s.fila}, columnas ${s.desde}-${s.hasta} (contenido extra)`);
});
console.log('');

if (r.avisos.length) {
  console.log('  AVISOS');
  r.avisos.forEach((a) => console.log(`    ! ${a}`));
  console.log('');
}

if (r.errores.length) {
  console.log('  ERRORES');
  r.errores.forEach((e) => console.log(`    X ${e}`));
  console.log('');
  console.log('  RESULTADO: el nivel NO es jugable.');
  process.exit(1);
}

console.log('  RESULTADO: nivel valido y terminable con los dos personajes.');
console.log('');
