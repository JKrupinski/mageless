import type { ZodType } from 'zod';
import { GraphQLRequestError } from '../graphql/client';
import type { CartSummary } from './types';

export function jsonOk(cart: CartSummary, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, cart }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * Parse and validate a JSON body with a Zod schema, returning a 400 response
 * instead of throwing so route handlers stay linear.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError('Request body must be JSON.') };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    return { ok: false, response: jsonError(message) };
  }

  return { ok: true, data: parsed.data };
}

/** Turn an unexpected failure into a response the island can render. */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof GraphQLRequestError) {
    console.error('[cart] Magento rejected the request:', error.message);
    return jsonError(error.message, 422);
  }
  console.error('[cart] unexpected failure:', error);
  return jsonError('The cart service is temporarily unavailable.', 503);
}
