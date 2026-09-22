import type { ResultOf } from 'gql.tada';
import type { CategoryPageQuery } from '../graphql/queries/catalog';
import type { ProductCardData } from '@/components/product/ProductCard';
import { FILTERABLE_ATTRIBUTES, buildProductFilters, toFacets, type Facet } from '../catalog';
import { breadcrumbJsonLd, itemListJsonLd } from '../seo/jsonld';
import { productUrl, toPlainText } from '../format';

type CategoryPageResult = ResultOf<typeof CategoryPageQuery>;

export type CategoryNode = NonNullable<
  NonNullable<NonNullable<CategoryPageResult['categories']>['items']>[number]
>;

type CategoryProducts = CategoryPageResult['products'];

/** A direct child of the Category, as a tile a shopper can descend through. */
export interface SubcategoryTile {
  uid: string;
  name: string;
  href: string;
  productCount: number | null;
}

/** A paginated, faceted page of the products assigned to this Category. */
export interface CategoryListing {
  products: readonly (ProductCardData | null)[];
  facets: Facet[];
  totalCount: number;
  totalPages: number;
  /**
   * True when the shopper narrowed the listing themselves. An empty listing
   * means two different things — "your filters excluded everything" and "there
   * is nothing here" — and only one of them is the shopper's doing.
   */
  filtered: boolean;
}

/** A merchandised row borrowed from a descendant, not a rollup of one. */
export interface FeaturedStrip {
  name: string;
  href: string;
  /** How many products the descendant holds, which is not the strip's length. */
  totalCount: number;
  products: readonly (ProductCardData | null)[];
}

export interface CategoryViewModel {
  name: string;
  descriptionHtml: string | null;
  breadcrumbs: { name: string; href: string }[];
  /** Empty unless the Display Mode presents Subcategories. */
  subcategories: SubcategoryTile[];
  /** Null unless the Display Mode presents a listing, or products demand one. */
  listing: CategoryListing | null;
  /** Null unless a Category Landing needs merchandising it cannot supply itself. */
  featured: FeaturedStrip | null;
  /**
   * True when none of the three regions above rendered. An empty listing does
   * not count: it is a region, and it explains itself.
   */
  isEmpty: boolean;
  seo: { title: string; description: string };
  jsonLd: Record<string, unknown>[];
}

export interface CategoryViewModelInput {
  node: CategoryNode;
  products: CategoryProducts;
  siteUrl: string;
  /** The URL as requested, which is how a filtered listing is recognised. */
  url: URL;
}

export interface CategoryViewModelDeps {
  /** Fetches the merchandising strip for one descendant Category. */
  fetchFeatured(categoryUid: string): Promise<{
    totalCount: number;
    products: readonly (ProductCardData | null)[];
  }>;
}

/** How many products a Category Landing's merchandising strip shows. */
export const FEATURED_STRIP_SIZE = 8;

/**
 * The fields a Subcategory is read for, at either level of the tree. The two
 * levels have different GraphQL types — only the first carries `children` —
 * and every helper below works on both.
 */
interface DescendantNode {
  uid: string;
  name?: string | null;
  url_path?: string | null;
  url_suffix?: string | null;
  include_in_menu?: number | null;
  product_count?: number | null;
}

type ChildNode = DescendantNode & { children?: readonly (DescendantNode | null)[] | null };

const href = (node: { url_path?: string | null; url_suffix?: string | null }) =>
  `/${node.url_path ?? ''}${node.url_suffix ?? ''}`;

/**
 * Magento's own vocabulary for what a Category presents. `display_mode` is
 * typed `String` in the schema rather than an enum, and comes back null on a
 * Category nobody ever configured.
 */
function presentation(displayMode: string | null | undefined) {
  return {
    // Anything unrecognised, null included, keeps the listing a Category had
    // before Display Mode was honoured at all.
    listing: displayMode !== 'PAGE',
    subcategories: displayMode === 'PAGE' || displayMode === 'PRODUCTS_AND_PAGE',
  };
}

const visible = <T extends DescendantNode>(child: T | null): child is T =>
  Boolean(child && child.include_in_menu);

