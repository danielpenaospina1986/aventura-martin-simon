// ---------------------------------------------------------------------------
// LA BASE DE LOS JEFES
//
// Lo que tienen en comun los cinco guardianes del bano: las vidas con su barra
// de puntitos, el parpadeo al recibir un golpe, el aviso antes de atacar y el
// papel de portero (mientras viva, la meta esta cerrada).
//
// Lo que NO esta aqui es COMO se le gana: eso lo pone cada jefe, y es lo que
// hace que cada ciudad se juegue distinto. Un hijo solo tiene que decir:
//
//   actualizar(delta)     que hace en cada fotograma
//   puedeRecibirGolpe()   cuando esta expuesto (por defecto, siempre)
//
// Regla de la casa: cualquiera de los dos ninos tiene que poder ganarle a
// todos, y ningun ataque llega sin avisar antes.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { JEFE } from '../config/ajustes.js';
import { COLORES, TEXTURAS } from '../config/estilo.js';

export class JefeBase extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, config = {}) {
    super(escena, x, y, config.textura || TEXTURAS.jefe);

    this.escena = escena;
    this.config = {
      textura: TEXTURAS.jefe,
      texturaHerida: TEXTURAS.jefeEnfadado,
      ancho: JEFE.ancho,
      alto: JEFE.alto,
      caja: JEFE.caja,
      vidas: JEFE.vidas,
      velocidad: JEFE.velocidad,
      ...config,
    };

    escena.add.existing(this);
    escena.physics.add.existing(this);

    // Su dibujo se genera a la densidad del render, asi que hay que fijarle el
    // tamano de juego; y la caja se mide en pixeles de la textura, asi que hay
    // que dividirla por la escala que acaba de quedar.
    this.setDisplaySize(this.config.ancho, this.config.alto);
    const escalaX = this.scaleX || 1;
    const escalaY = this.scaleY || 1;
    this.body.setSize(this.config.caja.ancho / escalaX, this.config.caja.alto / escalaY, false);
    this.body.setOffset(
      (this.config.ancho - this.config.caja.ancho) / 2 / escalaX,
      (this.config.alto - this.config.caja.alto) / escalaY,
    );
    this.body.setMaxVelocity(260, 900);

    this.direccion = config.direccion === undefined ? -1 : config.direccion;
    this.setFlipX(this.direccion < 0);
    this.setDepth(9);

    this.vidasMaximas = this.config.vidas;
    this.vidas = this.config.vidas;
    this.reloj = 0;
    this.invulnerableHasta = 0;

