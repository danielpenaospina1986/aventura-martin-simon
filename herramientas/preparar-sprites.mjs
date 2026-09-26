// ---------------------------------------------------------------------------
// PREPARAR LOS SPRITES DE UN PERSONAJE
//
// Coge las poses dibujadas (src/assets/simon-origen/) y las deja listas para el
// juego:
//
//   1. quita el fondo de cuadros y lo deja transparente;
//   2. recorta cada pose a lo que ocupa el personaje;
//   3. las escala TODAS a la misma altura y las pone en un lienzo del mismo
//      tamano, centradas y apoyadas abajo. Esto es lo importante: si cada pose
//      tuviera su propio encuadre, al cambiar de una a otra el personaje daria
//      un salto en pantalla.
//
// Se ejecuta con el servidor de desarrollo levantado (npm run dev):
//
//   node herramientas/preparar-sprites.mjs
// ---------------------------------------------------------------------------

import { chromium } from '@playwright/test';
import { CONTORNO, TINTA, instalarContorno } from './lib/contorno.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ALTO_PERSONAJE = 240; // alto del muneco dentro del lienzo, en pixeles
const LIENZO = { ancho: 260, alto: 260 };
const SERVIDOR = 'http://127.0.0.1:5173';

const PERSONAJES = [
  {
    nombre: 'simon',
    origen: 'src/assets/simon-origen',
    destino: 'src/assets/simon',
    // poses sueltas, una por archivo
    poses: ['quieto', 'lanza'],
    // hojas con varias poses en rejilla. "recorteAbajo" quita la franja de la
    // etiqueta que llevan escrita debajo de cada dibujo.
    // Las poses se buscan solas dentro de la hoja: no hace falta que esten en
    // una rejilla regular (en la de carrera, la fila de abajo va centrada).
    // Los nombres se asignan en orden de lectura.
    hojas: [
      { archivo: 'hoja-carrera', nombres: ['corre1', 'corre2', 'corre3', 'corre4', 'corre5'] },
      { archivo: 'hoja-extras', nombres: ['golpe', 'victoria'] },
    ],
  },
  {
    nombre: 'banera',
    // su hoja viene sobre verde liso, asi que el detector la recorta por tono y
    // la tolerancia del damero no se usa
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/bichos/banera',
    poses: [],
    hojas: [
      {
        archivo: 'banera',
        nombres: ['quieta', 'anda1', 'anda2', 'carga', 'lanza'],
      },
    ],
  },
  {
    // LA VACA BERRIONDA, el bicho intermedio de los tableros.
    //
    // Su hoja viene sobre turquesa liso, asi que se recorta por color exacto.
    // La tolerancia va alta (100) a proposito: las poses de arriba llevan una
    // SOMBRA ovalada debajo, que es el mismo turquesa mas oscuro, y con la
    // tolerancia de siempre se quedaba pegada como un halo gris bajo las
    // pezunas. Lo que de verdad tiene la vaca (crema, amarillo, rosa, marron)
    // esta a mas de 250 de distancia del fondo, asi que no corre peligro.
    //
    // Las zonas van a mano por dos razones: la fila de abajo trae una LINEA DE
    // SUELO dibujada que hay que dejar fuera (por eso todas cortan en y=686, a
    // un pixel de las pezunas), y el vaho y las estrellitas son manchas sueltas
    // que hay que meter dentro del recuadro de su pose.
    nombre: 'vaca',
    colorExacto: true,
    limpiarBolsas: true,
    // entre las patas quedan bolsas de turquesa de unos 60 px; con el minimo
    // de casa se quedaban puestas. La vaca no tiene nada turquesa, asi que
    // bajarlo no se lleva nada por delante.
    bolsaMinima: 40,
    tolerancia: 100,
    lienzo: { ancho: 480, alto: 312 },
    salida: 'webp',
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/bichos/vaca',
    poses: [],
    hojas: [
      {
        archivo: 'vaca',
        // SIN porPieza: las seis comparten escala, que es lo que hace que la
        // vaca no encoja ni crezca al cambiar de pose.
        nombres: ['anda1', 'anda2', 'avisa', 'embiste1', 'embiste2', 'tumbada'],
        zonas: [
          { x: 40, y: 60, ancho: 400, alto: 285 },   // trota, fase A
          { x: 468, y: 88, ancho: 422, alto: 257 },  // trota, fase B
          { x: 915, y: 85, ancho: 430, alto: 260 },  // se planta y resopla
          { x: 16, y: 440, ancho: 492, alto: 246 },  // embiste, patas estiradas
          { x: 510, y: 440, ancho: 405, alto: 246 }, // embiste, patas recogidas
          { x: 916, y: 470, ancho: 428, alto: 216 }, // tumbada, con sus estrellas
        ],
      },
    ],
  },
  {
    nombre: 'paloma',
    tolerancia: 6,
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/bichos/paloma',
    poses: [],
    extension: 'webp',
    hojas: [
      {
        archivo: 'paloma',
        extension: 'webp',
        nombres: ['vuela1', 'vuela2', 'vuela3', 'vuela4', 'vuela5', 'suelta1', 'suelta2', 'vuela6'],
      },
      // Las poses de cuando le dan van en el MISMO personaje a proposito: asi
      // comparten altura con las de vuelo y la paloma no cambia de tamano al
      // recibir el golpe.
      //
      // Aqui las zonas van a mano: en esta hoja los dibujos se tocan unos con
      // otros y cualquier deteccion automatica junta dos palomas en una. De las
      // diez que trae solo hacen falta estas cinco.
      {
        archivo: 'paloma-golpe',
        nombres: ['mareada', 'cae1', 'cae2', 'cae3', 'suelo'],
        zonas: [
          { x: 738, y: 102, ancho: 258, alto: 202 },   // aturdida, con estrellitas
          { x: 1068, y: 34, ancho: 252, alto: 250 },   // empieza a caer
          { x: 596, y: 276, ancho: 256, alto: 252 },   // cayendo de espaldas
          { x: 1062, y: 275, ancho: 215, alto: 265 },  // cabeza abajo
          { x: 1013, y: 609, ancho: 321, alto: 123 },  // tumbada en el suelo
        ],
      },
    ],
  },
  {
    nombre: 'objetos',
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/objetos',
    poses: [],
    hojas: [
      {
        archivo: 'objetos',
        porManchas: true,
        separacion: 6,
        // cada objeto va a lo suyo: un lego y una puerta no tienen por que
        // medir lo mismo, asi que no comparten escala
        porPieza: true,
        nombres: ['lego', 'sushi', 'bandera-co', 'puerta', 'bandera-co2', 'bandera-us'],
      },
    ],
  },
  {
    // Los adornos del primer plano, los que cruzan pegados a la camara.
    nombre: 'frente',
    // Las palmeras tienen las hojas del mismo verde que la lamina: por tono se
    // las comia el recorte y quedaba solo el tronco.
    colorExacto: true,
    tolerancia: 60,
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'frente',
        // cada uno a lo suyo: una palmera y una olla no miden lo mismo
        porPieza: true,
        // Las zonas van a mano para saber con certeza cual es cual: aqui el
        // orden que saca el detector no coincide con el de lectura, porque las
        // banderas de los buses y las copas de las palmeras desplazan los
        // recuadros.
        // El guayacan ya no sale de aqui: Daniel lo mando dibujado aparte y
        // tiene su propia entrada, mas abajo. Los dos buses tampoco: los
        // reemplazo la chiva.
        nombres: [
          'palmera', 'alien', 'astronauta', 'bus1',
          'bus2', 'frijoles', 'palmera-alta',
        ],
        zonas: [
          { x: 80, y: 45, ancho: 240, alto: 300 },     // palmera de playa
          { x: 360, y: 60, ancho: 310, alto: 300 },    // alien en la banera
          { x: 695, y: 55, ancho: 295, alto: 300 },    // astronauta flotando
          { x: 1020, y: 50, ancho: 355, alto: 310 },   // bus con hinchas
          { x: 50, y: 400, ancho: 375, alto: 320 },    // bus con confeti
          { x: 445, y: 425, ancho: 320, alto: 295 },   // olla de frijoles
          { x: 780, y: 370, ancho: 175, alto: 355 },   // palmera alta
        ],
      },
    ],
  },
  {
    // El guayacan en flor, dibujado aparte. Reemplaza al que salia de la hoja.
    nombre: 'guayacan',
    colorExacto: true,
    limpiarBolsas: true,
    lienzo: { ancho: 660, alto: 660 },
    salida: 'webp',
    tolerancia: 60,
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'guayacan',
        porPieza: true,
        nombres: ['guayacan'],
        zonas: [{ x: 268, y: 10, ancho: 872, alto: 752 }],
      },
    ],
  },
  // --- el decorado de fondo de Space Coast ---------------------------------
  //
  // Las tres laminas de Daniel para el plano de DETRAS de la costa espacial.
  // Van con las medidas de esa capa, que son las que quedaron probadas: lienzo
  // grande (para que no se vean dentadas a densidad 3), contorno a la mitad y
  // salida en webp.
  //
  // Las dos primeras vienen sobre BLANCO. El blanco no tiene tono, asi que el
  // detector no lo toma por "fondo liso de color": se le dice a mano que compare
  // el color exacto. Y NO se les limpia por color el interior (`limpiarBolsas`):
  // las casas tienen marcos, columnas y barandas blancas, y se las comeria.
  {
    nombre: 'casa-florida',
    colorExacto: true,
    tolerancia: 45,
    // La lamina trae el CIELO pintado dentro, en un ovalo detras de la casa.
    // En el juego va delante de la ilustracion de la ciudad, asi que ese cielo
    // sobra: se declara como fondo tambien. Las ventanas no corren peligro,
    // estan a mas de 170 de ese azul (y ademas van por dentro de la casa, donde
    // el relleno de los bordes no entra).
    fondosExtra: [{ color: [146, 216, 242], tolerancia: 115 }],
    lienzo: { ancho: 880, alto: 500 },
    contornoRelativo: 0.5,
    salida: 'webp',
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'casa-florida',
        porPieza: true,
        nombres: ['casa-florida'],
        zonas: [{ x: 38, y: 12, ancho: 1348, alto: 742 }],
      },
    ],
  },
  {
    nombre: 'jeep',
    colorExacto: true,
    tolerancia: 45,
    lienzo: { ancho: 700, alto: 520 },
    contornoRelativo: 0.5,
    salida: 'webp',
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'jeep',
        porPieza: true,
        nombres: ['jeep'],
        zonas: [{ x: 286, y: 76, ancho: 876, alto: 652 }],
      },
    ],
  },
  {
    // Este viene sobre el damero gris de siempre, asi que se deja al detector
    // por defecto: con "color exacto" solo se iria uno de los dos grises y el
    // otro se quedaria pegado.
    nombre: 'letrero',
    limpiarBolsas: true,
    lienzo: { ancho: 700, alto: 520 },
    contornoRelativo: 0.5,
    salida: 'webp',
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'letrero',
        porPieza: true,
        nombres: ['letrero'],
        zonas: [{ x: 208, y: 28, ancho: 974, alto: 708 }],
      },
    ],
  },
  {
    // El mismo guayacan, pero para el plano de DETRAS: mismo dibujo con el
    // contorno a la mitad. Los adornos del fondo con la linea de delante se
    // veian recortados a tijera contra la ilustracion de la ciudad.
    nombre: 'guayacan-fondo',
    colorExacto: true,
    limpiarBolsas: true,
    lienzo: { ancho: 660, alto: 660 },
    contornoRelativo: 0.5,
    salida: 'webp',
    tolerancia: 60,
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'guayacan',
        porPieza: true,
        nombres: ['guayacan-fondo'],
        zonas: [{ x: 268, y: 10, ancho: 872, alto: 752 }],
      },
    ],
  },
  {
    // La casa tipica colombiana, con su balcon y su bandera.
    //
    // Su lamina viene con un marco de pelicula NEGRO alrededor, asi que la zona
    // tiene que entrar bien por dentro: el detector toma el color del fondo de
    // la esquina del recorte, y con el marco fuera tomaba el negro por fondo y
    // dejaba la lamina entera de una pieza. Tambien se deja fuera el viñeteado
    // del borde, que es el mismo turquesa pero mas oscuro y no se iba.
    nombre: 'casa',
    colorExacto: true,
    limpiarBolsas: true,
    lienzo: { ancho: 860, alto: 500 },
    contornoRelativo: 0.5,
    salida: 'webp',
    tolerancia: 60,
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'casa',
        porPieza: true,
        nombres: ['casa'],
        zonas: [{ x: 84, y: 28, ancho: 1256, alto: 700 }],
      },
    ],
  },
  {
    // La chiva de la hinchada, camino del estadio. Es un dibujo apaisado y muy
    // ancho: en el lienzo cuadrado se queda en una franja de abajo, que es
    // justo lo que hace falta, porque se apoya por su base.
    nombre: 'chiva',
    colorExacto: true,
    limpiarBolsas: true,
    lienzo: { ancho: 760, alto: 480 },
    contornoRelativo: 0.5,
    salida: 'webp',
    tolerancia: 60,
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'chiva',
        porPieza: true,
        nombres: ['chiva'],
        zonas: [{ x: 92, y: 18, ancho: 1200, alto: 744 }],
      },
    ],
  },
  {
    // El gato de la hinchada de Medellin, llorando porque Martain le mocho la
    // cola. Va en su propia entrada y no como una hoja mas de "frente" porque
    // la altura del lienzo se reparte entre TODOS los grupos de un personaje:
    // metiendolo ahi, su bocadillo habria encogido a las palmeras y los buses.
    nombre: 'gato',
    colorExacto: true,
    limpiarBolsas: true,
    lienzo: { ancho: 420, alto: 560 },
    salida: 'webp',
    tolerancia: 60,
    origen: 'src/assets/objetos-origen',
    destino: 'src/assets/frente',
    poses: [],
    hojas: [
      {
        archivo: 'gato',
        porPieza: true,
        nombres: ['gato'],
        // El dibujo entero, bocadillo incluido: las orejas se le montan encima,
        // asi que no hay recuadro que los separe. Y el chiste es el bocadillo.
        zonas: [{ x: 245, y: 16, ancho: 702, alto: 1019 }],
      },
    ],
  },
  {
    // PAPA INODORO, el guardian del bano de Space Coast: una cabeza saliendo de
    // un retrete, con la cara de Daniel.
    //
    // Su hoja viene sobre turquesa liso, asi que se recorta por color exacto, y
    // la tolerancia va alta (100) por lo mismo que en la vaca: la pose del
    // brinco lleva una SOMBRA ovalada debajo que es el mismo turquesa mas
    // oscuro, y con la tolerancia de casa se quedaba pegada como un pegote gris
    // bajo la taza. Lo que de verdad tiene el jefe (porcelana blanca, piel,
    // pelo castano, agua azul clara) esta a mas de 200 de distancia del fondo.
    //
    // Las zonas van a mano porque la hoja trae ESCRITO el nombre de cada pose
    // debajo del dibujo: todas las de arriba cortan en y=366 y las de abajo en
    // y=727, justo por encima de las letras. De paso, la pose de escupir deja
    // fuera el heladito que lleva dibujado al lado (en el juego el heladito es
    // un objeto aparte, y dibujado encima saldria doble).
    nombre: 'papa-inodoro',
    colorExacto: true,
    limpiarBolsas: true,
    bolsaMinima: 60,
    tolerancia: 100,
    // Se ve a 172 px y a densidad 3 eso son 516 pixeles de verdad: con el
    // lienzo de casa (260) saldria dentado, como le paso a la chiva.
    lienzo: { ancho: 520, alto: 520 },
    salida: 'webp',
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/jefes/inodoro',
    poses: [],
    hojas: [
      {
        archivo: 'papa-inodoro',
        // SIN porPieza: las ocho comparten escala, que es lo que hace que el
        // jefe no encoja ni crezca al cambiar de pose.
        nombres: ['quieto', 'brinco', 'escupe', 'enojado', 'embiste', 'aturdido', 'golpe', 'derrotado'],
        zonas: [
          { x: 40, y: 46, ancho: 248, alto: 320 },    // quieto, cara de sobrado
          { x: 366, y: 26, ancho: 262, alto: 340 },   // el brinco, con su chapoteo
          { x: 694, y: 46, ancho: 262, alto: 320 },   // escupiendo (sin el heladito)
          { x: 1032, y: 46, ancho: 308, alto: 320 },  // enojado, con el vapor
          { x: 14, y: 425, ancho: 338, alto: 302 },   // embistiendo, con su estela
          { x: 392, y: 403, ancho: 300, alto: 324 },  // aturdido, con las estrellas
          { x: 732, y: 440, ancho: 272, alto: 287 },  // encajando el golpe
          { x: 1060, y: 440, ancho: 246, alto: 287 }, // derrotado, por el sifon
        ],
      },
    ],
  },
  {
    // EL ABUELO, el guardian del bano de Medellin: baja de la finca en su
    // pickup doble cabina con el tanque de agua en el platon.
    //
    // Su hoja viene sobre turquesa liso, asi que se recorta por color exacto.
    // Las zonas van a mano porque la hoja trae DIBUJADA una linea de suelo bajo
    // cada pose: las de arriba cortan en y=334 y las de abajo en y=726, justo a
    // un pixel de las llantas. Sin eso, el jefe saldria con una raya negra
    // pegada debajo.
    nombre: 'abuelo',
    colorExacto: true,
    // NADA de limpiarBolsas aqui, aunque el fondo sea turquesa liso. La chapa
    // de la camioneta es un GRIS VERDOSO (128,144,144) que queda a 148 del
    // fondo: pasa de sobra el filtro normal, pero el de las bolsas encerradas
    // es mucho mas ancho (tolerancia x 2,2 = 198) y se la comia entera. La
    // camioneta salia como una silueta negra con las ventanillas y el abuelo
    // pintados encima. La vaca si puede permitirselo porque no tiene un solo
    // color cerca del turquesa.
    limpiarBolsas: false,
    tolerancia: 90,
    // Se ve a 204 x 136 y a densidad 3 eso son 612 pixeles de verdad de ancho.
    // El lienzo es apaisado porque la camioneta lo es: cuadrado, la dejaria
    // nadando en aire por arriba y por abajo.
    lienzo: { ancho: 612, alto: 408 },
    salida: 'webp',
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/jefes/abuelo',
    poses: [],
    hojas: [
      {
        archivo: 'abuelo',
        // SIN porPieza: las seis comparten escala, que es lo que hace que la
        // camioneta no encoja ni crezca al cambiar de pose.
        nombres: ['ronda', 'avisa', 'embiste', 'resopla', 'golpe', 'derrotado'],
        zonas: [
          { x: 14, y: 78, ancho: 446, alto: 256 },    // rodando tranquilo
          { x: 464, y: 44, ancho: 448, alto: 290 },   // acelerando, con el puno en alto
          { x: 914, y: 58, ancho: 437, alto: 276 },   // embistiendo, con su estela
          { x: 25, y: 475, ancho: 460, alto: 251 },   // resoplando, con el capo humeando
          { x: 492, y: 399, ancho: 416, alto: 327 },  // la canastilla encima del techo
          { x: 935, y: 481, ancho: 416, alto: 245 },  // varado y enterrado en fruta
        ],
      },
    ],
  },
  {
    // La canastilla de fruta que le tumban encima al Abuelo. En SU PROPIA
    // entrada, como el heladito: la altura se reparte por grupos, asi que
    // metida en la hoja del jefe saldria del tamano de la camioneta.
    //
    // De su lamina solo sirve la fila de arriba: la de abajo trae repetidas dos
    // poses de la camioneta, que ya vienen en su hoja. Por eso ninguna zona
    // baja de y=380. Y a la canastilla llena se le deja fuera la cuerda: es
    // larguisima y, como las tres comparten escala, habria encogido a las otras
    // dos para hacerle sitio.
    nombre: 'canastilla',
    colorExacto: true,
    limpiarBolsas: true,
    bolsaMinima: 40,
    tolerancia: 90,
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/jefes/abuelo',
    poses: [],
    hojas: [
      {
        archivo: 'canastilla',
        nombres: ['canastilla', 'canastilla-cae', 'canastilla-rota'],
        zonas: [
          { x: 88, y: 88, ancho: 332, alto: 290 },   // llena, sin la cuerda
          { x: 480, y: 36, ancho: 420, alto: 340 },  // volcandose en el aire
          { x: 925, y: 94, ancho: 424, alto: 286 },  // reventada en el suelo
        ],
      },
    ],
  },
  {
    // El heladito de chocolate que escupe Papa Inodoro. Va en SU PROPIA entrada
    // y no como una hoja mas del jefe: la altura se reparte por grupos, asi que
    // metido con el, el heladito saldria del tamano del retrete.
    //
    // Los tres comparten escala (sin porPieza): son el mismo cono visto de dos
    // maneras y luego estrellado, y si cada uno se escalara por su cuenta, el
    // helado creceria al girar.
    nombre: 'heladito',
    colorExacto: true,
    limpiarBolsas: true,
    bolsaMinima: 60,
    tolerancia: 100,
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/jefes/inodoro',
    poses: [],
    hojas: [
      {
        archivo: 'heladito',
        nombres: ['helado1', 'helado2', 'helado-splat'],
        zonas: [
          { x: 60, y: 296, ancho: 402, alto: 172 },  // de punta, volando
          { x: 526, y: 212, ancho: 296, alto: 312 }, // dando tumbos
          { x: 904, y: 258, ancho: 414, alto: 310 }, // estrellado en el suelo
        ],
      },
    ],
  },
  {
    // Dona Zully, la mama, con su gorro de bano y su cepillo. Las mangueras van
    // sueltas en la misma hoja: son el chorro que dispara.
    nombre: 'zully',
    colorExacto: true,
    tolerancia: 60,
    origen: 'src/assets/bichos-origen',
    destino: 'src/assets/jefes/zully',
    poses: [],
    hojas: [
      // Los cuerpos por un lado y las mangueras por otro: si compartieran
      // escala, o la manguera saldria del tamano de Zully o Zully del tamano de
      // una manguera.
      {
        archivo: 'zully',
        grupo: 'zully-cuerpo',
        soloElCuerpo: true,
        nombres: ['quieta', 'mirada', 'empapada', 'victoria'],
        zonas: [
          { x: 50, y: 74, ancho: 280, alto: 462 },    // quieta, con su cepillo
          { x: 300, y: 74, ancho: 280, alto: 462 },   // la mirada: le brillan los ojos
          { x: 508, y: 95, ancho: 256, alto: 446 },   // empapada
          { x: 732, y: 40, ancho: 290, alto: 496 },   // victoria
        ],
      },
      {
        archivo: 'zully',
        grupo: 'zully-manguera',
        nombres: ['boquilla', 'chorro', 'aturdida', 'desinflada'],
        zonas: [
          { x: 22, y: 652, ancho: 254, alto: 266 },   // boquilla goteando
          { x: 230, y: 616, ancho: 364, alto: 304 },  // disparando
          { x: 592, y: 620, ancho: 166, alto: 302 },  // aturdida, con estrellitas
          { x: 773, y: 685, ancho: 224, alto: 270 },  // desinflada
        ],
      },
    ],
  },
  {
    nombre: 'martin',
    origen: 'src/assets/martin-origen',
    destino: 'src/assets/martin',
    poses: ['quieto'],
    // La hoja trae, en orden de lectura: dolor, victoria, el ciclo de carrera
    // de cuatro y dos de ataque con la katana.
    hojas: [
      {
        archivo: 'hoja',
        nombres: ['golpe', 'victoria', 'corre1', 'corre2', 'corre3', 'corre4', 'ataque1', 'ataque2'],
      },
    ],
  },
];

