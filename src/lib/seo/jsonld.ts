/**
 * schema.org payloads.
 *
 * Rich results are a big part of why a storefront goes headless at all, so the
 * structured data is built from the same GraphQL data the page renders — it can
 * never drift from what the shopper sees.
 */

interface ProductSeoInput {
  name: string;
  sku: string;
  url: string;
  image?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  inStock: boolean;
  ratingValue?: number | null;
  reviewCount?: number | null;
}

export function productJsonLd(product: ProductSeoInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    url: product.url,
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.currency ?? 'USD',
      price: product.price ?? 0,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  if (product.image) payload['image'] = [product.image];
  if (product.description) payload['description'] = product.description;

  // Magento stores the rating summary as a percentage; schema.org wants 0–5.
  if (product.ratingValue && product.reviewCount) {
    payload['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: Number(((product.ratingValue / 100) * 5).toFixed(2)),
      bestRating: 5,
      reviewCount: product.reviewCount,
    };
  }

  return payload;
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org/',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function websiteJsonLd(siteUrl: string, name: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org/',
    '@type': 'WebSite',
    name,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
