import type { APIRoute } from 'astro';
import { toCartSummary, updateCartItem } from '@lib/cart/server';
import { updateCartItemSchema } from '@lib/cart/schemas';
import { jsonOk, parseBody, toErrorResponse } from '@lib/cart/api';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseBody(request, updateCartItemSchema);
  if (!body.ok) return body.response;

  try {
    // Magento treats quantity 0 as a removal, which is exactly what the
    // quantity stepper needs when a shopper steps below one.
    const cart = await updateCartItem(cookies, body.data.uid, body.data.quantity);
    return jsonOk(toCartSummary(cart));
  } catch (error) {
    return toErrorResponse(error);
  }
};
