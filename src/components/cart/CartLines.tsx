import { useStore } from '@nanostores/react';
import { ShoppingBag } from 'lucide-react';
import {
  $cart,
  $cartError,
  $cartStatus,
  hydrateCart,
  removeCartItem,
  updateCartItem,
} from '@lib/stores/cart';
import type { CartSummary } from '@lib/cart/types';
import { Button } from '@ui/Button';
import { QuantityStepper } from '@ui/QuantityStepper';
import { formatMoney } from '@lib/format';

export interface CartLinesProps {
  initialCart: CartSummary;
  locale?: string;
}

/** The cart page body: quantities, removals and totals, all server-authoritative. */
export function CartLines({ initialCart, locale = 'en-US' }: CartLinesProps) {
  hydrateCart(initialCart);

  const cart = useStore($cart);
  const status = useStore($cartStatus);
  const error = useStore($cartError);
  const busy = status === 'pending';

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-panel border border-dashed border-line px-6 py-20 text-center">
        <ShoppingBag className="size-7 text-ink-subtle" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-ink">Your cart is empty</p>
        <p className="mt-1 text-sm text-ink-muted">
          Anything you add is kept server-side, so it survives a reload.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-control bg-ink px-5 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover"
        >
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div>
        {error ? (
          <p
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-control bg-danger-soft p-3 text-sm font-medium text-danger"
          >
            {/* Icon as well as colour, so the failure survives a monochrome
                skin and colour-blind vision (WCAG 1.4.1). */}
            <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M8 5v3.5M8 10.8v.2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{error}</span>
          </p>
        ) : null}

        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((item) => (
            <li
              key={item.uid}
              // Two columns on a phone (image beside details, controls below),
              // one row from `sm` up. flex-wrap left the stepper stranded on
              // its own line at awkward widths.
              className="grid grid-cols-[5rem_1fr] gap-x-4 gap-y-4 py-5 sm:grid-cols-[6rem_1fr_auto]"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  width={96}
                  height={120}
                  loading="lazy"
                  className="row-span-2 aspect-4/5 w-full rounded-card bg-surface-sunken object-cover sm:row-span-1"
                />
              ) : (
                <div
                  className="row-span-2 aspect-4/5 w-full rounded-card bg-surface-sunken sm:row-span-1"
                  aria-hidden="true"
                />
              )}

              <div className="flex min-w-0 flex-col">
                <a
                  href={item.url}
                  className="font-medium text-ink underline-offset-2 hover:underline"
                >
                  {item.name}
                </a>
                <span className="numeric mt-1 text-xs text-ink-muted">SKU {item.sku}</span>
                {item.options.map((option) => (
                  <span key={option.label} className="mt-0.5 text-xs text-ink-muted">
                    {option.label}: {option.value}
                  </span>
                ))}
                {item.unavailableMessage ? (
                  <span className="mt-1.5 text-xs font-medium text-danger">
                    {item.unavailableMessage}
                  </span>
                ) : null}
              </div>

              <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:gap-3">
                <QuantityStepper
                  value={item.quantity}
                  min={1}
                  disabled={busy}
                  label={`Quantity for ${item.name}`}
                  onChange={(next) => void updateCartItem(item.uid, next)}
                />
                <div className="flex flex-col items-end gap-1">
                  <span className="numeric font-semibold text-ink">
                    {formatMoney(item.rowTotal, locale)}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeCartItem(item.uid)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="cursor-pointer text-xs text-ink-muted underline-offset-2 transition-colors hover:text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <a
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path
              d="M13 8H3m4-4L3 8l4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Continue shopping
        </a>
      </div>

      {/* Sticky on desktop: on a long cart the total should not require a
          scroll back up to read. */}
      <aside className="rounded-panel border border-line bg-surface p-5 lg:sticky lg:top-36">
        <h2 className="text-xs font-semibold tracking-wider text-ink uppercase">Summary</h2>
        <dl className="mt-4 flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Items</dt>
            <dd className="numeric text-ink">{cart.totalQuantity}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Shipping</dt>
            <dd className="text-ink-muted">Calculated at checkout</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt className="font-medium text-ink">Total</dt>
            <dd className="numeric text-xl font-semibold text-ink">
              {formatMoney(cart.grandTotal, locale)}
            </dd>
          </div>
        </dl>

        {/* Checkout is intentionally out of scope for this storefront. */}
        <Button
          fullWidth
          size="lg"
          className="mt-5"
          disabled
          title="Checkout is not part of this scope"
        >
          Checkout
        </Button>
        <p className="mt-2.5 text-center text-xs leading-relaxed text-ink-muted">
          Checkout is handled by Magento and is out of scope for this storefront.
        </p>
      </aside>
    </div>
  );
}
