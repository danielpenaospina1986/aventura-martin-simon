// ---------------------------------------------------------------------------
// CARTAGENA: EL CAPITAN TAPON
//
// El ultimo guardian del bano, y el mas terco: un capitan de bañera con su
// casaca, su sombrero de pico y, colgado a la espalda con su cadena, un TAPON
// enorme. Todo el agua de la partida esta ahi dentro.
//
// Como se le gana: no a golpes. Marcha por su arena y dispara balas de espuma;
// cuando se le acaban, se da la vuelta para RECARGAR y ahi se le ve el tapon,
// brillando. Un golpe al tapon en ese momento (pisandolo, con la katana o con
// un bloque) y se le sale un poco. Cinco tirones y se le va el agua entera.
//
// Es el final y por eso tiene su propia gracia: al jefe final de un juego que
// se llama "La gran fuga del bano" se le gana QUITANDOLE EL TAPON.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

const TIEMPOS = {
  marchaMinMs: 1100,
  marchaMaxMs: 1900,
  avisoMs: 620,
  disparandoMs: 360,
  recargaMs: 1700,
};

const VELOCIDAD_MARCHA = 64;

// Cuantas balas tira antes de tener que recargar. Con los golpes encajados va
// disparando mas seguido, pero la ventana de recarga no se acorta: la pelea se
// pone tensa sin volverse injusta.
const BALAS_POR_CARGA = 3;

export class CapitanTapon extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.jefeCapitan,
      texturaHerida: TEXTURAS.jefeCapitanSinTapon,
      vidas: 5, // cinco tirones de tapon
      direccion,
    });

    this.estado = 'marcha';
    this.cambio = TIEMPOS.marchaMinMs;
    this.balasQuedan = BALAS_POR_CARGA;
  }

  // Solo se le puede dar mientras recarga, que es cuando ensena el tapon.
  puedeRecibirGolpe() {
    return this.estado === 'recarga';
  }

  texturaDeAhora() {
    if (this.estado === 'recarga') return TEXTURAS.jefeCapitanEspalda;
    return TEXTURAS.jefeCapitan;
  }

  // El tiron NO le corta la recarga: mientras esta de espaldas se le puede dar
  // un segundo tiron, con el parpadeo de por medio. Cortandola al primero, los
  // cinco tapones salian a casi un minuto de pelea.
  //
  // Lo que si hace cada tiron es ponerlo mas nervioso: al volver a la marcha
  // tarda menos en apuntar.
  alRecibirGolpe() {
    if (this.vidas <= 0) return;
    this.nerviosMs = Math.min(600, this.golpesEncajados * 150);
    if (this.escena.salpicarDesde) this.escena.salpicarDesde(this);
  }

  get golpesEncajados() {
    return this.vidasMaximas - this.vidas;
  }

  aMarchar(espera) {
    this.estado = 'marcha';
    const sinPrisa = espera === undefined
      ? Phaser.Math.Between(TIEMPOS.marchaMinMs, TIEMPOS.marchaMaxMs)
      : espera;
    this.cambio = this.reloj + Math.max(420, sinPrisa - (this.nerviosMs || 0));
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeCapitan);
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();

    if (this.estado === 'marcha') {
      this.patrullar(VELOCIDAD_MARCHA);
      // sin nadie en la arena no gasta polvora
      if (!this.hayAlguienEnLaArena()) {
        this.cambio = this.reloj + TIEMPOS.marchaMinMs;
        return;
      }
      if (this.reloj >= this.cambio) {
        if (this.balasQuedan <= 0) {
          this.recargar();
          return;
        }
        this.estado = 'apunta';
        this.cambio = this.reloj + TIEMPOS.avisoMs;
        this.body.velocity.x = 0;
        this.mirarAlNino();
        this.avisar(TIEMPOS.avisoMs, 0xc4a0ff);
      }
      return;
    }

    if (this.estado === 'apunta') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.disparar();
      return;
    }

    if (this.estado === 'dispara') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.aMarchar(420);
      return;
    }

    if (this.estado === 'recarga') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) {
        this.balasQuedan = BALAS_POR_CARGA;
        this.aMarchar();
      }
    }
  }

  mirarAlNino() {
    const nino = this.escena.jugadores && this.escena.jugadores[0];
    if (!nino || !nino.active) return;
    const haciaDonde = nino.x < this.x ? -1 : 1;
    if (haciaDonde !== this.direccion) this.girar(haciaDonde);
  }

  disparar() {
    this.estado = 'dispara';
    this.cambio = this.reloj + TIEMPOS.disparandoMs;
    this.balasQuedan -= 1;
    if (this.escena.lanzarBala) this.escena.lanzarBala(this);
  }

  // Se da la vuelta a recargar y ensena el tapon. ES LA VENTANA.
  recargar() {
    this.estado = 'recarga';
    this.cambio = this.reloj + TIEMPOS.recargaMs;
    this.body.velocity.x = 0;
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeCapitanEspalda);
    // un aviso amable de que ahora si: el tapon a la vista
    this.avisar(TIEMPOS.recargaMs * 0.5, 0x8fd3ff);
  }
}

export default CapitanTapon;
