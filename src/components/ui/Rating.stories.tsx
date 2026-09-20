import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating } from './Rating';

const meta = {
  title: 'Design system/Rating',
  component: Rating,
  tags: ['autodocs'],
  args: { percent: 73, reviewCount: 4 },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Full: Story = { args: { percent: 100, reviewCount: 128 } };
export const NoReviews: Story = { args: { percent: 0, reviewCount: 0 } };
