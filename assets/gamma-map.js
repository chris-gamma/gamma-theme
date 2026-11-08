import { Component } from '@theme/component';

/**
 * Interactive uMap maps for the Map block (blocks/gamma-map.liquid).
 *
 * Each map starts as server-rendered static content. The interactive map loads only when:
 * - the visitor turns maps on by clicking the static map, or “Show interactive map” when there's
 *   no image (remembered on this device), or
 * - the visitor hasn't made a map choice and Shopify's Customer Privacy API reports preferences
 *   permission.
 * Turning maps off is also remembered and overrides the Shopify permission. Either choice applies
 * to every map. Withdrawing the Shopify permission turns off maps that loaded because of it.
 * Automatic loading waits until a map is near the viewport and never happens in the theme editor.
 */

/** The approved uMap service. Map IDs come from block settings. */
const ORIGIN = 'https://umap.openstreetmap.fr';

/** A uMap map ID: the map's slug, an underscore and its number, as at the end of its address. */
const MAP_ID = /^[a-z0-9_-]{1,200}_\d{1,12}$/i;

const LANGUAGES = ['en', 'fr'];

/**
 * Embedded interface: zoom and full screen only, without editing, search, geolocation, printing,
 * side panels or scroll-wheel zoom. uMap shows its “More controls” button whenever a control is
 * left at its default, so every optional control is set.
 */
const MAP_OPTIONS = {
  scaleControl: 'false',
  miniMapControl: 'false',
  scrollWheelZoom: 'false',
  zoomControl: 'true',
  fullscreenControl: 'true',
  editMode: 'disabled',
  printControl: 'false',
  searchControl: 'false',
  tilelayersControl: 'false',
  embedControl: 'false',
  datalayersControl: 'false',
  locateControl: 'false',
  measureControl: 'false',
  homeControl: 'false',
  captionControl: 'false',
  captionBar: 'false',
  captionMenus: 'false',
  onLoadPanel: 'none',
};

/** How long a map may take to load before the attempt fails. */
const LOAD_TIMEOUT = 20000;

/** The visitor's map choice: 'on' or 'off'. Absent until they use a map control. */
const CHOICE_KEY = 'gamma-map:choice';

/**
 * @typedef {'static' | 'loading' | 'loaded' | 'failed'} MapState
 * @typedef {'on' | 'off' | null} MapChoice
 * @typedef {{ preferencesProcessingAllowed?: () => boolean }} CustomerPrivacy
 */

/**
 * Builds the embed address for a map, or returns null when the ID or language isn't valid.
 * @param {string} id
 * @param {string} language
 * @returns {string | null}
 */
function buildMapUrl(id, language) {
  if (!MAP_ID.test(id) || !LANGUAGES.includes(language)) return null;

  const path = `/${language}/map/${id}`;
  const url = new URL(path, ORIGIN);
  if (url.origin !== ORIGIN || url.pathname !== path) return null;

  for (const [key, value] of Object.entries(MAP_OPTIONS)) url.searchParams.set(key, value);
  return url.href;
}

/** @returns {MapChoice} */
function readChoice() {
  try {
    const choice = localStorage.getItem(CHOICE_KEY);
    return choice === 'on' || choice === 'off' ? choice : null;
  } catch {
    return null;
  }
}

/** @param {'on' | 'off'} choice */
function storeChoice(choice) {
  try {
    localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // The choice still applies to the maps on this page.
  }
}

/** True in the theme editor and its previews, where maps never load or remember on their own. */
function isEditing() {
  return Boolean(window.Shopify?.designMode || window.Shopify?.visualPreviewMode);
}

/** @returns {CustomerPrivacy | undefined} */
function getPrivacyApi() {
  return /** @type {{ customerPrivacy?: CustomerPrivacy } | undefined} */ (/** @type {unknown} */ (window.Shopify))
    ?.customerPrivacy;
}

/** @param {CustomerPrivacy | null | undefined} api */
function readPreferences(api) {
  try {
    return api?.preferencesProcessingAllowed?.() === true;
  } catch {
    return false;
  }
}

/** @type {Promise<CustomerPrivacy | null> | null} */
let privacyApi = null;

/**
 * Loads Shopify's Customer Privacy API once. A missing or failed API counts as no permission.
 * @returns {Promise<CustomerPrivacy | null>}
 */
function loadPrivacyApi() {
  privacyApi ??= new Promise((resolve) => {
    const api = getPrivacyApi();
    if (api) return resolve(api);

    try {
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.2' }], (error) => {
        resolve(error ? null : getPrivacyApi() ?? null);
      });
    } catch {
      resolve(null);
    }
  });
  return privacyApi;
}

/** The last preferences permission Shopify reported on this page. */
let preferencesAllowed = false;

/** True once a consent change has been reported; its value is newer than an earlier read. */
let consentReported = false;

