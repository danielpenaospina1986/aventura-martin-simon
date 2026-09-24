// ---------------------------------------------------------------------------
// LA HISTORIA: "La gran fuga del bano"
//
// Todos los textos del cuento en un solo sitio, para poder cambiarles una coma
// sin abrir una sola escena.
//
// El tono es de travesura, nunca de miedo. Los jefes son guardianes del bano,
// comicos, y cuando pierden los empapados son ellos. Ganar es terminar la
// partida sin banarse.
//
// Las cinco ciudades no son decorado: son las ciudades de Martin y Simon, en el
// orden en que las vivieron.
// ---------------------------------------------------------------------------

// Las cuatro vinetas del principio, al empezar partida nueva.
export const INTRO = [
  'Era jueves por la tarde y en la casa pasó lo peor que puede pasar:\nmamá abrió la llave de la bañera.',
  '—¡Samaón! ¡Martaín! ¡A bañarse! —gritó desde el baño.\nEl agua ya echaba espuma.',
  'Los dos se miraron. No hizo falta decir nada:\nsalieron por la puerta como dos cohetes.',
  'Cinco ciudades por delante y una sola regla:\nllegar hasta el final SIN BAÑARSE.',
];

// La tarjeta que sale antes de cada tablero: la ciudad y por que importa.
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
};

// Lo que dice cada guardian del bano al empezar la pelea y al perderla.
//
// Se escriben los cinco de una vez aunque los jefes se hagan de uno en uno: son
// texto, y asi el cuento se lee entero desde aqui.
export const JEFES = {
  'space-coast': {
    nombre: 'el Astronauta Burbuja',
    saludo: '—Houston, tenemos dos niños sucios.',
    derrota: '—¡Me voy… a la órbita del enjuague!',
  },
  medellin: {
    nombre: 'el Carrotanque',
    saludo: '—¡Agua fría a domicilio, pues!',
    derrota: '—¡Me varé… y con flores encima!',
  },
  atlanta: {
    nombre: 'Doña Zully',
    saludo: '—Hasta aquí llegaron, mis amores. ¡A la tina!',
    derrota: '—Está bien, está bien… váyanse.',
  },
  miami: {
    nombre: 'el Salvavidas',
    saludo: '—¡Al agua, patos! Aquí nadie entra sucio.',
    derrota: '—¡Me resbalé con mi propio bloqueador!',
  },
  cartagena: {
    nombre: 'el Capitán Tapón',
    saludo: '—¡Al abordaje, grumetes! Aquí se baña hasta el loro.',
    derrota: '—¡Me quitaron el tapón! ¡Se me va el agua!',
  },
};

// El final, despues de Cartagena.
export const FINAL = [
  'Cinco ciudades, cinco guardianes del baño\ny ni una gota encima.',
  'Doña Zully los miró, se rió y bajó la manguera.\n—Váyanse… por hoy.',
  'Samaón y Martaín salieron corriendo.\nMañana será otro día. Y mañana… habrá otro baño.',
];

// Lo que el juego dice cuando pasan cosas. Las reglas no cambian, solo como se
// cuentan: un golpe es mojarse, quedarse sin corazones es que te banaron.
export const AVISOS = {
  mojado: '¡Splash!',
  sinCorazones: '¡Te bañaron!',
  finDePartida: '¡A la bañera!',
  finDePartidaPie: 'Te agarraron… hasta la próxima fuga.',
  metaAbierta: '¡La salida está libre!',
  checkpoint: '¡Escondite seguro!',
};

export function ciudadDelCuento(nombre) {
  return CIUDADES[nombre] || null;
}

export function jefeDelCuento(nombre) {
  return JEFES[nombre] || null;
}

export default { INTRO, CIUDADES, JEFES, FINAL, AVISOS };
