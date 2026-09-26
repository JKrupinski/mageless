import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartLines } from '@/components/cart/CartLines';
import { SearchBox } from '@/components/search/SearchBox';
import { $cart, $cartDrawerOpen, $cartError, $cartStatus } from '@lib/stores/cart';
import type { CartItemSummary, CartSummary } from '@lib/cart/types';

const MAGENTO_IMAGE = 'https://magento.test/media/catalog/product/m/b/mb01-blue-0.jpg';

const line: CartItemSummary = {
  uid: 'OA==',
  name: 'Joust Duffle Bag',
  sku: '24-MB01',
  url: '/joust-duffle-bag.html',
  image: MAGENTO_IMAGE,
  quantity: 1,
  rowTotal: { value: 34, currency: 'USD' },
  options: [],
  unavailableMessage: null,
};

function cartWith(item: CartItemSummary): CartSummary {
  return { totalQuantity: 1, grandTotal: { value: 34, currency: 'USD' }, items: [item] };
}

/** The line's thumbnail: decorative, so found through the `<picture>`, not by role. */
function thumbnailIn(container: HTMLElement) {
  return container.querySelector('picture img');
}

/** The `<source>` types offered alongside an image, in document order. */
function sourceTypes(image: Element) {
  return [...(image.closest('picture')?.querySelectorAll('source') ?? [])].map((source) =>
    source.getAttribute('type'),
  );
}

/** Every width a `<source>` offers, read from its srcset descriptors. */
function offeredWidths(image: Element) {
  const srcSet = image.closest('picture')?.querySelector('source')?.getAttribute('srcset') ?? '';
  return srcSet.split(',').map((candidate) => Number(candidate.trim().split(' ')[1]!.slice(0, -1)));
}

/**
 * Asserts a thumbnail is re-served by the image endpoint, lazily, at widths
 * sized for a slot between `narrowestPx` and `widestPx` wide.
 */
function expectResponsiveThumbnail(
  image: Element | null,
  narrowestPx: number,
  widestPx = narrowestPx,
) {
  expect(image).not.toBeNull();
  expect(sourceTypes(image!)).toEqual(['image/avif', 'image/webp']);
  expect(image!.getAttribute('src')).toMatch(/^\/_image\?/);
  expect(image).toHaveAttribute('loading', 'lazy');
  // Nothing wider than a 3x screen needs: the slot, not Magento's 1080px original.
  expect(Math.max(...offeredWidths(image!))).toBeLessThanOrEqual(widestPx * 3);
  expect(Math.min(...offeredWidths(image!))).toBeGreaterThanOrEqual(narrowestPx);
}

beforeEach(() => {
  $cartError.set(null);
  $cartStatus.set('idle');
  $cartDrawerOpen.set(false);
});

describe('<CartLines> thumbnails', () => {
  it('serves each line image responsively, sized for its slot', () => {
    $cart.set(cartWith(line));
    const { container } = render(<CartLines initialCart={cartWith(line)} />);

    // 5rem on a phone, 6rem from `sm`.
    expectResponsiveThumbnail(thumbnailIn(container), 80, 96);
  });

  it('keeps the placeholder for a product with no image', () => {
    const noImage = cartWith({ ...line, image: null });
    $cart.set(noImage);
    const { container } = render(<CartLines initialCart={noImage} />);

    expect(container.querySelector('img')).toBeNull();
    // The image cell keeps its place in the line's grid, as an empty box.
    expect(container.querySelector('li > [aria-hidden="true"]')).not.toBeNull();
  });
});

describe('<CartDrawer> thumbnails', () => {
  it('serves each line image responsively, sized for its slot', () => {
    $cart.set(cartWith(line));
    $cartDrawerOpen.set(true);
    render(<CartDrawer initialCart={cartWith(line)} />);

    const drawer = screen.getByRole('dialog', { name: 'Shopping cart' });
    expectResponsiveThumbnail(thumbnailIn(drawer), 64);
  });

  it('renders no image for a product without one', () => {
    const noImage = cartWith({ ...line, image: null });
    $cart.set(noImage);
    $cartDrawerOpen.set(true);
    render(<CartDrawer initialCart={noImage} />);

    const drawer = screen.getByRole('dialog', { name: 'Shopping cart' });
    expect(drawer.querySelector('img')).toBeNull();
  });
});

describe('<SearchBox> suggestion thumbnails', () => {
  function suggest(image: string | null) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          suggestions: [
            {
              uid: 'MQ==',
              name: 'Juno Jacket',
              url: '/juno-jacket.html',
              image,
              price: { value: 77, currency: 'USD' },
            },
          ],
          totalCount: 1,
        }),
      }),
    );
  }

  async function openSuggestions() {
    render(<SearchBox />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Search products' }), 'jacket');
    return screen.findByRole('option', { name: /Juno Jacket/ });
  }

  it('serves each suggestion image responsively, sized for its slot', async () => {
    suggest(MAGENTO_IMAGE);
    const option = await openSuggestions();

    expectResponsiveThumbnail(thumbnailIn(option), 40);
  });

  it('renders no image for a product without one', async () => {
    suggest(null);
    const option = await openSuggestions();

    expect(within(option).queryByRole('img')).toBeNull();
    expect(option.querySelector('img')).toBeNull();
  });
});
