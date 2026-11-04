# Gamma theme development plan

## Project overview

Gamma is a bilingual Shopify storefront for Location Gamma, combining equipment sales with clear access to rental services. The theme will provide dependable product information, practical purchasing guidance, useful store information and coordinated promotional campaigns. Merchants should be able to manage content and presentation through Shopify's normal editing tools.

Development starts from the current modified Horizon fork on `dev`. The foundation is Horizon 4.3.0 at `6de238c5fc76a877a73beafc0e34be7b98284431`, identified by `vendor/horizon-v4.3.0`. The working tree, project configuration and merchant settings on the receiving development branch must be inspected before each change. [README.md](../README.md) covers the development environment; [AGENTS.md](../AGENTS.md) defines repository conventions.

### Objectives

- Provide complete French and English shopping, discovery and store-information journeys.
- Keep product selection, pricing, inventory, pickup, cart and checkout consistent with Shopify.
- Make content and appearance manageable in the theme editor without routine source edits.
- Support accurate availability information and promotional claims across related surfaces.
- Retain Horizon's native capabilities, accessibility and performance while keeping custom changes maintainable through future updates.

All required features in this plan contribute to the finished storefront. Priorities determine development order; they do not remove lower-priority requirements. Optional extensions are identified explicitly. Integration-dependent work remains planned until its business requirement is confirmed or a decision records why it is not applicable.

## Architecture and project-wide requirements

### Horizon and Online Store 2.0

- Keep the theme buildless. Use `layout/` and JSON templates for composition, `sections/` and `blocks/` for editor components, `snippets/` for shared rendering, and `assets/` for CSS and JavaScript.
- Prefer native settings and components when they meet the requirement. Keep custom components focused on Gamma behavior and avoid unnecessary changes to upstream files.
- Report confirmed upstream Horizon issues. Fixes or workarounds for them require explicit authorization; a feature requirement does not itself authorize that additional work.
- Preserve section/block ownership, schema IDs, merchant settings, presets, editor selection and dynamic section insertion/removal. Use dynamic blocks where merchants need ordering and composition control; retain appropriate native static blocks.
- Follow current Horizon custom-element, event, rendering and CSS conventions. Check the actual receiving version before relying on a component contract.
- Preserve vendor attribution and the project license. During authorized Horizon updates, retain unmodified vendor documents as `README-horizon.md`, `LICENSE-horizon.md` and `release-notes-horizon.md`, following repository guidance.
- Keep the existing local development tools and locked dependencies. Add narrowly scoped development improvements only when implemented features demonstrate their need. This plan does not require a bundler, broad test framework, hooks or CI infrastructure.

### Shopify authority and shared state

Shopify supplies authoritative variants, numeric amounts, availability, quantity rules, cart state, discounts, pickup locations and resource URLs. Theme enhancements display this information and support interaction; they must not independently determine checkout prices or purchase eligibility.

Product-dependent content must remain correct after native option changes, combined-product selection, Quick Add rendering and asynchronous section updates. Scope updates to the owning product and section/dialog. Reject stale responses, handle aborted or failed work, and remove listeners and timers when components disconnect. Preserve useful initial server-rendered content and meaningful native navigation without JavaScript.

At the planning baseline, `assets/product-price.js` and `assets/product-inventory.js` demonstrate the `StandardEvents.productSelect` promise contract; `assets/header-actions.js` demonstrates native cart-count announcements. These are current integration examples, not frozen APIs. Confirm their behavior during implementation and after an upstream update.

### Content and localization

- Maintain `en.default.json`, `fr.json`, `en.default.schema.json` and `fr.schema.json`. Regional locale files need a demonstrated requirement.
- Use natural Quebec French for French customer-facing content. Preserve Shopify's exact published language codes; language-family normalization is appropriate for choices such as French imagery or menu counterparts.
- Keep Shopify's localization forms and locale-aware resource URLs. Preserve supported resource, query and cart context when switching languages.
- Translate merchant content, menu labels, options, filters, metaobjects, image descriptions and linked documents as well as theme strings. Matching locale keys do not establish content completeness.
- Preserve typed metafields, references, IDs/handles and source ownership. Review definitions, publication/access and actual values before introducing schema changes. New fields require an explicit purpose, definition, population plan and consumer.
- Keep public content separate from private operational state. Credentials, supplier costs, customer information and internal inventory identifiers do not belong in storefront markup or public content objects.

### Accessibility, responsiveness and performance

Each feature must support keyboard use, visible focus, semantic structure, accessible names and appropriate announcements. Validate contrast and readable states, including long French labels. Use responsive layouts, support zoom and reduced motion, and avoid conveying information through color alone.

Feature appearance requirements define the intended placement, content hierarchy and visual treatment. Use native editor controls for supported layout choices and let merchants reorder configurable blocks. Exact dimensions, spacing and breakpoints remain design choices where no value is established; validate them with real content in both languages rather than treating an illustrative size as a fixed requirement.

Check representative widths of 320, 375, 768 and 1440 pixels, 200% text/zoom scenarios and reflow where relevant. These are verification cases, not a prescribed breakpoint system. Include touch interactions and available Safari, Chromium and Firefox coverage for affected behavior.

Measure affected pages against the native theme using comparable data and conditions. Keep initial content useful, load enhancements only where needed, and bound third-party requests. Agree measurable performance budgets from representative fixtures before accepting expensive scans or integrations; do not invent a catalog-size limit or performance guarantee without evidence.

### External services and operating boundaries

Use supported Shopify app integrations and native services where appropriate. External failures must leave unaffected shopping functions usable. Validate external destinations, avoid unnecessary data transmission and respect the approved privacy behavior.

Store authentication, previews/uploads, synchronization, configuration writes, installations, test transactions and publication require explicit authorization. Before any authorized store operation, verify the store identity, theme ID and actual role. Names such as `dev` are not identity or safety evidence.

## Implementation approach

For each feature:

1. Start with its purpose, functional requirements and acceptance criteria. Resolve only the decisions that block the next coherent increment.
2. Inspect the current theme architecture and relevant native implementations, including callers, response markup and editor configuration.
3. Research current official Shopify documentation and applicable Horizon conventions. Use available Shopify Dev MCP, Shopify tooling, Context7 or official documentation as appropriate; verify capabilities rather than assuming a tool or connection exists.
4. Select an implementation suited to the current platform and theme. Prefer native functionality, straightforward architecture and a small upstream integration surface.
5. Define the affected content contracts, component boundaries and verification cases before changing shared behavior. Keep choices proportionate to the feature; a general framework is not a prerequisite.

### Prototype reference

The feature-specific reference subsections describe historical implementations in `/home/chris/shopify/gamma-shopify-theme-old`. Paths in those subsections are relative to that repository unless another source is named. The principal source is `sales-campaign-system` at `6bf3a3815ff6a7a5bbd2e5b3d2a93a9c0abe11f6`; where stated, `origin/dev` at `fee1b1401f9854351639ff58a7f51fdbc14462a6` supplies additional behavior. They are technical references, not prescribed solutions.

6. Evaluate the corresponding implementation against the functional requirements, current documentation and native architecture.
7. Reuse or adapt a sound approach when it remains suitable, particularly when no clearly better alternative is established. A different implementation is not inherently an improvement.
8. Where an approach is useful but limited, refine it for correctness, maintainability and production use. Do not carry incidental defects or obsolete upstream components into the design.

### Verification and implementation references

9. Verify the completed feature against its acceptance criteria, affected native behavior and connected workflows. Update its status only to the level established by the evidence.

Useful starting points are Shopify's [theme architecture](https://shopify.dev/docs/storefronts/themes/architecture), [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates), [theme blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks), [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering), [localization](https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages) and [performance guidance](https://shopify.dev/docs/storefronts/themes/best-practices/performance). Consult the relevant detailed documentation when the feature is developed.

## Roadmap and feature index

Priorities are P0 for shared prerequisites, P1 for purchasing/browsing/discovery and P2 for complete business-information and promotional workflows. G24 is a required final gate. G01's foundation is established; its compatibility requirements continue throughout development. An **Implemented** status records local code; feature acceptance remains pending until its criteria are verified.

| Phase | ID | Feature | Priority | Dependencies | Status |
| --- | --- | --- | --- | --- | --- |
| 1. Foundation and data | G01 | Horizon foundation and development compatibility | P0 | Current `dev` | Established |
| 1. Foundation and data | G02 | Content, data and merchant configuration | P0 | G01 | Planned |
| 2. Shared storefront presentation | G03 | French and English navigation | P1 | G01; G02 for content | Implemented |
| 2. Shared storefront presentation | G04 | Gamma branding | P1 | G02, G03 | Implemented |
| 2. Shared storefront presentation | G05 | Native privacy presentation | P1 | G03, G04 | Implemented |
| 2. Shared storefront presentation | G06 | Bilingual CAD presentation | P1 | G02, G03 | Planned |
| 3. Products and purchasing | G07 | Product information and scoped updates | P1 | G02, G03 | Planned |
| 3. Products and purchasing | G08 | Availability and fulfillment information | P1 | G02, G03, G07 | Planned |
| 3. Products and purchasing | G09 | Battery systems and recommendations | P1 | G02, G03, G07 | Planned |
| 3. Products and purchasing | G10 | Localized media and product video | P1 | G03; G02 for content | Planned |
| 3. Products and purchasing | G11 | Cart experience | P1 | G04, G06, G08 | Planned |
| 3. Products and purchasing | G12 | Collection layouts and filters | P1 | G03, G04, G06, G08, G09, G10 | Planned |
| 4. Search and rental discovery | G13 | Home search entry | P1 | G03, G06 | Planned |
| 4. Search and rental discovery | G14 | Rental search integration | P1 | G02, G05, G13 | Planned |
| 5. Business content and location | G15 | Home, footer and information pages | P2 | G02, G03, G04, G07, G09, G10, G13 | Planned |
| 5. Business content and location | G16 | Regular and holiday hours | P2 | G02, G03, G15 | Planned |
| 5. Business content and location | G17 | Maps, directions and activation | P2 | G02, G05, G15 | Planned |
| 6. Promotions and integrations | G18 | Campaign data, routes and lifecycle | P2 | G02, G03, G06, G12 | Planned |
| 6. Promotions and integrations | G19 | Campaign index and detail browsing | P2 | G10, G12, G18 | Planned |
| 6. Promotions and integrations | G20 | Product campaign banners | P2 | G07, G18, G19 | Planned |
| 6. Promotions and integrations | G21 | Discount and promotion operation | P2 | G11, G15, G18, G19, G20 | Planned |
| 6. Promotions and integrations | G22 | Campaign application compatibility | P2 | G02, G18, G19, G20 | Planned |
| 6. Promotions and integrations | G23 | UTM and referral integration | P2 | G02, G05, G11 | Planned |
| 7. Integrated acceptance | G24 | Complete storefront verification | Required gate | All required features | Planned |

Phases group related work; they need not be rigidly sequential. Once language and data contracts are settled, branding and money presentation can proceed independently. Product details, media and home search can also proceed independently when their dependencies are ready. Hours and map development can run alongside campaigns after shared content/privacy requirements are established. Coordinate changes to shared product templates, cards, cart snippets and locale files before local integration.

Use coherent feature branches following the repository workflow, typically one feature or independently useful increment at a time. Implementation research, local work, merchant setup and rendered acceptance can progress separately. A blocked external prerequisite should not stop unrelated development.

## Phase 1 — Foundation and data

### G01 — Horizon foundation and development compatibility

**Priority:** P0. **Status:** Established. **Dependencies:** Current modified `dev` branch.

#### Purpose

