---
name: rendered-check
description: Render theme changes on the Gamma-Dev store with `shopify theme dev` and check them in headless Chromium - before/after captures in French and English at 320, 390, 768 and 1440 px, interaction checks with real input (Playwright MCP), accessibility, computed-style and network checks (Chrome DevTools MCP), and recipes for Gamma-Dev test data. Use for any visual or interactive change before it is integrated.
---

# Rendered checks on Gamma-Dev

Local checks don't prove rendering. Use this for changes to templates, sections, blocks, snippets,
CSS or storefront JavaScript. The scripts are in `scripts/` next to this file; run them with Node 22+.
They use the Chromium or Chrome on `PATH` (or `CHROME_PATH`) and give each run its own free debugging
port, so runs can overlap.

Pick the tool by the question, cheapest first:

| Question | Tool |
| --- | --- |
| Does every changed surface hold up in both languages at every width? What changed against the baseline? | `shoot.mjs` and `compare.mjs` (section 2): batch, repeatable, nothing enters the conversation but the log |
| Does it work with real input: hover, Tab order, typing, opening a drawer, Quick Add? | Playwright MCP (section 3) |
| Is the accessibility tree, focus order, tap target, computed style, console issue or image request right? | Chrome DevTools MCP with the `a11y-debugging` and `chrome-devtools` skills (section 4) |
| Does a value change over time (colour or transform after 0, 60 and 300 ms), or does a flow need exact repeatability? | A script on `cdp.mjs` (section 3) |

The two MCP servers (`playwright`, `chrome-devtools`) are user-level, pinned, headless, with a fresh
in-memory profile and Google usage statistics and CrUX lookups off. Their tools are deferred: load them
with ToolSearch before the first call. If a server isn't listed, fall back to the scripts and say so in
the report.

Rules for every browser tool: open only the preview (`http://127.0.0.1:9293`, or the port the preview
printed), never Primary or a store domain directly; never submit orders, contact or newsletter forms;
keep page loads about 1.5 s apart (section 5); close the page or browser when done. Only the preview
handles the storefront password, so a browser tool never needs it.

## 1. Preview

- `scripts/preview.sh start` confirms the store is Gamma-Dev, then runs `shopify theme dev` from this
  checkout on port 9293. Rendered checks on Gamma-Dev's development theme are authorized without
  asking (AGENTS.md); writing store data isn't. Tell Chris that the development theme holds your files.
- Don't touch port 9292: it's Chris's own preview. Don't switch branches or edit theme files in the
  checkout while the preview runs, since it uploads whatever the checkout holds; tell a helper running
  captures about any edits made beside it.
- For a before/after review, serve the baseline from a copy:
  `git archive <commit> | tar -x -C <scratch>/base`, then `PREVIEW_PATH=<scratch>/base scripts/preview.sh start`.
- If it asks for an identity check, send Chris the link it prints and start again afterwards.
- `scripts/preview.sh stop` when done. The script only signals a preview it started: it records the
  owning worktree, served path, port and the process's pid and start time, and `status` and `stop` check
  them against the live process. It refuses (and leaves the process alone) when another worktree or path
  owns the preview, when the port is held by something it didn't start, such as Chris's 9292, and when a
  recorded pid now belongs to an unrelated process. Then ask Chris rather than force it.

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

- While iterating, shoot one relevant route in one locale at one viewport (the one the change shows
  best at). Before calling the change done, run the full acceptance matrix below; iteration captures
  don't count toward it.
- Acceptance: every changed surface in French (`/`) and English (`/en`) at 320, 390, 768 and
  1440 px, plus 200% zoom (`"zoom": 2`, widths 1440 and 768) for layout changes. Cover the empty,
  error and long-French-text states the change can reach.
- The log flags horizontal overflow and, with `vclip`, text clipped by an ancestor. Known Horizon
  cases: the two-line title clamp in the search dialog, the 1 px filter checkbox overhang and the
  closed sort menu (`sorting-filter__options-inner`).
- Look at the screenshots that matter; a passing log isn't a visual review.
- Before/after: shoot the same job file into `before/` and `after/`, then run
  `node scripts/compare.mjs <evidence>`. It writes `compare.json` and lists the captures that differ, with
  the changed area; open those pairs rather than every shot. Small differences inside images are usually
  resampling.
- Wording changes: add `"text": true` to the jobs. `compare.mjs` then lists, for each capture, the words
  that changed in the page text and in `aria-label`, `alt`, `placeholder` and `title` values, so a change
  outside the intended strings stands out.
- The development theme carries no theme-content translations (text typed into sections and templates in
  the editor, such as footer headings), so French captures show that text in English. The published theme
  has the French; check it there before calling it a regression.
- Many changes don't show in a screenshot (`loading`, `sizes`, ARIA labels, a rule that only matters
  for long text). State each expected change as something to measure in the page, and read it with a
  job's `info` or the interaction script.

## 3. Interaction

Use the Playwright MCP tools for one-off interaction checks: `browser_navigate`, `browser_resize`,
`browser_snapshot` (the accessibility tree with element refs; prefer it to screenshots for finding what
to act on), `browser_hover`, `browser_click`, `browser_press_key`, `browser_type`,
`browser_emulate_media` and `browser_take_screenshot`. Its browser reports a fine pointer and hover, and
its input is real input. The cart and any stored choice last as long as the MCP server runs, so close
the browser (`browser_close`) between checks that need an empty cart or no stored choice.
`browser_evaluate` reads page values; avoid `browser_run_code_unsafe`, which runs arbitrary code.

