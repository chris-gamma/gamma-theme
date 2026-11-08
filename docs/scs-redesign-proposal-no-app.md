# Sales Campaign System — no-app architecture proposal

Location Gamma · revised 2026-11-08 · research and planning only; nothing is implemented.

This proposal designs a complete, launch-ready Sales Campaign System (SCS) that staff operate entirely through Shopify Admin, with no custom application. A companion document, [scs-redesign-proposal-with-app.md](scs-redesign-proposal-with-app.md), designs the alternative in which a purpose-built app is the primary administration tool and compares the two. This document stands on its own.

**Evidence base.** Repository and Git history (`AGENTS.md`, `README.md`, `docs/development-plan.md` G18–G24, the current theme on `feature/map-previews`), the prototype (`gamma-shopify-theme-old`, branch `sales-campaign-system` at 6bf3a38), the `location-gamma-audit` reports, the `sales-campaign-manager` app, the supplied STIHL and ECHO dealer documents, read-only Admin GraphQL queries against the connected store (`location-gamma.myshopify.com`), public GET requests to the WordPress rental REST API, current Shopify documentation (Shopify Dev MCP, shopify.dev, help.shopify.com) and Canadian manufacturer sources. No repository, Shopify, WordPress or Git changes were made.

**Labels.** **Verified**: confirmed against a cited source or the store. **Inference**: reasoned from verified facts. **Recommendation**: a design choice. **Unverified**: needs the named proof of concept (POC) or business confirmation before it is relied on.

---

## 1. Executive recommendation

Build the SCS on **four merchant-owned metaobject definitions** (`promotion`, `promotion_offer`, `promotion_group`, `rental_item`), one **collection metafield** that links collections back to promotions, and **native Shopify commerce** (prices, compare-at prices, automatic and code discounts, Buy X Get Y) as the only financial authority. Generic theme sections render every campaign; no campaign has its own template.

The design rests on five decisions:

1. **Benefit × redemption × eligibility.** Every offer states what the customer receives, how they receive it (price already shown, automatic at checkout, code, add the free item, manufacturer claim, in store, contact us), and who qualifies. Real STIHL and ECHO campaigns decompose cleanly on these axes (§3–4), and the redemption mode is always shown, so the page never implies that checkout applies something it doesn't.
2. **Collections are the eligibility primitive.** Every product-level eligibility set is a Shopify collection, optionally narrowed to listed variants. The same collection is the target of the matching Shopify discount, so display and enforcement share one membership definition. A collection metafield points back to the promotion, which lets product and cart pages find live offers in a bounded number of steps without scanning every campaign (§7.2, §8.4).
3. **Claims are gated, not trusted.** An offer that depends on a discount is hidden until staff record an authorized cart and checkout verification. Liquid verifies what it can see (dates, prices against compare-at prices, references, reward availability) and fails closed on anything missing (§8.7).
4. **Dates drive visibility.** Start and end instants, store time zone, inclusive start and exclusive end, with a client-side expiry guard for cached pages. No campaign needs a manual "go live" action (§8.5).
5. **MAP rules follow the manufacturers' actual policies.** They distinguish advertised from selling prices, manufacturer programs from store-funded offers, and price claims from non-price benefits, instead of prohibiting store-funded offers outright (§8.8).

**Principal tradeoff.** Staff author in Shopify's generic metaobject editor and configure discounts and collections separately. A seven-offer manufacturer campaign takes roughly 3–5 hours the first time, with one Translate & Adapt pass per entry, and nothing detects a discount changed in Admin after verification. In exchange there is no hosting, no app security surface, no maintenance cycle and minimal February 2027 launch risk. The data model is compatible with a later app that edits the same records.

---

## 2. Existing system assessment

### What exists today (verified)

| Element | Current state |
| --- | --- |
| Store | `location-gamma.myshopify.com`: **Grow plan, not Plus**; time zone America/New_York; `en` primary, `fr` published (French served at `/`, English at `/en` per the plan); **4 products, 76 collections** — the launch catalogue isn't loaded yet. |
| Campaign definitions | `sales_campaigns` (publishable, translatable, renderable, online store with URL handle `promotions`; **`sale_collection` required**) and `promo_offers` (name, description, one image, image link, **`products` required**). |
| Campaign data | One entry, "STIHL 2026 Spring Sales" (2026-04-01 → 2026-08-01, ended), one offer "Free AS 2 Battery". I couldn't match that offer to STIHL Canada's Spring 2026 promotions (the verified AS 2 offer is Holiday 2025). Treat it as unverified test data. |
| Discounts | Two expired codes, `GAMMA5OFF` and `GAMMA5RABAIS`: one code per language. |
| Pages | `promotions` page titled "Sales", template suffix `sales`; the new theme has no `page.sales` template. |
| New theme | **No SCS code.** G18–G23 are Planned. Implemented features this design depends on: G07 scoped product updates, G09 battery row, G10 language-specific media, G11 cart, G12 collection templates, G14 rental search, G16 date semantics. |
| Prototype theme | Nine SCS Liquid files (index, detail, banner, lifecycle, ended window, URL helper, card, rich text). |
| Prototype app | `sales-campaign-manager` (React Router). Audited defects: percentage-unit errors, trusted posted IDs, password forwarding to arbitrary origins, no operation journal, target updates that only add. |

### Approved decisions this design follows

- French at `/`, English at `/en`, English admin source language.
- G16: start inclusive, end exclusive, absolute instants authored in the store time zone, Draft used for archival.
- G14 (Q09): the WordPress rental catalogue at the configured English and French site addresses, kept in theme settings.
- G10: language-specific media falls back to all media rather than showing nothing.
- G15: theme-content translations live per theme, so store content belongs in Shopify resources.
- Native discounts are the financial authority; no custom Functions on the current plan.
- Gamma Red and accessibility rules from `AGENTS.md`.

Q05, Q06 and Q07 (membership, lifecycle and archive, app ownership) are open in the plan; this proposal resolves them.

### Prototype defects not to repeat

Open-ended campaigns never won the product-page selection. Grouped pagination could hide navigation. Membership changed with display mode. The card call to action wasn't a link. The primary-theme snapshot had no lifecycle gating. The banner winner was chosen before its copy was checked. Index sorting re-fetched entries by handle, which hits the 20-handle limit.

### Kept and dropped

**Kept:** metaobject webpages under `/pages/promotions/{handle}`; inclusive and exclusive date boundaries; banner placement after the battery-system row; `metafield_tag` rich text; the known-expiry client guard; enable-before-claim and hide-before-disable ordering; awareness of Liquid limits; G14 URL validation.

**Dropped:** grouped and ungrouped modes with an "Other deals" remainder; a required campaign collection; a single banner "winner"; the duration-based grace period; app DOM markers before an app exists; a hand-maintained `eligible_products` projection; the release manifest and hourly rechecks as launch gates.

---

## 3. Canadian manufacturer campaign research

**Coverage.** Strong evidence spans August 2024 to November 2026. I couldn't verify 2021–2023 Canadian campaigns: the Wayback Machine was inaccessible and the manufacturers' sites don't keep archives. Official French pages weren't retrievable at guessed URLs; a Quebec dealer page supplied French-market corroboration. US pages (echo-usa.com, stihlusa.com) were excluded.

### Campaign research matrix

