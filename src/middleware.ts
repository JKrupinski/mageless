import { defineMiddleware } from 'astro:middleware';
import { IMAGE_ENDPOINT, isStorefrontImageQuery } from '@lib/images';

const PRIVATE_PATHS = ['/cart', '/api/'];

/**
 * Per-request concerns that do not belong in any single page: the active store
 * view, cache directives, a couple of baseline security headers, and keeping
 * the image endpoint to the variants the storefront renders.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Matched on the route rather than the path, which may carry a trailing slash.
  if (
    context.routePattern === IMAGE_ENDPOINT &&
    !isStorefrontImageQuery(context.url.searchParams)
  ) {
    // Refused before the endpoint fetches the original or encodes anything.
    return new Response('Bad Request', { status: 400 });
  }

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
