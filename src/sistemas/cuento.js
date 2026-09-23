// ---------------------------------------------------------------------------
// EL CUENTO, HILADO CON EL JUEGO
//
// Aqui se decide CUANDO se cuenta algo. Los textos estan en config/historia.js
// y quien los pinta es EscenaRelato; esto solo los encadena con el tablero que
// toca, para que ninguna escena tenga que saberse el cuento entero.
// ---------------------------------------------------------------------------

import { INTRO, FINAL, ciudadDelCuento } from '../config/historia.js';
import { nivelPorIndice } from '../niveles/index.js';

// A jugar un tablero, pasando antes por su tarjeta de ciudad.
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

// Partida nueva: la hora del bano, la fuga, y a la primera ciudad.
export function empezarPartida(escena, datos = {}) {
  const alEmpezar = { ...datos, indiceNivel: 0 };
  const nivel = nivelPorIndice(0);
  const ciudad = ciudadDelCuento(nivel.fondo || '');

  escena.scene.start('relato', {
    vinetas: INTRO,
    // Esc se salta la intro Y la tarjeta de la ciudad: a jugar directo.
    saltarA: { escena: 'nivel', datos: alEmpezar },
    siguiente: 'relato',
    // encadenada: al acabar la intro sale la tarjeta de la primera ciudad
    datosSiguiente: {
      titulo: ciudad ? ciudad.titulo : '',
      vinetas: ciudad ? [ciudad.frase] : [''],
      siguiente: 'nivel',
      datosSiguiente: alEmpezar,
      saltarA: { escena: 'nivel', datos: alEmpezar },
    },
  });
}

// Se acabo la ultima ciudad: el final, y luego el marcador de siempre.
export function terminarPartida(escena, datosVictoria = {}) {
  escena.scene.start('relato', {
    vinetas: FINAL,
    siguiente: 'victoria',
    datosSiguiente: datosVictoria,
    saltarA: { escena: 'victoria', datos: datosVictoria },
  });
}

export default { empezarNivel, empezarPartida, terminarPartida };