// El navegador solo se usa como lienzo de dibujo: las imagenes se le pasan ya
// leidas, no por el servidor. Asi la herramienta no depende de que el servidor
// este levantado, y sobre todo no se corta si Vite recarga la pagina a mitad.
// Se le pueden pasar nombres para rehacer solo esos:
//
//   node herramientas/preparar-sprites.mjs gato
//
// Sin nombres los rehace todos. Rehacerlos todos por un dibujo nuevo es lento y,
// sobre todo, vuelve a tocar arte que ya estaba bien.
const soloEstos = process.argv.slice(2);
const aTrabajar = soloEstos.length
  ? PERSONAJES.filter((p) => soloEstos.includes(p.nombre))
  : PERSONAJES;

if (!aTrabajar.length) {
  console.error(`  no hay ningun personaje que se llame: ${soloEstos.join(', ')}`);
  console.error(`  hay estos: ${PERSONAJES.map((p) => p.nombre).join(', ')}`);
  process.exit(1);
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto('about:blank');
await instalarContorno(pagina);

// Detector de fondo, compartido por las dos fases (buscar poses y recortarlas).
//
// Hay dos clases de original: los que vienen sobre el damero gris y blanco de
// los generadores de imagenes, y los que vienen sobre un color liso, como la
// hoja de baneras que Daniel pidio en verde justamente para que el recorte
// saliera limpio. Se distinguen mirando las cuatro esquinas: si coinciden entre
// si y no son grises, el fondo es liso.
await pagina.evaluate(() => {
  const tonoDe = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return -1;
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };

  // "colorExacto" compara el color tal cual, en vez del tono. Hace falta cuando
  // el dibujo tiene partes del MISMO color que el fondo (las hojas verdes de
  // una palmera sobre una lamina verde): por tono se las come, y por color solo
  // se va el verde plano del fondo, que es uniforme.
  window.detectorDeFondo = (p, ancho, alto, tolerancia, colorExacto, fondosExtra) => {
    const en = (x, y) => {
      const i = (y * ancho + x) * 4;
      return [p[i], p[i + 1], p[i + 2]];
    };

    if (colorExacto) {
      const [r0, g0, b0] = en(2, 2);
      const margen = tolerancia || 42;

      // Ademas del color del borde, una hoja puede declarar OTROS colores que
      // tambien son fondo, cada uno con su tolerancia. Hace falta cuando el
      // dibujo trae parte del decorado pintado dentro: la casita de Florida
      // viene con su propio cielo, y en el juego, delante de la ilustracion de
      // la ciudad, ese cielo no pinta nada.
      const fondos = [{ color: [r0, g0, b0], margen }].concat(
        (fondosExtra || []).map((f) => ({
          color: f.color,
          margen: f.tolerancia === undefined ? margen : f.tolerancia,
        })),
      );
      const cerca = (i, extra) =>
        fondos.some(
          (f) =>
            Math.abs(p[i] - f.color[0]) +
              Math.abs(p[i + 1] - f.color[1]) +
              Math.abs(p[i + 2] - f.color[2]) <
            f.margen + extra,
        );
      window.__modoFondo = `color exacto (${r0},${g0},${b0})` +
        (fondos.length > 1 ? ` + ${fondos.length - 1} mas` : '');
      return {
        esFondo: (i) => cerca(i, 0),
        esResiduo: (i) => cerca(i, margen * 0.7),
        // Para las BOLSAS encerradas se es mucho mas ancho. Un hueco entre dos
        // patas es casi todo halo del contorno: el JPG deja ahi un turquesa
        // bastante mas oscuro que el del borde de la lamina, y con la
        // tolerancia normal se quedaba puesto. Solo hace falta con fondo de
        // color saturado; en damero y en fondo por tono, esBolsa es esFondo.
        esBolsa: (i) => cerca(i, margen * 1.2),
      };
    }

    // Se mira TODO el borde, no solo las cuatro esquinas. Una hoja puede traer
    // dos fondos a la vez: el verde de la lamina y el verde mas oscuro del
    // marco de cada recuadro. Con una sola muestra, el recorte tomaba el marco
    // por fondo y dejaba dentro el verde de la lamina, o al reves.
    const muestras = [];
    const paso = Math.max(2, Math.round(Math.min(ancho, alto) / 14));
    for (let x = 1; x < ancho - 1; x += paso) muestras.push(en(x, 1), en(x, alto - 2));
    for (let y = 1; y < alto - 1; y += paso) muestras.push(en(1, y), en(ancho - 2, y));

    const conTono = muestras
      .map(([r, g, b]) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return { tono: tonoDe(r, g, b), sat: max === 0 ? 0 : (max - min) / max };
      })
      .filter((m) => m.sat >= 0.17 && m.tono >= 0);

    if (conTono.length >= muestras.length * 0.4) {
      // Se toma el tono de en medio y se descartan los que se salen: en un
      // recorte ajustado, parte del borde la ocupa el propio dibujo (un ala que
      // llega hasta la esquina) y esas muestras no son fondo. Con exigir que
      // TODAS las muestras fueran del mismo tono, esas poses se tomaban por
      // damero y el verde se quedaba pegado.
      const ordenados = conTono.map((m) => m.tono).sort((a, b) => a - b);
      const mediana = ordenados[Math.floor(ordenados.length / 2)];
      const cerca = ordenados.filter((t) => {
        const dif = Math.abs(t - mediana);
        return Math.min(dif, 360 - dif) < 40;
      });

      const desde = cerca.length ? cerca[0] : 0;
      const hasta = cerca.length ? cerca[cerca.length - 1] : 0;

      // la mayoria del borde tiene que ser de ese tono; si no, no hay fondo de
      // color que valga, es un dibujo que llega hasta el borde
      if (cerca.length >= conTono.length * 0.55 && cerca.length >= muestras.length * 0.3) {
        const margen = 16;
        const comoElFondo = (i, extra, satMinima) => {
          const r = p[i];
          const g = p[i + 1];
          const b = p[i + 2];
          const max = Math.max(r, g, b);
          if (max === 0) return false;
          if ((max - Math.min(r, g, b)) / max < satMinima) return false;
          const t = tonoDe(r, g, b);
          if (t < 0) return false;
          return t >= desde - margen - extra && t <= hasta + margen + extra;
        };
        window.__modoFondo = `liso tonos ${Math.round(desde)}-${Math.round(hasta)}`;
        return {
          esFondo: (i) => comoElFondo(i, 0, 0.17),
          esBolsa: (i) => comoElFondo(i, 0, 0.17),
          // mas ancho, para el halo que deja la compresion del JPG en el contorno
          esResiduo: (i) => comoElFondo(i, 14, 0.10),
        };
      }
    }

    // Damero gris y blanco, como hasta ahora.
    const tol = tolerancia || 24;
    const gris = (i, t, minimo) => {
      const r = p[i];
      const g = p[i + 1];
      const b = p[i + 2];
      return r > minimo && Math.abs(r - g) < t && Math.abs(g - b) < t && Math.abs(r - b) < t;
    };
    window.__modoFondo = 'damero';
    return {
      esFondo: (i) => gris(i, tol, 92),
      esBolsa: (i) => gris(i, tol, 92),
      esResiduo: (i) => gris(i, 26, 120),
    };
  };
});

