// ---------------------------------------------------------------------------
// LA FINCA: SIMON MALVADO
//
// El guardian del bano de El Refugio: un nino regordete con el pelo largo y
// cara y cuerpo de muneco de piezas de armar. Un malcriado de manual, que se
// defiende **tirando juguetes**. **Aguanta cinco.**
//
// Como se le gana: igual que a Papa Inodoro, y por eso hereda de el. Ronda
// dando brinquitos y tira juguetes en arco; cuando se harta **se enoja** —rojo
// y con vapor— y **embiste** de lado a lado. Al final de la embestida se
// estampa y se queda **aturdido** unos segundos, y esa es la unica ventana para
// darle: pisandolo, con la katana o con un bloque. Fuera de ella el golpe
// rebota con un ¡clonc!.
//
// Aguanta uno mas que Papa Inodoro porque La finca es el ultimo mundo y tiene
// que notarse. La pelea es la misma, asi que tampoco conviene alargarla mucho:
// el aturdimiento da para dos o tres golpes seguidos.
// ---------------------------------------------------------------------------

import { JEFE } from '../../config/ajustes.js';
import { TEXTURAS } from '../../config/estilo.js';
import { PapaInodoro } from './PapaInodoro.js';

const LO_DE_SIMON_MALVADO = {
  quieto: TEXTURAS.simonMalvadoQuieto,
  brinco: TEXTURAS.simonMalvadoBrinco,
  escupe: TEXTURAS.simonMalvadoEscupe,
  enojado: TEXTURAS.simonMalvadoEnojado,
  embiste: TEXTURAS.simonMalvadoEmbiste,
  aturdido: TEXTURAS.simonMalvadoAturdido,
  golpe: TEXTURAS.simonMalvadoGolpe,
  derrotado: TEXTURAS.simonMalvadoDerrotado,

  vidas: 5,

  // El es un MUNECO, no un retrete: ocupa su lienzo a lo ancho como cualquier
  // otro jefe, asi que lleva la caja de casa y no la estrecha de Papa Inodoro.
  // El alto es el de todos, para que se le pueda pisar desde el suelo.
  caja: JEFE.caja,

  municion: {
    quieta: TEXTURAS.juguete1,
    vuela: TEXTURAS.juguete2,
    seRompe: TEXTURAS.jugueteSplat,
  },
};

export class SimonMalvado extends PapaInodoro {
  constructor(escena, x, y, direccion = -1) {
    super(escena, x, y, direccion, LO_DE_SIMON_MALVADO);
  }
}

export default SimonMalvado;
