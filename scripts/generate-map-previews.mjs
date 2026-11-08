#!/usr/bin/env node
/**
 * Generates the static previews for the Map block (blocks/gamma-map.liquid) from the remote theme
 * associated with this checkout, and saves them as lossless PNG files in docs/map_previews/.
 *
 *   node scripts/generate-map-previews.mjs [--environment <name>] [--theme <name or ID>] [--dry-run]
 *
 * The associated theme is the one Shopify's GitHub integration names after this repository and
 * the current branch (for example gamma-theme/dev), on the store of the Shopify CLI environment
 * (the default environment unless --environment is given). --theme names another theme
 * explicitly. The script only reads from Shopify: it lists themes and pulls JSON templates,
 * section groups and the Map block into a temporary directory. It never uploads or changes
 * anything.
 *
 * Each preview is a screenshot of the block's uMap map at the block's largest box size (Maximum
 * width and aspect ratio), rendered at 3x for high-density screens. The block draws its image at
 * that size, centred, so narrower boxes crop it exactly as they crop the interactive map.
 *
 * Requirements: Node 22 or later, Shopify CLI access to the store, and Chrome, Chromium or Edge
 * (or set CHROME_PATH). No packages are installed.
 */

import { execFile, spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, platform, tmpdir } from 'node:os';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync, constants as zlibConstants } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = join(ROOT, 'docs', 'map_previews');

/** Matches assets/gamma-map.js: the uMap service and map ID format the theme accepts. */
const UMAP_ORIGIN = 'https://umap.openstreetmap.fr';
const MAP_ID = /^[a-z0-9_-]{1,200}_\d{1,12}$/i;

/** Every uMap control that can be turned off from the address; the rest of the UI is hidden. */
const MAP_OPTIONS = {
  zoomControl: 'false',
  fullscreenControl: 'false',
  scaleControl: 'false',
  miniMapControl: 'false',
  searchControl: 'false',
  tilelayersControl: 'false',
  embedControl: 'false',
  datalayersControl: 'false',
  locateControl: 'false',
  measureControl: 'false',
  homeControl: 'false',
  captionControl: 'false',
  printControl: 'false',
  captionBar: 'false',
  captionMenus: 'false',
  scrollWheelZoom: 'false',
  editMode: 'disabled',
  onLoadPanel: 'none',
};

/** Physical pixels per CSS pixel. 3x covers phones; Shopify serves smaller copies to other screens. */
const SCALE = 3;

/** Matches the block schema's Maximum width range. */
const MIN_WIDTH = 120;
const MAX_WIDTH = 480;

const RATIOS = { square: 1, landscape: 4 / 3, wide: 16 / 9 };

const LOAD_TIMEOUT = 60000;
const QUIET_PERIOD = 1500;

/** French names for the templates and section groups a map can be placed in. */
const PLACEMENTS = {
  index: 'accueil',
  product: 'produit',
  collection: 'collection',
  'list-collections': 'liste-des-collections',
  blog: 'blogue',
  article: 'article',
  cart: 'panier',
  search: 'recherche',
  404: 'page-introuvable',
  password: 'mot-de-passe',
  gift_card: 'carte-cadeau',
  'footer-group': 'pied-de-page',
  'header-group': 'en-tete',
};

class UsageError extends Error {}

/* -------------------------------------------------------------------------------------------- */
/* Command line                                                                                  */
/* -------------------------------------------------------------------------------------------- */

const HELP = `Generate the Map block's static previews in docs/map_previews/.

Usage: node scripts/generate-map-previews.mjs [options]

  -e, --environment <name>  Shopify CLI environment from shopify.theme.toml (default: the CLI's default)
  -t, --theme <name or ID>  Remote theme to read (default: <repository>/<branch>, e.g. gamma-theme/dev)
      --dry-run             Identify the theme and list the previews without capturing them
  -h, --help                Show this help

Reads from Shopify only; nothing is uploaded or changed.`;

function parseArgs(argv) {
  const options = { environment: null, theme: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (!next || next.startsWith('-')) throw new UsageError(`${arg} needs a value.`);
      return next;
    };
    if (arg === '-h' || arg === '--help') options.help = true;
    else if (arg === '-e' || arg === '--environment') options.environment = value();
    else if (arg === '-t' || arg === '--theme') options.theme = value();
    else if (arg === '--dry-run') options.dryRun = true;
    else throw new UsageError(`Unknown option ${arg}. Use --help for usage.`);
  }
  return options;
}

