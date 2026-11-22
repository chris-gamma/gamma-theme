---
name: design-review
description: Plan a visual change to the storefront before building it - inspect what renders today, measure it, mock up two or three directions in the live preview without touching the theme, and get Chris's decision with a recommendation. Use for new designs, redesigns of shared components (product card, header, footer, cart, notices, badges) and any change to the visual design language.
---

# Design review

AGENTS.md sets the rules this follows: the approved brand rules (Gamma Red and its contrast exceptions,
Brand badges), the visual design language in `docs/development-plan.md`, and the campaign pages as the
reference for the theme's visual standard. Routine details inside an approved direction don't need a
review; new designs and departures do.

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
- Product images on Gamma-Dev are mostly identical illustrations; judge image treatments on real photo
  shapes (the rental catalogue's images, or test products built from them).

## 3. Options

- Two or three genuinely different directions, each with its tradeoffs (brand fit, legibility, how it
  survives the edge cases, cost in Horizon overrides, performance). One is recommended.
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
3. Baseline: what the captures and measurements show.
4. One section per decision: the options with their mock-ups, tradeoffs and the recommendation.
5. The implementation plan: files, settings, Horizon rules overridden, commits.
6. New wording in English and natural Quebec French; reuse existing strings where they fit.
7. Found along the way, and the open points for Chris.

Then put the decisions to Chris: a few at a time, recommended option first, each answerable on its own.
Don't implement a new direction before he approves it.

## 5. After approval

- Build it on the feature branch in small commits; keep Horizon's markup and settings where possible and
  mark changes inside Horizon files with `Gamma:`.
- Capture `<evidence>/after/` with the same jobs as the baseline and compare. Check interaction (hover,
  focus, keyboard, reduced motion) with real input, and contrast against the brand rules.
- Record the approved decisions in the development plan (the feature's design decisions and the decision
  log) and integrate with the `integrate` skill when Chris asks.
