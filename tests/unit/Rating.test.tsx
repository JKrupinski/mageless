import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Rating } from '@ui/Rating';

describe('<Rating>', () => {
  it('announces the rating on a 0–5 scale', () => {
    render(<Rating percent={73} reviewCount={4} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Rated 3.6 out of 5 from 4 reviews');
  });

  it('renders nothing when the product has no rating', () => {
    const { container } = render(<Rating percent={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