function toTile(child: DescendantNode): SubcategoryTile {
  return {
    uid: child.uid,
    name: child.name ?? '',
    href: href(child),
    productCount: child.product_count ?? null,
  };
}

/**
 * The busiest descendant worth merchandising.
 *
 * Searches grandchildren as well as children, because a department's own
 * Subcategories are frequently Landings too: Women → Tops carries products,
 * but a tree one level deeper may be where the stock actually sits. A
 * descendant with no products is no use as a strip, so it is skipped rather
 * than fetched and discarded.
 */
function busiestDescendant(children: readonly (ChildNode | null)[]): DescendantNode | null {
  const candidates: DescendantNode[] = children
    .filter(visible)
    .flatMap((child) => [child, ...(child.children ?? []).filter(visible)]);

  return (
    candidates
      .filter((child) => (child.product_count ?? 0) > 0)
      .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))[0] ?? null
  );
}

/**
 * Turns one Magento Category into everything its page needs.
 *
 * Every decision about *what a Category is* lives here: which of the three
 * regions — Subcategory tiles, product listing, merchandising strip — the page
 * renders, and whether an empty result is the shopper's filtering or an empty
 * shop. The page itself only renders what it is handed.
 *
 * The strip is fetched through `deps` rather than queried here, so the whole
 * decision tree is exercised in unit tests without a running Magento.
 */
export async function toCategoryViewModel(
  { node, products, siteUrl, url }: CategoryViewModelInput,
  deps: CategoryViewModelDeps,
): Promise<CategoryViewModel> {
  const presents = presentation(node.display_mode);
  const items = [...(products?.items ?? [])];
  const totalCount = products?.total_count ?? 0;

  const children = node.children ?? [];
  const subcategories = presents.subcategories ? children.filter(visible).map(toTile) : [];

  /*
   * Gear reports PAGE and has 33 products assigned to it directly. Honouring
   * the Display Mode strictly would hide them, and unlike Luma we have no
   * Widget Content to put in that space (ADR-0002) — so a Landing with its own
   * products shows them.
   */
  const listing: CategoryListing | null =
    presents.listing || totalCount > 0
      ? {
          products: items,
          facets: toFacets(products?.aggregations),
          totalCount,
          totalPages: products?.page_info?.total_pages ?? 1,
          filtered:
            Object.keys(buildProductFilters(url.searchParams, FILTERABLE_ATTRIBUTES)).length > 0,
        }
      : null;

  // A Landing that renders its own products is already merchandised; a second
  // row of somebody else's would only compete with it.
  const source = listing === null ? busiestDescendant(children) : null;
  const strip = source ? await deps.fetchFeatured(source.uid) : null;
  const featured: FeaturedStrip | null =
    source && strip && strip.products.length > 0
      ? {
          name: source.name ?? '',
          href: href(source),
          totalCount: strip.totalCount,
          products: strip.products,
        }
      : null;

  const breadcrumbs = [
    ...(node.breadcrumbs ?? []).flatMap((crumb) =>
      crumb
        ? [
            {
              name: crumb.category_name ?? '',
              href: `/${crumb.category_url_path ?? ''}${node.url_suffix ?? ''}`,
            },
          ]
        : [],
    ),
    { name: node.name ?? '', href: href(node) },
  ];

  // Structured data describes what the page rendered, which on a Landing is the
  // strip rather than a listing it deliberately does not have.
  const listed = listing ? listing.products : (featured?.products ?? []);

  return {
    name: node.name ?? '',
    descriptionHtml: node.description ?? null,
    breadcrumbs,
    subcategories,
    listing,
    featured,
    // No region at all, rather than "no products": a listing with nothing in
    // it is still a region, and says so in its own words.
    isEmpty: subcategories.length === 0 && listing === null && featured === null,
    seo: {
      title: node.meta_title ?? node.name ?? '',
      description: toPlainText(node.meta_description ?? node.description),
    },
    jsonLd: [
      breadcrumbJsonLd(
        breadcrumbs.map((crumb) => ({ name: crumb.name, url: `${siteUrl}${crumb.href}` })),
      ),
      itemListJsonLd(
        listed.flatMap((item) =>
          item ? [{ name: item.name ?? '', url: `${siteUrl}${productUrl(item)}` }] : [],
        ),
      ),
    ],
  };
}
