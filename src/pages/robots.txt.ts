import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site?.toString() ?? url.origin).replace(/\/$/, '');

  const body = [
    'User-agent: *',
    'Allow: /',
    // Faceted and paginated URLs are infinite in practice; keep crawlers on the
    // canonical category and product pages.
    'Disallow: /search',
    'Disallow: /cart',
    'Disallow: /api/',
    'Disallow: /*?sort=',
    'Disallow: /*?p=',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
