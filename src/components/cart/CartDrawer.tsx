import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { ShoppingBag, X } from 'lucide-react';
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
import { Picture } from '@ui/Picture';
import { IMAGE_PRESETS } from '@lib/images';

export interface CartDrawerProps {
  /** SSR snapshot so the badge and contents are right on first paint. */
  initialCart: CartSummary;
  locale?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
      if (event.key === 'Escape') {
        closeCartDrawer();
        return;
      }
      // `aria-modal` tells assistive technology the rest of the page is inert;
      // it does nothing to the Tab order. Without this, tabbing walks straight
      // out of the drawer and into the page behind the scrim (WCAG 2.1.2).
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
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
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-scrim animate-fade-in"
        onClick={closeCartDrawer}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        className={[
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col',
          'bg-surface shadow-xl outline-none',
          'animate-slide-in-right motion-reduce:animate-none',
        ].join(' ')}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
            Cart
            {cart.totalQuantity > 0 && (
              <span className="numeric ml-2 font-normal text-ink-muted">
                ({cart.totalQuantity})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Close cart"
            className="-mr-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <ShoppingBag className="size-7 text-ink-subtle" aria-hidden="true" />
              <p className="mt-4 text-sm font-medium text-ink">Your cart is empty</p>
              <p className="mt-1 text-sm text-ink-muted">Everything you add shows up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.items.map((item) => (
                <li key={item.uid} className="flex gap-4 py-4">
                  {item.image ? (
                    <Picture
                      src={item.image}
                      preset={IMAGE_PRESETS.cartDrawerLine}
                      alt=""
                      width={64}
                      height={80}
                      loading="lazy"
                      className="h-20 w-16 shrink-0 rounded-control bg-surface-sunken object-cover"
                    />
                  ) : null}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <a
                      href={item.url}
                      className="text-sm font-medium text-ink underline-offset-2 hover:underline"
                    >
                      {item.name}
                    </a>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {item.options.map((option) => (
                        <span key={option.label} className="text-xs text-ink-muted">
                          {option.label}: {option.value}
                        </span>
                      ))}
                      <span className="numeric text-xs text-ink-muted">Qty {item.quantity}</span>
                    </div>
                    {item.unavailableMessage ? (
                      <span className="mt-1 text-xs font-medium text-danger">
                        {item.unavailableMessage}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="numeric text-sm font-semibold text-ink">
                      {formatMoney(item.rowTotal, locale)}
                    </span>
                    {/* A text link rather than a bordered button: one framed
                        control per line turns the list into a row of boxes and
                        competes with the drawer's own primary action. */}
                    <button
                      type="button"
                      disabled={status === 'pending'}
                      onClick={() => void removeCartItem(item.uid)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="cursor-pointer text-xs text-ink-muted underline-offset-2 transition-colors hover:text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && (
          <footer className="border-t border-line px-5 py-4">
            <p className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-ink-muted">Subtotal</span>
              <span className="numeric text-lg font-semibold text-ink">
                {formatMoney(cart.grandTotal, locale)}
              </span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Shipping and taxes are calculated at checkout.
            </p>
            <Button
              fullWidth
              size="lg"
              className="mt-4"
              onClick={() => {
                window.location.href = '/cart';
              }}
            >
              View cart
            </Button>
            <button
              type="button"
              onClick={closeCartDrawer}
              className="mt-2 w-full cursor-pointer py-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Continue shopping
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
