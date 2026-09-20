import { useStore } from '@nanostores/react';
import { $cart, hydrateCart, openCartDrawer } from '@lib/stores/cart';
import type { CartSummary } from '@lib/cart/types';
import { CartDrawer } from './CartDrawer';

export interface CartWidgetProps {
  initialCart: CartSummary;
  locale?: string;
}

/**
 * Header cart button plus the drawer, hydrated as a single island so the whole
 * cart UI costs one React root per page rather than two.
 */
export function CartWidget({ initialCart, locale = 'en-US' }: CartWidgetProps) {
  hydrateCart(initialCart);
  const count = useStore($cart).totalQuantity;

  return (
    <>
      <button
        type="button"
        onClick={openCartDrawer}
        className="relative inline-flex size-10 items-center justify-center rounded-[--radius-control] text-ink hover:bg-surface-muted"
        aria-label={count > 0 ? `Open cart, ${count} items` : 'Open cart'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M3 3h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L21 7H6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.2" />
          <circle cx="18" cy="20" r="1.2" />
        </svg>
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-brand-600 px-1 text-center text-xs font-semibold text-white">
            {count}
          </span>
        ) : null}
      </button>
      <CartDrawer initialCart={initialCart} locale={locale} />
    </>
  );
}