Write a script on `scripts/cdp.mjs` (`launch`, then `key`, `move`, `click`, `type`) instead when the
check measures state over time, must repeat identically, or belongs in the evidence folder as a rerunnable
file. Pitfalls that cost time before:

- Run hover and keyboard checks in a fresh browser that never had touch emulation on; `launch()`
  declares a fine pointer by default, which headless Chromium otherwise lacks. Playwright's browser needs
  no declaration, but a phone-width capture from `shoot.mjs` or an emulated device leaves touch on for
  that browser.
- Horizon scrolls `.page-wrapper`, not the document. Scroll it (with `behavior: 'instant'`) before
  measuring positions, and to load lazy images.
- `:focus-visible` needs real Tab key events (`browser_press_key`, `key()`); programmatic `focus()`
  doesn't count. Predictive search only reacts to trusted typing: `type()` in a script, or
  `browser_type` with `slowly: true` (key by key); don't set the field's value.
- Search dialog: focus stays in the field while the arrow keys move the highlight; the highlighted
  result has `aria-selected="true"` (and `keyboard-focus`). `aria-activedescendant` isn't used.
- Cart: the cart is a drawer, but auto-open after adding is off (Horizon's default), so adding leaves
  it closed. Open it from the header's cart button, or check the cart page. `/cart.js` gives
  `variant_title: null` for a product with a single variant.
- Maps: with no stored choice, a map loads as it scrolls into view when privacy allows preferences,
  which it does headless. To test the static image and its show button, set
  `localStorage['gamma-map:choice'] = 'off'` on the storefront and reload.
- Reduced motion: `browser_emulate_media` with `reducedMotion: 'reduce'`, Chrome DevTools `emulate` with
  `prefersReducedMotion: 'reduce'`, or in a script
  `send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })`.
- Measure state over time (colour or transform after 0, 60 and 300 ms) rather than trusting one sample.
- Checkout can't be reached through the preview: it leaves the proxy for the password-protected store.
- Quick Add and cart checks add items to a fresh headless cart only; never submit orders, contact or
  newsletter forms. Each `launch()` starts with a new profile, removed on close, so a cart lasts for
  one launch: fill it in the same run that checks it.

## 4. Inspection with Chrome DevTools

Load the `chrome-devtools` skill for the tool workflow (navigate, wait, snapshot, then act; `filePath` for
large outputs) and `a11y-debugging` for accessibility. They are user-level skills; if they aren't listed,
use `wcag-accessibility` and the scripts. Use it for what a screenshot can't show:

- Accessibility: `take_snapshot` is the accessibility tree (names, roles, heading levels, landmarks);
  `list_console_messages` with `types: ["issue"]` lists Chrome's own a11y and form issues;
  `lighthouse_audit` (accessibility category, both `device` values) gives a baseline, and its failures are
  read from `report.json` with a one-liner, not loaded whole. Use `press_key` Tab with a snapshot after each
  press for focus order, and the skill's tap-target snippet through `evaluate_script`. Lighthouse
  doesn't replace the keyboard pass or a visual review; treat a 100 as no automatic failures found.
  Contrast failures on primary Gamma Red (above fine print) and on Brand badges are approved exceptions in
  AGENTS.md; list them as such, and report any other contrast failure.
- Design anti-patterns: `impeccable detect --json http://127.0.0.1:9293/<path> --viewport 390x844` (and
  the default 1280x800) scans a rendered page, which sees what the Liquid sources don't. Run it once on
  finished UI; the `design-review` skill covers how to read its findings.
- Computed style: `get_css_styles` for a selected element's matched rules, cascade and custom properties,
  which is how to see why a Gamma rule loses to a Horizon one.
- Environment: `emulate` for reduced motion, forced colors, contrast preference, colour scheme, CPU and
  network throttling, and viewport.
- Network: `list_network_requests` for image requests, widths and formats; use it with the
  `performance-check` skill for image bytes, not instead of it.
- LCP: `debug-optimize-lcp` and `performance_start_trace` work on the preview, but the preview proxies
  every request, so time to first byte and total load time aren't the live store's. Use a trace for
  which element is the LCP, render-blocking resources and the resource's discovery and priority, and take
  timings from the published theme.

## 5. Pacing and failures

- Keep page loads about 1.5 s apart. Bursts earn HTTP 429 and a verification page for 10–25 minutes.
- The preview proxy sometimes answers 502 under load; retry that page once on its own before calling it
  a failure. A 401 for about a minute means the preview session is renewing.
- Run one heavy job at a time (a sweep, an interaction run, a Theme Check).

## 6. Evidence and report

- Keep evidence outside the repository in
  `/home/chris/shopify/gamma-scs-handoff/design-review/<date>-<short-commit>-<topic>/` (`before/`,
  `after/`, and any one-off scripts). Save MCP screenshots and reports there too: pass `filename`
  (Playwright) or `filePath` / `outputDirPath` (Chrome DevTools) so they don't land in the repository or
  the default temporary folder.
- Report each check as passed, failed, blocked or not run, with the decisive measurement. Say what
  wasn't covered (missing test data, the theme editor, other browsers). A screenshot doesn't prove
  interaction.
- Firefox: Playwright's Firefox works through the cached `playwright` package
  (`ls ~/.npm/_npx/*/node_modules/playwright`); install its matching browser with that package's
  `cli.js install firefox` if it complains.

## Test data

`fixtures.md` has the Gamma-Dev data that already exists and recipes for adding more. Every store write
needs Chris's approval for that exact change.
