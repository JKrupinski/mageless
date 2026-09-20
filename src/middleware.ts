import { defineMiddleware } from 'astro:middleware';

const PRIVATE_PATHS = ['/cart', '/api/'];

/**
 * Per-request concerns that do not belong in any single page: the active store
 * view, cache directives, and a couple of baseline security headers.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.storeCode = import.meta.env['PUBLIC_MAGENTO_STORE_CODE'] ?? 'default';

  const response = await next();
  const path = context.url.pathname;
  const isPrivate =
    context.locals.noStore || PRIVATE_PATHS.some((prefix) => path.startsWith(prefix));

  if (response.headers.get('Content-Type')?.includes('text/html')) {
    response.headers.set(
      'Cache-Control',
      isPrivate
        ? 'private, no-store'
        : // Catalogue HTML is identical for every guest, so a shared cache may
          // hold it briefly and revalidate in the background.
          'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    );
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
});
