import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Price } from '@ui/Price';

/**
 * These assert what a shopper (or a screen reader) ends up with, not which
 * element each fragment sits in: "From" and the regular price are their own
 * spans so they can be de-emphasised typographically, and that is a styling
 * decision the tests should not pin down.
 */
describe('<Price>', () => {
  it('shows only the final price when there is no discount', () => {
    render(<Price final={{ value: 45, currency: 'USD' }} />);
    expect(screen.getByText('$45.00')).toBeInTheDocument();
    expect(screen.queryByText(/Regular price/)).not.toBeInTheDocument();
  });

  it('shows the struck-through regular price and the percentage off', () => {
    const { container } = render(
      <Price
        final={{ value: 36, currency: 'USD' }}
        regular={{ value: 45, currency: 'USD' }}
        percentOff={20}
      />,
    );

    expect(screen.getByText('$36.00')).toBeInTheDocument();
    expect(screen.getByText('−20%')).toBeInTheDocument();
    // The old price is labelled in text rather than with aria-label, which is
    // not reliably exposed on a roleless <span>.
    expect(container.textContent).toContain('Regular price $45.00');
  });

  it('prefixes a price range with "From"', () => {
    const { container } = render(
      <Price final={{ value: 20, currency: 'USD' }} maximum={{ value: 60, currency: 'USD' }} />,
    );
    expect(container.textContent).toContain('From');
    expect(screen.getByText('$20.00')).toBeInTheDocument();
  });
});
