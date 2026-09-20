/** Money as Magento returns it. */
export interface MoneyLike {
  value?: number | null;
  currency?: string | null;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Format a Magento `Money` value. Intl formatters are expensive to construct,
 * so they are memoised per locale/currency pair — this runs once per price on
 * every SSR render of a 24-tile grid.
 */
export function formatMoney(money: MoneyLike | null | undefined, locale = 'en-US'): string {
  if (!money || typeof money.value !== 'number') return '—';
  return formatterFor(money.currency ?? 'USD', locale).format(money.value);
}

/** Product detail URL, mirroring Magento's own rewrite (`url_key` + suffix). */
export function productUrl(product: {
  url_key?: string | null;
  url_suffix?: string | null;
}): string {
  return `/${product.url_key ?? ''}${product.url_suffix ?? ''}`;
}

/** Category URL, mirroring Magento's `url_path` + suffix. */
export function categoryUrl(category: {
  url_path?: string | null;
  url_suffix?: string | null;
}): string {
  return `/${category.url_path ?? ''}${category.url_suffix ?? ''}`;
}

/** Strip Magento's WYSIWYG markup down to plain text for meta descriptions. */
export function toPlainText(html: string | null | undefined, maxLength = 160): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/** Percentage off, rounded, or null when the product is not discounted. */
export function discountPercent(percentOff: number | null | undefined): number | null {
  if (typeof percentOff !== 'number' || percentOff < 1) return null;
  return Math.round(percentOff);
}

export function classNames(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}
