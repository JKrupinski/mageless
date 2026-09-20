import { atom } from 'nanostores';
import { EMPTY_CART, type CartSummary } from '../cart/types';

/**
 * Client-side cart state.
 *
 * Nanostores keeps this framework-agnostic and tiny (~1 kB), which matters
 * because the header island ships on every page. The store is hydrated from the
 * SSR render, so the badge is correct on first paint with no request on load.
 */
export const $cart = atom<CartSummary>(EMPTY_CART);
export const $cartStatus = atom<'idle' | 'pending' | 'error'>('idle');
export const $cartError = atom<string | null>(null);
export const $cartDrawerOpen = atom(false);

/*
 * Deliberately no `computed()` derivations of `$cart`.
 *
 * A computed store only recomputes while it has listeners, so the very first
 * read during hydration can return a stale value — which shows up as a server/
 * client mismatch on the cart badge. Components read `$cart` and derive what
 * they need locally instead.
 */

let hydrated = false;

/** Seed the store from server-rendered data; ignores later duplicate calls. */
export function hydrateCart(cart: CartSummary): void {
  if (hydrated) return;
  $cart.set(cart);
  hydrated = true;
}

export function openCartDrawer(): void {
  $cartDrawerOpen.set(true);
}

export function closeCartDrawer(): void {
  $cartDrawerOpen.set(false);
}

async function mutate(path: string, body: unknown): Promise<CartSummary> {
  $cartStatus.set('pending');
  $cartError.set(null);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as
      { ok: true; cart: CartSummary } | { ok: false; message: string };

    if (!response.ok || payload.ok === false) {
      const message = payload.ok === false ? payload.message : 'Cart update failed.';
      $cartError.set(message);
      $cartStatus.set('error');
      throw new Error(message);
    }

    $cart.set(payload.cart);
    $cartStatus.set('idle');
    return payload.cart;
  } catch (error) {
    $cartStatus.set('error');
    if (!$cartError.get()) {
      $cartError.set(error instanceof Error ? error.message : 'Cart update failed.');
    }
    throw error;
  }
}

export function addToCart(input: {
  sku: string;
  quantity: number;
  selectedOptions?: string[];
}): Promise<CartSummary> {
  return mutate('/api/cart/add', input);
}

export function updateCartItem(uid: string, quantity: number): Promise<CartSummary> {
  return mutate('/api/cart/update', { uid, quantity });
}

export function removeCartItem(uid: string): Promise<CartSummary> {
  return mutate('/api/cart/remove', { uid });
}
