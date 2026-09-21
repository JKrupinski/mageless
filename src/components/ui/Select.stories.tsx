import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './Select';

const meta = {
  title: 'Design system/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Built on Radix so keyboard navigation, typeahead and positioning come for free. ' +
          'Root, Trigger and Content must be composed in one `.tsx` file and mounted as a ' +
          'single Astro island — Astro does not share React context across separate ' +
          '`client:*` directives.',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="m">
      <SelectTrigger aria-label="Size" className="w-40">
        <SelectValue placeholder="Select a size" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Size</SelectLabel>
          <SelectItem value="xs">XS</SelectItem>
          <SelectItem value="s">S</SelectItem>
          <SelectItem value="m">M</SelectItem>
          <SelectItem value="l">L</SelectItem>
          <SelectItem value="xl" disabled>
            XL — out of stock
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Placeholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Colour" className="w-40">
        <SelectValue placeholder="Select a colour" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="black">Black</SelectItem>
        <SelectItem value="white">White</SelectItem>
        <SelectSeparator />
        <SelectItem value="custom">Custom</SelectItem>
      </SelectContent>
    </Select>
  ),
};
