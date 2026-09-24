// ---------------------------------------------------------------------------
// MIAMI: EL SALVAVIDAS
//
// El socorrista de la playa, que no piensa dejar entrar al mar a dos ninos sin
// banar. Se pasa la pelea subido a sus torres de vigia, tirando FLOTADORES que
// ruedan por la arena, y de vez en cuando BAJA a dar la charla.
//
// Como se le gana: arriba no se le llega, asi que hay que esperar a que baje.
// Mientras esta en el suelo vale cualquier golpe: pisarlo, la katana o un
// bloque. Aguanta ocho, con un parpadeo de nada entre uno y otro, asi que la
// pelea es larga; por eso es la que mas corazones reparte.
//
// Al octavo se resbala con su propio bloqueador y se va de bruces.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TEXTURAS } from '../../config/estilo.js';
import { MUNDO } from '../../config/ajustes.js';
import { JefeBase } from '../JefeBase.js';

const TIEMPOS = {
  vigilaMinMs: 900,
  vigilaMaxMs: 1500,
  avisoMs: 520,
  tirandoMs: 380,
  vueloMs: 560,
  sueloMs: 2600,
};

// Cuantos flotadores tira desde la torre antes de bajar a dar la cara.
const TIROS_POR_TORRE = 2;

export class Salvavidas extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.jefeSalvavidas,
      texturaHerida: TEXTURAS.jefeSalvavidasResbala,
      vidas: 8, // pelea larga, pero con corazones cayendo
      direccion,
    });

    // No anda por el suelo: va de torre en torre, asi que se mueve a mano.
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.estado = 'vigila';
    this.cambio = TIEMPOS.vigilaMinMs;
    this.tirosHechos = 0;
    this.sitios = null;
    this.torreActual = 0;
  }

  prepararArena() {
    if (this.escena.plantarTorres) this.sitios = this.escena.plantarTorres(this);
    if (!this.sitios || !this.sitios.length) return;
    // empieza en la torre de en medio, que es desde donde se le ve venir
    this.torreActual = Math.floor(this.sitios.length / 2);
    this.ponerseEn(this.sitios[this.torreActual]);
  }

  // Arriba no se le llega. Solo cuenta lo que le den mientras esta en el suelo.
  puedeRecibirGolpe() {
    return this.estado === 'suelo';
  }

  texturaDeAhora() {
    if (this.estado === 'tira') return TEXTURAS.jefeSalvavidasTira;
    return TEXTURAS.jefeSalvavidas;
  }

  ponerseEn(sitio) {
    if (!sitio) return;
    this.x = sitio.x;
    this.y = sitio.y;
    this.body.reset(sitio.x, sitio.y);
    this.body.setAllowGravity(false);
  }

  get alturaDelSuelo() {
    return MUNDO.nivelSuelo * MUNDO.casilla - this.config.alto / 2;
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;

    // Mientras no haya nadie, se queda mirando el mar.
    if (!this.hayAlguienEnLaArena()) {
      if (this.estado === 'vigila') {
        this.cambio = this.reloj + TIEMPOS.vigilaMinMs;
        this.tirosHechos = 0;
      }
      if (this.estado === 'vigila' || this.estado === 'avisa') return;
    }

    this.mirarAlNino();

    if (this.estado === 'vigila') {
      if (this.reloj < this.cambio) return;
      if (this.tirosHechos >= TIROS_POR_TORRE) {
        this.bajar();
        return;
      }
      this.estado = 'avisa';
      this.cambio = this.reloj + TIEMPOS.avisoMs;
      this.avisar(TIEMPOS.avisoMs, 0xffc04a);
      return;
    }

    if (this.estado === 'avisa') {
      if (this.reloj >= this.cambio) this.tirar();
      return;
    }

    if (this.estado === 'tira') {
      if (this.reloj >= this.cambio) {
        this.estado = 'vigila';
        this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.vigilaMinMs, TIEMPOS.vigilaMaxMs);
        if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeSalvavidas);
      }
      return;
    }

    if (this.estado === 'suelo') {
      if (this.reloj >= this.cambio) this.subir();
    }
    // 'baja' y 'sube' los lleva el tween: aqui no hay nada que hacer
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
    this.tirosHechos += 1;
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeSalvavidasTira);
    if (this.escena.lanzarFlotador) this.escena.lanzarFlotador(this, this.direccion);
  }

  // Baja a dar la charla: es la unica ventana para darle.
  bajar() {
    this.estado = 'baja';
    this.tirosHechos = 0;
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeSalvavidas);
    this.escena.tweens.add({
      targets: this,
      y: this.alturaDelSuelo,
      duration: TIEMPOS.vueloMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!this.active) return;
        this.body.reset(this.x, this.y);
        this.body.setAllowGravity(false);
        this.estado = 'suelo';
        this.cambio = this.reloj + TIEMPOS.sueloMs;
        if (this.escena.sacudirArena) this.escena.sacudirArena(0.008, 200);
      },
    });
  }

  // Se vuelve a subir, a la torre que este mas lejos del nino.
  subir() {
    if (!this.sitios || !this.sitios.length) {
      this.estado = 'vigila';
      this.cambio = this.reloj + TIEMPOS.vigilaMinMs;
      return;
    }
    this.estado = 'sube';
    const nino = this.escena.jugadores && this.escena.jugadores[0];
    let elegida = 0;
    let masLejos = -1;
    this.sitios.forEach((sitio, i) => {
      const lejania = nino ? Math.abs(sitio.x - nino.x) : i;
      if (lejania > masLejos) {
        masLejos = lejania;
        elegida = i;
      }
    });
    this.torreActual = elegida;
    const destino = this.sitios[elegida];

    this.escena.tweens.add({
      targets: this,
      x: destino.x,
      y: destino.y,
      duration: TIEMPOS.vueloMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.active) return;
        this.ponerseEn(destino);
        this.estado = 'vigila';
        this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.vigilaMinMs, TIEMPOS.vigilaMaxMs);
      },
    });
  }

  // Los golpes NO le cortan la bajada: mientras esta abajo se le puede dar
  // varias veces, con el parpadeo de por medio. Cortandola al primer golpe,
  // aguantar ocho salia a mas de un minuto de pelea, que para un nino de cinco
  // anos es una eternidad.
  alRecibirGolpe() {
    if (this.vidas <= 0) return;
    if (this.escena.salpicarDesde) this.escena.salpicarDesde(this);
  }

  destroy(fromScene) {
    if (this.escena && this.escena.torres) {
      this.escena.torres.forEach((t) => t.active && t.destroy());
      this.escena.torres = [];
    }
    super.destroy(fromScene);
  }
}

export default Salvavidas;
