// ---------------------------------------------------------------------------
// VICTORIA
// Sin castigos: se celebra y se cuenta como ha quedado el marcador.
//
// El marcador se explica desglosado a proposito, para que los ninos entiendan
// de donde sale cada punto: lo que recogieron, lo que costaron los golpes y lo
// que dio el jefe.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { MUNDO, PREMIO, PUNTOS, RENDER } from '../config/ajustes.js';
import { TOTAL_NIVELES } from '../niveles/index.js';
import { COLORES, FUENTE } from '../config/estilo.js';
import { PERSONAJES } from '../config/personajes.js';
import { aEscalaDeJuego, pintarFondoDeMenu, panelDeco } from '../sistemas/dibujo.js';
import { estrellitas } from '../sistemas/efectos.js';
import { Menu } from '../sistemas/menu.js';
import { empezarNivel } from '../sistemas/cuento.js';
import {
  alCambiarTablero,
  anotarPuntaje,
  puestoDe,
  sincronizarTablero,
} from '../sistemas/puntajes.js';
import { nombreDeSesion } from '../sistemas/sesion.js';

export class EscenaVictoria extends Phaser.Scene {
  constructor() {
    super('victoria');
  }

  init(datos) {
    const d = datos || {};
    this.personajeId = d.personajeId || 'martin';
    this.monedas = d.monedas || 0;
    this.total = d.total || 0;
    this.recogidas = d.recogidas || 0;
    this.golpes = d.golpes || 0;
    this.jefesDerrotados = d.jefesDerrotados || 0;
    this.puntosDeJefes = d.puntosDeJefes || 0;
    this.partidaId = d.partidaId || '';
    this.enemigosVencidos = d.enemigosVencidos || 0;
    this.indiceNivel = d.indiceNivel || 0;
    this.nombreNivel = d.nombreNivel || '';
    this.hayOtroNivel = this.indiceNivel + 1 < TOTAL_NIVELES;
  }

