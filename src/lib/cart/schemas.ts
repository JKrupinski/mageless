import { z } from 'zod';

/**
 * One schema per cart operation, shared by the React forms (via
 * `@hookform/resolvers/zod`) and by the API routes. The client validation is a
 * UX affordance; the server re-validates the same schema because a client is
 * never a trust boundary.
 */
export const addToCartSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.coerce.number().int().min(1, 'Choose at least 1').max(99, 'Maximum is 99'),
  selectedOptions: z.array(z.string().min(1)).optional(),
});

export const updateCartItemSchema = z.object({
  uid: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const removeCartItemSchema = z.object({
  uid: z.string().min(1),
});

export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(128, 'That search term is too long'),
});

export type AddToCartValues = z.output<typeof addToCartSchema>;
/** What the form fields hold before Zod coerces them (a quantity input is a string). */
export type AddToCartFieldValues = z.input<typeof addToCartSchema>;
export type SearchValues = z.infer<typeof searchSchema>;
