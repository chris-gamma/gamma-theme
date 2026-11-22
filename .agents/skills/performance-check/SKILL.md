---
name: performance-check
description: Measure the storefront cost of a theme change on Gamma-Dev - Liquid render profiles per page and per template file, cart render time for test carts, and image bytes and requested widths - comparing a baseline with the branch. Use for changes to Liquid loops and lookups, the product page, cart, campaign pages, images or anything that renders on every page.
---

# Performance check

Measure before and after; one number on its own doesn't say anything. Serve the baseline with
`PREVIEW_PATH` from a `git archive` copy and the branch from the checkout (the `rendered-check` skill
starts both previews). The development plan holds the performance targets and open questions.

## Liquid render time

```sh
scripts/profile.sh <evidence>/prof/after 5 /products/<handle> /en/products/<handle> /collections/<handle>
scripts/profile_summary.py pages <evidence>/prof/after gamma-     # median total and Gamma templates
scripts/profile_summary.py lines '<evidence>/prof/after/products_<handle>.*.json' gamma-promotion-lookup
```

- `shopify theme profile` renders on Shopify's side, so its numbers aren't affected by the preview's page
  cache (which can make Server-Timing on page loads misleading). Use five or more runs per page and
  compare medians; differences under about 10% need more runs before they mean anything.
- Profile the pages the change touches in both languages, including the heaviest real case (a product in
  several campaigns, a long collection, a full cart).

## Cart render time

```sh
node scripts/cart-timing.mjs carts.json 12              # cart page, 12 French samples per cart
node scripts/cart-timing.mjs carts.json 12 big --drawer # the cart drawer, one cart
```

`carts.json` names test carts as variant IDs (`{ "big": [[123, 2], 456] }`); look IDs up on Gamma-Dev.
The section request's `render;dur` is uncached but noisy (±15 ms between runs); take 12+ samples and
compare medians of runs made the same way.

## Images

```sh
node scripts/image-bytes.mjs <evidence>/images.json /collections/<handle> /pages/promotions/<handle>
```

Reports what loads before scrolling and after a full scroll at 1440x900 and 390x844 (`VIEWPORTS` to
change), with product-card images split out: requested width against displayed width, priority and
eager loading. Card images shouldn't load far wider than shown, or eagerly below the first screen.

## Report

Pages, runs and medians before and after, the templates or lines that account for the difference, and
whether it meets the plan's target. Keep raw profiles in the evidence folder, not the repository.
