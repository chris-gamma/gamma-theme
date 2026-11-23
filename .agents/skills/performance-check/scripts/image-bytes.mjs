// node image-bytes.mjs <out.json> <path>...   (VIEWPORTS=1440x900,390x844 by default)
// Image requests of each page with the cache disabled: what loads before any scrolling (count, bytes,
// requested width against displayed width, priority), split out for product-card images
// (`.card-gallery`), and what a full scroll adds.
import { launch, sleep } from '../../rendered-check/scripts/cdp.mjs';
import fs from 'node:fs';

const [out, ...paths] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://127.0.0.1:9293';
const VIEWPORTS = (process.env.VIEWPORTS || '1440x900,390x844').split(',').map((v) => v.split('x').map(Number));
const b = await launch();
await b.send('Network.enable');
await b.send('Network.setCacheDisabled', { cacheDisabled: true });
const reqs = new Map();
b.listeners.push((d) => {
  if (d.method === 'Network.requestWillBeSent' && d.params.type === 'Image') {
    reqs.set(d.params.requestId, { url: d.params.request.url, prio: d.params.request.initialPriority });
  }
  if (d.method === 'Network.loadingFinished' && reqs.has(d.params.requestId)) reqs.get(d.params.requestId).bytes = d.params.encodedDataLength;
});
const sum = (a) => a.reduce((s, r) => s + (r.bytes || 0), 0);
const results = [];
for (const path of paths) {
  for (const [w, h] of VIEWPORTS) {
    await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 750 });
    await b.send('Page.navigate', { url: 'about:blank' });
    await sleep(500);
    reqs.clear();
    await b.nav(BASE + path, 6000);
    const before = [...reqs.values()].map((r) => ({ ...r }));
    const dom = await b.ev(`[...document.images].filter((i) => i.currentSrc).map((i) => {
      const q = i.getBoundingClientRect();
      return { src: i.currentSrc.split('?')[0], width: new URL(i.currentSrc).searchParams.get('width'), card: !!i.closest('.card-gallery'),
        shown: Math.round(q.width), inView: q.width > 0 && q.top < innerHeight && q.bottom > 0, loading: i.loading };
    })`);
    await b.ev(`(async () => { const pw = document.querySelector('.page-wrapper'); const s = pw && pw.scrollHeight > pw.clientHeight + 4 ? pw : document.scrollingElement;
      for (let y = 0; y < s.scrollHeight; y += 400) { s.scrollTop = y; await new Promise((r) => setTimeout(r, 250)); } })()`);
    await sleep(4000);
    const find = (r) => { const u = new URL(r.url); return dom.find((d) => d.src === u.origin + u.pathname && d.width === u.searchParams.get('width')); };
    const cards = before.filter((r) => find(r)?.card);
    const res = {
      path, w, h,
      beforeScroll: { count: before.length, kb: +(sum(before) / 1024).toFixed(1), cardCount: cards.length, cardKb: +(sum(cards) / 1024).toFixed(1),
        cardWidths: [...new Set(cards.map((r) => `${new URL(r.url).searchParams.get('width')}px→${find(r)?.shown}px`))].slice(0, 6),
        cardPriority: [...new Set(cards.map((r) => r.prio))] },
      afterScroll: { count: reqs.size, kb: +(sum([...reqs.values()]) / 1024).toFixed(1) },
      cardsEager: dom.filter((d) => d.card && d.loading === 'eager').length,
    };
    results.push(res);
    console.log(JSON.stringify(res));
    await sleep(2000);
  }
}
fs.writeFileSync(out, JSON.stringify(results, null, 1));
await b.close();
