import { Component } from '@theme/component';
import { DialogCloseEvent } from '@theme/dialog';

/**
 * Search requests for the rental site's WordPress catalogue (`wp-json/wp/v2/products` under each
 * language's site address). Responses are external data: only https destinations and images on the
 * configured site are kept, and titles are decoded as plain text.
 */

export const MIN_QUERY_LENGTH = 3;
export const MAX_QUERY_LENGTH = 100;
export const RESULT_LIMIT = 4;
export const REQUEST_TIMEOUT = 3000;
export const MAX_RESPONSE_BYTES = 256 * 1024;

const MAX_TITLE_LENGTH = 200;
const MAX_URL_LENGTH = 2048;
const MAX_IMAGE_DIMENSION = 4000;
// WordPress's thumbnail size is a square crop; these keep the photo's proportions.
const IMAGE_SIZES = ['medium', 'medium_large', 'large', 'full'];

/**
 * @typedef {object} RentalImage
 * @property {string} url
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {object} RentalResult
 * @property {string} title
 * @property {string} url - The equipment page on the rental site.
 * @property {RentalImage | null} image
 */

/**
 * @typedef {object} RentalMatches
 * @property {RentalResult[]} results
 * @property {number | null} total - All matches on the rental site, when it reports them.
 */

/**
 * @typedef {'aborted' | 'timeout' | 'network' | 'rate-limited' | 'denied' | 'http' | 'invalid'} RentalErrorKind
 */

export class RentalSearchError extends Error {
  /**
   * @param {RentalErrorKind} kind
   * @param {{ status?: number, retryAfter?: number | null }} [details]
   */
  constructor(kind, { status, retryAfter = null } = {}) {
    super(`Rental search failed: ${kind}${status ? ` (${status})` : ''}`);
    this.kind = kind;
    this.status = status;
    /** Seconds requested by a Retry-After header. */
    this.retryAfter = retryAfter;
  }
}

/**
 * Returns the rental site address as a URL, or null unless it is an https folder address without
 * credentials, query or fragment.
 * @param {string} value
 * @returns {URL | null}
 */
export function parseSite(value) {
  if (!value || /\s/.test(value)) return null;

  let site;
  try {
    site = new URL(value);
  } catch {
    return null;
  }

  if (
    site.protocol !== 'https:' ||
    !site.hostname ||
    site.username ||
    site.password ||
    site.search ||
    site.hash ||
    !site.pathname.endsWith('/') ||
    value.includes('?') ||
    value.includes('#')
  ) {
    return null;
  }

  return site;
}

/**
 * Collapses whitespace and control characters so equivalent queries share a request.
 * @param {string} value
 * @returns {string}
 */
export function normalizeQuery(value) {
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\s]+/g, ' ')
    .trim();
}

/**
 * @param {string} query - A normalized query.
 * @returns {boolean}
 */
export function isSearchableQuery(query) {
  const length = [...query].length;
  return length >= MIN_QUERY_LENGTH && length <= MAX_QUERY_LENGTH;
}

/**
 * @param {URL} site
 * @param {string} query
 * @returns {URL}
 */
export function catalogRequestUrl(site, query) {
  const url = new URL('wp-json/wp/v2/products', site);
  url.searchParams.set('search', query);
  url.searchParams.set('per_page', String(RESULT_LIMIT));
  url.searchParams.set('context', 'embed');
  url.searchParams.set('orderby', 'relevance');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('_embed', 'wp:featuredmedia');
  // `_embed` needs the featured-media link kept in the response.
  url.searchParams.set('_fields', 'title.rendered,link,_links.wp:featuredmedia,_embedded');
  return url;
}

/**
 * The rental site's own search results page, which lists every match.
 * @param {URL} site
 * @param {string} query
 * @returns {string}
 */
export function searchPageUrl(site, query) {
  const url = new URL(site.href);
  url.searchParams.set('post_type', 'gamma_product');
  url.searchParams.set('s', query);
  return url.href;
}

/**
 * Searches the rental catalogue. Rejects with a RentalSearchError; `aborted` means the caller
 * cancelled the request and isn't a service failure.
 * @param {URL} site
 * @param {string} query - A normalized, searchable query.
 * @param {AbortSignal} signal
 * @returns {Promise<RentalMatches>}
 */
