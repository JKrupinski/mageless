# Widget-rendered category content is out of scope

A stock Luma category page carries promotional banners, editorial blocks and a "Hot Sellers"
grid. None of it is reachable from Magento's GraphQL API: the category's own `description` and
`landing_page` fields come back null, because the content lives in Magento widget instances
that its PHP layout engine assembles at render time. We are not going to reproduce it, and a
Category Landing is merchandised by this storefront instead — Subcategories the shopper can
descend into, plus products we choose ourselves.

This is consistent with the existing scope line on CMS Page, which already rules out Page
Builder's structured layout data for the same underlying reason.

## Considered options

Exposing widgets through a custom Magento module, or fetching and scraping the rendered Luma
HTML, would both close the gap. Both were rejected: the first makes every adopter install a
backend module before the storefront renders correctly, which contradicts the template's
premise that adoption needs no fork; the second couples this storefront to the markup of the
theme it exists to replace.

## Consequences

A Category Landing will not look like its Luma counterpart, and that difference is permanent
rather than unfinished work. The storefront therefore owes landings a merchandising treatment
of its own; without one they are dead ends, which is exactly the defect that prompted this
decision.
