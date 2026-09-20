import type { APIRoute } from 'astro';
import { removeCartItem, toCartSummary } from '@lib/cart/server';
import { removeCartItemSchema } from '@lib/cart/schemas';
import { jsonOk, parseBody, toErrorResponse } from '@lib/cart/api';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseBody(request, removeCartItemSchema);
  if (!body.ok) return body.response;

  try {
    const cart = await removeCartItem(cookies, body.data.uid);
    return jsonOk(toCartSummary(cart));
  } catch (error) {
    return toErrorResponse(error);
  }
};
