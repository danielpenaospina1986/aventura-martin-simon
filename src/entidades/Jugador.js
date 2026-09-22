// ---------------------------------------------------------------------------
// JUGADOR
// Un jugador = unos datos de personaje + un perfil de controles. Los dos
// personajes usan exactamente esta misma clase y los mismos numeros de
// movimiento; lo unico que cambia es la habilidad.
//
// Para el futuro modo de dos jugadores: crear dos Jugador con perfiles de
// control distintos y meterlos en el array escena.jugadores. Nada mas.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { FISICA, JUGADOR } from '../config/ajustes.js';
import { HABILIDADES } from './habilidades.js';

function aproximar(actual, objetivo, paso) {
  if (actual < objetivo) return Math.min(actual + paso, objetivo);
  if (actual > objetivo) return Math.max(actual - paso, objetivo);
  return objetivo;
}

export class Jugador extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, datos, controles) {
    super(escena, x, y, datos.textura);

    this.escena = escena;
    this.datos = datos;
    this.controles = controles;

    escena.add.existing(this);
    escena.physics.add.existing(this);

    // La caja de colision es algo mas pequena que el dibujo: perdona los roces.
    this.body.setSize(datos.caja.ancho, datos.caja.alto, false);
    this.body.setOffset(
      (datos.ancho - datos.caja.ancho) / 2,
      datos.alto - datos.caja.alto,
    );
    this.body.setMaxVelocity(600, FISICA.velocidadCaidaMaxima);

    // estado
    this.mirando = 1;
    this.coyote = 0;
    this.buffer = 0;
    this.saltoRecortado = false;
    this.enSuelo = false;
    this.reloj = 0;
    this.invulnerableHasta = 0;
    this.congeladoHasta = 0;
    this.recargaHabilidad = 0;
    this.bloques = [];
    this.reaparicion = { x, y };
    this.monedas = 0;
  }

  get esInvulnerable() {
    return this.reloj < this.invulnerableHasta;
  }

  get estaCongelado() {
    return this.reloj < this.congeladoHasta;
  }

  // --- bucle principal ------------------------------------------------------

  actualizar(delta) {
    this.reloj += delta;
    const dt = delta / 1000;
    const cuerpo = this.body;
    this.enSuelo = cuerpo.blocked.down || cuerpo.touching.down;

    if (this.estaCongelado) {
      cuerpo.setVelocity(0, 0);
      cuerpo.setAllowGravity(false);
      return;
    }
    cuerpo.setAllowGravity(true);

    if (this.recargaHabilidad > 0) this.recargaHabilidad -= delta;

    this.moverHorizontal(dt);
    this.gestionarSalto(delta);
    this.gestionarHabilidad();
    this.aplicarGravedadVariable();
  }

  moverHorizontal(dt) {
    const dir = this.controles.direccion;
    const cuerpo = this.body;
    const objetivo = dir * JUGADOR.velocidad;

    let tasa;
    if (dir !== 0) {
      tasa = this.enSuelo ? JUGADOR.aceleracionSuelo : JUGADOR.aceleracionAire;
      this.mirando = dir;
      this.setFlipX(dir < 0);
    } else {
      tasa = this.enSuelo ? JUGADOR.frenadoSuelo : JUGADOR.frenadoAire;
    }

    cuerpo.velocity.x = aproximar(cuerpo.velocity.x, objetivo, tasa * dt);
  }

  gestionarSalto(delta) {
    const cuerpo = this.body;

    // coyote time: se puede saltar un instante despues de dejar el suelo
    this.coyote = this.enSuelo ? JUGADOR.coyoteMs : Math.max(0, this.coyote - delta);

    // buffer: si pulsas salto justo antes de aterrizar, el salto no se pierde
    if (this.controles.recienPulsada('saltar')) this.buffer = JUGADOR.bufferSaltoMs;
    else this.buffer = Math.max(0, this.buffer - delta);

    if (this.buffer > 0 && this.coyote > 0) {
      this.saltar();
    }

    // salto variable: al soltar el boton, la subida se recorta
    if (
      this.controles.recienSoltada('saltar') &&
      cuerpo.velocity.y < 0 &&
      !this.saltoRecortado
    ) {
      cuerpo.velocity.y *= JUGADOR.recorteSalto;
      this.saltoRecortado = true;
    }
  }

  saltar() {
    this.body.velocity.y = -JUGADOR.impulsoSalto;
    this.buffer = 0;
    this.coyote = 0;
    this.saltoRecortado = false;
    this.escena.events.emit('jugador-salta', this);
  }

  rebotar() {
    this.body.velocity.y = -JUGADOR.reboteEnemigo;
    this.saltoRecortado = false;
  }

  aplicarGravedadVariable() {
    // La caida es un poco mas rapida que la subida: se siente mejor.
    const extra = FISICA.gravedad * (FISICA.multiplicadorCaida - 1);
    this.body.setGravityY(this.body.velocity.y > 0 ? extra : 0);
  }

  gestionarHabilidad() {
    if (!this.controles.recienPulsada('habilidad')) return;
    if (this.recargaHabilidad > 0) return;
    const habilidad = HABILIDADES[this.datos.habilidad];
    if (!habilidad) return;
    const recarga = habilidad(this, this.escena);
    if (recarga) this.recargaHabilidad = recarga;
  }

  // --- reglas amables -------------------------------------------------------

  fijarReaparicion(x, y) {
    this.reaparicion = { x, y };
  }

  // Devuelve true si el golpe ha contado.
  herir() {
    if (this.esInvulnerable) return false;

    this.invulnerableHasta = this.reloj + JUGADOR.invulnerabilidadMs;
    this.congeladoHasta = this.reloj + JUGADOR.congelarAlHerirMs;
    this.body.setVelocity(0, 0);
    this.parpadear(JUGADOR.invulnerabilidadMs);

    this.escena.time.delayedCall(JUGADOR.congelarAlHerirMs, () => {
      if (this.active) this.reaparecer();
    });
    return true;
  }

  reaparecer() {
    this.setPosition(this.reaparicion.x, this.reaparicion.y);
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(true);
    this.coyote = 0;
    this.buffer = 0;
  }

  parpadear(duracion) {
    if (this.tweenParpadeo) this.tweenParpadeo.stop();
    const ciclo = JUGADOR.parpadeoMs;
    this.tweenParpadeo = this.escena.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.25 },
      duration: ciclo,
      yoyo: true,
      repeat: Math.max(1, Math.floor(duracion / (ciclo * 2)) - 1),
      onComplete: () => this.setAlpha(1),
    });
  }

  limpiarBloques() {
    this.bloques.forEach((bloque) => bloque.destroy());
    this.bloques = [];
  }
}

export default Jugador;
