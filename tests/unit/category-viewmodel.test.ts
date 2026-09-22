import { describe, expect, it, vi } from 'vitest';
import { toCategoryViewModel } from '@lib/viewmodels/category';

const SITE = 'https://shop.test';

/** Shaped like one item of `CategoryPageQuery`, trimmed to what the mapper reads. */
function makeNode(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'MjA=',
    name: 'Women',
    description: null,
    display_mode: 'PAGE',
    url_path: 'women',
    url_suffix: '.html',
    meta_title: 'Women',
    meta_description: null,
    product_count: 0,
    breadcrumbs: null,
    children: [
      {
        uid: 'MjE=',
        name: 'Tops',
        url_path: 'women/tops-women',
        url_suffix: '.html',
        include_in_menu: 1,
        product_count: 50,
        children: [],
      },
      {
        uid: 'MjI=',
        name: 'Bottoms',
        url_path: 'women/bottoms-women',
        url_suffix: '.html',
        include_in_menu: 1,
        product_count: 25,
        children: [],
      },
    ],
    ...overrides,
  } as never;
}

function makeProductItem(name: string, urlKey: string) {
  return { uid: urlKey, sku: urlKey, name, url_key: urlKey, url_suffix: '.html' };
}

/** Shaped like the `products` half of `CategoryPageQuery`. */
function makeProducts(count: number, overrides: Record<string, unknown> = {}) {
  return {
    total_count: count,
    page_info: { current_page: 1, page_size: 12, total_pages: Math.max(1, Math.ceil(count / 12)) },
    aggregations: [
      {
        attribute_code: 'color',
        label: 'Color',
        count: 1,
        options: [{ label: 'Blue', value: '50', count: count }],
      },
    ],
    items: Array.from({ length: count }, (_, index) =>
      makeProductItem(`Product ${index}`, `product-${index}`),
    ),
    ...overrides,
  } as never;
}

const noFeatured = { fetchFeatured: vi.fn(async () => ({ totalCount: 0, products: [] })) };

function deps(products: { name: string; urlKey: string }[] = [{ name: 'Tee', urlKey: 'tee' }]) {
  return {
    fetchFeatured: vi.fn(async () => ({
      totalCount: products.length,
      products: products.map((product) => makeProductItem(product.name, product.urlKey)) as never[],
    })),
  };
}

const url = (search = '') => new URL(`${SITE}/women.html${search}`);

