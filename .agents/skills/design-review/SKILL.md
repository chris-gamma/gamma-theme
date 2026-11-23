---
name: design-review
description: Plan a visual change to the storefront before building it - inspect what renders today, critique and measure it, mock up two or three directions in the live preview without touching the theme, and get Chris's decision with a recommendation. Use for new designs, redesigns of shared components (product card, header, footer, cart, notices, badges) and any change to the visual design language.
---

# Design review

AGENTS.md sets the rules this follows: the approved brand rules (Gamma Red and its contrast exceptions,
Brand badges), the visual design language in `docs/development-plan.md`, and the campaign pages as the
reference for the theme's visual standard. Routine details inside an approved direction don't need a
review; new designs and departures do.

Design tools, all user-level skills (if one isn't listed, carry on without it and say so):

- `impeccable`: design critique, technical audit and refinement commands, and a mechanical detector for
  design anti-patterns. How to use it here is in the next section.
- The design-principle skills, as lenses by surface (table below).
- `rendered-check` for captures and interaction; `design-and-proof` for substantial visual work where
  real viewing size, crops or localization could change the decision.

## Using Impeccable here

- There is no `PRODUCT.md` or `DESIGN.md`, and creating either is a new document that needs Chris's
  approval. Don't run `init`, `document`, `extract` or `shape`: they write those files and `.impeccable/`
  into the repository. The brief is the feature's section of the plan, the visual design language, the
  AGENTS.md brand rules and `assets/gamma-branding.css`; treat it as pinned, which Impeccable honours over
  its own taste. Its scoped commands (`critique`, `audit`, `polish`, `harden`, `adapt`, `layout`,
  `typeset`, `colorize`, `bolder`, `quieter`, `distill`) work on existing code without them and only
  suggest `init`; ignore the suggestion unless Chris wants those files.
- Don't persist its output: skip `critique-storage`, `audit-storage write` and `critique-storage close`,
  and don't run `live`, `hooks on` or `pin`. Keep each report in the evidence folder instead.
- Its findings are advice. Gamma Red's contrast exception, the Brand badges, Horizon's structure (equal
  product cards, for one) and the plan's decisions win over its generic rules and detector hits. Note the
  deviation and why in the review plan; don't "fix" an approved choice.
- `critique` starts two isolated helpers (a design review and a detector and browser pass); count them
  against the helper limit and use it where it pays: a new design, a shared component, the final review of
  a consequential visual change. Use `audit` and the detector alone for routine checks.
- No design hook is installed, so run the detector yourself: `impeccable detect --json <file or preview
  URL>` (add `--viewport 390x844` for phone width). It reads Liquid and HTML sources and rendered
  pages. Run it once on finished UI, not while choosing a direction.

Pick lenses by what the change touches; they inform the options and the review, and aren't a checklist:

| Surface | Skills |
| --- | --- |
| Product, rental and catalogue cards, rows, grids | `repeated-component-alignment`, `component-family-consistency`, `surface-separation` |
| Buttons, links, quantity and form controls | `button-states`, `form-design` |
| Notices, promotions, cart and error messages | `notifications-and-recovery`, `status-colors-and-errors` |
| Type roles, sizes and spacing units | `modular-scale-typography`, `sizing-units` |
| Header, menus, filters, language switcher, sticky elements | `information-architecture`, `global-toolbar-controls`, `sticky-and-fixed-elements` |
| Drawers, search dialog, popovers | `modal-and-overlay-patterns` |
| Page and section layout across widths | `responsive-paradigms`, `layout-paradigms-and-consistency`, `visual-emphasis-and-hierarchy` |
| Motion and feedback | `micro-interactions`, `motion-and-storytelling` |
| Any surface | `wcag-accessibility` |

## 1. Brief

- Read the feature's section in the development plan: purpose, requirements, edge cases and acceptance
  criteria, plus the visual design language and any open question it depends on.
- Find where the component renders and how it is configured: templates, section and block settings,
  snippets, and the Horizon CSS that styles it (`rg`/`grep` the class names). List every surface.

## 2. Baseline

- Start the preview and capture the current state with the `rendered-check` skill: every surface, French
  and English, 320, 390, 768 and 1440 px, into `<evidence>/before/`.
- Measure what the decision depends on with `info` functions: sizes, ratios, type sizes and weights,
  spacing, colours, how many lines titles take, how rows align. Note real-content edge cases: long
  French text, missing images, sale and availability badges together, empty states.
- Run `impeccable critique` on the surface (the source file and the preview URL) and, for technical
  quality, `audit`. Sort what they report into real problems, approved exceptions and noise, and keep that
  sort in the evidence folder; the real problems feed the options.
- Product images on Gamma-Dev are mostly identical illustrations; judge image treatments on real photo
  shapes (the rental catalogue's images, or test products built from them).

## 3. Options

- Two or three genuinely different directions, each with its tradeoffs (brand fit, legibility, how it
  survives the edge cases, cost in Horizon overrides, performance). One is recommended.
- Get the directions from different lenses rather than three tweaks of one idea: read the relevant
  Impeccable reference (`layout`, `typeset`, `colorize`, `bolder`, `quieter`, `distill`, under the skill's
  `reference/` folder) and the principle skills from the table above, then express each direction as CSS or
  JS for a mock-up.
- Mock them up on real pages with `scripts/mock.mjs`: each variant injects CSS or JS into the live page,
  so the theme doesn't change. Cover both languages and at least 1440 and 390 px, the edge cases, and
  hover or focus where it matters (`hover` in the variant).

```json
[{ "name": "card", "path": "/collections/chainsaws", "rows": 2,
   "variants": [
     { "id": "current" },
     { "id": "a", "css": ".card-gallery { border-radius: 12px; }" }
   ] }]
```

## 4. Review plan

Write `<evidence>/PLAN.md` outside the repository (`/home/chris/shopify/gamma-scs-handoff/design-review/
<date>-<short-commit>-<topic>/`):

1. Scope: the feature, its branch and what's out of scope.
2. Where it renders and how it's configured.
3. Baseline: what the captures, measurements and critique show, with the approved exceptions named.
4. One section per decision: the options with their mock-ups, tradeoffs and the recommendation.
5. The implementation plan: files, settings, Horizon rules overridden, commits.
6. New wording in English and natural Quebec French; reuse existing strings where they fit.
7. Found along the way, and the open points for Chris.

Then put the decisions to Chris: a few at a time, recommended option first, each answerable on its own.
Don't implement a new direction before he approves it.

## 5. After approval

- Build it on the feature branch in small commits; keep Horizon's markup and settings where possible and
  mark changes inside Horizon files with `Gamma:`. Read Impeccable's `reference/craft-floor.md` before the
  first UI edit: its checks (contrast, spacing, type, states, browser surfaces) and its refusals apply
  unless the approved direction or a brand rule says otherwise.
- Capture `<evidence>/after/` with the same jobs as the baseline and compare. Check interaction (hover,
  focus, keyboard, reduced motion) with real input, and contrast against the brand rules. Use the
  Chrome DevTools checks in `rendered-check` for the accessibility tree, focus order and tap targets.
- Finish with `impeccable polish`, and `harden` for long French text, empty and error states; run the
  detector once on the result. For a shared or consequential change, a second `critique` against the
  baseline's is the independent review.
- Record the approved decisions in the development plan (the feature's design decisions and the decision
  log) and integrate with the `integrate` skill when Chris asks.
