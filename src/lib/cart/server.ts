import type { AstroCookies } from 'astro';
import { execute, GraphQLRequestError } from '../graphql/client';
import {
  AddProductsToCartMutation,
  CartQuery,
  CreateGuestCartMutation,
  RemoveItemFromCartMutation,
  UpdateCartItemsMutation,
} from '../graphql/queries/cart';
import type { ResultOf } from '../graphql/graphql';
import { EMPTY_CART, type CartSummary } from './types';

export type { CartSummary, CartItemSummary } from './types';

export const CART_COOKIE = 'mage_cart_id';

export type Cart = NonNullable<ResultOf<typeof CartQuery>['cart']>;

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 30,
} as const;

/**
 * The cart id is a bearer credential for a guest basket, so it lives in an
 * httpOnly cookie and never reaches client JavaScript. All cart mutations go
 * through this module's server endpoints instead.
 */
export function readCartId(cookies: AstroCookies): string | null {
  return cookies.get(CART_COOKIE)?.value ?? null;
}

export function writeCartId(cookies: AstroCookies, cartId: string): void {
  cookies.set(CART_COOKIE, cartId, COOKIE_OPTIONS);
}

export function clearCartId(cookies: AstroCookies): void {
  cookies.delete(CART_COOKIE, { path: '/' });
}

async function createCart(cookies: AstroCookies): Promise<string> {
  const result = await execute(CreateGuestCartMutation);
  const cartId = result.createGuestCart?.cart?.id;
  if (!cartId) throw new Error('Magento did not return a guest cart id');
  writeCartId(cookies, cartId);
  return cartId;
}

/** Existing cart id, or a freshly created guest cart. */
export async function ensureCartId(cookies: AstroCookies): Promise<string> {
  return readCartId(cookies) ?? (await createCart(cookies));
}

/**
 * Magento expires guest quotes (and `bin/magento setup:upgrade` wipes them),
 * after which the stored id 404s. Treat that as "empty cart" and re-issue one
 * rather than showing the shopper an error.
 */
function isMissingCart(error: unknown): boolean {
  return (
    error instanceof GraphQLRequestError &&
    error.errors.some((entry) =>
      /Could not find a cart|isn't active|no such entity/i.test(entry.message),
    )
  );
}

export async function getCart(cookies: AstroCookies): Promise<Cart | null> {
  const cartId = readCartId(cookies);
  if (!cartId) return null;
  try {
    const result = await execute(CartQuery, { variables: { cartId } });
    return result.cart ?? null;
  } catch (error) {
    if (isMissingCart(error)) {
      clearCartId(cookies);
      return null;
    }
    throw error;
  }
}

export interface AddToCartInput {
  sku: string;
  quantity: number;
  selectedOptions?: string[];
}

export async function addToCart(
  cookies: AstroCookies,
  input: AddToCartInput,
): Promise<{ cart: Cart | null; userErrors: { code: string; message: string }[] }> {
  const run = async (cartId: string) =>
    execute(AddProductsToCartMutation, {
      variables: {
        cartId,
        cartItems: [
          {
            sku: input.sku,
            quantity: input.quantity,
            ...(input.selectedOptions?.length ? { selected_options: input.selectedOptions } : {}),
          },
        ],
      },
    });

  let cartId = await ensureCartId(cookies);
  let result;
  try {
    result = await run(cartId);
  } catch (error) {
    if (!isMissingCart(error)) throw error;
    clearCartId(cookies);
    cartId = await ensureCartId(cookies);
    result = await run(cartId);
  }

  return {
    cart: result.addProductsToCart?.cart ?? null,
    userErrors: (result.addProductsToCart?.user_errors ?? []).map((entry) => ({
      code: String(entry?.code ?? 'UNDEFINED'),
      message: entry?.message ?? 'Could not add this product.',
    })),
  };
}

export async function updateCartItem(
  cookies: AstroCookies,
  itemUid: string,
  quantity: number,
): Promise<Cart | null> {
  const cartId = await ensureCartId(cookies);
  const result = await execute(UpdateCartItemsMutation, {
    variables: { cartId, cartItems: [{ cart_item_uid: itemUid, quantity }] },
  });
  return result.updateCartItems?.cart ?? null;
}

export async function removeCartItem(cookies: AstroCookies, itemUid: string): Promise<Cart | null> {
  const cartId = await ensureCartId(cookies);
  const result = await execute(RemoveItemFromCartMutation, {
    variables: { cartId, itemUid },
  });
  return result.removeItemFromCart?.cart ?? null;
}

export function toCartSummary(cart: Cart | null): CartSummary {
  if (!cart) return EMPTY_CART;

  return {
    totalQuantity: cart.total_quantity ?? 0,
    grandTotal: {
      value: cart.prices?.grand_total?.value ?? null,
      currency: cart.prices?.grand_total?.currency ?? null,
    },
    items: (cart.itemsV2?.items ?? []).flatMap((item) => {
      if (!item) return [];
      return [
        {
          uid: item.uid,
          name: item.product.name ?? item.product.sku ?? '',
          sku: item.product.sku ?? '',
          url: `/${item.product.url_key ?? ''}${item.product.url_suffix ?? ''}`,
          image: item.product.small_image?.url ?? null,
          quantity: item.quantity,
          rowTotal: {
            value: item.prices?.row_total_including_tax?.value ?? null,
            currency: item.prices?.row_total_including_tax?.currency ?? null,
          },
          options:
            'configurable_options' in item && item.configurable_options
              ? item.configurable_options.flatMap((option) =>
                  option ? [{ label: option.option_label, value: option.value_label }] : [],
                )
              : [],
          unavailableMessage:
            item.is_available === false ? (item.not_available_message ?? null) : null,
        },
      ];
    }),
  };
}
