import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Price } from '@ui/Price';

describe('<Price>', () => {
  it('shows only the final price when there is no discount', () => {
    render(<Price final={{ value: 45, currency: 'USD' }} />);
    expect(screen.getByText('$45.00')).toBeInTheDocument();
    expect(screen.queryByLabelText('Regular price')).not.toBeInTheDocument();
  });

  it('shows the struck-through regular price and the percentage off', () => {
    render(
      <Price
        final={{ value: 36, currency: 'USD' }}
        regular={{ value: 45, currency: 'USD' }}
        percentOff={20}
      />,
    );

    expect(screen.getByText('$36.00')).toBeInTheDocument();
    expect(screen.getByLabelText('Regular price')).toHaveTextContent('$45.00');
    expect(screen.getByText('−20%')).toBeInTheDocument();
  });

  it('prefixes a price range with "From"', () => {
    render(
      <Price final={{ value: 20, currency: 'USD' }} maximum={{ value: 60, currency: 'USD' }} />,
    );
    expect(screen.getByText('From $20.00')).toBeInTheDocument();
  });
});
