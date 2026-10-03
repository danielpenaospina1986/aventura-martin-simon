// ---------------------------------------------------------------------------
// EL SUELO DE CADA CIUDAD
//
// El plano medio es donde se juega, asi que su dibujo tiene que decir en que
// ciudad estamos sin quitarle protagonismo al personaje. Cada una trae su
// pavimento, su subsuelo y el color de sus cornisas.
//
// "pais" dice que bandera lleva el checkpoint: las dos ciudades colombianas la
// de Colombia y las tres de Estados Unidos la suya.
//
// "patron" dice COMO se pinta (lo dibuja sistemas/dibujo.js) y los colores, con
// que. Todo con contorno de tinta y colores apagados, que es el idioma visual
// del juego.
//
// Importante: la casilla se repite en mosaico, asi que el dibujo tiene que
// casar consigo mismo por los cuatro lados. Nada de marcos completos, que
// convierten el suelo en una cuadricula.
// ---------------------------------------------------------------------------

// Los adornos del primer plano, los que cruzan pegados a la camara.
//
// Nacen del borde de abajo de la pantalla, no de la linea por donde camina el
// nino: estan mas cerca que el suelo, asi que su base queda fuera de cuadro.
// Por eso las alturas son mas cortas de lo que pareceria: lo que se ve de un
// arbol de 150 px es solo lo que asoma por encima del suelo. Si se le da la
// altura "real" tapa al nino entero y no se puede jugar.
//
//   desde    de que borde cuelga: 'abajo' (a nivel de suelo) o 'arriba'
//   alto     lo que mide en pantalla; el ancho sale solo, sin deformar
//   cada     cada cuantos pixeles aparece uno
//   desfase  donde empieza la serie, para que no salgan todos alineados
import { TEXTURAS } from './estilo.js';

// EL DECORADO DEL PUEBLO: lo que pasa por DETRAS del nino y del suelo.
//
// No cruza por delante de nadie ni tapa nada: es la ambientacion del sitio
// donde se esta jugando. Apoya en la linea del suelo, hundido un pelin por
// detras del terreno (`PLANOS.detras.hundido`), va opaco y con el contorno a la
// mitad, y se dibuja en lienzos grandes para que no se vea dentado. Estas
// medidas estan probadas: sirven de patron para lo que venga.
//
// La chiva va dos veces, a distinto tamano y a distinto paso, para que se lea
// como dos chivas a distinta distancia y no como la misma calcada.
//
// De momento es el mismo para las cinco ciudades: Medellin lo tiene dibujado y
// las otras cuatro lo usan de prestado, hasta que Daniel mande el suyo. Es lo
// que se ha hecho siempre aqui con lo que falta.
const DECORADO_DE_PUEBLO = [
  { textura: TEXTURAS.frenteChiva, desde: 'abajo', alto: 185, cada: 1240, desfase: 760, detras: true },
  { textura: TEXTURAS.frenteChiva, desde: 'abajo', alto: 146, cada: 1320, desfase: 1600, detras: true },
  { textura: TEXTURAS.frenteGuayacanFondo, desde: 'abajo', alto: 246, cada: 1180, desfase: 340, detras: true },
  { textura: TEXTURAS.frenteCasa, desde: 'abajo', alto: 216, cada: 1460, desfase: 1120, detras: true },
];

// Y el de Space Coast, que ya tiene el suyo: la casa de Florida con su
// cocodrilo en el jardin, el jeep de los surfistas (que va dos veces, a
// distinto tamano, como la chiva) y el letrero del muelle.
const DECORADO_DE_COCOA = [
  { textura: TEXTURAS.frenteJeep, desde: 'abajo', alto: 184, cada: 1240, desfase: 760, detras: true },
  { textura: TEXTURAS.frenteJeep, desde: 'abajo', alto: 146, cada: 1320, desfase: 1600, detras: true },
  { textura: TEXTURAS.frenteLetrero, desde: 'abajo', alto: 163, cada: 1180, desfase: 340, detras: true },
  { textura: TEXTURAS.frenteCasaFlorida, desde: 'abajo', alto: 206, cada: 1460, desfase: 1120, detras: true },
];

