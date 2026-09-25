# Theming

This storefront is a template. The design is meant to be replaced, and the whole
point of the token layer is that replacing it does not mean touching components.

Everything visual lives in three files:

| File                    | What it holds                                          |
| ----------------------- | ------------------------------------------------------ |
| `src/styles/tokens.css` | The dials, the default skin, and the token contract    |
| `src/styles/skins.css`  | Three preset skins. Delete it once you have your own   |
| `src/styles/global.css` | Base element styles and a handful of composite classes |

Open `/design` in the running app to see all of it rendered, with live contrast
ratios measured in your browser. It is the fastest way to check a change.

---

## The five-minute re-skin

Open `src/styles/tokens.css` and change the accent hue. It is one number — the
third value in the `oklch()` triple, an angle from 0 to 360:

```css
:root {
  --accent: oklch(0.5 0.19 264); /* 264 = indigo. 25 = red, 145 = green,
  --accent-hover: oklch(0.44 0.19 264);   45 = orange, 310 = magenta */
  --accent-active: oklch(0.38 0.17 264);
  --accent-text: oklch(0.47 0.19 264);
  --accent-soft: oklch(0.955 0.025 264);
}
```

Change the hue in all five and the links, focus rings, active navigation and the
Add to cart button move together.

**Why oklch and not hex.** In oklch the first value is perceptual lightness, so
two colours with the same L have roughly the same contrast against white no
matter what hue you pick. Swapping `264` for `25` keeps the accessibility
guarantees that hex values would quietly break. The lightness and chroma in the
defaults are tuned to clear 4.5:1 across the entire hue circle — change the hue
freely, change L and C with a contrast check open.

## The dials

Three numbers at the top of `tokens.css` move the whole system at once.

```css
:root {
  --dial-radius: 1; /* 0 = square · 1 = Swiss default (6px cards) · 2 = soft · 3 = pill */
  --dial-shadow: 0.55; /* 0 = flat, borders only · 1 = normal · 2 = lifted */
  --dial-rhythm: 1.25; /* 1 = compact sections · 1.6 = airy */
}
```

Every radius in the app is `calc(dial × base)`, so `--dial-radius: 2` rounds
buttons, cards, inputs, menus, badges and image frames in one edit. Drag the
sliders on `/design` to find the value you want before committing it.

## Light and dark

Dark is not an inversion. Surfaces get _lighter_ as they come forward, chroma
comes down so saturated hues do not vibrate on a dark field, and status colours
move to the light end of their ramp.

Each dark colour is written once, as `--dark-<token>` beside its light value
(`--dark-canvas` for `--canvas`). A switch in `tokens.css` points each token at
its dark value when either of these asks for dark:

- `@media (prefers-color-scheme: dark)` — follows the operating system
- `[data-theme='dark']` — set by the toggle in the header, overrides the OS

So to change a dark colour, edit its `--dark-*` value and nothing else. A skin in
`skins.css` does the same: it redefines `--dark-*` and never restates the switch.
Adding a new themed token means a light value, a `--dark-*` value, and one line
in each half of the switch; `tests/unit/theme-tokens.test.ts` fails if any of
those is missing or the two halves drift apart.

`ThemeToggle` cycles system → light → dark and stores the choice under
`mageless:theme`. An inline script in `BaseLayout.astro` applies it before first
paint, so there is no flash of the wrong theme. If you change the storage key,
change it in both places.

Keep the two themes in step: `/design` measures every pair live, so switch the
toggle and watch the ratios rather than trusting the numbers you started from.

## Preset skins

`src/styles/skins.css` ships three complete themes that redefine only the skin
layer. Apply one with an attribute on `<html>`:

```html
<html data-skin="warm"></html>
```

- **Noir** (default, no attribute) — near-black ink, one accent, 6px radii
- **Warm** — sand and terracotta, 12px radii, softer shadows
- **Mono** — no hue at all, square corners, no shadow

Mono is worth running once even if you never ship it: if anything on the page
still shows colour under it, that component hard-coded a value instead of using
a token, and it will fight your brand too.

---

## The contract

