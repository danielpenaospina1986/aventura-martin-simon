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

export const CONSTRUCCION = {
  maximo: 3,        // bloques simultaneos; el cuarto borra el mas viejo
  recargaMs: 200,
  aparecerMs: 120,
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
