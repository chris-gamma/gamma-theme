// node compare.mjs <evidence-dir>
// Compares the PNGs in <evidence-dir>/before and <evidence-dir>/after that share a name. Identical files are
// reported as identical; otherwise Chromium decodes both and counts the pixels where a channel differs by more
// than 8, with the bounding box of the difference. Writes <evidence-dir>/compare.json and prints the differences.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { launch } from './cdp.mjs';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node compare.mjs <evidence-dir>');
  process.exit(1);
}

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

fs.writeFileSync(`${dir}/compare.json`, JSON.stringify(rows, null, 1));
const changed = rows.filter((r) => r.status !== 'identical' && r.status !== 'same-within-tolerance');
for (const r of changed) console.log(r.status.padEnd(14), r.f, r.pct !== undefined ? `${r.pct}% bbox ${r.bbox}` : r.size ?? r.__error ?? '');
console.log(`${rows.length} compared, ${rows.length - changed.length} unchanged, ${changed.length} to look at`);