Keep Gamma's custom features compatible with the purchasing, editing and accessibility capabilities that Horizon already supplies. Merchants must be able to change layouts and settings without custom behavior breaking, and future Horizon updates must remain practical to evaluate and integrate.

#### Expected behaviour and functional requirements

- Customers retain native rendering, product/cart interactions, account controls, localization and disclosures as Gamma features are added. Merchants retain the corresponding editor controls and supported alternative layouts.
- Keep each custom change bounded and identifiable against the vendor baseline.
- Maintain the existing local checks, dependency lockfile, development exclusions and English/French locale selection.
- Preserve merchant settings, licenses, upstream authorship and vendor documents during subsequent development and authorized upstream updates.

#### Technical requirements and compatibility

Follow the repository's buildless architecture and existing `package.json` commands. Use the current dependency pins and project configuration as the source of truth. Reproduce and report suspected native defects against the actual receiving baseline; obtain explicit authorization for any upstream fix or workaround. Incorporate useful development improvements only when justified by implemented code and permitted by repository guidance.

#### Edge cases and quality

Account for native behavior used outside the preferred storefront configuration, such as cart drawers, Quick Add and alternate editor layouts. Configuration choices must not conceal regressions in those capabilities. Keep known upstream diagnostics visible.

#### Acceptance criteria

- [x] Horizon 4.3.0 and the existing development setup form the starting foundation.
- [ ] Each implemented feature passes applicable existing checks and full-diff review.
- [ ] No feature unnecessarily replaces native purchase, localization or editor behavior.
- [ ] Authorized upstream updates preserve Gamma requirements and vendor notices.

#### Prototype reference

The prototype used Horizon 3.4.0 with project settings, definition exporters and extensive development guidance. Its partial upstream backports included uncalled helper snippets. Relevant locations are `package.json`, `.theme-check.yml`, `.shopifyignore`, `shopify.theme.toml` and `scripts/shopify/`. Current native implementations and project conventions are more appropriate than copying that support structure. Historical environment labels did not reliably identify actual theme roles.

### G02 — Content, data and merchant configuration

**Priority:** P0. **Status:** Planned. **Dependencies:** G01.

#### Purpose

Let staff maintain reusable business and product information in Shopify's normal content tools, with clear ownership of each value. Shared advice and policies should not require separate, potentially contradictory copies for every variant or placement; option-specific information must still be expressible where it differs. Dependent features need reliable definitions, references and translations before they can present that information accurately.

#### Expected behaviour and functional requirements

- Identify the approved sources for product/variant details, policies, battery systems, menus, media, authored pages, hours, campaigns and app settings.
- Define which information is shared at product or business level and which may vary by option, language or placement. A merchant should be able to update the appropriate source without editing Liquid or maintaining unrelated copies.
- Record required fields, reference targets, publication/access requirements, translations and template assignments before enabling dependent behavior.
- Distinguish absent data from empty or deliberately cleared content. Each consumer must have a documented fallback.
- Preserve exact identifiers and typed relationships. Review any additive definition changes before populating data; do not change existing ownership or types incidentally.
- Treat catalog identifiers and offsets as supporting data. Catalog import, PoR synchronization and quantity automation are optional projects, not assumed theme services.

#### Technical requirements and compatibility

The planned product-information interface uses namespace `custom` on products and variants: five rich-text families (`included_in_the_set`, `gamma_s_advice`, `spare_parts_accessories`, `manuals_documentation`, `frequently_asked_questions`), `technical_specifications` as `list.single_line_text_field`, and typed `warranty_policy`/`return_exchange_policy` references. Product-owned relationships include `battery_system` and the optional `item_set_link` product reference. Verify actual definitions, validations and values before implementation.

Public campaign, offer, hours and policy content should remain manageable through suitable Shopify content tools. Native references, translatability and storefront access should be researched before selecting new data structures. A new campaign membership projection or hours-priority field is an open design choice, not a required schema addition.

#### Edge cases and quality

Cover draft/deleted/inaccessible references, incorrect types, missing translations, unavailable files and incomplete exports. A cached definition or populated CSV column is insufficient evidence of current store readiness. Keep private identifiers, supplier costs and operational records out of public outputs.

#### Acceptance criteria

- [ ] Every dependent feature has a verified data/setup contract or a named unresolved prerequisite.
- [ ] Required definitions, references, access and bilingual content have been checked before feature acceptance.
- [ ] Any approved new fields have definitions, population instructions and demonstrated consumers.
- [ ] Empty, invalid and unavailable data produces the specified safe presentation.

#### Prototype reference

Definitions are recorded under `docs/metaobjects/`; the eight information families appear in `templates/product.json`. `origin/dev` adds product fallback to variant fields. `.shopify/metafields.json` is cached schema evidence rather than authoritative store state. `por_key`, `inventory_offset` and `item_set_link` appear in supporting data, but the prototype runtime did not consume them. Definition export scripts provide useful field/reference evidence without establishing current values or publication readiness.

## Phase 2 — Shared storefront presentation

### G03 — French and English navigation

**Priority:** P1. **Status:** Implemented. **Dependencies:** G01; G02 for menus, destinations and translations.

#### Purpose

