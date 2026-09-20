import type { Meta, StoryObj } from '@storybook/react-vite';
import { Price } from './Price';

const meta = {
  title: 'Design system/Price',
  component: Price,
  tags: ['autodocs'],
  args: { final: { value: 45, currency: 'USD' } },
} satisfies Meta<typeof Price>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

export const Discounted: Story = {
  args: {
    final: { value: 36, currency: 'USD' },
    regular: { value: 45, currency: 'USD' },
    percentOff: 20,
  },
};

export const Range: Story = {
  name: 'Configurable range',
  args: { final: { value: 20, currency: 'USD' }, maximum: { value: 60, currency: 'USD' } },
};

export const OtherLocale: Story = {
  args: { final: { value: 45, currency: 'EUR' }, locale: 'pl-PL' },
};

export const Missing: Story = { args: { final: null } };
