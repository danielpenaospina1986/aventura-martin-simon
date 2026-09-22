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
  titulo: 54,
  subtitulo: 26,
  opcion: 28,
  hud: 22,
  pista: 16,
};

// Claves de textura. Un solo lugar donde se nombran los graficos.
export const TEXTURAS = {
  suelo: 'tex-suelo',
  tierra: 'tex-tierra',
  plataforma: 'tex-plataforma',
  bloque: 'tex-bloque',
  moneda: 'tex-moneda',
  monedaMartin: 'tex-sushi',
  monedaSimon: 'tex-bloque-armar',
  enemigo: 'tex-enemigo',
  jefe: 'tex-jefe',
  jefeEnfadado: 'tex-jefe-enfadado',
  checkpointApagado: 'tex-checkpoint-apagado',
  checkpointEncendido: 'tex-checkpoint-encendido',
  meta: 'tex-meta',
  estrella: 'tex-estrella',
  arcoKatana: 'tex-arco-katana',
  nube: 'tex-nube',
  fondo: 'tex-fondo',
  caraMartin: 'tex-cara-martin',
  caraSimon: 'tex-cara-simon',
  martin: 'tex-martin',
  simon: 'tex-simon',
};

// Fondo ilustrado (src/assets/fondo-barrio.jpg).
// El velo lo apaga un poco para que el personaje, las monedas y los enemigos
// se sigan viendo bien: el dibujo tiene mucho detalle.
export const FONDO = {
  velo: 0xffffff,
  // El velo va en degradado: suave arriba (para que se vea el cielo y el
  // metrocable) y mas fuerte abajo, que es donde se juega.
  veloArriba: 0.2,
  veloAbajo: 0.58,
  // En los menus hay mucho texto: se calma un poco mas el fondo.
  veloMenus: 0.18,
  sobreancho: 1.2,      // se dibuja mas grande que la pantalla, para el parallax
  parallaxMaximo: 0.06, // cuanto se mueve con la camara, como mucho
};

export function estiloTexto(tamano, color = COLORES.textoClaro, extra = {}) {
  return {
    fontFamily: FUENTE.familia,
    fontSize: `${tamano}px`,
    color,
    ...extra,
  };
}
