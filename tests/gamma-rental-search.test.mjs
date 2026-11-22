import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import {
  MAX_QUERY_LENGTH,
  MAX_RESPONSE_BYTES,
  MIN_QUERY_LENGTH,
  REQUEST_TIMEOUT,
  RESULT_LIMIT,
  RentalSearchError,
  catalogRequestUrl,
  decodeTitle,
  fetchRentalMatches,
  isSearchableQuery,
  normalizeQuery,
  normalizeResults,
  parseSite,
  searchPageUrl,
  selectImage,
  validateDestination,
} from '../assets/gamma-rental-search.js';

// Node has no DOMParser. This one only strips tags, so entity decoding, which the browser does,
// isn't covered here.
globalThis.DOMParser ??= class {
  /** @param {string} html */
  parseFromString(html) {
    return { body: { textContent: html.replace(/<[^>]*>/g, '') } };
  }
};

const site = new URL('https://rental.example/fr/');

/** @param {string} path */
const page = (path) => new URL(path, site.origin).href;

/** @param {Record<string, unknown>} sizes */
const withSizes = (sizes) => ({ _embedded: { 'wp:featuredmedia': [{ media_details: { sizes } }] } });

/**
 * @param {string} link
 * @param {string} [title]
 */
const item = (link, title = 'Scie à chaîne') => ({ link, title: { rendered: title } });

/**
 * @param {unknown} error
 * @param {string} kind
 */
const isKind = (error, kind) => error instanceof RentalSearchError && error.kind === kind;

describe('parseSite', () => {
  it('accepts an https folder address', () => {
    assert.equal(parseSite('https://rental.example/fr/')?.href, 'https://rental.example/fr/');
    assert.equal(parseSite('https://rental.example/')?.href, 'https://rental.example/');
  });

  it('rejects anything else', () => {
    for (const value of [
      '',
      'rental.example/',
      'http://rental.example/',
      'https://rental.example/fr',
      'https://user:secret@rental.example/',
      'https://rental.example/?lang=fr',
      'https://rental.example/?',
      'https://rental.example/#top',
      'https://rental.example/#',
      ' https://rental.example/',
      'https://rental.example/en fr/',
    ]) {
      assert.equal(parseSite(value), null, value);
    }
  });
});

describe('normalizeQuery', () => {
  it('collapses whitespace and control characters', () => {
    assert.equal(normalizeQuery('  scie\t à\n\nchaîne  '), 'scie à chaîne');
    assert.equal(normalizeQuery('scie\u0000\u0007chaîne\u0085'), 'scie chaîne');
  });

  it('composes accents so equivalent queries match', () => {
    assert.equal(normalizeQuery('élagueuse'), 'élagueuse');
  });
});

describe('isSearchableQuery', () => {
  it('counts characters, not UTF-16 units', () => {
    assert.equal(isSearchableQuery('a'.repeat(MIN_QUERY_LENGTH - 1)), false);
    assert.equal(isSearchableQuery('a'.repeat(MIN_QUERY_LENGTH)), true);
    assert.equal(isSearchableQuery('a'.repeat(MAX_QUERY_LENGTH)), true);
    assert.equal(isSearchableQuery('a'.repeat(MAX_QUERY_LENGTH + 1)), false);
    assert.equal(isSearchableQuery('🔧'.repeat(MAX_QUERY_LENGTH)), true);
    assert.equal(isSearchableQuery('🔧'), false);
  });
});

describe('catalogRequestUrl', () => {
  it('requests the products endpoint under the site folder', () => {
    const url = catalogRequestUrl(site, 'scie & co');

    assert.equal(url.origin + url.pathname, 'https://rental.example/fr/wp-json/wp/v2/products');
    assert.equal(url.searchParams.get('search'), 'scie & co');
    assert.equal(url.searchParams.get('per_page'), String(RESULT_LIMIT));
    assert.equal(url.searchParams.get('context'), 'embed');
    assert.equal(url.searchParams.get('_embed'), 'wp:featuredmedia');
    assert.equal(url.searchParams.get('_fields'), 'title.rendered,link,_links.wp:featuredmedia,_embedded');
  });
});

