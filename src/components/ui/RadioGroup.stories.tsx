import { useId, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, RadioGroupItem } from './RadioGroup';

const meta = {
  title: 'Design system/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: { defaultValue: 'standard' },
  parameters: {
    docs: {
      description: {
        component: 'A single-choice control for shipping methods, delivery slots and similar sets.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function ShippingOptions(props: ComponentProps<typeof RadioGroup>) {
  const standardId = useId();
  const expressId = useId();
  const pickupId = useId();

  return (
    <RadioGroup {...props}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="standard" id={standardId} />
        <label htmlFor={standardId} className="text-sm text-ink">
          Standard (3–5 days) — free
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="express" id={expressId} />
        <label htmlFor={expressId} className="text-sm text-ink">
          Express (1–2 days) — $12.00
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pickup" id={pickupId} disabled />
        <label htmlFor={pickupId} className="text-sm text-ink-muted">
          In-store pickup — unavailable
        </label>
      </div>
    </RadioGroup>
  );
}

export const Default: Story = {
  render: (args) => <ShippingOptions {...args} />,
};
