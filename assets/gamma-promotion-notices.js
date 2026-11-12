import { Component } from '@theme/component';
import { morph, MORPH_OPTIONS } from '@theme/morph';
import { StandardEvents, ProductSelectEvent } from '@shopify/events';

/**
 * Keeps a product's promotion notices in step with the selected variant.
 *
 * Shopify renders the notices for the selected variant; Horizon's variant update morphs only the
 * picker, so this takes the same block from the section response and swaps its notices in. Without
 * JavaScript the page shows the notices of the variant in its address.
 *
 * @typedef {Object} PromotionNoticesRefs
 * @property {HTMLElement} panel
 * @extends {Component<PromotionNoticesRefs>}
 */
class GammaPromotionNotices extends Component {
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
    return element.closest('product-component') ?? element.closest('.shopify-section, dialog');
  }

  /** @param {ProductSelectEvent} event */
  #select = (event) => {
    if (!(event.target instanceof Element) || this.#ownerOf(event.target) !== this.#owner) return;
    const generation = ++this.#generation;
    const { panel } = this.refs;
    const wasHidden = panel.hidden;
    // Never leave the previous variant's claim visible while the new selection loads.
    panel.hidden = true;

    event.promise
      .then(({ detail }) => {
        if (generation !== this.#generation || !this.isConnected) return;
        const resource = detail?.resource;
        if (!detail || !resource) return;
        const expectedProduct = String(detail.newProduct?.id ?? detail.productId ?? '');
        const source = Array.from(detail.html?.querySelectorAll('gamma-promotion-notices') ?? []).find(
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

        morph(panel, nextPanel, { ...MORPH_OPTIONS, childrenOnly: false });
        this.dataset.productId = source.dataset.productId;
        this.dataset.variantId = source.dataset.variantId;
      })
      .catch((error) => {
        if (generation !== this.#generation || !this.isConnected) return;
        // An aborted request keeps the last confirmed selection; failures stay cleared.
        if (error?.name === 'AbortError') panel.hidden = wasHidden;
      });
  };
}

if (!customElements.get('gamma-promotion-notices')) {
  customElements.define('gamma-promotion-notices', GammaPromotionNotices);
}
