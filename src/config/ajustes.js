// ---------------------------------------------------------------------------
// AJUSTES DEL JUEGO
// Todos los numeros que definen como se siente el juego viven en este archivo.
// Si algo se siente raro al jugar, se toca aqui y en ningun otro sitio.
// ---------------------------------------------------------------------------

// Cuantos pixeles de verdad se dibujan por cada punto del juego.
//
// El juego piensa en una pantalla de 640 x 360 y esas medidas no se tocan: la
// casilla sigue midiendo 32, el salto sigue subiendo 114 px y los mapas siguen
// valiendo. Lo que cambia es que el lienzo tiene el DOBLE (o el triple) de
// pixeles y la camara va con ese mismo zoom, asi que cada dibujo se pinta con
// mas puntos y deja de verse dentado.
//
// Antes el lienzo tenia 640 x 360 pixeles y el navegador lo estiraba a lo que
// midiera la ventana: de ahi venia el dentado de los personajes.
const PANTALLA = { ancho: 640, alto: 360 };

// Se ajusta sola a la pantalla: la que haga falta para que cada punto del juego
// caiga en un pixel de verdad, y ni uno mas. En una ventana de 1280 x 720 sale
// 2; a pantalla completa en un monitor de 1920 x 1080, 3. Mas de 3 no aporta
// nada visible y cuesta el cuadrado.
//
// Se puede forzar desde la barra de direcciones (?densidad=1), que es lo que
// hacen las pruebas automaticas: alli el navegador dibuja por software, sin
// tarjeta grafica, y cuadruplicar los pixeles las dejaba a 20 fotogramas.
function densidadQueTocaria() {
  // Las herramientas (validar-niveles, generar-niveles) importan este archivo
  // desde Node, donde no hay ventana ninguna. Alli la densidad da igual.
  if (typeof window === 'undefined') return 1;

  const forzada = Number(new URLSearchParams(window.location.search).get('densidad'));
  if (forzada >= 1 && forzada <= 4) return Math.round(forzada);

  const cabe = Math.min(
    window.innerWidth / PANTALLA.ancho,
    window.innerHeight / PANTALLA.alto,
  );
  return Math.max(1, Math.min(3, Math.ceil(cabe - 0.02)));
}

export const RENDER = {
  densidad: densidadQueTocaria(),
};

