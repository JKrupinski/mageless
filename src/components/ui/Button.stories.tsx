import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Design system/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Add to cart' },
  parameters: {
    docs: {
      description: {
        component:
          'The single button primitive. Variants map to intent, never to a colour — that is what keeps re-theming a token change. `primary` is an ink fill; `accent` is reserved for the one conversion action on a page, which is what keeps the accent meaning something.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Accent: Story = { args: { variant: 'accent' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Remove' } };
export const Link: Story = { args: { variant: 'link', children: 'View all 50 products' } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true, children: 'Out of stock' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};
