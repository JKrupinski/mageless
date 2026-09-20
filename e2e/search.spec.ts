import { expect, test } from '@playwright/test';
import { waitForIsland } from './helpers';

test.describe('search', () => {
  test('type-ahead suggests products and keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    await waitForIsland(page, 'SearchBox');

    const input = page.getByRole('combobox', { name: 'Search products' });
    await input.fill('jacket');

    const listbox = page.getByRole('listbox', { name: 'Search suggestions' });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option').first()).toBeVisible();

    await input.press('ArrowDown');
    await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  });

  test('submitting the form lands on a server-rendered results page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('combobox', { name: 'Search products' }).fill('jacket');
    await page.getByRole('combobox', { name: 'Search products' }).press('Enter');

    await expect(page).toHaveURL(/\/search\?q=jacket/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('jacket');
    await expect(page.locator('article')).not.toHaveCount(0);
  });

  test('a too-short term is rejected before a request is made', async ({ page }) => {
    await page.goto('/search?q=a');
    await expect(page.getByRole('alert')).toContainText('at least 2 characters');
  });
});
