// ---------------------------------------------------------------------------
// MEDELLIN: EL ABUELO
//
// El abuelo baja de la finca en su pickup doble cabina, con el tanque de agua
// en el platon y la idea muy clara de banar a sus nietos. Sombrero vueltiao y
// poncho, para que no haya duda de quien es.
//
// Es una mole: ronda su arena, avisa acelerando en el sitio, y EMBISTE de lado
// a lado. Al chocar se queda resoplando unos segundos, y esa es la unica pausa
// que da.
//
// Como se le gana: a el NO se le pega. Los golpes rebotan con un ¡clonc!. Lo
// que lo para son las CANASTILLAS de fruta que cuelgan de los balcones: se les
// da un golpe desde abajo (con la katana, con un bloque o con un cabezazo en
// pleno salto) y caen. Si una le cae encima, se lleva un abollon. Cuatro
// canastillas y se vara, enterrado en fruta.
//
// Por eso esta pelea no pide habilidad ninguna: las tres formas de tumbar una
// canastilla valen igual para Samaon y para Martain.
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

// La camioneta es apaisada, asi que no cabe en el cuadrado de los demas jefes:
// con 172 x 172 saldria nadando en aire por arriba y por abajo. El alto de la
// CAJA, en cambio, es el de todos (ver JEFE.caja): lo justo para que el nino le
// llegue al techo de un salto desde el suelo.
const MEDIDAS = { ancho: 204, alto: 136, caja: { ancho: 170, alto: 104 } };

export class Abuelo extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.abueloRonda,
      texturaHerida: TEXTURAS.abueloGolpe,
      ancho: MEDIDAS.ancho,
      alto: MEDIDAS.alto,
      caja: MEDIDAS.caja,
      vidas: 4, // cuatro canastillas
      direccion,
    });

    // La escena la usa al derrotarlo, para que se le vea varado en la fruta.
    this.texturaDeDerrota = TEXTURAS.abueloDerrotado;

    this.estado = 'ronda';
    this.cambio = TIEMPOS.rondaMinMs;
    this.canastillas = null;
  }

  // Las canastillas son suyas: se cuelgan cuando el tablero ya esta montado,
  // que es cuando la escena sabe donde hay suelo.
  prepararArena() {
    if (this.escena.plantarCanastillas) {
      this.canastillas = this.escena.plantarCanastillas(this);
    }
  }

  // A la chapa no se le hace nada. Solo cuenta lo que le cae de arriba.
  puedeRecibirGolpe() {
    return this.esperandoLaCanastilla === true;
  }

  // La canastilla que le cae encima: se le permite el golpe solo en ese momento.
  recibirCanastilla(desdeX) {
    this.esperandoLaCanastilla = true;
    const conto = this.recibirGolpe(desdeX);
    this.esperandoLaCanastilla = false;
    return conto;
  }

  texturaDeAhora() {
    if (this.estado === 'embiste') return TEXTURAS.abueloEmbiste;
    if (this.estado === 'avisa') return TEXTURAS.abueloAvisa;
    if (this.estado === 'resopla') return TEXTURAS.abueloResopla;
    return TEXTURAS.abueloRonda;
  }

  // Una canastilla encima le corta la embestida en seco.
  alRecibirGolpe() {
    this.aResoplar();
  }

  aRondar() {
    this.estado = 'ronda';
    this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.rondaMinMs, TIEMPOS.rondaMaxMs);
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.abueloRonda);
  }

  aResoplar() {
    this.estado = 'resopla';
    this.cambio = this.reloj + TIEMPOS.resoplaMs;
    this.body.velocity.x = 0;
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.abueloResopla);
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
        if (!this.esInvulnerable) this.setTexture(TEXTURAS.abueloAvisa);
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
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.abueloEmbiste);
  }

  // Se para en seco: se sacude la arena y se queda resoplando. Es la ventana
  // para tumbarle una canastilla encima.
  frenazo() {
    this.aResoplar();
    if (this.escena.sacudirArena) this.escena.sacudirArena();
    if (this.escena.salpicarDesde) this.escena.salpicarDesde(this);
  }

  destroy(fromScene) {
    if (this.canastillas) {
      this.canastillas.forEach((c) => c.active && c.destroy());
      this.canastillas = null;
    }
    super.destroy(fromScene);
  }
}

export default Abuelo;
