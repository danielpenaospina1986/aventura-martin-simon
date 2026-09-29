// ---------------------------------------------------------------------------
// ELEGIR MUNDO
//
// Despues de elegir personaje se elige A DONDE ir. Todos los mundos estan
// abiertos desde el principio: la gracia no es desbloquearlos, es poder volver
// al que mas guste y seguir sumando puntos.
//
// Se ensena UNO SOLO, grande, y se pasa de uno a otro con las flechas de los
// lados, deslizando el dedo o con el teclado. Arriba dice por cual se va
// ("Mundo 4 de 8") y abajo hay una fila de puntitos, para saber donde se esta
// sin tener que leer.
//
// Antes salian los ocho a la vez, en rejilla de cuatro por fila. Con cinco
// mundos aquello se leia; con ocho, cada tarjeta se quedaba en 104 x 68 px y en
// un telefono no habia forma ni de verlas ni de acertarles con el dedo. Mas
// vale ver uno bien que ocho mal.
//
// La tarjeta es la ILUSTRACION DE FONDO de esa ciudad, recortada al trozo de en
// medio: es lo que hace que se reconozca de un vistazo sin tener que leer.
//
// El recorte se hace con setCrop y NO con una mascara: en Phaser 4, setMask no
// funciona con WebGL (avisa por consola y dibuja la lamina entera).
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER, premioDeJefe } from '../config/ajustes.js';
import { COLORES, FUENTE, TEXTURAS } from '../config/estilo.js';
import { NIVELES } from '../niveles/index.js';
import { pintarFondoDeMenu } from '../sistemas/dibujo.js';
import { jefeDelCuento } from '../config/historia.js';
import { empezarPartida } from '../sistemas/cuento.js';
import { nuevaPartida } from '../sistemas/puntajes.js';
import { segunElMando } from '../sistemas/tactil.js';

const TARJETA = {
  ancho: 336,
  alto: 186,
  centroY: 182,
};

const FLECHA = {
  desdeElBorde: 34, // a que distancia del canto de la pantalla
  radio: 20,
  // El area que responde es MAS GRANDE que el circulo dibujado: los dedos son
  // gordos, y aqui fallar no cuesta una vida pero molesta igual.
  margen: 14,
};

const PUNTITOS = {
  y: 322,
  separacion: 15,
  radio: 3.5,
};

// Cuanto hay que arrastrar el dedo para que cuente como pasar de mundo. Por
// debajo de esto se toma por un toque, que es lo que empieza la partida: si no,
// cualquier temblor al tocar la tarjeta cambiaria de mundo en vez de jugar.
const ARRASTRE_MINIMO = 26;

// Lo menos que puede pasar entre un mundo y el siguiente.
//
// Hace falta porque en Phaser 4 un `keydown-X` puede llegar VARIAS VECES por
// una sola pulsacion: el plugin de teclado encola los eventos del navegador y
// los vacia en su `update()`, y al soltar la tecla (`onKeyUp`) provoca otro
// vaciado que vuelve a emitir el keydown ya procesado. Medido: una pulsacion
// llegaba a mover CINCO mundos de golpe, y el numero cambiaba en cada intento.
//
// No estorba a quien deja la flecha apretada: la repeticion del sistema va mas
// lenta que esto, asi que se sigue pudiendo recorrer la lista de un tiron.
const ESPERA_ENTRE_MUNDOS = 90;

export class EscenaMundos extends Phaser.Scene {
  constructor() {
    super('mundos');
  }

