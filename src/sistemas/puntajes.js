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

// Apunta una partida y devuelve el tablero ya ordenado y recortado.
export function anotarPuntaje(nombre, puntos, extra = {}) {
  const limpio = String(nombre || '').trim() || 'Sin nombre';
  const fila = {
    nombre: limpio,
    puntos: Math.max(0, Math.round(puntos || 0)),
    personaje: extra.personaje || '',
    nivel: extra.nivel || 1,
    fecha: Date.now(),
  };

  const lista = [...leer(), fila];
  // De mayor a menor; a igualdad de puntos, primero la mas reciente.
  lista.sort((a, b) => (b.puntos - a.puntos) || (b.fecha - a.fecha));

  // Del puesto once en adelante se tira: es la regla de la casa.
  escribir(lista.slice(0, CUANTOS_CABEN));
  return mejoresPuntajes();
}

export function borrarPuntajes() {
  escribir([]);
}

export default mejoresPuntajes;
