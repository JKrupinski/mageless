import type { APIRoute } from 'astro';
import { execute } from '@lib/graphql/client';
import { SearchSuggestQuery } from '@lib/graphql/queries/catalog';
import { productUrl } from '@lib/format';

export const GET: APIRoute = async ({ url }) => {
  const term = (url.searchParams.get('q') ?? '').trim();

  if (term.length < 2) {
    return new Response(JSON.stringify({ suggestions: [], totalCount: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await execute(SearchSuggestQuery, {
      variables: { search: term },
      // Suggestions are identical for every shopper typing the same prefix,
      // so a short shared TTL removes most of the load from OpenSearch.
      cache: { ttl: 120 },
    });

    const suggestions = (result.products?.items ?? []).flatMap((item) =>
      item
        ? [
            {
              uid: item.uid,
              name: item.name ?? item.sku ?? '',
              url: productUrl(item),
              image: item.small_image?.url ?? null,
              price: item.price_range.minimum_price.final_price,
            },
          ]
        : [],
    );

    return new Response(
      JSON.stringify({ suggestions, totalCount: result.products?.total_count ?? 0 }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      },
    );
  } catch (error) {
    console.error('[search] suggest failed:', error);
    return new Response(JSON.stringify({ suggestions: [], totalCount: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
