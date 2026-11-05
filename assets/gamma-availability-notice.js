import { Component } from '@theme/component';
import { morph, MORPH_OPTIONS } from '@theme/morph';
import { StandardEvents, ProductSelectEvent } from '@shopify/events';

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

  connectedCallback() {
    super.connectedCallback();
    this.#owner = this.#ownerOf(this);
    this.#owner?.addEventListener(StandardEvents.productSelect, this.#select);
  }

  disconnectedCallback() {
    this.#owner?.removeEventListener(StandardEvents.productSelect, this.#select);
    this.#owner = null;
    this.#generation++;
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
    // Never leave the previous option's claim visible while the new selection loads.
    panel.hidden = true;
    announcement.textContent = '';

    event.promise
      .then(({ detail }) => {
        if (generation !== this.#generation || !this.isConnected) return;
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
      })
      .catch((error) => {
        if (generation !== this.#generation || !this.isConnected) return;
        // An aborted request keeps the last confirmed selection; failures stay cleared.
        if (error?.name === 'AbortError') panel.hidden = wasHidden;
      });
  };
}

if (!customElements.get('gamma-availability-notice')) {
  customElements.define('gamma-availability-notice', GammaAvailabilityNotice);
}
