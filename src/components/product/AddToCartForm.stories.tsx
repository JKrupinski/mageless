import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddToCartForm } from './AddToCartForm';

const options = [
  {
    uid: 'opt-color',
    attributeCode: 'color',
    label: 'Color',
    values: [
      { uid: 'color-green', label: 'Green', swatch: '#3c8f4a' },
      { uid: 'color-purple', label: 'Purple', swatch: '#6d4aa3' },
      { uid: 'color-red', label: 'Red', swatch: '#b23b3b' },
    ],
  },
  {
    uid: 'opt-size',
    attributeCode: 'size',
    label: 'Size',
    values: [
      { uid: 'size-28', label: '28', swatch: null },
      { uid: 'size-29', label: '29', swatch: null },
      { uid: 'size-30', label: '30', swatch: null },
    ],
  },
];

const variants = options[0]!.values.flatMap((colour) =>
  options[1]!.values.map((size) => ({
    optionUids: [colour.uid, size.uid],
    sku: `WSH12-${size.label}-${colour.label}`,
    // Red 30 is deliberately unavailable so the disabled state is visible.
    inStock: !(colour.uid === 'color-red' && size.uid === 'size-30'),
    final: { value: 45, currency: 'USD' },
    regular: { value: 45, currency: 'USD' },
    percentOff: null,
  })),
);

const meta = {
  title: 'Catalogue/AddToCartForm',
  component: AddToCartForm,
  tags: ['autodocs'],
  args: {
    sku: 'WSH12',
    name: 'Erika Running Short',
    inStock: true,
    final: { value: 45, currency: 'USD' },
    regular: { value: 45, currency: 'USD' },
    percentOff: null,
  },
  parameters: {
    docs: {
      description: {
        component:
          'The only hydrated island on a product page. Option values that no variant can satisfy are disabled rather than failing on submit.',
      },
    },
  },
} satisfies Meta<typeof AddToCartForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleProduct: Story = {};

export const Configurable: Story = { args: { options, variants } };

export const Discounted: Story = {
  args: {
    final: { value: 36, currency: 'USD' },
    regular: { value: 45, currency: 'USD' },
    percentOff: 20,
  },
};

export const OutOfStock: Story = { args: { inStock: false } };
