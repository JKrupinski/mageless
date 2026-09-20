import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddToCartForm } from '@/components/product/AddToCartForm';
import { $cart, $cartError, $cartStatus } from '@lib/stores/cart';
import { EMPTY_CART } from '@lib/cart/types';

const options = [
  {
    uid: 'opt-color',
    attributeCode: 'color',
    label: 'Color',
    values: [
      { uid: 'color-green', label: 'Green', swatch: '#0a0' },
      { uid: 'color-red', label: 'Red', swatch: '#a00' },
    ],
  },
  {
    uid: 'opt-size',
    attributeCode: 'size',
    label: 'Size',
    values: [
      { uid: 'size-28', label: '28', swatch: null },
      { uid: 'size-29', label: '29', swatch: null },
    ],
  },
];

// Green exists in 28 only; Red exists in 29 only.
const variants = [
  {
    optionUids: ['color-green', 'size-28'],
    sku: 'WSH12-28-Green',
    inStock: true,
    final: { value: 45, currency: 'USD' },
    regular: { value: 45, currency: 'USD' },
    percentOff: null,
  },
  {
    optionUids: ['color-red', 'size-29'],
    sku: 'WSH12-29-Red',
    inStock: false,
    final: { value: 45, currency: 'USD' },
    regular: { value: 45, currency: 'USD' },
    percentOff: null,
  },
];

const baseProps = {
  sku: 'WSH12',
  name: 'Erika Running Short',
  inStock: true,
  final: { value: 45, currency: 'USD' },
  regular: { value: 45, currency: 'USD' },
  percentOff: null,
};

describe('<AddToCartForm>', () => {
  beforeEach(() => {
    $cart.set(EMPTY_CART);
    $cartStatus.set('idle');
    $cartError.set(null);
  });

  it('adds a simple product straight away', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, cart: { ...EMPTY_CART, totalQuantity: 1 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AddToCartForm {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      sku: 'WSH12',
      quantity: 1,
    });
    expect(await screen.findByText(/added to your cart/i)).toBeInTheDocument();
  });

  it('requires every configurable option before allowing a submit', () => {
    render(<AddToCartForm {...baseProps} options={options} variants={variants} />);
    expect(screen.getByRole('button', { name: 'Select options' })).toBeDisabled();
  });

  it('disables option values that no variant can satisfy', async () => {
    render(<AddToCartForm {...baseProps} options={options} variants={variants} />);

    await userEvent.click(screen.getByRole('radio', { name: /Green/ }));

    // Green only exists in size 28, so 29 must become unselectable.
    expect(screen.getByRole('radio', { name: '29' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '28' })).toBeEnabled();
  });

  it('sends the selected option uids with the parent sku', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, cart: { ...EMPTY_CART, totalQuantity: 1 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AddToCartForm {...baseProps} options={options} variants={variants} />);
    await userEvent.click(screen.getByRole('radio', { name: /Green/ }));
    await userEvent.click(screen.getByRole('radio', { name: '28' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      sku: 'WSH12',
      quantity: 1,
      selectedOptions: ['color-green', 'size-28'],
    });
  });

  it('refuses to add an out-of-stock variant', async () => {
    render(<AddToCartForm {...baseProps} options={options} variants={variants} />);
    await userEvent.click(screen.getByRole('radio', { name: /Red/ }));
    await userEvent.click(screen.getByRole('radio', { name: '29' }));

    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('shows the error the cart endpoint returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false, message: 'Not enough stock.' }),
      }),
    );

    render(<AddToCartForm {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(await screen.findByText('Not enough stock.')).toBeInTheDocument();
  });
});
