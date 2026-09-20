import type { APIRoute } from 'astro';
import { execute } from '@lib/graphql/client';
import { SitemapQuery } from '@lib/graphql/queries/catalog';

const PAGE_SIZE = 200;
const MAX_PRODUCT_PAGES = 25; // 5 000 URLs — plenty for a demo catalogue.

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });
}

/**
 * A sitemap generated from the live catalogue.
 *
 * An SSR storefront cannot lean on Astro's static sitemap integration, because
 * the route list only exists in Magento — so we page through the catalogue and
 * cache the result for an hour.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site?.toString() ?? url.origin).replace(/\/$/, '');
  const locations: string[] = [origin + '/'];

  const first = await execute(SitemapQuery, {
    variables: { pageSize: PAGE_SIZE, currentPage: 1 },
    cache: { ttl: 3600 },
  });

  const walkCategories = (
    nodes:
      | readonly ({
          url_path?: string | null;
          url_suffix?: string | null;
          children?: readonly (unknown | null)[] | null;
        } | null)[]
      | null
      | undefined,
  ): void => {
    for (const node of nodes ?? []) {
      if (!node?.url_path) continue;
      locations.push(`${origin}/${node.url_path}${node.url_suffix ?? ''}`);
      walkCategories(node.children as Parameters<typeof walkCategories>[0]);
    }
  };

  walkCategories(first.categories?.items);

  const totalPages = Math.min(first.products?.page_info?.total_pages ?? 1, MAX_PRODUCT_PAGES);

  const collectProducts = (
    items:
      | readonly ({ url_key?: string | null; url_suffix?: string | null } | null)[]
      | null
      | undefined,
  ) => {
    for (const item of items ?? []) {
      if (!item?.url_key) continue;
      locations.push(`${origin}/${item.url_key}${item.url_suffix ?? ''}`);
    }
  };

  collectProducts(first.products?.items);

  // Remaining pages are fetched concurrently; each is individually cached.
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      execute(SitemapQuery, {
        variables: { pageSize: PAGE_SIZE, currentPage: index + 2 },
        cache: { ttl: 3600 },
      }).catch(() => null),
    ),
  );

  for (const page of rest) collectProducts(page?.products?.items);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map((location) => `  <url><loc>${escapeXml(location)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
