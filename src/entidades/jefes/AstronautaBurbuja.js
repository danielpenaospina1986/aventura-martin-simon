// ---------------------------------------------------------------------------
// SPACE COAST: EL ASTRONAUTA BURBUJA
//
// Un astronauta grandote con el casco lleno de agua jabonosa y un patico de
// caucho flotando dentro. Guarda el bano del cabo de lanzamiento.
//
// Como se le gana: no vale pegarle cuando quiera. Camina por su arena, avisa, y
// pega un PISOTON LUNAR que sacude el suelo; despues se queda unos segundos con
// las botas rebosando espuma, y ESA es la ventana para darle. Tres golpes y
// queda mareado; el cuarto lo manda flotando al espacio.
//
// Sirven los tres golpes del juego (pisarlo, la katana o un bloque), asi que
// cualquiera de los dos ninos puede con el.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

const TIEMPOS = {
  andaMinMs: 1400,
  andaMaxMs: 2600,
  avisoMs: 640,
  atascadoMs: 2500,
  impulsoSalto: 470,
};

export class AstronautaBurbuja extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.jefeAstronauta,
      texturaHerida: TEXTURAS.jefeAstronautaAtascado,
      vidas: 4, // tres pisotones y el remate
      direccion,
    });

    this.estado = 'anda';
    this.cambio = TIEMPOS.andaMinMs;
  }

  // Solo se le puede dar cuando esta con las botas llenas de espuma, o cuando
  // ya esta mareado del todo.
  puedeRecibirGolpe() {
    return this.estado === 'atascado' || this.estado === 'mareado';
  }

  texturaDeAhora() {
    if (this.estado === 'mareado') return TEXTURAS.jefeAstronautaMareado;
    if (this.estado === 'atascado') return TEXTURAS.jefeAstronautaAtascado;
    return TEXTURAS.jefeAstronauta;
  }

  alRecibirGolpe() {
    // Con el ultimo puntito se queda mareado: ya no hace falta esperar a que se
    // atasque, y el siguiente golpe lo remata.
    if (this.vidas === 1) {
      this.estado = 'mareado';
      this.body.velocity.x = 0;
      this.setTexture(TEXTURAS.jefeAstronautaMareado);
      return;
    }
    // si le dieron estando atascado, se sacude y vuelve a andar
    if (this.estado === 'atascado') this.aAndar();
  }

  aAndar() {
    this.estado = 'anda';
    this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.andaMinMs, TIEMPOS.andaMaxMs);
    if (!this.esInvulnerable) this.setTexture(TEXTURAS.jefeAstronauta);
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();

    if (this.estado === 'mareado') {
      // da tumbos en el sitio, esperando el remate
      this.body.velocity.x = Math.sin(this.reloj / 140) * 40;
      return;
    }

    if (this.estado === 'anda') {
      this.patrullar();
      // no se pone a dar pisotones si no hay nadie a quien asustar
      if (!this.hayAlguienEnLaArena()) {
        this.cambio = this.reloj + TIEMPOS.andaMinMs;
        return;
      }
      if (this.reloj >= this.cambio) {
        this.estado = 'avisa';
        this.cambio = this.reloj + TIEMPOS.avisoMs;
        this.body.velocity.x = 0;
        this.avisar(TIEMPOS.avisoMs);
      }
      return;
    }

    if (this.estado === 'avisa') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.pisotonLunar();
      return;
    }

    if (this.estado === 'salta') {
      // en cuanto vuelve a tocar suelo, se queda atascado
      if (this.body.blocked.down) this.atascarse();
      return;
    }

    if (this.estado === 'atascado') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.aAndar();
    }
  }

  pisotonLunar() {
    this.estado = 'salta';
    this.body.setVelocityY(-TIEMPOS.impulsoSalto);
    this.setTexture(TEXTURAS.jefeAstronauta);
  }

  // Cae, sacude la arena y se queda con las botas rebosando espuma.
  atascarse() {
    this.estado = 'atascado';
    this.cambio = this.reloj + TIEMPOS.atascadoMs;
    this.body.velocity.x = 0;
    this.setTexture(TEXTURAS.jefeAstronautaAtascado);

    if (this.escena.sacudirArena) this.escena.sacudirArena();
    if (this.escena.salpicarDesde) this.escena.salpicarDesde(this);
  }
}

export default AstronautaBurbuja;
