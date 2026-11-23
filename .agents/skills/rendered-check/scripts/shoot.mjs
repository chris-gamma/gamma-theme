// node shoot.mjs <jobs.json> <outdir> [cdp-port, 0 = any free port] [only-name-substring]
// Captures pages through the local `shopify theme dev` preview (BASE, default http://127.0.0.1:9293).
// For each job, language and width it loads the page, scrolls once so lazy content loads, optionally
// runs `pre` (an async JS body), then screenshots the top of the page (`mode: 'page'`, up to `maxh`
// px) or one element (`mode: 'el'`, `sel`, `index`), and records `info` (a JS function of the
// document or element returning JSON). `vclip: true` adds text clipped vertically by an ancestor.
// `text: true` records the page's visible text and its aria-label, alt, placeholder and title values,
// which compare.mjs diffs word by word; use it for wording changes.
// Phones (< 750 px) emulate touch. Don't run hover checks in the same browser afterwards: once touch
// emulation has been on, `(any-pointer: fine)` rules can stop matching.
// Job: { name, fr, en?, langs?, widths?, h?, maxh?, mode?, sel?, index?, pad?, wait?, pre?, info?,
//        vclip?, text?, block?: [url patterns], hideHeader?, zoom?, typeText?, typeTextEn?, typeWait? }
// Writes <outdir>/<name>-<lang>-<width>[-z200].png and <outdir>/info-<time>.json.
import { launch, sleep } from './cdp.mjs';
import fs from 'node:fs';

// The words a customer reads or hears: rendered text (screen-reader-only text included, display: none
// excluded) plus accessible names. No-break spaces are kept, so French spacing changes show in the diff.
const TEXT = `(d) => {
  const labels = [...d.querySelectorAll('[aria-label], [alt], [placeholder], [title]')].flatMap((e) =>
    ['aria-label', 'alt', 'placeholder', 'title'].map((a) => e.getAttribute(a)).filter((v) => v && v.trim()));
  return { text: d.body.innerText.replace(/[ \\t\\n\\r\\f]+/g, ' ').trim(), labels: [...new Set(labels)] };
}`;

// Text whose glyph boxes extend past an ancestor that clips overflow: vertical clipping that a
// horizontal-overflow check can't see.
const VCLIP = `(d) => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  let n;
  while ((n = walker.nextNode())) {
    const el = n.parentElement;
    if (!el || el.closest('script, style, noscript, [hidden], .visually-hidden, [aria-hidden="true"] svg')) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
    if (!rects.length) continue;
    const top = Math.min(...rects.map((q) => q.top)), bottom = Math.max(...rects.map((q) => q.bottom));
    let a = el;
    while (a && a !== document.body) {
      const s = getComputedStyle(a);
      if (s.overflowY !== 'visible' || s.overflowX !== 'visible') {
        const b = a.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) break;
        // Elements clipped on purpose (visually hidden, scrolled panes, closed menus) are skipped.
        if (b.height < 4 || s.overflowY === 'auto' || s.overflowY === 'scroll') break;
        const over = Math.max(bottom - b.bottom, b.top - top);
        if (over > 0.5 && bottom > b.top && top < b.bottom) out.push({ text: n.textContent.trim().slice(0, 40), over: +over.toFixed(1), clipper: (a.className || a.tagName).toString().slice(0, 50) });
        break;
      }
      a = a.parentElement;
    }
  }
  return { clipped: out.length, examples: out.slice(0, 6) };
}`;

