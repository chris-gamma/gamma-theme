// node mock.mjs <spec.json> <outdir> [cdp-port] [only-name-substring]
// Browser-side mock-ups on the local preview (BASE, default http://127.0.0.1:9293): nothing in the
// theme changes. For each page, language and width, every variant loads the page fresh, optionally
// runs a helper file, injects its CSS and/or JS, then clips `sel` (or the first `rows` rows of
// product cards) and records `info`.
// Spec: [{ name, path, en?, langs?, widths?, h?, rows?, sel?, index?, pre?, info?, helper?, wait?,
//          typeText?, typeTextEn?, variants: [{ id, css?, js?, hover?, hoverIndex?, wait? }] }]
// `helper` is a JS file (relative to the spec) evaluated before each variant, e.g. to define functions
// the variants call. Writes <outdir>/<name>-<variant>-<lang>-<width>.png and mock-<time>.json.
import { launch, sleep } from '../../rendered-check/scripts/cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';

const [specFile, outdir, portArg = '9395', only = ''] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8')).filter((s) => !only || s.name.includes(only));
fs.mkdirSync(outdir, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:9293';
const b = await launch({ port: Number(portArg) });
const log = [];

for (const s of spec) {
  const helper = s.helper ? fs.readFileSync(path.resolve(path.dirname(specFile), s.helper), 'utf8') : '';
  for (const lang of s.langs || ['fr', 'en']) {
    for (const w of s.widths || [1440, 390]) {
      for (const v of s.variants) {
        const phone = w < 750;
        await b.send('Emulation.setTouchEmulationEnabled', { enabled: phone, maxTouchPoints: phone ? 5 : 0 });
        await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: s.h || 1800, deviceScaleFactor: 1, mobile: phone });
        await b.nav(BASE + (lang === 'en' ? s.en || '/en' + s.path : s.path), s.wait || 2500);
        if (s.typeText) {
          await b.ev(`(async () => { document.querySelector('search-button button').click(); await new Promise((r) => setTimeout(r, 900)); document.querySelector('#cmdk-input').focus(); })()`);
          await b.type(lang === 'en' ? s.typeTextEn || s.typeText : s.typeText);
          await sleep(s.typeWait || 5000);
        }
        const r = await b.ev(`(async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          ${helper}
          ${s.pre || ''}
          const pw = document.querySelector('.page-wrapper');
          const sc = pw && pw.scrollHeight > pw.clientHeight + 4 ? pw : document.scrollingElement;
          for (let y = 0; y < Math.min(sc.scrollHeight, 6000); y += 500) { sc.scrollTop = y; await sleep(80); }
          sc.scrollTop = 0;
          ${v.css ? `{ const x = document.createElement('style'); x.textContent = ${JSON.stringify(v.css)}; document.head.append(x); }` : ''}
          ${v.js || ''}
          await sleep(${v.wait || 1500});
          const info = ${s.info ? `(${s.info})(document)` : 'null'};
          let top, bottom, left = 0, right = innerWidth;
          const el = ${JSON.stringify(s.sel || '')}
            ? [...document.querySelectorAll(${JSON.stringify(s.sel || 'x')})].filter((e) => e.getBoundingClientRect().width > 0)[${s.index || 0}]
            : null;
          if (el) {
            el.scrollIntoView({ block: 'start' }); await sleep(600);
            const q = el.getBoundingClientRect();
            top = q.top - 12; bottom = q.bottom + 12; left = Math.max(0, q.left - 12); right = Math.min(innerWidth, q.right + 12);
          } else {
            const cards = [...document.querySelectorAll('product-card')].filter((c) => c.getBoundingClientRect().width > 0);
            if (!cards.length) return { error: 'no sel and no product cards' };
            cards[0].scrollIntoView({ block: 'start' }); await sleep(600);
            const tops = [...new Set(cards.map((c) => Math.round(c.getBoundingClientRect().top)))].sort((a, b) => a - b).slice(0, ${s.rows || 2});
            top = tops[0] - 16;
            bottom = Math.max(...cards.filter((c) => tops.includes(Math.round(c.getBoundingClientRect().top))).map((c) => c.getBoundingClientRect().bottom)) + 16;
          }
          let hover = null;
          ${v.hover ? `{ const he = [...document.querySelectorAll(${JSON.stringify(v.hover)})].filter((e) => e.getBoundingClientRect().width > 0)[${v.hoverIndex || 0}];
            if (he) { const q = he.getBoundingClientRect(); hover = { x: q.left + q.width / 2, y: q.top + q.height / 3 }; } }` : ''}
          return { hover, info, overflow: document.documentElement.scrollWidth > innerWidth,
            clip: { x: left + scrollX, y: Math.max(0, top) + scrollY, width: right - left, height: Math.min(bottom, innerHeight) - Math.max(0, top) } };
        })()`);
        const f = `${s.name}-${v.id}-${lang}-${w}.png`;
        if (!r || r.__error || r.error) { console.log(f, 'ERROR', JSON.stringify(r).slice(0, 300)); continue; }
        if (r.hover) { await b.move(r.hover.x, r.hover.y); await sleep(1200); }
        await b.shot(`${outdir}/${f}`, r.clip);
        if (r.hover) await b.move(1, 1);
        log.push({ f, info: r.info, overflow: r.overflow });
        console.log(f, r.overflow ? 'OVERFLOW' : '', JSON.stringify(r.info ?? '').slice(0, 300));
        await sleep(1200);
      }
    }
  }
}
fs.writeFileSync(`${outdir}/mock-${Date.now()}.json`, JSON.stringify(log, null, 1));
await b.close();
