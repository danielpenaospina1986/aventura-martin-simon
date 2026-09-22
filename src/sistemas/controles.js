// ---------------------------------------------------------------------------
// CONTROLES
// Mapeo de teclas por PERFIL de jugador. Para anadir un segundo jugador
// simultaneo mas adelante basta con anadir un perfil aqui y crear otro jugador
// con ese perfil: ningun otro archivo cambia.
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

export class Controles {
  constructor(escena, perfil = PERFILES.jugador1) {
    this.escena = escena;
    this.teclas = {};

    ACCIONES.forEach((accion) => {
      this.teclas[accion] = (perfil[accion] || []).map((nombre) =>
        escena.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[nombre], true, false),
      );
    });

    this.estado = { izquierda: false, derecha: false, saltar: false, habilidad: false };
    this.previo = { ...this.estado };
  }

  // Se llama una sola vez por fotograma, al principio del update de la escena.
  actualizar() {
    this.previo = { ...this.estado };
    ACCIONES.forEach((accion) => {
      this.estado[accion] = this.teclas[accion].some((tecla) => tecla.isDown);
    });
  }

  activa(accion) {
    return this.estado[accion];
  }

  recienPulsada(accion) {
    return this.estado[accion] && !this.previo[accion];
  }

  recienSoltada(accion) {
    return !this.estado[accion] && this.previo[accion];
  }

  // -1 izquierda, 1 derecha, 0 quieto
  get direccion() {
    return (this.estado.derecha ? 1 : 0) - (this.estado.izquierda ? 1 : 0);
  }

  destruir() {
    ACCIONES.forEach((accion) => {
      this.teclas[accion].forEach((tecla) => this.escena.input.keyboard.removeKey(tecla));
    });
  }
}
