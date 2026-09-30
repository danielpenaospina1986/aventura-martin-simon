// ---------------------------------------------------------------------------
// ESCENA DE CARGA
// Genera todas las texturas provisionales y pasa al titulo.
// Cuando llegue el arte de verdad, aqui se hara el load.image de los PNG.
// ---------------------------------------------------------------------------

import Phaser from 'phaser';
import { generarTexturas } from '../sistemas/dibujo.js';
import { cargarFuente } from '../sistemas/fuente.js';
import { TEXTURAS } from '../config/estilo.js';
// Importado asi para que Vite le ponga la ruta correcta tambien al publicarlo
// en una subcarpeta (GitHub Pages).
import fondoBarrio from '../assets/fondo-barrio.jpg';
import portada from '../assets/portada.jpg';
import sushiPng from '../assets/objetos/sushi.png';
import legoPng from '../assets/objetos/lego.png';
import banderaCoPng from '../assets/objetos/bandera-co.png';
import banderaUsPng from '../assets/objetos/bandera-us.png';
import puertaPng from '../assets/objetos/puerta.png';
// Space Coast: Papa Inodoro, con sus ocho poses y su heladito
import inodoroQuieto from '../assets/jefes/inodoro/quieto.webp';
import inodoroBrinco from '../assets/jefes/inodoro/brinco.webp';
import inodoroEscupe from '../assets/jefes/inodoro/escupe.webp';
import inodoroEnojado from '../assets/jefes/inodoro/enojado.webp';
import inodoroEmbiste from '../assets/jefes/inodoro/embiste.webp';
import inodoroAturdido from '../assets/jefes/inodoro/aturdido.webp';
import inodoroGolpe from '../assets/jefes/inodoro/golpe.webp';
import inodoroDerrotado from '../assets/jefes/inodoro/derrotado.webp';
import helado1 from '../assets/jefes/inodoro/helado1.png';
import helado2 from '../assets/jefes/inodoro/helado2.png';
import heladoSplat from '../assets/jefes/inodoro/helado-splat.png';
// Medellin: el Abuelo y su pickup, con sus canastillas de fruta
import abueloRonda from '../assets/jefes/abuelo/ronda.webp';
import abueloAvisa from '../assets/jefes/abuelo/avisa.webp';
import abueloEmbiste from '../assets/jefes/abuelo/embiste.webp';
import abueloResopla from '../assets/jefes/abuelo/resopla.webp';
import abueloGolpe from '../assets/jefes/abuelo/golpe.webp';
import abueloDerrotado from '../assets/jefes/abuelo/derrotado.webp';
import canastilla from '../assets/jefes/abuelo/canastilla.png';
import canastillaCae from '../assets/jefes/abuelo/canastilla-cae.png';
import canastillaRota from '../assets/jefes/abuelo/canastilla-rota.png';
// Miami: Martin Malvado, con sus pegotes de relleno
import malvadoVigila from '../assets/jefes/malvado/vigila.webp';
import malvadoTira from '../assets/jefes/malvado/tira.webp';
import malvadoSalta from '../assets/jefes/malvado/salta.webp';
import malvadoBaja from '../assets/jefes/malvado/baja.webp';
import malvadoGolpe from '../assets/jefes/malvado/golpe.webp';
import malvadoDerrotado from '../assets/jefes/malvado/derrotado.webp';
import relleno from '../assets/jefes/malvado/relleno.png';
import rellenoGira from '../assets/jefes/malvado/relleno-gira.png';
import rellenoSplat from '../assets/jefes/malvado/relleno-splat.png';
// Cartagena: Jean Luke, con sus globos de agua
import jeanLukeMarcha from '../assets/jefes/jeanluke/marcha.webp';
import jeanLukeApunta from '../assets/jefes/jeanluke/apunta.webp';
import jeanLukeTira from '../assets/jefes/jeanluke/tira.webp';
import jeanLukeRecarga from '../assets/jefes/jeanluke/recarga.webp';
import jeanLukeGolpe from '../assets/jefes/jeanluke/golpe.webp';
import jeanLukeDerrotado from '../assets/jefes/jeanluke/derrotado.webp';
import globo from '../assets/jefes/jeanluke/globo.png';
import globoVuela from '../assets/jefes/jeanluke/globo-vuela.png';
import globoRevienta from '../assets/jefes/jeanluke/globo-revienta.png';

