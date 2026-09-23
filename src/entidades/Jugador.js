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

    // Los dibujos vienen en lienzos grandes; el personaje mide lo que diga
    // datos.ancho x datos.alto. Se escala antes de tocar la caja de colision.
    this.setDisplaySize(datos.ancho, datos.alto);

    // La caja de colision es algo mas pequena que el dibujo: perdona los roces.
    //
    // Ojo: Arcade mide la caja en pixeles de la TEXTURA y luego le aplica la
    // escala del sprite. Como los dibujos vienen en lienzos grandes y se
    // reducen, hay que dividir por la escala o la caja sale diminuta.
    const escalaX = this.scaleX || 1;
    const escalaY = this.scaleY || 1;

    this.body.setSize(datos.caja.ancho / escalaX, datos.caja.alto / escalaY, false);
    // margenPie es el aire que queda bajo los pies dentro del lienzo del
    // sprite: sin restarlo, el personaje flotaria sobre el suelo.
    this.body.setOffset(
      (datos.ancho - datos.caja.ancho) / 2 / escalaX,
      (datos.alto - datos.caja.alto - (datos.margenPie || 0)) / escalaY,
    );
    this.body.setMaxVelocity(600, FISICA.velocidadCaidaMaxima);

    // estado
    this.mirando = 1;
    this.coyote = 0;
    this.buffer = 0;
    this.saltoRecortado = false;
    this.puedeRecortar = true;
    this.enSuelo = false;
    this.reloj = 0;
    this.invulnerableHasta = 0;
    this.congeladoHasta = 0;
    this.recargaHabilidad = 0;
    this.reaparicion = { x, y };
    // marcador y su desglose, para poder contarlo al final
    this.monedas = 0;

    // animacion por poses (solo si el personaje las tiene dibujadas)
    this.relojPaso = 0;
    this.pasoActual = 0;
    this.atacandoHasta = 0;
    this.recogidas = 0;
    this.golpes = 0;
    this.jefesDerrotados = 0;
    this.enemigosVencidos = 0;
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
      if (this.datos.poses && this.datos.poses.golpe) this.setTexture(this.datos.poses.golpe);
      return;
    }
    cuerpo.setAllowGravity(true);

    if (this.recargaHabilidad > 0) this.recargaHabilidad -= delta;

    this.moverHorizontal(dt);
    this.gestionarSalto(delta);
    this.gestionarHabilidad();
    this.aplicarGravedadVariable();
    this.actualizarPose(delta);
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

    // salto variable: al soltar el boton, la subida se recorta.
    // No se recorta en el mismo fotograma en que se ha saltado: asi un toque
    // muy corto sigue dando un saltito de verdad.
    if (
      this.controles.recienSoltada('saltar') &&
      cuerpo.velocity.y < 0 &&
      !this.saltoRecortado &&
      this.puedeRecortar
    ) {
      cuerpo.velocity.y *= JUGADOR.recorteSalto;
      this.saltoRecortado = true;
    }

    this.puedeRecortar = true;
  }

  // Elige que dibujo mostrar. Si el personaje no tiene poses (todavia), se
  // queda con su textura unica y no pasa nada.
  actualizarPose(delta) {
    const poses = this.datos.poses;
    if (!poses) return;

    // recibir un golpe manda sobre todo lo demas
    if (poses.golpe && this.esInvulnerable) {
      this.setTexture(poses.golpe);
      return;
    }

    if (this.reloj < this.atacandoHasta) {
      this.setTexture(poses.atacar);
      return;
    }

    if (!this.enSuelo) {
      this.setTexture(poses.aire);
      return;
    }

    if (Math.abs(this.body.velocity.x) > 20) {
      this.relojPaso += delta;
      if (this.relojPaso >= (this.datos.msPorPaso || 140)) {
        this.relojPaso = 0;
        this.pasoActual = (this.pasoActual + 1) % poses.correr.length;
      }
      this.setTexture(poses.correr[this.pasoActual]);
      return;
    }

    this.relojPaso = 0;
    this.pasoActual = 0;
    this.setTexture(poses.quieto);
  }

  saltar() {
    this.body.velocity.y = -JUGADOR.impulsoSalto;
    this.buffer = 0;
    this.coyote = 0;
    this.saltoRecortado = false;
    this.puedeRecortar = false;
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
    if (recarga) {
      this.recargaHabilidad = recarga;
      this.atacandoHasta = this.reloj + 260;
    }
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
    // la escena le despeja el terreno: ver despejarAlReaparecer
    if (this.escena.despejarAlReaparecer) this.escena.despejarAlReaparecer(this);
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
}

export default Jugador;
