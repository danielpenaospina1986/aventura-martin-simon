// ---------------------------------------------------------------------------
// LA PALOMA
//
// Cruza la pantalla volando por la franja de arriba, la que se dejo libre en
// los tableros. Cuando pasa por encima del nino, suelta lo que suelta; si le
// cae encima, cuenta como un golpe.
//
// No persigue: vuela recto. Lo unico que hace es soltar en el momento en que
// pasa sobre el nino, que es lo que la hace graciosa y esquivable: se la ve
// venir y da tiempo a apartarse.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, PALOMA } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';

const ALETEO = [
  TEXTURAS.palomaVuela1,
  TEXTURAS.palomaVuela2,
  TEXTURAS.palomaVuela3,
  TEXTURAS.palomaVuela4,
];

export class Paloma extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, ALETEO[0]);

    this.escena = escena;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.setDisplaySize(PALOMA.ancho, PALOMA.alto).setDepth(8);
    this.body.setAllowGravity(false);

    // la caja se mide en pixeles de la textura y luego se escala
    const escalaX = this.scaleX || 1;
    const escalaY = this.scaleY || 1;
    this.body.setSize(PALOMA.caja.ancho / escalaX, PALOMA.caja.alto / escalaY, true);

    this.direccion = direccion;
    // el dibujo viene mirando a la derecha: se voltea solo al volar hacia la
    // izquierda. Al reves las palomas cruzaban la pantalla de espaldas.
    this.setFlipX(direccion < 0);
    this.body.velocity.x = direccion * PALOMA.velocidad;

    this.reloj = 0;
    this.relojAleteo = 0;
    this.paso = 0;
    this.yaSolto = false;
    this.soltandoHasta = 0;
  }

  actualizar(delta) {
    this.reloj += delta;

    // Se fija cada fotograma: al meterla en el grupo, la velocidad que le puso
    // el constructor se pierde.
    this.body.velocity.x = this.direccion * PALOMA.velocidad;
    this.body.velocity.y = 0;

    // aleteo
    if (this.reloj < this.soltandoHasta) {
      this.setTexture(TEXTURAS.palomaSuelta);
    } else {
      this.relojAleteo += delta;
      if (this.relojAleteo >= PALOMA.msPorAleteo) {
        this.relojAleteo = 0;
        this.paso = (this.paso + 1) % ALETEO.length;
      }
      this.setTexture(ALETEO[this.paso]);
    }

    // soltar justo al pasar por encima del nino
    if (!this.yaSolto) {
      const jugador = this.escena.jugadores && this.escena.jugadores[0];
      if (jugador && jugador.active && Math.abs(jugador.x - this.x) < 26) {
        this.yaSolto = true;
        this.soltandoHasta = this.reloj + PALOMA.avisoMs;
        this.escena.soltarCaida(this);
      }
    }

    // fuera del mundo: se va
    const margen = 120;
    if (this.x < -margen || this.x > MUNDO.casilla * this.escena.nivel.columnas + margen) {
      this.destroy();
    }
  }
}

export default Paloma;