const comoDatos = (ruta) => {
  const tipo = ruta.endsWith('.webp') ? 'webp' : ruta.endsWith('.png') ? 'png' : 'jpeg';
  return `data:image/${tipo};base64,${readFileSync(ruta).toString('base64')}`;
};

for (const personaje of aTrabajar) {
  // El lienzo es de 260 x 260 para casi todo. Los adornos grandes del fondo
  // piden uno mayor: se ven a mas de 250 px de ancho y, a densidad 3, eso son
  // 750 pixeles de verdad sacados de una textura de 254. De ahi que la chiva
  // se viera dentada y como lavada. El muneco guarda la misma proporcion del
  // lienzo (240 de 260), para que las medidas de ciudades.js sigan
  // significando lo mismo.
  const lienzo = personaje.lienzo ? personaje.lienzo : LIENZO;
  const altoMuneco = Math.round((lienzo.alto * ALTO_PERSONAJE) / LIENZO.alto);

  // Un lienzo grande pesa 700 KB en PNG. En webp, con transparencia y sin que
  // se note la diferencia, baja a la quinta parte.
  const salida = personaje.salida === 'webp' ? 'webp' : 'png';

  // Lo minimo que tiene que medir una bolsa de fondo encerrada para que se
  // borre. Ver el comentario de limpiarBolsas, mas abajo.
  const bolsaMinimaDeEste = personaje.bolsaMinima === undefined ? 120 : personaje.bolsaMinima;

  // CONTORNO va en pixeles del lienzo de 260, asi que en un lienzo mayor la
  // misma cifra se lee mas fina: hay que escalarla con el. Encima,
  // "contornoRelativo" adelgaza el trazo a proposito, que es lo que piden los
  // adornos del fondo: con la linea de delante se veian recortados a tijera.
  const relativo = personaje.contornoRelativo === undefined ? 1 : personaje.contornoRelativo;
  const contornoDeEste = personaje.contorno === undefined
    ? (CONTORNO * lienzo.alto * relativo) / LIENZO.alto
    : personaje.contorno;

  if (!existsSync(personaje.destino)) mkdirSync(personaje.destino, { recursive: true });

  // --- 1. reunir todas las poses del personaje, sueltas y de hojas ---
  const trabajos = [];

  for (const pose of personaje.poses || []) {
    const origen = `${personaje.origen}/${pose}.${personaje.extension || 'jpg'}`;
    if (!existsSync(origen)) {
      console.error(`  falta ${origen}`);
      continue;
    }
    // cada archivo es su propio grupo: el muneco esta dibujado a una escala
    // distinta en cada uno
    trabajos.push({ nombre: pose, origen: comoDatos(origen), zona: null, grupo: `suelta:${pose}` });
  }

  for (const hoja of personaje.hojas || []) {
    const origen = `${personaje.origen}/${hoja.archivo}.${hoja.extension || 'jpg'}`;
    if (!existsSync(origen)) {
      console.error(`  falta ${origen}`);
      continue;
    }
    const datos = comoDatos(origen);
    // Una hoja puede traer sus zonas escritas a mano cuando los dibujos se
    // tocan entre si y ningun detector los separa bien.
    const zonas = hoja.zonas
      ? hoja.zonas
      : hoja.porManchas
        ? await buscarPorManchas(
          pagina,
          datos,
          personaje.tolerancia,
          hoja.separacion,
          personaje.colorExacto,
          personaje.fondosExtra,
        )
        : await buscarPoses(
          pagina,
          datos,
          personaje.tolerancia,
          personaje.colorExacto,
          personaje.fondosExtra,
        );
    console.log(`  ${hoja.archivo}: encontradas ${zonas.length} poses`);
    for (let i = 0; i < zonas.length && i < hoja.nombres.length; i += 1) {
      trabajos.push({
        nombre: hoja.nombres[i],
        origen: datos,
        zona: zonas[i],
        // porPieza: cada dibujo se escala por su cuenta. Se usa con objetos
        // sueltos, donde no hay animacion que conservar.
        grupo: hoja.porPieza
          ? `pieza:${hoja.archivo}:${i}`
          : `hoja:${hoja.grupo || hoja.archivo}`,
        soloElCuerpo: hoja.soloElCuerpo || false,
      });
    }
  }

  // --- 2. medirlas y sacar un factor de escala POR ARCHIVO DE ORIGEN ---
  //
  // Dentro de una misma hoja, que una pose sea mas alta que otra es la
  // animacion: al correr el muneco se inclina, y eso hay que conservarlo. Asi
  // que las poses de una hoja comparten factor.
  //
  // Entre archivos distintos es al reves: el mismo muneco esta dibujado mas
  // grande en unos que en otros, y eso no es animacion, es el encuadre del
  // dibujante. Si se les da un factor comun, el personaje cambia de tamano al
  // pasar de estar quieto (imagen suelta) a correr (hoja). Por eso cada
  // archivo se normaliza por separado, hasta la misma altura de muneco.
  const medidas = [];
  for (const trabajo of trabajos) {
    const m = await medirPose(pagina, {
      origen: trabajo.origen,
      zona: trabajo.zona,
      tolerancia: personaje.tolerancia,
      altoPersonaje: altoMuneco,
      lienzoAncho: lienzo.ancho,
      lienzoAlto: lienzo.alto,
      colorExacto: personaje.colorExacto || false,
      fondosExtra: personaje.fondosExtra,
      limpiarBolsas: personaje.limpiarBolsas || false,
      bolsaMinima: bolsaMinimaDeEste,
    });
    medidas.push(m);
  }

  const grupos = new Map();
  trabajos.forEach((trabajo, i) => {
    const m = medidas[i];
    const g = grupos.get(trabajo.grupo) || {
      altoCuerpo: 0,
      altoTotal: 0,
      anchoTotal: 0,
    };
    g.altoCuerpo = Math.max(g.altoCuerpo, m.alto);
    g.altoTotal = Math.max(g.altoTotal, m.altoTotal || m.alto);
    g.anchoTotal = Math.max(g.anchoTotal, m.anchoTotal || m.ancho);
    grupos.set(trabajo.grupo, g);
  });

  // El muneco quiere medir ALTO_PERSONAJE, pero el dibujo entero (con su polvo
  // y sus rayas de movimiento) tiene que caber en el lienzo. Si a algun grupo
  // no le cabe, se rebaja la altura de TODOS: mas vale el muneco un poco mas
  // pequeno que unas poses mayores que otras.
  let altoObjetivo = altoMuneco;
  for (const g of grupos.values()) {
    const tope = Math.min(
      (lienzo.alto * 0.99) / g.altoTotal,
      (lienzo.ancho * 0.98) / g.anchoTotal,
    );
    altoObjetivo = Math.min(altoObjetivo, g.altoCuerpo * tope);
  }

  const factores = new Map();
  for (const [nombre, g] of grupos) factores.set(nombre, altoObjetivo / g.altoCuerpo);

  // --- 3. recortarlas con ese factor ---
  for (let i = 0; i < trabajos.length; i += 1) {
    const trabajo = trabajos[i];
    const resultado = await recortarPose(pagina, {
      origen: trabajo.origen,
      zona: trabajo.zona,
      tolerancia: personaje.tolerancia,
      altoPersonaje: altoMuneco,
      lienzoAncho: lienzo.ancho,
      lienzoAlto: lienzo.alto,
      factor: factores.get(trabajo.grupo),
      contorno: contornoDeEste,
      tinta: TINTA,
      colorExacto: personaje.colorExacto || false,
      fondosExtra: personaje.fondosExtra,
      limpiarBolsas: personaje.limpiarBolsas || false,
      bolsaMinima: bolsaMinimaDeEste,
      soloElCuerpo: trabajo.soloElCuerpo || false,
      formato: salida,
    });
    if (!resultado.url) continue;

    const contenido = Buffer.from(resultado.url.split(',')[1], 'base64');
    writeFileSync(`${personaje.destino}/${trabajo.nombre}.${salida}`, contenido);
    console.log(
      `  ${personaje.nombre}/${trabajo.nombre.padEnd(9)} ${(contenido.length / 1024).toFixed(0).padStart(3)} KB` +
        `  · ${resultado.recorte} · ${resultado.modo}`,
    );
  }
  const detalle = [...factores]
    .map(([nombre, f]) => `${nombre} x${f.toFixed(3)}`)
    .join(', ');
  console.log(`  (muneco de ${altoObjetivo.toFixed(0)} px · ${detalle})
`);
}