/* -------------------------------------------------------------------------------------------- */
/* Processes                                                                                     */
/* -------------------------------------------------------------------------------------------- */

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    execFile(
      command,
      args,
      { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, shell: platform() === 'win32', ...options },
      (error, stdout, stderr) => {
        if (error) {
          error.message = `${command} ${args.join(' ')} failed:\n${(stderr || stdout || error.message).trim()}`;
          reject(error);
        } else resolvePromise({ stdout, stderr });
      }
    );
  });
}

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** The project's pinned Shopify CLI (npm ci), otherwise the one on PATH. */
async function shopifyCommand() {
  const local = join(ROOT, 'node_modules', '.bin', platform() === 'win32' ? 'shopify.cmd' : 'shopify');
  return (await exists(local)) ? local : 'shopify';
}

async function shopify(args) {
  const { stdout } = await run(await shopifyCommand(), [...args, '--no-color']);
  return stdout;
}

/* -------------------------------------------------------------------------------------------- */
/* Theme discovery                                                                               */
/* -------------------------------------------------------------------------------------------- */

/** Unwraps the CLI's JSON, which is nested per environment when --environment is given. */
function cliResult(stdout) {
  const data = JSON.parse(stdout);
  return data.environments ? data.environments[0]?.result : data;
}

async function associatedThemeName() {
  const { stdout: remote } = await run('git', ['remote', 'get-url', 'origin']).catch(() => {
    throw new UsageError('This checkout has no origin remote, so its theme name is unknown. Pass --theme.');
  });
  const repository = basename(remote.trim().replace(/\/+$/, '')).replace(/\.git$/, '');
  const { stdout: branch } = await run('git', ['symbolic-ref', '--quiet', '--short', 'HEAD']).catch(() => {
    throw new UsageError('HEAD is detached, so the associated theme is unknown. Check out a branch or pass --theme.');
  });
  return `${repository}/${branch.trim()}`;
}

async function resolveTheme(options) {
  const envArgs = options.environment ? ['--environment', options.environment] : [];

  const info = cliResult(await shopify(['theme', 'info', ...envArgs, '--json']));
  const store = info?.storeDomain;
  if (!store) {
    throw new UsageError(
      `Shopify CLI has no store for the ${options.environment ?? 'default'} environment. Check shopify.theme.toml.`
    );
  }

  const wanted = options.theme ?? (await associatedThemeName());
  const themes = cliResult(await shopify(['theme', 'list', ...envArgs, '--json']))?.themes ?? [];
  const matches = themes.filter((theme) => String(theme.id) === wanted || theme.name === wanted);

  if (matches.length !== 1) {
    const listed = themes.map((theme) => `  ${theme.id}  ${theme.name} (${theme.role})`).join('\n');
    const problem = matches.length
      ? `${matches.length} themes on ${store} are named “${wanted}”`
      : `No theme on ${store} is named “${wanted}”`;
    throw new UsageError(
      `${problem}, so the remote theme can't be identified unambiguously.\n` +
        `Check out the branch connected to the theme, or pass --theme with a theme ID.\nThemes on ${store}:\n${listed}`
    );
  }

  return { store, ...matches[0], association: options.theme ? 'selected with --theme' : `named after ${wanted}` };
}

/** Pulls the relevant files into a temporary directory; the working tree is never touched. */
async function pullTheme(theme, options, directory) {
  // The CLI reads environments from shopify.theme.toml in --path.
  const config = join(ROOT, 'shopify.theme.toml');
  if (await exists(config)) await copyFile(config, join(directory, 'shopify.theme.toml'));

  const envArgs = options.environment ? ['--environment', options.environment] : [];
  const only = [
    'templates/*.json',
    'templates/customers/*.json',
    'templates/metaobject/*.json',
    'sections/*.json',
    'blocks/gamma-map.liquid',
  ].flatMap((pattern) => ['--only', pattern]);
  await shopify(['theme', 'pull', ...envArgs, '--theme', String(theme.id), '--path', directory, ...only]);
}

/* -------------------------------------------------------------------------------------------- */
/* Map block configuration                                                                       */
/* -------------------------------------------------------------------------------------------- */

