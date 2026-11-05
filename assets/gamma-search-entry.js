import { Component } from '@theme/component';
import { DialogComponent, DialogOpenEvent } from '@theme/dialog';

/**
 * @typedef {object} SearchDialog
 * @property {DialogComponent} host - The `#search-modal` dialog component.
 * @property {HTMLDialogElement} dialog - Its dialog element.
 * @property {HTMLInputElement} input - The predictive search input inside it.
 */

/**
 * Returns the header's search dialog when it can take a query right now, or null.
 * @returns {SearchDialog | null}
 */
function getSearchDialog() {
  const host = document.getElementById('search-modal');
  if (!(host instanceof DialogComponent)) return null;

  const { dialog } = host.refs;
  if (!(dialog instanceof HTMLDialogElement) || dialog.open) return null;

  const PredictiveSearch = customElements.get('predictive-search-component');
  const search = host.querySelector('predictive-search-component');
  if (!PredictiveSearch || !(search instanceof PredictiveSearch) || !(search instanceof Component)) return null;

  const { searchInput } = search.refs;
  if (!(searchInput instanceof HTMLInputElement) || !searchInput.isConnected) return null;

  return { host, dialog, input: searchInput };
}

/**
 * A search form that continues the customer's query in the header's search dialog.
 *
 * The form works on its own. When a customer starts typing and the search dialog is ready, the
 * dialog opens with their query and they carry on there, with the same suggestions and keyboard
 * navigation as the header search. When it isn't ready, the query stays in this field and submits
 * to the search page. Submitting a typed query always goes to the search page.
 *
 * @typedef {object} Refs
 * @property {HTMLFormElement} form - The search form.
 * @property {HTMLInputElement} input - The search input.
 *
 * @extends {Component<Refs>}
 */
class GammaSearchEntryComponent extends Component {
  requiredRefs = ['form', 'input'];

  /** @type {AbortController | undefined} */
  #listeners;

  /** True once the current query has started as an ordinary form query, until the field is cleared. */
  #plain = false;

  /** True after the dialog failed to open, so this field stays an ordinary form. */
  #unavailable = false;

  #composing = false;

  /**
   * The hand-off waiting for the dialog to open.
   * @type {{ cancelled: boolean } | null}
   */
  #pending = null;

  connectedCallback() {
    super.connectedCallback();

    this.#listeners?.abort();
    this.#listeners = new AbortController();
    const { signal } = this.#listeners;
    const { form, input } = this.refs;

    input.addEventListener('input', this.#handleInput, { signal });
    input.addEventListener('compositionstart', this.#handleCompositionStart, { signal });
    input.addEventListener('compositionend', this.#handleCompositionEnd, { signal });
    form.addEventListener('submit', this.#handleSubmit, { signal });

    // Text typed before this script loaded is already an ordinary form query.
    this.#plain = input.value.trim() !== '';
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#listeners?.abort();
    if (this.#pending) this.#pending.cancelled = true;
    this.#pending = null;
  }

  /** @param {Event} event */
  #handleInput = (event) => {
    if ((event instanceof InputEvent && event.isComposing) || this.#composing) return;
    this.#update();
  };

  #handleCompositionStart = () => {
    this.#composing = true;
  };

  #handleCompositionEnd = () => {
    this.#composing = false;
    this.#update();
  };

  /**
   * Starts the hand-off when committed input begins a new query.
   */
  #update() {
    // The dialog takes the field's latest value when it opens.
    if (this.#pending) return;

    if (this.refs.input.value.trim() === '') {
      this.#plain = false;
      return;
    }

    if (this.#plain) return;

    const searchDialog = this.#unavailable ? null : getSearchDialog();
    if (searchDialog) {
      this.#handOff(searchDialog, false);
    } else {
      this.#plain = true;
    }
  }

  /** @param {SubmitEvent} event */
  #handleSubmit = (event) => {
    if (this.refs.input.value.trim() !== '') {
      // An explicit search goes to the search page, even if the dialog is about to open.
      if (this.#pending) this.#pending.cancelled = true;
      return;
    }

    if (this.#pending) {
      event.preventDefault();
      return;
    }

    const searchDialog = this.#unavailable ? null : getSearchDialog();
    if (!searchDialog) return;

    event.preventDefault();
    this.#handOff(searchDialog, true);
  };

  /**
   * Opens the search dialog and moves the query into it once it is open.
   * @param {SearchDialog} searchDialog
   * @param {boolean} submitted - Whether an empty form submission started the hand-off.
   */
  #handOff(searchDialog, submitted) {
    const { host, dialog } = searchDialog;
    const pending = { cancelled: false };
    this.#pending = pending;

    const handleOpen = () => {
      if (this.#pending === pending) this.#pending = null;

      // A typed query was submitted before the dialog opened; the page is already navigating.
      if (pending.cancelled) {
        if (this.isConnected) host.closeDialog();
        return;
      }

      this.#transfer(searchDialog);
    };

    host.addEventListener(DialogOpenEvent.eventName, handleOpen, { once: true, signal: this.#listeners?.signal });

    try {
      host.showDialog();
    } catch (error) {
      console.error(error);
    }

    // showDialog opens the dialog in the next animation frame; this callback runs after it.
    requestAnimationFrame(() => {
      if (this.#pending !== pending || dialog.open) return;

      host.removeEventListener(DialogOpenEvent.eventName, handleOpen);
      this.#pending = null;
      this.#unavailable = true;
      this.#plain = true;

      if (submitted && !pending.cancelled && this.isConnected) this.refs.form.requestSubmit();
    });
  }

  /**
   * Copies the query, caret and selection into the dialog's input and starts its search.
   * @param {SearchDialog} searchDialog
   */
  #transfer({ input: dialogInput }) {
    const { input } = this.refs;
    const { value, selectionStart, selectionEnd, selectionDirection } = input;

    if (document.activeElement !== dialogInput) dialogInput.focus();
    if (value.trim() === '') return;

    dialogInput.value = value;
    dialogInput.setSelectionRange(
      selectionStart ?? value.length,
      selectionEnd ?? value.length,
      selectionDirection ?? 'none'
    );
    dialogInput.dispatchEvent(
      new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertReplacementText' })
    );

    input.value = '';
    this.#plain = false;
  }
}

if (!customElements.get('gamma-search-entry-component')) {
  customElements.define('gamma-search-entry-component', GammaSearchEntryComponent);
}
