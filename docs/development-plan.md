# Gamma theme development plan

## Project overview

Gamma is a bilingual Shopify storefront for Location Gamma, combining equipment sales with clear access to rental services. The theme will provide dependable product information, practical purchasing guidance, useful store information and coordinated promotional campaigns. Merchants should be able to manage content and presentation through Shopify's normal editing tools.

Development starts from the current modified Horizon fork on `dev`. The foundation is Horizon 4.4.0 at `b2b74b0ade1ca0bf9a22b60aad5df2b49c20cd7a`, identified by `vendor/horizon-v4.4.0`. The working tree, project configuration and merchant settings on the receiving development branch must be inspected before each change. [README.md](../README.md) covers the development environment; [AGENTS.md](../AGENTS.md) defines repository conventions.

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

Each feature must support keyboard use, visible focus, semantic structure, accessible names and appropriate announcements. Validate contrast and readable states, including long French labels. Primary Gamma Red is an approved brand exception to contrast-ratio targets except for fine print smaller than 10 CSS pixels; keep normal contrast requirements below that threshold and record shortfalls accurately. Dark Gamma Red is permitted for button hover/pressed states or fine print where needed; avoid replacing the primary brand colour elsewhere solely for contrast. Use native theme colour settings for primary buttons and retain Horizon's automatic interaction colours. Use responsive layouts, support zoom and reduced motion, and avoid conveying information through color alone.

Feature appearance requirements define the intended placement, content hierarchy and visual treatment. Use native editor controls for supported layout choices and let merchants reorder configurable blocks. Exact dimensions, spacing and breakpoints remain design choices where no value is established; validate them with real content in both languages rather than treating an illustrative size as a fixed requirement.

Check representative widths of 320, 375, 768 and 1440 pixels, 200% text/zoom scenarios and reflow where relevant. These are verification cases, not a prescribed breakpoint system. Include touch interactions and available Safari, Chromium and Firefox coverage for affected behavior.

Measure affected pages against the native theme using comparable data and conditions. Keep initial content useful, load enhancements only where needed, and bound third-party requests. Agree measurable performance budgets from representative fixtures before accepting expensive scans or integrations; do not invent a catalog-size limit or performance guarantee without evidence.

### Visual design language

The storefront uses one visual language, the approved "Spec sheet" design language, piloted on the SCS campaign pages (G19) and then extended to the rest of the theme (G25–G31). It builds on the *Gamma Brand Display Guidelines v1.0* and was approved on 2026-11-09 after the design review at revision `4d34b54`; that review's screenshots, research and concept mock-ups are kept outside this repository in `gamma-scs-handoff/design-review/2026-11-09-4d34b54-visual-direction/`. Where the review's document or mock-ups differ from this plan, this plan records the approved decisions. A page should read like a well-set equipment specification sheet: a label, a title, the facts, then the equipment.

