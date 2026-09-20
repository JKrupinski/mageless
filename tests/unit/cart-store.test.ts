import { beforeEach, describe, expect, it, vi } from 'vitest';
import { $cart, $cartError, $cartStatus, addToCart, removeCartItem } from '@lib/stores/cart';
import { EMPTY_CART } from '@lib/cart/types';

const cartWithOneItem = {
  totalQuantity: 2,
  grandTotal: { value: 68, currency: 'USD' },
  items: [
    {
      uid: 'OA==',
      name: 'Joust Duffle Bag',
      sku: '24-MB01',
      url: '/joust-duffle-bag.html',
      image: null,
      quantity: 2,
      rowTotal: { value: 68, currency: 'USD' },
      options: [],
      unavailableMessage: null,
    },
  ],
};

describe('cart store', () => {
  beforeEach(() => {
    $cart.set(EMPTY_CART);
    $cartError.set(null);
    $cartStatus.set('idle');
  });

  it('stores the cart the server returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, cart: cartWithOneItem }),
      }),
    );

    await addToCart({ sku: '24-MB01', quantity: 2 });

    expect($cart.get().totalQuantity).toBe(2);
    expect($cartStatus.get()).toBe('idle');
  });

  it('surfaces a Magento user error without wiping the current cart', async () => {
    $cart.set(cartWithOneItem);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false, message: 'The product is out of stock.' }),
      }),
    );

    await expect(addToCart({ sku: 'WSH12', quantity: 1 })).rejects.toThrow(
      'The product is out of stock.',
    );

    expect($cartStatus.get()).toBe('error');
    expect($cartError.get()).toBe('The product is out of stock.');
    expect($cart.get().totalQuantity).toBe(2);
  });

  it('reports a network failure as an error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(removeCartItem('OA==')).rejects.toThrow('offline');
    expect($cartStatus.get()).toBe('error');
    expect($cartError.get()).toBe('offline');
  });
});
