import { graphql } from './graphql';

/**
 * Shared selection sets.
 *
 * `@_unmask` keeps the inferred types flat so Astro templates and React props
 * can consume fragment data directly; the fragments still give us one place to
 * change a selection and have every call site update its types.
 */

export const MoneyFragment = graphql(`
  fragment Money on Money @_unmask {
    value
    currency
  }
`);

export const PriceRangeFragment = graphql(
  `
    fragment PriceRangeFields on PriceRange @_unmask {
      minimum_price {
        regular_price {
          ...Money
        }
        final_price {
          ...Money
        }
        discount {
          amount_off
          percent_off
        }
      }
      maximum_price {
        final_price {
          ...Money
        }
      }
    }
  `,
  [MoneyFragment],
);

/** Everything a product tile needs — and nothing more. */
export const ProductCardFragment = graphql(
  `
    fragment ProductCard on ProductInterface @_unmask {
      uid
      sku
      name
      url_key
      url_suffix
      stock_status
      rating_summary
      review_count
      small_image {
        url
        label
      }
      price_range {
        ...PriceRangeFields
      }
    }
  `,
  [PriceRangeFragment],
);

export const CartItemFragment = graphql(
  `
    fragment CartItemFields on CartItemInterface @_unmask {
      uid
      quantity
      is_available
      not_available_message
      errors {
        code
        message
      }
      prices {
        row_total_including_tax {
          ...Money
        }
        price {
          ...Money
        }
      }
      product {
        uid
        sku
        name
        url_key
        url_suffix
        small_image {
          url
          label
        }
      }
      ... on ConfigurableCartItem {
        configurable_options {
          option_label
          value_label
        }
      }
    }
  `,
  [MoneyFragment],
);

export const CartFragment = graphql(
  `
    fragment CartFields on Cart @_unmask {
      id
      total_quantity
      prices {
        grand_total {
          ...Money
        }
        subtotal_excluding_tax {
          ...Money
        }
        discounts {
          label
          amount {
            ...Money
          }
        }
      }
      itemsV2 {
        total_count
        items {
          ...CartItemFields
        }
      }
    }
  `,
  [CartItemFragment, MoneyFragment],
);
