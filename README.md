# Headless storefront for Magento 2

A server-rendered storefront that talks to a Magento 2 (Mage-OS 3 / 2.4.9) backend over
GraphQL. It covers catalogue browsing, faceted category listings, search and the cart.
**Checkout is deliberately out of scope** — the cart page ends at a disabled button, and
payment/shipping stay in Magento.

The backend is a [`markshust/docker-magento`](https://github.com/markshust/docker-magento)
stack in [`../magento`](../magento), reachable at `https://magento.test/`. It is the
recommended way to get a local Magento instance with a working GraphQL API — see
[Magento backend](#magento-backend) below.

---

## Architecture at a glance

| Concern       | Choice                                    | Why                                                                                |
| ------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Rendering     | Astro 7, `output: 'server'`, Node adapter | Catalogue HTML is crawlable and fast on first paint; islands add interaction back. |
| UI            | React 19 + TypeScript (strict)            | Component model the team already knows, with server rendering for free.            |
| Data          | gql.tada + `graphql`                      | Types are inferred from the document text — no codegen step to keep in sync.       |
| Styling       | Tailwind CSS v4, `@theme` tokens          | One file defines the design tokens; components never hard-code a value.            |
| Client state  | Nanostores                                | ~1 kB, framework-agnostic, no provider tree around islands.                        |
| Forms         | React Hook Form + Zod                     | One schema validates in the browser _and_ in the API route.                        |
| Server cache  | valkey/redis via ioredis                  | Shared cache for anonymous GraphQL reads; a cache outage only costs latency.       |
| Tests         | Vitest, Playwright, axe-core              | Unit for logic, E2E for flows, automated WCAG scans per page type.                 |
| Design system | Storybook 10                              | Components are developed and reviewed in isolation, with the a11y addon on.        |

### Routing mirrors Magento

There is one catch-all route, [`src/pages/[...path].astro`](src/pages/%5B...path%5D.astro).
It asks Magento's own `route(url:)` resolver what lives at a URL and renders the product,
category or 404 accordingly. The storefront therefore serves the exact URLs Magento
publishes — `/women/tops-women.html`, `/erika-running-short.html` — so existing SEO,
redirects and backlinks survive the move to a headless frontend. Magento's own
`redirect_code` is honoured with a real 301/302.

> One sharp edge: `Astro.params.path` strips a trailing `.html`, because Astro treats it as
> the page extension. The resolver reads `Astro.url.pathname` instead, since Magento needs
> the URL exactly as published.

### Hydration strategy

Nothing hydrates unless it has to. Measured on the product page, the only JavaScript that
runs is the cart and the gallery.

| Component                     | Directive        | Reason                                         |
| ----------------------------- | ---------------- | ---------------------------------------------- |
| `ProductCard` / `ProductGrid` | _(none)_         | Pure markup — server-rendered React, zero JS.  |
| Facets, sorting, pagination   | _(none)_         | Plain links; filtering works with JS disabled. |
| `CartWidget` (+ drawer)       | `client:load`    | The badge and drawer are touched immediately.  |
| `AddToCartForm`               | `client:load`    | The primary action on the page.                |
| `SearchBox`                   | `client:idle`    | Needed soon, but not for first paint.          |
| `ProductGallery`              | `client:visible` | Only matters once it is on screen.             |

### The cart is server-authoritative

The Magento guest-cart id is a bearer credential, so it lives in an **httpOnly cookie** and
never reaches client JavaScript. Islands call this app's own endpoints
(`/api/cart/add`, `/update`, `/remove`), which re-validate the payload with the same Zod
schema the form uses and talk to Magento server-side. An expired quote is detected and a
fresh cart is issued instead of showing an error.

### Caching

`execute()` caches anonymous reads in valkey, keyed by store code + query text + variables.
Requests carrying a customer token are never cached — a personalised response in a shared
cache is a data leak. TTLs are per call site (`route` 10 min, category 3 min, navigation and
store config 1 h). If valkey is unreachable the storefront logs once and serves uncached.

---

## Getting started

### Requirements

- Node 22+ (developed on 24)
- The Magento stack in `../magento` running and reachable at `https://magento.test/`
- valkey/redis — the Magento stack already exposes one on `:6379`

### Magento backend

This storefront doesn't run Magento itself — it needs one reachable over GraphQL, and
[`markshust/docker-magento`](https://github.com/markshust/docker-magento) is the recommended
way to get one locally. Follow that repo's own instructions to set it up as `../magento`
(next to, not inside, this `frontend/` folder), reachable at `https://magento.test/`, then
come back here.

Two things specific to using it as this project's backend:

- **Sample data.** Deploy Magento's sample catalogue; without it the storefront has nothing
  to render.
- **Blackfire must be disabled**, or every GraphQL response gets ~900 kB of HTML appended to
  it — see [below](#two-things-to-know-about-the-magento-side).

### Setup

```bash
cp .env.example .env
npm install
npm run schema:generate    # introspects https://magento.test/graphql into schema.graphql
npm run dev                # http://localhost:4321
```

`schema.graphql` and `src/lib/graphql/graphql-env.d.ts` are committed on purpose, so CI can
type-check the GraphQL documents without a reachable Magento. Regenerate them after a
backend change:

```bash
npm run schema:generate && npm run schema:turbo
```

### Local TLS

`docker-magento` installs a self-signed certificate into the system trust store, which Node
does not read by default, so the npm scripts pass `--use-system-ca`. (Putting it in `.env`
would not work — Node reads `NODE_OPTIONS` before it reads an env file.) If your certificate
lives outside the system store, set `NODE_EXTRA_CA_CERTS` to its path instead. Do not
disable verification.

### Two things to know about the Magento side

1. **Blackfire must be off.** The PHP image ships the Blackfire extension enabled while the
   agent container is commented out in `compose.yaml`. On shutdown the extension fails to
   resolve the `blackfire` host and appends ~900 kB of HTML to _every_ response, including
   GraphQL — which breaks any JSON client. Fix it once with `bin/blackfire disable` in the
   Magento directory. The GraphQL client also reports this explicitly if it ever comes back.
2. Sample data is assumed (`bin/magento sampledata:deploy`). The home page merchandises the
   busiest leaf category rather than a hard-coded id, so it works on other data sets too.

---

## Scripts

| Command                   | What it does                                     |
| ------------------------- | ------------------------------------------------ |
| `npm run dev`             | Astro dev server on :4321                        |
| `npm run build`           | Production build (`dist/server` + `dist/client`) |
| `npm run preview`         | Serve the production build with the Node adapter |
| `npm run typecheck`       | `astro check` + `tsc --noEmit`                   |
| `npm run lint`            | ESLint, including `jsx-a11y` and `react-hooks`   |
| `npm run test`            | Vitest unit tests                                |
| `npm run test:coverage`   | Unit tests with v8 coverage thresholds           |
| `npm run test:e2e`        | Playwright (builds and serves the app itself)    |
| `npm run test:a11y`       | Only the axe-core scans                          |
| `npm run storybook`       | Design system on :6006                           |
| `npm run schema:generate` | Re-introspect the Magento schema                 |

---

## Testing

**Unit (Vitest, jsdom).** Pure logic and component behaviour: money formatting, facet URL
building, filter whitelisting, JSON-LD generation, the cart store's error handling, and the
variant matrix in `AddToCartForm` — including that option values no variant can satisfy are
disabled rather than failing on submit.

**E2E (Playwright, desktop + mobile).** Real flows against a real Magento: category
browsing, facets, pagination, 404s, configurable add-to-cart, the drawer, cart quantity
changes and removals, type-ahead search, and that the cart survives a reload.

**Accessibility (axe-core).** Every page type plus the opened cart drawer is scanned against
WCAG 2.1 A/AA on both viewports. Storybook runs the same engine per story.

One helper is worth knowing about: `e2e/helpers.ts` waits for a named island to hydrate
(Astro drops the `ssr` attribute when it does). Without it a click can land on markup whose
handlers are not attached yet — the same race a shopper on a slow connection hits. Where
that race would cost real usability, the markup works without JavaScript instead: the search
box is a plain `GET /search` form, and facets are links.

---

## Performance and SEO

- Above-the-fold product tiles are `fetchpriority="high"` and eager; everything below is
  lazy. The product gallery's main image is the LCP element and is treated the same way.
- `<link rel="preconnect">` to the Magento media origin, since catalogue images come from
  there and are discovered late.
- Category HTML gets `s-maxage=60, stale-while-revalidate=300`; the cart and API routes are
  `private, no-store` (see [`src/middleware.ts`](src/middleware.ts)).
- Structured data is built from the same GraphQL data the page renders, so it cannot drift:
  `Product` + `Offer` + `AggregateRating`, `BreadcrumbList`, `ItemList`, `WebSite`.
- `/sitemap.xml` is generated from the live catalogue (Astro's static sitemap integration
  cannot see routes that only exist in Magento); `/robots.txt` keeps crawlers off faceted
  and paginated URLs, which are also `noindex`.

---

## Deployment

```bash
docker compose up --build      # storefront on :4321, joined to the Magento network
```

The image is a three-stage build that ships only production dependencies and runs as a
non-root user, with a healthcheck on `/robots.txt`. `PUBLIC_*` variables are inlined into
the client bundle at build time, so they are passed as build args as well as runtime env.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs type-checking, GraphQL
document validation, lint, formatting, unit tests with coverage, a Storybook build and a
Docker build on every push. The E2E job is gated on a `MAGENTO_GRAPHQL_ENDPOINT` repository
variable, because it needs a reachable backend.

---

## Scope and what is missing

Implemented: home, category listing with facets/sorting/pagination, product detail with
configurable variants, search with type-ahead, guest cart, sitemap, robots, structured data.

Not implemented, in rough order of what would come next:

1. **Checkout** — explicitly out of scope here.
2. **Customer accounts** — login, addresses, order history.
3. **CMS pages** — `route()` already resolves them; only the renderer is missing.
4. **Cache invalidation** — TTLs only today. A Magento webhook or a queue consumer calling
   `cachePurge()` on reindex would let the TTLs go up a lot.
5. **Image optimisation** — Magento serves pre-sized cache images; an image CDN in front
   would allow AVIF/WebP and proper `srcset`.
6. **Real monitoring** — the structure is there (healthcheck, cache logging), but Elastic
   Synthetics or equivalent still needs wiring up.

## Known environment issue

`npm run dev` can fail on Linux with `ENOSPC: System limit for number of file watchers
reached`. That is an inotify limit on the machine, not a project problem:

```bash
sudo sysctl fs.inotify.max_user_watches=524288
```

The production build (`npm run build && npm run preview`) is unaffected.
