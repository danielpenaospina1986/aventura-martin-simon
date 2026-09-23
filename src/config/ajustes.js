// ---------------------------------------------------------------------------
// AJUSTES DEL JUEGO
// Todos los numeros que definen como se siente el juego viven en este archivo.
// Si algo se siente raro al jugar, se toca aqui y en ningun otro sitio.
// ---------------------------------------------------------------------------

export const MUNDO = {
  // Resolucion interna. Es pequena a proposito: al escalarse a la ventana, todo
  // se ve al doble de tamano que antes, que es lo que pide un dibujo animado.
  // La casilla y la fisica no cambian: solo se ve menos mundo, mas grande.
  ancho: 640,
  alto: 360,
  casilla: 32,     // grilla de 32x32

  // El tablero tiene tres alturas por las que moverse, y una franja arriba que
  // se deja libre para los bichos voladores que vendran.
  filas: 11,
  nivelSuelo: 9,    // fila donde esta el suelo
  nivelMedio: 6,    // se llega saltando desde el suelo
  nivelAlto: 3,     // se llega saltando desde el medio
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
  alcance: 52,      // hacia adelante desde el centro del jugador
  // La zona de golpe cubre del pecho a los pies, para que alcance igual a un
  // bicho que a un jefe, que son de alturas muy distintas.
  alto: 64,
  desfaseY: 10,
  duracionMs: 170,  // cuanto se ve el arco blanco
  recargaMs: 280,
};

// Simon lanza bloques hacia adelante. Antes los construia para subir; ahora es
// un golpe, como la katana de Martin, para que los dos puedan pelear con el jefe.
export const LANZAMIENTO = {
  velocidad: 480,      // a que velocidad sale el bloque
  // Sale a la altura de la cadera, no del pecho: desde mas arriba pasaba por
  // encima de los enemigos.
  salidaY: 10,
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
  // El jefe mide el doble que un nino. No se le puede saltar encima desde el
  // suelo: hay que subir a la plataforma de su arena y dejarse caer.
  ancho: 172,
  alto: 172,
  caja: { ancho: 148, alto: 158 },
};

export const ENEMIGO = {
  velocidad: 58,
  sondaBorde: 8,    // cuanto mira por delante para detectar el borde
  // Los bichos son del tamano de los ninos: si son mucho mas bajos, cuesta
  // darles y no dan ningun respeto.
  ancho: 76,
  alto: 86,
  caja: { ancho: 52, alto: 74 },
};

export const CAMARA = {
  suavizado: 0.12,
  zonaMuertaAncho: 110,
  zonaMuertaAlto: 90,
  desfaseY: -10,
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
