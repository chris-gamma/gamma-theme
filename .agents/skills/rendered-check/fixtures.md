# Gamma-Dev test data

Gamma-Dev is `gamma-dev-2318.myshopify.com` (shop ID 81927143660). Confirm the shop ID before any
operation. Writes (products, collections, metaobjects, settings) need Chris's approval for the exact
change; name new records `<feature>-fixture-*` and leave them in place for later checks.

## What exists

Re-check before relying on it; other sessions change this store.

- Campaigns: `g19-proof-*`, `g19v-*` (`g19v-weekend-rentals` has the only campaign rental groups),
  `s2-fixture-*` (states), `t5-fixture-*` (gift and offer kinds), `t5-worst-c1..8` (Draft, for worst-case
  timing). Campaign pages are `/pages/promotions/<handle>`.
- Product cards: `t8-fixture-swatches` (three colour swatches), `t8-fixture-localized-media`
  (`-en`/`-fr` images), `t8-fixture-sale-backorder` (sale and backorder badges together), collection
  `t8-fixture-cards`; hidden collection `t8-fixture-hidden`.
- Product page: `t9-fixture-two-available` (Kit in stock, Outil seul backordered; in `tools-equipment`);
  the GTA 40 set has complementary products. Combined listings aren't available on Gamma-Dev's plan.
- Card image arrows need three or more visible, non-variant images: `/collections/chainsaws`.
- Most product images are identical 4:3 illustrations; for real photo shapes, use rental catalogue
  images.

## Recipes

Run GraphQL with `shopify store execute -s gamma-dev-2318.myshopify.com --allow-mutations
--query-file q.graphql --variable-file vars.json`. The CLI's access has no `read_locations`.

- Product with named image files: `productSet(input: { ..., files: [{ originalSource, contentType: IMAGE,
  filename: "x-fr.jpg" }] }, synchronous: true)`. To update by `identifier: { handle }`, repeat the
  `handle` in `input`. Images whose file names end in `-en`/`-fr` are language-specific in the theme.
- Sale: `compareAtPrice` above `price`. Backorder badge: `inventoryItem: { tracked: true }`,
  `inventoryPolicy: CONTINUE`, no stock.
- Colour swatches: `standardMetaobjectDefinitionEnable(type: "shopify--color-pattern")`, entries with
  `label`, `color`, `color_taxonomy_reference` (a list) and `pattern_taxonomy_reference` (Solid is
  `gid://shopify/TaxonomyValue/2874`); a product category with a Color attribute (e.g.
  `gid://shopify/TaxonomyCategory/ha-15-38`); and `productOptions: [{ name: "Color", linkedMetafield:
  { namespace: "shopify", key: "color-pattern", values: [<entry ids>] } }]`.
- Complementary products: metafield `shopify--discovery--product_recommendation.complementary_products`,
  type `list.product_reference`, on the product that shows them.
- In-stock quantities: the CLI's access has no inventory scopes; use the Shopify connector's
  `set-inventory` on the location the variant is stocked at.
- Hidden collection: metafield `seo.hidden`, type `number_integer`, value `1`.
- Publish to the storefront: `publishablePublish(id, input: [{ publicationId: <Online Store> }])`;
  list publications to find the ID.
