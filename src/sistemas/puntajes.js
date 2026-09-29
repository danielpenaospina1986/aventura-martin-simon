// ---------------------------------------------------------------------------
// EL TABLERO DE MEJORES PUNTAJES
//
// Solo se guardan los DIEZ mejores. En cuanto entra uno nuevo, el que queda en
// el puesto once se borra: asi no se va llenando el navegador de partidas
// viejas que ya no le interesan a nadie.
//
// Hay DOS tableros, y este archivo los hace parecer uno:
//
//  - EL DE CASA (localStorage), que es el que se pinta. Es instantaneo y
//    funciona sin internet, asi que el juego nunca espera a nadie.
//  - EL DE LA NUBE (`tablero-remoto.js`), que es el de verdad: el mismo desde
//    el telefono, desde el portatil y desde donde sea. Sin el, el telefono de
//    Martain y el portatil de Samaon tenian cada uno su tablero y no habia
//    forma de compararlos, que es justo lo que hace falta para el premio de
//    diciembre.
//
// Se apunta SIEMPRE en los dos. Lo de casa, al momento; lo de la nube, por
// detras y sin que nadie lo espere. Cuando la nube contesta, `sincronizar()`
// funde lo que trae con lo de casa y avisa a quien este pintando el tablero
// para que lo repinte.
//
// Si no hay nube configurada (ver `config/nube.js`), todo esto se queda quieto
// y el juego funciona como funcionaba: con el tablero de cada equipo.
// ---------------------------------------------------------------------------

import { hayNube } from '../config/nube.js';
import {
  bajarTablero,
  reintentarPendientes,
  subirPuntaje,
  vaciarCola,
} from './tablero-remoto.js';

const CLAVE = 'aventura-mejores';

export const CUANTOS_CABEN = 10;

let enMemoria = null;

function leer() {
  if (enMemoria) return enMemoria;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const lista = crudo ? JSON.parse(crudo) : [];
    enMemoria = Array.isArray(lista) ? lista.filter(esFilaValida) : [];
  } catch {
    enMemoria = [];
  }
  return enMemoria;
}

function esFilaValida(f) {
  return f && typeof f.nombre === 'string' && Number.isFinite(f.puntos);
}

function escribir(lista) {
  enMemoria = lista;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // sin sitio donde guardar: se queda solo en memoria
  }
}

// De mayor a menor; a igualdad de puntos, primero la mas reciente.
function porPuntos(a, b) {
  return (b.puntos - a.puntos) || (b.fecha - a.fecha);
}

// Los diez mejores, de mas a menos.
export function mejoresPuntajes() {
  return leer().slice(0, CUANTOS_CABEN);
}

// Un identificador para la partida que empieza. Sirve para que una misma
// partida ocupe UNA sola fila del tablero por mucho que se apunte varias veces.
export function nuevaPartida() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Apunta una partida y devuelve el tablero ya ordenado y recortado.
//
// Se llama VARIAS VECES a lo largo de una misma partida: al terminar cada
// mundo, al quedarse sin vidas y al salirse al menu. Esa es la gracia: antes
// solo se apuntaba al final del todo, y quien cerraba la pestana a medias no
// dejaba rastro ninguno.
//
// Para que una partida no llene el tablero con sus cinco pasos intermedios, se
// apunta CON SU IDENTIFICADOR (`extra.partida`) y, si ya hay una fila suya, se
// actualiza en vez de anadir otra. Se queda con el puntaje mas alto de los dos,
// que si alguien vuelve a un mundo facil y hace menos, lo suyo sigue siendo lo
// mejor que hizo.
//
// Devuelve el tablero AL INSTANTE, con lo de casa. Lo de la nube va por detras.
export function anotarPuntaje(nombre, puntos, extra = {}) {
  const limpio = String(nombre || '').trim() || 'Sin nombre';
  const cuantos = Math.max(0, Math.round(puntos || 0));
  const fila = {
    nombre: limpio,
    puntos: cuantos,
    personaje: extra.personaje || '',
    nivel: extra.nivel || 1,
    partida: extra.partida || '',
    fecha: Date.now(),
  };

  const lista = [...leer()];
  const misma = fila.partida ? lista.findIndex((f) => f.partida === fila.partida) : -1;

  // Como queda la fila de esta partida. Se calcula ANTES de ordenar: despues
  // del `sort` los indices ya no valen, que es de donde salio un buen susto.
  let definitiva = fila;
  if (misma >= 0) {
    // ya estaba: se queda con lo mejor de la partida, no con lo ultimo
    definitiva = { ...lista[misma], ...fila, puntos: Math.max(lista[misma].puntos, cuantos) };
    lista[misma] = definitiva;
  } else {
    lista.push(fila);
  }

  lista.sort(porPuntos);

  // Del puesto once en adelante se tira: es la regla de la casa.
  escribir(lista.slice(0, CUANTOS_CABEN));

  // Y a la nube, sin esperarla. Las de cero puntos no se suben: son las de
  // quien entro y se salio sin jugar, y no hay nada que rastrear ahi.
  if (definitiva.partida && definitiva.puntos > 0) {
    subirPuntaje(definitiva).catch(() => {});
  }

  return mejoresPuntajes();
}