describe('toCategoryViewModel', () => {
  describe('Display Mode drives the rendering', () => {
    it('presents a PAGE Category as its Subcategories rather than a listing', async () => {
      const model = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        deps(),
      );

      expect(model.listing).toBeNull();
      expect(model.subcategories.map((child) => child.name)).toEqual(['Tops', 'Bottoms']);
      expect(model.subcategories[0]?.href).toBe('/women/tops-women.html');
    });

    it('presents a PRODUCTS Category as a listing with no Subcategory tiles', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS' }),
          products: makeProducts(50),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(model.subcategories).toEqual([]);
      expect(model.listing?.totalCount).toBe(50);
      expect(model.featured).toBeNull();
      expect(noFeatured.fetchFeatured).not.toHaveBeenCalled();
    });

    it('presents a PRODUCTS_AND_PAGE Category as both', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS_AND_PAGE' }),
          products: makeProducts(12),
          siteUrl: SITE,
          url: url(),
        },
        deps(),
      );

      expect(model.subcategories).toHaveLength(2);
      expect(model.listing?.totalCount).toBe(12);
    });

    /*
     * Magento leaves `display_mode` null on a Category that has never been
     * configured. Falling back to a listing keeps such a Category rendering
     * exactly as it did before Display Mode was honoured at all.
     */
    it('falls back to a listing when Magento reports no Display Mode', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: null }),
          products: makeProducts(4),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(model.listing?.totalCount).toBe(4);
      expect(model.subcategories).toEqual([]);
    });

    it('never decides from the product count alone', async () => {
      // A PAGE Category with no products and a PRODUCTS one with no products
      // differ only in Display Mode, and must render differently.
      const landing = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        deps(),
      );
      const listing = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS', children: [] }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(landing.listing).toBeNull();
      expect(listing.listing).not.toBeNull();
    });
  });

  /*
   * Gear is the case that stops Display Mode being honoured blindly: Magento
   * reports PAGE, and 33 products are assigned to it directly. Luma can hide
   * them because it fills the space with Widget Content, which ADR-0002 puts
   * out of scope — so hiding them here would just delete stock from the shop.
   */
  it('shows the listing of a Category Landing that has products of its own', async () => {
    const model = await toCategoryViewModel(
      {
        node: makeNode({ name: 'Gear', display_mode: 'PAGE', product_count: 33 }),
        products: makeProducts(33),
        siteUrl: SITE,
        url: url(),
      },
      deps(),
    );

    expect(model.subcategories).toHaveLength(2);
    expect(model.listing?.totalCount).toBe(33);
    // Its own products are the merchandising; a second strip would be noise.
    expect(model.featured).toBeNull();
  });

  describe('merchandising strip', () => {
    it('draws from the busiest Subcategory', async () => {
      const fetchFeatured = deps();
      const model = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        fetchFeatured,
      );

      expect(fetchFeatured.fetchFeatured).toHaveBeenCalledWith('MjE=');
      expect(model.featured?.name).toBe('Tops');
      expect(model.featured?.href).toBe('/women/tops-women.html');
      expect(model.featured?.products).toHaveLength(1);
    });

    it('descends past a Subcategory that carries no products of its own', async () => {
      const fetchFeatured = deps();
      await toCategoryViewModel(
        {
          node: makeNode({
            children: [
              {
                uid: 'MjE=',
                name: 'Tops',
                url_path: 'women/tops-women',
                url_suffix: '.html',
                include_in_menu: 1,
                product_count: 0,
                children: [
                  {
                    uid: 'MjM=',
                    name: 'Tees',
                    url_path: 'women/tops-women/tees-women',
                    url_suffix: '.html',
                    include_in_menu: 1,
                    product_count: 12,
                    children: [],
                  },
                ],
              },
            ],
          }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url(),
        },
        fetchFeatured,
      );

      expect(fetchFeatured.fetchFeatured).toHaveBeenCalledWith('MjM=');
    });

    it('is left out when the strip comes back empty', async () => {
      const model = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        noFeatured,
      );

      expect(model.featured).toBeNull();
    });

    it('is not a rollup: it reports the strip, not a descendant total', async () => {
      const model = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        {
          fetchFeatured: vi.fn(async () => ({
            totalCount: 50,
            products: [makeProductItem('Tee', 'tee')] as never[],
          })),
        },
      );

      // The count belongs to the Subcategory the strip links to, and the strip
      // is a handful of its products — the two are deliberately different
      // numbers, and neither is a total for the Category Landing itself.
      expect(model.featured?.totalCount).toBe(50);
      expect(model.featured?.products).toHaveLength(1);
      expect(model.listing).toBeNull();
    });
  });

  describe('Subcategory tiles', () => {
    it('leaves out a Subcategory the merchandiser hid from the menu', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({
            children: [
              {
                uid: 'MjE=',
                name: 'Hidden',
                url_path: 'women/hidden',
                url_suffix: '.html',
                include_in_menu: 0,
                product_count: 9,
                children: [],
              },
            ],
          }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(model.subcategories).toEqual([]);
    });

    it('carries the product count so a tile can show it', async () => {
      const model = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        deps(),
      );

      expect(model.subcategories[0]?.productCount).toBe(50);
    });
  });

  describe('empty Category', () => {
    /*
     * Sale, today: PAGE, no Subcategories, no products. It stays in the
     * navigation because a merchandiser put it there, so the page has to say
     * something honest rather than render three empty regions.
     */
    it('reports nothing to show when there are neither Subcategories nor products', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ name: 'Sale', children: [] }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(model.subcategories).toEqual([]);
      expect(model.listing).toBeNull();
      expect(model.featured).toBeNull();
      expect(model.isEmpty).toBe(true);
    });

    it('is not empty while it has a listing', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS' }),
          products: makeProducts(3),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(model.isEmpty).toBe(false);
    });

    /*
     * An empty listing explains itself, so the page must not stack a second
     * "nothing here" panel on top of it.
     */
    it('leaves an empty listing to speak for itself', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS', children: [] }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url(),
        },
        noFeatured,
      );

      expect(model.listing).not.toBeNull();
      expect(model.isEmpty).toBe(false);
    });
  });

  describe('filtering', () => {
    it('marks a listing the shopper narrowed themselves', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS' }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url('?color=50'),
        },
        noFeatured,
      );

      expect(model.listing?.filtered).toBe(true);
    });

    it('does not call a listing filtered because it was sorted or paginated', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({ display_mode: 'PRODUCTS' }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url('?sort=name&p=2'),
        },
        noFeatured,
      );

      expect(model.listing?.filtered).toBe(false);
    });
  });

  describe('page furniture', () => {
    it('ends the breadcrumb trail on the Category itself', async () => {
      const model = await toCategoryViewModel(
        {
          node: makeNode({
            breadcrumbs: [
              { category_uid: 'Mg==', category_name: 'Shop', category_url_path: 'shop' },
            ],
          }),
          products: makeProducts(0),
          siteUrl: SITE,
          url: url(),
        },
        deps(),
      );

      expect(model.breadcrumbs).toEqual([
        { name: 'Shop', href: '/shop.html' },
        { name: 'Women', href: '/women.html' },
      ]);
    });

    it('lists the products it actually rendered in its structured data', async () => {
      const model = await toCategoryViewModel(
        { node: makeNode(), products: makeProducts(0), siteUrl: SITE, url: url() },
        deps([{ name: 'Tee', urlKey: 'tee' }]),
      );

      const itemList = model.jsonLd.find((entry) => entry['@type'] === 'ItemList');
      expect(JSON.stringify(itemList)).toContain('https://shop.test/tee.html');
    });
  });
});