// Orlando: el Tio Camilo, con sus balones en llamas
import tioCamiloMarcha from '../assets/jefes/camilo/marcha.webp';
import tioCamiloApunta from '../assets/jefes/camilo/apunta.webp';
import tioCamiloTira from '../assets/jefes/camilo/tira.webp';
import tioCamiloRecarga from '../assets/jefes/camilo/recarga.webp';
import tioCamiloGolpe from '../assets/jefes/camilo/golpe.webp';
import tioCamiloDerrotado from '../assets/jefes/camilo/derrotado.webp';
import balon from '../assets/jefes/camilo/balon.png';
import balonVuela from '../assets/jefes/camilo/balon-vuela.png';
import balonRevienta from '../assets/jefes/camilo/balon-revienta.png';

// Lake Lanier: Chad, con sus panqueques
import chadVigila from '../assets/jefes/chad/vigila.webp';
import chadTira from '../assets/jefes/chad/tira.webp';
import chadSalta from '../assets/jefes/chad/salta.webp';
import chadBaja from '../assets/jefes/chad/baja.webp';
import chadGolpe from '../assets/jefes/chad/golpe.webp';
import chadDerrotado from '../assets/jefes/chad/derrotado.webp';
import panqueque from '../assets/jefes/chad/panqueque.png';
import panquequeGira from '../assets/jefes/chad/panqueque-gira.png';
import panquequeSplat from '../assets/jefes/chad/panqueque-splat.png';

// La finca: Simon Malvado, con sus juguetes
import simonMalvadoQuieto from '../assets/jefes/simonmalvado/quieto.webp';
import simonMalvadoBrinco from '../assets/jefes/simonmalvado/brinco.webp';
import simonMalvadoEscupe from '../assets/jefes/simonmalvado/escupe.webp';
import simonMalvadoEnojado from '../assets/jefes/simonmalvado/enojado.webp';
import simonMalvadoEmbiste from '../assets/jefes/simonmalvado/embiste.webp';
import simonMalvadoAturdido from '../assets/jefes/simonmalvado/aturdido.webp';
import simonMalvadoGolpe from '../assets/jefes/simonmalvado/golpe.webp';
import simonMalvadoDerrotado from '../assets/jefes/simonmalvado/derrotado.webp';
import juguete1 from '../assets/jefes/simonmalvado/juguete1.png';
import juguete2 from '../assets/jefes/simonmalvado/juguete2.png';
import jugueteSplat from '../assets/jefes/simonmalvado/juguete-splat.png';
import zullyQuieta from '../assets/jefes/zully/quieta.png';
import zullyMirada from '../assets/jefes/zully/mirada.png';
import zullyEmpapada from '../assets/jefes/zully/empapada.png';
import zullyVictoria from '../assets/jefes/zully/victoria.png';
import zullyChorro from '../assets/jefes/zully/chorro.png';
import zullyBoquilla from '../assets/jefes/zully/boquilla.png';
import frentePalmera from '../assets/frente/palmera.png';
import frenteAlien from '../assets/frente/alien.png';
import frenteAstronauta from '../assets/frente/astronauta.png';
import frenteChiva from '../assets/frente/chiva.webp';
import frenteFrijoles from '../assets/frente/frijoles.png';
import frentePalmeraAlta from '../assets/frente/palmera-alta.png';
import frenteGuayacan from '../assets/frente/guayacan.webp';
import frenteGuayacanFondo from '../assets/frente/guayacan-fondo.webp';
import frenteGato from '../assets/frente/gato.webp';
import frenteCasa from '../assets/frente/casa.webp';
import frenteAbueloCaballo from '../assets/frente/abuelo-caballo.webp';
import frenteCorral from '../assets/frente/corral.webp';
import frenteMango from '../assets/frente/mango.webp';
import frenteAbuelita from '../assets/frente/abuelita.webp';
import frenteCachorroNegro from '../assets/frente/cachorro-negro.webp';
import frenteCachorroPinto from '../assets/frente/cachorro-pinto.webp';
import frenteCachorroBlanco from '../assets/frente/cachorro-blanco.webp';
import frenteCasaVictoriana from '../assets/frente/casa-victoriana.webp';
import frenteRoble from '../assets/frente/roble.webp';
import frentePino from '../assets/frente/pino.webp';
import frenteGata from '../assets/frente/gata.webp';
import frenteEufonio from '../assets/frente/eufonio.webp';
import frenteCasaFlorida from '../assets/frente/casa-florida.webp';
import frenteJeep from '../assets/frente/jeep.webp';
import frenteLetrero from '../assets/frente/letrero.webp';
import portadaMenu from '../assets/portada-menu.jpg';
import fondoSpaceCoast from '../assets/fondos/space-coast.jpg';
import fondoMedellin from '../assets/fondos/medellin.jpg';
import fondoAtlanta from '../assets/fondos/atlanta.jpg';
import fondoMiami from '../assets/fondos/miami.jpg';
import fondoCartagena from '../assets/fondos/cartagena.jpg';
import fondoOrlando from '../assets/fondos/orlando.jpg';

