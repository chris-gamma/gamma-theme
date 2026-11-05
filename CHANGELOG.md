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

### Changed

- French backorders read “En rupture de stock” (“En rupture” on product-card badges) instead of “Épuisé”, which is reserved for sold-out items.

- Updated the Horizon foundation from 4.3.0 to 4.4.0, retaining Gamma's customizations and English/French locales. Primary buttons now use the Accent font's weight, as configured.

### Fixed

- Adding to cart, Quick Add and discount changes keep the cart in the shopper's language instead of re-rendering English carts in French.
- Back and Forward after changing collection or search filters or sorting now update the results, filters and counts instead of leaving the later results on screen (workaround for Horizon 4.4.0; see `assets/gamma-facets-history.js`).