await navegador.close();

// ---------------------------------------------------------------------------

// Busca los dibujos sueltos dentro de una hoja. Quita el fondo, mira que filas
// y que columnas tienen algo, y de ahi saca los rectangulos. Descarta lo que sea
// demasiado bajo para ser un personaje: son las etiquetas escritas debajo.
async function buscarPoses(pagina, origen, tolerancia, colorExacto = false, fondosExtra = null) {
  return pagina.evaluate(async ({ origen, tolerancia, colorExacto, fondosExtra }) => {
    const imagen = new Image();
    imagen.src = origen;
    await imagen.decode();

    const ancho = imagen.naturalWidth;
    const alto = imagen.naturalHeight;
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imagen, 0, 0);

    const datos = ctx.getImageData(0, 0, ancho, alto);
    const p = datos.data;
    const { esFondo } = window.detectorDeFondo(p, ancho, alto, tolerancia, colorExacto, fondosExtra);

    const hay = new Uint8Array(ancho * alto);
    for (let i = 0; i < ancho * alto; i += 1) hay[i] = esFondo(i * 4) ? 0 : 1;

    const bandas = [];
    let desde = null;
    for (let y = 0; y <= alto; y += 1) {
      let ocupada = false;
      if (y < alto) {
        for (let x = 0; x < ancho; x += 1) {
          if (hay[y * ancho + x]) { ocupada = true; break; }
        }
      }
      if (ocupada && desde === null) desde = y;
      if (!ocupada && desde !== null) {
        if (y - desde > alto * 0.18) bandas.push({ y: desde, alto: y - desde });
        desde = null;
      }
    }

    const zonas = [];
    for (const banda of bandas) {
      let inicio = null;
      // Se pide un minimo de pixeles para dar una columna por ocupada: con un
      // solo pixel suelto, dos dibujos vecinos se quedaban pegados en uno.
      const minimoPixeles = Math.max(3, Math.round(banda.alto * 0.035));
      for (let x = 0; x <= ancho; x += 1) {
        let cuenta = 0;
        if (x < ancho) {
          for (let y = banda.y; y < banda.y + banda.alto; y += 1) {
            if (hay[y * ancho + x]) cuenta += 1;
          }
        }
        const ocupada = cuenta >= minimoPixeles;
        if (ocupada && inicio === null) inicio = x;
        if (!ocupada && inicio !== null) {
          const anchoIsla = x - inicio;
          if (anchoIsla > ancho * 0.06) {
            zonas.push({ x: inicio, y: banda.y, ancho: anchoIsla, alto: banda.alto });
          }
          inicio = null;
        }
      }
    }
    return zonas;
  }, { origen, tolerancia, colorExacto, fondosExtra });
}

