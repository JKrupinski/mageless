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
        className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-ink transition-colors duration-150 ease-out-soft hover:bg-surface-hover"
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
          <span
            aria-hidden="true"
            className="numeric absolute -top-0.5 -right-0.5 min-w-[1.25rem] rounded-full bg-accent px-1 text-center text-[0.6875rem] leading-5 font-semibold text-on-accent"
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      {/*
        The badge is aria-hidden and the count is announced here instead. A
        live region on the badge itself would read a bare number ("3") with no
        context; this reads the whole phrase, and politely, so adding to the
        cart never interrupts what the shopper is doing.
      */}
      <span aria-live="polite" className="sr-only">
        {count > 0 ? `Cart: ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart is empty'}
      </span>
      <CartDrawer initialCart={initialCart} locale={locale} />
    </>
  );
}
