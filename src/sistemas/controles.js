// ---------------------------------------------------------------------------
// CONTROLES
// Mapeo de teclas por PERFIL de jugador. Para anadir un segundo jugador
// simultaneo mas adelante basta con anadir un perfil aqui y crear otro jugador
// con ese perfil: ningun otro archivo cambia.
//
// Importante: no basta con mirar si la tecla esta pulsada una vez por
// fotograma. Un nino puede dar un toque tan corto que empiece y termine entre
// dos fotogramas, y ese toque se perderia. Por eso escuchamos los eventos de
// cada tecla y guardamos lo ocurrido desde el fotograma anterior.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';

export const PERFILES = {
  jugador1: {
    izquierda: ['LEFT', 'A'],
    derecha: ['RIGHT', 'D'],
    saltar: ['UP', 'W', 'SPACE'],
    habilidad: ['X', 'F'],
  },
  // Preparado para el futuro modo de dos jugadores en el mismo teclado:
  // jugador2: {
  //   izquierda: ['J'], derecha: ['L'], saltar: ['I'], habilidad: ['U'],
  // },
};

const ACCIONES = ['izquierda', 'derecha', 'saltar', 'habilidad'];

const aCero = () => ({ izquierda: false, derecha: false, saltar: false, habilidad: false });

export class Controles {
  constructor(escena, perfil = PERFILES.jugador1) {
    this.escena = escena;
    this.teclas = {};
    this.suscripciones = [];

    // lo que ha pasado desde el ultimo fotograma
    this.pulsacionPendiente = aCero();
    this.sueltaPendiente = aCero();

    // lo que tiene apretado el dedo en los mandos tactiles
    this.tactil = aCero();

    // lo que ve el juego
    this.estado = aCero();
    this.previo = aCero();
    this.pulsada = aCero();
    this.soltada = aCero();

    ACCIONES.forEach((accion) => {
      this.teclas[accion] = (perfil[accion] || []).map((nombre) => {
        const tecla = escena.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes[nombre],
          true,
          false,
        );
        const alPulsar = () => {
          this.pulsacionPendiente[accion] = true;
        };
        const alSoltar = () => {
          this.sueltaPendiente[accion] = true;
        };
        tecla.on('down', alPulsar);
        tecla.on('up', alSoltar);
        this.suscripciones.push({ tecla, alPulsar, alSoltar });
        return tecla;
      });
    });
  }

  // Se llama una sola vez por fotograma, al principio del update de la escena.
  actualizar() {
    this.previo = { ...this.estado };

    ACCIONES.forEach((accion) => {
      const mantenida =
        this.tactil[accion] || this.teclas[accion].some((tecla) => tecla.isDown);
      const huboPulsacion = this.pulsacionPendiente[accion];
      const huboSuelta = this.sueltaPendiente[accion];

      // un toque cortisimo cuenta como pulsada durante este fotograma
      this.estado[accion] = mantenida || huboPulsacion;
      this.pulsada[accion] = huboPulsacion || (this.estado[accion] && !this.previo[accion]);
      this.soltada[accion] = huboSuelta || (!this.estado[accion] && this.previo[accion]);

      this.pulsacionPendiente[accion] = false;
      this.sueltaPendiente[accion] = false;
    });
  }

  // Por aqui entran los mandos tactiles. Apuntan lo mismo que una tecla, asi
  // que al juego le da igual de donde venga: un mando de verdad o un segundo
  // jugador se anadirian igual.
  tocar(accion, apretado) {
    if (this.tactil[accion] === apretado) return;
    this.tactil[accion] = apretado;
    if (apretado) this.pulsacionPendiente[accion] = true;
    else this.sueltaPendiente[accion] = true;
  }

  activa(accion) {
    return this.estado[accion];
  }

  recienPulsada(accion) {
    return this.pulsada[accion];
  }

  recienSoltada(accion) {
    return this.soltada[accion];
  }

  // -1 izquierda, 1 derecha, 0 quieto
  get direccion() {
    return (this.estado.derecha ? 1 : 0) - (this.estado.izquierda ? 1 : 0);
  }

  destruir() {
    this.suscripciones.forEach(({ tecla, alPulsar, alSoltar }) => {
      tecla.off('down', alPulsar);
      tecla.off('up', alSoltar);
      this.escena.input.keyboard.removeKey(tecla);
    });
    this.suscripciones = [];
  }
}
