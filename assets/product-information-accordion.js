import { Component } from '@theme/component';
import { morph, MORPH_OPTIONS } from '@theme/morph';
import { StandardEvents, ProductSelectEvent } from '@shopify/events';

/**
 * @typedef {Object} InformationRefs
 * @property {HTMLElement} rows
 * @property {HTMLElement} status
 * @property {HTMLAnchorElement} recovery
 * @extends {Component<InformationRefs>}
 */
class ProductInformationAccordion extends Component {
  /** @type {Element | null} */
  #owner = null;
  #generation = 0;
  /** @type {Map<string, boolean>} */
  #open = new Map();

  connectedCallback() {
    super.connectedCallback();
    this.#owner = this.closest('product-component');
    this.#owner?.addEventListener(StandardEvents.productSelect, this.#select);
    this.addEventListener('toggle', this.#remember, true);
    if (this.hasAttribute('aria-busy')) {
      this.removeAttribute('aria-busy');
      this.refs.rows.hidden = false;
      this.refs.status.hidden = true;
      this.hidden = !this.refs.rows.querySelector('details[data-information-row]');
    }
    this.#restore();
  }

  disconnectedCallback() {
    this.#owner?.removeEventListener(StandardEvents.productSelect, this.#select);
    this.removeEventListener('toggle', this.#remember, true);
    this.#owner = null;
    this.#generation++;
    super.disconnectedCallback();
  }

  updatedCallback() {
    super.updatedCallback();
    this.#restore();
  }

  #remember = () => {
    this.#open = new Map();
    for (const row of this.querySelectorAll('details[data-information-row]')) {
      if (row instanceof HTMLDetailsElement) this.#open.set(row.dataset.informationRow ?? '', row.open);
    }
  };

  #restore() {
    for (const row of this.querySelectorAll('details[data-information-row]')) {
      if (!(row instanceof HTMLDetailsElement)) continue;
      const state = this.#open.get(row.dataset.informationRow ?? '');
      if (state !== undefined) row.open = state;
    }
    this.#remember();
  }

  /** @param {ProductSelectEvent} event */
  #select = (event) => {
    if (!(event.target instanceof Element) || event.target.closest('product-card')) return;
    if (event.target.closest('product-component') !== this.#owner) return;
    const generation = ++this.#generation;
    this.#remember();
    const focused = document.activeElement;
    const hadFocus = focused instanceof Element && this.refs.rows.contains(focused);
    const focusRow = hadFocus ? focused.closest('details[data-information-row]') : null;
    const focusKey = focusRow instanceof HTMLElement ? focusRow.dataset.informationRow : undefined;
    this.hidden = false;
    this.setAttribute('aria-busy', 'true');
    this.refs.rows.hidden = true;
    this.refs.recovery.hidden = true;
    this.refs.status.textContent = this.refs.status.dataset.loading ?? '';
    this.refs.status.hidden = false;

    event.promise.then(({ detail }) => {
      if (generation !== this.#generation || !this.isConnected) return;
      if (!detail) throw new Error('Missing product information response');
      const source = Array.from(detail?.html?.querySelectorAll('product-information-accordion') ?? []).find(
        (node) => node instanceof HTMLElement && node.dataset.blockId === this.dataset.blockId &&
          node.dataset.sectionId === this.dataset.sectionId
      );
      if (!(source instanceof HTMLElement)) throw new Error('Missing product information response');
      const expectedProduct = detail.newProduct?.id ?? detail.productId;
      if (expectedProduct && source.dataset.productId !== String(expectedProduct)) {
        throw new Error('Product information response does not match its owner');
      }
      const rows = source.querySelector('[ref="rows"]');
      if (!rows) throw new Error('Missing product information rows');
      const nextRows = rows.cloneNode(true);
      for (const row of /** @type {Element} */ (nextRows).querySelectorAll('details[data-information-row]')) {
        if (!(row instanceof HTMLDetailsElement)) continue;
        const state = this.#open.get(row.dataset.informationRow ?? '');
        if (state !== undefined) {
          row.open = state;
          row.parentElement?.toggleAttribute('open-by-default-on-desktop', state);
          row.parentElement?.toggleAttribute('open-by-default-on-mobile', state);
        }
      }
      morph(this.refs.rows, nextRows, { ...MORPH_OPTIONS, getNodeKey: (node) =>
        node instanceof Element ? node.querySelector('details[data-information-row]')?.getAttribute('data-information-row') ?? undefined : undefined });
      this.dataset.productId = source.dataset.productId;
      this.refs.rows.hidden = false;
      this.removeAttribute('aria-busy');
      this.#restore();
      this.refs.status.hidden = !detail.selectionRestored;
      this.refs.status.textContent = detail.selectionRestored ? this.refs.status.dataset.restored ?? '' : '';
      this.hidden = source.hidden && !detail.selectionRestored;
      if (hadFocus && (document.activeElement === document.body || document.activeElement === focused)) {
        const candidates = Array.from(this.querySelectorAll('details[data-information-row]'));
        const same = candidates.find((node) => node.getAttribute('data-information-row') === focusKey);
        const target = focused instanceof HTMLElement && focused.isConnected && same?.contains(focused)
          ? focused : (same ?? candidates[0])?.querySelector('summary') ??
            this.#owner?.querySelector('variant-picker input:checked, variant-picker select');
        /** @type {HTMLElement | undefined} */ (target)?.focus({ preventScroll: true });
      }
    }).catch((error) => {
      if (generation !== this.#generation || !this.isConnected) return;
      this.removeAttribute('aria-busy');
      if (error?.name === 'AbortError') {
        this.refs.rows.hidden = false;
        this.refs.status.hidden = true;
        this.hidden = !this.refs.rows.querySelector('details[data-information-row]');
        return;
      }
      this.refs.status.textContent = this.refs.status.dataset.error ?? '';
      this.refs.recovery.hidden = false;
      if (hadFocus && document.activeElement === document.body) this.refs.recovery.focus({ preventScroll: true });
    });
  };
}

if (!customElements.get('product-information-accordion')) {
  customElements.define('product-information-accordion', ProductInformationAccordion);
}
