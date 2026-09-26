// ---------------------------------------------------------------------------
// LOS MANDOS TACTILES
//
// Para poder jugar en un telefono. Cuatro botones y uno de pausa:
//
//   abajo a la izquierda   ANDAR a la izquierda y a la derecha
//   abajo a la derecha     SALTAR (el grande) y ATACAR (el de la estrella)
//   arriba en medio        PAUSA, que en un telefono no hay tecla Esc
//
// Se busca que estorben lo menos posible: son pequenos, translucidos, y el area
// que responde es mas ancha que el circulo dibujado, asi que se puede fallar el
// dibujo sin fallar el boton.
//
// Antes habia un joystick, pero se comia un cuarto de la pantalla para hacer lo
// que hacen dos botones: en este juego solo se anda a izquierda y derecha.
//
// No son un mando aparte: lo que hacen es apretarle a `Controles` las mismas
// acciones que las teclas (`tocar`), asi que el juego no se entera de por donde
// le llegan. Un segundo jugador, un mando de verdad o lo que venga se anaden
// igual, sin tocar al Jugador.
//
// Se dibujan con figuras (circulos, triangulos, estrellas), no con texturas:
// son vectores, asi que salen nitidos a cualquier densidad y no hay que
// generarles nada.
//
// Ojo con tres cosas:
//
//   - Van SUJETOS A LA PANTALLA, como el HUD, y eso aqui se hace a mano con
//     `Planos`: `setScrollFactor` no se lleva con el zoom de la camara.
//   - Las coordenadas del dedo (`pointer.x`) vienen en pixeles del lienzo, que
//     es la pantalla del juego multiplicada por la densidad. Hay que dividir
//     por ella para pensar en la pantalla del juego.
//   - Los de la derecha se colocan CONTRA EL BORDE DERECHO, no en una x fija:
//     en un telefono la pantalla del juego es mas ancha de 640.
// ---------------------------------------------------------------------------

import { esTactil, MUNDO, RENDER, TACTIL } from '../config/ajustes.js';
import { COLORES } from '../config/estilo.js';

// Si el aparato se maneja con el dedo. Vive en ajustes.js porque de eso depende
// tambien el ancho de la pantalla, y ajustes no puede importar de aqui sin que
// los dos se hagan un nudo.
export { esTactil as hayTactil };

// El mismo aviso, dicho para el mando que se este usando. En un telefono no hay
// Enter, ni Esc, ni flechas, y decirle al nino que las pulse solo despista.
export function segunElMando(conTeclado, conDedo) {
  return esTactil() ? conDedo : conTeclado;
}

// Donde cae cada boton en la pantalla del juego. Los de la derecha se miden
// contra el borde derecho, que es lo que los deja en su sitio aunque la
// pantalla sea mas ancha de 640.
export function sitiosDeLosBotones(ancho = MUNDO.ancho) {
  const { margen, separacion, alto, radio, radioSalto, radioAtaque } = TACTIL;
  return [
    { nombre: 'izquierda', accion: 'izquierda', figura: 'izquierda', x: margen, y: alto, radio },
    {
      nombre: 'derecha',
      accion: 'derecha',
      figura: 'derecha',
      x: margen + separacion,
      y: alto,
      radio,
    },
    {
      nombre: 'ataque',
      accion: 'habilidad',
      figura: 'estrella',
      x: ancho - margen - TACTIL.ataqueDentro,
      y: alto - TACTIL.ataqueArriba,
      radio: radioAtaque,
    },
    {
      nombre: 'salto',
      accion: 'saltar',
      figura: 'arriba',
      x: ancho - margen,
      y: alto,
      radio: radioSalto,
    },
    {
      nombre: 'pausa',
      accion: null,
      figura: 'pausa',
      x: ancho / 2,
      y: TACTIL.pausa.y,
      radio: TACTIL.pausa.radio,
    },
  ];
}

export class MandosTactiles {
  constructor(escena, controles, opciones = {}) {
    this.escena = escena;
    this.controles = controles;
    this.alPausar = opciones.alPausar || null;

    // Con un solo puntero no se puede correr y saltar a la vez, que es la mitad
    // del juego. Se piden varios: los dos pulgares y alguno de mas.
    escena.input.addPointer(3);

    this.piezas = [];
    this.botones = [];

    sitiosDeLosBotones(MUNDO.ancho).forEach((sitio) => {
      if (sitio.nombre === 'pausa' && !this.alPausar) return;
      this.montarBoton(sitio);
    });

    this.escuchar();
  }

  // --- dibujo ---------------------------------------------------------------

  anadir(objeto) {
    objeto.setDepth(TACTIL.profundidad).setAlpha(TACTIL.alpha);
    this.piezas.push(objeto);
    return objeto;
  }

