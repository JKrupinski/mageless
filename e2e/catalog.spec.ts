import { expect, test } from '@playwright/test';

test.describe('catalogue browsing', () => {
  test('the home page lists categories and a merchandised row', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible();
    await expect(page.locator('article')).not.toHaveCount(0);
  });

  /*
   * The defect this replaced: every Category Landing rendered an empty grid with a
   * "no products matched" message and no route onward, because Magento's
   * GraphQL returns no products for a Category Landing and does not roll its
   * descendants up the way its own PHP storefront does.
   */
  test('a Category Landing offers a way down to a product listing', async ({ page }) => {
    await page.goto('/women.html');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Women');
    await expect(page.getByText('No products matched')).toHaveCount(0);

    // Reached from the page itself, not from the header menu.
    await page.getByRole('link', { name: /^Tops/ }).first().click();

    await expect(page).toHaveURL(/\/women\/tops-women\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tops');
    await expect(page.locator('article')).not.toHaveCount(0);
  });

  /*
   * Gear reports the same Display Mode as Women, and has 33 products assigned
   * to it directly. Honouring Display Mode strictly would hide them.
   */
  test('a Category Landing with products of its own shows both', async ({ page }) => {
    await page.goto('/gear.html');

    await expect(page.getByRole('heading', { name: 'Shop Gear' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Sort by' })).toBeVisible();
    await expect(page.locator('article')).not.toHaveCount(0);
  });

  test('a category page keeps the Magento URL and renders server-side', async ({ page }) => {
    const response = await page.goto('/women/tops-women.html');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tops');

    // The grid must be in the initial HTML, not painted by client JavaScript.
    const html = await response!.text();
    expect(html).toContain('<article');
  });

  test('facets filter the grid and stay in the URL', async ({ page }) => {
    await page.goto('/women/tops-women.html');

    const before = await page.locator('article').count();

    // Facet groups are collapsed until they hold an active value.
    // Match the group heading itself — the Pattern facet contains values like
    // "Color-Blocked", so filtering the whole group by text is ambiguous.
    await page
      .locator('summary')
      .filter({ hasText: /^Color/ })
      .click();
    await page
      .getByRole('link', { name: /^Green/ })
      .first()
      .click();

    await expect(page).toHaveURL(/color=/);
    await expect(page.locator('article').first()).toBeVisible();
    expect(await page.locator('article').count()).toBeLessThanOrEqual(before);

    await page.getByRole('link', { name: 'Clear all filters' }).click();
    await expect(page).not.toHaveURL(/color=/);
  });

  test('pagination moves through pages with real links', async ({ page }) => {
    await page.goto('/women/tops-women.html');

    await page
      .getByRole('navigation', { name: 'Pagination' })
      .getByRole('link', { name: '2' })
      .click();

    await expect(page).toHaveURL(/p=2/);
    await expect(
      page.getByRole('navigation', { name: 'Pagination' }).getByRole('link', { name: '2' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  /*
   * The unit tests pin down the markup; this is the only check that the image
   * endpoint really fetches from Magento and re-encodes, since a misconfigured
   * `image.domains` answers 403 and leaves every tile blank.
   */
  test('product tiles load re-encoded images from the image endpoint', async ({ page }) => {
    await page.goto('/gear/bags.html');

    const image = page.locator('article img').first();
    await expect(image).toHaveAttribute('fetchpriority', 'high');
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);

    // Chromium supports AVIF, so it must pick the first <source>.
    const chosen = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
    expect(chosen).toContain('/_image?');
    expect(chosen).toContain('f=avif');
  });

  test('an unknown URL returns a real 404', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist.html');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /could not find that page/i })).toBeVisible();
  });
});
