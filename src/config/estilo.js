// ---------------------------------------------------------------------------
// ESTILO VISUAL
// Paleta, tipografias y claves de textura, todo en un solo sitio.
// Cuando pasemos a pixel art, basta con cambiar src/sistemas/dibujo.js para que
// cargue imagenes con estas mismas claves: el resto del juego no se entera.
// ---------------------------------------------------------------------------

// Paleta de dibujo animado de los anos 30: tinta negra gruesa, cremas, sepias
// y un rojo y un dorado apagados. Nada de colores de pantalla.
export const TINTA = 0x1b1410;

export const COLORES = {
  tinta: TINTA,
  crema: 0xf3e3c3,
  cremaOscura: 0xd9c19a,
  sepia: 0x8a6b4f,
  sepiaOscuro: 0x5c4531,
  rojoViejo: 0xc0392b,
  doradoViejo: 0xd8b24a,

  cieloArriba: 0x4aa8e0,
  cieloAbajo: 0x9fd9f6,
  montana: 0x6f8fb0,
  montanaLejos: 0x8fabc6,
  nube: 0xffffff,

  tierra: 0x8a5a33,
  tierraOscura: 0x6d4527,
  abismo: 0x241a14,
  hierba: 0x4caf50,
  hierbaOscura: 0x3b8c3f,

  plataforma: 0xd9b57e,
  plataformaBorde: 0x8a6b4f,

  bloque: 0xe0b060,
  bloqueBorde: 0x9c7430,

  moneda: 0xffd54a,
  monedaBorde: 0xe0a316,

  // el sushi de Martin
  sushiAlga: 0x2e3b2f,
  sushiArroz: 0xfaf4e6,
  sushiRelleno: 0xf2735a,
  sushiRellenoClaro: 0xf9a68f,

  // el bloque de armar de Simon
  bloqueArmar: 0xe23b3b,
  bloqueArmarClaro: 0xf4655f,
  bloqueArmarOscuro: 0xa8221f,

  enemigo: 0x9b7bb5,
  enemigoOscuro: 0x6b5184,
  enemigoOjo: 0xffffff,

  jefe: 0x8e5fa8,
  jefeOscuro: 0x5a3a6e,
  jefeCuerno: 0xf4d03f,
  jefeVida: 0xe74c3c,
  jefeVidaVacia: 0x3d5a7a,

  banderaApagada: 0x9aa7b4,
  banderaEncendida: 0x38c172,
  mastil: 0xd8dee6,
  meta: 0xf4d03f,

  estrella: 0xfff59d,
  katana: 0xffffff,

  // primer plano: casi silueta, con el marron de tinta de la paleta
  frenteOscuro: 0x2b211c,
  frenteHoja: 0x4a3b2c,

  // el Astronauta Burbuja
  trajeClaro: 0xf2efe6,
  trajeSombra: 0xcfc8b8,
  aguaJabon: 0x9fd8ef,
  espuma: 0xffffff,
  patico: 0xf2c33c,
  visor: 0x2d4a63,

  sombrillaTela: 0xd96b5e,
  sombrillaTela2: 0xf2e3c8,
  sombrillaPalo: 0x8d7850,
  jabonCuerpo: 0xeddf9c,
  jabonBrillo: 0xfaf3d2,

  // Medellin: el Carrotanque y los materos de los balcones
  carroCabina: 0xe8e2d2,
  carroTanque: 0x3f8f5a,
  carroTanqueClaro: 0x59b076,
  carroRueda: 0x2f2a26,
  carroLlanta: 0xcfc8b8,
  carroCristal: 0x9fd8ef,
  materoBarro: 0xb96a45,
  materoBarroClaro: 0xd18a63,
  materoTierra: 0x5c4531,
  florAmarilla: 0xf2c33c,
  florRoja: 0xd9534f,
  florBlanca: 0xf7f1e1,
  florHoja: 0x3f8f5a,

  // Miami: el Salvavidas, su torre y sus flotadores
  salvavidasPiel: 0xe0a86b,
  salvavidasBanador: 0xe23b6d,
  salvavidasCamiseta: 0xf7f1e1,
  salvavidasGafas: 0x2d4a63,
  flotadorAro: 0xf25c54,
  flotadorAro2: 0xf7f1e1,
  torreMadera: 0xd9b57e,
  torreTecho: 0x7fc4c0,

  // El toro, el bicho intermedio
  toroCuerpo: 0x5b4034,
  toroLomo: 0x3d2a22,
  toroCuerno: 0xf2e3c8,
  toroHocico: 0xc99a86,
  toroFuria: 0xe0603f,

  // Cartagena: el Capitan Tapon
  capitanCasaca: 0x7a4a7f,
  capitanCasacaClara: 0x9c6aa1,
  capitanCamisa: 0xf7f1e1,
  capitanSombrero: 0x2f2a26,
  capitanPiel: 0xe8c9a0,
  taponCuerpo: 0x2f2a26,
  taponBrillo: 0x6b6259,
  cadena: 0xcfc8b8,

  corazon: 0xd94f4f,
  corazonBrillo: 0xf0857f,
  corazonApagado: 0x5a4a4a,
  vidaExtra: 0xe8c65a,

  textoClaro: '#ffffff',
  textoSuave: '#d7e3f0',
  textoOscuro: '#16202c',
  textoAcento: '#ffd54a',
  panel: 0x1b1410,
  panelBorde: 0xc9a227,

  // paleta art deco de las cajas de dialogo
  decoFondo: 0x1b1410,
  decoMarco: 0xd8b24a,
  decoMarcoOscuro: 0x8a6b1d,
  decoCrema: 0xf3e3c3,
};

