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

import { MUNDO } from '../config/ajustes.js';
import { PLANOS, TEXTURAS } from '../config/estilo.js';

// ---------------------------------------------------------------------------
// EL REPARTIDOR DE PLANOS
//
// Cada plano se mueve a su velocidad respecto a la camara. Phaser trae eso
// hecho con scrollFactor, pero scrollFactor y el zoom de la camara no se llevan
// bien: con zoom, todo lo que no va a velocidad 1 acaba descolocado. Asi que se
// mueve a mano, que ademas se lee mejor.
//
// Si un objeto tiene que quedarse quieto en pantalla (el HUD), su velocidad es
// 0; si va con el mundo, 1; si pasa por delante, mas de 1.
// ---------------------------------------------------------------------------

export class Planos {
  constructor() {
    this.capas = [];
  }

  // Apunta un objeto (o varios) para moverlo a esta velocidad.
  anadir(objetos, velocidad) {
    const lista = Array.isArray(objetos) ? objetos : [objetos];
    lista.forEach((objeto) => {
      if (!objeto) return;
      this.capas.push({ objeto, velocidad, base: objeto.x });
    });
    return this;
  }

  // Lo que se queda clavado en pantalla: el HUD, los avisos.
  fijar(objetos) {
    return this.anadir(objetos, 0);
  }

  // Se le pasa la camara, no su scrollX: con zoom, scrollX es un numero
  // interno que no dice donde empieza lo que se ve. Lo que vale es la esquina
  // izquierda de lo visible, en coordenadas del mundo.
  actualizar(camara) {
    const zoom = camara.zoom || 1;
    const izquierda = camara.scrollX + (camara.width * (1 - 1 / zoom)) / 2;

    for (const capa of this.capas) {
      if (!capa.objeto.active && capa.objeto.active !== undefined) continue;
      // en pantalla tiene que verse en -scrollX * velocidad, y como se dibuja
      // en (x - scrollX), la x que le toca es esta
      capa.objeto.x = capa.base + izquierda * (1 - capa.velocidad);
    }
  }
}

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
export function montarPrimerPlano(escena, ancho, alto, anchoMundo, adornos, planos) {
  const lista = adornos && adornos.length ? adornos : PROVISIONALES;
  const velocidad = PLANOS.frente.velocidad;

  // Al ir mas rapido que la camara, estos adornos recorren mas mundo del que
  // hay: si se repartieran solo a lo largo del nivel, la ultima parte se
  // quedaria pelada. El rango se estira en la misma proporcion.
  const recorrido = Math.max(0, anchoMundo - ancho);
  const hasta = ancho + recorrido * velocidad;

  const piezas = [];

  lista.forEach((adorno) => {
    if (!escena.textures.exists(adorno.textura)) return;
    const fuente = escena.textures.get(adorno.textura).getSourceImage();
    // se puede pedir por alto (lo normal, que es lo que se compara con el nino)
    // o por ancho; lo otro sale solo, sin deformar el dibujo
    const escala = adorno.alto
      ? adorno.alto / fuente.height
      : adorno.ancho / fuente.width;
    const altoEnPantalla = fuente.height * escala;

    for (let x = adorno.desfase; x < hasta; x += adorno.cada) {
      // un poco de vaiven, para que no parezca una valla
      const meneo = Math.sin(x * 0.017) * adorno.cada * 0.16;
      const arriba = adorno.desde === 'arriba';

      // Los de abajo se apoyan en la LINEA DE SUELO, que es donde camina el
      // nino, y no en el borde de la pantalla: asi se leen como cosas que estan
      // ahi mismo, delante de el, en vez de asomar por el canto de abajo.
      const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
      const pieza = escena.add
        .image(x + meneo, arriba ? -6 : suelo, adorno.textura)
        .setOrigin(0.5, arriba ? 0 : 1)
        .setScale(escala)
        .setAlpha(adorno.alpha ?? PLANOS.frente.alpha)
        .setDepth(PLANOS.frente.profundidad);
      if (planos) planos.anadir(pieza, velocidad);

      // se hunden un pelin, para que no se vea la linea donde apoyan
      if (!arriba) pieza.setY(suelo + Math.min(10, altoEnPantalla * 0.06));

      piezas.push(pieza);
    }
  });

  return piezas;
}

export default montarPrimerPlano;
