# Headless Storefront

A reusable, headless storefront template for Magento 2 — built to be adopted and re-skinned
by other stores, not just to run this one. It talks to any Magento 2 (Mage-OS 3 / 2.4.9)
backend over GraphQL and renders catalogue, checkout and account with its own design system.

## Language

**Guest Checkout**:
Completing checkout without a customer account. Registration/login is offered during
checkout as an optional, non-blocking step — a shopper can always finish as a guest.
_Avoid_: Anonymous checkout.

**Wishlist**:
A single, per-customer list of saved products with add/remove/move-to-cart. There is exactly
one per customer — no multiple named lists, no sharing. (Magento Open Source's default
behavior; multiple/shared wishlists are a Commerce/B2B feature this template does not target.)

**CMS Page**:
Static informational content (About, Contact, Terms) authored in Magento's WYSIWYG editor
and rendered as sanitized HTML. Page Builder layouts (row/column/widget JSON) are explicitly
out of scope — a CMS Page in this context never carries structured layout data.
_Avoid_: Page, static block (Magento also has CMS Blocks, a different concept not yet covered here).

**Category**:
A node in the merchandising tree a shopper browses, published by Magento at its own URL.
_Avoid_: Collection, department, taxonomy node.

**Display Mode**:
Magento's per-category declaration of what a Category presents: a product listing, a landing,
or both. It is the merchandiser's stated intent, not a rendering detail.
_Avoid_: Layout, template, page type.

**Category Landing**:
A Category whose Display Mode presents navigation and merchandising instead of a product
listing. Luma's top-level departments — Women, Men, Gear, Training — are all landings.
_Avoid_: Landing page (collides with CMS Page), category page.

**Subcategory**:
A Category that is a direct child of another Category. A shopper reaches a product listing by
descending through Subcategories from a Category Landing.
_Avoid_: Child category, nested category.

**Anchor Category**:
Magento's PHP storefront rolls a Category's descendant products up into that Category's own
listing. Magento's GraphQL API does not do this, and neither does this storefront: a Category
lists only the products assigned to it directly.
_Avoid_: Recursive category, rolled-up category.

**Widget Content**:
Category and page content composed from Magento widget instances and assembled by Magento's
PHP layout engine — the banners and promotional blocks on a stock Luma category. It is not
reachable through GraphQL. See ADR-0002.
_Avoid_: Category banner, CMS block (a CMS Block is a different, addressable thing).