- **Type roles.** Display (Oswald Medium, 56 px, 36 px on phones) for one page-defining title; page title 48/36; section and offer titles 32/26; group headings 24/20; label (Inter SemiBold, 12 px, uppercase) for eyebrows, counts and fine-print headings; lede 18/16; body 14, with 16 for reading text such as summaries. A role changes a heading's size, never its semantic level.
- **Colour roles.** Coal text on Paper; Concrete for panels, notices and alternating bands; Gamma Red only for the primary action, notice icons and sale badges, with Deep Gamma Red for hover and pressed states. Manufacturer colours appear only inside Brand badges. Signal Yellow (`#F6C700`, the brand guidelines' alert colour) is an approved addition for the announcement bar only, with Coal text (2026-11-10); it isn't used for low stock, notices or badges. Gamma Red is also approved for input boundaries, component dividers and the secondary button's hover text and border, in the form settled by Q20.
- **Surfaces and rhythm.** Corner radii come from the theme settings (cards 16 px, media tiles and notices 12 px, buttons and badges 14 px). Hairline rules at 12% Coal separate sections. Text measures stay within 60–68 characters. Section spacing steps 56, 36 and 24 px, and 40, 28 and 16 px on phones.
- **Imagery.** Artwork that may contain text is shown whole in a white media tile. Each context has one tile ratio (campaign cards 3:2, rental cards 4:5, product cards as the native card). Text is never baked into images.
- **Cards and grids.** Products always use the native product card on the collection grid (250 px minimum card width, two columns below 750 px). A card carries at most one overlay and never shows a discount that Shopify's own price doesn't show.
- **Badges.** One badge family using the theme's badge radius and padding. Product badges report status; Brand badges identify a campaign's sponsor on campaign artwork and callouts only.
- **Notices.** One shell: a Concrete panel, an icon in Gamma Red, a bold lead-in and the message, with an inline line variant for dense lists such as cart lines. No coloured edges, and the meaning never depends on colour.
- **Actions.** At most one red primary button per view, and none in the phone hero; secondary outline buttons for onward and external actions; text links with an arrow elsewhere. External links say where they lead.
- **Fine print.** Terms stay visible as muted 14 px text under a label; they are never collapsed and never set larger than the content they qualify.
- **Motion and phones.** Hover and focus changes only, respecting reduced-motion preferences; the one hover transform is Horizon's subtle card zoom (G04), which applies only with a fine pointer and no reduced-motion preference and never crops artwork that is shown whole. On phones, imagery comes first, cards sit two per row and primary buttons span the width.

Tokens start inside the feature that first needs them, as `--gamma-*` custom properties that alias Horizon's variables where one exists, and move to `assets/gamma-branding.css` when a second feature shares them (G25). Since G19's Stage 1 they live in `snippets/gamma-tokens.liquid` with the type-role classes, scoped to elements with the `gamma-tokens` class so that colour tokens follow the element's colour scheme, and the notice shell is `snippets/gamma-notice.liquid`. Since Stages 2 and 3 the same file holds the collection-grid, label-rail and media-ratio tokens and the `gamma-media-tile` class, and `snippets/gamma-rental-card-styles.liquid` holds the rental card's media rules, which rental search also renders. Shopify loads `{% stylesheet %}` CSS only for the files in a page's render tree, so a surface that uses the tokens or the shell renders those snippets. Shared pieces are `gamma-` snippets beside Horizon's blocks; `assets/base.css` and native blocks aren't restyled in place. A change to a shared component (product card, header, footer, cart, notice or badge) needs its own rendered before-and-after review in French and English at 320, 390, 768 and 1440 px before integration. The 18/16 px lede, the 16 px offer summaries and the 36 px campaign title on phones are approved additions to the *Gamma Brand Display Guidelines* (2026-11-09), to be carried into the guidelines' next revision.

### External services and operating boundaries

Use supported Shopify app integrations and native services where appropriate. External failures must leave unaffected shopping functions usable. Validate external destinations, avoid unnecessary data transmission and respect the approved privacy behavior.

Store authentication, previews/uploads, synchronization, configuration writes, installations, test transactions and publication require explicit authorization. Before any authorized store operation, verify the store identity, theme ID and actual role. Names such as `dev` are not identity or safety evidence.

The SCS campaign administration app (G22) is, with the WordPress rental catalogue, one of Gamma's two self-operated services. It runs on the existing VPS that hosts the WordPress rental catalogue, isolated from WordPress, and must never be a runtime dependency of the storefront, cart or checkout: published campaigns, notices, prices and discounts are Shopify data. Its deployment, store installation, scopes and server configuration require the same explicit authorization as other store and external-service operations.

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

Priorities are P0 for shared prerequisites, P1 for purchasing/browsing/discovery, P2 for complete business-information and promotional workflows and P3 for extending the visual design language beyond the campaign pages (G25–G31; their place relative to the soft launch is Q17). G24 is a required final gate. G01's foundation is established; its compatibility requirements continue throughout development. An **Implemented** status records local code; feature acceptance remains pending until its criteria are verified.

| Phase | ID | Feature | Priority | Dependencies | Status |
| --- | --- | --- | --- | --- | --- |
| 1. Foundation and data | G01 | Horizon foundation and development compatibility | P0 | Current `dev` | Established |
| 1. Foundation and data | G02 | Content, data and merchant configuration | P0 | G01 | Planned |
| 2. Shared storefront presentation | G03 | French and English navigation | P1 | G01; G02 for content | Implemented |
| 2. Shared storefront presentation | G04 | Gamma branding | P1 | G02, G03 | Implemented |
| 2. Shared storefront presentation | G05 | Native privacy presentation | P1 | G03, G04 | Implemented |
| 2. Shared storefront presentation | G06 | Bilingual CAD presentation | P1 | G02, G03 | Implemented |
| 2. Shared storefront presentation | G32 | Quebec French storefront and checkout wording | P1 | G03; the approved French terms of G08, G11 and G13–G19; Q18 | Planned |
| 3. Products and purchasing | G07 | Product information and scoped updates | P1 | G02, G03 | Implemented |
| 3. Products and purchasing | G08 | Availability and fulfillment information | P1 | G02, G03, G07 | Implemented |
| 3. Products and purchasing | G09 | Battery systems and recommendations | P1 | G02, G03, G07 | Implemented |
| 3. Products and purchasing | G10 | Localized media and product video | P1 | G03; G02 for content | Implemented |
| 3. Products and purchasing | G11 | Cart experience | P1 | G04, G06, G08 | Implemented |
| 3. Products and purchasing | G12 | Collection layouts and filters | P1 | G03, G04, G06, G08, G09, G10 | Implemented |
| 4. Search and rental discovery | G13 | Home search entry | P1 | G03, G06 | Implemented |
| 4. Search and rental discovery | G14 | Rental search integration | P1 | G02, G05, G13 | Implemented |
| 5. Business content and location | G15 | Home, footer and information pages | P2 | G02, G03, G04, G07, G09, G10, G13 | Implemented |
| 5. Business content and location | G16 | Regular and holiday hours | P2 | G02, G03, G15 | Implemented |
| 5. Business content and location | G17 | Maps, directions and activation | P2 | G02, G05, G15 | Implemented |
| 6. Promotions and integrations | G18 | Campaign data model, lifecycle and theme contract | P2 | G02, G03, G06, G10, G12, G14 | Implemented |
| 6. Promotions and integrations | G19 | Campaign pages and index | P2 | G10, G12, G14, G18 | Implemented |
| 6. Promotions and integrations | G20 | Product and cart promotional notices | P2 | G07, G08, G09, G11, G18, G19 (including visual refinement stages 1 and 4) | Implemented |
| 6. Promotions and integrations | G21 | Financial promotions and dealer-gift operations | P2 | G11, G18, G20, G22 | Planned |
| 6. Promotions and integrations | G22 | Campaign administration app | P2 | G02, G18; Q11 | Planned |
| 6. Promotions and integrations | G23 | UTM and referral integration | P2 | G02, G05, G11 | Planned |
| 7. Storefront design language | G25 | Design language foundation | P3 | G04, G19 | Planned |
| 7. Storefront design language | G26 | Product cards, collections and search | P3 | G12, G14, G25 | Planned |
| 7. Storefront design language | G27 | Product page | P3 | G07, G08, G09, G10, G20, G25 | Planned |
| 7. Storefront design language | G28 | Cart | P3 | G11, G20, G25 | Planned |
| 7. Storefront design language | G29 | Home and editorial sections | P3 | G13, G15, G19, G25 | Planned |
| 7. Storefront design language | G30 | Header, footer and navigation | P3 | G03, G04, G05, G15, G16, G17, G25 | Planned |
| 7. Storefront design language | G31 | Business-information pages | P3 | G15, G16, G17, G25 | Planned |
| 8. Integrated acceptance | G24 | Complete storefront verification | Required gate | All required features | Planned |

Phases group related work; they need not be rigidly sequential. Once language and data contracts are settled, branding and money presentation can proceed independently. Product details, media and home search can also proceed independently when their dependencies are ready. Hours and map development can run alongside campaigns after shared content/privacy requirements are established. Coordinate changes to shared product templates, cards, cart snippets and locale files before local integration.

Use coherent feature branches following the repository workflow, typically one feature or independently useful increment at a time. Implementation research, local work, merchant setup and rendered acceptance can progress separately. A blocked external prerequisite should not stop unrelated development.

The Sales Campaign System (G18–G22) is one system developed in two repositories: theme features G18–G20 in this repository and the G22 campaign administration app in a separate app repository, with G21's operating procedures spanning both and Shopify Admin. G18's data contract comes first; the VPS checks (Q11) and the SCS proofs of concept should run before G22 development, because they are the only items that could change the hosting or data-model decisions. The proofs of concept cover rendering cost and block re-rendering, cache delay at boundaries (which sets the claim margin), translated images and URLs, previewing Draft entries in the theme editor, a promotional price list on the primary market, adding a gift by order editing, the optional Flow review condition and rental image import. Theme and app work then proceed together toward the February 2027 soft launch. If the app cannot be ready, the theme and data contract launch unchanged and staff operate campaigns in Shopify Admin as an emergency contingency, not the plan. The selected architecture is described in [the SCS proposal](scs-redesign-proposal-with-app.md); the companion [no-app proposal](scs-redesign-proposal-no-app.md) is retained only as a comparison and as the reference for those emergency manual procedures. The branch sequence for the remaining work is set out under [Branch sequence and model guidance](#branch-sequence-and-model-guidance).

The visual design language is delivered in this order: G19's visual refinement on the campaign pages, stage by stage; G25 once two features share a pattern; then G26–G31, one surface at a time. G20 is built on the refined notice shell from the start, so it is never restyled afterwards, and G22 guides campaign content toward the same language while keeping Shopify Admin conventions for its own interface. These features change presentation only; none alters eligibility, pricing, lifecycle or checkout behaviour.

### Branch sequence and model guidance

The remaining work is divided into the branches below. Each is one reviewable increment, started from current `dev` in its repository and developed in its own focused session. Store and server work that changes no repository (fixtures, proofs, server checks, migrations and installation) runs in separately authorized sessions, listed first as prerequisites. Within each track, numbers give the order; the theme and app tracks run in parallel and meet at the Primary cutover and G24. A branch can be implemented once its dependencies are integrated, and its rendered acceptance follows when the matching store session is authorized. Launch placement follows Q17's recommendation until Q17 is resolved.

**Model guidance (November 2026).** Claude Opus 5.5 at medium effort is the default for every branch and session. High effort is recommended where a branch sets a shared foundation, carries pricing, eligibility, security or data-integrity correctness, or needs demanding design judgment. Claude Fable 5.2, at high effort, is reserved for the few long, consequential branches in which a mistake could advertise a price Shopify doesn't charge or leave a promotional price live: the app's resource and price orchestration and the G24 acceptance review. Raise Fable to xhigh only where high has demonstrably fallen short. Sonnet 5.5 suits bounded subagent work inside a branch, such as rendered screenshot sweeps at the four widths or documentation lookups. These are recommendations; the model selected for a session applies, and review of a shared-component or financial diff uses at least high effort.

**Prerequisite sessions (no branch).**

| ID | Session | Scope | Needed before | Model and effort |
| --- | --- | --- | --- | --- |
| S1 | SCS proofs | G18 Gamma-Dev proofs and the `promotions-g18` route migration; P-B, P-D, P-TR and P-PRE (SCS proposal, section 19) | T5 (P-B), A3 (P-TR), A4 (P-PRE); the claim margin (P-D) | Opus 5.5 · high |
| S2 | Campaign fixtures | G19 Stage 0 on Gamma-Dev | Rendered checks of T1–T3 (French rental cards and artwork that contains text) and T6 | Opus 5.5 · medium |
| S3 | Server checks | Q11 and the SCS section 15 checklist (P-VPS) | A2 | Opus 5.5 · medium |
| S4 | Operations proofs | P-PL, P-ORD, P-FLOW and P-RENT | A6 (P-PL), A8 (P-ORD, P-FLOW), A9 (P-RENT) | Opus 5.5 · medium |
| S5 | Pickup availability proof | Gamma-Dev fixtures and the rendered `store_availabilities` values (`available`, `pick_up_enabled`, `pick_up_time`) with the native pickup output for G08's pickup increment: tracked in-stock, continue-selling at zero and below zero, untracked, service-managed and sold-out variants, a variant stocked at only one of two pickup locations and a location with pickup turned off; whether checkout offers pickup for the backordered variant. Needs inventory and location changes on Gamma-Dev. The fixtures were created on 2026-11-10 (`s5-proof-pickup` with six variants and `s5-proof-special`, both published); only one Gamma-Dev location has pickup enabled, so the two-location case is untested, and the rendered proof is still open | T18 | Opus 5.5 · medium |
| S6 | Primary checkout wording check | Read-only on Primary: the published theme's `shopify.*` and `customer_accounts.*` keys in every locale file, compared with the eight French keys known from the prototype and with Shopify's default text for each; the French checkout's own term for shipping. Run on 2026-11-10 with the results under G32; Shopify's default text couldn't be read through the Admin API and is still to be recorded | T17's checkout keys; the Primary cutover | Opus 5.5 · medium |

**Theme track (this repository).**

| # | Branch | Scope | Depends on | Launch | Model and effort |
| --- | --- | --- | --- | --- | --- |
| T1–T3 | `feature/scs-refinement-foundations-artwork` | G19 Stages 1–3, as separate commits in stage order. Stage 1: scoped tokens, heading roles, lede and summaries, fine print, the notice shell and the six rendering defects. Stage 2: collection grid, label rail, shared rental card. Stage 3: badges over artwork, hero panel, index card media and feature card | S2 for French rental cards and artwork that contains text | Soft launch | Opus 5.5 · high |
| T4 | `feature/scs-refinement-offers` | G19 Stage 4: label chip, facts list, store and gift notices, offer overview and navigation | T1 | Soft launch | Opus 5.5 · medium |
| T5 | `feature/scs-promotion-notices` | G20: product notice block, cart-line gift notices and entitlement counting, shared cart lookup (8 campaigns, 12 groups each), expiry guard | T1, T4; S1 (P-B) | Soft launch | Opus 5.5 · high |
| T6 | `feature/scs-refinement-states` | G19 Stage 5: ended, claim, scheduled, paused, invalid and empty views; compact callout | T1; S2 | Soft launch | Opus 5.5 · medium |
| T7 | `feature/design-foundation` | G25: shared tokens, notice shell and badge family adopted by G08, G11 and the SCS notices; campaign-page copies removed | T1–T5 | Soft launch | Opus 5.5 · high |
| T8 | `feature/design-collections` | G26: product card tile, collection headers and list, search dialog and page | T7 | Soft launch | Opus 5.5 · high |
| T9 | `feature/design-product-page` | G27: product header order, accordion and specification table, recommendations | T5, T8 | Soft launch | Opus 5.5 · medium |
| T10 | `feature/design-cart` | G28: line notices, summary panel, empty cart, recommendations | T5, T8 | After soft launch | Opus 5.5 · medium |
| T11 | `feature/design-home` | G29: hero, featured collections, current-promotions section, editorial panels | T8 | After soft launch | Opus 5.5 · medium |
| T12 | `feature/design-header-footer` | G30: announcement bar, navigation, drawer, footer groups, privacy banner alignment | T7 | After soft launch | Opus 5.5 · medium |
| T13 | `feature/design-business-pages` | G31: titles, reading column, contact panels, tables and the shared disclosure style | T7, T9 | After soft launch | Opus 5.5 · medium |
| T14 | `feature/utm-referral` | G23, or a recorded non-applicability decision | Q10 | Soft launch if required | Opus 5.5 · medium |
| T15 | `feature/leaf-blower-chart` | The deferred G15 comparison chart | The other theme branches | Optional | Opus 5.5 · medium |
| T16 | `feature/storefront-acceptance` | G24: candidate reconciliation, connected journeys and the SCS scenarios; defects return to their owning branch, and this branch records only status and verification notes | All required features; A1–A8; cutover | Final gate (scope per Q17) | Fable 5.2 · high |
| T17 | `feature/quebec-french-wording` | G32: the approved glossary applied to Horizon's strings in `locales/fr.json`, French typographic spacing, the versioned French checkout overrides and the Horizon-update review step | Q18; S6 for the checkout keys. Shares `locales/fr.json` with T4–T6 and T18, key by key | Soft launch | Opus 5.5 · medium |
| T18 | `feature/availability-pickup` | G08's pickup increment: status-aware pickup summary and dialog rows for backordered and special-order variants | S5; Q19; T17 for the French pickup term. Uses G08's resolver and icons as they stand, or T7's shared pieces if T7 is integrated first | Soft launch | Opus 5.5 · medium |
| T19 | `feature/branding-carryover` | G04's carry-over increment, one commit per item: Signal Yellow announcement bar, transparent home header, product-page price role, card hover zoom, Gamma Red input boundary and secondary-button hover, password-page logo | Q20, Q21. Precedes T8, T9 and T12, which inherit its result; adds one scoped rule to `assets/gamma-branding.css`, where T7 moves the shared tokens, so whichever is integrated second is rebased | Soft launch | Opus 5.5 · high |

T6 and T14 can run whenever their prerequisites are ready. G02 has no branch of its own: its acceptance is recorded as each feature's data contract is verified and reconciled in G24, and a gap found there becomes a branch for the owning feature. Stages 1–3 share one branch because they share the tokens, the notice shell and the card and media rules. Stage 1 was integrated into `dev` on 2026-11-10 from `feature/scs-refinement-foundations` (`2573294`, recorded in `05f809e`), before the stages were combined; `feature/scs-refinement-foundations-artwork` adds its token follow-up and Stages 2 and 3. Where T4–T6 name T1 as a dependency, they mean that integrated Stage 1, although T4 edits the same section as Stages 2 and 3 and is best started once T1–T3 is integrated. S1 ran on 2026-11-10 and its results are recorded under G18. The cart design it called into question was settled the same day (a shared cart lookup with at most 8 campaigns of up to 12 groups each, under G20); the limit for that worst case is still to be set. S2's fixtures were applied later on 2026-11-10 and checked by rendering with T4 (recorded under G19's Stage 0, with the gap found in the ended-claim fixture). S6 ran the same day (recorded under G32).

T17–T19 were added on 2026-11-10 from the prototype carry-over review and keep those numbers although they come before T16, which still closes the track. They are independent of the SCS branches and can run whenever their prerequisites are ready; T19 is best integrated before T8 so the design-language branches review one baseline. The Primary cutover's publication is followed by the French checkout wording check described under G32.

**App track (`gamma-promotions-app`, a new repository; SCS proposal, section 16).**

| # | Branch | Scope | Depends on | Model and effort |
| --- | --- | --- | --- | --- |
| A1 | `feature/foundation` | React Router scaffold, App Bridge authentication and token exchange, approved scopes, Prisma 7 with MariaDB, session storage, compliance webhooks, journal and audit; setup that verifies and adopts the definitions already on Gamma-Dev | Authorized repository and app creation | Opus 5.5 · high |
| A2 | `feature/vps-hosting` | systemd service, nginx server block, versioned releases with symlink rollback, migrations, backups, monitoring and alerts; restart, restore and isolation drills | A1; S3 | Opus 5.5 · high |
| A3 | `feature/campaign-editor` | Campaign, offer and group editors, gifts, pickers, side-by-side French and English, artwork per language, content guidance and blocking validation of the G18 contract | A1; S1 (P-TR) | Opus 5.5 · high |
| A4 | `feature/campaign-publishing` | Preview, publication and lifecycle actions for content-only campaigns, immutable term versions, deep duplication, gift reference and rental library | A3; S1 (P-PRE) | Opus 5.5 · medium |
| A5 | `feature/promotion-resources` | Owned-resource markers, eligibility collections and back-links, automatic and code discounts, read-back and `enforcement_verified_at`, ordered activation, pause and end, conflict detection and the discount budget | A4 | Fable 5.2 · high |
| A6 | `feature/price-plans` | Promotional price plans or a price list (P-PL), jobs with snapshots and safe restore, scheduler leases and catch-up, MAP rules per Brand | A5; S4 (P-PL) | Fable 5.2 · high |
| A7 | `feature/health-reconciliation` | Owned-resource webhooks, hourly reconcile, drift findings that hide broken claims, recovery actions and the daily digest | A5, A6 | Opus 5.5 · high |
| A8 | `feature/gift-operations` | G21's app side: the `promo-gift-live` collection for the optional Flow review, gift reference refinements, staff and emergency manual procedures | A5; S4 (P-ORD, P-FLOW); Q12–Q14 | Opus 5.5 · medium |
| A9 | `feature/catalogue-picker` | Optional WordPress catalogue picker, pairing and image import | A4; S4 (P-RENT) | Opus 5.5 · medium |

A1 and S3 start first because app readiness is the SCS's highest-ranked risk. After A7, a separately authorized cutover session (Opus 5.5 · high) installs the app on Primary, creates the definitions and moves the `promotions` handle as described in the SCS proposal (section 20), before T16's end-to-end checks.

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

G07 schema verification (2026-11-04): all eight `custom` metafields exist with the required types on both `PRODUCT` and `PRODUCTVARIANT` in Gamma-Dev (`gid://shopify/Shop/81927143660`, `gamma-dev-2318.myshopify.com`) and Primary (`gid://shopify/Shop/74939334829`, reported permanent domain `d2e135-ff.myshopify.com`; historical alias `location-gamma.myshopify.com`). Both stores have compatible `warranty_policy` and `return_exchange_policy` metaobject definitions, required fields, public storefront access, merchant editing, publishable/translation capabilities and references restricted to their own definition IDs. No definitions or values needed creation or modification. Content, translations, active policy entries and other G02 contracts remain separate prerequisites.

Public campaign, offer, hours and policy content should remain manageable through suitable Shopify content tools. Native references, translatability and storefront access should be researched before selecting new data structures. Campaign content uses G18's merchant-owned definitions, administered through the G22 app; campaign eligibility uses collections with app-maintained back-links rather than a product membership projection.

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

#### Prototype appearance carry-overs

**Status:** Planned (T19). **Decisions:** Q20, Q21. Six appearance choices from the prototype theme, which was Primary's published theme until `gamma-theme/dev` replaced it, were approved for carry-over on 2026-11-10. G04's Implemented status describes the earlier work; this increment is tracked by the criteria below. Each item is a theme-setting or template-setting change unless stated. Because they change shared components, each has its own rendered before-and-after review in French and English at 320, 390, 768 and 1440 px, with 200% zoom where text or controls change. The mechanisms below were read from the Horizon 4.4.0 source in this repository; rendered behaviour is unverified until that review.

**a. Signal Yellow announcement bar.** The store-wide announcement should stand apart from the header and the page, as it did in the prototype.

- Horizon 4.4.0 has no colour schemes. `sections/header-announcements.liquid` has a native `background_color` setting, and `snippets/contrast-override.liquid` then uses the page text colour when it reaches 4.5:1 against that background. Add a `signal` role (`#F6C700`) to the `color_palette` setting's default and current values, as G04 added `brand` and `brand_accessible`, and point the section's `background_color` at it in `sections/header-group.json`. No CSS is needed.
- Text is the page text colour: `#000000` on `#F6C700` computes to 13.1:1 (the prototype's 81% black to 9.5:1). Gamma Red is never used on the yellow (2.65:1).
- Set the announcement block in the label role (Inter SemiBold, 12 px, `case: uppercase`), with 12 px block padding. G21's content rule stands: one short line with a link and no conditions; the prototype's launch-sale text isn't carried over.
- Links: the block's `link` covers the whole line and is named by the announcement text; inline rich-text links stay underlined in the text colour. The focus ring must reach 3:1 against the yellow.
- Rotation happens only with more than one announcement block. Horizon then advances every `speed` seconds (7, carried over), suspends while the pointer is over the bar or the tab is hidden and offers previous and next buttons, but `assets/announcement-bar.js` has no pause control, doesn't suspend on keyboard focus and doesn't check the reduced-motion preference. That is an upstream limitation for auto-updating content (WCAG 2.2.2). Gamma publishes one announcement at a time, so nothing rotates; a second block isn't added until a pause mechanism is separately authorized.
- Edge cases: a long French line wrapping at 320 px and at 200% zoom, the bar with no announcement (the section is disabled, not left as an empty band), and the divider beneath it.

**b. Transparent header on the home page.** The home hero runs behind the header until the visitor scrolls.

- Settings in `sections/header.liquid`: `enable_transparent_header_home`, `home_inverse_logo` and `text_color_transparent_home` set to Paper. The prototype's `home_color_scheme` and `color_scheme_transparent` don't exist in 4.4.0. The state applies only to the `index` template. With the sticky header it is `not-sticky`: transparent at the top of the page, the normal Paper header once stuck, and normal row colours while a menu link is hovered or a menu is open. `layout/theme.liquid` offsets the first section when it must not sit under the header.
- Legibility is measured against the actual pixels behind each element over both G13 hero images, by G13's method: logo, menu links, language selector and action icons, text at 4.5:1 or better and icons and the focus ring at 3:1 or better. A shortfall is corrected through the hero's image or overlay settings, not header CSS; if it can't pass, the setting stays off and the result is reported.
- The announcement bar stays in normal flow above the header, which overlays the hero only. The change to the stuck state moves no hero content. The mobile drawer, menus and search dialog open on their own surfaces with normal colours. G13's search field and the hero heading stay clear of the header at 320 px and at 200% zoom.
- Edge cases: the hero removed or moved from first position in the theme editor, the bar disabled, long French menu labels, and keyboard focus moving through the transparent header.

**c. Larger product-page price.** The price carries more emphasis than body text; the title is unchanged.

- `snippets/typography-style.liquid` emits a block's `font` and `font_size` only for the `custom` preset, in Horizon 3.4.0 as in 4.4.0. The prototype's price block (`type_preset: h3`, accent font, `1.5rem`) therefore rendered as a heading 3, Oswald Medium at 32 px and the same size as the title; its font and size values never applied.
- Set the header price block in `templates/product.json` to the role settled by Q21 (recommended: the group-heading role, `type_preset: h4`, 24 px and 20 px on phones). G06 formatting is unchanged, and the hierarchy holds: the current price leads, the compare-at price is visibly secondary, and the unit price, volume pricing, tax and instalment lines stay in body sizes.
- Quick Add copies the product page's own price block (`assets/quick-add.js`), so it changes with it. Product cards and recommendation cards have their own price blocks and are out of scope.
- Edge cases: a sale price with compare-at and unit price in French format at 320 px, a price range, volume pricing, and the price updating on a variant change without shifting the purchase controls.

**d. Subtle zoom on card hover.** Set `card_hover_effect` to `subtle-zoom` (Theme settings, Animations).

- `snippets/card-hover-effect-styles.liquid` scales the image tile of product cards (`.card-gallery`, `.product-card__image`) and collection cards (`.collection-card__image`) by 1.5%, and scales predictive-search result cards whole, including the rental results that `assets/gamma-rental-search.js` builds. It applies only inside `@media (any-pointer: fine) and (prefers-reduced-motion: no-preference)`, so touch-only devices and reduced-motion visitors get no movement, and keyboard focus keeps its focus ring as the cue.
- It reaches every native product card: collections, search, recommendations, the home featured collection and campaign product grids. Campaign index cards, rental cards and variant-limited campaign cards (`snippets/gamma-promotion-card.liquid`, `gamma-rental-card.liquid`, `gamma-promotion-variant-card.liquid`) carry none of the targeted classes and don't move. For parity with the native card (G19), the variant-limited card gets the same effect through a scoped rule under the same media query.
- The tile itself is scaled, so artwork shown whole is never cropped. G10's hover image swap keeps working with the zoom, and a zoomed tile isn't clipped by a carousel or grid edge and doesn't cover a neighbouring card's text.

**e. Gamma Red input boundary and secondary-button hover.** In the prototype the default scheme's general border and the secondary scheme's border and input border were Gamma Red at 60% (`#ee262299`), and secondary buttons hovered to Gamma Red text and border on white. Variant option borders weren't red and are out of scope.

- Horizon 4.4.0 has one global input palette (`palette_input_border`, now `#333333`), no setting for the general border (`--color-border` is the page text colour in `snippets/color-palette.liquid`) and no hover settings: hover colours are computed by `snippets/util-palette-hover-shift.liquid`. No theme code reads `brand_accessible` yet.
- Contrast: Gamma Red at 60% on Paper is about `#f57d7a`, 2.59:1, below the 3:1 that WCAG 1.4.11 requires of an input boundary; full Gamma Red is 4.25:1. The approved brand exception covers the primary colour, not tints. The form is Q20. Recommended: full Gamma Red for the input boundary through `palette_input_border`, the tint nowhere, and red dividers only where a component has a colour setting (G07's accordion and G15's policy rows already use full Gamma Red); the design language's 12% Coal section hairlines stay.
- Secondary hover needs CSS: one rule in `assets/gamma-branding.css`, scoped to secondary buttons on Paper surfaces, that sets the hover text and border to Gamma Red and the pressed state to Deep Gamma Red, reading both from custom properties supplied by the theme settings and never from literals. This is a recorded Gamma exception to retaining Horizon's computed interaction colours; primary buttons, and secondary buttons on inverse surfaces and in the transparent header, keep the native behaviour.
- A red boundary must not read as an error. On the contact, newsletter, password, cart note, discount and search fields, an invalid state is identified by its message and icon and by `aria-invalid` with a described-by message where Horizon provides them (the newsletter block does), never by border colour. T19 records each field's native error presentation; a field that signals an error by colour alone is reported as an upstream finding, and the red boundary isn't enabled while one remains. The focus ring stays distinguishable from the boundary.

**f. Password-page logo.** Set the logo block's `pixel_height` to 120 in `templates/password.json` (24 at present). `custom_mobile_size` is off, so check the size that results on phones: the logo fits a 320 px viewport inside the page gutters and at 200% zoom, with a custom mobile width enabled only if it doesn't. Verify that the primary artwork is sharp at that size and that it reads against the password page's background.

**Acceptance criteria (this increment).**

- [ ] The announcement bar renders on `#F6C700` with text at 4.5:1 or better and a focus ring at 3:1 or better (measured), in the label role, in both languages; one announcement shows with no rotation, and its link is reachable and named by keyboard and screen reader.
- [ ] On the home page in both languages at the four widths, every transparent-header element meets the measured thresholds over both hero images; the header becomes the normal Paper header when stuck without moving hero content; the announcement bar, drawer, menus and search dialog are unaffected; other templates keep the normal header.
- [ ] With the hero removed or reordered in the theme editor, the header stays legible and nothing is hidden beneath it, or the limitation is recorded as a composition rule for the home template.
- [ ] The product-page price renders in the role approved under Q21 on the page and in Quick Add; compare-at, unit-price, volume-pricing and tax lines keep their order and G06 format; no line overflows at 320 px or at 200% zoom, and a variant change doesn't shift the purchase controls.
- [ ] With a fine pointer, native product and collection cards zoom on hover on collection, search, recommendation, home and campaign surfaces, and the variant-limited campaign card matches them; with reduced motion or touch nothing moves; no artwork is cropped and G10's hover image still swaps.
- [ ] Input boundaries measure 3:1 or better against their background in the form approved under Q20; each listed field's invalid state is identifiable without colour; the secondary button's hover and pressed states show the approved colours on Paper surfaces only, with visible focus.
- [ ] The password-page logo renders at 120 px on desktop and fits the viewport at 320 px and at 200% zoom in both languages.
- [ ] Every setting survives a theme-editor save and reload; the before-and-after review is recorded for each item; `npm run check:all` reports no new findings.

**Prototype reference.** `sections/header-group.json` (the announcement section on `scheme-3`, `case: uppercase`, `speed: 7`, padding 12/12; the header's `enable_transparent_header_home`, `home_color_scheme: inverse`, `color_scheme_transparent: scheme-6`), `templates/product.json` (the header price block), `config/settings_data.json` (`card_hover_effect: subtle-zoom`; `color_schemes` `scheme-1` and `scheme-2`) and `templates/password.json` (`pixel_height: 120`), all at `6bf3a38`. The brand guidelines list Signal Yellow `#F6C700` for alerts and low stock; only the announcement bar is approved here. The settings show the intent; colour-scheme IDs, the 60% tint on inputs and the price block's ineffective font values aren't carried over.

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

Operation-specific permission mapping, persistence, withdrawal cleanup and request verification belong to G17/G23. G17 records its map behaviour under Q03. Shopify classifies attribution under marketing; G23 must verify the selected app's actual permission and revocation behavior. Those future integration decisions and tests do not gate G05's native presentation acceptance.

### G06 — Bilingual CAD presentation

**Priority:** P1. **Status:** Implemented. **Dependencies:** G02, G03.

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

Local verification (`feature/money-formatting`, based on `58c6403`): shared Liquid/JavaScript CAD output uses two decimal places and U+00A0 spacing. Local renderer checks cover formatter parity, consumers, price-break JSON, native fallback routing and unchanged filter inputs; a Chromium harness covers English/French summaries, wrapping, keyboard focus and 320/375/768/1440px widths. `npm run check:all` passes with the six known Horizon warnings. Store-backed product/cart/editor/gift-card and cross-browser acceptance remains pending; the inherited Open Graph display-format amount is unchanged by explicit scope decision.

#### Prototype reference

`snippets/qc-money.liquid` used native French money output and an English CAD string transformation. Callers include price/cart/filter/quantity/volume snippets, buy buttons and `templates/gift_card.liquid`. The gift-card template output a raw balance, `meta-tags.liquid` used display text for an amount, and a facet fallback mixed cents with major-unit input. A shared display concern is valid; string assumptions and numeric-contract changes are not suitable production defaults.

### G32 — Quebec French storefront and checkout wording

**Priority:** P1. **Status:** Planned. **Dependencies:** G03; the approved French terms of G08, G11 and G13–G19; Q18. **Branch:** T17, with S6 before its checkout keys.

#### Purpose

Customers reading French should meet the vocabulary Quebec retailers use (rabais, livraison, ramassage en magasin, courriel) from the storefront through checkout. Horizon's French file is written for international French. The prototype had revised 101 of its strings, and that revision was lost when the theme was rebuilt on Horizon 4.x; the French checkout overrides made on the prototype theme were lost in the same way when `gamma-theme/dev` became Primary's published theme.

#### Expected behaviour and functional requirements

- Maintain one approved glossary (Q18) and apply it to every Horizon string in `locales/fr.json`: the prototype's revisions that still apply, and the strings Horizon added or changed between 3.4.0 and 4.4.0 (30 added and 7 changed, among them the fourteen `…_with_fees…` cart lines, `actions.log_in`, `actions.log_out` and `gift_cards.issued.how_to_use_gift_card`).

| Horizon's French | Gamma's Quebec French | Notes |
| --- | --- | --- |
| réduction, code de réduction | rabais, code promo | |
| Promotion (sale badge), prix promotionnel | Rabais, prix en rabais | “Promotion” stays the word for SCS campaigns |
| expédition, frais d’expédition | livraison, frais de livraison | The charge and the method; Gamma's approved notices keep “expédier” and “délai d’expédition” for the act of shipping |
| retrait | ramassage en magasin | Supplies the term for G08's pickup increment |
| e-mail | courriel | |
| blog, article de blog | blogue, article de blogue | |
| se connecter, se déconnecter | ouvrir une session, fermer la session | The two account actions are new in 4.4.0 and weren't in the prototype |
| s’inscrire | créer un compte | |
| soumettre | envoyer | |
| boutique (the premises) | magasin | “Boutique” stays for the online store |
| informations | renseignements (store), détails (product) | |
| frais de douane | droits de douane | |
| conditions générales | modalités | |
| tarification basée sur la quantité | tarification dégressive | |
| afficher (view actions) | voir | |

- Exclusions: `blocks.sold_out`, `content.product_badge_sold_out` and `products.product.sold_out` keep “Épuisé”, because the prototype's “Rupture de stock” would collide with G08's “En rupture de stock” for a purchasable backorder. No sentence approved under Q02 changes without Chris's approval. Where 4.4.0 changed a string the prototype had revised, 4.4.0's text is the starting point (`actions.remove` is now “Retirer”, so the prototype's “Tout supprimer” isn't re-applied).
- Gamma's own French strings follow the same glossary. A conflict is listed for Chris, not edited; the one known is “frais d’expédition supplémentaires” in G11's cart notices beside “frais de livraison” in the cart totals (Q18).
- Version the approved French checkout overrides as `shopify.*` keys in `locales/fr.json`, so that every theme published from this repository carries them. Keep only keys whose approved text differs from Shopify's default (S6). English gets none unless S6 finds one on Primary.
- English strings and `locales/fr.schema.json` are unchanged. Merchant content, menus, metaobjects and notifications are translated in Admin (G02), not in the theme.

#### Appearance and placement

No layout changes. The longer French labels (“Ramassage en magasin”, “Ouvrir une session”) must fit their controls in the header, cart totals, pickup line and buttons at 320 px and at 200% zoom.

#### Technical requirements and compatibility

- Shopify's storefront locale file documentation states that checkout and system strings are Shopify's own, under the reserved `shopify` and `customer_accounts` top-level keys, that such a key in a theme locale file overrides the default and that removing it restores the default. Prototype commit `c8a6f67` shows the language editor writing these keys into the theme's `locales/fr.json`. S6 (2026-11-10, read-only) found that Primary's published theme is `gamma-theme/dev` (`190128586925`), with no `shopify.*` or `customer_accounts.*` key in either storefront locale file, and that the prototype theme (`152420548781`) is unpublished. Overrides therefore belong to one theme, and Primary's French checkout shows Shopify's defaults today.
- Not settled by the documentation: which surfaces besides checkout read the keys (Shopify lists customer accounts as a separate category and applies only some edits to Shop Pay), and Shopify's default French for the eight known keys. S6 couldn't read either through the Admin API; both are read from the language editor or a French checkout before the keys are restored from `c8a6f67`.
- Theme Check's `MatchingTranslations` skips `shopify.` and `customer_accounts.` paths (theme-tools source), so French-only override keys shouldn't raise findings; T17 confirms with `npm run check:all`.
- Edit values only. Key names, `{{ interpolation }}` names, HTML tags and attributes and plural categories stay exactly as they are. French spacing follows Q18: a no-break space before a colon and inside guillemets, and no space before `?`, `!` and `;`. Six Horizon strings put a no-break space before `?`, `!` or `;`, and sixteen of Gamma's own strings have a breaking space before a colon; both are corrected here.
- `locales/fr.json` is a vendor file carrying Gamma edits. At each Horizon update, compare the incoming file with the previous vendor copy, re-apply the glossary to new and changed keys, and keep Gamma's text where Horizon's source string didn't change. T17 adds this step to the locale review in `AGENTS.md`.
- Other branches add `gamma_*` keys to the same file. T17 changes only Horizon keys, the spacing of existing Gamma strings and `shopify.*` keys, and is rebased when another branch lands first.

#### Edge cases and quality

Cover plural strings at 0, 1, 2 and 1,000 or more; strings with links; strings seen only in error states (discount code, quantity maximum, forms); screen-reader-only labels; the gift-card and password pages; Quick Add and the cart drawer; a term that appears in both the theme and checkout, where Shopify's own checkout wording may differ; and an override key that Shopify later renames, which would silently stop applying.

#### Acceptance criteria

- [ ] Chris has approved the glossary and every changed string (Q18, Q16) from a list of keys with their previous and new text, kept outside this repository.
- [ ] Every Horizon string in `locales/fr.json` conforms to the glossary, including keys added or changed since 3.4.0; the three sold-out keys still read “Épuisé” and no Q02 sentence changed without approval.
- [ ] A comparison of the changed keys shows the same interpolation names, HTML and plural categories before and after; `en.default.json` and `fr.schema.json` are unchanged; `npm run check:all` reports only the known Horizon warnings.
- [ ] Rendered French pages (home, collection, product, Quick Add, cart drawer and page, search, contact, newsletter, password, gift card and the header account link) show the approved terms with no clipped or overflowing label at 320, 390, 768 and 1440 px and at 200% zoom; the English routes under `/en` are unchanged.
- [ ] Shopify's default French is recorded beside each of the eight keys from `c8a6f67`, the retained keys are in `locales/fr.json`, and a French Gamma-Dev checkout shows the approved pickup stock line and split-delivery messages.
- [ ] After publication on Primary, the French checkout shows the same approved wording (G24 and the cutover).
- [ ] `AGENTS.md` carries the glossary step for Horizon updates.

#### Prototype reference

`locales/fr.json`: compare Horizon 3.4.0 at `df79657` with `origin/dev` at `c8a6f67`. The prototype revised 101 Horizon strings. At this plan's base, 5 survive (`blocks.email_signup.label` and `.placeholder`, `blocks.contact_form.email`, `actions.continue_shopping`, `content.pagination.nav_label`), `accessibility.open_hotspot` no longer exists and 95 differ. `c8a6f67` ("Update from Shopify for theme gamma-shopify-theme/dev", 2026-11-05) also added `shopify.checkout.local_pickup.stock_details.in_stock` (“En stock”) and seven `shopify.checkout.split_delivery.delivery_updated_toast.*` messages; the audit (`location-gamma-audit/CURRENT_STATE.md`, 2026-10-29) found that theme published on Primary; it has since been unpublished (S6). English wasn't revised. The vocabulary is the reference; the sold-out wording, a breaking space before a colon in `content.price_filter_html` and “Tout supprimer” aren't carried over.

## Phase 3 — Products and purchasing

### G07 — Product information and scoped updates

**Priority:** P1. **Status:** Implemented. **Dependencies:** G02, G03.

#### Purpose

Give customers the information needed to judge what they are buying: what is included, whether its specifications suit the job, how to use or maintain it, and which policies apply. A bare tool and a kit can need different information even within one product. Merchants should maintain common information once and supply variant-specific differences where necessary; the displayed information must follow the option the customer actually selects.

#### Expected behaviour and functional requirements

- Provide eight independently manageable families: included items, technical specifications, Gamma's advice, parts/accessories, manuals/documentation, FAQ, warranty, and returns/exchanges.
- Present included items as the contents of the selected purchase, keep optional accessories distinct, and provide usable links to the relevant manuals and policy content. Do not imply compatibility or included equipment that the approved content does not establish.
- Use usable selected-variant content first, then product content. Empty/cleared variant content inherits the product content; an explicit hide override is not currently a requirement.
- Hide rows with no useful content while retaining meaningful rich text, media and document links. Preserve ordered specification labels/values, units and everything after the first colon.
- Let merchants control row ordering, headings, icons and initial-open state through appropriate editor components.
- Update the relevant information when the customer changes an option or combined product, without requiring a full page reload. The content must agree with the selected price and purchase controls while preserving surviving disclosure state and appropriate keyboard focus. Hide previous information while the selection loads. A failed selection restores the previous confirmed variant, picker and information, announces recovery and cancels Add to Cart actions queued against the failed choice; purchasing the restored variant requires a fresh action. Sold-out variants and successfully rendered nonexistent combinations remain native selection states. When restoration is unavailable, show a full-page recovery link.

#### Appearance and placement

Place the eight information families in a disclosure/accordion group beneath the product description within the main product-information area. Use clearly labeled rows, consistent dividers and expand/collapse indicators; allow optional row icons and merchant ordering. The starting composition opens included items and technical specifications and leaves the other rows collapsed, with initial state editable. Show specifications as a readable label/value table and preserve rich-text hierarchy and document links in the other rows. Empty rows leave no empty headings or separators.

Escape translated and merchant-authored headings once in summaries and specification captions. Default dividers use the primary Gamma Red palette entry, with merchant overrides preserved. Titles, icons and content retain their native colours in both open and closed states.

#### Technical-specification table

Render a semantic table inside the specification disclosure, with a visually hidden caption matching its heading and no redundant visible column headings. Use fixed 40% label / 60% value columns, start/top alignment, semibold labels on a subtle foreground-derived 5% tint, regular body-text values, and thin horizontal row separators without an outer frame or vertical gridlines. Use native small vertical and medium inline spacing; below 400px of available table width, reduce inline padding to the extra-small token. Keep both columns on mobile and allow natural/emergency wrapping without clipping, fixed row heights or ordinary horizontal scrolling. Scope these styles to the specification component.

Preserve list order, units and punctuation; render in batches within Liquid’s per-loop limit so longer lists retain every entry. Split at the first colon and retain the entire remainder. Escape both cells and use `th scope="row"` for labels. Nonempty entries without a usable pair span both columns; discard whitespace-only entries. An effectively empty variant list inherits product specifications. Variant updates and recovery retain the disclosure state.

#### Technical requirements and compatibility

Use G02's typed fields and native metafield rendering. Reusable blocks/snippets should isolate content resolution from layout without a speculative general-purpose framework. Use the current `StandardEvents.productSelect` promise/response contract and keep a stable update target even for empty output. Successful selection adds no information-specific request. Native product-context pickers validate responses before applying them and commit product-page URLs after success, preserving unrelated URL/history state. A restored response carries optional `selectionRestored` metadata; queued cart resolution checks this before any fallback. Card swatch rendering retains its native request path. Scope identity and response matching by product, block and owning section/dialog; handle combined listings and clean lifecycle registration.

#### Edge cases and quality

Cover wrong-type/draft/deleted references, whitespace-only markup, image/file-only output, specification rows without delimiters, colon-containing ratios/URLs, unavailable options, rapid A→B→A changes and aborted responses. Independent products and Quick Add must not update one another. If focused content disappears, move focus only within the relevant interaction context and never steal it from another control.

#### Acceptance criteria

- [x] Required product/variant definitions and policy dependencies are compatible on both stores; no creation was necessary.
- [ ] All eight families show the correct variant/product content and translated headings.
- [ ] Empty rows disappear without losing useful content, values or document links.
- [ ] Native option/product updates cannot display stale or another product's information.
- [ ] Disclosure/focus behavior, no-JS initial content and editor add/reorder/remove/save work.
- [ ] The information group, initial-open settings, specification table and rich-text rows render legibly below the description in both languages and at narrow widths.
- [ ] Price, picker, media, purchase controls and native Quick Add remain functional.
- [ ] Failed selection restores the last confirmed variant and cancels its queued Add actions; stale failures and superseded requests cannot undo a newer selection.

Local implementation (`feature/product-information`, based on `7b27a25`): eight configurable typed-information rows, variant/product fallback, scoped native-response updates, responsive 40/60 specification tables and previous-variant recovery are implemented. Both-store definition verification required no writes. Local browser checks use the actual feature modules with simulated native responses; Chromium and Firefox cover responsive English/French layouts, disclosure state, races, isolation, dropdown/combined-product selections, failed-selection recovery, queued-cart cancellation and reconnection. Theme Check retains only the six known Horizon warnings and JavaScript checking passes. WebKit cannot launch because `libicudata.so.74` is unavailable. Approved content/translations, broader real catalog/media/purchase journeys and theme-editor acceptance remain pending; no publication was performed.

The heading/divider follow-up verifies actual English/French Liquid output through the authorized running development preview in Chromium at 320/375/768/1440px. Checks cover native title colours, Gamma Red dividers, keyboard/reduced-motion behaviour, table alignment, temporary merchant heading/colour overrides and no-JS rendering of the returned HTML. Isolated promise-result checks retain disclosure/focus state and colours on successful/restored responses. These product routes expose no variant picker; French merchant information is still English. Preview privacy/Shop Pay, header section-rendering and recommendation errors limit whole-page acceptance. Follow-up Firefox checks are blocked by the installed Playwright/browser protocol mismatch.

#### Prototype reference

`templates/product.json` embedded eight Liquid renderers inside `accordion-dynamic` and `_accordion-row-dynamic` blocks below the description, with included items/specifications initially open and the other rows collapsed. The campaign checkout used variant fields; `origin/dev` added product fallback. Text-stripping could hide useful markup, specification slicing lost later colon segments, and ordinary variant selection did not refresh custom details. The field families, typed references and automatic relevance are useful design inputs; embedded template logic and stale updates should be reconsidered.

### G08 — Availability and fulfillment information

**Priority:** P1. **Status:** Implemented. **Dependencies:** G02, G03, G07.

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

Local implementation (`feature/availability`, based on `2da2f90`): a shared resolver applies the precedence unavailable → quantity-limited → tracked stock covering the required quantity → exact `special order` tag → continue-selling backorder/partial backorder → untracked/service-managed (no claim). Only `inventory_management == 'shopify'` supplies stock evidence; tagged items with sufficient tracked stock show no delay. Notices render inside buy-buttons before purchase controls (visible in desktop/mobile Quick Add), clear while a selection loads and update only from responses matching section, block, product and variant. Cart lines use all cart units of the variant. Cards show Backorder/Special order only from complete variant data (≤250) and a neutral Varies badge otherwise, beside native Sale; a Badges theme setting can disable them. Native per-location pickup is enabled on the product template. French backorder wording uses “En rupture de stock”, shortened to “En rupture” on card badges, so a purchasable backorder is not confused with the native “Épuisé” sold-out label. Theme Check retains only the six known Horizon warnings and JavaScript checking passes; isolated Chromium/Firefox checks with simulated selection responses cover updates, races, aborts, restoration, failures, mismatches, isolation and owner moves. Liquid rendering, fixtures, pickup locations, responsive/screen-reader, editor and card-performance acceptance require an authorized Shopify-rendered environment, and approved Q02 wording remains pending.

#### Prototype reference

`snippets/inventory-status.liquid` fed `blocks/availability-notice.liquid`, card gallery, cart products and cart summary. The product template placed the notice between picker and purchase controls; the block used a pale highlighted panel with distinct backorder/special-order icons beside text. `buy-buttons.liquid` modified pickup wording using aggregate inventory. Untracked items could be labeled backordered, mixed sold-out/delayed products could lose badges, and the cart assumed ship-together policy. The informational overlay is useful; its truth table and operational claims need independent validation.

#### Pickup information for backordered and special-order items

**Status:** Planned (T18). **Prerequisite:** S5. **Decision:** Q19. Approved for carry-over on 2026-11-10 as a new increment; the rest of G08, including its Implemented status, is unchanged.

**Purpose.** Stop the native pickup line from contradicting the availability notice. Horizon's `local-pickup` component in `blocks/buy-buttons.liquid` shows a green check, "Pickup available at …" and a ready time whenever a pickup location reports `available`. Shopify documents the Storefront API's `StoreAvailability.available` as true for untracked or oversellable inventory, even at a quantity of zero or less; the Liquid `store_availability` reference says only that the variant "has available inventory at the location". If Liquid behaves as the Storefront API does, which is an inference until S5, a backordered or special-order variant shows G08's notice above a line saying it is ready for pickup.

**Behaviour.** The status comes from the same resolver call as the notice: `snippets/gamma-availability-status.liquid` for the selected variant at its minimum order quantity. As today, the product page doesn't resolve again when the quantity field changes; the cart line does. Each location contributes only its native `pick_up_enabled`, `available` and `pick_up_time`. Liquid exposes no stock per location, and the resolver's `inventory_quantity` is never used to say which location holds stock.

| Resolver token | Location `available` | Pickup summary and dialog row |
| --- | --- | --- |
| `in_stock`, `quantity_limited`, `untracked`, `service_managed` | true | Native, unchanged |
| Any | false | Native "Pickup currently not available", unchanged |
| `backorder`, `partial_backorder` | true | Backorder icon and wording, no ready time |
| `special_order` | true | Special-order icon and wording, no ready time |
| `unavailable` | Any | Native: the component shows nothing |

- The summary uses the first pickup-enabled location that reports `available`, as Horizon does; the dialog gives every pickup-enabled location its own row state. A location with pickup turned off stays omitted, and a variant with no pickup location hides the component.
- With more than one location, an `in_stock` token reflects total stock, so a location holding none can still show the native ready line. Liquid can't tell them apart, and the output stays native as G08 requires. S5 records how `available` behaves for a variant stocked at one of two locations; a finding there returns to Q19.
- If S5 shows that Liquid reports `available` as false for a continue-selling variant without stock, the native "not available" line is already truthful and this increment is recorded as not needed.

**Appearance.** `icon-gamma-backorder.svg` or `icon-gamma-special-order.svg` in the notice's accent colour replaces the green check, and the status is always named in the text. The summary keeps its two lines, type sizes and "View store information" button. No panel is added.

**Draft wording (Q19).** Chris reviews all wording (Q16). The keys sit under `gamma_availability.pickup` in both locale files, with a no-break space before each French colon; Horizon's `content.pickup_*` strings keep their native role.

| Key | English | French |
| --- | --- | --- |
| `backorder_html` | Backordered: not yet ready for pickup at <b>{{ location }}</b> | En rupture de stock : pas encore prêt pour le ramassage à <b>{{ location }}</b> |
| `special_order_html` | Special order: not yet ready for pickup at <b>{{ location }}</b> | En commande spéciale : pas encore prêt pour le ramassage à <b>{{ location }}</b> |
| `timing` | Pickup timing depends on supplier availability. | Le moment du ramassage dépend de la disponibilité chez le fournisseur. |
| `backorder_row` | Backordered: pickup timing depends on supplier availability | En rupture de stock : ramassage selon la disponibilité chez le fournisseur |
| `special_order_row` | Special order: pickup timing depends on supplier availability | En commande spéciale : ramassage selon la disponibilité chez le fournisseur |

These state a condition, give no lead time or pickup date and make no commitment to contact the customer. The prototype's "Pickup will be available at …" and "we'll let you know" are not carried over: Q02 allows no pickup promise, and the 2026-11-05 G11 decision removed the prototype's pickup claim.

**Technical requirements.** Keep the `local-pickup` element, its `data-variant-id` and `data-section-id`, its `ref` and the sibling `theme-drawer.pickup-drawer` as they are, so that `assets/local-pickup.js` needs no change. That script listens for `StandardEvents.productSelect` on the closest section or dialog, ignores product cards, fetches the product URL for the new variant (the new product's URL in a combined listing), aborts a superseded request and morphs both the summary and the portaled drawer from the response. The wording is therefore rendered by Shopify for each selection and never computed from client state. Put the Gamma branch in one `gamma-` snippet rendered from the summary and the dialog row, capture the resolver once per render, and report the edit as a Gamma change to a Horizon file.

**Edge cases.** Cover zero, negative and positive stock under both inventory policies; untracked and service-managed variants; a `special order` product with stock; a minimum quantity above the stock; several pickup locations with one unavailable; pickup turned off everywhere; the block's pickup setting off; long location names in French at 320 px and at 200% zoom; desktop and mobile Quick Add; a combined listing that changes product; rapid option changes; and a failed request, where Horizon hides the component. Two native behaviours stay and are reported, not changed: the previous variant's pickup line remains until the response arrives while G08's notice clears at once, and `local-pickup.js` matches the response by section and variant, not by block.

**Acceptance criteria (this increment).**

- [ ] S5's record shows what `available`, `pick_up_enabled` and `pick_up_time` return for each fixture, and the state table is confirmed or corrected against it before implementation.
- [ ] For each row of the state table, the summary and every dialog row show the specified icon and wording in English and French; a backordered or special-order variant shows no green check or ready time, and the other states render as native Horizon does.
- [ ] After a variant change on the product page, in desktop and mobile Quick Add and across a combined listing, the summary, the dialog and the availability notice describe the same selected variant once the response settles; rapid changes never leave an earlier variant's wording, and a failed request hides the component.
- [ ] Two pickup locations with different availability each show their own row state, a location with pickup turned off is absent, and nothing renders when the block's pickup setting is off.
- [ ] The status is identifiable without colour, the icons are hidden from assistive technology with the status in text, the dialog keeps its focus behaviour, and the lines reflow without clipping at 320, 390, 768 and 1440 px and at 200% zoom.
- [ ] The wording is the version approved under Q19; `npm run check:all` reports no new findings and the English and French keys match.

**Prototype reference.** `blocks/buy-buttons.liquid` (`git diff df79657 6bf3a38`) replaced the summary and dialog icon with `assets/icon-backordered.svg` or `icon-special-order.svg` and the text with `content.pickup_available_at_backordered_html`, `pickup_ready_in_backordered` and `pickup_ready_in_special_order`, deciding by the variant's total `inventory_quantity > 0` and the `special order` tag. The status icon and the absence of a ready time are the useful part. Its aggregate test treated untracked variants as backordered and ignored inventory policy and quantity rules, and its wording promised pickup and a follow-up.

### G09 — Battery systems and recommendations

**Priority:** P1. **Status:** Implemented. **Dependencies:** G02, G03, G07.

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

Local implementation (`feature/battery-systems`, based on `e255bbe`): a public `product-battery-system` block sits after the price in the product header group. It renders only an active `battery_system` metaobject from a typed `custom.battery_system` reference, selects the language-family icon with the other-language icon as fallback, maps the two approved `system_type` choices to EN/FR theme strings (other values display as returned) and shows the name beside the type when no image is usable. It links to the referenced collection only when it is published and nonempty, with hidden “View the range” link text; otherwise the content is nonlinked. The icon-height range (16–64px, default 30) scales artwork proportionally within the column. No JavaScript is added: combined-product changes use the native `<main>` morph, variant-only changes leave the block untouched, and native Quick Add hides it. A native complementary section (“Optional accessories”) precedes the existing related section; Horizon hides empty or failed complementary results, and its related-results catalog fallback is unchanged upstream behavior. `item_set_link` remains unimplemented. Theme Check retains only the six known Horizon warnings, JavaScript checking passes, EN/FR keys match, and a static Chromium layout harness confirmed wrapping, wide-logo clamping and no overflow at 288/343/768/1440px content widths. Store definition/content checks, French heading and metaobject translations, Search & Discovery complementary setup, rendered Liquid output, combined-listing, Quick Add, editor and screen-reader acceptance require an authorized Shopify-rendered environment; wording remains subject to Q08.

#### Prototype reference

`blocks/product-system-badges.liquid` rendered `custom.battery_system` as a localized icon beside `system_type`, with a collection link wrapping both where available. The icon-height setting defaulted to 30px, with proportional width and small heading-style text. `templates/product.json` placed the block directly after price in the header group, before the campaign banner and variant picker, and placed complementary/related sections after the main information. An earlier `snippets/system-badges.liquid` was superseded by the block. Supporting `item_set_link` data had no runtime consumer, so the directional kit link is an extension rather than established storefront behavior. Improve missing-image/text fallback and responsive constraints instead of treating these styling details as a fixed implementation.

### G10 — Localized media and product video

**Priority:** P1. **Status:** Implemented. **Dependencies:** G03; G02 for approved catalog media.

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

Local implementation (`feature/localized-media`, based on `c0f8666`): `snippets/gamma-media-exclusions.liquid` classifies each media item by its preview filename (query/fragment removed, decoded, lowercased, one extension removed) and excludes only a terminal `-en`/`_en`/`-fr`/`_fr` marker of the other language family; regional codes normalize to `en`/`fr`, other languages are unfiltered, and a product with no neutral or matching media shows all its media. Regional filename aliases and Shopify's duplicate-name UUID suffix are not recognized. Native product-media order is kept; galleries, zoom, thumbnails, counts and model selection, cards and swatches, transitions, predictive-search cards, sticky/fly-to-cart images and cart thumbnails derive from the eligible list, and an excluded variant image follows the native no-image path. Product videos use native controls with the player API retained for pausing, video slides no longer open zoom on click, carousel dragging ignores native video controls, gallery videos and posters are contained, and embeds use `youtube-nocookie.com` and Vimeo `dnt=1`; product videos still start muted after the click. Quick-order list, hotspot, `_image` product fallback, collection thumbnails built from product images, the featured-product section ratio and Open Graph/structured-data images are not filtered. Theme Check retains only the six known Horizon warnings and JavaScript checking passes; scratch Chromium/Firefox checks with the actual slideshow and deferred-media modules confirm the drag exemption, containment and pause behaviour. Liquid output, `external_video_tag` with the privacy-enhanced URL, high-count lists, real catalog filenames, provider behaviour, mobile seeking, editor and performance acceptance require an authorized Shopify-rendered environment. Suspected upstream issues: the gallery never passes `first_3d_model`/`selected_product` to `product-media`, so XR model data is not emitted; single-media and dots thresholds ignore hidden variant media; URL-based video iframes cannot be paused programmatically.

#### Prototype reference

`snippets/card-gallery.liquid` and `product-media-gallery-content.liquid` filtered preview filenames independently. Underscore recognition, featured insertion and pre-filter counters were inconsistent. `product-media.liquid` enabled controls; `custom.css` applied containment. The `video.liquid` YouTube host change covered URL-based video, while external product video used a separate filter path. The intent should be evaluated across the complete current media pipeline.

### G11 — Cart experience

**Priority:** P1. **Status:** Implemented. **Dependencies:** G04, G06, G08.

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

Local implementation (`feature/cart`, based on `26b72a6`): theme settings keep the native cart drawer, show the order note open by default, hide Shop Pay payment options in the cart, keep accelerated checkout buttons and enable desktop and mobile Quick Add; the cart page remains available from the drawer and `/cart`. Cart lines also show Shopify's native `line_item.error_message` beside the G08 availability text. Above the checkout actions, a cart containing any line that resolves to backorder, partial backorder or special order explains that its shipping time depends on supplier availability; when another line resolves to tracked stock covering its variant's cart units, a ship-together notice replaces it, adding that the order ships together once everything has arrived and that customers who want in-stock items sent separately can say so in the order note, with additional shipping charges (without notes enabled it asks them to contact the store). Untracked and service-managed lines count as neither. A theme setting can disable the notice. All additions are Liquid inside the native cart sections, so native re-rendering, note preservation, announcements, back/forward restoration and checkout handoff are unchanged; no Horizon JavaScript was modified. Theme Check retains only the seven known Horizon warnings and JavaScript checking passes. Add-to-cart, Quick Add and discount requests now pass the current page as `sections_url`, so re-rendered cart sections stay in the shopper's language rather than Shopify's default French. The authorized development preview (Chromium, English and French, 1440px and 375px) confirms the backorder/special-order notices on the product page, card badges, drawer and cart page with real backorder, special-order and in-stock products; the delay-only and ship-together notices and the switch between them on removal; the open note keeping typed text through adds, quantity changes, removal and Back navigation and reaching the checkout form post; native cart-count announcements; language retained after Quick Add and discount requests; the invalid-discount error; accelerated checkout in the drawer; visible mobile Quick Add; and mobile layouts without horizontal scrolling. Checkout itself, `error_message` population, real discounts, selling plans, quantity rules, network failures, screen readers, other browsers, editor settings and the sticky desktop summary remain pending. The preview proxy intermittently redirects storefront and section requests to the password page. Suspected upstream issues: failed note saves are silent, a line removal that fails on the network leaves the row hidden, and a quantity change that fails on the network shows no visible error.

#### Prototype reference

`config/settings_data.json` selected cart page, open notes, hidden installments, accelerated buttons and disabled mobile Quick Add. Cart snippets added money/status output and a ship-together notice. `assets/header-actions.js` was an upstream-history cart-announcement backport. Current native announcements replace that event contract; operational copy still needs merchant confirmation.

### G12 — Collection layouts and filters

**Priority:** P1. **Status:** Implemented. **Dependencies:** G03, G04, G06, G08, G09, G10.

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

Local implementation (`feature/collections`, based on `88939f7`): three Filters block settings (hide brand/vendor, product type and power source) remove `filter.p.vendor`, `filter.p.product_type` and `filter.v.t.shopify.power-source` by `param_name` from the single filter list that the counts, horizontal bar, overflow/mobile drawer and removal pills share, but only while the filter has no active value, so a URL-applied fixed attribute stays visible, removable and preserved by later submissions. `collection.json` is unchanged; `collection.brand-collection`, `type-collection`, `power-source-collection`, `brand-type-collection` and `brand-pwrsrc-collection` copy it and differ only in those settings. These names and parameters match the published Primary theme's templates; a read-only Primary check found no collection assigned to an alternate template yet, and its storefront exposes exactly these vendor, product-type and power-source parameters with French labels, plus `filter.p.m.custom.battery_system` (not hidden by any context) and product-type values that differ between English and French. No card, section, snippet or CSS changes were needed: G06 filter/price output, G08 badges, G10 media, swatches and Quick Add render inside the same section request for filtering, sorting and later pages. `assets/gamma-facets-history.js` re-renders the facets section on Back/Forward when filter or sort state differs from the rendered state (page-only changes are left alone); Horizon 4.4.0 pushes history entries but only restores scroll, which a harness using Horizon's actual facets, section-renderer and scroll-container modules confirmed. Theme Check retains only the seven known Horizon warnings, JavaScript checking passes, EN/FR schema keys match, and an unpublished Gamma-Dev theme upload accepted the settings and templates. The authorized Gamma-Dev development preview (Chromium) rendered all six templates via `?view=` in English and French without Liquid errors. Gamma-Dev exposes only availability and price filters, so the omission rule was exercised by temporarily pointing one setting at `filter.v.availability` (reverted, uncommitted): at 1440px and 375px the inactive filter was absent from the bar and drawer, a URL-applied value showed its filter, pill, count bubble and active Clear all, survived sorting, disappeared when unchecked, and Back/Forward restored the matching results. Infinite scroll loaded all 51 products of a specialized template across three pages with localized links, prices and G08 badges; filtering after scrolling, exact EN/FR price-filter bounds, empty and zero-result states, the search page, 320/375/768/1440px reflow without horizontal scrolling and keyboard open/Escape/focus return for panels and the drawer passed; specialized and default response times were comparable. Testing via `?view=` loses the parameter after the first filter change because Horizon rebuilds the URL from the form; assigned templates are unaffected. Pending: real vendor, product-type and power-source filters on a store where they are enabled, editor persistence and collection assignment, screen readers, swatch and hover-image cards (no Gamma-Dev fixtures), other browsers and French collection content.

#### Prototype reference

`templates/collection.json` and five specialized collection templates used native section/card trees. Their `custom_css` hid vendor, product-type or power-source facets, sometimes in pairs. The files establish genuine filter differences and content assignments, not a separate collection query engine. Current filter markup and merchant settings should determine the final integration.

## Phase 4 — Search and rental discovery

### G13 — Home search entry

**Priority:** P1. **Status:** Implemented. **Dependencies:** G03, G06.

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

Local implementation (`feature/home-search`, based on `7617a70`): the `gamma-search-entry` theme block (`blocks/gamma-search-entry.liquid`, `assets/gamma-search-entry.js`) renders a GET form to `routes.search_url` with a localized instruction that precedes the input in reading order (also its `aria-describedby`) and is shown below the field in the theme's small text size, a real label, `options[prefix]=last` and a 44 px submit button. The first committed input of a query (typing, paste, replacement or finished IME composition) opens `#search-modal` through `showDialog()` when Horizon's dialog and predictive search are ready; on `dialog:open` the exact text, caret and selection move into the dialog's input with one `insertReplacementText` input event, so Horizon's own search, results, keyboard navigation and `SearchUpdateEvent` run unchanged, and the home field is cleared. A query begun before the dialog is ready stays an ordinary form query until the field is cleared; focus, script loading and Enter or the button with a typed query never open the dialog (the typed query goes to the search page), and an empty submit opens it. If the dialog fails to open, the field stays a form and an empty submit continues to the search page. The field and instruction share a background colour and opacity setting (black at 60% by default, translucent over the hero image) with white text and border; the submit button and focus ring are styled within the block only, so the search dialog is unchanged. `templates/index.json` now follows the published snapshot's hero: both STIHL hero images, the slogan, then the search field at 60% desktop width at the bottom of the image (Horizon's placeholder "Shop all" button was removed). The slogan is still English template text; the French homepage needs its French slogan through Translate & Adapt or G15.

Horizon 4.4.0 loaded its predictive-search empty state with a debounced reset that cleared the input and cancelled the search about 100 ms later, so a returning visitor (with recently viewed products) who typed before that initialization finished lost the query from either the header or the home field. A scratch harness using Horizon's unmodified modules reproduced it; `#loadEmptyState()` in `assets/predictive-search.js` now loads the empty state immediately and skips it when a query is already present (the next reset loads it). Remove that change once Horizon no longer clears a typed query during initialization. Remaining native issues, documented and unchanged: the Clear button's 100 ms debounce can drop characters typed right after it; a failed predictive request leaves the previous query's results and count visible without an error; superseded requests are not aborted at the network level; the dialog's combobox does not expose the highlighted result to screen readers (no `aria-activedescendant`, static `aria-expanded`, non-option listbox children) and Tab moves the highlight; the dialog has unused `on:click`/`on:keydown` handlers. Also observed but not attributed to G13: after closing the dialog with its close button, Chromium drops the next keystrokes and Firefox sends them into the closed dialog's input (Escape works); this occurs with any text input that opens the dialog and needs confirmation with real input devices.

`npm run check:all` reports only the seven known Horizon warnings and EN/FR keys match. Scratch harnesses with Horizon's real dialog and predictive-search modules passed in Chromium and Firefox (hand-off, paste, IME, selection and whitespace, plain-form mode before load, submit races, empty submit, missing, undefined or failing dialog, reconnect and removal, two blocks, no-JS, U1 header and home paths). Against `shopify theme dev` on gamma-dev, French `/` and English `/en` resolved their locales, translated label, instruction and button, and submitted to `/search` and `/en/search` with and without JavaScript; hand-off, native results and arrow keys, Escape and focus return, repeat searches, returning-visitor immediate typing after viewing a product, slow script loading, keyboard order and focus rings, touch emulation, IME, section re-rendering, 320/375/768/1440 px layout inside the bottom of the hero, 320 px reflow, 200% text, text spacing and forced colours passed in Chromium. Measured against the actual hero pixels with the default 60% background: input text at least 8.4:1, placeholder at least 6.1:1, instruction at least 9:1, icon at least 9.2:1, field boundary at least 3.44:1 (white border or dark fill) and focus ring at least 4.59:1; at 50% the boundary fell to 2.96:1 against some mid-tone pixels. Firefox rendered checks passed except horizontal page scrolling at 320–375 px caused by the footer copyright line and mobile-menu backdrop, unchanged with the block hidden. Pending: theme-editor add/remove/reorder/save (no editor session was available), WebKit/Safari (host libraries missing), real iOS/Android devices and keyboards, NVDA and VoiceOver, the French slogan, and confirmation that other hero images, a lower opacity, other colours or a removed border still give the required contrast.

#### Prototype reference

`blocks/search-box.liquid` defined a rounded field with an integrated search icon, responsive width, background transparency and spacing, plus a custom element opening `search-modal` and forwarding input/paste. `templates/index.json` placed it beneath the home hero heading. Its interception could lose the fallback when the modal was missing. A snapshot-only `assets/search-box.js` duplicated the same general controller role and had no confirmed runtime caller. The shared-dialog entry is useful; duplicate ownership and unconditional interception are not.

### G14 — Rental search integration

**Priority:** P1. **Status:** Implemented. **Dependencies:** G02, G05, G13.

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

Local implementation (`feature/rental-search`, based on `cddebeb`): Theme settings > Search adds `gamma_rental_search` (off by default) and blank `gamma_rental_site_fr`/`gamma_rental_site_en` addresses; `config/settings_data.json` turns it on with the current `https://www.locationgamma.com/fr/` and `https://www.locationgamma.com/` addresses, noting that they change at launch. `snippets/gamma-rental-url.liquid` picks the address by language family and accepts only an https folder address without query, fragment or credentials; otherwise no markup, script or request is produced for that language. No rental hostname appears in code, so the planned move to `locations.locationgamma.com` is a change of the two settings, provided that host keeps the same WordPress structure (`wp-json/wp/v2/products` under each language folder and `?post_type=gamma_product&s=` search pages). `sections/gamma-rental-search-link.liquid`, placed after the search header in `templates/search.json`, renders a server-side link to the rental search for the terms (`search.terms` arrives HTML-escaped and is decoded before `url_encode`), or to the rental site without terms. `snippets/gamma-rental-search.liquid` is rendered before `#predictive-search-results` by `sections/predictive-search.liquid` and `snippets/predictive-search-empty-state.liquid`, with a fixed ID and morph's `data-skip-node-update`/`data-skip-subtree-update`, so every native update keeps the same element and its results. `assets/gamma-rental-search.js` follows the dialog input itself (input, finished composition, Escape, the Clear button and dialog close), so rental results neither wait for nor depend on Shopify's: 3–100 characters, 300 ms debounce, one request at a time without credentials or referrer, redirects rejected, 3 s timeout and a 256 KB limit enforced while streaming; four results through `_embed` (the medium image, else the next uncropped size up to full; WordPress's square-cropped thumbnail is never used); a 20-entry, 5-minute in-memory cache; pauses after two failures (60 s), a 429 (Retry-After, 30–600 s) or a 401/403 (10 min), while cancelled requests don't count. Titles are decoded once as inert text; links and images must be https on the configured origin, and links under the language folder. Cards reuse the native result-card markup without price or purchase controls, show full titles over a blank line where native cards show the price, and scale each photo to fit a white 4:5 box; rental pages and the rental search open in a new tab so the store's search stays open. The `h3` heading row also holds a switch (labelled by the heading) and, on the right, the pill-styled “See all” link; Horizon's arrow-key navigation reaches the switch, link and cards without adding to native result counts or search events. With the switch off, the catalogue isn't searched: a searchable query shows only the heading row, with tighter padding and a “See rental results” link to the rental site's search, and turning the switch on searches the current query; the choice lasts for the tab through `sessionStorage`; Enter and Space on the focused switch are claimed before Horizon's document-level key handling. Zero matches hide the group; while rental results show, native search's no-results block is hidden; failures show a short message with a rental search link. The rental image server sends no `Access-Control-Allow-Origin`, so images load as ordinary requests with `referrerpolicy="no-referrer"`; browsers may send cookies they hold for the rental site with them (none are set for anonymous visitors), and a page stops requesting images after two fail with none loaded. A narrow fix in `assets/predictive-search.js` makes Enter follow a highlighted item before Horizon's single-result shortcut; unmodified Horizon 4.4.0 opened the only native result even with a query suggestion or rental card highlighted (reproduced in Chromium and Firefox). Remove it once Horizon gives the highlighted item precedence.

`npm run check:all` reports only the seven known Horizon warnings, and EN/FR keys match. A scratch harness passed 53 adapter checks in Chromium and Firefox (validation, decoding, size limit, timeout, cancellation, error kinds, fetch options, a local redirect). From the `shopify theme dev` origin on gamma-dev, both browsers confirmed the live contract: CORS GETs without preflight, `X-WP-Total` readable, no cookie or referrer sent, 4 results of ~35 KB, and anonymous CORS images blocked. Rendered checks in Chromium and Firefox on French `/` and English `/en` passed: correct language APIs, links and search pages; sale and rental, sale only (group hidden), rental only (with native no results) and neither; failed and stalled native search with rental working; 500, 429, 403, timeout, malformed and unsafe responses with native search unaffected and requests paused; rapid edits, out-of-order and cancelled requests; Clear, Escape, shortening, close and reopen; native morphs before and after rental results, repeated morphs, moves, removal, reinsertion and replacement without lost or duplicated results; arrow keys, wrap-around and Enter on cards and links; G13 typing and paste hand-off; recently viewed; IME and long pastes; disabled and invalid settings, including one language only; 320/375/768/1440 px, 200% zoom, forced colours, reduced motion and touch. axe-core reported no violations in result, rental-only and error states. Native suggestion timing and `SearchUpdateEvent` totals matched the disabled baseline. Follow-up rendered checks in both browsers covered the top placement, images within white boxes, the hidden native no-results block (and its return when rentals have none or fail), the heading-row link at 320–1440 px, new tabs from cards, Enter and the “See all” link, the taller desktop dialog (up to the viewport less 12rem) at 1440×900/1200 and 768 px, and the switch by pointer, heading click, arrow keys with Enter, and focused Enter/Space, the collapsed link without rental requests, searching again when switched on, failure and zero-match states, persistence across pages and axe in both states. Pending: Safari/WebKit, real iOS/Android devices, NVDA and VoiceOver, theme-editor setting changes and section add/remove/save (no editor session) and enabling the integration on Primary.

#### Prototype reference

`assets/predictive-search-legacy.js` queried `wp-json/wp/v2/products`, normalized titles/images and optionally fetched featured media. `assets/predictive-search.js` inserted results, `snippets/search-modal.liquid` supplied localized configuration and `sections/search-header.liquid` added a full-search rental link. The design had abort tokens and text output, but native-success coupling, unbounded media fanout, indefinite last-query caching, debug logging and unvalidated returned destinations needed reconsideration.

## Phase 5 — Business content and location

### G15 — Home, footer and information pages

**Priority:** P2. **Status:** Implemented. **Dependencies:** G02, G03, G04, G07, G09, G10, G13.

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

Local implementation (`feature/business-pages`): template and section-group text is English source content, and French storefront text is a theme-content translation. Shopify keeps those translations per theme, so they must be registered on each new theme: read its `translatableResources`, confirm each source is unchanged and call `translationsRegister` with the SHA-256 of that source as the digest. The home page keeps the G13 hero and search field, heads the featured products with an `h2`, and adds `gamma_intro` with the introduction in a group that is 66% of the page width on larger screens and full width on mobile. `url` settings are translatable theme content, so language-specific external links in theme settings can use translated destinations. The footer has four groups: logo, newsletter heading and native sign-up, Facebook and Instagram, and native payment icons (named by the block's hidden label); `gamma_visit` with the business name, address and `tel:`/`mailto:` links in the same tab, where G16 adds hours and G17 the map; and `gamma_menus_shop`/`gamma_menus_info` holding the footer menus and G03 overrides. Menu headings stay blank so Horizon shows the translatable menu titles and names each `nav`. Powered-by is off and `footer-policy-list` is unchanged for G05's consent-reopening link. The contact template orders the title, `gamma_business` (`gamma_business_row` > `gamma_business_details` > `gamma_business_contact`; G16 adds hours inside the details and G17 adds the map beside them in the row), the page body and the native form ("Send"/"Envoyer"). Department cards stay in the page body: `assets/gamma-page-content.css` lays out `.display-card-table`/`.display-card` as a wrapping grid with a foreground tint and is loaded only when the page content uses the class. `snippets/gamma-policy-content.liquid` now renders G07's policy and rich-text rows; `blocks/gamma-policy.liquid` shows the selected `warranty_policy` or `return_exchange_policy` entry (warranty first if both are set) headed by its name or an override, either as a section or as a collapsible row using Horizon's accordion markup and styles, and renders nothing for a missing, draft or unselected entry apart from editor guidance. Collapsible Policy blocks placed one after another form a single list with Gamma Red dividers between rows, so a page can present every policy as collapsed rows; unlike rows in Horizon's accordion block, an empty entry leaves no heading behind and each row is labelled by its translatable entry name. A `metaobject` setting stores the entry handle. `templates/page.warranty.json` (assigned to the `warranty` page) follows the page body with STIHL and ECHO / Shindaiwa groups, each a brand heading and a zero-gap run of closed Policy rows, one per active warranty entry; `templates/page.leaf-blower-chart.json` matches `page.json` so pages assigned to the suffix keep working. The contact form's phone pattern was removed, a fix for Horizon 4.4.0, and French form labels say "Courriel".

`npm run check:all` reports only the seven known Horizon warnings, and EN/FR keys match. Against `shopify theme dev`, French `/` and English `/en` were checked in Chromium and Firefox at 320/375/768/990/1440 px, 200% text, increased text spacing and forced colours. The new content causes no horizontal overflow and its resource links localize; G13 typing, paste and no-JS search and G14's rental results are unchanged. Footer accordions work by pointer, touch and keyboard; tab order is logical with visible focus; hCaptcha loads on first form interaction; and the three required phone formats validate without submitting. 1,024 product-information rows, including 14 policy rows, render identically before and after the shared snippet in both languages, and axe reports only the approved Gamma Red buttons and heading levels inside policy text. Against a `dev` baseline, script tags are unchanged and CLS stays at or below 0.01. Pending: a rendered check of the French theme text; theme-editor add/remove/reorder/save and policy selection; the consent-reopening link (the privacy banner isn't served through the proxy); valid contact and newsletter submissions; Safari/WebKit, NVDA and VoiceOver and real devices. Unchanged upstream behaviour: Horizon's menu block names its `nav` only when the heading is blank, footer utilities don't wrap at 200% text, the contact form's email error reference, fixed input IDs and placeholder-only visible labels, and sign-up messages that aren't scoped to one block.

#### Prototype reference

Relevant files are `templates/index.json`, `sections/footer-group.json`, `sections/header-group.json`, `templates/page.contact.json`, `templates/page.warranty-info.json`, `templates/page.json`, `templates/page.leaf-blower-chart.json` and `templates/password.json`. Warranty content referenced fixed policy handles; `assets/custom.css` supplied department-card styles. The leaf-blower file was a page wrapper, so actual comparison content may be merchant-authored outside the repository. English strings inside template settings still required merchant-content translation.

### G16 — Regular and holiday hours

**Priority:** P2. **Status:** Implemented. **Dependencies:** G02, G03, G15.

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

Local implementation (`feature/store-hours`): `snippets/gamma-store-hours-entry.liquid` is the only selection logic and outputs `source|handle|notes`; `blocks/gamma-store-hours.liquid` renders it, so every placement shows the same entry. Theme settings > Store hours holds the Regular hours and Override pickers (`metaobject_type: "store_hours"`); the theme settings select the existing `regular-hours` entry by default (it exists on Primary and Gamma-Dev); if it is missing or unusable, customers see the contact message. A usable entry is published, has Force off not `true` and has all seven days. The override applies regardless of dates and stops when cleared, set to Force off or Draft. An exception's window is `display_start` (inclusive) to `display_end` (exclusive), or 7 × 24 h without an end; an end without a start, a reversed window or an empty day is ignored with an editor note. Overlaps choose the shortest window, then the later start, then `system.handle` A–Z. A dated exception must show its enabled notice: without one the contact message replaces an undated holiday timetable, and a notice without a digit raises an editor warning to state the affected dates. Booleans are true only when `.value == true`; Sunday has no highlight field and isn't highlighted. The loop is unpaginated; if it returns 50 entries, exceptions can't all be checked and customers see the contact message (an override still applies), with an editor warning from 45. Draft entries are excluded from both the loop and `values_count`, so expired exceptions are archived by setting them to Draft. Selection uses render-time `'now'` and absolute instants, so it is language-independent and DST-safe; a loaded page keeps its schedule, and cached pages update when Shopify re-renders them. The block shows the notice above a captioned seven-row table (`th scope="row"`), marks highlighted days with bold Gamma Red, an inline bar and visually hidden "(changed hours)"/"(horaire modifié)" text, stacks day and hours below a 16rem container, and offers full/compact layouts; it is compact in the footer's `gamma_visit` and full in the contact page's `gamma_business_details`, leaving G17's map slots unchanged. No JavaScript is added.

Gamma-Dev's `store_hours` definition matches Primary (19 fields, public storefront read, publishable and translatable) and the shop timezone is America/New_York; no definition changed. `npm run check:all` reports only the seven known Horizon warnings and EN/FR keys match. Against `shopify theme dev -e dev` with temporary dev-store entries (since deleted), 27 fixed-instant cases passed: overlap and tie order, exact start/end seconds, the 7-day default, reversed and end-only windows, Force off true versus explicit false, draft entries, notice off/blank/undated, both 2027 DST changes and the live St-Jean/Canada Day boundary. With 51 published entries the selection fell back to the contact message; with 49 published and 32 drafts it evaluated normally. A real entry starting three minutes ahead switched the footer and contact page together on reload and reverted after its end. French `/` and English `/en` rendered translated day labels, entry translations, the notice and highlights identically in both placements; the fallback rendered in both languages. Chromium at 375 and 1440 px and 320 px at 200% zoom showed no overflow, with stacked rows when narrow. Pending: theme-editor settings, block add/remove/reorder and design-mode notes; screen readers; Firefox/Safari; Admin date-time picker authoring around DST; Primary configuration and bilingual holiday content, including dated notices for upcoming holidays.

#### Prototype reference

`blocks/hours-table.liquid` read `store_hours`, used `force_hours`/`default_hours` pickers, automatic exceptions and `regular-hours`, and defaulted missing ends to seven days. The first matching exception won; boolean field-drop checks were ambiguous and `highlight_sunday` was read although absent from the exported definition. Contact/footer templates supplied placements. Precedence and authored schedules are useful; typed access, overlap policy and date semantics require explicit design.

### G17 — Maps, directions and activation

**Priority:** P2. **Status:** Implemented. **Dependencies:** G02, G05, G15.

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

Local implementation (`feature/maps`): `blocks/gamma-map.liquid` renders `<gamma-map-component>` with the selected desktop/mobile image (art-directed `<picture>`, lazy outside the first two template sections), a linked `© OpenStreetMap` credit in the image corner with no setting to remove it, an optional address line and Google (`https://www.google.com/maps/dir/?api=1&destination=`) and Apple (`https://maps.apple.com/?daddr=`, which older devices understand and maps.apple.com redirects to its current directions page) links built from the `address` setting. When a map ID is set and scripting is on, the whole image is a button, marked by a white chip in its top-right corner (icon and “Show interactive map”, icon only in boxes narrower than 15rem); without an image, a text button takes its place. The active map has a 2rem white close button in the top-right corner, which uMap leaves empty outside edit mode, to turn maps off; a failure shows its message and Try again below the map, and the image or text button also retries. The credit link is a sibling of the image button, not inside it. Settings are the uMap map ID, address, show address/directions, the two images, desktop/mobile aspect ratios (image, 1:1, 4:3, 16:9), Horizon's width options for the map box and a maximum width of 120–480 px; the schema has no Gamma-specific defaults. The iframe sits in a `<template>` without a `src`, titled with the address, `referrerpolicy="no-referrer"`, `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"` and only `allow="fullscreen"`. `assets/gamma-map.js` validates the ID (`slug_number`) and language (`en`/`fr`) and builds the address with `URL` on the fixed origin `https://umap.openstreetmap.fr`. Its options leave only zoom and full screen: uMap 3.8 shows its “More controls” button whenever an optional control, such as Print, is left at its default, so `printControl=false` and the other controls are set explicitly and the ignored `moreControl` option isn't sent. uMap folds its tile credits under its own ? control only while the frame is at most 480 px wide, which is why the maximum width stops there; the theme's credit is hidden while the interactive map shows. Status and Try again use `display: contents` under `@media (scripting: enabled)`, so revealing them doesn't shift the page; the script hides the controls for an invalid ID and the theme editor explains why. Each attempt has a 20-second limit, fails at once when offline, is cancelled with its listeners and timer by turning maps off, retry or removal, and ignores late events; automatic loading waits while focus is in the map box, a focused credit stays until focus moves on, focus moves only when the focused control disappears (to Try again only after an attempt the visitor started), and the status region announces states the visitor started plus every failure. Map choices are stored in `localStorage` (`gamma-map:choice`) and applied by one module-level controller with a shared `IntersectionObserver` and single `visitorConsentCollected`, `pageshow` and `storage` listeners. The contact template adds `gamma_business_map` (a 55% column group, keeping the details column above the hours table's 16rem stacking width) after `gamma_business_details` in `gamma_business_row`, with a 4:3 map up to 480 px; the footer adds a square `gamma_map` up to 180 px after `gamma_hours` in `gamma_visit`. Both use map `carte-location-gamma-map_1369176`, address `5840 Rue Saint-Jacques, Montréal, QC H4A 2E9`, address hidden (the adjacent text block shows it), and `shopify://shop_images/carte-statique-grande.webp` with `-moyenne.webp` on mobile (contact) or `-petite.webp` throughout (footer), following the prototype's 400×300, 320×240 and 150×150 proportions. Those provisional screenshots, which show uMap's buttons, aren't in Gamma-Dev's Files, so its blocks render without a static image; clean replacements uploaded to Primary and Gamma-Dev are required before launch acceptance. `scripts/generate-map-previews.mjs` generates them (see the README): it reads the Map blocks of the theme named after the repository and branch (such as `gamma-theme/dev`), read-only, and saves a 3× lossless PNG of each uMap map, without controls, at each block's largest box size (Maximum width and aspect ratio) in `docs/map_previews/`. The block draws its image at that size, centred, so narrower boxes crop it as they crop the interactive map; previews compared with the live embed matched to within 1 CSS px at 480, 370, 343, 288, 180 and 129 px. OSM's standard tiles have no high-density version, so on 2× and 3× screens the previews, like the interactive map, show zoom-14 tiles enlarged, with the marker at full resolution.

`npm run check:all` reports only the seven known Horizon warnings; EN/FR keys match. Against `shopify theme dev -e dev` (Gamma-Dev, development theme `190121214188`; for the image cases the map image settings temporarily pointed at existing product photos), Chromium checks passed for: no-JS output with no third-party requests; no uMap or OpenStreetMap request before a click, an `on` choice or Shopify preferences permission; activation by clicking or tapping anywhere on the image, Enter and Space, with the credit link opening OpenStreetMap by click, tap or Enter without loading the map; focus moving to the close button on loading, to the image on turning off and to Try again on a failure the visitor started; automatic loading (remembered choice or permission) leaving focus where it is, including on the image button, the credit link and the other map's controls, with the image or text button, not Try again, receiving focus when an automatic failure removes the focused button; the text button without an image; automatic loading near the viewport with permission; withdrawal turning those maps off without storing a choice; granting permission later loading them; a click loading with permission declined, remembered across pages and reloads; turning off from either map turning off both, persisting and overriding a later grant; another tab following; the 20 s timeout, Try again, offline before and during loading and cancellation during loading; removal and re-insertion (no duplicate listeners or frames, timers cleared) and an invalid ID; attribute escaping with `&"<` in the address; the loaded map (HTTP 200, Gamma marker, OSM tiles) in French `/` and English `/en`, without Print or More controls and with its credits collapsed under ? at 370 and 343 px; Google and Apple links resolving the address; map sizes of 370×277 (contact, 768–1440 px), 180×180 (footer) and full width up to 480 px on mobile, with the hours table unchanged and no overflow at 320/375/600/768/1024/1440 px in both languages; axe with no violations; forced colours; and CLS at most 0.0005 with images. Firefox passed the opt-out, failure, cancellation and cross-tab checks, and activation by click, Enter and Space, turning off and persistence without a static image. Pending: theme-editor add/remove/reorder/save and settings changes (needs an admin session); Firefox navigation and Safari/WebKit (the installed browser builds don't match the cached Playwright); back/forward-cache restoration (headless Chromium reloaded instead); NVDA/VoiceOver; touch devices and real iOS/Android directions, including an iOS release before 18.4; and uploading and selecting the generated previews. uMap's ? control expands on hover only, not on keyboard focus. Without a static image, a map that loads automatically moves the content below it as its box appears. Where the footer column is narrower than 180 px (about 129 px at 1024 px), the map takes the column's width. At 160 px (320 px at 200%), the footer's existing groups are 16 px wider than the viewport with or without maps.

#### Prototype reference

`blocks/map-block.liquid` combined static images, dimensions, map ID, Google/Apple directions and a session cookie enabling/disabling all map instances. Footer/contact templates configured the block. The URL was double-escaped, frames lacked titles, fixed widths could overflow, loading had no deadline and a noscript iframe bypassed activation. The configurable static/directions foundation and remembered workflow are useful references; the defects are not requirements.

## Phase 6 — Promotions and integrations

### G18 — Campaign data model, lifecycle and theme contract

**Priority:** P2. **Status:** Implemented. **Dependencies:** G02, G03, G06, G10, G12, G14; definitions created by G22's setup step (or an authorized manual setup on Gamma-Dev).

#### Purpose

Give every promotional surface one dependable description of a campaign: its offers, who qualifies, what the customer receives and how they receive it. Real STIHL, ECHO and Shindaiwa campaigns combine promotional prices, discounts, dealer-supplied gifts, manufacturer claims and in-store offers, and rental or informational campaigns have no products at all. Content must be published Shopify data the theme can render without the G22 app, and its lifecycle must stop claims at the right moment.

#### Expected behaviour and functional requirements

- Model campaigns with four merchant-owned metaobject definitions: `promotion` (the campaign page), `promotion_offer` (one benefit, its redemption and terms), `promotion_group` (who qualifies and, for gifts, what they receive) and `rental_item` (a reusable card linking to the WordPress catalogue). Products are optional at every level, so rental and informational campaigns need none.
- Each offer states a benefit (promotional price, percentage or amount off, kit or bundle price, free gift, manufacturer rebate, financing, rental discount or rate, information), a redemption (price shown, automatic at checkout, discount code, supplied by Gamma, manufacturer fulfils, in store, contact us, no action) and its funding (manufacturer program, Location Gamma, shared). Only valid benefit/redemption pairs are allowed; a free gift is never an automatic checkout redemption.
- Eligibility always lives on groups: a qualifying collection, narrowed to listed variants when the group's explicit `variants_only` flag is set, with an optional minimum quantity per entitlement (for example two qualifying sets) and, when its explicit `requires_companion` flag is set, a companion set (for example "plus an AP battery"). Gift groups carry a translatable gift label, whether the gift model varies, optional reward product references, a gift quantity and an optional per-order limit, and record whether some conditions can only be confirmed by staff. A variant matching two groups of one offer is invalid, whatever their gifts. Missing or contradictory scope data suppresses the claim; translated labels never decide eligibility.
- Gift offers record whether the gift is guaranteed for every qualifying order (may be backordered) or limited to an advertised quantity, and whether it is currently backordered.
- Derive lifecycle at render time: unavailable (Draft, archived or deleted), invalid dates, ended, paused, scheduled and live. Start is inclusive and end exclusive, as absolute instants authored in the store time zone; the displayed end is the last valid day. The app owns retention and archival. Discount-dependent claims hide a margin (provisionally 1,800 seconds) before the end, and are held when the offer has no end. Ended campaign pages show an explicit ended notice without offers or calls to action and are noindex.
- Use native metaobject webpages at `/pages/promotions/{handle}` (French) and `/en/pages/promotions/{handle}` (English), with the `promotions` page as index.
- Find a product's live offers through its collections: each eligibility collection carries a `promotion.promotions` back-link, so the lookup never scans every campaign. A missing or invalid link, reference or collection produces no claim rather than a wrong one.
- Financial claims render only when the offer's `enforcement_verified_at` shows the Shopify resources behind them were verified (G21, G22). Gift claims follow G20's qualification rules.

#### Technical requirements and compatibility

Definitions are merchant-owned (no `$app:` prefix) so content survives an app uninstall, with public storefront read and translation enabled. `promotion` is publishable, renderable and online-store-capable with URL handle `promotions`. Key fields: `promotion` — `title`, `sponsor` (a reference to the shared `brand` metaobject), `business`, `summary`, `eyebrow`, `intro`, `image`, `starts_at`, `ends_at`, `paused`, `priority`, `offers` (max 12), `button`, `terms`, `source`; `promotion_offer` — `title`, `summary`, `label`, `details`, `terms`, `how_to`, `benefit`, `redemption`, `funding`, `code`, `action`, `image`, `starts_at`, `ends_at`, `claim_deadline`, `groups` (max 8), `gift_availability`, `gift_quantity_limit`, `gift_supply`, `enforcement_verified_at`, `map_reviewed_at`, `app_config` (the last two app-only, never read by the theme); `promotion_group` — `heading`, `note`, `description`, `collection`, `variants_only`, `variants` (max 50), `min_quantity`, `requires_companion`, `requires_collection`, `requires_quantity`, `requires_label`, `staff_confirmed_terms`, `reward_label`, `reward_varies`, `rewards` (max 3), `reward_quantity`, `reward_limit`, `rental_items` (max 24), `link`; `rental_item` — `title`, `url`, `image`, `note`, `catalogue_ref`. Collection metafields: `promotion.promotions` (max 5) and `seo.hidden` (provisional). A campaign also has at most 12 group references across all its offers; Shopify can't enforce a limit that spans entries, so G22 blocks saving above it and the lookups suppress such a campaign. Fixed choices are stored as untranslated `snake_case` values. The authoritative field table, with Shopify-enforced validations distinguished from app checks and Liquid safeguards, is section 6 of [the SCS proposal](scs-redesign-proposal-with-app.md).

Respect verified Liquid limits: 50 iterations per loop, 250 entries per paginated page, 1,000 entries per metaobject type per render and 20 handle lookups; `product.collections` excludes collections not on the Online Store. List validations keep every unpaginated loop complete; the index uses `paginate … by 250` and never re-fetches entries by handle. French images and URLs use translations of the same fields if Translate & Adapt and the API support them (proof of concept), otherwise explicit French fields. The theme never reads `app_config`; app-written fields mean the same when written by staff in the emergency fallback. The old `sales_campaigns` and `promo_offers` definitions (one expired, unverified entry each) are not migrated; the `promotions` URL handle is moved to `promotion` at cutover, the `promotions` page is assigned to `page.promotions`, and the old definitions are deleted once the new theme is live. Archiving sets a campaign to Draft and unpublishes its app-created collections; expired discounts are left in place.

#### Edge cases and quality

Cover draft, deleted and unpublished references; offers outside the campaign window; missing, reversed, start-only and end-only dates; exact boundaries and DST; open-ended campaigns; products in more than 45 collections; deleted variants silently removed from lists; ambiguous manufacturer lists; missing French; published counts approaching 250; scheduled campaigns under manufacturer embargo (no public content before start).

#### Acceptance criteria

- [ ] Definitions, validations, translation and storefront access match the contract on Gamma-Dev and Primary.
- [ ] Every lifecycle state and boundary produces the approved presentation in both languages.
- [ ] Every researched manufacturer offer, a rental campaign with cards and a product-free campaign can be expressed without workarounds.
- [ ] The lookup is bounded, fails closed on missing data and agrees with the discount targets.
- [ ] Native bilingual routes, index assignment and enumeration limits are verified.

Local implementation (`feature/scs-data-contract`): section 6 of the SCS proposal pins every key, type, reference target, required and conditional rule, default and stored choice, and marks each rule as Shopify-enforced, app-validated or a Liquid safeguard. Four internal snippets apply it, output only fixed codes, IDs, list positions and Unix seconds, take the optional `at` evaluation time used by `gamma-store-hours-entry` and aren't rendered on any customer-facing entry point. `snippets/gamma-promotion-state.liquid` outputs `state|start|end|notes`, checking a missing or wrong-type entry, unreadable or empty/reversed dates, ended, paused, scheduled and live in that order; blank dates are unbounded and unreadable ones fail closed. `snippets/gamma-promotion-offer.liquid` outputs `state|claim|start|end|hide_at|notes`: the offer window intersected with the campaign's (clamping reported), the claim class from the supported benefit/redemption pair (`financing` reserved), the code and limited-quantity requirements, and the financial gate (verification at or before the evaluation time and not before the effective start, a finite end, hidden 1,800 provisional seconds before it). `snippets/gamma-promotion-lookup.liquid` outputs `status|notes|records` for a product and its selected variant through `product.collections` and each collection's `promotion.promotions`, matching a group only through its own collection's back-link, evaluating each offer under every live campaign that references it and checking all of its relevant groups there before emitting it, keeping an offer's first record when several campaigns match it, and returning IDs, positions, claim, `hide_at`, end, priority and independent quantity, companion and staff conditions ordered by priority, effective end, authored offer position and then IDs; its private `snippets/gamma-promotion-group.liquid` helper enforces the group scope and gift rules and reads variant-list lengths through `count`. The 5-campaign, 12-offer and 8-group list ceilings, 50 product collections, and a per-call budget of 30 campaign references, 8 campaigns, 50 offer references (so the final sort stays within Shopify's 50-iteration loop limit) and 200 group references suppress the whole lookup rather than risk an incomplete result or Shopify's 1,000-entry-per-type render limit; each list reserves its ceiling before loading and counts its actual length after, including the list that triggers suppression.

Static checks only so far: `npm run check:all` reports the seven known Horizon warnings plus one `OrphanedSnippet` warning for each new snippet, which is expected while G19/G20 haven't connected them; `git diff --check dev...HEAD` passes. The fixture matrix was desk-checked against the snippet rules. Nothing has been rendered by Shopify. Pending Gamma-Dev proofs, each separately authorized: read-only preflight (A0); then, with the four definitions, disposable `g18-proof-*` entries and collections, a temporary route such as `promotions-g18` and an uncommitted scratch preview, French `/` and English `/en` routes and language switching, `system.url`, list visibility and positions of blank and Draft references, variant-list `count` on a populated list and on one emptied by deleting its variants, whether reading a list's length loads its entries (with a control that iterates the same references), the 50/51 offer-reference budget boundary, whether an unpublished companion collection still resolves, hidden collections in `product.collections`, Draft public response and editor preview, translated artwork and links, cache delay at real boundaries, and baseline/candidate median server time on a product and a 10-line cart against the 10% budget. The real `promotions` page and legacy handles stay out of that round. Raising the list ceilings to 16 offers and 12 groups was a separate proof target; it was dropped on 2026-11-10, after S1, because a campaign is now limited to 12 groups across its offers, and the 12-offer and 8-group ceilings stand. The route, list-visibility, Draft, translation and 12/8 results from the G19 prerequisite round are recorded under G19, and the lookup and cart results under S1 below.

Canonical index and route migration (decided 2026-11-09): `/pages/promotions` and `/en/pages/promotions` are the canonical promotions index, campaign pages belong at `/pages/promotions/{handle}`, and the Gamma-Dev proof handle `promotions-g18` is retired. A read-only check that day found no dependency on either handle in the theme: the index section renders on whichever page uses the `page.promotions` template; campaign cards, the collection callout and the campaign page's index link all derive from `system.url`; G18's lookup returns IDs only, so G20's links will come from `system.url` too; and the `noindex` rule reads the campaign's state. On Gamma-Dev, the `promotion` definition's URL handle is `promotions-g18`, with redirect creation available; the legacy `sales_campaigns` and `promo_offers` definitions no longer exist; a `promotions` page and the `promotions-g18` page both use the `page.promotions` template and list the same nine campaigns; every campaign link, and each campaign page's index link, therefore leads under `/pages/promotions-g18`; the "Promotions" menu items are Page links to the `promotions` page, rendered as `/pages/promotions` in French and `/en/pages/promotions` in English (the Admin API reports only the primary-language URL); and no URL redirect mentions either handle. A child path that matches no entry returns its parent page with status 200 and a canonical URL of the requested path, so `/pages/promotions/{handle}` returns the index today, and old paths have to be redirected rather than left to fall through.

Migration on Gamma-Dev, each step separately authorized: (1) change the `promotion` definition's URL handle to `promotions` with Shopify's automatic redirects for published entries, confirming that the handle is accepted beside the existing `promotions` page; (2) delete the `promotions-g18` page and add a redirect from `/pages/promotions-g18` to `/pages/promotions`, because while that page exists an old campaign URL is expected to keep returning it with status 200 instead of redirecting; (3) confirm in French and English that campaign cards, callouts and campaign pages link under `/pages/promotions/`, and that each old `/pages/promotions-g18/{handle}` URL redirects once to its new URL; (4) check that Draft and unknown handles still return the index, that `noindex` and the titles of non-live campaigns are unchanged, and that menu links and language alternates use the canonical paths. Shopify redirects only the entries published when the handle changes; later entries never had an old URL. The same order applies at the production cutover, where the legacy definitions still hold the handle (SCS proposal, section 20). G22's setup creates or adopts the definition with the `promotions` handle and doesn't change it afterwards. State on 2026-11-10 (shop 81927143660): step 1 is applied. The `promotion` definition's URL handle is `promotions`, the index renders at `/pages/promotions` and `/en/pages/promotions`, and the nine campaigns render at `/pages/promotions/{handle}` in both languages, with cards and callouts linking there. Shopify created the campaign redirects under `/en/pages/promotions-g18/{handle}` only, so old English campaign URLs redirect once and old French ones return 404; the `promotions-g18` page was already deleted, and `/pages/promotions-g18` returns 404 because the CLI session lacked the `write_online_store_navigation` scope to add its redirect. Later that day (S1), with that scope granted, redirects were added from `/pages/promotions-g18` to `/pages/promotions` and from each French `/pages/promotions-g18/{handle}` to `/pages/promotions/{handle}`; a redirect on the French path also redirects the same path under `/en` once, so at the production cutover redirects on the French paths cover both languages. Step 4 passed in both languages: unknown handles and a Draft campaign's URL return the index with status 200; paused and scheduled campaigns are `noindex` with the neutral title, an ended campaign is `noindex` with its own title, and live campaigns have neither; the index, menu links and `hreflang` alternates use `/pages/promotions` and `/en/pages/promotions`. The migration is complete on Gamma-Dev.

S1 results (Gamma-Dev, 2026-11-10, shop 81927143660; disposable `g18-proof-*` entries, collections, products and two disposable definitions, an unpublished scratch theme with uncommitted probe templates, all deleted afterwards). P-B, rendering: the lookup's 50/51 offer-reference boundary holds (50 references give `ok` with 50 records, the 51st reference suppresses with `budget_offers`), and a product whose links pass 30 suppresses with `budget_links`. A collection with `seo.hidden` set appears in `product.collections`. Deleting a listed variant removes it from the stored variant list, so `count` falls (2 to 1); deleting the last one blanks the field, and the group data reports `invalid` with `variants_empty`. Reading a list's `size` or `count` doesn't load its entries: one render read 1,160 references to 1,010 unique entries of one type without error, while the control that iterated them (in `paginate … by 250`, because a `for` over a list returns only its first 50 entries and `offset` can't pass them) returned the list that crossed 1,000 unique entries as empty, silently, with no Liquid error. G20 therefore can't rely on an error to detect the per-type limit: a list whose `size` is positive but which iterates nothing must suppress. On variant change Horizon morphs only the picker; a block re-rendered in the section response and swapped by a `shopify:product:select` listener (as G08 does) showed the new variant's records in French and English, both ways. Cost, measured with `shopify theme profile` (8 runs per case, medians; Server-Timing was unusable because some preview responses came from cache): on a product with one linked campaign and two offers the lookup took 9.4 ms in French and 10.1 ms in English, 6.1–6.2% of the page's Liquid render, within the 10% target; at the current per-call ceiling (30 links, 5 campaigns, 50 offers, 150 group checks, 50 records) it took 62–68 ms and made the page 35–39% slower. On a real 10-line cart with eight lines linked to one campaign, the per-line lookup raised the median cart render from 89 to 112 ms (6 samples each), about 26%, over the 10% target; ten lines at the per-call ceiling took 478 ms. The 10% targets therefore hold only for small link sets: G20 needs a much smaller per-render aggregate budget for the cart, reuse of each campaign's state and offer results across lines and products in one render, or relaxed targets, decided before T5. Raising the ceilings to 16 offers and 12 groups was not tested, since the current ceilings already exceed the targets; the 12-offer and 8-group ceilings stand. P-D, caching: an Admin metaobject change (pausing a campaign, setting one to Draft) reached every cached campaign page and the index within 30 seconds; time boundaries invalidate nothing, and with no Admin change campaign pages kept their pre-boundary state for 21–24 minutes after an end or start, and cache entries lived at least 33–35 minutes. Without JavaScript, or for crawlers, a financial claim can therefore stay up to about 35 minutes past its `hide_at`, more than the provisional 1,800-second margin; a page served from cache also renders `now` from when it was cached. The theme's expiry guard must hide claims in the browser at `hide_at`, and the app should write a trivial change at each campaign and offer boundary so that Shopify invalidates cached pages, after which the margin only has to cover that write and propagation; the margin itself is decided with G22. Gamma-Dev is password-protected, so the production cache may differ. P-TR passed in the G19 round (API and Translate & Adapt translations of file, URL and link fields, and choice fields offered for translation). P-PRE failed (Plan A): the theme editor can't preview Draft campaigns, so Plan B goes to G22. The storefront rate-limited the testing IP (HTTP 429 and a verification page) after a few hundred requests, for 10–25 minutes, and the cart API more strictly; future rendered sessions should pace requests.

#### Prototype reference

`docs/metaobjects/sales_campaigns.definition.json`, `docs/metaobjects/promo_offers.definition.json`, SCS lifecycle/ended-window/URL helpers and `templates/page.promotions.json` establish the contract. The prototype used an inclusive end boundary and detail grace of `end + (end - start)`. Grouped and ungrouped product membership differed; the exported campaign definition required a collection. `banner_priority` was unused. These are important decisions to evaluate explicitly, not reasons to copy every rendering assumption.

### G19 — Campaign pages and index

**Priority:** P2. **Status:** Implemented (campaign pages and visual refinement Stages 1–5 implemented and rendered on Gamma-Dev; the wording, legal and manufacturer reviews are open). **Dependencies:** G10, G12, G14, G18.

#### Purpose

Give customers a place to browse promotions and understand offers whose conditions cannot be explained by a price badge alone. A manufacturer campaign can contain several offers with different products, gifts and redemption routes; each needs its own explanation, qualifying equipment and terms, while rental and informational campaigns need equally clear pages without products.

#### Expected behaviour and functional requirements

- Provide a promotions index of live campaigns grouped by business (equipment sales, rentals), ordered by priority, then end date (open-ended last), then title, with an empty state. Optional "Coming soon" and "Recently ended" groups stay off by default.
- Provide campaign pages with a link back to the index, a hero (sponsor badge, eyebrow, title, artwork in the current language, dates, number of offers, summary, introduction, a primary link to the offers on desktop only, and the merchant's button and the official manufacturer link as secondary actions), an offer overview that summarises and links to each offer when there are two or more, offer sections, campaign terms and a closing link to all promotions.
- Each offer section shows its label, title and summary, its artwork and details, a facts list of its conditions, a notice matching its redemption mode, inline terms, and each qualifying group as a labelled grid of native product cards, variant-limited cards or rental cards. Collection-based groups show a bounded number of products and a link to the native collection page; a rental group with no displayable item is omitted; and when a later offer reuses a group already shown, its cards are rendered again in full.
- Collection-based groups use the theme's standard product card on the collection grid, with its native images, titles, prices, availability and sale badges and Quick Add. Variant-limited groups use the same card: when only some of a product's variants qualify, the card shows the first of them (its image, price, availability and link, and Quick Add for that variant), with its name beneath and links to the other qualifying variants. No card shows an offer tag, struck price or percentage unless Shopify's own price shows it; in-store and code offers state that displayed prices are current prices.
- Rental groups use the rental-search card: the item's image in a 4:5 white box, its name, and a link to its rental-catalogue page that says so. Rental cards show no prices or rates. Rental groups are separated by a hairline rule, not panels.
- Sponsor badges sit over the artwork on index cards and in the hero, once per card or hero, and move to the text area only when there is no artwork.
- A free-gift offer prominently names the gift and the qualifying equipment, states the conditions and exclusions, explains that no gift needs to be added to the cart and that Location Gamma supplies it with the order, and includes the backorder statement (G20 wording). It never implies the gift is added at checkout.
- Financial offers show native prices on cards and the approved redemption wording ("Applied automatically at checkout", "Use code … at checkout"); their claims render only after G21/G22 verification. Manufacturer-redeemed offers show the claim link and deadline; in-store offers show store contact and hours links.
- Provide a collection-page callout for live promotions linked through the collection's `promotion.promotions`.
- Provide meaningful scheduled, paused, ended and unavailable views with an h1 and appropriate indexing.

#### Appearance and placement

Follow the visual design language. Present the index as a card grid (four, three, two and one columns) beneath its title and optional introduction, with a counted heading for each business group. Each card has a 3:2 media tile showing its artwork whole, with the sponsor badge over the tile's top-left corner, then its title, a three-line summary, its end date and an arrow. A card without artwork shows a neutral Concrete tile from 750 px up, with no Brand tint or pattern and the badge in its usual corner, so rows stay even, and a slim band below 750 px. The first campaign in the index's existing order is a two-column feature card; there is no separate "featured" field.

On campaign pages, the hero is a Concrete panel with the text beside a white tile that holds the artwork uncropped, so manufacturer artwork with text stays readable; on phones the artwork comes first, and without artwork the badge sits above the eyebrow. The campaign title is 56 px, and 36 px on phones. From 750 px up, the hero's red primary button ("Voir les offres" / "See the offers") leads to the offers; on phones it is hidden and the offer overview follows the hero directly. The overview appears from two offers and lists each offer with an icon, its label and its title. Each offer is a headed section (h2 at the offer-title size) with a neutral label chip, its summary and facts on one side and its redemption or gift notice on the other at larger widths, stacked on phones. Its qualifying groups follow (h3). From 1200 px, a group with five or more cards has a label rail (count, heading, note and "see all" link) beside its grid; a group with one to four cards, and every group below 1200 px, stacks those above a grid identical to collection pages. Rental groups follow the same heading and rail rules and are separated by a hairline rule (12% Coal), without panels. Gift and redemption notices use the shared notice shell and name the gift once, with its image when one is referenced. Offer and campaign terms are fully visible fine print under label-size headings, as HTML text, never only inside artwork. Scheduled, paused, ended, unavailable and empty views are neutral notices with a button to the index; an ended campaign's claim deadline is its first, bold line. The collection callout is one compact notice with a line per campaign.

The sponsor badge sits over the artwork, top-left and fully inside it: 12 px inset on index cards, 16 px in the hero and 12 px on phones. There is one badge per card or hero, never a second one in the text. Over artwork it keeps its Brand colour and its black or white text chosen by contrast, and gains a 2 px Paper keyline and a soft shadow so it separates from any image. A Brand without a colour shows on an opaque Paper plate with Coal text over artwork and keeps its outline when inline. The badge uses the theme's badge radius (14 px) and padding (4 by 10 px) at 13 px bold, may use the card's width less the insets, wraps to two lines instead of truncating and isn't interactive. A missing or Draft Brand renders nothing.

#### Technical requirements and compatibility

Use one generic metaobject template and native product cards configured once in the theme editor; no campaign-specific templates and no campaign content in theme JSON. Sponsors are entries of the shared, merchant-owned `brand` metaobject referenced by `promotion.sponsor` (section 6 of the SCS proposal); the theme takes the badge's name and colour from the entry and contains no Brand IDs, handles, names or colours. Derive campaign and offer states and claims with G18's `gamma-promotion-state` and `gamma-promotion-offer`, link campaigns through `system.url` and the index through its page, and hide time-limited claims on loaded campaign pages at the offer's `hide_at`. The index reads campaign-level fields only and never resolves every campaign's offers and groups. Rental cards accept a URL only on the current language's configured HTTPS rental address, independently of the rental-search toggle. After a campaign or offer's purchase window ends, manufacturer-redeemed offers with a future `claim_deadline` keep only their redemption instructions and HTTPS claim link, for eligible past purchases, until that deadline (the post-sale rule in section 6 of the SCS proposal, adopted 2026-11-09). Scope IDs by section and offer. Rental cards reuse G14 presentation and URL validation. Promotion-only eligibility collections are published to the Online Store and hidden with `seo.hidden`; the all-collections list skips them (a small Gamma change to Horizon's collection list, reported as such). Manufacturer pages contain only that campaign's products.

#### Edge cases and quality

Cover no campaigns, offers with no products, empty or deleted collections, overlapping offers, a product in several offers, ambiguous manufacturer items, missing artwork or French artwork, long French headings and terms, 60-card pages, and unavailable or ended campaigns reached from old links. Liquid cannot set arbitrary HTTP statuses.

#### Acceptance criteria

- [ ] Index, campaign pages, offer sections, gift panels, redemption panels and rental cards render correctly in both languages for the STIHL, ECHO, rental and informational fixtures.
- [ ] Gift panels state the gift, conditions and backorder statement without implying cart or checkout insertion.
- [ ] Financial claims appear only when verified; native prices match Shopify.
- [ ] Native cards, Quick Add, no-JS links and theme-editor settings work; IDs are unique.
- [ ] Ended, scheduled, paused and unavailable views, accessibility, long French copy and responsive layouts pass rendered review.
- [ ] Qualifying products use native cards on the collection grid, two per row below 750 px; groups of one to four cards match collection pages exactly, and groups of five or more use the label rail from 1200 px; a card limited to listed variants is the native card showing the first qualifying variant, whose Quick Add adds that variant, with the variant named beneath it; a reused group shows its cards in full; no card implies an unapplied discount.
- [ ] Rental cards match the rental-search card without prices and link to the rental catalogue in both languages; rental groups are separated by hairline rules, without panels.
- [ ] Sponsor badges overlay campaign artwork once per card or hero at the specified insets, with the keyline and shadow, unchanged Brand colours and text contrast, and the Paper plate for Brands without a colour; long French names wrap at 320 px; cards without artwork show the neutral tile or slim band, and a hero without artwork shows the badge inline; a missing or Draft Brand shows nothing.
- [ ] Heading roles (campaign title 36 px on phones), the offer overview from two offers, the red hero button from 750 px up only, offer facts and notices, fine print, the feature card and quiet states follow the visual design language in French and English at 320, 390, 768 and 1440 px.

Local implementation (`feature/scs-campaign-pages`): `templates/metaobject/promotion.json` renders `sections/gamma-promotion.liquid` with one evaluation time per render. Live campaigns show the hero (eyebrow, title, uncropped artwork, dates (without times) in the store time zone, the end shown as the last valid day, summary, introduction, HTTPS button and official source), offer navigation from three shown offers (each link hides with its offer, and an emptied navigation disappears), and an h2 section per offer whose G18 claim isn't `none`; a gift offer also needs a valid product group. Redemption panels (`gamma-promotion-offer-panel`) cover price shown, automatic, code, gift (G08-style panel with a gift icon, the "How you receive your gift" text, backorder and limited-quantity statements), manufacturer claim (steps, deadline, HTTPS link) and in-store/contact offers. Groups are checked with `gamma-promotion-group-data`, the product-free data check now shared with the lookup's `gamma-promotion-group` (whose output is unchanged); invalid groups are skipped. Collection-wide groups show native `_product-card` cards (Quick Add from the theme setting) and a "See all" link to the collection; variant-limited groups show `gamma-promotion-variant-card` only for products still in the qualifying collection, linked to the first eligible variant with its image and price, listing the eligible variants and without Quick Add (which would add the default variant); rental groups show cards only for addresses that pass `gamma-promotion-rental-url` (the rental site checks of `gamma-rental-url`, whatever the rental-search toggle, and no French addresses on English pages). A page-wide counter stops cards at 60, then lists the remaining items as links. Scheduled, paused, invalid and ended pages show an h1 and notice without offers, and `snippets/meta-tags.liquid` (a reported Gamma change in a Horizon file) adds `noindex` to every promotion page that isn't live, and gives scheduled, paused and invalid campaigns a neutral title, description and social preview without their image. Ended pages, and live pages for offers whose own window has ended, show `gamma-promotion-redemption`: the post-sale claim view of section 6 of the SCS proposal, with its purchase window validated apart from the live gate. `templates/page.promotions.json` renders `sections/gamma-promotion-index.liquid`, which reads campaign-level fields from one `paginate … by 250` block, sorts each business group as a whole by priority, end (open-ended last), title and handle, and prints every card; sponsor badges come from `snippets/gamma-brand-badge.liquid` (see the Brand note below); `assets/gamma-promotion-pager.js` shows 24 per page with numbered buttons and a hash for each page, and without JavaScript every campaign stays listed. More than 250 published campaigns fall back to Shopify's pagination with a theme-editor warning. `sections/gamma-promotion-callout.liquid`, placed before the products on the six collection templates, lists a collection's live linked campaigns (at most 5). Horizon's `main-collection-list` skips collections with `seo.hidden` = 1 (a reported Gamma change; Horizon's 20-collection limit still counts them). `assets/gamma-hide-at.js` hides offers, claims, index cards and callout items at their `data-gamma-hide-at` instant on loaded pages.

Gamma-Dev prerequisite round (2026-11-09, store `gamma-dev-2318`, shop 81927143660, new unpublished theme 190240948460 with uncommitted probes; MAIN, the development theme, the real `promotions` page and legacy handles untouched): the four definitions and the collection back-link were created at 12 offers and 8 groups, and Shopify rejected 13 offers and 9 groups. The index page `promotions-g18` and the campaign routes `/pages/promotions-g18/{handle}` coexist in French at `/` and English at `/en`; `system.url` carries `/en`; the language selector switches between the two routes of the same campaign. Draft and deleted offers and Draft rental items are omitted from lists (no blank placeholders, later entries move up). Shopify rejects a list that references the same entry twice; campaign pages still show a repeated offer once. A Draft campaign's URL returns 200 with the parent index page and no Draft content, on both the proof theme and MAIN. An unpublished companion collection reads as blank (the group is invalid); a collection with `seo.hidden` still resolves on campaign pages. API translations of file, URL and link fields render per language, and Shopify also offers choice fields for translation. A split string iterated all 60 items, but lists are still printed in runs of 50.

Brand badges (`feature/scs-sponsor-brands`): `promotion.sponsor` changed from fixed choices to a required reference to the shared `brand` metaobject, which Shopify Admin owns (entries, translations, colours and the battery-system, warranty and return-policy references). `snippets/gamma-brand-badge.liquid` renders the Brand's translated `name` on index cards, in the live campaign hero (before the eyebrow) and on each collection callout item. Its fill is the active theme's `settings.color_palette.brand` when `use_theme_brand_color` is true, otherwise `badge_color`, otherwise none (a neutral outline in the text colour); filled badges get black or white text, whichever contrasts more, which is at least 4.5:1 for any colour. A missing, Draft or wrong-type reference renders no badge and leaves the campaign unchanged; `logo` is reserved and not displayed. The index section's ten per-sponsor colour settings and the `gamma_promotion.sponsors` and badge-label locale keys were removed. Theme Check reports the seven known Horizon warnings and the two pending G20 `OrphanedSnippet` warnings; JavaScript checking and `git diff --check` pass. Rendered on Gamma-Dev (2026-11-09, `shopify theme dev` on development theme 190121214188; the four SCS definitions, the collection metafield, nine production and three proof Brands, six `g19-proof-*` campaigns, the `promotions-g18` index page and a callout collection, all set up in Admin outside this repository, matched the contract in a read-only check): in French at `/` and English at `/en`, the index cards, campaign heroes and collection callout showed the light (STIHL, black text, 7.61:1), dark (Shindaiwa, white, 6.44:1), theme-red (Location Gamma, `#ee2622` from the theme, black, 4.94:1) and uncoloured outlined badges; the translated Brand name changed with the language; a campaign referencing a Draft Brand rendered its card and hero without a badge; no Liquid errors, no horizontal overflow at 320, 375, 768 or 1440 px, keyboard order, the card focus outline, Enter and click navigation, callout links and `hreflang` alternates worked. Not covered: other colour schemes, screen readers, browsers other than Chromium, and the theme editor.

Rendered G19 checks on that theme: both languages; 60 cards exactly on the 12-offer, 8-group campaign; the verified financial offer with a blank offer end inherits the campaign end and hides 1,800 s before it, while an unverified one and a genuinely open-ended one stay hidden; scheduled, paused, invalid and ended views and `noindex`; the claim view with an open deadline (with and without a start date) and none after the deadline; index order identical to the expected order across 57 sales campaigns (boundaries 24/25, 48/49, 50/51), pages 1–3, hash links and focus; keyboard focus and outline on index cards; Quick Add from a campaign card; the loaded-page guard hiding only the financial offer after its `hide_at`; the collection callout; the collection-list filter; no horizontal overflow at 320 px; and rich text in introductions, terms and claim steps; and the old and new group helpers giving identical output in 216 combinations. Translate & Adapt saved the French title, summary, image, source URL and button on the informational fixture, and both languages rendered as expected. In the theme editor, the merchant reported that the Draft campaign URL showed the parent index, so the editor can't preview Draft campaigns (P-PRE Plan A fails); the proposal's Plan B, an Active and paused campaign rendered in full only in the theme editor, is not implemented yet and is to be settled with G22. Still open: legal review of gift wording (Q12), manufacturer confirmations (Q13), and the cache delay at real boundaries (P-D).

Design review (2026-11-09, revision `4d34b54`; live Gamma-Dev theme 190287544556, verified identical to that revision; three `g19v-*` test campaigns with six offers, six groups and four rental items, set up in Admin outside this repository): every offer and card rendered once the fixtures were complete, and before that the theme showed no cards and hid the gift and code offers, as intended. The review found a 768 px text column on a 1,360 px page; offer titles at 48 px beside a 56 px page title and louder headings on terms than on offers; campaign product cards 182 px wide in seven columns and one per row on phones, against 259 px in five columns and two per row on collection pages; variant-limited cards without the image tile or the theme's availability badges; letterboxed rental cards; a hero 670 px tall for about 280 px of text; and uneven index rows when cards with and without artwork mix. Six rendering defects are corrected in Stage 1 (numbers are the review's screenshots): (1) the gift icon sits on its own row above the notice text (201, offer 1); (2) single-variant products show "Default Title" in the eligible-variant line (201, offer 1; 204); (3) the limited-quantity wording has no singular form (201, offer 1); (4) the gift is named twice, followed by a stray reward line (201, offer 1); (5) the variant-limited card has no backorder badge and shows sold-out as plain text (201; 214, offer 2; against the native cards in 231); and (6) a rental group with no valid card still shows its heading and note (221). Not rendered: the offer navigation, code and automatic wording, the claim panel and the lifecycle views.

Visual refinement (approved 2026-11-09; Stages 1–3 share the branch `feature/scs-refinement-foundations-artwork`, each stage reviewable as its own commits in stage order and passing its own checks, and Stages 4 and 5 keep one reviewable branch each; every stage is checked in French and English at 320, 390, 768 and 1440 px, plus 1024 px for grids, on a theme verified against its commit). No stage changes eligibility, lifecycle, verification, claim or rental-address behaviour, and Chris reviews all new French and English wording. G20 follows as its own feature.


Product cards (decided by Chris, 2026-11-11; replaces Stage 2's variant-card parity): every product in an offer group renders through Horizon's product card, the one collection grids use, so it follows the card's settings and Horizon updates; the campaign template's card has the same blocks as the collection template's, swatches included. Horizon can't be told which variant to show outside product pages, search and filtered collections, and a static block accepts one `closest` argument and passes no other parameter to its child blocks. So the campaign section passes the offer group as the card's closest `promotion_group` and the product as a parameter, and `snippets/gamma-card-variant.liquid` gives the card's parts the first listed variant of a product whose variants don't all qualify. Reported Gamma changes to Horizon files, each marked in place and inert without that context: `blocks/_product-card.liquid` (the product parameter), `snippets/product-card.liquid` (link, transition image, Quick Add visibility), `blocks/_product-card-gallery.liquid` and `snippets/card-gallery.liquid` (image, link, sold-out, sale and availability badges), `blocks/product-title.liquid` (link), `blocks/price.liquid` and `snippets/price.liquid` (price), `snippets/quick-add.liquid` (adds that variant directly, without the dialog that offers the others) and `blocks/swatches.liquid` (no swatches on such a card). Under the card, the section names the variant shown and links the other qualifying variants ("Aussi : …" / "Also: …", wording awaiting review, Q16); `snippets/gamma-promotion-variant-card.liquid` is deleted. Rendered on Gamma-Dev (2026-11-11, development theme 190121214188, shop 81927143660): collection, search and product pages are byte-identical to the previous revision; the Graphite drill card shows 150,00 $, "Épuisé", the Graphite image and the variant's link; the two A38 groups show 299,00 $ and 309,00 $ for the 14 and 16 in variants, and Quick Add carries each one's variant; products whose variants all qualify are unchanged. The "Also" line was rendered only through a temporary local change, since no fixture lists two of a product's three variants.

- **Stage 0, fixtures (Gamma-Dev only; production is out of scope; applied in a separate session).** French translations of the rental items' addresses; `promotion.promotions` back-links on `stihl-as-system` and `gamma-dev-platform-b18`; a three-offer campaign with 16:9 artwork containing text in French and English, a hero button and a source link; an ended campaign with an open claim deadline; a scheduled campaign and a paused campaign; and a French title for the GTA 40 set. The French "Promotions" menu link was also approved for correction, but a rendered check on 2026-11-09 found that it already leads to `/pages/promotions` on French pages and `/en/pages/promotions` on English pages (G18), so it needs no change. State on 2026-11-10 (read-only check): the French title of the GTA 40 set is in place; the four rental items still have no French address, so French rental groups are empty (and, since Stage 1, omitted); `stihl-as-system` and `gamma-dev-platform-b18` have no `promotion.promotions` back-link; and the store holds only the six `g19-proof-*` and three `g19v-*` campaigns, all Active and live, with six offers, six groups, four rental items and twelve Brands, so the three-offer, ended, scheduled and paused fixtures are still missing. The GTA 26 set that showed a backorder badge in the design review now has stock and shows none, on native and variant-limited cards alike. Applied later on 2026-11-10 through the Admin API, as reported by the session that made the changes and not yet checked by rendering: the four rental items have French addresses; `s2-fixture-active-tool-days` (three offers, a hero button, a source link and 16:9 artwork for each language), `s2-fixture-ended-claim`, `s2-fixture-scheduled-preview` and `s2-fixture-paused-preview` are Active, with six `s2-fixture-offer-*` offers and three `s2-fixture-*` groups; `stihl-as-system` links back to `g19-proof-light` and `gamma-dev-platform-b18` to `g19-proof-gamma`, and both also to `s2-fixture-active-tool-days`. The text inside the artwork is unverified. Rendered with Stage 4 on 2026-11-10: the French rental addresses, the three-offer campaign with its button, source link and artwork for each language, the scheduled and paused campaigns and both back-links render as described. The artwork's own top-left text sits under the sponsor badge. `s2-fixture-ended-claim` renders as ended and `noindex` but shows no claim view, because its offer has no `action` link (and no `how_to`), which the claim view requires. Added on 2026-11-11 through the Admin API (shop 81927143660) for the checks that still lacked data, and rendered as described the same day: an HTTPS claim link and claim steps on `s2-fixture-offer-ended-claim`; a back-link from `stihl-as-system` to `g19v-stihl-battery-bonus`, the store's first gift campaign with one; `t5-fixture-gift-kinds` (four dealer gifts: earned alone, by quantity with a gift model that varies, with a companion purchase, and with both under staff confirmation and a limited quantity) and `t5-fixture-offer-kinds` (price shown, automatic, code, a manufacturer rebate that starts a day after its campaign, contact, information, a manufacturer-sent gift, and a rebate whose purchase period has ended while its claim stays open), each offer limited to listed variants of `gamma-dev-cutting-systems`, which links back to both, with French translations of their titles, summaries and labels; and `t6-fixture-invalid-window`, whose end precedes its start.
- **Stage 1, foundations and defects.** Scope: scoped tokens; heading roles; the lede and 16 px summaries; fine print; one notice shell; the six rendering defects. Checks: the campaign title is 56 px at 1440 px and 36 px at 390 and 320 px, offer titles 32/26, group headings 24/20, terms headings in the label role; "TEST — Journées du détaillant Gamma" takes at most three lines at 320 px; the gift icon sits beside its heading in Gamma Red; no "Default Title"; singular wording at a limit of 1; the gift is named once; the variant-limited card shows the theme's backorder and sold-out badges; an empty rental group is omitted; the heading order is unchanged.
- **Stage 2, cards and grids.** Scope: the collection grid (250 px minimum, 16 and 24 px gaps, two columns below 750 px); the label rail from 1200 px for groups of five or more cards, with smaller groups and every group below 1200 px stacked above the grid; the shared rental card (`snippets/gamma-rental-card.liquid`, sharing class names and media rules with rental search rather than code paths); rental groups separated by hairline rules; reused groups rendered in full; the current-price line. Checks: cards in groups of one to four measure the same as collection cards (259 px in five columns at 1440 px), cards in rail groups are within 4 px of them, and every grid has two columns at 390 and 320 px; Quick Add from a native card works as on a collection page; rental cards show a 4:5 white box without grey bars or prices, two per row on phones, with the whole card focusable and announced with the catalogue and new-tab notice; Sanding and Cleaning are separated by a hairline, without panels, and Cleaning appears in full under both offers; French rental cards appear once Stage 0 is applied; no card shows a discount that Shopify's price doesn't show; the dealer campaign is under 3,800 px tall at 390 px.
- **Stage 3, artwork and badges.** Scope: the badge over artwork at its insets, with keyline, shadow and Paper plate; the hero panel and artwork tile; index card media, the neutral Concrete tile from 750 px and slim band below it, the end-only date and the two-column feature card. Checks: one badge per card or hero, never also in the text; text contrast unchanged (STIHL black, Shindaiwa white, Location Gamma black) and the keyline visible on the STIHL artwork; a Brand without a colour shows the plate over artwork and the outline inline; "G19 Démonstration — Marque française" wraps to two lines at 320 px inside its card; a Draft Brand shows nothing; index rows are even at 1440 and 768 px; the tile for missing artwork has no tint or pattern; the feature card is the first campaign in the existing order; hero artwork is uncropped, comes before the title at 390 and 320 px and isn't lazy-loaded; a click anywhere on an index card, including its badge, opens the campaign.
- **Stage 4, offer anatomy and navigation.** Scope: the label chip and icon; the facts list; store and gift notices with the reward image; the offer overview from two offers; the red hero button from 750 px up only; the back and closing links. Checks: every campaign with two or more offers shows the overview, each row jumps to its offer and focus follows; the red button is present at 1440 and 768 px as the only red primary in view, and absent at 390 and 320 px, where the overview follows the hero directly; each offer shows its chip and how to get it; in-store offers show the current-price line; the gift notice names the reward once with its image; touch targets are at least 44 px high on phones.
- **Stage 5, states and callout.** Scope: the ended and claim view, scheduled, paused, invalid and empty-index views, and the compact callout. Checks: an ended campaign shows a neutral notice with the claim deadline as its first bold line, no prices or cards, and stays `noindex`; scheduled and paused campaigns show a neutral notice with a button to the index; the empty index shows a notice and a button; the callout has one line per campaign with an underlined link and is under 110 px tall at 390 px with one campaign.

Stage 1 implementation (`feature/scs-refinement-foundations`): `snippets/gamma-tokens.liquid` holds the scoped `--gamma-*` tokens and the type-role classes (`gamma-type-display`, `-page`, `-section`, `-group`, `-label`, `-lede`, `-reading` and `gamma-fine-print`). Its output is the setting-backed declarations (Gamma Red and the card, media and badge radii) for the `style` attribute of an element with the `gamma-tokens` class; colour tokens are declared on that element, not on `:root`, so they follow its colour scheme. From 750 px the roles follow the theme's heading presets (the campaign title uses Horizon's fluid H1, 48 px at 768 px and 56 px from 1000 px); the phone sizes (36, 26 and 20 px) are fixed. The label role uses the H6 preset (Inter Bold 12 px), because the theme loads Inter at 400 and 700 only, and the panel colour is the 5% foreground tint already used by G08 and G11. `snippets/gamma-notice.liquid` is the notice shell and its `line` variant, with G08's geometry; the six offer panels render through it, and only the gift panel has an icon until Stage 4. Shopify loads `{% stylesheet %}` CSS only for files in a page's render tree, so each consumer renders the tokens snippet, and G08's script-managed panel can adopt the shell only once G25 moves the CSS to `assets/gamma-branding.css`. Defects: the eligible-variant line shows only for products with more than one variant; `gamma_promotion.gift.limited` has singular and plural forms; the gift is named once by `reward_label`, and a referenced reward adds only a linked thumbnail (a reward without an image adds nothing until Stage 4); the variant-limited card shows the theme's sold-out badge or the backorder or special-order badge of its linked variant, placed over the image after the link (a bottom badge setting falls back to the top until Stage 2, and the outlined badge style is a local copy for G25 to merge); and a rental group with no displayable item is omitted with its heading. The lifecycle notice and the collection callout keep their red edge until Stage 5. No Horizon file changed. Theme Check reports the same nine warnings. Rendered on Gamma-Dev (2026-11-10, `shopify theme dev` on development theme 190121214188, shop 81927143660) in French and English at 320, 390, 768 and 1440 px on the three `g19v-*` campaigns and the index: every Stage 1 check passed, with the heading order unchanged, no horizontal overflow, no Liquid errors and visible keyboard focus on the reward, variant-card and contact links. Not covered: the code, automatic and manufacturer panels, the claim and lifecycle views (no fixture), screen readers and browsers other than Chromium.

Stages 2 and 3 implementation (`feature/scs-refinement-foundations-artwork`, after a token follow-up to Stage 1). Stage 2: qualifying groups use the collection grid (two columns below 750 px with a 12 px gap, as collection pages have on phones, then `auto-fill` of 250 px cards with 24 and 16 px gaps; the values copy the collection template's settings, which a section can't read). Campaign grids stay inside the page margin on phones, where collection pages run edge to edge (decided 2026-11-10), so phone cards are narrower than collection cards and only the two-column check applies there. Each group's cards are resolved before its markup, and all of an offer's groups before its introduction; a group has a label block (a count in the label role, the heading, conditions, note and links, with "see all" now before the cards) and, with five or more cards, sits that block in a 264 px rail from 1200 px. The conditions list and reward thumbnails stay in the label block until Stage 4. Variant-limited groups first used a Gamma copy of the native card, replaced on 2026-11-11 (see the product-card decision below). `snippets/gamma-rental-card.liquid` renders rental items (4:5 white box, name, a visible "view in the rental catalogue" line and one link over the card whose name adds the new-tab notice); `gamma-rental-search.js` adds the shared `gamma-rental-card__media`, `__image` and `__title` class names to the cards it builds, and the three rules moved from the search stylesheet to `gamma-rental-card-styles` (a change to G14's shared component, to review before and after in the search dialog). Adjacent rental groups are separated by a hairline. In-store and code offers add the current-price line only when the offer shows product cards. Stage 3: `gamma-brand-badge` has the theme's badge radius and 4 by 10 px padding everywhere (including the collection callout) and an `overlay` placement with the Paper keyline, shadow and plate; the hero is a Concrete panel whose white tile follows the artwork's shape between 4:3 and 16:9, comes first below 990 px (the review's 768 px mock-up stacks it) and loads eagerly; index cards have the 3:2 tile, the plain Concrete tile or slim band without artwork (the band is omitted when there is no badge either), a three-line summary and the last day ("Jusqu’au …" / "Through …", without "inclusivement") with an arrow, or "See the promotion" when there is no end; the index grid has one, two, three and four columns (750, 990 and 1200 px); the first card of the first live group is the feature card from 750 px, so a full page of 24 ends one cell short; and each group heading shows its count in quiet text above a rule. Card hover underlines the title instead of turning the call to action red. New wording, proposed and awaiting review (Q16): the eligible-variant line (singular and plural), the product and rental counts, the rental-catalogue line, the two current-price lines, the index count and the index card's last-day line. No Horizon file changed. Theme Check reports the same nine warnings, JavaScript checking and whitespace checks pass, and the French and English `gamma_promotion` keys match. Rendered on Gamma-Dev (2026-11-10, `shopify theme dev` on development theme 190121214188, shop 81927143660) in French and English at 320, 390, 768, 1024 and 1440 px on the three `g19v-*` campaigns, two proof campaigns, the index, a collection and the callout collection, with no Liquid errors and no horizontal overflow, including at 200% zoom. Stage 2: cards in groups of one to four measure 259.2 px in five columns at 1440 px, as on the collection page, and rail-group cards 256 px in four columns; at 1024 and 768 px both match the collection (304 and 336 px); every grid has two columns at 390 and 320 px (173 and 138 px inside the page margin, against 189 and 154 px edge to edge on collections); the dealer campaign is 3,649 px tall at 390 px; variant-limited cards match the native card's image, badge inset and price preset, link to the eligible variant, show "Épuisé" on the Graphite card with "Variante admissible : Graphite" and the backorder badge on the GTA 40 set, and have no Quick Add; Quick Add from a native campaign card added to the cart as it does on the collection page; rental cards show a 4:5 white box with the image contained, two per row on phones, one focusable link named with the catalogue and new-tab notice, and no price; Sanding and Cleaning are separated by a hairline and Cleaning appears in full under both offers; the current-price line shows on in-store offers with product cards and not on the rental offers; the search dialog's rental results keep their white 4:5 box and unclamped titles under the shared class names. Stage 3: one badge per card or hero, overlaid at 12 px on cards and phones and 16 px in the hero, with unchanged text colours (STIHL black, Shindaiwa white, Location Gamma black), the keyline and shadow, the plate for the Brands without a colour on tiles and bands and the outline inline in a hero without artwork; the long French Brand name wraps to two lines inside its card at 320 px; the Draft Brand shows nothing; index rows are even at 1440 and 768 px; the hero artwork is contained, comes before the title at 768, 390 and 320 px and loads eagerly with high priority; keyboard focus is visible on index cards, variant cards and rental cards. Not covered: French rental cards and artwork that contains text (Stage 0), the plate over real artwork (no such fixture), the code-offer price line (no verified code offer), screen readers, browsers other than Chromium and the theme editor.

Stage 4 implementation (`feature/scs-refinement-offers`). A live page opens with a back link to the index and closes with a secondary "all promotions" button. `snippets/gamma-promotion-hero.liquid` now holds the hero: its meta line shows the dates and, from two offers, the number of offers; the red button ("Voir les offres" / "See the offers") leads to the overview, or to the only offer, and is displayed from 750 px only; the merchant's button is a secondary button and the official source stays a text link. The offers that may make a claim are resolved once, before the hero, and each adds a row to the offer overview, which replaces the text navigation and shows from two offers: a bordered row per offer with an icon, the offer's label and its title, at least 72 px tall, hidden with its offer at `hide_at` (the count in the hero hides with the first of them). The overview and each offer section take focus when a row or the button leads to them, so keyboard focus follows the jump. Each offer has a label chip (the offer's own label with an icon chosen from its stored `benefit` by `snippets/gamma-promotion-icon.liquid`: gift, price tag or information; no chip without a label), its title, summary and details, and a facts list (`dl`) beside the redemption notice from 990 px and above it below that. The facts are the offer's own period when its start or end differs from the campaign's, a backordered gift's statement and a limited quantity, which leave the gift notice, and the group's conditions. An offer's only group gives its gift to the offer's notice (`snippets/gamma-promotion-gift.liquid`: the linked image of each published reward, then the label once, with its quantity above one) and its conditions to the offer's facts (`snippets/gamma-promotion-group-facts.liquid`); an offer with several groups names each gift and its conditions beside that group. Every notice has an icon: the in-store notice has a store icon (`assets/icon-gamma-store.svg`), a lead-in and a secondary contact button, and a `contact_us` offer gets its own lead-in and sentence instead of the in-store ones. A minimum quantity on an offer that isn't a gift no longer says "for each gift". The notice shell printed no space between a lead-in and a message on the same line (no earlier caller passed both), which is corrected. No Horizon file changed; no eligibility, lifecycle, verification, claim or rental-address rule changed. New and changed wording, proposed and awaiting review (Q16): the back and closing links, the offers button, the offer count, the overview heading, the six facts labels, the in-store and contact lead-ins and sentences, and the quantity condition for offers other than gifts. Theme Check reports the same nine warnings; JavaScript checking and whitespace checks pass, and the French and English `gamma_promotion` keys match. Rendered on Gamma-Dev (2026-11-10, `shopify theme dev` on development theme 190121214188, shop 81927143660) in French and English at 320, 390, 768 and 1440 px on the three `g19v-*` campaigns and `s2-fixture-active-tool-days`, with no Liquid errors and no horizontal overflow, including at 200% zoom: every campaign with two or three offers shows the overview, in three, two and one columns; a row or the button scrolls its target under the header and moves focus to it, and the next Tab enters that offer; the red button is the only red button in view at 1440 and 768 px and absent at 390 and 320 px, where the overview follows the hero; every offer shows its chip with an icon and a notice with an icon; in-store offers with product cards show the current-price line; the gift notice names the reward once with its image, and the facts list carries its backorder, limited-quantity and staff-confirmed statements; the back link, overview rows, buttons, reward image and "see all" links are at least 44 px tall at 390 and 320 px; keyboard focus is visible on each of them; overview rows, the count and then the whole overview disappear as their offers pass `hide_at`. The several-groups layout was rendered only through a temporary local change, since no fixture has such an offer. Horizon sets `scroll-behavior: smooth` unconditionally (an upstream behaviour, reported); a rule in this section's stylesheet turns it off on campaign pages under a reduced-motion preference, where the jumps were then immediate at 1440 and 390 px, and it changes no Horizon file. Rendered on 2026-11-11 with the last branch of the stack, on the fixtures added that day (Stage 0), in French and English at 320, 390, 768 and 1440 px and at 200% zoom, with no Liquid errors or horizontal overflow: the price-shown, automatic, code, manufacturer, contact and information offers each show their chip and cards and, except the information offer, their notice (the code offer with its code and the current-prices line); the rebate that starts a day after its campaign shows its own period as a fact; and the gift offers show their quantity, companion, staff-confirmed, limited-quantity and gift-model facts. Not covered: an offer with its own artwork (no fixture), screen readers, browsers other than Chromium and the theme editor.

Stage 5 implementation (`feature/scs-refinement-states`). The ended, scheduled, paused, invalid and unavailable views show their h1, a neutral notice in the shared shell with an information icon in place of the red-edged line, and a secondary button to the index; scheduled, paused and invalid campaigns keep their one neutral wording, so nothing about an embargoed campaign is disclosed. `gamma-promotion-redemption` renders a claim as a notice under the offer's title whose first, bold line is the deadline, followed by the purchases it covers, the manufacturer's steps and the claim form as a secondary button; on an ended page the claims come between the ended notice and the button. The empty index shows a notice and a "continue shopping" button to the catalogue (Horizon's existing string). The collection callout is one compact notice (`aside` labelled "Promotions en cours" / "Current promotions") with a price-tag icon, that lead-in and one flowing line per campaign: the sponsor badge, the underlined title and the last day in quiet text; the summary and the start date are gone, and the whole notice now disappears when its last campaign passes its end on a loaded page. No rule about states, claims, `noindex` or which campaigns a callout lists changed, and no wording was added (the callout's date reuses the index card's last-day line). Theme Check reports the same nine warnings; JavaScript checking and whitespace checks pass. Rendered on Gamma-Dev (2026-11-10, `shopify theme dev` on development theme 190121214188, shop 81927143660) in French and English at 320, 390, 768 and 1440 px, with no Liquid errors and no horizontal overflow, including at 200% zoom: `s2-fixture-ended-claim` shows its title, the ended notice with its dates and the button, no cards, offers or prices, and stays `noindex`; `s2-fixture-scheduled-preview` and `s2-fixture-paused-preview` show the neutral heading, notice and button, `noindex`; the button spans the width at 390 and 320 px and shows keyboard focus; the callout is 82 px tall at 390 px with one undated campaign (`g19-proof-collection-callout`), a dated campaign's line takes two lines there (105 px for a callout of one, measured through a temporary local change that left only the dated campaign), and with two campaigns it has one line each from 768 px; its links are underlined and show keyboard focus, and its lines, then the notice, disappear at their ends. The empty index was rendered only through a temporary local change, since the store always has live campaigns. Rendered from store data on 2026-11-11 with the last branch of the stack, once the fixtures had a claim link, claim steps and an invalid campaign (Stage 0), in French and English at the four widths and at 200% zoom, with no Liquid errors or overflow: `s2-fixture-ended-claim` shows the ended notice, then the claims heading and its claim (the deadline as the first bold line, the purchase period, the steps and the claim form as a secondary button that opens in a new tab and shows keyboard focus), then the index button, and stays `noindex`; a live campaign shows the same claim after its offers for an offer whose own period has ended (`t5-fixture-offer-kinds`); and `t6-fixture-invalid-window` shows the neutral heading, notice and button, `noindex`. A claim disappears at its deadline on a loaded page; its heading used to stay behind with nothing under it, so a rule in the section's stylesheet now hides the claims section once every claim in it is hidden. Dates (2026-11-11): `gamma-promotion-dates` writes the first of a month as "1er" in French, through a locale string, because Shopify's French date format gives "1 octobre"; and a period or a purchase period of a single day is stated as that day ("Le 9 novembre 2026 seulement", "effectués le 9 novembre 2026"), not as a range between two identical dates. New wording awaiting review (Q16): `dates.on`, `dates.first_day` and `post_sale.on`. Not covered: screen readers, browsers other than Chromium and the theme editor.

#### Prototype reference

`sections/scs-sales-index.liquid`, `sections/scs-sales-campaign.liquid`, campaign-card/richtext snippets and campaign templates implemented these surfaces. Grouped mode rendered offer products before a paginated collection remainder; pagination was conditional on nonempty remainder output. Index sorting reloaded objects by handle, and the visible CTA text was not itself linked. The offer presentation is useful, while membership, limits, links and pagination require a complete current design.

### G20 — Product and cart promotional notices

**Priority:** P2. **Status:** Implemented (rendered on Gamma-Dev from store fixtures; the wording, the legal review and the performance targets and worst-case limit are open). **Dependencies:** G07, G08, G09, G11, G18; G19 for the offer-conditions pages the notices link to and for the notice shell and wording roles of its visual refinement (stages 1 and 4).

#### Purpose

Explain a relevant offer while the customer is deciding whether to buy, and again beside the qualifying item in the cart, even when they arrive directly from search or an external link. Dealer-supplied gifts are not visible in the cart or checkout, so the notices must say what the purchase earns and lead to the offer's conditions — and must never claim a gift is earned when the cart does not prove it.

#### Expected behaviour and functional requirements

- A notice says only what a customer needs at a glance and links to the offer's conditions on its campaign page, which state everything that applies to every gift (decided by Chris, 2026-11-11; this replaces the earlier requirement that every gift notice carry the supply, backorder-delay and contact statements).
- On product pages, show live offers that apply to the displayed product and selected variant (up to a configurable number, default two), each with its last day and a link to the offer's conditions.
- A gift notice has a short lead label from the theme ("Free item:" / « Cadeau : »), the gift and its quantity, and its state: earned, conditional on a stated quantity or companion purchase, or to be confirmed by staff ("Free item, to be confirmed:" / « Cadeau à confirmer : »). A gift that is currently backordered adds a short marker ("(backordered)" / « (en rupture) »). It doesn't repeat the supplier, the general backorder delay, the limited quantity, the gift model or the campaign's title, all of which are on the campaign page. Never use "while supplies last".
- Other notices lead with the offer's title, followed only by how the offer is received when that takes an action or happens elsewhere (automatic at checkout, a code, a manufacturer claim, in store, contact) and by a quantity or companion condition.
- Under each qualifying cart line, show the gift notice when the whole cart satisfies the group's conditions: entitlements are the qualifying units divided by the minimum quantity, limited by the companion units when a companion set exists, multiplied by the gift quantity and capped by the per-order limit. Multi-line conditions show the full notice under the first participating line and a short "counts toward" note under the others. Until the cart proves the gift, the notice states the condition.
- Recommended wording (subject to legal review, Q12, which now also has to confirm that the stated quantity of a limited gift and the possible delay may be left to the conditions page): "Free item: {gift}" / « Cadeau : {gift} »; "Free item: {gift}, with 2 eligible items" / « Cadeau : {gift}, à l’achat de 2 articles admissibles »; "Free item, to be confirmed: {gift} (backordered)" / « Cadeau à confirmer : {gift} (en rupture) ».
- Nothing is added to the cart, no line properties or attributes are written and no financial discount is implied for a gift.

#### Appearance and placement

Follow the visual design language. Place the product-page block in the product header after the battery-system row and before the option picker, as a compact notice in the shared shell: an icon for the kind of offer in Gamma Red, a bold first line naming the benefit, then the end date and a link to the offer's conditions on one line of 12 px text, visibly smaller than the notice's 14 px text. The notices carry no sponsor badge, chip, struck price or percentage, stay quieter than the G08 availability notice and never move the purchase controls; text-only output must look intentional and long French copy must reflow. In the cart, render the gift notice as the inline line variant inside the line's details immediately after the G08 availability line, with a gift icon, so it is visibly associated with that line, its conditions link following the text at 12 px, underlined; other participating lines show the short "counts toward" note without an icon. It adds no cart-wide summary message and never sits beside G11's ship-together notice.

#### Technical requirements and compatibility

Resolve product-page offers through G18's bounded collection lookup (`gamma-promotion-lookup`); resolve its records by position, confirm their IDs and apply the product notice limit after resolution. The cart shares one lookup across its lines (approved 2026-11-10): a first pass gathers the distinct campaigns linked from every line's collections, in line order, and evaluates each campaign, offer and group once; a second pass matches every line against those results, counts entitlements and renders notices. A cart render loads at most 8 campaigns, each with at most 12 group references across its offers, so a render stays far below Shopify's 1,000 unique entries per metaobject type. A line linked to a campaign past the eighth, or to a campaign above 12 groups, shows no claim, while every other line still renders. Count a line in both the qualifying and companion sets toward the qualifying set only. Shopify silently empties a list that crosses the per-type limit, so a list whose size is positive but which iterates nothing suppresses the claims that depend on it. The cart notice is Liquid inside the native cart sections, rendered from `snippets/cart-products.liquid` after `gamma-availability-line`, so it re-renders with every quantity change, removal, Quick Add and drawer or page update and works without JavaScript; no second cart-state owner, client controller or Horizon JavaScript change is added. The product block re-renders through G07's native variant updates. A small known-expiry script hides time-limited notices on cached pages; Shopify's next render is authoritative. The wording must stay consistent with G11's ship-together notice (orders with delayed items ship together once everything has arrived). Order notes, discounts, totals, accelerated checkout and checkout handoff are unchanged. Proposed performance targets: the product-page lookup adds at most 10% to the page's median server render time, and cart notices add at most 10% to the render of a 10-line cart. S1 measured both (recorded under G18): a typical product page meets its target, while a 10-line cart that repeated the lookup for each of its eight linked lines took about 26% longer, which led to the shared cart lookup. Estimated from those measurements, a typical cart with one or two campaigns should meet the 10% target, but a cart at the 8-campaign, 12-group limit would load about 200 entries and render roughly 60–70% slower; T5 measures both, and that worst case needs its own limit, still to be decided. No storefront path calls the app or the VPS.

#### Edge cases and quality

Cover a product alone versus incomplete multi-product conditions, quantity changes across the threshold, several qualifying lines, a product in two offers, ECHO tier kits as variants, ambiguous kits, variable rewards, gifts marked backordered, expired or paused offers on loaded pages, carts with more than 50 lines, mixed qualifying and ordinary lines, and backordered qualifying products alongside G11's notice.

#### Acceptance criteria

- [ ] Product and cart notices match actual eligibility for every fixture, including incomplete and staff-confirmed cases, in both languages.
- [ ] No notice implies that a gift is in the cart or applied at checkout, and none contradicts G11's notices.
- [ ] Notices update with variant, quantity and line changes in the drawer, page and Quick Add, and render without JavaScript.
- [ ] Placement, accessibility, mobile layouts and long French copy pass rendered review; lookup cost stays within the agreed budget.
- [ ] Notices use the shared notice shell and inline line, show end dates without times and no sponsor badge, and pass review in French and English at 320, 390, 768 and 1440 px beside the G08 and G11 notices.

Local implementation (`feature/scs-promotion-notices`). Product page: the `gamma-promotion-notices` theme block (in `templates/product.json` after the battery-system row; setting: one to three notices, default two) renders `snippets/gamma-promotion-product-notices.liquid`, which calls `gamma-promotion-lookup`, reaches each record's entries by position (a reference list has no index access in Liquid, so each is reached by a one-step loop), confirms the four IDs and applies the limit after that. Each notice is the shared shell with the benefit's icon, a bold first line, the redemption sentence and one small line with the last day and a link to the offer's conditions; it has no badge, price or percentage and hides at the record's `hide_at`. To stay quieter than the G08 notice, the block sets its notices at the small text size with less padding, a smaller icon and tighter rows than the shell's default (the theme's paragraph size is currently that same 14 px, so today the difference is the padding, icon and spacing). Financial, in-store, contact, manufacturer and information offers lead with the offer's title; a quantity, companion or staff condition adds its sentence. Gifts use `snippets/gamma-promotion-gift-notice.liquid`, shared with the cart: the label, the gift and its quantity, the quantity or companion condition when the group has one (a product page can't know the cart), the "to be confirmed" label for staff-confirmed conditions and the backorder marker. The block's element is always present and takes no space when empty; `assets/gamma-promotion-notices.js` swaps its notices from the section response on Horizon's product-select event, hiding the previous variant's claim while the new one loads, and without JavaScript the page shows the notices of the variant in its address. Campaign pages gain a stable `#offer-{id}` anchor in each offer for these links, because a notice can't know the campaign section's ID; its scroll margin adds the offer's padding and rule, so a link stops with the offer's top rule just below the header, as an overview row does.

Cart: `snippets/cart-products.liquid` (a reported Gamma change in a Horizon snippet that Gamma already changes) renders `snippets/gamma-promotion-cart.liquid` once before its lines and prints each line's notices after `gamma-availability-line`, so they re-render with every native cart update and without JavaScript; no cart state, line property, attribute or Horizon JavaScript is added. The first pass walks at most 50 lines, reads each product's collections once, records every (campaign, collection) back-link and evaluates each of the first 8 distinct campaigns once with `snippets/gamma-promotion-cart-campaign.liquid`, which gives records only for a live campaign with at most 12 offers and 12 group references whose lists all iterate. The second pass matches lines to group records (through the group's own back-linked collection and its variant list), counts qualifying and companion units across the whole cart, and derives entitlements as specified, with a line in both sets counted as qualifying. The first qualifying line of a group gets the full notice as the shell's inline line with the gift icon; other qualifying and companion lines get "Compte pour l’offre de cadeau : …" without an icon. A line in an invalid group's collection, or eligible for two groups of one offer, gets no claim from that offer, as on product pages, and an offer shared by two campaigns belongs to the first of them that one of its groups' collections links back to; a cart of more than 50 lines gets no notices. `gamma-promotion-lookup` now also drops a campaign above 12 group references and suppresses when a list with a positive size iterates nothing. `assets/gamma-hide-at.js` is loaded with the cart and the product block and re-checks when notices arrive with a variant or cart update.

New wording, proposed and awaiting review (Q16; gift wording also Q12): the 11 `gamma_promotion.notice` strings, rewritten on 2026-11-11 for the shorter notices. Theme Check reports the seven known Horizon warnings (the two `OrphanedSnippet` warnings are gone); JavaScript checking and whitespace checks pass. Rendered on Gamma-Dev (2026-11-10, `shopify theme dev` on development theme 190121214188, shop 81927143660) in French and English at 320, 390, 768 and 1440 px, with no Liquid errors or horizontal overflow, including at 200% zoom: products of `gamma-dev-platform-b18` show the two in-store offers of `s2-fixture-active-tool-days` (the second with its two-item condition) and products of `stihl-as-system` its STIHL offer, after the battery row and before the divider and picker, above the G08 notice; a variant change on the two-variant drill hides, then restores the notices for the new variant; the conditions link shows keyboard focus and opens the campaign page at that offer (offer top at 106 px under a 105 px header at 1440 px, and at 60 px under 59 px at 390 px); real carts of five and ten lines without a gift offer render with no notices. Before the fixtures of 2026-11-11 no gift notice could render from store data, so the cart's wordings and counting were first checked through temporary local changes with synthetic records, among them a copy of a gift's records under an unlinked campaign, placed first, which didn't stop the notice. Rendered from store data on 2026-11-11 with those fixtures (G19, Stage 0), in French and English at the four widths and at 200% zoom, with no Liquid errors or overflow. Product pages: a gift earned alone, by quantity (with the gift-model statement), with a companion and with both under staff confirmation and a limited quantity; the staff-confirmed, backordered, limited gift of `g19v-stihl-battery-bonus`, whose French notice is the longest at 223 px tall at 1440 px and 262 px at 390 px; the price-shown, automatic, code, manufacturer, contact and information offers; nothing for an offer whose own period has ended; the best two of a product's three offers; and a variant change on a two-variant saw swaps a gift and a discount notice for the other variant's conditional gift, which the address alone also gives without JavaScript. Cart: the staff-confirmed, backordered, limited notice under the first listed set, the short note under the second and nothing under the unlisted battery; an earned gift capped by its limit per order (three saws, two gifts); the quantity, companion and combined conditional wordings, which become the earned or "may qualify" wording once the cart meets them; the short note twice under a battery that completes two offers (one companion unit counts toward every offer that requires it, a business rule to confirm); a quantity change across the threshold and a removal follow through native updates on the page, as do an add from a product page and a removal in the drawer; the open drawer shows the notices unclipped at 1440, 390 and 320 px; and a cart of 50 lines shows its notices while one of 51 shows none. Horizon's cart removes the underline from links in a line's details, so the conditions link in a cart notice looked like plain text; the shell's line variant now sets the underline itself, and the link shows keyboard focus. Shorter notices and text sizes (2026-11-11): the last day and the conditions link weren't smaller than a notice's text, because the paragraph size and `--font-size--sm` are both 14 px and because Horizon's `.cart-items__details *` rule gave every element in a cart line's details one size, which a nested element couldn't undercut. That rule in `snippets/cart-products.liquid` now sets the size on the details cell, to be inherited (a reported Gamma fix to Horizon 4.4.0 behaviour, marked in place, to review at each Horizon update); the only other element it affects is the compliance-disclosure tooltip beside a line's title, whose 1em box follows the title's 16 px, which no fixture could render. Rendered from store data in French and English: every element of a line's details still computes to 14 px, the title to 16 px, and the link to 12 px, underlined, on the cart page and in the drawer; product notices show 14 px text over a 12 px line. Lines at 390 px: the staff-confirmed, backordered gift of `g19v-stihl-battery-bonus` takes two lines of text in the product block (83 px tall, from 262 px) and in the drawer, and three (French) or four (English) on the cart page, whose details column is 178 px wide; an earned gift takes two lines on the cart page, and gifts conditional on a quantity or a companion take three to six there, because the companion label is the merchant's. The two-line target is therefore met in the product block for gifts without a combined condition and in the drawer, and not on the phone cart page; moving cart notices to a full-width row would need a further change to Horizon's cart markup, which wasn't authorized. Performance (targets unchanged, criterion open). Product pages, median of seven profiles: with three linked campaigns and five offers (the GTA 26 set) the lookup takes 14.4 ms and the whole block 19.1 ms, 9.7% and 13.3% over the page without them; with two campaigns of twelve offers and twelve variant-limited groups (the A38) they take 37.6 ms and 43.6 ms, 25% and 30% (on 2026-11-10 a product with two campaigns and three offers gave 10.1 ms and 15.0 ms, the block 9.9% over the page without it). Cart section server render, median of 14 samples on 10-line carts: 68.5 ms with no linked campaign, 86 ms with one gift campaign of four offers (26% more) and 99 to 105.5 ms with a second campaign of eight other offers (45% to 54% more); the earlier cart of three campaigns with three offers and no gift took about 9% more. At the limit, with eight measurement campaigns of twelve gift offers and one variant-limited group each (200 entries): 58 ms unlinked, 98 ms with one such campaign, 193 to 201 ms with four, 310.5 ms with all eight when no line qualifies and 338 ms when every group gives a notice (96 notices, against 59 ms unlinked), about five to six times the unlinked render where 60–70% more was estimated; groups listing 20 variants in place of one changed the four-campaign figure little (206 ms). The cost follows the number of offers and groups, at roughly 2 to 3 ms for each pair. Performance stage (2026-11-12, `feature/scs-performance`, on the corrected stack; each change proven by byte-identical HTML on 31 fixture pages and the fixture carts in both languages, and by identical raw lookup records for seven products): line-level profiles put the cost in Shopify itself, not in the theme's logic. Resolving a variant-limited group's list of variants takes about 1 ms the first time anything reads it, whether that is an emptiness test, `count` or `map` (11.8 ms of the 33.8 ms the cart spends on a campaign of twelve such groups, and 10.5 of the 13 ms of group checks on the A38's product page); the rules need that list, so it can't be avoided without changing them. Seven changes were written and measured. Kept: the cart passes over a non-gift offer before evaluating it (about 1 ms less for a campaign of eight such offers, 6.0 to 4.4–5.3 ms in profiles; below the noise of cart timings). Measured and dropped for no gain: reading the variant and reward lists once and only when set, evaluating each campaign-page offer once (about 1.5 ms on a 124 ms section), rendering the lookup's group helper only for groups whose collection holds the product, skipping unlinked collections in the lookup's second pass, skipping cart records whose collection no line is in while indexing line data once (345 and 348 ms at the limit: matching lines to records is not where the time goes, contrary to the earlier estimate of 50 ms), and rendering the notice tokens once per cart (341 against 352.5 ms, within noise). Figures on the corrected stack, medians of seven profiles: product page with three campaigns and five offers 163.5 ms, the lookup 15.4 ms and the block 19.9 ms; with two campaigns of twelve offers 170.3, 33.5 and 38.4 ms; campaign pages 160.6 to 216.8 ms, of which the section is 71.6 to 123.9 ms, mostly Horizon's product cards; ended and invalid views 119.4 and 100.2 ms; the index 139.1 ms (section 27.5 ms); a collection with a callout 332.5 ms (callout 18.2 ms). Cart section, medians of 14 samples on 10-line carts: 64 ms with no campaign, 85 ms (93 ms in a second run) with the two fixture campaigns, 65.5 ms for the drawer, and at the 8-campaign limit 345 ms when every group gives a notice and 303.5 ms when none does. Client side, nothing was found that changes neither markup nor behaviour; campaign cards fetch images about 2.8 times wider than they are shown at 1440 px (1.1 on collection pages), because Horizon's card sizes images from section settings the campaign section doesn't have, and Horizon loads every card image eagerly: both are left for a decision. So one gift campaign of four groups already exceeds the proposed 10% cart target, and a product page reaches its target at about five offers; the targets and the worst-case limit both need a decision. The measurement entries (`t5-worst-c1` to `t5-worst-c8`, with 96 offers and 96 groups) stay on Gamma-Dev with their campaigns in Draft and no back-link. Not covered: screen readers, browsers other than Chromium and the theme editor.

#### Prototype reference

`blocks/scs-product-sale-banner.liquid` called `snippets/scs-banner-content.liquid`. It scanned collection/offer membership and chose the earliest finite end; an initial sentinel prevented open-ended-only campaigns from winning. Winner selection preceded usable-copy checks, and image selection was partly coupled to offer description. Existing copy/media/CTA fallbacks explain the intended feature; these defects need independent correction. The prototype had no cart notices.

### G21 — Financial promotions and dealer-gift operations

**Priority:** P2; required before enabling financial or gift claims. **Status:** Planned. **Dependencies:** G11, G18, G20, G22; approved commercial and legal rules.

#### Purpose

Keep every promotional promise true. Shopify must actually apply the prices and discounts the storefront advertises, and staff must reliably supply the gifts it promises, without turning the campaign app into an order or fulfillment system.

#### Expected behaviour and functional requirements

- Support Shopify-native financial promotions on Grow: promotional prices (price and compare-at), percentage and fixed-amount automatic discounts, discount codes (a code per language on one discount), product, variant and collection targets, minimums, per-order caps, native schedules and combination settings, and native kit or bundle prices where appropriate. No Functions, Plus-only stacking or custom checkout behavior. Buy X Get Y is not used for gifts.
- Configure each financial offer once in G22; the app creates and verifies the Shopify resources. A claim appears only after read-back verification (`enforcement_verified_at`); a staff checkout-summary check (stopping before payment) follows within one business day of each activation.
- Order operations so that the benefit exists before it is promised and the claim is hidden before enforcement is removed. Manufacturer-funded benefits never run outside the manufacturer's window.
- Detect conflicts before publication: two product discounts on one product (only the best applies on Grow), unowned discounts on the same products, overlapping price plans, percentage-of-MSRP rules while a promotional price is active, and the 25 active automatic discount limit.
- Apply MAP rules from the manufacturers' policies: manufacturer programs as published are allowed; store-funded price claims on MAP brands only at or above MAP (STIHL) or not more than $1.00 below it (ECHO), with a named reviewer; gifts and non-price benefits without dollar values; the gift's value never subtracted from a price.
- Dealer-gift operations are a staff procedure in Shopify Admin, not app functions: check each new order against the app's read-only gift reference (and an optional Shopify Flow `gift-review` tag); verify line items, quantities, conditions and the order date against the published offer version; tag `gift-owed`, `gift-backordered`, `gift-fulfilled` or `gift-cancelled` and add a timeline note naming the gift and offer version; add the gift to unfulfilled orders by order editing with a 100% line discount (otherwise a $0 draft order); contact customers about backorders; keep saved order views for gifts to review and gifts owed.
- Cart line properties and attributes are not used as proof of entitlement. The app has no order, customer or fulfillment scopes.
- Document an emergency manual procedure for financial promotions if the app is unavailable.

#### Appearance and placement

Use the native header announcement area only for an approved store-wide promotion or code; detailed conditions belong on campaign, product and cart surfaces (G19, G20). An approved announcement is one short line with a link to its campaign page, set in the visual design language's label and body roles; it repeats no conditions. This feature adds no checkout layout or second promotional overlay.

#### Technical requirements and compatibility

Shopify is authoritative for prices, allocations and totals; application calculations only plan. Price changes are app jobs with snapshots: none of an offer's prices are applied if any differ from the approved regular values, and restore happens only when current values still equal what the app applied (a promotional price list replaces price jobs if a proof of concept shows it works on the primary market). Gift fulfilment relies on native order editing within its documented limits (unfulfilled items only; not local-delivery or Shop Pay Installments orders). Optional Flow automation uses an order-created condition on a hidden `promo-gift-live` collection maintained by the app, as a review hint only.

#### Edge cases and quality

Cover excluded variants, mixed carts, minimums, overlapping campaigns, incompatible combinations, discounts edited or deleted in Admin, partial plan failures, price conflicts at start and end, missed price jobs during an outage, cancelled or returned qualifying items, backordered gifts, orders partly fulfilled before a gift arrives, and duplicates prevented by tags. Test transactions require their own authorization.

#### Acceptance criteria

- [ ] Advertised financial benefits and actual Shopify allocations in cart and checkout summary agree for automatic, code, promotional-price and kit offers in both languages.
- [ ] Activation, pause, natural end, early end and rollback follow the required order, with partial failures reported.
- [ ] MAP and conflict rules block or flag the approved cases.
- [ ] Staff identify, record, fulfil and close gift entitlements on test orders, including backorder, cancellation and return cases, without app involvement.
- [ ] Approved bilingual gift wording, return terms and limited-quantity policy are documented after legal review.

#### Prototype reference

SCS theme files displayed claims; the related `/home/chris/shopify/sales-campaign-manager` application contained native-discount planning/execution code. Source/audit findings included ambiguous percentage conversion, untrusted posted lifecycle/IDs, incomplete target removal and weak partial-failure persistence. `sections/header-group.json` contained a launch-code announcement. These show the coordination need, not a production-ready financial workflow or a requirement to reuse that app's executor.

### G22 — Campaign administration app

**Priority:** P2; required project deliverable. **Status:** Planned. **Dependencies:** G02, G18; verified VPS prerequisites (Q11).

#### Purpose

Make campaign creation, translation, scheduling and Shopify-native discount management easy and reliable for staff. A purpose-built custom app, installed only on Location Gamma's store, is the primary administration tool for the SCS; staff should rarely edit the underlying metaobjects, collections or discounts directly.

#### Expected behaviour and functional requirements

- Manage campaigns and their content; offers, groups, eligibility and related products; manufacturer and dealer promotion information; French and English content; scheduling and lifecycle; native promotional prices and automatic and code discounts; configuration validation and conflict detection; claim accuracy; preview and publication; campaign health; and the data the theme needs (G18).
- Exclude: adding gifts to carts or orders; fulfilling, shipping, reserving or tracking gifts; inventory and purchase orders; manufacturer reimbursement; returns; reading or editing orders; customer notifications; rental transactions or rates; Rental Expert or Point of Rental; checkout customization; replacing Shopify's discount calculation.
- Provide a Shopify-native embedded experience: campaign list with lifecycle and health status; guided creation from templates (manufacturer seasonal, store sale, rental, information) and deep duplication; multi-offer editing with groups, gifts and conditions; product, variant and collection pickers; English and French side by side through Shopify translations; artwork per language; preview; validation with blocking errors and warnings; publish, pause, resume, end and archive with clear confirmations; a read-only gift reference for staff; a reusable rental-equipment library (an optional WordPress catalogue picker); health findings; concise activity history; settings.
- Create, read back and reconcile owned Shopify resources (eligibility collections with back-links, discounts, price plans), marking them with app-owned metafields and never modifying resources it doesn't own. Detect manual Admin changes through webhooks and an hourly reconcile, and hide affected financial claims when intent is broken.
- Use Shopify's shared `brand` entries as the only source of sponsors and brand data (sponsor picker, filters, MAP rules keyed to Brand IDs); never keep a separate brand registry, and never create, change or delete the `brand` definition or the battery-system and policy references to it.
- Guide campaign content toward the storefront's visual design language: recommend 16:9 or 3:2 artwork for each language and name the top-left keep-clear zone that the sponsor badge covers; keep offer labels short enough for a chip and titles led by the benefit; preview the index card and the hero in both languages; and block publication when a rental item lacks a valid rental-catalogue address in either language or the campaign's Brand isn't Active. Brand colours appear in the app only as a reference swatch.
- Follow Shopify Admin conventions for the app's own interface: Polaris components, Polaris status tones for lifecycle and health, exact instants with the store time zone, and no storefront styling.
- Keep immutable published versions of campaign terms so gift entitlements remain auditable after edits or expiry.
- Archive an ended campaign (set it to Draft and unpublish its app-created collections) after the later of normal retention and the last `claim_deadline` of its manufacturer-redeemed offers, and require each `claim_deadline` to be at or after its offer's effective end.
- Block saving a campaign with more than 12 group references across its offers (G18, G20).
- Write a trivial change at every campaign and offer start, end and `hide_at`, because time boundaries don't refresh Shopify's cached pages while any metaobject write does within about 30 seconds (S1). The claim margin then covers that write and its propagation; its value is set with this feature.

#### Technical requirements and compatibility

Separate app repository using Shopify's React Router template, App Bridge, Polaris web components and the Admin GraphQL API pinned to a stable version; expiring offline tokens; least-privilege scopes (metaobjects and definitions, products, discounts, files, translations, locales, publications — no order, customer, fulfillment, inventory or theme scopes); HMAC-verified webhooks and mandatory compliance topics. Host on the existing rental VPS as one systemd service under a dedicated user with resource limits, behind a separate nginx server block and subdomain, with its own MariaDB database and least-privilege user (Prisma ORM 7 with the MariaDB adapter, pinned; Prisma 8 does not yet support MariaDB). Run Node.js 24 LTS. Jobs run in-process with database leases and catch up after restarts. Deploy versioned releases with symlink rollback and additive migrations. Secrets live outside Git; nightly database dumps are copied off the server; an uptime check, failure alerts and a daily Health digest are configured. Preview uses the theme editor on Draft entries if the proof of concept confirms it, otherwise Active entries with `paused` set, rendered in full only in design mode and limited to publicly safe content, because Active public-read entries are readable through the Storefront API. Setup creates the merchant-owned G18 definitions at runtime through the Admin API (not app TOML) and adopts compatible existing ones, with `promotion.sponsor` validated against the existing `brand` definition, which setup requires rather than creates; validation enforces the G18 contract's app rules, including explicit group flags, overlap rejection and the reserved financing benefit; `enforcement_verified_at` is cleared before any enforcement input changes and rewritten only after read-back; private storage for sensitive operational data is settled before it is populated. The app has no app proxy or storefront endpoint, and the storefront, cart and checkout must never depend on the app or the VPS. Merchant-owned definitions keep content independent of the app installation; if the database is lost, ownership is rebuilt from the app-owned metafields on owned resources. Unit tests cover eligibility, entitlement counting, lifecycle and DST, price plans and conflict rules. Before cutover, confirm the retired `sales-campaign-manager` app has no write access on Primary.

#### Edge cases and quality

Cover app and VPS restarts, database restore, partial plan failures, concurrent manual edits, expired tokens, webhook delivery failures, overdue jobs, MariaDB or nginx outages, resource contention with WordPress, prolonged inactivity beyond the API support window, uninstall and reinstall, and missing French or invalid data blocked before publication.

#### Acceptance criteria

- [ ] The app is installed on Gamma-Dev, then Primary, with only the approved scopes, and staff complete the STIHL, ECHO, rental and informational journeys without editing metaobjects or discounts directly.
- [ ] Owned resources match intent after creation, edits, pauses and ends; drift and partial failures appear in Health with recovery actions.
- [ ] Hosting checks pass: isolation from WordPress, OAuth and webhook connectivity, restart, backup and restore, scheduler operation, credential rotation and failure alerts.
- [ ] With the app stopped, published campaigns, notices, prices, discounts, cart and checkout keep working.
- [ ] A documented maintenance schedule (at least a yearly API and dependency update) and recovery procedures exist.

#### Prototype reference

SCS blocks/sections emitted `data-scs-*` markers. In `/home/chris/shopify/sales-campaign-manager`, `app/lib/scs/contracts.ts`, `app/services/scs/theme-compatibility.server.ts` and `app/services/scs/setup-proof.server.ts` consumed them. A substring check could mistake `data-scs-banner-block` for an active `data-scs-banner`. Setup also depended on the promotions template/route contract. The new app starts from a fresh scaffold; its representability, fingerprint and conflict ideas are references only, and DOM markers are unnecessary because the app reads Shopify data directly.

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

## Phase 7 — Storefront design language

These features extend the visual design language from the campaign pages to the rest of the storefront. They change presentation only: Shopify stays authoritative for prices, availability, cart and checkout, and the behaviour, merchant settings, schema IDs and section ownership specified in G03–G23 are preserved. Each feature starts from a rendered review of its surface as it stands, in French and English at 320, 390, 768 and 1440 px, and integrates one shared component at a time with a before-and-after record kept outside this repository. Untranslated theme content and raw menu titles seen on Gamma-Dev on 2026-11-09 ("Welcome to our store", "Newsletter", "Footer - Shop FR", English collection titles on French pages) are content setup under G02 and G15, not design work. On 2026-11-10 the French header menu also showed "Emplacement" for the rental link (previously "Location"), an untranslated "Parts and accessories" and "Nous contacter" (previously "Nous joindre"); these are menu translations to correct in Admin under the same features.

### G25 — Design language foundation

**Priority:** P3. **Status:** Planned. **Dependencies:** G04; G19's visual refinement (stages 1–4) as the pilot.

#### Purpose

Give every later feature one source for type, colour, surface and component rules, so that the campaign pages, product pages, cart and business pages look like parts of one storefront, and so that a change to a shared rule is made once.

#### Expected behaviour and functional requirements

- Move the tokens proven on the campaign pages (type roles, colour roles, surfaces, radii, spacing steps and text measures) to `assets/gamma-branding.css` as `--gamma-*` custom properties that alias Horizon's variables and the theme settings where one exists.
- Provide the shared notice shell and its inline line variant, and adopt them in G08's product notice and cart line, G11's summary notice and the SCS notices without changing their wording, order, announcements or update behaviour.
- Bring product badges and Brand badges into one badge family (radius, padding and type), keeping status distinguishable without colour.
- Provide the remaining shared pieces as small classes or `gamma-` snippets: the section heading with a count and rule, the label rail beside a grid of five or more cards, the media tile rules, fine print, and the button hierarchy mapped onto the native primary and secondary button settings.
- Remove the campaign pages' local copies of anything that becomes shared.

#### Appearance and placement

As defined in the visual design language section. This feature adds no new surface; its visible effect is that notices and badges across the storefront share one treatment.

#### Technical requirements and compatibility

Keep the theme buildless. Don't edit `assets/base.css` or restyle native blocks in place; scope additions to Gamma assets and snippets. Fonts, colours and radii stay merchant-controlled in Theme settings, and the tokens read those settings. Re-check the aliases after each Horizon update. A structural change inside a Horizon file is reported as a Gamma change.

#### Edge cases and quality

Cover the inverse footer and any non-default colour scheme, 200% zoom, long French labels, several notices stacked together, reduced motion and the theme editor.

#### Acceptance criteria

- [ ] Tokens are defined once and used by the campaign pages and at least one other feature, with no visual regression on the campaign pages.
- [ ] G08, G11 and SCS notices share one shell; their wording, order, announcements and update behaviour are unchanged.
- [ ] Product and Brand badges share their geometry; status stays readable without colour and contrast rules are met.
- [ ] Rendered before-and-after review passes in French and English at 320, 390, 768 and 1440 px; local checks report no new findings.

### G26 — Product cards, collections and search

**Priority:** P3. **Status:** Planned. **Dependencies:** G12, G14, G25.

#### Purpose

Most shopping happens on collection and search pages. Their cards and headers should be as considered as the campaign pages that now link to them, and a product card should look the same wherever it appears.

#### Expected behaviour and functional requirements

- Give collection pages a header in the page-title role with the description as a lede of bounded width and the product count, a tidy filter and sort bar, and the campaign callout as a compact notice (G19).
- Settle the product card's image tile (ratio and background) so mixed photography gives even rows (Q17), and set its title, price and badges in the shared roles. Keep swatches, localized media (G10), availability badges (G08), money formatting (G06) and Quick Add.
- Apply the same card configuration wherever the native card is used: the six collection templates, search, product recommendations, the home featured collection and the campaign pages.
- Give the collection list fixed tile ratios, even rows and titles in the group-heading role. Hidden eligibility collections stay excluded.
- Use the same cards and section headings in the search dialog and on the search page. Rental results use the shared rental card from G19, the onward rental link is a secondary button, and empty and failed states are quiet notices.

#### Appearance and placement

Follow the visual design language. On 2026-11-09 collection cards measured 259 px in five columns at 1440 px and two per row on phones; that grid is the reference the campaign pages match and it doesn't change here. Card rows currently vary in height when product photographs differ in shape, and the collection list mixes tile shapes.

The subtle card zoom on hover from G04's carry-over increment (T19) is part of the card baseline this feature starts from and keeps.

#### Technical requirements and compatibility

The product card is Horizon's native `_product-card` block, configured per template. Change it through its settings and scoped Gamma styles; keep pagination, the zoomed-out grid view, filters (G12) and browser-history behaviour native. The rental-search behaviour, toggle and request rules of G14 are unchanged.

#### Edge cases and quality

Cover missing images, long French titles, sale and availability badges together, combined listings, two columns at 320 px, active filters, later pages and the rental service being unavailable.

#### Acceptance criteria

- [ ] Product cards are identical in structure and metrics on collection, search, recommendation, home and campaign surfaces, with even rows across mixed photography.
- [ ] Collection headers, the filter bar, the callout and the collection list follow the type and notice roles.
- [ ] Search dialog and search page results, including rental cards and their states, follow the same cards and headings; G14 behaviour is unchanged.
- [ ] Quick Add, swatches, filters, sorting, pagination and localized media work as before; rendered review passes in both languages at the four widths.

### G27 — Product page

**Priority:** P3. **Status:** Planned. **Dependencies:** G07, G08, G09, G10, G20, G25.

#### Purpose

The product page is where a purchase is decided. Its title, price, system, promotional and availability information and purchase controls should read in a clear order, and its long-form information should be as easy to scan as a campaign's facts.

#### Expected behaviour and functional requirements

- Order the product header as title, price, battery-system row (G09), promotional notices (G20), option picker, availability notice (G08), purchase controls and pickup, with consistent spacing and one primary button.
- Set the description as reading text of bounded width, and the information accordion (G07) with label-role row titles, hairline dividers and a specification table with label-role headings and hairline rows.
- Give complementary and related products counted section headings and the standard product card (G26).
- Keep the media gallery's native behaviour, with thumbnail, video and zoom controls aligned to the shared radii and spacing.

#### Appearance and placement

Follow the visual design language. The product title stays at the section-title size, not the display size, because the page's emphasis belongs to the price and purchase controls.

The price's type role comes from G04's carry-over increment (T19, Q21) and is this feature's baseline.

#### Technical requirements and compatibility

Keep G07's scoped variant updates, G08's notice element and announcements, G09's block position and G10's media rules. Blocks stay reorderable in the theme editor; the specified order is the default composition, not a lock.

#### Edge cases and quality

Cover products with no battery system, no promotions or no availability notice, two promotional notices with a backorder notice, long French titles and option names, sold-out and special-order states, Quick Add dialogs and combined listings.

#### Acceptance criteria

- [ ] The header order and spacing hold for every combination of battery row, promotional notices and availability notice, and the purchase controls don't shift when a variant changes.
- [ ] Accordion rows, the specification table and recommendations follow the type roles and standard card.
- [ ] Variant, price, media, availability and promotional updates behave as before in the page and in Quick Add.
- [ ] Rendered review passes in both languages at the four widths.

### G28 — Cart

**Priority:** P3. **Status:** Planned. **Dependencies:** G11, G20, G25.

#### Purpose

The cart confirms what the customer is buying and what it earns. Line notices, the order summary and the checkout action should be unambiguous on the page and in the drawer.

#### Expected behaviour and functional requirements

- Set each line with an image tile, title, options and unit price in the shared roles, and its line notices as inline lines in a fixed order: availability (G08), then gift (G20).
- Present the order summary as a Concrete panel with the ship-together explanation (G11) in the notice shell, the note area visible, totals in a clear hierarchy and checkout as the only primary button.
- Give the empty cart a quiet notice with links to the main collections and the promotions index.
- Use the counted section heading and the standard product card for cart recommendations.

#### Appearance and placement

Follow the visual design language on the cart page and in the drawer. Line notices stay with their line; no second cart-wide panel is added.

#### Technical requirements and compatibility

Keep the native cart sections, section re-rendering, quantity rules, discounts display, note field and accelerated checkout. No new cart state, attributes or line properties.

#### Edge cases and quality

Cover mixed in-stock and backordered lines, several notices on one line, discounts and compare-at prices, long French product and option names, more than 50 lines, and the drawer at 320 px.

#### Acceptance criteria

- [ ] Line notices appear in the fixed order under their own line on the page and in the drawer, at every width.
- [ ] The summary panel, ship-together notice, note area and totals follow the shared roles, with checkout as the only primary button.
- [ ] Quantity changes, removal, discounts, notes, Quick Add into the cart and checkout handoff behave as before.
- [ ] Rendered review passes in both languages at the four widths.

### G29 — Home and editorial sections

**Priority:** P3. **Status:** Planned. **Dependencies:** G13, G15, G19, G25.

#### Purpose

The home page should say within one screen that Location Gamma sells and rents equipment, show what's current, and lead to shopping, rental and store information with the same hierarchy as the campaign pages.

#### Expected behaviour and functional requirements

- Keep the hero's heading and search entry (G13), with the heading in the display role and verified contrast over its imagery.
- Give featured collections counted section headings with a "view all" link and the standard product card (G26).
- Provide a current-promotions section that reuses the index's campaign cards for a merchant-chosen number of live campaigns, in the index's order, and disappears when none is live.
- Present the business introduction and rental entry points as editorial panels: a lede, a bounded text measure, optional imagery in a media tile, and one secondary action each.
- Alternate Paper and Concrete bands to separate sections instead of adding rules or decoration.

#### Appearance and placement

Follow the visual design language. Sections remain merchant-ordered in the theme editor; the specified composition is the default.

#### Technical requirements and compatibility

The promotions section reads campaign-level fields only, with the same lifecycle rules, loaded-page expiry guard and enumeration limits as the index (G18, G19). Home content stays in theme and merchant content, translated as in G15.

#### Edge cases and quality

Cover no live campaigns, one campaign, campaigns without artwork, long French headings, missing hero imagery and a slow or unavailable rental service.

#### Acceptance criteria

- [ ] The hero, featured collections, promotions section and editorial panels follow the type, surface and action roles.
- [ ] The promotions section shows only live campaigns in the index's order, hides expired ones on loaded pages and disappears when none is live.
- [ ] Search entry, product cards and editor reordering behave as before; rendered review passes in both languages at the four widths.

### G30 — Header, footer and navigation

**Priority:** P3. **Status:** Planned. **Dependencies:** G03, G04, G05, G15, G16, G17, G25.

#### Purpose

The header and footer frame every page. They should carry the same type and action roles as the content between them, and the footer's contact, hours and map information should be as legible as it is on the contact page.

#### Expected behaviour and functional requirements

- Set the announcement bar in the label role, the primary navigation with one consistent active-link treatment, and the mobile drawer with touch targets of at least 44 px.
- Organise the footer into clearly headed groups in the group-heading role: contact details, hours (G16), map and directions (G17), navigation menus, newsletter, and social and payment marks, with the hours table and map actions aligned to the shared roles.
- Align the native privacy banner and preferences (G05) with the button hierarchy without hiding or weakening the decline and preference controls.

#### Appearance and placement

Follow the visual design language on the inverse footer surface as well as on Paper. Language-specific menus, footer menu headings from menu titles and the sticky header keep their G03, G04 and G15 behaviour.

The Signal Yellow announcement bar and the transparent home header come from G04's carry-over increment (T19) and are this feature's baseline: the bar keeps its colour and label role, and the transparent state's measured legibility is checked again after any navigation change.

#### Technical requirements and compatibility

Header and footer are Horizon section groups; change them through settings, blocks and scoped Gamma styles. Keep language switching, cart-count announcements, the map activation rules and store-hours selection unchanged.

#### Edge cases and quality

Cover long French menu labels, nested menus, the sticky and inverse header states, a holiday-hours notice, maps turned off, and the footer at 320 px.

#### Acceptance criteria

- [ ] Header, drawer, announcement bar and footer follow the type, action and surface roles on light and inverse surfaces.
- [ ] Navigation, language switching, hours, map activation, newsletter and privacy controls behave as before, with all privacy choices equally reachable.
- [ ] Rendered review passes in both languages at the four widths.

### G31 — Business-information pages

**Priority:** P3. **Status:** Planned. **Dependencies:** G15, G16, G17, G25.

#### Purpose

About, contact, service, warranty, policy and rental-terms pages build trust and answer practical questions. They should be comfortable to read and consistent with one another.

#### Expected behaviour and functional requirements

- Set page titles in the display role with an optional lede, body text in a reading column of bounded width, and headings in the section and group roles.
- On the contact page, present contact details, hours and the map as aligned panels, departments as Concrete cards, and the form with one primary button.
- Present warranty, policy and rental-terms content with readable tables, document links as secondary actions and legal text in the fine-print style where it qualifies other content.
- Use one disclosure style for frequently asked questions and the product information accordion (G27).

#### Appearance and placement

Follow the visual design language. On 2026-11-09 these pages already used a centred reading column and rounded department cards; the work is to align their headings, spacing and panels with the shared roles, not to recompose them.

#### Technical requirements and compatibility

Page bodies remain merchant content; styles apply to the rich-text output and the existing G15–G17 blocks. The leaf-blower comparison page keeps its authored content.

#### Edge cases and quality

Cover long tables on phones, pages with no lede, documents in one language only, a holiday-hours notice and maps turned off.

#### Acceptance criteria

- [ ] About, contact, service, warranty, policy, rental-terms and FAQ pages share title, lede, heading, table, panel and fine-print treatments.
- [ ] Hours, map, directions and the contact form behave as before.
- [ ] Rendered review passes in both languages at the four widths.

## Phase 8 — Integrated acceptance

### G24 — Complete storefront verification

**Priority:** Required final gate. **Status:** Planned. **Dependencies:** All required G01–G23 and G25–G32 outcomes and their applicable merchant decisions.

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
- Verify the Sales Campaign System end to end: campaigns created and published through the G22 app appear correctly on campaign, product and cart surfaces; gift notices match actual cart eligibility without implying a cart or checkout gift; native discounts and promotional prices match their claims in cart and checkout summary; staff identify and record gift-entitled test orders; and the storefront keeps working while the app or VPS is unavailable.
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
- [ ] The visual design language is applied consistently across campaign, product, cart, collection, search, home, navigation and business-information surfaces, and every shared-component change has its recorded review.
- [ ] SCS scenarios — dealer-gift offers (STIHL battery, ECHO tiers, multiple gifts, conditional tool-plus-battery and two-unit offers, backordered gift, incomplete carts), mixed and multiple offers, expiry and pause, real automatic and code discounts, scheduled price changes and rollback, rental and product-free campaigns, English and French — pass on Gamma-Dev with actual Shopify behavior.
- [ ] App and VPS outage, restart and backup-restore drills leave storefront, cart and checkout unaffected.
- [ ] Pickup information agrees with the availability notice for in-stock, backordered, special-order, untracked and sold-out variants after variant changes on the product page and in Quick Add, in both languages (G08).
- [ ] French storefront and checkout wording follows the approved glossary on the candidate theme, and after publication on Primary the French checkout still shows the approved overrides (G32).
- [ ] The result is reviewable before any separately authorized deployment/publication decision.

### Connected-journey matrix

| Journey | Required interactions and observations |
| --- | --- |
| Home → search → product | Immediate typing/paste/IME, recently viewed initialization, native/rental results, localized links/media and selected product information |
| Collection → filter/sort → Quick Add → cart | Correct specialized filters, numeric bounds, availability/media, later pages, swatches, quantities and back navigation |
| Product → variant → pickup → cart | Details, price, media, campaign and availability agree; the pickup summary and dialog match the selected variant's status (in stock, backordered, special order, untracked, sold out) with no earlier variant's wording left behind; location information and added line identity remain native |
| Campaign index → campaign page → product → cart | Lifecycle, ordering, offer and group membership, gift and redemption panels, product-page notices for the selected variant and matching cart-line gift notices, including incomplete conditions |
| Active campaign → expiry/pause → existing page/cart | Known-expiry presentation, claim margin, actual discount and price boundaries, app lifecycle actions and documented cache freshness limits |
| App edit → publication → storefront | Validation, preview, publication, owned discount and price creation, read-back before financial claims, drift detection after a manual Admin change |
| Qualifying order → staff gift record → fulfilment | Gift reference, optional Flow review tag, verification against the published offer version, tags and order edit, backorder contact, cancellation and return handling |
| App or VPS unavailable → storefront | Published campaigns, notices, prices, discounts, cart and checkout unaffected; jobs catch up after restart |
| Cart → checkout → confirmation | Mixed fulfillment, note, quantities, discounts, eligibility and supported language/terms/account/notification continuity; French checkout wording (pickup stock line, split-delivery messages) as approved, before and after publication |
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
| Q02 | Backorder/special-order terms and real lead times, minimum-quantity wording, mixed-order shipping and pickup promises | G08, G11, G21 | Resolved 2026-11-05: backorder/special-order shipping depends on supplier availability with no stated lead time; mixed orders ship together, with separate shipments on request at additional charge; native Shopify quantity messages suffice; no pickup promise; current line wording approved, with French backorders labelled “En rupture de stock” (“En rupture” on badges). G21 campaign wording remains separate |
| Q03 | Remembered-session versus per-instance map activation, multiple-instance disable and native privacy behavior; permitted editable destinations | G05, G17 | Resolved 2026-11-08: a visitor's choice to turn maps on or off applies to every map and persists on the device; without a choice, maps load automatically when Shopify reports preferences permission and turn off when it is withdrawn; turning maps on needs no Shopify permission and turning them off overrides it; directions are generated from each block's address for Google Maps and Apple Maps, and the uMap ID, address and images are block settings; loading fails after 20 s with a manual retry; the provisional screenshots need clean replacements before launch |
| Q04 | Hours missing-end fallback, start/end boundaries, overlap ordering, timezone authoring, Sunday highlighting and optional priority | G16 | Resolved 2026-11-08: start inclusive, end exclusive; instants compared absolutely, authored in the store timezone; shortest overlapping window wins, then later start, then handle; 7-day default without an end; unusable data falls through to the contact message; no Sunday highlight or priority field; loaded pages keep their schedule until re-rendered |
| Q05 | Campaign collection/offer membership, off-collection products, variant restrictions, intended scale and any projection maintenance | G18–G22 | Resolved 2026-11-08: eligibility lives on offer groups as a collection, narrowed to variants only by an explicit flag, with quantity and flagged companion conditions; collections carry app-maintained back-links to their promotions; no product membership projection; bounded lookup that fails closed, with a per-call work budget (G18) and an aggregate cart budget (G20); budgets confirmed by P-B. After P-B (2026-11-10): the cart shares one lookup across its lines, with at most 8 campaigns of up to 12 groups each |
| Q06 | Campaign end boundary, duration-based grace/archive presentation, winner ties, remote-claim freshness and operator/recheck responsibility | G18–G21 | Resolved 2026-11-08 in principle: start inclusive, end exclusive, store time zone; financial claims hide a margin before the end (provisionally 1,800 seconds pending a caching proof of concept) and are held without a finite end; ended pages show an ended notice for an app-owned retention period (default 30 days) and are then archived; product pages show up to two offers in priority (1 first, blank 50), end (open-ended last) and offer order. The defaults await approval |
| Q07 | Required campaign-application workflows, diagnostic destinations and ownership of financial changes | G21, G22 | Resolved 2026-11-08: a custom app installed only on Location Gamma's store is the required SCS administration tool and the only writer of SCS-owned Shopify resources; it has no order, fulfillment or customer responsibilities; DOM-marker diagnostics are unnecessary |
| Q08 | Approved bilingual branding, copy, external menu destinations, documents/policies, contact/department information and authored comparison content | G03, G04, G07, G09, G15–G21 | Open; content owners approve the relevant material |
| Q09 | Approved bilingual rental API/page/image origins, response/CORS behavior and any separately proposed domain changes | G14 | Resolved 2026-11-05: the current WordPress catalogue is approved, with English `https://www.locationgamma.com/` and French `https://www.locationgamma.com/fr/` (API `wp-json/wp/v2/products` under each, equipment links as returned, `?post_type=gamma_product&s=` search pages); browser-verified CORS reflects the storefront origin without preflight and exposes `X-WP-Total`. The image server doesn't allow anonymous cross-origin images, so images load as ordinary no-referrer requests. The planned move to `locations.locationgamma.com` is a future change of the two theme settings once that host serves the same structure; it isn't operational or verified yet |
| Q10 | Attribution need, current Checkout Blocks capability, selected fields, downstream behavior and privacy handling | G23 | Open; verify with the merchant/application configuration |
| Q11 | VPS suitability for the G22 app: administrator and access, operating system, systemd, resources, nginx and TLS method, subdomain and DNS, MariaDB version (a supported LTS) and permissions, Node.js 24 LTS, outbound/inbound HTTPS, time synchronization, backups and off-site storage, SMTP alerts, monitoring | G22 | Open; only the public facts are known (nginx serves the rental site at 54.39.243.199); hosting is revisited if the checks fail |
| Q12 | Dealer-gift legal and policy wording: bilingual gift and backorder notices, gift return terms when a qualifying item is returned, limited-quantity gifts (stated quantity required under Quebec guidance), wrong-claim policy; whether product and cart notices may leave the stated quantity and the backorder delay to the linked conditions page (G20, 2026-11-11) | G19–G21 | Open; recommended defaults in the SCS proposal; legal review before publication |
| Q13 | Manufacturer confirmations: Gamma's online sales qualify for each program, pre-approval of Gamma-authored campaign pages, treatment of prices shown only in the cart, MAP reviewer | G19–G21 | Open; confirm with STIHL and ECHO before publishing the affected offers |
| Q14 | SCS operating options: the optional Shopify Flow `gift-review` workflow and an optional second approver for financial offers | G21, G22 | Open; recommended: adopt the Flow workflow if its proof of concept passes, and leave the second approver off |
| Q15 | Visual design language choices on the campaign pages: a label rail with four columns from 1200 px or a full-width five-column grid for qualifying groups; the placeholder tile and feature card on the index; the lede, 16 px reading text and 36 px phone display size as additions to the brand type scale; the badge overlay details (keyline, Paper plate, a small covered corner of the artwork); the offer overview from two offers | G19, G20, G25 | Resolved 2026-11-09: "Spec sheet" is the approved design language. From 1200 px the label rail applies only to groups of five or more cards; smaller groups, and every group below 1200 px, stack above a grid identical to collection pages. Rental groups are separated by hairline rules, without panels, and a reused group renders its cards in full. Index cards without artwork use a neutral Concrete tile from 750 px and a slim band below it, and the first campaign in the existing order is a two-column feature card with no new field. The 18/16 px lede, 16 px offer summaries and 36 px phone campaign title are additions to the brand guidelines. The badge overlay is as specified under G19. The offer overview shows from two offers, and the red hero button from 750 px up only |
| Q16 | New bilingual wording: the offer-overview and navigation labels, the in-store notice lead-in, the current-price line for in-store and code offers, the eligible-variant line, the rental-catalogue link text and singular limited-quantity wording | G19, G20 | Resolved 2026-11-09: Chris reviews all new French and English wording, including the current-price line |
| Q17 | Scope and order of G25–G31: which must precede the February 2027 soft launch; the product-card image tile (ratio and background); whether body text rises above 14 px storewide | G24–G31 | Open; recommended: G25 alongside the campaign refinement, G26 and G27 before the soft launch and the others after it, with the card tile and body size settled in each feature's design review |
| Q18 | Quebec French glossary and conventions: the term table under G32; “livraison” for the charge and method while G08 and G11's approved notices keep “expédier” and “délai d’expédition”; “Rabais” for the sale badge beside “promotion” for campaigns; “Ouvrir une session” and “Fermer la session” for the account links; spacing (no space before `?`, `!` and `;`, a no-break space before a colon); and whether the French checkout overrides are versioned in `locales/fr.json` | G32, G08, G11, G24 | Open; recommended: approve the table as drafted, version the overrides in the repository, and change the one phrase “frais d’expédition supplémentaires” in G11's notices to “frais de livraison supplémentaires” so the charge has a single name. The trade-off is one change to wording approved under Q02, and a French checkout may show that Shopify's own wording is “Expédition”, which Chris then accepts or overrides |
| Q19 | Pickup wording for backordered and special-order variants (drafts under G08): a neutral status line with no ready time, or the prototype's "Pickup will be available … we'll let you know" | G08, G24 | Open; recommended: the neutral drafts, which fit Q02 and the 2026-11-05 G11 decision. The trade-off is that customers aren't told Gamma will contact them. The increment is dropped if S5 shows Shopify already reports these variants as unavailable for pickup |
| Q20 | The form of the Gamma Red borders in Horizon 4.4.0, which has one input palette for every field, no general border setting and computed hover colours | G04, G25–G31 | Open; recommended: full Gamma Red (4.25:1) for the input boundary, never the 60% tint (2.59:1, below 3:1); red dividers only where a component has a colour setting, leaving the 12% Coal section hairlines; Gamma Red text and border on secondary-button hover through one scoped rule. The trade-off is that every field gets a red boundary, where in the prototype only the secondary scheme's fields did (the default scheme's were `#dfdfdf`), so errors rely on their message and icon. The alternative keeps inputs at `#333333` and carries over only the hover |
| Q21 | The product-page price's type role | G04, G27 | Open; recommended: the group-heading role (`h4`, 24 px and 20 px on phones), one step under the 32 px title and the size the prototype's settings intended. The alternative, `h3`, reproduces what the prototype rendered: 32 px, the same size as the title |

### Material requirement and architecture decisions

| Date | Features | Decision | Reason and acceptance impact |
| --- | --- | --- | --- |
| 2026-11-04 | All | Development uses the current modified Horizon 4.3.0 fork on `dev`; feature scope and status are tracked here | Native capabilities and the receiving branch remain the implementation foundation; G24 establishes complete storefront acceptance |
| 2026-11-05 | G10 | A product with no neutral or matching-language media shows all of its media; languages other than English/French are unfiltered | Avoids empty galleries and cards when localized artwork is incomplete; matches the G09 other-language icon fallback |
| 2026-11-05 | G11 | The cart drawer stays the default and mobile Quick Add stays enabled; any backordered or special-order line shows a supplier-availability notice, replaced by a ship-together notice when the cart also has in-stock lines, without the prototype's pickup claim | Approved cart preferences and operational wording |
| 2026-11-05 | G12 | Collection contexts use the five prototype template suffixes plus the default template; Filters block settings name the fixed attributes, whose filters are omitted only while inactive; Back/Forward re-renders filtered results until Horizon does | Preserves existing template assignments, keeps URL-applied filters removable instead of stranded, and makes browser history usable; the history workaround is removable on an upstream fix |
| 2026-11-05 | G14 | Rental search is configured in Theme settings > Search (off by default in the schema, enabled with the current French/English addresses in the theme's settings); it sends customer-initiated queries without a consent gate, opens rental pages and the rental search in a new tab, shows rental results above the store's results with a switch that hides them and stops rental requests for the tab, hides the group when nothing matches and the native no-results message when only rentals match, and shows a search link when the service fails; images load as ordinary no-referrer requests because the rental server doesn't allow CORS images; Enter follows the highlighted search item | Keeps the rental host a configuration value, keeps irrelevant rental messaging out of ordinary product searches, lets visitors who won't rent hide the rental cards and makes keyboard activation reliable; the Enter fix is removable once Horizon prioritizes the highlighted item |
| 2026-11-06 | G15 | Template and section-group text is written in English, the primary language, with French supplied as theme-content translations; footer menu headings come from menu titles; department cards stay in the contact page body | Shopify keeps theme-content translations per theme, so they are registered on each new theme. Menu titles and page bodies are translatable content that survives theme changes |
| 2026-11-06 | G15 | The leaf-blower comparison chart is deferred until after the remaining planned theme feature branches and may be unfinished at launch; the `leaf-blower-chart` template stays available | Low-priority content; its absence does not block G15 completion, merging or publication |
| 2026-11-08 | G05, G17 | Interactive maps use a persistent first-party map choice (`localStorage`) alongside Shopify's preferences permission: an explicit choice applies to every map and outlasts the session, a turn-off overrides the permission, and automatic loading waits until a map is near the viewport | Approved customer workflow; replaces the earlier session-scoped planning preference recorded under G05 |
| 2026-11-08 | G16 | One Theme settings override and regular selection serve every hours block; dated exceptions must show a notice stating their dates; more than 49 published entries shows the contact message; expired entries are archived as Draft | Placements can't disagree, undated holiday timetables aren't shown, and draft archival keeps the unpaginated loop complete |
| 2026-11-08 | G18–G22 | The SCS includes a purpose-built custom app, installed only on Location Gamma's store, as the campaign administration tool and part of the launch implementation; Grow remains the plan. Manual Shopify Admin operation is only an emergency fallback | Easy, reliable campaign and discount administration; G22 becomes a required deliverable instead of a compatibility layer, and the earlier no-app and phased-hybrid recommendations are superseded |
| 2026-11-08 | G22 | The app is self-hosted on the existing rental VPS, with its own MariaDB database if the server checks (Q11) pass; Prisma ORM 7 is pinned because Prisma 8 doesn't yet support MariaDB | Uses existing infrastructure without a paid host; isolation from WordPress and storefront independence are acceptance requirements |
| 2026-11-08 | G18–G21 | Free gifts are dealer-fulfilled promotional benefits: no automatic cart insertion, no Buy X Get Y for gifts, no reward lines and no app-managed fulfilment; campaign, product and cart-line notices explain the gift and that a backordered gift may delay the order; staff record gifts on orders with native Shopify tools | Faithfully presents every researched manufacturer gift offer, including conditional ones, without cart manipulation; replaces the earlier automatic-gift design |
| 2026-11-08 | G18–G22 | The G18 contract moves `staff_confirmed_terms` to groups and adds explicit `variants_only`, `requires_companion` and `reward_varies` group flags; stores choices as untranslated `snake_case` values; reserves `financing`; separates the advertised `gift_quantity_limit` from the per-order `reward_limit`; and keeps `app_config`, `map_reviewed_at` and ownership fields outside the theme interface | Deleted variants or companion collections and translated labels can't widen eligibility; claims fail closed on missing or contradictory data; the interface stays provisional until the Gamma-Dev proofs |
| 2026-11-08 | G18–G20 | Campaign content lives in merchant-owned metaobjects rendered by generic theme sections; eligibility uses collections with back-links for bounded product and cart lookup; financial claims require app read-back verification | One membership definition shared by display and discounts; the storefront never depends on the app at runtime |
| 2026-11-09 | G19–G22, G25–G31 | "Spec sheet" is the approved visual design language, piloted on the SCS campaign pages and then extended to the rest of the theme. It is presentation only and builds on the brand guidelines, to which it adds an 18/16 px lede, 16 px offer summaries and a 36 px campaign title on phones; shared-component changes are reviewed individually. At most one red primary button appears per view, and none in the phone hero. An immersive photographic hero and a large benefit figure remain optional extensions | Gives every remaining surface one reference. G19 returns to In progress for its visual refinement (Stage 0 fixtures, then five stages), G20–G22 are specified against the language, and G25–G31 are added before G24 |
| 2026-11-09 | G19 | Qualifying products use the theme's standard product card and collection grid; from 1200 px a label rail accompanies only groups of five or more cards, and smaller groups stack above a grid identical to collection pages. Variant-limited cards match the native card, link to the eligible variant and have no Quick Add. Rental cards follow the rental-search card without prices, in groups separated by hairline rules; a reused group renders in full. Sponsor badges overlay campaign artwork, top-left and fully inside it, with a Paper keyline and shadow and a Paper plate for Brands without a colour. Index cards without artwork use a neutral Concrete tile, and the first campaign is a two-column feature card. The offer overview shows from two offers and the red hero button from 750 px up only | Customers recognise what qualifies, no card implies a discount that isn't applied, and badges stay legible on any artwork without changing Brand data |
| 2026-11-09 | G18, G19 | `/pages/promotions` is the canonical promotions index and campaign pages belong beneath it; the Gamma-Dev proof handle `promotions-g18` is retired through the redirecting migration recorded under G18 | One index address in each language for menus, campaign links and notices; the theme needs no change because every link derives from `system.url` |
| 2026-11-10 | G04, G08, G24, G26, G27, G30, G32 | After the 2026-11-09 prototype review, these items from the prototype theme, then believed to be Primary's published theme, are carried over: status-aware pickup information for backordered and special-order variants (G08); the Quebec French revision of Horizon's strings and the French checkout overrides (new G32); and, under G04, a Signal Yellow announcement bar, a transparent home header, a larger product-page price, the subtle card hover zoom, Gamma Red input boundaries and secondary-button hover, and a 120 px password-page logo. Signal Yellow is limited to the announcement bar, and the red secondary hover is a Gamma exception to Horizon's computed interaction colours | Restores what the prototype showed customers where it was deliberate. Each item is specified again for Horizon 4.4.0 and this plan's accessibility rules instead of copied, with its form pending Q18–Q21; T17–T19 and S5–S6 are added |
| 2026-11-10 | G03, G04, G10, G11, G26, G27 | Reviewed in the prototype and not carried over: the five-column mega menu and parent-link emphasis; the large first gallery image, mobile thumbnails, the product gallery's 12 px media and 8 px thumbnail radii and the h2 product title; 20 px pills, the cart-thumbnail radius and border and the drawer border; the larger card price; justified paragraphs | Recorded once so later reviews don't reopen them; the current settings and the visual design language stand |
| 2026-11-10 | All | Primary's published theme is `gamma-theme/dev` (`190128586925`), connected to this repository's `dev` branch, so a push to `dev` updates the live theme of the password-protected production storefront. Work happens on feature branches, local integration into `dev` stays local, and Chris approves every push to `dev` | The October audit's finding that the prototype theme was published is superseded. There is no separate theme cutover to wait for: what is pushed to `dev` is what Primary serves, including the loss of the prototype's checkout overrides |
| 2026-11-10 | G18, G20, G22 | After S1, the cart resolves promotions through one shared lookup across its lines, limited to 8 campaigns per render; a campaign has at most 12 group references across its offers, which G22 enforces; and the app writes a trivial change at each campaign and offer boundary so cached pages refresh. The 16-offer, 12-group ceiling proof is dropped | A 10-line cart that repeated the lookup per line was about 26% slower than without it, over the 10% target; with time boundaries alone, cached pages stayed stale for 21–24 minutes after a boundary, and cache entries lived at least 33 minutes |

## Optional extensions

The following require separate scope and acceptance decisions: directional product-to-kit links beyond G09's core battery/recommendation feature; catalog import/normalization tooling; PoR status or resale-quantity synchronization; additional analytics; campaign spreadsheet import; an immersive photographic campaign hero as an optional hero style, only once Gamma has its own campaign photography; a large benefit figure per offer, deferred because it needs a new optional offer field and so changes the data contract; a rental rate table and the presentation of a future Shopify rental catalogue; the G22 WordPress catalogue picker; and broader reward/volume programs. Automatic gift insertion and app-managed gift fulfilment are out of scope (G20, G21, G22).

These extensions must not become hidden prerequisites for required storefront behavior. Their absence does not justify omitting required rental discovery, product information, location content, promotional browsing or a truthful supported discount workflow. Any future extension must respect the same native authority, localization, accessibility, privacy and operational requirements.

