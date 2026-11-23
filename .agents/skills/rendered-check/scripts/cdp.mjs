// Small Chrome DevTools Protocol helper for headless Chromium checks.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Headless Chromium reports no fine pointer, so hover rules gated on `(any-pointer: fine)` never
// match unless the pointer is declared.
const FINE_POINTER =
  '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2';

// Browsers still running when the script ends, crashes or is interrupted are stopped and their profiles removed.
const running = new Set();
process.on('exit', () => running.forEach((stop) => stop()));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => process.exit(1));

// CHROME_PATH, else the first Chromium or Chrome on PATH.
function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const dirs = (process.env.PATH || '').split(path.delimiter);
  for (const name of ['chromium-browser', 'chromium', 'google-chrome-stable', 'google-chrome', 'chrome']) {
    for (const dir of dirs) {
      const file = path.join(dir, name);
      try {
        fs.accessSync(file, fs.constants.X_OK);
        return file;
      } catch {}
    }
  }
  throw new Error('No Chromium or Chrome found on PATH; set CHROME_PATH to its executable.');
}

// With no `port`, Chromium picks a free one and reports it in the profile's DevToolsActivePort file, so
// scripts can run side by side. Pass a port only to attach another tool to that browser.
export async function launch({ port = 0, fine = true, profile, extra = [], scrollbars = false } = {}) {
  // A new profile for each launch, so every run starts with an empty cart and no cookies; a profile the
  // caller names is kept.
  const bin = findBrowser();
  const temporary = !profile;
  profile ??= fs.mkdtempSync(path.join(os.tmpdir(), 'gamma-cdp-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  fs.rmSync(portFile, { force: true });
  const args = ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-gpu', `--user-data-dir=${profile}`];
  if (!scrollbars) args.push('--hide-scrollbars');
  if (fine) args.push(FINE_POINTER);
  // In its own process group, so stopping it also stops its renderer and helper processes.
  const chrome = spawn(bin, [...args, ...extra, 'about:blank'], { stdio: 'ignore', detached: true });
  const signal = (name) => {
    try {
      process.kill(-chrome.pid, name);
    } catch {}
  };
  const removeProfile = () => {
    if (temporary) fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  };
  const stop = () => {
    signal('SIGKILL');
    removeProfile();
  };
  running.add(stop);

  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try {
      if (!port) port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]) || 0;
      if (port) target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
    } catch {}
    if (!target) await sleep(250);
  }
  if (!target) throw new Error(`Chromium didn't start (${bin}, port ${port || 'auto'})`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    } else if (d.method) listeners.forEach((l) => l(d));
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');

  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) {
      return { __error: r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text };
    }
    return r.result?.result?.value;
  };
  const viewport = (width, height = 900, scale = 1) =>
    send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: width < 750 });
  const nav = async (url, wait = 2500) => {
    const loaded = new Promise((r) => {
      const l = (d) => {
        if (d.method === 'Page.loadEventFired') {
          listeners.splice(listeners.indexOf(l), 1);
          r();
        }
      };
      listeners.push(l);
    });
    await send('Page.navigate', { url });
    await Promise.race([loaded, sleep(30000)]);
    await sleep(wait);
  };
  const shot = async (file, clip) => {
    const r = await send('Page.captureScreenshot', {
      format: 'png',
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
      captureBeyondViewport: false,
    });
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  };
  // Real input: Horizon reacts to trusted events only (focus-visible, predictive search typing).
  const key = async (key, code = key, keyCode = 0) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
  };
  const move = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };
  const type = (text) => send('Input.insertText', { text });
  const close = async () => {
    try {
      ws.close();
    } catch {}
    running.delete(stop);
    if (chrome.exitCode === null && chrome.signalCode === null) {
      const exited = new Promise((r) => chrome.once('exit', r));
      signal('SIGTERM');
      await Promise.race([exited, sleep(5000)]);
      signal('SIGKILL');
    }
    removeProfile();
  };
  return { send, ev, viewport, nav, shot, key, move, click, type, close, listeners, pid: chrome.pid };
}
