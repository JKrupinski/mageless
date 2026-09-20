import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard, type ProductCardData } from './ProductCard';

/** Shaped exactly like the `ProductCard` GraphQL fragment. */
const product: ProductCardData = {
  uid: 'MTIzNA==',
  sku: 'WSH12',
  name: 'Erika Running Short',
  url_key: 'erika-running-short',
  url_suffix: '.html',
  stock_status: 'IN_STOCK',
  rating_summary: 73,
  review_count: 4,
  small_image: {
    url: 'https://magento.test/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/w/s/wsh12-green_main_1.jpg',
    label: 'Erika Running Short',
  },
  price_range: {
    minimum_price: {
      regular_price: { value: 45, currency: 'USD' },
      final_price: { value: 45, currency: 'USD' },
      discount: { amount_off: 0, percent_off: 0 },
    },
    maximum_price: { final_price: { value: 45, currency: 'USD' } },
  },
};

const meta = {
  title: 'Catalogue/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  args: { product },
  parameters: {
    docs: {
      description: {
        component:
          'Server-rendered tile — it ships no client JavaScript. The whole card is clickable through a stretched pseudo-element, so screen readers still see exactly one link.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnSale: Story = {
  args: {
    product: {
      ...product,
      price_range: {
        minimum_price: {
          regular_price: { value: 45, currency: 'USD' },
          final_price: { value: 36, currency: 'USD' },
          discount: { amount_off: 9, percent_off: 20 },
        },
        maximum_price: { final_price: { value: 36, currency: 'USD' } },
      },
    },
  },
};

export const OutOfStock: Story = {
  args: { product: { ...product, stock_status: 'OUT_OF_STOCK' } },
};

export const NoImage: Story = {
  args: { product: { ...product, small_image: null } },
};
