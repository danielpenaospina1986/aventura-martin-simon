// ---------------------------------------------------------------------------
// EL JEFE
// El enemigo grande del final del nivel. Hay que quitarle tres vidas para que
// se abra la meta. Se le hace dano de tres maneras, para que los dos ninos
// puedan con el:
//   - saltandole encima,
//   - con la katana de Martin,
//   - con un bloque lanzado por Simon.
//
// Camina de un lado a otro de su arena y da la vuelta al llegar al borde, igual
// que los enemigos normales. No persigue: la gracia es buscarle las vueltas.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { JEFE } from '../config/ajustes.js';
import { COLORES, TEXTURAS } from '../config/estilo.js';

export class Jefe extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, TEXTURAS.jefe);

    this.escena = escena;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.body.setSize(JEFE.ancho - 12, JEFE.alto - 10, false);
    this.body.setOffset(6, 10);
    this.body.setMaxVelocity(260, 900);

    this.direccion = direccion;
    this.setFlipX(direccion > 0);
    this.setDepth(9);

    this.vidas = JEFE.vidas;
    this.reloj = 0;
    this.invulnerableHasta = 0;

    this.crearBarraDeVida();
  }

  get esInvulnerable() {
    return this.reloj < this.invulnerableHasta;
  }

  // Tres puntitos encima de la cabeza: se apagan segun recibe golpes.
  crearBarraDeVida() {
    this.puntos = [];
    for (let i = 0; i < JEFE.vidas; i += 1) {
      const punto = this.escena.add
        .circle(0, 0, 6, COLORES.jefeVida)
        .setStrokeStyle(2, 0x16202c, 0.8)
        .setDepth(11);
      this.puntos.push(punto);
    }
    this.colocarBarraDeVida();
  }

  colocarBarraDeVida() {
    const separacion = 18;
    const inicio = this.x - ((JEFE.vidas - 1) * separacion) / 2;
    this.puntos.forEach((punto, i) => {
      punto.setPosition(inicio + i * separacion, this.y - JEFE.alto / 2 - 16);
      punto.setFillStyle(i < this.vidas ? COLORES.jefeVida : COLORES.jefeVidaVacia);
    });
  }

  girar(nuevaDireccion) {
    this.direccion = nuevaDireccion;
    this.setFlipX(nuevaDireccion > 0);
  }

  actualizar(delta) {
    this.reloj += delta;
    const cuerpo = this.body;

    if (cuerpo.blocked.left) this.girar(1);
    else if (cuerpo.blocked.right) this.girar(-1);
    else if (cuerpo.blocked.down) {
      const puntaX = this.x + this.direccion * (cuerpo.halfWidth + 8);
      if (!this.escena.haySoporteEn(puntaX, cuerpo.bottom + 4)) this.girar(-this.direccion);
    }

    cuerpo.velocity.x = this.direccion * JEFE.velocidad;
    this.colocarBarraDeVida();
  }

  // Devuelve true si el golpe ha contado.
  recibirGolpe(desdeX) {
    if (this.esInvulnerable || !this.active) return false;

    this.vidas -= 1;
    this.invulnerableHasta = this.reloj + JEFE.invulnerableMs;

    // retrocede un poco, para que se note el impacto
    const empujon = this.x < desdeX ? -1 : 1;
    this.body.velocity.x = empujon * JEFE.empujonAlHerir * 3;

    this.setTexture(TEXTURAS.jefeEnfadado);
    this.escena.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.3 },
      duration: JEFE.parpadeoMs,
      yoyo: true,
      repeat: Math.floor(JEFE.invulnerableMs / (JEFE.parpadeoMs * 2)) - 1,
      onComplete: () => {
        this.setAlpha(1);
        if (this.active) this.setTexture(TEXTURAS.jefe);
      },
    });

    this.colocarBarraDeVida();
    return true;
  }

  get derrotado() {
    return this.vidas <= 0;
  }

  destroy(fromScene) {
    if (this.puntos) this.puntos.forEach((punto) => punto.destroy());
    this.puntos = null;
    super.destroy(fromScene);
  }
}

export default Jefe;
