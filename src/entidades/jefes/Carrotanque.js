// ---------------------------------------------------------------------------
// MEDELLIN: EL CARROTANQUE
//
// El camion del agua que sube a repartir bano a domicilio. Es una mole: ronda
// su arena, avisa, y EMBISTE de lado a lado. Al chocar se queda resoplando unos
// segundos, y esa es la unica pausa que da.
//
// Como se le gana: a el NO se le pega. Los golpes rebotan con un ¡clonc!. Lo
// que lo para son los MATEROS de los balcones: se les da un golpe desde abajo
// (con la katana, con un bloque o con un cabezazo en pleno salto) y caen. Si
// uno le cae encima, se lleva un abollon. Cuatro materos y se vara, cubierto de
// flores, como una silleta.
//
// Por eso esta pelea no pide habilidad ninguna: las tres formas de tirar un
// matero valen igual para Samaon y para Martain.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

const TIEMPOS = {
  rondaMinMs: 1400,
  rondaMaxMs: 2400,
  avisoMs: 700,
  embestidaMaxMs: 1900,
  resoplaMs: 2100,
};

const VELOCIDAD_RONDA = 52;
const VELOCIDAD_EMBESTIDA = 250;

export class Carrotanque extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.jefeCarrotanque,
      texturaHerida: TEXTURAS.jefeCarrotanqueFlorido,
      vidas: 4, // cuatro materos
      direccion,
    });

    this.estado = 'ronda';
    this.cambio = TIEMPOS.rondaMinMs;
    this.materos = null;
  }

  // Los materos son suyos: se cuelgan cuando el tablero ya esta montado, que es
  // cuando la escena sabe donde hay suelo.
  prepararArena() {
    if (this.escena.plantarMateros) this.materos = this.escena.plantarMateros(this);
  }

  // A la chapa no se le hace nada. Solo cuenta lo que le cae de arriba.
  puedeRecibirGolpe() {
    return this.esperandoElMatero === true;
  }

  // El matero que le cae encima: se le permite el golpe solo en ese momento.
  recibirMatero(desdeX) {
    this.esperandoElMatero = true;
    const conto = this.recibirGolpe(desdeX);
    this.esperandoElMatero = false;
    return conto;
  }

  texturaDeAhora() {
    if (this.estado === 'embiste') return TEXTURAS.jefeCarrotanqueEmbiste;
    return TEXTURAS.jefeCarrotanque;
  }

  // Un matero encima le corta la embestida en seco.
  alRecibirGolpe() {
    this.aResoplar();
  }

  aRondar() {
    this.estado = 'ronda';
    this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.rondaMinMs, TIEMPOS.rondaMaxMs);
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeCarrotanque);
  }

  aResoplar() {
    this.estado = 'resopla';
    this.cambio = this.reloj + TIEMPOS.resoplaMs;
    this.body.velocity.x = 0;
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeCarrotanque);
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();

    if (this.estado === 'ronda') {
      this.patrullar(VELOCIDAD_RONDA);
      // sin nadie delante no embiste: se queda dando vueltas
      if (!this.hayAlguienEnLaArena()) {
        this.cambio = this.reloj + TIEMPOS.rondaMinMs;
        return;
      }
      if (this.reloj >= this.cambio) {
        this.estado = 'avisa';
        this.cambio = this.reloj + TIEMPOS.avisoMs;
        this.body.velocity.x = 0;
        this.mirarAlNino();
        this.avisar(TIEMPOS.avisoMs, 0xff8a5c);
      }
      return;
    }

    if (this.estado === 'avisa') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.embestir();
      return;
    }

    if (this.estado === 'embiste') {
      this.body.velocity.x = this.direccion * VELOCIDAD_EMBESTIDA;
      const cuerpo = this.body;
      const puntaX = this.x + this.direccion * (cuerpo.halfWidth + 10);
      const seAcaba =
        (this.direccion < 0 && cuerpo.blocked.left) ||
        (this.direccion > 0 && cuerpo.blocked.right) ||
        (cuerpo.blocked.down && !this.escena.haySoporteEn(puntaX, cuerpo.bottom + 4));
      if (seAcaba || this.reloj >= this.cambio) {
        this.frenazo();
      }
      return;
    }

    if (this.estado === 'resopla') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) {
        this.girar(-this.direccion);
        this.aRondar();
      }
    }
  }

  mirarAlNino() {
    const nino = this.escena.jugadores && this.escena.jugadores[0];
    if (!nino || !nino.active) return;
    const haciaDonde = nino.x < this.x ? -1 : 1;
    if (haciaDonde !== this.direccion) this.girar(haciaDonde);
  }

  embestir() {
    this.estado = 'embiste';
    this.cambio = this.reloj + TIEMPOS.embestidaMaxMs;
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeCarrotanqueEmbiste);
  }

  // Se para en seco: se sacude la arena y se queda resoplando. Es la ventana
  // para tirarle un matero encima.
  frenazo() {
    this.aResoplar();
    if (this.escena.sacudirArena) this.escena.sacudirArena();
    if (this.escena.salpicarDesde) this.escena.salpicarDesde(this);
  }

  destroy(fromScene) {
    if (this.materos) {
      this.materos.forEach((m) => m.active && m.destroy());
      this.materos = null;
    }
    super.destroy(fromScene);
  }
}

export default Carrotanque;
