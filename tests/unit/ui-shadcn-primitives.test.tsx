import { useId } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@ui/Dialog';
import { RadioGroup, RadioGroupItem } from '@ui/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/Tabs';

describe('<Dialog>', () => {
  it('opens from its trigger, exposes an accessible name and description, and closes', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Remove item</DialogTrigger>
        <DialogContent>
          <DialogTitle>Remove this item?</DialogTitle>
          <DialogDescription>It will be removed from your cart.</DialogDescription>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove item' }));

    const dialog = screen.getByRole('dialog', { name: 'Remove this item?' });
    expect(dialog).toHaveAccessibleDescription('It will be removed from your cart.');

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('<RadioGroup>', () => {
  function ShippingOptions({ onValueChange }: { onValueChange: (value: string) => void }) {
    const standardId = useId();
    const expressId = useId();
    return (
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="standard" id={standardId} />
        <label htmlFor={standardId}>Standard</label>
        <RadioGroupItem value="express" id={expressId} />
        <label htmlFor={expressId}>Express</label>
      </RadioGroup>
    );
  }

  it('reports the selected value and only ever checks one option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ShippingOptions onValueChange={onValueChange} />);

    await user.click(screen.getByLabelText('Express'));
    expect(onValueChange).toHaveBeenCalledWith('express');
    expect(screen.getByLabelText('Express')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Standard')).toHaveAttribute('aria-checked', 'false');
  });
});

describe('<Select>', () => {
  it('opens the listbox from the trigger and applies a chosen option as the value', async () => {
    const user = userEvent.setup();
    render(
      <Select defaultValue="m">
        <SelectTrigger aria-label="Size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="s">S</SelectItem>
          <SelectItem value="m">M</SelectItem>
          <SelectItem value="l">L</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Size' });
    expect(trigger).toHaveTextContent('M');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'L' }));

    expect(trigger).toHaveTextContent('L');
  });
});

describe('<Tabs>', () => {
  it('shows only the active panel and switches on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>
        <TabsContent value="description">Runs true to size.</TabsContent>
        <TabsContent value="shipping">Ships in 1-2 days.</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText('Runs true to size.')).toBeVisible();
    expect(screen.queryByText('Ships in 1-2 days.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Shipping' }));

    expect(screen.getByText('Ships in 1-2 days.')).toBeVisible();
    expect(screen.queryByText('Runs true to size.')).not.toBeInTheDocument();
  });
});
