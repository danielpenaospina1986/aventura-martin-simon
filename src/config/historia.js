// ---------------------------------------------------------------------------
// LOS TEXTOS DEL JUEGO
//
// Todos en un solo sitio, para poder cambiarles una coma sin abrir una sola
// escena.
//
// El tono es de travesura, nunca de miedo. Los jefes son guardianes del bano,
// comicos, y cuando pierden los empapados son ellos. Ganar es terminar la
// partida sin banarse.
//
// **No hay hilo de historia.** Se quitaron las vinetas de apertura y las de
// despedida: lo unico que se cuenta es la resena de cada ciudad, que es lo que
// mas adelante llevara su ilustracion de entrada. Las cinco no son decorado:
// son las ciudades de Martin y Simon, en el orden en que las vivieron.
// ---------------------------------------------------------------------------

// La resena que sale antes de cada tablero: la ciudad y por que importa.
export const CIUDADES = {
  'space-coast': {
    titulo: 'Space Coast',
    frase: 'Aquí nacieron los dos.\nEntre cohetes y playa, el sitio donde todo empezó.',
  },
  medellin: {
    titulo: 'Medellín',
    frase: 'La ciudad de sus papás.\nAquí se criaron hasta los cinco y los seis años.',
  },
  atlanta: {
    titulo: 'Atlanta',
    frase: 'Donde viven ahora.\nSe saben cada esquina… y cada escondite.',
  },
  miami: {
    titulo: 'Miami',
    frase: 'Las vacaciones de siempre,\ny la casa de la tía.',
  },
  cartagena: {
    titulo: 'Cartagena',
    frase: 'El paseo que no se les olvida.\nY donde los espera quien ustedes ya saben.',
  },

  orlando: {
    titulo: 'Orlando',
    frase: 'El viaje de los parques.\nAquí manda el Tío Camilo.',
  },
  'lake-lanier': {
    titulo: 'Lake Lanier',
    frase: 'El lago de los fines de semana.\nY la parrilla de Chad.',
  },
  finca: {
    titulo: 'La finca',
    frase: 'El Refugio: los abuelos, el lago y la vaca.\nY el abuelo, con la camioneta lista.',
  },
};

// Lo que dice cada guardian del bano al empezar la pelea y al perderla.
//
// Va por CIUDAD, no por clase de jefe. Es comodo para escribir el cuento —se
// lee entero desde aqui— pero tiene su trampa: al mudar un jefe de ciudad hay
// que mudar tambien su entrada, o la ciudad acaba enseñando el dibujo de uno
// con el nombre y las frases de otro.
export const JEFES = {
  'space-coast': {
    nombre: 'Simón Malvado',
    saludo: '—¡Yo también sé jugar sucio!',
    derrota: '—¡Me desarmaron! ¡No vale!',
  },
  medellin: {
    nombre: 'Papá Inodoro',
    saludo: '—¡NO TAPES EL BAÑO, BERRIONDO!',
    derrota: '—¡ME VOY POR EL SIFÓN, CARAJO!',
  },
  atlanta: {
    nombre: 'Doña Zully',
    saludo: '—Hasta aquí llegaron, mis amores. ¡A la tina!',
    derrota: '—Está bien, está bien… váyanse.',
  },
  miami: {
    nombre: 'Martín Malvado',
    saludo: '—¡Yo ya me bañé! ¡Ahora les toca a ustedes!',
    derrota: '—¡Se me salió todo el relleno!',
  },
  cartagena: {
    nombre: 'Jean Luke',
    saludo: '—¡De aquí no pasa nadie, mocosos!',
    derrota: '—¡Buaaa! ¡Le voy a decir a mi mamá!',
  },
  orlando: {
    nombre: 'el Tío Camilo',
    saludo: '—¡Nadie se sube a nada sin bañarse!',
    derrota: '—Bueno, bueno… montémonos sucios.',
  },
  'lake-lanier': {
    nombre: 'Chad',
    saludo: '—¡Panqueques para todos! ¡Y después, al agua!',
    derrota: '—¡Se me quemaron los panqueques!',
  },
  finca: {
    nombre: 'el Abuelo',
    saludo: '—¡Súbanse, que los llevo… derechito a la ducha!',
    derrota: '—¡Me varé, y enterrado en fruta!',
  },
};

// Lo que el juego dice cuando pasan cosas. Las reglas no cambian, solo como se
// cuentan: un golpe es mojarse, quedarse sin corazones es que te banaron.
export const AVISOS = {
  mojado: '¡Splash!',
  sinCorazones: '¡Te bañaron!',
  finDePartida: '¡A la bañera!',
  finDePartidaPie: 'Te agarraron… hasta la próxima fuga.',
  metaAbierta: '¡La salida está libre!',
  checkpoint: '¡Escondite seguro!',
  // La vaca que persiguió a Martín en la finca de los abuelos, y que por poco
  // se lo lleva por delante. Ahora se la encuentran por todos los tableros.
  vaca: '¡CUIDADO CON LA BERRIONDA VACA!',
};

export function ciudadDelCuento(nombre) {
  return CIUDADES[nombre] || null;
}

export function jefeDelCuento(nombre) {
  return JEFES[nombre] || null;
}

export default { CIUDADES, JEFES, AVISOS };
