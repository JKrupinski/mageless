import { describe, expect, it } from 'vitest';
import {
  classNames,
  discountPercent,
  formatMoney,
  productUrl,
  categoryUrl,
  toPlainText,
} from '@lib/format';

describe('formatMoney', () => {
  it('formats a Magento money object in the given locale', () => {
    expect(formatMoney({ value: 45, currency: 'USD' })).toBe('$45.00');
    expect(formatMoney({ value: 45, currency: 'EUR' }, 'de-DE')).toMatch(/45,00/);
  });

  it('falls back to an em dash when the value is missing', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney({ currency: 'USD' })).toBe('—');
  });

  it('treats zero as a real price, not a missing one', () => {
    expect(formatMoney({ value: 0, currency: 'USD' })).toBe('$0.00');
  });
});

describe('url builders', () => {
  it('mirrors the Magento rewrite for products and categories', () => {
    expect(productUrl({ url_key: 'erika-running-short', url_suffix: '.html' })).toBe(
      '/erika-running-short.html',
    );
    expect(categoryUrl({ url_path: 'women/tops-women', url_suffix: '.html' })).toBe(
      '/women/tops-women.html',
    );
  });

  it('survives a product without a suffix configured', () => {
    expect(productUrl({ url_key: 'bag', url_suffix: null })).toBe('/bag');
  });
});

describe('toPlainText', () => {
  it('strips markup and entities', () => {
    expect(toPlainText('<p>Soft &amp; light</p>')).toBe('Soft & light');
  });

  it('truncates with an ellipsis at the limit', () => {
    const result = toPlainText('<p>' + 'a'.repeat(200) + '</p>', 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns an empty string for missing input', () => {
    expect(toPlainText(null)).toBe('');
  });
});

describe('discountPercent', () => {
  it('rounds real discounts and ignores noise below one percent', () => {
    expect(discountPercent(23.6)).toBe(24);
    expect(discountPercent(0.4)).toBeNull();
    expect(discountPercent(null)).toBeNull();
  });
});

describe('classNames', () => {
  it('drops falsy values', () => {
    expect(classNames('a', false, null, undefined, 'b')).toBe('a b');
  });
});