export const CIUDADES = {
  // Costa espacial: arena de playa y hormigon de plataforma de lanzamiento.
  'space-coast': {
    pais: 'us',
    // costa y cabo de lanzamiento: palmeras, un vecino de otro planeta dandose
    // un bano, y un astronauta flotando alla arriba
    frente: [
      { textura: TEXTURAS.frentePalmera, desde: 'abajo', alto: 152, cada: 820, desfase: 340 },
      { textura: TEXTURAS.frenteAlien, desde: 'abajo', alto: 112, cada: 1180, desfase: 900 },
      { textura: TEXTURAS.frenteAstronauta, desde: 'arriba', alto: 104, cada: 1020, desfase: 520 },
      // y por detras, el pueblo: la casa, el jeep y el letrero del muelle
      ...DECORADO_DE_COCOA,
    ],
    pavimento: { patron: 'arena', claro: 0xe6d2a6, medio: 0xd2b98a, oscuro: 0xb09763 },
    subsuelo: { patron: 'estratos', claro: 0xb49b70, medio: 0x9c8460, oscuro: 0x7d6848 },
    cornisa: { cuerpo: 0xd8c49b, borde: 0x8d7850 },
  },

  // Medellin: acera de baldosa y ladrillo rojo debajo.
  medellin: {
    pais: 'co',
    // la ciudad de la hinchada verde, los frijoles y los guayacanes en flor
    frente: [
      { textura: TEXTURAS.frenteGuayacan, desde: 'abajo', alto: 148, cada: 940, desfase: 300 },
      { textura: TEXTURAS.frentePalmeraAlta, desde: 'abajo', alto: 210, cada: 1060, desfase: 1180 },
      { textura: TEXTURAS.frenteFrijoles, desde: 'abajo', alto: 96, cada: 1140, desfase: 480 },
      // El gato de la hinchada, llorando porque Martain le mocho la cola. Va
      // con su bocadillo, que es el chiste, asi que sigue siendo el mas alto de
      // los adornos de suelo.
      { textura: TEXTURAS.frenteGato, desde: 'abajo', alto: 136, cada: 1460, desfase: 900 },
      // la chiva, la casa y los guayacanes grandes, por detras del nino
      ...DECORADO_DE_PUEBLO,
    ],
    pavimento: { patron: 'baldosa', claro: 0xcfc4b0, medio: 0xb5a893, oscuro: 0x8d8070 },
    subsuelo: { patron: 'adoquin', claro: 0xa85f45, medio: 0x8e4d37, oscuro: 0x6b3828 },
    cornisa: { cuerpo: 0xc08f5e, borde: 0x6b4526 },
  },

  // Atlanta: calle de asfalto con su linea pintada, sobre hormigon.
  atlanta: {
    pais: 'us',
    // sin adornos propios todavia: de fondo, el decorado prestado; de delante,
    // los provisionales que pone montarPrimerPlano
    frente: [...DECORADO_DE_PUEBLO],
    pavimento: { patron: 'asfalto', claro: 0x6a6a6e, medio: 0x55555a, oscuro: 0x3c3c41, linea: 0xd8b44a },
    subsuelo: { patron: 'estratos', claro: 0x807c78, medio: 0x6a6663, oscuro: 0x4e4b48 },
    cornisa: { cuerpo: 0x9c9690, borde: 0x4e4b48 },
  },

  // Miami: acera art deco en rosa palido con junta clara.
  // Miami **ya tiene los suyos**, dibujados por Daniel, asi que se le va lo
  // prestado de Medellin. Por DETRAS, Ocean Drive: la hilera de hoteles art
  // deco y la camioneta azul de Jhon —el esposo de la tia— con su equipo de
  // buzo en el platon y la tia de copiloto, con su casco blanco de obra. Por
  // DELANTE, las palmeras con el letrero de MIAMI BEACH, las tres banistas y
  // los dos delfines malvados.
  //
  // Los delfines van DELANTE a proposito: naciendo del borde de abajo se ve la
  // parte alta del salto, como si vinieran del agua que queda fuera de cuadro.
  miami: {
    pais: 'us',
    frente: [
      { textura: TEXTURAS.frentePalmerasMiami, desde: 'abajo', alto: 198, cada: 1180, desfase: 380 },
      { textura: TEXTURAS.frenteBanistas, desde: 'abajo', alto: 142, cada: 1340, desfase: 1020 },
      { textura: TEXTURAS.frenteDelfines, desde: 'abajo', alto: 126, cada: 1080, desfase: 1660 },
      // y por detras, Ocean Drive
      { textura: TEXTURAS.frenteOceanDrive, desde: 'abajo', alto: 192, cada: 1420, desfase: 240, detras: true },
      { textura: TEXTURAS.frenteCamioneta, desde: 'abajo', alto: 148, cada: 1520, desfase: 1140, detras: true },
    ],
    pavimento: { patron: 'baldosa', claro: 0xe7c3bd, medio: 0xd0a49f, oscuro: 0xa87e7a },
    subsuelo: { patron: 'estratos', claro: 0xb99d9b, medio: 0x9d8482, oscuro: 0x7a6563 },
    cornisa: { cuerpo: 0x7fc4c0, borde: 0x3f7a78 },
  },

  // Cartagena: calzada de piedra colonial, ocre y gastada.
  cartagena: {
    pais: 'co',
    frente: [...DECORADO_DE_PUEBLO],
    pavimento: { patron: 'piedra', claro: 0xdcc28c, medio: 0xc2a670, oscuro: 0x9b8252 },
    subsuelo: { patron: 'piedra', claro: 0xab8f5f, medio: 0x917847, oscuro: 0x6f5c36 },
    cornisa: { cuerpo: 0xd9a05b, borde: 0x8a5f2c },
  },
};

