// Lets Node load theme modules from assets/: `@theme/<name>` resolves to tests/stubs/<name>.mjs,
// assets load as ES modules, and registering a custom element does nothing.
import { registerHooks } from 'node:module';

const stubs = new URL('./stubs/', import.meta.url);
const assets = new URL('../assets/', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@theme/')) {
      return { url: new URL(`${specifier.slice('@theme/'.length)}.mjs`, stubs).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    return nextLoad(url, url.startsWith(assets) ? { ...context, format: 'module' } : context);
  },
});

globalThis.customElements ??= { get: () => undefined, define: () => {} };
