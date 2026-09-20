import { useStore } from '@nanostores/react';
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
      <div className="rounded-[--radius-card] border border-dashed border-border-subtle p-12 text-center">
        <p className="text-sm text-ink-muted">Your cart is empty.</p>
        <a
          href="/"
          className="mt-4 inline-block rounded-[--radius-control] bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-[--radius-control] bg-danger/10 p-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <ul className="divide-y divide-border-subtle border-y border-border-subtle">
          {cart.items.map((item) => (
            <li key={item.uid} className="flex flex-wrap items-start gap-4 py-4">
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  width={96}
                  height={120}
                  loading="lazy"
                  className="h-30 w-24 rounded-[--radius-control] object-cover"
                />
              ) : null}

              <div className="flex min-w-48 flex-1 flex-col gap-1">
                <a href={item.url} className="font-medium text-ink hover:underline">
                  {item.name}
                </a>
                <span className="text-xs text-ink-muted">SKU: {item.sku}</span>
                {item.options.map((option) => (
                  <span key={option.label} className="text-xs text-ink-muted">
                    {option.label}: {option.value}
                  </span>
                ))}
                {item.unavailableMessage ? (
                  <span className="text-xs text-danger">{item.unavailableMessage}</span>
                ) : null}
              </div>

              <QuantityStepper
                value={item.quantity}
                min={1}
                disabled={busy}
                label={`Quantity for ${item.name}`}
                onChange={(next) => void updateCartItem(item.uid, next)}
              />

              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold text-ink">{formatMoney(item.rowTotal, locale)}</span>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => void removeCartItem(item.uid)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-[--radius-card] border border-border-subtle bg-surface-muted p-5">
        <h2 className="text-sm font-semibold text-ink">Summary</h2>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Items</dt>
            <dd className="text-ink">{cart.totalQuantity}</dd>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-2">
            <dt className="font-medium text-ink">Total</dt>
            <dd className="text-lg font-semibold text-ink">
              {formatMoney(cart.grandTotal, locale)}
            </dd>
          </div>
        </dl>
        {/* Checkout is intentionally out of scope for this storefront. */}
        <Button fullWidth className="mt-5" disabled title="Checkout is not part of this scope">
          Checkout
        </Button>
        <p className="mt-2 text-center text-xs text-ink-muted">
          Checkout is handled by Magento and is out of scope here.
        </p>
      </aside>
    </div>
  );
}
