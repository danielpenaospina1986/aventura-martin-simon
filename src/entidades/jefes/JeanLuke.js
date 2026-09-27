// ---------------------------------------------------------------------------
// CARTAGENA: JEAN LUKE
//
// El jefe final: el nino maton de la playa. Gordo, colorado y fanfarron, con su
// camiseta de rayas celestes y un balde lleno de GLOBOS DE AGUA.
//
// Como se le gana: no de frente. Marcha por su arena y tira globos; cuando se
// le acaban, se agacha de espaldas sobre el balde a buscar mas, y ahi se queda
// desprevenido. Un golpe en ese momento (pisandolo, con la katana o con un
// bloque) y se lleva el susto. Cinco y se sienta a llorar.
//
// Es el ultimo y tiene su gracia: al jefe final de un juego que va de escaparse
// del bano se le gana empapandolo con sus propios globos.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

const TIEMPOS = {
  marchaMinMs: 1100,
  marchaMaxMs: 1900,
  avisoMs: 620,
  tirandoMs: 360,
  recargaMs: 1700,
};

const VELOCIDAD_MARCHA = 64;

// Cuantos globos tira antes de tener que agacharse a por mas. Con los golpes
// encajados va tirando mas seguido, pero la ventana de recarga no se acorta: la
// pelea se pone tensa sin volverse injusta.
const GLOBOS_POR_CARGA = 3;

export class JeanLuke extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.jeanLukeMarcha,
      texturaHerida: TEXTURAS.jeanLukeGolpe,
      vidas: 5,
      direccion,
    });

    // La escena la usa al derrotarlo, para que se le vea sentarse a llorar.
    this.texturaDeDerrota = TEXTURAS.jeanLukeDerrotado;

    this.estado = 'marcha';
    this.cambio = TIEMPOS.marchaMinMs;
    this.globosQuedan = GLOBOS_POR_CARGA;
  }

  // Solo se le puede dar mientras rebusca en el balde, que es cuando esta de
  // espaldas y desprevenido.
  puedeRecibirGolpe() {
    return this.estado === 'recarga';
  }

  texturaDeAhora() {
    if (this.estado === 'recarga') return TEXTURAS.jeanLukeRecarga;
    if (this.estado === 'apunta') return TEXTURAS.jeanLukeApunta;
    if (this.estado === 'tira') return TEXTURAS.jeanLukeTira;
    return TEXTURAS.jeanLukeMarcha;
  }

  ponerPose() {
    if (!this.esInvulnerable) this.setTexture(this.texturaDeAhora());
  }

  // El golpe NO le corta la recarga: mientras esta de espaldas se le puede dar
  // un segundo golpe, con el parpadeo de por medio. Cortandola al primero, los
  // cinco salian a casi un minuto de pelea.
  //
  // Lo que si hace cada golpe es ponerlo mas nervioso: al volver a la marcha
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
    this.ponerPose();
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();

    if (this.estado === 'marcha') {
      this.patrullar(VELOCIDAD_MARCHA);
      // sin nadie en la arena no gasta globos
      if (!this.hayAlguienEnLaArena()) {
        this.cambio = this.reloj + TIEMPOS.marchaMinMs;
        return;
      }
      if (this.reloj >= this.cambio) {
        if (this.globosQuedan <= 0) {
          this.recargar();
          return;
        }
        this.estado = 'apunta';
        this.cambio = this.reloj + TIEMPOS.avisoMs;
        this.body.velocity.x = 0;
        this.mirarAlNino();
        this.ponerPose();
        this.avisar(TIEMPOS.avisoMs, 0xffc04a);
      }
      return;
    }

    if (this.estado === 'apunta') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.tirar();
      return;
    }

    if (this.estado === 'tira') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.aMarchar(420);
      return;
    }

    if (this.estado === 'recarga') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) {
        this.globosQuedan = GLOBOS_POR_CARGA;
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

  tirar() {
    this.estado = 'tira';
    this.cambio = this.reloj + TIEMPOS.tirandoMs;
    this.globosQuedan -= 1;
    this.ponerPose();
    if (this.escena.lanzarGlobo) this.escena.lanzarGlobo(this);
  }

  // Se agacha de espaldas sobre el balde. ES LA VENTANA.
  recargar() {
    this.estado = 'recarga';
    this.cambio = this.reloj + TIEMPOS.recargaMs;
    this.body.velocity.x = 0;
    this.ponerPose();
    // un aviso amable de que ahora si: esta de espaldas
    this.avisar(TIEMPOS.recargaMs * 0.5, 0x8fd3ff);
  }
}

export default JeanLuke;
