// ---------------------------------------------------------------------------
// LA NUBE
//
// El tablero de mejores puntajes vivia solo en el navegador de cada equipo, y
// asi no habia forma de compararlos: el telefono de Martain y el portatil de
// Samaon tenian cada uno el suyo, y ninguno de los dos era EL tablero. Como de
// ese tablero depende el premio de diciembre, hace falta uno solo, el mismo,
// visible desde cualquier aparato.
//
// Se guarda en una base de datos en tiempo real de Firebase, y se le habla por
// REST, con `fetch` pelado. Nada de SDK: son dos llamadas contadas (subir una
// fila y bajar las diez mejores) y el juego ya pesa lo suyo con Phaser dentro.
//
// PARA ENCENDERLO solo hay que pegar la direccion aqui abajo, en `url`. Es la
// que Firebase ensena en la consola, y acaba en `.firebasedatabase.app` o en
// `.firebaseio.com`. Los pasos completos, con el reglamento que hay que pegar
// en Firebase, estan en NUBE.md.
//
// SIN direccion el juego funciona exactamente igual que hasta ahora, con el
// tablero de cada equipo. Nada se rompe, no sale ningun error: simplemente no
// hay nube.
// ---------------------------------------------------------------------------

// La direccion de la base de datos. Vacia = sin nube.
//
// Va A LA VISTA en el juego publicado, y no pasa nada: no es una contrasena, es
// la puerta. Quien manda es el reglamento de la base de datos, que solo deja
// leer y escribir puntajes, y solo con la forma que toca (ver NUBE.md).
const DIRECCION = 'https://aventura-martin-simon-default-rtdb.firebaseio.com';

// La que manda de verdad, si alguien la ha cambiado a mano (ver mas abajo).
let aMano = null;

function laDeSiempre() {
  // Se puede apuntar a otra base desde fuera, sin tocar el codigo, con
  // VITE_TABLERO_URL en un archivo .env. Si no hay nada, manda la de arriba.
  return (import.meta.env && import.meta.env.VITE_TABLERO_URL) || DIRECCION;
}

export const NUBE = {
  url: laDeSiempre(),

  // De que rama de la base cuelgan los puntajes.
  rama: 'puntajes',

  // Cuanto se espera a la nube antes de darla por perdida. Es corto a
  // proposito: el juego NO espera a nadie, el tablero de casa se pinta al
  // instante y lo de la nube llega cuando llegue.
  esperaMs: 6000,
};

// Apunta el juego a otra base, o a ninguna (con '' o sin argumento). Con esto
// puesto, ?nube=0 deja de mandar: lo que se pide a mano, manda.
//
// Lo usan las pruebas, que necesitan una nube de mentira para comprobar que lo
// que no sube se guarda y se reintenta; y sirve tambien para probar contra una
// base de repuesto sin tocar el archivo.
export function apuntarLaNubeA(url) {
  aMano = url === undefined ? null : String(url || '');
  NUBE.url = aMano === null ? laDeSiempre() : aMano;
}

// Si hay nube a la que hablarle.
//
// Se puede apagar desde la barra de direcciones con ?nube=0, que es lo que
// hacen las pruebas automaticas: ahi el tablero tiene que ser el del navegador
// y nada mas, o cada prueba veria los puntajes de verdad de los ninos, y peor
// aun, cada pasada les dejaria partidas inventadas dentro.
export function hayNube() {
  if (!NUBE.url) return false;
  if (aMano !== null) return Boolean(aMano);
  if (typeof window === 'undefined') return false;
  const pedido = new URLSearchParams(window.location.search).get('nube');
  return pedido !== '0';
}

export default NUBE;
