# Location Gamma theme

`gamma-theme` is Location Gamma's Shopify storefront theme, based on Shopify Horizon 4.5.0.

It keeps Horizon's core storefront features and adds Gamma's customizations, with English and French translations. Liquid, CSS and JavaScript are used directly, with no build step.

## Getting started

Use Node 24.22.2 (see `.nvmrc`) and npm 11.19.1. From the repository root, install the pinned tools:

```sh
npm ci --ignore-scripts
```

This installs Shopify CLI and TypeScript for local checks. In VS Code, accept the prompt to use the workspace TypeScript.

Coding agents use a local [Repowise](https://docs.repowise.dev) index of the repository. With Repowise installed (`uv tool install repowise --with fastembed`), build it once per checkout:

```sh
repowise init --yes --no-prose --no-agents --no-claude-md --no-distill-hook
repowise config set editor_setup false
git checkout -- .github/copilot-instructions.md
repowise reindex --embedder fastembed
```

This indexes without a model, connects the agents and installs a post-commit hook that keeps the index current. Turning off `editor_setup` stops updates from rewriting the agent instruction files; `AGENTS.md` covers Repowise for every agent.

## Checking changes

Run the full check before merging:

```sh
npm run check:all
```

This runs Theme Check, JavaScript type checking, the unit tests and whitespace checks on staged and unstaged changes. The checks also run individually:

| Command | Purpose |
| --- | --- |
| `npm run check` | Check Liquid, theme structure and Shopify conventions |
| `npm run check:json` | Get Theme Check results as JSON |
| `npm run check:js` | Check JavaScript types without generating files |
| `npm run check:js:watch` | Recheck JavaScript as you edit |
| `npm test` | Run the unit tests with Node's test runner |

Unit tests in `tests/` cover exported functions in Gamma's JavaScript that don't render. `tests/setup.mjs` lets Node load modules from `assets/`: `@theme/*` imports resolve to the stubs in `tests/stubs/`, and custom element registration does nothing. Node has no DOM, so the tests stub what they need, such as `fetch`.

Horizon 4.5.0 has seven known warnings: one `ExcessiveSettingsCount` in `sections/header.liquid`, one `LiquidComplexity` in `snippets/product-media-gallery-content.liquid` and five `UnusedDocParam` in `snippets/divider.liquid`. Gamma's localized media filtering raises that snippet's complexity from 125 to 130. Anything else is new.

Local checks don't replace testing in the storefront and theme editor. Confirm the target store and theme before any upload or deployment; `shopify theme dev` uploads a development theme.

## Map previews

The Map block's static images are generated from its uMap maps. On a branch connected to a Shopify theme through GitHub (for example `dev`, connected to `gamma-theme/dev`), run from the repository root:

```sh
node scripts/generate-map-previews.mjs
```

The script finds the theme named after the repository and branch on the default Shopify CLI environment's store and reads its Map blocks without changing anything. It saves a lossless PNG of each map at three times the block's display size in `docs/map_previews/`, named after the placement and size (for example `carte-pied-de-page-180x180.png`). Use `--environment <name>` for another store, `--theme <name or ID>` from another branch and `--dry-run` to list previews without capturing them. It needs Node 22+, Shopify CLI access to the store and Chrome, Chromium or Edge (set `CHROME_PATH` if not found). Upload the files to Shopify Files and select them in each Map block. Run it again after changing a map's view on uMap or a block's maximum width or aspect ratios.

## Development workflow

Use `dev` for ongoing work and keep `main` for releases. Keep changes focused and run the local checks before merging. Use the repository's configured commit identity and signing settings.

Preserve merchant settings, translations and working Horizon behaviour. Record meaningful Gamma changes in [CHANGELOG.md](CHANGELOG.md). Planned features are in the [development plan](docs/development-plan.md). [AGENTS.md](AGENTS.md) has the instructions for coding assistants.

Push with `git push origin dev`. The `upstream` remote is only for pulling Horizon updates; pushes to it are blocked locally.

## Updating Horizon

Pick a verified stable release from [Shopify Horizon](https://github.com/Shopify/horizon), read its release notes and merge it, keeping upstream history and Gamma's customizations. Upstream `main` isn't necessarily stable. Leave existing vendor tags alone.

After each update, check the Gamma changes inside Horizon's own files against the new release. `snippets/gamma-card-variant.liquid` supplies the variant on promotion pages; the product card's block and snippet, gallery, title, price, Quick Add and swatches each carry a marked Gamma addition that does nothing elsewhere. Check that a card limited to one variant still shows its image, price, badges and link, names the variant under its price and in the link's accessible name, and adds it from Quick Add. The card gallery also gives campaign cards (those whose closest context is an offer group) the collection grid's image sizes and lazy loading. Search: `snippets/resource-card.liquid` lists a dialog result's sale price first, `sections/predictive-search.liquid` and `blocks/_search-input.liquid` render empty states as Gamma notices, and `sections/search-header.liquid` makes the page heading an `h1`. `sections/main-collection-list.liquid` skips hidden eligibility collections without counting them toward its limit. `assets/gamma-branding.css` draws a frame on overlays of `.card-gallery`, the collection card image and the dialog result media, and hides it in `.collection-wrapper--full-width-on-mobile`. It turns hovered or focused card gallery arrows Gamma Red by replacing the `slideshow-arrows` difference blend and the arrows' button colour transition, and lists Horizon's `arrowsSlideIn` animation by name beside its own. It replaces `.card-hover-effect-subtle-zoom` with a zoom of the inner image, because `.product-grid__card` and `.collection-card__inner` clip the scaled tile, and gives collection card titles room below their last line, because `.collection-card__inner` clips them. On the product page between 750 and 989px it shows the grid gallery's `slideshow-component` and its `desktop:hidden` phone controls in place of `.media-gallery__grid`, overriding Horizon's switch at 750px in `snippets/product-media-gallery-content.liquid` and `snippets/product-media-gallery-content-styles.liquid`; the gallery snippet's marked Gamma change gives the slides a single-column image size at those widths. Check those selectors and the clipping still match. `snippets/cart-products.liquid` sets a cart line's detail text size on the cell instead of Horizon's `.cart-items__details *` rule; drop that if Horizon fixes the rule. `snippets/quick-add-modal.liquid` loads the availability and promotion notice modules, because Quick Add morphs product HTML into its dialog without running the scripts inside it; check that Horizon still does. In the cart, `snippets/cart-products.liquid` gives drawer lines the image's own ratio and, with an empty-cart menu chosen, renders its notice in place of the continue-shopping button; `snippets/cart-summary.liquid` makes the discount button secondary; and `blocks/_cart-summary.liquid` and `snippets/cart-drawer.liquid` give the summaries `gamma-tokens`. `assets/gamma-branding.css` draws the summary panel on `.cart-summary__inner` and the drawer band on `.cart-drawer__summary` without Horizon's mask, drops the rule above `.cart-actions` inside them, stacks `.cart-page__summary` below the lines from 750 to 989px and visually hides the empty cart's heading when the notice repeats it; check those selectors still match. For controls, `assets/gamma-branding.css` gives `button.quick-add__button` the buttons' rounding in place of its fixed pill, fades the dimming of `.facets__summary`, puts the cart discount's button inside its field by restyling `.cart-discount__form`, `.cart-discount__input` and `.cart-discount__button`, and draws the focus ring of a field with its button inside around the whole field; check they still apply. `snippets/stylesheets.liquid` loads Gamma's stylesheets after `base.css` and renders `snippets/gamma-tokens.liquid`; `assets/gamma-branding.css` aliases Horizon's font, colour, spacing and badge variables, so check they still exist and that notices, badges and campaign headings keep their sizes.

During each update:

- Keep Shopify's unmodified README, license and release notes as `README-horizon.md`, `LICENSE-horizon.md` and `release-notes-horizon.md`; Gamma's own README and license stay in place.
- Keep only `en.default.json`, `fr.json`, `en.default.schema.json` and `fr.schema.json` in `locales/`, and validate their JSON and translation references.
- Run the local checks before merging, then test the storefront and theme editor before release.

## License

Gamma's original work is covered by the [project license](LICENSE.md). Shopify Horizon stays under its [original license](LICENSE-horizon.md), including its distribution restrictions. Upstream authorship and history are preserved in Git.
