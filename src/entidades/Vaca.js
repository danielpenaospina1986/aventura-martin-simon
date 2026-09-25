// ---------------------------------------------------------------------------
// LA VACA BERRIONDA
//
// El bicho intermedio. No se pasea por una plataforma como una banera ni guarda
// una arena como un jefe: ENTRA CORRIENDO por un lado del cuadro, cruza el
// tablero y, cuando tiene al nino delante, baja la cabeza y embiste.
//
// Sale de una de verdad: a Martin lo persiguio una vaca en la finca de los
// abuelos y casi se lo lleva por delante. De ahi el cartel que sale con ella.
//
// Se le ve venir, que es lo que la hace justa: antes de acelerar se planta,
// agacha la cabeza y resopla. Se le gana como a los demas bichos: pisandola,
// con la katana o con un bloque. De frente no hay quien la pare.
//
// Se salta los huecos del suelo ella sola; si no, en cuanto pillara el primero
// se caeria al vacio y no llegaria a cruzarse con nadie.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { VACA } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';
import { polvo } from '../sistemas/efectos.js';

const TROTE = [TEXTURAS.vacaAnda1, TEXTURAS.vacaAnda2];
const GALOPE = [TEXTURAS.vacaEmbiste1, TEXTURAS.vacaEmbiste2];

export class Vaca extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, TEXTURAS.vacaAnda1);

    this.escena = escena;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.setDisplaySize(VACA.ancho, VACA.alto).setDepth(8);
    const escalaX = this.scaleX || 1;
    const escalaY = this.scaleY || 1;
    this.body.setSize(VACA.caja.ancho / escalaX, VACA.caja.alto / escalaY, false);
    this.body.setOffset(
      (VACA.ancho - VACA.caja.ancho) / 2 / escalaX,
      (VACA.alto - VACA.caja.alto) / escalaY,
    );

    // El dibujo mira a la derecha, como todos los del juego.
    this.direccion = direccion;
    this.setFlipX(direccion < 0);

    this.estado = 'trota';
    this.reloj = 0;
    this.cambio = 0;
    this.paso = 0;
    this.relojPaso = 0;
  }

  get embistiendo() {
    return this.estado === 'embiste';
  }

  get derribada() {
    return this.estado === 'tumbada';
  }

  actualizar(delta) {
    this.reloj += delta;

    // Tumbada ya no hace nada: solo titila hasta desaparecer.
    if (this.estado === 'tumbada') return;

    const nino = this.escena.jugadores && this.escena.jugadores[0];
    if (this.estado === 'trota' && nino && nino.active) {
      const porDelante = (nino.x - this.x) * this.direccion > 0;
      const cerca = Math.abs(nino.x - this.x) < VACA.distanciaEmbestida;
      if (porDelante && cerca) this.bajarLaCabeza();
    }

    if (this.estado === 'avisa') {
      // se planta un momento, resoplando, antes de arrancar
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.arrancar();
      return;
    }

    const galopando = this.estado === 'embiste';
    this.body.velocity.x = this.direccion * (galopando ? VACA.velocidadEmbestida : VACA.velocidad);
    this.animar(delta, galopando ? GALOPE : TROTE, galopando ? VACA.msPorTranco : VACA.msPorPaso);

    // Salta los huecos: si por delante no hay donde pisar, brinca.
    if (this.body.blocked.down) {
      const puntaX = this.x + this.direccion * (this.body.halfWidth + 14);
      if (!this.escena.haySoporteEn(puntaX, this.body.bottom + 6)) {
        this.body.setVelocityY(-VACA.impulsoSalto);
      }
    }
  }

  animar(delta, poses, cada) {
    this.relojPaso += delta;
    if (this.relojPaso < cada) return;
    this.relojPaso = 0;
    this.paso = (this.paso + 1) % poses.length;
    this.setTexture(poses[this.paso]);
  }

  bajarLaCabeza() {
    this.estado = 'avisa';
    this.cambio = this.reloj + VACA.avisoMs;
    this.setTexture(TEXTURAS.vacaAvisa);
  }

  arrancar() {
    this.estado = 'embiste';
    this.paso = 0;
    this.relojPaso = 0;
    this.setTexture(GALOPE[0]);
    polvo(this.escena, this.x - this.direccion * 40, this.body.bottom - 6);
  }

  // Le han saltado encima: se cae patas arriba, con las X y sus estrellitas,
  // titila un rato y desaparece dejando su premio donde cayo. Igual que la
  // paloma: el bicho no se esfuma de golpe, se le ve caer.
  derribar() {
    if (this.estado === 'tumbada') return false;
    this.estado = 'tumbada';

    this.setTexture(TEXTURAS.vacaTumbada);
    // Se le dejan la gravedad y el suelo: asi se desploma y se acuesta donde
    // toque. Quitandole el cuerpo se quedaba flotando en el aire cuando la
    // pisaban en pleno salto sobre un hueco.
    this.body.setVelocity(0, -80);

    this.escena.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.15 },
      duration: VACA.titileoMs,
      yoyo: true,
      repeat: VACA.titileos,
      onComplete: () => {
        if (this.active) this.destroy();
      },
    });
    return true;
  }
}

export default Vaca;
