// ---------------------------------------------------------------------------
// ESCENA DE NIVEL
// Monta el mundo a partir del mapa de texto, crea al jugador y aplica las
// reglas amables: sin vidas, sin game over, reaparicion en el checkpoint.
//
// Al final del nivel espera el jefe. Hasta que no se le derrota, la meta esta
// cerrada.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { AGUA, CAMARA, JEFE, LANZAMIENTO, MUNDO, PALOMA, PUNTOS } from '../config/ajustes.js';
import { COLORES, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { Controles, PERFILES } from '../sistemas/controles.js';
import { Hud } from '../sistemas/hud.js';
import { construirNivel, baseY, centroX, SIMBOLOS } from '../sistemas/constructor-nivel.js';
import { pintarFondo } from '../sistemas/dibujo.js';
import { brilloMoneda, estrellitas, polvo, textoFlotante } from '../sistemas/efectos.js';
import { nivelPorIndice, TOTAL_NIVELES } from '../niveles/index.js';
import { Jugador } from '../entidades/Jugador.js';
import { Paloma } from '../entidades/Paloma.js';

const C = MUNDO.casilla;

export class EscenaNivel extends Phaser.Scene {
  constructor() {
    super('nivel');
  }

  init(datos) {
    const d = datos || {};
    this.personajeId = d.personajeId || 'martin';
    this.indiceNivel = d.indiceNivel || 0;
    this.datosNivel = nivelPorIndice(this.indiceNivel);

    // El marcador se arrastra de un nivel al siguiente: es la partida entera.
    this.acumulado = {
      monedas: d.monedas || 0,
      recogidas: d.recogidas || 0,
      golpes: d.golpes || 0,
      jefesDerrotados: d.jefesDerrotados || 0,
      enemigosVencidos: d.enemigosVencidos || 0,
    };
  }

  create() {
    const { width: ancho, height: alto } = this.scale;
    this.fondo = pintarFondo(this, ancho, alto, {
      textura: TEXTURAS.fondoDe(this.datosNivel.fondo || ''),
    });

    this.datosPersonaje = PERSONAJES[this.personajeId] || PERSONAJES.martin;
    this.nivel = construirNivel(this, this.datosNivel, {
      texturaMoneda: this.datosPersonaje.moneda,
    });
    this.fondo.ajustarParallax(this.nivel.ancho);
    this.enemigos = this.nivel.enemigos;
    this.jefe = this.nivel.jefe;
    this.terminado = false;

    // bloques que Samaon lanza por los aires
    this.proyectiles = this.physics.add.group();
    // lo que sueltan los bichos: agua con jabon y lo de las palomas
    this.peligros = this.physics.add.group();
    this.palomas = this.physics.add.group({ allowGravity: false });
    this.proximaPaloma = this.esperaDePaloma();

    this.physics.world.setBounds(0, 0, this.nivel.ancho, this.nivel.alto + 400);
    this.cameras.main.setBounds(0, 0, this.nivel.ancho, this.nivel.alto);

    this.crearJugadores();
    this.conectarColisiones();

    this.hud = new Hud(this, this.jugadores, this.nivel.totalMonedas, {
      numero: this.indiceNivel + 1,
      total: TOTAL_NIVELES,
      nombre: this.datosNivel.nombre,
    });

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
    const datos = this.datosPersonaje;
    const controles = new Controles(this, PERFILES.jugador1);
    const x = centroX(this.nivel.inicio.col);
    const y = baseY(this.nivel.inicio.fila) - datos.alto / 2;

    const jugador = new Jugador(this, x, y, datos, controles);
    jugador.setDepth(10);
    jugador.fijarReaparicion(x, y);

    // arranca con lo que traiga de los niveles anteriores
    jugador.monedas = this.acumulado.monedas;
    jugador.recogidas = this.acumulado.recogidas;
    jugador.golpes = this.acumulado.golpes;
    jugador.jefesDerrotados = this.acumulado.jefesDerrotados;
    jugador.enemigosVencidos = this.acumulado.enemigosVencidos;

    this.jugadores = [jugador];
  }

  conectarColisiones() {
    const { solidos, plataformas, monedas, checkpoints, meta } = this.nivel;

    // las plataformas solo frenan si se viene cayendo desde arriba
    const soloDesdeArriba = (j, p) => {
      const cayendo = j.body.velocity.y >= 0;
      const veniaDeArriba = j.body.bottom - Math.max(0, j.body.deltaY()) <= p.body.top + 6;
      return cayendo && veniaDeArriba;
    };

    this.jugadores.forEach((jugador) => {
      this.physics.add.collider(jugador, solidos);
      this.physics.add.collider(jugador, plataformas, null, soloDesdeArriba);

      this.physics.add.overlap(jugador, monedas, (j, moneda) => this.recogerMoneda(j, moneda));
      this.physics.add.overlap(jugador, this.enemigos, (j, e) => this.tocarEnemigo(j, e));
      this.physics.add.overlap(jugador, checkpoints, (j, b) => this.tocarCheckpoint(j, b));
      if (meta) this.physics.add.overlap(jugador, meta, (j) => this.llegarMeta(j));
      if (this.jefe) this.physics.add.overlap(jugador, this.jefe, (j, jefe) => this.tocarJefe(j, jefe));
    });

    this.physics.add.collider(this.enemigos, solidos);
    this.physics.add.collider(this.enemigos, plataformas);

    // lo que tiran los bichos hace dano al nino y se deshace contra el suelo
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.peligros, (j, p) => {
        this.romperPeligro(this.peligros.contains(j) ? j : p);
        this.herirJugador(jugador);
      });
    });
    this.physics.add.collider(this.peligros, solidos, (a, b) => {
      this.romperPeligro(this.peligros.contains(a) ? a : b);
    });

    if (this.jefe) this.physics.add.collider(this.jefe, solidos);

    // Los bloques lanzados se rompen contra el escenario y contra los bichos.
    //
    // Ojo: Phaser no garantiza el orden de los dos objetos en el callback
    // (cuando enfrenta un grupo con un sprite suelto, los invierte). Si se da
    // por hecho el orden, se acaba "rompiendo" al jefe en vez de al bloque.
    // Por eso siempre se mira cual de los dos es el proyectil.
    const cualEsElProyectil = (a, b) => (this.proyectiles.contains(a) ? a : b);
    const elOtro = (a, b, proyectil) => (proyectil === a ? b : a);

    this.physics.add.collider(this.proyectiles, solidos, (a, b) => {
      this.romperProyectil(cualEsElProyectil(a, b));
    });
    this.physics.add.overlap(this.proyectiles, this.enemigos, (a, b) => {
      const proyectil = cualEsElProyectil(a, b);
      this.eliminarEnemigo(elOtro(a, b, proyectil));
      this.romperProyectil(proyectil);
    });
    if (this.jefe) {
      this.physics.add.overlap(this.proyectiles, this.jefe, (a, b) => {
        const proyectil = cualEsElProyectil(a, b);
        this.golpearJefe(proyectil.x);
        this.romperProyectil(proyectil);
      });
    }
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
        if (!this.herirJugador(jugador)) jugador.reaparecer();
      }
    });

    this.enemigos.getChildren().forEach((enemigo) => {
      if (enemigo.active) enemigo.actualizar(delta);
    });

    if (this.jefe && this.jefe.active) this.jefe.actualizar(delta);

    this.palomas.getChildren().forEach((paloma) => {
      if (paloma.active) paloma.actualizar(delta);
    });
    this.gestionarPalomas(delta);

    this.peligros.getChildren().forEach((peligro) => {
      if (!peligro.active) return;
      if (peligro.y > this.nivel.alto + 40) this.romperPeligro(peligro, false);
    });

    this.proyectiles.getChildren().forEach((proyectil) => {
      if (!proyectil.active) return;
      proyectil.angle += ((LANZAMIENTO.giro * delta) / 1000) * proyectil.sentido;
      if (proyectil.y > this.nivel.alto + 40) this.romperProyectil(proyectil, false);
    });

    this.hud.actualizar();
  }

  // --- reglas del juego -----------------------------------------------------

  recogerMoneda(jugador, moneda) {
    if (!moneda.active) return;
    this.tweens.killTweensOf(moneda);
    brilloMoneda(this, moneda.x, moneda.y, this.datosPersonaje.moneda);
    moneda.destroy();
    jugador.monedas += PUNTOS.porMoneda;
    jugador.recogidas += 1;
  }

  tocarEnemigo(jugador, enemigo) {
    if (!enemigo.active || jugador.estaCongelado) return;

    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= enemigo.body.top + 16;

    if (cayendo && porEncima) {
      this.eliminarEnemigo(enemigo);
      jugador.rebotar();
    } else {
      this.herirJugador(jugador);
    }
  }

  // Un golpe no quita vidas (no hay), pero cuesta monedas. El marcador final es
  // lo que has ganado menos lo que te ha costado llegar.
  herirJugador(jugador) {
    if (!jugador.herir()) return false;

    jugador.golpes += 1;
    const antes = jugador.monedas;
    jugador.monedas = Math.max(PUNTOS.minimo, jugador.monedas + PUNTOS.porGolpe);
    const perdidas = antes - jugador.monedas;

    if (perdidas > 0) {
      textoFlotante(this, jugador.x, jugador.y - 40, `-${perdidas}`, '#ff6b6b');
    }
    this.hud.animarCara(jugador);
    return true;
  }

  eliminarEnemigo(enemigo) {
    if (!enemigo.active) return;
    estrellitas(this, enemigo.x, enemigo.y);

    // los bichos pequenos tambien dan premio
    const jugador = this.jugadores[0];
    jugador.monedas += PUNTOS.porEnemigo;
    jugador.enemigosVencidos += 1;
    textoFlotante(this, enemigo.x, enemigo.y - 22, `+${PUNTOS.porEnemigo}`, COLORES.textoAcento);

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
    jugador.fijarReaparicion(bandera.x, baseY(bandera.fila) - jugador.datos.alto / 2);
    this.hud.animarCara(jugador);
  }

  llegarMeta(jugador) {
    if (this.terminado) return;

    // con el jefe vivo, la meta esta cerrada
    if (this.jefe && this.jefe.active) {
      if (!this.avisoMetaHasta || this.time.now > this.avisoMetaHasta) {
        this.avisoMetaHasta = this.time.now + 1600;
        textoFlotante(this, jugador.x, jugador.y - 54, '¡Primero el jefe!', COLORES.textoClaro);
      }
      return;
    }

    this.terminado = true;
    jugador.body.setVelocity(0, 0);
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('victoria', {
        personajeId: this.personajeId,
        indiceNivel: this.indiceNivel,
        nombreNivel: this.datosNivel.nombre,
        monedas: jugador.monedas,
        total: this.nivel.totalMonedas,
        recogidas: jugador.recogidas,
        golpes: jugador.golpes,
        jefesDerrotados: jugador.jefesDerrotados,
        enemigosVencidos: jugador.enemigosVencidos,
      });
    });
  }

  // --- el jefe --------------------------------------------------------------

  tocarJefe(jugador, jefe) {
    if (!jefe.active || jugador.estaCongelado) return;

    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= jefe.body.top + 20;

    if (cayendo && porEncima) {
      jugador.body.velocity.y = -JEFE.reboteJugador;
      jugador.saltoRecortado = false;
      this.golpearJefe(jugador.x);
    } else {
      this.herirJugador(jugador);
    }
  }

  golpearJefe(desdeX) {
    if (!this.jefe || !this.jefe.active) return;
    if (!this.jefe.recibirGolpe(desdeX)) return;

    estrellitas(this, this.jefe.x, this.jefe.y, 7);
    this.cameras.main.shake(140, 0.006);

    if (this.jefe.derrotado) {
      this.derrotarJefe();
    } else {
      textoFlotante(
        this,
        this.jefe.x,
        this.jefe.y - 46,
        `¡Le quedan ${this.jefe.vidas}!`,
        COLORES.textoClaro,
      );
    }
  }

  derrotarJefe() {
    const { x, y } = this.jefe;
    estrellitas(this, x, y, 18);
    estrellitas(this, x - 24, y - 10, 10);
    estrellitas(this, x + 24, y + 6, 10);
    this.cameras.main.shake(320, 0.01);
    this.jefe.destroy();
    this.jefe = null;

    const jugador = this.jugadores[0];
    jugador.monedas += PUNTOS.porJefe;
    jugador.jefesDerrotados += 1;

    textoFlotante(this, x, y - 40, '¡Jefe derrotado!', COLORES.textoAcento);
    textoFlotante(this, x, y - 8, `+${PUNTOS.porJefe}`, COLORES.textoAcento);
    this.hud.animarCara(jugador);
    this.abrirMeta();
  }

  // La meta esta apagada mientras el jefe vive; al caer, se enciende.
  abrirMeta() {
    const meta = this.nivel.meta;
    if (!meta) return;
    meta.setAlpha(1);
    this.tweens.add({
      targets: meta,
      scaleY: { from: 0.8, to: 1 },
      duration: 320,
      ease: 'Back.easeOut',
    });
    textoFlotante(this, meta.x, meta.y - 60, '¡La meta está abierta!', COLORES.textoAcento);
  }

  // --- bloques lanzados -----------------------------------------------------

  proyectilesVivos() {
    return this.proyectiles.getChildren().filter((p) => p.active).length;
  }

  lanzarBloque(jugador) {
    const dir = jugador.mirando;
    const proyectil = this.proyectiles.create(
      jugador.x + dir * (jugador.datos.ancho / 2 + 10),
      jugador.y + (LANZAMIENTO.salidaY || 0),
      TEXTURAS.bloque,
    );

    proyectil.setDepth(8);
    proyectil.sentido = dir;
    proyectil.body.setSize(26, 26, true);
    proyectil.body.setAllowGravity(true);
    proyectil.body.setGravityY(LANZAMIENTO.gravedad - this.physics.world.gravity.y);
    proyectil.body.setVelocity(dir * LANZAMIENTO.velocidad, LANZAMIENTO.elevacion);

    proyectil.setScale(0.5);
    this.tweens.add({
      targets: proyectil,
      scale: 1,
      duration: LANZAMIENTO.aparecerMs,
      ease: 'Back.easeOut',
    });

    // si no da a nada, se deshace solo
    proyectil.temporizador = this.time.delayedCall(LANZAMIENTO.duracionMs, () =>
      this.romperProyectil(proyectil),
    );
  }

  romperProyectil(proyectil, conPolvo = true) {
    if (!proyectil || !proyectil.active) return;
    if (proyectil.temporizador) proyectil.temporizador.remove();
    if (conPolvo) polvo(this, proyectil.x, proyectil.y);
    proyectil.destroy();
  }

  // --- lo que tiran los bichos ---------------------------------------------

  lanzarAgua(banera) {
    const dir = banera.direccion;
    const agua = this.peligros.create(
      banera.x + dir * 18,
      banera.y - 20,
      TEXTURAS.agua,
    );
    agua.setDepth(9);
    agua.body.setAllowGravity(true);
    agua.body.setGravityY(AGUA.gravedad - this.physics.world.gravity.y);
    agua.body.setVelocity(dir * AGUA.velocidad, AGUA.elevacion);
    agua.body.setSize(AGUA.tamano - 8, AGUA.tamano - 8, true);
    agua.temporizador = this.time.delayedCall(AGUA.duracionMs, () => this.romperPeligro(agua));

    this.tweens.add({
      targets: agua,
      angle: dir * 220,
      duration: AGUA.duracionMs,
    });
  }

  soltarCaida(paloma) {
    const caida = this.peligros.create(paloma.x, paloma.y + 16, TEXTURAS.caida);
    caida.setDepth(9);
    caida.body.setAllowGravity(true);
    caida.body.setGravityY(PALOMA.caida.gravedad - this.physics.world.gravity.y);
    caida.body.setVelocity(paloma.body.velocity.x * 0.35, 0);
    caida.temporizador = this.time.delayedCall(4000, () => this.romperPeligro(caida));
  }

  romperPeligro(peligro, conSalpicadura = true) {
    if (!peligro || !peligro.active) return;
    if (peligro.temporizador) peligro.temporizador.remove();
    if (conSalpicadura) polvo(this, peligro.x, peligro.y);
    peligro.destroy();
  }

  // --- las palomas -----------------------------------------------------------

  esperaDePaloma() {
    const recorte = Math.max(0, 1 - this.indiceNivel * PALOMA.recortePorNivel);
    const minimo = Math.max(PALOMA.esperaMinima, PALOMA.esperaMinMs * recorte);
    const maximo = Math.max(minimo + 1500, PALOMA.esperaMaxMs * recorte);
    return Phaser.Math.Between(minimo, maximo);
  }

  gestionarPalomas(delta) {
    this.proximaPaloma -= delta;
    if (this.proximaPaloma > 0) return;
    this.proximaPaloma = this.esperaDePaloma();

    // entra por el lado contrario al que mira la camara, para que se la vea venir
    const camara = this.cameras.main;
    const desdeLaDerecha = Math.random() < 0.72;
    const x = desdeLaDerecha ? camara.scrollX + this.scale.width + 70 : camara.scrollX - 70;
    const fila = Phaser.Math.FloatBetween(PALOMA.alturaMinFila, PALOMA.alturaMaxFila);
    const y = fila * MUNDO.casilla;

    const paloma = new Paloma(this, x, y, desdeLaDerecha ? -1 : 1);
    this.palomas.add(paloma);
  }

  // El suelo que ven los enemigos y el jefe.
  haySoporteEn(x, y) {
    const col = Math.floor(x / C);
    const fila = Math.floor(y / C);
    const simbolo = this.nivel.casillaEn(col, fila);
    return simbolo === SIMBOLOS.SOLIDO || simbolo === SIMBOLOS.PLATAFORMA;
  }

  // --- pausa y depuracion ---------------------------------------------------

  pausar() {
    if (this.terminado) return;
    this.scene.pause();
    this.scene.launch('pausa', {
      personajeId: this.personajeId,
      indiceNivel: this.indiceNivel,
      nombreNivel: this.datosNivel.nombre,
    });
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
