import { chromium } from '@playwright/test';
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1920, height: 1080 } });
const errores = [];
pag.on('pageerror', (e) => errores.push(e.message));
await pag.goto('https://danielpenaospina1986.github.io/aventura-martin-simon/?t=' + Date.now(), { waitUntil: 'networkidle' });
await pag.waitForFunction(() => window.juego && window.juego.scene.isActive('titulo'), null, { timeout: 60000 });
await pag.waitForTimeout(1500);
const r = await pag.evaluate(() => {
  const j = window.juego;
  const esc = j.scene.getScene('titulo');
  return { canvas: [j.canvas.width, j.canvas.height], zoom: esc.cameras.main.zoom };
});
console.log('en la web publicada:', JSON.stringify(r));
await pag.keyboard.press('Enter'); await pag.waitForTimeout(900);
await pag.keyboard.press('Enter');
await pag.waitForFunction(() => window.juego.scene.isActive('nivel'), null, { timeout: 30000 });
await pag.waitForTimeout(1500);
const n = await pag.evaluate(() => {
  const esc = window.juego.scene.getScene('nivel');
  const cam = esc.cameras.main;
  const izq = cam.scrollX + (cam.width * (1 - 1 / cam.zoom)) / 2;
  return {
    zoom: cam.zoom,
    hudEnPantalla: Math.round(esc.hud.piezas[0].x - izq),
    fondo: !!esc.fondo.imagen.visible,
    suelo: esc.nivel.solidos.getChildren()[0].texture.key,
  };
});
console.log('nivel:', JSON.stringify(n));
console.log('errores:', errores.length ? errores : 'ninguno');
await pag.screenshot({ path: 'capturas/web-final.png' });
await nav.close();
