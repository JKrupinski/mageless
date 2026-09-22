import { execute } from './graphql/client';
import { NavigationQuery, StoreConfigQuery } from './graphql/queries/catalog';

/** Category ids are stable per installation; Magento's default root is 2. */
const ROOT_CATEGORY_ID = '2';

/**
 * A link to a Category, carrying the size of what sits behind it. The header
 * menu, the home page's top-level row and a Category Landing's Subcategory
 * tiles are all the same thing to a shopper — a way into part of the
 * catalogue — and were drifting as three copies of one shape.
 */
export interface CategoryLink {
  uid: string;
  name: string;
  href: string;
  productCount: number | null;
}

export interface NavItem {
  uid: string;
  name: string;
  href: string;
  children: CategoryLink[];
}

/**
 * Menu and store settings are needed by every page and change on a merchandiser
 * timescale, not a request one — hence long TTLs and a per-process fallback.
 */
export async function getNavigation(): Promise<NavItem[]> {
  const result = await execute(NavigationQuery, {
    variables: { rootId: ROOT_CATEGORY_ID },
    cache: { ttl: 3600 },
  });

  return (result.categories?.items ?? []).flatMap((category) => {
    if (!category || !category.include_in_menu) return [];
    return [
      {
        uid: category.uid,
        name: category.name ?? '',
        href: `/${category.url_path ?? ''}${category.url_suffix ?? ''}`,
        children: (category.children ?? []).flatMap((child) =>
          child && child.include_in_menu
            ? [
                {
                  uid: child.uid,
                  name: child.name ?? '',
                  href: `/${child.url_path ?? ''}${child.url_suffix ?? ''}`,
                  productCount: child.product_count ?? null,
                },
              ]
            : [],
        ),
      },
    ];
  });
}

export type StoreConfig = NonNullable<Awaited<ReturnType<typeof getStoreConfig>>>;

export async function getStoreConfig() {
  const result = await execute(StoreConfigQuery, { cache: { ttl: 3600 } });
  const config = result.storeConfig;
  return {
    storeName: config?.store_name ?? 'Headless Commerce',
    locale: (config?.locale ?? 'en_US').replace('_', '-'),
    currency: config?.default_display_currency_code ?? config?.base_currency_code ?? 'USD',
    productUrlSuffix: config?.product_url_suffix ?? '.html',
    categoryUrlSuffix: config?.category_url_suffix ?? '.html',
    gridPerPage: config?.grid_per_page ?? 12,
    titlePrefix: config?.title_prefix ?? '',
    titleSuffix: config?.title_suffix ?? '',
    defaultDescription: config?.default_description ?? '',
  };
}

/** Sort options exposed in the category toolbar, mapped to Magento's enum. */
export const SORT_OPTIONS = [
  { value: 'position', label: 'Recommended' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export function toSortInput(value: string | null): Record<string, 'ASC' | 'DESC'> {
  switch (value) {
    case 'name':
      return { name: 'ASC' };
    case 'price_asc':
      return { price: 'ASC' };
    case 'price_desc':
      return { price: 'DESC' };
    default:
      return { position: 'ASC' };
  }
}

/** Aggregation codes that are noise in a facet sidebar. */
const HIDDEN_FACETS = new Set(['category_uid', 'category_id', 'price']);

export interface Facet {
  code: string;
  label: string;
  options: { label: string; value: string; count: number }[];
}

interface AggregationLike {
  attribute_code: string;
  label?: string | null;
  options?:
    readonly ({ label?: string | null; value: string; count?: number | null } | null)[] | null;
}

export function toFacets(
  aggregations: readonly (AggregationLike | null)[] | null | undefined,
): Facet[] {
  return (aggregations ?? []).flatMap((aggregation) => {
    if (!aggregation || HIDDEN_FACETS.has(aggregation.attribute_code)) return [];
    const options = (aggregation.options ?? []).flatMap((option) =>
      // Magento leaves the label null for values with no store-view label;
      // the raw value is a better fallback than an empty checkbox.
      option
        ? [{ label: option.label ?? option.value, value: option.value, count: option.count ?? 0 }]
        : [],
    );
    if (options.length === 0) return [];
    return [
      {
        code: aggregation.attribute_code,
        label: aggregation.label ?? aggregation.attribute_code,
        options,
      },
    ];
  });
}

/**
 * Attribute codes Magento exposes on `ProductAttributeFilterInput` for this
 * installation. Derived from `schema.graphql`, and re-checked whenever the
 * schema is regenerated — an attribute that is not here is simply ignored.
 */
export const FILTERABLE_ATTRIBUTES = new Set([
  'activity',
  'category_gear',
  'climate',
  'collar',
  'color',
  'eco_collection',
  'erin_recommends',
  'features_bags',
  'format',
  'gender',
  'material',
  'new',
  'pattern',
  'performance_fabric',
  'sale',
  'size',
  'sleeve',
  'strap_bags',
  'style_bags',
  'style_bottom',
  'style_general',
]);

/**
 * Translate `?color=53&size=171` into a Magento product filter.
 *
 * Only attribute codes Magento actually returned as aggregations are accepted,
 * so a crafted query string cannot reach arbitrary schema fields.
 */
export function buildProductFilters(
  searchParams: URLSearchParams,
  allowedCodes: Set<string>,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!allowedCodes.has(key) || !value) continue;
    const values = value.split(',').filter(Boolean);
    if (values.length === 0) continue;
    filters[key] = values.length === 1 ? { eq: values[0] } : { in: values };
  }

  const priceFrom = searchParams.get('price_from');
  const priceTo = searchParams.get('price_to');
  if (priceFrom || priceTo) {
    filters['price'] = {
      ...(priceFrom ? { from: priceFrom } : {}),
      ...(priceTo ? { to: priceTo } : {}),
    };
  }

  return filters;
}

/** Build a URL with one facet value toggled on or off. */
export function toggleFacetUrl(currentUrl: URL, code: string, value: string): string {
  const url = new URL(currentUrl.toString());
  const existing = (url.searchParams.get(code) ?? '').split(',').filter(Boolean);
  const next = existing.includes(value)
    ? existing.filter((entry) => entry !== value)
    : [...existing, value];

  if (next.length === 0) url.searchParams.delete(code);
  else url.searchParams.set(code, next.join(','));

  // Any filter change invalidates the current page number.
  url.searchParams.delete('p');
  return `${url.pathname}${url.search}`;
}
