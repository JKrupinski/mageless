import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { QuantityStepper } from '@ui/QuantityStepper';
import { Skeleton } from '@ui/Skeleton';
import { TextField } from '@ui/TextField';

describe('<Button>', () => {
  it('announces and enforces the busy state while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Add to cart
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Add to cart' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('<TextField>', () => {
  it('links its label, hint and error to the input for assistive tech', () => {
    const { rerender } = render(<TextField label="Email" hint="Order updates only" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAccessibleDescription('Order updates only');
    expect(input).not.toHaveAttribute('aria-invalid');

    rerender(<TextField label="Email" error="Enter a valid email address" />);
    const invalid = screen.getByLabelText('Email');
    expect(invalid).toHaveAttribute('aria-invalid', 'true');
    expect(invalid).toHaveAccessibleDescription('Enter a valid email address');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
  });

  it('keeps the label available to screen readers when it is visually hidden', () => {
    render(<TextField label="Search" labelHidden />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });
});

describe('<QuantityStepper>', () => {
  it('steps within the configured bounds', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} min={1} max={3} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('disables stepping up at the maximum', () => {
    render(<QuantityStepper value={3} min={1} max={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('clamps a typed value and falls back to the minimum on nonsense input', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} min={1} max={5} onChange={onChange} />);

    const input = screen.getByLabelText('Quantity');
    await userEvent.clear(input);
    await userEvent.type(input, '9');
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});

describe('<Badge> and <Skeleton>', () => {
  it('renders a toned badge', () => {
    render(<Badge tone="sale">−20%</Badge>);
    expect(screen.getByText('−20%')).toBeInTheDocument();
  });

  it('reserves layout space and stays out of the accessibility tree', () => {
    const { container } = render(<Skeleton aspect="3/4" className="w-full" />);
    const placeholder = container.firstElementChild as HTMLElement;

    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder.style.aspectRatio).toBe('3/4');
  });
});
