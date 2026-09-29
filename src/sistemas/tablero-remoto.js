// ---------------------------------------------------------------------------
// EL TABLERO DE LA NUBE
//
// Habla con la base de datos de Firebase por REST. Dos cosas hace, y nada mas:
// SUBIR una partida y BAJAR las diez mejores.
//
// Reglas de la casa, las tres:
//
//  1. NUNCA revienta. Todo lo que sale de aqui son promesas que no fallan: si
//     no hay internet, si la base no contesta o si contesta cualquier cosa, se
//     devuelve `false` o una lista vacia y el juego sigue su camino. Un tablero
//     es un adorno; que un nino no pueda jugar porque el wifi esta malo, no.
//  2. NUNCA hace esperar. El juego pinta su tablero de casa al instante y lo de
//     la nube llega despues, cuando llegue. Por eso todas las llamadas llevan
//     plazo (`NUBE.esperaMs`) y se cortan solas.
//  3. LO QUE NO SUBE, NO SE PIERDE. Si una partida no se pudo subir se guarda
//     en una cola en el navegador y se reintenta a la siguiente. De este
//     tablero depende el premio de diciembre: perder la tarde de un nino
//     porque el wifi se cayo justo en ese momento no es aceptable.
//
// La fila se guarda con el IDENTIFICADOR DE LA PARTIDA como clave, asi que una
// misma partida ocupa una sola fila por mucho que se apunte diez veces. Es la
// misma regla que ya valia en el tablero de casa, y aqui sale gratis.
// ---------------------------------------------------------------------------

import { NUBE, hayNube } from '../config/nube.js';

// Las partidas que no se pudieron subir, a la espera de que vuelva el internet.
const COLA = 'aventura-nube-pendientes';

// Cuantas se guardan en la cola. Mas que esto es que lleva semanas sin conexion
// y las viejas ya no le importan a nadie.
const CABEN_EN_COLA = 30;

function direccionDe(rama, consulta = '') {
  const base = String(NUBE.url).replace(/\/+$/, '');
  return `${base}/${NUBE.rama}${rama}.json${consulta}`;
}

// `fetch` con plazo. Se usa AbortController y no `AbortSignal.timeout`, que es
// reciente y aqui se juega tambien desde un iPhone que puede ser viejo.
async function pedir(direccion, opciones = {}) {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), NUBE.esperaMs);
  try {
    return await fetch(direccion, { ...opciones, signal: corte.signal });
  } finally {
    clearTimeout(reloj);
  }
}

// Lo que se guarda de verdad en la nube. El identificador de la partida NO va
// dentro: es la clave de la fila, y repetirlo dentro solo seria una forma mas
// de que los dos no coincidieran.
function paraLaNube(fila) {
  return {
    nombre: String(fila.nombre || '').slice(0, 10),
    puntos: Math.max(0, Math.round(fila.puntos || 0)),
    personaje: String(fila.personaje || '').slice(0, 20),
    nivel: Math.max(1, Math.round(fila.nivel || 1)),
    fecha: Math.round(fila.fecha || Date.now()),
  };
}

function esFilaValida(f) {
  return f && typeof f.nombre === 'string' && Number.isFinite(f.puntos);
}

// --- la cola de lo que no subio -------------------------------------------

function leerCola() {
  try {
    const crudo = window.localStorage.getItem(COLA);
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista.filter((f) => f && f.partida) : [];
  } catch {
    return [];
  }
}

function escribirCola(lista) {
  try {
    window.localStorage.setItem(COLA, JSON.stringify(lista.slice(-CABEN_EN_COLA)));
  } catch {
    // sin sitio donde guardar: se reintenta en esta sesion y ya
  }
}

function encolar(fila) {
  const cola = leerCola().filter((f) => f.partida !== fila.partida);
  cola.push(fila);
  escribirCola(cola);
}

