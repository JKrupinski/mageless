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
