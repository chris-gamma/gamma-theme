/**
 * Splits a promotions index group into pages of cards.
 *
 * The server renders every eligible campaign, already sorted, so without JavaScript the whole list is
 * visible and every campaign stays reachable. This element shows one page at a time with numbered
 * page buttons, keeps the page in the URL hash (`#{group id}-page-{n}`) for links and the back
 * button, and recounts when cards expire on a loaded page (`gamma:hide-at`).
 */
class GammaPromotionPager extends HTMLElement {
  /** @type {number} */
  #page = 1;
  /** @type {HTMLElement | null} */
  #nav = null;

  connectedCallback() {
    this.#page = this.#pageFromHash() ?? 1;
    this.#render(false);
    window.addEventListener('hashchange', this.#onHashChange);
    document.addEventListener('gamma:hide-at', this.#onExpire);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.#onHashChange);
    document.removeEventListener('gamma:hide-at', this.#onExpire);
  }

  #onHashChange = () => {
    const page = this.#pageFromHash();
    if (page !== null && page !== this.#page) {
      this.#page = page;
      this.#render(false);
    }
  };

  #onExpire = () => this.#render(false);

  /** @returns {number | null} */
  #pageFromHash() {
    const prefix = `#${this.id}-page-`;
    if (!window.location.hash.startsWith(prefix)) return null;
    const page = Number(window.location.hash.slice(prefix.length));
    return Number.isInteger(page) && page > 0 ? page : null;
  }

  get #size() {
    const size = Number(this.dataset.pageSize);
    return Number.isInteger(size) && size > 0 ? size : 24;
  }

  /**
   * Shows the current page and rebuilds the page buttons.
   * @param {boolean} focus - Move focus to the first card of the page (after a page button is used).
   */
  #render(focus) {
    /** @type {HTMLElement[]} */
    const items = [...this.querySelectorAll(':scope > ul > li')].filter((item) => item instanceof HTMLElement);
    // Cards past their end stay hidden on every page.
    const now = Date.now() / 1000;
    const visible = items.filter((item) => !(Number(item.dataset.gammaHideAt) > 0 && Number(item.dataset.gammaHideAt) <= now));
    const pages = Math.max(1, Math.ceil(visible.length / this.#size));
    this.#page = Math.min(Math.max(1, this.#page), pages);

    const first = (this.#page - 1) * this.#size;
    for (const item of items) {
      const index = visible.indexOf(item);
      item.hidden = index < first || index >= first + this.#size;
    }

    this.#nav?.remove();
    this.#nav = null;
    if (pages > 1) this.#nav = this.#buildNav(pages);

    if (focus) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      const link = visible[first]?.querySelector('a');
      if (link instanceof HTMLElement) link.focus({ preventScroll: true });
    }
  }

  /**
   * @param {number} pages
   * @returns {HTMLElement}
   */
  #buildNav(pages) {
    const nav = document.createElement('nav');
    nav.className = 'gamma-promotion-pager__nav';
    nav.setAttribute('aria-label', this.dataset.label ?? '');
    const list = document.createElement('ul');
    list.className = 'gamma-promotion-pager__list';
    list.setAttribute('role', 'list');

    const add = (/** @type {string} */ text, /** @type {number} */ page, /** @type {string} */ label) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gamma-promotion-pager__button';
      button.textContent = text;
      button.setAttribute('aria-label', label);
      if (page === this.#page && text === String(page)) button.setAttribute('aria-current', 'page');
      button.disabled = page < 1 || page > pages;
      button.addEventListener('click', () => this.#go(page));
      item.append(button);
      list.append(item);
    };

    const pageLabel = (/** @type {number} */ page) => (this.dataset.pageLabel ?? '__n__').replace('__n__', String(page));
    add('‹', this.#page - 1, this.dataset.previous ?? '');
    for (let page = 1; page <= pages; page += 1) add(String(page), page, pageLabel(page));
    add('›', this.#page + 1, this.dataset.next ?? '');

    nav.append(list);
    this.append(nav);
    return nav;
  }

  /** @param {number} page */
  #go(page) {
    this.#page = page;
    window.history.replaceState(null, '', `#${this.id}-page-${page}`);
    this.#render(true);
  }
}

if (!customElements.get('gamma-promotion-pager')) customElements.define('gamma-promotion-pager', GammaPromotionPager);
