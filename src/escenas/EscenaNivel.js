// ---------------------------------------------------------------------------
// ESCENA DE NIVEL
// Monta el mundo a partir del mapa de texto, crea al jugador y aplica las
// reglas amables: sin vidas, sin game over, reaparicion en el checkpoint.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { CAMARA, CONSTRUCCION, MUNDO } from '../config/ajustes.js';
import { COLORES, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { Controles, PERFILES } from '../sistemas/controles.js';
import { Hud } from '../sistemas/hud.js';
import { construirNivel, baseY, centroX, centroY, SIMBOLOS } from '../sistemas/constructor-nivel.js';
import { pintarFondo } from '../sistemas/dibujo.js';
import { brilloMoneda, estrellitas, polvo, textoFlotante } from '../sistemas/efectos.js';
import { NIVEL_1 } from '../niveles/nivel1.js';
import { Jugador } from '../entidades/Jugador.js';

const C = MUNDO.casilla;

export class EscenaNivel extends Phaser.Scene {
  constructor() {
    super('nivel');
  }

  init(datos) {
    this.personajeId = (datos && datos.personajeId) || 'martin';
    this.datosNivel = NIVEL_1;
  }

  create() {
    const { width: ancho, height: alto } = this.scale;
    this.fondo = pintarFondo(this, ancho, alto);

    this.nivel = construirNivel(this, this.datosNivel);
    this.fondo.ajustarParallax(this.nivel.ancho);
    this.casillasOcupadas = new Map();
    this.bloques = this.physics.add.staticGroup();
    this.enemigos = this.nivel.enemigos;
    this.terminado = false;

    this.physics.world.setBounds(0, 0, this.nivel.ancho, this.nivel.alto + 400);
    this.cameras.main.setBounds(0, 0, this.nivel.ancho, this.nivel.alto);

    this.crearJugadores();
    this.conectarColisiones();

    this.hud = new Hud(this, this.jugadores, this.nivel.totalMonedas);

    const principal = this.jugadores[0];
    this.cameras.main.startFollow(principal, true, CAMARA.suavizado, CAMARA.suavizado, 0, CAMARA.desfaseY);
    this.cameras.main.setDeadzone(CAMARA.zonaMuertaAncho, CAMARA.zonaMuertaAlto);
    this.cameras.main.fadeIn(280, 0, 0, 0);

    this.input.keyboard.on('keydown-ESC', () => this.pausar());
    this.input.keyboard.on('keydown-H', () => this.alternarCajas());

    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC');
      this.input.keyboard.off('keydown-H');
    });
  }

  // --- montaje --------------------------------------------------------------

  crearJugadores() {
    // Un solo jugador por ahora. Para el modo de dos jugadores basta con
    // repetir este bloque con PERFILES.jugador2 y otro personaje.
    const datos = PERSONAJES[this.personajeId] || PERSONAJES.martin;
    const controles = new Controles(this, PERFILES.jugador1);
    const x = centroX(this.nivel.inicio.col);
    const y = baseY(this.nivel.inicio.fila) - datos.alto / 2;

    const jugador = new Jugador(this, x, y, datos, controles);
    jugador.setDepth(10);
    jugador.fijarReaparicion(x, y);

    this.jugadores = [jugador];
  }

  conectarColisiones() {
    const { solidos, plataformas, monedas, checkpoints, meta } = this.nivel;

    this.jugadores.forEach((jugador) => {
      this.physics.add.collider(jugador, solidos);
      this.physics.add.collider(jugador, this.bloques);
      // plataformas: solo frenan si el jugador viene cayendo desde arriba
      this.physics.add.collider(jugador, plataformas, null, (j, p) => {
        const cayendo = j.body.velocity.y >= 0;
        const veniaDeArriba = j.body.bottom - Math.max(0, j.body.deltaY()) <= p.body.top + 6;
        return cayendo && veniaDeArriba;
      });

      this.physics.add.overlap(jugador, monedas, (j, moneda) => this.recogerMoneda(j, moneda));
      this.physics.add.overlap(jugador, this.enemigos, (j, e) => this.tocarEnemigo(j, e));
      this.physics.add.overlap(jugador, checkpoints, (j, b) => this.tocarCheckpoint(j, b));
      if (meta) this.physics.add.overlap(jugador, meta, (j) => this.llegarMeta(j));
    });

    this.physics.add.collider(this.enemigos, solidos);
    this.physics.add.collider(this.enemigos, this.bloques);
    this.physics.add.collider(this.enemigos, plataformas);
  }

  // --- bucle ----------------------------------------------------------------

  update(tiempo, delta) {
    if (this.terminado) return;

    this.jugadores.forEach((jugador) => {
      jugador.controles.actualizar();
      jugador.actualizar(delta);

      // no dejar que se salga por los lados del mundo
      const mitad = jugador.displayWidth / 2;
      jugador.x = Phaser.Math.Clamp(jugador.x, mitad, this.nivel.ancho - mitad);

      // caer por un hueco: no se pierde nada, se vuelve al checkpoint
      if (jugador.y > this.nivel.alto + 60) {
        if (!jugador.herir()) jugador.reaparecer();
      }
    });

    this.enemigos.getChildren().forEach((enemigo) => {
      if (enemigo.active) enemigo.actualizar();
    });

    this.hud.actualizar();
  }

  // --- reglas del juego -----------------------------------------------------

  recogerMoneda(jugador, moneda) {
    if (!moneda.active) return;
    this.tweens.killTweensOf(moneda);
    brilloMoneda(this, moneda.x, moneda.y);
    moneda.destroy();
    jugador.monedas += 1;
  }

  tocarEnemigo(jugador, enemigo) {
    if (!enemigo.active || jugador.estaCongelado) return;

    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= enemigo.body.top + 16;

    if (cayendo && porEncima) {
      this.eliminarEnemigo(enemigo);
      jugador.rebotar();
    } else {
      jugador.herir();
    }
  }

  eliminarEnemigo(enemigo) {
    if (!enemigo.active) return;
    estrellitas(this, enemigo.x, enemigo.y);
    enemigo.destroy();
  }

  tocarCheckpoint(jugador, bandera) {
    if (bandera.activo) return;
    bandera.activo = true;
    bandera.setTexture(TEXTURAS.checkpointEncendido);
    textoFlotante(this, bandera.x, bandera.y - 30, '¡Punto de control!');
    this.tweens.add({
      targets: bandera,
      scaleY: { from: 1.25, to: 1 },
      duration: 240,
      ease: 'Back.easeOut',
    });
    jugador.fijarReaparicion(
      bandera.x,
      baseY(bandera.fila) - jugador.datos.alto / 2,
    );
    this.hud.animarCara(jugador);
  }

  llegarMeta(jugador) {
    if (this.terminado) return;
    this.terminado = true;
    jugador.body.setVelocity(0, 0);
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('victoria', {
        personajeId: this.personajeId,
        monedas: jugador.monedas,
        total: this.nivel.totalMonedas,
      });
    });
  }

  // --- habilidad de construir ----------------------------------------------

  clave(col, fila) {
    return `${col},${fila}`;
  }

  casillaLibre(col, fila, jugador) {
    if (col < 0 || fila < 0 || col >= this.nivel.columnas || fila >= this.nivel.filas) return false;

    const simbolo = this.nivel.casillaEn(col, fila);
    if (simbolo === SIMBOLOS.SOLIDO || simbolo === SIMBOLOS.PLATAFORMA) return false;
    if (this.casillasOcupadas.has(this.clave(col, fila))) return false;

    // que no aparezca encima del propio jugador ni de un enemigo
    const casilla = new Phaser.Geom.Rectangle(col * C, fila * C, C, C);
    if (jugador) {
      const cuerpo = new Phaser.Geom.Rectangle(
        jugador.body.x,
        jugador.body.y,
        jugador.body.width,
        jugador.body.height,
      );
      if (Phaser.Geom.Intersects.RectangleToRectangle(casilla, cuerpo)) return false;
    }

    const chocaEnemigo = this.enemigos
      .getChildren()
      .some((e) => e.active && Phaser.Geom.Intersects.RectangleToRectangle(casilla, e.getBounds()));
    return !chocaEnemigo;
  }

  colocarBloque(col, fila, jugador) {
    const bloque = this.bloques.create(centroX(col), centroY(fila), TEXTURAS.bloque);
    bloque.col = col;
    bloque.fila = fila;
    bloque.setDepth(6);
    this.casillasOcupadas.set(this.clave(col, fila), bloque);

    // solo animamos el dibujo: el cuerpo fisico ya esta a tamano completo
    bloque.setScale(0.3);
    bloque.setAlpha(0.6);
    this.tweens.add({
      targets: bloque,
      scale: 1,
      alpha: 1,
      duration: CONSTRUCCION.aparecerMs,
      ease: 'Back.easeOut',
    });

    jugador.bloques.push(bloque);
    // al poner el cuarto, desaparece el mas viejo
    while (jugador.bloques.length > CONSTRUCCION.maximo) {
      this.quitarBloque(jugador.bloques.shift());
    }
  }

  quitarBloque(bloque) {
    if (!bloque || !bloque.active) return;
    this.casillasOcupadas.delete(this.clave(bloque.col, bloque.fila));
    polvo(this, bloque.x, bloque.y);
    bloque.destroy();
  }

  // El suelo que ven los enemigos: mapa + bloques construidos.
  haySoporteEn(x, y) {
    const col = Math.floor(x / C);
    const fila = Math.floor(y / C);
    const simbolo = this.nivel.casillaEn(col, fila);
    if (simbolo === SIMBOLOS.SOLIDO || simbolo === SIMBOLOS.PLATAFORMA) return true;
    return this.casillasOcupadas.has(this.clave(col, fila));
  }

  // --- pausa y depuracion ---------------------------------------------------

  pausar() {
    if (this.terminado) return;
    this.scene.pause();
    this.scene.launch('pausa', { personajeId: this.personajeId });
  }

  alternarCajas() {
    const mundo = this.physics.world;
    if (!mundo.debugGraphic) {
      // createDebugGraphic ya deja drawDebug encendido: no hay que invertirlo
      mundo.createDebugGraphic();
      mundo.drawDebug = true;
    } else {
      mundo.drawDebug = !mundo.drawDebug;
    }
    mundo.debugGraphic.setVisible(mundo.drawDebug);
    if (!mundo.drawDebug) mundo.debugGraphic.clear();

    textoFlotante(
      this,
      this.jugadores[0].x,
      this.jugadores[0].y - 50,
      mundo.drawDebug ? 'Cajas de colisión: sí' : 'Cajas de colisión: no',
      COLORES.textoClaro,
    );
  }
}

export default EscenaNivel;