/** Whether maps may load without a click right now. */
async function automaticAllowed() {
  if (isEditing()) return false;

  const choice = readChoice();
  if (choice) return choice === 'on';

  const api = await loadPrivacyApi();
  if (!consentReported) preferencesAllowed = readPreferences(api);
  return preferencesAllowed && readChoice() === null;
}

/** @type {Set<GammaMapComponent>} */
const maps = new Set();

/** @type {IntersectionObserver | null} */
let observer = null;

/**
 * Loads a map automatically once it nears the viewport, if allowed by then.
 * @param {GammaMapComponent} map
 */
function watch(map) {
  if (isEditing() || readChoice() === 'off') return;

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof GammaMapComponent)) continue;
        observer?.unobserve(entry.target);
        entry.target.loadAutomatically();
      }
    },
    { rootMargin: '200px 0px' }
  );
  observer.observe(map);
}

/**
 * Brings every map on the page in line with the stored choice and Shopify permission.
 * @param {boolean} [reread] - Read the permission from the API again rather than the last report.
 */
function sync(reread = true) {
  if (isEditing()) return;

  const choice = readChoice();
  if (choice === null && reread) preferencesAllowed = readPreferences(getPrivacyApi());

  for (const map of maps) {
    if (choice === 'off' || (choice === null && !preferencesAllowed)) map.turnOff();
    else map.watchIfStatic();
  }
}

// One set of page-level listeners for every map.
document.addEventListener('visitorConsentCollected', (event) => {
  const detail = /** @type {CustomEvent<{ preferencesAllowed?: boolean }>} */ (event).detail;
  preferencesAllowed = detail?.preferencesAllowed === true;
  consentReported = true;
  if (readChoice() === null) sync(false);
});

// Restored from the back/forward cache: the choice may have changed on another page.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) sync();
});

// The choice changed in another tab.
window.addEventListener('storage', (event) => {
  if (event.key === CHOICE_KEY || event.key === null) sync();
});

/**
 * A location map that can load the interactive uMap map.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} media - The map box holding the static image and the frame.
 * @property {HTMLTemplateElement} frameTemplate - The inert iframe, without a src.
 * @property {HTMLElement} controls - Status and Try again; CSS shows them only when scripting is on.
 * @property {HTMLButtonElement} showButton - The static image, or a text button without one.
 * @property {HTMLButtonElement} retryButton
 * @property {HTMLButtonElement} hideButton - The off button in the map's corner.
 * @property {HTMLElement} status - The polite status region.
 * @property {HTMLElement} [invalidNote] - The theme-editor note for an invalid map ID.
 *
 * @extends {Component<Refs>}
 */
class GammaMapComponent extends Component {
  requiredRefs = ['media', 'frameTemplate', 'controls', 'showButton', 'retryButton', 'hideButton', 'status'];

  /** @type {string | null} */
  #url = null;

  /** @type {MapState} */
  #state = 'static';

  /** The current loading attempt; aborting it removes its listeners and timer. */
  /** @type {AbortController | null} */
  #attempt = null;

  /** Whether the visitor started the current attempt, rather than a remembered choice or permission. */
  #explicit = false;

  /** @type {HTMLIFrameElement | null} */
  #frame = null;

  /** Waits for focus to leave the map box before an automatic load. */
  /** @type {AbortController | null} */
  #focusWait = null;

