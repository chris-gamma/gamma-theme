import { sectionRenderer } from '@theme/section-renderer';

/**
 * Gamma: re-render filtered results on Back/Forward.
 *
 * Horizon 4.4.0 pushes a history entry for every filter, sort and removal change
 * (assets/facets.js), but only restores the scroll position on popstate
 * (assets/scroll-container.js). Back/Forward therefore changed the URL while the
 * results, filters and counts kept showing the later state.
 *
 * This module re-renders the facets section from the restored URL when its filter or
 * sort state differs from the state last rendered. Page-only changes are left alone so
 * Back through infinite-scroll pages keeps the loaded products.
 *
 * Remove this file and its script tag in blocks/filters.liquid once Horizon re-renders
 * facet results on popstate itself.
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

// Modules evaluate once per page, so this runs once however often the filters block renders.
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