// La tipografia del juego. Se carga en sistemas/fuente.js antes de dibujar
// nada; si fallase, se cae a una de sistema con parecido aire.
export const NOMBRE_FUENTE = 'JuegoDeco';

export const FUENTE = {
  familia: `"${NOMBRE_FUENTE}", "Trebuchet MS", "Segoe UI", sans-serif`,
  titulo: 36,
  subtitulo: 18,
  opcion: 19,
  hud: 15,
  pista: 12,
};

// Claves de textura. Un solo lugar donde se nombran los graficos.
export const TEXTURAS = {
  suelo: 'tex-suelo',
  tierra: 'tex-tierra',
  plataforma: 'tex-plataforma',
  // el plano medio cambia de pavimento segun la ciudad
  sueloDe: (ciudad) => `tex-suelo-${ciudad}`,
  tierraDe: (ciudad) => `tex-tierra-${ciudad}`,
  plataformaDe: (ciudad) => `tex-plataforma-${ciudad}`,
  bloque: 'tex-bloque',
  moneda: 'tex-moneda',
  monedaMartin: 'tex-sushi',
  monedaSimon: 'tex-bloque-armar',
  // dibujos de verdad, que sustituyen a los hechos por codigo
  sushi: 'tex-sushi-png',
  lego: 'tex-lego',
  banderaCo: 'tex-bandera-co',
  banderaUs: 'tex-bandera-us',
  puerta: 'tex-puerta',
  corazon: 'tex-corazon',
  corazonVacio: 'tex-corazon-vacio',
  vidaExtra: 'tex-vida-extra',
  enemigo: 'tex-enemigo',
  baneraQuieta: 'tex-banera-quieta',
  baneraAnda1: 'tex-banera-anda1',
  baneraAnda2: 'tex-banera-anda2',
  baneraCarga: 'tex-banera-carga',
  baneraLanza: 'tex-banera-lanza',
  agua: 'tex-agua',
  palomaVuela1: 'tex-paloma-vuela1',
  palomaVuela2: 'tex-paloma-vuela2',
  palomaVuela3: 'tex-paloma-vuela3',
  palomaVuela4: 'tex-paloma-vuela4',
  palomaSuelta: 'tex-paloma-suelta',
  // cuando le dan: aturdida, tres de caida y tumbada en el suelo
  palomaMareada: 'tex-paloma-mareada',
  palomaCae1: 'tex-paloma-cae1',
  palomaCae2: 'tex-paloma-cae2',
  palomaCae3: 'tex-paloma-cae3',
  palomaSuelo: 'tex-paloma-suelo',
  caida: 'tex-caida',
  jefe: 'tex-jefe',
  jefeEnfadado: 'tex-jefe-enfadado',
  // Space Coast: el Astronauta Burbuja
  // Atlanta: Dona Zully y su arena
  zullyQuieta: 'tex-zully-quieta',
  zullyMirada: 'tex-zully-mirada',
  zullyEmpapada: 'tex-zully-empapada',
  zullyVictoria: 'tex-zully-victoria',
  zullyChorro: 'tex-zully-chorro',
  zullyBoquilla: 'tex-zully-boquilla',
  sombrilla: 'tex-sombrilla',
  jabon: 'tex-jabon',

  jefeAstronauta: 'tex-jefe-astronauta',
  jefeAstronautaAtascado: 'tex-jefe-astronauta-atascado',
  jefeAstronautaMareado: 'tex-jefe-astronauta-mareado',
  jefeCarrotanque: 'tex-jefe-carrotanque',
  jefeCarrotanqueEmbiste: 'tex-jefe-carrotanque-embiste',
  jefeCarrotanqueFlorido: 'tex-jefe-carrotanque-florido',
  matero: 'tex-matero',
  jefeSalvavidas: 'tex-jefe-salvavidas',
  jefeSalvavidasTira: 'tex-jefe-salvavidas-tira',
  jefeSalvavidasResbala: 'tex-jefe-salvavidas-resbala',
  torreVigia: 'tex-torre-vigia',
  flotador: 'tex-flotador',
  jefeCapitan: 'tex-jefe-capitan',
  jefeCapitanEspalda: 'tex-jefe-capitan-espalda',
  jefeCapitanSinTapon: 'tex-jefe-capitan-sin-tapon',
  balaEspuma: 'tex-bala-espuma',
  toro: 'tex-toro',
  toroEmbiste: 'tex-toro-embiste',
  checkpointApagado: 'tex-checkpoint-apagado',
  checkpointEncendido: 'tex-checkpoint-encendido',
  meta: 'tex-meta',
  estrella: 'tex-estrella',
  arcoKatana: 'tex-arco-katana',
  nube: 'tex-nube',
  // primer plano: siluetas que cruzan por delante de todo
  // adornos de primer plano dibujados a mano, por ciudad
  frentePalmera: 'tex-frente-palmera',
  frenteAlien: 'tex-frente-alien',
  frenteAstronauta: 'tex-frente-astronauta',
  frenteChiva: 'tex-frente-chiva',
  frenteFrijoles: 'tex-frente-frijoles',
  frentePalmeraAlta: 'tex-frente-palmera-alta',
  frenteGuayacan: 'tex-frente-guayacan',
  frenteGuayacanFondo: 'tex-frente-guayacan-fondo',
  frenteCasa: 'tex-frente-casa',
  frenteGato: 'tex-frente-gato',

  frenteRama: 'tex-frente-rama',
  frenteFarol: 'tex-frente-farol',
  frenteMata: 'tex-frente-mata',
  fondo: 'tex-fondo',
  portada: 'tex-portada',
  portadaMenu: 'tex-portada-menu',
  // un fondo por ciudad; la clave se arma con el nombre del nivel
  fondoDe: (ciudad) => `tex-fondo-${ciudad}`,
  caraMartin: 'tex-cara-martin',
  caraSimon: 'tex-cara-simon',
  martin: 'tex-martin',
  martinQuieto: 'tex-martin-quieto',
  martinCorre1: 'tex-martin-corre1',
  martinCorre2: 'tex-martin-corre2',
  martinCorre3: 'tex-martin-corre3',
  martinCorre4: 'tex-martin-corre4',
  martinAtaque1: 'tex-martin-ataque1',
  martinAtaque2: 'tex-martin-ataque2',
  martinGolpe: 'tex-martin-golpe',
  martinVictoria: 'tex-martin-victoria',
  simon: 'tex-simon',
  simonQuieto: 'tex-simon-quieto',
  simonCorre1: 'tex-simon-corre1',
  simonCorre2: 'tex-simon-corre2',
  simonCorre3: 'tex-simon-corre3',
  simonCorre4: 'tex-simon-corre4',
  simonCorre5: 'tex-simon-corre5',
  simonLanza: 'tex-simon-lanza',
  simonGolpe: 'tex-simon-golpe',
  simonVictoria: 'tex-simon-victoria',
};

