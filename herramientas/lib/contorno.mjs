// ---------------------------------------------------------------------------
// EL CONTORNO DE TINTA
//
// Le da la vuelta a un dibujo recortado con una linea negra gruesa por fuera,
// que es la marca de la casa de los dibujos animados de los anos 30.
//
// Se hace sacando la silueta (el dibujo tenido de negro) y estampandola
// alrededor, en circulo, antes de volver a poner el dibujo encima. Es una
// dilatacion de toda la vida, pero con drawImage, que lo hace la tarjeta
// grafica y no hay que recorrer pixel a pixel.
//
// Lo usan preparar-sprites.mjs y preparar-caras.mjs. El codigo se ejecuta
// DENTRO del navegador, asi que se instala una vez en la pagina y luego se
// llama desde cualquier page.evaluate.
// ---------------------------------------------------------------------------

export const CONTORNO = 5; // en pixeles del lienzo de 260
export const TINTA = '#161210';

export async function instalarContorno(pagina) {
  await pagina.evaluate(() => {
    // Quita la pelusa que deja el recorte: puntitos de dos o tres pixeles que
    // sobraron del fondo. Sin contorno no se notan; con el, cada mota se
    // convierte en un borron negro.
    window.quitarMotas = (lienzo, minimoRelativo = 0.0006) => {
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      const ancho = lienzo.width;
      const alto = lienzo.height;
      const datos = ctx.getImageData(0, 0, ancho, alto);
      const q = datos.data;
      const total = ancho * alto;
      const visitado = new Uint8Array(total);
      const minimo = Math.max(24, Math.round(total * minimoRelativo));
      let limpiado = false;

      for (let i = 0; i < total; i += 1) {
        if (visitado[i] || q[i * 4 + 3] <= 16) continue;
        const grupo = [];
        const pila = [i];
        visitado[i] = 1;
        while (pila.length) {
          const idx = pila.pop();
          grupo.push(idx);
          const x = idx % ancho;
          const vecinos = [idx + 1, idx - 1, idx + ancho, idx - ancho];
          for (let k = 0; k < 4; k += 1) {
            const v = vecinos[k];
            if (v < 0 || v >= total || visitado[v]) continue;
            if (k === 0 && x === ancho - 1) continue;
            if (k === 1 && x === 0) continue;
            if (q[v * 4 + 3] <= 16) continue;
            visitado[v] = 1;
            pila.push(v);
          }
        }
        if (grupo.length < minimo) {
          grupo.forEach((idx) => {
            q[idx * 4 + 3] = 0;
          });
          limpiado = true;
        }
      }
      if (limpiado) ctx.putImageData(datos, 0, 0);
      return lienzo;
    };

    // Borra todo lo que no este pegado a la mancha mas grande. Sirve cuando en
    // una hoja los dibujos se solapan y el recorte de uno arrastra un trozo del
    // vecino: el cepillo de una pose llegaba hasta dentro de la siguiente.
    //
    // Ojo: solo vale para dibujos de una pieza. En una pose con estrellitas o
    // polvo sueltos se las comeria.
    window.dejarSoloElCuerpo = (lienzo) => {
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      const ancho = lienzo.width;
      const alto = lienzo.height;
      const datos = ctx.getImageData(0, 0, ancho, alto);
      const q = datos.data;
      const total = ancho * alto;
      const visitado = new Uint8Array(total);
      const grupos = [];

      for (let i = 0; i < total; i += 1) {
        if (visitado[i] || q[i * 4 + 3] <= 16) continue;
        const grupo = [];
        const pila = [i];
        visitado[i] = 1;
        while (pila.length) {
          const idx = pila.pop();
          grupo.push(idx);
          const x = idx % ancho;
          const vecinos = [idx + 1, idx - 1, idx + ancho, idx - ancho];
          for (let k = 0; k < 4; k += 1) {
            const v = vecinos[k];
            if (v < 0 || v >= total || visitado[v]) continue;
            if (k === 0 && x === ancho - 1) continue;
            if (k === 1 && x === 0) continue;
            if (q[v * 4 + 3] <= 16) continue;
            visitado[v] = 1;
            pila.push(v);
          }
        }
        grupos.push(grupo);
      }

      if (grupos.length < 2) return lienzo;
      grupos.sort((a, b) => b.length - a.length);
      grupos.slice(1).forEach((grupo) => {
        grupo.forEach((idx) => {
          q[idx * 4 + 3] = 0;
        });
      });
      ctx.putImageData(datos, 0, 0);
      return lienzo;
    };

    // Devuelve un lienzo nuevo con el dibujo y su contorno.
    window.ponerContorno = (lienzo, grosor, tinta) => {
      if (!grosor || grosor <= 0) return lienzo;
      const ancho = lienzo.width;
      const alto = lienzo.height;

      const silueta = document.createElement('canvas');
      silueta.width = ancho;
      silueta.height = alto;
      const tctx = silueta.getContext('2d');
      tctx.drawImage(lienzo, 0, 0);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = tinta;
      tctx.fillRect(0, 0, ancho, alto);

      const salida = document.createElement('canvas');
      salida.width = ancho;
      salida.height = alto;
      const sctx = salida.getContext('2d');

      // se estampa la silueta en circulo; con 16 pasos no quedan muescas, y una
      // segunda vuelta a media distancia rellena las esquinas entrantes
      const pasos = 16;
      for (let vuelta = 0; vuelta < 2; vuelta += 1) {
        const radio = vuelta === 0 ? grosor : grosor * 0.6;
        const desfase = vuelta === 0 ? 0 : 0.5;
        for (let i = 0; i < pasos; i += 1) {
          const angulo = (Math.PI * 2 * (i + desfase)) / pasos;
          sctx.drawImage(silueta, Math.cos(angulo) * radio, Math.sin(angulo) * radio);
        }
      }

      sctx.drawImage(lienzo, 0, 0);
      return salida;
    };
  });
}

export default instalarContorno;
