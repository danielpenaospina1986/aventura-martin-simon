// ---------------------------------------------------------------------------
// EL TORO
//
// El bicho intermedio. No se pasea por una plataforma como una banera ni guarda
// una arena como un jefe: ENTRA CORRIENDO por un lado del cuadro, cruza el
// tablero y, cuando tiene al nino delante, baja la cabeza y embiste.
//
// Se le ve venir, que es lo que lo hace justo: antes de acelerar baja la cabeza
// y echa vaho por el hocico. Se le gana como a los demas bichos: pisandolo, con
// la katana o con un bloque. De frente no hay quien lo pare.
//
// Se salta los huecos del suelo el solo; si no, en cuanto pillara el primero se
// caeria al vacio y no llegaria a cruzarse con nadie.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TORO } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';
import { polvo } from '../sistemas/efectos.js';

export class Toro extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, TEXTURAS.toro);

    this.escena = escena;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.setDisplaySize(TORO.ancho, TORO.alto).setDepth(8);
    const escalaX = this.scaleX || 1;
    const escalaY = this.scaleY || 1;
    this.body.setSize(TORO.caja.ancho / escalaX, TORO.caja.alto / escalaY, false);
    this.body.setOffset(
      (TORO.ancho - TORO.caja.ancho) / 2 / escalaX,
      (TORO.alto - TORO.caja.alto) / escalaY,
    );

    // El dibujo mira a la derecha, como todos los del juego.
    this.direccion = direccion;
    this.setFlipX(direccion < 0);

    this.estado = 'trota';
    this.reloj = 0;
    this.cambio = 0;
  }

  get embistiendo() {
    return this.estado === 'embiste';
  }

  actualizar(delta) {
    this.reloj += delta;

    const nino = this.escena.jugadores && this.escena.jugadores[0];
    if (this.estado === 'trota' && nino && nino.active) {
      const porDelante = (nino.x - this.x) * this.direccion > 0;
      const cerca = Math.abs(nino.x - this.x) < TORO.distanciaEmbestida;
      if (porDelante && cerca) this.bajarLaCabeza();
    }

    if (this.estado === 'avisa') {
      // se planta un momento, resoplando, antes de arrancar
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.arrancar();
      return;
    }

    const velocidad = this.embistiendo ? TORO.velocidadEmbestida : TORO.velocidad;
    this.body.velocity.x = this.direccion * velocidad;

    // Salta los huecos: si por delante no hay donde pisar, brinca.
    if (this.body.blocked.down) {
      const puntaX = this.x + this.direccion * (this.body.halfWidth + 14);
      if (!this.escena.haySoporteEn(puntaX, this.body.bottom + 6)) {
        this.body.setVelocityY(-TORO.impulsoSalto);
      }
    }
  }

  bajarLaCabeza() {
    this.estado = 'avisa';
    this.cambio = this.reloj + TORO.avisoMs;
    this.setTexture(TEXTURAS.toroEmbiste);
    this.escena.tweens.add({
      targets: this,
      scaleY: this.scaleY * 0.92,
      duration: TORO.avisoMs / 2,
      yoyo: true,
    });
  }

  arrancar() {
    this.estado = 'embiste';
    polvo(this.escena, this.x - this.direccion * 30, this.body.bottom - 6);
  }
}

export default Toro;