  connectedCallback() {
    super.connectedCallback();

    this.#url = buildMapUrl(this.dataset.mapId ?? '', this.dataset.mapLang ?? '');
    if (!this.#url) {
      this.refs.controls.hidden = true;
      this.refs.showButton.hidden = true;
      this.refs.invalidNote?.removeAttribute('hidden');
      return;
    }

    maps.add(this);
    this.#render();
    watch(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    maps.delete(this);
    observer?.unobserve(this);
    this.#stopWaiting();
    this.#cancel();
  }

  /** Turns maps on for this visitor and loads this one now. */
  show = () => {
    if (isEditing()) {
      this.#load(true);
      return;
    }

    storeChoice('on');
    this.#load(true);
    for (const map of maps) if (map !== this) map.watchIfStatic();
  };

  /** Turns every map off and remembers the choice. */
  hide = () => {
    if (!isEditing()) storeChoice('off');
    for (const map of maps) map.turnOff(map === this);
  };

  retry = () => {
    this.#load(true);
  };

  /** Called when the map nears the viewport. */
  async loadAutomatically() {
    if (this.#state !== 'static' || !(await automaticAllowed())) return;
    if (!this.isConnected || this.#state !== 'static') return;

    // Loading would hide the image button or credit the visitor is on, so wait until they move on.
    if (this.refs.media.contains(document.activeElement)) {
      this.#waitForFocusToLeave();
      return;
    }
    this.#load(false);
  }

  #waitForFocusToLeave() {
    if (this.#focusWait) return;

    const wait = new AbortController();
    this.#focusWait = wait;
    this.refs.media.addEventListener(
      'focusout',
      () => {
        // Check once focus has moved; it stays on the button while the window is in the background.
        requestAnimationFrame(() => {
          if (wait.signal.aborted || this.refs.media.contains(document.activeElement)) return;
          this.#stopWaiting();
          this.loadAutomatically();
        });
      },
      { signal: wait.signal }
    );
  }

  #stopWaiting() {
    this.#focusWait?.abort();
    this.#focusWait = null;
  }

  /** Watches a static map so it can load automatically. */
  watchIfStatic() {
    if (this.#url && this.#state === 'static') watch(this);
  }

  /**
   * Returns to the static map.
   * @param {boolean} [announce] - Whether to announce it; only for the map the visitor used.
   */
  turnOff(announce = false) {
    observer?.unobserve(this);
    this.#stopWaiting();
    if (this.#state === 'static') return;

    this.#transition(
      () => {
        this.#cancel();
        this.#state = 'static';
      },
      announce ? 'off' : null,
      announce
    );
  }

  /**
   * Starts a loading attempt.
   * @param {boolean} announce - Announce progress and move focus as needed; the visitor asked for this map.
   */
  #load(announce) {
    if (!this.#url || this.#state === 'loading' || this.#state === 'loaded') return;

    const template = this.refs.frameTemplate.content.firstElementChild;
    if (!(template instanceof HTMLIFrameElement)) return;

    observer?.unobserve(this);
    this.#stopWaiting();
    const attempt = new AbortController();
    const { signal } = attempt;

    this.#transition(
      () => {
        this.#cancel();
        this.#attempt = attempt;
        this.#explicit = announce;
        this.#state = 'loading';
      },
      announce ? 'loading' : null,
      announce
    );

    if (navigator.onLine === false) {
      this.#fail(attempt);
      return;
    }

    const frame = /** @type {HTMLIFrameElement} */ (template.cloneNode(true));
    frame.addEventListener('load', () => this.#loaded(attempt, announce), { signal, once: true });
    window.addEventListener('offline', () => this.#fail(attempt), { signal });
    const timer = setTimeout(() => this.#fail(attempt), LOAD_TIMEOUT);
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });

    frame.src = this.#url;
    this.#frame = frame;
    this.refs.media.append(frame);
  }

  /**
   * @param {AbortController} attempt
   * @param {boolean} announce
   */
  #loaded(attempt, announce) {
    if (attempt !== this.#attempt) return;

    // Loading is over; the frame stays, so only the timer and offline listener go.
    attempt.abort();
    this.#transition(
      () => {
        this.#state = 'loaded';
      },
      announce ? 'loaded' : null,
      announce
    );
  }

  /** @param {AbortController} attempt */
  #fail(attempt) {
    if (attempt !== this.#attempt) return;

    this.#transition(
      () => {
        this.#cancel();
        this.#state = 'failed';
      },
      'failed',
      this.#explicit
    );
  }

  /** Stops the current attempt and removes the frame. */
  #cancel() {
    this.#attempt?.abort();
    this.#attempt = null;
    this.#frame?.remove();
    this.#frame = null;
  }

  /**
   * Applies a state change. Focus moves only when the focused control in this map disappears,
   * and Try again receives it only after an attempt the visitor started.
   * @param {() => void} change
   * @param {'loading' | 'loaded' | 'failed' | 'off' | null} message
   * @param {boolean} explicit - The visitor caused this change.
   */
  #transition(change, message, explicit) {
    const focused = document.activeElement;
    const hadFocus = focused instanceof HTMLElement && this.contains(focused);

    change();
    this.#render(message);

    if (hadFocus && (!focused.isConnected || focused.getClientRects().length === 0)) {
      const { showButton, retryButton, hideButton } = this.refs;
      const failed = explicit ? retryButton : showButton;
      const next = { static: showButton, loading: hideButton, loaded: hideButton, failed }[this.#state];
      next.focus();
    }
  }

  /** @param {'loading' | 'loaded' | 'failed' | 'off' | null} [message] */
  #render(message = null) {
    const { media, showButton, retryButton, hideButton, status } = this.refs;
    const state = this.#state;
    const active = state === 'loading' || state === 'loaded';

    this.dataset.state = state;
    // After a failure, the image or text button retries too.
    showButton.hidden = state !== 'static' && state !== 'failed';
    retryButton.hidden = state !== 'failed';
    hideButton.hidden = !active;
    media.setAttribute('aria-busy', String(state === 'loading'));

    status.textContent = message ? status.dataset[message] ?? '' : '';
    status.classList.toggle('visually-hidden', message !== 'failed');
  }
}

if (!customElements.get('gamma-map-component')) {
  customElements.define('gamma-map-component', GammaMapComponent);
}
