// ---------------------------------------------------------------------------
// ESCENA DE NIVEL
// Monta el mundo a partir del mapa de texto, crea al jugador y aplica las
// reglas amables: sin vidas, sin game over, reaparicion en el checkpoint.
//
// Al final del nivel espera el jefe. Hasta que no se le derrota, la meta esta
// cerrada.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { AGUA, BALA, CAMARA, CHORRO, ENEMIGO, FLOTADOR, HELADITO, JEFE, JUGADOR, LANZAMIENTO, CANASTILLA, MUNDO, PALOMA, PUNTOS, RENDER, SOMBRILLA, VACA, TORRE, VIDA } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { Controles, PERFILES } from '../sistemas/controles.js';
import { Hud } from '../sistemas/hud.js';
import { construirNivel, baseY, centroX, SIMBOLOS } from '../sistemas/constructor-nivel.js';
import { aEscalaDeJuego, escalaDeJuego, panelDeco, pintarFondo } from '../sistemas/dibujo.js';
import { montarPrimerPlano, Planos } from '../sistemas/planos.js';
import { terminarPartida } from '../sistemas/cuento.js';
import { ciudadDe } from '../config/ciudades.js';
import { AVISOS, jefeDelCuento } from '../config/historia.js';
import { brilloMoneda, burbujas, estrellitas, polvo, textoFlotante } from '../sistemas/efectos.js';
import { nivelPorIndice, TOTAL_NIVELES } from '../niveles/index.js';
import { Jugador } from '../entidades/Jugador.js';
import { Paloma } from '../entidades/Paloma.js';
import { Vaca } from '../entidades/Vaca.js';

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

    // Los trastos de las arenas de los jefes. Se crean aqui, antes de que el
    // jefe prepare lo suyo: si se creasen mas abajo, al plantar las sombrillas
    // o las canastillas el grupo todavia no existiria.
    this.chorros = this.physics.add.group({ allowGravity: false });
    this.sombrillas = this.physics.add.staticGroup();
    // las canastillas de fruta de los balcones de Medellin: cuelgan quietas
    // hasta que les dan
    this.canastillas = this.physics.add.group({ allowGravity: false });
    // los flotadores que rueda el Salvavidas de Miami
    this.flotadores = this.physics.add.group();
    // las balas de espuma del Capitan Tapon
    this.balas = this.physics.add.group({ allowGravity: false });
    // los heladitos de chocolate de Papa Inodoro: estos SI caen, que su gracia
    // es que salgan en arco y se estrellen
    this.heladitos = this.physics.add.group();
    // las torres de vigia son decorado, sin fisica ninguna
    this.torres = [];

    // El jefe ya puede mirar su arena: el tablero esta montado. Primero se le
    // dicen sus bordes, que es contra lo que mira si el nino ha llegado: por
    // distancia AL JEFE, los que se mueven se alejaban ellos solos y se
    // quedaban plantados en mitad de la pelea.
    if (this.jefe) {
      this.jefe.arena = this.bordesDeLaArena(this.jefe);
      if (this.jefe.prepararArena) this.jefe.prepararArena();
    }
    this.terminado = false;

    // bloques que Samaon lanza por los aires
    this.proyectiles = this.physics.add.group();
    // lo que sueltan los bichos: agua con jabon y lo de las palomas
    this.peligros = this.physics.add.group();
    this.palomas = this.physics.add.group({ allowGravity: false });
    // los vacas, que entran corriendo por un lado del cuadro
    this.vacas = this.physics.add.group();
    // corazones y vidas que sueltan los bichos, esperando en el suelo
    this.regalos = this.physics.add.group({ allowGravity: true });
    this.proximaPaloma = this.esperaDePaloma();
    this.proximaVaca = this.esperaDeVaca();

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
    this.proximoCorazon = JEFE.corazonMinMs;
    this.jefeSaludo = false;
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
    // Una paloma que vuela no choca con el terreno: va por el aire. El choque
    // solo cuenta cuando ya la han derribado, que es cuando tiene que caer y
    // quedarse en el suelo. Sin esto, cualquier bloque alto le hace de presa y
    // se van amontonando contra el.
    this.physics.add.collider(
      this.palomas,
      solidos,
      null,
      (a, b) => {
        const paloma = this.palomas.contains(a) ? a : b;
        return paloma.estado === 'cae' || paloma.estado === 'suelo';
      },
    );
    this.physics.add.collider(this.regalos, solidos);

    // El vaca corre por el suelo y por las plataformas, y se le pisa igual que
    // a una banera. De frente, embiste.
    this.physics.add.collider(this.vacas, solidos);
    this.physics.add.collider(this.vacas, plataformas);
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.vacas, (a, b) => {
        this.tocarVaca(jugador, this.vacas.contains(a) ? a : b);
      });
    });

    // El chorro de Dona Zully: moja al nino, rebota en las sombrillas y, de
    // vuelta, la empapa a ella.

    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.chorros, (a, b) => {
        const chorro = this.chorros.contains(a) ? a : b;
        if (chorro.rebotado) return; // de vuelta ya no moja al nino
        this.romperChorro(chorro);
        this.herirJugador(jugador);
      });
    });

    this.physics.add.overlap(this.chorros, this.sombrillas, (a, b) => {
      this.rebotarChorro(this.chorros.contains(a) ? a : b);
    });

    if (this.jefe) {
      this.physics.add.overlap(this.chorros, this.jefe, (a, b) => {
        const chorro = this.chorros.contains(a) ? a : b;
        if (!chorro.rebotado || !this.jefe || !this.jefe.recibirRebote) return;
        if (this.jefe.recibirRebote(chorro.x)) this.anotarGolpeAlJefe();
        this.romperChorro(chorro);
      });
    }

    // Las canastillas del Abuelo. Un cabezazo en pleno salto las tira: hay que
    // ir subiendo, no basta con rozarlos al caer.
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.canastillas, (a, b) => {
        const canastilla = this.canastillas.contains(a) ? a : b;
        if (jugador.body.velocity.y >= 0) return;
        this.tirarCanastilla(canastilla, jugador.x);
      });
    });
    this.physics.add.overlap(this.proyectiles, this.canastillas, (a, b) => {
      // Aqui no se pueden usar todavia los ayudantes de mas abajo: se declaran
      // despues. Y el orden de los dos objetos no se puede dar por hecho.
      const proyectil = this.proyectiles.contains(a) ? a : b;
      this.tirarCanastilla(proyectil === a ? b : a, proyectil.x);
      this.romperProyectil(proyectil);
    });
    this.physics.add.collider(this.canastillas, solidos, (a, b) => {
      this.romperCanastilla(this.canastillas.contains(a) ? a : b);
    });
    if (this.jefe) {
      this.physics.add.overlap(this.canastillas, this.jefe, (a, b) => {
        const canastilla = this.canastillas.contains(a) ? a : b;
        if (!canastilla.cayendo || !this.jefe || !this.jefe.recibirCanastilla) return;
        if (this.jefe.recibirCanastilla(canastilla.x)) this.anotarGolpeAlJefe();
        this.romperCanastilla(canastilla);
      });
    }

    // Los flotadores del Salvavidas ruedan por el suelo y hay que saltarlos.
    this.physics.add.collider(this.flotadores, solidos);
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.flotadores, (a, b) => {
        if (jugador.estaCongelado) return;
        const flotador = this.flotadores.contains(a) ? a : b;
        this.romperFlotador(flotador);
        this.herirJugador(jugador);
      });
    });

    // Las balas de espuma del Capitan.
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.balas, (a, b) => {
        if (jugador.estaCongelado) return;
        this.romperBala(this.balas.contains(a) ? a : b);
        this.herirJugador(jugador);
      });
    });

    // Los heladitos de Papa Inodoro caen en arco y se estrellan donde toquen.
    this.physics.add.collider(this.heladitos, solidos, (a, b) => {
      // en un choque de grupo contra grupo, Phaser no garantiza el orden
      this.estrellarHeladito(this.heladitos.contains(a) ? a : b);
    });
    this.jugadores.forEach((jugador) => {
      this.physics.add.overlap(jugador, this.heladitos, (a, b) => {
        if (jugador.estaCongelado) return;
        this.estrellarHeladito(this.heladitos.contains(a) ? a : b);
        this.herirJugador(jugador);
      });
    });
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
    this.physics.add.overlap(this.proyectiles, this.vacas, (a, b) => {
      const proyectil = cualEsElProyectil(a, b);
      this.derribarVaca(elOtro(a, b, proyectil));
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
    this.gestionarVacas(delta);

    this.peligros.getChildren().forEach((peligro) => {
      if (!peligro.active) return;
      if (peligro.y > this.nivel.alto + 40) this.romperPeligro(peligro, false);
    });

    this.proyectiles.getChildren().forEach((proyectil) => {
      if (!proyectil.active) return;
      proyectil.angle += ((LANZAMIENTO.giro * delta) / 1000) * proyectil.sentido;
      if (proyectil.y > this.nivel.alto + 40) this.romperProyectil(proyectil, false);
    });

    this.gestionarCorazonesDeJefe(delta);
    this.saludarSiEmpiezaLaPelea();
    this.hud.actualizar();
  }

  // El jefe saluda cuando el nino pisa su arena, no antes: si lo dijera al
  // cargar el tablero, nadie lo leeria.
  saludarSiEmpiezaLaPelea() {
    if (this.jefeSaludo || !this.jefe || !this.jefe.active) return;
    const jugador = this.jugadores[0];
    if (!jugador || Math.abs(jugador.x - this.jefe.x) > 300) return;
    this.jefeSaludo = true;
    this.hablaElJefe('saludo');
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

    // Y se van las vacas que vengan lanzadas: reaparecer justo delante de una
    // embestida no es dificultad, es un callejon sin salida. Con los heladitos
    // que le queden a Papa Inodoro en el aire, lo mismo.
    this.vacas.getChildren().forEach((vaca) => {
      if (vaca.active) vaca.destroy();
    });
    this.heladitos.getChildren().forEach((heladito) => {
      if (heladito.active) this.estrellarHeladito(heladito);
    });
    this.proximaVaca = Math.max(this.proximaVaca, 3000);
  }

  herirJugador(jugador, opciones = {}) {
    if (!jugador.herir()) return false;

    jugador.golpes += 1;
    jugador.corazones = Math.max(0, jugador.corazones - 1);

    const antes = jugador.monedas;
    jugador.monedas = Math.max(PUNTOS.minimo, jugador.monedas + PUNTOS.porGolpe);
    const perdidas = antes - jugador.monedas;

    // Mojarse es el golpe de este juego: el nino chorrea y suelta burbujas.
    burbujas(this, jugador.x, jugador.y - 6);
    if (perdidas > 0) {
      textoFlotante(this, jugador.x, jugador.y - 40, `${AVISOS.mojado}  -${perdidas}`, '#8fd3ff');
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
      textoFlotante(this, jugador.x, jugador.y - 60, AVISOS.sinCorazones, '#ff6b6b');
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
    textoFlotante(this, bandera.x, bandera.y - 30, AVISOS.checkpoint);
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
      // Tras la ultima ciudad va el final del cuento; en las demas, el marcador
      // de siempre.
      const esLaUltima = this.indiceNivel + 1 >= TOTAL_NIVELES;
      const paraVictoria = {
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
      };

      if (esLaUltima) terminarPartida(this, paraVictoria);
      else this.scene.start('victoria', paraVictoria);
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
      return;
    }

    // Subiendo y con los pies por encima de su cabeza: le esta SALTANDO POR
    // ENCIMA, y eso no castiga. Sin esto, un jefe del doble de alto no se puede
    // pisar: el nino entra en su caja mientras sube, se lleva el golpe antes de
    // llegar arriba y no hay salto que valga. Con esto, la carrerilla buena da
    // una ventana de unos 77 px para despegar, parecida a la de un bicho.
    if (!cayendo && porEncima) return;

    this.herirJugador(jugador);
  }

  // --- la arena de Dona Zully -----------------------------------------------

  // Tres sombrillas clavadas en el suelo de su arena. No estorban al andar: lo
  // suyo es parar el chorro, no al nino.
  plantarSombrillas(jefe) {
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;

    // Se mira hasta donde llega el suelo hacia la izquierda del jefe y se
    // reparten las sombrillas por ese tramo. A distancias fijas, en una arena
    // corta la de mas alla caia al vacio y se quedaba sin plantar.
    let borde = jefe.x;
    while (borde > jefe.x - SOMBRILLA.arenaMaxima && this.haySoporteEn(borde - 16, suelo + 6)) {
      borde -= 16;
    }

    // Cuantas caben, no cuantas nos gustaria: la arena de Atlanta es corta
    // (tiene un hueco justo antes) y tres sombrillas ahi salian una encima de
    // otra, tapandolo todo. Separadas menos de lo que miden, el chorro no
    // encontraria por donde pasar y la pelea se ganaria sola.
    const tramo = Math.max(SOMBRILLA.separacionMinima, jefe.x - borde - SOMBRILLA.margen);
    const cuantas = Phaser.Math.Clamp(
      Math.round(tramo / SOMBRILLA.separacionMinima),
      SOMBRILLA.minimo,
      SOMBRILLA.cuantas,
    );
    const plantadas = [];

    for (let i = 0; i < cuantas; i += 1) {
      const parte = cuantas === 1 ? 0.5 : i / (cuantas - 1);
      let x = jefe.x - SOMBRILLA.margen - tramo * (1 - parte);
      // Y no se planta debajo de una plataforma: la copa la atravesaria. Si le
      // toca ahi, se corre a un lado hasta quedar al aire libre.
      const techo = MUNDO.nivelMedio * MUNDO.casilla + 6;
      const bajoTecho = (px) =>
        this.haySoporteEn(px - SOMBRILLA.ancho / 2, techo) ||
        this.haySoporteEn(px + SOMBRILLA.ancho / 2, techo);
      for (let salto = 0; salto < 5 && bajoTecho(x); salto += 1) {
        x -= SOMBRILLA.ancho / 2;
      }
      if (!this.haySoporteEn(x, suelo + 6)) continue;
      const sombrilla = this.sombrillas.create(x, suelo, TEXTURAS.sombrilla);
      sombrilla.setOrigin(0.5, 1).setDisplaySize(SOMBRILLA.ancho, SOMBRILLA.alto);
      sombrilla.refreshBody();
      sombrilla.setDepth(6);
      plantadas.push(sombrilla);
    }

    return plantadas;
  }

  // El chorro a presion. Sale de la manguera, y si le da a una sombrilla vuelve
  // por donde vino: eso es lo que empapa a Zully.
  lanzarChorro(jefe) {
    const dir = jefe.direccion;
    const chorro = this.chorros.create(
      jefe.x + dir * 70,
      jefe.y + CHORRO.salidaY,
      TEXTURAS.zullyChorro,
    );
    chorro.setDisplaySize(CHORRO.ancho, CHORRO.alto).setDepth(8);
    chorro.setFlipX(dir < 0);
    chorro.body.setSize(CHORRO.caja.ancho / chorro.scaleX, CHORRO.caja.alto / chorro.scaleY, true);
    chorro.body.setAllowGravity(false);
    chorro.body.setVelocityX(dir * CHORRO.velocidad);
    chorro.sentido = dir;
    chorro.rebotado = false;

    this.time.delayedCall(CHORRO.duracionMs, () => chorro.active && chorro.destroy());
    return chorro;
  }

  // Una pastilla de jabon que cae del techo.
  soltarJabon(jefe) {
    const nino = this.jugadores[0];
    if (!nino || !nino.active) return;
    const x = Phaser.Math.Clamp(
      nino.x + Phaser.Math.Between(-70, 70),
      jefe.x - JEFE.alcanceArena,
      jefe.x + 120,
    );
    const jabon = this.peligros.create(x, 20, TEXTURAS.jabon);
    aEscalaDeJuego(jabon);
    jabon.setDepth(7);
    jabon.body.setAllowGravity(true);
    jabon.body.setGravityY(AGUA.gravedad - this.physics.world.gravity.y);
    this.time.delayedCall(AGUA.duracionMs, () => jabon.active && this.romperPeligro(jabon, false));
  }

  // --- lo que los jefes le piden a la arena ---------------------------------

  // Un pisoton que se siente: la camara da un brinco.
  sacudirArena(fuerza = 0.012, duracionMs = 260) {
    this.cameras.main.shake(duracionMs, fuerza);
  }

  // Espuma saliendo a los lados de quien sea.
  salpicarDesde(quien) {
    const abajo = quien.body ? quien.body.bottom : quien.y;
    burbujas(this, quien.x - 40, abajo - 12, 5);
    burbujas(this, quien.x + 40, abajo - 12, 5);
  }

  // Durante la pelea caen corazones de vez en cuando: pelear no puede costar la
  // partida, y menos a un nino de cinco anos.
  gestionarCorazonesDeJefe(delta) {
    if (!this.jefe || !this.jefe.active) return;
    this.proximoCorazon -= delta;
    if (this.proximoCorazon > 0) return;
    this.proximoCorazon = Phaser.Math.Between(JEFE.corazonMinMs, JEFE.corazonMaxMs);

    const jugador = this.jugadores[0];
    if (!jugador || jugador.corazones >= VIDA.corazonesPorNivel) return;

    const x = Phaser.Math.Clamp(
      jugador.x + Phaser.Math.Between(-120, 120),
      this.jefe.x - JEFE.alcanceArena,
      this.jefe.x + JEFE.alcanceArena,
    );
    this.soltarRegalo(x, 40, 'corazon');
  }

  // Lo que dice el guardian del bano, en su idioma.
  // La frase se centra en el jefe, y el jefe pelea en el borde derecho de su
  // arena: con una frase larga se salia media pantalla por la derecha. Se
  // sujeta dentro de lo visible, igual que su barra de vida.
  hablaElJefe(cual) {
    if (!this.jefe || !this.jefe.active) return;
    const suyo = jefeDelCuento(this.datosNivel.fondo || '');
    if (!suyo || !suyo[cual]) return;

    const ancho = 460;
    const camara = this.cameras.main;
    const zoom = camara.zoom || 1;
    const izquierda = camara.scrollX + (camara.width * (1 - 1 / zoom)) / 2;
    const anchoVisible = camara.width / zoom;
    const x = Phaser.Math.Clamp(
      this.jefe.x,
      izquierda + ancho / 2,
      izquierda + anchoVisible - ancho / 2,
    );

    textoFlotante(this, x, this.jefe.y - 64, suyo[cual], COLORES.textoAcento, 2200, ancho);
  }

  // El chorro pega en la sombrilla y se vuelve por donde vino.
  rebotarChorro(chorro) {
    if (!chorro || !chorro.active || chorro.rebotado) return;
    chorro.rebotado = true;
    chorro.sentido = -chorro.sentido;
    chorro.body.setVelocityX(chorro.sentido * CHORRO.velocidadRebote);
    chorro.setFlipX(chorro.sentido < 0);
    chorro.setTint(0xbfe9ff);
    burbujas(this, chorro.x, chorro.y, 4);
  }

  romperChorro(chorro) {
    if (!chorro || !chorro.active) return;
    burbujas(this, chorro.x, chorro.y, 5);
    chorro.destroy();
  }

  // --- la arena del Abuelo --------------------------------------------------

  // Las canastillas de fruta de los balcones. Cuelgan por encima de la cabeza
  // del nino de pie, pero al alcance de un salto: asi valen las tres formas de
  // tumbarlas (la katana, un bloque o un cabezazo), que es lo que hace que los
  // dos ninos puedan con el. Se reparten por el ancho de la arena para que
  // siempre haya una cerca de donde la pickup se para a resoplar.
  // Donde empieza y donde acaba la arena del jefe. Se saca del terreno, no de
  // numeros fijos, para que cada ciudad reparta lo suyo por el sitio que hay de
  // verdad.
  //
  // El PORCHE del checkpoint no cuenta como arena: ni se planta nada ahi ni el
  // jefe se mete. Metiendose, se llevaba la pelea fuera de su pantalla y ademas
  // dejaba de considerar que el nino estuviera con el.
  bordesDeLaArena(jefe) {
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    const bordeDe = (paso) => {
      let x = jefe.x;
      while (Math.abs(x - jefe.x) < 700 && this.haySoporteEn(x + paso, suelo + 6)) x += paso;
      return x;
    };
    return { izquierda: bordeDe(-16) + JEFE.margenDeArena, derecha: bordeDe(16) };
  }

  plantarCanastillas(jefe) {
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    const y = suelo - CANASTILLA.altura;

    const bordes = this.bordesDeLaArena(jefe);
    const izquierda = bordes.izquierda + CANASTILLA.margen;
    const derecha = bordes.derecha - CANASTILLA.margen;
    const tramo = Math.max(CANASTILLA.separacionMinima, derecha - izquierda);
    const cuantos = Phaser.Math.Clamp(
      Math.round(tramo / CANASTILLA.separacionMinima) + 1,
      CANASTILLA.minimo,
      CANASTILLA.cuantos,
    );

    const plantados = [];
    for (let i = 0; i < cuantos; i += 1) {
      const parte = cuantos === 1 ? 0.5 : i / (cuantos - 1);
      plantados.push(this.colgarCanastilla(izquierda + tramo * parte, y));
    }
    return plantados;
  }

  colgarCanastilla(x, y) {
    const canastilla = this.canastillas.create(x, y, TEXTURAS.canastilla);
    canastilla.setDisplaySize(CANASTILLA.ancho, CANASTILLA.alto).setDepth(7);
    canastilla.body.setSize(CANASTILLA.caja.ancho / canastilla.scaleX, CANASTILLA.caja.alto / canastilla.scaleY, true);
    canastilla.body.setAllowGravity(false);
    canastilla.body.setVelocity(0, 0);
    canastilla.cayendo = false;
    canastilla.sitio = { x, y };
    // se mece, para que se lea que cuelga y no que flota
    canastilla.vaiven = this.tweens.add({
      targets: canastilla,
      angle: { from: -5, to: 5 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return canastilla;
  }

  // Le dan desde abajo y se viene abajo, recta. La sombra en el suelo dice
  // donde va a caer, que es lo que deja calcular si le va a dar a la pickup.
  tirarCanastilla(canastilla, desdeX) {
    if (!canastilla || !canastilla.active || canastilla.cayendo) return;
    canastilla.cayendo = true;
    if (canastilla.vaiven) canastilla.vaiven.stop();
    canastilla.setAngle(0);
    canastilla.setTexture(TEXTURAS.canastillaCae);
    canastilla.body.setAllowGravity(true);
    canastilla.body.setGravityY(CANASTILLA.gravedad - this.physics.world.gravity.y);
    canastilla.body.setVelocity(0, 0);

    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    canastilla.sombra = this.add
      .ellipse(canastilla.x, suelo - 5, CANASTILLA.ancho, 14, 0x000000, 0.35)
      .setDepth(3);
    textoFlotante(this, canastilla.x, canastilla.y - 26, '¡Ojo abajo!', COLORES.textoAcento, 900);
    return desdeX;
  }

  romperCanastilla(canastilla) {
    if (!canastilla || !canastilla.active) return;
    const sitio = canastilla.sitio || { x: canastilla.x, y: canastilla.y };
    if (canastilla.sombra) canastilla.sombra.destroy();
    if (canastilla.vaiven) canastilla.vaiven.stop();
    estrellitas(this, canastilla.x, canastilla.y, 8);
    polvo(this, canastilla.x, canastilla.y + 10);

    // La fruta desparramada se queda un momento donde cayo. El sprite se
    // destruye enseguida, asi que sin esto el dibujo de la canastilla reventada
    // no se veria nunca.
    const restos = this.add
      .image(canastilla.x, canastilla.y, TEXTURAS.canastillaRota)
      .setDisplaySize(CANASTILLA.ancho, CANASTILLA.alto)
      .setDepth(6);
    this.tweens.add({
      targets: restos,
      alpha: { from: 1, to: 0 },
      duration: CANASTILLA.restosMs,
      onComplete: () => restos.destroy(),
    });

    canastilla.destroy();

    // sale otra en su sitio: quedarse sin canastillas seria quedarse sin pelea
    this.time.delayedCall(CANASTILLA.recambioMs, () => {
      if (this.terminado || !this.jefe || !this.jefe.active || !this.canastillas) return;
      const nueva = this.colgarCanastilla(sitio.x, sitio.y);
      if (this.jefe.canastillas) this.jefe.canastillas.push(nueva);
    });
  }

  // La katana no choca con nada: mira una zona. Esto es lo que le deja tumbar
  // una canastilla igual que tumba a un bicho.
  golpearColgantes(zona, desdeX) {
    if (!this.canastillas) return;
    this.canastillas
      .getChildren()
      .slice()
      .forEach((canastilla) => {
        if (!canastilla.active || canastilla.cayendo) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(zona, canastilla.getBounds())) {
          this.tirarCanastilla(canastilla, desdeX);
        }
      });
  }

  // --- la arena del Salvavidas ----------------------------------------------

  // Sus torres de vigia. Son decorado: nadie se sube, pero marcan por donde va
  // a saltar, que es lo que hace la pelea legible.
  plantarTorres(jefe) {
    const suelo = MUNDO.nivelSuelo * MUNDO.casilla;
    const bordes = this.bordesDeLaArena(jefe);
    const izquierda = bordes.izquierda + 20;
    const derecha = bordes.derecha - TORRE.margen;
    const tramo = Math.max(TORRE.margen, derecha - izquierda);

    const sitios = [];
    for (let i = 0; i < TORRE.cuantas; i += 1) {
      const parte = TORRE.cuantas === 1 ? 0.5 : i / (TORRE.cuantas - 1);
      const x = izquierda + tramo * parte;
      const torre = this.add.image(x, suelo + 4, TEXTURAS.torreVigia);
      torre.setOrigin(0.5, 1).setDisplaySize(TORRE.ancho, TORRE.alto).setDepth(4);
      this.torres.push(torre);
      // Donde se pone el cuando esta subido. Tiene que quedar CLARAMENTE mas
      // alto que en el suelo: mide 172 px, asi que con 26 px de diferencia no
      // se distinguia "esta arriba, no le llego" de "ha bajado, dale".
      sitios.push({ x, y: suelo - TORRE.alto + 56 - jefe.config.alto / 2 });
    }
    return sitios;
  }

  // Un flotador que sale rodando por el suelo.
  lanzarFlotador(jefe, direccion) {
    const flotador = this.flotadores.create(jefe.x + direccion * 40, jefe.y, TEXTURAS.flotador);
    flotador.setDisplaySize(FLOTADOR.ancho, FLOTADOR.alto).setDepth(8);
    flotador.body.setSize(
      FLOTADOR.caja.ancho / flotador.scaleX,
      FLOTADOR.caja.alto / flotador.scaleY,
      true,
    );
    flotador.body.setVelocityX(direccion * FLOTADOR.velocidad);
    flotador.body.setBounce(0.2, 0.2);
    this.time.delayedCall(FLOTADOR.duracionMs, () => flotador.active && this.romperFlotador(flotador));
    return flotador;
  }

  romperFlotador(flotador) {
    if (!flotador || !flotador.active) return;
    burbujas(this, flotador.x, flotador.y, 5);
    flotador.destroy();
  }

  // --- la arena del Capitan Tapon -------------------------------------------

  // Una bala de espuma, recta y lenta: se la ve venir.
  lanzarBala(jefe) {
    const dir = jefe.direccion;
    const bala = this.balas.create(jefe.x + dir * 60, jefe.y + BALA.salidaY, TEXTURAS.balaEspuma);
    bala.setDisplaySize(BALA.ancho, BALA.alto).setDepth(8);
    bala.setFlipX(dir < 0);
    bala.body.setSize(BALA.caja.ancho / bala.scaleX, BALA.caja.alto / bala.scaleY, true);
    bala.body.setAllowGravity(false);
    bala.body.setVelocityX(dir * BALA.velocidad);
    this.time.delayedCall(BALA.duracionMs, () => bala.active && this.romperBala(bala));
    return bala;
  }

  romperBala(bala) {
    if (!bala || !bala.active) return;
    burbujas(this, bala.x, bala.y, 4);
    bala.destroy();
  }

  // --- la arena de Papa Inodoro ---------------------------------------------

  // Un heladito de chocolate, que sale de la boca en arco y da tumbos.
  escupirHeladito(jefe) {
    const dir = jefe.direccion;
    const heladito = this.heladitos.create(
      jefe.x + dir * HELADITO.salidaX,
      jefe.y + HELADITO.salidaY,
      TEXTURAS.helado1,
    );
    heladito.setDisplaySize(HELADITO.ancho, HELADITO.alto).setDepth(8);
    heladito.setFlipX(dir < 0);

    // La caja va pegada abajo, no centrada: el recorte deja el dibujo apoyado
    // en la base del lienzo, asi que una caja centrada queda sobre el cono.
    const escalaX = heladito.scaleX || 1;
    const escalaY = heladito.scaleY || 1;
    heladito.body.setSize(HELADITO.caja.ancho / escalaX, HELADITO.caja.alto / escalaY, false);
    heladito.body.setOffset(
      (HELADITO.ancho - HELADITO.caja.ancho) / 2 / escalaX,
      (HELADITO.alto - HELADITO.caja.alto) / escalaY,
    );
    heladito.body.setVelocity(dir * HELADITO.velocidad, -HELADITO.impulso);

    // da tumbos: alterna sus dos poses hasta que se estrella
    heladito.giro = this.time.addEvent({
      delay: HELADITO.giroMs,
      loop: true,
      callback: () => {
        if (!heladito.active) return;
        const cae = heladito.texture.key === TEXTURAS.helado1;
        heladito.setTexture(cae ? TEXTURAS.helado2 : TEXTURAS.helado1);
      },
    });
    return heladito;
  }

  // Al tocar suelo (o al nino) se despachurra: la mancha se queda un momento y
  // ya no hace dano, que bastante tiene el nino con esquivarlo en el aire.
  estrellarHeladito(heladito) {
    if (!heladito || !heladito.active || heladito.estrellado) return;
    heladito.estrellado = true;
    if (heladito.giro) heladito.giro.remove();
    heladito.giro = null;
    heladito.setTexture(TEXTURAS.heladoSplat);
    heladito.body.setVelocity(0, 0);
    heladito.body.enable = false;
    this.tweens.add({
      targets: heladito,
      alpha: { from: 1, to: 0 },
      duration: HELADITO.manchaMs,
      onComplete: () => heladito.active && heladito.destroy(),
    });
  }

  // Lo que pasa cuando a un jefe le cuenta un golpe, venga de donde venga.
  anotarGolpeAlJefe() {
    if (!this.jefe || !this.jefe.active) return;
    estrellitas(this, this.jefe.x, this.jefe.y, 7);
    this.cameras.main.shake(140, 0.006);

    if (this.jefe.derrotado) {
      this.derrotarJefe();
      return;
    }
    textoFlotante(
      this,
      this.jefe.x,
      this.jefe.y - 46,
      `¡Le quedan ${this.jefe.vidas}!`,
      COLORES.textoClaro,
    );
  }

  golpearJefe(desdeX) {
    if (!this.jefe || !this.jefe.active) return;
    if (!this.jefe.recibirGolpe(desdeX)) return;
    this.anotarGolpeAlJefe();
  }

  derrotarJefe() {
    const { x, y } = this.jefe;
    estrellitas(this, x, y, 18);
    estrellitas(this, x - 24, y - 10, 10);
    estrellitas(this, x + 24, y + 6, 10);
    this.cameras.main.shake(320, 0.01);
    // el empapado es el, que para eso es un guardian del bano
    this.salpicarDesde(this.jefe);
    this.hablaElJefe('derrota');

    // Si el jefe trae dibujo de derrota, se queda un momento en su sitio
    // mientras se va: el sprite se destruye enseguida, asi que sin esto la pose
    // no se llega a ver nunca.
    if (this.jefe.texturaDeDerrota) {
      const adios = this.add
        .image(x, y, this.jefe.texturaDeDerrota)
        .setDisplaySize(this.jefe.displayWidth, this.jefe.displayHeight)
        .setFlipX(this.jefe.flipX)
        .setDepth(9);
      this.tweens.add({
        targets: adios,
        y: y + 30,
        alpha: { from: 1, to: 0 },
        duration: 1100,
        ease: 'Quad.easeIn',
        onComplete: () => adios.destroy(),
      });
    }

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
    textoFlotante(this, meta.x, meta.y - 60, AVISOS.metaAbierta, COLORES.textoAcento);
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

  // --- las vacas -------------------------------------------------------------

  esperaDeVaca() {
    const recorte = Math.max(0, 1 - this.indiceNivel * VACA.recortePorNivel);
    const minimo = Math.max(VACA.esperaMinima, VACA.esperaMinMs * recorte);
    const maximo = Math.max(minimo + 2000, VACA.esperaMaxMs * recorte);
    return Phaser.Math.Between(minimo, maximo);
  }

  gestionarVacas(delta) {
    this.vacas.getChildren().forEach((vaca) => {
      if (!vaca.active) return;
      vaca.actualizar(delta);
      // fuera del mundo o caida a un hueco: se va
      if (vaca.y > this.nivel.alto + 80 || vaca.x < -200 || vaca.x > this.nivel.ancho + 200) {
        vaca.destroy();
      }
    });

    this.proximaVaca -= delta;
    if (this.proximaVaca > 0) return;
    // Si no se puede soltar ahora, se reintenta enseguida en vez de perder el
    // turno entero: al principio y al final del tablero uno de los dos lados
    // cae fuera del mundo, y esperando otra tanda las vacas salian la mitad de
    // veces de lo que dicen sus tiempos.
    this.proximaVaca = 900;

    // En la arena del jefe no entra ninguna: bastante tiene el nino con el jefe.
    if (this.jefe && this.jefe.active && this.jefe.hayAlguienEnLaArena()) return;

    const camara = this.cameras.main;
    const zoom = camara.zoom || 1;
    const izquierda = camara.scrollX + (camara.width * (1 - 1 / zoom)) / 2;
    const suelo = MUNDO.nivelSuelo * C;

    // Entra por fuera del cuadro, para que se la vea venir. Se prueban los dos
    // lados: el que salga primero, y si no cabe, el otro.
    const preferido = Math.random() < 0.5;
    const lados = [preferido, !preferido];
    const sitio = lados
      .map((porLaDerecha) => ({
        porLaDerecha,
        x: porLaDerecha ? izquierda + MUNDO.ancho + 80 : izquierda - 80,
      }))
      .find(({ x }) => x > 40 && x < this.nivel.ancho - 40 && this.haySoporteEn(x, suelo + 6));
    if (!sitio) return;

    this.proximaVaca = this.esperaDeVaca();
    const vaca = new Vaca(this, sitio.x, suelo - VACA.alto / 2, sitio.porLaDerecha ? -1 : 1);
    this.vacas.add(vaca);
    // el cartel sale con ella, no cuando ya la tienes encima
    this.avisarDeLaVaca();
  }

  tocarVaca(jugador, vaca) {
    if (!vaca || !vaca.active || vaca.derribada || jugador.estaCongelado) return;

    // mismo criterio generoso que con las baneras: si viene cayendo y sus pies
    // estan en la mitad de arriba del bicho, la aplasta
    const cayendo = jugador.body.velocity.y > 30;
    const porEncima = jugador.body.bottom <= vaca.body.top + vaca.body.height * 0.5;

    if (cayendo && porEncima) {
      this.derribarVaca(vaca);
      jugador.rebotar();
    } else {
      this.herirJugador(jugador);
    }
  }

  // La vaca no se esfuma de golpe como una banera: se cae patas arriba, con las
  // X en los ojos y sus estrellitas, titila y desaparece dejando el premio
  // donde cayo. Igual que la paloma derribada.
  derribarVaca(vaca) {
    if (!vaca || !vaca.active || !vaca.derribar()) return;

    estrellitas(this, vaca.x, vaca.y, 8);
    const jugador = this.jugadores[0];
    jugador.enemigosVencidos += 1;

    if (Math.random() < this.probabilidadCorazon) {
      this.soltarRegalo(vaca.x, vaca.y - 20, 'corazon');
      return;
    }
    jugador.monedas += PUNTOS.porEnemigo;
    textoFlotante(this, vaca.x, vaca.y - 30, `+${PUNTOS.porEnemigo}`, COLORES.textoAcento);
  }

  // El cartel que sale cuando una vaca baja la cabeza. Va clavado en pantalla,
  // no en el mundo: es un aviso, tiene que poderse leer aunque la vaca ya venga
  // lanzada.
  avisarDeLaVaca() {
    if (this.cartelDeVaca) return; // ya hay uno puesto
    const ancho = 400;
    const y = 74;
    const panel = panelDeco(this, MUNDO.ancho / 2, y, ancho, 40, { escalon: 10 });
    const texto = this.add
      .text(MUNDO.ancho / 2, y, AVISOS.vaca, {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);
    panel.setDepth(40);
    texto.setDepth(41);

    this.cartelDeVaca = [panel, texto];
    if (this.planos) this.planos.fijar(this.cartelDeVaca);

    this.tweens.add({
      targets: this.cartelDeVaca,
      alpha: { from: 0, to: 1 },
      duration: 160,
      yoyo: true,
      hold: VACA.cartelMs,
      onComplete: () => {
        this.cartelDeVaca.forEach((pieza) => pieza.destroy());
        this.cartelDeVaca = null;
      },
    });
  }

  gestionarPalomas(delta) {
    this.proximaPaloma -= delta;
    if (this.proximaPaloma > 0) return;
    this.proximaPaloma = this.esperaDePaloma();

    // Entra por fuera del cuadro, para que se la vea venir. Ojo con la camara:
    // con zoom, scrollX no es la esquina izquierda de lo visible, asi que hay
    // que sacarla como en Planos; usandolo tal cual, a densidad 2 la paloma
    // aparecia de golpe ya dentro de la pantalla.
    const camara = this.cameras.main;
    const zoom = camara.zoom || 1;
    const izquierda = camara.scrollX + (camara.width * (1 - 1 / zoom)) / 2;
    const desdeLaDerecha = Math.random() < 0.72;
    const x = desdeLaDerecha ? izquierda + MUNDO.ancho + 70 : izquierda - 70;

    // Casi siempre cruza por la franja de arriba; de vez en cuando baja a la
    // altura del segundo piso y ahi ya estorba de verdad.
    const porLoBajo = Math.random() < PALOMA.probabilidadMedia;
    const fila = porLoBajo
      ? Phaser.Math.FloatBetween(PALOMA.alturaMediaMinFila, PALOMA.alturaMediaMaxFila)
      : Phaser.Math.FloatBetween(PALOMA.alturaMinFila, PALOMA.alturaMaxFila);
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