Components reference role names, never values. The full list is in the
`@theme inline` block of `tokens.css`; these are the ones you will use most.

| Utility                                              | Use for                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `bg-canvas`                                          | The page itself                                         |
| `bg-surface`                                         | Cards, header, menus — anything sitting on the canvas   |
| `bg-surface-sunken`                                  | Inputs, wells, image pads                               |
| `bg-surface-hover`                                   | Row and menu-item hover                                 |
| `text-ink`                                           | Primary text                                            |
| `text-ink-muted`                                     | Secondary text. Clears 4.5:1 — safe for body copy       |
| `text-ink-subtle`                                    | Icons and 3:1 UI only. **Never** body text              |
| `bg-ink` / `text-on-ink`                             | The primary button                                      |
| `border-line`                                        | Decorative separators                                   |
| `border-line-strong`                                 | Control boundaries. Clears 3:1                          |
| `bg-accent` / `text-on-accent`                       | The one conversion action on a page                     |
| `text-accent-text`                                   | The accent as text: links, active navigation            |
| `text-rating`                                        | Review stars. Its own token — a rating is not a warning |
| `bg-scrim`                                           | The dark wash behind a modal. Dark in both themes       |
| `rounded-control` / `rounded-card` / `rounded-panel` | Inputs and buttons / cards / menus and dialogs          |
| `ease-out-soft`                                      | The standard transition curve                           |
| `mt-section`                                         | Vertical rhythm between page sections                   |

Two composite classes in `global.css` are worth knowing:

- **`.container-page`** — the single page gutter and measure. Every route uses
  it, which is why columns line up between pages.
- **`.numeric`** — tabular figures. Put it on any price, quantity or total; without
  it a cart total visibly twitches as digits change width.

### Rules the contract depends on

1. **Never hard-code a colour, radius or shadow in a component.** If you need a
   value that does not exist, add a token — that is a design decision, and it
   belongs in one file where the next person can find it.
2. **Pair `-soft` backgrounds with their full-strength text colour.** `bg-sale-soft`
   goes with `text-sale`. Mixing ramps is how a re-skin ends up unreadable.
3. **Never remove the focus ring.** It is declared once in `global.css` for
   `:focus-visible` and every control inherits it.
4. **Meaningful graphics need 3:1, not 4.5:1.** `--rating` and `--line-strong`
   are held at that floor (WCAG 1.4.11). `--ink-subtle` is a 3:1 token too, so
   it is for icons and borders — never for text.
5. **Never rely on colour alone.** A discount shows a percentage, an error shows
   an icon, the active nav item gets a rule under it. All three survive the Mono
   skin, colour-blind vision and a monochrome printout.

---

## Typography

Inter is self-hosted: the variable-weight woff2 files live in `public/fonts/inter/`
and `src/styles/fonts.css` declares one `@font-face` per Unicode subset, each with
`font-display: swap` so text is never invisible while it loads. The fallback stack
in `--font-sans` is metrically close, so the swap does not reflow the page (CLS).

It used to load from Google Fonts, which meant a render-blocking cross-origin
request (DNS + TLS before the stylesheet even arrives) and handed every visitor's
IP to Google. Self-hosting removes both. A browser still only downloads the
subset a page's text actually needs — `unicode-range` decides that, exactly as
Google's own stylesheet did — so an English-only storefront still fetches just
`inter-latin.woff2`.

To pick up a new Inter release, regenerate `src/styles/fonts.css` and the files
in `public/fonts/inter/` from `@fontsource-variable/inter` (`npm pack` it, or add
it as a dependency and copy its `files/*-wght-normal.woff2` and `wght.css`).

To use a different family, change `--font-sans` in the `@theme inline` block and
swap in that family's own self-hosted `@font-face` rules. The display sizes
(`--text-display-*`) carry their own negative tracking, tuned for Inter; a
different family will want different values.

## Adding a component

1. Build it out of the utilities above.
2. Add a story in Storybook (`npm run storybook`) — the a11y addon runs there.
3. Check it under the Mono skin and in dark mode on `/design`.
4. Run `npm run test:a11y` for the automated WCAG scan.
