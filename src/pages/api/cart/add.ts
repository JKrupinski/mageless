import type { APIRoute } from 'astro';
import { addToCart, toCartSummary } from '@lib/cart/server';
import { addToCartSchema } from '@lib/cart/schemas';
import { jsonError, jsonOk, parseBody, toErrorResponse } from '@lib/cart/api';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseBody(request, addToCartSchema);
  if (!body.ok) return body.response;

  try {
    const result = await addToCart(cookies, body.data);
    if (result.userErrors.length > 0) {
      return jsonError(result.userErrors.map((entry) => entry.message).join('; '), 422);
    }
    return jsonOk(toCartSummary(result.cart));
  } catch (error) {
    return toErrorResponse(error);
  }
};
