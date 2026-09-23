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

// La caida, cuando se le acaban los golpes de aguante.
const CAIDA = [TEXTURAS.palomaCae1, TEXTURAS.palomaCae2, TEXTURAS.palomaCae3];

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

    // Aguanta dos saltos encima: al primero se queda aturdida y da tumbos, al
    // segundo se cae.
    this.vidas = PALOMA.vidas;
    this.estado = 'vuela';
    this.aturdidaHasta = 0;
  }

  // Le han saltado encima. Devuelve true si el golpe ha contado.
  recibirGolpe() {
    if (this.estado === 'cae' || this.estado === 'suelo') return false;

    this.vidas -= 1;
    if (this.vidas > 0) {
      this.estado = 'aturdida';
      this.aturdidaHasta = this.reloj + PALOMA.aturdidaMs;
      this.setTexture(TEXTURAS.palomaMareada);
      return true;
    }

    // se le acabo: cae a plomo
    this.estado = 'cae';
    this.paso = 0;
    this.relojAleteo = 0;
    this.body.setAllowGravity(true);
    this.body.setVelocity(this.direccion * 40, -60);
    return true;
  }

  // Ha tocado el suelo: se queda tumbada, titila y desaparece.
  aterrizar() {
    if (this.estado === 'suelo') return;
    this.estado = 'suelo';
    const suelo = this.body.bottom;
    this.setTexture(TEXTURAS.palomaSuelo);
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.setFlipX(this.direccion < 0);

    // Se la apoya por el dibujo, no por la caja: la caja va centrada y el
    // bicho se quedaba medio enterrado en la arena. Como todas las poses, el
    // dibujo se apoya a 6 px del fondo de su lienzo de 260.
    this.y = suelo - this.displayHeight * (0.5 - 6 / 260);

    if (this.escena.premiarPaloma) this.escena.premiarPaloma(this);

    this.escena.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.15 },
      duration: PALOMA.titileoMs,
      yoyo: true,
      repeat: PALOMA.titileos,
      onComplete: () => this.destroy(),
    });
  }

  actualizar(delta) {
    this.reloj += delta;

    // --- tumbada en el suelo: ya no hace nada, solo titila ---
    if (this.estado === 'suelo') return;

    // --- cayendo: da vueltas hasta tocar el suelo ---
    if (this.estado === 'cae') {
      this.relojAleteo += delta;
      if (this.relojAleteo >= PALOMA.msPorVuelta) {
        this.relojAleteo = 0;
        this.paso = (this.paso + 1) % CAIDA.length;
      }
      this.setTexture(CAIDA[this.paso]);
      if (this.body.blocked.down || this.body.touching.down) this.aterrizar();
      return;
    }

    // --- aturdida: sigue volando, pero dando tumbos y mas despacio ---
    if (this.estado === 'aturdida') {
      if (this.reloj >= this.aturdidaHasta) {
        this.estado = 'vuela';
      } else {
        this.setTexture(TEXTURAS.palomaMareada);
        this.body.velocity.x = this.direccion * PALOMA.velocidad * 0.55;
        this.body.velocity.y = Math.sin(this.reloj / 90) * 60;
        return;
      }
    }

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
