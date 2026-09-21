import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

const meta = {
  title: 'Design system/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: { defaultValue: 'description' },
  parameters: {
    docs: {
      description: {
        component:
          'Root, List, Trigger and Content must be composed in one `.tsx` file and mounted ' +
          'as a single Astro island — Astro does not share React context across separate ' +
          '`client:*` directives.',
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args} className="w-96">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="shipping">Shipping</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        A lightweight running short with a built-in liner and a zip security pocket.
      </TabsContent>
      <TabsContent value="shipping">
        Ships in 1–2 business days. Free returns within 30 days.
      </TabsContent>
      <TabsContent value="reviews">4.6 out of 5, based on 128 reviews.</TabsContent>
    </Tabs>
  ),
};