    this.crearBarraDeVida();
  }

  get esInvulnerable() {
    return this.reloj < this.invulnerableHasta;
  }

  get derrotado() {
    return this.vidas <= 0;
  }

  // Cuando esta expuesto. Por defecto siempre; los jefes con truco lo aprietan.
  puedeRecibirGolpe() {
    return true;
  }

  // Tantos puntitos encima de la cabeza como golpes aguante, sobre una chapa
  // oscura: sueltos, se confundian con los premios, que tambien son rojos.
  crearBarraDeVida() {
    const cuantos = this.vidasMaximas;
    this.chapa = this.escena.add
      .rectangle(0, 0, cuantos * 34 + 16, 30, COLORES.decoFondo, 0.85)
      .setStrokeStyle(2, COLORES.decoMarco, 0.95)
      .setDepth(10);

    this.puntos = [];
    for (let i = 0; i < cuantos; i += 1) {
      this.puntos.push(
        this.escena.add
          .circle(0, 0, 11, COLORES.jefeVida)
          .setStrokeStyle(3, 0x16202c, 0.8)
          .setDepth(11),
      );
    }
    this.colocarBarraDeVida();
  }

  colocarBarraDeVida() {
    const separacion = 34;
    const arriba = this.y - this.config.alto / 2 - 20;
    if (this.chapa) this.chapa.setPosition(this.x, arriba);
    const inicio = this.x - ((this.vidasMaximas - 1) * separacion) / 2;
    this.puntos.forEach((punto, i) => {
      punto.setPosition(inicio + i * separacion, arriba);
      punto.setFillStyle(i < this.vidas ? COLORES.jefeVida : COLORES.jefeVidaVacia);
    });
  }

  girar(nuevaDireccion) {
    this.direccion = nuevaDireccion;
    this.setFlipX(nuevaDireccion < 0);
  }

  // Da la vuelta al llegar a una pared o al borde de su arena.
  patrullar(velocidad = this.config.velocidad) {
    const cuerpo = this.body;
    if (cuerpo.blocked.left) this.girar(1);
    else if (cuerpo.blocked.right) this.girar(-1);
    else if (cuerpo.blocked.down) {
      const puntaX = this.x + this.direccion * (cuerpo.halfWidth + 8);
      if (!this.escena.haySoporteEn(puntaX, cuerpo.bottom + 4)) this.girar(-this.direccion);
    }
    cuerpo.velocity.x = this.direccion * velocidad;
  }

  // Ningun ataque llega sin avisar: el jefe se pone en tension y sale un signo
  // encima. Da tiempo a apartarse, que es lo que hace justa la pelea.
  avisar(duracionMs, color = 0xffd54a) {
    if (this.aviso) this.aviso.destroy();

    this.aviso = this.escena.add
      .text(this.x, this.y - this.config.alto / 2 - 46, '!', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#ffffff',
        stroke: '#16202c',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.escena.tweens.add({
      targets: this.aviso,
      scaleX: { from: 0.5, to: 1.15 },
      scaleY: { from: 0.5, to: 1.15 },
      duration: 160,
      yoyo: true,
      repeat: Math.max(0, Math.round(duracionMs / 320) - 1),
      onComplete: () => {
        if (this.aviso) this.aviso.destroy();
        this.aviso = null;
      },
    });

    // Se tine mientras dura el aviso y se le quita el tinte al acabar. Ojo: el
    // tinte NO se anima con un tween (es un color, no un numero); animandolo se
    // quedaba pegado y el jefe se veia de un solo color, como un muneco de
    // plastico.
    this.setTint(color);
    this.escena.time.delayedCall(duracionMs, () => {
      if (this.active) this.clearTint();
    });
  }

  // Devuelve true si el golpe ha contado.
  recibirGolpe(desdeX) {
    if (this.esInvulnerable || !this.active) return false;
    if (!this.puedeRecibirGolpe()) {
      this.rebotar();
      return false;
    }

    this.vidas -= 1;
    this.invulnerableHasta = this.reloj + JEFE.invulnerableMs;

    // retrocede un poco, para que se note el impacto
    const empujon = this.x < desdeX ? -1 : 1;
    this.body.velocity.x = empujon * JEFE.empujonAlHerir * 3;

    this.setTexture(this.config.texturaHerida);
    this.escena.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.3 },
      duration: JEFE.parpadeoMs,
      yoyo: true,
      repeat: Math.floor(JEFE.invulnerableMs / (JEFE.parpadeoMs * 2)) - 1,
      onComplete: () => {
        this.setAlpha(1);
        if (this.active) this.setTexture(this.texturaDeAhora());
      },
    });

    this.colocarBarraDeVida();
    this.alRecibirGolpe();
    return true;
  }

  // Que textura le toca segun su estado. Los jefes con varias poses la pisan.
  texturaDeAhora() {
    return this.config.textura;
  }

  // Gancho para los hijos: pasar de fase, cambiar de humor, lo que haga falta.
  alRecibirGolpe() {}

  // Se le llama cuando el tablero YA esta montado, no al nacer: un jefe nace
  // dentro de construirNivel, cuando la escena todavia no sabe donde esta el
  // suelo. Lo que necesite mirar el terreno (plantar sombrillas, por ejemplo)
  // va aqui.
  prepararArena() {}

  // Cuando el golpe no cuenta porque no esta expuesto: un ¡clonc! y nada mas.
  rebotar() {
    if (this.escena.tweens.isTweening(this)) return;
    this.escena.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.08,
      duration: 90,
      yoyo: true,
    });
  }

  actualizar(delta) {
    this.reloj += delta;
    this.patrullar();
    this.colocarBarraDeVida();
  }

  destroy(fromScene) {
    if (this.puntos) this.puntos.forEach((punto) => punto.destroy());
    this.puntos = null;
    if (this.chapa) this.chapa.destroy();
    this.chapa = null;
    if (this.aviso) this.aviso.destroy();
    this.aviso = null;
    super.destroy(fromScene);
  }
}

export default JefeBase;
