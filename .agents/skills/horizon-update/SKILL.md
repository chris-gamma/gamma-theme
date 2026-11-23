---
name: horizon-update
description: Update the theme to a new stable Shopify Horizon release - verify and tag the release, merge it on a chore/horizon-<version> branch, keep the vendor files and English/French locales right, and re-check every Gamma change inside Horizon's files. Use when Chris asks to update or evaluate a Horizon version.
---

# Horizon update

`README.md` ("Updating Horizon") and AGENTS.md ("Validation and integration") hold the rules. This is the
sequence. The update is a `chore/horizon-<version>` branch; `main` mirrors the last pristine Horizon
release and the `vendor/horizon-v<version>` tags mark each one.

## 1. Pick and verify the release

```sh
git fetch upstream
git log --oneline upstream/main -20
```

- Use a stable release commit ("Horizon v<version>" from Shopify's build bot), not upstream `main`'s
  latest commit. Confirm the version in `config/settings_schema.json` (`theme_info`), the release notes
  and the Theme Store's current version.
- Read the release notes for changes to anything Gamma overrides (product card, gallery, price, search,
  cart, filters, header, footer, slideshow, localization).
- Tag it, in the existing format (ask before pushing the tag):

```sh
git tag -a vendor/horizon-v<version> <commit> -m "Pristine Shopify Horizon <version>; verified <date> against official release commit, version metadata, release notes, and Theme Store."
```

## 2. Merge on a branch

```sh
git switch -c chore/horizon-<version> dev
git merge --no-ff vendor/horizon-v<version> -m "Merge Horizon <version>"
```

- Resolve conflicts keeping both Horizon's change and the Gamma change; every Gamma change inside a
  Horizon file is marked `Gamma:`. Don't fix upstream bugs or restyle while merging.
- Vendor files: Horizon's `README.md`, `LICENSE.md` and `release-notes.md` replace `README-horizon.md`,
  `LICENSE-horizon.md` and `release-notes-horizon.md`; Gamma's `README.md` and `LICENSE.md` stay.
- Locales: keep only `en.default.json`, `fr.json`, `en.default.schema.json` and `fr.schema.json`. Delete
  any other locale file the merge brings back, then check that new storefront and schema keys exist in
  both French and English (add French translations where Horizon added keys). For `fr.json` and
  `fr.schema.json`, compare the incoming file with the previous vendor copy: keep Gamma's text where
  Horizon's string didn't change, apply the Quebec French glossary and spacing in the development plan to
  new and changed keys, list them with old and new text for Chris, and keep the `shopify.*` keys.
  `node .agents/skills/horizon-update/scripts/locale-compare.mjs <previous-tag>:locales/fr.json
  locales/fr.json --en locales/en.default.json` lists the added, removed and changed keys with their
  text, and flags interpolation names, HTML and plural forms that differ from English, and French spacing.

## 3. Check the Gamma changes

```sh
git grep -n 'Gamma:' -- sections blocks snippets assets layout templates config
```

- Walk every marker against the new Horizon code: the selector, variable or markup it relies on must
  still exist and still be the thing to override. The README's update paragraph lists the ones with
  conditions to re-test (the variant-limited campaign card, search notices, card image frame and zoom,
  the full-width phone grid, collection card title clipping, cart line text size, stylesheet order and
  the aliased Horizon variables in `assets/gamma-branding.css`).
- `npm run check:all`: compare Theme Check with the known warnings listed in `README.md`. Update that list
  only for warnings that come from Horizon itself, and say which.
- Rendered check (the `rendered-check` skill) of every template type in both languages at the four
  widths, before (on `dev`) and after, plus the interactions Gamma changes: Quick Add, swatches, filters,
  search dialog, cart notices, campaign pages, maps and store hours. Test the theme editor too, or report
  it as not run.

## 4. Finish

- Update the README's version and known-warnings notes and the changelog in the merge's follow-up commit
  ("Update docs for Horizon <version>").
- Record the update in the development plan, then integrate with the `integrate` skill when Chris asks.
  Moving `main` to the new release needs his approval like any push:

```sh
git branch -f main 'vendor/horizon-v<version>^{commit}'
git push origin main vendor/horizon-v<version>
```
