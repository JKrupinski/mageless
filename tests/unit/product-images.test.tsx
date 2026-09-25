import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';

const product: ProductCardData = {
  uid: 'MTIzNA==',
  sku: 'WSH12',
  name: 'Erika Running Short',
  url_key: 'erika-running-short',
  url_suffix: '.html',
  stock_status: 'IN_STOCK',
  rating_summary: 0,
  review_count: 0,
  small_image: { url: 'https://magento.test/media/wsh12.jpg', label: 'Erika Running Short' },
  price_range: {
    minimum_price: {
      regular_price: { value: 45, currency: 'USD' },
      final_price: { value: 45, currency: 'USD' },
      discount: { amount_off: 0, percent_off: 0 },
    },
    maximum_price: { final_price: { value: 45, currency: 'USD' } },
  },
};

/** The `<source>` types offered alongside an image, in document order. */
function sourceTypes(image: HTMLElement) {
  return [...(image.closest('picture')?.querySelectorAll('source') ?? [])].map((source) =>
    source.getAttribute('type'),
  );
}

describe('<ProductCard> image', () => {
  it('offers modern formats before the JPEG fallback', () => {
    render(<ProductCard product={product} />);
    const image = screen.getByRole('img', { name: 'Erika Running Short' });

    expect(sourceTypes(image)).toEqual(['image/avif', 'image/webp']);
    expect(image.getAttribute('src')).toContain('f=jpeg');
  });

  it('loads an above-the-fold tile eagerly and at high priority', () => {
    render(<ProductCard product={product} priority />);
    const image = screen.getByRole('img', { name: 'Erika Running Short' });

    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });

  it('leaves every other tile lazy', () => {
    render(<ProductCard product={product} />);
    const image = screen.getByRole('img', { name: 'Erika Running Short' });

    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('fetchpriority', 'auto');
  });

  it('keeps the placeholder when the product has no image', () => {
    render(<ProductCard product={{ ...product, small_image: null }} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('No image')).toBeInTheDocument();
  });
});

describe('<ProductGallery> images', () => {
  const images = [
    { url: 'https://magento.test/media/front.jpg', label: 'Front' },
    { url: 'https://magento.test/media/back.jpg', label: 'Back' },
  ];

  it('serves the main image in modern formats at high priority', () => {
    render(<ProductGallery images={images} productName="Erika Running Short" />);
    const main = screen.getByRole('img', { name: 'Front' });

    expect(sourceTypes(main)).toEqual(['image/avif', 'image/webp']);
    expect(main).toHaveAttribute('fetchpriority', 'high');
    expect(main).not.toHaveAttribute('loading', 'lazy');
  });

  it('serves thumbnails responsively and lazily', () => {
    render(<ProductGallery images={images} productName="Erika Running Short" />);
    const thumbnail = screen
      .getByRole('button', { name: 'Show image 2 of 2' })
      .querySelector('img')!;

    expect(sourceTypes(thumbnail)).toEqual(['image/avif', 'image/webp']);
    expect(thumbnail).toHaveAttribute('loading', 'lazy');
  });

  it('swaps every format of the main image when a thumbnail is chosen', async () => {
    render(<ProductGallery images={images} productName="Erika Running Short" />);

    await userEvent.click(screen.getByRole('button', { name: 'Show image 2 of 2' }));
    const main = screen.getByRole('img', { name: 'Back' });
    const candidates = [
      main.getAttribute('src'),
      ...[...main.closest('picture')!.querySelectorAll('source')].map((source) =>
        source.getAttribute('srcset'),
      ),
    ];

    for (const candidate of candidates) {
      expect(candidate).toContain(encodeURIComponent('back.jpg'));
      expect(candidate).not.toContain(encodeURIComponent('front.jpg'));
    }
  });
});