/** Shopify's JSON files start with a comment block. */
function parseThemeJson(text) {
  return JSON.parse(text.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
}

async function jsonFiles(directory) {
  const files = [];
  for (const folder of ['templates', 'templates/customers', 'templates/metaobject', 'sections']) {
    const names = await readdir(join(directory, folder)).catch(() => []);
    for (const name of names.sort()) if (name.endsWith('.json')) files.push(`${folder}/${name}`);
  }
  return files;
}

function placementName(file) {
  const name = basename(file, '.json');
  if (file.startsWith('templates/customers/')) return `compte-${slug(name)}`;
  if (file.startsWith('templates/metaobject/')) return `metaobjet-${slug(name)}`;
  const [type, ...suffix] = name.split('.');
  const base = PLACEMENTS[type] ?? (file.startsWith('sections/') ? `groupe-${slug(type.replace(/-group$/, ''))}` : slug(type));
  return suffix.length ? `${base}-${slug(suffix.join('-'))}` : base;
}

function slug(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Map blocks in a template or section group, in display order. Disabled ones are only listed. */
function findMapBlocks(file, data) {
  const found = [];
  const walkBlocks = (container, trail) => {
    const blocks = container?.blocks ?? {};
    const order = container?.block_order ?? Object.keys(blocks);
    for (const key of [...order, ...Object.keys(blocks).filter((key) => !order.includes(key))]) {
      const block = blocks[key];
      if (!block) continue;
      if (block.disabled) {
        if (block.type === 'gamma-map') found.push({ file, path: [...trail, key], disabled: true });
        continue;
      }
      if (block.type === 'gamma-map') found.push({ file, path: [...trail, key], settings: block.settings ?? {} });
      walkBlocks(block, [...trail, key]);
    }
  };
  const sections = data?.sections ?? {};
  for (const key of data?.order ?? Object.keys(sections)) {
    if (sections[key] && !sections[key].disabled) walkBlocks(sections[key], [key]);
  }
  return found;
}

function blockSchema(liquid) {
  const match = liquid.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  if (!match) throw new UsageError('The remote Map block has no schema.');
  const defaults = {};
  for (const setting of JSON.parse(match[1]).settings ?? []) {
    if (setting.id) defaults[setting.id] = setting.default;
  }
  return defaults;
}

/** The box's largest size for one breakpoint, in CSS pixels. */
function boxSize(width, ratioSetting, label) {
  const ratio = RATIOS[ratioSetting];
  if (!ratio) {
    throw new UsageError(
      `${label}: the aspect ratio “${ratioSetting}” follows the selected image, so the preview size can't be ` +
        `known in advance. Choose 1:1, 4:3 or 16:9 in the block's settings.`
    );
  }
  return { width, height: Math.round(width / ratio) };
}

function describePlacement(placement) {
  return `${placement.file} › ${placement.path.join(' › ')}`;
}

async function discoverPlacements(directory) {
  const blockFile = join(directory, 'blocks', 'gamma-map.liquid');
  const files = await jsonFiles(directory);
  const blocks = [];
  for (const file of files) blocks.push(...findMapBlocks(file, parseThemeJson(await readFile(join(directory, file), 'utf8'))));

  if (!(await exists(blockFile))) {
    if (blocks.length === 0) throw new UsageError('The remote theme has no Map block (blocks/gamma-map.liquid).');
    throw new UsageError('The remote theme places Map blocks but has no blocks/gamma-map.liquid.');
  }
  const liquid = await readFile(blockFile, 'utf8');
  const defaults = blockSchema(liquid);
  if (!('max_width' in defaults)) {
    throw new UsageError("The remote Map block has no Maximum width setting, so preview sizes can't be determined.");
  }

  const placements = [];
  const notes = [];
  const counts = new Map();
  for (const block of blocks) {
    const label = describePlacement(block);
    if (block.disabled) {
      notes.push(`${label}: hidden in the theme editor; skipped.`);
      continue;
    }
    const settings = { ...defaults, ...block.settings };
    const mapId = String(settings.map_id ?? '').trim();
    if (!mapId) {
      notes.push(`${label}: no uMap map ID, so it has no interactive map to preview; skipped.`);
      continue;
    }
    if (!MAP_ID.test(mapId)) {
      notes.push(`${label}: the map ID “${mapId}” isn't valid, so the theme doesn't offer its map; skipped.`);
      continue;
    }
    const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(settings.max_width) || MAX_WIDTH));
    const base = placementName(block.file);
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    placements.push({
      ...block,
      mapId,
      name: count > 1 ? `${base}-${count}` : base,
      desktop: boxSize(width, settings.aspect_ratio, `${label} (desktop)`),
      mobile: boxSize(width, settings.aspect_ratio_mobile, `${label} (mobile)`),
      images: { image: settings.image ?? '', image_mobile: settings.image_mobile ?? '' },
    });
  }
  return { placements, notes, liquid };
}

/** True when the block draws its image at the Maximum width instead of scaling it to the box. */
function keepsMapScale(liquid) {
  return /\.gamma-map__image\s*{[^}]*width:\s*var\(--gamma-map-max-width\)/.test(liquid);
}

