// ---------------------------------------------------------------------------
// ENEMIGO
// Camina siempre hacia adelante y da la vuelta cuando choca con una pared o
// cuando se le acaba el suelo. No persigue ni dispara: es un obstaculo amable.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { ENEMIGO } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';

export class Enemigo extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, TEXTURAS.enemigo);

    this.escena = escena;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.body.setSize(24, 18, false);
    this.body.setOffset(2, 4);
    this.body.setMaxVelocity(200, 900);

    this.direccion = direccion;
    this.setFlipX(direccion > 0);
  }

  girar(nuevaDireccion) {
    this.direccion = nuevaDireccion;
    this.setFlipX(nuevaDireccion > 0);
  }

  actualizar() {
    const cuerpo = this.body;

    if (cuerpo.blocked.left) this.girar(1);
    else if (cuerpo.blocked.right) this.girar(-1);
    else if (cuerpo.blocked.down) {
      // mira si delante hay suelo; si no, da media vuelta
      const puntaX = this.x + this.direccion * (cuerpo.halfWidth + ENEMIGO.sondaBorde);
      const puntaY = cuerpo.bottom + 4;
      if (!this.escena.haySoporteEn(puntaX, puntaY)) this.girar(-this.direccion);
    }

    cuerpo.velocity.x = this.direccion * ENEMIGO.velocidad;
  }
}

export default Enemigo;
