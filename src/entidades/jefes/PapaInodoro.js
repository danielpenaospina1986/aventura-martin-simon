// ---------------------------------------------------------------------------
// SPACE COAST: PAPA INODORO
//
// El primer guardian del bano: una cabeza saliendo de un retrete, con la cara
// del papa. Es la primera de las versiones bizarras de Daniel que van a ir
// ocupando las cinco ciudades.
//
// Como se le gana: ronda su arena a brinquitos y hace dos cosas, las dos con
// aviso. La primera es ESCUPIR HELADITOS DE CHOCOLATE, que salen en arco y se
// estrellan contra el suelo. La segunda, cuando se harta, es ENOJARSE —cara
// roja y vapor por las orejas— y EMBESTIR de lado a lado; al final de la
// embestida se estampa y se queda ATURDIDO unos segundos, y esa es la unica
// ventana para darle.
//
// Los golpes NO le cortan la ventana: mientras esta aturdido se le puede dar
// dos o tres veces, con el parpadeo de por medio. Cortandola al primero, cuatro
// tirones salian a mas de un minuto de pelea.
//
// Sirven los tres golpes del juego (pisarlo, la katana o un bloque), asi que
// cualquiera de los dos ninos puede con el.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { JEFE } from '../../config/ajustes.js';
import { TEXTURAS } from '../../config/estilo.js';
import { JefeBase } from '../JefeBase.js';

const TIEMPOS = {
  // el brinqueo con el que ronda: alterna las dos poses de andar
  brincoMs: 300,
  esperaMinMs: 1200,
  esperaMaxMs: 2200,
  avisoEscupeMs: 420,
  avisoEmbisteMs: 700,
  velocidadEmbestida: 250,
  aturdidoMs: 2600,
  // cuantos heladitos escupe antes de hartarse y embestir
  heladitosSeguidos: 2,
};

// Su caja es mas estrecha que la de los jefes dibujados por codigo: el retrete
// ocupa unos dos tercios del ancho de su lienzo, y con la caja de casa (148) se
// comia un palmo de aire a cada lado. El alto es el de todos (ver JEFE.caja):
// lo justo para que el nino le llegue a la coronilla de un salto.
const CAJA = { ancho: 112, alto: JEFE.caja.alto };