/** Explains where the remote theme differs from this checkout; the remote theme is what is rendered. */
async function compareWithCheckout(remote) {
  const differences = [];
  const local = await discoverPlacements(ROOT).catch((error) => ({ error }));
  if (local.error) return [`This checkout's Map configuration couldn't be read: ${local.error.message}`];

  if (remote.liquid !== local.liquid) differences.push('The remote blocks/gamma-map.liquid differs from this checkout.');

  const key = (placement) => `${placement.file}#${placement.path.join('/')}`;
  const localByKey = new Map(local.placements.map((placement) => [key(placement), placement]));
  const remoteKeys = new Set(remote.placements.map(key));
  for (const placement of remote.placements) {
    const mine = localByKey.get(key(placement));
    if (!mine) {
      differences.push(`${describePlacement(placement)} is on the remote theme only.`);
      continue;
    }
    for (const field of ['mapId', 'desktop', 'mobile', 'images']) {
      const theirs = JSON.stringify(placement[field]);
      const ours = JSON.stringify(mine[field]);
      if (theirs !== ours) differences.push(`${describePlacement(placement)}: ${field} is ${theirs} remotely, ${ours} here.`);
    }
  }
  for (const placement of local.placements) {
    if (!remoteKeys.has(key(placement))) differences.push(`${describePlacement(placement)} is in this checkout only.`);
  }
  return differences;
}

/* -------------------------------------------------------------------------------------------- */
/* Browser                                                                                       */
/* -------------------------------------------------------------------------------------------- */

async function findBrowser() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);

  const names =
    platform() === 'win32'
      ? ['chrome.exe', 'msedge.exe']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome', 'microsoft-edge'];
  for (const folder of (process.env.PATH ?? '').split(delimiter)) {
    for (const name of names) candidates.push(join(folder, name));
  }

  if (platform() === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  } else if (platform() === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (!base) continue;
      candidates.push(join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      candidates.push(join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  }

  // A browser downloaded by Playwright, if one is cached.
  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    (platform() === 'darwin'
      ? join(homedir(), 'Library', 'Caches', 'ms-playwright')
      : platform() === 'win32'
        ? join(process.env.LOCALAPPDATA ?? homedir(), 'ms-playwright')
        : join(homedir(), '.cache', 'ms-playwright'));
  const builds = (await readdir(cache).catch(() => [])).filter((name) => /^chromium-\d+$/.test(name)).sort().reverse();
  for (const build of builds) {
    candidates.push(
      join(cache, build, 'chrome-linux64', 'chrome'),
      join(cache, build, 'chrome-linux', 'chrome'),
      join(cache, build, 'chrome-win', 'chrome.exe'),
      join(cache, build, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')
    );
  }

  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Try the next one.
    }
  }
  throw new UsageError('No Chrome, Chromium or Edge was found. Install one or set CHROME_PATH to its executable.');
}

/** A minimal Chrome DevTools Protocol client over Node's built-in WebSocket. */
class Browser {
  static async launch(executable, profile) {
    const child = spawn(
      executable,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-sync',
        '--hide-scrollbars',
        '--mute-audio',
        '--force-color-profile=srgb',
        'about:blank',
      ],
      // Its own process group, so closing it also ends its helper processes.
      { stdio: ['ignore', 'ignore', 'pipe'], detached: platform() !== 'win32' }
    );

    const endpoint = await new Promise((resolvePromise, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error(`${executable} didn't start:\n${output}`)), 30000);
      child.stderr.on('data', (chunk) => {
        output += chunk;
        const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) {
          clearTimeout(timer);
          resolvePromise(match[1]);
        }
      });
      child.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`${executable} exited (${code}) before it was ready:\n${output}`));
      });
    });

    const socket = new WebSocket(endpoint);
    await new Promise((resolvePromise, reject) => {
      socket.addEventListener('open', resolvePromise, { once: true });
      socket.addEventListener('error', () => reject(new Error('Could not connect to the browser.')), { once: true });
    });
    return new Browser(child, socket);
  }

  constructor(child, socket) {
    this.child = child;
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: done, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
        else done(message.result);
      } else if (message.method) {
        for (const listener of this.listeners) listener(message);
      }
    });
    // A browser that stops answering fails the run instead of leaving it waiting.
    socket.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('the browser closed unexpectedly'));
      this.pending.clear();
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((done, reject) => this.pending.set(id, { resolve: done, reject }));
  }

  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async close() {
    try {
      this.socket.close();
    } catch {
      // Already closed.
    }
    const signal = (name) => {
      try {
        if (platform() === 'win32') this.child.kill(name);
        else process.kill(-this.child.pid, name);
      } catch {
        // Already gone.
      }
    };
    if (this.child.exitCode === null && this.child.signalCode === null) {
      const exited = new Promise((done) => this.child.once('exit', done));
      signal('SIGTERM');
      await Promise.race([exited, new Promise((done) => setTimeout(done, 5000))]);
    }
    signal('SIGKILL');
  }
}

