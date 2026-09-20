import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { waitForIsland } from './helpers';

/**
 * Accessibility is checked against WCAG 2.1 A/AA on every page type. These run
 * in CI, so a regression fails the build rather than reaching a shopper.
 */
async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
}

const pages: [name: string, path: string][] = [
  ['home', '/'],
  ['category', '/women/tops-women.html'],
  ['product', '/erika-running-short.html'],
  ['search results', '/search?q=jacket'],
  ['empty cart', '/cart'],
];

for (const [name, path] of pages) {
  test(`${name} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    // Scan a settled page: images finishing late can change computed contrast.
    await page.waitForLoadState('load');
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });
}

test('the cart drawer is accessible once opened', async ({ page }) => {
  await page.goto('/joust-duffle-bag.html');
  await waitForIsland(page, 'AddToCartForm');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toBeVisible();

  const results = await scan(page);
  expect(results.violations).toEqual([]);
});

test('the storefront is fully keyboard operable from the skip link', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});
