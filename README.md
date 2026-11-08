# Location Gamma theme

`gamma-theme` is Location Gamma's Shopify storefront theme, maintained from Shopify Horizon. Its foundation is Horizon 4.4.0.

The theme keeps Horizon's core storefront features and adds Gamma's customizations, with English and French translations. It uses Liquid, CSS and JavaScript directly, with no build step.

## Getting started

Use Node 24.22.2 (see `.nvmrc`) and npm 11.19.1. From the repository root, install the pinned development tools:

```sh
npm ci --ignore-scripts
```

This installs Shopify CLI and TypeScript for local checks. In VS Code, accept the workspace TypeScript prompt to use the project's version.

## Checking changes

Run the full local check before merging:

```sh
npm run check:all
```

This runs Theme Check, JavaScript type checking and whitespace checks for staged and unstaged changes. You can also run checks individually:

| Command | Purpose |
| --- | --- |
| `npm run check` | Check Liquid, theme structure and Shopify conventions |
| `npm run check:json` | Get Theme Check results as JSON |
| `npm run check:js` | Check JavaScript types without generating files |
| `npm run check:js:watch` | Recheck JavaScript as you edit |

Horizon 4.4.0 has seven known warnings: one `ExcessiveSettingsCount` in `sections/header.liquid`, one `LiquidComplexity` in `snippets/product-media-gallery-content.liquid` and five `UnusedDocParam` warnings in `snippets/divider.liquid`. Gamma's localized media filtering raises that snippet's complexity from Horizon's 125 to 130. Review new findings separately from these upstream warnings.

Local checks do not replace testing in the storefront and theme editor. Confirm the target store and theme before any upload or deployment. `shopify theme dev` uploads a development theme to Shopify.

## Map previews

The Map block's static images are generated from its uMap maps. On a branch connected to a Shopify theme through GitHub (for example `dev`, connected to `gamma-theme/dev`), run from the repository root:

```sh
node scripts/generate-map-previews.mjs
```

The script finds the theme named after the repository and branch on the store of the default Shopify CLI environment and reads its Map blocks without changing anything on Shopify. It saves a lossless PNG of each map, at three times the size its block displays, in `docs/map_previews/`, named after the placement and display size (for example `carte-pied-de-page-180x180.png`). Use `--environment <name>` for another store, `--theme <name or ID>` from another branch and `--dry-run` to list the previews without capturing them. It needs Node 22 or later, Shopify CLI access to the store and Chrome, Chromium or Edge (set `CHROME_PATH` if yours isn't found). Upload the files to Shopify Files and select them in each Map block, and run it again after changing a map's view on uMap or a block's Maximum width or aspect ratios.

## Development workflow

Use `dev` for ongoing development and reserve `main` for approved releases. Keep changes focused, review the full diff and run the local checks before integration. Use the repository's configured commit identity and signing settings.

Preserve merchant settings, translations and working Horizon behavior. Record meaningful Gamma changes in [CHANGELOG.md](CHANGELOG.md). The [development plan](docs/development-plan.md) describes planned features; [AGENTS.md](AGENTS.md) contains guidance for coding agents.

Push to Gamma's GitHub repository with `git push origin dev`. The `upstream` remote is for pulling Shopify Horizon updates; pushes to it are blocked locally.

## Updating Horizon

Choose a verified stable release from [Shopify Horizon](https://github.com/Shopify/horizon), review its release notes and merge that release while preserving upstream history and Gamma's customizations. Do not assume the latest upstream `main` is a stable release. Keep existing vendor tags unchanged.

During each update:

- Keep unmodified copies of Shopify's README, license and release notes as `README-horizon.md`, `LICENSE-horizon.md` and `release-notes-horizon.md`. Keep Gamma's own README and license in place.
- Retain only `en.default.json`, `fr.json`, `en.default.schema.json` and `fr.schema.json` in `locales/`. Validate their JSON and translation references.
- Review the full diff and run the local checks before integration, followed by storefront and theme-editor testing before release.

## License

Gamma's original work is covered by the [project license](LICENSE.md). Shopify Horizon remains subject to its [original license](LICENSE-horizon.md), including its distribution restrictions. Upstream authorship and history are preserved in Git.