export class PapaInodoro extends JefeBase {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, {
      textura: TEXTURAS.inodoroQuieto,
      texturaHerida: TEXTURAS.inodoroGolpe,
      caja: CAJA,
      vidas: 4,
      direccion,
    });

    // La escena la usa al derrotarlo, para que se le vea irse por el sifon.
    this.texturaDeDerrota = TEXTURAS.inodoroDerrotado;

    this.estado = 'ronda';
    this.cambio = TIEMPOS.esperaMinMs;
    this.heladitos = 0;
    this.relojBrinco = 0;
    this.enElAire = false;
  }

  // Solo cuando se ha estampado y esta viendo estrellitas.
  puedeRecibirGolpe() {
    return this.estado === 'aturdido';
  }

  texturaDeAhora() {
    if (this.estado === 'aturdido') return TEXTURAS.inodoroAturdido;
    if (this.estado === 'embiste') return TEXTURAS.inodoroEmbiste;
    if (this.estado === 'enojado') return TEXTURAS.inodoroEnojado;
    if (this.estado === 'escupe') return TEXTURAS.inodoroEscupe;
    return this.enElAire ? TEXTURAS.inodoroBrinco : TEXTURAS.inodoroQuieto;
  }

  // A proposito NO hace nada: el golpe no le corta el aturdimiento.
  alRecibirGolpe() {}

  aRondar() {
    this.estado = 'ronda';
    this.cambio = this.reloj + Phaser.Math.Between(TIEMPOS.esperaMinMs, TIEMPOS.esperaMaxMs);
    if (!this.esInvulnerable) this.setTexture(this.texturaDeAhora());
  }

  actualizar(delta) {
    this.reloj += delta;
    this.colocarBarraDeVida();

    if (this.estado === 'ronda') {
      this.rondar(delta);
      // no se pone a escupir si no hay nadie a quien darle
      if (!this.hayAlguienEnLaArena()) {
        this.cambio = this.reloj + TIEMPOS.esperaMinMs;
        return;
      }
      if (this.reloj >= this.cambio) {
        if (this.heladitos < TIEMPOS.heladitosSeguidos) this.aEscupir();
        else this.aEnojarse();
      }
      return;
    }

    if (this.estado === 'escupe') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) {
        this.heladitos += 1;
        if (this.escena.escupirHeladito) this.escena.escupirHeladito(this);
        this.aRondar();
      }
      return;
    }

    if (this.estado === 'enojado') {
      this.body.velocity.x = 0;
      if (this.reloj >= this.cambio) this.embestir();
      return;
    }

    if (this.estado === 'embiste') {
      this.body.velocity.x = this.direccion * TIEMPOS.velocidadEmbestida;
      if (this.seEstampa()) this.estamparse();
      return;
    }

    if (this.estado === 'aturdido') {
      // da tumbos en el sitio: es la ventana, tiene que leerse de lejos
      this.body.velocity.x = Math.sin(this.reloj / 120) * 40;
      if (this.reloj >= this.cambio) {
        this.heladitos = 0;
        this.aRondar();
      }
    }
  }

  // Ronda su arena a brinquitos, alternando las dos poses de andar. Un retrete
  // no camina: o da saltitos o se queda plantado.
  rondar(delta) {
    this.patrullar();
    this.relojBrinco += delta;
    if (this.relojBrinco < TIEMPOS.brincoMs) return;
    this.relojBrinco = 0;
    this.enElAire = !this.enElAire;
    if (!this.esInvulnerable) this.setTexture(this.texturaDeAhora());
  }

  aEscupir() {
    this.estado = 'escupe';
    this.cambio = this.reloj + TIEMPOS.avisoEscupeMs;
    this.body.velocity.x = 0;
    this.miraAlNino();
    this.setTexture(TEXTURAS.inodoroEscupe);
    this.avisar(TIEMPOS.avisoEscupeMs);
  }

  aEnojarse() {
    this.estado = 'enojado';
    this.cambio = this.reloj + TIEMPOS.avisoEmbisteMs;
    this.body.velocity.x = 0;
    this.miraAlNino();
    this.setTexture(TEXTURAS.inodoroEnojado);
    // el aviso va en rojo: este es el golpe que duele
    this.avisar(TIEMPOS.avisoEmbisteMs, 0xff6b5a);
  }

  embestir() {
    this.estado = 'embiste';
    this.setTexture(TEXTURAS.inodoroEmbiste);
  }

  // Se para al chocar con una pared o al llegar al borde de su arena: si no, se
  // sacaria la pelea de su propia pantalla por el porche del checkpoint.
  seEstampa() {
    const cuerpo = this.body;
    if (this.direccion < 0 && cuerpo.blocked.left) return true;
    if (this.direccion > 0 && cuerpo.blocked.right) return true;
    if (!this.arena) return false;
    if (this.direccion < 0 && this.x <= this.arena.izquierda) return true;
    return this.direccion > 0 && this.x >= this.arena.derecha - cuerpo.halfWidth;
  }

  estamparse() {
    this.estado = 'aturdido';
    this.cambio = this.reloj + TIEMPOS.aturdidoMs;
    this.body.velocity.x = 0;
    this.setTexture(TEXTURAS.inodoroAturdido);
    // se da la vuelta para la proxima, que si no embiste contra la misma pared
    this.girar(-this.direccion);

    if (this.escena.sacudirArena) this.escena.sacudirArena();
    if (this.escena.salpicarDesde) this.escena.salpicarDesde(this);
  }

  miraAlNino() {
    const nino = this.escena.jugadores && this.escena.jugadores[0];
    if (!nino || !nino.active) return;
    this.girar(nino.x < this.x ? -1 : 1);
  }
}

export default PapaInodoro;
