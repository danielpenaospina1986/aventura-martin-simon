// ---------------------------------------------------------------------------
// AJUSTES DEL JUEGO
// Todos los numeros que definen como se siente el juego viven en este archivo.
// Si algo se siente raro al jugar, se toca aqui y en ningun otro sitio.
// ---------------------------------------------------------------------------

export const MUNDO = {
  ancho: 960,      // resolucion interna
  alto: 540,
  casilla: 32,     // grilla de 32x32
};

export const FISICA = {
  gravedad: 1900,             // px/s2 durante la subida
  multiplicadorCaida: 1.55,   // la caida es mas rapida que la subida
  velocidadCaidaMaxima: 1000,
};

export const JUGADOR = {
  // movimiento horizontal (identico para los dos personajes)
  velocidad: 210,
  aceleracionSuelo: 2400,
  aceleracionAire: 1700,
  frenadoSuelo: 2800,
  frenadoAire: 900,

  // salto
  impulsoSalto: 660,     // altura maxima = 660^2 / (2*1900) = 114.6 px = 3.58 casillas
  recorteSalto: 0.42,    // al soltar el boton, la subida se recorta (salto variable)
  coyoteMs: 100,         // margen para saltar despues de salir de una plataforma
  bufferSaltoMs: 100,    // margen para pulsar salto antes de aterrizar
  reboteEnemigo: 430,    // impulso al pisar a un enemigo

  // reglas amables
  invulnerabilidadMs: 1200,
  parpadeoMs: 90,
  congelarAlHerirMs: 240,
};

export const KATANA = {
  alcance: 38,      // hacia adelante desde el centro del jugador
  alto: 34,
  duracionMs: 170,  // cuanto se ve el arco blanco
  recargaMs: 280,
  desfaseY: -2,
};

// Simon lanza bloques hacia adelante. Antes los construia para subir; ahora es
// un golpe, como la katana de Martin, para que los dos puedan pelear con el jefe.
export const LANZAMIENTO = {
  velocidad: 480,      // a que velocidad sale el bloque
  // Sale casi recto y va cayendo. Con mas impulso hacia arriba describia un
  // arco alto y pasaba por encima de los enemigos, que son bajitos.
  elevacion: -30,
  gravedad: 700,       // cae mas despacio que el jugador
  maximo: 3,           // bloques a la vez en el aire
  recargaMs: 300,
  duracionMs: 2200,    // si no da a nada, se deshace
  giro: 260,           // grados por segundo, para que de vueltas
  aparecerMs: 110,
};

// Como se puntua. La idea: las monedas suman, los golpes restan, y el marcador
// final es lo que ganaste menos lo que te costo llegar.
export const PUNTOS = {
  porMoneda: 1,
  porGolpe: -3,   // te toca un enemigo o te caes a un hueco
  porEnemigo: 2,  // vencer a un bicho pequeno
  porJefe: 10,
  minimo: 0,      // el marcador nunca baja de aqui
};

export const JEFE = {
  vidas: 3,
  velocidad: 46,
  invulnerableMs: 900,
  parpadeoMs: 110,
  reboteJugador: 470,   // impulso del jugador al saltarle encima
  empujonAlHerir: 90,   // cuanto retrocede el jefe al recibir un golpe
  ancho: 72,
  alto: 72,
};

export const ENEMIGO = {
  velocidad: 58,
  sondaBorde: 6,    // cuanto mira por delante para detectar el borde
};

export const CAMARA = {
  suavizado: 0.12,
  zonaMuertaAncho: 160,
  zonaMuertaAlto: 120,
  desfaseY: -20,
};

// Valores derivados, usados para comprobar que los niveles son jugables.
export const ALCANCE = {
  get alturaSaltoPx() {
    return (JUGADOR.impulsoSalto * JUGADOR.impulsoSalto) / (2 * FISICA.gravedad);
  },
  get alturaSaltoCasillas() {
    return this.alturaSaltoPx / MUNDO.casilla;
  },
  get tiempoVueloS() {
    const subida = JUGADOR.impulsoSalto / FISICA.gravedad;
    const bajada = Math.sqrt(
      (2 * this.alturaSaltoPx) / (FISICA.gravedad * FISICA.multiplicadorCaida),
    );
    return subida + bajada;
  },
  get distanciaSaltoPx() {
    return JUGADOR.velocidad * this.tiempoVueloS;
  },
  get distanciaSaltoCasillas() {
    return this.distanciaSaltoPx / MUNDO.casilla;
  },
};
