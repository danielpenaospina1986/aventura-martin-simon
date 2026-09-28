// ---------------------------------------------------------------------------
// EL TABLERO DE MEJORES PUNTAJES
//
// Solo se guardan los DIEZ mejores. En cuanto entra uno nuevo, el que queda en
// el puesto once se borra: asi no se va llenando el navegador de partidas
// viejas que ya no le interesan a nadie.
//
// Vive en el navegador de cada equipo (localStorage), asi que cada casa tiene
// su propio tablero. Si el navegador no deja guardar, el juego sigue: se ve el
// tablero de la partida en curso y se olvida al cerrar.
// ---------------------------------------------------------------------------

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

  if (misma >= 0) {
    // ya estaba: se queda con lo mejor de la partida, no con lo ultimo
    lista[misma] = { ...lista[misma], ...fila, puntos: Math.max(lista[misma].puntos, cuantos) };
  } else {
    lista.push(fila);
  }

  // De mayor a menor; a igualdad de puntos, primero la mas reciente.
  lista.sort((a, b) => (b.puntos - a.puntos) || (b.fecha - a.fecha));

  // Del puesto once en adelante se tira: es la regla de la casa.
  escribir(lista.slice(0, CUANTOS_CABEN));
  return mejoresPuntajes();
}

// En que puesto quedo una partida, para poder decirselo al nino. 0 si no entro.
export function puestoDe(partida) {
  if (!partida) return 0;
  const donde = mejoresPuntajes().findIndex((f) => f.partida === partida);
  return donde < 0 ? 0 : donde + 1;
}

export function borrarPuntajes() {
  escribir([]);
}

export default mejoresPuntajes;