  create() {
    // El lienzo tiene mas pixeles que el juego, asi que la camara va con ese
    // zoom y aqui se sigue pensando en la pantalla de 640 x 360 de siempre.
    // Hay que recentrarla: con zoom, una camara sin tocar mira el centro de su
    // propio tamano en pixeles, que ya no es el centro del juego.
    this.cameras.main.setZoom(RENDER.densidad);
    this.cameras.main.centerOn(MUNDO.ancho / 2, MUNDO.alto / 2);
    const { ancho, alto } = MUNDO;
    const datos = PERSONAJES[this.personajeId];
    // los menus van sobre la portada, ya desenfocada de antemano
    pintarFondoDeMenu(this, ancho, alto);

    this.add
      .text(ancho / 2, 34, this.hayOtroNivel ? '¡Nivel superado!' : '¡Lo lograste!', {
        fontFamily: FUENTE.familia,
        fontSize: '34px',
        color: COLORES.textoAcento,
        stroke: '#1b1410',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const subtitulo = this.hayOtroNivel
      ? `${datos.nombre} se ha pasado "${this.nombreNivel}"`
      : `${datos.nombre} se ha pasado los ${TOTAL_NIVELES} niveles`;

    this.add
      .text(ancho / 2, 62, subtitulo, {
        fontFamily: FUENTE.familia,
        fontSize: '15px',
        color: COLORES.textoClaro,
        stroke: '#1b1410',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // el personaje dando saltos de alegria, con su carita
    // si el personaje tiene pose de celebracion, se usa esa; si no, su carita
    const celebra = datos.poses && datos.poses.victoria;
    const figura = this.add
      .image(100, 196, celebra || datos.cara)
      .setDisplaySize(celebra ? 130 : 100, celebra ? 130 : 100);
    this.tweens.add({
      targets: figura,
      y: figura.y - 12,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });
    this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => estrellitas(this, 100, 172, 7),
    });

    this.pintarMarcador(ancho / 2 + 62, 172);

    // SIEMPRE se apunta, al acabar cualquier mundo, no solo el ultimo. Los
    // ninos jugaban una tarde entera y no quedaba rastro: no se morian del todo
    // y tampoco se pasaban los cinco de un tiron, que son los dos unicos sitios
    // donde se apuntaba antes.
    //
    // No llena el tablero porque todas las llamadas de una misma partida van
    // con su identificador: se actualiza su fila en vez de anadir otra.
    this.tabla = anotarPuntaje(nombreDeSesion(), this.monedas, {
      personaje: datos.nombre,
      nivel: this.indiceNivel + 1,
      partida: this.partidaId,
    });
    this.puesto = puestoDe(this.partidaId);

    // Lo que se arrastra al siguiente nivel: la partida es de los cinco.
    const partida = {
      personajeId: this.personajeId,
      monedas: this.monedas,
      recogidas: this.recogidas,
      golpes: this.golpes,
      jefesDerrotados: this.jefesDerrotados,
      puntosDeJefes: this.puntosDeJefes,
      partidaId: this.partidaId,
      enemigosVencidos: this.enemigosVencidos,
    };

    const opciones = [];
    if (this.hayOtroNivel) {
      opciones.push({
        etiqueta: `Siguiente nivel  (${this.indiceNivel + 2} de ${TOTAL_NIVELES})`,
        alElegir: () => empezarNivel(this, { ...partida, indiceNivel: this.indiceNivel + 1 }),
      });
    }
    // Se salta a cualquier mundo SIN perder lo sumado: es lo que deja seguir
    // jugando despues de pasarse los cinco, y de paso sirve para repetir este
    // mismo, asi que la opcion de "repetir" sobraba.
    opciones.push({
      etiqueta: 'Elegir otro mundo',
      alElegir: () =>
        this.scene.start('mundos', {
          personajeId: this.personajeId,
          partida,
          indiceNivel: this.indiceNivel,
        }),
    });
    opciones.push({ etiqueta: 'Cambiar personaje', alElegir: () => this.scene.start('seleccion') });

    // Debajo del marcador, que acaba en 274. Con tres opciones la ultima cae en
    // 342, y el borde de la pantalla esta en 360: por eso la separacion baja a
    // 25. Antes el menu empezaba en 296 y la primera opcion se montaba encima
    // del panel.
    new Menu(this, opciones, {
      x: ancho / 2,
      y: 292,
      separacion: 25,
      tamano: 16,
    });
  }

  // --- el desglose del marcador ---------------------------------------------

  pintarMarcador(cx, cy) {
    const datos = PERSONAJES[this.personajeId];
    const anchoPanel = 320;
    panelDeco(this, cx, cy, anchoPanel, 204, { escalon: 10 });

    const izquierda = cx - anchoPanel / 2 + 22;
    const derecha = cx + anchoPanel / 2 - 22;

    const linea = (y, texto, valor, color = COLORES.textoSuave) => {
      this.add
        .text(izquierda, y, texto, {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(derecha, y, valor, {
          fontFamily: FUENTE.familia,
          fontSize: '13px',
          color,
        })
        .setOrigin(1, 0.5);
    };

    this.add
      .text(cx, cy - 72, 'Marcador', {
        fontFamily: FUENTE.familia,
        fontSize: '17px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0.5);

    const perdido = this.golpes * Math.abs(PUNTOS.porGolpe);
    // Lo que pagaron los jefes va guardado, no multiplicado: cada mundo paga
    // lo suyo segun lo dificil que sea.
    const bonus = this.puntosDeJefes;

    linea(cy - 42, `${datos.nombreMoneda} recogidos`, `+${this.recogidas}`, COLORES.textoClaro);
    linea(
      cy - 21,
      this.golpes === 1 ? '1 golpe o caída' : `${this.golpes} golpes o caídas`,
      perdido ? `-${perdido}` : '0',
      this.golpes ? '#ff8f8f' : COLORES.textoSuave,
    );
    linea(
      cy + 1,
      this.enemigosVencidos === 1 ? '1 bicho vencido' : `${this.enemigosVencidos} bichos vencidos`,
      `+${this.enemigosVencidos * PUNTOS.porEnemigo}`,
      COLORES.textoClaro,
    );
    linea(cy + 23, this.jefesDerrotados ? 'Jefes derrotados' : 'Sin jefe', `+${bonus}`, COLORES.textoClaro);

    // raya de separacion
    const raya = this.add.graphics();
    raya.lineStyle(2, COLORES.decoMarcoOscuro, 0.9);
    raya.beginPath();
    raya.moveTo(izquierda, cy + 42);
    raya.lineTo(derecha, cy + 42);
    raya.strokePath();

    // El total y la linea de cierre van separados a proposito: pegados (64 y 84)
    // el numero, que va a 25 px, casi rozaba el letrero de abajo.
    this.add
      .text(izquierda, cy + 60, 'Total', {
        fontFamily: FUENTE.familia,
        fontSize: '20px',
        color: COLORES.textoAcento,
      })
      .setOrigin(0, 0.5);

    this.add
      .image(derecha - 54, cy + 60, datos.moneda)
      .setDisplaySize(PREMIO.ancho, PREMIO.alto);

    this.add
      .text(derecha, cy + 60, String(this.monedas), {
        fontFamily: FUENTE.familia,
        fontSize: '25px',
        color: COLORES.textoAcento,
      })
      .setOrigin(1, 0.5);

    // Aqui va SIEMPRE que el puntaje quedo apuntado, y en que puesto. Tiene que
    // verse: de esto depende quien gana el premio de diciembre, asi que no
    // puede ser un secreto. Antes esta linea llevaba una gracia del marcador
    // ("prueba con Samaon", "sin un solo golpe"), pero en dos lineas no cabia
    // dentro del panel y esto importa mas.
    const apuntado = this.add
      .text(cx, cy + 86, this.loApuntado(), {
        fontFamily: FUENTE.familia,
        fontSize: '11px',
        color: COLORES.textoAcento,
        align: 'center',
      })
      .setOrigin(0.5);

    // El puesto se dice con lo que sabe este equipo, que puede no ser todo: al
    // otro nino le pueden haber ganado desde otro aparato. Cuando la nube
    // contesta, el puesto se corrige aqui mismo.
    const darseDeBaja = alCambiarTablero(() => {
      this.puesto = puestoDe(this.partidaId);
      apuntado.setText(this.loApuntado());
    });
    this.events.once('shutdown', darseDeBaja);
    sincronizarTablero();
  }

  loApuntado() {
    const quien = nombreDeSesion() || 'Sin nombre';
    if (this.puesto) return `Apuntado como ${quien}  ·  ${this.puesto}.º del tablero`;
    return `Apuntado como ${quien}`;
  }

}

export default EscenaVictoria;
