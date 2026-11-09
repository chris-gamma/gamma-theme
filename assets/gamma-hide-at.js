/**
 * Hides time-limited campaign content on pages that stay open past its end.
 *
 * Campaign pages, the promotions index and collection callouts mark claims, offers and cards with
 * `data-gamma-hide-at`, a Unix second. Shopify's next render is authoritative; this only stops an
 * already loaded or cached page from showing them after that instant. A container marked
 * `data-gamma-hide-empty`, such as the offer navigation, is hidden once all its list items are. A
 * `gamma:hide-at` event on the document reports that something was hidden, so pagers can recount.
 */

const SELECTOR = '[data-gamma-hide-at]';
/** Longest delay `setTimeout` accepts (about 24.8 days). */
const MAX_DELAY = 2 ** 31 - 1;
let timer = 0;

function check() {
  window.clearTimeout(timer);
  const now = Date.now() / 1000;
  let next = Infinity;
  let hidden = 0;

  for (const element of document.querySelectorAll(SELECTOR)) {
    if (!(element instanceof HTMLElement) || element.hidden) continue;
    const at = Number(element.dataset.gammaHideAt);
    if (!Number.isFinite(at) || at <= 0) continue;

    if (at <= now) {
      element.hidden = true;
      hidden += 1;
    } else {
      next = Math.min(next, at);
    }
  }

  if (hidden > 0) {
    for (const container of document.querySelectorAll('[data-gamma-hide-empty]')) {
      if (!(container instanceof HTMLElement)) continue;
      const items = [...container.querySelectorAll('li')];
      if (items.length > 0 && items.every((item) => item instanceof HTMLElement && item.hidden)) container.hidden = true;
    }
  }

  if (hidden > 0) document.dispatchEvent(new CustomEvent('gamma:hide-at', { detail: { hidden } }));
  if (next !== Infinity) timer = window.setTimeout(check, Math.min((next - now) * 1000 + 250, MAX_DELAY));
}

check();
// Background tabs throttle timers, and restored pages skip them, so check again when the page returns.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') check();
});
window.addEventListener('pageshow', check);
