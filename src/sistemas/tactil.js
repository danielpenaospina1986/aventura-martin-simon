// ---------------------------------------------------------------------------
// LOS MANDOS TACTILES
//
// Para poder jugar en un telefono: un joystick abajo a la izquierda, y abajo a
// la derecha los botones de SALTAR y ATACAR. Arriba en medio, uno pequeno de
// pausa, que en un telefono no hay tecla Esc y si no no habria forma de salir
// del tablero.
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
// Ojo con dos cosas:
//
//   - Van SUJETOS A LA PANTALLA, como el HUD, y eso aqui se hace a mano con
//     `Planos`: `setScrollFactor` no se lleva con el zoom de la camara.
//   - Las coordenadas del dedo (`pointer.x`) vienen en pixeles del lienzo, que
//     es la pantalla del juego multiplicada por la densidad. Hay que dividir
//     por ella para pensar en los 640 x 360 de siempre.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { RENDER, TACTIL } from '../config/ajustes.js';
import { COLORES } from '../config/estilo.js';

// Si el aparato se maneja con el dedo. Se puede forzar desde la barra de
// direcciones con ?tactil=1 (para probarlo en el ordenador) o apagar con
// ?tactil=0.
export function hayTactil() {
  if (typeof window === 'undefined') return false;
  const pedido = new URLSearchParams(window.location.search).get('tactil');
  if (pedido === '1') return true;
  if (pedido === '0') return false;
  const dedo = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return Boolean(dedo || navigator.maxTouchPoints > 0);
}

export class MandosTactiles {
  constructor(escena, controles, opciones = {}) {
    this.escena = escena;
    this.controles = controles;
    this.alPausar = opciones.alPausar || null;

    // Con un solo puntero no se puede correr y saltar a la vez, que es la mitad
    // del juego. Se piden tres: la palanca y los dos botones.
    escena.input.addPointer(3);

    this.piezas = [];
    this.botones = [];
    this.dedoDeLaPalanca = null;

    this.montarJoystick();
    this.botonSaltar = this.montarBoton(TACTIL.salto, 'saltar', 'triangulo');
    this.botonAtacar = this.montarBoton(TACTIL.ataque, 'habilidad', 'estrella');
    if (this.alPausar) this.botonPausa = this.montarBoton(TACTIL.pausa, null, 'pausa');

    this.escuchar();
  }

  // --- dibujo ---------------------------------------------------------------

  anadir(objeto) {
    objeto.setDepth(TACTIL.profundidad).setAlpha(TACTIL.alpha);
    this.piezas.push(objeto);
    return objeto;
  }

  montarJoystick() {
    const { x, y, radio, palanca } = TACTIL.joystick;
    this.base = this.anadir(
      this.escena.add.circle(x, y, radio, COLORES.decoFondo)
        .setStrokeStyle(4, COLORES.decoMarco, 0.95),
    );
    this.palanca = this.anadir(
      this.escena.add.circle(x, y, palanca, COLORES.decoMarco)
        .setStrokeStyle(3, COLORES.decoMarcoOscuro, 0.95),
    );
  }

