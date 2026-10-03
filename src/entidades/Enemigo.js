// ---------------------------------------------------------------------------
// ENEMIGO: LA BANERA
//
// Camina siempre hacia adelante y da la vuelta cuando choca con una pared o
// cuando se le acaba el suelo. Hasta ahi, un obstaculo amable.
//
// Ademas, de vez en cuando se planta, se agacha y pega un salto tirando agua
// con jabon. Los tiempos son al azar, para que no se aprendan de memoria, y se
// acortan segun avanza la partida: en el primer tablero ataca poco y en el
// ultimo, a menudo.
//
// Solo ataca si el nino esta a tiro y por delante: si no, seria injusto.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { ENEMIGO } from '../config/ajustes.js';
import { TEXTURAS } from '../config/estilo.js';

// Los dibujos de una piel. Sin piel, la banera de toda la vida: sus dibujos no
// salen del glob de `src/assets/bichos/` sino de las claves sueltas de
// TEXTURAS, porque son PNG y estan ahi desde antes de que esto fuera por
// pieles.
function dibujosDe(piel) {
  if (!piel) {
    return {
      municion: TEXTURAS.agua,
      quieta: TEXTURAS.baneraQuieta,
      anda: [TEXTURAS.baneraAnda1, TEXTURAS.baneraAnda2],
      carga: TEXTURAS.baneraCarga,
      lanza: TEXTURAS.baneraLanza,
    };
  }
  const suyo = (pose) => TEXTURAS.bichoDe(piel, pose);
  return {
    // Lo que tira no lo sabe la escena: lo dice el bicho, como ya hacian los
    // jefes con su `municion`. Mini Papa tira balones; los demas, el agua con
    // jabon de siempre, que es de lo que va el cuento.
    municion: piel === 'minipapa' ? TEXTURAS.balonUsa : TEXTURAS.agua,
    quieta: suyo('quieta'),
    anda: [suyo('anda1'), suyo('anda2')],
    carga: suyo('carga'),
    lanza: suyo('lanza'),
  };
}

export class Enemigo extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, direccion = -1, piel = null) {
    super(escena, x, y, dibujosDe(piel).anda[0]);

    this.piel = piel;
    this.dibujos = dibujosDe(piel);

    this.escena = escena;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.setDisplaySize(ENEMIGO.ancho, ENEMIGO.alto);

    // la caja se mide en pixeles de la textura y luego se escala: hay que
    // dividir por la escala o sale diminuta
    const escalaX = this.scaleX || 1;
    const escalaY = this.scaleY || 1;
    this.body.setSize(ENEMIGO.caja.ancho / escalaX, ENEMIGO.caja.alto / escalaY, false);
    this.body.setOffset(
      (ENEMIGO.ancho - ENEMIGO.caja.ancho) / 2 / escalaX,
      (ENEMIGO.alto - ENEMIGO.caja.alto - (ENEMIGO.margenPie || 0)) / escalaY,
    );
    this.body.setMaxVelocity(200, 900);

    this.direccion = direccion;
    // el dibujo viene mirando a la derecha, asi que se voltea al ir a la
    // izquierda; al reves salia andando de espaldas
    this.setFlipX(direccion < 0);

    // --- estado del ataque ---
    this.estado = 'anda';
    this.reloj = 0;
    this.relojPaso = 0;
    this.paso = 0;
    this.cambioDeEstado = 0;
    this.proximoAtaque = this.esperaDeAtaque();
  }

  // La espera baja segun el nivel: el primer tablero es un paseo, el ultimo no.
  esperaDeAtaque() {
    const a = ENEMIGO.ataque;
    const nivel = this.escena.indiceNivel || 0;
    const recorte = Math.max(0, 1 - nivel * a.recortePorNivel);
    const minimo = Math.max(a.esperaMinima, a.esperaMinMs * recorte);
    const maximo = Math.max(minimo + 400, a.esperaMaxMs * recorte);
    return Phaser.Math.Between(minimo, maximo);
  }

  girar(nuevaDireccion) {
    this.direccion = nuevaDireccion;
    this.setFlipX(nuevaDireccion < 0);
  }

  // Solo se lanza si el nino esta cerca y hacia donde mira.
  hayAlguienATiro() {
    const jugador = this.escena.jugadores && this.escena.jugadores[0];
    if (!jugador || !jugador.active) return false;
    const distancia = jugador.x - this.x;
    if (Math.abs(distancia) > ENEMIGO.ataque.distanciaMaxima) return false;
    if (Math.abs(jugador.y - this.y) > 140) return false;
    return Math.sign(distancia) === this.direccion;
  }

  actualizar(delta) {
    const cuerpo = this.body;
    this.reloj += delta;

    if (this.estado === 'carga') {
      cuerpo.velocity.x = 0;
      this.setTexture(this.dibujos.carga);
      if (this.reloj >= this.cambioDeEstado) this.saltarYLanzar();
      return;
    }

    if (this.estado === 'lanza') {
      this.setTexture(this.dibujos.lanza);
      if (this.reloj >= this.cambioDeEstado) {
        this.estado = 'anda';
        this.proximoAtaque = this.reloj + this.esperaDeAtaque();
      }
      return;
    }

    // --- andando ---
    if (cuerpo.blocked.left) this.girar(1);
    else if (cuerpo.blocked.right) this.girar(-1);
    else if (cuerpo.blocked.down) {
      const puntaX = this.x + this.direccion * (cuerpo.halfWidth + ENEMIGO.sondaBorde);
      if (!this.escena.haySoporteEn(puntaX, cuerpo.bottom + 4)) this.girar(-this.direccion);
    }

    cuerpo.velocity.x = this.direccion * ENEMIGO.velocidad;

    this.relojPaso += delta;
    if (this.relojPaso >= 200) {
      this.relojPaso = 0;
      this.paso = (this.paso + 1) % this.dibujos.anda.length;
    }
    this.setTexture(this.dibujos.anda[this.paso]);

    if (this.reloj >= this.proximoAtaque && cuerpo.blocked.down && this.hayAlguienATiro()) {
      this.agacharse();
    }
  }

  agacharse() {
    this.estado = 'carga';
    this.cambioDeEstado = this.reloj + ENEMIGO.ataque.avisoMs;
    this.body.velocity.x = 0;
  }

  saltarYLanzar() {
    this.estado = 'lanza';
    this.cambioDeEstado = this.reloj + ENEMIGO.ataque.lanzandoMs;
    this.body.velocity.y = -ENEMIGO.ataque.impulsoSalto;
    this.escena.lanzarAgua(this);
  }
}

export default Enemigo;
