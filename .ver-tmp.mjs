import { chromium } from '@playwright/test';
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1280, height: 720 } });
await pag.goto('http://127.0.0.1:5173/?densidad=1');
await pag.waitForFunction(() => window.juego && window.juego.scene.isActive('titulo'), null, { timeout: 30000 });
await pag.keyboard.press('Enter'); await pag.waitForTimeout(600);
await pag.keyboard.press('Enter');
await pag.waitForFunction(() => window.juego.scene.isActive('nivel'), null, { timeout: 20000 });
await pag.waitForTimeout(900);
const r = await pag.evaluate(async () => {
  const esc = window.juego.scene.getScene('nivel');
  const mod = await import('/src/entidades/Paloma.js');
  const j = esc.jugadores[0];
  // en una zona llana, lejos de plataformas
  const p = new mod.Paloma(esc, j.x + 120, 150, -1);
  esc.palomas.add(p);
  esc.cameras.main.centerOn(j.x + 120, 180);
  p.recibirGolpe(); p.recibirGolpe();
  for (let i = 0; i < 30 && p.estado !== 'suelo'; i += 1) await new Promise((r) => setTimeout(r, 80));
  return { estado: p.estado, y: Math.round(p.y), abajoCaja: Math.round(p.body.bottom),
           pieDibujo: Math.round(p.y + p.displayHeight / 2), suelo: 9 * 32 };
});
console.log(JSON.stringify(r));
await pag.screenshot({ path: 'capturas/paloma-suelo.png' });
await nav.close();
