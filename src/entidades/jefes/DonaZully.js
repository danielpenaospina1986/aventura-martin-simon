// ---------------------------------------------------------------------------
// ATLANTA: DONA ZULLY
//
// La mama, con su gorro de bano, su cepillo y su manguera. No persigue a nadie:
// se planta en su arena y dispara chorros a presion.
//
// Como se le gana: no hay que pegarle, hay que ESCONDERSE. En la arena hay tres
// sombrillas clavadas; si el nino se pone detras de una, el chorro le da a la
// sombrilla, rebota y vuelve a empapar a Zully. Cuatro rebotes y se rinde.
//
// Por eso esta pelea no pide habilidad ninguna: esconderse vale igual para
// Samaon y para Martain. Mientras tanto caen jabones del techo, para que no sea
// tan comodo quedarse quieto detras de una sombrilla.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

const ADENTRO = 44; // lo que se mete desde el borde de su arena
const VAIVEN = 26; // lo que se mece en el sitio

const TIEMPOS = {
  esperaMinMs: 1500,
  esperaMaxMs: 2400,
  miradaMs: 760,
  disparandoMs: 420,
  jabonMinMs: 2400,
  jabonMaxMs: 4200,
};

export class DonaZully extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.zullyQuieta,
      texturaHerida: TEXTURAS.zullyEmpapada,
      vidas: 4, // cuatro rebotes
      direccion,
    });

    this.estado = 'espera';
    this.cambio = TIEMPOS.esperaMinMs;
    this.proximoJabon = TIEMPOS.jabonMinMs;
    this.sombrillas = null;
  }

  // Las sombrillas son suyas: se plantan cuando el tablero ya esta montado (en
  // el constructor la escena aun no sabe donde hay suelo) y se van con ella.
  prepararArena() {
    // Se mete un poco hacia dentro de su arena. Plantada en el mismo borde del
    // tablero quedaba pegada al canto derecho de la pantalla (la camara ya no
    // puede avanzar mas ahi) y, como no camina, parecia que no hubiera jefe.
    const dentro = this.x - ADENTRO;
    if (this.escena.haySoporteEn && this.escena.haySoporteEn(dentro, this.body.bottom + 6)) {
      this.x = dentro;
      this.body.reset(dentro, this.y);
    }
    this.plantada = this.x;

    if (this.escena.plantarSombrillas) {
      this.sombrillas = this.escena.plantarSombrillas(this);
    }
  }

  // Al cuerpo no se le da: lo que la empapa es su propio chorro de vuelta.
  puedeRecibirGolpe() {
    return this.esperandoElRebote === true;
  }

  texturaDeAhora() {
    if (this.estado === 'mirada') return TEXTURAS.zullyMirada;
    return TEXTURAS.zullyQuieta;
  }

  // El chorro que vuelve la empapa: se le permite el golpe solo en ese momento.
  recibirRebote(desdeX) {
    this.esperandoElRebote = true;
    const conto = this.recibirGolpe(desdeX);
    this.esperandoElRebote = false;
    return conto;
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();
    // Un vaiven corto en el sitio: no persigue a nadie, pero se la ve viva
    // desde lejos, que si no parece parte del decorado.
    if (this.plantada !== undefined) {
      this.x = this.plantada + Math.sin(this.reloj / 620) * VAIVEN;
    }
    this.body.velocity.x = 0;

    // Hasta que el nino no llega, ni dispara ni tira jabones: se queda
    // esperandolo con el cepillo en la mano.
    if (!this.hayAlguienEnLaArena()) {
      this.estado = 'espera';
      this.cambio = this.reloj + TIEMPOS.esperaMinMs;
      this.proximoJabon = TIEMPOS.jabonMinMs;
      if (!this.esInvulnerable) this.setTexture(TEXTURAS.zullyQuieta);
      return;
    }

    this.mirarAlNino();
    this.gestionarJabones(delta);

    if (this.estado === 'espera') {
      if (this.reloj >= this.cambio) {
        this.estado = 'mirada';
        this.cambio = this.reloj + TIEMPOS.miradaMs;
        if (!this.esInvulnerable) this.setTexture(TEXTURAS.zullyMirada);
        this.avisar(TIEMPOS.miradaMs, 0x8fd3ff);
      }
      return;
    }

    if (this.estado === 'mirada') {
      if (this.reloj >= this.cambio) this.disparar();
      return;
    }

    if (this.estado === 'dispara' && this.reloj >= this.cambio) {
      this.estado = 'espera';
      this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.esperaMinMs, TIEMPOS.esperaMaxMs);
      if (!this.esInvulnerable) this.setTexture(TEXTURAS.zullyQuieta);
    }
  }

  // Se vuelve hacia el nino: el chorro sale siempre hacia donde esta.
  mirarAlNino() {
    const nino = this.escena.jugadores && this.escena.jugadores[0];
    if (!nino || !nino.active) return;
    const haciaDonde = nino.x < this.x ? -1 : 1;
    if (haciaDonde !== this.direccion) this.girar(haciaDonde);
  }

  disparar() {
    this.estado = 'dispara';
    this.cambio = this.reloj + TIEMPOS.disparandoMs;
    if (this.escena.lanzarChorro) this.escena.lanzarChorro(this);
  }

  gestionarJabones(delta) {
    this.proximoJabon -= delta;
    if (this.proximoJabon > 0) return;
    this.proximoJabon = Phaser.Math.Between(TIEMPOS.jabonMinMs, TIEMPOS.jabonMaxMs);
    if (this.escena.soltarJabon) this.escena.soltarJabon(this);
  }

  destroy(fromScene) {
    if (this.sombrillas) {
      this.sombrillas.forEach((s) => s.destroy());
      this.sombrillas = null;
    }
    super.destroy(fromScene);
  }
}

export default DonaZully;
