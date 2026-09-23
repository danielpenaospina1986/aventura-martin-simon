// ---------------------------------------------------------------------------
// LA SESION
//
// Quien esta jugando. El nombre se escribe al entrar y hace de identificador:
// es lo que se apunta luego en el tablero de mejores puntajes.
//
// Se guarda en el navegador para no tener que escribirlo cada vez. Si el
// navegador no deja guardar (ventana de incognito, permisos), el juego sigue
// funcionando igual: simplemente lo olvida al cerrar.
// ---------------------------------------------------------------------------

const CLAVE = 'aventura-jugador';

export const LARGO_MAXIMO = 10;

// Solo letras, numeros y espacios. Nada de simbolos raros, que esto lo escriben
// dos ninos y luego se pinta en pantalla con una tipografia que no los tiene.
export function limpiarNombre(texto) {
  return String(texto || '')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, LARGO_MAXIMO);
}

let enMemoria = '';

export function nombreDeSesion() {
  if (enMemoria) return enMemoria;
  try {
    enMemoria = limpiarNombre(window.localStorage.getItem(CLAVE) || '');
  } catch {
    enMemoria = '';
  }
  return enMemoria;
}

export function guardarNombre(nombre) {
  enMemoria = limpiarNombre(nombre);
  try {
    window.localStorage.setItem(CLAVE, enMemoria);
  } catch {
    // sin sitio donde guardar: se queda solo en memoria
  }
  return enMemoria;
}

export default nombreDeSesion;
