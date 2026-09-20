import { describe, expect, it } from 'vitest';
import { toProductViewModel } from '@lib/viewmodels/product';

const SITE = 'https://shop.test';

/** Shaped like one item of `ProductPageQuery`, trimmed to what the mapper reads. */
function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'MQ==',
    sku: 'WSH12',
    name: 'Erika Running Short',
    url_key: 'erika-running-short',
    url_suffix: '.html',
    stock_status: 'IN_STOCK',
    only_x_left_in_stock: 3,
    rating_summary: 80,
    review_count: 5,
    meta_title: 'Erika Running Short',
    meta_description: 'A short for running',
    description: { html: '<p>Long copy</p>' },
    short_description: { html: '<p>Short copy</p>' },
    image: { url: 'https://magento.test/fallback.jpg', label: 'fallback' },
    media_gallery: [
      { url: 'https://magento.test/b.jpg', label: 'B', position: 2, disabled: false },
      { url: 'https://magento.test/a.jpg', label: 'A', position: 1, disabled: false },
      { url: 'https://magento.test/hidden.jpg', label: 'H', position: 3, disabled: true },
    ],
    price_range: {
      minimum_price: {
        regular_price: { value: 45, currency: 'USD' },
        final_price: { value: 36, currency: 'USD' },
        discount: { amount_off: 9, percent_off: 20 },
      },
      maximum_price: { final_price: { value: 45, currency: 'USD' } },
    },
    categories: [
      {
        uid: 'MjA=',
        name: 'Women',
        url_path: 'women',
        url_suffix: '.html',
        breadcrumbs: null,
      },
      {
        uid: 'MjE=',
        name: 'Tops',
        url_path: 'women/tops-women',
        url_suffix: '.html',
        breadcrumbs: [{ category_name: 'Women', category_url_path: 'women' }],
      },
    ],
    ...overrides,
    // The fixture is intentionally partial: the mapper only reads these fields.
  } as any;
}

describe('toProductViewModel', () => {
  it('orders the gallery by position and drops disabled images', () => {
    const model = toProductViewModel(makeProduct(), SITE);

    expect(model.gallery.map((image) => image.url)).toEqual([
      'https://magento.test/a.jpg',
      'https://magento.test/b.jpg',
    ]);
  });

  it('falls back to the main image when the gallery is empty', () => {
    const model = toProductViewModel(makeProduct({ media_gallery: [] }), SITE);
    expect(model.gallery).toEqual([
      { url: 'https://magento.test/fallback.jpg', label: 'fallback' },
    ]);
  });

  it('builds breadcrumbs from the deepest category, not the first', () => {
    const model = toProductViewModel(makeProduct(), SITE);

    expect(model.breadcrumbs.map((crumb) => crumb.name)).toEqual([
      'Women',
      'Tops',
      'Erika Running Short',
    ]);
    expect(model.breadcrumbs[1]?.href).toBe('/women/tops-women.html');
  });

  it('maps configurable options and variants for the picker', () => {
    const model = toProductViewModel(
      makeProduct({
        configurable_options: [
          {
            uid: 'opt',
            attribute_code: 'color',
            label: 'Color',
            values: [{ uid: 'v-green', label: 'Green', swatch_data: { value: '#0a0' } }],
          },
          // No attribute code: cannot be matched to a variant, so it is dropped.
          { uid: 'broken', attribute_code: null, label: 'Broken', values: [] },
        ],
        variants: [
          {
            attributes: [{ code: 'color', uid: 'v-green', label: 'Green' }],
            product: {
              uid: 'MQ==',
              sku: 'WSH12-Green',
              name: 'Green',
              stock_status: 'OUT_OF_STOCK',
              only_x_left_in_stock: null,
              image: null,
              price_range: {
                minimum_price: {
                  regular_price: { value: 45, currency: 'USD' },
                  final_price: { value: 45, currency: 'USD' },
                  discount: { amount_off: 0, percent_off: 0 },
                },
                maximum_price: { final_price: { value: 45, currency: 'USD' } },
              },
            },
          },
        ],
      }),
      SITE,
    );

    expect(model.options).toHaveLength(1);
    expect(model.options[0]?.values[0]).toEqual({
      uid: 'v-green',
      label: 'Green',
      swatch: '#0a0',
    });
    expect(model.variants[0]).toMatchObject({
      optionUids: ['v-green'],
      sku: 'WSH12-Green',
      inStock: false,
    });
  });

  it('emits Product and BreadcrumbList structured data with absolute URLs', () => {
    const model = toProductViewModel(makeProduct(), SITE);
    const [product, breadcrumbs] = model.jsonLd as Record<string, any>[];

    expect(product?.['@type']).toBe('Product');
    expect(product?.['offers'].url).toBe('https://shop.test/erika-running-short.html');
    expect(product?.['offers'].price).toBe(36);
    expect(breadcrumbs?.['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs?.['itemListElement'][0].item).toBe('https://shop.test/women.html');
  });

  it('reports stock from the parent product', () => {
    const outOfStock = toProductViewModel(makeProduct({ stock_status: 'OUT_OF_STOCK' }), SITE);
    expect(outOfStock.inStock).toBe(false);
    expect(toProductViewModel(makeProduct(), SITE).inStock).toBe(true);
  });
});
