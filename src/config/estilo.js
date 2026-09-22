// ---------------------------------------------------------------------------
// ESTILO VISUAL
// Paleta, tipografias y claves de textura, todo en un solo sitio.
// Cuando pasemos a pixel art, basta con cambiar src/sistemas/dibujo.js para que
// cargue imagenes con estas mismas claves: el resto del juego no se entera.
// ---------------------------------------------------------------------------

export const COLORES = {
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

  plataforma: 0xc98f4e,
  plataformaBorde: 0x8a5a33,

  bloque: 0xe0b060,
  bloqueBorde: 0x9c7430,

  moneda: 0xffd54a,
  monedaBorde: 0xe0a316,

  enemigo: 0x8e44ad,
  enemigoOscuro: 0x5e2d75,
  enemigoOjo: 0xffffff,

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
  panel: 0x16202c,
  panelBorde: 0x3d5a7a,
};

export const FUENTE = {
  familia: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
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
  enemigo: 'tex-enemigo',
  checkpointApagado: 'tex-checkpoint-apagado',
  checkpointEncendido: 'tex-checkpoint-encendido',
  meta: 'tex-meta',
  estrella: 'tex-estrella',
  arcoKatana: 'tex-arco-katana',
  nube: 'tex-nube',
  fondo: 'tex-fondo',
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