export const MUNDO = {
  // Resolucion interna. Es pequena a proposito: al escalarse a la ventana, todo
  // se ve al doble de tamano que antes, que es lo que pide un dibujo animado.
  // La casilla y la fisica no cambian: solo se ve menos mundo, mas grande.
  ancho: 640,
  alto: 360,
  casilla: 32,     // grilla de 32x32

  // El tablero tiene tres alturas por las que moverse, y una franja arriba que
  // se deja libre para los bichos voladores que vendran.
  // 12 filas = 384 px, algo mas que la pantalla. Con 11 el terreno acababa en
  // 352 y quedaba una franja negra de 8 px abajo del todo.
  filas: 12,
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
  tamano: 34,          // lo que mide el bloque en pantalla
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

// Corazones y vidas.
//
// El nino no muere de un golpe: cada golpe le quita un corazon, y empieza cada
// tablero con cinco. Cuando se le acaban los corazones pierde una vida y vuelve
// al ultimo checkpoint con los corazones repuestos. Las vidas, en cambio, se
// arrastran de un tablero a otro: son tres para toda la partida, y al perder la
// ultima se acabo.
export const VIDA = {
  corazonesPorNivel: 5,
  vidasIniciales: 3,
  // de cada cuantos bichos sale un corazon, y de cada cuantas palomas una vida
  probabilidadCorazon: 0.3,
  probabilidadVidaExtra: 0.25,
  // lo que mide cada cosa en pantalla
  corazon: { ancho: 26, alto: 24, enHud: 15 },
  vidaExtra: { ancho: 30, alto: 28, enHud: 16 },
  // el premio suelto espera un poco antes de desaparecer
  duracionMs: 9000,
  parpadeoDesdeMs: 6000,
};

// El premio que se recoge: un rollo de sushi, igual para los dos ninos.
export const PREMIO = {
  ancho: 28,
  alto: 28,
  enHud: 22,
};

// La banderita del checkpoint. Mientras no se toca va translucida; al tocarla
// se enciende del todo, que es como se sabe que quedo guardado.
export const CHECKPOINT = {
  ancho: 92,
  alto: 104,
  alphaApagado: 0.45,
};

// La puerta por la que se sale del tablero, una vez derrotado el jefe.
export const META = {
  ancho: 104,
  alto: 152,
};

// La arena de Dona Zully: sus sombrillas y su chorro.
export const SOMBRILLA = {
  // Mas estrechas de lo que parecen en el dibujo: si taparan toda la arena, el
  // chorro no llegaria nunca al nino y la pelea se ganaria sola. Tiene que
  // haber huecos por donde pasa.
  ancho: 64,
  alto: 124,
  cuantas: 3,            // las que se plantan si hay sitio
  minimo: 2,             // menos de dos y no hay donde esconderse
  separacionMinima: 104, // para que quede hueco por donde pase el chorro
  margen: 64,            // lo mas cerca que se planta una del jefe
  // Hasta donde se reparten, contando desde el jefe. Va a juego con
  // JEFE.alcanceArena: las sombrillas ocupan justo el trozo de arena en el que
  // ella se pone a disparar, que es donde hace falta tener donde esconderse.
  // Con la arena de una pantalla entera, 520 las sacaba del cuadro por la
  // izquierda y el escondite quedaba fuera de la pelea.
  arenaMaxima: 380,
};

export const CHORRO = {
  ancho: 92,
  alto: 72,
  caja: { ancho: 62, alto: 38 },
  salidaY: 6,
  velocidad: 230,
  velocidadRebote: 300,
  duracionMs: 3200,
};

// LA VACA BERRIONDA. El bicho intermedio: ni se pasea como una banera ni
// guarda una arena como un jefe. Entra corriendo por un lado del cuadro, cruza
// el tablero y, cuando tiene al nino delante, baja la cabeza y EMBISTE.
//
// Viene de una de verdad: a Martin lo persiguio una vaca en la finca de los
// abuelos y casi se lo lleva por delante. Por eso, cuando entra, sale el cartel
// de "¡CUIDADO CON LA BERRIONDA VACA!".
//
// Se le gana como a los demas: pisandola, con la katana o con un bloque. Lo que
// no se puede es pararla de frente.
export const VACA = {
  // El dibujo es apaisado: 160 x 104 es el lienzo entero, y la vaca ocupa unos
  // 86 px de alto, la altura de un nino.
  ancho: 160,
  alto: 104,
  // Bien por dentro del dibujo, como la banera: los cuernos y la cola asoman
  // fuera de la caja, que es lo que hace que un roce no castigue.
  caja: { ancho: 104, alto: 66 },
  velocidad: 115,
  velocidadEmbestida: 245,
  distanciaEmbestida: 240, // a que distancia baja la cabeza
  avisoMs: 520,            // lo que tarda en arrancar desde que la baja
  impulsoSalto: 440,       // para saltarse los huecos del suelo
  msPorPaso: 150,          // el trote
  msPorTranco: 100,        // el galope de la embestida, mas vivo
  // cada cuanto aparece una. Como las palomas, mas a menudo segun avanza.
  esperaMinMs: 9000,
  esperaMaxMs: 16000,
  recortePorNivel: 0.12,
  esperaMinima: 4500,
  // cuando le saltan encima: se queda tumbada, titila y desaparece
  titileoMs: 130,
  titileos: 7,
  cartelMs: 2400,          // lo que se queda el cartel de aviso en pantalla
};

// El canastilla del balcon, en la arena del Abuelo. Cuelga a la altura justa:
// por encima de la cabeza del nino de pie, pero al alcance de un salto, para que
// valgan las tres formas de darle (la katana, un bloque o un cabezazo).
export const CANASTILLA = {
  // Apaisada, como una canastilla de mercado de verdad: mas ancha que alta. El
  // matero de antes era al reves.
  ancho: 68,
  alto: 60,
  caja: { ancho: 56, alto: 48 },
  altura: 118,           // lo que cuelga por encima del suelo, a su centro
  separacionMinima: 128, // para que quepan varios sin taparse
  cuantos: 5,
  minimo: 3,
  margen: 40,            // lo mas cerca del borde de la arena que se planta uno
  recambioMs: 3600,      // lo que tarda en volver a salir una rota
  restosMs: 1100,        // lo que se queda la fruta desparramada en el suelo
  gravedad: 1500,
};

// La torre de vigia de Miami. Es decorado: el Salvavidas salta de una a otra,
// pero nadie se sube a ellas.
export const TORRE = {
  ancho: 86,
  alto: 132,
  cuantas: 3,
  margen: 90,
};

// El flotador que tira el Salvavidas: rueda por el suelo y hay que saltarlo.
export const FLOTADOR = {
  ancho: 46,
  alto: 46,
  caja: { ancho: 38, alto: 38 },
  velocidad: 190,
  duracionMs: 5200,
};

// El heladito de chocolate que escupe Papa Inodoro, el jefe de Space Coast.
// Sale en arco y se estrella contra el suelo, dejando su mancha.
//
// La caja va pegada al borde de abajo del dibujo, como en la vaca: el recorte
// deja al muneco apoyado en la base del lienzo, asi que centrarla la habria
// dejado flotando por encima del cono.
export const HELADITO = {
  ancho: 48,
  alto: 48,
  caja: { ancho: 28, alto: 17 },
  velocidad: 175,
  impulso: 210,        // lo que sube al salir, para que haga arco
  salidaX: 52,         // por donde sale, contado desde el centro del jefe
  salidaY: -38,        // a la altura de la boca, no de la taza
  giroMs: 130,         // cada cuanto cambia de pose mientras da tumbos
  manchaMs: 900,       // lo que se queda la mancha en el suelo
};

// La bala de espuma del Capitan Tapon.
export const BALA = {
  ancho: 46,
  alto: 34,
  caja: { ancho: 34, alto: 24 },
  velocidad: 220,
  duracionMs: 3600,
  salidaY: -8,
};

export const JEFE = {
  // Hasta donde considera que el nino ya esta en su arena. Mientras no llegue,
  // el jefe espera sin atacar.
  alcanceArena: 380,
  // Lo que se deja fuera por la izquierda al mirar si el nino esta en la arena:
  // el porche del checkpoint. Llegar a la bandera no despierta al jefe.
  margenDeArena: 170,
  // Durante la pelea caen corazones de vez en cuando: pelear con un jefe no
  // puede costar la partida.
  corazonMinMs: 5200,
  corazonMaxMs: 9000,
  vidas: 3,
  velocidad: 46,
  invulnerableMs: 900,
  parpadeoMs: 110,
  reboteJugador: 470,   // impulso del jugador al saltarle encima
  empujonAlHerir: 90,   // cuanto retrocede el jefe al recibir un golpe
  // El jefe mide el doble que un nino, y asi se queda: es lo que le da empaque.
  // Lo que se le recorta es la CAJA, que va bastante por dentro del dibujo,
  // igual que en la banera.
  //
  // El salto sube 114,6 px, asi que desde el suelo los pies del nino llegan
  // como mucho a y=173. Con la caja midiendo lo que el dibujo, su techo estaba
  // en 138: el nino nunca lo pasaba, y lo unico que conseguia saltando era
  // chocar de lado y mojarse. Ahora el techo queda en 184, once pixeles por
  // debajo de donde llega el salto, asi que se le puede caer encima con una
  // carrerilla; la plataforma de la arena sigue estando, pero ya no es la unica
  // manera.
  ancho: 172,
  alto: 172,
  caja: { ancho: 148, alto: 104 },
};

export const ENEMIGO = {
  velocidad: 58,
  sondaBorde: 8,    // cuanto mira por delante para detectar el borde
  // Los bichos son del tamano de los ninos: si son mucho mas bajos, cuesta
  // darles y no dan ningun respeto.
  ancho: 96,
  alto: 86,
  // La caja va bastante por dentro del dibujo. La banera se dibuja de la
  // altura de un nino, pero si la caja midiera lo mismo que el dibujo seria
  // mas alta que el propio nino y saltarla quedaria al filo: se chocaba de
  // lado una y otra vez en vez de aplastarla.
  caja: { ancho: 54, alto: 60 },
  // el dibujo no llega hasta el borde de abajo del lienzo: se apoya un poco
  // antes. Sin esto la banera se hunde en el suelo.
  margenPie: 2,

  // De vez en cuando la banera se planta, se agacha y salta tirando agua con
  // jabon. Cuanto mas avanzada la partida, mas a menudo lo hace.
  ataque: {
    esperaMinMs: 3200,    // en el primer tablero
    esperaMaxMs: 6000,
    // cada nivel que pasa acorta la espera; nunca baja de esperaMinima
    recortePorNivel: 0.14,
    esperaMinima: 1200,
    avisoMs: 420,         // lo que se queda agachado antes de saltar
    lanzandoMs: 420,
    impulsoSalto: 380,
    distanciaMaxima: 420, // solo ataca si el nino esta a tiro
  },
};

// El agua con jabon que lanza la banera.
export const AGUA = {
  velocidad: 210,
  elevacion: -170,
  gravedad: 520,
  duracionMs: 2600,
  tamano: 30,
};

// La paloma pasa volando por la franja de arriba y suelta lo que suelta.
export const PALOMA = {
  // Aguanta dos saltos encima: al primero se queda aturdida dando tumbos, al
  // segundo se cae al suelo, titila y desaparece.
  vidas: 2,
  aturdidaMs: 2600,
  msPorVuelta: 110,
  titileoMs: 130,
  titileos: 5,
  // cuadrado, como el lienzo del dibujo: con un rectangulo la paloma salia
  // aplastada
  ancho: 92,
  alto: 92,
  caja: { ancho: 56, alto: 40 },
  velocidad: 130,
  alturaMinFila: 0.4,   // por que parte de la franja alta vuela
  alturaMaxFila: 2.2,
  // Y de vez en cuando baja a volar a la altura del SEGUNDO piso, rozando las
  // plataformas. Ahi si estorba: hay que saltarla o pisarla desde la
  // plataforma, en vez de verla pasar por arriba.
  alturaMediaMinFila: 4.3,
  alturaMediaMaxFila: 5.3,
  probabilidadMedia: 0.38,
  msPorAleteo: 90,
  // cada cuanto aparece una. Igual que las baneras, mas a menudo segun avanza.
  esperaMinMs: 7000,
  esperaMaxMs: 13000,
  recortePorNivel: 0.12,
  esperaMinima: 3000,
  avisoMs: 260,         // lo que tarda en soltar desde que se pone
  caida: { gravedad: 620, tamano: 22 },
};

// LOS MANDOS TACTILES, para poder jugar en un telefono. Las medidas van en la
// pantalla de siempre (640 x 360): el joystick abajo a la izquierda y los dos
// botones abajo a la derecha, donde caen los pulgares con el aparato en
// horizontal. El de pausa va arriba en medio, que es el hueco que deja el HUD.
export const TACTIL = {
  joystick: { x: 84, y: 288, radio: 48, palanca: 23, recorrido: 32, zonaMuerta: 9 },
  salto: { x: 574, y: 292, radio: 38 },
  ataque: { x: 492, y: 244, radio: 31 },
  pausa: { x: 320, y: 24, radio: 16 },
  // Translucidos, que estan por delante del juego. Se encienden al tocarlos,
  // para que se note que han cogido el dedo.
  alpha: 0.6,
  alphaPulsado: 1,
  profundidad: 60,
  // El area que responde es mas ancha que el circulo dibujado: los dedos son
  // gordos y fallar un boton en pleno salto se paga.
  margenBoton: 1.35,
  // Hasta donde llega la mitad de la palanca: cualquier dedo que baje a la
  // izquierda de esta raya la maneja, acierte o no el circulo.
  mitadDeLaPalanca: 280,
  // lo que hay que empujar la palanca hacia arriba para que ademas salte
  saltoArriba: 0.6,
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
