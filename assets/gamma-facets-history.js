import { sectionRenderer } from '@theme/section-renderer';

/**
 * Gamma: re-render filtered results on Back/Forward.
 *
 * Horizon 4.4.0 pushes a history entry for every filter, sort and removal change but only restores
 * scroll on popstate, so results and counts stay on the later state. This re-renders the facets
 * section from the restored URL when its filter or sort state differs from the last render.
 * Page-only changes are ignored so Back through infinite-scroll pages keeps the loaded products.
 *
 * Remove it, and its script tag in blocks/filters.liquid, once Horizon handles popstate itself.
 */

/**
 * Returns the URL state that determines facet results: the path plus every query
 * parameter except pagination.
 * @param {Location | URL} location
 * @returns {string}
 */
function getFacetState(location) {
  const parameters = new URLSearchParams(location.search);
  parameters.delete('page');
  parameters.sort();
  return `${location.pathname}?${parameters}`;
}

let renderedState = getFacetState(window.location);

// Facet and pagination updates render the URL they push, so it becomes the rendered state.
const pushState = history.pushState;
history.pushState = function (...args) {
  pushState.apply(this, args);
  renderedState = getFacetState(window.location);
};

window.addEventListener('popstate', () => {
  const state = getFacetState(window.location);
  if (state === renderedState) return;

  const sectionId = document.querySelector('facets-form-component[section-id]')?.getAttribute('section-id');
  if (!sectionId) return;

  renderedState = state;
  sectionRenderer.renderSection(sectionId).catch(() => window.location.reload());
});