| ID | Campaign (period) | Geography and channel | Offers | Eligibility and conditions | Redemption | Source (quality) |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | **STIHL Canada Fall Promotions 2026** (now → **Nov 20, 2026**) | Canada; "available while supplies last at participating dealers"; also shop.stihl.ca | **7**: (1) free 4 Ah battery **and** Wood-Pro kit with AK chainsaw sets; (2) free 4 Ah battery with AK blower sets; (3) AP chainsaw special kit price; (4) AP blower special kit price; (5) free extra AP battery; (6) free Wood-Pro kit with 6 gas saws; (7) "Save on power tools" (8 promotional prices with was-prices) | Model lists (sets versus units); (5) requires **an AP tool plus an AP battery**, "free battery model varies", with exclusions; kit specials "cannot be combined" with (5); (7) states **no end date** | At purchase, dealer or online | [stihl.ca promotions](https://www.stihl.ca/en/news/promotions/promotions) (primary, fetched) |
| S2 | STIHL Direct Fall 2026 (→ Nov 20, 2026) | **shop.stihl.ca only** | 4: subset of S1 | Free battery "won't show in your cart" but ships | Fulfilled by STIHL | [shop.stihl.ca](https://shop.stihl.ca/pages/spring-promotions) (primary; now shows fall) |
| S3 | STIHL Holiday AS System (**Nov 24 – Dec 19, 2025**) | Canada | 1: free AS 2 battery with 9 AS sets | Purchase window | **Redemption form by Dec 31, 2025** | stihl.ca (indexed excerpt; moderate) |
| S4 | STIHL Fall 2025 (Aug 1 – Nov 21, 2025) | Canada; the 4 Ah offer was **shop.stihl.ca redemptions only** | ≥4: free 4 Ah with AK chainsaw and blower sets; AS 2 with SEA 20; AP 300 S + AL 301 with MSA 220 T; Wood-Pro kit with gas saws | "Qualifying products must be purchased in Canada" | Shipped in 4 weeks | [stihlpromos.ca](https://www.stihlpromos.ca/4ah-battery/english.php) (primary) |
| S5 | STIHL Spring 2025 / Spring 2026 (→ Jul 31) | Participating dealers | 2025: free 4 Ah (AK 20) with AK trimmer or mower sets; offer on any two AS sets. 2026: free 4 Ah with AK trimmer and mower sets; free AP 300 S with AP tool + AP 300 S; free FS-KM with KMA 80 R | Purchase-before date | Dealer | stihl.ca and shop.stihl.ca (indexed excerpts; moderate) |
| S6 | **STIHL Autumn 2024** (Aug 1 – Nov 22, 2024) | Canada, dealers | **Free GTA 26 with any two AS sets**; free AK 30 battery with 4 sets; GTA 26 and SHA 56 with was-prices | "**Same receipt**", "while supplies last" | Separate **in-store and online redemption links**; **redeem by Nov 30, 2024** | [stihl.ca/en/autumn](https://stihl.ca/en/autumn) (primary) |
| S7 | STIHL Autumn Professionals 2024 | Participating dealers | Free AR battery with BGA 300 or RMA 765 V **+ AR battery**; free AP 300 S with **AP tool + AP 300 S**; BGA 86 kit price | "Kit special cannot be combined…"; "Free battery model varies… see dealer" | Dealer | [stihl.ca/en/autumn-professionals](https://www.stihl.ca/en/autumn-professionals) (primary) |
| E1 | **ECHO Canada Fall National Sales Event 2026** (**Sep 1 – Nov 30, 2026**) | Participating dealers | 5: PB-9510 "on sale for $999.95"; PAS snow thrower attachment $469.95; **free 56V battery tiered by kit** (16 kits → 2.5 Ah, 24 → 5.0 Ah, 2 → 8.0 Ah); free brushcutter harness ($49.95 value) with *any* ECHO brushcutter; Landscaper Fleet tier note | Per-kit lists; **two kits appear in both the 5.0 Ah and 8.0 Ah lists** | Dealer | [echo.ca NSE](https://www.echo.ca/promotions/national-sales-event), [free battery](https://www.echo.ca/promotions/free-battery) (primary) |
| E2 | ECHO Spring NSE 2025 (**Mar 1 – Jul 31, 2025**) | Canada; Quebec dealer | Free 2.5 Ah with PAS kits; "save up to 20%" PAS powerhead + attachments | Kit models | Dealer | [Garage Harry Stanley, Gaspé QC](https://www.garageharrystanley.com/blogs/news/2025-echo-spring-national-sales-event) (fetched) |
| E3 | ECHO Spring 2026 (Mar 1 – Jul 31, 2026) | Canada | Promotional prices; free 2.5/5.0 Ah with eligible 56V kits | Promotional window; "MAPP exceptions" | Dealer | Supplied 2026 MAPP workbook (internal) plus dealer listings; the fall page says the battery offer was "**extended**" |
| E4 | ECHO **One Day Sale** (date chosen by each dealer) | Participating dealers only | 15% off select units | Dealer listing: in-stock serialized units; not combinable | In store that day | [echo.ca](https://www.echo.ca/promotions/one-day-sale), [Xtreme Equipment AB](https://www.xtremeequipment.ca/echo-blowers-edgers-pumps-sales-deals-owlseye-saint-edouard-lafond-alberta--x4Echo-Power-Promotions) |
| E5 | **Shindaiwa Fleet Week** (spring and fall; regional weeks; Quebec May 5–11, 2025) | Participating dealers | 15% off **MSRP** on all Shindaiwa units | "Not to be combined with any other offers"; excludes spreaders, sprayers, accessories, parts | In store | [shindaiwa.ca](https://www.shindaiwa.ca/promotions/shindaiwa-fleet-week) (fall 2026) plus 2025 ECHO policy |
| E6 | ECHO 7-Day Money Back Guarantee | Participating dealers | Return within 7 days | 6 arborist saws; accessories excluded | Dealer | echo.ca |

### Manufacturer policy findings (internal; never customer-facing)

**STIHL 2026 Dealer Support Manual (verified text).** The minimum advertised price (MAP) "is determined by MSRP or in season promotional prices." The policy "is not intended to set or limit the price at which authorized retailers can sell"; it "deals solely with advertised price points." Covered media include "Digital (Dealer website, social media, Google AdWords)"; exclusions are "In-store price markings" and "Used equipment or discontinued models." Compliant: advertising "that does not refer to price", price matching, free delivery, training or service and financing offers, "unless the ad specifies a dollar value" that results in a price below MAP. Bundles: a bundle of STIHL products may not be advertised below the total of the individual products' prices; "free goods are permitted… if the Net Price of the STIHL products is not below the MAPP price," and "the cost or value of the free good cannot be subtracted." Dealer-created ads "must be pre-approved" (co-op context); STIHL-produced material is recommended; logos must match the original; digital co-op ads exclude competitor products. Dealers may sell from their own website.

**ECHO 2025 Policies and Procedures (verified text).** MAPP since September 1, 2020: "Resellers may sell all covered products at any price… however is in violation… if the advertised price is more than $1.00 below current MAP pricing." The complete MAP policy and price lists are on the dealer portal and weren't available for this review. Program vocabulary: National Sales Events, "Instant Rebates", "Free Goods Offers with Purchase". One Day Sale and Fleet Week can't be combined with other promotions; Fleet Week pricing is "15% off MSRP, NOT Promo Prices." Ads "must not contain false or misleading statements or claims not made by ECHO." Websites aren't co-op eligible. The 2026 Spring MAPP workbook lists promotional prices valid March 1 – July 31, 2026, and "MAPP EXCEPTIONS" for the free 2.5 Ah and 5.0 Ah batteries.

**Customer-facing versus dealer-only.** Reimbursement rates, booking requirements, claim registration, dealer costs and MAP price lists never appear in campaign data. Promotional windows, eligible models, exclusions and combinability are customer-facing.

### Patterns that drive requirements

| Pattern | Evidence | Requirement |
| --- | --- | --- |
| 1–7 distinct offers per campaign, each with heading, artwork, model list and fine print | S1, S6, E1 | Ordered offers with their own content, terms, eligibility |
| Free item with purchase dominates | S1–S7, E1–E3 | First-class free-item benefit with explicit rewards |
| Reward varies by qualifying model | E1 tiers; S1(5) | Headed groups with their own reward; ambiguity handling |
| Two free items from one purchase | S1(1) | Multiple rewards per eligibility set; enforcement analysis |
| Conditional multi-item rules | S1(5), S6, S7 | Honest non-checkout redemption |
| Promo price with was-price | S1(7), S6, E1 | Native price and compare-at; no restated amounts |
| Kit special price | S1(3–4), S7 | Kit SKU or bundle at a promotional price |
| Category-wide rules | E1 harness, E5 | Collection-based eligibility |
| Offer dates differ from campaign dates | S1(7), E3 dealer listings | Optional per-offer dates |
| Redemption forms, deadlines, in-store only | S3, S6 | Redemption mode, instructions, claim link |
| Channel restrictions | S2, S4, E4 | Participation confirmation before publishing |
| Non-combinability | S1, S7, E4, E5 | Terms per offer; native combination settings |
| Source ambiguities (MS 212 missing; duplicated ECHO kits) | S1, E1 | Official source link; no reward advertised until resolved |

---

## 4. Promotional offer taxonomy

**Model: benefit × redemption × eligibility**, with Shopify enforcement on the Grow plan without Functions.

| Benefit | Real examples | Grow-native enforcement (verified unless noted) | Redemption mode |
| --- | --- | --- | --- |
| Promotional price (manufacturer price = MAP in the window) | S1(7), E1 PB-9510 | **Enforced** by variant price + compare-at, changed manually at the window boundaries | Price shown |
| Percentage or amount off a set | E4, E5, store sales | **Enforced** by an automatic amount-off or code discount, natively scheduled; visible only in the cart | Automatic at checkout / Discount code / In store |
| Free item with purchase | S1(2,6), E1 tiers and harness | **Enforced** by an automatic Buy X Get Y (BXGY); "the free or discounted 'get' item is never automatically added to the cart" | Add free item |
| Two free items from one purchase | S1(1) | **Doubtful natively**: on non-Plus plans "all products that are part of a Buy X get Y discount are ineligible for further product discounts," so a second BXGY on the same purchase may not apply (POC P-C). Alternatives: one fixed bundle as the reward, or in store | Add free item (if POC passes) / In store |
| Conditional multi-item (tool **and** battery; reward varies) | S1(5), S7 | **Not representable**: BXGY "buys" can't require one item from each of two sets, and can't vary the reward by the purchased item | In store / Contact us / Manufacturer claim |
| Two qualifying sets on one receipt | S6 | Representable as BXGY (buy quantity 2 from a set) if Gamma fulfils; S6 itself was manufacturer-redeemed | Manufacturer claim or Add free item |
| Kit or bundle price | S1(3–4) | Kit product with compare-at, or a Shopify Bundles fixed bundle (free app, all plans) | Price shown |
| Manufacturer rebate or claim | S3, S4, S6 | Not checkout | Manufacturer claim |
| Guarantee or program | E6, fleet tiers | Not a discount | No action / Contact us |
| Rental discount or rate | Gamma rental | Outside Shopify | In store / Contact us |
| Information only | events | — | No action |

**Presentation consequences.** Every offer shows a redemption panel matching its mode. An offer not enforced at checkout says so plainly. The theme never calculates promotional prices: product cards show Shopify prices, and copy doesn't repeat amounts that could diverge from them.

---

## 5. Requirements model

Classes: **L** launch, **R** launch refinement (optional before launch), **A** future application, **O** optional later, **X** rejected.

| Area | Requirement | Class |
| --- | --- | --- |
| Management | Create, edit, schedule, publish, pause, end, archive in Shopify Admin, no code | L |
| | Draft, scheduled, live, paused, ended, archived; open-ended; display order; simultaneous campaigns; no correctness dependency on campaign counts below 250 | L |
| | Deep duplication of a campaign with independent copies of its offers | A (manual procedure until then) |
| | Manufacturer, store, rental and product-free informational campaigns | L |
| Eligibility | Offers with their own copy, artwork, terms, dates, eligibility, rewards | L |
| | Product, variant and collection eligibility; groups inside offers; same product in several offers; deterministic conflict rules | L |
| | Rental equipment references and category links | L |
| | General rules engine (minimum quantities, "tool + battery") | X: present in words; native discounts enforce what they can |
| Presentation | Index, campaign pages, offer sections, native product cards, rental cards, terms, redemption panels | L |
| | Variant-aware product-page offers; collection-page callouts | L |
| | Cart redemption notes for non-checkout benefits | R |
| | Assisted free-item insertion in the cart (theme-only, gated by POC) | R |
| | Promotion badges on collection product cards | O |
| | Announcement driven by a live campaign | O |
| Truth | Native prices and discounts as authority; redemption shown on every offer; per-language codes | L |
| | Verification gate before any discount-dependent claim; authorized cart and checkout verification | L |
| | Automatic detection of discounts edited after verification | A |
| | Custom discount Functions | X on Grow (custom-app Functions need Plus) |
| Localization | French and English content, artwork, codes, external URLs; natural Quebec French | L |
| Compliance | MAP rules per manufacturer policy; official-source link; no confidential dealer data | L |
| Attribution | Stable URLs; UTM parameters on inbound links; attribution never affects eligibility | L |
| | Custom tracking scripts | X |
| Rental | Manual references to the WordPress catalogue; campaigns with or without cards | L |
| | Rental catalogue migration, booking, checkout, rate calculation, inventory sync, Rental Expert / Point of Rental | **X** |

---

## 6. Shopify capability research

### Verified platform facts and implications

| Capability | Verified fact | Implication |
| --- | --- | --- |
| Plan | Store is Grow, `shopifyPlus: false` (read-only Admin query) | Plus-only features are unavailable |
| Functions ([docs](https://shopify.dev/docs/apps/build/functions)) | "Only stores on a Shopify Plus plan can use custom apps that contain Shopify Function APIs." | No custom discount logic |
| Metaobject webpages ([capabilities](https://shopify.dev/docs/apps/build/metaobjects/use-metaobject-capabilities), [template](https://shopify.dev/docs/storefronts/themes/architecture/templates/metaobject)) | URL `/pages/{urlHandle}/{handle}`; `templates/metaobject/{type}.json`; alternate templates per entry | One generic campaign template |
| Metaobject Liquid limits ([limits](https://shopify.dev/docs/apps/build/metaobjects/metaobject-limits)) | Loops over `values` or list references return 50 entries without `paginate`, 250 per page with it; 1,000 unique entries per type per render; 20 handle lookups per type; draft entries are skipped | Enumerate with `paginate … by 250`; never look up by handle in loops |
| List limits ([metafield limits](https://shopify.dev/docs/apps/build/metafields/metafield-limits)) | Lists hold at most 128 items (1,024 metaobject references); Liquid loops over reference lists return the first 50 without `paginate` | `list.max` validations ≤ 50 make unpaginated loops complete by construction |
| `for` and `paginate` ([for](https://shopify.dev/docs/api/liquid/tags/for), [paginate](https://shopify.dev/docs/api/liquid/tags/paginate)) | 50 iterations per loop; `product.collections` isn't paginatable | Collection-based lookups are bounded at 50 collections per product |
| `product.collections` ([product](https://shopify.dev/docs/api/liquid/objects/product)) | "Collections that aren't available on the Online Store sales channel aren't included." | Eligibility collections must be published to the Online Store |
| Data types ([list](https://shopify.dev/docs/apps/build/metafields/list-of-data-types)) | Translatable: text, rich text, **url, link, file_reference**; not translatable: references, dates, booleans. Deleted products and variants are **automatically removed** from list metafields. `variant_reference`, `mixed_reference`, `link` exist | Language-specific images and URLs can be native translations (UI coverage: POC P-A); shrinking lists need checks |
| Metaobject Admin ([help](https://help.shopify.com/en/manual/custom-data/metaobjects/creating-entries)) | Active/Draft states; new entries can be created from a reference field; no scheduling documented; duplication not documented | Dates in data schedule visibility; deep duplication is manual |
| Flow ([trigger](https://help.shopify.com/en/manual/shopify-flow/reference/triggers/metaobject-entry-created)) | Native "Metaobject entry created" trigger; no native "updated" trigger found | Flow can't keep a projection in sync with edits |
| Discount combinations ([help](https://help.shopify.com/en/manual/discounts/discount-combinations)) | At most **25 active automatic discounts** (including app discounts); 5 product or order codes plus 1 shipping code per order; combining product discounts **on the same line** needs Plus; non-Plus: "All products that are part of a Buy X get Y discount are ineligible for further product discounts"; incompatible discounts resolve to the best for the customer | Overlapping offers on a product can't stack; terms must say so; BXGY products can't receive another product discount |
| BXGY ([help](https://help.shopify.com/en/manual/discounts/discount-types/buy-x-get-y)) | Get item never auto-added; when the same product or collection is on both sides, "the lower-priced item" is discounted; per-order use cap available | Free-item offers need an "add the free item" action |
| Discounts in Liquid (platform behaviour) | Automatic discounts appear on cart objects (`discount_allocations`), not product prices | Pages can verify prices, not discounts |
| Cart and Section Rendering ([cart](https://shopify.dev/docs/api/ajax/reference/cart), [sections](https://shopify.dev/docs/api/ajax/section-rendering)) | Line item properties starting with `_` are private; cart endpoints support bundled rendering of up to 5 sections; a section can be rendered in any page's context | Theme-only cart enhancements can compute entitlements server-side |
| Bundles ([eligibility](https://help.shopify.com/en/manual/products/bundles/eligibility-and-considerations), [fixed bundles](https://shopify.dev/docs/apps/build/product-merchandising/bundles/add-variant-fixed-bundle)) | Shopify Bundles app (fixed and multipack) "is available for all Shopify plans"; fixed-bundle inventory follows its components; discounts are calculated on the parent and allocated to components | Promotional kits can be real products |
| Collections model ([2026-07](https://shopify.dev/docs/apps/build/product-merchandising/products-and-collections/use-new-collections-model)) | API 2026-07 adds multi-source collections, exclusions and variant-level membership; Admin UI support not documented | Not relied on; exclusions and variant collections are POC items |
| SEO hiding ([docs](https://shopify.dev/docs/apps/build/marketing/optimize-storefront-seo)) | `seo.hidden = 1` adds noindex, removes the page from the sitemap and from storefront search | Promotion-only collections stay out of search |
| Price lists ([catalogs](https://shopify.dev/docs/apps/build/markets/catalogs)) | A market with several catalogs uses the lowest price; fixed price lists carry compare-at prices | A promotional price list could replace per-variant price edits; Grow and primary-market availability unverified (POC P-PL) |

### Rental catalogue contract (verified with public GET requests)

The `gamma_product` type is served at `wp-json/wp/v2/products`; the hierarchical taxonomy `gamma_product_cat` at `wp-json/wp/v2/collections` (48 English categories). Fields include `id`, `slug`, `link`, `title`, `featured_media`, `collections`. Category pages are public (for example `/gamma_product_cat/cleaning/`). **French and English are separate posts and terms with different IDs and slugs** ("Carpet Cleaner 5gal" #316 versus "Laveuse à tapis" #3027) and **no translation mapping is exposed**. There is no sanding category; sanders sit under Flooring / Plancher. The image server blocks anonymous CORS (G14). Conclusion: campaign cards use manual, Shopify-stored references; the storefront never calls the WordPress API to render a campaign.

---

## 7. Architecture decisions

### 7.1 Overall approach

| | A. Blog-based campaigns | **B. Typed promotion model** | C. App-first projection | D. Refined current plan |
| --- | --- | --- | --- | --- |
| Core | Campaign = article in a Promotions blog; offers as metaobjects in article metafields | Promotion, offer, group and rental-item metaobjects; collection-anchored eligibility; native discounts | App-owned definitions, app database, projections | `sales_campaigns`/`promo_offers`, required collection, grouped modes, frozen projection |
| Major issue | Template chosen per article; metafields clutter every blog | Generic editor burden | Needs an app at launch | Can't express redemption, product-free campaigns, rental cards, tiers, per-language artwork |

Weighted scores (1–5; weights total 100): reproduction of real campaigns (12) A4 B5 C4 D2; presentation (9) 4/4/4/3; product-free and rental (9) 4/5/4/1; manual usability (10) 3/3/2/3; launch effort (8) 4/3/1/3; claim correctness (10) 3/4/5/3; bilingual (7) 4/4/4/3; maintainability (6) 4/4/3/3; theme complexity (5) 4/3/2/2; platform fit (5) 4/5/3/4; performance (4) 4/5/4/3; future app integration (6) 3/5/5/3; migration (3) 4/4/3/5; reliability (4) 3/4/4/3; technical debt (2) 3/4/2/2. **Totals: A 73.6, B 82.6, C 68.8 (and fails the no-app constraint), D 54.8.** B is selected. A was close because its offers would match B's, but it adds fragile per-article template assignment and two content systems, and its native scheduling brings nothing that date fields don't.

### 7.2 Product-to-promotion lookup

Product pages, collection product lists and the cart must find live offers that apply to a product or the selected variant. Four options were evaluated.

| Option | How it works | Cost per product page (inference from verified limits) | Correctness | Verdict |
| --- | --- | --- | --- | --- |
| L1 Direct scan | Loop every published promotion → live ones → offers → groups → product and variant lists | Grows with the number of published promotions × offers × groups × list sizes; each list loop loads referenced products | Complete only with `paginate` and bounded lists; cost rises with archive size | Rejected: unbounded growth with no benefit |
| L2 Hand-maintained product projection | Product metafield listing applicable offers | One read | Duplicates eligibility; drifts silently whenever staff edit one side | Rejected for manual operation |
| L3 Flow-maintained projection | Flow updates product metafields on changes | One read | Flow has no metaobject-updated trigger; deletions and collection changes are missed | Rejected |
| **L4 Collection-anchored reverse lookup** | Eligibility is a collection; the collection's `promotion.promotions` metafield lists the promotions using or featuring it; the theme checks only those promotions | `product.collections` (≤ 50) → ≤ 5 promotion references each → for each unique live promotion, compare offer and group collection IDs (no product loads) | Membership is Shopify's own and identical to the discount target; a missing back-link fails closed (no claim) and is flagged | **Selected** |

L4 cost is independent of how many campaigns exist or are archived. It depends on the number of collections a product belongs to (about 6–12 expected: brand, type, power source, combinations, battery system, plus promotions) and on the size of the few live promotions found. Variant narrowing reads one variant list only for groups that match. The cost still needs measurement: POC P-B sets a performance budget instead of assuming one.

### 7.3 Eligibility representation

Making collections the only product-level eligibility primitive adds one collection per eligibility set (for example 6–8 for STIHL Fall 2026). In return:

- the theme, the campaign page grid and the Shopify discount all read one membership;
- category offers use existing collections (G12 brand and type collections, battery-system collections) or automated rules with no copying;
- membership changes appear immediately everywhere.

Direct product lists were rejected because they create a second membership that can disagree with the discount and would force L1 scanning. Variants can't be expressed in product collections; a group's optional variant list narrows its collection.

---

## 8. Recommended architecture

### 8.1 Responsibilities

| Layer | Owns | Never does |
| --- | --- | --- |
| Shopify commerce | Prices, compare-at, discounts (schedule, targets, combinations), bundles, cart, checkout | — |
| Promotion data (merchant-owned metaobjects, collection metafields) | Content, offer structure, eligibility references, dates, redemption description, verification records | Enforce money |
| Theme | Lifecycle, lookup, rendering, Liquid verification, design-mode diagnostics, expiry guard, optional cart enhancements | Calculate prices or grant benefits |
| WordPress | Rental pages and categories as link destinations | Supply campaign data at render time |
| Staff procedures | Discounts, prices, collections, verification, MAP review, archival | — |

### 8.2 Schema

All definitions are merchant-owned (no `$app:` prefix), storefront public read, Admin read and write. Field order in each definition follows the authoring sequence. **Recommendation:** freeze only after POC P-A (§14).

**`promotion`** ("Promotion"): publishable, translatable, renderable (SEO title from `title`, description from `summary`), online store with URL handle **`promotions`**.

| Key | Type | Req. | Validation | Transl. | Purpose |
| --- | --- | --- | --- | --- | --- |
| `title` | single_line_text | ✓ | max 80 | ✓ | h1, cards |
| `sponsor` | single_line_text (choices) | ✓ | Location Gamma / STIHL / ECHO / Shindaiwa / Other manufacturer | — | Badge, MAP rules |
| `business` | single_line_text (choices) | ✓ | Equipment sales / Equipment rental / Sales and rental | — | Index grouping |
| `summary` | multi_line_text | ✓ | max 220 | ✓ | Cards, SEO |
| `eyebrow` | single_line_text | | max 60 | ✓ | Label above title |
| `intro` | rich_text | | | ✓ | Body |
| `image` | file_reference (image) | | | ✓ | Hero and card artwork (French via translation, POC P-A) |
| `starts_at` / `ends_at` | date_time | | | — | Inclusive start, exclusive end; blank = immediate / ongoing |
| `paused` | boolean | | | — | Emergency stop for the whole campaign |
| `priority` | number_integer | | 1–99 | — | Blank = 50; lower first |
| `offers` | list.metaobject_reference → `promotion_offer` | | max 12 | — | Ordered |
| `button` | link | | | ✓ | Primary call to action |
| `terms` | rich_text | | | ✓ | Campaign fine print |
| `source` | url | | | ✓ | Official manufacturer page |

**`promotion_offer`** ("Promotion offer"): publishable (Draft = this offer paused), translatable.

| Key | Type | Req. | Validation | Transl. |
| --- | --- | --- | --- | --- |
| `title` | single_line_text | ✓ | max 90 | ✓ |
| `summary` | multi_line_text | ✓ | max 200 | ✓ |
| `benefit` | choices: Promotional price / Free item / Kit or bundle price / Percentage or amount off / Manufacturer rebate / Financing / Rental discount or rate / Information | ✓ | | — |
| `redemption` | choices: Price shown / Automatic at checkout / Discount code / Add free item / Manufacturer claim / In store / Contact us / No action | ✓ | | — |
| `funding` | choices: Manufacturer program / Location Gamma / Shared | ✓ | | — |
| `label` | single_line_text (badge) | | max 28 | ✓ |
| `details` | rich_text | | | ✓ |
| `code` | single_line_text | | max 40 | ✓ (per-language codes) |
| `how_to` | rich_text | | | ✓ |
| `action` | link (claim form or details) | | | ✓ |
| `terms` | rich_text | | | ✓ |
| `image` | file_reference (image) | | | ✓ |
| `starts_at` / `ends_at` | date_time | | | — |
| `collection` | collection_reference (eligibility, when there are no groups) | | | — |
| `variants` | list.variant_reference (narrowing) | | max 50 | — |
| `rewards` | list.variant_reference (all items received) | | max 3 | — |
| `reward_limit` | number_integer (per order; blank = one per qualifying unit) | | 1–20 | — |
| `groups` | list.metaobject_reference → `promotion_group` | | max 8 | — |
| `checkout_verified_at` | date_time | | | — |
| `verification_note` | single_line_text (never rendered) | | max 200 | — |
| `map_reviewed_at` | date_time | | | — |

**`promotion_group`** ("Promotion group"): translatable. Fields: `heading` (required, max 80, translatable), `note` (max 60, translatable, e.g. "Free 5.0 Ah battery"), `description` (rich text), `collection`, `variants` (max 50), `rewards` (max 3), `reward_limit`, `rental_items` (list → `rental_item`, max 24), `link` (link, translatable: a WordPress category, rental search or "Shop all").

**`rental_item`** ("Rental equipment"): publishable, translatable, reusable. Fields: `title` (required, translatable), `url` (required, translatable: the French page URL is the translation), `image` (Shopify Files photo), `note` (max 60, translatable).

**Collection metafield definitions** (owner type Collection):

- `promotion.promotions`: list.metaobject_reference → `promotion`, max 5. This is the reverse link: it lists promotions that use this collection for eligibility, or that should be featured on its page.
- `seo.hidden`: number_integer. Shopify's standard SEO-hiding key; the definition simply makes it editable in Admin.

**If POC P-A shows** that Translate & Adapt can't replace metaobject `file_reference` or `url` values, replace those translatable fields with explicit `image_fr` and `url_fr` fields (the `battery_system` precedent). The theme then prefers the current language's field and falls back to the other.

### 8.3 Eligibility rules (one rule for every surface)

1. **Owner.** An offer without groups owns its eligibility (`collection`, `variants`, `rewards`). An offer with groups owns none; each group is an owner. An offer that has groups **and** offer-level eligibility is a configuration error: the theme ignores the offer-level fields and flags it.
2. **Membership.** A product qualifies under an owner when it belongs to the owner's collection. If the owner lists variants, only those variants qualify, and they must belong to products in the collection (others are ignored and flagged). An owner without a collection has no product eligibility; that is valid for informational and rental offers.
3. **Rewards.** All of an owner's `rewards` are received together. A reward is advertised only if its variant is published and available; otherwise the reward claim is withheld and the page says the free item is currently unavailable online.
4. **Overlapping groups in one offer.** A selected variant matching two owners of the same offer with **different** rewards is ambiguous: no reward is advertised for that variant and the conflict is flagged. Matching two owners with the **same** rewards is shown once.
5. **Several offers.** Each matching offer is independent and shown separately, in the order promotion priority, promotion end, then offer order. When two or more matching offers are checkout-enforced product discounts, the panel adds: "Only one product discount applies per item; checkout applies the best one." This mirrors Shopify's verified non-Plus rule.
6. **Source ambiguity.** Items listed ambiguously by the manufacturer (the two ECHO kits in two tiers) must not be placed in any reward-specific group until resolved. They can sit in an "Ask us in store" group with no reward.
7. **Duplicates across offers.** A product appears under every offer it qualifies for; there is no first-match deduplication.

### 8.4 Lookup contract and bounds

For a product (and its selected variant), the theme:

1. builds a token string of the IDs of `product.collections`;
2. for each collection, reads `promotion.promotions` and keeps each promotion once;
3. drops promotions that aren't live (§8.5);
4. walks the offers and owners of each remaining promotion, matching owner collection IDs against the tokens;
5. applies variant narrowing and rewards;
6. sorts and returns at most N offers (theme setting 1–3, default 2) plus a "more offers" link.

The same snippet serves the product page, the collection callout and the cart. **Bounds:** at most 50 collections per product (flag when `product.collections.size` exceeds 45), 5 promotions per collection, 12 offers, 8 groups, 50 variants. **Fail-closed rule:** a missing back-link, unpublished collection, missing reference or unavailable reward produces no claim, never a wrong one. Variant changes re-render the block server-side through Horizon's product update; POC P-B confirms the block participates.

### 8.5 Lifecycle, dates and caching

States are derived at render time from absolute instants. Authoring uses the store time zone (America/New_York, which matches Montreal), so daylight-saving changes need no special handling.

| State | Rule | Index | Campaign page | Product, collection, cart |
| --- | --- | --- | --- | --- |
| Draft | Shopify status | — | Not served | — |
| Invalid | `ends_at` ≤ `starts_at` | — | Unavailable notice (+ design-mode error) | — |
| Paused | `paused` true | — | "Temporarily unavailable", no offers | — |
| Scheduled | now < `starts_at` | Hidden (theme setting may show "Coming soon"; default off for manufacturer embargoes) | Unavailable notice, noindex; full preview in the theme editor | — |
| Live | `starts_at` ≤ now < `ends_at` (blanks open) | ✓ | Full | ✓ |
| Ended ≤ retention (default 30 days) | now ≥ `ends_at` | Optional "Recently ended" (default off) | "Ended {date}", intro only, no offers or calls to action, noindex | — |
| Ended > retention | | — | Ended notice + link to current promotions | — |

- **Offers** are effective when published, inside their own window and inside a live promotion. A discount-dependent offer also needs a valid `checkout_verified_at` (§8.7).
- **Displayed end.** The page shows the last valid day, computed as `ends_at` minus one second. A promotion valid "through November 20" is entered as `ends_at` = November 21 00:00 and reads "Ends November 20."
- **Claim margin.** For redemption modes enforced by a discount (automatic, code, free item), the theme hides the claim N minutes before `ends_at` (theme setting, default 30). The discount itself ends at `ends_at`, so customers who saw the claim can still complete checkout.
- **Cached pages.** Every time-limited claim carries `data-gamma-hide-at`. A small script hides those elements at that instant and re-checks on visibility changes. It is a best-effort guard (client clocks can be wrong); Shopify's re-render is authoritative. POC P-D measures how long cached HTML survives a boundary.

### 8.6 Enumeration, index and archival

- The index loops `metaobjects.promotion.values` inside `paginate … by 250`, so correctness holds up to 250 published promotions.
- Ordering: live first by `priority`, `ends_at` (open-ended last), then title. Keys are built and sorted in one pass, then rendered in a second pass over the same page of values, with no handle look-ups.
- Draft entries are excluded from the loop and from `values_count`. **Archival procedure:** set ended promotions and their offers to Draft after the retention period (monthly).
- Design mode warns at 200 published promotions and errors above 250. At the expected 15–25 campaigns a year, the ceiling isn't reachable even without archival.
- No other surface enumerates promotions: product, collection and cart pages use the reverse lookup.

### 8.7 Claim integrity

| What | Who guarantees it |
| --- | --- |
| The amount actually charged, discounts applied, combinations, schedules of discounts | **Shopify** |
| Dates and lifecycle, required fields per redemption mode, promotional prices (`compare_at_price > price` on each eligible variant), reward variants published and available, back-links present, collections published, variants inside their collection, MAP review recorded when required | **Liquid** (renders nothing on failure; explains in design mode) |
| A matching discount exists, is active, has the right targets, dates, value, combinations and per-order cap; the cart shows the allocation; the checkout summary shows it; Gamma participates in the manufacturer program; the copy matches the official terms; MAP compliance; artwork shows no stale prices | **Manual verification** before `checkout_verified_at` is recorded |
| A discount edited, deactivated or deleted after verification; reward stock running out between page view and checkout; manufacturer redemption outcomes; customers with stale tabs | **Cannot be guaranteed**; reduced by procedure and stated limits |

**Verification gate.** For redemption modes Automatic at checkout, Discount code and Add free item, the offer is not rendered publicly until `checkout_verified_at` is set and is later than the offer's effective start. Verification means: on the production storefront in an authorized session, add qualifying items (and the reward, for free items), confirm the cart allocation, open checkout and confirm the summary shows the discount, then **stop before payment**. Record the time and a short note. Price-shown offers need no gate because Liquid verifies the price on every render.

**Activation order.**

1. Prepare collections, back-links, content and translations with the promotion in Draft or paused.
2. Create discounts scheduled from the program start to `ends_at`. Manufacturer-funded benefits must stay inside the manufacturer's window.
3. Publish the promotion (Active) with its dates. Non-gated offers go live at `starts_at`.
4. After discounts start, verify in cart and checkout and record `checkout_verified_at`; gated offers appear.
5. For price-shown offers, change prices at the window start (never before: an early promotional price would be advertised below MAP outside the manufacturer's window).

**Deactivation order.**

- **Natural end:** claims disappear at `ends_at` (with the margin); discounts end at `ends_at`; promotional prices are reverted the same day. The product-page design-mode check flags any compare-at price with no live promotion.
- **Early end or pause:** set the offer to Draft or the promotion to paused, wait at least the cache window found in P-D, then deactivate the discount and revert prices.

**Recovery.** If a mismatch is found, set the offer to Draft immediately, then fix, re-verify and reactivate. Orders placed while a claim was wrong are handled by the business policy in §17 (recommendation: honour the advertised benefit).

### 8.8 MAP and manufacturer advertising rules

These rules replace the earlier blanket prohibition. They apply to **advertised** prices on the website; selling prices are unrestricted by both policies.

| Claim | STIHL (verified policy) | ECHO/Shindaiwa (verified summary; full policy on dealer portal) | SCS rule |
| --- | --- | --- | --- |
| Manufacturer program price or offer, as published, inside its window | MAP *is* "MSRP or in season promotional prices" | Workbook promotional prices and listed MAPP exceptions | Allowed. `funding` = Manufacturer program; `source` required |
| Store-funded price or percentage off a MAP product, shown on the site | Violation if the advertised price falls below MAP | Violation if more than $1.00 below MAP | Allowed only if the resulting advertised price is at or above MAP (STIHL) or not more than $1.00 below (ECHO). Requires a recorded `map_reviewed_at`; otherwise the theme hides the offer |
| Store-funded non-price benefits (free delivery, assembly, service, financing) | Allowed unless a dollar value implies a sub-MAP price | Not addressed in available text | Allowed without dollar values; review otherwise |
| Free goods with a MAP product | Allowed if the MAP product's net price isn't reduced; the free item's value can't be subtracted | Manufacturer "Free Goods" programs exist; store-funded free goods unaddressed | Allowed; never show "save $X" or a net price |
| Bundle of MAP products | Advertised bundle price ≥ sum of components' prices | Not addressed in available text | Manufacturer kits only; store bundles need review |
| Price shown only in the cart or in store | In-store price markings are excluded; cart display unaddressed | Unaddressed | **Unverified**: confirm with the manufacturers before relying on cart-only pricing |
| Used or discontinued equipment | Excluded from STIHL MAPP | Unaddressed | Allowed for STIHL; review for ECHO |
| Lingering promotional price after the window | Advertises below MAP | Same | Prevented by revert procedure and design-mode check |

A theme setting lists MAP vendors (STIHL, ECHO, Shindaiwa). Liquid compares the vendor of the current product, or of the products shown in an offer grid, against that list. Manufacturer marketing pre-approval for Gamma-authored pages remains a business question (§17).

### 8.9 Promotion-only collections

- Published to the Online Store (otherwise `product.collections` omits them).
- `seo.hidden` = 1, which also hides them from storefront search.
- Not added to menus. Named "Promo · {campaign} · {offer}". Unpublished or deleted when the campaign is archived.
- The theme's all-collections list (`main-collection-list`, which iterates `collections`) needs a small Gamma filter that skips collections with `seo.hidden` set. This is a minimal change to a Horizon section and should be reported as such.

### 8.10 Rendering contract and performance

**Theme files** (illustrative):

- Templates: `templates/metaobject/promotion.json`, `templates/page.promotions.json`.
- Sections: `gamma-promotion` (hero, state), `gamma-promotion-offers` (navigation, offers, groups, terms), `gamma-promotions-index`.
- Blocks: `gamma-promotion-banner` (product page), `gamma-promotion-callout` (collection page).
- Snippets, one rule each: `gamma-promotion-state`, `gamma-promotion-lookup`, `gamma-promotion-redemption`, `gamma-promotion-card`, `gamma-rental-item-card` (reusing `gamma-rental-url` and G14 card styles), `gamma-promotion-checks`.
- Script: `gamma-promotion-expiry.js`. Optional cart files: `gamma-cart-promotions` (a section rendered through the Section Rendering API) and `gamma-cart-rewards.js`.

**Performance budgets** (targets confirmed in POC P-B with Shopify Theme Inspector on representative data, not assumed figures):

- The product-page lookup adds no more than 10% to the median server render time of the same product page without the block.
- Campaign pages render at most 60 product cards (collection groups show the first 8 plus a link to the native collection page).
- No storefront request depends on an external service.

### 8.11 Missing and invalid data

| Situation | Behaviour |
| --- | --- |
| Missing French translation | Shopify falls back to English; nothing in Liquid can detect this, so it's a checklist item |
| Deleted product or variant | Removed from lists by Shopify; design mode shows owner counts on the campaign page |
| Unpublished eligibility collection, missing back-link | No claim; design-mode error |
| Reward unavailable | Reward claim withheld; "currently unavailable online" |
| Missing artwork | Text-only layout |
| Rental URL missing in one language | Other language's URL with `lang` and `hreflang`; design-mode warning |
| Offer window outside the campaign window | Intersection used; design-mode warning |

---

## 9. Customer-facing presentation

1. **Promotions index.** Heading and intro from the theme; *Equipment sales* and *Rentals* groups. Cards show artwork in the current language, a sponsor text badge (official logos only from approved brand packages), title, summary, a date line ("Until November 20" or "Ongoing") and a real link.
2. **Campaign hero.** Eyebrow, h1, uncropped artwork (manufacturer art carries text), summary, intro, dates, primary button, "Official offer details" (`source`), state notice.
3. **Offer navigation** when there are three or more offers (STIHL's pattern).
4. **Offer section** (h2): badge, heading, artwork, details, **redemption panel**, inline terms, then product cards or groups (h3 + note + cards).
5. **Product cards.** Native `_product-card`, with a note line under it ("Free 5.0 Ah battery", "Eligible: kit with 5.0 Ah battery"). Collection groups show 8 products and "See all {n}".
6. **Redemption panels.**
   - Price shown: "Price shown includes the promotion."
   - Automatic: "Applied automatically at checkout."
   - Code: "Use code {code} at checkout."
   - Add free item: "Add {reward} to your cart with an eligible item; it becomes free at checkout," with a no-JavaScript add-to-cart form for the reward that carries the private property `_gamma_offer`.
   - Manufacturer claim: "Claimed from {sponsor} after purchase — keep your receipt," with a claim link.
   - In store: "Available in store," with links to hours and contact.
   - Contact us: contact link.
7. **Rental card.** G14 look: photo in a white 4:5 box, title, note, a "Rental" label, a link to the rental page with a visually hidden "(rental site)" hint, same tab. Groups can add a category link.
8. **Product-page block** after the battery row: up to N live offers for the selected variant (badge, summary, redemption line, end date, "Promotion details" link to `#offer-{handle}`). A combination note appears per §8.3 rule 5.
9. **Collection callout** for promotions listed in the collection's `promotion.promotions`.
10. **Refinement R1: cart notes.** Under qualifying cart lines, a short note for non-checkout benefits ("Claim your STIHL rebate by …", "Ask in store for your free item") and for free-item offers whose reward isn't in the cart.
11. **Refinement R2: assisted free-item insertion** (gated by POC P-G). The same cart lookup runs in a dedicated section, requested with the Section Rendering API after each cart change, and outputs the free items the cart is entitled to. A small script adds or adjusts only lines carrying its private `_gamma_offer` property and never touches other lines. If the customer removes a reward, it isn't re-added in that session. An added reward that shows no discount allocation is removed with a notice, and the cart page also marks any undiscounted reward line server-side. On product pages with a free-item offer, accelerated checkout buttons are hidden, because "Buy now" skips the cart where the reward is added. The with-app proposal specifies this mechanism in full; it is theme-only, so it is equally available here.

**Principles.** Offer headings carry the benefit. All terms are HTML text; artwork is supplementary (WCAG 1.4.5). Manufacturer pages contain only that campaign's products (brand-exclusivity rules). Headings run h1 → h2 → h3. Fine print stays at least 10 px with normal contrast. Long French labels wrap.

---

## 10. Validation against real campaigns

### STIHL Fall Promotions 2026 (S1)

| Element | Representation | Enforcement at Gamma (recommendation) |
| --- | --- | --- |
| Campaign | `promotion`: sponsor STIHL; `ends_at` Nov 21 00:00; `source` = stihl.ca; STIHL artwork in both languages | — |
| (1) AK chainsaw set → 4 Ah battery **and** Wood-Pro kit | Offer, Free item; collection of 3 sets; `rewards` = battery, kit | Two BXGYs on one purchase are doubtful on Grow (BXGY products "ineligible for further product discounts"). If POC P-C fails: a Shopify Bundles fixed bundle reward, or **In store**. Never "automatic" until verified |
| (2) AK blower set → 4 Ah battery | Offer, Free item; collection shared with one BXGY | Add free item (gated) |
| (3)/(4) AP kit special price | Offer, Kit price; kit products at promotional price; terms "cannot be combined with (5)" | Price shown |
| (5) AP tool **+** AP battery → extra battery (model varies) | Offer, Free item, `how_to` explains the rule | **In store / Contact us** (not representable) |
| (6) Gas saw → Wood-Pro kit | Offer, Free item | Add free item (gated) |
| (7) Save on power tools | Offer, Promotional price; 8 products; no offer end date | Price shown |

**Findings:** all seven offers fit. The dual reward and the conditional rule are presented truthfully instead of as automatic. The MS 212 discrepancy is caught by the source-check step.

### ECHO Fall National Sales Event 2026 (E1)

- PB-9510 and the snow thrower attachment: Promotional price offers.
- Free battery: one offer with three groups, each with its own collection, note and reward. Kits modelled as variants of one product are narrowed with group `variants`, so the product page shows the right battery for the selected kit. The two duplicated kits stay out of reward groups until ECHO resolves them.
- Harness: group collection = the existing ECHO brushcutter collection (G12) with its back-link; one BXGY. **Conflict found:** battery brushcutter kits (for example DSRM-2600R2) are in a battery tier **and** in the brushcutter collection. On Grow, a product in one BXGY can't receive another product discount, so the customer could get only one of the two advertised benefits. Resolution: the harness offer lists those kits as "harness available in store", or the group uses a promotion-only collection that excludes battery-tier kits. The design-mode check flags any variant that appears under two free-item owners in one live campaign.

### STIHL Holiday 2025 (S3) and Autumn 2024 (S6)

- Free AS 2 battery with a redemption form → Manufacturer claim, with `action` (form link) and `how_to` (deadline, receipt).
- Free GTA 26 with two AS sets on one receipt → Manufacturer claim when STIHL fulfils it; otherwise BXGY (buy quantity 2) with Add free item.

### Shindaiwa Fleet Week (E5)

A product-free promotion: one offer, *Percentage or amount off*, In store, with the not-combinable terms and exclusions. If Gamma ever honours it online, a native automatic 15% discount on a Shindaiwa collection that excludes sprayers, spreaders, accessories and parts. Because the rule is 15% off **MSRP**, any Shindaiwa promotional prices must be reverted for that week; otherwise the native percentage would apply to the promotional price.

---

## 11. Rental and informational campaigns

**Cleaning & sanding (hypothetical).**

- Promotion: *Equipment rental*, sponsor Location Gamma, button "Call to reserve" (`tel:`).
- Offer "20% off cleaning and sanding rentals": *Rental discount*, In store, `how_to` "Mention this promotion when you reserve."
- Group **Cleaning**: rental items (carpet cleaner, upholstery cleaner, floor scrubber…) and a link to the WordPress Cleaning category (English URL; the French category URL as its translation).
- Group **Sanding**: floor sander, edge sander… and a link to Flooring / Plancher.
- An optional consumables offer has no cards.

**Weekend rate (no cards).** One offer, *Rental discount or rate*, In store. `how_to`: "Pick up Saturday, return Monday by 9:00 AM — charged as one rental day." This is a business example; confirm the wording before publication. The button links to the rental site.

**Informational campaign.** A promotion with no offers, or one *Information* offer: title, artwork, text, dates, button, optional external link.

**Boundary.** WordPress appears only in `rental_item` URLs, group links, one card snippet and the G14 site settings. A replacement catalogue would touch only those.

**Failure handling.** No photo → text card. URL outside the configured rental site → still linked (staff content), with a design-mode warning. Missing French URL → English with `lang`. Rental host change → update the G14 settings, then the reusable rental items.

---

## 12. Merchant workflows (Shopify Admin)

**Before any manufacturer campaign** (about 15 minutes): read the official English and French pages and any dealer bulletin; confirm Gamma's participation **and** online eligibility (some offers are shop.stihl.ca-only); collect manufacturer artwork in both languages, preferring artwork without prices.

**A. Seven-offer manufacturer campaign** (estimate: 3–5 hours the first time).

1. **Collections** (Products → Collections): one per eligibility set, or reuse brand, type or battery-system collections. Publish to Online Store, set SEO hidden for promotion-only ones, add the promotion to *Promotions* (`promotion.promotions`).
2. **Promotion** (Content → Metaobjects → Promotion → Add entry): required fields, dates, `source`. Create offers inline from the Offers field: title, summary, benefit, redemption, funding, collection or groups, variants, rewards, artwork, terms. Save with the promotion paused until ready.
3. **Discounts** (Discounts → Create): BXGY with buy = the offer's collection or variants, get = reward at 100%, quantity 1, per-order cap matching `reward_limit`; or amount-off; or code (one discount, French and English codes). Schedule to `ends_at`. Set combinations.
4. **Translate & Adapt → French:** the promotion, then each offer and group (text, French artwork and URLs, French code). Use the manufacturer's official French copy.
5. **Theme editor check** (Online Store → Customize → Promotion template → choose the entry): read the design-mode checklist and fix errors.
6. **Go live:** unpause. Price-shown offers: change prices at the window start in the bulk editor.
7. **Verify** after discounts start: cart and checkout summary per gated offer, stopping before payment; record `checkout_verified_at` and a note.

**B. Simple in-store rental promotion** (about 20 minutes): promotion + one offer (In store, `how_to`), translate, check, publish.

**C. Rental promotion with cards** (about 45 minutes first time, about 15 with reused items): add rental items (Content → Metaobjects → Rental equipment: name, English URL, photo); translate name and URL; create promotion → offer → two groups (inline) → pick items, add category links.

**D. Update, pause, end, archive.**

- Edit: visible on the next render.
- Pause: promotion `paused` or offer Draft first; then deactivate discounts.
- Resume: reactivate and re-verify discounts; then unpause.
- Early end: set `ends_at` to now; deactivate; revert prices.
- Natural end: automatic; revert prices that day.
- Archive: after 30 days set promotion and offers to Draft; unpublish or delete promotion-only collections; keep rental items.
- Reuse next season: create new offers. Admin duplication shares references, so editing a duplicated campaign's offers would change the old campaign.

**Practicality.** Acceptable at an expected 5–6 manufacturer and about 6 rental campaigns a year. The genuinely cumbersome steps: per-entry translation, separate discount configuration, manual price edits at boundaries, and the verification session.

**Admin authoring POC (P-A), required before freezing the schema.** A staff member who isn't the developer builds S1, E1 and the cleaning and sanding campaign on Gamma-Dev from written instructions. Acceptance:

- each campaign is completed without developer help;
- no undetected errors (the design-mode checklist catches all seeded mistakes);
- inline entry creation, reference ordering and list validations behave as specified;
- Translate & Adapt exposes metaobject `file_reference`, `url` and `link` translations;
- recorded authoring times are acceptable to the business.

Field order, required fields and the group/offer split are adjusted from the findings.

---

## 13. Future application compatibility

A later custom app can edit these same records, create the collections, back-links and discounts from one configuration, run deep duplication, automate cart probes and price changes, and detect drift. No content migration is needed. The theme contract (field keys, eligibility rules, lifecycle, verification gate) remains the interface, and app-written values such as `checkout_verified_at` mean the same as staff-written ones. App-owned (`$app:`) definitions should not replace these: Shopify deletes app-owned definitions when the app is uninstalled ([docs](https://shopify.dev/docs/apps/build/metaobjects/manage-metaobject-definitions)).

---

## 14. Roadmap, proofs of concept and verification

### Proof-of-concept gates (dev store; authorized separately)

| POC | Question | Blocks |
| --- | --- | --- |
| P-A Authoring | Admin usability, inline nesting, Translate & Adapt for images, URLs and links | Schema freeze |
| P-B Rendering | `/pages/promotions` alongside `/pages/promotions/{handle}` in both languages; `system.url` language-aware; product-page lookup within budget; block re-renders on variant change | T1, T5 |
| P-C Discounts | BXGY with collection and variant buys; two BXGYs on one purchase; BXGY plus a promotional price; per-language codes on one discount; allocation when the reward variant is also bought separately | Free-item claims |
| P-D Caching | Delay before cached HTML reflects a date boundary | Claim margin default |
| P-G Assisted insertion | Cart line identity, bundled section rendering, removal handling, accelerated checkout | R2 only |
| P-PL Price list (optional) | Can a promotional price list on the primary market replace per-variant edits on Grow? | Simplifies price operations if it passes |

### Theme branches

| Branch | Scope | Depends on | Acceptance | Size | Launch |
| --- | --- | --- | --- | --- | --- |
| **T1 `feature/promotion-pages`** (replaces G18) | Definitions contract, `gamma-promotion-state`, promotion template, hero, notices, terms, noindex, expiry guard | G03, G06, G10; M1 | All lifecycle states at exact boundaries and across DST; product-free campaign at `/` and `/en` | M | Essential |
| **T2 `feature/promotion-offers`** (replaces G19 detail and G21 presentation) | Offers, owners, cards, redemption panels, verification and MAP gates, `gamma-promotion-checks` | T1, G12 | S1 and E1 fixtures faithful; gates fail closed; ≤ 60 cards within budget | L | Essential |
| **T3 `feature/rental-promotions`** | Rental cards and links, URL checks | T2, G14 | Cleaning and sanding, weekend rate, failure cases | S | Essential |
| **T4 `feature/promotions-index`** (replaces G19 index) | Index, ordering, archival warnings, collection callout, collection-list filter | T1 | Ordering, empty state, 250 bound | M | Essential |
| **T5 `feature/product-promotions`** (replaces G20) | `gamma-promotion-lookup`, product-page block, combination note, orphan compare-at check | T2, G07, G09; P-B | Variant changes, multiple offers, conflicts | M | Essential |
| **T6 `feature/cart-promotions`** | R1 cart notes; R2 assisted insertion if P-G passes | T5, G11 | Cart drawer and page, Quick Add, no-JS cases | M | Refinement |

**Operations workstream O1** (replaces G21): discount POC P-C, verification and MAP procedures, staff walkthrough. Required before any discount-dependent claim. **G22** is not applicable without an app; record that decision. **G23** stays independent. **G24** adds the journeys index → campaign → product → cart, expiry, rental card → rental site, and each redemption mode.

### Merchant configuration (separately authorized)

| Step | Work |
| --- | --- |
| M1 | Gamma-Dev: definitions and collection metafields per §8.2; fixtures |
| M2 | Gamma-Dev: P-C with test checkouts |
| M3 | Primary cutover (§15) |
| M4 | Launch content: STIHL and ECHO Spring 2027 when announced, rental promotions, translations |

### Verification plan (later; `shopify theme dev` on gamma-dev-2318.myshopify.com; French at `/`, English at `/en`)

- **Static:** `npm run check:all` with only the seven known Horizon warnings.
- **Fixtures:** S1, E1, cleaning and sanding, weekend rate, Fleet Week, informational.
- **Lifecycle matrix:** every state; boundaries to the second; DST; paused versus Draft; margin.
- **Eligibility:** owner rules, variant narrowing, overlapping groups, conflicting rewards, multiple offers, ambiguous items, missing back-links.
- **Data failures:** deleted products and variants, unpublished collections, unavailable rewards, missing French, off-origin rental URLs.
- **Commerce (authorized):** every gated mode in cart and checkout summary; P-C cases.
- **Surfaces:** theme editor add, remove and reorder; Quick Add; cart drawer and page; accelerated checkout; JavaScript disabled.
- **Accessibility:** axe, keyboard, NVDA/VoiceOver, 320 px at 200% zoom, long French text.
- **Performance:** Theme Inspector against the §8.10 budgets.

---

## 15. Migration and compatibility

| Item | Action | When |
| --- | --- | --- |
| New theme | Nothing to remove | — |
| `sales_campaigns` / `promo_offers` | Don't migrate the data (one expired, unverified entry each). On Gamma-Dev, disable the online-store capability on `sales_campaigns` to free the `promotions` URL handle, then create `promotion`. On Primary, do the same at cutover after confirming which theme is published and whether the storefront is password-protected. Delete old definitions once the new theme is live | M1 / M3 |
| Collection `stihl-spring-sale-2026`, codes `GAMMA5OFF`/`GAMMA5RABAIS` | Keep or delete | M3 |
| `promotions` page (suffix `sales`) | Reassign to `page.promotions` | M3 |
| `sales-campaign-manager` | Confirm it isn't installed with write access on Primary; retire it | Before M3 |
| Completed features | Reuse G07, G09, G10, G11, G12, G14, G16; no changes to completed branches beyond the new blocks | T1–T6 |
| Horizon | New sections, blocks and snippets; one filter in `main-collection-list` (§8.9); report it | T4 |

---

## 16. Comparison with the existing plan

| Dimension | Existing G18–G23 | This proposal |
| --- | --- | --- |
| Real campaign coverage | Partial: no redemption, offer dates, groups, rewards, per-language artwork | Full; non-representable rules declared honestly |
| Product-free and rental | Collection and products required | First-class |
| Membership | Campaign collection + offer lists + proposed projection; mode-dependent | One collection-anchored rule shared with discounts |
| Product lookup | Scans every campaign | Bounded reverse lookup through collections |
| Financial truth | Release manifest, hourly rechecks | Verification gate, Liquid checks, ordered activation |
| MAP | Not modelled | Policy-grounded rules with review gate |
| Lost | Prototype field compatibility; detailed acceptance wording (port into T1–T6) | — |

---

## 17. Risks and open decisions

### Ranked risks

| # | Risk | Prevention | Remaining exposure |
| --- | --- | --- | --- |
| 1 | Discount edited or disabled after verification | Procedure; Draft-first changes | Undetected until noticed (structural limit of no-app) |
| 2 | MAP violation (store price claims, lingering promotional prices) | Review gate; orphan compare-at check; revert procedure | Human timing |
| 3 | Offer not valid for Gamma's channel | Participation check; `source` | Human |
| 4 | Two-gift or conditional offers shown as automatic | Representability table; verification gate | Low |
| 5 | Product in two free-item offers gets only one benefit (non-Plus BXGY rule) | Design-mode conflict check | Low |
| 6 | Duplicated campaign shares old offers | Procedure | Medium |
| 7 | Missing French | Checklist | Medium (undetectable in Liquid) |
| 8 | Lookup render cost | Bounds; P-B budget | Low |
| 9 | Stale cached claims | Margin; expiry guard; P-D | Low |
| 10 | Silent shrinkage of variant lists after deletions | Owner counts in design mode | Low |
| 11 | Promotion-only collections visible in lists | `seo.hidden`; list filter | Low |
| 12 | Automatic discount budget (25) exhausted | Count during planning | Low |

**Can the design advertise a benefit that isn't available?** Only in two ways: a discount changed after verification, or reward stock running out between viewing and checkout. Checkout always shows the true total before payment. It cannot present a conditional, in-store or manufacturer-redeemed benefit as automatic, and it cannot show a price Shopify doesn't charge.

### Decisions for approval

1. Online honouring of manufacturer free-item offers (BXGY, customer adds the reward or R2 adds it), and confirmation with STIHL and ECHO that Gamma's online sales qualify.
2. The MAP rules in §8.8, a named reviewer, and asking both manufacturers about cart-only pricing.
3. Whether Gamma-authored STIHL or ECHO pages need manufacturer marketing pre-approval.
4. Policy for orders placed while a claim was wrong (recommendation: honour the advertised benefit).
5. Retention (30 days), "Coming soon" and "Recently ended" (both off), claim margin (30 minutes pending P-D), product-page offer count (2).
6. Rental wording (weekend and holiday rates, "heavy equipment").
7. Type names and URL `/pages/promotions/{handle}`.

---

## 18. Final verdict

This is the strongest genuinely no-app design: every researched campaign can be represented, every claim is either verified by Liquid or gated behind an authorized checkout verification, eligibility has one definition shared with the discount, and the storefront never depends on anything outside Shopify. Its unavoidable weaknesses are manual effort and the absence of automatic drift detection after verification.

**Replace** the existing G18–G22 plan with this design; keep G23 separate and extend G24. Next step if approved: authorize M1 and POC P-A on Gamma-Dev, then T1. The companion with-app proposal compares this design with an app-administered system and a phased path between them.

---

**Sources** (beyond those linked above): [STIHL Autumn Professionals 2024](https://www.stihl.ca/en/autumn-professionals) · [STIHL promos 2025](https://www.stihlpromos.ca/4ah-battery/english.php) · [ECHO promotions](https://www.echo.ca/promotions) · [Shindaiwa promotions](https://www.shindaiwa.ca/promotions) · [metaobject definitions and uninstall behaviour](https://shopify.dev/docs/apps/build/metaobjects/manage-metaobject-definitions) · [validation options](https://shopify.dev/docs/apps/build/metafields/list-of-validation-options) · [dynamic sources](https://shopify.dev/docs/storefronts/themes/architecture/settings/dynamic-sources) · [unlisted products](https://shopify.dev/docs/apps/build/product-merchandising/unlisted-products) · [API versioning](https://shopify.dev/docs/api/usage/versioning) · internal: 2026 STIHL Dealer Support Manual, 2025 ECHO Policies and Procedures, 2026 Spring ECHO/Shindaiwa MAPP workbook (headers and notes only).
