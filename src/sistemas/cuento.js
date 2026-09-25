// ---------------------------------------------------------------------------
// LAS RESENAS DE CIUDAD
//
// Aqui se decide CUANDO se cuenta algo. Los textos estan en config/historia.js
// y quien los pinta es EscenaRelato; esto solo los encadena con el tablero que
// toca, para que ninguna escena tenga que saberse el cuento entero.
//
// Ya no hay hilo de historia: ni vinetas de apertura ni despedida. Lo unico que
// se cuenta es una resena de cada ciudad, justo antes de su tablero, que es lo
// que mas adelante llevara su ilustracion de entrada.
// ---------------------------------------------------------------------------

import { ciudadDelCuento } from '../config/historia.js';
import { nivelPorIndice } from '../niveles/index.js';

// A jugar un tablero, pasando antes por la resena de su ciudad.
export function empezarNivel(escena, datos = {}) {
  const indice = datos.indiceNivel || 0;
  const nivel = nivelPorIndice(indice);
  const ciudad = ciudadDelCuento(nivel.fondo || '');

  if (!ciudad) {
    escena.scene.start('nivel', datos);
    return;
  }

  escena.scene.start('relato', {
    titulo: ciudad.titulo,
    vinetas: [ciudad.frase],
    siguiente: 'nivel',
    datosSiguiente: datos,
    saltarA: { escena: 'nivel', datos },
  });
}

// Partida nueva: derecho a la primera ciudad, con su resena.
export function empezarPartida(escena, datos = {}) {
  empezarNivel(escena, { ...datos, indiceNivel: 0 });
}

// Se acabo la ultima ciudad: al marcador de siempre. Ya no hay vineta de
// despedida, asi que esto es un paso directo.
export function terminarPartida(escena, datosVictoria = {}) {
  escena.scene.start('victoria', datosVictoria);
}

export default { empezarNivel, empezarPartida, terminarPartida };