const [jobsFile, outdir, portArg = '0', only = ''] = process.argv.slice(2);
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8')).filter((j) => !only || j.name.includes(only));
fs.mkdirSync(outdir, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:9293';
const b = await launch({ port: Number(portArg) });
await b.send('Network.enable');
const log = [];
for (const j of jobs) {
  for (const lang of j.langs || ['fr', 'en']) {
    for (const w of j.widths || [320, 390, 768, 1440]) {
      const path = lang === 'en' ? j.en || '/en' + j.fr : j.fr;
      const phone = w < 750;
      const h = j.h || (phone ? 844 : 900);
      await b.send('Network.setBlockedURLs', { urls: j.block || [] });
      await b.send('Emulation.setTouchEmulationEnabled', { enabled: phone, maxTouchPoints: phone ? 5 : 0 });
      await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: phone });
      await b.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
      await b.nav(BASE + path, j.wait || 2500);
      if (j.zoom) {
        // 200% zoom: a CSS-pixel viewport half as wide, rendered at twice the density.
        await b.send('Emulation.setDeviceMetricsOverride', { width: Math.round(w / j.zoom), height: Math.round(h / j.zoom), deviceScaleFactor: j.zoom, mobile: phone });
        await sleep(1200);
      }
      if (j.typeText) {
        await b.ev(`(async () => { document.querySelector('search-button button').click(); await new Promise((r) => setTimeout(r, 900)); document.querySelector('#cmdk-input').focus(); })()`);
        await b.send('Input.insertText', { text: lang === 'en' ? (j.typeTextEn || j.typeText) : j.typeText });
        await sleep(j.typeWait || 5000);
      }
      const r = await b.ev(`(async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        ${j.hideHeader ? `const st = document.createElement('style'); st.textContent = '#header-group, .shopify-section-group-header-group { visibility: hidden !important; }'; document.head.append(st);` : ''}
        ${j.pre || ''}
        const pw = document.querySelector('.page-wrapper');
        const scroller = pw && pw.scrollHeight > pw.clientHeight + 4 ? pw : document.scrollingElement;
        // Scroll through once so lazy images and recommendations load, then return to the top.
        for (let y = 0; y < scroller.scrollHeight; y += 600) { scroller.scrollTop = y; await sleep(120); }
        scroller.scrollTop = 0; await sleep(500);
        const out = { title: document.title, overflow: document.documentElement.scrollWidth > innerWidth, contentH: Math.max(scroller.scrollHeight, document.body.scrollHeight) };
        ${j.mode === 'el' ? `
          const els = [...document.querySelectorAll(${JSON.stringify(j.sel || 'main')})].filter((e) => e.getBoundingClientRect().width > 0);
          const el = els[${j.index || 0}];
          if (!el) return { ...out, missing: true };
          out.el = { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height };
          out.info = (${j.info || '() => null'})(el);
        ` : `out.info = (${j.info || '() => null'})(document);`}
        ${j.vclip ? `out.vclip = (${VCLIP})(document);` : ''}
        ${j.text ? `out.text = (${TEXT})(document);` : ''}
        return out;
      })()`);
      const tag = j.zoom ? `-z${j.zoom * 100}` : '';
      const f = `${j.name}-${lang}-${w}${tag}.png`;
      if (!r || r.__error || r.missing) {
        console.log(f, 'MISSING', JSON.stringify(r).slice(0, 300));
        log.push({ f, error: r });
        await sleep(1500);
        continue;
      }
      if (j.mode === 'el') {
        // Grow the viewport so the element fits, scroll it to the top, then clip it.
        const need = Math.min(Math.ceil(r.el.h) + 2 * (j.pad ?? 12) + 200, j.maxh || 4000);
        const vw = j.zoom ? Math.round(w / j.zoom) : w;
        if (need > h) await b.send('Emulation.setDeviceMetricsOverride', { width: vw, height: need, deviceScaleFactor: j.zoom || 1, mobile: phone });
        await sleep(900);
        const c = await b.ev(`(async () => {
          const els = [...document.querySelectorAll(${JSON.stringify(j.sel || 'main')})].filter((e) => e.getBoundingClientRect().width > 0);
          const el = els[${j.index || 0}];
          el.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 900));
          const q = el.getBoundingClientRect(); const pad = ${j.pad ?? 12};
          return { x: Math.max(0, q.left - pad), y: Math.max(0, q.top - pad), width: Math.min(q.width + 2 * pad, innerWidth), height: Math.min(q.height + 2 * pad, innerHeight - Math.max(0, q.top - pad)) };
        })()`);
        await b.shot(`${outdir}/${f}`, c);
      } else {
        const vw = j.zoom ? Math.round(w / j.zoom) : w;
        const full = Math.min(r.contentH, j.maxh || 2400);
        if (full > h) {
          await b.send('Emulation.setDeviceMetricsOverride', { width: vw, height: full, deviceScaleFactor: j.zoom || 1, mobile: phone });
          await sleep(1500);
        }
        await b.shot(`${outdir}/${f}`);
      }
      log.push({ f, info: r.info, overflow: r.overflow, vclip: r.vclip, text: r.text });
      console.log(f, r.overflow ? 'OVERFLOW' : '', r.vclip?.clipped ? `CLIPPED ${r.vclip.clipped}` : '', JSON.stringify(r.info || '').slice(0, 400));
      await sleep(1500);
    }
  }
}
fs.writeFileSync(`${outdir}/info-${Date.now()}.json`, JSON.stringify(log, null, 1));
await b.close();
