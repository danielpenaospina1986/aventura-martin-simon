// ---------------------------------------------------------------------------
// FUENTE
// Carga la tipografia del juego antes de que Phaser dibuje el primer texto.
// Si no se espera, los primeros carteles salen con la tipografia del sistema.
//
// El TTF que se carga es el que genera herramientas/completar-fuente.mjs: el
// original no trae acentos, ni ene, ni signos de apertura.
// ---------------------------------------------------------------------------

import { NOMBRE_FUENTE } from '../config/estilo.js';
import urlFuente from '../assets/fuente-juego.ttf';

export async function cargarFuente() {
  try {
    const cara = new FontFace(NOMBRE_FUENTE, `url(${urlFuente})`);
    await cara.load();
    document.fonts.add(cara);
    await document.fonts.ready;
    return true;
  } catch (error) {
    // Sin la tipografia el juego se ve peor, pero se juega igual.
    console.warn('No se ha podido cargar la tipografia del juego:', error);
    return false;
  }
}

export default cargarFuente;