// Si un nivel no dice de que ciudad es, o trae una que no esta, se usa esta.
export const CIUDAD_POR_DEFECTO = 'space-coast';

// Orlando ya tiene fondo y jefe propios, asi que se le da tambien su calle: un
// paseo de parque, de baldosa clara y gastada, con la cornisa en el mismo verde
// azulado que el cielo de su ilustracion.
//
// **Ya tiene los suyos**, dibujados por Daniel, asi que se le va lo prestado de
// Space Coast (el jeep y la casa de Florida). Por DETRAS, los parques: la noria
// panoramica, la casa puesta boca abajo y el letrero de la entrada. Por
// DELANTE, las tres primas de los ninos, el raton malvado de 1928 y el villano
// desenmascarado con su bocadillo.
//
// La PALMERA se queda, y es la unica prestada que sobrevive: Orlando es
// Florida, asi que ahi no chirria nada —es lo contrario de lo que paso en Lake
// Lanier, donde las palmeras se lo llevaban a otro clima—. Y da el ritmo
// vertical que si no pondria solo la noria.
CIUDADES.orlando = {
  pais: 'us',
  frente: [
    { textura: TEXTURAS.frentePalmera, desde: 'abajo', alto: 152, cada: 1120, desfase: 260 },
    // las tres primas, el raton y el villano con lo que dice
    { textura: TEXTURAS.frentePrimas, desde: 'abajo', alto: 138, cada: 1260, desfase: 700 },
    { textura: TEXTURAS.frenteRaton, desde: 'abajo', alto: 152, cada: 1180, desfase: 1480 },
    { textura: TEXTURAS.frenteVillano, desde: 'abajo', alto: 186, cada: 1620, desfase: 1060 },
    // y por detras, los parques
    { textura: TEXTURAS.frenteNoria, desde: 'abajo', alto: 266, cada: 1460, desfase: 900, detras: true },
    { textura: TEXTURAS.frenteCasaAlReves, desde: 'abajo', alto: 172, cada: 1340, desfase: 320, detras: true },
    { textura: TEXTURAS.frenteDisneySprings, desde: 'abajo', alto: 152, cada: 1540, desfase: 1700, detras: true },
  ],
  pavimento: { patron: 'baldosa', claro: 0xd9c8b4, medio: 0xbfac96, oscuro: 0x968573 },
  subsuelo: { patron: 'estratos', claro: 0xa89a88, medio: 0x8e8171, oscuro: 0x6b6156 },
  cornisa: { cuerpo: 0x8fb6c4, borde: 0x40646f },

  // Su dibujo trae el horizonte MUY abajo: la masa de suelo empieza al 66% de
  // la lamina, y con el encuadre de casa el piso del juego tapaba desde el 54%.
  // O sea que se comia justo la franja donde estan las bases del castillo y de
  // las montanas rusas, y el castillo se veia cortado. Subiendo el dibujo, su
  // linea de suelo cae sobre la del juego, que es donde tiene que estar.
  fondoBajada: -0.06,
};

