import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Design system/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Email', placeholder: 'you@example.com' },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'We only use this for order updates.' } };
export const WithError: Story = { args: { error: 'Enter a valid email address' } };
export const LabelHidden: Story = { args: { labelHidden: true } };
