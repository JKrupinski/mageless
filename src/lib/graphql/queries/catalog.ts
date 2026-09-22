import { graphql } from '../graphql';
import { ProductCardFragment, PriceRangeFragment } from '../fragments';

/** Top-level menu, two levels deep — cached hard, it changes rarely. */
export const NavigationQuery = graphql(`
  query Navigation($rootId: String!) {
    categories(filters: { parent_id: { eq: $rootId } }) {
      items {
        uid
        name
        url_path
        url_suffix
        include_in_menu
        children {
          uid
          name
          url_path
          url_suffix
          include_in_menu
          product_count
        }
      }
    }
  }
`);

export const StoreConfigQuery = graphql(`
  query StoreConfig {
    storeConfig {
      store_code
      store_name
      base_url
      base_media_url
      secure_base_media_url
      locale
      base_currency_code
      default_display_currency_code
      product_url_suffix
      category_url_suffix
      grid_per_page
      root_category_uid
      title_prefix
      title_suffix
      default_description
    }
  }
`);

/** Home page: store settings plus one merchandised row of products. */
export const HomeQuery = graphql(
  `
    query Home($categoryUid: String!, $pageSize: Int!) {
      storeConfig {
        store_name
        default_description
      }
      categories(filters: { parent_id: { eq: "2" } }) {
        items {
          uid
          name
          url_path
          url_suffix
          image
          product_count
        }
      }
      products(
        filter: { category_uid: { eq: $categoryUid } }
        pageSize: $pageSize
        currentPage: 1
        sort: { position: ASC }
      ) {
        total_count
        items {
          ...ProductCard
        }
      }
    }
  `,
  [ProductCardFragment],
);

/**
 * Everything a Category page needs in a single round trip: the header, its
 * Display Mode and Subcategories, and the filtered product page.
 *
 * The Subcategory tree comes back two levels deep. The first level is what a
 * Category Landing renders as tiles; the second exists only so the landing can
 * pick a busy descendant to merchandise, since a department's own children are
 * often Landings too and carry no products a shopper could see.
 */
export const CategoryPageQuery = graphql(
  `
    query CategoryPage(
      $urlPath: String!
      $filters: ProductAttributeFilterInput!
      $sort: ProductAttributeSortInput!
      $pageSize: Int!
      $currentPage: Int!
    ) {
      categories(filters: { url_path: { eq: $urlPath } }) {
        items {
          uid
          name
          description
          display_mode
          url_path
          url_suffix
          meta_title
          meta_description
          product_count
          breadcrumbs {
            category_uid
            category_name
            category_url_path
          }
          children {
            uid
            name
            url_path
            url_suffix
            include_in_menu
            product_count
            children {
              uid
              name
              url_path
              url_suffix
              include_in_menu
              product_count
            }
          }
        }
      }
      products(filter: $filters, sort: $sort, pageSize: $pageSize, currentPage: $currentPage) {
        total_count
        page_info {
          current_page
          page_size
          total_pages
        }
        aggregations {
          attribute_code
          label
          count
          options {
            label
            value
            count
          }
        }
        items {
          ...ProductCard
        }
      }
    }
  `,
  [ProductCardFragment],
);

/**
 * The products behind a Category Landing's merchandising strip.
 *
 * Deliberately a fixed handful with no aggregations, page info or sort: this is
 * a merchandised row, not a listing. Rolling a Category's descendants up into a
 * paginated, faceted listing is what an Anchor Category would do, and this
 * storefront does not (see CONTEXT.md).
 */
export const CategoryFeaturedQuery = graphql(
  `
    query CategoryFeatured($categoryUid: String!, $pageSize: Int!) {
      products(
        filter: { category_uid: { eq: $categoryUid } }
        pageSize: $pageSize
        currentPage: 1
        sort: { position: ASC }
      ) {
        total_count
        items {
          ...ProductCard
        }
      }
    }
  `,
  [ProductCardFragment],
);

/** Full product detail, including configurable matrix for the variant picker. */
export const ProductPageQuery = graphql(
  `
    query ProductPage($urlKey: String!) {
      products(filter: { url_key: { eq: $urlKey } }, pageSize: 1) {
        items {
          uid
          sku
          name
          url_key
          url_suffix
          stock_status
          only_x_left_in_stock
          rating_summary
          review_count
          meta_title
          meta_description
          description {
            html
          }
          short_description {
            html
          }
          image {
            url
            label
          }
          media_gallery {
            url
            label
            position
            disabled
          }
          price_range {
            ...PriceRangeFields
          }
          categories {
            uid
            name
            url_path
            url_suffix
            breadcrumbs {
              category_name
              category_url_path
            }
          }
          ... on ConfigurableProduct {
            configurable_options {
              uid
              attribute_code
              label
              values {
                uid
                label
                swatch_data {
                  value
                }
              }
            }
            variants {
              attributes {
                code
                uid
                label
              }
              product {
                uid
                sku
                name
                stock_status
                only_x_left_in_stock
                image {
                  url
                  label
                }
                price_range {
                  ...PriceRangeFields
                }
              }
            }
          }
        }
      }
    }
  `,
  [PriceRangeFragment],
);

/** Full-text search, backed by OpenSearch on the Magento side. */
export const SearchQuery = graphql(
  `
    query Search(
      $search: String!
      $sort: ProductAttributeSortInput!
      $pageSize: Int!
      $currentPage: Int!
    ) {
      products(search: $search, sort: $sort, pageSize: $pageSize, currentPage: $currentPage) {
        total_count
        page_info {
          current_page
          page_size
          total_pages
        }
        items {
          ...ProductCard
        }
      }
    }
  `,
  [ProductCardFragment],
);

/** Lightweight type-ahead for the header search island. */
export const SearchSuggestQuery = graphql(`
  query SearchSuggest($search: String!) {
    products(search: $search, pageSize: 6, currentPage: 1) {
      total_count
      items {
        uid
        name
        sku
        url_key
        url_suffix
        small_image {
          url
          label
        }
        price_range {
          minimum_price {
            final_price {
              value
              currency
            }
          }
        }
      }
    }
  }
`);

/** Resolves any Magento URL to the entity behind it (product / category / CMS). */
export const RouteQuery = graphql(`
  query ResolveRoute($url: String!) {
    route(url: $url) {
      __typename
      redirect_code
      relative_url
      type
      ... on ProductInterface {
        url_key
      }
      ... on CategoryTree {
        url_path
      }
      ... on CmsPage {
        identifier
        title
        content
        content_heading
        meta_title
        meta_description
      }
    }
  }
`);

/** Every product/category URL, for the sitemap. */
export const SitemapQuery = graphql(`
  query Sitemap($pageSize: Int!, $currentPage: Int!) {
    categories(filters: { parent_id: { eq: "2" } }) {
      items {
        url_path
        url_suffix
        children {
          url_path
          url_suffix
          children {
            url_path
            url_suffix
          }
        }
      }
    }
    products(filter: {}, pageSize: $pageSize, currentPage: $currentPage) {
      total_count
      page_info {
        total_pages
      }
      items {
        url_key
        url_suffix
      }
    }
  }
`);
