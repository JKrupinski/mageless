# Checkout joins scope; payment and shipping methods are read dynamically from Magento

The README originally scoped checkout out entirely — the cart page ended at a disabled
button, payment and shipping stayed in Magento. This storefront is now meant to be a
reusable template other stores adopt, and a template without checkout isn't a template of
a store. Checkout joins scope, including payment and shipping method selection.

We read `available_payment_methods` and each shipping address's
`available_shipping_methods` from Magento's cart at request time rather than hardcoding a
specific set. A generic renderer (radio choice + submit, no client-side SDK) is the default
path and handles every method that needs no extra integration — confirmed against a live
backend, Magento's own offline methods (`checkmo`, `banktransfer`, `free`, etc.) and all
shipping carriers fit this path with zero custom code. Methods that require a client-side
SDK (Braintree, PayPal, Stripe, Adyen — hosted fields, redirects, iframes) don't fit the
generic path and are registered instead as named adapters, keyed by Magento's method code,
with one reference implementation (Stripe) proving the pattern works end to end.

The alternative — building one opinionated, hardcoded gateway integration — would be
simpler, but wrong for a template: every adopter has already chosen or will choose their
own payment provider, and hardcoding one forces a fork instead of a drop-in adapter. The
generic-plus-adapter split keeps the common case (offline methods, all shipping) working
out of the box while making the hard case (a specific paid gateway) an explicit extension
point rather than a rewrite.
