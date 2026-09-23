// ---------------------------------------------------------------------------
// ESCENA DE NIVEL
// Monta el mundo a partir del mapa de texto, crea al jugador y aplica las
// reglas amables: sin vidas, sin game over, reaparicion en el checkpoint.
//
// Al final del nivel espera el jefe. Hasta que no se le derrota, la meta esta
// cerrada.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { AGUA, CAMARA, ENEMIGO, JEFE, JUGADOR, LANZAMIENTO, MUNDO, PALOMA, PUNTOS, RENDER, VIDA } from '../config/ajustes.js';
import { COLORES, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { Controles, PERFILES } from '../sistemas/controles.js';
import { Hud } from '../sistemas/hud.js';
import { construirNivel, baseY, centroX, SIMBOLOS } from '../sistemas/constructor-nivel.js';
import { aEscalaDeJuego, escalaDeJuego, pintarFondo } from '../sistemas/dibujo.js';
import { montarPrimerPlano, Planos } from '../sistemas/planos.js';
import { ciudadDe } from '../config/ciudades.js';
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

    // Las vidas son de la partida entera; los corazones, de cada tablero.
    this.vidas = d.vidas === undefined ? VIDA.vidasIniciales : d.vidas;
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de 640 x 360 de siempre.
    // Hay que recentrarla: con zoom, una camara sin tocar mira el centro de su
    // propio tamano en pixeles, que ya no es el centro del juego.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;
    this.fondo = pintarFondo(this, ancho, alto, {
      textura: TEXTURAS.fondoDe(this.datosNivel.fondo || ''),
    });

    this.datosPersonaje = PERSONAJES[this.personajeId] || PERSONAJES.martin;
    this.nivel = construirNivel(this, this.datosNivel, {
      texturaMoneda: this.datosPersonaje.moneda,
    });
    // Cada plano se mueve a su velocidad respecto a la camara. Se lleva a mano
    // y no con scrollFactor, porque scrollFactor y el zoom de la camara no se
    // llevan bien.
    this.planos = new Planos();
    this.fondo.ajustarParallax(this.nivel.ancho);
    this.planos.anadir(this.fondo.imagen, this.fondo.velocidad || 0);

    // El plano de delante: ramas, faroles y matas que cruzan pegados a la
    // camara. De momento son los mismos en las cinco ciudades.
    // Cada ciudad tiene sus adornos de primer plano; las que no traen los
    // suyos se quedan con los provisionales.
    const suyos = ciudadDe(this.datosNivel.fondo || '').frente;
    montarPrimerPlano(this, ancho, alto, this.nivel.ancho, suyos, this.planos);
    this.enemigos = this.nivel.enemigos;
    this.jefe = this.nivel.jefe;
    this.terminado = false;

    // bloques que Samaon lanza por los aires
    this.proyectiles = this.physics.add.group();
    // lo que sueltan los bichos: agua con jabon y lo de las palomas
    this.peligros = this.physics.add.group();
    this.palomas = this.physics.add.group({ allowGravity: false });
    // corazones y vidas que sueltan los bichos, esperando en el suelo
    this.regalos = this.physics.add.group({ allowGravity: true });
    this.proximaPaloma = this.esperaDePaloma();

    this.physics.world.setBounds(0, 0, this.nivel.ancho, this.nivel.alto + 400);
    // Alto de pantalla, no del mundo: el terreno llega mas abajo del borde a
    // proposito (para que no se vea el fondo por debajo), pero la camara no
    // debe bajar a mirarlo. Con las tres alturas cabiendo en pantalla, moverla
    // en vertical solo descoloca el HUD.
    this.cameras.main.setBounds(0, 0, this.nivel.ancho, MUNDO.alto);

    this.crearJugadores();
    this.conectarColisiones();

    this.hud = new Hud(this, this.jugadores, this.nivel.totalMonedas, {
      numero: this.indiceNivel + 1,
      total: TOTAL_NIVELES,
      nombre: this.datosNivel.nombre,
    }, this.vidas);
    this.planos.fijar(this.hud.piezas);

    // Los planos se colocan justo antes de dibujar, no en el update: la camara
    // no termina de seguir al nino hasta despues, y hacerlo antes dejaba el HUD
    // temblando un fotograma por detras.
    this.events.on('prerender', () => {
      if (this.planos) this.planos.actualizar(this.cameras.main);
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
    jugador.corazones = VIDA.corazonesPorNivel;

    // Cada cuanto un bicho suelta corazon y una paloma una vida. Se guarda en
    // la escena y no se lee de la constante para poder apagarlo desde las
    // pruebas: con el azar suelto, medir cuantas monedas da un bicho era una
    // moneda al aire.
    this.probabilidadCorazon = VIDA.probabilidadCorazon;
    this.probabilidadVidaExtra = VIDA.probabilidadVidaExtra;

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

    // A la paloma se le puede saltar encima. De lado no pasa nada: va por el
    // aire y castigar un roce seria injusto.
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.palomas, (a, b) => {
        this.tocarPaloma(jugador, this.palomas.contains(a) ? a : b);
      });
    });
    this.physics.add.collider(this.palomas, solidos);
    this.physics.add.collider(this.regalos, solidos);
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.regalos, (a, b) => {
        this.recogerRegalo(jugador, this.regalos.contains(a) ? a : b);
      });
    });

    // lo que tiran los bichos hace dano al nino y se deshace contra el suelo
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.peligros, (j, p) => {
        // mientras parpadea no se le vuelve a dar: si no, un chorro encadenaba
        // varios golpes en fotogramas seguidos
        if (jugador.estaCongelado) return;
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
        // Caerse por un hueco es el unico golpe que obliga a volver: no hay
        // donde quedarse parpadeando, se esta cayendo al vacio.
        this.herirJugador(jugador, { devolverAlCheckpoint: true });
        if (jugador.active) jugador.reaparecer();
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

    // Si viene cayendo y sus pies estan en la mitad de arriba del bicho, lo
    // aplasta. Antes se pedian 16 px justos desde la coronilla: con los bichos
    // a la altura de los ninos era casi imposible acertar, y el salto acababa
    // en choque de lado una y otra vez.
    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= enemigo.body.top + enemigo.body.height * 0.5;

    if (cayendo && porEncima) {
      this.eliminarEnemigo(enemigo);
      jugador.rebotar();
    } else {
      this.herirJugador(jugador);
    }
  }

  // Un golpe no quita vidas (no hay), pero cuesta monedas. El marcador final es
  // lo que has ganado menos lo que te ha costado llegar.
  // Al volver al checkpoint se le despeja el terreno: se borra el agua y lo que
  // haya en vuelo, y los bichos que alcanzan hasta alli se toman un respiro.
  //
  // Sin esto el juego se atasca: los bichos tiran agua desde bastante lejos, y
  // con un checkpoint a su alcance el nino reaparecia justo para recibir el
  // siguiente chorro, una y otra vez. En un juego sin vidas eso es un callejon
  // sin salida, no una dificultad.
  despejarAlReaparecer(jugador) {
    this.peligros.getChildren().forEach((peligro) => {
      if (peligro.active) this.romperPeligro(peligro, false);
    });

    const respiro = ENEMIGO.ataque.avisoMs + ENEMIGO.ataque.lanzandoMs + 900;
    this.enemigos.getChildren().forEach((bicho) => {
      if (!bicho.active) return;
      if (Math.abs(bicho.x - jugador.x) > ENEMIGO.ataque.distanciaMaxima + 120) return;
      bicho.estado = 'anda';
      bicho.proximoAtaque = bicho.reloj + respiro;
    });
  }

  herirJugador(jugador, opciones = {}) {
    if (!jugador.herir()) return false;

    jugador.golpes += 1;
    jugador.corazones = Math.max(0, jugador.corazones - 1);

    const antes = jugador.monedas;
    jugador.monedas = Math.max(PUNTOS.minimo, jugador.monedas + PUNTOS.porGolpe);
    const perdidas = antes - jugador.monedas;

    if (perdidas > 0) {
      textoFlotante(this, jugador.x, jugador.y - 40, `-${perdidas}`, '#ff6b6b');
    }
    this.hud.animarCara(jugador);
    this.hud.animarCorazones(jugador);

    if (jugador.corazones <= 0) {
      this.perderVida(jugador);
    } else if (opciones.devolverAlCheckpoint) {
      this.time.delayedCall(JUGADOR.congelarAlHerirMs, () => {
        if (jugador.active) jugador.reaparecer();
      });
    }
    return true;
  }

  // Se acabaron los corazones: se pierde una vida. Si quedaba la ultima, se
  // acabo la partida; si no, se reponen los corazones y a seguir.
  perderVida(jugador) {
    this.vidas -= 1;
    this.hud.actualizarVidas(this.vidas);

    if (this.vidas > 0) {
      jugador.corazones = VIDA.corazonesPorNivel;
      textoFlotante(this, jugador.x, jugador.y - 60, '¡Una vida menos!', '#ff6b6b');
      // Aqui si se vuelve al ultimo checkpoint, con los corazones repuestos.
      this.time.delayedCall(JUGADOR.congelarAlHerirMs, () => {
        if (jugador.active) jugador.reaparecer();
      });
      return;
    }

    this.terminado = true;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('final', {
        personajeId: this.personajeId,
        indiceNivel: this.indiceNivel,
        nombreNivel: this.datosNivel.nombre,
        monedas: jugador.monedas,
        recogidas: jugador.recogidas,
        golpes: jugador.golpes,
        jefesDerrotados: jugador.jefesDerrotados,
        enemigosVencidos: jugador.enemigosVencidos,
        vidas: this.vidas,
      });
    });
  }

  // Deja un corazon o una vida donde ha caido el bicho.
  soltarRegalo(x, y, clase) {
    const esVida = clase === 'vida';
    const textura = esVida ? TEXTURAS.vidaExtra : TEXTURAS.corazon;
    const medida = esVida ? VIDA.vidaExtra : VIDA.corazon;

    const regalo = this.regalos.create(x, y, textura);
    regalo.setDisplaySize(medida.ancho, medida.alto).setDepth(7);
    regalo.clase = clase;
    regalo.body.setSize(medida.ancho / regalo.scaleX, medida.alto / regalo.scaleY, true);
    regalo.body.setVelocity(0, -80);

    // se balancea un poco, para que se vea que es un premio
    this.tweens.add({
      targets: regalo,
      scaleX: regalo.scaleX * 1.12,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // no se queda para siempre: avisa parpadeando y se va
    this.time.delayedCall(VIDA.parpadeoDesdeMs, () => {
      if (!regalo.active) return;
      this.tweens.add({
        targets: regalo,
        alpha: { from: 1, to: 0.2 },
        duration: 220,
        yoyo: true,
        repeat: -1,
      });
    });
    this.time.delayedCall(VIDA.duracionMs, () => regalo.active && regalo.destroy());
    return regalo;
  }

  recogerRegalo(jugador, regalo) {
    if (!regalo || !regalo.active) return;

    if (regalo.clase === 'vida') {
      this.vidas += 1;
      this.hud.actualizarVidas(this.vidas);
      textoFlotante(this, regalo.x, regalo.y - 24, '¡Una vida más!', COLORES.textoAcento);
    } else {
      jugador.corazones = Math.min(VIDA.corazonesPorNivel, jugador.corazones + 1);
      this.hud.animarCorazones(jugador);
      textoFlotante(this, regalo.x, regalo.y - 24, '¡Corazón!', '#ff9a9a');
    }
    estrellitas(this, regalo.x, regalo.y, 5);
    regalo.destroy();
  }

  // Saltar encima de una paloma la golpea. Aguanta dos: al primero se queda
  // aturdida dando tumbos, al segundo se cae.
  tocarPaloma(jugador, paloma) {
    if (!paloma || !paloma.active || jugador.estaCongelado) return;
    if (paloma.estado === 'cae' || paloma.estado === 'suelo') return;

    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= paloma.body.top + paloma.body.height * 0.6;
    if (!cayendo || !porEncima) return;

    if (paloma.recibirGolpe()) {
      jugador.rebotar();
      estrellitas(this, paloma.x, paloma.y, 5);
    }
  }

  // La paloma derribada deja su premio donde cayo.
  premiarPaloma(paloma) {
    const jugador = this.jugadores[0];
    jugador.enemigosVencidos += 1;

    // Algunas palomas dejan una vida en el sitio donde se estamparon.
    if (Math.random() < this.probabilidadVidaExtra) {
      this.soltarRegalo(paloma.x, paloma.y - 14, 'vida');
      return;
    }
    jugador.monedas += PUNTOS.porEnemigo;
    textoFlotante(this, paloma.x, paloma.y - 24, `+${PUNTOS.porEnemigo}`, COLORES.textoAcento);
  }

  eliminarEnemigo(enemigo) {
    if (!enemigo.active) return;
    estrellitas(this, enemigo.x, enemigo.y);

    // los bichos pequenos tambien dan premio
    const jugador = this.jugadores[0];
    // Unos bichos dan corazon en vez de monedas; al azar, para que sea una
    // alegria y no una cuenta.
    if (Math.random() < this.probabilidadCorazon) {
      this.soltarRegalo(enemigo.x, enemigo.y - 10, 'corazon');
    } else {
      jugador.monedas += PUNTOS.porEnemigo;
      textoFlotante(this, enemigo.x, enemigo.y - 22, `+${PUNTOS.porEnemigo}`, COLORES.textoAcento);
    }
    jugador.enemigosVencidos += 1;

    enemigo.destroy();
  }

  tocarCheckpoint(jugador, bandera) {
    if (bandera.activo) return;
    bandera.activo = true;
    // Con el dibujo de verdad no se cambia de textura: se enciende, que es
    // pasar de translucido a opaco.
    if (bandera.texture.key === TEXTURAS.checkpointApagado) {
      bandera.setTexture(TEXTURAS.checkpointEncendido);
    }
    bandera.setAlpha(1);
    textoFlotante(this, bandera.x, bandera.y - 30, '¡Punto de control!');
    this.tweens.add({
      targets: bandera,
      scaleY: { from: bandera.scaleY * 1.25, to: bandera.scaleY },
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
        vidas: this.vidas,
      });
    });
  }

  // --- el jefe --------------------------------------------------------------

  tocarJefe(jugador, jefe) {
    if (!jefe.active || jugador.estaCongelado) return;

    // mismo criterio generoso que con los bichos
    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= jefe.body.top + jefe.body.height * 0.4;

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
      scaleY: { from: meta.scaleY * 0.8, to: meta.scaleY },
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
      this.textures.exists(TEXTURAS.lego) ? TEXTURAS.lego : TEXTURAS.bloque,
    );
    if (proyectil.texture.key === TEXTURAS.bloque) aEscalaDeJuego(proyectil);
    else proyectil.setDisplaySize(LANZAMIENTO.tamano, LANZAMIENTO.tamano);

    proyectil.setDepth(8);
    proyectil.sentido = dir;
    // la caja se mide en pixeles de la textura y luego se escala
    proyectil.body.setSize(26 / proyectil.scaleX, 26 / proyectil.scaleY, true);
    proyectil.body.setAllowGravity(true);
    proyectil.body.setGravityY(LANZAMIENTO.gravedad - this.physics.world.gravity.y);
    proyectil.body.setVelocity(dir * LANZAMIENTO.velocidad, LANZAMIENTO.elevacion);

    // Aparece pequeno y crece hasta su tamano. Ojo: el tamano al que crece NO es
    // 1, sino la escala que le acaba de quedar al fijarle su medida. Con 1 se
    // quedaba del tamano de su textura y salian bloques enormes.
    const suEscala = proyectil.scaleX;
    proyectil.setScale(suEscala * 0.5);
    this.tweens.add({
      targets: proyectil,
      scale: suEscala,
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
    aEscalaDeJuego(agua);
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
    aEscalaDeJuego(caida);
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
    const x = desdeLaDerecha ? camara.scrollX + MUNDO.ancho + 70 : camara.scrollX - 70;
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