/** Runs in the uMap page: whether the map, its tiles and its features have finished drawing. */
function pageState() {
  const container = document.querySelector('.leaflet-container');
  if (!container) return { ready: false, problem: 'the map did not start' };

  let settings = {};
  try {
    settings = JSON.parse(document.getElementById('map-settings')?.dataset.settings ?? '{}').properties ?? {};
  } catch {
    // Reported below as missing settings.
  }

  const width = innerWidth;
  const height = innerHeight;
  const onScreen = (rect) => rect.right > 0 && rect.bottom > 0 && rect.left < width && rect.top < height;
  const opaque = (element) => {
    for (let node = element; node && node !== container; node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) < 1) return false;
    }
    return true;
  };

  const tiles = [...container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile')].filter((tile) =>
    onScreen(tile.getBoundingClientRect())
  );
  const drawn = tiles.filter(
    (tile) => tile.complete && tile.naturalWidth > 0 && tile.classList.contains('leaflet-tile-loaded') && opaque(tile)
  );
  const failedTiles = container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile-error').length;

  // Every part of the viewport must be covered by a drawn tile.
  const rects = drawn.map((tile) => tile.getBoundingClientRect());
  let uncovered = 0;
  for (let i = 0; i <= 10; i++) {
    for (let j = 0; j <= 10; j++) {
      const x = Math.min(width - 0.5, (i * width) / 10);
      const y = Math.min(height - 0.5, (j * height) / 10);
      if (!rects.some((rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) uncovered++;
    }
  }

  const markers = [...container.querySelectorAll('.leaflet-marker-pane > *')];
  const shapes = [...container.querySelectorAll('.leaflet-overlay-pane path, .leaflet-overlay-pane canvas')];
  const images = [...container.querySelectorAll('.leaflet-marker-pane img')];
  const expectFeatures = (settings.datalayers ?? []).some((layer) => layer?.properties?.displayOnLoad !== false);
  const featuresOnScreen = [...markers, ...shapes].filter((element) => onScreen(element.getBoundingClientRect())).length;
  const zooms = [...new Set(tiles.map((tile) => tile.src.match(/\/(\d+)\/\d+\/\d+[^/]*$/)?.[1]).filter(Boolean))];
  const animating = Boolean(container.querySelector('.leaflet-zoom-anim, .leaflet-pan-anim')) ||
    container.classList.contains('leaflet-zoom-anim');

  const problems = [];
  if (!settings.tilelayer) problems.push('map settings missing');
  if (tiles.length === 0 || uncovered > 0) problems.push(`${uncovered} of 121 sample points without a drawn tile`);
  if (drawn.length < tiles.length) problems.push(`${tiles.length - drawn.length} tiles still loading`);
  if (expectFeatures && featuresOnScreen === 0) problems.push('no map features drawn');
  if (images.some((image) => !(image.complete && image.naturalWidth > 0))) problems.push('marker images loading');
  if (animating) problems.push('map animating');

  return {
    ready: problems.length === 0,
    problem: problems.join('; '),
    failedTiles,
    tiles: tiles.length,
    zooms,
    features: featuresOnScreen,
    center: settings.center,
    zoom: settings.zoom,
    tileTemplate: settings.tilelayer?.url_template,
  };
}

/** Hides everything but the map itself: controls, credits, loaders, panels and alerts. */
const HIDE_INTERFACE = `
  .leaflet-container > :not(.leaflet-map-pane),
  body > :not(.leaflet-container, :has(.leaflet-container), script, style, template) { display: none !important; }
`;

async function captureMap(browser, url, size) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => browser.send(method, params, sessionId);

  const requests = new Map();
  const failures = [];
  let mainStatus = null;
  let lastActivity = Date.now();
  let loaded = false;
  const stop = browser.on((message) => {
    if (message.sessionId !== sessionId) return;
    const { method, params } = message;
    if (method === 'Network.requestWillBeSent') {
      requests.set(params.requestId, params.request.url);
      lastActivity = Date.now();
    } else if (method === 'Network.responseReceived') {
      const { status, url: responseUrl } = params.response;
      if (params.type === 'Document' && mainStatus === null) mainStatus = status;
      // Tiles, data layers and the page itself must all arrive intact.
      if (status >= 400 && !/favicon|\/stats?\b/i.test(responseUrl)) failures.push(`${status} ${responseUrl}`);
    } else if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') {
      if (method === 'Network.loadingFailed' && !params.canceled && requests.has(params.requestId)) {
        const failedUrl = requests.get(params.requestId);
        if (!/favicon/i.test(failedUrl)) failures.push(`${params.errorText} ${failedUrl}`);
      }
      requests.delete(params.requestId);
      lastActivity = Date.now();
    } else if (method === 'Page.loadEventFired') {
      loaded = true;
    }
  });

  try {
    await send('Page.enable');
    await send('Network.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: size.width,
      height: size.height,
      deviceScaleFactor: SCALE,
      mobile: false,
    });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.navigate', { url });

    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
      return result.value;
    };

    const deadline = Date.now() + LOAD_TIMEOUT;
    let state = null;
    let steady = 0;
    while (true) {
      await new Promise((done) => setTimeout(done, 250));
      if (failures.length) throw new Error(`a request failed: ${failures[0]}`);
      if (mainStatus !== null && mainStatus !== 200) throw new Error(`uMap answered ${mainStatus} for ${url}`);
      if (loaded) {
        state = await evaluate(`(${pageState})()`);
        const quiet = requests.size === 0 && Date.now() - lastActivity >= QUIET_PERIOD;
        steady = state.ready && quiet ? steady + 1 : 0;
        if (steady >= 3) break;
      }
      if (Date.now() > deadline) {
        throw new Error(`the map didn't finish drawing within ${LOAD_TIMEOUT / 1000} s (${state?.problem || 'page not loaded'})`);
      }
    }

    await evaluate(`(() => {
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(HIDE_INTERFACE)};
      document.head.append(style);
    })()`);
    await evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))');
    const final = await evaluate(`(${pageState})()`);
    if (!final.ready) throw new Error(`the map changed while capturing (${final.problem})`);

    const { data } = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    return { png: Buffer.from(data, 'base64'), state: final };
  } finally {
    stop();
    await browser.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

/* -------------------------------------------------------------------------------------------- */
/* PNG                                                                                           */
/* -------------------------------------------------------------------------------------------- */

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Decodes an 8-bit, non-interlaced greyscale, RGB, palette or RGBA PNG into RGBA pixels. */
function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('not a PNG file');
  let offset = 8;
  let header = null;
  let palette = null;
  let transparency = null;
  const data = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], color: body[9], interlace: body[12] };
    } else if (type === 'PLTE') palette = body;
    else if (type === 'tRNS') transparency = body;
    else if (type === 'IDAT') data.push(body);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (!header || header.depth !== 8 || header.interlace !== 0) throw new Error('unsupported PNG layout');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.color];
  if (!channels) throw new Error('unsupported PNG colour type');

  const { width, height } = header;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(data));
  const pixels = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? line[x - channels] : 0;
      const up = previous[x];
      const upLeft = x >= channels ? previous[x - channels] : 0;
      if (filter === 1) line[x] = (line[x] + left) & 0xff;
      else if (filter === 2) line[x] = (line[x] + up) & 0xff;
      else if (filter === 3) line[x] = (line[x] + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) line[x] = (line[x] + paeth(left, up, upLeft)) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const target = (y * width + x) * 4;
      const source = x * channels;
      if (header.color === 6) line.copy(pixels, target, source, source + 4);
      else if (header.color === 2) {
        line.copy(pixels, target, source, source + 3);
        pixels[target + 3] = 255;
      } else if (header.color === 3) {
        const index = line[source];
        palette.copy(pixels, target, index * 3, index * 3 + 3);
        pixels[target + 3] = transparency && index < transparency.length ? transparency[index] : 255;
      } else {
        pixels.fill(line[source], target, target + 3);
        pixels[target + 3] = header.color === 4 ? line[source + 1] : 255;
      }
    }
    previous = line;
  }
  return { width, height, pixels };
}