Send customers to the appropriate French or English destination, including services and documents outside Shopify. Translate & Adapt can translate a custom menu link's text, but not its destination URL (`href`): Shopify's [translatable resource specification](https://shopify.dev/docs/api/admin-graphql/latest/enums/TranslatableResourceType#valid-values-LINK) exposes only `title` for a link. Translating a rental link's label therefore does not make it lead to the French rental site or document. Language-specific menu destinations address that gap while native Shopify product, collection and page links continue to use Shopify's localized routing.

#### Expected behaviour and functional requirements

- Support French and English across the header, mobile drawer, navigation bar and footer. Both the visible label and the destination must be appropriate to the selected language wherever approved counterparts exist.
- Prefer one translated menu when native resource links or genuinely shared external destinations satisfy the requirement. Support language-specific menus when external URLs or menu structure differ; translating labels alone is insufficient for those cases.
- Let merchants maintain the English and French external destinations through supported menu/configuration tools. Use approved counterpart URLs rather than deriving them by replacing words, domains or path prefixes.
- Select only a usable counterpart; otherwise retain the merchant's configured menu. Apply language-family handling consistently, including French regional codes. A fallback keeps navigation usable but does not satisfy acceptance for a missing required French destination.
- Preserve nested links, ordering, active/current states, native resource destinations and supported language-switch context.
- Keep theme/editor translations complete, with interpolation and plural forms intact.

#### Appearance and placement

Keep the header's primary links, nested menus and mobile drawer in their native navigation roles. Footer menus remain grouped under their merchant-managed headings. Language-specific menu selection changes content and destinations within these components; it must preserve their hierarchy, active-link treatment, disclosure controls and usable spacing for longer French labels. Keep language and country controls recognizable as distinct controls.

#### Technical requirements and compatibility

Inspect `blocks/_header-menu.liquid`, `blocks/menu.liquid`, header/drawer components and `snippets/localization-form.liquid`. Use native localization forms and Shopify resource links, including translated resource handles; the custom-link limitation does not justify rewriting native URLs. If convention-based counterpart selection is appropriate, centralize it and recognize only established terminal suffixes or explicit configuration. Preserve normal editor menu selection and native account/country controls.

#### Edge cases and quality

Missing/empty counterparts, unrelated configured menus, external links, long French labels and nested mobile navigation need explicit coverage. Avoid path-prefix manipulation. Native links/forms should remain useful without JavaScript; custom enhancements must preserve focus and accessible names.

#### Acceptance criteria

- [ ] Both languages expose approved menus, nesting and working destinations on desktop and mobile.
- [ ] An external link with different approved French/English URLs reaches the correct destination in each language; a translated label pointing to the wrong-language destination fails acceptance.
- [ ] Native product, collection and page links retain Shopify's localized routing and translated handles where configured.
- [ ] Missing or unsuitable counterparts fall back to the configured menu.
- [ ] Language changes preserve supported resource/query/cart context.
- [ ] Keyboard, no-JS and editor-selection checks pass without affecting native account/country controls.

Local implementation (`5afa306`, `ff78b4f`): shared bilingual menu selection, merchant overrides/fallback and shell menu configuration are present. Approved destinations, live localized routing and desktop/mobile/editor acceptance remain pending.

#### Prototype reference

`blocks/_header-menu.liquid` selected `main-menu-fr`; `blocks/menu.liquid` mapped terminal `-en`/`_en` handles to French counterparts. Header and generic-menu handling differed for `fr-CA`, and a global header override could disregard another configured menu. The counterpart/fallback concept is useful; a shared resolver and native translated menus should be evaluated for the final design.

### G04 — Gamma branding

**Priority:** P1. **Status:** Implemented. **Dependencies:** G02, G03.

#### Purpose

Make the storefront recognizable as Location Gamma across browsing, purchasing and business-information pages. The approved logos, typography and colors should communicate one identity while remaining legible in normal, inverse and sticky layouts; brand styling must support practical use of the store.

#### Expected behaviour and functional requirements

- Apply approved primary/inverse logos, favicon, Inter/Oswald typography and Gamma palette to appropriate native roles. Use the artwork suitable for each background so customers can identify the business in every supported header/footer state.
- Provide responsive logo sizing, clear menu emphasis, useful spacing, component corners and readable product text wrapping.
- Let merchants manage supported appearance choices through normal theme settings and usable presets. Inverse/sticky states and missing-artwork fallbacks must remain coherent.
- Use accessible foreground/background combinations in default, hover, focus and disabled states.

#### Appearance and placement

Use the approved Gamma logo in the header and the inverse artwork where the background requires it; use the approved favicon for browser identity. Apply Inter/Oswald and the palette through consistent heading, body, accent, button and link roles. Menu emphasis, product-name wrapping, corners and spacing should form one coherent storefront style. Final sizes and color-role pairings require rendered review, including inverse/sticky headers, rather than arbitrary positioning offsets.

#### Technical requirements and compatibility

Use Horizon 4.3 palette, font and image settings before adding CSS. Inspect existing role mappings and font-loading behavior; do not treat older color-scheme IDs as current interfaces. Scope necessary styling to the relevant component and preserve native fluid sizing. Confirm artwork availability and usage rights through G02.

#### Edge cases and quality

Test logo/tagline readability, transparent/inverse backgrounds, French accents/emphasis, long labels, narrow headers and zoom. Exact logo dimensions and detailed spacing remain design decisions to be validated through rendered review, rather than copied pixel values.

#### Acceptance criteria

- [ ] Approved artwork, fonts and palette roles render correctly in applicable header/footer states.
- [ ] No overlap, clipping or arbitrary positioning is needed at representative widths and zoom.
- [ ] Text, controls and focus states meet the agreed accessibility requirements.
- [ ] Merchant settings/presets and native font delivery continue to work.

Local implementation (`42b9649`, `39f6d86`): Gamma artwork references, native font/palette settings, header/footer configuration and scoped title wrapping are present. Artwork availability and rendered accessibility/editor acceptance remain pending.

#### Prototype reference

`config/settings_data.json` configured Gamma logos, 60px header logos, fonts, colors and component preferences. `assets/custom.css`, `sections/header.liquid` and `_header-menu.liquid` added spacing, a 5.55px centering offset, text wrapping and menu emphasis. These locations explain the visual intent; positional patches and low-contrast color pairings need reconsideration rather than direct adoption.

### G05 — Native privacy presentation

**Priority:** P1. **Status:** Implemented. **Dependencies:** G03, G04.

#### Purpose

Give customers understandable control over permitted data processing through Shopify's native privacy choices. Branded presentation must leave those choices usable, and external map or attribution behavior must agree with the permission actually recorded so the storefront does not give conflicting signals about what a customer has allowed.

#### Expected behaviour and functional requirements

- Present accept, decline, preferences and close actions with clear labels and usable prominence, preserving native choice and regional behavior.
- Retain native consent persistence, preference review and withdrawal.
- Apply Gamma typography, colors and visible focus with graceful fallback when native markup changes.
- Define which recorded permissions, if any, govern each map and attribution operation, and what withdrawal stops or clears. A customer must be able to continue ordinary shopping after declining an optional integration. Additional analytics requires a separate confirmed requirement.

#### Appearance and placement

Style the native privacy banner and preferences surface with Gamma typography, readable colors and visible button/focus states. Keep the native placement and responsive interaction unless a supported configuration deliberately changes them. All available choices must fit and remain distinguishable in French and English; branded styling must not hide or visually bury decline or preference controls.

#### Technical requirements and compatibility

Research Shopify's current Customer Privacy API and actual supplied banner markup. Prefer supported configuration; scope any stylesheet hooks narrowly and leave native handlers in charge. Theme styling does not establish policy content or legal approval. G17 and G23 must consume the agreed permission contract rather than introduce independent consent systems.

#### Edge cases and quality

Cover first visit, previously recorded choices, denied permission, withdrawal, unavailable API/hooks, long French labels and zoom. Missing styling hooks should leave native functionality intact. Verify processing behavior through actual requests where an external integration is involved.

#### Acceptance criteria

- [ ] All native choices are visible and keyboard-operable in both languages.
- [ ] Preference reopening, persistence and withdrawal work through native navigation.
- [ ] Layout, contrast and focus remain usable on narrow screens and at zoom.
- [ ] Dependent integrations respect the approved permission and revocation behavior.

Local implementation (`505b754`): scoped native privacy typography, control shape, wrapping and focus styling is loaded. The interface handoff is documented below; live choices, persistence, reopening, withdrawal and responsive/keyboard acceptance remain pending.

#### Prototype reference

`assets/custom.css` styled Shopify privacy controls but hid the banner decline button. Historical `f80ccf12:layout/theme.liquid` loaded Clarity after privacy permission; that injection was absent from the active prototype layout. The useful reference is branded native presentation, not hidden choices or an assumed analytics requirement.

#### Native interface handoff and implementation boundary

Shopify remains the consent authority. Banner copy, translations, regions, colors and placement are managed through Customer privacy settings and supported translation tools; theme styling does not establish permission or policy approval.

Consumers use the [Customer Privacy API](https://shopify.dev/docs/api/customer-privacy) directly: reuse an available API or load `consent-tracking-api` version `0.2` through `Shopify.loadFeatures`, then read `preferencesProcessingAllowed()`, `analyticsProcessingAllowed()`, `marketingAllowed()` and `saleOfDataAllowed()`. Read initial state after readiness and re-read on `visitorConsentCollected`; subscribing alone does not supply initial state. Missing methods/APIs or failed loads are unavailable permission, never a grant. Do not inspect or modify Shopify consent cookies, infer permission from banner visibility, or add another consent store.

G05 owns native presentation, choices, persistence, reopening and this interface handoff. `assets/gamma-privacy.css` scopes theme typography, control shape, wrapping and focus to the inspected native `#shopify-pc__banner` and `#shopify-pc__prefs__dialog` roots. Shopify retains colors, placement, markup and handlers. The supplied native interface injects a `#shopifyReshowConsentBanner` link into the policy list, so no custom reopening control or JavaScript is needed. Recheck these hooks after platform changes; unmatched CSS must leave native presentation functional. No map, attribution or additional analytics implementation belongs to this branch.

Operation-specific permission mapping, persistence, withdrawal cleanup and request verification belong to G17/G23. Earlier map answers remain G17 planning preferences: explicit activation may load one map without preferences permission; remembering activation requires preferences permission and applies across maps for the session; withdrawal unloads active maps and clears memory, with fresh explicit activation still available. Shopify classifies attribution under marketing; G23 must verify the selected app's actual permission and revocation behavior. Those future integration decisions and tests do not gate G05's native presentation acceptance.

### G06 — Bilingual CAD presentation

**Priority:** P1. **Status:** Planned. **Dependencies:** G02, G03.

#### Purpose

Let English- and French-speaking customers read CAD prices in familiar notation without misinterpreting decimal or thousands separators. Language affects presentation, not the amount owed. Store money-format settings alone do not establish that every surface is correct in both languages, particularly where initial Liquid output and later updates use different renderers.

#### Expected behaviour and functional requirements

- Provide consistent CAD presentation for selected/range/compare-at prices, cards/search, unit/tier/per-item prices, cart lines/discounts/totals and gift-card remaining balance.
- Use the approved English and French conventions consistently, for example English `$1,234.56` and French `1 234,56 $` when the currency code is hidden. Currency-code visibility remains a separate merchant setting; exact spacing and rounding must agree with the chosen supported format.
- Respect existing currency-code visibility settings and actual presentment currency. Use supported native formatting for other currencies.
- Preserve native price labels, measurement units, quantity/tier selection and asynchronous updates.
- Keep filter inputs, bounds, parsing and requests internally consistent; localize visible summaries separately where needed.
- A customer who changes language, selects an option or updates a cart must see the same authoritative amount in the appropriate notation. A gift-card holder must see what remains available to spend, including after partial use.
- Keep Open Graph and other machine values numeric/invariant while preserving native structured data.

#### Appearance and placement

Format amounts in their existing price, card, search, filter, cart and gift-card positions. Preserve the native hierarchy between current price, compare-at price, discounts, unit/tier information and totals; locale formatting must not flatten those distinctions. Keep the currency symbol/code attached to its amount and allow long price ranges to wrap without clipping or overlapping controls.

#### Technical requirements and compatibility

Begin by measuring native output under the approved merchant money format and locale settings. Use a focused shared display layer only for demonstrated gaps. Inspect the current price, cart, facet, quantity, volume and gift-card renderers; maintain their expected units and escaping. Currency comes from the authoritative price/cart/gift-card context, not an assumed CAD label or country selector alone.

#### Edge cases and quality

Cover zero, one cent, whole amounts, thousands, large values, absent inputs, code visibility, gift-card partial balance, empty filter bounds and rapid section updates. Reproduce and report a suspected native metadata/facet issue; any upstream fix or workaround follows G01's authorization requirement. No display helper may calculate checkout discounts or totals.

#### Acceptance criteria

- [ ] Representative CAD amounts are correct in both languages across every listed surface.
- [ ] Visible prices agree with Shopify responses after product, quantity, filter and cart updates.
- [ ] Filter boundaries remain exact, including empty bounds and clearing, with no 100-fold conversion error.
- [ ] Gift cards show the remaining balance; machine metadata and structured amounts remain valid.
- [ ] Applicable non-CAD behavior and native tier/unit-price functions remain intact.

#### Prototype reference

`snippets/qc-money.liquid` used native French money output and an English CAD string transformation. Callers include price/cart/filter/quantity/volume snippets, buy buttons and `templates/gift_card.liquid`. The gift-card template output a raw balance, `meta-tags.liquid` used display text for an amount, and a facet fallback mixed cents with major-unit input. A shared display concern is valid; string assumptions and numeric-contract changes are not suitable production defaults.

## Phase 3 — Products and purchasing

### G07 — Product information and scoped updates

**Priority:** P1. **Status:** Planned. **Dependencies:** G02, G03.

#### Purpose

Give customers the information needed to judge what they are buying: what is included, whether its specifications suit the job, how to use or maintain it, and which policies apply. A bare tool and a kit can need different information even within one product. Merchants should maintain common information once and supply variant-specific differences where necessary; the displayed information must follow the option the customer actually selects.

#### Expected behaviour and functional requirements

- Provide eight independently manageable families: included items, technical specifications, Gamma's advice, parts/accessories, manuals/documentation, FAQ, warranty, and returns/exchanges.
- Present included items as the contents of the selected purchase, keep optional accessories distinct, and provide usable links to the relevant manuals and policy content. Do not imply compatibility or included equipment that the approved content does not establish.
- Use usable selected-variant content first, then product content. Empty/cleared variant content inherits the product content; an explicit hide override is not currently a requirement.
- Hide rows with no useful content while retaining meaningful rich text, media and document links. Preserve ordered specification labels/values, units and everything after the first colon.
- Let merchants control row ordering, headings, icons and initial-open state through appropriate editor components.
- Update the relevant information when the customer changes an option or combined product, without requiring a full page reload. The content must agree with the selected price and purchase controls while preserving surviving disclosure state and appropriate keyboard focus.

#### Appearance and placement

Place the eight information families in a disclosure/accordion group beneath the product description within the main product-information area. Use clearly labeled rows, consistent dividers and expand/collapse indicators; allow optional row icons and merchant ordering. The starting composition opens included items and technical specifications and leaves the other rows collapsed, with initial state editable. Show specifications as a readable label/value table and preserve rich-text hierarchy and document links in the other rows. Empty rows leave no empty headings or separators.

#### Technical requirements and compatibility

Use G02's typed fields and native metafield rendering. Reusable blocks/snippets should isolate content resolution from layout without a speculative general-purpose framework. Research the current product-select/section-response contract and keep a stable update target even for empty output. Scope identity and response matching by product, block and owning section/dialog; handle combined listings and clean lifecycle registration.

#### Edge cases and quality

Cover wrong-type/draft/deleted references, whitespace-only markup, image/file-only output, specification rows without delimiters, colon-containing ratios/URLs, unavailable options, rapid A→B→A changes and aborted responses. Independent products and Quick Add must not update one another. If focused content disappears, move focus only within the relevant interaction context and never steal it from another control.

#### Acceptance criteria

- [ ] All eight families show the correct variant/product content and translated headings.
- [ ] Empty rows disappear without losing useful content, values or document links.
- [ ] Native option/product updates cannot display stale or another product's information.
- [ ] Disclosure/focus behavior, no-JS initial content and editor add/reorder/remove/save work.
- [ ] The information group, initial-open settings, specification table and rich-text rows render legibly below the description in both languages and at narrow widths.
- [ ] Price, picker, media, purchase controls and native Quick Add remain functional.

#### Prototype reference

`templates/product.json` embedded eight Liquid renderers inside `accordion-dynamic` and `_accordion-row-dynamic` blocks below the description, with included items/specifications initially open and the other rows collapsed. The campaign checkout used variant fields; `origin/dev` added product fallback. Text-stripping could hide useful markup, specification slicing lost later colon segments, and ordinary variant selection did not refresh custom details. The field families, typed references and automatic relevance are useful design inputs; embedded template logic and stale updates should be reconsidered.

### G08 — Availability and fulfillment information

**Priority:** P1. **Status:** Planned. **Dependencies:** G02, G03, G07.

#### Purpose

Help customers distinguish an item they can order from an item available from stock. A purchasable item may be backordered or require special procurement, so a simple available/sold-out label cannot communicate the whole fulfillment expectation. Provide approved explanations before purchase while leaving Shopify authoritative for order eligibility and actual pickup-location availability.

#### Expected behaviour and functional requirements

- Show selected-variant information on product pages and each actual line variant in carts.
- Distinguish native unavailable/quantity-limited choices, available untracked items, tracked stock, backorders and special orders using an approved status table.
- Explain an approved delay beside the affected option or cart line, rather than presenting every purchasable item as immediately in stock. Untracked inventory must not be treated as proof of a backorder, and mixed options must not inherit one option's delay claim.
- Support the exact product tag `special order` as an input; any different data model needs a deliberate decision.
- Make card-wide delay claims only with proven complete variant data. Show neutral option guidance when the aggregate is uncertain; retain native sale/sold-out information.
- Use native per-location pickup information. Include only merchant-approved lead-time and mixed-order shipping wording.

#### Appearance and placement

Place an applicable backorder/special-order notice after the option picker and before purchase controls, so the customer sees it before adding the selected option. Use a softly highlighted, rounded notice with a status-specific icon beside explanatory text; the message must identify the condition without relying on color. Use compact status labels/badges on product cards and line-specific text in carts, with any approved whole-order notice in the summary. Ordinary stock or unavailable states do not need an empty warning panel; retain their native indicators and keep pickup information with the native pickup component.

#### Technical requirements and compatibility

Keep status resolution reusable across PDP, cards and cart while retaining separate presentation needs. Handle the platform's actual management-service, inventory-policy and quantity-rule fields. Use G07's selected-product update requirements and native card/cart response paths. Bound variant aggregation, establish completeness and profile its cost before accepting it for collection grids.

#### Edge cases and quality

Cover negative/zero/positive stock, tracked/untracked/service-managed variants, deny/continue policies, minimum quantities, mixed sold-out/delayed/in-stock choices and partial/high-count arrays. A tag cannot make an unavailable item purchasable or turn aggregate stock into a pickup-location promise. Unconfirmed delivery terms remain a content prerequisite.

#### Acceptance criteria

- [ ] The approved status table is satisfied on PDP, cards and actual cart lines.
- [ ] Mixed or incomplete variant data never produces an unsupported product-wide claim.
- [ ] Product/card/cart updates clear obsolete custom messages and remain isolated by owner.
- [ ] Multiple pickup locations and native quantity/purchase validation remain correct.
- [ ] Approved wording is accessible in both languages and adds no invented stock or delivery promise.
- [ ] Notices appear at the purchase decision point, card labels remain compact and each cart message is visibly associated with the correct line.

#### Prototype reference

`snippets/inventory-status.liquid` fed `blocks/availability-notice.liquid`, card gallery, cart products and cart summary. The product template placed the notice between picker and purchase controls; the block used a pale highlighted panel with distinct backorder/special-order icons beside text. `buy-buttons.liquid` modified pickup wording using aggregate inventory. Untracked items could be labeled backordered, mixed sold-out/delayed products could lose badges, and the cart assumed ship-together policy. The informational overlay is useful; its truth table and operational claims need independent validation.

### G09 — Battery systems and recommendations

**Priority:** P1. **Status:** Planned. **Dependencies:** G02, G03, G07.

#### Purpose

Help customers recognize the battery platform a tool belongs to and find the associated range and relevant accessories. The system identity is useful purchasing guidance when choosing equipment around an existing battery platform. It must remain distinct from the list of items included in the purchase and must not imply compatibility beyond the merchant-approved product relationships.

#### Expected behaviour and functional requirements

- Identify the product-owned battery system through its preferred-language icon, readable type and associated collection link, using its name wherever needed for clear identification or fallback.
- Let customers follow an available system link to explore its associated collection. Identify integrated or other system types according to the approved data, without implying that every product uses a removable interchangeable battery.
- Provide meaningful text when an image is unavailable, and useful nonlinked content when no destination exists.
- Present native complementary accessories and related recommendations in approved placements, making optional purchases distinguishable from included equipment and keeping empty sections unobtrusive.
- Optional extension: expose a directional product-to-kit link from `custom.item_set_link` if approved. It does not imply reciprocity, bundles or shared stock.

#### Appearance and placement

Place a compact battery-system row in the product's title/price group, below the price and before the option picker and purchase controls. Show the system's language-appropriate icon/logo next to readable type text, such as “Interchangeable battery” or “Integrated battery,” using the approved translation. Preserve the artwork's aspect ratio and provide an icon-height control; align the text with the icon and allow long labels to wrap without overlap. Use the system name for identification or an accessible fallback where needed, rather than requiring a redundant second visible heading.

When an associated collection exists, make the icon-and-text presentation a clear, keyboard-accessible link to that range. Without a destination it remains informative, and without an icon it retains useful text. Merchants can position the block within the supported product composition. Complementary accessories and related recommendations belong in separately headed product-card sections after the main product information, rather than inside the battery row.

#### Technical requirements and compatibility

Resolve typed `battery_system` references and use native image/resource rendering. Relevant fields are `name`, `icon_fr`, `icon_en`, `system_type` and `collection`; verify actual validations and translations. Use native recommendation services and components. Product-owned relationships must follow combined-product changes while ordinary option changes retain the owning product's data.

#### Edge cases and quality

Handle missing/draft/wrong-type objects, unusable image references, missing alt text/destinations and empty recommendations. Any approved set link needs behavior for self-references and unavailable destinations; sold-out destinations are not automatically invalid merchandising links. Keep keyboard access and narrow layouts usable.

#### Acceptance criteria

- [ ] Battery content, icons and native collection destinations are correct in both languages.
- [ ] Missing content has appropriate text/nonlinked/empty behavior.
- [ ] Native complementary and related recommendations work without misleading empty headings.
- [ ] Product ownership, Quick Add isolation, accessible links and responsive presentation pass.
- [ ] The product composition shows the battery icon beside its translated type below the price; configured height, proportional scaling, text fallback and narrow-screen wrapping work without displacing purchase controls.
- [ ] Any optional set link has separate approved scope and does not imply inventory relationships.

#### Prototype reference

`blocks/product-system-badges.liquid` rendered `custom.battery_system` as a localized icon beside `system_type`, with a collection link wrapping both where available. The icon-height setting defaulted to 30px, with proportional width and small heading-style text. `templates/product.json` placed the block directly after price in the header group, before the campaign banner and variant picker, and placed complementary/related sections after the main information. An earlier `snippets/system-badges.liquid` was superseded by the block. Supporting `item_set_link` data had no runtime consumer, so the directional kit link is an extension rather than established storefront behavior. Improve missing-image/text fallback and responsive constraints instead of treating these styling details as a fixed implementation.

### G10 — Localized media and product video

**Priority:** P1. **Status:** Planned. **Dependencies:** G03; G02 for approved catalog media.

#### Purpose

Show customers product illustrations and demonstrations they can understand in their chosen language. Text embedded in an image does not change when theme labels are translated, so language-specific artwork needs its own selection rules while neutral photography can be shared. Product videos also need usable controls and a presentation that preserves important demonstrations or instructions within the frame.

#### Expected behaviour and functional requirements

- Support neutral media plus decoded terminal `-en`/`_en` and `-fr`/`_fr` filename conventions. Normalize request language families without treating incidental SKU text as a language marker.
- In each language, show shared neutral media and its matching localized media. A translated caption or alt text does not make opposite-language embedded artwork appropriate; agree the fallback when no eligible media exists.
- Apply one consistent eligibility decision before featured selection, ratios, slide counts, thumbnails, zoom and model data.
- Keep selected variants, card hover/swatches, unavailable combinations and product transitions within eligible media. Define a useful neutral/localized fallback and empty-media state.
- Let customers operate available product-video playback controls, including pause and seeking, without cropping the demonstration to fill a decorative frame. Preserve applicable native audio/fullscreen controls and review privacy-enhanced YouTube behavior across both URL-based and external-product-video rendering.

#### Appearance and placement

Use the native main product gallery beside the product details on larger layouts and its supported mobile arrangement. Keep thumbnails, slide indicators, zoom and variant-associated media visually consistent with the eligible items. Product videos use a contained presentation so the full demonstration remains visible; controls must remain reachable. Collection/search cards keep their native image areas and hover/swatches while selecting language-appropriate media. Desktop grid/slideshow choices and image sizing remain merchant-configurable where supported.

#### Technical requirements and compatibility

Inspect current card/gallery, product media, slideshow, zoom, deferred video and model/XR components together. Prefer native translated content/neutral photography where sufficient; retain explicit language-specific images when their content differs. Preserve IDs, variant associations, player parameters, responsive loading and editor controls. Avoid duplicating native selection or playback controllers.

#### Edge cases and quality

Cover an excluded selected image, only one eligible item, no eligible media, hidden variant images, high media counts, encoded filenames, query strings and missing preview filenames. Region-specific filename aliases remain an explicit future decision. Verify video controls, looping, model payloads, mobile taps, keyboard and zoom. A privacy-enhanced host is not itself proof of consent behavior.

#### Acceptance criteria

- [ ] Every media surface uses the same approved eligibility and fallback rules.
- [ ] Featured media, controls, counts, thumbnails and zoom/model targets agree after selection changes.
- [ ] Full product-video controls, contain/crop behavior and applicable provider settings work.
- [ ] Single/empty/high-count cases, both languages, no-JS initial output and editor settings pass.
- [ ] Native card transitions, playback, image loading and XR capabilities remain functional.

#### Prototype reference

`snippets/card-gallery.liquid` and `product-media-gallery-content.liquid` filtered preview filenames independently. Underscore recognition, featured insertion and pre-filter counters were inconsistent. `product-media.liquid` enabled controls; `custom.css` applied containment. The `video.liquid` YouTube host change covered URL-based video, while external product video used a separate filter path. The intent should be evaluated across the complete current media pipeline.

### G11 — Cart experience

**Priority:** P1. **Status:** Planned. **Dependencies:** G04, G06, G08.

#### Purpose

Give customers a place to review the actual items, quantities, costs and fulfillment expectations before proceeding to checkout. Visible order notes let them pass relevant instructions to staff; line-specific availability information makes delayed items clear in mixed orders. Notes and notices communicate information without independently changing the store's fulfillment rules or promising that a request will be accepted.

#### Expected behaviour and functional requirements

- Configure a cart-page preference so customers can review the complete summary, a visible/open order note for instructions, the approved installment-message preference and native accelerated checkout where eligible.
- Support the approved mobile Quick Add preference while keeping native drawer and Quick Add behavior compatible.
- Present accurate per-line and aggregate fulfillment information from G08, including only approved mixed-order policy.
- Keep the entered note through supported cart updates and make clear which line a delay affects. Any statement that the whole order ships together requires the merchant's explicit operational approval.
- Retain discounts, selling plans, quantity rules, line identity, validation/errors and native cart-count announcements.
- Keep displayed amounts consistent through G06 and preserve supported back/forward behavior.

#### Appearance and placement

Use the native cart page's item list and order summary, with the note area initially visible/open. Show line availability beside the affected item's details; place any approved combined-order explanation near the checkout summary. Preserve the distinction between item prices, adjustments, subtotal and checkout controls. On mobile, allow the native layout to stack while keeping note, errors and actions readable; the preferred page layout does not remove support for the drawer.

#### Technical requirements and compatibility

Use current cart settings, sections/snippets and native cart events/response rendering. Preserve upstream queueing, error recovery, note persistence, live regions and checkout actions. Add custom messages within native update boundaries; avoid a second cart state owner or client-calculated totals.

#### Edge cases and quality

Cover empty, single and mixed carts; rapid quantity changes; removal; stock/quantity errors; selling plans; disabled accelerated checkout; network failures and back-forward cache handling. Check drawer and Quick Add even when the configured main journey uses a cart page. Avoid duplicate announcements or lost notes.

#### Acceptance criteria

- [ ] Approved cart, note, installment, accelerated-button and mobile Quick Add settings work.
- [ ] Correct line-specific fulfillment messages update with native cart changes.
- [ ] Discounts, quantities, notes, totals and line identity remain authoritative and consistent.
- [ ] Empty/error/back-navigation, keyboard and screen-reader cases pass in both languages.
- [ ] Native drawer, Quick Add and accelerated-checkout eligibility remain compatible.

#### Prototype reference

`config/settings_data.json` selected cart page, open notes, hidden installments, accelerated buttons and disabled mobile Quick Add. Cart snippets added money/status output and a ship-together notice. `assets/header-actions.js` was an upstream-history cart-announcement backport. Current native announcements replace that event contract; operational copy still needs merchant confirmation.

### G12 — Collection layouts and filters

**Priority:** P1. **Status:** Planned. **Dependencies:** G03, G04, G06, G08, G09, G10.

#### Purpose

Help customers narrow the products in a collection using choices that can meaningfully change the result. A collection already restricted to one brand, product type or power source does not need to ask customers to select that same attribute again. Specialized layouts should remove that redundant step while retaining the useful filters, descriptions and product controls for each collection context.

#### Expected behaviour and functional requirements

- Support a general collection layout and brand, type, power-source, brand/type and brand/power-source variants.
- Establish the intended fixed attributes through collection/template setup. For example, an approved single-brand view omits its redundant vendor control while retaining filters for relevant differences between its products; a general view retains the applicable choices.
- Hide the redundant vendor filter in brand views, product-type filter in type views and power-source filter in power-source views; combined views apply the corresponding pair.
- Keep desktop and drawer filter choices consistent, including active-filter removal and direct filtered URLs.
- Preserve merchant collection/template assignments, descriptions, card settings, sorting, density and pagination/infinite scroll.
- Share layouts where requirements are equivalent without erasing meaningful differences.

#### Appearance and placement

Use native collection headings/descriptions, a responsive product-card grid and the supported desktop/mobile filter surfaces. The specialized variants share this visual structure; their distinguishing behavior is the appropriate filter set and authored collection content. Removing redundant controls must close the resulting space cleanly. Cards retain image, title, price, applicable badges and purchase controls, with consistent spacing across filtered and later-page results.

#### Technical requirements and compatibility

Build on `sections/main-collection.liquid`, `blocks/filters.liquid`, native cards and `snippets/product-grid.liquid`. Prefer a narrowly scoped parameter/configuration decision over selectors tied to incidental markup or translated labels. Preserve native facet counts, responses, accessibility links, pagination and G06 amount contracts.

#### Edge cases and quality

Cover empty collections/results, active hidden parameters, clear-all, later pages, back navigation and data whose labels differ between languages. Hiding a redundant control must not strand an active filter. Verify native swatches/Quick Add, G08 availability and G10 media together on mobile and desktop.

#### Acceptance criteria

- [ ] All six collection contexts expose the intended controls and approved content.
- [ ] Direct filtered URLs, removal, sorting and later-page navigation remain usable.
- [ ] Desktop/drawer behavior, counts and state remain consistent after asynchronous updates.
- [ ] Native product cards, language URLs, keyboard and responsive behavior pass.

#### Prototype reference

`templates/collection.json` and five specialized collection templates used native section/card trees. Their `custom_css` hid vendor, product-type or power-source facets, sometimes in pairs. The files establish genuine filter differences and content assignments, not a separate collection query engine. Current filter markup and merchant settings should determine the final integration.

## Phase 4 — Search and rental discovery

### G13 — Home search entry

**Priority:** P1. **Status:** Planned. **Dependencies:** G03, G06.

#### Purpose

Let customers who already know the equipment or term they want begin searching immediately from the home page. The prominent entry is another way into the same search experience used by the header: customers should not have to find a small header control, type their query twice or learn a second set of result interactions.

#### Expected behaviour and functional requirements

- Provide an editor-managed responsive search form with appropriate width, spacing and appearance controls.
- When the customer starts a query, transfer committed typing, paste or submission to the shared native search dialog when it is available and ready. Continue with the exact entered query and let the customer edit, navigate results or submit full search there.
- Keep the typed query intact during initialization and recently viewed loading. Composition should remain in its original input until committed.
- Retain normal localized full-search submission when JavaScript or the dialog is unavailable.
- Preserve native keyboard navigation, focus transfer/return, result behavior and search events.

#### Appearance and placement

Provide the search field as an editable block in the home hero beneath its main heading, where it is immediately visible. Use a wide, rounded field with an integrated search icon and clear input text/placeholder. Support a centered custom desktop width, a mobile width that fits its container, and background/transparency and spacing controls so the field remains legible over imagery. Opening search uses the same native dialog and results presentation as the header entry.

#### Technical requirements and compatibility

Inspect the current predictive search component, search dialog and form conventions before choosing the enhancement boundary. Keep a valid GET form using Shopify's search route. A home entry should not establish a second request/result controller. Isolate Gamma integration errors from suspected native initialization, cancellation or reset defects. Report a confirmed upstream issue and obtain explicit authorization before adding its fix or workaround.

#### Edge cases and quality

Cover a fresh first open, recently viewed state, IME, paste/replacement input, rapid edits, clear, Escape, close/reopen, missing dialog, failed requests and editor disconnect/reconnect. Never intercept input or submission without a usable enhancement path. Keep touch targets, narrow layouts and zoom readable.

#### Acceptance criteria

- [ ] Home typing, paste and committed composition reach the shared dialog without losing or duplicating text.
- [ ] No-JS and missing-dialog forms navigate to correct localized search results.
- [ ] Clear, close, reopening and rapid requests cannot apply stale content or clear a newer query.
- [ ] Native focus, keyboard, search events and editor placement remain functional.
- [ ] The hero search field remains recognizable and readable over the configured image, including French text, mobile width and keyboard focus.

#### Prototype reference

`blocks/search-box.liquid` defined a rounded field with an integrated search icon, responsive width, background transparency and spacing, plus a custom element opening `search-modal` and forwarding input/paste. `templates/index.json` placed it beneath the home hero heading. Its interception could lose the fallback when the modal was missing. A snapshot-only `assets/search-box.js` duplicated the same general controller role and had no confirmed runtime caller. The shared-dialog entry is useful; duplicate ownership and unconditional interception are not.

### G14 — Rental search integration

**Priority:** P1. **Status:** Planned. **Dependencies:** G02, G05, G13.

#### Purpose

Help customers find equipment even when they have not yet decided whether to rent or buy. The rental catalog is held outside Shopify's sale-product catalog and is not included in its native product search. A separate rental result group connects that catalog to the storefront's search journey while making clear which results lead to the rental service rather than a Shopify purchase.

#### Expected behaviour and functional requirements

- Display a clearly labeled rental result group without replacing native Shopify results or waiting for them to succeed. A query with no sale products may still have rental matches; each group must communicate its own result state.
- Support approved French and English API, full-search, result and image destinations. Provide a rental-search destination from the full Shopify search page.
- Show useful titles, optional images and onward links, with localized loading/empty/failure behavior as appropriate.
- Rental result links lead to the approved equipment page on the rental service. Full rental-search links carry the customer's query and appropriate language according to that service's contract; the theme does not imply rental booking or checkout within Shopify.
- Preserve a usable rental destination when the external API fails. Clear or invalidate results when the query changes, becomes too short, closes or disconnects.
- Bound request duration, results, cache lifetime and optional image fanout. Choose concrete budgets from service behavior and storefront measurements before acceptance.

#### Appearance and placement

Place rental matches in a separately headed group within the shared search dialog, visually aligned with native result cards but explicitly identified as rentals. Each result has a readable equipment title and an optional image in the card's media area; absent images do not leave a broken-image frame or obscure the link. Keep loading/empty/failure text within the rental group. The full Shopify search page also provides a clearly labeled onward rental-search link. Exact group ordering should follow the verified native search structure and keyboard flow.

#### Technical requirements and compatibility

Use an isolated adapter and the current native search presentation boundary. Confirm the public API contract, CORS, locale mapping and allowed HTTPS origins before enabling it. Validate response shape, safely decode text and validate all returned navigation/image URLs. Avoid credentials or unnecessary cookies and remove customer-query debug logging. Native result updates must not erase or duplicate the rental group, and rental failures must not break native search.

#### Edge cases and quality

Handle timeout, abort, CORS/HTTP errors, invalid JSON, empty responses, unsafe links, missing images and late completions. Keyboard navigation must include or clearly reach rental links without trapping customers or misreporting native result counts. A future domain change requires explicit endpoint, asset and deep-link verification; no new domain is assumed.

#### Acceptance criteria

- [ ] Approved bilingual queries produce correctly labeled, usable rental results and full-search destinations.
- [ ] Native sales search remains usable during every external failure or delay case.
- [ ] Shortening, changing, clearing and closing queries cannot display stale rental results.
- [ ] Request/cache limits, safe text/URLs, keyboard behavior and narrow layouts pass focused and rendered checks.
- [ ] Actual authorized endpoint/CORS checks confirm the configured service contract before activation.
- [ ] Rental and sale results are visually distinguishable, while image, text and status layouts remain coherent on narrow screens and with long French titles.

#### Prototype reference

`assets/predictive-search-legacy.js` queried `wp-json/wp/v2/products`, normalized titles/images and optionally fetched featured media. `assets/predictive-search.js` inserted results, `snippets/search-modal.liquid` supplied localized configuration and `sections/search-header.liquid` added a full-search rental link. The design had abort tokens and text output, but native-success coupling, unbounded media fanout, indefinite last-query caching, debug logging and unvalidated returned destinations needed reconsideration.

## Phase 5 — Business content and location

### G15 — Home, footer and information pages

**Priority:** P2. **Status:** Planned. **Dependencies:** G02, G03, G04, G07, G09, G10, G13.

#### Purpose

Help customers understand the business, contact the right department and assess the service and policies behind a purchase. Home and footer content provide orientation and onward routes; contact, warranty and authored information pages answer questions that a product price alone cannot. Staff need to maintain those details and approved documents consistently in both languages without changing theme source.

#### Expected behaviour and functional requirements

- Compose the home hero, search entry, product collection, business introduction and onward links through suitable native sections, giving customers clear routes to equipment sales, search and the rental service.
- Provide footer menus, business address/telephone/email, social links, payment content, newsletter and approved powered-by preferences.
- Support the contact form's native validation, errors and confirmation. Present approved department responsibilities and contact details in a responsive layout so customers can choose the appropriate contact route.
- Provide warranty information, including approved new/used distinctions, through typed policy references and authored content. Product-level policy references and information pages must communicate the same applicable terms.
- Support general information, password/newsletter and leaf-blower comparison content with correct page/template assignments.
- Give customers equivalent access to approved French/English copy, policies and linked documents; verify document destinations and versions independently of theme labels.

#### Appearance and placement

The home composition places its heading/search hero before the featured collection and business introduction. The footer groups business contact information, hours and map/directions with newsletter, social/payment content and clearly headed navigation groups. These are editable compositions, with readable stacking on mobile.

The contact page places business details/hours and map alongside one another where space allows, followed by authored information and the native contact form. Department details use a consistent card/group treatment that can stack on narrow screens. Warranty and general information pages use clear headings and readable body widths; the leaf-blower comparison keeps its authored content legible without implying an interactive comparison tool. Final content ordering and dimensions remain subject to merchant content and visual review.

#### Technical requirements and compatibility

Use JSON templates, section groups and native content/form blocks before creating new components. Keep product policy rendering consistent with G07 and location content consistent with G16/G17. Inspect actual merchant page bodies and uploaded documents before deciding what belongs in a template. Authored comparison content does not imply a new comparison engine. Newsletter, payment and social content should reflect actual configured services.

#### Edge cases and quality

Handle missing policies/documents, empty page content, unavailable images, long department details, invalid form input and unpublished resources. Preserve native form delivery and spam protection. Keep headings, landmarks, telephone/email links, no-JS output and zoom usable. A new credit-data collection process is outside this feature; any approved credit documents should use their existing supported destination.

#### Acceptance criteria

- [ ] Home, footer and information pages contain approved bilingual content and working destinations.
- [ ] Warranty and document links show the approved policy/language/version without unsupported promises.
- [ ] Native contact/newsletter validation and confirmation behavior works; real customer messages are not used for testing.
- [ ] Department, comparison, password and generic page content has correct assignments and responsive presentation.
- [ ] Merchants can edit, reorder and save the intended content through supported editor tools.
- [ ] Home, footer, contact departments and policy/comparison pages follow the specified hierarchy and remain readable with complete bilingual content at mobile widths and zoom.

#### Prototype reference

Relevant files are `templates/index.json`, `sections/footer-group.json`, `sections/header-group.json`, `templates/page.contact.json`, `templates/page.warranty-info.json`, `templates/page.json`, `templates/page.leaf-blower-chart.json` and `templates/password.json`. Warranty content referenced fixed policy handles; `assets/custom.css` supplied department-card styles. The leaf-blower file was a page wrapper, so actual comparison content may be merchant-authored outside the repository. English strings inside template settings still required merchant-content translation.

### G16 — Regular and holiday hours

**Priority:** P2. **Status:** Planned. **Dependencies:** G02, G03, G15.

#### Purpose

Help customers plan a visit using the schedule that actually applies, including holidays and temporary changes. Staff should be able to prepare dated exceptions ahead of time and use an explicit override when needed, with the same selected schedule available in contact and footer placements. Customers must not have to reconcile a regular timetable in one location with a conflicting holiday notice elsewhere.

#### Expected behaviour and functional requirements

- Support a valid enabled manual override, automatic active exceptions, configured regular hours and a regular-hours fallback. Select one applicable schedule consistently in every placement: a valid enabled override takes precedence, then an eligible automatic exception, then the regular schedule.
- Render all seven authored day strings, an independently controlled holiday notice, supported day highlights and full/compact layouts.
- Let staff edit day text and notice visibility independently, schedule when an exception is displayed and disable an exception without deleting its authored content. A display window selects a timetable; it does not calculate whether the business is open at the current minute.
- Preserve the ability to use a seven-day default for an exception with no end, unless an explicit decision replaces it with complete-window authoring.
- Select overlapping exceptions deterministically according to an approved rule. A new priority field is optional, not an implicit setup dependency.
- Provide a localized contact fallback when no trustworthy schedule can be selected. Define what loaded/cached pages do across a schedule boundary.

#### Appearance and placement

Show hours as a seven-row day/value table in the contact page and footer, with a full layout and an available compact layout. Day labels align consistently with their authored hours or closure text; use readable numeric alignment and subtle row separation. Place an enabled holiday notice above the rows and give flagged days visible emphasis consistent with Gamma's palette, without relying on color alone. Compact mode reduces spacing/type proportionately while keeping all seven values readable.

#### Technical requirements and compatibility

Use typed `store_hours` content with explicit `.value` boolean handling. Distinguish true, false, absent and null. The content interface includes `name`, `monday` through `sunday`, `show_holiday_hours_notice`, `holiday_hours_notice`, `highlight_monday` through `highlight_saturday`, `force_off`, `display_start` and `display_end`. Verify field types, requiredness, definition capabilities and access. Agree start/end inclusivity, timezone authoring and overlap rules before implementing selection. Establish complete enumeration rather than assuming all entries fit one Liquid loop.

#### Edge cases and quality

Cover disabled/invalid overrides, missing regular entries, absent or reversed boundaries, exact start/end, overlapping exceptions, daylight-saving transitions, missing day translations and overflow. Day strings are authored content, not machine-readable proof that the store is open now. Sunday highlighting and a priority field require separate definition decisions.

#### Acceptance criteria

- [ ] Regular, manual and automatic modes follow the approved precedence and date rules.
- [ ] Seven day values, notices and supported highlights render correctly in both languages and placements.
- [ ] Boolean/null, overlap, exact-boundary, invalid-data and incomplete-enumeration cases have deterministic fallbacks.
- [ ] Timezone/DST authoring, compact layout, accessibility and editor controls pass actual Shopify checks.
- [ ] Any approved schema extension is defined, populated and verified before the renderer relies on it.
- [ ] Contact/footer placements, full/compact tables, highlighted days and notice placement stay legible with long translated day values and closure text.

#### Prototype reference

`blocks/hours-table.liquid` read `store_hours`, used `force_hours`/`default_hours` pickers, automatic exceptions and `regular-hours`, and defaulted missing ends to seven days. The first matching exception won; boolean field-drop checks were ambiguous and `highlight_sunday` was read although absent from the exported definition. Contact/footer templates supplied placements. Precedence and authored schedules are useful; typed access, overlap policy and date semantics require explicit design.

### G17 — Maps, directions and activation

**Priority:** P2. **Status:** Planned. **Dependencies:** G02, G05, G15.

#### Purpose

Help customers find the physical business and start directions on their preferred supported service. An address, static map and directions links should be useful immediately, including when the interactive service cannot load. Loading an external interactive map is a separate, clearly explained action so customers retain control and the page avoids unnecessary remote loading.

#### Expected behaviour and functional requirements

- Show approved desktop/mobile static imagery, address and Google/Apple directions independently of interactive loading, using the merchant-approved destinations.
- Preserve merchant controls for map identifier, dimensions, images and approved directions destinations, with layouts that shrink within narrow containers.
- Let a customer explicitly request the interactive map, see loading progress or a failure explanation, retry a failed attempt and disable the map again. The address and directions remain available through those states.
- Support the approved remembered-session/multiple-instance behavior. A move to per-instance activation is a business/privacy decision, not an incidental implementation change.
- Keep static alternatives usable without JavaScript and respect the G05 permission/revocation contract.

#### Appearance and placement

Place the map block with the business address/hours on contact and footer surfaces. Initially show the selected static map image with clearly labeled interactive-map and directions actions, using appropriate icons alongside text. Activation replaces or reveals the interactive area in the same bounded layout, with visible loading/error status and disable/retry controls where applicable. Use the approved desktop/mobile imagery and responsive dimensions; neither the frame nor its controls may overflow a narrow footer column.

#### Technical requirements and compatibility

Use the approved uMap service and native image/resource rendering. Construct URL parameters once, escape attributes once, and validate origin/path/identifier without unnecessarily fixing the editor to one map. Use a titled iframe, bounded loading and per-instance lifecycle cleanup. A stored preference must follow the selected session scope and be cleared appropriately after disable or withdrawal. Avoid another consent authority.

#### Edge cases and quality

Cover missing images, malformed configuration, denied/unavailable permission, offline/error/timeout, stale frame events, several maps, navigation and editor removal/reinsertion. Keep status/focus useful during retry and disable. An iframe load event proves a document loaded, not that every remote tile/marker succeeded; static directions remain available.

#### Acceptance criteria

- [ ] Static maps/contact/directions work in both languages, at narrow widths and without JavaScript.
- [ ] No external map request precedes the approved activation condition.
- [ ] Activation, session/multiple-instance behavior, retry, disable and privacy withdrawal follow the agreed policy.
- [ ] Frame title, URL encoding/validation, focus/status and editor lifecycle are correct.
- [ ] Merchant map/dimension/image controls remain usable and do not introduce overflow.

#### Prototype reference

`blocks/map-block.liquid` combined static images, dimensions, map ID, Google/Apple directions and a session cookie enabling/disabling all map instances. Footer/contact templates configured the block. The URL was double-escaped, frames lacked titles, fixed widths could overflow, loading had no deadline and a noscript iframe bypassed activation. The configurable static/directions foundation and remembered workflow are useful references; the defects are not requirements.

## Phase 6 — Promotions and integrations

### G18 — Campaign data, routes and lifecycle

**Priority:** P2. **Status:** Planned. **Dependencies:** G02, G03, G06, G12.

#### Purpose

Let staff describe a campaign and its offers once and use that information consistently in promotion lists, detail pages and product banners. Publishing content does not establish that an offer is active now, and a product's appearance in one promotional surface must agree with its eligibility elsewhere. A shared lifecycle and membership contract prevents contradictory claims as offers start, pause or end.

#### Expected behaviour and functional requirements

- Support merchant-managed campaigns and ordered offers with names, rich content, images/destinations, product/collection references and optional timing/paused state.
- A campaign provides the overall event and destination; its ordered offers describe the individual benefits and relevant products. Staff can prepare future content or pause a campaign without deleting that information.
- Distinguish storefront publication/access from computed paused, future, active, open-ended, ended and invalid lifecycle states.
- Use one approved membership rule across index/detail/PDP and financial claims. Resolve off-collection offer membership and variant restrictions before dependent renderers are accepted.
- Preserve optional ended-index visibility and a duration-based detail grace capability unless an approved archive policy changes them. Ended content must be visibly expired.
- A customer following an older campaign link receives the approved ended/unavailable presentation rather than an apparently live saving. Content lifecycle alone does not create, activate or verify a financial discount; G21 governs those claims.
- Provide stable numeric list ordering and native localized campaign URLs. Define exact date boundaries and stable winner ties with G20/G21.

#### Technical requirements and compatibility

The planned merchant-owned `sales_campaigns` contract includes `sale_name`, `sale_collection`, `start_date`, `end_date`, `sale_paused`, `banner_text`, `sale_list_text`, `banner_priority`, `sale_list_priority`, `sale_image`, `sale_image_url` and `offers`. `promo_offers` includes `offer_name`, `offer_description`, `offer_image`, `offer_image_link` and `products`. Verify actual definitions, reference validations and requiredness; changing required collection/product-list semantics is an explicit decision. Campaign image destinations and offer image destinations are distinct fields.

Use native metaobject/resource URLs and the approved promotions page/template assignment. A URL handle is not a template suffix. Respect Liquid/reference/handle limits and prove enumeration completeness at the intended scale. Choose a membership projection only if research establishes its need and setup/maintenance contract. `banner_priority` remains reserved rather than silently becoming a new selection rule.

#### Edge cases and quality

Cover draft/deleted references, explicit false pause, missing/start-only/end-only dates, equal/reversed boundaries, exact expiry, timezone/DST and limit overflow. Source/financial timestamps must agree. No missing projection or truncated loop may masquerade as complete eligibility. Keep shared helpers focused; this feature does not require a hosted campaign application.

#### Acceptance criteria

- [ ] Definitions, references, membership, sorting and date/archive decisions are explicit and consistent across consumers.
- [ ] All lifecycle and publication/reference cases produce the approved state.
- [ ] Native bilingual URLs and page/template assignments resolve correctly.
- [ ] Enumeration limits and overflow are verified without silently omitting campaigns/products.
- [ ] Any new data interface has an approved definition and maintenance path before use.

#### Prototype reference

`docs/metaobjects/sales_campaigns.definition.json`, `docs/metaobjects/promo_offers.definition.json`, SCS lifecycle/ended-window/URL helpers and `templates/page.promotions.json` establish the contract. The prototype used an inclusive end boundary and detail grace of `end + (end - start)`. Grouped and ungrouped product membership differed; the exported campaign definition required a collection. `banner_priority` was unused. These are important decisions to evaluate explicitly, not reasons to copy every rendering assumption.

### G19 — Campaign index and detail browsing

**Priority:** P2. **Status:** Planned. **Dependencies:** G10, G12, G18.

#### Purpose

Give customers a usable place to browse promotions and understand offers whose conditions cannot be explained by a price badge alone. A campaign can contain several distinct offers, so its detail page must connect each description to the relevant products and make the remaining eligible products discoverable. Grouping is a browsing aid and must not make any eligible product unreachable.

#### Expected behaviour and functional requirements

- Provide a sorted campaign index with linked cards and names so customers can identify an event and open its details. Use usable campaign list copy, then banner copy; use the campaign image, then a usable offer image where needed.
- Provide detail headings, campaign list/banner copy, optional linked campaign imagery, ordered offer headings/descriptions/images and an Other deals group.
- Present the applicable offer explanation beside or clearly associated with its product group. Approved qualification instructions and onward destinations must be understandable without inferring conditions from an image alone.
- Support grouped and ungrouped presentation without changing approved membership. Resolve duplicate product ownership consistently, including ordered overlapping offers.
- Keep every product page reachable with ordinary navigation; pagination must remain available even when a current group/remainder is empty.
- Expose compatible merchant controls for headings/body, image visibility/sizing, grouping, layout, page size, spacing and pagination/infinite-scroll behavior.
- Provide meaningful empty, unavailable and expired views, including appropriate page headings and indexing behavior.

#### Appearance and placement

Present the promotions index as a responsive campaign-card grid beneath its heading and optional introduction. Each card has its usable image, campaign name, summary and a visibly actionable detail link. Preserve a useful text-led card when imagery is absent.

On a detail page, place the campaign title and introductory copy/optional image before the offers. Use a distinct heading and description for each offer, optional associated artwork and a native product-card grid beneath it; place remaining eligible products under Other deals where grouping applies. Image/text combinations can sit beside one another at larger widths and stack on mobile. Pagination or loading controls must be visible after the relevant product output even when a group is empty. Expired and unavailable states need an explicit textual explanation rather than a blank content area.

#### Technical requirements and compatibility

Use current native product cards, collection/filter/grid behavior, pagination and resource links. Scope IDs by surface/section and avoid globally colliding grid/heading targets. Preserve native no-JS links and applicable asynchronous filtering/history. The chosen grouping/pagination design must demonstrate complete membership and communicate any approved cross-page grouping tradeoff; a simpler layout must not hide products.

#### Edge cases and quality

Cover no campaigns, empty/deleted collections, overlapping offers, duplicate references, off-collection products under the chosen rule, fully grouped first pages, later unmatched products and empty middle pages. Validate long French headings, linked image alt text, native Quick Add, focus and worst-case rendering cost. Liquid cannot be assumed to set arbitrary HTTP statuses for unavailable content.

#### Acceptance criteria

- [ ] Index/detail content, links, ordering and fallbacks are correct in both languages.
- [ ] Grouped and ungrouped views expose the same approved product set.
- [ ] Every product remains reachable across empty/grouped pages with JavaScript disabled.
- [ ] Merchant controls, native filters/cards/Quick Add and editor changes work together.
- [ ] Unique IDs, accessible CTAs/headings, expired wording and metadata/indexing behavior pass rendered review.
- [ ] Index cards, campaign introduction, offer groups and Other deals have a clear responsive hierarchy, including missing images, long French copy and empty groups.

#### Prototype reference

`sections/scs-sales-index.liquid`, `sections/scs-sales-campaign.liquid`, campaign-card/richtext snippets and campaign templates implemented these surfaces. Grouped mode rendered offer products before a paginated collection remainder; pagination was conditional on nonempty remainder output. Index sorting reloaded objects by handle, and the visible CTA text was not itself linked. The offer presentation is useful, while membership, limits, links and pagination require a complete current design.

### G20 — Product campaign banners

**Priority:** P2. **Status:** Planned. **Dependencies:** G07, G18, G19.

#### Purpose

Explain a relevant offer while the customer is deciding whether to buy the product, including when they arrive directly from search or an external link and have not visited the promotions index. The banner should communicate a usable benefit and route to its details, matched to the selected product context and current campaign state.

#### Expected behaviour and functional requirements

- Determine eligible campaigns through G18's complete membership/lifecycle contract.
- Show only information applicable to the displayed product and, where required, its selected variant. The customer can read the offer summary and follow a working CTA to the campaign's details and conditions.
- Prefer the eligible usable campaign with the earliest finite end, followed by open-ended candidates, with a stable tie rule agreed through Q06. Do not select an empty candidate that suppresses usable information.
- Use relevant offer description first, then usable campaign list copy, then banner copy. Resolve imagery and destinations through appropriate offer/campaign fallbacks without accidentally requiring an image to have unrelated copy.
- Provide a real detail-page CTA and merchant image/size/compact-spacing controls.
- Update relevant option/combined-product changes within the correct owner. Suppress known expired live claims on already-loaded pages.

#### Appearance and placement

Place the banner in the main product's title/price group, after the battery-system row when present and before the option picker. Use a compact, padded panel with a subtle background, border and rounded corners so the offer is noticeable without competing with the purchase controls. When enabled and available, place proportionally scaled artwork beside the rich-text summary and detail CTA; text-only output must also look intentional. Preserve image visibility/size and compact-spacing controls, and let long copy reflow without clipping or forcing the main product column wider.

#### Technical requirements and compatibility

Use native referenced resources, safe rich-text rendering and G07's scoped update requirements. Separate eligible/winning/renderable states so diagnostics can distinguish a configured wrapper from active content. Confirm current event/response shape before implementation. A small known-expiry enhancement may support presentation, but it is not an observer of remote pause, discount deletion or retargeting.

#### Edge cases and quality

Cover only open-ended candidates, finite/open-ended mixtures, equal end times, blank/invalid bodies, missing images/links, future/paused/expired campaigns and narrower variant eligibility. Keep multiple product instances independent. Financial claims must be truthful for the selected context; generic product-wide wording is unsuitable when only some variants qualify.

#### Acceptance criteria

- [ ] Eligibility and winners match the approved rules, including open-ended-only and tie cases.
- [ ] Useful copy/media fallbacks and CTAs render correctly in both languages.
- [ ] Blank/expired/ineligible content cannot leave a stale or misleading claim.
- [ ] Product ownership, asynchronous selection, editor controls, keyboard and responsive layout pass.
- [ ] The documented distinction between known expiry and remote-state freshness is maintained.
- [ ] The panel occupies the intended product-header position, with usable image/text and text-only layouts, working appearance controls and readable mobile/French copy.

#### Prototype reference

`blocks/scs-product-sale-banner.liquid` called `snippets/scs-banner-content.liquid`. It scanned collection/offer membership and chose the earliest finite end; an initial sentinel prevented open-ended-only campaigns from winning. Winner selection preceded usable-copy checks, and image selection was partly coupled to offer description. Existing copy/media/CTA fallbacks explain the intended feature; these defects need independent correction.

### G21 — Discount and promotion operation

**Priority:** P2; required before enabling financial claims. **Status:** Planned. **Dependencies:** G11, G15, G18, G19, G20; approved commercial rules.

#### Purpose

Keep the price or benefit a customer is promised aligned with what Shopify actually applies in the cart and checkout. Campaign text and dates describe an offer but do not enforce a discount. Staff therefore need an explicit owner and a workable activation, pause and expiry process that keeps public claims and financial configuration in agreement.

#### Expected behaviour and functional requirements

- Distinguish informational campaigns from claims that require a real discount or code. For a financial offer, customers can identify its qualifying items, required action and applicable conditions before relying on the advertised benefit.
- Match each financial claim to exact products/variants, dates, quantities, minimums, eligibility, combinations and supported currencies.
- Identify one financial operator/writer and avoid conflicting manual/application actions.
- Verify discounts before exposing savings claims; hide claims before removing/disabling their corresponding financial offer. Record partial failures accurately.
- Provide practical activation, pause, expiry, target-edit, discrepancy and rollback procedures, including approved recheck responsibility and loaded-page freshness limitations.
- Support the announcement capability with current approved text/codes and a clear redemption route. For required BXGY offers, explain which qualifying and reward items the customer must add, whether a code is needed, and prove actual allocation behavior; automatic gift insertion is a separate optional feature.

#### Appearance and placement

Use the native header announcement area for an approved store-wide promotion or code. Keep the message concise and its link/action clear, with readable contrast and mobile/French wrapping. Detailed qualification belongs on the appropriate campaign/product surface; announcements, banners and cart messages must agree about the benefit and conditions. This feature does not prescribe a second promotional overlay or a custom checkout layout.

#### Technical requirements and compatibility

Keep native discounts/cart/checkout financially authoritative. Research current Shopify representability and plan/app capabilities before choosing management tooling. Reuse supported native administration where sufficient; an application or Function is not an automatic prerequisite. If automation is selected, its ownership, canonical inputs, percentage/money units, add/remove target behavior, failure recovery and authorization must be demonstrated separately.

#### Edge cases and quality

Cover excluded variants, mixed carts, minimum thresholds, gift quantities, overlapping campaigns, incompatible combinations, paused/expired discounts, external edits and partial activation/removal. A theme timer cannot detect every financial change. Unknown ownership or unverified claims block activation, not unrelated storefront work. Test transactions require their own authorization and approved environment.

#### Acceptance criteria

- [ ] Advertised conditions and actual authorized cart/checkout allocations agree in both languages.
- [ ] Codes, exclusions, dates, quantities and combinations are verified for the exact enabled offers.
- [ ] A named operator/writer and usable activation/pause/expiry/rollback procedures are established.
- [ ] Financial failures leave truthful presentation and an explicit reconciliation outcome.
- [ ] Announcements and product/campaign/cart copy remain consistent without theme-calculated prices.

#### Prototype reference

SCS theme files displayed claims; the related `/home/chris/shopify/sales-campaign-manager` application contained native-discount planning/execution code. Source/audit findings included ambiguous percentage conversion, untrusted posted lifecycle/IDs, incomplete target removal and weak partial-failure persistence. `sections/header-group.json` contained a launch-code announcement. These show the coordination need, not a production-ready financial workflow or a requirement to reuse that app's executor.

### G22 — Campaign application compatibility

**Priority:** P2. **Status:** Planned. **Dependencies:** G02, G18, G19, G20.

#### Purpose

Let staff or the required campaign application determine whether the configured storefront can display campaigns and what a missing promotion actually means. An installed but empty banner, an ineligible campaign, an inaccessible page and an incompatible theme need different responses. Reliable diagnostics prevent false assurance or unnecessary configuration changes while keeping financial validity a separate check.

#### Expected behaviour and functional requirements

- Establish whether the campaign application is required for merchant operations and which diagnostics it must support. Preserve the required operator workflows without assuming that a new application or automated repair system is needed.
- Provide a small versioned interface identifying index/detail surfaces, empty/unavailable states, product wrapper, active banner and CTA.
- Let diagnostics distinguish active content from a configured but empty block and identify incompatible responses. Report missing setup, no currently usable content and an inability to inspect the page as separate outcomes, with an actionable next step for the operator.
- Verify definitions, page/template assignment and native resource routes without silent repair side effects.
- Keep authoring/import/scheduler/financial automation separately scoped unless needed and approved.

#### Technical requirements and compatibility

Inspect both consumer and theme boundaries before finalizing markers or versioning. Parse actual attributes/state rather than loosely matching substrings. Bind authorized diagnostic requests to verified destinations and handle password-protected previews safely. Theme updates should not require financial write access; any necessary application change is a separate, bounded application task.

#### Edge cases and quality

Cover empty wrappers, unavailable campaigns, ungrouped detail, password/access failures, malformed responses, incompatible versions and unsafe redirects/origins. Marker presence does not establish translations, catalog completeness or discount validity. Address credential/origin handling before enabling any diagnostic path that could transmit a password.

#### Acceptance criteria

- [ ] Required application workflows and the theme interface are explicitly documented.
- [ ] Active, empty, unavailable and incompatible fixtures yield distinct correct results.
- [ ] Native routes/assignments work with the accepted theme version and actual consumer.
- [ ] Diagnostics have no unapproved repairs, financial writes or off-origin credential transmission.
- [ ] A decision records non-applicability if the application is not required; the feature is not silently omitted.

#### Prototype reference

SCS blocks/sections emitted `data-scs-*` markers. In `/home/chris/shopify/sales-campaign-manager`, `app/lib/scs/contracts.ts`, `app/services/scs/theme-compatibility.server.ts` and `app/services/scs/setup-proof.server.ts` consumed them. A substring check could mistake `data-scs-banner-block` for an active `data-scs-banner`. Setup also depended on the promotions template/route contract. Structural markers remain useful, but exact detection and safe diagnostic networking require review.

### G23 — UTM and referral integration

**Priority:** P2. **Status:** Planned. **Dependencies:** G02, G05, G11.

#### Purpose

Retain the marketing or referral context needed by the merchant's configured downstream behavior after a customer leaves their landing URL. Query parameters can disappear during ordinary browsing; the supported integration's cart attributes provide continuity where that capability is required. Capturing parameters is only one step and does not, by itself, establish reporting accuracy or prove that dependent content appeared.

#### Expected behaviour and functional requirements

- Confirm current need, installed capability, the UTM/referral parameters to retain and which downstream content or operational use requires each value.
- Use the supported app embed/configuration where it meets the requirement.
- Preserve its intended cart-attribute behavior through locale navigation and normal cart changes, so an eligible arrival value remains available to its approved consumer even when it is no longer in the current page URL. Persistence and replacement follow the selected integration's supported rules.
- Respect the approved privacy behavior and any dependent blocks. Avoid duplicate custom tracking.
- Make missing/uninstalled/disabled integration behavior explicit to the merchant.

#### Technical requirements and compatibility

Research the installed Checkout Blocks capability and its current supported configuration, including plan requirements where applicable. Keep the theme-specific setup difference small and preserve native cart state, notes and checkout. Confirm permission/revocation handling through G05. Installation, embed activation and test sessions that change cart/store state need separate authorization.

#### Edge cases and quality

Cover absent parameters, repeated/changed visits, long or malformed values, locale switching, cart updates, denied/withdrawn permission and missing application. Do not invent persistence or overwrite rules unsupported by the selected integration. Verify dependent behavior rather than assuming parameter capture alone proves attribution.

#### Acceptance criteria

- [ ] The merchant's required fields and downstream use are confirmed.
- [ ] An authorized isolated session demonstrates correct supported cart-attribute behavior across navigation and updates.
- [ ] Native lines, notes, totals and checkout remain unaffected.
- [ ] Privacy and missing-integration cases are verified and communicated appropriately.
- [ ] Any non-applicability decision is explicit; no parallel tracking script is introduced without a separate need.

#### Prototype reference

`config/settings_data.json` enabled the Checkout Blocks app embed with `utm_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `ref`. Shopify documents this integration as storing eligible URL parameters in cart attributes. Repository configuration alone does not establish current installation, plan support, consent behavior or downstream content rules.

## Phase 7 — Integrated acceptance

### G24 — Complete storefront verification

**Priority:** Required final gate. **Status:** Planned. **Dependencies:** All required G01–G23 outcomes and their applicable merchant decisions.

#### Purpose

Establish that customers can complete whole journeys with consistent information across features. A correct price beside stale variant advice, a localized gallery that changes language after filtering, or a promotion that disappears from its detail page but remains in the cart can all escape isolated feature checks. Acceptance must cover these interactions and the native Horizon capabilities they affect.

#### Expected behaviour and functional requirements

- Reconcile the exact candidate tree, enabled settings/content and resolved decisions with every required feature.
- Test connected journeys in both languages, on mobile/touch and desktop/keyboard, including failure paths and asynchronous updates.
- Confirm that a product or option change leaves price, details, media, availability, promotion and the eventual cart line in agreement; filtering and later-page rendering must preserve the same language and eligibility rules.
- Verify shared business content across placements, and check that privacy changes have the agreed effects on maps and attribution while ordinary search and purchasing remain usable.
- Verify editor add/remove/reorder/save, no-JS content, accessibility, metadata and representative performance.
- Review the specified appearance and placement with complete content: product-header hierarchy, icon/text alignment, disclosures, notices, search groups, campaign cards and business-information layouts must remain coherent across languages, widths and asynchronous updates.
- Confirm affected checkout/account/notification handoffs where they depend on the theme's language, promotions or fulfillment information. Broader platform redesign is not implied.
- Separate passed, failed, blocked and not-run checks; return defects to their owning feature before acceptance.

#### Technical requirements and compatibility

Use the existing local checks, focused feature verification and an explicitly authorized Shopify-rendered environment for platform-dependent behavior. Reverify store identity, theme ID and role before connected testing. Compare with native 4.3 using comparable content/conditions and review the complete diff. Establish representative performance limits and investigate regressions; local tests cannot prove actual Liquid Drops, native editor behavior, payments or external services.

#### Edge cases and quality

Include combined product changes, incomplete data, cached pages, overlapping promotions, unavailable services, long translations and independent component instances. Do not label merchant configuration or environment failures as native defects without evidence. Automated accessibility checks supplement manual focus, keyboard, screen-reader and reflow review; they do not certify accessibility by themselves.

#### Acceptance criteria

- [ ] Every required feature is represented by verified behavior, with optional/non-applicable scope recorded explicitly.
- [ ] Required connected journeys pass on the exact candidate configuration; unavailable checks remain incomplete and block the affected acceptance.
- [ ] Native purchasing, cart, pickup, localization, editor, media and applicable disclosures remain compatible.
- [ ] No unresolved critical purchasing, financial, navigation, localization or accessibility defect is accepted.
- [ ] Performance and metadata meet agreed requirements, and available/unavailable verification is reported accurately.
- [ ] Required visual hierarchies and responsive layouts are verified with real content, including long French labels, missing artwork, zoom and dynamically replaced output.
- [ ] The result is reviewable before any separately authorized deployment/publication decision.

### Connected-journey matrix

| Journey | Required interactions and observations |
| --- | --- |
| Home → search → product | Immediate typing/paste/IME, recently viewed initialization, native/rental results, localized links/media and selected product information |
| Collection → filter/sort → Quick Add → cart | Correct specialized filters, numeric bounds, availability/media, later pages, swatches, quantities and back navigation |
| Product → variant → pickup → cart | Details, price, media, campaign and availability agree; location information and added line identity remain native |
| Campaign index → grouped detail → later page → product | Lifecycle, ordering, membership, duplicates, empty groups, complete pagination and native product controls |
| Active campaign → expiry/pause → existing page/cart | Known-expiry presentation, actual discount boundary, operator actions and documented remote-state freshness limits |
| Cart → checkout → confirmation | Mixed fulfillment, note, quantities, discounts, eligibility and supported language/terms/account/notification continuity |
| Contact → hours → map → directions | Current exception/override, translated notice, static fallback, activation, timeout/retry/disable and privacy withdrawal |
| Privacy choice → attribution/external media/search | Correct processing/activation conditions, revocation and useful native shopping when an integration is unavailable |
| Theme editor → storefront update | Add/reorder/remove/save/reset where applicable; settings, content ownership and lifecycle cleanup across multiple instances |

## Completion and verification

### Feature completion

A feature is complete when its functional requirements, applicable appearance/placement requirements and acceptance criteria are satisfied, its required content/setup is ready, affected native regressions have been checked, and blocking decisions are resolved. Code presence, a successful static check or a mock alone is insufficient for platform-dependent acceptance. Verification reduces risk; it does not guarantee a bug-free implementation.

Use existing local commands, including `npm run check:all` and `npm run check:json` when structured Theme Check output is useful. Review all diagnostics and keep known upstream warnings visible. Follow the current locked-install procedure in `README.md` when installation is authorized. Use focused automated checks for meaningful complex contracts such as money units, lifecycle, membership, status precedence, cancellation and response identity; this plan does not prescribe a large testing framework or additional infrastructure.

Rendered verification is required for actual Shopify data/access, editor persistence, native section updates, localized routing, form/payment behavior and third-party integration boundaries. Use approved isolated sessions and test resources; real customer messages/orders are not verification fixtures. Store operations, uploads, configuration changes and publication remain separately authorized.

### Progress tracking

Maintain the feature-index status and the acceptance checkboxes in each specification. Use **Planned**, **In progress**, **Implemented**, **Blocked** or **Complete**; **Established** identifies the initial G01 foundation. **Implemented** means the local implementation exists but required external/rendered acceptance remains open. Record a blocked criterion and its prerequisite rather than treating unrelated work as blocked.

Keep feature IDs stable. When an implementation is accepted, add a short verification note within that feature identifying the relevant revision, checks performed and any accepted limitation. Detailed investigation evidence and large reports belong outside the theme repository; this plan needs only enough information to maintain the requirements and current acceptance state.

Record material changes to required behavior, data contracts or architecture in the decision table below. Update the affected specification and dependency/index entries together. Routine implementation choices that do not change requirements do not need a decision record.

## Open decisions and prerequisites

Independent local work can proceed while these are resolved. Resolve each before the affected behavior is enabled or marked complete. Confirmed requirements remain in the specifications; the choices below must not be filled by unrecorded assumptions.

| ID | Decision or evidence needed | Affected features | Resolution |
| --- | --- | --- | --- |
| Q01 | Current definitions, content, references, translations, menus/files, assignments, installed capabilities and authorized target identity | G02 and dependent acceptance | Open; confirm from approved current sources |
| Q02 | Backorder/special-order terms and real lead times, minimum-quantity wording, mixed-order shipping and pickup promises | G08, G11, G21 | Open; merchant operational approval required |
| Q03 | Remembered-session versus per-instance map activation, multiple-instance disable and native privacy behavior; permitted editable destinations | G05, G17 | Open; define the customer workflow before interactive acceptance |
| Q04 | Hours missing-end fallback, start/end boundaries, overlap ordering, timezone authoring, Sunday highlighting and optional priority | G16 | Open; preserve required scheduling capability until an explicit decision changes it |
| Q05 | Campaign collection/offer membership, off-collection products, variant restrictions, intended scale and any projection maintenance | G18–G22 | Open; one complete contract required for all surfaces |
| Q06 | Campaign end boundary, duration-based grace/archive presentation, winner ties, remote-claim freshness and operator/recheck responsibility | G18–G21 | Open; align content, financial conditions and operating practice |
| Q07 | Required campaign-application workflows, diagnostic destinations and ownership of financial changes | G21, G22 | Open; theme/application boundaries must be explicit |
| Q08 | Approved bilingual branding, copy, external menu destinations, documents/policies, contact/department information and authored comparison content | G03, G04, G07, G09, G15–G21 | Open; content owners approve the relevant material |
| Q09 | Approved bilingual rental API/page/image origins, response/CORS behavior and any separately proposed domain changes | G14 | Open; actual service contract required before activation |
| Q10 | Attribution need, current Checkout Blocks capability, selected fields, downstream behavior and privacy handling | G23 | Open; verify with the merchant/application configuration |

### Material requirement and architecture decisions

| Date | Features | Decision | Reason and acceptance impact |
| --- | --- | --- | --- |
| 2026-11-04 | All | Development uses the current modified Horizon 4.3.0 fork on `dev`; feature scope and status are tracked here | Native capabilities and the receiving branch remain the implementation foundation; G24 establishes complete storefront acceptance |

## Optional extensions

The following require separate scope and acceptance decisions: directional product-to-kit links beyond G09's core battery/recommendation feature; catalog import/normalization tooling; PoR status or resale-quantity synchronization; additional analytics; a full campaign authoring/import/scheduler application; price automation; automatic gifts; and broader reward/volume programs.

These extensions must not become hidden prerequisites for required storefront behavior. Their absence does not justify omitting required rental discovery, product information, location content, promotional browsing or a truthful supported discount workflow. Any future extension must respect the same native authority, localization, accessibility, privacy and operational requirements.