// Busca los dibujos de una hoja por MANCHAS, no por filas y columnas.
//
// El metodo de bandas funciona cuando los dibujos estan en una rejilla limpia,
// pero se atraganta cuando llevan estrellitas, lineas de movimiento o polvo,
// que rellenan los huecos entre uno y otro. Aqui se buscan las manchas de
// tinta, se juntan las que estan cerca (una estrellita pertenece a su paloma) y
// cada grupo resultante es un dibujo.
async function buscarPorManchas(pagina, origen, tolerancia, separacion = 34, colorExacto = false, fondosExtra = null) {
  return pagina.evaluate(
    async ({ origen, tolerancia, separacion, colorExacto, fondosExtra }) => {
      const imagen = new Image();
      imagen.src = origen;
      await imagen.decode();

      const ancho = imagen.naturalWidth;
      const alto = imagen.naturalHeight;
      const lienzo = document.createElement('canvas');
      lienzo.width = ancho;
      lienzo.height = alto;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imagen, 0, 0);

      const p = ctx.getImageData(0, 0, ancho, alto).data;
      const { esFondo } = window.detectorDeFondo(p, ancho, alto, tolerancia, colorExacto, fondosExtra);

      // 1. las manchas, por vecindad de 4
      const visto = new Uint8Array(ancho * alto);
      const manchas = [];
      for (let y0 = 0; y0 < alto; y0 += 1) {
        for (let x0 = 0; x0 < ancho; x0 += 1) {
          const raiz = y0 * ancho + x0;
          if (visto[raiz] || esFondo(raiz * 4)) continue;
          let n = 0;
          let x1 = x0;
          let x2 = x0;
          let y1 = y0;
          let y2 = y0;
          const pila = [raiz];
          visto[raiz] = 1;
          while (pila.length) {
            const idx = pila.pop();
            const x = idx % ancho;
            const y = (idx - x) / ancho;
            n += 1;
            if (x < x1) x1 = x;
            if (x > x2) x2 = x;
            if (y < y1) y1 = y;
            if (y > y2) y2 = y;
            const vecinos = [idx + 1, idx - 1, idx + ancho, idx - ancho];
            for (let k = 0; k < 4; k += 1) {
              const v = vecinos[k];
              if (v < 0 || v >= ancho * alto || visto[v]) continue;
              if (k < 2 && Math.floor(v / ancho) !== y) continue;
              if (esFondo(v * 4)) continue;
              visto[v] = 1;
              pila.push(v);
            }
          }
          // el polvillo de la compresion no cuenta
          if (n > 60) manchas.push({ x1, y1, x2, y2, n });
        }
      }

      // 2. se juntan las que casi se tocan
      const cerca = (a, b) =>
        a.x1 - separacion < b.x2 &&
        b.x1 - separacion < a.x2 &&
        a.y1 - separacion < b.y2 &&
        b.y1 - separacion < a.y2;

      let grupos = manchas.map((m) => ({ ...m }));
      let cambio = true;
      while (cambio) {
        cambio = false;
        for (let i = 0; i < grupos.length && !cambio; i += 1) {
          for (let j = i + 1; j < grupos.length; j += 1) {
            if (!cerca(grupos[i], grupos[j])) continue;
            grupos[i] = {
              x1: Math.min(grupos[i].x1, grupos[j].x1),
              y1: Math.min(grupos[i].y1, grupos[j].y1),
              x2: Math.max(grupos[i].x2, grupos[j].x2),
              y2: Math.max(grupos[i].y2, grupos[j].y2),
              n: grupos[i].n + grupos[j].n,
            };
            grupos.splice(j, 1);
            cambio = true;
            break;
          }
        }
      }

      // 3. fuera los restos y en orden de lectura
      const minimo = alto * 0.06;
      grupos = grupos.filter((g) => g.y2 - g.y1 > minimo && g.x2 - g.x1 > minimo);
      grupos.sort((a, b) => {
        const filaA = Math.round(a.y1 / (alto / 6));
        const filaB = Math.round(b.y1 / (alto / 6));
        return filaA === filaB ? a.x1 - b.x1 : filaA - filaB;
      });

      return grupos.map((g) => ({
        x: g.x1,
        y: g.y1,
        ancho: g.x2 - g.x1 + 1,
        alto: g.y2 - g.y1 + 1,
      }));
    },
    { origen, tolerancia, separacion, colorExacto, fondosExtra },
  );
}

