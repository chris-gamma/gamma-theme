# Changelog

Location Gamma's storefront theme is based on Shopify Horizon 4.4.0.

## Unreleased

### Added

- English/French storefront and editor translations, localized navigation and configurable three-level footer links.
- Gamma logos, Inter/Oswald typography, centered desktop navigation and responsive product titles.
- Gamma Red primary buttons and sale badges using native theme colour settings.
- Configurable product-information accordions with variant/product fallback, Gamma Red dividers and responsive specification tables.
- Failed product-selection recovery that restores the confirmed variant and cancels Add to Cart actions queued against the failed choice.
- Battery-system identification below the product price with localized icons, translated system types and collection links, plus native complementary accessory recommendations.
- Language-specific product media: images whose filenames end in -en/_en or -fr/_fr appear only in the matching language across galleries, zoom, cards, swatches, search, sticky and cart images, falling back to all media when a product has none for the current language.
- Full native controls for product videos, contained video presentation in the product gallery, and privacy-enhanced YouTube and Vimeo do-not-track embeds.
- Backorder and special-order notices before purchase controls, per-line cart availability text and evidence-based product-card badges, with native per-location pickup enabled.
- Open order notes in the cart, Shopify cart-line status messages, and a cart notice explaining supplier-dependent shipping for backordered or special-order items and how orders mixing in-stock items ship together; Shop Pay payment options are hidden in the cart and mobile Quick Add is enabled.
- Bilingual CAD formatting across product, quantity/volume, quick-order, cart, filter and gift-card displays, retaining native formatting for other currencies.
- Native Shopify privacy controls styled with the theme's typography, corners, wrapping and keyboard focus, retaining all consent choices and preference reopening.
- Brand, product-type, power-source, brand/type and brand/power-source collection templates. Their filters omit the brand, product-type or power-source choice the collection already fixes, through new Filters block settings, while a link that applies one keeps it visible and removable.
- A home search field beneath the hero slogan. Typing opens the header's search dialog with the same query, suggestions and keyboard navigation; it remains an ordinary search form, with a submit button, when that dialog isn't ready or JavaScript is off. The field and the instruction below it, which tells customers suggestions may open as they type, sit on a translucent dark background over the hero image. Width, corners, border, background colour and opacity, text colour and text size are editable in the theme editor.
- Rental equipment in search, set up in Theme settings > Search with separate French and English rental site addresses (enabled with the current rental site; off by default for themes without these settings). The search dialog shows up to four matching items from the rental site's catalogue above the store's own results, as cards with uncropped photos opening each item's rental page in a new tab, and a link beside the heading that opens all rental results in a new tab. With rental search on, the dialog grows to use more of a tall desktop window. A switch beside the heading turns rental results off for the rest of the browser tab's visit: the catalogue is no longer searched, and the heading keeps a link to see rental results on the rental site. The group stays hidden when nothing matches, replaces the store's “no results” message when only rentals match, and offers a rental site search link if the catalogue can't be reached. The search results page links to the same rental search, without needing JavaScript.

### Changed

- French backorders read “En rupture de stock” (“En rupture” on product-card badges) instead of “Épuisé”, which is reserved for sold-out items.

- Updated the Horizon foundation from 4.3.0 to 4.4.0, retaining Gamma's customizations and English/French locales. Primary buttons now use the Accent font's weight, as configured.

### Fixed

- Adding to cart, Quick Add and discount changes keep the cart in the shopper's language instead of re-rendering English carts in French.
- Back and Forward after changing collection or search filters or sorting now update the results, filters and counts instead of leaving the later results on screen (workaround for Horizon 4.4.0; see `assets/gamma-facets-history.js`).
- A search query typed while predictive search is still loading recently viewed products is no longer erased about 100 ms later (fix for Horizon 4.4.0 in `assets/predictive-search.js`; remove once Horizon stops clearing a typed query when it loads the empty state).
- Pressing Enter in the search dialog opens the highlighted suggestion or result, even when the search has exactly one product, collection, page or article result (fix for Horizon 4.4.0 in `assets/predictive-search.js`).
