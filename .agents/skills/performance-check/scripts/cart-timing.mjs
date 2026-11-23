// node cart-timing.mjs <carts.json> [samples=12] [cart-name,...] [--drawer]
// Server render time of the cart for each test cart, from the preview's uncached Server-Timing
// (`render;dur`) on a section request, in French (samples) and English (3), 2.5 s apart. Adds the cart's
// items to a fresh headless cart, never checks out, and empties the cart at the end.
// carts.json: { "<name>": [<variant id> | [<variant id>, <quantity>], ...] }
// --drawer measures the cart drawer section instead of the cart page.
import { launch, sleep } from '../../rendered-check/scripts/cdp.mjs';
import fs from 'node:fs';

const args = process.argv.slice(2);
const drawer = args.includes('--drawer');
const [file, samplesArg = '12', namesArg] = args.filter((a) => a !== '--drawer');
const carts = JSON.parse(fs.readFileSync(file, 'utf8'));
const samples = Number(samplesArg);
const BASE = process.env.BASE || 'http://127.0.0.1:9293';
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

const b = await launch({ fine: false });
await b.nav(`${BASE}/cart`, 5000);
for (const name of namesArg ? namesArg.split(',') : Object.keys(carts)) {
  const items = carts[name].map((v) => (Array.isArray(v) ? { id: v[0], quantity: v[1] } : { id: v, quantity: 1 }));
  const added = await b.ev(`(async () => {
    await fetch('/cart/clear.js', { method: 'POST' });
    const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: ${JSON.stringify(items)} }) });
    const c = await (await fetch('/cart.js')).json();
    return { status: r.status, lines: c.items.length };
  })()`);
  await sleep(2500);
  for (const [lang, page] of [['fr', '/cart'], ['en', '/en/cart']]) {
    const section = drawer
      ? 'cart-drawer-section'
      : await b.ev(`(async () => {
          const d = new DOMParser().parseFromString(await (await fetch('${page}')).text(), 'text/html');
          const s = d.querySelector('.cart-items')?.closest('.shopify-section');
          return s ? s.id.replace('shopify-section-', '') : null;
        })()`);
    await sleep(2500);
    const times = [];
    for (let i = 0; i < (lang === 'fr' ? samples : Math.min(samples, 3)); i++) {
      const st = await b.ev(`fetch('${page}?section_id=${section}&_=${Date.now()}_${i}').then((r) => r.headers.get('server-timing'))`);
      const m = /render;dur=([\d.]+)/.exec(st ?? '');
      if (m) times.push(Number(m[1]));
      await sleep(2500);
    }
    console.log(`${name} ${lang} ${drawer ? 'drawer' : 'page'} lines=${added?.lines} n=${times.length}` +
      (times.length ? ` median=${median(times).toFixed(1)} min=${Math.min(...times)} max=${Math.max(...times)} ms` : ' no timing'));
  }
}
await b.ev(`fetch('/cart/clear.js', { method: 'POST' }).then((r) => r.status)`);
await b.close();
