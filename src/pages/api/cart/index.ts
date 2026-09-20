import type { APIRoute } from 'astro';
import { getCart, toCartSummary } from '@lib/cart/server';
import { jsonOk, toErrorResponse } from '@lib/cart/api';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    return jsonOk(toCartSummary(await getCart(cookies)));
  } catch (error) {
    return toErrorResponse(error);
  }
};
