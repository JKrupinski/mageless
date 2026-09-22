import { expect, test } from '@playwright/test';
import { waitForIsland } from './helpers';

test.describe('product page and cart', () => {
  test('a configurable product requires options before it can be added', async ({ page }) => {
    await page.goto('/erika-running-short.html');
    await waitForIsland(page, 'AddToCartForm');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Erika Running Short');
    await expect(page.getByRole('button', { name: 'Select options' })).toBeDisabled();

    await page.getByRole('radio', { name: /Green/ }).first().check();
    await page.getByRole('radio', { name: '28', exact: true }).check();

    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });

  test('adding a product opens the drawer and updates the badge', async ({ page }) => {
    await page.goto('/erika-running-short.html');
    await waitForIsland(page, 'AddToCartForm');

    await page.getByRole('radio', { name: /Green/ }).first().check();
    await page.getByRole('radio', { name: '28', exact: true }).check();
    await page.getByRole('button', { name: 'Add to cart' }).click();

    const drawer = page.getByRole('dialog', { name: 'Shopping cart' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Erika Running Short')).toBeVisible();

    // The drawer must cover the viewport rather than be clipped to whatever
    // ancestor it happens to sit in: the header's `backdrop-filter` makes it a
    // containing block for fixed-position descendants, which is why the panel
    // is rendered into <body> through a portal.
    const panel = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(panel?.height ?? 0).toBeGreaterThan((viewport?.height ?? 0) * 0.9);
    expect(panel?.y ?? -1).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: /Open cart, \d+ items/ })).toBeVisible();

    // Escape closes the drawer and returns focus, per the dialog pattern.
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('the cart page survives a reload because the cart lives in a cookie', async ({ page }) => {
    await page.goto('/joust-duffle-bag.html');
    await waitForIsland(page, 'AddToCartForm');
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toBeVisible();

    await page.goto('/cart');
    await waitForIsland(page, 'CartLines');
    await expect(page.getByRole('link', { name: 'Joust Duffle Bag' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('link', { name: 'Joust Duffle Bag' })).toBeVisible();
  });

  test('quantities can be changed and lines removed', async ({ page }) => {
    await page.goto('/joust-duffle-bag.html');
    await waitForIsland(page, 'AddToCartForm');
    await page.getByRole('button', { name: 'Add to cart' }).click();
    // The drawer opening is the signal that the server round trip finished.
    await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toBeVisible();

    await page.goto('/cart');
    await waitForIsland(page, 'CartLines');

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByRole('button', { name: /Open cart, 2 items/ })).toBeVisible();

    await page.getByRole('button', { name: /Remove Joust Duffle Bag/ }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    // An empty state that offers no way out is a dead end, so the route back
    // is part of the contract, not decoration.
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
  });
});