// Lake Lanier: la orilla del lago, de tierra y grava claras, con la cornisa en
// el verde de sus pinos.
//
// **Ya tiene los suyos**, dibujados por Daniel, asi que se le va lo prestado de
// Space Coast (el jeep y la casa de Florida) y los adornos provisionales. Por
// DETRAS, Georgia de verdad: la casa victoriana de suburbio, el roble con sus
// barbas de musgo espanol —de los de Savannah— y el pino alto. Por DELANTE, la
// gata negra y el eufonio parlanchin, con su bocadillo.
//
// Lo que NO se le pone son las PALMERAS, y eso no cambia: esto es un lago de
// Georgia, de pinos y robles, y unas palmeras delante se lo llevaban a otro
// clima de un vistazo.
//
// El pino y el roble van DETRAS por lo mismo que el mango de la finca: miden
// mas que el nino y por delante lo taparian entero.
//
// Su dibujo acaba al 67% de la lamina (por debajo es agua lisa), asi que se
// sube para que la orilla caiga sobre el suelo del juego.
CIUDADES['lake-lanier'] = {
  pais: 'us',
  frente: [
    // la gata del lago y el eufonio, que va diciendo lo suyo
    { textura: TEXTURAS.frenteGata, desde: 'abajo', alto: 96, cada: 1080, desfase: 420 },
    { textura: TEXTURAS.frenteEufonio, desde: 'abajo', alto: 172, cada: 1580, desfase: 1240 },
    // y por detras, Georgia: la casa victoriana, el roble y el pino
    { textura: TEXTURAS.frenteCasaVictoriana, desde: 'abajo', alto: 212, cada: 1520, desfase: 980, detras: true },
    { textura: TEXTURAS.frenteRoble, desde: 'abajo', alto: 168, cada: 1280, desfase: 340, detras: true },
    { textura: TEXTURAS.frentePino, desde: 'abajo', alto: 268, cada: 1160, desfase: 1720, detras: true },
  ],
  pavimento: { patron: 'arena', claro: 0xded0b4, medio: 0xc3b394, oscuro: 0x9b8d72 },
  subsuelo: { patron: 'estratos', claro: 0xa89c86, medio: 0x8d8270, oscuro: 0x6a6153 },
  cornisa: { cuerpo: 0x8aa878, borde: 0x47603c },
  fondoBajada: -0.08,
};

