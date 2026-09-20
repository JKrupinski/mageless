import { describe, expect, it } from 'vitest';
import { addToCartSchema, searchSchema, updateCartItemSchema } from '@lib/cart/schemas';

describe('addToCartSchema', () => {
  it('coerces the quantity coming from an <input type="number">', () => {
    const result = addToCartSchema.parse({ sku: 'WSH12', quantity: '3' });
    expect(result.quantity).toBe(3);
  });

  it('rejects a zero quantity', () => {
    const result = addToCartSchema.safeParse({ sku: 'WSH12', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts configurable option uids', () => {
    const result = addToCartSchema.parse({
      sku: 'WSH12',
      quantity: 1,
      selectedOptions: ['Y29uZmlndXJhYmxlLzkzLzUz'],
    });
    expect(result.selectedOptions).toHaveLength(1);
  });
});

describe('updateCartItemSchema', () => {
  it('allows zero, which Magento treats as a removal', () => {
    expect(updateCartItemSchema.parse({ uid: 'OA==', quantity: 0 }).quantity).toBe(0);
  });
});

describe('searchSchema', () => {
  it('trims and requires two characters', () => {
    expect(searchSchema.parse({ q: '  jacket ' }).q).toBe('jacket');
    expect(searchSchema.safeParse({ q: ' a ' }).success).toBe(false);
  });
});
