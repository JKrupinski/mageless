import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantityStepper } from './QuantityStepper';

const meta = {
  title: 'Design system/QuantityStepper',
  component: QuantityStepper,
  tags: ['autodocs'],
  args: { value: 1, onChange: () => {} },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <QuantityStepper {...args} value={value} onChange={setValue} />;
  },
};

export const AtMaximum: Story = { args: { value: 99 } };
export const Disabled: Story = { args: { disabled: true } };