// En que puesto quedo una partida, para poder decirselo al nino. 0 si no entro.
export function puestoDe(partida) {
  if (!partida) return 0;
  const donde = mejoresPuntajes().findIndex((f) => f.partida === partida);
  return donde < 0 ? 0 : donde + 1;
}

// Borra el tablero de casa (y lo que quedara sin subir). La nube NO se toca: es
// de todos y no la borra un equipo suelto.
export function borrarPuntajes() {
  escribir([]);
  vaciarCola();
}

// --- la nube ---------------------------------------------------------------

const oyentes = new Set();
let enMarcha = null;

// Avisa a quien este pintando el tablero de que ha cambiado, para que repinte.
// Devuelve la funcion de darse de baja, que es lo que las escenas guardan para
// soltarla al apagarse.
export function alCambiarTablero(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

function avisar() {
  oyentes.forEach((fn) => {
    try {
      fn(mejoresPuntajes());
    } catch {
      // que un tablero mal pintado no se lleve por delante a los demas
    }
  });
}

// Funde varias listas en una. Una misma partida (por su identificador) es UNA
// fila, con el mejor puntaje que se le conozca, venga de donde venga.
//
// Es lo que hace que el tablero de casa y el de la nube se vean como uno solo,
// y por eso esta suelta y se exporta: es pura cuenta, sin navegador ni red de
// por medio, asi que se puede probar tal cual.
export function fundirTableros(...listas) {
  const porPartida = new Map();
  const sueltas = [];

  listas.flat().filter(esFilaValida).forEach((fila) => {
    if (!fila.partida) {
      sueltas.push(fila);
      return;
    }
    const ya = porPartida.get(fila.partida);
    if (!ya || fila.puntos > ya.puntos) porPartida.set(fila.partida, fila);
  });

  return [...porPartida.values(), ...sueltas].sort(porPuntos).slice(0, CUANTOS_CABEN);
}

// Se trae el tablero de la nube, lo funde con el de casa y avisa a quien lo
// este pintando. Nunca falla y nunca hace esperar a nadie: si no hay nube o no
// contesta, se queda todo como estaba.
//
// Si ya hay una sincronizacion en marcha se devuelve esa misma, para que tres
// pantallas pidiendola a la vez no sean tres viajes.
export function sincronizarTablero() {
  if (!hayNube()) return Promise.resolve(mejoresPuntajes());
  if (enMarcha) return enMarcha;

  enMarcha = (async () => {
    // Primero lo que quedo sin subir de otras veces: asi el tablero que se baja
    // ya lo lleva dentro.
    await reintentarPendientes();

    const deLaNube = await bajarTablero(CUANTOS_CABEN);
    if (deLaNube.length) {
      const antes = JSON.stringify(leer());
      const fundido = fundirTableros(leer(), deLaNube);
      escribir(fundido);
      if (JSON.stringify(fundido) !== antes) avisar();
    }
    return mejoresPuntajes();
  })()
    .catch(() => mejoresPuntajes())
    .finally(() => {
      enMarcha = null;
    });

  return enMarcha;
}

export default mejoresPuntajes;