// Los bichos que embisten: DIEZ pieles por seis poses, una por mundo (ver
// config/bichos.js). Se traen de un tiron con import.meta.glob, que es lo que
// evita escribir sesenta lineas de import a mano y, sobre todo, lo que hace que
// anadir una piel nueva sea dejar su carpeta ahi y nada mas.
const FOTOGRAMAS_DE_BICHOS = import.meta.glob('../assets/bichos/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
import fondoLakeLanier from '../assets/fondos/lake-lanier.jpg';
import fondoFinca from '../assets/fondos/finca.jpg';

// Un fondo por ciudad. La clave la arma TEXTURAS.fondoDe con el mismo nombre
// que lleva cada nivel en su campo "fondo".
const FONDOS_CIUDAD = {
  'space-coast': fondoSpaceCoast,
  medellin: fondoMedellin,
  atlanta: fondoAtlanta,
  miami: fondoMiami,
  cartagena: fondoCartagena,
  orlando: fondoOrlando,
  'lake-lanier': fondoLakeLanier,
  finca: fondoFinca,
};
import caraMartin from '../assets/cara-martin.png';
import caraSimon from '../assets/cara-simon.png';
import simonQuieto from '../assets/simon/quieto.png';
import simonCorre1 from '../assets/simon/corre1.png';
import simonCorre2 from '../assets/simon/corre2.png';
import simonCorre3 from '../assets/simon/corre3.png';
import simonCorre4 from '../assets/simon/corre4.png';
import simonCorre5 from '../assets/simon/corre5.png';
import simonLanza from '../assets/simon/lanza.png';
import simonGolpe from '../assets/simon/golpe.png';
import simonVictoria from '../assets/simon/victoria.png';
import martinQuieto from '../assets/martin/quieto.png';
import martinCorre1 from '../assets/martin/corre1.png';
import martinCorre2 from '../assets/martin/corre2.png';
import martinCorre3 from '../assets/martin/corre3.png';
import martinCorre4 from '../assets/martin/corre4.png';
import martinAtaque1 from '../assets/martin/ataque1.png';
import martinAtaque2 from '../assets/martin/ataque2.png';
import martinGolpe from '../assets/martin/golpe.png';
import martinVictoria from '../assets/martin/victoria.png';
import baneraQuieta from '../assets/bichos/banera/quieta.png';
import baneraAnda1 from '../assets/bichos/banera/anda1.png';
import baneraAnda2 from '../assets/bichos/banera/anda2.png';
import baneraCarga from '../assets/bichos/banera/carga.png';
import baneraLanza from '../assets/bichos/banera/lanza.png';
import palomaVuela1 from '../assets/bichos/paloma/vuela1.png';
import palomaVuela2 from '../assets/bichos/paloma/vuela2.png';
import palomaVuela3 from '../assets/bichos/paloma/vuela3.png';
import palomaVuela4 from '../assets/bichos/paloma/vuela4.png';
import palomaSuelta from '../assets/bichos/paloma/suelta1.png';
import palomaMareada from '../assets/bichos/paloma/mareada.png';
import palomaCae1 from '../assets/bichos/paloma/cae1.png';
import palomaCae2 from '../assets/bichos/paloma/cae2.png';
import palomaCae3 from '../assets/bichos/paloma/cae3.png';
import palomaSuelo from '../assets/bichos/paloma/suelo.png';
import vacaAnda1 from '../assets/bichos/vaca/anda1.webp';
import vacaAnda2 from '../assets/bichos/vaca/anda2.webp';
import vacaAvisa from '../assets/bichos/vaca/avisa.webp';
import vacaEmbiste1 from '../assets/bichos/vaca/embiste1.webp';
import vacaEmbiste2 from '../assets/bichos/vaca/embiste2.webp';
import vacaTumbada from '../assets/bichos/vaca/tumbada.webp';

export class EscenaCarga extends Phaser.Scene {
  constructor() {
    super('carga');
  }

  preload() {
    this.load.image(TEXTURAS.fondo, fondoBarrio);
    this.load.image(TEXTURAS.portada, portada);
    this.load.image(TEXTURAS.sushi, sushiPng);
    this.load.image(TEXTURAS.lego, legoPng);
    this.load.image(TEXTURAS.banderaCo, banderaCoPng);
    this.load.image(TEXTURAS.banderaUs, banderaUsPng);
    this.load.image(TEXTURAS.puerta, puertaPng);
    this.load.image(TEXTURAS.inodoroQuieto, inodoroQuieto);
    this.load.image(TEXTURAS.inodoroBrinco, inodoroBrinco);
    this.load.image(TEXTURAS.inodoroEscupe, inodoroEscupe);
    this.load.image(TEXTURAS.inodoroEnojado, inodoroEnojado);
    this.load.image(TEXTURAS.inodoroEmbiste, inodoroEmbiste);
    this.load.image(TEXTURAS.inodoroAturdido, inodoroAturdido);
    this.load.image(TEXTURAS.inodoroGolpe, inodoroGolpe);
    this.load.image(TEXTURAS.inodoroDerrotado, inodoroDerrotado);
    this.load.image(TEXTURAS.helado1, helado1);
    this.load.image(TEXTURAS.helado2, helado2);
    this.load.image(TEXTURAS.heladoSplat, heladoSplat);
    this.load.image(TEXTURAS.abueloRonda, abueloRonda);
    this.load.image(TEXTURAS.abueloAvisa, abueloAvisa);
    this.load.image(TEXTURAS.abueloEmbiste, abueloEmbiste);
    this.load.image(TEXTURAS.abueloResopla, abueloResopla);
    this.load.image(TEXTURAS.abueloGolpe, abueloGolpe);
    this.load.image(TEXTURAS.abueloDerrotado, abueloDerrotado);
    this.load.image(TEXTURAS.canastilla, canastilla);
    this.load.image(TEXTURAS.canastillaCae, canastillaCae);
    this.load.image(TEXTURAS.canastillaRota, canastillaRota);
    this.load.image(TEXTURAS.malvadoVigila, malvadoVigila);
    this.load.image(TEXTURAS.malvadoTira, malvadoTira);
    this.load.image(TEXTURAS.malvadoSalta, malvadoSalta);
    this.load.image(TEXTURAS.malvadoBaja, malvadoBaja);
    this.load.image(TEXTURAS.malvadoGolpe, malvadoGolpe);
    this.load.image(TEXTURAS.malvadoDerrotado, malvadoDerrotado);
    this.load.image(TEXTURAS.relleno, relleno);
    this.load.image(TEXTURAS.rellenoGira, rellenoGira);
    this.load.image(TEXTURAS.rellenoSplat, rellenoSplat);
    this.load.image(TEXTURAS.jeanLukeMarcha, jeanLukeMarcha);
    this.load.image(TEXTURAS.jeanLukeApunta, jeanLukeApunta);
    this.load.image(TEXTURAS.jeanLukeTira, jeanLukeTira);
    this.load.image(TEXTURAS.jeanLukeRecarga, jeanLukeRecarga);
    this.load.image(TEXTURAS.jeanLukeGolpe, jeanLukeGolpe);
    this.load.image(TEXTURAS.jeanLukeDerrotado, jeanLukeDerrotado);
    this.load.image(TEXTURAS.globo, globo);
    this.load.image(TEXTURAS.globoVuela, globoVuela);
    this.load.image(TEXTURAS.globoRevienta, globoRevienta);
    this.load.image(TEXTURAS.tioCamiloMarcha, tioCamiloMarcha);
    this.load.image(TEXTURAS.tioCamiloApunta, tioCamiloApunta);
    this.load.image(TEXTURAS.tioCamiloTira, tioCamiloTira);
    this.load.image(TEXTURAS.tioCamiloRecarga, tioCamiloRecarga);
    this.load.image(TEXTURAS.tioCamiloGolpe, tioCamiloGolpe);
    this.load.image(TEXTURAS.tioCamiloDerrotado, tioCamiloDerrotado);
    this.load.image(TEXTURAS.balon, balon);
    this.load.image(TEXTURAS.balonVuela, balonVuela);
    this.load.image(TEXTURAS.balonRevienta, balonRevienta);
    this.load.image(TEXTURAS.chadVigila, chadVigila);
    this.load.image(TEXTURAS.chadTira, chadTira);
    this.load.image(TEXTURAS.chadSalta, chadSalta);
    this.load.image(TEXTURAS.chadBaja, chadBaja);
    this.load.image(TEXTURAS.chadGolpe, chadGolpe);
    this.load.image(TEXTURAS.chadDerrotado, chadDerrotado);
    this.load.image(TEXTURAS.panqueque, panqueque);
    this.load.image(TEXTURAS.panquequeGira, panquequeGira);
    this.load.image(TEXTURAS.panquequeSplat, panquequeSplat);
    this.load.image(TEXTURAS.simonMalvadoQuieto, simonMalvadoQuieto);
    this.load.image(TEXTURAS.simonMalvadoBrinco, simonMalvadoBrinco);
    this.load.image(TEXTURAS.simonMalvadoEscupe, simonMalvadoEscupe);
    this.load.image(TEXTURAS.simonMalvadoEnojado, simonMalvadoEnojado);
    this.load.image(TEXTURAS.simonMalvadoEmbiste, simonMalvadoEmbiste);
    this.load.image(TEXTURAS.simonMalvadoAturdido, simonMalvadoAturdido);
    this.load.image(TEXTURAS.simonMalvadoGolpe, simonMalvadoGolpe);
    this.load.image(TEXTURAS.simonMalvadoDerrotado, simonMalvadoDerrotado);
    this.load.image(TEXTURAS.juguete1, juguete1);
    this.load.image(TEXTURAS.juguete2, juguete2);
    this.load.image(TEXTURAS.jugueteSplat, jugueteSplat);
    this.load.image(TEXTURAS.zullyQuieta, zullyQuieta);
    this.load.image(TEXTURAS.zullyMirada, zullyMirada);
    this.load.image(TEXTURAS.zullyEmpapada, zullyEmpapada);
    this.load.image(TEXTURAS.zullyVictoria, zullyVictoria);
    this.load.image(TEXTURAS.zullyChorro, zullyChorro);
    this.load.image(TEXTURAS.zullyBoquilla, zullyBoquilla);
    this.load.image(TEXTURAS.frentePalmera, frentePalmera);
    this.load.image(TEXTURAS.frenteAlien, frenteAlien);
    this.load.image(TEXTURAS.frenteAstronauta, frenteAstronauta);
    this.load.image(TEXTURAS.frenteChiva, frenteChiva);
    this.load.image(TEXTURAS.frenteFrijoles, frenteFrijoles);
    this.load.image(TEXTURAS.frentePalmeraAlta, frentePalmeraAlta);
    this.load.image(TEXTURAS.frenteGuayacan, frenteGuayacan);
    this.load.image(TEXTURAS.frenteGuayacanFondo, frenteGuayacanFondo);
    this.load.image(TEXTURAS.frenteGato, frenteGato);
    this.load.image(TEXTURAS.frenteCasa, frenteCasa);
    this.load.image(TEXTURAS.frenteAbueloCaballo, frenteAbueloCaballo);
    this.load.image(TEXTURAS.frenteCorral, frenteCorral);
    this.load.image(TEXTURAS.frenteMango, frenteMango);
    this.load.image(TEXTURAS.frenteAbuelita, frenteAbuelita);
    this.load.image(TEXTURAS.frenteCachorroNegro, frenteCachorroNegro);
    this.load.image(TEXTURAS.frenteCachorroPinto, frenteCachorroPinto);
    this.load.image(TEXTURAS.frenteCachorroBlanco, frenteCachorroBlanco);
    this.load.image(TEXTURAS.frenteCasaVictoriana, frenteCasaVictoriana);
    this.load.image(TEXTURAS.frenteRoble, frenteRoble);
    this.load.image(TEXTURAS.frentePino, frentePino);
    this.load.image(TEXTURAS.frenteGata, frenteGata);
    this.load.image(TEXTURAS.frenteEufonio, frenteEufonio);
    this.load.image(TEXTURAS.frenteCasaFlorida, frenteCasaFlorida);
    this.load.image(TEXTURAS.frenteJeep, frenteJeep);
    this.load.image(TEXTURAS.frenteLetrero, frenteLetrero);
    this.load.image(TEXTURAS.portadaMenu, portadaMenu);
    Object.entries(FONDOS_CIUDAD).forEach(([ciudad, url]) => {
      this.load.image(TEXTURAS.fondoDe(ciudad), url);
    });
    this.load.image(TEXTURAS.caraMartin, caraMartin);
    this.load.image(TEXTURAS.caraSimon, caraSimon);
    this.load.image(TEXTURAS.simonQuieto, simonQuieto);
    this.load.image(TEXTURAS.simonCorre1, simonCorre1);
    this.load.image(TEXTURAS.simonCorre2, simonCorre2);
    this.load.image(TEXTURAS.simonCorre3, simonCorre3);
    this.load.image(TEXTURAS.simonCorre4, simonCorre4);
    this.load.image(TEXTURAS.simonCorre5, simonCorre5);
    this.load.image(TEXTURAS.simonLanza, simonLanza);
    this.load.image(TEXTURAS.simonGolpe, simonGolpe);
    this.load.image(TEXTURAS.simonVictoria, simonVictoria);
    this.load.image(TEXTURAS.martinQuieto, martinQuieto);
    this.load.image(TEXTURAS.martinCorre1, martinCorre1);
    this.load.image(TEXTURAS.martinCorre2, martinCorre2);
    this.load.image(TEXTURAS.martinCorre3, martinCorre3);
    this.load.image(TEXTURAS.martinCorre4, martinCorre4);
    this.load.image(TEXTURAS.martinAtaque1, martinAtaque1);
    this.load.image(TEXTURAS.martinAtaque2, martinAtaque2);
    this.load.image(TEXTURAS.martinGolpe, martinGolpe);
    this.load.image(TEXTURAS.martinVictoria, martinVictoria);
    this.load.image(TEXTURAS.baneraQuieta, baneraQuieta);
    this.load.image(TEXTURAS.baneraAnda1, baneraAnda1);
    this.load.image(TEXTURAS.baneraAnda2, baneraAnda2);
    this.load.image(TEXTURAS.baneraCarga, baneraCarga);
    this.load.image(TEXTURAS.baneraLanza, baneraLanza);
    this.load.image(TEXTURAS.palomaVuela1, palomaVuela1);
    this.load.image(TEXTURAS.palomaVuela2, palomaVuela2);
    this.load.image(TEXTURAS.palomaVuela3, palomaVuela3);
    this.load.image(TEXTURAS.palomaVuela4, palomaVuela4);
    this.load.image(TEXTURAS.palomaSuelta, palomaSuelta);
    this.load.image(TEXTURAS.palomaMareada, palomaMareada);
    this.load.image(TEXTURAS.palomaCae1, palomaCae1);
    this.load.image(TEXTURAS.palomaCae2, palomaCae2);
    this.load.image(TEXTURAS.palomaCae3, palomaCae3);
    this.load.image(TEXTURAS.palomaSuelo, palomaSuelo);
    // Todas las pieles del bicho que embiste, de un tiron: la clave la arma
    // TEXTURAS.bichoDe con la carpeta (la piel) y el archivo (la pose).
    Object.entries(FOTOGRAMAS_DE_BICHOS).forEach(([ruta, url]) => {
      const donde = ruta.match(/bichos\/([^/]+)\/([^/]+)\.webp$/);
      if (donde) this.load.image(TEXTURAS.bichoDe(donde[1], donde[2]), url);
    });
  }

  create() {
    generarTexturas(this);
    // La tipografia tiene que estar lista antes del primer cartel.
    cargarFuente().then(() => this.scene.start('titulo'));
  }
}

export default EscenaCarga;