// La finca (El Refugio): tierra apisonada del Magdalena Medio, con la cornisa
// en el teja de su techo.
//
// **Ya tiene los suyos**, dibujados por Daniel, y con eso se le va lo prestado
// de Medellin (la chiva y la casa de pueblo). Por DETRAS, la finca de verdad:
// el abuelo arriando ganado a caballo con su sombrero vueltiao, el corral lleno
// de cebues y el palo de mango. Por DELANTE, la abuelita cocinando frijoles
// —con su bocadillo, como el gato de Medellin— y los tres cachorros: el negro,
// el negro de pecho y pata blancos, y el blanco del ojo tapado.
//
// Lo que NO se le pone es un guayacan delante, aunque lo tengamos: su
// ilustracion ya viene llena de arboles en flor, y anadiendo los nuestros el
// tablero se convertia en una pared amarilla por la que no se veia jugar. La
// palmera alta se queda, que es vertical y deja ver, y en el Magdalena Medio
// pega.
//
// El mango va DETRAS y no delante a proposito, por lo mismo: un arbol de 250 px
// cruzando por delante tapa al nino entero.
//
// Su encuadre vertical va en CERO, y eso es a proposito. Su dibujo acaba al 71%
// y por debajo es un liso: subiendolo (iba en -0,14) ese liso entraba en cuadro
// y se veia como una franja tostada cruzando justo por encima del suelo, una
// linea paralela al piso por donde camina el nino. Lo conto Daniel.
//
// Y se deja en cero y no en un negativo pequeno porque en cero el encuadre NO
// depende de cuanto se amplie la lamina: el desplazamiento se multiplica por lo
// que sobra de alto, asi que con cualquier otro valor una pantalla mas ancha
// —un telefono, que se lleva MUNDO.ancho hasta 800— amplia mas, sobra mas alto
// y la franja volveria a asomar. En cero, la lamina queda centrada y se ve
// igual en todas las pantallas.
CIUDADES.finca = {
  pais: 'co',
  frente: [
    { textura: TEXTURAS.frentePalmeraAlta, desde: 'abajo', alto: 210, cada: 1180, desfase: 520 },
    // la abuelita, con lo que dice. Va mas baja que el gato de Medellin en
    // proporcion: su bocadillo se lleva el tercio de arriba del dibujo, asi que
    // ella sola queda a la altura de un nino y no lo tapa al pasar.
    { textura: TEXTURAS.frenteAbuelita, desde: 'abajo', alto: 178, cada: 1640, desfase: 1180 },
    // los tres cachorros, sueltos por el tablero y a distinto paso, para que no
    // se lean como los mismos tres calcados
    { textura: TEXTURAS.frenteCachorroNegro, desde: 'abajo', alto: 78, cada: 980, desfase: 300 },
    { textura: TEXTURAS.frenteCachorroPinto, desde: 'abajo', alto: 74, cada: 1120, desfase: 760 },
    { textura: TEXTURAS.frenteCachorroBlanco, desde: 'abajo', alto: 80, cada: 1060, desfase: 1500 },
    // y por detras, la finca: el abuelo arriando, el corral y el palo de mango
    { textura: TEXTURAS.frenteAbueloCaballo, desde: 'abajo', alto: 150, cada: 1420, desfase: 880, detras: true },
    { textura: TEXTURAS.frenteCorral, desde: 'abajo', alto: 178, cada: 1520, desfase: 1680, detras: true },
    { textura: TEXTURAS.frenteMango, desde: 'abajo', alto: 252, cada: 1240, desfase: 360, detras: true },
  ],
  pavimento: { patron: 'arena', claro: 0xd9c096, medio: 0xbfa478, oscuro: 0x95805a },
  subsuelo: { patron: 'estratos', claro: 0xa98f6a, medio: 0x8d7757, oscuro: 0x6b5a41 },
  cornisa: { cuerpo: 0xc4734f, borde: 0x7a3f28 },
  fondoBajada: 0,
};

export function ciudadDe(nombre) {
  return CIUDADES[nombre] || CIUDADES[CIUDAD_POR_DEFECTO];
}

export default CIUDADES;
