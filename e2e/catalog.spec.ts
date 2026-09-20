import { expect, test } from '@playwright/test';

test.describe('catalogue browsing', () => {
  test('the home page lists categories and a merchandised row', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible();
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

  test('an unknown URL returns a real 404', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist.html');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /could not find that page/i })).toBeVisible();
  });
});
