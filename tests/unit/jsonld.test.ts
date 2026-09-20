import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, productJsonLd, websiteJsonLd } from '@lib/seo/jsonld';

describe('productJsonLd', () => {
  const base = {
    name: 'Erika Running Short',
    sku: 'WSH12',
    url: 'https://shop.test/erika-running-short.html',
    inStock: true,
    price: 45,
    currency: 'USD',
  };

  it('emits a valid Product with an Offer', () => {
    const payload = productJsonLd(base) as Record<string, any>;
    expect(payload['@type']).toBe('Product');
    expect(payload['offers'].availability).toBe('https://schema.org/InStock');
    expect(payload['offers'].price).toBe(45);
  });

  it('marks out-of-stock products correctly', () => {
    const payload = productJsonLd({ ...base, inStock: false }) as Record<string, any>;
    expect(payload['offers'].availability).toBe('https://schema.org/OutOfStock');
  });

  it("converts Magento's 0–100 rating summary to a 0–5 scale", () => {
    const payload = productJsonLd({
      ...base,
      ratingValue: 73,
      reviewCount: 4,
    }) as Record<string, any>;

    expect(payload['aggregateRating']).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 3.65,
      bestRating: 5,
      reviewCount: 4,
    });
  });

  it('omits the rating entirely when there are no reviews', () => {
    const payload = productJsonLd({ ...base, ratingValue: 73, reviewCount: 0 });
    expect(payload).not.toHaveProperty('aggregateRating');
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers positions from one', () => {
    const payload = breadcrumbJsonLd([
      { name: 'Women', url: 'https://shop.test/women.html' },
      { name: 'Tops', url: 'https://shop.test/women/tops-women.html' },
    ]) as Record<string, any>;

    expect(payload['itemListElement']).toHaveLength(2);
    expect(payload['itemListElement'][0].position).toBe(1);
    expect(payload['itemListElement'][1].name).toBe('Tops');
  });
});

describe('websiteJsonLd', () => {
  it('advertises the search endpoint', () => {
    const payload = websiteJsonLd('https://shop.test', 'Demo') as Record<string, any>;
    expect(payload['potentialAction'].target).toBe(
      'https://shop.test/search?q={search_term_string}',
    );
  });
});
