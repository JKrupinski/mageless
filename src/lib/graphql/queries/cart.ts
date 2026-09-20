import { graphql } from '../graphql';
import { CartFragment } from '../fragments';

export const CreateGuestCartMutation = graphql(`
  mutation CreateGuestCart {
    createGuestCart {
      cart {
        id
      }
    }
  }
`);

export const CartQuery = graphql(
  `
    query GetCart($cartId: String!) {
      cart(cart_id: $cartId) {
        ...CartFields
      }
    }
  `,
  [CartFragment],
);

/**
 * `selected_options` carries the configurable option UIDs, so the same mutation
 * handles simple and configurable products without a separate code path.
 */
export const AddProductsToCartMutation = graphql(
  `
    mutation AddProductsToCart($cartId: String!, $cartItems: [CartItemInput!]!) {
      addProductsToCart(cartId: $cartId, cartItems: $cartItems) {
        cart {
          ...CartFields
        }
        user_errors {
          code
          message
        }
      }
    }
  `,
  [CartFragment],
);

export const UpdateCartItemsMutation = graphql(
  `
    mutation UpdateCartItems($cartId: String!, $cartItems: [CartItemUpdateInput!]!) {
      updateCartItems(input: { cart_id: $cartId, cart_items: $cartItems }) {
        cart {
          ...CartFields
        }
      }
    }
  `,
  [CartFragment],
);

export const RemoveItemFromCartMutation = graphql(
  `
    mutation RemoveItemFromCart($cartId: String!, $itemUid: ID!) {
      removeItemFromCart(input: { cart_id: $cartId, cart_item_uid: $itemUid }) {
        cart {
          ...CartFields
        }
      }
    }
  `,
  [CartFragment],
);
