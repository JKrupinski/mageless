/**
 * The cart shape shared between server and client.
 *
 * It lives in its own module so client islands can import the type without
 * pulling the server-only cart module (and its redis/GraphQL imports) into the
 * browser bundle.
 */
export interface CartItemSummary {
  uid: string;
  name: string;
  sku: string;
  url: string;
  image: string | null;
  quantity: number;
  rowTotal: { value: number | null; currency: string | null };
  options: { label: string; value: string }[];
  unavailableMessage: string | null;
}

export interface CartSummary {
  totalQuantity: number;
  grandTotal: { value: number | null; currency: string | null };
  items: CartItemSummary[];
}

export const EMPTY_CART: CartSummary = {
  totalQuantity: 0,
  grandTotal: { value: 0, currency: null },
  items: [],
};
