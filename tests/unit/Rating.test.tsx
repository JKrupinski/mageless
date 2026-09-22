import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Rating } from '@ui/Rating';

/** The fraction of the row the gradient fills, 0–1. */
function fillFraction(container: HTMLElement) {
  const stop = container.querySelector('linearGradient stop');
  return Number(stop?.getAttribute('offset'));
}

describe('<Rating>', () => {
  it('announces the rating on a 0–5 scale', () => {
    render(<Rating percent={73} reviewCount={4} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Rated 3.6 out of 5 from 4 reviews');
  });

  it('renders nothing when the product has no rating', () => {
    const { container } = render(<Rating percent={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  /*
   * The stars are drawn as two overlaid paths, the top one filled by a
   * gradient with a hard stop. Nothing about that is visible to the other
   * tests or to an axe scan, and it has already been wrong twice: once
   * filling every star to the same fraction, once shifting the gradient along
   * with each star's transform. These pin the geometry down.
   */
  describe('partial fill', () => {
    it('spans the gradient across the whole row, not each star', () => {
      const { container } = render(<Rating percent={60} />);
      // One gradient for the row, and both layers drawn as a single path each.
      expect(container.querySelectorAll('linearGradient')).toHaveLength(1);
      expect(container.querySelectorAll('path')).toHaveLength(2);
      expect(container.querySelector('linearGradient')).toHaveAttribute(
        'gradientUnits',
        'userSpaceOnUse',
      );
      // A transform on the referencing element drags the gradient with it.
      for (const path of container.querySelectorAll('path')) {
        expect(path).not.toHaveAttribute('transform');
      }
    });

    it('fills nothing at the low end and everything at 100%', () => {
      const { container: full } = render(<Rating percent={100} />);
      expect(fillFraction(full)).toBe(1);
    });

    it('lands on a whole star for whole-star ratings', () => {
      // 60% is 3.0 stars: the boundary sits in the gutter after the third
      // cell, so the fourth star is untouched.
      const { container } = render(<Rating percent={60} />);
      expect(fillFraction(container)).toBeCloseTo((3 * 21) / 104, 5);
    });

    it('fills partway into the correct star for a fractional rating', () => {
      // 73% is 3.65 stars: three whole cells, then 65% of the fourth star's
      // own 16-unit span, offset by its 2 units of padding.
      const { container } = render(<Rating percent={73} />);
      expect(fillFraction(container)).toBeCloseTo((3 * 21 + 2 + 0.65 * 16) / 104, 5);
    });

    it('increases monotonically across the range', () => {
      const fractions = [5, 10, 25, 40, 55, 70, 85, 99, 100].map((percent) => {
        const { container } = render(<Rating percent={percent} />);
        return fillFraction(container);
      });
      for (let i = 1; i < fractions.length; i += 1) {
        expect(fractions[i]!).toBeGreaterThan(fractions[i - 1]!);
      }
    });

    it('clamps a percentage above 100 instead of overflowing the row', () => {
      const { container } = render(<Rating percent={140} />);
      expect(fillFraction(container)).toBe(1);
      expect(screen.getByRole('img')).toHaveAccessibleName('Rated 5.0 out of 5');
    });
  });
});
