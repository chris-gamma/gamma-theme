import { Component } from '@theme/component';
import { morph, MORPH_OPTIONS } from '@theme/morph';
import { StandardEvents, ProductSelectEvent } from '@shopify/events';
import { prefersReducedMotion } from '@theme/utilities';

/**
 * @typedef {Object} AvailabilityRefs
 * @property {HTMLElement} panel
 * @property {HTMLElement} announcement
 * @extends {Component<AvailabilityRefs>}
 */
class GammaAvailabilityNotice extends Component {
  /** @type {Element | null} */
  #owner = null;
  #generation = 0;
  /** @type {Animation | null} */
  #resize = null;

  connectedCallback() {
    super.connectedCallback();
    this.#owner = this.#ownerOf(this);
    this.#owner?.addEventListener(StandardEvents.productSelect, this.#select);
  }

  disconnectedCallback() {
    this.#owner?.removeEventListener(StandardEvents.productSelect, this.#select);
    this.#owner = null;
    this.#generation++;
    this.#resize?.cancel();
    this.style.height = '';
    super.disconnectedCallback();
  }

  /** @param {Element} element */
  #ownerOf(element) {
    return element.closest('product-card') ?? element.closest('product-component') ?? element.closest('.shopify-section, dialog');
  }

  /** @param {ProductSelectEvent} event */
  #select = (event) => {
    if (!(event.target instanceof Element) || this.#ownerOf(event.target) !== this.#owner) return;
    const generation = ++this.#generation;
    const { panel, announcement } = this.refs;
    const wasHidden = panel.hidden;
    // Never leave the previous option's claim visible while the new selection loads. Its space is held
    // until the result arrives, so the controls below move once, to the new height.
    this.#hold();
    panel.hidden = true;
    announcement.textContent = '';

    event.promise
      .then(({ detail }) => {
        if (generation !== this.#generation || !this.isConnected) return;
        this.#update(detail);
        this.#release();
      })
      .catch((error) => {
        if (generation !== this.#generation || !this.isConnected) return;
        // An aborted request keeps the last confirmed selection; failures stay cleared.
        if (error?.name === 'AbortError') panel.hidden = wasHidden;
        this.#release();
      });
  };

  /** @param {Awaited<ProductSelectEvent['promise']>['detail']} detail */
  #update(detail) {
    const { panel, announcement } = this.refs;
    const resource = detail?.resource;
    if (!detail || !resource) return;
    const expectedProduct = String(detail.newProduct?.id ?? detail.productId ?? '');
    const source = Array.from(detail.html?.querySelectorAll('gamma-availability-notice') ?? []).find(
      (node) =>
        node instanceof HTMLElement &&
        node.dataset.sectionId === this.dataset.sectionId &&
        node.dataset.blockId === this.dataset.blockId
    );
    if (!(source instanceof HTMLElement)) return;
    if (expectedProduct && source.dataset.productId !== expectedProduct) return;
    if (source.dataset.variantId !== String(resource.id)) return;
    const nextPanel = source.querySelector('[ref="panel"]');
    if (!nextPanel) return;

    const changed = source.dataset.status !== this.dataset.status;
    morph(panel, nextPanel, { ...MORPH_OPTIONS, childrenOnly: false });
    this.dataset.productId = source.dataset.productId;
    this.dataset.variantId = source.dataset.variantId;
    this.dataset.status = source.dataset.status;
    if (changed && !panel.hidden && !detail.selectionRestored) {
      announcement.textContent = panel.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    }
  }

  #hold() {
    // Measured before cancelling, so a change during the ease holds where the notice is now.
    const height = this.getBoundingClientRect().height;
    this.#resize?.cancel();
    this.style.height = `${height}px`;
  }

  /** Eases from the held height to the new one, or changes at once when motion is reduced. */
  #release() {
    const from = this.getBoundingClientRect().height;
    this.style.height = '';
    const to = this.getBoundingClientRect().height;
    if (prefersReducedMotion()) return;

    const root = getComputedStyle(document.documentElement);
    const duration = (parseFloat(root.getPropertyValue('--animation-speed-slow')) || 0.2) * 1000;
    const easing = root.getPropertyValue('--ease-out-cubic').trim() || 'ease-out';
    if (!this.refs.panel.hidden) this.refs.panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing });
    if (from === to) return;
    this.style.overflow = 'clip';
    this.#resize = this.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration, easing });
    this.#resize.finished
      .catch(() => {})
      .finally(() => {
        this.style.overflow = '';
      });
  }
}

if (!customElements.get('gamma-availability-notice')) {
  customElements.define('gamma-availability-notice', GammaAvailabilityNotice);
}
