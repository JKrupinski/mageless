import { describe, expect, it } from 'vitest';
import {
  FILTERABLE_ATTRIBUTES,
  buildProductFilters,
  toFacets,
  toSortInput,
  toggleFacetUrl,
} from '@lib/catalog';

describe('toSortInput', () => {
  it('maps the toolbar values to Magento sort inputs', () => {
    expect(toSortInput('price_asc')).toEqual({ price: 'ASC' });
    expect(toSortInput('price_desc')).toEqual({ price: 'DESC' });
    expect(toSortInput('name')).toEqual({ name: 'ASC' });
  });

  it('falls back to position for anything unknown', () => {
    expect(toSortInput('injected')).toEqual({ position: 'ASC' });
    expect(toSortInput(null)).toEqual({ position: 'ASC' });
  });
});

describe('buildProductFilters', () => {
  it('builds eq and in filters from the query string', () => {
    const params = new URLSearchParams('color=53&size=171,172');
    expect(buildProductFilters(params, FILTERABLE_ATTRIBUTES)).toEqual({
      color: { eq: '53' },
      size: { in: ['171', '172'] },
    });
  });

  it('ignores attribute codes Magento does not expose as filters', () => {
    const params = new URLSearchParams('sku=X&__proto__=evil&price_range=1');
    expect(buildProductFilters(params, FILTERABLE_ATTRIBUTES)).toEqual({});
  });

  it('turns price_from/price_to into a range filter', () => {
    const params = new URLSearchParams('price_from=20&price_to=40');
    expect(buildProductFilters(params, FILTERABLE_ATTRIBUTES)).toEqual({
      price: { from: '20', to: '40' },
    });
  });
});

describe('toggleFacetUrl', () => {
  const url = new URL('https://shop.test/women/tops-women.html?color=53&p=3');

  it('adds a value and resets pagination', () => {
    expect(toggleFacetUrl(url, 'size', '171')).toBe('/women/tops-women.html?color=53&size=171');
  });

  it('removes a value that is already active', () => {
    expect(toggleFacetUrl(url, 'color', '53')).toBe('/women/tops-women.html');
  });

  it('appends to a multi-value facet', () => {
    const multi = new URL('https://shop.test/c.html?size=171');
    expect(toggleFacetUrl(multi, 'size', '172')).toBe('/c.html?size=171%2C172');
  });
});

describe('toFacets', () => {
  it('drops aggregations that are not useful as facets', () => {
    const facets = toFacets([
      {
        attribute_code: 'price',
        label: 'Price',
        options: [{ label: '20-30', value: '20_30', count: 3 }],
      },
      {
        attribute_code: 'category_uid',
        label: 'Category',
        options: [{ label: 'Tops', value: 'x', count: 3 }],
      },
      {
        attribute_code: 'color',
        label: 'Color',
        options: [{ label: 'Green', value: '53', count: 8 }],
      },
    ]);

    expect(facets).toHaveLength(1);
    expect(facets[0]).toEqual({
      code: 'color',
      label: 'Color',
      options: [{ label: 'Green', value: '53', count: 8 }],
    });
  });

  it('drops facets with no options and tolerates nulls', () => {
    expect(toFacets([{ attribute_code: 'size', label: 'Size', options: [] }, null])).toEqual([]);
    expect(toFacets(null)).toEqual([]);
  });
});