// Fondo ilustrado (src/assets/fondo-barrio.jpg).
// El velo lo apaga un poco para que el personaje, las monedas y los enemigos
// se sigan viendo bien: el dibujo tiene mucho detalle.
// Los tres planos de la camara multiplanar, de lejos a cerca. Lo que los
// separa es a que velocidad pasan por delante de la camara: el fondo casi no se
// mueve (esta a kilometros), el mundo se mueve con la camara y el primer plano
// va mas rapido que ella, que es lo que lo pega a la cara.
export const PLANOS = {
  // FONDO: la ilustracion de la ciudad, ya desenfocada. Sin velo: se distingue
  // por estar lejos, no por estar apagada.
  fondo: {
    velocidad: 0.16,     // 1 seria moverse con la camara
    ampliacionMaxima: 2, // cuanto se puede agrandar para cubrir el recorrido
    bajada: 0.18,        // se baja un poco, que abajo lo tapa el terreno
  },
  // DETRAS DEL MUNDO: decorado grande que pasa por detras del nino y del
  // suelo. Mas lejos que el mundo, mas cerca que la ilustracion de fondo.
  detras: {
    // Sin transparencia: va por DETRAS del nino y del suelo, asi que no hay
    // nada que despejar. Bajarle la opacidad solo lo dejaba desvaido.
    alpha: 1,
    velocidad: 0.72,
    profundidad: -20,
    // Donde apoyan: en la linea por donde camina el nino, subida un 10%. Los de
    // delante nacen del borde de abajo de la pantalla porque estan MAS CERCA
    // que el suelo, pero estos estan mas LEJOS: naciendo de abajo, el suelo se
    // les comia el tercio inferior y solo asomaban las copas.
    apoyo: 0.9,
  },
  // PRIMER PLANO: ramas, postes y matas que cruzan por delante de todo.
  frente: {
    velocidad: 1.45,
    profundidad: 60,
    alpha: 0.9,
  },
};

export const FONDO = {
  velo: 0xffffff,
  // Solo queda para los menus, donde hay mucho texto encima.
  veloMenus: 0.18,
  veloArriba: 0.2,
  veloAbajo: 0.58,
  sobreancho: 1.2,
  parallaxMaximo: 0.06,
};

export function estiloTexto(tamano, color = COLORES.textoClaro, extra = {}) {
  return {
    fontFamily: FUENTE.familia,
    fontSize: `${tamano}px`,
    color,
    ...extra,
  };
}
