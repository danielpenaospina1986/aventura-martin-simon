// ---------------------------------------------------------------------------
// LA RESENA DE CIUDAD
//
// La tarjeta que sale antes de cada tablero. Se pasa con Enter o con un clic, y
// con Esc tambien, que a la tercera partida ya se la saben.
//
// Es una escena de paso: recibe lo que hay que contar y a donde ir despues, lo
// cuenta y se aparta. Sigue aceptando varias vinetas aunque hoy le llegue una
// sola, que es lo que la hacia servir tambien para la intro y el final: esos se
// quitaron, porque el juego ya no lleva hilo de historia.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, RENDER } from '../config/ajustes.js';
import { COLORES, FUENTE } from '../config/estilo.js';
import { pintarFondoDeMenu, panelDeco } from '../sistemas/dibujo.js';
import { segunElMando } from '../sistemas/tactil.js';

export class EscenaRelato extends Phaser.Scene {
  constructor() {
    super('relato');
  }

  init(datos) {
    const d = datos || {};
    this.vinetas = d.vinetas && d.vinetas.length ? d.vinetas : [''];
    this.titulo = d.titulo || '';
    this.siguiente = d.siguiente || 'titulo';
    this.datosSiguiente = d.datosSiguiente || {};
    // Adonde va el Esc. Sin esto, saltarse la intro dejaba al jugador en la
    // tarjeta de la ciudad y habia que volver a saltar: "saltar todo" es saltar
    // todo, de una vez.
    this.saltarA = d.saltarA || null;
    this.indice = 0;
    // Ojo: la escena se reutiliza (la intro encadena con la tarjeta de ciudad),
    // asi que hay que rearmar esto aqui. Sin ello, la segunda tanda de vinetas
    // nacia creyendo que ya se estaba yendo y no respondia a nada.
    this.yendo = false;
  }

  create() {
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;

    pintarFondoDeMenu(this, ancho, alto, { velo: 0.62 });

    if (this.titulo) {
      this.add
        .text(ancho / 2, 62, this.titulo, {
          fontFamily: FUENTE.familia,
          fontSize: '34px',
          color: COLORES.textoAcento,
          stroke: '#1b1410',
          strokeThickness: 7,
        })
        .setOrigin(0.5);
    }

    const centroY = this.titulo ? 196 : 172;
    panelDeco(this, ancho / 2, centroY, 480, 128, { alpha: 0.86 });

    this.texto = this.add
      .text(ancho / 2, centroY, '', {
        fontFamily: FUENTE.familia,
        fontSize: '17px',
        color: COLORES.textoClaro,
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5);

    this.pie = this.add
      .text(ancho / 2, alto - 34, '', {
        fontFamily: FUENTE.familia,
        fontSize: '12px',
        color: COLORES.textoSuave,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.pie,
      alpha: { from: 1, to: 0.5 },
      duration: 760,
      yoyo: true,
      repeat: -1,
    });

    this.mostrar();
    this.escuchar();
  }

  escuchar() {
    const teclado = this.input.keyboard;
    this.manejadores = [
      ['keydown-ENTER', () => this.avanzar()],
      ['keydown-SPACE', () => this.avanzar()],
      ['keydown-ESC', () => this.salir(true)],
    ];
    this.manejadores.forEach(([evento, fn]) => teclado.on(evento, fn));
    this.input.on('pointerdown', () => this.avanzar());

    this.events.once('shutdown', () => {
      this.manejadores.forEach(([evento, fn]) => teclado.off(evento, fn));
    });
  }

  mostrar() {
    const esUltima = this.indice >= this.vinetas.length - 1;
    this.texto.setText(this.vinetas[this.indice]);
    this.texto.setAlpha(0);
    this.tweens.add({ targets: this.texto, alpha: 1, duration: 240 });
    // Con una sola resena, Enter y Esc llevan al mismo sitio: anunciar "saltar"
    // seria ofrecer algo que no existe.
    if (this.vinetas.length === 1) {
      this.pie.setText(segunElMando('Enter o clic para empezar', 'Toca para empezar'));
    } else {
      this.pie.setText(
        segunElMando(
          esUltima ? 'Enter para empezar      Esc saltar' : 'Enter para seguir      Esc saltar',
          esUltima ? 'Toca para empezar' : 'Toca para seguir',
        ),
      );
    }
  }

  avanzar() {
    if (this.yendo) return;
    this.indice += 1;
    if (this.indice >= this.vinetas.length) {
      this.salir();
      return;
    }
    this.mostrar();
  }

  salir(saltando = false) {
    if (this.yendo) return;
    this.yendo = true;

    const salta = saltando && this.saltarA;
    const escena = salta ? this.saltarA.escena : this.siguiente;
    const datos = salta ? this.saltarA.datos : this.datosSiguiente;

    this.cameras.main.fadeOut(salta ? 140 : 240, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(escena, datos);
    });
  }
}

export default EscenaRelato;