  init(datos) {
    const d = datos || {};
    this.personajeId = d.personajeId || 'martin';
    // Lo que se arrastra si se viene de una partida en marcha (desde la
    // pantalla de victoria). Si no viene nada, es una partida nueva.
    this.partida = d.partida || null;
    this.indice = d.indiceNivel || 0;
    this.yendo = false;
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de siempre.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;
    pintarFondoDeMenu(this, ancho, alto);

    this.add
      .text(ancho / 2, 30, '¿A dónde quieren ir?', {
        fontFamily: FUENTE.familia,
        fontSize: '25px',
        color: COLORES.textoAcento,
        stroke: '#16202c',
        strokeThickness: 6,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Por cual se va, con todas las letras. Viendo uno solo hace falta saber
    // donde esta uno.
    this.cuenta = this.add
      .text(ancho / 2, 58, '', {
        fontFamily: FUENTE.familia,
        fontSize: '13px',
        color: COLORES.textoSuave,
        stroke: '#16202c',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.montarTarjeta(ancho);
    this.montarFlechas(ancho);
    this.montarPuntitos(ancho);

    this.add
      .text(
        ancho / 2,
        alto - 14,
        segunElMando(
          'Flechas  cambiar de mundo        Enter o clic  jugar        Esc  volver',
          'Desliza para ver los mundos  ·  toca el que quieras',
        ),
        {
          fontFamily: FUENTE.familia,
          fontSize: '11px',
          color: COLORES.textoSuave,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.escucharTeclado();
    this.escucharElDedo();
    this.mostrar(this.indice, { deGolpe: true });
  }

  // --- la tarjeta -----------------------------------------------------------

  // Se monta UNA sola vez y se le cambia el contenido al pasar de mundo. Montar
  // y destruir ocho veces seguidas mientras alguien desliza deprisa da tirones.
  montarTarjeta(ancho) {
    const x = ancho / 2;
    const y = TARJETA.centroY;

    this.lamina = this.add.image(x, y, TEXTURAS.fondoEnObra);

    this.marco = this.add
      .rectangle(x, y, TARJETA.ancho, TARJETA.alto)
      .setStrokeStyle(4, 0xffd54a, 0.95)
      .setInteractive({ useHandCursor: true });

    // el nombre, sobre una cinta oscura para que se lea encima del dibujo
    this.cinta = this.add.rectangle(
      x,
      y + TARJETA.alto / 2 - 20,
      TARJETA.ancho - 8,
      34,
      COLORES.decoFondo,
      0.76,
    );
    this.nombre = this.add
      .text(x, y + TARJETA.alto / 2 - 20, '', {
        fontFamily: FUENTE.familia,
        fontSize: '22px',
        color: COLORES.textoClaro,
      })
      .setOrigin(0.5);

    // Lo que paga su jefe, en una chapita arriba: es lo que invita a meterse en
    // los dificiles, asi que tiene que verse sin leer nada mas.
    this.chapa = this.add
      .rectangle(
        x + TARJETA.ancho / 2 - 38,
        y - TARJETA.alto / 2 + 18,
        62,
        24,
        COLORES.decoFondo,
        0.82,
      )
      .setStrokeStyle(1.5, COLORES.decoMarco, 0.9);
    this.pago = this.add
      .text(x + TARJETA.ancho / 2 - 38, y - TARJETA.alto / 2 + 18, '', {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);

    // y debajo, de quien es la arena
    this.jefe = this.add
      .text(x, y + TARJETA.alto / 2 + 12, '', {
        fontFamily: FUENTE.familia,
        fontSize: '14px',
        color: COLORES.textoSuave,
        align: 'center',
      })
      .setOrigin(0.5, 0);

    // Un toque en la tarjeta empieza la partida. Se apunta al apoyar el dedo y
    // se decide al levantarlo: si por el camino se arrastro, era un
    // deslizamiento para cambiar de mundo y no un toque.
    this.marco.on('pointerdown', () => {
      this.tocaronLaTarjeta = true;
    });
  }

  // Lo que se ve de este mundo. `deGolpe` se usa al entrar: la primera vez no
  // hay de donde venir, asi que no se anima.
  mostrar(cual, opciones = {}) {
    const total = NIVELES.length;
    const antes = this.indice;
    this.indice = ((cual % total) + total) % total;

    const nivel = NIVELES[this.indice];
    const ciudad = nivel.fondo || '';
    const jefe = jefeDelCuento(ciudad);

    this.cuenta.setText(`Mundo ${this.indice + 1} de ${total}`);
    this.nombre.setText(nivel.nombre);
    this.pago.setText(`+${premioDeJefe(this.indice)}`);

    // La ilustracion de la ciudad, recortada al trozo de en medio que tiene la
    // forma de la tarjeta y escalada para llenarla. Si algun mundo se anadiera
    // antes que su dibujo, se le pinta la obra.
    const suya = TEXTURAS.fondoDe(ciudad);
    const textura = this.textures.exists(suya) ? suya : TEXTURAS.fondoEnObra;
    const enObra = textura !== suya;
    this.jefe.setText(enObra ? `${jefe.nombre}  ·  en obra` : jefe.nombre);

    if (this.textures.exists(textura)) {
      this.lamina.setTexture(textura);
      const fuente = this.textures.get(textura).getSourceImage();
      const forma = TARJETA.ancho / TARJETA.alto;
      let anchoCorte = fuente.width;
      let altoCorte = Math.round(anchoCorte / forma);
      if (altoCorte > fuente.height) {
        altoCorte = fuente.height;
        anchoCorte = Math.round(altoCorte * forma);
      }
      this.lamina.setScale(TARJETA.ancho / anchoCorte);
      this.lamina.setCrop(
        Math.round((fuente.width - anchoCorte) / 2),
        Math.round((fuente.height - altoCorte) / 2),
        anchoCorte,
        altoCorte,
      );
    }

    this.pintarPuntitos();

    if (opciones.deGolpe || antes === this.indice) return;

    // Un empujoncito hacia donde se va, para que se note el cambio. No es un
    // carrusel de verdad (dos laminas deslizandose a la vez): con una sola
    // lamina no hay forma, y esto cuesta cuatro lineas.
    const haciaLaDerecha = (this.indice - antes + total) % total === 1;
    const desde = haciaLaDerecha ? 26 : -26;
    const piezas = [this.lamina, this.marco, this.cinta, this.nombre, this.chapa, this.pago];
    piezas.forEach((pieza) => {
      pieza.x += desde;
    });
    this.tweens.add({
      targets: piezas,
      x: `-=${desde}`,
      duration: 130,
      ease: 'Quad.easeOut',
    });
  }

  // Pasar al mundo de al lado POR PETICION DE QUIEN JUEGA (una tecla, una
  // flecha, un deslizamiento). Es la unica puerta que lleva guardia: `mostrar`
  // se queda limpia para cuando se la llame a proposito.
  //
  // El guardia esta por lo del teclado de Phaser (ver ESPERA_ENTRE_MUNDOS): sin
  // el, una sola pulsacion saltaba varios mundos.
  cambiarDeMundo(haciaDonde) {
    const ahora = this.time.now;
    if (this.ultimoCambio !== undefined && ahora - this.ultimoCambio < ESPERA_ENTRE_MUNDOS) {
      return;
    }
    this.ultimoCambio = ahora;
    this.mostrar(this.indice + haciaDonde);
  }

  // --- las flechas de los lados ---------------------------------------------

  montarFlechas(ancho) {
    this.flechas = [-1, 1].map((haciaDonde) => {
      const x = haciaDonde < 0 ? FLECHA.desdeElBorde : ancho - FLECHA.desdeElBorde;
      const y = TARJETA.centroY;

      const disco = this.add
        .circle(x, y, FLECHA.radio, COLORES.decoFondo, 0.72)
        .setStrokeStyle(2, COLORES.decoMarco, 0.9);

      // La punta, dibujada a mano: la tipografia no trae flechas y salen rotas.
      const punta = this.add.graphics().setDepth(1);
      punta.fillStyle(0xffd54a, 1);
      const p = 9;
      punta.beginPath();
      punta.moveTo(x + haciaDonde * p * 0.6, y);
      punta.lineTo(x - haciaDonde * p * 0.4, y - p);
      punta.lineTo(x - haciaDonde * p * 0.4, y + p);
      punta.closePath();
      punta.fillPath();

      disco
        .setInteractive(
          new Phaser.Geom.Circle(FLECHA.radio, FLECHA.radio, FLECHA.radio + FLECHA.margen),
          Phaser.Geom.Circle.Contains,
        )
        .on('pointerdown', () => {
          // no es un toque en la tarjeta: es pasar de mundo
          this.tocaronLaTarjeta = false;
          this.arrastrando = null;
          this.cambiarDeMundo(haciaDonde);
        });

      return { disco, punta, haciaDonde };
    });
  }

  // --- los puntitos de abajo ------------------------------------------------

  montarPuntitos(ancho) {
    const total = NIVELES.length;
    const inicio = ancho / 2 - ((total - 1) * PUNTITOS.separacion) / 2;
    this.puntitos = NIVELES.map((nada, i) =>
      this.add.circle(inicio + i * PUNTITOS.separacion, PUNTITOS.y, PUNTITOS.radio, 0xffffff),
    );
  }

  pintarPuntitos() {
    if (!this.puntitos) return;
    this.puntitos.forEach((punto, i) => {
      const esEste = i === this.indice;
      punto.setFillStyle(esEste ? 0xffd54a : COLORES.panelBorde);
      punto.setScale(esEste ? 1.5 : 1);
      punto.setAlpha(esEste ? 1 : 0.55);
    });
  }

  // --- como se maneja -------------------------------------------------------

  escucharTeclado() {
    const teclado = this.input.keyboard;
    this.manejadores = [
      ['keydown-LEFT', () => this.cambiarDeMundo(-1)],
      ['keydown-A', () => this.cambiarDeMundo(-1)],
      ['keydown-RIGHT', () => this.cambiarDeMundo(1)],
      ['keydown-D', () => this.cambiarDeMundo(1)],
      ['keydown-ENTER', () => this.empezar()],
      ['keydown-SPACE', () => this.empezar()],
      ['keydown-ESC', () => this.scene.start('seleccion')],
    ];
    this.manejadores.forEach(([evento, fn]) => teclado.on(evento, fn));
    this.events.once('shutdown', () => {
      this.manejadores.forEach(([evento, fn]) => teclado.off(evento, fn));
    });
  }

  // Deslizar con el dedo pasa de mundo; un toque sobre la tarjeta, juega.
  //
  // Las dos cosas se deciden AL LEVANTAR el dedo, no al apoyarlo: hasta que no
  // se levanta no se sabe si aquello era un toque o un arrastre. Y las
  // coordenadas del puntero vienen en pixeles del LIENZO, que es la pantalla
  // por la densidad, asi que hay que dividir para pensar en los 640 de siempre.
  escucharElDedo() {
    this.tocaronLaTarjeta = false;
    this.arrastrando = null;

    const alApoyar = (puntero) => {
      this.arrastrando = { x: puntero.x, y: puntero.y };
    };

    const alLevantar = (puntero) => {
      const desde = this.arrastrando;
      const tocoLaTarjeta = this.tocaronLaTarjeta;
      this.arrastrando = null;
      this.tocaronLaTarjeta = false;
      if (!desde) return;

      const densidad = RENDER.densidad || 1;
      const dx = (puntero.x - desde.x) / densidad;
      const dy = (puntero.y - desde.y) / densidad;

      // Se pide que el gesto sea MAS horizontal que vertical: si no, bajar el
      // dedo por la pantalla cambiaria de mundo sin querer.
      if (Math.abs(dx) >= ARRASTRE_MINIMO && Math.abs(dx) > Math.abs(dy)) {
        this.cambiarDeMundo(dx < 0 ? 1 : -1);
        return;
      }
      if (tocoLaTarjeta) this.empezar();
    };

    this.input.on('pointerdown', alApoyar);
    this.input.on('pointerup', alLevantar);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', alApoyar);
      this.input.off('pointerup', alLevantar);
    });
  }

  empezar() {
    if (this.yendo) return;
    this.yendo = true;
    empezarPartida(this, {
      ...(this.partida || {}),
      personajeId: this.personajeId,
      indiceNivel: this.indice,
      // Si se viene de una partida en marcha se conserva su identificador, para
      // que siga ocupando la misma fila del tablero; si no, empieza una nueva.
      partidaId: (this.partida && this.partida.partidaId) || nuevaPartida(),
    });
  }
}

export default EscenaMundos;
