# Sales Campaign System — selected architecture (custom app)

Location Gamma · revised 2026-11-09 · section 6 pinned as the G18 contract, with its theme snippets implemented locally; `promotion.sponsor` now references the shared `brand` definition (section 6). The rest is planning. On Gamma-Dev, `brand`, the four SCS definitions and test campaigns exist (set up in Admin on 2026-11-09). Storefront presentation follows the visual design language defined in the [development plan](development-plan.md); section 12 summarises what it means for the SCS.

This document describes the selected architecture for the Sales Campaign System (SCS): a purpose-built custom Shopify app, self-hosted on the VPS that already serves the WordPress rental catalogue, administering campaign content and Shopify-native financial promotions for a Liquid storefront that never depends on the app at runtime. It incorporates the decisions approved on 2026-11-08 (section 2) and supersedes this document's earlier recommendations, which assumed managed hosting, PostgreSQL, automatic free-gift cart insertion and a phased no-app launch. The companion [no-app proposal](scs-redesign-proposal-no-app.md) remains as a read-only comparison and emergency fallback reference; it is not the selected design.

**Evidence base.** Repository and Git history (`AGENTS.md`, `README.md`, `docs/development-plan.md`, the current theme's cart, availability, product, collection and localization code), the prototype theme and `sales-campaign-manager` app, the `location-gamma-audit` reports, the supplied STIHL and ECHO dealer documents, read-only Admin GraphQL queries against `location-gamma.myshopify.com`, public HTTP and REST requests to the rental site, Shopify Dev MCP and help.shopify.com, Prisma documentation, Quebec Office de la protection du consommateur (OPC) guidance and Canadian manufacturer sources. Nothing was changed in the repository, Shopify, WordPress, the VPS or Git.

**Labels.** **Verified**: confirmed against a cited source, the store or a public response. **Inference**: reasoned from verified facts. **Recommendation**: a design choice. **Unverified**: needs the named proof of concept (POC), server check or business/legal confirmation.

---

## 1. Summary

- **Campaign content lives in Shopify.** Four merchant-owned metaobject definitions (`promotion`, `promotion_offer`, `promotion_group`, `rental_item`) hold every published campaign, in French and English. The theme renders campaign pages, product-page notices and cart-line notices from them with Liquid only.
- **The app is the administration tool.** An embedded app (Shopify React Router template, Polaris web components, App Bridge, Admin GraphQL API) lets staff create, translate, preview, validate, schedule, publish, pause, end, archive and duplicate campaigns. Staff rarely touch the underlying records.
- **Financial promotions are native Shopify resources the app manages.** Promotional prices (price and compare-at), automatic percentage or fixed-amount discounts, discount codes and native kit or bundle prices. The app creates them from one configuration, reads them back, detects conflicts and drift, schedules price changes and restores prices safely. Shopify alone decides what the customer pays.
- **Free gifts are dealer-fulfilled promotional benefits, not checkout discounts.** The customer buys the qualifying equipment normally; Location Gamma supplies the gift. The storefront explains the gift on the campaign page, the product page and under each qualifying cart line, including that a backordered gift may delay the order. Nothing is added to the cart, and the app never touches orders.
- **Staff identify gift-entitled orders with native Shopify order tools**, guided by a read-only gift reference in the app and, optionally, a separate Shopify Flow workflow.
- **The app runs on the existing VPS** as one Node.js service behind the existing nginx, with its own database in the existing MariaDB if the server checks pass. The storefront, cart and checkout keep working if the app or the VPS is down.

---

## 2. Approved decisions and scope

| Decision | Consequence in this design |
| --- | --- |
| **A. Build the app** for Location Gamma only (not App Store) | Custom app; part of the launch implementation. A manual Shopify Admin fallback exists only for emergencies or a genuine launch blocker |
| **B. Self-host on the existing VPS**; prefer the existing MariaDB | One systemd service, nginx route, separate MariaDB database and user, subject to the server checklist (section 15) |
| **C. Dealer-fulfilled free gifts** | No cart insertion, no Buy X Get Y (BXGY) for gifts, no reward lines, no client reconciliation, no artificial pricing |
| **D. Gift backorder notices** | Line-specific notices in both languages; no promised dates, separate shipping or immediate availability |
| **E. Strict app scope** | Table below; enforced also by the app's access scopes (no order, customer or fulfillment scopes) |

**The app manages:** campaigns and their content; offers, groups, eligibility and related products; manufacturer and dealer promotion information; French and English content; scheduling and lifecycle; native promotional prices; native automatic and code discounts; discount configuration, validation and conflict detection; promotional claim accuracy; preview and publication; campaign health and diagnostics; the data the theme needs for campaign pages and product and cart notices.

**The app does not:** add gifts to carts or orders; fulfil, ship, reserve or track gifts; manage inventory or purchase orders; manage manufacturer reimbursement or warranty registration; process returns; read, tag or edit orders; send customer notifications; manage rental transactions or calculate rental rates; integrate Rental Expert or Point of Rental; customize checkout; replace Shopify's discount calculation. A dealer-fulfilled gift is a first-class promotional offer in the SCS; its fulfilment is a merchant operation outside the app (section 9).

Shopify plan: **Grow**; Plus is not an option.

---

## 3. Requirements and manufacturer evidence

### Requirements

- Manufacturer (STIHL, ECHO, Shindaiwa), store, rental and product-free informational campaigns, each with any number of offers, groups, gifts, terms, artwork and per-offer dates, in French (at `/`) and English (at `/en`).
- Lifecycle: draft, validation, scheduling, live, pause and resume, natural or early end, archive and deep-duplicated reuse, with no correctness limit tied to small campaign counts.
- Shopify is authoritative for prices, compare-at prices, discounts, cart and checkout. Financial claims appear only after the app has verified the Shopify resources behind them and disappear before those resources are removed.
- Gift claims state exactly what the storefront can establish: qualified, conditionally qualifying, or subject to staff confirmation.
- Manufacturer minimum advertised price (MAP) policies and Quebec advertising rules are respected; no confidential dealer data appears in campaign content.
- Rental campaigns may show grouped cards linking to the existing WordPress catalogue; no catalogue migration, booking, rate calculation, inventory synchronization, or Rental Expert / Point of Rental integration.
- The app tolerates a year or more between development updates within Shopify's 12-month API support window, with a documented maintenance schedule.

### Canadian campaign evidence (2024–2026; 2021–2023 not verifiable — no archive access)

| ID | Campaign | Offers and conditions that shape the design | Source |
| --- | --- | --- | --- |
| S1 | **STIHL Canada Fall Promotions 2026** (→ Nov 20, 2026) | 7 offers: free 4 Ah battery **and** Wood-Pro kit with AK chainsaw sets; free 4 Ah battery with AK blower sets; AP chainsaw and blower special kit prices ("cannot be combined" with the extra-battery offer); free extra AP battery requiring **an AP tool plus an AP battery** ("free battery model varies", exclusions); free Wood-Pro kit with 6 gas saws; "Save on power tools" (8 was/now prices, no end date stated). "While supplies last at participating dealers." | [stihl.ca](https://www.stihl.ca/en/news/promotions/promotions) |
| S2 | STIHL Direct Fall 2026 | shop.stihl.ca only; free battery "won't show in your cart" but ships | [shop.stihl.ca](https://shop.stihl.ca/pages/spring-promotions) |
| S3 | STIHL Holiday AS 2025 (Nov 24 – Dec 19) | Free AS 2 with 9 AS sets; manufacturer redemption form by Dec 31 | stihl.ca excerpt |
| S4 | STIHL Fall 2025 (Aug 1 – Nov 21) | Free 4 Ah with AK sets, shop.stihl.ca redemptions only | [stihlpromos.ca](https://www.stihlpromos.ca/4ah-battery/english.php) |
| S6 | **STIHL Autumn 2024** (Aug 1 – Nov 22) | **Free GTA 26 with any two AS sets on the same receipt**; free AK 30 with sets; separate in-store and online redemption; redeem by Nov 30 | [stihl.ca/en/autumn](https://stihl.ca/en/autumn) |
| S7 | STIHL Autumn Professionals 2024 | Free AR battery with BGA 300 or RMA 765 V **plus** an AR battery; free AP 300 S with an AP tool **plus** an AP 300 S | [stihl.ca](https://www.stihl.ca/en/autumn-professionals) |
| E1 | **ECHO Fall National Sales Event 2026** (Sep 1 – Nov 30) | PB-9510 "on sale for $999.95"; PAS snow thrower $469.95; **free 56V battery tiered by kit** (16 kits 2.5 Ah, 24 kits 5.0 Ah, 2 kits 8.0 Ah; two kits listed in both 5.0 and 8.0); free harness ($49.95 value) with *any* ECHO brushcutter | [echo.ca NSE](https://www.echo.ca/promotions/national-sales-event), [free battery](https://www.echo.ca/promotions/free-battery) |
| E2–E3 | ECHO Spring NSE 2025 / 2026 (Mar 1 – Jul 31) | Free 2.5 Ah with PAS kits, "save up to 20%" PAS bundles (2025, Quebec dealer); promotional prices and free-battery "MAPP exceptions" (2026 workbook) | [Garage Harry Stanley](https://www.garageharrystanley.com/blogs/news/2025-echo-spring-national-sales-event); internal workbook |
| E4 | ECHO One Day Sale | Dealer-chosen date; 15% off select in-stock serialized units; not combinable | [echo.ca](https://www.echo.ca/promotions/one-day-sale) |
| E5 | **Shindaiwa Fleet Week** | Regional week; 15% off **MSRP** on all Shindaiwa units; not combinable; excludes spreaders, sprayers, accessories and parts | [shindaiwa.ca](https://www.shindaiwa.ca/promotions/shindaiwa-fleet-week); 2025 ECHO policy |

### Manufacturer policies (internal; never customer-facing)

- **STIHL 2026 Dealer Support Manual.** MAP "is determined by MSRP or in season promotional prices." The policy deals "solely with advertised price points", not selling prices, and covers dealer websites; it excludes in-store price markings and used or discontinued models. Non-price advertising, price matching, and free delivery, service or financing are compliant unless a dollar value implies a sub-MAP price. A bundle can't be advertised below the sum of its parts. Free goods are allowed if "the cost or value of the free good cannot be subtracted" from the MAP price. Dealer-created ads need pre-approval in the co-op context.
- **ECHO 2025 Policies and Procedures.** A violation occurs if "the advertised price is more than $1.00 below current MAP pricing"; the full ECHO policy is on the dealer portal and wasn't available. One Day Sale and Fleet Week can't be combined with other offers; Fleet Week is "15% off MSRP, NOT Promo Prices." Ads "must not contain false or misleading statements or claims not made by ECHO."
- Reimbursement rates, booking requirements, claim registration, dealer costs and MAP price lists are dealer-only and never stored in campaign content.

### Quebec advertising rules relevant to gifts (verified OPC guidance; legal confirmation recommended)

- The OPC summarizes Consumer Protection Act s. 231: a merchant may not advertise goods it doesn't have in sufficient quantity to meet demand unless the ad states that availability is limited **and gives the quantity**; "limited quantities" or "while supplies last" is not precise enough ([OPC](https://www.opc.gouv.qc.ca/en/consumer/topic/price-discount/promotion/out-of-stock/), [OPC reference](https://cdn.opc.gouv.qc.ca/media/documents/zone_enseignants/pratiques_interdites_corrige-ANG.pdf)). OPC guidance found doesn't address gifts with purchase specifically.
- **Inference and recommendation:** treat an advertised gift as a promise to every qualifying order in the window, fulfilled even when backordered (the backorder notice then states a delay, not a limitation). Reproduce a manufacturer's limited-quantity condition only when the quantity can be stated; never rely on "while supplies last" alone. Commercial advertising must be available in French (Charter of the French language), so the app blocks publication of customer-facing campaign text without French. A legal review of the gift wording and these rules is a launch prerequisite (section 21).

### Requirements the campaigns impose

Ordered multi-offer pages; tiered rewards by model group; multiple gifts from one purchase; quantity conditions ("two sets"); companion conditions ("tool plus battery"); rewards that vary by purchase; was/now prices; kit prices; category-wide eligibility; per-offer dates; manufacturer redemption with deadlines; channel restrictions (shop.stihl.ca-only offers aren't Gamma's to advertise); non-combinability; resolution of source ambiguities before a reward is advertised.

---

## 4. Platform capabilities and Grow limits

| Capability | Classification | Evidence and consequence |
| --- | --- | --- |
| Custom app installed on one store | **Verified available** | [Distribution](https://shopify.dev/docs/apps/launch/distribution/select-distribution-method); custom installation doesn't change plan restrictions |
| Shopify Functions in a custom app (custom discounts, cart transform) | **Plus-only → unavailable** | "Only stores on a Shopify Plus plan can use custom apps that contain Shopify Function APIs" ([docs](https://shopify.dev/docs/apps/build/functions)); store is Grow, `shopifyPlus: false` |
| Native discounts via Admin API: automatic basic (percentage, fixed amount), codes, schedules, product/variant/collection targets, minimums, per-order use caps, combination flags | **Verified available** | [discountAutomaticBasicCreate](https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/discountAutomaticBasicCreate) family; `write_discounts` |
| Native BXGY | Available; **not used for gifts** | Never adds the reward to the cart ([help](https://help.shopify.com/en/manual/discounts/discount-types/buy-x-get-y)); retained only as a possible future financial type if a separate requirement justifies it |
| Same-line stacking of product discounts | **Plus-only** | [Combinations](https://help.shopify.com/en/manual/discounts/discount-combinations); one product discount applies per line on Grow |
| Active automatic discounts | **Restricted: 25**, including app discounts; 5 product/order codes + 1 shipping code per order | Same source; the app tracks a budget |
| Automatic discounts on storefront pages | **Unavailable in Liquid** | They appear only on cart objects (`discount_allocations`); product pages can't show them unless the theme states them from campaign data |
| Scheduled price changes | **Unavailable natively** | Price and compare-at changes need an app job at each boundary |
| Price lists on the primary market | **Requires POC** | Multiple catalogs resolve to the lowest price ([catalogs](https://shopify.dev/docs/apps/build/markets/catalogs)); Grow, primary-market and point-of-sale behaviour unverified |
| Fixed bundles (Shopify Bundles app); `productBundleCreate` from a custom app | Bundles app **available on all plans** ([eligibility](https://help.shopify.com/en/manual/products/bundles/eligibility-and-considerations)); API **requires POC** ("shop must have access to bundles feature") | Used only for genuine kit pricing, never for gifts |
| Order editing (add item, manual line discount) | **Verified available in Admin** to staff; restrictions | Unfulfilled items only; no edits once an order has fulfilled items; not for local delivery or Shop Pay Installments orders ([considerations](https://help.shopify.com/en/manual/fulfillment/managing-orders/editing-orders/considerations)); used in the staff gift procedure, not by the app |
| Shopify Flow on Grow | **Verified available**; "Order created" trigger, order tagging | [Flow](https://help.shopify.com/en/manual/shopify-flow); a condition on line-item product collections is community-reported, **requires POC** |
| Cart and Section Rendering | **Verified available** | Native cart sections re-render on every change; Liquid notices inside them stay synchronized with no custom controller |
| Embedded app: App Bridge, Polaris web components, ID tokens, token exchange, expiring offline tokens | **Verified available** | [App Home](https://shopify.dev/docs/api/app-home/v1.1), [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/implement-token-exchange?lang=node), [expiring tokens](https://shopify.dev/docs/apps/build/security/app-security-checks/expiring-offline-token) |
| App Home UI extension (Shopify-hosted) | Available for custom distribution since 2026-07 | No server logic or webhooks; 64 KB bundle ([blog](https://shopify.dev/changelog/blog/build-app-home-as-a-ui-extension)); insufficient for scheduled price changes and reconciliation |
| Merchant-owned versus app-owned metaobjects | **Verified** | App-owned definitions are deleted on uninstall ([docs](https://shopify.dev/docs/apps/build/metaobjects/manage-metaobject-definitions)); this design uses merchant-owned definitions |
| Metafields on discount nodes and collections | **Verified available** | Ownership markers stored on the resources themselves |
| Translations API | **Verified available**; image and URL translation in practice **requires POC** | `translationsRegister` with digests; `file_reference`, `url`, `link` are translatable types ([types](https://shopify.dev/docs/apps/build/metafields/list-of-data-types)) |
| Liquid limits | **Verified** | 50 iterations per loop; 250 per paginated page; 1,000 entries per metaobject type per render; 20 handle lookups ([limits](https://shopify.dev/docs/apps/build/metaobjects/metaobject-limits)); `product.collections` excludes collections not on the Online Store and isn't paginatable |
| Webhooks: `discounts/*`, `metaobjects/*`, `products/*`, `collections/*`, `app/uninstalled`, compliance topics | **Verified available** | [Topics](https://shopify.dev/docs/api/admin-graphql/2026-10/enums/WebhookSubscriptionTopic) |
| API support window | **Verified**: each stable version supported ≥ 12 months, expired versions fall forward | [Versioning](https://shopify.dev/docs/api/usage/versioning); the app needs at least a yearly update |
| Prisma and MariaDB | **Verified**: Prisma ORM 7 supports MySQL and MariaDB (driver adapter `@prisma/adapter-mariadb`); Prisma ORM 8 (release candidate) **doesn't support MariaDB yet** | [Prisma supported databases](https://www.prisma.io/docs/orm/supported-databases); the app pins Prisma 7 (section 15) |

**Remaining true Grow limits.** No custom-app Functions (so no custom discount logic, cart transforms or checkout validation); one product discount per cart line; 25 active automatic discounts; native BXGY can't insert rewards; automatic discounts are invisible to product-page Liquid; no native scheduled price changes; checkout UI extensions in checkout steps are Plus-only. None of these block the selected design.

---

## 5. Architecture and responsibilities

```text
                 Staff (Shopify Admin)
                         │
      Gamma Promotions app (embedded, on the VPS)
      ┌──────────────────┴───────────────────┐
  Admin GraphQL API                      MariaDB database
  (metaobjects, translations, files,     (sessions, journal, jobs,
   collections, discounts, prices)        price snapshots, findings,
      │                                   published versions, audit)
  Shopify (system of record) ──────► Theme (Liquid; no app calls)
      │                                 campaign pages, product notices,
  Checkout enforces money               cart-line gift notices
      │
  Orders ──► staff gift procedure (Shopify Admin, optional Flow)

  WordPress rental pages: link destinations only
```

| Concern | System of record | Writer | Readers |
| --- | --- | --- | --- |
| Campaign content, offers, groups, gifts, rental cards | Shopify metaobjects (merchant-owned) | App; staff only in fallback (detected) | Theme, app |
| Eligibility membership | Shopify collections + group variant lists | App | Theme, discounts, app, optional Flow |
| Collection → promotion back-links | Collection metafield | App | Theme |
| Financial enforcement | Shopify discounts, variant prices and compare-at, bundles | App | Checkout, theme (prices), app |
| Financial intent | Offer `app_config` (JSON, not rendered) | App | App |
| Financial verification state | Offer `enforcement_verified_at` | App | Theme |
| Resource ownership | `$app` metafields on discounts and collections; database cache | App | App |
| Jobs, journal, price snapshots, findings, published versions, audit | MariaDB | App | App |
| Translations | Shopify translations | App | Theme |
| Gift entitlements on orders | Shopify order tags and notes | **Staff** (optional Flow tag) | Staff |
| Rental destinations | `rental_item` metaobjects | App | Theme |

**Failure isolation (verified design property).** Published campaigns, notices, prices and discounts are Shopify data; the storefront and checkout keep working if the app, its database or the whole VPS is down. Only editing, scheduled price changes and drift detection pause, and they catch up on restart (section 11).

---

## 6. Data model and theme contract

Pinned for G18 on 2026-11-08 (`feature/scs-data-contract`). **Provisional** marks behaviour that a Gamma-Dev proof (section 19) can still change; such a change is a coordinated theme and app release.

### Principles

- **Ownership and provisioning.** All four definitions are merchant-owned (types without the `$app:` prefix) so content survives an app uninstall. Shopify declares only app-owned definitions in `shopify.app.toml`, and the `onlineStore` capability isn't supported there, so G22's setup step (or an authorized Gamma-Dev fixture pass before the app exists) creates them at runtime with `metaobjectDefinitionCreate` and the collection metafield with `metafieldDefinitionCreate`, after explicit approval. Setup adopts existing compatible definitions rather than recreating them.
- **Shared Brand.** Sponsors are entries of the merchant-owned `brand` definition (section 6), which the SCS shares with other store features and doesn't own. `promotion.sponsor` references one; neither the theme nor G22 keeps its own list of brands, names or colours.
- **Capabilities.** All four are translatable with `access.storefront: PUBLIC_READ`. `promotion`, `promotion_offer` and `rental_item` are publishable (new entries start as Draft). `promotion_group` isn't publishable: a group is embedded in its offer and is visible wherever a visible offer references it. Only `promotion` is renderable (meta title `title`, meta description `summary`) and has the Online Store capability.
- **Public read isn't privacy.** Fields of an Active public-read entry can be read through the Storefront API as well as Liquid, whatever the theme renders; a scheduled or paused page controls HTML only. Embargoed campaigns and offers stay Draft until release. No dealer-only data belongs in these definitions; G22 must settle private storage for sensitive operational data (for example `app_config` if it would hold anything not publishable) before populating it.
- **Eligibility always lives on groups.** Every offer that targets products has at least one group; the app hides the group level in the editor when there's only one.
- **Stored choices are fixed `snake_case` values,** never translated. The theme maps them to its own locale strings. A translated choice no longer matches, so the theme fails closed. Gamma-Dev showed that Shopify offers choice fields for translation like any text field, so the app never writes them and staff leave them untranslated in Translate & Adapt.
- **Translated copy never decides eligibility.** Labels (`requires_label`, `reward_label`) are display copy; booleans and references decide which conditions exist.
- **French** is entered as Shopify translations of the same fields. Images, URLs and links use translations of the same fields if P-TR passes; explicit French fields (`image_fr`, `url_fr`, …) are **provisional** and are added only if it fails.
- Field order follows the theme's reading order; app-only fields come last and are never rendered.

**Enforcement column:** **S** = Shopify validation on the field definition (required, `choices`, `min`/`max`, `list.max`, `metaobject_definition_id`, `file_type_options`); **A** = G22 validation before publication (also the emergency manual procedure's checklist); **L** = Liquid safeguard in the G18 snippets (the claim is suppressed and a diagnostic code reported). Shopify can't make a field conditionally required, so every conditional rule is A and L.

### `promotion` ("Promotion")

Publishable, translatable, renderable, Online Store with URL handle `promotions` (`/pages/promotions/{handle}`, `/en/pages/promotions/{handle}`; proofs use a temporary handle such as `promotions-g18`, with `createRedirects: false`).

| Key | Type | Required, default, bounds | Enforced |
| --- | --- | --- | --- |
| `title` | `single_line_text_field` | Required; max 80 | S |
| `sponsor` | `metaobject_reference` → `brand` | Required. Replaces the fixed sponsor choices of 2026-11-08. A Draft or deleted Brand reads as blank: the campaign renders without a badge | S; A (Active Brand before publication); L (no badge) |
| `business` | `single_line_text_field`, choices `equipment_sales`, `equipment_rental`, `sales_and_rental` | Required | S |
| `summary` | `multi_line_text_field` | Required; max 220 | S |
| `eyebrow` | `single_line_text_field` | | |
| `intro` | `rich_text_field` | | |
| `image` | `file_reference` (`Image`) | French artwork as a translation (provisional) | S |
| `starts_at`, `ends_at` | `date_time` | Blank = unbounded on that side; end after start | A; L (`invalid`) |
| `paused` | `boolean` | Blank = not paused | |
| `priority` | `number_integer` | 1–99; blank = 50 | S; L (out of range = 50) |
| `offers` | `list.metaobject_reference` → `promotion_offer` | Max 12; ordered | S |
| `button` | `link` | HTTPS | A |
| `terms` | `rich_text_field` | Campaign fine print | |
| `source` | `url` | Official manufacturer page; HTTPS | A |

### `promotion_offer` ("Promotion offer")

Publishable (Draft = offer hidden), translatable.

| Key | Type | Required, default, bounds | Enforced |
| --- | --- | --- | --- |
| `title`, `summary` | `single_line_text_field`, `multi_line_text_field` | Required | S |
| `label` | `single_line_text_field` | | |
| `details`, `terms`, `how_to` | `rich_text_field` | `how_to` carries manufacturer redemption steps and deadlines | |
| `benefit` | `single_line_text_field`, choices `promotional_price`, `percent_or_amount_off`, `kit_price`, `free_gift`, `manufacturer_rebate`, `financing`, `rental_rate`, `information` | Required. `financing` is reserved: no supported redemption yet, so it's rejected | S; A; L |
| `redemption` | `single_line_text_field`, choices `price_shown`, `automatic`, `discount_code`, `supplied_by_gamma`, `manufacturer_fulfils`, `in_store`, `contact_us`, `no_action` | Required; supported pair only (section 7) | S; A; L |
| `funding` | `single_line_text_field`, choices `manufacturer_program`, `location_gamma`, `shared` | Required | S |
| `code` | `single_line_text_field` | Required for `discount_code` (a code per language, as a translation) | A; L |
| `action` | `link` | Manufacturer claim form or details; HTTPS | A |
| `image` | `file_reference` (`Image`) | Offer artwork | S |
| `starts_at`, `ends_at` | `date_time` | Within the campaign window | A; L (clamped, reported) |
| `claim_deadline` | `date_time` | Optional; meaningful only for `manufacturer_fulfils`. Exclusive, like `ends_at`; at or after the offer's effective end. After the purchase window ends it keeps the claim instructions visible until this instant (see Post-sale redemption) | A; L (ignored when blank, unreadable or before the effective end) |
| `groups` | `list.metaobject_reference` → `promotion_group` | Max 8; at least one product group for gift offers | S; A; L |
| `gift_availability` | `single_line_text_field`, choices `guaranteed`, `limited` | Gift offers; blank = `guaranteed` | S; L |
| `gift_quantity_limit` | `number_integer` | Min 1. Required when `limited`: the **advertised, offer-wide** number of qualifying orders, shown to customers | S; A; L |
| `gift_supply` | `single_line_text_field`, choices `normal`, `backordered` | Blank = `normal`; changes wording, never hides the promise | S; L |
| `enforcement_verified_at` | `date_time` | **App-written**, financial offers only (section 10) | L |
| `map_reviewed_at` | `date_time` | App-written; **not part of the Liquid interface** | A |
| `app_config` | `json` | App-only financial intent; **not part of the Liquid interface**; storage provisional (see Principles) | A |

`staff_confirmed_terms` moved to `promotion_group`.

### `promotion_group` ("Promotion group")

Translatable, not publishable. A **product group** has a `collection`; a group without one is a rental or information group and never matches a product.

| Key | Type | Required, default, bounds | Enforced |
| --- | --- | --- | --- |
| `heading` | `single_line_text_field` | Optional; G19 hides the heading of a lone group when blank | |
| `note` | `single_line_text_field` | | |
| `description` | `rich_text_field` | | |
| `collection` | `collection_reference` | The qualifying set: app-managed or existing (G12 brand/type, battery-system); it must carry the back-link | A; L |
| `variants_only` | `boolean` | **Required on product groups.** True: only `variants` qualify; false: the whole collection | A; L |
| `variants` | `list.variant_reference` | Max 50. Nonempty exactly when `variants_only` is true. Deleted variants leave the list silently, so an empty list with `variants_only` true matches nothing. Liquid reads the length through Shopify's documented `count` for reference lists; an uncountable list is unverifiable | S; A; L |
| `min_quantity` | `number_integer` | Min 1; blank = 1. Qualifying units per entitlement | S; L |
| `requires_companion` | `boolean` | **Required on product groups.** True: a companion purchase is required | A; L |
| `requires_collection` | `collection_reference` | Exactly when `requires_companion` is true; a published collection other than `collection`, with no overlapping products. An unpublished companion collection reads as blank in Liquid (Gamma-Dev), so the group is invalid (`companion_missing`) and its claim suppressed | A; L |
| `requires_quantity` | `number_integer` | Min 1; blank = 1. Companion units per entitlement | S; L |
| `requires_label` | `single_line_text_field` | Required when `requires_companion` is true ("an AP battery"); display only | A; L |
| `staff_confirmed_terms` | `boolean` | Blank = false. Conditions the storefront can't check: notices say "may qualify" | |
| `reward_label` | `single_line_text_field` | Required on product groups of gift offers ("4 Ah battery (AK 30 S) and Wood-Pro kit") | A; L |
| `reward_varies` | `boolean` | Blank = false. The gift model depends on the purchase; G20 adds the "model confirmed by Gamma" statement | |
| `rewards` | `list.variant_reference` | Max 3. Optional image, link and staff SKU; never affects entitlement, stock or purchasability | S; L |
| `reward_quantity` | `number_integer` | Min 1; blank = 1. Gifts per entitlement | S; L |
| `reward_limit` | `number_integer` | Min 1; blank = no limit. **Per-order** gift cap, distinct from the offer's advertised `gift_quantity_limit` | S; L |
| `rental_items` | `list.metaobject_reference` → `rental_item` | Max 24 | S |
| `link` | `link` | Category, rental search or "Shop all" | A |

**Why reward product references are optional.** A referenced variant gives an image, a link, an automatically translated product title and an exact SKU for staff. But a gift can be a promotion-only item (Wood-Pro kit packs, harnesses) that isn't sold online, or a sold-out battery. The theme therefore always displays `reward_label`, adds the image and link only when the referenced product is published, and **never** makes the gift notice depend on the reward's purchasability or stock. Gift supply is expressed only through `gift_supply`.

### `rental_item` ("Rental equipment")

Publishable, translatable, reusable.

| Key | Type | Required, default, bounds | Enforced |
| --- | --- | --- | --- |
| `title` | `single_line_text_field` | Required | S |
| `url` | `url` | Required. English page; the French page as a translation (provisional). HTTPS on a configured rental origin (see Routes and links) | S; A; G19 L |
| `image` | `file_reference` (`Image`) | Imported into Shopify Files | S |
| `note` | `single_line_text_field` | | |
| `catalogue_ref` | `json` | App-only: English and French WordPress post IDs; not part of the Liquid interface | A |

### `brand` ("Brand"), shared

Merchant-owned, publishable, translatable, `access.storefront: PUBLIC_READ`; no Online Store pages. Managed by staff in Shopify Admin → Content and shared by the SCS and other store features: it is not one of the four SCS definitions, and neither G22's setup nor its uninstall creates, changes or deletes it. Created on Gamma-Dev on 2026-11-09 with entries `location-gamma`, `stihl`, `echo`, `shindaiwa` and `ego`; not yet on Primary.

| Key | Type | Required, default, bounds | Theme use |
| --- | --- | --- | --- |
| `name` | `single_line_text_field` | Required. Customer-facing name, translated in Translate & Adapt when it differs in French | Badge text |
| `badge_color` | `color` | Optional | Badge fill when `use_theme_brand_color` isn't set |
| `use_theme_brand_color` | `boolean` | Blank = false. True for Location Gamma | Badge fill from the active theme's brand colour (`settings.color_palette.brand`), so it follows theme changes |
| `logo` | `file_reference` (`Image`) | Optional | Reserved; not displayed. Logos are shown only from approved brand packages |

**Existing relationships (Gamma-Dev, 2026-11-09).** `battery_system.brand` (optional single Brand reference), `warranty_policy.brands` and `return_exchange_policy.brands` (optional Brand lists) were added to existing definitions and backfilled for four STIHL battery systems, six STIHL warranty policies and one STIHL return policy. The theme doesn't read these references yet; existing battery-system, warranty and return content is unchanged.

**Ownership boundary.** Shopify Admin owns every definition, Brand entry, colour, translation and reference, and their migration between stores. The theme owns only presentation: it reads a Brand through a reference and contains no Brand IDs, handles, names or colours. G22 reads Brand entries as its source of truth (sponsor picker, filters, MAP rules keyed to Brand IDs) and never keeps a separate brand registry; whether staff may create Brand entries from the app is decided with G22.

### Collection metafields

| Namespace and key | Type | Rule | Enforced |
| --- | --- | --- | --- |
| `promotion.promotions` | `list.metaobject_reference` → `promotion`, max 5 | Merchant-owned definition on `COLLECTION`, public read. The app writes it on every qualifying collection of a live, scheduled or ended (not archived) campaign, including existing G12 collections it doesn't own. It drives the product and cart lookup and collection-page callouts | S; A; L (over 5 suppresses the lookup) |
| `seo.hidden` | `number_integer` = 1 | On app-created eligibility collections, which stay published to the Online Store. **Provisional:** P-B confirms they still appear in `product.collections` while hidden from search engines, the sitemap and storefront search | A |
| `$app:scs.owner` | app-owned | Owning promotion, offer and group, intent fingerprint, app version; on app-created collections and discount nodes. Not part of the Liquid interface | A |

### MariaDB tables (operational state only; no catalogue, content or order data)

| Table | Purpose |
| --- | --- |
| `Session` | Template session storage (expiring offline token and refresh metadata, encrypted at rest) |
| `Operation` | Journal of plan steps: target resource, before/after summary, idempotency key, status, error, actor |
| `Job` | Due time, kind (price start, price restore, verification, archival, reconcile), lease, attempts, state |
| `PriceSnapshot` | Per variant: expected regular price and compare-at, applied values, restored values |
| `Finding` | Health issue, severity, resource, first and last seen, resolution |
| `PublishedVersion` | Immutable snapshot of a campaign's customer-facing terms at each publication, so entitlements remain auditable after edits or expiry |
| `AuditEvent` | Staff user, action, campaign, summary |
| `Setting` | MAP rules keyed to Brand entry IDs, claim margin, retention, discount budget reserve, rental origins, alert address |

JSON values are stored as text columns serialized by the app, which avoids depending on MariaDB's JSON-alias behaviour.

### Theme contract (stable interface)

The theme reads only the fields above, by key, and never `app_config`, `map_reviewed_at`, `catalogue_ref`, a Brand's `logo` or ownership metafields. Sponsor badges on the index cards, the campaign hero and collection callouts come from `snippets/gamma-brand-badge.liquid`, which reads the referenced Brand's `name`, `use_theme_brand_color` and `badge_color` (in that precedence: theme brand colour, then `badge_color`, then a neutral outline), sets black or white text by whichever contrasts more (at least 4.5:1 for any fill) and renders nothing for a missing, Draft or wrong-type reference. App-written fields mean the same whether written by the app or, in the emergency fallback, by staff. New optional fields can be added without theme changes; renaming or removing a field is a coordinated theme and app release. The app never edits theme files.

The G18 snippets apply the contract once for every surface. They output fixed codes, IDs, list positions and Unix seconds only (no translated text), take an optional `at` evaluation time in Unix seconds (as `gamma-store-hours-entry` does) and are not rendered on any customer-facing entry point until G19/G20 call them. Each snippet's LiquidDoc header is authoritative for its exact output and diagnostic codes.

| Snippet | Input | Output |
| --- | --- | --- |
| `gamma-promotion-state` | `promotion`, `at` | `state\|start\|end\|notes` |
| `gamma-promotion-offer` | `offer`, the campaign's state output, `at` | `state\|claim\|start\|end\|hide_at\|notes` |
| `gamma-promotion-lookup` | `product`, the selected `variant`, `at` | `status\|notes\|records` (16 colon-separated fields per record) |
| `gamma-promotion-group` | Private helper of the lookup | One group's scope result |

**Campaign state,** first match: `unavailable` (blank or wrong type: Draft, archived and deleted look the same) → `invalid` (an unreadable non-blank date, or end ≤ start) → `ended` (at ≥ end) → `paused` → `scheduled` (at < start) → `live`. Start inclusive, end exclusive, absolute instants (DST-safe); a blank boundary is unbounded, which is distinct from an unreadable one. The app owns retention and archival: an ended entry stays `ended` until the app sets it to Draft. G19 displays the end minus one second as the last valid day, omits offers on ended pages and keeps embargoed content out of scheduled pages.

**Offer state and claim.** The effective window is the intersection of the campaign's and the offer's windows; an explicit offer date outside the campaign is clamped and reported, and G22 validates containment. A non-live campaign makes the offer `inactive`; an unreadable or empty window makes it `invalid`. The claim class comes from the supported pair (section 7) and is `none` unless the offer is `live` and its conditional data is present:

| Class | Pairs | Extra gate | `hide_at` |
| --- | --- | --- | --- |
| `financial` | `promotional_price`/`kit_price` + `price_shown`; `percent_or_amount_off` + `automatic` or `discount_code` (code required) | `enforcement_verified_at` at or before the evaluation time and, when the effective window has a start, at or after it; a finite effective end | Effective end − 1,800 s (**provisional**, set by P-D). Without a finite end the claim is held pending P-D and a decision |
| `gift` | `free_gift` + `supplied_by_gamma` | Known `gift_availability` and `gift_supply`; a positive `gift_quantity_limit` when `limited`; per-group gift data (lookup, G19) | Effective end |
| `instructions` | `free_gift` + `manufacturer_fulfils` or `in_store`; `percent_or_amount_off` + `in_store`; `manufacturer_rebate` + `manufacturer_fulfils`; `rental_rate` + `in_store` or `contact_us` | — | Effective end |
| `information` | `information` + `no_action` | — | Effective end |

G22 clears `enforcement_verified_at` before changing any enforcement input (targets, value, dates, codes, prices) and writes it again only after a successful read-back. A manufacturer's redemption deadline (`claim_deadline`, `how_to`, `action`) is separate from the purchase window: it never extends eligibility.

**Post-sale redemption (adopted 2026-11-09).** After the purchase window ends, a campaign page may show only the redemption instructions (`how_to`) and a valid HTTPS claim link (`action`) for eligible past purchases, and only for a published `manufacturer_fulfils` offer whose purchase window (the campaign window intersected with the offer's) is readable, nonempty, finite and over, and whose `claim_deadline` is still in the future. The purchase window is validated independently of the live-offer gate. The view says "for eligible purchases made between {start} and {end}", or "made on or before {end}" when the window has no start, with dates only and {end} the last valid day; it shows no prices, product cards, gifts or purchase calls to action, disappears at the deadline (also on loaded pages) and leaves the ended page noindex. G22 archives a campaign after the later of normal retention and its last applicable claim deadline.

**Lookup.** `product.collections` (Online Store collections only) → each collection's `promotion.promotions` → each distinct live campaign once → its offers with a claim → every group whose `collection` contains the product. A group matches only through the back-link on its own collection; the lookup keeps which collection supplied each back-link. An offer is evaluated under every live campaign that references it, and within each campaign all of its relevant groups are checked before it's emitted: an invalid group (missing or contradictory scope or gift data), a second eligible group (even with the same reward) or a missing back-link suppresses the offer under that campaign only, so a failure under one campaign never hides a valid match under another. If an offer matches under several campaigns, only its first record in sort order is kept. Separate offers can all match. A product that is only in a companion collection doesn't match. Each record carries the qualifying and companion collection IDs, minimum and companion quantities and the staff flag as independent conditions, so several can apply at once; G20 counts a cart line that is in both sets toward the qualifying set only, and G22 rejects that overlap. Records are ordered by campaign priority (1 first; blank 50), earlier effective end (open-ended last), the offer's authored position in its campaign, then promotion ID and offer ID as a stable tie-break. G20 applies the product notice limit after resolution.

Records give positions from the same render plus the expected IDs, so callers can resolve entries without `metaobjects.TYPE[handle]` lookups (20 per render) or a second traversal, and must confirm each ID. Gamma-Dev (2026-11-09) showed that Draft and deleted entries are omitted from reference lists: `size` and `count` exclude them and later entries move up, with no blank placeholders. Positions are therefore positions among visible entries in the same render, which is what the lookup records and what a caller iterating the same list sees.

**Lookup budget.** The schema ceilings allow 50 collections × 5 back-links = 250 campaign references, × 12 = 3,000 offers and × 8 = 24,000 groups per product before deduplication, while Shopify loads at most 1,000 unique entries of each metaobject type per page render and errors beyond that. Each lookup counts the references in every list it loads, including the list that triggers suppression and an offer's groups again under each campaign that references it. Before loading a list it reserves that list's ceiling (5, 12 or 8) and stops if the reservation would pass the budget: 30 campaign references, 8 distinct campaigns, 50 offer references and 200 group references. A list stored above its ceiling, a budget reached, or 50 product collections (possibly truncated; warnings from 45) suppresses the whole result with a diagnostic. While the Shopify-enforced ceilings hold, one call therefore loads at most 30 `promotion`, 50 `promotion_offer` and 200 `promotion_group` references, plus the variant lists of relevant groups. Each offer reference yields at most one record, so the lookup's final sort never receives more than 50 records, within Shopify's 50-iteration `for` limit; a result above 50 is suppressed (`records_over_limit`), never truncated. **Provisional:** a list stored above its ceiling (only possible if a `list.max` validation is missing) is detected after its length is read; whether reading the length loads its entries, and when Shopify loads list entries at all, can't be verified locally. Gamma-Dev test: on a disposable definition without `list.max`, give one collection more references than the ceiling and render a scratch probe that only reads the list's length; then repeat with lists whose combined unique entries exceed 1,000 without iterating them. No Liquid error means reading the length doesn't load entries; an error means oversized lists count in full, and the setup must keep every `list.max` validation in place (G22 checks it). **G20** must keep an aggregate across a cart below the per-type limit (the per-call worst case allows only about five lines with disjoint campaigns): count loads across lines, stop resolving further lines when the aggregate reaches its budget and make no claim for unresolved lines. **G19**'s index must read campaign-level fields only (up to 250 per paginated page) and never resolve every campaign's offers and groups.

### Routes and links

- **Campaign pages** link to `promotion.system.url`, never to a hard-coded `promotions` path, so moving the URL handle at cutover needs no theme change. Gamma-Dev showed that `system.url` already carries `/en` on English routes, so no prefix fallback is used. A detail route whose entry is Draft, deleted or missing returns the parent page (the index) with status 200 and no entry content; Liquid can't change that status.
- **The index** is the Shopify page with handle `promotions`, assigned the `page.promotions` template (G19); links use that page's URL. `/pages/promotions` is the canonical index in each language; the Gamma-Dev proof handle `promotions-g18` is retired through the migration recorded under G18 in the development plan.
- **Rental links (G19).** Use `rental_item.url` only when it is HTTPS without credentials, query or fragment surprises and starts with the current language's configured rental site address (`gamma_rental_site_fr` or `gamma_rental_site_en`). When the French address extends the English one on the same host (`https://www.locationgamma.com/fr/`), an English route rejects URLs under the French address. `snippets/gamma-rental-url.liquid` already validates these addresses but outputs nothing when rental search (`gamma_rental_search`) is off; rental cards must not depend on that search toggle, so G19 applies the same address checks without it.
- Translated artwork, URLs and links follow P-TR (Principles).

---

## 7. Promotion types and how real offers are expressed

### Classes

| Class | Shopify enforcement | Customer sees | Verification |
| --- | --- | --- | --- |
| **F1 Promotional price / kit price** | Variant price and compare-at set by app jobs (or a price list if POC P-PL passes); kits as products or fixed bundles | Native was/now prices on cards and product pages | App read-back of prices after each job |
| **F2 Automatic discount** | Automatic percentage or fixed amount on collections, products or variants, native schedule | "Applied automatically at checkout" | App read-back + staff checkout-summary check |
| **F3 Discount code** | Code discount, one code per language, native schedule | "Use code … at checkout" | Same as F2 |
| **G Dealer gift** | None (fulfilled by Gamma after the order) | Gift notices on campaign, product and cart | Content, eligibility and operational validation |
| **M Manufacturer fulfils** | None | Claim instructions and deadline (rebates, manufacturer-shipped gifts) | Content validation |
| **R In store / contact** | None | In-store or contact instructions (rental, Fleet Week in store) | Content validation |
| **I Information** | None | Text only | Content validation |

Valid benefit/redemption pairs: Free gift → Supplied by Gamma, Manufacturer fulfils or In store; Promotional and kit price → Price shown; Percentage or amount off → Automatic, Discount code or In store; Rebate → Manufacturer fulfils; Rental → In store or Contact us; Information → No action. Financing has no approved pair yet: it is reserved and rejected until one is agreed. Section 6 lists the stored values and the claim class of each pair (F1–F3 are `financial`, G is `gift`, M and R are `instructions`, I is `information`). BXGY is not a class; it can be added later as F4 only for a separately approved financial requirement.

### Real offers

| Offer | Representation | Class |
| --- | --- | --- |
| S1(1) AK chainsaw set → 4 Ah battery **and** Wood-Pro kit | Group: collection = 3 sets; `reward_label` "4 Ah battery (AK 30 S) and Wood-Pro kit"; `rewards` both | G (multiple gifts, one entitlement) |
| S1(2) AK blower set → 4 Ah battery | Group: 2 sets; reward AK 30 S | G |
| S1(3–4) AP kit special prices | Price plan on kit products; terms "cannot be combined with the extra-battery offer" | F1 |
| S1(5) AP tool **+** AP battery → extra AP battery, model varies, exclusions | Group: collection = eligible AP tools (exclusions applied by the app-built collection); `requires_companion` true, `requires_collection` = AP batteries, `requires_label` "an AP battery"; `reward_label` "an additional AP battery (model depends on your purchase)", `reward_varies` true; no reward reference | G (companion condition; reward not fixed) |
| S1(6) Gas saw → Wood-Pro kit | Group: 6 saws; reward Wood-Pro kit | G |
| S1(7) Save on power tools | Price plan, 8 products. The source states no end date: a financial claim needs an approved finite window before it can appear (open-ended financial claims are held) | F1 |
| S6 Two AS sets on one receipt → GTA 26 | Group: AS sets, `min_quantity` 2; reward GTA 26 | G if Gamma supplies; M if STIHL redeems |
| S3 Holiday AS 2 battery by redemption form | Offer with `action` = form, deadline in `how_to` | M |
| S2/S4 shop.stihl.ca-only offers | Not advertised by Gamma | — |
| E1 PB-9510, snow thrower | Price plans | F1 |
| E1 tiered free battery | Three groups (2.5 / 5.0 / 8.0 Ah), each with its kits (variant narrowing where kits are variants of one product) and battery; the two ambiguous kits sit in a fourth group with `reward_label` "a 56V battery (5.0 or 8.0 Ah — we'll confirm the size)", `reward_varies` and the group's `staff_confirmed_terms`, until ECHO resolves them; no kit may sit in two groups of the offer | G |
| E1 harness with any ECHO brushcutter | Group: existing ECHO brushcutter collection; reward harness. No conflict with the battery tiers, because gifts aren't discounts | G |
| E4 One Day Sale / E5 Fleet Week | In store (R), or online as an automatic 15% discount on an app-built Shindaiwa collection with exclusions (F2) after MAP confirmation; Shindaiwa price plans are suspended that week because the rule is 15% off **MSRP**. The data fits either way; the online F2 form also needs the G21/G22 proof that the discount is computed from MSRP rather than a promotional price | R or F2 |
| Rebates, guarantees | M or I | M, I |
| Cleaning and sanding rental | Group headings with rental items; In store | R |

Because gifts no longer need to fit BXGY, every researched manufacturer gift offer can be presented online truthfully; only shop.stihl.ca-only offers are excluded.

---

## 8. Dealer-fulfilled gifts: qualification and presentation

### What the storefront can establish

| Condition | Liquid evaluation | Wording |
| --- | --- | --- |
| Product or variant in the qualifying set | Reliable (collection membership + variant list) | "Complimentary with this purchase" |
| Quantity of qualifying units (`min_quantity`) | Reliable in the cart (sum of line quantities in the set) | Qualified when met; otherwise conditional |
| Companion item (`requires_companion`, `requires_collection`) | Reliable in the cart when the companion collection is published to the Online Store; an unusable companion collection suppresses the claim | Qualified when present in sufficient quantity; otherwise conditional |
| Campaign and offer dates, paused, published | Reliable at render time; cached pages guarded (section 11) | — |
| Exclusions | Reliable when the app builds them into the qualifying collection | — |
| Reward fixed or variable | Known from data (`reward_varies`) | Variable rewards say the model is confirmed by Gamma |
| Customer type, registration, in-store-only, regional conditions | **Not verifiable** | "May qualify … subject to the offer conditions; we'll confirm" (group `staff_confirmed_terms`) |
| Gift stock | Not used | Always the backorder clause; `gift_supply` = Currently backordered makes it explicit |

**Entitlements in the cart.** For each group: `entitlements = floor(qualifying units ÷ min_quantity)`, limited by `floor(companion units ÷ requires_quantity)` when a companion set exists, then gifts = `entitlements × reward_quantity`, capped by `reward_limit`. A cart line never states that a gift is earned unless the whole cart satisfies the group's conditions. A line in both the qualifying and the companion set counts toward the qualifying set only (G22 rejects such overlaps at setup). `reward_limit` caps gifts per order; the offer's `gift_quantity_limit` is the advertised number of qualifying orders and isn't counted in the cart.

### Placement

- **Campaign page.** Within each gift offer: a "How you receive your gift" notice that names the gift once, with its image when a gift product is referenced; a facts list for the backorder statement, any limited quantity and staff-confirmed conditions; the qualifying equipment as cards in labelled groups; then manufacturer terms and exclusions as visible fine print. Never "added at checkout".
- **Product page** (block after the battery row, before the options): for the selected variant, "Complimentary with this purchase: {gift}" when the product alone qualifies; for quantity or companion conditions, the conditional wording; a link to the offer's conditions. It is a compact notice in the shared shell, with no sponsor badge, and stays quieter than the G08 availability notice. Re-renders through Horizon's native variant updates (G07).
- **Cart.** A compact notice inside each qualifying line's details, rendered immediately after the existing G08 availability line (`gamma-availability-line` in `snippets/cart-products.liquid`), as the notice shell's inline line with a gift icon. Because it is Liquid inside the native cart sections, it re-renders with every quantity change, removal, variant change, Quick Add and drawer or page update, and works without JavaScript. Multi-line conditions show the full notice under the first qualifying line of the group and "Counts toward the gift offer above" under the other participating lines, so nothing is duplicated.

### Customer wording (recommended; subject to legal review and the manufacturer's actual terms)

Pickup is enabled in the store (G08), so the wording says "your order may be delayed" rather than "shipment".

| Situation | English | Quebec French |
| --- | --- | --- |
| Cart line, qualified | Complimentary with this purchase: {gift} ×{n}. Gift supplied by Location Gamma. If the gift is backordered, your order may be delayed. We'll contact you with more information if that happens. | Offert avec cet achat : {gift} ×{n}. Cadeau fourni par Location Gamma. Si le cadeau est en rupture de stock, votre commande pourrait être retardée. Le cas échéant, nous communiquerons avec vous pour vous donner plus de détails. |
| Gift currently backordered (`gift_supply`) | Complimentary with this purchase: {gift}. This gift is currently backordered, so your order may be delayed. We'll contact you with more information. | Offert avec cet achat : {gift}. Ce cadeau est présentement en rupture de stock; votre commande pourrait donc être retardée. Nous communiquerons avec vous pour vous donner plus de détails. |
| Conditional, not yet met | Part of the {offer} promotion: buy this item with {companion} to receive {gift}. See the offer conditions. | Fait partie de la promotion {offer} : achetez cet article avec {companion} pour recevoir le cadeau suivant : {gift}. Voir les conditions de l'offre. |
| Quantity condition not yet met | Part of the {offer} promotion: buy {n} eligible items to receive {gift}. See the offer conditions. | Fait partie de la promotion {offer} : achetez {n} articles admissibles pour recevoir le cadeau suivant : {gift}. Voir les conditions de l'offre. |
| Staff-confirmed conditions | This purchase may qualify for a gift: {gift}, subject to the offer conditions. We'll confirm after you order. | Cet achat pourrait vous donner droit à un cadeau : {gift}, sous réserve des conditions de l'offre. Nous vous le confirmerons après votre commande. |
| Limited quantity | Limited to the first {quantity} qualifying orders. | Offre limitée aux {quantity} premières commandes admissibles. |
| Campaign panel "How you receive your gift" | No need to add the gift to your cart. Buy the qualifying equipment as usual and Location Gamma supplies the gift with your order. If the gift is backordered, your order may be delayed; we'll contact you if that happens. | Inutile d'ajouter le cadeau à votre panier. Achetez l'équipement admissible comme d'habitude : Location Gamma fournit le cadeau avec votre commande. Si le cadeau est en rupture de stock, votre commande pourrait être retardée; nous communiquerons alors avec vous. |

The "Offert avec cet achat : {gift}" and "Cadeau" constructions avoid gender agreement with the gift's name. The wording promises no date, no separate shipment and no immediate availability, and it never implies the gift appears at checkout.

### Consistency with G08 and G11

G11 already tells customers that a cart with delayed items ships together once everything arrives and that they can ask, in the order note, for in-stock items to be sent separately. The gift notice says only that the order "may be delayed" and that Gamma will contact the customer, which is consistent with that policy. The gift notice is line-specific and does not add a second cart-wide summary message. No JavaScript, cart state owner or line property is added; order notes, discounts, totals, Quick Add, drawer, page and accelerated checkout are untouched.

---

## 9. Staff gift workflow (outside the app)

### Why no software subsystem

The app has no order scopes. Cart notices are presentation and line properties or cart attributes are customer-controllable, so neither can prove entitlement; the order's actual line items, quantities and timestamp can. Gamma's order volume at launch is small, and every order is already opened during fulfilment. A disciplined native procedure is therefore the most reliable option; Shopify Flow can add a review tag but never decides entitlement.

### Procedure

| Step | Who / where | Detail |
| --- | --- | --- |
| 1. Reference | App → **Gift reference** (read-only) | Live and recently ended gift offers: qualifying products and SKUs, conditions, purchase window, gift and SKU, manufacturer requirements, published version ID. Printable |
| 2. Identify | Staff during order processing; optional Flow | Every new order is checked against the gift reference. Optional Flow workflow: *Order created* → if any line item's product is in the hidden collection `promo-gift-live` → add tag `gift-review` (POC P-FLOW). If this option is adopted, the app maintains `promo-gift-live` as the union of products in live gift groups, rebuilt at publication, at each start and end, and by reconcile. It is a review hint for staff only; no storefront claim reads it |
| 3. Verify | Staff in the order | Compare line items, variants, quantities and the order's created date with the offer version; check companion and quantity conditions and exclusions |
| 4. Record | Staff in the order | Tag `gift-owed`; timeline comment: "Gift: AK 30 S × 1 — STIHL Fall 2026, offer 2, version 3" |
| 5. Add to the order (when possible) | Admin → Edit order | Add the gift variant with a 100% manual line discount, reason "Promotional gift", so it appears on the packing slip and fulfilment. Only while no item is fulfilled; otherwise create a $0 draft order linked in the timeline (POC P-ORD confirms inventory and notification behaviour) |
| 6. Backorder | Staff | Tag `gift-backordered`; contact the customer from the order; follow the G11 ship-together practice unless the customer asks otherwise |
| 7. Fulfil | Staff | Ship with the order; tag `gift-fulfilled`, remove `gift-owed` and `gift-backordered` |
| 8. Cancellation or return | Staff | Qualifying item cancelled before fulfilment: remove the gift line, tag `gift-cancelled`. After a return: apply the published gift return terms (decision in section 21) and note it on the refund |

**Saved order views:** "Gifts to review" (`gift-review`), "Gifts owed" (`gift-owed` or `gift-backordered`, not `gift-fulfilled`). A daily check of both prevents forgotten gifts; the tags prevent duplicates.

| Automatic | Manual | Remaining risk |
| --- | --- | --- |
| Storefront notices; optional Flow `gift-review` tag | Verification, recording, order edit, customer contact, fulfilment, returns | Staff overlooking an order without a Flow tag; misreading a condition; manufacturer terms changing mid-campaign (the published version records what was promised) |

Manufacturer claims and reimbursement remain dealer processes outside the SCS. Shopify notification templates may optionally include a generic sentence ("If your order includes a promotional gift, we'll include it or contact you"); that's merchant configuration, not app scope.

---

## 10. Shopify-native financial promotions

### Configuration and ownership

- Staff configure each financial offer once in the app: type (promotional price, kit price, percentage, fixed amount, code), value, targets (the group collections and variant lists), minimums, per-order cap, schedule and combination policy (default: doesn't combine with other product discounts). The intent is saved in `app_config` with a fingerprint.
- The app plans the Shopify resources (eligibility collections, discounts, price plans), shows them in plain language, then applies them step by step through the journal and marks each with `$app:scs.owner`. It never modifies a discount or collection without its own marker.
- Native schedules (`startsAt`, `endsAt`) enforce discount windows. Manufacturer-funded benefits never run outside the manufacturer's window: claim window ⊆ enforcement window ⊆ program window.

### Validation before publication (blocking)

Invalid or missing dates; offer window outside the campaign; invalid or reserved benefit/redemption pair; a code claim without a code; empty or ambiguous eligibility (a variant in two groups of one offer, whatever their gifts); a product group without explicit `variants_only` and `requires_companion` flags, or whose variant list, companion collection or label contradicts them; products in both a group's qualifying and companion collections; missing French customer-facing text; missing `reward_label` on a gift group; Limited quantity without a quantity; financial conflicts (below); MAP review missing where required; automatic discount budget exceeded; rental URL not HTTPS.

### Conflict detection

- A product targeted by two live product discounts (only the best applies on Grow): warn, or block when both are advertised as cumulative.
- Unowned discounts targeting the same products: warn and show them.
- Two price plans on one variant at the same time: block.
- A percentage-of-MSRP rule while a promotional price is active (Fleet Week): block until the price plan is suspended.
- Automatic discount budget: 25 active, with a configurable reserve.

### Price changes and rollback

- At approval, the app records each variant's expected regular price and compare-at. At start it re-reads them; if any differs, it applies **none** of the offer's prices and raises a conflict.
- At end it restores the approved regular values (the snapshot, or a new regular price staff entered, e.g. after a manufacturer price change), only if the current values still equal what it applied. An intervening manual edit is reported, never overwritten.
- If POC P-PL proves a promotional price list works on the primary market, the app activates and deactivates it instead, leaving base prices untouched.

### Verification and claims

| Offer type | Before the claim appears | Ongoing |
| --- | --- | --- |
| F1 prices | Job applies prices → read-back matches the plan → `enforcement_verified_at`; Liquid also shows native prices only | Reconcile prices hourly; flag lingering compare-at after the end |
| F2/F3 discounts | At `startsAt`, read-back of the discount (status, targets, value, dates, combinations, codes) → `enforcement_verified_at` | A staff checkout-summary check (stop before payment) within one business day of activation, tracked in Health; webhooks and hourly reconcile |
| G gifts | Content, eligibility, French and operational validation at publication; no checkout probe | Health flags unpublished qualifying collections, deleted reward variants, missing gift reference data |
| M, R, I | Content validation | — |

**Verification field.** The app clears `enforcement_verified_at` before it changes any enforcement input (targets, value, dates, codes, prices) and writes it again only after a successful read-back, so the theme never shows a claim verified against old inputs.

**Ordering.** Activation: discount native start (or price job) → read-back → claim appears. Pause or early end: offer to Draft (claim hidden on next render) → wait the claim margin → deactivate the discount and restore prices. Natural end: claims hidden at `ends_at` minus the claim margin; discounts end at `ends_at`; prices restored by job.

### Manual Admin changes

Webhooks (`discounts/update|delete`, `products/update`, `collections/update|delete`, `metaobjects/update|delete`) and an hourly reconcile compare fingerprints. A change that still satisfies intent is recorded; one that breaks it hides the claim (by clearing `enforcement_verified_at`) and raises a Health error with *Restore app configuration* or *Accept change*. Deleted owned resources are never recreated silently.

### MAP rules

Manufacturer programs reproduced as published are allowed. Store-funded price claims on MAP brands are allowed only at or above MAP (STIHL) or not more than $1.00 below it (ECHO), with a named reviewer recorded. Non-price benefits and gifts are allowed without dollar values; the gift's value is never subtracted from a price. Bundles follow STIHL's sum rule. Cart-only pricing remains unconfirmed with the manufacturers. MAP lists aren't stored.

---

## 11. Lifecycle, jobs and reconciliation

| State | Shopify | Public |
| --- | --- | --- |
| Draft | Draft (or Active + `paused` if POC P-PRE shows Drafts can't be previewed) | Nothing |
| Scheduled | Active, before `starts_at` | Unavailable notice; no embargoed content |
| Live | Active, within dates | Offers whose gates pass |
| Paused | `paused` or offer Draft | Unavailable notice / offer hidden. HTML only: an Active entry stays readable through the Storefront API |
| Ended | Past `ends_at` | Ended notice during retention, no offers; post-sale redemption instructions until each eligible offer's `claim_deadline` (section 6). The app archives after the later of retention (default 30 days) and the last applicable claim deadline; the theme shows `ended` until then |
| Invalid | Active with unreadable, equal or reversed dates | Treated as unavailable |
| Archived | Draft; app collections unpublished; discounts left expired | Nothing |

- **Dates:** inclusive start, exclusive end, absolute instants, authored in the store time zone (America/New_York); the displayed end is `ends_at` minus one second ("through November 20").
- **Claim margin:** financial claims hide 1,800 seconds before the offer's effective end (provisional, tuned by POC P-D; a financial offer without a finite effective end is held until P-D and a decision); gift notices end at the effective end. The G18 offer snippet reports the instant as `hide_at`.
- **Cached pages:** time-limited elements carry `data-gamma-hide-at` with that instant; a small script hides them then. G19 and G20 each implement this for their own surfaces. Shopify's next render is authoritative.
- **Jobs:** rows with `dueAt`; an in-process runner checks every minute and claims due rows with an atomic update to a lease column (single process; no queue library). Handlers re-read Shopify before writing, retry with backoff, then raise a Health error and email. Overdue jobs run on restart.
- **Journal:** a failing plan stops in *partially applied* with exact steps; Health offers *Retry remaining steps* or *Roll back applied steps*, which only touch resources carrying the app's marker.
- **Reconcile:** webhooks enqueue targeted checks; an hourly job checks live and scheduled offers. A daily digest email lists open errors.
- **Enumeration:** the index loops `metaobjects.promotion.values` within `paginate … by 250` and reads campaign-level fields only (section 6, Lookup budget); archival keeps published counts far lower; Health warns at 200.

---

## 12. Theme integration, lookup and performance

### Components (native Gamma theme code; the app never edits the theme)

- Templates `metaobject/promotion` and `page.promotions`; sections for hero and state, offers, and index.
- A product-page block for financial and gift notices; a collection callout block.
- A cart gift-notice snippet rendered from `snippets/cart-products.liquid` after the G08 line notice (a reported Gamma change inside an already-modified Horizon snippet).
- G18's contract snippets (`gamma-promotion-state`, `gamma-promotion-offer`, `gamma-promotion-lookup` and its private `gamma-promotion-group` helper; section 6), then G19/G20 snippets for redemption panels, gift wording, cards, rental cards and design-mode checks, and each surface's expiry guard.
- A small filter in Horizon's `main-collection-list` so hidden eligibility collections don't appear on `/collections`.

### Presentation (visual design language)

Campaign pages, product notices and cart notices follow the storefront's approved "Spec sheet" design language, which is defined project-wide in the development plan and piloted on the campaign pages (G19's visual refinement). For the SCS it means:

- **Sponsor badges** sit over the campaign artwork on index cards and in the hero, top-left and fully inside it (12 px inset on cards, 16 px in the hero, 12 px on phones), once per card or hero, with a 2 px Paper keyline and a soft shadow. They move to the text area only when there is no artwork. A Brand without a colour shows on an opaque Paper plate with Coal text over artwork and keeps its outline inline. Brand data and its colour rules don't change.
- **Offers** open with an overview that links to each offer (from two offers), then one section per offer: a label chip, the title, a summary and a facts list beside the redemption or gift notice. The hero's red "Voir les offres" / "See the offers" button appears from 750 px up; on phones it is hidden and the overview follows the hero directly.
- **Qualifying products** use the theme's standard product card on the collection grid. From 1200 px a label rail accompanies only groups of five or more cards; smaller groups, and every group below 1200 px, stack their heading, count, note and "see all" link above a grid identical to collection pages. A group reused by a later offer renders its cards again in full. Variant-limited cards look the same, show the eligible variant's image and price, link to that variant and have no Quick Add. No card shows a discount that Shopify's own price doesn't show; in-store and code offers say that displayed prices are current prices.
- **Rental equipment** uses the rental-search card (4:5 white image box, name, a link to the rental-catalogue page), without prices. Rental groups follow the same heading and rail rules and are separated by a hairline rule, without panels. A small shared snippet renders it; rental search keeps its own JavaScript and shares only class names and media rules.
- **Notices** (gift, redemption, claim, lifecycle, product page, cart line and collection callout) use one shell with an inline line variant.
- **Terms** stay fully visible as fine print.

None of this changes the theme contract in section 6, the lookup, lifecycle, verification or claim rules. The stages and acceptance criteria are in the development plan (G19, G20), and the presentation choices were approved on 2026-11-09 (its Q15 and Q16).

### Lookup

`product.collections` (≤ 50) → each collection's `promotion.promotions` (≤ 5) → for each unique live promotion, compare its groups' collection IDs, then apply variant narrowing. The cost is independent of how many campaigns exist, and a per-call work budget keeps it bounded (section 6). Membership is Shopify's own and identical to the discount target. The only maintained link (collection → promotion) is written by the app when a campaign changes; a missing link fails closed (no claim).

A product or variant metafield projection was rejected: it would need to follow membership changes made anywhere in Admin, and a missed update would leave a claim on a product that no longer qualifies.

**Cart:** the lookup runs once per line per cart render. A first pass records each line's qualifying groups and the group unit counts; a second pass renders notices. Bounds: 50 cart lines (flag beyond), 50 collections per product, 5 promotions per collection, 12 offers, 8 groups, 50 variants, and an aggregate load budget across lines that G20 enforces below Shopify's 1,000 unique entries per metaobject type per render (section 6).

### Performance budget (targets measured in POC P-B with Theme Inspector, not assumed)

The product-page lookup adds at most 10% to the median server render time of the same page; the cart notices add at most 10% to the cart section render with 10 lines; campaign pages render at most 60 cards. No storefront path calls the app or the VPS.

### Compatibility

G07 variant updates; G08 notice styling and order of messages; G09 block position; G10 artwork language rules; G11 cart rendering, notes and ship-together notice; G12 collections as eligibility sources; G14 rental URL validation. Store-specific content stays in Shopify, never in theme JSON.

---

## 13. Admin experience

**Navigation:** Campaigns · Gift reference · Rental equipment · Health · Activity · Settings.

- **Campaigns list:** tabs *Needs attention*, *Live*, *Scheduled*, *Drafts*, *Paused*, *Ended*, *Archived*; search; sponsor (Brand) and business filters; columns for status, dates, offers, health and last change.
- **Create campaign:** starting points *Manufacturer seasonal*, *Store sale*, *Rental promotion*, *Information*, or *Duplicate a past campaign* (deep copy: new promotion, offer and group entries with content and translations; dates, verification and ownership cleared; rental items and existing collections shared).
- **Campaign editor:** details; English and French side by side with completeness and "outdated" badges; artwork per language; schedule; ordered offers with move up and down; terms; button; a summary panel with blocking errors, warnings, translation status, the Shopify changes the next publish makes, and preview links.
- **Offer editor (progressive disclosure):**
  1. **Benefit** (cards for each type).
  2. **Who qualifies:** one group by default; *Add group* for tiers; product, variant and collection pickers; exclusions; quantity and companion conditions.
  3. **Gift** (gift offers): label, optional gift products, quantity, per-order limit, availability (guaranteed or limited quantity), current supply, staff-confirmed conditions.
  4. **Price or discount** (financial offers): value, schedule, code per language, combination, minimums; a plain-language preview of the Shopify resources and conflicts.
  5. **Redemption and terms:** manufacturer claim link, instructions, terms, funding, MAP review, "Gamma participation confirmed".
  6. **Content and artwork** in both languages.
- **Gift reference:** read-only list of live and recently ended gift offers for staff (section 9). It reads campaign data only; it never reads orders.
- **Rental equipment:** reusable cards; optional catalogue picker (section 14).
- **Health:** findings in plain language with actions; **Activity:** who did what and when.
- **Settings:** MAP rules per Brand, claim margin, retention, discount budget reserve, rental origins, alert email, optional second approver for financial offers.
- **Content guidance:** recommended artwork shapes (16:9 or 3:2) for each language, with a named top-left keep-clear zone where the sponsor badge sits; offer labels short enough for a chip and titles led by the benefit; a preview of the index card and hero in both languages. Publication is blocked when a rental item lacks a valid rental-catalogue address in either language or the campaign's Brand isn't Active.
- **Interface conventions:** Polaris components and status tones for lifecycle and health, exact instants with the store time zone, and no storefront styling. A Brand's colour appears only as a reference swatch.
- **Preview:** Plan A: the theme editor previews Draft entries (POC P-PRE); Plan B: Active + `paused`, with the full page rendered in theme design mode only.

**Journeys:** informational campaign ≈ 10 minutes; in-store rental rate; cleaning and sanding cards; STIHL seven-offer campaign by duplicating last season (estimated 1–2 hours, mostly checking manufacturer lists and French copy); pause; drift repair from Health.

No screens exist for cart rewards, gift fulfilment, orders or inventory.

---

## 14. Rental and informational campaigns

Product-free campaigns are promotions with no groups or with rental groups. Weekend and holiday rates are *Rental discount or rate* offers with instructions; the business examples (weekend Saturday to Monday 9:00 AM as one day; holiday 1.5 or 2 days) need confirmation before publication. Nothing calculates rates.

The optional **catalogue picker** queries the existing G14 endpoints server-side (`wp-json/wp/v2/products?search=` under the English and French sites). The API exposes no translation mapping and IDs differ by language, so **staff pair** the English and French items. It stores titles and URLs (French as translations) and both post IDs in `catalogue_ref`, and imports the featured image into Shopify Files (POC P-RENT). Rendering never calls WordPress. The rental boundary is one app module and one theme snippet.

Rental cards on campaign pages follow the rental-search card and never show rental prices or rates; campaigns state promotional terms, not quoted rates. Because the theme links only to addresses under the current language's rental site, every rental item needs an English and a French address, or its card is omitted in the language that lacks one.

---

## 15. Hosting on the existing VPS

### What is known

Verified from public responses: `www.locationgamma.com` and `locationgamma.com` resolve to 54.39.243.199 and are served by **nginx** (WordPress with REST API). `locations.locationgamma.com` (the planned rental host) doesn't resolve yet. Nothing else about the server is known; no server access was available for this review.

### Proposed layout (subject to the checklist)

| Element | Proposal |
| --- | --- |
| Runtime | Node.js 24 LTS (matches the theme repository's `.nvmrc`; plan a move to the next LTS before 24's end of life) |
| App | One Node process from the Shopify React Router template build, running as a dedicated system user (`gamma-promotions`) under systemd: `Restart=always`, `MemoryMax`, `CPUQuota`, `Nice`, `NoNewPrivileges`, `ProtectSystem=strict` |
| Web | A separate nginx server block for a new subdomain (for example `promotions.locationgamma.com`), TLS by the server's existing certificate method, proxying to `127.0.0.1:{port}`; the WordPress vhost is untouched |
| Database | A separate MariaDB database `gamma_promotions` with a dedicated user granted privileges only on it, over localhost. Prisma ORM 7 (pinned) with `@prisma/adapter-mariadb`; production migrations with `prisma migrate deploy`. Session storage via `@shopify/shopify-app-session-storage-prisma` |
| Scheduler | In-process, one-minute tick with database leases (single instance). systemd restarts on crash; overdue jobs run at startup |
| Secrets | `/etc/gamma-promotions/env` (0600), loaded by systemd `EnvironmentFile`; never in Git |
| Deploy | Build on the developer machine or CI; copy a versioned release to `/opt/gamma-promotions/releases/{version}`; run migrations; switch the `current` symlink; restart; health check. Rollback = previous symlink (migrations are additive and backward compatible). `shopify app deploy` publishes app configuration separately |
| Backups | Nightly `mariadb-dump --single-transaction gamma_promotions`, 30-day retention, copied off the server; quarterly restore test |
| Monitoring | `/healthz` checked by an external uptime monitor; systemd `OnFailure` email; app emails for job failures and the daily Health digest; journald size caps |
| Firewall | Only 80/443 public; app port and MariaDB bound to localhost |

**Why MariaDB rather than PostgreSQL.** The workload is a few small tables with low write rates; MariaDB covers it, is already operated for WordPress (if confirmed), and avoids a second database service. PostgreSQL would offer no material advantage here. The one consequence: Prisma ORM 8 doesn't support MariaDB yet, so the app stays on Prisma 7 until it does. If Prisma 7 ever becomes unsupported first, the fallback is Shopify's MySQL session-storage package and plain SQL for the seven tables.

**Isolation.** A dedicated user, service, database and nginx server block, with systemd resource limits, are sufficient: an app crash, deploy or memory leak can't stop PHP-FPM or WordPress, and a WordPress failure doesn't stop the app. Shared components remain: nginx and MariaDB (a bad config or outage affects both; always run `nginx -t`), and the VPS itself (an outage stops both the app and the rental site, while the Shopify storefront and checkout continue). Containers aren't needed unless the server already uses them.

### Server checklist (to verify before G22 starts)

1. Who administers the VPS, with what access (root/sudo), and whether a control panel (Plesk, cPanel, etc.) manages nginx and certificates.
2. Operating system and version; systemd present; package manager; security update practice.
3. CPU, RAM, swap, disk free; current WordPress load and peaks (the app needs roughly 300–500 MB RAM headroom; inference to confirm).
4. nginx version and configuration layout; TLS method (certbot or panel); ability to add a subdomain and DNS control for `locationgamma.com`.
5. MariaDB version (should be a supported LTS: 10.11 or 11.4; 10.6 reached end of life in 2026), admin access, ability to create a database and user, `max_connections`.
6. Node.js availability or permission to install Node 24 LTS for a dedicated user.
7. Outbound HTTPS to Shopify; inbound HTTPS for OAuth and webhooks; provider firewall.
8. Time synchronization (NTP) — required for scheduled price changes.
9. Existing backup system and off-site storage; snapshot capability at the provider.
10. SMTP relay available for alerts (for example the Microsoft 365 tenant).
11. Existing monitoring; log retention.

### Security

App Bridge ID tokens on every request (bearer header, not cookies); token exchange; expiring offline tokens encrypted at rest; server-side authorization with the shop allow-listed; acting user taken from the token; optional approver list. Least-privilege scopes: `read/write_metaobjects`, `read/write_metaobject_definitions`, `read/write_products` (collections, prices), `read/write_discounts`, `read/write_files`, `read/write_translations`, `read_locales`, `read/write_publications`. **No** order, customer, fulfillment, inventory or theme scopes. Webhooks HMAC-verified and deduplicated; mandatory compliance topics configured (no customer data stored). Rich text from a constrained editor; HTTPS-only URLs; rental URLs restricted to configured origins. No app proxy or storefront endpoint. Secrets rotated yearly.

### Maintenance and recovery

| Cadence | Task |
| --- | --- |
| Continuous | Uptime monitor; failure emails; daily Health digest |
| Quarterly (≈ 30 min) | Review Health and Activity; check backup and restore; read Shopify changelog notices |
| **Yearly (required)** | Move the pinned Admin API and webhook versions before the current one leaves support; update Node LTS, Prisma 7 patch releases and other dependencies; redeploy; smoke test |

| Failure | Recovery |
| --- | --- |
| App down | Storefront unaffected; restart; jobs catch up; emergency manual procedures in Admin |
| VPS restart | systemd starts MariaDB, nginx and the app; overdue jobs run |
| Database lost | Restore the nightly dump; otherwise sessions are recreated on the next staff visit, ownership is rebuilt from `$app:scs.owner` markers, and reconcile runs; journal and history since the backup are lost |
| Bad deploy | Switch the symlink back |
| App uninstalled | Content survives (merchant-owned); reinstall and rebuild ownership with staff confirmation |

Indefinite maintenance-free operation can't be promised: an app idle past the API support window runs on fall-forward behaviour.

---

## 16. Repositories and framework

- **App repository:** new, separate from the buildless theme repository (`gamma-promotions-app`); Shopify CLI React Router template at its current major version, `@shopify/shopify-app-react-router`, Polaris web components, App Bridge, Prisma 7 with MariaDB, Vitest. No UI framework beyond Polaris and no job-queue library. Rich text uses a small constrained editor that emits Shopify rich-text JSON. `sales-campaign-manager` is reference material only.
- **Theme repository:** the existing workflow; the theme/app contract (section 6) is documented in both repositories.

---

## 17. End-to-end validation with real campaigns

- **STIHL Fall 2026.** Staff duplicate last fall's campaign; update dates (`ends_at` Nov 21 00:00), qualifying sets and saws, French copy and artwork. Offers (1), (2), (5) and (6) become gift offers (5 with a companion condition and a variable reward); (3), (4) and (7) become price plans. Publish creates eligibility collections with back-links and price jobs. Customers see gift notices on product pages and under qualifying cart lines; an AP tool alone shows the conditional wording until an AP battery is in the cart. After checkout, staff find the order in "Gifts to review", verify, tag and add the gift to the order.
- **ECHO Fall NSE 2026.** Three tier groups plus the ambiguous-kit group; a harness group on the existing brushcutter collection (a DSRM kit correctly shows both the battery and harness gifts); PB-9510 and snow thrower price plans.
- **Fleet Week.** In store by default; online only as an automatic 15% discount after MAP confirmation, with Shindaiwa price plans suspended that week.
- **Rental cleaning and sanding; weekend rate; informational campaign.** Content-only publication; no Shopify commerce resources.

---

## 18. Roadmap (high-level workstreams)

The theme and app branches that implement these workstreams, their order and the recommended model and effort for each are in the development plan's [branch sequence](development-plan.md#branch-sequence-and-model-guidance): proofs and server checks are sessions S1–S4, the theme workstreams are T1–T6 (with T16 for end-to-end validation) and the app workstreams are A1–A9 in the `gamma-promotions-app` repository.

| Workstream | Scope | Depends on | Acceptance | Size | Launch |
| --- | --- | --- | --- | --- | --- |
| P Proofs of concept and server checks | Section 19 POCs and the section 15 checklist | Authorization | Recorded outcomes | M | Essential, first |
| Theme: data contract (G18) | Section 6 contract; lifecycle, offer-claim and lookup snippets with no customer-facing output | P-B, P-D, P-TR, P-PRE before the interface is frozen | Fixture desk check locally; Gamma-Dev proofs | S | Essential, first |
| Theme: campaign pages | State presentation, templates, hero, offers, groups, gift panels, redemption panels, rental cards, index, callout, collection-list filter, campaign-page expiry guard | G18; definitions on gamma-dev | Fixtures S1, E1, rental, informational in both languages | L | Essential |
| Theme: campaign visual refinement | Stage 0 fixtures on Gamma-Dev, then five stages following the approved design language: foundations and the six rendering defects; cards and grids; artwork and badges; offer anatomy and navigation; states and callout | Campaign pages; Stage 0 on Gamma-Dev (French rental addresses, collection back-links, a three-offer campaign with 16:9 artwork containing text, a button and a source link, an ended campaign with an open claim deadline, a scheduled and a paused campaign, a French title for the GTA 40 set) | Development plan G19 stage checks in both languages at 320, 390, 768 and 1440 px | M | Essential |
| Theme: product and cart notices | Product block and notice limit, cart-line gift notices and gift counting, aggregate lookup budget, native refresh, expiry guard (using G18's lookup) | G18; campaign pages and refinement stages 1 and 4 (notice shell, wording); P-B | Scenarios A–I, M | M | Essential |
| App foundation and hosting | Scaffold, auth, MariaDB, VPS service, deploy, backups, monitoring, schema setup, webhooks, journal and audit | Server checklist | Installed on gamma-dev; restart, restore and isolation drills | M | Essential |
| App editor | Campaign and offer editors, groups, gifts, pickers, bilingual editing, artwork, preview, deep duplicate, gift reference, rental library, artwork and content guidance, rental-address and Brand validation | Foundation; P-TR, P-PRE | Section 13 journeys | L | Essential |
| App financial orchestration | Validation, conflicts, collections and back-links, discounts, price plans and jobs, read-back, lifecycle actions | Foundation; P-PL (optional) | Scenarios J, K | L | Essential |
| App health and reconciliation | Webhooks, hourly reconcile, findings, digest | Orchestration | Seeded drift cases | M | Essential |
| Operations | Gift procedure, saved views, optional Flow, legal wording review, MAP reviewer, staff training, emergency manual procedure | — | Walkthrough on gamma-dev orders | S | Essential |
| Catalogue picker | WordPress search, pairing, image import | Editor; P-RENT | Paired items render | S | Desirable |

Extending the visual design language to the rest of the storefront (G25–G31 in the development plan) is outside these SCS workstreams.

**Removed from the earlier design:** the cart-rewards theme workstream (automatic insertion and removal, `_gamma_offer` line properties, reward-line rendering, buy-now suppression, checkout-button disabling), BXGY orchestration and conflict rules for gifts, Storefront cart probes, the free-item POCs, the `auto_add` field and all gift-related jobs. Bundles remain only as an optional kit-price structure.

**Emergency fallback.** If the app can't be ready for the soft launch, the theme and data model launch unchanged: staff create metaobjects, collections, back-links and discounts in Admin and set `enforcement_verified_at` after the checkout-summary check (the companion no-app proposal documents those procedures). Gift notices and the staff gift workflow are identical. This is a contingency, not the plan.

---

## 19. Verification and proofs of concept

### Scenarios (both documents)

| ID | Scenario | Pass condition |
| --- | --- | --- |
| A | STIHL qualifying set with dealer-supplied battery | Product, campaign and cart notices name the battery; nothing is added to the cart; staff identify and record the order |
| B | ECHO tiers | Each kit shows its tier's battery; ambiguous kits show "may qualify"; no kit shows two batteries |
| C | Multiple gifts from one purchase | One notice listing both gifts |
| D | Tool + battery; two AS sets | Conditional wording until the cart satisfies the condition; gift count follows the formula |
| E | Gift supply delayed | `gift_supply` wording; staff backorder steps |
| F | Qualifying plus ordinary products | Notice only under qualifying lines; G11 notices unchanged |
| G | Multiple offers | Each notice once, in order; financial combination note where relevant |
| H | Incomplete cart | Never "complimentary with this purchase" |
| I | Expiry, pause, variant change, quantity change | Notices appear and disappear correctly, with and without JavaScript |
| J | Automatic percentage and fixed discounts | Actual Shopify allocations in cart and checkout summary match the claim |
| K | Scheduled price change and rollback | Prices applied and restored; conflicting manual edit reported, not overwritten |
| L | App or VPS down | Storefront, notices, cart and checkout unaffected |
| M | English and French | All notices and pages correct at `/` and `/en`; long French labels wrap |
| N | Rental and product-free | Pages render with no products or discounts |

### Levels

- **Possible now (no authorization):** static review of the design; theme `npm run check:all` once code exists; app typecheck, lint and unit tests of eligibility, entitlement counting, lifecycle and DST, price plans and conflict rules.
- **Future, authorized:** `shopify theme dev` on gamma-dev-2318.myshopify.com (French `/`, English `/en`) for rendered pages, cart page and drawer, Quick Add, accelerated checkout handoff, no-JS, theme editor, variant updates, accessibility (axe, keyboard, screen readers, 320 px at 200% zoom) and performance; Admin mutations on gamma-dev for orchestration; dev-store test checkouts for J and K; staff gift procedure on test orders; VPS drills (isolation from WordPress, callbacks, restart, backup and restore, scheduler, credential rotation).

### Proofs of concept that can change the design

| POC | Question | If it fails |
| --- | --- | --- |
| P-B Rendering | Lookup and cart notices within budget; block re-renders on variant change; nested `/pages/promotions` routes and whether `system.url` carries `/en`; whether blank and Draft list references keep their positions (G18 record positions); hidden (`seo.hidden`) Online Store collections still in `product.collections`; whether an unpublished companion collection still resolves; variant-list `count` on a populated list and on a list emptied by deleting its variants; whether reading a list's length loads its entries, with a control that iterates the same references; the 50/51 offer-reference budget boundary (section 6, Lookup budget); separately, whether 16-offer and 12-group ceilings stay within budget for a full campaign, an overlapping campaign and a 10-line cart | Tighten bounds and budgets; restructure placement; add the single locale-prefix fallback; resolve by traversal instead of positions; drop `seo.hidden`; keep the 12-offer and 8-group ceilings |
| P-D Caching | Delay before cached HTML reflects a boundary or a Draft/paused change | Sets the claim margin (provisional 1,800 s) and the app's wait after pausing; decides whether open-ended financial claims can appear |
| P-TR Translations | `file_reference`, `url`, `link` translations via API and Translate & Adapt; whether choice fields are offered for translation | Explicit French fields; the app never translates choices |
| P-PRE Preview | Theme editor previews Draft metaobjects; the public response (status and body) for a Draft entry's URL | Plan B preview (public-safe content only, since Active entries are publicly readable) |
| P-PL Price lists | Primary-market promotional price list on Grow, including point of sale | Keep price jobs |
| P-ORD Order edit | Adding a gift with a 100% line discount: inventory, packing slip, notifications; $0 draft order alternative | Tags and notes only, gift packed manually |
| P-FLOW Flow | Order-created condition on line-item product membership in `promo-gift-live` | Manual review only; the app doesn't maintain that collection |
| P-RENT Images | `fileCreate` from rental image URLs | Manual upload |
| P-VPS Server | Checklist items 1–11 | Hosting decision revisited (section 21) |

---

## 20. Migration and compatibility

| Item | Action |
| --- | --- |
| `sales_campaigns` / `promo_offers` (one expired, unverified entry each on Primary; Gamma-Dev held two campaigns and three offers on 2026-11-08, and neither definition existed there on 2026-11-09) | Not migrated. The app setup frees the `promotions` URL handle; on Gamma-Dev it verifies and adopts the four SCS definitions created there in Admin on 2026-11-09, and creates them on Primary at cutover after confirming the published theme. Old definitions are deleted once the new theme is live |
| Sponsor choices (`location_gamma` … `other_manufacturer`) | Replaced by the `brand` reference before any `promotion` entry exists, so nothing is migrated. Each sponsor needs an Active Brand entry on the store; `other_manufacturer` has no equivalent and becomes the actual manufacturer's Brand. The index section's per-sponsor colour settings and the theme's sponsor names were removed |
| `sales-campaign-manager` | Retired; confirm it isn't installed with write access on Primary; ideas only |
| `promotions` page | Reassigned to `page.promotions` |
| `promotions-g18` proof handle and page (Gamma-Dev) | Retired. The `promotion` definition's URL handle moves to `promotions` with Shopify's automatic redirects, the `promotions-g18` page is deleted and redirected to `/pages/promotions`, and links are re-checked in both languages (development plan, G18). The theme needs no change |
| Theme | New files plus reported Gamma changes in Horizon areas: the cart-line gift notice call in `cart-products.liquid` and the collection-list filter |
| Completed features | G07, G08, G09, G10, G11, G12, G14, G16 reused without changing their scope |

---

## 21. Risks, decisions and recommendation

### Ranked risks

| # | Risk | Treatment |
| --- | --- | --- |
| 1 | App not ready for February 2027 | Start foundation and server checks first; emergency manual fallback on the same data |
| 2 | VPS unsuitable (resources, access, old MariaDB) | Checklist before G22; revisit hosting if it fails |
| 3 | Staff miss or misjudge a gift-entitled order | Gift reference, saved views, optional Flow tag, published versions |
| 4 | Gift wording or limited-quantity claims breach Quebec rules | Guaranteed-gift default, stated quantities only, legal review |
| 5 | App outage at a price boundary leaves a promotional price live (MAP) | Catch-up jobs, alerts, Health, manual restore procedure |
| 6 | Manual Admin edits to owned resources | Webhooks, reconcile, claims hidden when intent breaks |
| 7 | Prisma 7 / MariaDB support horizon | Pinned versions; documented fallback |
| 8 | Idle app past API support | Yearly update commitment |
| 9 | Manufacturer policy uncertainty (online eligibility, pre-approval, cart pricing) | Business confirmation before publishing |

**Can the system falsely advertise?** Financial claims appear only after Shopify read-back and disappear when reconciliation finds broken intent; residual windows are manual edits before the next webhook or reconcile and cache staleness within the claim margin. Gift notices state qualification only when the cart proves it; they promise a gift Gamma has committed to supply, with a truthful delay statement. Checkout shows the true total before payment.

### Decisions needed (with recommended defaults)

1. **Gift return terms:** if a qualifying item is returned, the gift must be returned unused or its value deducted (recommended; legal review).
2. **Limited-quantity gifts:** don't advertise unless a quantity can be stated (recommended).
3. **Online participation:** confirm with STIHL and ECHO that Gamma's online sales qualify for each program before publishing.
4. **MAP:** approve the rules, name a reviewer, ask about cart-only pricing and pre-approval of Gamma pages.
5. **App subdomain** and **who administers the VPS**.
6. **Defaults:** claim margin 30 minutes (pending P-D), retention 30 days, two notices per product page, optional second approver off.
7. **Flow:** adopt the optional `gift-review` workflow if P-FLOW passes (recommended).
8. **Wrong-claim policy:** honour the advertised benefit (recommended).

### Recommendation

Build the SCS as described: a self-hosted custom app administering Shopify-native content and financial promotions, a Liquid storefront independent of the app, dealer-fulfilled gifts presented as line-specific notices, and gift fulfilment handled by a native staff procedure. Start with the server checklist and the proofs of concept, because they're the only items that could change the hosting or data-model decisions.

---

**Sources** (beyond those linked above): [Shopify app deployment](https://shopify.dev/docs/apps/launch/deployment) · [shopifyApp session storage](https://shopify.dev/docs/api/shopify-app-react-router/v4/entrypoints/shopifyapp) · [Cart API and private properties](https://shopify.dev/docs/api/ajax/reference/cart) · [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) · [editing orders](https://help.shopify.com/en/manual/fulfillment/managing-orders/editing-orders) · [Flow conditions](https://help.shopify.com/en/manual/shopify-flow/reference/conditions) · [Prisma MariaDB adapter](https://www.prisma.io/docs/orm/supported-databases) · [OPC out-of-stock guidance](https://www.opc.gouv.qc.ca/en/consumer/topic/price-discount/promotion/out-of-stock/) · [ECHO promotions](https://www.echo.ca/promotions) · internal: 2026 STIHL Dealer Support Manual, 2025 ECHO Policies and Procedures, 2026 Spring ECHO/Shindaiwa MAPP workbook (headers and notes only).