  // Un boton es su circulo y el dibujito de dentro. Los dos se encienden a la
  // vez, asi que viajan juntos.
  montarBoton(sitio, accion, figura) {
    const { x, y, radio } = sitio;
    const circulo = this.anadir(
      this.escena.add.circle(x, y, radio, COLORES.decoFondo)
        .setStrokeStyle(4, COLORES.decoMarco, 0.95),
    );

    const dentro = [];
    if (figura === 'triangulo') {
      const r = radio * 0.5;
      dentro.push(
        this.escena.add.triangle(x, y, 0, r, r, -r, r * 2, r, COLORES.decoMarco).setOrigin(0.5),
      );
    } else if (figura === 'estrella') {
      dentro.push(this.escena.add.star(x, y, 4, radio * 0.22, radio * 0.58, COLORES.decoMarco));
    } else {
      // pausa: las dos barritas de siempre
      const b = radio * 0.22;
      dentro.push(this.escena.add.rectangle(x - b, y, b * 0.8, radio, COLORES.decoMarco));
      dentro.push(this.escena.add.rectangle(x + b, y, b * 0.8, radio, COLORES.decoMarco));
    }
    dentro.forEach((pieza) => this.anadir(pieza));

    const boton = { sitio, accion, circulo, dentro, dedo: null };
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

  // De pixeles del lienzo a los 640 x 360 en los que piensa el juego.
  enPantalla(puntero) {
    const d = RENDER.densidad || 1;
    return { x: puntero.x / d, y: puntero.y / d };
  }

  botonBajoElDedo(punto) {
    return this.botones.find((boton) => {
      const dx = punto.x - boton.sitio.x;
      const dy = punto.y - boton.sitio.y;
      // el area que responde es mas ancha que el circulo: los dedos son gordos
      const r = boton.sitio.radio * TACTIL.margenBoton;
      return dx * dx + dy * dy <= r * r;
    });
  }

  escuchar() {
    this.alBajar = (puntero) => {
      const punto = this.enPantalla(puntero);
      const boton = this.botonBajoElDedo(punto);
      if (boton) {
        boton.dedo = puntero.id;
        this.encender(boton, true);
        if (boton.accion) this.controles.tocar(boton.accion, true);
        else if (this.alPausar) this.alPausar();
        return;
      }
      // La palanca coge cualquier dedo que baje en su mitad de la pantalla, no
      // solo el que acierte el circulo: en un telefono no se mira, se tantea.
      if (this.dedoDeLaPalanca === null && punto.x < TACTIL.mitadDeLaPalanca) {
        this.dedoDeLaPalanca = puntero.id;
        this.moverPalanca(punto);
      }
    };

    this.alMover = (puntero) => {
      if (puntero.id !== this.dedoDeLaPalanca) return;
      this.moverPalanca(this.enPantalla(puntero));
    };

    this.alSubir = (puntero) => {
      const boton = this.botones.find((b) => b.dedo === puntero.id);
      if (boton) {
        boton.dedo = null;
        this.encender(boton, false);
        if (boton.accion) this.controles.tocar(boton.accion, false);
      }
      if (puntero.id === this.dedoDeLaPalanca) this.soltarPalanca();
    };

    const entrada = this.escena.input;
    entrada.on('pointerdown', this.alBajar);
    entrada.on('pointermove', this.alMover);
    entrada.on('pointerup', this.alSubir);
    entrada.on('pointerupoutside', this.alSubir);
    // si el dedo se sale del lienzo, se sueltan todos: si no, el nino se queda
    // corriendo solo hacia un lado
    entrada.on('gameout', () => this.soltarTodo());
  }

  moverPalanca(punto) {
    const { x, y, recorrido, zonaMuerta } = TACTIL.joystick;
    const dx = Phaser.Math.Clamp(punto.x - x, -recorrido, recorrido);
    const dy = Phaser.Math.Clamp(punto.y - y, -recorrido, recorrido);
    this.palanca.setPosition(x + dx, y + dy);
    this.palanca.setAlpha(TACTIL.alphaPulsado);
    this.base.setAlpha(TACTIL.alphaPulsado);

    this.controles.tocar('izquierda', dx < -zonaMuerta);
    this.controles.tocar('derecha', dx > zonaMuerta);
    // Arriba tambien salta, como la flecha del teclado. Es de mas, porque para
    // eso esta su boton, pero quien no lo encuentre no se queda sin saltar.
    this.controles.tocar('saltar', dy < -recorrido * TACTIL.saltoArriba);
  }

  soltarPalanca() {
    const { x, y } = TACTIL.joystick;
    this.dedoDeLaPalanca = null;
    this.palanca.setPosition(x, y);
    this.palanca.setAlpha(TACTIL.alpha);
    this.base.setAlpha(TACTIL.alpha);
    this.controles.tocar('izquierda', false);
    this.controles.tocar('derecha', false);
    this.controles.tocar('saltar', false);
  }

  soltarTodo() {
    this.soltarPalanca();
    this.botones.forEach((boton) => {
      if (boton.dedo === null) return;
      boton.dedo = null;
      this.encender(boton, false);
      if (boton.accion) this.controles.tocar(boton.accion, false);
    });
  }

  destruir() {
    const entrada = this.escena.input;
    if (entrada) {
      entrada.off('pointerdown', this.alBajar);
      entrada.off('pointermove', this.alMover);
      entrada.off('pointerup', this.alSubir);
      entrada.off('pointerupoutside', this.alSubir);
    }
    this.piezas.forEach((pieza) => pieza.destroy());
    this.piezas = [];
    this.botones = [];
  }
}

export default MandosTactiles;
