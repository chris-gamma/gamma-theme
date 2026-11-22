---
name: rendered-check
description: Render theme changes on the Gamma-Dev store with `shopify theme dev` and check them in headless Chromium - before/after captures in French and English at 320, 390, 768 and 1440 px, interaction checks with real input, and recipes for Gamma-Dev test data. Use for any visual or interactive change before it is integrated.
---

# Rendered checks on Gamma-Dev

Local checks don't prove rendering. Use this for changes to templates, sections, blocks, snippets,
CSS or storefront JavaScript. The scripts are in `scripts/` next to this file; run them with Node 22+.

## 1. Preview

- `scripts/preview.sh start` confirms the store is Gamma-Dev, then runs `shopify theme dev` from this
  checkout on port 9293. Rendered checks on Gamma-Dev's development theme are authorized without
  asking (AGENTS.md); writing store data isn't. Tell Chris that the development theme holds your files.
- Don't touch port 9292: it's Chris's own preview. Don't switch branches while the preview runs, since
  it uploads whatever the checkout holds.
- For a before/after review, serve the baseline from a copy:
  `git archive <commit> | tar -x -C <scratch>/base`, then `PREVIEW_PATH=<scratch>/base scripts/preview.sh start`.
- If it asks for an identity check, send Chris the link it prints and start again afterwards.
- `scripts/preview.sh stop` when done.

## 2. Captures

Write a job file and run `node scripts/shoot.mjs jobs.json <evidence>/after`:

```json
[
  { "name": "collection", "fr": "/collections/chainsaws", "vclip": true },
  { "name": "dialog", "fr": "/collections/chainsaws", "typeText": "scie", "widths": [390, 1440] },
  { "name": "card", "fr": "/collections/chainsaws", "mode": "el", "sel": "product-card", "widths": [1440],
    "info": "(el) => getComputedStyle(el.querySelector('.card-gallery')).aspectRatio" }
]
```

- Every changed surface in French (`/`) and English (`/en`) at 320, 390, 768 and
  1440 px, plus 200% zoom (`"zoom": 2`, widths 1440 and 768) for layout changes. Cover the empty,
  error and long-French-text states the change can reach.
- The log flags horizontal overflow and, with `vclip`, text clipped by an ancestor. Known Horizon
  cases: the two-line title clamp in the search dialog, the 1 px filter checkbox overhang and the
  closed sort menu (`sorting-filter__options-inner`).
- Look at the screenshots that matter; a passing log isn't a visual review.

## 3. Interaction

Write a short script that imports `launch` from `scripts/cdp.mjs` and uses its real input helpers
(`key`, `move`, `click`, `type`). Pitfalls that cost time before:

- Run hover and keyboard checks in a fresh browser that never had touch emulation on; `launch()`
  declares a fine pointer by default, which headless Chromium otherwise lacks.
- Horizon scrolls `.page-wrapper`, not the document. Scroll it (with `behavior: 'instant'`) before
  measuring positions, and to load lazy images.
- `:focus-visible` needs real Tab key events; programmatic `focus()` doesn't count. Predictive search
  only reacts to trusted typing (`type()`), not synthetic input events.
- Reduced motion: `send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })`.
- Measure state over time (colour or transform after 0, 60 and 300 ms) rather than trusting one sample.
- Quick Add and cart checks add items to a fresh headless cart only; never submit orders, contact or
  newsletter forms. Each `launch()` starts with a new profile, removed on close, so a cart lasts for
  one launch: fill it in the same run that checks it.

## 4. Pacing and failures

- Keep page loads about 1.5 s apart. Bursts earn HTTP 429 and a verification page for 10–25 minutes.
- The preview proxy sometimes answers 502 under load; retry that page once on its own before calling it
  a failure. A 401 for about a minute means the preview session is renewing.
- Run one heavy job at a time (a sweep, an interaction run, a Theme Check).

## 5. Evidence and report

- Keep evidence outside the repository in
  `/home/chris/shopify/gamma-scs-handoff/design-review/<date>-<short-commit>-<topic>/` (`before/`,
  `after/`, and any one-off scripts).
- Report each check as passed, failed, blocked or not run, with the decisive measurement. Say what
  wasn't covered (missing test data, the theme editor, other browsers). A screenshot doesn't prove
  interaction.
- Firefox: Playwright's Firefox works through the cached `playwright` package
  (`ls ~/.npm/_npx/*/node_modules/playwright`); install its matching browser with that package's
  `cli.js install firefox` if it complains.

## Test data

`fixtures.md` has the Gamma-Dev data that already exists and recipes for adding more. Every store write
needs Chris's approval for that exact change.