// Mide una pose sin escribirla: sirve para calcular el factor comun.
async function medirPose(pagina, opciones) {
  return recortarPose(pagina, { ...opciones, soloMedir: true });
}

async function recortarPose(pagina, opciones) {
  return pagina.evaluate(
      async ({
        origen,
        zona,
        altoPersonaje,
        lienzoAncho,
        lienzoAlto,
        factor,
        soloMedir,
        tolerancia,
        contorno,
        tinta,
        colorExacto,
        fondosExtra,
        limpiarBolsas,
        bolsaMinima,
        soloElCuerpo,
        formato,
      }) => {
        const imagen = new Image();
        imagen.src = origen;
        await imagen.decode();

        // Si viene de una hoja, se recorta primero la celda que toca; si no,
        // se trabaja con la imagen entera.
        let origenX = 0;
        let origenY = 0;
        let ancho = imagen.naturalWidth;
        let alto = imagen.naturalHeight;

        if (zona) {
          origenX = zona.x;
          origenY = zona.y;
          ancho = zona.ancho;
          alto = zona.alto;
        }

        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(imagen, origenX, origenY, ancho, alto, 0, 0, ancho, alto);

        // --- quitar el damero del fondo, entrando desde los bordes ---
        const datos = ctx.getImageData(0, 0, ancho, alto);
        const p = datos.data;
        const visto = new Uint8Array(ancho * alto);
        const { esFondo, esResiduo, esBolsa } = window.detectorDeFondo(p, ancho, alto, tolerancia, colorExacto, fondosExtra);

        const pila = [];
        for (let x = 0; x < ancho; x += 1) pila.push([x, 0], [x, alto - 1]);
        for (let y = 0; y < alto; y += 1) pila.push([0, y], [ancho - 1, y]);

        while (pila.length) {
          const [x, y] = pila.pop();
          if (x < 0 || y < 0 || x >= ancho || y >= alto) continue;
          const idx = y * ancho + x;
          if (visto[idx]) continue;
          const i = idx * 4;
          if (!esFondo(i)) continue;
          visto[idx] = 1;
          p[i + 3] = 0;
          pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        // El relleno entra DESDE LOS BORDES, asi que las bolsas de fondo que
        // quedan encerradas dentro del dibujo (entre las hojas de una palmera,
        // detras de la baranda de un balcon, bajo el alero de un porche) se
        // salvan y quedan de turquesa en mitad del recorte.
        //
        // Quitarlas es barrer la lamina entera por color, y eso NO se puede
        // hacer siempre: en la hoja de adornos las hojas de las palmeras son
        // del mismo verde que el fondo y se las comeria. Por eso va por sabana:
        // solo lo piden los dibujos que vienen sobre un turquesa que no aparece
        // en ninguna parte del dibujo.
        if (limpiarBolsas) {
          // Se buscan las BOLSAS: manchas de pixeles con pinta de fondo que han
          // quedado encerradas. No vale borrar por color a secas toda la lamina
          // (un dibujo puede tener puntos del color del fondo aqui y alla), ni
          // vale mirar manchas de pixeles opacos, porque la bolsa y el dibujo se
          // tocan y salen como una sola.
          //
          // Y se pide un tamano minimo: asi se va el damero que quedaba entre
          // los postes de un letrero y se quedan los brillitos blancos de un
          // dibujo, que son cuatro pixeles. Se puede bajar por hoja
          // (`bolsaMinima`) cuando el dibujo no tenga NADA del color del fondo:
          // en la vaca, sobre turquesa, las bolsas entre las patas son de unos
          // 60 pixeles y con el minimo de casa se quedaban puestas.
          const cuantos = ancho * alto;
          const mirado = new Uint8Array(cuantos);
          const minimo = Math.max(bolsaMinima, Math.round(cuantos * 0.0002));
          for (let inicio = 0; inicio < cuantos; inicio += 1) {
            if (mirado[inicio] || p[inicio * 4 + 3] === 0 || !esBolsa(inicio * 4)) continue;
            const bolsa = [];
            const pendientes = [inicio];
            mirado[inicio] = 1;
            while (pendientes.length) {
              const idx = pendientes.pop();
              bolsa.push(idx);
              const x = idx % ancho;
              const vecinos = [idx + 1, idx - 1, idx + ancho, idx - ancho];
              for (let k = 0; k < 4; k += 1) {
                const v = vecinos[k];
                if (v < 0 || v >= cuantos || mirado[v]) continue;
                if (k === 0 && x === ancho - 1) continue;
                if (k === 1 && x === 0) continue;
                if (p[v * 4 + 3] === 0 || !esBolsa(v * 4)) continue;
                mirado[v] = 1;
                pendientes.push(v);
              }
            }
            if (bolsa.length >= minimo) {
              bolsa.forEach((idx) => {
                p[idx * 4 + 3] = 0;
              });
            }
          }
        }

        // Con la tolerancia apretada quedan restos del damero pegados al
        // contorno (la compresion del JPG tine un poco esos bordes). Se limpian
        // con unas pasadas suaves: un pixel grisaceo con vecinos transparentes
        // era fondo, no dibujo.
        const transparente = (x, y) => {
          if (x < 0 || y < 0 || x >= ancho || y >= alto) return true;
          return p[(y * ancho + x) * 4 + 3] === 0;
        };
        for (let pasada = 0; pasada < 3; pasada += 1) {
          const quitar = [];
          for (let y = 0; y < alto; y += 1) {
            for (let x = 0; x < ancho; x += 1) {
              const i = (y * ancho + x) * 4;
              if (p[i + 3] === 0) continue;
              if (!esResiduo(i)) continue;
              const vecinos =
                Number(transparente(x + 1, y)) +
                Number(transparente(x - 1, y)) +
                Number(transparente(x, y + 1)) +
                Number(transparente(x, y - 1));
              if (vecinos >= 2) quitar.push(i);
            }
          }
          if (!quitar.length) break;
          quitar.forEach((i) => {
            p[i + 3] = 0;
          });
        }

        ctx.putImageData(datos, 0, 0);

        // --- recortar a lo que ocupa el personaje ---
        let minX = ancho;
        let minY = alto;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < alto; y += 1) {
          for (let x = 0; x < ancho; x += 1) {
            if (p[(y * ancho + x) * 4 + 3] > 24) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        const anchoUtil = maxX - minX + 1;
        const altoUtil = maxY - minY + 1;

        // una celda vacia (las hojas no siempre estan completas)
        if (anchoUtil < 20 || altoUtil < 20) return { url: null, recorte: 'vacia' };

        // Ni para medir ni para colocar vale el recuadro entero: incluye el
        // polvo, las rayas de movimiento y la sombra, que cambian de una pose a
        // otra. Lo que interesa es el cuerpo, que es la mancha conectada mas
        // grande del dibujo.
        const mancha = (() => {
          const visitado = new Uint8Array(ancho * alto);
          let mejor = null;
          for (let y0 = 0; y0 < alto; y0 += 1) {
            for (let x0 = 0; x0 < ancho; x0 += 1) {
              const raiz = y0 * ancho + x0;
              if (visitado[raiz] || p[raiz * 4 + 3] <= 24) continue;
              let cuenta = 0;
              let bx1 = x0;
              let bx2 = x0;
              let by1 = y0;
              let by2 = y0;
              const pila = [raiz];
              visitado[raiz] = 1;
              while (pila.length) {
                const idx = pila.pop();
                const x = idx % ancho;
                const y = (idx - x) / ancho;
                cuenta += 1;
                if (x < bx1) bx1 = x;
                if (x > bx2) bx2 = x;
                if (y < by1) by1 = y;
                if (y > by2) by2 = y;
                const vecinos = [idx + 1, idx - 1, idx + ancho, idx - ancho];
                for (let k = 0; k < 4; k += 1) {
                  const v = vecinos[k];
                  if (v < 0 || v >= ancho * alto || visitado[v]) continue;
                  // no saltar de una fila a otra por los lados
                  if (k < 2 && Math.floor(v / ancho) !== y) continue;
                  if (p[v * 4 + 3] <= 24) continue;
                  visitado[v] = 1;
                  pila.push(v);
                }
              }
              if (!mejor || cuenta > mejor.cuenta) {
                mejor = { cuenta, ancho: bx2 - bx1 + 1, alto: by2 - by1 + 1, pie: by2 };
              }
            }
          }
          return mejor;
        })();

        if (soloMedir) {
          return {
            url: null,
            ancho: mancha ? mancha.ancho : anchoUtil,
            alto: mancha ? mancha.alto : altoUtil,
            anchoTotal: anchoUtil,
            altoTotal: altoUtil,
          };
        }

        // --- todas las poses con el MISMO factor, apoyadas abajo ---
        const salida = document.createElement('canvas');
        salida.width = lienzoAncho;
        salida.height = lienzoAlto;
        const sctx = salida.getContext('2d');
        sctx.imageSmoothingQuality = 'high';

        const escala = factor || altoPersonaje / altoUtil;
        const destinoAncho = anchoUtil * escala;
        const destinoAlto = altoUtil * escala;

        // Se apoya el CUERPO en la linea de suelo del lienzo. Alinear por el
        // borde de abajo del dibujo dejaba al bicho flotando en las poses que
        // llevan sombra o salpicadura debajo de los pies.
        const pieDelCuerpo = mancha ? (mancha.pie - minY + 1) * escala : destinoAlto;
        const arriba = lienzoAlto - 6 - pieDelCuerpo;

        const izquierda = (lienzoAncho - destinoAncho) / 2;
        sctx.drawImage(
          lienzo,
          minX,
          minY,
          anchoUtil,
          altoUtil,
          izquierda,
          arriba,
          destinoAncho,
          destinoAlto,
        );

        // Fuera la pelusa del recorte y contorno de tinta por todo el
        // borde, que es lo que le da el aire de dibujo animado antiguo. Va al
        // final y sobre el recorte ya limpio: si se hiciera sobre el original,
        // el contorno rodearia tambien la basura que luego se quita.
        window.quitarMotas(salida);
        // En las hojas donde los dibujos se solapan, el recorte de uno arrastra
        // un trozo del vecino: se deja solo lo que este pegado al cuerpo.
        if (soloElCuerpo) window.dejarSoloElCuerpo(salida);
        const conTinta = window.ponerContorno(salida, contorno, tinta);

        return {
          url: conTinta.toDataURL(formato === 'webp' ? 'image/webp' : 'image/png', 0.92),
          modo: window.__modoFondo,
          recorte: `${anchoUtil}x${altoUtil}`,
          ancho: anchoUtil,
          alto: altoUtil,
        };
      },
    opciones,
  );
}