describe('searchPageUrl', () => {
  it("opens the site's own product search", () => {
    const url = new URL(searchPageUrl(site, 'scie à chaîne'));

    assert.equal(url.origin + url.pathname, 'https://rental.example/fr/');
    assert.equal(url.searchParams.get('post_type'), 'gamma_product');
    assert.equal(url.searchParams.get('s'), 'scie à chaîne');
  });
});

describe('validateDestination', () => {
  it('keeps pages on the site and language path', () => {
    assert.equal(validateDestination(page('/fr/equipement/scie/'), site), page('/fr/equipement/scie/'));
  });

  it('rejects other sites, schemes, languages and malformed values', () => {
    for (const value of [
      page('/en/equipment/saw/'),
      page('/french/'),
      'https://rental.example/fr/../en/equipment/',
      'https://other.example/fr/equipement/',
      'https://rental.example:8443/fr/equipement/',
      'http://rental.example/fr/equipement/',
      'https://user:secret@rental.example/fr/equipement/',
      'javascript:alert(1)',
      '/fr/equipement/',
      page(`/fr/${'a'.repeat(2048)}`),
      '',
      null,
      42,
    ]) {
      assert.equal(validateDestination(value, site), null, String(value));
    }
  });
});

describe('selectImage', () => {
  it('takes the first usable size in order, skipping the square thumbnail', () => {
    const image = selectImage(
      withSizes({
        thumbnail: { source_url: page('/thumb.jpg'), width: 150, height: 150 },
        medium_large: { source_url: page('/medium-large.jpg'), width: 768, height: 512 },
        large: { source_url: page('/large.jpg'), width: 1024, height: 683 },
      }),
      site
    );

    assert.deepEqual(image, { url: page('/medium-large.jpg'), width: 768, height: 512 });
  });

  it('skips images on other sites and invalid dimensions', () => {
    const image = selectImage(
      withSizes({
        medium: { source_url: 'https://cdn.example/medium.jpg', width: 300, height: 200 },
        medium_large: { source_url: page('/a.jpg'), width: 0, height: 512 },
        large: { source_url: page('/b.jpg'), width: 4001, height: 683 },
        full: { source_url: page('/c.jpg'), width: '1200', height: 800 },
      }),
      site
    );

    assert.equal(image, null);
  });

  it('returns null without featured media', () => {
    assert.equal(selectImage({}, site), null);
    assert.equal(selectImage({ _embedded: { 'wp:featuredmedia': [] } }, site), null);
  });
});

describe('decodeTitle', () => {
  it('returns plain text with whitespace collapsed', () => {
    assert.equal(decodeTitle(' Scie <b>à</b>\n chaîne '), 'Scie à chaîne');
  });

  it('shortens long titles with an ellipsis', () => {
    const title = decodeTitle('a'.repeat(250));

    assert.equal([...title].length, 200);
    assert.ok(title.endsWith('…'));
  });

  it('ignores missing and oversized values', () => {
    assert.equal(decodeTitle(undefined), '');
    assert.equal(decodeTitle(''), '');
    assert.equal(decodeTitle('a'.repeat(2001)), '');
  });
});

describe('normalizeResults', () => {
  it('keeps distinct valid results up to the limit', () => {
    const data = [
      item(page('/fr/a/')),
      item(page('/fr/a/'), 'Duplicate'),
      item('https://other.example/fr/b/'),
      item(page('/fr/c/'), ''),
      'not an item',
      ...Array.from({ length: RESULT_LIMIT + 2 }, (_, index) => item(page(`/fr/d${index}/`))),
    ];

    const results = normalizeResults(data, site);

    assert.equal(results.length, RESULT_LIMIT);
    assert.deepEqual(
      results.map((result) => result.url),
      [page('/fr/a/'), page('/fr/d0/'), page('/fr/d1/'), page('/fr/d2/')]
    );
    assert.deepEqual(results[0], { title: 'Scie à chaîne', url: page('/fr/a/'), image: null });
  });

  it('accepts an empty response', () => {
    assert.deepEqual(normalizeResults([], site), []);
  });

  it('rejects a response that no longer matches the contract', () => {
    assert.throws(() => normalizeResults({}, site), (error) => isKind(error, 'invalid'));
    assert.throws(
      () => normalizeResults([item('https://other.example/fr/a/')], site),
      (error) => isKind(error, 'invalid')
    );
  });

  it('only looks at the first items of a long response', () => {
    const data = [...Array.from({ length: RESULT_LIMIT * 5 }, () => ({})), item(page('/fr/late/'))];

    assert.throws(() => normalizeResults(data, site), (error) => isKind(error, 'invalid'));
  });
});

