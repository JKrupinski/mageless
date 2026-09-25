import { describe, expect, it } from 'vitest';
import { type ImagePreset, responsiveImage } from '@lib/images';

const MAGENTO_IMAGE =
  'https://magento.test/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/w/b/wb01-black-0.jpg';

const preset: ImagePreset = { widths: [240, 480], sizes: '50vw' };

/** Reads one srcset candidate back into the transform it asks for. */
function parseCandidate(candidate: string) {
  const [url = '', descriptor] = candidate.trim().split(' ');
  const parsed = new URL(url, 'http://storefront.test');
  return {
    path: parsed.pathname,
    href: parsed.searchParams.get('href'),
    width: parsed.searchParams.get('w'),
    format: parsed.searchParams.get('f'),
    descriptor,
  };
}

describe('responsiveImage', () => {
  it('offers AVIF first, then WebP, as <picture> sources', () => {
    const image = responsiveImage(MAGENTO_IMAGE, preset);

    expect(image.sources.map((source) => source.type)).toEqual(['image/avif', 'image/webp']);
  });

  it('lists every preset width for each format, served by the image endpoint', () => {
    const image = responsiveImage(MAGENTO_IMAGE, preset);
    const avif = image.sources[0]!.srcSet.split(',').map(parseCandidate);

    expect(avif).toEqual([
      { path: '/_image', href: MAGENTO_IMAGE, width: '240', format: 'avif', descriptor: '240w' },
      { path: '/_image', href: MAGENTO_IMAGE, width: '480', format: 'avif', descriptor: '480w' },
    ]);
  });

  it('falls back to a single JPEG, at the widest preset width, on the <img> itself', () => {
    const image = responsiveImage(MAGENTO_IMAGE, preset);

    expect(parseCandidate(image.src)).toMatchObject({ width: '480', format: 'jpeg' });
  });

  it('passes the layout hint through unchanged', () => {
    expect(responsiveImage(MAGENTO_IMAGE, preset).sizes).toBe('50vw');
  });

  it('keeps a query string on the source URL intact', () => {
    const url = `${MAGENTO_IMAGE}?v=2&t=1`;
    const image = responsiveImage(url, preset);

    expect(parseCandidate(image.src).href).toBe(url);
  });
});