// Saca de la cola lo que haya de esa partida. Se llama cuando una subida SI
// sale: si no, la fila vieja (con menos puntos) se quedaria ahi para siempre,
// porque la base no deja bajar un puntaje y la rechazaria una y otra vez.
function desencolar(partida) {
  const cola = leerCola();
  const quedan = cola.filter((f) => f.partida !== partida);
  if (quedan.length !== cola.length) escribirCola(quedan);
}

export function vaciarCola() {
  escribirCola([]);
}

// --- subir ----------------------------------------------------------------

// Manda una fila. No devuelve si/no, sino TRES respuestas, que es lo que hace
// falta para saber que hacer con ella despues:
//
//  - 'subida'    : ya esta arriba.
//  - 'fallo'     : no se pudo llegar (sin internet, plazo agotado, la base
//                  caida). Eso SI se reintenta: es culpa del camino.
//  - 'rechazada' : se llego y la base dijo que no (el reglamento, la forma de
//                  la fila, un puntaje mas bajo del que ya hay). Reintentarla
//                  es quedarsela para siempre y taponar la cola con ella.
async function mandar(fila) {
  try {
    const respuesta = await pedir(direccionDe(`/${encodeURIComponent(fila.partida)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paraLaNube(fila)),
    });
    if (respuesta.ok) return 'subida';
    return respuesta.status >= 400 && respuesta.status < 500 ? 'rechazada' : 'fallo';
  } catch {
    return 'fallo';
  }
}

// Sube una partida. Devuelve si lo consiguio, y nunca falla.
//
// Si no se pudo llegar, la fila se queda en la cola y se reintenta en la
// siguiente sincronizacion.
export async function subirPuntaje(fila) {
  if (!hayNube() || !fila || !fila.partida) return false;

  const como = await mandar(fila);
  if (como === 'fallo') encolar(fila);
  // Si subio, fuera lo que hubiera encolado de esta misma partida: eso era una
  // version vieja con menos puntos, y la base ya no la aceptaria.
  else desencolar(fila.partida);

  return como === 'subida';
}

// Reintenta lo que quedo pendiente. Se llama al sincronizar.
export async function reintentarPendientes() {
  if (!hayNube()) return 0;

  const cola = leerCola();
  if (!cola.length) return 0;

  const siguenEsperando = [];
  let subidas = 0;
  for (const fila of cola) {
    // Una a una a proposito: son cuatro como mucho, y si no hay internet la
    // primera ya se lleva el plazo entero. En paralelo serian cuatro plazos
    // a la vez y cuatro esperas de seis segundos para nada.
    // eslint-disable-next-line no-await-in-loop
    const como = await mandar(fila);
    if (como === 'subida') subidas += 1;
    // Las rechazadas se tiran: no van a colar nunca.
    else if (como === 'fallo') siguenEsperando.push(fila);
  }
  escribirCola(siguenEsperando);
  return subidas;
}

// --- bajar ----------------------------------------------------------------

// Las mejores de la nube. Se le pide a Firebase que ordene y recorte el, que
// para eso esta: `orderBy` + `limitToLast` con el indice puesto en el
// reglamento. Asi da igual que la base acabe con mil partidas dentro.
export async function bajarTablero(cuantos = 10) {
  if (!hayNube()) return [];

  const consulta = `?orderBy=${encodeURIComponent('"puntos"')}&limitToLast=${cuantos}`;
  try {
    const respuesta = await pedir(direccionDe('', consulta));
    if (!respuesta.ok) return [];

    const crudo = await respuesta.json();
    if (!crudo || typeof crudo !== 'object') return [];

    // Viene como un objeto con la partida de clave; aqui se quiere una lista, y
    // la clave vuelve a su sitio dentro de cada fila.
    return Object.entries(crudo)
      .map(([partida, fila]) => ({ ...fila, partida }))
      .filter(esFilaValida);
  } catch {
    return [];
  }
}

export default bajarTablero;