describe('fetchRentalMatches', () => {
  afterEach(() => {
    mock.restoreAll();
    mock.timers.reset();
  });

  /**
   * @param {BodyInit | null} body
   * @param {ResponseInit} [init]
   */
  const respond = (body, init) => mock.method(globalThis, 'fetch', async () => new Response(body, init));

  const search = (signal = new AbortController().signal) => fetchRentalMatches(site, 'scie', signal);

  it('returns results and the reported total', async () => {
    const fetch = respond(JSON.stringify([item(page('/fr/a/'))]), { headers: { 'X-WP-Total': '12' } });

    const matches = await search();

    assert.deepEqual(matches, { results: [{ title: 'Scie à chaîne', url: page('/fr/a/'), image: null }], total: 12 });

    const [url, options] = fetch.mock.calls[0].arguments;
    assert.equal(String(url), String(catalogRequestUrl(site, 'scie')));
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer');
  });

  it('ignores a malformed total', async () => {
    respond('[]', { headers: { 'X-WP-Total': '12 items' } });

    assert.equal((await search()).total, null);
  });

  it('reports rate limits with the requested delay', async () => {
    respond(null, { status: 429, headers: { 'Retry-After': '120' } });
    await assert.rejects(search(), (error) => isKind(error, 'rate-limited') && error.retryAfter === 120);

    respond(null, { status: 429, headers: { 'Retry-After': new Date(Date.now() + 60_000).toUTCString() } });
    await assert.rejects(
      search(),
      (error) => isKind(error, 'rate-limited') && error.retryAfter >= 58 && error.retryAfter <= 60
    );

    respond(null, { status: 429, headers: { 'Retry-After': 'soon' } });
    await assert.rejects(search(), (error) => isKind(error, 'rate-limited') && error.retryAfter === null);
  });

  it('separates refusals from other HTTP errors', async () => {
    for (const status of [401, 403]) {
      respond(null, { status });
      await assert.rejects(search(), (error) => isKind(error, 'denied') && error.status === status);
    }

    respond(null, { status: 503 });
    await assert.rejects(search(), (error) => isKind(error, 'http') && error.status === 503);
  });

  it('rejects invalid JSON and oversized responses', async () => {
    respond('<html>');
    await assert.rejects(search(), (error) => isKind(error, 'invalid'));

    respond('[]', { headers: { 'Content-Length': String(MAX_RESPONSE_BYTES + 1) } });
    await assert.rejects(search(), (error) => isKind(error, 'invalid'));

    const chunk = new TextEncoder().encode(' '.repeat(64 * 1024));
    const stream = new ReadableStream({
      pull(controller) {
        controller.enqueue(chunk);
      },
    });
    respond(stream);
    await assert.rejects(search(), (error) => isKind(error, 'invalid'));
  });

  it('reports network failures', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('Failed to fetch');
    });

    await assert.rejects(search(), (error) => isKind(error, 'network'));
  });

  it("doesn't request when already cancelled", async () => {
    const fetch = respond('[]');
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(search(controller.signal), (error) => isKind(error, 'aborted'));
    assert.equal(fetch.mock.callCount(), 0);
  });

  /** A fetch that only settles when its request is aborted. */
  const hang = () =>
    mock.method(
      globalThis,
      'fetch',
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        })
    );

  it('separates cancellation from timeouts', async () => {
    hang();
    const controller = new AbortController();
    const request = search(controller.signal);
    controller.abort();
    await assert.rejects(request, (error) => isKind(error, 'aborted'));

    mock.timers.enable({ apis: ['setTimeout'] });
    hang();
    const timed = search();
    mock.timers.tick(REQUEST_TIMEOUT);
    await assert.rejects(timed, (error) => isKind(error, 'timeout'));
  });
});