  // Un boton es su circulo y el dibujito de dentro. Los dos se encienden a la
  // vez, asi que viajan juntos.
  montarBoton(sitio) {
    const { x, y, radio, figura } = sitio;
    const circulo = this.anadir(
      this.escena.add
        .circle(x, y, radio, COLORES.decoFondo)
        .setStrokeStyle(4, COLORES.decoMarco, 0.95),
    );

    const dentro = [];
    const r = radio * 0.46;
    if (figura === 'arriba') {
      dentro.push(this.escena.add.triangle(x, y, 0, r, r, -r, r * 2, r, COLORES.decoMarco));
    } else if (figura === 'izquierda') {
      dentro.push(this.escena.add.triangle(x, y, 0, r, r * 2, 0, r * 2, r * 2, COLORES.decoMarco));
    } else if (figura === 'derecha') {
      dentro.push(this.escena.add.triangle(x, y, 0, 0, r * 2, r, 0, r * 2, COLORES.decoMarco));
    } else if (figura === 'estrella') {
      dentro.push(this.escena.add.star(x, y, 4, radio * 0.22, radio * 0.58, COLORES.decoMarco));
    } else {
      // pausa: las dos barritas de siempre
      const b = radio * 0.24;
      dentro.push(this.escena.add.rectangle(x - b, y, b * 0.8, radio, COLORES.decoMarco));
      dentro.push(this.escena.add.rectangle(x + b, y, b * 0.8, radio, COLORES.decoMarco));
    }
    dentro.forEach((pieza) => this.anadir(pieza));

    const boton = { ...sitio, circulo, dentro, dedo: null };
    this.botones.push(boton);
    return boton;
  }

  encender(boton, encendido) {
    const alpha = encendido ? TACTIL.alphaPulsado : TACTIL.alpha;
    boton.circulo.setAlpha(alpha);
    boton.dentro.forEach((pieza) => pieza.setAlpha(alpha));
    boton.circulo.setScale(encendido ? 0.92 : 1);
  }

  // --- el dedo --------------------------------------------------------------

  // De pixeles del lienzo a la pantalla en la que piensa el juego.
  enPantalla(puntero) {
    const d = RENDER.densidad || 1;
    return { x: puntero.x / d, y: puntero.y / d };
  }

  botonBajoElDedo(punto) {
    return this.botones.find((boton) => {
      const dx = punto.x - boton.x;
      const dy = punto.y - boton.y;
      // el area que responde es mas ancha que el circulo: los dedos son gordos
      const r = boton.radio * TACTIL.margenBoton;
      return dx * dx + dy * dy <= r * r;
    });
  }

  apretar(boton, dedo) {
    boton.dedo = dedo;
    this.encender(boton, true);
    if (boton.accion) this.controles.tocar(boton.accion, true);
    else if (this.alPausar) this.alPausar();
  }

  soltar(boton) {
    boton.dedo = null;
    this.encender(boton, false);
    if (boton.accion) this.controles.tocar(boton.accion, false);
  }

  escuchar() {
    this.alBajar = (puntero) => {
      const boton = this.botonBajoElDedo(this.enPantalla(puntero));
      if (boton && boton.dedo === null) this.apretar(boton, puntero.id);
    };

    // Arrastrar el pulgar de un boton al de al lado cambia de boton. Sin esto,
    // pasar de andar a la izquierda a andar a la derecha obligaba a levantar el
    // dedo, y los ninos no lo levantan: lo deslizan.
    this.alMover = (puntero) => {
      const mio = this.botones.find((b) => b.dedo === puntero.id);
      const ahora = this.botonBajoElDedo(this.enPantalla(puntero));
      if (mio === ahora) return;
      if (mio) this.soltar(mio);
      // el de pausa no se dispara al arrastrar: se toca a proposito o nada
      if (ahora && ahora.dedo === null && ahora.accion) this.apretar(ahora, puntero.id);
    };

    this.alSubir = (puntero) => {
      const boton = this.botones.find((b) => b.dedo === puntero.id);
      if (boton) this.soltar(boton);
    };

    this.alSalir = () => this.soltarTodo();

    const entrada = this.escena.input;
    entrada.on('pointerdown', this.alBajar);
    entrada.on('pointermove', this.alMover);
    entrada.on('pointerup', this.alSubir);
    entrada.on('pointerupoutside', this.alSubir);
    // si el dedo se sale del lienzo, se sueltan todos: si no, el nino se queda
    // corriendo solo hacia un lado
    entrada.on('gameout', this.alSalir);
  }

  soltarTodo() {
    this.botones.forEach((boton) => boton.dedo !== null && this.soltar(boton));
  }

  destruir() {
    const entrada = this.escena.input;
    if (entrada) {
      entrada.off('pointerdown', this.alBajar);
      entrada.off('pointermove', this.alMover);
      entrada.off('pointerup', this.alSubir);
      entrada.off('pointerupoutside', this.alSubir);
      entrada.off('gameout', this.alSalir);
    }
    this.piezas.forEach((pieza) => pieza.destroy());
    this.piezas = [];
    this.botones = [];
  }
}

export default MandosTactiles;
