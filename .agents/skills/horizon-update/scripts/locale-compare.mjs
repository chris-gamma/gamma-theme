// node locale-compare.mjs <old> <new> [--en <english>]
// Compares two versions of a locale file, such as the previous vendor fr.json and the merged one. Each file
// is a path or a Git `<ref>:<path>`. Prints the keys added and removed, every changed value with its old and
// new text, and for the new file: interpolation names, HTML tags and plural forms that differ from the
// English file (--en), and, for a fr*.json file, French spacing around : ; ? ! % $ « ». Exits 1 when it finds a structural problem.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const enAt = args.indexOf('--en');
const enSource = enAt >= 0 ? args.splice(enAt, 2)[1] : null;
if (args.length !== 2) {
  console.error('usage: node locale-compare.mjs <old> <new> [--en <english>]   (paths or <ref>:<path>)');
  process.exit(2);
}

const read = (source) =>
  fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : execFileSync('git', ['show', source], { encoding: 'utf8' });

// Horizon's locale files start with a comment block and carry `//` comment lines, so parse leniently.
const parse = (source) => {
  const text = read(source);
  const body = text
    .replace(/^\s*\/\*[\s\S]*?\*\//, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(body);
};

const flatten = (obj, prefix = '', out = new Map()) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.set(key, String(v));
  }
  return out;
};

const PLURALS = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const names = (s) => [...s.matchAll(/{{-?\s*([\w.]+)/g)].map((m) => m[1]).sort().join(',');
const tags = (s) => [...s.matchAll(/<\/?([a-z][\w-]*)/gi)].map((m) => m[0].toLowerCase()).sort().join(',');
const pluralParent = (key) => {
  const i = key.lastIndexOf('.');
  return PLURALS.has(key.slice(i + 1)) ? key.slice(0, i) : null;
};
const plurals = (map) => {
  const out = new Map();
  for (const key of map.keys()) {
    const parent = pluralParent(key);
    if (parent) out.set(parent, [...(out.get(parent) ?? []), key.slice(parent.length + 1)].sort());
  }
  return out;
};

const [oldMap, newMap] = args.map((s) => flatten(parse(s)));
const enMap = enSource ? flatten(parse(enSource)) : null;
let problems = 0;
const problem = (msg) => {
  problems++;
  console.log(`  ${msg}`);
};

const added = [...newMap.keys()].filter((k) => !oldMap.has(k));
const removed = [...oldMap.keys()].filter((k) => !newMap.has(k));
const changed = [...newMap.keys()].filter((k) => oldMap.has(k) && oldMap.get(k) !== newMap.get(k));

console.log(`Added (${added.length})`);
for (const k of added) console.log(`  ${k}: ${newMap.get(k)}`);
console.log(`Removed (${removed.length})`);
for (const k of removed) console.log(`  ${k}: ${oldMap.get(k)}`);
console.log(`Changed (${changed.length})`);
for (const k of changed) console.log(`  ${k}\n    old: ${oldMap.get(k)}\n    new: ${newMap.get(k)}`);

console.log('Structure');
for (const k of changed) {
  if (names(oldMap.get(k)) !== names(newMap.get(k))) problem(`${k}: interpolation names changed`);
  if (tags(oldMap.get(k)) !== tags(newMap.get(k))) problem(`${k}: HTML tags changed`);
}
if (enMap) {
  for (const [k, v] of newMap) {
    if (k.startsWith('shopify.') || !enMap.has(k)) continue;
    if (names(v) !== names(enMap.get(k))) problem(`${k}: interpolation names differ from English`);
    if (tags(v) !== tags(enMap.get(k))) problem(`${k}: HTML tags differ from English`);
  }
  for (const k of enMap.keys()) {
    if (!newMap.has(k) && !pluralParent(k)) problem(`${k}: missing (English has it)`);
  }
  for (const k of newMap.keys()) {
    if (!enMap.has(k) && !k.startsWith('shopify.') && !pluralParent(k)) problem(`${k}: not in English`);
  }
  const [enPlurals, newPlurals] = [plurals(enMap), plurals(newMap)];
  for (const [parent, forms] of enPlurals) {
    const mine = newPlurals.get(parent);
    if (!mine) problem(`${parent}: plural forms missing`);
    else if (!mine.includes('one') || !mine.includes('other')) problem(`${parent}: has ${mine.join(', ')}; needs one and other`);
    else if (forms.join() !== mine.join() && !forms.every((f) => mine.includes(f))) problem(`${parent}: English has ${forms.join(', ')}, this file ${mine.join(', ')}`);
  }
}

// Quebec French spacing: a no-break space (U+00A0 or U+202F) before : % $ » and after «, none before ; ? !
const french = /(^|[/:])fr[.\w]*\.json$/.test(args[1]);
if (french) console.log('Spacing (added and changed values)');
for (const k of french ? [...added, ...changed] : []) {
  const v = newMap.get(k).replace(/{{[^}]*}}/g, '0').replace(/<[^>]+>/g, ' ').replace(/https?:\/\/\S+/g, '');
  if (/[^\s  ]:(\s|$)/.test(v) || / :/.test(v)) problem(`${k}: colon needs a no-break space before it`);
  if (/[\s  ][;?!]/.test(v)) problem(`${k}: no space before ; ? !`);
  if (/«(?![  ])|(?<![  ])»/.test(v)) problem(`${k}: guillemets need no-break spaces inside`);
  if (/\d(?: |)%|\d(?: |)\$/.test(v)) problem(`${k}: number and % or $ need a no-break space between them`);
}
console.log(problems ? `${problems} to check` : 'No structural or spacing problems');
process.exit(problems ? 1 : 0);
