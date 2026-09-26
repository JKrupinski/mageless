import { describe, expect, it } from 'vitest';
import {
  IMAGE_PRESETS,
  type ImagePreset,
  isStorefrontImageQuery,
  responsiveImage,
} from '@lib/images';

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

describe('isStorefrontImageQuery', () => {
  function accepts(w: string, f: string, extra: Record<string, string> = {}) {
    return isStorefrontImageQuery(new URLSearchParams({ href: MAGENTO_IMAGE, w, f, ...extra }));
  }

  it('accepts every URL the storefront renders for its image slots', () => {
    const rendered = Object.values(IMAGE_PRESETS).flatMap((slot) => {
      const image = responsiveImage(MAGENTO_IMAGE, slot);
      const candidates = image.sources.flatMap((source) => source.srcSet.split(','));
      return [image.src, ...candidates].map(parseCandidate);
    });

    expect(rendered.length).toBeGreaterThan(0);
    for (const { width, format } of rendered) {
      expect(accepts(width!, format!), `${width} ${format}`).toBe(true);
    }
  });

  it('rejects a width no image slot uses', () => {
    expect(accepts('500', 'avif')).toBe(false);
    expect(accepts('0', 'avif')).toBe(false);
  });

  it('rejects a width that only matches a slot width once parsed', () => {
    for (const w of ['0240', '240.0', '240px', ' 240']) {
      expect(accepts(w, 'avif'), w).toBe(false);
    }
  });

  it('rejects a format the storefront never renders', () => {
    for (const f of ['png', 'svg', 'gif', 'jpg']) {
      expect(accepts('240', f), f).toBe(false);
    }
  });

  it('allows JPEG only as a slot fallback, at the widest width', () => {
    expect(accepts('960', 'jpeg')).toBe(true);
    expect(accepts('240', 'jpeg')).toBe(false);
  });

  it('rejects a quality override or any other transform parameter', () => {
    const extras: Record<string, string>[] = [
      { q: '100' },
      { h: '240' },
      { fit: 'cover' },
      { background: '#fff' },
    ];
    for (const extra of extras) {
      expect(accepts('240', 'avif', extra), JSON.stringify(extra)).toBe(false);
    }
  });

  it('rejects a query missing the source, width or format', () => {
    expect(isStorefrontImageQuery(new URLSearchParams({ w: '240', f: 'avif' }))).toBe(false);
    expect(accepts('240', 'avif', { href: '' })).toBe(false);
    expect(isStorefrontImageQuery(new URLSearchParams({ href: MAGENTO_IMAGE, f: 'avif' }))).toBe(
      false,
    );
    expect(isStorefrontImageQuery(new URLSearchParams({ href: MAGENTO_IMAGE, w: '240' }))).toBe(
      false,
    );
  });

  it('rejects a repeated parameter, whichever value the endpoint would read', () => {
    const params = new URLSearchParams({ href: MAGENTO_IMAGE, w: '240', f: 'avif' });
    params.append('w', '4000');

    expect(isStorefrontImageQuery(params)).toBe(false);
  });
});