/** Applies one PNG filter type to a scanline. */
function filterLine(type, line, previous, bpp) {
  const output = Buffer.alloc(line.length + 1);
  output[0] = type;
  for (let x = 0; x < line.length; x++) {
    const left = x >= bpp ? line[x - bpp] : 0;
    const up = previous[x];
    const upLeft = x >= bpp ? previous[x - bpp] : 0;
    const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][type];
    output[x + 1] = (line[x] - predictor) & 0xff;
  }
  return output;
}

/**
 * Encodes RGBA pixels as the smallest lossless PNG this can find: RGB without an alpha channel
 * when every pixel is opaque, an exact palette when there are 256 colours or fewer, and the best
 * of several filter and compression strategies. No metadata is written.
 */
function encodePng({ width, height, pixels }) {
  const opaque = pixels.every((value, index) => index % 4 !== 3 || value === 255);
  const colours = new Map();
  for (let i = 0; i < pixels.length && colours.size <= 256; i += 4) {
    const key = pixels.readUInt32BE(i);
    if (!colours.has(key)) colours.set(key, colours.size);
  }

  let color;
  let bpp;
  let stride;
  let lineOf;
  const chunks = [];
  if (colours.size <= 256) {
    color = 3;
    bpp = 1;
    stride = width;
    const palette = Buffer.alloc(colours.size * 3);
    const alpha = Buffer.alloc(colours.size);
    for (const [key, index] of colours) {
      palette[index * 3] = key >>> 24;
      palette[index * 3 + 1] = (key >>> 16) & 0xff;
      palette[index * 3 + 2] = (key >>> 8) & 0xff;
      alpha[index] = key & 0xff;
    }
    chunks.push(chunk('PLTE', palette));
    if (!opaque) chunks.push(chunk('tRNS', alpha));
    lineOf = (y) => {
      const line = Buffer.alloc(width);
      for (let x = 0; x < width; x++) line[x] = colours.get(pixels.readUInt32BE((y * width + x) * 4));
      return line;
    };
  } else {
    color = opaque ? 2 : 6;
    bpp = opaque ? 3 : 4;
    stride = width * bpp;
    lineOf = (y) => {
      if (!opaque) return pixels.subarray(y * width * 4, (y + 1) * width * 4);
      const line = Buffer.alloc(stride);
      for (let x = 0; x < width; x++) pixels.copy(line, x * 3, (y * width + x) * 4, (y * width + x) * 4 + 3);
      return line;
    };
  }

  const lines = Array.from({ length: height }, (_, y) => lineOf(y));
  const filtered = (choose) => {
    const parts = [];
    let previous = Buffer.alloc(stride);
    for (const line of lines) {
      parts.push(choose(line, previous));
      previous = line;
    }
    return Buffer.concat(parts);
  };
  const candidates = [0, 1, 2, 3, 4].map((type) => filtered((line, previous) => filterLine(type, line, previous, bpp)));
  // Per line, the filter with the smallest sum of absolute differences.
  candidates.push(
    filtered((line, previous) => {
      let best = null;
      let bestScore = Infinity;
      for (let type = 0; type <= 4; type++) {
        const candidate = filterLine(type, line, previous, bpp);
        let score = 0;
        for (let i = 1; i < candidate.length; i++) score += candidate[i] < 128 ? candidate[i] : 256 - candidate[i];
        if (score < bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
      return best;
    })
  );

  let smallest = null;
  for (const candidate of candidates) {
    for (const strategy of [zlibConstants.Z_DEFAULT_STRATEGY, zlibConstants.Z_FILTERED]) {
      const compressed = deflateSync(candidate, { level: 9, memLevel: 9, strategy });
      if (!smallest || compressed.length < smallest.length) smallest = compressed;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = color;
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    ...chunks,
    chunk('IDAT', smallest),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Rejects captures that are the wrong size, transparent or nearly uniform. */
function validateImage(image, size) {
  const expected = { width: size.width * SCALE, height: size.height * SCALE };
  if (image.width !== expected.width || image.height !== expected.height) {
    throw new Error(`the capture is ${image.width}×${image.height} px instead of ${expected.width}×${expected.height}`);
  }
  const counts = new Map();
  let transparent = 0;
  for (let i = 0; i < image.pixels.length; i += 4) {
    if (image.pixels[i + 3] !== 255) transparent++;
    const key = image.pixels.readUInt32BE(i);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = image.width * image.height;
  let largest = 0;
  for (const count of counts.values()) largest = Math.max(largest, count);
  const dominant = largest / total;
  if (transparent) throw new Error(`the capture has ${transparent} transparent pixels`);
  if (counts.size < 256 || dominant > 0.6) {
    throw new Error(`the capture looks blank (${counts.size} colours; one covers ${Math.round(dominant * 100)}%)`);
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Main                                                                                          */
/* -------------------------------------------------------------------------------------------- */

function mapUrl(mapId) {
  const url = new URL(`/fr/map/${mapId}`, UMAP_ORIGIN);
  for (const [key, value] of Object.entries(MAP_OPTIONS)) url.searchParams.set(key, value);
  return url.href;
}

function fileName(placement, variant, size) {
  return `carte-${placement.name}${variant === 'mobile' ? '-mobile' : ''}-${size.width}x${size.height}.png`;
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }

  const work = await mkdtemp(join(tmpdir(), 'gamma-map-previews-'));
  let browser = null;
  const cleanUp = async () => {
    await browser?.close();
    browser = null;
    await rm(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  };
  const interrupt = (signal) => {
    console.error(`\nInterrupted (${signal}); nothing was saved.`);
    cleanUp().finally(() => process.exit(130));
  };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  try {
    console.log('Identifying the remote theme…');
    const theme = await resolveTheme(options);
    console.log(`  Store: ${theme.store}`);
    console.log(`  Theme: ${theme.name} (#${theme.id}, ${theme.role}), ${theme.association}`);

    const pulled = join(work, 'theme');
    await mkdir(pulled);
    console.log('Reading its templates, section groups and Map block (read-only)…');
    await pullTheme(theme, options, pulled);
    const remote = await discoverPlacements(pulled);
    for (const note of remote.notes) console.log(`  Note: ${note}`);
    if (remote.placements.length === 0) throw new UsageError('The remote theme has no Map blocks with a uMap map to preview.');

    if (!keepsMapScale(remote.liquid)) {
      console.log(
        "  Warning: this theme's Map block scales its image to fit the box, so where a box is narrower than its " +
          'preview the map looks slightly zoomed out until it is activated. Blocks that draw the image at the ' +
          'Maximum width match the interactive map at every width.'
      );
    }
    const differences = await compareWithCheckout(remote);
    if (differences.length) {
      console.log('  The remote theme differs from this checkout; previews follow the remote theme:');
      for (const difference of differences) console.log(`    - ${difference}`);
    }

    // One capture per distinct map and size; mobile reuses the desktop preview when it's the same.
    const outputs = [];
    for (const placement of remote.placements) {
      for (const variant of ['desktop', 'mobile']) {
        const size = placement[variant];
        if (variant === 'mobile' && size.height === placement.desktop.height) continue;
        outputs.push({
          placement,
          variant,
          size,
          uses: variant === 'mobile' || placement.mobile.height !== placement.desktop.height ? variant : 'desktop and mobile',
          file: fileName(placement, variant, size),
          key: `${placement.mapId}@${size.width}x${size.height}`,
        });
      }
    }

    console.log('Previews:');
    for (const output of outputs) {
      console.log(
        `  ${output.file}: ${describePlacement(output.placement)} (${output.uses}), map ${output.placement.mapId}, ` +
          `up to ${output.size.width}×${output.size.height} CSS px`
      );
    }
    if (options.dryRun) {
      console.log('Dry run: nothing was captured or saved.');
      return;
    }

    const executable = await findBrowser();
    console.log(`Capturing with ${executable}…`);
    browser = await Browser.launch(executable, join(work, 'profile'));

    const captures = new Map();
    for (const output of outputs) {
      if (!captures.has(output.key)) {
        const url = mapUrl(output.placement.mapId);
        let result = null;
        let lastError = null;
        for (let attempt = 1; attempt <= 2 && !result; attempt++) {
          try {
            const { png, state } = await captureMap(browser, url, output.size);
            const decoded = decodePng(png);
            validateImage(decoded, output.size);
            const encoded = encodePng(decoded);
            // The saved file must decode to exactly the captured pixels.
            if (!decodePng(encoded).pixels.equals(decoded.pixels)) throw new Error('the optimised PNG is not lossless');
            result = { encoded, state, raw: png.length };
          } catch (error) {
            lastError = error;
            if (attempt === 1) console.log(`  Retrying ${output.key}: ${error.message}`);
          }
        }
        if (!result) throw new Error(`Couldn't capture ${output.placement.mapId} at ${output.size.width}×${output.size.height}: ${lastError.message}`);
        captures.set(output.key, result);
      }
      output.capture = captures.get(output.key);
      await writeFile(join(work, output.file), output.capture.encoded);
    }
    await browser.close();
    browser = null;

    // Every capture passed, so the previous files can be replaced.
    await mkdir(OUTPUT_DIR, { recursive: true });
    for (const output of outputs) await copyFile(join(work, output.file), join(OUTPUT_DIR, output.file));

    console.log(`\nSaved in ${OUTPUT_DIR}:`);
    for (const output of outputs) {
      const { state, encoded, raw } = output.capture;
      console.log(
        `  ${output.file}\n` +
          `    ${output.size.width}×${output.size.height} CSS px displayed (${output.uses}), ` +
          `${output.size.width * SCALE}×${output.size.height * SCALE} px saved, ${formatBytes(encoded.length)} ` +
          `(browser PNG ${formatBytes(raw)})\n` +
          `    map ${output.placement.mapId}: centre ${state.center?.lat}, ${state.center?.lng}, zoom ${state.zoom}, ` +
          `${state.tiles} tiles at zoom ${state.zooms.join(', ')}, ${state.features} feature(s)`
      );
    }

    const saved = new Set(outputs.map((output) => output.file));
    const others = (await readdir(OUTPUT_DIR)).filter((name) => name.startsWith('carte-') && !saved.has(name));
    if (others.length) console.log(`  Not regenerated (left unchanged): ${others.join(', ')}`);

    const template = outputs[0].capture.state.tileTemplate ?? '';
    if (!template.includes('{r}') && !/@2x/.test(template)) {
      console.log(
        `\nThe map's background (${template}) has no high-density tiles, so the previews show its tiles at the ` +
          'interactive map’s zoom, enlarged as the interactive map shows them on high-density screens; the marker and ' +
          'other features are drawn at full resolution.'
      );
    }
    console.log('\nUpload the files to Shopify Files and select them in each Map block’s Image setting (and Mobile image ' +
      'when one is listed). Nothing was uploaded.');
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    await cleanUp();
  }
}

main().catch((error) => {
  console.error(`\n${error instanceof UsageError ? error.message : error.stack ?? error.message}`);
  process.exit(1);
});
