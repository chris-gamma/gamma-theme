# Changelog

Location Gamma's storefront theme is based on Shopify Horizon 4.4.0.

## Unreleased

### Added

- English/French storefront and editor translations, localized navigation and configurable three-level footer links.
- Gamma logos, Inter/Oswald typography, centred desktop navigation and responsive product titles.
- Gamma Red primary buttons and sale badges using native theme colour settings.
- Configurable product-information accordions with variant/product fallback, Gamma Red dividers and responsive specification tables.
- Failed product selection restores the confirmed variant and cancels Add to Cart actions queued against the failed choice.
- Battery-system identification below the product price with localized icons, system types and collection links, plus native complementary accessory recommendations.
- Language-specific product media: images with filenames ending -en/_en or -fr/_fr show only in the matching language across galleries, zoom, cards, swatches, search, sticky and cart images, falling back to all media when none match.
- Full native controls for product videos, contained video presentation in the gallery and privacy-enhanced YouTube and Vimeo embeds.
- Backorder and special-order notices before purchase controls, per-line cart availability text, product-card availability badges and native per-location pickup.
- Open order notes in the cart, Shopify cart-line status messages, a cart notice on supplier-dependent shipping for backordered and special-order items, hidden Shop Pay options in the cart and mobile Quick Add.
- Bilingual CAD money formatting on product, quantity/volume, quick-order, cart, filter and gift card prices; other currencies keep native formatting.
- Native Shopify privacy controls styled with the theme's typography, corners, wrapping and keyboard focus.
- Brand, product-type, power-source, brand/type and brand/power-source collection templates. Their filters omit the choice the collection already fixes, through new Filters block settings; a link that applies one keeps it visible and removable.
- Home search field under the hero slogan that opens the header search dialog with the same query and suggestions, and stays a plain search form without JavaScript. Width, corners, border, background, text colour and size are editable in the theme editor.
- Rental equipment in search, set up in Theme settings > Search with separate French and English rental site addresses (off by default). The search dialog shows up to four matching rental items above the store's results, with a link to all rental results and a switch to turn them off for the browser tab. A link to the rental site's search appears when nothing matches or the catalogue can't be reached, and the search results page links to it without JavaScript.
- A “Who we are” introduction below the featured products, in a wider column on larger screens, and a heading for the featured products.
- A four-part footer: logo, newsletter sign-up, social links and payment methods; address, telephone and email; and the shop, company, legal and account menus. The powered-by notice is off.
- A contact page with the store's contact details, the page content and the contact form. Department cards written in the content as a display-card-table of display-card boxes form a responsive grid; their styles load only where used.
- A Policy block showing a selected warranty or return-and-exchange entry, as a section or a collapsible row; consecutive collapsible blocks form one list. A warranty page template (warranty-info) and a comparison page template (leaf-blower-chart).
- Store hours in the footer (compact) and on the contact page (full), set in Theme settings > Store hours: an override, otherwise the dated exception in effect, otherwise the regular hours. Exceptions show a holiday notice above a seven-day table. Without reliable hours, customers are asked to contact the store.
- A Map block in the footer and beside the contact page's business details: a static map image with a linked © OpenStreetMap credit and Google Maps and Apple Maps directions from the block's address, all working without JavaScript. Clicking the image loads the block's uMap map in place, with zoom and full-screen controls, a loading indicator, a close button and a failure message with Try again. Without an image, a “Show interactive map” button loads it. Turning maps on or off applies to every map and is remembered on the device; with no choice, maps load as they scroll into view when Shopify's customer privacy settings allow preferences. The uMap map ID, address, images, aspect ratios and widths (up to 480 px) are block settings. The static image is drawn at the map's largest size and centred, so a narrower box crops it like the interactive map; `scripts/generate-map-previews.mjs` generates matching previews.
- Promotion pages from Shopify campaign content in French and English: campaign pages with offers, how each is redeemed (dealer-supplied gifts are never added to the cart), qualifying products as native cards with Quick Add (when only some models qualify, cards link to the eligible model; at most 60 per page) and rental equipment cards; notices when a promotion is scheduled, paused, ended or unavailable, with manufacturer claim instructions kept until their deadline; a promotions index sorted by priority and end date with sponsor badges, paged 24 at a time and fully listed without JavaScript; and a callout on collection pages. Time-limited content disappears from open pages when it ends.

### Changed

- French contact and newsletter forms say “Courriel” instead of “E-mail”, and the password page sign-up button reads “Subscribe”. Long email addresses wrap instead of widening narrow layouts.
- French backorders read “En rupture de stock” (“En rupture” on product-card badges); “Épuisé” is for sold-out items.

- Updated the Horizon foundation from 4.3.0 to 4.4.0, keeping Gamma's customizations and English/French locales. Primary buttons use the Accent font's weight.

### Fixed

- Add to cart, Quick Add and discount changes keep the cart in the shopper's language.
- The contact form's phone field accepts ordinary formats such as (514) 481-5631 and +1 514 481 5631 (fix for Horizon 4.4.0 in `blocks/contact-form.liquid`; remove once Horizon stops limiting it to digits and hyphens).
- Back and Forward after changing collection or search filters or sorting update the results, filters and counts (workaround for Horizon 4.4.0; see `assets/gamma-facets-history.js`).
- A query typed while predictive search is loading recently viewed products is no longer erased (fix for Horizon 4.4.0 in `assets/predictive-search.js`; remove once Horizon stops clearing it).
- Enter in the search dialog opens the highlighted suggestion or result, even with a single result (fix for Horizon 4.4.0 in `assets/predictive-search.js`).
