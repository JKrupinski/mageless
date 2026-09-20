import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import {
  $cart,
  $cartDrawerOpen,
  $cartStatus,
  closeCartDrawer,
  hydrateCart,
  removeCartItem,
} from '@lib/stores/cart';
import type { CartSummary } from '@lib/cart/types';
import { Button } from '@ui/Button';
import { formatMoney } from '@lib/format';

export interface CartDrawerProps {
  /** SSR snapshot so the badge and contents are right on first paint. */
  initialCart: CartSummary;
  locale?: string;
}

export function CartDrawer({ initialCart, locale = 'en-US' }: CartDrawerProps) {
  hydrateCart(initialCart);

  const cart = useStore($cart);
  const open = useStore($cartDrawerOpen);
  const status = useStore($cartStatus);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCartDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      // Returning focus to the trigger is what makes the drawer usable by
      // keyboard and screen-reader users (WCAG 2.4.3).
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  /*
   * Rendered into <body> rather than in place.
   *
   * The drawer lives inside the header island, and the header carries
   * `backdrop-blur`. A `backdrop-filter` makes an element the containing block
   * for its `position: fixed` descendants, so an in-place drawer would be
   * clipped to the header's box instead of covering the viewport. The portal
   * escapes that containing block; it is safe on the server because the drawer
   * renders nothing until it is opened.
   */
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={closeCartDrawer} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-border-subtle p-4">
          <h2 className="text-base font-semibold text-ink">
            Cart <span className="text-ink-muted">({cart.totalQuantity})</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={closeCartDrawer} aria-label="Close cart">
            ✕
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-muted">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {cart.items.map((item) => (
                <li key={item.uid} className="flex gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      width={64}
                      height={80}
                      loading="lazy"
                      className="h-20 w-16 rounded-[--radius-control] object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1">
                    <a href={item.url} className="text-sm font-medium text-ink hover:underline">
                      {item.name}
                    </a>
                    {item.options.map((option) => (
                      <span key={option.label} className="text-xs text-ink-muted">
                        {option.label}: {option.value}
                      </span>
                    ))}
                    <span className="text-xs text-ink-muted">Qty {item.quantity}</span>
                    {item.unavailableMessage ? (
                      <span className="text-xs text-danger">{item.unavailableMessage}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {formatMoney(item.rowTotal, locale)}
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={status === 'pending'}
                      onClick={() => void removeCartItem(item.uid)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-border-subtle p-4">
          <p className="mb-3 flex items-center justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="text-base font-semibold text-ink">
              {formatMoney(cart.grandTotal, locale)}
            </span>
          </p>
          <Button
            fullWidth
            onClick={() => {
              window.location.href = '/cart';
            }}
          >
            View cart
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
