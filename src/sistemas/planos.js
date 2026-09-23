// ---------------------------------------------------------------------------
// LOS PLANOS DE LA CAMARA (camara multiplanar)
//
// La tecnica de los dibujos animados de los anos 30: el decorado se pinta en
// varias laminas separadas y la camara las mueve a distinta velocidad. Lo que
// esta cerca pasa deprisa, lo que esta lejos casi no se mueve, y de ahi sale la
// sensacion de profundidad.
//
// En el juego son tres:
//
//   FONDO      la ilustracion de la ciudad, desenfocada. Va muy despacio.
//              Lo monta pintarFondo(), en dibujo.js.
//   MEDIO      el mundo donde se juega: suelo, plataformas, bichos, premios.
//              Va con la camara, a velocidad 1.
//   FRENTE     lo que pasa pegado a la camara: ramas, postes, matas. Va MAS
//              rapido que la camara, que es lo que lo acerca.
//
// Esta pieza se ocupa del de frente. Los adornos son provisionales y los mismos
// en las cinco ciudades; la idea es que cada una acabe con los suyos, y para eso
// el nivel solo tiene que traer su propia lista en `frente`.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { PLANOS, TEXTURAS } from '../config/estilo.js';

// Los adornos de serie, mientras cada ciudad no traiga los suyos.
//
//   textura  cual se dibuja
//   desde    de que borde cuelga: 'arriba' o 'abajo'
//   ancho    lo que mide en pantalla; el alto sale solo, sin deformar
//   cada     cada cuantos pixeles aparece uno
//   desfase  donde empieza la serie, para que no salgan todos alineados
//   alpha    lo tapado que va; los de abajo cruzan por delante del nino
//
// Los de abajo van mas claros y mas separados a proposito: asoman por encima
// del suelo para dar profundidad, pero por ahi es por donde se camina y si van
// opacos y seguidos, esconden al nino.
const PROVISIONALES = [
  { textura: TEXTURAS.frenteRama, desde: 'arriba', ancho: 230, cada: 560, desfase: 40 },
  { textura: TEXTURAS.frenteFarol, desde: 'arriba', ancho: 80, cada: 920, desfase: 430 },
  { textura: TEXTURAS.frenteMata, desde: 'abajo', ancho: 210, cada: 880, desfase: 540, alpha: 0.72 },
];

// Monta el plano de delante y devuelve el grupo, por si hay que apagarlo.
export function montarPrimerPlano(escena, ancho, alto, anchoMundo, adornos) {
  const lista = adornos && adornos.length ? adornos : PROVISIONALES;
  const velocidad = PLANOS.frente.velocidad;

  // Al ir mas rapido que la camara, estos adornos recorren mas mundo del que
  // hay: si se repartieran solo a lo largo del nivel, la ultima parte se
  // quedaria pelada. El rango se estira en la misma proporcion.
  const recorrido = Math.max(0, anchoMundo - ancho);
  const hasta = ancho + recorrido * velocidad;

  const piezas = escena.add.group();

  lista.forEach((adorno) => {
    if (!escena.textures.exists(adorno.textura)) return;
    const fuente = escena.textures.get(adorno.textura).getSourceImage();
    const escala = adorno.ancho / fuente.width;
    const altoEnPantalla = fuente.height * escala;

    for (let x = adorno.desfase; x < hasta; x += adorno.cada) {
      // un poco de vaiven, para que no parezca una valla
      const meneo = Math.sin(x * 0.017) * adorno.cada * 0.16;
      const arriba = adorno.desde === 'arriba';

      const pieza = escena.add
        .image(x + meneo, arriba ? -6 : alto + 6, adorno.textura)
        .setOrigin(0.5, arriba ? 0 : 1)
        .setScale(escala)
        .setAlpha(adorno.alpha ?? PLANOS.frente.alpha)
        .setScrollFactor(velocidad, 0)
        .setDepth(PLANOS.frente.profundidad);

      // los de abajo se hunden un poco, para que no se vea donde apoyan
      if (!arriba) pieza.setY(alto + Math.min(14, altoEnPantalla * 0.12));

      piezas.add(pieza);
    }
  });

  return piezas;
}

export default montarPrimerPlano;
