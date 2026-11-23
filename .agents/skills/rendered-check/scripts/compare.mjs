// node compare.mjs <evidence-dir>
// Compares the PNGs in <evidence-dir>/before and <evidence-dir>/after that share a name. Identical files are
// reported as identical; otherwise Chromium decodes both and counts the pixels where a channel differs by more
// than 8, with the bounding box of the difference. Captures shot with `text: true` also get a word-level
// diff of their text and accessible names. Writes <evidence-dir>/compare.json and prints the differences.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { launch } from './cdp.mjs';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node compare.mjs <evidence-dir>');
  process.exit(1);
}

// Word-level diff (longest common subsequence) grouped into hunks of removed and added words.
const words = (t) => (t ? [...t.text.split(' '), ...t.labels.map((l) => `[${l}]`)] : []);
function wordDiff(a, b) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let q = 0;
  while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
  const A = a.slice(p, a.length - q);
  const B = b.slice(p, b.length - q);
  if (A.length * B.length > 2e7) return [{ removed: `${A.length} words`, added: `${B.length} words (too long to align)` }];
  const n = A.length, m = B.length, L = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i * (m + 1) + j] = A[i] === B[j] ? L[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(L[(i + 1) * (m + 1) + j], L[i * (m + 1) + j + 1]);
  const hunks = [];
  let cur = null, i = 0, j = 0;
  const ctx = a.slice(Math.max(0, p - 3), p);
  const start = () => (cur ??= { at: ctx.join(' '), r: [], a: [] });
  const flush = () => {
    if (cur) hunks.push({ at: cur.at, removed: cur.r.join(' '), added: cur.a.join(' ') });
    cur = null;
  };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) {
      flush();
      ctx.push(A[i++]);
      if (ctx.length > 3) ctx.shift();
      j++;
    } else if (j < m && (i === n || L[i * (m + 1) + j + 1] >= L[(i + 1) * (m + 1) + j])) start().a.push(B[j++]);
    else start().r.push(A[i++]);
  }
  flush();
  return hunks;
}
const texts = (side) => {
  const out = {};
  for (const f of fs.readdirSync(`${dir}/${side}`).filter((f) => /^info-.*\.json$/.test(f)))
    for (const r of JSON.parse(fs.readFileSync(`${dir}/${side}/${f}`, 'utf8'))) if (r.text) out[r.f] = r.text;
  return out;
};

const hash = (path) => crypto.createHash('sha1').update(fs.readFileSync(path)).digest('hex');
const files = fs.readdirSync(`${dir}/before`).filter((f) => f.endsWith('.png')).sort();
const b = await launch({ port: 9396 });
await b.nav('about:blank', 100);

const rows = [];
for (const f of files) {
  const before = `${dir}/before/${f}`;
  const after = `${dir}/after/${f}`;
  if (!fs.existsSync(after)) {
    rows.push({ f, status: 'missing-after' });
    continue;
  }
  if (hash(before) === hash(after)) {
    rows.push({ f, status: 'identical' });
    continue;
  }
  const r = await b.ev(`(async () => {
    const pixels = async (data) => {
      const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + data; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return { w: img.width, h: img.height, d: ctx.getImageData(0, 0, img.width, img.height).data };
    };
    const A = await pixels('${fs.readFileSync(before).toString('base64')}');
    const B = await pixels('${fs.readFileSync(after).toString('base64')}');
    if (A.w !== B.w || A.h !== B.h) return { size: [A.w, A.h, B.w, B.h] };
    let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
      const i = (y * A.w + x) * 4;
      if (Math.abs(A.d[i] - B.d[i]) > 8 || Math.abs(A.d[i + 1] - B.d[i + 1]) > 8 || Math.abs(A.d[i + 2] - B.d[i + 2]) > 8) {
        n++;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    return { size: [A.w, A.h], diffPx: n, pct: +((100 * n) / (A.w * A.h)).toFixed(3), bbox: n ? [x0, y0, x1, y1] : null };
  })()`);
  const status = r?.__error ? 'error' : r.size?.length === 4 ? 'size-changed' : r.diffPx === 0 ? 'same-within-tolerance' : 'different';
  rows.push({ f, status, ...r });
}
await b.close();

const [beforeText, afterText] = [texts('before'), texts('after')];
for (const r of rows) {
  if (!beforeText[r.f] || !afterText[r.f]) continue;
  const hunks = wordDiff(words(beforeText[r.f]), words(afterText[r.f]));
  if (hunks.length) r.text = hunks;
}

fs.writeFileSync(`${dir}/compare.json`, JSON.stringify(rows, null, 1));
const changed = rows.filter((r) => r.status !== 'identical' && r.status !== 'same-within-tolerance');
for (const r of changed) console.log(r.status.padEnd(14), r.f, r.pct !== undefined ? `${r.pct}% bbox ${r.bbox}` : r.size ?? r.__error ?? '');
for (const r of rows.filter((r) => r.text)) {
  console.log(`text ${r.f}`);
  for (const h of r.text) console.log(`  … ${h.at}\n  - ${h.removed}\n  + ${h.added}`);
}
console.log(`${rows.length} compared, ${rows.length - changed.length} unchanged, ${changed.length} to look at`);
