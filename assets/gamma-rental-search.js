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