export async function fetchRentalMatches(site, query, signal) {
  if (signal.aborted) throw new RentalSearchError('aborted');

  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);
  signal.addEventListener('abort', abort, { once: true });

  /** @param {unknown} error */
  const failure = (error) => {
    if (error instanceof RentalSearchError) return error;
    if (signal.aborted) return new RentalSearchError('aborted');
    if (timedOut) return new RentalSearchError('timeout');
    return new RentalSearchError('network');
  };

  try {
    let response;
    try {
      response = await fetch(catalogRequestUrl(site, query), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        // A moved catalogue must be configured, not followed to another address.
        redirect: 'error',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (error) {
      throw failure(error);
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      const { status } = response;
      if (status === 429) {
        throw new RentalSearchError('rate-limited', { status, retryAfter: parseRetryAfter(response) });
      }
      if (status === 401 || status === 403) throw new RentalSearchError('denied', { status });
      throw new RentalSearchError('http', { status });
    }

    let text;
    try {
      text = await readLimitedText(response, MAX_RESPONSE_BYTES);
    } catch (error) {
      throw failure(error);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new RentalSearchError('invalid');
    }

    return { results: normalizeResults(data, site), total: parseTotal(response) };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

/**
 * Reads a response body, cancelling the read once it exceeds `limit` bytes.
 * @param {Response} response
 * @param {number} limit
 * @returns {Promise<string>}
 */
async function readLimitedText(response, limit) {
  const declared = Number(response.headers.get('Content-Length'));
  if (declared > limit) {
    await response.body?.cancel().catch(() => {});
    throw new RentalSearchError('invalid');
  }

  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).length > limit) throw new RentalSearchError('invalid');
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) {
      await reader.cancel().catch(() => {});
      throw new RentalSearchError('invalid');
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

/**
 * @param {Response} response
 * @returns {number | null}
 */
function parseTotal(response) {
  const value = response.headers.get('X-WP-Total')?.trim() ?? '';
  return /^\d{1,7}$/.test(value) ? Number(value) : null;
}

/**
 * @param {Response} response
 * @returns {number | null}
 */
function parseRetryAfter(response) {
  const value = response.headers.get('Retry-After')?.trim() ?? '';
  if (/^\d{1,6}$/.test(value)) return Number(value);

  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, Math.round((date - Date.now()) / 1000));
}

/**
 * Keeps up to RESULT_LIMIT valid, distinct results from a products response.
 * @param {unknown} data
 * @param {URL} site
 * @returns {RentalResult[]}
 */
export function normalizeResults(data, site) {
  if (!Array.isArray(data)) throw new RentalSearchError('invalid');

  /** @type {RentalResult[]} */
  const results = [];
  const seen = new Set();

  for (const item of data.slice(0, RESULT_LIMIT * 5)) {
    if (!isRecord(item)) continue;

    const url = validateDestination(item.link, site);
    const title = isRecord(item.title) ? decodeTitle(item.title.rendered) : '';
    if (!url || !title || seen.has(url)) continue;

    seen.add(url);
    results.push({ title, url, image: selectImage(item, site) });
    if (results.length === RESULT_LIMIT) break;
  }

  // Items that were all unusable mean the response no longer matches the expected contract.
  if (data.length > 0 && results.length === 0) throw new RentalSearchError('invalid');

  return results;
}

/**
 * Returns an equipment page address on the configured site and language path, or null.
 * @param {unknown} value
 * @param {URL} site
 * @returns {string | null}
 */
export function validateDestination(value, site) {
  const url = parseSiteUrl(value, site);
  return url && url.pathname.startsWith(site.pathname) ? url.href : null;
}

/**
 * Picks the smallest uncropped size of the featured image, when it is on the configured site.
 * @param {Record<string, unknown>} item
 * @param {URL} site
 * @returns {RentalImage | null}
 */
export function selectImage(item, site) {
  const embedded = isRecord(item._embedded) ? item._embedded['wp:featuredmedia'] : null;
  const media = Array.isArray(embedded) ? embedded[0] : null;
  const details = isRecord(media) ? media.media_details : null;
  const sizes = isRecord(details) ? details.sizes : null;
  if (!isRecord(sizes)) return null;

  for (const name of IMAGE_SIZES) {
    const size = sizes[name];
    if (!isRecord(size)) continue;

    const url = parseSiteUrl(size.source_url, site);
    const { width, height } = size;
    if (url && isDimension(width) && isDimension(height)) return { url: url.href, width, height };
  }

  return null;
}

/**
 * Decodes a WordPress `title.rendered` value to plain text without creating live elements.
 * @param {unknown} value
 * @returns {string}
 */
export function decodeTitle(value) {
  if (typeof value !== 'string' || !value || value.length > MAX_TITLE_LENGTH * 10) return '';

  const text = new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '';
  const title = normalizeQuery(text);
  const characters = [...title];

  return characters.length > MAX_TITLE_LENGTH ? `${characters.slice(0, MAX_TITLE_LENGTH - 1).join('')}…` : title;
}

/**
 * @param {unknown} value
 * @param {URL} site
 * @returns {URL | null}
 */
function parseSiteUrl(value, site) {
  if (typeof value !== 'string' || !value || value.length > MAX_URL_LENGTH) return null;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  return url.protocol === 'https:' && url.origin === site.origin && !url.username && !url.password ? url : null;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isDimension(value) {
  return Number.isInteger(value) && Number(value) > 0 && Number(value) <= MAX_IMAGE_DIMENSION;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const DEBOUNCE_DELAY = 300;
const CACHE_ENTRIES = 20;
const CACHE_LIFETIME = 5 * 60 * 1000;
const FAILURE_LIMIT = 2;
const FAILURE_PAUSE = 60 * 1000;
const DENIED_PAUSE = 10 * 60 * 1000;
const RATE_LIMIT_PAUSE = { fallback: 120, min: 30, max: 600 };
const IMAGE_FAILURE_LIMIT = 2;

/**
 * Successful searches for this page view, oldest first.
 * @type {Map<string, { expires: number, matches: RentalMatches }>}
 */
const cache = new Map();

/** Consecutive service failures, and when requests may resume after too many or a refusal. */
const service = { failures: 0, pausedUntil: 0 };

/** The visitor's choice to hide rental results lasts for the browser tab, without persistent storage. */
const COLLAPSED_KEY = 'gamma-rental-search:collapsed';

function readExpanded() {
  try {
    return sessionStorage.getItem(COLLAPSED_KEY) !== '1';
  } catch {
    return true;
  }
}

/** @param {boolean} expanded */
function storeExpanded(expanded) {
  try {
    if (expanded) sessionStorage.removeItem(COLLAPSED_KEY);
    else sessionStorage.setItem(COLLAPSED_KEY, '1');
  } catch {
    // The choice still applies until the page changes.
  }
}

/** Images are skipped once they fail to load and none has loaded, as when the site is unavailable. */
const images = { loaded: 0, failed: 0 };

/**
 * @param {string} key
 * @returns {RentalMatches | null}
 */
function cachedMatches(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  cache.delete(key);
  if (entry.expires <= Date.now()) return null;

  cache.set(key, entry);
  return entry.matches;
}

/**
 * @param {string} key
 * @param {RentalMatches} matches
 */
function rememberMatches(key, matches) {
  cache.delete(key);
  cache.set(key, { expires: Date.now() + CACHE_LIFETIME, matches });

  for (const oldest of cache.keys()) {
    if (cache.size <= CACHE_ENTRIES) break;
    cache.delete(oldest);
  }
}

/**
 * Pauses requests after repeated failures, a rate limit or a refusal. Cancelled requests aren't
 * failures and never reach this.
 * @param {RentalSearchError} error
 */
function recordFailure(error) {
  const now = Date.now();

  if (error.kind === 'rate-limited') {
    const seconds = error.retryAfter ?? RATE_LIMIT_PAUSE.fallback;
    service.pausedUntil = now + Math.min(Math.max(seconds, RATE_LIMIT_PAUSE.min), RATE_LIMIT_PAUSE.max) * 1000;
  } else if (error.kind === 'denied') {
    service.pausedUntil = now + DENIED_PAUSE;
  } else {
    service.failures += 1;
    if (service.failures >= FAILURE_LIMIT) service.pausedUntil = now + FAILURE_PAUSE;
  }
}

/**
 * @typedef {object} Refs
 * @property {HTMLElement} group
 * @property {HTMLElement} message
 * @property {HTMLUListElement} results
 * @property {HTMLUListElement} actions
 * @property {HTMLElement} status
 * @property {HTMLElement} title
 * @property {HTMLElement} toggle - Shows or hides the results; labelled by the title.
 */

/**
 * Shows rental equipment matching the search dialog's query before the native results. It follows
 * the dialog's input on its own, so it works whether native predictive search succeeds or not, and
 * never changes native results, counts or search events.
 *
 * @extends {Component<Refs>}
 */
class GammaRentalSearch extends Component {
  requiredRefs = ['group', 'message', 'results', 'actions', 'status', 'title', 'toggle'];

  /** @type {AbortController | undefined} */
  #listeners;

  /** @type {AbortController | null} */
  #request = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #timer;

  /** @type {HTMLInputElement | null} */
  #input = null;

  /** @type {URL | null} */
  #site = null;

  /** The normalized query the group currently reflects. */
  #query = '';

  /** Incremented whenever the query changes, so older requests can't render. */
  #generation = 0;

  /**
   * What the group shows: nothing, or a query's link only (switch off), loading, matches or failure.
   * @type {{ kind: 'collapsed', query: string } | { kind: 'loading', query: string } | { kind: 'error', query: string } | { kind: 'matches', query: string, matches: RentalMatches } | null}
   */
  #view = null;

  /** Whether results are shown, or only the header. */
  #expanded = true;

  connectedCallback() {
    super.connectedCallback();

    // Morph can move this element; a move disconnects and reconnects it in one task.
    if (this.#listeners) return;

    const search = this.closest('predictive-search-component');
    const input = search?.querySelector('input[name="q"]');
    this.#site = parseSite(this.dataset.site ?? '');
    if (!search || !(input instanceof HTMLInputElement) || !this.#site) return;

    this.#input = input;
    this.#listeners = new AbortController();
    const { signal } = this.#listeners;

    input.addEventListener('input', this.#handleInput, { signal });
    input.addEventListener('compositionend', this.#sync, { signal });
    input.addEventListener('keydown', this.#handleKeydown, { signal });
    // Native Clear empties the input after a short delay without an input event.
    search.addEventListener('click', this.#handleClick, { signal });
    this.closest('dialog-component')?.addEventListener(DialogCloseEvent.eventName, this.#clear, { signal });
    this.refs.toggle.addEventListener('click', this.#toggle, { signal });
    // Horizon handles the form's keys in a document capture listener, so the focused switch must claim them first.
    window.addEventListener('keydown', this.#handleToggleKeydown, { capture: true, signal });
    this.refs.title.addEventListener('click', this.#toggle, { signal });

    this.#expanded = readExpanded();
    this.#sync();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    queueMicrotask(() => {
      if (this.isConnected) return;

      this.#listeners?.abort();
      this.#listeners = undefined;
      this.#clear();
    });
  }

  /** @param {Event} event */
  #handleInput = (event) => {
    if (event instanceof InputEvent && event.isComposing) return;
    this.#sync();
  };

  /** @param {KeyboardEvent} event */
  #handleKeydown = (event) => {
    if (event.key === 'Escape') this.#clear();
  };

  /** @param {MouseEvent} event */
  #handleClick = (event) => {
    if (event.target instanceof Element && event.target.closest('.predictive-search__reset-button')) this.#clear();
  };

  /** Hides the group and cancels pending work until the query changes again. */
  #clear = () => {
    this.#generation += 1;
    this.#query = '';
    this.#cancel();
    this.#hide();
  };

  /** Brings the group in line with the input's current query. */
  #sync = () => {
    const site = this.#site;
    if (!this.#input || !site) return;

    const query = normalizeQuery(this.#input.value);
    if (query === this.#query) return;

    this.#query = query;
    const generation = (this.#generation += 1);
    this.#cancel();

    if (!isSearchableQuery(query)) {
      this.#hide();
      return;
    }

    // With the switch off, the catalogue isn't searched; the header links to the rental site instead.
    if (!this.#expanded) {
      this.#view = { kind: 'collapsed', query };
      this.#render();
      this.refs.status.textContent = '';
      return;
    }

    const key = `${site.href} ${query.toLocaleLowerCase()}`;
    const matches = cachedMatches(key);
    if (matches) {
      this.#showMatches(matches, query);
      return;
    }

    if (Date.now() < service.pausedUntil) {
      this.#showError(query);
      return;
    }

    this.#showLoading();
    this.#timer = setTimeout(() => this.#search(site, query, key, generation), DEBOUNCE_DELAY);
  };

  /**
   * @param {URL} site
   * @param {string} query
   * @param {string} key
   * @param {number} generation
   */
  async #search(site, query, key, generation) {
    const request = new AbortController();
    this.#request = request;

    try {
      const matches = await fetchRentalMatches(site, query, request.signal);
      service.failures = 0;
      rememberMatches(key, matches);
      if (this.#isCurrent(generation, query)) this.#showMatches(matches, query);
    } catch (error) {
      const failure = error instanceof RentalSearchError ? error : new RentalSearchError('invalid');
      if (failure.kind === 'aborted') return;

      recordFailure(failure);
      if (this.#isCurrent(generation, query)) this.#showError(query);
    } finally {
      if (this.#request === request) this.#request = null;
    }
  }

  /**
   * @param {number} generation
   * @param {string} query
   */
  #isCurrent(generation, query) {
    return (
      generation === this.#generation &&
      this.isConnected &&
      !!this.#input &&
      normalizeQuery(this.#input.value) === query
    );
  }

  #cancel() {
    clearTimeout(this.#timer);
    this.#request?.abort();
    this.#request = null;
  }

  #hide() {
    this.#view = null;
    this.#render();
    this.refs.status.textContent = '';
  }

  /** Replaces results for an earlier query; the group stays hidden if nothing was showing. */
  #showLoading() {
    if (!this.#view) return;

    this.#view = { kind: 'loading', query: this.#query };
    this.#render();
    this.refs.status.textContent = '';
  }

  /**
   * @param {RentalMatches} matches
   * @param {string} query
   */
  #showMatches(matches, query) {
    if (matches.results.length === 0) {
      this.#hide();
      return;
    }

    this.#view = { kind: 'matches', query, matches };
    this.#render();

    const count = Math.max(matches.total ?? 0, matches.results.length);
    const label = new Intl.PluralRules(this.dataset.locale).select(count) === 'one'
      ? this.dataset.labelCountOne
      : this.dataset.labelCountOther;
    this.#announce(fill(label, { count: String(count), terms: query }));
  }

  /** @param {string} query */
  #showError(query) {
    this.#view = { kind: 'error', query };
    this.#render();
    this.#announce(this.dataset.labelError ?? '');
  }

  #toggle = () => {
    this.#expanded = !this.#expanded;
    storeExpanded(this.#expanded);

    // Show the current query's results, or stop searching for them.
    this.#query = '';
    this.#sync();
  };

  /** @param {KeyboardEvent} event */
  #handleToggleKeydown = (event) => {
    if (event.target !== this.refs.toggle || (event.key !== 'Enter' && event.key !== ' ')) return;

    // Keep native search from also activating the highlighted item or opening the search page.
    event.preventDefault();
    event.stopPropagation();
    this.#toggle();
  };

  /** Shows the current view. With the switch off, only the header and its rental site link remain. */
  #render() {
    const { group, message, results, actions, toggle } = this.refs;
    const site = this.#site;
    const view = this.#view;
    const expanded = this.#expanded;

    toggle.setAttribute('aria-checked', String(expanded));
    group.toggleAttribute('data-collapsed', !expanded);
    group.removeAttribute('aria-busy');
    this.removeAttribute('data-results');
    message.hidden = true;
    results.hidden = true;
    actions.hidden = true;
    results.replaceChildren();
    actions.replaceChildren();

    group.hidden = !view || !site;
    if (!view || !site) return;

    if (view.kind === 'collapsed') {
      actions.append(this.#createAction(this.dataset.labelSeeResults ?? '', searchPageUrl(site, view.query)));
      actions.hidden = false;
      return;
    }

    if (view.kind === 'loading') {
      group.setAttribute('aria-busy', 'true');
      message.textContent = this.dataset.labelLoading ?? '';
      message.hidden = false;
      return;
    }

    if (view.kind === 'error') {
      actions.append(this.#createAction(fill(this.dataset.labelSearch, { terms: view.query }), searchPageUrl(site, view.query)));
      actions.hidden = false;
      message.textContent = this.dataset.labelError ?? '';
      message.hidden = false;
      return;
    }

    const { results: items, total } = view.matches;
    if (Math.max(total ?? 0, items.length) > items.length) {
      actions.append(this.#createAction(this.dataset.labelViewAll ?? '', searchPageUrl(site, view.query)));
      actions.hidden = false;
    }

    results.replaceChildren(...items.map((item) => this.#createCard(item)));
    results.hidden = false;
    this.setAttribute('data-results', '');
  }

  /** @param {string} text */
  #announce(text) {
    const { status } = this.refs;
    const generation = this.#generation;

    status.textContent = '';
    requestAnimationFrame(() => {
      if (generation === this.#generation) status.textContent = text;
    });
  }

  /**
   * Mirrors the native product result card, without price or purchase controls. The rental page
   * opens in a new tab so the store's search stays open.
   * @param {RentalResult} result
   */
  #createCard(result) {
    const item = element('li', 'predictive-search-results__card predictive-search-results__card--product');
    const card = element('div', 'resource-card');
    const link = element('a', 'resource-card__link');
    const name = element('span', 'visually-hidden');
    const media = element('div', 'resource-card__media gamma-rental-search__media');
    const content = element('div', 'resource-card__content');
    const title = element('p', 'resource-card__title paragraph');
    // Keeps the line native cards use for the price, so card heights match.
    const spacer = element('p', 'resource-card__subtext paragraph gamma-rental-search__spacer');

    link.href = result.url;
    link.target = '_blank';
    link.rel = 'noopener';
    name.textContent = fill(this.dataset.labelCard, { title: result.title });
    title.textContent = result.title;
    spacer.setAttribute('aria-hidden', 'true');

    link.append(name);
    media.append(createImage(result.image));
    content.append(title, spacer);
    card.append(link, media, content);
    item.append(card);
    return item;
  }

  /**
   * A link to the rental site's search, in the same keyboard navigation as the results. It opens
   * in a new tab, like the result cards.
   * @param {string} text
   * @param {string} url
   */
  #createAction(text, url) {
    const item = element(
      'li',
      'predictive-search-results__card predictive-search-results__card--query gamma-rental-search__action'
    );
    const link = element('a', 'pills__pill predictive-search-results__pill');

    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = text;
    item.append(link);
    return item;
  }
}

/**
 * @param {RentalImage | null} image
 * @returns {HTMLElement}
 */
function createImage(image) {
  if (!image || (images.loaded === 0 && images.failed >= IMAGE_FAILURE_LIMIT)) return createPlaceholder();

  const img = document.createElement('img');
  img.className = 'resource-card__image gamma-rental-search__image';
  img.alt = '';
  img.width = image.width;
  img.height = image.height;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('load', () => (images.loaded += 1), { once: true });
  img.addEventListener(
    'error',
    () => {
      images.failed += 1;
      img.replaceWith(createPlaceholder());
    },
    { once: true }
  );
  img.src = image.url;
  return img;
}

function createPlaceholder() {
  const placeholder = element('div', 'resource-card__image-placeholder gamma-rental-search__placeholder');
  placeholder.setAttribute('aria-hidden', 'true');
  return placeholder;
}

/**
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tag
 * @param {string} className
 * @returns {HTMLElementTagNameMap[T]}
 */
function element(tag, className) {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

/**
 * Replaces `[name]` placeholders in a translated label.
 * @param {string | undefined} label
 * @param {Record<string, string>} values
 */
function fill(label, values) {
  let text = label ?? '';
  for (const [name, value] of Object.entries(values)) text = text.split(`[${name}]`).join(value);
  return text;
}

if (!customElements.get('gamma-rental-search')) {
  customElements.define('gamma-rental-search', GammaRentalSearch);
}
